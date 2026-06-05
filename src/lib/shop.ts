import type {
  EquipmentSlot,
  EquipmentStars,
  ItemRarity,
  ShadowInnateGrade,
  ShadowRarity,
  ShadowSummonShardType,
  ShadowSummonTicket,
} from './types'

export type ShopProductCategory =
  | 'shadow_summon'
  | 'equipment_draw'
  | 'essence'
  | 'shard'
  | 'relic'
  | 'premium'
  | 'mutation'

export type ShopEquipmentDrawTier = 'standard' | 'relic' | 'rare'
export type EquipmentQualitySource = 'normal' | 'weekly' | 'boss' | 'high_boss'

export type ShopReward =
  | { kind: 'shadow_ticket'; ticketType: ShadowSummonTicket['ticketType']; quantity: number }
  | { kind: 'shadow_shards'; shards: Partial<Record<ShadowSummonShardType, number>> }
  | { kind: 'shadow_essence'; amount: number }
  | { kind: 'equipment_draw'; slot: EquipmentSlot | 'random'; quantity: number; drawTier: ShopEquipmentDrawTier }
  | { kind: 'expedition_ticket'; quantity: number }
  | { kind: 'mutation_material_normal'; quantity: number }
  | { kind: 'mutation_material_advanced'; quantity: number }
  | { kind: 'mutation_material_supreme'; quantity: number }
  | { kind: 'mixed'; rewards: ShopReward[] }

export interface ShopProduct {
  id: string
  name: string
  description: string
  category: ShopProductCategory
  visualKey?: string
  priceGold: number
  priceEssence?: number
  reward: ShopReward
  rewardSummary: string
}

export const SHOP_EQUIPMENT_DRAW_RARITY_WEIGHTS: Record<ShopEquipmentDrawTier, Partial<Record<ItemRarity, number>>> = {
  standard: { common: 52, uncommon: 32, rare: 13, epic: 2.7, legendary: 0.3 },
  relic: { common: 24, uncommon: 34, rare: 29, epic: 11, legendary: 2 },
  rare: { rare: 72, epic: 24, legendary: 4 },
}

export const SHOP_EQUIPMENT_DRAW_QUALITY_SOURCE: Record<ShopEquipmentDrawTier, EquipmentQualitySource> = {
  standard: 'normal',
  relic: 'weekly',
  rare: 'boss',
}

export const EQUIPMENT_STAR_WEIGHTS_BY_SOURCE: Record<EquipmentQualitySource, Record<EquipmentStars, number>> = {
  normal: { 1: 45, 2: 35, 3: 15, 4: 4.5, 5: 0.5 },
  weekly: { 1: 25, 2: 38, 3: 25, 4: 10, 5: 2 },
  boss: { 1: 10, 2: 30, 3: 35, 4: 20, 5: 5 },
  high_boss: { 1: 5, 2: 20, 3: 35, 4: 30, 5: 10 },
}

export const SHOP_SHADOW_TICKET_INNATE_SOURCE: Record<'normal_shadow' | 'rare_shadow', 'normal_ticket' | 'rare_ticket'> = {
  normal_shadow: 'normal_ticket',
  rare_shadow: 'rare_ticket',
}

export const SHADOW_INNATE_GRADE_WEIGHTS_BY_SOURCE: Record<
  'gate_extract' | 'normal_ticket' | 'rare_ticket' | 'role_ticket' | 'gate_named_ticket' | 'achievement_ticket' | 'main_s_achievement_ticket',
  Record<ShadowInnateGrade, number>
> = {
  gate_extract: { C: 62, B: 30, A: 7.5, S: 0.5 },
  normal_ticket: { C: 35, B: 35, A: 20, S: 10 },
  rare_ticket: { C: 18, B: 30, A: 34, S: 18 },
  role_ticket: { C: 30, B: 34, A: 24, S: 12 },
  gate_named_ticket: { C: 0, B: 45, A: 40, S: 15 },
  achievement_ticket: { C: 0, B: 20, A: 55, S: 25 },
  main_s_achievement_ticket: { C: 0, B: 0, A: 60, S: 40 },
}

