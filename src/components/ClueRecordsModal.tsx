import { motion, AnimatePresence } from 'framer-motion'
import { X, Radio } from 'lucide-react'
import { useGame } from '../lib/store'
import { WORLD_SIGNAL_TEMPLATES } from '../lib/worldSignals'

interface ClueRecordsModalProps {
  open: boolean
  onClose: () => void
}

const getIntensityStep = (intensity: number) => {
  if (!intensity || intensity <= 0) {
    return {
      status: '고요함',
      desc: '현재 시공간의 관측 기록에 이질적인 주파수가 감지되지 않는 고요한 상태입니다.',
      color: 'text-zinc-500',
      progress: 0,
    }
  }
  if (intensity <= 30) {
    return {
      status: '위화감 감지',
      desc: '공간의 깊은 틈새로부터 설명할 수 없는 옅은 위화감이 감돌고 있습니다.',
      color: 'text-cyan-400/80',
      progress: 1,
    }
  }
  if (intensity <= 60) {
    return {
      status: '이상 파동 인지',
      desc: '흘러나오는 파장이 한층 뚜렷해지며, 흩어졌던 신호들이 어렴풋하게 인지되기 시작합니다. 조각들이 모여 형태를 취해갑니다.',
      color: 'text-purple-400',
      progress: 2,
    }
  }
  return {
    status: '진실에 근접',
    desc: '격막 뒤편의 주파수가 격렬하게 진동하며, 마침내 감춰져 있던 종착지에 매우 근접하고 있습니다.',
    color: 'text-red-400 animate-pulse',
    progress: 3,
  }
}

export function ClueRecordsModal({ open, onClose }: ClueRecordsModalProps) {
  const s = useGame()
  const discoveredSignalIds = s.secretProgress?.worldSignals?.discoveredSignalIds ?? []
  const intensity = s.secretProgress?.worldSignals?.intensity ?? 0

  const step = getIntensityStep(intensity)

  // Filter signals templates matching discovered IDs
  const discoveredSignals = discoveredSignalIds
    .map(id => (WORLD_SIGNAL_TEMPLATES as any)[id])
    .filter(Boolean)
    // Filter out potential spoilers level >= 3 (sealed ultimate truths) just in case
    .filter(sig => sig.spoilerLevel <= 2)

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="panel panel-glow corner-bracket w-full max-w-lg bg-ink-950/95 border-cyan-400/25 p-5 relative z-10 flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="br" /> <div className="tl" /> <div className="tr" /> <div className="bl" />
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-sm font-extrabold text-cyan-100 tracking-wider system-text">
                  📡 차원 관측 로그
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition p-1 hover:bg-white/5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="space-y-5 overflow-y-auto pr-1 flex-1">
              
              {/* Progress Summary Section */}
              <div className="bg-slate-950/50 border border-white/5 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-cyan-300/60 font-bold font-mono tracking-wider">
                    RESONANCE PHASE
                  </span>
                  <span className={`text-xs font-bold ${step.color}`}>{step.status}</span>
                </div>
                
                {/* Visual Step Indicator */}
                <div className="flex gap-2 h-1.5">
                  {[1, 2, 3].map((val) => (
                    <div
                      key={val}
                      className={`flex-1 rounded-sm transition-all duration-500 ${
                        val <= step.progress
                          ? val === 1
                            ? 'bg-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.35)]'
                            : val === 2
                            ? 'bg-purple-500/70 shadow-[0_0_10px_rgba(167,139,250,0.45)]'
                            : 'bg-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.55)]'
                          : 'bg-white/5 border border-white/5'
                      }`}
                    />
                  ))}
                </div>
                
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  {step.desc}
                </p>
              </div>

              {/* Accumulated Clues Section */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-bold text-cyan-300/60 tracking-wider font-mono uppercase">
                  ACCCUMULATED COGNITIVE SIGNS ({discoveredSignals.length})
                </h3>

                {discoveredSignals.length === 0 ? (
                  <div className="panel bg-black/20 border-white/5 p-8 text-center rounded-lg">
                    <p className="text-xs text-zinc-500">
                      아직 시스템 기하학에서 포착된 비공개 이상 징후가 없습니다.
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      다양한 원정과 전투 등을 지속하면 미지의 신호가 흔적을 남깁니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {discoveredSignals.map((sig, idx) => (
                      <div
                        key={sig.id}
                        className="bg-slate-900/40 border border-cyan-400/10 hover:border-cyan-400/25 rounded-md p-3 space-y-1 transition duration-200"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-cyan-300">
                            {sig.title}
                          </span>
                          <span className="text-[8.5px] text-cyan-300/35 font-mono">
                            RECORD #{idx + 1}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                          {sig.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer Notice */}
            <div className="border-t border-cyan-500/10 pt-3 mt-4 text-center">
              <p className="text-[9px] text-cyan-300/30 system-text uppercase">
                ── warning // cognitive synchronization active ──
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
