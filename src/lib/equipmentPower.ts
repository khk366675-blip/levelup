import type { EquipmentSlot, Item, ItemRarity, SkillDefinition, StatKey } from './types'
import {
  getEnhancedItemEffects,
  getEnhancementLevel,
  getEquipmentStarMultiplier,
  getEquipmentStars,
  calculateSkillCombatValue,
} from './game'
import { SKILL_DEFINITIONS } from './seed'

export type EquipmentComparisonVerdict = 'better' | 'sidegrade' | 'situational' | 'weaker'
export type EquipmentValueTag =
  | 'OFFENSE'
  | 'DEFENSE'
  | 'SURVIVAL'
  | 'UTILITY'
  | 'SKILL'
  | 'SHADOW SYNERGY'
  | 'HIGH STAR'
  | 'RELIC'
  | 'LEGENDARY'

export interface EquipmentPowerBreakdown {
  totalEquipmentValue: number
  offenseValue: number
  defenseValue: number
  utilityValue: number
  survivalValue: number
  shadowSynergyValue: number
  skillValue: number
  slotRole: string
  slotRoleLabel: string
  starTierLabel: string
  rarityPotentialLabel: string
  topTags: EquipmentValueTag[]
  actionCue: 'weapon_strike' | 'armor_barrier' | 'accessory_tempo' | 'relic_aura' | 'item'
}

export interface EquipmentComparison {
  verdict: EquipmentComparisonVerdict
  label: string
  totalDelta: number
  offenseDelta: number
  defenseDelta: number
  utilityDelta: number
  survivalDelta: number
  shadowSynergyDelta: number
  skillDelta: number
  keyReason: string
  recommendation: string
}

const RARITY_VALUE: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 8,
  rare: 18,
  epic: 34,
  legendary: 52,
}

const RARITY_POTENTIAL_LABEL: Record<ItemRarity, string> = {
  common: '기본 잠재력',
  uncommon: '안정 잠재력',
  rare: '희귀 잠재력',
  epic: '특수 잠재력',
  legendary: '전설 잠재력',
}

const SLOT_ROLE: Record<EquipmentSlot, { key: string; label: string; cue: EquipmentPowerBreakdown['actionCue'] }> = {
  weapon: { key: 'offense', label: '공격/스킬 피해', cue: 'weapon_strike' },
  armor: { key: 'survival', label: '방어/생존 안정', cue: 'armor_barrier' },
  accessory: { key: 'utility', label: '속도/유틸 보조', cue: 'accessory_tempo' },
  artifact: { key: 'relic', label: '특수/그림자 연계', cue: 'relic_aura' },
}

const STAT_VALUE_WEIGHTS: Record<StatKey, Partial<Record<keyof Pick<EquipmentPowerBreakdown, 'offenseValue' | 'defenseValue' | 'utilityValue' | 'survivalValue' | 'shadowSynergyValue' | 'skillValue'>, number>>> = {
  STR: { offenseValue: 5.4, skillValue: 1.4 },
  VIT: { survivalValue: 7.2 },
  AGI: { defenseValue: 2.0, utilityValue: 4.8 },
  INT: { skillValue: 5.1, utilityValue: 1.8 },
  PER: { defenseValue: 5.2, survivalValue: 2.4 },
  SEN: { offenseValue: 3.2, utilityValue: 1.8, shadowSynergyValue: 2.4 },
}

const clampNumber = (value: number): number =>
  Number.isFinite(value) ? value : 0

const round = (value: number): number =>
  Math.round(clampNumber(value))

const getStarTierLabel = (item: Pick<Item, 'equipmentStars'>): string => {
  const stars = getEquipmentStars(item)
  if (stars >= 5) return '핵심 장비 후보'
  if (stars >= 4) return '고가치 장비'
  if (stars >= 3) return '실사용 가능'
  return '기본 장비'
}

const pushValue = (
  breakdown: Pick<EquipmentPowerBreakdown, 'offenseValue' | 'defenseValue' | 'utilityValue' | 'survivalValue' | 'shadowSynergyValue' | 'skillValue'>,
  key: keyof typeof breakdown,
  value: number,
) => {
  breakdown[key] += clampNumber(value)
}

const getSkillValue = (item: Item): number => {
  const skills = (item.combatSkillIds ?? [])
    .map(id => SKILL_DEFINITIONS.find(skill => skill.id === id))
    .filter((skill): skill is SkillDefinition => Boolean(skill))
  return skills.reduce((sum, skill) => sum + calculateSkillCombatValue(skill) * 12, 0)
}

