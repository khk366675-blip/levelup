import clsx from 'clsx'
import { FastForward, Gem, ScrollText, Shield, Sparkles, Sword, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CATEGORY_META, EQUIPMENT_SLOT_LABEL, RARITY_META, type EquipmentSlot, type Item } from '../lib/types'
import { formatEquipmentStars, formatStatReward, getEnhancedItemEffects, getEquipmentStars } from '../lib/game'
import { compareEquipmentForSlot, getEquipmentPowerBreakdown } from '../lib/equipmentPower'
import { getItemDisplayName } from '../lib/retiredTowerUi'
import { SKILL_DEFINITIONS } from '../lib/seed'
import { TicketRevealSequence } from './TicketRevealSequence'

export type EquipmentRevealPayload = {
  items: Item[]
  productName: string
  previousBySlot: Partial<Record<EquipmentSlot, Item>>
}

type Props = {
  reveal?: EquipmentRevealPayload
  onClose: () => void
}

const slotIcon: Record<EquipmentSlot, typeof Sword> = {
  weapon: Sword,
  armor: Shield,
  accessory: Gem,
  artifact: ScrollText,
}

const rarityFrame: Record<Item['rarity'], string> = {
  common: 'border-slate-300/25 bg-slate-400/8 text-slate-100',
  uncommon: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  rare: 'border-cyan-300/35 bg-cyan-400/10 text-cyan-100',
  epic: 'border-purple-300/45 bg-purple-400/12 text-purple-100 shadow-[0_0_28px_rgba(168,85,247,0.18)]',
  legendary: 'border-amber-300/55 bg-amber-400/14 text-amber-100 shadow-[0_0_34px_rgba(245,158,11,0.22)]',
}

function isHighValue(item: Item) {
  const power = getEquipmentPowerBreakdown(item)
  return item.rarity === 'legendary' || item.rarity === 'epic' || item.slot === 'artifact' || getEquipmentStars(item) >= 4 || power.totalEquipmentValue >= 95
}

function strongestItem(items: Item[]) {
  return [...items].sort((a, b) => getEquipmentPowerBreakdown(b).totalEquipmentValue - getEquipmentPowerBreakdown(a).totalEquipmentValue)[0]
}

const formatPercentVal = (val: number): string => {
  const percent = val * 100
  const rounded = Math.round(percent * 10) / 10
  return `${rounded}%`
}

