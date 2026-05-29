import type {
  Category,
  ChallengeCard,
  GateEchoCategory,
  GateEchoState,
  HardcoreState,
  HunterState,
  Quest,
} from './types'
import type { BattleActionDefinition, BattleTargetType, BattleUnit } from './directBattleTypes'
import type { DirectBattleMonsterDefinition, DirectBattleMonsterRole, DirectBattleMonsterTargetPriority } from './directBattleMonsters'
import { buildMonsterBattleUnit } from './battleUnits'

export const HARDCORE_BACKUP_KEY = 'levelup-save-hardcore-backup'
export const MAX_GATE_ECHO_HISTORY = 12

export type MajorActionType =
  | 'gate'
  | 'tower'
  | 'promotion_exam'
  | 'red_gate'
  | 'expedition'
  | 'reward_claim'
  | 'focus'
  | 'daily'
  | 'echo_battle'
  | 'restore_shadow'

export const createInitialHardcoreState = (now = Date.now()): HardcoreState => ({
  enabled: true,
  enabledAt: now,
  gateEchoes: [],
  worldThreat: 0,
  deathCount: 0,
})

export const ensureHardcoreState = (state?: HardcoreState): HardcoreState => ({
  ...createInitialHardcoreState(),
  ...(state ?? {}),
  gateEchoes: Array.isArray(state?.gateEchoes) ? state.gateEchoes : [],
  worldThreat: clamp(state?.worldThreat ?? 0, 0, 100),
  deathCount: Math.max(0, state?.deathCount ?? 0),
})

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))

const dateOf = (iso?: string): string | undefined =>
  iso ? iso.slice(0, 10) : undefined

const action = (
  actionId: string,
  label: string,
  effectKind: BattleActionDefinition['effectKind'],
  actionCue: string,
  targetType: BattleTargetType = 'single_enemy',
  basePriority = 0,
  cooldown = 0,
  effectColor = 'slate',
): BattleActionDefinition => ({
  actionId,
  label,
  actionType: effectKind === 'basic' ? 'basic' : effectKind === 'guard' ? 'guard' : effectKind === 'support' ? 'support' : 'skill',
  targetType,
  effectKind,
  basePriority,
  cooldown,
  actionCue,
  animationCue: actionCue,
  effectColor,
})

export const gateEchoCategoryLabel: Record<GateEchoCategory, string> = {
  focus: '집중',
  study: '학습',
  work: '업무',
  exercise: '운동',
  routine: '루틴',
  cleanup: '정리',
  health: '건강',
  custom: '개인 목표',
  unknown: '미분류',
}

const categoryFromQuest = (category?: Category): GateEchoCategory => {
  switch (category) {
    case 'study':
    case 'finance':
      return 'study'
    case 'career':
    case 'challenge':
      return 'work'
    case 'workout':
      return 'exercise'
    case 'health':
      return 'health'
    case 'mind':
    case 'habit':
    case 'social':
      return 'routine'
    default:
      return 'unknown'
  }
}

const categoryFromChallenge = (card: ChallengeCard): GateEchoCategory => {
  if (card.condition.type === 'focusDuration' || card.condition.type === 'focusSessionCount' || card.condition.type === 'focusNoInterruption') {
    return 'focus'
  }
  if (card.condition.category) return categoryFromQuest(card.condition.category)
  if (card.category === 'workout') return 'exercise'
  if (card.category === 'study' || card.category === 'finance') return 'study'
  if (card.category === 'sleep' || card.category === 'habit' || card.category === 'life') return 'routine'
  if (card.category === 'gate' || card.category === 'tower' || card.category === 'shadow') return 'work'
  return 'unknown'
}

