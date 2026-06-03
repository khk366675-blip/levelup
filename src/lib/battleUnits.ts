import type {
  ActiveConsumableEffect,
  EquipmentState,
  HunterState,
  Item,
  OwnedShadow,
  ShadowDefinition,
  ShadowInnateGrade,
  ShadowRarity,
  ShadowRole,
  SkillDefinition,
  SkillRuntimeState,
  StatKey,
} from './types'
import type {
  ShadowCombatUnitProfile,
  ShadowEffectKind,
  ShadowPassiveDefinition,
  ShadowSkillDefinition,
  ShadowSkillTarget,
} from './shadowSkills'
import type { ShadowStatBlock } from './shadowStats'
import { getLegionCritBonus, getLegionEvasionBonus, getLegionAccuracyBonus } from './shadowStats'
import type {
  BattleActionDefinition,
  BattleStats,
  BattleTargetType,
  BattleTeam,
  BattleUnit,
  BattleUnitBuildResult,
} from './directBattleTypes'
import type { DirectBattleMonsterDefinition } from './directBattleMonsters'
import { getMonsterPressureScaling } from './realityPressure'
import { PROMOTION_EXAM_DEFINITIONS } from './promotionExams'
import { HunterGradeTier } from './types'

import { getEquipmentPowerBreakdown } from './equipmentPower'
import { calculatePlayerCombatStats, getEquippedItems, getPlayerCombatSkills, getEquipmentCritBonus, getEquipmentEvasionBonus, getEquipmentAccuracyBonus } from './game'
import { getShadowDefinition } from './shadows'
import { getShadowCombatUnitProfile } from './shadowSkills'
import { getValuePreview } from './shadowCombatRuntime'
import { SKILL_DEFINITIONS, MONSTER_DEFINITIONS } from './seed'
import { buildMockMonsterEncounterDefinitions, getDirectBattleMockParty } from './directBattleMonsters'
import { getSkillMastery, getSkillMasteryEffectBonus } from './skills'
import { getAvailableUpgradesForSkill, getSkillCapstoneUpgrade } from './skillUpgrades'

export interface BuildShadowBattleUnitOptions {
  team?: BattleTeam
  unitIdPrefix?: string
  currentHp?: number
}

export interface BuildHunterBattleUnitOptions {
  team?: BattleTeam
  unitId?: string
  items?: Item[]
  equipment?: EquipmentState
  activeConsumableEffects?: ActiveConsumableEffect[]
  currentHp?: number
  skillStates?: Record<string, SkillRuntimeState>
}

export interface BuildMonsterBattleUnitOptions {
  team?: BattleTeam
  unitIdPrefix?: string
  level?: number
  currentHp?: number
  pressureSnapshot?: any
  isRedGate?: boolean
  isPromotionExam?: boolean
  targetGrade?: HunterGradeTier
  isElite?: boolean // [NEW] 엘리트 몬스터 여부
  difficultyMod?: number // [NEW] 난이도 배율 보정치
}

const RARITY_MODIFIER: Record<ShadowRarity, number> = {
  common: 0.9,
  uncommon: 1,
  rare: 1.06,
  epic: 1.13,
  legendary: 1.22,
}

const GRADE_MODIFIER: Record<ShadowInnateGrade, number> = {
  C: 0.94,
  B: 1,
  A: 1.06,
  S: 1.14,
}

const ROLE_PRIORITY: Record<ShadowRole, number> = {
  assault: 4,
  guard: 1,
  hunter: 5,
  scout: 6,
  support: 2,
  analyst: 3,
}

const DEFAULT_STATS: BattleStats = {
  maxHp: 1,
  currentHp: 1,
  atk: 1,
  def: 1,
  spd: 1,
  skillPower: 1,
  crit: 0,
  accuracy: 0.95,
  evasionRate: 0,
  controlPower: 0,
  supportPower: 0,
  survivalPower: 0,
  bossPower: 0,
  synergyPower: 0,
}

const clamp = (value: number, min = 0, max = 99999999): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))

const round = (value: number, min = 0, max = 99999999): number =>
  Math.round(clamp(value, min, max))

const capRatio = (value: number): number =>
  Math.round(clamp(value, 0, 1.5) * 100) / 100

const capProbability = (value: number, max = 0.99): number =>
  Math.round(clamp(value, 0, max) * 1000) / 1000

const SHADOW_CRIT_RATE_CAP = 0.55
const SHADOW_CRIT_STAT_SCALE = 0.002
const SHADOW_FINISHER_CRIT_SCALE = 0.0006
const SHADOW_ACCURACY_BASE = 0.78
const SHADOW_CONTROL_ACCURACY_SCALE = 0.00045
const SHADOW_SUPPRESSION_ACCURACY_SCALE = 0.0003
const SHADOW_SPEED_EVASION_SCALE = 0.00125
const SHADOW_SURVIVAL_EVASION_SCALE = 0.0003

const capShadowCritRate = (value: number): number =>
  capProbability(value, SHADOW_CRIT_RATE_CAP)

