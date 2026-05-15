import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../lib/store'

const KIND_STYLE: Record<string, { accent: string; glow: string; tag: string }> = {
  levelup: { accent: 'border-amber-400/60', glow: 'shadow-[0_0_60px_rgba(251,191,36,0.4)]', tag: 'text-amber-300' },
  quest:   { accent: 'border-cyan-400/60',  glow: 'shadow-glow-lg', tag: 'text-cyan-300' },
  item:    { accent: 'border-purple-400/60', glow: 'shadow-glow-purple', tag: 'text-purple-300' },
  title:   { accent: 'border-pink-400/60',   glow: 'shadow-[0_0_40px_rgba(244,114,182,0.4)]', tag: 'text-pink-300' },
  rank:    { accent: 'border-red-400/70',    glow: 'shadow-[0_0_60px_rgba(248,113,113,0.4)]', tag: 'text-red-300' },
  info:    { accent: 'border-white/40',      glow: '', tag: 'text-white/70' },
}

export function SystemMessageQueue() {
  const messages = useGame(s => s.messages)
  const dismiss = useGame(s => s.dismissMessage)

  // show only the latest
  const current = messages[0]

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
            className={`relative panel corner-bracket ${KIND_STYLE[current.kind].accent} ${KIND_STYLE[current.kind].glow}
              p-8 min-w-[320px] max-w-md text-center`}
          >
            <div className="br" />
            <div className={`system-text text-[11px] tracking-[0.3em] ${KIND_STYLE[current.kind].tag} mb-3`}>
              ── SYSTEM ──
            </div>
            <motion.h2
              initial={{ letterSpacing: '0.5em', opacity: 0 }}
              animate={{ letterSpacing: '0.05em', opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className={`text-2xl font-bold mb-4 ${KIND_STYLE[current.kind].tag}`}
            >
              {current.title}
            </motion.h2>
            <div className="space-y-1.5 mb-6">
              {current.lines.map((line, i) => (
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
