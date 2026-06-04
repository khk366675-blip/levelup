import type {
  OwnedShadow,
  RewardBox,
  SecretProgressState,
  ShadowExpedition,
  SystemMessage,
} from './types'
import { SECRET_HINTS, SECRET_MESSAGES } from './secretLore'
import { ensureWorldSignalState, createInitialWorldSignalState, emitWorldSignal } from './worldSignals'

export interface MysteryVariant {
  id: string
  clues: string[]
  checkTrigger: (event: SecretEvent, snapshot: SecretSnapshot) => boolean
  rewardTitle: string
  rewardLines: string[]
  rewardBonus: number
}

export const MYSTERY_VARIANTS: MysteryVariant[] = [
  {
    id: 'mystery_v1',
    clues: [
      'mystery_v1_clue1', 'mystery_v1_clue2', 'mystery_v1_clue3', 'mystery_v1_clue4',
      'mystery_v1_clue5', 'mystery_v1_clue6', 'mystery_v1_clue7', 'mystery_v1_clue8'
    ],
    checkTrigger: (event, snapshot) => {
      if (event.context !== 'expedition') return false
      if (event.outcome !== 'success' && event.outcome !== 'great_success') return false
      if (event.expeditionType !== 'scout') return false
      if (!event.shadowIds || event.shadowIds.length !== 1) return false
      
      const singleId = event.shadowIds[0]
      const shadow = (snapshot.ownedShadows ?? []).find(s => s.instanceId === singleId)
      return shadow?.role === 'scout'
    },
    rewardTitle: '🔑 비밀 미스터리 해제 완료',
    rewardLines: ['왜곡되어 있던 고독한 좌표가 마침내 올바르게 공명하기 시작했습니다. 군단 기록에 숨겨진 보상이 지급됩니다.'],
    rewardBonus: 150
  },
  {
    id: 'mystery_v2',
    clues: [
      'mystery_v2_clue1', 'mystery_v2_clue2', 'mystery_v2_clue3', 'mystery_v2_clue4',
      'mystery_v2_clue5', 'mystery_v2_clue6', 'mystery_v2_clue7', 'mystery_v2_clue8'
    ],
    checkTrigger: (event, snapshot) => {
      if (event.context !== 'shadow') return false
      if (event.action !== 'evolve') return false
      if (!event.shadowInstanceId) return false
      
      const shadow = (snapshot.ownedShadows ?? []).find(s => s.instanceId === event.shadowInstanceId)
      return shadow?.role === 'analyst'
    },
    rewardTitle: '🔑 비밀 미스터리 해제 완료',
    rewardLines: ['지식을 탐하던 그림자가 껍질을 깨고 진화하자, 망각되었던 인장이 빛을 뿜습니다. 군단 기록에 숨겨진 보상이 지급됩니다.'],
    rewardBonus: 150
  },
  {
    id: 'mystery_v3',
    clues: [
      'mystery_v3_clue1', 'mystery_v3_clue2', 'mystery_v3_clue3', 'mystery_v3_clue4',
      'mystery_v3_clue5', 'mystery_v3_clue6', 'mystery_v3_clue7', 'mystery_v3_clue8'
    ],
    checkTrigger: (event, snapshot) => {
      if (event.context !== 'expedition') return false
      if (event.outcome !== 'success' && event.outcome !== 'great_success') return false
      if (event.expeditionType !== 'training') return false
      if (!event.shadowIds) return false
      
      const supports = (snapshot.ownedShadows ?? []).filter(s => event.shadowIds?.includes(s.instanceId) && s.role === 'support')
      return supports.length >= 3
    },
    rewardTitle: '🔑 비밀 미스터리 해제 완료',
    rewardLines: ['세 명의 보조자들이 훈련 임무 완수의 인장을 완성했습니다. 군단 기록에 숨겨진 보상이 지급됩니다.'],
    rewardBonus: 150
  },
  {
    id: 'mystery_v4',
    clues: [
      'mystery_v4_clue1', 'mystery_v4_clue2', 'mystery_v4_clue3', 'mystery_v4_clue4',
      'mystery_v4_clue5', 'mystery_v4_clue6', 'mystery_v4_clue7', 'mystery_v4_clue8'
    ],
    checkTrigger: (event, snapshot) => {
      if (event.context !== 'expedition') return false
      if (event.outcome !== 'success' && event.outcome !== 'great_success') return false
      if (event.expeditionType !== 'hunt') return false
      if (!event.shadowIds || event.shadowIds.length !== 2) return false
      
      const shadows = (snapshot.ownedShadows ?? []).filter(s => event.shadowIds?.includes(s.instanceId))
      return shadows.length === 2 && shadows.some(s => s.role === 'guard') && shadows.some(s => s.role === 'assault')
    },
    rewardTitle: '🔑 비밀 미스터리 해제 완료',
    rewardLines: ['단둘이 사냥을 정복한 검과 방패의 공조가 인정을 받았습니다. 군단 기록에 숨겨진 보상이 지급됩니다.'],
    rewardBonus: 150
  },
  {
    id: 'mystery_v5',
    clues: [
      'mystery_v5_clue1', 'mystery_v5_clue2', 'mystery_v5_clue3', 'mystery_v5_clue4',
      'mystery_v5_clue5', 'mystery_v5_clue6', 'mystery_v5_clue7', 'mystery_v5_clue8'
    ],
    checkTrigger: (event, snapshot) => {
      if (event.context !== 'tower') return false
      if (event.outcome !== 'victory') return false
      if (!event.boss) return false
      
      const equippedShadowIds = (snapshot as any).equippedShadowIds ?? []
      return !equippedShadowIds || equippedShadowIds.length === 0
    },
    rewardTitle: '🔑 비밀 미스터리 해제 완료',
    rewardLines: ['그림자의 지배를 거두고 헌터 단독의 힘으로 탑의 정상을 정복했습니다. 군단 기록에 숨겨진 보상이 지급됩니다.'],
    rewardBonus: 150
  },
  {
    id: 'mystery_v6',
    clues: [
      'mystery_v6_clue1', 'mystery_v6_clue2', 'mystery_v6_clue3', 'mystery_v6_clue4',
      'mystery_v6_clue5', 'mystery_v6_clue6', 'mystery_v6_clue7', 'mystery_v6_clue8'
    ],
    checkTrigger: (event, snapshot) => {
      if (event.context !== 'gate') return false
      if (event.outcome !== 'victory') return false
      
      const equippedTitleId = (snapshot as any).hunter?.equippedTitleId
      return equippedTitleId === 'greeting-the-system'
    },
    rewardTitle: '🔑 비밀 미스터리 해제 완료',
    rewardLines: ['최초의 서약을 이행하고 게이트를 통과한 초심의 영예가 도달했습니다. 군단 기록에 숨겨진 보상이 지급됩니다.'],
    rewardBonus: 150
  },
  {
    id: 'mystery_v7',
    clues: [
      'mystery_v7_clue1', 'mystery_v7_clue2', 'mystery_v7_clue3', 'mystery_v7_clue4',
      'mystery_v7_clue5', 'mystery_v7_clue6', 'mystery_v7_clue7', 'mystery_v7_clue8'
    ],
    checkTrigger: (event, snapshot) => {
      if (event.context !== 'expedition') return false
      if (event.outcome !== 'success' && event.outcome !== 'great_success') return false
      if (event.expeditionType !== 'scout') return false
      if (!event.shadowIds || event.shadowIds.length !== 3) return false
      
      const rats = (snapshot.ownedShadows ?? []).filter(s => event.shadowIds?.includes(s.instanceId) && s.definitionId === 'shadow-rat')
      return rats.length === 3
    },
    rewardTitle: '🔑 비밀 미스터리 해제 완료',
    rewardLines: ['미미한 쥐들의 대열이 숨겨진 정찰의 빈틈을 파헤쳐 좌표를 복구했습니다. 군단 기록에 숨겨진 보상이 지급됩니다.'],
    rewardBonus: 150
  }
]

