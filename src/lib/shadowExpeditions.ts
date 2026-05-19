import type {
  AchievementStats,
  ExpeditionMidEvent,
  ExpeditionPhase,
  OwnedShadow,
  ShadowDefinition,
  ShadowExpedition,
  ShadowExpeditionCommand,
  ShadowExpeditionLog,
  ShadowExpeditionOutcome,
  ShadowExpeditionResult,
  ShadowExpeditionType,
  ShadowRole,
} from './types'
import { getShadowDefinition } from './shadows'
import {
  buildExpeditionReport,
  getCommandLog,
  getExpeditionPhase,
  getPhaseDisplayName,
  getPhaseEnterLog,
  getRoleLine,
  pickMidEvent,
} from './expeditionLore'

export const SHADOW_EXPEDITION_UNLOCK_DAILY_COUNT = 2
export const SHADOW_EXPEDITION_PARTY_MIN = 1
export const SHADOW_EXPEDITION_PARTY_MAX = 5

export const SHADOW_EXPEDITION_TYPE_LABEL: Record<ShadowExpeditionType, string> = {
  training: '수련 원정',
  essence: '정수 회수',
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

export const SHADOW_EXPEDITION_TEMPLATES: ExpeditionTemplate[] = [
  {
    type: 'training',
    title: '그림자 훈련장',
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
    great_success: { xp: 55, essence: 2 },
    success: { xp: 40, essence: 1 },
    partial: { xp: 18, essence: 0 },
    failure: { xp: 6, essence: 0 },
  },
  essence: {
    great_success: { xp: 28, essence: 12 },
    success: { xp: 20, essence: 8 },
    partial: { xp: 10, essence: 3 },
    failure: { xp: 5, essence: 0 },
  },
  hunt: {
    great_success: { xp: 42, essence: 8 },
    success: { xp: 30, essence: 5 },
    partial: { xp: 14, essence: 2 },
    failure: { xp: 5, essence: 0 },
  },
  scout: {
    great_success: { xp: 36, essence: 6 },
    success: { xp: 24, essence: 4 },
    partial: { xp: 12, essence: 1 },
    failure: { xp: 4, essence: 0 },
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

const COMMAND_BASE: Record<ShadowExpeditionCommand, { progress: [number, number]; risk: [number, number] }> = {
  attack: { progress: [22, 32], risk: [8, 14] },
  defend: { progress: [8, 14], risk: [-25, -15] },
  scout: { progress: [10, 18], risk: [-18, -8] },
  analyze: { progress: [14, 22], risk: [0, 8] },
  search: { progress: [10, 18], risk: [10, 18] },
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))

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
      message: '오늘의 그림자 원정이 감지되었다. Daily 2개를 완료하면 지휘 권한이 열린다.',
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
  return Math.round(basePower * rarityMultiplier * enhancementMultiplier * levelMultiplier * roleMatchMultiplier * namedMultiplier)
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
  if (progress >= 120 && risk < 70) return 'great_success'
  if (progress >= 100) return 'success'
  if (progress >= 60) return 'partial'
  return 'failure'
}

export const getShadowExpeditionReward = (
  type: ShadowExpeditionType,
  outcome: ShadowExpeditionOutcome,
  searchStacks = 0
): ShadowExpeditionResult => {
  const base = REWARDS[type][outcome]
  const searchBonus = outcome === 'failure' ? 0 : Math.min(3, Math.max(0, searchStacks))
  const bonusRewards = searchBonus > 0 ? [`수색 보너스 정수 +${searchBonus}`] : undefined
  return {
    outcome,
    progress: 0,
    risk: 0,
    shadowXpGained: base.xp,
    essenceGained: base.essence + searchBonus,
    bonusRewards,
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

  let progressDelta = range(rng, base.progress[0], base.progress[1])
  let riskDelta = range(rng, base.risk[0], base.risk[1])

  progressDelta += clamp(Math.round((powerRatio - 1) * 18), -16, 18)
  riskDelta += powerRatio < 0.65 ? 10 : powerRatio < 0.85 ? 6 : powerRatio > 1.25 ? -4 : 0
  if (powerRatio < 0.65) progressDelta -= 4
  if (powerRatio < 0.45) { progressDelta -= 3; riskDelta += 4 }
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

  // Mid-event trigger: threshold phase, max 1 per expedition, ~40% chance
  let midEvent: ExpeditionMidEvent | undefined = expedition.midEvent
  let eventTriggered = expedition.eventTriggered ?? false
  if (
    nextPhase === 'threshold' &&
    !eventTriggered &&
    rng() < 0.42
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

  const outcome = getShadowExpeditionOutcome(nextProgress, nextRisk)
  const reward = getShadowExpeditionReward(expedition.type, outcome, nextSearchStacks)

  // Featured shadow for report
  const featured = actor ?? party[0]
  const report = buildExpeditionReport(outcome, featured?.name ?? '군단')

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

  logs.push({
    id: idFactory(),
    turn: nextTurn,
    type: 'system',
    message: `원정 ${SHADOW_EXPEDITION_OUTCOME_LABEL[outcome]}. 그림자들이 경험치 ${result.shadowXpGained}와 정수 ${result.essenceGained}을 회수했다.`,
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
  idFactory: () => string = () => `exp-log-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
): ShadowExpedition => {
  if (!expedition.midEvent || !expedition.eventTriggered || expedition.eventResolved) return expedition
  const choice = expedition.midEvent.choices.find(c => c.id === choiceId)
  if (!choice) return expedition

  const nextProgress = Math.max(0, Math.min(140, expedition.progress + (choice.progressDelta ?? 0)))
  const nextRisk = clamp(expedition.risk + (choice.riskDelta ?? 0), 0, 140)
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

  return {
    ...expedition,
    progress: nextProgress,
    risk: nextRisk,
    searchStacks: nextSearchStacks,
    logs,
    eventResolved: true,
  }
}
