import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AchievementStats,
  ActiveCombatEffect,
  ActiveConsumableEffect,
  ActiveGate,
  ActiveRandomQuest,
  BattleTurn,
  Category,
  CombatLog,
  ConsumableEffect,
  ConsumableEffectType,
  EquipmentSlot,
  EquipmentState,
  GatePenalty,
  GateReward,
  GateRewardTable,
  GateStatus,
  HunterState,
  Item,
  JobId,
  ManualBattleAction,
  ManualBattleSession,
  MonsterDefinition,
  OwnedShadow,
  Quest,
  RandomQuestTemplate,
  StatKey,
  SystemMessage,
  ShadowExtractResult,
  Title,
} from './types'
import { TITLE_DEFINITIONS, CATEGORY_META, JOB_DEFINITIONS, EQUIPMENT_SLOT_LABEL } from './types'
import {
  GATE_DEFINITIONS,
  GATE_PENALTIES,
  GATE_REWARD_TABLES,
  ITEM_POOL,
  DEFAULT_DAILIES,
  DEFAULT_DUNGEONS,
  DEFAULT_MAIN_QUESTS,
  MONSTER_DEFINITIONS,
  RANDOM_QUEST_POOL,
  SKILL_DEFINITIONS,
} from './seed'
import {
  CATEGORY_TO_STAT,
  calculatePlayerCombatStats,
  emptyCategoryProgress,
  getCooldownRemaining,
  getDropChanceBonus,
  getPartialRewardMultiplier,
  getRarityWeightBonus,
  getXpMultiplier,
  isBeforeMonth,
  monthStart,
  pickTopCategory,
  rankFromLevel,
  RANK_LABEL,
  shouldProtectStreak,
  todayISO,
  todayKey,
  getDateKey,
  addDays,
  xpToNextLevel,
  getEquippedItems,
  getEquipmentXpBonus,
  getEquipmentDropBonus,
  getEquipmentRarityBonus,
  getXpMultiplierWithEquipment,
  getDropChanceBonusWithEquipment,
  getPartialRewardMultiplierWithEquipment,
  getRarityWeightBonusWithEquipment,
  createGateSuccessCombatEffects,
  formatStatReward,
  getBalancedDungeonStepXp,
  getBalancedQuestDropChance,
  getBalancedQuestStatRewards,
  getBalancedQuestXp,
  getBalancedRandomQuestDropChance,
  getBalancedRandomQuestXp,
  getActiveGateSuccessBonus,
  canEnhanceItem,
  getEnhanceMaterialCandidates,
  getEnhancementLevel,
  getTitleDropBonus,
  getTitleRarityBonus,
  getTitleXpMultiplier,
  MAX_ITEM_ENHANCEMENT_LEVEL,
  getPlayerCombatSkills,
  BASIC_ATTACK_SKILL,
  BattleActorState,
  applyOrRefreshCombatEffect,
  buildBattleSkillContext,
  chooseSkill,
  createMonsterBattleActor,
  createPlayerBattleActor,
  decrementCooldowns,
  ensureBasicAttack,
  getEffectiveBattleActorStats,
  resolveAction,
  roundStatValue,
  simulateGateWaveBattle,
  resolveShadowSupportActions,
  isShadowCombatLog,
  tickRoundEffects,
} from './game'
import {
  ACHIEVEMENT_SHADOWS_BY_QUEST_ID,
  createOwnedShadow,
  getEquippedShadowCategoryXpBonus,
  getEquippedShadowDropBonus,
  getEquippedShadowStatBonuses,
  getEquippedShadows,
  getShadowDefinition,
  getShadowSlotCount,
  rollShadowExtraction,
  SHADOW_RARITY_LABEL,
} from './shadows'

interface GameState {
  hunter: HunterState
  quests: Quest[]
  items: Item[]
  titles: Title[]
  messages: SystemMessage[]
  achievementStats: AchievementStats
  activeRandomQuest?: ActiveRandomQuest
  randomQuestHistory: Record<string, {
    generatedQuestId?: string
    generatedCategory?: Category
    completedQuestId?: string
    skipped?: boolean
  }>
  equipment: EquipmentState
  activeConsumableEffects: ActiveConsumableEffect[]
  gateStatus: GateStatus
  activeGate?: ActiveGate
  combatLogs: CombatLog[]
  manualBattleSession?: ManualBattleSession
  ownedShadows: OwnedShadow[]
  equippedShadowIds: string[]
  shadowExtractHistory?: ShadowExtractResult[]
  lastShadowExtractResult?: ShadowExtractResult
  initialized: boolean

  // hunter
  setHunterName: (name: string) => void
  setHunterJob: (job: string) => void
  allocateFreeStat: (stat: StatKey) => void

  // quests
  addQuest: (q: Omit<Quest, 'id' | 'createdAt'>) => void
  removeQuest: (id: string) => void
  completeQuest: (id: string) => void
  uncompleteDaily: (id: string) => void
  resetDailiesIfNewDay: () => void

  // dungeons
  progressDungeon: (id: string) => void

  // titles
  unlockTitle: (titleId: string) => void
  equipTitle: (titleId: string) => void
  checkTitleUnlocks: () => void

  // jobs
  unlockJob: (jobId: JobId) => void
  equipJob: (jobId: JobId) => void
  checkJobAwakening: () => void

  // random quests
  rollRandomQuestForToday: () => void
  completeRandomQuest: () => void
  skipRandomQuest: () => void
  clearExpiredRandomQuest: () => void

  // equipment
  equipItem: (itemId: string) => void
  unequipItem: (slot: EquipmentSlot) => void
  enhanceItem: (itemId: string) => void

  // consumables
  useConsumable: (itemId: string) => void
  clearConsumedConsumableEffects: () => void
  clearExpiredConsumableEffects: () => void

  // gates
  setActiveGate: (gate: ActiveGate | undefined) => void
  clearExpiredGate: () => void
  rollGateSpawn: (source: 'daily_open' | 'daily_completion' | 'random_completion' | 'dungeon_clear' | 'hard_dungeon_clear' | 'main_completion') => void
  spawnGate: (gateId: string, source: 'random' | 'dungeon_clear' | 'event') => void
  recoverGateStamina: () => void
  recoverGateInjuryByQuest: () => void
  clearGateInjuryIfExpired: () => void
  addCombatLog: (log: CombatLog) => void
  clearCombatLogs: () => void
  startGateBattle: () => void
  startManualGateBattle: (gateId?: string) => void
  performManualBattleAction: (action: ManualBattleAction) => void
  cancelManualGateBattle: () => void
  switchManualBattleToAuto: () => void
  attemptShadowExtraction: (gateInstanceId: string) => void
  equipShadow: (shadowId: string) => void
  unequipShadow: (shadowId: string) => void
  grantAchievementNamedShadows: () => void

  // achievements
  recordAppOpen: () => void

  // messages
  pushMessage: (m: Omit<SystemMessage, 'id' | 'createdAt'>) => void
  dismissMessage: (id: string) => void
  clearMessages: () => void

  // dev
  hardReset: () => void

  // metadata sync
  syncDefaultQuestMetadata: () => void
}

const initialHunter: HunterState = {
  name: '플레이어',
  level: 1,
  xp: 0,
  totalXp: 0,
  rank: 'E',
  job: '미각성자',
  jobId: 'unawakened',
  unlockedJobIds: ['unawakened'],
  stats: { STR: 10, VIT: 10, AGI: 10, INT: 10, PER: 10, SEN: 10 },
  freeStatPoints: 0,
  streak: 0,
  categoryProgress: emptyCategoryProgress(),
  ownedTitleIds: [],
  equippedTitleId: undefined,
}

const createInitialAchievementStats = (): AchievementStats => {
  const emptyByCategory: Record<Category, number> = {} as Record<Category, number>
  for (const cat of Object.keys(CATEGORY_META) as Category[]) {
    emptyByCategory[cat] = 0
  }

  return {
    questCompletions: {
      total: 0,
      byQuestId: {},
      byCategory: { ...emptyByCategory },
      byType: { daily: 0, main: 0, dungeon: 0 },
    },
    dailyCompletions: {
      total: 0,
      byQuestId: {},
      byCategory: { ...emptyByCategory },
      currentStreakByQuestId: {},
      bestStreakByQuestId: {},
    },
    dungeonClears: {
      total: 0,
      byQuestId: {},
    },
    mainClears: {
      total: 0,
      byQuestId: {},
    },
    special: {
      earlyWakeBefore7Count: 0,
      earlyWakeBefore7CurrentStreak: 0,
      earlyWakeBefore7BestStreak: 0,
      noShortsWithin30MinCount: 0,
      noShortsWithin30MinCurrentStreak: 0,
      noShortsWithin30MinBestStreak: 0,
      meditationCount: 0,
      meditationCurrentStreak: 0,
      meditationBestStreak: 0,
      marketCheckCount: 0,
      spendingLimitMonthlyClearCount: 0,
      cmaJournalCount: 0,
      weightRecordCount: 0,
      lateNightCompletionCount: 0,
      daily15PlusClearDays: 0,
      daily15PlusClearDateKeys: [],
      zeroDailyClearCurrentStreak: 0,
      zeroDailyClearBestStreak: 0,
      perfectDailyWeekCount: 0,
      resurrectionCount: 0,
    },
    app: {
      firstSeenAt: undefined,
      lastSeenAt: undefined,
      activeDays: 0,
      activeDateKeys: [],
    },
    dailyHistory: {},
  }
}

const createInitialGateStatus = (): GateStatus => ({
  stamina: 100,
  maxStamina: 100,
  recoveryQuestProgress: 0,
  recoveryQuestRequired: 3,
  lastStaminaRecoveredAt: new Date().toISOString(),
  lastDailyGateRollDate: undefined,
})

const initialQuests = [...DEFAULT_DAILIES, ...DEFAULT_MAIN_QUESTS, ...DEFAULT_DUNGEONS]

const uid = () => Math.random().toString(36).slice(2, 10)

const GATE_ENTRY_COST = 20

const recoverGateStaminaByQuest = (gateStatus: GateStatus): GateStatus => ({
  ...gateStatus,
  stamina: Math.min(gateStatus.maxStamina, gateStatus.stamina + 5),
})

const clearExpiredGateInjury = (gateStatus: GateStatus, now = new Date()): GateStatus => {
  if (!gateStatus.injuredUntil) return gateStatus
  if (new Date(gateStatus.injuredUntil).getTime() > now.getTime()) return gateStatus
  return {
    ...gateStatus,
    injuredUntil: undefined,
    recoveryQuestProgress: 0,
  }
}

const recoverGateInjuryByQuestCompletion = (gateStatus: GateStatus, now = new Date()): GateStatus => {
  const cleared = clearExpiredGateInjury(gateStatus, now)
  if (!cleared.injuredUntil) return cleared

  const required = cleared.recoveryQuestRequired ?? 3
  const progress = (cleared.recoveryQuestProgress ?? 0) + 1
  if (progress >= required) {
    return {
      ...cleared,
      injuredUntil: undefined,
      recoveryQuestProgress: 0,
      recoveryQuestRequired: required,
    }
  }

  return {
    ...cleared,
    recoveryQuestProgress: progress,
    recoveryQuestRequired: required,
  }
}

const recoverGateAfterQuestCompletion = (gateStatus: GateStatus): GateStatus => {
  return recoverGateInjuryByQuestCompletion(recoverGateStaminaByQuest(gateStatus))
}

const consumeNextGateConsumables = (effects: ActiveConsumableEffect[]): ActiveConsumableEffect[] => {
  return effects
    .map(effect => {
      if (effect.consumed) return effect
      if (effect.duration === 'next_gate') return { ...effect, consumed: true }
      return effect
    })
    .filter(effect => !effect.consumed)
}

const getActiveGatePenaltyReduction = (effects: ActiveConsumableEffect[]): number => {
  const total = effects
    .filter(effect => !effect.consumed)
    .filter(effect => effect.type === 'gate_penalty_reduction')
    .filter(effect => !effect.duration || effect.duration === 'today' || effect.duration === 'next_gate')
    .reduce((sum, effect) => sum + effect.value, 0)
  return Math.min(0.5, total)
}

const pickWeightedGateRarity = (rewardTable: GateRewardTable, titleRarityBonus = 0): Item['rarity'] | undefined => {
  const entries = Object.entries(rewardTable.rarityBias ?? {}) as Array<[Item['rarity'], number]>
  const boostedEntries = entries.map(([rarity, weight]) => {
    if (rarity === 'legendary') return [rarity, weight + titleRarityBonus * 0.4] as [Item['rarity'], number]
    if (rarity === 'epic') return [rarity, weight + titleRarityBonus * 0.6] as [Item['rarity'], number]
    return [rarity, weight] as [Item['rarity'], number]
  })
  const weighted = boostedEntries.filter(([, weight]) => weight > 0)
  if (weighted.length === 0) return undefined

  const total = weighted.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [rarity, weight] of weighted) {
    roll -= weight
    if (roll <= 0) return rarity
  }
  return weighted[0]?.[0]
}

const randomGateRewardItem = (rewardTable: GateRewardTable, titleRarityBonus = 0): Item | undefined => {
  const rarity = pickWeightedGateRarity(rewardTable, titleRarityBonus)
  const rarityPool = rarity ? ITEM_POOL.filter(item => item.rarity === rarity) : []
  const pool = rarityPool.length > 0 ? rarityPool : ITEM_POOL
  const gateFocusedPool = pool.filter(item => item.slot === 'artifact' || (item.combatSkillIds?.length ?? 0) > 0)
  const shouldPreferGateLoot = gateFocusedPool.length > 0 && Math.random() < 0.7
  const pickPool = shouldPreferGateLoot ? gateFocusedPool : pool
  const pick = pickPool[Math.floor(Math.random() * pickPool.length)]
  if (!pick) return undefined
  return { ...pick, id: uid(), acquiredAt: todayISO() }
}

/** Rarity roll with SEN-driven epic/legendary boost + equipment rarity bonus + consumable rarity bonus. */
const randomItem = (
  hunter: HunterState,
  equippedItems: Item[],
  consumableRarityBonus = 0,
  titleRarityBonus = 0,
  source: 'daily' | 'main' | 'dungeon' | 'random' = 'main'
): Item => {
  const senBonus = getRarityWeightBonusWithEquipment(hunter, equippedItems) // SEN stat bonus
  const equipmentBonus = getEquipmentRarityBonus(equippedItems) // Equipment rarity bonus (capped at 0.05)
  const totalBonus = senBonus + equipmentBonus + consumableRarityBonus + titleRarityBonus
  
  // Base mass: legendary 0.02, epic 0.08, rare 0.15, uncommon 0.25, common 0.50
  // Bonus splits: legendary gets 40%, epic gets 60%, pulled from common.
  const legendaryProb = Math.min(0.04, 0.02 + totalBonus * 0.4) // Cap legendary at 4%
  const epicProb = 0.08 + totalBonus * 0.6
  const rareProb = 0.15
  const uncommonProb = 0.25

  const r = Math.random()
  let rarity: Item['rarity'] = 'common'
  if (r < legendaryProb) rarity = 'legendary'
  else if (r < legendaryProb + epicProb) rarity = 'epic'
  else if (r < legendaryProb + epicProb + rareProb) rarity = 'rare'
  else if (r < legendaryProb + epicProb + rareProb + uncommonProb) rarity = 'uncommon'

  const rarityPool = ITEM_POOL.filter(i => i.rarity === rarity)
  const nonArtifactPool = rarityPool.filter(i => i.slot !== 'artifact')
  const pool =
    source === 'daily'
      ? (nonArtifactPool.length > 0 ? nonArtifactPool : rarityPool)
      : source === 'random' && Math.random() < 0.75
        ? (nonArtifactPool.length > 0 ? nonArtifactPool : rarityPool)
        : rarityPool
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? ITEM_POOL[0]
  return { ...pick, id: uid(), acquiredAt: todayISO() }
}

// ── Random Quest Weight Helpers ────────────────────────────────────────

/** Get active consumable XP bonus for a specific category. */
const getActiveConsumableXpBonus = (
  effects: ActiveConsumableEffect[],
  category: Category
): number => {
  return effects
    .filter(e => !e.consumed)
    .filter(e => e.duration === 'next_quest' || e.duration === 'today')
    .filter(e =>
      e.type === 'next_quest_xp_bonus' ||
      (e.type === 'next_category_xp_bonus' && e.category === category)
    )
    .reduce((sum, e) => sum + e.value, 0)
}

/** Get active consumable drop bonus. */
const getActiveConsumableDropBonus = (effects: ActiveConsumableEffect[]): number => {
  const total = effects
    .filter(e => !e.consumed)
    .filter(e => e.duration === 'next_quest' || e.duration === 'today')
    .filter(e => e.type === 'temporary_drop_bonus')
    .reduce((sum, e) => sum + e.value, 0)
  return Math.min(total, 0.15) // Cap at 15%
}

/** Get active consumable rarity bonus. */
const getActiveConsumableRarityBonus = (effects: ActiveConsumableEffect[]): number => {
  const total = effects
    .filter(e => !e.consumed)
    .filter(e => e.duration === 'next_quest' || e.duration === 'today')
    .filter(e => e.type === 'temporary_rarity_bonus')
    .reduce((sum, e) => sum + e.value, 0)
  return Math.min(total, 0.05) // Cap at 5%
}

