import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useReducedMotion } from 'framer-motion'
import { FastForward, Flame, Gem, PackageOpen, ScrollText, Shield, Sword, Ticket } from 'lucide-react'

type RevealKind = 'shadow' | 'equipment'
type RevealIntensity = 'quick' | 'rare' | 'epic' | 'apex'

type TicketRevealSequenceProps = {
  kind: RevealKind
  intensity: RevealIntensity
  title: string
  signalGrade?: string
  shadowRarity?: string
  equipRarity?: string
  starCount?: number
  featuredSlot?: 'weapon' | 'armor' | 'accessory' | 'artifact'
  onComplete: () => void
}

// ── stage sequences ──────────────────────────────────────────────────────
const SHADOW_STAGES: Record<RevealIntensity, string[]> = {
  quick: ['ticket', 'rift', 'rarity', 'signal'],
  rare:  ['ticket', 'rift', 'rarity', 'signal'],
  epic:  ['ticket', 'rift', 'rarity', 'signal'],
  apex:  ['ticket', 'rift', 'rarity', 'signal'],
}
const EQUIP_STAGES: Record<RevealIntensity, string[]> = {
  quick: ['ticket', 'forge', 'rarity', 'stars', 'silhouette'],
  rare:  ['ticket', 'forge', 'rarity', 'stars', 'silhouette'],
  epic:  ['ticket', 'forge', 'rarity', 'stars', 'silhouette'],
  apex:  ['ticket', 'forge', 'rarity', 'stars', 'silhouette'],
}

// ── durations (ms) ───────────────────────────────────────────────────────
const SHADOW_DUR: Record<RevealIntensity, Record<string, number>> = {
  quick: { ticket: 800,  rift: 2100,  rarity: 1800, signal: 900  },  // ~5.6 s
  rare:  { ticket: 950,  rift: 2700,  rarity: 2400, signal: 2250 },  // ~8.3 s
  epic:  { ticket: 1000, rift: 3600,  rarity: 3000, signal: 3900 },  // ~11.5 s
  apex:  { ticket: 1100, rift: 4500,  rarity: 3600, signal: 5700 },  // ~14.9 s
}
const EQUIP_DUR: Record<RevealIntensity, Record<string, number>> = {
  quick: { ticket: 700,  forge: 2250, rarity: 1800, stars: 1500, silhouette: 1050 },  // ~7.3 s
  rare:  { ticket: 750,  forge: 2550, rarity: 2400, stars: 1800, silhouette: 1200 },  // ~8.7 s
  epic:  { ticket: 800,  forge: 3000, rarity: 3000, stars: 2700, silhouette: 2400 },  // ~11.9 s
  apex:  { ticket: 900,  forge: 3600, rarity: 3600, stars: 4050, silhouette: 3150 },  // ~15.3 s
}

// ── rarity look-up (shadow rarity stage) ─────────────────────────────────
const RARITY_STYLE: Record<string, { color: string; border: string; glow: string; label: string; size: string }> = {
  common:    { color: 'text-slate-300',   border: 'border-slate-300/52 bg-slate-300/7',    glow: 'shadow-[0_0_44px_rgba(148,163,184,0.32)]', label: 'COMMON',    size: 'text-5xl'  },
  uncommon:  { color: 'text-emerald-300', border: 'border-emerald-300/56 bg-emerald-300/8',glow: 'shadow-[0_0_52px_rgba(52,211,153,0.38)]',  label: 'UNCOMMON',  size: 'text-4xl'  },
  rare:      { color: 'text-sky-300',     border: 'border-sky-300/60 bg-sky-300/8',        glow: 'shadow-[0_0_60px_rgba(56,189,248,0.44)]',  label: 'RARE',      size: 'text-6xl'  },
  epic:      { color: 'text-purple-300',  border: 'border-purple-300/64 bg-purple-300/9',  glow: 'shadow-[0_0_68px_rgba(168,85,247,0.50)]',  label: 'EPIC',      size: 'text-6xl'  },
  legendary: { color: 'text-amber-300',   border: 'border-amber-300/70 bg-amber-300/10',   glow: 'shadow-[0_0_80px_rgba(251,191,36,0.58)]',  label: 'LEGENDARY', size: 'text-3xl'  },
}

