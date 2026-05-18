import type {
  EquipmentState,
  HunterState,
  Item,
  JobId,
  ManualBattleSession,
  SkillDefinition,
  SkillRuntimeState,
  SkillSource,
  SkillType,
  Title,
} from './types'

export const BASIC_COMBAT_SKILL_IDS = ['basic-attack', 'basic-focus-slash', 'basic-guard-stance']

export const JOB_COMBAT_SKILL_IDS: Partial<Record<JobId, string[]>> = {
  'golden-eye-diviner': ['skill-golden-eye-insight'],
  'golden-oracle': ['skill-golden-eye-insight'],
  'grimoire-decoder': ['skill-archive-analysis'],
  'abyss-archivist': ['skill-archive-analysis'],
  'iron-squire': ['skill-iron-charge'],
  'steelheart-fighter': ['skill-iron-charge'],
  'silent-monk': ['skill-silent-guard'],
  'chrono-judge': ['skill-silent-guard'],
  'nameless-awakened': ['skill-fate-alignment'],
  'fate-harmonizer': ['skill-fate-alignment'],
}

export const SKILL_MASTERY_THRESHOLDS = [0, 5, 15, 35] as const

export const getSkillCooldownTurns = (skill: SkillDefinition): number =>
  Math.max(0, skill.cooldown ?? skill.cooldownTurns ?? 0)

export const getSkillDefinitionSource = (skill: SkillDefinition): SkillSource => {
  if (skill.source) return skill.source
  if (skill.ownerType === 'common') return 'basic'
  if (skill.ownerType === 'monster') return 'monster'
  return skill.ownerType
}

export const getSkillSourceLabel = (skill: SkillDefinition): string => {
  const labels: Record<SkillSource, string> = {
    basic: '기본',
    job: '직업',
    equipment: '장비',
    title: '칭호',
    special: '특수',
    monster: '몬스터',
  }
  return labels[getSkillDefinitionSource(skill)]
}

export const getSkillTypeLabel = (skill: SkillDefinition): string => {
  const labels: Record<SkillType, string> = {
    attack: '피해',
    damage: '피해',
    defense: '방어',
    buff: '강화',
    debuff: '약화',
    heal: '회복',
    utility: '유틸',
  }
  return labels[skill.type]
}

export const isDamageSkill = (skill: SkillDefinition): boolean =>
  skill.type === 'attack' || skill.type === 'damage'

export const isHunterCombatSkill = (skill: SkillDefinition): boolean => {
  const source = getSkillDefinitionSource(skill)
  return source === 'basic' || source === 'job' || source === 'equipment' || source === 'title' || source === 'special'
}

export const getEquippedSkillItems = (items: Item[], equipment: EquipmentState): Item[] => {
  const equippedIds = new Set(Object.values(equipment).filter(Boolean))
  return items.filter(item => equippedIds.has(item.id))
}

export const getAvailableCombatSkillsForLoadout = ({
  jobId,
  equippedItems = [],
  allSkills,
  includeBasicKit = false,
}: {
  jobId?: JobId
  equippedItems?: Item[]
  allSkills: SkillDefinition[]
  includeBasicKit?: boolean
}): SkillDefinition[] => {
  const skillIds = new Set<string>([BASIC_COMBAT_SKILL_IDS[0]])
  if (includeBasicKit) {
    for (const id of BASIC_COMBAT_SKILL_IDS) skillIds.add(id)
  }
  if (jobId) {
    for (const id of JOB_COMBAT_SKILL_IDS[jobId] ?? []) skillIds.add(id)
  }

  for (const item of equippedItems) {
    for (const skillId of item.combatSkillIds ?? []) skillIds.add(skillId)
  }

  return allSkills.filter(skill => skillIds.has(skill.id) && isHunterCombatSkill(skill))
}

