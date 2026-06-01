import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../lib/store'
import {
  RANK_COLOR,
  RANK_LABEL,
  xpToNextLevel,
  getStatBonus,
  getEquippedItems,
  getEquipmentStatBonuses,
  formatStat,
  formatStatReward,
  formatTitleEffects,
  getEquippedTitleDefinition,
} from '../lib/game'
import {
  getCombatPowerTierHint,
  getHunterCombatPowerBreakdown,
} from '../lib/combatPower'
import { getEquipmentPowerBreakdown } from '../lib/equipmentPower'
import { STAT_META, type StatKey, JOB_DEFINITIONS, JOB_LINE_META } from '../lib/types'
import { JOB_DEFINITIONS_V2 } from '../lib/jobs'
import type { JobDefinitionV2 } from '../lib/types'
import { 
  Flame, 
  Plus, 
  Swords, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Award,
  Brain
} from 'lucide-react'
import { getHunterBattleSpriteUrl } from '../lib/hunterBattleSprites'
import { JobPanel } from './JobPanel'
import { SkillPanel } from './SkillPanel'
import { GRADE_LABELS } from '../lib/hunterGrade'

function formatJobModifiers(job: JobDefinitionV2): string[] {
  const mods: string[] = []
  if (job.statModifiers) {
    Object.entries(job.statModifiers).forEach(([stat, val]) => {
      mods.push(`${STAT_META[stat as keyof typeof STAT_META]?.label || stat} +${val}`)
    })
  }
  return mods.length > 0 ? mods : ['기본 스탯 효과']
}

const rankFrame: Record<string, string> = {
  E: 'border-zinc-500/25 bg-zinc-500/5',
  D: 'border-emerald-400/32 bg-emerald-400/6',
  C: 'border-cyan-400/38 bg-cyan-400/7',
  B: 'border-purple-400/44 bg-purple-400/8',
  A: 'border-pink-400/44 bg-pink-400/8',
  S: 'border-amber-400/52 bg-amber-400/8',
  National: 'border-red-400/60 bg-red-400/10',
}

const rankGlow: Record<string, string> = {
  E: 'rgba(148, 163, 184, 0.3)',
  D: 'rgba(52, 211, 153, 0.4)',
  C: 'rgba(34, 211, 238, 0.5)',
  B: 'rgba(167, 139, 250, 0.58)',
  A: 'rgba(244, 114, 182, 0.58)',
  S: 'rgba(245, 158, 11, 0.7)',
  National: 'rgba(239, 68, 68, 0.8)',
}

