import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Flame, ShieldCheck, Sparkles } from 'lucide-react'
import { useGame } from '../lib/store'
import type { ChallengeCard, ChallengeCardDifficulty } from '../lib/types'
import { DramaticReveal, type RevealStep } from './DramaticReveal'

const DIFFICULTY_LABEL: Record<ChallengeCardDifficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
}

const DIFFICULTY_CLASS: Record<ChallengeCardDifficulty, string> = {
  easy: 'border-emerald-300/25 bg-emerald-400/8 text-emerald-100',
  normal: 'border-cyan-300/25 bg-cyan-400/8 text-cyan-100',
  hard: 'border-amber-300/35 bg-amber-400/10 text-amber-100',
}

const CATEGORY_LABEL: Record<ChallengeCard['category'], string> = {
  workout: '운동',
  study: '학습',
  finance: '금융',
  life: '생활',
  sleep: '수면',
  gate: '게이트',
  shadow: '그림자',
  tower: '탑',
  habit: '습관',
}

function cardStateText(card: ChallengeCard): string {
  if (card.status === 'completed') return '완료'
  if (card.status === 'selected') return '진행 중'
  if (card.status === 'expired') return '만료'
  return '후보'
}

export function ChallengeCardsPanel() {
  const cards = useGame(s => s.todayChallengeCards ?? [])
  const selectedIds = useGame(s => s.selectedChallengeCardIds ?? [])
  const selectChallengeCards = useGame(s => s.selectChallengeCards)
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds)
  const [cardReveal, setCardReveal] = useState<'selected' | 'completed' | undefined>()
  const previousCompletedRef = useRef<number | undefined>(undefined)

  const hasSelected = selectedIds.length > 0
  const selectedSet = new Set(hasSelected ? selectedIds : draftIds)
  const shownCards = hasSelected ? cards.filter(card => selectedSet.has(card.id)) : cards
  const completedCount = cards.filter(card => selectedIds.includes(card.id) && card.status === 'completed').length
  const cardRevealSteps: RevealStep[] = cardReveal === 'selected'
    ? [
        {
          title: 'CHALLENGE SET',
          text: '오늘의 도전이 확정되었습니다.',
          subtext: '세 장의 카드가 하루의 루프에 고정됩니다.',
          durationMs: 900,
          tone: 'success',
          emphasis: true,
        },
      ]
    : cardReveal === 'completed'
      ? [
          {
            title: 'CARD COMPLETE',
            text: '도전 카드가 빛을 남겼다.',
            subtext: `완료 ${completedCount}/3 · 박스 강화 진행`,
            durationMs: 900,
            tone: completedCount >= 3 ? 'rank' : 'success',
            emphasis: completedCount >= 3,
          },
        ]
      : []

  useEffect(() => {
    if (previousCompletedRef.current === undefined) {
      previousCompletedRef.current = completedCount
      return
    }
    if (completedCount > previousCompletedRef.current) {
      setCardReveal('completed')
    }
    previousCompletedRef.current = completedCount
  }, [completedCount])

  const toggleDraft = (id: string) => {
    if (hasSelected) return
    setDraftIds(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  const confirmCards = () => {
    selectChallengeCards(draftIds)
    setCardReveal('selected')
  }

  return (
    <div className="panel corner-bracket p-4 border-violet-400/25 bg-violet-500/5">
      <div className="br" />
      <DramaticReveal
        isOpen={Boolean(cardReveal)}
        steps={cardRevealSteps}
        tone={cardReveal === 'selected' ? 'success' : completedCount >= 3 ? 'rank' : 'success'}
        position="modal"
        compact
        onComplete={() => setCardReveal(undefined)}
        onSkip={() => setCardReveal(undefined)}
      />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="system-text text-[11px] text-violet-300/75">DAILY CHALLENGE CARDS</div>
          <h3 className="text-lg font-bold text-violet-50">오늘의 도전 카드</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] system-text text-white/55">
            {hasSelected ? `${completedCount}/3 완료` : `${draftIds.length}/3 선택`}
          </div>
          {!hasSelected && (
            <button
              type="button"
              onClick={confirmCards}
              disabled={draftIds.length !== 3}
              className="min-h-9 rounded-md border border-violet-300/30 bg-violet-400/15 px-3 text-xs font-bold text-violet-100 disabled:opacity-45 disabled:cursor-not-allowed"
            >
              선택 확정
            </button>
          )}
        </div>
      </div>

      <div className="mb-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-white/55">
        후보 5장 중 3장을 고릅니다. 실패 패널티는 없고, 완료한 카드는 소량 보상과 오늘 박스 강화를 제공합니다.
      </div>

      {cards.length === 0 ? (
        <div className="rounded-md border border-white/10 bg-ink-900/35 px-3 py-5 text-center text-sm text-white/45">
          오늘의 카드가 아직 준비되지 않았습니다.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shownCards.map(card => {
            const selected = selectedSet.has(card.id)
            const completed = card.status === 'completed'
            return (
              <motion.button
                key={card.id}
                type="button"
                whileHover={{ y: hasSelected ? 0 : -2 }}
                onClick={() => toggleDraft(card.id)}
                className={clsx(
                  'min-h-[168px] rounded-lg border p-4 text-left transition',
                  selected && !hasSelected && 'challenge-card-selected',
                  completed && 'challenge-card-complete',
                  DIFFICULTY_CLASS[card.difficulty],
                  selected && !completed && 'ring-1 ring-white/35',
                  completed && 'ring-2 ring-emerald-300/45',
                  !hasSelected && !selected && draftIds.length >= 3 && 'opacity-55'
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded border border-white/15 bg-black/15 px-1.5 py-0.5 text-[10px] system-text">
                        {DIFFICULTY_LABEL[card.difficulty]}
                      </span>
                      <span className="rounded border border-white/15 bg-black/15 px-1.5 py-0.5 text-[10px] system-text">
                        {CATEGORY_LABEL[card.category]}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">{card.title}</div>
                  </div>
                  {completed ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-200" />
                  ) : selected ? (
                    <ShieldCheck className="h-5 w-5 shrink-0 text-white/80" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-white/35" />
                  )}
                </div>

                <div className="text-xs leading-relaxed text-white/65">{card.description}</div>

                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] system-text">
                  <span className="inline-flex items-center gap-1 rounded border border-white/15 bg-black/15 px-1.5 py-0.5">
                    <Sparkles className="h-3 w-3" /> XP +{card.reward.hunterXp}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded border border-white/15 bg-black/15 px-1.5 py-0.5">
                    <Flame className="h-3 w-3" /> 정수 +{card.reward.shadowEssence}
                  </span>
                  <span className="rounded border border-white/15 bg-black/15 px-1.5 py-0.5">
                    박스 +{card.reward.boxUpgradePoints}
                  </span>
                </div>

                <div className="mt-3 text-[10px] system-text text-white/45">{cardStateText(card)}</div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
