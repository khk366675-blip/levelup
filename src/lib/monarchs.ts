import type { BattleUnit, BattleStats, BattleActionDefinition } from './directBattleTypes'

export interface MonarchData {
  id: string
  rank: number             // 1~8 (낮을수록 강함)
  name: string
  theme: string
  recommendedCP: number
  concept: string
}

export const MONARCHS: MonarchData[] = [
  {
    id: 'grellic',
    rank: 8,
    name: '부패의 모왕 그렐릭',
    theme: '벌레 군단',
    recommendedCP: 15000,
    concept: '다수 소환 · 머릿수 압박'
  },
  {
    id: 'celaide',
    rank: 7,
    name: '빙결의 여군주 셀라이드',
    theme: '빙결',
    recommendedCP: 18000,
    concept: '행동 둔화 · 빙결 상태이상'
  },
  {
    id: 'igris',
    rank: 6,
    name: '백염의 군주 이그리스',
    theme: '화염',
    recommendedCP: 21000,
    concept: '지속 화염 장판 · 광역 폭발'
  },
  {
    id: 'dorga',
    rank: 5,
    name: '강철의 패왕 도르가',
    theme: '강철 / 방어',
    recommendedCP: 25000,
    concept: '초고방어 · 반격 · 약점 공략 요구'
  },
  {
    id: 'mirage',
    rank: 4,
    name: '환영의 군주 미라쥬',
    theme: '환영',
    recommendedCP: 29000,
    concept: '분신 생성 · 본체 식별 기믹'
  },
  {
    id: 'pesta',
    rank: 3,
    name: '역병의 대공 페스타',
    theme: '독 / 역병',
    recommendedCP: 33000,
    concept: '중첩 독 · 재생 봉쇄 · 장기전'
  },
  {
    id: 'belatus',
    rank: 2,
    name: '폭풍의 군주 벨라투스',
    theme: '폭풍 / 속도',
    recommendedCP: 38000,
    concept: '초고속 연타 · 즉사급 일격(그림자 탱킹 시험대)'
  },
  {
    id: 'nox',
    rank: 1,
    name: '공허의 절대자 녹스',
    theme: '공허 / 복합',
    recommendedCP: 43000,
    concept: '전 능력 복합 · 페이즈 전환'
  }
]

export const FINAL_ANGEL: MonarchData = {
  id: 'angel',
  rank: 0,
  name: '지고의 심판자',
  theme: '신성 / 광휘',
  recommendedCP: 50000,
  concept: '절대적 판정 · 종말의 광선'
}