export const pickRandomMysteryVariantId = (excludeId?: string): string => {
  const pool = MYSTERY_VARIANTS.filter(v => v.id !== excludeId)
  const selected = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : MYSTERY_VARIANTS[0]
  return selected.id
}

type SecretSnapshot = {
  infiniteTower?: {
    highestClearedFloor: number
    bossRewardsClaimed: Record<number, boolean>
  }
  combatLogs?: Array<{ result: 'victory' | 'defeat' | 'draw' }>
  shadowExtractHistory?: Array<{ success: boolean; shadow?: OwnedShadow }>
  ownedShadows?: OwnedShadow[]
  shadowExpeditions?: ShadowExpedition[]
  rewardBoxes?: RewardBox[]
  challengeCardHistory?: Record<string, { completedIds: string[]; completedCount: number }>
  skillStates?: Record<string, { timesUsed?: number; masteryLevel?: number }>
}

export type SecretContext = 'tower' | 'gate' | 'expedition' | 'shadow' | 'box' | 'rank' | 'echo'

export type SecretEvent =
  | { context: 'tower'; outcome: 'victory' | 'defeat' | 'draw'; floor: number; firstClear?: boolean; boss?: boolean }
  | { context: 'gate'; outcome: 'victory' | 'defeat' | 'draw'; isMonarch?: boolean; monarchId?: string }
  | { context: 'expedition'; outcome: 'great_success' | 'success' | 'partial' | 'failure'; expeditionType?: string; shadowIds?: string[]; isEchoEvent?: boolean }
  | { context: 'shadow'; action: 'extract'; success: boolean; named?: boolean }
  | { context: 'shadow'; action: 'summon' | 'fragment_summon'; named?: boolean }
  | { context: 'shadow'; action: 'evolve'; shadowInstanceId?: string }
  | { context: 'box'; boxType?: string; source?: string }
  | { context: 'rank'; leveledUp?: boolean; rankChanged?: boolean; skillUses?: number; challengeCardsCompleted?: number }
  | { context: 'echo'; action: 'discover' | 'investigate' | 'resonance' | 'ending_select'; amount?: number; endingType?: 'surface' | 'loop' | 'true' }

export type SecretEventResult = {
  progress: SecretProgressState
  messages: Array<Omit<SystemMessage, 'id' | 'createdAt'>>
  shadowEssenceBonus: number
  ownedShadows?: OwnedShadow[]
}

const blankProgress = (): SecretProgressState => ({
  initializedAt: new Date().toISOString(),
  meta: { initializedAt: new Date().toISOString(), version: 1, lastSignalAt: {}, recentContexts: [] },
  signals: {},
  unlocked: [],
  sealed: {},
  seen: [],
  fragmentInk: {},
  flags: {},
  counters: {},
  lastSignals: {},
  discoveredHints: [],
  unlockedFragments: [],
  hiddenAffinity: {},
  sealedRewards: {},
  worldSignals: createInitialWorldSignalState(),
})

const count = (progress: SecretProgressState, key: string): number => progress.signals?.[key] ?? progress.counters?.[key] ?? 0
const hasSeen = (progress: SecretProgressState, key: string): boolean =>
  progress.seen?.includes(key) ?? progress.discoveredHints?.includes(key) ?? false
