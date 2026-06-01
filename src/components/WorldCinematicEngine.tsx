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
  default: {
    primaryColor: '#3b82f6', // system blue
    secondaryColor: '#0f172a',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    gradient: 'from-blue-950/90 via-slate-900/80 to-ink-950/90',
    badgeText: '📢 시스템 기록 (SYSTEM INTEL)',
    icon: <Sparkles className="w-16 h-16 text-blue-400" />
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
  }
  onClose: () => void
  durationMs?: number
}

export function CinematicOverlay({ event, onClose, durationMs = 4500 }: CinematicOverlayProps) {
  const theme = EVENT_THEMES[event.type] || EVENT_THEMES.default
  const progressRef = useRef<HTMLDivElement>(null)

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
    }, durationMs)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(autoCloseTimer)
    }
  }, [onClose, durationMs])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
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
          transition={{ delay: 0.15, duration: 0.35 }}
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
            stiffness: 140,
            damping: 12,
            delay: 0.3 
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
          transition={{ delay: 0.45, duration: 0.4 }}
          className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-none mb-4 select-text"
          style={{
            textShadow: `0 0 20px ${theme.glowColor}`
          }}
        >
          {event.title}
        </motion.h1>

        {/* Body content */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-xs sm:text-sm text-white/70 leading-relaxed font-medium max-w-md select-text"
        >
          {event.body}
        </motion.p>

        {/* Skipping guide */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="mt-12 text-[10px] text-white/60 tracking-wider uppercase font-semibold pointer-events-none"
        >
          화면을 클릭하거나 [Space / Enter]를 누르면 스킵됩니다
        </motion.div>

        {/* Time progress bar */}
        <div className="mt-6 w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: durationMs / 1000, ease: "linear" }}
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
}

export function CinematicBanner({ event, onClose }: CinematicBannerProps) {
  const theme = EVENT_THEMES[event.type] || EVENT_THEMES.default

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3800)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ x: 120, opacity: 0, scale: 0.95 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 60, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
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
        {React.cloneElement(theme.icon as React.ReactElement, { className: "w-5 h-5" })}
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0">
        <span 
          className="text-[8px] font-black uppercase tracking-wider mb-0.5"
          style={{ color: theme.primaryColor }}
        >
          SYSTEM INTEL • DAY {event.day}
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
}

export function WorldCinematicEngine({ events, currentDay, onClearQueue }: WorldCinematicEngineProps) {
  const [cinematicQueue, setCinematicQueue] = useState<WorldEvent[]>([])
  const [bannerQueue, setBannerQueue] = useState<WorldEvent[]>([])
  const [activeCinematic, setActiveCinematic] = useState<WorldEvent | null>(null)
  
  const processedEventIds = useRef<Set<string>>(new Set())
  const lastProcessedDay = useRef<number>(-1)

  // Scan for new events when the day advances or active events list updates
  useEffect(() => {
    if (!events || events.length === 0) return

    // If day was reset, reset processed IDs
    if (currentDay < lastProcessedDay.current) {
      processedEventIds.current.clear()
    }
    lastProcessedDay.current = currentDay

    const newCinematics: WorldEvent[] = []
    const newBanners: WorldEvent[] = []

    events.forEach(evt => {
      if (processedEventIds.current.has(evt.id)) return
      processedEventIds.current.add(evt.id)

      if (evt.cinematic) {
        newCinematics.push(evt)
      } else {
        newBanners.push(evt)
      }
    })

    if (newCinematics.length > 0) {
      setCinematicQueue(prev => [...prev, ...newCinematics])
    }

    if (newBanners.length > 0) {
      // Banners are shown concurrently or limit to top 3 to prevent clutter
      setBannerQueue(prev => [...prev, ...newBanners].slice(-3))
    }
  }, [events, currentDay])

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
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