/** Get active consumable stat bonuses. */
const getActiveConsumableStatBonuses = (effects: ActiveConsumableEffect[]): Partial<Record<StatKey, number>> => {
  const bonuses: Partial<Record<StatKey, number>> = {}
  effects
    .filter(e => !e.consumed)
    .filter(e => e.duration === 'next_quest' || e.duration === 'today')
    .filter(e => e.type === 'temporary_stat_bonus' && e.stat)
    .forEach(e => {
      if (e.stat) {
        bonuses[e.stat] = (bonuses[e.stat] ?? 0) + e.value
      }
    })
  return bonuses
}

/** Mark next_quest consumable effects as consumed after quest completion. */
const consumeNextQuestEffects = (
  effects: ActiveConsumableEffect[],
  questCategory: Category
): ActiveConsumableEffect[] => {
  return effects
    .map(effect => {
      if (effect.consumed) return effect
      if (effect.duration !== 'next_quest') return effect
      
      // next_category_xp_bonus only consumed if category matches
      if (effect.type === 'next_category_xp_bonus' && effect.category !== questCategory) {
        return effect
      }
      
      return { ...effect, consumed: true }
    })
    .filter(e => !e.consumed) // Remove consumed effects immediately
}

// ── Random Quest Weight Helpers ────────────────────────────────────────

/** Get recent N days of random quest history (most recent first). */
const getRecentRandomQuestHistory = (
  history: Record<string, { generatedQuestId?: string; generatedCategory?: Category }>,
  days: number
): Array<{ dateKey: string; questId?: string; category?: Category }> => {
  const now = new Date()
  const recent: Array<{ dateKey: string; questId?: string; category?: Category }> = []
  
  for (let i = 0; i < days; i++) {
    const dateKey = getDateKey(addDays(now, -i))
    const record = history[dateKey]
    if (record) {
      recent.push({
        dateKey,
        questId: record.generatedQuestId,
        category: record.generatedCategory,
      })
    }
  }
  
  return recent
}

/** Count category appearances in recent random quest history. */
const getRecentRandomQuestCategoryCounts = (
  recentHistory: Array<{ category?: Category }>
): Partial<Record<Category, number>> => {
  const counts: Partial<Record<Category, number>> = {}
  for (const record of recentHistory) {
    if (record.category) {
      counts[record.category] = (counts[record.category] ?? 0) + 1
    }
  }
  return counts
}

/** Count today's available daily quests by category. */
const getTodayDailyCategoryCounts = (quests: Quest[]): Partial<Record<Category, number>> => {
  const counts: Partial<Record<Category, number>> = {}
  const now = new Date()
  
  for (const q of quests) {
    if (q.type === 'daily' && getCooldownRemaining(q, now) === 0) {
      counts[q.category] = (counts[q.category] ?? 0) + 1
    }
  }
  
  return counts
}

/** Calculate dynamic weight for a random quest template based on recent history and daily composition. */
const calculateDynamicRandomQuestWeight = (
  template: RandomQuestTemplate,
  recentHistory: Array<{ questId?: string; category?: Category }>,
  recentCategoryCounts: Partial<Record<Category, number>>,
  todayDailyCounts: Partial<Record<Category, number>>
): number => {
  let dynamicWeight = template.weight
  
  // 1. Recent category appearance adjustment
  const categoryCount = recentCategoryCounts[template.category] ?? 0
  if (categoryCount === 0) {
    dynamicWeight *= 1.35 // Not seen in 7 days: boost
  } else if (categoryCount === 1) {
    dynamicWeight *= 1.15 // Seen once: slight boost
  } else if (categoryCount === 2) {
    dynamicWeight *= 1.0 // Seen twice: neutral
  } else {
    dynamicWeight *= 0.75 // Seen 3+ times: reduce
  }
  
  // 2. Same quest recent appearance penalty
  const recentQuestIds = recentHistory.map(r => r.questId).filter(Boolean)
  if (recentQuestIds.includes(template.id)) {
    dynamicWeight *= 0.35 // Same quest appeared recently: strong penalty
  }
  
  // 3. Today's daily composition adjustment (light)
  const dailyCount = todayDailyCounts[template.category] ?? 0
  if (dailyCount === 0) {
    dynamicWeight *= 1.15 // No daily in this category: boost
  } else if (dailyCount >= 3) {
    dynamicWeight *= 0.9 // 3+ dailies in this category: slight reduce
  }
  // 1-2 dailies: neutral (no adjustment)
  
  // 4. Safety floor
  return Math.max(1, dynamicWeight)
}

/** Pick a weighted random quest from pool using dynamic weights. */
const pickWeightedRandomQuest = (
  pool: Array<{ template: RandomQuestTemplate; dynamicWeight: number }>
): RandomQuestTemplate => {
  const totalWeight = pool.reduce((sum, item) => sum + item.dynamicWeight, 0)
  let roll = Math.random() * totalWeight
  
  for (const item of pool) {
    roll -= item.dynamicWeight
    if (roll <= 0) {
      return item.template
    }
  }
  
  // Fallback (should never happen)
  return pool[0]?.template ?? RANDOM_QUEST_POOL[0]
}

interface XpOutcome {
  leveledUp: boolean
  newLevel: number
  rankChanged: boolean
  newRank: ReturnType<typeof rankFromLevel>
  /** Auto-distributed stat gains across all level-ups in this XP grant. */
  autoStatGains: Partial<Record<StatKey, number>>
  /** Free points added in this XP grant (one per level). */
  freeStatPointsGained: number
}

/** Apply XP and, on each level-up, auto-distribute +2 to the top-progressed category's stat
 *  and grant +1 free stat point. categoryProgress resets after each level. */
const applyXp = (
  hunter: HunterState,
  amount: number,
  sourceCategory: Category,
): { hunter: HunterState; outcome: XpOutcome } => {
  let xp = hunter.xp + amount
  let level = hunter.level
  let categoryProgress = { ...hunter.categoryProgress }
  const stats = { ...hunter.stats }
  let freeStatPoints = hunter.freeStatPoints
  let leveledUp = false
  let freeStatPointsGained = 0
  const autoStatGains: Partial<Record<StatKey, number>> = {}

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level)
    level += 1
    leveledUp = true

    // Auto +2 to top-progressed category's stat (fallback to current quest's category).
    const top = pickTopCategory(categoryProgress)
    const allZero = Object.values(categoryProgress).every(v => v === 0)
    const targetCategory: Category = allZero ? sourceCategory : top
    const targetStat = CATEGORY_TO_STAT[targetCategory]
    stats[targetStat] = roundStatValue(stats[targetStat] + 2)
    autoStatGains[targetStat] = (autoStatGains[targetStat] ?? 0) + 2

    // Free +1
    freeStatPoints += 1
    freeStatPointsGained += 1

    // Reset progress after consuming it for this level.
    categoryProgress = emptyCategoryProgress()
  }

  const newRank = rankFromLevel(level)
  const rankChanged = newRank !== hunter.rank

  return {
    hunter: {
      ...hunter,
      xp,
      level,
      stats,
      totalXp: hunter.totalXp + amount,
      rank: newRank,
      freeStatPoints,
      categoryProgress,
    },
    outcome: { leveledUp, newLevel: level, rankChanged, newRank, autoStatGains, freeStatPointsGained },
  }
}

const formatStatGains = (gains: Partial<Record<StatKey, number>>): string =>
  Object.entries(gains).map(([k, v]) => `${k}${formatStatReward(v ?? 0)}`).join(' ')

const toManualCombatant = (actor: BattleActorState): ManualBattleSession['player'] => ({
  name: actor.name,
  maxHp: actor.maxHp,
  hp: actor.hp,
  atk: actor.atk,
  def: actor.def,
  spd: actor.speed,
  critRate: actor.critRate,
  accuracy: actor.accuracy,
  evasion: actor.evasionRate,
})

const toBattleActor = (
  combatant: ManualBattleSession['player'],
  type: BattleActorState['type'],
  id: string,
  skillIds: string[],
  cooldowns: Record<string, number>
): BattleActorState => ({
  type,
  id,
  name: combatant.name,
  maxHp: combatant.maxHp,
  hp: combatant.hp,
  atk: combatant.atk,
  def: combatant.def,
  speed: combatant.spd,
  critRate: combatant.critRate ?? 0,
  accuracy: combatant.accuracy ?? 0.9,
  evasionRate: combatant.evasion ?? 0,
  skillIds,
  cooldowns,
})

const createDefendLog = (
  actor: BattleActorState,
  target: BattleActorState,
  turnNumber: number,
  waveNumber: number
): BattleTurn => ({
  turnNumber,
  waveNumber,
  waveLabel: `Wave ${waveNumber}`,
  actorType: 'player',
  actorId: actor.id,
  actorName: actor.name,
  targetType: 'monster',
  targetId: target.id,
  targetName: target.name,
  skillId: 'manual-defend',
  skillName: '방어',
  outcome: 'buff',
  remainingHp: actor.hp,
  message: `[${actor.name}]이 방어 태세를 취했습니다. 이번 턴 받는 피해가 40% 감소합니다.`,
})

const createManualSystemLog = (
  message: string,
  turnNumber: number,
  waveNumber: number,
  target: BattleActorState
): BattleTurn => ({
  turnNumber,
  waveNumber,
  waveLabel: `Wave ${waveNumber}`,
  actorType: 'player',
  actorId: 'system',
  actorName: 'SYSTEM',
  targetType: 'monster',
  targetId: target.id,
  targetName: target.name,
  skillId: 'system-manual-battle',
  skillName: '전투 흐름',
  outcome: 'buff',
  remainingHp: target.hp,
  message,
})

const createManualConsumableUseLog = (
  actor: BattleActorState,
  target: BattleActorState,
  message: string,
  turnNumber: number,
  waveNumber: number
): BattleTurn => ({
  turnNumber,
  waveNumber,
  waveLabel: `Wave ${waveNumber}`,
  actorType: 'player',
  actorId: actor.id,
  actorName: actor.name,
  targetType: 'monster',
  targetId: target.id,
  targetName: target.name,
  skillId: 'manual-consumable-use',
  skillName: '소모품',
  outcome: 'buff',
  remainingHp: actor.hp,
  message,
})

const isManualSystemLog = (log: BattleTurn): boolean => log.skillId === 'system-manual-battle' || isShadowCombatLog(log)

const getManualActionCount = (logs: BattleTurn[]): number => {
  return logs.filter(log => !isManualSystemLog(log)).length
}

const appendManualWaveClearLogs = (params: {
  logs: BattleTurn[]
  monster: BattleActorState
  waveIndex: number
  remainingMonsterIds: string[]
}): {
  logs: BattleTurn[]
  monster: BattleActorState
  waveIndex: number
  remainingMonsterIds: string[]
  result?: CombatLog['result']
} => {
  let { logs, monster, waveIndex } = params
  const remainingMonsterIds = [...params.remainingMonsterIds]

  while (monster.hp <= 0) {
    const clearedWaveNumber = waveIndex + 1
    logs = [
      ...logs,
      createManualSystemLog(
        `Wave ${clearedWaveNumber} 클리어. [${monster.name}]을 쓰러뜨렸습니다.`,
        logs.length + 1,
        clearedWaveNumber,
        monster
      ),
    ]

    const nextMonsterId = remainingMonsterIds.shift()
    if (!nextMonsterId) {
      logs = [
        ...logs,
        createManualSystemLog(
          '마지막 wave를 클리어했습니다. 게이트 공략 성공!',
          logs.length + 1,
          clearedWaveNumber,
          monster
        ),
      ]
      return { logs, monster, waveIndex, remainingMonsterIds, result: 'victory' }
    }

    const nextMonsterDef = MONSTER_DEFINITIONS.find(item => item.id === nextMonsterId)
    if (!nextMonsterDef) {
      return { logs, monster, waveIndex, remainingMonsterIds, result: 'draw' }
    }

    waveIndex += 1
    monster = createMonsterBattleActor(nextMonsterDef)
    logs = [
      ...logs,
      createManualSystemLog(
        `Wave ${waveIndex + 1} 시작. [${monster.name}]이 나타났습니다.`,
        logs.length + 1,
        waveIndex + 1,
        monster
      ),
    ]
  }

  return { logs, monster, waveIndex, remainingMonsterIds }
}

const MANUAL_CONSUMABLE_MAX_USES = 2

const isManualBattleConsumableEffect = (effect: ConsumableEffect): boolean => {
  if (effect.type === 'gate_penalty_reduction') return true
  if (effect.type !== 'temporary_stat_bonus') return false
  return effect.stat !== undefined && effect.stat !== 'INT'
}

const getManualConsumableFailureReason = (
  session: ManualBattleSession,
  item: Item | undefined
): string | undefined => {
  if (!item || !item.consumable || !item.consumableEffects?.some(isManualBattleConsumableEffect)) {
    return '전투 중 사용할 수 있는 소모품이 아닙니다.'
  }
  if (session.consumableUseCount >= MANUAL_CONSUMABLE_MAX_USES) {
    return `한 전투에서 소모품은 최대 ${MANUAL_CONSUMABLE_MAX_USES}회만 사용할 수 있습니다.`
  }
  if (session.usedConsumableItemIds.includes(item.id)) {
    return '이미 이 전투에서 같은 소모품을 사용했습니다.'
  }
  const effectTypes = item.consumableEffects
    .filter(isManualBattleConsumableEffect)
    .map(effect => effect.type)
  if (effectTypes.some(type => session.usedConsumableEffectTypes.includes(type))) {
    return '이미 같은 종류의 소모품 효과를 사용했습니다.'
  }
  if (
    effectTypes.includes('gate_penalty_reduction') &&
    session.consumableEffects.some(effect => !effect.consumed && effect.type === 'gate_penalty_reduction')
  ) {
    return '이미 패널티 감소 효과가 활성화되어 있습니다.'
  }
  if (
    effectTypes.includes('temporary_stat_bonus') &&
    session.activeEffects.some(effect => effect.sourceSkillId.startsWith('manual-consumable-stat-'))
  ) {
    return '이미 전투 소모품 능력치 효과가 활성화되어 있습니다.'
  }
  return undefined
}

const createManualConsumableActiveEffect = (effect: ConsumableEffect, item: Item): ActiveConsumableEffect => ({
  ...effect,
  id: `manual-consumable-${item.id}-${Date.now()}-${uid()}`,
  sourceItemId: item.id,
  sourceItemName: item.name,
  activatedAt: todayISO(),
  consumed: false,
})

const createManualConsumableCombatEffects = (
  effect: ConsumableEffect,
  item: Item
): ActiveCombatEffect[] => {
  if (effect.type !== 'temporary_stat_bonus' || !effect.stat) return []
  const duration = effect.duration === 'today' ? 5 : 3
  const sourceSkillId = `manual-consumable-stat-${item.id}`
  const value = effect.value

  if (effect.stat === 'STR') {
    return [{
      sourceSkillId,
      kind: 'stat',
      stat: 'atk',
      value: Math.max(1, Math.round(value * 2)),
      remainingTurns: duration,
      targetId: 'player',
    }]
  }
  if (effect.stat === 'VIT') {
    return [{
      sourceSkillId,
      kind: 'stat',
      stat: 'def',
      value: Math.max(1, Math.round(value * 1.2)),
      remainingTurns: duration,
      targetId: 'player',
    }]
  }
  if (effect.stat === 'AGI') {
    return [{
      sourceSkillId,
      kind: 'stat',
      stat: 'speed',
      value: Math.max(1, Math.round(value * 1.5)),
      remainingTurns: duration,
      targetId: 'player',
    }]
  }
  if (effect.stat === 'PER') {
    return [{
      sourceSkillId,
      kind: 'stat',
      stat: 'evasionRate',
      value: Math.min(0.08, value * 0.003),
      remainingTurns: duration,
      targetId: 'player',
    }]
  }
  if (effect.stat === 'SEN') {
    return [
      {
        sourceSkillId: `${sourceSkillId}-crit`,
        kind: 'stat',
        stat: 'critRate',
        value: Math.min(0.08, value * 0.008),
        remainingTurns: duration,
        targetId: 'player',
      },
      {
        sourceSkillId: `${sourceSkillId}-accuracy`,
        kind: 'stat',
        stat: 'accuracy',
        value: Math.min(0.03, value * 0.001),
        remainingTurns: duration,
        targetId: 'player',
      },
    ]
  }
  return []
}

const formatManualConsumableUseMessage = (item: Item, effects: ConsumableEffect[]): string => {
  const effectText = effects.map(effect => {
    if (effect.type === 'gate_penalty_reduction') {
      return `패배 시 스태미나 손실이 ${Math.round(effect.value * 100)}% 감소합니다`
    }
    if (effect.type === 'temporary_stat_bonus') {
      return `${effect.stat ?? '능력치'} +${effect.value} 효과가 3턴 동안 적용됩니다`
    }
    return '전투 효과가 적용됩니다'
  }).join(', ')
  return `[${item.name}]을 사용했습니다. ${effectText}.`
}

