import { useMemo, useState } from 'react'
import { Bug, DatabaseZap, RotateCcw, ShieldCheck, Sparkles, Wand2 } from 'lucide-react'
import { useGame } from '../lib/store'
import { todayISO, todayKey } from '../lib/game'
import {
  SHADOW_DEFINITIONS,
  SHADOW_FRAGMENT_SUMMON_COST,
  createOwnedShadow,
  createShadowSummonTicket,
} from '../lib/shadows'
import { createShadowExpeditionForDate } from '../lib/shadowExpeditions'
import type {
  OwnedShadow,
  RewardBox,
  ShadowDefinition,
  ShadowExpedition,
  ShadowInnateGrade,
  ShadowRarity,
  ShadowRole,
  ShadowSummonShardType,
  ShadowSummonTicket,
} from '../lib/types'

const STORAGE_KEY = 'levelup-save'
const QA_BACKUP_KEY = 'levelup-save-before-qa'
const CURRENT_PERSIST_VERSION = 14
const QA_SHADOW_PREFIX = 'qa-shadow-'
const QA_TICKET_PREFIX = 'qa-ticket-'
const QA_BOX_PREFIX = 'qa-box-'

type GameState = ReturnType<typeof useGame.getState>

type QaShadowPreset = {
  definitionId: string
  fallback: { role: ShadowRole; rarity?: ShadowRarity }
  grade: ShadowInnateGrade
  level: number
  xp: number
  enhancementLevel: number
  favorite?: boolean
  locked?: boolean
  evolvedFromDefinitionId?: string
}

const QA_SHADOW_PRESETS: QaShadowPreset[] = [
  { definitionId: 'shadow-rat', fallback: { role: 'scout', rarity: 'common' }, grade: 'C', level: 10, xp: 0, enhancementLevel: 2, favorite: true },
  { definitionId: 'shadow-sentry', fallback: { role: 'guard', rarity: 'common' }, grade: 'C', level: 7, xp: 6, enhancementLevel: 0, locked: true },
  { definitionId: 'rift-fang', fallback: { role: 'assault', rarity: 'uncommon' }, grade: 'B', level: 11, xp: 4, enhancementLevel: 2 },
  { definitionId: 'rift-librarian', fallback: { role: 'analyst', rarity: 'rare' }, grade: 'A', level: 16, xp: 12, enhancementLevel: 3 },
  { definitionId: 'minute-caller', fallback: { role: 'support', rarity: 'rare' }, grade: 'A', level: 13, xp: 8, enhancementLevel: 2, favorite: true },
  { definitionId: 'greed-devourer', fallback: { role: 'hunter', rarity: 'epic' }, grade: 'S', level: 19, xp: 14, enhancementLevel: 5, evolvedFromDefinitionId: 'mirror-hunter' },
  { definitionId: 'rift-gladiator', fallback: { role: 'assault', rarity: 'epic' }, grade: 'S', level: 22, xp: 18, enhancementLevel: 5, favorite: true, evolvedFromDefinitionId: 'rift-trainee' },
  { definitionId: 'kasim-analyst', fallback: { role: 'analyst', rarity: 'legendary' }, grade: 'S', level: 24, xp: 20, enhancementLevel: 5, locked: true },
]

const QA_SHARD_TARGETS: Record<ShadowSummonShardType, number> = {
  normal: 14,
  rare: 12,
  named: 22,
  achievement_named: 34,
}

const QA_FRAGMENT_TARGETS = ['shadow-rat', 'rift-mender', 'black-claw', 'sloth-knight']

const makeRng = (seed: number) => {
  let nextSeed = seed
  return () => {
    const value = Math.sin(nextSeed++) * 10000
    return value - Math.floor(value)
  }
}

const publicDefinitionPool = () =>
  SHADOW_DEFINITIONS.filter(def => !def.hiddenUntilObtained && def.sourceType !== 'gate_named')

