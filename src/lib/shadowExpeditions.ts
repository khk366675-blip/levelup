import type {
  AchievementStats,
  ExpeditionMidEvent,
  ExpeditionPhase,
  OwnedShadow,
  Quest,
  ShadowDefinition,
  ShadowExpedition,
  ShadowExpeditionCommand,
  ShadowExpeditionLog,
  ShadowExpeditionOutcome,
  ShadowExpeditionResult,
  ShadowExpeditionType,
  ShadowRole,
  ShadowStatKey,
} from './types'
import { getShadowDefinition } from './shadows'
import { rollValueReward } from './game'
import {
  getShadowCombatUnitProfile,
  type ShadowCombatUnitProfile,
  type ShadowPassiveDefinition,
} from './shadowSkills'
import {
  buildExpeditionReport,
  getCommandLog,
  getExpeditionPhase,
  getPhaseDisplayName,
  getPhaseEnterLog,
  getRoleLine,
  pickMidEvent,
} from './expeditionLore'

export const SHADOW_EXPEDITION_UNLOCK_DAILY_COUNT = 6
export const SHADOW_EXPEDITION_PARTY_MIN = 1
export const SHADOW_EXPEDITION_PARTY_MAX = 5

export const SHADOW_EXPEDITION_TYPE_LABEL: Record<ShadowExpeditionType, string> = {
  training: '수련 원정',
  essence: '그림자 정수 회수',
  hunt: '잔재 사냥',
  scout: '균열 정찰',
}

export const SHADOW_EXPEDITION_COMMAND_LABEL: Record<ShadowExpeditionCommand, string> = {
  attack: '공격',
  defend: '방어',
  scout: '정찰',
  analyze: '분석',
  search: '수색',
}

export const SHADOW_EXPEDITION_OUTCOME_LABEL: Record<ShadowExpeditionOutcome, string> = {
  great_success: '대성공',
  success: '성공',
  partial: '부분성공',
  failure: '실패',
}

type ExpeditionTemplate = {
  type: ShadowExpeditionType
  title: string
  description: string
  requiredPower: number
  recommendedRoles: ShadowRole[]
  maxTurns: number
  startRisk: number
}

export interface ShadowExpeditionUnitAggregate {
  expeditionPower: number
  scoutUtility: number
  commandTempo: number
  riskControl: number
  supportStability: number
  searchSense: number
  bossHuntPressure: number
  synergyCoordination: number
}

const EMPTY_SHADOW_EXPEDITION_AGGREGATE: ShadowExpeditionUnitAggregate = {
  expeditionPower: 0,
  scoutUtility: 0,
  commandTempo: 0,
  riskControl: 0,
  supportStability: 0,
  searchSense: 0,
  bossHuntPressure: 0,
  synergyCoordination: 0,
}

export const SHADOW_EXPEDITION_TEMPLATES: ExpeditionTemplate[] = [
  {
    type: 'training',
    title: '그림자 원정',
    description: '헌터는 전장에 나서지 않는다. 오늘은 군단이 스스로 움직일 차례다.',
    requiredPower: 82,
    recommendedRoles: ['assault', 'guard', 'support'],
    maxTurns: 7,
    startRisk: 18,
  },
  {
    type: 'essence',
    title: '흩어진 그림자 정수',
    description: '균열 가장자리에서 흩어진 정수의 흔적이 감지된다. 욕심을 내면 위험도 함께 깨어난다.',
    requiredPower: 96,
    recommendedRoles: ['hunter', 'scout', 'analyst'],
    maxTurns: 7,
    startRisk: 22,
  },
  {
    type: 'hunt',
    title: '균열 잔재 소탕',
    description: '작은 잔재들이 모여 그림자의 행군을 막는다. 전열을 무너뜨리고 정수를 회수해야 한다.',
    requiredPower: 112,
    recommendedRoles: ['assault', 'scout', 'hunter'],
    maxTurns: 7,
    startRisk: 24,
  },
  {
    type: 'scout',
    title: '불안정한 균열 정찰',
    description: '불안정한 통로를 확인하는 안정형 원정. 전리품보다 생환과 정보가 우선이다.',
    requiredPower: 74,
    recommendedRoles: ['scout', 'analyst', 'support'],
    maxTurns: 6,
    startRisk: 16,
  },
]

const REWARDS: Record<ShadowExpeditionType, Record<ShadowExpeditionOutcome, { xp: number; essence: number }>> = {
  training: {
    great_success: { xp: 36, essence: 4 },
    success: { xp: 22, essence: 2 },
    partial: { xp: 10, essence: 1 },
    failure: { xp: 4, essence: 0 },
  },
  essence: {
    great_success: { xp: 18, essence: 14 },
    success: { xp: 10, essence: 8 },
    partial: { xp: 5, essence: 3 },
    failure: { xp: 2, essence: 1 },
  },
  hunt: {
    great_success: { xp: 28, essence: 10 },
    success: { xp: 16, essence: 6 },
    partial: { xp: 8, essence: 2 },
    failure: { xp: 2, essence: 1 },
  },
  scout: {
    great_success: { xp: 24, essence: 8 },
    success: { xp: 14, essence: 5 },
    partial: { xp: 6, essence: 1 },
    failure: { xp: 2, essence: 1 },
  },
}

