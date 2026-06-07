import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { Crown, Eclipse, Eye, Gem, Lock, Search, Shield, Sparkles, Star, Swords, Ticket, X, ChevronDown, ChevronUp, Dumbbell, FlaskConical } from 'lucide-react'
import { useGame } from '../lib/store'
import { getShadowRuneSlotsCount, getRuneDescription, getRuneValue } from '../lib/runes'
import { buildShadowBattleUnit } from '../lib/battleUnits'
import { ShadowCard as VisualShadowCard } from './shadows/ShadowCard'
import { ShadowExpeditionPanel } from './shadows/ShadowExpeditionPanel'
import { ShadowPortrait } from './shadows/ShadowPortrait'
import { LockedShadowPortrait } from './shadows/LockedShadowPortrait'
import { ShadowRevealModal, type ShadowRevealPayload } from './shadows/ShadowRevealModal'
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
  SHADOW_FRAGMENT_SUMMON_COST,
  SHADOW_INNATE_GRADE_LABEL,
  SHADOW_TRAINING_OPTIONS,
  getShadowTrainingCostMultiplier,
  SHADOW_TRAIT_DEFINITIONS,
  SHADOW_PASSIVE_DEFINITIONS,
  SHADOW_SKILL_DEFINITIONS,
  SHADOW_LEGION_NODES,
  getShadowMaxTraitSlots,
  MAX_SHADOW_MUTATION_STAGE,
  getEnhanceProbability,
  canEnhanceShadowWithStone,
} from '../lib/shadows'
import {
  SHADOW_STAT_GROUPS,
  SHADOW_STAT_LABEL,
  getShadowArmyCombatPower,
  getShadowCombatProfile,
} from '../lib/shadowStats'
import {
  formatShadowPassiveSummary,
  formatShadowSkillSummary,
  formatShadowTriggerSummary,
  getShadowAbilitySourceLabel,
  getShadowCombatUnitProfile,
  getShadowSkillDisplayName,
  getShadowSkillTagLabel,
  translateQualityTier,
} from '../lib/shadowSkills'
import type { OwnedShadow, ShadowInnateGrade, ShadowRarity, ShadowRole, ShadowStatKey } from '../lib/types'

type SourceFilterKey = 'all' | 'normal' | 'gate_named' | 'achievement_named'
type RoleFilterKey = 'all' | ShadowRole
type OwnershipFilterKey = 'all' | 'owned' | 'unowned'
type StatusFilterKey = 'all' | 'equipped' | 'favorite' | 'locked' | 'evolution_ready'
type RarityFilterKey = 'all' | ShadowRarity
type GradeFilterKey = 'all' | ShadowInnateGrade
type SortKey = 'obtained' | 'rarity' | 'rank' | 'name' | 'enhancement' | 'favorite' | 'locked' | 'level' | 'innateGrade' | 'evolution'

const rarityStyle: Record<string, string> = {
  common: 'text-zinc-200 border-zinc-500/35 bg-zinc-500/10',
  uncommon: 'text-emerald-200 border-emerald-400/35 bg-emerald-400/10',
  rare: 'text-cyan-200 border-cyan-400/40 bg-cyan-400/10',
  epic: 'text-purple-200 border-purple-400/45 bg-purple-400/10',
  legendary: 'text-amber-200 border-amber-400/55 bg-amber-400/10',
}

const sourceFilters: Array<{ key: SourceFilterKey; label: string }> = [
  { key: 'all', label: '출처 전체' },
  { key: 'normal', label: '일반' },
  { key: 'gate_named', label: '게이트 네임드' },
  { key: 'achievement_named', label: '성취 네임드' },
]

const roleFilters: Array<{ key: RoleFilterKey; label: string }> = [
  { key: 'all', label: '역할 전체' },
  { key: 'assault', label: '공격형' },
  { key: 'guard', label: '방어형' },
  { key: 'scout', label: '정찰형' },
  { key: 'analyst', label: '분석형' },
  { key: 'support', label: '지원형' },
  { key: 'hunter', label: '사냥형' },
]

const ownershipFilters: Array<{ key: OwnershipFilterKey; label: string }> = [
  { key: 'all', label: '보유 전체' },
  { key: 'owned', label: '보유' },
  { key: 'unowned', label: '미보유' },
]

const statusFilters: Array<{ key: StatusFilterKey; label: string }> = [
  { key: 'all', label: '상태 전체' },
  { key: 'equipped', label: '출전' },
  { key: 'favorite', label: '즐겨찾기' },
  { key: 'locked', label: '잠금' },
  { key: 'evolution_ready', label: '진화 가능' },
]

const rarityFilters: Array<{ key: RarityFilterKey; label: string }> = [
  { key: 'all', label: '희귀도 전체' },
  { key: 'common', label: SHADOW_RARITY_LABEL.common },
  { key: 'uncommon', label: SHADOW_RARITY_LABEL.uncommon },
  { key: 'rare', label: SHADOW_RARITY_LABEL.rare },
  { key: 'epic', label: SHADOW_RARITY_LABEL.epic },
  { key: 'legendary', label: SHADOW_RARITY_LABEL.legendary },
]

const gradeFilters: Array<{ key: GradeFilterKey; label: string }> = [
  { key: 'all', label: '태생 전체' },
  { key: 'S', label: 'S 태생' },
  { key: 'A', label: 'A 태생' },
  { key: 'B', label: 'B 태생' },
  { key: 'C', label: 'C 태생' },
]

const gradeOrder: ShadowInnateGrade[] = ['C', 'B', 'A', 'S']

const sourceText = (shadow: OwnedShadow): string => {
  const def = getShadowDefinition(shadow.definitionId)
  if (shadow.isAchievementNamed) return def?.unlockConditionText ?? '현실 성취'
  if (shadow.isGateNamed) return def?.sourceGateId ?? '게이트 네임드'
  return def?.sourceGateRank ? `${def.sourceGateRank}급 게이트 추출` : '게이트 추출'
}

