import type { ShopProduct } from './shop'
import exchangeEssenceGoldToShard from '../assets/tickets/exchange-essence-gold-to-shard.png'
import packShadowEssenceSmall from '../assets/tickets/pack-shadow-essence-small.png'
import packShadowPremiumShards from '../assets/tickets/pack-shadow-premium-shards.png'
import packShadowShards from '../assets/tickets/pack-shadow-shards.png'
import ticketEquipmentAccessory from '../assets/tickets/ticket-equipment-accessory.png'
import ticketEquipmentArmor from '../assets/tickets/ticket-equipment-armor.png'
import ticketEquipmentChoiceBundle from '../assets/tickets/ticket-equipment-choice-bundle.png'
import ticketEquipmentRare from '../assets/tickets/ticket-equipment-rare.png'
import ticketEquipmentRelic from '../assets/tickets/ticket-equipment-relic.png'
import ticketEquipmentWeapon from '../assets/tickets/ticket-equipment-weapon.png'
import ticketShadowNormal from '../assets/tickets/ticket-shadow-normal.png'
import ticketShadowPremium from '../assets/tickets/ticket-shadow-premium.png'
import ticketShadowTravel from '../assets/tickets/ticket-shadow-travel.png'

export type TicketArtKind =
  | 'shadow'
  | 'rare-shadow'
  | 'weapon'
  | 'armor'
  | 'accessory'
  | 'relic'
  | 'rare-gear'
  | 'bundle'
  | 'essence'
  | 'exchange'
  | 'travel'

export type TicketVisualKey =
  | 'shadow-normal'
  | 'shadow-rare'
  | 'shadow-rare-shards'
  | 'equipment-weapon'
  | 'equipment-armor'
  | 'equipment-accessory'
  | 'equipment-relic'
  | 'equipment-rare'
  | 'equipment-choice'
  | 'essence-pack'
  | 'essence-exchange'
  | 'exchange_essence_gold_to_shard'
  | 'shadow-bundle'
  | 'shadow-travel'
  | 'shop-supply'

export type TicketVisual = {
  key: TicketVisualKey
  label: string
  shortDescription: string
  glyph: string
  artKind: TicketArtKind
  borderClass: string
  surfaceClass: string
  glowClass: string
  accentClass: string
  stubClass: string
  poolLabel: string
}

export const TICKET_ASSET_MANIFEST: Partial<Record<TicketVisualKey, string>> = {
  'shadow-normal': ticketShadowNormal,
  'shadow-rare': ticketShadowPremium,
  'shadow-rare-shards': packShadowPremiumShards,
  'equipment-weapon': ticketEquipmentWeapon,
  'equipment-armor': ticketEquipmentArmor,
  'equipment-accessory': ticketEquipmentAccessory,
  'equipment-relic': ticketEquipmentRelic,
  'equipment-rare': ticketEquipmentRare,
  'equipment-choice': ticketEquipmentChoiceBundle,
  'essence-pack': packShadowEssenceSmall,
  'essence-exchange': exchangeEssenceGoldToShard,
  'exchange_essence_gold_to_shard': exchangeEssenceGoldToShard,
  'shadow-bundle': packShadowShards,
  'shadow-travel': ticketShadowTravel,
}

export const getTicketVisualAsset = (key: TicketVisualKey): string | undefined =>
  TICKET_ASSET_MANIFEST[key]

