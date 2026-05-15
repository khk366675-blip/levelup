import { motion } from 'framer-motion'
import { useGame } from '../lib/store'
import { CATEGORY_META, DIFFICULTY_META } from '../lib/types'
import { getBalancedRandomQuestXp } from '../lib/game'
import { AlertTriangle, Check, X } from 'lucide-react'

export function RandomQuestCard() {
  const activeRandomQuest = useGame(s => s.activeRandomQuest)
  const completeRandomQuest = useGame(s => s.completeRandomQuest)
  const skipRandomQuest = useGame(s => s.skipRandomQuest)

  if (!activeRandomQuest) return null
  if (activeRandomQuest.completed) return null

  const category = CATEGORY_META[activeRandomQuest.category]
  const difficulty = DIFFICULTY_META[activeRandomQuest.difficulty]
  const displayedXp = getBalancedRandomQuestXp(activeRandomQuest.xp)

  // Calculate time remaining
  const now = new Date()
  const expiresAt = new Date(activeRandomQuest.expiresAt)
  const isExpired = now > expiresAt

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel corner-bracket p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-400/40"
    >
      <div className="br" />
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse" />
        <div className="system-text text-[11px] text-amber-300/90">
          ── SYSTEM ALERT ── 긴급 의뢰 발생
        </div>
      </div>

      {/* Quest Info */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-amber-300 mb-2">
          {activeRandomQuest.title}
        </h3>
        <p className="text-sm text-white/80 mb-3">
          {activeRandomQuest.description}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs system-text">
          <div className="flex items-center gap-1.5">
            <span>{category.icon}</span>
            <span className="text-cyan-300/70">{category.label}</span>
          </div>
          <div className={`${difficulty.color}`}>
            {difficulty.label}
          </div>
          <div className="text-purple-300/70">
            보상: {displayedXp} XP
          </div>
          <div className={`${isExpired ? 'text-red-300' : 'text-cyan-300/70'}`}>
            {isExpired ? '만료됨' : '제한 시간: 오늘 자정'}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isExpired && (
        <div className="flex gap-2">
          <button
            onClick={completeRandomQuest}
            className="flex-1 btn btn-primary text-sm flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            완료
          </button>
          <button
            onClick={skipRandomQuest}
            className="px-4 btn text-sm flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/20"
          >
            <X className="w-4 h-4" />
            넘기기
          </button>
        </div>
      )}
      {isExpired && (
        <div className="text-center py-2 text-sm text-red-300/70 system-text">
          이 의뢰는 만료되었습니다.
        </div>
      )}
    </motion.div>
  )
}
