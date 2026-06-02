import clsx from 'clsx'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Box, CalendarCheck, Crown, Gem, Gift, Sparkles, Ticket } from 'lucide-react'
import { useGame } from '../lib/store'
import type { BoxReward, BoxTier, RewardBox } from '../lib/types'
import { formatStatReward } from '../lib/game'
import { getShadowDefinition } from '../lib/shadows'
import { getItemDisplayName } from '../lib/retiredTowerUi'
import { DramaticReveal, type DramaticRevealTone, type RevealStep } from './DramaticReveal'
import { ChallengeCardsPanel } from './ChallengeCardsPanel'

const TIER_LABEL: Record<BoxTier, string> = {
  normal: 'Normal',
  enhanced: 'Enhanced',
  superior: 'Superior',
  epic: 'Epic',
}

const TIER_CLASS: Record<BoxTier, string> = {
  normal:   'border-cyan-500/28  bg-cyan-500/8   text-cyan-100 rarity-frame-rare',
  enhanced: 'border-emerald-500/32 bg-emerald-500/9  text-emerald-100 rarity-frame-uncommon',
  superior: 'border-violet-500/40 bg-violet-500/10 text-violet-100 rarity-frame-epic',
  epic:     'border-amber-500/50  bg-amber-500/12  text-amber-100 boss-glow',
}

const BOX_TYPE_META: Record<RewardBox['type'], { label: string; short: string; description: string; chip: string }> = {
  daily: {
    label: '오늘의 보급',
    short: 'DAILY',
    description: '오늘 카드 완료분으로 열기 전 등급이 상승합니다.',
    chip: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-100',
  },
  weekly: {
    label: '주간 보급',
    short: 'WEEKLY',
    description: '이번 주 도전 누적 보급입니다.',
    chip: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
  },
  boss: {
    label: '보스 보급',
    short: 'BOSS',
    description: '상위 보스 전리품에서 회수한 상자입니다.',
    chip: 'border-violet-500/25 bg-violet-500/10 text-violet-100',
  },
}

function isActiveDailyRouteBox(box: RewardBox, routeDate?: string): boolean {
  if (box.type !== 'daily' || box.source !== 'daily_login') return false
  return routeDate ? box.label.startsWith(routeDate) : true
}

function getDisplayTier(box: RewardBox, upgradePoints: number, routeDate?: string): BoxTier {
  if (box.status !== 'available' || !isActiveDailyRouteBox(box, routeDate)) {
    return box.tier
  }
  if (upgradePoints >= 6) return 'epic'
  if (upgradePoints >= 4) return 'superior'
  if (upgradePoints >= 2) return 'enhanced'
  return 'normal'
}

function boxIcon(box: RewardBox) {
  if (box.type === 'boss') return Crown
  if (box.type === 'weekly') return Crown
  return Gift
}

function getBoxDisplayLabel(box: RewardBox): string {
  if (box.source === 'tower_boss') return '보스 전리품 상자'
  return box.label
}

function formatReward(reward?: BoxReward): string[] {
  if (!reward) return []
  return [
    ...(reward.hunterXp ? [`XP +${reward.hunterXp}`] : []),
    ...(reward.gold ? [`Gold +${reward.gold}`] : []),
    ...(reward.shadowEssence ? [`그림자 정수 +${reward.shadowEssence}`] : []),
    ...(reward.shadowSummonTickets ?? []).map(ticket => `소환권: ${ticket.label}`),
    ...Object.entries(reward.shadowSummonShards ?? {}).map(([type, amount]) => `소환 조각: ${type} +${amount}`),
    ...(reward.shadowFragments ?? []).map(fragment => {
      const definition = getShadowDefinition(fragment.definitionId)
      const safeName = definition?.hiddenUntilObtained ? '봉인된 그림자' : definition?.name ?? fragment.definitionId
      return `조각: ${safeName} +${fragment.amount}`
    }),
    ...Object.entries(reward.statRewards ?? {}).map(([stat, value]) => `${stat} ${formatStatReward(value ?? 0)}`),
    ...(reward.items ?? []).map(item => `${item.icon} ${getItemDisplayName(item)}`),
    ...(reward.consumables ?? []).map(item => `${item.icon} ${getItemDisplayName(item)}`),
  ]
}