const RARITY_MULTIPLIER: Record<OwnedShadow['rarity'], number> = {
  common: 1,
  uncommon: 1.1,
  rare: 1.25,
  epic: 1.45,
  legendary: 1.75,
}

const COMMAND_ROLE_MATCH: Record<ShadowExpeditionCommand, ShadowRole[]> = {
  attack: ['assault'],
  defend: ['guard', 'support'],
  scout: ['scout'],
  analyze: ['analyst', 'support'],
  search: ['hunter', 'scout'],
}

const COMMAND_STAT_WEIGHTS: Record<ShadowExpeditionCommand, Array<[ShadowStatKey, number]>> = {
  attack: [
    ['shadowAttack', 0.44],
    ['shadowFinisher', 0.34],
    ['shadowBossing', 0.22],
  ],
  defend: [
    ['shadowDefense', 0.42],
    ['shadowDurability', 0.3],
    ['shadowSurvival', 0.28],
  ],
  scout: [
    ['shadowSpeed', 0.36],
    ['shadowControl', 0.3],
    ['shadowExpedition', 0.34],
  ],
  analyze: [
    ['shadowControl', 0.42],
    ['shadowSuppression', 0.3],
    ['shadowSupport', 0.28],
  ],
  search: [
    ['shadowExpedition', 0.42],
    ['shadowSynergy', 0.3],
    ['shadowSupport', 0.28],
  ],
}

const COMMAND_PASSIVE_STAT_KEYS: Record<ShadowExpeditionCommand, ShadowStatKey[]> = {
  attack: ['shadowAttack', 'shadowFinisher', 'shadowBossing'],
  defend: ['shadowDefense', 'shadowDurability', 'shadowSurvival'],
  scout: ['shadowSpeed', 'shadowControl', 'shadowExpedition'],
  analyze: ['shadowControl', 'shadowSuppression', 'shadowSupport'],
  search: ['shadowExpedition', 'shadowSynergy', 'shadowSupport'],
}

const PASSIVE_QUALITY_WEIGHT: Record<ShadowPassiveDefinition['qualityTier'], number> = {
  basic: 0.35,
  refined: 0.55,
  elite: 0.75,
  legendary: 0.9,
  unique: 1,
}

const COMMAND_BASE: Record<ShadowExpeditionCommand, { progress: [number, number]; risk: [number, number] }> = {
  attack: { progress: [16, 24], risk: [12, 18] },
  defend: { progress: [6, 12], risk: [-18, -12] },
  scout: { progress: [8, 14], risk: [-12, -6] },
  analyze: { progress: [10, 18], risk: [2, 8] },
  search: { progress: [8, 14], risk: [14, 22] },
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))

const boundedBonus = (value: number, scale: number, cap: number): number => {
  const safeValue = Math.max(0, value)
  return cap * (safeValue / (safeValue + scale))
}

const weighted = (...entries: Array<[number, number]>): number =>
  Math.round(entries.reduce((sum, [value, weight]) => sum + value * weight, 0))

const range = (rng: () => number, min: number, max: number): number =>
  Math.round(min + rng() * (max - min))

const hashDate = (date: string): number =>
  [...date].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 11), 0)

const expiresAtFor = (date: string): string => {
  const expiresAt = new Date(`${date}T23:59:59.999`)
  if (Number.isNaN(expiresAt.getTime())) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
  return expiresAt.toISOString()
}

export const getTodayDailyCompletedCount = (stats: AchievementStats | undefined, dateKey: string): number =>
  stats?.dailyHistory?.[dateKey]?.completedDailyCount ?? 0

/**
 * 현재 활성 AI 플랜의 날짜 키를 반환합니다.
 * 퀘스트 목록에서 coachPlanDate가 있는 AI 일일 퀘스트 중 가장 최근 날짜를 기준으로 합니다.
 * AI 플랜이 없으면 오늘 날짜를 반환합니다.
 */
export const getActivePlanDateKey = (quests: Quest[]): string => {
  const aiDailies = quests.filter(
    (q) =>
      q.type === 'daily' &&
      !q.recurring &&
      (q.coachGenerated === true || q.coachPlanId !== undefined || q.coachReason !== undefined) &&
      Boolean(q.coachPlanDate),
  )
  if (!aiDailies.length) return new Date().toISOString().slice(0, 10)
  const planDates = aiDailies.map((q) => q.coachPlanDate!).sort()
  return planDates[planDates.length - 1]
}

/**
 * AI 플랜 기반으로 완료된 일일 퀘스트 수를 계산합니다.
 * 현재 AI 플랜의 퀘스트 IDs를 추출하고, 모든 dailyHistory 기록에서 해당 IDs의 완료를 카운트합니다.
 * 이를 통해 AI 플랜 날짜와 실제 완료 날짜(캘린더 날짜)가 달라도 정확히 집계됩니다.
 */
