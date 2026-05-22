import clsx from 'clsx'
import type { CSSProperties } from 'react'
import type { ShadowRarity, ShadowRole } from '../../lib/types'

/**
 * 12-24H — Locked Named Shadow Portrait
 *
 * 봉인된 네임드/성취 그림자 카드 전용 비주얼. 실제 portrait/이름/효과는
 * 노출하지 않고, 역할 silhouette hint + sealed sigil + halo/rift motif로
 * "봉인된 전설" 느낌을 만든다.
 *
 * 정책:
 * - 절대로 실제 PNG asset을 불러오지 않는다.
 * - 역할(role) 분위기만 매우 흐릿한 silhouette hint로 표현.
 * - sourceType에 따라 named_gate / named_achievement seal을 분리한다.
 * - CSS animation은 prefers-reduced-motion에서 비활성화된다 (index.css).
 */

type LockedPortraitSize = 'sm' | 'md' | 'lg'
type LockedSourceType = 'named_gate' | 'named_achievement'

type Props = {
  role: ShadowRole
  rarity: ShadowRarity
  sourceType: LockedSourceType
  size?: LockedPortraitSize
  className?: string
  maskDetails?: boolean
}

const sizeClass: Record<LockedPortraitSize, string> = {
  sm: 'h-20',
  md: 'h-32',
  lg: 'h-44',
}

const roleBadge: Record<ShadowRole, string> = {
  assault: 'ASSAULT',
  guard: 'GUARD',
  scout: 'SCOUT',
  analyst: 'ANALYST',
  support: 'SUPPORT',
  hunter: 'HUNTER',
}

