import { motion } from 'framer-motion'
import { Check, Clock, Trash2 } from 'lucide-react'
import { useGame } from '../lib/store'
import { CATEGORY_META, DIFFICULTY_META, type Quest, type StatKey } from '../lib/types'
import {
  formatStatReward,
  getBalancedDungeonClearXp,
  getBalancedDungeonStepXp,
  getBalancedQuestStatRewards,
  getBalancedQuestXp,
  getCooldownRemaining,
} from '../lib/game'

interface Props {
  quest: Quest
  onRemove?: () => void
  removable?: boolean
}

export function QuestCard({ quest, onRemove, removable }: Props) {
  const complete = useGame(s => s.completeQuest)
  const progress = useGame(s => s.progressDungeon)

  const cat = CATEGORY_META[quest.category]
  const diff = DIFFICULTY_META[quest.difficulty]

  const cooldownRemaining = quest.type === 'daily' ? getCooldownRemaining(quest) : 0
  const isDailyDone = quest.type === 'daily' && cooldownRemaining > 0
  const isMainDone = quest.type === 'main' && !!quest.completed
  const isDungeon = quest.type === 'dungeon'
  const dungeonDone = isDungeon && (quest.currentSteps ?? 0) >= (quest.totalSteps ?? 1)
  const done = isDailyDone || isMainDone || dungeonDone
  const isCooldown = quest.type === 'daily' && (quest.cooldownDays ?? 0) >= 1 && cooldownRemaining > 0
  // For dungeons: rank-standard clear XP is the "headline" reward; per-step XP is a smaller progress reward.
  const dungeonClearXp = isDungeon ? getBalancedDungeonClearXp(quest.difficulty) : 0
  const dungeonStepXp = isDungeon ? getBalancedDungeonStepXp(quest.difficulty, quest.totalSteps ?? 1) : 0
  const nonDungeonXp = !isDungeon ? getBalancedQuestXp(quest.type, quest.difficulty) : 0
  const clearStatRewards = getBalancedQuestStatRewards(quest)
  const growthStatSummary = (Object.keys(clearStatRewards) as StatKey[])
    .filter(stat => (clearStatRewards[stat] ?? 0) > 0)
    .join('/')

  const handleAction = () => {
    if (done) return
    if (isDungeon) progress(quest.id)
    else complete(quest.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-lg border bg-gradient-to-br ${cat.color}
        ${done ? 'border-emerald-400/30 opacity-60' : 'border-cyan-400/20 hover:border-cyan-400/50'}
        backdrop-blur-sm transition-all`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{cat.icon}</span>
            <span className="chip border-current/30 text-white/70">{cat.label}</span>
            <span className={`chip border-current/30 ${diff.color}`}>{diff.label}</span>
          </div>
          {removable && onRemove && (
            <button
              onClick={onRemove}
              className="text-red-400/50 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
              title="삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <h3 className={`font-semibold leading-snug ${done ? 'line-through text-white/50' : 'text-white'}`}>
          {quest.title}
        </h3>
        {quest.description && (
          <p className="text-xs text-white/50 mt-1">{quest.description}</p>
        )}

        {/* dungeon progress */}
        {isDungeon && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] system-text text-white/60 mb-1">
              <span>진행도</span>
              <span>{quest.currentSteps ?? 0} / {quest.totalSteps}</span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full xp-bar-fill"
                initial={false}
                animate={{ width: `${Math.min(100, ((quest.currentSteps ?? 0) / (quest.totalSteps ?? 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-end justify-between mt-3">
          <div className="flex items-center gap-1.5 text-[11px] text-white/60 system-text flex-wrap">
            {isDungeon ? (
              <>
                <span className="text-cyan-300 font-bold">클리어 +{dungeonClearXp} XP</span>
                {!dungeonDone && (
                  <span className="text-white/40">· 단계 +{dungeonStepXp} XP</span>
                )}
                {growthStatSummary && (
                  <span className="text-white/40">· 성장 {growthStatSummary}</span>
                )}
                {Object.entries(clearStatRewards).map(([k, v]) => (
                  <span key={k} className="text-white/50">· {k} {formatStatReward(v ?? 0)}</span>
                ))}
              </>
            ) : (
              <>
                <span className="text-cyan-300 font-bold">+{nonDungeonXp} XP</span>
                {growthStatSummary && (
                  <span className="text-white/40">· 성장 {growthStatSummary}</span>
                )}
                {Object.entries(clearStatRewards).map(([k, v]) => (
                  <span key={k} className="text-white/50">· {k} {formatStatReward(v ?? 0)}</span>
                ))}
              </>
            )}
          </div>

          <button
            onClick={handleAction}
            disabled={done}
            className={`btn ${done ? 'btn-ghost opacity-60' : 'btn-primary'} text-xs px-3 py-1.5`}
          >
            {done ? (
              isCooldown ? (
                <><Clock className="w-3.5 h-3.5" /> {cooldownRemaining}일 후 재개</>
              ) : (
                <><Check className="w-3.5 h-3.5" /> 완료</>
              )
            ) : isDungeon ? (
              '오늘 진행'
            ) : (
              '완료하기'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
