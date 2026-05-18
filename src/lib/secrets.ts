import type {
  OwnedShadow,
  RewardBox,
  SecretProgressState,
  ShadowExpedition,
  SystemMessage,
} from './types'

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

export type SecretContext = 'tower' | 'gate' | 'expedition' | 'shadow' | 'box' | 'rank'

export type SecretEvent =
  | { context: 'tower'; outcome: 'victory' | 'defeat' | 'draw'; floor: number; firstClear?: boolean; boss?: boolean }
  | { context: 'gate'; outcome: 'victory' | 'defeat' | 'draw' }
  | { context: 'expedition'; outcome: 'great_success' | 'success' | 'partial' | 'failure'; expeditionType?: string; shadowIds?: string[] }
  | { context: 'shadow'; action: 'extract'; success: boolean; named?: boolean }
  | { context: 'shadow'; action: 'evolve'; shadowInstanceId?: string }
  | { context: 'box'; boxType?: string; source?: string }
  | { context: 'rank'; leveledUp?: boolean; rankChanged?: boolean; skillUses?: number; challengeCardsCompleted?: number }

export type SecretEventResult = {
  progress: SecretProgressState
  messages: Array<Omit<SystemMessage, 'id' | 'createdAt'>>
  shadowEssenceBonus: number
  ownedShadows?: OwnedShadow[]
}

const blankProgress = (): SecretProgressState => ({
  initializedAt: new Date().toISOString(),
  flags: {},
  counters: {},
  lastSignals: {},
  discoveredHints: [],
  unlockedFragments: [],
  hiddenAffinity: {},
  sealedRewards: {},
})

const count = (progress: SecretProgressState, key: string): number => progress.counters?.[key] ?? 0
const hasFlag = (progress: SecretProgressState, key: string): boolean => progress.flags?.[key] === true
const hasHint = (progress: SecretProgressState, key: string): boolean => progress.discoveredHints?.includes(key) ?? false
const hasFragment = (progress: SecretProgressState, key: string): boolean => progress.unlockedFragments?.includes(key) ?? false
const hasReward = (progress: SecretProgressState, key: string): boolean => progress.sealedRewards?.[key] === true

const bump = (target: Record<string, number>, key: string, amount = 1) => {
  target[key] = (target[key] ?? 0) + amount
}

const max = (target: Record<string, number>, key: string, value: number) => {
  target[key] = Math.max(target[key] ?? 0, value)
}

const boolCount = (record: Record<number, boolean> | undefined): number =>
  Object.values(record ?? {}).filter(Boolean).length

export const createInitialSecretProgress = (snapshot: SecretSnapshot = {}): SecretProgressState => {
  const progress = blankProgress()
  const counters = progress.counters as Record<string, number>
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

  return progress
}

export const ensureSecretProgress = (
  progress: SecretProgressState | undefined,
  snapshot: SecretSnapshot = {}
): SecretProgressState => {
  if (!progress) return createInitialSecretProgress(snapshot)
  return {
    initializedAt: progress.initializedAt ?? new Date().toISOString(),
    flags: progress.flags ?? {},
    counters: progress.counters ?? {},
    lastSignals: progress.lastSignals ?? {},
    discoveredHints: progress.discoveredHints ?? [],
    unlockedFragments: progress.unlockedFragments ?? [],
    hiddenAffinity: progress.hiddenAffinity ?? {},
    sealedRewards: progress.sealedRewards ?? {},
  }
}