const hasHint = (progress: SecretProgressState, key: string): boolean => hasSeen(progress, key)
const hasFragment = (progress: SecretProgressState, key: string): boolean =>
  progress.unlocked?.includes(key) ?? progress.unlockedFragments?.includes(key) ?? false
const hasReward = (progress: SecretProgressState, key: string): boolean =>
  progress.sealed?.[key] !== undefined || progress.sealedRewards?.[key] === true
const rewardCount = (progress: SecretProgressState, prefix: string): number =>
  new Set([
    ...Object.keys(progress.sealed ?? {}),
    ...Object.keys(progress.sealedRewards ?? {}),
  ].filter(key => key.startsWith(prefix))).size

const unionStrings = (...arrays: Array<string[] | undefined>): string[] =>
  Array.from(new Set(arrays.flatMap(array => array ?? [])))

export const ECHO_TRUTH_AFFINITY_THRESHOLD = 40
export const ECHO_TRUTH_FRAGMENT_THRESHOLD = 6
export const ECHO_TRUTH_REQUIRED_FRAGMENT = 'echo-trace-b'

const mergeNumberRecords = (...records: Array<Record<string, number> | undefined>): Record<string, number> => {
  const merged: Record<string, number> = {}
  for (const record of records) {
    for (const [key, value] of Object.entries(record ?? {})) {
      merged[key] = Math.max(merged[key] ?? 0, value)
    }
  }
  return merged
}

const mergeSealedRecords = (progress: SecretProgressState): Record<string, string | number | boolean> => ({
  ...(progress.sealed ?? {}),
  ...Object.fromEntries(Object.entries(progress.sealedRewards ?? {}).filter(([, value]) => value)),
})

const sealSecretReward = (progress: SecretProgressState, rewardId: string, value: string | number | boolean = true): boolean => {
  if (hasReward(progress, rewardId)) return false
  progress.sealed = { ...(progress.sealed ?? {}), [rewardId]: value }
  progress.sealedRewards = { ...(progress.sealedRewards ?? {}), [rewardId]: true }
  return true
}

const markSecretSeen = (progress: SecretProgressState, seenId: string): boolean => {
  if (hasSeen(progress, seenId)) return false
  progress.seen = [...(progress.seen ?? []), seenId]
  return true
}

const unlockSecretOnce = (progress: SecretProgressState, unlockId: string): boolean => {
  if (hasFragment(progress, unlockId)) return false
  progress.unlocked = [...(progress.unlocked ?? []), unlockId]
  progress.unlockedFragments = [...(progress.unlockedFragments ?? []), unlockId]
  return true
}

const syncSecretSignals = (progress: SecretProgressState, signals: Record<string, number>) => {
  progress.signals = { ...signals }
  progress.counters = { ...signals }
}

const bump = (target: Record<string, number>, key: string, amount = 1) => {
  target[key] = (target[key] ?? 0) + amount
}

const max = (target: Record<string, number>, key: string, value: number) => {
  target[key] = Math.max(target[key] ?? 0, value)
}

const boolCount = (record: Record<number, boolean> | undefined): number =>
  Object.values(record ?? {}).filter(Boolean).length

const deriveSnapshotCounters = (snapshot: SecretSnapshot = {}): Record<string, number> => {
  const counters: Record<string, number> = {}
  const shadows = snapshot.ownedShadows ?? []

  const highestFloor = snapshot.infiniteTower?.highestClearedFloor ?? 0
  max(counters, 'tower_highest_milestone', Math.floor(highestFloor / 5) * 5)
  max(counters, 'tower_boss_clears', boolCount(snapshot.infiniteTower?.bossRewardsClaimed))
  max(counters, 'gate_clears', snapshot.combatLogs?.filter(log => log.result === 'victory').length ?? 0)
  max(counters, 'gate_extractions_attempted', snapshot.shadowExtractHistory?.length ?? 0)
  max(counters, 'gate_extractions_success', snapshot.shadowExtractHistory?.filter(result => result.success).length ?? 0)
  max(counters, 'gate_named_shadows_obtained', shadows.filter(shadow => shadow.isGateNamed).length)
  max(counters, 'shadows_evolved', shadows.filter(shadow => (shadow.evolutionStage ?? 0) > 0).length)
  max(counters, 'shadows_reached_level_threshold', shadows.filter(shadow => (shadow.level ?? 1) >= 10).length)
  max(counters, 'expedition_success', snapshot.shadowExpeditions?.filter(item => item.result?.outcome === 'success' || item.result?.outcome === 'great_success').length ?? 0)
  max(counters, 'expedition_great_success', snapshot.shadowExpeditions?.filter(item => item.result?.outcome === 'great_success').length ?? 0)
  max(counters, 'boss_boxes_opened', snapshot.rewardBoxes?.filter(box => box.type === 'boss' && box.status === 'opened').length ?? 0)
  max(counters, 'challenge_cards_completed', Object.values(snapshot.challengeCardHistory ?? {}).reduce((sum, day) => sum + day.completedCount, 0))
  max(counters, 'skill_uses', Object.values(snapshot.skillStates ?? {}).reduce((sum, skill) => sum + (skill.timesUsed ?? 0), 0))
  if (
    count({ counters }, 'tower_highest_milestone') >= 5 &&
    count({ counters }, 'gate_clears') >= 1 &&
    count({ counters }, 'expedition_success') >= 1
  ) {
    max(counters, 'resonance_triad', 1)
  }

  return counters
}