const sortShadows = (shadows: OwnedShadow[], sort: SortKey, equippedIds: string[], shadowEssence = 0): OwnedShadow[] => {
  const rarityScore = (shadow: OwnedShadow) => SHADOW_RARITY_ORDER.indexOf(shadow.rarity)
  const rankScore = (shadow: OwnedShadow) => ['lesser', 'soldier', 'elite', 'knight', 'marshal', 'monarch', 'named'].indexOf(shadow.rank)
  const gradeScore = (shadow: OwnedShadow) => gradeOrder.indexOf(shadow.innateGrade ?? 'B')
  const equippedSet = new Set(equippedIds)
  return [...shadows].sort((a, b) => {
    // explicit sort override
    if (sort === 'rarity') return rarityScore(b) - rarityScore(a)
    if (sort === 'rank') return rankScore(b) - rankScore(a)
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'enhancement') return (b.enhancementLevel ?? 0) - (a.enhancementLevel ?? 0)
    if (sort === 'favorite') return Number(b.isFavorite) - Number(a.isFavorite)
    if (sort === 'locked') return Number(b.isLocked) - Number(a.isLocked)
    if (sort === 'level') return (b.level ?? 1) - (a.level ?? 1)
    if (sort === 'innateGrade') return gradeScore(b) - gradeScore(a)
    if (sort === 'evolution') return Number(canEvolveShadow(b, shadowEssence).canEvolve) - Number(canEvolveShadow(a, shadowEssence).canEvolve)
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

const shadowSourceKey = (shadow: OwnedShadow): SourceFilterKey => {
  if (shadow.isGateNamed) return 'gate_named'
  if (shadow.isAchievementNamed) return 'achievement_named'
  return 'normal'
}

const definitionSourceKey = (definition: (typeof SHADOW_DEFINITIONS)[number]): SourceFilterKey => {
  if (definition.isGateNamed) return 'gate_named'
  if (definition.isAchievementNamed) return 'achievement_named'
  return 'normal'
}

const shadowSearchText = (shadow: OwnedShadow): string => {
  const def = getShadowDefinition(shadow.definitionId)
  return [
    shadow.name,
    SHADOW_RARITY_LABEL[shadow.rarity],
    SHADOW_RANK_LABEL[shadow.rank],
    SHADOW_ROLE_LABEL[shadow.role],
    SHADOW_INNATE_GRADE_LABEL[shadow.innateGrade ?? 'B'],
    def?.sourceGateRank,
    shadow.isGateNamed ? 'gate named 네임드 게이트' : '',
    shadow.isAchievementNamed ? 'achievement named 성취' : '',
  ].filter(Boolean).join(' ').toLowerCase()
}

const definitionSearchText = (definition: (typeof SHADOW_DEFINITIONS)[number], owned: boolean): string => {
  const hidden = !owned && definition.hiddenUntilObtained
  if (hidden) {
    return [
      '??? unknown locked sealed 봉인 균열 미보유',
    ].join(' ').toLowerCase()
  }
  return [
    definition.name,
    definition.description,
    SHADOW_RARITY_LABEL[definition.rarity],
    SHADOW_RANK_LABEL[definition.rank],
    SHADOW_ROLE_LABEL[definition.role],
    definition.unlockConditionText,
    definition.sourceGateRank,
    definitionSourceKey(definition),
  ].filter(Boolean).join(' ').toLowerCase()
}

const displaySourceLabel = (shadow: OwnedShadow): string => {
  if (shadow.isAchievementNamed) return '성취 네임드'
  if (shadow.isGateNamed) return '게이트 네임드'
  return '일반 그림자'
}

const shadowPowerScore = (shadow: OwnedShadow): number => {
  const rarity = SHADOW_RARITY_ORDER.indexOf(shadow.rarity) * 1000
  const grade = gradeOrder.indexOf(shadow.innateGrade ?? 'B') * 220
  const level = (shadow.level ?? 1) * 18
  const enhancement = (shadow.enhancementLevel ?? 0) * 130
  const named = shadow.isGateNamed || shadow.isAchievementNamed || shadow.isNamed ? 650 : 0
  return rarity + grade + level + enhancement + named
}

const findNewShadow = (before: OwnedShadow[], after: OwnedShadow[]): OwnedShadow | undefined => {
  const beforeIds = new Set(before.map(shadow => shadow.instanceId))
  return after.find(shadow => !beforeIds.has(shadow.instanceId))
}

const hasDefinitionBefore = (before: OwnedShadow[], shadow: OwnedShadow): boolean =>
  before.some(item => item.definitionId === shadow.definitionId)

function ShadowDetailPanel({
  shadow,
  equipped,
  shadowEssence,
}: {
  shadow?: OwnedShadow
  equipped: boolean
  shadowEssence: number
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const runes = useGame(s => s.runes ?? [])
  const equipRune = useGame(s => s.equipRune)
  const unequipRune = useGame(s => s.unequipRune)
  const shadowEnhanceStones = useGame(s => s.shadowEnhanceStones ?? { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 })
  const enhanceShadowWithStone = useGame(s => s.enhanceShadowWithStone)
  const [equipSelectorSlot, setEquipSelectorSlot] = useState<number | null>(null)
  const [selectedStoneRarity, setSelectedStoneRarity] = useState<ShadowRarity | null>(null)

  useEffect(() => {
    setSelectedStoneRarity(null)
  }, [shadow?.instanceId])

  if (!shadow) {
    return (
      <div className="panel corner-bracket p-5 border-white/10 bg-ink-950/70">
        <div className="br" />
        <div className="flex min-h-64 items-center justify-center text-center text-sm text-white/40">
          그림자를 선택하면 상세 정보가 표시됩니다.
        </div>
      </div>
    )
  }

  const level = shadow.level ?? 1
  const maxLevel = getShadowMaxLevel(shadow)
  const xp = shadow.xp ?? 0
  const xpNeeded = getShadowXpForNextLevel(level)
  const xpPct = level >= maxLevel ? 100 : Math.min(100, Math.round((xp / xpNeeded) * 100))
  const evolutionCheck = canEvolveShadow(shadow, shadowEssence)
  const evolved = (shadow.evolutionStage ?? 0) > 0
  const effects = getShadowEffects(shadow).map(formatShadowEffect)
  const combatProfile = getShadowCombatProfile(shadow)
  const unitProfile = getShadowCombatUnitProfile(shadow)
  const battleUnit = buildShadowBattleUnit(shadow)
  const shadowStats = battleUnit.unit.stats
  const summaryItems = [
    { label: 'SCP', value: combatProfile.totalPower.toLocaleString() },
    { label: 'Lv', value: `${level}/${maxLevel}` },
    { label: 'Role', value: SHADOW_ROLE_LABEL[shadow.role] },
    { label: '치명타', value: `${(shadowStats.crit * 100).toFixed(1)}%` },
    { label: '회피', value: `${((shadowStats.evasionRate ?? 0) * 100).toFixed(1)}%` },
    { label: '명중', value: `${((shadowStats.accuracy ?? 0) * 100).toFixed(1)}%` },
  ]
  const breakdownItems = [
    { label: '지원', value: combatProfile.assistPower },
    { label: '수호', value: combatProfile.guardPower },
    { label: '제압', value: combatProfile.controlPower },
    { label: '보스 특화', value: combatProfile.bossPower },
    { label: '원정 전투', value: combatProfile.expeditionPower },
  ]

  const maxRuneSlots = getShadowRuneSlotsCount(shadow)
  const shadowRunes = runes.filter(r => r.type === 'shadow')

  return (
    <div className={`panel corner-bracket overflow-hidden p-4 border ${rarityStyle[shadow.rarity]} bg-ink-950/78`}>
      <div className="br" />
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="system-text text-[10px] text-cyan-200/60">선택된 그림자</div>
          <h3 className="mt-1 text-lg font-black text-white/95">
            {shadow.name}
            {(shadow.enhancementLevel ?? 0) > 0 && <span className="ml-2 text-sm text-amber-200">+{shadow.enhancementLevel}</span>}
          </h3>
        </div>
        <Eye className="h-5 w-5 shrink-0 text-cyan-200/70" />
      </div>

      <ShadowPortrait shadow={shadow} size="xl" active={equipped} highlighted innateGrade={shadow.innateGrade} evolutionReady={evolutionCheck.canEvolve} />

      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
        {summaryItems.map(item => (
          <div key={item.label} className="min-w-0 rounded border border-white/10 bg-ink-900/55 px-2 py-1.5">
            <div className="system-text text-[8px] text-white/35">{item.label}</div>
            <div className="truncate font-semibold text-white/85">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] system-text">
        <span className={`rounded border px-2 py-1 ${equipped ? 'border-cyan-300/35 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/5 text-white/45'}`}>
          {equipped ? '출전 중' : '미출전'}
        </span>
        <span className={`rounded border px-2 py-1 ${evolutionCheck.canEvolve ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100' : 'border-white/10 bg-white/5 text-white/45'}`}>
          {evolutionCheck.canEvolve ? '진화 가능' : '진화 대기'}
        </span>
        {(shadow.enhancementLevel ?? 0) > 0 && (
          <span className="rounded border border-amber-300/35 bg-amber-300/10 px-2 py-1 text-amber-100">+{shadow.enhancementLevel}</span>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gem className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
            <span className="text-xs font-bold text-white/95">그림자 룬 장착</span>
          </div>
          <span className="text-[10px] text-white/45 font-bold">
            ({shadow.runeSlots?.filter(Boolean).length ?? 0} / {maxRuneSlots} 장착)
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: maxRuneSlots }).map((_, idx) => {
            const equippedRune = shadow.runeSlots?.[idx]
            
            if (equippedRune) {
              const gradeBorderColor = 
                equippedRune.grade === 'legendary' ? 'border-amber-400/40 bg-amber-400/5' :
                equippedRune.grade === 'epic' ? 'border-purple-400/40 bg-purple-400/5' :
                equippedRune.grade === 'rare' ? 'border-cyan-400/40 bg-cyan-400/5' :
                equippedRune.grade === 'uncommon' ? 'border-emerald-400/40 bg-emerald-400/5' :
                'border-zinc-500/30 bg-zinc-500/5'

              const gradeTextColor = 
                equippedRune.grade === 'legendary' ? 'text-amber-300' :
                equippedRune.grade === 'epic' ? 'text-purple-300' :
                equippedRune.grade === 'rare' ? 'text-cyan-300' :
                equippedRune.grade === 'uncommon' ? 'text-emerald-300' :
                'text-zinc-300'

              return (
                <div 
                  key={idx} 
                  className={clsx(
                    "relative rounded border p-2 flex flex-col justify-between items-center text-center min-h-[82px] cursor-pointer group hover:bg-white/5", 
                    gradeBorderColor
                  )}
                  onClick={() => {
                    if (window.confirm(`[${equippedRune.name}]을 해제하시겠습니까?`)) {
                      unequipRune(shadow.instanceId, 'shadow', idx)
                    }
                  }}
                >
                  <div className="text-lg">{equippedRune.icon}</div>
                  <div className="min-w-0 w-full">
                    <div className={clsx("truncate text-[9px] font-bold leading-tight", gradeTextColor)}>
                      {equippedRune.name}
                    </div>
                    <div className="text-[8px] text-white/50 truncate mt-0.5">
                      +{equippedRune.enhancementLevel} 강
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-rose-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded">
                    <span className="text-[9px] font-bold text-rose-300">해제</span>
                  </div>
                </div>
              )
            } else {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEquipSelectorSlot(idx)}
                  className="rounded border border-dashed border-white/10 hover:border-cyan-400/30 bg-black/40 hover:bg-cyan-950/10 p-2 flex flex-col justify-center items-center gap-1 min-h-[82px] text-center text-white/30 hover:text-cyan-200 transition"
                >
                  <span className="text-sm">+</span>
                  <span className="text-[9px] font-bold">장착</span>
                </button>
              )
            }
          })}
        </div>

        {/* 룬 장착 선택 셀렉터 */}
        {equipSelectorSlot !== null && (
          <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-cyan-300">{equipSelectorSlot + 1}번 슬롯에 장착할 룬 선택</span>
              <button 
                type="button" 
                onClick={() => setEquipSelectorSlot(null)}
                className="text-[9px] text-white/45 hover:text-white/80"
              >
                닫기
              </button>
            </div>
            
            {shadowRunes.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {shadowRunes.map(rune => {
                  const val = getRuneValue(rune)
                  const isPercent = rune.effectType && rune.effectType !== 'stat_bonus'
                  const valStr = isPercent ? `${(val * 100).toFixed(1)}%` : val.toString()
                  const desc = rune.description.replace('{val}', valStr)
                  
                  const gradeBg = 
                    rune.grade === 'legendary' ? 'bg-amber-400/10 border-amber-400/35 hover:bg-amber-400/20' :
                    rune.grade === 'epic' ? 'bg-purple-400/10 border-purple-400/35 hover:bg-purple-400/20' :
                    rune.grade === 'rare' ? 'bg-cyan-400/10 border-cyan-400/35 hover:bg-cyan-400/20' :
                    rune.grade === 'uncommon' ? 'bg-emerald-400/10 border-emerald-400/35 hover:bg-emerald-400/20' :
                    'bg-zinc-500/10 border-zinc-500/35 hover:bg-zinc-500/20'

                  const gradeText = 
                    rune.grade === 'legendary' ? 'text-amber-300' :
                    rune.grade === 'epic' ? 'text-purple-300' :
                    rune.grade === 'rare' ? 'text-cyan-300' :
                    rune.grade === 'uncommon' ? 'text-emerald-300' :
                    'text-zinc-300'

                  return (
                    <div 
                      key={rune.id}
                      onClick={() => {
                        equipRune(rune.id, shadow.instanceId, 'shadow', equipSelectorSlot)
                        setEquipSelectorSlot(null)
                      }}
                      className={clsx(
                        "rounded border p-2 flex items-center justify-between gap-2 cursor-pointer transition text-[10px] text-left",
                        gradeBg
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{rune.icon}</span>
                        <div className="min-w-0">
                          <div className={clsx("font-bold truncate", gradeText)}>
                            {rune.name} <span className="text-[9px] text-white/50">+{rune.enhancementLevel}</span>
                          </div>
                          <div className="text-[9px] text-white/60 truncate">{desc}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-cyan-300 shrink-0">장착</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-[10px] text-white/35 py-3 text-center border border-dashed border-white/5 bg-black/20 rounded">
                장착 가능한 그림자 전용 룬이 없습니다.<br />
                <span className="text-[9px] text-white/25">(전투나 상점에서 룬 상자를 획득하세요)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 그림자 강화석 강화 */}
      <div className="mt-4 rounded-lg border border-purple-500/20 bg-purple-950/10 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-300 animate-pulse" />
            <span className="text-xs font-bold text-white/95">그림자 강화석 강화</span>
          </div>
          <span className="text-[10px] text-white/45 font-bold">
            (현재 강화: +{shadow.enhancementLevel ?? 0} / {MAX_SHADOW_ENHANCEMENT_LEVEL})
          </span>
        </div>

        {((shadow.enhancementLevel ?? 0) >= MAX_SHADOW_ENHANCEMENT_LEVEL) ? (
          <div className="text-[10px] text-amber-200/80 py-3 text-center border border-dashed border-amber-500/20 bg-amber-950/10 rounded font-semibold">
            최대 강화 수치(+{MAX_SHADOW_ENHANCEMENT_LEVEL})에 도달했습니다.
          </div>
        ) : shadow.isAchievementNamed ? (
          <div className="text-[10px] text-white/35 py-3 text-center border border-dashed border-white/5 bg-black/20 rounded">
            성취 네임드 그림자는 강화할 수 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-1.5">
              {SHADOW_RARITY_ORDER.map(rarity => {
                const count = shadowEnhanceStones[rarity] ?? 0
                const isEligible = canEnhanceShadowWithStone(shadow, rarity, count)
                const isSelected = selectedStoneRarity === rarity
                const prob = getEnhanceProbability(shadow, rarity)

                const colorMap: Record<ShadowRarity, { border: string, bg: string, text: string }> = {
                  common: { border: 'border-zinc-500/30', bg: 'bg-zinc-500/5', text: 'text-zinc-300' },
                  uncommon: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-300' },
                  rare: { border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', text: 'text-cyan-300' },
                  epic: { border: 'border-purple-500/30', bg: 'bg-purple-500/5', text: 'text-purple-300' },
                  legendary: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-300' }
                }
                const color = colorMap[rarity]

                return (
                  <button
                    key={rarity}
                    type="button"
                    disabled={!isEligible}
                    onClick={() => setSelectedStoneRarity(rarity)}
                    className={clsx(
                      "rounded border p-1 flex flex-col justify-between items-center text-center min-h-[72px] transition",
                      !isEligible && "opacity-30 cursor-not-allowed border-white/5 bg-black/20",
                      isEligible && isSelected && "ring-1 ring-purple-400 border-purple-400/80 bg-purple-500/10",
                      isEligible && !isSelected && `${color.border} hover:bg-white/5`
                    )}
                  >
                    <div className="text-sm shrink-0">💎</div>
                    <div className="w-full min-w-0">
                      <div className={clsx("truncate text-[9px] font-bold leading-tight", color.text)}>
                        {SHADOW_RARITY_LABEL[rarity]}
                      </div>
                      <div className="text-[8px] text-white/50 truncate mt-0.5 font-mono">
                        {count}개
                      </div>
                    </div>
                    {isEligible && (
                      <div className="text-[7.5px] text-cyan-300 font-bold mt-0.5">
                        {(prob * 100).toFixed(0)}%
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {selectedStoneRarity && (
              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px]">
                <span className="text-white/60">
                  선택: <strong className="text-white">{SHADOW_RARITY_LABEL[selectedStoneRarity]}</strong> 강화석
                </span>
                <span className="text-cyan-300 font-semibold">
                  성공 확률: {(getEnhanceProbability(shadow, selectedStoneRarity) * 100).toFixed(0)}%
                </span>
              </div>
            )}

            <button
              type="button"
              disabled={!selectedStoneRarity}
              onClick={() => {
                if (!selectedStoneRarity) return
                enhanceShadowWithStone(shadow.instanceId, selectedStoneRarity)
                const nextCount = (shadowEnhanceStones[selectedStoneRarity] ?? 0) - 1
                if (nextCount <= 0) {
                  setSelectedStoneRarity(null)
                }
              }}
              className={clsx(
                "w-full rounded py-1.5 text-center text-xs font-bold transition",
                selectedStoneRarity
                  ? "bg-purple-600 text-white hover:bg-purple-500 shadow shadow-purple-900/30"
                  : "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
              )}
            >
              {selectedStoneRarity
                ? `강화 시도 (확률: ${(getEnhanceProbability(shadow, selectedStoneRarity) * 100).toFixed(0)}%)`
                : "강화석을 선택하십시오"
              }
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDetailsOpen(open => !open)}
        className="mt-3 flex w-full items-center justify-between rounded border border-white/10 bg-ink-900/55 px-3 py-2 text-[10px] font-bold text-white/60 transition hover:border-cyan-300/30 hover:text-cyan-100"
      >
        <span>{detailsOpen ? '상세 정보 접기' : '상세 정보 펼치기'}</span>
        {detailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {detailsOpen && (
        <div className="mt-3 border-t border-white/10 pt-3">

      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded border border-white/10 bg-ink-900/55 px-3 py-2">
          <div className="system-text text-[9px] text-white/35">등급</div>
          <div className="font-semibold text-white/85">{SHADOW_RARITY_LABEL[shadow.rarity]}</div>
        </div>
        <div className="rounded border border-white/10 bg-ink-900/55 px-3 py-2">
          <div className="system-text text-[9px] text-white/35">태생</div>
          <div className="font-semibold text-white/85">{SHADOW_INNATE_GRADE_LABEL[shadow.innateGrade ?? 'B']}</div>
        </div>
        <div className="rounded border border-white/10 bg-ink-900/55 px-3 py-2">
          <div className="system-text text-[9px] text-white/35">역할</div>
          <div className="font-semibold text-white/85">{SHADOW_ROLE_LABEL[shadow.role]}</div>
        </div>
        <div className="rounded border border-white/10 bg-ink-900/55 px-3 py-2">
          <div className="system-text text-[9px] text-white/35">계급</div>
          <div className="font-semibold text-white/85">{SHADOW_RANK_LABEL[shadow.rank]}</div>
        </div>
      </div>

      <div className="mt-3 rounded border border-cyan-400/15 bg-cyan-400/5 px-3 py-2">
        <div className="mb-1 flex items-center justify-between text-[10px] text-white/55">
          <span>Lv {level}/{maxLevel}</span>
          <span className="system-text">{level >= maxLevel ? '최대' : `${xp}/${xpNeeded} XP`}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-purple-300 to-emerald-300" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      <div className="mt-2 rounded border border-amber-400/15 bg-amber-400/5 px-3 py-2">
        <div className="mb-1 flex items-center justify-between text-[10px] text-amber-200/90 font-medium">
          <span className="font-semibold flex items-center gap-1">⭐ 원정 숙련 Lv.{shadow.expeditionLevel ?? 1} / 10</span>
          <span className="system-text">
            {(shadow.expeditionLevel ?? 1) >= 10 
              ? 'MAX (+27%)' 
              : `${shadow.expeditionMastery ?? 0}/${100 + ((shadow.expeditionLevel ?? 1) - 1) * 50} XP (+${((shadow.expeditionLevel ?? 1) - 1) * 3}%)`}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500" style={{ width: `${(shadow.expeditionLevel ?? 1) >= 10 ? 100 : Math.min(100, Math.round(((shadow.expeditionMastery ?? 0) / (100 + ((shadow.expeditionLevel ?? 1) - 1) * 50)) * 100))}%` }} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] system-text">
        <span className={`rounded border px-2 py-1 ${equipped ? 'border-cyan-300/35 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/5 text-white/45'}`}>{equipped ? '출전 중' : '미출전'}</span>
        <span className={`rounded border px-2 py-1 ${shadow.isFavorite ? 'border-yellow-300/35 bg-yellow-300/10 text-yellow-100' : 'border-white/10 bg-white/5 text-white/45'}`}>{shadow.isFavorite ? '즐겨찾기' : '일반 표시'}</span>
        <span className={`rounded border px-2 py-1 ${shadow.isLocked ? 'border-rose-300/35 bg-rose-300/10 text-rose-100' : 'border-white/10 bg-white/5 text-white/45'}`}>{shadow.isLocked ? '잠금' : '잠금 없음'}</span>
        <span className={`rounded border px-2 py-1 ${evolutionCheck.canEvolve ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100' : 'border-white/10 bg-white/5 text-white/45'}`}>{evolutionCheck.canEvolve ? '진화 가능' : '진화 대기'}</span>
        <span className={`rounded border px-2 py-1 ${evolved ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100' : 'border-white/10 bg-white/5 text-white/45'}`}>{evolved ? '진화체' : '기본형'}</span>
      </div>

      {evolutionCheck.targetDefinition && (
        <div className="mt-3 rounded border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[11px] text-emerald-100/75">
          진화: {evolutionCheck.targetDefinition.name} · 정수 {evolutionCheck.cost}
          {!evolutionCheck.canEvolve && evolutionCheck.reason && <span className="text-white/35"> · {evolutionCheck.reason}</span>}
        </div>
      )}

      <div className="mt-3 text-[11px] leading-relaxed text-cyan-100/70">
        {effects.join(' · ')}
      </div>
      <div className="mt-3 rounded-lg border border-purple-300/18 bg-purple-300/8 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="system-text text-[9px] text-purple-100/60">그림자 유닛 요약</div>
            <div className="mt-0.5 text-sm font-black text-white/90">
              {translateQualityTier(unitProfile.qualityCap)} 등급 스킬 모델
            </div>
          </div>
          <div className="text-right">
            <div className="system-text text-[9px] text-cyan-100/50">2.5D 배치</div>
            <div className="mt-0.5 text-[11px] font-semibold uppercase text-cyan-100/75">
              {unitProfile.actionProfile.boardLane === 'front' ? '전열 (FRONT)' : '후열 (REAR)'}
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unitProfile.summaryBadges.map(badge => (
            <span key={badge} className="rounded border border-purple-300/25 bg-purple-300/10 px-2 py-1 text-[10px] system-text text-purple-100/75">
              {getShadowSkillDisplayName(badge)}
            </span>
          ))}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded border border-white/10 bg-ink-950/45 p-2">
            <div className="mb-1 system-text text-[9px] text-white/40">액티브 후보</div>
            {unitProfile.activeSkills.length > 0 ? (
              <div className="space-y-1.5">
                {unitProfile.activeSkills.map(skill => (
                  <div key={skill.id} className="rounded border border-cyan-300/15 bg-cyan-300/8 px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-cyan-100/85">{getShadowSkillDisplayName(skill.name)}</span>
                      <span className="system-text text-[9px] text-cyan-100/50">{getShadowAbilitySourceLabel(skill)}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] leading-relaxed text-white/45">
                      {formatShadowSkillSummary(skill)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-white/35">지정된 액티브 후보가 없습니다.</div>
            )}
          </div>
          <div className="rounded border border-white/10 bg-ink-950/45 p-2">
            <div className="mb-1 system-text text-[9px] text-white/40">패시브 후보</div>
            {unitProfile.passives.length > 0 ? (
              <div className="space-y-1.5">
                {unitProfile.passives.map(passive => (
                  <div key={passive.id} className="rounded border border-emerald-300/15 bg-emerald-300/8 px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-emerald-100/85">{getShadowSkillDisplayName(passive.name)}</span>
                      <span className="system-text text-[9px] text-emerald-100/50">{getShadowAbilitySourceLabel(passive)}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] leading-relaxed text-white/45">
                      {formatShadowPassiveSummary(passive)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-white/35">지정된 패시브 후보가 없습니다.</div>
            )}
          </div>
        </div>
        <details className="mt-2 rounded border border-white/10 bg-ink-950/50">
          <summary className="cursor-pointer px-3 py-2 text-[10px] system-text text-white/55 hover:text-purple-100">
            그림자 개체 행동 / 발동 특성
          </summary>
          <div className="grid gap-2 border-t border-white/10 p-3 text-[10px] text-white/50 sm:grid-cols-2">
            <div>
              <div className="system-text text-[9px] text-white/35">우선 행동 유형</div>
              <div className="mt-1 text-white/70">{unitProfile.behavior.preferredActions.map(act => getShadowSkillTagLabel(act)).join(' / ')}</div>
            </div>
            <div>
              <div className="system-text text-[9px] text-white/35">동작 식별자</div>
              <div className="mt-1 text-white/70">{unitProfile.actionProfile.actionCue}</div>
            </div>
            <div>
              <div className="system-text text-[9px] text-white/35">태생 성장 보정</div>
              <div className="mt-1 text-white/70">
                발동 보정 x{unitProfile.gradeTuning.procStability.toFixed(2)} · 수치 보정 x{unitProfile.gradeTuning.effectScaling.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="system-text text-[9px] text-white/35">주요 발동 조건</div>
              <div className="mt-1 text-white/70">
                {formatShadowTriggerSummary(unitProfile.activeSkills[0]?.trigger ?? unitProfile.passives[0]?.condition)}
              </div>
            </div>
          </div>
        </details>
        <div className="mt-2 text-[9px] leading-relaxed text-white/35">
          액티브/패시브 스킬 후보는 2.5D 직접 전투 시 아군에게 버프를 부여하거나 적에게 군중제어 및 약화를 적용합니다.
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/8 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="system-text text-[9px] text-amber-100/60">그림자 총 전투력</div>
            <div className="mt-0.5 text-2xl font-black tabular-nums text-amber-100">
              {combatProfile.totalPower.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="system-text text-[9px] text-cyan-100/55">역할 아이덴티티</div>
            <div className="mt-0.5 max-w-40 text-[11px] font-semibold text-cyan-100/80">
              {combatProfile.roleIdentity}
            </div>
          </div>
        </div>
        <div className="mt-2 system-text text-[9px] text-white/35">핵심 전투 성향</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {combatProfile.topStats.map(stat => (
            <span key={stat.key} className="rounded border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-[10px] system-text text-cyan-100/75">
              {stat.label} {stat.value}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-5">
          {breakdownItems.map(item => (
            <div key={item.label} className="rounded border border-white/10 bg-ink-950/45 px-2 py-1.5">
              <div className="system-text text-[8px] text-white/35">{item.label}</div>
              <div className="font-bold tabular-nums text-white/80">{item.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <details className="mt-3 rounded border border-white/10 bg-ink-950/50">
          <summary className="cursor-pointer px-3 py-2 text-[10px] system-text text-white/55 hover:text-cyan-100">
            그림자 세부 스탯 정보
          </summary>
          <div className="space-y-3 border-t border-white/10 p-3">
            {SHADOW_STAT_GROUPS.map(group => (
              <div key={group.title}>
                <div className="mb-1.5 system-text text-[9px] text-white/40">{group.title}</div>
                <div className="grid gap-1.5">
                  {group.keys.map(key => {
                    const value = combatProfile.stats[key]
                    const pct = Math.min(100, Math.round((value / Math.max(1, combatProfile.topStats[0]?.value ?? value)) * 100))
                    return (
                      <div key={key} className="grid grid-cols-[88px_1fr_44px] items-center gap-2 text-[10px]">
                        <span className="truncate text-white/55">{SHADOW_STAT_LABEL[key]}</span>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-300/75 to-purple-300/75" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-right tabular-nums text-white/70">{value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </details>
        <div className="mt-2 text-[9px] leading-relaxed text-white/35">
          희귀도는 기초 잠재력, 태생 등급은 기본 재능, 레벨은 유대 성장, 강화는 투자 효율, 진화는 역할 확장, 네임드 상태는 고유한 잠재력을 나타냅니다.
        </div>
      </div>
      <div className="mt-2 text-[10px] text-white/35 system-text">
        {displaySourceLabel(shadow)} · 강화 {shadow.enhancementLevel ?? 0}/{MAX_SHADOW_ENHANCEMENT_LEVEL} · 흡수 {shadow.absorbedCount ?? 0}회
      </div>
        </div>
      )}
    </div>
  )
}



function CodexCard({
  definition,
  owned,
  ownedCount,
  maxEnhancement,
  isEquipped,
  fragmentCount,
  failCount,
}: {
  definition: (typeof SHADOW_DEFINITIONS)[number]
  owned: boolean
  ownedCount: number
  maxEnhancement: number
  isEquipped: boolean
  fragmentCount?: number
  failCount?: number
}) {
  const effects = definition.effects.map(formatShadowEffect)
  // 12-24H-1: locked named sealed 비주얼은 유지하되, 텍스트 숨김 여부는
  // 시드 정의의 hiddenUntilObtained flag만으로 결정한다.
  //   - gate_named (hiddenUntilObtained: true)        → 이름/설명/효과 숨김
  //   - achievement_named (hiddenUntilObtained 없음)  → 이름/설명/효과 그대로 표시 (공개 목표)
  // Portrait/frame은 두 타입 모두 sealed 시각 유지.
  const hidden = !owned && definition.hiddenUntilObtained
  const unlockConditionLabel = hidden
    ? '봉인 해제 후 공개'
    : definition.unlockConditionText ?? definition.sourceGateId ?? `${definition.sourceGateRank ?? '?'}급 게이트 추출`
  const isLockedNamed = !owned && (definition.isGateNamed || definition.isAchievementNamed)
  const lockedSourceType: 'named_gate' | 'named_achievement' | null = isLockedNamed
    ? (definition.isAchievementNamed ? 'named_achievement' : 'named_gate')
    : null
  const sealCardClass = hidden
    ? ''
    : lockedSourceType === 'named_gate'
    ? 'locked-named-card-gate'
    : lockedSourceType === 'named_achievement'
      ? 'locked-named-card-achievement'
      : ''
  const cardRarityStyle = hidden ? 'text-slate-200 border-slate-500/35 bg-slate-500/10' : rarityStyle[definition.rarity]
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`panel corner-bracket p-4 card-premium-shine group transition-all duration-300 ${cardRarityStyle} ${owned ? '' : 'opacity-70'} ${sealCardClass}`}
    >
      <div className="br" />
      {lockedSourceType ? (
        <LockedShadowPortrait
          role={definition.role}
          rarity={definition.rarity}
          sourceType={lockedSourceType}
          size="lg"
          maskDetails={hidden}
        />
      ) : (
        <ShadowPortrait definition={definition} size="lg" hidden={hidden} highlighted={definition.rank === 'named'} />
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] system-text opacity-70">{hidden ? '[???]' : `[${SHADOW_RARITY_LABEL[definition.rarity]}]`}</div>
          <h3 className="font-bold text-white/90 mt-0.5">{hidden ? '미확인 신호' : definition.name}</h3>
          {isLockedNamed && (
            <div className={`text-[10px] system-text mt-0.5 tracking-wider ${hidden ? 'text-white/50' : lockedSourceType === 'named_gate' ? 'text-amber-100/75' : 'text-cyan-100/75'}`}>
              {hidden && '봉인된 기록'}
              <span className={hidden ? 'hidden' : ''}>
              {lockedSourceType === 'named_gate' ? '봉인된 네임드' : '미획득 성취'}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {owned ? <Eclipse className="w-4 h-4 text-cyan-200" /> : <Lock className={`w-4 h-4 ${hidden ? 'text-white/35' : isLockedNamed ? (lockedSourceType === 'named_gate' ? 'text-amber-300/75' : 'text-cyan-200/75') : 'text-white/35'}`} />}
          {owned && (
            <div className="text-[10px] text-white/40 text-right">
              보유 {ownedCount}{maxEnhancement > 0 ? ` · 최고 +${maxEnhancement}` : ''}{isEquipped ? ' · 출전' : ''}
            </div>
          )}
        </div>
      </div>
      
      {fragmentCount !== undefined && fragmentCount > 0 && (
        <div className="mt-2 flex items-center justify-between text-[10px] text-cyan-200/90 bg-cyan-950/45 px-2 py-1 rounded border border-cyan-800/35">
          <span>조각 {fragmentCount}개</span>
          {!owned && <span>소환: {SHADOW_FRAGMENT_SUMMON_COST[definition.rarity] ?? 20}개 필요</span>}
        </div>
      )}
      {failCount !== undefined && failCount > 0 && !owned && (
        <div className="mt-1 flex items-center justify-between text-[10px] text-amber-200/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/30">
          <span>공명 누적</span>
          <span>{failCount}회 (+{failCount * 5}%)</span>
        </div>
      )}
    </motion.div>
  )
}

export function ShadowPanel() {
  const hunter = useGame(s => s.hunter)
  const ownedShadows = useGame(s => s.ownedShadows ?? [])
  const equippedShadowIds = useGame(s => s.equippedShadowIds ?? [])
  const equipShadow = useGame(s => s.equipShadow)
  const unequipShadow = useGame(s => s.unequipShadow)
  const [sourceFilter, setSourceFilter] = useState<SourceFilterKey>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilterKey>('all')
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilterKey>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all')
  const [rarityFilter, setRarityFilter] = useState<RarityFilterKey>('all')
  const [gradeFilter, setGradeFilter] = useState<GradeFilterKey>('all')
  const [sort, setSort] = useState<SortKey>('obtained')
  const [view, setView] = useState<'owned' | 'codex' | 'autosweep'>('owned')
  const [query, setQuery] = useState('')
  const [selectedShadowId, setSelectedShadowId] = useState<string | undefined>()
  const [isExpanded, setIsExpanded] = useState(false)

  const shadowAutoSweepState = useGame(s => s.shadowAutoSweepState)
  const assignShadowToAutoSweep = useGame(s => s.assignShadowToAutoSweep)
  const removeShadowFromAutoSweep = useGame(s => s.removeShadowFromAutoSweep)
  const claimAutoSweepRewards = useGame(s => s.claimAutoSweepRewards)

  const [nowTime, setNowTime] = useState(new Date())
  const [sweepResult, setSweepResult] = useState<{ gold: number; shadowEssence: number; xp: number; items: { name: string; icon: string; quantity: number }[]; elapsedMinutes: number; mutatedNames: string[] } | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setIsExpanded(false)
  }, [view])
  const [shadowReveal, setShadowReveal] = useState<ShadowRevealPayload | undefined>()

  // Premium Grow / Reveal Upgrade Results States
  const [reawakenedResult, setReawakenedResult] = useState<{
    shadowName: string
    beforeGrade: string
    afterGrade: string
    success: boolean
    shadow: OwnedShadow
  } | undefined>()

  const [traitRerollResult, setTraitRerollResult] = useState<{
    shadow: OwnedShadow
    slotIdx: number
    beforeTraitId?: string
    afterTraitId: string
    cost: number
  } | undefined>()

  const [slotUnlockResult, setSlotUnlockResult] = useState<{
    shadow: OwnedShadow
    type: 'skill' | 'passive'
    cost: number
  } | undefined>()

  const slotCount = getShadowSlotCount(hunter)
  const equippedShadows = getEquippedShadows(ownedShadows, equippedShadowIds, hunter)
  const ownedDefinitionIds = new Set(ownedShadows.map(shadow => shadow.definitionId))
  const shadowEssence = useGame(s => s.shadowEssence ?? 0)
  const shadowSummonTickets = useGame(s => s.shadowSummonTickets ?? [])
  const shadowSummonShards = useGame(s => s.shadowSummonShards ?? {})
  const shadowFragments = useGame(s => s.shadowFragments ?? {})
  const shadowExtractFailCount = useGame(s => s.shadowExtractFailCount ?? {})
  const summonShadowFromTicket = useGame(s => s.summonShadowFromTicket)
  const summonShadowFromFragments = useGame(s => s.summonShadowFromFragments)
  const exchangeShadowSummonShards = useGame(s => s.exchangeShadowSummonShards)
  const absorbShadow = useGame(s => s.absorbShadow)
  const decomposeShadow = useGame(s => s.decomposeShadow)
  const toggleShadowLock = useGame(s => s.toggleShadowLock)
  const toggleShadowFavorite = useGame(s => s.toggleShadowFavorite)
  const evolveShadow = useGame(s => s.evolveShadow)
  const trainShadowWithEssence = useGame(s => s.trainShadowWithEssence)
  const buyShadowTicketWithEssence = useGame(s => s.buyShadowTicketWithEssence)
  const buyExtractionCatalystWithEssence = useGame(s => s.buyExtractionCatalystWithEssence)
  const reawakenShadowInnateGrade = useGame(s => s.reawakenShadowInnateGrade)
  const rerollShadowTrait = useGame(s => s.rerollShadowTrait)
  const unlockShadowSlot = useGame(s => s.unlockShadowSlot)
  const equipShadowSlotAbility = useGame(s => s.equipShadowSlotAbility)
  const upgradeLegionNode = useGame(s => s.upgradeLegionNode)
  const craftHiddenEvolutionMaterial = useGame(s => s.craftHiddenEvolutionMaterial)
  const shadowLegionNodes = useGame(s => s.shadowLegionNodes ?? {})
  const restoreShadowFromCollapse = useGame(s => s.restoreShadowFromCollapse)
  const crystallizeCollapsedShadow = useGame(s => s.crystallizeCollapsedShadow)
  
  const mutationMaterialNormal = useGame(s => s.mutationMaterialNormal ?? 0)
  const mutationMaterialAdvanced = useGame(s => s.mutationMaterialAdvanced ?? 0)
  const mutationMaterialSupreme = useGame(s => s.mutationMaterialSupreme ?? 0)
  const mutateShadow = useGame(s => s.mutateShadow)

  const [selectedMutationGrade, setSelectedMutationGrade] = useState<'normal' | 'advanced' | 'supreme'>('normal')
  const [mutationResult, setMutationResult] = useState<{
    shadow: OwnedShadow
    beforeStats: Record<string, number>
    afterStats: Record<string, number>
    beforeVisuals: any
    afterVisuals: any
    newTraits: string[]
    grade: 'normal' | 'advanced' | 'supreme'
  } | undefined>()

  const [labOpen, setLabOpen] = useState(false)

  const handleMutate = (shadowId: string, grade: 'normal' | 'advanced' | 'supreme') => {
    const beforeState = useGame.getState()
    const shadowBefore = beforeState.ownedShadows?.find(s => s.instanceId === shadowId)
    if (!shadowBefore) return

    const combatProfileBefore = getShadowCombatProfile(shadowBefore)
    const beforeStats = { ...combatProfileBefore.stats }
    const beforeVisuals = { ...shadowBefore.mutation?.visualOverrides }

    mutateShadow(shadowId, grade)

    const afterState = useGame.getState()
    const shadowAfter = afterState.ownedShadows?.find(s => s.instanceId === shadowId)
    if (!shadowAfter) return

    const combatProfileAfter = getShadowCombatProfile(shadowAfter)
    const afterStats = { ...combatProfileAfter.stats }
    const afterVisuals = { ...shadowAfter.mutation?.visualOverrides }

    const beforeTraits = new Set((shadowBefore.mutation?.addedTraits ?? []).map(t => t.id))
    const newTraits = (shadowAfter.mutation?.addedTraits ?? [])
      .filter(t => !beforeTraits.has(t.id))
      .map(t => `${t.name} (${t.description})`)

    setMutationResult({
      shadow: shadowAfter,
      beforeStats,
      afterStats,
      beforeVisuals,
      afterVisuals,
      newTraits,
      grade,
    })
  }

  const handleReawaken = (shadowId: string) => {
    const beforeState = useGame.getState()
    const shadowBefore = beforeState.ownedShadows?.find(s => s.instanceId === shadowId)
    if (!shadowBefore) return

    const beforeGrade = shadowBefore.innateGrade ?? 'B'
    reawakenShadowInnateGrade(shadowId)

    const afterState = useGame.getState()
    const shadowAfter = afterState.ownedShadows?.find(s => s.instanceId === shadowId)
    if (!shadowAfter) return

    const afterGrade = shadowAfter.innateGrade ?? 'B'
    const success = afterGrade !== beforeGrade

    setReawakenedResult({
      shadowName: shadowBefore.name,
      beforeGrade,
      afterGrade,
      success,
      shadow: shadowAfter
    })
  }

  const handleRerollTrait = (shadowId: string, slotIdx: number, cost: number) => {
    const beforeState = useGame.getState()
    const shadowBefore = beforeState.ownedShadows?.find(s => s.instanceId === shadowId)
    if (!shadowBefore) return

    const beforeTraitId = shadowBefore.traitIds?.[slotIdx]
    rerollShadowTrait(shadowId, slotIdx)

    const afterState = useGame.getState()
    const shadowAfter = afterState.ownedShadows?.find(s => s.instanceId === shadowId)
    if (!shadowAfter) return

    const afterTraitId = shadowAfter.traitIds?.[slotIdx]
    if (!afterTraitId) return

    setTraitRerollResult({
      shadow: shadowAfter,
      slotIdx,
      beforeTraitId,
      afterTraitId,
      cost
    })
  }

  const handleUnlockSlot = (shadowId: string, slotType: 'skill' | 'passive', cost: number) => {
    const beforeState = useGame.getState()
    const shadowBefore = beforeState.ownedShadows?.find(s => s.instanceId === shadowId)
    if (!shadowBefore) return

    const currentSlotsBefore = slotType === 'skill' 
      ? (shadowBefore.unlockedSkillSlots ?? 0) 
      : (shadowBefore.unlockedPassiveSlots ?? 0)

    unlockShadowSlot(shadowId, slotType)

    const afterState = useGame.getState()
    const shadowAfter = afterState.ownedShadows?.find(s => s.instanceId === shadowId)
    if (!shadowAfter) return

    const currentSlotsAfter = slotType === 'skill'
      ? (shadowAfter.unlockedSkillSlots ?? 0)
      : (shadowAfter.unlockedPassiveSlots ?? 0)

    if (currentSlotsAfter > currentSlotsBefore) {
      setSlotUnlockResult({
        shadow: shadowAfter,
        type: slotType,
        cost
      })
    }
  }

  // Premium Legion Summary Stats
  const sGradeCount = useMemo(() => ownedShadows.filter(s => s.innateGrade === 'S').length, [ownedShadows])
  const aGradeCount = useMemo(() => ownedShadows.filter(s => s.innateGrade === 'A').length, [ownedShadows])
  const namedCount = useMemo(() => ownedShadows.filter(s => s.isNamed || s.isGateNamed || s.isAchievementNamed).length, [ownedShadows])
  const maxLevelVal = useMemo(() => ownedShadows.length > 0 ? Math.max(...ownedShadows.map(s => s.level ?? 1)) : 1, [ownedShadows])
  const avgLevelVal = useMemo(() => ownedShadows.length > 0 ? Math.round(ownedShadows.reduce((sum, s) => sum + (s.level ?? 1), 0) / ownedShadows.length) : 1, [ownedShadows])
  const maxScp = useMemo(() => ownedShadows.length > 0 ? Math.max(...ownedShadows.map(s => getShadowCombatProfile(s).totalPower)) : 0, [ownedShadows])

  const [pendingEvolution, setPendingEvolution] = useState<{
    shadow: OwnedShadow
    targetName: string
    cost: number
  } | undefined>()

  const normalizedQuery = query.trim().toLowerCase()

  const filteredOwned = useMemo(() => {
    const list = ownedShadows.filter(shadow => {
      if (ownershipFilter === 'unowned') return false
      if (sourceFilter !== 'all' && shadowSourceKey(shadow) !== sourceFilter) return false
      if (roleFilter !== 'all' && shadow.role !== roleFilter) return false
      if (rarityFilter !== 'all' && shadow.rarity !== rarityFilter) return false
      if (gradeFilter !== 'all' && (shadow.innateGrade ?? 'B') !== gradeFilter) return false
      if (statusFilter === 'equipped' && !equippedShadowIds.includes(shadow.instanceId)) return false
      if (statusFilter === 'favorite' && !shadow.isFavorite) return false
      if (statusFilter === 'locked' && !shadow.isLocked) return false
      if (statusFilter === 'evolution_ready' && !canEvolveShadow(shadow, shadowEssence).canEvolve) return false
      if (normalizedQuery && !shadowSearchText(shadow).includes(normalizedQuery)) return false
      return true
    })
    return sortShadows(list, sort, equippedShadowIds, shadowEssence)
  }, [equippedShadowIds, gradeFilter, normalizedQuery, ownedShadows, ownershipFilter, rarityFilter, roleFilter, shadowEssence, sort, sourceFilter, statusFilter])

  const availableTickets = shadowSummonTickets.filter(ticket => !ticket.usedAt)
  const fragmentEntries = Object.entries(shadowFragments)
    .map(([definitionId, amount]) => {
      const definition = getShadowDefinition(definitionId)
      const cost = definition ? SHADOW_FRAGMENT_SUMMON_COST[definition.rarity] : 20
      return { definitionId, amount, definition, cost, ready: amount >= cost }
    })
    .filter(entry => entry.definition)
    .sort((a, b) => Number(b.ready) - Number(a.ready) || b.amount - a.amount)
  const shardEntries = [
    { type: 'normal' as const, label: '일반 조각', amount: shadowSummonShards.normal ?? 0, cost: 10, ticketType: 'normal_shadow' as const },
    { type: 'rare' as const, label: '희귀 조각', amount: shadowSummonShards.rare ?? 0, cost: 10, ticketType: 'rare_shadow' as const },
    { type: 'named' as const, label: '네임드 조각', amount: shadowSummonShards.named ?? 0, cost: 20, ticketType: 'gate_named_shadow' as const },
    { type: 'achievement_named' as const, label: '성취 조각', amount: shadowSummonShards.achievement_named ?? 0, cost: 30, ticketType: 'achievement_named_shadow' as const },
  ]

  const handleTicketSummon = (ticketId: string) => {
    const before = useGame.getState()
    const ticket = before.shadowSummonTickets?.find(item => item.id === ticketId)
    summonShadowFromTicket(ticketId)
    const after = useGame.getState()
    const newShadow = findNewShadow(before.ownedShadows ?? [], after.ownedShadows ?? [])
    if (newShadow) {
      setSelectedShadowId(newShadow.instanceId)
      setShadowReveal({
        shadow: newShadow,
        source: 'summon',
        isNew: !hasDefinitionBefore(before.ownedShadows ?? [], newShadow),
        isDuplicate: hasDefinitionBefore(before.ownedShadows ?? [], newShadow),
        title: ticket?.ticketType === 'achievement_named_shadow' || ticket?.ticketType === 'category_achievement_named' ? 'ACHIEVEMENT SUMMON' : 'SHADOW SUMMON',
        message: !hasDefinitionBefore(before.ownedShadows ?? [], newShadow)
          ? '새 그림자가 군단에 합류했다.'
          : '익숙한 형상이 군단의 뒤편에 다시 새겨졌다.',
        detail: '소환권의 문양이 닫히고 그림자의 형상이 완전히 드러났다.',
      })
      return
    }
    const used = after.shadowSummonTickets?.find(item => item.id === ticketId)?.usedAt
    if (used) {
      setShadowReveal({
        source: 'summon',
        isDuplicate: true,
        success: true,
        ticketLabel: ticket?.label,
        title: 'MEMORY CONVERSION',
        message: '이미 각인된 기척이 파편의 기억으로 환원되었다.',
        detail: '군단의 기록은 흔들렸지만 새로운 정체는 드러나지 않았다.',
      })
    }
  }

  const handleFragmentSummon = (definitionId: string) => {
    const before = useGame.getState()
    summonShadowFromFragments(definitionId)
    const after = useGame.getState()
    const newShadow = findNewShadow(before.ownedShadows ?? [], after.ownedShadows ?? [])
    if (!newShadow) return
    setSelectedShadowId(newShadow.instanceId)
    setShadowReveal({
      shadow: newShadow,
      source: 'shard',
      isNew: !hasDefinitionBefore(before.ownedShadows ?? [], newShadow),
      isDuplicate: hasDefinitionBefore(before.ownedShadows ?? [], newShadow),
      title: 'SHARD RESONANCE',
      message: '조각이 맞물리며 그림자의 형상이 완성되었다.',
      detail: '흩어진 흔적들이 하나의 병사로 응답했다.',
    })
  }

  const handleShardExchange = (ticketType: (typeof shardEntries)[number]['ticketType']) => {
    const before = useGame.getState()
    exchangeShadowSummonShards(ticketType)
    const after = useGame.getState()
    const beforeTicketIds = new Set((before.shadowSummonTickets ?? []).map(ticket => ticket.id))
    const ticket = (after.shadowSummonTickets ?? []).find(item => !beforeTicketIds.has(item.id))
    if (ticket) {
      setShadowReveal({
        source: 'shard',
        success: true,
        ticketLabel: ticket.label,
        title: 'SUMMON TICKET FORGED',
        message: '조각의 결속이 소환권의 표식으로 완성되었다.',
        detail: '아직 그림자의 정체는 드러나지 않았다. 표식만 군단 기록에 보관된다.',
      })
    }
  }

  const codexDefs = SHADOW_DEFINITIONS.filter(def => {
    const instances = ownedShadows.filter(shadow => shadow.definitionId === def.id)
    const owned = instances.length > 0
    const hidden = !owned && def.hiddenUntilObtained
    if (ownershipFilter === 'owned' && !owned) return false
    if (ownershipFilter === 'unowned' && owned) return false
    if (hidden && (sourceFilter !== 'all' || roleFilter !== 'all' || rarityFilter !== 'all' || gradeFilter !== 'all')) return false
    if (sourceFilter !== 'all' && definitionSourceKey(def) !== sourceFilter) return false
    if (roleFilter !== 'all' && def.role !== roleFilter) return false
    if (rarityFilter !== 'all' && def.rarity !== rarityFilter) return false
    if (gradeFilter !== 'all' && !instances.some(shadow => (shadow.innateGrade ?? 'B') === gradeFilter)) return false
    if (statusFilter === 'equipped' && !instances.some(shadow => equippedShadowIds.includes(shadow.instanceId))) return false
    if (statusFilter === 'favorite' && !instances.some(shadow => shadow.isFavorite)) return false
    if (statusFilter === 'locked' && !instances.some(shadow => shadow.isLocked)) return false
    if (statusFilter === 'evolution_ready' && !instances.some(shadow => canEvolveShadow(shadow, shadowEssence).canEvolve)) return false
    if (normalizedQuery && !definitionSearchText(def, owned).includes(normalizedQuery)) return false
    return true
  })
  const featuredShadows = useMemo(() => {
    const picked = new Map<string, OwnedShadow>()
    const add = (shadow?: OwnedShadow) => {
      if (shadow) picked.set(shadow.instanceId, shadow)
    }
    equippedShadows.forEach(add)
    sortShadows(ownedShadows.filter(shadow => shadow.isFavorite), 'rarity', equippedShadowIds, shadowEssence).forEach(add)
    sortShadows(ownedShadows, 'rarity', equippedShadowIds, shadowEssence)
      .sort((a, b) => shadowPowerScore(b) - shadowPowerScore(a))
      .forEach(add)
    return Array.from(picked.values()).slice(0, 4)
  }, [equippedShadowIds, equippedShadows, ownedShadows, shadowEssence])
  const selectedShadow = useMemo(() => {
    return ownedShadows.find(shadow => shadow.instanceId === selectedShadowId)
      ?? featuredShadows[0]
      ?? filteredOwned[0]
      ?? ownedShadows[0]
  }, [featuredShadows, filteredOwned, ownedShadows, selectedShadowId])
  const legionPower = getShadowArmyCombatPower(equippedShadows).totalPower
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

  const reawakenedSteps: RevealStep[] = reawakenedResult
    ? [
        {
          title: 'INNATE REAWAKENING',
          text: `${reawakenedResult.shadowName}의 한계 회로가 공명한다.`,
          subtext: '태생 잠재력을 일깨워 한 단계 높은 마력을 확보합니다.',
          durationMs: 850,
          tone: 'shadow',
        },
        {
          title: 'RESONATE',
          text: reawakenedResult.success ? '영혼의 한계가 마침내 돌파되었다!' : '마력 회로의 공명이 안정적으로 흡수되었습니다.',
          subtext: '그림자 정수 100개 소모',
          durationMs: 950,
          tone: reawakenedResult.success ? 'success' : 'failure',
          emphasis: true,
        },
      ]
    : []

  const traitSteps: RevealStep[] = traitRerollResult
    ? [
        {
          title: 'TRAIT RESEARCH',
          text: `${traitRerollResult.shadow.name}의 영혼 성좌에 영적 가공을 수행합니다.`,
          subtext: '무작위 특성을 획득하여 새로운 결속 보정을 부여합니다.',
          durationMs: 850,
          tone: 'shadow',
        },
        {
          title: 'SOUL BIND',
          text: '성좌의 결에 따라 그림자 특성이 세겨집니다.',
          subtext: `그림자 정수 ${traitRerollResult.cost}개 소모`,
          durationMs: 950,
          tone: 'success',
          emphasis: true,
        },
      ]
    : []

  const slotSteps: RevealStep[] = slotUnlockResult
    ? [
        {
          title: 'CIRCUIT EXPANSION',
          text: `${slotUnlockResult.shadow.name}의 심장에 추가 마력의 길이 개방됩니다.`,
          subtext: '마력 결속 한계를 늘려 특별한 기운을 수용할 장치를 확장합니다.',
          durationMs: 800,
          tone: 'shadow',
        },
        {
          title: 'UNLOCK COMPLETE',
          text: `${slotUnlockResult.type === 'skill' ? '액티브 보조 스킬' : '패시브 능력'} 슬롯 개방 성공!`,
          subtext: `그림자 정수 ${slotUnlockResult.cost}개 소모`,
          durationMs: 900,
          tone: 'success',
          emphasis: true,
        },
      ]
    : []

  return (
    <div className="space-y-4">
      {/* Evolution Reveal Modal */}
      <DramaticReveal
        isOpen={Boolean(pendingEvolution)}
        steps={evolutionSteps}
        tone="shadow"
        position="modal"
        result={pendingEvolution && (() => {
          const targetDef = SHADOW_DEFINITIONS.find(d => d.name === pendingEvolution.targetName)
          const currentGrade = pendingEvolution.shadow.innateGrade ?? 'B'
          
          return (
            <div className="text-center py-2">
              <div className="relative mx-auto mb-3 max-w-[220px]">
                <div className="pointer-events-none absolute inset-0 rounded-full border border-purple-300/20 shadow-[0_0_52px_rgba(168,85,247,0.35)] animate-pulse" />
                <ShadowPortrait
                  definition={targetDef}
                  size="xl"
                  active={true}
                  highlighted={true}
                  innateGrade={currentGrade}
                  className="mx-auto"
                />
              </div>
              <div className="system-text text-[10px] text-cyan-300">EVOLUTION SUCCESS</div>
              <h3 className="mt-1 text-2xl font-black text-white">{pendingEvolution.targetName}</h3>
              <p className="mt-2 text-xs text-white/65">
                레벨 1로 환원되었으나 기본 스탯 한계 돌파 및 새로운 군주급 외형과 기운을 각성하였습니다!
              </p>
            </div>
          )
        })()}
        onComplete={() => {
          if (pendingEvolution) evolveShadow(pendingEvolution.shadow.instanceId)
          setPendingEvolution(undefined)
        }}
      />

      {/* Innate Reawakening Reveal Modal */}
      <DramaticReveal
        isOpen={Boolean(reawakenedResult)}
        steps={reawakenedSteps}
        tone={reawakenedResult?.success ? 'success' : 'failure'}
        position="modal"
        result={reawakenedResult && (
          <div className="text-center py-2">
            <div className="relative mx-auto mb-3 max-w-[200px]">
              {reawakenedResult.success ? (
                <div className="pointer-events-none absolute inset-0 rounded-full border border-amber-300/35 shadow-[0_0_60px_rgba(245,158,11,0.4)] animate-pulse" />
              ) : (
                <div className="pointer-events-none absolute inset-0 rounded-full border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
              )}
              <ShadowPortrait
                shadow={reawakenedResult.shadow}
                size="lg"
                active={true}
                highlighted={reawakenedResult.success}
                innateGrade={reawakenedResult.afterGrade}
                className="mx-auto"
              />
            </div>
            {reawakenedResult.success ? (
              <>
                <div className="system-text text-[10px] text-amber-300 animate-bounce">GRADE BREAKTHROUGH!</div>
                <h3 className="mt-1 text-2xl font-black text-amber-100">{reawakenedResult.shadowName} 재각성 성공</h3>
                <div className="mt-3 flex items-center justify-center gap-3 text-lg font-black">
                  <span className="text-slate-400 border border-white/10 bg-black/30 px-2.5 py-0.5 rounded text-sm">{reawakenedResult.beforeGrade}</span>
                  <span className="text-amber-400">➔</span>
                  <span className="text-amber-300 border border-amber-300/30 bg-amber-400/10 px-3 py-0.5 rounded shadow-glow text-sm">{reawakenedResult.afterGrade}</span>
                </div>
                <p className="mt-3 text-xs text-white/70">태생 스탯 보정치 및 고유 군단 전투력이 상승하였습니다.</p>
              </>
            ) : (
              <>
                <div className="system-text text-[10px] text-slate-400">RESEARCH HELD</div>
                <h3 className="mt-1 text-xl font-bold text-white/90">태생 등급 재각성 실패</h3>
                <div className="mt-2 text-xs text-white/60">
                  각성 시그널이 도달했으나 한계는 깨어지지 않았습니다.<br />
                  <span className="text-emerald-400 font-bold">안전 장치로 인해 태생 등급 {reawakenedResult.beforeGrade}이(가) 유지되었습니다.</span>
                </div>
              </>
            )}
          </div>
        )}
        onComplete={() => setReawakenedResult(undefined)}
        onSkip={() => setReawakenedResult(undefined)}
      />

      {/* Trait Reroll Reveal Modal */}
      <DramaticReveal
        isOpen={Boolean(traitRerollResult)}
        steps={traitSteps}
        tone="success"
        position="modal"
        result={traitRerollResult && (() => {
          const beforeTrait = SHADOW_TRAIT_DEFINITIONS.find(t => t.id === traitRerollResult.beforeTraitId)
          const afterTrait = SHADOW_TRAIT_DEFINITIONS.find(t => t.id === traitRerollResult.afterTraitId)
          if (!afterTrait) return null
          
          return (
            <div className="text-center py-2">
              <div className="system-text text-[10px] text-purple-300">TRAIT AWAKENED</div>
              <h3 className="mt-1 text-2xl font-black text-white">{traitRerollResult.shadow.name}</h3>
              
              <div className="mt-4 max-w-sm mx-auto space-y-3">
                {beforeTrait && (
                  <div className="opacity-45 scale-90 border border-white/5 bg-ink-950/40 p-2 rounded text-left text-xs">
                    <div className="text-[9px] text-white/30">이전 특성</div>
                    <div className="font-bold text-white/60">{beforeTrait.name}</div>
                    <div className="text-[9px] text-white/40">{beforeTrait.description}</div>
                  </div>
                )}
                
                {beforeTrait && <div className="text-purple-400 text-xs">▼ 새로운 성좌가 각인되었습니다 ▼</div>}
                
                <div className={clsx(
                  'border p-3 rounded-lg text-left shadow-glow animate-pulse',
                  afterTrait.rarity === 'legendary' ? 'border-amber-400/35 bg-amber-400/10' :
                  afterTrait.rarity === 'epic' ? 'border-purple-400/35 bg-purple-400/10' :
                  afterTrait.rarity === 'rare' ? 'border-cyan-400/30 bg-cyan-400/10' : 'border-slate-500/20 bg-slate-400/8'
                )}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-white/50">획득한 특성</span>
                    <span className={clsx(
                      'text-[9px] uppercase font-black px-1.5 py-0.5 rounded border',
                      afterTrait.rarity === 'legendary' ? 'border-amber-300/30 bg-amber-400/20 text-amber-200' :
                      afterTrait.rarity === 'epic' ? 'border-purple-300/30 bg-purple-400/20 text-purple-200' :
                      afterTrait.rarity === 'rare' ? 'border-cyan-300/30 bg-cyan-400/20 text-cyan-200' : 'border-slate-400/20 bg-slate-400/10 text-slate-300'
                    )}>{afterTrait.rarity}</span>
                  </div>
                  <div className="mt-1 font-bold text-base text-white">{afterTrait.name}</div>
                  <div className="mt-1 text-xs text-white/80 font-medium">{afterTrait.description}</div>
                </div>
              </div>
            </div>
          )
        })()}
        onComplete={() => setTraitRerollResult(undefined)}
        onSkip={() => setTraitRerollResult(undefined)}
      />

      {/* Slot Unlock Reveal Modal */}
      <DramaticReveal
        isOpen={Boolean(slotUnlockResult)}
        steps={slotSteps}
        tone="success"
        position="modal"
        result={slotUnlockResult && (
          <div className="text-center py-2">
            <div className="relative mx-auto mb-3 max-w-[180px]">
              <div className="pointer-events-none absolute inset-0 rounded-full border border-cyan-300/35 shadow-[0_0_48px_rgba(34,211,238,0.35)] animate-pulse" />
              <ShadowPortrait
                shadow={slotUnlockResult.shadow}
                size="lg"
                active={true}
                highlighted={true}
                className="mx-auto"
              />
            </div>
            <div className="system-text text-[10px] text-cyan-300">MAGIC CORE EXPANDED</div>
            <h3 className="mt-1 text-xl font-black text-white">{slotUnlockResult.shadow.name} 회로 개방</h3>
            
            <div className="mt-3 inline-flex items-center gap-2 rounded border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 font-bold text-cyan-100 shadow-glow">
              <Sparkles className="h-4 w-4 animate-spin text-cyan-200" />
              <span>새로운 {slotUnlockResult.type === 'skill' ? '액티브 보조 스킬' : '패시브'} 슬롯 활성화!</span>
            </div>
            <p className="mt-3 text-xs text-white/60">
              상단의 마력 회로 탭에서 강력한 패시브 또는 액티브 기운을 직접 장착하세요.
            </p>
          </div>
        )}
        onComplete={() => setSlotUnlockResult(undefined)}
        onSkip={() => setSlotUnlockResult(undefined)}
      />

      {/* Shadow Mutation Reveal Modal */}
      <DramaticReveal
        isOpen={Boolean(mutationResult)}
        steps={[
          { text: '심연의 마력이 소용돌이칩니다...', tone: 'shadow' as const },
          { text: '변이 촉매가 그림자의 영혼을 휘감습니다!', tone: 'shadow' as const },
          { text: '외형의 속성이 새로운 형태로 재구성됩니다...', tone: 'shadow' as const },
          { text: '그림자가 완전히 새로운 변주를 이룩했습니다!', tone: 'success' as const }
        ]}
        tone="shadow"
        position="modal"
        result={mutationResult && (
          <div className="text-center py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="system-text text-[10px] text-cyan-300">SHADOW MUTATED</div>
            <h3 className="mt-1 text-2xl font-black text-white">{mutationResult.shadow.name} 변이 완료</h3>
            
            <div className="my-4 relative mx-auto max-w-[140px]">
              <div className="pointer-events-none absolute inset-0 rounded-full border border-purple-500/35 shadow-[0_0_36px_rgba(168,85,247,0.4)] animate-pulse" />
              <ShadowPortrait shadow={mutationResult.shadow} size="lg" active highlighted innateGrade={mutationResult.shadow.innateGrade} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-left text-xs max-w-sm mx-auto">
              <div className="border border-white/5 bg-ink-950/40 p-2 rounded">
                <div className="text-[10px] text-white/40 mb-1 font-bold">능력치 변화</div>
                <div className="space-y-1">
                  {Object.keys(mutationResult.afterStats).map(key => {
                    const beforeVal = mutationResult.beforeStats[key] ?? 0
                    const afterVal = mutationResult.afterStats[key] ?? 0
                    const delta = afterVal - beforeVal
                    if (delta <= 0) return null
                    const statLabel = SHADOW_STAT_LABEL[key as ShadowStatKey] || key
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-white/60">{statLabel}</span>
                        <span className="text-emerald-400 font-bold">+{delta} ({beforeVal} → {afterVal})</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="border border-white/5 bg-ink-950/40 p-2 rounded flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-white/40 mb-1 font-bold">외형 재구성</div>
                  <div className="space-y-0.5 text-[10px] tabular-nums">
                    <div>색상: <span style={{ color: mutationResult.shadow.mutation?.visualOverrides?.accentColor }} className="font-bold">{mutationResult.shadow.mutation?.visualOverrides?.accentColor}</span></div>
                    <div>오라: <span className="text-white/80 font-bold">{mutationResult.shadow.mutation?.visualOverrides?.auraType}</span></div>
                    <div>눈빛: <span className="text-white/80 font-bold">{mutationResult.shadow.mutation?.visualOverrides?.eyeStyle}</span></div>
                    <div>무기: <span className="text-white/80 font-bold">{mutationResult.shadow.mutation?.visualOverrides?.weaponShape}</span></div>
                    <div>강도: <span className="text-white/80 font-bold">{mutationResult.shadow.mutation?.visualOverrides?.visualIntensity}x</span></div>
                  </div>
                </div>
                <div className="text-[9px] text-cyan-300 mt-2">단계: {mutationResult.shadow.mutation?.mutationStage}단계 변이</div>
              </div>
            </div>

            {mutationResult.newTraits.length > 0 && (
              <div className="mt-3 max-w-sm mx-auto border border-amber-500/25 bg-amber-500/10 p-2.5 rounded-lg text-left">
                <div className="text-[10px] text-amber-200/60 font-bold">★ 새로운 특성 획득! ★</div>
                <div className="mt-1 text-xs font-bold text-white leading-relaxed">
                  {mutationResult.newTraits.map((trait, i) => (
                    <div key={i}>{trait}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        onComplete={() => setMutationResult(undefined)}
        onSkip={() => setMutationResult(undefined)}
      />

      <ShadowRevealModal reveal={shadowReveal} onClose={() => setShadowReveal(undefined)} />

      {sweepResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-xl border border-cyan-400/35 bg-ink-900/95 p-6 shadow-[0_0_50px_rgba(34,211,238,0.25)] corner-bracket text-center">
            <div className="br" />
            <h3 className="text-xl font-bold text-cyan-200 mb-2">그림자 자동 소탕 보고서</h3>
            <p className="text-xs text-white/55 mb-4">그림자들이 심연을 헤치고 돌아왔습니다.</p>
            
            <div className="my-3 border border-white/5 bg-ink-950/60 p-4 rounded text-left space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-white/60 font-semibold">소탕 누적 시간</span>
                <span className="text-white font-black">{sweepResult.elapsedMinutes}분 경과</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-ink-900/60 border border-white/5 p-2 rounded">
                  <div className="text-[10px] text-white/40 mb-1">획득 골드</div>
                  <div className="text-yellow-400 font-black">+{sweepResult.gold}</div>
                </div>
                <div className="bg-ink-900/60 border border-white/5 p-2 rounded">
                  <div className="text-[10px] text-white/40 mb-1">획득 정수</div>
                  <div className="text-cyan-400 font-black">+{sweepResult.shadowEssence}</div>
                </div>
                <div className="bg-ink-900/60 border border-white/5 p-2 rounded">
                  <div className="text-[10px] text-white/40 mb-1">획득 경험치</div>
                  <div className="text-purple-400 font-black">+{sweepResult.xp}</div>
                </div>
              </div>

              {sweepResult.items.length > 0 && (
                <div>
                  <div className="text-[11px] text-white/40 mb-1.5 font-semibold">전리품 획득</div>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {sweepResult.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-ink-900/40 p-1.5 rounded border border-white/5 text-[11px]">
                        <span className="text-sm shrink-0">{item.icon}</span>
                        <span className="text-white/70 truncate flex-1">{item.name}</span>
                        <span className="text-cyan-300 font-bold shrink-0">+{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sweepResult.mutatedNames.length > 0 && (
                <div className="border border-purple-500/25 bg-purple-500/5 p-2 rounded">
                  <div className="text-[11px] text-purple-300 mb-1 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    <span>그림자 자동 변이 발생!</span>
                  </div>
                  <p className="text-[10px] text-white/70">
                    격에 맞는 변이 재료를 획득하여 스스로 강해진 그림자:
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Array.from(new Set(sweepResult.mutatedNames)).map((name, i) => (
                      <span key={i} className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-200 border border-purple-500/35 font-bold">
                        🧪 {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSweepResult(null)}
              className="mt-4 w-full rounded-md border border-cyan-400/50 bg-cyan-400/20 py-2.5 text-sm font-bold text-cyan-50 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-cyan-400/30 transition-all cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <div className="panel corner-bracket overflow-hidden p-5 border-purple-400/25 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.2),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.75),rgba(2,6,23,0.94))]">
        <div className="br" />
        {/* 1. DEPLOYED LEGION (출전 군단) - 맨 상단 배치 */}
        <div className="mb-5">
          <div className="rounded-lg border border-purple-500/25 bg-purple-950/10 p-4 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]">
            <div className="mb-3 flex items-center gap-2">
              <Eclipse className="h-4 w-4 text-cyan-300 animate-pulse" />
              <div className="system-text text-[11px] text-cyan-300 font-bold tracking-wider">LEGION DEPLOYMENT</div>
              <span className="text-[10px] text-white/45 font-bold">
                ({equippedShadows.length} / {slotCount} 출전)
              </span>
              {equippedShadowIds.length > slotCount && (
                <span className="text-[9px] text-rose-300 border border-rose-500/30 bg-rose-500/10 rounded px-1.5 py-0.5 animate-pulse ml-2">
                  슬롯 초과 감지! 앞 {slotCount}명만 출전합니다.
                </span>
              )}
              <div className="h-px flex-1 bg-gradient-to-r from-cyan-300/20 to-transparent" />
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: slotCount }).map((_, idx) => {
                const shadow = equippedShadows[idx]
                if (!shadow) {
                  return (
                    <motion.div
                      key={`empty-slot-${idx}`}
                      whileHover={{ scale: 1.02 }}
                      className="border border-dashed border-white/10 hover:border-purple-400/30 bg-black/45 hover:bg-purple-950/5 rounded-xl p-4 flex flex-col items-center justify-center min-h-[170px] text-center transition duration-300"
                    >
                      <Lock className="w-5 h-5 text-white/20 mb-2 animate-pulse" />
                      <div className="text-[10px] system-text text-white/30 font-black tracking-wider">SLOT {idx + 1}</div>
                      <div className="text-xs text-white/35 font-semibold mt-1">배치 대기 중</div>
                    </motion.div>
                  )
                }

                const selected = selectedShadow?.instanceId === shadow.instanceId
                const combatProfile = getShadowCombatProfile(shadow)
                const isNamed = shadow && Boolean(shadow.isNamed || shadow.isGateNamed || shadow.isAchievementNamed)
                
                return (
                  <motion.div
                    key={shadow.instanceId}
                    onClick={() => setSelectedShadowId(shadow.instanceId)}
                    whileHover={{ y: -6, scale: 1.04 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={clsx(
                      "group relative min-w-0 overflow-hidden rounded-xl border p-4 text-center cursor-pointer flex flex-col justify-between min-h-[170px] transition duration-300",
                      selected
                        ? 'border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                        : 'border-purple-500/20 bg-ink-900/55 hover:border-cyan-400/40 hover:bg-cyan-950/5 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[9px] system-text text-white/45 mb-2.5">
                        <span className="text-cyan-300 font-black tracking-wider">SLOT {idx + 1}</span>
                        <span className="opacity-80">{SHADOW_RARITY_LABEL[shadow.rarity]}</span>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2">
                        <ShadowPortrait shadow={shadow} size="lg" active={true} highlighted={isNamed} innateGrade={shadow.innateGrade} />
                        <div className="min-w-0 w-full">
                          <div className="truncate text-sm font-extrabold text-white leading-tight">{shadow.name}</div>
                          <div className="text-[10px] system-text text-white/40 mt-1 font-semibold">Lv.{shadow.level ?? 1} · {SHADOW_ROLE_LABEL[shadow.role]}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-black system-text text-amber-300 truncate">SCP {combatProfile.totalPower.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          unequipShadow(shadow.instanceId)
                        }}
                        className="px-2 py-1 border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/5 hover:bg-rose-500/20 text-[9px] font-bold text-rose-300 rounded transition duration-200"
                      >
                        해제
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 2. 도감/보유 목록 컨트롤 패널 (필터/검색) */}
        {(view as string) !== 'autosweep' ? (
          <div className="panel corner-bracket p-3 border-white/10 bg-ink-950/60 mb-3">
            <div className="br" />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[auto_auto_minmax(180px,1fr)]">
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setView('owned')} className={`min-h-10 rounded-md border px-1 py-2 text-[11px] font-bold ${(view as string) === 'owned' ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'border-white/10 bg-ink-900/45 text-white/50 hover:text-white/80'}`}>보유</button>
                <button type="button" onClick={() => setView('codex')} className={`min-h-10 rounded-md border px-1 py-2 text-[11px] font-bold ${(view as string) === 'codex' ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'border-white/10 bg-ink-900/45 text-white/50 hover:text-white/80'}`}>도감</button>
                <button type="button" onClick={() => setView('autosweep')} className={`min-h-10 rounded-md border px-1 py-2 text-[11px] font-bold ${(view as string) === 'autosweep' ? 'border-violet-500/50 bg-violet-500/15 text-violet-100 shadow-[0_0_10px_rgba(139,92,246,0.1)]' : 'border-white/10 bg-ink-900/45 text-white/50 hover:text-white/80'}`}>자동 소탕</button>
              </div>
              <select
                value={ownershipFilter}
                onChange={event => {
                  const next = event.target.value as OwnershipFilterKey
                  setOwnershipFilter(next)
                  if (next === 'unowned') setView('codex')
                }}
                className="min-h-10 w-full min-w-0 rounded-md border border-white/10 bg-ink-900/80 px-3 py-2 text-xs text-white/70"
              >
                {ownershipFilters.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
              <label className="relative block min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="그림자 검색"
                  className="min-h-10 w-full rounded-md border border-white/10 bg-ink-900/80 py-2 pl-9 pr-3 text-xs text-white/75 outline-none placeholder:text-white/30 focus:border-cyan-300/45"
                />
              </label>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
              <select value={sourceFilter} onChange={event => setSourceFilter(event.target.value as SourceFilterKey)} className="min-h-10 min-w-0 rounded-md border border-white/10 bg-ink-900/80 px-2 py-2 text-xs text-white/70">
                {sourceFilters.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
              <select value={roleFilter} onChange={event => setRoleFilter(event.target.value as RoleFilterKey)} className="min-h-10 min-w-0 rounded-md border border-white/10 bg-ink-900/80 px-2 py-2 text-xs text-white/70">
                {roleFilters.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as StatusFilterKey)} className="min-h-10 min-w-0 rounded-md border border-white/10 bg-ink-900/80 px-2 py-2 text-xs text-white/70">
                {statusFilters.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
              <select value={rarityFilter} onChange={event => setRarityFilter(event.target.value as RarityFilterKey)} className="min-h-10 min-w-0 rounded-md border border-white/10 bg-ink-900/80 px-2 py-2 text-xs text-white/70">
                {rarityFilters.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
              <select value={gradeFilter} onChange={event => setGradeFilter(event.target.value as GradeFilterKey)} className="min-h-10 min-w-0 rounded-md border border-white/10 bg-ink-900/80 px-2 py-2 text-xs text-white/70">
                {gradeFilters.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
              <select value={sort} onChange={event => setSort(event.target.value as SortKey)} className="min-h-10 min-w-0 rounded-md border border-white/10 bg-ink-900/80 px-2 py-2 text-xs text-white/70 sm:col-span-2 xl:col-span-2">
                <option value="obtained">기본순 (출전·즐겨찾기·잠금)</option>
                <option value="rarity">희귀도순</option>
                <option value="innateGrade">태생 등급순</option>
                <option value="level">레벨순</option>
                <option value="enhancement">강화순</option>
                <option value="evolution">진화 가능순</option>
                <option value="rank">계급순</option>
                <option value="name">이름순</option>
                <option value="favorite">즐겨찾기순</option>
                <option value="locked">잠금순</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="panel corner-bracket p-3 border-white/10 bg-ink-950/60 mb-3">
            <div className="br" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setView('owned')} className={`min-h-10 rounded-md border px-3 py-2 text-xs font-bold ${(view as string) === 'owned' ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'border-white/10 bg-ink-900/45 text-white/50 hover:text-white/80'}`}>보유</button>
              <button type="button" onClick={() => setView('codex')} className={`min-h-10 rounded-md border px-3 py-2 text-xs font-bold ${(view as string) === 'codex' ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'border-white/10 bg-ink-900/45 text-white/50 hover:text-white/80'}`}>도감</button>
              <button type="button" onClick={() => setView('autosweep')} className={`min-h-10 rounded-md border px-3 py-2 text-xs font-bold ${(view as string) === 'autosweep' ? 'border-violet-500/50 bg-violet-500/15 text-violet-100 shadow-[0_0_10px_rgba(139,92,246,0.1)]' : 'border-white/10 bg-ink-900/45 text-white/50 hover:text-white/80'}`}>자동 소탕</button>
            </div>
          </div>
        )}

        {/* 3. 메인 그리드 영역 (도감/보유 목록 + 우측 상세 정보 패널) */}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px] items-start mb-5">
          <div className="space-y-3">
            {view === 'owned' ? (
              <div className="relative pb-6">
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                  {(isExpanded ? filteredOwned : filteredOwned.slice(0, 3)).map(shadow => {
                    const equipped = equippedShadowIds.includes(shadow.instanceId)
                    const materialCount = getShadowAbsorbMaterialCount(shadow, ownedShadows, equippedShadowIds)
                    return (
                      <VisualShadowCard
                        key={shadow.instanceId}
                        shadow={shadow}
                        equipped={equipped}
                        selected={selectedShadow?.instanceId === shadow.instanceId}
                        onSelect={() => setSelectedShadowId(shadow.instanceId)}
                        canEquip={equipped || equippedShadowIds.length < slotCount}
                        onEquip={() => equipShadow(shadow.instanceId)}
                        onUnequip={() => unequipShadow(shadow.instanceId)}
                        shadowEssence={shadowEssence}
                        materialCount={materialCount}
                        onAbsorb={() => absorbShadow(shadow.instanceId)}
                        onDecompose={() => decomposeShadow(shadow.instanceId)}
                        onToggleLock={() => toggleShadowLock(shadow.instanceId)}
                        onToggleFavorite={() => toggleShadowFavorite(shadow.instanceId)}
                        onEvolve={() => evolveShadow(shadow.instanceId)}
                        onRestoreCollapsed={() => restoreShadowFromCollapse(shadow.instanceId)}
                        onCrystallize={() => crystallizeCollapsedShadow(shadow.instanceId)}
                      />
                    )
                  })}
                  {filteredOwned.length === 0 && (
                    <div className="panel corner-bracket p-10 text-center text-sm text-white/45 sm:col-span-2 2xl:col-span-3">
                      <div className="br" />
                      조건에 맞는 보유 그림자가 없습니다.
                    </div>
                  )}
                </div>

                {!isExpanded && filteredOwned.length > 3 && (
                  <div className="absolute bottom-12 left-0 right-0 h-28 bg-gradient-to-t from-ink-950 via-ink-950/85 to-transparent pointer-events-none z-10" />
                )}

                {filteredOwned.length > 3 && (
                  <div className="mt-4 flex justify-center relative z-20">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-1.5 px-6 py-2 rounded-full border border-cyan-400/25 bg-cyan-400/5 hover:bg-cyan-400/10 text-xs font-bold text-cyan-200/95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.08)] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] group animate-pulse"
                    >
                      {isExpanded ? (
                        <>
                          <span>접기</span>
                          <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                        </>
                      ) : (
                        <>
                          <span>더 보기 ({filteredOwned.length - 3}개 더 있음)</span>
                          <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : view === 'codex' ? (
              <div className="relative pb-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(isExpanded ? codexDefs : codexDefs.slice(0, 3)).map(def => {
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
                        fragmentCount={shadowFragments[def.id] ?? 0}
                        failCount={shadowExtractFailCount[def.sourceGateId ?? ''] ?? 0}
                      />
                    )
                  })}
                </div>

                {!isExpanded && codexDefs.length > 3 && (
                  <div className="absolute bottom-12 left-0 right-0 h-28 bg-gradient-to-t from-ink-950 via-ink-950/85 to-transparent pointer-events-none z-10" />
                )}

                {codexDefs.length > 3 && (
                  <div className="mt-4 flex justify-center relative z-20">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-1.5 px-6 py-2 rounded-full border border-cyan-400/25 bg-cyan-400/5 hover:bg-cyan-400/10 text-xs font-bold text-cyan-200/95 transition-all shadow-[0_0_15px_rgba(34,211,238,0.08)] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] group animate-pulse"
                    >
                      {isExpanded ? (
                        <>
                          <span>접기</span>
                          <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                        </>
                      ) : (
                        <>
                          <span>더 보기 ({codexDefs.length - 3}개 더 있음)</span>
                          <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Dashboard */}
                <div className="panel corner-bracket p-4 border-violet-500/20 bg-violet-500/5">
                  <div className="br" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="system-text text-[10px] text-violet-300">AUTO SWEEP SYSTEM</div>
                      <h3 className="text-base font-bold text-violet-100">그림자 자동 소탕</h3>
                      <p className="mt-1 text-[11px] text-white/55">
                        그림자를 소탕에 배치하여 방치형 수입(골드, 정수, 경험치) 및 희귀 전리품을 수급합니다. 격에 맞는 변이 재료 획득 시 스스로 변이합니다.
                      </p>
                    </div>
                    
                    {/* Accumulated Rewards & Claim Button */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-white/40">누적 경과 시간</div>
                        <div className="text-sm font-bold text-white tabular-nums">
                          {(() => {
                            const lastClaimTimeStr = shadowAutoSweepState?.lastClaimTime ?? new Date().toISOString()
                            const elapsedMs = nowTime.getTime() - new Date(lastClaimTimeStr).getTime()
                            const elapsedMin = Math.floor(elapsedMs / 60000)
                            const hrs = Math.floor(elapsedMin / 60)
                            const mins = elapsedMin % 60
                            return `${hrs}시간 ${mins}분 / 24시간`
                          })()}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const res = claimAutoSweepRewards()
                          if (res) {
                            setSweepResult(res)
                          }
                        }}
                        disabled={(() => {
                          const lastClaimTimeStr = shadowAutoSweepState?.lastClaimTime ?? new Date().toISOString()
                          const elapsedMs = nowTime.getTime() - new Date(lastClaimTimeStr).getTime()
                          const elapsedMin = Math.floor(elapsedMs / 60000)
                          return elapsedMin <= 0 || (shadowAutoSweepState?.assignedShadowIds ?? []).length === 0
                        })()}
                        className={clsx(
                          "rounded border px-4 py-2 text-xs font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.15)]",
                          (() => {
                            const lastClaimTimeStr = shadowAutoSweepState?.lastClaimTime ?? new Date().toISOString()
                            const elapsedMs = nowTime.getTime() - new Date(lastClaimTimeStr).getTime()
                            const elapsedMin = Math.floor(elapsedMs / 60000)
                            const canClaim = elapsedMin > 0 && (shadowAutoSweepState?.assignedShadowIds ?? []).length > 0
                            return canClaim
                              ? "border-violet-400 bg-violet-500/20 text-violet-100 hover:bg-violet-500/30 cursor-pointer"
                              : "border-white/5 bg-ink-900/45 text-white/30 cursor-not-allowed"
                          })()
                        )}
                      >
                        소탕 보상 수령
                      </button>
                    </div>
                  </div>

                  {/* Production Stats Summary */}
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                    {(() => {
                      const assignedIds = shadowAutoSweepState?.assignedShadowIds ?? []
                      const assignedShadows = ownedShadows.filter(s => assignedIds.includes(s.instanceId))

                      let totalGoldPerMin = 0
                      let totalEssencePerMin = 0
                      let totalXpPerMin = 0

                      assignedShadows.forEach(shadow => {
                        const level = shadow.level ?? 1
                        const rarityIndex = SHADOW_RARITY_ORDER.indexOf(shadow.rarity)
                        const safeRarityIndex = rarityIndex === -1 ? 0 : rarityIndex

                        totalGoldPerMin += (safeRarityIndex + 1) * 0.2 + level * 0.02
                        totalEssencePerMin += (safeRarityIndex + 1) * 0.05 + level * 0.005
                        totalXpPerMin += 0.2 + level * 0.01
                      })

                      const lastClaimTimeStr = shadowAutoSweepState?.lastClaimTime ?? new Date().toISOString()
                      const elapsedMs = nowTime.getTime() - new Date(lastClaimTimeStr).getTime()
                      const elapsedMin = Math.floor(elapsedMs / 60000)
                      const cappedMin = Math.min(elapsedMin, 1440)

                      const accGold = Math.floor(totalGoldPerMin * cappedMin)
                      const accEssence = Math.floor(totalEssencePerMin * cappedMin)
                      const accXp = Math.floor(totalXpPerMin * cappedMin)

                      return (
                        <>
                          <div className="bg-ink-950/45 p-2 rounded text-center">
                            <span className="block text-[10px] text-white/40">골드 생산</span>
                            <span className="text-xs font-semibold text-yellow-400">+{accGold}</span>
                            <span className="block text-[9px] text-white/30">+{totalGoldPerMin.toFixed(1)}/분</span>
                          </div>
                          <div className="bg-ink-950/45 p-2 rounded text-center">
                            <span className="block text-[10px] text-white/40">그림자 정수 생산</span>
                            <span className="text-xs font-semibold text-cyan-400">+{accEssence}</span>
                            <span className="block text-[9px] text-white/30">+{totalEssencePerMin.toFixed(2)}/분</span>
                          </div>
                          <div className="bg-ink-950/45 p-2 rounded text-center">
                            <span className="block text-[10px] text-white/40">그림자 경험치 생산</span>
                            <span className="text-xs font-semibold text-purple-400">+{accXp}</span>
                            <span className="block text-[9px] text-white/30">+{totalXpPerMin.toFixed(1)}/분</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* 2. Deployed Slots */}
                <div>
                  <h4 className="text-xs font-bold text-white/60 mb-2">배치된 소탕 그림자 ({(shadowAutoSweepState?.assignedShadowIds ?? []).length}/6)</h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, slotIdx) => {
                      const assignedIds = shadowAutoSweepState?.assignedShadowIds ?? []
                      const instanceId = assignedIds[slotIdx]
                      const shadow = instanceId ? ownedShadows.find(sh => sh.instanceId === instanceId) : null

                      if (shadow) {
                        return (
                          <div
                            key={slotIdx}
                            onClick={() => setSelectedShadowId(shadow.instanceId)}
                            className={clsx(
                              "panel corner-bracket p-3 flex flex-col justify-between min-h-[140px] cursor-pointer transition-all border hover:border-violet-400/50",
                              selectedShadowId === shadow.instanceId ? "border-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.15)]" : "border-violet-500/30 bg-ink-950/60"
                            )}
                          >
                            <div className="br" />
                            <div className="flex gap-3">
                              <div className="w-12 h-12 shrink-0 border border-violet-500/35 rounded overflow-hidden">
                                <ShadowPortrait shadow={shadow} size="sm" active highlighted />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] system-text text-violet-400">{SHADOW_RARITY_LABEL[shadow.rarity]}</div>
                                <h5 className="text-xs font-bold text-white truncate">{shadow.name}</h5>
                                <div className="mt-1 text-[9px] text-white/40 space-y-0.5">
                                  <div>Lv.{shadow.level ?? 1} · {SHADOW_ROLE_LABEL[shadow.role]}</div>
                                  <div className="text-purple-300 font-semibold">🧪 변이 {shadow.mutation?.mutationStage ?? 0}/{MAX_SHADOW_MUTATION_STAGE}단계</div>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeShadowFromAutoSweep(shadow.instanceId)
                              }}
                              className="mt-3 w-full rounded bg-red-950/45 hover:bg-red-900/30 border border-red-500/20 text-red-200 py-1 text-[10px] font-bold transition-all"
                            >
                              소탕 배치 해제
                            </button>
                          </div>
                        )
                      }

                      return (
                        <div key={slotIdx} className="panel corner-bracket border-white/5 bg-ink-900/10 p-3 flex flex-col items-center justify-center min-h-[140px] border-dashed border-2">
                          <div className="br" />
                          <span className="text-xs text-white/30 font-semibold mb-1">소탕 대기 슬롯</span>
                          <span className="text-[10px] text-white/20 text-center">아래 대기실에서 그림자를 배치하세요</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Waitlist */}
                <div>
                  <h4 className="text-xs font-bold text-white/60 mb-2">소탕 대기 그림자</h4>
                  {(() => {
                    const assignedIds = shadowAutoSweepState?.assignedShadowIds ?? []
                    const waitlist = ownedShadows.filter(s => !assignedIds.includes(s.instanceId))

                    if (waitlist.length === 0) {
                      return (
                        <div className="panel corner-bracket p-10 text-center text-xs text-white/45 bg-ink-950/45 border-white/5">
                          <div className="br" />
                          대기 중인 그림자가 없습니다.
                        </div>
                      )
                    }

                    return (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {waitlist.map(shadow => (
                          <div
                            key={shadow.instanceId}
                            onClick={() => setSelectedShadowId(shadow.instanceId)}
                            className={clsx(
                              "panel corner-bracket p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all border hover:border-violet-500/50",
                              selectedShadowId === shadow.instanceId ? "border-violet-500/60 bg-violet-500/5" : "border-white/10 bg-ink-950/40"
                            )}
                          >
                            <div className="br" />
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 border border-white/10 rounded overflow-hidden shrink-0">
                                <ShadowPortrait shadow={shadow} size="sm" active />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white/90 truncate">{shadow.name}</h5>
                                <div className="text-[9px] text-white/45">
                                  Lv.{shadow.level ?? 1} · {SHADOW_RARITY_LABEL[shadow.rarity]}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                assignShadowToAutoSweep(shadow.instanceId)
                              }}
                              disabled={assignedIds.length >= 6}
                              className={clsx(
                                "rounded px-2.5 py-1 text-[10px] font-bold border shrink-0 transition-all",
                                assignedIds.length < 6
                                  ? "border-violet-500/50 bg-violet-500/10 text-violet-200 hover:bg-violet-500/25"
                                  : "border-white/5 bg-ink-900/35 text-white/20 cursor-not-allowed"
                              )}
                            >
                              소탕 배치
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* 우측 sticky 상세 정보 패널 */}
          <div className="xl:sticky xl:top-4">
            <ShadowDetailPanel
              key={selectedShadow?.instanceId ?? 'empty-shadow-detail'}
              shadow={selectedShadow}
              equipped={selectedShadow ? equippedShadowIds.includes(selectedShadow.instanceId) : false}
              shadowEssence={shadowEssence}
            />
          </div>
        </div>
      </div>

      <div className="panel corner-bracket p-4 border-cyan-400/20 bg-cyan-400/5">
          <div className="br" />
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="system-text text-[11px] text-cyan-300/70">SUMMON</div>
              <h3 className="text-base font-bold text-cyan-50">그림자 소환</h3>
              <p className="mt-1 text-[11px] text-white/45">미보유 후보 우선, 중복 네임드는 조각으로 전환됩니다.</p>
            </div>
            <div className="flex gap-2 text-[10px] system-text text-white/50">
              <span className="rounded border border-cyan-300/20 bg-cyan-400/10 px-2 py-1">소환권 {availableTickets.length}</span>
              <span className="rounded border border-purple-300/20 bg-purple-400/10 px-2 py-1">조각 {Object.values(shadowSummonShards).reduce((sum, amount) => sum + (amount ?? 0), 0)}</span>
            </div>
          </div>

          {availableTickets.length > 0 ? (
            <div className="mb-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {availableTickets.map(ticket => {
                const definition = ticket.definitionId ? getShadowDefinition(ticket.definitionId) : undefined
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => handleTicketSummon(ticket.id)}
                    className="flex min-h-16 items-center gap-3 rounded-md border border-cyan-300/20 bg-ink-900/55 px-3 py-2 text-left transition hover:border-cyan-300/45 hover:bg-cyan-400/10"
                  >
                    <Ticket className="h-5 w-5 shrink-0 text-cyan-200" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white/85">{ticket.label}</span>
                      <span className="block text-[10px] system-text text-white/40">
                        {ticket.ticketType === 'category_achievement_named' ? `${ticket.category ?? '분야'} · ${ticket.grade ?? 'standard'}` : ticket.ticketType}
                        {definition ? ` · ${SHADOW_ROLE_LABEL[definition.role]}` : ''}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="mb-3 rounded-md border border-white/10 bg-ink-900/35 px-3 py-2 text-xs text-white/45">사용 가능한 소환권이 없습니다.</div>
          )}

          <div className="mb-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {shardEntries.map(entry => (
              <button
                key={entry.type}
                type="button"
                onClick={() => handleShardExchange(entry.ticketType)}
                disabled={entry.amount < entry.cost}
                className={`flex min-h-16 items-center gap-3 rounded-md border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                  entry.amount >= entry.cost
                    ? 'border-emerald-300/35 bg-emerald-400/10 hover:border-emerald-300/55'
                    : 'border-white/10 bg-ink-900/45'
                }`}
              >
                <Gem className="h-5 w-5 shrink-0 text-emerald-200" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white/85">{entry.label}</span>
                  <span className="block text-[10px] system-text text-white/40">
                    {entry.amount}/{entry.cost} · {entry.amount >= entry.cost ? '교환 가능' : '수집 중'}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {fragmentEntries.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {fragmentEntries.map(entry => (
                <button
                  key={entry.definitionId}
                  type="button"
                  onClick={() => handleFragmentSummon(entry.definitionId)}
                  disabled={!entry.ready}
                  className={`flex min-h-16 items-center gap-3 rounded-md border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    entry.ready
                      ? 'border-purple-300/35 bg-purple-400/10 hover:border-purple-300/55'
                      : 'border-white/10 bg-ink-900/45'
                  }`}
                >
                  <Gem className="h-5 w-5 shrink-0 text-purple-200" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white/85">{entry.definition?.name}</span>
                    <span className="block text-[10px] system-text text-white/40">
                      조각 {entry.amount}/{entry.cost} · {entry.ready ? '소환 가능' : '수집 중'}
                    </span>
                  </span>
                  {entry.ready && <Sparkles className="ml-auto h-4 w-4 shrink-0 text-emerald-200" />}
                </button>
              ))}
            </div>
          )}
      </div>

      {/* 그림자 정수 연구소 & 상점 (Essence Lab) */}
      <div className="panel corner-bracket p-4 border-purple-500/30 bg-ink-950/70">
        <div className="br" />
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setLabOpen(!labOpen)}>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-400" />
            <div>
              <div className="system-text text-[11px] text-purple-300/70">SHADOW ESSENCE RESEARCH LAB & SHOP</div>
              <h3 className="text-base font-bold text-white/95">그림자 정수 연구소 & 상점</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs rounded border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-purple-200">
              보유 그림자 정수: {shadowEssence}
            </span>
            {labOpen ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
          </div>
        </div>

        {labOpen && (
          <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
            {/* 훈련소 & 상점 2단 그리드 */}
            <div className="grid gap-4 md:grid-cols-2">
              
              {/* 그림자 집중 훈련소 */}
              <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/5 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-cyan-300" />
                  <div className="system-text text-[11px] text-cyan-100/75">집중 훈련소</div>
                  <div className="h-px flex-1 bg-gradient-to-r from-cyan-300/25 to-transparent" />
                </div>

                {selectedShadow ? (
                  <div>
                    <div className="mb-3 flex items-center gap-3 rounded-md bg-ink-900/60 p-2 border border-white/5">
                      <ShadowPortrait shadow={selectedShadow} size="sm" active={equippedShadowIds.includes(selectedShadow.instanceId)} innateGrade={selectedShadow.innateGrade} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white/95">{selectedShadow.name}</span>
                          <span className="text-[10px] system-text text-cyan-300">Lv.{selectedShadow.level ?? 1}/{getShadowMaxLevel(selectedShadow)}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400/60 rounded-full" style={{ width: `${Math.min(100, Math.round(((selectedShadow.xp ?? 0) / getShadowXpForNextLevel(selectedShadow.level ?? 1)) * 100))}%` }} />
                          </div>
                          <span className="text-[9px] text-white/40 tabular-nums">{selectedShadow.xp ?? 0}/{getShadowXpForNextLevel(selectedShadow.level ?? 1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {SHADOW_TRAINING_OPTIONS.map(opt => {
                        const costMult = getShadowTrainingCostMultiplier(selectedShadow)
                        const cost = Math.ceil(opt.essenceCost * costMult)
                        const isMax = (selectedShadow.level ?? 1) >= getShadowMaxLevel(selectedShadow)
                        const disabled = shadowEssence < cost || isMax

                        return (
                          <div key={opt.id} className="flex items-center justify-between gap-3 rounded border border-white/5 bg-ink-950/40 p-2 text-xs">
                            <div>
                              <div className="font-semibold text-white/90">{opt.name}</div>
                              <div className="text-[10px] text-cyan-300/80">+{opt.xpGain} XP 지급</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`system-text text-[10px] ${shadowEssence >= cost ? 'text-cyan-200' : 'text-rose-400 font-bold'}`}>
                                정수 {cost}개 {costMult !== 1 && <span className="text-[9px] opacity-70">(x{costMult.toFixed(2)})</span>}
                              </span>
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => trainShadowWithEssence(selectedShadow.instanceId, opt.id)}
                                className="btn btn-primary py-1 px-3 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {isMax ? '최대 레벨' : '훈련'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-2 text-[10px] text-white/45">
                      ※ 무제한으로 훈련 가능하나, 태생 등급, 희귀도, 네임드 여부에 따라 비용 가중치가 부여됩니다. (군단 목록에서 그림자를 선택해 대상을 바꿀 수 있습니다)
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-36 items-center justify-center rounded border border-dashed border-white/10 text-center text-xs text-white/40">
                    훈련시킬 그림자를 위에서 선택해 주세요.
                  </div>
                )}
              </div>

              {/* 그림자 정수 상점 */}
              <div className="rounded-lg border border-purple-400/15 bg-purple-400/5 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <Gem className="h-4 w-4 text-purple-300" />
                  <div className="system-text text-[11px] text-purple-100/75">그림자 정수 상점</div>
                  <div className="h-px flex-1 bg-gradient-to-r from-purple-300/25 to-transparent" />
                </div>

                <div className="space-y-2">
                  {/* 일반 소환권 구매 */}
                  <div className="flex items-center justify-between gap-3 rounded border border-white/5 bg-ink-950/40 p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-cyan-300" />
                      <div>
                        <div className="font-semibold text-white/90">일반 그림자 소환권</div>
                        <div className="text-[10px] text-white/45">인벤토리에 소환권 1장을 즉시 추가합니다.</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`system-text text-[10px] ${shadowEssence >= 60 ? 'text-purple-200' : 'text-rose-400 font-bold'}`}>
                        그림자 정수 60개
                      </span>
                      <button
                        type="button"
                        disabled={shadowEssence < 60}
                        onClick={() => buyShadowTicketWithEssence()}
                        className="btn btn-secondary py-1 px-3 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        구매
                      </button>
                    </div>
                  </div>

                  {/* 추출 보조 촉매 구매 */}
                  <div className="flex items-center justify-between gap-3 rounded border border-white/5 bg-ink-950/40 p-2.5 text-xs">
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-base">🧪</span>
                      <div>
                        <div className="font-semibold text-white/90">그림자 추출 보조 촉매</div>
                        <div className="text-[10px] text-white/45">게이트 후 추출 성공률을 +5% 보정합니다. (자동 소모)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`system-text text-[10px] ${shadowEssence >= 30 ? 'text-purple-200' : 'text-rose-400 font-bold'}`}>
                        그림자 정수 30개
                      </span>
                      <button
                        type="button"
                        disabled={shadowEssence < 30}
                        onClick={() => buyExtractionCatalystWithEssence()}
                        className="btn btn-secondary py-1 px-3 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        구매
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 고급 그림자 정수 연구소 */}
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-300" />
                <div className="system-text text-[11px] text-purple-100/75">고급 그림자 정수 연구소</div>
                <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* 태생 등급 재각성 */}
                {selectedShadow ? (
                  (() => {
                    const level = selectedShadow.level ?? 1
                    const enhance = selectedShadow.enhancementLevel ?? 0
                    const isS = selectedShadow.innateGrade === 'S'
                    const isValid = level >= 10 && enhance >= 3 && !isS
                    const currentGrade = selectedShadow.innateGrade ?? 'B'
                    const successChance = currentGrade === 'C' ? '50%' : currentGrade === 'B' ? '30%' : currentGrade === 'A' ? '10%' : '0%'

                    return (
                      <div className={`rounded-lg border p-3 text-xs flex flex-col justify-between ${
                        isValid 
                          ? 'border-purple-400/35 bg-purple-950/20' 
                          : 'border-white/10 bg-ink-950/45 opacity-60'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-white/95">태생 등급 재각성</span>
                            {isValid ? (
                              <span className="text-[10px] text-emerald-400">시도 가능</span>
                            ) : (
                              <span className="text-[10px] text-white/40">조건 미달</span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/55 leading-relaxed">
                            {selectedShadow.name}의 한계 돌파를 시도합니다. 성공 시 태생 등급이 상승하며, 실패해도 등급은 보존됩니다.
                          </p>
                          <div className="mt-2 space-y-1 text-[10px] system-text text-white/45">
                            <div>대상: <span className="text-white/80">{selectedShadow.name}</span></div>
                            <div>현재 태생: <span className="text-cyan-300">{selectedShadow.innateGrade ?? 'B'}</span></div>
                            <div>성공 시 등급: <span className="text-purple-300">
                              {currentGrade === 'C' ? 'B' : currentGrade === 'B' ? 'A' : currentGrade === 'A' ? 'S' : 'MAX'}
                            </span></div>
                            <div>연구 확률: <span className="text-amber-200">{successChance}</span></div>
                          </div>
                          {!isValid && (
                            <div className="mt-2 rounded border border-rose-500/20 bg-rose-500/10 p-1.5 text-[9px] text-rose-300">
                              요구 조건: Lv.10+ ({level}/10) & 강화 +3+ ({enhance}/3) {isS && ' (최대 등급 도달)'}
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                          <span className={`system-text text-[10px] ${shadowEssence >= 100 ? 'text-purple-200' : 'text-rose-400 font-bold'}`}>
                            그림자 정수 100개
                          </span>
                          <button
                            type="button"
                            disabled={!isValid || shadowEssence < 100}
                            onClick={() => handleReawaken(selectedShadow.instanceId)}
                            className="btn btn-secondary py-1 px-3 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            연구 개시
                          </button>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 bg-ink-950/45 p-3 text-center flex items-center justify-center text-[10px] text-white/40">
                    그림자를 선택하면 재각성 조건이 표시됩니다.
                  </div>
                )}

                {/* 고유 특성 재굴림 & 부여 */}
                {selectedShadow ? (
                  (() => {
                    const maxSlots = getShadowMaxTraitSlots(selectedShadow)
                    const rerolls = selectedShadow.traitRerollCount ?? 0
                    const baseCost = 100 + rerolls * 10
                    const cost = Math.ceil(baseCost * getShadowTrainingCostMultiplier(selectedShadow))
                    const traits = selectedShadow.traitIds ?? []

                    return (
                      <div className="rounded-lg border border-purple-400/35 bg-purple-950/20 p-3 text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-white/95">고유 특성 연구소</span>
                            <span className="text-[10px] text-cyan-300">최대 {maxSlots}개 슬롯</span>
                          </div>
                          <p className="text-[10px] text-white/55 leading-relaxed mb-2">
                            정수를 사용하여 특성을 재굴림하거나 개방합니다. 높은 등급의 특성은 군단 성능을 소폭 보정합니다.
                          </p>
                          <div className="space-y-2">
                            {Array.from({ length: maxSlots }).map((_, idx) => {
                              const traitId = traits[idx]
                              const trait = SHADOW_TRAIT_DEFINITIONS.find(t => t.id === traitId)

                              return (
                                <div key={idx} className="rounded bg-ink-900/60 p-2 border border-white/5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-white/40">슬롯 {idx + 1}</span>
                                    {trait ? (
                                      <span className={`text-[9px] uppercase font-bold ${
                                        trait.rarity === 'legendary' ? 'text-amber-300' :
                                        trait.rarity === 'epic' ? 'text-purple-300' :
                                        trait.rarity === 'rare' ? 'text-cyan-300' : 'text-zinc-400'
                                      }`}>{trait.rarity}</span>
                                    ) : (
                                      <span className="text-[9px] text-rose-400">비어 있음</span>
                                    )}
                                  </div>
                                  {trait ? (
                                    <div className="mt-1">
                                      <div className="font-bold text-white/90 text-[11px]">{trait.name}</div>
                                      <div className="text-[10px] text-white/60">{trait.description}</div>
                                    </div>
                                  ) : (
                                    <div className="mt-1 text-[10px] text-white/40">정수를 소모해 무작위 특성을 영구 부여합니다.</div>
                                  )}
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      type="button"
                                      disabled={shadowEssence < cost}
                                      onClick={() => {
                                        if (window.confirm(`[${selectedShadow.name}]의 ${idx + 1}번째 특성을 재굴림(혹은 신규 부여)하시겠습니까?\n소모 그림자 정수: ${cost}`)) {
                                          handleRerollTrait(selectedShadow.instanceId, idx, cost)
                                        }
                                      }}
                                      className="btn btn-secondary py-0.5 px-2 text-[9px] disabled:opacity-40"
                                    >
                                      {trait ? '재굴림' : '특성 부여'}
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                          <span className="text-[9px] text-white/40">재굴림 횟수: {rerolls}회</span>
                          <span className={`system-text text-[10px] font-bold ${shadowEssence >= cost ? 'text-purple-200' : 'text-rose-400'}`}>
                            정수 {cost}개
                          </span>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 bg-ink-950/45 p-3 text-center flex items-center justify-center text-[10px] text-white/40">
                    그림자를 선택하면 특성 연구소가 활성화됩니다.
                  </div>
                )}

                {/* 그림자 스킬/패시브 슬롯 개방 & 장착 */}
                {selectedShadow ? (
                  (() => {
                    const isNamed = selectedShadow.isAchievementNamed || selectedShadow.isGateNamed || selectedShadow.rank === 'named'
                    const level = selectedShadow.level ?? 1
                    const enhance = selectedShadow.enhancementLevel ?? 0
                    const isRarityOk = ['rare', 'epic', 'legendary'].includes(selectedShadow.rarity) || (selectedShadow.evolutionStage ?? 0) > 0
                    const condMet = isNamed || (level >= 10 && enhance >= 2 && isRarityOk)

                    const skillSlots = selectedShadow.unlockedSkillSlots ?? 0
                    const passiveSlots = selectedShadow.unlockedPassiveSlots ?? 0
                    
                    const skillCost = Math.ceil((skillSlots === 0 ? 200 : 350) * getShadowTrainingCostMultiplier(selectedShadow))
                    const passiveCost = Math.ceil((passiveSlots === 0 ? 150 : 300) * getShadowTrainingCostMultiplier(selectedShadow))

                    const activeSkills = selectedShadow.shadowSkillIds ?? []
                    const activePassives = selectedShadow.shadowPassiveIds ?? []

                    return (
                      <div className="rounded-lg border border-purple-400/35 bg-purple-950/20 p-3 text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-white/95">스킬 / 패시브 마력 회로</span>
                            <span className={`text-[10px] ${condMet ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}`}>
                              {condMet ? '조건 충족' : '조건 잠금'}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/55 leading-relaxed mb-2">
                            마력 슬롯을 개방하여 추가 패시브와 액티브 기운을 장착합니다. 네임드는 조건이 완전 완화됩니다.
                          </p>

                          {!condMet && (
                            <div className="mb-2 rounded border border-rose-500/20 bg-rose-500/10 p-1.5 text-[9px] text-rose-300">
                              요구: Lv.10+ ({level}/10) & 강화 +2+ ({enhance}/2) & 희귀(Rare) 이상
                            </div>
                          )}

                          <div className="space-y-3">
                            {/* 패시브 슬롯 관리 */}
                            <div className="rounded bg-ink-900/60 p-2 border border-white/5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[10px] text-cyan-200">패시브 마력 슬롯 ({passiveSlots}/2)</span>
                                {passiveSlots < 2 && condMet && (
                                  <button
                                    type="button"
                                    disabled={shadowEssence < passiveCost}
                                    onClick={() => handleUnlockSlot(selectedShadow.instanceId, 'passive', passiveCost)}
                                    className="btn btn-primary py-0.5 px-2 text-[9px]"
                                  >
                                    개방 ({passiveCost}정수)
                                  </button>
                                )}
                              </div>
                              {Array.from({ length: passiveSlots }).map((_, idx) => {
                                const activeId = activePassives[idx]
                                return (
                                  <div key={idx} className="flex flex-col gap-1 mt-1.5">
                                    <label className="text-[9px] text-white/40">슬롯 {idx + 1} 패시브 기운</label>
                                    <select
                                      value={activeId ?? ''}
                                      onChange={(e) => equipShadowSlotAbility(selectedShadow.instanceId, 'passive', idx, e.target.value)}
                                      className="rounded border border-white/10 bg-ink-950 px-2 py-1 text-[10px] text-white/80 outline-none"
                                    >
                                      <option value="">-- 패시브 기운 선택 --</option>
                                      {SHADOW_PASSIVE_DEFINITIONS.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.description})</option>
                                      ))}
                                    </select>
                                  </div>
                                )
                              })}
                              {passiveSlots === 0 && <div className="text-[9px] text-white/35">슬롯을 개방하면 강력한 패시브 능력이 부여됩니다.</div>}
                            </div>

                            {/* 스킬 슬롯 관리 */}
                            <div className="rounded bg-ink-900/60 p-2 border border-white/5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[10px] text-cyan-200">액티브 보조 스킬 ({skillSlots}/2)</span>
                                {skillSlots < 2 && condMet && (
                                  <button
                                    type="button"
                                    disabled={shadowEssence < skillCost}
                                    onClick={() => handleUnlockSlot(selectedShadow.instanceId, 'skill', skillCost)}
                                    className="btn btn-primary py-0.5 px-2 text-[9px]"
                                  >
                                    개방 ({skillCost}정수)
                                  </button>
                                )}
                              </div>
                              {Array.from({ length: skillSlots }).map((_, idx) => {
                                const activeId = activeSkills[idx]
                                return (
                                  <div key={idx} className="flex flex-col gap-1 mt-1.5">
                                    <label className="text-[9px] text-white/40">슬롯 {idx + 1} 스킬 기운</label>
                                    <select
                                      value={activeId ?? ''}
                                      onChange={(e) => equipShadowSlotAbility(selectedShadow.instanceId, 'skill', idx, e.target.value)}
                                      className="rounded border border-white/10 bg-ink-950 px-2 py-1 text-[10px] text-white/80 outline-none"
                                    >
                                      <option value="">-- 보조 스킬 선택 --</option>
                                      {SHADOW_SKILL_DEFINITIONS.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.description})</option>
                                      ))}
                                    </select>
                                  </div>
                                )
                              })}
                              {skillSlots === 0 && <div className="text-[9px] text-white/35">슬롯 개방 시 전투 피해/방어를 상시 보조합니다.</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 bg-ink-950/45 p-3 text-center flex items-center justify-center text-[10px] text-white/40">
                    그림자를 선택하면 마력 회로 슬롯 개방이 활성화됩니다.
                  </div>
                )}

                {/* 군단 연구 & 시너지 노드 */}
                <div className="rounded-lg border border-purple-400/35 bg-purple-950/20 p-3 text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white/95">군단 시너지 결속 성좌</span>
                      <span className="text-[10px] text-purple-300">군단 상시 강화</span>
                    </div>
                    <p className="text-[10px] text-white/55 leading-relaxed mb-2.5">
                      정수를 영구 소모해 전체 그림자 병사들에게 상시 적용되는 결속의 성좌 성장을 단련합니다.
                    </p>

                    <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                      {SHADOW_LEGION_NODES.map(node => {
                        const level = shadowLegionNodes[node.id] ?? 0
                        const isMax = level >= node.maxLevel
                        const cost = node.costBase + level * node.costGrowth

                        return (
                          <div key={node.id} className="rounded bg-ink-900/60 p-1.5 border border-white/5 flex items-center justify-between gap-2 text-[10px]">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white/90">{node.name}</span>
                                <span className="text-[9px] text-cyan-300 font-bold">Lv.{level}/{node.maxLevel}</span>
                              </div>
                              <div className="text-[9px] text-white/50 truncate" title={node.description}>{node.description}</div>
                            </div>
                            <button
                              type="button"
                              disabled={isMax || shadowEssence < cost}
                              onClick={() => upgradeLegionNode(node.id)}
                              className="btn btn-secondary py-0.5 px-2 text-[9px] shrink-0"
                            >
                              {isMax ? 'MAX' : `${cost} 그림자 정수`}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 히든 진화 재료 합성 */}
                <div className="rounded-lg border border-purple-400/35 bg-purple-950/20 p-3 text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white/95">히든 진화 물질 합성</span>
                      <span className="text-[10px] text-amber-300 font-semibold">전설 재료</span>
                    </div>
                    <p className="text-[10px] text-white/55 leading-relaxed mb-2.5">
                      대량의 정수를 가공/융합하여 네임드 그림자들의 히든 2차 진화에 필요한 미지의 영적 물체들을 연성합니다.
                    </p>

                    <div className="space-y-1.5">
                      {[
                        { id: 'shadow_hidden_core', name: '그림자 히든 코어', cost: 300, icon: '💎' },
                        { id: 'abyss_evolution_core', name: '심연의 진화핵', cost: 400, icon: '💎' },
                        { id: 'named_shadow_catalyst', name: '네임드 진화 촉매', cost: 350, icon: '🧪' },
                        { id: 'ancient_shadow_relic', name: '고대 그림자 성물', cost: 500, icon: '🏺' }
                      ].map(mat => {
                        return (
                          <div key={mat.id} className="rounded bg-ink-900/60 p-1.5 border border-white/5 flex items-center justify-between gap-2 text-[10px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs">{mat.icon}</span>
                              <span className="font-bold text-white/90 truncate" title={mat.name}>{mat.name}</span>
                            </div>
                            <button
                              type="button"
                              disabled={shadowEssence < mat.cost}
                              onClick={() => {
                                if (window.confirm(`[${mat.name}]을 합성하시겠습니까?\n소모 그림자 정수: ${mat.cost}개`)) {
                                  craftHiddenEvolutionMaterial(mat.id)
                                }
                              }}
                              className="btn btn-secondary py-0.5 px-2 text-[9px] shrink-0"
                            >
                              합성 ({mat.cost}정수)
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 그림자 변이 연구소 */}
                {selectedShadow ? (
                  (() => {
                    const materialNormal = mutationMaterialNormal
                    const materialAdvanced = mutationMaterialAdvanced
                    const materialSupreme = mutationMaterialSupreme

                    const isMaxMutation = (selectedShadow.mutation?.mutationStage ?? 0) >= MAX_SHADOW_MUTATION_STAGE
                    const selectedCount = 
                      selectedMutationGrade === 'normal' ? materialNormal :
                      selectedMutationGrade === 'advanced' ? materialAdvanced :
                      materialSupreme

                    const canMutate = selectedCount >= 1 && !isMaxMutation

                    return (
                      <div className="rounded-lg border border-purple-400/35 bg-purple-950/20 p-3 text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-white/95">그림자 변이 연구소</span>
                            <span className="text-[10px] text-cyan-300">누적: {selectedShadow.mutation?.mutationStage ?? 0}/{MAX_SHADOW_MUTATION_STAGE}회</span>
                          </div>
                          <p className="text-[10px] text-white/55 leading-relaxed mb-3">
                            변이 촉매를 주입하여 그림자의 외형, 능력치, 특성을 영구 변조시킵니다. 평균 스탯은 상승하며 하한선이 보장됩니다.
                          </p>

                          {/* 촉매 등급 선택 */}
                          <div className="space-y-2 mb-3">
                            <label className="text-[10px] text-white/45 block">촉매 등급 선택</label>
                            <div className="grid grid-cols-3 gap-1 bg-black/45 p-1 rounded border border-white/5">
                              {(['normal', 'advanced', 'supreme'] as const).map(grade => {
                                const active = selectedMutationGrade === grade
                                const label = grade === 'normal' ? '일반' : grade === 'advanced' ? '고급' : '최고급'
                                return (
                                  <button
                                    key={grade}
                                    type="button"
                                    onClick={() => setSelectedMutationGrade(grade)}
                                    className={clsx(
                                      'rounded py-1 text-[9px] font-bold text-center border transition',
                                      active 
                                        ? 'border-purple-400/40 bg-purple-500/15 text-purple-200 shadow-glow'
                                        : 'border-transparent bg-transparent text-white/50 hover:text-white/80'
                                    )}
                                  >
                                    <div>{label}</div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* 보유 현황 HUD */}
                          <div className="rounded bg-ink-900/60 p-2 border border-white/5 space-y-1.5 text-[10px]">
                            <div className="flex justify-between items-center text-[9px] text-white/45 pb-1 border-b border-white/5">
                              <span>등급</span>
                              <span>보유 개수</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/60">일반 촉매</span>
                              <span className={clsx('font-bold', materialNormal > 0 ? 'text-white' : 'text-white/30')}>{materialNormal}개</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-purple-300">고급 촉매</span>
                              <span className={clsx('font-bold', materialAdvanced > 0 ? 'text-purple-200' : 'text-white/30')}>{materialAdvanced}개</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-amber-300 font-extrabold">최고급 촉매</span>
                              <span className={clsx('font-bold', materialSupreme > 0 ? 'text-amber-200' : 'text-white/30')}>{materialSupreme}개</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                          <span className="text-[9px] text-white/40">
                            요구: {selectedMutationGrade === 'normal' ? '일반 1개' : selectedMutationGrade === 'advanced' ? '고급 1개' : '최고급 1개'}
                          </span>
                          <button
                            type="button"
                            disabled={!canMutate}
                            onClick={() => handleMutate(selectedShadow.instanceId, selectedMutationGrade)}
                            className="btn btn-secondary py-1 px-3 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isMaxMutation ? '최대 변이 완료' : '변이 주입'}
                          </button>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 bg-ink-950/45 p-3 text-center flex items-center justify-center text-[10px] text-white/40">
                    그림자를 선택하면 변이 연구소가 활성화됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ShadowExpeditionPanel />


    </div>
  )
}
