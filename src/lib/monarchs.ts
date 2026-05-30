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