export const createInitialSecretProgress = (snapshot: SecretSnapshot = {}): SecretProgressState => {
  const progress = blankProgress()
  syncSecretSignals(progress, deriveSnapshotCounters(snapshot))
  return progress
}

export const ensureSecretProgress = (
  progress: SecretProgressState | undefined,
  snapshot: SecretSnapshot = {}
): SecretProgressState => {
  if (!progress) return createInitialSecretProgress(snapshot)
  const snapshotCounters = deriveSnapshotCounters(snapshot)
  const affinitySignals = Object.fromEntries(
    Object.entries(progress.hiddenAffinity ?? {}).map(([key, value]) => [`affinity.${key}`, value])
  )
  const signals = mergeNumberRecords(progress.counters, progress.signals, affinitySignals, snapshotCounters)
  const initializedAt = progress.meta?.initializedAt ?? progress.initializedAt ?? new Date().toISOString()
  const lastSignalAt = {
    ...(progress.lastSignals ?? {}),
    ...(progress.meta?.lastSignalAt ?? {}),
  }
  const seen = unionStrings(progress.seen, progress.discoveredHints)
  const unlocked = unionStrings(progress.unlocked, progress.unlockedFragments, Object.entries(progress.flags ?? {})
    .filter(([, value]) => value)
    .map(([key]) => `flag.${key}`))
  const sealed = mergeSealedRecords(progress)

  // 미스터리 진행도 추출 및 배정
  const prevMysteryVariantId = progress.prevMysteryVariantId
  const mysteryVariantId = progress.mysteryVariantId || pickRandomMysteryVariantId(prevMysteryVariantId)
  const mysteryTriggered = progress.mysteryTriggered ?? false
  const mysteryActionCount = progress.mysteryActionCount ?? 0

  return {
    meta: {
      initializedAt,
      version: progress.meta?.version ?? 1,
      lastSignalAt,
      recentContexts: progress.meta?.recentContexts ?? [],
    },
    signals,
    unlocked,
    sealed,
    seen,
    fragmentInk: progress.fragmentInk ?? {},
    initializedAt,
    flags: progress.flags ?? {},
    counters: signals,
    lastSignals: lastSignalAt,
    discoveredHints: progress.discoveredHints ?? [],
    unlockedFragments: progress.unlockedFragments ?? [],
    hiddenAffinity: progress.hiddenAffinity ?? {},
    sealedRewards: Object.fromEntries(Object.entries(sealed).map(([key]) => [key, true])),
    worldSignals: ensureWorldSignalState(progress.worldSignals),
    mysteryVariantId,
    prevMysteryVariantId,
    mysteryTriggered,
    mysteryActionCount,
  }
}

export const getSecretProgress = ensureSecretProgress

export const getSecretTraceFragmentCount = (progress: SecretProgressState | undefined): number => {
  if (!progress) return 0
  const normalized = ensureSecretProgress(progress)
  return unionStrings(
    normalized.unlockedFragments,
    normalized.unlocked?.filter(id => id.includes('trace'))
  ).length
}

export const getEchoTruthReadiness = (
  progress: SecretProgressState | undefined
): {
  affinity: number
  fragmentCount: number
  hasRequiredFragment: boolean
  inheritedTruth: boolean
  reached: boolean
} => {
  if (!progress) {
    return {
      affinity: 0,
      fragmentCount: 0,
      hasRequiredFragment: false,
      inheritedTruth: false,
      reached: false,
    }
  }

  const normalized = ensureSecretProgress(progress)
  const affinity = normalized.hiddenAffinity?.echo ?? 0
  const fragmentCount = getSecretTraceFragmentCount(normalized)
  const hasRequiredFragment = hasFragment(normalized, ECHO_TRUTH_REQUIRED_FRAGMENT)
  const inheritedTruth = normalized.flags?.trueEndingReached === true
  const reached = inheritedTruth || (
    affinity >= ECHO_TRUTH_AFFINITY_THRESHOLD &&
    fragmentCount >= ECHO_TRUTH_FRAGMENT_THRESHOLD &&
    hasRequiredFragment
  )

  return {
    affinity,
    fragmentCount,
    hasRequiredFragment,
    inheritedTruth,
    reached,
  }
}

export const hasEchoTruthForAngel = (progress: SecretProgressState | undefined): boolean =>
  getEchoTruthReadiness(progress).reached

export const markSecretFlagPublic = (
  progress: SecretProgressState | undefined,
  flag: string,
  value = true
): SecretProgressState => {
  const next = ensureSecretProgress(progress)
  next.flags = { ...(next.flags ?? {}), [flag]: value }
  return next
}

export const incrementSecretSignal = (
  progress: SecretProgressState | undefined,
  key: string,
  amount = 1
): SecretProgressState => {
  const next = ensureSecretProgress(progress)
  const signals = { ...(next.signals ?? next.counters ?? {}) }
  bump(signals, key, amount)
  syncSecretSignals(next, signals)
  return next
}

export const hasSecretUnlocked = (progress: SecretProgressState | undefined, id: string): boolean =>
  progress ? hasFragment(ensureSecretProgress(progress), id) : false

export const unlockSecretOncePublic = (progress: SecretProgressState | undefined, id: string): SecretProgressState => {
  const next = ensureSecretProgress(progress)
  unlockSecretOnce(next, id)
  return next
}

export const markSecretSeenPublic = (progress: SecretProgressState | undefined, id: string): SecretProgressState => {
  const next = ensureSecretProgress(progress)
  markSecretSeen(next, id)
  return next
}