export const getPlanBasedCompletedCount = (
  quests: Quest[],
  stats: AchievementStats | undefined,
): number => {
  const aiDailies = quests.filter(
    (q) =>
      q.type === 'daily' &&
      !q.recurring &&
      (q.coachGenerated === true || q.coachPlanId !== undefined || q.coachReason !== undefined),
  )
  if (!aiDailies.length) {
    // AI 플랜 없음: 오늘 날짜 기준 completedDailyCount 반환
    const todayStr = new Date().toISOString().slice(0, 10)
    return stats?.dailyHistory?.[todayStr]?.completedDailyCount ?? 0
  }

  // 가장 최근 플랜 날짜 찾기
  const planDates = aiDailies.map((q) => q.coachPlanDate).filter((d): d is string => Boolean(d)).sort()
  const activePlanDate = planDates[planDates.length - 1]

  if (!activePlanDate) {
    const todayStr = new Date().toISOString().slice(0, 10)
    return stats?.dailyHistory?.[todayStr]?.completedDailyCount ?? 0
  }

  // 현재 활성 플랜의 퀘스트 ID 목록 구성
  const planQuestIds = new Set(
    aiDailies
      .filter((q) => q.coachPlanDate === activePlanDate)
      .map((q) => q.id),
  )
  if (!planQuestIds.size) return 0

  // 모든 dailyHistory 기록에서 플랜 퀘스트 ID 완료 수 집계
  let count = 0
  for (const dayRecord of Object.values(stats?.dailyHistory ?? {})) {
    for (const questId of dayRecord.completedDailyQuestIds ?? []) {
      if (planQuestIds.has(questId)) count++
    }
  }
  return count
}

export const createShadowExpeditionForDate = (date: string): ShadowExpedition => {
  const template = SHADOW_EXPEDITION_TEMPLATES[hashDate(date) % SHADOW_EXPEDITION_TEMPLATES.length]
  return {
    id: `shadow-expedition-${date}`,
    date,
    type: template.type,
    title: template.title,
    description: template.description,
    requiredPower: template.requiredPower,
    recommendedRoles: template.recommendedRoles,
    selectedShadowIds: [],
    status: 'locked',
    progress: 0,
    risk: template.startRisk,
    turn: 0,
    maxTurns: template.maxTurns,
    expiresAt: expiresAtFor(date),
    logs: [{
      id: `shadow-expedition-${date}-created`,
      turn: 0,
      type: 'system',
      message: '오늘의 그림자 원정이 감지되었다. Daily 6개를 완료하면 지휘 권한이 열린다.',
    }],
    searchStacks: 0,
    analyzeStacks: 0,
    scoutStacks: 0,
  }
}

export const refreshShadowExpeditionLock = (
  expedition: ShadowExpedition,
  dailyCompletedCount: number,
  now = new Date()
): ShadowExpedition => {
  if (expedition.status === 'completed') return expedition
  if (new Date(expedition.expiresAt).getTime() < now.getTime()) {
    return { ...expedition, status: 'expired' }
  }
  if (expedition.status === 'in_progress') return expedition
  return {
    ...expedition,
    status: dailyCompletedCount >= SHADOW_EXPEDITION_UNLOCK_DAILY_COUNT ? 'available' : 'locked',
  }
}

export const getShadowExpeditionPower = (
  shadow: OwnedShadow,
  definition: ShadowDefinition | undefined = getShadowDefinition(shadow.definitionId),
  expedition?: Pick<ShadowExpedition, 'recommendedRoles'>
): number => {
  const basePower = definition?.basePower ?? 10
  const rarityMultiplier = RARITY_MULTIPLIER[shadow.rarity] ?? 1
  const enhancementMultiplier = 1 + (shadow.enhancementLevel ?? 0) * 0.08
  const levelMultiplier = 1 + ((shadow.level ?? 1) - 1) * 0.015
  const roleMatchMultiplier = expedition?.recommendedRoles.includes(shadow.role) ? 1.15 : 1
  const namedMultiplier = shadow.isNamed || shadow.isGateNamed || shadow.isAchievementNamed ? 1.08 : 1
  const profileAggregate = getShadowExpeditionUnitAggregateFromProfile(getShadowCombatUnitProfile(shadow, definition))
  const expeditionProfileMultiplier = 1 + boundedBonus(
    profileAggregate.expeditionPower + profileAggregate.searchSense * 0.25 + profileAggregate.synergyCoordination * 0.15,
    520,
    0.03,
  )
  return Math.round(basePower * rarityMultiplier * enhancementMultiplier * levelMultiplier * roleMatchMultiplier * namedMultiplier * expeditionProfileMultiplier)
}

export const getShadowExpeditionPartyPower = (
  shadows: OwnedShadow[],
  expedition?: Pick<ShadowExpedition, 'recommendedRoles'>
): number => {
  const base = shadows.reduce((sum, shadow) => sum + getShadowExpeditionPower(shadow, undefined, expedition), 0)
  if (!expedition || shadows.length === 0) return base
  const matchedRoles = new Set(shadows.filter(shadow => expedition.recommendedRoles.includes(shadow.role)).map(shadow => shadow.role))
  const diversityBonus = matchedRoles.size >= 3 ? 0.1 : matchedRoles.size >= 2 ? 0.05 : 0
  return Math.round(base * (1 + diversityBonus))
}