const hintFor = (progress: SecretProgressState, context: SecretContext): string | undefined => {
  const options: Record<SecretContext, Array<{ id: string; min: number; text: string }>> = {
    tower: [
      { id: 'tower-line-1', min: 1, text: '탑의 기록이 아주 짧게 진동했다.' },
      { id: 'tower-line-2', min: 3, text: '발밑의 층계가 이전 전투의 흔적을 기억하는 듯하다.' },
    ],
    gate: [
      { id: 'gate-line-1', min: 2, text: '협회 단말에 출처를 알 수 없는 짧은 보고가 남았다.' },
      { id: 'gate-line-2', min: 5, text: '균열 너머에서 탑과 닮은 압력이 스쳐 지나갔다.' },
    ],
    expedition: [
      { id: 'expedition-line-1', min: 1, text: '귀환 보고서 끝에 읽을 수 없는 검은 인장이 찍혔다.' },
      { id: 'expedition-line-2', min: 4, text: '그림자들이 같은 방향으로 고개를 숙였다.' },
    ],
    shadow: [
      { id: 'shadow-line-1', min: 2, text: '추출의 잔향이 평소보다 오래 손끝에 남았다.' },
      { id: 'shadow-line-2', min: 6, text: '몇몇 그림자가 이름 없는 명령을 기다리는 듯하다.' },
    ],
    box: [
      { id: 'box-line-1', min: 1, text: '상자 안쪽에 사라지는 문양이 잠깐 떠올랐다.' },
      { id: 'box-line-2', min: 3, text: '보상 기록 사이에 낯선 여백이 생겼다.' },
    ],
    rank: [
      { id: 'rank-line-1', min: 1, text: '시스템 평가 뒤편에서 다른 기준이 함께 움직였다.' },
      { id: 'rank-line-2', min: 2, text: '성장의 기록이 세 방향으로 갈라졌다가 다시 합쳐졌다.' },
    ],
  }

  const contextCount = count(progress, `${context}_signals`)
  return options[context].find(item => contextCount >= item.min && !hasHint(progress, item.id))?.id
}

const hintText: Record<string, string> = {
  'tower-line-1': '탑의 기록이 아주 짧게 진동했다.',
  'tower-line-2': '발밑의 층계가 이전 전투의 흔적을 기억하는 듯하다.',
  'gate-line-1': '협회 단말에 출처를 알 수 없는 짧은 보고가 남았다.',
  'gate-line-2': '균열 너머에서 탑과 닮은 압력이 스쳐 지나갔다.',
  'expedition-line-1': '귀환 보고서 끝에 읽을 수 없는 검은 인장이 찍혔다.',
  'expedition-line-2': '그림자들이 같은 방향으로 고개를 숙였다.',
  'shadow-line-1': '추출의 잔향이 평소보다 오래 손끝에 남았다.',
  'shadow-line-2': '몇몇 그림자가 이름 없는 명령을 기다리는 듯하다.',
  'box-line-1': '상자 안쪽에 사라지는 문양이 잠깐 떠올랐다.',
  'box-line-2': '보상 기록 사이에 낯선 여백이 생겼다.',
  'rank-line-1': '시스템 평가 뒤편에서 다른 기준이 함께 움직였다.',
  'rank-line-2': '성장의 기록이 세 방향으로 갈라졌다가 다시 합쳐졌다.',
}

const maybeUnlockFragments = (
  progress: SecretProgressState,
  messages: Array<Omit<SystemMessage, 'id' | 'createdAt'>>
) => {
  const fragments = progress.unlockedFragments ?? []
  const add = (id: string) => {
    if (hasFragment(progress, id)) return
    fragments.push(id)
    messages.push({
      kind: 'info',
      title: '기록의 여백',
      lines: ['읽을 수 없는 기록 조각이 조용히 남았다.'],
    })
  }

  if (count(progress, 'tower_highest_milestone') >= 10) add('tower-trace-a')
  if (count(progress, 'tower_boss_clears') >= 3) add('tower-trace-b')
  if (count(progress, 'gate_clears') >= 4) add('gate-trace-a')
  if (count(progress, 'gate_extractions_success') >= 3) add('gate-trace-b')
  if (count(progress, 'expedition_success') >= 4) add('expedition-trace-a')
  if (count(progress, 'expedition_great_success') >= 2) add('expedition-trace-b')
  if (count(progress, 'shadows_evolved') >= 1) add('shadow-trace-a')
  if (count(progress, 'shadows_reached_level_threshold') >= 2) add('shadow-trace-b')
  if (
    count(progress, 'tower_boss_clears') >= 2 &&
    count(progress, 'gate_extractions_success') >= 2 &&
    count(progress, 'expedition_success') >= 3
  ) {
    add('cross-trace-a')
  }

  progress.unlockedFragments = fragments
}

