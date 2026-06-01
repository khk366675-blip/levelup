import type { AchievementStats, HunterState, Rank } from './types'

export type RenownTierId = 'unknown' | 'rookie' | 'elite' | 'hero' | 'legend'

export interface RenownTier {
  id: RenownTierId
  label: string
  min: number
  maxHelperRank: Rank
  description: string
}

export const RENOWN_TIERS: RenownTier[] = [
  {
    id: 'unknown',
    label: '무명',
    min: 0,
    maxHelperRank: 'D',
    description: 'E~D급 헌터만 협력 요청에 응답합니다.',
  },
  {
    id: 'rookie',
    label: '신예',
    min: 120,
    maxHelperRank: 'C',
    description: 'C급 헌터까지 협력 후보에 합류합니다.',
  },
  {
    id: 'elite',
    label: '정예',
    min: 320,
    maxHelperRank: 'B',
    description: 'B급 헌터까지 당신의 이름을 인정합니다.',
  },
  {
    id: 'hero',
    label: '영웅',
    min: 760,
    maxHelperRank: 'S',
    description: 'A~S급 헌터도 협력 요청에 응답합니다.',
  },
  {
    id: 'legend',
    label: '전설',
    min: 1400,
    maxHelperRank: 'National',
    description: '국가권력급 헌터까지 협력 후보가 됩니다.',
  },
]

const RANK_ORDER: Record<Rank, number> = {
  E: 0,
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
  National: 6,
}

const GATE_RENOWN_REWARD: Record<Rank, number> = {
  E: 8,
  D: 10,
  C: 14,
  B: 18,
  A: 24,
  S: 34,
  National: 40,
}

export const MONARCH_RENOWN_REWARD = 450

export function calculateRenownFromProgress(input: {
  gateClearedCount?: number
  monarchsDefeatedCount?: number
  level?: number
}): number {
  const gates = Math.max(0, input.gateClearedCount ?? 0)
  const monarchs = Math.max(0, input.monarchsDefeatedCount ?? 0)
  const level = Math.max(1, input.level ?? 1)
  return gates * 10 + monarchs * MONARCH_RENOWN_REWARD + (level - 1) * 5
}

export function getEffectiveRenown(
  hunter: Pick<HunterState, 'level' | 'renown'>,
  achievementStats?: Pick<AchievementStats, 'gateClearedCount'>,
  monarchsDefeatedCount = 0
): number {
  return Math.max(
    Math.max(0, hunter.renown ?? 0),
    calculateRenownFromProgress({
      gateClearedCount: achievementStats?.gateClearedCount ?? 0,
      monarchsDefeatedCount,
      level: hunter.level,
    })
  )
}

export function getRenownTier(renown: number): RenownTier {
  let tier = RENOWN_TIERS[0]
  for (const candidate of RENOWN_TIERS) {
    if (renown >= candidate.min) tier = candidate
  }
  return tier
}

export function getNextRenownTier(renown: number): RenownTier | undefined {
  return RENOWN_TIERS.find(tier => tier.min > renown)
}

export function getRenownProgress(renown: number): { current: RenownTier; next?: RenownTier; ratio: number } {
  const current = getRenownTier(renown)
  const next = getNextRenownTier(renown)
  if (!next) return { current, next, ratio: 1 }
  const span = Math.max(1, next.min - current.min)
  return {
    current,
    next,
    ratio: Math.max(0, Math.min(1, (renown - current.min) / span)),
  }
}

export function getRenownGainForGate(rank: Rank, isMonarch = false): number {
  return (GATE_RENOWN_REWARD[rank] ?? GATE_RENOWN_REWARD.E) + (isMonarch ? MONARCH_RENOWN_REWARD : 0)
}

export function canHunterAnswerLoveCall(hunterRank: Rank, maxRank: Rank): boolean {
  return (RANK_ORDER[hunterRank] ?? 0) <= (RANK_ORDER[maxRank] ?? RANK_ORDER.D)
}
