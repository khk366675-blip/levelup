import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { FastForward, X } from 'lucide-react'

export type DramaticRevealTone =
  | 'shadow'
  | 'box'
  | 'tower'
  | 'skill'
  | 'rank'
  | 'success'
  | 'failure'

export interface RevealStep {
  title?: string
  text: string
  subtext?: string
  durationMs?: number
  tone?: DramaticRevealTone
  icon?: ReactNode
  emphasis?: boolean
}

interface DramaticRevealProps {
  steps: RevealStep[]
  tone?: DramaticRevealTone
  isOpen: boolean
  onComplete?: () => void
  onSkip?: () => void
  compact?: boolean
  position?: 'modal' | 'inline' | 'overlay'
  className?: string
  result?: ReactNode
}

const toneClass: Record<DramaticRevealTone, { frame: string; badge: string; title: string; flare: string; wash: string }> = {
  shadow: {
    frame: 'border-purple-300/40 bg-purple-950/86 shadow-[0_0_42px_rgba(168,85,247,0.28)]',
    badge: 'border-purple-200/35 bg-purple-300/15 text-purple-100',
    title: 'text-purple-50',
    flare: 'from-purple-300/65 via-fuchsia-200/20 to-transparent',
    wash: 'bg-[radial-gradient(circle_at_50%_22%,rgba(168,85,247,0.24),transparent_42%)]',
  },
  box: {
    frame: 'border-amber-300/45 bg-amber-950/82 shadow-[0_0_44px_rgba(245,158,11,0.26)]',
    badge: 'border-amber-200/40 bg-amber-300/15 text-amber-100',
    title: 'text-amber-50',
    flare: 'from-amber-200/70 via-cyan-100/16 to-transparent',
    wash: 'bg-[radial-gradient(circle_at_50%_18%,rgba(251,191,36,0.24),transparent_42%)]',
  },
  tower: {
    frame: 'border-violet-300/45 bg-violet-950/86 shadow-[0_0_46px_rgba(139,92,246,0.3)]',
    badge: 'border-violet-200/40 bg-violet-300/15 text-violet-100',
    title: 'text-violet-50',
    flare: 'from-violet-200/65 via-amber-200/16 to-transparent',
    wash: 'bg-[radial-gradient(circle_at_50%_18%,rgba(139,92,246,0.25),transparent_44%)]',
  },
  skill: {
    frame: 'border-cyan-300/42 bg-cyan-950/84 shadow-[0_0_38px_rgba(34,211,238,0.24)]',
    badge: 'border-cyan-200/38 bg-cyan-300/14 text-cyan-100',
    title: 'text-cyan-50',
    flare: 'from-cyan-200/62 via-sky-100/14 to-transparent',
    wash: 'bg-[radial-gradient(circle_at_50%_18%,rgba(34,211,238,0.22),transparent_42%)]',
  },
  rank: {
    frame: 'border-rose-300/45 bg-rose-950/86 shadow-[0_0_46px_rgba(248,113,113,0.28)]',
    badge: 'border-rose-200/40 bg-rose-300/15 text-rose-100',
    title: 'text-rose-50',
    flare: 'from-rose-200/68 via-amber-200/16 to-transparent',
    wash: 'bg-[radial-gradient(circle_at_50%_18%,rgba(248,113,113,0.24),transparent_42%)]',
  },
  success: {
    frame: 'border-emerald-300/42 bg-emerald-950/84 shadow-[0_0_40px_rgba(52,211,153,0.22)]',
    badge: 'border-emerald-200/38 bg-emerald-300/14 text-emerald-100',
    title: 'text-emerald-50',
    flare: 'from-emerald-200/62 via-cyan-100/12 to-transparent',
    wash: 'bg-[radial-gradient(circle_at_50%_18%,rgba(52,211,153,0.2),transparent_42%)]',
  },
  failure: {
    frame: 'border-slate-300/30 bg-slate-950/88 shadow-[0_0_34px_rgba(148,163,184,0.14)]',
    badge: 'border-slate-200/25 bg-slate-300/10 text-slate-100',
    title: 'text-slate-50',
    flare: 'from-slate-200/40 via-purple-100/10 to-transparent',
    wash: 'bg-[radial-gradient(circle_at_50%_18%,rgba(148,163,184,0.14),transparent_42%)]',
  },
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  return reduced
}