const maybeApplySmallReward = (
  progress: SecretProgressState,
  event: SecretEvent,
  messages: Array<Omit<SystemMessage, 'id' | 'createdAt'>>
): number => {
  if (event.context === 'tower' && event.outcome === 'victory' && event.boss && !hasReward(progress, `tower-${event.floor}`)) {
    if (count(progress, 'tower_boss_clears') >= 2 && count(progress, 'expedition_success') >= 2) {
      progress.sealedRewards = { ...(progress.sealedRewards ?? {}), [`tower-${event.floor}`]: true }
      messages.push({ kind: 'info', title: '희미한 공명', lines: ['보상 사이에 작은 잔향이 더해졌다.'] })
      return 1
    }
  }

  if (event.context === 'expedition' && event.outcome === 'great_success' && !hasReward(progress, `expedition-${count(progress, 'expedition_great_success')}`)) {
    if (count(progress, 'gate_clears') >= 3) {
      progress.sealedRewards = { ...(progress.sealedRewards ?? {}), [`expedition-${count(progress, 'expedition_great_success')}`]: true }
      messages.push({ kind: 'shadow', title: '조용한 회수', lines: ['귀환한 그림자가 작은 잔재를 바쳤다.'] })
      return 1
    }
  }

  if (event.context === 'box' && event.boxType === 'boss' && !hasReward(progress, `box-${count(progress, 'boss_boxes_opened')}`)) {
    if (count(progress, 'tower_highest_milestone') >= 10 && count(progress, 'gate_extractions_attempted') >= 2) {
      progress.sealedRewards = { ...(progress.sealedRewards ?? {}), [`box-${count(progress, 'boss_boxes_opened')}`]: true }
      messages.push({ kind: 'info', title: '상자의 잔향', lines: ['상자 바닥에 남은 빛이 정수로 가라앉았다.'] })
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
    return { ...shadow, secretTraits: [...secretTraits, 'silent-oath'] }
  })
  if (!changed) return undefined

  progress.sealedRewards = { ...(progress.sealedRewards ?? {}), [`shadow-mark-${event.shadowInstanceId}`]: true }
  messages.push({ kind: 'shadow', title: '낯선 흔적', lines: ['그림자 하나가 말없이 새로운 흔적을 받아들였다.'] })
  return next
}

export const recordSecretEvent = (
  currentProgress: SecretProgressState | undefined,
  event: SecretEvent,
  snapshot: SecretSnapshot = {}
): SecretEventResult => {
  const progress = ensureSecretProgress(currentProgress, snapshot)
  const counters = { ...(progress.counters ?? {}) }
  const hiddenAffinity = { ...(progress.hiddenAffinity ?? {}) }
  const messages: Array<Omit<SystemMessage, 'id' | 'createdAt'>> = []

  bump(counters, `${event.context}_signals`)
  bump(hiddenAffinity, event.context, 1)

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
      if (event.named) bump(counters, 'gate_named_shadows_obtained')
    }
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

  progress.counters = counters
  progress.hiddenAffinity = hiddenAffinity
  progress.lastSignals = { ...(progress.lastSignals ?? {}), [event.context]: new Date().toISOString() }

  const hintId = hintFor(progress, event.context)
  if (hintId) {
    progress.discoveredHints = [...(progress.discoveredHints ?? []), hintId]
    messages.push({ kind: 'info', title: '이상한 신호', lines: [hintText[hintId]] })
  }

  maybeUnlockFragments(progress, messages)
  const shadowEssenceBonus = maybeApplySmallReward(progress, event, messages)
  const ownedShadows = maybeMarkShadow(progress, event, snapshot.ownedShadows, messages)

  return { progress, messages, shadowEssenceBonus, ownedShadows }
}

export const getSecretVisibleFragments = (progress: SecretProgressState | undefined): string[] =>
  (progress?.unlockedFragments ?? []).slice(-3)