// 역할별 봉인 실루엣 hint. 정체를 드러내지 않을 정도로만 표현.
const RoleHint = ({ role, accent }: { role: ShadowRole; accent: string }) => {
  const opacity = 0.34
  if (role === 'guard') {
    return (
      <g opacity={opacity}>
        <path d="M58 30 L80 40 L80 78 C80 92 70 102 58 108 C46 102 36 92 36 78 L36 40 Z" fill={accent} opacity="0.18" />
        <path d="M58 30 L80 40 L80 78 C80 92 70 102 58 108 C46 102 36 92 36 78 L36 40 Z" fill="none" stroke={accent} strokeWidth="1.1" />
      </g>
    )
  }
  if (role === 'scout') {
    return (
      <g opacity={opacity}>
        <path d="M58 30 L48 52 L42 90 L58 100 L74 90 L68 52 Z" fill={accent} opacity="0.15" />
        <path d="M44 56 L36 76 M72 56 L80 76" stroke={accent} strokeWidth="1.4" strokeLinecap="round" />
      </g>
    )
  }
  if (role === 'analyst') {
    return (
      <g opacity={opacity}>
        <path d="M40 38 L76 38 L76 96 L40 96 Z" fill={accent} opacity="0.14" />
        <path d="M44 50 L72 50 M44 60 L72 60 M44 70 L66 70 M44 80 L72 80" stroke={accent} strokeWidth="0.9" strokeLinecap="round" />
      </g>
    )
  }
  if (role === 'support') {
    return (
      <g opacity={opacity}>
        <path d="M58 28 L58 104" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M58 36 L78 44 L58 54 L38 44 Z" fill={accent} opacity="0.18" />
        <path d="M58 36 L78 44 L58 54 L38 44 Z" fill="none" stroke={accent} strokeWidth="1" />
      </g>
    )
  }
  if (role === 'hunter') {
    return (
      <g opacity={opacity}>
        <path d="M28 80 C36 60 50 52 58 52 C66 52 80 60 88 80 L82 100 L34 100 Z" fill={accent} opacity="0.16" />
        <circle cx="50" cy="74" r="2" fill={accent} />
        <circle cx="66" cy="74" r="2" fill={accent} />
      </g>
    )
  }
  // assault default
  return (
    <g opacity={opacity}>
      <path d="M58 28 L62 60 L70 100 L46 100 L54 60 Z" fill={accent} opacity="0.16" />
      <path d="M58 24 L58 96" stroke={accent} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M48 36 L68 36" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  )
}

// Named Gate 전용: 균열/포털 봉인 seal
const GateSeal = ({ accent }: { accent: string }) => (
  <g aria-hidden>
    {/* 균열 라인 (위/아래에서 중앙으로 모이는 느낌) */}
    <path d="M58 12 L52 36 L58 52 L64 36 Z" fill={accent} opacity="0.22" />
    <path d="M58 116 L52 92 L58 76 L64 92 Z" fill={accent} opacity="0.18" />
    <path d="M30 64 L46 60 L54 64 L46 68 Z" fill={accent} opacity="0.16" />
    <path d="M86 64 L70 60 L62 64 L70 68 Z" fill={accent} opacity="0.16" />
    {/* 회전하는 sigil ring */}
    <circle cx="58" cy="64" r="44" fill="none" stroke={accent} strokeWidth="1.1" strokeDasharray="3 6" opacity="0.5" />
    <circle cx="58" cy="64" r="34" fill="none" stroke={accent} strokeWidth="0.9" strokeDasharray="6 4" opacity="0.4" />
    {/* portal hex */}
    <path d="M58 22 L86 40 L86 88 L58 106 L30 88 L30 40 Z" fill="none" stroke={accent} strokeWidth="1.2" strokeDasharray="4 6" opacity="0.55" />
  </g>
)

// Achievement Named 전용: 왕관 halo + 월계수 seal
const AchievementSeal = ({ accent }: { accent: string }) => (
  <g aria-hidden>
    {/* 왕관 halo */}
    <path d="M40 36 L46 24 L52 34 L58 22 L64 34 L70 24 L76 36 L72 44 L44 44 Z" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.7" />
    <circle cx="46" cy="24" r="1.8" fill={accent} opacity="0.7" />
    <circle cx="58" cy="22" r="2.2" fill={accent} opacity="0.85" />
    <circle cx="70" cy="24" r="1.8" fill={accent} opacity="0.7" />
    {/* 봉인 ring */}
    <circle cx="58" cy="68" r="44" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="2 6" opacity="0.42" />
    <circle cx="58" cy="68" r="34" fill="none" stroke={accent} strokeWidth="0.8" strokeDasharray="6 6" opacity="0.32" />
    {/* 월계수 호선 */}
    <path d="M22 78 C30 96 44 104 58 104 C72 104 86 96 94 78" fill="none" stroke={accent} strokeWidth="1.1" opacity="0.45" />
    <path d="M26 76 L30 80 M32 80 L34 84 M82 84 L86 80 M88 80 L92 76" stroke={accent} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
  </g>
)

const rarityAccent: Record<ShadowRarity, string> = {
  common: '#94a3b8',
  uncommon: '#34d399',
  rare: '#22d3ee',
  epic: '#a78bfa',
  legendary: '#f59e0b',
}

export function LockedShadowPortrait({
  role,
  rarity,
  sourceType,
  size = 'md',
  className,
  maskDetails = false,
}: Props) {
  const isGate = sourceType === 'named_gate'
  // Gate: gold + violet/teal. Achievement: cyan + gold halo.
  const primaryAccent = isGate ? '#f59e0b' : '#22d3ee'
  const secondaryAccent = isGate ? '#a78bfa' : '#f59e0b'
  const roleAccent = maskDetails ? '#94a3b8' : rarityAccent[rarity]

  const style = {
    '--locked-primary': primaryAccent,
    '--locked-secondary': secondaryAccent,
  } as CSSProperties

  return (
    <div
      className={clsx(
        'locked-named-portrait relative isolate overflow-hidden rounded-md border bg-ink-950/85',
        sizeClass[size],
        isGate ? 'locked-seal-gate border-amber-300/40' : 'locked-seal-achievement border-cyan-200/40',
        className,
      )}
      style={style}
      aria-label={isGate ? 'Sealed gate named shadow' : 'Sealed achievement shadow'}
      role="img"
    >
      {/* 1. 배경 안개 layer */}
      <div className="locked-seal-mist absolute inset-0" />

      {/* 2. SVG seal + role hint */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 116 128" aria-hidden>
        <defs>
          <radialGradient id="lockedHaze" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={primaryAccent} stopOpacity="0.18" />
            <stop offset="60%" stopColor={primaryAccent} stopOpacity="0.04" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="116" height="128" fill="url(#lockedHaze)" />
        {/* Generic sealed silhouette. Specific hints stay hidden until obtained. */}
        <RoleHint role={maskDetails ? 'support' : role} accent={roleAccent} />
        {/* seal motif */}
        {isGate ? <GateSeal accent={primaryAccent} /> : <AchievementSeal accent={primaryAccent} />}
        {/* secondary accent ring (teal/violet 또는 gold) */}
        <circle cx="58" cy="64" r="50" fill="none" stroke={secondaryAccent} strokeWidth="0.6" strokeDasharray="1 5" opacity="0.35" />
      </svg>

      {/* 3. 회전 sigil overlay (CSS animated) */}
      <div className="locked-seal-rune-rotate absolute inset-2 rounded-full" aria-hidden />

      {/* 4. 중앙 자물쇠 ??? (선명한 텍스트가 아닌 봉인 표식) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className="system-text text-[18px] tracking-[0.4em] text-white/45"
          style={{ textShadow: `0 0 8px ${primaryAccent}80` }}
        >
          ???
        </span>
      </div>

      {/* 5. 좌상단 role badge + source 배지 */}
      <div className="absolute left-2 top-2 flex items-center gap-1">
        {!maskDetails && (
          <span
            className="rounded border px-1.5 py-0.5 text-[8px] system-text text-white/70"
            style={{ borderColor: `${roleAccent}80`, background: 'rgba(2,6,23,0.55)' }}
          >
            {roleBadge[role]}
          </span>
        )}
        <span
          className={clsx(
            'rounded border px-1.5 py-0.5 text-[8px] system-text',
            isGate
              ? 'border-amber-300/55 bg-amber-300/15 text-amber-100'
              : 'border-cyan-200/45 bg-cyan-200/15 text-cyan-100',
          )}
        >
          {maskDetails ? 'SIGNAL' : isGate ? 'GATE NAMED' : 'ACHIEVEMENT'}
        </span>
      </div>

      {/* 6. 우상단 SEALED 표식 */}
      <div className="absolute right-2 top-2">
        <span
          className={clsx(
            'rounded border px-1.5 py-0.5 text-[8px] system-text',
            isGate
              ? 'border-amber-300/45 bg-amber-300/10 text-amber-200/85'
              : 'border-cyan-200/40 bg-cyan-200/10 text-cyan-100/85',
          )}
        >
          SEALED
        </span>
      </div>
    </div>
  )
}