export const sealSecretRewardPublic = (progress: SecretProgressState | undefined, rewardId: string): SecretProgressState => {
  const next = ensureSecretProgress(progress)
  sealSecretReward(next, rewardId)
  return next
}

export const isSecretRewardSealed = (progress: SecretProgressState | undefined, rewardId: string): boolean =>
  progress ? hasReward(ensureSecretProgress(progress), rewardId) : false

export const capSecretBonus = (base: number, modified: number, maxRatio = 1.15): number =>
  Math.min(modified, Math.ceil(base * maxRatio))

export const applySecretModifiers = (baseValue: number, modifiers: number[], maxRatio = 1.15): number =>
  capSecretBonus(baseValue, baseValue + modifiers.reduce((sum, value) => sum + value, 0), maxRatio)

const hintFor = (progress: SecretProgressState, context: SecretContext): string | undefined => {
  if (context === 'echo') return undefined
  const contextCount = count(progress, `${context}_signals`)
  const lastHintAt = count(progress, `last_hint_signal_${context}`)
  if (lastHintAt > 0 && contextCount - lastHintAt < 3) return undefined
  const resonanceLift = Math.min(2, count(progress, 'resonance_triad'))
  const eligible = (SECRET_HINTS as any)[context]
    .filter((item: any) => contextCount + resonanceLift >= item.min && !hasHint(progress, item.id))
  return eligible[eligible.length - 1]?.id
}

const hintText = (hintId: string): string | undefined =>
  Object.values(SECRET_HINTS).flat().find(item => item.id === hintId)?.line

const updateFragmentInk = (progress: SecretProgressState) => {
  const ink = { ...(progress.fragmentInk ?? {}) }
  const setInk = (id: string, value: number) => {
    ink[id] = Math.max(ink[id] ?? 0, Math.min(100, Math.round(value)))
  }

  setInk('first-trace', Math.max(
    count(progress, 'tower_boss_clears') * 100,
    count(progress, 'gate_clears') * 34,
    count(progress, 'expedition_success') * 20,
    count(progress, 'gate_extractions_success') * 50,
    Math.min(count(progress, 'tower_signals'), count(progress, 'gate_signals'), count(progress, 'expedition_signals')) * 100
  ))
  setInk('tower-trace-a', count(progress, 'tower_highest_milestone') * 10)
  setInk('gate-trace-a', Math.min(count(progress, 'gate_clears') * 20, count(progress, 'tower_highest_milestone') * 20))
  setInk('expedition-trace-a', Math.min(count(progress, 'expedition_success') * 20, count(progress, 'gate_clears') * 50))
  setInk('cross-trace-a', count(progress, 'resonance_triad') * 34)
  progress.fragmentInk = ink
}

const maybeEnsureFirstDiscovery = (
  progress: SecretProgressState,
  messages: Array<Omit<SystemMessage, 'id' | 'createdAt'>>
): boolean => {
  if ((progress.unlockedFragments?.length ?? 0) > 0) return false
  const ready =
    count(progress, 'tower_boss_clears') >= 1 ||
    count(progress, 'gate_clears') >= 3 ||
    count(progress, 'expedition_success') >= 5 ||
    count(progress, 'gate_extractions_success') >= 2 ||
    (
      count(progress, 'tower_signals') >= 1 &&
      count(progress, 'gate_signals') >= 1 &&
      count(progress, 'expedition_signals') >= 1
    )
  if (!ready || !unlockSecretOnce(progress, 'first-trace')) return false
  messages.push({ kind: 'secret', ...SECRET_MESSAGES.firstTrace })
  return true
}

const maybeUnlockFragments = (
  progress: SecretProgressState,
  messages: Array<Omit<SystemMessage, 'id' | 'createdAt'>>
) => {
  updateFragmentInk(progress)
  if (maybeEnsureFirstDiscovery(progress, messages)) return

  const candidates: Array<{ id: string; ready: boolean }> = [
    { id: 'tower-trace-a', ready: count(progress, 'tower_highest_milestone') >= 10 },
    { id: 'tower-trace-b', ready: count(progress, 'tower_boss_clears') >= 3 && count(progress, 'expedition_success') >= 1 },
    { id: 'gate-trace-a', ready: count(progress, 'gate_clears') >= 4 && count(progress, 'tower_highest_milestone') >= 5 },
    { id: 'gate-trace-b', ready: count(progress, 'gate_extractions_success') >= 3 && count(progress, 'shadows_evolved') >= 1 },
    { id: 'expedition-trace-a', ready: count(progress, 'expedition_success') >= 4 && count(progress, 'gate_clears') >= 2 },
    { id: 'expedition-trace-b', ready: count(progress, 'expedition_great_success') >= 2 && count(progress, 'tower_boss_clears') >= 1 },
    { id: 'shadow-trace-a', ready: count(progress, 'shadows_evolved') >= 1 && count(progress, 'gate_extractions_attempted') >= 2 },
    { id: 'shadow-trace-b', ready: count(progress, 'shadows_reached_level_threshold') >= 2 && count(progress, 'expedition_success') >= 2 },
    {
      id: 'cross-trace-a',
      ready: count(progress, 'tower_boss_clears') >= 2 &&
        count(progress, 'gate_extractions_success') >= 2 &&
        count(progress, 'expedition_success') >= 3 &&
        count(progress, 'resonance_triad') >= 1,
    },
  ]
  const next = candidates.find(candidate => candidate.ready && !hasFragment(progress, candidate.id))
  if (next && unlockSecretOnce(progress, next.id)) {
    messages.push({ kind: 'secret', ...SECRET_MESSAGES.fragmentTrace })
  }
}

