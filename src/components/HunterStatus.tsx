import { motion } from 'framer-motion'
import { useGame } from '../lib/store'
import { RANK_COLOR, RANK_LABEL, xpToNextLevel, getStatBonus, getEquippedItems, getEquipmentStatBonuses, formatStat, formatStatReward } from '../lib/game'
import { STAT_META, type StatKey, JOB_DEFINITIONS, JOB_LINE_META } from '../lib/types'
import { Flame, Plus } from 'lucide-react'
import { useState } from 'react'
import { JobPanel } from './JobPanel'

export function HunterStatus() {
  const hunter = useGame(s => s.hunter)
  const items = useGame(s => s.items)
  const equipment = useGame(s => s.equipment)
  const setName = useGame(s => s.setHunterName)
  const setJob = useGame(s => s.setHunterJob)
  const allocate = useGame(s => s.allocateFreeStat)
  const [editingName, setEditingName] = useState(false)
  const [editingJob, setEditingJob] = useState(false)
  const [nameDraft, setNameDraft] = useState(hunter.name)
  const [jobDraft, setJobDraft] = useState(hunter.job)

  const xpNeeded = xpToNextLevel(hunter.level)
  const xpPct = Math.min(100, (hunter.xp / xpNeeded) * 100)

  // Get current job definition
  const currentJob = JOB_DEFINITIONS.find(j => j.id === hunter.jobId)
  const jobLine = currentJob ? JOB_LINE_META[currentJob.line] : null

  // Get equipment stat bonuses
  const equippedItems = getEquippedItems(items, equipment)
  const equipmentBonuses = getEquipmentStatBonuses(equippedItems)

  // Stat effect descriptions
  const getStatEffect = (key: StatKey): string | null => {
    const baseValue = hunter.stats[key]
    const equipBonus = equipmentBonuses[key] ?? 0
    const effectiveValue = baseValue + equipBonus
    const bonus = getStatBonus(effectiveValue, key === 'STR' ? 5 : key === 'VIT' ? 3 : key === 'AGI' ? 5 : key === 'INT' ? 5 : key === 'SEN' ? 1 : 0)
    if (bonus === 0) return null
    
    switch (key) {
      case 'STR': return `+${bonus}% 운동 XP`
      case 'VIT': return `+${bonus}% 운동 드롭`
      case 'AGI': return `+${bonus}% 던전 부분보상`
      case 'INT': return `+${bonus}% 학습 XP`
      case 'PER': return `월 ${Math.floor(effectiveValue / 10)}회 streak 보호`
      case 'SEN': return `+${bonus}% 레어리티`
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="panel panel-glow corner-bracket p-6 overflow-hidden">
        <div className="br" />
        <div className="flex items-center justify-between mb-2">
          <div className="system-text text-[11px] text-cyan-400/70">
            ── 상태창 ──
          </div>
          <div className="flex items-center gap-2">
            {hunter.freeStatPoints > 0 && (
              <div className="text-amber-300 system-text text-[10px] animate-pulse">
                ⚡ 자유 배분권 {hunter.freeStatPoints}
              </div>
            )}
            <div className={`chip ${RANK_COLOR[hunter.rank]}`}>
              {RANK_LABEL[hunter.rank]}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div>
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => { setName(nameDraft || '플레이어'); setEditingName(false) }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                className="bg-transparent border-b border-cyan-400/40 text-3xl font-bold tracking-wide focus:outline-none focus:border-cyan-400 max-w-xs"
              />
            ) : (
              <h1
                className="text-3xl font-bold tracking-wide cursor-text hover:text-cyan-200 transition-colors"
                onClick={() => { setNameDraft(hunter.name); setEditingName(true) }}
                title="클릭하여 이름 변경"
              >
                {hunter.name}
              </h1>
            )}
            {editingJob ? (
              <input
                autoFocus
                value={jobDraft}
                onChange={(e) => setJobDraft(e.target.value)}
                onBlur={() => { setJob(jobDraft || '미각성자'); setEditingJob(false) }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                className="bg-transparent border-b border-cyan-400/40 text-sm text-cyan-300/80 focus:outline-none focus:border-cyan-400 mt-1 max-w-xs"
              />
            ) : (
              <div className="mt-1">
                <div
                  className="text-sm text-cyan-300/70 cursor-text hover:text-cyan-200 transition-colors"
                  onClick={() => { setJobDraft(hunter.job); setEditingJob(true) }}
                  title="클릭하여 직업 변경"
                >
                  직업 — {hunter.job}
                </div>
                {currentJob && jobLine && (
                  <div className="text-[10px] text-cyan-300/50 system-text mt-0.5">
                    {jobLine.icon} 계열: {jobLine.label}
                    {currentJob.id !== 'unawakened' && currentJob.effects.xpBonusByCategory && (
                      <span className="ml-2">
                        · 효과: {Object.entries(currentJob.effects.xpBonusByCategory)
                          .map(([cat, bonus]) => `${cat} XP +${Math.round((bonus as number) * 100)}%`)
                          .join(', ')}
                      </span>
                    )}
                  </div>
                )}
                {currentJob?.id === 'unawakened' && (
                  <div className="text-[10px] text-cyan-300/40 system-text mt-0.5 italic">
                    각성 조건을 달성하면 직업이 개방됩니다.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="system-text text-[11px] text-cyan-400/60">LEVEL</div>
            <motion.div
              key={hunter.level}
              initial={{ scale: 1.4, color: '#fef3c7' }}
              animate={{ scale: 1, color: '#ffffff' }}
              transition={{ duration: 0.6 }}
              className="text-5xl font-bold tracking-tight font-mono"
            >
              {hunter.level}
            </motion.div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mb-5">
          <div className="flex justify-between text-[11px] system-text mb-1 text-cyan-300/70">
            <span>EXP</span>
            <span>{hunter.xp} / {xpNeeded}</span>
          </div>
          <div className="h-3 bg-ink-900/80 rounded-full overflow-hidden border border-cyan-400/20 relative">
            <motion.div
              className="h-full xp-bar-fill"
              initial={false}
              animate={{ width: `${xpPct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {(Object.keys(STAT_META) as StatKey[]).map((key) => {
            const meta = STAT_META[key]
            const baseValue = hunter.stats[key]
            const equipBonus = equipmentBonuses[key] ?? 0
            const effect = getStatEffect(key)
            return (
              <div key={key} className="bg-ink-900/50 border border-cyan-400/10 rounded px-3 py-2 flex items-center justify-between hover:border-cyan-400/30 transition group">
                <div className="flex items-center gap-2">
                  <span>{meta.icon}</span>
                  <div>
                    <div className="text-[10px] text-cyan-300/50 system-text">{key}</div>
                    <div className={`text-xs font-medium ${meta.color}`}>{meta.label}</div>
                    {effect && (
                      <div className="text-[9px] text-cyan-300/40 system-text mt-0.5">
                        {effect}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-right">
                    <div className="text-lg font-bold tabular-nums text-white">
                      {formatStat(baseValue)}
                      {equipBonus > 0 && (
                        <span className="text-sm text-purple-300 ml-1">{formatStatReward(equipBonus)}</span>
                      )}
                    </div>
                  </div>
                  {hunter.freeStatPoints > 0 && (
                    <button
                      onClick={() => allocate(key)}
                      className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-400/20 rounded p-0.5 transition"
                      title="자유 배분권 사용"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-orange-300">
              <Flame className="w-4 h-4" />
              <span className="font-mono">{hunter.streak}일 연속</span>
            </div>
            <div className="text-cyan-300/60 system-text">총 EXP {hunter.totalXp.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <JobPanel />
    </div>
  )
}
