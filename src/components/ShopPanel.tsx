import { useState } from 'react'
import clsx from 'clsx'
import {
  ArrowRight,
  CircleDotDashed,
  Coins,
  Crown,
  Gem,
  Lock,
  Package,
  ScrollText,
  Shield,
  ShoppingBag,
  Sparkles,
  Sword,
  Ticket,
  WandSparkles,
} from 'lucide-react'
import { useGame } from '../lib/store'
import { SHOP_PRODUCTS, type ShopProduct, type ShopProductCategory } from '../lib/shop'
import { getShopProbabilitySections, type ProbabilitySection } from '../lib/shopProbabilities'
import { getTicketVisualForProduct, type TicketVisual as TicketVisualMeta } from '../lib/ticketVisuals'
import type { EquipmentSlot } from '../lib/types'
import { EquipmentRevealModal, type EquipmentRevealPayload } from './EquipmentRevealModal'
import { TicketVisual } from './TicketVisual'

const CATEGORY_LABEL: Record<ShopProductCategory, string> = {
  shadow_summon: 'SHADOW SUMMON',
  equipment_draw: 'EQUIPMENT DRAW',
  essence: 'ESSENCE',
  shard: 'SHARD',
  relic: 'RELIC',
  premium: 'PREMIUM',
}

const CATEGORY_CLASS: Record<ShopProductCategory, string> = {
  shadow_summon: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
  equipment_draw: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
  essence: 'border-purple-300/30 bg-purple-400/10 text-purple-100',
  shard: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  relic: 'border-amber-300/35 bg-amber-400/10 text-amber-100',
  premium: 'border-fuchsia-300/35 bg-fuchsia-400/10 text-fuchsia-100',
}

function visualIcon(visual: TicketVisualMeta) {
  if (visual.artKind === 'rare-shadow') return WandSparkles
  if (visual.artKind === 'shadow') return Ticket
  if (visual.artKind === 'weapon') return Sword
  if (visual.artKind === 'armor') return Shield
  if (visual.artKind === 'accessory') return Gem
  if (visual.artKind === 'relic') return ScrollText
  if (visual.artKind === 'rare-gear') return Crown
  if (visual.artKind === 'essence') return CircleDotDashed
  if (visual.artKind === 'exchange') return Gem
  return Package
}

function getDisabledReason(product: ShopProduct, gold: number, shadowEssence: number) {
  if (gold < product.priceGold) return 'Gold 부족'
  if (shadowEssence < (product.priceEssence ?? 0)) return '정수 부족'
  return '구매 가능'
}

