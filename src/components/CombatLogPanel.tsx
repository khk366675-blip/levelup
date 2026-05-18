import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { List } from 'lucide-react'

export type CombatLogEntryTone =
  | 'player'
  | 'shadow'
  | 'monster'
  | 'system'
  | 'reward'
  | 'risk'
  | 'command'
  | 'result'
  | 'defense'

export interface CombatLogEntry {
  id: string
  message: string
  tone?: CombatLogEntryTone
  label?: string
  turn?: number | string
  wave?: number
  meta?: string
  actorName?: string
  actorNode?: ReactNode
  icon?: ReactNode
}

interface CombatLogPanelProps {
  logs: CombatLogEntry[]
  title?: string
  subtitle?: string
  maxVisible?: number
  compact?: boolean
  latestFirst?: boolean
  highlightLatest?: boolean
  defaultExpanded?: boolean
  emptyText?: string
  className?: string
}

const toneMeta: Record<CombatLogEntryTone, { label: string; frame: string; chip: string; rail: string }> = {
  player: {
    label: '헌터',
    frame: 'border-cyan-400/20 bg-cyan-400/7 text-cyan-50/85',
    chip: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
    rail: 'border-l-cyan-300/60',
  },
  shadow: {
    label: '그림자',
    frame: 'border-purple-400/25 bg-purple-400/10 text-purple-50/85',
    chip: 'border-purple-300/30 bg-purple-400/10 text-purple-100',
    rail: 'border-l-purple-300/70',
  },
  monster: {
    label: '몬스터',
    frame: 'border-rose-400/25 bg-rose-400/10 text-rose-50/85',
    chip: 'border-rose-300/30 bg-rose-400/10 text-rose-100',
    rail: 'border-l-rose-300/70',
  },
  system: {
    label: '시스템',
    frame: 'border-amber-400/20 bg-amber-400/8 text-amber-50/80',
    chip: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
    rail: 'border-l-amber-300/55',
  },
  reward: {
    label: '보상',
    frame: 'border-emerald-400/22 bg-emerald-400/9 text-emerald-50/85',
    chip: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
    rail: 'border-l-emerald-300/70',
  },
  risk: {
    label: '위험',
    frame: 'border-rose-400/25 bg-rose-500/10 text-rose-50/85',
    chip: 'border-rose-300/30 bg-rose-500/10 text-rose-100',
    rail: 'border-l-rose-300/70',
  },
  command: {
    label: '명령',
    frame: 'border-sky-400/22 bg-sky-400/9 text-sky-50/85',
    chip: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
    rail: 'border-l-sky-300/70',
  },
  result: {
    label: '결과',
    frame: 'border-fuchsia-400/22 bg-fuchsia-400/9 text-fuchsia-50/85',
    chip: 'border-fuchsia-300/30 bg-fuchsia-400/10 text-fuchsia-100',
    rail: 'border-l-fuchsia-300/70',
  },
  defense: {
    label: '방어',
    frame: 'border-blue-300/22 bg-blue-400/9 text-blue-50/85',
    chip: 'border-blue-200/30 bg-blue-400/10 text-blue-100',
    rail: 'border-l-blue-200/70',
  },
}

const highlightPattern =
  /([+-]?\d+(?:\.\d+)?\s*(?:피해|HP|XP|정수|진행도|위험도)|(?:피해|HP|XP|정수|진행도|위험도)\s*[+-]?\d+(?:\.\d+)?|[+-]\d+(?:\.\d+)?|치명타|치명|회피|방어|반격|막았|보상|획득|승리|패배|대성공|부분 성공|성공|실패|위험도|진행도|그림자)/g

