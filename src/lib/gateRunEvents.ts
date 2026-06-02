import { GateRunEncounterType, GateRunEventChoice, GateRunRewardBundle, GateReward, GateRunState, GateRunEncounter, GateRank, RedGateState, HunterGradeTier, GateDefinition } from './types'
import { GATE_DEFINITIONS, MONSTER_DEFINITIONS } from './seed'
import { PROMOTION_EXAM_DEFINITIONS } from './promotionExams'
import { MONARCHS, FINAL_ANGEL } from './monarchs'
import { getRegionalTheme } from './livingWorldGateContent'
import { getWorldGateEventPack, REGIONAL_EVENT_PACKS } from './livingWorldGateEvents'


export interface GateTheme {
  id: string
  name: string
  description: string
  tag: string
  recommendedMonsterRoles: string[]
  specialVariable: string
}

export interface GateModifier {
  id: string
  name: string
  description: string
  type: 'positive' | 'neutral' | 'dangerous' | 'rare'
}

export interface GateRunEventTemplate {
  id: string
  title: string
  description: string
  choices: GateRunEventChoice[]
}

export const GATE_THEMES: GateTheme[] = [
  {
    id: 'theme_rift',
    name: '균열형 게이트',
    description: '차원의 왜곡이 격렬하게 흔들리며 마력이 불안정해집니다.',
    tag: '공간 불안정',
    recommendedMonsterRoles: ['caster', 'disruptor', 'riftlord'],
    specialVariable: '매 encounter 시작 시 속도가 불규칙하게 변동하며, 보상 배율이 소폭 증가합니다.',
  },
  {
    id: 'theme_beast',
    name: '짐승형 게이트',
    description: '피에 굶주린 맹수들과 신속한 추격자들이 어둠 속에서 으르렁거립니다.',
    tag: '피 냄새',
    recommendedMonsterRoles: ['beast', 'assassin', 'bruiser'],
    specialVariable: '아군의 HP가 낮아지면 적들의 공격 속도와 집중 공격 확률이 대폭 상승합니다.',
  },
  {
    id: 'theme_iron',
    name: '철벽형 게이트',
    description: '두꺼운 갑옷 and 단단한 방벽으로 무장한 정예 군세가 길을 가로막습니다.',
    tag: '철벽의 잔향',
    recommendedMonsterRoles: ['tank', 'warden', 'guard'],
    specialVariable: '적들의 방어력이 크게 상승하지만, 방어 감소/관통 스킬 사용 시 추가 마스터리 XP를 얻습니다.',
  },
  {
    id: 'theme_specter',
    name: '망령형 게이트',
    description: '원혼의 기운과 저주가 서린 잔재들이 주위의 생명력을 잠식합니다.',
    tag: '잔류 원혼',
    recommendedMonsterRoles: ['shadow', 'undead', 'curse'],
    specialVariable: '회복량이 30% 감소하는 대신 그림자 추출 시 공명 보정이 소폭 상향 조정됩니다.',
  },
  {
    id: 'theme_supply',
    name: '보급형 게이트',
    description: '오래전 탐사대원들이 버리고 간 보급 상자와 평온한 휴식처의 흔적을 발견했습니다.',
    tag: '버려진 보급로',
    recommendedMonsterRoles: ['minion', 'weak'],
    specialVariable: '안전한 휴식터와 고대 보물방이 더 자주 등장하지만, 보스 몬스터가 출현하지 않을 수도 있습니다.',
  },
  {
    id: 'theme_cursed',
    name: '저주받은 게이트',
    description: '탐욕을 자극하는 무시무시한 보물과 목숨을 위협하는 함정이 가득합니다.',
    tag: '금기의 문',
    recommendedMonsterRoles: ['curse', 'disruptor'],
    specialVariable: '위험한 선택지들의 보상이 대폭 폭증하지만, 실패 시 최종 완료 보상이 삭감됩니다.',
  },
]

export const GATE_MODIFIERS: GateModifier[] = [
  {
    id: 'mod_rich_shadow',
    name: '그림자 흔적 짙음',
    description: '그림자 흔적 방 출현 확률이 증가하며, 추출 실패 시의 실패 조각이 +2개 추가됩니다.',
    type: 'positive',
  },
  {
    id: 'mod_dense_loot',
    name: '전리품 밀집',
    description: '보물 상자 및 골드 보상이 25% 가산되는 대신, 엘리트 인카운터 확률이 소폭 상승합니다.',
    type: 'neutral',
  },
  {
    id: 'mod_battle_memory',
    name: '전장 기억',
    description: '전장 공략 마스터리 XP가 30% 가산되나, 적의 공격 예고 빈도가 증가합니다.',
    type: 'neutral',
  },
  {
    id: 'mod_scattered_prey',
    name: '사냥감 분산',
    description: '체력이 적고 개체 수가 많은 몬스터 무리가 등장하여, 광역 다중 대상 스킬의 효율이 극대화됩니다.',
    type: 'positive',
  },
  {
    id: 'mod_unstable_rift',
    name: '불안정 균열',
    description: '인카운터를 지날 때마다 누적 위험도가 급격히 요동치며 마법 계열 몬스터가 한층 강력해집니다.',
    type: 'dangerous',
  },
  {
    id: 'mod_blood_scent',
    name: '피의 추적',
    description: '체력이 30% 이하인 아군을 집중 공격하는 살수 몬스터들이 곳곳에 매복해 있어 휴식의 가치가 상승합니다.',
    type: 'dangerous',
  },
  {
    id: 'mod_iron_legion',
    name: '철갑 군세',
    description: '방패와 강철 장비로 무장한 적들이 증가하여, 방어 관통 및 방어 감소 능력을 갖춘 직업이 크게 빛을 발합니다.',
    type: 'dangerous',
  },
  {
    id: 'mod_silent_mist',
    name: '침묵의 안개',
    description: '안개 속 매복병이 명중 저하 상태를 유발합니다. 추적자(Tracker)나 전술가(Tactician) 그림자의 통찰력이 유용합니다.',
    type: 'dangerous',
  },
  {
    id: 'mod_shadow_congestion',
    name: '그림자 과밀',
    description: '그림자 및 언데드 계열 몬스터들이 한층 난폭해지지만, 클리어 시 그림자 추출 공명 보정이 추가로 +8% 보정됩니다.',
    type: 'dangerous',
  },
  {
    id: 'mod_twisted_reward',
    name: '뒤틀린 보상',
    description: '비전투 선택지로 획득하는 보상이 비약적으로 강력해지는 대신, 반드시 경미한 페널티나 리스크 상승이 수반됩니다.',
    type: 'rare',
  },
]