const safeCurrentHp = (currentHp: number | undefined, maxHp: number): number =>
  round(currentHp ?? maxHp, 0, maxHp)

const compressShadowBattleStat = (value: number): number => {
  if (value <= 100) return value
  return 100 + (value - 100) * 0.55
}

const SHADOW_BATTLE_LIFT = 1.22
const SHADOW_HP_BATTLE_LIFT = 1.95
const MONSTER_BATTLE_LIFT = 1.04

const targetTypeFromShadowTarget = (target: ShadowSkillTarget): BattleTargetType => {
  if (target === 'self') return 'self'
  if (target === 'party') return 'all_allies'
  if (target === 'hunter') return 'single_ally'
  if (target === 'boss') return 'boss'
  return 'single_enemy'
}

const baseAction = (
  unitId: string,
  actionId: string,
  label: string,
  targetType: BattleTargetType,
  basePriority: number,
  description?: string,
): BattleActionDefinition => ({
  actionId: `${unitId}:${actionId}`,
  label,
  description,
  actionType: actionId === 'guard' ? 'guard' : actionId === 'wait' ? 'wait' : 'basic',
  targetType,
  effectKind: actionId === 'wait' ? 'wait' : actionId === 'guard' ? 'guard' : 'basic',
  basePriority,
  cooldown: 0,
  actionCue: actionId,
  animationCue: actionId,
  effectColor: actionId === 'guard' ? 'slate' : 'zinc',
})

const buildShadowActionEffects = (
  profile: ShadowCombatUnitProfile,
  ability: ShadowSkillDefinition | ShadowPassiveDefinition,
  sourceKind: 'active' | 'passive',
): any[] => {
  const value = getValuePreview(profile, ability, sourceKind)
  const isEnemyTarget = ability.effectKind === 'control' || ability.effectKind === 'bossing'
  const targetScope = isEnemyTarget ? 'enemy' : 'self'

  if (ability.effectKind === 'control') {
    return [
      { kind: 'stat', stat: 'def', value: -value * 1.5, durationTurns: 2, target: targetScope },
      { kind: 'stat', stat: 'speed', value: -value * 1.1, durationTurns: 2, target: targetScope },
      { kind: 'stat', stat: 'accuracy', value: -0.12, durationTurns: 2, target: targetScope },
    ]
  }
  if (ability.effectKind === 'bossing') {
    return [
      { kind: 'stat', stat: 'def', value: -value * 1.8, durationTurns: 2, target: targetScope },
      { kind: 'stat', stat: 'evasionRate', value: -0.15, durationTurns: 2, target: targetScope },
    ]
  }
  if (ability.effectKind === 'guard' || ability.effectKind === 'survival') {
    return [
      { kind: 'damage_reduction', value: value, durationTurns: 1, target: 'self' },
    ]
  }
  if (ability.effectKind === 'support' || ability.effectKind === 'cooldown' || ability.effectKind === 'synergy') {
    return [
      { kind: 'stat', stat: 'atk', value: value * 1.2, durationTurns: 2, target: 'self' },
      { kind: 'stat', stat: 'speed', value: value * 0.8, durationTurns: 2, target: 'self' },
    ]
  }
  if (ability.effectKind === 'damage' || ability.effectKind === 'hybrid') {
    return [
      { kind: 'stat', stat: 'critRate', value: 0.12, durationTurns: 1, target: 'self' },
    ]
  }
  return []
}

const skillAction = (
  unitId: string,
  skill: ShadowSkillDefinition,
  effects: any[] = [],
): BattleActionDefinition => ({
  actionId: `${unitId}:skill:${skill.id}`,
  label: skill.name || skill.shortLabel,
  description: skill.description,
  actionType: 'skill',
  targetType: targetTypeFromShadowTarget(skill.target),
  effectKind: skill.effectKind,
  basePriority: skill.effectKind === 'damage' ? 2 : 1,
  cooldown: skill.cooldownRounds,
  sourceSkillId: skill.id,
  actionCue: skill.actionCue,
  animationCue: skill.animationCue,
  effectColor: skill.effectColor,
  effects,
})

const hunterSkillEffectKind = (skill: SkillDefinition): BattleActionDefinition['effectKind'] => {
  if (skill.type === 'defense') return 'guard'
  if (skill.type === 'heal' || skill.type === 'buff' || skill.type === 'utility') return 'support'
  if (skill.type === 'debuff') return 'control'
  return 'damage'
}

const hunterSkillTargetType = (skill: SkillDefinition): BattleTargetType => {
  if (skill.targetType) return skill.targetType as BattleTargetType
  if (skill.type === 'attack' || skill.type === 'damage' || skill.type === 'debuff') {
    return 'single_enemy'
  }
  const effectTarget = skill.effect?.target ?? skill.effects?.[0]?.target
  if (skill.type === 'defense' || effectTarget === 'self') return 'self'
  if (skill.type === 'heal' || skill.type === 'buff') return 'lowest_hp_ally'
  return 'single_enemy'
}

