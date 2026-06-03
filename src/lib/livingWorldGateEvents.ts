import { GateRank, GateRunEncounterType, GateRunEventChoice, GateRunRewardBundle } from './types'

export interface WorldGateEventChoice extends GateRunEventChoice {
  id: string
  label: string
  description: string
  requiresCoop?: boolean
  requiresSolo?: boolean
  conditionHint?: string
  
  // Coop specific overrides
  coopLabel?: string
  coopDescription?: string
  coopRiskDelta?: number
  coopRewardMultiplierDelta?: number
  coopImmediateReward?: Partial<GateRunRewardBundle>
  coopNextEncounterModifier?: string
}

export interface WorldGateEventEncounter {
  id: string
  title: string
  description: string
  minGrade?: GateRank
  tags?: string[]
  weight?: number
  choices: WorldGateEventChoice[]
}

export interface WorldGateEventPack {
  id: string
  regionId: string
  subRegionId?: string
  localeName: string
  tags?: string[]
  timelineLabels: string[]
  introBriefings: string[]
  threatBriefings: string[]
  loveCallBriefings: string[]
  combatSceneTitles?: string[]
  eventEncounters: WorldGateEventEncounter[]
  bossForeshadowings: string[]
  coopLines: string[]
  soloWarnings: string[]
  clearedLines: string[]
  failedLines: string[]
}

