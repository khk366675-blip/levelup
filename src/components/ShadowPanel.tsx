import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Eclipse, Lock, Shield, Star, Swords, X } from 'lucide-react'
import { useGame } from '../lib/store'
import { ShadowCard as VisualShadowCard } from './shadows/ShadowCard'
import { ShadowExpeditionPanel } from './shadows/ShadowExpeditionPanel'
import { ShadowPortrait } from './shadows/ShadowPortrait'
import { DramaticReveal, type RevealStep } from './DramaticReveal'
import {
  SHADOW_DEFINITIONS,
  SHADOW_RANK_LABEL,
  SHADOW_RARITY_LABEL,
  SHADOW_RARITY_ORDER,
  SHADOW_ROLE_LABEL,
  canEvolveShadow,
  formatShadowEffect,
  getEquippedShadows,
  getShadowAbsorbMaterialCount,
  getShadowDefinition,
  getShadowEffects,
  getShadowMaxLevel,
  getShadowSlotCount,
  getShadowXpForNextLevel,
  MAX_SHADOW_ENHANCEMENT_LEVEL,
  SHADOW_DECOMPOSE_ESSENCE,
} from '../lib/shadows'
import type { OwnedShadow, ShadowRole } from '../lib/types'

type FilterKey = 'all' | 'normal' | 'gate_named' | 'achievement_named' | ShadowRole
type SortKey = 'obtained' | 'rarity' | 'rank' | 'name' | 'enhancement' | 'favorite' | 'locked'

const rarityStyle: Record<string, string> = {
  common: 'text-zinc-200 border-zinc-500/35 bg-zinc-500/10',
  uncommon: 'text-emerald-200 border-emerald-400/35 bg-emerald-400/10',
  rare: 'text-cyan-200 border-cyan-400/40 bg-cyan-400/10',
  epic: 'text-purple-200 border-purple-400/45 bg-purple-400/10',
  legendary: 'text-amber-200 border-amber-400/55 bg-amber-400/10',
}

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'normal', label: '일반' },
  { key: 'gate_named', label: '게이트 네임드' },
  { key: 'achievement_named', label: '성취 네임드' },
  { key: 'assault', label: '공격형' },
  { key: 'guard', label: '방어형' },
  { key: 'scout', label: '정찰형' },
  { key: 'analyst', label: '분석형' },
  { key: 'support', label: '지원형' },
  { key: 'hunter', label: '사냥형' },
]

const sourceText = (shadow: OwnedShadow): string => {
  const def = getShadowDefinition(shadow.definitionId)
  if (shadow.isAchievementNamed) return def?.unlockConditionText ?? '현실 성취'
  if (shadow.isGateNamed) return def?.sourceGateId ?? '게이트 네임드'
  return def?.sourceGateRank ? `${def.sourceGateRank}급 게이트 추출` : '게이트 추출'
}

