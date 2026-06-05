import type { OwnedShadow, Item, RuneItem } from './types'

export interface RuneTemplate {
  name: string
  icon: string
  type: 'shadow' | 'equipment'
  statKey?: string
  effectType?: string
  value: number // base value at common grade
  description: string
}

export const RUNE_TEMPLATES: RuneTemplate[] = [
  // Shadow Runes (그림자 전용 - 전투 정체성 강화)
  {
    name: '공격의 룬',
    icon: '⚔️',
    type: 'shadow',
    statKey: 'shadowAttack',
    value: 5,
    description: '그림자 공격력 +{val}'
  },
  {
    name: '수호의 룬',
    icon: '🛡️',
    type: 'shadow',
    statKey: 'shadowDefense',
    value: 5,
    description: '그림자 방어력 +{val}'
  },
  {
    name: '생명의 룬',
    icon: '❤️',
    type: 'shadow',
    statKey: 'shadowDurability',
    value: 5,
    description: '그림자 생명력 +{val}'
  },
  {
    name: '신속의 룬',
    icon: '⚡',
    type: 'shadow',
    statKey: 'shadowSpeed',
    value: 5,
    description: '그림자 속도 +{val}'
  },
  {
    name: '증폭의 룬',
    icon: '🔥',
    type: 'shadow',
    effectType: 'bonus_damage',
    value: 0.02,
    description: '그림자 피해량 +{val}%'
  },
  {
    name: '철벽의 룬',
    icon: '🧱',
    type: 'shadow',
    effectType: 'damage_reduction',
    value: 0.02,
    description: '그림자 받는 피해 감소 +{val}%'
  },
  {
    name: '광풍의 룬',
    icon: '🌀',
    type: 'shadow',
    effectType: 'extra_attack_chance',
    value: 0.015,
    description: '그림자 연속 공격 확률 +{val}%'
  },

  // Equipment Runes (장비 전용 - 헌터 효과 보강)
  {
    name: '근력의 룬',
    icon: '💪',
    type: 'equipment',
    statKey: 'STR',
    effectType: 'stat_bonus',
    value: 5,
    description: '헌터 근력 +{val}'
  },
  {
    name: '체력의 룬',
    icon: '🩹',
    type: 'equipment',
    statKey: 'VIT',
    effectType: 'stat_bonus',
    value: 5,
    description: '헌터 체력 +{val}'
  },
  {
    name: '지능의 룬',
    icon: '🧠',
    type: 'equipment',
    statKey: 'INT',
    effectType: 'stat_bonus',
    value: 5,
    description: '헌터 지능 +{val}'
  },
  {
    name: '정신의 룬',
    icon: '🔮',
    type: 'equipment',
    statKey: 'SEN',
    effectType: 'stat_bonus',
    value: 5,
    description: '헌터 감각 +{val}'
  },
  {
    name: '예리함의 룬',
    icon: '🎯',
    type: 'equipment',
    effectType: 'crit_bonus',
    value: 0.015,
    description: '헌터 치명타 확률 +{val}%'
  },
  {
    name: '바람의 룬',
    icon: '🍃',
    type: 'equipment',
    effectType: 'evasion_bonus',
    value: 0.012,
    description: '헌터 회피율 +{val}%'
  }
]

export const getShadowRuneSlotsCount = (shadow: OwnedShadow): number => {
  const rarity = shadow.rarity
  if (rarity === 'legendary') return 3
  if (rarity === 'epic' || rarity === 'rare') return 2
  return 1
}

export const getItemRuneSlotsCount = (item: Item): number => {
  const rarity = item.rarity
  if (rarity === 'legendary') return 3
  if (rarity === 'epic' || rarity === 'rare') return 2
  return 1
}

export const getRuneValueMultiplier = (grade: RuneItem['grade']): number => {
  const multipliers: Record<RuneItem['grade'], number> = {
    common: 1.0,
    uncommon: 2.2,
    rare: 4.8,
    epic: 10.0,
    legendary: 22.0
  }
  return multipliers[grade] ?? 1.0
}

export const getRuneValue = (rune: RuneItem): number => {
  const gradeMul = getRuneValueMultiplier(rune.grade)
  const baseValue = rune.value * gradeMul
  const enhancedValue = baseValue * (1 + rune.enhancementLevel * 0.20)
  
  const isPercent = rune.effectType && rune.effectType !== 'stat_bonus'
  if (isPercent) {
    return parseFloat(enhancedValue.toFixed(4))
  } else {
    return Math.round(enhancedValue)
  }
}

export const getRuneDescription = (rune: RuneItem): string => {
  const val = getRuneValue(rune)
  const isPercent = rune.effectType && rune.effectType !== 'stat_bonus'
  const valStr = isPercent ? (val * 100).toFixed(1) : val.toString()
  return rune.description.replace('{val}', valStr)
}

export const getRuneGoldEnhancementCost = (rune: RuneItem): number => {
  const baseCosts: Record<RuneItem['grade'], number> = {
    common: 100,
    uncommon: 250,
    rare: 500,
    epic: 1000,
    legendary: 2500
  }
  const base = baseCosts[rune.grade] ?? 100
  return Math.round(base * (1.0 + rune.enhancementLevel * 0.50))
}

export const getRuneGoldEnhancementSuccessRate = (rune: RuneItem): number => {
  const rates = [0.90, 0.70, 0.55, 0.40, 0.25, 0.15]
  return rates[rune.enhancementLevel] ?? 0.10
}

const uid = () => Math.random().toString(36).slice(2, 10)

export const generateRandomRune = (boxGrade: 'normal' | 'advanced' | 'supreme'): RuneItem => {
  const template = RUNE_TEMPLATES[Math.floor(Math.random() * RUNE_TEMPLATES.length)]
  
  // Roll grade
  const r = Math.random()
  let grade: RuneItem['grade'] = 'common'
  if (boxGrade === 'supreme') {
    if (r < 0.10) grade = 'legendary'
    else if (r < 0.50) grade = 'epic'
    else grade = 'rare'
  } else if (boxGrade === 'advanced') {
    if (r < 0.10) grade = 'epic'
    else if (r < 0.45) grade = 'rare'
    else grade = 'uncommon'
  } else {
    if (r < 0.10) grade = 'rare'
    else if (r < 0.40) grade = 'uncommon'
    else grade = 'common'
  }

  const gradeLabels: Record<RuneItem['grade'], string> = {
    common: '일반',
    uncommon: '고급',
    rare: '희귀',
    epic: '영웅',
    legendary: '전설'
  }

  return {
    id: `rune-${uid()}`,
    name: `${gradeLabels[grade]} ${template.name}`,
    icon: template.icon,
    type: template.type,
    grade,
    statKey: template.statKey,
    effectType: template.effectType,
    value: template.value,
    enhancementLevel: 0,
    description: template.description,
    acquiredAt: new Date().toISOString()
  }
}
