import clsx from 'clsx'
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Eye,
  FastForward,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../../lib/store'
import { canUseMajorAction } from '../../lib/gateEchoes'
import { todayKey } from '../../lib/game'
import { type CinematicLogData, type CinematicLogTone } from '../CinematicLogOverlay'
import { CombatLogPanel, type CombatLogEntry, type CombatLogEntryTone } from '../CombatLogPanel'
import {
  SHADOW_EXPEDITION_COMMAND_LABEL,
  SHADOW_EXPEDITION_OUTCOME_LABEL,
  SHADOW_EXPEDITION_PARTY_MAX,
  SHADOW_EXPEDITION_UNLOCK_DAILY_COUNT,
  estimateShadowExpeditionSuccess,
  getPhaseDisplayName,
  getShadowExpeditionPartyPower,
  getShadowExpeditionRecommendedRoleMatches,
  getTodayDailyCompletedCount,
} from '../../lib/shadowExpeditions'
import { SHADOW_INNATE_GRADE_LABEL, SHADOW_ROLE_LABEL, getShadowDefinition } from '../../lib/shadows'
import { getSecretVisibleFragments } from '../../lib/secrets'
import type { OwnedShadow, ShadowExpeditionCommand, ShadowExpeditionLog, ShadowExpeditionOutcome, ShadowExpeditionType, ShadowRole } from '../../lib/types'
import { ShadowExpeditionBattlefield } from './ShadowExpeditionBattlefield'
import { ShadowPortrait } from './ShadowPortrait'
import { DirectBattlePreviewPanel } from '../DirectBattlePreviewPanel'

const commandIcons: Record<ShadowExpeditionCommand, typeof Swords> = {
  attack: Swords,
  defend: Shield,
  scout: Compass,
  analyze: Eye,
  search: Search,
}

const commandRoles: Record<ShadowExpeditionCommand, ShadowRole[]> = {
  attack: ['assault'],
  defend: ['guard', 'support'],
  scout: ['scout'],
  analyze: ['analyst', 'support'],
  search: ['hunter', 'scout'],
}

const commandTone: Record<ShadowExpeditionCommand, { border: string; bg: string; text: string; glow: string; effect: string; chip: string }> = {
  attack: {
    border: 'border-rose-400/35',
    bg: 'bg-rose-400/10 hover:bg-rose-400/15',
    text: 'text-rose-100',
    glow: 'ring-rose-300/45 shadow-[0_0_22px_rgba(244,63,94,0.28)]',
    effect: 'from-rose-400/30 via-orange-300/20 to-transparent',
    chip: 'border-rose-300/30 bg-rose-400/10 text-rose-100',
  },
  defend: {
    border: 'border-sky-300/35',
    bg: 'bg-sky-400/10 hover:bg-sky-400/15',
    text: 'text-sky-100',
    glow: 'ring-sky-200/45 shadow-[0_0_22px_rgba(125,211,252,0.24)]',
    effect: 'from-sky-300/28 via-slate-100/18 to-transparent',
    chip: 'border-sky-200/30 bg-sky-400/10 text-sky-100',
  },
  scout: {
    border: 'border-cyan-300/35',
    bg: 'bg-cyan-400/10 hover:bg-cyan-400/15',
    text: 'text-cyan-100',
    glow: 'ring-cyan-300/45 shadow-[0_0_22px_rgba(34,211,238,0.24)]',
    effect: 'from-cyan-300/28 via-teal-300/16 to-transparent',
    chip: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
  },
  analyze: {
    border: 'border-purple-300/35',
    bg: 'bg-purple-400/10 hover:bg-purple-400/15',
    text: 'text-purple-100',
    glow: 'ring-purple-300/45 shadow-[0_0_22px_rgba(168,85,247,0.26)]',
    effect: 'from-purple-300/28 via-fuchsia-300/16 to-transparent',
    chip: 'border-purple-300/30 bg-purple-400/10 text-purple-100',
  },
  search: {
    border: 'border-amber-300/35',
    bg: 'bg-amber-400/10 hover:bg-amber-400/15',
    text: 'text-amber-100',
    glow: 'ring-amber-300/45 shadow-[0_0_22px_rgba(245,158,11,0.26)]',
    effect: 'from-amber-300/28 via-violet-300/16 to-transparent',
    chip: 'border-amber-300/30 bg-amber-400/10 text-amber-100',
  },
}

const commandHint: Record<ShadowExpeditionCommand, { title: string; bias: string }> = {
  attack: { title: 'ATK/FIN/BOSS가 높으면 진행 보정', bias: '진행도↑ / 위험↑' },
  defend: { title: 'DEF/DUR/SURV가 높으면 위험 제어', bias: '위험↓ / 정비' },
  scout: { title: 'SPD/CTRL/EXPED가 높으면 안정화', bias: '위험↓ / 안정' },
  analyze: { title: 'CTRL/SUPP/SUP가 높으면 다음 명령 보조', bias: '준비 / 진행도' },
  search: { title: 'EXPED/SYN/SUP가 높으면 수색 안정', bias: '보상↑ / 위험↑' },
}

const expeditionTheme: Record<ShadowExpeditionType, { icon: typeof Crosshair; panel: string; border: string; accent: string; wash: string; label: string }> = {
  training: {
    icon: Swords,
    panel: 'bg-[radial-gradient(circle_at_18%_0%,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.82),rgba(2,6,23,0.96))]',
    border: 'border-blue-300/25',
    accent: 'text-blue-100',
    wash: 'from-blue-400/18 to-slate-500/5',
    label: 'TRAINING FIELD',
  },
  essence: {
    icon: Sparkles,
    panel: 'bg-[radial-gradient(circle_at_24%_0%,rgba(168,85,247,0.22),transparent_34%),linear-gradient(135deg,rgba(30,18,52,0.76),rgba(2,6,23,0.96))]',
    border: 'border-purple-300/25',
    accent: 'text-purple-100',
    wash: 'from-purple-400/18 to-violet-500/5',
    label: '그림자 정수 균열',
  },
  hunt: {
    icon: Crosshair,
    panel: 'bg-[radial-gradient(circle_at_18%_0%,rgba(244,63,94,0.2),transparent_33%),linear-gradient(135deg,rgba(40,13,21,0.76),rgba(2,6,23,0.96))]',
    border: 'border-rose-300/25',
    accent: 'text-rose-100',
    wash: 'from-rose-400/18 to-orange-500/5',
    label: 'REMNANT HUNT',
  },
  scout: {
    icon: Compass,
    panel: 'bg-[radial-gradient(circle_at_22%_0%,rgba(45,212,191,0.18),transparent_34%),linear-gradient(135deg,rgba(10,38,45,0.72),rgba(2,6,23,0.96))]',
    border: 'border-teal-300/25',
    accent: 'text-teal-100',
    wash: 'from-teal-400/18 to-cyan-500/5',
    label: 'RIFT SCOUTING',
  },
}