const getTopTags = (item: Item, values: Pick<EquipmentPowerBreakdown, 'offenseValue' | 'defenseValue' | 'utilityValue' | 'survivalValue' | 'shadowSynergyValue' | 'skillValue'>): EquipmentValueTag[] => {
  const tags = [
    ['OFFENSE', values.offenseValue],
    ['DEFENSE', values.defenseValue],
    ['SURVIVAL', values.survivalValue],
    ['UTILITY', values.utilityValue],
    ['SKILL', values.skillValue],
    ['SHADOW SYNERGY', values.shadowSynergyValue],
  ] as Array<[EquipmentValueTag, number]>

  const top = tags
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag)

  if (getEquipmentStars(item) >= 4) top.unshift('HIGH STAR')
  if (item.slot === 'artifact') top.unshift('RELIC')
  if (item.rarity === 'legendary') top.unshift('LEGENDARY')
  return Array.from(new Set(top)).slice(0, 4)
}

export const getEquipmentPowerBreakdown = (item: Item): EquipmentPowerBreakdown => {
  const stars = getEquipmentStars(item)
  const slotRole = item.slot ? SLOT_ROLE[item.slot] : undefined
  const starMultiplier = getEquipmentStarMultiplier(item)
  const enhancementLevel = getEnhancementLevel(item)
  const qualityValue = 12 * starMultiplier + RARITY_VALUE[item.rarity] + enhancementLevel * 5
  const values = {
    offenseValue: 0,
    defenseValue: 0,
    utilityValue: 0,
    survivalValue: 0,
    shadowSynergyValue: 0,
    skillValue: 0,
  }

  if (item.slot === 'weapon') {
    values.offenseValue += qualityValue * 0.66
    values.skillValue += qualityValue * 0.18
  } else if (item.slot === 'armor') {
    values.defenseValue += qualityValue * 0.42
    values.survivalValue += qualityValue * 0.48
  } else if (item.slot === 'accessory') {
    values.utilityValue += qualityValue * 0.58
    values.shadowSynergyValue += qualityValue * 0.18
  } else if (item.slot === 'artifact') {
    values.shadowSynergyValue += qualityValue * 0.44
    values.skillValue += qualityValue * 0.24
    values.utilityValue += qualityValue * 0.18
  } else {
    values.utilityValue += qualityValue * 0.35
  }

  for (const effect of getEnhancedItemEffects(item)) {
    if (effect.type === 'stat_bonus' && effect.stat) {
      const weights = STAT_VALUE_WEIGHTS[effect.stat]
      for (const [key, weight] of Object.entries(weights) as Array<[keyof typeof values, number]>) {
        pushValue(values, key, effect.value * weight)
      }
      continue
    }
    if (effect.type === 'drop_bonus') {
      values.utilityValue += effect.value * 130
      values.shadowSynergyValue += effect.value * 45
    }
    if (effect.type === 'rarity_bonus') {
      values.utilityValue += effect.value * 115
      values.shadowSynergyValue += effect.value * 80
    }
    if (effect.type === 'xp_bonus') {
      values.utilityValue += effect.value * 80
    }
    if (effect.type === 'crit_bonus') {
      values.offenseValue += effect.value * 800
    }
    if (effect.type === 'evasion_bonus') {
      values.utilityValue += effect.value * 800
    }
    if (effect.type === 'accuracy_bonus') {
      values.utilityValue += effect.value * 800
    }
  }

  const skillValue = getSkillValue(item)
  values.skillValue += skillValue
  if (item.slot === 'weapon') values.offenseValue += skillValue * 0.22
  if (item.slot === 'artifact') values.shadowSynergyValue += skillValue * 0.18

  const totalEquipmentValue = round(
    values.offenseValue +
    values.defenseValue +
    values.utilityValue +
    values.survivalValue +
    values.shadowSynergyValue +
    values.skillValue,
  )

  return {
    totalEquipmentValue,
    offenseValue: round(values.offenseValue),
    defenseValue: round(values.defenseValue),
    utilityValue: round(values.utilityValue),
    survivalValue: round(values.survivalValue),
    shadowSynergyValue: round(values.shadowSynergyValue),
    skillValue: round(values.skillValue),
    slotRole: slotRole?.key ?? 'item',
    slotRoleLabel: slotRole?.label ?? '인벤토리 아이템',
    starTierLabel: getStarTierLabel(item),
    rarityPotentialLabel: RARITY_POTENTIAL_LABEL[item.rarity],
    topTags: getTopTags(item, values),
    actionCue: slotRole?.cue ?? 'item',
  }
}

