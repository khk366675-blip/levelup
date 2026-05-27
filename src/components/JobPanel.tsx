import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../lib/store'
import { JOB_DEFINITIONS_V2 } from '../lib/jobs'
import { CATEGORY_META, STAT_META } from '../lib/types'
import type { JobDefinitionV2, JobTier, JobRarity, JobArchetype, OwnedJobState, JobId } from '../lib/types'
import { ChevronDown, ChevronUp, Lock, Check, Sparkles, Wand2, ShieldAlert, Award } from 'lucide-react'

const TIER_LABEL: Record<JobTier, string> = {
  novice: '기본',
  first: '1차 전직',
  second: '2차 전직',
  third: '3차 전직',
  hidden: '히든 직업',
  unique: '유니크 직업',
}

const TIER_COLOR: Record<JobTier, string> = {
  novice: 'text-zinc-400',
  first: 'text-cyan-300',
  second: 'text-purple-300',
  third: 'text-amber-300',
  hidden: 'text-rose-400',
  unique: 'text-indigo-400',
}

const RARITY_COLOR: Record<JobRarity, string> = {
  common: 'text-zinc-400 border-zinc-500/20',
  rare: 'text-cyan-400 border-cyan-500/30',
  epic: 'text-purple-400 border-purple-500/40',
  legendary: 'text-amber-400 border-amber-500/50 shadow-glow-lg',
  hidden: 'text-rose-400 border-rose-500/50 shadow-glow-rose',
  unique: 'text-indigo-400 border-indigo-500/50 shadow-glow-blue',
}

const ARCHETYPE_GRADIENT: Record<JobArchetype, string> = {
  warrior: 'from-red-500/10 to-orange-500/5 border-red-500/20',
  mage: 'from-blue-500/10 to-indigo-500/5 border-blue-500/20',
  rogue: 'from-purple-500/10 to-fuchsia-500/5 border-purple-500/20',
  cleric: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20',
  tactician: 'from-cyan-500/10 to-blue-500/5 border-cyan-500/20',
  special: 'from-rose-500/15 to-amber-500/5 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
}

function formatJobModifiers(job: JobDefinitionV2): string[] {
  const mods: string[] = []
  if (job.statModifiers) {
    Object.entries(job.statModifiers).forEach(([stat, val]) => {
      mods.push(`${STAT_META[stat as keyof typeof STAT_META]?.label || stat} +${val}`)
    })
  }
  return mods.length > 0 ? mods : ['기본 스탯 효과']
}

