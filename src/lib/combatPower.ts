import type { ActiveConsumableEffect, EquipmentState, HunterState, Item, OwnedShadow, PlayerCombatStats, StatKey } from './types'
import {
  calculateCombatPower,
  calculatePlayerCombatStats,
  getEquippedItems,
  getEquippedTitleEffects,
  getPlayerCombatSkills,
  roundStatValue,
} from './game'
import { SKILL_DEFINITIONS } from './seed'
import { getEquippedShadows, getEquippedShadowStatBonuses } from './shadows'
import { getShadowArmyCombatPower, type ShadowArmyCombatPowerBreakdown } from './shadowStats'

export interface HunterCombatPowerInput {
  hunter: HunterState
  items: Item[]
  equipment: EquipmentState
  ownedShadows?: OwnedShadow[]
  equippedShadowIds?: string[]
  activeConsumableEffects?: ActiveConsumableEffect[]
}

export interface HunterCombatPowerBreakdown {
  total: number
  baseStats: number
  equipment: number
  title: number
  skills: number
  shadows: number
  shadowCombat: ShadowArmyCombatPowerBreakdown
  misc: number
  combatStats: PlayerCombatStats
}

export type CombatPowerComparisonTone = 'stable' | 'challenge' | 'danger'

export interface CombatPowerComparison {
  diff: number
  ratio: number
  label: string
  tone: CombatPowerComparisonTone
}

const addStatBonuses = (
  stats: Record<StatKey, number>,
  bonuses: Partial<Record<StatKey, number>>,
): Record<StatKey, number> => {
  const next = { ...stats }
  for (const [key, value] of Object.entries(bonuses) as Array<[StatKey, number | undefined]>) {
    next[key] = roundStatValue((next[key] ?? 0) + (value ?? 0))
  }
  return next
}

const powerFor = ({
  hunter,
  stats,
  equippedItems,
  activeConsumableEffects = [],
  includeSkills = false,
}: {
  hunter: HunterState
  stats: Record<StatKey, number>
  equippedItems: Item[]
  activeConsumableEffects?: ActiveConsumableEffect[]
  includeSkills?: boolean
}): { power: number; combatStats: PlayerCombatStats } => {
  const skills = includeSkills
    ? getPlayerCombatSkills({
        jobId: hunter.jobId,
        equippedItems,
        allSkills: SKILL_DEFINITIONS,
      })
    : []
  const combatStats = calculatePlayerCombatStats({
    level: hunter.level,
    stats,
    equippedItems,
    activeConsumableEffects,
    jobId: hunter.jobId,
    skills,
  })
  return { power: calculateCombatPower(combatStats), combatStats }
}

export const getHunterCombatPowerBreakdown = ({
  hunter,
  items,
  equipment,
  ownedShadows = [],
  equippedShadowIds = [],
  activeConsumableEffects = [],
}: HunterCombatPowerInput): HunterCombatPowerBreakdown => {
  const equippedItems = getEquippedItems(items, equipment)
  const equippedShadows = getEquippedShadows(ownedShadows, equippedShadowIds, hunter)
  const titleStatBonuses = getEquippedTitleEffects(hunter).statBonus ?? {}
  const shadowStatBonuses = getEquippedShadowStatBonuses(equippedShadows)
  const shadowCombat = getShadowArmyCombatPower(equippedShadows)

  const base = powerFor({ hunter, stats: hunter.stats, equippedItems: [], includeSkills: false })
  const withEquipment = powerFor({ hunter, stats: hunter.stats, equippedItems, includeSkills: false })
  const titleStats = addStatBonuses(hunter.stats, titleStatBonuses)
  const withTitle = powerFor({ hunter, stats: titleStats, equippedItems, includeSkills: false })
  const shadowStats = addStatBonuses(titleStats, shadowStatBonuses)
  const withShadows = powerFor({ hunter, stats: shadowStats, equippedItems, includeSkills: false })
  const withSkills = powerFor({ hunter, stats: shadowStats, equippedItems, includeSkills: true })
  const final = powerFor({
    hunter,
    stats: shadowStats,
    equippedItems,
    activeConsumableEffects,
    includeSkills: true,
  })

  return {
    total: final.power,
    baseStats: base.power,
    equipment: Math.max(0, withEquipment.power - base.power),
    title: Math.max(0, withTitle.power - withEquipment.power),
    shadows: Math.max(0, withShadows.power - withTitle.power),
    shadowCombat,
    skills: Math.max(0, withSkills.power - withShadows.power),
    misc: Math.max(0, final.power - withSkills.power),
    combatStats: final.combatStats,
  }
}

export const getHunterCombatPower = (input: HunterCombatPowerInput): number =>
  getHunterCombatPowerBreakdown(input).total

export const getCombatPowerTierHint = (power: number): string => {
  if (power < 300) return 'E급 초입'
  if (power < 650) return 'E급 안정 / D급 준비'
  if (power < 1100) return 'D급 도전권'
  if (power < 1500) return 'D급 안정 / C급 준비'
  if (power < 1900) return 'C급 도전권'
  return 'C급 안정권 이상'
}

export const getCombatPowerComparison = (
  currentPower: number,
  recommendedPower: number,
): CombatPowerComparison => {
  const safeRecommended = Math.max(1, recommendedPower)
  const diff = Math.round(currentPower - recommendedPower)
  const ratio = currentPower / safeRecommended
  if (ratio >= 1.1) {
    return { diff, ratio, label: '안정', tone: 'stable' }
  }
  if (ratio >= 0.85) {
    return { diff, ratio, label: '도전', tone: 'challenge' }
  }
  return { diff, ratio, label: '위험', tone: 'danger' }
}