export function ShopPanel() {
  const gold = useGame(s => s.gold ?? 0)
  const shadowEssence = useGame(s => s.shadowEssence ?? 0)
  const purchaseShopProduct = useGame(s => s.purchaseShopProduct)
  const [expandedProbabilityId, setExpandedProbabilityId] = useState<string | undefined>()
  const [equipmentReveal, setEquipmentReveal] = useState<EquipmentRevealPayload | undefined>()

  const handleBuy = (product: ShopProduct, disabled: boolean) => {
    if (disabled) return
    const cost = `${product.priceGold.toLocaleString()} Gold${product.priceEssence ? ` + 정수 ${product.priceEssence}` : ''}`
    if (!window.confirm(`${product.name}을 구매할까요?\n${cost}`)) return
    const before = useGame.getState()
    const beforeItemIds = new Set(before.items.map(item => item.id))
    const equipmentSlots: EquipmentSlot[] = ['weapon', 'armor', 'accessory', 'artifact']
    const previousBySlot = equipmentSlots.reduce<EquipmentRevealPayload['previousBySlot']>((acc, slot) => {
      const equippedId = before.equipment[slot]
      const equippedItem = equippedId ? before.items.find(item => item.id === equippedId) : undefined
      if (equippedItem) acc[slot] = equippedItem
      return acc
    }, {})
    purchaseShopProduct(product.id)
    const after = useGame.getState()
    const newEquipment = after.items.filter(item =>
      !beforeItemIds.has(item.id)
      && item.equippable === true
      && item.consumable !== true,
    )
    if (newEquipment.length > 0) {
      setEquipmentReveal({ items: newEquipment, productName: product.name, previousBySlot })
    }
  }

  return (
    <div className="space-y-4">
      <EquipmentRevealModal reveal={equipmentReveal} onClose={() => setEquipmentReveal(undefined)} />
      <div className="panel corner-bracket border-amber-300/20 bg-amber-400/6 p-4">
        <div className="br" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 system-text text-[11px] text-amber-200/70">
              <ShoppingBag className="h-4 w-4" />
              HUNTER SHOP
            </div>
            <h2 className="text-xl font-black text-white">상점</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/48">
              구매 제한 없이 보유 Gold 안에서 필요한 소환권과 장비권을 전략적으로 선택합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-80">
            <div className="rounded-md border border-amber-300/25 bg-amber-400/10 px-3 py-2">
              <div className="system-text text-[10px] text-amber-200/65">GOLD</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-lg font-black tabular-nums text-amber-100">
                <Coins className="h-4 w-4" />
                {gold.toLocaleString()}
              </div>
            </div>
            <div className="rounded-md border border-purple-300/20 bg-purple-400/10 px-3 py-2">
              <div className="system-text text-[10px] text-purple-200/65">ESSENCE</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-lg font-black tabular-nums text-purple-100">
                <Gem className="h-4 w-4" />
                {shadowEssence.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SHOP_PRODUCTS.map(product => {
          const visual = getTicketVisualForProduct(product)
          const Icon = visualIcon(visual)
          const isExchange = visual.artKind === 'exchange'
          const sections = isExchange ? [] : getShopProbabilitySections(product)
          const disabledReason = getDisabledReason(product, gold, shadowEssence)
          const disabled = disabledReason !== '구매 가능'
          const expanded = expandedProbabilityId === product.id
          const normalShardReward = product.reward.kind === 'shadow_shards' ? product.reward.shards.normal ?? 0 : 0
          const cardLabel = isExchange ? 'EXCHANGE' : CATEGORY_LABEL[product.category]
          const cardClass = isExchange ? visual.accentClass : CATEGORY_CLASS[product.category]

          return (
            <article
              key={product.id}
              data-exchange-product={isExchange ? product.id : undefined}
              data-ticket-visual-key={visual.key}
              className={clsx(
                'group relative overflow-hidden rounded-lg border bg-gradient-to-br transition',
                visual.borderClass,
                visual.surfaceClass,
                !disabled && visual.glowClass,
                disabled && 'opacity-75',
              )}
            >
              <div className="pointer-events-none absolute inset-0 opacity-55 mix-blend-screen [background:linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.13)_24%,transparent_45%,rgba(255,255,255,0.08)_64%,transparent_84%)]" />
              <div className="absolute left-0 top-1/2 h-8 w-3 -translate-y-1/2 rounded-r-full border-y border-r border-slate-500/25 bg-ink-950/90" />
              <div className="absolute right-0 top-1/2 h-8 w-3 -translate-y-1/2 rounded-l-full border-y border-l border-slate-500/25 bg-ink-950/90" />

              <div className="grid min-h-[330px] grid-cols-[minmax(0,1fr)_82px]">
                <div className="relative min-w-0 p-3.5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="system-text text-[10px] tracking-[0.16em] text-white/45">{visual.label}</div>
                      <h3 className="mt-1 truncate text-sm font-black text-white">{product.name}</h3>
                    </div>
                    <span className={clsx('shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold', cardClass)}>
                      {cardLabel}
                    </span>
                  </div>

                  <TicketVisual visual={visual} />

                  <div className="mt-3 mb-3 flex items-center gap-3">
                    <div className={clsx('relative grid h-11 w-11 shrink-0 place-items-center rounded-md border', visual.accentClass)}>
                      <div className="absolute inset-1 rounded border border-cyan-100/12" />
                      <Icon className="relative h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white/78">{visual.shortDescription}</div>
                      <div className="mt-1 text-[10px] leading-relaxed text-white/45">{product.rewardSummary}</div>
                    </div>
                  </div>

                  {isExchange && (
                    <div className="mb-3 grid grid-cols-3 gap-1.5 text-center system-text text-[9px] text-white/42">
                      <span className="rounded border border-purple-200/16 bg-purple-400/8 px-1 py-1 text-purple-100/62">
                        정수 {product.priceEssence ?? 0}
                      </span>
                      <span className="grid place-items-center rounded border border-emerald-200/16 bg-emerald-400/8 px-1 py-1 text-emerald-100/72">
                        <ArrowRight className="h-3 w-3" />
                      </span>
                      <span className="rounded border border-cyan-200/16 bg-cyan-400/8 px-1 py-1 text-cyan-100/62">
                        +{normalShardReward} SHARD
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleBuy(product, disabled)}
                      className={clsx(
                        'btn min-h-10 justify-center text-xs',
                        disabled ? 'cursor-not-allowed border-slate-500/20 bg-slate-400/8 text-white/35' : 'btn-primary',
                      )}
                      title={disabledReason}
                    >
                      {disabled ? <Lock className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                      {disabledReason}
                    </button>
                    {isExchange ? (
                      <div className="grid min-h-10 place-items-center rounded-md border border-emerald-300/18 bg-emerald-400/8 px-2 text-[10px] font-bold text-emerald-100">
                        FIXED TRADE
                      </div>
                    ) : (
                    <button
                      type="button"
                      onClick={() => setExpandedProbabilityId(expanded ? undefined : product.id)}
                      className="min-h-10 rounded-md border border-cyan-300/18 bg-cyan-400/8 px-2 text-[10px] font-bold text-cyan-100 transition hover:bg-cyan-400/13"
                    >
                      {expanded ? '접기' : '확률'}
                    </button>
                    )}
                  </div>
                </div>

                <div className={clsx('relative flex flex-col justify-between border-l border-dashed px-2.5 py-3', visual.stubClass)}>
                  <div className="absolute -left-px inset-y-3 border-l border-dashed border-cyan-100/18" />
                  <div>
                    <div className="system-text text-[9px] text-white/45">PRICE</div>
                    <div className="mt-1 text-sm font-black leading-tight text-amber-100">
                      {product.priceGold.toLocaleString()}
                    </div>
                    <div className="system-text text-[9px] text-amber-100/65">Gold</div>
                    {product.priceEssence ? (
                      <div className="mt-2 rounded border border-purple-200/20 bg-purple-300/10 px-1.5 py-1 text-[10px] font-bold text-purple-100">
                        정수 {product.priceEssence}
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <div className="system-text text-[9px] text-white/45">TYPE</div>
                    <div className="mt-1 text-[11px] font-bold leading-tight text-white/80">
                      {visual.poolLabel}
                    </div>
                    <div className={clsx(
                      'mt-2 rounded border px-1.5 py-1 text-[9px] system-text text-white/50',
                      isExchange ? 'border-emerald-200/16 bg-emerald-400/8 text-emerald-100/58' : 'border-cyan-100/12 bg-black/14',
                    )}>
                      {isExchange ? 'RESOURCE TRADE' : '전략 선택'}
                    </div>
                  </div>
                </div>
              </div>

              {!isExchange && expanded && (
                <ProbabilityPanel sections={sections} />
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function ProbabilityPanel({ sections }: { sections: ProbabilitySection[] }) {
  return (
    <div className="border-t border-cyan-300/12 bg-ink-950/45 px-3.5 pb-3.5 pt-3">
      <div className="mb-2 flex items-center gap-1.5 system-text text-[10px] text-cyan-100/65">
        <Sparkles className="h-3.5 w-3.5" />
        PROBABILITY
      </div>
      <div className="space-y-2">
        {sections.map(section => (
          <div key={section.title} className="rounded-md border border-cyan-300/12 bg-black/16 p-2">
            <div className="mb-1.5 system-text text-[10px] text-white/55">{section.title}</div>
            <div className="grid gap-1.5">
              {section.rows.map(row => (
                <div key={`${section.title}-${row.label}`} className="flex items-start justify-between gap-2 rounded border border-slate-500/16 bg-slate-400/6 px-2 py-1 text-[11px]">
                  <div className="min-w-0">
                    <div className="font-semibold text-white/70">{row.label}</div>
                    {row.detail ? <div className="text-[10px] text-white/38">{row.detail}</div> : null}
                  </div>
                  <div className="shrink-0 font-black tabular-nums text-cyan-100">{row.value}</div>
                </div>
              ))}
            </div>
            {section.note ? <div className="mt-1.5 text-[10px] leading-relaxed text-white/38">{section.note}</div> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
