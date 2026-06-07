import {
  SHADOW_RARITY_ORDER,
  getShadowSummonRarityWeights,
  getStandardShadowSummonPool,
} from './shadows'
import {
  EQUIPMENT_STAR_WEIGHTS_BY_SOURCE,
  SHOP_SHADOW_TICKET_INNATE_SOURCE,
  SHADOW_INNATE_GRADE_WEIGHTS_BY_SOURCE,
  getEquipmentStarWeights,
  getShopDrawQualitySource,
  getShopDrawWeights,
  type ShopProduct,
  type ShopReward,
} from './shop'
import type { EquipmentSlot, ItemRarity, ShadowInnateGrade, ShadowRarity } from './types'

export type ProbabilityRow = {
  label: string
  value: string
  detail?: string
}

export type ProbabilitySection = {
  title: string
  rows: ProbabilityRow[]
  note?: string
}

const itemRarityLabel: Record<ItemRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

const shadowRarityLabel: Record<ShadowRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

const innateGradeLabel: Record<ShadowInnateGrade, string> = {
  C: 'C',
  B: 'B',
  A: 'A',
  S: 'S',
}

const slotLabel: Record<EquipmentSlot | 'random', string> = {
  weapon: '무기',
  armor: '방어구',
  accessory: '장신구',
  artifact: '유물',
  random: '전체 슬롯',
}

const formatPercent = (value: number): string => {
  if (value <= 0) return '0%'
  if (value < 1) return `${value.toFixed(2).replace(/\.?0+$/, '')}%`
  return `${value.toFixed(1).replace(/\.0$/, '')}%`
}

const rowsFromWeights = <T extends string | number>(
  weights: Partial<Record<T, number>>,
  label: Record<T, string> | ((key: T) => string),
  order?: T[]
): ProbabilityRow[] => {
  const entries = (order ?? Object.keys(weights) as T[])
    .map(key => [key, weights[key] ?? 0] as const)
    .filter(([, weight]) => weight > 0)
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  return entries.map(([key, weight]) => ({
    label: typeof label === 'function' ? label(key) : label[key],
    value: formatPercent((weight / total) * 100),
  }))
}

const getShadowTicketRarityRows = (ticketType: 'normal_shadow' | 'rare_shadow'): ProbabilityRow[] => {
  return rowsFromWeights(getShadowSummonRarityWeights(ticketType), shadowRarityLabel, SHADOW_RARITY_ORDER)
}

const getShadowTicketSections = (ticketType: 'normal_shadow' | 'rare_shadow'): ProbabilitySection[] => {
  const innateSource = SHOP_SHADOW_TICKET_INNATE_SOURCE[ticketType]
  const pool = getStandardShadowSummonPool()
  const hiddenNamedCount = pool.filter(def => def.hiddenUntilObtained && (def.isGateNamed || def.rank === 'named')).length
  const visibleNamedCount = pool.filter(def => !def.hiddenUntilObtained && (def.isAchievementNamed || def.rank === 'named')).length
  return [
    {
      title: '그림자 등급',
      rows: getShadowTicketRarityRows(ticketType),
      note: '현재 소환 로직은 대상 풀에서 균등 추첨하며, 이미 보유한 그림자는 미보유 후보가 있을 때 뒤로 밀립니다.',
    },
    {
      title: '태생 등급',
      rows: rowsFromWeights(SHADOW_INNATE_GRADE_WEIGHTS_BY_SOURCE[innateSource], innateGradeLabel, ['C', 'B', 'A', 'S']),
      note: '소환권 사용 시 실제 rollShadowInnateGrade 테이블과 같은 값을 표시합니다.',
    },
    {
      title: '특수 후보',
      rows: [{ label: '직접 네임드 소환', value: '없음', detail: '상점 일반/고급 소환권은 gate_extract 풀만 사용합니다.' }],
      note: '비공개 대상의 이름, 조건, 정체는 표시하지 않습니다.',
    },
  ]
}