export const GATE_RUN_EVENTS: GateRunEventTemplate[] = [
  {
    id: 'evt_rift_instability',
    title: '불안정한 차원 균열',
    description: '눈앞에서 차원의 틈새가 격렬히 일렁이며 보랏빛 불꽃을 뿜어냅니다. 방치하면 던전 전체가 뒤틀릴 것 같습니다.',
    choices: [
      {
        id: 'choice_rift_stabilize',
        label: '차원 안정화 수행',
        description: '마력 제어로 균열을 강제로 억누릅니다. (누적 위험도 -15, 그림자 정수 +100)',
        riskDelta: -15,
        leadsTo: 'safe',
        immediateReward: { essence: 100, xp: 0, gold: 0, items: [] },
      },
      {
        id: 'choice_rift_force_open',
        label: '균열 강제 개방',
        description: '더 큰 차원의 힘을 방출시킵니다. (누적 위험도 +20, 보상 배율 +0.20, 그림자 흔적방 추가)',
        riskDelta: 20,
        rewardMultiplierDelta: 0.20,
        addEncounterType: 'shadow_trace',
        leadsTo: 'battle',
      },
    ],
  },
  {
    id: 'evt_shadow_trace_faint',
    title: '희미한 그림자 흔적',
    description: '어두운 바닥에 정체 모를 고위 그림자 군세의 잔향이 검은 그을음처럼 묻어나 있습니다.',
    choices: [
      {
        id: 'choice_trace_follow',
        label: '흔적을 심층 추적',
        description: '위험을 무릅쓰고 흔적을 뒤쫓아 공명을 유도합니다. (추출 공명 보정 +8%, 다음 방 위험도 증가)',
        extractionBonusDelta: 8,
        riskDelta: 15,
        leadsTo: 'battle',
      },
      {
        id: 'choice_trace_ignore',
        label: '무시하고 안전 확보',
        description: '불필요한 전투를 피해 조심스럽게 지나갑니다. (골드 +600)',
        leadsTo: 'safe',
        immediateReward: { gold: 600, xp: 0, essence: 0, items: [] },
      },
    ],
  },
  {
    id: 'evt_abandoned_supply',
    title: '버려진 탐사대 보급상자',
    description: '두꺼운 먼지가 쌓인 보급 상자가 구석에 덩그러니 놓여 있습니다. 함정의 징후는 보이지 않습니다.',
    choices: [
      {
        id: 'choice_supply_open',
        label: '보급상자 개봉',
        description: '상자를 열어 유용한 물품들을 회수합니다. (대량 골드 +1000, 30% 확률로 명중 감소 디버프 유발)',
        immediateReward: { gold: 1000, xp: 0, essence: 0, items: [] },
        nextEncounterModifier: 'debuff_accuracy',
      },
      {
        id: 'choice_supply_leave',
        label: '그대로 두고 우회',
        description: '만일의 위험에 대비해 보급품을 건드리지 않고 스쳐 갑니다. (부작용 없음)',
      },
    ],
  },
  {
    id: 'evt_broken_altar',
    title: '바스러진 서약의 제단',
    description: '부서진 석조 제단 주위로 영험한 은빛 오라가 뿜어져 나옵니다. 무언가 제물을 요구하는 듯합니다.',
    choices: [
      {
        id: 'choice_altar_pray',
        label: '성스러운 기도 올리기',
        description: '제단 앞에서 잠시 명상에 잠깁니다. (HP 35% 즉시 회복, 다음 전투 적 속도 +10%)',
        healPercent: 35,
        nextEncounterModifier: 'enemy_speed_up',
      },
      {
        id: 'choice_altar_shatter',
        label: '제단을 파괴해 에너지 갈취',
        description: '제단에 깃든 에너지를 무력으로 탈취합니다. (그림자 정수 +250, 누적 위험도 +10)',
        immediateReward: { essence: 250, xp: 0, gold: 0, items: [] },
        riskDelta: 10,
      },
    ],
  },
  {
    id: 'evt_blood_footsteps',
    title: '피로 물든 발자국',
    description: '바닥에 아직 마르지 않은 끈적한 혈흔이 앞쪽 통로를 향해 길게 이어져 있습니다.',
    choices: [
      {
        id: 'choice_footsteps_hunt',
        label: '위협의 근원 사냥',
        description: '숨어있는 강적을 기습하러 갑니다. (다음 전투가 엘리트 전투로 업그레이드되며 클리어 보상 증가)',
        addEncounterType: 'elite',
        rewardMultiplierDelta: 0.15,
      },
      {
        id: 'choice_footsteps_hide',
        label: '조용히 숨을 가다듬음',
        description: '적의 시선을 피해 안전 구역에서 한숨 돌립니다. (HP 20% 회복, 대신 보상 배율 -0.05)',
        healPercent: 20,
        rewardMultiplierDelta: -0.05,
      },
    ],
  },
  {
    id: 'evt_silent_fog',
    title: '침묵의 심연 안개',
    description: '소리조차 삼켜버릴 것 같은 차가운 어둠의 안개가 시야를 빽빽하게 가로막습니다.',
    choices: [
      {
        id: 'choice_fog_break',
        label: '안개를 뚫고 정면 돌파',
        description: '감각을 곤두세우고 앞을 향해 달립니다. (다음 전투 아군 명중률 -10%, 대신 보상 배율 +0.18)',
        rewardMultiplierDelta: 0.18,
        nextEncounterModifier: 'debuff_accuracy',
      },
      {
        id: 'choice_fog_bypass',
        label: '안개를 피해 우회 경로 수색',
        description: '안전하지만 훨씬 긴 경로로 돌아갑니다. (다음 일반 전투를 보물 방으로 긴급 우회 대체)',
        addEncounterType: 'treasure',
        rewardMultiplierDelta: -0.08,
      },
    ],
  },
  {
    id: 'evt_locked_treasure',
    title: '단단히 잠긴 마력 보물문',
    description: '오래된 철문의 자물쇠 부분에 마력 보호막과 복잡한 룬 문자가 각인되어 문이 열리지 않습니다.',
    choices: [
      {
        id: 'choice_lock_force',
        label: '무력으로 돌파',
        description: '문고리를 검으로 부숩니다. (HP -15% 소모, 대신 확정적 보물 획득)',
        hpCostPercent: 15,
        addEncounterType: 'treasure',
      },
      {
        id: 'choice_lock_solve',
        label: '고대 룬 문자 해석',
        description: '룬의 배열을 해석합니다. (실패 시 차원 간섭으로 몬스터 전투 추가)',
        addEncounterType: 'battle',
      },
    ],
  },
  {
    id: 'evt_rift_mirror',
    title: '왜곡된 차원 거울',
    description: '정체 모를 은빛 거울 속에 다가올 던전 끝방의 강대한 보스 몬스터의 형태가 얼핏 일렁입니다.',
    choices: [
      {
        id: 'choice_mirror_gaze',
        label: '보스의 약점 집중 연구',
        description: '불안정함 속에서 보스의 기세를 미리 분석합니다. (보상 배율 +0.10, 누적 위험도 +10)',
        rewardMultiplierDelta: 0.10,
        riskDelta: 10,
      },
      {
        id: 'choice_mirror_shatter',
        label: '거울을 가차 없이 산산조각 냄',
        description: '불길한 환영을 없애고 흩어진 마력을 흡수합니다. (그림자 정수 +300)',
        immediateReward: { essence: 300, xp: 0, gold: 0, items: [] },
      },
    ],
  },
  {
    id: 'evt_shadow_contract',
    title: '심연의 그림자 서약',
    description: '그늘 속에서 스며나온 투명한 어둠의 손길이 은근히 당신에게 부정한 계약을 제안해 옵니다.',
    choices: [
      {
        id: 'choice_contract_accept',
        label: '그림자 제안 수락',
        description: '심연의 마력을 흔쾌히 받아들입니다. (추출 공명 보정 +12%, 대신 다음 전투 적 공격력 +15%)',
        extractionBonusDelta: 12,
        nextEncounterModifier: 'enemy_atk_up',
      },
      {
        id: 'choice_contract_reject',
        label: '단호히 거절하고 조각 강탈',
        description: '어둠의 의지를 베어 물리치고 잔해를 수습합니다. (그림자 정수/조각 소량 보상)',
        immediateReward: { essence: 150, xp: 0, gold: 300, items: [] },
      },
    ],
  },
  {
    id: 'evt_old_hunter_mark',
    title: '오래된 사냥꾼의 조준 표식',
    description: '벽면에 옛 탐사대가 새겨둔 유용한 타겟 표식과 마법사형 적들의 위치가 또렷이 묘사되어 있습니다.',
    choices: [
      {
        id: 'choice_mark_follow',
        label: '표식의 전략적 정보 반영',
        description: '표식이 지시하는 사각지대를 공략합니다. (보상 배율 +0.05)',
        rewardMultiplierDelta: 0.05,
      },
      {
        id: 'choice_mark_ignore',
        label: '자신만의 전술 유지',
        description: '정직하게 길을 걸어 안정적으로 싸웁니다. (누적 위험도 -5)',
        riskDelta: -5,
      },
    ],
  },
  {
    id: 'evt_red_warning',
    title: '벽면의 붉은 살육 경고문',
    description: '붉은 피로 "돌아가라. 이 너머에는 끔찍한 학살자가 도사리고 있다."라고 급히 적힌 글씨가 보입니다.',
    choices: [
      {
        id: 'choice_warning_ignore',
        label: '학살자의 숨통을 끊는다',
        description: '경고를 코웃음 치며 정면으로 뚫고 들어갑니다. (다음 일반 전투가 엘리트 강력 전투로 변경, 최종 보상 크게 가산)',
        addEncounterType: 'elite',
        rewardMultiplierDelta: 0.30,
      },
      {
        id: 'choice_warning_prepare',
        label: '경계 태세 확보 및 후퇴로 정비',
        description: '만약을 대비해 보급로와 대피로를 철저하게 구축합니다. (위험도 감소)',
        riskDelta: -10,
      },
    ],
  },
  {
    id: 'evt_void_whisper',
    title: '허공에서 울리는 고대의 속삭임',
    description: '귓가를 간지럽히는 영적인 파동이 머릿속에 수많은 전술적 영감과 환영을 무차별적으로 강제 주입하려 듭니다.',
    choices: [
      {
        id: 'choice_whisper_accept',
        label: '영적 전술 영감 수용',
        description: '환영을 참아내고 전술 비법을 익힙니다. (다음 전투 시작 시 아군 속도 저하 디버프)',
        nextEncounterModifier: 'silence_player_1t',
      },
      {
        id: 'choice_whisper_refuse',
        label: '정신을 단단히 고정하고 거부',
        description: '정신 장벽을 굳건히 세워 파동을 밀어냅니다. (그림자 정수 +200 획득)',
        immediateReward: { essence: 200, xp: 0, gold: 0, items: [] },
      },
    ],
  },
  {
    id: 'evt_battle_reverberation',
    title: '시간이 멈춘 전장의 잔향',
    description: '과거 헌터들이 치열하게 싸우다 남겨둔 스킬 마력의 불꽃들이 허공에 방울처럼 동동 떠다니고 있습니다.',
    choices: [
      {
        id: 'choice_reverb_absorb',
        label: '스킬 정수 파편 흡수',
        description: '무기 끝으로 마력 방울을 찔러 영혼을 보강합니다. (다음 전투 적 HP +15% 강화)',
        nextEncounterModifier: 'enemy_hp_up',
      },
      {
        id: 'choice_reverb_dispel',
        label: '잔향을 넓게 흩뜨려 소멸',
        description: '불안정하게 날뛰는 마력을 안전하게 분산시킵니다. (누적 위험도 -8)',
        riskDelta: -8,
      },
    ],
  },
  {
    id: 'evt_black_merchant',
    title: '수상한 어둠 속 검은 상인',
    description: '그림자 가면을 쓴 정체불명의 상인이 미늘창에 몸을 기대어 은밀하고 부정한 암거래를 유도합니다.',
    choices: [
      {
        id: 'choice_merchant_buy',
        label: '가치 있는 물품 암거래 수행',
        description: '골드를 아낌없이 내주고 가치 높은 조각을 삽니다. (골드 -800 소모, 그림자 룬/조각 대량 +400 정수 획득)',
        immediateReward: { gold: -800, essence: 400, xp: 0, items: [] },
      },
      {
        id: 'choice_merchant_threaten',
        label: '상인의 창고를 강박적으로 겁박',
        description: '칼자루를 쥐고 비열하게 협박합니다. (40% 확률로 엘리트 강적 출현, 아니면 무상 보물 획득)',
        addEncounterType: 'elite',
      },
    ],
  },
  {
    id: 'evt_lost_shadow',
    title: '의지를 잃고 방황하는 그림자',
    description: '군주의 지배력을 벗어난 하위 그림자 야수가 슬픈 비명 소리를 내며 좁은 굴속에서 웅크리고 있습니다.',
    choices: [
      {
        id: 'choice_shadow_bind',
        label: '어둠의 사슬로 구속 포획',
        description: '야수를 힘으로 묶어 그림자 수집품으로 병합합니다. (그림자 정수 +300, 추출 공명 보정 +5%)',
        extractionBonusDelta: 5,
        immediateReward: { essence: 300, xp: 0, gold: 0, items: [] },
      },
      {
        id: 'choice_shadow_release',
        label: '자유롭게 풀어주어 성불시킴',
        description: '사슬을 풀어 넓은 통로로 안내합니다. (다음 전투 시작 시 아군 속도 버프 획득)',
        nextEncounterModifier: 'player_speed_up_1t',
      },
    ],
  },
  {
    id: 'evt_rift_storm',
    title: '몰아치는 마력의 균열 폭풍',
    description: '통로의 중심부에서 회오리치는 차원 폭풍이 불어와 정상적인 행보를 방해하며 아군을 뒤흔듭니다.',
    choices: [
      {
        id: 'choice_storm_rush',
        label: '폭풍을 정면으로 강하게 돌파',
        description: '방패로 앞을 막고 거세게 내달립니다. (즉시 습격 전투 돌입, 최종 보상 가중치 +0.22)',
        addEncounterType: 'battle',
        rewardMultiplierDelta: 0.22,
      },
      {
        id: 'choice_storm_wait',
        label: '바위 틈새에 숨어 폭풍 모면',
        description: '폭풍이 가라앉기를 기다리며 휴식을 취합니다. (HP 30% 회복, 대신 몬스터 강화)',
        healPercent: 30,
        nextEncounterModifier: 'enemy_surprise_atk',
      },
    ],
  },
  {
    id: 'evt_iron_debris',
    title: '파괴된 고대 파수꾼의 강철 철갑',
    description: '바닥에 산산조각 난 채 버려진 골렘의 은빛 장갑과 육중한 철갑 보호구가 널려 있습니다.',
    choices: [
      {
        id: 'choice_debris_scrap',
        label: '철갑을 뜯어 재료로 분해',
        description: '유용한 기계 잔해를 뜯어냅니다. (골드 +600)',
        immediateReward: { gold: 600, xp: 0, essence: 0, items: [] },
      },
      {
        id: 'choice_debris_wear',
        label: '임시 보조 갑옷으로 장착',
        description: '갑옷 조각을 몸에 덧대어 묶습니다. (다음 전투 아군 받는 피해 -20% 감소, 대신 아군 속도 저하)',
        nextEncounterModifier: 'player_def_up_spd_down',
      },
    ],
  },
  {
    id: 'evt_boss_omen',
    title: '심연 깊숙한 곳의 흉흉한 보스의 전조',
    description: '벽면이 크게 움푹 파이고, 이 너머에서 대지를 뒤흔드는 거대한 보스의 격렬한 포효가 뿜어져 나옵니다.',
    choices: [
      {
        id: 'choice_omen_analyze',
        label: '포효와 흔적 정밀 분석',
        description: '보스의 숨결을 분석해 파훼 전술을 세웁니다. (보상 배율 +0.05)',
        rewardMultiplierDelta: 0.05,
      },
      {
        id: 'choice_omen_taunt',
        label: '허공에 거친 도발 발사',
        description: '던전이 흔들리도록 도발을 외칩니다. (보스 공격력 상승 및 보스방 추출 공명 보정 대폭 +15% 증가)',
        extractionBonusDelta: 15,
        nextEncounterModifier: 'boss_rage_up',
      },
    ],
  },
  {
    id: 'evt_cursed_treasure',
    title: '붉은 저주가 흐르는 보석 상자',
    description: '눈이 멀어버릴 정도로 화려한 고대의 보물 상자가 사악한 자줏빛 저주의 안개에 완전히 둘러싸여 있습니다.',
    choices: [
      {
        id: 'choice_curse_take',
        label: '저주를 감수하고 보물 강탈',
        description: '맨손으로 보물을 꺼냅니다. (대량 골드 +1500, 그림자 정수 +500, 단 던전 끝까지 적 강화)',
        immediateReward: { gold: 1500, essence: 500, xp: 0, items: [] },
        nextEncounterModifier: 'curse_damage_taken_up',
      },
      {
        id: 'choice_curse_purify',
        label: '신성한 마력 정화 의식',
        description: '마력을 모아 저주를 밀어냅니다. (안전하게 소량의 정제된 보물 획득: 골드 +500)',
        immediateReward: { gold: 500, xp: 0, essence: 100, items: [] },
      },
    ],
  },
  {
    id: 'evt_collapsing_passage',
    title: '우지끈 무너져 내리는 아치형 통로',
    description: '천장의 낡은 석조 보가 부러지며 날카로운 거대 바위와 먼지더미가 무방비하게 쏟아져 내립니다!',
    choices: [
      {
        id: 'choice_passage_dash',
        label: '민첩하게 전력 질주',
        description: '순간적인 반사 신경으로 틈을 뚫습니다. (실패 시 아군 HP -20% 소모)',
        hpCostPercent: 20,
      },
      {
        id: 'choice_passage_bypass',
        label: '안전한 대피 우회로 개척',
        description: '붕괴지를 돌아서 안전하지만 미지의 구역으로 들어섭니다. (몬스터 일반 전투 인카운터 1개 추가 삽입)',
        addEncounterType: 'battle',
      },
    ],
  },
]

