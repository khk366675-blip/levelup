import { useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Lock } from 'lucide-react'
import { useGame } from '../lib/store'
import { TITLE_DEFINITIONS, type TitleRarity } from '../lib/types'

type TitleFilter = 'all' | 'owned' | 'locked'

const RARITY_STYLE: Record<TitleRarity, { color: string; border: string; bg: string; label: string }> = {
  normal: { 
    color: 'text-zinc-300', 
    border: 'border-zinc-500/40', 
    bg: 'bg-zinc-500/10',
    label: '일반',
  },
  rare: { 
    color: 'text-cyan-300', 
    border: 'border-cyan-400/50', 
    bg: 'bg-cyan-400/10',
    label: '희귀',
  },
  epic: { 
    color: 'text-purple-300', 
    border: 'border-purple-400/60', 
    bg: 'bg-purple-400/10',
    label: '영웅',
  },
  legendary: { 
    color: 'text-amber-300', 
    border: 'border-amber-400/70', 
    bg: 'bg-amber-400/10',
    label: '전설',
  },
}

export function TitleCollection() {
  const [filter, setFilter] = useState<TitleFilter>('all')
  const hunter = useGame(s => s.hunter)
  const equipTitle = useGame(s => s.equipTitle)

  const ownedCount = hunter.ownedTitleIds.length
  const totalCount = TITLE_DEFINITIONS.length

  const equippedDef = hunter.equippedTitleId
    ? TITLE_DEFINITIONS.find(t => t.id === hunter.equippedTitleId)
    : undefined

  // Filter titles
  const filteredTitles = TITLE_DEFINITIONS.filter(def => {
    const isOwned = hunter.ownedTitleIds.includes(def.id)
    if (filter === 'owned') return isOwned
    if (filter === 'locked') return !isOwned
    return true
  })

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="panel corner-bracket p-6">
        <div className="br" />
        <div className="system-text text-[11px] text-cyan-400/70 mb-3">
          ── 칭호 컬렉션 ──
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-cyan-300/60 mb-1">보유 칭호</div>
            <div className="text-2xl font-bold text-white">
              {ownedCount} <span className="text-lg text-white/50">/ {totalCount}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-cyan-300/60 mb-1">현재 장착</div>
            {equippedDef ? (
              <div className={`text-lg font-medium ${RARITY_STYLE[equippedDef.rarity].color}`}>
                {equippedDef.name}
              </div>
            ) : (
              <div className="text-lg text-white/40">없음</div>
            )}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: 'all' as const, label: '전체' },
          { key: 'owned' as const, label: '보유' },
          { key: 'locked' as const, label: '미보유' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filter === f.key
                ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/50'
                : 'bg-ink-900/50 text-white/50 border border-white/10 hover:text-white/80 hover:border-white/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Title Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTitles.map(def => {
          const isOwned = hunter.ownedTitleIds.includes(def.id)
          const isEquipped = hunter.equippedTitleId === def.id
          const isHiddenLocked = def.hidden && !isOwned
          const style = RARITY_STYLE[def.rarity]

          // Display values based on hidden status
          const displayName = isHiddenLocked ? '???' : def.name
          const displayDescription = isHiddenLocked
            ? '조건을 만족하면 정체가 드러납니다.'
            : def.description
          const displayCondition = isHiddenLocked
            ? '조건: ???'
            : def.conditionText
            ? `조건: ${def.conditionText}`
            : ''

          return (
            <motion.div
              key={def.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`panel corner-bracket p-4 ${style.border} ${isOwned ? '' : 'opacity-60'}`}
            >
              <div className="br" />
              
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isOwned ? (
                    <Award className={`w-4 h-4 ${style.color}`} />
                  ) : (
                    <Lock className="w-4 h-4 text-white/30" />
                  )}
                  <h3 className={`font-bold ${isOwned ? style.color : isHiddenLocked ? 'text-white/40' : style.color}`}>
                    {displayName}
                  </h3>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${style.bg} ${style.color} system-text`}>
                  {style.label}
                </span>
              </div>

              {/* Description */}
              <p className={`text-xs mb-2 ${isOwned ? 'text-white/70' : isHiddenLocked ? 'text-white/40 italic' : 'text-white/60'}`}>
                {displayDescription}
              </p>

              {/* Condition */}
              {displayCondition && (
                <div className={`text-[11px] system-text mb-3 ${isOwned ? 'text-cyan-300/60' : isHiddenLocked ? 'text-white/30' : 'text-cyan-300/50'}`}>
                  {displayCondition}
                </div>
              )}

              {/* Action */}
              {isOwned && (
                <div className="flex gap-2">
                  {isEquipped ? (
                    <div className="flex-1 text-center py-1.5 rounded bg-amber-400/20 text-amber-300 text-xs font-medium border border-amber-400/40">
                      장착 중
                    </div>
                  ) : (
                    <button
                      onClick={() => equipTitle(def.id)}
                      className="flex-1 btn btn-primary text-xs"
                    >
                      장착
                    </button>
                  )}
                </div>
              )}

              {!isOwned && (
                <div className={`text-center py-1.5 rounded text-xs border ${
                  isHiddenLocked
                    ? 'bg-purple-400/5 text-purple-300/50 border-purple-400/20'
                    : 'bg-white/5 text-white/30 border-white/10'
                }`}>
                  {isHiddenLocked ? '숨겨진 칭호' : '잠김'}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {filteredTitles.length === 0 && (
        <div className="panel corner-bracket p-10 text-center">
          <div className="br" />
          <div className="text-cyan-300/60 system-text text-sm">
            {filter === 'owned' && '아직 해금한 칭호가 없습니다.'}
            {filter === 'locked' && '모든 칭호를 해금했습니다!'}
          </div>
        </div>
      )}
    </div>
  )
}
