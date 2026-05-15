import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../lib/store'
import { JOB_DEFINITIONS, JOB_LINE_META, CATEGORY_META, type JobDefinition } from '../lib/types'
import { ChevronDown, ChevronUp, Lock, Check } from 'lucide-react'

const TIER_LABEL: Record<0 | 1 | 2, string> = {
  0: '기본',
  1: '1차 각성',
  2: '2차 각성',
}

const TIER_COLOR: Record<0 | 1 | 2, string> = {
  0: 'text-zinc-300',
  1: 'text-cyan-300',
  2: 'text-purple-300',
}

function formatJobEffects(job: JobDefinition): string[] {
  const effects: string[] = []
  
  if (job.effects.xpBonusByCategory) {
    Object.entries(job.effects.xpBonusByCategory).forEach(([category, bonus]) => {
      const label = CATEGORY_META[category as keyof typeof CATEGORY_META]?.label || category
      effects.push(`${label} XP +${Math.round((bonus as number) * 100)}%`)
    })
  }
  
  if (job.effects.dropBonus) {
    effects.push(`드롭률 +${Math.round(job.effects.dropBonus * 100)}%`)
  }
  
  return effects.length > 0 ? effects : ['효과 없음']
}

export function JobPanel() {
  const [isJobListOpen, setIsJobListOpen] = useState(false)
  const hunter = useGame(s => s.hunter)
  const equipJob = useGame(s => s.equipJob)

  const currentJob = JOB_DEFINITIONS.find(j => j.id === hunter.jobId)
  const currentJobLine = currentJob ? JOB_LINE_META[currentJob.line] : null
  const unlockedJobCount = JOB_DEFINITIONS.filter(job => hunter.unlockedJobIds.includes(job.id)).length

  return (
    <div className="space-y-4">
      {/* Current Job Summary */}
      <div className="panel corner-bracket p-4 bg-gradient-to-br from-purple-500/10 to-cyan-500/10">
        <div className="br" />
        <div className="system-text text-[11px] text-cyan-400/70 mb-2">
          ── 현재 직업 ──
        </div>
        {currentJob && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              {currentJobLine && (
                <span className="text-xl">{currentJobLine.icon}</span>
              )}
              <div>
                <h3 className={`text-xl font-bold ${currentJob.id === 'unawakened' ? 'text-zinc-300' : 'text-amber-300'}`}>
                  {currentJob.name}
                </h3>
                {currentJobLine && (
                  <div className="text-xs text-cyan-300/60 system-text">
                    계열: {currentJobLine.label}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-white/70 mb-2">{currentJob.description}</p>
            {currentJob.id !== 'unawakened' ? (
              <div className="text-xs text-cyan-300/70 system-text">
                효과: {formatJobEffects(currentJob).join(', ')}
              </div>
            ) : (
              <div className="text-xs text-cyan-300/50 system-text italic">
                각성 조건을 달성하면 직업이 개방됩니다.
              </div>
            )}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-white/10 pt-3">
              <div className="text-xs system-text text-white/45">
                해금한 직업 {unlockedJobCount} / {JOB_DEFINITIONS.length}
              </div>
              <button
                type="button"
                onClick={() => setIsJobListOpen(prev => !prev)}
                className="inline-flex items-center justify-center gap-2 rounded border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs system-text text-cyan-200 hover:bg-cyan-400/15 transition"
              >
                {isJobListOpen ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    직업 목록 접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    직업 목록 펼치기
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Job List */}
      {isJobListOpen && (
      <div>
        <div className="system-text text-[11px] text-cyan-400/70 mb-3">
          ── 직업 목록 ──
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {JOB_DEFINITIONS.map(job => {
            const isUnlocked = hunter.unlockedJobIds.includes(job.id)
            const isEquipped = hunter.jobId === job.id
            const jobLine = JOB_LINE_META[job.line]
            const effects = formatJobEffects(job)

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`panel corner-bracket p-4 ${
                  isEquipped 
                    ? 'border-amber-400/60 bg-amber-400/5' 
                    : isUnlocked 
                    ? 'border-cyan-400/30 hover:border-cyan-400/50' 
                    : 'border-white/10 opacity-60'
                } transition`}
              >
                <div className="br" />
                
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isUnlocked ? (
                      isEquipped ? (
                        <Check className="w-4 h-4 text-amber-300" />
                      ) : (
                        <div className="w-4 h-4" />
                      )
                    ) : (
                      <Lock className="w-4 h-4 text-white/30" />
                    )}
                    <div>
                      <h4 className={`font-bold ${
                        isEquipped 
                          ? 'text-amber-300' 
                          : isUnlocked 
                          ? 'text-cyan-300' 
                          : 'text-white/50'
                      }`}>
                        {job.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] system-text text-cyan-300/50 mt-0.5">
                        <span>{jobLine.icon} {jobLine.label}</span>
                        <span className={TIER_COLOR[job.tier]}>· {TIER_LABEL[job.tier]}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className={`text-xs mb-2 ${isUnlocked ? 'text-white/70' : 'text-white/50'}`}>
                  {job.description}
                </p>

                {/* Unlock Condition */}
                <div className={`text-[10px] system-text mb-3 ${
                  isUnlocked ? 'text-cyan-300/60' : 'text-cyan-300/40'
                }`}>
                  해금 조건: {job.unlockText}
                </div>

                {/* Effects */}
                {job.id !== 'unawakened' && (
                  <div className={`text-[10px] system-text mb-3 ${
                    isUnlocked ? 'text-purple-300/70' : 'text-purple-300/40'
                  }`}>
                    효과: {effects.join(', ')}
                  </div>
                )}

                {/* Action Button */}
                {isEquipped ? (
                  <div className="text-center py-1.5 rounded bg-amber-400/20 text-amber-300 text-xs font-medium border border-amber-400/40">
                    장착 중
                  </div>
                ) : isUnlocked ? (
                  <button
                    onClick={() => equipJob(job.id)}
                    className="w-full btn btn-primary text-xs"
                  >
                    전환
                  </button>
                ) : (
                  <div className="text-center py-1.5 rounded bg-white/5 text-white/30 text-xs border border-white/10">
                    잠김
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
      )}
    </div>
  )
}