const pickDefinition = (preset: QaShadowPreset): ShadowDefinition => {
  const explicit = SHADOW_DEFINITIONS.find(def => def.id === preset.definitionId && !def.hiddenUntilObtained)
  if (explicit) return explicit
  const pool = publicDefinitionPool()
  return (
    pool.find(def => def.role === preset.fallback.role && def.rarity === preset.fallback.rarity) ??
    pool.find(def => def.role === preset.fallback.role) ??
    pool[0]
  )
}

const buildQaShadows = (): OwnedShadow[] => {
  const createdAt = todayISO()
  return QA_SHADOW_PRESETS.map((preset, index) => {
    const definition = pickDefinition(preset)
    const shadow = createOwnedShadow(definition, makeRng(100 + index), { innateGrade: preset.grade })
    return {
      ...shadow,
      instanceId: `${QA_SHADOW_PREFIX}${index + 1}-${definition.id}`,
      obtainedAt: createdAt,
      level: preset.level,
      xp: preset.xp,
      enhancementLevel: preset.enhancementLevel,
      absorbedCount: preset.enhancementLevel,
      isFavorite: preset.favorite,
      isLocked: preset.locked,
      evolutionStage: preset.evolvedFromDefinitionId ? 1 : undefined,
      evolvedFromDefinitionId: preset.evolvedFromDefinitionId,
    }
  })
}

const buildQaTickets = (): ShadowSummonTicket[] => [
  { ...createShadowSummonTicket({ ticketType: 'normal_shadow', source: 'system', label: 'QA 일반 그림자 소환권' }), id: `${QA_TICKET_PREFIX}normal` },
  { ...createShadowSummonTicket({ ticketType: 'rare_shadow', source: 'system', label: 'QA 희귀 그림자 소환권', rarityFloor: 'rare' }), id: `${QA_TICKET_PREFIX}rare` },
  { ...createShadowSummonTicket({ ticketType: 'role_shadow', source: 'system', label: 'QA 수비 역할 소환권', role: 'guard' }), id: `${QA_TICKET_PREFIX}role-guard` },
  { ...createShadowSummonTicket({ ticketType: 'gate_named_shadow', source: 'system', label: 'QA 게이트 네임드 소환권' }), id: `${QA_TICKET_PREFIX}gate-named` },
  { ...createShadowSummonTicket({ ticketType: 'achievement_named_shadow', source: 'system', label: 'QA 성취 네임드 소환권', grade: 'elite' }), id: `${QA_TICKET_PREFIX}achievement-named` },
]

const buildQaRewardBox = (): RewardBox => ({
  id: `${QA_BOX_PREFIX}shadow-reward`,
  type: 'daily',
  tier: 'epic',
  source: 'daily_login',
  createdAt: todayISO(),
  status: 'available',
  label: `${todayKey()} QA 그림자 보상 상자`,
  reward: {
    hunterXp: 120,
    shadowEssence: 35,
    shadowSummonTickets: [
      { ...createShadowSummonTicket({ ticketType: 'normal_shadow', source: 'reward_box', label: 'QA 보상 일반 소환권' }), id: `${QA_TICKET_PREFIX}box-normal` },
    ],
    shadowSummonShards: { normal: 6, rare: 4 },
    shadowFragments: [{ definitionId: 'black-claw', amount: 6 }],
    message: 'QA 보상 상자',
  },
})

const buildQaExpedition = (partyIds: string[]): ShadowExpedition => {
  const now = Date.now()
  const base = createShadowExpeditionForDate(todayKey())
  return {
    ...base,
    status: 'in_progress',
    selectedShadowIds: partyIds.slice(0, 5),
    progress: 28,
    risk: 18,
    turn: 1,
    currentPhase: 'deploy',
    phaseHistory: [
      { phase: 'muster', enteredAt: now - 2400 },
      { phase: 'deploy', enteredAt: now - 800 },
    ],
    logs: [
      {
        id: 'qa-expedition-created',
        turn: 0,
        type: 'system',
        phase: 'muster',
        message: 'QA 작전 화면 검증용 원정대가 편성되었습니다.',
      },
      {
        id: 'qa-expedition-scout',
        turn: 1,
        type: 'command',
        phase: 'deploy',
        command: 'scout',
        actorShadowId: partyIds[0],
        message: '정찰 명령으로 균열 너머의 안전한 진입각을 확보했습니다.',
      },
    ],
    eventTriggered: false,
    eventResolved: false,
    midEvent: undefined,
  }
}