// ── grade look-up (shadow signal stage) ──────────────────────────────────
const GRADE: Record<string, { ring: string; text: string; label: string }> = {
  S: { ring: 'border-amber-300/65 bg-amber-300/10 shadow-[0_0_80px_32px_rgba(251,191,36,0.52)]', text: 'text-amber-200', label: '최상위 그림자 감지됨' },
  A: { ring: 'border-purple-300/60 bg-purple-300/10 shadow-[0_0_70px_26px_rgba(168,85,247,0.48)]', text: 'text-purple-200', label: '상위 그림자 감지됨' },
  B: { ring: 'border-blue-300/50 bg-blue-300/8 shadow-[0_0_55px_18px_rgba(59,130,246,0.38)]', text: 'text-blue-200', label: '그림자 신호 감지됨' },
  C: { ring: 'border-cyan-300/42 bg-cyan-300/6 shadow-[0_0_40px_12px_rgba(34,211,238,0.28)]', text: 'text-cyan-200', label: '신호 감지됨' },
}

// ── shadow rarity accent colours (ticket + rift stages) ────────────────────
const SR: Record<string, { ring: string; glow: string; text: string; bg: string; orb: string; mist: string; crackV: string; crackH: string; crack2a: string; crack2b: string }> = {
  common:    { ring: 'border-slate-400/32',   glow: '',                                             text: 'text-slate-400',   bg: 'bg-slate-400/4',   orb: 'h-14 w-14 bg-slate-400/60 shadow-[0_0_28px_12px_rgba(148,163,184,0.30)]',  mist: 'bg-[radial-gradient(circle,rgba(148,163,184,0.06),transparent_55%)]', crackV: '', crackH: '', crack2a: '', crack2b: '' },
  uncommon:  { ring: 'border-slate-400/32',   glow: '',                                             text: 'text-slate-400',   bg: 'bg-slate-400/4',   orb: 'h-14 w-14 bg-slate-400/60 shadow-[0_0_28px_12px_rgba(148,163,184,0.30)]',  mist: 'bg-[radial-gradient(circle,rgba(148,163,184,0.06),transparent_55%)]', crackV: '', crackH: '', crack2a: '', crack2b: '' },
  rare:      { ring: 'border-rose-400/58',    glow: 'shadow-[0_0_52px_rgba(244,63,94,0.40)]',       text: 'text-rose-300',    bg: 'bg-rose-400/7',    orb: 'h-16 w-16 bg-rose-400/85 shadow-[0_0_52px_22px_rgba(244,63,94,0.62)]',   mist: 'bg-[radial-gradient(circle,rgba(244,63,94,0.10),transparent_55%)]',   crackV: 'bg-gradient-to-b from-transparent via-rose-300/72 to-transparent',   crackH: 'bg-gradient-to-r from-transparent via-rose-300/72 to-transparent',   crack2a: 'bg-gradient-to-b from-transparent via-rose-200/40 to-transparent',   crack2b: 'bg-gradient-to-b from-transparent via-rose-200/40 to-transparent'   },
  epic:      { ring: 'border-purple-300/62',  glow: 'shadow-[0_0_68px_rgba(168,85,247,0.48)]',      text: 'text-purple-200',  bg: 'bg-purple-400/8',  orb: 'h-16 w-16 bg-purple-400/85 shadow-[0_0_62px_30px_rgba(168,85,247,0.68)]', mist: 'bg-[radial-gradient(circle,rgba(168,85,247,0.12),transparent_55%)]',  crackV: 'bg-gradient-to-b from-transparent via-purple-300/80 to-transparent', crackH: 'bg-gradient-to-r from-transparent via-purple-300/80 to-transparent', crack2a: 'bg-gradient-to-b from-transparent via-purple-200/46 to-transparent', crack2b: 'bg-gradient-to-b from-transparent via-purple-200/46 to-transparent' },
  legendary: { ring: 'border-amber-300/72',   glow: 'shadow-[0_0_82px_rgba(251,191,36,0.58)]',      text: 'text-amber-200',   bg: 'bg-amber-400/8',   orb: 'h-20 w-20 bg-amber-400/85 shadow-[0_0_70px_36px_rgba(251,191,36,0.72)]', mist: 'bg-[radial-gradient(circle,rgba(251,191,36,0.12),transparent_55%)]',  crackV: 'bg-gradient-to-b from-transparent via-amber-300/82 to-transparent',  crackH: 'bg-gradient-to-r from-transparent via-amber-300/82 to-transparent',  crack2a: 'bg-gradient-to-b from-transparent via-amber-200/52 to-transparent',  crack2b: 'bg-gradient-to-b from-transparent via-amber-200/52 to-transparent'  },
}