const hunterSkillAction = (
  unitId: string,
  skill: SkillDefinition,
  runtime?: SkillRuntimeState,
): BattleActionDefinition => {
  const masteryLevel = runtime?.masteryLevel ?? 1
  const baseMultiplier = 1 + getSkillMasteryEffectBonus(skill, masteryLevel)
  
  let masteryMultiplier = baseMultiplier
  let cooldownReduction = 0
  let critRateBonus = 0
  let defenseIgnore = 0
  let bossDamageBonus = 0
  let statusValueBonus = 0
  let telegraphDamageReduction = 0

  // 1차 진화/강화 (Lv.5)
  if (runtime?.selectedUpgradeId) {
    const upgrades = getAvailableUpgradesForSkill(skill)
    const selected = upgrades.find(u => u.id === runtime.selectedUpgradeId)
    if (selected?.effects) {
      if (selected.effects.powerMultiplier) {
        masteryMultiplier *= selected.effects.powerMultiplier
      }
      if (selected.effects.cooldownReduction) {
        cooldownReduction += selected.effects.cooldownReduction
      }
      if (selected.effects.critRateBonus) {
        critRateBonus += selected.effects.critRateBonus
      }
      if (selected.effects.defenseIgnore) {
        defenseIgnore += selected.effects.defenseIgnore
      }
      if (selected.effects.bossDamageBonus) {
        bossDamageBonus += selected.effects.bossDamageBonus
      }
      if (selected.effects.statusValueBonus) {
        statusValueBonus += selected.effects.statusValueBonus
      }
      if (selected.effects.telegraphDamageReduction) {
        telegraphDamageReduction += selected.effects.telegraphDamageReduction
      }
    }
  }

  // Capstone 각성 (Lv.10)
  if (runtime?.isCapstoneUnlocked) {
    const capstone = getSkillCapstoneUpgrade(skill)
    if (capstone.cooldownReduction) {
      cooldownReduction += capstone.cooldownReduction
    }
    if (capstone.powerMultiplier) {
      masteryMultiplier *= capstone.powerMultiplier
    }
    if (capstone.critRateBonus) {
      critRateBonus += capstone.critRateBonus
    }
    if (capstone.defenseIgnore) {
      defenseIgnore += capstone.defenseIgnore
    }
    if (capstone.bossDamageBonus) {
      bossDamageBonus += capstone.bossDamageBonus
    }
    if (capstone.statusValueBonus) {
      statusValueBonus += capstone.statusValueBonus
    }
    if (capstone.telegraphDamageReduction) {
      telegraphDamageReduction += capstone.telegraphDamageReduction
    }
  }

  const baseCooldown = Math.max(0, skill.cooldownTurns ?? skill.cooldown ?? 0)
  const finalCooldown = Math.max(baseCooldown > 0 ? 1 : 0, baseCooldown - cooldownReduction)

  return {
    actionId: `${unitId}:skill:${skill.id}`,
    label: skill.name || '헌터 스킬',
    description: skill.effectSummary
      ? `${skill.description} (${skill.effectSummary})`
      : skill.description,
    actionType: 'skill',
    targetType: hunterSkillTargetType(skill),
    effectKind: hunterSkillEffectKind(skill),
    basePriority: skill.type === 'defense' ? 2 : 1,
    cooldown: finalCooldown,
    sourceSkillId: skill.id,
    actionCue: skill.id,
    animationCue: skill.id,
    effectColor: skill.type === 'defense' ? 'cyan' : skill.type === 'debuff' ? 'violet' : 'blue',
    effects: skill.effects ?? (skill.effect ? [skill.effect] : []),
    masteryMultiplier,
    selectedUpgradeId: runtime?.selectedUpgradeId,
    isCapstoneUnlocked: runtime?.isCapstoneUnlocked,
    critRateBonus,
    defenseIgnore,
    bossDamageBonus,
    statusValueBonus,
    telegraphDamageReduction,
  }
}

const passiveAction = (
  unitId: string,
  passive: ShadowPassiveDefinition,
  effects: any[] = [],
): BattleActionDefinition => ({
  actionId: `${unitId}:passive:${passive.id}`,
  label: passive.shortLabel || passive.name,
  actionType: 'passive',
  targetType: 'self',
  effectKind: passive.effectKind,
  basePriority: 0,
  sourcePassiveId: passive.id,
  actionCue: passive.actionCue,
  animationCue: passive.triggerCue,
  effectColor: 'slate',
  effects,
  timing: passive.condition?.timing ?? 'round_start',
})