function renderHighlightedMessage(message: string) {
  const parts = message.split(highlightPattern).filter(Boolean)
  return parts.map((part, index) => {
    if (!part.match(highlightPattern)) return <span key={`${part}-${index}`}>{part}</span>

    const isDanger = part.includes('위험') || part.includes('피해') || part.includes('패배') || part.includes('실패')
    const isReward = part.includes('보상') || part.includes('획득') || part.includes('XP') || part.includes('정수')
    const isShadow = part.includes('그림자')
    const className = isDanger
      ? 'text-rose-100 font-semibold'
      : isReward
        ? 'text-emerald-100 font-semibold'
        : isShadow
          ? 'text-purple-100 font-semibold'
          : 'text-cyan-100 font-semibold'

    return <span key={`${part}-${index}`} className={className}>{part}</span>
  })
}

export function CombatLogPanel({
  logs,
  title = 'COMBAT LOG',
  subtitle,
  maxVisible = 6,
  compact = false,
  latestFirst = true,
  highlightLatest = true,
  defaultExpanded = false,
  emptyText = '아직 기록된 로그가 없습니다.',
  className,
}: CombatLogPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const orderedLogs = latestFirst ? [...logs].reverse() : logs
  const recentLogs = latestFirst ? orderedLogs.slice(0, maxVisible) : orderedLogs.slice(-maxVisible)
  const visibleLogs = expanded ? orderedLogs : recentLogs
  const latestId = logs.at(-1)?.id
  const previousId = logs.at(-2)?.id
  const canExpand = logs.length > maxVisible

  return (
    <div className={clsx('rounded-lg border border-white/10 bg-ink-950/30 p-3', className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="system-text text-[11px] text-cyan-200/75">{title}</div>
          {subtitle && <div className="mt-0.5 truncate text-[10px] text-white/38">{subtitle}</div>}
        </div>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded(prev => !prev)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded border border-cyan-400/25 bg-cyan-400/10 px-2 py-1 text-[10px] system-text text-cyan-100 transition hover:bg-cyan-400/15"
          >
            <List className="h-3 w-3" />
            {expanded ? '로그 접기' : `전체 ${logs.length}`}
          </button>
        )}
      </div>

      <div className={clsx('space-y-2 overflow-y-auto pr-1', expanded ? 'max-h-72' : compact ? 'max-h-52' : 'max-h-60')}>
        {visibleLogs.length === 0 && (
          <div className="rounded-md border border-cyan-400/20 bg-cyan-400/5 px-3 py-3 text-xs text-cyan-100/60 system-text">
            {emptyText}
          </div>
        )}
        {visibleLogs.map(log => {
          const tone = toneMeta[log.tone ?? 'system']
          const isLatest = highlightLatest && log.id === latestId
          const isPrevious = highlightLatest && log.id === previousId

          return (
            <div
              key={log.id}
              className={clsx(
                'border-l-2 rounded-md border px-3 py-2 text-xs leading-relaxed transition',
                tone.frame,
                tone.rail,
                isLatest && 'combat-log-latest ring-1 ring-white/15',
                isPrevious && !isLatest && 'opacity-90',
                !isLatest && !isPrevious && 'opacity-75',
                compact && 'py-2',
              )}
            >
              <div className="flex gap-2">
                {log.actorNode && <div className="shrink-0">{log.actorNode}</div>}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    {log.icon && <span className="text-white/45">{log.icon}</span>}
                    {log.turn !== undefined && <span className="system-text text-[9px] text-cyan-200/55">#{log.turn}</span>}
                    {log.wave !== undefined && (
                      <span className="rounded border border-cyan-400/25 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] system-text text-cyan-100/80">
                        W{log.wave}
                      </span>
                    )}
                    <span className={clsx('rounded border px-1.5 py-0.5 text-[9px] system-text', tone.chip)}>
                      {log.label ?? tone.label}
                    </span>
                    {log.actorName && <span className="truncate text-[10px] font-semibold text-white/65">{log.actorName}</span>}
                    {log.meta && <span className="text-[9px] system-text text-white/35">{log.meta}</span>}
                  </div>
                  <p className={clsx('text-white/78', compact ? 'line-clamp-2' : 'line-clamp-3')}>
                    {renderHighlightedMessage(log.message)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
