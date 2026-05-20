import clsx from 'clsx'
import { Activity, AlertTriangle, Crosshair, Shield } from 'lucide-react'
import type { MonsterIntent, MonsterIntentTone } from '../lib/combatIntent'

const intentToneMeta: Record<MonsterIntentTone, { className: string; Icon: typeof AlertTriangle }> = {
  danger: {
    className: 'border-rose-300/35 bg-rose-400/10 text-rose-100 shadow-[0_0_18px_rgba(251,113,133,0.08)]',
    Icon: AlertTriangle,
  },
  guard: {
    className: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
    Icon: Shield,
  },
  weakness: {
    className: 'border-amber-300/35 bg-amber-400/10 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.08)]',
    Icon: Crosshair,
  },
  unstable: {
    className: 'border-purple-300/30 bg-purple-400/10 text-purple-100',
    Icon: Activity,
  },
}

export function MonsterIntentPanel({ intent, compact = false }: { intent: MonsterIntent; compact?: boolean }) {
  const meta = intentToneMeta[intent.tone]
  const Icon = meta.Icon

  return (
    <div className={clsx('rounded-md border px-3 py-2', meta.className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="system-text text-[10px] text-white/55">MONSTER INTENT</span>
            <span className="truncate text-sm font-bold">{intent.label}</span>
          </div>
          {!compact && <div className="mt-1 text-[11px] leading-snug text-white/58">{intent.summary}</div>}
        </div>
        <div className="shrink-0 rounded border border-white/12 bg-black/15 px-2 py-1 text-[10px] system-text text-white/62">
          {intent.responseHint}
        </div>
      </div>
    </div>
  )
}