const roleSkillStat = (role: ShadowRole, stats: ShadowStatBlock): number => {
  const attack = compressShadowBattleStat(stats.shadowAttack)
  const defense = compressShadowBattleStat(stats.shadowDefense)
  const durability = compressShadowBattleStat(stats.shadowDurability)
  const speed = compressShadowBattleStat(stats.shadowSpeed)
  const crit = compressShadowBattleStat(stats.shadowCrit)
  const finisher = compressShadowBattleStat(stats.shadowFinisher)
  const control = compressShadowBattleStat(stats.shadowControl)
  const suppression = compressShadowBattleStat(stats.shadowSuppression)
  const support = compressShadowBattleStat(stats.shadowSupport)
  const survival = compressShadowBattleStat(stats.shadowSurvival)
  const bossing = compressShadowBattleStat(stats.shadowBossing)
  const expedition = compressShadowBattleStat(stats.shadowExpedition)
  const synergy = compressShadowBattleStat(stats.shadowSynergy)
  if (role === 'guard') return defense * 0.30 + durability * 0.20 + survival * 0.16
  if (role === 'support') return support * 0.36 + synergy * 0.22 + survival * 0.08
  if (role === 'analyst') return control * 0.30 + suppression * 0.24 + bossing * 0.12
  if (role === 'scout') return speed * 0.30 + control * 0.24 + expedition * 0.06
  if (role === 'hunter') return finisher * 0.30 + speed * 0.20 + attack * 0.14
  return attack * 0.32 + crit * 0.18 + finisher * 0.16
}

// 12-30B-4: Shadow BattleUnit conversion receives a small recovery lift.
// Shadow raw stats / rarity / innateGrade / enhancement / evolution / skill / passive
// definitions are NOT touched. Only the battle conversion layer is nudged so
// shadows feel worth bringing while hunter remains the primary carry.
export const convertShadowProfileToBattleStats = (
  profile: ShadowCombatUnitProfile,
  currentHp?: number,
): BattleStats => {
  const rawStats = profile.stats
  const stats: ShadowStatBlock = {
    shadowAttack: compressShadowBattleStat(rawStats.shadowAttack),
    shadowDefense: compressShadowBattleStat(rawStats.shadowDefense),
    shadowDurability: compressShadowBattleStat(rawStats.shadowDurability),
    shadowSpeed: compressShadowBattleStat(rawStats.shadowSpeed),
    shadowCrit: compressShadowBattleStat(rawStats.shadowCrit),
    shadowFinisher: compressShadowBattleStat(rawStats.shadowFinisher),
    shadowControl: compressShadowBattleStat(rawStats.shadowControl),
    shadowSuppression: compressShadowBattleStat(rawStats.shadowSuppression),
    shadowSupport: compressShadowBattleStat(rawStats.shadowSupport),
    shadowSurvival: compressShadowBattleStat(rawStats.shadowSurvival),
    shadowBossing: compressShadowBattleStat(rawStats.shadowBossing),
    shadowExpedition: compressShadowBattleStat(rawStats.shadowExpedition),
    shadowSynergy: compressShadowBattleStat(rawStats.shadowSynergy),
  }
  const rarity = RARITY_MODIFIER[profile.rarity]
  const grade = GRADE_MODIFIER[profile.innateGrade]
  const levelGrowth = 1 + Math.max(0, profile.level - 1) * 0.015
  const levelGrowthHp = 1 + Math.max(0, profile.level - 1) * 0.072
  const enhancementGrowth = 1 + Math.max(0, profile.enhancement) * 0.028
  const quality = rarity * grade * levelGrowth * enhancementGrowth
  const qualityHp = rarity * grade * levelGrowthHp * enhancementGrowth
  const hpRoleModifier = profile.role === 'guard'
    ? 1.65
    : profile.role === 'support' || profile.role === 'analyst'
      ? 1.15
      : 1.22
  const guardLift = profile.role === 'guard' ? 1.28 : 1
  const assaultLift = profile.role === 'assault' || profile.role === 'hunter' ? 1.02 : 1
  const speedLift = profile.role === 'scout' || profile.role === 'hunter' ? 1.02 : 1
  const supportLift = profile.role === 'support' || profile.role === 'analyst' ? 1.02 : 1

  const legionCritBonus = getLegionCritBonus()
  const legionEvasionBonus = getLegionEvasionBonus()
  const legionAccuracyBonus = getLegionAccuracyBonus()

  const maxHp = round(
    (60 + stats.shadowDurability * 0.9 + stats.shadowSurvival * 0.6 + profile.level * 2.0) * qualityHp * hpRoleModifier * SHADOW_HP_BATTLE_LIFT * guardLift,
    1,
    99999999,
  )
  const battleStats: BattleStats = {
    maxHp,
    currentHp: safeCurrentHp(currentHp, maxHp),
    atk: round((7 + stats.shadowAttack * 0.85 + stats.shadowCrit * 0.13 + stats.shadowFinisher * 0.20) * quality * SHADOW_BATTLE_LIFT * assaultLift, 1),
    def: round((5 + stats.shadowDefense * 0.82 + stats.shadowDurability * 0.32 + stats.shadowSurvival * 0.28) * quality * SHADOW_BATTLE_LIFT * guardLift, 1),
    spd: round((8 + stats.shadowSpeed * 0.82 + ROLE_PRIORITY[profile.role] * 0.45) * (0.95 + grade * 0.05) * 1.08 * speedLift, 1, 300),
    skillPower: round((7 + roleSkillStat(profile.role, stats)) * quality * SHADOW_BATTLE_LIFT * supportLift, 1),
    crit: capShadowCritRate(((stats.shadowCrit * SHADOW_CRIT_STAT_SCALE + stats.shadowFinisher * SHADOW_FINISHER_CRIT_SCALE) * grade) + legionCritBonus),
    accuracy: capProbability(SHADOW_ACCURACY_BASE + (stats.shadowControl * SHADOW_CONTROL_ACCURACY_SCALE + stats.shadowSuppression * SHADOW_SUPPRESSION_ACCURACY_SCALE) * grade + legionAccuracyBonus),
    evasionRate: capProbability(((stats.shadowSpeed * SHADOW_SPEED_EVASION_SCALE + stats.shadowSurvival * SHADOW_SURVIVAL_EVASION_SCALE) * grade) + legionEvasionBonus, 0.40),
    controlPower: round((stats.shadowControl * 0.85 + stats.shadowSuppression * 0.5) * quality * SHADOW_BATTLE_LIFT * supportLift, 0),
    supportPower: round((stats.shadowSupport * 0.88 + stats.shadowSynergy * 0.34) * quality * SHADOW_BATTLE_LIFT * supportLift, 0),
    survivalPower: round((stats.shadowSurvival * 0.9 + stats.shadowDurability * 0.38) * quality * SHADOW_BATTLE_LIFT * guardLift, 0),
    bossPower: round((stats.shadowBossing * 0.85 + stats.shadowSuppression * 0.36) * quality * SHADOW_BATTLE_LIFT, 0),
    synergyPower: round((stats.shadowSynergy * 0.85 + stats.shadowSupport * 0.26) * quality * SHADOW_BATTLE_LIFT * supportLift, 0),
  }

  return battleStats
}

