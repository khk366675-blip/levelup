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
}: ShadowCardProps) {
  const effects = getShadowEffects(shadow).map(formatShadowEffect)
  const level = shadow.level ?? 1
  const maxLevel = getShadowMaxLevel(shadow)
  const xp = shadow.xp ?? 0
  const xpInfo = xpPercent(level, maxLevel, xp)
  const evolutionCheck = canEvolveShadow(shadow, shadowEssence)
  const enhancement = shadow.enhancementLevel ?? 0
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
                <span className="rounded border border-amber-300/25 bg-amber-300/10 px-1.5 py-0.5 text-amber-100">
                  전투력 {combatProfile.totalPower.toLocaleString()}
                </span>
                <span className="rounded border border-cyan-300/20 bg-cyan-300/8 px-1.5 py-0.5 text-cyan-200">
                  크릿 {(shadowStats.crit * 100).toFixed(1)}% · 회피 {((shadowStats.evasionRate ?? 0) * 100).toFixed(1)}% · 명중 {((shadowStats.accuracy ?? 0) * 100).toFixed(1)}%
                </span>
                <span className="rounded border border-white/10 bg-ink-900/55 px-1.5 py-0.5 text-white/55">
                  {SHADOW_RANK_LABEL[shadow.rank]}
                </span>
                <span className="rounded border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-cyan-100/75">
                  {SHADOW_ROLE_LABEL[shadow.role]}
                </span>
                {named && (
                  <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-amber-100">
                    {shadow.isAchievementNamed ? '성취 네임드' : shadow.isGateNamed ? '게이트 네임드' : '네임드'}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1 text-[9px] system-text">
                {combatBadges.map(badge => (
                  <span key={badge} className="rounded border border-cyan-300/20 bg-cyan-300/8 px-1.5 py-0.5 text-cyan-100/70">
                    {badge}
                  </span>
                ))}
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
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onRestoreCollapsed?.() }}
            disabled={!onRestoreCollapsed || shadowEssence < restoreCost}
            className="btn btn-primary w-full text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            복원하기 (정수 {restoreCost} 소모)
          </button>
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
    </motion.div>
  )
}