const buildAchievementShadowGrants = (
  quests: Quest[],
  ownedShadows: OwnedShadow[] | undefined
): { shadows: OwnedShadow[]; messages: SystemMessage[] } => {
  const ownedDefinitionIds = new Set((ownedShadows ?? []).map(shadow => shadow.definitionId))
  const completedQuestIds = new Set(
    quests
      .filter(q => (q.type === 'main' && q.completed) || (q.type === 'dungeon' && q.completed))
      .map(q => q.id)
  )
  const shadows: OwnedShadow[] = []
  const messages: SystemMessage[] = []

  for (const questId of completedQuestIds) {
    for (const definitionId of ACHIEVEMENT_SHADOWS_BY_QUEST_ID[questId] ?? []) {
      if (ownedDefinitionIds.has(definitionId)) continue
      const definition = getShadowDefinition(definitionId)
      if (!definition) continue
      const shadow = createOwnedShadow(definition)
      ownedDefinitionIds.add(definitionId)
      shadows.push(shadow)
      messages.push({
        id: uid(),
        kind: 'shadow',
        title: '성취 네임드 영입',
        lines: [
          '당신의 현실 성취가 하나의 그림자를 깨웠습니다.',
          `[${SHADOW_RARITY_LABEL[shadow.rarity]}] ${shadow.name}이(가) 군단에 합류했습니다.`,
        ],
        createdAt: todayISO(),
      })
    }
  }

  return { shadows, messages }
}