export const buildShadowBattleUnit = (
  shadow: OwnedShadow,
  definition: ShadowDefinition | undefined = getShadowDefinition(shadow.definitionId),
  options: BuildShadowBattleUnitOptions = {},
): BattleUnitBuildResult => {
  const profile = getShadowCombatUnitProfile(shadow, definition)
  const unitId = `${options.unitIdPrefix ?? 'shadow'}-${shadow.instanceId}`
  const stats = convertShadowProfileToBattleStats(profile, options.currentHp)
  const actionList = [
    baseAction(unitId, 'basic', 'Basic Attack', 'single_enemy', 0),
    ...profile.activeSkills.slice(0, 2).map(skill => 
      skillAction(unitId, skill, buildShadowActionEffects(profile, skill, 'active'))
    ),
    baseAction(unitId, 'guard', 'Guard', 'single_ally', 2),
    baseAction(unitId, 'wait', 'Wait', 'self', -1),
  ]

  return {
    unit: {
      unitId,
      sourceId: shadow.instanceId,
      unitType: 'shadow',
      displayName: shadow.name,
      role: profile.role,
      team: options.team ?? 'player',
      level: profile.level,
      stats,
      statusEffects: [],
      cooldowns: {},
      actionList,
      passiveList: profile.passives.slice(0, 3).map(passive => 
        passiveAction(unitId, passive, buildShadowActionEffects(profile, passive, 'passive'))
      ),
      actionPriority: ROLE_PRIORITY[profile.role],
      boardLane: profile.actionProfile.boardLane,
      actionCue: profile.actionProfile.actionCue,
      animationCue: profile.actionProfile.animationHooks.activeSkill ?? profile.actionProfile.animationHooks.idle,
      effectColor: profile.actionProfile.effectColor,
      metadata: {
        source: 'shadow_profile',
        rarity: profile.rarity,
        innateGrade: profile.innateGrade,
        definitionId: profile.definitionId,
        profileCombatPower: profile.combatPower.totalPower,
        tags: profile.summaryBadges,
        hiddenSafe: true,
      },
    },
    warnings: definition ? [] : [`Missing shadow definition for ${shadow.definitionId}; generic fallback profile was used.`],
  }
}

export const buildShadowBattleUnits = (
  shadows: OwnedShadow[],
  definitions: ShadowDefinition[] = [],
  options: BuildShadowBattleUnitOptions = {},
): BattleUnitBuildResult[] =>
  shadows.map(shadow =>
    buildShadowBattleUnit(
      shadow,
      definitions.find(definition => definition.id === shadow.definitionId) ?? getShadowDefinition(shadow.definitionId),
      options,
    ),
  )

const stat = (stats: Record<StatKey, number>, key: StatKey): number =>
  clamp(stats[key] ?? 0, 0)