const PORTRAIT_DECO: Record<string, {
  borderColor: string
  glowColor: string
  bgGradient: string
  badgeBg: string
  badgeText: string
  badgeLabel: string
  frameClass: string
  pulseClass: string
  glowShadow: string
}> = {
  E: {
    borderColor: 'border-zinc-500/30',
    glowColor: 'rgba(148, 163, 184, 0.2)',
    bgGradient: 'from-zinc-950/90 via-zinc-900/60 to-zinc-950/90',
    badgeBg: 'bg-zinc-800/90 border-zinc-600/50',
    badgeText: 'text-zinc-400',
    badgeLabel: 'E급',
    frameClass: '',
    pulseClass: '',
    glowShadow: 'shadow-[0_0_8px_rgba(148,163,184,0.15)]',
  },
  D: {
    borderColor: 'border-emerald-500/35',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    bgGradient: 'from-zinc-950/95 via-emerald-950/30 to-zinc-950/95',
    badgeBg: 'bg-emerald-950/90 border-emerald-600/50',
    badgeText: 'text-emerald-300',
    badgeLabel: 'D급',
    frameClass: '',
    pulseClass: '',
    glowShadow: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]',
  },
  C: {
    borderColor: 'border-cyan-400/50',
    glowColor: 'rgba(34, 211, 238, 0.4)',
    bgGradient: 'from-zinc-950/95 via-cyan-950/45 to-zinc-950/95',
    badgeBg: 'bg-cyan-950/90 border-cyan-500/55',
    badgeText: 'text-cyan-300',
    badgeLabel: 'C급',
    frameClass: 'shadow-[0_0_15px_rgba(34,211,238,0.25)]',
    pulseClass: 'animate-pulse',
    glowShadow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]',
  },
  B: {
    borderColor: 'border-purple-400/60',
    glowColor: 'rgba(167, 139, 250, 0.45)',
    bgGradient: 'from-zinc-950/95 via-purple-950/40 to-zinc-950/95',
    badgeBg: 'bg-purple-950/90 border-purple-500/55',
    badgeText: 'text-purple-300',
    badgeLabel: 'B급',
    frameClass: 'shadow-[0_0_20px_rgba(167,139,250,0.3)]',
    pulseClass: 'animate-pulse',
    glowShadow: 'shadow-[0_0_20px_rgba(167,139,250,0.35)]',
  },
  A: {
    borderColor: 'border-pink-400/70',
    glowColor: 'rgba(244, 114, 182, 0.55)',
    bgGradient: 'from-zinc-950 via-pink-950/45 to-zinc-950',
    badgeBg: 'bg-pink-950/90 border-pink-500/60',
    badgeText: 'text-pink-300',
    badgeLabel: 'A급',
    frameClass: 'ring-1 ring-pink-500/40 shadow-[0_0_25px_rgba(244,114,182,0.45)]',
    pulseClass: 'animate-pulse',
    glowShadow: 'shadow-[0_0_25px_rgba(244,114,182,0.4)]',
  },
  S: {
    borderColor: 'border-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.65)',
    bgGradient: 'from-zinc-950 via-amber-950/50 to-zinc-950',
    badgeBg: 'bg-amber-950/95 border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    badgeText: 'text-amber-300 font-extrabold',
    badgeLabel: 'S급',
    frameClass: 'ring-2 ring-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.55)]',
    pulseClass: 'animate-pulse',
    glowShadow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
  },
  NATIONAL: {
    borderColor: 'border-red-500',
    glowColor: 'rgba(239, 68, 68, 0.8)',
    bgGradient: 'from-zinc-950 via-red-950/60 to-zinc-950',
    badgeBg: 'bg-red-950/95 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.55)]',
    badgeText: 'text-red-300 font-black tracking-tighter',
    badgeLabel: '국가권력급',
    frameClass: 'ring-2 ring-red-500/70 border-double border-4 shadow-[0_0_35px_rgba(239,68,68,0.65)]',
    pulseClass: 'animate-pulse',
    glowShadow: 'shadow-[0_0_35px_rgba(239,68,68,0.6)]',
  }
}

const READINESS_META = {
  dormant: {
    label: '잠재 상태',
    color: 'text-zinc-400',
    icon: '😴',
    desc: '오늘의 첫 걸음을 내디디면 게이트 보너스가 활성화됩니다.',
  },
  awakening: {
    label: '각성 중',
    color: 'text-sky-400',
    icon: '🌤️',
    desc: '현실 준비도가 쌓이고 있습니다. 계속하세요.',
  },
  focused: {
    label: '집중 상태',
    color: 'text-cyan-300',
    icon: '🔵',
    desc: '집중력이 활성화됐습니다. 게이트 보상이 상승합니다.',
  },
  resonant: {
    label: '공명 상태',
    color: 'text-purple-300',
    icon: '⚡',
    desc: '현실과 게임이 공명하고 있습니다. 강력한 보너스가 적용됩니다.',
  },
  transcendent: {
    label: '초월 상태',
    color: 'text-amber-300',
    icon: '🔱',
    desc: '당신의 현실 준비도가 최고조에 달했습니다. 모든 보너스가 최대치입니다.',
  },
}

interface HunterStatusProps {
  currentTab?: string
  onTabChange?: (tab: any) => void
}