const echoTemplate: Record<GateEchoCategory, {
  monsterId: string
  name: string
  description: string
  role: DirectBattleMonsterRole
  targetPriority: DirectBattleMonsterTargetPriority
  boardLane: DirectBattleMonsterDefinition['boardLane']
  color: string
  bias: DirectBattleMonsterDefinition['statBias']
  actions: BattleActionDefinition[]
}> = {
  focus: {
    monsterId: 'gate-echo-focus',
    name: '흩어진 시선',
    description: '끝내지 못한 집중이 시야를 흐리는 잔향이 되었다.',
    role: 'assassin',
    targetPriority: 'highest_threat',
    boardLane: 'flank',
    color: 'cyan',
    bias: { hp: 1.05, atk: 1.28, def: 0.86, spd: 1.32, skill: 1.38, crit: 1.2, control: 1.25 },
    actions: [
      action('echo-focus-cut', '시선 절단', 'basic', 'assassin_stab', 'highest_threat_enemy', 1, 0, 'cyan'),
      action('echo-focus-blur', '초점 붕괴', 'control', 'caster_bolt', 'highest_threat_enemy', 2, 2, 'cyan'),
    ],
  },
  study: {
    monsterId: 'gate-echo-study',
    name: '망각의 잔향',
    description: '미뤄진 학습이 흐릿한 기억의 괴물로 돌아왔다.',
    role: 'caster',
    targetPriority: 'highest_threat',
    boardLane: 'rear',
    color: 'violet',
    bias: { hp: 1.12, atk: 0.98, def: 0.9, spd: 1.02, skill: 1.55, control: 1.35 },
    actions: [
      action('echo-study-spark', '망각 파편', 'basic', 'caster_spark', 'highest_threat_enemy', 0, 0, 'violet'),
      action('echo-study-fog', '기억 안개', 'control', 'caster_bolt', 'all_enemies', 1, 3, 'violet'),
    ],
  },
  work: {
    monsterId: 'gate-echo-work',
    name: '미완의 감시자',
    description: '끝내지 못한 과업이 차가운 시선으로 돌아왔다.',
    role: 'bruiser',
    targetPriority: 'hunter',
    boardLane: 'front',
    color: 'amber',
    bias: { hp: 1.28, atk: 1.44, def: 1.02, spd: 0.94, skill: 1.16, boss: 0.8 },
    actions: [
      action('echo-work-mark', '압박 표식', 'basic', 'bruiser_jab', 'single_enemy', 0, 0, 'amber'),
      action('echo-work-strike', '마감 강타', 'damage', 'bruiser_swing', 'single_enemy', 2, 2, 'amber'),
    ],
  },
  exercise: {
    monsterId: 'gate-echo-exercise',
    name: '무거운 사슬수',
    description: '움직이지 못한 시간이 사슬처럼 몸을 끌어내린다.',
    role: 'tank',
    targetPriority: 'frontline',
    boardLane: 'front',
    color: 'stone',
    bias: { hp: 1.78, atk: 1.04, def: 1.52, spd: 0.72, skill: 0.92, survival: 1.45 },
    actions: [
      action('echo-exercise-bash', '사슬 박치기', 'basic', 'tank_bash', 'front_lane', 0, 0, 'stone'),
      action('echo-exercise-bind', '무게의 포박', 'control', 'tank_guard', 'front_lane', 1, 2, 'stone'),
    ],
  },
  routine: {
    monsterId: 'gate-echo-routine',
    name: '심야의 균열수',
    description: '무너진 루틴이 밤의 틈에서 기어 나왔다.',
    role: 'controller',
    targetPriority: 'random_pressure',
    boardLane: 'rear',
    color: 'indigo',
    bias: { hp: 1.25, atk: 1.04, def: 1.02, spd: 1.02, skill: 1.25, control: 1.42, survival: 1.08 },
    actions: [
      action('echo-routine-scratch', '균열 할퀴기', 'basic', 'caster_spark', 'single_enemy', 0, 0, 'indigo'),
      action('echo-routine-night', '심야 침식', 'control', 'caster_bolt', 'all_enemies', 1, 3, 'indigo'),
    ],
  },
  cleanup: {
    monsterId: 'gate-echo-cleanup',
    name: '먼지 군집',
    description: '정리되지 않은 흔적들이 작은 군체가 되어 몰려든다.',
    role: 'minion',
    targetPriority: 'lowest_hp',
    boardLane: 'flank',
    color: 'zinc',
    bias: { hp: 1.02, atk: 1.08, def: 0.84, spd: 1.22, skill: 1.06, control: 1.1, synergy: 1.2 },
    actions: [
      action('echo-cleanup-swarm', '먼지 공세', 'basic', 'assassin_dash', 'all_enemies', 1, 0, 'zinc'),
      action('echo-cleanup-cling', '군집 달라붙기', 'control', 'assassin_stab', 'lowest_hp_enemy', 2, 2, 'zinc'),
    ],
  },
  health: {
    monsterId: 'gate-echo-health',
    name: '무너진 맥동체',
    description: '돌보지 못한 몸의 신호가 왜곡된 맥동으로 남았다.',
    role: 'support',
    targetPriority: 'boss_support',
    boardLane: 'front',
    color: 'emerald',
    bias: { hp: 1.48, atk: 0.92, def: 1.2, spd: 0.92, skill: 1.18, support: 1.45, survival: 1.35 },
    actions: [
      action('echo-health-pulse', '왜곡 맥동', 'basic', 'support_pulse', 'single_enemy', 0, 0, 'emerald'),
      action('echo-health-absorb', '잔향 흡수', 'support', 'support_pulse', 'lowest_hp_ally', 1, 3, 'emerald'),
    ],
  },
  custom: {
    monsterId: 'gate-echo-custom',
    name: '미해결 잔향',
    description: '분류되지 않은 미완료 기록이 게이트 잔향으로 굳어졌다.',
    role: 'bruiser',
    targetPriority: 'frontline',
    boardLane: 'front',
    color: 'slate',
    bias: { hp: 1.28, atk: 1.18, def: 1.06, spd: 1, skill: 1.12 },
    actions: [
      action('echo-custom-hit', '잔향 타격', 'basic', 'bruiser_jab', 'single_enemy', 0, 0, 'slate'),
      action('echo-custom-wave', '미해결 파동', 'damage', 'bruiser_swing', 'single_enemy', 1, 2, 'slate'),
    ],
  },
  unknown: {
    monsterId: 'gate-echo-unknown',
    name: '미해결 잔향',
    description: '분류되지 않은 미완료 기록이 게이트 잔향으로 굳어졌다.',
    role: 'bruiser',
    targetPriority: 'frontline',
    boardLane: 'front',
    color: 'slate',
    bias: { hp: 1.24, atk: 1.16, def: 1.04, spd: 1, skill: 1.1 },
    actions: [
      action('echo-unknown-hit', '잔향 타격', 'basic', 'bruiser_jab', 'single_enemy', 0, 0, 'slate'),
      action('echo-unknown-wave', '미해결 파동', 'damage', 'bruiser_swing', 'single_enemy', 1, 2, 'slate'),
    ],
  },
}