function formatEffects(item: Item): string[] {
  const statLines = getEnhancedItemEffects(item).map(effect => {
    if (effect.type === 'xp_bonus') {
      const category = effect.category ? CATEGORY_META[effect.category]?.label ?? effect.category : 'ALL'
      return `${category} XP +${formatPercentVal(effect.value)}`
    }
    if (effect.type === 'drop_bonus') return `DROP +${formatPercentVal(effect.value)}`
    if (effect.type === 'rarity_bonus') return `RARITY +${formatPercentVal(effect.value)}`
    if (effect.type === 'stat_bonus') return `${effect.stat ?? 'STAT'} ${formatStatReward(effect.value)}`
    if (effect.type === 'crit_bonus') return `CRIT +${formatPercentVal(effect.value)}`
    if (effect.type === 'evasion_bonus') return `EVADE +${formatPercentVal(effect.value)}`
    if (effect.type === 'accuracy_bonus') return `ACC +${formatPercentVal(effect.value)}`
    return ''
  }).filter(Boolean)

  const skillLines = (item.combatSkillIds ?? [])
    .map(id => SKILL_DEFINITIONS.find(skill => skill.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .map(name => `SKILL: ${name}`)

  return [...statLines, ...skillLines].slice(0, 3)
}

const comparisonClass: Record<ReturnType<typeof compareEquipmentForSlot>['verdict'], string> = {
  better: 'border-emerald-300/28 bg-emerald-400/10 text-emerald-100',
  sidegrade: 'border-cyan-300/22 bg-cyan-400/8 text-cyan-100',
  situational: 'border-amber-300/28 bg-amber-400/10 text-amber-100',
  weaker: 'border-slate-300/18 bg-slate-400/8 text-slate-100/70',
}

function EquipmentCard({
  item,
  previous,
  featured = false,
}: {
  item: Item
  previous?: Item
  featured?: boolean
}) {
  const stars = getEquipmentStars(item)
  const Icon = item.slot ? slotIcon[item.slot] : Sparkles
  const effects = formatEffects(item)
  const high = isHighValue(item)
  const power = getEquipmentPowerBreakdown(item)
  const comparison = compareEquipmentForSlot(item, previous)

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-lg border bg-ink-950/78 p-3',
        rarityFrame[item.rarity],
        featured && 'p-4',
        high && 'equipment-reveal-high',
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.11),transparent_34%),radial-gradient(circle_at_50%_72%,rgba(34,211,238,0.12),transparent_48%)]" />
      <div className="relative z-10">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded border border-white/12 bg-white/8 px-2 py-1 text-[10px] system-text text-white/65">
            <Icon className="h-3.5 w-3.5" />
            {item.slot ? EQUIPMENT_SLOT_LABEL[item.slot] : 'ITEM'} · {power.slotRoleLabel}
          </span>
          <span className="rounded border border-amber-200/20 bg-amber-300/10 px-2 py-1 text-[10px] font-black text-amber-100">
            {formatEquipmentStars(item)}
          </span>
        </div>

        <div className={clsx('text-center', featured ? 'py-3' : 'py-2')}>
          <div className={clsx('leading-none', featured ? 'text-6xl' : 'text-4xl')}>{item.icon}</div>
          <div className={clsx('mt-2 font-black leading-tight', featured ? 'text-xl' : 'text-sm', RARITY_META[item.rarity].color)}>
            {getItemDisplayName(item)}
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-1.5 text-[10px] system-text">
            <span className="rounded border border-white/12 bg-black/18 px-2 py-0.5">{RARITY_META[item.rarity].label}</span>
            <span className="rounded border border-yellow-200/20 bg-yellow-300/10 px-2 py-0.5 text-yellow-100">{stars} STAR</span>
            {high && <span className="rounded border border-amber-200/28 bg-amber-300/10 px-2 py-0.5 text-amber-100">HIGH VALUE</span>}
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-1 text-[9px] system-text">
            {power.topTags.slice(0, featured ? 4 : 2).map(tag => (
              <span key={tag} className="rounded border border-white/12 bg-white/7 px-1.5 py-0.5 text-white/62">{tag}</span>
            ))}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[9px]">
          <div className="rounded border border-white/10 bg-black/18 px-1.5 py-1">
            <div className="system-text text-white/35">VALUE</div>
            <div className="font-bold tabular-nums text-white/75">{power.totalEquipmentValue}</div>
          </div>
          <div className="rounded border border-white/10 bg-black/18 px-1.5 py-1">
            <div className="system-text text-white/35">ROLE</div>
            <div className="font-bold text-white/70">{power.slotRole.toUpperCase()}</div>
          </div>
          <div className="rounded border border-white/10 bg-black/18 px-1.5 py-1">
            <div className="system-text text-white/35">TIER</div>
            <div className="font-bold text-white/70">{power.starTierLabel}</div>
          </div>
        </div>

        {effects.length > 0 && (
          <div className="mt-2 grid gap-1 text-center text-[10px] text-cyan-100/76">
            {effects.map(line => (
              <div key={line} className="rounded border border-cyan-200/12 bg-cyan-400/7 px-2 py-1">{line}</div>
            ))}
          </div>
        )}

        <div className={clsx('mt-2 rounded border px-2 py-1.5 text-[10px] leading-relaxed', comparisonClass[comparison.verdict])}>
          <div className="flex items-center justify-between gap-2 system-text">
            <span>{comparison.label}</span>
            {previous && <span>{comparison.totalDelta >= 0 ? '+' : ''}{comparison.totalDelta}</span>}
          </div>
          <div className="mt-1 text-white/62">{comparison.recommendation}</div>
          <div className="mt-0.5 text-white/45">{comparison.keyReason}</div>
        </div>
      </div>
    </div>
  )
}

