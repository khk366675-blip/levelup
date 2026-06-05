import type { OwnedShadow, ShadowDefinition, ShadowInnateGrade, ShadowRole, ShadowStatKey } from './types'
import { getShadowDefinition, SHADOW_TRAIT_DEFINITIONS, SHADOW_PASSIVE_DEFINITIONS, SHADOW_LEGION_NODES } from './shadows'

let getLegionNodeLevelFn: (nodeId: string) => number = () => 0

export const registerLegionNodeLevelResolver = (fn: (nodeId: string) => number) => {
  getLegionNodeLevelFn = fn
}

export const getLegionCritBonus = (): number => {
  let bonus = 0
  for (const nodeDef of SHADOW_LEGION_NODES) {
    const level = getLegionNodeLevelFn(nodeDef.id)
    if (level > 0 && nodeDef.effect.shadowCritBonus) {
      bonus += nodeDef.effect.shadowCritBonus * level
    }
  }
  return bonus
}

export const getLegionEvasionBonus = (): number => {
  let bonus = 0
  for (const nodeDef of SHADOW_LEGION_NODES) {
    const level = getLegionNodeLevelFn(nodeDef.id)
    if (level > 0 && nodeDef.effect.shadowEvasionBonus) {
      bonus += nodeDef.effect.shadowEvasionBonus * level
    }
  }
  return bonus
}

export const getLegionAccuracyBonus = (): number => {
  let bonus = 0
  for (const nodeDef of SHADOW_LEGION_NODES) {
    const level = getLegionNodeLevelFn(nodeDef.id)
    if (level > 0 && nodeDef.effect.shadowAccuracyBonus) {
      bonus += nodeDef.effect.shadowAccuracyBonus * level
    }
  }
  return bonus
}

export type ShadowStatBlock = Record<ShadowStatKey, number>

export interface ShadowTopStat {
  key: ShadowStatKey
  label: string
  shortLabel: string
  value: number
}

export interface ShadowCombatPowerBreakdown {
  totalPower: number
  assistPower: number
  guardPower: number
  controlPower: number
  bossPower: number
  expeditionPower: number
  topStats: ShadowTopStat[]
  roleIdentity: string
  roleTag: string
}

export interface ShadowCombatProfile extends ShadowCombatPowerBreakdown {
  stats: ShadowStatBlock
  multipliers: {
    rarity: number
    innateGrade: number
    level: number
    enhancement: number
    evolution: number
    named: number
    basePower: number
    expedition?: number
  }
}

export interface ShadowArmyCombatPowerBreakdown {
  totalPower: number
  assistPower: number
  guardPower: number
  controlPower: number
  bossPower: number
  expeditionPower: number
  topStats: ShadowTopStat[]
}

export interface ShadowCombatAggregate {
  assistAttack: number
  guardSupport: number
  controlSupport: number
  supportUtility: number
  survivalGuard: number
  bossPressure: number
  speedTempo: number
  finisherPower: number
}

export interface ShadowCombatModifiers {
  assistDamageBonus: number
  assistChanceBonus: number
  finisherDamageBonus: number
  guardReductionBonus: number
  guardCounterChanceBonus: number
  controlStrengthBonus: number
  controlProcBonus: number
  supportSkillBonus: number
  supportChanceBonus: number
  survivalReductionBonus: number
  bossDamageBonus: number
  bossControlBonus: number
}

export const EMPTY_SHADOW_COMBAT_AGGREGATE: ShadowCombatAggregate = {
  assistAttack: 0,
  guardSupport: 0,
  controlSupport: 0,
  supportUtility: 0,
  survivalGuard: 0,
  bossPressure: 0,
  speedTempo: 0,
  finisherPower: 0,
}

export const SHADOW_STAT_KEYS: ShadowStatKey[] = [
  'shadowAttack',
  'shadowDefense',
  'shadowDurability',
  'shadowSpeed',
  'shadowCrit',
  'shadowFinisher',
  'shadowControl',
  'shadowSuppression',
  'shadowSupport',
  'shadowSurvival',
  'shadowBossing',
  'shadowExpedition',
  'shadowSynergy',
]