const maybeApplySmallReward = (
  progress: SecretProgressState,
  event: SecretEvent,
  messages: Array<Omit<SystemMessage, 'id' | 'createdAt'>>
): number => {
  const bonusBudgetUsed = rewardCount(progress, 'tower-') + rewardCount(progress, 'expedition-') + rewardCount(progress, 'box-')
  if (bonusBudgetUsed >= 6) return 0

  if (event.context === 'tower' && event.outcome === 'victory' && event.boss && !hasReward(progress, `tower-${event.floor}`)) {
    if (count(progress, 'tower_boss_clears') >= 2 && count(progress, 'expedition_success') >= 2) {
      sealSecretReward(progress, `tower-${event.floor}`)
      messages.push({ kind: 'secret', ...SECRET_MESSAGES.reward.tower })
      return 1
    }
  }

  if (
    event.context === 'expedition' &&
    event.outcome === 'great_success' &&
    rewardCount(progress, 'expedition-') < 3 &&
    !hasReward(progress, `expedition-${count(progress, 'expedition_great_success')}`)
  ) {
    if (count(progress, 'gate_clears') >= 3) {
      sealSecretReward(progress, `expedition-${count(progress, 'expedition_great_success')}`)
      messages.push({ kind: 'secret', ...SECRET_MESSAGES.reward.expedition })
      return 1
    }
  }

  if (
    event.context === 'box' &&
    event.boxType === 'boss' &&
    rewardCount(progress, 'box-') < 3 &&
    !hasReward(progress, `box-${count(progress, 'boss_boxes_opened')}`)
  ) {
    if (count(progress, 'tower_highest_milestone') >= 10 && count(progress, 'gate_extractions_attempted') >= 2) {
      sealSecretReward(progress, `box-${count(progress, 'boss_boxes_opened')}`)
      messages.push({ kind: 'secret', ...SECRET_MESSAGES.reward.box })
      return 1
    }
  }

  return 0
}

const maybeMarkShadow = (
  progress: SecretProgressState,
  event: SecretEvent,
  shadows: OwnedShadow[] | undefined,
  messages: Array<Omit<SystemMessage, 'id' | 'createdAt'>>
): OwnedShadow[] | undefined => {
  if (event.context !== 'shadow' || event.action !== 'evolve' || !event.shadowInstanceId) return undefined
  if (hasReward(progress, `shadow-mark-${event.shadowInstanceId}`)) return undefined
  if ((progress.unlockedFragments?.length ?? 0) < 4 || count(progress, 'expedition_success') < 2) return undefined

  let changed = false
  const next = (shadows ?? []).map(shadow => {
    if (shadow.instanceId !== event.shadowInstanceId) return shadow
    const secretTraits = shadow.secretTraits ?? []
    if (secretTraits.includes('silent-oath')) return shadow
    changed = true
    return {
      ...shadow,
      secretTraits: [...secretTraits, 'silent-oath'],
      variantKey: shadow.variantKey ?? 'silent-oath',
      awakenedAt: shadow.awakenedAt ?? new Date().toISOString(),
    }
  })
  if (!changed) return undefined

  sealSecretReward(progress, `shadow-mark-${event.shadowInstanceId}`)
  messages.push({ kind: 'secret', ...SECRET_MESSAGES.shadowMark })
  return next
}

const maybeTriggerRetrospective = (
  progress: SecretProgressState,
  event: SecretEvent,
  snapshotSignals: Record<string, number>,
  messages: Array<Omit<SystemMessage, 'id' | 'createdAt'>>
) => {
  if (event.context !== 'tower' && event.context !== 'gate' && event.context !== 'expedition') return
  if (hasSeen(progress, 'retrospective.first')) return

  const hasPriorWeight =
    (snapshotSignals.tower_highest_milestone ?? 0) >= 5 ||
    (snapshotSignals.gate_clears ?? 0) >= 3 ||
    (snapshotSignals.expedition_success ?? 0) >= 2 ||
    (snapshotSignals.shadows_evolved ?? 0) >= 1 ||
    (snapshotSignals.boss_boxes_opened ?? 0) >= 1
  if (!hasPriorWeight) return

  markSecretSeen(progress, 'retrospective.first')
  messages.push({ kind: 'story', ...SECRET_MESSAGES.retrospective[event.context] })
}

const maybeUpdateResonance = (
  progress: SecretProgressState,
  event: SecretEvent,
  signals: Record<string, number>,
  messages: Array<Omit<SystemMessage, 'id' | 'createdAt'>>
) => {
  if (event.context !== 'tower' && event.context !== 'gate' && event.context !== 'expedition') return
  const recent = [...(progress.meta?.recentContexts ?? []), event.context].slice(-6)
  const hasTriad = ['tower', 'gate', 'expedition'].every(context => recent.includes(context))
  const actionSum = count({ signals }, 'tower_signals') + count({ signals }, 'gate_signals') + count({ signals }, 'expedition_signals')
  const lastAt = signals.last_resonance_signal ?? 0

  if (hasTriad && actionSum - lastAt >= 3) {
    bump(signals, 'resonance_triad')
    signals.last_resonance_signal = actionSum
    progress.meta = { ...(progress.meta ?? {}), recentContexts: [] }
    if (markSecretSeen(progress, 'resonance.first')) {
      messages.push({ kind: 'secret', ...SECRET_MESSAGES.resonance })
    }
    return
  }

  progress.meta = { ...(progress.meta ?? {}), recentContexts: recent }
}