export function EquipmentRevealModal({ reveal, onClose }: Props) {
  const [sequenceComplete, setSequenceComplete] = useState(false)
  const featured = useMemo(() => reveal?.items.length ? strongestItem(reveal.items) : undefined, [reveal])

  useEffect(() => {
    setSequenceComplete(false)
  }, [reveal])

  useEffect(() => {
    if (!reveal) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (sequenceComplete) {
        onClose()
        return
      }
      setSequenceComplete(true)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, reveal, sequenceComplete])

  if (!reveal || reveal.items.length === 0 || !featured) return null

  const high = reveal.items.some(isHighValue)
  const hasFiveStar = reveal.items.some(item => getEquipmentStars(item) >= 5)
  const hasLegendary = reveal.items.some(item => item.rarity === 'legendary')
  const hasEpicOrFour = reveal.items.some(item => item.rarity === 'epic' || getEquipmentStars(item) >= 4)
  const hasRareOrThree = reveal.items.some(item => item.rarity === 'rare' || getEquipmentStars(item) >= 3)
  const apex = hasLegendary || hasFiveStar
  const sequenceIntensity = apex ? 'apex' : hasEpicOrFour ? 'epic' : hasRareOrThree ? 'rare' : 'quick'
  const featuredStars = getEquipmentStars(featured)
  const sequenceSignalClass = apex
    ? 'text-amber-100'
    : hasEpicOrFour
      ? 'text-purple-100'
      : hasRareOrThree
        ? 'text-emerald-100'
        : 'text-sky-100'
  const completeSequence = () => setSequenceComplete(true)
  const title = hasLegendary || hasFiveStar
    ? 'EXCEPTIONAL GEAR'
    : high
      ? 'HIGH VALUE GEAR'
      : 'GEAR ACQUIRED'
  const subtitle = reveal.items.length > 1
    ? `${reveal.items.length} equipment results from ${reveal.productName}.`
    : `${reveal.productName} result secured.`

  return (
    <div className={clsx('fixed inset-0 z-[68] flex items-center justify-center bg-black/62 p-3 backdrop-blur-sm', high && 'bg-black/72')}>
      <div
        className={clsx(
          'corner-bracket relative max-h-[92vh] w-full overflow-y-auto rounded-lg border bg-ink-950/94 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.48)] sm:p-5',
          high ? 'max-w-3xl border-amber-300/42' : 'max-w-xl border-cyan-300/28',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="br" />
        <div className={clsx(
          'pointer-events-none absolute inset-0',
          high
            ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.22),transparent_34%),radial-gradient(circle_at_50%_58%,rgba(168,85,247,0.16),transparent_44%)]'
            : 'bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_34%)]',
        )} />

        <div className="relative z-10">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className={clsx('system-text text-[10px]', high ? 'text-amber-100/72' : 'text-cyan-100/70')}>
                NEW EQUIPMENT
              </div>
              <h3 className="mt-1 text-2xl font-black text-white sm:text-3xl">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/52">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={sequenceComplete ? onClose : completeSequence}
              className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded border border-white/10 bg-white/5 px-2 text-[10px] system-text text-white/55 transition hover:bg-white/10 hover:text-white/80"
            >
              <FastForward className="h-3 w-3" />
              {sequenceComplete ? 'Fast Close' : 'Skip'}
            </button>
          </div>

          {!sequenceComplete ? (
            <TicketRevealSequence
              kind="equipment"
              intensity={sequenceIntensity}
              title={reveal.productName}
              starCount={featuredStars}
              featuredSlot={featured.slot}
              equipRarity={featured.rarity}
              onComplete={completeSequence}
            />
          ) : (
          <>
          <EquipmentCard
            item={featured}
            previous={featured.slot ? reveal.previousBySlot[featured.slot] : undefined}
            featured
          />

          {reveal.items.length > 1 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {reveal.items
                .filter(item => item.id !== featured.id)
                .map(item => (
                  <EquipmentCard
                    key={item.id}
                    item={item}
                    previous={item.slot ? reveal.previousBySlot[item.slot] : undefined}
                  />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mx-auto mt-4 flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-5 text-xs font-bold text-white transition hover:bg-white/15"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </button>
          </>
          )}
        </div>
      </div>
    </div>
  )
}
