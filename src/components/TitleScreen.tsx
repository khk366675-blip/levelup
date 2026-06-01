import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, Terminal, Zap } from 'lucide-react'

interface TitleScreenProps {
  onEnter: () => void
}

const SYSTEM_LINES = [
  '[SYSTEM] 플레이어 생체 신호 감지',
  '[RIFT] 균열 좌표 동기화 중...',
  '[HUNTER SYSTEM] 권한 각성 대기',
  '[QUERY] 시스템에 접속하시겠습니까?',
]

export function TitleScreen({ onEnter }: TitleScreenProps) {
  const [typedCount, setTypedCount] = useState(0)
  const enteredRef = useRef(false)
  const systemText = useMemo(() => SYSTEM_LINES.join('\n'), [])
  const isReady = typedCount >= systemText.length

  const enterSystem = () => {
    if (enteredRef.current) return
    enteredRef.current = true
    onEnter()
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
        event.preventDefault()
        enterSystem()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (typedCount >= systemText.length) return

    const timer = window.setTimeout(() => {
      setTypedCount(count => Math.min(systemText.length, count + 1))
    }, 24)

    return () => window.clearTimeout(timer)
  }, [systemText.length, typedCount])

  return (
    <motion.div
      className="fixed inset-0 z-[120] min-h-screen cursor-pointer overflow-hidden bg-ink-950 text-white"
      onClick={enterSystem}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.38 }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#02030a_0%,#060814_44%,#0b1020_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_28%,rgba(96,232,255,0.22),transparent_36%),radial-gradient(ellipse_at_50%_52%,rgba(127,119,221,0.18),transparent_42%)]" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(96,232,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(96,232,255,0.04)_1px,transparent_1px)] [background-size:46px_46px] [mask-image:radial-gradient(ellipse_at_center,black_34%,transparent_78%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.018)_50%,transparent_50%)] bg-[size:100%_4px]" />

      <motion.div
        className="absolute left-1/2 top-0 h-full w-28 -translate-x-1/2 blur-[1px]"
        style={{
          clipPath: 'polygon(44% 0, 58% 0, 51% 13%, 60% 27%, 49% 43%, 57% 59%, 46% 100%, 37% 100%, 45% 62%, 36% 45%, 47% 26%, 40% 12%)',
          background: 'linear-gradient(180deg, transparent 0%, rgba(96, 232, 255, 0.34) 20%, rgba(167, 139, 250, 0.62) 48%, rgba(34, 211, 238, 0.38) 78%, transparent 100%)',
          boxShadow: '0 0 46px rgba(96, 232, 255, 0.38)',
        }}
        initial={{ opacity: 0, scaleY: 0.7 }}
        animate={{ opacity: [0.35, 0.9, 0.55], scaleY: [0.9, 1.04, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute left-1/2 top-[18%] h-px w-[88vw] max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent"
        initial={{ opacity: 0, scaleX: 0.15 }}
        animate={{ opacity: [0, 0.9, 0.35], scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.15 }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="flex w-full max-w-5xl flex-col items-center gap-6 text-center sm:gap-8">
          <motion.div
            className="inline-flex items-center gap-2 rounded border border-cyan-300/25 bg-cyan-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200 shadow-glow system-text"
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.25 }}
          >
            <Zap className="h-3.5 w-3.5 text-cyan-300" />
            Hunter System Online
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.48 }}
          >
            <h1 className="select-none text-5xl font-black leading-none tracking-[0.12em] text-transparent sm:text-7xl sm:tracking-[0.18em] md:text-8xl bg-gradient-to-b from-white via-cyan-100 to-violet-300 bg-clip-text drop-shadow-[0_0_28px_rgba(96,232,255,0.42)]">
              LEVEL UP
            </h1>
            <div className="mx-auto h-px w-48 max-w-[72vw] bg-gradient-to-r from-transparent via-violet-300/70 to-transparent" />
            <p className="system-text text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-100/65 sm:text-xs">
              Rift World Awakening Protocol
            </p>
          </motion.div>

          <motion.div
            className="scan-line relative w-full max-w-xl overflow-hidden rounded-lg border border-cyan-300/20 bg-black/55 p-4 text-left shadow-[0_0_32px_rgba(34,211,238,0.10)] sm:p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.9 }}
          >
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 text-cyan-200">
                <Terminal className="h-4 w-4" />
                <span className="system-text text-[10px] font-black uppercase tracking-[0.2em]">System Notice</span>
              </div>
              <span className="system-text text-[9px] font-bold text-violet-200/60">ACCESS NODE 01</span>
            </div>
            <pre className="system-text min-h-[7.25rem] whitespace-pre-wrap text-[11px] leading-6 text-cyan-100/85 sm:text-xs">
              {systemText.slice(0, typedCount)}
              <span className="inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-cyan-200/80" />
            </pre>
          </motion.div>

          <motion.button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              enterSystem()
            }}
            className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-md border px-6 py-3 text-sm font-black uppercase tracking-[0.18em] transition-all duration-300 system-text ${
              isReady
                ? 'border-cyan-300/70 bg-cyan-300/20 text-white shadow-glow hover:border-white/70 hover:bg-cyan-200/25 hover:shadow-glow-lg'
                : 'border-violet-300/45 bg-violet-400/10 text-violet-100 shadow-glow-purple hover:bg-violet-300/20'
            }`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: isReady ? [1, 1.025, 1] : 1 }}
            transition={{ duration: isReady ? 1.6 : 0.45, delay: 1.15, repeat: isReady ? Infinity : 0 }}
          >
            <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            [ 시스템 각성 ]
          </motion.button>

          <motion.div
            className="system-text text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            transition={{ duration: 0.5, delay: 1.45 }}
          >
            Click / Enter / Space
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