// ── per-intensity accent colours ─────────────────────────────────────────
const LOW_TIER_ANTICIPATION = {
  ring: 'border-cyan-300/34',
  glow: 'shadow-[0_0_38px_rgba(34,211,238,0.24)]',
  text: 'text-cyan-200',
  bg: 'bg-cyan-400/6',
  orb: 'h-14 w-14 bg-cyan-300/58 shadow-[0_0_30px_12px_rgba(34,211,238,0.28)]',
  mist: 'bg-[radial-gradient(circle,rgba(34,211,238,0.07),transparent_55%)]',
  crackV: '',
  crackH: '',
  crack2a: '',
  crack2b: '',
}

const HIGH_TIER_ANTICIPATION = {
  ring: 'border-red-500/58',
  glow: 'shadow-[0_0_64px_rgba(127,29,29,0.54)]',
  text: 'text-red-200',
  bg: 'bg-red-950/28',
  orb: 'h-16 w-16 bg-red-500/82 shadow-[0_0_60px_24px_rgba(185,28,28,0.68)]',
  mist: 'bg-[radial-gradient(circle,rgba(127,29,29,0.24),transparent_58%)]',
  crackV: 'bg-gradient-to-b from-transparent via-red-400/76 to-transparent',
  crackH: 'bg-gradient-to-r from-transparent via-red-400/76 to-transparent',
  crack2a: 'bg-gradient-to-b from-transparent via-red-300/42 to-transparent',
  crack2b: 'bg-gradient-to-b from-transparent via-red-300/42 to-transparent',
}

const SC: Record<RevealIntensity, { ring: string; glow: string; text: string; bg: string }> = {
  quick: { ring: 'border-cyan-300/48',    glow: 'shadow-[0_0_44px_rgba(34,211,238,0.34)]',   text: 'text-cyan-200',    bg: 'bg-cyan-400/7'    },
  rare:  { ring: 'border-teal-300/52',    glow: 'shadow-[0_0_52px_rgba(20,184,166,0.38)]',   text: 'text-teal-200',    bg: 'bg-teal-400/8'    },
  epic:  { ring: 'border-purple-300/62',  glow: 'shadow-[0_0_68px_rgba(168,85,247,0.48)]',   text: 'text-purple-200',  bg: 'bg-purple-400/8'  },
  apex:  { ring: 'border-amber-300/72',   glow: 'shadow-[0_0_82px_rgba(251,191,36,0.58)]',   text: 'text-amber-200',   bg: 'bg-amber-400/8'   },
}
const EC: Record<RevealIntensity, { ring: string; glow: string; text: string; bg: string }> = {
  quick: { ring: 'border-sky-300/48',     glow: 'shadow-[0_0_44px_rgba(56,189,248,0.34)]',   text: 'text-sky-200',     bg: 'bg-sky-400/7'     },
  rare:  { ring: 'border-emerald-300/54', glow: 'shadow-[0_0_54px_rgba(16,185,129,0.40)]',   text: 'text-emerald-200', bg: 'bg-emerald-400/8' },
  epic:  { ring: 'border-purple-300/62',  glow: 'shadow-[0_0_68px_rgba(168,85,247,0.48)]',   text: 'text-purple-200',  bg: 'bg-purple-400/8'  },
  apex:  { ring: 'border-amber-300/72',   glow: 'shadow-[0_0_82px_rgba(251,191,36,0.58)]',   text: 'text-amber-200',   bg: 'bg-amber-400/8'   },
}

const LOW_TIER_ACCENT = {
  ring: 'border-cyan-300/38',
  glow: 'shadow-[0_0_40px_rgba(34,211,238,0.24)]',
  text: 'text-cyan-200',
  bg: 'bg-cyan-400/6',
}

