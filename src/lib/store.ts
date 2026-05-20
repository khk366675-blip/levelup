import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AchievementStats,
  ActiveCombatEffect,
  ActiveConsumableEffect,
  ActiveGate,
  ActiveRandomQuest,
  BattleTurn,
  BoxReward,
  BoxTier,
  Category,
  ChallengeCard,
  ChallengeCardCondition,
  CombatLog,
  ConsumableEffect,
  ConsumableEffectType,
  EquipmentStars,
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
  RewardBox,
  SecretProgressState,
  ShadowFragmentReward,
  ShadowInnateGrade,
  StatKey,
  SystemMessage,
  ShadowExtractResult,
  ShadowExpedition,
  ShadowExpeditionCommand,
  ShadowSummonTicket,
  ShadowSummonShardType,
  AchievementTicketGrade,
  SkillDefinition,
  SkillRuntimeState,
  Title,
  InfiniteTowerState,
  TowerBattleResult,
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
  getEquipmentStars,
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
  getSkillCooldownTurns,
  getSkillMastery,
  getSkillMasteryProgress,
  isHunterCombatSkill,
  normalizeSkillStates,
  recordSkillRuntimeUse,
} from './skills'
import { getMonsterIntent } from './combatIntent'
import {
  ACHIEVEMENT_SHADOWS_BY_QUEST_ID,
  SHADOW_DEFINITIONS,
  SHADOW_FRAGMENT_SUMMON_COST,
  addShadowXp,
  canAbsorbShadow,
  canDecomposeShadow,
  canEvolveShadow,
  createOwnedShadow,
  createShadowSummonTicket,
  getEquippedShadowCategoryXpBonus,
  getEquippedShadowDropBonus,
  getEquippedShadowStatBonuses,
  getEquippedShadows,
  getShadowAbsorbMaterialCount,
  getShadowDefinition,
  getShadowSlotCount,
  getShadowXpReward,
  MAX_SHADOW_ENHANCEMENT_LEVEL,
  rollShadowInnateGrade,
  rollShadowExtraction,
  SHADOW_DECOMPOSE_ESSENCE,
  SHADOW_RARITY_LABEL,
} from './shadows'
import {
  createInitialTowerState,
  getTowerFloorType,
  getTowerMonstersForFloor,
  getTowerRecommendedPower,
  calculateTowerReward,
} from './infiniteTower'
import {
  SHADOW_EXPEDITION_PARTY_MAX,
  SHADOW_EXPEDITION_PARTY_MIN,
  SHADOW_EXPEDITION_OUTCOME_LABEL,
  SHADOW_EXPEDITION_UNLOCK_DAILY_COUNT,
  createShadowExpeditionForDate,
  getTodayDailyCompletedCount,
  refreshShadowExpeditionLock,
  resolveShadowExpeditionCommand,
  resolveExpeditionMidEventChoice,
} from './shadowExpeditions'
import {
  ensureSecretProgress,
  recordSecretEvent,
  type SecretEvent,
} from './secrets'

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
  shadowEssence?: number
  shadowSummonTickets?: ShadowSummonTicket[]
  shadowSummonShards?: Partial<Record<ShadowSummonShardType, number>>
  shadowFragments?: Record<string, number>
  shadowAchievementTicketClaims?: Record<string, string>
  shadowExpeditions: ShadowExpedition[]
  lastShadowExpeditionDate?: string
  activeShadowExpeditionId?: string
  infiniteTower?: InfiniteTowerState
  rewardBoxes?: RewardBox[]
  lastDailyBoxDate?: string
  lastWeeklyBoxWeek?: string
  todayChallengeCards?: ChallengeCard[]
  selectedChallengeCardIds?: string[]
  lastChallengeCardDate?: string
  challengeCardHistory?: Record<string, { completedIds: string[]; completedCount: number }>
  skillStates?: Record<string, SkillRuntimeState>
  secretProgress?: SecretProgressState
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
  summonShadowFromTicket: (ticketId: string) => void
  summonShadowFromFragments: (definitionId: string) => void
  exchangeShadowSummonShards: (ticketType: 'normal_shadow' | 'rare_shadow' | 'role_shadow' | 'gate_named_shadow' | 'achievement_named_shadow', role?: OwnedShadow['role']) => void
  absorbShadow: (targetInstanceId: string) => void
  decomposeShadow: (shadowInstanceId: string) => void
  toggleShadowLock: (shadowInstanceId: string) => void
  toggleShadowFavorite: (shadowInstanceId: string) => void
  evolveShadow: (shadowInstanceId: string) => void
  ensureTodayShadowExpedition: () => void
  selectShadowExpeditionParty: (expeditionId: string, shadowIds: string[]) => void
  startShadowExpedition: (expeditionId: string) => void
  issueShadowExpeditionCommand: (expeditionId: string, command: ShadowExpeditionCommand) => void
  abandonShadowExpedition: (expeditionId: string) => void
  resolveShadowExpeditionMidEvent: (expeditionId: string, choiceId: string) => void

  // infinite tower
  startTowerBattle: (floor: number) => void
  resolveTowerBattle: () => void
  cancelTowerBattle: () => void
  startTowerManualBattle: (floor: number) => void
  performTowerManualBattleAction: (action: ManualBattleAction) => void
  cancelTowerManualBattle: () => void
  switchTowerManualBattleToAuto: () => void

  // rewards / challenge cards
  ensureDailyRewardSystems: () => void
  openRewardBox: (boxId: string) => void
  selectChallengeCards: (cardIds: string[]) => void

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

const applySecretProgressEvent = (
  s: GameState,
  event: SecretEvent,
  baseState: Partial<GameState> = {}
): Partial<GameState> => {
  const snapshot = { ...s, ...baseState }
  const result = recordSecretEvent(s.secretProgress, event, snapshot)
  const baseMessages = baseState.messages ?? s.messages
  const secretMessages: SystemMessage[] = result.messages.map(message => ({
    ...message,
    id: uid(),
    createdAt: todayISO(),
  }))
  const nextShadowEssence = ((baseState.shadowEssence ?? s.shadowEssence) ?? 0) + result.shadowEssenceBonus
  const nextState: Partial<GameState> = {
    ...baseState,
    secretProgress: result.progress,
    shadowEssence: nextShadowEssence,
    messages: secretMessages.length > 0 ? [...baseMessages, ...secretMessages] : baseMessages,
  }
  if (result.ownedShadows ?? baseState.ownedShadows) {
    nextState.ownedShadows = result.ownedShadows ?? baseState.ownedShadows
  }

  return nextState
}

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

type EquipmentQualitySource = 'normal' | 'weekly' | 'boss' | 'high_boss'

const rollWeightedNumber = <T extends number | string>(weights: Record<string, number>): T => {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0)
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [key, weight] of entries) {
    roll -= weight
    if (roll <= 0) return (Number.isNaN(Number(key)) ? key : Number(key)) as T
  }
  const key = entries[0]?.[0] ?? '1'
  return (Number.isNaN(Number(key)) ? key : Number(key)) as T
}

const rollEquipmentStars = (source: EquipmentQualitySource = 'normal'): EquipmentStars => {
  if (source === 'high_boss') return rollWeightedNumber<EquipmentStars>({ 1: 5, 2: 20, 3: 35, 4: 30, 5: 10 })
  if (source === 'boss') return rollWeightedNumber<EquipmentStars>({ 1: 10, 2: 30, 3: 35, 4: 20, 5: 5 })
  if (source === 'weekly') return rollWeightedNumber<EquipmentStars>({ 1: 25, 2: 38, 3: 25, 4: 10, 5: 2 })
  return rollWeightedNumber<EquipmentStars>({ 1: 45, 2: 35, 3: 15, 4: 4.5, 5: 0.5 })
}

const instantiateItem = (
  template: Omit<Item, 'id' | 'acquiredAt'>,
  qualitySource: EquipmentQualitySource = 'normal'
): Item => ({
  ...template,
  id: uid(),
  acquiredAt: todayISO(),
  equipmentStars: template.equippable === true && template.consumable !== true
    ? (template.equipmentStars ?? rollEquipmentStars(qualitySource))
    : template.equipmentStars,
})

const randomGateRewardItem = (rewardTable: GateRewardTable, titleRarityBonus = 0): Item | undefined => {
  const rarity = pickWeightedGateRarity(rewardTable, titleRarityBonus)
  const rarityPool = rarity ? ITEM_POOL.filter(item => item.rarity === rarity) : []
  const pool = rarityPool.length > 0 ? rarityPool : ITEM_POOL
  const gateFocusedPool = pool.filter(item => item.slot === 'artifact' || (item.combatSkillIds?.length ?? 0) > 0)
  const shouldPreferGateLoot = gateFocusedPool.length > 0 && Math.random() < 0.7
  const pickPool = shouldPreferGateLoot ? gateFocusedPool : pool
  const pick = pickPool[Math.floor(Math.random() * pickPool.length)]
  if (!pick) return undefined
  return instantiateItem(pick, 'normal')
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
  const qualitySource: EquipmentQualitySource = source === 'dungeon' ? 'weekly' : 'normal'
  return instantiateItem(pick, qualitySource)
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

const createSkillMasteryLog = (
  skill: SkillDefinition,
  before: SkillRuntimeState,
  after: SkillRuntimeState,
  turnNumber: number,
  waveNumber: number,
  target: BattleActorState
): BattleTurn => {
  const progress = getSkillMasteryProgress(after)
  const beforeLevel = before.masteryLevel ?? 0
  const afterLevel = after.masteryLevel ?? 0
  const progressText = progress.isMaxLevel ? 'MAX' : `${progress.currentUses}/${progress.nextLevelUses}`
  const message = afterLevel > beforeLevel
    ? `[${skill.name}] 숙련 Lv.${afterLevel} 도달. (${progressText})`
    : `[${skill.name}] 숙련 +1. (${progressText})`
  return createManualSystemLog(message, turnNumber, waveNumber, target)
}

const createMonsterIntentLog = (
  message: string,
  turnNumber: number,
  waveNumber: number,
  target: BattleActorState
): BattleTurn => createManualSystemLog(message, turnNumber, waveNumber, target)

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

const isAchievementShadowUnlockReady = (s: GameState, definitionId: string): boolean => {
  const definition = getShadowDefinition(definitionId)
  const questId = definition?.sourceQuestId
  if (!questId) return false
  const quest = s.quests.find(q => q.id === questId)
  if (quest?.type === 'main' || quest?.type === 'dungeon') return Boolean(quest.completed)
  if (quest?.type === 'daily') {
    const dailyCount = s.achievementStats.dailyCompletions.byQuestId[questId] ?? 0
    if (dailyCount >= 90) return true
  }
  if (definitionId === 'lumen-dawn-vanguard') {
    const sleepDungeonCleared = s.quests.some(q => q.id === 'dungeon-sleep-rhythm' && q.completed)
    return sleepDungeonCleared || s.achievementStats.special.earlyWakeBefore7Count >= 90
  }
  return false
}

const getAchievementDefinitionCategory = (s: Pick<GameState, 'quests'>, definitionId: string): Category | undefined => {
  const definition = getShadowDefinition(definitionId)
  if (definition?.sourceCategory) return definition.sourceCategory
  if (!definition?.sourceQuestId) return undefined
  return s.quests.find(q => q.id === definition.sourceQuestId)?.category
}

const getAchievementTicketGrade = (quest?: Quest, definitionId?: string): AchievementTicketGrade => {
  if (quest?.type === 'main' && (quest.difficulty === 'boss' || quest.difficulty === 'apex')) return 's_rank'
  if (quest?.type === 'main' && (quest.difficulty === 'elite' || quest.difficulty === 'hard')) return 'elite'
  if (quest?.type === 'main') return 'rare'
  if (definitionId === 'lumen-dawn-vanguard') return 'rare'
  return 'standard'
}

const getAchievementTicketLabel = (category: Category | undefined, grade: AchievementTicketGrade): string => {
  const categoryLabel = category ? CATEGORY_META[category]?.label ?? category : '성취'
  const gradeLabel = grade === 's_rank' ? 'S급' : grade === 'elite' ? '상급' : grade === 'rare' ? '희귀' : '일반'
  return `${categoryLabel} ${gradeLabel} 성취 네임드 소환권`
}

const buildAchievementShadowTicketGrants = (
  s: GameState
): { tickets: ShadowSummonTicket[]; messages: SystemMessage[]; claims: Record<string, string> } => {
  const ownedDefinitionIds = new Set((s.ownedShadows ?? []).map(shadow => shadow.definitionId))
  const claimed = { ...(s.shadowAchievementTicketClaims ?? {}) }
  const existingClaimKeys = new Set(Object.keys(claimed))
  const tickets: ShadowSummonTicket[] = []
  const messages: SystemMessage[] = []

  for (const definitionIds of Object.values(ACHIEVEMENT_SHADOWS_BY_QUEST_ID)) {
    for (const definitionId of definitionIds) {
      if (ownedDefinitionIds.has(definitionId)) continue
      if (existingClaimKeys.has(definitionId)) continue
      if (!isAchievementShadowUnlockReady(s, definitionId)) continue
      const definition = getShadowDefinition(definitionId)
      if (!definition) continue
      const quest = definition.sourceQuestId ? s.quests.find(q => q.id === definition.sourceQuestId) : undefined
      const category = getAchievementDefinitionCategory(s, definitionId)
      const grade = getAchievementTicketGrade(quest, definitionId)
      const ticket = createShadowSummonTicket({
        ticketType: 'category_achievement_named',
        source: 'achievement',
        category,
        grade,
        label: getAchievementTicketLabel(category, grade),
        rarityFloor: grade === 's_rank' || grade === 'elite' ? 'legendary' : 'epic',
      })
      claimed[definitionId] = ticket.id
      tickets.push(ticket)
      messages.push({
        id: uid(),
        kind: 'shadow',
        title: '성취 네임드 소환권 획득',
        lines: [
          '현실 성취가 네임드 후보 풀을 열었습니다.',
          `${ticket.label}을 획득했습니다.`,
        ],
        createdAt: todayISO(),
      })
    }
  }

  return { tickets, messages, claims: claimed }
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
  let nextShadowSummonTickets = s.shadowSummonTickets ?? []
  let nextShadowSummonShards = s.shadowSummonShards ?? {}
  let nextGateStatus = gateStatus
  let nextActiveGate = activeGate
  let gateRewards: GateReward[] = []
  let penaltyApplied: GatePenalty | undefined
  let shouldCheckUnlocks = false
  const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
  const xpAmount = getShadowXpReward(gate.rank, combatLog.result as 'victory' | 'defeat' | 'draw')
  let nextOwnedShadows = s.ownedShadows ?? []
  const shadowLevelUps: string[] = []
  if (xpAmount > 0 && equippedShadows.length > 0) {
    for (const es of equippedShadows) {
      const idx = nextOwnedShadows.findIndex(sh => sh.instanceId === es.instanceId)
      if (idx === -1) continue
      const result = addShadowXp(nextOwnedShadows[idx], xpAmount)
      nextOwnedShadows = nextOwnedShadows.map((sh, i) => i === idx ? result.shadow : sh)
      if (result.leveledUp) {
        shadowLevelUps.push(`${es.name} Lv.${result.newLevel}`)
      }
    }
  }

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
      const summonBonus = rollSmallSummonReward('gate')
      nextShadowSummonTickets = [...nextShadowSummonTickets, ...(summonBonus.shadowSummonTickets ?? [])]
      nextShadowSummonShards = addShadowSummonShards(nextShadowSummonShards, summonBonus.shadowSummonShards)
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
    source: 'gate',
  }

  const finalMessages = shadowLevelUps.length > 0
    ? [...s.messages, {
        id: uid(),
        kind: 'shadow' as const,
        title: '그림자 성장',
        lines: [`출전 그림자들이 ${xpAmount} XP를 획득했습니다.`, ...shadowLevelUps],
        createdAt: todayISO(),
      }]
    : s.messages

  const baseState: Partial<GameState> = {
      hunter: nextHunter,
      items: nextItems,
      shadowSummonTickets: nextShadowSummonTickets,
      shadowSummonShards: nextShadowSummonShards,
      ownedShadows: nextOwnedShadows,
      gateStatus: nextGateStatus,
      activeGate: nextActiveGate,
      activeConsumableEffects: nextConsumables,
      combatLogs: [finalLog, ...s.combatLogs].slice(0, 20),
      messages: finalMessages,
      manualBattleSession: undefined,
    }

  return {
    finalLog,
    shouldCheckUnlocks,
    state: applySecretProgressEvent(s, { context: 'gate', outcome: combatLog.result }, baseState),
  }
}

