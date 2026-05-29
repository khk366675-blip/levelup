import type { HunterGradeTier } from './types'

export interface PromotionExamDefinition {
  targetGrade: HunterGradeTier
  name: string
  concept: string
  description: string
  recommendedPower: number
  riskLevel: '낮음' | '보통' | '높음' | '매우 높음' | '극한'
  difficultyMod: number // Base scaling multiplier
  normalMultiplier: number // Multiplier for normal monsters
  bossMultiplier: number // Multiplier for bosses
  encounterCount: number // How many encounters in this GateRun
  clearRequirement: string
  shadowUsageAdvised: boolean
  telegraphEmphasis: boolean
  failurePolicy: string
  rewardSummary: string
  bossEmphasisName?: string
}

export const PROMOTION_EXAM_DEFINITIONS: Record<Exclude<HunterGradeTier, 'E'>, PromotionExamDefinition> = {
  D: {
    targetGrade: 'D',
    name: 'D급 현장 실전 적응 심사',
    concept: '기본적인 차원 게이트 대응 및 전투 연속성 검증',
    description: '협회 감독관 참관 하에 기본적인 마력 몬스터 연속 공략 및 기초 전술 기동을 심사합니다.',
    recommendedPower: 120,
    riskLevel: '낮음',
    difficultyMod: 1.2,
    normalMultiplier: 1.15,
    bossMultiplier: 1.3,
    encounterCount: 3,
    clearRequirement: '일반 전투 2회 및 하급 파수병 보스 토벌 성공',
    shadowUsageAdvised: false,
    telegraphEmphasis: false,
    failurePolicy: '실패 시 성장이나 보유한 아이템 손실은 전혀 없으며 즉시 재도전 가능',
    rewardSummary: 'D급 헌터 자격 공인, [현장 견습 헌터] 전용 칭호 지급 및 프로필 D급 전용 아우라 테두리 해금',
    bossEmphasisName: '하급 파수병 보스'
  },
  C: {
    targetGrade: 'C',
    name: 'C급 게이트 정예 조사관 심사',
    concept: '다양한 돌발 차원 이벤트 대처 및 정예 파수병 제압력 확인',
    description: '마력 밀도가 높은 특수 구역에서 발생하는 이벤트 선택지와 정예 몬스터(ELITE) 돌파 기동력을 심사합니다.',
    recommendedPower: 350,
    riskLevel: '보통',
    difficultyMod: 1.4,
    normalMultiplier: 1.25,
    bossMultiplier: 1.5,
    encounterCount: 4,
    clearRequirement: '이벤트/보물 구역 돌파 및 정예 몬스터(ELITE) 혹은 중급 보스 처치',
    shadowUsageAdvised: false,
    telegraphEmphasis: false,
    failurePolicy: '실패 시 패널티 없이 언제든지 재시험 응시 가능',
    rewardSummary: 'C급 헌터 자격 공인, [게이트 조사관] 전용 칭호 지급 및 프로필 C급 전용 아우라 테두리 해금',
    bossEmphasisName: '정예 마도 파수병'
  },
  B: {
    targetGrade: 'B',
    name: 'B급 상급 토벌 지휘관 심사',
    concept: '강력한 몬스터 전조 공격(Telegraph) 회피 및 그림자 파티 운용능력 검증',
    description: '상급 게이트 지배자의 전조(Telegraph) 경고 패턴에 기민하게 움직이고, 그림자 군단을 적재적소에 전술 배치할 수 있는지 심사합니다.',
    recommendedPower: 800,
    riskLevel: '높음',
    difficultyMod: 1.7,
    normalMultiplier: 1.45,
    bossMultiplier: 1.85,
    encounterCount: 5,
    clearRequirement: '그림자 군단 소환 및 보스의 대형 Telegraph 예비 동작에 맞춰 즉각 대응 후 토벌',
    shadowUsageAdvised: true,
    telegraphEmphasis: true,
    failurePolicy: '안전 보장 심사로 실패 시 불이익 없이 즉각 재개 가능',
    rewardSummary: 'B급 헌터 자격 공인, [상급 토벌자] 전용 칭호 지급 및 프로필 B급 전용 아우라 테두리 해금',
    bossEmphasisName: '상급 던전 지배자'
  },
  A: {
    targetGrade: 'A',
    name: 'A급 국가 정예 헌터 심사',
    concept: '심층 차원 압박(Reality Pressure) 극복 및 하이클래스 대형 보스 레이드',
    description: '강력한 현실 이탈 압박(Pressure Snapshot) 상태가 융합된 극한의 차원 왜곡 속에서 군단을 지휘하며 대형 보스를 토벌하는 자격을 검증합니다.',
    recommendedPower: 1800,
    riskLevel: '매우 높음',
    difficultyMod: 2.2,
    normalMultiplier: 1.8,
    bossMultiplier: 2.3,
    encounterCount: 6,
    clearRequirement: 'Reality Pressure 역압 속에서 연속 전투 및 최하층 헬하운드 보스 토벌 완수',
    shadowUsageAdvised: true,
    telegraphEmphasis: true,
    failurePolicy: '실패 패널티 없음. 준비도 정돈 후 무제한 재도전 가능',
    rewardSummary: 'A급 정예 헌터 자격 공인, [정예 헌터] 전용 칭호 지급 및 프로필 A급 전용 아우라 테두리 해금',
    bossEmphasisName: '심연의 지옥 파수견'
  },
  S: {
    targetGrade: 'S',
    name: 'S급 단독 차원 지배자 심사',
    concept: '협회 최고위 전력 검증 및 독자적인 게이트 제어 자격 고사',
    description: '공식 헌터 등급의 정점에 도전합니다. 살인적인 Telegraph 전조 리스크와 강력한 지배자 스태츠를 지닌 특수 신마 보스를 혈혈단신 및 군단으로 제압해 증명하십시오.',
    recommendedPower: 3200,
    riskLevel: '극한',
    difficultyMod: 2.7,
    normalMultiplier: 2.3,
    bossMultiplier: 2.8,
    encounterCount: 6,
    clearRequirement: '협회 보증 S급 균열 파쇄 및 신마 보스 패턴 공략 성공',
    shadowUsageAdvised: true,
    telegraphEmphasis: true,
    failurePolicy: '실패 패널티 없음. 헌터 스킬과 마스터리를 추가 보강해 상시 재시도 가능',
    rewardSummary: 'S급 초월 헌터 자격 공인, [S급 헌터] 전용 칭호 지급 및 프로필 S급 전용 아우라 테두리 해금',
    bossEmphasisName: '광폭한 차원의 패왕'
  },
  NATIONAL: {
    targetGrade: 'NATIONAL',
    name: '국가권력급 특별 권한 공인 심사',
    concept: '일반 협회 심사를 넘어선 인류 초월적 정점 전술 고사',
    description: '공인 심사령 한계를 상회하여 국가 대항 자격을 부여하는 특수 정선입니다. 붉은 균열(Red Gate) 및 최상층 심연을 넘어선 진정한 지배자로서의 위업을 검증합니다.',
    recommendedPower: 4500,
    riskLevel: '극한',
    difficultyMod: 3.2,
    normalMultiplier: 2.8,
    bossMultiplier: 3.2,
    encounterCount: 7,
    clearRequirement: '국가권력급 차원 수호 조건 돌파 및 극강 보스 처단 완료',
    shadowUsageAdvised: true,
    telegraphEmphasis: true,
    failurePolicy: '실패 패널티 없음. 준비된 정점 헌터만 통과 가능',
    rewardSummary: '인류 정점 칭호 [국가권력급 헌터] 장착 권한 및 신화형 프로필 특수 테두리 해금',
    bossEmphasisName: '심연을 걷는 군주'
  }
}
