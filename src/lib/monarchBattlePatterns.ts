import type { BattleActionDefinition, BattleUnit, DirectBattleState, TelegraphSeverity } from './directBattleTypes'

export interface MonarchTelegraphResult {
  action: BattleActionDefinition
  telegraphName: string
  telegraphText: string
  severity: TelegraphSeverity
  targetRule: string
}

// 군주 고유 행동 매핑 및 인텔리전트 AI 사이클 결정기
export function resolveMonarchBossAction(
  unit: BattleUnit,
  stepIndex: number,
  state: DirectBattleState
): MonarchTelegraphResult {
  const hpPct = unit.stats.currentHp / unit.stats.maxHp
  const monarchId = unit.sourceId // 'grellic', 'celaide', etc.
  
  // 헌터 파티 내에 협력 헌터(Named 헌터 등)가 살아있는지 검사
  const aliveHunterAllies = state.units.filter(u => u.team === 'player' && u.unitType === 'hunter' && u.stats.currentHp > 0)
  const isCoopActive = state.units.some(u => u.team === 'player' && u.metadata?.tags?.includes('coop_helper') && u.stats.currentHp > 0)

  const basic = unit.actionList.find(a => a.actionType === 'basic') ?? unit.actionList[0]
  
  // 1. 부패의 모왕 그렐릭 (다수 소환 · 머릿수 압박)
  // Phase 1 (HP > 60%): 3턴 주기 - 부패의 쐐기(1턴) -> 평타(2턴) -> 유충 해일(3턴)
  // Phase 2 (HP <= 60%): 3턴 주기 - 유충 해일(1턴) -> 식인 곤충 떼(2턴) -> 평타(3턴)
  if (monarchId === 'grellic') {
    const isPhase2 = hpPct <= 0.60
    const cycleStep = stepIndex % 3

    if (isPhase2) {
      if (cycleStep === 0) {
        const skill = unit.actionList.find(a => a.actionId === 'grellic-larvae') ?? basic
        return {
          action: skill,
          telegraphName: '부패의 유충 해일 🐛',
          telegraphText: '군주의 껍질 틈새에서 수천 마리의 부패성 유충이 꼼지락거리며 쏟아지기 시작합니다.',
          severity: 'high',
          targetRule: 'all_enemies',
        }
      }
      if (cycleStep === 1) {
        const skill = unit.actionList.find(a => a.actionId === 'grellic-swarm') ?? basic
        return {
          action: skill,
          telegraphName: '식인 곤충 떼 습격 🦟',
          telegraphText: '하늘을 뒤덮는 검은 날벌레 떼가 피 비린내를 맡고 가장 지친 전열을 조준합니다.',
          severity: 'high',
          targetRule: 'lowestHpPercent',
        }
      }
    } else {
      if (cycleStep === 0) {
        const skill = unit.actionList.find(a => a.actionId === 'grellic-decay') ?? basic
        return {
          action: skill,
          telegraphName: '부패의 오염 쐐기 🧪',
          telegraphText: '탁한 독을 가득 머금은 가시가 가장 강력한 그림자 방어선을 향해 발사될 준비를 마칩니다.',
          severity: 'medium',
          targetRule: 'shadowPreferred',
        }
      }
      if (cycleStep === 2) {
        const skill = unit.actionList.find(a => a.actionId === 'grellic-larvae') ?? basic
        return {
          action: skill,
          telegraphName: '유충 해일 🐛',
          telegraphText: '꿈틀거리는 역겨운 점액이 전장 구석구석을 채우기 위해 퍼져나갑니다.',
          severity: 'medium',
          targetRule: 'all_enemies',
        }
      }
    }
  }

  // 2. 빙결의 여군주 셀라이드 (행동 둔화 · 빙결 상태이상)
  // Phase 1 (HP > 50%): 3턴 주기 - 한기 방출(1턴) -> 평타(2턴) -> 한기 격타(3턴)
  // Phase 2 (HP <= 50%): 3턴 주기 - 절대 영도(1턴) -> 한기 방출(2턴) -> 평타(3턴)
  if (monarchId === 'celaide') {
    const isPhase2 = hpPct <= 0.50
    const cycleStep = stepIndex % 3

    if (isPhase2) {
      if (cycleStep === 0) {
        const skill = unit.actionList.find(a => a.actionId === 'celaide-blizzard') ?? basic
        return {
          action: skill,
          telegraphName: '절대영도 블리자드 ❄️',
          telegraphText: '발밑의 서리가 극도로 날카롭게 일렁이며 모든 관절과 신경을 완전히 얼려버리려 합니다.',
          severity: 'high',
          targetRule: 'all_enemies',
        }
      }
      if (cycleStep === 1) {
        const skill = unit.actionList.find(a => a.actionId === 'celaide-chill') ?? basic
        return {
          action: skill,
          telegraphName: '여군주의 혹한 한기 🌬️',
          telegraphText: '서늘한 빙결 기류가 전장의 모든 방어태세를 흔들며 휘몰아치기 시작합니다.',
          severity: 'medium',
          targetRule: 'all_enemies',
        }
      }
    } else {
      if (cycleStep === 0) {
        const skill = unit.actionList.find(a => a.actionId === 'celaide-chill') ?? basic
        return {
          action: skill,
          telegraphName: '한기 방출 🌬️',
          telegraphText: '얼어붙은 대기의 조각들이 마력 흐름을 차단하듯 둥글게 소용돌이칩니다.',
          severity: 'medium',
          targetRule: 'all_enemies',
        }
      }
      if (cycleStep === 2) {
        const skill = unit.actionList.find(a => a.actionId === 'celaide-frostbite') ?? basic
        return {
          action: skill,
          telegraphName: '동상 관통 격타 💥',
          telegraphText: '극저온으로 냉각된 얼음 송곳이 가장 신속한 전술 요원을 겨냥합니다.',
          severity: 'medium',
          targetRule: 'highestThreat',
        }
      }
    }
  }

  // 3. 백염의 군주 이그리스 (지속 화염 장판 · 광역 폭발)
  // Phase 1 (HP > 60%): 3턴 주기 - 백염의 열기(1턴) -> 평타(2턴) -> 백염 참격(3턴)
  // Phase 2 (HP <= 60%): 3턴 주기 - 백염 대폭발(1턴) -> 백염 참격(2턴) -> 평타(3턴)
  if (monarchId === 'igris') {
    const isPhase2 = hpPct <= 0.60
    const cycleStep = stepIndex % 3

    if (isPhase2) {
      if (cycleStep === 0) {
        const skill = unit.actionList.find(a => a.actionId === 'igris-combust') ?? basic
        return {
          action: skill,
          telegraphName: '백염 대폭발 🔥',
          telegraphText: '대검 날에 피어오르는 순백의 불꽃이 전장의 공기를 전부 삼키고 일제히 폭발할 준비를 합니다.',
          severity: 'high',
          targetRule: 'all_enemies',
        }
      }
      if (cycleStep === 1) {
        const skill = unit.actionList.find(a => a.actionId === 'igris-concept-strike') ?? basic
        return {
          action: skill,
          telegraphName: '백염 극렬 연참 ⚔️',
          telegraphText: '끓어오르는 열기와 검은 화염이 겹쳐지며 전장 가장 깊은 곳을 난도질하려 좁혀옵니다.',
          severity: 'high',
          targetRule: 'highestThreat',
        }
      }
    } else {
      if (cycleStep === 0) {
        const skill = unit.actionList.find(a => a.actionId === 'igris-cinder') ?? basic
        return {
          action: skill,
          telegraphName: '백염의 침식 열기 🌋',
          telegraphText: '대지에 균열이 벌어지며 백색 화염의 열풍이 서서히 번져 전열의 체력을 소모시킵니다.',
          severity: 'medium',
          targetRule: 'all_enemies',
        }
      }
      if (cycleStep === 2) {
        const skill = unit.actionList.find(a => a.actionId === 'igris-concept-strike') ?? basic
        return {
          action: skill,
          telegraphName: '백염 참격 ⚔️',
          telegraphText: '불타는 불길한 기류가 본체의 방벽을 직접 가르고자 기동합니다.',
          severity: 'medium',
          targetRule: 'frontline',
        }
      }
    }
  }

  // 4. 강철의 패왕 도르가 (초고방어 · 반격 · 약점 공략)
  // Phase 1 (HP > 60%): 3턴 주기 - 무쇠 가드(1턴) -> 평타(2턴) -> 무쇠 타격(3턴)
  // Phase 2 (HP <= 60%): 3턴 주기 - 무쇠 가드(1턴) -> 철 패왕 기동격돌(2턴) -> 평타(3턴)
  if (monarchId === 'dorga') {
    const isPhase2 = hpPct <= 0.60
    const cycleStep = stepIndex % 3

    if (cycleStep === 0) {
      const skill = unit.actionList.find(a => a.actionId === 'dorga-fortress') ?? basic
      return {
        action: skill,
        telegraphName: '강철 패왕의 철벽 🛡️',
        telegraphText: '군주의 몸체가 기괴한 무쇠 철갑으로 감싸이며 모든 공격을 튕겨낼 듯한 오라를 뿜습니다.',
        severity: 'high',
        targetRule: 'self',
      }
    }
    if (isPhase2 && cycleStep === 1) {
      const skill = unit.actionList.find(a => a.actionId === 'dorga-iron-charge') ?? basic
      return {
        action: skill,
        telegraphName: '무쇠 기동 대격돌 💥',
        telegraphText: '초고강도 강철의 거구가 엄청난 무게로 가속하며 전술 본대를 짓이기고자 돌진합니다.',
        severity: 'high',
        targetRule: 'lowestHpPercent',
      }
    }
    if (!isPhase2 && cycleStep === 2) {
      const skill = unit.actionList.find(a => a.actionId === 'dorga-concept-strike') ?? basic
      return {
        action: skill,
        telegraphName: '무쇠 철가시 격타 🔨',
        telegraphText: '두꺼운 강철 철퇴가 허공을 가르며 전장의 수호 기믹을 부수려 합니다.',
        severity: 'medium',
        targetRule: 'frontline',
      }
    }
  }

  // 5. 환영의 군주 미라쥬 (분신 생성 · 본체 식별 기믹)
  // Phase 1 (HP > 50%): 3턴 주기 - 신기루 환영(1턴) -> 평타(2턴) -> 환영 살격(3턴)
  // Phase 2 (HP <= 50%): 3턴 주기 - 신기루 환영(1턴) -> 환영 대란무(2턴) -> 평타(3턴)
  if (monarchId === 'mirage') {
    const isPhase2 = hpPct <= 0.50
    const cycleStep = stepIndex % 3

    if (cycleStep === 0) {
      const skill = unit.actionList.find(a => a.actionId === 'mirage-blur') ?? basic
      return {
        action: skill,
        telegraphName: '신기루 왜곡 경계 🌀',
        telegraphText: '일렁이는 안개 속에서 군주의 형상이 여러 갈래로 어지럽게 뒤틀려 조준을 방해합니다.',
        severity: 'high',
        targetRule: 'all_enemies',
      }
    }
    if (isPhase2 && cycleStep === 1) {
      const skill = unit.actionList.find(a => a.actionId === 'mirage-strike') ?? basic
      return {
        action: skill,
        telegraphName: '환영 지옥 대란무 💀',
        telegraphText: '전방에 수없이 분열된 환영 자객들이 나타나 그림자 기지의 사각지대를 동시다발적으로 습격합니다.',
        severity: 'high',
        targetRule: 'shadowPreferred',
      }
    }
    if (!isPhase2 && cycleStep === 2) {
      const skill = unit.actionList.find(a => a.actionId === 'mirage-concept-strike') ?? basic
      return {
        action: skill,
        telegraphName: '신기루 기습 찌르기 🗡️',
        telegraphText: '눈을 교란하는 그림자가 가장 체력이 약해진 대상의 뒤편에서 모습을 드러냅니다.',
        severity: 'medium',
        targetRule: 'lowestHpPercent',
      }
    }
  }

  // 6. 역병의 대공 페스타 (중첩 독 · 재생 봉쇄 · 장기전)
  // Phase 1 (HP > 50%): 3턴 주기 - 역병 전염(1턴) -> 평타(2턴) -> 고름 분출(3턴)
  // Phase 2 (HP <= 50%): 3턴 주기 - 역병 전염(1턴) -> 부패 수확(2턴) -> 평타(3턴)
  if (monarchId === 'pesta') {
    const isPhase2 = hpPct <= 0.50
    const cycleStep = stepIndex % 3

    if (cycleStep === 0) {
      const skill = unit.actionList.find(a => a.actionId === 'pesta-rot') ?? basic
      return {
        action: skill,
        telegraphName: '역병 포자 전염 🧪',
        telegraphText: '생명력을 갉아먹는 자줏빛 균사와 오염 포자가 전방으로 흩날리며 힐러의 힘을 차단하려 합니다.',
        severity: 'high',
        targetRule: 'all_enemies',
      }
    }
    if (isPhase2 && cycleStep === 1) {
      const skill = unit.actionList.find(a => a.actionId === 'pesta-reap') ?? basic
      return {
        action: skill,
        telegraphName: '역병 죽음의 수확 💀',
        telegraphText: '군주가 거대한 낫의 형상 마력을 이끌며 전장의 썩어가는 상처들을 수확하기 위해 휩씁니다.',
        severity: 'high',
        targetRule: 'lowestHpPercent',
      }
    }
    if (!isPhase2 && cycleStep === 2) {
      const skill = unit.actionList.find(a => a.actionId === 'pesta-concept-strike') ?? basic
      return {
        action: skill,
        telegraphName: '고름 오염 분출 ☣️',
        telegraphText: '위협 수치가 가장 높은 표식을 감지한 액체가 지면에 뿜어져 나옵니다.',
        severity: 'medium',
        targetRule: 'highestThreat',
      }
    }
  }

  // 7. 폭풍의 군주 벨라투스 (초고속 연타 · 즉사급 일격)
  // Phase 1 (HP > 50%): 3턴 주기 - 가속 풍압(1턴) -> 평타(2턴) -> 질풍 급습(3턴)
  // Phase 2 (HP <= 50%): 3턴 주기 - 가속 풍압(1턴) -> 폭풍 난무(2턴) -> 평타(3턴)
  if (monarchId === 'belatus') {
    const isPhase2 = hpPct <= 0.50
    const cycleStep = stepIndex % 3

    if (cycleStep === 0) {
      const skill = unit.actionList.find(a => a.actionId === 'belatus-gale') ?? basic
      return {
        action: skill,
        telegraphName: '가속의 광풍 영역 🌪️',
        telegraphText: '군주의 전신에서 무서운 마력 기류가 회전하며 신체의 모든 반사 속도를 극에 달하게 합니다.',
        severity: 'high',
        targetRule: 'self',
      }
    }
    if (isPhase2 && cycleStep === 1) {
      const skill = unit.actionList.find(a => a.actionId === 'belatus-typhoon') ?? basic
      // 그림자 장벽 연동을 위한 극렬 난무
      return {
        action: skill,
        telegraphName: '극렬 폭풍 대난무 ⚔️',
        telegraphText: '폭풍을 머금은 장검이 공간을 수없이 조각내며 그림자 전열을 통째로 분쇄할 폭풍 칼날을 날립니다.',
        severity: 'lethal',
        targetRule: 'shadowPreferred',
      }
    }
    if (!isPhase2 && cycleStep === 2) {
      const skill = unit.actionList.find(a => a.actionId === 'belatus-concept-strike') ?? basic
      return {
        action: skill,
        telegraphName: '질풍 초고속 살격 💥',
        telegraphText: '눈 깜짝할 사이에 공간을 가로질러 아군 지휘부를 직접 베어넘기려 강습합니다.',
        severity: 'high',
        targetRule: 'highestThreat',
      }
    }
  }

  // 8. 공허의 절대자 녹스 (전 능력 복합 · 페이즈 전환) - 최상위 군주 3페이즈
  // Phase 1 (HP > 70%): 3턴 주기 - 공허 침식(1턴) -> 평타(2턴) -> 공허 구체(3턴)
  // Phase 2 (HP 30%~70%): 3턴 주기 - 중력 왜곡(1턴) -> 평타(2턴) -> 공허 구체(3턴)
  // Phase 3 (HP < 30%): 3턴 주기 - 공허 특이점(1턴) -> 평타(2턴) -> 중력 왜곡(3턴)
  if (monarchId === 'nox') {
    const phase = hpPct < 0.3 ? 3 : hpPct < 0.7 ? 2 : 1
    const cycleStep = stepIndex % 3

    if (phase === 3) {
      if (cycleStep === 0) {
        const skill = unit.actionList.find(a => a.actionId === 'nox-singularity') ?? basic
        return {
          action: skill,
          telegraphName: '종말의 공허 특이점 🪐',
          telegraphText: '무저갱의 어둠이 전장 전체를 집어삼키며, 전원의 생명력을 붕괴시키는 소멸 구체를 점화합니다. (협력 헌터 엄호 필수)',
          severity: 'lethal',
          targetRule: 'all_enemies',
        }
      }
      if (cycleStep === 2) {
        const skill = unit.actionList.find(a => a.actionId === 'nox-gravity') ?? basic
        return {
          action: skill,
          telegraphName: '중력 왜곡 붕괴 🌌',
          telegraphText: '대지 중력이 기괴하게 역전되어 단단히 버티고 선 수호 체계 전원을 짓누릅니다.',
          severity: 'high',
          targetRule: 'all_enemies',
        }
      }
    } else if (phase === 2) {
      if (cycleStep === 0) {
        const skill = unit.actionList.find(a => a.actionId === 'nox-gravity') ?? basic
        return {
          action: skill,
          telegraphName: '공허 중력 뒤틀림 🌌',
          telegraphText: '공간 압축으로 그림자 전열의 장벽과 엄호를 강제로 튕겨내고 본체를 타겟팅하려 기동합니다.',
          severity: 'high',
          targetRule: 'highestThreat',
        }
      }
      if (cycleStep === 2) {
        const skill = unit.actionList.find(a => a.actionId === 'nox-concept-strike') ?? basic
        return {
          action: skill,
          telegraphName: '공허 정밀 타격 💥',
          telegraphText: '단 한 틈의 방벽 조각조차 남기지 않으려 가장 취약한 대상을 침식합니다.',
          severity: 'medium',
          targetRule: 'lowestHpPercent',
        }
      }
    } else {
      if (cycleStep === 0) {
        const skill = unit.actionList.find(a => a.actionId === 'nox-collapse') ?? basic
        return {
          action: skill,
          telegraphName: '절대적 공허 침식 🌀',
          telegraphText: '물리적인 한계선을 갉아먹는 침식 기류가 전장의 모든 아군의 무기 마력을 억압합니다.',
          severity: 'high',
          targetRule: 'all_enemies',
        }
      }
      if (cycleStep === 2) {
        const skill = unit.actionList.find(a => a.actionId === 'nox-concept-strike') ?? basic
        return {
          action: skill,
          telegraphName: '공허 압박 구체 🪐',
          telegraphText: '가볍게 소용돌이치는 칠흑의 마력 탄환이 전열의 탱커 라인을 조준합니다.',
          severity: 'medium',
          targetRule: 'frontline',
        }
      }
    }
  }

  // 9. 지고의 심판자 (신성 · 광휘) - 최종 문지기 3페이즈
  // Phase 1 (HP > 70%): 지고의 선포(1턴) -> 평타(2턴) -> 지고 심판(3턴)
  // Phase 2 (HP 40%~70%): 지고 심판(1턴) -> 광휘 정화(2턴) -> 평타(3턴)
  // Phase 3 (HP < 40%): 종말의 광선(1턴) -> 지고의 선포(2턴) -> 평타(3턴)
  if (monarchId === 'angel') {
    const phase = hpPct < 0.4 ? 3 : hpPct < 0.7 ? 2 : 1
    const cycleStep = stepIndex % 3

    if (phase === 3) {
      if (cycleStep === 0) {
        const skill = unit.actionList.find(a => a.actionId === 'angel-ray') ?? basic
        return {
          action: skill,
          telegraphName: '단죄: 종말의 심판 광선 ☄️',
          telegraphText: '하늘의 장벽이 황금빛 기둥으로 열리며 전장의 모든 부정한 것들을 단번에 소멸시키려 가릅니다.',
          severity: 'lethal',
          targetRule: 'all_enemies',
        }
      }
      if (cycleStep === 1) {
        const skill = unit.actionList.find(a => a.actionId === 'angel-decree') ?? basic
        return {
          action: skill,
          telegraphName: '지고의 선포 🕊️',
          telegraphText: '거룩한 종소리가 울리며 플레이어가 활성화한 모든 수호막과 영약을 무력으로 해제합니다.',
          severity: 'high',
          targetRule: 'all_enemies',
        }
      }
    } else if (phase === 2) {
      if (cycleStep === 0) {
        const skill = unit.actionList.find(a => a.actionId === 'angel-concept-strike') ?? basic
        return {
          action: skill,
          telegraphName: '신성 지고 심판 ⚔️',
          telegraphText: '찬란한 광휘가 깃든 대검이 가장 공격적인 전술 기획 부서를 정확히 갈라버리기 위해 웅웅거립니다.',
          severity: 'high',
          targetRule: 'highestThreat',
        }
      }
      if (cycleStep === 1) {
        const skill = unit.actionList.find(a => a.actionId === 'angel-decree') ?? basic
        return {
          action: skill,
          telegraphName: '지고의 선포 🕊️',
          telegraphText: '신성 주파수가 기립하여 전장 방어선의 가드를 뒤흔들려 합니다.',
          severity: 'medium',
          targetRule: 'all_enemies',
        }
      }
    } else {
      if (cycleStep === 0) {
        const skill = unit.actionList.find(a => a.actionId === 'angel-decree') ?? basic
        return {
          action: skill,
          telegraphName: '지고의 선포 🕊️',
          telegraphText: '빛의 권능이 전장에 고요히 퍼지며, 부정한 그림자들의 공격 마력을 일부 단죄합니다.',
          severity: 'medium',
          targetRule: 'all_enemies',
        }
      }
      if (cycleStep === 2) {
        const skill = unit.actionList.find(a => a.actionId === 'angel-concept-strike') ?? basic
        return {
          action: skill,
          telegraphName: '심판 ⚔️',
          telegraphText: '성스러운 기운이 가장 기동성이 둔해진 전열을 응징합니다.',
          severity: 'medium',
          targetRule: 'lowestHpPercent',
        }
      }
    }
  }

  // Fallback (그 외 일반 몬스터의 보스 턴 혹은 비상 우회로)
  const skillA = unit.actionList.find(a => a.actionType === 'skill') ?? basic
  return {
    action: (stepIndex % 3 === 1) ? skillA : basic,
    telegraphName: (stepIndex % 3 === 1) ? '권능 폭발 💥' : '일반 타격',
    telegraphText: (stepIndex % 3 === 1) ? '위협적인 무거운 보스 강타 공격 예정' : '가벼운 기본 물리 참격 예정',
    severity: (stepIndex % 3 === 1) ? 'high' : 'medium',
    targetRule: 'random',
  }
}