const getLargestDeltaReason = (comparison: Omit<EquipmentComparison, 'verdict' | 'label' | 'keyReason' | 'recommendation'>): string => {
  const entries = [
    ['공격 가치', comparison.offenseDelta],
    ['방어 가치', comparison.defenseDelta],
    ['유틸 가치', comparison.utilityDelta],
    ['생존 가치', comparison.survivalDelta],
    ['그림자 연계', comparison.shadowSynergyDelta],
    ['스킬 가치', comparison.skillDelta],
  ] as Array<[string, number]>
  const best = [...entries].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]
  if (!best || Math.abs(best[1]) < 4) return '현재 장비와 가치가 비슷합니다.'
  return best[1] > 0
    ? `${best[0]}가 현재 장비보다 높습니다.`
    : `${best[0]}는 현재 장비가 더 높습니다.`
}

const getRecommendation = (
  item: Item,
  next: EquipmentPowerBreakdown,
  previous: EquipmentPowerBreakdown | undefined,
  comparison: Omit<EquipmentComparison, 'verdict' | 'label' | 'keyReason' | 'recommendation'>,
): string => {
  if (!previous) return `${next.slotRoleLabel} 슬롯에 바로 시험할 만한 장비입니다.`
  if (comparison.offenseDelta >= 10) return '현재 장비보다 공격 가치가 높습니다.'
  if (comparison.survivalDelta + comparison.defenseDelta >= 12) return '생존력은 더 안정적입니다.'
  if (comparison.skillDelta >= 10) return '전투 스킬 운용 가치가 더 높습니다.'
  if (comparison.shadowSynergyDelta >= 10 || item.slot === 'artifact') return '조건부 전투와 그림자 연계에서 더 좋을 수 있습니다.'
  if (comparison.totalDelta >= 8) return '전체 장비 가치가 현재 장비보다 높습니다.'
  if (comparison.totalDelta <= -8) return '현재 장비가 대체로 더 강합니다.'
  return '별/희귀도보다 역할 차이가 큰 장비입니다.'
}

export const compareEquipmentForSlot = (item: Item, previous?: Item): EquipmentComparison => {
  const next = getEquipmentPowerBreakdown(item)
  const prev = previous ? getEquipmentPowerBreakdown(previous) : undefined
  const comparison = {
    totalDelta: next.totalEquipmentValue - (prev?.totalEquipmentValue ?? 0),
    offenseDelta: next.offenseValue - (prev?.offenseValue ?? 0),
    defenseDelta: next.defenseValue - (prev?.defenseValue ?? 0),
    utilityDelta: next.utilityValue - (prev?.utilityValue ?? 0),
    survivalDelta: next.survivalValue - (prev?.survivalValue ?? 0),
    shadowSynergyDelta: next.shadowSynergyValue - (prev?.shadowSynergyValue ?? 0),
    skillDelta: next.skillValue - (prev?.skillValue ?? 0),
  }
  const hasTradeoff = [
    comparison.offenseDelta,
    comparison.defenseDelta,
    comparison.utilityDelta,
    comparison.survivalDelta,
    comparison.shadowSynergyDelta,
    comparison.skillDelta,
  ].some(delta => delta >= 10) && comparison.totalDelta < 8

  const verdict: EquipmentComparisonVerdict = !previous
    ? 'better'
    : comparison.totalDelta >= 10
      ? 'better'
      : comparison.totalDelta <= -10 && !hasTradeoff
        ? 'weaker'
        : hasTradeoff || item.slot === 'artifact'
          ? 'situational'
          : 'sidegrade'

  const label: Record<EquipmentComparisonVerdict, string> = {
    better: previous ? 'UPGRADE' : 'EMPTY SLOT',
    sidegrade: 'SIDEGRADE',
    situational: 'SITUATIONAL',
    weaker: 'WEAKER',
  }

  return {
    verdict,
    label: label[verdict],
    ...comparison,
    keyReason: previous ? getLargestDeltaReason(comparison) : '해당 슬롯이 비어 있습니다.',
    recommendation: getRecommendation(item, next, prev, comparison),
  }
}