// Seedable PRNG helper
export function createSeededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  return function() {
    h = (h + 0x7ed55d16) + (h << 12)
    h = (h ^ 0xc6a4a793) ^ (h >>> 19)
    h = (h + 0x165667b1) + (h << 5)
    h = (h + 0xd3a2646c) ^ (h << 9)
    h = (h + 0xfd7046c5) + (h << 3)
    h = (h ^ 0xb55a4f09) ^ (h >>> 16)
    return (h >>> 0) / 4294967296
  }
}

// Seed 기반 Dungeon Run 생성 함수
export function generateGateRunState(gateId: string, seed: string, examGrade?: HunterGradeTier, customGateDef?: GateDefinition): GateRunState {
  const rand = createSeededRandom(seed)
  const gate = customGateDef || GATE_DEFINITIONS.find(g => g.id === gateId)
  const rank: GateRank = gate?.rank ?? 'E'

  // [NEW] 지역색 테마 데이터 및 국가/지역별 이벤트팩 로드
  const subRegionId = customGateDef?.subRegionId || (gateId.startsWith('node-') ? gateId.split('-')[2] : undefined) || 'default'
  const regionalTheme = getRegionalTheme(subRegionId)
  const isWorldNode = customGateDef?.isWorldNode || gateId.startsWith('node-') || gateId.startsWith('gate-spawn-')
  const regionId = (customGateDef as any)?.regionId || (gateId.startsWith('node-') ? 'kr' : undefined)
  const eventPack = isWorldNode ? getWorldGateEventPack(regionId, subRegionId) : undefined

  // 1. Theme 선택
  const theme = GATE_THEMES[Math.floor(rand() * GATE_THEMES.length)]

  // 2. Modifier 선택 (E/D: 0~1개, C/B: 1개, A/S: 1~2개)
  const maxModifiers = (rank === 'E' || rank === 'D') ? 1 : (rank === 'C' || rank === 'B') ? 1 : 2
  const numModifiers = Math.floor(rand() * (maxModifiers + 1))
  const modifierIds: string[] = []
  const availableMods = [...GATE_MODIFIERS]
  for (let i = 0; i < numModifiers; i++) {
    if (availableMods.length === 0) break
    const idx = Math.floor(rand() * availableMods.length)
    modifierIds.push(availableMods[idx].id)
    availableMods.splice(idx, 1)
  }

  // 3. 인카운터 개수 결정 (E/D: 2~3, C/B: 3~4, A/S: 4~5)
  let encounterCount = 0
  let typesList: GateRunEncounterType[] = []
  const examDef = examGrade && examGrade !== 'E' ? PROMOTION_EXAM_DEFINITIONS[examGrade] : undefined
  const isMonarchId = MONARCHS.some(m => m.id === gateId) || gateId === 'angel'

  if (isMonarchId) {
    encounterCount = 1
    typesList = ['boss']
  } else if (examDef) {
    encounterCount = examDef.encounterCount
    if (examGrade === 'D') {
      typesList = ['battle', 'battle', 'boss']
    } else if (examGrade === 'C') {
      typesList = ['battle', 'event', 'elite', 'boss']
    } else if (examGrade === 'B') {
      typesList = ['battle', 'shadow_trace', 'elite', 'battle', 'boss']
    } else if (examGrade === 'A') {
      typesList = ['battle', 'event', 'elite', 'shadow_trace', 'rest', 'boss']
    } else if (examGrade === 'S') {
      typesList = ['battle', 'elite', 'event', 'elite', 'rest', 'boss']
    } else if (examGrade === 'NATIONAL') {
      typesList = ['battle', 'elite', 'event', 'elite', 'shadow_trace', 'rest', 'boss']
    }
  } else {
    let minEncounters = 3
    let maxEncounters = 4
    if (rank === 'E' || rank === 'D') {
      minEncounters = 3
      maxEncounters = 4
    } else if (rank === 'C') {
      minEncounters = 3
      maxEncounters = 4
    } else if (rank === 'B') {
      minEncounters = 4
      maxEncounters = 5
    } else if (rank === 'A') {
      minEncounters = 5
      maxEncounters = 6
    } else if (rank === 'S') {
      minEncounters = 6
      maxEncounters = 8
    }
    encounterCount = minEncounters + Math.floor(rand() * (maxEncounters - minEncounters + 1))

    if (rank === 'E' || rank === 'D') {
      if (encounterCount === 3) {
        typesList = ['battle', 'event', 'treasure']
      } else {
        typesList = ['battle', 'event', 'battle', 'treasure']
      }
    } else if (rank === 'C') {
      if (encounterCount === 3) {
        typesList = ['battle', 'event', 'treasure']
      } else {
        typesList = ['battle', 'event', 'battle', 'treasure']
      }
    } else if (rank === 'B') {
      if (encounterCount === 4) {
        typesList = ['battle', 'event', 'battle', 'boss']
      } else {
        typesList = ['battle', 'event', 'rest', 'battle', 'boss']
      }
    } else if (rank === 'A') {
      if (encounterCount === 5) {
        typesList = ['battle', 'event', 'elite', 'rest', 'boss']
      } else {
        typesList = ['battle', 'event', 'elite', 'shadow_trace', 'rest', 'boss']
      }
    } else if (rank === 'S') {
      if (encounterCount === 6) {
        typesList = ['event', 'battle', 'event', 'elite', 'rest', 'boss']
      } else if (encounterCount === 7) {
        typesList = ['event', 'battle', 'event', 'elite', 'battle', 'rest', 'boss']
      } else {
        typesList = ['event', 'battle', 'event', 'elite', 'event', 'battle', 'rest', 'boss']
      }
    }
  }

  // 4. 인카운터 리스트 빌드
  const encounters: GateRunEncounter[] = []
  
  // E/D 랭크는 간소한 몬스터 조합, S/A 랭크 및 보스 게이트는 보스 무조건 배치
  const isBossGate = gateId.includes('boss') || rank === 'S' || gate?.rewardTableId?.includes('boss') || Boolean(examDef) || isMonarchId

  // 인카운터 타입 풀 가중치 빌드
  const getNextEncounterType = (index: number): GateRunEncounterType => {
    if (index === 0) {
      // 첫 방은 안전하게 battle(70%) 혹은 event(30%)
      return rand() < 0.7 ? 'battle' : 'event'
    }
    if (index === encounterCount - 1) {
      // 마지막 방은 보스 또는 엘리트 최종전
      return isBossGate ? 'boss' : (rank === 'A' || rank === 'B') ? (rand() < 0.6 ? 'boss' : 'elite') : 'elite'
    }

    // 중간 방 가중치
    const types: GateRunEncounterType[] = ['battle', 'elite', 'event', 'rest', 'treasure', 'shadow_trace']
    const weights = [0.35, 0.10, 0.20, 0.10, 0.15, 0.10] // E/D default

    // 테마별 가중치 보정
    if (theme.id === 'theme_supply') {
      weights[3] += 0.20 // rest
      weights[4] += 0.25 // treasure
      weights[0] -= 0.15 // battle
      weights[1] -= 0.05 // elite
    } else if (theme.id === 'theme_cursed') {
      weights[2] += 0.25 // event
      weights[1] += 0.15 // elite
      weights[3] -= 0.05 // rest
      weights[4] -= 0.05 // treasure
    } else if (theme.id === 'theme_specter') {
      weights[5] += 0.20 // shadow_trace
      weights[0] += 0.05
    }

    // 모디파이어 보정
    if (modifierIds.includes('mod_rich_shadow')) {
      weights[5] += 0.30 // shadow_trace 상향
    }
    if (modifierIds.includes('mod_dense_loot')) {
      weights[4] += 0.20 // treasure
      weights[1] += 0.10 // elite
    }

    // 가중치 합계 정규화
    let sum = 0
    for (const w of weights) sum += w
    let r = rand() * sum
    let accum = 0
    for (let i = 0; i < types.length; i++) {
      accum += weights[i]
      if (r <= accum) {
        // 안전장치: 직전 방이 rest/treasure인 경우 연속 출현 금지
        const prev = encounters[index - 1]?.type
        if ((types[i] === 'rest' || types[i] === 'treasure') && (prev === 'rest' || prev === 'treasure')) {
          return 'battle'
        }
        return types[i]
      }
    }
    return 'battle'
  }

  // 5. 각 인카운터 세부 내용 채우기
  const gateMonsters = gate?.monsterIds ?? []

  for (let i = 0; i < encounterCount; i++) {
    let encType = examDef ? typesList[i] : (typesList[i] || getNextEncounterType(i))
    let title = ''
    let description = ''
    let monsterIds: string[] = []
    let difficultyMod = 1.0
    let riskDelta = 0
    let rewardMultiplier = 1.0
    let eventTemplateId: string | undefined = undefined
    let eventChoices: GateRunEventChoice[] | undefined = undefined
    let treasureReward: Partial<GateRunRewardBundle> | undefined = undefined

    // S급 난이도인 경우 단계별 점진성 스케일링 적용
    difficultyMod = encType === 'elite' ? 1.35 : encType === 'boss' ? 1.7 : 1.0
    riskDelta = encType === 'elite' ? 15 : encType === 'boss' ? 30 : 5
    rewardMultiplier = encType === 'elite' ? 1.25 : encType === 'boss' ? 1.5 : 1.0

    if (rank === 'S') {
      const progressRatio = i / Math.max(1, encounterCount - 1)
      difficultyMod *= (0.75 + progressRatio * 0.45) // 첫 방 0.75배에서 최종 1.2배까지 점진 상승
    }

    // 테마별 위험도 조정
    if (theme.id === 'theme_rift') {
      difficultyMod += 0.1
      rewardMultiplier += 0.05
    }

    // 지역 테마 데이터 로드
    const stepName = eventPack
      ? (eventPack.timelineLabels[i] || eventPack.timelineLabels[i % eventPack.timelineLabels.length])
      : (regionalTheme.timelineNames[i] || regionalTheme.timelineNames[i % regionalTheme.timelineNames.length] || '심연')
    let rTitle = ''
    let rDesc = ''
    if (regionalTheme.encounterTitles[encType] && regionalTheme.encounterTitles[encType].length > 0) {
      rTitle = regionalTheme.encounterTitles[encType][Math.floor(rand() * regionalTheme.encounterTitles[encType].length)]
    }
    if (regionalTheme.encounterDescriptions[encType] && regionalTheme.encounterDescriptions[encType].length > 0) {
      rDesc = regionalTheme.encounterDescriptions[encType][Math.floor(rand() * regionalTheme.encounterDescriptions[encType].length)]
    }

    if (encType === 'battle' || encType === 'elite' || encType === 'boss') {
      // 몬스터 매핑
      if (encType === 'boss') {
        title = isBossGate ? '심연의 군주 방 [BOSS]' : '구역 지배자 결전 [BOSS]'
        description = '이 던전의 모든 에너지가 집결된 보스 몬스터가 웅크리고 있습니다. 모든 전술을 총동원해야 합니다.'
        if (isMonarchId) {
          title = `심연의 군주 - ${gate?.name} 결전 [BOSS]`
          description = `살아있는 세계의 파멸을 획책하는 심연의 군주 [${gate?.name}]과의 피할 수 없는 피비린내 나는 전쟁이 시작됩니다.`
        } else if (examDef) {
          title = `${examDef.name} - 최종 심사 [BOSS]`
          description = `[${examDef.bossEmphasisName ?? '최종 보스'}]가 헌터님의 승격 자격을 최후 검증하기 위해 기다리고 있습니다.`
        } else if (rTitle) {
          title = `${rTitle} [BOSS]`
          description = rDesc || description
        }

        // [NEW] 보스 방 진입 전 전조 문구 가리비식 보강
        if (eventPack && eventPack.bossForeshadowings && eventPack.bossForeshadowings.length > 0) {
          const foreshadow = eventPack.bossForeshadowings[Math.floor(rand() * eventPack.bossForeshadowings.length)]
          description = `${foreshadow} ${description}`
        }
        
        // 마지막 몬스터 혹은 가장 무거운 몬스터
        const bossId = gateMonsters.find(mId => {
          const m = MONSTER_DEFINITIONS.find(x => x.id === mId)
          return m?.description.includes('보스') || m?.name.includes('군주') || m?.name.includes('지배자')
        }) ?? gateMonsters[gateMonsters.length - 1] ?? 'monster-goblin-shaman'
        
        monsterIds = [bossId]
        // 보스 보좌진 추가
        if (gateMonsters.length > 1 && rank !== 'E' && !isMonarchId) {
          const minionId = gateMonsters.find(mId => mId !== bossId)
          if (minionId) monsterIds.push(minionId)
        }
      } else {
        const isElite = encType === 'elite'
        title = isElite ? '정예 파수꾼 구역 [ELITE]' : '어둠 속의 매복 구역'
        description = isElite 
          ? '한눈에 봐도 뼈대가 굵고 마력이 넘쳐나는 정예 개체가 위협적으로 가로막아 섭니다.'
          : '기괴한 울음소리가 좁은 동굴 벽을 타고 들려옵니다. 무기를 굳게 쥐십시오.'

        if (rTitle) {
          title = isElite ? `${rTitle} [ELITE]` : rTitle
          description = rDesc || description
        }

        // 몬스터 조합 생성
        const numMonsters = isElite ? (rank === 'E' ? 1 : 2) : (rank === 'E' ? 1 : rand() < 0.6 ? 2 : 3)
        monsterIds = []
        for (let j = 0; j < numMonsters; j++) {
          if (gateMonsters.length > 0) {
            // 테마에 맞는 몬스터 역할군 가중치 선호
            const matched = gateMonsters.filter(mId => {
              const m = MONSTER_DEFINITIONS.find(x => x.id === mId)
              return theme.recommendedMonsterRoles.some(role => m?.description.toLowerCase().includes(role))
            })
            const pool = (matched.length > 0 && rand() < 0.7) ? matched : gateMonsters
            monsterIds.push(pool[Math.floor(rand() * pool.length)])
          } else {
            monsterIds.push('monster-goblin-scout')
          }
        }
      }
      
      if (examDef && encType !== 'boss') {
        title = `[승급 심사] ${title}`
      }
    } else if (encType === 'event') {
      let evtTemplate: any = undefined
      if (eventPack && eventPack.eventEncounters.length > 0) {
        const rankValues: Record<GateRank, number> = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 }
        const currentVal = rankValues[rank] || 1
        const validRegional = eventPack.eventEncounters.filter(evt => {
          if (!evt.minGrade) return true
          const minVal = rankValues[evt.minGrade] || 1
          return currentVal >= minVal
        })
        const pool = validRegional.length > 0 ? validRegional : eventPack.eventEncounters
        evtTemplate = pool[Math.floor(rand() * pool.length)]
      }

      if (evtTemplate) {
        title = evtTemplate.title
        description = evtTemplate.description
        eventTemplateId = evtTemplate.id
        
        // 오염도 및 잔여일 데드라인 상황 묘사 동적 적용
        if (customGateDef?.contamination && customGateDef.contamination > 50) {
          description += ` (🚨 경고: 이 지역의 마력 오염도가 ${customGateDef.contamination}%에 달해 위험이 도사리고 있습니다!)`
        }
        if (customGateDef?.daysRemaining !== undefined && customGateDef.daysRemaining <= 2) {
          description += ` (⏳ D-${customGateDef.daysRemaining}! 전선 붕괴가 임박하여 시야가 좁아지고 위험 기동이 제약을 받습니다.)`
        }

        eventChoices = evtTemplate.choices.map((c: any) => {
          const resolved = { ...c }
          if (customGateDef?.hasHelpers) {
            if (c.coopLabel) resolved.label = c.coopLabel
            if (c.coopDescription) resolved.description = c.coopDescription
            if (c.coopRiskDelta !== undefined) resolved.riskDelta = c.coopRiskDelta
            if (c.coopRewardMultiplierDelta !== undefined) resolved.rewardMultiplierDelta = c.coopRewardMultiplierDelta
            if (c.coopImmediateReward) resolved.immediateReward = c.coopImmediateReward
            if (c.coopNextEncounterModifier) resolved.nextEncounterModifier = c.coopNextEncounterModifier
          }
          return resolved
        })
      } else {
        // 이벤트 선택 전수 가드 및 검증 (빈 선택지 생성 원천 방지)
        const validTemplates = GATE_RUN_EVENTS.filter(evt => evt && evt.id && evt.choices && evt.choices.length >= 2)
        if (validTemplates.length > 0) {
          const evtTemplate = validTemplates[Math.floor(rand() * validTemplates.length)]
          title = examDef ? `[승급 심사] 돌발 상황: ${evtTemplate.title}` : `의외의 징후: ${evtTemplate.title}`
          description = evtTemplate.description
          if (rTitle && !examDef) {
            title = `의외의 징후: ${rTitle}`
            description = rDesc || description
          }
          eventTemplateId = evtTemplate.id
          eventChoices = evtTemplate.choices.map(c => ({ ...c }))
        } else {
          // 극단적 템플릿 부재 상황 시 안전한 treasure로 자동 대체
          encType = 'treasure'
          const baseGold = (rank === 'E' || rank === 'D') ? 400 : (rank === 'C' || rank === 'B') ? 800 : 1500
          const baseEssence = (rank === 'E' || rank === 'D') ? 100 : (rank === 'C' || rank === 'B') ? 200 : 400
          const goldAmt = Math.round(baseGold * (0.8 + rand() * 0.4))
          const essAmt = Math.round(baseEssence * (0.8 + rand() * 0.4))
          title = examDef ? '[승급 심사] 흘러나온 차원 보물 방' : '흘러나온 차원 보물 방'
          description = '어둡고 비좁은 통로 끝에서 찬란하게 금색 마력 광채를 발하는 오래된 상자를 찾아냈습니다!'
          if (rTitle && !examDef) {
            title = rTitle
            description = rDesc || description
          }
          treasureReward = { gold: goldAmt, essence: essAmt, xp: 0, items: [] }
        }
      }
    } else if (encType === 'rest') {
      const restTypes = [
        { name: '안전한 모닥불', desc: '따뜻한 온기가 감도는 모닥불 주위에서 상처를 꿰맵니다. (HP 40% 회복)' },
        { name: '마력의 푸른 온천', desc: '흘러넘치는 차원의 마력천에 몸을 담급니다. (HP 30% 회복 및 그림자 정수 획득)' },
        { name: '그림자의 밀실', desc: '군주의 그림자 기운이 차분하게 헌터를 보호합니다. (HP 20% 회복 및 다음 추출 공명 보정 +5%)' }
      ]
      const chosenRest = restTypes[Math.floor(rand() * restTypes.length)]
      title = examDef ? `[승급 심사] 정비 거점: ${chosenRest.name}` : `정비 거점: ${chosenRest.name}`
      description = chosenRest.desc
      if (rTitle && !examDef) {
        title = `정비 거점: ${rTitle}`
        description = rDesc || description
      }
    } else if (encType === 'treasure') {
      const baseGold = (rank === 'E' || rank === 'D') ? 400 : (rank === 'C' || rank === 'B') ? 800 : 1500
      const baseEssence = (rank === 'E' || rank === 'D') ? 100 : (rank === 'C' || rank === 'B') ? 200 : 400
      const goldAmt = Math.round(baseGold * (0.8 + rand() * 0.4))
      const essAmt = Math.round(baseEssence * (0.8 + rand() * 0.4))

      title = examDef ? '[승급 심사] 흘러나온 차원 보물 방' : '흘러나온 차원 보물 방'
      description = '어둡고 비좁은 통로 끝에서 찬란하게 금색 마력 광채를 발하는 오래된 상자를 찾아냈습니다!'
      if (rTitle && !examDef) {
        title = rTitle
        description = rDesc || description
      }
      treasureReward = { gold: goldAmt, essence: essAmt, xp: 0, items: [] }
    } else if (encType === 'shadow_trace') {
      title = examDef ? '[승급 심사] 짙게 얼룩진 그림자 흔적' : '짙게 얼룩진 그림자 흔적'
      description = '강력한 고대 마력의 흔적이 은은하게 소용돌이칩니다. 다음 그림자 추출의 성공 가능성을 한층 높여줄 것입니다.'
      if (rTitle && !examDef) {
        title = rTitle
        description = rDesc || description
      }
    }

    // 최종 타임라인 단계명 조합 연출
    title = `[${stepName}] ${title}`

    encounters.push({
      id: `enc-${i}-${Date.now()}-${Math.floor(rand() * 1000)}`,
      type: encType,
      title,
      description,
      monsterIds: monsterIds.length > 0 ? monsterIds : undefined,
      difficultyMod,
      status: i === 0 ? 'available' : 'locked',
      isBoss: encType === 'boss' ? true : undefined,
      isElite: encType === 'elite' ? true : undefined,
      themeTag: theme.tag,
      riskDelta,
      rewardMultiplier,
      eventTemplateId,
      eventChoices,
      treasureReward,
    })
  }


  // 6. 누적 보상 번들 초기화
  const accumulatedRewards: GateRunRewardBundle = {
    xp: 0,
    gold: 0,
    essence: 0,
    items: [],
  }

  // Red Gate 초기 상태 산출 (불안정 균열/저주/과밀 모디파이어 시 보너스)
  let initialInstability = 0
  if (theme.id === 'theme_rift' || theme.id === 'theme_cursed') {
    initialInstability += 15
  }
  if (modifierIds.includes('mod_unstable_rift')) {
    initialInstability += 10
  }
  if (modifierIds.includes('mod_shadow_congestion')) {
    initialInstability += 10
  }

  const redGateState: RedGateState = {
    status: 'none',
    instabilityScore: initialInstability,
  }

  return {
    gateId,
    seed,
    themeId: theme.id,
    modifierIds,
    currentEncounterIndex: 0,
    encounters,
    accumulatedRewards,
    accumulatedRisk: 0,
    rewardMultiplier: 1.0,
    extractionBonusPercent: 0,
    clearedEncounterIds: [],
    failed: false,
    completed: false,
    redGateState,
  }
}