const buildQaMidEvent = () => ({
  id: 'qa-expedition-mid-event',
  type: 'any' as const,
  phase: 'threshold' as const,
  title: '흔들리는 균열선',
  description: '원정대가 미세한 뒤틀림을 확인했다. 짧은 판단으로 경로를 고정해야 한다.',
  choices: [
    {
      id: 'stabilize',
      label: '방어선 고정',
      description: '전열을 세워 위험을 낮춘다.',
      riskDelta: -8,
      progressDelta: 4,
      preferredRoles: ['guard', 'support'] as ShadowRole[],
      log: '그림자가 균열 너머의 흔적을 감지하고 방어선을 고정했다.',
    },
    {
      id: 'trace',
      label: '잔향 추적',
      description: '측면 경로를 따라 진행도를 끌어올린다.',
      riskDelta: 5,
      progressDelta: 12,
      preferredRoles: ['scout', 'hunter'] as ShadowRole[],
      log: '원정대가 미세한 뒤틀림을 확인하고 진입 경로를 갱신했다.',
    },
    {
      id: 'record',
      label: '기록 분석',
      description: '흐름을 기록해 다음 명령의 흔들림을 줄인다.',
      riskDelta: -3,
      progressDelta: 7,
      searchStackDelta: 1,
      preferredRoles: ['analyst', 'support'] as ShadowRole[],
      log: '군단 보고서에 알 수 없는 잔향이 기록되었다.',
    },
  ],
})

const mergeAtLeast = <T extends string>(
  current: Partial<Record<T, number>> | undefined,
  target: Record<T, number>,
): Partial<Record<T, number>> => {
  const next: Partial<Record<T, number>> = { ...(current ?? {}) }
  for (const [key, value] of Object.entries(target) as Array<[T, number]>) {
    next[key] = Math.max(next[key] ?? 0, value)
  }
  return next
}

const mergeRecordAtLeast = (
  current: Record<string, number> | undefined,
  target: Record<string, number>,
): Record<string, number> => {
  const next: Record<string, number> = { ...(current ?? {}) }
  for (const [key, value] of Object.entries(target)) {
    next[key] = Math.max(next[key] ?? 0, value)
  }
  return next
}

const withQaShadows = (state: GameState) => {
  const qaShadows = buildQaShadows()
  const qaIds = qaShadows.map(shadow => shadow.instanceId)
  const ownedShadows = [
    ...(state.ownedShadows ?? []).filter(shadow => !shadow.instanceId.startsWith(QA_SHADOW_PREFIX)),
    ...qaShadows,
  ]
  const equippedShadowIds = [
    ...(state.equippedShadowIds ?? []).filter(id => !id.startsWith(QA_SHADOW_PREFIX)),
    ...qaIds.slice(0, 5),
  ]
  return { qaShadows, qaIds, ownedShadows, equippedShadowIds }
}