export const buildHunterBattleUnit = (
  hunter: HunterState,
  options: BuildHunterBattleUnitOptions = {},
 ): BattleUnitBuildResult => {
  const equippedItems = options.items && options.equipment ? getEquippedItems(options.items, options.equipment) : []
  const activeJobId = hunter.activeJobId || hunter.jobId
  const jobLevel = hunter.jobs?.[activeJobId]?.level ?? 1
  const skills = getPlayerCombatSkills({
    jobId: activeJobId,
    jobLevel,
    equippedItems,
    allSkills: SKILL_DEFINITIONS,
    includeBasicKit: true,
  })
  const combatStats = calculatePlayerCombatStats({
    level: hunter.level,
    stats: hunter.stats,
    equippedItems,
    activeConsumableEffects: options.activeConsumableEffects,
    jobId: activeJobId,
    skills,
  })
  const equipmentValues = equippedItems.map(item => getEquipmentPowerBreakdown(item))
  const equipmentOffense = equipmentValues.reduce((sum, item) => sum + item.offenseValue * 0.34 + item.skillValue * 0.16, 0)
  const equipmentDefense = equipmentValues.reduce((sum, item) => sum + item.defenseValue * 0.24 + item.survivalValue * 0.14, 0)
  const equipmentSupport = equipmentValues.reduce((sum, item) => sum + item.utilityValue * 0.16 + item.shadowSynergyValue * 0.22, 0)
  const equipmentSurvival = equipmentValues.reduce((sum, item) => sum + item.defenseValue * 0.18 + item.survivalValue * 0.28, 0)
  const equipmentSkill = equipmentValues.reduce((sum, item) => sum + item.skillValue * 0.36 + item.offenseValue * 0.14 + item.shadowSynergyValue * 0.1, 0)
  const equipmentTotal = equipmentValues.reduce((sum, item) => sum + item.totalEquipmentValue, 0)
  const equipmentCrit = getEquipmentCritBonus(equippedItems)
  const equipmentEvasion = getEquipmentEvasionBonus(equippedItems)
  const equipmentAccuracy = getEquipmentAccuracyBonus(equippedItems)
  const maxHp = round(
    combatStats.maxHp * 2.22 +
    stat(hunter.stats, 'VIT') * 12.5 +
    stat(hunter.stats, 'PER') * 4.5 +
    equipmentSurvival * 1.68 +
    equipmentTotal * 0.25,
    1,
  )
  const unitId = options.unitId ?? 'hunter-main'
  const basicSkill = skills.find(skill => skill.id === 'basic-attack')
  const guardSkill = skills.find(skill => skill.id === 'basic-guard-stance')
  const hunterSkillActions = skills
    .filter(skill => skill.id !== 'basic-attack' && skill.id !== 'basic-guard-stance')
    .map(skill => hunterSkillAction(unitId, skill, getSkillMastery(options.skillStates, skill.id)))

  return {
    unit: {
      unitId,
      sourceId: 'hunter',
      unitType: 'hunter',
      displayName: hunter.name || 'Hunter',
      role: hunter.jobId,
      team: options.team ?? 'player',
      level: hunter.level,
      stats: {
        maxHp,
        currentHp: safeCurrentHp(options.currentHp, maxHp),
        atk: round(combatStats.atk * 1.52 + stat(hunter.stats, 'STR') * 1.2 + stat(hunter.stats, 'AGI') * 0.38 + equipmentOffense, 1),
        def: round(combatStats.def * 1.55 + stat(hunter.stats, 'PER') * 2.0 + equipmentDefense, 1),
        spd: round(combatStats.speed * 1.08 + stat(hunter.stats, 'AGI') * 0.18, 1, 300),
        skillPower: round(
          combatStats.skillTotalPower * 1.82 +
          combatStats.atk * 0.92 +
          stat(hunter.stats, 'INT') * 2.82 +
          stat(hunter.stats, 'STR') * 0.95 +
          equipmentSkill,
          1,
        ),
        crit: capProbability(combatStats.critRate + equipmentCrit, 0.55),
        accuracy: capProbability(combatStats.accuracy + equipmentAccuracy, 0.99),
        evasionRate: capProbability(combatStats.evasionRate + equipmentEvasion, 0.40),
        controlPower: round(stat(hunter.stats, 'INT') * 2.2 + stat(hunter.stats, 'SEN') * 1.4, 0),
        supportPower: round(stat(hunter.stats, 'INT') * 1.3 + stat(hunter.stats, 'SEN') * 1.9 + equipmentSupport, 0),
        survivalPower: round(stat(hunter.stats, 'VIT') * 3.5 + stat(hunter.stats, 'PER') * 2.5 + equipmentSurvival, 0),
        bossPower: round(combatStats.skillTotalPower * 0.35 + stat(hunter.stats, 'STR') * 0.8 + stat(hunter.stats, 'SEN') * 0.8, 0),
        synergyPower: round(stat(hunter.stats, 'SEN') * 2.1 + equipmentSupport, 0),
      },
      statusEffects: [],
      cooldowns: {},
      actionList: [
        baseAction(unitId, 'basic', basicSkill?.name ?? '기본 공격', 'single_enemy', 0, basicSkill?.description ?? '가장 기본적인 공격입니다.'),
        ...(hunterSkillActions.length > 0
          ? hunterSkillActions
          : [hunterSkillAction(unitId, {
              id: 'hunter-skill',
              name: '헌터 스킬',
              description: '이 헌터의 대표 전투 스킬을 사용합니다.',
              ownerType: 'common',
              source: 'basic',
              type: 'attack',
              cooldown: 2,
              cooldownTurns: 2,
            })]),
        baseAction(unitId, 'guard', guardSkill?.name ?? '방어', 'self', 2, guardSkill?.description ?? '이번 라운드 받는 피해를 줄입니다.'),
        baseAction(unitId, 'wait', 'Wait', 'self', -1),
      ],
      passiveList: [],
      actionPriority: 3,
      boardLane: 'anchor',
      actionCue: 'hunter_command',
      animationCue: 'hunter-idle',
      effectColor: 'blue',
      metadata: {
        source: 'hunter',
        tags: equipmentValues.flatMap(item => item.topTags).slice(0, 4),
        hiddenSafe: true,
      },
    },
    warnings: [],
  }
}