export function buildMonarchBattleUnit(monarchId: string, recommendedCP: number): BattleUnit {
  const monarch = MONARCHS.find(m => m.id === monarchId) || (monarchId === 'angel' ? FINAL_ANGEL : null)
  const name = monarch?.name ?? monarchId
  const cp = recommendedCP

  const maxHp = Math.round(cp * 1.0 + 35000)
  const atk = Math.round(cp * 0.052 + 3000)
  const def = Math.round(cp * 0.04 + 200)
  const spd = Math.round(20 + cp * 0.0001)

  const stats: BattleStats = {
    maxHp,
    currentHp: maxHp,
    atk,
    def,
    spd,
    skillPower: Math.round(cp * 0.15),
    crit: 0.15,
    controlPower: Math.round(cp * 0.05),
    supportPower: Math.round(cp * 0.03),
    survivalPower: Math.round(cp * 0.04),
    bossPower: Math.round(cp * 0.05),
    synergyPower: Math.round(cp * 0.03),
  }

  const basicAttack: BattleActionDefinition = {
    actionId: `${monarchId}-basic-attack`,
    label: monarch ? `${monarch.theme} 타격` : '일반 공격',
    actionType: 'basic',
    targetType: 'single_enemy',
    effectKind: 'basic',
    basePriority: 0,
    cooldown: 0,
    actionCue: 'strike-boss',
    animationCue: 'strike-boss',
    effectColor: 'crimson',
  }

  const actionList: BattleActionDefinition[] = [basicAttack]

  // 군주별 고유 스킬 및 effects 3~4개 동적 주입 (directBattle 런타임 호환성 100% 보장)
  if (monarchId === 'grellic') {
    actionList.push(
      {
        actionId: 'grellic-decay',
        label: '부패의 오염 쐐기',
        actionType: 'skill',
        targetType: 'lowest_hp_enemy',
        effectKind: 'control',
        basePriority: 2,
        cooldown: 2,
        actionCue: 'boss-sweep',
        animationCue: 'boss-sweep',
        effectColor: 'green',
        masteryMultiplier: 1.6,
        effects: [
          { kind: 'stat', stat: 'def', value: -0.18, durationTurns: 2, target: 'enemy' },
          { kind: 'stat', stat: 'speed', value: -0.12, durationTurns: 2, target: 'enemy' }
        ]
      },
      {
        actionId: 'grellic-larvae',
        label: '부패의 유충 해일',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'damage',
        basePriority: 3,
        cooldown: 3,
        actionCue: 'poison-cloud',
        animationCue: 'boss-sweep',
        effectColor: 'green',
        masteryMultiplier: 1.4,
        effects: [
          { kind: 'stat', stat: 'atk', value: -0.10, durationTurns: 1, target: 'enemy' }
        ]
      },
      {
        actionId: 'grellic-swarm',
        label: '식인 곤충 떼 습격',
        actionType: 'skill',
        targetType: 'lowest_hp_enemy',
        effectKind: 'control',
        basePriority: 4,
        cooldown: 3,
        actionCue: 'blood-drain',
        animationCue: 'boss-sweep',
        effectColor: 'green',
        masteryMultiplier: 1.9,
      }
    )
  } else if (monarchId === 'celaide') {
    actionList.push(
      {
        actionId: 'celaide-chill',
        label: '여군주의 혹한 한기',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'stat_shift',
        basePriority: 2,
        cooldown: 2,
        actionCue: 'frost-breath',
        animationCue: 'boss-sweep',
        effectColor: 'cyan',
        effects: [
          { kind: 'stat', stat: 'speed', value: -0.16, durationTurns: 2, target: 'enemy' }
        ]
      },
      {
        actionId: 'celaide-frostbite',
        label: '동상 관통 격타',
        actionType: 'skill',
        targetType: 'highest_threat_enemy',
        effectKind: 'damage',
        basePriority: 3,
        cooldown: 2,
        actionCue: 'ice-spike',
        animationCue: 'boss-sweep',
        effectColor: 'cyan',
        masteryMultiplier: 2.1,
        defenseIgnore: 0.25,
      },
      {
        actionId: 'celaide-blizzard',
        label: '절대영도 블리자드',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'control',
        basePriority: 4,
        cooldown: 4,
        actionCue: 'blizzard',
        animationCue: 'boss-sweep',
        effectColor: 'cyan',
        masteryMultiplier: 1.8,
        effects: [
          { kind: 'stat', stat: 'speed', value: -0.22, durationTurns: 2, target: 'enemy' }
        ]
      }
    )
  } else if (monarchId === 'igris') {
    actionList.push(
      {
        actionId: 'igris-cinder',
        label: '백염의 침식 열기',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'stat_shift',
        basePriority: 2,
        cooldown: 2,
        actionCue: 'fire-ground',
        animationCue: 'boss-sweep',
        effectColor: 'orange',
        effects: [
          { kind: 'stat', stat: 'def', value: -0.15, durationTurns: 2, target: 'enemy' }
        ]
      },
      {
        actionId: 'igris-combust',
        label: '백염 대폭발',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'damage',
        basePriority: 4,
        cooldown: 3,
        actionCue: 'fire-blast',
        animationCue: 'boss-sweep',
        effectColor: 'orange',
        masteryMultiplier: 2.0,
      },
      {
        actionId: 'igris-concept-strike',
        label: '백염 극렬 참격',
        actionType: 'skill',
        targetType: 'highest_threat_enemy',
        effectKind: 'damage',
        basePriority: 3,
        cooldown: 2,
        actionCue: 'sword-slash',
        animationCue: 'strike-boss',
        effectColor: 'orange',
        masteryMultiplier: 1.9,
      }
    )
  } else if (monarchId === 'dorga') {
    actionList.push(
      {
        actionId: 'dorga-fortress',
        label: '강철 패왕의 철벽 요새',
        actionType: 'guard',
        targetType: 'self',
        effectKind: 'guard',
        basePriority: 4,
        cooldown: 3,
        actionCue: 'shield-fortress',
        animationCue: 'boss-sweep',
        effectColor: 'stone',
        effects: [
          { kind: 'damage_reduction', value: 0.45, durationTurns: 2, target: 'self' }
        ]
      },
      {
        actionId: 'dorga-iron-charge',
        label: '무쇠 기동 대격돌',
        actionType: 'skill',
        targetType: 'lowest_hp_enemy',
        effectKind: 'damage',
        basePriority: 3,
        cooldown: 3,
        actionCue: 'shield-bash',
        animationCue: 'boss-sweep',
        effectColor: 'stone',
        masteryMultiplier: 2.4,
      },
      {
        actionId: 'dorga-concept-strike',
        label: '무쇠 철가시 격타',
        actionType: 'skill',
        targetType: 'front_lane',
        effectKind: 'control',
        basePriority: 2,
        cooldown: 1,
        actionCue: 'hammer-smash',
        animationCue: 'strike-boss',
        effectColor: 'stone',
        masteryMultiplier: 1.7,
      }
    )
  } else if (monarchId === 'mirage') {
    actionList.push(
      {
        actionId: 'mirage-blur',
        label: '신기루 왜곡 경계',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'stat_shift',
        basePriority: 3,
        cooldown: 3,
        actionCue: 'fog-mirror',
        animationCue: 'boss-sweep',
        effectColor: 'violet',
        effects: [
          { kind: 'stat', stat: 'accuracy', value: -0.22, durationTurns: 2, target: 'enemy' }
        ]
      },
      {
        actionId: 'mirage-strike',
        label: '환영 지옥 대란무',
        actionType: 'skill',
        targetType: 'lowest_hp_enemy',
        effectKind: 'damage',
        basePriority: 4,
        cooldown: 3,
        actionCue: 'shadow-multi',
        animationCue: 'boss-sweep',
        effectColor: 'violet',
        masteryMultiplier: 2.2,
      },
      {
        actionId: 'mirage-concept-strike',
        label: '신기루 자객 급습',
        actionType: 'skill',
        targetType: 'single_enemy',
        effectKind: 'control',
        basePriority: 2,
        cooldown: 1,
        actionCue: 'mirror-stab',
        animationCue: 'strike-boss',
        effectColor: 'violet',
        masteryMultiplier: 1.7,
      }
    )
  } else if (monarchId === 'pesta') {
    actionList.push(
      {
        actionId: 'pesta-rot',
        label: '역병 포자 오염',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'stat_shift',
        basePriority: 2,
        cooldown: 3,
        actionCue: 'spore-burst',
        animationCue: 'boss-sweep',
        effectColor: 'purple',
        effects: [
          { kind: 'stat', stat: 'atk', value: -0.15, durationTurns: 2, target: 'enemy' },
          { kind: 'stat', stat: 'def', value: -0.15, durationTurns: 2, target: 'enemy' }
        ]
      },
      {
        actionId: 'pesta-reap',
        label: '역병 죽음의 수확',
        actionType: 'skill',
        targetType: 'lowest_hp_enemy',
        effectKind: 'control',
        basePriority: 4,
        cooldown: 3,
        actionCue: 'death-scythe',
        animationCue: 'boss-sweep',
        effectColor: 'purple',
        masteryMultiplier: 2.3,
      },
      {
        actionId: 'pesta-concept-strike',
        label: '고름 오염 분출',
        actionType: 'skill',
        targetType: 'highest_threat_enemy',
        effectKind: 'damage',
        basePriority: 3,
        cooldown: 2,
        actionCue: 'slime-spew',
        animationCue: 'strike-boss',
        effectColor: 'purple',
        masteryMultiplier: 1.8,
      }
    )
  } else if (monarchId === 'belatus') {
    actionList.push(
      {
        actionId: 'belatus-gale',
        label: '가속의 광풍 영역',
        actionType: 'support',
        targetType: 'self',
        effectKind: 'stat_shift',
        basePriority: 3,
        cooldown: 3,
        actionCue: 'gale-armor',
        animationCue: 'boss-sweep',
        effectColor: 'emerald',
        effects: [
          { kind: 'stat', stat: 'speed', value: 0.35, durationTurns: 2, target: 'self' },
          { kind: 'stat', stat: 'atk', value: 0.22, durationTurns: 2, target: 'self' }
        ]
      },
      {
        actionId: 'belatus-typhoon',
        label: '극렬 폭풍 대난무',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'damage',
        basePriority: 4,
        cooldown: 3,
        actionCue: 'wind-blade',
        animationCue: 'boss-sweep',
        effectColor: 'emerald',
        masteryMultiplier: 2.6,
      },
      {
        actionId: 'belatus-concept-strike',
        label: '질풍 초고속 살격',
        actionType: 'skill',
        targetType: 'highest_threat_enemy',
        effectKind: 'control',
        basePriority: 2,
        cooldown: 2,
        actionCue: 'dash-cut',
        animationCue: 'strike-boss',
        effectColor: 'emerald',
        masteryMultiplier: 2.0,
      }
    )
  } else if (monarchId === 'nox') {
    actionList.push(
      {
        actionId: 'nox-collapse',
        label: '절대적 공허 침식',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'stat_shift',
        basePriority: 2,
        cooldown: 3,
        actionCue: 'void-drain',
        animationCue: 'boss-sweep',
        effectColor: 'black',
        effects: [
          { kind: 'stat', stat: 'atk', value: -0.20, durationTurns: 2, target: 'enemy' },
          { kind: 'stat', stat: 'def', value: -0.20, durationTurns: 2, target: 'enemy' }
        ]
      },
      {
        actionId: 'nox-gravity',
        label: '공허 중력 왜곡 붕괴',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'control',
        basePriority: 3,
        cooldown: 3,
        actionCue: 'blackhole',
        animationCue: 'boss-sweep',
        effectColor: 'black',
        masteryMultiplier: 2.0,
        effects: [
          { kind: 'stat', stat: 'speed', value: -0.15, durationTurns: 2, target: 'enemy' }
        ]
      },
      {
        actionId: 'nox-singularity',
        label: '종말의 공허 특이점',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'damage',
        basePriority: 4,
        cooldown: 5,
        actionCue: 'void-collapse',
        animationCue: 'boss-sweep',
        effectColor: 'black',
        masteryMultiplier: 2.8,
      },
      {
        actionId: 'nox-concept-strike',
        label: '공허 가혹 참격',
        actionType: 'skill',
        targetType: 'lowest_hp_enemy',
        effectKind: 'control',
        basePriority: 2,
        cooldown: 2,
        actionCue: 'void-slash',
        animationCue: 'strike-boss',
        effectColor: 'black',
        masteryMultiplier: 2.1,
      }
    )
  } else if (monarchId === 'angel') {
    actionList.push(
      {
        actionId: 'angel-decree',
        label: '지고의 단죄 선포',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'stat_shift',
        basePriority: 2,
        cooldown: 3,
        actionCue: 'divine-shout',
        animationCue: 'boss-sweep',
        effectColor: 'yellow',
        effects: [
          { kind: 'stat', stat: 'def', value: -0.25, durationTurns: 2, target: 'enemy' },
          { kind: 'stat', stat: 'speed', value: -0.15, durationTurns: 2, target: 'enemy' }
        ]
      },
      {
        actionId: 'angel-concept-strike',
        label: '신성 지고 심판',
        actionType: 'skill',
        targetType: 'highest_threat_enemy',
        effectKind: 'control',
        basePriority: 3,
        cooldown: 2,
        actionCue: 'sword-light',
        animationCue: 'strike-boss',
        effectColor: 'yellow',
        masteryMultiplier: 2.2,
      },
      {
        actionId: 'angel-ray',
        label: '단죄: 종말의 심판 광선',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'damage',
        basePriority: 4,
        cooldown: 4,
        actionCue: 'holy-beam',
        animationCue: 'boss-sweep',
        effectColor: 'yellow',
        masteryMultiplier: 3.0,
      }
    )
  } else {
    // Fallback if no specific match
    actionList.push({
      actionId: `${monarchId}-concept-strike`,
      label: monarch ? `${monarch.theme} 강타` : '권능 강타',
      actionType: 'skill',
      targetType: 'single_enemy',
      effectKind: 'basic',
      basePriority: 2,
      cooldown: 3,
      actionCue: 'boss-sweep',
      animationCue: 'boss-sweep',
      effectColor: 'crimson',
      masteryMultiplier: 1.8,
    })
  }

  const unit: BattleUnit = {
    unitId: `monarch-${monarchId}`,
    sourceId: monarchId,
    unitType: 'boss',
    displayName: name,
    role: 'boss',
    team: 'enemy',
    level: 100,
    stats,
    statusEffects: [],
    cooldowns: {},
    actionList,
    passiveList: [],
    actionPriority: 5,
    boardLane: 'boss',
    actionCue: 'boss-sweep',
    animationCue: 'strike-boss',
    effectColor: 'crimson',
    metadata: {
      source: 'mock_monster',
      hiddenSafe: true,
      tags: ['boss', 'monarch'],
    },
    monsterPatternState: {
      patternId: `${monarchId}-pattern`,
      stepIndex: 0,
    }
  }

  return unit
}
