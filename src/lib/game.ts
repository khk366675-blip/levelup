import type {
  ActiveConsumableEffect,
  ActiveCombatEffect,
  BattleTurn,
  Category,
  CombatLog,
  Difficulty,
  EquipmentState,
  HunterState,
  Item,
  JobId,
  MonsterDefinition,
  PlayerCombatStats,
  Quest,
  Rank,
  SkillEffect,
  SkillDefinition,
  StatKey,
  TitleDefinition,
  TitleEffects,
} from './types'
import { CATEGORY_META, STAT_META, TITLE_DEFINITIONS } from './types'

export const xpToNextLevel = (level: number): number => {
  // Adjusted growth curve: slower mid-late game, early discount for Lv 1-10
  const l = Math.max(1, level)
  const base = 100 + (l - 1) * 105 + Math.pow(l - 1, 1.58) * 18
  const earlyDiscount = l <= 5 ? 0.85 : l <= 10 ? 0.95 : 1
  return Math.round(base * earlyDiscount)
}

export const rankFromLevel = (level: number): Rank => {
  if (level >= 80) return 'National'
  if (level >= 60) return 'S'
  if (level >= 45) return 'A'
  if (level >= 30) return 'B'
  if (level >= 18) return 'C'
  if (level >= 8)  return 'D'
  return 'E'
}

export const RANK_COLOR: Record<Rank, string> = {
  E: 'text-zinc-300 border-zinc-500/50',
  D: 'text-emerald-300 border-emerald-400/60',
  C: 'text-cyan-300 border-cyan-400/70',
  B: 'text-purple-300 border-purple-400/70',
  A: 'text-pink-300 border-pink-400/70',
  S: 'text-amber-300 border-amber-400/80',
  National: 'text-red-300 border-red-400/90',
}

export const RANK_LABEL: Record<Rank, string> = {
  E: 'E-Rank',
  D: 'D-Rank',
  C: 'C-Rank',
  B: 'B-Rank',
  A: 'A-Rank',
  S: 'S-Rank',
  National: '국가 권력급',
}

export const isSameDay = (a?: string, b?: string): boolean => {
  if (!a || !b) return false
  return a.slice(0, 10) === b.slice(0, 10)
}

export const todayISO = () => new Date().toISOString()

