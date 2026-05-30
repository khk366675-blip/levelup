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

  const actionList: BattleActionDefinition[] = [
    {
      actionId: `${monarchId}-basic-attack`,
      label: '일반 공격',
      actionType: 'basic',
      targetType: 'single_enemy',
      effectKind: 'basic',
      basePriority: 0,
      cooldown: 0,
      actionCue: 'strike-boss',
      animationCue: 'strike-boss',
      effectColor: 'crimson',
    },
    {
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
    }
  ]

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
