import type { ActiveCombatEffect, BattleTurn, OwnedShadow } from './types'
import {
  type ShadowActionEvent,
  type ShadowActionKind,
  type ShadowAbilitySource,
  type ShadowCombatUnitProfile,
  type ShadowEffectKind,
  type ShadowPassiveDefinition,
  type ShadowPassiveEffectKind,
  type ShadowSkillDefinition,
  type ShadowTriggerCondition,
  getShadowCombatUnitProfile,
} from './shadowSkills'

export interface ShadowCombatRuntimeActor {
  id: string
  name: string
  hp: number
  maxHp: number
  def: number
}

export interface ShadowCombatRuntimeState {
  roundActionsUsed: number
  maxActionsPerRound: number
  softCooldownKeys: string[]
}

export interface ShadowRuntimeEvent extends ShadowActionEvent {
  shadow: OwnedShadow
  profile: ShadowCombatUnitProfile
  sourceKind: 'active' | 'passive'
  sourceName: string
  triggerChance: number
}

export interface ResolveShadowActionRuntimeParams {
  shadows?: OwnedShadow[]
  player: ShadowCombatRuntimeActor
  monster: ShadowCombatRuntimeActor
  activeEffects: ActiveCombatEffect[]
  rng: () => number
  turnNumber: number
  phase: 'player_after_action' | 'wave_start' | 'player_defend'
  playerUsedSkill?: boolean
  maxActionsPerRound?: number
}

export interface ResolveShadowActionRuntimeResult {
  events: ShadowRuntimeEvent[]
  state: ShadowCombatRuntimeState
}

const ACTIVE_HARD_CAP = 0.12
const UNIQUE_ACTIVE_HARD_CAP = 0.14
const PASSIVE_HARD_CAP = 0.08
const UNIQUE_PASSIVE_HARD_CAP = 0.10

const SOURCE_CHANCE_MULTIPLIER: Record<ShadowAbilitySource, number> = {
  generic: 0.72,
  template: 0.86,
  prototype: 1.04,
  unique: 1.12,
}

const SOURCE_VALUE_MULTIPLIER: Record<ShadowAbilitySource, number> = {
  generic: 0.74,
  template: 0.88,
  prototype: 1.08,
  unique: 1.2,
}

const ACTIVE_HARD_CAP_BY_SOURCE: Record<ShadowAbilitySource, number> = {
  generic: 0.07,
  template: 0.09,
  prototype: ACTIVE_HARD_CAP,
  unique: UNIQUE_ACTIVE_HARD_CAP,
}

const PASSIVE_HARD_CAP_BY_SOURCE: Record<ShadowAbilitySource, number> = {
  generic: 0.045,
  template: 0.06,
  prototype: PASSIVE_HARD_CAP,
  unique: UNIQUE_PASSIVE_HARD_CAP,
}

const COMBAT_STAT_WEIGHT: Partial<Record<keyof ShadowCombatUnitProfile['stats'], number>> = {
  shadowExpedition: 0.25,
  shadowSynergy: 0.88,
  shadowSupport: 0.94,
  shadowSpeed: 0.96,
}

const getAbilitySource = (ability: { source?: ShadowAbilitySource }): ShadowAbilitySource =>
  ability.source ?? 'generic'

const isRuntimeInterpretable = (
  ability: ShadowSkillDefinition | ShadowPassiveDefinition,
): boolean => {
  const source = getAbilitySource(ability)
  if (source === 'unique' || source === 'prototype' || source === 'template') return true

  const scalingKeys = Object.keys(ability.statScaling)
  return scalingKeys.some(key => key !== 'shadowExpedition') || ability.effectKind !== 'stat_shift'
}

const isBossLikeRuntimeTarget = (monster: ShadowCombatRuntimeActor): boolean => {
  const id = monster.id.toLowerCase()
  return id.includes('boss') || id.startsWith('tower-') || id.includes('monarch') || id.includes('abyss')
}

const getLogCue = (profile: ShadowCombatUnitProfile, ability: { source?: ShadowAbilitySource }): ShadowActionEvent['logCue'] => {
  const source = getAbilitySource(ability)
  if (source === 'unique') return 'apex'
  if (source === 'prototype' || profile.rarity === 'legendary' || profile.innateGrade === 'S') return 'high'
  if (source === 'generic' && profile.rarity === 'common') return 'minor'
  return 'normal'
}