/** Get local date key in YYYY-MM-DD format (browser local time, not UTC). */
export const getDateKey = (date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Alias for getDateKey() for backward compatibility. */
export const todayKey = () => getDateKey()

/** Add days to a date (handles DST and local date correctly). */
export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const calendarDayKey = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Calendar-day delta (local time). 0 if same day, 1 if next day, etc. */
export const calendarDaysSince = (iso: string, now: Date = new Date()): number => {
  return Math.floor((calendarDayKey(now) - calendarDayKey(new Date(iso))) / 86_400_000)
}

/** Days remaining before a daily quest can be done again.
 *  cycleLength = (cooldownDays ?? 0) + 1.
 *  cooldownDays=0 → 1-day cycle (every day). cooldownDays=4 → 5-day cycle.
 *  Returns 0 if available now (or never completed). */
export const getCooldownRemaining = (q: Quest, now: Date = new Date()): number => {
  if (q.type !== 'daily' || !q.lastCompletedAt) return 0
  const cycleLength = (q.cooldownDays ?? 0) + 1
  const elapsed = calendarDaysSince(q.lastCompletedAt, now)
  return Math.max(0, cycleLength - elapsed)
}

export const isDailyAvailable = (q: Quest, now: Date = new Date()): boolean => {
  return getCooldownRemaining(q, now) === 0
}

export const roundStatValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export const formatStat = (value: number): string => {
  return roundStatValue(value).toFixed(2)
}

export const formatStatReward = (value: number): string => {
  // Integers (main/dungeon clean rewards) → '+5'; fractions (daily/elite) → '+0.08' / '+5.20'.
  const rounded = roundStatValue(value)
  if (Number.isInteger(rounded)) return `+${rounded}`
  return `+${rounded.toFixed(2)}`
}

type QuestRewardType = Quest['type']

// 12-3: keep the reward hierarchy daily < dungeon < main, but raise the whole reward feel.
export const BALANCED_XP_BY_TYPE: Record<QuestRewardType, Record<Difficulty, number>> = {
  daily: {
    easy: 32,
    normal: 48,
    hard: 80,
    elite: 160,
    apex: 225,
    boss: 320,
  },
  main: {
    easy: 1800,
    normal: 3400,
    hard: 6800,
    elite: 11800,
    apex: 20500,
    boss: 35000,
  },
  dungeon: {
    easy: 650,
    normal: 1100,
    hard: 2000,
    elite: 3200,
    apex: 5100,
    boss: 8000,
  },
}

// 12-3: stats rise with the same hierarchy. Gate remains item-first, so gate stat rewards stay absent.
export const STAT_REWARD_MULTIPLIER_BY_TYPE: Record<QuestRewardType, Record<Difficulty, number>> = {
  daily: {
    easy: 0.14,
    normal: 0.22,
    hard: 0.20,
    elite: 0.20,
    apex: 0.20,
    boss: 0.20,
  },
  main: {
    easy: 3.2,
    normal: 4.5,
    hard: 6.0,
    elite: 8.0,
    apex: 11.0,
    boss: 15.0,
  },
  dungeon: {
    easy: 0.95,
    normal: 1.25,
    hard: 1.6,
    elite: 2.0,
    apex: 2.8,
    boss: 3.6,
  },
}

// 12-3: a small drop bump across quest tiers. Daily stays modest; dungeon/main remain the loot-heavy milestones.
export const DROP_CHANCE_BY_TYPE: Record<QuestRewardType, Record<Difficulty, number>> = {
  daily: {
    easy: 0.02,
    normal: 0.04,
    hard: 0.07,
    elite: 0.1,
    apex: 0.12,
    boss: 0.15,
  },
  main: {
    easy: 0.3,
    normal: 0.48,
    hard: 0.65,
    elite: 0.8,
    apex: 0.9,
    boss: 1.0,
  },
  dungeon: {
    easy: 0.6,
    normal: 0.8,
    hard: 0.95,
    elite: 0.95,
    apex: 1.0,
    boss: 1.0,
  },
}

export const getBalancedQuestXp = (type: QuestRewardType, difficulty: Difficulty): number => {
  return BALANCED_XP_BY_TYPE[type][difficulty]
}

/** Dungeon clear XP for a given rank (rank-standard; same rank = same clear XP regardless of step count). */
export const getBalancedDungeonClearXp = (difficulty: Difficulty): number => {
  return getBalancedQuestXp('dungeon', difficulty)
}

export const DUNGEON_PARTIAL_XP_BUDGET_RATIO = 0.4

/** Per-step partial XP. Total partial budget = clear × DUNGEON_PARTIAL_XP_BUDGET_RATIO, divided by totalSteps.
 *  Final clear award is granted separately as `getBalancedDungeonClearXp`. */
export const getBalancedDungeonStepXp = (difficulty: Difficulty, totalSteps = 1): number => {
  const safeTotal = Math.max(1, totalSteps)
  return Math.max(5, Math.round(getBalancedDungeonClearXp(difficulty) * DUNGEON_PARTIAL_XP_BUDGET_RATIO / safeTotal))
}

export const getBalancedQuestDropChance = (type: QuestRewardType, difficulty: Difficulty): number => {
  return DROP_CHANCE_BY_TYPE[type][difficulty]
}

export const getBalancedQuestStatRewards = (q: Pick<Quest, 'type' | 'difficulty' | 'category' | 'statRewards' | 'rewardStatWeights'>): Partial<Record<StatKey, number>> => {
  const multiplier = STAT_REWARD_MULTIPLIER_BY_TYPE[q.type][q.difficulty]
  const rewards: Partial<Record<StatKey, number>> = {}
  const weights = Object.entries(q.rewardStatWeights ?? {}) as Array<[StatKey, number]>
  const validWeights = weights
    .map(([key, value]) => [key, Math.max(0, value ?? 0)] as [StatKey, number])
    .filter(([, value]) => value > 0)
  const totalWeight = validWeights.reduce((sum, [, value]) => sum + value, 0)

  if (totalWeight > 0) {
    const baseTotal = Object.values(q.statRewards).reduce((sum, value) => sum + Math.max(0, value ?? 0), 0)
    const totalGain = roundStatValue(baseTotal * multiplier)
    for (const [key, weight] of validWeights) {
      rewards[key] = roundStatValue(totalGain * (weight / totalWeight))
    }
    return rewards
  }

  for (const [key, value] of Object.entries(q.statRewards) as Array<[StatKey, number]>) {
    rewards[key] = roundStatValue((value ?? 0) * multiplier)
  }

  if (Object.keys(rewards).length === 0) {
    rewards[CATEGORY_TO_STAT[q.category]] = roundStatValue(multiplier)
  }

  return rewards
}

export const getBalancedRandomQuestXp = (baseXp: number): number => {
  return Math.max(5, Math.round(baseXp * 0.8))
}

export const getBalancedRandomQuestDropChance = (difficulty: Difficulty): number => {
  if (difficulty === 'hard') return 0.12
  if (difficulty === 'normal') return 0.07
  return 0.04
}

export const monthStart = (now: Date = new Date()): Date => {
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

/** True if the given ISO timestamp is in a calendar month strictly before `now`. */
export const isBeforeMonth = (iso: string | undefined, now: Date = new Date()): boolean => {
  if (!iso) return false
  const d = new Date(iso)
  if (d.getFullYear() < now.getFullYear()) return true
  return d.getFullYear() === now.getFullYear() && d.getMonth() < now.getMonth()
}

// ── Stat-driven gameplay bonuses ───────────────────────────────────────

/** Auto-distribute target stat per category (used on level-up). */
export const CATEGORY_TO_STAT: Record<Category, StatKey> = {
  workout:   'STR',
  health:    'STR',
  study:     'INT',
  career:    'INT',
  mind:      'SEN',
  finance:   'SEN',
  habit:     'PER',
  challenge: 'PER',
  social:    'AGI',
}

export const emptyCategoryProgress = (): Record<Category, number> => {
  const obj = {} as Record<Category, number>
  for (const c of Object.keys(CATEGORY_META) as Category[]) obj[c] = 0
  return obj
}

/** Pick the category with the most completions since last level-up.
 *  Ties broken by first-found in insertion order. Returns 'workout' if all zero. */
export const pickTopCategory = (progress: Record<Category, number>): Category => {
  let top: Category = 'workout'
  let max = -1
  for (const c of Object.keys(CATEGORY_META) as Category[]) {
    const n = progress[c] ?? 0
    if (n > max) { max = n; top = c }
  }
  return top
}

/** Generic stat-bonus helper. Returns percent points (e.g. 15 for +15%). */
export const getStatBonus = (statValue: number, perPoint: number, perBlock = 10): number => {
  return Math.floor(statValue / perBlock) * perPoint
}

/** Multiplier on quest base XP, category-aligned. 1.0 = no bonus. */
export const getXpMultiplier = (hunter: HunterState, category: Category): number => {
  if (category === 'study' || category === 'career') {
    return 1 + getStatBonus(hunter.stats.INT, 5) / 100
  }
  if (category === 'health' || category === 'workout') {
    return 1 + getStatBonus(hunter.stats.STR, 5) / 100
  }
  return 1.0
}

/** Additive bonus to item-drop probability (0.0–1.0 cap enforced by caller). */
export const getDropChanceBonus = (hunter: HunterState, category: Category): number => {
  if (category === 'health' || category === 'workout') {
    return getStatBonus(hunter.stats.VIT, 3) / 100
  }
  return 0
}

/** Multiplier on dungeon partial-step XP. 1.0 = no bonus. */
export const getPartialRewardMultiplier = (hunter: HunterState): number => {
  return 1 + getStatBonus(hunter.stats.AGI, 5) / 100
}

/** Decimal bonus added to epic+legendary weight when rolling rarity. */
export const getRarityWeightBonus = (hunter: HunterState): number => {
  return getStatBonus(hunter.stats.SEN, 1) / 100
}

/** PER-based streak shield. True if a charge is available right now. */
export const shouldProtectStreak = (hunter: HunterState, lastUsedAt: string | undefined, now: Date = new Date()): boolean => {
  if (hunter.stats.PER < 10) return false
  if (!lastUsedAt) return true
  // available again once the recorded use is in a previous month
  return isBeforeMonth(lastUsedAt, now)
}

// ── Equipment Effect Helpers ───────────────────────────────────────────

export const MAX_ITEM_ENHANCEMENT_LEVEL = 5
export const ITEM_ENHANCEMENT_EFFECT_STEP = 0.08

export const getEnhancementLevel = (item: Pick<Item, 'enhancementLevel'>): number => {
  const raw = Math.floor(item.enhancementLevel ?? 0)
  if (!Number.isFinite(raw)) return 0
  return Math.max(0, Math.min(MAX_ITEM_ENHANCEMENT_LEVEL, raw))
}

export const getEnhancementMultiplier = (item: Pick<Item, 'enhancementLevel'>): number => {
  return 1 + getEnhancementLevel(item) * ITEM_ENHANCEMENT_EFFECT_STEP
}

export const formatEnhancementLabel = (item: Pick<Item, 'enhancementLevel'>): string => {
  const level = getEnhancementLevel(item)
  return level > 0 ? `+${level}` : ''
}

export const isEnhanceableEquipment = (item: Pick<Item, 'equippable' | 'slot' | 'consumable'>): boolean => {
  return item.equippable === true && Boolean(item.slot) && item.consumable !== true
}

export const getItemEnhancementKey = (item: Pick<Item, 'name' | 'rarity' | 'slot' | 'equippable' | 'consumable'>): string => {
  if (!isEnhanceableEquipment(item)) return ''
  return `${item.name}::${item.rarity}::${item.slot}`
}

export const isSameEnhancementFamily = (
  target: Pick<Item, 'name' | 'rarity' | 'slot' | 'equippable' | 'consumable'>,
  candidate: Pick<Item, 'name' | 'rarity' | 'slot' | 'equippable' | 'consumable'>
): boolean => {
  const targetKey = getItemEnhancementKey(target)
  return targetKey.length > 0 && targetKey === getItemEnhancementKey(candidate)
}

export const getEnhancedItemEffects = (item: Item): NonNullable<Item['effects']> => {
  const multiplier = getEnhancementMultiplier(item)
  return item.effects?.map(effect => ({
    ...effect,
    value: effect.type === 'stat_bonus'
      ? roundStatValue(effect.value * multiplier)
      : effect.value * multiplier,
  })) ?? []
}

export const getEnhanceMaterialCandidates = (
  target: Item,
  inventory: Item[],
  equippedItemIds: string[] | Set<string> = []
): Item[] => {
  if (!isEnhanceableEquipment(target)) return []
  if (getEnhancementLevel(target) >= MAX_ITEM_ENHANCEMENT_LEVEL) return []

  const equippedIds = equippedItemIds instanceof Set ? equippedItemIds : new Set(equippedItemIds)
  return inventory
    .filter(item =>
      item.id !== target.id &&
      !equippedIds.has(item.id) &&
      isSameEnhancementFamily(target, item)
    )
    .sort((a, b) => getEnhancementLevel(a) - getEnhancementLevel(b))
}

export const canEnhanceItem = (
  target: Item,
  inventory: Item[],
  equippedItemIds: string[] | Set<string> = []
): boolean => {
  return getEnhanceMaterialCandidates(target, inventory, equippedItemIds).length > 0
}

/** Get all equipped items from equipment state. */
export const getEquippedItems = (items: Item[], equipment: EquipmentState): Item[] => {
  return Object.values(equipment)
    .map(id => items.find(item => item.id === id))
    .filter((item): item is Item => Boolean(item && item.equippable === true))
}

/** Get total XP bonus from equipped items for a specific category. Returns decimal (e.g. 0.05 for +5%). Capped at 0.2 (20%). */
export const getEquipmentXpBonus = (equippedItems: Item[], category: Category): number => {
  let total = 0
  for (const item of equippedItems) {
    for (const effect of getEnhancedItemEffects(item)) {
      if (effect.type === 'xp_bonus' && effect.category === category) {
        total += effect.value
      }
    }
  }
  return Math.min(total, 0.2) // Cap at 20%
}

/** Get total drop bonus from equipped items. Returns decimal (e.g. 0.02 for +2%). Capped at 0.1 (10%). */
export const getEquipmentDropBonus = (equippedItems: Item[]): number => {
  let total = 0
  for (const item of equippedItems) {
    for (const effect of getEnhancedItemEffects(item)) {
      if (effect.type === 'drop_bonus') {
        total += effect.value
      }
    }
  }
  return Math.min(total, 0.1) // Cap at 10%
}

/** Get total rarity bonus from equipped items. Returns decimal (e.g. 0.02 for +2%). Capped at 0.05. */
export const getEquipmentRarityBonus = (equippedItems: Item[]): number => {
  let total = 0
  for (const item of equippedItems) {
    for (const effect of getEnhancedItemEffects(item)) {
      if (effect.type === 'rarity_bonus') {
        total += effect.value
      }
    }
  }
  return Math.min(0.05, total)
}

/** Get stat bonuses from equipped items. */
export const getEquipmentStatBonuses = (equippedItems: Item[]): Partial<Record<StatKey, number>> => {
  const bonuses: Partial<Record<StatKey, number>> = {}
  for (const item of equippedItems) {
    for (const effect of getEnhancedItemEffects(item)) {
      if (effect.type === 'stat_bonus' && effect.stat) {
        bonuses[effect.stat] = (bonuses[effect.stat] ?? 0) + effect.value
      }
    }
  }
  return bonuses
}

/** Get effective stat points (base + equipment bonuses + consumable bonuses).
 *  Effective stats are used for reward/combat calculations only.
 *  Permanent achievements and title unlocks must use hunter.stats (base stats). */
export const getEffectiveStats = (
  baseStats: Record<StatKey, number>,
  equippedItems: Item[],
  consumableStatBonuses: Partial<Record<StatKey, number>> = {}
): Record<StatKey, number> => {
  const equipmentBonuses = getEquipmentStatBonuses(equippedItems)
  const effective = { ...baseStats }
  for (const stat of Object.keys(baseStats) as StatKey[]) {
    effective[stat] = baseStats[stat] + (equipmentBonuses[stat] ?? 0) + (consumableStatBonuses[stat] ?? 0)
  }
  return effective
}

/** Get XP multiplier with equipment stat bonuses applied. */
export const getXpMultiplierWithEquipment = (
  hunter: HunterState,
  category: Category,
  equippedItems: Item[],
  consumableStatBonuses: Partial<Record<StatKey, number>> = {}
): number => {
  const effectiveStats = getEffectiveStats(hunter.stats, equippedItems, consumableStatBonuses)
  if (category === 'study' || category === 'career') {
    return 1 + getStatBonus(effectiveStats.INT, 5) / 100
  }
  if (category === 'health' || category === 'workout') {
    return 1 + getStatBonus(effectiveStats.STR, 5) / 100
  }
  return 1.0
}

/** Get drop chance bonus with equipment stat bonuses applied. */
export const getDropChanceBonusWithEquipment = (
  hunter: HunterState,
  category: Category,
  equippedItems: Item[],
  consumableStatBonuses: Partial<Record<StatKey, number>> = {}
): number => {
  const effectiveStats = getEffectiveStats(hunter.stats, equippedItems, consumableStatBonuses)
  if (category === 'health' || category === 'workout') {
    return getStatBonus(effectiveStats.VIT, 3) / 100
  }
  return 0
}

/** Get partial reward multiplier with equipment stat bonuses applied. */
export const getPartialRewardMultiplierWithEquipment = (
  hunter: HunterState,
  equippedItems: Item[],
  consumableStatBonuses: Partial<Record<StatKey, number>> = {}
): number => {
  const effectiveStats = getEffectiveStats(hunter.stats, equippedItems, consumableStatBonuses)
  return 1 + getStatBonus(effectiveStats.AGI, 5) / 100
}

/** Get rarity weight bonus with equipment stat bonuses applied. */
export const getRarityWeightBonusWithEquipment = (
  hunter: HunterState,
  equippedItems: Item[],
  consumableStatBonuses: Partial<Record<StatKey, number>> = {}
): number => {
  const effectiveStats = getEffectiveStats(hunter.stats, equippedItems, consumableStatBonuses)
  return getStatBonus(effectiveStats.SEN, 1) / 100
}

// ── Title Effect Helpers ───────────────────────────────────────────────

const clampBonus = (value: number, min = 0, max = 1): number => {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

export const getEquippedTitleDefinition = (hunter: HunterState): TitleDefinition | undefined => {
  if (!hunter.equippedTitleId || !hunter.ownedTitleIds.includes(hunter.equippedTitleId)) return undefined
  return TITLE_DEFINITIONS.find(title => title.id === hunter.equippedTitleId)
}

export const getEquippedTitleEffects = (hunter: HunterState): TitleEffects => {
  return getEquippedTitleDefinition(hunter)?.effects ?? {}
}

export const getTitleXpMultiplier = (hunter: HunterState, category: Category): number => {
  const effects = getEquippedTitleEffects(hunter)
  const globalBonus = clampBonus(effects.globalXpBonus ?? 0, 0, 0.07)
  const categoryBonus = clampBonus(effects.xpBonusByCategory?.[category] ?? 0, 0, 0.07)
  return 1 + Math.min(0.1, globalBonus + categoryBonus)
}

export const getTitleDropBonus = (hunter: HunterState): number => {
  return clampBonus(getEquippedTitleEffects(hunter).gateDropBonus ?? 0, 0, 0.07)
}

export const getTitleRarityBonus = (hunter: HunterState): number => {
  return clampBonus(getEquippedTitleEffects(hunter).rarityBonus ?? 0, 0, 0.05)
}

export const formatTitleEffects = (title: TitleDefinition): string[] => {
  const effects = title.effects
  if (!effects) return ['효과 없음']

  const lines: string[] = []
  const percent = (value: number) => `${Math.round(value * 100)}%`

  if ((effects.globalXpBonus ?? 0) > 0) {
    lines.push(`전체 XP +${percent(effects.globalXpBonus ?? 0)}`)
  }

  const categoryEntries = Object.entries(effects.xpBonusByCategory ?? {}) as Array<[Category, number]>
  const categoryText = categoryEntries
    .filter(([, value]) => value > 0)
    .map(([category, value]) => `${CATEGORY_META[category].label} XP +${percent(value)}`)
  lines.push(...categoryText)

  if ((effects.gateDropBonus ?? 0) > 0) {
    lines.push(`게이트 드롭률 +${percent(effects.gateDropBonus ?? 0)}`)
  }
  if ((effects.rarityBonus ?? 0) > 0) {
    lines.push(`레어리티 +${percent(effects.rarityBonus ?? 0)}`)
  }

  const statEntries = Object.entries(effects.statBonus ?? {}) as Array<[StatKey, number]>
  lines.push(...statEntries
    .filter(([, value]) => value > 0)
    .map(([stat, value]) => `${STAT_META[stat].label} ${formatStatReward(value)}`))

  if ((effects.gatePenaltyReduction ?? 0) > 0) {
    lines.push(`게이트 페널티 완화 +${percent(effects.gatePenaltyReduction ?? 0)}`)
  }
  if ((effects.injuryRecoveryBonus ?? 0) > 0) {
    lines.push(`부상 회복 +${percent(effects.injuryRecoveryBonus ?? 0)}`)
  }

  return lines.length > 0 ? lines : ['효과 없음']
}

// ── Gate / Combat Calculation Helpers ──────────────────────────────

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

const getActiveCombatConsumableStatBonuses = (
  effects: ActiveConsumableEffect[] = []
): Partial<Record<StatKey, number>> => {
  const bonuses: Partial<Record<StatKey, number>> = {}
  effects
    .filter(effect => !effect.consumed)
    .filter(effect => effect.type === 'temporary_stat_bonus' && effect.stat)
    .filter(effect => !effect.duration || effect.duration === 'today' || effect.duration === 'next_gate')
    .forEach(effect => {
      if (effect.stat) {
        bonuses[effect.stat] = (bonuses[effect.stat] ?? 0) + effect.value
      }
    })
  return bonuses
}

const JOB_COMBAT_SKILL_IDS: Partial<Record<JobId, string[]>> = {
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

type CombatStatEffectKey = NonNullable<ActiveCombatEffect['stat']>

const COMBAT_EFFECT_STAT_WEIGHTS: Record<CombatStatEffectKey, number> = {
  atk: 3,
  def: 2,
  speed: 1.5,
  critRate: 100,
  accuracy: 0,
  evasionRate: 100,
}

const getSkillCooldownFactor = (skill: SkillDefinition): number => {
  const cooldown = Math.max(0, skill.cooldownTurns ?? 0)
  return 1 / (1 + cooldown * 0.35)
}

const getSkillEffects = (skill: SkillDefinition): SkillEffect[] => [
  ...(skill.effect ? [skill.effect] : []),
  ...(skill.effects ?? []),
]

const calculateSkillEffectCombatValue = (effect: SkillEffect, cooldownFactor: number): number => {
  const duration = Math.max(1, effect.durationTurns ?? 1)
  const cappedDuration = Math.min(duration, 5)

  if (effect.kind === 'damage_reduction') {
    return Math.max(0, effect.value) * 100 * cappedDuration * cooldownFactor * 0.4
  }

  if (effect.kind === 'counter') {
    return (effect.counterRate ?? 0) * (effect.counterPower ?? 0.5) * 100 * cappedDuration * cooldownFactor * 0.5
  }

  if (!effect.stat) return 0

  const statWeight = COMBAT_EFFECT_STAT_WEIGHTS[effect.stat] ?? 0
  const effectMagnitude = Math.abs(effect.value)
  return effectMagnitude * statWeight * cappedDuration * 0.35 * cooldownFactor
}

export const calculateSkillCombatValue = (skill: SkillDefinition): number => {
  const cooldownFactor = getSkillCooldownFactor(skill)

  if (skill.type === 'attack') {
    const power = skill.power ?? 1
    return Math.max(0, (power - 1) * 100 * cooldownFactor)
  }

  if (skill.type === 'buff' || skill.type === 'debuff') {
    return getSkillEffects(skill).reduce(
      (sum, effect) => sum + calculateSkillEffectCombatValue(effect, cooldownFactor),
      0
    )
  }

  if (skill.type === 'heal') {
    const healPower = skill.power ?? 0.2
    return healPower * 80 * cooldownFactor
  }

  return 0
}

export const calculateSkillTotalPower = (skills: SkillDefinition[]): number => {
  const total = skills.reduce((sum, skill) => sum + calculateSkillCombatValue(skill), 0)
  return Math.min(120, Math.round(total))
}

export const getActiveGateSuccessBonus = (effects: ActiveConsumableEffect[] = []): number => {
  const total = effects
    .filter(effect => !effect.consumed)
    .filter(effect => effect.type === 'gate_success_bonus')
    .filter(effect => effect.duration === 'next_gate' || effect.duration === 'today')
    .reduce((sum, effect) => sum + effect.value, 0)

  return Math.min(0.3, Math.max(0, total))
}

export const createGateSuccessCombatEffects = (
  bonus: number,
  targetId = 'player'
): ActiveCombatEffect[] => {
  const cappedBonus = Math.min(0.3, Math.max(0, bonus))
  if (cappedBonus <= 0) return []

  const statBonus = Math.max(1, Math.round(cappedBonus * 50))

  return [
    {
      sourceSkillId: 'consumable-gate-success-bonus-atk',
      kind: 'stat',
      stat: 'atk',
      value: statBonus,
      remainingTurns: 3,
      targetId,
    },
    {
      sourceSkillId: 'consumable-gate-success-bonus-def',
      kind: 'stat',
      stat: 'def',
      value: statBonus,
      remainingTurns: 3,
      targetId,
    },
  ]
}

export const getPlayerCombatSkills = ({
  jobId,
  equippedItems = [],
  allSkills,
}: {
  jobId?: JobId
  equippedItems?: Item[]
  allSkills: SkillDefinition[]
}): SkillDefinition[] => {
  const skillIds = new Set<string>(['basic-attack'])
  if (jobId) {
    for (const id of JOB_COMBAT_SKILL_IDS[jobId] ?? []) skillIds.add(id)
  }

  for (const item of equippedItems) {
    for (const skillId of item.combatSkillIds ?? []) {
      skillIds.add(skillId)
    }
  }

  return allSkills.filter(skill => skillIds.has(skill.id))
}

export interface CalculatePlayerCombatStatsParams {
  level: number
  stats: Record<StatKey, number>
  equippedItems?: Item[]
  activeConsumableEffects?: ActiveConsumableEffect[]
  jobId?: JobId
  skills?: SkillDefinition[]
}

export const calculatePlayerCombatStats = ({
  level,
  stats,
  equippedItems = [],
  activeConsumableEffects = [],
  jobId: _jobId,
  skills = [],
}: CalculatePlayerCombatStatsParams): PlayerCombatStats => {
  const safeLevel = Math.max(1, level)
  const consumableStatBonuses = getActiveCombatConsumableStatBonuses(activeConsumableEffects)
  const effectiveStats = getEffectiveStats(stats, equippedItems, consumableStatBonuses)

  // TODO(11-x): apply job-specific combat modifiers after job combat identities are finalized.
  return {
    maxHp: 100 + effectiveStats.VIT * 10 + safeLevel * 5,
    atk: 10 + effectiveStats.STR * 2 + safeLevel * 2,
    def: 5 + effectiveStats.VIT * 1.2 + safeLevel,
    speed: 10 + effectiveStats.AGI * 1.5,
    critRate: Math.min(0.5, effectiveStats.SEN * 0.008),
    evasionRate: Math.min(0.3, effectiveStats.AGI * 0.004 + effectiveStats.PER * 0.003),
    accuracy: Math.min(0.99, 0.95 + effectiveStats.SEN * 0.001),
    skillTotalPower: calculateSkillTotalPower(skills),
  }
}

export const calculateCombatPower = (stats: PlayerCombatStats): number => {
  return Math.round(
    stats.atk * 3 +
    stats.maxHp * 0.5 +
    stats.def * 2 +
    stats.speed * 1.5 +
    stats.critRate * 100 +
    stats.evasionRate * 100 +
    stats.skillTotalPower * 1.5
  )
  // accuracy is intentionally excluded: it usually stays in the 0.95-0.99 band,
  // so it has low discrimination and can behave like a fixed bonus.
}

export type GateRisk = 'low' | 'normal' | 'high' | 'extreme'

export const estimateGateRisk = (playerPower: number, recommendedPower: number): GateRisk => {
  if (recommendedPower <= 0) return 'extreme'

  const ratio = playerPower / recommendedPower
  if (ratio >= 1.3) return 'low'
  if (ratio >= 1.0) return 'normal'
  if (ratio >= 0.7) return 'high'
  return 'extreme'
}

export interface CalculateDamageParams {
  attackerAtk: number
  defenderDef: number
  skillPower?: number
  randomFactor?: number
  isCritical?: boolean
}

export const calculateDamage = ({
  attackerAtk,
  defenderDef,
  skillPower = 1,
  randomFactor = 1,
  isCritical = false,
}: CalculateDamageParams): number => {
  const safeAtk = Math.max(0, attackerAtk)
  const safeDef = Math.max(0, defenderDef)
  const safeSkillPower = Math.max(0, skillPower)
  const safeRandomFactor = Math.max(0, randomFactor)
  const defenseReduction = safeDef / (safeDef + 100)

  let damage = Math.max(
    1,
    Math.round(safeAtk * safeSkillPower * safeRandomFactor * (1 - defenseReduction))
  )

  if (isCritical) {
    damage = Math.round(damage * 1.5)
  }

  return damage
}

export const didHit = (accuracy: number, roll: number): boolean => roll <= clamp01(accuracy)

export const didEvade = (evasionRate: number, roll: number): boolean => roll <= clamp01(evasionRate)

export const didCrit = (critRate: number, roll: number): boolean => roll <= clamp01(critRate)

export interface BattleSkillContext {
  turnNumber: number
  selfHpRatio: number
  enemyHpRatio?: number
  selfAtk?: number
  selfDef?: number
  selfSpeed?: number
  enemyAtk?: number
  enemyDef?: number
  enemySpeed?: number
  isPlayer?: boolean
}

export const scoreSkill = (skill: SkillDefinition, context: BattleSkillContext): number => {
  if (skill.type === 'attack') {
    const power = skill.power ?? 1
    const cooldown = Math.max(0, skill.cooldownTurns ?? 0)
    return power * 100 - cooldown * 3
  }

  if (skill.type === 'heal') {
    if (context.selfHpRatio < 0.25) return 220
    if (context.selfHpRatio < 0.4) return 160
    if (context.selfHpRatio < 0.6) return 60
    return 0
  }

  if (skill.type === 'buff') {
    const effects = getSkillEffects(skill)
    const hasDamageReduction = effects.some(effect => effect.kind === 'damage_reduction')
    const hasCounter = effects.some(effect => effect.kind === 'counter')

    if (hasDamageReduction || hasCounter) {
      let score = 40
      if (context.selfHpRatio < 0.85) score += 20
      if (context.selfHpRatio < 0.7) score += 20
      if (context.selfHpRatio < 0.5) score += 35
      if ((context.enemyAtk ?? 0) > (context.selfDef ?? 0) * 1.3) score += 25
      if (hasCounter) score += 20
      if (context.turnNumber <= 2 && context.selfHpRatio > 0.85) score -= 25
      if ((context.enemyHpRatio ?? 1) < 0.35) score -= 25
      return Math.max(0, score)
    }

    const statEffect = effects.find(effect => effect.stat)
    const stat = statEffect?.stat
    const value = Math.abs(statEffect?.value ?? 0)
    const duration = Math.max(1, statEffect?.durationTurns ?? 1)
    if (!stat || value <= 0) return 0

    let score = 0

    if (stat === 'atk' || stat === 'critRate') {
      score = 55 + Math.min(30, value * 4)
      if (context.turnNumber <= 2) score += 10
      if ((context.enemyHpRatio ?? 1) > 0.7) score += 10
      if ((context.enemyHpRatio ?? 1) < 0.35) score -= 40
    }

    if (stat === 'def' || stat === 'evasionRate') {
      score = 40
      if (context.selfHpRatio < 0.75) score += 35
      if (context.selfHpRatio < 0.5) score += 35
      if (context.selfHpRatio < 0.35) score += 45
      if ((context.enemyAtk ?? 0) > (context.selfDef ?? 0) * 1.4) score += 25
      if (context.turnNumber <= 2 && context.selfHpRatio > 0.8) score -= 30
    }

    if (stat === 'speed') {
      score = 45
      if (context.turnNumber <= 2) score += 15
    }

    if (stat === 'accuracy') {
      score = 20
    }

    score += Math.min(duration, 4) * 3
    return Math.max(0, score)
  }

  if (skill.type === 'debuff') {
    const statEffect = getSkillEffects(skill).find(effect => effect.stat)
    const stat = statEffect?.stat
    const value = Math.abs(statEffect?.value ?? 0)
    const duration = Math.max(1, statEffect?.durationTurns ?? 1)
    if (!stat || value <= 0) return 0

    let score = 45

    if (stat === 'def') {
      score += Math.min(35, value * 2)
      if ((context.enemyDef ?? 0) >= 40) score += 25
    }

    if (stat === 'atk') {
      score += Math.min(35, value * 2)
      if ((context.enemyAtk ?? 0) > (context.selfDef ?? 0) * 1.5) score += 20
    }

    if (stat === 'speed' || stat === 'evasionRate') {
      score += 15
    }

    if (stat === 'accuracy') {
      score += 5
    }

    if (context.turnNumber <= 3) score += 10
    if ((context.enemyHpRatio ?? 1) < 0.3) score -= 35
    score += Math.min(duration, 4) * 3
    return Math.max(0, score)
  }

  return 0
}

export type RngFn = () => number

export const createSeededRng = (seed: number): RngFn => {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

export interface BattleActorState {
  type: 'player' | 'monster'
  id: string
  name: string
  maxHp: number
  hp: number
  atk: number
  def: number
  speed: number
  critRate: number
  accuracy: number
  evasionRate: number
  skillIds: string[]
  cooldowns: Record<string, number>
}

export interface SimulateGateBattleParams {
  playerName?: string
  playerStats: PlayerCombatStats
  monster: MonsterDefinition
  skills: SkillDefinition[]
  initialActiveEffects?: ActiveCombatEffect[]
  maxTurns?: number
  seed?: number
  rng?: RngFn
  gateInstanceId?: string
  battleId?: string
}

export interface SimulateGateWaveBattleParams {
  playerName?: string
  playerStats: PlayerCombatStats
  monsters: MonsterDefinition[]
  skills: SkillDefinition[]
  initialActiveEffects?: ActiveCombatEffect[]
  maxTurns?: number
  seed?: number
  rng?: RngFn
  gateInstanceId?: string
  battleId?: string
}

export interface GateBattleSimulationSummary {
  iterations: number
  victoryCount: number
  defeatCount: number
  drawCount: number
  victoryRate: number
  defeatRate: number
  drawRate: number
  averageTurns: number
  averagePlayerHpRemaining: number
}

export interface SummarizeGateBattleSimulationsParams {
  iterations: number
  playerName?: string
  playerStats: PlayerCombatStats
  monster: MonsterDefinition
  skills: SkillDefinition[]
  initialActiveEffects?: ActiveCombatEffect[]
  gateInstanceId?: string
  seedBase?: number
}

export interface SummarizeGateWaveBattleSimulationsParams {
  iterations: number
  playerName?: string
  playerStats: PlayerCombatStats
  monsters: MonsterDefinition[]
  skills: SkillDefinition[]
  initialActiveEffects?: ActiveCombatEffect[]
  gateInstanceId?: string
  seedBase?: number
}

export const BASIC_ATTACK_SKILL: SkillDefinition = {
  id: 'basic-attack',
  name: '기본 공격',
  description: '가장 기본적인 공격.',
  ownerType: 'common',
  type: 'attack',
  power: 1,
  cooldownTurns: 0,
}

export const ensureBasicAttack = (skills: SkillDefinition[]): SkillDefinition[] => {
  return skills.some(skill => skill.id === BASIC_ATTACK_SKILL.id)
    ? skills
    : [BASIC_ATTACK_SKILL, ...skills]
}

export const createPlayerBattleActor = (
  playerName: string,
  playerStats: PlayerCombatStats,
  allSkills: SkillDefinition[]
): BattleActorState => ({
  type: 'player',
  id: 'player',
  name: playerName,
  maxHp: playerStats.maxHp,
  hp: playerStats.maxHp,
  atk: playerStats.atk,
  def: playerStats.def,
  speed: playerStats.speed,
  critRate: playerStats.critRate,
  accuracy: playerStats.accuracy,
  evasionRate: playerStats.evasionRate,
  skillIds: allSkills
    .filter(skill => skill.ownerType === 'common' || skill.ownerType === 'job' || skill.ownerType === 'equipment')
    .map(skill => skill.id),
  cooldowns: {},
})

export const createMonsterBattleActor = (monster: MonsterDefinition): BattleActorState => ({
  type: 'monster',
  id: monster.id,
  name: monster.name,
  maxHp: monster.stats.maxHp,
  hp: monster.stats.maxHp,
  atk: monster.stats.atk,
  def: monster.stats.def,
  speed: monster.stats.speed,
  critRate: monster.stats.critRate,
  accuracy: monster.stats.accuracy,
  evasionRate: monster.stats.evasionRate,
  skillIds: Array.from(new Set([BASIC_ATTACK_SKILL.id, ...monster.skillIds])),
  cooldowns: {},
})

export const decrementCooldowns = (actor: BattleActorState): BattleActorState => ({
  ...actor,
  cooldowns: Object.fromEntries(
    Object.entries(actor.cooldowns).map(([skillId, turns]) => [skillId, Math.max(0, turns - 1)])
  ),
})

export const applyOrRefreshCombatEffect = (
  effects: ActiveCombatEffect[],
  effect: ActiveCombatEffect
): ActiveCombatEffect[] => {
  const index = effects.findIndex(e => getActiveCombatEffectKey(e) === getActiveCombatEffectKey(effect))
  if (index >= 0) {
    const next = [...effects]
    next[index] = effect
    return next
  }
  return [...effects, effect]
}

const getActiveCombatEffectKey = (effect: ActiveCombatEffect): string => {
  if (effect.kind === 'damage_reduction') return `${effect.targetId}:damage_reduction`
  if (effect.kind === 'counter') return `${effect.targetId}:counter`
  if (effect.stat) return `${effect.targetId}:stat:${effect.stat}`
  return `${effect.targetId}:${effect.sourceSkillId}`
}

const isStatCombatEffect = (effect: ActiveCombatEffect): effect is ActiveCombatEffect & { stat: CombatStatEffectKey } => {
  return Boolean(effect.stat) && (!effect.kind || effect.kind === 'stat')
}

export const getEffectiveBattleActorStats = (
  actor: BattleActorState,
  activeEffects: ActiveCombatEffect[]
): BattleActorState => {
  const relevantEffects = activeEffects
    .filter(effect => effect.targetId === actor.id)
    .filter(isStatCombatEffect)
  const modified = relevantEffects.reduce(
    (next, effect) => ({
      ...next,
      [effect.stat]: next[effect.stat] + effect.value,
    }),
    { ...actor }
  )

  return {
    ...modified,
    atk: Math.max(0, modified.atk),
    def: Math.max(0, modified.def),
    speed: Math.max(0, modified.speed),
    critRate: clamp01(modified.critRate),
    accuracy: clamp01(modified.accuracy),
    evasionRate: clamp01(modified.evasionRate),
  }
}

const getDamageReduction = (targetId: string, activeEffects: ActiveCombatEffect[]): number => {
  const total = activeEffects
    .filter(effect => effect.targetId === targetId && effect.kind === 'damage_reduction')
    .reduce((sum, effect) => sum + effect.value, 0)
  return Math.min(0.5, Math.max(0, total))
}

const getCounterEffect = (
  targetId: string,
  activeEffects: ActiveCombatEffect[]
): ActiveCombatEffect | undefined => {
  return activeEffects.find(effect => effect.targetId === targetId && effect.kind === 'counter')
}

const getHpRatio = (hp: number, maxHp: number): number => {
  if (maxHp <= 0) return 0
  return clamp01(hp / maxHp)
}

export const buildBattleSkillContext = (
  actor: BattleActorState,
  target: BattleActorState,
  activeEffects: ActiveCombatEffect[],
  turnNumber: number
): BattleSkillContext => {
  const actorEffective = getEffectiveBattleActorStats(actor, activeEffects)
  const targetEffective = getEffectiveBattleActorStats(target, activeEffects)

  return {
    turnNumber,
    selfHpRatio: getHpRatio(actor.hp, actor.maxHp),
    enemyHpRatio: getHpRatio(target.hp, target.maxHp),
    selfAtk: actorEffective.atk,
    selfDef: actorEffective.def,
    selfSpeed: actorEffective.speed,
    enemyAtk: targetEffective.atk,
    enemyDef: targetEffective.def,
    enemySpeed: targetEffective.speed,
    isPlayer: actor.type === 'player',
  }
}

export const chooseSkill = (
  actor: BattleActorState,
  availableSkills: SkillDefinition[],
  context: BattleSkillContext
): SkillDefinition => {
  const skillsWithFallback = ensureBasicAttack(availableSkills)
  const basicAttack = skillsWithFallback.find(skill => skill.id === BASIC_ATTACK_SKILL.id) ?? BASIC_ATTACK_SKILL
  const candidates = skillsWithFallback
    .filter(skill => actor.skillIds.includes(skill.id))
    .filter(skill => (actor.cooldowns[skill.id] ?? 0) <= 0)
    .map((skill, index) => ({
      skill,
      index,
      score: scoreSkill(skill, context),
      power: skill.power ?? 0,
    }))

  if (candidates.length === 0) return basicAttack

  const best = candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.power !== a.power) return b.power - a.power
    return a.index - b.index
  })[0]

  return best.score > 0 ? best.skill : basicAttack
}

const combatStatName = (stat?: ActiveCombatEffect['stat']): string => {
  const labels: Record<CombatStatEffectKey, string> = {
    atk: '공격력',
    def: '방어력',
    speed: '속도',
    critRate: '치명 감각',
    accuracy: '명중 감각',
    evasionRate: '회피 감각',
  }
  return stat ? labels[stat] : '전투 태세'
}

const buildEffectLogMessage = (
  actor: BattleActorState,
  target: BattleActorState,
  skill: SkillDefinition,
  outcome: BattleTurn['outcome'],
  effect?: ActiveCombatEffect
): string => {
  if (skill.id === 'skill-silent-guard') {
    return `[${actor.name}]가 [${skill.name}]을 펼쳤다. 호흡이 가라앉고 빈틈을 되돌려칠 준비를 마쳤다.`
  }

  if (!effect) return `[${actor.name}]가 [${skill.name}]을 발동했다. 전장의 공기가 흔들린다.`
  const targetName = outcome === 'buff' ? actor.name : target.name

  if (effect.kind === 'damage_reduction') {
    return `[${actor.name}]가 [${skill.name}]을 발동했다. [${targetName}]의 피해 흐름이 한층 낮아졌다.`
  }

  if (effect.kind === 'counter') {
    return `[${actor.name}]가 [${skill.name}]을 발동했다. [${targetName}]이(가) 반격 태세를 갖췄다.`
  }

  if (outcome === 'buff') {
    return `[${actor.name}]가 [${skill.name}]을 발동했다. [${targetName}]의 ${combatStatName(effect.stat)}이 날카롭게 깨어난다.`
  }

  return `[${actor.name}]가 [${skill.name}]을 퍼뜨렸다. [${targetName}]의 ${combatStatName(effect.stat)}이 무겁게 가라앉는다.`
}

export const resolveAction = (params: {
  actor: BattleActorState
  target: BattleActorState
  skill: SkillDefinition
  activeEffects: ActiveCombatEffect[]
  rng: RngFn
  turnNumber: number
  waveNumber?: number
  waveLabel?: string
}): {
  actor: BattleActorState
  target: BattleActorState
  activeEffects: ActiveCombatEffect[]
  log: BattleTurn
} => {
  const { skill, rng, turnNumber, waveNumber, waveLabel } = params
  const actorStats = getEffectiveBattleActorStats(params.actor, params.activeEffects)
  const targetStats = getEffectiveBattleActorStats(params.target, params.activeEffects)
  let actor = params.actor
  let target = params.target
  let activeEffects = params.activeEffects

  const baseLog = {
    turnNumber,
    waveNumber,
    waveLabel,
    actorType: actor.type,
    actorId: actor.id,
    actorName: actor.name,
    targetType: target.type,
    targetId: target.id,
    targetName: target.name,
    skillId: skill.id,
    skillName: skill.name,
  } satisfies Omit<BattleTurn, 'outcome' | 'message'>

  if (skill.type === 'heal') {
    const healAmount = Math.round(actor.maxHp * (skill.power ?? 0.2))
    actor = { ...actor, hp: Math.min(actor.maxHp, actor.hp + healAmount) }
    return {
      actor,
      target,
      activeEffects,
      log: {
        ...baseLog,
        outcome: 'heal',
        damage: -healAmount,
        remainingHp: actor.hp,
        message: `[${actor.name}]가 [${skill.name}]으로 호흡을 가다듬었다. HP +${healAmount}.`,
      },
    }
  }

  const needsHitCheck = skill.type === 'attack' || skill.type === 'debuff'
  if (needsHitCheck && !didHit(actorStats.accuracy, rng())) {
    return {
      actor,
      target,
      activeEffects,
      log: {
        ...baseLog,
        outcome: 'miss',
        remainingHp: target.hp,
        message: `[${actor.name}]의 [${skill.name}]이 허공을 갈랐다.`,
      },
    }
  }

  if (needsHitCheck && didEvade(targetStats.evasionRate, rng())) {
    return {
      actor,
      target,
      activeEffects,
      log: {
        ...baseLog,
        outcome: 'evade',
        remainingHp: target.hp,
        message: `[${target.name}]가 몸을 비틀어 [${skill.name}]을 피해냈다.`,
      },
    }
  }

  if (skill.type === 'attack') {
    const isCritical = didCrit(actorStats.critRate, rng())
    let damage = calculateDamage({
      attackerAtk: actorStats.atk,
      defenderDef: targetStats.def,
      skillPower: skill.power ?? 1,
      randomFactor: 0.9 + rng() * 0.2,
      isCritical,
    })
    const damageReduction = getDamageReduction(target.id, activeEffects)
    if (damageReduction > 0) {
      damage = Math.max(1, Math.round(damage * (1 - damageReduction)))
    }
    target = { ...target, hp: Math.max(0, target.hp - damage) }
    let counterDamage = 0
    if (target.hp > 0) {
      const counterEffect = getCounterEffect(target.id, activeEffects)
      if (counterEffect && rng() <= clamp01(counterEffect.counterRate ?? 0)) {
        counterDamage = calculateDamage({
          attackerAtk: targetStats.atk,
          defenderDef: actorStats.def,
          skillPower: counterEffect.counterPower ?? 0.5,
          randomFactor: 1,
          isCritical: false,
        })
        actor = { ...actor, hp: Math.max(0, actor.hp - counterDamage) }
      }
    }
    const hitMessage = actor.type === 'monster'
      ? `[${actor.name}]가 [${skill.name}]으로 거칠게 달려들었다. ${damage} 피해.`
      : `[${actor.name}]가 [${target.name}]을 향해 [${skill.name}]을 날렸다. ${damage} 피해.`
    const reductionMessage = damageReduction > 0
      ? ` [${target.name}]가 피해 일부를 흘려냈다.`
      : ''
    const counterMessage = counterDamage > 0
      ? ` 이어서 빈틈을 찔러 ${counterDamage} 반격 피해.`
      : ''
    return {
      actor,
      target,
      activeEffects,
      log: {
        ...baseLog,
        outcome: isCritical ? 'critical' : 'hit',
        damage,
        remainingHp: target.hp,
        message: (isCritical
          ? `[${actor.name}]의 [${skill.name}]이 급소를 꿰뚫었다! 치명타 ${damage} 피해.`
          : hitMessage) + reductionMessage + counterMessage,
      },
    }
  }

  const skillEffects = getSkillEffects(skill)
  if ((skill.type === 'buff' || skill.type === 'debuff') && skillEffects.length > 0) {
    const appliedEffects: ActiveCombatEffect[] = []
    for (const effect of skillEffects) {
      const effectTarget = effect.target === 'self' ? actor : target
      const appliedEffect: ActiveCombatEffect = {
        sourceSkillId: skill.id,
        kind: effect.kind ?? (effect.stat ? 'stat' : undefined),
        stat: effect.stat,
        value: effect.value,
        remainingTurns: effect.durationTurns ?? 1,
        targetId: effectTarget.id,
        counterRate: effect.counterRate,
        counterPower: effect.counterPower,
      }
      activeEffects = applyOrRefreshCombatEffect(activeEffects, appliedEffect)
      appliedEffects.push(appliedEffect)
    }
    const outcome: BattleTurn['outcome'] = skill.type === 'buff' ? 'buff' : 'debuff'
    return {
      actor,
      target,
      activeEffects,
      log: {
        ...baseLog,
        outcome,
        remainingHp: target.hp,
        message: buildEffectLogMessage(actor, target, skill, outcome, appliedEffects[0]),
      },
    }
  }

  return {
    actor,
    target,
    activeEffects,
    log: {
      ...baseLog,
      outcome: 'hit',
      remainingHp: target.hp,
      message: `[${actor.name}]가 [${skill.name}]을 시도했지만 균열의 기세가 흐트러지지 않았다.`,
    },
  }
}

export const tickRoundEffects = (effects: ActiveCombatEffect[]): ActiveCombatEffect[] => {
  return effects
    .map(effect => ({ ...effect, remainingTurns: effect.remainingTurns - 1 }))
    .filter(effect => effect.remainingTurns > 0)
}

export const simulateGateBattle = ({
  playerName = '헌터',
  playerStats,
  monster,
  skills,
  initialActiveEffects = [],
  maxTurns = 30,
  seed,
  rng: providedRng,
  gateInstanceId = 'simulated-gate',
  battleId,
}: SimulateGateBattleParams): CombatLog => {
  const rng = providedRng ?? (seed != null ? createSeededRng(seed) : Math.random)
  const allSkills = ensureBasicAttack(skills)
  const playerSkillIds = allSkills
    .filter(skill => skill.ownerType === 'common' || skill.ownerType === 'job' || skill.ownerType === 'equipment')
    .map(skill => skill.id)
  const monsterSkillIds = Array.from(new Set([BASIC_ATTACK_SKILL.id, ...monster.skillIds]))

  let player: BattleActorState = {
    type: 'player',
    id: 'player',
    name: playerName,
    maxHp: playerStats.maxHp,
    hp: playerStats.maxHp,
    atk: playerStats.atk,
    def: playerStats.def,
    speed: playerStats.speed,
    critRate: playerStats.critRate,
    accuracy: playerStats.accuracy,
    evasionRate: playerStats.evasionRate,
    skillIds: playerSkillIds,
    cooldowns: {},
  }

  let monsterActor: BattleActorState = {
    type: 'monster',
    id: monster.id,
    name: monster.name,
    maxHp: monster.stats.maxHp,
    hp: monster.stats.maxHp,
    atk: monster.stats.atk,
    def: monster.stats.def,
    speed: monster.stats.speed,
    critRate: monster.stats.critRate,
    accuracy: monster.stats.accuracy,
    evasionRate: monster.stats.evasionRate,
    skillIds: monsterSkillIds,
    cooldowns: {},
  }

  let activeEffects: ActiveCombatEffect[] = [...initialActiveEffects]
  const turns: BattleTurn[] = []
  let result: CombatLog['result'] = 'draw'
  let turnNumber = 0

  for (let round = 1; round <= maxTurns; round++) {
    const effectivePlayer = getEffectiveBattleActorStats(player, activeEffects)
    const effectiveMonster = getEffectiveBattleActorStats(monsterActor, activeEffects)
    const order: Array<'player' | 'monster'> = effectivePlayer.speed >= effectiveMonster.speed
      ? ['player', 'monster']
      : ['monster', 'player']

    for (const actorType of order) {
      if (player.hp <= 0 || monsterActor.hp <= 0) break

      if (actorType === 'player') {
        player = decrementCooldowns(player)
        const context = buildBattleSkillContext(player, monsterActor, activeEffects, round)
        const skill = chooseSkill(player, allSkills, context)
        const resolved = resolveAction({
          actor: player,
          target: monsterActor,
          skill,
          activeEffects,
          rng,
          turnNumber: ++turnNumber,
        })
        player = {
          ...resolved.actor,
          cooldowns: {
            ...resolved.actor.cooldowns,
            [skill.id]: skill.cooldownTurns ?? 0,
          },
        }
        monsterActor = resolved.target
        activeEffects = resolved.activeEffects
        turns.push(resolved.log)
      } else {
        monsterActor = decrementCooldowns(monsterActor)
        const context = buildBattleSkillContext(monsterActor, player, activeEffects, round)
        const monsterSkills = allSkills.filter(skill => skill.ownerType === 'common' || skill.ownerType === 'monster')
        const skill = chooseSkill(monsterActor, monsterSkills, context)
        const resolved = resolveAction({
          actor: monsterActor,
          target: player,
          skill,
          activeEffects,
          rng,
          turnNumber: ++turnNumber,
        })
        monsterActor = {
          ...resolved.actor,
          cooldowns: {
            ...resolved.actor.cooldowns,
            [skill.id]: skill.cooldownTurns ?? 0,
          },
        }
        player = resolved.target
        activeEffects = resolved.activeEffects
        turns.push(resolved.log)
      }
    }

    if (monsterActor.hp <= 0) {
      result = 'victory'
      break
    }
    if (player.hp <= 0) {
      result = 'defeat'
      break
    }

    activeEffects = tickRoundEffects(activeEffects)
  }

  return {
    battleId: battleId ?? `battle-${Date.now()}-${Math.floor(rng() * 1_000_000)}`,
    gateInstanceId,
    result,
    turns,
    totalTurns: turns.length,
    playerHpRemaining: Math.max(0, player.hp),
    rewards: [],
    penaltyApplied: undefined,
  }
}

export const simulateGateWaveBattle = ({
  playerName = '?뚰꽣',
  playerStats,
  monsters,
  skills,
  initialActiveEffects = [],
  maxTurns = 30,
  seed,
  rng: providedRng,
  gateInstanceId = 'simulated-gate',
  battleId,
}: SimulateGateWaveBattleParams): CombatLog => {
  const rng = providedRng ?? (seed != null ? createSeededRng(seed) : Math.random)
  const allSkills = ensureBasicAttack(skills)
  const turns: BattleTurn[] = []
  const totalWaves = monsters.length

  if (totalWaves === 0) {
    return {
      battleId: battleId ?? `battle-${Date.now()}-${Math.floor(rng() * 1_000_000)}`,
      gateInstanceId,
      result: 'draw',
      turns,
      totalTurns: 0,
      playerHpRemaining: playerStats.maxHp,
      rewards: [],
      penaltyApplied: undefined,
      totalWaves: 0,
      clearedWaves: 0,
    }
  }

  let player = createPlayerBattleActor(playerName, playerStats, allSkills)
  let activeEffects: ActiveCombatEffect[] = [...initialActiveEffects]
  let clearedWaves = 0
  let result: CombatLog['result'] = 'draw'

  for (let waveIndex = 0; waveIndex < monsters.length; waveIndex++) {
    const monsterDef = monsters[waveIndex]
    let monsterActor = createMonsterBattleActor(monsterDef)
    const waveNumber = waveIndex + 1
    const waveLabel = `Wave ${waveNumber}`

    while (player.hp > 0 && monsterActor.hp > 0 && turns.length < maxTurns) {
      const effectivePlayer = getEffectiveBattleActorStats(player, activeEffects)
      const effectiveMonster = getEffectiveBattleActorStats(monsterActor, activeEffects)
      const order: Array<'player' | 'monster'> = effectivePlayer.speed >= effectiveMonster.speed
        ? ['player', 'monster']
        : ['monster', 'player']

      for (const actorType of order) {
        if (player.hp <= 0 || monsterActor.hp <= 0 || turns.length >= maxTurns) break

        if (actorType === 'player') {
          player = decrementCooldowns(player)
          const context = buildBattleSkillContext(player, monsterActor, activeEffects, turns.length + 1)
          const skill = chooseSkill(player, allSkills, context)
          const resolved = resolveAction({
            actor: player,
            target: monsterActor,
            skill,
            activeEffects,
            rng,
            turnNumber: turns.length + 1,
            waveNumber,
            waveLabel,
          })
          player = {
            ...resolved.actor,
            cooldowns: {
              ...resolved.actor.cooldowns,
              [skill.id]: skill.cooldownTurns ?? 0,
            },
          }
          monsterActor = resolved.target
          activeEffects = resolved.activeEffects
          turns.push(resolved.log)
        } else {
          monsterActor = decrementCooldowns(monsterActor)
          const context = buildBattleSkillContext(monsterActor, player, activeEffects, turns.length + 1)
          const monsterSkills = allSkills.filter(skill => skill.ownerType === 'common' || skill.ownerType === 'monster')
          const skill = chooseSkill(monsterActor, monsterSkills, context)
          const resolved = resolveAction({
            actor: monsterActor,
            target: player,
            skill,
            activeEffects,
            rng,
            turnNumber: turns.length + 1,
            waveNumber,
            waveLabel,
          })
          monsterActor = {
            ...resolved.actor,
            cooldowns: {
              ...resolved.actor.cooldowns,
              [skill.id]: skill.cooldownTurns ?? 0,
            },
          }
          player = resolved.target
          activeEffects = resolved.activeEffects
          turns.push(resolved.log)
        }
      }

      if (player.hp <= 0 || monsterActor.hp <= 0 || turns.length >= maxTurns) break
      activeEffects = tickRoundEffects(activeEffects)
    }

    if (monsterActor.hp <= 0) {
      clearedWaves += 1
    }
    if (player.hp <= 0) {
      result = 'defeat'
      break
    }
    if (monsterActor.hp > 0 && turns.length >= maxTurns) {
      result = 'draw'
      break
    }
  }

  if (clearedWaves >= totalWaves && player.hp > 0) {
    result = 'victory'
  }

  return {
    battleId: battleId ?? `battle-${Date.now()}-${Math.floor(rng() * 1_000_000)}`,
    gateInstanceId,
    result,
    turns,
    totalTurns: turns.length,
    playerHpRemaining: Math.max(0, player.hp),
    rewards: [],
    penaltyApplied: undefined,
    totalWaves,
    clearedWaves,
  }
}

export const summarizeGateBattleSimulations = ({
  iterations,
  playerName,
  playerStats,
  monster,
  skills,
  initialActiveEffects,
  gateInstanceId = 'simulated-gate',
  seedBase = 1,
}: SummarizeGateBattleSimulationsParams): GateBattleSimulationSummary => {
  const safeIterations = Math.max(0, Math.floor(iterations))

  if (safeIterations === 0) {
    return {
      iterations: 0,
      victoryCount: 0,
      defeatCount: 0,
      drawCount: 0,
      victoryRate: 0,
      defeatRate: 0,
      drawRate: 0,
      averageTurns: 0,
      averagePlayerHpRemaining: 0,
    }
  }

  let victoryCount = 0
  let defeatCount = 0
  let drawCount = 0
  let totalTurns = 0
  let totalPlayerHpRemaining = 0

  for (let index = 0; index < safeIterations; index++) {
    const seed = seedBase + index
    const combatLog = simulateGateBattle({
      playerName,
      playerStats,
      monster,
      skills,
      initialActiveEffects,
      gateInstanceId,
      seed,
      battleId: `sim-${gateInstanceId}-${seed}`,
    })

    if (combatLog.result === 'victory') victoryCount += 1
    if (combatLog.result === 'defeat') defeatCount += 1
    if (combatLog.result === 'draw') drawCount += 1

    totalTurns += combatLog.totalTurns
    totalPlayerHpRemaining += combatLog.playerHpRemaining
  }

  return {
    iterations: safeIterations,
    victoryCount,
    defeatCount,
    drawCount,
    victoryRate: victoryCount / safeIterations,
    defeatRate: defeatCount / safeIterations,
    drawRate: drawCount / safeIterations,
    averageTurns: totalTurns / safeIterations,
    averagePlayerHpRemaining: totalPlayerHpRemaining / safeIterations,
  }
}

export const summarizeGateWaveBattleSimulations = ({
  iterations,
  playerName,
  playerStats,
  monsters,
  skills,
  initialActiveEffects,
  gateInstanceId = 'simulated-wave-gate',
  seedBase = 1,
}: SummarizeGateWaveBattleSimulationsParams): GateBattleSimulationSummary => {
  const safeIterations = Math.max(0, Math.floor(iterations))

  if (safeIterations === 0) {
    return {
      iterations: 0,
      victoryCount: 0,
      defeatCount: 0,
      drawCount: 0,
      victoryRate: 0,
      defeatRate: 0,
      drawRate: 0,
      averageTurns: 0,
      averagePlayerHpRemaining: 0,
    }
  }

  let victoryCount = 0
  let defeatCount = 0
  let drawCount = 0
  let totalTurns = 0
  let totalPlayerHpRemaining = 0

  for (let index = 0; index < safeIterations; index++) {
    const seed = seedBase + index
    const combatLog = simulateGateWaveBattle({
      playerName,
      playerStats,
      monsters,
      skills,
      initialActiveEffects,
      gateInstanceId,
      seed,
      battleId: `sim-${gateInstanceId}-${seed}`,
    })

    if (combatLog.result === 'victory') victoryCount += 1
    if (combatLog.result === 'defeat') defeatCount += 1
    if (combatLog.result === 'draw') drawCount += 1

    totalTurns += combatLog.totalTurns
    totalPlayerHpRemaining += combatLog.playerHpRemaining
  }

  return {
    iterations: safeIterations,
    victoryCount,
    defeatCount,
    drawCount,
    victoryRate: victoryCount / safeIterations,
    defeatRate: defeatCount / safeIterations,
    drawRate: drawCount / safeIterations,
    averageTurns: totalTurns / safeIterations,
    averagePlayerHpRemaining: totalPlayerHpRemaining / safeIterations,
  }
}