export const TICKET_VISUALS_BY_PRODUCT_ID: Record<string, TicketVisual> = {
  'normal-shadow-ticket': {
    key: 'shadow-normal',
    label: 'SHADOW CALL',
    shortDescription: '일반 그림자 1회 소환',
    glyph: 'RUNE',
    artKind: 'shadow',
    borderClass: 'border-cyan-300/35',
    surfaceClass: 'from-cyan-400/16 via-blue-500/8 to-ink-950/80',
    glowClass: 'shadow-[0_0_32px_rgba(34,211,238,0.18)]',
    accentClass: 'text-cyan-100 border-cyan-200/30 bg-cyan-300/12',
    stubClass: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
    poolLabel: '그림자 풀',
  },
  'rare-shadow-ticket': {
    key: 'shadow-rare',
    label: 'RARE SUMMON',
    shortDescription: '고급 그림자 1회 소환',
    glyph: 'ARCANA',
    artKind: 'rare-shadow',
    borderClass: 'border-purple-300/40',
    surfaceClass: 'from-purple-500/18 via-amber-300/10 to-ink-950/80',
    glowClass: 'shadow-[0_0_36px_rgba(168,85,247,0.2)]',
    accentClass: 'text-amber-100 border-amber-200/35 bg-amber-300/12',
    stubClass: 'border-purple-300/25 bg-purple-400/10 text-purple-100',
    poolLabel: '고급 그림자',
  },
  'rare-shadow-shards': {
    key: 'shadow-rare-shards',
    label: 'RARE SIGNAL',
    shortDescription: '고급 소환 조각 묶음',
    glyph: 'SIGIL',
    artKind: 'rare-shadow',
    borderClass: 'border-purple-300/35',
    surfaceClass: 'from-purple-500/16 via-fuchsia-400/8 to-ink-950/80',
    glowClass: 'shadow-[0_0_26px_rgba(217,70,239,0.13)]',
    accentClass: 'text-purple-100 border-purple-200/30 bg-purple-300/12',
    stubClass: 'border-purple-300/25 bg-purple-400/10 text-purple-100',
    poolLabel: '조각',
  },
  'weapon-draw-ticket': {
    key: 'equipment-weapon',
    label: 'WEAPON DRAW',
    shortDescription: '무기 슬롯 장비 1개 획득',
    glyph: 'BLADE',
    artKind: 'weapon',
    borderClass: 'border-rose-300/35',
    surfaceClass: 'from-rose-500/16 via-slate-300/8 to-ink-950/80',
    glowClass: 'shadow-[0_0_26px_rgba(244,63,94,0.13)]',
    accentClass: 'text-rose-100 border-rose-200/30 bg-rose-300/12',
    stubClass: 'border-rose-300/25 bg-rose-400/10 text-rose-100',
    poolLabel: '무기',
  },
  'armor-draw-ticket': {
    key: 'equipment-armor',
    label: 'ARMOR DRAW',
    shortDescription: '방어구 슬롯 장비 1개 획득',
    glyph: 'PLATE',
    artKind: 'armor',
    borderClass: 'border-blue-300/35',
    surfaceClass: 'from-blue-500/16 via-slate-300/8 to-ink-950/80',
    glowClass: 'shadow-[0_0_26px_rgba(59,130,246,0.13)]',
    accentClass: 'text-blue-100 border-blue-200/30 bg-blue-300/12',
    stubClass: 'border-blue-300/25 bg-blue-400/10 text-blue-100',
    poolLabel: '방어구',
  },
  'accessory-draw-ticket': {
    key: 'equipment-accessory',
    label: 'GEM DRAW',
    shortDescription: '장신구 슬롯 장비 1개 획득',
    glyph: 'GEM',
    artKind: 'accessory',
    borderClass: 'border-violet-300/35',
    surfaceClass: 'from-violet-500/16 via-fuchsia-300/8 to-ink-950/80',
    glowClass: 'shadow-[0_0_26px_rgba(139,92,246,0.13)]',
    accentClass: 'text-violet-100 border-violet-200/30 bg-violet-300/12',
    stubClass: 'border-violet-300/25 bg-violet-400/10 text-violet-100',
    poolLabel: '장신구',
  },
  'relic-draw-ticket': {
    key: 'equipment-relic',
    label: 'ANCIENT RELIC',
    shortDescription: '유물 슬롯 장비 1개 획득',
    glyph: 'RELIC',
    artKind: 'relic',
    borderClass: 'border-amber-300/40',
    surfaceClass: 'from-amber-400/18 via-yellow-200/8 to-ink-950/80',
    glowClass: 'shadow-[0_0_34px_rgba(245,158,11,0.18)]',
    accentClass: 'text-amber-100 border-amber-200/35 bg-amber-300/12',
    stubClass: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
    poolLabel: '유물',
  },
  'rare-equipment-ticket': {
    key: 'equipment-rare',
    label: 'RARE GEAR',
    shortDescription: '희귀 이상 장비 1개 획득',
    glyph: 'PRISM',
    artKind: 'rare-gear',
    borderClass: 'border-cyan-200/40',
    surfaceClass: 'from-cyan-400/16 via-amber-300/10 to-ink-950/80',
    glowClass: 'shadow-[0_0_30px_rgba(34,211,238,0.16)]',
    accentClass: 'text-cyan-100 border-cyan-200/35 bg-cyan-300/12',
    stubClass: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
    poolLabel: '희귀+',
  },
  'equipment-choice-bundle': {
    key: 'equipment-choice',
    label: 'GEAR BUNDLE',
    shortDescription: '무기/방어구/장신구 장비권 묶음',
    glyph: 'TRIAD',
    artKind: 'bundle',
    borderClass: 'border-sky-300/35',
    surfaceClass: 'from-sky-400/14 via-violet-300/8 to-ink-950/80',
    glowClass: 'shadow-[0_0_26px_rgba(14,165,233,0.13)]',
    accentClass: 'text-sky-100 border-sky-200/30 bg-sky-300/12',
    stubClass: 'border-sky-300/25 bg-sky-400/10 text-sky-100',
    poolLabel: '장비 묶음',
  },
  'small-essence-pack': {
    key: 'essence-pack',
    label: '그림자 정수 팩',
    shortDescription: '그림자 정수 소량 보급',
    glyph: 'CORE',
    artKind: 'essence',
    borderClass: 'border-purple-300/30',
    surfaceClass: 'from-purple-400/14 via-cyan-300/7 to-ink-950/80',
    glowClass: 'shadow-[0_0_22px_rgba(168,85,247,0.1)]',
    accentClass: 'text-purple-100 border-purple-200/28 bg-purple-300/10',
    stubClass: 'border-purple-300/22 bg-purple-400/9 text-purple-100',
    poolLabel: '정수',
  },
  'essence-normal-shards': {
    key: 'exchange_essence_gold_to_shard',
    label: 'SHARD EXCHANGE',
    shortDescription: '정수와 Gold로 일반 조각 교환',
    glyph: 'TRADE',
    artKind: 'exchange',
    borderClass: 'border-emerald-300/30',
    surfaceClass: 'from-emerald-400/13 via-cyan-300/7 to-ink-950/80',
    glowClass: 'shadow-[0_0_22px_rgba(16,185,129,0.1)]',
    accentClass: 'text-emerald-100 border-emerald-200/28 bg-emerald-300/10',
    stubClass: 'border-emerald-300/22 bg-emerald-400/9 text-emerald-100',
    poolLabel: '교환',
  },
  'shadow-shard-bundle': {
    key: 'shadow-bundle',
    label: 'SHARD BUNDLE',
    shortDescription: '그림자 조각 묶음',
    glyph: 'BIND',
    artKind: 'rare-shadow',
    borderClass: 'border-fuchsia-300/32',
    surfaceClass: 'from-fuchsia-400/14 via-purple-300/8 to-ink-950/80',
    glowClass: 'shadow-[0_0_22px_rgba(217,70,239,0.11)]',
    accentClass: 'text-fuchsia-100 border-fuchsia-200/28 bg-fuchsia-300/10',
    stubClass: 'border-fuchsia-300/22 bg-fuchsia-400/9 text-fuchsia-100',
    poolLabel: '조각',
  },
  'expedition-ticket': {
    key: 'shadow-travel',
    label: 'SHADOW TRAVEL',
    shortDescription: '그림자 일상 원정 티켓',
    glyph: 'TRAVEL',
    artKind: 'travel',
    borderClass: 'border-teal-300/35',
    surfaceClass: 'from-teal-500/16 via-emerald-300/8 to-ink-950/80',
    glowClass: 'shadow-[0_0_26px_rgba(20,184,166,0.13)]',
    accentClass: 'text-teal-100 border-teal-200/30 bg-teal-300/12',
    stubClass: 'border-teal-300/25 bg-teal-400/10 text-teal-100',
    poolLabel: '원정',
  },
}

export const getTicketVisualForProduct = (product: ShopProduct): TicketVisual => {
  const visual = TICKET_VISUALS_BY_PRODUCT_ID[product.id]
  const visualKey = product.visualKey as TicketVisualKey | undefined
  if (visual && visualKey && getTicketVisualAsset(visualKey)) {
    return { ...visual, key: visualKey }
  }
  return visual ?? {
    key: 'shop-supply',
    label: 'SUPPLY',
    shortDescription: product.description,
    glyph: 'SHOP',
    artKind: 'bundle',
    borderClass: 'border-cyan-300/25',
    surfaceClass: 'from-cyan-400/12 via-slate-400/6 to-ink-950/80',
    glowClass: 'shadow-[0_0_20px_rgba(34,211,238,0.09)]',
    accentClass: 'text-cyan-100 border-cyan-200/25 bg-cyan-300/10',
    stubClass: 'border-cyan-300/22 bg-cyan-400/9 text-cyan-100',
    poolLabel: '보급',
  }
}