const getRuntimeCategory = (
  ability: ShadowSkillDefinition | ShadowPassiveDefinition,
  sourceKind: 'active' | 'passive',
): ShadowActionEvent['runtimeCategory'] => {
  const scaling = ability.statScaling
  if (ability.effectKind === 'guard' || ability.effectKind === 'survival') return 'guard'
  if (ability.effectKind === 'control' || ability.effectKind === 'bossing') return ability.effectKind === 'bossing' ? 'bossing' : 'control'
  if (ability.effectKind === 'support' || ability.effectKind === 'cooldown' || ability.effectKind === 'synergy') return 'support'
  if (sourceKind === 'active') {
    const skill = ability as ShadowSkillDefinition
    if (skill.timing === 'finisher_window' || skill.trigger?.timing === 'target_low_hp' || (scaling.shadowFinisher ?? 0) > 0.2) return 'finisher'
  }
  if ((scaling.shadowSpeed ?? 0) > 0.2) return 'tempo'
  return 'attack'
}

const triggerMatches = (
  trigger: ShadowTriggerCondition | undefined,
  params: ResolveShadowActionRuntimeParams,
): boolean => {
  if (!trigger) return true
  const monsterHpRatio = params.monster.hp / Math.max(1, params.monster.maxHp)
  const playerHpRatio = params.player.hp / Math.max(1, params.player.maxHp)
  if (trigger.requiresBoss && !isBossLikeRuntimeTarget(params.monster)) return false

  switch (trigger.timing) {
    case 'battle_start':
      return params.phase === 'wave_start' || params.turnNumber <= 1
    case 'wave_start':
      return params.phase === 'wave_start'
    case 'round_start':
      return params.phase === 'player_after_action'
    case 'after_hunter_action':
      return params.phase === 'player_after_action'
    case 'before_enemy_action':
      return params.phase === 'player_after_action' || params.phase === 'player_defend'
    case 'after_enemy_action':
      return false
    case 'finisher_window':
    case 'target_low_hp':
      return monsterHpRatio <= ((trigger.targetHpThreshold ?? 35) / 100)
    case 'hp_threshold':
      return playerHpRatio <= ((trigger.hpThreshold ?? 40) / 100)
    case 'boss_present':
      return isBossLikeRuntimeTarget(params.monster)
    case 'after_crit':
      return Boolean(params.playerUsedSkill)
    case 'after_kill':
      return params.monster.hp <= 0
    default:
      return false
  }
}

const timingMatches = (
  timing: ShadowSkillDefinition['timing'],
  params: ResolveShadowActionRuntimeParams,
): boolean => {
  if (timing === 'wave_start' || timing === 'battle_start') return params.phase === 'wave_start' || params.turnNumber <= 1
  if (timing === 'finisher_window') return params.monster.hp / Math.max(1, params.monster.maxHp) <= 0.4
  if (timing === 'before_enemy_action') return params.phase === 'player_after_action' || params.phase === 'player_defend'
  if (timing === 'after_enemy_action') return false
  return params.phase === 'player_after_action'
}

export const statScalingScore = (
  profile: ShadowCombatUnitProfile,
  ability: ShadowSkillDefinition | ShadowPassiveDefinition,
): number =>
  Object.entries(ability.statScaling).reduce((sum, [key, weight]) => {
    const statKey = key as keyof ShadowCombatUnitProfile['stats']
    const value = profile.stats[statKey]
    return sum + value * (weight ?? 0) * (COMBAT_STAT_WEIGHT[statKey] ?? 1)
  }, 0)

const getChance = (
  profile: ShadowCombatUnitProfile,
  ability: ShadowSkillDefinition | ShadowPassiveDefinition,
  sourceKind: 'active' | 'passive',
): number => {
  const baseChance = sourceKind === 'active'
    ? (ability as ShadowSkillDefinition).baseChance
    : 0.18
  const scaled = baseChance
    * (sourceKind === 'active' ? 0.36 : 0.28)
    * profile.gradeTuning.procStability
    * SOURCE_CHANCE_MULTIPLIER[getAbilitySource(ability)]
  const hardCap = sourceKind === 'active'
    ? ACTIVE_HARD_CAP_BY_SOURCE[getAbilitySource(ability)]
    : PASSIVE_HARD_CAP_BY_SOURCE[getAbilitySource(ability)]
  return Math.max(0, Math.min(hardCap, scaled))
}