const sortShadows = (shadows: OwnedShadow[], sort: SortKey, equippedIds: string[]): OwnedShadow[] => {
  const rarityScore = (shadow: OwnedShadow) => SHADOW_RARITY_ORDER.indexOf(shadow.rarity)
  const rankScore = (shadow: OwnedShadow) => ['lesser', 'soldier', 'elite', 'knight', 'marshal', 'monarch', 'named'].indexOf(shadow.rank)
  const equippedSet = new Set(equippedIds)
  const priority = (s: OwnedShadow): number => {
    if (sort === 'rarity') return rarityScore(s)
    if (sort === 'rank') return rankScore(s)
    if (sort === 'name') return 0
    if (sort === 'enhancement') return s.enhancementLevel ?? 0
    if (sort === 'favorite') return (s.isFavorite ? 1 : 0)
    if (sort === 'locked') return (s.isLocked ? 1 : 0)
    return 0
  }
  return [...shadows].sort((a, b) => {
    // explicit sort override
    if (sort === 'rarity') return rarityScore(b) - rarityScore(a)
    if (sort === 'rank') return rankScore(b) - rankScore(a)
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'enhancement') return (b.enhancementLevel ?? 0) - (a.enhancementLevel ?? 0)
    if (sort === 'favorite') return Number(b.isFavorite) - Number(a.isFavorite)
    if (sort === 'locked') return Number(b.isLocked) - Number(a.isLocked)
    // default composite: equipped > favorite > locked > rarity > enhancement > obtained
    const aEquip = equippedSet.has(a.instanceId) ? 1 : 0
    const bEquip = equippedSet.has(b.instanceId) ? 1 : 0
    if (aEquip !== bEquip) return bEquip - aEquip
    const aFav = a.isFavorite ? 1 : 0
    const bFav = b.isFavorite ? 1 : 0
    if (aFav !== bFav) return bFav - aFav
    const aLock = a.isLocked ? 1 : 0
    const bLock = b.isLocked ? 1 : 0
    if (aLock !== bLock) return bLock - aLock
    const aRar = rarityScore(b) - rarityScore(a)
    if (aRar !== 0) return aRar
    const aEnh = (b.enhancementLevel ?? 0) - (a.enhancementLevel ?? 0)
    if (aEnh !== 0) return aEnh
    return new Date(b.obtainedAt).getTime() - new Date(a.obtainedAt).getTime()
  })
}