function getRevealTone(box?: RewardBox): DramaticRevealTone {
  if (!box) return 'box'
  if (box.type === 'boss') return 'box'
  if (box.tier === 'epic' || box.tier === 'superior') return 'rank'
  return 'box'
}

function hasHighValueDrop(reward?: BoxReward): boolean {
  return Boolean(reward?.items?.some(item => item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary'))
}

function hasShadowSignalDrop(reward?: BoxReward): boolean {
  return Boolean(
    reward?.shadowSummonTickets?.length ||
    Object.keys(reward?.shadowSummonShards ?? {}).length ||
    reward?.shadowFragments?.length ||
    reward?.shadowEssence,
  )
}

function rewardLineClass(line: string): string {
  if (line.startsWith('소환권:')) return 'border-cyan-300/35 bg-cyan-400/12 text-cyan-100 shadow-glow'
  if (line.startsWith('소환 조각:') || line.startsWith('조각:')) return 'border-purple-300/35 bg-purple-400/12 text-purple-100'
  if (line.startsWith('그림자 정수')) return 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
  if (line.startsWith('Gold')) return 'border-amber-300/30 bg-amber-400/10 text-amber-100'
  return 'border-slate-500/18 bg-slate-400/6 text-white/72'
}

function RewardLineIcon({ line }: { line: string }) {
  if (line.startsWith('소환권:')) return <Ticket className="h-3.5 w-3.5 shrink-0 text-cyan-200" />
  if (line.startsWith('소환 조각:') || line.startsWith('조각:') || line.startsWith('그림자 정수')) {
    return <Gem className="h-3.5 w-3.5 shrink-0 text-purple-200" />
  }
  return <Sparkles className="h-3.5 w-3.5 shrink-0 text-white/45" />
}

function previewRewardHints(box: RewardBox, tier: BoxTier): string[] {
  const tierBonus = tier === 'normal' ? undefined : `${TIER_LABEL[tier]} 보정`
  const base = box.type === 'boss'
    ? ['XP/Gold/정수', '장비/소모품', '그림자 신호']
    : box.type === 'weekly'
      ? ['XP/Gold/정수', '스탯/아이템', '그림자 신호']
      : ['XP/Gold/정수', '소량 스탯', '낮은 확률 신호']
  return tierBonus ? [tierBonus, ...base] : base
}

export function RewardBoxPanel() {
  const [revealingBox, setRevealingBox] = useState<RewardBox | undefined>()
  const [revealGrowth, setRevealGrowth] = useState<{ level?: string; rank?: string }>({})
  const [historyExpanded, setHistoryExpanded] = useState(false)

  const boxes = useGame(s => s.rewardBoxes ?? [])
  const cards = useGame(s => s.todayChallengeCards ?? [])
  const selectedIds = useGame(s => s.selectedChallengeCardIds ?? [])
  const dailyRouteDate = useGame(s => s.lastDailyBoxDate ?? s.lastChallengeCardDate)
  const openRewardBox = useGame(s => s.openRewardBox)

  const selectedSet = new Set(selectedIds)
  const upgradePoints = cards
    .filter(card => selectedSet.has(card.id) && card.status === 'completed')
    .reduce((sum, card) => sum + card.reward.boxUpgradePoints, 0)
  const available = boxes.filter(box => box.status === 'available')
  const recentOpened = boxes.filter(box => box.status === 'opened').slice(0, 10)
  const todayDailyBox = available.find(box => isActiveDailyRouteBox(box, dailyRouteDate))
  const otherBoxes = available.filter(box => box.id !== todayDailyBox?.id)
  const todayDailyAvailable = Boolean(todayDailyBox)
  const completedCardCount = cards.filter(card => selectedSet.has(card.id) && card.status === 'completed').length
  const selectedCardCount = selectedIds.length

  const nextLoopText = selectedCardCount === 0
    ? '카드 3장을 먼저 고르면 오늘 박스 강화 루프가 시작됩니다.'
    : completedCardCount < selectedCardCount
      ? `선택 카드 ${selectedCardCount - completedCardCount}장을 더 완료하면 박스 등급이 올라갑니다.`
      : todayDailyAvailable
        ? '오늘 박스를 열어 카드 보정을 회수하세요.'
        : available.length > 0
          ? '대기 중인 보급을 열어 보상을 정리하세요.'
          : '오늘 보급 루프가 정리되었습니다.'

  const revealTone = getRevealTone(revealingBox)
  const revealRewardLines = formatReward(revealingBox?.reward)
  const revealSteps: RevealStep[] = revealingBox
    ? [
        {
          title: revealingBox.type === 'boss' ? 'BOSS BOX' : 'REWARD BOX',
          text: revealingBox.type === 'boss' ? '보스 전리품 상자가 낮게 울린다.' : '상자 안쪽에서 빛이 번진다.',
          subtext: `${getBoxDisplayLabel(revealingBox)} · ${TIER_LABEL[revealingBox.tier]}`,
          durationMs: 780,
          tone: revealTone,
        },
        {
          title: 'SIGNAL',
          text: hasShadowSignalDrop(revealingBox.reward)
            ? '그림자 안개가 보상 표식 사이로 번진다.'
            : hasHighValueDrop(revealingBox.reward)
              ? '날카로운 빛이 잠깐 새어 나온다.'
              : '잠금 장치가 천천히 풀린다.',
          subtext: revealingBox.type === 'boss' ? '보스전의 잔향이 아직 남아 있습니다.' : '오늘의 도전 보정이 적용된 결과입니다.',
          durationMs: 820,
          tone: hasShadowSignalDrop(revealingBox.reward) ? 'shadow' : hasHighValueDrop(revealingBox.reward) ? 'rank' : revealTone,
        },
        {
          title: 'REVEAL',
          text: hasShadowSignalDrop(revealingBox.reward)
            ? '군단으로 이어지는 보상이 기록되었다.'
            : hasHighValueDrop(revealingBox.reward)
              ? '희귀한 기척이 모습을 드러냈다.'
              : '보상이 공개됩니다.',
          durationMs: 950,
          tone: hasShadowSignalDrop(revealingBox.reward) ? 'shadow' : hasHighValueDrop(revealingBox.reward) ? 'rank' : 'success',
          emphasis: true,
        },
      ]
    : []

  const handleOpenBox = (boxId: string) => {
    const before = useGame.getState().hunter
    openRewardBox(boxId)
    const afterState = useGame.getState()
    const after = afterState.hunter
    const opened = afterState.rewardBoxes?.find(box => box.id === boxId)
    if (opened?.status === 'opened') {
      setRevealGrowth({
        level: after.level > before.level ? `LEVEL ${before.level} -> ${after.level}` : undefined,
        rank: after.rank !== before.rank ? `RANK ${before.rank} -> ${after.rank}` : undefined,
      })
      setRevealingBox(opened)
    }
  }

  return (
    <div className="space-y-5">
      <DramaticReveal
        isOpen={Boolean(revealingBox)}
        steps={revealSteps}
        tone={revealTone}
        position="modal"
        result={revealingBox && (
          <div>
            <div className="mb-4 text-center">
              <div className="system-text text-[10px] text-cyan-300 font-black tracking-widest animate-pulse">SUPPLY RECEIVED</div>
              <div className="mt-1 text-xl font-black text-white">{getBoxDisplayLabel(revealingBox)}</div>
            </div>
            
            <div className="space-y-3">
              {(revealGrowth.rank || revealGrowth.level) && (
                <div className="grid grid-cols-2 gap-2">
                  {revealGrowth.rank && (
                    <div className="rounded-md border border-amber-300/35 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.15),transparent_60%)] bg-amber-400/10 px-3 py-2 text-xs font-black text-amber-100 text-center shadow-glow animate-bounce">
                      👑 {revealGrowth.rank}
                    </div>
                  )}
                  {revealGrowth.level && (
                    <div className="rounded-md border border-cyan-300/25 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_60%)] bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100 text-center animate-pulse">
                      ⚡ {revealGrowth.level}
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                {revealRewardLines.map(line => {
                  const isHigh = line.includes('레전더리') || line.includes('Legendary') || line.includes('에픽') || line.includes('Epic')
                  const isShard = line.startsWith('소환 조각:') || line.startsWith('조각:')
                  const isTicket = line.startsWith('소환권:')
                  
                  return (
                    <motion.div
                      key={line}
                      whileHover={{ scale: 1.02, y: -1 }}
                      className={clsx(
                        'flex flex-col justify-between rounded-lg border p-3 text-left relative overflow-hidden transition-shadow min-h-16',
                        isHigh
                          ? 'border-amber-400/40 bg-amber-400/8 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : isTicket
                            ? 'border-cyan-400/35 bg-cyan-400/8 text-cyan-100'
                            : isShard
                              ? 'border-purple-400/35 bg-purple-400/8 text-purple-100'
                              : 'border-slate-500/18 bg-slate-900/60 text-white/80'
                      )}
                    >
                      <div className="absolute -right-4 -bottom-4 h-12 w-12 rounded-full bg-white/5 blur-xl" />
                      
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] system-text text-white/40 font-bold">
                          {isHigh ? 'PREMIUM DROP' : isTicket ? 'TICKET' : isShard ? 'FRAGMENT' : 'SUPPLY'}
                        </span>
                        <RewardLineIcon line={line} />
                      </div>
                      <div className="text-xs font-black truncate leading-tight mt-1" title={line}>
                        {line}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
        onComplete={() => {
          setRevealingBox(undefined)
          setRevealGrowth({})
        }}
        onSkip={() => {
          setRevealingBox(undefined)
          setRevealGrowth({})
        }}
      />

      {/* 1. 오늘의 보상 루프 (Progress Stepper) */}
      <div className="panel corner-bracket border-cyan-300/20 bg-ink-950/75 p-4 sm:p-5 relative overflow-hidden">
        <div className="br" />
        <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
        
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <div className="flex items-center gap-1.5 system-text text-[10px] text-cyan-400 font-extrabold tracking-wider">
              <CalendarCheck className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              오늘의 보상 루프
            </div>
            <div className="mt-1 text-xs sm:text-sm font-bold text-white/90 leading-snug">{nextLoopText}</div>
          </div>
          
          <div className="text-right">
            {completedCardCount === 3 && upgradePoints >= 6 ? (
              <span className="inline-flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-300 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                <Sparkles className="h-3 w-3" /> 최대 강화 완료 (Epic)
              </span>
            ) : (
              <span className="text-[10px] font-bold text-white/50">
                {upgradePoints < 2
                  ? `다음 강화(Enhanced)까지 강화 포인트 ${2 - upgradePoints}점 필요`
                  : upgradePoints < 4
                    ? `다음 강화(Superior)까지 강화 포인트 ${4 - upgradePoints}점 필요`
                    : `다음 강화(Epic)까지 강화 포인트 ${6 - upgradePoints}점 필요`}
              </span>
            )}
          </div>
        </div>

        {/* Stepper Flow Layout */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
          {/* Connector Line for PC */}
          <div className="absolute left-6 right-6 top-[22px] hidden h-[2px] bg-slate-800 md:block z-0">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 via-amber-500 to-cyan-500 transition-all duration-500"
              style={{
                width: completedCardCount >= 3
                  ? '100%'
                  : selectedCardCount === 3
                    ? '66%'
                    : selectedCardCount > 0
                      ? '33%'
                      : '0%'
              }}
            />
          </div>

          {/* Step 1 */}
          <div className="relative z-10 flex flex-row md:flex-col items-center gap-3 md:gap-2 md:w-1/3">
            <div className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300 font-mono text-xs font-bold",
              selectedCardCount === 3
                ? "border-violet-400 bg-violet-950 text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                : selectedCardCount > 0
                  ? "border-violet-500/50 bg-violet-950/50 text-violet-300/80"
                  : "border-slate-700 bg-slate-900 text-white/40"
            )}>
              {selectedCardCount === 3 ? "✓" : "01"}
            </div>
            <div className="text-left md:text-center">
              <div className="text-xs font-bold text-white">도전 카드 선택</div>
              <div className="mt-0.5 text-[10px] text-white/45">{selectedCardCount}/3 카드 선택됨</div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-row md:flex-col items-center gap-3 md:gap-2 md:w-1/3">
            <div className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300 font-mono text-xs font-bold",
              completedCardCount === 3
                ? "border-amber-400 bg-amber-950 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                : completedCardCount > 0
                  ? "border-amber-500/50 bg-amber-950/50 text-amber-300/80"
                  : "border-slate-700 bg-slate-900 text-white/40"
            )}>
              {completedCardCount === 3 ? "✓" : "02"}
            </div>
            <div className="text-left md:text-center">
              <div className="text-xs font-bold text-white">도전 과제 달성</div>
              <div className="mt-0.5 text-[10px] text-white/45">{completedCardCount}/3 완료</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-row md:flex-col items-center gap-3 md:gap-2 md:w-1/3">
            <div className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300 font-mono text-[10px] font-bold uppercase",
              todayDailyAvailable
                ? "border-cyan-400 bg-cyan-950 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.4)] animate-pulse"
                : available.length > 0
                  ? "border-cyan-500/50 bg-cyan-950/50 text-cyan-300/80"
                  : "border-slate-700 bg-slate-900 text-white/40"
            )}>
              {todayDailyAvailable ? "READY" : "03"}
            </div>
            <div className="text-left md:text-center">
              <div className="text-xs font-bold text-white">일일 보급 개봉</div>
              <div className="mt-0.5 text-[10px] text-white/45">
                {todayDailyAvailable
                  ? `${TIER_LABEL[getDisplayTier(todayDailyBox!, upgradePoints, dailyRouteDate)]} 등급 대기`
                  : available.length > 0
                    ? "박스 개봉 대기 중"
                    : "대기 박스 없음"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 오늘의 보상 박스 Hero 영역 */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-400/25 bg-gradient-to-br from-cyan-950/20 via-ink-950/80 to-ink-950 p-5 md:p-6 shadow-glow">
        <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        
        {todayDailyBox ? (() => {
          const tier = getDisplayTier(todayDailyBox, upgradePoints, dailyRouteDate)
          const Icon = boxIcon(todayDailyBox)
          const dropHints = previewRewardHints(todayDailyBox, tier)
          
          return (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              {/* Left Column: Big Premium Box Visual */}
              <div className="flex items-center justify-center shrink-0 self-center md:self-auto w-32 h-32 md:w-36 md:h-36 relative group">
                <div className={clsx(
                  "absolute inset-0 rounded-full blur-xl opacity-25 group-hover:scale-110 transition-transform duration-300",
                  tier === 'epic' ? 'bg-amber-400' : tier === 'superior' ? 'bg-purple-500' : 'bg-cyan-500'
                )} />
                <div className="absolute inset-0 border border-dashed border-cyan-500/35 rounded-full animate-spin opacity-40 pointer-events-none" />
                
                <div className={clsx(
                  "relative flex h-24 w-24 items-center justify-center rounded-2xl border-2 shadow-2xl transition-transform duration-500 group-hover:scale-105",
                  TIER_CLASS[tier]
                )}>
                  <div className="absolute inset-1.5 rounded-lg border border-white/5 bg-black/10" />
                  <Box className={clsx(
                    "relative h-12 w-12 text-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]",
                    tier === 'epic' && "text-amber-200 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse",
                    tier === 'superior' && "text-purple-200 drop-shadow-[0_0_12px_rgba(167,139,250,0.5)]"
                  )} />
                  <Icon className="absolute top-2 right-2 h-4 w-4 text-white/50" />
                </div>
              </div>

              {/* Middle Column: Details / Descriptions */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="rounded bg-cyan-950 border border-cyan-400/30 px-2 py-0.5 text-[9px] font-black text-cyan-300 tracking-wider">
                    TODAY'S SUPPLY
                  </span>
                  <span className={clsx(
                    "rounded px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border",
                    tier === 'epic' ? 'border-amber-400 bg-amber-950 text-amber-300' :
                    tier === 'superior' ? 'border-purple-400 bg-purple-950 text-purple-300' :
                    tier === 'enhanced' ? 'border-emerald-400 bg-emerald-950 text-emerald-300' :
                    'border-cyan-400 bg-cyan-950 text-cyan-300'
                  )}>
                    {TIER_LABEL[tier]} 등급
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {todayDailyBox.label}
                </h3>
                
                <p className="mt-1.5 text-xs text-white/55 leading-relaxed">
                  오늘 도전 카드 수행 실적에 따라 보상이 강화됩니다. 현재 보급 상자가 최대 등급까지 강화 준비를 마쳤습니다.
                </p>

                {/* Drop Previews */}
                <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold text-white/40 uppercase mr-1">예상 보상:</span>
                  {dropHints.map(hint => (
                    <span key={hint} className="rounded border border-slate-500/10 bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                      {hint}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column: Cards & Reveal CTA Button */}
              <div className="flex flex-col justify-between items-stretch md:items-end gap-3 shrink-0 self-stretch md:self-auto min-w-[150px] border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-5">
                <div className="text-left md:text-right space-y-1">
                  <div className="text-[10px] system-text text-white/40">SUPPLY STATS</div>
                  <div className="text-xs font-bold text-white flex md:justify-end gap-1.5">
                    <span>도전 카드:</span>
                    <span className="text-cyan-300">{completedCardCount} / 3 완료</span>
                  </div>
                  <div className="text-xs font-bold text-white flex md:justify-end gap-1.5">
                    <span>박스 강화:</span>
                    <span className="text-amber-300">+{upgradePoints} 강화</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenBox(todayDailyBox.id)}
                  className={clsx(
                    "relative flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border font-black text-sm transition-all duration-300 shadow-glow select-none",
                    tier === 'epic'
                      ? "border-amber-400 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 hover:text-white"
                      : tier === 'superior'
                        ? "border-purple-400 bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 hover:text-white"
                        : "border-cyan-400 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 hover:text-white"
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  지금 열기
                </button>
              </div>
            </div>
          )
        })() : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            {/* Completed Box State */}
            <div className="flex items-center justify-center shrink-0 self-center md:self-auto w-32 h-32 md:w-36 md:h-36 relative">
              <div className="absolute inset-0 border border-dashed border-white/10 rounded-full pointer-events-none" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-white/30">
                <Box className="h-10 w-10 text-white/20" />
                <span className="absolute bottom-1.5 rounded bg-black/50 px-1 py-0.5 text-[8px] font-bold text-white/40">
                  OPENED
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded bg-slate-900 border border-slate-700 px-2 py-0.5 text-[9px] font-black text-white/40 tracking-wider mb-2">
                오늘의 보급 완료
              </div>
              <h3 className="text-base sm:text-lg font-black text-white/50 leading-tight">
                일일 보급 상자 수령 완료
              </h3>
              <p className="mt-1 text-xs text-white/45 leading-relaxed">
                오늘의 도전 보상이 이미 개봉되어 반영되었습니다. 내일 자정 이후에 새로운 일일 보급 박스가 활성화됩니다.
              </p>
              <div className="mt-3 text-[10px] font-semibold text-cyan-400 bg-cyan-950/20 border border-cyan-800/20 rounded px-2.5 py-1 inline-block">
                💡 획득한 골드는 상점에서 장비 소환 및 다양한 아이템 구매에 요긴하게 사용됩니다.
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto md:pl-5 md:border-l border-white/5">
              <button
                type="button"
                disabled
                className="flex min-h-12 w-full md:w-40 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 text-sm font-bold text-white/30 cursor-not-allowed"
              >
                수령 완료
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 기타 보급 상자 (오늘의 일일 박스 외) */}
      {otherBoxes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 system-text text-[10px] text-white/45 font-extrabold uppercase tracking-wider">
            <Gift className="h-3.5 w-3.5" /> 대기 중인 기타 보급 상자
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherBoxes.map(box => {
              const tier = box.tier
              const Icon = boxIcon(box)
              const dropHints = previewRewardHints(box, tier)
              
              return (
                <motion.div
                  key={box.id}
                  whileHover={{ y: -2 }}
                  className={clsx('relative overflow-hidden rounded-xl border p-4 flex flex-col justify-between min-h-[150px]', TIER_CLASS[tier])}
                >
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/5 blur-xl pointer-events-none" />
                  
                  <div>
                    <div className="mb-2 flex items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="h-4 w-4 shrink-0 text-white/70" />
                          <span className="truncate text-xs font-bold text-white">{getBoxDisplayLabel(box)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 text-[9px] system-text">
                          <span className={clsx('rounded border px-1.5 py-0.2', BOX_TYPE_META[box.type].chip)}>
                            {BOX_TYPE_META[box.type].label}
                          </span>
                          {box.floor && box.source !== 'tower_boss' ? <span className="rounded border border-white/10 bg-black/15 px-1.5 py-0.2">{box.floor}층</span> : null}
                        </div>
                      </div>
                      <Box className="h-7 w-7 shrink-0 text-white/30" />
                    </div>
                    
                    <p className="text-[10px] leading-relaxed text-white/60">
                      {dropHints.slice(0, 3).join(' · ')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenBox(box.id)}
                    className="mt-3 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/10 text-xs font-bold text-white hover:bg-white/15 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    열기
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. 오늘의 도전 카드 */}
      <ChallengeCardsPanel />

      {/* 4. 최근 보상 기록 compact화 */}
      {recentOpened.length > 0 && (() => {
        const shownHistory = historyExpanded ? recentOpened : recentOpened.slice(0, 3)
        
        return (
          <div className="panel corner-bracket p-4 border-cyan-300/12 bg-ink-950/30">
            <div className="br" />
            <div className="mb-3 flex items-center justify-between">
              <span className="system-text text-[10px] text-white/40 font-extrabold uppercase tracking-wider">
                RECENT REVEALS
              </span>
              <span className="text-[10px] text-white/30">
                개봉 기록 {recentOpened.length}개
              </span>
            </div>

            <div className="space-y-2">
              {shownHistory.map(box => {
                const dropLines = formatReward(box.reward)
                
                return (
                  <div 
                    key={box.id} 
                    className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 rounded-lg border border-slate-500/10 bg-black/20 p-2.5 text-xs transition hover:border-white/10"
                  >
                    {/* Left: Metadata one-liner */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span className="font-bold text-white/80">{getBoxDisplayLabel(box)}</span>
                      <span className={clsx('rounded border px-1.5 py-0.2 text-[9px] system-text', BOX_TYPE_META[box.type].chip)}>
                        {BOX_TYPE_META[box.type].short}
                      </span>
                      <span className="rounded border border-cyan-300/18 bg-black/15 px-1.5 py-0.2 text-[9px] system-text text-white/45">
                        {TIER_LABEL[box.tier]}
                      </span>
                    </div>

                    {/* Right: Compact Reward Drops Row */}
                    <div className="flex flex-wrap gap-1 items-center md:justify-end overflow-hidden">
                      {dropLines.slice(0, 4).map(line => (
                        <span key={line} className={clsx('inline-flex items-center gap-1 rounded border px-1.5 py-0.2 text-[10px]', rewardLineClass(line))}>
                          <RewardLineIcon line={line} />
                          {line}
                        </span>
                      ))}
                      {dropLines.length > 4 && (
                        <span className="rounded border border-white/5 bg-slate-800 px-1 py-0.2 text-[8px] text-white/40 font-bold">
                          +{dropLines.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Toggle Button */}
            {recentOpened.length > 3 && (
              <button
                type="button"
                onClick={() => setHistoryExpanded(!historyExpanded)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-white/5 py-1.5 text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white/80 transition"
              >
                {historyExpanded ? (
                  <>지난 개봉 기록 접기 ▴</>
                ) : (
                  <>지난 개봉 기록 더보기 ▾</>
                )}
              </button>
            )}
          </div>
        )
      })()}
    </div>
  )
}