export const getValuePreview = (
  profile: ShadowCombatUnitProfile,
  ability: ShadowSkillDefinition | ShadowPassiveDefinition,
  sourceKind: 'active' | 'passive',
): number => {
  const score = statScalingScore(profile, ability)
  const scaled = score / (score + 700)
  const sourceBoost = SOURCE_VALUE_MULTIPLIER[getAbilitySource(ability)]
  const gradeBoost = profile.gradeTuning.effectScaling

  if (sourceKind === 'active') {
    const skill = ability as ShadowSkillDefinition
    const finisherPressure = skill.timing === 'finisher_window' || skill.trigger?.timing === 'target_low_hp' || (skill.statScaling.shadowFinisher ?? 0) > 0.2
    if (skill.effectKind === 'damage' || skill.effectKind === 'hybrid') {
      const cap = finisherPressure ? 0.098 : 0.09
      return Math.min(cap, (0.03 + scaled * 0.055) * sourceBoost * gradeBoost)
    }
    if (skill.effectKind === 'guard') return Math.min(0.06, (0.022 + scaled * 0.032) * sourceBoost)
    if (skill.effectKind === 'control') return Math.min(0.048, (0.016 + scaled * 0.028) * sourceBoost)
    if (skill.effectKind === 'support') return Math.min(0.046, (0.016 + scaled * 0.026) * sourceBoost)
    if (skill.effectKind === 'bossing') return Math.min(0.052, (0.018 + scaled * 0.03) * sourceBoost)
  }

  const passive = ability as ShadowPassiveDefinition
  if (passive.effectKind === 'survival') return Math.min(0.05, (0.018 + scaled * 0.028) * sourceBoost)
  if (passive.effectKind === 'bossing') return Math.min(0.044, (0.016 + scaled * 0.026) * sourceBoost)
  if (passive.effectKind === 'trigger_boost') return Math.min(0.04, (0.014 + scaled * 0.024) * sourceBoost)
  if (passive.effectKind === 'cooldown' || passive.effectKind === 'synergy') return Math.min(0.038, (0.012 + scaled * 0.022) * sourceBoost)
  return Math.min(0.032, (0.01 + scaled * 0.018) * sourceBoost)
}

const createRuntimeEvent = (
  params: ResolveShadowActionRuntimeParams,
  shadow: OwnedShadow,
  profile: ShadowCombatUnitProfile,
  ability: ShadowSkillDefinition | ShadowPassiveDefinition,
  sourceKind: 'active' | 'passive',
): ShadowRuntimeEvent => {
  const valuePreview = getValuePreview(profile, ability, sourceKind)
  const effectKind = sourceKind === 'active'
    ? (ability as ShadowSkillDefinition).effectKind
    : (ability as ShadowPassiveDefinition).effectKind
  const runtimeCategory = getRuntimeCategory(ability, sourceKind)
  const targetType = runtimeCategory === 'guard' || runtimeCategory === 'support' || runtimeCategory === 'tempo' || effectKind === 'survival' || effectKind === 'cooldown' || effectKind === 'synergy' || effectKind === 'stat_shift'
    ? 'player'
    : 'monster'
  const sourceAbility = getAbilitySource(ability)

  return {
    sourceShadowId: shadow.instanceId,
    skillId: sourceKind === 'active' ? ability.id : undefined,
    passiveId: sourceKind === 'passive' ? ability.id : undefined,
    abilityName: ability.name,
    sourceAbility,
    timing: sourceKind === 'active' ? (ability as ShadowSkillDefinition).timing : (ability as ShadowPassiveDefinition).condition?.timing ?? 'round_start',
    effectKind,
    valuePreview,
    targetType,
    targetId: targetType === 'monster' ? params.monster.id : params.player.id,
    logCue: getLogCue(profile, ability),
    animationCue: sourceKind === 'active' ? (ability as ShadowSkillDefinition).animationCue : (ability as ShadowPassiveDefinition).triggerCue,
    actionCue: ability.actionCue,
    effectColor: sourceKind === 'active' ? (ability as ShadowSkillDefinition).effectColor : profile.actionProfile.effectColor,
    impactTiming: sourceKind === 'active' ? (ability as ShadowSkillDefinition).impactTiming : (ability.source === 'unique' ? 'apex' : 'normal'),
    boardLane: profile.actionProfile.boardLane,
    runtimeCategory,
    shadow,
    profile,
    sourceKind,
    sourceName: ability.name,
    triggerChance: getChance(profile, ability, sourceKind),
  }
}