const getShadowExpeditionUnitAggregateFromProfile = (profile: ShadowCombatUnitProfile): ShadowExpeditionUnitAggregate => {
  const stats = profile.stats
  return {
    expeditionPower: weighted(
      [stats.shadowExpedition, 0.42],
      [stats.shadowSpeed, 0.14],
      [stats.shadowSupport, 0.18],
      [stats.shadowSynergy, 0.26],
    ),
    scoutUtility: weighted(
      [stats.shadowSpeed, 0.36],
      [stats.shadowControl, 0.32],
      [stats.shadowExpedition, 0.24],
      [stats.shadowSynergy, 0.08],
    ),
    commandTempo: weighted(
      [stats.shadowSpeed, 0.5],
      [stats.shadowControl, 0.18],
      [stats.shadowExpedition, 0.18],
      [stats.shadowSynergy, 0.14],
    ),
    riskControl: weighted(
      [stats.shadowControl, 0.28],
      [stats.shadowDefense, 0.22],
      [stats.shadowDurability, 0.18],
      [stats.shadowSurvival, 0.22],
      [stats.shadowExpedition, 0.1],
    ),
    supportStability: weighted(
      [stats.shadowSupport, 0.38],
      [stats.shadowSurvival, 0.24],
      [stats.shadowDurability, 0.16],
      [stats.shadowSynergy, 0.22],
    ),
    searchSense: weighted(
      [stats.shadowExpedition, 0.44],
      [stats.shadowSynergy, 0.24],
      [stats.shadowSpeed, 0.18],
      [stats.shadowSupport, 0.14],
    ),
    bossHuntPressure: weighted(
      [stats.shadowBossing, 0.38],
      [stats.shadowFinisher, 0.24],
      [stats.shadowAttack, 0.2],
      [stats.shadowSuppression, 0.18],
    ),
    synergyCoordination: weighted(
      [stats.shadowSynergy, 0.44],
      [stats.shadowSupport, 0.22],
      [stats.shadowControl, 0.18],
      [stats.shadowExpedition, 0.16],
    ),
  }
}

const getShadowExpeditionProfiles = (shadows: OwnedShadow[]): ShadowCombatUnitProfile[] =>
  shadows.map(shadow => getShadowCombatUnitProfile(shadow))

export const getShadowExpeditionUnitAggregate = (shadow: OwnedShadow): ShadowExpeditionUnitAggregate =>
  getShadowExpeditionUnitAggregateFromProfile(getShadowCombatUnitProfile(shadow))

const getShadowExpeditionPartyAggregateFromProfiles = (profiles: ShadowCombatUnitProfile[]): ShadowExpeditionUnitAggregate =>
  profiles.reduce((total, profile) => {
    const aggregate = getShadowExpeditionUnitAggregateFromProfile(profile)
    return {
      expeditionPower: total.expeditionPower + aggregate.expeditionPower,
      scoutUtility: total.scoutUtility + aggregate.scoutUtility,
      commandTempo: total.commandTempo + aggregate.commandTempo,
      riskControl: total.riskControl + aggregate.riskControl,
      supportStability: total.supportStability + aggregate.supportStability,
      searchSense: total.searchSense + aggregate.searchSense,
      bossHuntPressure: total.bossHuntPressure + aggregate.bossHuntPressure,
      synergyCoordination: total.synergyCoordination + aggregate.synergyCoordination,
    }
  }, { ...EMPTY_SHADOW_EXPEDITION_AGGREGATE })

export const getShadowExpeditionPartyAggregate = (shadows: OwnedShadow[]): ShadowExpeditionUnitAggregate =>
  getShadowExpeditionPartyAggregateFromProfiles(getShadowExpeditionProfiles(shadows))

const getCommandStatScore = (profile: ShadowCombatUnitProfile, command: ShadowExpeditionCommand): number =>
  weighted(...COMMAND_STAT_WEIGHTS[command].map(([key, weight]) => [profile.stats[key], weight] as [number, number]))

const getPartyCommandStatScore = (profiles: ShadowCombatUnitProfile[], command: ShadowExpeditionCommand): number =>
  profiles.reduce((sum, profile) => sum + getCommandStatScore(profile, command), 0)

const getRiskControlScoreForCommand = (
  aggregate: ShadowExpeditionUnitAggregate,
  command: ShadowExpeditionCommand,
): number => {
  if (command === 'attack') return aggregate.riskControl * 0.32 + aggregate.supportStability * 0.26 + aggregate.bossHuntPressure * 0.18
  if (command === 'defend') return aggregate.riskControl * 0.42 + aggregate.supportStability * 0.34 + aggregate.synergyCoordination * 0.16
  if (command === 'scout') return aggregate.scoutUtility * 0.38 + aggregate.riskControl * 0.32 + aggregate.commandTempo * 0.18
  if (command === 'analyze') return aggregate.riskControl * 0.3 + aggregate.supportStability * 0.24 + aggregate.synergyCoordination * 0.22
  return aggregate.searchSense * 0.28 + aggregate.riskControl * 0.26 + aggregate.supportStability * 0.24
}

const getPassiveCommandAffinity = (passive: ShadowPassiveDefinition, command: ShadowExpeditionCommand): number => {
  const relevantKeys = COMMAND_PASSIVE_STAT_KEYS[command]
  const statAffinity = relevantKeys.reduce((sum, key) => sum + (passive.statScaling[key] ?? 0), 0)
  const roleAffinity = passive.roleTags.some(role => COMMAND_ROLE_MATCH[command].includes(role)) ? 0.28 : 0
  const effectAffinity =
    passive.effectKind === 'survival' && (command === 'defend' || command === 'scout') ? 0.32
      : passive.effectKind === 'cooldown' && (command === 'analyze' || command === 'search') ? 0.22
        : passive.effectKind === 'synergy' && (command === 'search' || command === 'analyze') ? 0.32
          : passive.effectKind === 'bossing' && (command === 'attack' || command === 'search') ? 0.24
            : passive.effectKind === 'trigger_boost' ? 0.14
              : 0
  const sourceAffinity = passive.source === 'unique' ? 0.18 : passive.source === 'prototype' ? 0.12 : 0
  return (statAffinity + roleAffinity + effectAffinity + sourceAffinity) * PASSIVE_QUALITY_WEIGHT[passive.qualityTier]
}

