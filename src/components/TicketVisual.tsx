import clsx from 'clsx'
import { useState } from 'react'
import { getTicketVisualAsset, type TicketVisual } from '../lib/ticketVisuals'

type TicketVisualProps = {
  visual: TicketVisual
}

export function TicketVisual({ visual }: TicketVisualProps) {
  const asset = getTicketVisualAsset(visual.key)
  const [failed, setFailed] = useState(false)
  const isExchange = visual.artKind === 'exchange'

  return (
    <div
      className={clsx(
        'relative mx-auto aspect-[3/4] w-full max-w-[116px] overflow-hidden rounded-md border bg-slate-950/[0.92]',
        'border-cyan-100/14 shadow-[inset_0_0_24px_rgba(0,0,0,0.58),0_12px_26px_rgba(0,0,0,0.28)]',
        isExchange && 'border-emerald-200/18',
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.22),rgba(88,28,135,0.12)_42%,rgba(2,6,23,0.94)_78%)]" />
      <div className={clsx('absolute inset-2 rounded bg-black/28 blur-md', isExchange ? 'shadow-[0_0_36px_rgba(16,185,129,0.2)]' : 'shadow-[0_0_34px_rgba(34,211,238,0.18)]')} />
      {asset && !failed ? (
        <div className="absolute inset-0 grid place-items-center overflow-hidden rounded-[5px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_7%,black_93%,transparent_100%)]">
          <img
            src={asset}
            alt=""
            className={clsx(
              'relative z-10 h-full w-full scale-[1.08] object-contain p-0.5 opacity-[0.96]',
              '[filter:brightness(0.9)_contrast(1.12)_saturate(1.08)_drop-shadow(0_0_14px_rgba(34,211,238,0.18))]',
              isExchange && 'scale-[1.12] [filter:brightness(0.88)_contrast(1.14)_saturate(1.08)_drop-shadow(0_0_16px_rgba(16,185,129,0.2))]',
            )}
            onError={() => setFailed(true)}
          />
        </div>
      ) : (
        <FallbackTicketArt visual={visual} />
      )}
      <div className="pointer-events-none absolute inset-0 rounded-md shadow-[inset_0_0_30px_rgba(2,6,23,0.72),inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
      <div className="pointer-events-none absolute inset-x-3 top-2 h-px bg-gradient-to-r from-transparent via-cyan-100/24 to-transparent" />
      <div className="pointer-events-none absolute inset-x-3 bottom-2 h-px bg-gradient-to-r from-transparent via-slate-200/16 to-transparent" />
    </div>
  )
}

function FallbackTicketArt({ visual }: TicketVisualProps) {
  const isShadow = visual.artKind === 'shadow' || visual.artKind === 'rare-shadow'
  const isGear = ['weapon', 'armor', 'accessory', 'relic', 'rare-gear', 'bundle'].includes(visual.artKind)

  return (
    <svg className="h-full w-full" viewBox="0 0 240 96" role="img" aria-hidden="true">
      <defs>
        <radialGradient id={`${visual.key}-core`} cx="50%" cy="52%" r="52%">
          <stop offset="0%" stopColor={isShadow ? '#a78bfa' : '#facc15'} stopOpacity="0.9" />
          <stop offset="45%" stopColor={isShadow ? '#22d3ee' : '#38bdf8'} stopOpacity="0.28" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${visual.key}-slash`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="240" height="96" fill="#020617" />
      <circle cx="120" cy="50" r="46" fill={`url(#${visual.key}-core)`} />
      <path d="M26 74 C72 18, 162 18, 214 72" fill="none" stroke="#67e8f9" strokeOpacity="0.24" strokeWidth="1.4" />
      <path d="M30 26 C82 70, 158 70, 210 24" fill="none" stroke="#c084fc" strokeOpacity="0.18" strokeWidth="1.2" />
      {[0, 1, 2].map(index => (
        <circle
          key={index}
          cx="120"
          cy="50"
          r={20 + index * 10}
          fill="none"
          stroke={isShadow ? '#22d3ee' : '#fde68a'}
          strokeDasharray={index === 1 ? '4 5' : '2 8'}
          strokeOpacity={0.24 - index * 0.04}
        />
      ))}
      <path d="M-20 94 L94 -8 L122 -8 L8 94 Z" fill={`url(#${visual.key}-slash)`} opacity="0.75" />
      {isShadow && (
        <g className={clsx(visual.artKind === 'rare-shadow' && 'drop-shadow-[0_0_10px_rgba(250,204,21,0.45)]')}>
          <path d="M120 22 C101 32, 92 48, 98 68 C105 58, 112 57, 120 75 C128 57, 135 58, 142 68 C148 48, 139 32, 120 22 Z" fill="#020617" fillOpacity="0.78" stroke={visual.artKind === 'rare-shadow' ? '#facc15' : '#22d3ee'} strokeOpacity="0.52" />
          <path d="M82 58 C103 47, 113 50, 120 62 C127 50, 137 47, 158 58" fill="none" stroke="#e0f2fe" strokeOpacity="0.28" strokeWidth="2" />
          <circle cx="111" cy="47" r="2" fill="#67e8f9" opacity="0.9" />
          <circle cx="129" cy="47" r="2" fill="#67e8f9" opacity="0.9" />
        </g>
      )}
      {isGear && (
        <g>
          {visual.artKind === 'weapon' && <path d="M121 18 L131 50 L119 80 L109 50 Z" fill="#e5e7eb" fillOpacity="0.76" stroke="#fb7185" strokeOpacity="0.65" />}
          {visual.artKind === 'armor' && <path d="M120 20 L150 32 L144 66 L120 80 L96 66 L90 32 Z" fill="#1e3a8a" fillOpacity="0.72" stroke="#93c5fd" strokeOpacity="0.7" />}
          {visual.artKind === 'accessory' && <circle cx="120" cy="50" r="20" fill="none" stroke="#c084fc" strokeWidth="8" strokeOpacity="0.72" />}
          {visual.artKind === 'relic' && <path d="M98 72 L110 22 H130 L142 72 Z" fill="#92400e" fillOpacity="0.62" stroke="#facc15" strokeOpacity="0.78" />}
          {visual.artKind === 'rare-gear' && <path d="M120 18 L150 42 L138 76 H102 L90 42 Z" fill="#083344" fillOpacity="0.75" stroke="#fde68a" strokeOpacity="0.82" />}
          {visual.artKind === 'bundle' && <path d="M92 38 H148 L140 76 H100 Z M104 26 H136 L148 38 H92 Z" fill="#082f49" fillOpacity="0.76" stroke="#7dd3fc" strokeOpacity="0.68" />}
        </g>
      )}
      {!isShadow && !isGear && (
        <g>
          <circle cx="120" cy="50" r="20" fill="#581c87" fillOpacity="0.62" stroke="#c084fc" strokeOpacity="0.72" />
          <path d="M120 30 L132 50 L120 70 L108 50 Z" fill="#67e8f9" fillOpacity="0.55" />
        </g>
      )}
      <text x="16" y="82" fill="#e2e8f0" fillOpacity="0.52" fontSize="9" fontFamily="monospace" letterSpacing="2">
        {visual.glyph}
      </text>
    </svg>
  )
}