const getActiveCandidates = (
  params: ResolveShadowActionRuntimeParams,
  shadow: OwnedShadow,
  profile: ShadowCombatUnitProfile,
): ShadowRuntimeEvent[] =>
  profile.activeSkills
    .filter(skill => isRuntimeInterpretable(skill))
    .filter(skill => skill.effectKind !== 'bossing' || isBossLikeRuntimeTarget(params.monster))
    .filter(skill => timingMatches(skill.timing, params))
    .filter(skill => triggerMatches(skill.trigger, params))
    .map(skill => createRuntimeEvent(params, shadow, profile, skill, 'active'))

const getPassiveCandidates = (
  params: ResolveShadowActionRuntimeParams,
  shadow: OwnedShadow,
  profile: ShadowCombatUnitProfile,
): ShadowRuntimeEvent[] =>
  profile.passives
    .filter(passive => isRuntimeInterpretable(passive))
    .filter(passive => passive.effectKind !== 'bossing' || isBossLikeRuntimeTarget(params.monster))
    .filter(passive => triggerMatches(passive.condition, params))
    .map(passive => createRuntimeEvent(params, shadow, profile, passive, 'passive'))

export const resolveShadowActionRuntime = (
  params: ResolveShadowActionRuntimeParams,
): ResolveShadowActionRuntimeResult => {
  const shadows = params.shadows ?? []
  const maxActionsPerRound = params.maxActionsPerRound ?? 1
  const state: ShadowCombatRuntimeState = {
    roundActionsUsed: 0,
    maxActionsPerRound,
    softCooldownKeys: [],
  }

  if (shadows.length === 0 || params.monster.hp <= 0) {
    return { events: [], state }
  }

  const candidates = shadows.flatMap(shadow => {
    const profile = getShadowCombatUnitProfile(shadow)
    return [
      ...getActiveCandidates(params, shadow, profile),
      ...getPassiveCandidates(params, shadow, profile),
    ]
  })

  const triggered = candidates
    .map(event => {
      const valueWeight = Math.min(0.04, event.valuePreview * 0.35)
      const cueWeight = event.logCue === 'apex' ? 0.014 : event.logCue === 'high' ? 0.009 : event.logCue === 'minor' ? -0.006 : 0
      const categoryWeight = event.runtimeCategory === 'tempo' ? 0.004 : event.runtimeCategory === 'bossing' ? 0.006 : 0
      const hardCap = event.sourceKind === 'active'
        ? ACTIVE_HARD_CAP_BY_SOURCE[event.sourceAbility ?? 'generic']
        : PASSIVE_HARD_CAP_BY_SOURCE[event.sourceAbility ?? 'generic']
      const chance = Math.min(hardCap, Math.max(0, event.triggerChance + valueWeight + cueWeight + categoryWeight))
      return { event, chance, roll: params.rng() }
    })
    .filter(item => item.roll <= item.chance)
    .sort((a, b) => {
      const cueScore = (cue: ShadowActionEvent['logCue']) => cue === 'apex' ? 3 : cue === 'high' ? 2 : cue === 'normal' ? 1 : 0
      return cueScore(b.event.logCue) - cueScore(a.event.logCue)
        || b.event.valuePreview - a.event.valuePreview
    })
    .slice(0, maxActionsPerRound)
    .map(item => item.event)

  state.roundActionsUsed = triggered.length
  state.softCooldownKeys = triggered.map(event => event.skillId ?? event.passiveId ?? event.sourceShadowId)
  return { events: triggered, state }
}

export const isShadowActionRuntimeLog = (log: BattleTurn): boolean => log.skillId === 'shadow-action-runtime'