// 20개 이벤트 템플릿 탐색 헬퍼
export function getGateRunEventTemplate(templateId: string): GateRunEventTemplate | undefined {
  const standard = GATE_RUN_EVENTS.find(t => t.id === templateId)
  if (standard) return standard

  // Search regional event packs
  for (const pack of Object.values(REGIONAL_EVENT_PACKS)) {
    const found = pack.eventEncounters.find(e => e.id === templateId)
    if (found) {
      return {
        id: found.id,
        title: found.title,
        description: found.description,
        choices: found.choices
      }
    }
  }
  return undefined
}

// 깨지거나 선택지가 빈 이벤트 방 복구 및 재수화(Hydration) 헬퍼
export function hydrateGateRunEncounterChoices(encounter: GateRunEncounter, activeGate?: any): GateRunEncounter {
  if (encounter.type !== 'event') return encounter

  // 이미 정상적인 선택지가 2개 이상 채워져 있고, 특수 치환이 필요하지 않다면 그대로 반환
  if (encounter.eventChoices && encounter.eventChoices.length >= 2) {
    if (!activeGate?.customGateDef?.hasHelpers) {
      return encounter
    }
  }

  // eventTemplateId가 존재한다면 템플릿 DB 풀에서 원본을 매핑하여 신속 수화 복원
  if (encounter.eventTemplateId) {
    const template = getGateRunEventTemplate(encounter.eventTemplateId)
    if (template && template.choices && template.choices.length >= 2) {
      const hasHelpers = activeGate?.customGateDef?.hasHelpers
      const resolvedChoices = template.choices.map((c: any) => {
        const resolved = { ...c }
        if (hasHelpers) {
          if (c.coopLabel) resolved.label = c.coopLabel
          if (c.coopDescription) resolved.description = c.coopDescription
          if (c.coopRiskDelta !== undefined) resolved.riskDelta = c.coopRiskDelta
          if (c.coopRewardMultiplierDelta !== undefined) resolved.rewardMultiplierDelta = c.coopRewardMultiplierDelta
          if (c.coopImmediateReward) resolved.immediateReward = c.coopImmediateReward
          if (c.coopNextEncounterModifier) resolved.nextEncounterModifier = c.coopNextEncounterModifier
        }
        return resolved
      })

      let description = encounter.description || template.description
      const customGateDef = activeGate?.customGateDef
      if (customGateDef?.contamination && customGateDef.contamination > 50 && !description.includes('오염도')) {
        description += ` (🚨 경고: 이 지역의 마력 오염도가 ${customGateDef.contamination}%에 달해 위험이 도사리고 있습니다!)`
      }
      if (customGateDef?.daysRemaining !== undefined && customGateDef.daysRemaining <= 2 && !description.includes('D-')) {
        description += ` (⏳ D-${customGateDef.daysRemaining}! 전선 붕괴가 임박하여 시야가 좁아지고 위험 기동이 제약을 받습니다.)`
      }

      return {
        ...encounter,
        title: encounter.title || `의외의 징후: ${template.title}`,
        description,
        eventChoices: resolvedChoices,
      }
    }
  }

  // 최종 복구도 실패하는 비상 상황 시 safe encounter로 보장 전환하여 사용자 에러 전면 차단
  return convertBrokenEventToSafeEncounter(encounter)
}