const HIGH_TIER_ACCENT = {
  ring: 'border-red-500/56',
  glow: 'shadow-[0_0_62px_rgba(127,29,29,0.52)]',
  text: 'text-red-200',
  bg: 'bg-red-950/28',
}

const SLOT_ICON = { weapon: Sword, armor: Shield, accessory: Gem, artifact: ScrollText }
const SLOT_LABEL: Record<string, string> = { weapon: '무기 형상', armor: '방어구 형상', accessory: '장신구 형상', artifact: '유물 형상' }

const STAGE_LABEL: Record<string, string> = {
  ticket: 'PREPARE', rift: 'RIFT OPEN', rarity: 'RARITY', signal: 'SIGNAL',
  forge: 'FORGE', stars: 'STARS', silhouette: 'SILHOUETTE',
}

export function TicketRevealSequence({
  kind, intensity, title, signalGrade, shadowRarity, equipRarity, starCount, featuredSlot, onComplete,
}: TicketRevealSequenceProps) {
  const reducedMotion = useReducedMotion()
  const stageOrder = kind === 'shadow' ? SHADOW_STAGES[intensity] : EQUIP_STAGES[intensity]
  const durMap      = kind === 'shadow' ? SHADOW_DUR[intensity]    : EQUIP_DUR[intensity]

  const [stageIdx,  setStageIdx]  = useState(0)
  const [litStars,  setLitStars]  = useState(0)
  const [apexFlash, setApexFlash] = useState(false)
  const [blackFlash, setBlackFlash] = useState(false)
  const [isShaking,  setIsShaking]  = useState(false)
  const completeRef = useRef(onComplete)
  const doneRef     = useRef(false)

  const stage = stageOrder[stageIdx] ?? 'ticket'
  const isAnticipationStage = stage === 'ticket' || stage === 'rift' || stage === 'forge'
  const highAnticipation = intensity !== 'quick'
  const shadowAnticipation = highAnticipation ? HIGH_TIER_ANTICIPATION : LOW_TIER_ANTICIPATION
  const anticipationAccent = highAnticipation ? HIGH_TIER_ACCENT : LOW_TIER_ACCENT
  const sc    = SC[intensity]
  const ec    = EC[intensity]
  const gs    = GRADE[(signalGrade ?? 'C')] ?? GRADE.C

  useEffect(() => { completeRef.current = onComplete }, [onComplete])

  useEffect(() => {
    doneRef.current = false
    setStageIdx(0)
    setLitStars(0)
    setApexFlash(false)
    setBlackFlash(false)
    setIsShaking(false)
  }, [kind, intensity])

  useEffect(() => {
    if (doneRef.current) return
    if (reducedMotion) { doneRef.current = true; completeRef.current(); return }
    const dur = durMap[stage] ?? 500
    if (dur === 0) { setStageIdx(i => i + 1); return }
    const t = window.setTimeout(() => {
      const next = stageIdx + 1
      if (next < stageOrder.length) {
        if (next === stageOrder.length - 1) {
          const flashDur = intensity === 'apex' ? 420 : intensity === 'epic' ? 280 : 180
          setBlackFlash(true)
          window.setTimeout(() => setBlackFlash(false), flashDur)
          if (intensity === 'apex' || intensity === 'epic') {
            setIsShaking(true)
            window.setTimeout(() => setIsShaking(false), 500)
          }
        }
        if (intensity === 'apex' && next === stageOrder.length - 1) {
          setApexFlash(true)
          window.setTimeout(() => setApexFlash(false), 700)
        }
        setStageIdx(next)
      } else {
        doneRef.current = true
        completeRef.current()
      }
    }, dur)
    return () => window.clearTimeout(t)
  }, [stage, stageIdx, stageOrder.length, durMap, intensity, reducedMotion])

  // sequential star lighting
  useEffect(() => {
    if (stage !== 'stars' || !starCount) return
    setLitStars(0)
    const dur = EQUIP_DUR[intensity].stars ?? 900
    const interval = dur / (starCount + 1)
    const timers = Array.from({ length: starCount }, (_, i) =>
      window.setTimeout(() => setLitStars(i + 1), interval * (i + 1))
    )
    return () => timers.forEach(window.clearTimeout)
  }, [stage, starCount, intensity])

  const skip = () => { if (!doneRef.current) { doneRef.current = true; completeRef.current() } }

  // ── rarity stage render (shadow only) ───────────────────────────────────
  const renderShadowRarity = () => {
    const rs = RARITY_STYLE[shadowRarity ?? 'common'] ?? RARITY_STYLE.common
    const beams = shadowRarity === 'legendary' || shadowRarity === 'epic' || shadowRarity === 'rare'
    const isLegendary = shadowRarity === 'legendary'
    return (
      <div className="flex flex-col items-center gap-6">
        <div className={clsx('relative flex h-64 w-64 flex-col items-center justify-center gap-2 rounded-full border-2 animate-pulse', rs.border, rs.glow)}>
          {/* outer ping ring */}
          <div className="absolute -inset-4 rounded-full border border-white/12 animate-ping" style={{ animationDuration: '2s' }} />
          {/* radial inner glow */}
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.07),transparent_65%)]" />
          {/* legendary extra ambient */}
          {isLegendary && <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.13),transparent_55%)]" />}
          {/* radial beams */}
          {beams && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {[0,45,90,135,180,225,270,315].map(deg => (
                <div key={deg} className="absolute h-full w-px origin-center opacity-18" style={{ transform: `rotate(${deg}deg)`, background: 'linear-gradient(to bottom, transparent 35%, currentColor 50%, transparent 65%)' }} />
              ))}
            </div>
          )}
          <span className="relative z-10 system-text text-[10px] tracking-[0.22em] text-white/38">RARITY</span>
          <span className={clsx('relative z-10 font-black leading-none tracking-widest select-none', rs.color, rs.size)}>{rs.label}</span>
        </div>
        <p className={clsx('text-3xl font-black tracking-wide', rs.color)}>등급 확인됨</p>
        <p className="text-sm text-white/45">태생이 드러나기 직전…</p>
      </div>
    )
  }

  // ── shadow stage renders ────────────────────────────────────────────────
  const renderShadowTicket = () => {
    const sr = shadowAnticipation
    return (
      <div className="flex flex-col items-center gap-6">
        <div className={clsx('relative flex h-64 w-44 flex-col items-center justify-center gap-4 rounded-2xl border-2 p-5 animate-pulse', sr.ring, sr.bg, sr.glow)}>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/14 to-transparent" />
          <div className="pointer-events-none absolute -inset-3 rounded-3xl border border-dashed opacity-30" style={{ borderColor: 'currentColor', animationDuration: '4s' }} />
          <Ticket className={clsx('relative h-24 w-24', sr.text)} />
          <span className={clsx('system-text text-[11px] tracking-[0.2em]', sr.text)}>SHADOW TICKET</span>
        </div>
        <p className={clsx('text-3xl font-black tracking-wide', sr.text)}>소환권이 반응한다</p>
        <p className="text-sm text-white/45">그림자 안개가 형성된다…</p>
      </div>
    )
  }

  const renderShadowRift = () => {
    const sr = shadowAnticipation
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-72 w-72 items-center justify-center">
          {/* outermost slow sweep — legendary only */}
          {highAnticipation && (
            <div className="absolute -inset-6 rounded-full border border-red-500/20 animate-spin" style={{ animationDuration: '8s' }} />
          )}
          <div className={clsx('absolute inset-0 rounded-full border-2 border-dashed animate-spin', sr.ring)} style={{ animationDuration: '3s' }} />
          <div className={clsx('absolute inset-6 rounded-full border animate-spin opacity-60', sr.ring)} style={{ animationDuration: '2.2s', animationDirection: 'reverse' }} />
          <div className={clsx('absolute inset-12 rounded-full border-2', sr.ring)} />
          {/* mist overlay */}
          <div className={clsx('absolute inset-0 rounded-full', sr.mist)} />
          {/* crack lines — only for rare+ */}
          {highAnticipation && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={clsx('absolute h-full w-px', sr.crackV)} />
              <div className={clsx('absolute h-px w-full', sr.crackH)} />
              {sr.crack2a && (
                <>
                  <div className={clsx('absolute h-full w-px rotate-45', sr.crack2a)} />
                  <div className={clsx('absolute h-full w-px -rotate-45', sr.crack2b)} />
                </>
              )}
            </div>
          )}
          {/* center glow orb */}
          <div className={clsx('relative z-10 rounded-full animate-pulse', sr.orb)} />
        </div>
        <p className={clsx('text-3xl font-black tracking-wide', sr.text)}>균열이 열린다</p>
        <p className="text-sm text-white/45">그림자의 기운이 집결한다…</p>
      </div>
    )
  }

  const renderShadowSignal = () => {
    const isApex = intensity === 'apex', isEpic = intensity === 'epic'
    return (
      <div className="flex flex-col items-center gap-6">
        <div className={clsx('relative flex h-64 w-64 items-center justify-center rounded-full border-2 animate-pulse', gs.ring)}>
          {/* outer pulse ring */}
          <div className="absolute -inset-4 rounded-full border border-white/12 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_65%)]" />
          {/* apex/epic radial beams */}
          {(isApex || isEpic) && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {[0,45,90,135,180,225,270,315].map(deg => (
                <div key={deg} className="absolute h-full w-px origin-center opacity-20" style={{ transform: `rotate(${deg}deg)`, background: 'linear-gradient(to bottom, transparent 35%, currentColor 50%, transparent 65%)' }} />
              ))}
            </div>
          )}
          <span className={clsx('relative z-10 font-black leading-none select-none', gs.text, isApex ? 'text-[9rem]' : 'text-9xl')}>{signalGrade ?? 'C'}</span>
        </div>
        <p className={clsx('text-3xl font-black tracking-wide', gs.text)}>{gs.label}</p>
        <p className="text-sm text-white/45">정체는 봉인된다…</p>
      </div>
    )
  }

  // ── equipment stage renders ─────────────────────────────────────────────
  const renderEquipTicket = () => (
    <div className="flex flex-col items-center gap-6">
      <div className={clsx('relative flex h-64 w-44 flex-col items-center justify-center gap-4 rounded-2xl border-2 p-5', anticipationAccent.ring, anticipationAccent.bg, anticipationAccent.glow, 'animate-pulse')}>
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/14 to-transparent" />
        <PackageOpen className={clsx('relative h-24 w-24', anticipationAccent.text)} />
        <span className={clsx('system-text text-[11px] tracking-[0.2em]', anticipationAccent.text)}>EQUIP TICKET</span>
      </div>
      <p className={clsx('text-3xl font-black tracking-wide', anticipationAccent.text)}>장비 금고 준비</p>
      <p className="text-sm text-white/45">봉인된 장비가 반응한다…</p>
    </div>
  )

  const renderEquipForge = () => {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-72 w-72 items-center justify-center">
          {/* outermost slow sweep — apex only */}
          {highAnticipation && (
            <div className="absolute -inset-6 rounded-full border border-red-500/20 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />
          )}
          <div className={clsx('absolute inset-0 rounded-full border-2 animate-spin', anticipationAccent.ring)} style={{ animationDuration: '4s' }} />
          <div className={clsx('absolute inset-5 rounded-full border border-dashed animate-spin opacity-55', anticipationAccent.ring)} style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
          <div className={clsx('absolute inset-11 rounded-full border', anticipationAccent.ring)} />
          {/* heat glow */}
          <div className={clsx('absolute inset-0 rounded-full', highAnticipation ? 'bg-[radial-gradient(circle,rgba(127,29,29,0.24),transparent_58%)]' : 'bg-[radial-gradient(circle,rgba(34,211,238,0.08),transparent_55%)]')} />
          <div className="absolute inset-0 flex items-center justify-center">
            {highAnticipation ? (
              <>
                <div className="absolute h-3/4 w-px bg-gradient-to-b from-transparent via-red-400/62 to-transparent" />
                <div className="absolute h-px w-3/4 bg-gradient-to-r from-transparent via-red-400/62 to-transparent" />
                <div className="absolute h-3/4 w-px rotate-45 bg-gradient-to-b from-transparent via-red-300/34 to-transparent" />
                <div className="absolute h-3/4 w-px -rotate-45 bg-gradient-to-b from-transparent via-red-300/34 to-transparent" />
              </>
            ) : (
              <>
                <div className="absolute h-3/4 w-px bg-gradient-to-b from-transparent via-cyan-300/42 to-transparent" />
                <div className="absolute h-px w-3/4 bg-gradient-to-r from-transparent via-cyan-300/42 to-transparent" />
              </>
            )}
          </div>
          <Flame className={clsx('relative z-10 h-16 w-16 animate-pulse', anticipationAccent.text)} />
        </div>
        <p className={clsx('text-3xl font-black tracking-wide', anticipationAccent.text)}>제련진 가동</p>
        <p className="text-sm text-white/45">장비 형상이 만들어진다…</p>
      </div>
    )
  }

  const renderEquipStars = () => (
    <div className="flex flex-col items-center gap-10">
      <div className="flex items-end gap-3">
        {Array.from({ length: starCount ?? 1 }).map((_, i) => (
          <div key={i} className={clsx('transition-all duration-300', i < litStars ? 'scale-125' : 'scale-100')}>
            <span className={clsx(
              'block leading-none transition-all duration-500 select-none',
              (starCount ?? 1) <= 3 ? 'text-7xl' : 'text-6xl',
              i < litStars
                ? clsx(
                    'text-amber-300',
                    intensity === 'apex'
                      ? '[filter:drop-shadow(0_0_18px_rgba(251,191,36,0.96))_drop-shadow(0_0_32px_rgba(251,191,36,0.55))]'
                      : '[filter:drop-shadow(0_0_14px_rgba(251,191,36,0.90))]',
                  )
                : 'text-white/14',
            )}>★</span>
          </div>
        ))}
      </div>
      <p className={clsx('text-3xl font-black tracking-wide', ec.text)}>
        {litStars > 0 ? `${litStars}성 신호 감지` : '별이 점등된다…'}
      </p>
      <p className="text-sm text-white/45">장비 등급이 드러난다…</p>
    </div>
  )

  const renderEquipSilhouette = () => {
    const SlotIcon = SLOT_ICON[featuredSlot ?? 'weapon']
    const isApex = intensity === 'apex', isEpic = intensity === 'epic'
    return (
      <div className="flex flex-col items-center gap-6">
        <div className={clsx('relative flex h-64 w-64 items-center justify-center rounded-full border-2', ec.ring, ec.glow, ec.bg)}>
          <div className="absolute -inset-4 rounded-full border border-white/8 animate-ping" style={{ animationDuration: '2.2s' }} />
          <div className="absolute inset-6 rounded-full border border-white/10" />
          <div className="absolute inset-12 rounded-full border border-white/6" />
          {/* radial beams — apex/epic */}
          {(isApex || isEpic) && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {[0,45,90,135,180,225,270,315].map(deg => (
                <div key={deg} className="absolute h-full w-px origin-center opacity-15" style={{ transform: `rotate(${deg}deg)`, background: 'linear-gradient(to bottom, transparent 30%, currentColor 50%, transparent 70%)' }} />
              ))}
            </div>
          )}
          <SlotIcon className={clsx('relative z-10 h-28 w-28', ec.text)} />
        </div>
        <p className={clsx('text-3xl font-black tracking-wide', ec.text)}>형상이 드러난다</p>
        <p className="text-sm text-white/45">{SLOT_LABEL[featuredSlot ?? 'weapon']}</p>
      </div>
    )
  }

  const renderEquipRarity = () => {
    const rs = RARITY_STYLE[equipRarity ?? 'common'] ?? RARITY_STYLE.common
    const beams = equipRarity === 'legendary' || equipRarity === 'epic' || equipRarity === 'rare'
    const isLegendary = equipRarity === 'legendary'
    return (
      <div className="flex flex-col items-center gap-6">
        <div className={clsx('relative flex h-64 w-64 flex-col items-center justify-center gap-2 rounded-full border-2 animate-pulse', rs.border, rs.glow)}>
          {/* outer ping ring */}
          <div className="absolute -inset-4 rounded-full border border-white/12 animate-ping" style={{ animationDuration: '2s' }} />
          {/* radial inner glow */}
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.07),transparent_65%)]" />
          {/* legendary extra ambient */}
          {isLegendary && <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.13),transparent_55%)]" />}
          {/* radial beams */}
          {beams && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {[0,45,90,135,180,225,270,315].map(deg => (
                <div key={deg} className="absolute h-full w-px origin-center opacity-18" style={{ transform: `rotate(${deg}deg)`, background: 'linear-gradient(to bottom, transparent 35%, currentColor 50%, transparent 65%)' }} />
              ))}
            </div>
          )}
          <span className="relative z-10 system-text text-[10px] tracking-[0.22em] text-white/38">ITEM GRADE</span>
          <span className={clsx('relative z-10 font-black leading-none tracking-widest select-none', rs.color, rs.size)}>{rs.label}</span>
        </div>
        <p className={clsx('text-3xl font-black tracking-wide', rs.color)}>아이템 등급 확인</p>
        <p className="text-sm text-white/45">장비 형태가 드러나기 직전…</p>
      </div>
    )
  }

  const renderStage = () => {
    if (kind === 'shadow') {
      if (stage === 'ticket') return renderShadowTicket()
      if (stage === 'rift')   return renderShadowRift()
      if (stage === 'rarity') return renderShadowRarity()
      return renderShadowSignal()
    }
    if (stage === 'ticket')     return renderEquipTicket()
    if (stage === 'forge')      return renderEquipForge()
    if (stage === 'stars')      return renderEquipStars()
    if (stage === 'rarity')     return renderEquipRarity()
    return renderEquipSilhouette()
  }

  const resultAccent = kind === 'shadow' ? sc : ec
  const accentCol = isAnticipationStage ? anticipationAccent : resultAccent

  return createPortal(
    <>
      <style>{`
        @keyframes trs-shake {
          0%,100%{transform:translate(0,0)}
          12%{transform:translate(-11px,6px)}
          25%{transform:translate(11px,-6px)}
          37%{transform:translate(-8px,4px)}
          50%{transform:translate(8px,-3px)}
          62%{transform:translate(-5px,2px)}
          75%{transform:translate(4px,-1px)}
          87%{transform:translate(-2px,1px)}
        }
      `}</style>

      <div className="fixed inset-0 z-[900] flex items-center justify-center overflow-hidden">
        {/* dark backdrop with blur */}
        <div className="absolute inset-0 bg-black/92 backdrop-blur-sm" />

        {/* apex ambient radial */}
        {isAnticipationStage && highAnticipation && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(127,29,29,0.12),transparent)]" />
        )}

        {intensity === 'apex' && !isAnticipationStage && (
          <div className={clsx(
            'pointer-events-none absolute inset-0',
            kind === 'shadow'
              ? 'bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(251,191,36,0.07),transparent)]'
              : 'bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(251,191,36,0.07),transparent)]',
          )} />
        )}

        {/* black flash */}
        {blackFlash && <div className="absolute inset-0 z-10 bg-black" />}

        {/* apex white burst */}
        {apexFlash && <div className="pointer-events-none absolute inset-0 z-10 bg-white/20 transition-opacity duration-500" />}

        {/* skip button — fixed top right */}
        <button
          type="button"
          onClick={skip}
          className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-white/6 px-3 py-1.5 text-xs system-text text-white/55 backdrop-blur-sm transition hover:bg-white/12 hover:text-white/90"
        >
          <FastForward className="h-3.5 w-3.5" />
          Skip
        </button>

        {/* stage label — fixed top left */}
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
          <span className="system-text text-[10px] text-white/32">{title}</span>
          <span className={clsx('system-text text-[11px] font-semibold', accentCol.text)}>{STAGE_LABEL[stage]}</span>
        </div>

        {/* shaking content wrapper */}
        <div
          className="relative z-10 flex w-full flex-col items-center justify-center px-6"
          style={isShaking ? { animation: 'trs-shake 0.45s ease-in-out' } : {}}
        >
          {renderStage()}

          {/* progress dots */}
          <div className="mt-10 flex justify-center gap-2.5">
            {stageOrder.map((s, i) => (
              <span
                key={s}
                className={clsx(
                  'rounded-full transition-all duration-300',
                  i === stageIdx
                    ? 'h-2 w-10 bg-white/65'
                    : i < stageIdx ? 'h-1.5 w-6 bg-white/30' : 'h-1.5 w-4 bg-white/12',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
