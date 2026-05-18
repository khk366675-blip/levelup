import clsx from 'clsx'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Box, Crown, Gift, Sparkles, TowerControl } from 'lucide-react'
import { useGame } from '../lib/store'
import type { BoxReward, BoxTier, RewardBox } from '../lib/types'
import { formatStatReward, todayKey } from '../lib/game'
import { DramaticReveal, type DramaticRevealTone, type RevealStep } from './DramaticReveal'

const TIER_LABEL: Record<BoxTier, string> = {
  normal: 'Normal',
  enhanced: 'Enhanced',
  superior: 'Superior',
  epic: 'Epic',
}

const TIER_CLASS: Record<BoxTier, string> = {
  normal: 'border-cyan-300/25 bg-cyan-400/8 text-cyan-100',
  enhanced: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  superior: 'border-violet-300/35 bg-violet-400/10 text-violet-100',
  epic: 'border-amber-300/45 bg-amber-400/12 text-amber-100 shadow-glow',
}

function getDisplayTier(box: RewardBox, upgradePoints: number): BoxTier {
  if (box.type !== 'daily' || box.status !== 'available' || !box.label.startsWith(todayKey())) {
    return box.tier
  }
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
    ...(reward.shadowEssence ? [`그림자 정수 +${reward.shadowEssence}`] : []),
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
          text: hasHighValueDrop(revealingBox.reward) ? '날카로운 빛이 잠깐 새어 나온다.' : '잠금 장치가 천천히 풀린다.',
          subtext: revealingBox.type === 'boss' ? '보스층의 잔향이 아직 남아 있습니다.' : '오늘의 도전 보정이 적용된 결과입니다.',
          durationMs: 820,
          tone: hasHighValueDrop(revealingBox.reward) ? 'rank' : revealTone,
        },
        {
          title: 'REVEAL',
          text: hasHighValueDrop(revealingBox.reward) ? '희귀한 기척이 모습을 드러냈다.' : '보상이 공개됩니다.',
          durationMs: 950,
          tone: hasHighValueDrop(revealingBox.reward) ? 'rank' : 'success',
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
                    'rounded-md border px-3 py-2 text-sm font-semibold',
                    hasHighValueDrop(revealingBox.reward)
                      ? 'border-amber-300/30 bg-amber-400/10 text-amber-100'
                      : 'border-white/10 bg-white/5 text-white/75',
                  )}
                >
                  {line}
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
      <div className="panel corner-bracket p-4 border-cyan-400/25 bg-cyan-500/5">
        <div className="br" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="system-text text-[11px] text-cyan-300/75">REWARD BOXES</div>
            <h3 className="text-lg font-bold text-cyan-50">박스 보상</h3>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] system-text text-white/55">
            열기 가능 {available.length}
          </div>
        </div>

        <div className="mb-3 rounded-md border border-amber-300/20 bg-amber-400/8 px-3 py-2 text-xs leading-relaxed text-amber-100/75">
          오늘의 박스는 열기 전 완료한 도전 카드 수에 따라 강화됩니다. 이미 연 박스에는 추가 강화가 적용되지 않습니다.
        </div>

        {available.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-ink-900/35 px-3 py-5 text-center text-sm text-white/45">
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
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/8 blur-2xl" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="truncate text-sm font-bold">{box.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px] system-text">
                        <span className="rounded border border-white/15 bg-black/15 px-1.5 py-0.5">{box.type}</span>
                        <span className="rounded border border-white/15 bg-black/15 px-1.5 py-0.5">{TIER_LABEL[tier]}</span>
                        {box.floor ? <span className="rounded border border-white/15 bg-black/15 px-1.5 py-0.5">{box.floor}층</span> : null}
                      </div>
                    </div>
                    <Box className="h-8 w-8 shrink-0 opacity-70" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenBox(box.id)}
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 text-sm font-bold text-white hover:bg-white/15 transition"
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
        <div className="panel corner-bracket p-4 border-white/10">
          <div className="br" />
          <div className="system-text mb-3 text-[11px] text-white/45">RECENT REVEALS</div>
          <div className="space-y-2">
            {recentOpened.map(box => (
              <div key={box.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-semibold text-white/80">{box.label}</div>
                  <div className="shrink-0 text-[10px] system-text text-white/40">{TIER_LABEL[box.tier]}</div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-white/55">
                  {formatReward(box.reward).map(line => (
                    <span key={line} className="rounded border border-white/10 bg-black/15 px-1.5 py-0.5">{line}</span>
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