export function HunterStatus({ currentTab, onTabChange }: HunterStatusProps) {
  const s = useGame()
  const hunter = s.hunter
  const items = s.items
  const equipment = s.equipment
  const ownedShadows = s.ownedShadows ?? []
  const equippedShadowIds = s.equippedShadowIds ?? []
  const activeConsumableEffects = s.activeConsumableEffects ?? []
  const setName = s.setHunterName
  const setJob = s.setHunterJob
  const allocate = s.allocateFreeStat
  const gold = s.gold ?? 0
  const shadowEssence = s.shadowEssence ?? 0
  const hunterGrade = s.hunterGrade
  const dailyProgression = s.dailyProgression
  const focusSession = s.focusSession

  const [editingName, setEditingName] = useState(false)
  const [editingJob, setEditingJob] = useState(false)
  const [nameDraft, setNameDraft] = useState(hunter.name)
  const [jobDraft, setJobDraft] = useState(hunter.job)
  const [isExpanded, setIsExpanded] = useState(false)

  const xpNeeded = xpToNextLevel(hunter.level)
  const xpPct = Math.min(100, (hunter.xp / xpNeeded) * 100)

  // Get current job definition
  const activeJobId = hunter.activeJobId || hunter.jobId
  const currentJobV2 = JOB_DEFINITIONS_V2.find(j => j.id === activeJobId)
  const currentJobLegacy = JOB_DEFINITIONS.find(j => j.id === activeJobId)
  const jobLine = currentJobLegacy ? JOB_LINE_META[currentJobLegacy.line] : null
  const equippedTitleDef = getEquippedTitleDefinition(hunter)

  // Get equipment stat bonuses
  const equippedItems = getEquippedItems(items, equipment)
  const equipmentBonuses = getEquipmentStatBonuses(equippedItems)
  const combatPower = getHunterCombatPowerBreakdown({
    hunter,
    items,
    equipment,
    ownedShadows,
    equippedShadowIds,
    activeConsumableEffects,
  })
  const combatPowerHint = getCombatPowerTierHint(combatPower.total)
  const equipmentPowerSummaries = equippedItems.map(item => getEquipmentPowerBreakdown(item))
  const equipmentAnalysisValue = equipmentPowerSummaries.reduce((sum, item) => sum + item.totalEquipmentValue, 0)
  const equipmentAnalysisTags = Array.from(new Set(equipmentPowerSummaries.flatMap(item => item.topTags))).slice(0, 3)

  const avatarUrl = getHunterBattleSpriteUrl(activeJobId)
  const rankGlowStyle = rankGlow[hunter.rank] || rankGlow.E
  const rankFrameClass = rankFrame[hunter.rank] || rankFrame.E
  const currentGrade = hunterGrade?.currentGrade || (hunter.rank === 'National' ? 'NATIONAL' : hunter.rank) || 'E'
  const deco = PORTRAIT_DECO[currentGrade] || PORTRAIT_DECO.E

  const pendingExam = hunterGrade?.pendingExam

  // Daily Progression & Focus Session Summary
  const state = dailyProgression ?? {
    focusResonance: 0,
    bodyReadiness: 0,
    mindBalance: 0,
    routineScore: 0,
    overallReadiness: 0,
    readinessLevel: 'dormant' as const,
    gateRewardBonus: 0,
    redGateResistBonus: 0,
    skillXpBonus: 0,
    extractionBonus: 0,
  }
  const meta = READINESS_META[state.readinessLevel] || READINESS_META.dormant

  const todayStr = new Date().toDateString()
  const todaySuccessFocusMs = (focusSession?.history ?? [])
    .filter((r: any) => r.completed && new Date(r.startedAt).toDateString() === todayStr)
    .reduce((sum: number, r: any) => sum + r.focusedMs, 0)
  const todaySuccessFocusMin = Math.round(todaySuccessFocusMs / (60 * 1000))

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
    <div className="panel panel-glow corner-bracket p-4 md:p-5 overflow-hidden transition-all duration-300">
      <div className="br" />
      
      {/* 1. Compact View (HUD style hero profile card) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Hero Portrait Zone & Identity Info */}
        <div className="flex items-center gap-4 md:gap-5 min-w-0">
          
          {/* Portrait wrapper with dynamic size & premium grade frame styling */}
          <div 
            className={[
              "relative rounded-xl border-2 bg-ink-950/90 shadow-2xl flex items-center justify-center shrink-0 transition-all duration-300 ease-out group",
              isExpanded ? "w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80" : "w-40 h-40 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-64 lg:h-64",
              deco.borderColor,
              deco.frameClass
            ].filter(Boolean).join(' ')}
          >
            {/* Glow Aura */}
            <div 
              className={`absolute inset-0 rounded-xl blur-xl opacity-60 pointer-events-none transition-all duration-300 ${deco.pulseClass}`}
              style={{ background: `radial-gradient(circle, ${deco.glowColor} 0%, transparent 80%)` }}
            />
            
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-t ${deco.bgGradient} rounded-xl z-0`} />
            
            {/* Corner Brackets for RPG feel */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-white/30 z-10" />
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-white/30 z-10" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-white/30 z-10" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-white/30 z-10" />

            {/* Avatar Sprite */}
            <img
              src={avatarUrl}
              alt={hunter.name}
              className="h-full w-full object-contain scale-[1.15] translate-y-1 z-10 transition-transform duration-300 group-hover:scale-[1.22]"
              style={{ filter: `drop-shadow(0 -4px 10px ${deco.glowColor})` }}
              draggable={false}
            />

            {/* Floating Rank Badge */}
            <span className={[
              "absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border backdrop-blur-sm z-20 transition-all duration-300",
              deco.badgeBg,
              deco.badgeText
            ].filter(Boolean).join(' ')}>
              {deco.badgeLabel}
            </span>
          </div>

          {/* Hunter Identity & Stats */}
          <div className="flex flex-col justify-center space-y-1 sm:space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {editingName ? (
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={() => { setName(nameDraft || '플레이어'); setEditingName(false) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                  className="bg-transparent border-b border-cyan-400/40 text-base sm:text-lg font-bold tracking-wide focus:outline-none focus:border-cyan-400"
                />
              ) : (
                <h2
                  className="text-base sm:text-lg font-extrabold text-white tracking-wide cursor-text hover:text-cyan-200 transition-colors flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  onClick={() => { setNameDraft(hunter.name); setEditingName(true) }}
                  title="클릭하여 이름 변경"
                >
                  {hunter.name}
                </h2>
              )}
              
              {equippedTitleDef && (
                <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-300 bg-amber-500/5 system-text font-bold flex items-center gap-0.5 shadow-glow-sm">
                  👑 {equippedTitleDef.name}
                </span>
              )}
            </div>

            <div className="text-[10px] sm:text-xs text-white/70 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {editingJob ? (
                <input
                  autoFocus
                  value={jobDraft}
                  onChange={(e) => setJobDraft(e.target.value)}
                  onBlur={() => { setJob(jobDraft || '미각성자'); setEditingJob(false) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                  className="bg-transparent border-b border-cyan-400/40 text-[10px] sm:text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              ) : (
                <span
                  className="cursor-text text-cyan-300 hover:text-cyan-200 transition-colors font-bold"
                  onClick={() => { setJobDraft(hunter.job); setEditingJob(true) }}
                  title="클릭하여 직업 변경"
                >
                  직업: {hunter.job}
                </span>
              )}
              {currentJobV2 && <span className="text-cyan-300/30">·</span>}
              {currentJobV2 && (
                <span className="text-[9px] sm:text-[10px] text-cyan-400/70 system-text font-semibold">
                  Lv.{(hunter.jobs?.[currentJobV2.id]?.level ?? 1)}
                </span>
              )}
            </div>

            {/* Level & CP HUD line */}
            <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs">
              <div className="bg-slate-900/60 border border-white/5 rounded px-1.5 py-0.5 flex items-center gap-1">
                <span className="text-[8px] sm:text-[9px] text-cyan-400/55 system-text font-bold leading-none">LV</span>
                <span className="font-bold text-white font-mono">{hunter.level}</span>
                <span className="text-[8px] sm:text-[9px] text-white/30 font-mono">({xpPct.toFixed(0)}%)</span>
              </div>

              <div className="bg-slate-900/60 border border-white/5 rounded px-1.5 py-0.5 flex items-center gap-1">
                <span className="text-[8px] sm:text-[9px] text-amber-500/70 system-text font-bold leading-none">CP</span>
                <span className="font-extrabold text-amber-300 font-mono">
                  {combatPower.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Grade & Toggle Expand */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0 shrink-0">
          <div className="text-left md:text-right">
            <span className="text-[8px] sm:text-[9px] text-cyan-400/55 system-text block leading-none mb-0.5">ASSOCIATION GRADE</span>
            <span className={`text-sm sm:text-base font-black tracking-wide ${RANK_COLOR[hunter.rank]}`}>
              {GRADE_LABELS[currentGrade]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Expand Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn btn-ghost py-1 px-2.5 sm:py-1.5 sm:px-3 rounded hover:bg-white/5 transition flex items-center justify-center shrink-0 border border-white/10 text-[10px] sm:text-xs gap-1 font-bold shadow-sm"
              title={isExpanded ? '상세 정보 접기' : '상세 정보 펼치기'}
            >
              <span>상세 정보</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Resource & Reality Status Pills */}
      <div className="flex flex-wrap gap-1.5 items-center text-xs mt-3 border-t border-white/5 pt-3">
        <span className="chip border-orange-500/20 text-orange-400 bg-orange-500/5 px-2 py-0.5 text-[10px] rounded">
          🔥 {hunter.streak}일 연속
        </span>
        <span className="chip border-amber-500/20 text-amber-300 bg-amber-500/5 px-2 py-0.5 text-[10px] rounded">
          🪙 {gold.toLocaleString()} Gold
        </span>
        <span className="chip border-purple-500/20 text-purple-300 bg-purple-500/5 px-2 py-0.5 text-[10px] rounded">
          🔮 {shadowEssence.toLocaleString()} 정수
        </span>
        <span className={`chip border-cyan-500/20 ${meta.color} bg-black/40 px-2 py-0.5 text-[10px] rounded`}>
          {meta.icon} {meta.label} ({state.overallReadiness}%)
        </span>
        <span className="chip border-cyan-500/20 text-cyan-300 bg-cyan-500/5 px-2 py-0.5 text-[10px] rounded">
          ⏱️ 오늘 집중 {todaySuccessFocusMin}분
        </span>
        {s.secretProgress?.worldSignals?.intensity && s.secretProgress.worldSignals.intensity > 0 ? (
          <span className="chip border-red-500/30 text-red-400 bg-red-950/10 px-2 py-0.5 text-[10px] rounded animate-pulse">
            📡 이상 징후 감지 ({s.secretProgress.worldSignals.intensity > 60 ? '근접' : s.secretProgress.worldSignals.intensity > 30 ? '인지' : '위화감'})
          </span>
        ) : null}
        
        {/* Next Exam Alert CTA */}
        {pendingExam && (
          <button
            onClick={() => onTabChange?.('grade')}
            className="chip animate-pulse cursor-pointer border-red-500/40 text-red-300 bg-red-500/10 font-bold hover:bg-red-500/20 transition px-2 py-0.5 text-[10px] rounded"
          >
            ⚠️ [{GRADE_LABELS[pendingExam.targetGrade]} 심사 가용] 심사장 가기
          </button>
        )}
      </div>

      {/* 2. Expanded Detailed View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-5 space-y-5 border-t border-white/10 pt-5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Detailed Stats Panel */}
              <div className="panel bg-black/40 border border-white/5 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-sm font-bold text-cyan-300">상세 능력치</span>
                  {hunter.freeStatPoints > 0 && (
                    <span className="text-[10px] text-amber-300 font-bold animate-pulse">
                      ⚡ 미배분 포인트 {hunter.freeStatPoints} 보유
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(STAT_META) as StatKey[]).map((key) => {
                    const statMeta = STAT_META[key]
                    const baseValue = hunter.stats[key]
                    const equipBonus = equipmentBonuses[key] ?? 0
                    const effect = getStatEffect(key)
                    return (
                      <div key={key} className="bg-ink-900/40 border border-cyan-400/5 rounded p-2 flex items-center justify-between hover:border-cyan-400/20 transition">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{statMeta.icon}</span>
                          <div>
                            <div className="text-[9px] text-cyan-300/40 system-text">{key}</div>
                            <div className={`text-[10px] font-bold ${statMeta.color}`}>{statMeta.label}</div>
                            {effect && <div className="text-[8px] text-cyan-300/30 system-text">{effect}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="text-right">
                            <div className="text-sm font-bold text-white">
                              {formatStat(baseValue)}
                              {equipBonus > 0 && (
                                <span className="text-[10px] text-purple-300 ml-0.5">+{equipBonus}</span>
                              )}
                            </div>
                          </div>
                          {hunter.freeStatPoints > 0 && (
                            <button
                              onClick={() => allocate(key)}
                              className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-400/20 rounded p-0.5 transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Daily Progression detailed axes */}
              <div className="panel bg-black/40 border border-white/5 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-sm font-bold text-cyan-300">오늘의 현실 준비도</span>
                  <span className={`text-xs font-bold ${meta.color}`}>
                    {meta.icon} {meta.label} ({state.overallReadiness}/100)
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 p-2 rounded">
                    <div className="text-white/40 text-[9px] mb-0.5">📚 집중 공명</div>
                    <div className="font-bold text-cyan-400">{state.focusResonance} pt</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded">
                    <div className="text-white/40 text-[9px] mb-0.5">🏋️ 신체 준비도</div>
                    <div className="font-bold text-emerald-400">{state.bodyReadiness} pt</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded">
                    <div className="text-white/40 text-[9px] mb-0.5">🧘 정신 균형</div>
                    <div className="font-bold text-purple-400">{state.mindBalance} pt</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded">
                    <div className="text-white/40 text-[9px] mb-0.5">🔁 루틴 점수</div>
                    <div className="font-bold text-amber-400">{state.routineScore} pt</div>
                  </div>
                </div>

                <div className="text-[10px] text-white/40 border-t border-white/5 pt-2 flex flex-wrap gap-x-3 gap-y-1">
                  <span>⚔️ 보상배율: +{Math.round(state.gateRewardBonus * 100)}%</span>
                  <span>🛡️ 레드저항: +{Math.round(state.redGateResistBonus * 100)}%</span>
                  <span>✨ 스킬XP: +{Math.round(state.skillXpBonus * 100)}%</span>
                  <span>👁️ 추출률: +{Math.round(state.extractionBonus * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Navigation shortcuts (Option C link triggers) */}
            <div className="flex gap-2 justify-center flex-wrap py-2 border-y border-white/5">
              <button 
                onClick={() => { onTabChange?.('grade'); setIsExpanded(false) }} 
                className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 hover:border-cyan-400/40"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                등급 및 칭호 관리
              </button>
              <button 
                onClick={() => { onTabChange?.('gate'); setIsExpanded(false) }} 
                className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 hover:border-cyan-400/40"
              >
                <Swords className="w-3.5 h-3.5 text-cyan-400" />
                게이트 및 집중 요약
              </button>
              <button 
                onClick={() => { onTabChange?.('coach'); setIsExpanded(false) }} 
                className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 hover:border-cyan-400/40"
              >
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                AI 코치 분석 피드백
              </button>
            </div>

            {/* Render sub-panels inside expanded profile */}
            <div className="space-y-6">
              <SkillPanel />
              <JobPanel />
              
              {s.secretProgress?.worldSignals?.recentSignals && 
               s.secretProgress.worldSignals.recentSignals.filter(sig => sig.spoilerLevel <= 2).length > 0 && (
                <div className="panel p-4 border-red-500/20 bg-red-950/5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3 border-b border-red-500/10 pb-2">
                    <span className="text-[11px] font-extrabold text-red-400 tracking-wider flex items-center gap-1.5 uppercase">
                      📡 이상 징후 관측 로그 (비공개 기록)
                    </span>
                    <span className="text-[10px] font-mono text-red-400/80">
                      상태: {s.secretProgress.worldSignals.intensity > 60 ? '주파수 고정' : s.secretProgress.worldSignals.intensity > 30 ? '신호 수신 중' : '미세한 전도'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {s.secretProgress.worldSignals.recentSignals
                      .filter(sig => sig.spoilerLevel <= 2)
                      .slice(0, 3)
                      .map((sig) => (
                        <div 
                          key={sig.id} 
                          className="bg-black/30 border border-red-500/10 rounded p-2.5 flex flex-col gap-1 transition hover:border-red-500/20"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-300">
                              {sig.title}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono">
                              {new Date(sig.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-normal">
                            {sig.body}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
