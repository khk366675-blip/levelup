import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Crown, 
  Zap, 
  Skull, 
  ShieldAlert, 
  Swords, 
  Flame, 
  Sparkles, 
  AlertTriangle,
  Volume2
} from 'lucide-react'
import type { WorldEvent } from '../lib/types'

// Theme definition for each event type to ensure gorgeous and unified visual styles
export interface EventTheme {
  primaryColor: string
  secondaryColor: string
  glowColor: string
  gradient: string
  badgeText: string
  icon: React.ReactNode
}

export const EVENT_THEMES: Record<string, EventTheme> = {
  monarch_appear: {
    primaryColor: '#ef4444', // intense red
    secondaryColor: '#380c10',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    gradient: 'from-red-950/90 via-rose-950/80 to-ink-950/90',
    badgeText: '👑 군주 강림 경보 (MONARCH ARRIVAL)',
    icon: <Crown className="w-16 h-16 text-red-500 animate-pulse" />
  },
  home_threat: {
    primaryColor: '#f97316', // bright copper orange
    secondaryColor: '#2e1d09',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    gradient: 'from-amber-950/90 via-orange-950/80 to-ink-950/90',
    badgeText: '🚨 거점 위협 경보 (TERRITORY THREAT)',
    icon: <ShieldAlert className="w-16 h-16 text-orange-500" />
  },
  home_reached: {
    primaryColor: '#dc2626', // extreme fire red
    secondaryColor: '#450a0a',
    glowColor: 'rgba(220, 38, 38, 0.6)',
    gradient: 'from-red-950 via-rose-950/95 to-black bg-opacity-95',
    badgeText: '⚠️ 거점 피침습 돌파 (HOME BREACHED)',
    icon: <Flame className="w-16 h-16 text-red-600 animate-bounce" />
  },
  awakening: {
    primaryColor: '#eab308', // radiant gold
    secondaryColor: '#1e1b4b',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    gradient: 'from-yellow-950/90 via-indigo-950/80 to-ink-950/90',
    badgeText: '✨ 헌터 한계 돌파 (HUNTER AWAKENING)',
    icon: <Zap className="w-16 h-16 text-yellow-400" />
  },
  defeated: {
    primaryColor: '#8b5cf6', // electric violet
    secondaryColor: '#1e1b4b',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    gradient: 'from-purple-950/90 via-violet-950/80 to-ink-950/90',
    badgeText: '⚔️ 군주 격퇴 성공 (MONARCH DEFEATED)',
    icon: <Swords className="w-16 h-16 text-purple-400 animate-pulse" />
  },
  sgrade_gate: {
    primaryColor: '#a855f7', // S-grade purple
    secondaryColor: '#1e1b4b',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    gradient: 'from-violet-950/90 via-slate-900/80 to-ink-950/90',
    badgeText: '👾 대재앙급 차원 균열 (S-GRADE GATE)',
    icon: <AlertTriangle className="w-16 h-16 text-purple-400" />
  },
  occupied: {
    primaryColor: '#b91c1c', // dark crimson
    secondaryColor: '#2b0707',
    glowColor: 'rgba(185, 28, 28, 0.45)',
    gradient: 'from-red-950/90 via-slate-950/80 to-ink-950/90',
    badgeText: '💀 국가 영토 침식 (NATION FALLEN)',
    icon: <Skull className="w-16 h-16 text-red-700" />
  },
  expand: {
    primaryColor: '#db2777', // rose
    secondaryColor: '#2d0617',
    glowColor: 'rgba(219, 39, 119, 0.45)',
    gradient: 'from-pink-950/90 via-rose-950/80 to-ink-950/90',
    badgeText: '👿 군주 영토 확장 (TERRITORY EXPANSION)',
    icon: <Skull className="w-16 h-16 text-pink-500 animate-pulse" />
  },
  gate_surge: {
    primaryColor: '#ef4444', // red
    secondaryColor: '#3a0909',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    gradient: 'from-red-950/90 via-orange-950/80 to-ink-950/90',
    badgeText: '💥 차원 균열 폭주 (GATE RAMPAGE)',
    icon: <Flame className="w-16 h-16 text-red-500 animate-bounce" />
  },
  gate_open: {
    primaryColor: '#06b6d4', // cyan
    secondaryColor: '#082f49',
    glowColor: 'rgba(6, 182, 212, 0.35)',
    gradient: 'from-cyan-950/90 via-slate-900/80 to-ink-950/90',
    badgeText: '🌀 차원 균열 감지 (DIMENSIONAL RIFT)',
    icon: <Sparkles className="w-16 h-16 text-cyan-400" />
  },
  default: {
    primaryColor: '#3b82f6', // system blue
    secondaryColor: '#0f172a',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    gradient: 'from-blue-950/90 via-slate-900/80 to-ink-950/90',
    badgeText: '📢 시스템 기록 (SYSTEM INTEL)',
    icon: <Sparkles className="w-16 h-16 text-blue-400" />
  }
}