const getExpeditionPassiveInfluence = (
  profiles: ShadowCombatUnitProfile[],
  command: ShadowExpeditionCommand,
): number =>
  profiles.reduce((sum, profile) => (
    sum + profile.passives.reduce((passiveSum, passive) => passiveSum + getPassiveCommandAffinity(passive, command), 0)
  ), 0)

const getCommandProfileModifiers = (
  profiles: ShadowCombatUnitProfile[],
  aggregate: ShadowExpeditionUnitAggregate,
  command: ShadowExpeditionCommand,
  roleMatches: number,
): { progressMultiplier: number; riskMitigation: number; roleMatchProgress: number; passiveInfluence: number } => {
  const partySize = Math.max(1, profiles.length)
  const commandScore = getPartyCommandStatScore(profiles, command)
  const passiveInfluence = getExpeditionPassiveInfluence(profiles, command)
  const tempoSupport = aggregate.commandTempo * 0.18 + aggregate.synergyCoordination * 0.14
  const progressMultiplier = Math.min(0.04, boundedBonus(commandScore + tempoSupport, partySize * 520, 0.032) + boundedBonus(passiveInfluence, partySize * 2.2, 0.008))
  const riskCap = command === 'defend' || command === 'scout' ? 3 : 4
  const riskMitigation = Math.round(Math.min(riskCap, boundedBonus(getRiskControlScoreForCommand(aggregate, command), partySize * 420, riskCap) + boundedBonus(passiveInfluence, partySize * 1.6, 1.5)))
  const roleMatchProgress = roleMatches > 0
    ? Math.round(Math.min(1, boundedBonus(aggregate.synergyCoordination + passiveInfluence * 40, partySize * 640, 1)))
    : 0
  return { progressMultiplier, riskMitigation, roleMatchProgress, passiveInfluence }
}

const getOutcomeProfileAdjustment = (
  profiles: ShadowCombatUnitProfile[],
  aggregate: ShadowExpeditionUnitAggregate,
): { progress: number; risk: number } => {
  const partySize = Math.max(1, profiles.length)
  return {
    progress: Math.round(boundedBonus(aggregate.expeditionPower + aggregate.synergyCoordination * 0.35, partySize * 640, 1)),
    risk: Math.round(boundedBonus(aggregate.riskControl + aggregate.supportStability * 0.3, partySize * 680, 1)),
  }
}

export const getShadowExpeditionRecommendedRoleMatches = (
  shadows: OwnedShadow[],
  expedition: Pick<ShadowExpedition, 'recommendedRoles'>
): ShadowRole[] =>
  expedition.recommendedRoles.filter(role => shadows.some(shadow => shadow.role === role))

export const estimateShadowExpeditionSuccess = (partyPower: number, requiredPower: number): string => {
  const ratio = partyPower / Math.max(1, requiredPower)
  if (ratio >= 1.45) return '압도'
  if (ratio >= 1.15) return '유리'
  if (ratio >= 0.9) return '적정'
  if (ratio >= 0.65) return '위험'
  return '무모'
}

const pickActor = (
  party: OwnedShadow[],
  expedition: ShadowExpedition,
  command: ShadowExpeditionCommand,
  rng: () => number
): OwnedShadow | undefined => {
  const commandRoles = COMMAND_ROLE_MATCH[command]
  const commandMatches = party.filter(shadow => commandRoles.includes(shadow.role))
  const recommendedMatches = party.filter(shadow => expedition.recommendedRoles.includes(shadow.role))
  const pool = commandMatches.length > 0 ? commandMatches : recommendedMatches.length > 0 ? recommendedMatches : party
  return pool[Math.floor(rng() * pool.length)]
}

export { getExpeditionPhase, getPhaseDisplayName }

const actorLine = (command: ShadowExpeditionCommand, phase: ExpeditionPhase, actor?: OwnedShadow): string => {
  const name = actor?.name ?? '그림자 병사'
  const contextLog = getCommandLog(command, phase)
  const roleLine = actor ? getRoleLine(actor.role, 'command') : ''
  return `${name} — ${contextLog}${roleLine ? ` "${roleLine}"` : ''}`
}

export const getShadowExpeditionOutcome = (progress: number, risk: number): ShadowExpeditionOutcome => {
  if (risk >= 100) return 'failure'
  if (progress >= 125 && risk < 35) return 'great_success'
  if (progress >= 100 && risk < 75) return 'success'
  if (progress >= 70) return 'partial'
  return 'failure'
}