const syncTodayShadowExpeditionState = (s: GameState): Pick<GameState, 'shadowExpeditions' | 'lastShadowExpeditionDate' | 'activeShadowExpeditionId'> => {
  const dateKey = todayKey()
  const completedDailyCount = getTodayDailyCompletedCount(s.achievementStats, dateKey)
  const now = new Date()
  let hasToday = false
  const shadowExpeditions = (s.shadowExpeditions ?? []).map(expedition => {
    if (expedition.date === dateKey) {
      hasToday = true
      return refreshShadowExpeditionLock(expedition, completedDailyCount, now)
    }
    return refreshShadowExpeditionLock(expedition, SHADOW_EXPEDITION_UNLOCK_DAILY_COUNT, now)
  })
  if (!hasToday) {
    shadowExpeditions.unshift(refreshShadowExpeditionLock(createShadowExpeditionForDate(dateKey), completedDailyCount, now))
  }
  const activeShadowExpeditionId = shadowExpeditions.some(
    expedition => expedition.id === s.activeShadowExpeditionId && expedition.status === 'in_progress'
  )
    ? s.activeShadowExpeditionId
    : undefined
  return {
    shadowExpeditions: shadowExpeditions.slice(0, 14),
    lastShadowExpeditionDate: dateKey,
    activeShadowExpeditionId,
  }
}

type ChallengeProgressEvent = {
  questCompleted?: Quest
  gateAttempt?: boolean
  gateVictory?: boolean
  towerAttempt?: boolean
  towerClear?: boolean
  shadowExpeditionCompleted?: boolean
  boxOpened?: boolean
}

const getWeekKey = (date = new Date()): string => {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day + 3)
  const firstThursday = new Date(d.getFullYear(), 0, 4)
  const firstDay = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3)
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / 604_800_000)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

const countTodayDailyCompletions = (s: GameState): number =>
  s.achievementStats.dailyHistory[todayKey()]?.completedDailyCount ?? 0

const countTodayDailyCategoryCompletions = (s: GameState, categories: Category[]): number => {
  const ids = s.achievementStats.dailyHistory[todayKey()]?.completedDailyQuestIds ?? []
  return ids.filter(id => {
    const quest = s.quests.find(q => q.id === id)
    return quest ? categories.includes(quest.category) : false
  }).length
}

const createChallengeCard = (
  date: string,
  slug: string,
  difficulty: ChallengeCard['difficulty'],
  category: ChallengeCard['category'],
  title: string,
  description: string,
  condition: ChallengeCardCondition
): ChallengeCard => {
  const rewardByDifficulty: Record<ChallengeCard['difficulty'], ChallengeCard['reward']> = {
    easy: { hunterXp: 15, shadowEssence: 1, boxUpgradePoints: 1 },
    normal: { hunterXp: 35, shadowEssence: 2, boxUpgradePoints: 2 },
    hard: { hunterXp: 80, shadowEssence: 5, boxUpgradePoints: 3 },
  }
  return {
    id: `${date}-${slug}`,
    date,
    title,
    description,
    difficulty,
    category,
    condition,
    reward: rewardByDifficulty[difficulty],
    status: 'candidate',
  }
}

const pickChallengeCards = <T,>(pool: T[], count: number): T[] => {
  const copy = [...pool]
  const picked: T[] = []
  while (picked.length < count && copy.length > 0) {
    picked.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  return picked
}

const generateChallengeCardsForToday = (quests: Quest[], date = todayKey()): ChallengeCard[] => {
  const hasWorkout = quests.some(q => q.type === 'daily' && (q.category === 'workout' || q.category === 'health'))
  const hasStudy = quests.some(q => q.type === 'daily' && (q.category === 'study' || q.category === 'career' || q.category === 'finance'))
  const easyPool = [
    createChallengeCard(date, 'daily-1', 'easy', 'habit', 'Daily 1개 완료', '오늘 가능한 Daily 퀘스트 1개를 완료합니다.', { type: 'completeAnyDaily', target: 1 }),
    createChallengeCard(date, 'open-box', 'easy', 'life', '박스 1개 열기', '오늘 받은 박스나 보관 중인 박스를 직접 엽니다.', { type: 'openBox', target: 1 }),
    createChallengeCard(date, 'shadow-start', 'easy', 'shadow', '그림자 원정 마무리', '그림자 원정을 1회 완료합니다.', { type: 'completeShadowExpedition', target: 1 }),
    createChallengeCard(date, 'workout-1', 'easy', 'workout', '몸 깨우기', '운동 또는 건강 Daily 퀘스트 1개를 완료합니다.', { type: 'completeQuestCategory', category: hasWorkout ? 'workout' : 'health', target: 1 }),
    createChallengeCard(date, 'study-1', 'easy', 'study', '지식 정리', '학습, 커리어, 금융 Daily 퀘스트 1개를 완료합니다.', { type: 'completeQuestCategory', category: hasStudy ? 'study' : 'finance', target: 1 }),
  ]
  const normalPool = [
    createChallengeCard(date, 'daily-3', 'normal', 'habit', 'Daily 3개 완료', '오늘 가능한 Daily 퀘스트 3개를 완료합니다.', { type: 'completeDailyCount', target: 3 }),
    createChallengeCard(date, 'gate-attempt', 'normal', 'gate', '게이트 진입', '게이트 전투에 1회 도전합니다.', { type: 'completeGateAttempt', target: 1 }),
    createChallengeCard(date, 'tower-attempt', 'normal', 'tower', '탑 등반', '무한의 탑에 1회 도전합니다.', { type: 'completeTowerAttempt', target: 1 }),
    createChallengeCard(date, 'study-2', 'normal', 'finance', '두뇌 예열', '학습, 커리어, 금융 Daily 퀘스트를 합산 2개 완료합니다.', { type: 'completeQuestCategory', category: 'study', target: 2 }),
    createChallengeCard(date, 'workout-2', 'normal', 'workout', '훈련 루틴', '운동 또는 건강 Daily 퀘스트를 합산 2개 완료합니다.', { type: 'completeQuestCategory', category: 'workout', target: 2 }),
  ]
  const hardPool = [
    createChallengeCard(date, 'daily-5', 'hard', 'habit', 'Daily 5개 완료', '오늘 가능한 Daily 퀘스트 5개를 완료합니다.', { type: 'completeDailyCount', target: 5 }),
    createChallengeCard(date, 'gate-win', 'hard', 'gate', '게이트 승리', '게이트 전투에서 승리합니다.', { type: 'completeGateVictory', target: 1 }),
    createChallengeCard(date, 'tower-clear', 'hard', 'tower', '한 층 돌파', '무한의 탑 전투에서 승리합니다.', { type: 'completeTowerClear', target: 1 }),
    createChallengeCard(date, 'body-mind', 'hard', 'life', '몸과 머리 모두 사용', '운동/건강 1개와 학습/커리어/금융 1개를 각각 완료합니다.', { type: 'completeWorkoutAndStudy', target: 1 }),
  ]

  return [
    ...pickChallengeCards(easyPool, 2),
    ...pickChallengeCards(normalPool, 2),
    ...pickChallengeCards(hardPool, 1),
  ]
}

const getCompletedSelectedChallengeCards = (s: GameState): ChallengeCard[] => {
  const selected = new Set(s.selectedChallengeCardIds ?? [])
  return (s.todayChallengeCards ?? []).filter(card => selected.has(card.id) && card.status === 'completed')
}

const getDailyBoxTierForState = (s: GameState): BoxTier => {
  const upgradePoints = getCompletedSelectedChallengeCards(s)
    .reduce((sum, card) => sum + card.reward.boxUpgradePoints, 0)
  if (upgradePoints >= 4) return 'superior'
  if (upgradePoints >= 2) return 'enhanced'
  return 'normal'
}

const createRewardBox = (
  type: RewardBox['type'],
  tier: BoxTier,
  source: RewardBox['source'],
  label: string,
  floor?: number
): RewardBox => ({
  id: `${type}-box-${floor ?? todayKey()}-${Date.now()}-${Math.floor(Math.random() * 100_000)}`,
  type,
  tier,
  source,
  createdAt: todayISO(),
  status: 'available',
  label,
  floor,
})

const getCurrentWeekChallengeCompletedCount = (history: GameState['challengeCardHistory'] = {}): number => {
  const now = new Date()
  let total = 0
  for (let i = 0; i < 7; i++) {
    const date = addDays(now, -i)
    if (getWeekKey(date) === getWeekKey(now)) {
      total += history[getDateKey(date)]?.completedCount ?? 0
    }
  }
  return total
}

const addWeeklyBoxIfEligible = (
  rewardBoxes: RewardBox[],
  lastWeeklyBoxWeek: string | undefined,
  history: GameState['challengeCardHistory'] = {}
): Pick<GameState, 'rewardBoxes' | 'lastWeeklyBoxWeek'> => {
  const weekKey = getWeekKey()
  if (lastWeeklyBoxWeek === weekKey || getCurrentWeekChallengeCompletedCount(history) < 7) {
    return { rewardBoxes, lastWeeklyBoxWeek }
  }
  return {
    rewardBoxes: [
      createRewardBox('weekly', 'superior', 'weekly_activity', `${weekKey} 주간 활동 박스`),
      ...rewardBoxes,
    ],
    lastWeeklyBoxWeek: weekKey,
  }
}

const getItemFromPool = (
  predicate: (item: Omit<Item, 'id' | 'acquiredAt'>) => boolean,
  maxRarity?: Item['rarity'],
  qualitySource: EquipmentQualitySource = 'normal'
): Item | undefined => {
  const rarityOrder: Item['rarity'][] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
  const maxIndex = maxRarity ? rarityOrder.indexOf(maxRarity) : rarityOrder.length - 1
  const pool = ITEM_POOL.filter(item => predicate(item) && rarityOrder.indexOf(item.rarity) <= maxIndex)
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return pick ? instantiateItem(pick, qualitySource) : undefined
}

const shadowRarityOrder: Array<OwnedShadow['rarity']> = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const pickStandardShadowDefinition = (
  maxRarity: OwnedShadow['rarity'] = 'rare'
) => {
  const maxIndex = shadowRarityOrder.indexOf(maxRarity)
  const pool = SHADOW_DEFINITIONS.filter(def =>
    def.sourceType === 'gate_extract' &&
    shadowRarityOrder.indexOf(def.rarity) <= maxIndex
  )
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]
}

const rollShadowFragmentReward = (
  maxRarity: OwnedShadow['rarity'],
  amount: number
): ShadowFragmentReward | undefined => {
  const definition = pickStandardShadowDefinition(maxRarity)
  return definition ? { definitionId: definition.id, amount } : undefined
}

const addShadowFragments = (
  current: Record<string, number> | undefined,
  rewards: ShadowFragmentReward[] = []
): Record<string, number> => {
  const next = { ...(current ?? {}) }
  for (const reward of rewards) {
    next[reward.definitionId] = (next[reward.definitionId] ?? 0) + reward.amount
  }
  return next
}

const addShadowSummonShards = (
  current: Partial<Record<ShadowSummonShardType, number>> | undefined,
  rewards: Partial<Record<ShadowSummonShardType, number>> = {}
): Partial<Record<ShadowSummonShardType, number>> => {
  const next = { ...(current ?? {}) }
  for (const [type, amount] of Object.entries(rewards) as Array<[ShadowSummonShardType, number]>) {
    next[type] = (next[type] ?? 0) + amount
  }
  return next
}

const createRoleTicket = (role?: OwnedShadow['role'], source: ShadowSummonTicket['source'] = 'system'): ShadowSummonTicket =>
  createShadowSummonTicket({ ticketType: 'role_shadow', source, role: role ?? 'support' })