export const recordSecretEvent = (
  currentProgress: SecretProgressState | undefined,
  event: SecretEvent,
  snapshot: SecretSnapshot = {}
): SecretEventResult => {
  const progress = ensureSecretProgress(currentProgress, snapshot)
  const snapshotSignals = deriveSnapshotCounters(snapshot)
  const counters = { ...(progress.signals ?? progress.counters ?? {}) }
  const hiddenAffinity = { ...(progress.hiddenAffinity ?? {}) }
  const messages: Array<Omit<SystemMessage, 'id' | 'createdAt'>> = []

  bump(counters, `${event.context}_signals`)
  bump(counters, `affinity.${event.context}`)
  bump(hiddenAffinity, event.context, 1)

  // Echo 공명도(전임자 흔적) 누적 및 엔딩 기록 처리
  if (event.context === 'echo') {
    if (event.action === 'ending_select') {
      if (event.endingType === 'true') {
        progress.flags = { ...(progress.flags ?? {}), trueEndingReached: true }
        counters.trueEndingReached = 1
      } else if (event.endingType === 'loop') {
        progress.flags = { ...(progress.flags ?? {}), surfaceEndingReached: true, loopEndingReached: true }
        counters.surfaceEndingReached = 1
        counters.loopEndingReached = 1
      } else if (event.endingType === 'surface') {
        progress.flags = { ...(progress.flags ?? {}), surfaceEndingReached: true }
        counters.surfaceEndingReached = 1
      }
    } else {
      bump(hiddenAffinity, 'echo', event.amount ?? 1)
    }
  } else if (event.context === 'gate' && event.outcome === 'victory') {
    bump(hiddenAffinity, 'echo', event.isMonarch ? 3 : 1)
  } else if (event.context === 'expedition' && (event.outcome === 'success' || event.outcome === 'great_success')) {
    bump(hiddenAffinity, 'echo', event.isEchoEvent ? 3 : 1)
  }

  if (event.context === 'tower') {
    if (event.outcome === 'victory') {
      bump(counters, 'tower_clears')
      max(counters, 'tower_highest_milestone', Math.floor(event.floor / 5) * 5)
      if (event.boss) bump(counters, 'tower_boss_clears')
    } else {
      bump(counters, 'tower_failures')
    }
  }

  if (event.context === 'gate') {
    if (event.outcome === 'victory') bump(counters, 'gate_clears')
    else if (event.outcome === 'defeat') bump(counters, 'gate_failures')
  }

  if (event.context === 'expedition') {
    if (event.outcome === 'success' || event.outcome === 'great_success') bump(counters, 'expedition_success')
    if (event.outcome === 'great_success') bump(counters, 'expedition_great_success')
    if (event.outcome === 'failure') bump(counters, 'expedition_failure')
  }

  if (event.context === 'shadow') {
    if (event.action === 'extract') {
      bump(counters, 'gate_extractions_attempted')
      if (event.success) bump(counters, 'gate_extractions_success')
      else bump(counters, 'gate_extractions_failed')
      if (event.named) bump(counters, 'gate_named_shadows_obtained')
    }
    if (event.action === 'summon' || event.action === 'fragment_summon') bump(counters, 'shadow_summons')
    if (event.action === 'evolve') bump(counters, 'shadows_evolved')
  }

  if (event.context === 'box') {
    if (event.boxType === 'boss') bump(counters, 'boss_boxes_opened')
  }

  if (event.context === 'rank') {
    if (event.leveledUp) bump(counters, 'levelups_seen')
    if (event.rankChanged) bump(counters, 'rankups_seen')
    if (event.skillUses) bump(counters, 'skill_uses', event.skillUses)
    if (event.challengeCardsCompleted) bump(counters, 'challenge_cards_completed', event.challengeCardsCompleted)
  }

  progress.hiddenAffinity = hiddenAffinity
  const lastSignalAt = { ...(progress.meta?.lastSignalAt ?? progress.lastSignals ?? {}), [event.context]: new Date().toISOString() }
  progress.meta = { ...(progress.meta ?? {}), lastSignalAt }
  progress.lastSignals = lastSignalAt

  maybeTriggerRetrospective(progress, event, snapshotSignals, messages)
  maybeUpdateResonance(progress, event, counters, messages)
  syncSecretSignals(progress, counters)

  if (
    event.context === 'shadow' &&
    event.action === 'extract' &&
    !event.success &&
    count(progress, 'gate_extractions_failed') >= 2 &&
    markSecretSeen(progress, 'shadow.extract.failed.echo')
  ) {
    messages.push({
      kind: 'secret',
      title: SECRET_MESSAGES.hint.title,
      lines: ['시스템 로그에 해석되지 않은 잔향이 남았습니다.'],
    })
  }

  const hintId = hintFor(progress, event.context)
  if (hintId) {
    counters[`last_hint_signal_${event.context}`] = count(progress, `${event.context}_signals`)
    markSecretSeen(progress, hintId)
    progress.discoveredHints = unionStrings(progress.discoveredHints, [hintId])
    const line = hintText(hintId)
    if (line) messages.push({ kind: 'secret', title: SECRET_MESSAGES.hint.title, lines: [line] })
    syncSecretSignals(progress, counters)
  }

  maybeUnlockFragments(progress, messages)
  const shadowEssenceBonus = maybeApplySmallReward(progress, event, messages)
  const ownedShadows = maybeMarkShadow(progress, event, snapshot.ownedShadows, messages)

  // Echo 공명도 변화에 따른 단서 및 조각 주입 트리거
  const prevEcho = currentProgress?.hiddenAffinity?.echo ?? 0
  const nextEcho = hiddenAffinity.echo ?? 0
  const loopCount = counters.loopCount ?? 0

  let updatedProgress = progress
  
  if (prevEcho < 1 && nextEcho >= 1) {
    const emitRes = emitWorldSignal(updatedProgress, 'echo_faint_footstep')
    updatedProgress = emitRes.progress
    if (emitRes.signal) {
      const isRepeated = loopCount >= 1
      messages.push({
        kind: 'secret',
        title: emitRes.signal.title,
        lines: [
          emitRes.signal.body,
          isRepeated ? `(잔류하는 위화감 속에 '반복되는 역사의 결'이 스쳐 지나갑니다...)` : ''
        ].filter(Boolean),
      })
    }
  } else if (prevEcho < 15 && nextEcho >= 15) {
    const emitRes = emitWorldSignal(updatedProgress, 'echo_clear_predecessor')
    updatedProgress = emitRes.progress
    if (emitRes.signal) {
      messages.push({
        kind: 'secret',
        title: emitRes.signal.title,
        lines: [emitRes.signal.body],
      })
    }
    unlockSecretOnce(updatedProgress, 'echo-trace-a')
  } else if (prevEcho < 40 && nextEcho >= 40) {
    const emitRes = emitWorldSignal(updatedProgress, 'echo_severe_angel_will')
    updatedProgress = emitRes.progress
    if (emitRes.signal) {
      messages.push({
        kind: 'secret',
        title: emitRes.signal.title,
        lines: [emitRes.signal.body],
      })
    }
    unlockSecretOnce(updatedProgress, 'echo-trace-b')
  }

  // -------------------------------------------------------------
  // 미스터리 진행도 및 트리거 평가
  // -------------------------------------------------------------
  let mysteryTriggered = updatedProgress.mysteryTriggered ?? false
  let mysteryActionCount = updatedProgress.mysteryActionCount ?? 0
  const activeVariantId = updatedProgress.mysteryVariantId
  const activeVariant = MYSTERY_VARIANTS.find(v => v.id === activeVariantId)

  let bonusEssence = 0
  let finalProgress = updatedProgress

  if (!mysteryTriggered && activeVariant) {
    if (activeVariant.checkTrigger(event, snapshot)) {
      mysteryTriggered = true
      bonusEssence += activeVariant.rewardBonus
      messages.push({
        kind: 'secret',
        title: activeVariant.rewardTitle,
        lines: activeVariant.rewardLines
      })
    } else {
      if (event.context !== 'echo') {
        mysteryActionCount += 1
      }
    }
  }

  if (!mysteryTriggered && activeVariant) {
    const clueThresholds = [2, 4, 6, 8, 10, 12, 14, 16]
    for (let i = 0; i < clueThresholds.length; i++) {
      if (mysteryActionCount >= clueThresholds[i]) {
        const clueId = activeVariant.clues[i]
        if (clueId && (!finalProgress.worldSignals?.discoveredSignalIds.includes(clueId))) {
          const emitRes = emitWorldSignal(finalProgress, clueId as any)
          finalProgress = emitRes.progress
          if (emitRes.signal) {
            messages.push({
              kind: 'secret',
              title: emitRes.signal.title,
              lines: [emitRes.signal.body]
            })
          }
        }
      }
    }
  }

  finalProgress.mysteryTriggered = mysteryTriggered
  finalProgress.mysteryActionCount = mysteryActionCount
  finalProgress.mysteryVariantId = activeVariantId

  return { progress: finalProgress, messages, shadowEssenceBonus: shadowEssenceBonus + bonusEssence, ownedShadows }
}

