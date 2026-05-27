import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, ShieldCheck } from 'lucide-react'
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

function cardStateClass(card: ChallengeCard, selected: boolean): string {
  if (card.status === 'completed') return 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100'
  if (card.status === 'selected') return 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100'
  if (card.status === 'expired') return 'border-rose-300/30 bg-rose-300/10 text-rose-100'
  if (selected) return 'border-violet-300/35 bg-violet-300/12 text-violet-100'
  return 'border-slate-500/18 bg-black/15 text-white/50'
}

function conditionShortText(card: ChallengeCard): string {
  const target = card.condition.target ?? 1
  switch (card.condition.type) {
    case 'completeAnyDaily':
      return `Daily ${target}개`
    case 'completeDailyCount':
      return `Daily ${target}개`
    case 'completeQuestCategory':
      return `${CATEGORY_LABEL[card.category]} ${target}개`
    case 'completeGateAttempt':
      return '게이트 도전'
    case 'completeGateVictory':
      return '게이트 승리'
    case 'completeShadowExpedition':
      return '원정 완료'
    case 'completeTowerAttempt':
      return '탑 도전'
    case 'completeTowerClear':
      return '탑 승리'
    case 'openBox':
      return `박스 ${target}개`
    case 'completeWorkoutAndStudy':
      return '운동+학습'
    default:
      return '오늘 목표'
  }
}

export function ChallengeCardsPanel() {
  const cards = useGame(s => s.todayChallengeCards ?? [])
  const selectedIdsFromStore = useGame(s => s.selectedChallengeCardIds)
  const selectedIds = selectedIdsFromStore ?? []
  const selectChallengeCards = useGame(s => s.selectChallengeCards)
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds)
  const [cardReveal, setCardReveal] = useState<'selected' | 'completed' | undefined>()
  const previousCompletedRef = useRef<number | undefined>(undefined)

  const selectedIdsKey = (selectedIdsFromStore ?? []).join(',')
  useEffect(() => {
    setDraftIds(selectedIdsFromStore ?? [])
  }, [selectedIdsKey])

  const hasSelected = selectedIds.length > 0
  const selectedSet = new Set(hasSelected ? selectedIds : draftIds)
  const shownCards = hasSelected ? cards.filter(card => selectedSet.has(card.id)) : cards
  const completedCount = cards.filter(card => selectedIds.includes(card.id) && card.status === 'completed').length
  const selectedCards = cards.filter(card => selectedIds.includes(card.id))
  const pendingCount = Math.max(0, selectedCards.length - completedCount)
  const fullClearBonusReady = selectedCards.length === 3 && completedCount >= 3
  const draftReward = cards
    .filter(card => selectedSet.has(card.id))
    .reduce((sum, card) => ({
      hunterXp: sum.hunterXp + card.reward.hunterXp,
      gold: sum.gold + (card.reward.gold ?? 0),
      shadowEssence: sum.shadowEssence + card.reward.shadowEssence,
      boxUpgradePoints: sum.boxUpgradePoints + card.reward.boxUpgradePoints,
    }), { hunterXp: 0, gold: 0, shadowEssence: 0, boxUpgradePoints: 0 })
  const nextActionText = !hasSelected
    ? draftIds.length === 3
      ? '세 장을 확정하면 오늘의 카드 루프가 시작됩니다.'
      : `후보 중 ${3 - draftIds.length}장을 더 선택하세요.`
    : pendingCount > 0
      ? `진행 중 카드 ${pendingCount}장을 완료하면 보상과 박스 강화가 자동 지급됩니다.`
      : '오늘 선택 카드를 모두 완료했습니다.'
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
            title: completedCount >= 3 ? 'FULL CLEAR BONUS' : 'CARD COMPLETE',
            text: '도전 카드가 빛을 남겼다.',
            subtext: completedCount >= 3 ? '완전 달성 보너스와 박스 최고 보정이 적용됩니다.' : `완료 ${completedCount}/3 · 박스 강화 진행`,
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
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-violet-50">오늘의 도전 카드</h3>
          <p className="mt-0.5 text-xs leading-snug text-white/55">{nextActionText}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-violet-300/22 bg-violet-400/10 px-2.5 py-1 text-xs font-bold text-violet-100">
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

      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[10px] system-text text-white/60">
        <span>선택 합계</span>
        <span className="rounded border border-cyan-300/20 bg-cyan-400/10 px-1.5 py-0.5 text-cyan-100">XP +{draftReward.hunterXp}</span>
        <span className="rounded border border-amber-300/20 bg-amber-400/10 px-1.5 py-0.5 text-amber-100">Gold +{draftReward.gold}</span>
        <span className="rounded border border-emerald-300/20 bg-emerald-400/10 px-1.5 py-0.5 text-emerald-100">정수 +{draftReward.shadowEssence}</span>
        <span className="rounded border border-amber-300/22 bg-amber-400/8 px-1.5 py-0.5 text-amber-100">박스 +{draftReward.boxUpgradePoints}</span>
        {fullClearBonusReady && (
          <span className="rounded border border-amber-300/30 bg-amber-400/12 px-1.5 py-0.5 text-amber-100">3장 완전 달성 보너스 적용</span>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="rounded-md border border-violet-300/12 bg-ink-900/35 px-3 py-5 text-center text-sm text-white/45">
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
                  'min-h-[148px] rounded-lg border p-3.5 text-left transition',
                  selected && !hasSelected && 'challenge-card-selected',
                  completed && 'challenge-card-complete',
                  DIFFICULTY_CLASS[card.difficulty],
                  selected && !completed && 'ring-1 ring-violet-300/35',
                  completed && 'ring-2 ring-emerald-300/45',
                  !hasSelected && !selected && draftIds.length >= 3 && 'opacity-55'
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px] system-text">
                      <span className="rounded border border-violet-300/18 bg-black/20 px-1.5 py-0.5">
                        {DIFFICULTY_LABEL[card.difficulty]}
                      </span>
                      <span className="rounded border border-violet-300/14 bg-black/15 px-1.5 py-0.5">
                        {CATEGORY_LABEL[card.category]}
                      </span>
                      <span className={clsx('rounded border px-1.5 py-0.5', cardStateClass(card, selected))}>
                        {cardStateText(card)}
                      </span>
                    </div>
                    <div className="text-sm font-bold leading-snug text-white">{card.title}</div>
                    <div className="mt-0.5 text-[11px] text-white/55">목표: {conditionShortText(card)}</div>
                  </div>
                  {completed ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-200" />
                  ) : selected ? (
                    <ShieldCheck className="h-5 w-5 shrink-0 text-white/80" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-white/35" />
                  )}
                </div>

                <div className="text-xs leading-relaxed text-white/60 line-clamp-2">{card.description}</div>

                <div className="mt-3 text-[11px] text-white/72">
                  <span className="text-cyan-100">XP +{card.reward.hunterXp}</span>
                  <span className="mx-1 text-white/30">·</span>
                  <span className="text-amber-100">Gold +{card.reward.gold ?? 0}</span>
                  <span className="mx-1 text-white/30">·</span>
                  <span className="text-emerald-100">정수 +{card.reward.shadowEssence}</span>
                  <span className="mx-1 text-white/30">·</span>
                  <span className="text-amber-100">박스 +{card.reward.boxUpgradePoints}</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