export const REGIONAL_EVENT_PACKS: Record<string, WorldGateEventPack> = {
  // === 1. 한국의 지역들 ===
  'seoul': {
    id: 'pack_seoul',
    regionId: 'kr',
    subRegionId: 'seoul',
    localeName: '서울',
    timelineLabels: ['봉쇄된 도심 외곽', '무너진 지하 통로', '협회 임시 전초기지', '균열 핵심 붕괴지', '차원 결전처'],
    introBriefings: [
      '서울 도심 한복판 빌딩 숲에 대규모 마력 크랙이 발생했습니다.',
      '수도 지하철 2호선 지하 터널 심부로 이계 군세가 역류 중입니다.',
    ],
    threatBriefings: [
      '오염 물질이 지하 환기구를 타고 유출되어 도심 대피 압박이 심각합니다.',
      '헌터협회 봉쇄선이 빌딩 파편과 함께 파손되어 몬스터 매복이 도처에 깔려 있습니다.',
    ],
    loveCallBriefings: [
      '대한민국 협회 본부 근처의 붕괴 위기입니다. 공조 헌터의 적시 개입이 시급합니다.',
    ],
    eventEncounters: [
      {
        id: 'evt_kr_seoul_subway',
        title: '지하철 대피로 확보',
        description: '지하철 역사 출구에 균열이 밀집하여 피난 중인 시민들이 고립되었습니다.',
        choices: [
          {
            id: 'choice_seoul_subway_save',
            label: '피난민 퇴로 즉시 확보',
            description: '무너진 잔해 아래 고립된 피난민들을 안전 구역으로 질서정연하게 피신시키고 퇴로를 확보합니다.',
            riskDelta: -15,
            leadsTo: 'safe',
            immediateReward: { xp: 150, gold: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_seoul_subway_dash',
            label: '균열 깊은 중추 진격',
            description: '어둠 속 깊숙이 일렁이는 붉은 눈빛의 적 지휘부를 찾아 단숨에 검을 겨누며 중추로 전진합니다.',
            riskDelta: 20,
            leadsTo: 'battle',
            rewardMultiplierDelta: 0.25
          },
          {
            id: 'choice_seoul_subway_coop',
            label: '협회 지원조 호출',
            description: ' Named 헌터에게 현장 인도를 엄호 사격으로 맡긴 채, 균열 내부로 조용히 발을 들여놓습니다.',
            requiresCoop: true,
            conditionHint: '공조 중인 Named 헌터가 필요합니다.',
            leadsTo: 'safe',
            coopRiskDelta: -25,
            coopImmediateReward: { gold: 500, xp: 0, essence: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_kr_seoul_building',
        title: '빌딩 외벽의 균열 낙인',
        description: '오피스 빌딩 유리 외벽에 붉은 마력 낙인이 새겨져 공명 폭주를 준비하고 있습니다.',
        choices: [
          {
            id: 'choice_seoul_building_analyze',
            label: '낙인 주파수 정밀 분석',
            description: '주파수 분석 장치를 외벽 룬 표면에 부착하여 공명 흐름의 불균형을 차분하게 안정시키고 약점을 분석합니다.',
            riskDelta: -10,
            extractionBonusDelta: 6
          },
          {
            id: 'choice_seoul_building_smash',
            label: '마력 핵의 물리적 분쇄',
            description: '외벽의 마력 핵에 강한 물리 타격을 가해 산산조각 내고 뿜어져 나오는 정수를 포집합니다.',
            riskDelta: 15,
            immediateReward: { essence: 300, xp: 0, gold: 0, items: [] }
          },
          {
            id: 'choice_seoul_building_solo',
            label: '단독 우회 돌파',
            description: '단독 기동 상태인 만큼 엄호 없이 측면 비상계단을 타고 빠르게 전방 통로로 우회하여 돌파합니다.',
            requiresSolo: true,
            conditionHint: '단독 원정 상태에서만 선택 가능합니다.',
            riskDelta: 5,
            immediateReward: { gold: 600, xp: 0, essence: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_seoul_hunter_encounter',
        title: '신사동 골목의 방랑 헌터 [조우]',
        description: '무너진 콘크리트 잔해 뒤쪽에서 지맥 가스가 스며 나오는 가운데, 헬멧이 깨진 헌터가 기댄 채 칼자루를 짚고 신음하고 있습니다.',
        choices: [
          {
            id: 'choice_seoul_hunter_help',
            label: '비상 치료 붕대와 식수 공급',
            description: '헌터의 마력 순환 회복을 돕고 협회 전술 노트를 교환하여 치료를 보조합니다.',
            hpCostPercent: 10,
            immediateReward: { essence: 250, xp: 0, gold: 0, items: [] }
          },
          {
            id: 'choice_seoul_hunter_leave',
            label: '길을 서둘러 가방만 획득 후 복귀',
            description: '근처 수풀에 흘러내린 보급 봉투의 마력 잔해만 은밀히 가로채며 전방으로 신속히 돌파합니다.',
            immediateReward: { gold: 500, xp: 0, essence: 0, items: [] }
          }
        ]
      }
    ],
    bossForeshadowings: [
      '도심 중심부가 보랏빛 기류와 빌딩 파편으로 기괴한 보스 제단을 이루고 있습니다.',
    ],
    coopLines: [
      '송민우: "서울 봉쇄선을 끝까지 고수하겠다. 군주에게 닿기 전에 잔챙이들을 쓸어라!"',
      '백윤호: "빌딩 지붕 쪽 마력 반응은 내가 맡겠네. 정면은 자네가 뚫어!"',
    ],
    soloWarnings: [
      '경고: 서울 시가지의 밀집 붕괴도가 한계입니다. 지원군 없는 돌파는 고위험을 초래합니다.',
    ],
    clearedLines: ['서울 도심의 균열 핵이 마침내 진정되고 봉쇄선의 시민들이 환호합니다.'],
    failedLines: ['서울 시가지 방어망이 붕괴되어 차원 역류가 발생했습니다.']
  },
  'incheon': {
    id: 'pack_incheon',
    regionId: 'kr',
    subRegionId: 'incheon',
    localeName: '인천',
    timelineLabels: ['인천 항만 외곽', '물류창고 사각지대', '해수가 고인 부두', '해무 속 침식 크레인', '심해 핵 심층부'],
    introBriefings: [
      '인천 물류창고 일대가 해수 침식과 함께 위상 왜곡에 휩싸였습니다.',
      '서해안 해무 속에서 붉은 눈을 번뜩이는 거대 개체들의 실루엣이 감지되었습니다.',
    ],
    threatBriefings: [
      '방치된 수입 컨테이너들이 몬스터들의 산란처로 악용되어 돌발 격돌 위험이 큽니다.',
    ],
    loveCallBriefings: [
      '서해안 관문의 오염 억제가 한계에 다다랐습니다. 인천 긴급 원정에 동행하십시오.',
    ],
    eventEncounters: [
      {
        id: 'evt_kr_incheon_mist',
        title: '해무 속 구조 신호',
        description: '자욱한 바다 안개 너머에서 침식된 무전기를 타고 헌터의 다급한 목소리가 들립니다.',
        choices: [
          {
            id: 'choice_incheon_mist_rescue',
            label: '신호지로 즉시 돌입 수색',
            description: '소리치는 좌표의 해수 늪으로 뛰어들어 경계를 단단히 지탱하고 대원을 안전하게 구출합니다.',
            riskDelta: 15,
            immediateReward: { gold: 700, xp: 0, essence: 0, items: [] },
            nextEncounterModifier: 'debuff_accuracy'
          },
          {
            id: 'choice_incheon_mist_bypass',
            label: '우회하여 안개 통과',
            description: '안개 낀 수로를 돌아 침식 핵 중심으로 발소리를 줄이고 신속하게 기동합니다.',
            riskDelta: -5,
            immediateReward: { xp: 100, gold: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_incheon_mist_scout',
            label: '협력 대원 정찰 정밀 지시',
            description: ' Named 헌터의 레이더 좌표 정보를 신뢰하여 우회 차단망을 영리하게 구축합니다.',
            requiresCoop: true,
            conditionHint: '협력 사냥꾼이 존재해야 지시가 가능합니다.',
            coopRiskDelta: -15,
            coopImmediateReward: { essence: 200, xp: 0, gold: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_kr_incheon_cargo',
        title: '컨테이너 봉인물',
        description: '쇠사슬로 감겨 이계의 푸른 마력을 강하게 뿜는 특수 군수 컨테이너를 발견했습니다.',
        choices: [
          {
            id: 'choice_incheon_cargo_open',
            label: '봉인 강제 해제 개봉',
            description: '컨테이너의 굳게 닫힌 철문을 일격에 무너뜨려 강적의 살기와 보물 상자를 한 번에 개방합니다.',
            riskDelta: 20,
            rewardMultiplierDelta: 0.30
          },
          {
            id: 'choice_incheon_cargo_tag',
            label: '협회 귀속 태그 부착',
            description: '장치 봉인을 훼손하지 않은 채 관리용 룬 코드를 부착하여 안전하게 협회에 인계합니다.',
            riskDelta: -5,
            immediateReward: { gold: 400, xp: 0, essence: 0, items: [] }
          }
        ]
      }
    ],
    bossForeshadowings: [
      '부두 거대 크레인의 강철 뼈대가 파도 위에서 침식형 촉수로 기괴하게 요동치고 있습니다.',
    ],
    coopLines: [
      '임태규: "부둣가 안개가 너무 짙어. 시야 확보 장비 가동할 테니 내 발걸음을 따라와라."',
    ],
    soloWarnings: [
      '경고: 바다 저편에서 군주급 마력 전조가 불어옵니다. 독식은 차가운 심해의 죽음뿐입니다.',
    ],
    clearedLines: ['인천항을 가로막던 해무가 걷히고 차원의 해수가 신속히 격리되었습니다.'],
    failedLines: ['인천 전선이 파도와 차원의 왜곡에 삼켜져 항만 일대가 오염 지대로 주저앉았습니다.']
  },
  'busan': {
    id: 'pack_busan',
    regionId: 'kr',
    subRegionId: 'busan',
    localeName: '부산',
    timelineLabels: ['방파제 차단선', '테트라포드 마력대', '해안 절벽 붕괴로', '어두운 해안 동굴', '파도 융합 심원'],
    introBriefings: [
      '부산 영도 절벽 및 해안 방파제 너머로 침식성 소용돌이가 해류를 비틀어놓고 있습니다.',
    ],
    threatBriefings: [
      '해안가 피난 연안에 밀집한 피난선들의 생존 전선 확보가 절대적으로 불리합니다.',
    ],
    loveCallBriefings: [
      '방파제가 무너지고 항만 괴수 무리가 상륙을 시작했습니다. 즉각적인 공조 지원을 요청합니다.',
    ],
    eventEncounters: [
      {
        id: 'evt_kr_busan_refugee',
        title: '피난선 방어선 사수',
        description: '괴수들이 방파제 테트라포드를 타고 연안 피난 기지로 도약하고 있습니다.',
        choices: [
          {
            id: 'choice_kr_busan_defend',
            label: '방벽 고수 및 시민 호송',
            description: '무너져가는 방어벽 틈새를 마력 결계로 굳건히 지탱하여 피난 구역을 사수합니다.',
            riskDelta: -15,
            immediateReward: { xp: 200, gold: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_kr_busan_strike',
            label: '괴수 둥지 선제 격파',
            description: '연안 동굴 아래의 괴수 서식 중추를 정면 타격하여 둥지를 강제로 무력화합니다.',
            riskDelta: 20,
            immediateReward: { gold: 1000, xp: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_kr_busan_coop_def',
            label: '공조 병력 분산 방어',
            description: ' Named 헌터 대원들과 미리 맞춘 주파수 장막 결계로 방파제 측면을 꼼꼼하게 덮습니다.',
            requiresCoop: true,
            conditionHint: '배치 가능한 Named 헌터가 부족합니다.',
            coopRiskDelta: -30,
            coopImmediateReward: { essence: 100, xp: 0, gold: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_kr_busan_breakwater',
        title: '무너진 방파제',
        description: '파괴된 방파제 틈으로 이계의 붉은 액체가 새어 나와 토착 어종을 변이시키고 있습니다.',
        choices: [
          {
            id: 'choice_busan_bw_repair',
            label: '임시 속성 방벽 봉인',
            description: '강력한 전류 에너지를 집중 방출하여 방파제의 미세한 틈새들을 단단하게 응축해 복구합니다.',
            riskDelta: -10,
            immediateReward: { essence: 250, xp: 0, gold: 0, items: [] }
          },
          {
            id: 'choice_busan_bw_charge',
            label: '변이 야수 무리 돌파',
            description: '기괴하게 변이된 개체들이 쏟아지는 통로의 정면을 돌파하여 보급 기어를 낚아챕니다.',
            riskDelta: 15,
            immediateReward: { gold: 600, xp: 0, essence: 0, items: [] }
          }
        ]
      }
    ],
    bossForeshadowings: [
      '해안 동굴 안쪽 절벽에서 바닷물과 결합한 고대 심해 지배자가 거센 폭풍을 부르고 있습니다.',
    ],
    coopLines: [
      '최수인: "바다의 마력 흐름이 불안정해요. 파도가 몰아칠 때 뒤를 지키겠습니다!"',
    ],
    soloWarnings: [
      '경고: 바닷바람에 섞인 살기가 극에 달했습니다. 아군 없이 파도를 정면으로 맞는 건 무모합니다.',
    ],
    clearedLines: ['부산 앞바다의 침식 소용돌이가 가라앉고 항만 안정이 성공적으로 회복되었습니다.'],
    failedLines: ['해일과 변이 몬스터 무리가 방어벽을 깨부수고 도심 진입에 성공했습니다.']
  },
  'jeju': {
    id: 'pack_jeju',
    regionId: 'kr',
    subRegionId: 'jeju',
    localeName: '제주',
    timelineLabels: ['등산로 통제선', '현무암 미로 구역', '억새숲 마력 크랙', '백록담 안개길', '분화구 이계 핵'],
    introBriefings: [
      '한라산 백록담 정상을 기점으로 지맥 마력이 융합하여 기이한 검은 현무암 균열로 분출되었습니다.',
    ],
    threatBriefings: [
      '화산 기공에서 흘러나오는 유독 마력 가스로 인해 전 장비의 공조 통신이 차단되었습니다.',
    ],
    loveCallBriefings: [
      '백록담의 기이한 전조들이 한계를 넘어 폭주하려 합니다. 한라산 침식의 즉시 제거를 보조하십시오.',
    ],
    eventEncounters: [
      {
        id: 'evt_kr_jeju_gate',
        title: '현무암 봉인문',
        description: '지하 동굴 깊은 곳, 현무암 돌벽에 새겨진 고대 기하학 무늬 봉인이 길을 막고 있습니다.',
        choices: [
          {
            id: 'choice_jeju_gate_decode',
            label: '고대 문양 해석 시도',
            description: '현무암 돌벽에 흐르는 마력 결을 정밀하게 해독하여 무소음 개방에 도전합니다.',
            riskDelta: -15,
            extractionBonusDelta: 8
          },
          {
            id: 'choice_jeju_gate_force',
            label: '봉인의 강제 물리 타격',
            description: '돌벽 뒤편에 가려진 핵심 마력 동력구를 무기 일격으로 강타하여 강제로 통과합니다.',
            riskDelta: 20,
            immediateReward: { gold: 900, xp: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_jeju_gate_bypass',
            label: '우회 절벽 우회로 탐색',
            description: '현무암 절벽에 위태롭게 솟은 비탈길을 확인하여 천천히 정밀하게 전진합니다.',
            riskDelta: -5,
            immediateReward: { xp: 100, gold: 0, essence: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_kr_jeju_cave',
        title: '해안 동굴의 공명',
        description: '에메랄드빛 마력 광석들이 해안 만조 굴바닥에 깔려 은은하게 떨리고 있습니다.',
        choices: [
          {
            id: 'choice_jeju_cave_meditate',
            label: '광석 틈에서 명상 정비',
            description: '광석에서 맑게 퍼지는 차분한 공명을 호흡하여 신체 피로를 씻어냅니다.',
            healPercent: 40,
            riskDelta: -5
          },
          {
            id: 'choice_jeju_cave_crystals',
            label: '이계 마력 광석 집중 채굴',
            description: '동굴 지맥 깊숙이 박힌 고에너지 마석 결정들을 도구를 이용해 섬세하게 채굴합니다.',
            riskDelta: 15,
            immediateReward: { essence: 350, xp: 0, gold: 0, items: [] }
          }
        ]
      }
    ],
    bossForeshadowings: [
      '백록담 분화구 중심부의 얼어붙은 연못에서 거대 기형 정령 지배자의 노호성이 사방으로 뻗칩니다.',
    ],
    coopLines: [
      '정동석: "현무암 지형은 돌발 붕괴가 많다. 내가 전위를 잡을 테니 뒤를 조심해서 전진해라."',
    ],
    soloWarnings: [
      '경고: 한라산의 지맥 폭주 강도가 예사롭지 않습니다. 홀로 지맥 중심에 뛰어드는 건 화산 낙뢰 자살행위입니다.',
    ],
    clearedLines: ['백록담의 기괴한 균열 핵이 봉인되며 화산 지맥이 평온한 안정을 되찾았습니다.'],
    failedLines: ['제주 오름 전체에 대규모 차원 분열이 확산되어 영구적 마력 불모지로 전락했습니다.']
  },
  'kr': {
    id: 'pack_kr_fallback',
    regionId: 'kr',
    subRegionId: 'kr',
    localeName: '대한민국',
    timelineLabels: ['경계 임시 초소', '이상 마력 통로', '균열 전방 지대', '침식 고밀도 지역', '중심 핵 결전 구역'],
    introBriefings: [
      '국내 국지적 균열 활성화 수치가 가파르게 상승하여 예비 전력이 동원되었습니다.',
    ],
    threatBriefings: [
      '인근 연안 및 내륙 산악 지대를 통한 마력 오염 유출 전조가 짙어지고 있습니다.',
    ],
    loveCallBriefings: [
      '국내 방어선의 잔류 게이트 압력이 급증했습니다. 신속히 정화를 도와 전선을 안정시키십시오.',
    ],
    eventEncounters: [
      {
        id: 'evt_kr_fallback_radar',
        title: '마력 레이더 오작동',
        description: '균열 깊은 숲에서 협회의 휴대용 마력 레이더가 붉은 경고를 울리며 미쳐 날뜁니다.',
        choices: [
          {
            id: 'choice_kr_radar_fix',
            label: '주파수 수동 조율 복구',
            description: '어지럽게 흔들리는 레이더 회로 주파수를 조율하여 주위의 몬스터 매복 지점을 영리하게 비껴갑니다.',
            riskDelta: -15,
            immediateReward: { gold: 300, xp: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_kr_radar_ignore',
            label: '기기 강제 분쇄 파괴',
            description: '시끄럽게 방전되는 장비를 밟아 분쇄하고, 내장된 특수 잔류 배터리에서 그림자 동력원을 탈취합니다.',
            riskDelta: 10,
            immediateReward: { essence: 200, xp: 0, gold: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_kr_fallback_scout',
        title: '협회 정찰병 구출',
        description: '몬스터 수풀 사이에 다리가 낀 채 고립되어 덜덜 떨고 있는 협회 정찰 헌터를 발견했습니다.',
        choices: [
          {
            id: 'choice_kr_scout_save',
            label: '구조 후 대피 유도',
            description: '부상 대원에게 신속한 지혈 처치를 적용한 뒤 후방 기지 안전지대까지 엄호합니다.',
            riskDelta: -10,
            immediateReward: { xp: 150, gold: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_kr_scout_supplies',
            label: '정찰병의 예비 배낭 징수',
            description: '헌터의 소유였던 군용 보급 배낭을 신속히 회수하여 가방에 담고 앞길을 서두릅니다.',
            riskDelta: 15,
            immediateReward: { gold: 500, xp: 0, essence: 0, items: [] }
          }
        ]
      }
    ],
    bossForeshadowings: [
      '지하 동굴의 기이한 석순들이 붉은 피를 머금으며 기괴한 거인의 골격으로 승화 중입니다.',
    ],
    coopLines: [
      '송민우: "한국 헌터들의 지원을 신뢰하십시오. 뒤는 든든합니다!"',
    ],
    soloWarnings: [
      '경고: 단독 원정은 협회의 긴급 매뉴얼 제3조 위반 상황입니다. 리스크가 배가됩니다.',
    ],
    clearedLines: ['자국 영토 내의 마력 분열이 일시적으로 제어되어 안정을 확보했습니다.'],
    failedLines: ['국내 국지 방어선이 침하하며 협회 본부에 비상이 선포되었습니다.']
  },

  // === 2. 주요 타국 러브콜 및 원정 지역 ===
  'us': {
    id: 'pack_us',
    regionId: 'us',
    localeName: '미국',
    timelineLabels: ['도시 붕괴 봉쇄선', '8차선 고속도로 잔해', '맨해튼 시가지', '펜타곤 벙커 초입', '초대형 차원 중심'],
    introBriefings: [
      '뉴욕 타임스스퀘어 및 맨해튼 상공을 가르는 전례 없는 대형 이계 균열이 발생했습니다.',
    ],
    threatBriefings: [
      '미 연방군 장갑차선이 종잇장처럼 구겨져 일반 통신 및 전술 위성이 불통 상태입니다.',
    ],
    loveCallBriefings: [
      '연방 사냥꾼 전선이 심대한 타격을 받았습니다. 국가 비상사태 하에 긴급 참전을 공식 요청합니다.',
    ],
    eventEncounters: [
      {
        id: 'evt_us_highway',
        title: '고속도로 붕괴와 차단선',
        description: '허드슨강 방면 8차선 고속도로 상판이 무너지며 야수들이 미 기동대를 압박합니다.',
        choices: [
          {
            id: 'choice_us_highway_repair',
            label: '장갑 보급 바리케이드 사수',
            description: '연방군 기갑 초소의 파손된 철벽 구조물을 신속 복구하여 전방 통제선을 단단히 사수합니다.',
            riskDelta: -15,
            immediateReward: { xp: 200, gold: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_us_highway_dash',
            label: '붕괴 교각 아래로 강철 점프',
            description: '무너진 고속도로 상판 밑 어두운 크랙 심부로 뛰어내려 낙하한 군용 보강 함을 가로챕니다.',
            riskDelta: 20,
            immediateReward: { gold: 900, xp: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_us_highway_coop',
            label: '현지 S급 헌터 전열 인계',
            description: ' Named 헌터 소대의 중장갑 전위 돌파 기동 뒤를 바짝 따라붙어 신속하게 이계를 통과합니다.',
            requiresCoop: true,
            conditionHint: '미국 전선에 대기 중인 Named 헌터가 필요합니다.',
            coopRiskDelta: -30,
            coopImmediateReward: { essence: 150, xp: 0, gold: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_us_silent',
        title: '대피 방송이 끊긴 구역',
        description: '사이렌 경보만 요란한 뉴욕 월가 모퉁이 지하철 입구에서 긁는 마찰음이 들립니다.',
        choices: [
          {
            id: 'choice_us_silent_search',
            label: '생존 금융 시민 수색구출',
            description: '지하 대피 통제실의 잠긴 기압 격벽을 베어 열고, 고립된 피난민들의 탈출을 직접 엄호합니다.',
            riskDelta: 10,
            immediateReward: { gold: 700, xp: 100, essence: 0, items: [] }
          },
          {
            id: 'choice_us_silent_speed',
            label: '마력 신호 추적에 전념',
            description: '다급한 무전을 꺼버린 채, 월스트리트 빌딩 단층의 보랏빛 마기 안개 중심부를 조용히 겨냥합니다.',
            riskDelta: -10,
            nextEncounterModifier: 'buff_speed'
          }
        ]
      }
    ],
    bossForeshadowings: [
      '센트럴 파크 전체가 거대한 검은 결정에 오염되어 게이트의 지배자가 펄럭이고 있습니다.',
    ],
    coopLines: [
      '토마스 리드: "웰컴 투 뉴욕. 내 강철 방패 뒤에 바짝 붙어라. 뒤는 걱정 말고 딜에 집중해!"',
    ],
    soloWarnings: [
      '경고: 미국의 붕괴 압력은 한국의 4배입니다. 아군 지원이 없으면 뼈도 추리지 못할 것입니다.',
    ],
    clearedLines: ['맨해튼 상공의 위상 균열이 성공적으로 격리되었습니다.'],
    failedLines: ['미국 동부 전선이 괴물들의 아성에 무너져 내렸습니다.']
  },
  'uk': {
    id: 'pack_uk',
    regionId: 'uk',
    localeName: '영국',
    timelineLabels: ['런던 템스 수변로', '지하 묘지 묘궁', '시내 봉쇄 철책선', '기사단 룬 홀', '안개 결전처'],
    introBriefings: [
      '템스강 주변에 짙게 깔린 영적 해무를 타고 고대 기사단 몬스터들이 실체화되기 시작했습니다.',
    ],
    threatBriefings: [
      '짙은 안개로 인해 헌터들의 공간 인식 능력이 왜곡되어 근접 매복 확률이 상승했습니다.',
    ],
    loveCallBriefings: [
      '영국 왕실 수호 봉인이 파손되어 런던 전체가 침식되기 직전입니다. 참전을 공조해 주십시오.',
    ],
    eventEncounters: [
      {
        id: 'evt_uk_templar',
        title: '안개 속 기사단의 흔적',
        description: '이끼 낀 오랜 돌벽에 은빛 서약 룬이 불길하게 빛나며 고대의 기운을 갈구합니다.',
        choices: [
          {
            id: 'choice_uk_templar_track',
            label: '은빛 룬의 잔향 추적',
            description: '이끼 낀 돌벽의 룬 문자열에 검끝을 대고 마력 파동을 미세하게 유도하여 안개를 정화합니다.',
            riskDelta: -15,
            extractionBonusDelta: 6
          },
          {
            id: 'choice_uk_templar_shatter',
            label: '룬의 주술적 강제 봉인',
            description: '벽에 부착된 은빛 성약 마석 결정을 무기로 타격하여 산산조각 내고 파편을 징수합니다.',
            riskDelta: 15,
            immediateReward: { essence: 300, xp: 0, gold: 0, items: [] }
          },
          {
            id: 'choice_uk_templar_coop',
            label: '현지 안개 탐색 마력 의존',
            description: ' Named 헌터의 음파 탐지 결계 파장에 아군의 이동 신호를 조율하여 안개를 통과합니다.',
            requiresCoop: true,
            conditionHint: '영국 작전공조 중인 Named 헌터가 필요합니다.',
            coopRiskDelta: -30,
            coopImmediateReward: { gold: 400, xp: 0, essence: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_uk_fog',
        title: '런던 지하철 안개 봉쇄',
        description: '음산한 연기가 가득 찬 지하 플랫폼에서 낡은 갑옷 부딪히는 소리가 거칠게 다가옵니다.',
        choices: [
          {
            id: 'choice_uk_fog_fight',
            label: '안개 낀 플랫폼 정면 승부',
            description: '음산한 쇠 부딪히는 소리가 나는 어두운 플랫폼의 정면을 향해 기습 돌진을 감행합니다.',
            riskDelta: 20,
            immediateReward: { gold: 800, xp: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_uk_fog_light',
            label: '빛의 마력탄 투사 정화',
            description: '공중에 마력 섬광 유도탄을 쏘아 올려 플랫폼 주변의 시야를 확보한 뒤 안전하게 비껴갑니다.',
            riskDelta: -10,
            immediateReward: { xp: 100, gold: 0, essence: 0, items: [] }
          }
        ]
      }
    ],
    bossForeshadowings: [
      '런던 타워 기슭에서 고대의 왕관 모양 룬이 허공에 속박된 채 최종 보스를 수호하고 있습니다.',
    ],
    coopLines: [
      '엘리자 그레이: "왕실 룬 신호는 안개의 공명 주파수를 왜곡합니다. 제가 마법 결계를 지탱하겠습니다."',
    ],
    soloWarnings: [
      '경고: 기사단의 유령 군세는 단독 개입 헌터를 집요하게 가두고 찢어발깁니다.',
    ],
    clearedLines: ['템스강 다리를 가로막던 고성 마력 안개가 걷히고 통행이 안전하게 재개되었습니다.'],
    failedLines: ['런던 전역이 짙은 차원의 마벽에 둘러싸여 왕실의 지맥이 침식되었습니다.']
  },
  'ru': {
    id: 'pack_ru',
    regionId: 'ru',
    localeName: '러시아',
    timelineLabels: ['외곽 설원 참호', '얼어붙은 철도선', '비밀 벙커 초입', '빙결 만년설 동토', '영구 결빙 중심부'],
    introBriefings: [
      '영하 40도의 시베리아 동토 벌판에 만년설을 통째로 얼려 흔드는 서리 얼음 균열이 개방되었습니다.',
    ],
    threatBriefings: [
      '극지방 저온의 영향으로 인해 장비의 열 손실 및 마력 배출 페널티 리스크가 심각합니다.',
    ],
    loveCallBriefings: [
      '설원에 고립된 혹한의 시베리아 방어선 구조 요청입니다. 동토 전선의 침식 제거를 대행하십시오.',
    ],
    eventEncounters: [
      {
        id: 'evt_ru_lab',
        title: '비밀 연구소의 마지막 신호',
        description: '얼어붙은 군수 기지 환기구 틈새로 특수 마력 데이터 신호가 미세하게 흘러나옵니다.',
        choices: [
          {
            id: 'choice_ru_lab_data',
            label: '데이터 서버 정밀 해킹',
            description: '벙커 단말기의 마력 침투 보안 코드를 해킹하여 비밀 연구소의 전술 보급 정보를 회수합니다.',
            riskDelta: -15,
            immediateReward: { gold: 700, xp: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_ru_lab_charge',
            label: '연구소 비밀 금고 강제 개봉',
            description: '벙커 중앙의 차가운 금고 자물쇠를 통째로 파쇄하여 기지 전력용 마결정을 강제로 탈취합니다.',
            riskDelta: 20,
            immediateReward: { essence: 350, xp: 0, gold: 0, items: [] }
          },
          {
            id: 'choice_ru_lab_coop',
            label: '공조 헌터의 열원 차단 보조',
            description: ' Named 헌터 대원이 화염 방출기로 녹여낸 철갑 방벽 틈새를 타고 빠르게 돌파합니다.',
            requiresCoop: true,
            conditionHint: '러시아 공조 중인 Named 헌터가 필요합니다.',
            coopRiskDelta: -30,
            coopImmediateReward: { xp: 150, gold: 0, essence: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_ru_freeze',
        title: '동토의 혹한 터널',
        description: '살을 에는 눈보라가 터널 입구를 폐쇄하여, 장비 오작동과 오한이 몰아칩니다.',
        choices: [
          {
            id: 'choice_ru_freeze_heater',
            label: '군용 예비 발전기 가동',
            description: '비상 열원 장치의 수동 작동 레버를 강하게 당겨 가동하고 얼어붙은 몸을 쬐어 몸을 추스릅니다.',
            healPercent: 25,
            riskDelta: -10
          },
          {
            id: 'choice_ru_freeze_rush',
            label: '추위를 뚫고 신속 전진',
            description: '추위를 견뎌내며 장비 가방을 품에 안고 시베리아 눈보라 터널의 정면을 향해 질주합니다.',
            riskDelta: 10,
            nextEncounterModifier: 'buff_speed'
          }
        ]
      }
    ],
    bossForeshadowings: [
      '결빙된 대형 격납고 심장부에 냉기를 격렬하게 발산하는 만년 서리의 마왕이 군림하고 있습니다.',
    ],
    coopLines: [
      '유리 카르포프: "시베리아의 강추위도 내 중장갑 화염 방출기를 이길 수 없지. 가자, 불꽃의 길을 낼 테니!"',
    ],
    soloWarnings: [
      '경고: 얼어붙은 만년설 지맥은 동료 헌터 없이 침투할 경우 체력 방전 즉사 위험이 있습니다.',
    ],
    clearedLines: ['동토를 옥죄던 서리 얼음의 위상 장벽이 정화되고 철로 소통이 재개되었습니다.'],
    failedLines: ['설원 비밀 벙커가 혹한 마력 폭풍에 영구 침식되어 통제 불능 지대로 매몰되었습니다.']
  },
  'cn': {
    id: 'pack_cn',
    regionId: 'cn',
    localeName: '중국',
    timelineLabels: ['만리 장벽 차단선', '석조 사원 지하로', '황사 침식 회랑', '대리석 봉인 전당', '황궁 이계 결전처'],
    introBriefings: [
      '중국 대륙 만리장성 북부 유적지에 고대 봉인을 갈갈이 찢고 거대한 황토 크랙이 개방되었습니다.',
    ],
    threatBriefings: [
      '지맥 균열에 의한 사막 모래 폭풍으로 헌터 무기의 내구성과 정밀 공격력이 제약을 받습니다.',
    ],
    loveCallBriefings: [
      '대형 유적지의 봉인 붕괴 피해가 내륙으로 전파 중입니다. 협조 사격 지원을 긴급 수락하십시오.',
    ],
    eventEncounters: [
      {
        id: 'evt_cn_seal',
        title: '지하 봉인의 균열',
        description: '석조 황실 묘궁 한가운데에 놓인 봉인 주술 석주가 거미줄처럼 금이 가며 붉게 고동치고 있습니다.',
        choices: [
          {
            id: 'choice_cn_seal_fix',
            label: '고대 부적 마력 봉인 보강',
            description: '지니고 있던 정수 파편 조각들을 부적 제단에 부드럽게 주입하여 석주의 균열 파동을 제어합니다.',
            riskDelta: -15,
            rewardMultiplierDelta: 0.10
          },
          {
            id: 'choice_cn_seal_shatter',
            label: '석주 주술 강제 분쇄',
            description: '붉게 고동치며 불안정하게 폭주하는 석주 장치를 무기로 격파하여 흘러나오는 에너지를 포집합니다.',
            riskDelta: 20,
            immediateReward: { gold: 800, xp: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_cn_seal_coop',
            label: '현지 무협 헌터 진법 결합',
            description: ' Named 헌터가 전개한 도교식 기운 차단 장막의 진법 속으로 안전하게 합류해 이동합니다.',
            requiresCoop: true,
            conditionHint: '중국 공조 Named 헌터가 필요합니다.',
            coopRiskDelta: -30,
            coopImmediateReward: { essence: 150, xp: 0, gold: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_cn_wall',
        title: '만리장성 외곽 수색',
        description: '황사가 휘몰아치는 기암괴석 성벽 틈새에서 파괴된 보급 함을 발굴해 냈습니다.',
        choices: [
          {
            id: 'choice_cn_wall_loot',
            label: '보급 보석 옥벽 강취',
            description: '바람에 흔들리는 성벽 기단부 틈새에 숨겨진 황실 보급용 옥 장갑을 꺼내어 소지합니다.',
            riskDelta: 10,
            healPercent: 20,
            immediateReward: { gold: 500, xp: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_cn_wall_pass',
            label: '은신을 지키며 통과',
            description: '함정의 존재 가능성을 경계하여 상자를 건드리지 않고 신속히 우회합니다.',
            riskDelta: -5,
            immediateReward: { xp: 100, gold: 0, essence: 0, items: [] }
          }
        ]
      }
    ],
    bossForeshadowings: [
      '묘궁의 가장 지하 안쪽 전당, 마석 황실 옥좌 뒤에서 거대한 적마령 수호자가 깨어나고 있습니다.',
    ],
    coopLines: [
      '장웨이: "장도강 마력으로 길을 낼 테니, 대륙 유적의 힘을 너무 얕보지 마시오!"',
    ],
    soloWarnings: [
      '경고: 고대 지진법이 얽힌 균열입니다. 단독 개입 헌터는 봉인 주술에 역으로 질식당하기 쉽습니다.',
    ],
    clearedLines: ['황궁 지하 석벽의 붕괴 핵이 복구되어 대륙 방어선이 안전을 탈환했습니다.'],
    failedLines: ['만리 장벽의 대지맥이 함몰되며 오염 기류가 시가지를 향해 폭주하기 시작했습니다.']
  },
  'jp': {
    id: 'pack_jp',
    regionId: 'jp',
    localeName: '일본',
    timelineLabels: ['신주쿠 통제 경계', '지하상가 매복로', '붕괴된 신사 경내', '이상 결계 억류지', '위상 왜곡 중심부'],
    introBriefings: [
      '도쿄 신주쿠 도심 빌딩 숲과 지하상가가 단층 왜곡 형태로 무너져 이상 균열이 안착했습니다.',
    ],
    threatBriefings: [
      '요괴 형상의 기형 몬스터들이 인근 결계를 뜯어먹고 난폭하게 진화 중입니다.',
    ],
    loveCallBriefings: [
      '마천루 빌딩 붕괴에 따른 대형 정화 위기입니다. 현지 특수 공조 임무를 완수하십시오.',
    ],
    eventEncounters: [
      {
        id: 'evt_jp_shrine',
        title: '신사 결계 붕괴',
        description: '무너진 신사의 낡은 석등 틈에서 검은 이계 마력이 요괴 영령 형태로 흐물거립니다.',
        choices: [
          {
            id: 'choice_jp_shrine_purify',
            label: '주술적 부적 결계 강화',
            description: '신사 경계석에 부적 결계를 주입하여 차단막 안전지대를 임시 형성합니다.',
            riskDelta: -15,
            immediateReward: { essence: 200, xp: 0, gold: 0, items: [] }
          },
          {
            id: 'choice_jp_shrine_extract',
            label: '요괴의 그림자 정수 징수',
            description: '허공에 일렁이는 야수 영령의 핵을 도검으로 베어내어 그림자 마력을 수확합니다.',
            riskDelta: 20,
            extractionBonusDelta: 6
          },
          {
            id: 'choice_jp_shrine_coop',
            label: '현지 헌터의 퇴마 검술 보완',
            description: '켄지의 일격 기류에 맞춰 타이밍 좋게 결계 마력을 주입하여 활로를 개방합니다.',
            requiresCoop: true,
            conditionHint: '일본 공조 Named 헌터가 필요합니다.',
            coopRiskDelta: -30,
            coopImmediateReward: { gold: 500, xp: 0, essence: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_jp_subway',
        title: '지하상가 함몰 공동',
        description: '붕괴된 지하 쇼핑몰 천장 틈새로 파편이 비 오듯 쏟아지며 탈출 경로가 협착됩니다.',
        choices: [
          {
            id: 'choice_jp_subway_leap',
            label: '잔해를 딛고 전방 도약',
            description: '천장에서 쏟아지는 파편 틈새를 딛고 철근 기둥 위로 아슬아슬하게 몸을 날립니다.',
            riskDelta: 10,
            rewardMultiplierDelta: 0.15
          },
          {
            id: 'choice_jp_subway_clear',
            label: '경로 주변 파편 조심 제거',
            description: '보강판 방패를 들고 천장 파편 낙석을 퉁겨내며 침착하게 출구로 전진합니다.',
            riskDelta: -10,
            immediateReward: { xp: 100, gold: 0, essence: 0, items: [] }
          }
        ]
      }
    ],
    bossForeshadowings: [
      '신주쿠 빌딩 숲 공중에 거대한 단층 거울처럼 매달린 차원 보스가 날카로운 검기를 흘리고 있습니다.',
    ],
    coopLines: [
      '사토 켄지: "이계의 요괴 따위는 내 발도술 한 칼에 양단한다. 틈을 보일 때 찌르게!"',
    ],
    soloWarnings: [
      '경고: 요괴형 변이 몬스터들의 합격 기동은 매우 교활합니다. 홀로 격돌하는 것은 패착입니다.',
    ],
    clearedLines: ['신주쿠 상공을 뒤덮던 위상 분열 거울이 깨지며 도시 하늘이 돌아왔습니다.'],
    failedLines: ['도쿄 도심 지맥이 단층 붕괴와 마력 오염으로 완전히 전선 붕괴되었습니다.']
  },
  'de': {
    id: 'pack_de',
    regionId: 'de',
    localeName: '독일',
    timelineLabels: ['흑림 진입 초소', '억제 장치 붕괴지', '라인강 수변 방벽', '비밀 지하 용암 공동', '지맥 핵 중추'],
    introBriefings: [
      '독일 국경의 블랙포레스트(흑림) 깊은 침엽수림 지맥에서 붉은 마력 게이트가 개방되었습니다.',
    ],
    threatBriefings: [
      '삼림의 강력한 고대 나무 괴수 무리가 인근 연방 실험실을 대대적으로 유린하고 있습니다.',
    ],
    loveCallBriefings: [
      '실험실 억제 장치가 폭주 붕괴하고 있습니다. 흑림 전선 긴급 작전을 백업해 주십시오.',
    ],
    eventEncounters: [
      {
        id: 'evt_de_blackforest',
        title: '흑림 마력 코어 폭주',
        description: '실험실 억제 시설 내부의 고출력 전이 코어가 파괴되어, 사방으로 번개를 뿜어내고 있습니다.',
        choices: [
          {
            id: 'choice_de_core_override',
            label: '코어 강제 냉각 셧다운',
            description: '연구소 통제 시스템의 셧다운 기어를 수동 회전시켜 폭주를 강제 제어합니다.',
            riskDelta: -15,
            immediateReward: { gold: 500, xp: 0, essence: 0, items: [] }
          },
          {
            id: 'choice_de_core_charge',
            label: '코어 과부하 마력 임시 흡수',
            description: '배출되는 고압의 마력 전류를 보조 배터리 팩에 흡수하여 장비를 임시 보강합니다.',
            riskDelta: 20,
            nextEncounterModifier: 'buff_atk_def'
          },
          {
            id: 'choice_de_core_coop',
            label: '현지 헌터의 공학 지원',
            description: ' Named 헌터가 전개한 방열 실드의 보호를 받으며 코어 외곽 전류망을 우회합니다.',
            requiresCoop: true,
            conditionHint: '독일 공조 Named 헌터가 필요합니다.',
            coopRiskDelta: -30,
            coopImmediateReward: { essence: 150, xp: 0, gold: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_de_industry',
        title: '라인강 공업지대 침식',
        description: '유실된 화물 철도 선로 위에 마력을 집어삼킨 거대 삼림 벌목종이 기어 다니고 있습니다.',
        choices: [
          {
            id: 'choice_de_industry_slay',
            label: '삼림 벌목종 격퇴 사냥',
            description: '무기를 고쳐 쥐고 폭주한 삼림종 몬스터의 약점 부위를 신속하게 가격하여 사냥합니다.',
            riskDelta: 10,
            immediateReward: { essence: 300, xp: 0, gold: 0, items: [] }
          },
          {
            id: 'choice_de_industry_avoid',
            label: '공장 환기구 우회 통과',
            description: '몬스터의 시선을 피해 공장 뒷벽의 협소한 배출 기공 통로로 납작 기어서 전진합니다.',
            riskDelta: -10,
            immediateReward: { xp: 100, gold: 0, essence: 0, items: [] }
          }
        ]
      }
    ],
    bossForeshadowings: [
      '흑림 심층부 억제 동굴 중심부에서 나무뿌리와 강철이 괴상하게 융합한 지맥 지배자가 도사리고 있습니다.',
    ],
    coopLines: [
      '디터 브란트: "내 전자기 억제 방막이 풀 기동 중이다. 뒤에서 걱정 말고 마력 코어를 저격해라!"',
    ],
    soloWarnings: [
      '경고: 억제 시설의 전자기 폭주는 나홀로 헌터의 전열 인프라를 한방에 증발시킬 것입니다.',
    ],
    clearedLines: ['흑림의 마력 핵 폭주가 성공적으로 진압되었습니다.'],
    failedLines: ['독일 국경 실험실이 붕괴하고 지맥이 침식되었습니다.']
  },

  // === 3. 공통 Fallback ===
  'default': {
    id: 'pack_default',
    regionId: 'default',
    localeName: '심연 구역',
    timelineLabels: ['경계 전초 지대', '차원 통로 내부', '위상 왜곡 심부', '균열 게이트 코어', '심연 최심부 결전장'],
    introBriefings: [
      '현실 물리 법칙이 뒤틀린 지점에 안착한 고위 위험 등급의 차원 균열입니다.',
    ],
    threatBriefings: [
      '이계의 불안정한 마력 융합으로 인해 몬스터들의 저항과 격돌 빈도가 매섭습니다.',
    ],
    loveCallBriefings: [
      '심연의 게이트 정화 작전입니다. 국가 전력을 조율해 적시 클리어를 보조하십시오.',
    ],
    eventEncounters: [
      {
        id: 'evt_default_instability',
        title: '불안정한 차원 균열',
        description: '차원 경계선 틈바구니에서 마력 불꽃이 맹렬하게 뿜어져 나오고 있습니다.',
        choices: [
          {
            id: 'choice_default_rift_stabilize',
            label: '차원 주파수 안정화 수행',
            description: '불안정한 지맥에 마력을 조심스레 흘려보내 균열의 흔들림을 차분히 진정시킵니다.',
            riskDelta: -15,
            immediateReward: { essence: 100, xp: 0, gold: 0, items: [] }
          },
          {
            id: 'choice_default_rift_force_open',
            label: '균열 강제 확장 개방',
            description: '왜곡의 경계선 틈바구니에 무기를 넣어 거칠게 찢어 발겨 더 넓은 심연을 개방합니다.',
            riskDelta: 20,
            rewardMultiplierDelta: 0.20,
            addEncounterType: 'shadow_trace'
          }
        ]
      },
      {
        id: 'evt_default_shadow_trace',
        title: '스러져간 사냥꾼의 흔적',
        description: '어두운 바닥에 정체불명의 전사 헌터들의 마력 그을음이 묻어 있습니다.',
        choices: [
          {
            id: 'choice_default_trace_follow',
            label: '마력 흔적 심층 추적',
            description: '바닥에 흐르는 공명 주파수를 역추적하여 한층 더 어두운 심층 굴로 추적을 개시합니다.',
            riskDelta: 15,
            extractionBonusDelta: 8
          },
          {
            id: 'choice_default_trace_ignore',
            label: '안전 우회 및 자원 회수',
            description: '불필요한 전투를 피해, 잔해가 깨끗이 치워진 안전한 우회 동굴 비탈로 기동합니다.',
            riskDelta: -5,
            immediateReward: { gold: 500, xp: 0, essence: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_default_supply',
        title: '버려진 연방 보급상자',
        description: '수풀 구석에 버려진 지 꽤 된 먼지 쌓인 알루미늄 보급품 상자가 보입니다.',
        choices: [
          {
            id: 'choice_default_supply_open',
            label: '보급함 강제 개봉 탈취',
            description: '상자의 안전핀을 제거하고 쇠지렛대로 강하게 뚜껑을 젖혀 내부 물품을 획득합니다.',
            riskDelta: 10,
            immediateReward: { gold: 900, xp: 0, essence: 0, items: [] },
            nextEncounterModifier: 'debuff_accuracy'
          },
          {
            id: 'choice_default_supply_leave',
            label: '상자를 우회하여 통과',
            description: '함정을 우려하여 보급함을 그대로 방치한 채 우회하여 조심스럽게 지나갑니다.',
            riskDelta: -5
          }
        ]
      },
      {
        id: 'evt_default_altar',
        title: '바스러진 서약의 제단',
        description: '깨진 돌제단에서 장엄한 은빛 오라가 솟구쳐 오릅니다.',
        choices: [
          {
            id: 'choice_default_altar_pray',
            label: '제단 앞에서 헌신의 기도',
            description: '제단에서 흐르는 백색 마력 결에 아군의 파동을 정렬하여 신체 상처를 수선합니다.',
            healPercent: 35,
            nextEncounterModifier: 'enemy_speed_up'
          },
          {
            id: 'choice_default_altar_shatter',
            label: '제단 마석 추출 파괴',
            description: '제단 기단부의 핵심 정수 동력원을 파쇄하여 뿜어져 나오는 마석 결정을 확보합니다.',
            riskDelta: 15,
            immediateReward: { essence: 250, xp: 0, gold: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_default_hunter_encounter',
        title: '동토 틈새의 방랑 헌터 [조우]',
        description: '지맥 깊은 골짜기 아래, 보급품을 잃어버리고 떨고 있는 이국인 헌터 한 명이 당신에게 손을 내밀고 있습니다.',
        choices: [
          {
            id: 'choice_default_hunter_feed',
            label: '비상 식량팩과 마석 물약 공급',
            description: '비상 식량 팩과 치료 물약을 탈진한 대원에게 양보하고 차원 정보를 갱신받습니다.',
            hpCostPercent: 12,
            immediateReward: { essence: 300, xp: 0, gold: 0, items: [] }
          },
          {
            id: 'choice_default_hunter_pass',
            label: '상황을 주시하며 대원의 보급함을 수거하여 통과',
            description: '그의 소유였던 바닥의 보급품 상자만 수거한 채 어두운 전방을 향해 갈 길을 재촉합니다.',
            immediateReward: { gold: 600, xp: 0, essence: 0, items: [] }
          }
        ]
      },
      {
        id: 'evt_default_riddle_trial',
        title: '심연의 속삭이는 룬 비석 [수수께끼/시험]',
        description: '공중에 어렴풋이 일렁이는 룬 문자들이 헌터의 마력 한도를 검증하듯 차가운 전자기 기류를 발산합니다.',
        choices: [
          {
            id: 'choice_default_riddle_solve',
            label: '비석 문양 주파수에 동조합니다.',
            description: '정신을 집중하여 비석에 새겨진 마력 주파수의 진동을 완벽히 차단하고 정제합니다.',
            riskDelta: -15,
            immediateReward: { essence: 220, xp: 0, gold: 0, items: [] }
          },
          {
            id: 'choice_default_riddle_smash',
            label: '도검을 휘둘러 비석을 억지로 깨부수어 소멸시킵니다.',
            description: '비석의 룬 결정을 무기 강타로 내리쳐 파괴합니다. 사방에 폭발 충격파가 번집니다.',
            riskDelta: 20,
            nextEncounterModifier: 'enemy_atk_up'
          }
        ]
      }
    ],
    bossForeshadowings: [
      '던전 깊은 곳에 균열의 지배자가 시빨건 마력 안광을 번뜩이며 침입자를 노려보고 있습니다.',
    ],
    coopLines: [
      '공조 사냥꾼: "지원 병력이 전열을 갖추었습니다. 작전에 즉시 협조하십시오!"',
    ],
    soloWarnings: [
      '경고: 백업 대원이 부재한 전선입니다. 단독 공략은 극악의 붕괴 페널티를 부를 수 있습니다.',
    ],
    clearedLines: ['게이트 균열 내부 정화 작전이 성공하여 전선이 마침내 안정을 구축했습니다.'],
    failedLines: ['차원 붕괴 제거 작전이 차단되며 게이트 오염도가 폭주 상태에 달했습니다.']
  }
}

// 특정 지역/국가에 매칭되는 이벤트팩 데이터 로드 헬퍼
export function getWorldGateEventPack(regionId?: string, subRegionId?: string): WorldGateEventPack {
  if (subRegionId && REGIONAL_EVENT_PACKS[subRegionId]) {
    return REGIONAL_EVENT_PACKS[subRegionId]
  }
  if (regionId && REGIONAL_EVENT_PACKS[regionId]) {
    return REGIONAL_EVENT_PACKS[regionId]
  }
  // 한국 default fallback
  if (regionId === 'kr') {
    return REGIONAL_EVENT_PACKS['kr']
  }
  return REGIONAL_EVENT_PACKS['default']
}

// 템플릿 탐색 헬퍼: 기존 DB 및 지역 이벤트팩 통합 검색 지원
export function getGateRunEventTemplate(templateId: string): any | undefined {
  // Search regional event packs first
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
