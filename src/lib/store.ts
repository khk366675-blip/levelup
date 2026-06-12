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
  Difficulty,
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
  OwnedJobState,
  ManualBattleAction,
  ManualBattleSession,
  MonsterDefinition,
  OwnedShadow,
  Quest,
  MainQuestMilestone,
  MainQuestMilestoneReward,
  Rank,
  RandomQuestTemplate,
  RewardBox,
  SecretProgressState,
  ShadowFragmentReward,
  ShadowInnateGrade,
  StatKey,
  SystemMessage,
  ShadowExtractResult,
  ShadowAutoSweepState,
  ShadowExpedition,
  ShadowExpeditionCommand,
  ShadowExpeditionOutcome,
  ShadowSummonTicket,
  ShadowSummonShardType,
  ShadowRarity,
  AchievementTicketGrade,
  SkillDefinition,
  SkillRuntimeState,
  Title,
  InfiniteTowerState,
  TowerBattleResult,
  GateRunEventChoice,
  GateRunState,
  GateRunEncounter,
  DailyProgressionState,
  DailyReadinessLevel,
  HunterGradeTier,
  HunterGradeState,
  FocusSessionState,
  ActiveFocusSession,
  FocusSessionInterruption,
  FocusSessionRecord,
  FocusSessionRewardSummary,
  HardcoreState,
  GateEchoState,
  HardcoreBackupMeta,
  HallOfFameRecord,
  RiftNodeStatus,
  LivingWorldState,
  WorldBattleSession,
  WorldBattleResult,
  RiftNode,
  NamedHunter,
  WorldEvent,
  RuneItem,
} from './types'

import {
  generateRandomRune,
  getShadowRuneSlotsCount,
  getItemRuneSlotsCount,
  getRuneGoldEnhancementCost,
  getRuneGoldEnhancementSuccessRate,
  getRuneValue,
} from './runes'

import { initLivingWorld } from './livingWorld'
import { getNPCEquipmentForScore } from './hunterEquipment'
import { getHunterTrait, rollHunterTrait } from './hunterTraits'
import { advanceWorldDay } from './livingWorldTick'
import { MONARCHS, FINAL_ANGEL, buildMonarchBattleUnit } from './monarchs'
import { buildHunterBattleUnit, buildShadowBattleUnits } from './battleUnits'
import { createDirectBattleState, runMockDirectBattle } from './directBattleRuntime'
import { getHunterCombatPower } from './combatPower'

import {
  AiCoachMemoryState,
  AiCoachSessionRecord,
  AiCoachQuestOutcome,
  AiCoachMemorySummary,
  AiCoachCoreContext,
} from './aiCoachTypes'
import { computeRollingSummary } from './aiCoachSummary'



import { TITLE_DEFINITIONS, CATEGORY_META, JOB_DEFINITIONS, EQUIPMENT_SLOT_LABEL, GateRank } from './types'
import { JOB_DEFINITIONS_V2 } from './jobs'
import { recalcHunterGradeState, createInitialHunterGradeState, evaluateTitleUnlocks, GRADE_LABELS, HUNTER_TITLE_DEFINITIONS, clampMigratedGradeByEvidence } from './hunterGrade'
import { getMockDirectBattleMonster } from './directBattleMonsters'
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
  RIFT_REGIONS,
  RIFT_NODES,
} from './seed'
import { generateGateRunState, hydrateGateRunEncounterChoices, getChoiceEffectType, stripGateChoiceOutcomeHint, getChoiceLeadsTo } from './gateRunEvents'
import { PROMOTION_EXAM_DEFINITIONS } from './promotionExams'
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
  canEnhanceItemWithGold,
  getGoldEnhancementCost,
  getGoldEnhancementSuccessRate,
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
  createSeededRng,
  rollValueReward,
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
  getStandardShadowSummonPool,
  isStandardShadowSummonTicketType,
  MAX_SHADOW_ENHANCEMENT_LEVEL,
  pickStandardShadowSummonDefinition,
  rollShadowInnateGrade,
  rollShadowExtraction,
  SHADOW_DECOMPOSE_ESSENCE,
  SHADOW_RARITY_LABEL,
  getShadowMaxLevel,
  SHADOW_TRAINING_OPTIONS,
  getShadowTrainingCostMultiplier,
  SHADOW_TRAIT_DEFINITIONS,
  SHADOW_PASSIVE_DEFINITIONS,
  SHADOW_SKILL_DEFINITIONS,
  SHADOW_LEGION_NODES,
  getShadowMaxTraitSlots,
  rollShadowTraitDefinition,
  SHADOW_TRAITS,
  getValidEquippedShadowIds,
  generateMutation,
  MAX_SHADOW_MUTATION_STAGE,
  SHADOW_RARITY_ORDER,
  getEnhanceProbability,
  canEnhanceShadowWithStone,
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
  getActivePlanDateKey,
  getPlanBasedCompletedCount,
  getTodayDailyCompletedCount,
  refreshShadowExpeditionLock,
  resolveShadowExpeditionCommand,
  resolveExpeditionMidEventChoice,
  getShadowExpeditionOutcome,
  getShadowExpeditionReward,
} from './shadowExpeditions'
import { MID_EVENTS, buildExpeditionReport } from './expeditionLore'
import {
  getEchoTruthReadiness,
  ensureSecretProgress,
  markSecretFlagPublic,
  recordSecretEvent,
  resetSecretProgressOnLoop,
  type SecretEvent,
} from './secrets'
import { emitWorldSignal, type WorldSignalTemplateId } from './worldSignals'
import {
  SHOP_PRODUCTS,
  getEquipmentStarWeights,
  getShopDrawQualitySource,
  getShopDrawWeights,
  type EquipmentQualitySource,
  type ShopReward,
} from './shop'

import {
  HARDCORE_BACKUP_KEY,
  createInitialHardcoreState,
  ensureHardcoreState,
  getActiveGateEchoes,
  hasActiveGateEchoes,
  canUseMajorAction,
  generateGateEchoesForDate,
  compactGateEchoHistory,
} from './gateEchoes'
import {
  shouldTriggerHardcoreDeathFromSession,
  shouldApplyHardcoreDeathReset,
  shouldApplyShadowCollapse,
} from './manualBattleSessionGuards'

import { registerLegionNodeLevelResolver } from './shadowStats'
import {
  canHunterAnswerLoveCall,
  getEffectiveRenown,
  getRenownGainForGate,
  getRenownProgress,
  getRenownTier,
} from './renown'

// ── World Map Shadow Guard Constants (L3 / L4) ────────────────
export const WORLD_SHADOW_GUARD_DEF_FACTOR = 0.25      // 그림자당 헌터 방어력 버프 비율
export const WORLD_SHADOW_GUARD_EVASION_FACTOR = 0.05  // 그림자당 헌터 회피 버프 비율
export const WORLD_SHADOW_GUARD_DR_FACTOR = 0.5        // 그림자 탱킹 대미지 감쇄 비율

// ── Monarch Shadow Guard Constants (L4-B) ─────────────────────
// Deprecated: Monarch Shadow Guard A-way direct stat buffs are removed.
// We now use B-way Shadow Shield (protect redirection & dynamic safeguard shield).
export const MONARCH_SAFEGUARD_DR_VALUE = 0.15          // 군주전 그림자 장벽 기본 대미지 감쇄 비율
export const MONARCH_SAFEGUARD_DURATION_ROUNDS = 4      // 군주전 그림자 장벽 유지 라운드 수

// ── World Map NPC Cooperation Constants (L1-A) ────────────────
export const COOP_HELP_ATK_FACTOR = 0.10  // 협력자 합산 CP의 10%를 플레이어 공격력에 더함
export const COOP_HELP_DEF_FACTOR = 0.10  // 협력자 합산 CP의 10%를 플레이어 방어력에 더함
export const COOP_HELP_DR_FACTOR = 0.20   // 협력자 1명당 대미지 감소 20% 추가 (shield type)
export const COOP_HELP_DR_CAP = 0.5       // 협력자 대미지 감소 최대 50% 상한
export const COOP_REWARD_PENALTY_PER_HELPER = 0.15 // 협력자 1명당 플레이어 보상 15% 차감
export const COOP_REWARD_MIN_RATIO = 0.3   // 최소 보상 30% 보장

function appendMessageOnce(messages: SystemMessage[], nextMessage: SystemMessage): SystemMessage[] {
  if (!messages) return [nextMessage]
  const recentWindow = messages.slice(-5)
  const isDuplicate = recentWindow.some(m => {
    if (m.title !== nextMessage.title) return false
    const firstLineA = m.lines?.[0]
    const firstLineB = nextMessage.lines?.[0]
    return firstLineA === firstLineB
  })

  if (isDuplicate) {
    return messages
  }
  return [...messages, nextMessage]
}

function rollRedGateInstability(runState: GateRunState, encounterId: string, customIncrease?: number): boolean {
  if (!runState) return false
  if (!runState.redGateState) {
    runState.redGateState = { status: 'none', instabilityScore: 0 }
  }

  const red = runState.redGateState
  // 이미 열렸거나 클리어/실패된 경우 재판정 금지 (Gate당 최대 1회 개방 보장)
  if (red.status === 'opened' || red.status === 'cleared' || red.status === 'failed') return false

  // 1. instabilityScore 누적
  const increase = customIncrease ?? 5
  red.instabilityScore = Math.min(100, red.instabilityScore + increase)

  // 개방 판정 롤링 개시
  red.status = 'unstable'
  
  // 개방 기본 확률: instabilityScore * 0.4%
  const baseChance = red.instabilityScore * 0.004

  // 게이트 랭크 및 보스 보정 가중치
  const gate = GATE_DEFINITIONS.find(g => g.id === runState.gateId)
  const rank = gate?.rank ?? 'E'
  const isBossGate = runState.gateId.includes('boss') || rank === 'S' || gate?.rewardTableId?.includes('boss')
  
  let rankMultiplier = 1.0
  if (rank === 'E' || rank === 'D') rankMultiplier = 0.2
  else if (rank === 'C' || rank === 'B') rankMultiplier = 0.6
  else if (rank === 'A') rankMultiplier = 1.0
  else if (rank === 'S') rankMultiplier = 1.5
  
  if (isBossGate) rankMultiplier *= 2.0

  const finalChance = baseChance * rankMultiplier

  // 3. 개방 여부 롤링
  if (Math.random() < finalChance) {
    red.status = 'opened'
    red.triggeredAtEncounterId = encounterId
    red.redGateSeed = `${runState.seed}-red-${Date.now()}`
    
    // 레드 게이트 전용 붉은 보정 수치 주입
    red.extractionBonusPercent = 5 + Math.floor(Math.random() * 6)  // +5~10% 절대 보정 성공률
    red.highGradeShadowBonus = 20 + Math.floor(Math.random() * 16)  // +20~35% 고등급 가중치
    red.bossShadowWeightBonus = 10 + Math.floor(Math.random() * 11)  // +10~20% 보스/네임드 가중치
    red.fragmentBonusCount = 1 + Math.floor(Math.random() * 2)     // 실패 시 추가 잔향 조각 수 +1~2개

    // 4. 남은 던전의 붉은 변형 (정책 A)
    if (runState.encounters) {
      runState.encounters.forEach((enc: GateRunEncounter) => {
        if (enc.status === 'cleared') return
        
        // 난이도 및 보상 가산
        enc.difficultyMod = (enc.difficultyMod ?? 1.0) + (0.2 + Math.random() * 0.25)
        enc.rewardMultiplier = (enc.rewardMultiplier ?? 1.0) + (0.15 + Math.random() * 0.15)
        
        enc.title = `[RED GATE] ${enc.title}`
        if (enc.type === 'battle' || enc.type === 'elite' || enc.type === 'boss') {
          enc.description = `[레드 게이트 변이] 붉게 뒤틀린 차원의 불안정성이 전장에 유입되어 적들이 폭주하고 전리품의 가치가 상승했습니다. ${enc.description}`
        }
      })
    }
    return true
  }
  return false
}

export interface GameState {
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
  activeWorldGate?: ActiveGate
  riftNodes: Record<string, RiftNodeStatus>
  activeRiftNodeId?: string
  livingWorld?: LivingWorldState
  initOrResetLivingWorld: (seed?: number) => void
  combatLogs: CombatLog[]
  manualBattleSession?: ManualBattleSession
  ownedShadows: OwnedShadow[]
  equippedShadowIds: string[]
  shadowExtractHistory?: ShadowExtractResult[]
  shadowExtractFailCount?: Record<string, number>
  lastShadowExtractResult?: ShadowExtractResult
  gold?: number
  shadowEssence?: number
  mutationMaterialNormal?: number
  mutationMaterialAdvanced?: number
  mutationMaterialSupreme?: number
  shadowEnhanceStones?: Record<ShadowRarity, number>
  shadowSummonTickets?: ShadowSummonTicket[]
  expeditionTickets?: number
  shadowSummonShards?: Partial<Record<ShadowSummonShardType, number>>
  shadowFragments?: Record<string, number>
  shadowAchievementTicketClaims?: Record<string, string>
  shadowExpeditions: ShadowExpedition[]
  enhanceShadowWithStone: (shadowInstanceId: string, stoneRarity: ShadowRarity) => void
  lastShadowExpeditionDate?: string
  activeShadowExpeditionId?: string
  completedSpecialExpeditionIds?: string[]
  shadowLegionNodes?: Record<string, number>
  infiniteTower?: InfiniteTowerState
  activeWorldBattle?: WorldBattleSession
  worldBattleRetreats?: Record<string, string>
  rewardBoxes?: RewardBox[]
  lastDailyBoxDate?: string
  lastWeeklyBoxWeek?: string
  todayChallengeCards?: ChallengeCard[]
  selectedChallengeCardIds?: string[]
  lastChallengeCardDate?: string
  challengeCardHistory?: Record<string, { completedIds: string[]; completedCount: number }>
  shopPurchases?: Record<string, number>
  skillStates?: Record<string, SkillRuntimeState>
  secretProgress?: SecretProgressState
  aiCoachMemory?: AiCoachMemoryState
  aiCoachCoreContext?: AiCoachCoreContext
  /** 12-40F: 현실 행동 기반 게임 준비도 상태 */
  dailyProgression?: DailyProgressionState
  focusSession?: FocusSessionState
  shadowAutoSweepState?: ShadowAutoSweepState
  assignShadowToAutoSweep: (shadowInstanceId: string) => void
  removeShadowFromAutoSweep: (shadowInstanceId: string) => void
  claimAutoSweepRewards: () => { gold: number; shadowEssence: number; xp: number; items: { name: string; icon: string; quantity: number }[]; elapsedMinutes: number; mutatedNames: string[] } | null

  initialized: boolean

  // hunter
  setHunterName: (name: string) => void
  setHunterJob: (job: string) => void
  allocateFreeStat: (stat: StatKey) => void

  // quests
  addQuest: (q: Omit<Quest, 'id' | 'createdAt'>) => void
  addAiCoachDailyQuest: (input: { title: string; description?: string; category: Category; difficulty: Difficulty; coachReason?: string; priority?: 'core' | 'support' | 'recovery' | 'maintenance' | 'optional'; estimatedMinutes?: number }) => void
  replaceAiCoachDailyPlan: (quests: any[], targetDate: string) => void
  updateAiCoachCoreContext: (text: string) => void
  clearAiCoachCoreContext: () => void
  removeQuest: (id: string) => void
  completeQuest: (id: string) => void
  uncompleteDaily: (id: string) => void
  resetDailiesIfNewDay: () => void
  debugAdvanceLivingWorldDay: () => void
  
  // Main Quest v2용 액션들
  addMainQuest: (input: { title: string; description?: string; category: Category; finalGoal: string; milestones?: Omit<MainQuestMilestone, 'id' | 'status'>[]; source?: 'user' | 'aiCoach'; coachReason?: string }) => void
  updateMainQuest: (id: string, patch: Partial<Quest>) => void
  addMainQuestMilestone: (mainQuestId: string, milestone: Omit<MainQuestMilestone, 'id' | 'status'>) => void
  updateMainQuestMilestone: (mainQuestId: string, milestoneId: string, patch: Partial<MainQuestMilestone>) => void
  completeMainQuestMilestone: (mainQuestId: string, milestoneId: string, evidenceNote?: string) => void
  skipMainQuestMilestone: (mainQuestId: string, milestoneId: string) => void
  completeMainQuest: (mainQuestId: string) => void

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
  advanceToJob: (jobId: JobId) => void
  changeActiveJob: (jobId: JobId) => void

  // random quests
  rollRandomQuestForToday: () => void
  completeRandomQuest: () => void
  skipRandomQuest: () => void
  clearExpiredRandomQuest: () => void

  // equipment
  equipItem: (itemId: string) => void
  unequipItem: (slot: EquipmentSlot) => void
  enhanceItem: (itemId: string) => { success: boolean; greatSuccess: boolean; prevLevel: number; nextLevel: number } | undefined
  enhanceItemWithGold: (itemId: string) => { success: boolean; greatSuccess: boolean; prevLevel: number; nextLevel: number; cost: number } | undefined

  // consumables
  useConsumable: (itemId: string) => void
  clearConsumedConsumableEffects: () => void
  clearExpiredConsumableEffects: () => void

  // gates
  setActiveGate: (gate: ActiveGate | undefined) => void
  clearExpiredGate: () => void
  rollGateSpawn: (source: 'daily_open' | 'daily_completion' | 'random_completion' | 'dungeon_clear' | 'hard_dungeon_clear' | 'main_completion') => void
  spawnGate: (gateId: string, source: 'random' | 'dungeon_clear' | 'event' | 'worldmap', helperHunterIds?: string[], customGateDef?: any) => void
  recoverGateStamina: () => void
  recoverGateInjuryByQuest: () => void
  clearGateInjuryIfExpired: () => void
  addCombatLog: (log: CombatLog) => void
  clearCombatLogs: () => void
  startGateBattle: () => void
  resolveDirectGateBattle: (combatLog: CombatLog) => void
  discoverRiftNode: (nodeId: string) => void
  enterRiftNode: (nodeId: string) => void
  markRiftNodeCleared: (nodeId: string) => void
  startManualGateBattle: (gateId?: string) => void
  performManualBattleAction: (action: ManualBattleAction) => void
  cancelManualGateBattle: () => void
  switchManualBattleToAuto: () => void
  chooseGateRunEventChoice: (choiceId: string, encounterId?: string, gateInstanceId?: string) => void
  claimGateRunTreasure: (gateInstanceId?: string) => void
  performGateRunRest: (option: 'heal' | 'buff' | 'cooldown', gateInstanceId?: string) => void
  absorbGateRunShadowTrace: (gateInstanceId?: string) => void
  abandonGateRun: (gateInstanceId?: string) => void
  attemptShadowExtraction: (gateInstanceId: string) => void
  equipShadow: (shadowId: string) => void
  unequipShadow: (shadowId: string) => void
  grantAchievementNamedShadows: () => void
  applyMainQuestCompletionBonus: (quest: Quest) => void
  summonShadowFromTicket: (ticketId: string) => void
  summonShadowFromFragments: (definitionId: string) => void
  exchangeShadowSummonShards: (ticketType: 'normal_shadow' | 'rare_shadow' | 'role_shadow' | 'gate_named_shadow' | 'achievement_named_shadow', role?: OwnedShadow['role']) => void
  absorbShadow: (targetInstanceId: string) => void
  decomposeShadow: (shadowInstanceId: string) => void
  toggleShadowLock: (shadowInstanceId: string) => void
  toggleShadowFavorite: (shadowInstanceId: string) => void
  evolveShadow: (shadowInstanceId: string) => void
  mutateShadow: (shadowInstanceId: string, materialGrade: 'normal' | 'advanced' | 'supreme') => void
  trainShadowWithEssence: (shadowInstanceId: string, optionId: string) => void
  buyShadowTicketWithEssence: () => void
  buyExtractionCatalystWithEssence: () => void
  reawakenShadowInnateGrade: (shadowInstanceId: string) => void
  rerollShadowTrait: (shadowInstanceId: string, slotIndex: number) => void
  unlockShadowSlot: (shadowInstanceId: string, slotType: 'skill' | 'passive') => void
  equipShadowSlotAbility: (shadowInstanceId: string, slotType: 'skill' | 'passive', slotIndex: number, abilityId: string) => void
  upgradeLegionNode: (nodeId: string) => void
  craftHiddenEvolutionMaterial: (itemId: string) => void
  ensureTodayShadowExpedition: () => void
  selectShadowExpeditionParty: (expeditionId: string, shadowIds: string[]) => void
  startShadowExpedition: (expeditionId: string) => void
  issueShadowExpeditionCommand: (expeditionId: string, command: ShadowExpeditionCommand) => void
  abandonShadowExpedition: (expeditionId: string) => void
  resolveShadowExpeditionMidEvent: (expeditionId: string, choiceId: string) => void
  resolveSpecialExpeditionBattle: (expeditionId: string, outcome: 'victory' | 'defeat', logs: any[]) => void
  retrySpecialExpedition: (expeditionId: string) => void

  // infinite tower
  startTowerBattle: (floor: number) => void
  resolveTowerBattle: () => void
  resolveDirectTowerBattle: (combatLog: CombatLog, floor: number) => void
  cancelTowerBattle: () => void
  startTowerManualBattle: (floor: number) => void
  performTowerManualBattleAction: (action: ManualBattleAction) => void
  cancelTowerManualBattle: () => void
  switchTowerManualBattleToAuto: () => void

  // world map battle (L3)
  startWorldBattle: (nodeId: string, helperHunterIds?: string[]) => void
  resolveWorldBattle: () => void
  resolveDirectWorldBattle: (combatLog: CombatLog, nodeId: string, helperHunterIds?: string[]) => void
  cancelWorldBattle: () => void
  resolveWorldGateBattleOutcome: (activeGate: ActiveGate, gate: any, combatLog: CombatLog) => void
  startWorldManualBattle: (nodeId: string, helperHunterIds?: string[]) => void
  performWorldManualBattleAction: (action: ManualBattleAction) => void
  cancelWorldManualBattle: () => void
  switchWorldManualBattleToAuto: () => void
  resolveEndingChoice: (choice: 'surface' | 'true') => void
  acceptWorldOpportunity: (nodeId: string) => { success: boolean; loreText?: string; message?: string }

  // rewards / challenge cards
  ensureDailyRewardSystems: () => void
  openRewardBox: (boxId: string) => void
  selectChallengeCards: (cardIds: string[]) => void
  purchaseShopProduct: (productId: string, quantity?: number) => void

  // achievements
  recordAppOpen: () => void

  // messages
  pushMessage: (m: Omit<SystemMessage, 'id' | 'createdAt'>) => void
  dismissMessage: (id: string) => void
  clearMessages: () => void

  // dev
  hardReset: () => void
  selectSkillUpgrade: (skillId: string, upgradeId: string) => void
  hardResetAll: () => void
  resetGameProgressOnly: () => void
  triggerVictoryReset: () => void

  // metadata sync
  syncDefaultQuestMetadata: () => void
  syncDefaultEquipmentStats: () => void
  ensureMainQuestMilestonesBackfilled: () => void

  // ai coach memory
  recordAiCoachSession: (session: Omit<AiCoachSessionRecord, 'id' | 'createdAt'>) => void
  recordAiCoachPlannedQuests: (quests: Omit<AiCoachQuestOutcome, 'status' | 'addedAt'>[]) => void
  updateAiCoachQuestOutcomeOnComplete: (questId: string) => void
  rebuildAiCoachRollingSummary: () => void

  // 12-40F: daily progression
  recalculateDailyProgression: () => void

  // 12-41A: Focus Session Actions
  startFocusSession: (plannedDurationMs: number, linkedGateId?: string) => void
  tickFocusSession: (customNow?: number) => void
  pauseFocusSession: (customNow?: number) => void
  resumeFocusSession: (customNow?: number) => void
  recordFocusInterruption: (durationMs: number, customNow?: number) => void
  completeFocusSession: (customNow?: number) => void
  cancelFocusSession: (failReason?: 'interruption_limit_exceeded' | 'manual_cancel' | 'refresh_guard' | 'unknown', customNow?: number) => void

  // 12-41B: Hunter Grade / Association Rating Actions
  hunterGrade?: HunterGradeState
  recalculateHunterGrade: (reason?: string) => void
  equipHunterTitle: (titleId: string) => void
  acknowledgePromotionExam: () => void
  startPromotionExam: (targetGrade: HunterGradeTier) => void
  completePromotionExam: (targetGrade: HunterGradeTier) => void
  checkGateClearHooks: (gateId: string, isVictory: boolean) => void
  emitWorldSignal: (templateId: WorldSignalTemplateId) => void

  // 12-44A: Hardcore / Gate Echo Actions
  hardcoreState?: HardcoreState
  resolveGateEchoBattle: (echoId: string, combatLog: CombatLog) => void
  finalizeHardcoreDeathFromSession: () => void
  restoreShadowFromCollapse: (shadowId: string) => void
  crystallizeCollapsedShadow: (shadowId: string) => void
  runes: RuneItem[]
  equipRune: (runeId: string, targetId: string, targetType: 'shadow' | 'equipment', slotIndex: number) => void
  unequipRune: (targetId: string, targetType: 'shadow' | 'equipment', slotIndex: number) => void
  enhanceRuneWithGold: (runeId: string) => { success: boolean; greatSuccess: boolean; prevLevel: number; nextLevel: number; cost: number } | undefined
}

const initialHunter: HunterState = {
  name: '플레이어',
  level: 1,
  xp: 0,
  totalXp: 0,
  renown: 0,
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
  activeJobId: 'novice-hunter',
  jobs: { 'novice-hunter': { jobId: 'novice-hunter', level: 1, xp: 0 } },
  availableAdvancements: [],
  discoveredHiddenJobIds: [],
}

const gainActiveJobXp = (
  hunter: HunterState,
  baseXp: number,
  category: Category
): { hunter: HunterState; jobXpGained: number; jobCategoryBonus: number; jobLeveledUp: boolean; jobPrevLevel: number; jobNextLevel: number; activeJobName: string } => {
  const activeJobId = hunter.activeJobId || 'novice-hunter'
  const v2JobDef = JOB_DEFINITIONS_V2.find(j => j.id === activeJobId)
  const jobCategoryBonus = v2JobDef?.growthAffinity?.questCategoryBonus?.[category] ?? 0
  const jobXpGained = Math.round(baseXp * (1 + jobCategoryBonus))
  
  const nextJobs = { ...(hunter.jobs || {}) }
  const jobState = nextJobs[activeJobId] 
    ? { ...nextJobs[activeJobId] }
    : { jobId: activeJobId, level: 1, xp: 0, unlockedAt: new Date().toISOString() }
  
  const jobPrevLevel = jobState.level
  jobState.xp += jobXpGained
  
  let jobLeveledUp = false
  while (true) {
    const reqXp = jobState.level * 150
    if (jobState.xp >= reqXp && jobState.level < 50) {
      jobState.xp -= reqXp
      jobState.level += 1
      jobLeveledUp = true
    } else {
      break
    }
  }
  
  nextJobs[activeJobId] = jobState
  const activeJobName = v2JobDef ? v2JobDef.name : activeJobId.toString()
  
  return {
    hunter: {
      ...hunter,
      jobs: nextJobs
    },
    jobXpGained,
    jobCategoryBonus,
    jobLeveledUp,
    jobPrevLevel,
    jobNextLevel: jobState.level,
    activeJobName
  }
}

const createInitialAchievementStats = (): AchievementStats => {
  const emptyByCategory: Record<Category, number> = {} as Record<Category, number>
  for (const cat of Object.keys(CATEGORY_META) as Category[]) {
    emptyByCategory[cat] = 0
  }

  return {
    gateClearedCount: 0,
    redGateClearedCount: 0,
    bossKillsCount: 0,
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

const getMonarchsDefeatedCount = (world?: LivingWorldState): number =>
  world?.activeMonarchs?.filter(monarch => monarch.status === 'defeated').length ?? 0

const getCurrentRenownTier = (
  state: Pick<GameState, 'hunter' | 'achievementStats' | 'livingWorld'>
) => getRenownTier(getEffectiveRenown(
  state.hunter,
  state.achievementStats,
  getMonarchsDefeatedCount(state.livingWorld)
))

const filterWorldHelperHunterIds = (
  state: Pick<GameState, 'hunter' | 'achievementStats' | 'livingWorld'>,
  helperHunterIds?: string[]
): { allowedIds: string[]; rejectedHunters: NamedHunter[] } => {
  if (!helperHunterIds?.length || !state.livingWorld) {
    return { allowedIds: [], rejectedHunters: [] }
  }

  const tier = getCurrentRenownTier(state)
  const seen = new Set<string>()
  const allowedIds: string[] = []
  const rejectedHunters: NamedHunter[] = []

  for (const hid of helperHunterIds) {
    if (seen.has(hid)) continue
    seen.add(hid)

    const hunter = state.livingWorld.namedHunters[hid]
    if (!hunter) continue
    if (canHunterAnswerLoveCall(hunter.rank, tier.maxHelperRank)) {
      allowedIds.push(hid)
    } else {
      rejectedHunters.push(hunter)
    }
  }

  return { allowedIds, rejectedHunters }
}

const appendRejectedHelperMessage = (
  messages: SystemMessage[],
  rejectedHunters: NamedHunter[],
  maxHelperRank: Rank
): SystemMessage[] => {
  if (rejectedHunters.length === 0) return messages
  const names = rejectedHunters.map(hunter => `${hunter.name}(${hunter.rank})`).join(', ')
  return appendMessageOnce(messages, {
    id: uid(),
    kind: 'info',
    title: '협력 요청 제한',
    lines: [
      `현재 명성으로는 ${maxHelperRank}급 이하 헌터만 협력 요청에 응답합니다.`,
      `제외됨: ${names}`,
    ],
    createdAt: todayISO(),
  })
}

const applyRenownGain = (
  hunter: HunterState,
  previousState: Pick<GameState, 'hunter' | 'achievementStats' | 'livingWorld'>,
  nextAchievementStats: AchievementStats,
  gain: number,
  sourceLabel: string,
  nextMonarchsDefeatedCount = getMonarchsDefeatedCount(previousState.livingWorld)
): { hunter: HunterState; messages: SystemMessage[]; worldLog?: string } => {
  const previousRenown = getEffectiveRenown(
    previousState.hunter,
    previousState.achievementStats,
    getMonarchsDefeatedCount(previousState.livingWorld)
  )
  const previousTier = getRenownTier(previousRenown)
  const baseRenown = Math.max(hunter.renown ?? 0, previousRenown)
  const nextHunter = { ...hunter, renown: baseRenown + Math.max(0, gain) }
  const nextRenown = getEffectiveRenown(nextHunter, nextAchievementStats, nextMonarchsDefeatedCount)
  const nextTier = getRenownTier(nextRenown)

  if (nextTier.id === previousTier.id) {
    return { hunter: nextHunter, messages: [] }
  }

  const nextInfo = getRenownProgress(nextRenown)
  const message: SystemMessage = {
    id: uid(),
    kind: 'rank',
    title: '명성 등급 상승',
    lines: [
      `${previousTier.label} → ${nextTier.label}`,
      `세계가 당신을 ${nextTier.label} 헌터로 인정하기 시작했습니다.`,
      `협력 응답 상한: ${nextTier.maxHelperRank}급 이하`,
      nextInfo.next ? `다음 명성까지 ${Math.max(0, nextInfo.next.min - nextRenown)} 필요` : '국가권력급 헌터까지 협력 후보에 응답합니다.',
      `계기: ${sourceLabel}`,
    ],
    createdAt: todayISO(),
  }

  return {
    hunter: nextHunter,
    messages: [message],
    worldLog: `[명성 상승] 세계가 플레이어를 [${nextTier.label}]으로 인정하기 시작했습니다. (${nextTier.maxHelperRank}급 이하 협력 가능)`,
  }
}

const directSkillIdFromTurn = (turn: BattleTurn): string | undefined => {
  if (turn.actorType !== 'player' || !turn.skillId) return undefined
  const directSkillMatch = turn.skillId.match(/:skill:([^:]+)$/)
  const candidate = directSkillMatch?.[1] ?? turn.skillId
  const skill = SKILL_DEFINITIONS.find(item => item.id === candidate)
  if (!skill || !isHunterCombatSkill(skill)) return undefined
  if (candidate === BASIC_ATTACK_SKILL.id || candidate === 'basic-guard-stance' || candidate === 'manual-defend') return undefined
  return candidate
}

const applyDirectBattleSkillRuntimeUses = (
  skillStates: Record<string, SkillRuntimeState> | undefined,
  turns: BattleTurn[],
  isVictory = false,
  isBoss = false,
  skillXpBonus = 0,  // 12-40F: daily progression 기반 스킬 XP 배율 보너스
): Record<string, SkillRuntimeState> | undefined => {
  let next = skillStates ?? {}
  let changed = false

  const skillUseCounts: Record<string, number> = {}
  for (const turn of turns) {
    const skillId = directSkillIdFromTurn(turn)
    if (!skillId) continue
    skillUseCounts[skillId] = (skillUseCounts[skillId] ?? 0) + 1
  }

  for (const [skillId, count] of Object.entries(skillUseCounts)) {
    const skill = SKILL_DEFINITIONS.find(s => s.id === skillId)
    if (!skill) continue

    const cooldown = getSkillCooldownTurns(skill)
    const baseGain = cooldown > 0 ? 3 : 2
    let totalGain = baseGain * count

    if (isVictory) totalGain += 1
    if (isBoss) totalGain += 1

    // 12-40F: 현실 준비도 스킬 XP 보너스 적용
    if (skillXpBonus > 0) {
      totalGain = Math.round(totalGain * (1 + skillXpBonus))
    }

    // Soft Cap (최대 20 XP, 보너스 반영 후)
    if (totalGain > 20) totalGain = 20

    next = recordSkillRuntimeUse(next, skillId, totalGain)
    changed = true
  }

  return changed ? next : skillStates
}

const SIGNAL_WEIGHTS: Record<string, Array<{ pathId: 'shadow' | 'curse' | 'rift'; weight: number }>> = {
  'shadow-extraction-attempt': [{ pathId: 'shadow', weight: 1 }],
  'shadow-extract-success': [{ pathId: 'shadow', weight: 3 }],
  'shadow-rare-acquired': [{ pathId: 'shadow', weight: 4 }],
  'shadow-named-acquired': [{ pathId: 'shadow', weight: 5 }],
  'shadow-evolved': [{ pathId: 'shadow', weight: 5 }],
  'shadow-expedition-success': [{ pathId: 'shadow', weight: 2 }],
  'shadow-expedition-great': [{ pathId: 'shadow', weight: 4 }],

  'low-hp-victory': [{ pathId: 'curse', weight: 3 }],
  'low-hp-boss-victory': [{ pathId: 'curse', weight: 5 }],
  'long-battle-victory': [
    { pathId: 'curse', weight: 2 },
    { pathId: 'rift', weight: 2 }
  ],
  'tower-boss-clutch-victory': [{ pathId: 'rift', weight: 5 }],
  'rift-special-victory': [{ pathId: 'rift', weight: 3 }],
  'debuff-skill-use': [{ pathId: 'curse', weight: 3 }]
}

const addHiddenSignalToState = (hunter: HunterState, signalKey: string): HunterState => {
  const currentProgress = hunter.hiddenResonanceProgress || {}
  const currentSignalKeys = hunter.hiddenSignalKeys || []
  
  const nextSignalKeys = Array.from(new Set([...currentSignalKeys, signalKey]))

  const nextProgress = { ...currentProgress }
  const mappings = SIGNAL_WEIGHTS[signalKey] || []
  
  mappings.forEach(({ pathId, weight }) => {
    const prev = nextProgress[pathId] || {
      pathId,
      resonance: 0,
      signals: {}
    }
    
    const prevSignals = prev.signals || {}
    const nextSignals = {
      ...prevSignals,
      [signalKey]: (prevSignals[signalKey] || 0) + 1
    }
    
    const nextResonance = prev.resonance + weight
    
    nextProgress[pathId] = {
      ...prev,
      resonance: nextResonance,
      signals: nextSignals,
      discoveredAt: prev.discoveredAt || todayISO()
    }
  })

  return {
    ...hunter,
    hiddenSignalKeys: nextSignalKeys,
    hiddenResonanceProgress: nextProgress
  }
}

export const migrateHiddenResonance = (hunter: HunterState): HunterState => {
  if (hunter.hiddenResonanceProgress && Object.keys(hunter.hiddenResonanceProgress).length > 0) {
    return hunter
  }
  
  let nextHunter = { ...hunter }
  const signals = hunter.hiddenSignalKeys || []
  signals.forEach(sig => {
    nextHunter = addHiddenSignalToState(nextHunter, sig)
  })
  
  return nextHunter
}

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

const appendLivingWorldEvent = (
  world: LivingWorldState,
  event: WorldEvent,
  logLine?: string
): LivingWorldState => ({
  ...world,
  eventLogs: [
    ...world.eventLogs,
    logLine ?? `[Day ${world.day}] ${event.title}: ${event.body}`,
  ].slice(-60),
  recentEvents: [
    ...(world.recentEvents ?? []),
    event,
  ].slice(-60),
})

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

// ── 12-41A: Focus Session Reward Builder ──
const buildFocusSessionReward = (
  focusedMs: number,
  plannedDurationMs: number,
  completed: boolean,
  interruptionCount: number,
  linkedGateId?: string,
  redGateResistBonus: number = 0
): FocusSessionRewardSummary => {
  const focusedMin = focusedMs / (60 * 1000)
  const plannedMin = plannedDurationMs / (60 * 1000)

  // Keep focus sessions motivational without making them a primary economy faucet.
  const goldPerMinute = 2
  const essencePerFiveMinutes = 3
  let gold = Math.floor(focusedMin * goldPerMinute)
  let essence = Math.floor(focusedMin / 5 * essencePerFiveMinutes)

  // Completion still matters, but should not double-dip into large timer payouts.
  const completionMultiplier = completed ? 1.2 : 1.0
  gold = Math.floor(gold * completionMultiplier)
  essence = Math.floor(essence * completionMultiplier)

  // interruptionCount에 따른 페널티 (1회당 -5%, 최대 30% 감쇄)
  const penaltyFactor = Math.max(0.7, 1 - interruptionCount * 0.05)
  gold = Math.floor(gold * penaltyFactor)
  essence = Math.floor(essence * penaltyFactor)

  // focus axis score stays separate from spendable currency, but is also toned down.
  let focusAxisBonus = Math.floor(focusedMin * 0.4)
  if (completed) {
    focusAxisBonus += Math.floor(plannedMin * 0.1)
  }

  // 25+ minute clears can still surprise the player, just much less often.
  let shadowFragments: number | undefined = undefined
  if (completed && focusedMin >= 25) {
    const prob = focusedMin >= 50 ? 0.12 : 0.05
    if (Math.random() < prob) {
      shadowFragments = 1
    }
  }

  // instability 계산 (이탈이 있고 linkedGate가 있는 경우만 누적)
  let instabilityAdded: number | undefined = undefined
  if (interruptionCount > 0 && linkedGateId) {
    // 이탈 1회당 4 점씩 누적
    const rawInstability = interruptionCount * 4
    // redGateResistBonus (최대 0.25) 만큼 차감
    instabilityAdded = Math.max(0, Math.round(rawInstability * (1 - redGateResistBonus)))
  }

  // extraction bonus is a small nudge, not a major extraction-rate source.
  let extractionBonus: number | undefined = undefined
  if (completed && linkedGateId) {
    extractionBonus = Math.max(0.0, parseFloat((0.04 - interruptionCount * 0.01).toFixed(3)))
  }

  return {
    focusAxisBonus,
    essence,
    gold,
    shadowFragments,
    extractionBonus,
    instabilityAdded,
  }
}

// ── 12-40F: Daily Progression Builder ─────────────────────────────────
// 현실 행동 완료도를 0~100 스코어로 계산하여 DailyProgressionState를 반환한다.
// 퀘스트 미완료에 패널티를 주지 않되, 완료할수록 게임 준비도가 상승한다.
const buildDailyProgression = (
  quests: Quest[],
  achievementStats: AchievementStats
): DailyProgressionState => {
  // AI 코치 플랜 생성 날짜를 하루의 기준으로 사용 (24시간 캘린더 기준 아님)
  const dateKey = getActivePlanDateKey(quests)

  // 현재 AI 플랜의 퀘스트 IDs를 추출하여 플랜 기반 완료 집계
  const aiDailies = quests.filter(
    (q) =>
      q.type === 'daily' &&
      !q.recurring &&
      (q.coachGenerated === true || q.coachPlanId !== undefined || q.coachReason !== undefined) &&
      q.coachPlanDate === dateKey,
  )
  const planQuestIds = new Set(aiDailies.map((q) => q.id))

  // 플랜 퀘스트 IDs 기준으로 모든 dailyHistory에서 완료 ID 수집
  const completedIds: string[] = []
  for (const dayRecord of Object.values(achievementStats.dailyHistory ?? {})) {
    for (const questId of dayRecord.completedDailyQuestIds ?? []) {
      if (planQuestIds.has(questId)) completedIds.push(questId)
    }
  }
  // recurring daily 완료는 calendar dateKey 기준으로 확인
  const calendarCompletedIds = achievementStats.dailyHistory?.[todayKey()]?.completedDailyQuestIds ?? []

  // 현재 플랜의 퀘스트 목록 (AI 플랜 + recurring daily)
  const todayDailies = quests.filter(q => q.type === 'daily')
  // 완료 판단: AI 플랜 퀘스트는 플랜 기반 completedIds, 일반 recurring는 calendar completedIds
  const completedToday = todayDailies.filter(q => {
    if (!q.recurring && planQuestIds.has(q.id)) return completedIds.includes(q.id)
    return calendarCompletedIds.includes(q.id)
  })

  // 카테고리별 완료 수 집계
  const byCategory: Partial<Record<Category, number>> = {}
  for (const q of completedToday) {
    byCategory[q.category] = (byCategory[q.category] ?? 0) + 1
  }

  // 총 daily 수 (가용 기준)
  const totalAvailable = Math.max(1, todayDailies.length)
  const totalCompleted = completedToday.length

  // 카테고리 그룹별 스코어 계산 (1개당 +25점, 최대 100)
  const focusCount = (byCategory['study'] ?? 0) + (byCategory['career'] ?? 0) + (byCategory['finance'] ?? 0)
  const bodyCount = (byCategory['workout'] ?? 0) + (byCategory['health'] ?? 0)
  const mindCount = (byCategory['mind'] ?? 0) + (byCategory['habit'] ?? 0)

  const focusResonance = Math.min(100, focusCount * 25)
  const bodyReadiness = Math.min(100, bodyCount * 30)
  const mindBalance = Math.min(100, mindCount * 25)
  // routineScore: 전체 완료율 기반 (0~100)
  const completionRate = totalCompleted / totalAvailable
  const routineScore = Math.min(100, Math.round(completionRate * 100))

  // 종합 준비도: 4개 축의 가중 평균
  const overallReadiness = Math.min(100, Math.round(
    focusResonance * 0.25 +
    bodyReadiness * 0.25 +
    mindBalance * 0.20 +
    routineScore * 0.30
  ))

  // 준비도 레벨 분류
  let readinessLevel: DailyReadinessLevel = 'dormant'
  if (overallReadiness >= 80) readinessLevel = 'transcendent'
  else if (overallReadiness >= 55) readinessLevel = 'resonant'
  else if (overallReadiness >= 35) readinessLevel = 'focused'
  else if (overallReadiness >= 15) readinessLevel = 'awakening'

  // 게임 보너스 산출 (overallReadiness 비례)
  const r = overallReadiness / 100
  const gateRewardBonus = parseFloat((r * 0.30).toFixed(3))        // 최대 +30%
  const redGateResistBonus = parseFloat((r * 0.25).toFixed(3))     // 최대 +25% 저항
  const skillXpBonus = parseFloat((r * 0.20).toFixed(3))           // 최대 +20%
  const extractionBonus = parseFloat((r * 0.15).toFixed(3))        // 최대 +15%

  // 리커버리 모드: 어제 daily를 하나도 완료하지 않았을 때 활성화
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayKey = yesterdayDate.toISOString().slice(0, 10)
  const yesterdayHistory = achievementStats.dailyHistory?.[yesterdayKey]
  const isRecoveryMode = (yesterdayHistory?.completedDailyCount ?? 0) === 0 && totalCompleted === 0

  return {
    dateKey,
    focusResonance,
    bodyReadiness,
    mindBalance,
    routineScore,
    overallReadiness,
    readinessLevel,
    gateRewardBonus,
    redGateResistBonus,
    skillXpBonus,
    extractionBonus,
    todayCompletionsByCategory: byCategory,
    todayTotalCompletions: totalCompleted,
    isRecoveryMode,
  }
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
  return rollWeightedNumber<EquipmentStars>(getEquipmentStarWeights(source))
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

  // In the promotion exam system, hunter.rank is strictly managed via exams.
  // We keep hunter.rank unchanged during normal XP gain/level ups.
  const newRank = hunter.rank
  const rankChanged = false

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

const convertDirectLogsToBattleTurns = (state: any, logs: any[]): BattleTurn[] => {
  return logs.map((log, index) => {
    const actor = state.units.find((unit: any) => unit.unitId === log.actorUnitId)
    const target = state.units.find((unit: any) => unit.unitId === log.targetUnitIds?.[0])
    const fallbackTarget = target ?? actor ?? state.units[0]
    const actorIsEnemy = actor?.team === 'enemy'
    const targetIsEnemy = fallbackTarget?.team === 'enemy'
    const outcome: BattleTurn['outcome'] =
      log.eventType === 'heal' ? 'heal' :
      log.eventType === 'status' || log.eventType === 'reaction' ? 'buff' :
      'hit'

    return {
      turnNumber: index + 1,
      waveNumber: Math.max(1, log.round),
      waveLabel: `Wave ${Math.max(1, log.round)}`,
      actorType: actorIsEnemy ? 'monster' : 'player',
      actorId: actor?.unitId ?? `direct-system-${index + 1}`,
      actorName: actor?.displayName ?? 'Direct Battle',
      targetType: targetIsEnemy ? 'monster' : 'player',
      targetId: fallbackTarget?.unitId ?? `direct-target-${index + 1}`,
      targetName: fallbackTarget?.displayName ?? 'Direct Battle',
      skillId: log.actionCue || 'basic-attack',
      skillName: log.actionCue || '기본 공격',
      outcome,
      damage: log.eventType === 'damage' ? log.value : undefined,
      remainingHp: fallbackTarget ? Math.round(fallbackTarget.stats.currentHp) : undefined,
      message: log.message,
    }
  })
}

const getManualActionCount = (logs: BattleTurn[]): number => {
  return logs.filter(log => !isManualSystemLog(log)).length
}

const appendManualWaveClearLogs = (params: {
  logs: BattleTurn[]
  monster: BattleActorState
  waveIndex: number
  remainingMonsterIds: string[]
  pressureSnapshot?: any
  isRedGate?: boolean
  isPromotionExam?: boolean
  targetGrade?: HunterGradeTier
  difficultyMod?: number
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
    monster = createMonsterBattleActor(
      nextMonsterDef,
      params.pressureSnapshot,
      params.isRedGate,
      params.difficultyMod,
      params.isPromotionExam,
      params.targetGrade
    )
    const diffMod = params.difficultyMod ?? 1.0
    if (diffMod !== 1.0) {
      monster.maxHp = Math.round(monster.maxHp * diffMod)
      monster.hp = monster.maxHp
      monster.atk = Math.round(monster.atk * diffMod)
      monster.def = Math.round(monster.def * diffMod)
    }
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
  if (quest?.type === 'dungeon') return Boolean(quest.completed)
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

export const shadowRestoreCost = (shadow: OwnedShadow): number => {
  const baseByRarity: Record<string, number> = {
    Common: 50,
    Normal: 100,
    Elite: 250,
    Knight: 500,
    'Elite Knight': 1000,
    Commander: 2000,
    General: 5000,
    Monarch: 10000,
  }
  const base = baseByRarity[shadow.rarity] ?? 100
  const gradeMult: Record<string, number> = {
    S: 1.5,
    A: 1.2,
    B: 1.0,
    C: 0.8,
  }
  const mult = gradeMult[shadow.innateGrade ?? 'B'] ?? 1.0
  const lvlExtra = (shadow.level ?? 1) * 15
  return Math.round(base * mult + lvlExtra)
}

const getGateClearExpeditionTickets = (gateRank: string, rng = Math.random): number => {
  const roll = rng()
  switch (gateRank) {
    case 'E': return roll < 0.05 ? 1 : 0
    case 'D': return roll < 0.10 ? 1 : 0
    case 'C': return roll < 0.25 ? 1 : 0
    case 'B': return roll < 0.50 ? 1 : 0
    case 'A': return roll < 0.80 ? 1 : 0
    case 'S': return roll < 0.20 ? 2 : 1
    default: return 0
  }
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
  let nextGold = s.gold ?? 0
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
  let rolledXP: { amount: number; isJackpot: boolean } = { amount: 0, isJackpot: false }
  let rolledGold: { amount: number; isJackpot: boolean } = { amount: 0, isJackpot: false }

  // 12-44Z-FINAL: 일반 게이트 및 레드 게이트 아군 그림자 붕괴 정산 처리
  const isExam = activeGate.runState?.isPromotionExam
  const shouldCollapse = shouldApplyShadowCollapse(combatLog.source || 'gate') && !isExam
  let nextEquippedShadowIds = s.equippedShadowIds ?? []
  
  if (shouldCollapse && combatLog.shadowCasualtyIds && combatLog.shadowCasualtyIds.length > 0) {
    const casualtySet = new Set(combatLog.shadowCasualtyIds)
    nextOwnedShadows = nextOwnedShadows.map(shadow => {
      if (casualtySet.has(shadow.instanceId)) {
        return {
          ...shadow,
          collapsed: true,
          status: 'collapsed' as const,
          collapsedAt: Date.now(),
          collapseReason: 'gate_battle',
          restoreCost: shadowRestoreCost(shadow),
        }
      }
      return shadow
    })
    // 붕괴된 그림자는 출전 소대 편성에서 unequip 처리
    nextEquippedShadowIds = nextEquippedShadowIds.filter(id => !casualtySet.has(id))
  }

  const distributeShadowXp = (xp: number) => {
    if (xp > 0 && equippedShadows.length > 0) {
      for (const es of equippedShadows) {
        const idx = nextOwnedShadows.findIndex(sh => sh.instanceId === es.instanceId)
        if (idx === -1) continue
        const result = addShadowXp(nextOwnedShadows[idx], xp)
        nextOwnedShadows = nextOwnedShadows.map((sh, i) => i === idx ? result.shadow : sh)
        if (result.leveledUp) {
          shadowLevelUps.push(`${es.name} Lv.${result.newLevel}`)
        }
      }
    }
  }

  // ── [A] Multi-Encounter Dungeon Run 활성화 시 ──
  if (activeGate.runState) {
    const run = { ...activeGate.runState }
    const currentEncounter = run.encounters[run.currentEncounterIndex]
    const isVictory = combatLog.result === 'victory'

    if (isVictory) {
      currentEncounter.status = 'cleared'
      run.clearedEncounterIds = [...run.clearedEncounterIds, currentEncounter.id]

      const baseGold = getGateGoldReward(gate.rank)
      const baseXP = rewardTable?.xp ?? 100
      const baseEssence = gate.rank === 'E' ? 100 : gate.rank === 'D' ? 150 : gate.rank === 'C' ? 250 : gate.rank === 'B' ? 400 : gate.rank === 'A' ? 600 : 1000

      const portion = currentEncounter.type === 'elite' ? 0.5 : currentEncounter.type === 'boss' ? 0.6 : 0.25
      const rewardMod = (currentEncounter.rewardMultiplier ?? 1.0) * run.rewardMultiplier

      const rawXP = Math.round(baseXP * portion * rewardMod * getTitleXpMultiplier(s.hunter, 'challenge'))
      const rawGold = Math.round(baseGold * portion * rewardMod)
      const rawEssence = Math.round(baseEssence * portion * rewardMod)

      const rolledXP = rollValueReward(rawXP)
      const rolledGold = rollValueReward(rawGold)
      const rolledEssence = rollValueReward(rawEssence)

      const partialXP = rolledXP.amount
      const partialGold = rolledGold.amount
      const partialEssence = rolledEssence.amount

      const hasJackpot = rolledXP.isJackpot || rolledGold.isJackpot || rolledEssence.isJackpot

      run.accumulatedRewards.xp += partialXP
      run.accumulatedRewards.gold += partialGold
      run.accumulatedRewards.essence += partialEssence

      const dropChance = currentEncounter.type === 'elite' ? 0.35 : currentEncounter.type === 'boss' ? 0.60 : 0.10
      if (rewardTable && Math.random() < dropChance) {
        const titleRarityBonus = getTitleRarityBonus(s.hunter)
        const item = randomGateRewardItem(rewardTable, titleRarityBonus)
        if (item) {
          run.accumulatedRewards.items.push({
            type: 'item',
            itemId: item.id,
            itemName: item.name,
            rarity: item.rarity,
          })
          nextItems = [...nextItems, item]
        }
      }

      distributeShadowXp(Math.round(xpAmount * portion))

      const isLast = run.currentEncounterIndex === run.encounters.length - 1

      if (!isLast) {
        const nextIndex = run.currentEncounterIndex + 1
        run.currentEncounterIndex = nextIndex
        run.encounters[nextIndex].status = 'available'

        run.accumulatedRisk = Math.min(100, run.accumulatedRisk + (currentEncounter.riskDelta ?? 0))
        nextActiveGate = { ...activeGate, runState: run }

        gateRewards.push({ type: 'xp', amount: partialXP })
        gateRewards.push({ type: 'gold', amount: partialGold })

        const jackpotTag = hasJackpot ? '★대박 잭팟!★ ' : ''
        const newMessages = [
          {
            id: uid(),
            kind: 'quest' as const,
            title: `${jackpotTag}인카운터 클리어 (${run.currentEncounterIndex}/${run.encounters.length})`,
            lines: [
              `[${currentEncounter.title}] 정복 완료.`,
              `부분 보상 누적: XP +${partialXP}${rolledXP.isJackpot ? ' (잭팟!)' : ''}, 골드 +${partialGold}${rolledGold.isJackpot ? ' (잭팟!)' : ''}, 그림자 정수 +${partialEssence}${rolledEssence.isJackpot ? ' (잭팟!)' : ''}`,
            ],
            createdAt: todayISO(),
          }
        ]

        const finalLog: CombatLog = {
          ...combatLog,
          rewards: gateRewards,
          source: combatLog.source || 'gate',
        }

        return {
          finalLog,
          shouldCheckUnlocks,
          state: applySecretProgressEvent(s, { context: 'gate', outcome: 'victory' }, {
            hunter: nextHunter,
            gold: s.gold,
            items: nextItems,
            ownedShadows: nextOwnedShadows,
            equippedShadowIds: nextEquippedShadowIds,
            activeGate: nextActiveGate,
            combatLogs: [finalLog, ...s.combatLogs].slice(0, 20),
            messages: [...s.messages, ...newMessages],
            manualBattleSession: undefined,
          }),
        }
      } else {
        run.completed = true
        if (run.redGateState && run.redGateState.status === 'opened') {
          run.redGateState.status = 'cleared'
        }
        nextActiveGate = { ...activeGate, status: 'cleared', runState: run }

        nextGateStatus = {
          ...gateStatus,
          stamina: Math.max(0, gateStatus.stamina - GATE_ENTRY_COST),
        }

        const finalXP = run.accumulatedRewards.xp
        const finalGold = run.accumulatedRewards.gold
        const finalEssence = run.accumulatedRewards.essence

        const xpResult = applyXp(s.hunter, finalXP, 'challenge')
        nextHunter = xpResult.hunter
        shouldCheckUnlocks = Boolean(xpResult.outcome?.leveledUp || xpResult.outcome?.rankChanged)

        nextGold += finalGold
        const nextEssenceVal = (s.shadowEssence ?? 0) + finalEssence

        gateRewards.push({ type: 'xp', amount: finalXP })
        gateRewards.push({ type: 'gold', amount: finalGold })
        for (const itemRew of run.accumulatedRewards.items) {
          gateRewards.push(itemRew)
        }

        const summonBonus = rollSmallSummonReward('gate')
        nextShadowSummonTickets = [...nextShadowSummonTickets, ...(summonBonus.shadowSummonTickets ?? [])]
        nextShadowSummonShards = addShadowSummonShards(nextShadowSummonShards, summonBonus.shadowSummonShards)

        if (run.modifierIds.includes('mod_shadow_congestion')) {
          run.extractionBonusPercent = (run.extractionBonusPercent ?? 0) + 8
        }

        let addedNormalMat = 0
        let addedAdvancedMat = 0
        let addedSupremeMat = 0

        const gr = gate.rank ?? 'E'
        const rand = Math.random()
        if (gr === 'S' || gate.rewardTableId?.includes('boss')) {
          if (rand < 0.03) addedSupremeMat = 1
          else if (rand < 0.13) addedAdvancedMat = 1
          else if (rand < 0.43) addedNormalMat = 1
        } else if (gr === 'A' || gr === 'B') {
          if (rand < 0.01) addedSupremeMat = 1
          else if (rand < 0.08) addedAdvancedMat = 1
          else if (rand < 0.33) addedNormalMat = 1
        } else if (gr === 'C' || gr === 'D') {
          if (rand < 0.04) addedAdvancedMat = 1
          else if (rand < 0.19) addedNormalMat = 1
        } else {
          if (rand < 0.08) addedNormalMat = 1
        }

        const clearTickets = getGateClearExpeditionTickets(gate.rank)
        
        // ── Rune Drop ──
        let rolledRune: RuneItem | undefined = undefined
        const runeDropChance = gate.rank === 'S' ? 0.40 : gate.rank === 'A' ? 0.25 : gate.rank === 'B' ? 0.15 : 0.05
        if (Math.random() < runeDropChance) {
          let boxGrade: 'normal' | 'advanced' | 'supreme' = 'normal'
          if (gate.rank === 'S') {
            boxGrade = Math.random() < 0.20 ? 'supreme' : 'advanced'
          } else if (gate.rank === 'A' || gate.rank === 'B') {
            boxGrade = Math.random() < 0.10 ? 'advanced' : 'normal'
          }
          rolledRune = generateRandomRune(boxGrade)
        }

        let rolledStone: ShadowRarity | undefined = undefined
        const isHighQuality = gate.rank === 'S' || gate.rewardTableId?.includes('boss')
        const stoneDropChance = isHighQuality ? 0.30 : 0.15
        if (Math.random() < stoneDropChance) {
          rolledStone = rollGateEnhancementStone(gate.rank ?? 'E', isHighQuality)
        }

        const lines = [
          `게이트 던전 런 [${gate.name}] 완벽 공략 성공!`,
          `총 획득 XP: +${finalXP}`,
          `총 획득 골드: +${finalGold}`,
          `총 획득 그림자 정수: +${finalEssence}`,
          ...(clearTickets > 0 ? [`원정 티켓 +${clearTickets}장`] : []),
          ...(rolledRune ? [`전리품: 룬 획득 [${rolledRune.icon} ${rolledRune.name}]`] : []),
          ...(rolledStone ? [`전리품: [${SHADOW_RARITY_LABEL[rolledStone]}] 그림자 강화석 +1개`] : []),
          ...run.accumulatedRewards.items.map(r => `전리품: [${r.itemName}]`),
        ]

        if (rolledRune) {
          gateRewards.push({ type: 'item' as any, itemId: rolledRune.id, itemName: rolledRune.name, rarity: rolledRune.grade })
        }

        if (rolledStone) {
          gateRewards.push({ type: 'item' as any, itemId: `shadow_stone_${rolledStone}`, itemName: `[${SHADOW_RARITY_LABEL[rolledStone]}] 그림자 강화석`, rarity: rolledStone })
        }

        if (addedNormalMat > 0) {
          gateRewards.push({ type: 'item' as any, itemId: 'mutation_material_normal', itemName: '일반 변이 재료', rarity: 'common' })
          lines.push(`전리품: 일반 변이 재료 +${addedNormalMat}개`)
        }
        if (addedAdvancedMat > 0) {
          gateRewards.push({ type: 'item' as any, itemId: 'mutation_material_advanced', itemName: '고급 변이 재료', rarity: 'rare' })
          lines.push(`전리품: 고급 변이 재료 +${addedAdvancedMat}개`)
        }
        if (addedSupremeMat > 0) {
          gateRewards.push({ type: 'item' as any, itemId: 'mutation_material_supreme', itemName: '최고급 변이 재료', rarity: 'epic' })
          lines.push(`전리품: 최고급 변이 재료 +${addedSupremeMat}개`)
        }

        const newMessages = [
          {
            id: uid(),
            kind: 'quest' as const,
            title: '던전 런 클리어 완료',
            lines,
            createdAt: todayISO(),
          }
        ]

        if (xpResult.outcome?.leveledUp) {
          newMessages.push({
            id: uid(),
            kind: 'quest' as any,
            title: 'LEVEL UP',
            lines: [
              `Lv.${s.hunter.level} → Lv.${xpResult.outcome.newLevel}`,
              `자동 분배 — ${formatStatGains(xpResult.outcome.autoStatGains)}`,
              `자유 배분권 +${xpResult.outcome.freeStatPointsGained}`,
            ],
            createdAt: todayISO(),
          })
        }

        const finalLog: CombatLog = {
          ...combatLog,
          rewards: gateRewards,
          source: combatLog.source || 'gate',
        }

        const baseState: Partial<GameState> = {
          hunter: nextHunter,
          gold: nextGold,
          shadowEssence: nextEssenceVal,
          mutationMaterialNormal: (s.mutationMaterialNormal ?? 0) + addedNormalMat,
          mutationMaterialAdvanced: (s.mutationMaterialAdvanced ?? 0) + addedAdvancedMat,
          mutationMaterialSupreme: (s.mutationMaterialSupreme ?? 0) + addedSupremeMat,
          items: nextItems,
          runes: [...(s.runes ?? []), ...(rolledRune ? [rolledRune] : [])],
          shadowEnhanceStones: (() => {
            const nextStones = { ...(s.shadowEnhanceStones ?? { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 }) }
            if (rolledStone) {
              nextStones[rolledStone] = (nextStones[rolledStone] ?? 0) + 1
            }
            return nextStones
          })(),
          shadowSummonTickets: nextShadowSummonTickets,
          expeditionTickets: (s.expeditionTickets ?? 0) + clearTickets,
          shadowSummonShards: nextShadowSummonShards,
          ownedShadows: nextOwnedShadows,
          equippedShadowIds: nextEquippedShadowIds,
          gateStatus: nextGateStatus,
          activeGate: nextActiveGate,
          activeConsumableEffects: nextConsumables,
          combatLogs: [finalLog, ...s.combatLogs].slice(0, 20),
          messages: [...s.messages, ...newMessages],
          manualBattleSession: undefined,
          skillStates: s.skillStates,
        }

        return {
          finalLog,
          shouldCheckUnlocks,
          state: applySecretProgressEvent(s, { context: 'gate', outcome: 'victory' }, baseState),
        }
      }
    } else {
      run.failed = true
      let redGateShardBonus = false
      if (run.redGateState && run.redGateState.status === 'opened') {
        run.redGateState.status = 'failed'
        nextShadowSummonShards = addShadowSummonShards(nextShadowSummonShards, { named: 1 })
        redGateShardBonus = true
      }
      nextActiveGate = { ...activeGate, status: 'failed', runState: run }

      const earnedGold = run.accumulatedRewards.gold
      const earnedEssence = run.accumulatedRewards.essence
      nextGold += earnedGold
      const nextEssenceVal = (s.shadowEssence ?? 0) + earnedEssence

      const isExam = run.isPromotionExam
      const examTarget = run.targetGrade

      let finalStaminaCost = 0
      let injuryHours = 0
      let injuredUntil: string | undefined = undefined

      if (isExam) {
        // No stamina cost or injury for exams!
        nextGateStatus = {
          ...gateStatus,
        }
      } else {
        const basePenalty = penalty ?? {
          id: 'penalty-gate-basic',
          name: '기본 게이트 패널티',
          staminaCost: 50,
          injuryHours: 6,
        }
        const penaltyReduction = getActiveGatePenaltyReduction(s.activeConsumableEffects)
        finalStaminaCost = Math.round(basePenalty.staminaCost * (1 - penaltyReduction))
        injuryHours = basePenalty.injuryHours ?? 6
        injuredUntil = new Date(Date.now() + injuryHours * 3_600_000).toISOString()

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
      }

      const lines = isExam 
        ? [
            `[${gate.name}] 승급 심사 게이트 공략 도중 실패했습니다.`,
            `협회 안전 지원 대책에 의해 부상과 스태미나 손실이 면제되었습니다.`,
            `헌터님의 등급은 유지되며, 재도전 준비가 완료되면 언제든지 다시 응시할 수 있습니다.`
          ]
        : [
            `[${gate.name}] 던전 런 중 [${currentEncounter.title}]에서 패배했습니다.`,
            `누적 획득 골드: +${earnedGold}, 그림자 정수: +${earnedEssence}`,
            redGateShardBonus ? '레드 게이트 잔향 조각(네임드 조각) 획득: +1' : '',
            `스태미나 -${finalStaminaCost}`,
            `부상을 입었습니다. 6시간 경과 또는 퀘스트 3개 완료 시 회복됩니다.`,
          ].filter(Boolean)

      const newMessages = [
        {
          id: uid(),
          kind: 'info' as const,
          title: isExam ? '승급 심사 실패 (재도전 가능)' : '던전 런 실패',
          lines,
          createdAt: todayISO(),
        }
      ]

      const finalLog: CombatLog = {
        ...combatLog,
        rewards: [],
        penaltyApplied,
        source: combatLog.source || 'gate',
      }

      const nextHunterGrade = (isExam && examTarget && s.hunterGrade?.pendingExam) 
        ? {
            ...s.hunterGrade,
            pendingExam: {
              ...s.hunterGrade.pendingExam,
              status: 'available' as const,
            }
          }
        : s.hunterGrade

      return {
        finalLog,
        shouldCheckUnlocks: false,
        state: applySecretProgressEvent(s, { context: 'gate', outcome: 'defeat' }, {
          hunter: nextHunter,
          gold: nextGold,
          shadowEssence: nextEssenceVal,
          items: nextItems,
          ownedShadows: nextOwnedShadows,
          equippedShadowIds: nextEquippedShadowIds,
          gateStatus: nextGateStatus,
          activeGate: nextActiveGate,
          activeConsumableEffects: nextConsumables,
          combatLogs: [finalLog, ...s.combatLogs].slice(0, 20),
          messages: [...s.messages, ...newMessages],
          manualBattleSession: undefined,
          hunterGrade: nextHunterGrade,
        }),
      }
    }
  }

  // ── [B] 기존 단판 흐름 (runState가 없을 때의 레거시 fallback) ──
  if (combatLog.result === 'victory') {
    nextGateStatus = {
      ...gateStatus,
      stamina: Math.max(0, gateStatus.stamina - GATE_ENTRY_COST),
    }
    nextActiveGate = { ...activeGate, status: 'cleared' }

    let leveledUpOutcome: ReturnType<typeof applyXp>['outcome'] | undefined

    if (rewardTable) {
      const shadowXpBonus = getEquippedShadowCategoryXpBonus(equippedShadows, 'challenge')
      const rawXp = Math.round(rewardTable.xp * getTitleXpMultiplier(s.hunter, 'challenge') * (1 + shadowXpBonus))
      const rawGold = getGateGoldReward(gate.rank)

      rolledXP = rollValueReward(rawXp)
      rolledGold = rollValueReward(rawGold)

      const xpReward = rolledXP.amount
      const goldReward = rolledGold.amount

      const xpResult = applyXp(s.hunter, xpReward, 'challenge')
      nextHunter = xpResult.hunter
      leveledUpOutcome = xpResult.outcome
      gateRewards.push({ type: 'xp', amount: xpReward })
      nextGold += goldReward
      gateRewards.push({ type: 'gold', amount: goldReward })

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

  const isVictory = combatLog.result === 'victory'
  const isBoss = gate.monsterIds.some(mId => {
    const m = getMockDirectBattleMonster(mId)
    return m?.unitType === 'boss'
  })

  let rolledStone: ShadowRarity | undefined = undefined
  if (isVictory) {
    const isHighQuality = gate.rank === 'S' || isBoss
    const stoneDropChance = isHighQuality ? 0.30 : 0.15
    if (Math.random() < stoneDropChance) {
      rolledStone = rollGateEnhancementStone(gate.rank ?? 'E', isHighQuality)
    }
  }

  if (rolledStone) {
    gateRewards.push({ type: 'item' as any, itemId: `shadow_stone_${rolledStone}`, itemName: `[${SHADOW_RARITY_LABEL[rolledStone]}] 그림자 강화석`, rarity: rolledStone })
  }

  const finalLog: CombatLog = {
    ...combatLog,
    rewards: gateRewards,
    penaltyApplied,
    source: combatLog.source || 'gate',
  }

  const nextSkillStates = finalLog.battleId.startsWith('direct-gate-')
    ? applyDirectBattleSkillRuntimeUses(s.skillStates, finalLog.turns, isVictory, isBoss,
        s.dailyProgression?.dateKey === getActivePlanDateKey(s.quests) ? (s.dailyProgression?.skillXpBonus ?? 0) : 0)
    : s.skillStates

  const clearTickets = isVictory ? getGateClearExpeditionTickets(gate.rank) : 0
  let finalMessages = shadowLevelUps.length > 0
    ? [...s.messages, {
        id: uid(),
        kind: 'shadow' as const,
        title: '그림자 성장',
        lines: [`출전 그림자들이 ${xpAmount} XP를 획득했습니다.`, ...shadowLevelUps],
        createdAt: todayISO(),
      }]
    : s.messages

  if (clearTickets > 0) {
    finalMessages = [...finalMessages, {
      id: uid(),
      kind: 'shadow' as const,
      title: '게이트 정화 보상',
      lines: [`게이트 공략 완료 보상으로 원정 티켓 +${clearTickets}장을 획득했습니다.`],
      createdAt: todayISO(),
    }]
  }

  if (rolledStone) {
    finalMessages = [...finalMessages, {
      id: uid(),
      kind: 'shadow' as const,
      title: '그림자 강화석 획득',
      lines: [`게이트 던전 정화 완료 보상으로 [${SHADOW_RARITY_LABEL[rolledStone]}] 그림자 강화석을 획득했습니다!`],
      createdAt: todayISO(),
    }]
  }

  const hasJackpot = rolledXP.isJackpot || rolledGold.isJackpot
  if (isVictory && hasJackpot) {
    finalMessages = [...finalMessages, {
      id: uid(),
      kind: 'quest' as const,
      title: '★대박 잭팟 보너스!★',
      lines: [
        `축하합니다! 게이트 정화 완료 보상 잭팟이 터졌습니다! (1.5 ~ 2.0배 폭증)`,
        `획득 골드: +${rolledGold.amount}${rolledGold.isJackpot ? ' (★잭팟 대박 보너스!★)' : ''}`,
        `획득 경험치: +${rolledXP.amount}${rolledXP.isJackpot ? ' (★잭팟 대박 보너스!★)' : ''}`
      ],
      createdAt: todayISO(),
    }]
  }

  const baseState: Partial<GameState> = {
    hunter: nextHunter,
    gold: nextGold,
    items: nextItems,
    shadowSummonTickets: nextShadowSummonTickets,
    expeditionTickets: (s.expeditionTickets ?? 0) + clearTickets,
    shadowSummonShards: nextShadowSummonShards,
    ownedShadows: nextOwnedShadows,
    equippedShadowIds: nextEquippedShadowIds,
    shadowEnhanceStones: (() => {
      const nextStones = { ...(s.shadowEnhanceStones ?? { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 }) }
      if (rolledStone) {
        nextStones[rolledStone] = (nextStones[rolledStone] ?? 0) + 1
      }
      return nextStones
    })(),
    gateStatus: nextGateStatus,
    activeGate: nextActiveGate,
    activeConsumableEffects: nextConsumables,
    combatLogs: [finalLog, ...s.combatLogs].slice(0, 20),
    messages: finalMessages,
    manualBattleSession: undefined,
    skillStates: nextSkillStates,
  }

  return {
    finalLog,
    shouldCheckUnlocks,
    state: applySecretProgressEvent(s, { context: 'gate', outcome: combatLog.result }, baseState),
  }
}
const syncTodayShadowExpeditionState = (s: GameState): Pick<GameState, 'shadowExpeditions' | 'lastShadowExpeditionDate' | 'activeShadowExpeditionId'> => {
  const dateKey = todayKey()
  const now = new Date()
  
  let shadowExpeditions = [...(s.shadowExpeditions ?? [])]
  
  // AI 플랜 기반 완료 수 확인 (잠금 해제 조건)
  const planDailyCount = getPlanBasedCompletedCount(s.quests ?? [], s.achievementStats)
  const expeditionUnlocked = planDailyCount >= SHADOW_EXPEDITION_UNLOCK_DAILY_COUNT

  // 1. 일상 원정(daily) 생성 검사: 특별 원정이 아닌 일반 원정 중 활성/대기 상태인 게 없을 때만 일상 원정 생성
  const hasActiveOrAvailableDaily = shadowExpeditions.some(item => !item.isSpecial && (item.status === 'in_progress' || item.status === 'available'))

  if (!hasActiveOrAvailableDaily) {
    const hasLockedDaily = shadowExpeditions.some(item => !item.isSpecial && item.status === 'locked')
    if (!hasLockedDaily) {
      // 새 원정 생성 (locked 상태로 시작)
      const uniqueSeed = `${dateKey}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const newExpedition = createShadowExpeditionForDate(uniqueSeed)
      if (expeditionUnlocked) {
        // 플랜 완료 조건 충족 시 바로 available로 전환
        newExpedition.status = 'available'
        newExpedition.logs = [{
          id: `log-${newExpedition.id}-created`,
          turn: 0,
          type: 'system',
          message: '새로운 그림자 원정이 준비되었다. 원정 시작을 위해 티켓 1장을 소모한다.',
        }]
      }
      // else: locked 상태 유지 (createShadowExpeditionForDate의 기본 로그 메시지 사용)
      shadowExpeditions.unshift(newExpedition)
    } else if (expeditionUnlocked) {
      // 기존 locked 원정을 available로 업그레이드
      shadowExpeditions = shadowExpeditions.map(expedition => {
        if (!expedition.isSpecial && expedition.status === 'locked') {
          return { ...expedition, status: 'available' }
        }
        if (!expedition.isSpecial && new Date(expedition.expiresAt).getTime() < now.getTime() && expedition.status !== 'completed' && expedition.status !== 'in_progress') {
          return { ...expedition, status: 'expired' }
        }
        return expedition
      })
    }
  } else {
    shadowExpeditions = shadowExpeditions.map(expedition => {
      if (!expedition.isSpecial && expedition.status === 'locked' && expeditionUnlocked) {
        return { ...expedition, status: 'available' }
      }
      if (!expedition.isSpecial && new Date(expedition.expiresAt).getTime() < now.getTime() && expedition.status !== 'completed' && expedition.status !== 'in_progress') {
        return { ...expedition, status: 'expired' }
      }
      return expedition
    })
  }

  // 2. 특별 원정(special) 발동 조건 검사
  const echoAffinity = s.secretProgress?.hiddenAffinity?.echo ?? 0
  const worldDay = s.livingWorld?.day ?? 0
  const hasAGradeShadow = s.ownedShadows?.some(sh => (sh.innateGrade === 'A' || sh.innateGrade === 'S') && !sh.collapsed)
  const hasSGradeShadow = s.ownedShadows?.some(sh => sh.innateGrade === 'S' && !sh.collapsed)
  const completedIds = s.completedSpecialExpeditionIds ?? []

  // 그림자 전당의 균열
  const sanctuaryUnlocked = echoAffinity >= 5 && hasAGradeShadow && worldDay >= 5
  const sanctuaryAlreadyActiveOrCompleted = shadowExpeditions.some(e => e.specialId === 'special_rift_sanctuary') || completedIds.includes('special_rift_sanctuary')

  if (sanctuaryUnlocked && !sanctuaryAlreadyActiveOrCompleted) {
    const specExp: ShadowExpedition = {
      id: `special-expedition-rift-${Date.now()}`,
      date: 'special',
      type: 'scout',
      title: '특별 원정: 그림자 전당의 균열',
      description: '그림자 군단이 머무는 깊은 심도에서 이질적인 균열이 관측되었습니다. 오직 그림자들의 힘으로만 진입할 수 있습니다.',
      requiredPower: 140,
      recommendedRoles: ['assault', 'guard', 'analyst'],
      selectedShadowIds: [],
      status: 'available',
      progress: 0,
      risk: 15,
      turn: 0,
      maxTurns: 4,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      logs: [{
        id: `log-special-rift-created`,
        turn: 0,
        type: 'system',
        message: '심연의 균열 신호가 감지되었습니다. 헌터는 참전하지 않고 후방에서 지휘합니다. (티켓 소모 없음)',
      }],
      isSpecial: true,
      specialId: 'special_rift_sanctuary',
      enemyEncounterKey: 'mid_trio',
      enemyBaseLevel: 12,
    }
    shadowExpeditions.unshift(specExp)
  }

  // 심연의 공명 신호
  const abyssUnlocked = echoAffinity >= 20 && hasSGradeShadow && worldDay >= 15
  const abyssAlreadyActiveOrCompleted = shadowExpeditions.some(e => e.specialId === 'special_abyss_resonance') || completedIds.includes('special_abyss_resonance')

  if (abyssUnlocked && !abyssAlreadyActiveOrCompleted) {
    const specExp: ShadowExpedition = {
      id: `special-expedition-abyss-${Date.now()}`,
      date: 'special',
      type: 'hunt',
      title: '특별 원정: 심연의 공명 신호',
      description: '과거 헌터가 남긴 듯한 반향이 심연 깊은 곳에서 울려 퍼집니다. 거대 몬스터와 직면하여 진실의 조각을 회수해야 합니다.',
      requiredPower: 220,
      recommendedRoles: ['hunter', 'scout', 'support'],
      selectedShadowIds: [],
      status: 'available',
      progress: 0,
      risk: 20,
      turn: 0,
      maxTurns: 4,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      logs: [{
        id: `log-special-abyss-created`,
        turn: 0,
        type: 'system',
        message: '심연의 폭군 주파수가 공명합니다. 그림자 군단의 결전이 필요합니다. (티켓 소모 없음)',
      }],
      isSpecial: true,
      specialId: 'special_abyss_resonance',
      enemyEncounterKey: 'boss_minions',
      enemyBaseLevel: 25,
    }
    shadowExpeditions.unshift(specExp)
  }

  // 백화의 제단 수색
  const whiteflameUnlocked = echoAffinity >= 8 && hasAGradeShadow && worldDay >= 8
  const whiteflameAlreadyActiveOrCompleted = shadowExpeditions.some(e => e.specialId === 'special_whiteflame') || completedIds.includes('special_whiteflame')

  if (whiteflameUnlocked && !whiteflameAlreadyActiveOrCompleted) {
    const specExp: ShadowExpedition = {
      id: `special-expedition-whiteflame-${Date.now()}`,
      date: 'special',
      type: 'scout',
      title: '특별 원정: 백화의 제단 수색',
      description: '그림자 군단의 마력이 백색의 불꽃을 피워내는 고대 제단과 공명하기 시작했습니다. 제단 깊은 곳의 수호병들을 정찰하고 처단하십시오.',
      requiredPower: 160,
      recommendedRoles: ['scout', 'support', 'hunter'],
      selectedShadowIds: [],
      status: 'available',
      progress: 0,
      risk: 15,
      turn: 0,
      maxTurns: 4,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      logs: [{
        id: `log-special-whiteflame-created`,
        turn: 0,
        type: 'system',
        message: '백화의 제단 신호가 감지되었습니다. 고대 제단의 위협을 제거해야 합니다. (티켓 소모 없음)',
      }],
      isSpecial: true,
      specialId: 'special_whiteflame',
      enemyEncounterKey: 'controller_bruiser',
      enemyBaseLevel: 16,
    }
    shadowExpeditions.unshift(specExp)
  }

  // 심연의 묘지기 각성
  const graveGuardUnlocked = (s.ownedShadows?.filter(sh => !sh.collapsed).length ?? 0) >= 6 && worldDay >= 12 && echoAffinity >= 12
  const graveGuardAlreadyActiveOrCompleted = shadowExpeditions.some(e => e.specialId === 'special_grave_guard') || completedIds.includes('special_grave_guard')

  if (graveGuardUnlocked && !graveGuardAlreadyActiveOrCompleted) {
    const specExp: ShadowExpedition = {
      id: `special-expedition-grave-${Date.now()}`,
      date: 'special',
      type: 'hunt',
      title: '특별 원정: 심연의 묘지기 각성',
      description: '그림자 군단 규모가 팽창하자 심연 하부의 고대 묘지기가 위협을 느끼고 깨어났습니다. 군단의 수호 능력을 증명해야 합니다.',
      requiredPower: 200,
      recommendedRoles: ['guard', 'assault', 'analyst'],
      selectedShadowIds: [],
      status: 'available',
      progress: 0,
      risk: 20,
      turn: 0,
      maxTurns: 4,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      logs: [{
        id: `log-special-grave-created`,
        turn: 0,
        type: 'system',
        message: '심연 묘지기의 공명이 강해집니다. 군단의 전면 돌파가 필요합니다. (티켓 소모 없음)',
      }],
      isSpecial: true,
      specialId: 'special_grave_guard',
      enemyEncounterKey: 'iron_wall_court',
      enemyBaseLevel: 20,
    }
    shadowExpeditions.unshift(specExp)
  }

  // 위상 붕괴 좌표 정찰
  const coordinateCollapseUnlocked = (s.ownedShadows?.filter(sh => (sh.rarity === 'rare' || sh.rarity === 'epic' || sh.rarity === 'legendary') && !sh.collapsed).length ?? 0) >= 3 && worldDay >= 10 && echoAffinity >= 10
  const coordinateCollapseAlreadyActiveOrCompleted = shadowExpeditions.some(e => e.specialId === 'special_coordinate_collapse') || completedIds.includes('special_coordinate_collapse')

  if (coordinateCollapseUnlocked && !coordinateCollapseAlreadyActiveOrCompleted) {
    const specExp: ShadowExpedition = {
      id: `special-expedition-coordinate-${Date.now()}`,
      date: 'special',
      type: 'scout',
      title: '특별 원정: 위상 붕괴 좌표 정찰',
      description: '기존 지도에 기록되지 않은 왜곡 좌표가 발견되었습니다. 정찰조를 진입시켜 붕괴하는 균열의 핵을 격파해야 합니다.',
      requiredPower: 180,
      recommendedRoles: ['scout', 'analyst', 'support'],
      selectedShadowIds: [],
      status: 'available',
      progress: 0,
      risk: 18,
      turn: 0,
      maxTurns: 4,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      logs: [{
        id: `log-special-coordinate-created`,
        turn: 0,
        type: 'system',
        message: '위상 왜곡 신호가 정찰 조각으로 반향됩니다. 균열 중심부를 격퇴하십시오. (티켓 소모 없음)',
      }],
      isSpecial: true,
      specialId: 'special_coordinate_collapse',
      enemyEncounterKey: 'oblivion_watch',
      enemyBaseLevel: 18,
    }
    shadowExpeditions.unshift(specExp)
  }

  // 군주의 깊은 잔영
  const monarchGazeUnlocked = (s.ownedShadows?.filter(sh => !sh.collapsed).length ?? 0) >= 8 && worldDay >= 20 && echoAffinity >= 25
  const monarchGazeAlreadyActiveOrCompleted = shadowExpeditions.some(e => e.specialId === 'special_monarch_gaze') || completedIds.includes('special_monarch_gaze')

  if (monarchGazeUnlocked && !monarchGazeAlreadyActiveOrCompleted) {
    const specExp: ShadowExpedition = {
      id: `special-expedition-monarch-${Date.now()}`,
      date: 'special',
      type: 'hunt',
      title: '특별 원정: 군주의 깊은 잔영',
      description: '그림자 세계의 극심도에서 찬란하고 어두운 그림자 군주의 반향이 감지되었습니다. 군단의 정점에 도전하여 군주의 잔영을 격파하십시오.',
      requiredPower: 260,
      recommendedRoles: ['hunter', 'assault', 'guard'],
      selectedShadowIds: [],
      status: 'available',
      progress: 0,
      risk: 25,
      turn: 0,
      maxTurns: 4,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      logs: [{
        id: `log-special-monarch-created`,
        turn: 0,
        type: 'system',
        message: '군주의 그림자가 심도를 뒤덮습니다. 군단 최강자들을 선별하여 도전하십시오. (티켓 소모 없음)',
      }],
      isSpecial: true,
      specialId: 'special_monarch_gaze',
      enemyEncounterKey: 'boss_double_minion',
      enemyBaseLevel: 28,
    }
    shadowExpeditions.unshift(specExp)
  }

  const activeShadowExpeditionId = shadowExpeditions.some(
    expedition => expedition.id === s.activeShadowExpeditionId && expedition.status === 'in_progress'
  )
    ? s.activeShadowExpeditionId
    : undefined

  return {
    shadowExpeditions: shadowExpeditions.slice(0, 24),
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
  focusCompleted?: boolean
}

type GateRunTargetKey = 'activeGate' | 'activeWorldGate'

const copyGateRunState = (runState: GateRunState): GateRunState => ({
  ...runState,
  encounters: runState.encounters.map(enc => ({
    ...enc,
    eventChoices: enc.eventChoices ? enc.eventChoices.map(choice => ({ ...choice })) : enc.eventChoices,
    treasureReward: enc.treasureReward ? { ...enc.treasureReward } : enc.treasureReward,
  })),
  accumulatedRewards: {
    ...runState.accumulatedRewards,
    items: [...runState.accumulatedRewards.items],
  },
  clearedEncounterIds: [...runState.clearedEncounterIds],
  modifierIds: [...runState.modifierIds],
  riskTags: runState.riskTags ? [...runState.riskTags] : runState.riskTags,
  redGateState: runState.redGateState ? { ...runState.redGateState } : runState.redGateState,
  pressureSnapshot: runState.pressureSnapshot
    ? { ...runState.pressureSnapshot, reasonLabels: [...runState.pressureSnapshot.reasonLabels] }
    : runState.pressureSnapshot,
})

const getGateRunActionTarget = (
  s: GameState,
  gateInstanceId?: string,
  encounterId?: string,
): { key: GateRunTargetKey; activeGate: ActiveGate } | undefined => {
  const candidates: Array<{ key: GateRunTargetKey; activeGate?: ActiveGate }> = [
    { key: 'activeWorldGate', activeGate: s.activeWorldGate },
    { key: 'activeGate', activeGate: s.activeGate },
  ]

  return candidates.find(({ activeGate }) => {
    if (!activeGate || activeGate.status !== 'active' || !activeGate.runState) return false
    if (gateInstanceId && activeGate.instanceId !== gateInstanceId) return false
    if (encounterId) {
      const currentEncounter = activeGate.runState.encounters[activeGate.runState.currentEncounterIndex]
      if (currentEncounter?.id !== encounterId) return false
    }
    return true
  }) as { key: GateRunTargetKey; activeGate: ActiveGate } | undefined
}

const gateRunTargetUpdate = (
  key: GateRunTargetKey,
  activeGate: ActiveGate,
): Partial<Pick<GameState, GateRunTargetKey>> =>
  key === 'activeWorldGate'
    ? { activeWorldGate: activeGate }
    : { activeGate }

const isRetiredTowerChallengeCard = (card: ChallengeCard): boolean =>
  card.category === 'tower' ||
  card.condition.type === 'completeTowerAttempt' ||
  card.condition.type === 'completeTowerClear'

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

const countDailyCompletionsForDate = (s: GameState, date = todayKey()): number =>
  s.achievementStats.dailyHistory[date]?.completedDailyCount ?? 0

const countDailyCategoryCompletionsForDate = (s: GameState, categories: Category[], date = todayKey()): number => {
  const ids = s.achievementStats.dailyHistory[date]?.completedDailyQuestIds ?? []
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
    easy: { hunterXp: 15, gold: 22, shadowEssence: 5, boxUpgradePoints: 1 },
    normal: { hunterXp: 35, gold: 36, shadowEssence: 10, boxUpgradePoints: 2 },
    hard: { hunterXp: 80, gold: 60, shadowEssence: 20, boxUpgradePoints: 3 },
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
    createChallengeCard(date, 'study-2', 'normal', 'finance', '두뇌 예열', '학습, 커리어, 금융 Daily 퀘스트를 합산 2개 완료합니다.', { type: 'completeQuestCategory', category: 'study', target: 2 }),
    createChallengeCard(date, 'workout-2', 'normal', 'workout', '훈련 루틴', '운동 또는 건강 Daily 퀘스트를 합산 2개 완료합니다.', { type: 'completeQuestCategory', category: 'workout', target: 2 }),
  ]
  const hardPool = [
    createChallengeCard(date, 'daily-5', 'hard', 'habit', 'Daily 5개 완료', '오늘 가능한 Daily 퀘스트 5개를 완료합니다.', { type: 'completeDailyCount', target: 5 }),
    createChallengeCard(date, 'gate-win', 'hard', 'gate', '게이트 승리', '게이트 전투에서 승리합니다.', { type: 'completeGateVictory', target: 1 }),
    createChallengeCard(date, 'body-mind', 'hard', 'life', '몸과 머리 모두 사용', '운동/건강 1개와 학습/커리어/금융 1개를 각각 완료합니다.', { type: 'completeWorkoutAndStudy', target: 1 }),
  ]

  const cards = [
    ...pickChallengeCards(easyPool, 2),
    ...pickChallengeCards(normalPool, 2),
    ...pickChallengeCards(hardPool, 1),
  ]
  return cards.map(card => {
    if (card.id === `${date}-daily-3`) {
      return {
        ...card,
        title: 'Daily 4개 완료',
        description: '오늘 가능한 Daily 퀘스트 4개를 완료합니다.',
        condition: { ...card.condition, target: 4 },
      }
    }
    if (card.id === `${date}-daily-5`) {
      return {
        ...card,
        title: 'Daily 6개 완료',
        description: '오늘 가능한 Daily 퀘스트 6개를 완료합니다.',
        condition: { ...card.condition, target: 6 },
      }
    }
    return card
  })
}

const getCompletedSelectedChallengeCards = (s: GameState): ChallengeCard[] => {
  const selected = new Set(s.selectedChallengeCardIds ?? [])
  return (s.todayChallengeCards ?? []).filter(card =>
    !isRetiredTowerChallengeCard(card) &&
    selected.has(card.id) &&
    card.status === 'completed'
  )
}

const getDailyBoxTierForState = (s: GameState): BoxTier => {
  const upgradePoints = getCompletedSelectedChallengeCards(s)
    .reduce((sum, card) => sum + card.reward.boxUpgradePoints, 0)
  if (upgradePoints >= 6) return 'epic'
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

const isDailyRewardRouteBox = (box: RewardBox, routeDate: string): boolean =>
  box.type === 'daily' &&
  box.source === 'daily_login' &&
  box.label.startsWith(routeDate)

const createDailyRewardRouteState = (
  s: GameState,
  quests: Quest[],
  routeDate: string
): Pick<GameState, 'rewardBoxes' | 'lastDailyBoxDate' | 'todayChallengeCards' | 'selectedChallengeCardIds' | 'lastChallengeCardDate' | 'challengeCardHistory'> => {
  const nextRewardBoxes = [
    createRewardBox('daily', 'normal', 'daily_login', `${routeDate} 일일 박스`),
    ...(s.rewardBoxes ?? []).filter(box => !(box.status === 'available' && isDailyRewardRouteBox(box, routeDate))),
  ].slice(0, 30)
  const challengeCardHistory = { ...(s.challengeCardHistory ?? {}) }
  delete challengeCardHistory[routeDate]

  return {
    rewardBoxes: nextRewardBoxes,
    lastDailyBoxDate: routeDate,
    todayChallengeCards: generateChallengeCardsForToday(quests, routeDate),
    selectedChallengeCardIds: [],
    lastChallengeCardDate: routeDate,
    challengeCardHistory,
  }
}

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

const itemRarityOrder: Item['rarity'][] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const pickWeightedRarity = (weights: Partial<Record<Item['rarity'], number>>): Item['rarity'] => {
  const entries = Object.entries(weights) as Array<[Item['rarity'], number]>
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [rarity, weight] of entries) {
    roll -= weight
    if (roll <= 0) return rarity
  }
  return entries[entries.length - 1]?.[0] ?? 'common'
}

const drawShopEquipment = (
  slot: EquipmentSlot | 'random',
  drawTier: Extract<ShopReward, { kind: 'equipment_draw' }>['drawTier']
): Item | undefined => {
  const actualSlot: EquipmentSlot = slot === 'random'
    ? (['weapon', 'armor', 'accessory', 'artifact'] as EquipmentSlot[])[Math.floor(Math.random() * 4)]
    : slot
  const weights = getShopDrawWeights(drawTier)
  const wantedRarity = pickWeightedRarity(weights)
  const minIndex = drawTier === 'rare' ? itemRarityOrder.indexOf('rare') : 0
  const wantedIndex = itemRarityOrder.indexOf(wantedRarity)
  const pool = ITEM_POOL.filter(item =>
    item.equippable === true &&
    item.consumable !== true &&
    item.slot === actualSlot &&
    itemRarityOrder.indexOf(item.rarity) >= minIndex &&
    item.rarity === wantedRarity
  )
  const fallbackPool = ITEM_POOL.filter(item =>
    item.equippable === true &&
    item.consumable !== true &&
    item.slot === actualSlot &&
    itemRarityOrder.indexOf(item.rarity) >= minIndex &&
    itemRarityOrder.indexOf(item.rarity) <= Math.max(wantedIndex, minIndex)
  )
  const pickPool = pool.length > 0 ? pool : fallbackPool
  const pick = pickPool[Math.floor(Math.random() * pickPool.length)]
  return pick ? instantiateItem(pick, getShopDrawQualitySource(drawTier)) : undefined
}

const getQuestGoldReward = (quest: Quest): number => {
  if (quest.type === 'daily') {
    const byDifficulty: Record<Difficulty, number> = {
      easy: 18, normal: 24, hard: 34, elite: 46, apex: 60, boss: 75,
    }
    return byDifficulty[quest.difficulty] ?? 18
  }
  if (quest.type === 'main') {
    return 0 // 메인 퀘스트 최종 완료 시 대량의 골드(10,000G)를 받으므로 기본 골드는 제거
  }
  return 0
}

const getDungeonStepGoldReward = (quest: Quest): number => {
  const byDifficulty: Record<Difficulty, number> = {
    easy: 5, normal: 7, hard: 10, elite: 14, apex: 20, boss: 26,
  }
  return byDifficulty[quest.difficulty] ?? 7
}

const getDungeonClearGoldReward = (quest: Quest): number => {
  const byDifficulty: Record<Difficulty, number> = {
    easy: 60, normal: 80, hard: 115, elite: 165, apex: 240, boss: 320,
  }
  const base = byDifficulty[quest.difficulty] ?? 80
  return quest.resetCycle === 'monthly' ? Math.round(base * 1.25) : base
}

const getGateGoldReward = (rank: Rank): number => {
  const byRank: Partial<Record<Rank, number>> = {
    E: 25,
    D: 34,
    C: 46,
    B: 62,
    A: 82,
    S: 105,
    National: 140,
  }
  return byRank[rank] ?? 25
}

const getBoxGoldReward = (box: RewardBox, tierMultiplier: number): number => {
  if (box.type === 'daily') return Math.round((42 + Math.floor(Math.random() * 19)) * tierMultiplier)
  if (box.type === 'weekly') return Math.round((190 + Math.floor(Math.random() * 81)) * tierMultiplier)
  const floor = box.floor ?? 5
  return Math.round((120 + floor * 7 + Math.floor(Math.random() * 45)) * tierMultiplier)
}

const rollEnhancementStoneFromBox = (boxType: 'common' | 'advanced', rng: () => number = Math.random): ShadowRarity => {
  const weights: Record<ShadowRarity, number> = boxType === 'common'
    ? { common: 50, uncommon: 25, rare: 10, epic: 7.5, legendary: 7.5 }
    : { common: 20, uncommon: 20, rare: 20, epic: 20, legendary: 20 }
  
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
  let roll = rng() * total
  for (const [key, value] of Object.entries(weights) as Array<[ShadowRarity, number]>) {
    roll -= value
    if (roll <= 0) return key
  }
  return 'common'
}

const rollQuestEnhancementStone = (rng: () => number = Math.random): ShadowRarity => {
  const weights: Record<ShadowRarity, number> = {
    common: 50,
    uncommon: 30,
    rare: 15,
    epic: 4.5,
    legendary: 0.5
  }
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
  let roll = rng() * total
  for (const [key, value] of Object.entries(weights) as Array<[ShadowRarity, number]>) {
    roll -= value
    if (roll <= 0) return key
  }
  return 'common'
}

const rollGateEnhancementStone = (gateRank: string, isBossOrGreat: boolean, rng: () => number = Math.random): ShadowRarity => {
  const isHighQuality = gateRank === 'S' || isBossOrGreat
  const weights: Record<ShadowRarity, number> = isHighQuality
    ? { common: 20, uncommon: 30, rare: 30, epic: 16, legendary: 4 }
    : { common: 60, uncommon: 25, rare: 10, epic: 4.5, legendary: 0.5 }
  
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
  let roll = rng() * total
  for (const [key, value] of Object.entries(weights) as Array<[ShadowRarity, number]>) {
    roll -= value
    if (roll <= 0) return key
  }
  return 'common'
}

const applyShopReward = (
  reward: ShopReward,
  acc: {
    items: Item[]
    runes: RuneItem[]
    tickets: ShadowSummonTicket[]
    shards: Partial<Record<ShadowSummonShardType, number>>
    essence: number
    expeditionTickets: number
    mutationMaterialNormal: number
    mutationMaterialAdvanced: number
    mutationMaterialSupreme: number
    shadowEnhanceStones?: Record<ShadowRarity, number>
    lines: string[]
  }
) => {
  if (reward.kind === 'shadow_stone_box') {
    for (let i = 0; i < reward.quantity; i++) {
      const rolledRarity = rollEnhancementStoneFromBox(reward.boxType)
      if (acc.shadowEnhanceStones) {
        acc.shadowEnhanceStones[rolledRarity] = (acc.shadowEnhanceStones[rolledRarity] ?? 0) + 1
      }
      const boxName = reward.boxType === 'common' ? '일반 강화석 상자' : '고급 강화석 상자'
      acc.lines.push(`💎 [${SHADOW_RARITY_LABEL[rolledRarity]}] 그림자 강화석 획득 (${boxName})`)
    }
    return
  }
  if (reward.kind === 'rune_box_normal') {
    for (let i = 0; i < reward.quantity; i++) {
      const rune = generateRandomRune('normal')
      acc.runes.push(rune)
      acc.lines.push(`${rune.icon} ${rune.name} 획득 (일반 룬 상자)`)
    }
    return
  }
  if (reward.kind === 'rune_box_advanced') {
    for (let i = 0; i < reward.quantity; i++) {
      const rune = generateRandomRune('advanced')
      acc.runes.push(rune)
      acc.lines.push(`${rune.icon} ${rune.name} 획득 (고급 룬 상자)`)
    }
    return
  }
  if (reward.kind === 'rune_box_supreme') {
    for (let i = 0; i < reward.quantity; i++) {
      const rune = generateRandomRune('supreme')
      acc.runes.push(rune)
      acc.lines.push(`${rune.icon} ${rune.name} 획득 (최고급 룬 상자)`)
    }
    return
  }
  if (reward.kind === 'mutation_material_normal') {
    acc.mutationMaterialNormal += reward.quantity
    acc.lines.push(`일반 변이 재료 +${reward.quantity}개`)
    return
  }
  if (reward.kind === 'mutation_material_advanced') {
    acc.mutationMaterialAdvanced += reward.quantity
    acc.lines.push(`고급 변이 재료 +${reward.quantity}개`)
    return
  }
  if (reward.kind === 'mutation_material_supreme') {
    acc.mutationMaterialSupreme += reward.quantity
    acc.lines.push(`최고급 변이 재료 +${reward.quantity}개`)
    return
  }
  if (reward.kind === 'expedition_ticket') {
    acc.expeditionTickets += reward.quantity
    acc.lines.push(`원정 티켓 +${reward.quantity}장`)
    return
  }
  if (reward.kind === 'shadow_ticket') {
    for (let i = 0; i < reward.quantity; i++) {
      const ticket = createShadowSummonTicket({ ticketType: reward.ticketType, source: 'system' })
      acc.tickets.push(ticket)
      acc.lines.push(`${ticket.label} x1`)
    }
    return
  }
  if (reward.kind === 'shadow_shards') {
    acc.shards = addShadowSummonShards(acc.shards, reward.shards)
    for (const [type, amount] of Object.entries(reward.shards)) {
      acc.lines.push(`${type} 조각 +${amount}`)
    }
    return
  }
  if (reward.kind === 'shadow_essence') {
    acc.essence += reward.amount
    acc.lines.push(`그림자 정수 +${reward.amount}`)
    return
  }
  if (reward.kind === 'equipment_draw') {
    for (let i = 0; i < reward.quantity; i++) {
      const item = drawShopEquipment(reward.slot, reward.drawTier)
      if (!item) continue
      acc.items.push(item)
      acc.lines.push(`${item.icon} ${item.name} (${item.equipmentStars ?? 2}성)`)
    }
    return
  }
  for (const child of reward.rewards) {
    applyShopReward(child, acc)
  }
}

const shadowRarityOrder: Array<OwnedShadow['rarity']> = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const pickStandardShadowDefinition = (
  maxRarity: OwnedShadow['rarity'] = 'rare'
) => {
  const ticketType = shadowRarityOrder.indexOf(maxRarity) >= shadowRarityOrder.indexOf('epic')
    ? 'rare_shadow'
    : 'normal_shadow'
  return pickStandardShadowSummonDefinition(ticketType)
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
    if (roll(0.035 * mult)) addShard('normal', 1)
    if (roll(0.007 * mult)) addShard('rare', 1)
    if (roll(0.0025 * mult)) tickets.push(createShadowSummonTicket({ ticketType: 'normal_shadow', source: 'reward_box' }))
    if (roll(0.00035 * mult)) tickets.push(createShadowSummonTicket({ ticketType: 'rare_shadow', source: 'reward_box' }))
    if (roll(Math.min(0.00005, 0.00005 * mult))) addShard('achievement_named', 1)
  } else if (box.type === 'weekly') {
    if (roll(0.12 * mult)) addShard('normal', 2)
    if (roll(0.04 * mult)) addShard('rare', 1)
    if (roll(0.024 * mult)) tickets.push(createShadowSummonTicket({ ticketType: 'normal_shadow', source: 'reward_box' }))
    if (roll(0.006 * mult)) tickets.push(createShadowSummonTicket({ ticketType: 'rare_shadow', source: 'reward_box' }))
    if (roll(0.003 * mult)) tickets.push(createRoleTicket(['assault', 'guard', 'scout', 'analyst', 'support', 'hunter'][Math.floor(Math.random() * 6)] as OwnedShadow['role'], 'reward_box'))
    if (roll(0.001 * mult)) addShard('named', 1)
    if (roll(0.0002)) tickets.push(createShadowSummonTicket({ ticketType: 'gate_named_shadow', source: 'reward_box' }))
  } else {
    const bossMult = mult * highFloorMult
    if (roll(0.26 * bossMult)) addShard('normal', 2)
    if (roll(0.11 * bossMult)) addShard('rare', 1)
    if (roll(0.03 * bossMult)) addShard('named', 1)
    if (roll(0.065 * bossMult)) tickets.push(createShadowSummonTicket({ ticketType: 'normal_shadow', source: 'reward_box' }))
    if (roll(0.026 * bossMult)) tickets.push(createShadowSummonTicket({ ticketType: 'rare_shadow', source: 'reward_box' }))
    if (roll(0.013 * bossMult)) tickets.push(createRoleTicket(['assault', 'guard', 'scout', 'analyst', 'support', 'hunter'][Math.floor(Math.random() * 6)] as OwnedShadow['role'], 'reward_box'))
    if (roll(0.004 * bossMult)) tickets.push(createShadowSummonTicket({ ticketType: 'gate_named_shadow', source: 'reward_box' }))
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
  if (isStandardShadowSummonTicketType(ticket.ticketType)) {
    return getStandardShadowSummonPool()
  }
  return getStandardShadowSummonPool()
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

const rollChallengeFullCompletionBonus = (): Pick<BoxReward, 'hunterXp' | 'gold' | 'shadowEssence' | 'shadowSummonTickets' | 'shadowSummonShards'> => {
  const extra = rollSmallSummonReward('challenge_card')
  const shards = addShadowSummonShards({ normal: 1 }, extra.shadowSummonShards)
  if (Math.random() < 0.15) {
    shards.rare = (shards.rare ?? 0) + 1
  }
  return {
    hunterXp: 25,
    gold: 85,
    shadowEssence: 15,
    shadowSummonTickets: extra.shadowSummonTickets,
    shadowSummonShards: shards,
  }
}

const rollBoxReward = (s: GameState, box: RewardBox): BoxReward => {
  const tierMultiplier: Record<BoxTier, number> = {
    normal: 1,
    enhanced: 1.3,
    superior: 1.68,
    epic: 2.0,
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
    gold: getBoxGoldReward(box, mult),
    statRewards: { [stat]: roundStatValue((box.type === 'daily' ? 0.05 : 0.12) * mult) },
    items: [],
    consumables: [],
  }

  if (box.type === 'daily') {
    reward.hunterXp = Math.round(24 * mult)
    reward.shadowEssence = Math.max(5, Math.round((5 + Math.floor(Math.random() * 11)) * mult))
    if (Math.random() < 0.08 * mult) {
      const consumable = getItemFromPool(item => item.consumable === true, 'rare', qualitySource)
      if (consumable) reward.consumables?.push(consumable)
    }
    if (Math.random() < 0.058 * mult) {
      const dailyMaxRarity = box.tier === 'normal' ? 'uncommon' : 'rare'
      const equipment = getItemFromPool(item => item.equippable === true && item.consumable !== true, dailyMaxRarity, qualitySource)
      if (equipment) reward.items?.push(equipment)
    }
    if (Math.random() < 0.15 * mult) {
      reward.expeditionTickets = 1
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
    if (Math.random() < 0.50) {
      reward.expeditionTickets = 1
    }
    reward.message = '이번 주의 선택과 완료가 묶여 보상으로 돌아왔습니다.'
  } else {
    const rewardFloor = box.floor ?? 5
    reward.hunterXp = Math.round((30 + rewardFloor * 3) * mult)
    reward.shadowEssence = Math.round((5 + rewardFloor / 2) * mult)
    reward.statRewards = { [stat]: roundStatValue((0.16 + rewardFloor * 0.003) * mult) }
    if (Math.random() < 0.34) {
      const consumable = getItemFromPool(item => item.consumable === true, 'epic', qualitySource)
      if (consumable) reward.consumables?.push(consumable)
    }
    if (Math.random() < (box.tier === 'epic' ? 0.84 : 0.68)) {
      const equipment = getItemFromPool(item => item.equippable === true && item.consumable !== true, box.tier === 'epic' ? 'epic' : 'rare', qualitySource)
      if (equipment) reward.items?.push(equipment)
    }
    if (Math.random() < 0.20 * mult) {
      reward.expeditionTickets = 1
    }
    reward.message = '상위 보스 전리품의 잔향이 담겨 있습니다.'
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
  const routeDate = card.date || s.lastChallengeCardDate || todayKey()
  switch (card.condition.type) {
    case 'completeAnyDaily':
    case 'completeDailyCount':
      return countDailyCompletionsForDate(s, routeDate) >= target
    case 'completeQuestCategory': {
      const category = card.condition.category
      if (category === 'workout' || category === 'health') {
        return countDailyCategoryCompletionsForDate(s, ['workout', 'health'], routeDate) >= target
      }
      if (category === 'study' || category === 'career' || category === 'finance') {
        return countDailyCategoryCompletionsForDate(s, ['study', 'career', 'finance'], routeDate) >= target
      }
      return category ? countDailyCategoryCompletionsForDate(s, [category], routeDate) >= target : false
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
      return countDailyCategoryCompletionsForDate(s, ['workout', 'health'], routeDate) >= 1 &&
        countDailyCategoryCompletionsForDate(s, ['study', 'career', 'finance'], routeDate) >= 1
    default:
      return false
  }
}

const applyChallengeProgress = (s: GameState, event: ChallengeProgressEvent): Partial<GameState> => {
  const date = s.lastChallengeCardDate ?? todayKey()
  const selected = new Set(s.selectedChallengeCardIds ?? [])
  const cards = s.todayChallengeCards ?? []
  if (cards.length === 0 || selected.size === 0) return {}

  const completedNow: ChallengeCard[] = []
  const nextCards = cards.map(card => {
    if (isRetiredTowerChallengeCard(card)) return card
    if (card.date !== date || card.status !== 'selected' || !selected.has(card.id)) return card
    if (!isChallengeConditionMet(s, card, event)) return card
    const completed = { ...card, status: 'completed' as const, completedAt: todayISO() }
    completedNow.push(completed)
    return completed
  })
  if (completedNow.length === 0) return {}

  let nextHunter = s.hunter
  let nextGold = s.gold ?? 0
  let nextShadowEssence = s.shadowEssence ?? 0
  const nextMessages: SystemMessage[] = []
  for (const card of completedNow) {
    const xpResult = applyXp(nextHunter, card.reward.hunterXp, 'challenge')
    nextHunter = xpResult.hunter
    nextGold += card.reward.gold ?? 0
    nextShadowEssence += card.reward.shadowEssence
    nextMessages.push({
      id: uid(),
      kind: 'quest',
      title: '도전 카드 완료',
      lines: [
        `[${card.title}]`,
        `XP +${card.reward.hunterXp}`,
        ...(card.reward.gold ? [`Gold +${card.reward.gold}`] : []),
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
  const fullCompletionBonus = completedThreeNow ? rollChallengeFullCompletionBonus() : {}
  if (completedThreeNow) {
    const bonusXp = fullCompletionBonus.hunterXp ?? 0
    if (bonusXp > 0) {
      const beforeLevel = nextHunter.level
      const xpResult = applyXp(nextHunter, bonusXp, 'challenge')
      nextHunter = xpResult.hunter
      if (xpResult.outcome?.leveledUp) {
        nextMessages.push({
          id: uid(),
          kind: 'levelup',
          title: 'LEVEL UP',
          lines: [
            `Lv.${beforeLevel} -> Lv.${xpResult.outcome.newLevel}`,
            `자동 분배: ${formatStatGains(xpResult.outcome.autoStatGains)}`,
            `자유 배분권 +${xpResult.outcome.freeStatPointsGained}`,
          ],
          createdAt: todayISO(),
        })
      }
    }
    nextShadowEssence += fullCompletionBonus.shadowEssence ?? 0
    nextGold += fullCompletionBonus.gold ?? 0
    nextMessages.push({
      id: uid(),
      kind: 'shadow',
      title: '도전 카드 완전 달성 보너스',
      lines: [
        '선택 카드 3/3 완료',
        ...(bonusXp ? [`XP +${bonusXp}`] : []),
        ...(fullCompletionBonus.gold ? [`Gold +${fullCompletionBonus.gold}`] : []),
        ...(fullCompletionBonus.shadowEssence ? [`그림자 정수 +${fullCompletionBonus.shadowEssence}`] : []),
        ...(fullCompletionBonus.shadowSummonTickets ?? []).map(ticket => ticket.label),
        ...Object.entries(fullCompletionBonus.shadowSummonShards ?? {}).map(([type, amount]) => `${type} 조각 +${amount}`),
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
    gold: nextGold,
    shadowEssence: nextShadowEssence,
    todayChallengeCards: nextCards,
    challengeCardHistory,
    rewardBoxes: weekly.rewardBoxes,
    lastWeeklyBoxWeek: weekly.lastWeeklyBoxWeek,
    shadowSummonTickets: [
      ...(s.shadowSummonTickets ?? []),
      ...(fullCompletionBonus.shadowSummonTickets ?? []),
    ],
    shadowSummonShards: addShadowSummonShards(s.shadowSummonShards, fullCompletionBonus.shadowSummonShards),
    messages: [...s.messages, ...nextMessages],
  })
}

function isValidMainQuestMilestoneArray(milestones: any): milestones is MainQuestMilestone[] {
  if (!Array.isArray(milestones)) return false
  if (milestones.length === 0) return false
  return milestones.every(m => 
    m && 
    typeof m === 'object' && 
    typeof m.id === 'string' && 
    typeof m.title === 'string' && 
    typeof m.status === 'string' && 
    typeof m.order === 'number'
  )
}

function normalizeTitle(title: string): string {
  if (!title) return ''
  return title.replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase()
}

function getDefaultMainQuestTemplate(quest: Quest): Quest | null {
  // 1차 매칭: ID 일치
  const directMatch = DEFAULT_MAIN_QUESTS.find(def => def.id === quest.id)
  if (directMatch) return directMatch

  // 2차 매칭: Title normalize 비교 + category 일치
  const normTarget = normalizeTitle(quest.title)
  if (!normTarget) return null

  const titleMatch = DEFAULT_MAIN_QUESTS.find(def => {
    return def.category === quest.category && normalizeTitle(def.title) === normTarget
  })
  return titleMatch || null
}

function shouldBackfillMainQuestMilestones(quest: Quest): boolean {
  if (quest.type !== 'main') return false
  if (!quest.milestones) return true
  if (!isValidMainQuestMilestoneArray(quest.milestones)) return true
  
  // finalGoal이 비어있고 seed에 있는 경우 백필 대상
  const template = getDefaultMainQuestTemplate(quest)
  if (template && template.finalGoal && !quest.finalGoal) return true
  
  return false
}

function backfillMainQuestFromDefaultTemplate(quest: Quest, template: Quest): Quest {
  const newFinalGoal = quest.finalGoal || template.finalGoal

  // 템플릿 마일스톤 목록 복사 (깊은 복사)
  const templateMilestones = (template.milestones as MainQuestMilestone[]) || []
  let newMilestones: MainQuestMilestone[] = templateMilestones.map(m => ({ ...m }))

  // 기존 milestones에서 유용한 정보 수집
  const existingMilestones = Array.isArray(quest.milestones) ? quest.milestones : []

  // 매칭하여 기존 진행 상황 복원
  newMilestones = newMilestones.map(newM => {
    // 1. ID 매칭
    let match = existingMilestones.find(oldM => oldM && typeof oldM === 'object' && oldM.id === newM.id)
    // 2. Title 매칭
    if (!match) {
      const normNew = normalizeTitle(newM.title)
      match = existingMilestones.find(oldM => oldM && typeof oldM === 'object' && oldM.title && normalizeTitle(oldM.title) === normNew)
    }
    // 3. Order 매칭 (인덱스 매칭)
    if (!match) {
      match = existingMilestones.find(oldM => oldM && typeof oldM === 'object' && oldM.order === newM.order)
    }

    if (match && typeof match === 'object') {
      // 사용자 진행 이력 보존
      const updatedStatus = (match.status === 'completed' || match.status === 'skipped') ? match.status : newM.status
      return {
        ...newM,
        status: updatedStatus as 'locked' | 'active' | 'completed' | 'skipped',
        completedAt: match.completedAt || undefined,
        evidenceNote: match.evidenceNote || undefined
      }
    }

    return newM
  })

  // 만약 퀘스트 자체가 이미 completed 상태라면 전체 마일스톤을 completed로 강제 승격
  if (quest.completed || quest.status === 'completed') {
    newMilestones = newMilestones.map(m => ({
      ...m,
      status: 'completed' as const,
      completedAt: m.completedAt || quest.completedAt || todayISO()
    }))
  } else {
    // 퀘스트가 미완료인 경우:
    // 이미 완료(completed/skipped)인 마일스톤은 그대로 두고,
    // 완료되지 않은 마일스톤 중 첫 번째(order 기준 정렬 시 가장 앞자리)를 active로 설정, 나머지는 locked로 보정
    const sorted = [...newMilestones].sort((a, b) => a.order - b.order)
    let foundFirstInactive = false
    
    newMilestones = sorted.map(m => {
      if (m.status === 'completed' || m.status === 'skipped') {
        return m
      }
      if (!foundFirstInactive) {
        foundFirstInactive = true
        return { ...m, status: 'active' as const }
      } else {
        return { ...m, status: 'locked' as const }
      }
    })
  }

  // progressPercent 계산
  const completedCount = newMilestones.filter(m => m.status === 'completed').length
  const totalCount = newMilestones.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : (quest.completed ? 100 : 0)

  return {
    ...quest,
    finalGoal: newFinalGoal,
    milestones: newMilestones,
    progressPercent
  }
}


const cleanUpOldHardcoreBackups = (maxBackups = 5) => {
  if (typeof localStorage === 'undefined') return
  const prefix = 'levelup-save-hardcore-backup-gen-'
  const backupKeys: { key: string; gen: number }[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      const genStr = key.replace(prefix, '')
      const gen = parseInt(genStr, 10)
      if (!isNaN(gen)) {
        backupKeys.push({ key, gen })
      }
    }
  }
  backupKeys.sort((a, b) => b.gen - a.gen)
  if (backupKeys.length > maxBackups) {
    for (let i = maxBackups; i < backupKeys.length; i++) {
      localStorage.removeItem(backupKeys[i].key)
    }
  }
}

const createHardcoreDeathResetState = (
  s: GameState,
  reason: string,
  battleContext: string,
): Partial<GameState> => {
  const hardcore = ensureHardcoreState(s.hardcoreState)
  const timestamp = Date.now()
  const gen = hardcore.deathCount + 1
  const genBackupKey = `levelup-save-hardcore-backup-gen-${gen}`
  const backupMeta: HardcoreBackupMeta = {
    timestamp,
    reason,
    playerLevel: s.hunter.level,
    battleContext,
    backupKey: genBackupKey,
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const backupData = JSON.stringify({ meta: backupMeta, state: s })
      localStorage.setItem(HARDCORE_BACKUP_KEY, backupData)
      localStorage.setItem(genBackupKey, backupData)
      cleanUpOldHardcoreBackups(5)
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[Hardcore] backup failed', error)
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const recordsRaw = localStorage.getItem('levelup-hall-of-fame')
      const records: HallOfFameRecord[] = recordsRaw ? JSON.parse(recordsRaw) : []
      const record: HallOfFameRecord = {
        generation: gen,
        level: s.hunter.level,
        rank: s.hunter.rank,
        gateClearedCount: s.achievementStats?.gateClearedCount ?? 0,
        redGateClearedCount: s.achievementStats?.redGateClearedCount ?? 0,
        bossKillsCount: s.achievementStats?.bossKillsCount ?? 0,
        highestTowerFloor: s.infiniteTower?.highestClearedFloor ?? 0,
        monarchsDefeatedNames: s.livingWorld?.activeMonarchs
          ?.filter((m: any) => m.status === 'defeated')
          .map((m: any) => m.name) ?? [],
        deathReason: reason,
        battleContext: battleContext,
        survivalDays: s.livingWorld?.day ?? 1,
        streak: s.hunter.streak ?? 0,
        timestamp,
        backupKey: genBackupKey,
      }
      records.unshift(record)
      localStorage.setItem('levelup-hall-of-fame', JSON.stringify(records))
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[Hardcore] hall of fame save failed', error)
  }

  return {
    hunter: initialHunter,
    quests: s.quests,
    items: [],
    runes: [],
    titles: [],
    messages: [{
      id: uid(),
      kind: 'info',
      title: '하드코어 사망 리셋',
      lines: ['헌터가 전투에서 쓰러져 진행이 초기화되었습니다.', '리셋 전 복구용 백업이 저장되었습니다.'],
      createdAt: todayISO(),
    }],
    achievementStats: s.achievementStats ? {
      ...s.achievementStats,
      gateClearedCount: 0,
      redGateClearedCount: 0,
      bossKillsCount: 0,
      dungeonClears: {
        total: 0,
        byQuestId: {},
      },
    } : createInitialAchievementStats(),
    activeRandomQuest: undefined,
    randomQuestHistory: {},
    equipment: {},
    activeConsumableEffects: [],
    gateStatus: createInitialGateStatus(),
    activeGate: undefined,
    activeWorldGate: undefined,
    combatLogs: [],
    manualBattleSession: undefined,
    ownedShadows: [],
    equippedShadowIds: [],
    shadowExtractHistory: [],
    shadowExtractFailCount: {},
    lastShadowExtractResult: undefined,
    gold: 0,
    shadowEssence: 0,
    mutationMaterialNormal: 0,
    mutationMaterialAdvanced: 0,
    mutationMaterialSupreme: 0,
    shadowEnhanceStones: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
    shadowSummonTickets: [],
    expeditionTickets: 0,
    shadowSummonShards: {},
    shadowFragments: {},
    shadowAchievementTicketClaims: {},
    shadowExpeditions: [],
    lastShadowExpeditionDate: undefined,
    activeShadowExpeditionId: undefined,
    shadowLegionNodes: {},
    infiniteTower: createInitialTowerState(),
    activeRiftNodeId: undefined,
    riftNodes: (() => {
      const nodes: Record<string, RiftNodeStatus> = {}
      RIFT_NODES.forEach((n) => {
        nodes[n.id] = n.status
      })
      return nodes
    })(),
    livingWorld: initLivingWorld(Math.floor(Math.random() * 99999999) + 1),
    activeWorldBattle: undefined,
    worldBattleRetreats: {},
    rewardBoxes: [],
    lastDailyBoxDate: undefined,
    lastWeeklyBoxWeek: undefined,
    todayChallengeCards: [],
    selectedChallengeCardIds: [],
    lastChallengeCardDate: undefined,
    challengeCardHistory: {},
    shopPurchases: {},
    skillStates: {},
    secretProgress: resetSecretProgressOnLoop(s.secretProgress),
    aiCoachCoreContext: s.aiCoachCoreContext,
    aiCoachMemory: s.aiCoachMemory,
    dailyProgression: s.dailyProgression,
    focusSession: s.focusSession,
    shadowAutoSweepState: {
      lastClaimTime: new Date().toISOString(),
      assignedShadowIds: [],
    },
    hunterGrade: createInitialHunterGradeState({
      hunter: initialHunter,
      focusSession: s.focusSession,
      achievementStats: createInitialAchievementStats(),
    }),
    hardcoreState: {
      ...createInitialHardcoreState(timestamp),
      deathCount: hardcore.deathCount + 1,
      victoryCount: hardcore.victoryCount ?? 0,
      clearHistory: hardcore.clearHistory ?? [],
      lastHardcoreBackup: backupMeta,
      worldThreat: 0,
    },
    initialized: true,
  }
}

const shouldHardcoreResetForCombat = (s: GameState, combatLog: CombatLog): boolean => {
  const source = combatLog.source
  if (source && !shouldApplyHardcoreDeathReset(source)) {
    return false
  }

  const progressed =
    combatLog.battleStarted === true ||
    ((combatLog.actionCount ?? 0) > 0 && combatLog.totalTurns > 0) ||
    (combatLog.battleStarted == null && combatLog.actionCount == null && combatLog.totalTurns > 0 && combatLog.turns.length > 0)
  const structuredPlayerDeath =
    combatLog.playerDeathDetected === true &&
    combatLog.defeatReason === 'player_dead'
  const legacyFinalPlayerDeath =
    combatLog.playerDeathDetected == null &&
    combatLog.defeatReason == null &&
    combatLog.playerHpRemaining <= 0

  const enabled = ensureHardcoreState(s.hardcoreState).enabled
  const resetPending = ensureHardcoreState(s.hardcoreState).resetPending

  return enabled &&
    !resetPending &&
    combatLog.result === 'defeat' &&
    combatLog.finalized !== false &&
    (combatLog.finalOutcome === undefined || combatLog.finalOutcome === 'defeat') &&
    progressed &&
    (structuredPlayerDeath || legacyFinalPlayerDeath)
}

const shouldHardcoreResetForManualSession = (s: GameState, session?: ManualBattleSession): boolean =>
  shouldTriggerHardcoreDeathFromSession(s, session)

const createManualSessionDeathResetState = (
  s: GameState,
  session: ManualBattleSession,
  reason: string,
  battleContext: string,
): Partial<GameState> =>
  createHardcoreDeathResetState(
    {
      ...s,
      manualBattleSession: {
        ...session,
        result: 'defeat',
        finalOutcome: 'defeat',
        playerDeathDetected: true,
        hardcoreDeathHandled: true,
        finalized: true,
        defeatReason: 'player_dead',
      },
    },
    reason,
    battleContext,
  )

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      hunter: initialHunter,
      hardcoreState: createInitialHardcoreState(),
      quests: initialQuests,
      items: [],
      runes: [],
      titles: [],
      messages: [],
      achievementStats: createInitialAchievementStats(),
      activeRandomQuest: undefined,
      randomQuestHistory: {},
      equipment: {},
      activeConsumableEffects: [],
      gateStatus: createInitialGateStatus(),
      activeGate: undefined,
      activeWorldGate: undefined,
      riftNodes: (() => {
        const nodes: Record<string, RiftNodeStatus> = {}
        RIFT_NODES.forEach((n) => {
          nodes[n.id] = n.status
        })
        return nodes
      })(),
      activeRiftNodeId: undefined,
      combatLogs: [],
      manualBattleSession: undefined,
      ownedShadows: [],
      equippedShadowIds: [],
      shadowExtractHistory: [],
      shadowExtractFailCount: {},
      lastShadowExtractResult: undefined,
      gold: 0,
      shadowEssence: 0,
      mutationMaterialNormal: 0,
      mutationMaterialAdvanced: 0,
      mutationMaterialSupreme: 0,
      shadowEnhanceStones: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
      shadowSummonTickets: [],
      expeditionTickets: 0,
      shadowSummonShards: {},
      shadowFragments: {},
      shadowAchievementTicketClaims: {},
      shadowExpeditions: [],
      lastShadowExpeditionDate: undefined,
      activeShadowExpeditionId: undefined,
      completedSpecialExpeditionIds: [],
      rewardBoxes: [],
      lastDailyBoxDate: undefined,
      lastWeeklyBoxWeek: undefined,
      todayChallengeCards: [],
      selectedChallengeCardIds: [],
      lastChallengeCardDate: undefined,
      challengeCardHistory: {},
      shopPurchases: {},
      skillStates: {},
      secretProgress: undefined,
      focusSession: { history: [], totalFocusedMs: 0 },
      hunterGrade: undefined,
      shadowAutoSweepState: {
        lastClaimTime: new Date().toISOString(),
        assignedShadowIds: [],
      },
      initialized: false,

      setHunterName: (name) => set((s) => ({ hunter: { ...s.hunter, name } })),
      setHunterJob: (job) => set((s) => ({ hunter: { ...s.hunter, job } })),

      ensureDailyRewardSystems: () => set((s) => {
        const routeDate = s.lastChallengeCardDate ?? s.lastDailyBoxDate ?? todayKey()
        let rewardBoxes = s.rewardBoxes ?? []
        let lastDailyBoxDate = s.lastDailyBoxDate
        let todayChallengeCards = s.todayChallengeCards ?? []
        let selectedChallengeCardIds = s.selectedChallengeCardIds ?? []
        let lastChallengeCardDate = s.lastChallengeCardDate
        const hasRetiredTowerCards = todayChallengeCards.some(isRetiredTowerChallengeCard)

        if (todayChallengeCards.length === 0 || hasRetiredTowerCards) {
          todayChallengeCards = generateChallengeCardsForToday(s.quests, routeDate)
          selectedChallengeCardIds = []
          lastChallengeCardDate = routeDate
        }

        const hasRouteDailyBox = rewardBoxes.some(box =>
          box.status === 'available' && isDailyRewardRouteBox(box, routeDate)
        )
        if (!lastDailyBoxDate && !hasRouteDailyBox) {
          rewardBoxes = [
            createRewardBox('daily', 'normal', 'daily_login', `${routeDate} 일일 박스`),
            ...rewardBoxes,
          ].slice(0, 30)
          lastDailyBoxDate = routeDate
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
        const routeDate = s.lastChallengeCardDate ?? s.lastDailyBoxDate ?? todayKey()
        const cards = s.todayChallengeCards ?? []
        if (cards.length === 0) {
          return {
            todayChallengeCards: generateChallengeCardsForToday(s.quests, routeDate),
            selectedChallengeCardIds: [],
            lastChallengeCardDate: routeDate,
          }
        }
        const activeCards = cards.filter(card => !isRetiredTowerChallengeCard(card))
        const alreadySelected = activeCards.some(card => card.status === 'selected' || card.status === 'completed')
        if (alreadySelected) return {}
        const validIds = Array.from(new Set(cardIds)).filter(id => activeCards.some(card => card.id === id)).slice(0, 3)
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

        const activeRouteDate = s.lastDailyBoxDate ?? s.lastChallengeCardDate ?? todayKey()
        const effectiveTier = isDailyRewardRouteBox(box, activeRouteDate)
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
          gold: (s.gold ?? 0) + (reward.gold ?? 0),
          shadowEssence: (s.shadowEssence ?? 0) + (reward.shadowEssence ?? 0),
          shadowSummonTickets: [...(s.shadowSummonTickets ?? []), ...(reward.shadowSummonTickets ?? [])],
          expeditionTickets: (s.expeditionTickets ?? 0) + (reward.expeditionTickets ?? 0),
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

      purchaseShopProduct: (productId, quantity = 1) => set((s) => {
        const product = SHOP_PRODUCTS.find(item => item.id === productId)
        if (!product) return {}
        const purchaseQuantity = Math.max(1, Math.min(99, Math.floor(quantity)))
        const totalGoldCost = product.priceGold * purchaseQuantity
        const totalEssenceCost = (product.priceEssence ?? 0) * purchaseQuantity
        if ((s.gold ?? 0) < totalGoldCost) return {}
        if ((s.shadowEssence ?? 0) < totalEssenceCost) return {}

        const grants = {
          items: [] as Item[],
          runes: [] as RuneItem[],
          tickets: [] as ShadowSummonTicket[],
          shards: {} as Partial<Record<ShadowSummonShardType, number>>,
          essence: 0,
          expeditionTickets: 0,
          mutationMaterialNormal: 0,
          mutationMaterialAdvanced: 0,
          mutationMaterialSupreme: 0,
          shadowEnhanceStones: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 } as Record<ShadowRarity, number>,
          lines: [] as string[],
        }
        for (let i = 0; i < purchaseQuantity; i++) {
          applyShopReward(product.reward, grants as any)
        }

        const spentLines = [
          `Gold -${totalGoldCost}`,
          ...(product.priceEssence ? [`그림자 정수 -${totalEssenceCost}`] : []),
        ]

        const nextEnhanceStones = { ...(s.shadowEnhanceStones ?? { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 }) }
        for (const [r, count] of Object.entries(grants.shadowEnhanceStones)) {
          const rarity = r as ShadowRarity
          nextEnhanceStones[rarity] = (nextEnhanceStones[rarity] ?? 0) + count
        }

        return {
          gold: (s.gold ?? 0) - totalGoldCost,
          shadowEssence: (s.shadowEssence ?? 0) - totalEssenceCost + grants.essence,
          shadowSummonTickets: [...(s.shadowSummonTickets ?? []), ...grants.tickets],
          shadowSummonShards: addShadowSummonShards(s.shadowSummonShards, grants.shards),
          items: [...s.items, ...grants.items],
          runes: [...(s.runes ?? []), ...grants.runes],
          expeditionTickets: (s.expeditionTickets ?? 0) + grants.expeditionTickets,
          mutationMaterialNormal: (s.mutationMaterialNormal ?? 0) + grants.mutationMaterialNormal,
          mutationMaterialAdvanced: (s.mutationMaterialAdvanced ?? 0) + grants.mutationMaterialAdvanced,
          mutationMaterialSupreme: (s.mutationMaterialSupreme ?? 0) + grants.mutationMaterialSupreme,
          shadowEnhanceStones: nextEnhanceStones,
          messages: [...s.messages, {
            id: uid(),
            kind: grants.items.length > 0 ? 'item' : grants.tickets.length > 0 || Object.keys(grants.shards).length > 0 ? 'shadow' : 'info',
            title: '상점 구매 완료',
            lines: [
              purchaseQuantity > 1 ? `${product.name} x${purchaseQuantity}` : product.name,
              ...spentLines,
              ...grants.lines,
            ],
            createdAt: todayISO(),
          }],
        }
      }),

      recordAppOpen: () => set((s) => {
        const now = todayISO()
        const dateKey = todayKey()
        const stats = s.achievementStats
        
        const firstSeenAt = stats.app.firstSeenAt ?? now
        const activeDateKeys = stats.app.activeDateKeys.includes(dateKey)
          ? stats.app.activeDateKeys
          : [...stats.app.activeDateKeys, dateKey]

        // 12-40F: 앱 열 때마다 daily 준비도 재계산 (날짜 바뀐 경우 리셋 포함)
        const dp = buildDailyProgression(s.quests, stats)
        
        // 12-41B: Hunter Grade 마이그레이션 및 재평가
        const nextGradeState = recalcHunterGradeState(s.hunterGrade, s, '앱 재기동 정기 검사')
        
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
          dailyProgression: dp,
          hunterGrade: nextGradeState,
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
        // v2 compatibility: add to jobs list if not present
        const h = s.hunter
        const unlockedJobIds = h.unlockedJobIds || ['unawakened']
        const jobs: Partial<Record<JobId, OwnedJobState>> = h.jobs || {}
        
        if (unlockedJobIds.includes(jobId) && jobs[jobId]) return {}

        const newUnlockedIds = unlockedJobIds.includes(jobId) 
          ? unlockedJobIds 
          : [...unlockedJobIds, jobId]

        const newJobs: Partial<Record<JobId, OwnedJobState>> = { ...jobs }
        if (!newJobs[jobId]) {
          newJobs[jobId] = {
            jobId,
            level: 1,
            xp: 0,
            unlockedAt: todayISO()
          }
        }

        const v2Def = JOB_DEFINITIONS_V2.find(j => j.id === jobId)
        const jobName = v2Def ? v2Def.name : jobId.toString()

        return {
          hunter: {
            ...h,
            unlockedJobIds: newUnlockedIds,
            jobs: newJobs,
          },
          messages: [...s.messages, {
            id: uid(),
            kind: 'info',
            title: '── SYSTEM ── 직업 획득',
            lines: [`새 직업 [${jobName}]을 획득했습니다.`],
            createdAt: todayISO(),
          }],
        }
      }),

      equipJob: (jobId) => set((s) => {
        const h = s.hunter
        const unlockedJobIds = h.unlockedJobIds || ['unawakened']
        const jobs: Partial<Record<JobId, OwnedJobState>> = h.jobs || {}

        // Not unlocked
        if (!unlockedJobIds.includes(jobId) && !jobs[jobId]) return {}
        
        const v2Def = JOB_DEFINITIONS_V2.find(j => j.id === jobId)
        if (!v2Def) return {}

        return {
          hunter: {
            ...h,
            jobId, // legacy sink
            activeJobId: jobId, // v2 active
            job: v2Def.name, // display text
          },
        }
      }),

      changeActiveJob: (jobId) => {
        get().equipJob(jobId)
      },

      advanceToJob: (jobId) => set((s) => {
        const h = s.hunter
        const availableAdvancements = h.availableAdvancements || []
        const discoveredHiddenJobIds = h.discoveredHiddenJobIds || []

        const isAdvancement = availableAdvancements.includes(jobId)
        const isHidden = discoveredHiddenJobIds.includes(jobId)

        if (!isAdvancement && !isHidden) return {}

        const v2Def = JOB_DEFINITIONS_V2.find(j => j.id === jobId)
        if (!v2Def) return {}

        // Enforce strict path validation
        const activeJobId = h.activeJobId || 'novice-hunter'
        let isPathValid = false
        if (v2Def.tier === 'first' && v2Def.hiddenProfile?.isHidden) {
          // Hidden 1st tier can be accepted from any regular class
          isPathValid = true
        } else {
          const currentJobDef = JOB_DEFINITIONS_V2.find(j => j.id === activeJobId)
          const hasPrev = v2Def.previousJobIds?.includes(activeJobId)
          const isNext = currentJobDef?.nextJobIds?.includes(jobId)
          if (hasPrev && isNext) {
            isPathValid = true
          }
        }

        if (!isPathValid) {
          return {}
        }

        const newUnlockedIds = (h.unlockedJobIds || []).includes(jobId)
          ? h.unlockedJobIds
          : [...(h.unlockedJobIds || []), jobId]

        const newJobs: Partial<Record<JobId, OwnedJobState>> = { ...(h.jobs || {}) }
        if (!newJobs[jobId]) {
          newJobs[jobId] = {
            jobId,
            level: 1,
            xp: 0,
            unlockedAt: todayISO()
          }
        }

        const nextAdvancements = availableAdvancements.filter(id => id !== jobId)
        const nextHidden = discoveredHiddenJobIds.filter(id => id !== jobId)

        const messageTitle = v2Def.tier === 'hidden' || v2Def.hiddenProfile?.isHidden ? '── SYSTEM ── 히든 각성 성공' : '── SYSTEM ── 직업 전직 완료'
        const messageLines = v2Def.tier === 'hidden' || v2Def.hiddenProfile?.isHidden
          ? [`[${h.job}]의 한계를 극복하고 숨겨진 신화 [${v2Def.name}]을(를) 수락했습니다.`]
          : [`성공적으로 [${v2Def.name}](으)로 전직하였습니다.`]

        // Schedule checkJobAwakening on next tick
        setTimeout(() => {
          get().checkJobAwakening()
        }, 0)

        return {
          hunter: {
            ...h,
            unlockedJobIds: newUnlockedIds,
            jobs: newJobs,
            activeJobId: jobId,
            jobId,
            job: v2Def.name,
            availableAdvancements: nextAdvancements,
            discoveredHiddenJobIds: nextHidden
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

      checkJobAwakening: () => {
        const s = get()
        // 런타임 마이그레이션 적용
        const h = migrateHiddenResonance(s.hunter)
        const stats = s.achievementStats
        
        const unlockedJobIds = h.unlockedJobIds || ['unawakened']
        const jobs: Partial<Record<JobId, OwnedJobState>> = h.jobs || {}
        const availableAdvancements = h.availableAdvancements || []
        const discoveredHiddenJobIds = h.discoveredHiddenJobIds || []
        const activeJobId = h.activeJobId || 'novice-hunter'
        
        let advancementsChanged = false
        let hiddenChanged = false
        const nextAdvancements = [...availableAdvancements]
        let nextHidden = [...discoveredHiddenJobIds]
        const newMessages: SystemMessage[] = []

        JOB_DEFINITIONS_V2.forEach(job => {
          if (unlockedJobIds.includes(job.id) || jobs[job.id]) return
          if (!job.hiddenProfile?.isHidden && nextAdvancements.includes(job.id)) return

          const cond = job.unlockCondition
          if (!cond) return

          // Path Validation Check
          let isPathValid = false
          if (job.id === 'novice-hunter') {
            isPathValid = false
          } else if (job.tier === 'first' && job.hiddenProfile?.isHidden) {
            // Hidden 1st tier can be sensed from any active class
            isPathValid = true
          } else {
            const currentJobDef = JOB_DEFINITIONS_V2.find(j => j.id === activeJobId)
            const hasPrev = job.previousJobIds?.includes(activeJobId)
            const isNext = currentJobDef?.nextJobIds?.includes(job.id)
            if (hasPrev && isNext) {
              isPathValid = true
            }
          }

          if (!isPathValid) return

          let isMet = true

          // 1. hunterLevel
          if (cond.hunterLevel !== undefined && h.level < cond.hunterLevel) {
            isMet = false
          }

          // 2. previousJobLevel
          if (cond.previousJobLevel !== undefined && job.previousJobIds) {
            const hasPrevMastery = job.previousJobIds.some(prevId => {
              const prevJobState = jobs[prevId]
              return prevJobState && prevJobState.level >= (cond.previousJobLevel ?? 0)
            })
            if (!hasPrevMastery) {
              isMet = false
            }
          }

          // 3. towerFloorCleared
          if (cond.towerFloorCleared !== undefined) {
            const highestFloor = s.infiniteTower?.highestClearedFloor ?? 0
            if (highestFloor < cond.towerFloorCleared) {
              isMet = false
            }
          }

          // 4. gateClearCount
          if (cond.gateClearCount !== undefined) {
            const gateClears = stats.dungeonClears.total ?? 0
            if (gateClears < cond.gateClearCount) {
              isMet = false
            }
          }

          // 5. bossClearCount
          if (cond.bossClearCount !== undefined) {
            const bossClears = stats.dungeonClears.total ?? 0
            if (bossClears < cond.bossClearCount) {
              isMet = false
            }
          }

          // 6. shadowCount
          if (cond.shadowCount !== undefined) {
            const shadowCount = s.ownedShadows?.length ?? 0
            if (shadowCount < cond.shadowCount) {
              isMet = false
            }
          }

          // 7. hiddenSignalKeys
          if (cond.hiddenSignalKeys && cond.hiddenSignalKeys.length > 0) {
            cond.hiddenSignalKeys.forEach(key => {
              const signalMet = (h.hiddenSignalKeys || []).includes(key)
              let inlineMet = false
              if (key === 'shadow-extract-success') {
                const shadowCount = s.ownedShadows?.length ?? 0
                if (shadowCount > 0) inlineMet = true
              }
              if (key === 'debuff-skill-use') {
                const skillUsed = Object.values(s.skillStates || {}).some(st => (st.timesUsed ?? 0) > 0)
                if (skillUsed) inlineMet = true
              }

              if (!signalMet && !inlineMet) {
                isMet = false
              }
            })
          }

          // 8. resonanceRequired 검증
          if (cond.resonanceRequired) {
            const progress = h.hiddenResonanceProgress || {}
            Object.entries(cond.resonanceRequired).forEach(([pathKey, reqVal]) => {
              const resVal = progress[pathKey]?.resonance ?? 0
              if (resVal < reqVal) {
                isMet = false
              }
            })
          }

          // 9. 직업별 특수 시나리오 복합 조건 검증
          if (isMet) {
            // 그림자 추종자 (shadow-disciple)
            if (job.id === 'shadow-disciple') {
              const hasExpedition = (h.hiddenSignalKeys || []).includes('shadow-expedition-success') || 
                                    (h.hiddenSignalKeys || []).includes('shadow-expedition-great')
              if (!hasExpedition) {
                isMet = false
              }
            }
            // 저주 입문자 (curse-initiate)
            if (job.id === 'curse-initiate') {
              const hasLongOrBoss = (h.hiddenSignalKeys || []).includes('long-battle-victory') || 
                                    (h.hiddenSignalKeys || []).includes('low-hp-boss-victory')
              if (!hasLongOrBoss) {
                isMet = false
              }
            }
            // 균열 감응자 (rift-sensing-hunter)
            if (job.id === 'rift-sensing-hunter') {
              const highestFloor = s.infiniteTower?.highestClearedFloor ?? 0
              const clutchVictory = (h.hiddenSignalKeys || []).includes('tower-boss-clutch-victory')
              if (highestFloor < 10 && !clutchVictory) {
                isMet = false
              }
            }
            // 그림자 군주 (shadow-lord)
            if (job.id === 'shadow-lord') {
              const hasEvolvedOrNamed = (h.hiddenSignalKeys || []).includes('shadow-evolved') || 
                                        (h.hiddenSignalKeys || []).includes('shadow-named-acquired')
              if (!hasEvolvedOrNamed) {
                isMet = false
              }
            }
          }

          if (isMet) {
            if (job.hiddenProfile?.isHidden) {
              if (!nextHidden.includes(job.id)) {
                nextHidden.push(job.id)
                hiddenChanged = true
                newMessages.push({
                  id: uid(),
                  kind: 'info',
                  title: '── SYSTEM ── 어둠 속의 기척',
                  lines: [`무언가 강력한 히든 직업의 기척이 느껴집니다. 직업 패널을 확인하십시오.`],
                  createdAt: todayISO(),
                })
              }
            } else {
              if (!nextAdvancements.includes(job.id)) {
                nextAdvancements.push(job.id)
                advancementsChanged = true
                newMessages.push({
                  id: uid(),
                  kind: 'info',
                  title: '── SYSTEM ── 전직 트리 개방',
                  lines: [`신규 직업 [${job.name}] 전직이 가능해졌습니다.`],
                  createdAt: todayISO(),
                })
              }
            }
          } else {
            if (job.hiddenProfile?.isHidden && nextHidden.includes(job.id)) {
              nextHidden = nextHidden.filter(id => id !== job.id)
              hiddenChanged = true
            }
          }
        })

        if (advancementsChanged || hiddenChanged || h !== s.hunter) {
          set({
            hunter: {
              ...h,
              availableAdvancements: nextAdvancements,
              discoveredHiddenJobIds: nextHidden
            },
            messages: newMessages.length > 0 ? [...s.messages, ...newMessages] : s.messages
          })
        }
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
        const activeJobId = s.hunter.activeJobId || s.hunter.jobId
        const currentJobV2 = JOB_DEFINITIONS_V2.find(j => j.id === activeJobId)
        const currentJobLegacy = JOB_DEFINITIONS.find(j => j.id === activeJobId)
        const jobCategoryBonus = currentJobV2?.growthAffinity?.questCategoryBonus?.[rq.category]
          ?? currentJobLegacy?.effects.xpBonusByCategory?.[rq.category]
          ?? 0
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

        // ── Job System v2: Apply active job XP ──
        const jobResult = gainActiveJobXp(newHunter, baseXp, rq.category)
        const finalHunter = { ...jobResult.hunter }
        
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
            `직업 [${jobResult.activeJobName}] XP +${jobResult.jobXpGained}${jobResult.jobCategoryBonus > 0 ? ` (친화도 보너스 +${Math.round(jobResult.jobCategoryBonus * 100)}%)` : ''}`,
          ],
          createdAt: todayISO(),
        })

        if (jobResult.jobLeveledUp) {
          newMessages.push({
            id: uid(),
            kind: 'info',
            title: 'JOB LEVEL UP',
            lines: [
              `직업 [${jobResult.activeJobName}]의 레벨이 상승했습니다.`,
              `Lv.${jobResult.jobPrevLevel} → Lv.${jobResult.jobNextLevel}`
            ],
            createdAt: todayISO(),
          })
        }
        
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
          hunter: finalHunter,
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
        if (!target) return undefined

        const equippedItemIds = new Set(Object.values(s.equipment).filter((id): id is string => Boolean(id)))
        if (!canEnhanceItem(target, s.items, equippedItemIds)) return undefined

        const material = getEnhanceMaterialCandidates(target, s.items, equippedItemIds)[0]
        if (!material) return undefined

        const isGreatSuccess = Math.random() < 0.10
        const levelIncrease = isGreatSuccess ? 2 : 1
        const currentLevel = getEnhancementLevel(target)
        const nextLevel = currentLevel + levelIncrease
        const nextItems = s.items
          .filter(item => item.id !== material.id)
          .map(item => item.id === target.id ? { ...item, enhancementLevel: nextLevel } : item)

        set({
          items: nextItems,
          messages: [...s.messages, {
            id: uid(),
            kind: isGreatSuccess ? 'levelup' : 'item',
            title: isGreatSuccess ? '🔥 장비 합성 대성공! 🔥' : '장비 강화',
            lines: isGreatSuccess ? [
              `[${target.name}] 합성 대성공!! (한 번에 +2단계 상승)`,
              `${target.name} +${nextLevel} 강화 달성!`,
              `재료로 [${material.name}] 1개를 소모했습니다.`,
            ] : [
              `[${target.name}] 강화 성공`,
              `${target.name} +${nextLevel}`,
              `재료로 [${material.name}] 1개를 소모했습니다.`,
            ],
            createdAt: todayISO(),
          }],
        })
        return { success: true, greatSuccess: isGreatSuccess, prevLevel: currentLevel, nextLevel }
      },

      enhanceItemWithGold: (itemId) => {
        const s = get()
        const target = s.items.find(i => i.id === itemId)
        if (!target) return undefined

        const playerGold = s.gold ?? 0
        if (!canEnhanceItemWithGold(target, playerGold)) return undefined

        const cost = getGoldEnhancementCost(target)
        const successRate = getGoldEnhancementSuccessRate(target)
        const isSuccess = Math.random() < successRate
        const isGreatSuccess = isSuccess && (Math.random() < 0.10)
        const levelIncrease = isGreatSuccess ? 2 : 1

        const nextGold = Math.max(0, playerGold - cost)
        const currentLevel = getEnhancementLevel(target)
        const nextLevel = isSuccess ? currentLevel + levelIncrease : currentLevel

        const nextItems = isSuccess
          ? s.items.map(item => item.id === target.id ? { ...item, enhancementLevel: nextLevel } : item)
          : s.items

        const ratePct = Math.round(successRate * 100)

        const title = isGreatSuccess
          ? '🔥 장비 골드 대성공! 🔥'
          : isSuccess
            ? '장비 골드 강화 성공'
            : '장비 골드 강화 실패'

        const lines = isGreatSuccess ? [
          `[${target.name}] 골드 강화 대성공!!! (한 번에 +2단계 상승) (${ratePct}% 확률)`,
          `${target.name} +${nextLevel} 강화 달성!`,
          `비용으로 ${cost.toLocaleString()} 골드를 소모했습니다.`,
        ] : isSuccess ? [
          `[${target.name}] 골드 강화 성공 (${ratePct}% 확률)`,
          `${target.name} +${nextLevel} 강화 달성!`,
          `비용으로 ${cost.toLocaleString()} 골드를 소모했습니다.`,
        ] : [
          `[${target.name}] 골드 강화 실패 (${ratePct}% 확률)`,
          `강화 수치(+${currentLevel})가 유지됩니다.`,
          `비용으로 ${cost.toLocaleString()} 골드를 소모했습니다.`,
        ]

        set({
          gold: nextGold,
          items: nextItems,
          messages: [...s.messages, {
            id: uid(),
            kind: isGreatSuccess ? 'levelup' : 'item',
            title,
            lines,
            createdAt: todayISO(),
          }],
        })
        return { success: isSuccess, greatSuccess: isGreatSuccess, prevLevel: currentLevel, nextLevel, cost }
      },

      equipRune: (runeId, targetId, targetType, slotIndex) => {
        const s = get()
        const rune = s.runes?.find(r => r.id === runeId)
        if (!rune) return

        if (targetType === 'shadow') {
          const shadow = s.ownedShadows?.find(sh => sh.instanceId === targetId)
          if (!shadow) return
          const maxSlots = getShadowRuneSlotsCount(shadow)
          if (slotIndex < 0 || slotIndex >= maxSlots) return
          const currentSlots = shadow.runeSlots ? [...shadow.runeSlots] : Array(maxSlots).fill(null)
          if (currentSlots[slotIndex] !== null) return
          currentSlots[slotIndex] = rune

          const nextOwnedShadows = s.ownedShadows.map(sh =>
            sh.instanceId === targetId ? { ...sh, runeSlots: currentSlots } : sh
          )
          const nextRunes = s.runes.filter(r => r.id !== runeId)

          set({
            ownedShadows: nextOwnedShadows,
            runes: nextRunes,
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow',
              title: '룬 장착 완료',
              lines: [`${shadow.name}의 ${slotIndex + 1}번 슬롯에 [${rune.icon} ${rune.name}]을 장착했습니다.`],
              createdAt: todayISO(),
            }]
          })
        } else if (targetType === 'equipment') {
          const item = s.items?.find(it => it.id === targetId)
          if (!item) return
          const maxSlots = getItemRuneSlotsCount(item)
          if (slotIndex < 0 || slotIndex >= maxSlots) return
          const currentSlots = item.runeSlots ? [...item.runeSlots] : Array(maxSlots).fill(null)
          if (currentSlots[slotIndex] !== null) return
          currentSlots[slotIndex] = rune

          const nextItems = s.items.map(it =>
            it.id === targetId ? { ...it, runeSlots: currentSlots } : it
          )
          const nextRunes = s.runes.filter(r => r.id !== runeId)

          set({
            items: nextItems,
            runes: nextRunes,
            messages: [...s.messages, {
              id: uid(),
              kind: 'item',
              title: '룬 장착 완료',
              lines: [`[${item.name}]의 ${slotIndex + 1}번 슬롯에 [${rune.icon} ${rune.name}]을 장착했습니다.`],
              createdAt: todayISO(),
            }]
          })
        }
      },

      unequipRune: (targetId, targetType, slotIndex) => {
        const s = get()

        if (targetType === 'shadow') {
          const shadow = s.ownedShadows?.find(sh => sh.instanceId === targetId)
          if (!shadow || !shadow.runeSlots || !shadow.runeSlots[slotIndex]) return
          const rune = shadow.runeSlots[slotIndex]!
          const nextSlots = [...shadow.runeSlots]
          nextSlots[slotIndex] = null

          const nextOwnedShadows = s.ownedShadows.map(sh =>
            sh.instanceId === targetId ? { ...sh, runeSlots: nextSlots } : sh
          )
          const nextRunes = [...(s.runes ?? []), rune]

          set({
            ownedShadows: nextOwnedShadows,
            runes: nextRunes,
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow',
              title: '룬 해제 완료',
              lines: [`${shadow.name}의 ${slotIndex + 1}번 슬롯에서 [${rune.icon} ${rune.name}]을 해제했습니다.`],
              createdAt: todayISO(),
            }]
          })
        } else if (targetType === 'equipment') {
          const item = s.items?.find(it => it.id === targetId)
          if (!item || !item.runeSlots || !item.runeSlots[slotIndex]) return
          const rune = item.runeSlots[slotIndex]!
          const nextSlots = [...item.runeSlots]
          nextSlots[slotIndex] = null

          const nextItems = s.items.map(it =>
            it.id === targetId ? { ...it, runeSlots: nextSlots } : it
          )
          const nextRunes = [...(s.runes ?? []), rune]

          set({
            items: nextItems,
            runes: nextRunes,
            messages: [...s.messages, {
              id: uid(),
              kind: 'item',
              title: '룬 해제 완료',
              lines: [`[${item.name}]의 ${slotIndex + 1}번 슬롯에서 [${rune.icon} ${rune.name}]을 해제했습니다.`],
              createdAt: todayISO(),
            }]
          })
        }
      },

      enhanceRuneWithGold: (runeId) => {
        const s = get()
        const rune = s.runes?.find(r => r.id === runeId)
        if (!rune || rune.enhancementLevel >= 5) return undefined

        const playerGold = s.gold ?? 0
        const cost = getRuneGoldEnhancementCost(rune)
        if (playerGold < cost) return undefined

        const successRate = getRuneGoldEnhancementSuccessRate(rune)
        const isSuccess = Math.random() < successRate
        const isGreatSuccess = isSuccess && (Math.random() < 0.10) && (rune.enhancementLevel + 2 <= 5)
        const levelIncrease = isGreatSuccess ? 2 : 1

        const nextGold = Math.max(0, playerGold - cost)
        const currentLevel = rune.enhancementLevel
        const nextLevel = isSuccess ? currentLevel + levelIncrease : currentLevel

        const nextRunes = isSuccess
          ? s.runes.map(r => r.id === runeId ? { ...r, enhancementLevel: nextLevel } : r)
          : s.runes

        const ratePct = Math.round(successRate * 100)

        const title = isGreatSuccess
          ? '🔥 룬 골드 강화 대성공! 🔥'
          : isSuccess
            ? '룬 골드 강화 성공'
            : '룬 골드 강화 실패'

        const lines = isGreatSuccess ? [
          `[${rune.name}] 골드 강화 대성공!!! (한 번에 +2단계 상승) (${ratePct}% 확률)`,
          `${rune.name} +${nextLevel} 강화 달성!`,
          `비용으로 ${cost.toLocaleString()} 골드를 소모했습니다.`,
        ] : isSuccess ? [
          `[${rune.name}] 골드 강화 성공 (${ratePct}% 확률)`,
          `${rune.name} +${nextLevel} 강화 달성!`,
          `비용으로 ${cost.toLocaleString()} 골드를 소모했습니다.`,
        ] : [
          `[${rune.name}] 골드 강화 실패 (${ratePct}% 확률)`,
          `강화 수치(+${currentLevel})가 유지됩니다.`,
          `비용으로 ${cost.toLocaleString()} 골드를 소모했습니다.`,
        ]

        set({
          gold: nextGold,
          runes: nextRunes,
          messages: [...s.messages, {
            id: uid(),
            kind: isGreatSuccess ? 'levelup' : 'item',
            title,
            lines,
            createdAt: todayISO(),
          }]
        })

        return { success: isSuccess, greatSuccess: isGreatSuccess, prevLevel: currentLevel, nextLevel, cost }
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

      initOrResetLivingWorld: (seed) => {
        const targetSeed = seed != null ? seed : Math.floor(Math.random() * 99999999) + 1
        set({
          livingWorld: initLivingWorld(targetSeed)
        })
      },

      discoverRiftNode: (nodeId) => {
        const s = get()
        const node = RIFT_NODES.find((n) => n.id === nodeId)
        if (!node) return

        const currentStatus = s.riftNodes[nodeId] ?? node.status
        if (currentStatus !== 'undiscovered') return

        const updatedNodes = { ...s.riftNodes, [nodeId]: 'active' as RiftNodeStatus }
        set({
          riftNodes: updatedNodes,
          messages: [
            ...s.messages,
            {
              id: uid(),
              kind: 'info',
              title: '구역 탐사 완료',
              lines: [`새로운 균열 구역 [${node.name}]을(를) 발견했습니다!`],
              createdAt: todayISO(),
            },
          ],
        })
      },

      enterRiftNode: (nodeId) => {
        const s = get()
        const isMonarchId = MONARCHS.some(m => m.id === nodeId) || nodeId === 'angel'
        const node = {
          difficulty: 500,
          deadline: 7,
          daysRemaining: 7,
          ...(s.livingWorld?.riftNodes[nodeId] || RIFT_NODES.find(n => n.id === nodeId))
        } as RiftNode
        if (!node) return

        // 진입 권한 가드: 대한민국 영역 외의 일반 게이트에는 진입 불가 (러브콜/기회형 이벤트인 경우는 허용)
        if (!isMonarchId && node.regionId !== 'kr' && !node.loveCall?.active && !node.opportunity) {
          return
        }

        set({ activeRiftNodeId: nodeId })
      },

      markRiftNodeCleared: (nodeId) => {
        const s = get()
        const isMonarchId = MONARCHS.some(m => m.id === nodeId) || nodeId === 'angel'

        let monarchData = undefined
        let monarchRegionId = 'kr'
        if (isMonarchId) {
          monarchData = nodeId === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === nodeId)
          if (s.livingWorld?.activeMonarchs) {
            const activeMon = s.livingWorld.activeMonarchs.find(m => m.monarchId === nodeId)
            if (activeMon && activeMon.occupiedRegionIds.length > 0) {
              monarchRegionId = activeMon.occupiedRegionIds[0]
            }
          }
        }

        const node = {
          difficulty: 500,
          deadline: 7,
          daysRemaining: 7,
          ...(isMonarchId && monarchData ? {
            id: monarchData.id,
            regionId: monarchRegionId,
            name: monarchData.name,
            x: 50,
            y: 50,
            status: 'active' as const,
            gateDefId: monarchData.id,
            difficultyRank: 'S' as const,
            difficulty: monarchData.recommendedCP,
            deadline: 999,
            daysRemaining: 999,
            isSGrade: true
          } : {}),
          ...(s.livingWorld?.riftNodes[nodeId] || RIFT_NODES.find((n) => n.id === nodeId))
        } as RiftNode
        if (!node) return

        const currentStatus = (s.riftNodes[nodeId] ?? node.status)
        if (currentStatus === 'cleared') return

        const updatedNodes = { ...s.riftNodes, [nodeId]: 'cleared' as RiftNodeStatus }

        // locked 노드 중 선행 노드로 이 노드를 요구하던 노드 해제 검증
        RIFT_NODES.forEach((n) => {
          const nStatus = updatedNodes[n.id] ?? n.status
          if (nStatus === 'locked' && n.requiresNodeIds?.includes(nodeId)) {
            const allReqsCleared = n.requiresNodeIds.every(
              (reqId) => updatedNodes[reqId] === 'cleared'
            )
            if (allReqsCleared) {
              updatedNodes[n.id] = 'active'
            }
          }
        })

        // livingWorld 상태 반영 (동적 생성 노드 등 반영)
        let nextLivingWorld = s.livingWorld
        if (nextLivingWorld) {
          const updatedWorldNodes = { ...nextLivingWorld.riftNodes }
          if (updatedWorldNodes[nodeId]) {
            updatedWorldNodes[nodeId] = {
              ...updatedWorldNodes[nodeId],
              status: 'cleared',
              daysRemaining: 0,
              loveCall: undefined,
              opportunity: undefined,
            }
          } else {
            updatedWorldNodes[nodeId] = {
              ...node,
              status: 'cleared',
              daysRemaining: 0,
              loveCall: undefined,
              opportunity: undefined,
            }
          }

          // livingWorld 내 locked 노드 해제
          Object.values(updatedWorldNodes).forEach((n) => {
            if (n.status === 'locked' && n.requiresNodeIds?.includes(nodeId)) {
              const allReqsCleared = n.requiresNodeIds.every(
                (reqId) => updatedWorldNodes[reqId]?.status === 'cleared'
              )
              if (allReqsCleared) {
                n.status = 'active'
              }
            }
          })

          const regionId = node.regionId
          const regionState = nextLivingWorld.regions[regionId]
          if (regionState) {
            const activeGate = s.activeWorldGate?.gateId === nodeId ? s.activeWorldGate : s.activeGate
            const relief = (activeGate && activeGate.gateId === nodeId && activeGate.runState)
              ? (activeGate.runState.contaminationRelief ?? 0)
              : 0
            
            let cleanse = Math.round(1 + Math.random() * 2)
            if (relief > 0) {
              cleanse += Math.round(relief / 5)
            }
            
            const nextCorruption = Math.max(0, regionState.corruption - cleanse)
            const nextActiveGateIds = regionState.activeGateIds.filter((id) => id !== nodeId)

            const nextRegions = {
              ...nextLivingWorld.regions,
              [regionId]: {
                ...regionState,
                corruption: nextCorruption,
                activeGateIds: nextActiveGateIds,
              },
            }

            const rName = RIFT_REGIONS.find((r) => r.id === regionId)?.name ?? regionId.toUpperCase()
            const eventLogs = [
              ...nextLivingWorld.eventLogs,
              `[Day ${nextLivingWorld.day}] ⚡ [플레이어 정화] 인류의 구원자 헌터(플레이어)가 [${rName}]의 [${node.name}] 정화에 성공했습니다! 오염의 파동이 걷히며 지역 오염도 -${cleanse}%${relief > 0 ? ` (정화 증폭 효과 +${Math.round(relief / 5)}% 반영)` : ''}`,
            ].slice(-60)

            nextLivingWorld = {
              ...nextLivingWorld,
              regions: nextRegions,
              riftNodes: updatedWorldNodes,
              eventLogs,
            }
          } else {
            // regionState가 없는 군주/Angel의 경우에도 riftNodes 상태 반영
            const eventLogs = [
              ...nextLivingWorld.eventLogs,
              `[Day ${nextLivingWorld.day}] 👑 [군주 토벌] 인류의 수호신 헌터(플레이어)가 차원의 왜곡을 이끌던 위협적인 군주 [${node.name}] 토벌에 마침내 성공했습니다! 대지가 안정을 되찾고 어둠의 통로가 봉인되었습니다.`,
            ].slice(-60)
            
            nextLivingWorld = {
              ...nextLivingWorld,
              riftNodes: updatedWorldNodes,
              eventLogs,
            }
          }

          const rName = RIFT_REGIONS.find((r) => r.id === regionId)?.name ?? regionId.toUpperCase()
          // [NEW] 플레이어 공략 완료 구조화 이벤트 생성 및 수렴
          const newEvent: WorldEvent = isMonarchId
            ? {
                id: `evt-player-defeat-${nextLivingWorld.day}-${nodeId}-${Math.floor(Math.random() * 100000)}`,
                day: nextLivingWorld.day,
                type: 'defeated',
                severity: 'critical',
                title: nodeId === 'angel' ? '최종 결전 승리' : '군주 격퇴',
                body: nodeId === 'angel'
                  ? '지고의 심판자가 마침내 플레이어 앞에 무릎을 꿇었습니다. 세계선에 정지되었던 거대한 운명의 수레바퀴가 소리 없이 굴러갑니다.'
                  : `인류의 위대한 전설 플레이어가 군주 [${node.name}]을(를) 격퇴하며 참극의 굴레를 끊었습니다!`,
                regionId: node.regionId || 'kr',
                monarchId: nodeId,
                cinematic: true,
                quote: nodeId === 'angel' ? '"내 빛이 다하는구나. 너는 다른 길을 볼 수 있을 것인가..."' : `"${node.name}의 봉인 해제... 격퇴 성공."`,
                subtitle: nodeId === 'angel' ? 'ULTIMATE JUDGEMENT CLEARED' : 'MONARCH DEFEATED BY PLAYER'
              }
            : {
                id: `evt-player-clear-${nextLivingWorld.day}-${nodeId}-${Math.floor(Math.random() * 100000)}`,
                day: nextLivingWorld.day,
                type: 'defeated',
                severity: 'minor',
                title: '균열 정화',
                body: `플레이어가 [${rName}]의 [${node.name}] 게이트 깊숙이 침투하여 정화 코어를 성공적으로 봉인했습니다.`,
                regionId: node.regionId || 'kr',
                cinematic: false,
                quote: `"${node.name} 정화 완료. 잔존 오염 수준 안정화."`,
                subtitle: 'PLAYER REGIONAL SEPARATION'
              }

          const currentEvents = nextLivingWorld.recentEvents ? [...nextLivingWorld.recentEvents] : []
          currentEvents.push(newEvent)
          if (currentEvents.length > 60) {
            currentEvents.shift()
          }
          nextLivingWorld = {
            ...nextLivingWorld,
            recentEvents: currentEvents
          }
        }

        set({
          riftNodes: updatedNodes,
          livingWorld: nextLivingWorld,
          messages: [
            ...s.messages,
            {
              id: uid(),
              kind: 'info',
              title: '구역 정화 완료',
              lines: [`균열 구역 [${node.name}] 정화에 성공했습니다!`],
              createdAt: todayISO(),
            },
          ],
        })
      },

      setActiveGate: (gate) => set({ activeGate: gate, activeRiftNodeId: gate ? get().activeRiftNodeId : undefined }),

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
            activeRiftNodeId: undefined,
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
        
        const rawGrade = s.hunterGrade?.currentGrade || (s.hunter.rank === 'National' ? 'NATIONAL' : s.hunter.rank) || 'E'
        const hunterGateRank = (rawGrade === 'NATIONAL' ? 'S' : rawGrade) as GateRank
        const hunterRankGates = GATE_DEFINITIONS.filter(g => g.rank === hunterGateRank)

        const candidates =
          source === 'daily_completion'
            ? hunterRankGates
            : source === 'daily_open'
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

      spawnGate: (gateId: string, source: 'random' | 'dungeon_clear' | 'event' | 'worldmap', helperHunterIds?: string[], customGateDef?: any) => {
        const s = get()
        const helperFilter = source === 'worldmap'
          ? filterWorldHelperHunterIds(s, helperHunterIds)
          : { allowedIds: helperHunterIds ?? [], rejectedHunters: [] as NamedHunter[] }
        const allowedHelperHunterIds = helperFilter.allowedIds
        const currentRenownTier = source === 'worldmap' ? getCurrentRenownTier(s) : undefined
        // 1. 이미 activeGate가 존재하며 active인 경우 중복 생성을 즉시 차단
        if (source === 'worldmap') {
          if (s.activeWorldGate && s.activeWorldGate.status === 'active') return
        } else {
          if (s.activeGate && s.activeGate.status === 'active') return
        }

        // 2. 군주/Angel defeated/cleared/ending victory 상태에서는 게이트 및 출현 알림 생성을 차단
        const isMonarchId = MONARCHS.some(m => m.id === gateId) || gateId === 'angel'
        if (isMonarchId) {
          if (gateId === 'angel') {
            if (s.livingWorld?.endingState === 'victory') {
              return
            }
          } else {
            if (s.livingWorld?.activeMonarchs) {
              const activeMonarch = s.livingWorld.activeMonarchs.find(m => m.monarchId === gateId)
              const isDefeated = !activeMonarch || activeMonarch.status === 'defeated' || activeMonarch.occupiedRegionIds.length === 0
              if (isDefeated) {
                return
              }
            }
          }
        }

        // 3. 이미 cleared된 상태의 게이트/노드이면 생성 차단
        if (s.riftNodes[gateId] === 'cleared' || (s.livingWorld?.riftNodes[gateId]?.status === 'cleared')) {
          return
        }

        const gate = customGateDef || GATE_DEFINITIONS.find(g => g.id === gateId)
        if (!gate) return

        let enrichedGateDef = gate
        if (source === 'worldmap' && s.livingWorld) {
          const node = s.livingWorld.riftNodes[gateId] || RIFT_NODES.find(n => n.id === gateId)
          const region = node ? s.livingWorld.regions[node.regionId] : undefined
          enrichedGateDef = {
            ...gate,
            regionId: node?.regionId || 'kr',
            subRegionId: node?.subRegionId || node?.regionId || 'default',
            daysRemaining: node?.daysRemaining,
            contamination: region?.corruption ?? 0,
            hasHelpers: allowedHelperHunterIds.length > 0,
            helperHunterCount: allowedHelperHunterIds.length,
            isWorldNode: true
          }
        }

        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setHours(expiresAt.getHours() + gate.expiresInHours)

        const seed = `${gate.id}-${Date.now()}-${Math.floor(Math.random() * 100000)}`
        const runState = generateGateRunState(gate.id, seed, undefined, enrichedGateDef)

        // 12-40F: 현실 준비도 보너스를 게이트 런 보상 배율에 적용
        const dp = s.dailyProgression
        if (dp && dp.dateKey === getActivePlanDateKey(s.quests)) {
          // 보상 배율에 daily progression 보너스 가산
          if (dp.gateRewardBonus > 0) {
            runState.rewardMultiplier = parseFloat(
              (runState.rewardMultiplier * (1 + dp.gateRewardBonus)).toFixed(3)
            )
          }
          // 레드 게이트 불안정성 저항 주입 (hunter 필드 임시 반영)
          if (dp.redGateResistBonus > 0 && runState.redGateState) {
            // instabilityScore를 직접 낮춰 레드 게이트 발동 확률 감소
            runState.redGateState.instabilityScore = Math.max(
              0,
              (runState.redGateState.instabilityScore ?? 0) - Math.round(dp.redGateResistBonus * 40)
            )
          }
        }

        const gateData = {
          instanceId: `gate-${gate.id}-${Date.now()}`,
          gateId: gate.id,
          spawnedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          status: 'active' as const,
          source,
          runState,
          helperHunterIds: allowedHelperHunterIds,
          customGateDef: enrichedGateDef,
        }

        if (source === 'worldmap') {
          const baseMessages = appendRejectedHelperMessage(
            s.messages,
            helperFilter.rejectedHunters,
            currentRenownTier?.maxHelperRank ?? 'D'
          )
          set({
            activeWorldGate: gateData,
            messages: appendMessageOnce(baseMessages, {
              id: uid(),
              kind: 'info',
              title: '게이트 출현',
              lines: [
                `[${gate.name}]이(가) 열렸습니다. (던전 런 탑재)`,
                ...(dp && dp.overallReadiness >= 15 ? [`현실 준비도 ${dp.overallReadiness}% — 보상 +${Math.round(dp.gateRewardBonus * 100)}%`] : [])
              ],
              createdAt: todayISO(),
            }),
          })
        } else {
          set({
            activeGate: gateData,
            messages: appendMessageOnce(s.messages, {
              id: uid(),
              kind: 'info',
              title: '게이트 출현',
              lines: [
                `[${gate.name}]이(가) 열렸습니다. (던전 런 탑재)`,
                ...(dp && dp.overallReadiness >= 15 ? [`현실 준비도 ${dp.overallReadiness}% — 보상 +${Math.round(dp.gateRewardBonus * 100)}%`] : [])
              ],
              createdAt: todayISO(),
            }),
          })
        }
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
        const activeGate = (s.activeWorldGate && s.activeWorldGate.status === 'active') ? s.activeWorldGate : s.activeGate
        if (!activeGate || activeGate.status !== 'active') return

        let gate = GATE_DEFINITIONS.find(g => g.id === activeGate.gateId)
        if (!gate) {
          const isMonarchId = MONARCHS.some(m => m.id === activeGate.gateId) || activeGate.gateId === 'angel'
          if (isMonarchId) {
            const monarchData = activeGate.gateId === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === activeGate.gateId)!
            gate = {
              id: activeGate.gateId,
              name: monarchData.name,
              description: `${monarchData.name}과의 결전입니다.`,
              rank: 'S',
              recommendedLevel: 80,
              recommendedPower: monarchData.recommendedCP,
              monsterIds: [activeGate.gateId],
              rewardTableId: 'reward-gate-s-basic',
              failPenaltyId: 'penalty-gate-basic',
              expiresInHours: 720,
            }
          } else {
            const node = s.livingWorld?.riftNodes[activeGate.gateId]
            if (node) {
              const rank = node.difficultyRank || 'D'
              const recommendedPower = node.difficulty || 1000
              
              let monsterIds = ['lazy-goblin']
              if (rank === 'E') monsterIds = ['rift-rat', 'rift-stray']
              else if (rank === 'D') monsterIds = ['lazy-goblin', 'sloth-brute']
              else if (rank === 'C') monsterIds = ['forgetting-warden', 'fatigue-warden']
              else if (rank === 'B') monsterIds = ['memory-tracker', 'memory-scout']
              else if (rank === 'A') monsterIds = ['greed-warden', 'memory-scout']
              else if (rank === 'S' || rank === 'National') monsterIds = ['forgetting-warden', 'greed-warden']

              gate = {
                id: activeGate.gateId,
                name: node.name || '심연의 균열',
                description: `${node.name || '심연의 균열'}의 정화 작전입니다.`,
                rank: (rank === 'National' ? 'S' : rank),
                recommendedLevel: rank === 'E' ? 5 : rank === 'D' ? 15 : rank === 'C' ? 30 : rank === 'B' ? 45 : rank === 'A' ? 60 : 80,
                recommendedPower: recommendedPower,
                monsterIds: monsterIds,
                rewardTableId: `reward-gate-${(rank === 'National' ? 's' : rank).toLowerCase()}-basic` || 'reward-gate-d-basic',
                failPenaltyId: 'penalty-gate-basic',
                expiresInHours: 72,
              }
            }
          }
        }
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

        const activeEncounter = activeGate.runState?.encounters[activeGate.runState.currentEncounterIndex]
        const targetMonsterIds = activeEncounter?.monsterIds ?? gate.monsterIds
        const monsters = targetMonsterIds
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
        const activeJobId = s.hunter.activeJobId || s.hunter.jobId
        const jobLevel = s.hunter.jobs?.[activeJobId]?.level ?? 1
        const playerSkills = getPlayerCombatSkills({
          jobId: activeJobId,
          jobLevel,
          equippedItems,
          allSkills: SKILL_DEFINITIONS,
        })
        const playerStats = calculatePlayerCombatStats({
          level: s.hunter.level,
          stats: combatStatsWithShadows,
          equippedItems,
          activeConsumableEffects: s.activeConsumableEffects,
          jobId: activeJobId,
          skills: playerSkills,
        })

        const monsterSkillIds = new Set(monsters.flatMap(monster => monster.skillIds))
        const monsterSkills = SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && monsterSkillIds.has(skill.id))
        const skills = [...playerSkills, ...monsterSkills]
        const gateSuccessBonus = getActiveGateSuccessBonus(s.activeConsumableEffects)
        const initialActiveEffects = createGateSuccessCombatEffects(gateSuccessBonus, 'player')

        // activeGate.source === 'worldmap' 일 때 그림자 탱킹 및 협력 버프 주입!
        if (activeGate.source === 'worldmap') {
          const isMonarchId = MONARCHS.some(m => m.id === activeGate.gateId) || activeGate.gateId === 'angel'
          
          if (equippedShadows.length > 0) {
            const buffDef = Math.round(playerStats.def * WORLD_SHADOW_GUARD_DEF_FACTOR * equippedShadows.length)
            const buffEvasion = WORLD_SHADOW_GUARD_EVASION_FACTOR * equippedShadows.length
            const drValue = isMonarchId ? 0.50 : WORLD_SHADOW_GUARD_DR_FACTOR

            initialActiveEffects.push(
              {
                sourceSkillId: 'world-map-shadow-guard-def',
                kind: 'stat',
                stat: 'def',
                value: buffDef,
                remainingTurns: 999,
                targetId: 'player',
              },
              {
                sourceSkillId: 'world-map-shadow-guard-eva',
                kind: 'stat',
                stat: 'evasionRate',
                value: buffEvasion,
                remainingTurns: 999,
                targetId: 'player',
              },
              {
                sourceSkillId: 'world-map-shadow-guard-dr',
                kind: 'damage_reduction',
                value: drValue,
                remainingTurns: 999,
                targetId: 'player',
              }
            )
          }

          const helperHunterIds = activeGate.helperHunterIds || []
          let activeHelpers = []
          let helperPower = 0
          if (helperHunterIds.length > 0 && s.livingWorld) {
            for (const hid of helperHunterIds) {
              const h = s.livingWorld.namedHunters[hid]
              if (h && h.status === 'active') {
                activeHelpers.push(h)
                helperPower += h.power + (h.equipmentScore ?? 0)
              }
            }
          }
          const helperCount = activeHelpers.length

          if (helperCount > 0) {
            const buffCoopAtk = Math.round(COOP_HELP_ATK_FACTOR * helperPower)
            const buffCoopDef = Math.round(COOP_HELP_DEF_FACTOR * helperPower)
            const drCoop = Math.min(COOP_HELP_DR_CAP, COOP_HELP_DR_FACTOR * helperCount)

            if (buffCoopAtk > 0) {
              initialActiveEffects.push({
                sourceSkillId: 'world-map-coop-atk',
                kind: 'stat',
                stat: 'atk',
                value: buffCoopAtk,
                remainingTurns: 999,
                targetId: 'player',
              })
            }
            if (buffCoopDef > 0) {
              initialActiveEffects.push({
                sourceSkillId: 'world-map-coop-def',
                kind: 'stat',
                stat: 'def',
                value: buffCoopDef,
                remainingTurns: 999,
                targetId: 'player',
              })
            }
            if (drCoop > 0) {
              initialActiveEffects.push({
                sourceSkillId: 'world-map-coop-dr',
                kind: 'damage_reduction',
                value: drCoop,
                remainingTurns: 999,
                targetId: 'player',
              })
            }
          }
        }

        // activeGate.source === 'worldmap' 일 때 그림자 탱킹 및 협력 버프 주입!
        if (activeGate.source === 'worldmap') {
          const isMonarchId = MONARCHS.some(m => m.id === activeGate.gateId) || activeGate.gateId === 'angel'
          
          if (equippedShadows.length > 0) {
            const buffDef = Math.round(playerStats.def * WORLD_SHADOW_GUARD_DEF_FACTOR * equippedShadows.length)
            const buffEvasion = WORLD_SHADOW_GUARD_EVASION_FACTOR * equippedShadows.length
            const drValue = isMonarchId ? 0.50 : WORLD_SHADOW_GUARD_DR_FACTOR

            initialActiveEffects.push(
              {
                sourceSkillId: 'world-map-shadow-guard-def',
                kind: 'stat',
                stat: 'def',
                value: buffDef,
                remainingTurns: 999,
                targetId: 'player',
              },
              {
                sourceSkillId: 'world-map-shadow-guard-eva',
                kind: 'stat',
                stat: 'evasionRate',
                value: buffEvasion,
                remainingTurns: 999,
                targetId: 'player',
              },
              {
                sourceSkillId: 'world-map-shadow-guard-dr',
                kind: 'damage_reduction',
                value: drValue,
                remainingTurns: 999,
                targetId: 'player',
              }
            )
          }

          const helperHunterIds = activeGate.helperHunterIds || []
          let activeHelpers = []
          let helperPower = 0
          if (helperHunterIds.length > 0 && s.livingWorld) {
            for (const hid of helperHunterIds) {
              const h = s.livingWorld.namedHunters[hid]
              if (h && h.status === 'active') {
                activeHelpers.push(h)
                helperPower += h.power + (h.equipmentScore ?? 0)
              }
            }
          }
          const helperCount = activeHelpers.length

          if (helperCount > 0) {
            const buffCoopAtk = Math.round(COOP_HELP_ATK_FACTOR * helperPower)
            const buffCoopDef = Math.round(COOP_HELP_DEF_FACTOR * helperPower)
            const drCoop = Math.min(COOP_HELP_DR_CAP, COOP_HELP_DR_FACTOR * helperCount)

            if (buffCoopAtk > 0) {
              initialActiveEffects.push({
                sourceSkillId: 'world-map-coop-atk',
                kind: 'stat',
                stat: 'atk',
                value: buffCoopAtk,
                remainingTurns: 999,
                targetId: 'player',
              })
            }
            if (buffCoopDef > 0) {
              initialActiveEffects.push({
                sourceSkillId: 'world-map-coop-def',
                kind: 'stat',
                stat: 'def',
                value: buffCoopDef,
                remainingTurns: 999,
                targetId: 'player',
              })
            }
            if (drCoop > 0) {
              initialActiveEffects.push({
                sourceSkillId: 'world-map-coop-dr',
                kind: 'damage_reduction',
                value: drCoop,
                remainingTurns: 999,
                targetId: 'player',
              })
            }
          }
        }

        const combatLog = simulateGateWaveBattle({
          playerName: s.hunter.name || '헌터',
          playerStats,
          monsters,
          skills,
          equippedShadows,
          gateInstanceId: activeGate.instanceId,
          initialActiveEffects,
          pressureSnapshot: activeGate.runState?.pressureSnapshot,
          isRedGate: Boolean(activeGate.runState?.redGateState && (activeGate.runState.redGateState.status === 'opened' || activeGate.runState.redGateState.status === 'cleared')),
          difficultyMod: activeGate.runState?.difficultyMod,
          isPromotionExam: activeGate.runState?.isPromotionExam,
          targetGrade: activeGate.runState?.targetGrade,
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

        const isWorldMap = activeGate.source === 'worldmap'
        set({
          hunter: nextHunter,
          items: nextItems,
          ownedShadows: nextOwnedShadows,
          gateStatus: nextGateStatus,
          ...(isWorldMap ? { activeWorldGate: nextActiveGate } : { activeGate: nextActiveGate }),
          activeConsumableEffects: nextConsumables,
          combatLogs: [finalLog, ...s.combatLogs].slice(0, 20),
          // Gate battle outcome is revealed in GatePanel one log line at a time.
          // Pushing result modals here would spoil the combat reveal immediately.
          messages: [...s.messages, ...newMessages],
        })

        if (activeGate.source === 'worldmap') {
          get().resolveWorldGateBattleOutcome(activeGate, gate, finalLog)
        }

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

      resolveDirectGateBattle: (combatLog) => {
        const s = get()
        const activeGate = (s.activeWorldGate && combatLog.gateInstanceId === s.activeWorldGate.instanceId)
          ? s.activeWorldGate
          : s.activeGate
        if (!activeGate || activeGate.status !== 'active') return
        if (combatLog.gateInstanceId !== activeGate.instanceId) return

        let gate = GATE_DEFINITIONS.find(g => g.id === activeGate.gateId)
        if (!gate) {
          const isMonarchId = MONARCHS.some(m => m.id === activeGate.gateId) || activeGate.gateId === 'angel'
          if (isMonarchId) {
            const monarchData = activeGate.gateId === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === activeGate.gateId)!
            gate = {
              id: activeGate.gateId,
              name: monarchData.name,
              description: `${monarchData.name}과의 결전입니다.`,
              rank: 'S',
              recommendedLevel: 80,
              recommendedPower: monarchData.recommendedCP,
              monsterIds: [activeGate.gateId],
              rewardTableId: 'reward-gate-s-basic',
              failPenaltyId: 'penalty-gate-basic',
              expiresInHours: 720,
            }
          } else {
            const node = s.livingWorld?.riftNodes[activeGate.gateId]
            if (node) {
              const rank = node.difficultyRank || 'D'
              const recommendedPower = node.difficulty || 1000
              
              let monsterIds = ['lazy-goblin']
              if (rank === 'E') monsterIds = ['rift-rat', 'rift-stray']
              else if (rank === 'D') monsterIds = ['lazy-goblin', 'sloth-brute']
              else if (rank === 'C') monsterIds = ['forgetting-warden', 'fatigue-warden']
              else if (rank === 'B') monsterIds = ['memory-tracker', 'memory-scout']
              else if (rank === 'A') monsterIds = ['greed-warden', 'memory-scout']
              else if (rank === 'S' || rank === 'National') monsterIds = ['forgetting-warden', 'greed-warden']

              gate = {
                id: activeGate.gateId,
                name: node.name || '심연의 균열',
                description: `${node.name || '심연의 균열'}의 정화 작전입니다.`,
                rank: (rank === 'National' ? 'S' : rank),
                recommendedLevel: rank === 'E' ? 5 : rank === 'D' ? 15 : rank === 'C' ? 30 : rank === 'B' ? 45 : rank === 'A' ? 60 : 80,
                recommendedPower: recommendedPower,
                monsterIds: monsterIds,
                rewardTableId: `reward-gate-${(rank === 'National' ? 's' : rank).toLowerCase()}-basic` || 'reward-gate-d-basic',
                failPenaltyId: 'penalty-gate-basic',
                expiresInHours: 72,
              }
            }
          }
        }
        if (!gate) return

        const isExam = activeGate.runState?.isPromotionExam
        const redGateStatus = activeGate.runState?.redGateState?.status
        const isActiveRedGate = redGateStatus === 'opened' || redGateStatus === 'cleared'
        const finalSourceLog: CombatLog = {
          ...combatLog,
          result: combatLog.result === 'victory' ? 'victory' : (combatLog.result === 'defeat' ? 'defeat' : 'draw'),
          source: isExam ? 'promotion_exam' : (isActiveRedGate ? 'red_gate' : 'gate'),
        }

        // 하드코어 사망 감지 시 즉시 리셋 처리 후 반환 (이중 set 방지)
        if (shouldHardcoreResetForCombat(s, finalSourceLog)) {
          set(createHardcoreDeathResetState(s, 'player_death', gate.name))
          return
        }

        let addedSignals: string[] = []
        if (combatLog.result === 'victory') {
          const equippedItems = getEquippedItems(s.items, s.equipment)
          const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
          const shadowStatBonuses = getEquippedShadowStatBonuses(equippedShadows)
          const combatStatsWithShadows = { ...s.hunter.stats }
          for (const [stat, value] of Object.entries(shadowStatBonuses)) {
            combatStatsWithShadows[stat as StatKey] = roundStatValue(combatStatsWithShadows[stat as StatKey] + (value ?? 0))
          }
          const activeJobId = s.hunter.activeJobId || s.hunter.jobId
          const jobLevel = s.hunter.jobs?.[activeJobId]?.level ?? 1
          const playerSkills = getPlayerCombatSkills({
            jobId: activeJobId,
            jobLevel,
            equippedItems,
            allSkills: SKILL_DEFINITIONS,
          })
          const playerStats = calculatePlayerCombatStats({
            level: s.hunter.level,
            stats: combatStatsWithShadows,
            equippedItems,
            activeConsumableEffects: s.activeConsumableEffects,
            jobId: activeJobId,
            skills: playerSkills,
          })
          const maxHp = playerStats.maxHp
          const remainingHp = combatLog.playerHpRemaining
          const hpPercent = maxHp > 0 ? remainingHp / maxHp : 1
          const isBoss = gate.rank === 'S' || gate.rewardTableId?.includes('boss')
          if (hpPercent <= 0.15) {
            if (isBoss) {
              addedSignals.push('low-hp-boss-victory')
            } else {
              addedSignals.push('low-hp-victory')
            }
          }
          if ((combatLog.totalTurns || 0) >= 20) {
            addedSignals.push('long-battle-victory')
          }
        }

        const updatedSignals = Array.from(new Set([...(s.hunter.hiddenSignalKeys || []), ...addedSignals]))

        const gateStatus = clearExpiredGateInjury(s.gateStatus)
        const outcome = createGateBattleOutcomeUpdate(
          s,
          activeGate,
          gate,
          gateStatus,
          {
            ...combatLog,
            result: combatLog.result === 'victory' ? 'victory' : (combatLog.result === 'defeat' ? 'defeat' : 'draw'),
            source: 'gate',
          }
        )

        let nextHunter = (outcome.state as any).hunter || s.hunter
        addedSignals.forEach(sig => {
          nextHunter = addHiddenSignalToState(nextHunter, sig)
        })

        const isWorldMap = activeGate.source === 'worldmap'
        const stateUpdate = { ...outcome.state }
        if (isWorldMap) {
          stateUpdate.activeWorldGate = stateUpdate.activeGate
          delete stateUpdate.activeGate
        }

        set({
          ...stateUpdate,
          hunter: nextHunter
        })
        set(current => applyChallengeProgress(current, {
          gateAttempt: true,
          gateVictory: combatLog.result === 'victory',
        }))

        if (activeGate.source === 'worldmap') {
          const isLastWave = activeGate.runState
            ? (activeGate.runState.currentEncounterIndex === activeGate.runState.encounters.length - 1)
            : true;
          if (combatLog.result === 'victory') {
            if (isLastWave) {
              get().resolveWorldGateBattleOutcome(activeGate, gate, combatLog)
            }
          } else {
            get().resolveWorldGateBattleOutcome(activeGate, gate, combatLog)
          }
        }

        // 12-41B: 게이트 최종 클리어 성공 연계 및 승급 후킹
        if (combatLog.result === 'victory' && outcome.state.activeGate?.status === 'cleared') {
          get().checkGateClearHooks(activeGate.gateId, true)
        }
        if (outcome.shouldCheckUnlocks || addedSignals.length > 0) {
          setTimeout(() => {
            get().checkTitleUnlocks()
            get().checkJobAwakening()
          }, 0)
        }
      },

      resolveGateEchoBattle: (echoId, combatLog) => {
        const s = get()
        const hardcore = ensureHardcoreState(s.hardcoreState)
        const echo = getActiveGateEchoes(hardcore).find(item => item.id === echoId)
        if (!echo) return
        const echoLog: CombatLog = { ...combatLog, source: 'echo' }
        if (shouldHardcoreResetForCombat(s, echoLog)) {
          set(createHardcoreDeathResetState(s, 'gate_echo_player_death', echo.name))
          return
        }
        
        let nextShadows = s.ownedShadows ?? []
        const collapsed: OwnedShadow[] = []
        if (shouldApplyShadowCollapse(echoLog.source) && echoLog.shadowCasualtyIds && echoLog.shadowCasualtyIds.length > 0) {
          const casualtySet = new Set(echoLog.shadowCasualtyIds)
          nextShadows = nextShadows.map(shadow => {
            if (casualtySet.has(shadow.instanceId)) {
              const updated = {
                ...shadow,
                collapsed: true,
                status: 'collapsed' as const,
                collapsedAt: Date.now(),
                collapseReason: 'echo_battle',
                restoreCost: shadowRestoreCost(shadow),
              }
              collapsed.push(updated)
              return updated
            }
            return shadow
          })
        }

        const isVictory = echoLog.result === 'victory'
        const nextEchoes = hardcore.gateEchoes.map(item =>
          item.id === echoId && isVictory
            ? { ...item, status: 'cleared' as const, clearedAt: Date.now() }
            : item
        )
        const nextThreat = isVictory
          ? Math.max(0, hardcore.worldThreat - 8 - echo.strengthLevel * 3)
          : Math.min(100, hardcore.worldThreat + 5)
        const stillActive = nextEchoes.some(item => item.status === 'active')
        const messages: SystemMessage[] = [{
          id: uid(),
          kind: isVictory ? 'quest' : 'info',
          title: isVictory ? 'Gate Echo cleared' : 'Gate Echo remains',
          lines: isVictory
            ? [stillActive ? '남은 Echo를 먼저 정화해야 합니다.' : '주요 행동 제한이 해제되었습니다.']
            : ['정비 후 Echo 정화에 다시 도전할 수 있습니다.'],
          createdAt: todayISO(),
        }]
        if (collapsed.length > 0) {
          messages.push({
            id: uid(),
            kind: 'shadow',
            title: '그림자 붕괴',
            lines: collapsed.map(shadow => `${shadow.name}: 복원 비용 그림자 정수 ${shadow.restoreCost}`),
            createdAt: todayISO(),
          })
        }

        set(applySecretProgressEvent(s, { context: 'gate', outcome: isVictory ? 'victory' : 'defeat' }, {
          hardcoreState: {
            ...hardcore,
            gateEchoes: compactGateEchoHistory(nextEchoes),
            worldThreat: nextThreat,
          },
          ownedShadows: nextShadows,
          equippedShadowIds: getValidEquippedShadowIds(nextShadows, s.equippedShadowIds, s.hunter),
          combatLogs: [echoLog, ...s.combatLogs].slice(0, 20),
          messages: [...s.messages, ...messages],
          manualBattleSession: undefined,
        }))
      },

      finalizeHardcoreDeathFromSession: () => {
        const s = get()
        const session = s.manualBattleSession
        if (session && shouldTriggerHardcoreDeathFromSession(s, session)) {
          set(createManualSessionDeathResetState(s, session, 'player_death', session.gateName))
        }
      },

      restoreShadowFromCollapse: (shadowId) => {
        const s = get()
        const shadow = (s.ownedShadows ?? []).find(sh => sh.instanceId === shadowId)
        if (!shadow || !shadow.collapsed) return
        const cost = shadow.restoreCost ?? shadowRestoreCost(shadow)
        if ((s.shadowEssence ?? 0) < cost) {
          set({
            messages: [...s.messages, {
              id: uid(),
              kind: 'info',
              title: '그림자 복원 실패',
              lines: ['그림자 정수가 부족합니다.'],
              createdAt: todayISO(),
            }]
          })
          return
        }
        set({
          shadowEssence: (s.shadowEssence ?? 0) - cost,
          ownedShadows: (s.ownedShadows ?? []).map(sh =>
            sh.instanceId === shadowId
              ? { ...sh, collapsed: false, status: 'active' as const, collapsedAt: undefined, restoreCost: undefined }
              : sh
          ),
          messages: [...s.messages, {
            id: uid(),
            kind: 'info',
            title: '그림자 복원',
            lines: [`[${shadow.name}] 그림자를 복원했습니다.`],
            createdAt: todayISO(),
          }]
        })
      },

      crystallizeCollapsedShadow: (shadowId) => {
        const s = get()
        const shadow = (s.ownedShadows ?? []).find(sh => sh.instanceId === shadowId)
        if (!shadow) return
        const refund = Math.max(10, Math.floor((shadow.restoreCost ?? shadowRestoreCost(shadow)) * 0.25))
        const originalAssigned = s.shadowAutoSweepState?.assignedShadowIds ?? []
        const nextAssigned = originalAssigned.filter(id => id !== shadowId)
        set({
          shadowEssence: (s.shadowEssence ?? 0) + refund,
          ownedShadows: (s.ownedShadows ?? []).filter(sh => sh.instanceId !== shadowId),
          equippedShadowIds: (s.equippedShadowIds ?? []).filter(id => id !== shadowId),
          shadowAutoSweepState: s.shadowAutoSweepState ? {
            ...s.shadowAutoSweepState,
            assignedShadowIds: nextAssigned
          } : undefined,
          messages: [...s.messages, {
            id: uid(),
            kind: 'info',
            title: '그림자 정수화',
            lines: [`[${shadow.name}] 그림자를 정수화하여 그림자 정수 +${refund}를 획득했습니다.`],
            createdAt: todayISO(),
          }]
        })
      },

      startManualGateBattle: (gateId) => {
        const s = get()
        const activeGate = (s.activeWorldGate && s.activeWorldGate.gateId === gateId)
          ? s.activeWorldGate
          : s.activeGate
        if (!activeGate || activeGate.status !== 'active') return
        if (gateId && activeGate.gateId !== gateId) return

        let gate = GATE_DEFINITIONS.find(g => g.id === activeGate.gateId)
        if (!gate) {
          const isMonarchId = MONARCHS.some(m => m.id === activeGate.gateId) || activeGate.gateId === 'angel'
          if (isMonarchId) {
            const monarchData = activeGate.gateId === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === activeGate.gateId)!
            gate = {
              id: activeGate.gateId,
              name: monarchData.name,
              description: `${monarchData.name}과의 결전입니다.`,
              rank: 'S',
              recommendedLevel: 80,
              recommendedPower: monarchData.recommendedCP,
              monsterIds: [activeGate.gateId],
              rewardTableId: 'reward-gate-s-basic',
              failPenaltyId: 'penalty-gate-basic',
              expiresInHours: 720,
            }
          } else {
            const node = s.livingWorld?.riftNodes[activeGate.gateId]
            if (node) {
              const rank = node.difficultyRank || 'D'
              const recommendedPower = node.difficulty || 1000
              
              let monsterIds = ['lazy-goblin']
              if (rank === 'E') monsterIds = ['rift-rat', 'rift-stray']
              else if (rank === 'D') monsterIds = ['lazy-goblin', 'sloth-brute']
              else if (rank === 'C') monsterIds = ['forgetting-warden', 'fatigue-warden']
              else if (rank === 'B') monsterIds = ['memory-tracker', 'memory-scout']
              else if (rank === 'A') monsterIds = ['greed-warden', 'memory-scout']
              else if (rank === 'S' || rank === 'National') monsterIds = ['forgetting-warden', 'greed-warden']

              gate = {
                id: activeGate.gateId,
                name: node.name || '심연의 균열',
                description: `${node.name || '심연의 균열'}의 정화 작전입니다.`,
                rank: (rank === 'National' ? 'S' : rank),
                recommendedLevel: rank === 'E' ? 5 : rank === 'D' ? 15 : rank === 'C' ? 30 : rank === 'B' ? 45 : rank === 'A' ? 60 : 80,
                recommendedPower: recommendedPower,
                monsterIds: monsterIds,
                rewardTableId: `reward-gate-${(rank === 'National' ? 's' : rank).toLowerCase()}-basic` || 'reward-gate-d-basic',
                failPenaltyId: 'penalty-gate-basic',
                expiresInHours: 72,
              }
            }
          }
        }
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

        const activeEncounter = activeGate.runState?.encounters[activeGate.runState.currentEncounterIndex]
        const targetMonsterIds = activeEncounter?.monsterIds ?? gate.monsterIds
        const monsters = targetMonsterIds
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
        const activeJobId = s.hunter.activeJobId || s.hunter.jobId
        const jobLevel = s.hunter.jobs?.[activeJobId]?.level ?? 1
        const playerSkills = getPlayerCombatSkills({
          jobId: activeJobId,
          jobLevel,
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
          jobId: activeJobId,
          skills: playerSkills,
        })
        const gateSuccessBonus = getActiveGateSuccessBonus(s.activeConsumableEffects)
        const initialActiveEffects = createGateSuccessCombatEffects(gateSuccessBonus, 'player')
        const player = createPlayerBattleActor(s.hunter.name || 'Hunter', playerStats, allPlayerSkills)
        const isRedGate = Boolean(activeGate.runState?.redGateState && (activeGate.runState.redGateState.status === 'opened' || activeGate.runState.redGateState.status === 'cleared'))
        
        let runStateMod = activeGate.runState ? { ...activeGate.runState } : undefined
        let computedDifficultyMod = activeGate.runState?.difficultyMod ?? 1.0

        if (runStateMod && activeEncounter) {
          const isBoss = activeEncounter.isBoss || activeEncounter.type === 'boss'
          if (isBoss) {
            const bossDelta = Math.max(-0.10, Math.min(0.10, runStateMod.bossDifficultyDelta ?? 0))
            computedDifficultyMod = computedDifficultyMod * (1 + bossDelta)
          } else {
            const combatDelta = Math.max(-0.15, Math.min(0.15, runStateMod.nextCombatDifficultyDelta ?? 0))
            computedDifficultyMod = computedDifficultyMod * (1 + combatDelta)
            // Consume nextCombatDifficultyDelta
            runStateMod.nextCombatDifficultyDelta = 0
          }
        }

        const monster = createMonsterBattleActor(
          monsters[0],
          activeGate.runState?.pressureSnapshot,
          isRedGate,
          computedDifficultyMod,
          activeGate.runState?.isPromotionExam,
          activeGate.runState?.targetGrade
        )

        // Apply computedDifficultyMod to the monster stats since createMonsterBattleActor in game.ts doesn't apply it
        if (computedDifficultyMod !== 1.0) {
          monster.maxHp = Math.round(monster.maxHp * computedDifficultyMod)
          monster.hp = monster.maxHp
          monster.atk = Math.round(monster.atk * computedDifficultyMod)
          monster.def = Math.round(monster.def * computedDifficultyMod)
        }

        const isWorldMap = activeGate.source === 'worldmap'
        set({
          gateStatus,
          ...(isWorldMap ? {
            activeWorldGate: runStateMod ? { ...activeGate, runState: runStateMod } : activeGate
          } : {
            activeGate: runStateMod ? { ...activeGate, runState: runStateMod } : activeGate
          }),
          manualBattleSession: {
            gateId: gate.id,
            gateName: gate.name,
            gateInstanceId: activeGate.instanceId,
            waveIndex: 0,
            turn: 1,
            maxTurns: 200,
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
            source: isWorldMap
              ? 'world_map' as const
              : (activeGate.runState?.isPromotionExam ? 'promotion_exam' as const : (isRedGate ? 'red_gate' as const : 'gate' as const)),
            difficultyMod: computedDifficultyMod,
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
        const isWorldMap = existingSession?.source === 'world_map'
        const activeGate = isWorldMap ? s.activeWorldGate : s.activeGate
        if (!existingSession || existingSession.result || !activeGate || activeGate.status !== 'active') return
        let session = existingSession

        const gate = GATE_DEFINITIONS.find(g => g.id === session.gateId)
        if (!gate) return

        const currentMonsterDef = MONSTER_DEFINITIONS.find(monster => monster.id === gate.monsterIds[session.waveIndex])
        if (!currentMonsterDef) return

        const equippedItems = getEquippedItems(s.items, s.equipment)
        const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
        const activeJobId = s.hunter.activeJobId || s.hunter.jobId
        const jobLevel = s.hunter.jobs?.[activeJobId]?.level ?? 1
        const playerSkills = getPlayerCombatSkills({
          jobId: activeJobId,
          jobLevel,
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
          const isRedGate = Boolean(activeGate.runState?.redGateState && (activeGate.runState.redGateState.status === 'opened' || activeGate.runState.redGateState.status === 'cleared'))
          const waveUpdate = appendManualWaveClearLogs({
            logs,
            monster,
            waveIndex,
            remainingMonsterIds,
            pressureSnapshot: activeGate.runState?.pressureSnapshot,
            isRedGate,
            isPromotionExam: activeGate.runState?.isPromotionExam,
            targetGrade: activeGate.runState?.targetGrade,
            difficultyMod: session.difficultyMod,
          })
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

      chooseGateRunEventChoice: (choiceId, encounterId, gateInstanceId) => {
        const s = get()
        const target = getGateRunActionTarget(s, gateInstanceId, encounterId)
        if (!target) return
        const { key: activeGateKey, activeGate } = target

        const run = copyGateRunState(activeGate.runState!)
        const currentEncounter = run.encounters[run.currentEncounterIndex]
        if (
          !currentEncounter ||
          currentEncounter.type !== 'event' ||
          currentEncounter.status !== 'available' ||
          (encounterId && currentEncounter.id !== encounterId)
        ) {
          if (import.meta.env.DEV) {
            console.warn('[GateRun] Ignored stale or invalid event choice', {
              choiceId,
              encounterId,
              currentEncounterId: currentEncounter?.id,
              currentEncounterType: currentEncounter?.type,
              currentEncounterStatus: currentEncounter?.status,
            })
          }
          return
        }

        let choice = currentEncounter.eventChoices?.find(c => c.id === choiceId)
        if (!choice) {
          // 1. 현재 encounter 실시간 재수화 복구 시도
          const hydrated = hydrateGateRunEncounterChoices(currentEncounter, activeGate)
          currentEncounter.eventChoices = hydrated.eventChoices
          currentEncounter.eventTemplateId = hydrated.eventTemplateId
          currentEncounter.title = hydrated.title
          currentEncounter.description = hydrated.description
          
          choice = currentEncounter.eventChoices?.find(c => c.id === choiceId)
          
          // 2. 템플릿 복구 실패 시 안전 fallback 우회로 동적 부여
          if (!choice) {
            if (import.meta.env.DEV) {
              console.warn('[GateRun] Missing event choice or unable to hydrate', { encounterId: currentEncounter.id, choiceId })
            }
            const fallbackChoice: GateRunEventChoice = {
              id: choiceId,
              label: '차원 마력 안정화',
              description: '불안정하게 뒤틀려 요동치던 에너지가 마력 공명에 의해 평온하게 중화되었습니다.',
              riskDelta: -5,
              immediateReward: { gold: 300, essence: 50, xp: 0, items: [] }
            }
            choice = fallbackChoice
          }
        }

        if (!choice) return

        // Validate coop/solo locks
        const isCoopActive = activeGate.helperHunterIds && activeGate.helperHunterIds.length > 0
        const isLockedByCoop = choice.requiresCoop && !isCoopActive
        const isLockedBySolo = choice.requiresSolo && isCoopActive
        if (isLockedByCoop || isLockedBySolo) {
          if (import.meta.env.DEV) {
            console.warn('[GateRun] Choice is locked by condition constraints', { choiceId, isCoopActive })
          }
          return
        }

        currentEncounter.selectedChoiceId = choiceId
        currentEncounter.status = 'cleared'
        run.clearedEncounterIds = [...run.clearedEncounterIds, currentEncounter.id]

        const finalChoice = { ...choice }
        let surpriseText = ''
        const randVal = Math.random()

        if (choiceId === 'choice_supply_open' || choiceId === 'choice_default_supply_open') {
          if (randVal < 0.25) {
            finalChoice.leadsTo = 'battle'
            finalChoice.addEncounterType = 'battle'
            if (finalChoice.immediateReward) {
              finalChoice.immediateReward = {
                ...finalChoice.immediateReward,
                gold: Math.round((finalChoice.immediateReward.gold ?? 1000) / 2)
              }
            } else {
              finalChoice.immediateReward = { gold: 500, essence: 0, xp: 0, items: [] }
            }
            surpriseText = '보급 상자를 열었으나 쇠 냄새가 섞인 기이한 침이 흐릅니다. 이계의 미믹이 이빨을 드러내며 튀어나와 덮쳐옵니다!'
          }
        } else if (choiceId === 'choice_lock_solve') {
          if (randVal < 0.40) {
            finalChoice.leadsTo = 'safe'
            finalChoice.addEncounterType = undefined
            finalChoice.immediateReward = {
              ...(finalChoice.immediateReward ?? {}),
              essence: 200,
              xp: 0,
              gold: 0,
              items: []
            }
            surpriseText = '복잡하게 얽힌 고대 룬의 정렬 주파수를 완벽하게 해독했습니다. 붉은 보호막이 부드럽게 풀리며, 깊숙이 봉인되어 있던 정수 200이 방출됩니다.'
          }
        } else if (choiceId === 'choice_merchant_threaten') {
          if (randVal < 0.40) {
            finalChoice.leadsTo = 'battle'
            finalChoice.addEncounterType = 'elite'
            surpriseText = '검은 상인이 그림자 가면 뒤에서 잔인하게 미소를 지으며 미늘창을 고쳐 쥡니다. 강력한 호위 야수를 호출합니다!'
          } else {
            finalChoice.leadsTo = 'safe'
            finalChoice.addEncounterType = undefined
            finalChoice.immediateReward = { gold: 500, essence: 200, xp: 0, items: [] }
            surpriseText = '칼날의 시퍼런 기세를 본 검은 상인이 덜덜 떨며 뒤로 물러섭니다. 그는 창고 문을 열고 귀중한 재화들을 순순히 내놓습니다.'
          }
        } else if (choiceId === 'choice_waterfall_push') {
          if (randVal < 0.30) {
            finalChoice.leadsTo = 'battle'
            finalChoice.addEncounterType = 'elite'
            surpriseText = '폭포 너머의 비밀 공간으로 뛰어들었으나, 그곳은 보물이 아니라 둥지를 지키는 강대한 야수 수호자가 매복해 있던 함정이었습니다!'
          }
        } else if (choiceId === 'choice_apothecary_drink') {
          if (randVal < 0.40) {
            finalChoice.healPercent = undefined
            finalChoice.hpCostPercent = 0
            finalChoice.riskDelta = (finalChoice.riskDelta ?? 0) + 15
            finalChoice.nextEncounterModifier = 'player_def_down_1t'
            finalChoice.immediateReward = {
              ...(finalChoice.immediateReward ?? {}),
              essence: 150,
              xp: 0,
              gold: 0,
              items: []
            }
            surpriseText = '물약을 들이켜자 내장에서 타들어 가는 마력 발열 반응이 끓어오릅니다. 다음 구역 진입 시 방어막이 교란되고 균열 위험도가 상승했지만, 그 반동으로 차원 에센스를 정제해 냈습니다.'
          }
        } else if (choiceId === 'choice_incheon_cargo_open') {
          if (randVal < 0.30) {
            finalChoice.leadsTo = 'safe'
            finalChoice.addEncounterType = undefined
            finalChoice.immediateReward = { gold: 800, essence: 150, xp: 0, items: [] }
            surpriseText = '철 컨테이너를 부수고 들어가자 괴물 대신 어마어마한 전술 금괴와 가득 쌓인 그림자 정수 결정만이 가득합니다! 안전하게 자원을 인계합니다.'
          }
        } else if (choiceId === 'choice_kr_busan_strike') {
          if (randVal < 0.30) {
            finalChoice.leadsTo = 'safe'
            finalChoice.addEncounterType = undefined
            finalChoice.immediateReward = { gold: 600, xp: 0, essence: 0, items: [] }
            surpriseText = '어두운 괴수 둥지에 기습 난입했으나, 둥지는 이미 버려진 채 텅 비어 있습니다. 바닥에 잔류해 흩어져 있던 골드 주머니만 안전하게 획득합니다.'
          }
        }

        if (finalChoice.riskDelta) {
          run.accumulatedRisk = Math.max(0, Math.min(100, run.accumulatedRisk + finalChoice.riskDelta))
        }
        if (finalChoice.rewardMultiplierDelta) {
          run.rewardMultiplier = Math.max(0.1, run.rewardMultiplier + finalChoice.rewardMultiplierDelta)
        }
        if (finalChoice.extractionBonusDelta) {
          run.extractionBonusPercent = (run.extractionBonusPercent ?? 0) + finalChoice.extractionBonusDelta
        }
        if (finalChoice.nextCombatDifficultyDelta) {
          run.nextCombatDifficultyDelta = Math.max(-0.15, Math.min(0.15, (run.nextCombatDifficultyDelta ?? 0) + finalChoice.nextCombatDifficultyDelta))
        }

        if (surpriseText) {
          run.lastEventOutcomeText = run.lastEventOutcomeText
            ? `${surpriseText}\n${run.lastEventOutcomeText}`
            : surpriseText
        }

        if (finalChoice.immediateReward) {
          const reward = finalChoice.immediateReward
          if (reward.gold) run.accumulatedRewards.gold += reward.gold
          if (reward.essence) run.accumulatedRewards.essence += reward.essence
          if (reward.xp) run.accumulatedRewards.xp += reward.xp
        }

        // Apply A-2 choices effects for worldmap nodes
        if (activeGate.source === 'worldmap') {
          const effectType = getChoiceEffectType(finalChoice)
          
          // Get rank scaling multiplier
          const gate = GATE_DEFINITIONS.find(g => g.id === run.gateId) || activeGate.customGateDef
          const rank = gate?.rank ?? 'E'
          const rankMult = rank === 'E' || rank === 'D' ? 0.6 : rank === 'C' || rank === 'B' ? 0.8 : rank === 'A' ? 1.0 : 1.3
          
          const contamination = activeGate.customGateDef?.contamination ?? 0
          const daysRemaining = activeGate.customGateDef?.daysRemaining

          let outcomeText = `선택: "${choice.label}"`
          
          switch (effectType) {
            case 'stabilize': {
              let baseDelta = 0.05 + Math.random() * 0.05
              if (contamination > 50) baseDelta *= 1.2
              if (daysRemaining !== undefined && daysRemaining <= 2) baseDelta += 0.02
              
              const delta = baseDelta * rankMult
              run.nextCombatDifficultyDelta = Math.max(-0.15, Math.min(0.15, (run.nextCombatDifficultyDelta ?? 0) - delta))
              
              outcomeText = `피난 및 대피로를 안정적으로 확보했습니다. 다음 전투 난이도가 감소합니다. (${Math.round(-delta * 100)}%)`
              break
            }
            case 'breakthrough': {
              let baseDiffDelta = 0.05 + Math.random() * 0.07
              let baseRewardDelta = 0.05 + Math.random() * 0.10
              
              if (contamination > 50) baseDiffDelta += 0.03
              if (daysRemaining !== undefined && daysRemaining <= 2) {
                baseDiffDelta += 0.04
                baseRewardDelta += 0.05
              }

              const diffDelta = baseDiffDelta * rankMult
              const rewardDelta = baseRewardDelta * rankMult

              run.nextCombatDifficultyDelta = Math.max(-0.15, Math.min(0.15, (run.nextCombatDifficultyDelta ?? 0) + diffDelta))
              run.rewardMultiplier = Math.max(0.1, Math.min(2.0, run.rewardMultiplier + rewardDelta))

              outcomeText = `균열 중심부로 무리하게 강행 돌파합니다. 다음 전투 난이도가 상승하고 보상 배율이 추가됩니다. (난이도 +${Math.round(diffDelta * 100)}%, 보상 +${Math.round(rewardDelta * 100)}%)`
              break
            }
            case 'rescue': {
              let goldBonus = Math.round(250 + Math.random() * 150)
              let essenceBonus = Math.round(50 + Math.random() * 50)
              if (daysRemaining !== undefined && daysRemaining <= 2) {
                goldBonus = Math.round(goldBonus * 1.3)
                essenceBonus = Math.round(essenceBonus * 1.3)
              }
              goldBonus = Math.round(goldBonus * rankMult)
              essenceBonus = Math.round(essenceBonus * rankMult)

              run.accumulatedRewards.gold += goldBonus
              run.accumulatedRewards.essence += essenceBonus

              const riskDelta = daysRemaining !== undefined && daysRemaining <= 2 ? 0.02 : 0.04
              run.nextCombatDifficultyDelta = Math.max(-0.15, Math.min(0.15, (run.nextCombatDifficultyDelta ?? 0) + riskDelta))

              outcomeText = `위험 지대의 고립 대원을 구출하여 물자를 입수했습니다. 다음 전투 위험도가 미세하게 증가하지만 자원을 추가 획득합니다. (골드 +${goldBonus}, 그림자 정수 +${essenceBonus})`
              break
            }
            case 'analyze': {
              let baseDelta = 0.05 + Math.random() * 0.05
              if (contamination !== undefined && contamination <= 30) baseDelta += 0.02

              const delta = baseDelta * rankMult
              run.bossDifficultyDelta = Math.max(-0.10, Math.min(0.10, (run.bossDifficultyDelta ?? 0) - delta))
              run.revealedBossHint = `보스의 불안정한 차원 마력 교란 장치를 파악했습니다. 최종 보스전의 체력/공격 계수가 ${Math.round(delta * 100)}% 약화됩니다.`

              outcomeText = `보스의 공격 주파수를 해독하여 약점을 도출했습니다. 보스전의 마력 압박이 감소합니다. (보스 난이도 -${Math.round(delta * 100)}%)`
              break
            }
            case 'coop': {
              if (isCoopActive) {
                let baseDelta = 0.06 + Math.random() * 0.06
                const delta = baseDelta * rankMult
                run.nextCombatDifficultyDelta = Math.max(-0.15, Math.min(0.15, (run.nextCombatDifficultyDelta ?? 0) - delta))
                run.rewardMultiplier = Math.max(0.1, run.rewardMultiplier - 0.03)

                const livingWorld = get().livingWorld
                let radioSenderName = '공조 헌터'
                if (livingWorld && activeGate.helperHunterIds && activeGate.helperHunterIds.length > 0) {
                  const firstHelper = livingWorld.namedHunters[activeGate.helperHunterIds[0]]
                  if (firstHelper) radioSenderName = firstHelper.name
                }
                
                run.radioLine = `${radioSenderName}: "정면 진입로는 확보했다. 우리가 엄호할 테니 안전하게 틈을 뚫고 지나가라!"`
                outcomeText = `${radioSenderName} 헌터와 연계 작전을 감행하여 위협을 격리했습니다. 다음 전투 난이도가 감소하지만 분배 규정으로 보상이 소폭 하락합니다.`
              } else {
                run.nextCombatDifficultyDelta = Math.max(-0.15, (run.nextCombatDifficultyDelta ?? 0) - 0.05)
                outcomeText = `지원 병력이 복귀하여 독자적으로 전열을 정비했습니다. 다음 전투 난이도가 소폭 완화됩니다.`
              }
              break
            }
            case 'solo': {
              const diffDelta = 0.10 * rankMult
              const rewardDelta = 0.12 * rankMult

              run.nextCombatDifficultyDelta = Math.max(-0.15, Math.min(0.15, (run.nextCombatDifficultyDelta ?? 0) + diffDelta))
              run.rewardMultiplier = Math.max(0.1, Math.min(2.0, run.rewardMultiplier + rewardDelta))

              outcomeText = `단독 기동으로 지맥 침식 속으로 직접 뛰어듭니다. 적의 포위망에 걸려 다음 전투 난이도가 크게 증가하지만, 모든 보상을 독식합니다.`
              break
            }
            case 'cleanse': {
              let baseCleanse = 12 + Math.random() * 6
              if (contamination > 50) baseCleanse *= 1.2
              const finalCleanse = Math.round(baseCleanse * rankMult)

              run.contaminationRelief = Math.max(0, Math.min(50, (run.contaminationRelief ?? 0) + finalCleanse))
              run.accumulatedRisk = Math.max(0, run.accumulatedRisk - 10)

              outcomeText = `이계의 정수 여파를 정화하여 지맥 압박을 낮추었습니다. 누적 위험도가 감소하고 최종 클리어 시 노드 오염 정화 강도가 추가 증폭됩니다.`
              break
            }
            case 'scout': {
              run.riskTags = Array.from(new Set([...(run.riskTags ?? []), '정찰완료', '시야확보']))
              let baseDelta = 0.03
              if (contamination !== undefined && contamination <= 30) baseDelta += 0.02
              
              run.nextCombatDifficultyDelta = Math.max(-0.15, (run.nextCombatDifficultyDelta ?? 0) - baseDelta)
              
              outcomeText = `봉쇄 구역 정밀 정찰에 성공했습니다. 전방 병력 배치 및 이상 왜곡 좌표를 파악하여 안정적인 전진이 가능합니다.`
              break
            }
          }
          if (surpriseText) {
            run.lastEventOutcomeText = surpriseText
          } else {
            run.lastEventOutcomeText = outcomeText
          }
        } else {
          if (surpriseText) {
            run.lastEventOutcomeText = surpriseText
          }
        }

        // Red Gate Instability 롤링 연동
        let instabilityDelta = 5 // 기본 누적치
        const choiceInstabilityMap: Record<string, number> = {
          choice_rift_force_open: 25,
          choice_trace_follow: 15,
          choice_supply_open: 10,
          choice_lock_force: 10,
          choice_contract_accept: 20,
          choice_warning_ignore: 25,
          choice_reverb_absorb: 15,
          choice_merchant_threaten: 20,
          choice_shadow_bind: 10,
          choice_storm_rush: 15,
          choice_curse_take: 25,
          choice_omen_taunt: 25,
          choice_passage_dash: 10
        }
        if (choiceId in choiceInstabilityMap) {
          instabilityDelta = choiceInstabilityMap[choiceId]
        }
        const openedRedGate = rollRedGateInstability(run, currentEncounter.id, instabilityDelta)
        if (openedRedGate) {
          setTimeout(() => {
            get().emitWorldSignal('red_gate_spawn')
          }, 0)
        }

        // leadsTo 처리 (선택지에 전개 결과 연결 및 이후 단계 시퀀스 동적 조정)
        const leadsTo = getChoiceLeadsTo(finalChoice)
        if (leadsTo === 'battle') {
          const gate = GATE_DEFINITIONS.find(g => g.id === run.gateId) || activeGate.customGateDef
          const rank = gate?.rank ?? 'E'
          const isElite = finalChoice.addEncounterType === 'elite' || (Math.random() < 0.4 && rank !== 'E')
          const encType = isElite ? 'elite' : 'battle'
          
          const difficultyMod = isElite ? 1.35 : 1.0
          const riskDelta = isElite ? 15 : 5
          const rewardMultiplier = isElite ? 1.45 : 1.25

          const gateMonsters = gate?.monsterIds ?? ['monster-goblin-scout']
          const numMonsters = isElite ? 2 : 1
          const monsterIds: string[] = []
          for (let j = 0; j < numMonsters; j++) {
            monsterIds.push(gateMonsters[Math.floor(Math.random() * gateMonsters.length)])
          }

          const stepName = '심층부'
          const title = isElite 
            ? `[${stepName}] 균열 심층 정예 전투 [ELITE]` 
            : `[${stepName}] 균열 심층 야수 격전`
          const description = isElite
            ? '균열의 힘이 강해지며 나타난 정예 몬스터가 길을 가로막습니다. 더욱 세심히 공격해 오고 있으니 각별히 유의하십시오.'
            : '어두운 차원의 틈바구니에서 강하게 날뛰는 심층 몬스터가 튀어나왔습니다! 무기를 움켜쥐십시오.'

          const newEnc: GateRunEncounter = {
            id: `enc-inserted-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: encType,
            title,
            description,
            monsterIds,
            difficultyMod,
            status: 'locked',
            isElite: isElite ? true : undefined,
            riskDelta,
            rewardMultiplier,
          }

          run.encounters.splice(run.currentEncounterIndex + 1, 0, newEnc)
          run.rewardMultiplier = Math.max(0.1, Math.min(2.0, run.rewardMultiplier + 0.15))

          if (finalChoice.addEncounterType && finalChoice.addEncounterType !== 'battle' && finalChoice.addEncounterType !== 'elite') {
            const shiftIndex = run.currentEncounterIndex + 2
            if (shiftIndex < run.encounters.length) {
              const targetEnc = run.encounters[shiftIndex]
              targetEnc.type = finalChoice.addEncounterType
              if (finalChoice.addEncounterType === 'treasure') {
                targetEnc.title = '이벤트로 발견된 보물 창고'
                targetEnc.description = '막다른 벽을 허물어 고대 보물 상자가 숨겨진 다락방을 개방했습니다!'
                targetEnc.treasureReward = { gold: 500, essence: 150 }
              } else if (finalChoice.addEncounterType === 'shadow_trace') {
                targetEnc.title = '균열의 정제된 그림자 흔적'
                targetEnc.description = '강제 개방된 균열 속에서 정교하게 정제된 그림자 흔적이 고동칩니다.'
              }
            }
          }
        } else if (leadsTo === 'safe') {
          run.encounters = run.encounters.filter((enc, index) => {
            if (index <= run.currentEncounterIndex) return true;
            if (enc.type === 'boss' || enc.isBoss) return true;
            if (enc.type === 'battle' || enc.type === 'elite') {
              return false;
            }
            return true;
          });
          run.rewardMultiplier = Math.max(0.1, run.rewardMultiplier * 0.7)
        }

        const isLast = run.currentEncounterIndex === run.encounters.length - 1
        const shouldClearWorldNode = activeGateKey === 'activeWorldGate' && isLast
        if (!isLast) {
          const nextIndex = run.currentEncounterIndex + 1
          run.currentEncounterIndex = nextIndex
          run.encounters[nextIndex].status = 'available'
          
          if (finalChoice.nextEncounterModifier) {
            run.encounters[nextIndex].specialRuleId = finalChoice.nextEncounterModifier
          }
        } else {
          run.completed = true
          
          const finalXP = run.accumulatedRewards.xp
          const finalGold = run.accumulatedRewards.gold
          const finalEssence = run.accumulatedRewards.essence
          
          const xpResult = applyXp(s.hunter, finalXP, 'challenge')
          const nextGold = (s.gold ?? 0) + finalGold
          const nextEssenceVal = (s.shadowEssence ?? 0) + finalEssence

          set({
            hunter: xpResult.hunter,
            gold: nextGold,
            shadowEssence: nextEssenceVal,
            ...gateRunTargetUpdate(activeGateKey, {
              ...activeGate,
              status: 'cleared',
              runState: run
            })
          })
          // 12-41B: 게이트 최종 클리어 성공 연계 및 승급 후킹
          get().checkGateClearHooks(activeGate.gateId, true)
        }

        if (leadsTo !== 'battle' && finalChoice.addEncounterType && run.currentEncounterIndex < run.encounters.length - 1) {
          const nextIndex = run.currentEncounterIndex
          const nextEnc = run.encounters[nextIndex]
          nextEnc.type = finalChoice.addEncounterType
          if (finalChoice.addEncounterType === 'elite') {
            nextEnc.title = '이벤트로 유도된 엘리트 구역 [ELITE]'
            nextEnc.description = '이벤트의 여파로 한층 성난 정예 파수병이 매복해 있습니다!'
            nextEnc.isElite = true
            nextEnc.difficultyMod = 1.3
            nextEnc.riskDelta = 15
            nextEnc.rewardMultiplier = 1.25
            const gate = GATE_DEFINITIONS.find(g => g.id === run.gateId)
            const gateMonsters = gate?.monsterIds ?? []
            nextEnc.monsterIds = [gateMonsters[Math.floor(Math.random() * gateMonsters.length)]]
          } else if (finalChoice.addEncounterType === 'treasure') {
            nextEnc.title = '이벤트로 발견된 보물 창고'
            nextEnc.description = '막다른 벽을 허물어 고대 보물 상자가 숨겨진 다락방을 개방했습니다!'
            nextEnc.treasureReward = { gold: 500, essence: 150 }
          }
        }

        const lines = [
          `선택: "${finalChoice.label}"`,
          stripGateChoiceOutcomeHint(finalChoice.description),
        ]
        if (finalChoice.immediateReward) {
          const rew = finalChoice.immediateReward
          if (rew.gold) lines.push(`골드 획득: +${rew.gold}`)
          if (rew.essence) lines.push(`그림자 정수 획득: +${rew.essence}`)
        }
        if (run.lastEventOutcomeText) {
          lines.push(run.lastEventOutcomeText)
        }

        set((prev) => ({
          ...gateRunTargetUpdate(activeGateKey, {
            ...(prev[activeGateKey] ?? activeGate),
            runState: run
          }),
          messages: [...prev.messages, {
            id: uid(),
            kind: 'quest',
            title: `이벤트 결정 — ${currentEncounter.title}`,
            lines,
            createdAt: todayISO(),
          }]
        }))
        if (shouldClearWorldNode) {
          get().markRiftNodeCleared(activeGate.gateId)
          set({
            activeWorldGate: undefined,
            activeRiftNodeId: undefined,
            manualBattleSession: undefined,
          })
        }
      },

      claimGateRunTreasure: (gateInstanceId) => {
        const s = get()
        const target = getGateRunActionTarget(s, gateInstanceId)
        if (!target) return
        const { key: activeGateKey, activeGate } = target

        const run = copyGateRunState(activeGate.runState!)
        const currentEncounter = run.encounters[run.currentEncounterIndex]
        if (currentEncounter.type !== 'treasure') return

        currentEncounter.status = 'cleared'
        run.clearedEncounterIds = [...run.clearedEncounterIds, currentEncounter.id]

        let goldAmt = 0
        let essAmt = 0

        if (currentEncounter.treasureReward) {
          const rewardMod = run.rewardMultiplier
          const baseGold = currentEncounter.treasureReward.gold ?? 0
          const baseEssence = currentEncounter.treasureReward.essence ?? 0
          goldAmt = Math.round(baseGold * rewardMod)
          essAmt = Math.round(baseEssence * rewardMod)
        } else {
          const gate = GATE_DEFINITIONS.find(g => g.id === run.gateId)
          const rank = gate?.rank ?? 'E'
          const baseGold = (rank === 'E' || rank === 'D') ? 400 : (rank === 'C' || rank === 'B') ? 800 : 1500
          const baseEssence = (rank === 'E' || rank === 'D') ? 100 : (rank === 'C' || rank === 'B') ? 200 : 400
          
          let rewardMod = run.rewardMultiplier
          if (run.modifierIds.includes('mod_dense_loot')) rewardMod += 0.25

          goldAmt = Math.round(baseGold * rewardMod * (0.9 + Math.random() * 0.2))
          essAmt = Math.round(baseEssence * rewardMod * (0.9 + Math.random() * 0.2))
        }

        run.accumulatedRewards.gold += goldAmt
        run.accumulatedRewards.essence += essAmt

        const isLast = run.currentEncounterIndex === run.encounters.length - 1
        const shouldClearWorldNode = activeGateKey === 'activeWorldGate' && isLast
        if (!isLast) {
          const nextIndex = run.currentEncounterIndex + 1
          run.currentEncounterIndex = nextIndex
          run.encounters[nextIndex].status = 'available'
          set({
            ...gateRunTargetUpdate(activeGateKey, {
              ...activeGate,
              runState: run
            })
          })
        } else {
          run.completed = true
          
          const finalXP = run.accumulatedRewards.xp
          const finalGold = run.accumulatedRewards.gold
          const finalEssence = run.accumulatedRewards.essence
          
          const xpResult = applyXp(s.hunter, finalXP, 'challenge')
          const nextGold = (s.gold ?? 0) + finalGold
          const nextEssenceVal = (s.shadowEssence ?? 0) + finalEssence

          set({
            hunter: xpResult.hunter,
            gold: nextGold,
            shadowEssence: nextEssenceVal,
            ...gateRunTargetUpdate(activeGateKey, {
              ...activeGate,
              status: 'cleared',
              runState: run
            })
          })
          // 12-41B: 게이트 최종 클리어 성공 연계 및 승급 후킹
          get().checkGateClearHooks(activeGate.gateId, true)
        }

        set((prev) => ({
          messages: [...prev.messages, {
            id: uid(),
            kind: 'quest',
            title: '보물 상자 개봉',
            lines: [`보물을 안전하게 회수했습니다.`, `골드 +${goldAmt}, 그림자 정수 +${essAmt} 누적`],
            createdAt: todayISO(),
          }]
        }))
        if (shouldClearWorldNode) {
          get().markRiftNodeCleared(activeGate.gateId)
          set({
            activeWorldGate: undefined,
            activeRiftNodeId: undefined,
            manualBattleSession: undefined,
          })
        }
      },

      performGateRunRest: (option, gateInstanceId) => {
        const s = get()
        const target = getGateRunActionTarget(s, gateInstanceId)
        if (!target) return
        const { key: activeGateKey, activeGate } = target

        const run = copyGateRunState(activeGate.runState!)
        const currentEncounter = run.encounters[run.currentEncounterIndex]
        if (currentEncounter.type !== 'rest') return

        currentEncounter.status = 'cleared'
        run.clearedEncounterIds = [...run.clearedEncounterIds, currentEncounter.id]

        const isLast = run.currentEncounterIndex === run.encounters.length - 1
        const shouldClearWorldNode = activeGateKey === 'activeWorldGate' && isLast
        if (!isLast) {
          const nextIndex = run.currentEncounterIndex + 1
          run.currentEncounterIndex = nextIndex
          run.encounters[nextIndex].status = 'available'
          
          if (option === 'heal') {
            run.encounters[nextIndex].specialRuleId = 'player_heal_40'
          } else if (option === 'buff') {
            run.encounters[nextIndex].specialRuleId = 'player_speed_up_1t'
          }
          set({
            ...gateRunTargetUpdate(activeGateKey, {
              ...activeGate,
              runState: run
            })
          })
        } else {
          run.completed = true
          set({
            ...gateRunTargetUpdate(activeGateKey, {
              ...activeGate,
              status: 'cleared',
              runState: run
            })
          })
        }

        let optLabel = ''
        if (option === 'heal') optLabel = '체력 회복 조치 (다음 전투 체력 가산 버프)'
        if (option === 'buff') optLabel = '신속 마법 부여 (다음 전투 속도 가산)'
        if (option === 'cooldown') optLabel = '정신 집중 (안정감 고양)'

        set((prev) => ({
          messages: [...prev.messages, {
            id: uid(),
            kind: 'quest',
            title: '안전지대 휴식 완료',
            lines: [`휴식 옵션 선택: [${optLabel}]`, `피로가 해소되고 정신이 맑아집니다.`],
            createdAt: todayISO(),
          }]
        }))
        if (shouldClearWorldNode) {
          get().markRiftNodeCleared(activeGate.gateId)
          set({
            activeWorldGate: undefined,
            activeRiftNodeId: undefined,
            manualBattleSession: undefined,
          })
        }
      },

      absorbGateRunShadowTrace: (gateInstanceId) => {
        const s = get()
        const target = getGateRunActionTarget(s, gateInstanceId)
        if (!target) return
        const { key: activeGateKey, activeGate } = target

        const run = copyGateRunState(activeGate.runState!)
        const currentEncounter = run.encounters[run.currentEncounterIndex]
        if (currentEncounter.type !== 'shadow_trace') return

        currentEncounter.status = 'cleared'
        run.clearedEncounterIds = [...run.clearedEncounterIds, currentEncounter.id]

        run.extractionBonusPercent = (run.extractionBonusPercent ?? 0) + 6

        const isLast = run.currentEncounterIndex === run.encounters.length - 1
        const shouldClearWorldNode = activeGateKey === 'activeWorldGate' && isLast
        if (!isLast) {
          const nextIndex = run.currentEncounterIndex + 1
          run.currentEncounterIndex = nextIndex
          run.encounters[nextIndex].status = 'available'
          set({
            ...gateRunTargetUpdate(activeGateKey, {
              ...activeGate,
              runState: run
            })
          })
        } else {
          run.completed = true
          set({
            ...gateRunTargetUpdate(activeGateKey, {
              ...activeGate,
              status: 'cleared',
              runState: run
            })
          })
          // 12-41B: 게이트 최종 클리어 성공 연계 및 승급 후킹
          get().checkGateClearHooks(activeGate.gateId, true)
        }

        set((prev) => ({
          messages: [...prev.messages, {
            id: uid(),
            kind: 'shadow',
            title: '그림자 흔적 정화 완료',
            lines: [`그림자의 불꽃이 헌터의 영혼에 흡수되었습니다.`, `그림자 추출 공명 보정률 +6% 누적 적용`],
            createdAt: todayISO(),
          }]
        }))
        if (shouldClearWorldNode) {
          get().markRiftNodeCleared(activeGate.gateId)
          set({
            activeWorldGate: undefined,
            activeRiftNodeId: undefined,
            manualBattleSession: undefined,
          })
        }
      },

      abandonGateRun: (gateInstanceId) => {
        const s = get()
        const target = getGateRunActionTarget(s, gateInstanceId)
        if (!target) return
        const { key: activeGateKey, activeGate } = target

        const run = copyGateRunState(activeGate.runState!)
        run.failed = true
        
        const earnedGold = run.accumulatedRewards.gold
        const earnedEssence = run.accumulatedRewards.essence
        const nextGold = (s.gold ?? 0) + earnedGold
        const nextEssenceVal = (s.shadowEssence ?? 0) + earnedEssence

        const isExam = run.isPromotionExam
        const examTarget = run.targetGrade

        const nextHunterGrade = (isExam && examTarget && s.hunterGrade?.pendingExam) 
          ? {
              ...s.hunterGrade,
              pendingExam: {
                ...s.hunterGrade.pendingExam,
                status: 'available' as const,
              }
            }
          : s.hunterGrade

        set({
          gold: nextGold,
          shadowEssence: nextEssenceVal,
          ...gateRunTargetUpdate(activeGateKey, {
            ...activeGate,
            status: 'failed',
            runState: run
          }),
          activeRiftNodeId: undefined,
          hunterGrade: nextHunterGrade,
          messages: [...s.messages, {
            id: uid(),
            kind: 'info',
            title: isExam ? '승급 심사 중도 철수' : '던전 런 포기',
            lines: isExam 
              ? [
                  `승급 심사 게이트에서 중도 퇴장했습니다.`,
                  `언제든지 준비를 가다듬고 승급 심사에 재도전할 수 있습니다.`
                ]
              : [
                  `던전 탐사를 도중에 철수했습니다.`,
                  `누적 획득 보상 정산 지급: 골드 +${earnedGold}, 그림자 정수 +${earnedEssence}`
                ],
            createdAt: todayISO(),
          }]
        })
      },

      switchManualBattleToAuto: () => {
        const s = get()
        const session = s.manualBattleSession
        const isWorldMap = session?.source === 'world_map'
        const activeGate = isWorldMap ? s.activeWorldGate : s.activeGate
        if (!session || !activeGate || activeGate.status !== 'active') return

        const gate = GATE_DEFINITIONS.find(g => g.id === session.gateId)
        if (!gate) return

        const currentMonsterDef = MONSTER_DEFINITIONS.find(monster => monster.id === gate.monsterIds[session.waveIndex])
        if (!currentMonsterDef) return

        const equippedItems = getEquippedItems(s.items, s.equipment)
        const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
        const activeJobId = s.hunter.activeJobId || s.hunter.jobId
        const jobLevel = s.hunter.jobs?.[activeJobId]?.level ?? 1
        const playerSkills = getPlayerCombatSkills({
          jobId: activeJobId,
          jobLevel,
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
          const isRedGate = Boolean(activeGate.runState?.redGateState && (activeGate.runState.redGateState.status === 'opened' || activeGate.runState.redGateState.status === 'cleared'))
          const waveUpdate = appendManualWaveClearLogs({
            logs,
            monster,
            waveIndex,
            remainingMonsterIds,
            pressureSnapshot: activeGate.runState?.pressureSnapshot,
            isRedGate,
            isPromotionExam: activeGate.runState?.isPromotionExam,
            targetGrade: activeGate.runState?.targetGrade,
            difficultyMod: session.difficultyMod,
          })
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
            const isRedGate = Boolean(activeGate.runState?.redGateState && (activeGate.runState.redGateState.status === 'opened' || activeGate.runState.redGateState.status === 'cleared'))
            const waveUpdate = appendManualWaveClearLogs({
              logs,
              monster,
              waveIndex,
              remainingMonsterIds,
              pressureSnapshot: activeGate.runState?.pressureSnapshot,
              isRedGate,
              isPromotionExam: activeGate.runState?.isPromotionExam,
              targetGrade: activeGate.runState?.targetGrade,
              difficultyMod: session.difficultyMod,
            })
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
        const stateUpdate = { ...outcome.state }
        if (isWorldMap) {
          stateUpdate.activeWorldGate = stateUpdate.activeGate
          delete stateUpdate.activeGate
        }
        set({
          ...stateUpdate,
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
        const activeJobId = s.hunter.activeJobId || s.hunter.jobId
        const jobLevel = s.hunter.jobs?.[activeJobId]?.level ?? 1
        const playerSkills = getPlayerCombatSkills({
          jobId: activeJobId,
          jobLevel,
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
        let nextGold = s.gold ?? 0
        let nextShadowEssence = s.shadowEssence ?? 0
        let nextOwnedShadows = s.ownedShadows ?? []
        const isVictory = result === 'victory'
        const isBoss = floor % 5 === 0
        const nextSkillStates = combatLog.battleId.startsWith('direct-tower-')
          ? applyDirectBattleSkillRuntimeUses(s.skillStates, combatLog.turns, isVictory, isBoss)
          : s.skillStates
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
          if (rewards.gold && rewards.gold > 0) {
            nextGold += rewards.gold
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
                  '보스 전리품 상자',
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
              '상위 전투 기록을 갱신했습니다.',
              ...(rewards.hunterXp ? [`XP +${rewards.hunterXp}`] : []),
              ...(rewards.gold ? [`Gold +${rewards.gold}`] : []),
              ...(rewards.shadowEssence ? [`그림자 정수 +${rewards.shadowEssence}`] : []),
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
            gold: nextGold,
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
                ? '상위 전투 도전에 실패했습니다.'
                : '상위 전투 - 시간 초과.',
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
              currentFloor: floor,
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

      // ── World Map Battle System (L3) ───────────────────────────────

      startWorldBattle: (nodeId: string, helperHunterIds?: string[]) => {
        const s = get()
        const helperFilter = filterWorldHelperHunterIds(s, helperHunterIds)
        get().startWorldManualBattle(nodeId, helperFilter.allowedIds)
      },

      resolveWorldBattle: () => {},

      resolveDirectWorldBattle: (combatLog, nodeId, helperHunterIds) => {
        const s = get()
        const activeGate = s.activeWorldGate || s.activeGate
        const isVictory = combatLog.result === 'victory'
        const activeGateHelperIds = activeGate?.helperHunterIds?.length
          ? activeGate.helperHunterIds
          : helperHunterIds
        const filteredActiveGate = activeGate
          ? {
            ...activeGate,
            helperHunterIds: filterWorldHelperHunterIds(s, activeGateHelperIds).allowedIds,
          }
          : undefined

        // 1. activeGate가 존재하면 resolveWorldGateBattleOutcome으로 정산 처리를 위임합니다.
        if (filteredActiveGate && filteredActiveGate.gateId === nodeId) {
          const gate = filteredActiveGate.customGateDef || GATE_DEFINITIONS.find(g => g.id === filteredActiveGate.gateId)
          if (gate) {
            get().resolveWorldGateBattleOutcome(filteredActiveGate, gate, combatLog)
            return
          }
        }

        // 2. 만약 activeGate가 유실된 특수 상황이거나, 결전 상태가 미처 위임되지 못한 경우를 위한 fallback 수동 정산
        const isMonarchId = MONARCHS.some(m => m.id === nodeId) || nodeId === 'angel'
        
        if (isVictory) {
          get().markRiftNodeCleared(nodeId)
          
          const freshState = get()
          let updatedActiveMonarchs = freshState.livingWorld?.activeMonarchs ? [...freshState.livingWorld.activeMonarchs] : undefined
          let nextHomeReachedMonarchId = freshState.livingWorld?.homeReachedMonarchId
          let nextAngelReady = freshState.livingWorld?.angelReady
          let worldLogs = freshState.livingWorld ? [...freshState.livingWorld.eventLogs] : []
          let nextRecentEvents = freshState.livingWorld?.recentEvents ? [...freshState.livingWorld.recentEvents] : undefined
          let nextSecretProgress = ensureSecretProgress(freshState.secretProgress)

          if (isMonarchId && updatedActiveMonarchs) {
            const mIdx = updatedActiveMonarchs.findIndex(m => m.monarchId === nodeId)
            if (mIdx !== -1) {
              updatedActiveMonarchs[mIdx] = {
                ...updatedActiveMonarchs[mIdx],
                status: 'defeated' as const,
                occupiedRegionIds: []
              }
            }
            const krInvader = updatedActiveMonarchs.find(m => m.status === 'rampaging' && m.occupiedRegionIds.includes('kr'))
            nextHomeReachedMonarchId = krInvader ? krInvader.monarchId : undefined

            const allDefeated = updatedActiveMonarchs.length === 8 && updatedActiveMonarchs.every(m => m.status === 'defeated')
            if (allDefeated) {
              nextAngelReady = true
              worldLogs.push(`[Day ${freshState.livingWorld?.day ?? 0}] [지고의 예언] 대균열의 심연에서 지고의 심판자(천사)가 강림을 예고하며 장엄한 빛이 쏟아집니다.`)
              const isTruePath = getEchoTruthReadiness(nextSecretProgress).reached
              if (isTruePath) {
                const emitRes = emitWorldSignal(nextSecretProgress, 'echo_ultimate_truth')
                nextSecretProgress = emitRes.progress
              }
            }
          }

          let nextEndingState = freshState.livingWorld?.endingState ?? 'none'
          let nextEndingMode = freshState.livingWorld?.endingMode

          if (nodeId === 'angel') {
            nextEndingState = 'victory'
            const isTruePath = getEchoTruthReadiness(nextSecretProgress).reached
            if (isTruePath) {
              nextEndingMode = 'choice_pending'
              worldLogs.push(`[Day ${freshState.livingWorld?.day ?? 0}] 🌟 [지고의 대면] 심판자와 마주했습니다. 그의 이면에 새겨진 익숙한 흔적이 당신에게 선택을 촉구합니다.`)
              const endingEvent: WorldEvent = {
                id: `evt-angel-choice-${freshState.livingWorld?.day ?? 0}-${uid()}`,
                day: freshState.livingWorld?.day ?? 0,
                type: 'defeated',
                severity: 'critical',
                title: '결말 직전의 정지',
                body: '쓰러진 심판자의 빛 아래에서 축적된 기록이 다른 결말의 여백을 비춥니다.',
                regionId: 'kr',
                monarchId: 'angel',
                cinematic: true,
                subtitle: 'SEALED ROUTE OPENED',
                quote: '"여기서 끝내도 된다. 하지만 끝내지 않는 길도 있다."',
              }
              nextRecentEvents = [...(nextRecentEvents ?? []), endingEvent].slice(-60)
            } else {
              nextEndingMode = 'surface'
              worldLogs.push(`[Day ${freshState.livingWorld?.day ?? 0}] 🌟 [구원 완료] 지고의 심판자(천사)를 격퇴하고 대균열의 근원을 정화했습니다! 그러나 어둠 속에서 낯익은 굴레가 느껴집니다.`)
              const endingEvent: WorldEvent = {
                id: `evt-angel-surface-${freshState.livingWorld?.day ?? 0}-${uid()}`,
                day: freshState.livingWorld?.day ?? 0,
                type: 'defeated',
                severity: 'critical',
                title: '봉인된 평화',
                body: '결전의 빛은 세계를 감싸지만, 빈 왕좌의 그림자가 잠시 당신의 윤곽과 겹칩니다.',
                regionId: 'kr',
                monarchId: 'angel',
                cinematic: true,
                subtitle: 'SURFACE ROUTE SEALED',
              }
              nextRecentEvents = [...(nextRecentEvents ?? []), endingEvent].slice(-60)
              const res = applySecretProgressEvent(freshState, {
                context: 'echo',
                action: 'ending_select',
                endingType: 'surface'
              })
              nextSecretProgress = res.secretProgress ?? nextSecretProgress
            }
          }

          const finalRiftNodes = { ...freshState.riftNodes, [nodeId]: 'cleared' as RiftNodeStatus }

          set({
            livingWorld: freshState.livingWorld ? {
              ...freshState.livingWorld,
              riftNodes: freshState.livingWorld.riftNodes,
              eventLogs: worldLogs,
              activeMonarchs: updatedActiveMonarchs ?? freshState.livingWorld.activeMonarchs,
              homeReachedMonarchId: nextHomeReachedMonarchId,
              angelReady: nextAngelReady ?? freshState.livingWorld.angelReady,
              endingState: nextEndingState,
              endingMode: nextEndingMode,
              recentEvents: nextRecentEvents ?? freshState.livingWorld.recentEvents,
            } : undefined,
            riftNodes: finalRiftNodes,
            activeGate: undefined,
            activeWorldGate: undefined,
            manualBattleSession: undefined,
            activeRiftNodeId: undefined,
            secretProgress: nextSecretProgress,
          })
        } else {
          const monarchLog: CombatLog = { ...combatLog, source: combatLog.source || 'worldmap' }
          if (shouldHardcoreResetForCombat(s, monarchLog)) {
            const monarchName = MONARCHS.find(m => m.id === nodeId)?.name ?? nodeId
            set(createHardcoreDeathResetState(s, 'monarch_player_death', monarchName))
            return
          }

          if (isMonarchId && s.livingWorld) {
            const worldLogs = [...s.livingWorld.eventLogs]
            worldLogs.push(`[Day ${s.livingWorld.day}] ⚠️ [군주 토벌 실패] 플레이어가 군주 [${nodeId}] 토벌에 실패하고 부상을 입은 채 후퇴했습니다.`)
            set({
              livingWorld: {
                ...s.livingWorld,
                eventLogs: worldLogs
              },
              activeGate: undefined,
              activeWorldGate: undefined,
              manualBattleSession: undefined,
              activeRiftNodeId: undefined,
            })
          } else {
            set({
              activeGate: undefined,
              activeWorldGate: undefined,
              manualBattleSession: undefined,
              activeRiftNodeId: undefined,
            })
          }
        }
      },

      cancelWorldBattle: () => set((s) => {
        const activeGate = s.activeWorldGate ?? s.activeGate
        const manualSession = s.manualBattleSession
        if (!activeGate && (!manualSession || manualSession.source !== 'world_map')) return {}

        // ⚠️ 플레이어 수동 전투 사망 시 하드코어 사망 리셋 우선 처리
        if (manualSession && shouldTriggerHardcoreDeathFromSession(s, manualSession)) {
          return createManualSessionDeathResetState(s, manualSession, 'player_death', manualSession.gateName)
        }

        // ⚠️ 추가 방어막: 이미 승리(victory)로 finalized된 world_map session은 retreat/cancel 처리(메시지 및 날짜 기록)를 하지 않고 cleanup만 수행합니다.
        if (manualSession?.result === 'victory' || manualSession?.logs?.some(l => l.message?.includes('성공') || l.message?.includes('승리'))) {
          return {
            activeGate: undefined,
            activeWorldGate: undefined,
            activeRiftNodeId: undefined,
            manualBattleSession: undefined,
          }
        }

        const nodeId = activeGate?.gateId || manualSession?.gateInstanceId?.replace('worldmap-', '') || s.activeRiftNodeId
        const today = todayKey()
        const nextRetreats = nodeId ? { ...(s.worldBattleRetreats ?? {}), [nodeId]: today } : (s.worldBattleRetreats ?? {})

        const node = nodeId ? ({
          difficulty: 500,
          deadline: 7,
          daysRemaining: 7,
          ...(s.livingWorld?.riftNodes[nodeId] || RIFT_NODES.find(n => n.id === nodeId))
        } as RiftNode) : undefined
        const nameLabel = node?.name || '균열'

        return {
          activeGate: undefined,
          activeWorldGate: undefined,
          activeRiftNodeId: undefined,
          manualBattleSession: undefined,
          worldBattleRetreats: nextRetreats,
          messages: appendMessageOnce(s.messages, {
            id: uid(),
            kind: 'info',
            title: '전투 후퇴',
            lines: [
              "[" + nameLabel + "] 전투에서 안전하게 후퇴했습니다.",
              '다행히 부상을 면했으나, 오늘 이 구역은 다시 진입할 수 없습니다.',
            ],
            createdAt: todayISO(),
          })
        }
      }),

      resolveWorldGateBattleOutcome: (activeGate, gate, combatLog) => {
        const s = get()
        const nodeId = activeGate.gateId
        const isVictory = combatLog.result === 'victory'
        const isMonarchId = MONARCHS.some(m => m.id === nodeId) || nodeId === 'angel'

        if (isVictory) {
          // 1. 먼저 정화 및 오염도 감소 처리를 위해 markRiftNodeCleared를 호출합니다.
          // 이로써 store.riftNodes와 store.livingWorld.riftNodes/regions/eventLogs가 cleared 처리됩니다.
          get().markRiftNodeCleared(nodeId)

          // 2. markRiftNodeCleared가 완료된 최신 스토어 상태를 가져옵니다.
          const freshState = get()
          let nextSecretProgress = ensureSecretProgress(freshState.secretProgress)

          let nextHunter = freshState.hunter
          let nextItems = freshState.items ?? []
          let nextGold = freshState.gold ?? 0
          let nextShadowEssence = freshState.shadowEssence ?? 0
          const newMessages: SystemMessage[] = []

          // [L1-A] 협력 헌터 결과 처리용 (이미 markRiftNodeCleared가 완수된 최신 상태 기반)
          let updatedNamedHunters = freshState.livingWorld ? { ...freshState.livingWorld.namedHunters } : undefined
          let updatedRiftNodes = freshState.livingWorld ? { ...freshState.livingWorld.riftNodes } : undefined
          let worldLogs = freshState.livingWorld ? [...freshState.livingWorld.eventLogs] : []
          let nextRecentEvents = freshState.livingWorld?.recentEvents ? [...freshState.livingWorld.recentEvents] : undefined

          let updatedActiveMonarchs = freshState.livingWorld?.activeMonarchs ? [...freshState.livingWorld.activeMonarchs] : undefined
          let nextHomeReachedMonarchId = freshState.livingWorld?.homeReachedMonarchId
          let nextAngelReady = freshState.livingWorld?.angelReady

          // 보상 계산 (난이도 CP 비례 & 협력 페널티 트레이드오프 적용)
          const recommendedPower = gate.recommendedPower || 1000
          const helperFilter = filterWorldHelperHunterIds(freshState, activeGate.helperHunterIds)
          const helperHunterIds = helperFilter.allowedIds
          const helperCount = helperHunterIds.length
          const rewardTable = GATE_REWARD_TABLES.find(r => r.id === gate.rewardTableId)
          newMessages.push(
            ...appendRejectedHelperMessage(
              [],
              helperFilter.rejectedHunters,
              getCurrentRenownTier(freshState).maxHelperRank
            )
          )

          let baseGold = 0
          let baseHunterXp = 0
          let baseEssence = 0

          if (isMonarchId) {
            // 군주전: 일반 National/S랭크 기준의 2.5배 수준으로 대폭 하향 (recommendedPower 비정상 폭주 방지)
            baseGold = Math.round(getGateGoldReward(gate.rank || 'S') * 2.5)
            baseHunterXp = Math.round((rewardTable?.xp ?? 1500) * 2.5)
            baseEssence = gate.rank === 'S' ? 1200 : gate.rank === 'A' ? 900 : gate.rank === 'B' ? 700 : gate.rank === 'C' ? 500 : 300
          } else {
            // loveCall이 이미 undefined 처리되었을 수 있으므로 첫 진입 s 시점의 원본 노드 참조
            const originalNode = s.livingWorld?.riftNodes[nodeId]
            const defaultWorldEssence = gate.rank === 'S' ? 500 : gate.rank === 'A' ? 400 : gate.rank === 'B' ? 300 : gate.rank === 'C' ? 200 : 100
            if (originalNode?.opportunity) {
              const oppReward = originalNode.opportunity.promisedReward
              baseGold = oppReward.gold ?? Math.round(getGateGoldReward(gate.rank) * 1.5)
              baseHunterXp = oppReward.hunterXp ?? Math.round((rewardTable?.xp ?? 900) * 1.5)
              baseEssence = oppReward.shadowEssence ?? defaultWorldEssence
            } else {
              baseGold = originalNode?.loveCall?.promisedReward.gold ?? Math.round(getGateGoldReward(gate.rank) * 1.2)
              baseHunterXp = originalNode?.loveCall?.promisedReward.hunterXp ?? Math.round((rewardTable?.xp ?? 900) * 1.2)
              baseEssence = originalNode?.loveCall?.promisedReward.shadowEssence ?? defaultWorldEssence
            }
          }

          // 변동 보상 및 잭팟 롤링 적용 (골드, 경험치, 에센스)
          const rolledGold = rollValueReward(baseGold)
          const rolledXp = rollValueReward(baseHunterXp)
          const rolledEssence = rollValueReward(baseEssence)

          const hasJackpot = rolledGold.isJackpot || rolledXp.isJackpot || rolledEssence.isJackpot

          const rewardRatio = Math.max(COOP_REWARD_MIN_RATIO, 1 - COOP_REWARD_PENALTY_PER_HELPER * helperCount)
          const runMultiplier = activeGate.runState?.rewardMultiplier ?? 1.0
          const finalGold = Math.round(rolledGold.amount * rewardRatio * runMultiplier)
          const finalXp = Math.round(rolledXp.amount * rewardRatio * runMultiplier)
          const finalEssence = Math.max(1, Math.round(rolledEssence.amount * rewardRatio * runMultiplier))

          if (finalXp > 0) {
            const xpResult = applyXp(freshState.hunter, finalXp, 'challenge')
            nextHunter = xpResult.hunter
            if (xpResult.outcome?.leveledUp) {
              newMessages.push({
                id: uid(),
                kind: 'levelup',
                title: 'LEVEL UP',
                lines: [
                  `Lv.${freshState.hunter.level} → Lv.${xpResult.outcome.newLevel}`,
                  `자동 분배 — ${formatStatGains(xpResult.outcome.autoStatGains)}`,
                  `자유 배분권 +${xpResult.outcome.freeStatPointsGained}`,
                ],
                createdAt: todayISO(),
              })
            }
          }

          nextGold += finalGold
          nextShadowEssence += finalEssence

          // 플레이어 월드맵 게이트 클리어 장비 드랍 보상
          let droppedItemName = ''
          let rolledRune: RuneItem | undefined = undefined
          const grVal = gate.rank ?? 'E'
          const runeDropChance = isMonarchId ? 0.70 : grVal === 'S' ? 0.45 : grVal === 'A' ? 0.30 : grVal === 'B' ? 0.20 : 0.08
          if (Math.random() < runeDropChance) {
            let boxGrade: 'normal' | 'advanced' | 'supreme' = 'normal'
            if (isMonarchId) {
              boxGrade = Math.random() < 0.60 ? 'supreme' : 'advanced'
            } else if (grVal === 'S') {
              boxGrade = Math.random() < 0.25 ? 'supreme' : 'advanced'
            } else if (grVal === 'A' || grVal === 'B') {
              boxGrade = Math.random() < 0.15 ? 'advanced' : 'normal'
            }
            rolledRune = generateRandomRune(boxGrade)
          }
          const dropRng = Math.random()
          let targetRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | null = null

          if (isMonarchId) {
            // 군주전: 100% 드랍, 65% Epic / 35% Legendary
            targetRarity = Math.random() < 0.35 ? 'legendary' : 'epic'
          } else {
            const gr = gate.rank ?? 'E'
            const gd = gate.recommendedPower ?? 500
            
            if (gr === 'S' || gd >= 4000) {
              if (dropRng < 0.70) {
                const r = Math.random()
                targetRarity = r < 0.05 ? 'legendary' : r < 0.25 ? 'epic' : 'rare'
              }
            } else if (gr === 'A' || gd >= 2500) {
              if (dropRng < 0.50) {
                const r = Math.random()
                targetRarity = r < 0.02 ? 'legendary' : r < 0.20 ? 'epic' : 'rare'
              }
            } else if (gr === 'B' || gr === 'C' || gd >= 1200) {
              if (dropRng < 0.35) {
                const r = Math.random()
                targetRarity = r < 0.10 ? 'rare' : r < 0.70 ? 'uncommon' : 'common'
              }
            } else {
              if (dropRng < 0.20) {
                targetRarity = Math.random() < 0.30 ? 'uncommon' : 'common'
              }
            }
          }

          if (targetRarity) {
            const pool = ITEM_POOL.filter(item => item.rarity === targetRarity)
            const pickedTemplate = pool.length > 0 
              ? pool[Math.floor(Math.random() * pool.length)]
              : ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)]
            
            if (pickedTemplate) {
              const item: Item = { ...pickedTemplate, id: uid(), acquiredAt: todayISO() }
              nextItems = [...nextItems, item]
              droppedItemName = `${item.name} (${item.rarity.toUpperCase()})`
            }
          }

          let addedNormalMat = 0
          let addedAdvancedMat = 0
          let addedSupremeMat = 0

          const gr = gate.rank ?? 'E'
          const rand = Math.random()
          if (isMonarchId || gr === 'S') {
            if (rand < 0.08) addedSupremeMat = 1
            else if (rand < 0.28) addedAdvancedMat = 1
            else if (rand < 0.68) addedNormalMat = 1
          } else if (gr === 'A' || gr === 'B') {
            if (rand < 0.03) addedSupremeMat = 1
            else if (rand < 0.15) addedAdvancedMat = 1
            else if (rand < 0.45) addedNormalMat = 1
          } else if (gr === 'C' || gr === 'D') {
            if (rand < 0.06) addedAdvancedMat = 1
            else if (rand < 0.26) addedNormalMat = 1
          } else {
            if (rand < 0.12) addedNormalMat = 1
          }

          const matRewardLines: string[] = []
          if (addedNormalMat > 0) matRewardLines.push(`일반 변이 재료 +${addedNormalMat}개`)
          if (addedAdvancedMat > 0) matRewardLines.push(`고급 변이 재료 +${addedAdvancedMat}개`)
          if (addedSupremeMat > 0) matRewardLines.push(`최고급 변이 재료 +${addedSupremeMat}개`)

          const jackpotTitle = hasJackpot ? '★대박 잭팟!★ ' : ''
          newMessages.push({
            id: uid(),
            kind: 'quest',
            title: isMonarchId ? `${jackpotTitle}군주 격퇴 성공` : `${jackpotTitle}균열 정화 성공`,
            lines: [
              isMonarchId 
                ? `[${gate.name}] 군주 격퇴에 성공했습니다!`
                : `[${gate.name}] 균열 정화에 성공했습니다!`,
              `XP +${finalXp}${rolledXp.isJackpot ? ' (★잭팟 대박 보너스!★)' : ''}`,
              `Gold +${finalGold}${rolledGold.isJackpot ? ' (★잭팟 대박 보너스!★)' : ''}`,
              `그림자 정수 +${finalEssence}${rolledEssence.isJackpot ? ' (★잭팟 대박 보너스!★)' : ''}`,
              ...(droppedItemName ? [`획득 장비: ${droppedItemName}`] : []),
              ...(rolledRune ? [`전리품: 룬 획득 [${rolledRune.icon} ${rolledRune.name}]`] : []),
              ...matRewardLines.map(line => `전리품: ${line}`),
            ],
            createdAt: todayISO(),
          })

          if (isMonarchId && updatedActiveMonarchs) {
            const mIdx = updatedActiveMonarchs.findIndex(m => m.monarchId === nodeId)
            if (mIdx !== -1) {
              const updatedMonarch = {
                ...updatedActiveMonarchs[mIdx],
                status: 'defeated' as const,
                occupiedRegionIds: []
              }
              updatedActiveMonarchs[mIdx] = updatedMonarch
            }
            
            // Re-evaluate homeReachedMonarchId
            const krInvader = updatedActiveMonarchs.find(m => m.status === 'rampaging' && m.occupiedRegionIds.includes('kr'))
            nextHomeReachedMonarchId = krInvader ? krInvader.monarchId : undefined

            // Check if all 8 are defeated
            const allDefeated = updatedActiveMonarchs.length === 8 && updatedActiveMonarchs.every(m => m.status === 'defeated')
            if (allDefeated) {
              nextAngelReady = true
              worldLogs.push(`[Day ${freshState.livingWorld?.day ?? 0}] [지고의 예언] 대균열의 심연에서 지고의 심판자(천사)가 강림을 예고하며 장엄한 빛이 쏟아집니다.`)
              const isTruePath = getEchoTruthReadiness(nextSecretProgress).reached
              if (isTruePath) {
                const emitRes = emitWorldSignal(nextSecretProgress, 'echo_ultimate_truth')
                nextSecretProgress = emitRes.progress
                if (emitRes.signal) {
                  newMessages.push({
                    id: uid(),
                    kind: 'secret',
                    title: emitRes.signal.title,
                    lines: [emitRes.signal.body],
                    createdAt: todayISO(),
                  })
                }
              }
            }
          }

          let nextEndingState = freshState.livingWorld?.endingState ?? 'none'
          let nextEndingMode = freshState.livingWorld?.endingMode

          if (nodeId === 'angel') {
            nextEndingState = 'victory'
            const isTruePath = getEchoTruthReadiness(nextSecretProgress).reached
            if (isTruePath) {
              nextEndingMode = 'choice_pending'
              worldLogs.push(`[Day ${freshState.livingWorld?.day ?? 0}] 🌟 [지고의 대면] 심판자와 마주했습니다. 그의 이면에 새겨진 익숙한 흔적이 당신에게 선택을 촉구합니다.`)
              const endingEvent: WorldEvent = {
                id: `evt-angel-choice-${freshState.livingWorld?.day ?? 0}-${uid()}`,
                day: freshState.livingWorld?.day ?? 0,
                type: 'defeated',
                severity: 'critical',
                title: '결말 직전의 정지',
                body: '쓰러진 심판자의 빛 아래에서 축적된 기록이 다른 결말의 여백을 비춥니다.',
                regionId: 'kr',
                monarchId: 'angel',
                cinematic: true,
                subtitle: 'SEALED ROUTE OPENED',
                quote: '"여기서 끝내도 된다. 하지만 끝내지 않는 길도 있다."',
              }
              nextRecentEvents = [...(nextRecentEvents ?? []), endingEvent].slice(-60)
            } else {
              nextEndingMode = 'surface'
              worldLogs.push(`[Day ${freshState.livingWorld?.day ?? 0}] 🌟 [구원 완료] 지고의 심판자(천사)를 격퇴하고 대균열의 근원을 정화했습니다! 그러나 어둠 속에서 낯익은 굴레가 느껴집니다.`)
              const endingEvent: WorldEvent = {
                id: `evt-angel-surface-${freshState.livingWorld?.day ?? 0}-${uid()}`,
                day: freshState.livingWorld?.day ?? 0,
                type: 'defeated',
                severity: 'critical',
                title: '봉인된 평화',
                body: '결전의 빛은 세계를 감싸지만, 빈 왕좌의 그림자가 잠시 당신의 윤곽과 겹칩니다.',
                regionId: 'kr',
                monarchId: 'angel',
                cinematic: true,
                subtitle: 'SURFACE ROUTE SEALED',
              }
              nextRecentEvents = [...(nextRecentEvents ?? []), endingEvent].slice(-60)
              const res = applySecretProgressEvent(freshState, {
                context: 'echo',
                action: 'ending_select',
                endingType: 'surface'
              })
              nextSecretProgress = res.secretProgress ?? nextSecretProgress
            }
          }

          const nextAchievementStats: AchievementStats = {
            ...freshState.achievementStats,
            gateClearedCount: (freshState.achievementStats.gateClearedCount ?? 0) + 1,
            bossKillsCount: isMonarchId || gate.rank === 'S' || gate.rewardTableId?.includes('boss')
              ? (freshState.achievementStats.bossKillsCount ?? 0) + 1
              : (freshState.achievementStats.bossKillsCount ?? 0),
          }
          const nextDefeatedMonarchsForRenown = updatedActiveMonarchs
            ? updatedActiveMonarchs.filter(monarch => monarch.status === 'defeated').length
            : getMonarchsDefeatedCount(freshState.livingWorld)
          const renownResult = applyRenownGain(
            nextHunter,
            freshState,
            nextAchievementStats,
            getRenownGainForGate((gate.rank ?? 'E') as Rank, isMonarchId),
            gate.name,
            nextDefeatedMonarchsForRenown
          )
          nextHunter = renownResult.hunter
          newMessages.push(...renownResult.messages)
          if (renownResult.worldLog) {
            worldLogs = [
              ...worldLogs,
              `[Day ${freshState.livingWorld?.day ?? 0}] ${renownResult.worldLog}`,
            ].slice(-60)
          }

          let nextCoopCount = freshState.livingWorld?.coopCount ?? 0
          if (helperHunterIds.length > 0) {
            nextCoopCount += 1
          }

          // [L1-A] 협력 헌터 성장 및 러브콜 해제
          if (helperHunterIds.length > 0 && freshState.livingWorld && updatedNamedHunters && updatedRiftNodes) {
            const nodeStatus = freshState.livingWorld.riftNodes[nodeId]
            const rName = RIFT_REGIONS.find(r => r.id === nodeStatus?.regionId)?.name ?? '해외'
            
            for (const hid of helperHunterIds) {
              const hunter = { ...updatedNamedHunters[hid] }
              if (hunter && hunter.status === 'active') {
                const trait = getHunterTrait(hunter.traitId)
                const growthMod = trait?.growthMod ?? 1.0
                const lootMod = trait?.lootMod ?? 1.0

                const bonusMult = 1.02 + (Math.random() * 0.03) * growthMod
                hunter.power = Math.round(hunter.power * bonusMult)
                const region = freshState.livingWorld.regions[hunter.regionId]
                const cap = 4500 + (region?.growthBias ?? 0.5) * 1000
                if (hunter.power > cap) hunter.power = Math.round(cap)

                // 협력 헌터 장비 획득 연동: 클리어한 게이트 권장전투력 비례
                const difficultyVal = nodeStatus?.difficulty ?? 500
                let equipGain = Math.round(difficultyVal * (0.005 + Math.random() * 0.01))
                
                // RNG 대박 드랍 (4% * lootMod 확률)
                const baseLuckyChance = 0.04
                const adjustedLuckyChance = baseLuckyChance * lootMod
                const isLuckyDrop = Math.random() < adjustedLuckyChance
                if (isLuckyDrop) {
                  const luckyAdd = Math.round(500 + Math.random() * 600)
                  equipGain += luckyAdd
                  worldLogs.push(`[Day ${freshState.livingWorld.day}] 🤝 [전리품 획득] 참전한 [${hunter.name}] 헌터가 던전에서 고성능 장비를 획득했습니다! (+${luckyAdd} 장비전투력)`)
                }

                const oldScore = hunter.equipmentScore ?? 0
                const nextScore = oldScore + equipGain
                hunter.equipmentScore = nextScore

                // 결정론적 장비 갱신
                const itemSeed = Math.floor(nextScore + freshState.livingWorld.day)
                hunter.equipmentItems = getNPCEquipmentForScore(nextScore, itemSeed)

                updatedNamedHunters[hid] = hunter
                
                worldLogs.push(`[Day ${freshState.livingWorld.day}] 🤝 [협력 원정] 참전한 ${rName}의 [${hunter.name}] 헌터가 정화 성공으로 추가 성장했습니다! (전투력: ${hunter.power + hunter.equipmentScore})`)
              }
            }

            if (updatedRiftNodes[nodeId]) {
              const nodeVal = { ...updatedRiftNodes[nodeId] }
              nodeVal.loveCall = undefined
              nodeVal.opportunity = undefined
              updatedRiftNodes[nodeId] = nodeVal
            }
          }

          // UI 렌더링에 영항을 주는 노드 클리어 보장
          const finalRiftNodes = { ...freshState.riftNodes, [nodeId]: 'cleared' as RiftNodeStatus }

          const baseState: Partial<GameState> = {
            hunter: nextHunter,
            achievementStats: nextAchievementStats,
            gold: nextGold,
            shadowEssence: nextShadowEssence,
            mutationMaterialNormal: (freshState.mutationMaterialNormal ?? 0) + addedNormalMat,
            mutationMaterialAdvanced: (freshState.mutationMaterialAdvanced ?? 0) + addedAdvancedMat,
            mutationMaterialSupreme: (freshState.mutationMaterialSupreme ?? 0) + addedSupremeMat,
            items: nextItems,
            runes: [...(freshState.runes ?? []), ...(rolledRune ? [rolledRune] : [])],
            livingWorld: freshState.livingWorld ? {
              ...freshState.livingWorld,
              namedHunters: updatedNamedHunters ?? freshState.livingWorld.namedHunters,
              riftNodes: updatedRiftNodes ?? freshState.livingWorld.riftNodes,
              eventLogs: worldLogs,
              activeMonarchs: updatedActiveMonarchs ?? freshState.livingWorld.activeMonarchs,
              homeReachedMonarchId: nextHomeReachedMonarchId,
              angelReady: nextAngelReady ?? freshState.livingWorld.angelReady,
              endingState: nextEndingState,
              endingMode: nextEndingMode,
              coopCount: nextCoopCount,
              recentEvents: nextRecentEvents ?? freshState.livingWorld.recentEvents,
            } : undefined,
            messages: [...freshState.messages, ...newMessages],
            riftNodes: finalRiftNodes,
            activeGate: undefined,
            activeWorldGate: undefined,
            manualBattleSession: undefined,
            activeRiftNodeId: undefined,
            secretProgress: nextSecretProgress,
          }

          if (isMonarchId) {
            set(applySecretProgressEvent({ ...freshState, secretProgress: nextSecretProgress }, { context: 'gate', outcome: 'victory', isMonarch: true, monarchId: nodeId }, baseState))
          } else {
            set(baseState)
          }
        } else {
          // 패배 시
          const monarchLog: CombatLog = { ...combatLog, source: combatLog.source || 'worldmap' }
          if (shouldHardcoreResetForCombat(s, monarchLog)) {
            set(createHardcoreDeathResetState(s, 'monarch_player_death', gate.name))
            return
          }

          if (isMonarchId && s.livingWorld) {
            const worldLogs = [...s.livingWorld.eventLogs]
            worldLogs.push(`[Day ${s.livingWorld.day}] ⚠️ [군주 토벌 실패] 플레이어가 군주 [${gate.name}] 토벌에 실패하고 부상을 입은 채 후퇴했습니다.`)
            set({
              livingWorld: {
                ...s.livingWorld,
                eventLogs: worldLogs
              },
              activeGate: undefined,
              activeWorldGate: undefined,
              manualBattleSession: undefined,
              activeRiftNodeId: undefined,
            })
          }
        }
      },

      acceptWorldOpportunity: (nodeId) => {
        const s = get()
        if (!s.livingWorld) return { success: false, message: '세계가 아직 활성화되지 않았습니다.' }
        const node = s.livingWorld.riftNodes[nodeId]
        if (!node || !node.opportunity) return { success: false, message: '해당 기회가 존재하지 않습니다.' }

        const opp = node.opportunity
        // 1. 대가(cost) 지불 체크
        let nextGold = s.gold ?? 0
        let nextEssence = s.shadowEssence ?? 0
        const cost = opp.cost

        if (cost) {
          if (cost.gold && nextGold < cost.gold) {
            return { success: false, message: '골드가 부족합니다.' }
          }
          if (cost.shadowEssence && nextEssence < cost.shadowEssence) {
            return { success: false, message: '그림자 정수가 부족합니다.' }
          }

          if (cost.gold) nextGold -= cost.gold
          if (cost.shadowEssence) nextEssence -= cost.shadowEssence
        }

        // 2. 보상(reward) 지급
        const reward = opp.promisedReward
        let newMessages = [...s.messages]
        let nextHunter = { ...s.hunter }

        if (reward.gold) {
          nextGold += reward.gold
        }
        if (reward.shadowEssence) {
          nextEssence += reward.shadowEssence
        }
        if (reward.hunterXp) {
          const xpResult = applyXp(nextHunter, reward.hunterXp, 'challenge')
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

        // 3. 월드 노드 해제 및 기회 상태 제거
        const nextLivingWorld = { ...s.livingWorld }
        const nextRiftNodes = { ...nextLivingWorld.riftNodes }
        const nodeVal = { ...nextRiftNodes[nodeId] }

        nodeVal.opportunity = undefined
        nodeVal.status = 'cleared'
        nodeVal.daysRemaining = 0
        nextRiftNodes[nodeId] = nodeVal

        const region = { ...nextLivingWorld.regions[nodeVal.regionId] }
        region.activeGateIds = region.activeGateIds.filter(id => id !== nodeId)
        nextLivingWorld.regions[nodeVal.regionId] = region

        nextLivingWorld.riftNodes = nextRiftNodes
        
        // 이벤트 로그 추가
        const rName = RIFT_REGIONS.find(r => r.id === nodeVal.regionId)?.name ?? nodeVal.regionId.toUpperCase()
        const worldLogs = [...nextLivingWorld.eventLogs]
        worldLogs.push(`[Day ${nextLivingWorld.day}] ✨ [기회 획득] 플레이어가 [${rName}]의 [${opp.title}]을(를) 완수하여 보상을 획득했습니다!`)
        nextLivingWorld.eventLogs = worldLogs

        // store state 갱신
        const nextRiftNodesState = { ...s.riftNodes, [nodeId]: 'cleared' as RiftNodeStatus }

        set({
          gold: nextGold,
          shadowEssence: nextEssence,
          hunter: nextHunter,
          messages: newMessages,
          livingWorld: nextLivingWorld,
          riftNodes: nextRiftNodesState,
          activeRiftNodeId: undefined, // 팝업 닫기 위해
        })

        return {
          success: true,
          loreText: reward.lore,
          message: `${opp.title}을(를) 성공적으로 완료했습니다!`
        }
      },

      startWorldManualBattle: (nodeId, helperHunterIds) => {
        const s = get()
        const helperFilter = filterWorldHelperHunterIds(s, helperHunterIds)
        const allowedHelperHunterIds = helperFilter.allowedIds
        const isMonarchId = MONARCHS.some(m => m.id === nodeId) || nodeId === 'angel'

        // 군주 및 Angel 진입 권한 및 격퇴 완료 가드
        if (isMonarchId) {
          if (nodeId === 'angel') {
            const angelReady = s.livingWorld?.angelReady
            const endingState = s.livingWorld?.endingState
            if (!angelReady) {
              set({
                messages: appendMessageOnce(s.messages, {
                  id: uid(),
                  kind: 'info',
                  title: '진입 차단',
                  lines: ['아직 지고의 심판자(천사)가 나타나지 않았습니다. 8명의 군주를 모두 격퇴해야 합니다.'],
                  createdAt: todayISO(),
                })
              })
              return
            }
            if (endingState === 'victory') {
              set({
                messages: appendMessageOnce(s.messages, {
                  id: uid(),
                  kind: 'info',
                  title: '진입 차단',
                  lines: ['이미 정화된 결전입니다.'],
                  createdAt: todayISO(),
                })
              })
              return
            }

            const readiness = getEchoTruthReadiness(s.secretProgress)
            const confrontationFlag = readiness.reached ? 'angelTruthCondensed' : 'angelSurfaceOmenSeen'
            if (s.livingWorld && !s.secretProgress?.flags?.[confrontationFlag]) {
              let nextSecretProgress = markSecretFlagPublic(s.secretProgress, confrontationFlag)
              const newMessages: SystemMessage[] = []
              const signalId = readiness.reached ? 'echo_ultimate_truth' : 'echo_unresolved_angel'
              const signalRes = emitWorldSignal(nextSecretProgress, signalId)
              nextSecretProgress = signalRes.progress
              if (signalRes.signal) {
                newMessages.push({
                  id: uid(),
                  kind: 'secret',
                  title: signalRes.signal.title,
                  lines: [signalRes.signal.body],
                  createdAt: todayISO(),
                })
              }

              const confrontationEvent: WorldEvent = {
                id: `evt-angel-entry-${s.livingWorld.day}-${readiness.reached ? 'truth' : 'surface'}-${uid()}`,
                day: s.livingWorld.day,
                type: 'monarch_appear',
                severity: 'critical',
                title: readiness.reached ? '결전 좌표 재정렬' : '결전 좌표 고정',
                body: readiness.reached
                  ? '누적된 잔향이 최종 결전의 빛과 같은 위상으로 맞물립니다.'
                  : '빛은 완전하게 닫히지 않았고, 닿지 못한 잔향이 전장 가장자리에 남습니다.',
                regionId: 'kr',
                monarchId: 'angel',
                cinematic: true,
                subtitle: readiness.reached ? 'HIDDEN ROUTE SYNCHRONIZED' : 'UNRESOLVED ECHO DETECTED',
              }

              set({
                secretProgress: nextSecretProgress,
                livingWorld: appendLivingWorldEvent(
                  s.livingWorld,
                  confrontationEvent,
                  `[Day ${s.livingWorld.day}] [결전 신호] ${confrontationEvent.body}`
                ),
                messages: newMessages.length > 0 ? [...s.messages, ...newMessages] : s.messages,
              })
            }
          } else {
            // s.livingWorld와 activeMonarchs가 정상적으로 셋업되어 있는 리얼 런타임 환경에서만 이미 패퇴한 군주에 대한 재진입을 막습니다.
            if (s.livingWorld && s.livingWorld.activeMonarchs && s.livingWorld.activeMonarchs.length > 0) {
              const activeMonarch = s.livingWorld.activeMonarchs.find(m => m.monarchId === nodeId)
              const isDefeated = !activeMonarch || activeMonarch.status === 'defeated' || activeMonarch.occupiedRegionIds.length === 0
              if (isDefeated) {
                set({
                  messages: appendMessageOnce(s.messages, {
                    id: uid(),
                    kind: 'info',
                    title: '진입 차단',
                    lines: ['이미 격퇴된 군주입니다.'],
                    createdAt: todayISO(),
                  })
                })
                return
              }
            }
          }
        }

        let monarchRegionId = 'kr'
        if (isMonarchId && s.livingWorld?.activeMonarchs) {
          const activeMon = s.livingWorld.activeMonarchs.find(m => m.monarchId === nodeId)
          if (activeMon && activeMon.occupiedRegionIds.length > 0) {
            monarchRegionId = activeMon.occupiedRegionIds[0]
          }
        }

        let node
        if (isMonarchId) {
          const monarchData = nodeId === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === nodeId)!
          node = {
            id: monarchData.id,
            regionId: monarchRegionId,
            name: monarchData.name,
            x: 50,
            y: 50,
            status: 'active',
            gateDefId: monarchData.id,
            difficultyRank: 'S',
            difficulty: monarchData.recommendedCP,
            deadline: 999,
            daysRemaining: 999,
            isSGrade: true
          }
        } else {
          node = {
            difficulty: 500,
            deadline: 7,
            daysRemaining: 7,
            ...(s.livingWorld?.riftNodes[nodeId] || RIFT_NODES.find(n => n.id === nodeId))
          }
          if (!node || (s.riftNodes[nodeId] ?? node.status) !== 'active') return
        }

        // 진입 권한 가드: 대한민국 외 지역 일반 게이트 진입 차단 (안전장치)
        // 단, 러브콜(지원 요청)이 활성화되어 있는 게이트는 대한민국 외여도 개입(진입) 가능!
        if (!isMonarchId && node.regionId !== 'kr' && !node.loveCall?.active && !node.opportunity) {
          set({
            messages: appendMessageOnce(s.messages, {
              id: uid(),
              kind: 'info',
              title: '진입 권한 제한',
              lines: ['대한민국 영역 외의 게이트에는 직접 개입할 수 없습니다. (지원 요청(러브콜) 또는 한정 시간 기회가 활성화된 게이트만 진입 가능)'],
              createdAt: todayISO(),
            })
          })
          return
        }

        // 후퇴 일일 가드 확인
        const today = todayKey()
        if (s.worldBattleRetreats && s.worldBattleRetreats[nodeId] === today) {
          set({
            messages: appendMessageOnce(s.messages, {
              id: uid(),
              kind: 'info',
              title: '진입 차단',
              lines: ['오늘 이 구역에서 후퇴하여 다시 진입할 수 없습니다. 내일 다시 시도하십시오.'],
              createdAt: todayISO(),
            })
          })
          return
        }

        const existingWorldGate = s.activeWorldGate
        if (existingWorldGate?.status === 'active') {
          if (existingWorldGate.gateId === nodeId) {
            set({ activeRiftNodeId: nodeId })
            return
          }

          set({
            messages: appendMessageOnce(s.messages, {
              id: uid(),
              kind: 'info',
              title: '진입 차단',
              lines: ['이미 다른 월드맵 게이트가 활성화되어 있습니다. 현재 게이트를 완료하거나 포기한 뒤 다시 시도하십시오.'],
              createdAt: todayISO(),
            })
          })
          return
        }

        // 1) nodeId로 동적 게이트 정의 구성 (한국 게이트 or 군주)
        let customGateDef
        let manualSession = undefined

        if (isMonarchId) {
          const monarchData = nodeId === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === nodeId)!
          customGateDef = {
            id: nodeId,
            name: monarchData.name,
            description: `${monarchData.name}과의 결전입니다.`,
            rank: 'S',
            recommendedLevel: 80,
            recommendedPower: monarchData.recommendedCP,
            monsterIds: [nodeId],
            rewardTableId: 'reward-gate-s-basic',
            failPenaltyId: 'penalty-gate-basic',
            expiresInHours: 720,
          }

          // 군주전을 위한 manualBattleSession 구성
          const equippedItems = getEquippedItems(s.items, s.equipment)
          const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
          const shadowStatBonuses = getEquippedShadowStatBonuses(equippedShadows)
          const combatStatsWithShadows = { ...s.hunter.stats }
          for (const [stat, value] of Object.entries(shadowStatBonuses)) {
            combatStatsWithShadows[stat as StatKey] = roundStatValue(combatStatsWithShadows[stat as StatKey] + (value ?? 0))
          }
          const activeJobId = s.hunter.activeJobId || s.hunter.jobId
          const jobLevel = s.hunter.jobs?.[activeJobId]?.level ?? 1
          const playerSkills = getPlayerCombatSkills({
            jobId: activeJobId,
            jobLevel,
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
            jobId: activeJobId,
            skills: playerSkills,
          })

          const player = createPlayerBattleActor(s.hunter.name || '헌터', playerStats, allPlayerSkills)
          const monarchUnit = buildMonarchBattleUnit(nodeId, monarchData.battleCP)
          const monster = {
            id: nodeId,
            name: monarchUnit.displayName,
            maxHp: monarchUnit.stats.maxHp,
            hp: monarchUnit.stats.currentHp,
            atk: monarchUnit.stats.atk,
            def: monarchUnit.stats.def,
            spd: monarchUnit.stats.spd,
            level: 80,
            skills: [],
            cooldowns: {},
            activeEffects: [],
          }

          manualSession = {
            gateId: nodeId,
            gateName: monarchData.name,
            gateInstanceId: `worldmap-${nodeId}-${Date.now()}`,
            waveIndex: 0,
            turn: 1,
            maxTurns: 200,
            player: toManualCombatant(player),
            monster: toManualCombatant(monster as any),
            remainingMonsterIds: [],
            cooldowns: {},
            monsterCooldowns: {},
            activeEffects: [],
            consumableEffects: s.activeConsumableEffects,
            usedConsumableItemIds: [],
            usedConsumableEffectTypes: [],
            consumableUseCount: 0,
            logs: [],
            startedAt: todayISO(),
            source: 'world_map' as const,
            helperHunterIds: allowedHelperHunterIds,
          }
        } else {
          const rank = node.difficultyRank || 'D'
          const recommendedPower = node.difficulty || 1000
          
          let monsterIds = ['lazy-goblin']
          if (rank === 'E') monsterIds = ['rift-rat', 'rift-stray']
          else if (rank === 'D') monsterIds = ['lazy-goblin', 'sloth-brute']
          else if (rank === 'C') monsterIds = ['forgetting-warden', 'fatigue-warden']
          else if (rank === 'B') monsterIds = ['memory-tracker', 'memory-scout']
          else if (rank === 'A') monsterIds = ['greed-warden', 'memory-scout']
          else if (rank === 'S' || rank === 'National') monsterIds = ['forgetting-warden', 'greed-warden']

          customGateDef = {
            id: nodeId,
            name: node.name || '심연의 균열',
            subRegionId: node.subRegionId || node.regionId,
            description: `${node.name || '심연의 균열'}의 정화 작전입니다.`,
            rank: (rank === 'National' ? 'S' : rank),
            recommendedLevel: rank === 'E' ? 5 : rank === 'D' ? 15 : rank === 'C' ? 30 : rank === 'B' ? 45 : rank === 'A' ? 60 : 80,
            recommendedPower: recommendedPower,
            monsterIds: monsterIds,
            rewardTableId: `reward-gate-${(rank === 'National' ? 's' : rank).toLowerCase()}-basic` || 'reward-gate-d-basic',
            failPenaltyId: 'penalty-gate-basic',
            expiresInHours: 72,
          }
        }

        // 2) get().spawnGate(dynamicGateId, 'worldmap', helperHunterIds, customGateDef)
        get().spawnGate(nodeId, 'worldmap', helperHunterIds, customGateDef)
        const spawnedWorldGate = get().activeWorldGate
        if (!spawnedWorldGate || spawnedWorldGate.status !== 'active' || spawnedWorldGate.gateId !== nodeId) {
          set({
            messages: appendMessageOnce(get().messages, {
              id: uid(),
              kind: 'info',
              title: '진입 차단',
              lines: ['월드맵 게이트 활성화에 실패했습니다. 이미 열린 게이트 상태를 확인한 뒤 다시 시도하십시오.'],
              createdAt: todayISO(),
            })
          })
          return
        }

        if (isMonarchId && manualSession) {
          set({
            activeRiftNodeId: nodeId,
            manualBattleSession: manualSession
          })
        } else {
          set({ activeRiftNodeId: nodeId })
        }
      },

      performWorldManualBattleAction: (action) => {},

      cancelWorldManualBattle: () => {
        get().cancelWorldBattle()
      },

      switchWorldManualBattleToAuto: () => {},
      attemptShadowExtraction: (gateInstanceId) => {
        const s = get()
        const activeGate = s.activeGate?.instanceId === gateInstanceId
          ? s.activeGate
          : s.activeWorldGate?.instanceId === gateInstanceId
          ? s.activeWorldGate
          : undefined
        if (!activeGate || activeGate.instanceId !== gateInstanceId) return
        const gate = GATE_DEFINITIONS.find(item => item.id === activeGate.gateId) ?? activeGate.customGateDef
        if (!gate) return
        const victoryLog = s.combatLogs.find(log => log.gateInstanceId === gateInstanceId && log.result === 'victory')
        if (!victoryLog) return
        if ((s.shadowExtractHistory ?? []).some(result => result.gateInstanceId === gateInstanceId)) return

        const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
        
        // 12-40D: 실패 횟수 누적에 따른 공명 보정율 산출 (1회당 +5%, 최대 80%)
        const failCountMap = s.shadowExtractFailCount ?? {}
        const failCount = failCountMap[gate.id] ?? 0
        const bonusChance = Math.min(0.80, failCount * 0.05)

        const redGateState = activeGate.runState?.redGateState
        // 12-40F: 현실 준비도 기반 추출 보너스 합산
        const dpExtractBonus = (s.dailyProgression?.dateKey === getActivePlanDateKey(s.quests))
          ? (s.dailyProgression?.extractionBonus ?? 0)
          : 0
        const rawResult = rollShadowExtraction(gate, s.hunter, equippedShadows, Math.random, bonusChance + dpExtractBonus, redGateState)

        
        const nextFailCountMap = { ...failCountMap }
        const nextFragments = { ...(s.shadowFragments ?? {}) }

        if (rawResult.success) {
          nextFailCountMap[gate.id] = 0
        } else {
          nextFailCountMap[gate.id] = failCount + 1
          if (rawResult.rewardFragmentId) {
            const fid = rawResult.rewardFragmentId
            const count = rawResult.rewardFragmentCount ?? 1
            nextFragments[fid] = (nextFragments[fid] ?? 0) + count
          }
        }

        const isRed = redGateState && (redGateState.status === 'opened' || redGateState.status === 'cleared')
        const result: ShadowExtractResult = {
          ...rawResult,
          gateInstanceId,
          resonanceBonusPercent: nextFailCountMap[gate.id] * 5,
          redGateExtraction: isRed ? {
            isRedGate: true,
            highGradeBonusPercent: redGateState.highGradeShadowBonus ?? 0,
            bossShadowWeightBonusPercent: redGateState.bossShadowWeightBonus ?? 0,
            fragmentBonusCount: redGateState.fragmentBonusCount ?? 0
          } : undefined
        }

        const ownedShadows = result.success && result.shadow
          ? [...(s.ownedShadows ?? []), result.shadow]
          : (s.ownedShadows ?? [])

        const addedSignals: string[] = ['shadow-extraction-attempt']
        if (result.success && result.shadow) {
          addedSignals.push('shadow-extract-success')
          const isRarePlus = ['rare', 'epic', 'legendary'].includes(result.shadow.rarity)
          if (isRarePlus) {
            addedSignals.push('shadow-rare-acquired')
          }
          const isNamed = result.shadow.isNamed || result.shadow.isGateNamed || result.shadow.isAchievementNamed
          if (isNamed) {
            addedSignals.push('shadow-named-acquired')
          }
        }

        let nextHunter = s.hunter
        addedSignals.forEach(sig => {
          nextHunter = addHiddenSignalToState(nextHunter, sig)
        })

        set(applySecretProgressEvent(s, {
          context: 'shadow',
          action: 'extract',
          success: result.success,
          named: Boolean(result.shadow?.isGateNamed || result.shadow?.isAchievementNamed),
        }, {
          ownedShadows,
          lastShadowExtractResult: result,
          shadowExtractHistory: [result, ...(s.shadowExtractHistory ?? [])].slice(0, 50),
          shadowExtractFailCount: nextFailCountMap,
          shadowFragments: nextFragments,
          hunter: nextHunter
        }))

        if (activeGate.source === 'worldmap') {
          get().markRiftNodeCleared(activeGate.gateId)
          set({
            activeWorldGate: undefined,
            activeRiftNodeId: undefined,
            manualBattleSession: undefined,
          })
        }

        setTimeout(() => {
          const nextFailCount = nextFailCountMap[gate.id] ?? 0
          if (result.success && result.shadow) {
            const isNamed = result.shadow.isNamed || result.shadow.isGateNamed || result.shadow.isAchievementNamed
            const isBoss = gate.rank === 'S' || gate.rewardTableId?.includes('boss')
            if (isNamed) {
              get().emitWorldSignal('extraction_named_echo')
            } else if (isBoss) {
              get().emitWorldSignal('extraction_boss_success')
            }
          } else {
            if (nextFailCount >= 3) {
              get().emitWorldSignal('extraction_silence')
            } else {
              get().emitWorldSignal('extraction_fail_echo')
            }
          }
          get().checkJobAwakening()
          get().recalculateHunterGrade('그림자 추출')
        }, 0)
      },

      equipShadow: (shadowId) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const targetShadow = ownedShadows.find(shadow => shadow.instanceId === shadowId)
        if (!targetShadow || targetShadow.collapsed) return {} // 붕괴된 그림자는 출전 불가 (12-44Z-FINAL)
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

      applyMainQuestCompletionBonus: (quest) => set((s) => {
        // 1. Roll a random unowned Legendary Shadow
        const legendaryDefs = SHADOW_DEFINITIONS.filter(def => def.rarity === 'legendary')
        const ownedIds = new Set((s.ownedShadows ?? []).map(x => x.definitionId))
        const unownedDefs = legendaryDefs.filter(def => !ownedIds.has(def.id))
        
        let newShadow: OwnedShadow | undefined = undefined
        let additionalShards: Partial<Record<ShadowSummonShardType, number>> = {}
        let shadowMessage = ''

        if (unownedDefs.length > 0) {
          const chosen = unownedDefs[Math.floor(Math.random() * unownedDefs.length)]
          newShadow = createOwnedShadow(chosen, Math.random)
          shadowMessage = `· 그림자 군단 합류: [LEGENDARY] ${newShadow.name}`
        } else {
          // If all legendary shadows are owned, give named shards as compensation
          additionalShards = { named: 10 }
          shadowMessage = `· 그림자 보상: [네임드 소환 조각 +10] (모든 전설 그림자 보유 중)`
        }

        // 2. Roll random Epic or Legendary equipment item from ITEM_POOL
        const highTierPool = ITEM_POOL.filter(item => item.rarity === 'epic' || item.rarity === 'legendary')
        const pickedTemplate = highTierPool[Math.floor(Math.random() * highTierPool.length)] ?? ITEM_POOL[0]
        const newEquipment = instantiateItem(pickedTemplate, 'high_boss')
        const equipmentMessage = `· 장비 획득: [${newEquipment.rarity.toUpperCase()}] ${newEquipment.icon} ${newEquipment.name} (${newEquipment.equipmentStars}성)`

        // 3. Substantial Currency
        const goldReward = 10000
        const essenceReward = 1500

        // 4. Build consolidated celebration message
        const rewardLines = [
          shadowMessage,
          equipmentMessage,
          `· Gold +${goldReward}`,
          `· 그림자 정수 +${essenceReward}`,
        ]

        const mainCompleteMessage: SystemMessage = {
          id: uid(),
          kind: 'shadow' as const,
          title: `🏆 메인 퀘스트 최종 완료 기념 보상`,
          lines: [
            `"${quest.title}" 완수를 기념하여 전설적인 전리품이 지급되었습니다.`,
            ...rewardLines
          ],
          createdAt: todayISO(),
        }

        return {
          gold: (s.gold ?? 0) + goldReward,
          shadowEssence: (s.shadowEssence ?? 0) + essenceReward,
          ownedShadows: newShadow ? [...(s.ownedShadows ?? []), newShadow] : s.ownedShadows,
          items: [...s.items, newEquipment],
          shadowSummonShards: addShadowSummonShards(s.shadowSummonShards, additionalShards),
          messages: [...s.messages, mainCompleteMessage],
        }
      }),

      summonShadowFromTicket: (ticketId) => set((s) => {
        const tickets = s.shadowSummonTickets ?? []
        const ticket = tickets.find(item => item.id === ticketId && !item.usedAt)
        if (!ticket) return {}
        const ownedDefinitionIds = new Set((s.ownedShadows ?? []).map(shadow => shadow.definitionId))
        const pool = getTicketCandidatePool(s, ticket)
        const definition = isStandardShadowSummonTicketType(ticket.ticketType)
          ? pickStandardShadowSummonDefinition(ticket.ticketType, Math.random, {
              role: ticket.ticketType === 'role_shadow' ? ticket.role : undefined,
              excludeDefinitionIds: ownedDefinitionIds,
            })
          : (() => {
              const unownedPool = pool.filter(def => !ownedDefinitionIds.has(def.id))
              const candidatePool = unownedPool.length > 0 ? unownedPool : pool
              return candidatePool[Math.floor(Math.random() * candidatePool.length)]
            })()
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
        const originalAssigned = s.shadowAutoSweepState?.assignedShadowIds ?? []
        const nextAssigned = originalAssigned.filter(id => id !== material.instanceId)
        return {
          ownedShadows: nextOwned,
          shadowAutoSweepState: s.shadowAutoSweepState ? {
            ...s.shadowAutoSweepState,
            assignedShadowIds: nextAssigned
          } : undefined,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: '그림자 흡수',
            lines: [`[${SHADOW_RARITY_LABEL[target.rarity]}] ${target.name} +${nextLevel} (재료: ${material.name})`],
            createdAt: todayISO(),
          }],
        }
      }),

      enhanceShadowWithStone: (shadowInstanceId, stoneRarity) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const shadow = ownedShadows.find(sh => sh.instanceId === shadowInstanceId)
        if (!shadow) return {}

        const stones = s.shadowEnhanceStones ?? { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 }
        const stoneCount = stones[stoneRarity] ?? 0

        if (!canEnhanceShadowWithStone(shadow, stoneRarity, stoneCount)) return {}

        // Consume 1 stone
        const nextStones = {
          ...stones,
          [stoneRarity]: Math.max(0, stoneCount - 1)
        }

        // Roll probability
        const prob = getEnhanceProbability(shadow, stoneRarity)
        const success = Math.random() < prob

        const currentLevel = shadow.enhancementLevel ?? 0
        let nextLevel = currentLevel
        let logLine = ''

        if (success) {
          nextLevel = currentLevel + 1
          logLine = `[${SHADOW_RARITY_LABEL[shadow.rarity]}] ${shadow.name} +${nextLevel} 강화 성공! (사용: ${SHADOW_RARITY_LABEL[stoneRarity]} 강화석, 확률: ${(prob * 100).toFixed(0)}%)`
        } else {
          logLine = `[${SHADOW_RARITY_LABEL[shadow.rarity]}] ${shadow.name} +${currentLevel + 1} 강화 실패 (사용: ${SHADOW_RARITY_LABEL[stoneRarity]} 강화석, 확률: ${(prob * 100).toFixed(0)}%)`
        }

        const nextOwned = ownedShadows.map(sh =>
          sh.instanceId === shadowInstanceId
            ? { ...sh, enhancementLevel: nextLevel }
            : sh
        )

        return {
          ownedShadows: nextOwned,
          shadowEnhanceStones: nextStones,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: success ? '그림자 강화 성공' : '그림자 강화 실패',
            lines: [logLine],
            createdAt: todayISO(),
          }]
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
        const originalAssigned = s.shadowAutoSweepState?.assignedShadowIds ?? []
        const nextAssigned = originalAssigned.filter(id => id !== shadowInstanceId)
        return {
          ownedShadows: nextOwned,
          shadowEssence: (s.shadowEssence ?? 0) + essence,
          shadowAutoSweepState: s.shadowAutoSweepState ? {
            ...s.shadowAutoSweepState,
            assignedShadowIds: nextAssigned
          } : undefined,
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
        const nextHunter = addHiddenSignalToState(s.hunter, 'shadow-evolved')
        setTimeout(() => {
          get().recalculateHunterGrade('그림자 진화')
        }, 0)
        return applySecretProgressEvent(s, { context: 'shadow', action: 'evolve', shadowInstanceId }, {
          ownedShadows: nextOwned,
          shadowEssence: (s.shadowEssence ?? 0) - cost,
          hunter: nextHunter,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: '그림자 진화',
            lines: [`[${shadow.name}]이(가) [${targetDef.name}](으)로 진화했습니다.`],
            createdAt: todayISO(),
          }],
        })
      }),

      mutateShadow: (shadowInstanceId, materialGrade) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const shadow = ownedShadows.find(sh => sh.instanceId === shadowInstanceId)
        if (!shadow) return {}

        if ((shadow.mutation?.mutationStage ?? 0) >= MAX_SHADOW_MUTATION_STAGE) {
          return {}
        }

        let mNormal = s.mutationMaterialNormal ?? 0
        let mAdvanced = s.mutationMaterialAdvanced ?? 0
        let mSupreme = s.mutationMaterialSupreme ?? 0

        if (materialGrade === 'normal') {
          if (mNormal < 1) return {}
          mNormal -= 1
        } else if (materialGrade === 'advanced') {
          if (mAdvanced < 1) return {}
          mAdvanced -= 1
        } else if (materialGrade === 'supreme') {
          if (mSupreme < 1) return {}
          mSupreme -= 1
        } else {
          return {}
        }

        const mutatedShadow = generateMutation(shadow, materialGrade)

        const nextOwned = ownedShadows.map(sh =>
          sh.instanceId === shadowInstanceId ? mutatedShadow : sh
        )

        const gradeLabels = {
          normal: '일반',
          advanced: '고급',
          supreme: '최고급',
        }

        const lines = [
          `[${shadow.name}]에게 ${gradeLabels[materialGrade]} 변이 재료를 주입하여 외형과 능력치를 변조했습니다.`,
          `변이 단계: ${mutatedShadow.mutation?.mutationStage ?? 1}단계`,
        ]

        return {
          ownedShadows: nextOwned,
          mutationMaterialNormal: mNormal,
          mutationMaterialAdvanced: mAdvanced,
          mutationMaterialSupreme: mSupreme,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: '그림자 변이 완료',
            lines,
            createdAt: todayISO(),
          }],
        }
      }),

      assignShadowToAutoSweep: (shadowInstanceId) => {
        // 1. Silent claim of any pending rewards
        get().claimAutoSweepRewards()

        // 2. Add shadow and reset timer to now
        set((s) => {
          const assigned = s.shadowAutoSweepState?.assignedShadowIds ?? []
          if (assigned.includes(shadowInstanceId)) return {}
          if (assigned.length >= 6) return {}
          const exists = (s.ownedShadows ?? []).some(sh => sh.instanceId === shadowInstanceId)
          if (!exists) return {}

          return {
            shadowAutoSweepState: {
              lastClaimTime: new Date().toISOString(),
              assignedShadowIds: [...assigned, shadowInstanceId]
            }
          }
        })
      },

      removeShadowFromAutoSweep: (shadowInstanceId) => {
        // 1. Silent claim of any pending rewards
        get().claimAutoSweepRewards()

        // 2. Remove shadow and reset timer to now
        set((s) => {
          const assigned = s.shadowAutoSweepState?.assignedShadowIds ?? []
          if (!assigned.includes(shadowInstanceId)) return {}

          return {
            shadowAutoSweepState: {
              lastClaimTime: new Date().toISOString(),
              assignedShadowIds: assigned.filter(id => id !== shadowInstanceId)
            }
          }
        })
      },

      claimAutoSweepRewards: () => {
        let resultPayload: { gold: number; shadowEssence: number; xp: number; items: { name: string; icon: string; quantity: number }[]; elapsedMinutes: number; mutatedNames: string[] } | null = null

        set((s) => {
          const now = new Date()
          const lastClaim = new Date(s.shadowAutoSweepState?.lastClaimTime ?? now.toISOString())
          const elapsedMs = now.getTime() - lastClaim.getTime()
          const elapsedMinutes = Math.floor(elapsedMs / 60000)

          const originalAssigned = s.shadowAutoSweepState?.assignedShadowIds ?? []
          const ownedSet = new Set((s.ownedShadows ?? []).map(sh => sh.instanceId))
          const assignedIds = originalAssigned.filter(id => ownedSet.has(id))
          const hasInvalid = originalAssigned.length !== assignedIds.length

          if (assignedIds.length === 0) {
            resultPayload = null
            return {
              shadowAutoSweepState: {
                lastClaimTime: now.toISOString(),
                assignedShadowIds: []
              }
            }
          }

          if (elapsedMinutes <= 0) {
            resultPayload = null
            if (hasInvalid) {
              return {
                shadowAutoSweepState: {
                  lastClaimTime: s.shadowAutoSweepState?.lastClaimTime ?? now.toISOString(),
                  assignedShadowIds: assignedIds
                }
              }
            }
            return {}
          }

          const cappedMinutes = Math.min(elapsedMinutes, 1440) // 최대 24시간 누적

          let totalGold = 0
          let totalEssence = 0
          let totalXp = 0
          const addedItemsList: { name: string; icon: string; quantity: number }[] = []

          let nextOwnedShadows = [...(s.ownedShadows ?? [])]
          let nextRunes = [...(s.runes ?? [])]
          let nextItems = [...(s.items ?? [])]
          let nextTickets = [...(s.shadowSummonTickets ?? [])]
          let nextShards = { ...(s.shadowSummonShards ?? {}) }
          const nextEnhanceStones = { ...(s.shadowEnhanceStones ?? { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 }) }

          let addedNormalMat = 0
          let addedAdvancedMat = 0
          let addedSupremeMat = 0

          const mutatedNames: string[] = []
          const logLines: string[] = []

          for (const instanceId of assignedIds) {
            const shadowIdx = nextOwnedShadows.findIndex(sh => sh.instanceId === instanceId)
            if (shadowIdx === -1) continue

            const shadow = nextOwnedShadows[shadowIdx]
            const level = shadow.level ?? 1
            const rarityIndex = SHADOW_RARITY_ORDER.indexOf(shadow.rarity)
            const safeRarityIndex = rarityIndex === -1 ? 0 : rarityIndex

            // Base rewards per minute per shadow
            const baseGold = (safeRarityIndex + 1) * 0.2 + level * 0.02
            const baseEssence = (safeRarityIndex + 1) * 0.05 + level * 0.005
            const baseXp = 0.2 + level * 0.01

            const shadowGold = Math.floor(baseGold * cappedMinutes)
            const shadowEssence = Math.floor(baseEssence * cappedMinutes)
            const shadowXp = Math.floor(baseXp * cappedMinutes)

            totalGold += shadowGold
            totalEssence += shadowEssence
            totalXp += shadowXp

            // Update shadow XP
            let updatedShadow = shadow
            if (shadowXp > 0) {
              const xpRes = addShadowXp(updatedShadow, shadowXp)
              updatedShadow = xpRes.shadow
              if (xpRes.leveledUp) {
                logLines.push(`[${shadow.name}] 레벨 업! Lv.${xpRes.newLevel}`)
              }
            }

            // Roll rewards per minute
            let rolledNormalMat = 0
            let rolledAdvancedMat = 0
            let rolledSupremeMat = 0
            let rolledTicketsCount = 0
            let rolledShardsCount = 0
            let rolledRunesCount = 0
            let rolledEquipsCount = 0
            let rolledStones: Record<ShadowRarity, number> = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 }

            for (let m = 0; m < cappedMinutes; m++) {
              // Roll Mutation Materials
              const rMat = Math.random()
              if (rMat < 0.000125) { // 최고급 0.0125%
                rolledSupremeMat++
              } else if (rMat < 0.000525) { // 고급 0.04%
                rolledAdvancedMat++
              } else if (rMat < 0.001025) { // 일반 0.05%
                rolledNormalMat++
              }

              // Roll Summon Ticket
              if (Math.random() < 0.00025) { // 소환권 0.025%
                rolledTicketsCount++
              }

              // Roll Shards
              if (Math.random() < 0.00025) { // 조각 0.025%
                rolledShardsCount++
              }

              // Roll Rune
              if (Math.random() < 0.00025) { // 룬 0.025%
                rolledRunesCount++
              }

              // Roll Equipment
              if (Math.random() < 0.00025) { // 장비 0.025%
                rolledEquipsCount++
              }

              // Roll Shadow Enhancement Stone
              if (Math.random() < 0.0002) { // 0.02%
                const rolledRarity = rollEnhancementStoneFromBox('common')
                rolledStones[rolledRarity]++
              }
            }

            // Process rolled Supreme materials for this shadow
            for (let i = 0; i < rolledSupremeMat; i++) {
              const isCompatible = true // 최고급은 모든 등급 그림자 호환
              const currentStage = updatedShadow.mutation?.mutationStage ?? 0
              if (isCompatible && currentStage < MAX_SHADOW_MUTATION_STAGE) {
                updatedShadow = generateMutation(updatedShadow, 'supreme')
                mutatedNames.push(updatedShadow.name)
                logLines.push(`[${shadow.name}]이(가) 최고급 변이 재료를 획득하여 스스로 변이했습니다! (${updatedShadow.mutation?.mutationStage}단계)`)
              } else {
                addedSupremeMat++
              }
            }

            // Process rolled Advanced materials for this shadow
            for (let i = 0; i < rolledAdvancedMat; i++) {
              const isCompatible = shadow.rarity !== 'legendary' // 전설은 최고급만 가능하므로 고급 호환 불가
              const currentStage = updatedShadow.mutation?.mutationStage ?? 0
              if (isCompatible && currentStage < MAX_SHADOW_MUTATION_STAGE) {
                updatedShadow = generateMutation(updatedShadow, 'advanced')
                mutatedNames.push(updatedShadow.name)
                logLines.push(`[${shadow.name}]이(가) 고급 변이 재료를 획득하여 스스로 변이했습니다! (${updatedShadow.mutation?.mutationStage}단계)`)
              } else {
                addedAdvancedMat++
              }
            }

            // Process rolled Normal materials for this shadow
            for (let i = 0; i < rolledNormalMat; i++) {
              const isCompatible = shadow.rarity === 'common' || shadow.rarity === 'uncommon' // 일반/비범함 그림자만 일반 재료 가능
              const currentStage = updatedShadow.mutation?.mutationStage ?? 0
              if (isCompatible && currentStage < MAX_SHADOW_MUTATION_STAGE) {
                updatedShadow = generateMutation(updatedShadow, 'normal')
                mutatedNames.push(updatedShadow.name)
                logLines.push(`[${shadow.name}]이(가) 일반 변이 재료를 획득하여 스스로 변이했습니다! (${updatedShadow.mutation?.mutationStage}단계)`)
              } else {
                addedNormalMat++
              }
            }

            // Process rolled Summon tickets for this shadow
            for (let i = 0; i < rolledTicketsCount; i++) {
              const ticket = createShadowSummonTicket({ ticketType: 'normal_shadow', source: 'reward_box' })
              nextTickets.push(ticket)
              const idx = addedItemsList.findIndex(x => x.name === ticket.label)
              if (idx !== -1) addedItemsList[idx].quantity++
              else addedItemsList.push({ name: ticket.label, icon: '🎫', quantity: 1 })
            }

            // Process rolled Shards for this shadow
            if (rolledShardsCount > 0) {
              nextShards = addShadowSummonShards(nextShards, { normal: rolledShardsCount })
              const idx = addedItemsList.findIndex(x => x.name === '그림자 조각')
              if (idx !== -1) addedItemsList[idx].quantity += rolledShardsCount
              else addedItemsList.push({ name: '그림자 조각', icon: '🧩', quantity: rolledShardsCount })
            }

            // Process rolled Runes for this shadow
            for (let i = 0; i < rolledRunesCount; i++) {
              const boxGrade = Math.random() < 0.05 ? 'supreme' : (Math.random() < 0.20 ? 'advanced' : 'normal')
              const rolledRune = generateRandomRune(boxGrade)
              nextRunes.push(rolledRune)
              const idx = addedItemsList.findIndex(x => x.name === rolledRune.name)
              if (idx !== -1) addedItemsList[idx].quantity++
              else addedItemsList.push({ name: rolledRune.name, icon: rolledRune.icon, quantity: 1 })
            }

            // Process rolled Equipment for this shadow
            for (let i = 0; i < rolledEquipsCount; i++) {
              const equippedItems = getEquippedItems(s.items, s.equipment)
              const rolledEquip = randomItem(s.hunter, equippedItems, 0, 0, 'random')
              nextItems.push(rolledEquip)
              const idx = addedItemsList.findIndex(x => x.name === rolledEquip.name)
              if (idx !== -1) addedItemsList[idx].quantity++
              else addedItemsList.push({ name: rolledEquip.name, icon: rolledEquip.icon, quantity: 1 })
            }

            // Process rolled stones for this shadow
            for (const [r, count] of Object.entries(rolledStones) as Array<[ShadowRarity, number]>) {
              if (count > 0) {
                nextEnhanceStones[r] = (nextEnhanceStones[r] ?? 0) + count
                const name = `[${SHADOW_RARITY_LABEL[r]}] 그림자 강화석`
                const idx = addedItemsList.findIndex(x => x.name === name)
                if (idx !== -1) addedItemsList[idx].quantity += count
                else addedItemsList.push({ name, icon: '💎', quantity: count })
              }
            }

            // Save updated shadow back
            nextOwnedShadows[shadowIdx] = updatedShadow
          }

          // Append mutation materials added to inventory to addedItemsList
          if (addedNormalMat > 0) {
            addedItemsList.push({ name: '일반 변이 재료', icon: '🧪', quantity: addedNormalMat })
          }
          if (addedAdvancedMat > 0) {
            addedItemsList.push({ name: '고급 변이 재료', icon: '🧪', quantity: addedAdvancedMat })
          }
          if (addedSupremeMat > 0) {
            addedItemsList.push({ name: '최고급 변이 재료', icon: '🧪', quantity: addedSupremeMat })
          }

          resultPayload = {
            gold: totalGold,
            shadowEssence: totalEssence,
            xp: totalXp,
            items: addedItemsList,
            elapsedMinutes,
            mutatedNames,
          }

          return {
            gold: (s.gold ?? 0) + totalGold,
            shadowEssence: (s.shadowEssence ?? 0) + totalEssence,
            ownedShadows: nextOwnedShadows,
            runes: nextRunes,
            items: nextItems,
            shadowSummonTickets: nextTickets,
            shadowSummonShards: nextShards,
            shadowEnhanceStones: nextEnhanceStones,
            mutationMaterialNormal: (s.mutationMaterialNormal ?? 0) + addedNormalMat,
            mutationMaterialAdvanced: (s.mutationMaterialAdvanced ?? 0) + addedAdvancedMat,
            mutationMaterialSupreme: (s.mutationMaterialSupreme ?? 0) + addedSupremeMat,
            shadowAutoSweepState: {
              lastClaimTime: now.toISOString(),
              assignedShadowIds: assignedIds,
            },
            messages: [
              ...s.messages,
              {
                id: uid(),
                kind: 'shadow' as const,
                title: '그림자 자동 소탕 보상 수령',
                lines: [
                  `소탕 시간: ${elapsedMinutes}분 경과 (최대 1440분 누적)`,
                  `골드 +${totalGold}`,
                  `그림자 정수 +${totalEssence}`,
                  ...logLines,
                  ...addedItemsList.map(item => `${item.name} +${item.quantity}개`),
                ],
                createdAt: todayISO(),
              }
            ]
          }
        })

        return resultPayload
      },

      trainShadowWithEssence: (shadowInstanceId, optionId) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const shadow = ownedShadows.find(sh => sh.instanceId === shadowInstanceId)
        if (!shadow) return {}
        const maxLevel = getShadowMaxLevel(shadow)
        if ((shadow.level ?? 1) >= maxLevel) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow' as const,
              title: '훈련 불가',
              lines: [`${shadow.name}은(는) 이미 최대 레벨(Lv.${maxLevel})에 도달했습니다.`],
              createdAt: todayISO(),
            }],
          }
        }
        const option = SHADOW_TRAINING_OPTIONS.find(opt => opt.id === optionId)
        if (!option) return {}
        const cost = Math.ceil(option.essenceCost * getShadowTrainingCostMultiplier(shadow))
        const currentEssence = s.shadowEssence ?? 0
        if (currentEssence < cost) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow' as const,
              title: '그림자 정수 부족',
              lines: ['그림자 정수가 부족합니다.'],
              createdAt: todayISO(),
            }],
          }
        }

        const xpResult = addShadowXp(shadow, option.xpGain)
        const nextOwned = ownedShadows.map(sh =>
          sh.instanceId === shadowInstanceId ? xpResult.shadow : sh
        )

        const levelUpLine = xpResult.leveledUp
          ? ` (레벨 업! Lv.${shadow.level} -> Lv.${xpResult.newLevel})`
          : ''

        return {
          ownedShadows: nextOwned,
          shadowEssence: currentEssence - cost,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: '집중 훈련',
            lines: [
              `[${option.name}] ${shadow.name}에게 XP +${option.xpGain} 지급${levelUpLine}.`,
              `소모된 그림자 정수: ${cost}개 (보유 그림자 정수: ${currentEssence - cost}개)`,
            ],
            createdAt: todayISO(),
          }],
        }
      }),

      buyShadowTicketWithEssence: () => set((s) => {
        const cost = 60
        const currentEssence = s.shadowEssence ?? 0
        if (currentEssence < cost) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'info' as const,
              title: '구매 불가',
              lines: ['그림자 정수가 부족합니다.'],
              createdAt: todayISO(),
            }],
          }
        }
        const ticket: ShadowSummonTicket = {
          id: `ticket-${uid()}`,
          ticketType: 'normal_shadow',
          label: '일반 그림자 소환권',
          createdAt: todayISO(),
          source: 'system',
        }
        return {
          shadowEssence: currentEssence - cost,
          shadowSummonTickets: [ticket, ...(s.shadowSummonTickets ?? [])],
          messages: [...s.messages, {
            id: uid(),
            kind: 'info' as const,
            title: '소환권 구매 완료',
            lines: [
              `그림자 정수 ${cost}개를 소모해 일반 그림자 소환권을 1장 구매했습니다.`,
              `(보유 그림자 정수: ${currentEssence - cost}개)`,
            ],
            createdAt: todayISO(),
          }],
        }
      }),

      buyExtractionCatalystWithEssence: () => set((s) => {
        const cost = 30
        const currentEssence = s.shadowEssence ?? 0
        if (currentEssence < cost) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'info' as const,
              title: '구매 불가',
              lines: ['그림자 정수가 부족합니다.'],
              createdAt: todayISO(),
            }],
          }
        }
        const catalystItem: Item = {
          id: `catalyst-${uid()}`,
          name: '그림자 추출 보조 촉매',
          icon: '🧪',
          rarity: 'rare',
          description: '게이트 클리어 후 그림자 추출 시 성공률을 +5% 보정합니다. (다음 추출 시 자동 소모)',
          acquiredAt: todayISO(),
          consumable: true,
        }
        return {
          shadowEssence: currentEssence - cost,
          items: [catalystItem, ...(s.items ?? [])],
          messages: [...s.messages, {
            id: uid(),
            kind: 'info' as const,
            title: '촉매 구매 완료',
            lines: [
              `그림자 정수 ${cost}개를 소모해 그림자 추출 보조 촉매를 1개 구매했습니다.`,
              `(보유 그림자 정수: ${currentEssence - cost}개)`,
            ],
            createdAt: todayISO(),
          }],
        }
      }),

      reawakenShadowInnateGrade: (shadowInstanceId) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const shadow = ownedShadows.find(sh => sh.instanceId === shadowInstanceId)
        if (!shadow) return {}
        if ((shadow.level ?? 1) < 10 || (shadow.enhancementLevel ?? 0) < 3) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow' as const,
              title: '재각성 불가',
              lines: ['레벨 10 이상 및 강화 +3 이상인 그림자만 재각성 연구가 가능합니다.'],
              createdAt: todayISO(),
            }],
          }
        }
        if (shadow.innateGrade === 'S') {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow' as const,
              title: '재각성 불가',
              lines: ['이미 최고 등급(S 태생)에 도달한 그림자입니다.'],
              createdAt: todayISO(),
            }],
          }
        }
        const cost = 100
        const currentEssence = s.shadowEssence ?? 0
        if (currentEssence < cost) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow' as const,
              title: '그림자 정수 부족',
              lines: ['연구를 수행하기 위한 그림자 정수가 부족합니다.'],
              createdAt: todayISO(),
            }],
          }
        }

        const currentGrade = shadow.innateGrade ?? 'B'
        let nextGrade: ShadowInnateGrade = currentGrade
        let success = false
        const roll = Math.random()

        if (currentGrade === 'C') {
          if (roll < 0.50) { // 50% 성공률
            nextGrade = 'B'
            success = true
          }
        } else if (currentGrade === 'B') {
          if (roll < 0.30) { // 30% 성공률
            nextGrade = 'A'
            success = true
          }
        } else if (currentGrade === 'A') {
          if (roll < 0.10) { // 10% 성공률
            nextGrade = 'S'
            success = true
          }
        }

        const nextOwned = ownedShadows.map(sh =>
          sh.instanceId === shadowInstanceId
            ? { ...sh, innateGrade: nextGrade }
            : sh
        )

        return {
          ownedShadows: nextOwned,
          shadowEssence: currentEssence - cost,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: success ? '태생 재각성 성공!' : '태생 재각성 실패',
            lines: success
              ? [
                  `[재각성 성공] ${shadow.name}의 태생 등급이 ${currentGrade}에서 ${nextGrade}(으)로 상승했습니다!`,
                  `소모된 그림자 정수: ${cost}개 (보유 그림자 정수: ${currentEssence - cost}개)`,
                ]
              : [
                  `[재각성 실패] ${shadow.name}의 태생 등급 재각성에 실패했습니다. 등급이 ${currentGrade}로 보존됩니다.`,
                  `소모된 그림자 정수: ${cost}개 (보유 그림자 정수: ${currentEssence - cost}개)`,
                ],
            createdAt: todayISO(),
          }],
        }
      }),

      rerollShadowTrait: (shadowInstanceId, slotIndex) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const shadow = ownedShadows.find(sh => sh.instanceId === shadowInstanceId)
        if (!shadow) return {}
        
        const maxSlots = getShadowMaxTraitSlots(shadow)
        if (slotIndex >= maxSlots) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow' as const,
              title: '특성 개방 불가',
              lines: [`${shadow.name}은(는) 해당 특성 슬롯을 사용할 수 없는 등급/상태입니다.`],
              createdAt: todayISO(),
            }]
          }
        }

        const rerolls = shadow.traitRerollCount ?? 0
        const baseCost = 100 + rerolls * 10
        const cost = Math.ceil(baseCost * getShadowTrainingCostMultiplier(shadow))
        const currentEssence = s.shadowEssence ?? 0
        
        if (currentEssence < cost) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow' as const,
              title: '그림자 정수 부족',
              lines: ['특성 재굴림을 수행하기 위한 그림자 정수가 부족합니다.'],
              createdAt: todayISO(),
            }]
          }
        }

        const currentIds = shadow.traitIds ? [...shadow.traitIds] : []
        const exclude = currentIds.filter(Boolean) as string[]
        const newTrait = rollShadowTraitDefinition(shadow.role, exclude)
        
        currentIds[slotIndex] = newTrait.id

        const nextOwned = ownedShadows.map(sh =>
          sh.instanceId === shadowInstanceId
            ? { ...sh, traitIds: currentIds, traitRerollCount: rerolls + 1 }
            : sh
        )

        return {
          ownedShadows: nextOwned,
          shadowEssence: currentEssence - cost,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: '특성 부여 성공',
            lines: [
              `[특성 성공] ${shadow.name}의 ${slotIndex + 1}번째 슬롯에 [${newTrait.name}] 특성이 부여되었습니다!`,
              `효과: ${newTrait.description}`,
              `소모된 그림자 정수: ${cost}개 (보유 그림자 정수: ${currentEssence - cost}개)`,
            ],
            createdAt: todayISO(),
          }]
        }
      }),

      unlockShadowSlot: (shadowInstanceId, slotType) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const shadow = ownedShadows.find(sh => sh.instanceId === shadowInstanceId)
        if (!shadow) return {}

        const isNamed = shadow.isAchievementNamed || shadow.isGateNamed || shadow.rank === 'named'
        const isLevelOk = (shadow.level ?? 1) >= 10
        const isEnhanceOk = (shadow.enhancementLevel ?? 0) >= 2
        const isRarityOrEvolutionOk = ['rare', 'epic', 'legendary'].includes(shadow.rarity) || (shadow.evolutionStage ?? 0) > 0
        
        const canUnlock = isNamed || (isLevelOk && isEnhanceOk && isRarityOrEvolutionOk)
        if (!canUnlock) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow' as const,
              title: '슬롯 개방 조건 미달',
              lines: [`레벨 10 이상, 강화 +2 이상, 희귀(Rare) 등급 이상의 그림자만 슬롯을 개방할 수 있습니다.`],
              createdAt: todayISO(),
            }]
          }
        }

        const currentSlots = slotType === 'skill' ? (shadow.unlockedSkillSlots ?? 0) : (shadow.unlockedPassiveSlots ?? 0)
        if (currentSlots >= 2) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow' as const,
              title: '슬롯 최대 도달',
              lines: [`이미 최대 슬롯 개수(2개)에 도달했습니다.`],
              createdAt: todayISO(),
            }]
          }
        }

        const baseCost = slotType === 'skill' ? (currentSlots === 0 ? 200 : 350) : (currentSlots === 0 ? 150 : 300)
        const cost = Math.ceil(baseCost * getShadowTrainingCostMultiplier(shadow))
        const currentEssence = s.shadowEssence ?? 0

        if (currentEssence < cost) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'shadow' as const,
              title: '그림자 정수 부족',
              lines: ['슬롯 개방을 위한 그림자 정수가 부족합니다.'],
              createdAt: todayISO(),
            }]
          }
        }

        const nextOwned = ownedShadows.map(sh => {
          if (sh.instanceId !== shadowInstanceId) return sh
          if (slotType === 'skill') {
            return { ...sh, unlockedSkillSlots: currentSlots + 1 }
          } else {
            return { ...sh, unlockedPassiveSlots: currentSlots + 1 }
          }
        })

        return {
          ownedShadows: nextOwned,
          shadowEssence: currentEssence - cost,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: slotType === 'skill' ? '스킬 슬롯 개방 완료' : '패시브 슬롯 개방 완료',
            lines: [
              `${shadow.name}의 ${slotType === 'skill' ? '액티브 스킬' : '패시브'} 슬롯이 추가로 개방되었습니다!`,
              `소모된 그림자 정수: ${cost}개 (보유 그림자 정수: ${currentEssence - cost}개)`,
            ],
            createdAt: todayISO(),
          }]
        }
      }),

      equipShadowSlotAbility: (shadowInstanceId, slotType, slotIndex, abilityId) => set((s) => {
        const ownedShadows = s.ownedShadows ?? []
        const shadow = ownedShadows.find(sh => sh.instanceId === shadowInstanceId)
        if (!shadow) return {}

        const nextOwned = ownedShadows.map(sh => {
          if (sh.instanceId !== shadowInstanceId) return sh
          if (slotType === 'skill') {
            const current = sh.shadowSkillIds ? [...sh.shadowSkillIds] : []
            current[slotIndex] = abilityId
            return { ...sh, shadowSkillIds: current }
          } else {
            const current = sh.shadowPassiveIds ? [...sh.shadowPassiveIds] : []
            current[slotIndex] = abilityId
            return { ...sh, shadowPassiveIds: current }
          }
        })

        const abilityName = slotType === 'skill' 
          ? SHADOW_SKILL_DEFINITIONS.find(sd => sd.id === abilityId)?.name ?? abilityId
          : SHADOW_PASSIVE_DEFINITIONS.find(pd => pd.id === abilityId)?.name ?? abilityId

        return {
          ownedShadows: nextOwned,
          messages: [...s.messages, {
            id: uid(),
            kind: 'shadow' as const,
            title: slotType === 'skill' ? '스킬 장착 완료' : '패시브 장착 완료',
            lines: [`${shadow.name}의 ${slotIndex + 1}번째 슬롯에 [${abilityName}] 능력이 장착되었습니다.`],
            createdAt: todayISO(),
          }]
        }
      }),

      upgradeLegionNode: (nodeId) => set((s) => {
        const nodeDef = SHADOW_LEGION_NODES.find(n => n.id === nodeId)
        if (!nodeDef) return {}

        const currentNodes = s.shadowLegionNodes ?? {}
        const currentLevel = currentNodes[nodeId] ?? 0
        if (currentLevel >= nodeDef.maxLevel) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'info' as const,
              title: '최대 레벨 도달',
              lines: [`이미 해당 군단 연구가 최대 레벨(Lv.${nodeDef.maxLevel})에 도달했습니다.`],
              createdAt: todayISO(),
            }]
          }
        }

        const cost = nodeDef.costBase + currentLevel * nodeDef.costGrowth
        const currentEssence = s.shadowEssence ?? 0

        if (currentEssence < cost) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'info' as const,
              title: '그림자 정수 부족',
              lines: ['군단 연구 강화를 위한 그림자 정수가 부족합니다.'],
              createdAt: todayISO(),
            }]
          }
        }

        const nextNodes = { ...currentNodes, [nodeId]: currentLevel + 1 }

        return {
          shadowLegionNodes: nextNodes,
          shadowEssence: currentEssence - cost,
          messages: [...s.messages, {
            id: uid(),
            kind: 'info' as const,
            title: '군단 연구 강화 완료',
            lines: [
              `[연구 완료] ${nodeDef.name} 연구가 Lv.${currentLevel + 1}으로 강화되었습니다!`,
              `소모된 그림자 정수: ${cost}개 (보유 그림자 정수: ${currentEssence - cost}개)`,
            ],
            createdAt: todayISO(),
          }]
        }
      }),

      craftHiddenEvolutionMaterial: (itemId) => set((s) => {
        let name = ''
        let desc = ''
        let cost = 0

        if (itemId === 'shadow_hidden_core') {
          name = '그림자 히든 코어'
          desc = '알려지지 않은 어둠의 핵. 군주급 그림자들의 잠재적 히든 진화에 필수적인 매개체입니다.'
          cost = 300
        } else if (itemId === 'abyss_evolution_core') {
          name = '심연의 진화핵'
          desc = '심연 깊은 곳의 마력이 서린 보석. 그림자 군단의 강력한 한계 돌파에 사용됩니다.'
          cost = 400
        } else if (itemId === 'named_shadow_catalyst') {
          name = '네임드 진화 촉매'
          desc = '네임드 그림자들의 성장을 유도하는 응축된 정수의 촉매제입니다.'
          cost = 350
        } else if (itemId === 'ancient_shadow_relic') {
          name = '고대 그림자 성물'
          desc = '아주 오래된 그림자 군주들의 기척이 깃든 유물입니다.'
          cost = 500
        } else {
          return {}
        }

        const currentEssence = s.shadowEssence ?? 0
        if (currentEssence < cost) {
          return {
            messages: [...s.messages, {
              id: uid(),
              kind: 'info' as const,
              title: '그림자 정수 부족',
              lines: ['재료 합성을 위한 그림자 정수가 부족합니다.'],
              createdAt: todayISO(),
            }]
          }
        }

        const craftedItem: Item = {
          id: `item-${uid()}`,
          name,
          icon: '💎',
          rarity: 'legendary',
          description: desc,
          acquiredAt: todayISO(),
          consumable: false,
        }

        return {
          shadowEssence: currentEssence - cost,
          items: [craftedItem, ...(s.items ?? [])],
          messages: [...s.messages, {
            id: uid(),
            kind: 'info' as const,
            title: '히든 재료 합성 완료',
            lines: [
              `[합성 성공] 그림자 정수 ${cost}개를 소모해 [${name}]을(를) 합성했습니다.`,
              `설명: ${desc}`,
              `(보유 그림자 정수: ${currentEssence - cost}개)`,
            ],
            createdAt: todayISO(),
          }]
        }
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
        if (!expedition.isSpecial && (s.expeditionTickets ?? 0) < 1) {
          return {
            ...synced,
            messages: [...s.messages, {
              id: uid(),
              kind: 'info' as const,
              title: '원정 티켓 부족',
              lines: [
                '원정을 시작하려면 원정 티켓이 1장 필요합니다.',
                '💡 원정 티켓은 상점에서 구매하거나 게이트 클리어, 일일 퀘스트, 보상 상자 등에서 얻을 수 있습니다.'
              ],
              createdAt: todayISO(),
            }]
          }
        }

        const firstEvent = expedition.isSpecial
          ? MID_EVENTS.find(e => e.id === `${expedition.specialId}_event_1`)
          : undefined

        return {
          ...synced,
          expeditionTickets: expedition.isSpecial ? (s.expeditionTickets ?? 0) : (s.expeditionTickets ?? 0) - 1,
          activeShadowExpeditionId: expeditionId,
          shadowExpeditions: expeditions.map(item =>
            item.id === expeditionId
              ? {
                  ...item,
                  status: 'in_progress' as const,
                  eventTriggered: expedition.isSpecial ? true : item.eventTriggered,
                  eventResolved: expedition.isSpecial ? false : item.eventResolved,
                  midEvent: firstEvent || item.midEvent,
                  logs: [
                    ...item.logs,
                    {
                      id: uid(),
                      turn: 0,
                      type: 'system' as const,
                      message: expedition.isSpecial
                        ? '특별 원정이 시작되었다. 그림자 군단이 오직 그들의 힘으로만 직면한다.'
                        : '그림자들이 균열 잔재로 진입했다. 헌터는 후방에서 명령을 내린다. (티켓 1장 소모)',
                    },
                    ...(firstEvent ? [{
                      id: uid(),
                      turn: 1,
                      type: 'event' as const,
                      phase: 'threshold' as const,
                      message: `[상황 발생] ${firstEvent.title} — ${firstEvent.description}`,
                    }] : [])
                  ],
                  turn: expedition.isSpecial ? 1 : item.turn,
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
        let addedNormalMat = 0
        let addedAdvancedMat = 0
        let addedSupremeMat = 0
        let rolledRune: RuneItem | undefined = undefined
        let rolledStone: ShadowRarity | undefined = undefined

        if (resolved.result && !expedition.result) {
          const levelUps: string[] = []
          const masteryLevelUps: string[] = []
          const awakenedTraits: string[] = []

          const outcome = resolved.result.outcome
          let masteryXpGained = 5
          if (outcome === 'great_success') masteryXpGained = 50
          else if (outcome === 'success') masteryXpGained = 30
          else if (outcome === 'partial') masteryXpGained = 15

          for (const partyShadow of party) {
            const idx = nextOwnedShadows.findIndex(shadow => shadow.instanceId === partyShadow.instanceId)
            if (idx === -1) continue

            // 1. 일반 경험치 획득 및 레벨업
            const xpResult = addShadowXp(nextOwnedShadows[idx], resolved.result.shadowXpGained)
            let shadowToUpdate = xpResult.shadow
            if (xpResult.leveledUp) levelUps.push(`${partyShadow.name} Lv.${xpResult.newLevel}`)

            // 2. 원정 숙련도 획득 및 레벨업
            let masteryLevel = shadowToUpdate.expeditionLevel ?? 1
            let masteryXp = shadowToUpdate.expeditionMastery ?? 0
            const oldMasteryLevel = masteryLevel

            if (masteryLevel < 10) {
              masteryXp += masteryXpGained
              while (masteryLevel < 10) {
                const neededXp = 100 + (masteryLevel - 1) * 50
                if (masteryXp >= neededXp) {
                  masteryXp -= neededXp
                  masteryLevel += 1
                } else {
                  break
                }
              }
              if (masteryLevel === 10) {
                masteryXp = 0
              }
            }

            shadowToUpdate = {
              ...shadowToUpdate,
              expeditionLevel: masteryLevel,
              expeditionMastery: masteryXp,
            }

            if (masteryLevel > oldMasteryLevel) {
              masteryLevelUps.push(`${partyShadow.name} (Lv.${oldMasteryLevel} ➔ Lv.${masteryLevel})`)
            }

            // 3. 고유 특성 추가 각성 (대성공: 5%, 성공: 2%)
            const traitChance = outcome === 'great_success' ? 0.05 : (outcome === 'success' ? 0.02 : 0)
            if (Math.random() < traitChance) {
              const definition = SHADOW_DEFINITIONS.find(def => def.id === partyShadow.definitionId)
              if (definition) {
                const shadowRole = definition.role
                const currentTraitIds = new Set((shadowToUpdate.traits ?? []).map(t => t.id))
                const traitPool = SHADOW_TRAITS.filter(trait =>
                  (!trait.allowedRoles || trait.allowedRoles.includes(shadowRole)) &&
                  (!trait.allowedRarities || trait.allowedRarities.includes(shadowToUpdate.rarity)) &&
                  !currentTraitIds.has(trait.id)
                )
                if (traitPool.length > 0) {
                  const chosenTrait = traitPool[Math.floor(Math.random() * traitPool.length)]
                  shadowToUpdate = {
                    ...shadowToUpdate,
                    traits: [...(shadowToUpdate.traits ?? []), chosenTrait],
                  }
                  awakenedTraits.push(`${partyShadow.name} [${chosenTrait.name}] 각성 (${chosenTrait.description})`)
                }
              }
            }

            nextOwnedShadows = nextOwnedShadows.map((shadow, index) => index === idx ? shadowToUpdate : shadow)
          }

          // UI 표시용 bonusRewards 배열에 추가
          const bonusRewardLines: string[] = []

          // ── Rune Drop for Shadow Expedition ──
          rolledRune = undefined
          const runeRollChance = outcome === 'great_success' ? 0.40 : outcome === 'success' ? 0.20 : outcome === 'partial' ? 0.05 : 0
          if (Math.random() < runeRollChance) {
            let boxGrade: 'normal' | 'advanced' | 'supreme' = 'normal'
            if (outcome === 'great_success') {
              boxGrade = Math.random() < 0.20 ? 'supreme' : 'advanced'
            } else if (outcome === 'success') {
              boxGrade = Math.random() < 0.08 ? 'advanced' : 'normal'
            }
            rolledRune = generateRandomRune(boxGrade)
          }

          if (rolledRune) {
            bonusRewardLines.push(`원정 전리품: 룬 획득 [${rolledRune.icon} ${rolledRune.name}]`)
          }

          if (masteryLevelUps.length > 0) {
            bonusRewardLines.push(`원정 숙련 상승: ${masteryLevelUps.join(', ')}`)
          }
          if (awakenedTraits.length > 0) {
            bonusRewardLines.push(...awakenedTraits.map(line => `특성 각성: ${line}`))
          }

          const matRoll = Math.random()
          if (outcome === 'great_success') {
            if (matRoll < 0.03) addedSupremeMat = 1
            else if (matRoll < 0.15) addedAdvancedMat = 1
            else if (matRoll < 0.50) addedNormalMat = 1
          } else if (outcome === 'success') {
            if (matRoll < 0.04) addedAdvancedMat = 1
            else if (matRoll < 0.20) addedNormalMat = 1
          }

          if (addedNormalMat > 0) bonusRewardLines.push(`일반 변이 재료 +${addedNormalMat}개`)
          if (addedAdvancedMat > 0) bonusRewardLines.push(`고급 변이 재료 +${addedAdvancedMat}개`)
          if (addedSupremeMat > 0) bonusRewardLines.push(`최고급 변이 재료 +${addedSupremeMat}개`)

          let stoneChance = 0
          if (outcome === 'great_success') stoneChance = 0.25
          else if (outcome === 'success') stoneChance = 0.15
          else if (outcome === 'partial') stoneChance = 0.05

          if (Math.random() < stoneChance) {
            const isGreat = outcome === 'great_success'
            rolledStone = rollGateEnhancementStone('E', isGreat)
          }

          if (rolledStone) {
            bonusRewardLines.push(`원정 전리품: [${SHADOW_RARITY_LABEL[rolledStone]}] 그림자 강화석 획득`)
          }

          if (bonusRewardLines.length > 0) {
            resolved.result.bonusRewards = [
              ...(resolved.result.bonusRewards ?? []),
              ...bonusRewardLines,
            ]
          }

          const hasExpeditionJackpot = resolved.result.bonusRewards?.some(line => line.includes('★원정 대박 잭팟'))
          const expeditionJackpotTitle = hasExpeditionJackpot ? '★대박 잭팟!★ ' : ''

          nextShadowEssence += resolved.result.essenceGained
          nextMessages.push({
            id: uid(),
            kind: 'shadow' as const,
            title: `${expeditionJackpotTitle}그림자 원정 완료`,
            lines: [
              `${resolved.title} 결과: ${SHADOW_EXPEDITION_OUTCOME_LABEL[resolved.result.outcome]}`,
              `파티 전원 그림자 XP +${resolved.result.shadowXpGained}${hasExpeditionJackpot ? ' (잭팟!)' : ''}`,
              `그림자 정수 +${resolved.result.essenceGained}${hasExpeditionJackpot ? ' (잭팟!)' : ''}`,
              ...levelUps.map(line => `레벨업: ${line}`),
              ...(resolved.result.bonusRewards ?? []),
            ],
            createdAt: todayISO(),
          })

          const observationSignalId = resolved.result?.report?.observationSignalId
          if (observationSignalId) {
            setTimeout(() => {
              get().emitWorldSignal(observationSignalId as any)
            }, 0)
          }
          setTimeout(() => {
            set(current => applyChallengeProgress(current, { shadowExpeditionCompleted: true }))
            get().checkJobAwakening()
          }, 0)
        }

        let nextHunter = s.hunter
        if (resolved.result && !expedition.result) {
          const outcome = resolved.result.outcome
          if (outcome === 'success') {
            nextHunter = addHiddenSignalToState(nextHunter, 'shadow-expedition-success')
          } else if (outcome === 'great_success') {
            nextHunter = addHiddenSignalToState(nextHunter, 'shadow-expedition-great')
          }
        }

        const baseState: Partial<GameState> = {
          hunter: nextHunter,
          ownedShadows: nextOwnedShadows,
          shadowEssence: nextShadowEssence,
          runes: [...(s.runes ?? []), ...(rolledRune ? [rolledRune] : [])],
          mutationMaterialNormal: (s.mutationMaterialNormal ?? 0) + addedNormalMat,
          mutationMaterialAdvanced: (s.mutationMaterialAdvanced ?? 0) + addedAdvancedMat,
          mutationMaterialSupreme: (s.mutationMaterialSupreme ?? 0) + addedSupremeMat,
          shadowEnhanceStones: (() => {
            const nextStones = { ...(s.shadowEnhanceStones ?? { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 }) }
            if (rolledStone) {
              nextStones[rolledStone] = (nextStones[rolledStone] ?? 0) + 1
            }
            return nextStones
          })(),
          activeShadowExpeditionId: resolved.status === 'completed' ? undefined : s.activeShadowExpeditionId,
          shadowExpeditions: (s.shadowExpeditions ?? []).map(item => item.id === expeditionId ? resolved : item),
          messages: nextMessages,
        }

        if (resolved.result && !expedition.result) {
          if (resolved.status === 'completed') {
            const tempState = {
              ...s,
              ...baseState,
            }
            const synced = syncTodayShadowExpeditionState(tempState)
            baseState.shadowExpeditions = synced.shadowExpeditions
            baseState.activeShadowExpeditionId = synced.activeShadowExpeditionId
            baseState.lastShadowExpeditionDate = synced.lastShadowExpeditionDate
          }

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
        const choice = expedition.midEvent.choices.find(c => c.id === choiceId)
        if (!choice) return {}
        const party = expedition.selectedShadowIds
          .map(id => (s.ownedShadows ?? []).find(shadow => shadow.instanceId === id))
          .filter((shadow): shadow is OwnedShadow => Boolean(shadow))
        let resolved = resolveExpeditionMidEventChoice(expedition, choiceId, uid, party)
        
        if (resolved.isSpecial) {
          if (resolved.midEvent && resolved.midEvent.id.endsWith('_event_1')) {
            const nextEvent = MID_EVENTS.find(e => e.id === `${resolved.specialId}_event_2`)
            if (nextEvent) {
              resolved = {
                ...resolved,
                eventResolved: false,
                midEvent: nextEvent,
                turn: resolved.turn + 1,
                logs: [
                  ...resolved.logs,
                  {
                    id: uid(),
                    turn: resolved.turn + 1,
                    type: 'event' as const,
                    phase: 'threshold' as const,
                    message: `[상황 발생] ${nextEvent.title} — ${nextEvent.description}`,
                  }
                ]
              }
            }
          } else if (resolved.midEvent && resolved.midEvent.id.endsWith('_event_2')) {
            if (choice.triggerCombat || choiceId === 'engage_combat' || choiceId === 'trigger_abyss_combat') {
              resolved = {
                ...resolved,
                combatTriggered: true,
                combatResolved: false,
                turn: resolved.turn + 1,
                logs: [
                  ...resolved.logs,
                  {
                    id: uid(),
                    turn: resolved.turn + 1,
                    type: 'system' as const,
                    message: '그림자들이 전투 준비를 마쳤습니다. 결전의 막이 오릅니다.',
                  }
                ]
              }
            }
          }
        } else {
          // ticket expedition combat trigger check
          if (choice.triggerCombat) {
            resolved = {
              ...resolved,
              combatTriggered: true,
              combatResolved: false,
              enemyEncounterKey: choice.enemyEncounterKey || 'small_duo',
              enemyBaseLevel: choice.enemyBaseLevel || (resolved.requiredPower ? Math.floor(resolved.requiredPower / 8) : 10),
              turn: resolved.turn + 1,
              logs: [
                ...resolved.logs,
                {
                  id: uid(),
                  turn: resolved.turn + 1,
                  type: 'system' as const,
                  message: '그림자들이 돌발 위협을 포착하고 결전을 시작합니다.',
                }
              ]
            }
          }
        }

        const baseState = {
          shadowExpeditions: (s.shadowExpeditions ?? []).map(item => item.id === expeditionId ? resolved : item),
        }

        if (choiceId === 'investigate' && expedition.midEvent.id === 'echo_expedition_artifact') {
          return applySecretProgressEvent(s, {
            context: 'expedition',
            outcome: 'success',
            isEchoEvent: true,
            shadowIds: expedition.selectedShadowIds,
          }, baseState)
        }

        return baseState
      }),

      resolveSpecialExpeditionBattle: (expeditionId, outcome, battleLogs) => set((s) => {
        const synced = syncTodayShadowExpeditionState(s)
        const expeditions = synced.shadowExpeditions
        const expedition = expeditions.find(item => item.id === expeditionId)
        if (!expedition) return {}

        const partyShadowIds = expedition.selectedShadowIds ?? []
        const partyShadows = (s.ownedShadows ?? []).filter(sh => partyShadowIds.includes(sh.instanceId))

        const logs = [...expedition.logs]
        logs.push({
          id: uid(),
          turn: expedition.turn + 1,
          type: 'system',
          message: outcome === 'victory'
            ? '전투 승리! 균열의 위협을 격퇴했습니다.'
            : '전투 패배. 그림자 군단이 퇴각을 결정했습니다.',
        })

        let nextOwnedShadows = s.ownedShadows ?? []
        let nextCompletedSpecialExpeditionIds = s.completedSpecialExpeditionIds ?? []
        let essenceGained = 0
        let xpGained = 0
        const ticketsGained: ShadowSummonTicket[] = []
        const messages = [...s.messages]
        const nextHiddenAffinity = { ...(s.secretProgress?.hiddenAffinity ?? {}) }

        if (!expedition.isSpecial) {
          // 일상 티켓 원정의 전투 정산
          const resolvedOutcome: ShadowExpeditionOutcome = outcome === 'victory'
            ? (expedition.progress >= 75 ? 'great_success' : 'success')
            : (expedition.progress >= 60 ? 'partial' : 'failure')
          
          const reward = getShadowExpeditionReward(expedition.type, resolvedOutcome, expedition.searchStacks ?? 0, Math.random)
          
          essenceGained = reward.essenceGained
          xpGained = reward.shadowXpGained
          
          // Distribute XP to party shadows
          nextOwnedShadows = nextOwnedShadows.map(sh => {
            if (partyShadowIds.includes(sh.instanceId)) {
              const res = addShadowXp(sh, xpGained)
              if (res.leveledUp) {
                messages.push({
                  id: uid(),
                  kind: 'shadow' as const,
                  title: '그림자 레벨업',
                  lines: [`${sh.name}의 레벨이 올랐습니다! Lv.${res.newLevel}`],
                  createdAt: todayISO(),
                })
              }
              return res.shadow
            }
            return sh
          })

          if (outcome !== 'victory') {
            // Defeat - collapse party shadows
            nextOwnedShadows = nextOwnedShadows.map(shadow => {
              if (partyShadowIds.includes(shadow.instanceId)) {
                return {
                  ...shadow,
                  collapsed: true,
                  status: 'collapsed' as const,
                  collapsedAt: Date.now(),
                  collapseReason: 'special_battle',
                  restoreCost: shadowRestoreCost(shadow),
                }
              }
              return shadow
            })
          }

          messages.push({
            id: uid(),
            kind: 'shadow' as const,
            title: `그림자 원정 완료 (${SHADOW_EXPEDITION_OUTCOME_LABEL[resolvedOutcome]})`,
            lines: [
              `[${expedition.title}] 돌발 전투를 거쳐 원정을 마쳤습니다!`,
              `결과: ${SHADOW_EXPEDITION_OUTCOME_LABEL[resolvedOutcome]}`,
              `그림자 정수 획득: +${essenceGained}`,
              `참가 그림자 경험치 획득: +${xpGained}`,
            ],
            createdAt: todayISO(),
          })
          
          const result = {
            outcome: resolvedOutcome,
            progress: expedition.progress,
            risk: expedition.risk,
            shadowXpGained: xpGained,
            essenceGained: essenceGained,
            bonusRewards: reward.bonusRewards,
            report: buildExpeditionReport(resolvedOutcome, partyShadows[0]?.name ?? '군단'),
            featuredShadowIds: partyShadows[0] ? [partyShadows[0].instanceId] : [],
          }
          
          const nextExpeditions = (s.shadowExpeditions ?? []).map(item => {
            if (item.id === expeditionId) {
              return {
                ...item,
                status: 'completed' as const,
                combatResolved: true,
                combatResult: outcome,
                result,
                logs,
              }
            }
            return item
          })
          
          const activeShadowExpeditionId = s.activeShadowExpeditionId === expeditionId ? undefined : s.activeShadowExpeditionId
          
          const tempState = {
            ...s,
            activeShadowExpeditionId,
            shadowExpeditions: nextExpeditions,
            ownedShadows: nextOwnedShadows,
            shadowEssence: (s.shadowEssence ?? 0) + essenceGained,
            messages,
          }
          
          const syncedFinal = syncTodayShadowExpeditionState(tempState)
          
          const baseState = {
            activeShadowExpeditionId: syncedFinal.activeShadowExpeditionId,
            shadowExpeditions: syncedFinal.shadowExpeditions,
            lastShadowExpeditionDate: syncedFinal.lastShadowExpeditionDate,
            ownedShadows: nextOwnedShadows,
            shadowEssence: (s.shadowEssence ?? 0) + essenceGained,
            messages,
          }
          
          return applySecretProgressEvent(s, {
            context: 'expedition',
            outcome: resolvedOutcome,
            expeditionType: expedition.type,
            shadowIds: partyShadowIds,
          }, baseState)
        }

        // 특별 원정의 전투 정산
        if (outcome === 'victory') {
          const isSanctuary = expedition.specialId === 'special_rift_sanctuary'
          const isWhiteflame = expedition.specialId === 'special_whiteflame'
          const isGraveGuard = expedition.specialId === 'special_grave_guard'
          const isCoordinate = expedition.specialId === 'special_coordinate_collapse'
          const isMonarch = expedition.specialId === 'special_monarch_gaze'
          
          essenceGained = isSanctuary ? 25
            : isWhiteflame ? 35
            : isGraveGuard ? 45
            : isCoordinate ? 40
            : isMonarch ? 60
            : 50 // default fallback
            
          xpGained = isSanctuary ? 100
            : isWhiteflame ? 150
            : isGraveGuard ? 200
            : isCoordinate ? 180
            : isMonarch ? 300
            : 250 // default fallback
            
          const affinityDelta = isSanctuary ? 5
            : isWhiteflame ? 6
            : isGraveGuard ? 7
            : isCoordinate ? 6
            : isMonarch ? 10
            : 8 // default fallback

          if (expedition.specialId && !nextCompletedSpecialExpeditionIds.includes(expedition.specialId)) {
            nextCompletedSpecialExpeditionIds = [...nextCompletedSpecialExpeditionIds, expedition.specialId]
          }

          const ticket: ShadowSummonTicket = {
            id: `special-reward-${expedition.specialId}-${Date.now()}`,
            ticketType: 'rare_shadow',
            label: `특별 원정 보상: 고급 그림자 소환권 (${expedition.title})`,
            createdAt: todayISO(),
            source: 'achievement',
            grade: 's_rank',
          }
          ticketsGained.push(ticket)

          // Distribute XP to party shadows
          nextOwnedShadows = nextOwnedShadows.map(sh => {
            if (partyShadowIds.includes(sh.instanceId)) {
              const res = addShadowXp(sh, xpGained)
              if (res.leveledUp) {
                messages.push({
                  id: uid(),
                  kind: 'shadow' as const,
                  title: '그림자 숙련 레벨업',
                  lines: [`${sh.name}의 원정 숙련 레벨이 올랐습니다! Lv.${res.newLevel}`],
                  createdAt: todayISO(),
                })
              }
              return res.shadow
            }
            return sh
          })

          nextHiddenAffinity.echo = (nextHiddenAffinity.echo ?? 0) + affinityDelta

          messages.push({
            id: uid(),
            kind: 'shadow' as const,
            title: '특별 원정 대성공',
            lines: [
              `[${expedition.title}]을 성공적으로 완수했습니다!`,
              `그림자 정수 획득: +${essenceGained}`,
              `참가 그림자 경험치 획득: +${xpGained}`,
              `획득 보상: ${ticket.label}`,
              `비밀 서사(Echo) 공명도 상승 (+${affinityDelta})`,
            ],
            createdAt: todayISO(),
          })
        } else {
          // Defeat - collapse party shadows but do not delete permanently
          nextOwnedShadows = nextOwnedShadows.map(shadow => {
            if (partyShadowIds.includes(shadow.instanceId)) {
              return {
                ...shadow,
                collapsed: true,
                status: 'collapsed' as const,
                collapsedAt: Date.now(),
                collapseReason: 'special_battle',
                restoreCost: shadowRestoreCost(shadow),
              }
            }
            return shadow
          })

          messages.push({
            id: uid(),
            kind: 'shadow' as const,
            title: '특별 원정 전투 실패',
            lines: [
              `[${expedition.title}] 전투에서 패배했습니다.`,
              `참가 그림자들이 붕괴(Fractured) 상태가 되어 귀환했습니다.`,
              `💡 그림자 정수를 사용하여 붕괴된 그림자들을 복원한 후 다시 도전할 수 있습니다.`,
            ],
            createdAt: todayISO(),
          })
        }

        const featured = partyShadows[0]
        const report = buildExpeditionReport(outcome === 'victory' ? 'great_success' : 'failure', featured?.name ?? '군단')

        const result = {
          outcome: outcome === 'victory' ? ('great_success' as const) : ('failure' as const),
          progress: expedition.progress,
          risk: expedition.risk,
          shadowXpGained: outcome === 'victory' ? xpGained : 0,
          essenceGained: outcome === 'victory' ? essenceGained : 0,
          bonusRewards: outcome === 'victory' ? [`고급 그림자 소환권 x1`] : ['전투 패배: 복귀 후 부상 정산 및 재도전 가능'],
          report,
          featuredShadowIds: featured ? [featured.instanceId] : [],
        }

        const nextExpeditions = (s.shadowExpeditions ?? []).map(item => {
          if (item.id === expeditionId) {
            return {
              ...item,
              status: 'completed' as const,
              combatResolved: true,
              combatResult: outcome,
              result,
              logs,
            }
          }
          return item
        })

        const activeShadowExpeditionId = s.activeShadowExpeditionId === expeditionId ? undefined : s.activeShadowExpeditionId

        const tempState = {
          ...s,
          activeShadowExpeditionId,
          shadowExpeditions: nextExpeditions,
          completedSpecialExpeditionIds: nextCompletedSpecialExpeditionIds,
          shadowSummonTickets: [...(s.shadowSummonTickets ?? []), ...ticketsGained],
          ownedShadows: nextOwnedShadows,
          shadowEssence: (s.shadowEssence ?? 0) + essenceGained,
          secretProgress: {
            ...(s.secretProgress ?? {}),
            hiddenAffinity: nextHiddenAffinity,
          },
          messages,
        }

        const syncedFinal = syncTodayShadowExpeditionState(tempState)

        const baseState = {
          activeShadowExpeditionId: syncedFinal.activeShadowExpeditionId,
          shadowExpeditions: syncedFinal.shadowExpeditions,
          lastShadowExpeditionDate: syncedFinal.lastShadowExpeditionDate,
          completedSpecialExpeditionIds: nextCompletedSpecialExpeditionIds,
          shadowSummonTickets: [...(s.shadowSummonTickets ?? []), ...ticketsGained],
          ownedShadows: nextOwnedShadows,
          shadowEssence: (s.shadowEssence ?? 0) + essenceGained,
          secretProgress: {
            ...(s.secretProgress ?? {}),
            hiddenAffinity: nextHiddenAffinity,
          },
          messages,
        }

        return applySecretProgressEvent(s, {
          context: 'expedition',
          outcome: outcome === 'victory' ? 'great_success' : 'failure',
          expeditionType: expedition.type,
          shadowIds: partyShadowIds,
        }, baseState)
      }),

      retrySpecialExpedition: (expeditionId) => set((s) => {
        return {
          shadowExpeditions: (s.shadowExpeditions ?? []).map(item => {
            if (item.id === expeditionId && item.isSpecial) {
              return {
                ...item,
                status: 'available' as const,
                progress: 0,
                risk: item.specialId === 'special_abyss_resonance' ? 20 : 15,
                turn: 0,
                selectedShadowIds: [],
                result: undefined,
                combatTriggered: false,
                combatResolved: false,
                combatResult: undefined,
                eventTriggered: false,
                eventResolved: false,
                midEvent: undefined,
                logs: [{
                  id: uid(),
                  turn: 0,
                  type: 'system' as const,
                  message: item.specialId === 'special_abyss_resonance'
                    ? '심연의 폭군 주파수가 공명합니다. 그림자 군단의 결전이 필요합니다. (티켓 소모 없음)'
                    : '심연의 균열 신호가 감지되었습니다. 헌터는 참전하지 않고 후방에서 지휘합니다. (티켓 소모 없음)',
                }],
              }
            }
            return item
          })
        }
      }),

      abandonShadowExpedition: (expeditionId) => set((s) => {
        const expedition = (s.shadowExpeditions ?? []).find(item => item.id === expeditionId)
        if (!expedition || expedition.status !== 'in_progress') return {}

        const updatedExpeditions = (s.shadowExpeditions ?? []).map(item =>
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
        )

        const tempState = {
          ...s,
          activeShadowExpeditionId: undefined,
          shadowExpeditions: updatedExpeditions,
        }
        const synced = syncTodayShadowExpeditionState(tempState)

        const baseState = {
          activeShadowExpeditionId: synced.activeShadowExpeditionId,
          shadowExpeditions: synced.shadowExpeditions,
          lastShadowExpeditionDate: synced.lastShadowExpeditionDate,
        }

        return applySecretProgressEvent(s, {
          context: 'expedition',
          outcome: 'failure',
          expeditionType: expedition.type,
          shadowIds: expedition.selectedShadowIds,
        }, baseState)
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
        const activeJobId = s.hunter.activeJobId || s.hunter.jobId
        const jobLevel = s.hunter.jobs?.[activeJobId]?.level ?? 1
        const playerSkills = getPlayerCombatSkills({
          jobId: activeJobId,
          jobLevel,
          equippedItems,
          allSkills: SKILL_DEFINITIONS,
        })
        const playerStats = calculatePlayerCombatStats({
          level: s.hunter.level,
          stats: combatStatsWithShadows,
          equippedItems,
          activeConsumableEffects: s.activeConsumableEffects,
          jobId: activeJobId,
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
        const isVictory = result.outcome === 'victory'
        const isBoss = floor % 5 === 0
        const nextSkillStates = activeBattle.id.startsWith('direct-tower-')
          ? applyDirectBattleSkillRuntimeUses(s.skillStates, activeBattle.logs, isVictory, isBoss)
          : s.skillStates
        const isFirstClear = result.firstClear
        const rewards = result.rewards

        let nextHunter = s.hunter
        let nextItems = s.items
        let nextGold = s.gold ?? 0
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
          if (rewards.gold && rewards.gold > 0) {
            nextGold += rewards.gold
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
                  '보스 전리품 상자',
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
              '상위 전투 기록을 갱신했습니다.',
              ...(rewards.hunterXp ? [`XP +${rewards.hunterXp}`] : []),
              ...(rewards.gold ? [`Gold +${rewards.gold}`] : []),
              ...(rewards.shadowEssence ? [`그림자 정수 +${rewards.shadowEssence}`] : []),
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
            gold: nextGold,
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
              result.outcome === 'defeat'
                ? '상위 전투 도전에 실패했습니다.'
                : '상위 전투 - 시간 초과.',
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
              currentFloor: floor,
              activeTowerBattle: {
                ...activeBattle,
                status: 'resolved',
                showResult: true,
              },
            },
            messages: [...s.messages, ...newMessages],
            skillStates: nextSkillStates,
          }))
          setTimeout(() => {
            set(current => applyChallengeProgress(current, { towerAttempt: true }))
          }, 0)
        }
      },

      resolveDirectTowerBattle: (combatLog, floor) => {
        const s = get()
        const tower = s.infiniteTower ?? createInitialTowerState()
        const safeFloor = Math.max(1, Math.floor(Number.isFinite(floor) ? floor : tower.currentFloor))
        if (s.combatLogs.some(log => log.battleId === combatLog.battleId)) return
        if (tower.activeTowerBattle?.id === combatLog.battleId && tower.activeTowerBattle.status !== 'revealing') return

        const floorType = getTowerFloorType(safeFloor)
        const monsters = getTowerMonstersForFloor(safeFloor)
        const outcome: TowerBattleResult['outcome'] = combatLog.result === 'victory' ? 'victory' : (combatLog.result === 'defeat' ? 'defeat' : 'draw')
        const isFirstClear = !tower.firstClearRewardsClaimed[safeFloor]
        const rewards = calculateTowerReward(safeFloor, outcome, isFirstClear)
        const towerResult: TowerBattleResult = {
          outcome,
          floor: safeFloor,
          firstClear: isFirstClear,
          rewards,
        }

        let addedSignals: string[] = []
        if (combatLog.result === 'victory') {
          const equippedItems = getEquippedItems(s.items, s.equipment)
          const equippedShadows = getEquippedShadows(s.ownedShadows, s.equippedShadowIds, s.hunter)
          const shadowStatBonuses = getEquippedShadowStatBonuses(equippedShadows)
          const combatStatsWithShadows = { ...s.hunter.stats }
          for (const [stat, value] of Object.entries(shadowStatBonuses)) {
            combatStatsWithShadows[stat as StatKey] = roundStatValue(combatStatsWithShadows[stat as StatKey] + (value ?? 0))
          }
          const activeJobId = s.hunter.activeJobId || s.hunter.jobId
          const jobLevel = s.hunter.jobs?.[activeJobId]?.level ?? 1
          const playerSkills = getPlayerCombatSkills({
            jobId: activeJobId,
            jobLevel,
            equippedItems,
            allSkills: SKILL_DEFINITIONS,
          })
          const playerStats = calculatePlayerCombatStats({
            level: s.hunter.level,
            stats: combatStatsWithShadows,
            equippedItems,
            activeConsumableEffects: s.activeConsumableEffects,
            jobId: activeJobId,
            skills: playerSkills,
          })
          const maxHp = playerStats.maxHp
          const remainingHp = combatLog.playerHpRemaining
          const hpPercent = maxHp > 0 ? remainingHp / maxHp : 1
          if (hpPercent <= 0.15) {
            if (floorType === 'boss') {
              addedSignals.push('tower-boss-clutch-victory')
            } else {
              addedSignals.push('low-hp-victory')
            }
          }
          if ((combatLog.totalTurns || 0) >= 20) {
            addedSignals.push('long-battle-victory')
          }
        }

        let nextHunter = s.hunter
        addedSignals.forEach(sig => {
          nextHunter = addHiddenSignalToState(nextHunter, sig)
        })

        set({
          infiniteTower: {
            ...tower,
            lastAttemptedFloor: safeFloor,
            activeTowerBattle: {
              id: combatLog.battleId,
              floor: safeFloor,
              floorType,
              monsterIds: monsters.map(monster => monster.id),
              recommendedPower: getTowerRecommendedPower(safeFloor),
              status: 'revealing',
              logs: combatLog.turns,
              result: towerResult,
              showResult: false,
            },
          },
          combatLogs: [{ ...combatLog, result: outcome, source: 'tower' as const }, ...s.combatLogs].slice(0, 20),
          manualBattleSession: undefined,
          hunter: nextHunter
        })

        get().resolveTowerBattle()
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
        const activeJobId = s.hunter.activeJobId || s.hunter.jobId
        const jobLevel = s.hunter.jobs?.[activeJobId]?.level ?? 1
        const playerSkills = getPlayerCombatSkills({
          jobId: activeJobId,
          jobLevel,
          equippedItems,
          allSkills: SKILL_DEFINITIONS,
          includeBasicKit: true,
        })
        const playerStats = calculatePlayerCombatStats({
          level: s.hunter.level,
          stats: combatStatsWithShadows,
          equippedItems,
          activeConsumableEffects: s.activeConsumableEffects,
          jobId: activeJobId,
          skills: playerSkills,
        })

        const player = createPlayerBattleActor(s.hunter.name || '헌터', playerStats, playerSkills)
        const monster = createMonsterBattleActor(monsterDef)

        const tower = s.infiniteTower ?? createInitialTowerState()
        set({
          manualBattleSession: {
            gateId: monsterDef.id,
            gateName: `상위 전투 기록 ${floor}단계`,
            gateInstanceId: `tower-${floor}`,
            waveIndex: 0,
            turn: 1,
            maxTurns: 200,
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
        const activeJobId = s.hunter.activeJobId || s.hunter.jobId
        const jobLevel = s.hunter.jobs?.[activeJobId]?.level ?? 1
        const playerSkills = getPlayerCombatSkills({
          jobId: activeJobId,
          jobLevel,
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
          let nextGold = s.gold ?? 0
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
            if (rewards.gold && rewards.gold > 0) {
              nextGold += rewards.gold
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
                    '보스 전리품 상자',
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
                '상위 전투 기록을 갱신했습니다.',
                ...(rewards.hunterXp ? [`XP +${rewards.hunterXp}`] : []),
                ...(rewards.gold ? [`Gold +${rewards.gold}`] : []),
                ...(rewards.shadowEssence ? [`그림자 정수 +${rewards.shadowEssence}`] : []),
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
              gold: nextGold,
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
              if (getTowerFloorType(floor) === 'boss') {
                get().emitWorldSignal('echo_clear_predecessor')
              } else if (floor >= 25) {
                get().emitWorldSignal('echo_faint_footstep')
              }
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
                  ? '상위 전투 도전에 실패했습니다.'
                  : '상위 전투 - 시간 초과.',
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
                currentFloor: floor,
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
            currentFloor: session.towerFloor ?? tower.currentFloor ?? 1,
          },
        }
      }),

      addQuest: (q) => set((s) => {
        const nextQuests = [...s.quests, { ...q, id: uid(), createdAt: todayISO() }]
        return {
          quests: nextQuests,
          dailyProgression: buildDailyProgression(nextQuests, s.achievementStats),
        }
      }),

      addAiCoachDailyQuest: (input) => set((s) => {
        const CATEGORY_STAT_SUGGESTIONS: Record<Category, [StatKey, StatKey]> = {
          workout:   ['STR', 'VIT'],
          health:    ['VIT', 'PER'],
          study:     ['INT', 'PER'],
          career:    ['INT', 'SEN'],
          mind:      ['PER', 'SEN'],
          finance:   ['INT', 'SEN'],
          social:    ['AGI', 'SEN'],
          challenge: ['PER', 'STR'],
          habit:     ['PER', 'VIT'],
        }
        
        const selectedStats = CATEGORY_STAT_SUGGESTIONS[input.category] || ['PER', 'VIT']
        const baseGain = input.difficulty === 'boss' ? 4 : input.difficulty === 'apex' ? 4 : input.difficulty === 'elite' ? 3 : input.difficulty === 'hard' ? 2 : 1
        
        const statRewards: Partial<Record<StatKey, number>> = {}
        selectedStats.forEach(stat => { statRewards[stat] = baseGain })

        const rewardStatWeights: Partial<Record<StatKey, number>> = {}
        const w = 1 / selectedStats.length
        selectedStats.forEach(stat => { rewardStatWeights[stat] = w })

        const newQuest: Quest = {
          id: `ai-daily-${todayKey()}-${Math.random().toString(36).slice(2, 6)}`,
          title: input.title,
          description: input.description,
          category: input.category,
          difficulty: input.difficulty,
          statRewards,
          rewardStatWeights,
          type: 'daily',
          recurring: false, // 1회성 처방
          createdAt: todayISO(),
          coachReason: input.coachReason,
          aiPriority: input.priority,
          aiEstimatedMinutes: input.estimatedMinutes,
          coachGenerated: true,
        }

        // 12-31F: 퀘스트 추가 성과(outcome) 기록 연동
        let updatedMemory = s.aiCoachMemory
        if (updatedMemory) {
          const outcomeExists = updatedMemory.questOutcomes.some(out => out.questId === newQuest.id)
          if (!outcomeExists) {
            const todayStr = todayKey()
            const newOutcome: AiCoachQuestOutcome = {
              questId: newQuest.id,
              title: newQuest.title,
              category: newQuest.category,
              difficulty: newQuest.difficulty,
              source: 'aiCoach',
              coachReason: newQuest.coachReason,
              plannedDate: todayStr,
              addedAt: new Date().toISOString(),
              status: 'added'
            }
            const nextOutcomes = [...updatedMemory.questOutcomes, newOutcome]
            while (nextOutcomes.length > 200) {
              nextOutcomes.shift()
            }
            updatedMemory = {
              ...updatedMemory,
              questOutcomes: nextOutcomes,
              lastUpdatedAt: new Date().toISOString()
            }
          }
        }

        const nextQuests = [...s.quests, newQuest]
        return {
          quests: nextQuests,
          aiCoachMemory: updatedMemory,
          dailyProgression: buildDailyProgression(nextQuests, s.achievementStats)
        }
      }),

      replaceAiCoachDailyPlan: (questsInput, targetDate) => set((s) => {
        // 1. 현재 quests에서 AI Coach가 생성한 1회성 daily plan 전체를 정리 (날짜 무관)
        const oldAiDailies = s.quests.filter(q => {
          const isAiOneTimeDaily = q.type === 'daily' && 
                                   !q.recurring && 
                                   (q.coachGenerated === true || 
                                    q.coachPlanId !== undefined || 
                                    q.coachReason !== undefined)
          return isAiOneTimeDaily
        })

        const remainingQuests = s.quests.filter(q => {
          const isAiOneTimeDaily = q.type === 'daily' && 
                                   !q.recurring && 
                                   (q.coachGenerated === true || 
                                    q.coachPlanId !== undefined || 
                                    q.coachReason !== undefined)
          return !isAiOneTimeDaily
        })

        // 1.5. 하드코어 모드일 때 미완료된 이전 AI 퀘스트들로부터 Gate Echo 생성 (12-44A)
        let nextHardcoreState = s.hardcoreState
        if (s.hardcoreState?.enabled) {
          const uncompletedOldDailies = oldAiDailies.filter(q => getCooldownRemaining(q) === 0)
          if (uncompletedOldDailies.length > 0) {
            const yesterdayStr = s.dailyProgression?.dateKey || getDateKey(addDays(new Date(), -1))
            const { hardcore: updatedHardcore } = generateGateEchoesForDate({
              hardcore: s.hardcoreState,
              quests: uncompletedOldDailies,
              sourceDate: yesterdayStr,
              targetDate,
              now: Date.now()
            })
            nextHardcoreState = updatedHardcore
          }
        }

        // 2. 새 퀘스트들을 정규화하여 생성
        const CATEGORY_STAT_SUGGESTIONS: Record<Category, [StatKey, StatKey]> = {
          workout:   ['STR', 'VIT'],
          health:    ['VIT', 'PER'],
          study:     ['INT', 'PER'],
          career:    ['INT', 'SEN'],
          mind:      ['PER', 'SEN'],
          finance:   ['INT', 'SEN'],
          social:    ['AGI', 'SEN'],
          challenge: ['PER', 'STR'],
          habit:     ['PER', 'VIT'],
        }

        const newQuests: Quest[] = []
        const newOutcomes: AiCoachQuestOutcome[] = []
        const coachPlanId = `plan-${Date.now()}`

        questsInput.forEach(q => {
          const selectedStats = CATEGORY_STAT_SUGGESTIONS[q.category as Category] || ['PER', 'VIT']
          const baseGain = q.difficulty === 'boss' ? 4 : q.difficulty === 'apex' ? 4 : q.difficulty === 'elite' ? 3 : q.difficulty === 'hard' ? 2 : 1
          
          const statRewards: Partial<Record<StatKey, number>> = {}
          selectedStats.forEach(stat => { statRewards[stat] = baseGain })

          const rewardStatWeights: Partial<Record<StatKey, number>> = {}
          const w = 1 / selectedStats.length
          selectedStats.forEach(stat => { rewardStatWeights[stat] = w })

          const questId = `ai-daily-${targetDate}-${Math.random().toString(36).slice(2, 6)}`
          
          const newQuest: Quest = {
            id: questId,
            title: q.title,
            description: q.description,
            category: q.category,
            difficulty: q.difficulty || 'normal',
            statRewards,
            rewardStatWeights,
            type: 'daily',
            recurring: false, // 1회성 플랜
            createdAt: todayISO(),
            coachReason: q.reason || 'AI Daily Plan 처방',
            aiPriority: q.priority,
            coachPriority: q.priority,
            aiEstimatedMinutes: q.estimatedMinutes,
            estimatedMinutes: q.estimatedMinutes,
            coachGenerated: true,
            coachPlanId: coachPlanId,
            coachPlanDate: targetDate
          }
          newQuests.push(newQuest)

          // outcomes 추가 기록 생성
          newOutcomes.push({
            questId: questId,
            title: q.title,
            category: q.category,
            difficulty: q.difficulty || 'normal',
            source: 'aiCoach',
            coachReason: q.reason,
            plannedDate: targetDate,
            addedAt: new Date().toISOString(),
            status: 'added'
          })
        })

        // 3. CoachMemory outcomes 상태 갱신
        let updatedMemory = s.aiCoachMemory || {
          sessions: [],
          questOutcomes: [],
          rollingSummary: {
            windowDays: 7,
            repeatedFailures: [],
            stableHabits: [],
            improvingAreas: [],
            overloadedAreas: [],
            recentWorkoutFocus: [],
            recentStudyFocus: [],
            sleepPattern: '패턴 분석 중',
            coachNotes: ['학습 데이터 부족 (며칠 더 사용하면 코치가 패턴을 학습합니다)']
          }
        }

        // 기존 added 상태였던 모든 outcomes를 expired로 교체/정리 (replaced/expired 처리)
        const nextOutcomes = (updatedMemory.questOutcomes || []).map(out => {
          if (out.status === 'added') {
            return {
              ...out,
              status: 'expired' as const,
              coachReason: out.coachReason ? `${out.coachReason} [replacedByNewPlan]` : '[replacedByNewPlan]',
              completedAt: undefined
            }
          }
          return out
        })

        // 새 Outcomes를 머지하고 200개 캡 적용
        const mergedOutcomes = [...nextOutcomes, ...newOutcomes]
        while (mergedOutcomes.length > 200) {
          mergedOutcomes.shift()
        }

        updatedMemory = {
          ...updatedMemory,
          questOutcomes: mergedOutcomes,
          lastUpdatedAt: new Date().toISOString()
        }

        // 상태가 변경되었으므로 비동기적으로 롤링 통계를 재빌드합니다.
        setTimeout(() => {
          get().rebuildAiCoachRollingSummary()
        }, 0)

        // 12-45A: 전체 AI Daily Plan이 실제 퀘스트로 반영될 때만 세계가 하루 진행된다.
        let nextLivingWorld = s.livingWorld
        const nextRiftNodes = { ...s.riftNodes }
        if (s.livingWorld) {
          const rng = createSeededRng(s.livingWorld.seed + s.livingWorld.day)
          const pPower = getHunterCombatPower({
            hunter: s.hunter,
            items: s.items,
            equipment: s.equipment,
            ownedShadows: s.ownedShadows ?? [],
            equippedShadowIds: s.equippedShadowIds ?? [],
            activeConsumableEffects: s.activeConsumableEffects ?? [],
          })
          nextLivingWorld = advanceWorldDay(s.livingWorld, rng, {
            loveCallHelperMaxRank: getRenownTier(getEffectiveRenown(s.hunter, s.achievementStats, getMonarchsDefeatedCount(s.livingWorld))).maxHelperRank,
            playerRank: s.hunter.rank,
            playerPower: pPower,
          })
          nextLivingWorld.lastTickDate = targetDate

          // 틱에서 변화된 게이트 클리어 상태를 기존 store.riftNodes와 동기화
          if (nextLivingWorld.riftNodes) {
            for (const nodeId in nextLivingWorld.riftNodes) {
              const node = nextLivingWorld.riftNodes[nodeId]
              if (node.status === 'cleared') {
                nextRiftNodes[nodeId] = 'cleared'
              } else if (node.status === 'exploded') {
                nextRiftNodes[nodeId] = 'undiscovered'
              }
            }
          }
        }

        const nextQuests = [...remainingQuests, ...newQuests]
        const dailyRewardRoute = createDailyRewardRouteState(s, nextQuests, targetDate)
        const nextDailyProgression = buildDailyProgression(nextQuests, s.achievementStats)

        return {
          quests: nextQuests,
          aiCoachMemory: updatedMemory,
          hardcoreState: nextHardcoreState,
          livingWorld: nextLivingWorld,
          riftNodes: nextRiftNodes,
          dailyProgression: nextDailyProgression,
          ...dailyRewardRoute,
        }
      }),

      addMainQuest: (input) => set((s) => {
        const milestones: MainQuestMilestone[] = (input.milestones || []).map((m, idx) => ({
          id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: m.title,
          description: m.description,
          status: idx === 0 ? 'active' : 'locked',
          order: m.order ?? idx,
          reward: m.reward,
        }))

        const newQuest: Quest = {
          id: `main-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: input.title,
          description: input.description,
          category: input.category,
          difficulty: 'hard',
          statRewards: {},
          type: 'main',
          createdAt: todayISO(),
          completed: false,
          status: 'active',
          finalGoal: input.finalGoal,
          progressPercent: 0,
          milestones: milestones,
          source: input.source ?? 'user',
          coachReason: input.coachReason
        }

        return {
          quests: [...s.quests, newQuest]
        }
      }),

      updateMainQuest: (id, patch) => set((s) => ({
        quests: s.quests.map(q => q.id === id ? { ...q, ...patch } : q)
      })),

      addMainQuestMilestone: (mainQuestId, milestone) => set((s) => {
        return {
          quests: s.quests.map(q => {
            if (q.id !== mainQuestId || q.type !== 'main') return q
            const currentMilestones = (q.milestones as MainQuestMilestone[]) || []
            const newMilestone: MainQuestMilestone = {
              id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: milestone.title,
              description: milestone.description,
              status: currentMilestones.length === 0 ? 'active' : 'locked',
              order: milestone.order ?? currentMilestones.length,
              importance: milestone.importance,
              reward: milestone.reward,
            }
            const updatedMilestones = [...currentMilestones, newMilestone]
            const completedCount = updatedMilestones.filter(m => m.status === 'completed').length
            const progressPercent = Math.round((completedCount / updatedMilestones.length) * 100)
            return {
              ...q,
              milestones: updatedMilestones,
              progressPercent
            }
          })
        }
      }),

      updateMainQuestMilestone: (mainQuestId, milestoneId, patch) => set((s) => {
        return {
          quests: s.quests.map(q => {
            if (q.id !== mainQuestId || q.type !== 'main') return q
            const currentMilestones = (q.milestones as MainQuestMilestone[]) || []
            const updatedMilestones = currentMilestones.map(m => m.id === milestoneId ? { ...m, ...patch } : m)
            const completedCount = updatedMilestones.filter(m => m.status === 'completed').length
            const progressPercent = Math.round((completedCount / updatedMilestones.length) * 100)
            return {
              ...q,
              milestones: updatedMilestones,
              progressPercent
            }
          })
        }
      }),

      completeMainQuestMilestone: (mainQuestId, milestoneId, evidenceNote) => {
        const s = get()
        const quest = s.quests.find(q => q.id === mainQuestId)
        if (!quest || quest.type !== 'main') return

        const currentMilestones = (quest.milestones as MainQuestMilestone[]) || []
        const milestoneIndex = currentMilestones.findIndex(m => m.id === milestoneId)
        if (milestoneIndex === -1) return

        const milestone = currentMilestones[milestoneIndex]
        if (milestone.status === 'completed') return // 중복 지급/완료 방지

        // 중요: 마일스톤 완료 시의 개별 보상(XP/Gold/스탯/전리품 상자)은 모두 제거하고 진행도만 기록 (최종 완료 보상에 집중)
        let xpReward = 0
        let goldReward = 0
        let statRewards: Partial<Record<StatKey, number>> = {}
        let boxTypeReward: 'epic' | 'superior' | 'normal' | undefined = undefined

        // 보상 처리
        // 1. XP 및 레벨업 계산
        const { hunter: newHunter, outcome } = applyXp(s.hunter, xpReward, quest.category)
        const newStats = { ...newHunter.stats }
        for (const [k, v] of Object.entries(statRewards)) {
          newStats[k as StatKey] = roundStatValue(newStats[k as StatKey] + (v ?? 0))
        }

        // 2. Gold 추가
        const nextGold = (s.gold ?? 0) + goldReward

        // 3. 상자 지급 (major milestone 시)
        let nextRewardBoxes = s.rewardBoxes ?? []
        if (boxTypeReward) {
          const newBox = createRewardBox(
            'daily',
            boxTypeReward,
            'achievement',
            `[마일스톤] "${milestone.title}" 완수 전리품`
          )
          nextRewardBoxes = [newBox, ...nextRewardBoxes].slice(0, 30)
        }

        // 4. 시스템 메시지 작성
        const newMessages = [...s.messages]
        newMessages.push({
          id: uid(),
          kind: 'quest',
          title: '마일스톤 달성!',
          lines: [
            `[${quest.title}]`,
            `중간 목표 "${milestone.title}" 완료`,
            ...(xpReward > 0 ? [`+${xpReward} XP 획득`] : []),
            ...(goldReward > 0 ? [`Gold +${goldReward}`] : []),
            ...Object.entries(statRewards).map(([k, v]) => `· ${k} +${v}`),
            ...(boxTypeReward ? ['전리품 상자 획득'] : [])
          ],
          createdAt: todayISO()
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

        // 5. Milestones 상태 변경 및 locked -> active 잠금해제 처리
        const updatedMilestones = currentMilestones.map((m, idx) => {
          if (m.id === milestoneId) {
            return {
              ...m,
              status: 'completed' as const,
              completedAt: todayISO(),
              evidenceNote: evidenceNote
            }
          }
          // 바로 다음 인덱스 잠금해제
          if (idx === milestoneIndex + 1 && m.status === 'locked') {
            return {
              ...m,
              status: 'active' as const
            }
          }
          return m
        })

        const completedCount = updatedMilestones.filter(m => m.status === 'completed').length
        const totalCount = updatedMilestones.length
        const progressPercent = Math.round((completedCount / totalCount) * 100)

        // 모든 milestone 완료 시 전체 Main 퀘스트도 완료 처리
        const allCompleted = totalCount > 0 && completedCount === totalCount

        if (allCompleted) {
          const mainQuestStatRewards = getBalancedQuestStatRewards(quest)
          for (const [k, v] of Object.entries(mainQuestStatRewards)) {
            newStats[k as StatKey] = roundStatValue(newStats[k as StatKey] + (v ?? 0))
          }
        }

        set({
          hunter: { ...newHunter, stats: newStats },
          gold: nextGold,
          rewardBoxes: nextRewardBoxes,
          messages: newMessages,
          quests: s.quests.map(q => {
            if (q.id !== mainQuestId) return q
            return {
              ...q,
              milestones: updatedMilestones,
              progressPercent,
              completed: allCompleted ? true : q.completed,
              completedAt: allCompleted ? todayISO() : q.completedAt,
              status: allCompleted ? ('completed' as const) : q.status
            }
          })
        })

        // 칭호 및 각성 체크 트리거
        setTimeout(() => {
          get().checkTitleUnlocks()
          get().checkJobAwakening()
          if (allCompleted) {
            get().applyMainQuestCompletionBonus(quest)
            get().rollGateSpawn('main_completion')
          }
        }, 0)
      },

      skipMainQuestMilestone: (mainQuestId, milestoneId) => {
        const s = get()
        const quest = s.quests.find(q => q.id === mainQuestId)
        if (!quest || quest.type !== 'main') return

        const currentMilestones = (quest.milestones as MainQuestMilestone[]) || []
        const milestoneIndex = currentMilestones.findIndex(m => m.id === milestoneId)
        if (milestoneIndex === -1) return

        const milestone = currentMilestones[milestoneIndex]
        if (milestone.status === 'completed' || milestone.status === 'skipped') return

        const updatedMilestones = currentMilestones.map((m, idx) => {
          if (m.id === milestoneId) {
            return {
              ...m,
              status: 'skipped' as const,
              completedAt: todayISO()
            }
          }
          if (idx === milestoneIndex + 1 && m.status === 'locked') {
            return {
              ...m,
              status: 'active' as const
            }
          }
          return m
        })

        const completedCount = updatedMilestones.filter(m => m.status === 'completed').length
        const skippedCount = updatedMilestones.filter(m => m.status === 'skipped').length
        const totalCount = updatedMilestones.length
        const progressPercent = Math.round(((completedCount + skippedCount) / totalCount) * 100)
        const allDone = totalCount > 0 && (completedCount + skippedCount) === totalCount

        const newMessages = [...s.messages]
        newMessages.push({
          id: uid(),
          kind: 'info',
          title: '마일스톤 건너뛰기',
          lines: [
            `[${quest.title}]`,
            `중간 단계 "${milestone.title}" 건너뜀 처리`,
            '보상은 지급되지 않으며 다음 단계가 활성화되었습니다.'
          ],
          createdAt: todayISO()
        })

        set({
          messages: newMessages,
          quests: s.quests.map(q => {
            if (q.id !== mainQuestId) return q
            return {
              ...q,
              milestones: updatedMilestones,
              progressPercent,
              completed: allDone ? true : q.completed,
              completedAt: allDone ? todayISO() : q.completedAt,
              status: allDone ? ('completed' as const) : q.status
            }
          })
        })
      },

      completeMainQuest: (mainQuestId) => {
        const s = get()
        const quest = s.quests.find(q => q.id === mainQuestId)
        if (!quest || quest.type !== 'main' || quest.completed) return

        const mainQuestStatRewards = getBalancedQuestStatRewards(quest)
        const newStats = { ...s.hunter.stats }
        for (const [k, v] of Object.entries(mainQuestStatRewards)) {
          newStats[k as StatKey] = roundStatValue(newStats[k as StatKey] + (v ?? 0))
        }

        set({
          hunter: { ...s.hunter, stats: newStats },
          quests: s.quests.map(q => {
            if (q.id !== mainQuestId || q.type !== 'main') return q
            return {
              ...q,
              completed: true,
              completedAt: todayISO(),
              status: 'completed' as const,
              progressPercent: 100
            }
          })
        })

        setTimeout(() => {
          get().checkTitleUnlocks()
          get().checkJobAwakening()
          get().applyMainQuestCompletionBonus(quest)
          get().rollGateSpawn('main_completion')
        }, 0)
      },

      removeQuest: (id) => set((s) => {
        const nextQuests = s.quests.filter(q => q.id !== id)
        return {
          quests: nextQuests,
          dailyProgression: buildDailyProgression(nextQuests, s.achievementStats)
        }
      }),

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
        const activeJobId = s.hunter.activeJobId || s.hunter.jobId
        const currentJobV2 = JOB_DEFINITIONS_V2.find(j => j.id === activeJobId)
        const currentJobLegacy = JOB_DEFINITIONS.find(j => j.id === activeJobId)
        const jobCategoryBonus = currentJobV2?.growthAffinity?.questCategoryBonus?.[q.category]
          ?? currentJobLegacy?.effects.xpBonusByCategory?.[q.category]
          ?? 0
        
        // Equipment XP bonus
        const equipmentXpBonus = getEquipmentXpBonus(equippedItems, q.category)
        
        // Consumable XP bonus
        const consumableXpBonus = getActiveConsumableXpBonus(s.activeConsumableEffects, q.category)
        const titleXpBonus = getTitleXpMultiplier(s.hunter, q.category) - 1
        
        // Additive XP bonus: job + equipment + consumable + equipped title
        const shadowXpBonus = getEquippedShadowCategoryXpBonus(equippedShadows, q.category)
        const additiveXpBonus = jobCategoryBonus + equipmentXpBonus + consumableXpBonus + titleXpBonus + shadowXpBonus
        const xp = Math.round(baseXp * statMultiplier * (1 + additiveXpBonus))
        const questGold = getQuestGoldReward(q)

        // Bump category progress BEFORE applyXp so this completion counts for level-up.
        const bumpedProgress = {
          ...s.hunter.categoryProgress,
          [q.category]: (s.hunter.categoryProgress[q.category] ?? 0) + 1,
        }
        const hunterIn = { ...s.hunter, categoryProgress: bumpedProgress }

        const { hunter: newHunter, outcome } = applyXp(hunterIn, xp, q.category)

        // ── Job System v2: Apply active job XP ──
        const jobResult = gainActiveJobXp(newHunter, baseXp, q.category)
        const finalHunter = { ...jobResult.hunter }

        // grow stats from quest's intrinsic statRewards
        const statRewards = getBalancedQuestStatRewards(q)
        const newStats = { ...finalHunter.stats }
        for (const [k, v] of Object.entries(statRewards)) {
          newStats[k as StatKey] = roundStatValue(newStats[k as StatKey] + (v ?? 0))
        }

        // streak: increment on first daily completion of the day
        const today = todayKey()
        const yesterdayKey = getDateKey(addDays(new Date(), -1))
        let streak = finalHunter.streak
        if (finalHunter.lastActiveDate !== today) {
          streak = finalHunter.lastActiveDate === yesterdayKey ? streak + 1 : 1
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

        // ── Rune Drop for Quest Completion ──
        let rolledRune: RuneItem | undefined = undefined
        if (q.type === 'daily' && Math.random() < 0.08) {
          rolledRune = generateRandomRune('normal')
        }

        let rolledStone: ShadowRarity | undefined = undefined
        if (q.type === 'daily' && Math.random() < 0.08) {
          rolledStone = rollQuestEnhancementStone()
        }

        // messages
        const newMessages: SystemMessage[] = []
        let dailyTicketGained = 0
        if (q.type === 'daily' && Math.random() < 0.10) {
          dailyTicketGained = 1
        }

        let addedNormalMat = 0
        let addedAdvancedMat = 0
        let addedSupremeMat = 0
        if (q.type === 'daily') {
          const rand = Math.random()
          if (rand < 0.005) addedSupremeMat = 1
          else if (rand < 0.025) addedAdvancedMat = 1
          else if (rand < 0.105) addedNormalMat = 1
        }

        newMessages.push({
          id: uid(),
          kind: 'quest',
          title: '퀘스트 완료',
          lines: [
            `[${q.title}]`,
            `+${xp} XP 획득${xp !== baseXp ? ` (기본 ${baseXp})` : ''}`,
            `직업 [${jobResult.activeJobName}] XP +${jobResult.jobXpGained}${jobResult.jobCategoryBonus > 0 ? ` (친화도 보너스 +${Math.round(jobResult.jobCategoryBonus * 100)}%)` : ''}`,
            ...(questGold ? [`Gold +${questGold}`] : []),
            ...(rolledRune ? [`전리품: 룬 획득 [${rolledRune.icon} ${rolledRune.name}]`] : []),
            ...(rolledStone ? [`전리품: [${SHADOW_RARITY_LABEL[rolledStone]}] 그림자 강화석 획득`] : []),
            ...(dailyTicketGained > 0 ? [`원정 티켓 +${dailyTicketGained}장`] : []),
            ...(addedNormalMat > 0 ? [`일반 변이 재료 +${addedNormalMat}개`] : []),
            ...(addedAdvancedMat > 0 ? [`고급 변이 재료 +${addedAdvancedMat}개`] : []),
            ...(addedSupremeMat > 0 ? [`최고급 변이 재료 +${addedSupremeMat}개`] : []),
            ...Object.entries(statRewards).map(([k, v]) => `· ${k} ${formatStatReward(v ?? 0)}`),
          ],
          createdAt: todayISO(),
        })

        if (jobResult.jobLeveledUp) {
          newMessages.push({
            id: uid(),
            kind: 'info',
            title: 'JOB LEVEL UP',
            lines: [
              `직업 [${jobResult.activeJobName}]의 레벨이 상승했습니다.`,
              `Lv.${jobResult.jobPrevLevel} → Lv.${jobResult.jobNextLevel}`
            ],
            createdAt: todayISO(),
          })
        }

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
          hunter: { ...finalHunter, stats: newStats, streak, lastActiveDate: today },
          gold: (s.gold ?? 0) + questGold,
          mutationMaterialNormal: (s.mutationMaterialNormal ?? 0) + addedNormalMat,
          mutationMaterialAdvanced: (s.mutationMaterialAdvanced ?? 0) + addedAdvancedMat,
          mutationMaterialSupreme: (s.mutationMaterialSupreme ?? 0) + addedSupremeMat,
          quests: updatedQuests,
          items: [...s.items, ...drops],
          runes: [...(s.runes ?? []), ...(rolledRune ? [rolledRune] : [])],
          shadowEnhanceStones: (() => {
            const nextStones = { ...(s.shadowEnhanceStones ?? { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 }) }
            if (rolledStone) {
              nextStones[rolledStone] = (nextStones[rolledStone] ?? 0) + 1
            }
            return nextStones
          })(),
          expeditionTickets: (s.expeditionTickets ?? 0) + dailyTicketGained,
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
          get().updateAiCoachQuestOutcomeOnComplete(id)
          get().checkTitleUnlocks()
          get().checkJobAwakening()
          get().recalculateHunterGrade('퀘스트 완료')
          if (q.type === 'daily') {
            get().ensureTodayShadowExpedition()
            get().rollGateSpawn('daily_completion')
            // 12-40F: daily 완료 시마다 현실 준비도 재계산
            get().recalculateDailyProgression()
          }
          if (q.type === 'main') {
            get().applyMainQuestCompletionBonus(q)
            get().rollGateSpawn('main_completion')
          }
        }, 0)
      },

      uncompleteDaily: (id) => set((s) => {
        const nextQuests = s.quests.map(q => q.id === id ? { ...q, lastCompletedAt: undefined } : q)
        return {
          quests: nextQuests,
          dailyProgression: buildDailyProgression(nextQuests, s.achievementStats)
        }
      }),

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
          const jobResult = gainActiveJobXp(newHunter, baseStepXp, q.category)
          const finalHunter = { ...jobResult.hunter }

          const stepGold = getDungeonStepGoldReward(q)
          const newMessages: SystemMessage[] = [{
            id: uid(),
            kind: 'quest',
            title: '던전 진행',
            lines: [
              `[${q.title}]`, 
              `${cur}/${total} 단계`, 
              `+${stepXp} XP${stepXp !== baseStepXp ? ` (기본 ${baseStepXp})` : ''}`, 
              `직업 [${jobResult.activeJobName}] XP +${jobResult.jobXpGained}${jobResult.jobCategoryBonus > 0 ? ` (친화도 보너스 +${Math.round(jobResult.jobCategoryBonus * 100)}%)` : ''}`,
              ...(stepGold ? [`Gold +${stepGold}`] : [])
            ],
            createdAt: todayISO(),
          }]

          if (jobResult.jobLeveledUp) {
            newMessages.push({
              id: uid(),
              kind: 'info',
              title: 'JOB LEVEL UP',
              lines: [
                `직업 [${jobResult.activeJobName}]의 레벨이 상승했습니다.`,
                `Lv.${jobResult.jobPrevLevel} → Lv.${jobResult.jobNextLevel}`
              ],
              createdAt: todayISO(),
            })
          }

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
            hunter: finalHunter,
            gold: (s.gold ?? 0) + stepGold,
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
        const activeJobId = s.hunter.activeJobId || s.hunter.jobId
        const currentJobV2 = JOB_DEFINITIONS_V2.find(j => j.id === activeJobId)
        const currentJobLegacy = JOB_DEFINITIONS.find(j => j.id === activeJobId)
        const jobCategoryBonus = currentJobV2?.growthAffinity?.questCategoryBonus?.[q.category]
          ?? currentJobLegacy?.effects.xpBonusByCategory?.[q.category]
          ?? 0
        const equipmentXpBonus = getEquipmentXpBonus(equippedItems, q.category)
        const consumableXpBonus = getActiveConsumableXpBonus(s.activeConsumableEffects, q.category)
        const titleXpBonus = getTitleXpMultiplier(s.hunter, q.category) - 1
        // Additive XP bonus: job + equipment + consumable + equipped title
        const shadowXpBonus = getEquippedShadowCategoryXpBonus(equippedShadows, q.category)
        const additiveXpBonus = jobCategoryBonus + equipmentXpBonus + consumableXpBonus + titleXpBonus + shadowXpBonus
        const xp = Math.round(baseXp * statMultiplier * (1 + additiveXpBonus))
        const { hunter: newHunter, outcome } = applyXp(hunterIn, xp, q.category)
        const jobResult = gainActiveJobXp(newHunter, baseXp, q.category)
        const finalHunter = { ...jobResult.hunter }

        const statRewards = getBalancedQuestStatRewards(q)
        const newStats = { ...finalHunter.stats }
        for (const [k, v] of Object.entries(statRewards)) {
          newStats[k as StatKey] = roundStatValue(newStats[k as StatKey] + (v ?? 0))
        }
        const titleRarityBonus = getTitleRarityBonus(s.hunter)
        const drop = randomItem(s.hunter, equippedItems, 0, titleRarityBonus, 'dungeon')
        
        // Consume next_quest consumable effects
        const updatedConsumableEffects = consumeNextQuestEffects(s.activeConsumableEffects, q.category)
        const clearGold = getDungeonClearGoldReward(q)
        const messages: SystemMessage[] = [
          {
            id: uid(), kind: 'quest', title: '던전 클리어!',
            lines: [
              `[${q.title}]`,
              `+${xp} XP${xp !== baseXp ? ` (기본 ${baseXp})` : ''}`,
              `직업 [${jobResult.activeJobName}] XP +${jobResult.jobXpGained}${jobResult.jobCategoryBonus > 0 ? ` (친화도 보너스 +${Math.round(jobResult.jobCategoryBonus * 100)}%)` : ''}`,
              ...(clearGold ? [`Gold +${clearGold}`] : []),
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

        if (jobResult.jobLeveledUp) {
          messages.push({
            id: uid(),
            kind: 'info',
            title: 'JOB LEVEL UP',
            lines: [
              `직업 [${jobResult.activeJobName}]의 레벨이 상승했습니다.`,
              `Lv.${jobResult.jobPrevLevel} → Lv.${jobResult.jobNextLevel}`
            ],
            createdAt: todayISO(),
          })
        }

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
          hunter: { ...finalHunter, stats: newStats },
          gold: (s.gold ?? 0) + clearGold,
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
        if (s.hunter.lastActiveDate === today) {
          // 이미 오늘 실행되었음 -> 아무것도 하지 않음 (새로고침 시 AI daily가 지워지는 버그 해결)
          return { initialized: true }
        }

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

        // 12-31F: 1회성 AI 퀘스트 만료(expired) 처리
        let updatedMemory = s.aiCoachMemory
        // 날짜가 지나버린 1회성 플랜 리스트 추출 (AI 플랜은 제외하여 보존)
        const expiredQuests = s.quests.filter(q => {
          const isOneTimeDaily = q.type === 'daily' && q.recurring === false
          if (!isOneTimeDaily) return false
          
          // AI 코치가 생성한 플랜은 날짜 변경 시 만료/삭제하지 않음
          const isAiDaily = q.coachGenerated === true || q.coachPlanId !== undefined || q.coachReason !== undefined
          if (isAiDaily) return false
          
          return true
        })
        const expiredQuestIds = expiredQuests.map(q => q.id)
        
        if (updatedMemory && expiredQuestIds.length > 0) {
          const nextOutcomes = (updatedMemory.questOutcomes || []).map(out => {
            if (expiredQuestIds.includes(out.questId) && out.status === 'added') {
              return { ...out, status: 'expired' as const }
            }
            return out
          })
          updatedMemory = {
            ...updatedMemory,
            questOutcomes: nextOutcomes,
            lastUpdatedAt: new Date().toISOString()
          }
        }

        const quests = s.quests
          .filter(q => {
            const isOneTimeDaily = q.type === 'daily' && q.recurring === false
            if (!isOneTimeDaily) return true
            // 과거 날짜의 1회성 플랜만 삭제 (AI 플랜 제외)
            return !expiredQuestIds.includes(q.id)
          })
          .map(q => {
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
          hunter: { ...s.hunter, streak, streakProtectionLastUsed, lastActiveDate: today },
          quests,
          messages: [...s.messages, ...protectionMessages],
          achievementStats: stats,
          aiCoachMemory: updatedMemory,
          dailyProgression: buildDailyProgression(quests, stats),
          initialized: true,
        }
      }),

      debugAdvanceLivingWorldDay: () => set((s) => {
        if (!s.livingWorld) return {}
        const rng = createSeededRng(s.livingWorld.seed + s.livingWorld.day)
        const pPower = getHunterCombatPower({
          hunter: s.hunter,
          items: s.items,
          equipment: s.equipment,
          ownedShadows: s.ownedShadows ?? [],
          equippedShadowIds: s.equippedShadowIds ?? [],
          activeConsumableEffects: s.activeConsumableEffects ?? [],
        })
        const nextLivingWorld = advanceWorldDay(s.livingWorld, rng, {
          loveCallHelperMaxRank: getRenownTier(getEffectiveRenown(s.hunter, s.achievementStats, getMonarchsDefeatedCount(s.livingWorld))).maxHelperRank,
          playerRank: s.hunter.rank,
          playerPower: pPower,
        })
        const nextRiftNodes = { ...s.riftNodes }
        if (nextLivingWorld.riftNodes) {
          for (const nodeId in nextLivingWorld.riftNodes) {
            const node = nextLivingWorld.riftNodes[nodeId]
            if (node.status === 'cleared') {
              nextRiftNodes[nodeId] = 'cleared'
            } else if (node.status === 'exploded') {
              nextRiftNodes[nodeId] = 'undiscovered'
            }
          }
        }
        return {
          livingWorld: nextLivingWorld,
          riftNodes: nextRiftNodes
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
        let changed = false
        const mergedQuests: Quest[] = s.quests.map(saved => {
          const def = defaultMap.get(saved.id)
          if (!def) return saved // custom quest: leave untouched
          preserved.add(saved.id)
          
          let quest = { ...saved }
          
          if (shouldBackfillMainQuestMilestones(quest)) {
            const template = getDefaultMainQuestTemplate(quest)
            if (template) {
              quest = backfillMainQuestFromDefaultTemplate(quest, template)
              changed = true
            }
          }
          
          const updated = {
            ...def,
            ...quest,
            completed: quest.completed,
            currentSteps: quest.currentSteps,
            lastCompletedAt: quest.lastCompletedAt,
            createdAt: quest.createdAt,
            lastResetAt: quest.lastResetAt,
            milestones: quest.milestones,
            progressPercent: typeof quest.progressPercent === 'number' ? quest.progressPercent : (quest.completed ? 100 : 0),
          }

          if (JSON.stringify(updated.milestones) !== JSON.stringify(saved.milestones) || 
              updated.title !== saved.title || 
              updated.description !== saved.description ||
              updated.finalGoal !== saved.finalGoal) {
            changed = true
          }

          return updated
        })
        
        const addedQuests: Quest[] = []
        for (const def of initialQuests) {
          if (!preserved.has(def.id)) {
            addedQuests.push(def)
            changed = true
          }
        }
        
        if (!changed && addedQuests.length === 0 && mergedQuests.length === s.quests.length) {
          return {}
        }
        
        return { quests: [...mergedQuests, ...addedQuests] }
      }),

      syncDefaultEquipmentStats: () => set((s) => {
        let changed = false
        const updatedItems = s.items.map(item => {
          if (item.equippable !== true) return item
          const template = ITEM_POOL.find(p => p.name === item.name && p.equippable === true)
          if (!template) return item

          const newEffectsJson = JSON.stringify(template.effects ?? [])
          const oldEffectsJson = JSON.stringify(item.effects ?? [])

          if (
            item.icon !== template.icon ||
            item.rarity !== template.rarity ||
            item.description !== template.description ||
            item.slot !== template.slot ||
            newEffectsJson !== oldEffectsJson ||
            JSON.stringify(item.combatSkillIds ?? []) !== JSON.stringify(template.combatSkillIds ?? [])
          ) {
            changed = true
            return {
              ...item,
              icon: template.icon,
              rarity: template.rarity,
              description: template.description,
              slot: template.slot,
              effects: template.effects ?? [],
              combatSkillIds: template.combatSkillIds ?? []
            }
          }
          return item
        })

        if (!changed) return {}
        return { items: updatedItems }
      }),

      ensureMainQuestMilestonesBackfilled: () => set((s) => {
        let changed = false
        const updatedQuests = s.quests.map(quest => {
          if (shouldBackfillMainQuestMilestones(quest)) {
            const template = getDefaultMainQuestTemplate(quest)
            if (template) {
              changed = true
              if (import.meta.env.DEV) {
                console.log(`[Backfill] Backfilling milestones for main quest: "${quest.title}" (${quest.id})`)
              }
              return backfillMainQuestFromDefaultTemplate(quest, template)
            }
          }
          return quest
        })
        if (!changed) return {}
        return { quests: updatedQuests }
      }),

      selectSkillUpgrade: (skillId, upgradeId) => set((s) => {
        const currentStates = s.skillStates ?? {}
        const current = currentStates[skillId]
        if (!current) return {}
        if ((current.masteryLevel ?? 1) < 5) return {}

        const updated = {
          ...current,
          selectedUpgradeId: upgradeId,
        }

        return {
          skillStates: {
            ...currentStates,
            [skillId]: updated,
          }
        }
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
        activeWorldGate: undefined,
        activeRiftNodeId: undefined,
        riftNodes: (() => {
          const nodes: Record<string, RiftNodeStatus> = {}
          RIFT_NODES.forEach((n) => {
            nodes[n.id] = n.status
          })
          return nodes
        })(),
        livingWorld: initLivingWorld(Math.floor(Math.random() * 99999999) + 1),
        activeWorldBattle: undefined,
        worldBattleRetreats: {},
        combatLogs: [],
        manualBattleSession: undefined,
        ownedShadows: [],
        equippedShadowIds: [],
        shadowExtractHistory: [],
        shadowExtractFailCount: {},
        lastShadowExtractResult: undefined,
        gold: 0,
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
        shopPurchases: {},
        skillStates: {},
        secretProgress: undefined,
        aiCoachCoreContext: undefined,
        hardcoreState: createInitialHardcoreState(),
        hunterGrade: createInitialHunterGradeState({
          hunter: initialHunter,
          focusSession: { history: [], totalFocusedMs: 0 },
          achievementStats: createInitialAchievementStats(),
        }),
        initialized: true,
      }),

      hardResetAll: () => set({
        hunter: initialHunter,
        quests: initialQuests,
        items: [],
        titles: [],
        messages: [
          {
            id: uid(),
            kind: 'info',
            title: '전체 리셋 완료',
            lines: [
              '앱의 모든 저장 데이터가 완전히 초기화되었습니다.',
              '처음 설치한 상태처럼 정상적으로 복구되었습니다.'
            ],
            createdAt: todayISO()
          }
        ],
        achievementStats: createInitialAchievementStats(),
        activeRandomQuest: undefined,
        randomQuestHistory: {},
        equipment: {},
        activeConsumableEffects: [],
        gateStatus: createInitialGateStatus(),
        activeGate: undefined,
        activeWorldGate: undefined,
        activeRiftNodeId: undefined,
        riftNodes: (() => {
          const nodes: Record<string, RiftNodeStatus> = {}
          RIFT_NODES.forEach((n) => {
            nodes[n.id] = n.status
          })
          return nodes
        })(),
        livingWorld: initLivingWorld(Math.floor(Math.random() * 99999999) + 1),
        activeWorldBattle: undefined,
        combatLogs: [],
        manualBattleSession: undefined,
        ownedShadows: [],
        equippedShadowIds: [],
        shadowExtractHistory: [],
        shadowExtractFailCount: {},
        lastShadowExtractResult: undefined,
        gold: 0,
        shadowEssence: 0,
        shadowSummonTickets: [],
        shadowSummonShards: {},
        shadowFragments: {},
        shadowAchievementTicketClaims: {},
        shadowExpeditions: [],
        lastShadowExpeditionDate: undefined,
        activeShadowExpeditionId: undefined,
        infiniteTower: createInitialTowerState(),
        worldBattleRetreats: {},
        rewardBoxes: [],
        lastDailyBoxDate: undefined,
        lastWeeklyBoxWeek: undefined,
        todayChallengeCards: [],
        selectedChallengeCardIds: [],
        lastChallengeCardDate: undefined,
        challengeCardHistory: {},
        shopPurchases: {},
        skillStates: {},
        secretProgress: undefined,
        aiCoachCoreContext: undefined,
        aiCoachMemory: {
          sessions: [],
          questOutcomes: [],
          rollingSummary: {
            windowDays: 7,
            repeatedFailures: [],
            stableHabits: [],
            improvingAreas: [],
            overloadedAreas: [],
            recentWorkoutFocus: [],
            recentStudyFocus: [],
            sleepPattern: '패턴 분석 중',
            coachNotes: ['학습 데이터 부족 (며칠 더 사용하면 코치가 패턴을 학습합니다)']
          }
        },
        hardcoreState: createInitialHardcoreState(),
        hunterGrade: createInitialHunterGradeState({
          hunter: initialHunter,
          focusSession: { history: [], totalFocusedMs: 0 },
          achievementStats: createInitialAchievementStats(),
        }),
        initialized: true,
      }),

      resetGameProgressOnly: () => {
        const s = get()

        // 1. 보존할 자기관리 데이터 추출
        const preservedAiCoachCoreContext = s.aiCoachCoreContext
        const preservedAiCoachMemory = s.aiCoachMemory
        
        // 2. quests 복제 및 달성 상태 초기화
        const resetQuests = s.quests.map((q): Quest => {
          if (q.type === 'daily') {
            return {
              ...q,
              lastCompletedAt: undefined,
              completed: false,
            }
          } else if (q.type === 'main') {
            // Main Quest v2 구조 보존 및 완료 상태 초기화
            const resetMilestones = q.milestones 
              ? (q.milestones as MainQuestMilestone[]).map((m, idx): MainQuestMilestone => ({
                  ...m,
                  // 게임 리셋 시 헌터의 모든 골드, 레벨, 장비가 초기화되므로,
                  // 게임 밸런스 유지를 위해 마일스톤 재달성 시 보상(XP, Gold, 전리품 상자)을 정상적으로 다시 획득할 수 있도록 허용하는 것이 합당함.
                  // 따라서 별도의 claim flag를 남겨 보상 획득을 차단하지 않고 milestone status와 함께 클레임 상태도 초기화함.
                  status: idx === 0 ? 'active' : 'locked', // 첫 마일스톤은 active, 나머지는 locked로 초기화
                  completedAt: undefined,
                  evidenceNote: undefined,
                }))
              : undefined

            return {
              ...q,
              completed: false,
              status: q.status === 'completed' ? 'active' : q.status, // completed 상태를 active로 리셋
              completedAt: undefined,
              progressPercent: 0,
              milestones: resetMilestones,
            }
          }
          // dungeon 등 legacy는 legacy 보존
          return q
        })

        // 3. 게임 관련 데이터 초기화 및 자기관리 데이터 주입하여 set
        set({
          hunter: initialHunter,
          quests: resetQuests,
          items: [],
          runes: [],
          titles: [],
          messages: [
            {
              id: uid(),
              kind: 'info',
              title: '게임 진행 리셋 완료',
              lines: [
                '레벨, 스탯, 장비, 그림자, 골드 및 전투 진행도가 초기화되었습니다.',
                'AI 코치 설정, Core Context, Daily Plan 및 메인 퀘스트 구조는 안전하게 보존되었습니다.'
              ],
              createdAt: todayISO()
            }
          ],
          achievementStats: createInitialAchievementStats(),
          activeRandomQuest: undefined,
          randomQuestHistory: {},
          equipment: {},
          activeConsumableEffects: [],
          gateStatus: createInitialGateStatus(),
          activeGate: undefined,
          activeWorldGate: undefined,
          activeRiftNodeId: undefined,
          riftNodes: (() => {
            const nodes: Record<string, RiftNodeStatus> = {}
            RIFT_NODES.forEach((n) => {
              nodes[n.id] = n.status
            })
            return nodes
          })(),
          livingWorld: initLivingWorld(Math.floor(Math.random() * 99999999) + 1),
          activeWorldBattle: undefined,
          combatLogs: [],
          manualBattleSession: undefined,
          ownedShadows: [],
          equippedShadowIds: [],
          shadowExtractHistory: [],
          shadowExtractFailCount: {},
          lastShadowExtractResult: undefined,
          gold: 0,
          shadowEssence: 0,
          shadowSummonTickets: [],
          shadowSummonShards: {},
          shadowFragments: {},
          shadowAchievementTicketClaims: {},
          shadowExpeditions: [],
          lastShadowExpeditionDate: undefined,
          activeShadowExpeditionId: undefined,
          infiniteTower: createInitialTowerState(),
          worldBattleRetreats: {},
          rewardBoxes: [],
          lastDailyBoxDate: undefined,
          lastWeeklyBoxWeek: undefined,
          todayChallengeCards: [],
          selectedChallengeCardIds: [],
          lastChallengeCardDate: undefined,
          challengeCardHistory: {},
          shopPurchases: {},
          skillStates: {},
          secretProgress: undefined,
          
          // 보존 데이터 다시 주입
          aiCoachCoreContext: preservedAiCoachCoreContext,
          aiCoachMemory: preservedAiCoachMemory,
          hardcoreState: s.hardcoreState ? {
            ...s.hardcoreState,
            gateEchoes: [],
            worldThreat: 0,
          } : createInitialHardcoreState(),
          hunterGrade: createInitialHunterGradeState({
            hunter: initialHunter,
            focusSession: s.focusSession,
            achievementStats: createInitialAchievementStats(),
          }),
          initialized: true,
        })
      },

      resolveEndingChoice: (choice: 'surface' | 'true') => {
        const s = get()
        if (!s.livingWorld || s.livingWorld.endingMode !== 'choice_pending') return

        let nextLivingWorld = s.livingWorld
        if (choice === 'true') {
          const endingEvent: WorldEvent = {
            id: `evt-ending-true-${s.livingWorld.day}-${uid()}`,
            day: s.livingWorld.day,
            type: 'defeated',
            severity: 'critical',
            title: '새벽 신호 확정',
            body: '결전 좌표의 반복 파형이 사라지고, 닫혀 있던 하늘이 처음으로 다른 빛을 통과시킵니다.',
            regionId: 'kr',
            monarchId: 'angel',
            cinematic: true,
            subtitle: 'TRUE ENDING RECORDED',
          }
          nextLivingWorld = appendLivingWorldEvent(
            nextLivingWorld,
            endingEvent,
            `[Day ${s.livingWorld.day}] 🌟 [진정한 해방] 굴레가 끊어지고 반복 파형이 완전히 소거되었습니다.`
          )
        } else {
          const endingEvent: WorldEvent = {
            id: `evt-ending-loop-${s.livingWorld.day}-${uid()}`,
            day: s.livingWorld.day,
            type: 'defeated',
            severity: 'critical',
            title: '왕좌의 잔상',
            body: '결전은 끝났지만 빛의 빈자리가 잠시 당신의 뒤에 같은 윤곽을 남깁니다.',
            regionId: 'kr',
            monarchId: 'angel',
            cinematic: true,
            subtitle: 'LOOP ROUTE RECORDED',
          }
          nextLivingWorld = appendLivingWorldEvent(
            nextLivingWorld,
            endingEvent,
            `[Day ${s.livingWorld.day}] 🌟 [굴레의 계승] 결전은 종결되었지만 반복 파형은 보존되었습니다.`
          )
        }

        const secretRes = applySecretProgressEvent(s, {
          context: 'echo',
          action: 'ending_select',
          endingType: choice === 'true' ? 'true' : 'loop'
        })

        set({
          livingWorld: {
            ...nextLivingWorld,
            endingMode: choice === 'true' ? 'true' : 'surface',
            endingState: 'victory',
          },
          secretProgress: secretRes.secretProgress,
        })
      },

      triggerVictoryReset: () => {
        const s = get()
        const timestamp = Date.now()

        // 1. 보존할 자기관리 데이터 추출
        const preservedAiCoachCoreContext = s.aiCoachCoreContext
        const preservedAiCoachMemory = s.aiCoachMemory
        const preservedDailyProgression = s.dailyProgression
        const preservedFocusSession = s.focusSession

        // 2. quests 복제 및 달성 상태 초기화
        const resetQuests = s.quests.map((q): Quest => {
          if (q.type === 'daily') {
            return {
              ...q,
              lastCompletedAt: undefined,
              completed: false,
            }
          } else if (q.type === 'main') {
            const resetMilestones = q.milestones 
              ? (q.milestones as MainQuestMilestone[]).map((m, idx): MainQuestMilestone => ({
                  ...m,
                  status: idx === 0 ? 'active' : 'locked',
                  completedAt: undefined,
                  evidenceNote: undefined,
                }))
              : undefined

            return {
              ...q,
              completed: false,
              status: q.status === 'completed' ? 'active' : q.status,
              completedAt: undefined,
              progressPercent: 0,
              milestones: resetMilestones,
            }
          }
          return q
        })

        // 3. 메타 진행을 위한 hardcoreState 업데이트 (victoryCount 증가 및 clearHistory 추가)
        const hardcore = ensureHardcoreState(s.hardcoreState)
        const newHistoryEntry = {
          day: s.livingWorld?.day ?? 0,
          seed: s.livingWorld?.seed ?? 0,
          timestamp,
          monarchsDefeatedCount: s.livingWorld?.activeMonarchs?.filter(m => m.status === 'defeated').length ?? 0,
          coopCount: s.livingWorld?.coopCount ?? 0,
        }
        
        const nextHardcoreState = {
          ...hardcore,
          victoryCount: (hardcore.victoryCount ?? 0) + 1,
          clearHistory: [...(hardcore.clearHistory ?? []), newHistoryEntry],
          worldThreat: 0,
          gateEchoes: [],
        }

        // 4. 새로운 세계 생성
        const completedEndingMode = s.livingWorld?.endingMode
        const nextLivingWorld = initLivingWorld(Math.floor(Math.random() * 99999999) + 1)
        nextLivingWorld.endingState = 'none'
        nextLivingWorld.endingMode = undefined

        set({
          hunter: initialHunter,
          quests: resetQuests,
          items: [],
          titles: [],
          messages: [
            {
              id: uid(),
              kind: 'info',
              title: completedEndingMode === 'true' ? '새로운 차원의 세계 강림' : '다음 차원 진입',
              lines: completedEndingMode === 'true'
                ? [
                  `이전 차원의 세계(Day ${s.livingWorld?.day ?? 0})에서 최종 기록을 완성하고 새로운 균열 차원에 도달했습니다.`,
                  '레벨, 스탯, 장비, 그림자, 골드가 차원 순화(초기화)되었으며, 새로운 동적 시뮬레이션 세계가 생성되었습니다.',
                  '메타 진행도에 최종 기록이 영구히 각인되었습니다.'
                ]
                : [
                  `이전 차원의 세계(Day ${s.livingWorld?.day ?? 0})를 클리어하고 다음 균열 차원에 진입했습니다.`,
                  '레벨, 스탯, 장비, 그림자, 골드가 차원 순화(초기화)되었으며, 새로운 동적 시뮬레이션 세계가 생성되었습니다.',
                  '이전 회차의 잔향 기록이 보존되었습니다.'
                ],
              createdAt: todayISO()
            }
          ],
          achievementStats: createInitialAchievementStats(),
          activeRandomQuest: undefined,
          randomQuestHistory: {},
          equipment: {},
          activeConsumableEffects: [],
          gateStatus: createInitialGateStatus(),
          activeGate: undefined,
          activeWorldGate: undefined,
          activeRiftNodeId: undefined,
          riftNodes: (() => {
            const nodes: Record<string, RiftNodeStatus> = {}
            RIFT_NODES.forEach((n) => {
              nodes[n.id] = n.status
            })
            return nodes
          })(),
          livingWorld: nextLivingWorld,
          activeWorldBattle: undefined,
          combatLogs: [],
          manualBattleSession: undefined,
          ownedShadows: [],
          equippedShadowIds: [],
          shadowExtractHistory: [],
          shadowExtractFailCount: {},
          lastShadowExtractResult: undefined,
          gold: 0,
          shadowEssence: 0,
          shadowSummonTickets: [],
          shadowSummonShards: {},
          shadowFragments: {},
          shadowAchievementTicketClaims: {},
          shadowExpeditions: [],
          lastShadowExpeditionDate: undefined,
          activeShadowExpeditionId: undefined,
          infiniteTower: createInitialTowerState(),
          worldBattleRetreats: {},
          rewardBoxes: [],
          lastDailyBoxDate: undefined,
          lastWeeklyBoxWeek: undefined,
          todayChallengeCards: [],
          selectedChallengeCardIds: [],
          lastChallengeCardDate: undefined,
          challengeCardHistory: {},
          shopPurchases: {},
          skillStates: {},
          secretProgress: resetSecretProgressOnLoop(s.secretProgress),
          shadowAutoSweepState: {
            lastClaimTime: new Date().toISOString(),
            assignedShadowIds: [],
          },
          aiCoachCoreContext: preservedAiCoachCoreContext,
          aiCoachMemory: preservedAiCoachMemory,
          dailyProgression: preservedDailyProgression,
          focusSession: preservedFocusSession,
          hunterGrade: createInitialHunterGradeState({
            hunter: initialHunter,
            focusSession: preservedFocusSession,
            achievementStats: createInitialAchievementStats(),
          }),
          hardcoreState: nextHardcoreState,
          initialized: true,
        })
      },

      recordAiCoachSession: (session) => set((s) => {
        const memory = s.aiCoachMemory ?? {
          sessions: [],
          questOutcomes: [],
          rollingSummary: {
            windowDays: 7,
            repeatedFailures: [],
            stableHabits: [],
            improvingAreas: [],
            overloadedAreas: [],
            recentWorkoutFocus: [],
            recentStudyFocus: [],
            sleepPattern: '패턴 분석 중',
            coachNotes: ['학습 데이터 부족 (며칠 더 사용하면 코치가 패턴을 학습합니다)']
          }
        }

        const newSession: AiCoachSessionRecord = {
          ...session,
          id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString()
        }

        // 중복 방지: 같은 date의 세션이 이미 있으면 덮어쓰기 (재분석 시)
        const filteredSessions = memory.sessions.filter(se => se.date !== session.date)
        const nextSessions = [...filteredSessions, newSession]

        // 최대 60개 유지
        if (nextSessions.length > 60) {
          nextSessions.shift()
        }

        const nextMemory = {
          ...memory,
          sessions: nextSessions,
          lastUpdatedAt: new Date().toISOString()
        }

        return {
          aiCoachMemory: nextMemory
        }
      }),

      recordAiCoachPlannedQuests: (quests) => set((s) => {
        const memory = s.aiCoachMemory ?? {
          sessions: [],
          questOutcomes: [],
          rollingSummary: {
            windowDays: 7,
            repeatedFailures: [],
            stableHabits: [],
            improvingAreas: [],
            overloadedAreas: [],
            recentWorkoutFocus: [],
            recentStudyFocus: [],
            sleepPattern: '패턴 분석 중',
            coachNotes: ['학습 데이터 부족 (며칠 더 사용하면 코치가 패턴을 학습합니다)']
          }
        }

        const newOutcomes: AiCoachQuestOutcome[] = []
        quests.forEach(q => {
          // 중복 방지: 동일한 questId가 없을 때만
          const exists = memory.questOutcomes.some(out => out.questId === q.questId)
          if (!exists) {
            newOutcomes.push({
              ...q,
              status: 'added',
              addedAt: new Date().toISOString()
            })
          }
        })

        if (newOutcomes.length === 0) return {}

        const nextOutcomes = [...memory.questOutcomes, ...newOutcomes]
        // 최대 200개 유지
        while (nextOutcomes.length > 200) {
          nextOutcomes.shift()
        }

        const nextMemory = {
          ...memory,
          questOutcomes: nextOutcomes,
          lastUpdatedAt: new Date().toISOString()
        }

        return {
          aiCoachMemory: nextMemory
        }
      }),

      updateAiCoachQuestOutcomeOnComplete: (questId) => set((s) => {
        const memory = s.aiCoachMemory
        if (!memory) return {}

        let changed = false
        const nextOutcomes = memory.questOutcomes.map(out => {
          if (out.questId === questId && out.status === 'added') {
            changed = true
            return {
              ...out,
              status: 'completed' as const,
              completedAt: new Date().toISOString()
            }
          }
          return out
        })

        if (!changed) return {}

        const nextMemory = {
          ...memory,
          questOutcomes: nextOutcomes,
          lastUpdatedAt: new Date().toISOString()
        }

        // 상태가 변경되었으므로 비동기적으로 롤링 통계를 재빌드합니다.
        setTimeout(() => {
          get().rebuildAiCoachRollingSummary()
        }, 0)

        return {
          aiCoachMemory: nextMemory
        }
      }),

      rebuildAiCoachRollingSummary: () => set((s) => {
        const memory = s.aiCoachMemory
        if (!memory) return {}

        const nextRollingSummary = computeRollingSummary(s)

        return {
          aiCoachMemory: {
            ...memory,
            rollingSummary: nextRollingSummary,
            lastUpdatedAt: new Date().toISOString()
          }
        }
      }),

      updateAiCoachCoreContext: (text) => set((s) => {
        const coreContext: AiCoachCoreContext = {
          text,
          updatedAt: new Date().toISOString(),
          version: 1
        }
        return {
          aiCoachCoreContext: coreContext
        }
      }),

      clearAiCoachCoreContext: () => set((s) => {
        return {
          aiCoachCoreContext: undefined
        }
      }),

      // ── 12-40F: Daily Progression ─────────────────────────────────────
      recalculateDailyProgression: () => set((s) => {
        const dp = buildDailyProgression(s.quests, s.achievementStats)
        return { dailyProgression: dp }
      }),

      // ── 12-41A: Focus Session / Infiltration ───────────────────────────
      startFocusSession: (plannedDurationMs: number, linkedGateId?: string) => set((s) => {
        const now = Date.now()
        const active: ActiveFocusSession = {
          id: `focus-${now}-${Math.random().toString(36).slice(2, 6)}`,
          startedAt: now,
          plannedDurationMs,
          accumulatedFocusedMs: 0,
          lastForegroundAt: now,
          interruptions: [],
          linkedGateId,
          status: 'running'
        }
        const focusSession = s.focusSession ?? { history: [], totalFocusedMs: 0 }
        return {
          focusSession: {
            ...focusSession,
            active
          }
        }
      }),

      tickFocusSession: (customNow?: number) => {
        const s = get()
        const focusSession = s.focusSession
        if (!focusSession || !focusSession.active || focusSession.active.status !== 'running') return

        const now = customNow ?? Date.now()
        const active = focusSession.active
        const elapsed = Math.max(0, now - (active.lastForegroundAt ?? now))
        
        const updatedActive: ActiveFocusSession = {
          ...active,
          accumulatedFocusedMs: Math.min(active.plannedDurationMs, active.accumulatedFocusedMs + elapsed),
          lastForegroundAt: now
        }

        set({
          focusSession: {
            ...focusSession,
            active: updatedActive
          }
        })

        if (updatedActive.accumulatedFocusedMs >= active.plannedDurationMs) {
          get().completeFocusSession(now)
        }
      },

      pauseFocusSession: (customNow?: number) => set((s) => {
        const focusSession = s.focusSession
        if (!focusSession || !focusSession.active || focusSession.active.status !== 'running') return {}
        const now = customNow ?? Date.now()
        const active = focusSession.active
        const elapsed = Math.max(0, now - (active.lastForegroundAt ?? now))
        
        const updatedActive: ActiveFocusSession = {
          ...active,
          status: 'paused',
          accumulatedFocusedMs: Math.min(active.plannedDurationMs, active.accumulatedFocusedMs + elapsed),
          lastForegroundAt: undefined
        }
        
        return {
          focusSession: {
            ...focusSession,
            active: updatedActive
          }
        }
      }),

      resumeFocusSession: (customNow?: number) => set((s) => {
        const focusSession = s.focusSession
        if (!focusSession || !focusSession.active || focusSession.active.status !== 'paused') return {}
        const now = customNow ?? Date.now()
        const active = focusSession.active
        
        const updatedActive: ActiveFocusSession = {
          ...active,
          status: 'running',
          lastForegroundAt: now
        }
        
        return {
          focusSession: {
            ...focusSession,
            active: updatedActive
          }
        }
      }),

      recordFocusInterruption: (durationMs: number, customNow?: number) => set((s) => {
        const focusSession = s.focusSession
        if (!focusSession || !focusSession.active) return {}
        const now = customNow ?? Date.now()
        const active = focusSession.active
        
        const newInterruption: FocusSessionInterruption = {
          at: now,
          durationMs
        }
        const updatedActive: ActiveFocusSession = {
          ...active,
          interruptions: [...active.interruptions, newInterruption],
          lastForegroundAt: now
        }
        
        return {
          focusSession: {
            ...focusSession,
            active: updatedActive
          }
        }
      }),

      completeFocusSession: (customNow?: number) => {
        const s = get()
        const focusSession = s.focusSession
        if (!focusSession || !focusSession.active) return

        const now = customNow ?? Date.now()
        const active = focusSession.active
        
        let elapsed = 0
        if (active.status === 'running' && active.lastForegroundAt) {
          elapsed = Math.max(0, now - active.lastForegroundAt)
        }
        const finalFocusedMs = Math.min(active.plannedDurationMs, active.accumulatedFocusedMs + elapsed)
        
        const dpResist = s.dailyProgression?.redGateResistBonus ?? 0
        
        const rewards = buildFocusSessionReward(
          finalFocusedMs,
          active.plannedDurationMs,
          true,
          active.interruptions.length,
          active.linkedGateId,
          dpResist
        )
        
        const newRecord: FocusSessionRecord = {
          id: active.id,
          startedAt: active.startedAt,
          endedAt: now,
          plannedDurationMs: active.plannedDurationMs,
          focusedMs: finalFocusedMs,
          completed: true,
          interruptionCount: active.interruptions.length,
          linkedGateId: active.linkedGateId,
          rewards,
          totalInterruptedMs: active.totalInterruptedMs ?? 0,
          allowedInterruptionMs: active.allowedInterruptionMs ?? 60000
        }
        
        const nextGold = (s.gold ?? 0) + rewards.gold
        const nextEssence = (s.shadowEssence ?? 0) + rewards.essence
        const nextFragments = { ...(s.shadowFragments ?? {}) }
        
        let fragmentRewardText = ''
        if (rewards.shadowFragments && active.linkedGateId) {
          const fid = `fragment-${active.linkedGateId}`
          nextFragments[fid] = (nextFragments[fid] ?? 0) + rewards.shadowFragments
          const gateDef = GATE_DEFINITIONS.find(g => g.id === active.linkedGateId)
          fragmentRewardText = `, [${gateDef?.name ?? '게이트'} 조각] +${rewards.shadowFragments}`
        }
        
        let nextActiveGate = s.activeGate
        if (rewards.instabilityAdded && nextActiveGate && nextActiveGate.runState?.redGateState) {
          const red = nextActiveGate.runState.redGateState
          if (red.status !== 'opened' && red.status !== 'cleared' && red.status !== 'failed') {
            red.instabilityScore = Math.min(100, (red.instabilityScore ?? 0) + rewards.instabilityAdded)
            red.status = 'unstable'
          }
        }
        
        let nextHistory = [newRecord, ...focusSession.history]
        if (nextHistory.length > 100) {
          nextHistory = nextHistory.slice(0, 100)
        }
        const nextTotalFocusedMs = focusSession.totalFocusedMs + finalFocusedMs
        
        set({
          gold: nextGold,
          shadowEssence: nextEssence,
          shadowFragments: nextFragments,
          activeGate: nextActiveGate,
          focusSession: {
            active: undefined,
            history: nextHistory,
            totalFocusedMs: nextTotalFocusedMs
          },
          messages: [
            ...s.messages,
            {
              id: uid(),
              kind: 'quest',
              title: '집중 잠입 완료',
              lines: [
                `성공적으로 게이트 심층 잠입을 완수했습니다.`,
                `집중 시간: ${Math.floor(finalFocusedMs / 60000)}분`,
                `획득 보상: 그림자 정수 +${rewards.essence}, 골드 +${rewards.gold}${fragmentRewardText}`,
                rewards.extractionBonus ? `[추출 공명] 해당 게이트의 그림자 추출 성공률이 추가로 +${Math.round(rewards.extractionBonus * 100)}% 상승합니다.` : '',
                `협회 평가 기록에 반영될 집중 기록이 저장되었습니다.`
              ].filter(Boolean),
              createdAt: todayISO()
            }
          ]
        })
        
        get().recalculateDailyProgression()
        get().recalculateHunterGrade('집중 세션 완료')

        const elapsedMinutes = Math.floor(finalFocusedMs / 60000)
        const dailyTotalMs = nextTotalFocusedMs
        const dailyTotalHours = dailyTotalMs / 3600000
        const readinessLevel = get().dailyProgression?.readinessLevel
        
        if (readinessLevel === 'transcendent' || readinessLevel === 'resonant' || dailyTotalHours >= 4) {
          get().emitWorldSignal('focus_resonance_severe')
        } else if (elapsedMinutes >= 50 && active.interruptions.length === 0) {
          get().emitWorldSignal('focus_resonance_distorted')
        } else if (elapsedMinutes >= 25) {
          get().emitWorldSignal('focus_resonance_clear')
        } else {
          get().emitWorldSignal('focus_resonance_faint')
        }

        // 집중 완주 시 현실 노력 공명(resonance)에 따른 Echo 공명도 누적
        if (elapsedMinutes >= 25) {
          set(prev => applySecretProgressEvent(prev, {
            context: 'echo',
            action: 'resonance',
            amount: elapsedMinutes >= 50 ? 3 : 1
          }))
        }
        
        // 일일 도전과제 달성 체크
        set(current => applyChallengeProgress(current, { focusCompleted: true }))
        
        setTimeout(() => {
          get().checkJobAwakening()
        }, 0)
      },

      cancelFocusSession: (failReason?: 'interruption_limit_exceeded' | 'manual_cancel' | 'refresh_guard' | 'unknown', customNow?: number) => {
        const s = get()
        const focusSession = s.focusSession
        if (!focusSession || !focusSession.active) return

        const now = customNow ?? Date.now()
        const active = focusSession.active
        const actualReason = failReason ?? 'manual_cancel'
        
        let elapsed = 0
        if (active.status === 'running' && active.lastForegroundAt) {
          elapsed = Math.max(0, now - active.lastForegroundAt)
        }
        const finalFocusedMs = Math.min(active.plannedDurationMs, active.accumulatedFocusedMs + elapsed)
        
        const dpResist = s.dailyProgression?.redGateResistBonus ?? 0
        
        const rewards = buildFocusSessionReward(
          finalFocusedMs,
          active.plannedDurationMs,
          false,
          active.interruptions.length,
          active.linkedGateId,
          dpResist
        )
        
        const newRecord: FocusSessionRecord = {
          id: active.id,
          startedAt: active.startedAt,
          endedAt: now,
          plannedDurationMs: active.plannedDurationMs,
          focusedMs: finalFocusedMs,
          completed: false,
          interruptionCount: active.interruptions.length,
          linkedGateId: active.linkedGateId,
          rewards,
          failReason: actualReason,
          failedAt: now,
          totalInterruptedMs: active.totalInterruptedMs ?? 0,
          allowedInterruptionMs: active.allowedInterruptionMs ?? 60000
        }
        
        // 실패 시 보상 0
        const nextGold = s.gold ?? 0
        const nextEssence = s.shadowEssence ?? 0
        const nextFragments = s.shadowFragments ?? {}
        
        let nextActiveGate = s.activeGate
        if (rewards.instabilityAdded && nextActiveGate && nextActiveGate.runState?.redGateState) {
          const red = nextActiveGate.runState.redGateState
          if (red.status !== 'opened' && red.status !== 'cleared' && red.status !== 'failed') {
            red.instabilityScore = Math.min(100, (red.instabilityScore ?? 0) + rewards.instabilityAdded)
            red.status = 'unstable'
          }
        }

        let nextHistory = [newRecord, ...focusSession.history]
        if (nextHistory.length > 100) {
          nextHistory = nextHistory.slice(0, 100)
        }
        
        // 실패 시 totalFocusedMs 가산 차단 (성공 시간만 누적)
        const nextTotalFocusedMs = focusSession.totalFocusedMs
        
        let msgTitle = '집중 타이머 중단'
        let msgLines: string[] = []
        
        if (actualReason === 'manual_cancel') {
          msgTitle = '집중 타이머 중단'
          msgLines = [
            `사용자가 수동으로 집중 타이머를 중단했습니다.`,
            `집중 시간: ${Math.floor(finalFocusedMs / 60000)}분 (누적 이탈: ${Math.floor((active.totalInterruptedMs ?? 0) / 1000)}초)`,
            `완주 성공 시에만 골드와 그림자 정수를 획득할 수 있습니다. 확보된 성장 보상은 없지만, 다시 시작할 수 있습니다.`
          ]
        } else if (actualReason === 'interruption_limit_exceeded') {
          msgTitle = '집중 유지 실패'
          msgLines = [
            `허용 이탈 시간을 초과하여 집중 세션이 실패 처리되었습니다.`,
            `집중 시간: ${Math.floor(finalFocusedMs / 60000)}분 (누적 이탈: ${Math.floor((active.totalInterruptedMs ?? 0) / 1000)}초 / 허용: ${Math.floor((active.allowedInterruptionMs ?? 60000) / 1000)}초)`,
            `완주 성공 시에만 골드와 그림자 정수를 획득할 수 있습니다. 확보된 성장 보상은 없지만, 다시 시작할 수 있습니다.`,
            rewards.instabilityAdded ? `[게이트 상태 동요] 이탈 허용 초과로 인해 게이트 내부 불안정성이 +${rewards.instabilityAdded}만큼 누적되었습니다.` : ''
          ]
        } else if (actualReason === 'refresh_guard') {
          msgTitle = '집중 세션 연결 끊김'
          msgLines = [
            `세션 연결이 끊겨 이번 집중 기록은 완료 처리되지 않았습니다.`,
            `확보된 성장 보상은 없지만, 다시 시작할 수 있습니다.`
          ]
        }

        set({
          gold: nextGold,
          shadowEssence: nextEssence,
          shadowFragments: nextFragments,
          activeGate: nextActiveGate,
          focusSession: {
            active: undefined,
            history: nextHistory,
            totalFocusedMs: nextTotalFocusedMs
          },
          messages: [
            ...s.messages,
            {
              id: uid(),
              kind: 'quest',
              title: msgTitle,
              lines: msgLines.filter(Boolean),
              createdAt: todayISO()
            }
          ]
        })
        
        get().recalculateDailyProgression()
        get().emitWorldSignal('focus_resonance_faint')
        setTimeout(() => {
          get().checkJobAwakening()
        }, 0)
      },

      recalculateHunterGrade: (reason) => {
        set(s => {
          const prevExam = s.hunterGrade?.pendingExam
          const nextGradeState = recalcHunterGradeState(s.hunterGrade, s, reason)
          const nextExam = nextGradeState.pendingExam
          
          if (nextExam && nextExam.status === 'available' && (!prevExam || prevExam.status !== 'available')) {
            setTimeout(() => {
              if (nextExam.targetGrade === 'NATIONAL') {
                get().emitWorldSignal('promotion_sealed_national')
              } else {
                get().emitWorldSignal('promotion_exam_available')
              }
            }, 0)
          }
          
          return { hunterGrade: nextGradeState }
        })
      },

      emitWorldSignal: (templateId) => {
        set(s => {
          const secretState = s.secretProgress ? { ...s.secretProgress } : undefined
          if (!secretState) return {}
          const { progress, signal } = emitWorldSignal(secretState, templateId)
          if (!signal) return { secretProgress: progress }
          
          const message: SystemMessage = {
            id: uid(),
            kind: 'secret',
            title: signal.title,
            lines: [signal.body],
            createdAt: todayISO()
          }
          return {
            secretProgress: progress,
            messages: [...s.messages, message]
          }
        })
      },

      equipHunterTitle: (titleId) => {
        set(s => {
          if (!s.hunterGrade) return {}
          if (!s.hunterGrade.unlockedTitles.includes(titleId)) return {}
          
          const newGradeState = {
            ...s.hunterGrade,
            equippedTitleId: titleId
          }
          
          return {
            hunterGrade: newGradeState,
            hunter: {
              ...s.hunter,
              equippedTitleId: titleId
            }
          }
        })
      },

      acknowledgePromotionExam: () => {
        set(s => {
          if (!s.hunterGrade || !s.hunterGrade.pendingExam) return {}
          return {
            hunterGrade: {
              ...s.hunterGrade,
              pendingExam: {
                ...s.hunterGrade.pendingExam,
                status: s.hunterGrade.pendingExam.status === 'available' ? 'available' : s.hunterGrade.pendingExam.status
              }
            }
          }
        })
      },

      startPromotionExam: (targetGrade) => {
        const s = get()
        if (s.activeGate && s.activeGate.status === 'active') {
          set({
            messages: appendMessageOnce(s.messages, {
              id: uid(),
              kind: 'info',
              title: '승급 시험 불가',
              lines: ['현재 이미 활성화된 게이트가 존재합니다. 공략을 완료하거나 포기한 뒤 시도하십시오.'],
              createdAt: todayISO(),
            })
          })
          return
        }

        let searchRank = targetGrade as string
        if (targetGrade === 'NATIONAL') {
          searchRank = 'S'
        }

        const candidates = GATE_DEFINITIONS.filter(g => g.rank === searchRank)
        const fallback = GATE_DEFINITIONS.filter(g => g.rank === 'S')
        const pool = candidates.length > 0 ? candidates : fallback
        const baseGate = pool[Math.floor(Math.random() * pool.length)]

        if (!baseGate) return

        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setHours(expiresAt.getHours() + 24)

        const seed = `exam-${targetGrade}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        const runState = generateGateRunState(baseGate.id, seed, targetGrade)
        
        let difficultyMod = 1.0
        if (targetGrade !== 'E') {
          const examDef = PROMOTION_EXAM_DEFINITIONS[targetGrade]
          if (examDef) {
            difficultyMod = examDef.difficultyMod
          }
        }

        runState.difficultyMod = difficultyMod
        runState.isPromotionExam = true
        runState.targetGrade = targetGrade

        set({
          activeGate: {
            instanceId: `gate-exam-${targetGrade}-${Date.now()}`,
            gateId: baseGate.id,
            spawnedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            status: 'active',
            source: 'event',
            runState
          },
          hunterGrade: s.hunterGrade ? {
            ...s.hunterGrade,
            pendingExam: {
              targetGrade,
              status: 'in_progress',
              gateSeed: seed,
              createdAt: Date.now()
            }
          } : undefined,
          messages: appendMessageOnce(s.messages, {
            id: uid(),
            kind: 'quest',
            title: '협회 승급 심사 게이트 개방',
            lines: [
              `헌터 협회로부터 공식 [${GRADE_LABELS[targetGrade]}] 승급 심사령이 인가되었습니다.`,
              `심사 전용 특수 게이트가 배치되었으며, 난이도가 ${Math.round(difficultyMod * 100)}% 가혹하게 보정됩니다.`,
              `공략을 성공하여 헌터의 진정한 자격을 입증하십시오.`
            ],
            createdAt: todayISO(),
          })
        })
        setTimeout(() => {
          get().emitWorldSignal('promotion_exam_start')
        }, 0)
      },

      completePromotionExam: (targetGrade) => {
        set(s => {
          if (!s.hunterGrade) return {}
          
          const tiers: HunterGradeTier[] = ['E', 'D', 'C', 'B', 'A', 'S', 'NATIONAL']
          const targetIdx = tiers.indexOf(targetGrade)
          
          const historyEntry = {
            grade: targetGrade,
            at: Date.now(),
            reason: `[공식 승급 시험 공략 성공] ${GRADE_LABELS[targetGrade]} 승격`
          }
          
          const nextHistory = [...(s.hunterGrade.history || []), historyEntry]
          const nextUnlocked = Array.from(new Set([...(s.hunterGrade.unlockedTitles || []), `title_${targetGrade.toLowerCase()}`]))
          
          const cosmeticTier = targetGrade === 'NATIONAL' ? 6 : targetGrade === 'S' ? 5 : targetGrade === 'A' ? 4 : targetGrade === 'B' ? 3 : targetGrade === 'C' ? 2 : targetGrade === 'D' ? 1 : 0
          
          const nextGradeState: HunterGradeState = {
            ...s.hunterGrade,
            currentGrade: targetGrade,
            cosmeticTier,
            pendingExam: undefined,
            unlockedTitles: nextUnlocked,
            history: nextHistory,
            lastEvaluatedAt: Date.now()
          }
          
          const updatedHunter = {
            ...s.hunter,
            rank: targetGrade === 'NATIONAL' ? 'National' as any : targetGrade,
          }
          
          const titleName = HUNTER_TITLE_DEFINITIONS.find(t => t.id === `title_${targetGrade.toLowerCase()}`)?.name ?? ''
          
          return {
            hunterGrade: nextGradeState,
            hunter: updatedHunter,
            messages: [
              ...s.messages,
              {
                id: uid(),
                kind: 'rank',
                title: `★ 헌터 승급 성공 ★`,
                lines: [
                  `축하합니다! 공식 승급 심사를 통과하여 [${GRADE_LABELS[targetGrade]}]으로 공식 공인되었습니다.`,
                  `새로운 공식 칭호 [${titleName}]가 지급되었습니다.`,
                  `프로필 엠블럼의 오라 및 장식 테두리가 업그레이드되었습니다.`
                ],
                createdAt: todayISO(),
                grade: targetGrade
              }
            ]
          }
        })
        
        get().recalculateHunterGrade('승급 완료 반영 검사')
        setTimeout(() => {
          get().emitWorldSignal('promotion_exam_clear')
        }, 0)
      },

      checkGateClearHooks: (gateId, isVictory) => {
        const s = get()
        if (!isVictory) return

        const activeGate = s.activeGate?.gateId === gateId ? s.activeGate : undefined
        if (!activeGate) return

        const gate = GATE_DEFINITIONS.find(g => g.id === gateId)
        if (!gate) return

        const runState = activeGate.runState
        const isExam = runState?.isPromotionExam
        const examTarget = runState?.targetGrade

        if (isExam && examTarget) {
          get().completePromotionExam(examTarget)
        } else {
          const isRedGate = runState?.redGateState?.status === 'cleared' || runState?.redGateState?.status === 'opened'
          const isBoss = gate.rank === 'S' || gate.rewardTableId?.includes('boss')

          set(prev => {
            const nextAchievementStats: AchievementStats = {
              ...prev.achievementStats,
              gateClearedCount: (prev.achievementStats.gateClearedCount ?? 0) + 1,
              redGateClearedCount: isRedGate ? (prev.achievementStats.redGateClearedCount ?? 0) + 1 : (prev.achievementStats.redGateClearedCount ?? 0),
              bossKillsCount: isBoss ? (prev.achievementStats.bossKillsCount ?? 0) + 1 : (prev.achievementStats.bossKillsCount ?? 0),
            }
            const renownGain = getRenownGainForGate(gate.rank, false) + (isBoss ? 8 : 0)
            const renownResult = applyRenownGain(prev.hunter, prev, nextAchievementStats, renownGain, gate.name)
            const nextLivingWorld = renownResult.worldLog && prev.livingWorld
              ? {
                ...prev.livingWorld,
                eventLogs: [
                  ...prev.livingWorld.eventLogs,
                  `[Day ${prev.livingWorld.day}] ${renownResult.worldLog}`,
                ].slice(-60),
              }
              : prev.livingWorld

            return {
              hunter: renownResult.hunter,
              achievementStats: nextAchievementStats,
              messages: renownResult.messages.length > 0 ? [...prev.messages, ...renownResult.messages] : prev.messages,
              livingWorld: nextLivingWorld,
            }
          })

          // 8% 확률로 Echo 단서(낯익은 표식) 주입
          if (Math.random() < 0.08) {
            set(prev => applySecretProgressEvent(prev, { context: 'gate', outcome: 'victory' }))
          }

          if (isRedGate) {
            const instability = runState?.redGateState?.instabilityScore ?? 0
            const isHighPressure = runState?.pressureSnapshot && (runState.pressureSnapshot.readinessTier === 'transcendent' || runState.pressureSnapshot.monsterHpMultiplier >= 1.08)
            if (instability >= 80 && isHighPressure) {
              get().emitWorldSignal('red_gate_pressure_spike')
            } else {
              get().emitWorldSignal('red_gate_clear')
            }
          } else {
            const instability = runState?.redGateState?.instabilityScore ?? 0
            if (runState?.redGateState?.status === 'unstable' && instability >= 70) {
              get().emitWorldSignal('red_gate_leak')
            }
          }

          get().recalculateHunterGrade('게이트 공략 성공')
        }
      },

    }),
    {
      name: 'levelup-save',
      version: 32,
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
            useGame.getState().syncDefaultEquipmentStats()
          } catch {
            // ignore if store not ready
          }
        }, 0)
      },
      migrate: (persistedState: any, version: number) => {
        if (version < 32) {
          if (persistedState) {
            if (!persistedState.shadowAutoSweepState) {
              persistedState.shadowAutoSweepState = {
                lastClaimTime: new Date().toISOString(),
                assignedShadowIds: []
              };
            }
          }
        }
        if (version < 24) {
          if (persistedState) {
            persistedState.activeWorldBattle = undefined;
          }
        }
        if (version < 25) {
          if (persistedState && persistedState.livingWorld) {
            if (!persistedState.livingWorld.dailySummaries) {
              persistedState.livingWorld.dailySummaries = [];
            }
          }
        }
        if (version < 26) {
          if (persistedState && persistedState.livingWorld && persistedState.livingWorld.namedHunters) {
            const seed = persistedState.livingWorld.seed ?? 12345
            const namedHunters = persistedState.livingWorld.namedHunters
            const hKeys = Object.keys(namedHunters)
            hKeys.forEach((hid, idx) => {
              const h = namedHunters[hid]
              if (h && !h.traitId) {
                const rng = createSeededRng(seed + idx)
                h.traitId = rollHunterTrait(rng)
              }
            })
          }
        }
        if (version < 27) {
          if (persistedState?.livingWorld) {
            persistedState.livingWorld.endingState = persistedState.livingWorld.endingState ?? 'none'
            if (persistedState.livingWorld.endingState !== 'victory') {
              persistedState.livingWorld.endingMode = undefined
            }
          }
          if (persistedState?.secretProgress) {
            persistedState.secretProgress = ensureSecretProgress(persistedState.secretProgress, persistedState)
            const flags = persistedState.secretProgress.flags ?? {}
            persistedState.secretProgress.flags = flags
            persistedState.secretProgress.counters = {
              ...(persistedState.secretProgress.counters ?? {}),
              trueEndingReached: flags.trueEndingReached ? 1 : 0,
              surfaceEndingReached: flags.surfaceEndingReached ? 1 : 0,
              loopEndingReached: flags.loopEndingReached ? 1 : 0,
            }
            persistedState.secretProgress.signals = {
              ...(persistedState.secretProgress.signals ?? {}),
              trueEndingReached: flags.trueEndingReached ? 1 : 0,
              surfaceEndingReached: flags.surfaceEndingReached ? 1 : 0,
              loopEndingReached: flags.loopEndingReached ? 1 : 0,
            }
          }
        }
        if (version < 28 && persistedState?.hunter) {
          persistedState.hunter.renown = getEffectiveRenown(
            {
              level: persistedState.hunter.level ?? 1,
              renown: persistedState.hunter.renown ?? 0,
            },
            persistedState.achievementStats,
            getMonarchsDefeatedCount(persistedState.livingWorld)
          )
        }
        // Ensure hunter has title fields
        if (persistedState?.hunter) {
          if (!('renown' in persistedState.hunter)) {
            persistedState.hunter.renown = getEffectiveRenown(
              {
                level: persistedState.hunter.level ?? 1,
                renown: 0,
              },
              persistedState.achievementStats,
              getMonarchsDefeatedCount(persistedState.livingWorld)
            )
          }
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

          // ── Job System v2 Migration ──────────────────────────────────
          if (!persistedState.hunter.activeJobId) {
            const legacyId = persistedState.hunter.jobId || 'unawakened'
            const legacyToV2Map: Record<string, string> = {
              'unawakened': 'novice-hunter',
              'golden-eye-diviner': 'scout',
              'grimoire-decoder': 'mage',
              'iron-squire': 'warrior',
              'silent-monk': 'guardian',
              'nameless-awakened': 'tactician',
              'golden-oracle': 'abyss-stalker',
              'abyss-archivist': 'chronomancer',
              'steelheart-fighter': 'berserker',
              'chrono-judge': 'paladin',
              'fate-harmonizer': 'grand-strategist'
            }
            const activeV2Id = (legacyToV2Map[legacyId] || 'novice-hunter') as JobId
            persistedState.hunter.activeJobId = activeV2Id
            
            const unlockedList: JobId[] = (persistedState.hunter.unlockedJobIds || ['unawakened'])
              .map((id: string) => (legacyToV2Map[id] || id) as JobId)
              .filter((v: JobId, i: number, a: JobId[]) => a.indexOf(v) === i)

            persistedState.hunter.unlockedJobIds = unlockedList
            
            const jobsMap: Record<string, any> = {}
            unlockedList.forEach((v2Id) => {
              jobsMap[v2Id] = {
                jobId: v2Id,
                level: 1,
                xp: 0,
                unlockedAt: new Date().toISOString()
              }
            })
            persistedState.hunter.jobs = jobsMap
            persistedState.hunter.availableAdvancements = []
            persistedState.hunter.discoveredHiddenJobIds = []
            
            const jobNamesMap: Record<string, string> = {
              'novice-hunter': '초보 헌터',
              'swordsman': '검객',
              'warrior': '전사',
              'mage': '마법사',
              'guardian': '수호자',
              'scout': '추적자',
              'tactician': '전술가',
              'swordsmaster': '검호',
              'spellsword': '마검사',
              'berserker': '광전사',
              'paladin': '성역 기사',
              'chronomancer': '시간술사',
              'battle-alchemist': '전투 연금술사',
              'abyss-stalker': '심연 추적자',
              'grand-strategist': '마도 전략가',
              'sword-saint': '검성',
              'rune-spellsword': '룬 마검사',
              'dragon-knight': '용혈 기사',
              'divine-guardian': '성역 수호자',
              'time-governor': '시간의 관리자',
              'sage-alchemist': '현자의 연금술사',
              'abyss-emperor': '심연검제',
              'grand-master-strategist': '마도 전략가 상위직',
              'shadow-lord': '그림자 군주',
              'puppet-master': '저주 인형사',
              'soul-reaper': '영혼 약탈자',
              'dimension-hunter': '차원 사냥꾼'
            }
            persistedState.hunter.job = jobNamesMap[activeV2Id] || '초보 헌터'
            persistedState.hunter.jobId = activeV2Id
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
        } else if (persistedState.activeGate && persistedState.activeGate.status === 'active') {
          if (!persistedState.activeGate.runState) {
            const gate = persistedState.activeGate
            const seed = `${gate.gateId}-${Date.now()}`
            persistedState.activeGate.runState = generateGateRunState(gate.gateId, seed)
          } else if (persistedState.activeGate.runState.encounters) {
            // 이미 생성된 기존 던전런 중 선택지가 유실된 인카운터들을 복원 및 강제 재수화
            persistedState.activeGate.runState.encounters = persistedState.activeGate.runState.encounters.map(
              (encounter: any) => hydrateGateRunEncounterChoices(encounter)
            )
          }
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
        if (!persistedState.shadowExtractFailCount) {
          persistedState.shadowExtractFailCount = {}
        }
        if (!('lastShadowExtractResult' in persistedState)) {
          persistedState.lastShadowExtractResult = undefined
        }
        if (!('gold' in persistedState)) {
          persistedState.gold = 0
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
        if (!persistedState.shopPurchases) {
          persistedState.shopPurchases = {}
        }
        persistedState.skillStates = normalizeSkillStates(persistedState.skillStates ?? persistedState.skillMastery)
        delete persistedState.skillMastery
        persistedState.secretProgress = ensureSecretProgress(persistedState.secretProgress, persistedState)
        persistedState.manualBattleSession = undefined
        if (!persistedState.aiCoachCoreContext) {
          persistedState.aiCoachCoreContext = undefined
        }
        if (!persistedState.aiCoachMemory) {
          persistedState.aiCoachMemory = {
            sessions: [],
            questOutcomes: [],
            rollingSummary: {
              windowDays: 7,
              repeatedFailures: [],
              stableHabits: [],
              improvingAreas: [],
              overloadedAreas: [],
              recentWorkoutFocus: [],
              recentStudyFocus: [],
              sleepPattern: '패턴 분석 중',
              coachNotes: ['학습 데이터 부족 (며칠 더 사용하면 코치가 패턴을 학습합니다)']
            }
          }
        } else {
          // 존재하더라도 내부 nested 필드들의 존재성 보장 (안정성 극대화)
          const memory = persistedState.aiCoachMemory
          if (!Array.isArray(memory.sessions)) memory.sessions = []
          if (!Array.isArray(memory.questOutcomes)) memory.questOutcomes = []
          if (!memory.rollingSummary) {
            memory.rollingSummary = {
              windowDays: 7,
              repeatedFailures: [],
              stableHabits: [],
              improvingAreas: [],
              overloadedAreas: [],
              recentWorkoutFocus: [],
              recentStudyFocus: [],
              sleepPattern: '패턴 분석 중',
              coachNotes: ['학습 데이터 부족 (며칠 더 사용하면 코치가 패턴을 학습합니다)']
            }
          } else {
            const rs = memory.rollingSummary
            if (!Array.isArray(rs.repeatedFailures)) rs.repeatedFailures = []
            if (!Array.isArray(rs.stableHabits)) rs.stableHabits = []
            if (!Array.isArray(rs.improvingAreas)) rs.improvingAreas = []
            if (!Array.isArray(rs.overloadedAreas)) rs.overloadedAreas = []
            if (!Array.isArray(rs.recentWorkoutFocus)) rs.recentWorkoutFocus = []
            if (!Array.isArray(rs.recentStudyFocus)) rs.recentStudyFocus = []
            if (!rs.sleepPattern) rs.sleepPattern = '패턴 분석 중'
            if (!Array.isArray(rs.coachNotes)) rs.coachNotes = ['학습 데이터 부족 (며칠 더 사용하면 코치가 패턴을 학습합니다)']
          }
        }

        // MainQuest v2 / Milestone 구조 마이그레이션 fallback
        if (Array.isArray(persistedState.quests)) {
          persistedState.quests = persistedState.quests.map((q: any) => {
            if (q.type === 'main') {
              let milestones = q.milestones
              
              // 1. 만약 milestones가 아예 없거나 빈 배열이고, default seed에 정의된 퀘스트라면 시드에서 수동 설계된 milestones를 가져와 주입한다.
              if (!milestones || (Array.isArray(milestones) && milestones.length === 0)) {
                const defaultQuest = initialQuests.find((def: any) => def.id === q.id)
                if (defaultQuest && Array.isArray(defaultQuest.milestones)) {
                  milestones = defaultQuest.milestones
                }
              }

              // 2. 이미 존재하는 milestones 배열의 표준화
              if (Array.isArray(milestones) && milestones.length > 0) {
                milestones = milestones.map((m: any, idx: number) => {
                  if (typeof m === 'string') {
                    return {
                      id: `ms-${idx}-${Math.random().toString(36).slice(2, 6)}`,
                      title: m,
                      status: idx === 0 ? 'active' : 'locked',
                      order: idx,
                      importance: 'normal'
                    }
                  }
                  return {
                    ...m,
                    id: m.id || `ms-${idx}-${Math.random().toString(36).slice(2, 6)}`,
                    title: m.title || '',
                    status: m.status || (idx === 0 ? 'active' : 'locked'),
                    order: typeof m.order === 'number' ? m.order : idx,
                    importance: m.importance || 'normal'
                  }
                })
              } else {
                milestones = []
              }

              return {
                ...q,
                finalGoal: q.finalGoal || q.title || '',
                milestones,
                progressPercent: typeof q.progressPercent === 'number' ? q.progressPercent : 0,
                status: q.status || 'active',
                source: q.source || 'user'
              }
            }
            return q
          })
        } else {
          persistedState.quests = []
        }

        // 기타 핵심 배열 필드들의 존재성 강제 보장
        if (!Array.isArray(persistedState.items)) persistedState.items = []
        if (!Array.isArray(persistedState.ownedShadows)) persistedState.ownedShadows = []
        if (!Array.isArray(persistedState.equippedShadowIds)) persistedState.equippedShadowIds = []
        if (!Array.isArray(persistedState.combatLogs)) persistedState.combatLogs = []
        if (!Array.isArray(persistedState.shadowSummonTickets)) persistedState.shadowSummonTickets = []
        if (!persistedState.shadowSummonShards) persistedState.shadowSummonShards = {}
        if (!persistedState.shadowFragments) persistedState.shadowFragments = {}
        if (!persistedState.shadowAchievementTicketClaims) persistedState.shadowAchievementTicketClaims = {}
        if (!Array.isArray(persistedState.shadowExpeditions)) persistedState.shadowExpeditions = []
        if (!Array.isArray(persistedState.rewardBoxes)) persistedState.rewardBoxes = []
        if (!Array.isArray(persistedState.todayChallengeCards)) persistedState.todayChallengeCards = []
        if (!Array.isArray(persistedState.selectedChallengeCardIds)) persistedState.selectedChallengeCardIds = []
        if (!persistedState.challengeCardHistory) persistedState.challengeCardHistory = {}
        if (!persistedState.shopPurchases) persistedState.shopPurchases = {}
        if (!persistedState.shadowLegionNodes) persistedState.shadowLegionNodes = {}
        if (persistedState.activeGate && persistedState.activeGate.runState) {
          const run = persistedState.activeGate.runState
          if (!run.redGateState) {
            run.redGateState = { status: 'none', instabilityScore: 0 }
          }
        }

        // Ensure focusSession exists
        if (!persistedState.focusSession) {
          persistedState.focusSession = { history: [], totalFocusedMs: 0 }
        }

        // Ensure hardcoreState exists and is structured properly (12-44Z-FINAL)
        persistedState.hardcoreState = ensureHardcoreState(persistedState.hardcoreState)

        // 12-40F: dailyProgression 마이그레이션 가드 (기존 세이브 호환)
        // AI 플랜 날짜 기준이므로 calendar date가 달라져도 진행도를 유지.
        // dateKey가 없는 경우(구버전 데이터)만 초기화. recordAppOpen 시 재계산됨.
        if (persistedState.dailyProgression && !persistedState.dailyProgression.dateKey) {
          persistedState.dailyProgression = undefined
        }

        // 12-41C: hunterGrade save migration validation
        if (persistedState.hunterGrade) {
          const hg = persistedState.hunterGrade
          
          // 1. Recover a broken in_progress exam to available if activeGate is missing or not active.
          if (hg.pendingExam && hg.pendingExam.status === 'in_progress') {
            const activeGate = persistedState.activeGate
            const isGateActive = activeGate && activeGate.status === 'active' && activeGate.runState?.isPromotionExam
            if (!isGateActive) {
              hg.pendingExam.status = 'available'
            }
          }
          
          // 2. Delete pendingExam if currentGrade is already equal to or higher than targetGrade.
          if (hg.pendingExam && hg.currentGrade) {
            const GRADE_ORDER = ['E', 'D', 'C', 'B', 'A', 'S', 'NATIONAL']
            const curIdx = GRADE_ORDER.indexOf(hg.currentGrade)
            const targetIdx = GRADE_ORDER.indexOf(hg.pendingExam.targetGrade)
            if (curIdx >= 0 && targetIdx >= 0 && curIdx >= targetIdx) {
              hg.pendingExam = undefined
            }
          }
          
          // 3. Remove duplicate entries in history (unifying rank logs).
          if (Array.isArray(hg.history)) {
            const seen = new Set<string>()
            hg.history = hg.history.filter((entry: any) => {
              if (!entry || !entry.grade) return false
              if (seen.has(entry.grade)) {
                return false
              }
              seen.add(entry.grade)
              return true
            })
          }

          // 4. Force clamp currentGrade using clampMigratedGradeByEvidence to prevent legacy bug (e.g. level 9 being C-rank)
          if (hg.currentGrade && persistedState.hunter) {
            const correctGrade = clampMigratedGradeByEvidence(hg.currentGrade, persistedState)
            if (correctGrade !== hg.currentGrade) {
              hg.currentGrade = correctGrade
              hg.cosmeticTier = correctGrade === 'NATIONAL' ? 6 : correctGrade === 'S' ? 5 : correctGrade === 'A' ? 4 : correctGrade === 'B' ? 3 : correctGrade === 'C' ? 2 : correctGrade === 'D' ? 1 : 0
              
              if (Array.isArray(hg.history)) {
                hg.history = hg.history.map((entry: any) => {
                  if (entry.grade === 'C' && correctGrade === 'D') {
                    return { ...entry, grade: 'D' }
                  }
                  const GRADE_ORDER = ['E', 'D', 'C', 'B', 'A', 'S', 'NATIONAL']
                  const entryIdx = GRADE_ORDER.indexOf(entry.grade)
                  const correctIdx = GRADE_ORDER.indexOf(correctGrade)
                  if (entryIdx > correctIdx) {
                    return { ...entry, grade: correctGrade }
                  }
                  return entry
                })
                
                const seen = new Set<string>()
                hg.history = hg.history.filter((entry: any) => {
                  if (!entry || !entry.grade) return false
                  if (seen.has(entry.grade)) return false
                  seen.add(entry.grade)
                  return true
                })
              }
              
              if (Array.isArray(hg.unlockedTitles)) {
                hg.unlockedTitles = hg.unlockedTitles.filter((titleId: string) => {
                  const GRADE_ORDER = ['E', 'D', 'C', 'B', 'A', 'S', 'NATIONAL']
                  const correctIdx = GRADE_ORDER.indexOf(correctGrade)
                  if (titleId === 'title_c' && correctIdx < 2) return false
                  if (titleId === 'title_b' && correctIdx < 3) return false
                  if (titleId === 'title_a' && correctIdx < 4) return false
                  if (titleId === 'title_s' && correctIdx < 5) return false
                  if (titleId === 'title_national' && correctIdx < 6) return false
                  return true
                })
              }
            }
          }
        }

        // ── Rift World System (v15) 마이그레이션 ──
        if (persistedState) {
          if (!persistedState.riftNodes) {
            const initialNodes: Record<string, RiftNodeStatus> = {}
            RIFT_NODES.forEach((n) => {
              initialNodes[n.id] = n.status
            })
            persistedState.riftNodes = initialNodes
          }
          if (!('activeRiftNodeId' in persistedState)) {
            persistedState.activeRiftNodeId = undefined
          }
        }

        // ── Living Rift World System (v16) 마이그레이션 ──
        if (persistedState) {
          if (!persistedState.livingWorld) {
            const randomSeed = Math.floor(Math.random() * 99999999) + 1
            persistedState.livingWorld = initLivingWorld(randomSeed)
          }
        }

        // ── Living Rift World System MVP-2 (v17) 마이그레이션 ──
        if (persistedState && persistedState.livingWorld) {
          const lw = persistedState.livingWorld
          lw.worldCorruption ??= 0
          lw.monarchsAppeared ??= 0
          lw.eventLogs ??= ['[Day 0] 균열 대각성이 시작되었습니다.']
          
          if (!lw.riftNodes) {
            const rng = createSeededRng(lw.seed || 12345)
            const riftNodes: Record<string, any> = {}
            for (const node of RIFT_NODES) {
              let difficulty = 300
              if (node.difficultyRank === 'E') {
                difficulty = Math.round(300 + rng() * 300)
              } else if (node.difficultyRank === 'D') {
                difficulty = Math.round(700 + rng() * 350)
              } else if (node.difficultyRank === 'C') {
                difficulty = Math.round(1400 + rng() * 450)
              } else if (node.difficultyRank === 'S') {
                difficulty = Math.round(5000 + rng() * 5000)
              } else {
                difficulty = Math.round(300 + rng() * 1500)
              }
              const deadline = Math.round(10 + rng() * 6)
              const legacyStatus = persistedState.riftNodes?.[node.id] || node.status
              riftNodes[node.id] = {
                ...node,
                difficulty,
                deadline,
                daysRemaining: deadline,
                status: legacyStatus,
                isSGrade: node.difficultyRank === 'S' || node.difficultyRank === 'National'
              }
            }
            lw.riftNodes = riftNodes
          }

          if (lw.regions) {
            for (const regionId in lw.regions) {
              const reg = lw.regions[regionId]
              reg.corruption ??= 0
              if (!reg.activeGateIds) {
                reg.activeGateIds = Object.keys(lw.riftNodes).filter(
                  id => lw.riftNodes[id].regionId === regionId && lw.riftNodes[id].status === 'active'
                )
              }
            }
          }
        }

        // ── World Map Battle System L3 (v18) 마이그레이션 ──
        if (persistedState) {
          if (!('activeWorldBattle' in persistedState)) {
            persistedState.activeWorldBattle = undefined
          }
          if (!persistedState.worldBattleRetreats) {
            persistedState.worldBattleRetreats = {}
          }
        }

        // ── World Map NPC Cooperation L1-A (v19) 마이그레이션 ──
        if (persistedState && persistedState.livingWorld && persistedState.livingWorld.riftNodes) {
          for (const nodeId in persistedState.livingWorld.riftNodes) {
            const node = persistedState.livingWorld.riftNodes[nodeId]
            if (node && node.loveCall === undefined) {
              node.loveCall = undefined
            }
          }
        }

        // ── Living Rift World Monarch L4-A (v20) 마이그레이션 ──
        if (persistedState && persistedState.livingWorld) {
          const lw = persistedState.livingWorld
          if (!lw.activeMonarchs) {
            lw.activeMonarchs = []
          }
          if (!('homeReachedMonarchId' in lw)) {
            lw.homeReachedMonarchId = undefined
          }
        }

        // ── Living Rift World Monarch L4-B (v21) 마이그레이션 ──
        if (persistedState && persistedState.livingWorld) {
          const lw = persistedState.livingWorld
          if (!('angelReady' in lw)) {
            lw.angelReady = false
          }
        }

        // ── Living Rift World Ending & Clear History L4-C (v22) 마이그레이션 ──
        if (persistedState) {
          if (persistedState.livingWorld) {
            const lw = persistedState.livingWorld
            if (!('endingState' in lw)) {
              lw.endingState = 'none'
            }
            if (!('coopCount' in lw)) {
              lw.coopCount = 0
            }
          }
          if (persistedState.hardcoreState) {
            const hs = persistedState.hardcoreState
            if (!('victoryCount' in hs)) {
              hs.victoryCount = 0
            }
            if (!('clearHistory' in hs)) {
              hs.clearHistory = []
            }
          }
        }

        // ── Living Rift World Node Display Clean up & Guards Phase 1 (v23) 마이그레이션 ──
        if (persistedState && persistedState.livingWorld) {
          const lw = persistedState.livingWorld
          if (lw.riftNodes) {
            // 한국 초기 게이트가 세이브에 없으면 안전하게 주입해줍니다.
            if (!lw.riftNodes['node-kr-seoul']) {
              lw.riftNodes['node-kr-seoul'] = {
                id: 'node-kr-seoul',
                regionId: 'kr',
                name: '서울 동대문 균열',
                x: 84,
                y: 41,
                status: 'active',
                gateDefId: 'gate-rift-alley',
                difficultyRank: 'E',
                adjacentNodeIds: ['node-kr-incheon'],
                difficulty: 450,
                deadline: 12,
                daysRemaining: 12,
                isSGrade: false
              }
              if (lw.regions['kr'] && !lw.regions['kr'].activeGateIds.includes('node-kr-seoul')) {
                lw.regions['kr'].activeGateIds.push('node-kr-seoul')
              }
            }
            if (!lw.riftNodes['node-kr-incheon']) {
              lw.riftNodes['node-kr-incheon'] = {
                id: 'node-kr-incheon',
                regionId: 'kr',
                name: '인천 송도 참호',
                x: 82,
                y: 43,
                status: 'active',
                gateDefId: 'gate-rift-backstreet',
                difficultyRank: 'D',
                adjacentNodeIds: ['node-kr-seoul'],
                difficulty: 950,
                deadline: 14,
                daysRemaining: 14,
                isSGrade: false
              }
              if (lw.regions['kr'] && !lw.regions['kr'].activeGateIds.includes('node-kr-incheon')) {
                lw.regions['kr'].activeGateIds.push('node-kr-incheon')
              }
            }
          }
        }

        // ── Expedition redesign Phase 1 (v29) 마이그레이션 ──
        if (persistedState) {
          if (!('expeditionTickets' in persistedState)) {
            persistedState.expeditionTickets = 0
          }
          if (Array.isArray(persistedState.ownedShadows)) {
            persistedState.ownedShadows = persistedState.ownedShadows.map((shadow: any) => ({
              ...shadow,
              expeditionLevel: shadow.expeditionLevel ?? 1,
              expeditionMastery: shadow.expeditionMastery ?? 0,
            }))
          }
        }

        // ── Expedition redesign Phase 2 (v30) 마이그레이션 ──
        if (persistedState) {
          if (!persistedState.completedSpecialExpeditionIds) {
            persistedState.completedSpecialExpeditionIds = []
          }
        }

        // ── Rune System (v31) 마이그레이션 ──
        if (persistedState) {
          if (!persistedState.runes) {
            persistedState.runes = []
          }
        }

        return persistedState;

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

registerLegionNodeLevelResolver((nodeId) => {
  return useGame.getState().shadowLegionNodes?.[nodeId] ?? 0
})

