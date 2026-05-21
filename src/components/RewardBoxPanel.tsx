import clsx from 'clsx'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Box, CalendarCheck, Crown, Gem, Gift, PackageCheck, Sparkles, Ticket, TowerControl } from 'lucide-react'
import { useGame } from '../lib/store'
import type { BoxReward, BoxTier, RewardBox } from '../lib/types'
import { formatStatReward, todayKey } from '../lib/game'
import { getShadowDefinition } from '../lib/shadows'
import { DramaticReveal, type DramaticRevealTone, type RevealStep } from './DramaticReveal'

const TIER_LABEL: Record<BoxTier, string> = {
  normal: 'Normal',
  enhanced: 'Enhanced',
  superior: 'Superior',
  epic: 'Epic',
}

const TIER_CLASS: Record<BoxTier, string> = {
  normal:   'border-cyan-300/28  bg-cyan-400/8   text-cyan-100 rarity-frame-rare',
  enhanced: 'border-emerald-300/32 bg-emerald-400/9  text-emerald-100 rarity-frame-uncommon',
  superior: 'border-violet-300/40 bg-violet-400/10 text-violet-100 rarity-frame-epic',
  epic:     'border-amber-300/50  bg-amber-400/12  text-amber-100 boss-glow',
}

const BOX_TYPE_META: Record<RewardBox['type'], { label: string; short: string; description: string; chip: string }> = {
  daily: {
    label: '오늘의 보급',
    short: 'DAILY',
    description: '오늘 카드 완료분으로 열기 전 등급이 상승합니다.',
    chip: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
  },
  weekly: {
    label: '주간 보급',
    short: 'WEEKLY',
    description: '이번 주 도전 누적 보급입니다.',
    chip: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  },
  boss: {
    label: '보스 보급',
    short: 'BOSS',
    description: '탑 보스층 돌파 기록에서 회수한 상자입니다.',
    chip: 'border-violet-300/25 bg-violet-400/10 text-violet-100',
  },
}

function getDisplayTier(box: RewardBox, upgradePoints: number): BoxTier {
  if (box.type !== 'daily' || box.status !== 'available' || !box.label.startsWith(todayKey())) {
    return box.tier
  }
  if (upgradePoints >= 6) return 'epic'
  if (upgradePoints >= 4) return 'superior'
  if (upgradePoints >= 2) return 'enhanced'
  return 'normal'
}

function boxIcon(box: RewardBox) {
  if (box.type === 'boss') return TowerControl
  if (box.type === 'weekly') return Crown
  return Gift
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
    ...(reward.items ?? []).map(item => `${item.icon} ${item.name}`),
    ...(reward.consumables ?? []).map(item => `${item.icon} ${item.name}`),
  ]
}