function ShadowCard({
  shadow,
  equipped,
  canEquip,
  onEquip,
  onUnequip,
  materialCount,
  onAbsorb,
  onDecompose,
  onToggleLock,
  onToggleFavorite,
  onEvolve,
  shadowEssence,
}: {
  shadow: OwnedShadow
  equipped: boolean
  canEquip: boolean
  onEquip: () => void
  onUnequip: () => void
  materialCount: number
  onAbsorb: () => void
  onDecompose: () => void
  onToggleLock: () => void
  onToggleFavorite: () => void
  onEvolve: () => void
  shadowEssence: number
}) {
  const effects = getShadowEffects(shadow).map(formatShadowEffect)
  const level = shadow.level ?? 1
  const maxLevel = getShadowMaxLevel(shadow)
  const xp = shadow.xp ?? 0
  const xpNeeded = getShadowXpForNextLevel(level)
  const xpPct = level >= maxLevel ? 100 : Math.min(100, Math.round((xp / xpNeeded) * 100))
  const evolutionCheck = canEvolveShadow(shadow, shadowEssence)
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`panel corner-bracket p-4 ${rarityStyle[shadow.rarity]} ${equipped ? 'ring-2 ring-amber-300/40' : ''}`}
    >
      <div className="br" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] system-text opacity-70">[{SHADOW_RARITY_LABEL[shadow.rarity]}]</div>
          <h3 className="font-bold text-white/90 mt-0.5">{shadow.name}{(shadow.enhancementLevel ?? 0) > 0 ? ` +${shadow.enhancementLevel}` : ''}</h3>
          <div className="text-[11px] text-white/55 mt-1">
            계급: {SHADOW_RANK_LABEL[shadow.rank]} · 역할: {SHADOW_ROLE_LABEL[shadow.role]}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {equipped && (
            <span className="text-[10px] system-text px-2 py-0.5 rounded border border-amber-400/35 bg-amber-400/10 text-amber-200">
              출전 중
            </span>
          )}
          {shadow.isLocked && (
            <span className="text-[10px] system-text px-2 py-0.5 rounded border border-rose-400/35 bg-rose-400/10 text-rose-200 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> 잠금
            </span>
          )}
          {shadow.isFavorite && (
            <span className="text-[10px] system-text px-2 py-0.5 rounded border border-yellow-400/35 bg-yellow-400/10 text-yellow-200 flex items-center gap-1">
              <Star className="w-2.5 h-2.5" /> 즐겨찾기
            </span>
          )}
          {evolutionCheck.canEvolve && (
            <span className="text-[10px] system-text px-2 py-0.5 rounded border border-emerald-400/35 bg-emerald-400/10 text-emerald-200">
              진화 가능
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] text-white/60">Lv {level}/{maxLevel}</span>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-400/60 rounded-full transition-all" style={{ width: `${xpPct}%` }} />
        </div>
        <span className="text-[10px] text-white/40">{level >= maxLevel ? 'MAX' : `${xp}/${xpNeeded}`}</span>
      </div>

      {shadow.traits.length > 0 && (
        <div className="mt-2 text-[11px] text-purple-100/80">
          특성: {shadow.traits.map(trait => trait.name).join(' / ')}
        </div>
      )}
      <div className="mt-2 text-[11px] text-cyan-100/70 leading-relaxed">
        {effects.join(' · ')}
      </div>
      <div className="mt-2 text-[10px] text-white/40 system-text">
        출처: {sourceText(shadow)}
      </div>
      {(shadow.enhancementLevel ?? 0) > 0 && (
        <div className="mt-1 text-[10px] text-amber-200/70">
          강화 {shadow.enhancementLevel}/{MAX_SHADOW_ENHANCEMENT_LEVEL} · 흡수 {(shadow.absorbedCount ?? 0)}회
        </div>
      )}
      {(shadow.isLocked || shadow.isFavorite) && (
        <div className="mt-1 text-[10px] text-white/30 flex gap-2">
          {shadow.isLocked && <span className="text-rose-200/60">잠금 중: 분해/재료 사용 불가</span>}
          {shadow.isFavorite && <span className="text-yellow-200/60">즐겨찾기</span>}
        </div>
      )}
      {evolutionCheck.targetDefinition && (
        <div className="mt-1 text-[10px] text-white/40">
          진화: {shadow.name} → {evolutionCheck.targetDefinition.name} ({evolutionCheck.cost} 정수)
          {!evolutionCheck.canEvolve && evolutionCheck.reason && (
            <span className="text-white/30 ml-1">· {evolutionCheck.reason}</span>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {equipped ? (
          <button type="button" onClick={onUnequip} className="w-full btn text-xs border-rose-400/25 bg-rose-400/10 text-rose-100">
            <X className="w-3 h-3" />
            해제
          </button>
        ) : (
          <button type="button" onClick={onEquip} disabled={!canEquip} className="w-full btn btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed">
            출전
          </button>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAbsorb}
            disabled={materialCount === 0 || (shadow.enhancementLevel ?? 0) >= MAX_SHADOW_ENHANCEMENT_LEVEL || shadow.isAchievementNamed}
            className="flex-1 btn text-[10px] border-amber-400/25 bg-amber-400/10 text-amber-100 disabled:opacity-40 disabled:cursor-not-allowed"
            title={shadow.isAchievementNamed ? '성취 네임드는 흡수 불가' : materialCount === 0 ? '재료 없음' : (shadow.enhancementLevel ?? 0) >= MAX_SHADOW_ENHANCEMENT_LEVEL ? '최대 강화' : `재료 ${materialCount}개`}
          >
            흡수 +{Math.min(MAX_SHADOW_ENHANCEMENT_LEVEL, (shadow.enhancementLevel ?? 0) + 1)} ({materialCount})
          </button>
          <button
            type="button"
            onClick={onDecompose}
            disabled={equipped || shadow.isAchievementNamed || shadow.isLocked}
            className="flex-1 btn text-[10px] border-rose-400/25 bg-rose-400/10 text-rose-100 disabled:opacity-40 disabled:cursor-not-allowed"
            title={shadow.isAchievementNamed ? '성취 네임드는 분해 불가' : shadow.isLocked ? '잠금 중: 분해 불가' : equipped ? '장착 중' : `정수 +${SHADOW_DECOMPOSE_ESSENCE[shadow.rarity] ?? 1}`}
          >
            분해 (+{SHADOW_DECOMPOSE_ESSENCE[shadow.rarity] ?? 1})
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggleLock}
            className={`flex-1 btn text-[10px] ${shadow.isLocked ? 'border-rose-400/35 bg-rose-400/15 text-rose-100' : 'border-white/10 bg-ink-900/45 text-white/50'}`}
            title={shadow.isLocked ? '잠금 해제' : '잠금 (분해/재료 방지)'}
          >
            <Lock className="w-2.5 h-2.5 inline mr-1" />
            {shadow.isLocked ? '잠금 해제' : '잠금'}
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`flex-1 btn text-[10px] ${shadow.isFavorite ? 'border-yellow-400/35 bg-yellow-400/15 text-yellow-100' : 'border-white/10 bg-ink-900/45 text-white/50'}`}
            title={shadow.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
          >
            <Star className="w-2.5 h-2.5 inline mr-1" />
            {shadow.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
          </button>
        </div>
        {evolutionCheck.targetDefinition && (
          <button
            type="button"
            onClick={onEvolve}
            disabled={!evolutionCheck.canEvolve}
            className={`w-full btn text-[10px] ${evolutionCheck.canEvolve ? 'border-emerald-400/35 bg-emerald-400/15 text-emerald-100' : 'border-white/10 bg-ink-900/45 text-white/40'} disabled:opacity-40 disabled:cursor-not-allowed`}
            title={evolutionCheck.reason ?? `진화: ${evolutionCheck.targetDefinition.name}`}
          >
            {evolutionCheck.canEvolve ? `진화 → ${evolutionCheck.targetDefinition.name}` : `진화 불가 · ${evolutionCheck.reason}`}
          </button>
        )}
      </div>
    </motion.div>
  )
}

function CodexCard({ definition, owned, ownedCount, maxEnhancement, isEquipped }: { definition: (typeof SHADOW_DEFINITIONS)[number]; owned: boolean; ownedCount: number; maxEnhancement: number; isEquipped: boolean }) {
  const effects = definition.effects.map(formatShadowEffect)
  const hidden = !owned && definition.hiddenUntilObtained
  return (
    <div className={`panel corner-bracket p-4 ${rarityStyle[definition.rarity]} ${owned ? '' : 'opacity-60'}`}>
      <div className="br" />
      <ShadowPortrait definition={definition} size="md" hidden={hidden} highlighted={definition.rank === 'named'} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] system-text opacity-70">[{SHADOW_RARITY_LABEL[definition.rarity]}]</div>
          <h3 className="font-bold text-white/90 mt-0.5">{hidden ? '???' : definition.name}</h3>
          <div className="text-[11px] text-white/55 mt-1">
            계급: {SHADOW_RANK_LABEL[definition.rank]} · 역할: {SHADOW_ROLE_LABEL[definition.role]}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {owned ? <Eclipse className="w-4 h-4 text-cyan-200" /> : <Lock className="w-4 h-4 text-white/35" />}
          {owned && (
            <div className="text-[10px] text-white/40 text-right">
              보유 {ownedCount}{maxEnhancement > 0 ? ` · 최고 +${maxEnhancement}` : ''}{isEquipped ? ' · 출전' : ''}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 text-[11px] text-white/55 leading-relaxed">
        {hidden ? '해금 후 공개' : definition.description}
      </div>
      <div className="mt-2 text-[11px] text-cyan-100/70 leading-relaxed">
        {hidden ? '효과: 해금 후 공개' : effects.join(' · ')}
      </div>
      <div className="mt-2 text-[10px] text-white/40 system-text">
        조건: {definition.unlockConditionText ?? definition.sourceGateId ?? `${definition.sourceGateRank ?? '?'}급 게이트 추출`}
      </div>
    </div>
  )
}

export function ShadowPanel() {
  const hunter = useGame(s => s.hunter)
  const ownedShadows = useGame(s => s.ownedShadows ?? [])
  const equippedShadowIds = useGame(s => s.equippedShadowIds ?? [])
  const equipShadow = useGame(s => s.equipShadow)
  const unequipShadow = useGame(s => s.unequipShadow)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('obtained')
  const [view, setView] = useState<'owned' | 'codex'>('owned')

  const slotCount = getShadowSlotCount(hunter)
  const equippedShadows = getEquippedShadows(ownedShadows, equippedShadowIds, hunter)
  const ownedDefinitionIds = new Set(ownedShadows.map(shadow => shadow.definitionId))
  const shadowEssence = useGame(s => s.shadowEssence ?? 0)
  const absorbShadow = useGame(s => s.absorbShadow)
  const decomposeShadow = useGame(s => s.decomposeShadow)
  const toggleShadowLock = useGame(s => s.toggleShadowLock)
  const toggleShadowFavorite = useGame(s => s.toggleShadowFavorite)
  const evolveShadow = useGame(s => s.evolveShadow)
  const [pendingEvolution, setPendingEvolution] = useState<{
    shadow: OwnedShadow
    targetName: string
    cost: number
  } | undefined>()

  const filteredOwned = useMemo(() => {
    const list = ownedShadows.filter(shadow => {
      if (filter === 'all') return true
      if (filter === 'normal') return !shadow.isGateNamed && !shadow.isAchievementNamed
      if (filter === 'gate_named') return Boolean(shadow.isGateNamed)
      if (filter === 'achievement_named') return Boolean(shadow.isAchievementNamed)
      return shadow.role === filter
    })
    return sortShadows(list, sort, equippedShadowIds)
  }, [filter, ownedShadows, sort, equippedShadowIds])

  const codexDefs = SHADOW_DEFINITIONS.filter(def => {
    if (filter === 'all') return true
    if (filter === 'normal') return def.sourceType === 'gate_extract'
    if (filter === 'gate_named') return def.isGateNamed
    if (filter === 'achievement_named') return def.isAchievementNamed
    return def.role === filter
  })
  const legionPower = equippedShadows.reduce((sum, shadow) => {
    const def = getShadowDefinition(shadow.definitionId)
    const levelBonus = 1 + ((shadow.level ?? 1) - 1) * 0.01
    const enhanceBonus = 1 + (shadow.enhancementLevel ?? 0) * 0.06
    return sum + Math.round((def?.basePower ?? 0) * levelBonus * enhanceBonus)
  }, 0)
  const evolutionSteps: RevealStep[] = pendingEvolution
    ? [
        {
          title: 'SHADOW EVOLUTION',
          text: `${pendingEvolution.shadow.name}의 형체가 흔들린다.`,
          subtext: '강화는 유지되고 레벨은 1로 재정렬됩니다.',
          durationMs: 900,
          tone: 'shadow',
        },
        {
          title: 'CONDENSE',
          text: '더 깊은 어둠이 갑옷처럼 둘러진다.',
          subtext: `그림자 정수 ${pendingEvolution.cost} 소모`,
          durationMs: 900,
          tone: 'shadow',
        },
        {
          title: 'EVOLVED',
          text: `${pendingEvolution.targetName}으로 진화했다.`,
          subtext: '군단의 기척이 한 단계 더 무거워졌습니다.',
          durationMs: 1200,
          tone: 'rank',
          emphasis: true,
        },
      ]
    : []

  return (
    <div className="space-y-4">
      <DramaticReveal
        isOpen={Boolean(pendingEvolution)}
        steps={evolutionSteps}
        tone="shadow"
        position="modal"
        onComplete={() => {
          if (pendingEvolution) evolveShadow(pendingEvolution.shadow.instanceId)
          setPendingEvolution(undefined)
        }}
      />
      <div className="panel corner-bracket overflow-hidden p-5 border-purple-400/25 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.2),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.75),rgba(2,6,23,0.94))]">
        <div className="br" />
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Eclipse className="w-5 h-5 text-cyan-300" />
            <div>
              <div className="system-text text-[11px] text-cyan-300/70">SHADOW ARMY</div>
              <div className="text-sm text-white/55">보유 {ownedShadows.length} · 출전 {equippedShadows.length} / {slotCount} · 정수 {shadowEssence}</div>
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-4 gap-2 min-w-[420px]">
            <div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">
              <div className="system-text text-[9px] text-cyan-200/60">ESSENCE</div>
              <div className="text-lg font-bold text-cyan-100">{shadowEssence}</div>
            </div>
            <div className="rounded-md border border-purple-400/20 bg-purple-400/10 px-3 py-2">
              <div className="system-text text-[9px] text-purple-200/60">OWNED</div>
              <div className="text-lg font-bold text-purple-100">{ownedShadows.length}</div>
            </div>
            <div className="rounded-md border border-amber-400/20 bg-amber-400/10 px-3 py-2">
              <div className="system-text text-[9px] text-amber-200/60">DEPLOYED</div>
              <div className="text-lg font-bold text-amber-100">{equippedShadows.length}/{slotCount}</div>
            </div>
            <div className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
              <div className="system-text text-[9px] text-emerald-200/60">POWER</div>
              <div className="text-lg font-bold text-emerald-100">{legionPower}</div>
            </div>
          </div>
          {equippedShadowIds.length > slotCount && (
            <div className="text-[10px] text-amber-200 border border-amber-400/30 bg-amber-400/10 rounded px-2 py-1">
              슬롯 초과: 앞 {slotCount}명만 적용
            </div>
          )}
        </div>

        <div className="mb-3 flex items-center gap-3">
          <div className="system-text text-[11px] text-purple-200/80">DEPLOYED LEGION</div>
          <div className="h-px flex-1 bg-gradient-to-r from-purple-300/30 to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: Math.max(1, slotCount) }).map((_, index) => {
            const shadow = equippedShadows[index]
            return (
              <div key={index} className={`relative overflow-hidden rounded-lg border p-3 min-h-56 ${shadow ? 'border-cyan-400/25 bg-cyan-400/5 shadow-glow' : 'border-white/10 bg-ink-900/45'}`}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(34,211,238,0.12),transparent_42%),linear-gradient(180deg,rgba(168,85,247,0.06),transparent_60%)]" />
                <div className="relative z-10 flex items-center gap-1.5 text-[10px] system-text text-cyan-300/60 mb-2">
                  {shadow?.role === 'guard' ? <Shield className="w-3 h-3" /> : <Swords className="w-3 h-3" />}
                  SLOT {index + 1}
                </div>
                {shadow ? (
                  <div className="relative z-10 space-y-2">
                    <ShadowPortrait shadow={shadow} size="md" active highlighted={Boolean(shadow.isNamed)} />
                    <div className={`text-xs font-semibold ${rarityStyle[shadow.rarity].split(' ')[0]}`}>{shadow.name}</div>
                    <div className="text-[10px] text-white/45 mt-1">{SHADOW_ROLE_LABEL[shadow.role]} · {SHADOW_RANK_LABEL[shadow.rank]}</div>
                    <button type="button" onClick={() => unequipShadow(shadow.instanceId)} className="mt-2 text-[10px] text-rose-200 border border-rose-400/25 rounded px-2 py-1">
                      해제
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-white/35">비어 있음</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <ShadowExpeditionPanel />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setView('owned')} className={`px-3 py-2 rounded-md text-xs border ${view === 'owned' ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-ink-900/45 text-white/50'}`}>보유</button>
        <button type="button" onClick={() => setView('codex')} className={`px-3 py-2 rounded-md text-xs border ${view === 'codex' ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-ink-900/45 text-white/50'}`}>도감</button>
        <select value={filter} onChange={event => setFilter(event.target.value as FilterKey)} className="bg-ink-900/80 border border-white/10 rounded-md px-3 py-2 text-xs text-white/70">
          {filters.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
        <select value={sort} onChange={event => setSort(event.target.value as SortKey)} className="bg-ink-900/80 border border-white/10 rounded-md px-3 py-2 text-xs text-white/70">
          <option value="obtained">기본순 (출전·즐겨찾기·잠금)</option>
          <option value="rarity">희귀도순</option>
          <option value="rank">계급순</option>
          <option value="name">이름순</option>
          <option value="enhancement">강화순</option>
          <option value="favorite">즐겨찾기순</option>
          <option value="locked">잠금순</option>
        </select>
      </div>

      {view === 'owned' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredOwned.map(shadow => {
            const equipped = equippedShadowIds.includes(shadow.instanceId)
            return (
              <VisualShadowCard
                key={shadow.instanceId}
                shadow={shadow}
                equipped={equipped}
                canEquip={equipped || equippedShadowIds.length < slotCount}
                onEquip={() => equipShadow(shadow.instanceId)}
                onUnequip={() => unequipShadow(shadow.instanceId)}
                materialCount={getShadowAbsorbMaterialCount(shadow, ownedShadows, equippedShadowIds)}
                onAbsorb={() => {
                  if (window.confirm(`[${shadow.name}] +${(shadow.enhancementLevel ?? 0) + 1} 강화합니다.\n재료로 같은 그림자 1개를 소모합니다. 계속할까요?`)) {
                    absorbShadow(shadow.instanceId)
                  }
                }}
                onDecompose={() => {
                  const isRare = ['rare', 'epic', 'legendary'].includes(shadow.rarity)
                  const isLocked = shadow.isLocked
                  const msg = isLocked
                    ? `[${shadow.name}]은(는) 잠금 상태입니다.\n분해하려면 먼저 잠금을 해제하세요.`
                    : isRare
                      ? `[${SHADOW_RARITY_LABEL[shadow.rarity]}] ${shadow.name}을(를) 분해합니다.\n그림자 정수 +${SHADOW_DECOMPOSE_ESSENCE[shadow.rarity] ?? 1} 획득.\n이 작업은 되돌릴 수 없습니다. 계속할까요?`
                      : `[${shadow.name}]을(를) 분해하여 그림자 정수 ${SHADOW_DECOMPOSE_ESSENCE[shadow.rarity] ?? 1} 획득합니다. 계속할까요?`
                  if (!isLocked && window.confirm(msg)) {
                    decomposeShadow(shadow.instanceId)
                  }
                }}
                onToggleLock={() => toggleShadowLock(shadow.instanceId)}
                onToggleFavorite={() => toggleShadowFavorite(shadow.instanceId)}
                onEvolve={() => {
                  const check = canEvolveShadow(shadow, shadowEssence)
                  if (check.canEvolve && check.targetDefinition) {
                    if (window.confirm(`[${shadow.name}]을(를) [${check.targetDefinition.name}](으)로 진화합니다.\n그림자 정수 ${check.cost} 소모.\n레벨이 1로 초기화되고 강화는 유지됩니다. 계속할까요?`)) {
                      setPendingEvolution({
                        shadow,
                        targetName: check.targetDefinition.name,
                        cost: check.cost ?? 0,
                      })
                    }
                  }
                }}
                shadowEssence={shadowEssence}
              />
            )
          })}
          {filteredOwned.length === 0 && (
            <div className="panel corner-bracket p-10 text-center text-sm text-white/45 md:col-span-2 lg:col-span-3">
              <div className="br" />
              아직 보유한 그림자가 없습니다.
            </div>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {codexDefs.map(def => {
            const instances = ownedShadows.filter(s => s.definitionId === def.id)
            const maxEnh = Math.max(0, ...instances.map(s => s.enhancementLevel ?? 0))
            const isEquipped = instances.some(s => equippedShadowIds.includes(s.instanceId))
            return (
              <CodexCard
                key={def.id}
                definition={def}
                owned={ownedDefinitionIds.has(def.id)}
                ownedCount={instances.length}
                maxEnhancement={maxEnh}
                isEquipped={isEquipped}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
