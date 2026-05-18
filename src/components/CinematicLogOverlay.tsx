import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import clsx from 'clsx'

export type CinematicLogTone =
  | 'player'
  | 'shadow'
  | 'monster'
  | 'system'
  | 'reward'
  | 'risk'
  | 'command'
  | 'result'
  | 'defense'

export interface VisualDelta {
  target: 'player' | 'monster'
  hpChange: number
  newHp?: number
  maxHp?: number
}

export interface CinematicLogData {
  id: string
  tone: CinematicLogTone
  badge: string
  title: string
  body?: string
  visualDelta?: VisualDelta
}

interface CinematicLogOverlayProps {
  log?: CinematicLogData
  logs?: CinematicLogData[]
  mode?: 'gate' | 'expedition'
  visible?: boolean
  durationMs?: number
  intervalMs?: number
  position?: 'center' | 'battlefield'
  className?: string
  onDone?: () => void
  onComplete?: () => void
  onLogChange?: (log: CinematicLogData, index: number) => void
  skipSignal?: number
}

const toneClass: Record<CinematicLogTone, { frame: string; badge: string; title: string; flare: string }> = {
  player: {
    frame: 'border-cyan-300/35 bg-cyan-950/82 shadow-[0_0_32px_rgba(34,211,238,0.22)]',
    badge: 'border-cyan-200/35 bg-cyan-300/15 text-cyan-100',
    title: 'text-cyan-50',
    flare: 'from-cyan-300/40 via-cyan-100/10 to-transparent',
  },
  shadow: {
    frame: 'border-purple-300/40 bg-purple-950/84 shadow-[0_0_36px_rgba(168,85,247,0.28)]',
    badge: 'border-purple-200/40 bg-purple-300/15 text-purple-100',
    title: 'text-purple-50',
    flare: 'from-purple-300/45 via-fuchsia-200/10 to-transparent',
  },
  monster: {
    frame: 'border-rose-300/40 bg-rose-950/84 shadow-[0_0_36px_rgba(244,63,94,0.24)]',
    badge: 'border-rose-200/40 bg-rose-300/15 text-rose-100',
    title: 'text-rose-50',
    flare: 'from-rose-300/45 via-orange-200/10 to-transparent',
  },
  system: {
    frame: 'border-amber-300/30 bg-ink-950/86 shadow-[0_0_28px_rgba(251,191,36,0.14)]',
    badge: 'border-amber-200/30 bg-amber-300/12 text-amber-100',
    title: 'text-amber-50',
    flare: 'from-amber-300/32 via-white/8 to-transparent',
  },
  reward: {
    frame: 'border-emerald-300/38 bg-emerald-950/84 shadow-[0_0_34px_rgba(52,211,153,0.22)]',
    badge: 'border-emerald-200/40 bg-emerald-300/15 text-emerald-100',
    title: 'text-emerald-50',
    flare: 'from-emerald-300/42 via-amber-200/10 to-transparent',
  },
  risk: {
    frame: 'border-rose-300/42 bg-rose-950/86 shadow-[0_0_38px_rgba(244,63,94,0.28)]',
    badge: 'border-rose-200/40 bg-rose-300/16 text-rose-100',
    title: 'text-rose-50',
    flare: 'from-rose-400/45 via-red-200/10 to-transparent',
  },
  command: {
    frame: 'border-sky-300/35 bg-sky-950/82 shadow-[0_0_32px_rgba(56,189,248,0.2)]',
    badge: 'border-sky-200/35 bg-sky-300/14 text-sky-100',
    title: 'text-sky-50',
    flare: 'from-sky-300/40 via-cyan-100/10 to-transparent',
  },
  result: {
    frame: 'border-fuchsia-300/38 bg-fuchsia-950/84 shadow-[0_0_36px_rgba(217,70,239,0.24)]',
    badge: 'border-fuchsia-200/40 bg-fuchsia-300/15 text-fuchsia-100',
    title: 'text-fuchsia-50',
    flare: 'from-fuchsia-300/42 via-amber-200/10 to-transparent',
  },
  defense: {
    frame: 'border-blue-200/38 bg-blue-950/84 shadow-[0_0_34px_rgba(96,165,250,0.22)]',
    badge: 'border-blue-100/38 bg-blue-300/14 text-blue-100',
    title: 'text-blue-50',
    flare: 'from-blue-200/42 via-cyan-100/10 to-transparent',
  },
}