function getRevealTone(box?: RewardBox): DramaticRevealTone {
  if (!box) return 'box'
  if (box.type === 'boss') return 'tower'
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
  const boxes = useGame(s => s.rewardBoxes ?? [])
  const cards = useGame(s => s.todayChallengeCards ?? [])
  const selectedIds = useGame(s => s.selectedChallengeCardIds ?? [])
  const openRewardBox = useGame(s => s.openRewardBox)

  const selectedSet = new Set(selectedIds)
  const upgradePoints = cards
    .filter(card => selectedSet.has(card.id) && card.status === 'completed')
    .reduce((sum, card) => sum + card.reward.boxUpgradePoints, 0)
  const available = boxes.filter(box => box.status === 'available')
  const recentOpened = boxes.filter(box => box.status === 'opened').slice(0, 4)
  const todayDailyAvailable = available.some(box => box.type === 'daily' && box.label.startsWith(todayKey()))
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
          text: revealingBox.type === 'boss' ? '탑의 금속 상자가 낮게 울린다.' : '상자 안쪽에서 빛이 번진다.',
          subtext: `${revealingBox.label} · ${TIER_LABEL[revealingBox.tier]}`,
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
          subtext: revealingBox.type === 'boss' ? '보스층의 잔향이 아직 남아 있습니다.' : '오늘의 도전 보정이 적용된 결과입니다.',
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
    <div className="space-y-4">
      <DramaticReveal
        isOpen={Boolean(revealingBox)}
        steps={revealSteps}
        tone={revealTone}
        position="modal"
        result={revealingBox && (
          <div>
            <div className="mb-3 text-center">
              <div className="system-text text-[10px] text-white/45">BOX CONTENTS</div>
              <div className="mt-1 text-lg font-black text-white">{revealingBox.label}</div>
            </div>
            <div className="grid gap-2">
              {revealGrowth.rank && (
                <div className="rounded-md border border-amber-300/35 bg-amber-400/12 px-3 py-2 text-sm font-black text-amber-100 shadow-glow">
                  {revealGrowth.rank}
                </div>
              )}
              {revealGrowth.level && (
                <div className="rounded-md border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-sm font-bold text-cyan-100">
                  {revealGrowth.level}
                </div>
              )}
              {revealRewardLines.map(line => (
                <div
                  key={line}
                  className={clsx(
                    'flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold',
                    hasHighValueDrop(revealingBox.reward) && !hasShadowSignalDrop(revealingBox.reward)
                      ? 'border-amber-300/30 bg-amber-400/10 text-amber-100'
                      : rewardLineClass(line),
                  )}
                >
                  <RewardLineIcon line={line} />
                  <span>{line}</span>
                </div>
              ))}
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
      <div className="panel corner-bracket border-cyan-300/12 bg-ink-950/60 p-3">
        <div className="br" />
        <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="rounded-md border border-cyan-300/20 bg-cyan-400/8 px-3 py-2">
            <div className="mb-1 flex items-center gap-1.5 system-text text-[10px] text-cyan-100/65">
              <CalendarCheck className="h-3.5 w-3.5" />
              TODAY LOOP
            </div>
            <div className="text-sm font-semibold leading-snug text-white/82">{nextLoopText}</div>
          </div>
          <div className="rounded-md border border-violet-300/18 bg-violet-400/8 px-3 py-2">
            <div className="system-text text-[9px] text-white/40">오늘 선택 카드</div>
            <div className="mt-1 text-base font-black text-violet-100">{selectedCardCount || selectedSet.size}/3</div>
            <div className="text-[10px] text-white/45">완료 {completedCardCount} · 박스 강화 +{upgradePoints}</div>
          </div>
          <div className="rounded-md border border-amber-300/18 bg-amber-400/8 px-3 py-2">
            <div className="system-text text-[9px] text-white/40">오늘 받을 수 있는 것</div>
            <div className="mt-1 text-base font-black text-amber-100">{available.length}</div>
            <div className="text-[10px] text-white/45">
              {todayDailyAvailable ? '일일 보급 대기' : available.length > 0 ? '보급 대기' : '열기 완료'}
            </div>
          </div>
        </div>
      </div>

      <div className="panel corner-bracket p-4 border-cyan-400/25 bg-cyan-500/5">
        <div className="br" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="system-text text-[11px] text-cyan-300/75">REWARD BOXES</div>
            <h3 className="text-lg font-bold text-cyan-50">박스 보상</h3>
          </div>
          <div className="rounded-md border border-cyan-300/12 bg-cyan-400/5 px-2.5 py-1 text-[10px] system-text text-white/55">
            열기 가능 {available.length}
          </div>
        </div>

        <div className="mb-3 grid gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-md border border-amber-300/20 bg-amber-400/8 px-3 py-2 leading-relaxed text-amber-100/75 sm:col-span-2">
            오늘의 박스는 열기 전 완료한 도전 카드 수에 따라 강화됩니다. 이미 연 박스에는 추가 강화가 적용되지 않습니다.
          </div>
          <div className="rounded-md border border-cyan-300/12 bg-cyan-400/5 px-3 py-2 text-white/55">
            <span className="system-text text-white/35">NEXT TIER</span>
            <div className="mt-1 font-semibold text-white/80">
              {upgradePoints >= 6 ? '3장 완전 달성으로 Epic 적용 중' : upgradePoints >= 4 ? 'Superior 적용 중 · +6에 Epic' : upgradePoints >= 2 ? 'Enhanced 적용 중 · +4에 Superior' : `+${Math.max(0, 2 - upgradePoints)} 강화점에 Enhanced`}
            </div>
          </div>
        </div>

        {available.length === 0 ? (
          <div className="rounded-md border border-cyan-300/12 bg-ink-900/35 px-3 py-5 text-center text-sm text-white/45">
            지금 열 수 있는 박스가 없습니다.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {available.map(box => {
              const tier = getDisplayTier(box, upgradePoints)
              const Icon = boxIcon(box)
              return (
                <motion.div
                  key={box.id}
                  whileHover={{ y: -2 }}
                  className={clsx('relative overflow-hidden rounded-lg border p-4', TIER_CLASS[tier])}
                >
                  {(tier === 'epic' || tier === 'superior') && (
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.12),transparent_55%)] shadow-mist-legendary" />
                  )}
                  {hasShadowSignalDrop(box.reward) && (
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(34,211,238,0.12),transparent_38%),radial-gradient(circle_at_82%_30%,rgba(168,85,247,0.12),transparent_40%)]" />
                  )}
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/8 blur-2xl" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={clsx('mb-2 inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] system-text', BOX_TYPE_META[box.type].chip)}>
                        <PackageCheck className="h-3 w-3" />
                        {BOX_TYPE_META[box.type].label}
                      </div>
                      <div className="mb-1 flex items-center gap-2">
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="truncate text-sm font-bold">{box.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px] system-text">
                        <span className="rounded border border-cyan-300/14 bg-black/15 px-1.5 py-0.5">{BOX_TYPE_META[box.type].short}</span>
                        <span className="rounded border border-cyan-300/14 bg-black/15 px-1.5 py-0.5">{TIER_LABEL[tier]}</span>
                        {box.floor ? <span className="rounded border border-cyan-300/14 bg-black/15 px-1.5 py-0.5">{box.floor}층</span> : null}
                      </div>
                    </div>
                    <Box className="h-8 w-8 shrink-0 opacity-70" />
                  </div>
                  <div className="relative mt-3 rounded-md border border-cyan-300/12 bg-black/15 px-3 py-2">
                    <div className="mb-1 text-[10px] system-text text-white/42">PREVIEW</div>
                    <div className="flex flex-wrap gap-1.5">
                      {previewRewardHints(box, tier).map(line => (
                        <span key={line} className="rounded border border-cyan-300/12 bg-cyan-400/5 px-1.5 py-0.5 text-[10px] text-white/65">
                          {line}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 text-[10px] leading-snug text-white/38">{BOX_TYPE_META[box.type].description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenBox(box.id)}
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-cyan-300/22 bg-cyan-400/10 text-sm font-bold text-cyan-50 hover:bg-cyan-400/15 transition"
                  >
                    <Sparkles className="h-4 w-4" />
                    열기
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {recentOpened.length > 0 && (
        <div className="panel corner-bracket p-4 border-cyan-300/12">
          <div className="br" />
          <div className="system-text mb-3 text-[11px] text-white/45">RECENT REVEALS</div>
          <div className="space-y-2">
            {recentOpened.map(box => (
              <div key={box.id} className="rounded-md border border-cyan-300/12 bg-cyan-400/5 p-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white/80">{box.label}</div>
                    <div className="text-[10px] system-text text-white/35">{BOX_TYPE_META[box.type].label}</div>
                  </div>
                  <div className="shrink-0 text-[10px] system-text text-white/40">{TIER_LABEL[box.tier]}</div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-white/55">
                  {formatReward(box.reward).map(line => (
                    <span key={line} className={clsx('inline-flex items-center gap-1 rounded border px-1.5 py-0.5', rewardLineClass(line))}>
                      <RewardLineIcon line={line} />
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
