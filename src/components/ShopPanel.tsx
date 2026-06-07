import { useState } from 'react'
import clsx from 'clsx'
import {
  ArrowRight,
  CircleDotDashed,
  Coins,
  Crown,
  Gem,
  Lock,
  Minus,
  Package,
  Plus,
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
  essence: '그림자 정수',
  shard: 'SHARD',
  relic: 'RELIC',
  premium: 'PREMIUM',
  mutation: 'MUTATION',
  rune: 'RUNE SYSTEM',
  stone: 'SHADOW STONE',
}

const CATEGORY_CLASS: Record<ShopProductCategory, string> = {
  shadow_summon: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
  equipment_draw: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
  essence: 'border-purple-500/30 bg-purple-500/10 text-purple-100',
  shard: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  relic: 'border-amber-500/35 bg-amber-500/10 text-amber-100',
  premium: 'border-fuchsia-500/35 bg-fuchsia-500/10 text-fuchsia-100',
  mutation: 'border-purple-400/35 bg-purple-400/10 text-purple-200',
  rune: 'border-rose-500/35 bg-rose-500/10 text-rose-200',
  stone: 'border-purple-600/35 bg-purple-600/10 text-purple-200',
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
  if (shadowEssence < (product.priceEssence ?? 0)) return '그림자 정수 부족'
  return '구매 가능'
}