export const SHADOW_SUMMON_RARITY_WEIGHTS_BY_TICKET: Record<
  'normal_shadow' | 'rare_shadow' | 'role_shadow',
  Record<ShadowRarity, number>
> = {
  normal_shadow: { common: 34, uncommon: 28, rare: 20, epic: 12, legendary: 6 },
  rare_shadow: { common: 4,  uncommon: 8,  rare: 22, epic: 30, legendary: 36 },
  role_shadow: { common: 28, uncommon: 30, rare: 24, epic: 12, legendary: 6 },
}

export const SHADOW_SUMMON_SPECIAL_POOL_WEIGHT: Record<'standard' | 'gate_named' | 'achievement_named', number> = {
  standard: 1,
  gate_named: 0.16,
  achievement_named: 0.18,
}

export const SHOP_SHADOW_TICKET_RARITY_LIMIT: Record<'normal_shadow' | 'rare_shadow', ShadowRarity> = {
  normal_shadow: 'rare',
  rare_shadow: 'epic',
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'normal-shadow-ticket',
    name: '일반 그림자 소환권',
    description: '일반 그림자 풀에서 1회 소환할 수 있는 소환권입니다.',
    category: 'shadow_summon',
    priceGold: 120,
    reward: { kind: 'shadow_ticket', ticketType: 'normal_shadow', quantity: 1 },
    rewardSummary: '일반 소환권 x1',
  },
  {
    id: 'weapon-draw-ticket',
    name: '무기 장비권',
    description: '무기 슬롯 장비 1개를 획득합니다.',
    category: 'equipment_draw',
    priceGold: 90,
    reward: { kind: 'equipment_draw', slot: 'weapon', quantity: 1, drawTier: 'standard' },
    rewardSummary: '무기 장비 x1',
  },
  {
    id: 'armor-draw-ticket',
    name: '방어구 장비권',
    description: '방어구 슬롯 장비 1개를 획득합니다.',
    category: 'equipment_draw',
    priceGold: 90,
    reward: { kind: 'equipment_draw', slot: 'armor', quantity: 1, drawTier: 'standard' },
    rewardSummary: '방어구 장비 x1',
  },
  {
    id: 'accessory-draw-ticket',
    name: '장신구 장비권',
    description: '장신구 슬롯 장비 1개를 획득합니다.',
    category: 'equipment_draw',
    priceGold: 100,
    reward: { kind: 'equipment_draw', slot: 'accessory', quantity: 1, drawTier: 'standard' },
    rewardSummary: '장신구 장비 x1',
  },
  {
    id: 'small-essence-pack',
    name: '그림자 정수 팩',
    description: '강화와 조각 교환에 사용할 수 있는 소량 정수입니다.',
    category: 'essence',
    priceGold: 80,
    reward: { kind: 'shadow_essence', amount: 4 },
    rewardSummary: '그림자 정수 +4',
  },
  {
    id: 'essence-normal-shards',
    visualKey: 'exchange_essence_gold_to_shard',
    name: '그림자 정수 조각 교환',
    description: '그림자 정수와 Gold를 함께 써서 일반 소환 조각을 보급합니다.',
    category: 'shard',
    priceGold: 60,
    priceEssence: 6,
    reward: { kind: 'shadow_shards', shards: { normal: 3 } },
    rewardSummary: '일반 조각 +3',
  },
  {
    id: 'rare-shadow-shards',
    name: '고급 소환 조각 묶음',
    description: '고급 그림자 소환권에 천천히 접근하는 조각 묶음입니다.',
    category: 'premium',
    priceGold: 450,
    reward: { kind: 'shadow_shards', shards: { rare: 3 } },
    rewardSummary: '고급 조각 +3',
  },
  {
    id: 'rare-shadow-ticket',
    name: '고급 그림자 소환권',
    description: '고급 그림자 풀에서 1회 소환할 수 있는 소환권입니다.',
    category: 'premium',
    priceGold: 900,
    priceEssence: 12,
    reward: { kind: 'shadow_ticket', ticketType: 'rare_shadow', quantity: 1 },
    rewardSummary: '고급 소환권 x1',
  },
  {
    id: 'relic-draw-ticket',
    name: '유물 장비권',
    description: '유물 슬롯 장비 1개를 획득합니다.',
    category: 'relic',
    priceGold: 650,
    reward: { kind: 'equipment_draw', slot: 'artifact', quantity: 1, drawTier: 'relic' },
    rewardSummary: '유물 장비 x1',
  },
  {
    id: 'rare-equipment-ticket',
    name: '희귀 장비권',
    description: '희귀 이상 장비 1개를 획득합니다.',
    category: 'premium',
    priceGold: 750,
    reward: { kind: 'equipment_draw', slot: 'random', quantity: 1, drawTier: 'rare' },
    rewardSummary: '희귀+ 장비 x1',
  },
  {
    id: 'shadow-shard-bundle',
    name: '그림자 조각 묶음',
    description: '일반 조각과 고급 조각을 함께 얻는 그림자 정수 교환 상품입니다.',
    category: 'shard',
    priceGold: 350,
    priceEssence: 8,
    reward: { kind: 'shadow_shards', shards: { normal: 4, rare: 1 } },
    rewardSummary: '일반 +4 / 고급 +1',
  },
  {
    id: 'equipment-choice-bundle',
    name: '선택형 장비권 묶음',
    description: '무기, 방어구, 장신구 장비권을 한 번에 보급합니다.',
    category: 'equipment_draw',
    priceGold: 500,
    reward: {
      kind: 'mixed',
      rewards: [
        { kind: 'equipment_draw', slot: 'weapon', quantity: 1, drawTier: 'standard' },
        { kind: 'equipment_draw', slot: 'armor', quantity: 1, drawTier: 'standard' },
        { kind: 'equipment_draw', slot: 'accessory', quantity: 1, drawTier: 'standard' },
      ],
    },
    rewardSummary: '무기/방어구/장신구 x1',
  },
  {
    id: 'expedition-ticket',
    name: '원정 티켓',
    description: '그림자의 일상 원정을 시작하기 위해 필요한 티켓입니다.',
    category: 'premium',
    priceGold: 350,
    reward: { kind: 'expedition_ticket', quantity: 1 },
    rewardSummary: '원정 티켓 x1',
  },
  {
    id: 'mutation-material-normal',
    name: '일반 변이 재료',
    description: '그림자를 일반적인 형태로 변형시키는 기본적인 재료입니다. 약간의 스탯 상승과 무작위 외형 변주를 제공합니다.',
    category: 'mutation',
    priceGold: 150,
    reward: { kind: 'mutation_material_normal', quantity: 1 },
    rewardSummary: '일반 변이 재료 x1',
  },
  {
    id: 'mutation-material-advanced',
    name: '고급 변이 재료',
    description: '그림자를 정밀하게 변이시키는 고급 재료입니다. 더 높은 스탯 상승 기댓값과 새로운 특성 획득 확률을 지닙니다.',
    category: 'mutation',
    priceGold: 450,
    priceEssence: 3,
    reward: { kind: 'mutation_material_advanced', quantity: 1 },
    rewardSummary: '고급 변이 재료 x1',
  },
  {
    id: 'mutation-material-supreme',
    name: '최고급 변이 재료',
    description: '그림자를 완전히 재탄생시키는 궁극의 재료입니다. 매우 큰 스탯 상승을 보장하며, 높은 확률로 외형 변형과 특성 추가를 동반합니다.',
    category: 'mutation',
    priceGold: 1200,
    priceEssence: 10,
    reward: { kind: 'mutation_material_supreme', quantity: 1 },
    rewardSummary: '최고급 변이 재료 x1',
  },
]

export const getShopDrawWeights = (drawTier: ShopEquipmentDrawTier): Partial<Record<ItemRarity, number>> =>
  SHOP_EQUIPMENT_DRAW_RARITY_WEIGHTS[drawTier]

export const getShopDrawQualitySource = (drawTier: ShopEquipmentDrawTier): EquipmentQualitySource =>
  SHOP_EQUIPMENT_DRAW_QUALITY_SOURCE[drawTier]

export const getEquipmentStarWeights = (source: EquipmentQualitySource): Record<EquipmentStars, number> =>
  EQUIPMENT_STAR_WEIGHTS_BY_SOURCE[source]
