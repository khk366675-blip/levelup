import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useGame } from '../lib/store'
import {
  CATEGORY_META,
  DIFFICULTY_META,
  STAT_META,
  type Category,
  type Difficulty,
  type Quest,
  type StatKey,
} from '../lib/types'
import { getBalancedQuestXp } from '../lib/game'

interface Props {
  open: boolean
  onClose: () => void
  type: 'daily' | 'main' | 'dungeon'
}

export function AddQuestModal({ open, onClose, type }: Props) {
  const addQuest = useGame(s => s.addQuest)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState<Category>('workout')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [steps, setSteps] = useState(30)
  const [selectedStats, setSelectedStats] = useState<StatKey[]>(['STR'])

  const reset = () => {
    setTitle(''); setDesc(''); setCategory('workout'); setDifficulty('normal'); setSteps(30); setSelectedStats(['STR'])
  }

  const toggleStat = (s: StatKey) => {
    setSelectedStats(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const submit = () => {
    if (!title.trim()) return
    const statRewards: Quest['statRewards'] = {}
    const baseGain = difficulty === 'boss' ? 4 : difficulty === 'apex' ? 4 : difficulty === 'elite' ? 3 : difficulty === 'hard' ? 2 : 1
    selectedStats.forEach(s => { statRewards[s] = baseGain })

    addQuest({
      title: title.trim(),
      description: desc.trim() || undefined,
      category,
      difficulty,
      statRewards,
      type,
      recurring: type === 'daily',
      totalSteps: type === 'dungeon' ? steps : undefined,
      currentSteps: type === 'dungeon' ? 0 : undefined,
    })
    reset()
    onClose()
  }

  const label = type === 'daily' ? '일일 퀘스트' : type === 'main' ? '메인 퀘스트' : '던전'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="panel panel-glow corner-bracket p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="br" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-100">새 {label} 추가</h3>
              <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-cyan-300/70 system-text mb-1">제목</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 영어 단어 30개 외우기"
                  className="w-full bg-ink-900/60 border border-cyan-400/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/60"
                />
              </div>

              <div>
                <label className="block text-xs text-cyan-300/70 system-text mb-1">설명 (선택)</label>
                <input
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="구체적인 조건"
                  className="w-full bg-ink-900/60 border border-cyan-400/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/60"
                />
              </div>

              <div>
                <label className="block text-xs text-cyan-300/70 system-text mb-1">카테고리</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(CATEGORY_META) as Category[]).map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-2 py-2 rounded text-xs border transition ${
                        category === c
                          ? 'bg-cyan-400/20 border-cyan-400/60 text-white'
                          : 'bg-ink-900/40 border-white/10 text-white/60 hover:border-white/30'
                      }`}
                    >
                      <div>{CATEGORY_META[c].icon}</div>
                      <div className="text-[10px] mt-0.5">{CATEGORY_META[c].label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-cyan-300/70 system-text mb-1">난이도</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(Object.keys(DIFFICULTY_META) as Difficulty[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-2 py-2 rounded text-xs border transition ${
                        difficulty === d
                          ? `bg-white/10 border-current ${DIFFICULTY_META[d].color}`
                          : 'bg-ink-900/40 border-white/10 text-white/50 hover:border-white/30'
                      }`}
                    >
                      <div className="font-bold">{DIFFICULTY_META[d].label}</div>
                      <div className="text-[10px] mt-0.5 opacity-70">+{getBalancedQuestXp(type, d)}xp</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-cyan-300/70 system-text mb-1">성장 스탯 (1개 이상)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(STAT_META) as StatKey[]).map(s => (
                    <button
                      key={s}
                      onClick={() => toggleStat(s)}
                      className={`px-2 py-1.5 rounded text-xs border transition flex items-center justify-center gap-1 ${
                        selectedStats.includes(s)
                          ? `bg-cyan-400/15 border-cyan-400/50 ${STAT_META[s].color}`
                          : 'bg-ink-900/40 border-white/10 text-white/50 hover:border-white/30'
                      }`}
                    >
                      <span>{STAT_META[s].icon}</span>
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              {type === 'dungeon' && (
                <div>
                  <label className="block text-xs text-cyan-300/70 system-text mb-1">진행 단계 (일수 등)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={steps}
                    onChange={(e) => setSteps(parseInt(e.target.value) || 1)}
                    className="w-full bg-ink-900/60 border border-cyan-400/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/60"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={onClose} className="btn btn-ghost flex-1">취소</button>
              <button onClick={submit} className="btn btn-primary flex-1" disabled={!title.trim() || selectedStats.length === 0}>
                추가
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
