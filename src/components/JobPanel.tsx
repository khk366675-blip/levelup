import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { useGame } from '../lib/store'
import { JOB_DEFINITIONS_V2 } from '../lib/jobs'
import { SKILL_DEFINITIONS } from '../lib/seed'
import { CATEGORY_META, STAT_META } from '../lib/types'
import type { JobDefinitionV2, JobTier, JobRarity, JobArchetype, OwnedJobState, JobId } from '../lib/types'
import { ChevronDown, ChevronUp, Lock, Check, Sparkles, Wand2, ShieldAlert, Award, Swords, Star, Eclipse } from 'lucide-react'

function getTierAuraClass(tier: JobTier, branch?: string): string {
  if (tier === 'hidden') {
    if (branch === 'shadow') return 'tier-aura-hidden-shadow'
    if (branch === 'curse') return 'tier-aura-hidden-curse'
    if (branch === 'chrono' || branch === 'rift') return 'tier-aura-hidden-rift'
    return 'tier-aura-hidden-shadow'
  }
  if (tier === 'third') return 'tier-aura-third'
  if (tier === 'second') return 'tier-aura-second'
  if (tier === 'first') return 'tier-aura-first'
  return 'tier-aura-novice'
}

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

function getDynamicHiddenHint(
  job: JobDefinitionV2,
  progress: Record<string, any> = {},
  targetResonance: number
) {
  const branchMap: Record<string, string> = {
    shadow: 'shadow',
    curse: 'curse',
    chrono: 'rift'
  }
  const pathId = branchMap[job.branch] || 'shadow'
  const currentProgress = progress[pathId]
  const currentResonance = currentProgress ? currentProgress.resonance : 0

  if (currentResonance === 0) {
    let baseHint = '알 수 없는 깊은 침묵만이 흐릅니다.'
    if (pathId === 'shadow') baseHint = '어둠 속에서 아무런 기척도 느껴지지 않습니다.'
    if (pathId === 'curse') baseHint = '가로막힌 저주의 장벽이 침묵하고 있습니다.'
    if (pathId === 'rift') baseHint = '공간의 뒤틀림이 전혀 감지되지 않습니다.'
    return { maskedName: '???', hintText: baseHint }
  }

  if (currentResonance < targetResonance * 0.5) {
    let hint = '무언가 미세한 움직임이 느껴집니다.'
    if (pathId === 'shadow') hint = '어둠이 당신의 그림자에 반응하고 있다.'
    if (pathId === 'curse') hint = '피어오르는 저주가 생사경의 위기를 기다리고 있다.'
    if (pathId === 'rift') hint = '시공간의 찰나가 미세한 진동을 보내고 있다.'
    return { maskedName: '???', hintText: hint }
  }

  if (currentResonance < targetResonance) {
    let hint = '기척이 뚜렷해지고 있다.'
    if (pathId === 'shadow') hint = '어둠 속 한 계열의 기척이 뚜렷해지고 있다.'
    if (pathId === 'curse') hint = '피의 도가니 속에서 저주의 기척이 뚜렷해지고 있다.'
    if (pathId === 'rift') hint = '균열의 틈새 너머로 기척이 뚜렷해지고 있다.'
    return { maskedName: '???', hintText: hint }
  }

  // resonance 충족 완료
  return {
    maskedName: job.hiddenProfile?.maskedName || '미확인 기척 클래스',
    hintText: job.hiddenProfile?.hintText || '기척이 완전히 활성화되었습니다. 다른 세부 조건을 확인하세요.'
  }
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

  // 1. Current Job Card
  return (
    <div className="space-y-4">
      {currentJob && (
        <motion.div  
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`panel corner-bracket p-5 bg-gradient-to-br ${ARCHETYPE_GRADIENT[currentJob.archetype]} card-premium-shine group relative overflow-hidden transition-all duration-300 ${getTierAuraClass(currentJob.tier, currentJob.branch)}`}
        >
          <div className="br" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.1),transparent_55%)]" />
          
          <div className="relative z-10 flex justify-between items-start mb-3">
            <div>
              <div className="system-text text-[9px] text-cyan-400/80 mb-1 font-bold tracking-widest">
                ── ACTIVE CLASS ──
              </div>
              <h2 className="text-2xl font-black text-amber-300 tracking-wider drop-shadow-md">
                {currentJob.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs system-text font-extrabold ${TIER_COLOR[currentJob.tier]}`}>
                  {TIER_LABEL[currentJob.tier]}
                </span>
                <span className="text-white/20 text-[10px]">•</span>
                <span className="text-xs text-white/60 font-semibold">{currentJob.combatStyle}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-white/95 system-text drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                Lv.{currentJobState.level}
              </span>
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/75 mb-4 leading-relaxed font-medium">
            {currentJob.description}
          </p>

          {/* XP Progress Bar */}
          <div className="relative z-10 space-y-1.5 mb-4">
            <div className="flex justify-between text-[10px] system-text text-white/50">
              <span className="font-semibold text-white/60">클래스 숙련도 (XP)</span>
              <span className="font-bold text-white/80">{currentJobState.xp} / {reqXp} ({xpPercent}%)</span>
            </div>
            <div className="w-full h-2.5 rounded bg-black/50 overflow-hidden border border-white/5 p-0.5 shadow-inner">
              <div 
                className="h-full rounded-sm bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 mastery-bar-fill transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Job Effects Breakdown */}
          <div className="relative z-10 grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
            <div>
              <span className="text-white/40 block mb-1 font-semibold system-text text-[10px]">전투 스탯 수정치</span>
              <div className="font-bold text-white/90 space-y-0.5">
                {formatJobModifiers(currentJob).map((mod, i) => (
                  <div key={i} className="text-cyan-100/90">• {mod}</div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-white/40 block mb-1 font-semibold system-text text-[10px]">성장 카테고리 친화성</span>
              <div className="text-purple-300 font-bold space-y-0.5">
                {currentJob.growthAffinity?.questCategoryBonus && Object.keys(currentJob.growthAffinity.questCategoryBonus).length > 0 ? (
                  Object.entries(currentJob.growthAffinity.questCategoryBonus).map(([cat, val]) => {
                    const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META]
                    return (
                      <div key={cat} className="flex items-center gap-1.5 text-purple-200">
                        <span>{meta?.icon}</span>
                        <span>{meta?.label} XP +{Math.round((val ?? 0) * 100)}%</span>
                      </div>
                    )
                  })
                ) : (
                  <span className="text-zinc-500 italic font-normal">균등 성장형</span>
                )}
              </div>
            </div>
          </div>

          {/* 클래스 고유 스킬 트리 (CLASS COMBAT SKILLS) */}
          {currentJob.skills && currentJob.skills.length > 0 && (
            <div className="relative z-10 mt-4 pt-3 border-t border-white/10">
              <span className="text-white/40 text-[10px] system-text block mb-2 font-semibold">클래스 스킬 트리 (CLASS SKILLS)</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {currentJob.skills.map((js) => {
                  const skillDef = SKILL_DEFINITIONS.find(s => s.id === js.skillId)
                  const isSkillUnlocked = currentJobState.level >= js.unlockLevel
                  const isNewlyUnlocked = isSkillUnlocked && currentJobState.level === js.unlockLevel
                  const isImminent = !isSkillUnlocked && js.unlockLevel === currentJobState.level + 1
                  
                  if (!skillDef) return null
                  
                  return (
                    <div 
                      key={js.skillId}
                      className={clsx(
                        'flex items-center gap-2.5 rounded-md border p-2 bg-ink-950/65 transition-all relative overflow-hidden',
                        isSkillUnlocked
                          ? isNewlyUnlocked
                            ? 'border-cyan-400 bg-cyan-950/30 text-white/90 shadow-[0_0_15px_rgba(6,182,212,0.14)] animate-pulse'
                            : 'border-cyan-500/25 text-white/80'
                          : isImminent
                            ? 'border-amber-500/30 bg-amber-950/15 opacity-80'
                            : 'border-white/5 opacity-35'
                      )}
                    >
                      {isNewlyUnlocked && (
                        <div className="absolute -right-3 -top-3 h-8 w-8 bg-cyan-400/20 blur-md animate-pulse" />
                      )}
                      {isImminent && (
                        <div className="absolute -right-3 -top-3 h-8 w-8 bg-amber-400/10 blur-md" />
                      )}
                      
                      <div className={clsx(
                        'w-8 h-8 rounded-md flex items-center justify-center border shrink-0 text-xs font-black',
                        isSkillUnlocked
                          ? isNewlyUnlocked
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-glow'
                            : 'bg-cyan-500/10 border-cyan-500/35 text-cyan-300'
                          : isImminent
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300/80 animate-pulse'
                            : 'bg-black/40 border-white/5 text-white/30'
                      )}>
                        {isSkillUnlocked ? <Swords className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs truncate text-white/90">{skillDef.name}</span>
                          {isNewlyUnlocked ? (
                            <span className="text-[7px] system-text text-cyan-300 border border-cyan-400/30 bg-cyan-400/20 px-1 rounded font-black tracking-tighter shrink-0 animate-bounce">NEW</span>
                          ) : isImminent ? (
                            <span className="text-[7px] system-text text-amber-300 border border-amber-400/30 bg-amber-400/15 px-1 rounded font-bold shrink-0">NEXT LV</span>
                          ) : (
                            <span className="text-[8px] system-text text-white/30 shrink-0 font-semibold">Lv.{js.unlockLevel} 해금</span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/45 truncate mt-0.5">{skillDef.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Toggle bottom catalog button */}
          <div className="relative z-10 mt-5 flex justify-between items-center pt-3 border-t border-white/10">
            <div className="text-[10px] text-white/40 system-text font-bold">
              도달클래스 성취 {unlockedJobCount} / {JOB_DEFINITIONS_V2.length}
            </div>
            <button
              type="button"
              onClick={() => setIsJobListOpen(prev => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs system-text text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all shadow-sm active:scale-[0.98]"
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
        </motion.div>
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
                const branchKey = (job.branch === 'chrono' ? 'rift' : job.branch) as 'shadow' | 'curse' | 'rift'
                const targetResonance = cond?.resonanceRequired?.[branchKey] || 10
                const dynamicHint = getDynamicHiddenHint(job, hunter.hiddenResonanceProgress || {}, targetResonance)
                
                let hiddenPulseClass = 'named-pulse'
                if (branchKey === 'curse') hiddenPulseClass = 'tier-aura-hidden-curse'
                if (branchKey === 'rift') hiddenPulseClass = 'tier-aura-hidden-rift'
                if (branchKey === 'shadow') hiddenPulseClass = 'tier-aura-hidden-shadow'

                return (
                  <motion.div 
                    key={job.id} 
                    whileHover={{ y: -3, scale: 1.015 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`panel corner-bracket p-4 border bg-zinc-950/80 group card-premium-shine relative overflow-hidden transition-all duration-300 ${hiddenPulseClass}`}
                  >
                    <div className="br" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,63,94,0.06),transparent_55%)]" />
                    
                    <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-rose-500/70" />
                        <h4 className="font-extrabold text-zinc-400 system-text tracking-wide text-sm">
                          {dynamicHint.maskedName}
                        </h4>
                      </div>
                      <span className="text-[8px] font-bold text-rose-400 bg-rose-950/45 px-1.5 py-0.5 rounded border border-rose-500/30 uppercase tracking-wider animate-pulse">
                        균열 감지됨
                      </span>
                    </div>
                    <p className="relative z-10 text-[11px] text-zinc-400 leading-relaxed font-medium bg-black/40 p-2 rounded border border-white/5">
                      <span className="text-rose-400/80 font-bold block mb-0.5 text-[10px]">공명 반응:</span>
                      {dynamicHint.hintText}
                    </p>
                  </motion.div>
                )
              }

              // Render normal / revealed class candidates
              const candAuraClass = getTierAuraClass(job.tier, job.branch)

              return (
                <motion.div 
                  key={job.id}
                  whileHover={{ y: -4, scale: 1.025 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`panel corner-bracket p-4 bg-gradient-to-br ${
                    canAdvance 
                      ? `${ARCHETYPE_GRADIENT[job.archetype]} border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.08)]` 
                      : 'from-black/20 to-black/35 opacity-75 border-zinc-800/80'
                  } card-premium-shine group relative overflow-hidden transition-all duration-300 ${candAuraClass}`}
                >
                  <div className="br" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.06),transparent_55%)]" />

                  <div className="relative z-10 flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {isHidden ? (
                          <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
                        ) : (
                          <Wand2 className="w-4 h-4 text-cyan-400" />
                        )}
                        <h4 className={`font-black text-sm tracking-wide ${isHidden ? 'text-rose-300 drop-shadow' : 'text-white/90'}`}>
                          {job.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-white/40 mt-1 system-text font-bold">
                        <span className={TIER_COLOR[job.tier]}>{TIER_LABEL[job.tier]}</span>
                        <span>•</span>
                        <span className="text-white/50">{job.combatStyle}</span>
                      </div>
                    </div>
                    {canAdvance && (
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider animate-pulse ${
                        isHidden 
                          ? 'border-rose-400/40 bg-rose-400/15 text-rose-200' 
                          : 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
                      }`}>
                        전직 가능
                      </span>
                    )}
                  </div>

                  <p className="relative z-10 text-[11px] text-white/70 mb-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Conditions Check Display */}
                  {condLines.length > 0 && (
                    <div className="relative z-10 space-y-1 bg-black/40 p-2.5 rounded border border-white/5 mb-3 text-[10px] system-text shadow-inner">
                      <div className="text-[9px] text-white/30 mb-1 font-bold">전직 개방 요건:</div>
                      {condLines.map((line, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className={line.met ? 'text-white/70 font-semibold' : 'text-white/40'}>{line.met ? '✓' : '✗'} {line.text}</span>
                          <span className={line.met ? 'text-emerald-400 font-extrabold' : 'text-red-400/80 font-bold'}>
                            {line.met ? '만족' : '미충족'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Advancement Accept Button */}
                  <div className="relative z-10">
                    {canAdvance ? (
                      <button
                        type="button"
                        onClick={() => advanceToJob(job.id)}
                        className={`w-full py-1.5 text-center rounded text-xs font-black transition-all shadow-md hover:brightness-110 active:scale-[0.98] ${
                          isHidden 
                            ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-glow-rose' 
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-glow'
                        }`}
                      >
                        {isHidden ? '기척 수락 (히든 전직)' : '수락 및 전직 완료'}
                      </button>
                    ) : (
                      <div className="w-full py-1.5 text-center rounded bg-zinc-800/40 text-zinc-500 text-xs font-bold border border-zinc-800/50 flex items-center justify-center gap-1.5 shadow-sm">
                        <Lock className="w-3.5 h-3.5" />
                        클래스 잠김 (요건 미충족)
                      </div>
                    )}
                  </div>
                </motion.div>
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
                  const branchKey = (job.branch === 'chrono' ? 'rift' : job.branch) as 'shadow' | 'curse' | 'rift'
                  const targetResonance = job.unlockCondition?.resonanceRequired?.[branchKey] || 10
                  const dynamicHint = getDynamicHiddenHint(job, hunter.hiddenResonanceProgress || {}, targetResonance)
                  
                  let hiddenPulseClass = 'named-pulse'
                  if (branchKey === 'curse') hiddenPulseClass = 'tier-aura-hidden-curse'
                  if (branchKey === 'rift') hiddenPulseClass = 'tier-aura-hidden-rift'
                  if (branchKey === 'shadow') hiddenPulseClass = 'tier-aura-hidden-shadow'

                  return (
                    <motion.div 
                      key={job.id} 
                      whileHover={{ y: -3, scale: 1.015 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className={`panel corner-bracket p-4 border bg-zinc-950/80 group card-premium-shine relative overflow-hidden transition-all duration-300 ${hiddenPulseClass} opacity-60`}
                    >
                      <div className="br" />
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,63,94,0.04),transparent_55%)]" />
                      <div className="relative z-10 flex items-center gap-2 mb-2">
                        <Lock className="w-3.5 h-3.5 text-rose-500/50" />
                        <h4 className="font-extrabold text-zinc-400 system-text tracking-wide text-xs">
                          {dynamicHint.maskedName}
                        </h4>
                        <span className="text-[7px] font-bold text-rose-400/80 bg-rose-950/40 px-1 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest animate-pulse">히든</span>
                      </div>
                      <p className="relative z-10 text-[10px] text-zinc-500 italic bg-black/40 p-2 rounded border border-white/5">
                        {dynamicHint.hintText}
                      </p>
                    </motion.div>
                  )
                }

                // Normal and Discovered Hidden jobs rendering
                const levelText = ownedState ? `Lv.${ownedState.level}` : 'Lv.1'
                const tierAuraClass = getTierAuraClass(job.tier, job.branch)

                return (
                  <motion.div
                    key={job.id}
                    whileHover={{ y: -3, scale: 1.015 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className={`panel corner-bracket p-4 bg-gradient-to-br ${
                      isEquipped
                        ? 'from-amber-500/12 to-yellow-500/6 border-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.08)]'
                        : isUnlocked
                        ? 'from-cyan-950/8 to-blue-950/4 border-cyan-500/25 hover:border-cyan-400/40'
                        : 'from-black/20 to-black/35 opacity-70 border-white/5'
                    } card-premium-shine group relative overflow-hidden transition-all duration-300 ${tierAuraClass}`}
                  >
                    <div className="br" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_55%)]" />
                    
                    {/* Top line info */}
                    <div className="relative z-10 flex justify-between items-start mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          {isEquipped ? (
                            <Check className="w-4 h-4 text-amber-300" />
                          ) : isUnlocked ? (
                            <Award className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-white/30" />
                          )}
                          <h4 className={`font-bold text-sm tracking-wide ${isEquipped ? 'text-amber-300 font-extrabold' : 'text-white/80'}`}>
                            {job.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] system-text text-cyan-300/40 mt-1 font-bold">
                          <span className={TIER_COLOR[job.tier]}>{TIER_LABEL[job.tier]}</span>
                          <span>•</span>
                          <span className="capitalize">{job.branch !== 'none' ? job.branch : '일반'} 계열</span>
                        </div>
                      </div>
                      {isUnlocked && (
                        <span className="text-[10px] font-black text-zinc-300 bg-zinc-800/60 px-1.5 py-0.5 rounded border border-white/5 system-text shadow-sm">
                          {levelText}
                        </span>
                      )}
                    </div>

                    <p className="relative z-10 text-[11px] text-white/60 mb-3 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Modifiers and Affinity display */}
                    <div className="relative z-10 text-[9px] system-text text-zinc-400 border-t border-white/5 pt-2 mb-3 grid grid-cols-2 gap-2 bg-black/20 p-2 rounded shadow-inner">
                      <div>
                        <span className="text-white/30 font-semibold block mb-0.5">부여 스탯:</span> 
                        <span className="text-cyan-100/70 font-semibold">{formatJobModifiers(job).join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-white/30 font-semibold block mb-0.5">친화 카테고리:</span>{' '}
                        <span className="text-purple-300 font-semibold">
                          {job.growthAffinity?.questCategoryBonus && Object.keys(job.growthAffinity.questCategoryBonus).length > 0 ? (
                            Object.keys(job.growthAffinity.questCategoryBonus).map(cat => CATEGORY_META[cat as keyof typeof CATEGORY_META]?.label).join(', ')
                          ) : (
                            '없음'
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Selection Button */}
                    <div className="relative z-10">
                      {isEquipped ? (
                        <div className="text-center py-1 rounded bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/35 shadow-inner">
                          장착 중
                        </div>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => equipJob(job.id)}
                          className="w-full py-1 text-center rounded border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 text-xs font-bold hover:bg-cyan-400/20 hover:text-white transition-all active:scale-[0.98] shadow-sm"
                        >
                          선택하기
                        </button>
                      ) : (
                        <div className="text-center py-1 rounded bg-white/5 text-white/20 text-xs font-medium border border-white/5 system-text">
                          {job.unlockCondition?.hunterLevel ? `Lv.${job.unlockCondition.hunterLevel} 해금` : '잠김'}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