export const getAvailableSkills = ({
  hunter,
  items,
  equipment,
  allSkills,
  titles: _titles = [],
}: {
  hunter: HunterState
  items: Item[]
  equipment: EquipmentState
  allSkills: SkillDefinition[]
  titles?: Title[]
}): SkillDefinition[] => {
  return getAvailableCombatSkillsForLoadout({
    jobId: hunter.jobId,
    equippedItems: getEquippedSkillItems(items, equipment),
    allSkills,
    includeBasicKit: true,
  })
}

export const getSkillProviderItem = (skill: SkillDefinition, equippedItems: Item[]): Item | undefined => {
  if (getSkillDefinitionSource(skill) !== 'equipment') return undefined
  return equippedItems.find(item =>
    item.id === skill.providedByItemId ||
    item.combatSkillIds?.includes(skill.id)
  )
}

export const getSkillMasteryLevelFromUses = (timesUsed = 0): number => {
  if (timesUsed >= SKILL_MASTERY_THRESHOLDS[3]) return 3
  if (timesUsed >= SKILL_MASTERY_THRESHOLDS[2]) return 2
  if (timesUsed >= SKILL_MASTERY_THRESHOLDS[1]) return 1
  return 0
}

export const getSkillMastery = (
  skillStates: Record<string, SkillRuntimeState> | undefined,
  skillId: string
): SkillRuntimeState => {
  const state = skillStates?.[skillId]
  const timesUsed = state?.timesUsed ?? 0
  const masteryXp = state?.masteryXp ?? timesUsed
  return {
    skillId,
    timesUsed,
    masteryXp,
    masteryLevel: state?.masteryLevel ?? getSkillMasteryLevelFromUses(timesUsed),
  }
}

export const recordSkillRuntimeUse = (
  skillStates: Record<string, SkillRuntimeState> | undefined,
  skillId: string,
  masteryXpGain = 1
): Record<string, SkillRuntimeState> => {
  const current = getSkillMastery(skillStates, skillId)
  const timesUsed = (current.timesUsed ?? 0) + 1
  const masteryXp = (current.masteryXp ?? 0) + Math.max(1, masteryXpGain)
  return {
    ...(skillStates ?? {}),
    [skillId]: {
      skillId,
      timesUsed,
      masteryXp,
      masteryLevel: getSkillMasteryLevelFromUses(timesUsed),
    },
  }
}

export const getNextMasteryUseTarget = (timesUsed = 0): number | undefined =>
  SKILL_MASTERY_THRESHOLDS.find(threshold => threshold > timesUsed)

export const getSkillMasteryEffectBonus = (skill: SkillDefinition, masteryLevel = 0): number => {
  const safeLevel = Math.max(0, Math.min(3, masteryLevel))
  if (safeLevel <= 0) return 0
  if (isDamageSkill(skill) || skill.type === 'defense') return safeLevel * 0.025
  if (skill.type === 'buff' || skill.type === 'debuff' || skill.type === 'heal') return safeLevel * 0.015
  return safeLevel * 0.01
}

export const canUseSkill = (
  skill: SkillDefinition,
  session?: Pick<ManualBattleSession, 'cooldowns'>
): { canUse: boolean; reason?: string; cooldownRemaining: number } => {
  const cooldownRemaining = session?.cooldowns?.[skill.id] ?? 0
  if (cooldownRemaining > 0) {
    return { canUse: false, reason: `쿨타임 ${cooldownRemaining}턴`, cooldownRemaining }
  }
  return { canUse: true, reason: '사용 가능', cooldownRemaining: 0 }
}

export const getSkillEffectiveDescription = (
  skill: SkillDefinition,
  runtime?: SkillRuntimeState
): string => {
  const masteryLevel = runtime?.masteryLevel ?? 0
  const bonus = getSkillMasteryEffectBonus(skill, masteryLevel)
  const base = skill.effectSummary ?? skill.description
  if (masteryLevel <= 0 || bonus <= 0) return base
  return `${base} 숙련 Lv.${masteryLevel}: 효과 +${Math.round(bonus * 100)}%`
}