export const getActiveGateEchoes = (hardcore?: HardcoreState): GateEchoState[] =>
  ensureHardcoreState(hardcore).gateEchoes
    .filter(echo => echo.status === 'active')
    .sort((a, b) => a.strengthLevel - b.strengthLevel || a.createdAt - b.createdAt)

export const hasActiveGateEchoes = (hardcore?: HardcoreState): boolean =>
  getActiveGateEchoes(hardcore).length > 0

export const canUseMajorAction = (
  hardcore: HardcoreState | undefined,
  actionType: MajorActionType,
): { allowed: boolean; reason?: string } => {
  const allowedDuringEcho: MajorActionType[] = ['focus', 'daily', 'echo_battle', 'restore_shadow']
  if (!ensureHardcoreState(hardcore).enabled || !hasActiveGateEchoes(hardcore) || allowedDuringEcho.includes(actionType)) {
    return { allowed: true }
  }
  return {
    allowed: false,
    reason: 'Gate Echo를 먼저 정화해야 합니다. 미완료 일일퀘스트의 잔향이 오늘의 행동을 가로막고 있습니다.',
  }
}

export const compactGateEchoHistory = (echoes: GateEchoState[]): GateEchoState[] => {
  const active = echoes.filter(echo => echo.status === 'active')
  const cleared = echoes
    .filter(echo => echo.status === 'cleared')
    .sort((a, b) => (b.clearedAt ?? b.createdAt) - (a.clearedAt ?? a.createdAt))
    .slice(0, MAX_GATE_ECHO_HISTORY)
  return [...active, ...cleared]
}