export const stripGateChoiceOutcomeHint = (description: string): string =>
  description.replace(
    /\s*[\(（][^\(（\)）]*(?:위험도|누적 위험도|경험치|XP|골드|Gold|정수|보상 배율|추출|성공률|HP|체력|다음 전투|다음 방|버프|디버프|조각|확률|페널티|획득|소모)[^\(（\)）]*[\)）]\s*$/u,
    ''
  ).trim()

// 복구 불가한 깨진 이벤트를 컨셉에 어울리는 안전 보물방으로 전환하는 헬퍼
export function convertBrokenEventToSafeEncounter(encounter: GateRunEncounter): GateRunEncounter {
  return {
    ...encounter,
    type: 'treasure',
    title: '균열 안정화 우회로 (보물 상자)',
    description: '차원 균열의 불안정한 왜곡 현상이 감지되었으나, 아치의 공명 주파수를 안전하게 정렬하여 우회로를 찾았습니다. 주변의 보석함에서 잔여 전리품을 회수하십시오.',
    eventTemplateId: undefined,
    eventChoices: undefined,
    treasureReward: {
      gold: 500,
      essence: 150,
      xp: 0,
      items: []
    }
  }
}

// 선택지의 effectType을 ID 및 텍스트 키워드 기반으로 추론하는 헬퍼
export function getChoiceEffectType(choice: GateRunEventChoice): 'stabilize' | 'breakthrough' | 'rescue' | 'analyze' | 'coop' | 'solo' | 'cleanse' | 'scout' {
  if (choice.effectType) return choice.effectType

  const id = choice.id.toLowerCase()

  if (choice.requiresCoop || id.includes('coop')) {
    return 'coop'
  }
  if (choice.requiresSolo || id.includes('solo')) {
    return 'solo'
  }
  if (id.includes('rescue') || id.includes('save') || id.includes('refugee') || id.includes('citizen') || id.includes('hostage')) {
    return 'rescue'
  }
  if (id.includes('cleanse') || id.includes('purify') || id.includes('disinfect')) {
    return 'cleanse'
  }
  if (id.includes('analyze') || id.includes('decode') || id.includes('forecast') || id.includes('foreshadow') || id.includes('weakness')) {
    return 'analyze'
  }
  if (id.includes('scout') || id.includes('radar') || id.includes('recon') || id.includes('search') || id.includes('track') || id.includes('data')) {
    return 'scout'
  }
  if (id.includes('stabilize') || id.includes('bypass') || id.includes('pass') || id.includes('fix') || id.includes('repair') || id.includes('tag') || id.includes('ignore') || id.includes('light') || id.includes('heater') || id.includes('meditate') || id.includes('safe') || id.includes('avoid')) {
    return 'stabilize'
  }
  if (id.includes('breakthrough') || id.includes('dash') || id.includes('smash') || id.includes('force') || id.includes('shatter') || id.includes('strike') || id.includes('charge') || id.includes('crystals') || id.includes('open') || id.includes('loot') || id.includes('fight') || id.includes('extract') || id.includes('leap') || id.includes('clear') || id.includes('rush') || id.includes('speed')) {
    return 'breakthrough'
  }

  return 'stabilize'
}

export function getChoiceLeadsTo(choice: GateRunEventChoice): 'battle' | 'safe' {
  if (choice.leadsTo) return choice.leadsTo

  const id = choice.id.toLowerCase()

  // High-risk/combat/deep-penetration choices
  const isCombatId =
    id.includes('force') ||
    id.includes('follow') ||
    id.includes('open') ||
    id.includes('hunt') ||
    id.includes('break') ||
    id.includes('solve') ||
    id.includes('accept') ||
    id.includes('threaten') ||
    id.includes('rush') ||
    (id.includes('bypass') && id.includes('passage')) || // choice_passage_bypass
    id.includes('dash') ||
    id.includes('smash') ||
    id.includes('strike') ||
    id.includes('charge') ||
    id.includes('crystals') ||
    id.includes('loot') ||
    id.includes('fight') ||
    id.includes('extract') ||
    id.includes('leap') ||
    id.includes('shatter') ||
    id.includes('supplies')

  if (isCombatId) {
    return 'battle'
  }

  return 'safe'
}