export const buildMonsterBattleUnit = (
  definition: DirectBattleMonsterDefinition,
  options: BuildMonsterBattleUnitOptions = {},
 ): BattleUnitBuildResult => {
   const level = Math.max(1, options.level ?? definition.baseLevel)
   const scale = 1 + (level - 1) * 0.088 + Math.max(0, level - 3) * 0.012
   const bossScale = definition.unitType === 'boss' || definition.isBoss ? 1.28 : 1
   const minionScale = definition.unitType === 'minion' || definition.isMinion ? 0.94 : 1
   const threatScale = bossScale * minionScale
   
   let hpMultiplier = 1.0
   let atkMultiplier = 1.0
   let defMultiplier = 1.0

   const isBoss = definition.unitType === 'boss' || definition.isBoss || definition.role === 'boss'
   const isMinion = definition.unitType === 'minion' || definition.isMinion || definition.role === 'minion'

   if (isBoss) {
     hpMultiplier = 2.45
     atkMultiplier = 1.25
     defMultiplier = 1.25
   } else if (definition.role === 'tank') {
     hpMultiplier = 1.6
     atkMultiplier = 0.8
     defMultiplier = 1.4
   } else if (definition.role === 'bruiser') {
     hpMultiplier = 1.3
     atkMultiplier = 1.08
     defMultiplier = 1.1
   } else if (definition.role === 'caster') {
     hpMultiplier = 0.82
     atkMultiplier = 1.22
     defMultiplier = 0.8
   } else if (definition.role === 'assassin') {
     hpMultiplier = 0.78
     atkMultiplier = 1.28
     defMultiplier = 0.75
   } else if (isMinion) {
     hpMultiplier = 0.58
     atkMultiplier = 0.75
     defMultiplier = 0.7
   } else {
     hpMultiplier = 0.9
     atkMultiplier = 0.9
     defMultiplier = 0.9
   }

   if (options.isElite) {
     hpMultiplier *= 1.45
     atkMultiplier *= 1.18
     defMultiplier *= 1.18
   }

   // 현실 각성공명 압박(Reality Pressure) 반영 + 승급 시험 보정 반영
   const monsterRole = definition.unitType || (definition.isBoss ? 'boss' : definition.isMinion ? 'minion' : 'normal')
   const pressure = getMonsterPressureScaling(
     options.pressureSnapshot,
     monsterRole,
     options.isRedGate,
     options.isPromotionExam,
     options.targetGrade
   )
   const diffMod = options.difficultyMod ?? 1.0

   // safe-navigation 가드를 적용한 statBias 디폴트 변수 정의
   const biasHp = definition.statBias?.hp ?? 1.0
   const biasAtk = definition.statBias?.atk ?? 1.0
   const biasDef = definition.statBias?.def ?? 1.0
   const biasSpd = definition.statBias?.spd ?? 1.0
   const biasSkill = definition.statBias?.skill ?? 1.0
   const biasCrit = definition.statBias?.crit ?? 1.0
   const biasControl = definition.statBias?.control ?? 0.7
   const biasSupport = definition.statBias?.support ?? 0.45
   const biasSurvival = definition.statBias?.survival ?? biasDef
   const biasBoss = definition.statBias?.boss ?? (definition.unitType === 'boss' ? 1.4 : 0.35)
   const biasSynergy = definition.statBias?.synergy ?? 0.55
 
   const monsterSeedDef = MONSTER_DEFINITIONS.find(m => m.id === definition.id)
   const rankKey = definition.rank || monsterSeedDef?.rank
   const isLowRank = rankKey ? (rankKey === 'E' || rankKey === 'D' || rankKey === 'C') : (definition.levelBand === 'early' || level < 15)

   const lowRankHpMultiplier = isLowRank ? 1.12 : 1.0
   const lowRankAtkMultiplier = isLowRank ? 1.08 : 1.0
 
   const maxHp = round((115 + level * 23.5) * biasHp * scale * threatScale * hpMultiplier * MONSTER_BATTLE_LIFT * pressure.hp * diffMod * lowRankHpMultiplier, 1)
   const unitId = `${options.unitIdPrefix ?? 'enemy'}-${definition.id}-${level}`
   
   const isBossName = definition.unitType === 'boss' || definition.isBoss
   const examDef = options.isPromotionExam && options.targetGrade && options.targetGrade !== 'E' ? PROMOTION_EXAM_DEFINITIONS[options.targetGrade] : undefined
   const displayName = (isBossName && examDef?.bossEmphasisName) ? examDef.bossEmphasisName : definition.name
  
   return {
     unit: {
       unitId,
       sourceId: definition.id,
       unitType: definition.unitType,
       displayName,
       role: definition.role,
       team: options.team ?? 'enemy',
       level,
       stats: {
         maxHp,
         currentHp: safeCurrentHp(options.currentHp, maxHp),
         // 몬스터 공격력/스킬위력 전체 15% 하향 (0.85 배율 적용)
         atk: round((16 + level * 4.55) * biasAtk * scale * threatScale * atkMultiplier * MONSTER_BATTLE_LIFT * pressure.atk * diffMod * 0.85 * lowRankAtkMultiplier, 1),
         def: round((10 + level * 2.05) * biasDef * scale * (definition.isBoss ? 1.12 : 1) * defMultiplier * MONSTER_BATTLE_LIFT * pressure.def * diffMod, 1),
         spd: round((10 + level * 1.05) * biasSpd * (definition.role === 'assassin' ? 1.08 : 1) * 1.02, 1, 300),
         skillPower: round((15 + level * 3.95) * biasSkill * scale * threatScale * atkMultiplier * MONSTER_BATTLE_LIFT * pressure.atk * diffMod * 0.85 * lowRankAtkMultiplier, 1),
        crit: capRatio((0.04 + level * 0.003) * biasCrit * (isLowRank ? 0.8 : 1.0)),
        accuracy: capProbability((isLowRank ? 0.86 : 0.89) + level * 0.0015 + (definition.role === 'caster' || definition.role === 'controller' ? 0.01 : 0)),
        evasionRate: capProbability(
          (
            (
              definition.role === 'assassin' ? 0.055 :
              definition.role === 'caster' ? 0.035 :
              definition.role === 'minion' ? 0.025 :
              0.018
            ) * biasSpd + level * 0.0008
          ) * (isLowRank ? 0.8 : 1.0),
          0.25,
        ),
        controlPower: round((5 + level * 1.7) * biasControl * scale * MONSTER_BATTLE_LIFT, 0),
        supportPower: round((4 + level * 1.5) * biasSupport * scale * MONSTER_BATTLE_LIFT, 0),
        survivalPower: round((6 + level * 1.6) * biasSurvival * scale * MONSTER_BATTLE_LIFT, 0),
        bossPower: round((level * 2.2) * biasBoss * scale * MONSTER_BATTLE_LIFT, 0),
        synergyPower: round((4 + level * 1.2) * biasSynergy * scale * MONSTER_BATTLE_LIFT, 0),
      },
      statusEffects: [],
      cooldowns: {},
      actionList: definition.actionList,
      passiveList: [],
      actionPriority: definition.role === 'assassin' ? 5 : definition.role === 'boss' ? 2 : 1,
      boardLane: definition.boardLane,
      actionCue: definition.actionCue,
      animationCue: definition.animationCue,
      effectColor: definition.effectColor,
      metadata: {
        source: 'mock_monster',
        definitionId: definition.id,
        tags: [
          definition.role,
          definition.levelBand,
          definition.targetPriority,
          ...definition.intentCandidates,
          ...(definition.isBoss ? ['boss'] : []),
          ...(definition.isMinion ? ['minion'] : []),
        ],
        hiddenSafe: true,
      },
    },
    warnings: [],
  }
}