export const generateGateEchoesForDate = (params: {
  hardcore?: HardcoreState
  quests: Quest[]
  challengeCards?: ChallengeCard[]
  sourceDate: string
  targetDate: string
  now?: number
}): { hardcore: HardcoreState; created: GateEchoState[] } => {
  const hardcore = ensureHardcoreState(params.hardcore)
  if (!hardcore.enabled) {
    return { hardcore, created: [] }
  }

  // 당일 날짜 중복 생성 방지 가드 탑재 (12-44Z-FINAL)
  if (hardcore.lastEchoGeneratedForDate === params.targetDate) {
    return { hardcore, created: [] }
  }

  const groups = new Map<GateEchoCategory, { ids: string[]; count: number }>()
  const add = (category: GateEchoCategory, id: string) => {
    const existing = groups.get(category) ?? { ids: [], count: 0 }
    existing.count += 1
    existing.ids.push(id)
    groups.set(category, existing)
  }

  for (const quest of params.quests) {
    if (quest.type !== 'daily') continue
    add(quest.recurring === false ? 'custom' : categoryFromQuest(quest.category), quest.id)
  }

  for (const card of params.challengeCards ?? []) {
    if (card.status === 'completed') continue
    if (card.status !== 'selected') continue
    add(categoryFromChallenge(card), card.id)
  }

  const now = params.now ?? Date.now()
  const created = Array.from(groups.entries()).map(([category, group]) => {
    const template = echoTemplate[category]
    const strengthLevel = Math.max(1, group.count)
    return {
      id: `echo-${params.targetDate}-${category}-${now}`,
      date: params.targetDate,
      sourceDate: params.sourceDate,
      category,
      missedCount: group.count,
      monsterId: template.monsterId,
      name: template.name,
      description: template.description,
      strengthLevel,
      status: 'active' as const,
      createdAt: now,
      linkedQuestIds: group.ids,
    }
  })

  const threatGain = created.reduce((sum, echo) => sum + 4 + Math.min(10, echo.missedCount * 2), 0)
  return {
    created,
    hardcore: {
      ...hardcore,
      lastEchoGeneratedForDate: params.targetDate,
      worldThreat: clamp(hardcore.worldThreat + threatGain, 0, 100),
      gateEchoes: compactGateEchoHistory([...hardcore.gateEchoes, ...created]),
    },
  }
}

export const getGateEchoMultiplier = (missedCount: number): number => {
  const base = 1.05 + Math.min(Math.max(0, missedCount - 1), 3) * 0.15
  const extra = Math.max(0, missedCount - 4) * 0.05
  return Math.min(1.65, base + extra)
}

export const getGateEchoDangerLabel = (echo: GateEchoState): string => {
  if (echo.strengthLevel >= 4) return '고위험'
  if (echo.strengthLevel >= 3) return '강력'
  if (echo.strengthLevel >= 2) return '주의'
  return '압박'
}

export const buildGateEchoEnemyUnits = (echo: GateEchoState, hunter: HunterState): BattleUnit[] => {
  const template = echoTemplate[echo.category] ?? echoTemplate.unknown
  const mult = getGateEchoMultiplier(echo.missedCount)
  const level = Math.max(4, hunter.level + Math.min(2, echo.strengthLevel))
  const definition: DirectBattleMonsterDefinition = {
    id: template.monsterId,
    name: echo.name,
    role: template.role,
    unitType: 'monster',
    baseLevel: level,
    levelBand: echo.strengthLevel >= 4 ? 'late' : echo.strengthLevel >= 2 ? 'mid' : 'early',
    statBias: {
      hp: template.bias.hp * mult,
      atk: template.bias.atk * Math.min(2.4, mult),
      def: template.bias.def * Math.min(2.25, mult),
      spd: template.bias.spd,
      skill: template.bias.skill * Math.min(2.35, mult),
      crit: template.bias.crit,
      control: template.bias.control,
      support: template.bias.support,
      survival: template.bias.survival,
      boss: template.bias.boss,
      synergy: template.bias.synergy,
    },
    intentCandidates: ['attack', 'cast', 'control'],
    targetPriority: template.targetPriority,
    boardLane: template.boardLane,
    actionCue: template.actions[0]?.actionCue ?? 'bruiser_jab',
    animationCue: template.actions[0]?.animationCue ?? 'bruiser_jab',
    effectColor: template.color,
    descriptionKo: echo.description,
    actionList: template.actions,
  }
  return [
    buildMonsterBattleUnit(definition, {
      level,
      unitIdPrefix: `gate-echo-${echo.category}`,
      pressureSnapshot: undefined,
      isRedGate: false,
    }).unit,
  ]
}