export const getShadowExpeditionReward = (
  type: ShadowExpeditionType,
  outcome: ShadowExpeditionOutcome,
  searchStacks = 0,
  rng = Math.random
): ShadowExpeditionResult => {
  const base = REWARDS[type][outcome]
  const searchBonus = outcome === 'failure' ? 0 : Math.min(3, Math.max(0, searchStacks))
  
  // 골드나 플레이어 XP는 없으므로 그림자 XP 및 에센스만 운 변동
  const rolledXP = rollValueReward(base.xp, rng)
  const rolledEssence = rollValueReward(base.essence, rng)

  const isJackpot = rolledXP.isJackpot || rolledEssence.isJackpot
  const bonusRewards: string[] = []

  if (searchBonus > 0) {
    bonusRewards.push(`수색 보너스 그림자 정수 +${searchBonus}`)
  }
  if (isJackpot) {
    bonusRewards.push(`★원정 대박 잭팟 보너스 발동! (1.5 ~ 2.0배 폭증)★`)
  }

  return {
    outcome,
    progress: 0,
    risk: 0,
    shadowXpGained: rolledXP.amount,
    essenceGained: rolledEssence.amount + searchBonus,
    bonusRewards: bonusRewards.length > 0 ? bonusRewards : undefined,
  }
}

