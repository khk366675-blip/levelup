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
    title: '요동치는 보랏빛 왜곡',
    description: '눈앞에서 차원의 틈새가 격렬히 일렁이며 보랏빛 불꽃을 뿜어냅니다. 방치하면 이 구역의 지맥 전체가 붕괴할 것처럼 휘청거립니다.',
    choices: [
      {
        id: 'choice_rift_stabilize',
        label: '불안정한 파동 안정화',
        description: '심호흡을 하고 마력의 흐름을 조율하여 틈새를 부드럽게 억누릅니다. 주변 지맥의 안정을 되찾고 잔류 마력이 손끝에 스며듭니다.',
        riskDelta: -15,
        leadsTo: 'safe',
        immediateReward: { essence: 100, xp: 0, gold: 0, items: [] },
      },
      {
        id: 'choice_rift_force_open',
        label: '심연의 기류 강제 주입',
        description: '무기를 강하게 밀어 넣어 왜곡을 찢어 발깁니다. 공간이 더욱 거칠게 요동치며 불안정해지지만 숨겨진 보상이 드러납니다.',
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
        label: '검은 그을음 흔적을 심층 추적',
        description: '공명하는 어둠의 기운을 쫓아 더욱 위험한 심층으로 추적을 시작합니다.',
        extractionBonusDelta: 8,
        riskDelta: 15,
        leadsTo: 'battle',
      },
      {
        id: 'choice_trace_ignore',
        label: '안정적인 우회 경로 확보',
        description: '불길한 진동에서 멀어져 잔해가 깨끗하게 치워진 안전한 우회 통로로 선회합니다.',
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
        label: '보급상자 뚜껑을 거칠게 개봉',
        description: '먼지 속에 방치된 상자의 틈을 거칠게 열어젖혀 쓸 만한 내용물이 있는지 확인합니다.',
        immediateReward: { gold: 1000, xp: 0, essence: 0, items: [] },
        nextEncounterModifier: 'debuff_accuracy',
      },
      {
        id: 'choice_supply_leave',
        label: '상자를 우회하여 지나치기',
        description: '만일의 위협이 우려되어 상자를 건드리지 않고 조용히 스쳐 지나갑니다.',
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
        label: '제단 앞에서 성스러운 명상',
        description: '은빛 기운의 파동에 동화되어 정신과 신체를 맑고 건강하게 정비합니다.',
        healPercent: 35,
        nextEncounterModifier: 'enemy_speed_up',
      },
      {
        id: 'choice_altar_shatter',
        label: '제단의 동력핵을 무력으로 박살',
        description: '제단 깊숙이 봉인된 마력 제어핵을 강제로 파쇄하여 뿜어져 나오는 정수를 탈취합니다.',
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
        label: '붉은 자국을 따라 어두운 굴로 강습',
        description: '피 냄새 속에 감도는 강한 살기를 추적하며 어두운 통로로 기습 사냥을 개시합니다.',
        addEncounterType: 'elite',
        rewardMultiplierDelta: 0.15,
      },
      {
        id: 'choice_footsteps_hide',
        label: '바위 보강판 뒤에 숨어 숨 돌리기',
        description: '기척을 숨기고 무너진 잔해 아래에서 지친 숨을 몰아쉬며 신체를 추스릅니다.',
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
        label: '감각만 믿고 안개를 돌파',
        description: '시야가 완전히 차단된 안갯속을 향해 무기를 앞세우고 강하게 전진합니다.',
        rewardMultiplierDelta: 0.18,
        nextEncounterModifier: 'debuff_accuracy',
      },
      {
        id: 'choice_fog_bypass',
        label: '측면 갈라진 틈새로 회피 수색',
        description: '불안한 안개 구역을 비껴가기 위해 측면의 갈라진 어두운 동공 방면으로 우회합니다.',
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
        label: '무력으로 보물문 파쇄',
        description: '방출되는 강렬한 마력 반동을 견뎌내며 자물쇠 장치를 무기로 강하게 파괴합니다.',
        hpCostPercent: 15,
        addEncounterType: 'treasure',
      },
      {
        id: 'choice_lock_solve',
        label: '고대 룬 기하학 해석 시도',
        description: '숨을 죽이고 자물쇠에 새겨진 고대 룬의 미세한 공명 주파수를 손 끝으로 조율합니다.',
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
        label: '거울 속 보스의 기운 정밀 관찰',
        description: '거울 너머에 맺힌 보스의 움직임과 마력 기류 파동을 미리 정밀하게 파악하여 전투를 대비합니다.',
        rewardMultiplierDelta: 0.10,
        riskDelta: 10,
      },
      {
        id: 'choice_mirror_shatter',
        label: '거울을 베어 차원 파편 회수',
        description: '불길한 잔상이 아른거리는 거울을 일격에 깨부수고 방출되는 마결정만 회수합니다.',
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
        label: '심연의 마력 서약 흔쾌히 서명',
        description: '주변의 불안정한 기류와 그림자 기운을 자신의 심장 속으로 천천히 영입하여 결속합니다.',
        extractionBonusDelta: 12,
        nextEncounterModifier: 'enemy_atk_up',
      },
      {
        id: 'choice_contract_reject',
        label: '어둠의 의지를 베어 파편 약탈',
        description: '계약을 요구하는 검은 형체의 중심을 무기로 격파하여 흩어지는 마력을 탈취합니다.',
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
        label: '표식의 전략 정보 활용 전진',
        description: '벽에 표시된 사각지대와 매복 루트를 적극 활용하여 조심스럽게 전진합니다.',
        rewardMultiplierDelta: 0.05,
      },
      {
        id: 'choice_mark_ignore',
        label: '표식을 지나쳐 자력 돌파 전술 유지',
        description: '과거의 흔적에 연연하지 않고, 감각을 날카롭게 세워 독자적으로 정면 돌파를 감행합니다.',
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
        label: '학살자가 머무는 방의 붉은 표식 격파',
        description: '무시무시한 경고를 가볍게 무시하고 적의 핵심 수비 병력이 결집한 거점으로 거침없이 파고듭니다.',
        addEncounterType: 'elite',
        rewardMultiplierDelta: 0.30,
      },
      {
        id: 'choice_warning_prepare',
        label: '경고를 감안하여 후퇴로 정비 확보',
        description: '만일의 추격과 기습에 대비해 지나온 퇴로의 장애물을 치우고 방어망을 정비합니다.',
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
        label: '어지러운 파동 속 영감 수용',
        description: '머리를 어지럽히는 충격을 감수하고 깊은 공허의 속삭임을 귀 기울여 경청합니다.',
        nextEncounterModifier: 'silence_player_1t',
      },
      {
        id: 'choice_whisper_refuse',
        label: '정신을 집중해 속삭임 차단',
        description: '의지의 방벽을 단단하게 구축하여 정신을 공격해 오는 잔향을 외부로 퉁겨냅니다.',
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
        label: '떠다니는 정수 마력 방울을 검끝으로 흡수',
        description: '공중에 흐르는 풍부한 마력 방울들을 검끝으로 거두어 신체 회로에 부드럽게 주입합니다.',
        nextEncounterModifier: 'enemy_hp_up',
      },
      {
        id: 'choice_reverb_dispel',
        label: '마력 불꽃을 넓게 흩뜨려 소멸 안정화',
        description: '불안정하게 폭발할 위험이 있는 잔여 마력들을 무기의 궤적으로 넓게 휘둘러 흩어버립니다.',
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
        label: '골드를 아낌없이 주고 물품 거래',
        description: '묵직한 골드 주머니를 건네고 상인이 건네는 차원의 파편 꾸러미를 건네받습니다.',
        immediateReward: { gold: -800, essence: 400, xp: 0, items: [] },
      },
      {
        id: 'choice_merchant_threaten',
        label: '무기에 마력을 싣고 무력 겁박',
        description: '상인의 목덜미에 서슬 퍼런 칼날을 들이밀고 창고에 있는 보물을 전부 내놓으라고 위협합니다.',
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
        label: '그늘 사슬을 전개해 결속 포획',
        description: '마력으로 엮인 그림자 사슬을 가볍게 전개하여 길을 잃은 영혼을 아군의 대열로 귀속시킵니다.',
        extractionBonusDelta: 5,
        immediateReward: { essence: 300, xp: 0, gold: 0, items: [] },
      },
      {
        id: 'choice_shadow_release',
        label: '사슬을 끊어 공명 안정화',
        description: '야수의 영혼을 구속하고 있던 사슬을 베어내어 자유를 주며 교감을 나눕니다.',
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
        label: '폭풍 전막을 방패로 막고 정면 질주',
        description: '몰아치는 칼바람 같은 마력 폭풍의 중심을 향해 정면으로 신체를 날려 돌파합니다.',
        addEncounterType: 'battle',
        rewardMultiplierDelta: 0.22,
      },
      {
        id: 'choice_storm_wait',
        label: '바위 갈라진 틈에 웅크려 쉼표 확보',
        description: '거친 바람이 잦아들 때까지 단단한 암석 틈새에 몸을 숨겨 체력을 보전합니다.',
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
        label: '철갑 파편을 분해해 금속 회수',
        description: '잔해 속에서 마력이 보존된 유용한 합금 파편들을 하나하나 골라내어 가방에 넣습니다.',
        immediateReward: { gold: 600, xp: 0, essence: 0, items: [] },
      },
      {
        id: 'choice_debris_wear',
        label: '갑옷 파편을 가죽 끈으로 엮어 덧댐',
        description: '무거운 장갑 파편들을 가죽 끈으로 어깨와 팔뚝에 덧대어 방어 능력을 강화합니다.',
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
        label: '포효 진동 주파수 정밀 해독',
        description: '대기를 타고 흔들리는 포효의 울림과 불안정한 주파수를 정밀하게 분석해 나갑니다.',
        rewardMultiplierDelta: 0.05,
      },
      {
        id: 'choice_omen_taunt',
        label: '어둠의 심부를 향해 거친 포효 전개',
        description: '심연을 향해 똑같이 거친 포효로 응수하며 보스의 주의를 거세게 자극합니다.',
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
        label: '저주 안개막으로 손을 밀어 넣어 보물 강탈',
        description: '자줏빛 연기로 스며드는 붉은 침식의 위협을 기꺼이 감수하고 상자 깊숙이 손을 집어넣어 보물을 꺼냅니다.',
        immediateReward: { gold: 1500, essence: 500, xp: 0, items: [] },
        nextEncounterModifier: 'curse_damage_taken_up',
      },
      {
        id: 'choice_curse_purify',
        label: '성스러운 기운 정화의 룬 주입',
        description: '시간을 들여 단단한 마력 정화의 결계를 전개하여 상자를 둘러싼 저주 안개를 천천히 몰아냅니다.',
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
        label: '보호막을 켜고 전방 돌진',
        description: '쏟아져 내리는 낙석 파편들을 피하기 위해 신체에 즉석 차단막을 두르고 가속하여 정면 돌파합니다.',
        hpCostPercent: 20,
      },
      {
        id: 'choice_passage_bypass',
        label: '안전한 대피 우회 굴 수색',
        description: '무너지는 천장을 피해 몸을 돌려, 어두운 암석 비탈길 너머에 숨겨진 좁은 우회 굴로 진입합니다.',
        addEncounterType: 'battle',
      },
    ],
  },
  {
    id: 'evt_wandering_hunter',
    title: '어둠 속의 부상당한 사냥꾼 [조우]',
    description: '어두운 그늘 아래 피를 흘리며 주저앉아 있는 사냥꾼을 발견했습니다. 그는 떨리는 눈으로 무기를 쥔 채, 사방에서 흘러나오는 위협적인 기척에 극도로 신경을 곤두세우고 있습니다.',
    choices: [
      {
        id: 'choice_wandering_hunter_help',
        label: '경계를 풀고 비상 물약과 식량을 건넵니다.',
        description: '그의 앞에 조심스럽게 다가가 비상용 치료 붕대와 정제된 에센스를 지급하여 전열을 정비시킵니다.',
        hpCostPercent: 15,
        immediateReward: { essence: 300, xp: 0, gold: 0, items: [] },
      },
      {
        id: 'choice_wandering_hunter_loot',
        label: '그를 자극하지 않고 스쳐 지나치며, 구석의 낙은 보급품 가방을 가로챕니다.',
        description: '부상자와 불필요한 시비를 만들지 않고, 구석 바위틈에 떨어진 그의 비상 식량 배낭을 챙깁니다.',
        immediateReward: { gold: 600, xp: 0, essence: 0, items: [] },
      },
    ],
  },
  {
    id: 'evt_mysterious_rift_apothecary',
    title: '기이한 가면을 쓴 차원 약제사 [조우]',
    description: '보랏빛 로브와 기이한 나선 가면을 쓴 정체불명의 존재가 벽을 짚고 약병들을 배합하고 있습니다. 인기척을 느낀 그가 은밀하고 기괴한 목소리로 차원 침식의 잔해 물약을 권합니다.',
    choices: [
      {
        id: 'choice_apothecary_drink',
        label: '빛을 뿜어내는 정체불명의 푸른 약을 들이킵니다.',
        description: '나선 무늬 약병에 담긴 푸른색 자극성 액체를 단숨에 들이켜 신체 세포를 일시 정렬합니다.',
        healPercent: 30,
        riskDelta: 10,
      },
      {
        id: 'choice_apothecary_buy',
        label: '금이 새겨진 붉은 병의 공명 제어 분말을 구매합니다.',
        description: '금이 장식된 붉은 도자기 병을 사고 상인에게 수수료 골드를 지불합니다.',
        immediateReward: { gold: -500, essence: 0, xp: 0, items: [] },
        nextEncounterModifier: 'player_speed_up_1t',
      },
    ],
  },
  {
    id: 'evt_ancient_rune_trial',
    title: '반짝이는 고대 룬의 석벽 [수수께끼/시험]',
    description: '반투명한 검은 지맥 위에 알 수 없는 고대 룬 문자들이 눈이 시리도록 강렬한 보랏빛 파동을 새겨 넣고 있습니다. 문자는 당신에게 거대한 마력 저항 시험을 제안하는 듯 고동칩니다.',
    choices: [
      {
        id: 'choice_rune_trial_accept',
        label: '석판 중앙에 손을 얹고 정신력을 동화시킵니다.',
        description: '불빛이 반짝이는 석벽 한가운데에 한 손을 갖다 대고 복잡하게 흔들리는 파동 속 기압을 안정화합니다.',
        riskDelta: -15,
        immediateReward: { essence: 200, xp: 0, gold: 0, items: [] },
      },
      {
        id: 'choice_rune_trial_shatter',
        label: '경고를 감안해 룬을 억지로 깨뜨려 붕괴시킵니다.',
        description: '강렬하게 고동치는 석벽의 룬 문자 중심부를 무기로 내리쳐 강제로 분쇄합니다. 사방에 마력 폭풍이 터집니다.',
        riskDelta: 20,
        nextEncounterModifier: 'enemy_atk_up',
      },
    ],
  },
  {
    id: 'evt_greed_scale',
    title: '황금빛 공중 천칭 [수수께끼/시험]',
    description: '어두운 천장 아래 금빛 고대 저울이 허공에 정지해 춤을 추고 있습니다. 한쪽에는 차원 마석 결정이, 다른 한쪽에는 헌터 골드 상자가 아슬아슬하게 무게를 견디며 번뜩입니다.',
    choices: [
      {
        id: 'choice_scale_break',
        label: '저울의 연결고리를 발로 걷어차 양쪽 보상을 다 움켜쥡니다.',
        description: '공중 천칭의 연결 쇠사슬을 무기로 강타하여 양쪽 가방을 모두 강취합니다. 주변 마기가 거칠게 일어납니다.',
        rewardMultiplierDelta: 0.18,
        riskDelta: 18,
      },
      {
        id: 'choice_scale_balance',
        label: '균열의 기류를 불어넣어 저울의 수평을 유지합니다.',
        description: '섬세하게 마력을 유도하여 천칭의 양팔이 정확하게 수평을 유지하도록 안정시킵니다.',
        riskDelta: -12,
        immediateReward: { essence: 120, xp: 0, gold: 0, items: [] },
      },
    ],
  },
  {
    id: 'evt_blood_resonance_altar',
    title: '피의 공명 제단 [자원 거래]',
    description: '축축한 흙바닥에 피비린내를 짙게 풍기는 작은 석조 돌단이 놓여 있습니다. 깊은 수렁에서 몬스터들을 길렀던 심연의 잔향이 헌터의 뜨거운 생명력을 강렬하게 요구하고 있습니다.',
    choices: [
      {
        id: 'choice_blood_altar_feed',
        label: '제단 표면에 손바닥을 밀착하고 생명력을 주입합니다.',
        description: '차갑게 식은 돌단에 손바닥을 대고 끓어오르는 생명 기운의 일부를 제물로 건넵니다.',
        hpCostPercent: 25,
        extractionBonusDelta: 15,
      },
      {
        id: 'choice_blood_altar_scrape',
        label: '마력 실드로 피막을 덮어버린 뒤, 제단의 보석만 긁어냅니다.',
        description: '마력 차단 장치로 제단의 반응을 억제하면서, 돌단 기단부에 은밀하게 박힌 보석만 조심스레 긁어냅니다.',
        riskDelta: -10,
        immediateReward: { essence: 180, xp: 0, gold: 0, items: [] },
      },
    ],
  },
  {
    id: 'evt_essence_exchange',
    title: '뒤틀린 마도 공명기 [자원 거래]',
    description: '헌터들의 버려진 고장 난 전술 장치들과 차원의 기공이 융합되어 기괴한 화폐 변환 주파수를 내는 장치입니다. 골드와 마석 에너지를 상호 전환해 줍니다.',
    choices: [
      {
        id: 'choice_exchange_essence_to_gold',
        label: '수집한 마석 정수를 융합 슬롯에 털어 넣습니다.',
        description: '품에 지니고 있던 에센스 조각들을 장치 융합 구멍에 쏟아부어 전술 화폐를 뱉어내게 만듭니다.',
        immediateReward: { gold: 1200, essence: -300, xp: 0, items: [] },
      },
      {
        id: 'choice_exchange_gold_to_essence',
        label: '연소 필터 구멍에 다량의 골드를 투입합니다.',
        description: '금화들을 가열 필터 구멍에 밀어 넣어 연소시키고, 피어오르는 맑은 마력 가스를 심호흡합니다.',
        immediateReward: { gold: -800, essence: 600, xp: 0, items: [] },
      },
    ],
  },
  {
    id: 'evt_collapsing_rift_ceiling',
    title: '지반 붕괴와 폭발 낙석 [미니 위기]',
    description: '찌지직거리는 굉음이 벽을 메아리치더니 천장의 견고하던 강철 지지대가 꺾여 거대한 흙더미와 낙석들이 엄청난 속도로 떨어지기 시작합니다!',
    choices: [
      {
        id: 'choice_ceiling_dash',
        label: '마력 방어막을 켜고 잔해를 몸으로 뚫고 돌진합니다.',
        description: '머리 위로 쏟아지는 자갈และ 낙석을 방패로 비껴내며 순간적인 마력 대쉬로 구간을 통과합니다.',
        hpCostPercent: 15,
        riskDelta: -10,
      },
      {
        id: 'choice_ceiling_back',
        label: '낙하 궤적을 보고 뒤쪽 통로로 급히 몸을 날려 피합니다.',
        description: '재빠르게 뒤로 몸을 날려 낙석이 집중되는 구역을 회피합니다. 다만 돌아서 가야 할 듯합니다.',
        leadsTo: 'battle',
      },
    ],
  },
  {
    id: 'evt_creeping_mana_void',
    title: '침식된 마력 진공 폭풍 [미니 위기]',
    description: '방 내부의 마력이 순식간에 중심부 소용돌이로 급격하게 소실되며 아군 신체의 마력 회로가 텅 비어갑니다. 숨소리조차 차갑게 제한되는 지옥 같은 진공 상태입니다.',
    choices: [
      {
        id: 'choice_mana_void_burn',
        label: '숨겨진 직업 에너지를 내열 연소하여 신체 장벽을 세웁니다.',
        description: '가슴 깊숙이 품어둔 직업의 잠재력을 불태워 신체 마력 순환선을 임시로 활성화합니다.',
        hpCostPercent: 10,
        nextEncounterModifier: 'enemy_hp_down',
      },
      {
        id: 'choice_mana_void_wait',
        label: '비교적 안개가 모인 암석 후방의 구멍을 향해 기어 들어갑니다.',
        description: '비교적 공기가 옅게 남아 있는 바위 틈바구니 구멍으로 납작 엎드려 진공이 풀릴 때까지 대기합니다.',
        riskDelta: 12,
      },
    ],
  },
  {
    id: 'evt_secret_waterfall_cave',
    title: '마력 전류 폭포의 틈새 [탐색/환경]',
    description: '지하 동굴 천장을 가르며 푸른 전류가 격렬하게 흐르는 마력수 폭포가 흘러내립니다. 폭포의 배후 틈으로 아주 은근하게 강력한 보물 상자 고유의 은빛 진동이 감지됩니다.',
    choices: [
      {
        id: 'choice_waterfall_push',
        label: '전류의 폭포막을 검으로 가르며 강하게 안으로 돌진합니다.',
        description: '짜릿한 전류 자극의 통증을 견디며 마력 폭포 장벽의 갈라진 틈새 안쪽으로 거침없이 파고듭니다.',
        hpCostPercent: 10,
        addEncounterType: 'treasure',
      },
      {
        id: 'choice_waterfall_pass',
        label: '폭포에 근접하지 않고 정돈된 우회 레일을 걷습니다.',
        description: '보물의 유혹을 떨쳐내고, 폭포와 격리된 안전한 비탈길 우회 레일을 조심스럽게 걸어갑니다.',
        riskDelta: -8,
      },
    ],
  },
  {
    id: 'evt_sealing_door_gate',
    title: '어둠의 양갈래 갈림문 [탐색/환경]',
    description: '구획 중앙에 기이한 고대 기호들이 새겨진 분기점이 나타납니다. 왼쪽은 묵직한 고철 대문으로 피비린내와 거친 짐승 소리가 새어 나오며, 오른쪽은 은은한 백색 빛이 길잡이를 하는 룬 문자 통로입니다.',
    choices: [
      {
        id: 'choice_sealing_door_left',
        label: '피 냄새가 진동하는 왼쪽 고철 철문을 부수고 진입합니다.',
        description: '기다랗게 새어 나오는 피 냄새를 쫓아 왼쪽 대문의 녹슨 빗장을 힘차게 걷어차 부수고 진입합니다.',
        riskDelta: 15,
        addEncounterType: 'elite',
      },
      {
        id: 'choice_sealing_door_right',
        label: '오른쪽의 은은한 백색 룬 통로를 따라 은밀하게 잠입합니다.',
        description: '오른쪽의 차분하게 빛나는 룬 문양을 길잡이 삼아 발걸음을 최대로 줄이고 가만히 미끄러져 전진합니다.',
        riskDelta: -8,
      },
    ],
  },
  {
    id: 'evt_abyssal_forbidden_seal',
    title: '🚨 금기의 심연 봉인문 [치명적 위험]',
    description: '피와 마기가 거친 격풍처럼 폭발하는 칠흑의 대문이 가로막고 있습니다. 문 한가운데는 사냥꾼 협회의 고선명 위험 낙인이 이글이글 불타고 있습니다. "사망 예고: 이 방 너머의 중압감과 극독은 사냥꾼의 뼈까지 불사른다. 생명력이 취약하다면 진입하지 말라." **[🚨 경고: 이 너머로 진행하는 선택은 극도의 치명적인 생명력 손실을 유발하여 사망에 이를 수 있습니다.]**',
    choices: [
      {
        id: 'choice_forbidden_seal_force',
        label: '⚠️ 마력을 극한으로 방어 상태에 주입하고 붉은 봉인을 무력 파쇄합니다.',
        description: '봉인의 폭발 반사 피해를 온몸으로 견디며 심원 최심부를 강제 돌파 기습합니다. **(⚠️ 치명적 위험: 현재 HP의 50%를 잃고 정예 전투 구역으로 이어집니다. 생명력이 부족하면 즉사할 수 있습니다.)**',
        hpCostPercent: 50,
        leadsTo: 'battle',
        addEncounterType: 'elite',
        rewardMultiplierDelta: 0.45,
        riskDelta: 30,
      },
      {
        id: 'choice_forbidden_seal_bypass',
        label: '위험 신호를 수용해 봉인문에서 멀어져 안전한 붕괴 우회로를 찾습니다.',
        description: '위험 경고를 즉각 수용하고 뒤로 물러서서, 환기용으로 방치된 좁고 비탈진 틈바구니로 안전하게 기어 전진합니다.',
        leadsTo: 'safe',
        riskDelta: -10,
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
        { name: '안전한 모닥불', desc: '따뜻한 온기가 감도는 모닥불 주위에서 휴식을 취하며 다친 몸과 상처를 보살핍니다.' },
        { name: '마력의 푸른 온천', desc: '흘러넘치는 차원의 맑은 마력 온천수에 깊이 몸을 담가 피로를 씻어내고 대지에 흐르는 잔류 마력을 흡수합니다.' },
        { name: '그림자의 밀실', desc: '군주의 그림자 기운이 깃든 장벽이 사방을 안락하게 감싸며 헌터의 상처를 치유하고 추출 기류를 가다듬어 줍니다.' }
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
      description = '강력한 고대 마력의 흔적이 은은하게 소용돌이칩칩니다. 다음 그림자 추출의 성공 가능성을 한층 높여줄 것입니다.'
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