export const getSecretVisibleFragments = (progress: SecretProgressState | undefined): string[] =>
  unionStrings(
    progress?.unlockedFragments,
    progress?.unlocked?.filter(id => id.includes('trace'))
  ).slice(-3)

export const resetSecretProgressOnLoop = (
  currentProgress: SecretProgressState | undefined
): SecretProgressState => {
  const next = blankProgress()
  const prevLoop = currentProgress?.counters?.loopCount ?? 0
  const nextLoop = prevLoop + 1

  // 회차 수 및 엔딩 관련 영구 플래그 보존
  const prevFlags = currentProgress?.flags ?? {}
  const nextFlags: Record<string, boolean> = {}

  if (prevFlags.trueEndingReached) nextFlags.trueEndingReached = true
  if (prevFlags.surfaceEndingReached) nextFlags.surfaceEndingReached = true
  if (prevFlags.loopEndingReached) nextFlags.loopEndingReached = true

  next.flags = nextFlags

  // counters 보존
  next.counters = {
    ...next.counters,
    loopCount: nextLoop,
    trueEndingReached: prevFlags.trueEndingReached ? 1 : 0,
    surfaceEndingReached: prevFlags.surfaceEndingReached ? 1 : 0,
    loopEndingReached: prevFlags.loopEndingReached ? 1 : 0,
  }
  next.signals = {
    ...next.signals,
    loopCount: nextLoop,
    trueEndingReached: prevFlags.trueEndingReached ? 1 : 0,
    surfaceEndingReached: prevFlags.surfaceEndingReached ? 1 : 0,
    loopEndingReached: prevFlags.loopEndingReached ? 1 : 0,
  }

  // 회귀 시 직전 배정 변형 제외하고 새 변형 배정
  const lastVariantId = currentProgress?.mysteryVariantId
  next.prevMysteryVariantId = lastVariantId
  next.mysteryVariantId = pickRandomMysteryVariantId(lastVariantId)
  next.mysteryTriggered = false
  next.mysteryActionCount = 0

  return next
}