// Detailed high-fidelity profiles for 8 Monarchs and the Angel
export interface MonarchProfile {
  name: string
  title: string
  subtitle: string
  quote: string
  color: string
  glowColor: string
  secondaryColor: string
  gradient: string
  iconEmoji: string
}

export const MONARCH_PROFILES: Record<string, MonarchProfile> = {
  grellic: {
    name: '부패의 모왕 그렐릭',
    title: '👑 제 8위 군주 그렐릭 강림',
    subtitle: '부패와 벌레의 군단이 세계를 갉아먹습니다.',
    quote: '"모든 생명은 결국 썩어 문드러지고, 나의 자손들의 고치가 되리라..."',
    color: '#10b981', // emerald green
    glowColor: 'rgba(16, 185, 129, 0.55)',
    secondaryColor: '#062f22',
    gradient: 'from-emerald-950/95 via-teal-950/85 to-black bg-opacity-95',
    iconEmoji: '🐛'
  },
  celaide: {
    name: '빙결의 여군주 셀라이드',
    title: '👑 제 7위 군주 셀라이드 강림',
    subtitle: '만물을 얼어붙게 만드는 절대영도의 장막.',
    quote: '"움직이지 마라. 너희의 숨결, 피, 그리고 영혼까지 이 혹한 속에 잠재워주마..."',
    color: '#06b6d4', // cyan
    glowColor: 'rgba(6, 182, 212, 0.55)',
    secondaryColor: '#083344',
    gradient: 'from-cyan-950/95 via-sky-950/85 to-black bg-opacity-95',
    iconEmoji: '❄️'
  },
  igris: {
    name: '백염의 군주 이그리스',
    title: '👑 제 6위 군주 이그리스 강림',
    subtitle: '대지를 불태우는 백색 화염의 대재앙.',
    quote: '"태워라! 백색의 불꽃이 온 누리를 뒤덮고, 재조차 남지 않을 종말을 보리라!"',
    color: '#f97316', // orange
    glowColor: 'rgba(249, 115, 22, 0.55)',
    secondaryColor: '#431407',
    gradient: 'from-orange-950/95 via-red-950/85 to-black bg-opacity-95',
    iconEmoji: '🔥'
  },
  dorga: {
    name: '강철의 패왕 도르가',
    title: '👑 제 5위 군주 도르가 강림',
    subtitle: '어떤 칼날도 뚫을 수 없는 불침의 요새.',
    quote: '"인간의 무기 따위로 내 강철의 성벽을 넘볼 수 있으리라 생각했느냐? 어리석도다!"',
    color: '#64748b', // slate
    glowColor: 'rgba(100, 116, 139, 0.55)',
    secondaryColor: '#1e293b',
    gradient: 'from-slate-900/95 via-zinc-950/85 to-black bg-opacity-95',
    iconEmoji: '🛡️'
  },
  mirage: {
    name: '환영의 군주 미라쥬',
    title: '👑 제 4위 군주 미라쥬 강림',
    subtitle: '진실과 거짓이 허물어지는 극렬한 왜곡.',
    quote: '"네가 보고 있는 것은 나인가, 아니면 네 마음속 깊은 곳의 두려움인가? 알아맞춰 보아라..."',
    color: '#a855f7', // purple
    glowColor: 'rgba(168, 85, 247, 0.55)',
    secondaryColor: '#2e1065',
    gradient: 'from-purple-950/95 via-indigo-950/85 to-black bg-opacity-95',
    iconEmoji: '👁️'
  },
  pesta: {
    name: '역병의 대공 페스타',
    title: '👑 제 3위 군주 페스타 강림',
    subtitle: '생명을 시들게 하는 가혹한 고름과 부패.',
    quote: '"구걸해라, 절규해라! 너희의 육신이 썩어 들어가고 영혼이 파먹힐 때 비로소 고통에서 해방되리니..."',
    color: '#84cc16', // lime
    glowColor: 'rgba(132, 204, 22, 0.55)',
    secondaryColor: '#1a2e05',
    gradient: 'from-lime-950/95 via-emerald-950/85 to-black bg-opacity-95',
    iconEmoji: '☣️'
  },
  belatus: {
    name: '폭풍의 군주 벨라투스',
    title: '👑 제 2위 군주 벨라투스 강림',
    subtitle: '눈을 뗄 수 없는 초고속 질풍과 단죄.',
    quote: '"바람보다 빠르게, 그 어떤 찰나보다도 신속하게... 너희들의 목을 베어 넘기겠다!"',
    color: '#10b981', // emerald
    glowColor: 'rgba(16, 185, 129, 0.55)',
    secondaryColor: '#022c22',
    gradient: 'from-teal-950/95 via-emerald-950/85 to-black bg-opacity-95',
    iconEmoji: '🌪️'
  },
  nox: {
    name: '공허의 절대자 녹스',
    title: '👑 제 1위 군주 녹스 강림',
    subtitle: '차원을 붕괴시키고 모든 것을 삼키는 종말의 암흑.',
    quote: '"빛조차 탈출하지 못하는 심연, 공허의 무(無)가 너희의 구원이자 종착지다. 순응하라..."',
    color: '#6366f1', // indigo
    glowColor: 'rgba(99, 102, 241, 0.6)',
    secondaryColor: '#1e1b4b',
    gradient: 'from-indigo-950/95 via-violet-950/90 to-black bg-opacity-95',
    iconEmoji: '🌌'
  },
  angel: {
    name: '지고의 심판자',
    title: '✨ 최종보스 지고의 심판자 강림',
    subtitle: '세계를 완벽히 정화하고 지워버릴 천상의 단죄.',
    quote: '"차원 전역의 생명체들에게 고한다. 정화의 시간이 도래했으니, 빛의 심판을 경건히 받으라..."',
    color: '#eab308', // gold
    glowColor: 'rgba(234, 179, 8, 0.65)',
    secondaryColor: '#3c3001',
    gradient: 'from-yellow-950/95 via-amber-950/90 to-black bg-opacity-95',
    iconEmoji: '👼'
  }
}

