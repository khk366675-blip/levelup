import clsx from 'clsx'
import { Lock, Sparkles, Star, Swords, X } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  SHADOW_RANK_LABEL,
  SHADOW_RARITY_LABEL,
  SHADOW_ROLE_LABEL,
  canEvolveShadow,
  formatShadowEffect,
  getShadowDefinition,
  getShadowEffects,
  getShadowMaxLevel,
  getShadowXpForNextLevel,
  MAX_SHADOW_ENHANCEMENT_LEVEL,
  SHADOW_DECOMPOSE_ESSENCE,
  MAX_SHADOW_MUTATION_STAGE,
} from '../../lib/shadows'
import { getShadowCombatProfile } from '../../lib/shadowStats'
import { buildShadowBattleUnit } from '../../lib/battleUnits'
import { getShadowCombatUnitProfile, getShadowSkillDisplayName } from '../../lib/shadowSkills'
import type { OwnedShadow } from '../../lib/types'
import { ShadowPortrait } from './ShadowPortrait'

type ShadowCardProps = {
  shadow: OwnedShadow
  equipped: boolean
  canEquip: boolean
  shadowEssence: number
  featured?: boolean
  selected?: boolean
  onSelect?: () => void
  onEquip: () => void
  onUnequip: () => void
  onRestoreCollapsed?: () => void
  onCrystallize?: () => void
  materialCount?: number
  onAbsorb?: () => void
  onDecompose?: () => void
  onToggleLock?: () => void
  onToggleFavorite?: () => void
  onEvolve?: () => void
}

const rarityFrame: Record<OwnedShadow['rarity'], string> = {
  common:    'border-slate-400/25  bg-slate-400/5  rarity-frame-common',
  uncommon:  'border-emerald-400/32 bg-emerald-400/6 rarity-frame-uncommon',
  rare:      'border-cyan-400/38   bg-cyan-400/7   rarity-frame-rare',
  epic:      'border-purple-400/44 bg-purple-400/8  rarity-frame-epic',
  legendary: 'border-amber-400/52  bg-amber-400/8  rarity-frame-legendary',
}

const rarityText: Record<OwnedShadow['rarity'], string> = {
  common: 'text-slate-200',
  uncommon: 'text-emerald-200',
  rare: 'text-cyan-200',
  epic: 'text-purple-200',
  legendary: 'text-amber-200',
}

const sourceText = (shadow: OwnedShadow): string => {
  const def = getShadowDefinition(shadow.definitionId)
  if (shadow.isAchievementNamed) return def?.unlockConditionText ?? '성취 달성 네임드'
  if (shadow.isGateNamed) return def?.sourceGateId ?? '게이트 네임드'
  return def?.sourceGateRank ? `${def.sourceGateRank}급 게이트 추출` : '게이트 추출'
}

const xpPercent = (level: number, maxLevel: number, xp: number): { pct: number; label: string } => {
  if (level >= maxLevel) return { pct: 100, label: '최대' }
  const needed = getShadowXpForNextLevel(level)
  return { pct: Math.min(100, Math.round((xp / needed) * 100)), label: `${xp}/${needed}` }
}