export const resolveShadowExpeditionCommand = (
  expedition: ShadowExpedition,
  party: OwnedShadow[],
  command: ShadowExpeditionCommand,
  rng: () => number = Math.random,
  idFactory: () => string = () => `exp-log-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
): ShadowExpedition => {
  if (expedition.status !== 'in_progress') return expedition
  if (party.length === 0) return expedition
  if (expedition.result) return expedition
  if (expedition.eventTriggered && !expedition.eventResolved) return expedition

  const profiles = getShadowExpeditionProfiles(party)
  const expeditionAggregate = getShadowExpeditionPartyAggregateFromProfiles(profiles)
  const actor = pickActor(party, expedition, command, rng)
  const base = COMMAND_BASE[command]
  const partyPower = getShadowExpeditionPartyPower(party, expedition)
  const powerRatio = partyPower / Math.max(1, expedition.requiredPower)
  const commandRoles = COMMAND_ROLE_MATCH[command]
  const roleMatches = party.filter(shadow => commandRoles.includes(shadow.role)).length
  const recommendedMatches = party.filter(shadow => expedition.recommendedRoles.includes(shadow.role)).length
  const namedActorBonus = actor?.isNamed || actor?.isGateNamed || actor?.isAchievementNamed ? 3 : 0
  const levelBonus = actor ? Math.floor(((actor.level ?? 1) - 1) / 4) : 0
  const enhancementBonus = actor?.enhancementLevel ?? 0
  const analyzeStacks = expedition.analyzeStacks ?? 0
  const scoutStacks = expedition.scoutStacks ?? 0
  const profileModifiers = getCommandProfileModifiers(profiles, expeditionAggregate, command, roleMatches)

  let progressDelta = range(rng, base.progress[0], base.progress[1])
  let riskDelta = range(rng, base.risk[0], base.risk[1])

  if (powerRatio < 1.0) {
    const powerDeficit = 1.0 - powerRatio
    riskDelta += Math.round(powerDeficit * 25)
    progressDelta -= Math.round(powerDeficit * 8)
  } else {
    riskDelta -= Math.round(Math.min(6, (powerRatio - 1) * 4))
    progressDelta += clamp(Math.round((powerRatio - 1) * 12), -15, 12)
  }
  progressDelta += roleMatches * 4 + Math.min(4, recommendedMatches * 2) + namedActorBonus + levelBonus + enhancementBonus

  if (command === 'defend') {
    riskDelta -= roleMatches * 5 + enhancementBonus
  } else if (command === 'scout') {
    riskDelta -= roleMatches * 4 + Math.min(4, recommendedMatches)
  } else if (command === 'analyze') {
    progressDelta += roleMatches * 3
  } else if (command === 'search') {
    riskDelta += roleMatches === 0 ? 4 : 0
  } else if (command === 'attack' && !party.some(s => s.role === 'guard' || s.role === 'support')) {
    riskDelta += 5
  }

  if ((command === 'attack' || command === 'search') && analyzeStacks > 0) {
    progressDelta = Math.round(progressDelta * (1 + Math.min(2, analyzeStacks) * 0.1))
  }
  if (scoutStacks > 0) riskDelta -= 6
  progressDelta = Math.round(progressDelta * (1 + profileModifiers.progressMultiplier)) + profileModifiers.roleMatchProgress
  riskDelta -= profileModifiers.riskMitigation

  progressDelta = Math.max(1, progressDelta)
  riskDelta = Math.round(riskDelta)

  const prevProgress = expedition.progress
  const nextProgress = Math.max(0, prevProgress + progressDelta)
  const nextRisk = clamp(expedition.risk + riskDelta, 0, 140)
  const nextTurn = expedition.turn + 1
  const nextAnalyzeStacks = command === 'analyze' ? Math.min(2, analyzeStacks + 1) : (command === 'attack' || command === 'search' ? 0 : analyzeStacks)
  const nextScoutStacks = command === 'scout' ? 1 : 0
  const nextSearchStacks = command === 'search' ? Math.min(3, (expedition.searchStacks ?? 0) + 1) : (expedition.searchStacks ?? 0)

  const prevPhase = expedition.currentPhase ?? getExpeditionPhase(prevProgress)
  const nextPhase = getExpeditionPhase(nextProgress)

  const logs: ShadowExpeditionLog[] = [...expedition.logs]

  // Phase transition log (only once per phase, not on every command)
  if (nextPhase !== prevPhase && nextPhase !== 'muster') {
    const phaseMsg = getPhaseEnterLog(expedition.type, nextPhase)
    const displayName = getPhaseDisplayName(nextPhase, expedition.type)
    logs.push({
      id: idFactory(),
      turn: nextTurn,
      type: 'phase',
      phase: nextPhase,
      message: `[${displayName}] ${phaseMsg}`,
    })
  }

  // Main command log
  logs.push({
    id: idFactory(),
    turn: nextTurn,
    type: 'command',
    command,
    phase: nextPhase,
    actorShadowId: actor?.instanceId,
    message: `${SHADOW_EXPEDITION_COMMAND_LABEL[command]} 명령. ${actorLine(command, nextPhase, actor)} 진행도 +${progressDelta}, 위험도 ${riskDelta >= 0 ? '+' : ''}${riskDelta}.`,
  })

  if (profileModifiers.progressMultiplier >= 0.04 || profileModifiers.riskMitigation >= 3 || profileModifiers.roleMatchProgress >= 3) {
    logs.push({
      id: idFactory(),
      turn: nextTurn,
      type: 'shadow',
      command,
      phase: nextPhase,
      actorShadowId: actor?.instanceId,
      message: '군단 조율이 안정적이었다. 역할과 그림자 특성이 명령 처리를 소폭 보정했다.',
    })
  }

  if (command === 'analyze') {
    logs.push({
      id: idFactory(),
      turn: nextTurn,
      type: 'shadow',
      command,
      actorShadowId: actor?.instanceId,
      message: '분석 기록이 축적되었다. 다음 공격 또는 수색의 진행 효율이 상승한다.',
    })
  }
  if (command === 'search') {
    logs.push({
      id: idFactory(),
      turn: nextTurn,
      type: 'reward',
      command,
      actorShadowId: actor?.instanceId,
      message: `정수 흔적을 확보했다. 수색 보너스 ${nextSearchStacks}/3.`,
    })
  }

  // Mid-event trigger: threshold phase, max 1 per expedition, 95% chance
  let midEvent: ExpeditionMidEvent | undefined = expedition.midEvent
  let eventTriggered = expedition.eventTriggered ?? false
  if (
    (nextProgress >= 55 || nextPhase === 'threshold') &&
    nextProgress < 100 &&
    !eventTriggered &&
    rng() < 0.95
  ) {
    const recentIds = (expedition.phaseHistory ?? [])
      .filter(e => e.message?.startsWith('[EVENT]'))
      .map(e => e.message?.replace('[EVENT]', '').trim() ?? '')
    const candidate = pickMidEvent(expedition.type, recentIds)
    if (candidate) {
      midEvent = candidate
      eventTriggered = true
      logs.push({
        id: idFactory(),
        turn: nextTurn,
        type: 'event',
        phase: 'threshold',
        message: `[상황 발생] ${candidate.title} — ${candidate.description}`,
      })
    }
  }

  const shouldFinish = nextRisk >= 100 || nextProgress >= 100 || nextTurn >= expedition.maxTurns

  const phaseHistory = [
    ...(expedition.phaseHistory ?? []),
    ...(nextPhase !== prevPhase ? [{ phase: nextPhase, enteredAt: nextTurn }] : []),
    ...(midEvent && eventTriggered && !expedition.eventTriggered ? [{ phase: 'threshold' as ExpeditionPhase, enteredAt: nextTurn, message: `[EVENT]${midEvent.id}` }] : []),
  ]

  if (!shouldFinish) {
    return {
      ...expedition,
      progress: nextProgress,
      risk: nextRisk,
      turn: nextTurn,
      currentPhase: nextPhase,
      phaseHistory,
      logs,
      searchStacks: nextSearchStacks,
      analyzeStacks: nextAnalyzeStacks,
      scoutStacks: nextScoutStacks,
      midEvent: midEvent ?? expedition.midEvent,
      eventTriggered,
      eventResolved: expedition.eventResolved,
    }
  }

  const outcomeAdjustment = getOutcomeProfileAdjustment(profiles, expeditionAggregate)
  const outcome = getShadowExpeditionOutcome(nextProgress + outcomeAdjustment.progress, nextRisk - outcomeAdjustment.risk)
  const reward = getShadowExpeditionReward(expedition.type, outcome, nextSearchStacks, rng)

  // Featured shadow for report
  const featured = actor ?? party[0]
  const report = buildExpeditionReport(outcome, featured?.name ?? '군단')

  // World Signal Integration for Shadow Expedition reports
  const scoutCount = party.filter(s => s.role === 'scout').length
  const analystCount = party.filter(s => s.role === 'analyst').length
  const hasNamed = party.some(s => s.isNamed || s.isGateNamed || s.isAchievementNamed)
  const hasHighLevel = party.some(s => (s.level ?? 1) >= 10)

  let signalChance = 0.10
  if (scoutCount > 0) signalChance += 0.15
  if (analystCount > 0) signalChance += 0.15
  if (hasNamed) signalChance += 0.15
  if (hasHighLevel) signalChance += 0.10
  signalChance = Math.min(0.60, signalChance)

  if (rng() < signalChance) {
    let templateId = 'expedition_shadow_gaze'
    const roll = rng()
    if (scoutCount > 0 && roll < 0.5) {
      templateId = 'expedition_scout_find'
    } else if (hasNamed && roll < 0.4) {
      templateId = 'expedition_censor'
    } else if (roll < 0.5) {
      templateId = 'expedition_coordinate_mismatch'
    }

    const signalBodies: Record<string, string> = {
      expedition_scout_find: '원정 정찰 헌터로부터 보고서 여백에 기록되지 않은 미확인 인장의 잔재가 전달되었습니다.',
      expedition_censor: '원정 보고서의 마지막 문단이 협회 특수 보안 규정에 의해 자동으로 검열되었습니다.',
      expedition_coordinate_mismatch: '정찰조가 지도에 존재하지 않는 동일한 위상 기하 좌표를 반복해서 보고했습니다.',
      expedition_shadow_gaze: '그림자 개체 중 하나가 명령 없이 특정 심도 너머를 오랫동안 바라보는 이상 행동을 보였습니다.',
    }

    report.observation = signalBodies[templateId] || signalBodies.expedition_shadow_gaze
    report.observationSignalId = templateId
  }

  // Role line for finish
  if (featured) {
    const ctx = outcome === 'great_success' ? 'great_success' : outcome === 'failure' ? 'failure' : 'success'
    const roleLine = getRoleLine(featured.role, ctx)
    logs.push({
      id: idFactory(),
      turn: nextTurn,
      type: 'shadow',
      actorShadowId: featured.instanceId,
      message: `${featured.name} — "${roleLine}"`,
    })
  }

  const result: ShadowExpeditionResult = {
    ...reward,
    progress: nextProgress,
    risk: nextRisk,
    report,
    featuredShadowIds: featured ? [featured.instanceId] : [],
  }

  const hasJackpot = result.bonusRewards?.some(line => line.includes('★원정 대박 잭팟'))
  const jackpotLogMsg = hasJackpot ? ' [★대박 잭팟!★]' : ''

  logs.push({
    id: idFactory(),
    turn: nextTurn,
    type: 'system',
    message: `원정 ${SHADOW_EXPEDITION_OUTCOME_LABEL[outcome]}${jackpotLogMsg}. 그림자들이 경험치 ${result.shadowXpGained}와 그림자 정수 ${result.essenceGained}을 회수했다.`,
  })

  return {
    ...expedition,
    progress: nextProgress,
    risk: nextRisk,
    turn: nextTurn,
    currentPhase: 'return',
    phaseHistory,
    logs,
    result,
    status: 'completed',
    searchStacks: nextSearchStacks,
    analyzeStacks: nextAnalyzeStacks,
    scoutStacks: nextScoutStacks,
    midEvent: midEvent ?? expedition.midEvent,
    eventTriggered,
    eventResolved: expedition.eventResolved,
  }
}

export const resolveExpeditionMidEventChoice = (
  expedition: ShadowExpedition,
  choiceId: string,
  idFactory: () => string = () => `exp-log-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
  party: OwnedShadow[] = [],
): ShadowExpedition => {
  if (!expedition.midEvent || !expedition.eventTriggered || expedition.eventResolved) return expedition
  const choice = expedition.midEvent.choices.find(c => c.id === choiceId)
  if (!choice) return expedition

  const profiles = getShadowExpeditionProfiles(party)
  const aggregate = getShadowExpeditionPartyAggregateFromProfiles(profiles)
  const preferredRoleMatches = choice.preferredRoles?.filter(role => party.some(shadow => shadow.role === role)).length ?? 0
  const eventProgressBonus = preferredRoleMatches > 0
    ? Math.round(boundedBonus(aggregate.expeditionPower + aggregate.synergyCoordination * 0.3, Math.max(1, party.length) * 520, 4))
    : 0
  const eventRiskMitigation = party.length > 0
    ? Math.round(boundedBonus(aggregate.riskControl + aggregate.supportStability * 0.35, Math.max(1, party.length) * 560, preferredRoleMatches > 0 ? 4 : 2))
    : 0
  const progressDelta = (choice.progressDelta ?? 0) + eventProgressBonus
  const riskDelta = (choice.riskDelta ?? 0) - eventRiskMitigation

  const nextProgress = Math.max(0, Math.min(140, expedition.progress + progressDelta))
  const nextRisk = clamp(expedition.risk + riskDelta, 0, 140)
  const nextSearchStacks = Math.min(3, (expedition.searchStacks ?? 0) + (choice.searchStackDelta ?? 0))

  const logs: ShadowExpeditionLog[] = [
    ...expedition.logs,
    {
      id: idFactory(),
      turn: expedition.turn,
      type: 'event',
      phase: 'threshold',
      message: `[선택] ${choice.label} — ${choice.log}`,
    },
  ]

  if (eventProgressBonus > 0 || eventRiskMitigation > 0) {
    logs.push({
      id: idFactory(),
      turn: expedition.turn,
      type: 'event',
      phase: 'threshold',
      message: `역할 대응이 맞아 상황 처리가 안정화되었다. 진행도 +${eventProgressBonus}, 위험도 -${eventRiskMitigation}.`,
    })
  }

  return {
    ...expedition,
    progress: nextProgress,
    risk: nextRisk,
    searchStacks: nextSearchStacks,
    logs,
    eventResolved: true,
  }
}