const outcomeTone: Record<ShadowExpeditionOutcome, { border: string; bg: string; text: string; glow: string }> = {
  great_success: {
    border: 'border-amber-300/45',
    bg: 'bg-amber-400/12',
    text: 'text-amber-100',
    glow: 'shadow-[0_0_34px_rgba(245,158,11,0.24)]',
  },
  success: {
    border: 'border-emerald-300/35',
    bg: 'bg-emerald-400/10',
    text: 'text-emerald-100',
    glow: 'shadow-[0_0_28px_rgba(52,211,153,0.18)]',
  },
  partial: {
    border: 'border-cyan-300/30',
    bg: 'bg-cyan-400/8',
    text: 'text-cyan-100',
    glow: 'shadow-[0_0_22px_rgba(34,211,238,0.14)]',
  },
  failure: {
    border: 'border-rose-400/30',
    bg: 'bg-rose-950/20',
    text: 'text-rose-100',
    glow: 'shadow-[0_0_22px_rgba(244,63,94,0.14)]',
  },
}

const logTone: Record<string, string> = {
  system: 'border-white/10 bg-white/5 text-white/65',
  command: 'border-cyan-300/20 bg-cyan-400/8 text-cyan-100/80',
  shadow: 'border-purple-300/20 bg-purple-400/8 text-purple-100/80',
  risk: 'border-rose-300/20 bg-rose-400/8 text-rose-100/80',
  reward: 'border-amber-300/20 bg-amber-400/8 text-amber-100/80',
  phase: 'border-teal-300/20 bg-teal-400/8 text-teal-100/80',
  event: 'border-violet-300/25 bg-violet-400/10 text-violet-100/85',
}

const barWidth = (value: number): string => `${Math.max(0, Math.min(100, value))}%`

const parseDeltas = (message?: string): { progress?: number; risk?: number } => {
  if (!message) return {}
  const progressMatch = message.match(/(?:진행도|吏꾪뻾??)\s*\+?(-?\d+)/)
  const riskMatch = message.match(/(?:위험도|위험|꾪뿕??)\s*([+-]?\d+)/)
  return {
    progress: progressMatch ? Number(progressMatch[1]) : undefined,
    risk: riskMatch ? Number(riskMatch[1]) : undefined,
  }
}

const expeditionCinematicTone: Record<ShadowExpeditionLog['type'], CinematicLogTone> = {
  system: 'system',
  command: 'command',
  shadow: 'shadow',
  risk: 'risk',
  reward: 'reward',
  phase: 'system',
  event: 'shadow',
}

const expeditionCinematicBadge: Record<CinematicLogTone, string> = {
  player: '헌터',
  shadow: '그림자',
  monster: '몬스터',
  system: '시스템',
  reward: '보상',
  risk: '위험',
  command: '명령',
  result: '결과',
  defense: '방어',
}

const shouldShowCinematicExpeditionLog = (log?: ShadowExpeditionLog): boolean => {
  if (!log) return false
  return log.message.trim().length > 0
}

const expeditionLogToCinematic = (log?: ShadowExpeditionLog): CinematicLogData | undefined => {
  if (!log || !shouldShowCinematicExpeditionLog(log)) return undefined
  const tone = expeditionCinematicTone[log.type] ?? 'system'
  const deltas = parseDeltas(log.message)
  const bodyParts = [
    typeof deltas.progress === 'number' ? `진행도 +${deltas.progress}` : undefined,
    typeof deltas.risk === 'number' ? `위험도 ${deltas.risk > 0 ? '+' : ''}${deltas.risk}` : undefined,
    log.command ? SHADOW_EXPEDITION_COMMAND_LABEL[log.command] : undefined,
  ].filter(Boolean)

  return {
    id: `expedition-cinematic-${log.id}`,
    tone,
    badge: log.command ? SHADOW_EXPEDITION_COMMAND_LABEL[log.command] : expeditionCinematicBadge[tone],
    title: log.message,
    body: bodyParts.join(' · ') || undefined,
  }
}

const difficultyLabel = (partyPower: number, requiredPower: number): string => {
  const ratio = partyPower / Math.max(1, requiredPower)
  if (ratio >= 1.45) return '안정'
  if (ratio >= 1.15) return '유리'
  if (ratio >= 0.9) return '적정'
  if (ratio >= 0.65) return '도전'
  return '위험'
}

function CommandEffect({ command }: { command?: ShadowExpeditionCommand }) {
  if (!command) return null
  const tone = commandTone[command]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg" aria-hidden>
      <div className={clsx('absolute inset-0 animate-pulse bg-gradient-to-br opacity-70', tone.effect)} />
      {command === 'attack' && (
        <>
          <div className="absolute left-[12%] top-[22%] h-0.5 w-2/3 rotate-[-18deg] bg-gradient-to-r from-transparent via-rose-200/75 to-transparent" />
          <div className="absolute left-[18%] top-[52%] h-0.5 w-1/2 rotate-[16deg] bg-gradient-to-r from-transparent via-orange-200/55 to-transparent" />
        </>
      )}
      {command === 'defend' && (
        <div className="absolute inset-x-[18%] top-[18%] h-[68%] rounded-full border border-sky-100/30 shadow-[inset_0_0_26px_rgba(125,211,252,0.22),0_0_22px_rgba(125,211,252,0.16)]" />
      )}
      {command === 'scout' && (
        <>
          <div className="absolute left-0 right-0 top-1/3 h-px bg-cyan-200/50" />
          <div className="absolute left-0 right-0 top-2/3 h-px bg-teal-200/35" />
        </>
      )}
      {command === 'analyze' && (
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-md border border-purple-200/30 shadow-[0_0_28px_rgba(168,85,247,0.18)]" />
      )}
      {command === 'search' && (
        <>
          <div className="absolute left-[18%] top-[24%] h-1.5 w-1.5 rounded-full bg-amber-100/80 shadow-[0_0_14px_rgba(251,191,36,0.8)]" />
          <div className="absolute right-[22%] top-[46%] h-1 w-1 rounded-full bg-violet-100/80 shadow-[0_0_14px_rgba(196,181,253,0.8)]" />
          <div className="absolute left-[45%] bottom-[22%] h-1 w-1 rounded-full bg-amber-100/70 shadow-[0_0_12px_rgba(251,191,36,0.7)]" />
        </>
      )}
    </div>
  )
}

