import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, ShieldCheck, Sparkles, Box, Gift, Flame } from 'lucide-react'
import { useGame } from '../lib/store'
import type { ChallengeCard, ChallengeCardDifficulty } from '../lib/types'
import { DramaticReveal, type RevealStep } from './DramaticReveal'

const DIFFICULTY_LABEL: Record<ChallengeCardDifficulty, string> = {
  easy: 'EASY',
  normal: 'NORMAL',
  hard: 'HARD',
}

const DIFFICULTY_CLASS: Record<ChallengeCardDifficulty, string> = {
  easy: 'border-emerald-500/20 bg-emerald-950/20 text-emerald-100',
  normal: 'border-cyan-500/20 bg-cyan-950/20 text-cyan-100',
  hard: 'border-amber-500/30 bg-amber-950/30 text-amber-100',
}

const CATEGORY_LABEL: Record<ChallengeCard['category'], string> = {
  workout: '운동',
  study: '학습',
  finance: '금융',
  life: '생활',
  sleep: '수면',
  gate: '게이트',
  shadow: '그림자',
  tower: '도전',
  habit: '습관',
}

function cardStateText(card: ChallengeCard): string {
  if (card.status === 'completed') return '완료됨'
  if (card.status === 'selected') return '진행 중'
  if (card.status === 'expired') return '만료됨'
  return '후보'
}

function cardStateClass(card: ChallengeCard, selected: boolean): string {
  if (card.status === 'completed') return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
  if (card.status === 'selected') return 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
  if (card.status === 'expired') return 'border-rose-500/40 bg-rose-500/15 text-rose-300'
  if (selected) return 'border-violet-400/45 bg-violet-500/15 text-violet-200'
  return 'border-white/10 bg-white/5 text-white/50'
}

function conditionShortText(card: ChallengeCard): string {
  const target = card.condition.target ?? 1
  switch (card.condition.type) {
    case 'completeAnyDaily':
      return `Daily 퀘스트 ${target}개 완료`
    case 'completeDailyCount':
      return `Daily 퀘스트 ${target}개 완료`
    case 'completeQuestCategory':
      return `${CATEGORY_LABEL[card.category]} 퀘스트 ${target}개 완료`
    case 'completeGateAttempt':
      return '게이트 전투 도전 1회'
    case 'completeGateVictory':
      return '게이트 전투 승리 1회'
    case 'completeShadowExpedition':
      return '그림자 원정 1회 완료'
    case 'completeTowerAttempt':
    case 'completeTowerClear':
      return '비활성화된 도전'
    case 'openBox':
      return `보상 박스 ${target}개 개봉`
    case 'completeWorkoutAndStudy':
      return '운동 1개 & 학습 1개 완료'
    default:
      return '오늘 목표 수행'
  }
}

function isRetiredTowerChallengeCard(card: ChallengeCard): boolean {
  return card.category === 'tower' ||
    card.condition.type === 'completeTowerAttempt' ||
    card.condition.type === 'completeTowerClear'
}