export const buildMockMonsterParty = (
  encounterKey = 'basic',
  options: BuildMonsterBattleUnitOptions = {},
): BattleUnitBuildResult[] => {
  const party = getDirectBattleMockParty(encounterKey)
  const definitions = buildMockMonsterEncounterDefinitions(encounterKey)
  return definitions.slice(0, 3).map((definition, index) => {
    const slot = party.slots[index]
    const level = options.level ?? Math.max(1, definition.baseLevel + (slot?.levelOffset ?? 0))
    return buildMonsterBattleUnit(definition, {
      ...options,
      level,
      unitIdPrefix: `${options.unitIdPrefix ?? 'enemy'}-${party.encounterKey}-${index + 1}`,
    })
  })
}

export const validateBattleUnit = (unit: BattleUnit): string[] => {
  const issues: string[] = []
  for (const [key, value] of Object.entries(unit.stats) as Array<[keyof BattleStats, number]>) {
    if (!Number.isFinite(value)) issues.push(`${unit.unitId}.${key} is not finite`)
    if (value < 0) issues.push(`${unit.unitId}.${key} is negative`)
  }
  if (unit.stats.maxHp < 1) issues.push(`${unit.unitId}.maxHp is below 1`)
  if (unit.stats.currentHp > unit.stats.maxHp) issues.push(`${unit.unitId}.currentHp exceeds maxHp`)
  if (unit.actionList.length === 0) issues.push(`${unit.unitId} has no actions`)
  if (!unit.actionCue) issues.push(`${unit.unitId} missing actionCue`)
  if (!unit.boardLane) issues.push(`${unit.unitId} missing boardLane`)
  return issues
}

export const emptyBattleStats = (): BattleStats => ({ ...DEFAULT_STATS })
