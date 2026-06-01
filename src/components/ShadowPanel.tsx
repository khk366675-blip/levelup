import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { Crown, Eclipse, Eye, Gem, Lock, Search, Shield, Sparkles, Star, Swords, Ticket, X, ChevronDown, ChevronUp, Dumbbell, FlaskConical } from 'lucide-react'
import { useGame } from '../lib/store'
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
import type { OwnedShadow, ShadowInnateGrade, ShadowRarity, ShadowRole } from '../lib/types'

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
  const breakdownItems = [
    { label: '지원', value: combatProfile.assistPower },
    { label: '수호', value: combatProfile.guardPower },
    { label: '제압', value: combatProfile.controlPower },
    { label: '보스 특화', value: combatProfile.bossPower },
    { label: '원정 전투', value: combatProfile.expeditionPower },
  ]

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
  )
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
  const named = Boolean(shadow.isNamed || shadow.isGateNamed || shadow.isAchievementNamed)
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`panel corner-bracket p-4 card-premium-shine group transition-all duration-300 ${rarityStyle[shadow.rarity]} ${
        equipped ? 'shadow-deployed-glow ring-2 ring-cyan-300/40' : 'hover:border-cyan-400/40 hover:bg-white/[0.015]'
      } ${shadow.innateGrade === 'S' ? 'grade-aura-s' : shadow.innateGrade === 'A' ? 'grade-aura-a' : ''} ${
        (shadow.evolutionStage ?? 0) > 0 ? 'shadow-evolved-card' : ''
      } ${named ? 'named-pulse' : ''}`}
    >
      <div className="br" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] system-text opacity-70">[{SHADOW_RARITY_LABEL[shadow.rarity]}]</div>
          <h3 className="font-bold text-white/90 mt-0.5">{shadow.name}{(shadow.enhancementLevel ?? 0) > 0 ? ` +${shadow.enhancementLevel}` : ''}</h3>
          <div className="text-[11px] text-white/55 mt-1">
            계급: {SHADOW_RANK_LABEL[shadow.rank]} · 역할: {SHADOW_ROLE_LABEL[shadow.role]} · 태생: {SHADOW_INNATE_GRADE_LABEL[shadow.innateGrade ?? 'B']}
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
              {lockedSourceType === 'named_gate' ? '봉인된 네임드 그림자' : '미획득 성취 그림자'}
              </span>
            </div>
          )}
          {hidden && (
            <div className="text-[11px] text-white/55 mt-1">
              계급/역할: 봉인 해제 후 공개
            </div>
          )}
          <div className={`text-[11px] text-white/55 mt-1 ${hidden ? 'hidden' : ''}`}>
            계급: {SHADOW_RANK_LABEL[definition.rank]} · 역할: {SHADOW_ROLE_LABEL[definition.role]}
          </div>
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
      {hidden && (
        <div className="mt-3 text-[11px] text-white/55 leading-relaxed">
          균열 너머에서 존재감만 감지된다.
        </div>
      )}
      <div className={`mt-3 text-[11px] text-white/55 leading-relaxed ${hidden ? 'hidden' : ''}`}>
        {hidden ? '균열 너머에서 존재감만 감지된다.' : definition.description}
      </div>
      {hidden && (
        <div className="mt-2 text-[11px] text-cyan-100/70 leading-relaxed">
          효과: 봉인 해제 후 공개
        </div>
      )}
      <div className={`mt-2 text-[11px] text-cyan-100/70 leading-relaxed ${hidden ? 'hidden' : ''}`}>
        {hidden ? '효과: 봉인 해제 후 공개' : effects.join(' · ')}
      </div>
      <div className="mt-2 text-[10px] text-white/40 system-text">
        조건: {unlockConditionLabel}
      </div>
      {fragmentCount !== undefined && fragmentCount > 0 && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-cyan-200/90 bg-cyan-950/45 px-2 py-1 rounded border border-cyan-800/35">
          <span>그림자 잔향 조각</span>
          <span>{fragmentCount}개 보유 {!owned && `(소환 필요: ${SHADOW_FRAGMENT_SUMMON_COST[definition.rarity] ?? 20}개)`}</span>
        </div>
      )}
      {failCount !== undefined && failCount > 0 && !owned && (
        <div className="mt-1 flex items-center justify-between text-[10px] text-amber-200/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/30">
          <span>실패 공명 누적</span>
          <span>{failCount}회 (+{failCount * 5}% 보정)</span>
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
  const [view, setView] = useState<'owned' | 'codex'>('owned')
  const [query, setQuery] = useState('')
  const [selectedShadowId, setSelectedShadowId] = useState<string | undefined>()
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
  const [labOpen, setLabOpen] = useState(false)

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

      <ShadowRevealModal reveal={shadowReveal} onClose={() => setShadowReveal(undefined)} />
      <div className="panel corner-bracket overflow-hidden p-5 border-purple-400/25 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.2),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.75),rgba(2,6,23,0.94))]">
        <div className="br" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5 border-b border-purple-500/15 pb-4">
          <div className="flex items-center gap-2.5">
            <Eclipse className="w-6 h-6 text-cyan-300 animate-pulse" />
            <div>
              <div className="system-text text-[11px] text-cyan-300/80 font-bold tracking-wider">SHADOW LEGION HQ</div>
              <div className="text-sm font-black text-white/95">그림자 군단 사령부</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full lg:w-auto lg:min-w-[720px] text-xs">
            <div className="rounded-md border border-cyan-400/20 bg-cyan-400/8 px-3 py-1.5 shadow-sm">
              <div className="system-text text-[8px] text-cyan-200/50 uppercase tracking-wider font-bold">Essence</div>
              <div className="text-sm font-black text-cyan-100 tabular-nums">{shadowEssence.toLocaleString()}</div>
            </div>
            <div className="rounded-md border border-purple-400/20 bg-purple-400/8 px-3 py-1.5 shadow-sm">
              <div className="system-text text-[8px] text-purple-200/50 uppercase tracking-wider font-bold">Legion Size</div>
              <div className="text-sm font-black text-purple-100 tabular-nums">{ownedShadows.length}</div>
            </div>
            <div className="rounded-md border border-amber-400/20 bg-amber-400/8 px-3 py-1.5 shadow-sm">
              <div className="system-text text-[8px] text-amber-200/50 uppercase tracking-wider font-bold">Deployed</div>
              <div className="text-sm font-black text-amber-100 tabular-nums">{equippedShadows.length}/{slotCount}</div>
            </div>
            <div className="rounded-md border border-indigo-400/20 bg-indigo-400/8 px-3 py-1.5 shadow-sm">
              <div className="system-text text-[8px] text-indigo-200/50 uppercase tracking-wider font-bold">Named Heroes</div>
              <div className="text-sm font-black text-indigo-100 tabular-nums">{namedCount}</div>
            </div>
            <div className="rounded-md border border-yellow-400/20 bg-yellow-400/8 px-3 py-1.5 shadow-sm">
              <div className="system-text text-[8px] text-yellow-200/50 uppercase tracking-wider font-bold">S / A Grade</div>
              <div className="text-sm font-black text-yellow-100 tabular-nums">{sGradeCount}S / {aGradeCount}A</div>
            </div>
            <div className="rounded-md border border-emerald-400/20 bg-emerald-400/8 px-3 py-1.5 shadow-sm col-span-2 sm:col-span-1">
              <div className="system-text text-[8px] text-emerald-200/50 uppercase tracking-wider font-bold">Legion Power</div>
              <div className="text-sm font-black text-emerald-100 tabular-nums" title={`Max SCP: ${maxScp}`}>{legionPower.toLocaleString()}</div>
            </div>
          </div>

          {equippedShadowIds.length > slotCount && (
            <div className="text-[10px] text-rose-300 border border-rose-500/30 bg-rose-500/10 rounded px-2.5 py-1 animate-pulse">
              슬롯 초과 감지! 앞 {slotCount}명만 출전합니다.
            </div>
          )}
        </div>

        <div className="mb-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-lg border border-white/10 bg-ink-950/45 p-3">
            <div className="mb-3 flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-200" />
              <div className="system-text text-[11px] text-amber-100/75">COMMAND GALLERY</div>
              <div className="h-px flex-1 bg-gradient-to-r from-amber-300/25 to-transparent" />
            </div>
            {featuredShadows.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {featuredShadows.map((shadow, index) => {
                  const equipped = equippedShadowIds.includes(shadow.instanceId)
                  const selected = selectedShadow?.instanceId === shadow.instanceId
                  const combatProfile = getShadowCombatProfile(shadow)
                  return (
                    <button
                      key={shadow.instanceId}
                      type="button"
                      onClick={() => setSelectedShadowId(shadow.instanceId)}
                      className={`group relative min-w-0 overflow-hidden rounded-lg border p-2 text-left transition ${
                        selected
                          ? 'border-amber-200/65 bg-amber-300/10 shadow-glow-lg'
                          : 'border-white/10 bg-ink-900/55 hover:border-cyan-200/45 hover:bg-cyan-400/10'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 text-[9px] system-text text-white/40">
                        <span>{index === 0 ? 'VANGUARD' : equipped ? 'DEPLOYED' : shadow.isFavorite ? 'FAVORITE' : 'ELITE'}</span>
                        <span>{SHADOW_RARITY_LABEL[shadow.rarity]}</span>
                      </div>
                      <ShadowPortrait shadow={shadow} size="lg" active={equipped} highlighted={Boolean(shadow.isNamed || shadow.isGateNamed || shadow.isAchievementNamed)} innateGrade={shadow.innateGrade} evolutionReady={canEvolveShadow(shadow, shadowEssence).canEvolve} />
                      <div className="mt-2 truncate text-sm font-bold text-white/90">{shadow.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1 text-[9px] system-text text-white/45">
                        <span className="text-amber-100">SCP {combatProfile.totalPower.toLocaleString()}</span>
                        <span>Lv {shadow.level ?? 1}</span>
                        <span>{SHADOW_ROLE_LABEL[shadow.role]}</span>
                        {combatProfile.topStats.slice(0, 2).map(stat => <span key={stat.key}>{stat.shortLabel}</span>)}
                        {(shadow.enhancementLevel ?? 0) > 0 && <span className="text-amber-200">+{shadow.enhancementLevel}</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-md border border-white/10 bg-ink-900/40 p-5 text-center text-xs text-white/40">
                군단에 합류한 그림자가 아직 없습니다.
              </div>
            )}
          </div>
          <ShadowDetailPanel
            shadow={selectedShadow}
            equipped={selectedShadow ? equippedShadowIds.includes(selectedShadow.instanceId) : false}
            shadowEssence={shadowEssence}
          />
        </div>

        <div className="mb-3 flex items-center gap-3">
          <div className="system-text text-[11px] text-purple-200/80">DEPLOYED LEGION</div>
          <div className="h-px flex-1 bg-gradient-to-r from-purple-300/30 to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: Math.max(1, slotCount) }).map((_, index) => {
            const shadow = equippedShadows[index]
            const isNamed = shadow && Boolean(shadow.isNamed || shadow.isGateNamed || shadow.isAchievementNamed)
            const isLegendary = shadow?.rarity === 'legendary'
            const isEpic = shadow?.rarity === 'epic'
            const isSGrade = shadow?.innateGrade === 'S'
            const isAGrade = shadow?.innateGrade === 'A'
            const isEvolved = shadow && (shadow.evolutionStage ?? 0) > 0
            return (
              <motion.div
                key={index}
                role={shadow ? 'button' : undefined}
                tabIndex={shadow ? 0 : undefined}
                onClick={() => shadow && setSelectedShadowId(shadow.instanceId)}
                onKeyDown={(event) => {
                  if (shadow && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault()
                    setSelectedShadowId(shadow.instanceId)
                  }
                }}
                whileHover={shadow ? { y: -4, scale: 1.02 } : undefined}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className={[
                  'relative overflow-hidden rounded-lg border p-3 min-h-[300px] transition-all card-premium-shine group',
                  shadow
                    ? [
                        isNamed ? 'named-pulse' : '',
                        isSGrade ? 'grade-aura-s' : isAGrade ? 'grade-aura-a' : '',
                        isEvolved ? 'shadow-evolved-card' : '',
                        isLegendary ? 'rarity-frame-legendary border-amber-400/40' : isEpic ? 'rarity-frame-epic border-purple-400/30' : 'rarity-frame-rare border-cyan-400/30',
                        'shadow-deployed-glow ring-2 ring-cyan-300/40'
                      ].filter(Boolean).join(' ')
                    : 'border-white/5 bg-ink-950/60 border-dashed opacity-45',
                  shadow ? 'cursor-pointer' : '',
                  selectedShadow?.instanceId === shadow?.instanceId ? 'ring-2 ring-amber-300/80 shadow-glow-lg' : '',
                ].join(' ')}
              >
                {shadow && (
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.1),transparent_55%)]" />
                )}
                <div className="relative z-10 flex items-center gap-1.5 text-[10px] system-text text-cyan-300/55 mb-2">
                  {shadow?.role === 'guard' ? <Shield className="w-3 h-3" /> : <Swords className="w-3 h-3" />}
                  SLOT {index + 1}
                  {shadow && <span className="ml-auto text-[9px] text-white/30">{SHADOW_ROLE_LABEL[shadow.role]}</span>}
                </div>
                {shadow ? (
                  <div className="relative z-10 space-y-2">
                    <ShadowPortrait shadow={shadow} size="lg" active highlighted={isNamed} innateGrade={shadow.innateGrade} />
                    <div className="space-y-0.5">
                      <div className={`text-xs font-semibold truncate ${rarityStyle[shadow.rarity].split(' ')[0]}`}>
                        {shadow.name}
                        {(shadow.enhancementLevel ?? 0) > 0 && <span className="ml-1 text-amber-200/70">+{shadow.enhancementLevel}</span>}
                      </div>
                      <div className="text-[9px] text-white/40 system-text">{SHADOW_RANK_LABEL[shadow.rank]}</div>
                      {isNamed && (
                        <div className="text-[9px] rounded border border-amber-300/30 bg-amber-300/10 px-1 py-px text-amber-100 inline-block">
                          {shadow.isAchievementNamed ? 'ACHIEVEMENT' : 'NAMED'}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={(event) => { event.stopPropagation(); unequipShadow(shadow.instanceId) }} className="mt-1 w-full text-[10px] text-rose-200/70 border border-rose-400/20 rounded px-2 py-1 hover:bg-rose-400/10 transition-colors">
                      해제
                    </button>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center py-10 text-xs text-white/20 system-text">EMPTY</div>
                )}
              </motion.div>
            )
          })}
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
              보유 정수: {shadowEssence}
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
                  <div className="system-text text-[11px] text-purple-100/75">정수 상점</div>
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
                        정수 60개
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
                        정수 30개
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

            {/* 고급 정수 연구소 */}
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-300" />
                <div className="system-text text-[11px] text-purple-100/75">고급 정수 연구소</div>
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
                            정수 100개
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
                                        if (window.confirm(`[${selectedShadow.name}]의 ${idx + 1}번째 특성을 재굴림(혹은 신규 부여)하시겠습니까?\n소모 정수: ${cost}`)) {
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
                              {isMax ? 'MAX' : `${cost}정수`}
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
                                if (window.confirm(`[${mat.name}]을 합성하시겠습니까?\n소모 정수: ${mat.cost}개`)) {
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
              </div>
            </div>
          </div>
        )}
      </div>

      <ShadowExpeditionPanel />

      <div className="panel corner-bracket p-3 border-white/10 bg-ink-950/60">
        <div className="br" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[auto_auto_minmax(180px,1fr)]">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setView('owned')} className={`min-h-10 rounded-md border px-3 py-2 text-xs ${view === 'owned' ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-ink-900/45 text-white/50'}`}>보유</button>
            <button type="button" onClick={() => setView('codex')} className={`min-h-10 rounded-md border px-3 py-2 text-xs ${view === 'codex' ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-ink-900/45 text-white/50'}`}>도감</button>
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

      {view === 'owned' ? (
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {filteredOwned.map(shadow => {
            const equipped = equippedShadowIds.includes(shadow.instanceId)
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
                fragmentCount={shadowFragments[def.id] ?? 0}
                failCount={shadowExtractFailCount[def.sourceGateId ?? ''] ?? 0}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