// ---------------------------------------------------------------------
// 1. CinematicOverlay: Fullscreen dramatic reveal engine (Also handles custom stories)
// ---------------------------------------------------------------------
interface CinematicOverlayProps {
  event: WorldEvent | {
    id: string
    type: string
    title: string
    body: string
    day?: number
    severity?: string
    monarchId?: string
  }
  onClose: () => void
  durationMs?: number
  playbackSpeed?: number
}

export function CinematicOverlay({ event, onClose, durationMs = 4500, playbackSpeed = 1.0 }: CinematicOverlayProps) {
  let theme = EVENT_THEMES[event.type] || EVENT_THEMES.default
  let customQuote = ("quote" in event && event.quote) ? event.quote : ""
  let customSubtitle = ("subtitle" in event && event.subtitle) ? event.subtitle : ""
  
  // Custom monarch profile injection
  const mId = event.monarchId
  if (mId && MONARCH_PROFILES[mId]) {
    const profile = MONARCH_PROFILES[mId]
    theme = {
      primaryColor: profile.color,
      secondaryColor: profile.secondaryColor,
      glowColor: profile.glowColor,
      gradient: profile.gradient,
      badgeText: mId === 'angel' ? '👼 최종 대심판 경보 (APOCALYPSE)' : '👑 군주 강림 경보 (MONARCH ARRIVAL)',
      icon: <span className="text-5xl select-none animate-pulse">{profile.iconEmoji}</span>
    }
    if (!customQuote) customQuote = profile.quote
    if (!customSubtitle) customSubtitle = profile.subtitle
  }

  const finalDuration = durationMs / playbackSpeed

  useEffect(() => {
    // Escape, Enter, Space triggers skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Auto close timer
    const autoCloseTimer = setTimeout(() => {
      onClose()
    }, finalDuration)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(autoCloseTimer)
    }
  }, [onClose, finalDuration])

  let quoteHeader = "🎙️ MILITARY TRANSMISSION LOGGED"
  if (event.monarchId) {
    quoteHeader = event.monarchId === 'angel' ? "👼 HOLY DECREE INTERCEPTED" : "🎙️ BOSS TRANSMISSION INTERCEPTED"
  } else if (event.type === 'awakening') {
    quoteHeader = "✨ HUNTER BATTLE CRY RECORDED"
  } else if (event.type === 'defeated') {
    quoteHeader = "🎉 VICTORY SIGNAL DETECTED"
  } else if (event.type === 'home_threat' || event.type === 'home_reached' || event.type === 'gate_surge') {
    quoteHeader = "🚨 EMERGENCY DISTRESS TRANSMISSION"
  } else if (event.type === 'occupied') {
    quoteHeader = "💀 REGIONAL DESPAIR INTERCEPT"
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex flex-col justify-center items-center backdrop-blur-lg bg-black/90 cursor-pointer select-none overflow-hidden"
    >
      {/* Glitch & scanline backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.01)_50%,transparent_50%)] bg-[size:100%_4px] pointer-events-none" />
      
      {/* Glowing backdrop circle */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-[140px] opacity-25 mix-blend-screen pointer-events-none animate-pulse"
        style={{
          background: `radial-gradient(circle, ${theme.primaryColor} 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 max-w-[85vw] w-[580px] text-center flex flex-col items-center">
        {/* Badge with typing or reveal animation */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="px-3 py-1.5 rounded-full border text-[10px] sm:text-xs font-black tracking-widest uppercase mb-6 flex items-center gap-1.5"
          style={{
            borderColor: `${theme.primaryColor}50`,
            backgroundColor: `${theme.primaryColor}15`,
            color: theme.primaryColor,
            textShadow: `0 0 10px ${theme.glowColor}`
          }}
        >
          <Volume2 className="w-3.5 h-3.5 animate-bounce" />
          {theme.badgeText} {event.day ? `(DAY ${event.day})` : ''}
        </motion.div>

        {/* Big visual icon centerpiece */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 150,
            damping: 14,
            delay: 0.2
          }}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border flex items-center justify-center mb-6 shadow-2xl relative"
          style={{
            borderColor: `${theme.primaryColor}60`,
            backgroundColor: `${theme.secondaryColor}D0`,
            boxShadow: `0 0 45px ${theme.glowColor}`
          }}
        >
          <div className="absolute inset-0.5 rounded-full border border-white/10" />
          {theme.icon}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-none mb-3 select-text"
          style={{
            textShadow: `0 0 20px ${theme.glowColor}`
          }}
        >
          {event.title}
        </motion.h1>

        {/* Subtitle if custom */}
        {customSubtitle && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="text-[10px] sm:text-xs font-black tracking-wide uppercase text-white/50 mb-4 select-text"
            style={{ color: `${theme.primaryColor}D0` }}
          >
            {customSubtitle}
          </motion.div>
        )}

        {/* Body content */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-xs sm:text-sm text-white/70 leading-relaxed font-medium max-w-md select-text"
        >
          {event.body}
        </motion.p>

        {/* Spoken Quote if custom (Voice Transmission) */}
        {customQuote && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="mt-6 p-4 rounded border bg-black/75 relative font-serif max-w-md italic text-white/95 text-xs sm:text-sm text-center leading-relaxed"
            style={{
              borderColor: `${theme.primaryColor}30`,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
            }}
          >
            <div className="absolute -top-2.5 left-4 px-2 bg-black text-[7.5px] font-black uppercase tracking-widest text-white/40">
              {quoteHeader}
            </div>
            {customQuote}
          </motion.div>
        )}

        {/* Skipping guide */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="mt-12 text-[10px] text-white/60 tracking-wider uppercase font-semibold pointer-events-none"
        >
          화면을 클릭하거나 [Space / Enter]를 누르면 스킵됩니다
        </motion.div>

        {/* Time progress bar */}
        <div className="mt-6 w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: finalDuration / 1000, ease: "linear" }}
            className="h-full rounded-full"
            style={{ backgroundColor: theme.primaryColor }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------
// 2. CinematicBanner: Floating quick notification for minor/regular events
// ---------------------------------------------------------------------
interface CinematicBannerProps {
  event: WorldEvent
  onClose: () => void
  playbackSpeed?: number
}

export function CinematicBanner({ event, onClose, playbackSpeed = 1.0 }: CinematicBannerProps) {
  const theme = EVENT_THEMES[event.type] || EVENT_THEMES.default
  const duration = 3800 / playbackSpeed

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <motion.div
      initial={{ x: 120, opacity: 0, scale: 0.95 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 60, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 130, damping: 14 }}
      onClick={onClose}
      className="w-80 rounded-lg border bg-ink-950/92 backdrop-blur-md p-3 select-none pointer-events-auto cursor-pointer flex gap-3 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all duration-300"
      style={{
        borderColor: `${theme.primaryColor}30`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
      }}
    >
      {/* Glow highlight stripe */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-1"
        style={{ backgroundColor: theme.primaryColor }}
      />

      {/* Mini Icon Container */}
      <div 
        className="w-10 h-10 rounded border flex items-center justify-center shrink-0 self-center"
        style={{
          borderColor: `${theme.primaryColor}40`,
          backgroundColor: `${theme.secondaryColor}C0`,
        }}
      >
        {React.isValidElement(theme.icon) ? (
          React.cloneElement(theme.icon as React.ReactElement, { className: "w-5 h-5 text-center flex items-center justify-center" })
        ) : (
          <span className="text-xl">{theme.icon}</span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0">
        <span 
          className="text-[8px] font-black uppercase tracking-wider mb-0.5"
          style={{ color: theme.primaryColor }}
        >
          {theme.badgeText.split(' ')[0]} • DAY {event.day}
        </span>
        <h4 className="text-xs font-black text-white truncate">
          {event.title}
        </h4>
        <p className="text-[10px] text-white/50 truncate font-medium">
          {event.body}
        </p>
      </div>

      {/* Closing hint */}
      <div className="absolute top-2 right-2 text-[8px] font-black text-white/20 group-hover:text-white/40 transition-colors pointer-events-none">
        ✕
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------
// 3. Cinematic Queue Engine Manager
// ---------------------------------------------------------------------
interface WorldCinematicEngineProps {
  events: WorldEvent[]
  currentDay: number
  onClearQueue?: () => void
  animationMode?: 'all' | 'critical' | 'off'
  playbackSpeed?: number
}

export function WorldCinematicEngine({ 
  events, 
  currentDay, 
  onClearQueue,
  animationMode = 'all',
  playbackSpeed = 1.0
}: WorldCinematicEngineProps) {
  const [cinematicQueue, setCinematicQueue] = useState<WorldEvent[]>([])
  const [bannerQueue, setBannerQueue] = useState<WorldEvent[]>([])
  const [activeCinematic, setActiveCinematic] = useState<WorldEvent | null>(null)
  
  const processedEventIds = useRef<Set<string>>(new Set())
  const lastProcessedDay = useRef<number>(-1)

  // Scan for new events when the day advances or active events list updates
  useEffect(() => {
    if (!events || events.length === 0) return

    // If animation mode is completely disabled, mark all as processed silently
    if (animationMode === 'off') {
      events.forEach(evt => processedEventIds.current.add(evt.id))
      return
    }

    // If day was reset or is at start, reset processed IDs
    if (currentDay <= 1 || currentDay < lastProcessedDay.current) {
      processedEventIds.current.clear()
    }
    lastProcessedDay.current = currentDay

    const newCinematics: WorldEvent[] = []
    const newBanners: WorldEvent[] = []

    events.forEach(evt => {
      if (processedEventIds.current.has(evt.id)) return
      processedEventIds.current.add(evt.id)

      // Check filters based on animationMode - S-grade gates are critical disasters!
      const isCritical = evt.severity === 'critical' || evt.type === 'monarch_appear' || evt.type === 'home_reached' || evt.type === 'sgrade_gate'

      if (animationMode === 'critical' && !isCritical) {
        // Under 'critical' only mode, regular cinematics are downgraded to quick slide-in banners
        newBanners.push(evt)
      } else {
        if (evt.cinematic) {
          newCinematics.push(evt)
        } else {
          newBanners.push(evt)
        }
      }
    })

    // THROTTLING / OVERLOAD PREVENTION:
    // If the player simulates multiple days at once, many fullscreen overlays might get queued.
    // We immediately select the single absolute highest priority event to keep as overlay,
    // downgrading all other events to slide-in banners.
    if (newCinematics.length > 2) {
      const PRIORITY: Record<string, number> = {
        'home_reached': 10,
        'monarch_appear': 9,
        'home_threat': 8,
        'defeated': 7,
        'sgrade_gate': 6,
        'occupied': 5,
        'gate_surge': 4,
        'expand': 3,
        'awakening': 2,
        'gate_open': 1
      }

      let bestEvent = newCinematics[0]
      let maxPriority = -1
      for (const evt of newCinematics) {
        const p = PRIORITY[evt.type] ?? 0
        if (p > maxPriority) {
          maxPriority = p
          bestEvent = evt
        }
      }

      // Convert all other events to slide-in banners to avoid visual freeze
      newCinematics.forEach(evt => {
        if (evt.id === bestEvent.id) {
          // Keep the crown jewel cinematic overlay
        } else {
          newBanners.push(evt)
        }
      })

      setCinematicQueue(prev => [...prev, bestEvent])
    } else if (newCinematics.length > 0) {
      setCinematicQueue(prev => [...prev, ...newCinematics])
    }

    if (newBanners.length > 0) {
      // Banners are shown concurrently or limit to top 3 to prevent clutter
      setBannerQueue(prev => [...prev, ...newBanners].slice(-3))
    }
  }, [events, currentDay, animationMode])

  // Handle cinematic display queue sequentially
  useEffect(() => {
    if (!activeCinematic && cinematicQueue.length > 0) {
      const nextEvent = cinematicQueue[0]
      setActiveCinematic(nextEvent)
      setCinematicQueue(prev => prev.slice(1))
    }
  }, [cinematicQueue, activeCinematic])

  const handleCloseCinematic = () => {
    setActiveCinematic(null)
  }

  const handleCloseBanner = (id: string) => {
    setBannerQueue(prev => prev.filter(b => b.id !== id))
  }

  return (
    <>
      {/* Fullscreen Overlay Layer */}
      <AnimatePresence>
        {activeCinematic && (
          <CinematicOverlay 
            key={activeCinematic.id}
            event={activeCinematic}
            onClose={handleCloseCinematic}
            playbackSpeed={playbackSpeed}
          />
        )}
      </AnimatePresence>

      {/* Floating Minor Event Banners Layer (Top Right) */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {bannerQueue.map(banner => (
            <CinematicBanner
              key={banner.id}
              event={banner}
              onClose={() => handleCloseBanner(banner.id)}
              playbackSpeed={playbackSpeed}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