const createGateBattleOutcomeUpdate = (
  s: GameState,
  activeGate: ActiveGate,
  gate: (typeof GATE_DEFINITIONS)[number],
  gateStatus: GateStatus,
  combatLog: CombatLog
): { state: Partial<GameState>; finalLog: CombatLog; shouldCheckUnlocks: boolean } => {
  const nextConsumables = consumeNextGateConsumables(s.activeConsumableEffects)
  const rewardTable = GATE_REWARD_TABLES.find(r => r.id === gate.rewardTableId)
  const penalty = GATE_PENALTIES.find(p => p.id === gate.failPenaltyId)
  let nextHunter = s.hunter
  let nextItems = s.items
  let nextGateStatus = gateStatus
  let nextActiveGate = activeGate
  let gateRewards: GateReward[] = []
  let penaltyApplied: GatePenalty | undefined
  let shouldCheckUnlocks = false
  const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)

  if (combatLog.result === 'victory') {
    nextGateStatus = {
      ...gateStatus,
      stamina: Math.max(0, gateStatus.stamina - GATE_ENTRY_COST),
    }
    nextActiveGate = { ...activeGate, status: 'cleared' }

    let leveledUpOutcome: ReturnType<typeof applyXp>['outcome'] | undefined
    if (rewardTable) {
      const shadowXpBonus = getEquippedShadowCategoryXpBonus(equippedShadows, 'challenge')
      const xpReward = Math.round(rewardTable.xp * getTitleXpMultiplier(s.hunter, 'challenge') * (1 + shadowXpBonus))
      const xpResult = applyXp(s.hunter, xpReward, 'challenge')
      nextHunter = xpResult.hunter
      leveledUpOutcome = xpResult.outcome
      gateRewards.push({ type: 'xp', amount: xpReward })

      const titleDropBonus = getTitleDropBonus(s.hunter)
      const titleRarityBonus = getTitleRarityBonus(s.hunter)
      const finalDropChance = Math.min(0.95, rewardTable.itemDropChance + titleDropBonus + getEquippedShadowDropBonus(equippedShadows))
      if (Math.random() < finalDropChance) {
        const item = randomGateRewardItem(rewardTable, titleRarityBonus)
        if (item) {
          nextItems = [...nextItems, item]
          gateRewards.push({
            type: 'item',
            itemId: item.id,
            itemName: item.name,
            rarity: item.rarity,
          })
        }
      }
    }

    shouldCheckUnlocks = Boolean(leveledUpOutcome?.leveledUp || leveledUpOutcome?.rankChanged)
  } else if (combatLog.result === 'defeat') {
    const basePenalty = penalty ?? {
      id: 'penalty-gate-basic',
      name: '기본 게이트 패널티',
      staminaCost: 50,
      injuryHours: 6,
    }
    const penaltyReduction = getActiveGatePenaltyReduction(s.activeConsumableEffects)
    const finalStaminaCost = Math.round(basePenalty.staminaCost * (1 - penaltyReduction))
    const injuryHours = basePenalty.injuryHours ?? 6
    const injuredUntil = new Date(Date.now() + injuryHours * 3_600_000).toISOString()

    penaltyApplied = {
      ...basePenalty,
      staminaCost: finalStaminaCost,
      injuryHours,
    }
    nextGateStatus = {
      ...gateStatus,
      stamina: Math.max(0, gateStatus.stamina - finalStaminaCost),
      injuredUntil,
      recoveryQuestProgress: 0,
      recoveryQuestRequired: 3,
    }
    nextActiveGate = { ...activeGate, status: 'failed' }
  }

  const finalLog: CombatLog = {
    ...combatLog,
    rewards: gateRewards,
    penaltyApplied,
  }

  return {
    finalLog,
    shouldCheckUnlocks,
    state: {
      hunter: nextHunter,
      items: nextItems,
      gateStatus: nextGateStatus,
      activeGate: nextActiveGate,
      activeConsumableEffects: nextConsumables,
      combatLogs: [finalLog, ...s.combatLogs].slice(0, 20),
      messages: s.messages,
      manualBattleSession: undefined,
    },
  }
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      hunter: initialHunter,
      quests: initialQuests,
      items: [],
      titles: [],
      messages: [],
      achievementStats: createInitialAchievementStats(),
      activeRandomQuest: undefined,
      randomQuestHistory: {},
      equipment: {},
      activeConsumableEffects: [],
      gateStatus: createInitialGateStatus(),
      activeGate: undefined,
      combatLogs: [],
      manualBattleSession: undefined,
      ownedShadows: [],
      equippedShadowIds: [],
      shadowExtractHistory: [],
      lastShadowExtractResult: undefined,
      initialized: false,

      setHunterName: (name) => set((s) => ({ hunter: { ...s.hunter, name } })),
      setHunterJob: (job) => set((s) => ({ hunter: { ...s.hunter, job } })),

      recordAppOpen: () => set((s) => {
        const now = todayISO()
        const dateKey = todayKey()
        const stats = s.achievementStats
        
        const firstSeenAt = stats.app.firstSeenAt ?? now
        const activeDateKeys = stats.app.activeDateKeys.includes(dateKey)
          ? stats.app.activeDateKeys
          : [...stats.app.activeDateKeys, dateKey]
        
        return {
          achievementStats: {
            ...stats,
            app: {
              firstSeenAt,
              lastSeenAt: now,
              activeDays: activeDateKeys.length,
              activeDateKeys,
            },
          },
        }
      }),

      allocateFreeStat: (stat) => set((s) => {
        if (s.hunter.freeStatPoints <= 0) return {}
        const newHunter = {
          ...s.hunter,
          freeStatPoints: s.hunter.freeStatPoints - 1,
          stats: { ...s.hunter.stats, [stat]: roundStatValue(s.hunter.stats[stat] + 1) },
        }
        set({
          hunter: newHunter,
          messages: [...s.messages, {
            id: uid(),
            kind: 'info',
            title: `${stat} +1`,
            lines: [`${stat}이(가) 1 상승했다.`],
            createdAt: todayISO(),
          }],
        })
        // Check title unlocks after stat change
        setTimeout(() => get().checkTitleUnlocks(), 0)
        return {}
      }),

      unlockTitle: (titleId) => set((s) => {
        // Already owned
        if (s.hunter.ownedTitleIds.includes(titleId)) return {}
        
        // Find definition
        const def = TITLE_DEFINITIONS.find(t => t.id === titleId)
        if (!def) return {}

        const newOwnedIds = [...s.hunter.ownedTitleIds, titleId]
        const newEquippedId = s.hunter.equippedTitleId ?? titleId // auto-equip first title

        return {
          hunter: {
            ...s.hunter,
            ownedTitleIds: newOwnedIds,
            equippedTitleId: newEquippedId,
          },
          messages: [...s.messages, {
            id: uid(),
            kind: 'title',
            title: '칭호 해금',
            lines: [`새 칭호 [${def.name}]을 획득했습니다.`],
            createdAt: todayISO(),
          }],
        }
      }),

      equipTitle: (titleId) => set((s) => {
        if (!s.hunter.ownedTitleIds.includes(titleId)) return {}
        return {
          hunter: { ...s.hunter, equippedTitleId: titleId },
        }
      }),

      checkTitleUnlocks: () => {
        const s = get()
        const h = s.hunter
        const stats = s.achievementStats
        const unlocks: string[] = []

        // Level-based
        if (h.level >= 5 && !h.ownedTitleIds.includes('first-awakening')) unlocks.push('first-awakening')
        if (h.level >= 25 && !h.ownedTitleIds.includes('hunter')) unlocks.push('hunter')
        if (h.level >= 50 && !h.ownedTitleIds.includes('veteran-hunter')) unlocks.push('veteran-hunter')

        // Stat-based
        if (h.stats.STR >= 30 && !h.ownedTitleIds.includes('trained-one')) unlocks.push('trained-one')
        if (h.stats.STR >= 50 && !h.ownedTitleIds.includes('iron-hunter')) unlocks.push('iron-hunter')
        if (h.stats.STR >= 80 && !h.ownedTitleIds.includes('steel-hunter')) unlocks.push('steel-hunter')
        if (h.stats.INT >= 30 && !h.ownedTitleIds.includes('sage-apprentice')) unlocks.push('sage-apprentice')
        if (h.stats.INT >= 50 && !h.ownedTitleIds.includes('market-eye')) unlocks.push('market-eye')
        if (h.stats.INT >= 80 && !h.ownedTitleIds.includes('analyst')) unlocks.push('analyst')
        if (h.stats.PER >= 50 && !h.ownedTitleIds.includes('unyielding-will')) unlocks.push('unyielding-will')
        if (h.stats.PER >= 80 && !h.ownedTitleIds.includes('steel-mental')) unlocks.push('steel-mental')
        if (h.stats.SEN >= 50 && !h.ownedTitleIds.includes('awakened-one')) unlocks.push('awakened-one')
        if (h.stats.SEN >= 80 && !h.ownedTitleIds.includes('ruler-of-instinct')) unlocks.push('ruler-of-instinct')

        // Collection-based
        const hasEpicOrLegendary = s.items.some(i => i.rarity === 'epic' || i.rarity === 'legendary')
        if (hasEpicOrLegendary && !h.ownedTitleIds.includes('first-treasure')) unlocks.push('first-treasure')
        
        if (s.items.length >= 50 && !h.ownedTitleIds.includes('collector')) unlocks.push('collector')
        
        const hasLegendary = s.items.some(i => i.rarity === 'legendary')
        if (hasLegendary && !h.ownedTitleIds.includes('legend-in-hand')) unlocks.push('legend-in-hand')

        // ── Hidden Titles ──────────────────────────────────────────────────
        // Early wake (7시 전 기상)
        if (stats.special.earlyWakeBefore7CurrentStreak >= 30 && !h.ownedTitleIds.includes('dawn-hunter')) {
          unlocks.push('dawn-hunter')
        }
        if (stats.special.earlyWakeBefore7Count >= 100 && !h.ownedTitleIds.includes('ruler-of-dawn')) {
          unlocks.push('ruler-of-dawn')
        }

        // Restraint (숏폼 제한)
        if (stats.special.noShortsWithin30MinCurrentStreak >= 30 && !h.ownedTitleIds.includes('incarnation-of-restraint')) {
          unlocks.push('incarnation-of-restraint')
        }
        if (stats.special.noShortsWithin30MinCount >= 90 && !h.ownedTitleIds.includes('dopamine-hunter')) {
          unlocks.push('dopamine-hunter')
        }

        // Meditation (명상)
        if (stats.special.meditationCurrentStreak >= 30 && !h.ownedTitleIds.includes('quiet-mind')) {
          unlocks.push('quiet-mind')
        }

        // Finance (시장 마감 점검)
        if (stats.special.marketCheckCount >= 60 && !h.ownedTitleIds.includes('market-observer')) {
          unlocks.push('market-observer')
        }

        // Health (체중 기록)
        if (stats.special.weightRecordCount >= 60 && !h.ownedTitleIds.includes('enemy-of-body-fat')) {
          unlocks.push('enemy-of-body-fat')
        }

        // Burnout (하루 15개 이상 daily 클리어)
        if (stats.special.daily15PlusClearDays >= 1 && !h.ownedTitleIds.includes('near-burnout')) {
          unlocks.push('near-burnout')
        }

        // All-nighter (자정~2시 사이 daily 완료 5회)
        if (stats.special.lateNightCompletionCount >= 5 && !h.ownedTitleIds.includes('all-nighter')) {
          unlocks.push('all-nighter')
        }

        // Meta (앱 사용 100일)
        if (stats.app.activeDays >= 100 && !h.ownedTitleIds.includes('hundred-days-record')) {
          unlocks.push('hundred-days-record')
        }

        // Hidden legendary (National 랭크)
        if (h.rank === 'National' && !h.ownedTitleIds.includes('national-level-hunter')) {
          unlocks.push('national-level-hunter')
        }

        // Hidden legendary (legendary 아이템 5개 보유)
        const legendaryCount = s.items.filter(i => i.rarity === 'legendary').length
        if (legendaryCount >= 5 && !h.ownedTitleIds.includes('systems-favor')) {
          unlocks.push('systems-favor')
        }

        // Hidden legendary (daily streak 100일)
        if (h.streak >= 100 && !h.ownedTitleIds.includes('sleepless-hunter')) {
          unlocks.push('sleepless-hunter')
        }

        // ── Meta Hidden Titles ──────────────────────────────────────────────
        // First login (시스템에 인사)
        if (stats.app.firstSeenAt && !h.ownedTitleIds.includes('greeting-the-system')) {
          unlocks.push('greeting-the-system')
        }

        // ── Additional Hidden Titles (5-5) ──────────────────────────────────
        // Portfolio Manager (CMA 운용 일지 6회)
        if (stats.special.cmaJournalCount >= 6 && !h.ownedTitleIds.includes('portfolio-manager')) {
          unlocks.push('portfolio-manager')
        }

        // Self-Reliant Hunter (빨래 + 청소 + 분리수거 각 10회)
        const laundryCount = stats.dailyCompletions.byQuestId['daily-laundry'] ?? 0
        const cleaningCount = stats.dailyCompletions.byQuestId['daily-cleaning'] ?? 0
        const recycleCount = stats.dailyCompletions.byQuestId['daily-recycle'] ?? 0
        if (laundryCount >= 10 && cleaningCount >= 10 && recycleCount >= 10 && 
            !h.ownedTitleIds.includes('self-reliant-hunter')) {
          unlocks.push('self-reliant-hunter')
        }

        // Guardian of Hygiene (자취 daily 합산 100회)
        const livingDailyIds = ['daily-laundry', 'daily-cleaning', 'daily-recycle']
        const livingTotal = livingDailyIds.reduce(
          (sum, id) => sum + (stats.dailyCompletions.byQuestId[id] ?? 0),
          0
        )
        if (livingTotal >= 100 && !h.ownedTitleIds.includes('guardian-of-hygiene')) {
          unlocks.push('guardian-of-hygiene')
        }

        // Perfectionist (7일 연속 모든 daily 100% 완료)
        let perfectWeekCount = 0
        for (let i = 0; i < 7; i++) {
          const dateKey = getDateKey(addDays(new Date(), -i))
          const dayRecord = stats.dailyHistory[dateKey]
          if (dayRecord && dayRecord.completedAllAvailableDailies && dayRecord.totalDailyAvailableCount > 0) {
            perfectWeekCount++
          } else {
            break // Streak broken
          }
        }
        if (perfectWeekCount >= 7 && !h.ownedTitleIds.includes('perfectionist')) {
          unlocks.push('perfectionist')
        }

        // Unlock all titles first
        unlocks.forEach(id => get().unlockTitle(id))

        // Check title collection milestones AFTER unlocking
        // This ensures greeting-the-system and other titles are counted
        const updatedHunter = get().hunter
        const ownedCount = updatedHunter.ownedTitleIds.length
        
        if (ownedCount >= 10 && !updatedHunter.ownedTitleIds.includes('title-collector')) {
          get().unlockTitle('title-collector')
        }
        if (ownedCount >= 25 && !updatedHunter.ownedTitleIds.includes('hall-of-hunters')) {
          get().unlockTitle('hall-of-hunters')
        }
      },

      // ── Job System ─────────────────────────────────────────────────────

      unlockJob: (jobId) => set((s) => {
        // Already unlocked
        if (s.hunter.unlockedJobIds.includes(jobId)) return {}
        
        // Find definition
        const def = JOB_DEFINITIONS.find(j => j.id === jobId)
        if (!def) return {}

        const newUnlockedIds = [...s.hunter.unlockedJobIds, jobId]
        
        // Auto-equip logic:
        // - If currently unawakened: auto-equip
        // - If tier 2 job and currently equipped the corresponding tier 1 job: auto-equip (evolution)
        const shouldAutoEquip = s.hunter.jobId === 'unawakened' || 
          (def.tier === 2 && JOB_DEFINITIONS.find(j => j.id === s.hunter.jobId)?.nextJobId === jobId)
        
        const newJobId = shouldAutoEquip ? jobId : s.hunter.jobId
        const newJobName = shouldAutoEquip ? def.name : s.hunter.job

        // Message varies by tier
        const messageTitle = def.tier === 2 ? '── SYSTEM ── 2차 각성 발생' : '── SYSTEM ── 각성 발생'
        const messageLines = def.tier === 2 && shouldAutoEquip
          ? [`[${s.hunter.job}]이(가) [${def.name}]로 진화했습니다.`]
          : [`새 직업 [${def.name}]을 획득했습니다.`]

        return {
          hunter: {
            ...s.hunter,
            unlockedJobIds: newUnlockedIds,
            jobId: newJobId,
            job: newJobName,
          },
          messages: [...s.messages, {
            id: uid(),
            kind: 'info',
            title: messageTitle,
            lines: messageLines,
            createdAt: todayISO(),
          }],
        }
      }),

      equipJob: (jobId) => set((s) => {
        // Not unlocked
        if (!s.hunter.unlockedJobIds.includes(jobId)) return {}
        
        // Find definition
        const def = JOB_DEFINITIONS.find(j => j.id === jobId)
        if (!def) return {}

        return {
          hunter: {
            ...s.hunter,
            jobId,
            job: def.name,
          },
        }
      }),

      checkJobAwakening: () => {
        const s = get()
        const h = s.hunter
        const stats = s.achievementStats
        const unlocks: JobId[] = []

        // ── 1st Tier Jobs ──────────────────────────────────────────────────

        // Golden Eye Diviner: market check 30+ OR finance/career 50+
        if (!h.unlockedJobIds.includes('golden-eye-diviner')) {
          const marketCheck = stats.special.marketCheckCount >= 30
          const financeCareer = (stats.questCompletions.byCategory.finance ?? 0) + 
                                (stats.questCompletions.byCategory.career ?? 0) >= 50
          if (marketCheck || financeCareer) {
            unlocks.push('golden-eye-diviner')
          }
        }

        // Grimoire Decoder: study/career 70+
        if (!h.unlockedJobIds.includes('grimoire-decoder')) {
          const studyCareer = (stats.questCompletions.byCategory.study ?? 0) + 
                              (stats.questCompletions.byCategory.career ?? 0) >= 70
          if (studyCareer) {
            unlocks.push('grimoire-decoder')
          }
        }

        // Iron Squire: workout/health 70+ OR dungeon clears 5+
        if (!h.unlockedJobIds.includes('iron-squire')) {
          const workoutHealth = (stats.questCompletions.byCategory.workout ?? 0) + 
                                (stats.questCompletions.byCategory.health ?? 0) >= 70
          const dungeonClears = stats.dungeonClears.total >= 5
          if (workoutHealth || dungeonClears) {
            unlocks.push('iron-squire')
          }
        }

        // Silent Monk: habit/mind 70+ OR special counters 30+
        if (!h.unlockedJobIds.includes('silent-monk')) {
          const habitMind = (stats.questCompletions.byCategory.habit ?? 0) + 
                            (stats.questCompletions.byCategory.mind ?? 0) >= 70
          const specialCounters = stats.special.noShortsWithin30MinCount >= 30 || 
                                  stats.special.meditationCount >= 30
          if (habitMind || specialCounters) {
            unlocks.push('silent-monk')
          }
        }

        // Nameless Awakened: 4+ categories with 20+ completions each
        if (!h.unlockedJobIds.includes('nameless-awakened')) {
          const categoriesAbove20 = Object.values(stats.questCompletions.byCategory).filter(count => count >= 20).length
          if (categoriesAbove20 >= 4) {
            unlocks.push('nameless-awakened')
          }
        }

        // ── 2nd Tier Jobs ──────────────────────────────────────────────────

        // Golden Oracle: golden-eye-diviner owned + (market check 100+ OR finance/career 150+)
        if (!h.unlockedJobIds.includes('golden-oracle') && h.unlockedJobIds.includes('golden-eye-diviner')) {
          const marketCheck = stats.special.marketCheckCount >= 100
          const financeCareer = (stats.questCompletions.byCategory.finance ?? 0) + 
                                (stats.questCompletions.byCategory.career ?? 0) >= 150
          if (marketCheck || financeCareer) {
            unlocks.push('golden-oracle')
          }
        }

        // Abyss Archivist: grimoire-decoder owned + study/career 180+
        if (!h.unlockedJobIds.includes('abyss-archivist') && h.unlockedJobIds.includes('grimoire-decoder')) {
          const studyCareer = (stats.questCompletions.byCategory.study ?? 0) + 
                              (stats.questCompletions.byCategory.career ?? 0) >= 180
          if (studyCareer) {
            unlocks.push('abyss-archivist')
          }
        }

        // Steelheart Fighter: iron-squire owned + (workout/health 180+ OR dungeon clears 20+)
        if (!h.unlockedJobIds.includes('steelheart-fighter') && h.unlockedJobIds.includes('iron-squire')) {
          const workoutHealth = (stats.questCompletions.byCategory.workout ?? 0) + 
                                (stats.questCompletions.byCategory.health ?? 0) >= 180
          const dungeonClears = stats.dungeonClears.total >= 20
          if (workoutHealth || dungeonClears) {
            unlocks.push('steelheart-fighter')
          }
        }

        // Chrono Judge: silent-monk owned + (habit/mind 180+ OR special counters 90+)
        if (!h.unlockedJobIds.includes('chrono-judge') && h.unlockedJobIds.includes('silent-monk')) {
          const habitMind = (stats.questCompletions.byCategory.habit ?? 0) + 
                            (stats.questCompletions.byCategory.mind ?? 0) >= 180
          const specialCounters = stats.special.noShortsWithin30MinCount >= 90 || 
                                  stats.special.meditationCount >= 90
          if (habitMind || specialCounters) {
            unlocks.push('chrono-judge')
          }
        }

        // Fate Harmonizer: nameless-awakened owned + 5+ categories with 50+ completions each
        if (!h.unlockedJobIds.includes('fate-harmonizer') && h.unlockedJobIds.includes('nameless-awakened')) {
          const categoriesAbove50 = Object.values(stats.questCompletions.byCategory).filter(count => count >= 50).length
          if (categoriesAbove50 >= 5) {
            unlocks.push('fate-harmonizer')
          }
        }

        // Unlock all jobs
        unlocks.forEach(id => get().unlockJob(id))
      },

      // ── Random Quest System ────────────────────────────────────────

      rollRandomQuestForToday: () => {
        const s = get()
        const dateKey = todayKey()
        
        // Already rolled today
        if (s.randomQuestHistory[dateKey]) return
        
        // Already have an active quest
        if (s.activeRandomQuest && !s.activeRandomQuest.completed) return
        
        // 30% chance to generate
        const shouldGenerate = Math.random() < 0.3
        
        if (!shouldGenerate) {
          // Record that we rolled but didn't generate
          set({
            randomQuestHistory: {
              ...s.randomQuestHistory,
              [dateKey]: { generatedQuestId: undefined, generatedCategory: undefined },
            },
          })
          return
        }
        
        // Dynamic weight-based selection
        const recentHistory = getRecentRandomQuestHistory(s.randomQuestHistory, 7)
        const recentCategoryCounts = getRecentRandomQuestCategoryCounts(recentHistory)
        const todayDailyCounts = getTodayDailyCategoryCounts(s.quests)
        
        const weightedPool = RANDOM_QUEST_POOL.map(template => ({
          template,
          dynamicWeight: calculateDynamicRandomQuestWeight(
            template,
            recentHistory,
            recentCategoryCounts,
            todayDailyCounts
          ),
        }))
        
        const selected = pickWeightedRandomQuest(weightedPool)
        
        // Create active quest with expiration at end of day
        const now = new Date()
        const endOfDay = new Date(now)
        endOfDay.setHours(23, 59, 59, 999)
        
        const activeQuest: ActiveRandomQuest = {
          ...selected,
          instanceId: uid(),
          generatedAt: todayISO(),
          expiresAt: endOfDay.toISOString(),
          completed: false,
        }
        
        set({
          activeRandomQuest: activeQuest,
          randomQuestHistory: {
            ...s.randomQuestHistory,
            [dateKey]: { 
              generatedQuestId: selected.id,
              generatedCategory: selected.category,
            },
          },
          messages: [...s.messages, {
            id: uid(),
            kind: 'info',
            title: '── SYSTEM ── 긴급 의뢰 발생',
            lines: [`새로운 긴급 의뢰 [${selected.title}]가 도착했습니다.`],
            createdAt: todayISO(),
          }],
        })
      },

      completeRandomQuest: () => {
        const s = get()
        const rq = s.activeRandomQuest
        
        if (!rq) return
        if (rq.completed) return
        
        // Check expiration
        const now = new Date()
        const expiresAt = new Date(rq.expiresAt)
        if (now > expiresAt) return
        
        // Apply XP with job/stat/equipment/consumable bonuses (same as regular quests)
        const equippedItems = getEquippedItems(s.items, s.equipment)
        const consumableStatBonuses = getActiveConsumableStatBonuses(s.activeConsumableEffects)
        const baseXp = getBalancedRandomQuestXp(rq.xp)
        const statMultiplier = getXpMultiplierWithEquipment(s.hunter, rq.category, equippedItems, consumableStatBonuses)
        const currentJob = JOB_DEFINITIONS.find(j => j.id === s.hunter.jobId)
        const jobCategoryBonus = currentJob?.effects.xpBonusByCategory?.[rq.category] ?? 0
        const equipmentXpBonus = getEquipmentXpBonus(equippedItems, rq.category)
        const consumableXpBonus = getActiveConsumableXpBonus(s.activeConsumableEffects, rq.category)
        const titleXpBonus = getTitleXpMultiplier(s.hunter, rq.category) - 1
        // Additive XP bonus: job + equipment + consumable + equipped title
        const additiveXpBonus = jobCategoryBonus + equipmentXpBonus + consumableXpBonus + titleXpBonus
        const xp = Math.round(baseXp * statMultiplier * (1 + additiveXpBonus))
        
        // Bump category progress
        const bumpedProgress = {
          ...s.hunter.categoryProgress,
          [rq.category]: (s.hunter.categoryProgress[rq.category] ?? 0) + 1,
        }
        const hunterIn = { ...s.hunter, categoryProgress: bumpedProgress }
        
        const { hunter: newHunter, outcome } = applyXp(hunterIn, xp, rq.category)
        
        // Item drop (lower chance than regular quests) + equipment bonuses + consumable bonuses
        const drops: Item[] = []
        const baseDropChance = getBalancedRandomQuestDropChance(rq.difficulty)
        const statDropBonus = getDropChanceBonusWithEquipment(s.hunter, rq.category, equippedItems, consumableStatBonuses)
        const equipmentDropBonus = getEquipmentDropBonus(equippedItems)
        const consumableDropBonus = getActiveConsumableDropBonus(s.activeConsumableEffects)
        const finalDropChance = Math.min(0.95, baseDropChance + statDropBonus + equipmentDropBonus + consumableDropBonus)
        const consumableRarityBonus = getActiveConsumableRarityBonus(s.activeConsumableEffects)
        const titleRarityBonus = getTitleRarityBonus(s.hunter)
        if (Math.random() < finalDropChance) drops.push(randomItem(s.hunter, equippedItems, consumableRarityBonus, titleRarityBonus, 'random'))
        
        // Consume next_quest consumable effects
        const updatedConsumableEffects = consumeNextQuestEffects(s.activeConsumableEffects, rq.category)
        
        // Messages
        const newMessages: SystemMessage[] = []
        newMessages.push({
          id: uid(),
          kind: 'quest',
          title: '긴급 의뢰 완료',
          lines: [
            `[${rq.title}] 완료.`,
            `+${xp} XP 획득${xp !== baseXp ? ` (기본 ${baseXp})` : ''}`,
          ],
          createdAt: todayISO(),
        })
        
        if (outcome.leveledUp) {
          newMessages.push({
            id: uid(),
            kind: 'levelup',
            title: 'LEVEL UP',
            lines: [
              `Lv.${s.hunter.level} → Lv.${outcome.newLevel}`,
              `자동 분배 — ${formatStatGains(outcome.autoStatGains)}`,
              `자유 배분권 +${outcome.freeStatPointsGained}`,
            ],
            createdAt: todayISO(),
          })
        }
        
        if (outcome.rankChanged) {
          newMessages.push({
            id: uid(),
            kind: 'rank',
            title: '랭크 상승',
            lines: [
              `${s.hunter.rank}-Rank → ${outcome.newRank}-Rank`,
              '시스템이 당신을 다시 평가합니다.',
            ],
            createdAt: todayISO(),
          })
        }
        
        for (const drop of drops) {
          newMessages.push({
            id: uid(),
            kind: 'item',
            title: '아이템 획득',
            lines: [`${drop.icon}  ${drop.name}`, drop.description],
            createdAt: todayISO(),
          })
        }
        
        const dateKey = todayKey()
        set({
          hunter: newHunter,
          activeRandomQuest: { ...rq, completed: true },
          randomQuestHistory: {
            ...s.randomQuestHistory,
            [dateKey]: {
              ...s.randomQuestHistory[dateKey],
              completedQuestId: rq.id,
            },
          },
          items: [...s.items, ...drops],
          messages: [...s.messages, ...newMessages],
          activeConsumableEffects: updatedConsumableEffects,
          gateStatus: recoverGateAfterQuestCompletion(s.gateStatus),
        })
        
        // Check unlocks after completion
        setTimeout(() => {
          get().grantAchievementNamedShadows()
          get().checkTitleUnlocks()
          get().checkJobAwakening()
          get().rollGateSpawn('random_completion')
        }, 0)
      },

      skipRandomQuest: () => {
        const s = get()
        if (!s.activeRandomQuest) return
        
        const dateKey = todayKey()
        set({
          activeRandomQuest: undefined,
          randomQuestHistory: {
            ...s.randomQuestHistory,
            [dateKey]: {
              ...s.randomQuestHistory[dateKey],
              skipped: true,
            },
          },
        })
      },

      clearExpiredRandomQuest: () => {
        const s = get()
        const rq = s.activeRandomQuest
        
        if (!rq) return
        
        const now = new Date()
        const expiresAt = new Date(rq.expiresAt)
        
        if (now > expiresAt) {
          set({ activeRandomQuest: undefined })
        }
      },

      // ── Equipment System ───────────────────────────────────────────

      equipItem: (itemId) => {
        const s = get()
        const item = s.items.find(i => i.id === itemId)
        
        if (!item) return
        if (item.equippable !== true) return
        if (!item.slot) return
        
        // Check if this item is already equipped in any slot
        const alreadyEquippedSlot = Object.entries(s.equipment).find(([_, id]) => id === itemId)?.[0] as EquipmentSlot | undefined
        if (alreadyEquippedSlot) return // Already equipped, do nothing
        
        // Equip to the slot (replaces existing item if any)
        const newEquipment = { ...s.equipment, [item.slot]: itemId }
        
        set({
          equipment: newEquipment,
          messages: [...s.messages, {
            id: uid(),
            kind: 'info',
            title: '장비 장착',
            lines: [`[${item.name}]을(를) ${EQUIPMENT_SLOT_LABEL[item.slot]} 슬롯에 장착했습니다.`],
            createdAt: todayISO(),
          }],
        })
      },

      unequipItem: (slot) => {
        const s = get()
        const equippedItemId = s.equipment[slot]
        
        if (!equippedItemId) return
        
        const item = s.items.find(i => i.id === equippedItemId)
        const newEquipment = { ...s.equipment }
        delete newEquipment[slot]
        
        set({
          equipment: newEquipment,
          messages: [...s.messages, {
            id: uid(),
            kind: 'info',
            title: '장비 해제',
            lines: [`[${item?.name || '알 수 없는 아이템'}]을(를) 해제했습니다.`],
            createdAt: todayISO(),
          }],
        })
      },

      enhanceItem: (itemId) => {
        const s = get()
        const target = s.items.find(i => i.id === itemId)
        if (!target) return

        const equippedItemIds = new Set(Object.values(s.equipment).filter((id): id is string => Boolean(id)))
        if (!canEnhanceItem(target, s.items, equippedItemIds)) return

        const material = getEnhanceMaterialCandidates(target, s.items, equippedItemIds)[0]
        if (!material) return

        const nextLevel = Math.min(MAX_ITEM_ENHANCEMENT_LEVEL, getEnhancementLevel(target) + 1)
        const nextItems = s.items
          .filter(item => item.id !== material.id)
          .map(item => item.id === target.id ? { ...item, enhancementLevel: nextLevel } : item)

        set({
          items: nextItems,
          messages: [...s.messages, {
            id: uid(),
            kind: 'item',
            title: '장비 강화',
            lines: [
              `[${target.name}] 강화 성공`,
              `${target.name} +${nextLevel}`,
              `재료로 [${material.name}] 1개를 소모했습니다.`,
            ],
            createdAt: todayISO(),
          }],
        })
      },

      // ── Consumable System ──────────────────────────────────────────

      useConsumable: (itemId) => {
        const s = get()
        const item = s.items.find(i => i.id === itemId)
        
        // Safety checks
        if (!item) return
        if (item.consumable !== true) return
        if (!item.consumableEffects || item.consumableEffects.length === 0) return
        
        // Check if item is equipped (equipped items cannot be consumed)
        const isEquipped = Object.values(s.equipment).includes(itemId)
        if (isEquipped) return
        
        // Separate instant_xp from other effects
        const instantXpEffects = item.consumableEffects.filter(e => e.type === 'instant_xp')
        const activeEffects: ActiveConsumableEffect[] = item.consumableEffects
          .filter(e => e.type !== 'instant_xp')
          .map((effect, index) => ({
            ...effect,
            id: `${item.id}-${Date.now()}-${index}`,
            sourceItemId: item.id,
            sourceItemName: item.name,
            activatedAt: todayISO(),
            consumed: false,
          }))
        
        // Apply instant XP
        let hunterAfterXp = s.hunter
        let xpMessages: string[] = []
        let levelUpMessages: SystemMessage[] = []
        
        if (instantXpEffects.length > 0) {
          const totalInstantXp = instantXpEffects.reduce((sum, e) => sum + e.value, 0)
          const { hunter: newHunter, outcome } = applyXp(s.hunter, totalInstantXp, 'career') // Use 'career' as default category
          hunterAfterXp = newHunter
          xpMessages.push(`XP +${totalInstantXp}`)
          
          if (outcome.leveledUp) {
            levelUpMessages.push({
              id: uid(),
              kind: 'levelup',
              title: `── LEVEL UP ── Lv.${outcome.newLevel}`,
              lines: [
                `레벨이 ${outcome.newLevel}로 상승했습니다!`,
                `자동 배분: ${formatStatGains(outcome.autoStatGains)}`,
                `자유 배분권 +${outcome.freeStatPointsGained}`,
              ],
              createdAt: todayISO(),
            })
            
            if (outcome.rankChanged) {
              levelUpMessages.push({
                id: uid(),
                kind: 'rank',
                title: `── RANK UP ── ${RANK_LABEL[outcome.newRank]}`,
                lines: [`랭크가 ${RANK_LABEL[outcome.newRank]}로 상승했습니다!`],
                createdAt: todayISO(),
              })
            }
          }
        }
        
        // Remove the item from inventory (only this specific item.id)
        const newItems = s.items.filter(i => i.id !== itemId)
        
        const usageMessage: SystemMessage = {
          id: uid(),
          kind: 'info',
          title: '소모품 사용',
          lines: [`[${item.name}]을(를) 사용했습니다.`, ...xpMessages],
          createdAt: todayISO(),
        }
        
        set({
          hunter: hunterAfterXp,
          items: newItems,
          activeConsumableEffects: [...s.activeConsumableEffects, ...activeEffects],
          messages: [...s.messages, usageMessage, ...levelUpMessages],
        })
        
        // Check title and job unlocks after XP gain
        if (instantXpEffects.length > 0) {
          setTimeout(() => {
            get().checkTitleUnlocks()
            get().checkJobAwakening()
          }, 0)
        }
      },

      clearConsumedConsumableEffects: () => set((s) => ({
        activeConsumableEffects: s.activeConsumableEffects.filter(e => !e.consumed),
      })),

      clearExpiredConsumableEffects: () => set((s) => {
        const today = getDateKey()
        const activeEffects = s.activeConsumableEffects.filter(effect => {
          // Keep next_quest and next_gate effects until consumed
          if (effect.duration === 'next_quest' || effect.duration === 'next_gate') {
            return true
          }
          // Remove today effects if activated on a different day
          if (effect.duration === 'today') {
            const activatedDate = getDateKey(new Date(effect.activatedAt))
            return activatedDate === today
          }
          // Keep effects without duration
          return true
        })
        
        return { activeConsumableEffects: activeEffects }
      }),

      setActiveGate: (gate) => set({ activeGate: gate }),

      clearExpiredGate: () => set((s) => {
        const activeGate = s.activeGate
        if (
          activeGate &&
          activeGate.status === 'active' &&
          new Date(activeGate.expiresAt).getTime() < Date.now()
        ) {
          const gate = GATE_DEFINITIONS.find(g => g.id === activeGate.gateId)
          return {
            activeGate: {
              ...activeGate,
              status: 'expired',
            },
            messages: [...s.messages, {
              id: uid(),
              kind: 'info',
              title: '게이트 만료',
              lines: [`[${gate?.name ?? '알 수 없는 게이트'}]의 균열이 닫혔습니다.`],
              createdAt: todayISO(),
            }],
          }
        }
        return {}
      }),

      rollGateSpawn: (source) => {
        const s = get()
        if (s.activeGate && s.activeGate.status === 'active') return

        const today = getDateKey()
        if (source === 'daily_open') {
          if (s.gateStatus.lastDailyGateRollDate === today) return
          set({
            gateStatus: {
              ...s.gateStatus,
              lastDailyGateRollDate: today,
            },
          })
        }

        const chance =
          source === 'daily_open' ? 0.10 :
          source === 'daily_completion' ? 0.05 :
          source === 'random_completion' ? 0.07 :
          source === 'dungeon_clear' ? 0.30 :
          source === 'hard_dungeon_clear' ? 0.35 :
          0.60
        if (Math.random() >= chance) return

        const eGates = GATE_DEFINITIONS.filter(g => g.rank === 'E')
        const dGates = GATE_DEFINITIONS.filter(g => g.rank === 'D')
        const cGates = GATE_DEFINITIONS.filter(g => g.rank === 'C')
        const candidates =
          source === 'daily_open' || source === 'daily_completion'
            ? [...eGates, ...eGates, ...eGates]
            : source === 'random_completion'
              ? [...eGates, ...eGates, ...dGates]
              : source === 'dungeon_clear'
                ? [...eGates, ...dGates, ...dGates]
                : source === 'hard_dungeon_clear'
                  ? [...dGates, ...dGates, ...cGates]
                  : [...dGates, ...cGates, ...cGates]
        const fallback = GATE_DEFINITIONS.filter(g => g.rank === 'E')
        const pool = candidates.length > 0 ? candidates : fallback.length > 0 ? fallback : GATE_DEFINITIONS
        const selected = pool[Math.floor(Math.random() * pool.length)]
        if (!selected) return

        const activeSource =
          source === 'dungeon_clear' || source === 'hard_dungeon_clear'
            ? 'dungeon_clear'
            : source === 'main_completion'
              ? 'event'
              : 'random'
        get().spawnGate(selected.id, activeSource)
      },

      spawnGate: (gateId, source) => {
        const s = get()
        if (s.activeGate && s.activeGate.status === 'active') return

        const gate = GATE_DEFINITIONS.find(g => g.id === gateId)
        if (!gate) return

        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setHours(expiresAt.getHours() + gate.expiresInHours)

        set({
          activeGate: {
            instanceId: `gate-${gate.id}-${Date.now()}`,
            gateId: gate.id,
            spawnedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            status: 'active',
            source,
          },
          messages: [...s.messages, {
            id: uid(),
            kind: 'info',
            title: '게이트 출현',
            lines: [`[${gate.name}]이(가) 열렸습니다.`],
            createdAt: todayISO(),
          }],
        })
      },

      recoverGateStamina: () => set((s) => {
        const now = new Date()
        const status = s.gateStatus
        const lastIso = status.lastStaminaRecoveredAt
        if (!lastIso) {
          return {
            gateStatus: {
              ...status,
              lastStaminaRecoveredAt: now.toISOString(),
            },
          }
        }

        if (status.stamina >= status.maxStamina) {
          return {
            gateStatus: {
              ...status,
              stamina: status.maxStamina,
              lastStaminaRecoveredAt: now.toISOString(),
            },
          }
        }

        const lastMs = new Date(lastIso).getTime()
        const elapsedHours = Math.floor((now.getTime() - lastMs) / 3_600_000)
        if (elapsedHours <= 0) return {}

        const recovered = elapsedHours * 10
        const nextLast = new Date(lastMs + elapsedHours * 3_600_000).toISOString()
        return {
          gateStatus: {
            ...status,
            stamina: Math.min(status.maxStamina, status.stamina + recovered),
            lastStaminaRecoveredAt: nextLast,
          },
        }
      }),

      clearGateInjuryIfExpired: () => set((s) => {
        if (!s.gateStatus.injuredUntil) return {}
        const nextGateStatus = clearExpiredGateInjury(s.gateStatus)
        if (nextGateStatus.injuredUntil) return {}
        return {
          gateStatus: nextGateStatus,
          messages: [...s.messages, {
            id: uid(),
            kind: 'info',
            title: '부상 회복',
            lines: ['게이트 부상 상태가 회복되었습니다.'],
            createdAt: todayISO(),
          }],
        }
      }),

      recoverGateInjuryByQuest: () => set((s) => {
        if (!s.gateStatus.injuredUntil) return {}
        const nextGateStatus = recoverGateInjuryByQuestCompletion(s.gateStatus)
        const recovered = s.gateStatus.injuredUntil && !nextGateStatus.injuredUntil
        return {
          gateStatus: nextGateStatus,
          messages: recovered
            ? [...s.messages, {
              id: uid(),
              kind: 'info',
              title: '부상 회복',
              lines: ['퀘스트 수행으로 게이트 부상 상태가 회복되었습니다.'],
              createdAt: todayISO(),
            }]
            : s.messages,
        }
      }),

      addCombatLog: (log) => set((s) => ({
        combatLogs: [log, ...s.combatLogs].slice(0, 20),
      })),

      clearCombatLogs: () => set({ combatLogs: [] }),

      startGateBattle: () => {
        const s = get()
        const activeGate = s.activeGate
        if (!activeGate || activeGate.status !== 'active') return

        const gate = GATE_DEFINITIONS.find(g => g.id === activeGate.gateId)
        if (!gate) return

        const gateStatus = clearExpiredGateInjury(s.gateStatus)
        const stillInjured = Boolean(gateStatus.injuredUntil && new Date(gateStatus.injuredUntil).getTime() > Date.now())
        if (gateStatus.stamina < GATE_ENTRY_COST) {
          set({
            gateStatus,
            messages: [...s.messages, {
              id: uid(),
              kind: 'info',
              title: '게이트 입장 불가',
              lines: ['스태미나가 부족합니다.'],
              createdAt: todayISO(),
            }],
          })
          return
        }
        if (stillInjured) {
          set({
            gateStatus,
            messages: [...s.messages, {
              id: uid(),
              kind: 'info',
              title: '게이트 입장 불가',
              lines: ['부상 회복이 필요합니다.'],
              createdAt: todayISO(),
            }],
          })
          return
        }

        const monsters = gate.monsterIds
          .map(id => MONSTER_DEFINITIONS.find(m => m.id === id))
          .filter((monster): monster is MonsterDefinition => Boolean(monster))
        if (monsters.length === 0) return

        const equippedItems = getEquippedItems(s.items, s.equipment)
        const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
        const shadowStatBonuses = getEquippedShadowStatBonuses(equippedShadows)
        const combatStatsWithShadows = { ...s.hunter.stats }
        for (const [stat, value] of Object.entries(shadowStatBonuses)) {
          combatStatsWithShadows[stat as StatKey] = roundStatValue(combatStatsWithShadows[stat as StatKey] + (value ?? 0))
        }
        const playerSkills = getPlayerCombatSkills({
          jobId: s.hunter.jobId,
          equippedItems,
          allSkills: SKILL_DEFINITIONS,
        })
        const playerStats = calculatePlayerCombatStats({
          level: s.hunter.level,
          stats: combatStatsWithShadows,
          equippedItems,
          activeConsumableEffects: s.activeConsumableEffects,
          jobId: s.hunter.jobId,
          skills: playerSkills,
        })

        const monsterSkillIds = new Set(monsters.flatMap(monster => monster.skillIds))
        const monsterSkills = SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && monsterSkillIds.has(skill.id))
        const skills = [...playerSkills, ...monsterSkills]
        const gateSuccessBonus = getActiveGateSuccessBonus(s.activeConsumableEffects)
        const initialActiveEffects = createGateSuccessCombatEffects(gateSuccessBonus, 'player')

        const combatLog = simulateGateWaveBattle({
          playerName: s.hunter.name || '헌터',
          playerStats,
          monsters,
          skills,
          equippedShadows,
          gateInstanceId: activeGate.instanceId,
          initialActiveEffects,
        })

        const nextConsumables = consumeNextGateConsumables(s.activeConsumableEffects)
        const rewardTable = GATE_REWARD_TABLES.find(r => r.id === gate.rewardTableId)
        const penalty = GATE_PENALTIES.find(p => p.id === gate.failPenaltyId)
        let nextHunter = s.hunter
        let nextItems = s.items
        let nextGateStatus = gateStatus
        let nextActiveGate = activeGate
        let gateRewards: GateReward[] = []
        let penaltyApplied: GatePenalty | undefined
        const newMessages: SystemMessage[] = []

        if (combatLog.result === 'victory') {
          nextGateStatus = {
            ...gateStatus,
            stamina: Math.max(0, gateStatus.stamina - GATE_ENTRY_COST),
          }
          nextActiveGate = { ...activeGate, status: 'cleared' }

          let leveledUpOutcome: ReturnType<typeof applyXp>['outcome'] | undefined
          if (rewardTable) {
            const shadowXpBonus = getEquippedShadowCategoryXpBonus(equippedShadows, 'challenge')
            const xpReward = Math.round(rewardTable.xp * getTitleXpMultiplier(s.hunter, 'challenge') * (1 + shadowXpBonus))
            const xpResult = applyXp(s.hunter, xpReward, 'challenge')
            nextHunter = xpResult.hunter
            leveledUpOutcome = xpResult.outcome
            gateRewards.push({ type: 'xp', amount: xpReward })

            const titleDropBonus = getTitleDropBonus(s.hunter)
            const titleRarityBonus = getTitleRarityBonus(s.hunter)
            const finalDropChance = Math.min(0.95, rewardTable.itemDropChance + titleDropBonus + getEquippedShadowDropBonus(equippedShadows))
            if (Math.random() < finalDropChance) {
              const item = randomGateRewardItem(rewardTable, titleRarityBonus)
              if (item) {
                nextItems = [...nextItems, item]
                gateRewards.push({
                  type: 'item',
                  itemId: item.id,
                  itemName: item.name,
                  rarity: item.rarity,
                })
              }
            }

            newMessages.push({
              id: uid(),
              kind: 'quest',
              title: '게이트 클리어',
              lines: [
                `[${gate.name}]을(를) 클리어했습니다.`,
                `XP +${xpReward}`,
                ...gateRewards
                  .filter(reward => reward.type === 'item')
                  .map(reward => `전리품: [${reward.itemName}]`),
              ],
              createdAt: todayISO(),
            })
          } else {
            newMessages.push({
              id: uid(),
              kind: 'quest',
              title: '게이트 클리어',
              lines: [`[${gate.name}]을(를) 클리어했습니다.`],
              createdAt: todayISO(),
            })
          }

          if (leveledUpOutcome?.leveledUp) {
            newMessages.push({
              id: uid(),
              kind: 'levelup',
              title: 'LEVEL UP',
              lines: [
                `Lv.${s.hunter.level} → Lv.${leveledUpOutcome.newLevel}`,
                `자동 분배 — ${formatStatGains(leveledUpOutcome.autoStatGains)}`,
                `자유 배분권 +${leveledUpOutcome.freeStatPointsGained}`,
              ],
              createdAt: todayISO(),
            })
          }
          if (leveledUpOutcome?.rankChanged) {
            newMessages.push({
              id: uid(),
              kind: 'rank',
              title: '랭크 상승',
              lines: [`${s.hunter.rank} → ${leveledUpOutcome.newRank}`, '시스템이 당신을 다시 평가합니다.'],
              createdAt: todayISO(),
            })
          }
        } else if (combatLog.result === 'defeat') {
          const basePenalty = penalty ?? {
            id: 'penalty-gate-basic',
            name: '기본 게이트 패널티',
            staminaCost: 50,
            injuryHours: 6,
          }
          const penaltyReduction = getActiveGatePenaltyReduction(s.activeConsumableEffects)
          const finalStaminaCost = Math.round(basePenalty.staminaCost * (1 - penaltyReduction))
          const injuryHours = basePenalty.injuryHours ?? 6
          const injuredUntil = new Date(Date.now() + injuryHours * 3_600_000).toISOString()

          penaltyApplied = {
            ...basePenalty,
            staminaCost: finalStaminaCost,
            injuryHours,
          }
          nextGateStatus = {
            ...gateStatus,
            stamina: Math.max(0, gateStatus.stamina - finalStaminaCost),
            injuredUntil,
            recoveryQuestProgress: 0,
            recoveryQuestRequired: 3,
          }
          nextActiveGate = { ...activeGate, status: 'failed' }
          newMessages.push({
            id: uid(),
            kind: 'info',
            title: '게이트 공략 실패',
            lines: [
              `[${gate.name}] 공략에 실패했습니다.`,
              `스태미나 -${finalStaminaCost}`,
              '부상을 입었습니다. 6시간 경과 또는 퀘스트 3개 완료 시 회복됩니다.',
            ],
            createdAt: todayISO(),
          })
        } else {
          newMessages.push({
            id: uid(),
            kind: 'info',
            title: '게이트 공략 보류',
            lines: [
              '시간초과로 게이트를 클리어하지 못했습니다.',
              '세팅을 바꾼 뒤 다시 도전할 수 있습니다.',
            ],
            createdAt: todayISO(),
          })
        }

        const finalLog: CombatLog = {
          ...combatLog,
          rewards: gateRewards,
          penaltyApplied,
        }

        set({
          hunter: nextHunter,
          items: nextItems,
          gateStatus: nextGateStatus,
          activeGate: nextActiveGate,
          activeConsumableEffects: nextConsumables,
          combatLogs: [finalLog, ...s.combatLogs].slice(0, 20),
          // Gate battle outcome is revealed in GatePanel one log line at a time.
          // Pushing result modals here would spoil the combat reveal immediately.
          messages: s.messages,
        })

        if (combatLog.result === 'victory') {
          setTimeout(() => {
            get().checkTitleUnlocks()
            get().checkJobAwakening()
          }, 0)
        }
      },

      startManualGateBattle: (gateId) => {
        const s = get()
        const activeGate = s.activeGate
        if (!activeGate || activeGate.status !== 'active') return
        if (gateId && activeGate.gateId !== gateId) return

        const gate = GATE_DEFINITIONS.find(g => g.id === activeGate.gateId)
        if (!gate) return

        const gateStatus = clearExpiredGateInjury(s.gateStatus)
        const stillInjured = Boolean(gateStatus.injuredUntil && new Date(gateStatus.injuredUntil).getTime() > Date.now())
        if (gateStatus.stamina < GATE_ENTRY_COST) {
          set({
            gateStatus,
            messages: [...s.messages, {
              id: uid(),
              kind: 'info',
              title: '게이트 입장 불가',
              lines: ['스태미나가 부족합니다.'],
              createdAt: todayISO(),
            }],
          })
          return
        }
        if (stillInjured) {
          set({
            gateStatus,
            messages: [...s.messages, {
              id: uid(),
              kind: 'info',
              title: '게이트 입장 불가',
              lines: ['부상 회복이 필요합니다.'],
              createdAt: todayISO(),
            }],
          })
          return
        }

        const monsters = gate.monsterIds
          .map(id => MONSTER_DEFINITIONS.find(m => m.id === id))
          .filter((monster): monster is MonsterDefinition => Boolean(monster))
        if (monsters.length === 0) return

        const equippedItems = getEquippedItems(s.items, s.equipment)
        const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
        const shadowStatBonuses = getEquippedShadowStatBonuses(equippedShadows)
        const combatStatsWithShadows = { ...s.hunter.stats }
        for (const [stat, value] of Object.entries(shadowStatBonuses)) {
          combatStatsWithShadows[stat as StatKey] = roundStatValue(combatStatsWithShadows[stat as StatKey] + (value ?? 0))
        }
        const playerSkills = getPlayerCombatSkills({
          jobId: s.hunter.jobId,
          equippedItems,
          allSkills: SKILL_DEFINITIONS,
        })
        const allPlayerSkills = ensureBasicAttack(playerSkills)
        const playerStats = calculatePlayerCombatStats({
          level: s.hunter.level,
          stats: combatStatsWithShadows,
          equippedItems,
          activeConsumableEffects: s.activeConsumableEffects,
          jobId: s.hunter.jobId,
          skills: playerSkills,
        })
        const gateSuccessBonus = getActiveGateSuccessBonus(s.activeConsumableEffects)
        const initialActiveEffects = createGateSuccessCombatEffects(gateSuccessBonus, 'player')
        const player = createPlayerBattleActor(s.hunter.name || 'Hunter', playerStats, allPlayerSkills)
        const monster = createMonsterBattleActor(monsters[0])

        set({
          gateStatus,
          manualBattleSession: {
            gateId: gate.id,
            gateName: gate.name,
            gateInstanceId: activeGate.instanceId,
            waveIndex: 0,
            turn: 1,
            maxTurns: 30,
            player: toManualCombatant(player),
            monster: toManualCombatant(monster),
            remainingMonsterIds: monsters.slice(1).map(item => item.id),
            cooldowns: {},
            monsterCooldowns: {},
            activeEffects: initialActiveEffects,
            consumableEffects: s.activeConsumableEffects,
            usedConsumableItemIds: [],
            usedConsumableEffectTypes: [],
            consumableUseCount: 0,
            logs: [],
            startedAt: todayISO(),
          },
        })
      },

      performManualBattleAction: (action) => {
        if (action.type === 'auto_finish') {
          get().switchManualBattleToAuto()
          return
        }

        const s = get()
        const existingSession = s.manualBattleSession
        const activeGate = s.activeGate
        if (!existingSession || existingSession.result || !activeGate || activeGate.status !== 'active') return
        let session = existingSession

        const gate = GATE_DEFINITIONS.find(g => g.id === session.gateId)
        if (!gate) return

        const currentMonsterDef = MONSTER_DEFINITIONS.find(monster => monster.id === gate.monsterIds[session.waveIndex])
        if (!currentMonsterDef) return

        const equippedItems = getEquippedItems(s.items, s.equipment)
        const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
        const playerSkills = getPlayerCombatSkills({
          jobId: s.hunter.jobId,
          equippedItems,
          allSkills: SKILL_DEFINITIONS,
        })
        const playerSkillIds = ensureBasicAttack(playerSkills)
          .filter(skill => skill.ownerType === 'common' || skill.ownerType === 'job' || skill.ownerType === 'equipment')
          .map(skill => skill.id)
        const monsterSkillIds = Array.from(new Set([BASIC_ATTACK_SKILL.id, ...currentMonsterDef.skillIds]))
        const monsterSkills = SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && monsterSkillIds.includes(skill.id))
        const allSkills = ensureBasicAttack([...playerSkills, ...monsterSkills])

        let player = decrementCooldowns(toBattleActor(session.player, 'player', 'player', playerSkillIds, session.cooldowns))
        let monster = toBattleActor(session.monster, 'monster', currentMonsterDef.id, monsterSkillIds, session.monsterCooldowns)
        let activeEffects: ActiveCombatEffect[] = [...session.activeEffects]
        let logs: BattleTurn[] = [...session.logs]
        let waveIndex = session.waveIndex
        let remainingMonsterIds = [...session.remainingMonsterIds]
        let nextItems = s.items
        let result: CombatLog['result'] | undefined
        let shadowPhase: 'player_after_action' | 'player_defend' = 'player_after_action'
        let playerUsedSkill = false

        if (action.type === 'use_consumable') {
          const item = s.items.find(candidate => candidate.id === action.itemId)
          const failureReason = getManualConsumableFailureReason(session, item)
          if (failureReason || !item) {
            logs.push(createManualSystemLog(
              `소모품을 사용할 수 없습니다: ${failureReason ?? '아이템을 찾을 수 없습니다.'}`,
              logs.length + 1,
              waveIndex + 1,
              monster
            ))
            set({
              manualBattleSession: {
                ...session,
                logs,
              },
            })
            return
          }

          const usableEffects = item.consumableEffects?.filter(isManualBattleConsumableEffect) ?? []
          let nextActiveEffects = activeEffects
          for (const effect of usableEffects) {
            for (const combatEffect of createManualConsumableCombatEffects(effect, item)) {
              nextActiveEffects = applyOrRefreshCombatEffect(nextActiveEffects, combatEffect)
            }
          }
          activeEffects = nextActiveEffects
          logs.push(createManualConsumableUseLog(
            player,
            monster,
            formatManualConsumableUseMessage(item, usableEffects),
            logs.length + 1,
            waveIndex + 1
          ))

          const usedConsumableEffectTypes = Array.from(new Set([
            ...session.usedConsumableEffectTypes,
            ...usableEffects.map(effect => effect.type),
          ]))
          session = {
            ...session,
            consumableEffects: [
              ...session.consumableEffects,
              ...usableEffects
                .filter(effect => effect.type === 'gate_penalty_reduction')
                .map(effect => createManualConsumableActiveEffect(effect, item)),
            ],
            usedConsumableItemIds: [...session.usedConsumableItemIds, item.id],
            usedConsumableEffectTypes,
            consumableUseCount: session.consumableUseCount + 1,
          }

          nextItems = s.items.filter(candidate => candidate.id !== item.id)
        } else if (action.type === 'defend') {
          shadowPhase = 'player_defend'
          activeEffects = applyOrRefreshCombatEffect(activeEffects, {
            sourceSkillId: 'manual-defend',
            kind: 'damage_reduction',
            value: 0.4,
            remainingTurns: 1,
            targetId: 'player',
          })
          logs.push(createDefendLog(player, monster, logs.length + 1, waveIndex + 1))
        } else {
          const skill = action.type === 'basic_attack'
            ? BASIC_ATTACK_SKILL
            : allSkills.find(item => item.id === action.skillId)
          if (!skill || !player.skillIds.includes(skill.id) || (player.cooldowns[skill.id] ?? 0) > 0) return
          playerUsedSkill = skill.id !== BASIC_ATTACK_SKILL.id

          const resolved = resolveAction({
            actor: player,
            target: monster,
            skill,
            activeEffects,
            rng: Math.random,
            turnNumber: logs.length + 1,
            waveNumber: waveIndex + 1,
            waveLabel: `Wave ${waveIndex + 1}`,
          })
          player = {
            ...resolved.actor,
            cooldowns: {
              ...resolved.actor.cooldowns,
              [skill.id]: skill.cooldownTurns ?? 0,
            },
          }
          monster = resolved.target
          activeEffects = resolved.activeEffects
          logs.push(resolved.log)
        }

        if (!result && monster.hp > 0) {
          const shadowResolved = resolveShadowSupportActions({
            shadows: equippedShadows,
            player,
            monster,
            activeEffects,
            rng: Math.random,
            turnNumber: logs.length + 1,
            waveNumber: waveIndex + 1,
            waveLabel: `Wave ${waveIndex + 1}`,
            phase: shadowPhase,
            playerUsedSkill,
          })
          monster = shadowResolved.monster
          activeEffects = shadowResolved.activeEffects
          logs.push(...shadowResolved.logs)
        }

        if (player.hp <= 0) {
          result = 'defeat'
        }

        if (!result && monster.hp <= 0) {
          const waveUpdate = appendManualWaveClearLogs({ logs, monster, waveIndex, remainingMonsterIds })
          logs = waveUpdate.logs
          monster = waveUpdate.monster
          waveIndex = waveUpdate.waveIndex
          remainingMonsterIds = waveUpdate.remainingMonsterIds
          result = waveUpdate.result
        }

        if (!result && getManualActionCount(logs) < session.maxTurns) {
          const liveMonsterDef = MONSTER_DEFINITIONS.find(item => item.id === gate.monsterIds[waveIndex])
          const liveMonsterSkillIds = Array.from(new Set([BASIC_ATTACK_SKILL.id, ...(liveMonsterDef?.skillIds ?? [])]))
          const liveMonsterSkills = SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && liveMonsterSkillIds.includes(skill.id))
          const liveAllSkills = ensureBasicAttack([...playerSkills, ...liveMonsterSkills])
          monster = decrementCooldowns(monster)
          const monsterContext = buildBattleSkillContext(monster, player, activeEffects, logs.length + 1)
          const monsterSkill = chooseSkill(
            monster,
            liveAllSkills.filter(skill => skill.ownerType === 'common' || skill.ownerType === 'monster'),
            monsterContext
          )
          const resolved = resolveAction({
            actor: monster,
            target: player,
            skill: monsterSkill,
            activeEffects,
            rng: Math.random,
            turnNumber: logs.length + 1,
            waveNumber: waveIndex + 1,
            waveLabel: `Wave ${waveIndex + 1}`,
          })
          monster = {
            ...resolved.actor,
            cooldowns: {
              ...resolved.actor.cooldowns,
              [monsterSkill.id]: monsterSkill.cooldownTurns ?? 0,
            },
          }
          player = resolved.target
          activeEffects = resolved.activeEffects
          logs.push(resolved.log)
        }

        if (!result && player.hp <= 0) result = 'defeat'
        if (!result && getManualActionCount(logs) >= session.maxTurns) result = 'draw'

        const nextGateStatus = clearExpiredGateInjury(s.gateStatus)
        if (result) {
          const combatLog: CombatLog = {
            battleId: `manual-${session.gateInstanceId}-${Date.now()}`,
            gateInstanceId: session.gateInstanceId,
            result,
            turns: logs,
            totalTurns: getManualActionCount(logs),
            playerHpRemaining: Math.max(0, player.hp),
            rewards: [],
            penaltyApplied: undefined,
            totalWaves: gate.monsterIds.length,
            clearedWaves: result === 'victory' ? gate.monsterIds.length : waveIndex,
          }
          const outcome = createGateBattleOutcomeUpdate(
            { ...s, items: nextItems, activeConsumableEffects: session.consumableEffects } as GameState,
            activeGate,
            gate,
            nextGateStatus,
            combatLog
          )
          set(outcome.state)
          if (outcome.shouldCheckUnlocks) {
            setTimeout(() => {
              get().checkTitleUnlocks()
              get().checkJobAwakening()
            }, 0)
          }
          return
        }

        set({
          items: nextItems,
          gateStatus: nextGateStatus,
          activeConsumableEffects: getManualActionCount(logs) > 0
            ? consumeNextGateConsumables(s.activeConsumableEffects)
            : s.activeConsumableEffects,
          manualBattleSession: {
            ...session,
            waveIndex,
            turn: getManualActionCount(logs) + 1,
            player: toManualCombatant(player),
            monster: toManualCombatant(monster),
            remainingMonsterIds,
            cooldowns: player.cooldowns,
            monsterCooldowns: monster.cooldowns,
            activeEffects: tickRoundEffects(activeEffects),
            logs,
          },
        })
      },

      cancelManualGateBattle: () => set({ manualBattleSession: undefined }),

      switchManualBattleToAuto: () => {
        const s = get()
        const session = s.manualBattleSession
        const activeGate = s.activeGate
        if (!session || !activeGate || activeGate.status !== 'active') return

        const gate = GATE_DEFINITIONS.find(g => g.id === session.gateId)
        if (!gate) return

        const currentMonsterDef = MONSTER_DEFINITIONS.find(monster => monster.id === gate.monsterIds[session.waveIndex])
        if (!currentMonsterDef) return

        const equippedItems = getEquippedItems(s.items, s.equipment)
        const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
        const playerSkills = getPlayerCombatSkills({
          jobId: s.hunter.jobId,
          equippedItems,
          allSkills: SKILL_DEFINITIONS,
        })
        const playerSkillIds = ensureBasicAttack(playerSkills)
          .filter(skill => skill.ownerType === 'common' || skill.ownerType === 'job' || skill.ownerType === 'equipment')
          .map(skill => skill.id)
        const remainingMonsterDefs = [currentMonsterDef, ...session.remainingMonsterIds
          .map(id => MONSTER_DEFINITIONS.find(monster => monster.id === id))
          .filter((monster): monster is MonsterDefinition => Boolean(monster))]
        const monsterSkillIds = new Set(remainingMonsterDefs.flatMap(monster => monster.skillIds))
        const monsterSkills = SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && monsterSkillIds.has(skill.id))
        const allSkills = ensureBasicAttack([...playerSkills, ...monsterSkills])

        let player = toBattleActor(session.player, 'player', 'player', playerSkillIds, session.cooldowns)
        let monster = toBattleActor(
          session.monster,
          'monster',
          currentMonsterDef.id,
          Array.from(new Set([BASIC_ATTACK_SKILL.id, ...currentMonsterDef.skillIds])),
          session.monsterCooldowns
        )
        let activeEffects: ActiveCombatEffect[] = [...session.activeEffects]
        let logs: BattleTurn[] = [
          ...session.logs,
          createManualSystemLog(
            '자동 마무리를 시작합니다. 현재 HP, cooldown, wave 상태를 이어받습니다.',
            session.logs.length + 1,
            session.waveIndex + 1,
            monster
          ),
        ]
        let waveIndex = session.waveIndex
        let remainingMonsterIds = [...session.remainingMonsterIds]
        let result: CombatLog['result'] | undefined

        if (monster.hp <= 0) {
          const waveUpdate = appendManualWaveClearLogs({ logs, monster, waveIndex, remainingMonsterIds })
          logs = waveUpdate.logs
          monster = waveUpdate.monster
          waveIndex = waveUpdate.waveIndex
          remainingMonsterIds = waveUpdate.remainingMonsterIds
          result = waveUpdate.result
        }

        while (!result && player.hp > 0 && getManualActionCount(logs) < session.maxTurns) {
          const effectivePlayer = getEffectiveBattleActorStats(player, activeEffects)
          const effectiveMonster = getEffectiveBattleActorStats(monster, activeEffects)
          const order: Array<'player' | 'monster'> = effectivePlayer.speed >= effectiveMonster.speed
            ? ['player', 'monster']
            : ['monster', 'player']

          for (const actorType of order) {
            if (player.hp <= 0 || monster.hp <= 0 || getManualActionCount(logs) >= session.maxTurns) break

            if (actorType === 'player') {
              player = decrementCooldowns(player)
              const skill = chooseSkill(
                player,
                allSkills,
                buildBattleSkillContext(player, monster, activeEffects, getManualActionCount(logs) + 1)
              )
              const resolved = resolveAction({
                actor: player,
                target: monster,
                skill,
                activeEffects,
                rng: Math.random,
                turnNumber: logs.length + 1,
                waveNumber: waveIndex + 1,
                waveLabel: `Wave ${waveIndex + 1}`,
              })
              player = {
                ...resolved.actor,
                cooldowns: {
                  ...resolved.actor.cooldowns,
                  [skill.id]: skill.cooldownTurns ?? 0,
                },
              }
              monster = resolved.target
              activeEffects = resolved.activeEffects
              logs.push(resolved.log)
              const shadowResolved = resolveShadowSupportActions({
                shadows: equippedShadows,
                player,
                monster,
                activeEffects,
                rng: Math.random,
                turnNumber: getManualActionCount(logs),
                waveNumber: waveIndex + 1,
                waveLabel: `Wave ${waveIndex + 1}`,
                phase: 'player_after_action',
                playerUsedSkill: skill.id !== BASIC_ATTACK_SKILL.id,
              })
              monster = shadowResolved.monster
              activeEffects = shadowResolved.activeEffects
              logs.push(...shadowResolved.logs)
            } else {
              const liveMonsterDef = MONSTER_DEFINITIONS.find(item => item.id === gate.monsterIds[waveIndex])
              const liveMonsterSkillIds = Array.from(new Set([BASIC_ATTACK_SKILL.id, ...(liveMonsterDef?.skillIds ?? [])]))
              const liveMonsterSkills = SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && liveMonsterSkillIds.includes(skill.id))
              const liveAllSkills = ensureBasicAttack([...playerSkills, ...liveMonsterSkills])
              monster = decrementCooldowns(monster)
              const skill = chooseSkill(
                monster,
                liveAllSkills.filter(item => item.ownerType === 'common' || item.ownerType === 'monster'),
                buildBattleSkillContext(monster, player, activeEffects, getManualActionCount(logs) + 1)
              )
              const resolved = resolveAction({
                actor: monster,
                target: player,
                skill,
                activeEffects,
                rng: Math.random,
                turnNumber: logs.length + 1,
                waveNumber: waveIndex + 1,
                waveLabel: `Wave ${waveIndex + 1}`,
              })
              monster = {
                ...resolved.actor,
                cooldowns: {
                  ...resolved.actor.cooldowns,
                  [skill.id]: skill.cooldownTurns ?? 0,
                },
              }
              player = resolved.target
              activeEffects = resolved.activeEffects
              logs.push(resolved.log)
            }
          }

          if (player.hp <= 0) {
            result = 'defeat'
            break
          }

          if (monster.hp <= 0) {
            const waveUpdate = appendManualWaveClearLogs({ logs, monster, waveIndex, remainingMonsterIds })
            logs = waveUpdate.logs
            monster = waveUpdate.monster
            waveIndex = waveUpdate.waveIndex
            remainingMonsterIds = waveUpdate.remainingMonsterIds
            result = waveUpdate.result
          }

          if (!result && getManualActionCount(logs) >= session.maxTurns) {
            result = 'draw'
          }

          if (!result) {
            activeEffects = tickRoundEffects(activeEffects)
          }
        }

        if (!result) {
          result = player.hp <= 0 ? 'defeat' : 'draw'
        }

        const nextGateStatus = clearExpiredGateInjury(s.gateStatus)
        const combatLog: CombatLog = {
          battleId: `manual-auto-${session.gateInstanceId}-${Date.now()}`,
          gateInstanceId: session.gateInstanceId,
          result,
          turns: logs,
          totalTurns: getManualActionCount(logs),
          playerHpRemaining: Math.max(0, player.hp),
          rewards: [],
          penaltyApplied: undefined,
          totalWaves: gate.monsterIds.length,
          clearedWaves: result === 'victory' ? gate.monsterIds.length : waveIndex,
        }
        const outcome = createGateBattleOutcomeUpdate(
          { ...s, activeConsumableEffects: session.consumableEffects } as GameState,
          activeGate,
          gate,
          nextGateStatus,
          combatLog
        )
        set(outcome.state)
        if (outcome.shouldCheckUnlocks) {
          setTimeout(() => {
            get().checkTitleUnlocks()
            get().checkJobAwakening()
          }, 0)
        }
      },

      attemptShadowExtraction: (gateInstanceId) => {
        const s = get()
        const activeGate = s.activeGate
        if (!activeGate || activeGate.instanceId !== gateInstanceId) return
        const gate = GATE_DEFINITIONS.find(item => item.id === activeGate.gateId)
        if (!gate) return
        const victoryLog = s.combatLogs.find(log => log.gateInstanceId === gateInstanceId && log.result === 'victory')
        if (!victoryLog) return
        if ((s.shadowExtractHistory ?? []).some(result => result.gateInstanceId === gateInstanceId)) return

        const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
        const rawResult = rollShadowExtraction(gate, s.hunter, equippedShadows)
        const result: ShadowExtractResult = {
          ...rawResult,
          gateInstanceId,
        }
        const ownedShadows = result.success && result.shadow
          ? [...(s.ownedShadows ?? []), result.shadow]
          : (s.ownedShadows ?? [])
        set({
          ownedShadows,
          lastShadowExtractResult: result,
          shadowExtractHistory: [result, ...(s.shadowExtractHistory ?? [])].slice(0, 50),
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow',
            title: result.success ? '그림자 추출 성공' : '그림자 추출 실패',
            lines: [result.message],
            createdAt: todayISO(),
          }],
        })
      },

      equipShadow: (shadowId) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        if (!ownedShadows.some(shadow => shadow.instanceId === shadowId)) return {}
        const equippedShadowIds = s.equippedShadowIds ?? []
        if (equippedShadowIds.includes(shadowId)) return {}
        const slotCount = getShadowSlotCount(s.hunter)
        if (equippedShadowIds.length >= slotCount) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow',
              title: '출전 슬롯 부족',
              lines: [`현재 출전 가능한 그림자는 ${slotCount}명입니다.`],
              createdAt: todayISO(),
            }],
          }
        }
        return { equippedShadowIds: [...equippedShadowIds, shadowId] }
      }),

      unequipShadow: (shadowId) => set((s) => ({
        equippedShadowIds: (s.equippedShadowIds ?? []).filter(id => id !== shadowId),
      })),

      grantAchievementNamedShadows: () => set((s) => {
        const grants = buildAchievementShadowGrants(s.quests, s.ownedShadows)
        if (grants.shadows.length === 0) return {}
        return {
          ownedShadows: [...(s.ownedShadows ?? []), ...grants.shadows],
          messages: [...s.messages, ...grants.messages],
        }
      }),

      addQuest: (q) => set((s) => ({
        quests: [...s.quests, { ...q, id: uid(), createdAt: todayISO() }],
      })),

      removeQuest: (id) => set((s) => ({ quests: s.quests.filter(q => q.id !== id) })),

      completeQuest: (id) => {
        const s = get()
        const q = s.quests.find(x => x.id === id)
        if (!q) return

        if (q.type === 'daily' && getCooldownRemaining(q) > 0) return
        if (q.type === 'main' && q.completed) return

        // ── Record achievement stats ──
        const dateKey = todayKey()
        const stats = { ...s.achievementStats }
        
        // Quest completions
        stats.questCompletions.total += 1
        stats.questCompletions.byQuestId[q.id] = (stats.questCompletions.byQuestId[q.id] ?? 0) + 1
        stats.questCompletions.byCategory[q.category] = (stats.questCompletions.byCategory[q.category] ?? 0) + 1
        stats.questCompletions.byType[q.type] = (stats.questCompletions.byType[q.type] ?? 0) + 1

        // Daily-specific tracking
        if (q.type === 'daily') {
          // Check if already completed today to prevent duplicate counting
          const todayHistory = stats.dailyHistory[dateKey]
          const alreadyCompletedToday = todayHistory?.completedDailyQuestIds.includes(q.id) ?? false

          if (!alreadyCompletedToday) {
            stats.dailyCompletions.total += 1
            stats.dailyCompletions.byQuestId[q.id] = (stats.dailyCompletions.byQuestId[q.id] ?? 0) + 1
            stats.dailyCompletions.byCategory[q.category] = (stats.dailyCompletions.byCategory[q.category] ?? 0) + 1

            // Streak tracking: check if completed yesterday
            const yesterdayKey = getDateKey(addDays(new Date(), -1))
            const completedYesterday = stats.dailyHistory[yesterdayKey]?.completedDailyQuestIds.includes(q.id) ?? false
            
            if (completedYesterday) {
              stats.dailyCompletions.currentStreakByQuestId[q.id] = (stats.dailyCompletions.currentStreakByQuestId[q.id] ?? 0) + 1
            } else {
              stats.dailyCompletions.currentStreakByQuestId[q.id] = 1
            }
            
            const currentStreak = stats.dailyCompletions.currentStreakByQuestId[q.id]
            const bestStreak = stats.dailyCompletions.bestStreakByQuestId[q.id] ?? 0
            if (currentStreak > bestStreak) {
              stats.dailyCompletions.bestStreakByQuestId[q.id] = currentStreak
            }
            // TODO: Implement cooldown-aware streak for dailies with cooldownDays > 0

            // Update daily history
            const existingHistory = stats.dailyHistory[dateKey] ?? {
              completedDailyQuestIds: [],
              completedDailyCount: 0,
              totalDailyAvailableCount: 0,
              completedAllAvailableDailies: false,
            }
            
            const updatedQuestIds = [...existingHistory.completedDailyQuestIds, q.id]
            
            // Calculate total available dailies for today
            const availableOrCompletedTodayDailies = s.quests.filter(quest => {
              if (quest.type !== 'daily') return false
              const alreadyCompletedToday = updatedQuestIds.includes(quest.id)
              return alreadyCompletedToday || getCooldownRemaining(quest) === 0
            })
            const totalAvailable = availableOrCompletedTodayDailies.length
            const completedCount = updatedQuestIds.length
            
            stats.dailyHistory[dateKey] = {
              completedDailyQuestIds: updatedQuestIds,
              completedDailyCount: completedCount,
              totalDailyAvailableCount: totalAvailable,
              completedAllAvailableDailies: totalAvailable > 0 && completedCount >= totalAvailable,
            }

            // Check for 15+ daily clears in a day
            if (completedCount >= 15 && !stats.special.daily15PlusClearDateKeys.includes(dateKey)) {
              stats.special.daily15PlusClearDays += 1
              stats.special.daily15PlusClearDateKeys.push(dateKey)
            }

            // Special counters
            if (q.id === 'daily-sleep') {
              stats.special.earlyWakeBefore7Count += 1
              stats.special.earlyWakeBefore7CurrentStreak = completedYesterday
                ? (stats.special.earlyWakeBefore7CurrentStreak ?? 0) + 1
                : 1
              if (stats.special.earlyWakeBefore7CurrentStreak > stats.special.earlyWakeBefore7BestStreak) {
                stats.special.earlyWakeBefore7BestStreak = stats.special.earlyWakeBefore7CurrentStreak
              }
            }
            if (q.id === 'daily-shortform-limit') {
              stats.special.noShortsWithin30MinCount += 1
              stats.special.noShortsWithin30MinCurrentStreak = completedYesterday
                ? (stats.special.noShortsWithin30MinCurrentStreak ?? 0) + 1
                : 1
              if (stats.special.noShortsWithin30MinCurrentStreak > stats.special.noShortsWithin30MinBestStreak) {
                stats.special.noShortsWithin30MinBestStreak = stats.special.noShortsWithin30MinCurrentStreak
              }
            }
            if (q.id === 'daily-meditate') {
              stats.special.meditationCount += 1
              stats.special.meditationCurrentStreak = completedYesterday
                ? (stats.special.meditationCurrentStreak ?? 0) + 1
                : 1
              if (stats.special.meditationCurrentStreak > stats.special.meditationBestStreak) {
                stats.special.meditationBestStreak = stats.special.meditationCurrentStreak
              }
            }
            if (q.id === 'daily-market-close') {
              stats.special.marketCheckCount += 1
            }
            if (q.id === 'daily-weigh') {
              stats.special.weightRecordCount += 1
            }

            // Late night completion (00:00~01:59 only)
            const hour = new Date().getHours()
            const isAllNighterWindow = hour >= 0 && hour < 2
            if (isAllNighterWindow) {
              stats.special.lateNightCompletionCount += 1
            }
          }
        }

        // Main-specific tracking
        if (q.type === 'main' && !q.completed) {
          stats.mainClears.total += 1
          stats.mainClears.byQuestId[q.id] = (stats.mainClears.byQuestId[q.id] ?? 0) + 1

          // Special: monthly spending limit
          if (q.id === 'main-spend-monthly') {
            stats.special.spendingLimitMonthlyClearCount += 1
          }
        }

        // ── Stat-driven XP multiplier (category-aligned) + Job bonus + Equipment bonus + Consumable bonus
        const equippedItems = getEquippedItems(s.items, s.equipment)
        const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
        const shadowStatBonuses = getEquippedShadowStatBonuses(equippedShadows)
        const consumableStatBonuses = getActiveConsumableStatBonuses(s.activeConsumableEffects)
        const combinedStatBonuses = { ...consumableStatBonuses }
        for (const [stat, value] of Object.entries(shadowStatBonuses)) {
          combinedStatBonuses[stat as StatKey] = (combinedStatBonuses[stat as StatKey] ?? 0) + (value ?? 0)
        }
        const baseXp = getBalancedQuestXp(q.type, q.difficulty)
        const statMultiplier = getXpMultiplierWithEquipment(s.hunter, q.category, equippedItems, combinedStatBonuses)
        
        // Job XP bonus
        const currentJob = JOB_DEFINITIONS.find(j => j.id === s.hunter.jobId)
        const jobCategoryBonus = currentJob?.effects.xpBonusByCategory?.[q.category] ?? 0
        
        // Equipment XP bonus
        const equipmentXpBonus = getEquipmentXpBonus(equippedItems, q.category)
        
        // Consumable XP bonus
        const consumableXpBonus = getActiveConsumableXpBonus(s.activeConsumableEffects, q.category)
        const titleXpBonus = getTitleXpMultiplier(s.hunter, q.category) - 1
        
        // Additive XP bonus: job + equipment + consumable + equipped title
        const shadowXpBonus = getEquippedShadowCategoryXpBonus(equippedShadows, q.category)
        const additiveXpBonus = jobCategoryBonus + equipmentXpBonus + consumableXpBonus + titleXpBonus + shadowXpBonus
        const xp = Math.round(baseXp * statMultiplier * (1 + additiveXpBonus))

        // Bump category progress BEFORE applyXp so this completion counts for level-up.
        const bumpedProgress = {
          ...s.hunter.categoryProgress,
          [q.category]: (s.hunter.categoryProgress[q.category] ?? 0) + 1,
        }
        const hunterIn = { ...s.hunter, categoryProgress: bumpedProgress }

        const { hunter: newHunter, outcome } = applyXp(hunterIn, xp, q.category)

        // grow stats from quest's intrinsic statRewards
        const statRewards = getBalancedQuestStatRewards(q)
        const newStats = { ...newHunter.stats }
        for (const [k, v] of Object.entries(statRewards)) {
          newStats[k as StatKey] = roundStatValue(newStats[k as StatKey] + (v ?? 0))
        }

        // streak: increment on first daily completion of the day
        const today = todayKey()
        const yesterdayKey = getDateKey(addDays(new Date(), -1))
        let streak = newHunter.streak
        if (newHunter.lastActiveDate !== today) {
          streak = newHunter.lastActiveDate === yesterdayKey ? streak + 1 : 1
        }

        const updatedQuests = s.quests.map(x => {
          if (x.id !== id) return x
          if (x.type === 'daily') return { ...x, lastCompletedAt: todayISO() }
          if (x.type === 'main') return { ...x, completed: true }
          return x
        })

        // ── Item drop chance with VIT-driven bonus + equipment drop bonus + consumable drop bonus
        const drops: Item[] = []
        const baseDropChance = getBalancedQuestDropChance(q.type, q.difficulty)
        const statDropBonus = getDropChanceBonusWithEquipment(s.hunter, q.category, equippedItems, combinedStatBonuses)
        const equipmentDropBonus = getEquipmentDropBonus(equippedItems)
        const shadowDropBonus = getEquippedShadowDropBonus(equippedShadows)
        const consumableDropBonus = getActiveConsumableDropBonus(s.activeConsumableEffects)
        const finalDropChance = Math.min(0.95, baseDropChance + statDropBonus + equipmentDropBonus + shadowDropBonus + consumableDropBonus)
        
        // Get consumable rarity bonus for item generation
        const consumableRarityBonus = getActiveConsumableRarityBonus(s.activeConsumableEffects)
        const titleRarityBonus = getTitleRarityBonus(s.hunter)
        
        if (Math.random() < finalDropChance) drops.push(randomItem(s.hunter, equippedItems, consumableRarityBonus, titleRarityBonus, q.type))

        // messages
        const newMessages: SystemMessage[] = []
        newMessages.push({
          id: uid(),
          kind: 'quest',
          title: '퀘스트 완료',
          lines: [
            `[${q.title}]`,
            `+${xp} XP 획득${xp !== baseXp ? ` (기본 ${baseXp})` : ''}`,
            ...Object.entries(statRewards).map(([k, v]) => `· ${k} ${formatStatReward(v ?? 0)}`),
          ],
          createdAt: todayISO(),
        })

        if (outcome.leveledUp) {
          newMessages.push({
            id: uid(),
            kind: 'levelup',
            title: 'LEVEL UP',
            lines: [
              `Lv.${s.hunter.level} → Lv.${outcome.newLevel}`,
              `자동 분배 — ${formatStatGains(outcome.autoStatGains)}`,
              `자유 배분권 +${outcome.freeStatPointsGained}`,
            ],
            createdAt: todayISO(),
          })
        }

        if (outcome.rankChanged) {
          newMessages.push({
            id: uid(),
            kind: 'rank',
            title: '랭크 상승',
            lines: [
              `${s.hunter.rank}-Rank → ${outcome.newRank}-Rank`,
              '시스템이 당신을 다시 평가합니다.',
            ],
            createdAt: todayISO(),
          })
        }

        for (const drop of drops) {
          newMessages.push({
            id: uid(),
            kind: 'item',
            title: '아이템 획득',
            lines: [`${drop.icon}  ${drop.name}`, drop.description],
            createdAt: todayISO(),
          })
        }

        // Consume next_quest consumable effects
        const updatedConsumableEffects = consumeNextQuestEffects(s.activeConsumableEffects, q.category)

        set({
          hunter: { ...newHunter, stats: newStats, streak, lastActiveDate: today },
          quests: updatedQuests,
          items: [...s.items, ...drops],
          messages: [...s.messages, ...newMessages],
          achievementStats: stats,
          activeConsumableEffects: updatedConsumableEffects,
          gateStatus: q.type === 'daily' || q.type === 'main'
            ? recoverGateAfterQuestCompletion(s.gateStatus)
            : s.gateStatus,
        })

        // Check title unlocks after quest completion
        setTimeout(() => {
          get().checkTitleUnlocks()
          get().checkJobAwakening()
          if (q.type === 'daily') get().rollGateSpawn('daily_completion')
          if (q.type === 'main') get().rollGateSpawn('main_completion')
        }, 0)
      },

      uncompleteDaily: (id) => set((s) => ({
        quests: s.quests.map(q => q.id === id ? { ...q, lastCompletedAt: undefined } : q),
      })),

      progressDungeon: (id) => {
        const s = get()
        const q = s.quests.find(x => x.id === id)
        if (!q || q.type !== 'dungeon') return
        const total = q.totalSteps ?? 1
        const cur = (q.currentSteps ?? 0) + 1

        // ── Record achievement stats (partial progress) ──
        const stats = { ...s.achievementStats }
        stats.questCompletions.total += 1
        stats.questCompletions.byQuestId[q.id] = (stats.questCompletions.byQuestId[q.id] ?? 0) + 1
        stats.questCompletions.byCategory[q.category] = (stats.questCompletions.byCategory[q.category] ?? 0) + 1
        stats.questCompletions.byType.dungeon = (stats.questCompletions.byType.dungeon ?? 0) + 1

        // Bump category progress for both partial and clear paths.
        const bumpedProgress = {
          ...s.hunter.categoryProgress,
          [q.category]: (s.hunter.categoryProgress[q.category] ?? 0) + 1,
        }
        const hunterIn = { ...s.hunter, categoryProgress: bumpedProgress }

        if (cur < total) {
          // ── Partial step: AGI-driven multiplier + equipment effects + consumable effects
          const equippedItems = getEquippedItems(s.items, s.equipment)
          const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
          const shadowStatBonuses = getEquippedShadowStatBonuses(equippedShadows)
          const consumableStatBonuses = getActiveConsumableStatBonuses(s.activeConsumableEffects)
          const combinedStatBonuses = { ...consumableStatBonuses }
          for (const [stat, value] of Object.entries(shadowStatBonuses)) {
            combinedStatBonuses[stat as StatKey] = (combinedStatBonuses[stat as StatKey] ?? 0) + (value ?? 0)
          }
          const baseStepXp = getBalancedDungeonStepXp(q.difficulty, total)
          const shadowXpBonus = getEquippedShadowCategoryXpBonus(equippedShadows, q.category)
          const stepXp = Math.round(baseStepXp * getPartialRewardMultiplierWithEquipment(s.hunter, equippedItems, combinedStatBonuses) * getTitleXpMultiplier(s.hunter, q.category) * (1 + shadowXpBonus))
          const { hunter: newHunter, outcome } = applyXp(hunterIn, stepXp, q.category)

          const newMessages: SystemMessage[] = [{
            id: uid(),
            kind: 'quest',
            title: '던전 진행',
            lines: [`[${q.title}]`, `${cur}/${total} 단계`, `+${stepXp} XP${stepXp !== baseStepXp ? ` (기본 ${baseStepXp})` : ''}`],
            createdAt: todayISO(),
          }]
          if (outcome.leveledUp) {
            newMessages.push({
              id: uid(), kind: 'levelup', title: 'LEVEL UP',
              lines: [
                `Lv.${s.hunter.level} → Lv.${outcome.newLevel}`,
                `자동 분배 — ${formatStatGains(outcome.autoStatGains)}`,
                `자유 배분권 +${outcome.freeStatPointsGained}`,
              ],
              createdAt: todayISO(),
            })
          }

          set({
            hunter: newHunter,
            quests: s.quests.map(x => x.id === id ? { ...x, currentSteps: cur } : x),
            messages: [...s.messages, ...newMessages],
            achievementStats: stats,
          })

          // Check title unlocks after dungeon progress
          setTimeout(() => {
            get().checkTitleUnlocks()
            get().checkJobAwakening()
          }, 0)
          return
        }

        // ── Clear: full reward (category multiplier applies, like a main completion) + equipment effects + consumable effects
        // Record dungeon clear
        stats.dungeonClears.total += 1
        stats.dungeonClears.byQuestId[q.id] = (stats.dungeonClears.byQuestId[q.id] ?? 0) + 1

        // Special: CMA journal
        if (q.id === 'dungeon-cma-journal') {
          stats.special.cmaJournalCount += 1
        }

        const equippedItems = getEquippedItems(s.items, s.equipment)
        const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
        const shadowStatBonuses = getEquippedShadowStatBonuses(equippedShadows)
        const consumableStatBonuses = getActiveConsumableStatBonuses(s.activeConsumableEffects)
        const combinedStatBonuses = { ...consumableStatBonuses }
        for (const [stat, value] of Object.entries(shadowStatBonuses)) {
          combinedStatBonuses[stat as StatKey] = (combinedStatBonuses[stat as StatKey] ?? 0) + (value ?? 0)
        }
        const baseXp = getBalancedQuestXp('dungeon', q.difficulty)
        const statMultiplier = getXpMultiplierWithEquipment(s.hunter, q.category, equippedItems, combinedStatBonuses)
        const currentJob = JOB_DEFINITIONS.find(j => j.id === s.hunter.jobId)
        const jobCategoryBonus = currentJob?.effects.xpBonusByCategory?.[q.category] ?? 0
        const equipmentXpBonus = getEquipmentXpBonus(equippedItems, q.category)
        const consumableXpBonus = getActiveConsumableXpBonus(s.activeConsumableEffects, q.category)
        const titleXpBonus = getTitleXpMultiplier(s.hunter, q.category) - 1
        // Additive XP bonus: job + equipment + consumable + equipped title
        const shadowXpBonus = getEquippedShadowCategoryXpBonus(equippedShadows, q.category)
        const additiveXpBonus = jobCategoryBonus + equipmentXpBonus + consumableXpBonus + titleXpBonus + shadowXpBonus
        const xp = Math.round(baseXp * statMultiplier * (1 + additiveXpBonus))
        const { hunter: newHunter, outcome } = applyXp(hunterIn, xp, q.category)
        const statRewards = getBalancedQuestStatRewards(q)
        const newStats = { ...newHunter.stats }
        for (const [k, v] of Object.entries(statRewards)) {
          newStats[k as StatKey] = roundStatValue(newStats[k as StatKey] + (v ?? 0))
        }
        const titleRarityBonus = getTitleRarityBonus(s.hunter)
        const drop = randomItem(s.hunter, equippedItems, 0, titleRarityBonus, 'dungeon')
        
        // Consume next_quest consumable effects
        const updatedConsumableEffects = consumeNextQuestEffects(s.activeConsumableEffects, q.category)
        const messages: SystemMessage[] = [
          {
            id: uid(), kind: 'quest', title: '던전 클리어!',
            lines: [
              `[${q.title}]`,
              `+${xp} XP${xp !== baseXp ? ` (기본 ${baseXp})` : ''}`,
              ...Object.entries(statRewards).map(([k, v]) => `· ${k} ${formatStatReward(v ?? 0)}`),
            ],
            createdAt: todayISO(),
          },
          {
            id: uid(), kind: 'item', title: '보상 아이템',
            lines: [`${drop.icon}  ${drop.name}`, drop.description],
            createdAt: todayISO(),
          },
        ]
        if (outcome.leveledUp) {
          messages.push({
            id: uid(), kind: 'levelup', title: 'LEVEL UP',
            lines: [
              `Lv.${s.hunter.level} → Lv.${outcome.newLevel}`,
              `자동 분배 — ${formatStatGains(outcome.autoStatGains)}`,
              `자유 배분권 +${outcome.freeStatPointsGained}`,
            ],
            createdAt: todayISO(),
          })
        }
        if (outcome.rankChanged) {
          messages.push({
            id: uid(), kind: 'rank', title: '랭크 상승',
            lines: [`${s.hunter.rank} → ${outcome.newRank}`, '시스템이 당신을 다시 평가합니다.'],
            createdAt: todayISO(),
          })
        }

        set({
          hunter: { ...newHunter, stats: newStats },
          quests: s.quests.map(x => x.id === id ? { ...x, currentSteps: total, completed: true } : x),
          items: [...s.items, drop],
          messages: [...s.messages, ...messages],
          achievementStats: stats,
          activeConsumableEffects: updatedConsumableEffects,
        })

        // Unlock shadow-hunter on first dungeon clear
        setTimeout(() => {
          get().unlockTitle('shadow-hunter')
          get().grantAchievementNamedShadows()
          get().checkTitleUnlocks()
          get().checkJobAwakening()
          // Gate spawn is attempted only on final dungeon clear, never on partial progress.
          // Monthly or high-rank dungeons use the higher initial chance.
          const isHardDungeon = q.resetCycle === 'monthly' || q.difficulty === 'elite' || q.difficulty === 'apex' || q.difficulty === 'boss'
          get().rollGateSpawn(isHardDungeon ? 'hard_dungeon_clear' : 'dungeon_clear')
        }, 0)
      },

      resetDailiesIfNewDay: () => set((s) => {
        const today = todayKey()
        const yesterdayKey = getDateKey(addDays(new Date(), -1))
        let streak = s.hunter.streak
        let streakProtectionLastUsed = s.hunter.streakProtectionLastUsed
        const protectionMessages: SystemMessage[] = []
        const stats = { ...s.achievementStats }

        // streak would normally reset if last active was >1 day ago.
        // PER-driven protection can save it once per month.
        if (s.hunter.lastActiveDate && s.hunter.lastActiveDate !== today && s.hunter.lastActiveDate !== yesterdayKey) {
          if (shouldProtectStreak(s.hunter, streakProtectionLastUsed)) {
            streakProtectionLastUsed = todayISO()
            stats.special.resurrectionCount += 1
            protectionMessages.push({
              id: uid(),
              kind: 'info',
              title: 'PER 스탯이 작동했다',
              lines: ['streak가 보호되었다.'],
              createdAt: todayISO(),
            })
          } else {
            streak = 0
          }
        }

        // Monthly reset: main.completed=false, dungeon.currentSteps=0
        const now = new Date()
        const monthStartIso = monthStart(now).toISOString()
        const quests = s.quests.map(q => {
          if (q.resetCycle !== 'monthly') return q
          if (!q.lastResetAt) {
            return { ...q, lastResetAt: monthStartIso }
          }
          if (isBeforeMonth(q.lastResetAt, now)) {
            if (q.type === 'main')    return { ...q, completed: false, lastResetAt: monthStartIso }
            if (q.type === 'dungeon') return { ...q, currentSteps: 0, completed: false, lastResetAt: monthStartIso }
          }
          return q
        })

        return {
          hunter: { ...s.hunter, streak, streakProtectionLastUsed },
          quests,
          messages: [...s.messages, ...protectionMessages],
          achievementStats: stats,
          initialized: true,
        }
      }),

      pushMessage: (m) => set((s) => ({
        messages: [...s.messages, { ...m, id: uid(), createdAt: todayISO() }],
      })),
      dismissMessage: (id) => set((s) => ({ messages: s.messages.filter(x => x.id !== id) })),
      clearMessages: () => set({ messages: [] }),

      syncDefaultQuestMetadata: () => set((s) => {
        const defaultMap = new Map<string, Quest>(
          initialQuests.map(q => [q.id, q])
        )
        const preserved = new Set<string>()
        const mergedQuests: Quest[] = s.quests.map(saved => {
          const def = defaultMap.get(saved.id)
          if (!def) return saved // custom quest: leave untouched
          preserved.add(saved.id)
          // Merge: keep progress fields, update metadata from default seed
          return {
            ...def,
            completed: saved.completed,
            currentSteps: saved.currentSteps,
            lastCompletedAt: saved.lastCompletedAt,
            createdAt: saved.createdAt,
            lastResetAt: saved.lastResetAt,
          }
        })
        // Add new default quests that weren't in saved quests
        const addedQuests: Quest[] = []
        for (const def of initialQuests) {
          if (!preserved.has(def.id)) {
            addedQuests.push(def)
          }
        }
        if (addedQuests.length === 0 && mergedQuests.length === s.quests.length) {
          // Nothing changed
          return {}
        }
        return { quests: [...mergedQuests, ...addedQuests] }
      }),

      hardReset: () => set({
        hunter: initialHunter,
        quests: initialQuests,
        items: [],
        titles: [],
        messages: [],
        achievementStats: createInitialAchievementStats(),
        activeRandomQuest: undefined,
        randomQuestHistory: {},
        equipment: {},
        activeConsumableEffects: [],
        gateStatus: createInitialGateStatus(),
        activeGate: undefined,
        combatLogs: [],
        manualBattleSession: undefined,
        ownedShadows: [],
        equippedShadowIds: [],
        shadowExtractHistory: [],
        lastShadowExtractResult: undefined,
        initialized: true,
      }),
    }),
    {
      name: 'levelup-save',
      version: 14,
      partialize: (state) => ({
        ...state,
        manualBattleSession: undefined,
      }),
      onRehydrateStorage: () => {
        // Sync default quest metadata (title, description, milestones, weights) from latest seed
        // while preserving user progress (currentSteps, completed, etc.).
        // Custom quests are left untouched.
        setTimeout(() => {
          try {
            useGame.getState().syncDefaultQuestMetadata()
          } catch {
            // ignore if store not ready
          }
        }, 0)
      },
      migrate: (persistedState: any, version: number) => {
        // Ensure hunter has title fields
        if (persistedState?.hunter) {
          if (!persistedState.hunter.ownedTitleIds) {
            persistedState.hunter.ownedTitleIds = []
          }
          if (persistedState.hunter.equippedTitleId === undefined) {
            persistedState.hunter.equippedTitleId = undefined
          }
          // Ensure hunter has job fields (v8 -> v9)
          if (!persistedState.hunter.jobId) {
            persistedState.hunter.jobId = 'unawakened'
          }
          if (!persistedState.hunter.unlockedJobIds) {
            persistedState.hunter.unlockedJobIds = ['unawakened']
          }
          // Update legacy job display name
          if (persistedState.hunter.job === '각성하지 못한 자') {
            persistedState.hunter.job = '미각성자'
          }
        }
        // Ensure achievementStats exists
        if (!persistedState?.achievementStats) {
          persistedState.achievementStats = createInitialAchievementStats()
        } else {
          // Ensure daily15PlusClearDateKeys exists (v7 -> v8)
          if (!persistedState.achievementStats.special.daily15PlusClearDateKeys) {
            persistedState.achievementStats.special.daily15PlusClearDateKeys = []
          }
        }
        // Ensure random quest fields exist (v9 -> v10)
        if (persistedState.activeRandomQuest === undefined) {
          persistedState.activeRandomQuest = undefined
        }
        if (!persistedState.randomQuestHistory) {
          persistedState.randomQuestHistory = {}
        }
        // Ensure equipment field exists (v10 -> v11)
        if (!persistedState.equipment) {
          persistedState.equipment = {}
        }
        // Ensure activeConsumableEffects exists (v11 -> v12)
        if (!persistedState.activeConsumableEffects) {
          persistedState.activeConsumableEffects = []
        }
        // Ensure gate fields exist (v12 -> v14)
        if (!persistedState.gateStatus) {
          persistedState.gateStatus = createInitialGateStatus()
        } else if (!('lastDailyGateRollDate' in persistedState.gateStatus)) {
          persistedState.gateStatus.lastDailyGateRollDate = undefined
        }
        if (!('activeGate' in persistedState)) {
          persistedState.activeGate = undefined
        }
        if (!persistedState.combatLogs) {
          persistedState.combatLogs = []
        }
        if (!persistedState.ownedShadows) {
          persistedState.ownedShadows = []
        }
        if (!persistedState.equippedShadowIds) {
          persistedState.equippedShadowIds = []
        }
        if (!persistedState.shadowExtractHistory) {
          persistedState.shadowExtractHistory = []
        }
        if (!('lastShadowExtractResult' in persistedState)) {
          persistedState.lastShadowExtractResult = undefined
        }
        persistedState.manualBattleSession = undefined
        return persistedState
      },
    }
  )
)