export function ChallengeCardsPanel() {
  const cards = useGame(s => s.todayChallengeCards ?? [])
  const selectedIdsFromStore = useGame(s => s.selectedChallengeCardIds)
  const selectChallengeCards = useGame(s => s.selectChallengeCards)
  const [draftIds, setDraftIds] = useState<string[]>([])
  const [cardReveal, setCardReveal] = useState<'selected' | 'completed' | undefined>()
  const previousCompletedRef = useRef<number | undefined>(undefined)

  const visibleCards = cards.filter(card => !isRetiredTowerChallengeCard(card))
  const visibleCardIds = new Set(visibleCards.map(card => card.id))
  const selectedIds = (selectedIdsFromStore ?? []).filter(id => visibleCardIds.has(id))
  const selectedIdsKey = selectedIds.join(',')
  useEffect(() => {
    setDraftIds(selectedIds)
  }, [selectedIdsKey])

  const hasSelected = selectedIds.length > 0
  const selectedSet = new Set(hasSelected ? selectedIds : draftIds)
  const shownCards = hasSelected ? visibleCards.filter(card => selectedSet.has(card.id)) : visibleCards
  const completedCount = visibleCards.filter(card => selectedIds.includes(card.id) && card.status === 'completed').length
  const selectedCards = visibleCards.filter(card => selectedIds.includes(card.id))
  const pendingCount = Math.max(0, selectedCards.length - completedCount)
  const fullClearBonusReady = selectedCards.length === 3 && completedCount >= 3
  const draftReward = visibleCards
    .filter(card => selectedSet.has(card.id))
    .reduce((sum, card) => ({
      hunterXp: sum.hunterXp + card.reward.hunterXp,
      gold: sum.gold + (card.reward.gold ?? 0),
      shadowEssence: sum.shadowEssence + card.reward.shadowEssence,
      boxUpgradePoints: sum.boxUpgradePoints + card.reward.boxUpgradePoints,
    }), { hunterXp: 0, gold: 0, shadowEssence: 0, boxUpgradePoints: 0 })
  const nextActionText = !hasSelected
    ? draftIds.length === 3
      ? '세 장을 확정하여 오늘의 도전 카드를 최종 활성화하세요.'
      : `오늘 수행할 3장의 카드를 리스트에서 선택해 주세요. (${3 - draftIds.length}장 남음)`
    : pendingCount > 0
      ? `진행 중인 도전을 완수하면 보상과 오늘의 박스 강화를 획득합니다. (${pendingCount}장 진행 중)`
      : '오늘의 모든 보상 카드가 완료되어 보급 박스가 최대 강화되었습니다.'
  const cardRevealSteps: RevealStep[] = cardReveal === 'selected'
    ? [
        {
          title: 'CHALLENGE ACTIVATED',
          text: '오늘의 도전 카드가 활성화되었습니다.',
          subtext: '오늘 자정 전까지 목표 행동을 완료하여 박스를 강화하십시오.',
          durationMs: 900,
          tone: 'success',
          emphasis: true,
        },
      ]
    : cardReveal === 'completed'
      ? [
          {
            title: completedCount >= 3 ? 'FULL CLEAR BONUS' : 'CARD COMPLETED',
            text: completedCount >= 3 ? '도전 과제 완전 클리어 보너스 획득!' : '도전 과제를 완수하여 보상을 획득했습니다.',
            subtext: completedCount >= 3 ? '박스의 등급이 최고 수준으로 업그레이드됩니다.' : `완료 ${completedCount}/3 · 오늘의 박스 강화 점수 반영`,
            durationMs: 1000,
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
    selectChallengeCards(draftIds.filter(id => visibleCardIds.has(id)))
    setCardReveal('selected')
  }

  return (
    <div className="panel corner-bracket p-4 border-violet-500/20 bg-gradient-to-br from-violet-950/15 via-ink-950/65 to-ink-950 relative overflow-hidden">
      <div className="br" />
      <div className="absolute -left-20 -top-20 h-44 w-44 rounded-full bg-violet-500/5 blur-3xl" />
      <DramaticReveal
        isOpen={Boolean(cardReveal)}
        steps={cardRevealSteps}
        tone={cardReveal === 'selected' ? 'success' : completedCount >= 3 ? 'rank' : 'success'}
        position="modal"
        compact
        onComplete={() => setCardReveal(undefined)}
        onSkip={() => setCardReveal(undefined)}
      />
      
      {/* Panel Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            <h3 className="text-base font-black text-violet-50 tracking-wide">오늘의 도전 카드</h3>
          </div>
          <p className="mt-1 text-xs text-white/55 leading-relaxed">{nextActionText}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <div className="rounded-md border border-violet-400/30 bg-violet-950/55 px-3 py-1.5 text-xs font-black text-violet-200">
            {hasSelected ? `${completedCount} / 3 완료` : `${draftIds.length} / 3 선택됨`}
          </div>
          {!hasSelected && (
            <button
              type="button"
              onClick={confirmCards}
              disabled={draftIds.length !== 3}
              className={clsx(
                'min-h-9 rounded-md px-4 text-xs font-black transition flex items-center gap-1.5 shadow-glow',
                draftIds.length === 3 
                  ? 'border border-violet-400/50 bg-violet-500/20 text-white hover:bg-violet-500/30' 
                  : 'border border-slate-700 bg-slate-800 text-white/40 cursor-not-allowed'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              선택 확정
            </button>
          )}
        </div>
      </div>

      {/* Rewards HUD Summary */}
      <div className="mb-4 rounded-lg border border-slate-500/10 bg-black/35 p-3 flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-white/50 text-[10px] system-text tracking-wider mr-1">EXPECTED VALUE</span>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md border border-cyan-400/25 bg-cyan-400/8 px-2 py-0.5 text-cyan-200 font-bold">XP +{draftReward.hunterXp}</span>
          <span className="rounded-md border border-amber-400/25 bg-amber-400/8 px-2 py-0.5 text-amber-200 font-bold">Gold +{draftReward.gold}</span>
          <span className="rounded-md border border-emerald-400/25 bg-emerald-400/8 px-2 py-0.5 text-emerald-200 font-bold">그림자 정수 +{draftReward.shadowEssence}</span>
          <span className="rounded-md border border-amber-400/30 bg-amber-400/12 px-2 py-0.5 text-amber-300 font-bold flex items-center gap-1">
            <Box className="h-3 w-3" /> 박스 강화 +{draftReward.boxUpgradePoints}
          </span>
          {fullClearBonusReady && (
            <span className="rounded-md border border-purple-400/40 bg-purple-500/15 px-2 py-0.5 text-purple-200 font-black animate-pulse flex items-center gap-1">
              <Gift className="h-3 w-3" /> 올클리어 보너스 가동!
            </span>
          )}
        </div>
      </div>

      {/* Cards List Grid */}
      {visibleCards.length === 0 ? (
        <div className="rounded-md border border-violet-500/12 bg-ink-950/45 px-3 py-8 text-center text-sm text-white/40">
          오늘의 도전 카드를 집계 중입니다. 잠시만 기다려주세요...
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {shownCards.map(card => {
            const selected = selectedSet.has(card.id)
            const completed = card.status === 'completed'
            
            // 프리미엄 아우라/그로우 보정 클래스 설정
            let cardClass = ''
            if (completed) {
              cardClass = 'border-emerald-400/50 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.14),transparent_70%)] bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.18)] text-emerald-100 ring-2 ring-emerald-400/30'
            } else if (selected && hasSelected) {
              cardClass = 'border-cyan-400/40 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.12),transparent_70%)] bg-ink-900/65 ring-2 ring-cyan-400/30 text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,0.12)]'
            } else if (selected && !hasSelected) {
              cardClass = 'border-violet-400/40 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.12),transparent_70%)] bg-ink-900/65 ring-2 ring-violet-400/30 text-violet-100 shadow-[0_0_12px_rgba(139,92,246,0.12)]'
            } else if (card.difficulty === 'hard') {
              cardClass = 'border-amber-500/40 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.12),transparent_70%)] bg-amber-950/20 text-amber-100 hover:border-amber-400/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.12)] ring-1 ring-amber-500/15'
            } else {
              cardClass = DIFFICULTY_CLASS[card.difficulty] + ' border-slate-500/15 hover:border-white/20 hover:bg-slate-900/30'
            }

            if (!hasSelected && !selected && draftIds.length >= 3) {
              cardClass += ' opacity-40 scale-[0.98]'
            }

            return (
              <motion.button
                key={card.id}
                type="button"
                whileHover={{ y: hasSelected ? 0 : -2, scale: hasSelected ? 1 : 1.01 }}
                onClick={() => toggleDraft(card.id)}
                className={clsx(
                  'relative overflow-hidden min-h-[160px] rounded-xl border p-4 text-left transition duration-200 flex flex-col justify-between',
                  cardClass
                )}
              >
                {/* Glowing subtle spot */}
                <div className={clsx(
                  'absolute -right-6 -bottom-6 h-16 w-16 rounded-full blur-2xl opacity-15',
                  completed ? 'bg-emerald-400' : card.difficulty === 'hard' ? 'bg-amber-400' : 'bg-cyan-400'
                )} />

                <div>
                  {/* Category, Difficulty & State Headers */}
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className={clsx(
                        'rounded px-1.5 py-0.5 text-[8.5px] font-black tracking-wider',
                        card.difficulty === 'hard' 
                          ? 'bg-amber-950/65 border border-amber-500/40 text-amber-300' 
                          : 'bg-black/25 border border-white/5 text-white/50'
                      )}>
                        {DIFFICULTY_LABEL[card.difficulty]}
                      </span>
                      <span className="rounded bg-black/15 border border-white/5 px-1.5 py-0.5 text-[8.5px] font-bold text-white/45">
                        {CATEGORY_LABEL[card.category]}
                      </span>
                    </div>

                    <span className={clsx('rounded-full border px-2 py-0.5 text-[8.5px] font-bold tracking-tight shadow-sm', cardStateClass(card, selected))}>
                      {cardStateText(card)}
                    </span>
                  </div>

                  {/* Title & Goal */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="space-y-1 min-w-0">
                      <h4 className={clsx('text-sm font-black leading-snug truncate', completed ? 'text-emerald-50' : 'text-white')}>
                        {card.title}
                      </h4>
                      <p className="text-[10px] text-white/48 font-semibold flex items-center gap-1">
                        <span className="text-white/35">목표:</span>
                        <span className="truncate text-white/70">{conditionShortText(card)}</span>
                      </p>
                    </div>
                    <div className="shrink-0 mt-0.5">
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                      ) : selected ? (
                        <ShieldCheck className="h-5 w-5 text-cyan-300 animate-pulse" />
                      ) : (
                        <Circle className="h-5 w-5 text-white/20 group-hover:text-white/40" />
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-2 text-[11px] leading-relaxed text-white/55 line-clamp-2">
                    {card.description}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-500/10 flex items-center justify-between gap-2">
                  {/* Rewards Row */}
                  <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-[9.5px] text-white/60 font-semibold">
                    <span className="text-cyan-200">XP+{card.reward.hunterXp}</span>
                    <span className="text-amber-200">G+{card.reward.gold ?? 0}</span>
                    <span className="text-purple-200">그림자 정수 +{card.reward.shadowEssence}</span>
                  </div>

                  {/* Box Upgrade points chip */}
                  <div className={clsx(
                    'rounded px-1.5 py-0.5 text-[9.5px] font-black flex items-center gap-1 shrink-0',
                    completed 
                      ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 shadow-sm' 
                      : card.reward.boxUpgradePoints >= 3
                        ? 'bg-amber-950/50 border border-amber-500/40 text-amber-300'
                        : 'bg-cyan-950/50 border border-cyan-500/30 text-cyan-300'
                  )}>
                    {completed ? (
                      <>
                        <Gift className="h-3 w-3 shrink-0" />
                        보상에 반영됨 (+{card.reward.boxUpgradePoints})
                      </>
                    ) : (
                      <>
                        <Flame className="h-3 w-3 shrink-0 text-amber-400 animate-pulse" />
                        박스 강화 +{card.reward.boxUpgradePoints}
                      </>
                    )}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