export function JobPanel() {
  const [isJobListOpen, setIsJobListOpen] = useState(false)
  const hunter = useGame(s => s.hunter)
  const equipJob = useGame(s => s.equipJob)
  const advanceToJob = useGame(s => s.advanceToJob)
  
  // Game states to check requirements locally
  const infiniteTower = useGame(s => s.infiniteTower)
  const achievementStats = useGame(s => s.achievementStats)
  const ownedShadows = useGame(s => s.ownedShadows)

  const activeJobId = hunter.activeJobId || 'novice-hunter'
  const jobs: Partial<Record<JobId, OwnedJobState>> = hunter.jobs || {}
  const availableAdvancements = hunter.availableAdvancements || []
  const discoveredHiddenJobIds = hunter.discoveredHiddenJobIds || []

  const currentJob = JOB_DEFINITIONS_V2.find(j => j.id === activeJobId)
  const currentJobState = jobs[activeJobId] || { jobId: activeJobId, level: 1, xp: 0 }
  
  const reqXp = currentJobState.level * 150
  const xpPercent = Math.min(100, Math.round((currentJobState.xp / reqXp) * 100))
  
  const unlockedJobCount = JOB_DEFINITIONS_V2.filter(job => 
    (hunter.unlockedJobIds || []).includes(job.id) || jobs[job.id]
  ).length

  // Sorted list for catalog (bottom section)
  const tierOrder: Record<JobTier, number> = {
    novice: 0,
    first: 1,
    second: 2,
    third: 3,
    hidden: 4,
    unique: 5,
  }

  const sortedJobs = [...JOB_DEFINITIONS_V2].sort((a, b) => {
    return tierOrder[a.tier] - tierOrder[b.tier]
  })

  // Candidates for Next Tier Advancement
  // 1. Regular advancement candidate paths
  const regularNextJobIds = currentJob?.nextJobIds || []

  // 2. Discovered Hidden candidates (conditions met, ready for acceptance)
  const discoveredHiddenCandidates = discoveredHiddenJobIds.filter(id => 
    !(hunter.unlockedJobIds || []).includes(id) && activeJobId !== id
  )

  const totalCandidateIds = Array.from(new Set([
    ...regularNextJobIds,
    ...discoveredHiddenCandidates
  ])).filter(id => !(hunter.unlockedJobIds || []).includes(id))

  return (
    <div className="space-y-4">
      {/* 1. Current Job Card */}
      {currentJob && (
        <div className={`panel corner-bracket p-5 bg-gradient-to-br ${ARCHETYPE_GRADIENT[currentJob.archetype]} relative overflow-hidden`}>
          <div className="br" />
          
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="system-text text-[10px] text-cyan-400/80 mb-1">
                ── 현재 활성 클래스 ──
              </div>
              <h2 className="text-2xl font-black text-amber-300 tracking-wider">
                {currentJob.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs system-text font-bold ${TIER_COLOR[currentJob.tier]}`}>
                  {TIER_LABEL[currentJob.tier]}
                </span>
                <span className="text-zinc-500 text-[10px]">•</span>
                <span className="text-xs text-white/50">{currentJob.combatStyle}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white/80 system-text">
                Lv.{currentJobState.level}
              </span>
            </div>
          </div>

          <p className="text-xs text-white/70 mb-4 leading-relaxed">
            {currentJob.description}
          </p>

          {/* XP Progress Bar */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[10px] system-text text-white/50">
              <span>클래스 숙련도 (XP)</span>
              <span>{currentJobState.xp} / {reqXp} ({xpPercent}%)</span>
            </div>
            <div className="w-full h-2 rounded bg-black/40 overflow-hidden border border-white/5 p-0.5">
              <div 
                className="h-full rounded-sm bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Job Effects Breakdown */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
            <div>
              <span className="text-white/40 block mb-1">전투 스탯 수정치</span>
              <div className="font-medium text-white/90 space-y-0.5">
                {formatJobModifiers(currentJob).map((mod, i) => (
                  <div key={i}>• {mod}</div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-white/40 block mb-1">성장 카테고리 친화성</span>
              <div className="text-purple-300 font-medium space-y-0.5">
                {currentJob.growthAffinity?.questCategoryBonus && Object.keys(currentJob.growthAffinity.questCategoryBonus).length > 0 ? (
                  Object.entries(currentJob.growthAffinity.questCategoryBonus).map(([cat, val]) => {
                    const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META]
                    return (
                      <div key={cat} className="flex items-center gap-1">
                        <span>{meta?.icon}</span>
                        <span>{meta?.label} XP +{Math.round((val ?? 0) * 100)}%</span>
                      </div>
                    )
                  })
                ) : (
                  <span className="text-zinc-500 italic">균등 성장형</span>
                )}
              </div>
            </div>
          </div>

          {/* Toggle bottom catalog button */}
          <div className="mt-5 flex justify-between items-center pt-3 border-t border-white/10">
            <div className="text-[10px] text-white/40 system-text">
              도달클래스 성취 {unlockedJobCount} / {JOB_DEFINITIONS_V2.length}
            </div>
            <button
              type="button"
              onClick={() => setIsJobListOpen(prev => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs system-text text-zinc-300 hover:bg-zinc-700 transition-all"
            >
              {isJobListOpen ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  클래스 도감 접기
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  클래스 도감 열기
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. Next Advancement Candidate Classes (실사용 전직 선택지) */}
      <div className="space-y-3">
        <div className="system-text text-[11px] text-cyan-400/80 mb-1">
          ── 다음 단계 전직 후보 ──
        </div>
        
        {totalCandidateIds.length === 0 ? (
          <div className="panel corner-bracket p-5 text-center text-zinc-500 text-xs border border-dashed border-zinc-800">
            현재 클래스에서 파생 가능한 더 이상의 다음 클래스 후보가 없거나 최종 단계에 도달했습니다.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {totalCandidateIds.map(candId => {
              const job = JOB_DEFINITIONS_V2.find(j => j.id === candId)
              if (!job) return null

              const isHidden = job.tier === 'hidden' || job.hiddenProfile?.isHidden
              const isDiscovered = discoveredHiddenJobIds.includes(job.id) || availableAdvancements.includes(job.id)
              
              // Evaluate conditions
              const cond = job.unlockCondition
              let isConditionMet = true
              const condLines: { text: string; met: boolean }[] = []

              if (cond) {
                if (cond.hunterLevel !== undefined) {
                  const met = hunter.level >= cond.hunterLevel
                  condLines.push({ text: `헌터 Lv.${cond.hunterLevel}`, met })
                  if (!met) isConditionMet = false
                }
                if (cond.previousJobLevel !== undefined && job.previousJobIds) {
                  const prevJobState = job.previousJobIds.map(prevId => jobs[prevId]).find(js => js && js.level >= (cond.previousJobLevel ?? 0))
                  const met = !!prevJobState
                  condLines.push({ text: `이전 클래스 Lv.${cond.previousJobLevel}`, met })
                  if (!met) isConditionMet = false
                }
                if (cond.towerFloorCleared !== undefined) {
                  const met = (infiniteTower?.highestClearedFloor ?? 0) >= cond.towerFloorCleared
                  condLines.push({ text: `무한의 탑 ${cond.towerFloorCleared}층 클리어`, met })
                  if (!met) isConditionMet = false
                }
                if (cond.gateClearCount !== undefined) {
                  const met = (achievementStats?.dungeonClears.total ?? 0) >= cond.gateClearCount
                  condLines.push({ text: `게이트 클리어 ${cond.gateClearCount}회`, met })
                  if (!met) isConditionMet = false
                }
                if (cond.bossClearCount !== undefined) {
                  const met = (achievementStats?.dungeonClears.total ?? 0) >= cond.bossClearCount
                  condLines.push({ text: `보스 토벌 ${cond.bossClearCount}회`, met })
                  if (!met) isConditionMet = false
                }
                if (cond.shadowCount !== undefined) {
                  const met = (ownedShadows?.length ?? 0) >= cond.shadowCount
                  condLines.push({ text: `그림자 부하 ${cond.shadowCount}마리`, met })
                  if (!met) isConditionMet = false
                }
                if (cond.hiddenSignalKeys && cond.hiddenSignalKeys.length > 0) {
                  cond.hiddenSignalKeys.forEach(key => {
                    const met = (hunter.hiddenSignalKeys || []).includes(key)
                    let text = `특수 업적 [${key}]`
                    if (key === 'shadow-extraction-attempt') {
                      text = '그림자 추출 시도'
                    } else if (key === 'low-hp-victory') {
                      text = '생사경 극복 승리 (HP 15% 이하)'
                    } else if (key === 'long-battle-victory') {
                      text = '장기전 끝의 승리 (20턴 이상)'
                    }
                    condLines.push({ text, met })
                    if (!met) isConditionMet = false
                  })
                }
              }

              const canAdvance = isConditionMet || isDiscovered

              // Render MASKED hidden class
              if (isHidden && !canAdvance) {
                return (
                  <div 
                    key={job.id} 
                    className="panel corner-bracket p-4 border border-zinc-900 bg-zinc-950/60 opacity-50 relative"
                  >
                    <div className="br" />
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-3.5 h-3.5 text-rose-500/70" />
                      <h4 className="font-bold text-zinc-500 system-text tracking-wide">
                        {job.hiddenProfile?.maskedName || '미확인 기척 클래스'}
                      </h4>
                      <span className="text-[9px] text-rose-400 bg-rose-950/40 px-1 py-0.5 rounded border border-rose-500/20">히든</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 italic leading-relaxed">
                      힌트: {job.hiddenProfile?.hintText || '심연에 도사린 고유 시련이 해금 조건을 충족해야 합니다.'}
                    </p>
                  </div>
                )
              }

              // Render normal / revealed class candidates
              return (
                <div 
                  key={job.id}
                  className={`panel corner-bracket p-4 bg-gradient-to-br ${
                    canAdvance 
                      ? 'from-cyan-950/15 to-blue-950/5 border-cyan-400/40 shadow-[0_0_10px_rgba(34,211,238,0.05)]' 
                      : 'from-black/10 to-black/20 opacity-75 border-zinc-800'
                  } relative`}
                >
                  <div className="br" />
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {isHidden ? (
                          <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
                        ) : (
                          <Wand2 className="w-4 h-4 text-cyan-400" />
                        )}
                        <h4 className={`font-black text-sm tracking-wide ${isHidden ? 'text-rose-300' : 'text-white/90'}`}>
                          {job.name} {isHidden && <span className="text-[9px] text-rose-400">(히든)</span>}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-white/40 mt-1">
                        <span className={TIER_COLOR[job.tier]}>{TIER_LABEL[job.tier]}</span>
                        <span>•</span>
                        <span>{job.combatStyle}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-white/60 mb-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Conditions Check Display */}
                  {condLines.length > 0 && (
                    <div className="space-y-1 bg-black/30 p-2 rounded border border-white/5 mb-3 text-[10px] system-text">
                      <div className="text-[9px] text-white/30 mb-1">클래스 전직 충족 요건:</div>
                      {condLines.map((line, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className={line.met ? 'text-white/60' : 'text-white/40'}>{line.text}</span>
                          <span className={line.met ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            {line.met ? '✓ 충족' : '✗ 미달'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Advancement Accept Button */}
                  {canAdvance ? (
                    <button
                      type="button"
                      onClick={() => advanceToJob(job.id)}
                      className={`w-full py-1.5 text-center rounded text-xs font-black transition active:scale-[0.98] ${
                        isHidden 
                          ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-glow-rose hover:brightness-110' 
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-glow hover:brightness-110'
                      }`}
                    >
                      {isHidden ? '기척 수락 (히든 전직)' : '전직하기'}
                    </button>
                  ) : (
                    <div className="w-full py-1.5 text-center rounded bg-zinc-800/40 text-zinc-500 text-xs font-medium border border-zinc-800/50 flex items-center justify-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      조건 미충족
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Class Encyclopedia Catalog (bottom collapsible) */}
      <AnimatePresence>
        {isJobListOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-2"
          >
            <div className="system-text text-[11px] text-zinc-500 mb-1">
              ── 클래스 도감 (전체 구조도) ──
            </div>
            <div className="grid md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {sortedJobs.map(job => {
                const ownedState = jobs[job.id]
                const isUnlocked = (hunter.unlockedJobIds || []).includes(job.id) || !!ownedState
                const isEquipped = activeJobId === job.id
                const isHidden = job.tier === 'hidden' || job.hiddenProfile?.isHidden
                const isDiscovered = isUnlocked || discoveredHiddenJobIds.includes(job.id) || availableAdvancements.includes(job.id)

                // If hidden job is not discovered, render masked state
                if (isHidden && !isDiscovered) {
                  return (
                    <div 
                      key={job.id} 
                      className="panel corner-bracket p-4 border border-zinc-900 bg-zinc-950/40 opacity-40 relative"
                    >
                      <div className="br" />
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-3.5 h-3.5 text-zinc-700" />
                        <h4 className="font-bold text-zinc-600 system-text">
                          {job.hiddenProfile?.maskedName || '???' }
                        </h4>
                        <span className="text-[8px] text-zinc-700 bg-zinc-900 px-1 py-0.5 rounded">히든</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 italic">
                        힌트: {job.hiddenProfile?.hintText || '기척이 숨겨져 있습니다.'}
                      </p>
                    </div>
                  )
                }

                // Normal and Discovered Hidden jobs rendering
                const levelText = ownedState ? `Lv.${ownedState.level}` : 'Lv.1'

                return (
                  <div
                    key={job.id}
                    className={`panel corner-bracket p-4 bg-gradient-to-br ${
                      isEquipped
                        ? 'from-amber-500/10 to-yellow-500/5 border-amber-400/60'
                        : isUnlocked
                        ? 'from-cyan-950/10 to-blue-950/5 hover:border-cyan-400/40 border-cyan-500/20'
                        : 'from-black/10 to-black/20 opacity-70 border-white/5'
                    } transition-all duration-300`}
                  >
                    <div className="br" />
                    
                    {/* Top line info */}
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          {isEquipped ? (
                            <Check className="w-4 h-4 text-amber-300" />
                          ) : isUnlocked ? (
                            <Award className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-white/30" />
                          )}
                          <h4 className={`font-bold ${isEquipped ? 'text-amber-300' : 'text-white/80'}`}>
                            {job.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] system-text text-cyan-300/40 mt-1">
                          <span className={TIER_COLOR[job.tier]}>{TIER_LABEL[job.tier]}</span>
                          <span>•</span>
                          <span className="capitalize">{job.branch !== 'none' ? job.branch : '일반'} 계열</span>
                        </div>
                      </div>
                      {isUnlocked && (
                        <span className="text-[10px] font-bold text-zinc-400 system-text">
                          {levelText}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-white/60 mb-3 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Modifiers and Affinity display */}
                    <div className="text-[9px] system-text text-zinc-400 border-t border-white/5 pt-2 mb-3 grid grid-cols-2 gap-1.5">
                      <div>
                        <span className="text-white/30">부여 스탯:</span> {formatJobModifiers(job).join(', ')}
                      </div>
                      <div>
                        <span className="text-white/30">친화 카테고리:</span>{' '}
                        {job.growthAffinity?.questCategoryBonus && Object.keys(job.growthAffinity.questCategoryBonus).length > 0 ? (
                          Object.keys(job.growthAffinity.questCategoryBonus).map(cat => CATEGORY_META[cat as keyof typeof CATEGORY_META]?.label).join(', ')
                        ) : (
                          '없음'
                        )}
                      </div>
                    </div>

                    {/* Selection Button */}
                    {isEquipped ? (
                      <div className="text-center py-1 rounded bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                        장착 중
                      </div>
                    ) : isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => equipJob(job.id)}
                        className="w-full py-1 text-center rounded border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 text-xs font-bold hover:bg-cyan-400/20 transition active:scale-[0.98]"
                      >
                        선택하기
                      </button>
                    ) : (
                      <div className="text-center py-1 rounded bg-white/5 text-white/20 text-xs font-medium border border-white/5">
                        {job.unlockCondition?.hunterLevel ? `Lv.${job.unlockCondition.hunterLevel} 해금` : '잠김'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