export const SHADOW_STAT_LABEL: Record<ShadowStatKey, string> = {
  shadowAttack: 'Attack',
  shadowDefense: 'Defense',
  shadowDurability: 'Durability',
  shadowSpeed: 'Speed',
  shadowCrit: 'Crit',
  shadowFinisher: 'Finisher',
  shadowControl: 'Control',
  shadowSuppression: 'Suppression',
  shadowSupport: 'Support',
  shadowSurvival: 'Survival',
  shadowBossing: 'Bossing',
  shadowExpedition: 'Expedition',
  shadowSynergy: 'Synergy',
}

export const SHADOW_STAT_SHORT_LABEL: Record<ShadowStatKey, string> = {
  shadowAttack: 'ATK',
  shadowDefense: 'DEF',
  shadowDurability: 'DUR',
  shadowSpeed: 'SPD',
  shadowCrit: 'CRIT',
  shadowFinisher: 'FIN',
  shadowControl: 'CTRL',
  shadowSuppression: 'SUPP',
  shadowSupport: 'SUP',
  shadowSurvival: 'SURV',
  shadowBossing: 'BOSS',
  shadowExpedition: 'EXPED',
  shadowSynergy: 'SYN',
}

export const SHADOW_STAT_GROUPS: Array<{
  title: string
  keys: ShadowStatKey[]
}> = [
  { title: 'Offense', keys: ['shadowAttack', 'shadowCrit', 'shadowFinisher'] },
  { title: 'Defense', keys: ['shadowDefense', 'shadowDurability', 'shadowSurvival'] },
  { title: 'Tactics', keys: ['shadowSpeed', 'shadowControl', 'shadowSuppression', 'shadowBossing'] },
  { title: 'Support / Expedition', keys: ['shadowSupport', 'shadowExpedition', 'shadowSynergy'] },
]

export const SHADOW_ROLE_PROFILE: Record<ShadowRole, ShadowStatBlock> = {
  assault: {
    shadowAttack: 86,
    shadowDefense: 36,
    shadowDurability: 42,
    shadowSpeed: 58,
    shadowCrit: 74,
    shadowFinisher: 82,
    shadowControl: 34,
    shadowSuppression: 42,
    shadowSupport: 24,
    shadowSurvival: 30,
    shadowBossing: 58,
    shadowExpedition: 32,
    shadowSynergy: 38,
  },
  guard: {
    shadowAttack: 42,
    shadowDefense: 88,
    shadowDurability: 82,
    shadowSpeed: 30,
    shadowCrit: 24,
    shadowFinisher: 34,
    shadowControl: 46,
    shadowSuppression: 62,
    shadowSupport: 38,
    shadowSurvival: 86,
    shadowBossing: 58,
    shadowExpedition: 34,
    shadowSynergy: 42,
  },
  hunter: {
    shadowAttack: 68,
    shadowDefense: 38,
    shadowDurability: 44,
    shadowSpeed: 76,
    shadowCrit: 64,
    shadowFinisher: 72,
    shadowControl: 42,
    shadowSuppression: 38,
    shadowSupport: 28,
    shadowSurvival: 36,
    shadowBossing: 48,
    shadowExpedition: 78,
    shadowSynergy: 46,
  },
  scout: {
    shadowAttack: 54,
    shadowDefense: 34,
    shadowDurability: 38,
    shadowSpeed: 88,
    shadowCrit: 46,
    shadowFinisher: 50,
    shadowControl: 68,
    shadowSuppression: 48,
    shadowSupport: 34,
    shadowSurvival: 42,
    shadowBossing: 44,
    shadowExpedition: 84,
    shadowSynergy: 64,
  },
  support: {
    shadowAttack: 32,
    shadowDefense: 56,
    shadowDurability: 66,
    shadowSpeed: 42,
    shadowCrit: 24,
    shadowFinisher: 28,
    shadowControl: 48,
    shadowSuppression: 56,
    shadowSupport: 88,
    shadowSurvival: 74,
    shadowBossing: 44,
    shadowExpedition: 60,
    shadowSynergy: 82,
  },
  analyst: {
    shadowAttack: 38,
    shadowDefense: 42,
    shadowDurability: 48,
    shadowSpeed: 52,
    shadowCrit: 34,
    shadowFinisher: 36,
    shadowControl: 88,
    shadowSuppression: 82,
    shadowSupport: 64,
    shadowSurvival: 46,
    shadowBossing: 76,
    shadowExpedition: 66,
    shadowSynergy: 72,
  },
}

