import clsx from 'clsx'
import { Info, Lock, Sparkles, TimerReset, Zap } from 'lucide-react'
import type { SkillDefinition, SkillRuntimeState } from '../lib/types'
import {
  getSkillCooldownTurns,
  getSkillDefinitionSource,
  getSkillEffectiveDescription,
  getSkillMasteryProgress,
  getSkillSourceLabel,
  getSkillTypeLabel,
} from '../lib/skills'

const sourceMeta: Record<string, { key: string; label: string; className: string }> = {
  basic: { key: 'BASIC', label: '기본', className: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100' },
  job: { key: 'JOB', label: '직업', className: 'border-amber-300/30 bg-amber-400/10 text-amber-100' },
  equipment: { key: 'EQUIPMENT', label: '장비', className: 'border-purple-300/30 bg-purple-400/10 text-purple-100' },
  title: { key: 'TITLE', label: '칭호', className: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100' },
  special: { key: 'SPECIAL', label: '특수', className: 'border-rose-300/30 bg-rose-400/10 text-rose-100' },
  monster: { key: 'MONSTER', label: '몬스터', className: 'border-slate-500/18 bg-slate-400/6 text-white/60' },
}

const typeMeta: Record<string, { key: string; label: string; className: string; glyph: string }> = {
  attack: { key: 'ATTACK', label: '공격', className: 'skill-badge-damage', glyph: '⚡' },
  damage: { key: 'ATTACK', label: '공격', className: 'skill-badge-damage', glyph: '⚡' },
  defense: { key: 'DEFENSE', label: '방어', className: 'skill-badge-defense', glyph: '🛡' },
  buff: { key: 'BUFF', label: '버프', className: 'skill-badge-buff', glyph: '↑' },
  debuff: { key: 'UTILITY', label: '약화', className: 'skill-badge-debuff', glyph: '↓' },
  heal: { key: 'HEAL', label: '회복', className: 'skill-badge-heal', glyph: '✦' },
  utility: { key: 'UTILITY', label: '유틸', className: 'skill-badge-utility', glyph: '◈' },
}

export function getSkillSourceMeta(skill: SkillDefinition) {
  const source = getSkillDefinitionSource(skill)
  return sourceMeta[source] ?? { key: String(source).toUpperCase(), label: getSkillSourceLabel(skill), className: sourceMeta.basic.className }
}

export function getSkillTypeMeta(skill: SkillDefinition) {
  return typeMeta[skill.type] ?? { key: String(skill.type).toUpperCase(), label: getSkillTypeLabel(skill), className: typeMeta.utility.className, glyph: '◈' }
}

export const skillTypeSortRank = (skill: SkillDefinition): number => {
  const order = ['attack', 'damage', 'defense', 'heal', 'buff', 'debuff', 'utility']
  const index = order.indexOf(skill.type)
  return index === -1 ? 99 : index
}

export const skillSourceSortRank = (skill: SkillDefinition): number => {
  const source = getSkillDefinitionSource(skill)
  const order = ['job', 'equipment', 'title', 'special', 'basic', 'monster']
  const index = order.indexOf(source)
  return index === -1 ? 99 : index
}

type SkillActionCardProps = {
  skill: SkillDefinition
  runtime?: SkillRuntimeState
  cooldownRemaining?: number
  disabled?: boolean
  disabledReason?: string
  providerName?: string
  selected?: boolean
  compact?: boolean
  informational?: boolean
  tacticalHint?: string
  onClick?: () => void
}

export function SkillActionCard({
  skill,
  runtime,
  cooldownRemaining = 0,
  disabled = false,
  disabledReason,
  providerName,
  selected = false,
  compact = false,
  informational = false,
  tacticalHint,
  onClick,
}: SkillActionCardProps) {
  const source = getSkillSourceMeta(skill)
  const type = getSkillTypeMeta(skill)
  const baseCooldown = getSkillCooldownTurns(skill)
  const description = getSkillEffectiveDescription(skill, runtime)
  const mastery = getSkillMasteryProgress(runtime)
  const isReady = !disabled && cooldownRemaining <= 0
  const reason = disabledReason ?? (cooldownRemaining > 0 ? `쿨다운 ${cooldownRemaining}턴` : '사용 가능')
  const ButtonIcon = isReady ? Zap : Lock

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!informational && disabled}
      title={description}
      className={clsx(
        'group w-full rounded-md border px-3 py-3 text-left transition',
        compact ? 'min-h-[76px]' : 'min-h-[112px]',
        selected && 'ring-1 ring-cyan-300/35 shadow-[0_0_18px_rgba(34,211,238,0.08)]',
        isReady
          ? tacticalHint
            ? 'border-amber-400 bg-amber-500/10 text-amber-50 shadow-[0_0_24px_rgba(245,158,11,0.18)] hover:border-amber-300 hover:bg-amber-500/15 animate-pulse'
            : 'border-cyan-300/35 bg-cyan-400/10 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.08)] hover:border-cyan-200/55 hover:bg-cyan-400/15'
          : cooldownRemaining > 0
            ? 'border-amber-300/28 bg-amber-400/8 text-amber-50/80'
            : 'border-slate-500/18 bg-ink-900/45 text-white/55',
        !informational && disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="text-[12px] system-text text-white/45">{type.glyph}</span>
            <span className="truncate text-sm font-bold text-white/90">{skill.name}</span>
          </span>
          {providerName && (
            <span className="mt-1 block truncate text-[10px] text-purple-100/65">장비: {providerName}</span>
          )}
        </span>
        <span className={clsx('inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] system-text', isReady ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100' : 'border-slate-500/18 bg-slate-400/6 text-white/55')}>
          <ButtonIcon className="h-3 w-3" />
          {reason}
        </span>
      </span>

      {!compact && (
        <span className="mt-2 block text-[11px] leading-snug text-white/58 line-clamp-2">
          {description}
        </span>
      )}
      {tacticalHint && (
        <span className="mt-2 inline-flex rounded border border-amber-300/20 bg-amber-400/10 px-1.5 py-0.5 text-[10px] system-text text-amber-100/75">
          {tacticalHint}
        </span>
      )}

      <span className="mt-2 flex flex-wrap gap-1.5 text-[10px] system-text">
        <span className={clsx('rounded border px-1.5 py-0.5', source.className)}>{source.key}</span>
        <span className={clsx('rounded border px-1.5 py-0.5', type.className)}>{type.key}</span>
        <span className="inline-flex items-center gap-1 rounded border border-cyan-300/12 bg-black/15 px-1.5 py-0.5 text-white/55">
          <TimerReset className="h-3 w-3" />
          {baseCooldown === 0 ? '즉시' : `CD ${baseCooldown}`}
        </span>
        {cooldownRemaining > 0 && (
          <span className="rounded border border-amber-300/25 bg-amber-400/10 px-1.5 py-0.5 text-amber-100">
            남은 {cooldownRemaining}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded border border-cyan-300/12 bg-black/15 px-1.5 py-0.5 text-white/50">
          <Sparkles className="h-3 w-3" />
          숙련 Lv.{mastery.level}
        </span>
        <span className="rounded border border-cyan-300/12 bg-black/15 px-1.5 py-0.5 text-white/45">
          {mastery.currentUses}회
        </span>
        {informational && (
          <span className="inline-flex items-center gap-1 rounded border border-cyan-300/12 bg-cyan-400/5 px-1.5 py-0.5 text-white/42">
            <Info className="h-3 w-3" />
            상세
          </span>
        )}
      </span>
      {!compact && (
        <span className="mt-2 block">
          <span className="flex items-center justify-between text-[10px] system-text text-white/38">
            <span>MASTERY</span>
            <span>{mastery.isMaxLevel ? 'MAX' : `${mastery.currentUses}/${mastery.nextLevelUses}`}</span>
          </span>
          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/8">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-200 transition-all"
              style={{ width: `${mastery.percent}%` }}
            />
          </span>
        </span>
      )}
    </button>
  )
}