const rollBoxShadowSummonReward = (box: RewardBox, tierMultiplier: number): Pick<BoxReward, 'shadowSummonTickets' | 'shadowSummonShards'> => {
  const floor = box.floor ?? 0
  const highFloorMult = box.type === 'boss' && floor >= 30 ? 2 : box.type === 'boss' && floor >= 20 ? 1.5 : 1
  const mult = tierMultiplier
  const tickets: ShadowSummonTicket[] = []
  const shards: Partial<Record<ShadowSummonShardType, number>> = {}
  const addShard = (type: ShadowSummonShardType, amount = 1) => {
    shards[type] = (shards[type] ?? 0) + amount
  }
  const roll = (chance: number) => Math.random() < chance

  if (box.type === 'daily') {
    if (roll(0.03 * mult)) addShard('normal', 1)
    if (roll(0.005 * mult)) addShard('rare', 1)
    if (roll(0.002 * mult)) tickets.push(createShadowSummonTicket({ ticketType: 'normal_shadow', source: 'reward_box' }))
    if (roll(0.0003 * mult)) tickets.push(createShadowSummonTicket({ ticketType: 'rare_shadow', source: 'reward_box' }))
    if (roll(Math.min(0.00005, 0.00005 * mult))) addShard('achievement_named', 1)
  } else if (box.type === 'weekly') {
    if (roll(0.10 * mult)) addShard('normal', 2)
    if (roll(0.03 * mult)) addShard('rare', 1)
    if (roll(0.02 * mult)) tickets.push(createShadowSummonTicket({ ticketType: 'normal_shadow', source: 'reward_box' }))
    if (roll(0.005 * mult)) tickets.push(createShadowSummonTicket({ ticketType: 'rare_shadow', source: 'reward_box' }))
    if (roll(0.003 * mult)) tickets.push(createRoleTicket(['assault', 'guard', 'scout', 'analyst', 'support', 'hunter'][Math.floor(Math.random() * 6)] as OwnedShadow['role'], 'reward_box'))
    if (roll(0.001 * mult)) addShard('named', 1)
    if (roll(0.0002)) tickets.push(createShadowSummonTicket({ ticketType: 'gate_named_shadow', source: 'reward_box' }))
  } else {
    const bossMult = mult * highFloorMult
    if (roll(0.20 * bossMult)) addShard('normal', 2)
    if (roll(0.08 * bossMult)) addShard('rare', 1)
    if (roll(0.02 * bossMult)) addShard('named', 1)
    if (roll(0.05 * bossMult)) tickets.push(createShadowSummonTicket({ ticketType: 'normal_shadow', source: 'reward_box' }))
    if (roll(0.02 * bossMult)) tickets.push(createShadowSummonTicket({ ticketType: 'rare_shadow', source: 'reward_box' }))
    if (roll(0.01 * bossMult)) tickets.push(createRoleTicket(['assault', 'guard', 'scout', 'analyst', 'support', 'hunter'][Math.floor(Math.random() * 6)] as OwnedShadow['role'], 'reward_box'))
    if (roll(0.003 * bossMult)) tickets.push(createShadowSummonTicket({ ticketType: 'gate_named_shadow', source: 'reward_box' }))
    if (roll(Math.min(0.002, 0.0005 * bossMult))) tickets.push(createShadowSummonTicket({ ticketType: 'achievement_named_shadow', source: 'reward_box', grade: 'standard' }))
  }

  return {
    shadowSummonTickets: tickets.length > 0 ? tickets : undefined,
    shadowSummonShards: Object.keys(shards).length > 0 ? shards : undefined,
  }
}

const getAchievementCandidatePool = (s: GameState, ticket: ShadowSummonTicket) => {
  const category = ticket.category
  const grade = ticket.grade ?? 'standard'
  const minRarity = grade === 's_rank' || grade === 'elite' ? 'legendary' : 'epic'
  const minIndex = shadowRarityOrder.indexOf(minRarity)
  const pool = SHADOW_DEFINITIONS.filter(def => {
    if (!def.isAchievementNamed) return false
    const defCategory = def.sourceCategory ?? (def.sourceQuestId ? s.quests.find(q => q.id === def.sourceQuestId)?.category : undefined)
    if (category && defCategory && defCategory !== category) return false
    if (category && !defCategory) return false
    return shadowRarityOrder.indexOf(def.rarity) >= minIndex
  })
  if (pool.length > 0) return pool
  return SHADOW_DEFINITIONS.filter(def => def.isAchievementNamed && shadowRarityOrder.indexOf(def.rarity) >= minIndex)
}

const getTicketCandidatePool = (s: GameState, ticket: ShadowSummonTicket) => {
  if (ticket.definitionId) {
    const definition = getShadowDefinition(ticket.definitionId)
    return definition ? [definition] : []
  }
  if (ticket.ticketType === 'category_achievement_named' || ticket.ticketType === 'achievement_named_shadow') {
    return getAchievementCandidatePool(s, ticket)
  }
  if (ticket.ticketType === 'gate_named_shadow') {
    return SHADOW_DEFINITIONS.filter(def => def.isGateNamed)
  }
  const rarityLimit = ticket.ticketType === 'rare_shadow' ? 'epic' : 'rare'
  const maxIndex = shadowRarityOrder.indexOf(rarityLimit)
  return SHADOW_DEFINITIONS.filter(def =>
    def.sourceType === 'gate_extract' &&
    shadowRarityOrder.indexOf(def.rarity) <= maxIndex &&
    (!ticket.role || def.role === ticket.role)
  )
}

const innateSourceForTicket = (ticket: ShadowSummonTicket): Parameters<typeof rollShadowInnateGrade>[0] => {
  if (ticket.grade === 's_rank') return 'main_s_achievement_ticket'
  if (ticket.ticketType === 'category_achievement_named' || ticket.ticketType === 'achievement_named_shadow') return 'achievement_ticket'
  if (ticket.ticketType === 'gate_named_shadow') return 'gate_named_ticket'
  if (ticket.ticketType === 'role_shadow') return 'role_ticket'
  if (ticket.ticketType === 'rare_shadow') return 'rare_ticket'
  return 'normal_ticket'
}

const shardExchangeCost = (
  ticketType: 'normal_shadow' | 'rare_shadow' | 'role_shadow' | 'gate_named_shadow' | 'achievement_named_shadow'
): Partial<Record<ShadowSummonShardType, number>> => {
  if (ticketType === 'normal_shadow') return { normal: 10 }
  if (ticketType === 'rare_shadow') return { rare: 10 }
  if (ticketType === 'role_shadow') return { rare: 15 }
  if (ticketType === 'gate_named_shadow') return { named: 20 }
  return { achievement_named: 30 }
}

const rollSmallSummonReward = (source: 'challenge_card' | 'gate'): Pick<BoxReward, 'shadowSummonTickets' | 'shadowSummonShards'> => {
  const tickets: ShadowSummonTicket[] = []
  const shards: Partial<Record<ShadowSummonShardType, number>> = {}
  const addShard = (type: ShadowSummonShardType, amount = 1) => { shards[type] = (shards[type] ?? 0) + amount }
  if (source === 'challenge_card') {
    if (Math.random() < 0.03) addShard('normal', 1)
    if (Math.random() < 0.007) addShard('rare', 1)
    if (Math.random() < 0.002) tickets.push(createShadowSummonTicket({ ticketType: 'normal_shadow', source: 'challenge_card' }))
    if (Math.random() < 0.0005) tickets.push(createShadowSummonTicket({ ticketType: 'rare_shadow', source: 'challenge_card' }))
  } else {
    if (Math.random() < 0.02) addShard('normal', 1)
    if (Math.random() < 0.003) addShard('rare', 1)
    if (Math.random() < 0.001) tickets.push(createShadowSummonTicket({ ticketType: 'normal_shadow', source: 'gate' }))
    if (Math.random() < 0.0005) addShard('named', 1)
  }
  return {
    shadowSummonTickets: tickets.length > 0 ? tickets : undefined,
    shadowSummonShards: Object.keys(shards).length > 0 ? shards : undefined,
  }
}

const rollBoxReward = (s: GameState, box: RewardBox): BoxReward => {
  const tierMultiplier: Record<BoxTier, number> = {
    normal: 1,
    enhanced: 1.25,
    superior: 1.55,
    epic: 1.9,
  }
  const mult = tierMultiplier[box.tier]
  const floor = box.floor ?? 0
  const qualitySource: EquipmentQualitySource =
    box.type === 'boss' && floor >= 20 ? 'high_boss' :
    box.type === 'boss' ? 'boss' :
    box.type === 'weekly' ? 'weekly' :
    'normal'
  const statKeys: StatKey[] = ['STR', 'VIT', 'AGI', 'INT', 'PER', 'SEN']
  const stat = statKeys[Math.floor(Math.random() * statKeys.length)]
  const reward: BoxReward = {
    statRewards: { [stat]: roundStatValue((box.type === 'daily' ? 0.05 : 0.12) * mult) },
    items: [],
    consumables: [],
  }

  if (box.type === 'daily') {
    reward.hunterXp = Math.round(24 * mult)
    reward.shadowEssence = Math.max(1, Math.round((1 + Math.floor(Math.random() * 3)) * mult))
    if (Math.random() < 0.08 * mult) {
      const consumable = getItemFromPool(item => item.consumable === true, 'rare', qualitySource)
      if (consumable) reward.consumables?.push(consumable)
    }
    if (Math.random() < 0.055 * mult) {
      const equipment = getItemFromPool(item => item.equippable === true && item.consumable !== true, box.tier === 'superior' ? 'rare' : 'uncommon', qualitySource)
      if (equipment) reward.items?.push(equipment)
    }
    reward.message = '오늘의 루틴에 작은 추진력이 더해졌습니다.'
  } else if (box.type === 'weekly') {
    reward.hunterXp = Math.round(115 * mult)
    reward.shadowEssence = 5 + Math.floor(Math.random() * 11)
    if (Math.random() < 0.55) {
      const consumable = getItemFromPool(item => item.consumable === true, 'epic', qualitySource)
      if (consumable) reward.consumables?.push(consumable)
    }
    if (Math.random() < 0.42) {
      const equipment = getItemFromPool(item => item.equippable === true && item.consumable !== true, 'rare', qualitySource)
      if (equipment) reward.items?.push(equipment)
    }
    reward.message = '이번 주의 선택과 완료가 묶여 보상으로 돌아왔습니다.'
  } else {
    const rewardFloor = box.floor ?? 5
    reward.hunterXp = Math.round((30 + rewardFloor * 3) * mult)
    reward.shadowEssence = Math.round((5 + rewardFloor / 2) * mult)
    reward.statRewards = { [stat]: roundStatValue((0.16 + rewardFloor * 0.003) * mult) }
    if (Math.random() < 0.28) {
      const consumable = getItemFromPool(item => item.consumable === true, 'epic', qualitySource)
      if (consumable) reward.consumables?.push(consumable)
    }
    if (Math.random() < (box.tier === 'epic' ? 0.78 : 0.62)) {
      const equipment = getItemFromPool(item => item.equippable === true && item.consumable !== true, box.tier === 'epic' ? 'epic' : 'rare', qualitySource)
      if (equipment) reward.items?.push(equipment)
    }
    reward.message = `무한의 탑 ${rewardFloor}층 보스의 잔향이 담겨 있습니다.`
  }

  const summonReward = rollBoxShadowSummonReward(box, mult)
  reward.shadowSummonTickets = summonReward.shadowSummonTickets
  reward.shadowSummonShards = summonReward.shadowSummonShards

  reward.items = reward.items?.filter(Boolean)
  reward.consumables = reward.consumables?.filter(Boolean)
  if (reward.items?.length === 0) delete reward.items
  if (reward.consumables?.length === 0) delete reward.consumables
  return reward
}

const isChallengeConditionMet = (s: GameState, card: ChallengeCard, event: ChallengeProgressEvent): boolean => {
  const target = card.condition.target ?? 1
  switch (card.condition.type) {
    case 'completeAnyDaily':
    case 'completeDailyCount':
      return countTodayDailyCompletions(s) >= target
    case 'completeQuestCategory': {
      const category = card.condition.category
      if (category === 'workout' || category === 'health') {
        return countTodayDailyCategoryCompletions(s, ['workout', 'health']) >= target
      }
      if (category === 'study' || category === 'career' || category === 'finance') {
        return countTodayDailyCategoryCompletions(s, ['study', 'career', 'finance']) >= target
      }
      return category ? countTodayDailyCategoryCompletions(s, [category]) >= target : false
    }
    case 'completeGateAttempt':
      return Boolean(event.gateAttempt || event.gateVictory)
    case 'completeGateVictory':
      return Boolean(event.gateVictory)
    case 'completeShadowExpedition':
      return Boolean(event.shadowExpeditionCompleted)
    case 'completeTowerAttempt':
      return Boolean(event.towerAttempt || event.towerClear)
    case 'completeTowerClear':
      return Boolean(event.towerClear)
    case 'openBox':
      return Boolean(event.boxOpened)
    case 'completeWorkoutAndStudy':
      return countTodayDailyCategoryCompletions(s, ['workout', 'health']) >= 1 &&
        countTodayDailyCategoryCompletions(s, ['study', 'career', 'finance']) >= 1
    default:
      return false
  }
}