const RARITY_MULTIPLIER: Record<OwnedShadow['rarity'], number> = {
  common: 0.85,
  uncommon: 1,
  rare: 1.18,
  epic: 1.42,
  legendary: 1.75,
}

const INNATE_GRADE_MULTIPLIER: Record<ShadowInnateGrade, number> = {
  C: 0.9,
  B: 1,
  A: 1.18,
  S: 1.38,
}

const ROLE_TAG: Record<ShadowRole, string> = {
  assault: 'ASSAULT',
  guard: 'GUARD',
  hunter: 'HUNTER',
  scout: 'SCOUT',
  support: 'SUPPORT',
  analyst: 'ANALYST',
}

const ROLE_IDENTITY: Record<ShadowRole, string> = {
  assault: 'Burst assault shadow',
  guard: 'Survival guard shadow',
  hunter: 'Chase hunter shadow',
  scout: 'Tempo scout shadow',
  support: 'Legion support shadow',
  analyst: 'Boss control analyst shadow',
}

const ROLE_PRIMARY_STATS: Record<ShadowRole, ShadowStatKey[]> = {
  assault: ['shadowAttack', 'shadowCrit', 'shadowFinisher'],
  guard: ['shadowDefense', 'shadowDurability', 'shadowSurvival'],
  hunter: ['shadowSpeed', 'shadowFinisher', 'shadowExpedition'],
  scout: ['shadowSpeed', 'shadowControl', 'shadowSynergy'],
  support: ['shadowSupport', 'shadowSurvival', 'shadowSynergy'],
  analyst: ['shadowControl', 'shadowSuppression', 'shadowBossing'],
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const getNamedModifier = (shadow: OwnedShadow): number => {
  if (shadow.isGateNamed || shadow.isAchievementNamed) return 1.14
  if (shadow.isNamed) return 1.08
  return 1
}

const getBasePowerScale = (definition?: ShadowDefinition): number => {
  const basePower = definition?.basePower ?? 40
  return clamp(0.75 + Math.sqrt(Math.max(1, basePower)) / 10, 0.9, 2.05)
}

const getRoleProfile = (shadow: OwnedShadow, definition?: ShadowDefinition): ShadowStatBlock => {
  const base = SHADOW_ROLE_PROFILE[shadow.role]
  const overrides = definition?.shadowStats ?? {}
  return SHADOW_STAT_KEYS.reduce((profile, key) => {
    profile[key] = overrides[key] ?? base[key]
    return profile
  }, {} as ShadowStatBlock)
}

const getTopStats = (stats: ShadowStatBlock, limit = 3): ShadowTopStat[] =>
  SHADOW_STAT_KEYS
    .map(key => ({
      key,
      label: SHADOW_STAT_LABEL[key],
      shortLabel: SHADOW_STAT_SHORT_LABEL[key],
      value: stats[key],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)

const weighted = (...entries: Array<[number, number]>): number =>
  Math.round(entries.reduce((sum, [value, weight]) => sum + value * weight, 0))

const boundedBonus = (value: number, scale: number, cap: number): number => {
  const safeValue = Math.max(0, value)
  return cap * (safeValue / (safeValue + scale))
}

export const getShadowCombatProfile = (
  shadow: OwnedShadow,
  definition: ShadowDefinition | undefined = getShadowDefinition(shadow.definitionId),
): ShadowCombatProfile => {
  const roleProfile = getRoleProfile(shadow, definition)
  const rarity = RARITY_MULTIPLIER[shadow.rarity] ?? 1
  const innateGrade = INNATE_GRADE_MULTIPLIER[shadow.innateGrade ?? 'B'] ?? 1
  const level = 1 + Math.min(0.35, ((shadow.level ?? 1) - 1) * 0.012)
  const enhancement = 1 + Math.min(0.45, (shadow.enhancementLevel ?? 0) * 0.075)
  const evolution = 1 + Math.min(0.4, (shadow.evolutionStage ?? 0) * 0.12)
  const named = getNamedModifier(shadow)
  const basePower = getBasePowerScale(definition)
  const expeditionLevel = shadow.expeditionLevel ?? 1
  const expedition = 1 + Math.min(0.27, (expeditionLevel - 1) * 0.03)
  const multiplier = rarity * innateGrade * level * enhancement * evolution * named * basePower * expedition

  // Advanced Stats Bonuses from 12-35B
  let hpBonus = 0
  let atkBonus = 0
  let defBonus = 0
  let spdBonus = 0
  let skillBonus = 0
  let expeditionPowerBonus = 0

  const activeTraits = (shadow.traitIds ?? []).map(id => SHADOW_TRAIT_DEFINITIONS.find(t => t.id === id)).filter(Boolean)
  for (const trait of activeTraits) {
    if (trait?.effect.statBonusPct) {
      hpBonus += trait.effect.statBonusPct.hp ?? 0
      atkBonus += trait.effect.statBonusPct.atk ?? 0
      defBonus += trait.effect.statBonusPct.def ?? 0
      spdBonus += trait.effect.statBonusPct.spd ?? 0
      skillBonus += trait.effect.statBonusPct.skill ?? 0
    }
    if (trait?.effect.expeditionPowerPct) {
      expeditionPowerBonus += trait.effect.expeditionPowerPct
    }
  }

  const activePassives = (shadow.shadowPassiveIds ?? []).map(id => SHADOW_PASSIVE_DEFINITIONS.find(p => p.id === id)).filter(Boolean)
  for (const passive of activePassives) {
    if (passive?.effect.statBonusPct) {
      hpBonus += passive.effect.statBonusPct.hp ?? 0
      atkBonus += passive.effect.statBonusPct.atk ?? 0
      defBonus += passive.effect.statBonusPct.def ?? 0
      spdBonus += passive.effect.statBonusPct.spd ?? 0
      skillBonus += passive.effect.statBonusPct.skill ?? 0
    }
    if (passive?.effect.expeditionPowerPct) {
      expeditionPowerBonus += passive.effect.expeditionPowerPct
    }
  }

  let legionHpBonus = 0
  let legionAtkBonus = 0
  let legionDefBonus = 0
  let legionExpeditionBonus = 0
  for (const nodeDef of SHADOW_LEGION_NODES) {
    const level = getLegionNodeLevelFn(nodeDef.id)
    if (level > 0) {
      if (nodeDef.effect.shadowHpPct) legionHpBonus += nodeDef.effect.shadowHpPct * level
      if (nodeDef.effect.shadowAtkPct) legionAtkBonus += nodeDef.effect.shadowAtkPct * level
      if (nodeDef.effect.shadowDefPct) legionDefBonus += nodeDef.effect.shadowDefPct * level
      if (nodeDef.effect.expeditionPowerPct) legionExpeditionBonus += nodeDef.effect.expeditionPowerPct * level
    }
  }

  const stats = SHADOW_STAT_KEYS.reduce((next, key) => {
    let base = roleProfile[key] * multiplier
    
    let bonusMult = 1.0
    if (key === 'shadowAttack' || key === 'shadowCrit') {
      bonusMult += atkBonus + legionAtkBonus
    } else if (key === 'shadowDefense') {
      bonusMult += defBonus + legionDefBonus
    } else if (key === 'shadowDurability' || key === 'shadowSurvival') {
      bonusMult += hpBonus + legionHpBonus
    } else if (key === 'shadowSpeed') {
      bonusMult += spdBonus
    } else {
      bonusMult += skillBonus
    }

    const mutationDelta = shadow.mutation?.statDelta?.[key] ?? 0
    next[key] = Math.max(1, Math.round(base * bonusMult) + mutationDelta)
    return next
  }, {} as ShadowStatBlock)

  const assistPower = weighted(
    [stats.shadowAttack, 0.42],
    [stats.shadowSpeed, 0.16],
    [stats.shadowCrit, 0.18],
    [stats.shadowFinisher, 0.18],
    [stats.shadowSupport, 0.06],
  )
  const guardPower = weighted(
    [stats.shadowDefense, 0.44],
    [stats.shadowDurability, 0.22],
    [stats.shadowSurvival, 0.26],
    [stats.shadowSupport, 0.08],
  )
  const controlPower = weighted(
    [stats.shadowControl, 0.48],
    [stats.shadowSuppression, 0.24],
    [stats.shadowSpeed, 0.16],
    [stats.shadowSynergy, 0.12],
  )
  const bossPower = weighted(
    [stats.shadowBossing, 0.42],
    [stats.shadowSuppression, 0.24],
    [stats.shadowFinisher, 0.2],
    [stats.shadowAttack, 0.14],
  )
  const expeditionPower = weighted(
    [stats.shadowExpedition, 0.42],
    [stats.shadowSynergy, 0.24],
    [stats.shadowSpeed, 0.16],
    [stats.shadowSupport, 0.18],
  ) * (1 + expeditionPowerBonus + legionExpeditionBonus)

  const roleSpecificContribution = ROLE_PRIMARY_STATS[shadow.role]
    .reduce((sum, key) => sum + stats[key], 0) * 0.22
  const totalPower = Math.round(
    (assistPower + guardPower + controlPower + bossPower + expeditionPower) * 1.55
    + roleSpecificContribution,
  )

  const topStats = getTopStats(stats, 3)
  const roleIdentity = [
    topStats[0]?.label,
    ROLE_IDENTITY[shadow.role],
  ].filter(Boolean).join(' ')

  return {
    stats,
    totalPower,
    assistPower,
    guardPower,
    controlPower,
    bossPower,
    expeditionPower,
    topStats,
    roleIdentity,
    roleTag: ROLE_TAG[shadow.role],
    multipliers: {
      rarity,
      innateGrade,
      level,
      enhancement,
      evolution,
      named,
      basePower,
      expedition,
    },
  }
}

export const getShadowArmyCombatPower = (shadows: OwnedShadow[]): ShadowArmyCombatPowerBreakdown => {
  const profiles = shadows.map(shadow => getShadowCombatProfile(shadow))
  const topStats = getTopStats(
    profiles.reduce((stats, profile) => {
      for (const key of SHADOW_STAT_KEYS) {
        stats[key] += profile.stats[key]
      }
      return stats
    }, SHADOW_STAT_KEYS.reduce((stats, key) => {
      stats[key] = 0
      return stats
    }, {} as ShadowStatBlock)),
    3,
  )

  return {
    totalPower: profiles.reduce((sum, profile) => sum + profile.totalPower, 0),
    assistPower: profiles.reduce((sum, profile) => sum + profile.assistPower, 0),
    guardPower: profiles.reduce((sum, profile) => sum + profile.guardPower, 0),
    controlPower: profiles.reduce((sum, profile) => sum + profile.controlPower, 0),
    bossPower: profiles.reduce((sum, profile) => sum + profile.bossPower, 0),
    expeditionPower: profiles.reduce((sum, profile) => sum + profile.expeditionPower, 0),
    topStats,
  }
}

export const getShadowCombatAggregate = (shadow: OwnedShadow): ShadowCombatAggregate => {
  const { stats } = getShadowCombatProfile(shadow)
  return {
    assistAttack: weighted(
      [stats.shadowAttack, 0.5],
      [stats.shadowCrit, 0.18],
      [stats.shadowSpeed, 0.14],
      [stats.shadowFinisher, 0.12],
      [stats.shadowSupport, 0.06],
    ),
    guardSupport: weighted(
      [stats.shadowDefense, 0.5],
      [stats.shadowDurability, 0.28],
      [stats.shadowSurvival, 0.14],
      [stats.shadowSupport, 0.08],
    ),
    controlSupport: weighted(
      [stats.shadowControl, 0.52],
      [stats.shadowSuppression, 0.24],
      [stats.shadowSpeed, 0.14],
      [stats.shadowSynergy, 0.1],
    ),
    supportUtility: weighted(
      [stats.shadowSupport, 0.52],
      [stats.shadowSynergy, 0.24],
      [stats.shadowSpeed, 0.12],
      [stats.shadowDurability, 0.12],
    ),
    survivalGuard: weighted(
      [stats.shadowSurvival, 0.48],
      [stats.shadowDefense, 0.24],
      [stats.shadowDurability, 0.2],
      [stats.shadowSupport, 0.08],
    ),
    bossPressure: weighted(
      [stats.shadowBossing, 0.48],
      [stats.shadowSuppression, 0.24],
      [stats.shadowFinisher, 0.16],
      [stats.shadowAttack, 0.12],
    ),
    speedTempo: weighted(
      [stats.shadowSpeed, 0.58],
      [stats.shadowControl, 0.16],
      [stats.shadowAttack, 0.14],
      [stats.shadowSynergy, 0.12],
    ),
    finisherPower: weighted(
      [stats.shadowFinisher, 0.5],
      [stats.shadowCrit, 0.22],
      [stats.shadowAttack, 0.18],
      [stats.shadowBossing, 0.1],
    ),
  }
}

export const getShadowArmyCombatAggregate = (shadows: OwnedShadow[]): ShadowCombatAggregate =>
  shadows.reduce((total, shadow) => {
    const aggregate = getShadowCombatAggregate(shadow)
    return {
      assistAttack: total.assistAttack + aggregate.assistAttack,
      guardSupport: total.guardSupport + aggregate.guardSupport,
      controlSupport: total.controlSupport + aggregate.controlSupport,
      supportUtility: total.supportUtility + aggregate.supportUtility,
      survivalGuard: total.survivalGuard + aggregate.survivalGuard,
      bossPressure: total.bossPressure + aggregate.bossPressure,
      speedTempo: total.speedTempo + aggregate.speedTempo,
      finisherPower: total.finisherPower + aggregate.finisherPower,
    }
  }, { ...EMPTY_SHADOW_COMBAT_AGGREGATE })

export const getShadowCombatModifiers = (
  aggregate: ShadowCombatAggregate,
  options: { lowHp?: boolean; boss?: boolean } = {},
): ShadowCombatModifiers => ({
  assistDamageBonus: boundedBonus(aggregate.assistAttack, 1200, 0.06),
  assistChanceBonus: boundedBonus(aggregate.speedTempo + aggregate.assistAttack * 0.35, 1500, 0.04),
  finisherDamageBonus: boundedBonus(aggregate.finisherPower, 1100, 0.06),
  guardReductionBonus: boundedBonus(aggregate.guardSupport, 1300, 0.035),
  guardCounterChanceBonus: boundedBonus(aggregate.guardSupport + aggregate.speedTempo * 0.25, 1500, 0.025),
  controlStrengthBonus: boundedBonus(aggregate.controlSupport, 1300, 0.025),
  controlProcBonus: boundedBonus(aggregate.controlSupport + aggregate.speedTempo * 0.25, 1500, 0.05),
  supportSkillBonus: boundedBonus(aggregate.supportUtility, 1300, 0.035),
  supportChanceBonus: boundedBonus(aggregate.supportUtility + aggregate.speedTempo * 0.2, 1500, 0.025),
  survivalReductionBonus: options.lowHp ? boundedBonus(aggregate.survivalGuard, 1300, 0.035) : 0,
  bossDamageBonus: options.boss ? boundedBonus(aggregate.bossPressure, 1300, 0.04) : 0,
  bossControlBonus: options.boss ? boundedBonus(aggregate.bossPressure, 1500, 0.02) : 0,
})