const injectQaState = (state: GameState, mode: 'all' | 'summon' | 'expedition' | 'event'): Partial<GameState> => {
  const withShadows = withQaShadows(state)
  const tickets = buildQaTickets()
  const fragmentTargets = Object.fromEntries(
    QA_FRAGMENT_TARGETS.map(definitionId => {
      const definition = SHADOW_DEFINITIONS.find(def => def.id === definitionId)
      const amount = definition ? SHADOW_FRAGMENT_SUMMON_COST[definition.rarity] + 4 : 24
      return [definitionId, amount]
    }),
  )
  const basePatch: Partial<GameState> = {
    messages: [
      ...(state.messages ?? []),
      {
        id: `qa-message-${Date.now()}`,
        kind: 'info',
        title: 'QA 테스트 상태',
        lines: ['개발 환경에서 그림자 UI 검증용 상태를 주입했습니다.', '기존 저장값은 levelup-save-before-qa 키에 백업됩니다.'],
        createdAt: todayISO(),
      },
    ],
  }

  if (mode === 'summon') {
    return {
      ...basePatch,
      shadowEssence: Math.max(state.shadowEssence ?? 0, 180),
      shadowSummonTickets: [
        ...(state.shadowSummonTickets ?? []).filter(ticket => !ticket.id.startsWith(QA_TICKET_PREFIX)),
        ...tickets,
      ],
      shadowSummonShards: mergeAtLeast(state.shadowSummonShards, QA_SHARD_TARGETS),
      shadowFragments: mergeRecordAtLeast(state.shadowFragments, fragmentTargets),
    }
  }

  const qaExpedition = buildQaExpedition(withShadows.qaIds)
  const expeditionId = qaExpedition.id
  const nextExpeditions = [
    qaExpedition,
    ...(state.shadowExpeditions ?? []).filter(expedition => expedition.id !== expeditionId),
  ].slice(0, 14)

  if (mode === 'expedition') {
    return {
      ...basePatch,
      ownedShadows: withShadows.ownedShadows,
      equippedShadowIds: withShadows.equippedShadowIds,
      shadowEssence: Math.max(state.shadowEssence ?? 0, 180),
      shadowExpeditions: nextExpeditions,
      activeShadowExpeditionId: expeditionId,
      lastShadowExpeditionDate: todayKey(),
    }
  }

  if (mode === 'event') {
    const targetId =
      state.activeShadowExpeditionId ??
      (state.shadowExpeditions ?? []).find(expedition => expedition.status === 'in_progress')?.id ??
      expeditionId
    const sourceExpeditions = targetId === expeditionId ? nextExpeditions : state.shadowExpeditions ?? []
    return {
      ...basePatch,
      ownedShadows: withShadows.ownedShadows,
      equippedShadowIds: withShadows.equippedShadowIds,
      shadowExpeditions: sourceExpeditions.map(expedition =>
        expedition.id === targetId
          ? {
              ...expedition,
              status: 'in_progress' as const,
              selectedShadowIds: expedition.selectedShadowIds.length ? expedition.selectedShadowIds : withShadows.qaIds.slice(0, 5),
              currentPhase: 'threshold' as const,
              eventTriggered: true,
              eventResolved: false,
              midEvent: buildQaMidEvent(),
              logs: [
                ...expedition.logs,
                {
                  id: `qa-expedition-event-${Date.now()}`,
                  turn: expedition.turn,
                  type: 'event' as const,
                  phase: 'threshold' as const,
                  actorShadowId: withShadows.qaIds[3],
                  message: '그림자가 균열 너머의 흔적을 감지했다.',
                },
              ],
            }
          : expedition,
      ),
      activeShadowExpeditionId: targetId,
      lastShadowExpeditionDate: todayKey(),
    }
  }

  return {
    ...basePatch,
    ownedShadows: withShadows.ownedShadows,
    equippedShadowIds: withShadows.equippedShadowIds,
    shadowEssence: Math.max(state.shadowEssence ?? 0, 180),
    shadowSummonTickets: [
      ...(state.shadowSummonTickets ?? []).filter(ticket => !ticket.id.startsWith(QA_TICKET_PREFIX)),
      ...tickets,
    ],
    shadowSummonShards: mergeAtLeast(state.shadowSummonShards, QA_SHARD_TARGETS),
    shadowFragments: mergeRecordAtLeast(state.shadowFragments, fragmentTargets),
    shadowExpeditions: nextExpeditions,
    activeShadowExpeditionId: expeditionId,
    lastShadowExpeditionDate: todayKey(),
    rewardBoxes: [
      buildQaRewardBox(),
      ...(state.rewardBoxes ?? []).filter(box => !box.id.startsWith(QA_BOX_PREFIX)),
    ],
  }
}

const backupCurrentSave = (state: GameState) => {
  const rawSave = window.localStorage.getItem(STORAGE_KEY)
  if (rawSave) {
    window.localStorage.setItem(QA_BACKUP_KEY, rawSave)
    return
  }
  const { manualBattleSession: _manualBattleSession, ...persistedState } = state
  window.localStorage.setItem(QA_BACKUP_KEY, JSON.stringify({ state: persistedState, version: CURRENT_PERSIST_VERSION }))
}