const applyChallengeProgress = (s: GameState, event: ChallengeProgressEvent): Partial<GameState> => {
  const date = todayKey()
  const selected = new Set(s.selectedChallengeCardIds ?? [])
  const cards = s.todayChallengeCards ?? []
  if (cards.length === 0 || selected.size === 0) return {}

  const completedNow: ChallengeCard[] = []
  const nextCards = cards.map(card => {
    if (card.date !== date || card.status !== 'selected' || !selected.has(card.id)) return card
    if (!isChallengeConditionMet(s, card, event)) return card
    const completed = { ...card, status: 'completed' as const, completedAt: todayISO() }
    completedNow.push(completed)
    return completed
  })
  if (completedNow.length === 0) return {}

  let nextHunter = s.hunter
  let nextShadowEssence = s.shadowEssence ?? 0
  const nextMessages: SystemMessage[] = []
  for (const card of completedNow) {
    const xpResult = applyXp(nextHunter, card.reward.hunterXp, 'challenge')
    nextHunter = xpResult.hunter
    nextShadowEssence += card.reward.shadowEssence
    nextMessages.push({
      id: uid(),
      kind: 'quest',
      title: '도전 카드 완료',
      lines: [
        `[${card.title}]`,
        `XP +${card.reward.hunterXp}`,
        `그림자 정수 +${card.reward.shadowEssence}`,
        `박스 강화 +${card.reward.boxUpgradePoints}`,
      ],
      createdAt: todayISO(),
    })
    if (xpResult.outcome?.leveledUp) {
      nextMessages.push({
        id: uid(),
        kind: 'levelup',
        title: 'LEVEL UP',
        lines: [
          `Lv.${s.hunter.level} -> Lv.${xpResult.outcome.newLevel}`,
          `자동 분배: ${formatStatGains(xpResult.outcome.autoStatGains)}`,
          `자유 배분권 +${xpResult.outcome.freeStatPointsGained}`,
        ],
        createdAt: todayISO(),
      })
    }
  }

  const oldHistory = s.challengeCardHistory ?? {}
  const oldDay = oldHistory[date] ?? { completedIds: [], completedCount: 0 }
  const completedIds = Array.from(new Set([...oldDay.completedIds, ...completedNow.map(card => card.id)]))
  const completedThreeNow = oldDay.completedCount < 3 && completedIds.length >= 3
  const summonBonus = completedThreeNow ? rollSmallSummonReward('challenge_card') : {}
  if (summonBonus.shadowSummonTickets?.length || summonBonus.shadowSummonShards) {
    nextMessages.push({
      id: uid(),
      kind: 'shadow',
      title: '도전 카드 소환 보너스',
      lines: [
        ...(summonBonus.shadowSummonTickets ?? []).map(ticket => ticket.label),
        ...Object.entries(summonBonus.shadowSummonShards ?? {}).map(([type, amount]) => `${type} 조각 +${amount}`),
      ],
      createdAt: todayISO(),
    })
  }
  const challengeCardHistory = {
    ...oldHistory,
    [date]: {
      completedIds,
      completedCount: completedIds.length,
    },
  }
  const weekly = addWeeklyBoxIfEligible(s.rewardBoxes ?? [], s.lastWeeklyBoxWeek, challengeCardHistory)

  return applySecretProgressEvent(s, { context: 'rank', challengeCardsCompleted: completedNow.length }, {
    hunter: nextHunter,
    shadowEssence: nextShadowEssence,
    todayChallengeCards: nextCards,
    challengeCardHistory,
    rewardBoxes: weekly.rewardBoxes,
    lastWeeklyBoxWeek: weekly.lastWeeklyBoxWeek,
    shadowSummonTickets: [...(s.shadowSummonTickets ?? []), ...(summonBonus.shadowSummonTickets ?? [])],
    shadowSummonShards: addShadowSummonShards(s.shadowSummonShards, summonBonus.shadowSummonShards),
    messages: [...s.messages, ...nextMessages],
  })
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
      shadowEssence: 0,
      shadowSummonTickets: [],
      shadowSummonShards: {},
      shadowFragments: {},
      shadowAchievementTicketClaims: {},
      shadowExpeditions: [],
      lastShadowExpeditionDate: undefined,
      activeShadowExpeditionId: undefined,
      rewardBoxes: [],
      lastDailyBoxDate: undefined,
      lastWeeklyBoxWeek: undefined,
      todayChallengeCards: [],
      selectedChallengeCardIds: [],
      lastChallengeCardDate: undefined,
      challengeCardHistory: {},
      skillStates: {},
      secretProgress: undefined,
      initialized: false,

      setHunterName: (name) => set((s) => ({ hunter: { ...s.hunter, name } })),
      setHunterJob: (job) => set((s) => ({ hunter: { ...s.hunter, job } })),

      ensureDailyRewardSystems: () => set((s) => {
        const date = todayKey()
        let rewardBoxes = s.rewardBoxes ?? []
        let lastDailyBoxDate = s.lastDailyBoxDate
        let todayChallengeCards = s.todayChallengeCards ?? []
        let selectedChallengeCardIds = s.selectedChallengeCardIds ?? []
        let lastChallengeCardDate = s.lastChallengeCardDate

        if (lastChallengeCardDate !== date) {
          todayChallengeCards = generateChallengeCardsForToday(s.quests, date)
          selectedChallengeCardIds = []
          lastChallengeCardDate = date
        }

        if (lastDailyBoxDate !== date) {
          rewardBoxes = [
            createRewardBox('daily', 'normal', 'daily_login', `${date} 일일 박스`),
            ...rewardBoxes,
          ].slice(0, 30)
          lastDailyBoxDate = date
        }

        const weekly = addWeeklyBoxIfEligible(rewardBoxes, s.lastWeeklyBoxWeek, s.challengeCardHistory ?? {})

        return {
          rewardBoxes: weekly.rewardBoxes,
          lastDailyBoxDate,
          lastWeeklyBoxWeek: weekly.lastWeeklyBoxWeek,
          todayChallengeCards,
          selectedChallengeCardIds,
          lastChallengeCardDate,
        }
      }),

      selectChallengeCards: (cardIds) => set((s) => {
        const date = todayKey()
        const cards = s.todayChallengeCards ?? []
        if (s.lastChallengeCardDate !== date || cards.length === 0) {
          return {
            todayChallengeCards: generateChallengeCardsForToday(s.quests, date),
            selectedChallengeCardIds: [],
            lastChallengeCardDate: date,
          }
        }
        const alreadySelected = cards.some(card => card.status === 'selected' || card.status === 'completed')
        if (alreadySelected) return {}
        const validIds = Array.from(new Set(cardIds)).filter(id => cards.some(card => card.id === id)).slice(0, 3)
        if (validIds.length !== 3) return {}
        const now = todayISO()
        return {
          selectedChallengeCardIds: validIds,
          todayChallengeCards: cards.map(card =>
            validIds.includes(card.id) ? { ...card, status: 'selected' as const, selectedAt: now } : card
          ),
        }
      }),

      openRewardBox: (boxId) => {
        const s = get()
        const boxes = s.rewardBoxes ?? []
        const box = boxes.find(item => item.id === boxId)
        if (!box || box.status !== 'available') return

        const effectiveTier = box.type === 'daily' && box.label.startsWith(todayKey())
          ? getDailyBoxTierForState(s)
          : box.tier
        const effectiveBox = { ...box, tier: effectiveTier }
        const reward = rollBoxReward(s, effectiveBox)

        let nextHunter = s.hunter
        if (reward.hunterXp && reward.hunterXp > 0) {
          const xpResult = applyXp(nextHunter, reward.hunterXp, 'challenge')
          nextHunter = xpResult.hunter
        }
        const nextStats = { ...nextHunter.stats }
        for (const [stat, value] of Object.entries(reward.statRewards ?? {})) {
          nextStats[stat as StatKey] = roundStatValue(nextStats[stat as StatKey] + (value ?? 0))
        }
        nextHunter = { ...nextHunter, stats: nextStats }

        const rewardItems = [...(reward.items ?? []), ...(reward.consumables ?? [])]
        set(applySecretProgressEvent(s, { context: 'box', boxType: effectiveBox.type, source: effectiveBox.source }, {
          hunter: nextHunter,
          shadowEssence: (s.shadowEssence ?? 0) + (reward.shadowEssence ?? 0),
          shadowSummonTickets: [...(s.shadowSummonTickets ?? []), ...(reward.shadowSummonTickets ?? [])],
          shadowSummonShards: addShadowSummonShards(s.shadowSummonShards, reward.shadowSummonShards),
          shadowFragments: addShadowFragments(s.shadowFragments, reward.shadowFragments),
          items: [...s.items, ...rewardItems],
          rewardBoxes: boxes.map(item => item.id === boxId
            ? { ...effectiveBox, status: 'opened' as const, openedAt: todayISO(), reward }
            : item
          ),
        }))

        setTimeout(() => {
          set(current => applyChallengeProgress(current, { boxOpened: true }))
          get().checkTitleUnlocks()
          get().checkJobAwakening()
        }, 0)
      },

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
          source === 'daily_open' ? 0.15 :
          source === 'daily_completion' ? 0.18 :
          source === 'random_completion' ? 0.10 :
          source === 'dungeon_clear' ? 0.75 :
          source === 'hard_dungeon_clear' ? 0.90 :
          1.0
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

        const xpAmount = getShadowXpReward(gate.rank, combatLog.result as 'victory' | 'defeat' | 'draw')
        let nextOwnedShadows = s.ownedShadows ?? []
        if (xpAmount > 0 && equippedShadows.length > 0) {
          for (const es of equippedShadows) {
            const idx = nextOwnedShadows.findIndex(sh => sh.instanceId === es.instanceId)
            if (idx === -1) continue
            const result = addShadowXp(nextOwnedShadows[idx], xpAmount)
            nextOwnedShadows = nextOwnedShadows.map((sh, i) => i === idx ? result.shadow : sh)
            if (result.leveledUp) {
              newMessages.push({
                id: uid(),
                kind: 'shadow' as const,
                title: '그림자 성장',
                lines: [`[${es.name}]이(가) Lv.${result.newLevel}이(가) 되었습니다.`],
                createdAt: todayISO(),
              })
            }
          }
        }

        const finalLog: CombatLog = {
          ...combatLog,
          rewards: gateRewards,
          penaltyApplied,
          source: 'gate',
        }

        set({
          hunter: nextHunter,
          items: nextItems,
          ownedShadows: nextOwnedShadows,
          gateStatus: nextGateStatus,
          activeGate: nextActiveGate,
          activeConsumableEffects: nextConsumables,
          combatLogs: [finalLog, ...s.combatLogs].slice(0, 20),
          // Gate battle outcome is revealed in GatePanel one log line at a time.
          // Pushing result modals here would spoil the combat reveal immediately.
          messages: [...s.messages, ...newMessages],
        })

        if (combatLog.result === 'victory') {
          setTimeout(() => {
            set(current => applyChallengeProgress(current, { gateAttempt: true, gateVictory: true }))
            get().checkTitleUnlocks()
            get().checkJobAwakening()
          }, 0)
        } else {
          setTimeout(() => {
            set(current => applyChallengeProgress(current, { gateAttempt: true }))
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
          includeBasicKit: true,
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
          includeBasicKit: true,
        })
        const playerSkillIds = ensureBasicAttack(playerSkills)
          .filter(isHunterCombatSkill)
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
        let nextSkillStates = s.skillStates ?? {}
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
          const mastery = playerUsedSkill ? getSkillMastery(nextSkillStates, skill.id) : undefined
          let afterMastery: SkillRuntimeState | undefined

          const resolved = resolveAction({
            actor: player,
            target: monster,
            skill,
            activeEffects,
            rng: Math.random,
            turnNumber: logs.length + 1,
            waveNumber: waveIndex + 1,
            waveLabel: `Wave ${waveIndex + 1}`,
            skillMasteryLevel: mastery?.masteryLevel ?? 0,
          })
          if (playerUsedSkill) {
            nextSkillStates = recordSkillRuntimeUse(nextSkillStates, skill.id)
            afterMastery = getSkillMastery(nextSkillStates, skill.id)
          }
          player = {
            ...resolved.actor,
            cooldowns: {
              ...resolved.actor.cooldowns,
              [skill.id]: getSkillCooldownTurns(skill),
            },
          }
          monster = resolved.target
          activeEffects = resolved.activeEffects
          logs.push(resolved.log)
          if (playerUsedSkill && mastery && afterMastery) {
            logs.push(createSkillMasteryLog(
              skill,
              mastery,
              afterMastery,
              logs.length + 1,
              waveIndex + 1,
              monster
            ))
          }
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
          if (liveMonsterDef) {
            const intent = getMonsterIntent(
              {
                ...session,
                waveIndex,
                player: toManualCombatant(player),
                monster: toManualCombatant(monster),
                remainingMonsterIds,
                cooldowns: player.cooldowns,
                monsterCooldowns: monster.cooldowns,
                activeEffects,
                logs,
              },
              liveMonsterDef,
              SKILL_DEFINITIONS
            )
            logs.push(createMonsterIntentLog(
              `[${monster.name}] 예고: ${intent.label}. ${intent.responseHint}.`,
              logs.length + 1,
              waveIndex + 1,
              monster
            ))
          }
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
              [monsterSkill.id]: getSkillCooldownTurns(monsterSkill),
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
          set({
            ...outcome.state,
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
              result,
            },
            skillStates: nextSkillStates,
          })
          set(current => applyChallengeProgress(current, { gateAttempt: true, gateVictory: result === 'victory' }))
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
          skillStates: nextSkillStates,
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
          .filter(isHunterCombatSkill)
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
                  [skill.id]: getSkillCooldownTurns(skill),
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
                  [skill.id]: getSkillCooldownTurns(skill),
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
        set({
          ...outcome.state,
          manualBattleSession: {
            ...session,
            waveIndex,
            turn: getManualActionCount(logs) + 1,
            player: toManualCombatant(player),
            monster: toManualCombatant(monster),
            remainingMonsterIds,
            cooldowns: player.cooldowns,
            monsterCooldowns: monster.cooldowns,
            activeEffects,
            logs,
            result,
          },
        })
        set(current => applyChallengeProgress(current, { gateAttempt: true, gateVictory: result === 'victory' }))
        if (outcome.shouldCheckUnlocks) {
          setTimeout(() => {
            get().checkTitleUnlocks()
            get().checkJobAwakening()
          }, 0)
        }
      },

      switchTowerManualBattleToAuto: () => {
        const s = get()
        const session = s.manualBattleSession
        if (!session || session.source !== 'tower' || session.towerFloor == null) return
        const floor = session.towerFloor

        const monsterDef = getTowerMonstersForFloor(floor)[0]
        if (!monsterDef) return

        const equippedItems = getEquippedItems(s.items, s.equipment)
        const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
        const playerSkills = getPlayerCombatSkills({
          jobId: s.hunter.jobId,
          equippedItems,
          allSkills: SKILL_DEFINITIONS,
        })
        const playerSkillIds = ensureBasicAttack(playerSkills)
          .filter(isHunterCombatSkill)
          .map(skill => skill.id)
        const monsterSkillIds = Array.from(new Set([BASIC_ATTACK_SKILL.id, ...monsterDef.skillIds]))
        const monsterSkills = SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && monsterSkillIds.includes(skill.id))
        const allSkills = ensureBasicAttack([...playerSkills, ...monsterSkills])

        let player = toBattleActor(session.player, 'player', 'player', playerSkillIds, session.cooldowns)
        let monster = toBattleActor(session.monster, 'monster', monsterDef.id, monsterSkillIds, session.monsterCooldowns)
        let activeEffects: ActiveCombatEffect[] = [...session.activeEffects]
        let logs: BattleTurn[] = [
          ...session.logs,
          createManualSystemLog(
            '자동 마무리를 시작합니다. 현재 HP, cooldown 상태를 이어받습니다.',
            session.logs.length + 1,
            1,
            monster
          ),
        ]
        let result: CombatLog['result'] | undefined

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
                waveNumber: 1,
                waveLabel: 'Wave 1',
              })
              player = {
                ...resolved.actor,
                cooldowns: {
                  ...resolved.actor.cooldowns,
                  [skill.id]: getSkillCooldownTurns(skill),
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
                waveNumber: 1,
                waveLabel: 'Wave 1',
                phase: 'player_after_action',
                playerUsedSkill: skill.id !== BASIC_ATTACK_SKILL.id,
              })
              monster = shadowResolved.monster
              activeEffects = shadowResolved.activeEffects
              logs.push(...shadowResolved.logs)
            } else {
              monster = decrementCooldowns(monster)
              const skill = chooseSkill(
                monster,
                allSkills.filter(skill => skill.ownerType === 'common' || skill.ownerType === 'monster'),
                buildBattleSkillContext(monster, player, activeEffects, getManualActionCount(logs) + 1)
              )
              const resolved = resolveAction({
                actor: monster,
                target: player,
                skill,
                activeEffects,
                rng: Math.random,
                turnNumber: logs.length + 1,
                waveNumber: 1,
                waveLabel: 'Wave 1',
              })
              monster = {
                ...resolved.actor,
                cooldowns: {
                  ...resolved.actor.cooldowns,
                  [skill.id]: getSkillCooldownTurns(skill),
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
            logs.push(createManualSystemLog(
              `[${monster.name}]을 쓰러뜨렸습니다. 전투 승리!`,
              logs.length + 1,
              1,
              monster
            ))
            result = 'victory'
            break
          }
          if (getManualActionCount(logs) >= session.maxTurns) {
            result = 'draw'
          }
          if (!result) {
            activeEffects = tickRoundEffects(activeEffects)
          }
        }

        if (!result) {
          result = player.hp <= 0 ? 'defeat' : 'draw'
        }

        const combatLog: CombatLog = {
          battleId: `tower-manual-auto-${floor}-${Date.now()}`,
          gateInstanceId: `tower-${floor}`,
          result,
          turns: logs,
          totalTurns: getManualActionCount(logs),
          playerHpRemaining: Math.max(0, player.hp),
          rewards: [],
          penaltyApplied: undefined,
          totalWaves: 1,
          clearedWaves: result === 'victory' ? 1 : 0,
          source: 'tower',
        }

        const tower = s.infiniteTower ?? createInitialTowerState()
        const isFirstClear = !tower.firstClearRewardsClaimed[floor]
        const rewards = calculateTowerReward(floor, result, isFirstClear)
        const towerResult: TowerBattleResult = {
          outcome: result,
          floor,
          firstClear: isFirstClear,
          rewards,
        }

        let nextHunter = s.hunter
        let nextItems = s.items
        let nextShadowEssence = s.shadowEssence ?? 0
        let nextOwnedShadows = s.ownedShadows ?? []
        const newMessages: SystemMessage[] = []

        if (result === 'victory') {
          if (rewards.hunterXp && rewards.hunterXp > 0) {
            const xpResult = applyXp(s.hunter, rewards.hunterXp, 'challenge')
            nextHunter = xpResult.hunter
            if (xpResult.outcome?.leveledUp) {
              newMessages.push({
                id: uid(),
                kind: 'levelup',
                title: 'LEVEL UP',
                lines: [
                  `Lv.${s.hunter.level} → Lv.${xpResult.outcome.newLevel}`,
                  `자동 분배 — ${formatStatGains(xpResult.outcome.autoStatGains)}`,
                  `자유 배분권 +${xpResult.outcome.freeStatPointsGained}`,
                ],
                createdAt: todayISO(),
              })
            }
          }
          if (rewards.shadowEssence && rewards.shadowEssence > 0) {
            nextShadowEssence += rewards.shadowEssence
          }
          if (rewards.itemDropChance && Math.random() < rewards.itemDropChance) {
            const poolItem = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)]
            if (poolItem) {
              const item: Item = { ...poolItem, id: uid(), acquiredAt: todayISO() }
              nextItems = [...nextItems, item]
            }
          }

          const shadowXpAmount = rewards.shadowXp ?? Math.max(1, Math.floor(floor / 3))
          if (shadowXpAmount > 0 && equippedShadows.length > 0) {
            for (const es of equippedShadows) {
              const idx = nextOwnedShadows.findIndex(sh => sh.instanceId === es.instanceId)
              if (idx === -1) continue
              const oldLevel = nextOwnedShadows[idx].level ?? 1
              const res = addShadowXp(nextOwnedShadows[idx], shadowXpAmount)
              if (res.leveledUp) {
                newMessages.push({
                  id: uid(),
                  kind: 'shadow',
                  title: '그림자 레벨 업',
                  lines: [`[${nextOwnedShadows[idx].name}] Lv.${oldLevel} → Lv.${res.newLevel}`],
                  createdAt: todayISO(),
                })
              }
              nextOwnedShadows = nextOwnedShadows.map((sh, i) => i === idx ? res.shadow : sh)
            }
          }

          const nextFirstClearRewardsClaimed = isFirstClear
            ? { ...tower.firstClearRewardsClaimed, [floor]: true }
            : tower.firstClearRewardsClaimed
          const shouldGrantBossBox = rewards.boxType === 'boss' && !tower.bossRewardsClaimed[floor]
          const nextBossRewardsClaimed = shouldGrantBossBox
            ? { ...tower.bossRewardsClaimed, [floor]: true }
            : tower.bossRewardsClaimed
          const nextRewardBoxes = shouldGrantBossBox
            ? [
                createRewardBox(
                  'boss',
                  floor >= 20 ? 'epic' : 'superior',
                  'tower_boss',
                  `무한의 탑 ${floor}층 보스 박스`,
                  floor
                ),
                ...(s.rewardBoxes ?? []),
              ].slice(0, 30)
            : s.rewardBoxes ?? []

          newMessages.push({
            id: uid(),
            kind: 'quest',
            title: `탑 ${floor}층 클리어`,
            lines: [
              `무한의 탑 ${floor}층을 클리어했습니다.`,
              ...(rewards.hunterXp ? [`XP +${rewards.hunterXp}`] : []),
              ...(rewards.shadowEssence ? [`정수 +${rewards.shadowEssence}`] : []),
              ...(rewards.boxType ? ['보스 박스 획득'] : []),
            ],
            createdAt: todayISO(),
          })

          set(applySecretProgressEvent(s, {
            context: 'tower',
            outcome: result,
            floor,
            firstClear: isFirstClear,
            boss: getTowerFloorType(floor) === 'boss',
          }, {
            hunter: nextHunter,
            items: nextItems,
            shadowEssence: nextShadowEssence,
            ownedShadows: nextOwnedShadows,
            rewardBoxes: nextRewardBoxes,
            infiniteTower: {
              ...tower,
              currentFloor: floor + 1,
              highestClearedFloor: Math.max(tower.highestClearedFloor, floor),
              lastAttemptedFloor: floor,
              firstClearRewardsClaimed: nextFirstClearRewardsClaimed,
              bossRewardsClaimed: nextBossRewardsClaimed,
              activeTowerBattle: {
                id: `tower-manual-auto-${floor}-${Date.now()}`,
                floor,
                floorType: getTowerFloorType(floor),
                monsterIds: [monsterDef.id],
                recommendedPower: getTowerRecommendedPower(floor),
                status: 'resolved',
                logs: combatLog.turns,
                result: towerResult,
                showResult: true,
              },
            },
            combatLogs: [combatLog, ...s.combatLogs].slice(0, 20),
            messages: [...s.messages, ...newMessages],
            manualBattleSession: {
              ...session,
              turn: getManualActionCount(logs) + 1,
              player: toManualCombatant(player),
              monster: toManualCombatant(monster),
              cooldowns: player.cooldowns,
              monsterCooldowns: monster.cooldowns,
              activeEffects,
              logs,
              result,
            },
          }))
        } else {
          newMessages.push({
            id: uid(),
            kind: 'info',
            title: `탑 ${floor}층 도전 실패`,
            lines: [
              result === 'defeat'
                ? `무한의 탑 ${floor}층 도전에 실패했습니다.`
                : `무한의 탑 ${floor}층 — 시간 초과.`,
              '전투력을 키운 뒤 다시 도전할 수 있습니다.',
            ],
            createdAt: todayISO(),
          })

          set(applySecretProgressEvent(s, {
            context: 'tower',
            outcome: result,
            floor,
            firstClear: isFirstClear,
            boss: getTowerFloorType(floor) === 'boss',
          }, {
            items: nextItems,
            infiniteTower: {
              ...tower,
              currentFloor: 1,
              lastAttemptedFloor: floor,
              activeTowerBattle: {
                id: `tower-manual-auto-${floor}-${Date.now()}`,
                floor,
                floorType: getTowerFloorType(floor),
                monsterIds: [monsterDef.id],
                recommendedPower: getTowerRecommendedPower(floor),
                status: 'resolved',
                logs: combatLog.turns,
                result: towerResult,
                showResult: true,
              },
            },
            combatLogs: [combatLog, ...s.combatLogs].slice(0, 20),
            messages: [...s.messages, ...newMessages],
            manualBattleSession: {
              ...session,
              turn: getManualActionCount(logs) + 1,
              player: toManualCombatant(player),
              monster: toManualCombatant(monster),
              cooldowns: player.cooldowns,
              monsterCooldowns: monster.cooldowns,
              activeEffects,
              logs,
              result,
            },
          }))
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
        set(applySecretProgressEvent(s, {
          context: 'shadow',
          action: 'extract',
          success: result.success,
          named: Boolean(result.shadow?.isGateNamed || result.shadow?.isAchievementNamed),
        }, {
          ownedShadows,
          lastShadowExtractResult: result,
          shadowExtractHistory: [result, ...(s.shadowExtractHistory ?? [])].slice(0, 50),
        }))
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
        const grants = buildAchievementShadowTicketGrants(s)
        if (grants.tickets.length === 0) return {}
        return {
          shadowSummonTickets: [...(s.shadowSummonTickets ?? []), ...grants.tickets],
          shadowAchievementTicketClaims: grants.claims,
          messages: [...s.messages, ...grants.messages],
        }
      }),

      summonShadowFromTicket: (ticketId) => set((s) => {
        const tickets = s.shadowSummonTickets ?? []
        const ticket = tickets.find(item => item.id === ticketId && !item.usedAt)
        if (!ticket) return {}
        const pool = getTicketCandidatePool(s, ticket)
        const ownedDefinitionIds = new Set((s.ownedShadows ?? []).map(shadow => shadow.definitionId))
        const unownedPool = pool.filter(def => !ownedDefinitionIds.has(def.id))
        const candidatePool = unownedPool.length > 0 ? unownedPool : pool
        const definition = candidatePool[Math.floor(Math.random() * candidatePool.length)]
        if (!definition) return {}
        if ((definition.isAchievementNamed || definition.isGateNamed) && ownedDefinitionIds.has(definition.id)) {
          const shardType: ShadowSummonShardType = definition.isAchievementNamed ? 'achievement_named' : 'named'
          const shardAmount = definition.rarity === 'legendary' ? 6 : 3
          return {
            shadowSummonTickets: tickets.map(item => item.id === ticketId ? { ...item, usedAt: todayISO() } : item),
            shadowSummonShards: addShadowSummonShards(s.shadowSummonShards, { [shardType]: shardAmount }),
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow' as const,
              title: '소환권 중복 전환',
              lines: [`후보 풀을 모두 보유 중입니다. ${definition.name}의 기척이 ${shardType === 'achievement_named' ? '성취 네임드' : '네임드'} 조각 +${shardAmount}로 전환되었습니다.`],
              createdAt: todayISO(),
            }],
          }
        }
        const innateSource = innateSourceForTicket(ticket)
        const innateGrade = rollShadowInnateGrade(innateSource)
        const shadow = createOwnedShadow(definition, Math.random, { innateGrade, innateSource })
        return applySecretProgressEvent(s, {
          context: 'shadow',
          action: 'summon',
          named: Boolean(shadow.isGateNamed || shadow.isAchievementNamed),
        }, {
          ownedShadows: [...(s.ownedShadows ?? []), shadow],
          shadowSummonTickets: tickets.map(item => item.id === ticketId ? { ...item, usedAt: shadow.obtainedAt } : item),
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: ticket.ticketType === 'category_achievement_named' || ticket.ticketType === 'achievement_named_shadow' ? '성취 네임드 소환' : '그림자 소환',
            lines: [
              `[${SHADOW_RARITY_LABEL[shadow.rarity]}] ${shadow.name}이(가) 군단에 합류했습니다.`,
              `태생 등급: ${shadow.innateGrade ?? 'B'} · 원천 등급: ${SHADOW_RARITY_LABEL[shadow.birthRarity ?? shadow.rarity]}`,
            ],
            createdAt: todayISO(),
          }],
        })
      }),

      summonShadowFromFragments: (definitionId) => set((s) => {
        const definition = getShadowDefinition(definitionId)
        if (!definition) return {}
        if (definition.isAchievementNamed || definition.isGateNamed) return {}
        const cost = SHADOW_FRAGMENT_SUMMON_COST[definition.rarity] ?? 20
        const current = s.shadowFragments?.[definitionId] ?? 0
        if (current < cost) return {}
        const shadow = createOwnedShadow(definition)
        const nextFragments = { ...(s.shadowFragments ?? {}) }
        nextFragments[definitionId] = current - cost
        if (nextFragments[definitionId] <= 0) delete nextFragments[definitionId]
        return applySecretProgressEvent(s, {
          context: 'shadow',
          action: 'fragment_summon',
          named: false,
        }, {
          ownedShadows: [...(s.ownedShadows ?? []), shadow],
          shadowFragments: nextFragments,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: '그림자 조각 소환',
            lines: [
              `${definition.name} 조각 ${cost}개를 소모했습니다.`,
              `[${SHADOW_RARITY_LABEL[shadow.rarity]}] ${shadow.name}이(가) 군단에 합류했습니다.`,
            ],
            createdAt: todayISO(),
          }],
        })
      }),

      exchangeShadowSummonShards: (ticketType, role) => set((s) => {
        const cost = shardExchangeCost(ticketType)
        const shards = { ...(s.shadowSummonShards ?? {}) }
        const canPay = Object.entries(cost).every(([type, amount]) => (shards[type as ShadowSummonShardType] ?? 0) >= (amount ?? 0))
        if (!canPay) return {}
        for (const [type, amount] of Object.entries(cost) as Array<[ShadowSummonShardType, number]>) {
          shards[type] = (shards[type] ?? 0) - amount
          if ((shards[type] ?? 0) <= 0) delete shards[type]
        }
        const ticket = createShadowSummonTicket({
          ticketType,
          source: 'system',
          role: ticketType === 'role_shadow' ? role ?? 'support' : undefined,
          grade: ticketType === 'achievement_named_shadow' ? 'standard' : undefined,
        })
        return {
          shadowSummonShards: shards,
          shadowSummonTickets: [ticket, ...(s.shadowSummonTickets ?? [])],
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: '소환권 교환',
            lines: [`조각을 소모해 ${ticket.label}을 획득했습니다.`],
            createdAt: todayISO(),
          }],
        }
      }),

      absorbShadow: (targetInstanceId) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const equippedShadowIds = s.equippedShadowIds ?? []
        const target = ownedShadows.find(shadow => shadow.instanceId === targetInstanceId)
        if (!target) return {}
        if (!canAbsorbShadow(target, ownedShadows, equippedShadowIds)) return {}
        const currentLevel = target.enhancementLevel ?? 0
        const nextLevel = Math.min(MAX_SHADOW_ENHANCEMENT_LEVEL, currentLevel + 1)
        // consume one material (same definitionId, not equipped, not self, not locked, not achievement named)
        const equippedSet = new Set(equippedShadowIds)
        const materialIndex = ownedShadows.findIndex(
          shadow => shadow.definitionId === target.definitionId && shadow.instanceId !== target.instanceId && !equippedSet.has(shadow.instanceId) && !shadow.isLocked && !shadow.isAchievementNamed
        )
        if (materialIndex === -1) return {}
        const material = ownedShadows[materialIndex]
        const nextOwned = ownedShadows.filter((_, i) => i !== materialIndex).map(shadow =>
          shadow.instanceId === target.instanceId
            ? { ...shadow, enhancementLevel: nextLevel, absorbedCount: (shadow.absorbedCount ?? 0) + 1 }
            : shadow
        )
        return {
          ownedShadows: nextOwned,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: '그림자 흡수',
            lines: [`[${SHADOW_RARITY_LABEL[target.rarity]}] ${target.name} +${nextLevel} (재료: ${material.name})`],
            createdAt: todayISO(),
          }],
        }
      }),

      decomposeShadow: (shadowInstanceId) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const equippedShadowIds = s.equippedShadowIds ?? []
        const shadow = ownedShadows.find(s => s.instanceId === shadowInstanceId)
        if (!shadow) return {}
        if (!canDecomposeShadow(shadow, equippedShadowIds)) return {}
        const essence = SHADOW_DECOMPOSE_ESSENCE[shadow.rarity] ?? 1
        const nextOwned = ownedShadows.filter(s => s.instanceId !== shadowInstanceId)
        return {
          ownedShadows: nextOwned,
          shadowEssence: (s.shadowEssence ?? 0) + essence,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: '그림자 분해',
            lines: [`[${SHADOW_RARITY_LABEL[shadow.rarity]}] ${shadow.name}을(를) 분해하여 그림자 정수 ${essence} 획득.`],
            createdAt: todayISO(),
          }],
        }
      }),

      toggleShadowLock: (shadowInstanceId) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const nextOwned = ownedShadows.map(shadow =>
          shadow.instanceId === shadowInstanceId ? { ...shadow, isLocked: !shadow.isLocked } : shadow
        )
        return { ownedShadows: nextOwned }
      }),

      toggleShadowFavorite: (shadowInstanceId) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const nextOwned = ownedShadows.map(shadow =>
          shadow.instanceId === shadowInstanceId ? { ...shadow, isFavorite: !shadow.isFavorite } : shadow
        )
        return { ownedShadows: nextOwned }
      }),

      evolveShadow: (shadowInstanceId) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const shadow = ownedShadows.find(sh => sh.instanceId === shadowInstanceId)
        if (!shadow) return {}
        const check = canEvolveShadow(shadow, s.shadowEssence ?? 0)
        if (!check.canEvolve || !check.targetDefinition) return {}
        const cost = check.cost ?? 0
        const targetDef = check.targetDefinition
        const nextOwned = ownedShadows.map(sh =>
          sh.instanceId === shadowInstanceId
            ? {
                ...sh,
                definitionId: targetDef.id,
                name: targetDef.name,
                rarity: targetDef.rarity,
                rank: targetDef.rank,
                role: targetDef.role,
                level: 1,
                xp: 0,
                evolutionStage: (sh.evolutionStage ?? 0) + 1,
                evolvedFromDefinitionId: sh.definitionId,
              }
            : sh
        )
        return applySecretProgressEvent(s, { context: 'shadow', action: 'evolve', shadowInstanceId }, {
          ownedShadows: nextOwned,
          shadowEssence: (s.shadowEssence ?? 0) - cost,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: '그림자 진화',
            lines: [`[${shadow.name}]이(가) [${targetDef.name}](으)로 진화했습니다.`],
            createdAt: todayISO(),
          }],
        })
      }),

      ensureTodayShadowExpedition: () => set((s) => syncTodayShadowExpeditionState(s)),

      selectShadowExpeditionParty: (expeditionId, shadowIds) => set((s) => {
        const expedition = (s.shadowExpeditions ?? []).find(item => item.id === expeditionId)
        if (!expedition || expedition.status === 'completed' || expedition.status === 'expired' || expedition.status === 'in_progress') return {}
        const ownedIds = new Set((s.ownedShadows ?? []).map(shadow => shadow.instanceId))
        const uniqueIds = Array.from(new Set(shadowIds)).filter(id => ownedIds.has(id)).slice(0, SHADOW_EXPEDITION_PARTY_MAX)
        return {
          shadowExpeditions: (s.shadowExpeditions ?? []).map(item =>
            item.id === expeditionId ? { ...item, selectedShadowIds: uniqueIds } : item
          ),
        }
      }),

      startShadowExpedition: (expeditionId) => set((s) => {
        const synced = syncTodayShadowExpeditionState(s)
        const expeditions = synced.shadowExpeditions
        const expedition = expeditions.find(item => item.id === expeditionId)
        if (!expedition || expedition.status !== 'available') return synced
        const partySize = expedition.selectedShadowIds.filter(id => (s.ownedShadows ?? []).some(shadow => shadow.instanceId === id)).length
        if (partySize < SHADOW_EXPEDITION_PARTY_MIN || partySize > SHADOW_EXPEDITION_PARTY_MAX) {
          return {
            ...synced,
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow' as const,
              title: '그림자 원정 편성 필요',
              lines: [`원정 파티는 ${SHADOW_EXPEDITION_PARTY_MIN}~${SHADOW_EXPEDITION_PARTY_MAX}명으로 편성해야 합니다.`],
              createdAt: todayISO(),
            }],
          }
        }
        return {
          ...synced,
          activeShadowExpeditionId: expeditionId,
          shadowExpeditions: expeditions.map(item =>
            item.id === expeditionId
              ? {
                  ...item,
                  status: 'in_progress' as const,
                  logs: [...item.logs, {
                    id: uid(),
                    turn: 0,
                    type: 'system' as const,
                    message: '그림자들이 균열 잔재로 진입했다. 헌터는 후방에서 명령을 내린다.',
                  }],
                }
              : item
          ),
        }
      }),

      issueShadowExpeditionCommand: (expeditionId, command) => set((s) => {
        const expedition = (s.shadowExpeditions ?? []).find(item => item.id === expeditionId)
        if (!expedition || expedition.status !== 'in_progress') return {}
        const party = expedition.selectedShadowIds
          .map(id => (s.ownedShadows ?? []).find(shadow => shadow.instanceId === id))
          .filter((shadow): shadow is OwnedShadow => Boolean(shadow))
        if (party.length === 0) return {}

        const resolved = resolveShadowExpeditionCommand(expedition, party, command, Math.random, uid)
        let nextOwnedShadows = s.ownedShadows ?? []
        let nextShadowEssence = s.shadowEssence ?? 0
        const nextMessages = [...s.messages]

        if (resolved.result && !expedition.result) {
          const levelUps: string[] = []
          for (const partyShadow of party) {
            const idx = nextOwnedShadows.findIndex(shadow => shadow.instanceId === partyShadow.instanceId)
            if (idx === -1) continue
            const xpResult = addShadowXp(nextOwnedShadows[idx], resolved.result.shadowXpGained)
            nextOwnedShadows = nextOwnedShadows.map((shadow, index) => index === idx ? xpResult.shadow : shadow)
            if (xpResult.leveledUp) levelUps.push(`${partyShadow.name} Lv.${xpResult.newLevel}`)
          }
          nextShadowEssence += resolved.result.essenceGained
          nextMessages.push({
            id: uid(),
            kind: 'shadow' as const,
            title: '그림자 원정 완료',
            lines: [
              `${resolved.title} 결과: ${SHADOW_EXPEDITION_OUTCOME_LABEL[resolved.result.outcome]}`,
              `파티 전원 그림자 XP +${resolved.result.shadowXpGained}`,
              `그림자 정수 +${resolved.result.essenceGained}`,
              ...levelUps.map(line => `레벨업: ${line}`),
              ...(resolved.result.bonusRewards ?? []),
            ],
            createdAt: todayISO(),
          })
          setTimeout(() => {
            set(current => applyChallengeProgress(current, { shadowExpeditionCompleted: true }))
          }, 0)
        }

        const baseState: Partial<GameState> = {
          ownedShadows: nextOwnedShadows,
          shadowEssence: nextShadowEssence,
          activeShadowExpeditionId: resolved.status === 'completed' ? undefined : s.activeShadowExpeditionId,
          shadowExpeditions: (s.shadowExpeditions ?? []).map(item => item.id === expeditionId ? resolved : item),
          messages: nextMessages,
        }
        if (resolved.result && !expedition.result) {
          return applySecretProgressEvent(s, {
            context: 'expedition',
            outcome: resolved.result.outcome,
            expeditionType: resolved.type,
            shadowIds: expedition.selectedShadowIds,
          }, baseState)
        }
        return baseState
      }),

      resolveShadowExpeditionMidEvent: (expeditionId, choiceId) => set((s) => {
        const expedition = (s.shadowExpeditions ?? []).find(item => item.id === expeditionId)
        if (!expedition || !expedition.midEvent || expedition.eventResolved) return {}
        const resolved = resolveExpeditionMidEventChoice(expedition, choiceId, uid)
        return {
          shadowExpeditions: (s.shadowExpeditions ?? []).map(item => item.id === expeditionId ? resolved : item),
        }
      }),

      abandonShadowExpedition: (expeditionId) => set((s) => {
        const expedition = (s.shadowExpeditions ?? []).find(item => item.id === expeditionId)
        if (!expedition || expedition.status !== 'in_progress') return {}
        return applySecretProgressEvent(s, {
          context: 'expedition',
          outcome: 'failure',
          expeditionType: expedition.type,
          shadowIds: expedition.selectedShadowIds,
        }, {
          activeShadowExpeditionId: undefined,
          shadowExpeditions: (s.shadowExpeditions ?? []).map(item =>
            item.id === expeditionId
              ? {
                  ...item,
                  status: 'completed' as const,
                  result: {
                    outcome: 'failure' as const,
                    progress: item.progress,
                    risk: item.risk,
                    shadowXpGained: 0,
                    essenceGained: 0,
                    bonusRewards: ['중도 포기: 보상 없음'],
                  },
                  logs: [...item.logs, {
                    id: uid(),
                    turn: item.turn,
                    type: 'system' as const,
                    message: '지휘가 중단되었다. 원정은 실패 처리되며 보상은 없다.',
                  }],
                }
              : item
          ),
        })
      }),

      startTowerBattle: (floor) => {
        const s = get()
        const tower = s.infiniteTower ?? createInitialTowerState()
        const floorType = getTowerFloorType(floor)
        const monsters = getTowerMonstersForFloor(floor)
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

        const monsterSkillIds = new Set(monsters.flatMap(m => m.skillIds))
        const monsterSkills = SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && monsterSkillIds.has(skill.id))
        const skills = [...playerSkills, ...monsterSkills]

        const combatLog = simulateGateWaveBattle({
          playerName: s.hunter.name || '헌터',
          playerStats,
          monsters,
          skills,
          equippedShadows,
          gateInstanceId: `tower-${floor}`,
          battleId: `tower-battle-${floor}-${Date.now()}`,
        })

        const isFirstClear = !tower.firstClearRewardsClaimed[floor]
        const rewards = calculateTowerReward(floor, combatLog.result as 'victory' | 'defeat' | 'draw', isFirstClear)

        const towerResult: TowerBattleResult = {
          outcome: combatLog.result as 'victory' | 'defeat' | 'draw',
          floor,
          firstClear: isFirstClear,
          rewards,
        }

        const nextTower: InfiniteTowerState = {
          ...tower,
          lastAttemptedFloor: floor,
          clearedFloors: {},
          activeTowerBattle: {
            id: `tower-${floor}-${Date.now()}`,
            floor,
            floorType,
            monsterIds: monsters.map(m => m.id),
            recommendedPower: getTowerRecommendedPower(floor),
            status: 'revealing',
            logs: combatLog.turns,
            result: towerResult,
            showResult: false,
          },
        }

        set({
          infiniteTower: nextTower,
          combatLogs: [{ ...combatLog, source: 'tower' as const }, ...s.combatLogs].slice(0, 20),
          manualBattleSession: undefined,
        })
      },

      resolveTowerBattle: () => {
        const s = get()
        const tower = s.infiniteTower
        if (!tower?.activeTowerBattle) return
        const activeBattle = tower.activeTowerBattle
        if (activeBattle.status !== 'revealing') return

        const result = activeBattle.result
        if (!result) return
        const floor = activeBattle.floor
        const isFirstClear = result.firstClear
        const rewards = result.rewards

        let nextHunter = s.hunter
        let nextItems = s.items
        let nextShadowEssence = s.shadowEssence ?? 0
        let nextOwnedShadows = s.ownedShadows ?? []
        const newMessages: SystemMessage[] = []

        if (result.outcome === 'victory') {
          if (rewards.hunterXp && rewards.hunterXp > 0) {
            const xpResult = applyXp(s.hunter, rewards.hunterXp, 'challenge')
            nextHunter = xpResult.hunter
            if (xpResult.outcome?.leveledUp) {
              newMessages.push({
                id: uid(),
                kind: 'levelup',
                title: 'LEVEL UP',
                lines: [
                  `Lv.${s.hunter.level} → Lv.${xpResult.outcome.newLevel}`,
                  `자동 분배 — ${formatStatGains(xpResult.outcome.autoStatGains)}`,
                  `자유 배분권 +${xpResult.outcome.freeStatPointsGained}`,
                ],
                createdAt: todayISO(),
              })
            }
          }
          if (rewards.shadowEssence && rewards.shadowEssence > 0) {
            nextShadowEssence += rewards.shadowEssence
          }
          if (rewards.itemDropChance && Math.random() < rewards.itemDropChance) {
            const poolItem = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)]
            if (poolItem) {
              const item: Item = { ...poolItem, id: uid(), acquiredAt: todayISO() }
              nextItems = [...nextItems, item]
            }
          }

          const shadowXpAmount = rewards.shadowXp ?? Math.max(1, Math.floor(floor / 3))
          const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
          if (shadowXpAmount > 0 && equippedShadows.length > 0) {
            for (const es of equippedShadows) {
              const idx = nextOwnedShadows.findIndex(sh => sh.instanceId === es.instanceId)
              if (idx === -1) continue
              const oldLevel = nextOwnedShadows[idx].level ?? 1
              const res = addShadowXp(nextOwnedShadows[idx], shadowXpAmount)
              if (res.leveledUp) {
                newMessages.push({
                  id: uid(),
                  kind: 'shadow',
                  title: '그림자 레벨 업',
                  lines: [`[${nextOwnedShadows[idx].name}] Lv.${oldLevel} → Lv.${res.newLevel}`],
                  createdAt: todayISO(),
                })
              }
              nextOwnedShadows = nextOwnedShadows.map((sh, i) => i === idx ? res.shadow : sh)
            }
          }

          const nextFirstClearRewardsClaimed = isFirstClear
            ? { ...tower.firstClearRewardsClaimed, [floor]: true }
            : tower.firstClearRewardsClaimed
          const shouldGrantBossBox = rewards.boxType === 'boss' && !tower.bossRewardsClaimed[floor]
          const nextBossRewardsClaimed = shouldGrantBossBox
            ? { ...tower.bossRewardsClaimed, [floor]: true }
            : tower.bossRewardsClaimed
          const nextRewardBoxes = shouldGrantBossBox
            ? [
                createRewardBox(
                  'boss',
                  floor >= 20 ? 'epic' : 'superior',
                  'tower_boss',
                  `무한의 탑 ${floor}층 보스 박스`,
                  floor
                ),
                ...(s.rewardBoxes ?? []),
              ].slice(0, 30)
            : s.rewardBoxes ?? []

          newMessages.push({
            id: uid(),
            kind: 'quest',
            title: `탑 ${floor}층 클리어`,
            lines: [
              `무한의 탑 ${floor}층을 클리어했습니다.`,
              ...(rewards.hunterXp ? [`XP +${rewards.hunterXp}`] : []),
              ...(rewards.shadowEssence ? [`정수 +${rewards.shadowEssence}`] : []),
              ...(rewards.boxType ? ['보스 박스 획득'] : []),
            ],
            createdAt: todayISO(),
          })

          set(applySecretProgressEvent(s, {
            context: 'tower',
            outcome: result.outcome,
            floor,
            firstClear: isFirstClear,
            boss: getTowerFloorType(floor) === 'boss',
          }, {
            hunter: nextHunter,
            items: nextItems,
            shadowEssence: nextShadowEssence,
            ownedShadows: nextOwnedShadows,
            rewardBoxes: nextRewardBoxes,
            infiniteTower: {
              ...tower,
              currentFloor: floor + 1,
              highestClearedFloor: Math.max(tower.highestClearedFloor, floor),
              firstClearRewardsClaimed: nextFirstClearRewardsClaimed,
              bossRewardsClaimed: nextBossRewardsClaimed,
              activeTowerBattle: {
                ...activeBattle,
                status: 'resolved',
                showResult: true,
              },
            },
            messages: [...s.messages, ...newMessages],
          }))
          setTimeout(() => {
            set(current => applyChallengeProgress(current, { towerAttempt: true, towerClear: true }))
            get().checkTitleUnlocks()
            get().checkJobAwakening()
          }, 0)
        } else {
          newMessages.push({
            id: uid(),
            kind: 'info',
            title: `탑 ${floor}층 도전 실패`,
            lines: [
              result.outcome === 'defeat'
                ? `무한의 탑 ${floor}층 도전에 실패했습니다.`
                : `무한의 탑 ${floor}층 — 시간 초과.`,
              '전투력을 키운 뒤 다시 도전할 수 있습니다.',
            ],
            createdAt: todayISO(),
          })

          set(applySecretProgressEvent(s, {
            context: 'tower',
            outcome: result.outcome,
            floor,
            firstClear: isFirstClear,
            boss: getTowerFloorType(floor) === 'boss',
          }, {
            infiniteTower: {
              ...tower,
              currentFloor: 1,
              activeTowerBattle: {
                ...activeBattle,
                status: 'resolved',
                showResult: true,
              },
            },
            messages: [...s.messages, ...newMessages],
          }))
          setTimeout(() => {
            set(current => applyChallengeProgress(current, { towerAttempt: true }))
          }, 0)
        }
      },

      cancelTowerBattle: () => set((s) => {
        const tower = s.infiniteTower
        if (!tower || !tower.activeTowerBattle) return {}
        return {
          infiniteTower: {
            ...tower,
            activeTowerBattle: undefined,
          },
        }
      }),

      startTowerManualBattle: (floor) => {
        const s = get()
        const monsters = getTowerMonstersForFloor(floor)
        if (monsters.length === 0) return
        const monsterDef = monsters[0]
        if (!monsterDef) return

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
          includeBasicKit: true,
        })
        const playerStats = calculatePlayerCombatStats({
          level: s.hunter.level,
          stats: combatStatsWithShadows,
          equippedItems,
          activeConsumableEffects: s.activeConsumableEffects,
          jobId: s.hunter.jobId,
          skills: playerSkills,
        })

        const player = createPlayerBattleActor(s.hunter.name || '헌터', playerStats, playerSkills)
        const monster = createMonsterBattleActor(monsterDef)

        const tower = s.infiniteTower ?? createInitialTowerState()
        set({
          manualBattleSession: {
            gateId: monsterDef.id,
            gateName: `무한의 탑 ${floor}층`,
            gateInstanceId: `tower-${floor}`,
            waveIndex: 0,
            turn: 1,
            maxTurns: 30,
            player: toManualCombatant(player),
            monster: toManualCombatant(monster),
            remainingMonsterIds: [],
            cooldowns: {},
            monsterCooldowns: {},
            activeEffects: [],
            consumableEffects: [],
            usedConsumableItemIds: [],
            usedConsumableEffectTypes: [],
            consumableUseCount: 0,
            logs: [],
            startedAt: new Date().toISOString(),
            source: 'tower',
            towerFloor: floor,
          },
          infiniteTower: {
            ...tower,
            clearedFloors: {},
            activeTowerBattle: undefined,
          },
        })
      },

      performTowerManualBattleAction: (action) => {
        if (action.type === 'auto_finish') {
          get().switchTowerManualBattleToAuto()
          return
        }

        const s = get()
        const session = s.manualBattleSession
        if (!session || session.result || session.source !== 'tower' || session.towerFloor == null) return
        const floor = session.towerFloor

        const monsterDef = getTowerMonstersForFloor(floor)[0]
        if (!monsterDef) return

        const equippedItems = getEquippedItems(s.items, s.equipment)
        const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
        const playerSkills = getPlayerCombatSkills({
          jobId: s.hunter.jobId,
          equippedItems,
          allSkills: SKILL_DEFINITIONS,
          includeBasicKit: true,
        })
        const playerSkillIds = ensureBasicAttack(playerSkills)
          .filter(isHunterCombatSkill)
          .map(skill => skill.id)
        const monsterSkillIds = Array.from(new Set([BASIC_ATTACK_SKILL.id, ...monsterDef.skillIds]))
        const monsterSkills = SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && monsterSkillIds.includes(skill.id))
        const allSkills = ensureBasicAttack([...playerSkills, ...monsterSkills])

        let player = decrementCooldowns(toBattleActor(session.player, 'player', 'player', playerSkillIds, session.cooldowns))
        let monster = decrementCooldowns(toBattleActor(session.monster, 'monster', monsterDef.id, monsterSkillIds, session.monsterCooldowns))
        let activeEffects: ActiveCombatEffect[] = [...session.activeEffects]
        let logs: BattleTurn[] = [...session.logs]
        let nextItems = s.items
        let nextSkillStates = s.skillStates ?? {}
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
              1,
              monster
            ))
            set({
              manualBattleSession: { ...session, logs },
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
            1
          ))

          const usedConsumableEffectTypes = Array.from(new Set([
            ...session.usedConsumableEffectTypes,
            ...usableEffects.map(effect => effect.type),
          ]))
          nextItems = s.items.filter(candidate => candidate.id !== item.id)
          session.usedConsumableItemIds = [...session.usedConsumableItemIds, item.id]
          session.usedConsumableEffectTypes = usedConsumableEffectTypes
          session.consumableUseCount += 1
        } else if (action.type === 'defend') {
          shadowPhase = 'player_defend'
          activeEffects = applyOrRefreshCombatEffect(activeEffects, {
            sourceSkillId: 'manual-defend',
            kind: 'damage_reduction',
            value: 0.4,
            remainingTurns: 1,
            targetId: 'player',
          })
          logs.push(createDefendLog(player, monster, logs.length + 1, 1))
        } else {
          const skill = action.type === 'basic_attack'
            ? BASIC_ATTACK_SKILL
            : allSkills.find(item => item.id === action.skillId)
          if (!skill || !player.skillIds.includes(skill.id) || (player.cooldowns[skill.id] ?? 0) > 0) return
          playerUsedSkill = skill.id !== BASIC_ATTACK_SKILL.id
          const mastery = playerUsedSkill ? getSkillMastery(nextSkillStates, skill.id) : undefined
          let afterMastery: SkillRuntimeState | undefined

          const resolved = resolveAction({
            actor: player,
            target: monster,
            skill,
            activeEffects,
            rng: Math.random,
            turnNumber: logs.length + 1,
            waveNumber: 1,
            waveLabel: 'Wave 1',
            skillMasteryLevel: mastery?.masteryLevel ?? 0,
          })
          if (playerUsedSkill) {
            nextSkillStates = recordSkillRuntimeUse(nextSkillStates, skill.id)
            afterMastery = getSkillMastery(nextSkillStates, skill.id)
          }
          player = {
            ...resolved.actor,
            cooldowns: {
              ...resolved.actor.cooldowns,
              [skill.id]: getSkillCooldownTurns(skill),
            },
          }
          monster = resolved.target
          activeEffects = resolved.activeEffects
          logs.push(resolved.log)
          if (playerUsedSkill && mastery && afterMastery) {
            logs.push(createSkillMasteryLog(
              skill,
              mastery,
              afterMastery,
              logs.length + 1,
              1,
              monster
            ))
          }
        }

        if (!result && monster.hp > 0) {
          const shadowResolved = resolveShadowSupportActions({
            shadows: equippedShadows,
            player,
            monster,
            activeEffects,
            rng: Math.random,
            turnNumber: logs.length + 1,
            waveNumber: 1,
            waveLabel: 'Wave 1',
            phase: shadowPhase,
            playerUsedSkill,
          })
          monster = shadowResolved.monster
          activeEffects = shadowResolved.activeEffects
          logs.push(...shadowResolved.logs)
        }

        if (player.hp <= 0) result = 'defeat'

        if (!result && monster.hp <= 0) {
          logs.push(createManualSystemLog(
            `[${monster.name}]을 쓰러뜨렸습니다. 전투 승리!`,
            logs.length + 1,
            1,
            monster
          ))
          result = 'victory'
        }

        if (!result && getManualActionCount(logs) < session.maxTurns) {
          const intent = getMonsterIntent(
            {
              ...session,
              player: toManualCombatant(player),
              monster: toManualCombatant(monster),
              cooldowns: player.cooldowns,
              monsterCooldowns: monster.cooldowns,
              activeEffects,
              logs,
            },
            monsterDef,
            SKILL_DEFINITIONS
          )
          logs.push(createMonsterIntentLog(
            `[${monster.name}] 예고: ${intent.label}. ${intent.responseHint}.`,
            logs.length + 1,
            1,
            monster
          ))
          monster = decrementCooldowns(monster)
          const monsterContext = buildBattleSkillContext(monster, player, activeEffects, logs.length + 1)
          const monsterSkill = chooseSkill(
            monster,
            allSkills.filter(skill => skill.ownerType === 'common' || skill.ownerType === 'monster'),
            monsterContext
          )
          const resolved = resolveAction({
            actor: monster,
            target: player,
            skill: monsterSkill,
            activeEffects,
            rng: Math.random,
            turnNumber: logs.length + 1,
            waveNumber: 1,
            waveLabel: 'Wave 1',
          })
          monster = {
            ...resolved.actor,
            cooldowns: {
              ...resolved.actor.cooldowns,
              [monsterSkill.id]: getSkillCooldownTurns(monsterSkill),
            },
          }
          player = resolved.target
          activeEffects = resolved.activeEffects
          logs.push(resolved.log)
        }

        if (!result && player.hp <= 0) result = 'defeat'
        if (!result && getManualActionCount(logs) >= session.maxTurns) result = 'draw'

        if (result) {
          const combatLog: CombatLog = {
            battleId: `tower-manual-${floor}-${Date.now()}`,
            gateInstanceId: `tower-${floor}`,
            result,
            turns: logs,
            totalTurns: getManualActionCount(logs),
            playerHpRemaining: Math.max(0, player.hp),
            rewards: [],
            penaltyApplied: undefined,
            totalWaves: 1,
            clearedWaves: result === 'victory' ? 1 : 0,
            source: 'tower',
          }

          const tower = s.infiniteTower ?? createInitialTowerState()
          const isFirstClear = !tower.firstClearRewardsClaimed[floor]
          const rewards = calculateTowerReward(floor, result, isFirstClear)
          const towerResult: TowerBattleResult = {
            outcome: result,
            floor,
            firstClear: isFirstClear,
            rewards,
          }

          let nextHunter = s.hunter
          let nextShadowEssence = s.shadowEssence ?? 0
          let nextOwnedShadows = s.ownedShadows ?? []
          const newMessages: SystemMessage[] = []

          if (result === 'victory') {
            if (rewards.hunterXp && rewards.hunterXp > 0) {
              const xpResult = applyXp(s.hunter, rewards.hunterXp, 'challenge')
              nextHunter = xpResult.hunter
              if (xpResult.outcome?.leveledUp) {
                newMessages.push({
                  id: uid(),
                  kind: 'levelup',
                  title: 'LEVEL UP',
                  lines: [
                    `Lv.${s.hunter.level} → Lv.${xpResult.outcome.newLevel}`,
                    `자동 분배 — ${formatStatGains(xpResult.outcome.autoStatGains)}`,
                    `자유 배분권 +${xpResult.outcome.freeStatPointsGained}`,
                  ],
                  createdAt: todayISO(),
                })
              }
            }
            if (rewards.shadowEssence && rewards.shadowEssence > 0) {
              nextShadowEssence += rewards.shadowEssence
            }
            if (rewards.itemDropChance && Math.random() < rewards.itemDropChance) {
              const poolItem = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)]
              if (poolItem) {
                const item: Item = { ...poolItem, id: uid(), acquiredAt: todayISO() }
                nextItems = [...nextItems, item]
              }
            }

            const shadowXpAmount = rewards.shadowXp ?? Math.max(1, Math.floor(floor / 3))
            if (shadowXpAmount > 0 && equippedShadows.length > 0) {
              for (const es of equippedShadows) {
                const idx = nextOwnedShadows.findIndex(sh => sh.instanceId === es.instanceId)
                if (idx === -1) continue
                const oldLevel = nextOwnedShadows[idx].level ?? 1
                const res = addShadowXp(nextOwnedShadows[idx], shadowXpAmount)
                if (res.leveledUp) {
                  newMessages.push({
                    id: uid(),
                    kind: 'shadow',
                    title: '그림자 레벨 업',
                    lines: [`[${nextOwnedShadows[idx].name}] Lv.${oldLevel} → Lv.${res.newLevel}`],
                    createdAt: todayISO(),
                  })
                }
                nextOwnedShadows = nextOwnedShadows.map((sh, i) => i === idx ? res.shadow : sh)
              }
            }

            const nextFirstClearRewardsClaimed = isFirstClear
              ? { ...tower.firstClearRewardsClaimed, [floor]: true }
              : tower.firstClearRewardsClaimed
            const shouldGrantBossBox = rewards.boxType === 'boss' && !tower.bossRewardsClaimed[floor]
            const nextBossRewardsClaimed = shouldGrantBossBox
              ? { ...tower.bossRewardsClaimed, [floor]: true }
              : tower.bossRewardsClaimed
            const nextRewardBoxes = shouldGrantBossBox
              ? [
                  createRewardBox(
                    'boss',
                    floor >= 20 ? 'epic' : 'superior',
                    'tower_boss',
                    `무한의 탑 ${floor}층 보스 박스`,
                    floor
                  ),
                  ...(s.rewardBoxes ?? []),
                ].slice(0, 30)
              : s.rewardBoxes ?? []

            newMessages.push({
              id: uid(),
              kind: 'quest',
              title: `탑 ${floor}층 클리어`,
              lines: [
                `무한의 탑 ${floor}층을 클리어했습니다.`,
                ...(rewards.hunterXp ? [`XP +${rewards.hunterXp}`] : []),
                ...(rewards.shadowEssence ? [`정수 +${rewards.shadowEssence}`] : []),
                ...(rewards.boxType ? ['보스 박스 획득'] : []),
              ],
              createdAt: todayISO(),
            })

            set(applySecretProgressEvent(s, {
              context: 'tower',
              outcome: result,
              floor,
              firstClear: isFirstClear,
              boss: getTowerFloorType(floor) === 'boss',
            }, {
              hunter: nextHunter,
              items: nextItems,
              shadowEssence: nextShadowEssence,
              ownedShadows: nextOwnedShadows,
              rewardBoxes: nextRewardBoxes,
              infiniteTower: {
                ...tower,
                currentFloor: floor + 1,
                highestClearedFloor: Math.max(tower.highestClearedFloor, floor),
                lastAttemptedFloor: floor,
                firstClearRewardsClaimed: nextFirstClearRewardsClaimed,
                bossRewardsClaimed: nextBossRewardsClaimed,
                activeTowerBattle: {
                  id: `tower-manual-${floor}-${Date.now()}`,
                  floor,
                  floorType: getTowerFloorType(floor),
                  monsterIds: [monsterDef.id],
                  recommendedPower: getTowerRecommendedPower(floor),
                  status: 'resolved',
                  logs: combatLog.turns,
                  result: towerResult,
                  showResult: true,
                },
              },
              combatLogs: [combatLog, ...s.combatLogs].slice(0, 20),
              messages: [...s.messages, ...newMessages],
              manualBattleSession: {
                ...session,
                turn: getManualActionCount(logs) + 1,
                player: toManualCombatant(player),
                monster: toManualCombatant(monster),
                cooldowns: player.cooldowns,
                monsterCooldowns: monster.cooldowns,
                activeEffects: tickRoundEffects(activeEffects),
                logs,
                result,
              },
              skillStates: nextSkillStates,
            }))
            setTimeout(() => {
              set(current => applyChallengeProgress(current, { towerAttempt: true, towerClear: true }))
              get().checkTitleUnlocks()
              get().checkJobAwakening()
            }, 0)
          } else {
            newMessages.push({
              id: uid(),
              kind: 'info',
              title: `탑 ${floor}층 도전 실패`,
              lines: [
                result === 'defeat'
                  ? `무한의 탑 ${floor}층 도전에 실패했습니다.`
                  : `무한의 탑 ${floor}층 — 시간 초과.`,
                '전투력을 키운 뒤 다시 도전할 수 있습니다.',
              ],
              createdAt: todayISO(),
            })

            set(applySecretProgressEvent(s, {
              context: 'tower',
              outcome: result,
              floor,
              firstClear: isFirstClear,
              boss: getTowerFloorType(floor) === 'boss',
            }, {
              items: nextItems,
              infiniteTower: {
                ...tower,
                currentFloor: 1,
                lastAttemptedFloor: floor,
                activeTowerBattle: {
                  id: `tower-manual-${floor}-${Date.now()}`,
                  floor,
                  floorType: getTowerFloorType(floor),
                  monsterIds: [monsterDef.id],
                  recommendedPower: getTowerRecommendedPower(floor),
                  status: 'resolved',
                  logs: combatLog.turns,
                  result: towerResult,
                  showResult: true,
                },
              },
              combatLogs: [combatLog, ...s.combatLogs].slice(0, 20),
              messages: [...s.messages, ...newMessages],
              manualBattleSession: {
                ...session,
                turn: getManualActionCount(logs) + 1,
                player: toManualCombatant(player),
                monster: toManualCombatant(monster),
                cooldowns: player.cooldowns,
                monsterCooldowns: monster.cooldowns,
                activeEffects: tickRoundEffects(activeEffects),
                logs,
                result,
              },
              skillStates: nextSkillStates,
            }))
            setTimeout(() => {
              set(current => applyChallengeProgress(current, { towerAttempt: true }))
            }, 0)
          }
          return
        }

        set({
          items: nextItems,
          manualBattleSession: {
            ...session,
            turn: getManualActionCount(logs) + 1,
            player: toManualCombatant(player),
            monster: toManualCombatant(monster),
            cooldowns: player.cooldowns,
            monsterCooldowns: monster.cooldowns,
            activeEffects: tickRoundEffects(activeEffects),
            logs,
          },
          skillStates: nextSkillStates,
        })
      },

      cancelTowerManualBattle: () => set((s) => {
        const session = s.manualBattleSession
        if (!session || session.source !== 'tower') return {}
        if (session.result) return { manualBattleSession: undefined }
        const tower = s.infiniteTower ?? createInitialTowerState()
        return {
          manualBattleSession: undefined,
          infiniteTower: {
            ...tower,
            currentFloor: 1,
          },
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

        const baseState: Partial<GameState> = {
          hunter: { ...newHunter, stats: newStats, streak, lastActiveDate: today },
          quests: updatedQuests,
          items: [...s.items, ...drops],
          messages: [...s.messages, ...newMessages],
          achievementStats: stats,
          activeConsumableEffects: updatedConsumableEffects,
          gateStatus: q.type === 'daily' || q.type === 'main'
            ? recoverGateAfterQuestCompletion(s.gateStatus)
            : s.gateStatus,
        }
        set(outcome.leveledUp || outcome.rankChanged
          ? applySecretProgressEvent(s, { context: 'rank', leveledUp: outcome.leveledUp, rankChanged: outcome.rankChanged }, baseState)
          : baseState
        )

        // Check title unlocks after quest completion
        setTimeout(() => {
          set(current => applyChallengeProgress(current, { questCompleted: q }))
          get().checkTitleUnlocks()
          get().checkJobAwakening()
          if (q.type === 'daily') {
            get().ensureTodayShadowExpedition()
            get().rollGateSpawn('daily_completion')
          }
          if (q.type === 'main') {
            get().grantAchievementNamedShadows()
            get().rollGateSpawn('main_completion')
          }
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

          const baseState: Partial<GameState> = {
            hunter: newHunter,
            quests: s.quests.map(x => x.id === id ? { ...x, currentSteps: cur } : x),
            messages: [...s.messages, ...newMessages],
            achievementStats: stats,
          }
          set(outcome.leveledUp || outcome.rankChanged
            ? applySecretProgressEvent(s, { context: 'rank', leveledUp: outcome.leveledUp, rankChanged: outcome.rankChanged }, baseState)
            : baseState
          )

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

        const baseState: Partial<GameState> = {
          hunter: { ...newHunter, stats: newStats },
          quests: s.quests.map(x => x.id === id ? { ...x, currentSteps: total, completed: true } : x),
          items: [...s.items, drop],
          messages: [...s.messages, ...messages],
          achievementStats: stats,
          activeConsumableEffects: updatedConsumableEffects,
        }
        set(outcome.leveledUp || outcome.rankChanged
          ? applySecretProgressEvent(s, { context: 'rank', leveledUp: outcome.leveledUp, rankChanged: outcome.rankChanged }, baseState)
          : baseState
        )

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
        shadowEssence: 0,
        shadowSummonTickets: [],
        shadowSummonShards: {},
        shadowFragments: {},
        shadowAchievementTicketClaims: {},
        shadowExpeditions: [],
        lastShadowExpeditionDate: undefined,
        activeShadowExpeditionId: undefined,
        infiniteTower: createInitialTowerState(),
        rewardBoxes: [],
        lastDailyBoxDate: undefined,
        lastWeeklyBoxWeek: undefined,
        todayChallengeCards: [],
        selectedChallengeCardIds: [],
        lastChallengeCardDate: undefined,
        challengeCardHistory: {},
        skillStates: {},
        secretProgress: undefined,
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
        } else {
          persistedState.ownedShadows = persistedState.ownedShadows.map((shadow: OwnedShadow) => {
            const definition = getShadowDefinition(shadow.definitionId)
            return {
              ...shadow,
              birthRarity: shadow.birthRarity ?? definition?.birthRarity ?? shadow.rarity,
              innateGrade: shadow.innateGrade ?? 'B',
            }
          })
        }
        if (persistedState.items) {
          persistedState.items = persistedState.items.map((item: Item) => ({
            ...item,
            equipmentStars: item.equippable === true && item.consumable !== true ? (item.equipmentStars ?? 2) : item.equipmentStars,
          }))
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
        if (!('shadowEssence' in persistedState)) {
          persistedState.shadowEssence = 0
        }
        if (!persistedState.shadowSummonTickets) {
          persistedState.shadowSummonTickets = []
        } else {
          persistedState.shadowSummonTickets = persistedState.shadowSummonTickets.map((ticket: ShadowSummonTicket) => ({
            ...ticket,
            ticketType: ticket.ticketType ?? (ticket.kind === 'achievement_named' ? 'achievement_named_shadow' : 'normal_shadow'),
          }))
        }
        if (!persistedState.shadowSummonShards) {
          persistedState.shadowSummonShards = {}
        }
        if (!persistedState.shadowFragments) {
          persistedState.shadowFragments = {}
        }
        if (!persistedState.shadowAchievementTicketClaims) {
          persistedState.shadowAchievementTicketClaims = {}
        }
        if (!persistedState.shadowExpeditions) {
          persistedState.shadowExpeditions = []
        }
        if (!('lastShadowExpeditionDate' in persistedState)) {
          persistedState.lastShadowExpeditionDate = undefined
        }
        if (!('activeShadowExpeditionId' in persistedState)) {
          persistedState.activeShadowExpeditionId = undefined
        }
        if (!persistedState.rewardBoxes) {
          persistedState.rewardBoxes = []
        }
        if (!('lastDailyBoxDate' in persistedState)) {
          persistedState.lastDailyBoxDate = undefined
        }
        if (!('lastWeeklyBoxWeek' in persistedState)) {
          persistedState.lastWeeklyBoxWeek = undefined
        }
        if (!persistedState.todayChallengeCards) {
          persistedState.todayChallengeCards = []
        }
        if (!persistedState.selectedChallengeCardIds) {
          persistedState.selectedChallengeCardIds = []
        }
        if (!('lastChallengeCardDate' in persistedState)) {
          persistedState.lastChallengeCardDate = undefined
        }
        if (!persistedState.challengeCardHistory) {
          persistedState.challengeCardHistory = {}
        }
        persistedState.skillStates = normalizeSkillStates(persistedState.skillStates ?? persistedState.skillMastery)
        delete persistedState.skillMastery
        persistedState.secretProgress = ensureSecretProgress(persistedState.secretProgress, persistedState)
        persistedState.manualBattleSession = undefined
        return persistedState
      },
    }
  )
)

declare global {
  interface Window {
    __levelup_secret_debug__?: () => SecretProgressState | undefined
  }
}

const isDevRuntime = ((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV ?? false)

if (isDevRuntime && typeof window !== 'undefined') {
  window.__levelup_secret_debug__ = () => useGame.getState().secretProgress
}
