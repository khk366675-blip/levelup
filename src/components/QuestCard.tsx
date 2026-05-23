import { motion } from 'framer-motion'
import { Check, Clock, Trash2, Edit, Plus, FastForward } from 'lucide-react'
import { useGame } from '../lib/store'
import { CATEGORY_META, DIFFICULTY_META, type Quest, type StatKey, type MainQuestMilestone } from '../lib/types'
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
  const completeMilestone = useGame(s => s.completeMainQuestMilestone)
  const skipMilestone = useGame(s => s.skipMainQuestMilestone)
  const addMilestone = useGame(s => s.addMainQuestMilestone)
  const updateMilestone = useGame(s => s.updateMainQuestMilestone)

  const cat = CATEGORY_META[quest.category]
  const diff = DIFFICULTY_META[quest.difficulty]

  const isV2Milestones = quest.type === 'main' &&
    quest.milestones &&
    quest.milestones.length > 0 &&
    typeof quest.milestones[0] !== 'string'

  const handleCompleteMilestone = (milestoneId: string, milestoneTitle: string) => {
    const note = window.prompt(`"${milestoneTitle}" 완료 증거 메모를 입력하세요 (선택):`, '')
    if (note === null) return
    completeMilestone(quest.id, milestoneId, note || undefined)
  }

  const handleSkipMilestone = (milestoneId: string, milestoneTitle: string) => {
    const ok = window.confirm(`"${milestoneTitle}" 단계를 건너뛰시겠습니까?\n건너뛰면 마일스톤 완수 보상(XP/Gold)은 지급되지 않으며, 다음 단계가 활성화되었습니다.`)
    if (ok) {
      skipMilestone(quest.id, milestoneId)
    }
  }

  const handleAddMilestone = () => {
    const titleInput = window.prompt('추가할 새로운 중간 단계(Milestone) 제목을 입력하십시오:')
    if (!titleInput || !titleInput.trim()) return
    
    const descInput = window.prompt('해당 단계의 간략한 설명을 입력하십시오 (선택):')
    
    addMilestone(quest.id, {
      title: titleInput.trim(),
      description: descInput?.trim() || undefined,
      importance: 'normal',
      order: quest.milestones ? quest.milestones.length : 0
    })
  }

  const handleEditMilestone = (m: MainQuestMilestone) => {
    const newTitle = window.prompt(`"${m.title}" 단계의 새로운 제목을 입력하십시오:`, m.title)
    if (newTitle === null) return
    if (!newTitle.trim()) {
      alert('제목은 비워둘 수 없습니다.')
      return
    }

    const newDesc = window.prompt(`"${m.title}" 단계의 새로운 설명을 입력하십시오 (선택):`, m.description || '')
    if (newDesc === null) return

    updateMilestone(quest.id, m.id, {
      title: newTitle.trim(),
      description: newDesc.trim() || undefined
    })
  }

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
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xl">{cat.icon}</span>
            <span className="chip border-current/30 text-white/70">{cat.label}</span>
            <span className={`chip border-current/30 ${diff.color}`}>{diff.label}</span>
            {quest.coachReason && (
              <span className="chip border-purple-400/40 text-purple-300 font-bold bg-purple-950/30 text-[10px]">
                🤖 AI 플랜
              </span>
            )}
            {(quest.aiPriority || quest.coachPriority) && (
              <span className={`chip text-[10px] px-1.5 py-0.5 rounded border ${
                (quest.aiPriority || quest.coachPriority) === 'core' ? 'border-red-400/40 text-red-300 bg-red-950/20' :
                (quest.aiPriority || quest.coachPriority) === 'support' ? 'border-cyan-400/40 text-cyan-300 bg-cyan-950/20' :
                (quest.aiPriority || quest.coachPriority) === 'maintenance' ? 'border-amber-400/40 text-amber-300 bg-amber-950/20' :
                (quest.aiPriority || quest.coachPriority) === 'recovery' ? 'border-emerald-400/40 text-emerald-300 bg-emerald-950/20' :
                'border-zinc-500/40 text-zinc-400 bg-zinc-950/20'
              }`}>
                {(quest.aiPriority || quest.coachPriority)!.toUpperCase()}
              </span>
            )}
            {(quest.aiEstimatedMinutes || quest.estimatedMinutes) && (
              <span className="chip border-cyan-400/20 text-cyan-200/70 bg-cyan-950/10 text-[9px]">
                ⏱️ {quest.aiEstimatedMinutes || quest.estimatedMinutes}분
              </span>
            )}
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
        {quest.coachReason && (
          <div className="mt-1.5 p-2 bg-purple-950/20 border border-purple-500/10 rounded text-[10px] text-purple-300/80 italic leading-relaxed">
            💡 {quest.coachReason}
          </div>
        )}

        {/* Main Quest v2 Milestones */}
        {isV2Milestones && (() => {
          const milestones = (quest.milestones as MainQuestMilestone[]) || []
          const sorted = [...milestones].sort((a, b) => a.order - b.order)
          
          return (
            <div className="mt-3.5 space-y-3.5 border-t border-cyan-400/10 pt-3">
              {/* 진행도 프로그레스 바 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-cyan-300/60">
                  <span>진행도 (Milestones)</span>
                  <span>{quest.progressPercent ?? 0}% ({sorted.filter(m => m.status === 'completed').length}/{sorted.length})</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-cyan-400/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                    initial={false}
                    animate={{ width: `${quest.progressPercent ?? 0}%` }}
                  />
                </div>
              </div>

              {/* 마일스톤 항목 리스트 */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sorted.map((m) => {
                  const isCompleted = m.status === 'completed'
                  const isActive = m.status === 'active'
                  const isLocked = m.status === 'locked'
                  const isSkipped = m.status === 'skipped'
                  
                  return (
                    <div 
                      key={m.id} 
                      className={`p-2 rounded text-xs border transition-all ${
                        isCompleted ? 'bg-emerald-950/20 border-emerald-500/25 opacity-75' :
                        isActive ? 'bg-cyan-950/30 border-cyan-400/30' :
                        isSkipped ? 'bg-amber-950/20 border-amber-500/25 opacity-75' :
                        'bg-ink-950/20 border-cyan-400/5 opacity-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-white">{m.title}</span>
                            {/* 상태 뱃지 */}
                            <span className={`text-[9px] px-1 rounded border font-mono ${
                              isCompleted ? 'border-emerald-400/30 text-emerald-300 bg-emerald-500/5' :
                              isActive ? 'border-cyan-400/30 text-cyan-300 bg-cyan-400/5 animate-pulse' :
                              isSkipped ? 'border-amber-400/30 text-amber-300 bg-amber-400/5' :
                              'border-zinc-500/30 text-zinc-400'
                            }`}>
                              {m.status.toUpperCase()}
                            </span>
                            {/* 단계 편집 버튼 */}
                            {!quest.completed && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditMilestone(m)
                                }}
                                className="text-white/30 hover:text-cyan-300 transition"
                                title="단계 수정"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          {m.description && <p className="text-[11px] text-white/50">{m.description}</p>}
                          {m.evidenceNote && (
                            <p className="text-[10px] text-emerald-400/80 bg-emerald-950/30 px-1.5 py-0.5 rounded mt-1 font-mono italic">
                              ✍️ {m.evidenceNote}
                            </p>
                          )}
                        </div>

                        {/* 달성 완료 / 건너뛰기 버튼 */}
                        {isActive && !isCompleted && !quest.completed && (
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSkipMilestone(m.id, m.title)
                              }}
                              className="px-2 py-1 bg-amber-950/40 border border-amber-500/35 hover:bg-amber-950/60 text-amber-300 rounded text-[10px] font-bold transition flex items-center gap-0.5 whitespace-nowrap"
                              title="단계 건너뛰기"
                            >
                              <FastForward className="w-2.5 h-2.5" /> 건너뛰기
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCompleteMilestone(m.id, m.title)
                              }}
                              className="px-2 py-1 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded text-[10px] font-bold transition shadow-md whitespace-nowrap"
                            >
                              달성 완료
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 수동 단계 추가 버튼 */}
              {!quest.completed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddMilestone()
                  }}
                  className="w-full py-1.5 border border-dashed border-cyan-400/20 hover:border-cyan-400/50 bg-cyan-400/5 hover:bg-cyan-400/10 text-cyan-300 rounded text-xs font-bold transition flex items-center justify-center gap-1 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> 새 중간 단계 추가
                </button>
              )}
            </div>
          )
        })()}

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
            {/* milestones: current / next goal */}
            {quest.milestones && quest.milestones.length > 0 && (() => {
              const ms = quest.milestones as string[]
              const currentIdx = quest.currentSteps ?? 0
              return (
                <div className="mt-2 space-y-0.5">
                  {!dungeonDone ? (
                    <>
                      {ms[currentIdx] && (
                        <p className="text-[11px] text-amber-300/90 leading-snug line-clamp-2">
                          <span className="text-white/50">현재 목표:</span> {ms[currentIdx]}
                        </p>
                      )}
                      {ms[currentIdx + 1] ? (
                        <p className="text-[10px] text-white/40 leading-snug line-clamp-1">
                          <span className="text-white/30">다음 목표:</span> {ms[currentIdx + 1]}
                        </p>
                      ) : (
                        <p className="text-[10px] text-emerald-300/70 leading-snug">
                          <span className="text-white/30">다음 목표:</span> 최종 단계
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[11px] text-emerald-300/80 leading-snug">
                      모든 단계 완료
                    </p>
                  )}
                </div>
              )
            })()}
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