function StatBar({
  label,
  value,
  kind,
  delta,
}: {
  label: string
  value: number
  kind: 'progress' | 'risk'
  delta?: number
}) {
  const highRisk = kind === 'risk' && value >= 70
  const dangerRisk = kind === 'risk' && value >= 90
  const reached = kind === 'progress' && value >= 100
  return (
    <div className="rounded-md border border-white/10 bg-ink-950/35 p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
        <div className="font-semibold text-white/75">
          {label} <span className="system-text text-white/35">{value} / 100</span>
        </div>
        <div className="flex items-center gap-1.5">
          {typeof delta === 'number' && (
            <span className={clsx(
              'rounded border px-1.5 py-0.5 text-[10px] system-text',
              kind === 'progress'
                ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
                : delta > 0
                  ? 'border-rose-300/25 bg-rose-400/10 text-rose-100'
                  : 'border-sky-300/25 bg-sky-400/10 text-sky-100',
            )}>
              {delta > 0 ? '+' : ''}{delta}
            </span>
          )}
          {reached && <span className="rounded border border-emerald-300/25 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] system-text text-emerald-100">SUCCESS LINE</span>}
          {highRisk && <span className={clsx('rounded border px-1.5 py-0.5 text-[10px] system-text', dangerRisk ? 'border-rose-300/35 bg-rose-400/15 text-rose-100 animate-pulse' : 'border-amber-300/25 bg-amber-400/10 text-amber-100')}>위험</span>}
        </div>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
        <div className="absolute left-0 top-0 h-full w-px bg-white/20" />
        <div className="absolute left-[70%] top-0 h-full w-px bg-amber-200/25" />
        <div className="absolute left-[90%] top-0 h-full w-px bg-rose-200/30" />
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            kind === 'progress'
              ? 'bg-gradient-to-r from-cyan-300 via-blue-300 to-emerald-300 shadow-[0_0_14px_rgba(45,212,191,0.24)]'
              : value >= 90
                ? 'bg-gradient-to-r from-amber-300 to-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.28)]'
                : value >= 70
                  ? 'bg-gradient-to-r from-yellow-300 to-orange-400'
                  : 'bg-gradient-to-r from-slate-300 to-amber-300',
          )}
          style={{ width: barWidth(value) }}
        />
        <div className="absolute left-[100%] top-0 h-full w-px -translate-x-px bg-white/45" />
      </div>
    </div>
  )
}