const getShadowTicketSectionsSynced = (ticketType: 'normal_shadow' | 'rare_shadow'): ProbabilitySection[] => {
  const innateSource = SHOP_SHADOW_TICKET_INNATE_SOURCE[ticketType]
  const pool = getStandardShadowSummonPool()
  const hiddenNamedCount = pool.filter(def => def.hiddenUntilObtained && (def.isGateNamed || def.rank === 'named')).length
  const visibleNamedCount = pool.filter(def => !def.hiddenUntilObtained && (def.isAchievementNamed || def.rank === 'named')).length
  return [
    {
      title: '그림자 등급',
      rows: getShadowTicketRarityRows(ticketType),
      note: `현재 실제 소환 helper의 전체 그림자 풀 ${pool.length}개와 같은 rarity 가중치를 표시합니다.`,
    },
    {
      title: '태생 등급',
      rows: rowsFromWeights(SHADOW_INNATE_GRADE_WEIGHTS_BY_SOURCE[innateSource], innateGradeLabel, ['C', 'B', 'A', 'S']),
      note: '소환권 사용 시 실제 rollShadowInnateGrade 테이블과 같은 값을 표시합니다.',
    },
    {
      title: '특수 후보',
      rows: [
        { label: '전체 후보', value: `${pool.length}개`, detail: '일반/고급 소환권 모두 전체 등록 그림자 풀 기준' },
        { label: '공개 네임드 가능성', value: `${visibleNamedCount}종`, detail: '이름이 이미 공개 가능한 성취/네임드 계열만 수량으로 표시' },
        { label: '봉인된 네임드 가능성', value: `${hiddenNamedCount}종`, detail: '개별 이름, 초상, 조건은 표시하지 않음' },
      ],
      note: 'hiddenUntilObtained 대상의 이름, 초상, 해금 조건, 개별 목록은 확률표에 표시하지 않습니다.',
    },
  ]
}

const getEquipmentDrawSections = (reward: Extract<ShopReward, { kind: 'equipment_draw' }>, title?: string): ProbabilitySection[] => {
  const qualitySource = getShopDrawQualitySource(reward.drawTier)
  const rarityRows = rowsFromWeights(getShopDrawWeights(reward.drawTier), itemRarityLabel, ['common', 'uncommon', 'rare', 'epic', 'legendary'])
  const starRows = rowsFromWeights(getEquipmentStarWeights(qualitySource), star => `${star}성`, [1, 2, 3, 4, 5])
  return [
    {
      title: title ? `${title} 등급` : '장비 등급',
      rows: rarityRows,
      note: reward.drawTier === 'rare' ? '희귀 장비권은 Rare 이상 풀만 사용합니다.' : '구매 시 실제 장비권 rarity weight와 같은 값을 표시합니다.',
    },
    {
      title: title ? `${title} 별 등급` : '장비 별 등급',
      rows: starRows,
      note: `equipmentStars는 ${qualitySource} 품질 테이블(${Object.keys(EQUIPMENT_STAR_WEIGHTS_BY_SOURCE[qualitySource]).join('/') }성)을 사용합니다.`,
    },
    {
      title: 'DRAW POOL',
      rows: [
        { label: '슬롯', value: slotLabel[reward.slot] },
        { label: '수량', value: `${reward.quantity}개` },
      ],
      note: reward.slot === 'random' ? '무기/방어구/장신구/유물 슬롯 중 하나를 먼저 고른 뒤 등급 풀을 적용합니다.' : '해당 슬롯 장비만 등장합니다.',
    },
  ]
}

const fixedSection = (product: ShopProduct): ProbabilitySection => ({
  title: 'RESULT',
  rows: [{ label: '지급', value: product.rewardSummary }],
  note: '확률 추첨 없이 표시된 보상을 즉시 지급합니다.',
})

const SHADOW_STONE_BOX_WEIGHTS = {
  common: { common: 50, uncommon: 25, rare: 10, epic: 7.5, legendary: 7.5 },
  advanced: { common: 20, uncommon: 20, rare: 20, epic: 20, legendary: 20 },
}

const getShadowStoneBoxSections = (boxType: 'common' | 'advanced'): ProbabilitySection[] => {
  const weights = SHADOW_STONE_BOX_WEIGHTS[boxType]
  const rows = rowsFromWeights(weights, shadowRarityLabel, ['common', 'uncommon', 'rare', 'epic', 'legendary'])
  return [
    {
      title: '획득 가능한 강화석 등급',
      rows,
      note: '그림자 등급과 동일하거나 상위 등급의 강화석으로만 강화가 가능합니다.',
    }
  ]
}

export const getShopProbabilitySections = (product: ShopProduct): ProbabilitySection[] => {
  const visit = (reward: ShopReward, title?: string): ProbabilitySection[] => {
    if (reward.kind === 'shadow_ticket') {
      if (reward.ticketType === 'normal_shadow' || reward.ticketType === 'rare_shadow') {
        return getShadowTicketSectionsSynced(reward.ticketType)
      }
      return [{
        title: 'SPECIAL SUMMON',
        rows: [{ label: '대상', value: '전용 풀' }],
        note: '전용 소환권은 비공개 대상 이름과 조건을 표시하지 않습니다.',
      }]
    }
    if (reward.kind === 'equipment_draw') return getEquipmentDrawSections(reward, title)
    if (reward.kind === 'shadow_stone_box') return getShadowStoneBoxSections(reward.boxType)
    if (reward.kind === 'mixed') {
      return reward.rewards.flatMap((child, index) => visit(child, `권 ${index + 1}`))
    }
    return [fixedSection(product)]
  }
  return visit(product.reward)
}