export function DramaticReveal({
  steps,
  tone = 'success',
  isOpen,
  onComplete,
  onSkip,
  compact = false,
  position = 'modal',
  className,
  result,
}: DramaticRevealProps) {
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const generationRef = useRef(0)
  const completeRef = useRef(onComplete)
  const skipRef = useRef(onSkip)
  const safeSteps = useMemo(() => steps.filter(step => step.text.trim().length > 0), [steps])
  const current = safeSteps[index]
  const currentTone = toneClass[current?.tone ?? tone]

  useEffect(() => {
    completeRef.current = onComplete
    skipRef.current = onSkip
  }, [onComplete, onSkip])

  useEffect(() => {
    if (!isOpen) {
      setIndex(0)
      setDone(false)
      return
    }
    generationRef.current += 1
    setIndex(0)
    setDone(false)
  }, [isOpen, safeSteps.length])

  useEffect(() => {
    if (!isOpen || done || safeSteps.length === 0) return
    const myGeneration = generationRef.current
    const duration = reducedMotion ? 90 : current?.durationMs ?? (compact ? 720 : 1050)
    const timer = window.setTimeout(() => {
      if (generationRef.current !== myGeneration) return
      if (index + 1 < safeSteps.length) {
        setIndex(index + 1)
        return
      }
      setDone(true)
    }, duration)
    return () => window.clearTimeout(timer)
  }, [compact, current?.durationMs, done, index, isOpen, reducedMotion, safeSteps.length])

  if (!isOpen || !current) return null

  const finish = () => {
    generationRef.current += 1
    setDone(true)
    completeRef.current?.()
  }

  const skip = () => {
    skipRef.current?.()
    finish()
  }

  const frame = (
    <div
      className={clsx(
        'dramatic-reveal relative overflow-hidden rounded-lg border backdrop-blur-md',
        compact ? 'px-3 py-3' : 'px-5 py-5 sm:px-6',
        currentTone.frame,
      )}
      aria-live="polite"
    >
      <div className={clsx('pointer-events-none absolute inset-0', currentTone.wash)} />
      <div className={clsx('pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r', currentTone.flare)} />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-16 bg-gradient-to-b from-white/8 to-transparent opacity-70" />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className={clsx('inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] system-text', currentTone.badge)}>
            {current.icon}
            {current.title ?? tone.toUpperCase()}
          </div>
          <button
            type="button"
            onClick={skip}
            className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] system-text text-white/50 transition hover:bg-white/10 hover:text-white/75"
          >
            <FastForward className="h-3 w-3" />
            Skip
          </button>
        </div>

        <div
          key={`${index}-${current.text}`}
          className={clsx('dramatic-reveal-step text-center', current.emphasis && 'dramatic-reveal-emphasis')}
        >
          <div className={clsx('font-black leading-snug', compact ? 'text-sm' : 'text-xl sm:text-2xl', currentTone.title)}>
            {current.text}
          </div>
          {current.subtext && (
            <div className={clsx('mx-auto mt-2 max-w-md leading-relaxed text-white/62', compact ? 'text-[11px]' : 'text-sm')}>
              {current.subtext}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center gap-1.5">
          {safeSteps.map((_, stepIndex) => (
            <span
              key={stepIndex}
              className={clsx(
                'h-1 rounded-full transition-all',
                stepIndex === index ? 'w-7 bg-white/70' : stepIndex < index ? 'w-3 bg-white/35' : 'w-3 bg-white/12',
              )}
            />
          ))}
        </div>

        {done && result && (
          <div className="dramatic-reveal-result mt-4 border-t border-white/10 pt-4">
            {result}
          </div>
        )}

        {done && (
          <button
            type="button"
            onClick={finish}
            className="mx-auto mt-4 flex min-h-9 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-4 text-xs font-bold text-white transition hover:bg-white/15"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </button>
        )}
      </div>
    </div>
  )

  if (position === 'inline') {
    return <div className={clsx('relative', className)}>{frame}</div>
  }

  if (position === 'overlay') {
    return <div className={clsx('absolute inset-0 z-40 flex items-center justify-center p-3 bg-black/35', className)}>{frame}</div>
  }

  return (
    <div className={clsx('fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm', className)}>
      <div className="w-full max-w-lg">{frame}</div>
    </div>
  )
}