export function ShadowCard({
  shadow,
  equipped,
  canEquip,
  shadowEssence,
  featured = false,
  selected = false,
  onSelect,
  onEquip,
  onUnequip,
  onRestoreCollapsed,
  onCrystallize,
  materialCount = 0,
  onAbsorb,
  onDecompose,
  onToggleLock,
  onToggleFavorite,
  onEvolve,
}: ShadowCardProps) {
  const effects = getShadowEffects(shadow).map(formatShadowEffect)
  const level = shadow.level ?? 1
  const maxLevel = getShadowMaxLevel(shadow)
  const xp = shadow.xp ?? 0
  const xpInfo = xpPercent(level, maxLevel, xp)
  const evolutionCheck = canEvolveShadow(shadow, shadowEssence)
  const enhancement = shadow.enhancementLevel ?? 0
  const canAbsorb = (shadow.enhancementLevel ?? 0) < MAX_SHADOW_ENHANCEMENT_LEVEL && !shadow.isAchievementNamed && materialCount > 0
  const named = Boolean(shadow.isNamed || shadow.isGateNamed || shadow.isAchievementNamed)
  const collapsed = Boolean(shadow.collapsed || shadow.status === 'collapsed')
  const restoreCost = shadow.restoreCost ?? 0
  const combatProfile = getShadowCombatProfile(shadow)
  const unitProfile = getShadowCombatUnitProfile(shadow)
  const battleUnit = buildShadowBattleUnit(shadow)
  const shadowStats = battleUnit.unit.stats
  const combatBadges = [
    getShadowSkillDisplayName(combatProfile.roleTag),
    getShadowSkillDisplayName(unitProfile.activeSkills[0]?.shortLabel || ''),
    ...combatProfile.topStats.map(stat => getShadowSkillDisplayName(stat.shortLabel)),
  ].filter((badge): badge is string => Boolean(badge) && badge !== '').slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onSelect ? { y: -4, scale: 1.015 } : undefined}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={collapsed ? { filter: 'grayscale(0.85) brightness(0.7) sepia(0.15)' } : undefined}
      className={clsx(
        'panel corner-bracket overflow-hidden border p-3 card-premium-shine group transition-all duration-300',
        rarityFrame[shadow.rarity],
        collapsed ? 'border-rose-500/40 bg-rose-950/20' : equipped ? 'shadow-deployed-glow ring-2 ring-cyan-300/40' : 'hover:border-cyan-400/40 hover:bg-white/[0.015]',
        selected && 'ring-2 ring-amber-300/80 shadow-glow-lg',
        shadow.innateGrade === 'S' && 'grade-aura-s',
        shadow.innateGrade === 'A' && 'grade-aura-a',
        (shadow.evolutionStage ?? 0) > 0 && 'shadow-evolved-card',
        named ? 'named-pulse' : '',
        evolutionCheck.canEvolve && 'ring-1 ring-emerald-300/45',
        onSelect && 'cursor-pointer',
        featured ? 'sm:p-4' : 'sm:p-3',
      )}
      onClick={onSelect}
    >
      <div className="br" />
      {collapsed && (
        <div className="mb-2 rounded border border-rose-300/30 bg-rose-400/10 px-2 py-1.5 text-xs text-rose-100 flex items-center justify-between">
          <div>
            <div className="font-black text-rose-300 flex items-center gap-1">
              <span>⚠️ 붕괴 상태 (Fractured)</span>
            </div>
            <div className="mt-0.5 text-[10px] text-rose-200/80">복원 비용: 정수 {restoreCost}개</div>
          </div>
          <span className="text-[9px] border border-rose-400/40 bg-rose-950/50 px-1.5 py-0.5 rounded text-rose-200">출전 불가</span>
        </div>
      )}
      
      <div className={clsx('grid gap-3', featured ? 'md:grid-cols-[190px_1fr]' : 'grid-cols-1')}>
        <ShadowPortrait
          shadow={shadow}
          size={featured ? 'xl' : 'lg'}
          active={equipped}
          highlighted={named}
          evolutionReady={evolutionCheck.canEvolve}
          innateGrade={shadow.innateGrade}
        />

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className={clsx('text-[10px] system-text', rarityText[shadow.rarity])}>
                [{SHADOW_RARITY_LABEL[shadow.rarity]}]
                {(shadow.birthRarity ?? shadow.rarity) !== shadow.rarity ? ` / 태생 ${SHADOW_RARITY_LABEL[shadow.birthRarity ?? shadow.rarity]}` : ''}
              </div>
              <h3 className="mt-0.5 truncate text-sm font-bold text-white/90 sm:text-base">
                {shadow.name}
                {enhancement > 0 && (
                  <span className={clsx('ml-1.5 text-xs font-black', enhancement >= 8 ? 'text-amber-300' : enhancement >= 4 ? 'text-amber-200/80' : 'text-amber-100/60')}>+{enhancement}</span>
                )}
                {shadow.innateGrade === 'S' && (
                  <span className="ml-1.5 rounded border border-amber-300/55 bg-amber-300/18 px-1 py-px text-[9px] system-text font-bold text-amber-100">S</span>
                )}
                {shadow.innateGrade === 'A' && (
                  <span className="ml-1.5 rounded border border-amber-400/40 bg-amber-400/10 px-1 py-px text-[9px] system-text text-amber-200/80">A</span>
                )}
              </h3>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] system-text">
                <span className="rounded border border-amber-300/25 bg-amber-300/10 px-1.5 py-0.5 text-amber-100 font-extrabold shadow-glow">
                  전투력 {combatProfile.totalPower.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {equipped && (
                <span className="inline-flex items-center gap-1 rounded border border-cyan-400/35 bg-cyan-400/10 px-2 py-0.5 text-[10px] system-text text-cyan-100">
                  <Swords className="h-2.5 w-2.5" /> 출전 중
                </span>
              )}
              {shadow.isLocked && (
                <span className="inline-flex items-center gap-1 rounded border border-rose-400/35 bg-rose-400/10 px-2 py-0.5 text-[10px] system-text text-rose-100">
                  <Lock className="h-2.5 w-2.5" /> 잠금
                </span>
              )}
              {shadow.isFavorite && (
                <span className="inline-flex items-center gap-1 rounded border border-yellow-400/35 bg-yellow-400/10 px-2 py-0.5 text-[10px] system-text text-yellow-100">
                  <Star className="h-2.5 w-2.5" /> 즐겨찾기
                </span>
              )}
              {evolutionCheck.canEvolve && (
                <span className="inline-flex items-center gap-1 rounded border border-emerald-400/35 bg-emerald-400/10 px-2 py-0.5 text-[10px] system-text text-emerald-100">
                  <Sparkles className="h-2.5 w-2.5" /> 진화 가능
                </span>
              )}
              {shadow.mutation && shadow.mutation.mutationStage > 0 && (
                <span className="inline-flex items-center gap-1 rounded border border-purple-400/35 bg-purple-400/10 px-2 py-0.5 text-[10px] system-text text-purple-200">
                  🧪 변이 {shadow.mutation.mutationStage}/{MAX_SHADOW_MUTATION_STAGE}단계
                </span>
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-white/55">
              <span>Lv {level}/{maxLevel}</span>
              <span className="system-text text-white/35">{xpInfo.label}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-purple-300 to-emerald-300 transition-all" style={{ width: `${xpInfo.pct}%` }} />
            </div>
          </div>

          <div className="mt-2 text-[11px] leading-relaxed text-cyan-100/70 line-clamp-2">
            {effects.join(' / ')}
          </div>
          
          <div className="mt-1.5 flex flex-wrap gap-2 text-[9px] text-white/45">
            <span>태생 희귀도 {SHADOW_RARITY_LABEL[shadow.birthRarity ?? shadow.rarity]}</span>
            <span>강화 {enhancement}단계</span>
            <span>흡수 {shadow.absorbedCount ?? 0}회</span>
            {(shadow.evolutionStage ?? 0) > 0 && <span className="text-emerald-300">진화 {shadow.evolutionStage}단계</span>}
          </div>
        </div>
      </div>

      <div className="mt-3">
        {collapsed ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                if (window.confirm(`[${shadow.name}] 그림자를 복원하시겠습니까?\n소모 그림자 정수: ${restoreCost}개`)) {
                  onRestoreCollapsed?.()
                }
              }}
              disabled={!onRestoreCollapsed || shadowEssence < restoreCost}
              className="btn btn-primary flex-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              복원 ({restoreCost})
            </button>
            {onCrystallize && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  const refund = Math.max(10, Math.floor(restoreCost * 0.25))
                  if (window.confirm(`[${shadow.name}]을(를) 정수화하시겠습니까? 이 작업은 되돌릴 수 없으며, 기존 군단에서 제외되며 그림자 정수 ${refund}개를 환급받습니다.\n(※ 이 작업은 되돌릴 수 없습니다.)`)) {
                    onCrystallize()
                  }
                }}
                className="btn border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-900/30 text-xs px-3"
              >
                정수화
              </button>
            )}
          </div>
        ) : equipped ? (
          <button type="button" onClick={(event) => { event.stopPropagation(); onUnequip() }} className="btn w-full border-rose-400/25 bg-rose-400/10 text-xs text-rose-100 hover:bg-rose-400/20">
            <X className="h-3 w-3" />
            해제
          </button>
        ) : (
          <button type="button" onClick={(event) => { event.stopPropagation(); onEquip() }} disabled={!canEquip} className="btn btn-primary w-full text-xs disabled:cursor-not-allowed disabled:opacity-50">
            출전
          </button>
        )}
      </div>

      {!collapsed && (onAbsorb || onDecompose || onToggleLock || onToggleFavorite || onEvolve) && (
        <div className="mt-2 grid grid-cols-5 gap-1 text-[11px]">
          {/* 잠금 토글 */}
          {onToggleLock && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleLock() }}
              className={clsx(
                "btn py-1 px-1.5 flex items-center justify-center border transition-colors",
                shadow.isLocked 
                  ? "border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40" 
                  : "border-white/10 bg-ink-950/40 text-white/45 hover:bg-white/10 hover:text-white/70"
              )}
              title={shadow.isLocked ? "잠금 해제" : "잠금"}
            >
              <Lock className={clsx("h-3.5 w-3.5", shadow.isLocked && "fill-rose-300/10")} />
            </button>
          )}
          
          {/* 즐겨찾기 토글 */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
              className={clsx(
                "btn py-1 px-1.5 flex items-center justify-center border transition-colors",
                shadow.isFavorite 
                  ? "border-yellow-500/40 bg-yellow-950/40 text-yellow-300 hover:bg-yellow-900/40" 
                  : "border-white/10 bg-ink-950/40 text-white/45 hover:bg-white/10 hover:text-white/70"
              )}
              title={shadow.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
            >
              <Star className={clsx("h-3.5 w-3.5", shadow.isFavorite && "fill-yellow-300/30")} />
            </button>
          )}

          {/* 분해 */}
          {onDecompose && (
            <button
              type="button"
              disabled={equipped || shadow.isLocked || shadow.isAchievementNamed}
              onClick={(e) => {
                e.stopPropagation();
                const essenceReward = SHADOW_DECOMPOSE_ESSENCE[shadow.rarity] ?? 0;
                if (window.confirm(`${shadow.name}을(를) 분해하시겠습니까? 분해 시 그림자 정수 ${essenceReward}개를 획득합니다.`)) {
                  onDecompose();
                }
              }}
              className="btn py-1 px-1 border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-900/30 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-all"
              title={
                equipped ? "출전 중인 그림자는 분해할 수 없습니다" :
                shadow.isLocked ? "잠금 상태인 그림자는 분해할 수 없습니다" :
                shadow.isAchievementNamed ? "성취 네임드 그림자는 분해할 수 없습니다" : `분해 (정수 ${SHADOW_DECOMPOSE_ESSENCE[shadow.rarity] ?? 0}개 획득)`
              }
            >
              분해
            </button>
          )}

          {/* 흡수 */}
          {onAbsorb && (
            <button
              type="button"
              disabled={!canAbsorb}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`${shadow.name}에게 재료 그림자를 흡수시켜 강화하시겠습니까?`)) {
                  onAbsorb();
                }
              }}
              className="btn py-1 px-1 border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-900/30 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-all"
              title={
                (shadow.enhancementLevel ?? 0) >= MAX_SHADOW_ENHANCEMENT_LEVEL ? "최대 강화 상태입니다" :
                shadow.isAchievementNamed ? "성취 네임드는 강화할 수 없습니다" :
                materialCount === 0 ? "동일한 재료 그림자가 없습니다" : `재료 흡수 (보유 재료: ${materialCount}개)`
              }
            >
              흡수
            </button>
          )}

          {/* 진화 */}
          {onEvolve && (
            <button
              type="button"
              disabled={!evolutionCheck.canEvolve}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`${shadow.name}을(를) 진화시키겠습니까?`)) {
                  onEvolve();
                }
              }}
              className="btn py-1 px-1 border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-all"
              title={evolutionCheck.canEvolve ? "진화하기" : evolutionCheck.reason || "진화 불가"}
            >
              진화
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