function highlightCinematicText(text: string) {
  const pattern = /([+-]?\d+(?:\.\d+)?\s*(?:피해|XP|정수|진행도|위험도)|(?:피해|XP|정수|진행도|위험도)\s*[+-]?\d+(?:\.\d+)?|[+-]\d+(?:\.\d+)?|치명타|회피|방어|반격|대성공|성공|실패|승리|패배)/g
  return text.split(pattern).filter(Boolean).map((part, index) => (
    part.match(pattern)
      ? <span key={`${part}-${index}`} className="text-white font-black">{part}</span>
      : <span key={`${part}-${index}`}>{part}</span>
  ))
}

export function CinematicLogOverlay({
  log,
  logs,
  visible = true,
  durationMs = 6500,
  intervalMs,
  position = 'center',
  className,
  onDone,
  onComplete,
  onLogChange,
  skipSignal,
}: CinematicLogOverlayProps) {
  const queue = useMemo(() => {
    if (logs && logs.length > 0) return logs
    return log ? [log] : []
  }, [log, logs])
  const queueKey = queue.map(item => item.id).join('|')
  const [active, setActive] = useState(Boolean(queue.length && visible))
  const [currentIndex, setCurrentIndex] = useState(0)
  const initialSkipSignal = useRef(skipSignal)
  const onDoneRef = useRef(onDone)
  const onCompleteRef = useRef(onComplete)
  const onLogChangeRef = useRef(onLogChange)
  const generationRef = useRef(0)
  const lastProcessedRef = useRef<{ generation: number; index: number } | null>(null)
  const currentLog = queue[currentIndex]
  const displayMs = intervalMs ?? durationMs

  useEffect(() => {
    onDoneRef.current = onDone
    onCompleteRef.current = onComplete
    onLogChangeRef.current = onLogChange
  }, [onComplete, onDone, onLogChange])

  useEffect(() => {
    if (queue.length === 0 || !visible) {
      setActive(false)
      setCurrentIndex(0)
      return
    }

    generationRef.current += 1
    lastProcessedRef.current = null
    setActive(true)
    setCurrentIndex(0)
  }, [queueKey, queue.length, visible])

  useEffect(() => {
    if (!currentLog || !visible || !active) return

    const myGeneration = generationRef.current

    const alreadyProcessed = lastProcessedRef.current?.generation === myGeneration && lastProcessedRef.current?.index === currentIndex
    if (!alreadyProcessed) {
      lastProcessedRef.current = { generation: myGeneration, index: currentIndex }
      onLogChangeRef.current?.(currentLog, currentIndex)
    }

    const timer = window.setTimeout(() => {
      if (generationRef.current !== myGeneration) return
      const nextIndex = currentIndex + 1
      if (nextIndex < queue.length) {
        setCurrentIndex(nextIndex)
        return
      }

      setActive(false)
      onDoneRef.current?.()
      onCompleteRef.current?.()
    }, displayMs)

    return () => window.clearTimeout(timer)
  }, [active, currentIndex, currentLog, displayMs, queue.length, visible])

  useEffect(() => {
    if (skipSignal === undefined || skipSignal === initialSkipSignal.current) return
    initialSkipSignal.current = skipSignal
    generationRef.current += 1
    setActive(false)
    onDoneRef.current?.()
    onCompleteRef.current?.()
  }, [skipSignal])

  if (!currentLog || !visible || !active) return null

  const tone = toneClass[currentLog.tone]
  const positionClass = position === 'battlefield'
    ? 'absolute left-1/2 top-[46%] z-30 w-[min(88%,460px)] -translate-x-1/2 -translate-y-1/2'
    : 'absolute left-1/2 top-[47%] z-30 w-[min(90%,520px)] -translate-x-1/2 -translate-y-1/2'

  return (
    <div
      key={currentLog.id}
      className={clsx('pointer-events-none cinematic-log-overlay', positionClass, className)}
      style={{ '--cinematic-exit-delay': `${Math.max(0, displayMs - 320)}ms` } as CSSProperties}
      aria-live="polite"
    >
      <div className={clsx('relative overflow-hidden rounded-lg border px-4 py-3 text-center backdrop-blur-md sm:px-5 sm:py-4', tone.frame)}>
        <div className={clsx('absolute inset-x-0 top-0 h-px bg-gradient-to-r', tone.flare)} />
        <div className={clsx('mx-auto mb-2 inline-flex items-center rounded border px-2 py-0.5 text-[10px] system-text tracking-wide', tone.badge)}>
          {currentLog.badge}
        </div>
        <div className={clsx('text-sm font-black leading-snug sm:text-lg line-clamp-2', tone.title)}>
          {highlightCinematicText(currentLog.title)}
        </div>
        {currentLog.body && (
          <div className="mt-1 text-[11px] font-semibold leading-snug text-white/72 sm:text-sm line-clamp-2">
            {highlightCinematicText(currentLog.body)}
          </div>
        )}
      </div>
    </div>
  )
}