function MiniShadow({
  shadow,
  selected,
  active,
  recommended,
  commandMatch,
  command,
  onClick,
}: {
  shadow: OwnedShadow
  selected?: boolean
  active?: boolean
  recommended?: boolean
  commandMatch?: boolean
  command?: ShadowExpeditionCommand
  onClick?: () => void
}) {
  const tone = command ? commandTone[command] : undefined
  const isNamed = Boolean(shadow.isNamed || shadow.isGateNamed || shadow.isAchievementNamed)
  const isSGrade = shadow.innateGrade === 'S'
  const isAGrade = shadow.innateGrade === 'A'
  const isEvolved = (shadow.evolutionStage ?? 0) > 0
  const collapsed = Boolean(shadow.collapsed || shadow.status === 'collapsed')

  return (
    <motion.button
      type="button"
      onClick={collapsed ? undefined : onClick}
      disabled={collapsed}
      whileHover={collapsed ? {} : { y: -3, scale: 1.02 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={clsx(
        'relative min-w-[124px] overflow-hidden rounded-md border p-2 text-left transition-all duration-300 card-premium-shine group',
        collapsed ? 'border-red-900 bg-red-950/10 opacity-50 grayscale cursor-not-allowed' :
        selected ? 'border-cyan-300/60 bg-cyan-400/12 ring-1 ring-cyan-300/40 shadow-deployed-glow' : 'border-white/10 bg-ink-900/45 hover:border-purple-300/35 hover:bg-purple-400/10',
        recommended && !selected && !collapsed && 'border-emerald-300/30',
        commandMatch && tone && !collapsed && `${tone.border} ${tone.bg}`,
        active && tone && !collapsed ? `ring-2 ${tone.glow}` : active && !collapsed && 'animate-pulse border-amber-300/60 ring-2 ring-amber-300/35',
        isSGrade && !collapsed && 'grade-aura-s',
        isAGrade && !collapsed && 'grade-aura-a',
        isEvolved && !collapsed && 'shadow-evolved-card',
        isNamed && !collapsed && 'named-pulse',
      )}
    >
      {commandMatch && tone && <div className={clsx('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', tone.effect)} />}
      <div className="flex justify-center mb-1">
        <ShadowPortrait
          shadow={shadow}
          size="sm"
          active={active}
          highlighted={selected || active || commandMatch || isNamed}
          innateGrade={shadow.innateGrade}
        />
      </div>
      <div className="mt-1 truncate text-[11px] font-semibold text-white/90">{shadow.name}</div>
      <div className="text-[9px] system-text text-white/45">
        Lv {shadow.level ?? 1} / {SHADOW_ROLE_LABEL[shadow.role]}
      </div>
      <div className="mt-0.5 text-[9px] font-medium text-amber-300/90 system-text flex items-center gap-0.5">
        ⭐ 숙련 Lv.{shadow.expeditionLevel ?? 1} {((shadow.expeditionLevel ?? 1) > 1) && `(+${((shadow.expeditionLevel ?? 1) - 1) * 3}%)`}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {collapsed ? (
          <span className="rounded border border-red-500/35 bg-red-500/10 px-1.5 py-0.5 text-[8px] system-text font-bold text-red-300 animate-pulse">
            FRACTURED
          </span>
        ) : (
          <>
            {recommended && (
              <span className="rounded border border-emerald-300/25 bg-emerald-400/10 px-1 py-0.5 text-[8px] system-text text-emerald-100">
                추천
              </span>
            )}
            {commandMatch && (
              <span className={clsx('rounded border px-1 py-0.5 text-[8px] system-text', tone?.chip)}>
                반응
              </span>
            )}
            {isSGrade && (
              <span className="rounded border border-amber-300/40 bg-amber-300/10 px-1 py-0.5 text-[8px] system-text font-bold text-amber-200">
                S
              </span>
            )}
          </>
        )}
      </div>
    </motion.button>
  )
}

function ShadowMiniChip({
  shadow,
  active,
  compact = false,
}: {
  shadow: OwnedShadow
  active?: boolean
  compact?: boolean
}) {
  const definition = getShadowDefinition(shadow.definitionId)
  const isNamed = Boolean(shadow.isNamed || shadow.isGateNamed || shadow.isAchievementNamed)
  return (
    <div className={clsx(
      'inline-flex min-w-0 items-center gap-2 rounded-md border bg-ink-950/55',
      compact ? 'px-1.5 py-1' : 'px-2 py-1.5',
      active ? 'border-amber-300/35 shadow-[0_0_18px_rgba(251,191,36,0.14)]' : isNamed ? 'border-amber-300/25' : 'border-white/10',
    )}>
      <div className={compact ? 'h-8 w-8 shrink-0' : 'h-10 w-10 shrink-0'}>
        <ShadowPortrait
          shadow={shadow}
          definition={definition}
          size="xs"
          active={active}
          highlighted={active || isNamed || shadow.innateGrade === 'S' || shadow.innateGrade === 'A'}
          innateGrade={shadow.innateGrade}
        />
      </div>
      <div className="min-w-0">
        <div className={clsx('truncate font-semibold text-white/80', compact ? 'text-[10px]' : 'text-xs')}>{shadow.name}</div>
        <div className="system-text text-[8px] text-white/42">
          {SHADOW_ROLE_LABEL[shadow.role]} · {SHADOW_INNATE_GRADE_LABEL[shadow.innateGrade ?? 'B']} · ⭐{shadow.expeditionLevel ?? 1}
        </div>
      </div>
    </div>
  )
}

export function ShadowExpeditionPanel() {
  const ownedShadows = useGame(s => s.ownedShadows ?? [])
  const expeditionTickets = useGame(s => s.expeditionTickets ?? 0)
  const shadowExpeditions = useGame(s => s.shadowExpeditions ?? [])
  const achievementStats = useGame(s => s.achievementStats)
  const selectParty = useGame(s => s.selectShadowExpeditionParty)
  const startExpedition = useGame(s => s.startShadowExpedition)
  const issueCommand = useGame(s => s.issueShadowExpeditionCommand)
  const abandonExpedition = useGame(s => s.abandonShadowExpedition)
  const resolveMidEvent = useGame(s => s.resolveShadowExpeditionMidEvent)
  const resolveSpecialExpeditionBattle = useGame(s => s.resolveSpecialExpeditionBattle)
  const retrySpecialExpedition = useGame(s => s.retrySpecialExpedition)
  const hunter = useGame(s => s.hunter)
  const items = useGame(s => s.items)
  const equipment = useGame(s => s.equipment)
  const activeConsumableEffects = useGame(s => s.activeConsumableEffects ?? [])

  const visibleTraces = useGame(s => getSecretVisibleFragments(s.secretProgress))
  const traceCount = visibleTraces.length
  const [expanded, setExpanded] = useState(false)
  const hardcoreState = useGame(s => s.hardcoreState)
  const expeditionLock = canUseMajorAction(hardcoreState, 'expedition')
  const [expeditionCinematicLogs, setExpeditionCinematicLogs] = useState<CinematicLogData[]>([])
  const [expeditionSkipSignal, setExpeditionSkipSignal] = useState(0)
  const previousExpeditionLogRef = useRef<{ expeditionId?: string; count: number }>({ count: 0 })
  const dateKey = todayKey()
  const dailyCount = getTodayDailyCompletedCount(achievementStats, dateKey)

  const [activeTab, setActiveTab] = useState<'daily' | 'special'>('daily')

  const specialExpeditions = useMemo(() => shadowExpeditions.filter(item => item.isSpecial), [shadowExpeditions])
  const dailyExpeditions = useMemo(() => shadowExpeditions.filter(item => !item.isSpecial), [shadowExpeditions])

  useEffect(() => {
    if (activeTab === 'special' && specialExpeditions.length === 0) {
      setActiveTab('daily')
    }
  }, [specialExpeditions, activeTab])

  const expedition = useMemo(() => {
    if (activeTab === 'special' && specialExpeditions.length > 0) {
      return specialExpeditions.find(item => item.status === 'in_progress')
        ?? specialExpeditions.find(item => item.status === 'available')
        ?? specialExpeditions[0]
    }
    return dailyExpeditions.find(item => item.date === dateKey)
      ?? dailyExpeditions[0]
  }, [activeTab, specialExpeditions, dailyExpeditions, dateKey])

  const selectedShadows = useMemo(() => {
    if (!expedition) return []
    return expedition.selectedShadowIds
      .map(id => ownedShadows.find(shadow => shadow.instanceId === id))
      .filter((shadow): shadow is OwnedShadow => Boolean(shadow))
  }, [expedition, ownedShadows])

  const issueVisualCommand = (command: ShadowExpeditionCommand) => {
    if (expedition) {
      issueCommand(expedition.id, command)
    }
  }

  useEffect(() => {
    if (!expedition) {
      setExpeditionCinematicLogs([])
      previousExpeditionLogRef.current = { count: 0 }
      return
    }

    const previous = previousExpeditionLogRef.current
    if (previous.expeditionId !== expedition.id) {
      previousExpeditionLogRef.current = { expeditionId: expedition.id, count: expedition.logs.length }
      setExpeditionCinematicLogs([])
      return
    }

    if (expedition.logs.length > previous.count) {
      const nextLogs = expedition.logs
        .slice(previous.count)
        .map(expeditionLogToCinematic)
        .filter((item): item is CinematicLogData => Boolean(item))
      setExpeditionCinematicLogs(nextLogs)
    } else if (expedition.logs.length < previous.count) {
      setExpeditionCinematicLogs([])
    }

    previousExpeditionLogRef.current = { expeditionId: expedition.id, count: expedition.logs.length }
  }, [expedition])

  if (!expedition) {
    return (
      <div className="panel corner-bracket p-5 border-purple-400/20 bg-purple-500/5">
        <div className="br" />
        <div className="text-sm text-white/55">오늘의 그림자 원정을 준비하는 중입니다.</div>
      </div>
    )
  }

  const theme = expeditionTheme[expedition.type]
  const ThemeIcon = theme.icon
  const latestCommandLog = [...expedition.logs].reverse().find(log => log.command)
  const activeCommand = latestCommandLog?.command
  const activeLog = [...expedition.logs].reverse().find(log => log.actorShadowId)
  const activeShadowId = activeLog?.actorShadowId
  const deltas = parseDeltas(latestCommandLog?.message)
  const expeditionLogEntries: CombatLogEntry[] = expedition.logs.map(log => {
    const actor = log.actorShadowId ? ownedShadows.find(shadow => shadow.instanceId === log.actorShadowId) : undefined
    const definition = actor ? getShadowDefinition(actor.definitionId) : undefined
    const Icon = log.command ? commandIcons[log.command] : Activity
    const tone: CombatLogEntryTone = log.type === 'risk'
      ? 'risk'
      : log.type === 'reward'
        ? 'reward'
        : log.type === 'command'
          ? 'command'
          : log.type === 'shadow'
            ? 'shadow'
            : log.type === 'phase'
              ? 'result'
              : log.type === 'event'
                ? 'defense'
                : 'system'

    return {
      id: log.id,
      turn: log.turn,
      tone,
      label: log.command ? SHADOW_EXPEDITION_COMMAND_LABEL[log.command] : log.type.toUpperCase(),
      actorName: actor?.name,
      actorNode: actor ? (
        <div className="w-14">
          <ShadowPortrait
            shadow={actor}
            definition={definition}
            size="xs"
            active={log.id === activeLog?.id}
            highlighted
            innateGrade={actor.innateGrade}
          />
          <div className="mt-1 truncate text-center text-[8px] system-text text-white/40">
            {SHADOW_ROLE_LABEL[actor.role]}
          </div>
        </div>
      ) : undefined,
      icon: <Icon className="h-3 w-3" />,
      meta: log.phase ? getPhaseDisplayName(log.phase, expedition.type) : log.command ? 'actor linked' : undefined,
      message: log.message,
    }
  })
  const partyPower = getShadowExpeditionPartyPower(selectedShadows, expedition)
  const difficulty = difficultyLabel(partyPower, expedition.requiredPower)
  const rawDifficulty = estimateShadowExpeditionSuccess(partyPower, expedition.requiredPower)
  const powerRatio = partyPower / Math.max(1, expedition.requiredPower)
  const roleMatches = getShadowExpeditionRecommendedRoleMatches(selectedShadows, expedition)
  const isLocked = expedition.status === 'locked' && dailyCount < SHADOW_EXPEDITION_UNLOCK_DAILY_COUNT
  const canEditParty = expedition.status === 'locked' || expedition.status === 'available'
  const canStart = expedition.status === 'available' && selectedShadows.length >= 1 && selectedShadows.length <= SHADOW_EXPEDITION_PARTY_MAX
  const inProgress = expedition.status === 'in_progress'
  const completed = expedition.status === 'completed'
  const showFull = expanded || inProgress
  const compactCompleted = completed && !expanded

  const toggleShadow = (shadow: OwnedShadow) => {
    if (!canEditParty) return
    const selected = expedition.selectedShadowIds.includes(shadow.instanceId)
    const nextIds = selected
      ? expedition.selectedShadowIds.filter(id => id !== shadow.instanceId)
      : [...expedition.selectedShadowIds, shadow.instanceId].slice(0, SHADOW_EXPEDITION_PARTY_MAX)
    selectParty(expedition.id, nextIds)
  }

  if (expedition && expedition.isSpecial && expedition.status === 'in_progress' && expedition.combatTriggered && !expedition.combatResolved) {
    return (
      <div className={clsx('panel corner-bracket relative overflow-hidden p-4 sm:p-5', theme.border, theme.panel)}>
        <div className="br" />
        <div className={clsx('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70', theme.wash)} />
        <DirectBattlePreviewPanel
          key={`special-battle-${expedition.id}`}
          source="shadow_expedition"
          title={`특별 결전: ${expedition.title}`}
          note="플레이어 본체(헌터)는 참여하지 않으며, 원정에 출정한 그림자들만으로 전투가 개시됩니다."
          hunter={hunter}
          items={items}
          equipment={equipment}
          activeConsumableEffects={activeConsumableEffects}
          equippedShadows={selectedShadows}
          recommendedEncounterKey={expedition.enemyEncounterKey || 'mid_trio'}
          enemyBaseLevel={expedition.enemyBaseLevel ?? 12}
          customBattleId={`special-battle-${expedition.id}`}
          battleThemeKey="monarch"
          maxRoundsOverride={15}
          autoStart
          allowEncounterSelection={false}
          startButtonLabel="결전 개시"
          restartButtonLabel="다시 준비"
          cancelButtonLabel="원정 중단"
          shadowsOnly={true}
          onBattleComplete={(payload) => {
            resolveSpecialExpeditionBattle(expedition.id, payload.outcome === 'victory' ? 'victory' : 'defeat', payload.logs)
          }}
        />
      </div>
    )
  }

  return (
    <div className={clsx('panel corner-bracket relative overflow-hidden p-4 sm:p-5', theme.border, theme.panel)}>
      <div className="br" />

      {specialExpeditions.length > 0 && (
        <div className="relative z-10 flex border-b border-white/10 gap-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-5 py-2.5 text-xs font-bold uppercase transition border-b-2 -mb-[2px] ${
              activeTab === 'daily'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-white/55 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            일상 원정
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('special')}
            className={`px-5 py-2.5 text-xs font-bold uppercase transition border-b-2 -mb-[2px] ${
              activeTab === 'special'
                ? 'border-purple-400 text-purple-300 bg-purple-500/5'
                : 'border-transparent text-white/55 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            특별 원정 ({specialExpeditions.length})
          </button>
        </div>
      )}

      {expeditionCinematicLogs.length > 0 && (
        <div className="absolute right-3 top-3 z-40">
          <button
            type="button"
            onClick={() => setExpeditionSkipSignal(s => s + 1)}
            className="inline-flex items-center gap-1 text-[10px] system-text text-amber-200 border border-amber-400/25 bg-amber-400/10 rounded px-2 py-1 hover:bg-amber-400/15 transition"
          >
            <FastForward className="w-3 h-3" />
            스킵
          </button>
        </div>
      )}
      <div className={clsx('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70', theme.wash)} />
      {inProgress && <CommandEffect command={activeCommand} />}

      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={clsx('inline-flex items-center gap-1.5 system-text text-[10px]', theme.accent)}>
              <ThemeIcon className="h-3.5 w-3.5" />
              {theme.label}
            </span>
            {!expedition.isSpecial && (
              <>
                <span className="rounded border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-[10px] system-text text-cyan-100">
                  오늘 Daily {dailyCount} / {SHADOW_EXPEDITION_UNLOCK_DAILY_COUNT}
                </span>
                <span className="rounded border border-yellow-400/25 bg-yellow-400/10 px-2 py-0.5 text-[10px] system-text text-yellow-100">
                  🎫 보유 원정 티켓: {expeditionTickets}장
                </span>
              </>
            )}
            {expedition.isSpecial && (
              <span className="rounded border border-purple-400/25 bg-purple-400/10 px-2 py-0.5 text-[10px] system-text text-purple-100 animate-pulse">
                ✨ 특별 원정 (티켓 불필요)
              </span>
            )}
            <span className={clsx(
              'rounded border px-2 py-0.5 text-[10px] system-text',
              completed ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' :
              inProgress ? 'border-amber-400/30 bg-amber-400/10 text-amber-100' :
              isLocked ? 'border-white/10 bg-white/5 text-white/45' :
              'border-purple-400/30 bg-purple-400/10 text-purple-100',
            )}>
              {expedition.status.toUpperCase()}
            </span>
            {inProgress && activeCommand && (
              <span className={clsx('rounded border px-2 py-0.5 text-[10px] system-text', commandTone[activeCommand].chip)}>
                최근 명령: {SHADOW_EXPEDITION_COMMAND_LABEL[activeCommand]}
              </span>
            )}
            {inProgress && expedition.currentPhase && expedition.currentPhase !== 'muster' && (
              <span className="rounded border border-teal-300/25 bg-teal-400/10 px-2 py-0.5 text-[10px] system-text text-teal-100">
                {getPhaseDisplayName(expedition.currentPhase, expedition.type)}
              </span>
            )}
            {traceCount > 0 && (
              <span className="rounded border border-violet-200/15 bg-black/15 px-2 py-0.5 text-[10px] system-text text-violet-100/55">
                <span className="text-violet-200/70">ARCHIVE TRACE</span>
                <span className="ml-1 text-white/45">x{traceCount}</span>
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-white/95">{expedition.title}</h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/55">{expedition.description}</p>
        </div>

        <div className="flex items-start gap-2">
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[300px]">
            <div className="rounded-md border border-purple-400/20 bg-purple-400/10 px-3 py-2">
              <div className="system-text text-[9px] text-purple-100/55">POWER</div>
              <div className="font-bold text-purple-100">{partyPower}</div>
            </div>
            <div className="rounded-md border border-amber-400/20 bg-amber-400/10 px-3 py-2">
              <div className="system-text text-[9px] text-amber-100/55">REQUIRED</div>
              <div className="font-bold text-amber-100">{expedition.requiredPower}</div>
            </div>
            <div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">
              <div className="system-text text-[9px] text-cyan-100/55">ODDS</div>
              <div className="font-bold text-cyan-100">{difficulty}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            className="rounded-md border border-white/10 bg-ink-900/45 p-2 text-white/55 transition hover:text-white/80"
            title={expanded ? '접기' : '펼치기'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {compactCompleted && expedition.result && (
        <div className="relative mt-4">
          <ReportPanel
            expeditionResult={expedition.result}
            activeShadowId={activeShadowId}
            selectedShadows={selectedShadows}
            ownedShadows={ownedShadows}
            compact
            isSpecial={expedition.isSpecial}
            onRetry={() => retrySpecialExpedition(expedition.id)}
          />
        </div>
      )}

      {showFull && (
        <div className="relative mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-ink-900/35 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="system-text text-[11px] text-cyan-200/75">EXPEDITION PARTY</div>
                <div className="flex items-center gap-2 text-[10px] text-white/40">
                  <span>{selectedShadows.length} / {SHADOW_EXPEDITION_PARTY_MAX}</span>
                  <span>ratio {(powerRatio || 0).toFixed(2)}x</span>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedShadows.map(shadow => (
                  <MiniShadow
                    key={shadow.instanceId}
                    shadow={shadow}
                    selected
                    recommended={expedition.recommendedRoles.includes(shadow.role)}
                    commandMatch={activeCommand ? commandRoles[activeCommand].includes(shadow.role) : false}
                    command={activeCommand}
                    active={activeShadowId === shadow.instanceId}
                    onClick={() => toggleShadow(shadow)}
                  />
                ))}
                {selectedShadows.length === 0 && (
                  <div className="rounded-md border border-dashed border-white/10 px-4 py-8 text-sm text-white/35">
                    원정에 보낼 그림자를 선택하세요.
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] system-text">
                <span className="text-white/35">추천 역할</span>
                {expedition.recommendedRoles.map(role => (
                  <span
                    key={role}
                    className={clsx(
                      'rounded border px-2 py-0.5',
                      roleMatches.includes(role) ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : 'border-white/10 bg-white/5 text-white/35',
                    )}
                  >
                    {SHADOW_ROLE_LABEL[role]}
                  </span>
                ))}
                <span className="rounded border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-cyan-100">
                  난이도 {difficulty} <span className="text-white/35">({rawDifficulty})</span>
                </span>
              </div>
            </div>

            {canEditParty && (
              <div className="rounded-lg border border-white/10 bg-ink-900/25 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="system-text text-[11px] text-purple-200/75">OWNED SHADOWS</div>
                  <div className="text-[10px] text-white/35">추천 역할 그림자는 초록 배지로 표시</div>
                </div>
                <div className="grid max-h-[360px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
                  {ownedShadows.map(shadow => (
                    <MiniShadow
                      key={shadow.instanceId}
                      shadow={shadow}
                      selected={expedition.selectedShadowIds.includes(shadow.instanceId)}
                      recommended={expedition.recommendedRoles.includes(shadow.role)}
                      onClick={() => toggleShadow(shadow)}
                    />
                  ))}
                  {ownedShadows.length === 0 && (
                    <div className="col-span-full rounded-md border border-white/10 bg-white/5 p-4 text-sm text-white/40">
                      보유 그림자가 없습니다. 게이트에서 그림자를 추출한 뒤 원정을 지휘할 수 있습니다.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-white/10 bg-ink-900/35 p-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-[10px] system-text text-white/45">
                <span>TURN {expedition.turn} / {expedition.maxTurns}</span>
                <span>수색 보너스 {expedition.searchStacks ?? 0} / 3</span>
              </div>
              <div className="mb-3">
                <ShadowExpeditionBattlefield
                  expedition={expedition}
                  selectedShadows={selectedShadows}
                  latestCommand={activeCommand}
                  latestActorShadowId={activeShadowId}
                  progressDelta={deltas.progress}
                  riskDelta={deltas.risk}
                  outcome={expedition.result?.outcome}
                  cinematicLogs={expeditionCinematicLogs}
                  skipSignal={expeditionSkipSignal}
                  onCinematicComplete={() => setExpeditionCinematicLogs([])}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <StatBar label="원정 진행" value={expedition.progress} kind="progress" delta={deltas.progress} />
                <StatBar label="위험도" value={expedition.risk} kind="risk" delta={deltas.risk} />
              </div>
            </div>

            {inProgress && expedition.eventTriggered && !expedition.eventResolved && expedition.midEvent && (
              <MidEventCard event={expedition.midEvent} onChoose={choiceId => resolveMidEvent(expedition.id, choiceId)} selectedShadows={selectedShadows} />
            )}

            {inProgress && !expedition.isSpecial && (
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                {(Object.keys(SHADOW_EXPEDITION_COMMAND_LABEL) as ShadowExpeditionCommand[]).map(command => {
                  const Icon = commandIcons[command]
                  const tone = commandTone[command]
                  const matchedCount = selectedShadows.filter(shadow => commandRoles[command].includes(shadow.role)).length
                  return (
                    <button
                      key={command}
                      type="button"
                      onClick={() => issueVisualCommand(command)}
                      className={clsx(
                        'relative overflow-hidden rounded-md border px-2 py-3 text-left text-xs transition',
                        tone.border,
                        tone.bg,
                        tone.text,
                        activeCommand === command && `ring-1 ${tone.glow}`,
                      )}
                      title={commandHint[command].title}
                    >
                      <div className={clsx('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', tone.effect)} />
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <Icon className="h-4 w-4" />
                        {matchedCount > 0 && (
                          <span className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[9px] system-text">
                            추천 {matchedCount}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold">{SHADOW_EXPEDITION_COMMAND_LABEL[command]}</div>
                      <div className="mt-1 text-[10px] leading-tight opacity-75">{commandHint[command].title}</div>
                      <div className="mt-2 system-text text-[9px] opacity-60">{commandHint[command].bias}</div>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {canStart && (
                <div className="flex flex-col items-start gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => startExpedition(expedition.id)}
                    disabled={!expeditionLock.allowed || (!expedition.isSpecial && expeditionTickets < 1)}
                    className={clsx(
                      "btn text-xs font-bold flex items-center gap-1.5 justify-center",
                      (!expeditionLock.allowed || (!expedition.isSpecial && expeditionTickets < 1))
                        ? "border-red-500/40 text-red-400 bg-red-950/15 cursor-not-allowed opacity-60"
                        : "btn-primary"
                    )}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {!expeditionLock.allowed
                      ? '원정 시작 잠김'
                      : expedition.isSpecial
                        ? '특별 원정 시작 (티켓 소모 없음)'
                        : (expeditionTickets < 1 ? '티켓 부족 (원정 티켓 1장 소모)' : '원정 시작 (티켓 1장 소모)')}
                  </button>
                  {!expeditionLock.allowed && (
                    <span className="text-[9px] text-red-400 font-semibold max-w-[280px] leading-tight">
                      ⚠️ {expeditionLock.reason}
                    </span>
                  )}
                  {expeditionLock.allowed && !expedition.isSpecial && expeditionTickets < 1 && (
                    <span className="text-[10px] text-red-400/90 font-medium max-w-[320px] leading-tight mt-1 bg-red-950/20 border border-red-500/10 rounded px-2 py-1">
                      💡 원정 티켓 획득처: 게이트 클리어, 일일 퀘스트 완료, 상점 구매(200 Gold), 보상 상자
                    </span>
                  )}
                </div>
              )}
              {isLocked && (
                <div className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/45">
                  Daily 2개를 완료하면 그림자 원정을 지휘할 수 있습니다.
                </div>
              )}
              {inProgress && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('원정을 중도 포기하면 보상이 없습니다. 계속할까요?')) abandonExpedition(expedition.id)
                  }}
                  className="btn border-rose-400/25 bg-rose-400/10 text-xs text-rose-100"
                >
                  중도 포기
                </button>
              )}
            </div>
          </div>

          <aside className="space-y-3">
            <CombatLogPanel
              title="EXPEDITION LOG"
              subtitle={activeCommand ? `${SHADOW_EXPEDITION_COMMAND_LABEL[activeCommand]} 명령 반응 추적` : '최근 명령과 그림자 행동을 우선 표시'}
              logs={expeditionLogEntries}
              maxVisible={5}
              latestFirst
              highlightLatest
              compact
              emptyText="원정 로그가 아직 없습니다."
            />

            <div className="hidden">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 system-text text-[11px] text-purple-200/75">
                  <Activity className="h-3.5 w-3.5" />
                  EXPEDITION LOG
                </div>
                {activeCommand && (
                  <span className={clsx('rounded border px-2 py-0.5 text-[9px] system-text', commandTone[activeCommand].chip)}>
                    {SHADOW_EXPEDITION_COMMAND_LABEL[activeCommand]}
                  </span>
                )}
              </div>
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {[...expedition.logs].slice(-6).reverse().map((log, index) => {
                  const actor = log.actorShadowId ? ownedShadows.find(shadow => shadow.instanceId === log.actorShadowId) : undefined
                  const definition = actor ? getShadowDefinition(actor.definitionId) : undefined
                  const Icon = log.command ? commandIcons[log.command] : Activity
                  const isLatest = index === 0
                  return (
                    <div
                      key={log.id}
                      className={clsx(
                        'rounded-md border p-2 transition',
                        logTone[log.type] ?? logTone.system,
                        isLatest && 'ring-1 ring-white/15',
                      )}
                    >
                      <div className="flex gap-2">
                        {actor && (
                          <div className="w-14 shrink-0">
                            <ShadowPortrait shadow={actor} definition={definition} size="xs" active={log.id === activeLog?.id} highlighted />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-1.5 system-text text-[9px] text-white/40">
                            <Icon className="h-3 w-3" />
                            <span>TURN {log.turn}</span>
                            <span>/</span>
                            <span>{log.type.toUpperCase()}</span>
                          </div>
                          <div className="text-[11px] leading-relaxed text-white/72">{log.message}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {completed && expedition.result && (
              <ReportPanel
                expeditionResult={expedition.result}
                activeShadowId={activeShadowId}
                selectedShadows={selectedShadows}
                ownedShadows={ownedShadows}
                isSpecial={expedition.isSpecial}
                onRetry={() => retrySpecialExpedition(expedition.id)}
              />
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

function MidEventCard({
  event,
  selectedShadows,
  onChoose,
}: {
  event: NonNullable<ReturnType<typeof useGame.getState>['shadowExpeditions'][number]['midEvent']>
  selectedShadows: OwnedShadow[]
  onChoose: (choiceId: string) => void
}) {
  return (
    <div className="rounded-lg border border-violet-400/35 bg-violet-900/20 p-4 shadow-[0_0_24px_rgba(139,92,246,0.18)]">
      <div className="mb-1 flex items-center gap-2 system-text text-[10px] text-violet-300/75">
        <Sparkles className="h-3.5 w-3.5" />
        상황 발생 — 선택이 필요합니다
      </div>
      <div className="mb-1 text-base font-bold text-violet-100">{event.title}</div>
      <p className="mb-3 text-sm leading-relaxed text-white/60">{event.description}</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {event.choices.map(choice => {
          const matchingShadows = choice.preferredRoles
            ? selectedShadows.filter(s => choice.preferredRoles!.includes(s.role))
            : []
          const roleMatch = choice.preferredRoles
            ? matchingShadows.length > 0
            : false
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => onChoose(choice.id)}
              className={clsx(
                'relative overflow-hidden rounded-md border px-3 py-2.5 text-left text-xs transition',
                roleMatch
                  ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/18'
                  : 'border-violet-300/25 bg-violet-400/8 text-violet-100 hover:bg-violet-400/14',
              )}
              title={choice.description}
            >
              {roleMatch && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400/50 via-teal-300/30 to-transparent" />
              )}
              <div className="font-semibold">{choice.label}</div>
              <div className="mt-0.5 text-[10px] opacity-70 leading-snug">{choice.description}</div>
              {matchingShadows.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {matchingShadows.slice(0, 2).map(shadow => (
                    <ShadowMiniChip key={shadow.instanceId} shadow={shadow} compact />
                  ))}
                  {matchingShadows.length > 2 && (
                    <span className="inline-flex items-center rounded border border-emerald-300/20 bg-emerald-400/10 px-1.5 text-[9px] system-text text-emerald-100">
                      +{matchingShadows.length - 2}
                    </span>
                  )}
                </div>
              )}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {typeof choice.progressDelta === 'number' && (
                  <span className={clsx('rounded border px-1.5 py-0.5 text-[9px] system-text', choice.progressDelta >= 0 ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100' : 'border-rose-300/25 bg-rose-400/10 text-rose-100')}>
                    진행 {choice.progressDelta >= 0 ? '+' : ''}{choice.progressDelta}
                  </span>
                )}
                {typeof choice.riskDelta === 'number' && choice.riskDelta !== 0 && (
                  <span className={clsx('rounded border px-1.5 py-0.5 text-[9px] system-text', choice.riskDelta > 0 ? 'border-rose-300/25 bg-rose-400/10 text-rose-100' : 'border-sky-300/25 bg-sky-400/10 text-sky-100')}>
                    위험 {choice.riskDelta > 0 ? '+' : ''}{choice.riskDelta}
                  </span>
                )}
                {roleMatch && (
                  <span className="rounded border border-emerald-300/25 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] system-text text-emerald-100">역할 일치</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ReportPanel({
  expeditionResult,
  selectedShadows,
  activeShadowId,
  ownedShadows,
  compact = false,
  isSpecial = false,
  onRetry,
}: {
  expeditionResult: NonNullable<ReturnType<typeof useGame.getState>['shadowExpeditions'][number]['result']>
  selectedShadows: OwnedShadow[]
  ownedShadows: OwnedShadow[]
  activeShadowId?: string
  compact?: boolean
  isSpecial?: boolean
  onRetry?: () => void
}) {
  const tone = outcomeTone[expeditionResult.outcome]
  const report = expeditionResult.report
  const featuredShadow = expeditionResult.featuredShadowIds?.[0]
    ? ownedShadows.find(s => s.instanceId === expeditionResult.featuredShadowIds![0])
    : undefined

  return (
    <div className={clsx('rounded-lg border p-3', tone.border, tone.bg, tone.glow)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="system-text text-[10px] text-white/45">EXPEDITION RESULT</div>
          <div className={clsx('mt-1 text-2xl font-black', tone.text)}>
            {SHADOW_EXPEDITION_OUTCOME_LABEL[expeditionResult.outcome]}
          </div>
          {report && !compact && (
            <div className="mt-0.5 text-[11px] italic text-white/50">{report.title}</div>
          )}
        </div>
        <div className="rounded-md border border-white/10 bg-ink-950/35 px-3 py-2 text-right">
          <div className="system-text text-[9px] text-white/35">FINAL</div>
          <div className="text-xs text-white/70">진행 {expeditionResult.progress} / 위험 {expeditionResult.risk}</div>
        </div>
      </div>

      {featuredShadow && (
        <div className="mt-3 rounded-md border border-amber-300/20 bg-amber-300/10 p-2">
          <div className="mb-1 system-text text-[9px] text-amber-100/55">FEATURED SHADOW</div>
          <ShadowMiniChip shadow={featuredShadow} active compact={compact} />
        </div>
      )}

      {/* Rewards */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-cyan-300/20 bg-cyan-400/10 p-2">
          <div className="system-text text-[9px] text-cyan-100/55">SHADOW XP</div>
          <div className="text-lg font-bold text-cyan-100">+{expeditionResult.shadowXpGained}</div>
        </div>
        <div className="rounded-md border border-purple-300/20 bg-purple-400/10 p-2">
          <div className="system-text text-[9px] text-purple-100/55">그림자 정수</div>
          <div className="text-lg font-bold text-purple-100">+{expeditionResult.essenceGained}</div>
        </div>
      </div>
      {expeditionResult.bonusRewards && expeditionResult.bonusRewards.length > 0 && (
        <div className="mt-2 rounded-md border border-amber-300/20 bg-amber-400/10 p-2 text-xs text-amber-100/80">
          {expeditionResult.bonusRewards.join(' / ')}
        </div>
      )}

      {/* 5-block report */}
      {!compact && report && (
        <div className="mt-3 space-y-1.5">
          <div className="rounded-md border border-white/8 bg-white/4 px-3 py-2">
            <div className="system-text text-[9px] text-white/35 mb-0.5">개요</div>
            <div className="text-xs leading-relaxed text-white/70">{report.overview}</div>
          </div>
          <div className="rounded-md border border-violet-300/15 bg-violet-400/6 px-3 py-2">
            <div className="system-text text-[9px] text-violet-200/45 mb-0.5">주목</div>
            <div className="text-xs leading-relaxed text-violet-100/80">{report.highlight}</div>
          </div>
          <div className="rounded-md border border-amber-300/15 bg-amber-400/6 px-3 py-2">
            <div className="system-text text-[9px] text-amber-200/45 mb-0.5">수확</div>
            <div className="text-xs leading-relaxed text-amber-100/75">{report.harvest}</div>
          </div>
          <div className="rounded-md border border-white/8 bg-white/4 px-3 py-2">
            <div className="system-text text-[9px] text-white/35 mb-0.5">마무리</div>
            <div className="text-xs leading-relaxed text-white/60 italic">{report.closing}</div>
          </div>
          {report.observation && (
            <div className="rounded-md border border-red-500/25 bg-red-950/10 px-3 py-2 animate-pulse">
              <div className="system-text text-[9px] text-red-400 font-extrabold mb-0.5 tracking-wider">📡 이상 관측 기록 (비공개 등급)</div>
              <div className="text-xs leading-relaxed text-red-300">{report.observation}</div>
            </div>
          )}
        </div>
      )}

      {/* Shadow portraits */}
      {!compact && selectedShadows.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {selectedShadows.map(shadow => (
            <div key={shadow.instanceId} className="min-w-[82px]">
              <ShadowPortrait
                shadow={shadow}
                size="xs"
                active={featuredShadow?.instanceId === shadow.instanceId || activeShadowId === shadow.instanceId}
                highlighted
                innateGrade={shadow.innateGrade}
              />
              <div className="mt-1 truncate text-[10px] text-white/60">{shadow.name}</div>
              <div className="system-text text-[8px] text-white/35">{SHADOW_ROLE_LABEL[shadow.role]}</div>
            </div>
          ))}
        </div>
      )}

      {isSpecial && expeditionResult.outcome === 'failure' && onRetry && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="btn font-bold text-xs py-2 px-6 flex items-center gap-1.5 justify-center border-purple-500 bg-purple-500/10 text-purple-100 hover:bg-purple-500/25"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            재진입 및 재도전
          </button>
        </div>
      )}
    </div>
  )
}
