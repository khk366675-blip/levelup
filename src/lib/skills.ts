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
import { JOB_DEFINITIONS_V2 } from './jobs'

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

import { getSkillCapstoneUpgrade, getAvailableUpgradesForSkill } from './skillUpgrades'

export const SKILL_MASTERY_THRESHOLDS = [
  0,    // Lv 1
  15,   // Lv 2
  40,   // Lv 3
  75,   // Lv 4
  120,  // Lv 5
  180,  // Lv 6
  260,  // Lv 7
  360,  // Lv 8
  480,  // Lv 9
  650,  // Lv 10
] as const
export const MAX_SKILL_MASTERY_LEVEL = 10

type LegacySkillRuntimeState = Partial<SkillRuntimeState> & {
  uses?: number
  xp?: number
  level?: number
  lastUsedAt?: string
}

const toSafeInt = (value: unknown, fallback = 0): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : fallback
}

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
  jobLevel = 1,
  equippedItems = [],
  allSkills,
  includeBasicKit = false,
}: {
  jobId?: JobId
  jobLevel?: number
  equippedItems?: Item[]
  allSkills: SkillDefinition[]
  includeBasicKit?: boolean
}): SkillDefinition[] => {
  const skillIds = new Set<string>([BASIC_COMBAT_SKILL_IDS[0]])
  if (includeBasicKit) {
    for (const id of BASIC_COMBAT_SKILL_IDS) skillIds.add(id)
  }
  
  if (jobId) {
    const v2Job = JOB_DEFINITIONS_V2.find(j => j.id === jobId)
    if (v2Job) {
      const unlockedV2Skills = v2Job.skills
        ?.filter(s => s.unlockLevel <= jobLevel)
        .map(s => s.skillId) || []
      for (const id of unlockedV2Skills) skillIds.add(id)
    } else {
      for (const id of JOB_COMBAT_SKILL_IDS[jobId] ?? []) skillIds.add(id)
    }
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
  const activeJobId = hunter.activeJobId || hunter.jobId
  const jobLevel = hunter.jobs?.[activeJobId]?.level ?? 1
  return getAvailableCombatSkillsForLoadout({
    jobId: activeJobId,
    jobLevel,
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

export const getSkillMasteryLevelFromXp = (xp = 0): number => {
  const safeXp = Math.max(0, Math.floor(xp))
  for (let level = MAX_SKILL_MASTERY_LEVEL; level >= 1; level -= 1) {
    if (safeXp >= SKILL_MASTERY_THRESHOLDS[level - 1]) return level
  }
  return 1
}

export const normalizeSkillRuntimeState = (
  skillId: string,
  state?: LegacySkillRuntimeState
): SkillRuntimeState => {
  const timesUsed = toSafeInt(state?.timesUsed ?? state?.uses)
  // 하위 호환: 기존 세이브에 masteryXp가 없으면 timesUsed를 사용
  const masteryXp = toSafeInt(state?.masteryXp ?? state?.xp, timesUsed)
  const derivedLevel = getSkillMasteryLevelFromXp(masteryXp)
  const storedLevel = state?.masteryLevel ?? state?.level
  const masteryLevel = Math.min(
    MAX_SKILL_MASTERY_LEVEL,
    Math.max(derivedLevel, toSafeInt(storedLevel, derivedLevel))
  )

  return {
    skillId,
    timesUsed,
    masteryXp,
    masteryLevel,
    selectedUpgradeId: state?.selectedUpgradeId,
    isCapstoneUnlocked: state?.isCapstoneUnlocked ?? (masteryLevel >= 10),
    ...(state?.lastUsedAt ? { lastUsedAt: state.lastUsedAt } : {}),
  }
}

export const normalizeSkillStates = (
  skillStates: Record<string, LegacySkillRuntimeState> | undefined
): Record<string, SkillRuntimeState> => {
  if (!skillStates) return {}
  return Object.fromEntries(
    Object.entries(skillStates)
      .filter(([skillId]) => Boolean(skillId))
      .map(([skillId, state]) => [skillId, normalizeSkillRuntimeState(skillId, state)])
  )
}

export const getSkillMastery = (
  skillStates: Record<string, SkillRuntimeState> | undefined,
  skillId: string
): SkillRuntimeState => {
  return normalizeSkillRuntimeState(skillId, skillStates?.[skillId])
}

export const recordSkillRuntimeUse = (
  skillStates: Record<string, SkillRuntimeState> | undefined,
  skillId: string,
  masteryXpGain = 1
): Record<string, SkillRuntimeState> => {
  const current = getSkillMastery(skillStates, skillId)
  const timesUsed = (current.timesUsed ?? 0) + 1
  const masteryXp = (current.masteryXp ?? 0) + Math.max(1, masteryXpGain)
  const nextLevel = getSkillMasteryLevelFromXp(masteryXp)
  return {
    ...(skillStates ?? {}),
    [skillId]: {
      ...current,
      skillId,
      timesUsed,
      masteryXp,
      masteryLevel: nextLevel,
      isCapstoneUnlocked: current.isCapstoneUnlocked || (nextLevel >= 10),
      lastUsedAt: new Date().toISOString(),
    },
  }
}

export const getSkillMasteryProgress = (runtime?: SkillRuntimeState) => {
  const normalized = normalizeSkillRuntimeState(runtime?.skillId ?? 'unknown', runtime)
  const level = normalized.masteryLevel ?? 1
  const currentXp = normalized.masteryXp ?? 0
  const levelStartXp = SKILL_MASTERY_THRESHOLDS[level - 1] ?? 0
  
  const hasNextLevel = level < MAX_SKILL_MASTERY_LEVEL
  const nextLevelXp = hasNextLevel ? SKILL_MASTERY_THRESHOLDS[level] : undefined
  
  const isMaxLevel = !hasNextLevel
  const xpNeededForNext = nextLevelXp ? Math.max(1, nextLevelXp - levelStartXp) : 1
  const xpIntoLevel = isMaxLevel ? xpNeededForNext : Math.max(0, currentXp - levelStartXp)
  const percent = isMaxLevel ? 100 : Math.round(Math.min(1, xpIntoLevel / xpNeededForNext) * 100)

  return {
    level,
    maxLevel: MAX_SKILL_MASTERY_LEVEL,
    currentUses: normalized.timesUsed ?? 0,
    currentXp,
    levelStartXp,
    nextLevelXp,
    nextLevelUses: nextLevelXp, // 하위 호환 필드 추가
    xpIntoLevel,
    xpNeededForNext,
    percent,
    isMaxLevel,
  }
}

export const getSkillMasteryEffectBonus = (skill: SkillDefinition, masteryLevel = 0): number => {
  const safeLevel = Math.max(0, Math.min(MAX_SKILL_MASTERY_LEVEL, masteryLevel))
  if (safeLevel <= 0) return 0
  if (isDamageSkill(skill) || skill.type === 'defense') return safeLevel * 0.015
  if (skill.type === 'buff' || skill.type === 'debuff' || skill.type === 'heal') return safeLevel * 0.01
  return safeLevel * 0.008
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
  const normalized = normalizeSkillRuntimeState(skill.id, runtime)
  const masteryLevel = normalized.masteryLevel ?? 1
  const bonus = getSkillMasteryEffectBonus(skill, masteryLevel)
  const base = skill.effectSummary ?? skill.description

  let upgradeText = ''
  if (normalized.selectedUpgradeId) {
    const upgrades = getAvailableUpgradesForSkill(skill)
    const selected = upgrades.find(u => u.id === normalized.selectedUpgradeId)
    if (selected) {
      upgradeText = ` [강화: ${selected.name}]`
    }
  }

  let capstoneText = ''
  if (normalized.isCapstoneUnlocked) {
    capstoneText = ' [시그니처 각성]'
  }

  const bonusText = masteryLevel > 1 ? ` (숙련 Lv.${masteryLevel}: 효과 +${Math.round(bonus * 1000) / 10}%)` : ''
  return `${base}${bonusText}${upgradeText}${capstoneText}`
}