export function ShopPanel() {
  const gold = useGame(s => s.gold ?? 0)
  const shadowEssence = useGame(s => s.shadowEssence ?? 0)
  const purchaseShopProduct = useGame(s => s.purchaseShopProduct)
  const [expandedProbabilityId, setExpandedProbabilityId] = useState<string | undefined>()
  const [equipmentReveal, setEquipmentReveal] = useState<EquipmentRevealPayload | undefined>()
  const [activeFilter, setActiveFilter] = useState<'all' | 'summon' | 'equipment' | 'rune' | 'shard' | 'essence' | 'premium' | 'purchasable'>('all')
  const [purchaseQuantities, setPurchaseQuantities] = useState<Record<string, number>>({})

  const purchasableCount = SHOP_PRODUCTS.filter(p => getDisabledReason(p, gold, shadowEssence) === '구매 가능').length

  const getMaxPurchasable = (product: ShopProduct) => {
    const goldLimit = product.priceGold > 0 ? Math.floor(gold / product.priceGold) : 99
    const essencePrice = product.priceEssence ?? 0
    const essenceLimit = essencePrice > 0 ? Math.floor(shadowEssence / essencePrice) : 99
    return Math.max(0, Math.min(99, goldLimit, essenceLimit))
  }

  const getPurchaseQuantity = (product: ShopProduct) => {
    const max = getMaxPurchasable(product)
    return Math.max(1, Math.min(max || 1, purchaseQuantities[product.id] ?? 1))
  }

  const setPurchaseQuantity = (product: ShopProduct, nextQuantity: number) => {
    const max = getMaxPurchasable(product)
    const safeQuantity = Math.max(1, Math.min(max || 1, Math.floor(nextQuantity) || 1))
    setPurchaseQuantities(prev => ({ ...prev, [product.id]: safeQuantity }))
  }

  const filteredProducts = SHOP_PRODUCTS.filter(product => {
    if (activeFilter === 'all') return true
    const disabledReason = getDisabledReason(product, gold, shadowEssence)
    if (activeFilter === 'purchasable') return disabledReason === '구매 가능'
    
    if (activeFilter === 'summon') return product.category === 'shadow_summon'
    if (activeFilter === 'equipment') return product.category === 'equipment_draw'
    if (activeFilter === 'rune') return product.category === 'rune'
    if (activeFilter === 'shard') return product.category === 'shard'
    if (activeFilter === 'essence') return product.category === 'essence' || product.category === 'mutation'
    if (activeFilter === 'premium') return product.category === 'premium' || product.category === 'relic'
    return true
  })

  const handleBuy = (product: ShopProduct, disabled: boolean) => {
    if (disabled) return
    const quantity = getPurchaseQuantity(product)
    const totalGoldCost = product.priceGold * quantity
    const totalEssenceCost = (product.priceEssence ?? 0) * quantity
    const cost = `${totalGoldCost.toLocaleString()} Gold${totalEssenceCost ? ` + 그림자 정수 ${totalEssenceCost}` : ''}`
    if (!window.confirm(`${product.name} x${quantity}개를 구매할까요?\n${cost}`)) return
    const before = useGame.getState()
    const beforeItemIds = new Set(before.items.map(item => item.id))
    const equipmentSlots: EquipmentSlot[] = ['weapon', 'armor', 'accessory', 'artifact']
    const previousBySlot = equipmentSlots.reduce<EquipmentRevealPayload['previousBySlot']>((acc, slot) => {
      const equippedId = before.equipment[slot]
      const equippedItem = equippedId ? before.items.find(item => item.id === equippedId) : undefined
      if (equippedItem) acc[slot] = equippedItem
      return acc
    }, {})
    purchaseShopProduct(product.id, quantity)
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

  const filters = [
    { id: 'all', label: '전체' },
    { id: 'summon', label: '소환' },
    { id: 'equipment', label: '장비권' },
    { id: 'rune', label: '룬 보급' },
    { id: 'shard', label: '그림자 조각' },
    { id: 'essence', label: '그림자 정수/교환' },
    { id: 'premium', label: '프리미엄' },
    { id: 'purchasable', label: '구매 가능' },
  ] as const

  return (
    <div className="space-y-4">
      <EquipmentRevealModal reveal={equipmentReveal} onClose={() => setEquipmentReveal(undefined)} />
      
      {/* Hunter Shop Header & Resources HUD */}
      <div className="panel corner-bracket border-amber-500/20 bg-amber-500/6 p-4">
        <div className="br" />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 system-text text-[11px] text-amber-200/70 font-extrabold tracking-wider">
              <ShoppingBag className="h-4 w-4 text-amber-400" />
              HUNTER SUPPLY DEPOT
            </div>
            <h2 className="text-xl font-black text-white">헌터 보급소</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              보유 골드와 그림자 정수를 사용해 필요한 헌터 소환권 및 장비권을 전략적으로 보급받을 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="rounded-md border border-amber-300/25 bg-amber-400/10 px-3.5 py-1.5 min-w-[130px]">
              <div className="system-text text-[9px] text-amber-200/65 font-bold">보유 GOLD</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-base font-black tabular-nums text-amber-100">
                <Coins className="h-4 w-4 text-amber-400" />
                {gold.toLocaleString()}
              </div>
            </div>
            <div className="rounded-md border border-purple-300/20 bg-purple-400/10 px-3.5 py-1.5 min-w-[130px]">
              <div className="system-text text-[9px] text-purple-200/65 font-bold">보유 그림자 정수</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-base font-black tabular-nums text-purple-100">
                <Gem className="h-4 w-4 text-purple-400" />
                {shadowEssence.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-black/35 rounded-xl border border-white/5 p-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0 max-w-full">
          {filters.map(filter => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-black transition shrink-0 select-none border',
                activeFilter === filter.id
                  ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200 shadow-glow'
                  : 'border-white/5 bg-transparent text-white/50 hover:bg-white/5 hover:text-white/85'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        <div className="text-right text-[10px] sm:text-xs font-bold text-white/45 shrink-0 px-2">
          <span>오늘 구매 가능 품목: </span>
          <span className="text-cyan-300">{purchasableCount}개</span>
          <span className="text-white/20"> / </span>
          <span>{SHOP_PRODUCTS.length}개</span>
        </div>
      </div>

      {/* Product Grid - Single Column Visual Layout */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-ink-950/45 px-4 py-12 text-center text-sm text-white/40">
          해당 필터 조건에 부합하는 보급품이 현재 상점에 존재하지 않습니다.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => {
            const visual = getTicketVisualForProduct(product)
            const Icon = visualIcon(visual)
            const isExchange = visual.artKind === 'exchange'
            const sections = isExchange ? [] : getShopProbabilitySections(product)
            const disabledReason = getDisabledReason(product, gold, shadowEssence)
            const disabled = disabledReason !== '구매 가능'
            const expanded = expandedProbabilityId === product.id
            const purchaseQuantity = getPurchaseQuantity(product)
            const maxPurchaseQuantity = getMaxPurchasable(product)
            const normalShardReward = product.reward.kind === 'shadow_shards' ? product.reward.shards.normal ?? 0 : 0
            const cardLabel = isExchange ? 'EXCHANGE' : CATEGORY_LABEL[product.category]
            const cardClass = isExchange ? visual.accentClass : CATEGORY_CLASS[product.category]

            const hoverBorderClass = !disabled
              ? visual.borderClass.split(' ').map(c => `group-hover:${c}`).join(' ')
              : ''
            const hoverGlowClass = !disabled
              ? visual.glowClass.split(' ').map(c => `group-hover:${c}`).join(' ')
              : ''

            // Determine custom bright neon background glow color per product
            let auraBg = 'bg-cyan-500/28'
            if (product.category === 'premium' || product.id.includes('rare')) {
              auraBg = 'bg-purple-500/30'
            } else if (product.id.includes('weapon') || product.id.includes('armor')) {
              auraBg = 'bg-rose-500/28'
            } else if (product.id.includes('essence') || product.category === 'essence') {
              auraBg = 'bg-emerald-500/28'
            } else if (product.id.includes('accessory')) {
              auraBg = 'bg-violet-500/28'
            }

            return (
              <article
                key={product.id}
                data-exchange-product={isExchange ? product.id : undefined}
                data-ticket-visual-key={visual.key}
                className={clsx(
                  'group relative overflow-hidden rounded-xl border transition-all duration-300 flex flex-col justify-between',
                  'border-white/5 bg-slate-950/80 backdrop-blur-md', // Deep luxury dark card body
                  visual.surfaceClass, // Keep rich dark gradient background intact
                  !disabled && hoverBorderClass,
                  !disabled && hoverGlowClass,
                  disabled && 'opacity-70 scale-[0.99] border-slate-900/60 bg-slate-950/40 hover:opacity-85',
                  product.category === 'premium' && !disabled && 'group-hover:ring-1 group-hover:ring-fuchsia-500/30'
                )}
              >
                {/* Visual Glow Spotlight */}
                <div className="absolute -right-16 -bottom-16 h-36 w-36 rounded-full bg-white/5 blur-3xl opacity-20 pointer-events-none" />
                <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen [background:linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.08)_24%,transparent_45%,rgba(255,255,255,0.04)_64%,transparent_84%)]" />

                {/* Card Body Container */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3.5">
                  
                  {/* Top Header Row */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="system-text text-[9px] tracking-[0.15em] text-white/40 font-bold uppercase">{visual.label}</div>
                        <h3 className="mt-0.5 truncate text-sm font-black text-white leading-tight">{product.name}</h3>
                      </div>
                      <span className={clsx('shrink-0 rounded-full border px-2 py-0.5 text-[8.5px] font-black tracking-wider shadow-sm', cardClass)}>
                        {cardLabel}
                      </span>
                    </div>

                    {/* Middle Ticket Visual Art Zone - borderless, backgroundless floating artwork area */}
                    <div className="my-3 relative flex items-center justify-center min-h-[115px] overflow-visible">
                      {/* Layer 0: Supernova Core White Laser (fine-tuned comfortable center beam) */}
                      <div className="absolute w-16 h-16 rounded-full bg-white/32 blur-2xl opacity-85 pointer-events-none transition-all duration-500 group-hover:scale-130 group-hover:opacity-100" />

                      {/* Layer 1: Core spotlight (comfortable close range glow) */}
                      <div className={clsx('absolute w-24 h-24 rounded-full blur-2xl opacity-80 pointer-events-none transition-all duration-500 group-hover:scale-135 group-hover:opacity-95', auraBg.replace('/28', '/65').replace('/30', '/65').replace('/22', '/65'))} />
                      
                      {/* Layer 2: Ambient aura (broad comfortable floating glow) */}
                      <div className={clsx('absolute w-36 h-36 rounded-full blur-3xl opacity-60 pointer-events-none transition-all duration-500 group-hover:scale-145 group-hover:opacity-85', auraBg.replace('/28', '/40').replace('/30', '/40').replace('/22', '/40'))} />

                      {/* Layer 3: Dynamic pulse aura (soft comfortable wide pulse in background) */}
                      <div className={clsx('absolute w-44 h-44 rounded-full blur-3xl opacity-25 pointer-events-none animate-pulse', auraBg.replace('/28', '/20').replace('/30', '/20').replace('/22', '/20'))} />

                      {/* Highlighted Ticket visual with comfortable brightness/contrast/saturation boost to pop over the dark card */}
                      <div className="relative z-10 transition-all duration-500 transform group-hover:scale-105 filter brightness-[1.38] contrast-[1.20] saturate-[1.20] group-hover:brightness-[1.65] group-hover:contrast-[1.28] group-hover:saturate-[1.32] drop-shadow-[0_0_28px_rgba(255,255,255,0.15)]">
                        <TicketVisual visual={visual} />
                      </div>
                    </div>

                    {/* Secondary Description */}
                    <div className="flex items-center gap-3">
                      <div className={clsx('relative grid h-10 w-10 shrink-0 place-items-center rounded-lg border shadow-sm', visual.accentClass)}>
                        <div className="absolute inset-1 rounded border border-white/5" />
                        <Icon className="relative h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-white/80 leading-normal">{visual.shortDescription}</div>
                        <div className="text-[9.5px] leading-relaxed text-white/45 truncate mt-0.5">{product.rewardSummary}</div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing / Meta Information Block */}
                  <div>
                    {isExchange ? (
                      <div className="mb-3.5 grid grid-cols-3 gap-1 px-2.5 py-1.5 rounded-lg border border-slate-500/10 bg-black/40 text-center system-text text-[9.5px] font-bold text-white/50">
                        <span className="text-purple-300">그림자 정수 {product.priceEssence ?? 0}개</span>
                        <span className="grid place-items-center text-emerald-300 font-black">
                          <ArrowRight className="h-3 w-3" />
                        </span>
                        <span className="text-cyan-300">+{normalShardReward} 조각</span>
                      </div>
                    ) : (
                      <div className="mb-3.5 flex items-center justify-between px-3 py-2 rounded-lg border border-white/5 bg-black/45">
                        <div className="flex flex-col">
                          <span className="text-[8.5px] text-white/35 font-extrabold uppercase tracking-wider leading-none mb-1">보급 가격</span>
                          <div className="flex items-center gap-1">
                            <Coins className="h-3.5 w-3.5 text-amber-400" />
                            <span className="text-xs font-black text-amber-200">{product.priceGold.toLocaleString()} G</span>
                            {product.priceEssence ? (
                              <>
                                <span className="text-white/20 text-xs px-0.5">+</span>
                                <Gem className="h-3.5 w-3.5 text-purple-400" />
                                <span className="text-xs font-black text-purple-200">{product.priceEssence} 그림자 정수</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[8.5px] text-white/35 font-extrabold uppercase tracking-wider leading-none mb-1 block">전략 분류</span>
                          <span className="text-[10px] font-extrabold text-cyan-200 bg-cyan-950/40 border border-cyan-800/30 rounded px-1.5 py-0.5">
                            {visual.poolLabel}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="grid grid-cols-[auto_1fr_auto] gap-2">
                      <div className={clsx(
                        'flex h-11 items-center rounded-lg border bg-black/35',
                        disabled ? 'border-red-500/15 opacity-60' : 'border-cyan-400/20'
                      )}>
                        <button
                          type="button"
                          disabled={disabled || purchaseQuantity <= 1}
                          onClick={() => setPurchaseQuantity(product, purchaseQuantity - 1)}
                          className="grid h-11 w-9 place-items-center text-white/60 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                          title="수량 감소"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, maxPurchaseQuantity)}
                          value={purchaseQuantity}
                          disabled={disabled}
                          onChange={(event) => setPurchaseQuantity(product, Number(event.target.value))}
                          className="h-9 w-12 border-x border-white/10 bg-transparent text-center text-xs font-black tabular-nums text-cyan-100 outline-none disabled:text-white/40"
                          aria-label={`${product.name} 구매 수량`}
                        />
                        <button
                          type="button"
                          disabled={disabled || purchaseQuantity >= maxPurchaseQuantity}
                          onClick={() => setPurchaseQuantity(product, purchaseQuantity + 1)}
                          className="grid h-11 w-9 place-items-center text-white/60 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                          title="수량 증가"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleBuy(product, disabled)}
                        className={clsx(
                          'relative flex min-h-11 items-center justify-center gap-1.5 rounded-lg font-black text-xs transition-all duration-300 flex-1 select-none',
                          disabled
                            ? 'cursor-not-allowed border border-red-500/25 bg-red-950/15 text-red-400 shadow-sm opacity-70'
                            : 'border border-cyan-400/50 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 hover:text-white shadow-glow'
                        )}
                        title={disabledReason}
                      >
                        {disabled ? (
                          <>
                            <Lock className="h-3.5 w-3.5 text-red-400/60" />
                            <span>{disabledReason}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-3.5 w-3.5 animate-pulse" />
                            <span>{purchaseQuantity > 1 ? `보급 구매 x${purchaseQuantity}` : '보급 구매'}</span>
                          </>
                        )}
                      </button>

                      {isExchange ? (
                        <div className="flex h-11 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-[10px] font-black text-emerald-300 shrink-0">
                          확정 교환
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setExpandedProbabilityId(expanded ? undefined : product.id)}
                          className={clsx(
                            "min-h-11 rounded-lg border px-3 text-[10px] font-black transition-all duration-200 shrink-0 select-none",
                            expanded
                              ? "border-amber-500/40 bg-amber-500/20 text-amber-200"
                              : "border-cyan-300/18 bg-cyan-400/8 text-cyan-100 hover:bg-cyan-400/15"
                          )}
                        >
                          {expanded ? '확률 접기' : '확률 보기'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Probability Details Drawer inside the Card border frame */}
                {!isExchange && expanded && (
                  <ProbabilityPanel sections={sections} />
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProbabilityPanel({ sections }: { sections: ProbabilitySection[] }) {
  return (
    <div className="border-t border-cyan-300/12 bg-ink-950/45 px-3.5 pb-3.5 pt-3 select-none">
      <div className="mb-2 flex items-center gap-1.5 system-text text-[10px] text-cyan-100/65 font-bold">
        <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
        PROBABILITY DETAILS
      </div>
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {sections.map(section => (
          <div key={section.title} className="rounded-md border border-cyan-300/12 bg-black/16 p-2">
            <div className="mb-1.5 system-text text-[9.5px] text-white/55 font-bold">{section.title}</div>
            <div className="grid gap-1">
              {section.rows.map(row => (
                <div key={`${section.title}-${row.label}`} className="flex items-start justify-between gap-2 rounded border border-slate-500/16 bg-slate-400/6 px-2 py-1 text-[10.5px]">
                  <div className="min-w-0">
                    <div className="font-semibold text-white/70">{row.label}</div>
                    {row.detail ? <div className="text-[9px] text-white/38 leading-none mt-0.5">{row.detail}</div> : null}
                  </div>
                  <div className="shrink-0 font-black tabular-nums text-cyan-100">{row.value}</div>
                </div>
              ))}
            </div>
            {section.note ? <div className="mt-1.5 text-[9px] leading-relaxed text-white/38">{section.note}</div> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
