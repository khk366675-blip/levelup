import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../lib/store'
import { sanitizeRetiredTowerText } from '../lib/retiredTowerUi'

const KIND_STYLE: Record<string, { accent: string; glow: string; tag: string }> = {
  levelup: { accent: 'border-amber-400/60', glow: 'shadow-[0_0_60px_rgba(251,191,36,0.4)]', tag: 'text-amber-300' },
  quest:   { accent: 'border-cyan-400/60',  glow: 'shadow-glow-lg', tag: 'text-cyan-300' },
  item:    { accent: 'border-purple-400/60', glow: 'shadow-glow-purple', tag: 'text-purple-300' },
  title:   { accent: 'border-pink-400/60',   glow: 'shadow-[0_0_40px_rgba(244,114,182,0.4)]', tag: 'text-pink-300' },
  shadow:  { accent: 'border-violet-400/60', glow: 'shadow-glow-purple', tag: 'text-violet-300' },
  rank:    { accent: 'border-red-400/70',    glow: 'shadow-[0_0_60px_rgba(248,113,113,0.4)]', tag: 'text-red-300' },
  story:   { accent: 'border-sky-300/40',    glow: 'shadow-[0_0_44px_rgba(125,211,252,0.22)]', tag: 'text-sky-200' },
  secret:  { accent: 'border-violet-200/35', glow: 'shadow-[0_0_48px_rgba(167,139,250,0.2)]', tag: 'text-violet-200' },
  info:    { accent: 'border-white/40',      glow: '', tag: 'text-white/70' },
}

export function SystemMessageQueue() {
  const messages = useGame(s => s.messages)
  const dismiss = useGame(s => s.dismissMessage)

  // show only the latest
  const current = messages[0]
  const dramatic = current?.kind === 'levelup' || current?.kind === 'rank'
  const style = current ? (KIND_STYLE[current.kind] ?? KIND_STYLE.info) : KIND_STYLE.info
  const displayTitle = sanitizeRetiredTowerText(current?.title)
  const displayLines = current?.lines.map(line => sanitizeRetiredTowerText(line)) ?? []

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => dismiss(current.id)}
        >
          <motion.div
            initial={{ scale: 0.7, rotateX: -30, opacity: 0 }}
            animate={{ scale: 1, rotateX: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative panel corner-bracket ${dramatic ? 'system-message-dramatic' : ''} ${style.accent} ${style.glow}
              p-8 min-w-[320px] max-w-md text-center`}
          >
            <div className="br" />
            <div className={`system-text text-[11px] tracking-[0.3em] ${style.tag} mb-3`}>
              ── SYSTEM ──
            </div>
            <motion.h2
              initial={{ letterSpacing: '0.5em', opacity: 0 }}
              animate={{ letterSpacing: '0.05em', opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className={`text-2xl font-bold mb-4 ${style.tag}`}
            >
              {displayTitle}
            </motion.h2>

            {current.kind === 'rank' && current.grade && (
              <div className="flex justify-center my-6">
                <motion.div
                  initial={{ scale: 0.5, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', delay: 0.3, stiffness: 120, damping: 14 }}
                  className={`w-28 h-28 rounded-full flex items-center justify-center border-4 bg-ink-950/90 shadow-2xl relative ${
                    current.grade === 'NATIONAL' ? 'border-red-500 shadow-red-600/50' :
                    current.grade === 'S' ? 'border-amber-500 shadow-amber-500/40' :
                    current.grade === 'A' ? 'border-pink-500 shadow-pink-500/30' :
                    current.grade === 'B' ? 'border-purple-500 shadow-purple-500/30' :
                    current.grade === 'C' ? 'border-cyan-500 shadow-cyan-500/30' :
                    current.grade === 'D' ? 'border-emerald-500 shadow-emerald-500/20' :
                    'border-zinc-500 shadow-zinc-500/10'
                  }`}
                >
                  {/* Rotating dashed border for high grades */}
                  {(current.grade === 'S' || current.grade === 'NATIONAL') && (
                    <div className={`absolute -inset-2 rounded-full border-2 border-dashed animate-spin opacity-50 ${
                      current.grade === 'NATIONAL' ? 'border-red-500' : 'border-amber-500'
                    }`} />
                  )}
                  {/* Outer pulsating aura */}
                  <div className={`absolute -inset-4 rounded-full border border-dashed animate-pulse opacity-25 blur-sm ${
                    current.grade === 'NATIONAL' ? 'border-red-500' :
                    current.grade === 'S' ? 'border-amber-500' :
                    current.grade === 'A' ? 'border-pink-500' :
                    current.grade === 'B' ? 'border-purple-500' :
                    current.grade === 'C' ? 'border-cyan-500' :
                    current.grade === 'D' ? 'border-emerald-500' :
                    'border-zinc-500'
                  }`} />
                  
                  <span className={`text-5xl font-black tracking-widest filter drop-shadow-[0_0_12px_rgba(0,0,0,0.6)] ${
                    current.grade === 'NATIONAL' ? 'text-red-400' :
                    current.grade === 'S' ? 'text-amber-400' :
                    current.grade === 'A' ? 'text-pink-400' :
                    current.grade === 'B' ? 'text-purple-400' :
                    current.grade === 'C' ? 'text-cyan-400' :
                    current.grade === 'D' ? 'text-emerald-400' :
                    'text-zinc-400'
                  }`}>
                    {current.grade === 'NATIONAL' ? 'N' : current.grade}
                  </span>
                </motion.div>
              </div>
            )}

            <div className="space-y-1.5 mb-6">
              {displayLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="text-white/90 system-text text-sm"
                >
                  {line}
                </motion.div>
              ))}
            </div>
            <button
              onClick={() => dismiss(current.id)}
              className="btn btn-primary text-xs"
            >
              확인
            </button>

            {messages.length > 1 && (
              <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-cyan-400 text-ink-900 text-[10px] font-bold">
                +{messages.length - 1}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