export function DevQaPanel({ onOpenShadows }: { onOpenShadows?: () => void }) {
  const [lastAction, setLastAction] = useState<string>()
  const [hasBackup, setHasBackup] = useState(() => Boolean(window.localStorage.getItem(QA_BACKUP_KEY)))
  const ownedCount = useGame(s => s.ownedShadows?.length ?? 0)
  const ticketCount = useGame(s => (s.shadowSummonTickets ?? []).filter(ticket => !ticket.usedAt).length)
  const expedition = useGame(s => (s.shadowExpeditions ?? []).find(item => item.id === s.activeShadowExpeditionId))
  const summary = useMemo(() => {
    const status = expedition?.status ?? 'none'
    return `${ownedCount} shadows / ${ticketCount} tickets / expedition ${status}`
  }, [expedition?.status, ownedCount, ticketCount])

  if (!import.meta.env.DEV) return null

  const applyPreset = (mode: 'all' | 'summon' | 'expedition' | 'event', label: string) => {
    const ok = window.confirm(
      `${label}\n\n현재 개발 저장 상태를 ${QA_BACKUP_KEY}에 백업한 뒤 QA 데이터를 주입합니다. production 자동 주입은 없습니다. 계속할까요?`,
    )
    if (!ok) return
    const currentState = useGame.getState()
    backupCurrentSave(currentState)
    setHasBackup(Boolean(window.localStorage.getItem(QA_BACKUP_KEY)))
    useGame.setState(state => injectQaState(state, mode))
    setLastAction(`${label} 완료 (${new Date().toLocaleTimeString()})`)
    if (mode !== 'summon') onOpenShadows?.()
  }

  const restoreBackup = () => {
    const backup = window.localStorage.getItem(QA_BACKUP_KEY)
    if (!backup) return
    const ok = window.confirm(`${QA_BACKUP_KEY}에 저장된 백업을 ${STORAGE_KEY}로 복원하고 화면을 새로고침합니다. 계속할까요?`)
    if (!ok) return
    window.localStorage.setItem(STORAGE_KEY, backup)
    window.location.reload()
  }

  return (
    <section className="panel corner-bracket overflow-hidden border-amber-300/25 bg-amber-400/5 p-3">
      <div className="br" />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded border border-amber-300/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-100 system-text">
              <Bug className="h-3 w-3" />
              DEV QA
            </span>
            <span className="text-[11px] text-white/45 system-text">{summary}</span>
          </div>
          <p className="text-xs leading-relaxed text-white/55">
            그림자 UI, 소환 reveal, 보상 상자, 원정 작전 화면 검증용 테스트 상태를 명시 클릭으로만 주입합니다.
          </p>
          {lastAction && <div className="mt-1 text-[11px] text-emerald-200/75">{lastAction}</div>}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
          <button type="button" className="btn btn-primary text-xs" onClick={() => applyPreset('all', 'QA: 그림자 테스트 상태 주입')}>
            <DatabaseZap className="h-3.5 w-3.5" />
            그림자 테스트 상태
          </button>
          <button type="button" className="btn text-xs" onClick={() => applyPreset('summon', 'QA: 소환권/조각 주입')}>
            <Sparkles className="h-3.5 w-3.5" />
            소환권/조각
          </button>
          <button type="button" className="btn text-xs" onClick={() => applyPreset('expedition', 'QA: 원정 테스트 파티 구성')}>
            <ShieldCheck className="h-3.5 w-3.5" />
            원정 파티
          </button>
          <button type="button" className="btn btn-ghost text-xs" onClick={() => applyPreset('event', 'QA: 원정 이벤트 표시')}>
            <Wand2 className="h-3.5 w-3.5" />
            원정 이벤트
          </button>
          {hasBackup && (
            <button type="button" className="btn btn-ghost text-xs text-rose-100/85" onClick={restoreBackup}>
              <RotateCcw className="h-3.5 w-3.5" />
              백업 복원
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
