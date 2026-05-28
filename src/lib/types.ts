export type StatKey = 'STR' | 'VIT' | 'AGI' | 'INT' | 'PER' | 'SEN'

export const STAT_META: Record<StatKey, { label: string; color: string; icon: string }> = {
  STR: { label: '근력', color: 'text-red-300', icon: '💪' },
  VIT: { label: '체력', color: 'text-emerald-300', icon: '🛡️' },
  AGI: { label: '민첩', color: 'text-yellow-300', icon: '⚡' },
  INT: { label: '지능', color: 'text-cyan-300', icon: '📘' },
  PER: { label: '인내', color: 'text-purple-300', icon: '🔥' },
  SEN: { label: '감각', color: 'text-pink-300', icon: '👁️' },
}

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National'

export type Category =
  | 'workout'
  | 'study'
  | 'career'
  | 'health'
  | 'mind'
  | 'finance'
  | 'social'
  | 'challenge'
  | 'habit'

export const CATEGORY_META: Record<Category, { label: string; icon: string; color: string }> = {
  workout:   { label: '운동',   icon: '🏋️', color: 'from-red-500/20 to-orange-500/10' },
  study:     { label: '학습',   icon: '📚', color: 'from-cyan-500/20 to-blue-500/10' },
  career:    { label: '커리어', icon: '💻', color: 'from-violet-500/20 to-indigo-500/10' },
  health:    { label: '건강',   icon: '🥗', color: 'from-emerald-500/20 to-teal-500/10' },
  mind:      { label: '정신',   icon: '🧘', color: 'from-purple-500/20 to-fuchsia-500/10' },
  finance:   { label: '재정',   icon: '💰', color: 'from-yellow-500/20 to-amber-500/10' },
  social:    { label: '관계',   icon: '🤝', color: 'from-pink-500/20 to-rose-500/10' },
  challenge: { label: '도전',   icon: '⚔️', color: 'from-sky-500/20 to-cyan-500/10' },
  habit:     { label: '습관',   icon: '🧹', color: 'from-slate-400/20 to-zinc-500/10' },
}

export type Difficulty = 'easy' | 'normal' | 'hard' | 'elite' | 'apex' | 'boss'

export const DIFFICULTY_META: Record<Difficulty, { label: string; xp: number; color: string }> = {
  easy:   { label: 'E급', xp: 15,  color: 'text-zinc-300' },
  normal: { label: 'D급', xp: 30,  color: 'text-emerald-300' },
  hard:   { label: 'C급', xp: 60,  color: 'text-cyan-300' },
  elite:  { label: 'B급', xp: 120, color: 'text-purple-300' },
  apex:   { label: 'A급', xp: 180, color: 'text-pink-300' },
  boss:   { label: 'S급', xp: 250, color: 'text-amber-300' },
}

// ── Job System ─────────────────────────────────────────────────────────

export type JobId =
  | 'unawakened'
  | 'golden-eye-diviner'
  | 'grimoire-decoder'
  | 'iron-squire'
  | 'silent-monk'
  | 'nameless-awakened'
  | 'golden-oracle'
  | 'abyss-archivist'
  | 'steelheart-fighter'
  | 'chrono-judge'
  | 'fate-harmonizer'
  // v2 Jobs
  | 'novice-hunter'
  | 'swordsman'
  | 'warrior'
  | 'mage'
  | 'guardian'
  | 'scout'
  | 'tactician'
  | 'swordsmaster'
  | 'spellsword'
  | 'berserker'
  | 'paladin'
  | 'chronomancer'
  | 'battle-alchemist'
  | 'abyss-stalker'
  | 'grand-strategist'
  | 'sword-saint'
  | 'rune-spellsword'
  | 'dragon-knight'
  | 'divine-guardian'
  | 'time-governor'
  | 'sage-alchemist'
  | 'abyss-emperor'
  | 'grand-master-strategist'
  | 'shadow-lord'
  | 'puppet-master'
  | 'soul-reaper'
  | 'dimension-hunter'
  // v2 3rd normal jobs
  | 'illusory-swordmaster'
  | 'speed-striker'
  | 'abyss-spellsword'
  | 'elemental-spellsword'
  | 'immortal-berserker'
  | 'hellfire-slayer'
  | 'holy-redeemer'
  | 'judgment-knight'
  | 'infinity-mage'
  | 'entropy-manipulator'
  | 'elixir-creator'
  | 'chimera-summoner'
  | 'shadow-assassin'
  | 'phantom-stalker'
  | 'war-orchestrator'
  | 'fate-weaver'
  // v2 hidden classes
  | 'shadow-disciple'
  | 'shadow-commander'
  | 'abyss-summoner'
  | 'phantom-general'
  | 'curse-initiate'
  | 'doom-herald'
  | 'fate-breaker'
  | 'rift-sensing-hunter'
  | 'dimension-traveler'
  | 'void-navigator'
  | 'chrono-saber'

export type JobLine =
  | 'market'
  | 'research'
  | 'training'
  | 'discipline'
  | 'balance'

export interface JobDefinition {
  id: JobId
  name: string
  line: JobLine
  tier: 0 | 1 | 2
  description: string
  unlockText: string
  nextJobId?: string
  effects: {
    xpBonusByCategory?: Partial<Record<Category, number>>
    statBonus?: Partial<Record<StatKey, number>>
    dropBonus?: number
  }
}

// ── Job System v2 Types ──────────────────────────────────────────────

export type JobTier = 'novice' | 'first' | 'second' | 'third' | 'hidden' | 'unique'
export type JobRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'hidden' | 'unique'
export type JobArchetype = 'warrior' | 'mage' | 'rogue' | 'cleric' | 'tactician' | 'special'
export type JobBranch = 'sword' | 'shield' | 'magic' | 'shadow' | 'chrono' | 'alchemy' | 'curse' | 'none'

export interface JobSkillUnlock {
  skillId: string
  unlockLevel: number
  source: 'job'
}

export interface JobPassiveUnlock {
  passiveId: string
  unlockLevel: number
}

export interface JobGrowthAffinity {
  questCategoryBonus?: Partial<Record<Category, number>>
  activityTags?: string[]
}

export interface JobUnlockCondition {
  hunterLevel?: number
  previousJobLevel?: number
  towerFloorCleared?: number
  gateClearCount?: number
  bossClearCount?: number
  skillUseCount?: Record<string, number>
  mainStageCompletedCount?: number
  shadowCount?: number
  hiddenSignalKeys?: string[]
  resonanceRequired?: Partial<Record<'shadow' | 'curse' | 'rift', number>>
}

export interface HiddenJobPathProgress {
  pathId: 'shadow' | 'curse' | 'rift'
  resonance: number
  signals: Record<string, number>
  discoveredAt?: string
  candidateUnlockedAt?: string
}

export interface JobHiddenProfile {
  isHidden: boolean
  maskedName?: string
  revealName?: string
  hintLevel?: 'none' | 'vague' | 'partial' | 'clear'
  hintText?: string
}

export interface JobDefinitionV2 {
  id: JobId
  name: string
  tier: JobTier
  rarity: JobRarity
  description: string
  combatStyle: string
  archetype: JobArchetype
  branch: JobBranch
  previousJobIds?: JobId[]
  nextJobIds?: JobId[]
  primaryStats: StatKey[]
  secondaryStats?: StatKey[]
  statModifiers?: Partial<Record<StatKey, number>>
  battleModifiers?: {
    maxHpPct?: number
    atkPct?: number
    defPct?: number
    spdPct?: number
    skillPowerPct?: number
    critPct?: number
    supportPct?: number
    controlPct?: number
    survivalPct?: number
  }
  skills?: JobSkillUnlock[]
  passives?: JobPassiveUnlock[]
  growthAffinity?: JobGrowthAffinity
  unlockCondition?: JobUnlockCondition
  hiddenProfile?: JobHiddenProfile
}

export interface OwnedJobState {
  jobId: JobId
  level: number
  xp: number
  unlockedAt?: string
  advancedAt?: string
  masteredAt?: string
  isNew?: boolean
}

export const JOB_DEFINITIONS: JobDefinition[] = [
  {
    id: 'unawakened',
    name: '미각성자',
    line: 'balance',
    tier: 0,
    description: '아직 자신의 길을 정하지 않은 헌터.',
    unlockText: '기본 직업',
    effects: {},
  },
  {
    id: 'golden-eye-diviner',
    name: '금안의 점술사',
    line: 'market',
    tier: 1,
    description: '시장의 흐름과 자본의 흔적을 읽는 자.',
    unlockText: '시장 점검 30회 또는 금융/커리어 계열 성장 조건 달성',
    nextJobId: 'golden-oracle',
    effects: {
      xpBonusByCategory: {
        finance: 0.05,
        career: 0.05,
      },
    },
  },
  {
    id: 'grimoire-decoder',
    name: '금서 해독자',
    line: 'research',
    tier: 1,
    description: '흩어진 자료와 산업의 문맥을 해독하는 기록자.',
    unlockText: '학습/커리어 퀘스트 누적 조건 달성',
    nextJobId: 'abyss-archivist',
    effects: {
      xpBonusByCategory: {
        study: 0.05,
        career: 0.03,
      },
    },
  },
  {
    id: 'iron-squire',
    name: '강철의 견습기사',
    line: 'training',
    tier: 1,
    description: '육체를 단련해 한계를 밀어붙이는 수련자.',
    unlockText: '운동/건강 퀘스트 누적 조건 달성',
    nextJobId: 'steelheart-fighter',
    effects: {
      xpBonusByCategory: {
        workout: 0.05,
        health: 0.05,
      },
    },
  },
  {
    id: 'silent-monk',
    name: '침묵의 수도자',
    line: 'discipline',
    tier: 1,
    description: '욕망을 누르고 시간을 다스리는 수행자.',
    unlockText: '습관/정신/절제 계열 조건 달성',
    nextJobId: 'chrono-judge',
    effects: {
      xpBonusByCategory: {
        habit: 0.05,
        mind: 0.05,
      },
    },
  },
  {
    id: 'nameless-awakened',
    name: '무명의 각성자',
    line: 'balance',
    tier: 1,
    description: '한쪽에 치우치지 않고 균형 있게 성장한 각성자.',
    unlockText: '여러 카테고리를 균형 있게 성장',
    nextJobId: 'fate-harmonizer',
    effects: {
      xpBonusByCategory: {
        career: 0.02,
        study: 0.02,
        workout: 0.02,
        health: 0.02,
        habit: 0.02,
        mind: 0.02,
      },
    },
  },
  // ── 2nd Tier Jobs ──────────────────────────────────────────────────
  {
    id: 'golden-oracle',
    name: '황금안의 예언자',
    line: 'market',
    tier: 2,
    description: '자본의 흐름 너머에 숨은 징조를 읽어내는 예언자.',
    unlockText: '금안의 점술사 보유 + 시장 점검 100회 또는 finance/career 퀘스트 누적 150회',
    effects: {
      xpBonusByCategory: {
        finance: 0.08,
        career: 0.08,
      },
    },
  },
  {
    id: 'abyss-archivist',
    name: '심연의 기록관',
    line: 'research',
    tier: 2,
    description: '흩어진 지식과 기록의 심연에서 진실을 끌어올리는 자.',
    unlockText: '금서 해독자 보유 + study/career 퀘스트 누적 180회',
    effects: {
      xpBonusByCategory: {
        study: 0.08,
        career: 0.06,
      },
    },
  },
  {
    id: 'steelheart-fighter',
    name: '강철심장의 투사',
    line: 'training',
    tier: 2,
    description: '흔들리지 않는 심장으로 한계를 부수는 전투형 헌터.',
    unlockText: '강철의 견습기사 보유 + workout/health 퀘스트 누적 180회 또는 던전 클리어 20회',
    effects: {
      xpBonusByCategory: {
        workout: 0.08,
        health: 0.08,
      },
    },
  },
  {
    id: 'chrono-judge',
    name: '시간의 심판관',
    line: 'discipline',
    tier: 2,
    description: '흐트러진 욕망과 시간을 심판하는 규율의 집행자.',
    unlockText: '침묵의 수도자 보유 + habit/mind 퀘스트 누적 180회 또는 숏폼 제한/명상 루틴 90회',
    effects: {
      xpBonusByCategory: {
        habit: 0.08,
        mind: 0.08,
      },
    },
  },
  {
    id: 'fate-harmonizer',
    name: '운명의 조율자',
    line: 'balance',
    tier: 2,
    description: '모든 성장의 흐름을 조율해 자신의 운명을 다시 쓰는 각성자.',
    unlockText: '무명의 각성자 보유 + 5개 이상 카테고리에서 각각 50회 이상 완료',
    effects: {
      xpBonusByCategory: {
        career: 0.04,
        study: 0.04,
        workout: 0.04,
        health: 0.04,
        habit: 0.04,
        mind: 0.04,
      },
    },
  },
]

export const JOB_LINE_META: Record<JobLine, { label: string; icon: string }> = {
  market: { label: '시장', icon: '💰' },
  research: { label: '연구', icon: '📚' },
  training: { label: '수련', icon: '⚔️' },
  discipline: { label: '절제', icon: '🧘' },
  balance: { label: '균형', icon: '⚖️' },
}

// ───────────────────────────────────────────────────────────────────────

export interface MainQuestMilestoneReward {
  hunterXp?: number
  gold?: number
  statRewards?: Partial<Record<StatKey, number>>
  boxType?: string
  ticketType?: string
}

export interface MainQuestMilestone {
  id: string
  title: string
  description?: string
  status: 'locked' | 'active' | 'completed' | 'skipped'
  order: number
  importance?: 'minor' | 'normal' | 'major'
  reward?: MainQuestMilestoneReward
  completedAt?: string
  evidenceNote?: string
}

export interface Quest {
  id: string
  title: string
  description?: string
  category: Category
  difficulty: Difficulty
  statRewards: Partial<Record<StatKey, number>>
  /** Optional stat distribution weights. If present, total stat reward is split by these weights. */
  rewardStatWeights?: Partial<Record<StatKey, number>>
  type: 'daily' | 'main' | 'dungeon'
  /** for daily: ISO date when last completed; reset at midnight */
  lastCompletedAt?: string
  /** for main/dungeon */
  completed?: boolean
  /** for repeating daily routines vs one-time quests user adds */
  recurring?: boolean
  createdAt: string
  /** dungeon: number of times you must complete to clear (e.g. 30-day) */
  totalSteps?: number
  currentSteps?: number
  /** dungeon: step-by-step milestone descriptions. If present, UI shows current/next goal. */
  milestones?: string[] | MainQuestMilestone[]
  /** daily only: days that must pass after completion before this can be done again.
   *  undefined or 0 = standard daily (midnight reset). 1 = every other day. 4 = every 5 days. */
  cooldownDays?: number
  /** main/dungeon: auto-reset on a cycle. 'monthly' resets on the 1st of each month. */
  resetCycle?: 'monthly'
  /** ISO timestamp of the most recent auto-reset (or initial stamp). */
  lastResetAt?: string
  /** optional AI Coach metadata */
  coachReason?: string
  aiPriority?: 'core' | 'support' | 'recovery' | 'maintenance' | 'optional'
  coachPriority?: 'core' | 'support' | 'recovery' | 'maintenance' | 'optional'
  aiEstimatedMinutes?: number
  estimatedMinutes?: number
  coachGenerated?: boolean
  coachPlanId?: string
  coachPlanDate?: string

  // Main Quest v2용 속성 추가
  finalGoal?: string
  progressPercent?: number
  status?: 'active' | 'completed' | 'paused' | 'archived'
  source?: 'user' | 'aiCoach'
  completedAt?: string
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type EquipmentStars = 1 | 2 | 3 | 4 | 5

export const RARITY_META: Record<ItemRarity, { label: string; color: string; ring: string }> = {
  common:    { label: '일반',    color: 'text-zinc-200',   ring: 'ring-zinc-500/40' },
  uncommon:  { label: '고급',    color: 'text-emerald-300', ring: 'ring-emerald-400/50' },
  rare:      { label: '희귀',    color: 'text-cyan-300',    ring: 'ring-cyan-400/60' },
  epic:      { label: '영웅',    color: 'text-purple-300',  ring: 'ring-purple-400/70 shadow-glow-purple' },
  legendary: { label: '전설',    color: 'text-amber-300',   ring: 'ring-amber-400/80 shadow-glow-lg' },
}

// Shadow Soldier System (12-11)
export type ShadowRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type ShadowInnateGrade = 'C' | 'B' | 'A' | 'S'
export type ShadowStatKey =
  | 'shadowAttack'
  | 'shadowDefense'
  | 'shadowDurability'
  | 'shadowSpeed'
  | 'shadowCrit'
  | 'shadowFinisher'
  | 'shadowControl'
  | 'shadowSuppression'
  | 'shadowSupport'
  | 'shadowSurvival'
  | 'shadowBossing'
  | 'shadowExpedition'
  | 'shadowSynergy'

export type ShadowSummonTicketType =
  | 'normal_shadow'
  | 'rare_shadow'
  | 'role_shadow'
  | 'gate_named_shadow'
  | 'achievement_named_shadow'
  | 'category_achievement_named'

export type ShadowSummonTicketSource =
  | 'achievement'
  | 'reward_box'
  | 'challenge_card'
  | 'tower'
  | 'gate'
  | 'system'

export type ShadowSummonShardType =
  | 'normal'
  | 'rare'
  | 'named'
  | 'achievement_named'

export type AchievementTicketGrade =
  | 'standard'
  | 'rare'
  | 'elite'
  | 's_rank'

export type ShadowRank =
  | 'lesser'
  | 'soldier'
  | 'elite'
  | 'knight'
  | 'marshal'
  | 'monarch'
  | 'named'

export type ShadowRole =
  | 'assault'
  | 'guard'
  | 'scout'
  | 'analyst'
  | 'support'
  | 'hunter'

export type ShadowVisualTheme =
  | 'scout'
  | 'soldier'
  | 'guard'
  | 'beast'
  | 'analyst'
  | 'support'
  | 'hunter'
  | 'named'
  | 'evolved'

export type ShadowSourceType =
  | 'gate_extract'
  | 'gate_named'
  | 'achievement_named'

export type ShadowEffectType =
  | 'bonus_damage'
  | 'damage_reduction'
  | 'first_turn_accuracy'
  | 'first_turn_evasion'
  | 'extra_attack_chance'
  | 'enemy_defense_down'
  | 'enemy_evasion_down'
  | 'drop_bonus'
  | 'extraction_bonus'
  | 'extraction_quality_bonus'
  | 'category_xp_bonus'
  | 'stat_bonus'
  | 'skill_damage_bonus'
  | 'cooldown_support'
  | 'guard_counter'
  | 'wave_start_bonus'
  | 'low_hp_defense'
  | 'execute_damage'

export interface ShadowEffect {
  type: ShadowEffectType
  value: number
  category?: Category
  stat?: StatKey
}

export interface ShadowTrait {
  id: string
  name: string
  description: string
  effectType: ShadowEffectType
  value: number
  allowedRoles?: ShadowRole[]
  allowedRarities?: ShadowRarity[]
}

export interface ShadowDefinition {
  id: string
  name: string
  description: string
  rarity: ShadowRarity
  birthRarity?: ShadowRarity
  sourceCategory?: Category
  rank: ShadowRank
  role: ShadowRole
  sourceType: ShadowSourceType
  sourceGateRank?: GateRank
  sourceGateId?: string
  sourceQuestId?: string
  unlockConditionText?: string
  basePower: number
  effects: ShadowEffect[]
  shadowStats?: Partial<Record<ShadowStatKey, number>>
  shadowSkillIds?: string[]
  shadowPassiveIds?: string[]
  shadowUniqueSkillIds?: string[]
  shadowUniquePassiveIds?: string[]
  shadowUniqueActionCue?: string
  possibleTraits?: string[]
  quote?: string
  hiddenUntilObtained?: boolean
  isGateNamed?: boolean
  isAchievementNamed?: boolean
  evolutionTargetDefinitionId?: string
  visualKey?: string
  portraitVariant?: string
  portraitKey?: string
  assetFamily?: string
  visualTheme?: ShadowVisualTheme
  silhouetteType?: string
  accentColor?: string
  weaponShape?: string
  headShape?: string
  shoulderShape?: string
  auraType?: string
  eyeStyle?: string
  runeStyle?: string
  accessory?: string
  posture?: string
  backgroundMotif?: string
  visualIntensity?: number
  secret?: boolean
  variantKey?: string
}

export interface ShadowTraitDefinition {
  id: string
  name: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  roleTags?: ShadowRole[]
  effect: {
    statBonusPct?: Partial<Record<'hp' | 'atk' | 'def' | 'spd' | 'skill', number>>
    xpGainPct?: number
    expeditionPowerPct?: number
    essenceGainPct?: number
    extractionAffinityPct?: number
    synergyTag?: string
  }
}

export interface ShadowLegionNode {
  id: string
  name: string
  description: string
  maxLevel: number
  costBase: number
  costGrowth: number
  effect: {
    shadowHpPct?: number
    shadowAtkPct?: number
    shadowDefPct?: number
    expeditionPowerPct?: number
    shadowXpGainPct?: number
    essenceGainPct?: number
    summonShardBonusPct?: number
  }
  unlockCondition?: {
    totalOwnedShadows?: number
    evolvedShadowCount?: number
    namedShadowCount?: number
    towerFloorCleared?: number
  }
}

export interface OwnedShadow {
  instanceId: string
  definitionId: string
  name: string
  obtainedAt: string
  sourceType: ShadowSourceType
  sourceGateId?: string
  sourceQuestId?: string
  rarity: ShadowRarity
  birthRarity?: ShadowRarity
  innateGrade?: ShadowInnateGrade
  rank: ShadowRank
  role: ShadowRole
  traits: ShadowTrait[]
  level?: number
  xp?: number
  isNamed?: boolean
  isGateNamed?: boolean
  isAchievementNamed?: boolean
  enhancementLevel?: number
  absorbedCount?: number
  isLocked?: boolean
  isFavorite?: boolean
  evolutionStage?: number
  evolvedFromDefinitionId?: string
  secretTraits?: string[]
  variantKey?: string
  awakenedAt?: string
  // 12-35B Advanced Trait & Slot fields
  traitIds?: string[]
  traitRerollCount?: number
  unlockedSkillSlots?: number
  unlockedPassiveSlots?: number
  shadowSkillIds?: string[]
  shadowPassiveIds?: string[]
}

export interface ShadowSummonTicket {
  id: string
  ticketType: ShadowSummonTicketType
  /** Legacy alias from the first 12-23B draft. Kept optional for old runtime saves. */
  kind?: 'standard' | 'achievement_named'
  label: string
  createdAt: string
  source: ShadowSummonTicketSource
  role?: ShadowRole
  category?: Category
  grade?: AchievementTicketGrade
  definitionId?: string
  rarityFloor?: ShadowRarity
  usedAt?: string
}

export interface ShadowFragmentReward {
  definitionId: string
  amount: number
}

export interface ShadowExtractResult {
  gateId: string
  gateInstanceId?: string
  gateName: string
  attemptedAt: string
  success: boolean
  chance: number
  rolledRarity?: ShadowRarity
  shadow?: OwnedShadow
  message: string
  isBossExtraction?: boolean
  rewardFragmentId?: string
  rewardFragmentName?: string
  rewardFragmentCount?: number
  resonanceBonusPercent?: number
}

export type ShadowExpeditionType = 'training' | 'essence' | 'hunt' | 'scout'
export type ShadowExpeditionStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'expired'
export type ShadowExpeditionCommand = 'attack' | 'defend' | 'scout' | 'analyze' | 'search'
export type ShadowExpeditionOutcome = 'great_success' | 'success' | 'partial' | 'failure'

export type ExpeditionPhase = 'muster' | 'deploy' | 'contact' | 'threshold' | 'resolution' | 'return'

export interface ExpeditionPhaseEntry {
  phase: ExpeditionPhase
  enteredAt: number
  message?: string
}

export interface ExpeditionMidEventChoice {
  id: string
  label: string
  description: string
  progressDelta?: number
  riskDelta?: number
  searchStackDelta?: number
  log: string
  preferredRoles?: ShadowRole[]
}

export interface ExpeditionMidEvent {
  id: string
  type: ShadowExpeditionType | 'any'
  phase: 'threshold'
  title: string
  description: string
  choices: ExpeditionMidEventChoice[]
  recentCooldown?: number
}

export interface ExpeditionReport {
  title: string
  overview: string
  highlight: string
  harvest: string
  closing: string
}

export interface ShadowExpeditionLog {
  id: string
  turn: number
  type: 'system' | 'command' | 'shadow' | 'risk' | 'reward' | 'phase' | 'event'
  message: string
  actorShadowId?: string
  command?: ShadowExpeditionCommand
  phase?: ExpeditionPhase
}

export interface ShadowExpeditionResult {
  outcome: ShadowExpeditionOutcome
  progress: number
  risk: number
  shadowXpGained: number
  essenceGained: number
  bonusRewards?: string[]
  report?: ExpeditionReport
  featuredShadowIds?: string[]
}

export interface ShadowExpedition {
  id: string
  date: string
  type: ShadowExpeditionType
  title: string
  description: string
  requiredPower: number
  recommendedRoles: ShadowRole[]
  selectedShadowIds: string[]
  status: ShadowExpeditionStatus
  progress: number
  risk: number
  turn: number
  maxTurns: number
  expiresAt: string
  logs: ShadowExpeditionLog[]
  result?: ShadowExpeditionResult
  searchStacks?: number
  analyzeStacks?: number
  scoutStacks?: number
  currentPhase?: ExpeditionPhase
  phaseHistory?: ExpeditionPhaseEntry[]
  midEvent?: ExpeditionMidEvent
  eventTriggered?: boolean
  eventResolved?: boolean
  secretSignals?: Record<string, number>
}

// ── Equipment System ───────────────────────────────────────────────

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory' | 'artifact'

export type ItemEffectType =
  | 'xp_bonus'
  | 'drop_bonus'
  | 'rarity_bonus'
  | 'stat_bonus'

export interface ItemEffect {
  type: ItemEffectType
  category?: Category
  stat?: StatKey
  value: number
}

export type EquipmentState = Partial<Record<EquipmentSlot, string>>

export const EQUIPMENT_SLOT_LABEL: Record<EquipmentSlot, string> = {
  weapon: '무기',
  armor: '방어구',
  accessory: '장신구',
  artifact: '유물',
}

// ── Consumable System ──────────────────────────────────────────────

export type ConsumableEffectType =
  | 'instant_xp'
  | 'next_quest_xp_bonus'
  | 'next_category_xp_bonus'
  | 'temporary_drop_bonus'
  | 'temporary_rarity_bonus'
  | 'temporary_stat_bonus'
  | 'gate_penalty_reduction'
  | 'gate_success_bonus'

export interface ConsumableEffect {
  type: ConsumableEffectType
  value: number
  category?: Category
  stat?: StatKey
  duration?: 'next_quest' | 'today' | 'next_gate'
}

export interface ActiveConsumableEffect extends ConsumableEffect {
  id: string
  sourceItemId: string
  sourceItemName: string
  activatedAt: string
  consumed: boolean
}

// ── Gate / Combat System ───────────────────────────────────────────

export type GateRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'

export interface GateDefinition {
  id: string
  name: string
  description: string
  rank: GateRank

  /** 안내용. 실제 위험도/밸런싱 기준은 recommendedPower다. */
  recommendedLevel: number
  /** 실제 위험도/밸런싱 기준. */
  recommendedPower: number

  monsterIds: string[]
  rewardTableId: string
  failPenaltyId: string

  expiresInHours: number
}

export interface ActiveGate {
  instanceId: string
  gateId: string
  spawnedAt: string
  expiresAt: string
  status: 'active' | 'cleared' | 'failed' | 'expired'
  source: 'random' | 'dungeon_clear' | 'event'
  runState?: GateRunState
}

export type GateRunEncounterType =
  | 'battle'
  | 'elite'
  | 'boss'
  | 'event'
  | 'rest'
  | 'treasure'
  | 'shadow_trace'

export type GateRunEncounterStatus =
  | 'locked'
  | 'available'
  | 'active'
  | 'cleared'
  | 'skipped'
  | 'failed'

export interface GateRunRewardBundle {
  xp: number
  gold: number
  essence: number
  items: GateReward[]
}

export interface GateRunEventChoice {
  id: string
  label: string
  description: string
  riskDelta?: number
  rewardMultiplierDelta?: number
  immediateReward?: Partial<GateRunRewardBundle>
  nextEncounterModifier?: string
  extractionBonusDelta?: number
  hpCostPercent?: number
  healPercent?: number
  addEncounterType?: GateRunEncounterType
}

export interface GateRunEncounter {
  id: string
  type: GateRunEncounterType
  title: string
  description: string
  monsterIds?: string[]
  difficultyMod?: number
  status: GateRunEncounterStatus
  isBoss?: boolean
  isElite?: boolean
  themeTag?: string
  riskDelta?: number
  rewardMultiplier?: number
  specialRuleId?: string
  eventTemplateId?: string
  eventChoices?: GateRunEventChoice[]
  selectedChoiceId?: string
  restOptionName?: string
  treasureReward?: Partial<GateRunRewardBundle>
  shadowTraceEffect?: string
}

export interface GateRunState {
  gateId: string
  seed: string
  themeId: string
  modifierIds: string[]
  currentEncounterIndex: number
  encounters: GateRunEncounter[]
  accumulatedRewards: GateRunRewardBundle
  accumulatedRisk: number
  rewardMultiplier: number
  extractionBonusPercent?: number
  clearedEncounterIds: string[]
  failed?: boolean
  completed?: boolean
}


export interface MonsterCombatStats {
  maxHp: number
  atk: number
  def: number
  speed: number
  critRate: number
  accuracy: number
  evasionRate: number
}

export interface MonsterDefinition {
  id: string
  name: string
  description: string
  rank: GateRank
  stats: MonsterCombatStats
  skillIds: string[]
}

export type SkillOwnerType = 'job' | 'equipment' | 'monster' | 'common' | 'title' | 'special'
export type SkillSource = 'basic' | 'job' | 'equipment' | 'title' | 'special' | 'monster'
export type SkillType = 'attack' | 'damage' | 'defense' | 'buff' | 'debuff' | 'heal' | 'utility'
export type CombatEffectKind = 'stat' | 'damage_reduction' | 'counter'

export interface SkillEffect {
  kind?: CombatEffectKind
  stat?: 'atk' | 'def' | 'speed' | 'critRate' | 'accuracy' | 'evasionRate'
  value: number
  durationTurns?: number
  target: 'self' | 'enemy'
  counterRate?: number
  counterPower?: number
}

export interface SkillDefinition {
  id: string
  name: string
  description: string

  ownerType: SkillOwnerType
  source?: SkillSource
  type: SkillType

  /** 스킬 cooldown은 턴 기반이다. */
  cooldown?: number
  power?: number
  cooldownTurns?: number
  staminaCost?: number
  requiredJobId?: string
  requiredLevel?: number
  providedByItemId?: string
  providedByTitleId?: string
  tags?: string[]
  effectSummary?: string
  recommendedUse?: string
  targetType?: string

  /** 초기 전투는 player vs monster 중심. 다수 몬스터/광역 스킬이 필요하면 target을 확장한다. */
  effect?: SkillEffect
  effects?: SkillEffect[]
}

export interface SkillRuntimeState {
  skillId: string
  masteryXp?: number
  masteryLevel?: number
  timesUsed?: number
  lastUsedAt?: string
  selectedUpgradeId?: string // Lv.5 진화/강화 선택지 ID
  isCapstoneUnlocked?: boolean // Lv.10 시그니처 각성 여부
}

export interface ActiveCombatEffect {
  sourceSkillId: string
  kind?: CombatEffectKind
  stat?: 'atk' | 'def' | 'speed' | 'critRate' | 'accuracy' | 'evasionRate'
  value: number
  remainingTurns: number
  targetId: string
  counterRate?: number
  counterPower?: number
}

export interface CombatantState {
  name: string
  maxHp: number
  hp: number
  atk: number
  def: number
  spd: number
  critRate?: number
  accuracy?: number
  evasion?: number
}

export type ManualBattleResult = 'victory' | 'defeat' | 'draw'

export interface ManualBattleSession {
  gateId: string
  gateName: string
  gateInstanceId: string
  waveIndex: number
  turn: number
  maxTurns: number
  player: CombatantState
  monster: CombatantState
  remainingMonsterIds: string[]
  cooldowns: Record<string, number>
  monsterCooldowns: Record<string, number>
  activeEffects: ActiveCombatEffect[]
  consumableEffects: ActiveConsumableEffect[]
  usedConsumableItemIds: string[]
  usedConsumableEffectTypes: ConsumableEffectType[]
  consumableUseCount: number
  logs: CombatLog['turns']
  result?: ManualBattleResult
  startedAt: string
  source?: 'gate' | 'tower'
  towerFloor?: number
}

export type ManualBattleAction =
  | { type: 'basic_attack' }
  | { type: 'defend' }
  | { type: 'skill'; skillId: string }
  | { type: 'auto_finish' }
  | { type: 'use_consumable'; itemId: string }

export interface PlayerCombatStats {
  maxHp: number
  atk: number
  def: number
  speed: number
  critRate: number
  evasionRate: number
  accuracy: number
  skillTotalPower: number
}

export interface BattleTurn {
  turnNumber: number
  waveNumber?: number
  waveLabel?: string

  actorType: 'player' | 'monster'
  actorId: string
  actorName: string

  targetType: 'player' | 'monster'
  targetId: string
  targetName: string

  skillId?: string
  skillName?: string

  outcome: 'hit' | 'miss' | 'evade' | 'critical' | 'buff' | 'debuff' | 'heal'
  damage?: number
  remainingHp?: number

  message: string
}

export interface CombatLog {
  battleId: string
  gateInstanceId: string
  result: 'victory' | 'defeat' | 'draw'
  turns: BattleTurn[]
  totalTurns: number
  playerHpRemaining: number
  rewards: GateReward[]
  penaltyApplied?: GatePenalty
  totalWaves?: number
  clearedWaves?: number
  source?: 'gate' | 'tower'
}

export interface GateStatus {
  stamina: number
  maxStamina: number // 초기 100 고정
  injuredUntil?: string
  recoveryQuestProgress?: number
  recoveryQuestRequired?: number
  lastStaminaRecoveredAt?: string
  lastDailyGateRollDate?: string
}

export interface GateReward {
  type: 'xp' | 'item' | 'gold'
  amount?: number
  itemId?: string
  itemName?: string
  rarity?: ItemRarity
}

export interface GateRewardTable {
  id: string
  name: string
  xp: number
  itemDropChance: number
  rarityBias?: Partial<Record<ItemRarity, number>>
}

export interface GatePenalty {
  id: string
  name: string
  staminaCost: number
  injuryHours?: number
}

// Active gate 정책:
// - 동시 활성 게이트는 1개.
// - active gate가 있을 때 발생한 새 출현 트리거는 무시한다.
// - draw는 보상/패널티 없이 active gate 상태를 유지한다.
// - GateStatus 회복 로직은 11-2 이후가 아니라 별도 단계에서 구현한다.
// - 같은 대상에게 같은 stat의 buff/debuff가 다시 적용되면 누적하지 않고 새 효과로 덮어쓰며 remainingTurns를 refresh한다.
// - PlayerCombatStats는 저장값이 아니라 base hunter stats + equipment stat_bonus + job modifiers + consumable temporary_stat_bonus + skill modifiers로 계산하는 유도값이다.
// - 칭호/영구 업적은 base stat만 사용한다.
// - maxStamina = 100, gateEntryCost = 20, stamina 자연 회복은 시간당 +10, daily/main/random 완료 시 +5가 기본 정책이다.
// - lastDailyGateRollDate는 하루 첫 접속 게이트 출현 roll을 local dateKey 기준 하루 1회로 제한한다.

// ───────────────────────────────────────────────────────────────────

export interface Item {
  id: string
  name: string
  icon: string
  rarity: ItemRarity
  equipmentStars?: EquipmentStars
  description: string
  acquiredAt: string
  
  equippable?: boolean
  slot?: EquipmentSlot
  effects?: ItemEffect[]
  /** 강화 레벨. 없으면 +0으로 취급한다. 보유한 개별 item instance에만 적용된다. */
  enhancementLevel?: number
  /** 장착 중일 때 플레이어가 사용할 수 있는 전투 스킬 ID 목록. 주로 epic/legendary 장비에 부여한다. */
  combatSkillIds?: string[]
  
  consumable?: boolean
  consumableEffects?: ConsumableEffect[]
}

export type TitleCategory =
  | 'progress'
  | 'stat'
  | 'collection'
  | 'hidden'
  | 'meta'

export type TitleRarity =
  | 'normal'
  | 'rare'
  | 'epic'
  | 'legendary'

export interface TitleEffects {
  xpBonusByCategory?: Partial<Record<Category, number>>
  globalXpBonus?: number
  gateDropBonus?: number
  rarityBonus?: number
  statBonus?: Partial<Record<StatKey, number>>
  gatePenaltyReduction?: number
  injuryRecoveryBonus?: number
}

export interface TitleDefinition {
  id: string
  name: string
  description: string
  category: TitleCategory
  rarity: TitleRarity
  hidden: boolean
  conditionText?: string
  effects?: TitleEffects
}

export const TITLE_DEFINITIONS: TitleDefinition[] = [
  {
    id: 'first-awakening',
    name: '첫 번째 각성',
    description: '시스템의 부름에 응답해 헌터의 길에 들어섰다.',
    category: 'progress',
    rarity: 'normal',
    hidden: false,
    conditionText: '레벨 5 도달',
    effects: { globalXpBonus: 0.01 },
  },
  {
    id: 'hunter',
    name: '하급 헌터',
    description: '수많은 의뢰를 넘어 정식 헌터의 자격을 증명했다.',
    category: 'progress',
    rarity: 'rare',
    hidden: false,
    conditionText: '레벨 25 도달',
    effects: { globalXpBonus: 0.02 },
  },
  {
    id: 'veteran-hunter',
    name: '숙련된 사냥꾼',
    description: '반복된 전투와 훈련 끝에 노련한 헌터로 성장했다.',
    category: 'progress',
    rarity: 'epic',
    hidden: false,
    conditionText: '레벨 50 도달',
    effects: { globalXpBonus: 0.03 },
  },
  {
    id: 'shadow-hunter',
    name: '그림자 추적자',
    description: '첫 던전의 어둠을 통과하고 그림자의 흔적을 쫓기 시작했다.',
    category: 'progress',
    rarity: 'rare',
    hidden: false,
    conditionText: '첫 dungeon 클리어',
    effects: { gateDropBonus: 0.03 },
  },
  {
    id: 'trained-one',
    name: '철혈의 입문자',
    description: '육체의 한계를 넘기 위한 첫 문턱을 넘어섰다.',
    category: 'stat',
    rarity: 'normal',
    hidden: false,
    conditionText: 'STR 30',
    effects: { xpBonusByCategory: { workout: 0.01 } },
  },
  {
    id: 'iron-hunter',
    name: '무쇠 완력의 헌터',
    description: '단련된 힘으로 일상의 벽을 정면으로 부순다.',
    category: 'stat',
    rarity: 'rare',
    hidden: false,
    conditionText: 'STR 50',
    effects: { xpBonusByCategory: { workout: 0.02, challenge: 0.01 } },
  },
  {
    id: 'steel-hunter',
    name: '강철 육체의 계승자',
    description: '강철처럼 단단한 육체로 흔들리지 않는 기반을 세웠다.',
    category: 'stat',
    rarity: 'epic',
    hidden: false,
    conditionText: 'STR 80',
    effects: { xpBonusByCategory: { workout: 0.03, health: 0.02 } },
  },
  {
    id: 'sage-apprentice',
    name: '현자의 견습생',
    description: '지식의 문 앞에서 첫 번째 주문을 해독했다.',
    category: 'stat',
    rarity: 'normal',
    hidden: false,
    conditionText: 'INT 30',
    effects: { xpBonusByCategory: { study: 0.01 } },
  },
  {
    id: 'market-eye',
    name: '흐름을 읽는 눈',
    description: '숫자와 기록 사이에 숨어 있는 흐름을 감지하기 시작했다.',
    category: 'stat',
    rarity: 'rare',
    hidden: false,
    conditionText: 'INT 50',
    effects: { xpBonusByCategory: { finance: 0.02, career: 0.01 } },
  },
  {
    id: 'analyst',
    name: '심연의 해석자',
    description: '흩어진 정보의 심연에서 의미를 끌어올리는 자가 되었다.',
    category: 'stat',
    rarity: 'epic',
    hidden: false,
    conditionText: 'INT 80',
    effects: { xpBonusByCategory: { study: 0.03, career: 0.02 } },
  },
  {
    id: 'unyielding-will',
    name: '꺾이지 않는 의지',
    description: '흔들림 속에서도 자신의 루틴을 지켜낸 의지의 증거.',
    category: 'stat',
    rarity: 'rare',
    hidden: false,
    conditionText: 'PER 50',
    effects: { xpBonusByCategory: { habit: 0.02, challenge: 0.01 } },
  },
  {
    id: 'steel-mental',
    name: '강철 정신의 수도자',
    description: '유혹과 나태를 견디며 정신을 강철처럼 벼려냈다.',
    category: 'stat',
    rarity: 'epic',
    hidden: false,
    conditionText: 'PER 80',
    effects: { xpBonusByCategory: { habit: 0.03, mind: 0.02 } },
  },
  {
    id: 'awakened-one',
    name: '감각을 깨운 자',
    description: '보이지 않던 신호와 기회를 감지하기 시작했다.',
    category: 'stat',
    rarity: 'rare',
    hidden: false,
    conditionText: 'SEN 50',
    effects: { rarityBonus: 0.01 },
  },
  {
    id: 'ruler-of-instinct',
    name: '직감의 지배자',
    description: '날카로운 감각으로 전리품과 기회의 흐름을 붙잡는다.',
    category: 'stat',
    rarity: 'epic',
    hidden: false,
    conditionText: 'SEN 80',
    effects: { rarityBonus: 0.03 },
  },
  {
    id: 'first-treasure',
    name: '첫 전리품의 주인',
    description: '첫 고급 전리품을 손에 넣고 헌터로서의 감각을 깨웠다.',
    category: 'collection',
    rarity: 'rare',
    hidden: false,
    conditionText: '첫 epic 이상 아이템 획득',
    effects: { rarityBonus: 0.01 },
  },
  {
    id: 'collector',
    name: '전리품 수집가',
    description: '수많은 전리품을 모아 자신만의 무기고를 채워가고 있다.',
    category: 'collection',
    rarity: 'rare',
    hidden: false,
    conditionText: '인벤토리 50개 누적',
    effects: { gateDropBonus: 0.02 },
  },
  {
    id: 'legend-in-hand',
    name: '전설을 쥔 자',
    description: '전설의 격을 지닌 전리품을 손에 넣었다.',
    category: 'collection',
    rarity: 'legendary',
    hidden: false,
    conditionText: 'legendary 아이템 첫 획득',
    effects: { rarityBonus: 0.03 },
  },
  // ── Hidden Titles ──────────────────────────────────────────────────
  {
    id: 'dawn-hunter',
    name: '🌅 새벽의 사냥꾼',
    description: '어둠이 물러가기 전 일어나 하루를 먼저 시작하는 자.',
    category: 'hidden',
    rarity: 'rare',
    hidden: true,
    conditionText: '7시 전 기상 daily 30일 연속',
    effects: { xpBonusByCategory: { health: 0.02, habit: 0.02 } },
  },
  {
    id: 'ruler-of-dawn',
    name: '🌅 여명의 지배자',
    description: '백 번의 새벽을 맞이하며 시간의 흐름을 지배하기 시작했다.',
    category: 'hidden',
    rarity: 'epic',
    hidden: true,
    conditionText: '7시 전 기상 daily 100회 누적',
    effects: { xpBonusByCategory: { health: 0.03, habit: 0.03 } },
  },
  {
    id: 'incarnation-of-restraint',
    name: '🧘 절제의 화신',
    description: '도파민의 유혹을 30일간 견뎌내며 절제를 체화했다.',
    category: 'hidden',
    rarity: 'rare',
    hidden: true,
    conditionText: '숏폼 30분 이내 daily 30일 연속',
    effects: { xpBonusByCategory: { habit: 0.02, mind: 0.01 } },
  },
  {
    id: 'dopamine-hunter',
    name: '🧘 도파민 사냥꾼',
    description: '흩어진 집중력을 되찾아 도파민의 흐름을 역으로 사냥한다.',
    category: 'hidden',
    rarity: 'epic',
    hidden: true,
    conditionText: '숏폼 30분 이내 daily 90회 누적',
    effects: { xpBonusByCategory: { habit: 0.03, mind: 0.02 } },
  },
  {
    id: 'quiet-mind',
    name: '🧘 고요한 마음',
    description: '30일간 고요 속에 머물며 마음의 소음을 잠재웠다.',
    category: 'hidden',
    rarity: 'rare',
    hidden: true,
    conditionText: '명상 daily 30일 연속',
    effects: { xpBonusByCategory: { mind: 0.02, habit: 0.02 } },
  },
  {
    id: 'market-observer',
    name: '📈 시장의 관찰자',
    description: '시장의 마감 종소리를 60번 기록하며 흐름을 읽는 눈을 길렀다.',
    category: 'hidden',
    rarity: 'rare',
    hidden: true,
    conditionText: '시장 마감 점검 daily 60회 누적',
    effects: { xpBonusByCategory: { finance: 0.03, career: 0.03 } },
  },
  {
    id: 'enemy-of-body-fat',
    name: '💪 체지방의 적',
    description: '60번의 기록을 통해 자신의 육체를 정밀하게 추적하기 시작했다.',
    category: 'hidden',
    rarity: 'rare',
    hidden: true,
    conditionText: '체중 기록 daily 60회 누적',
    effects: { xpBonusByCategory: { health: 0.03 } },
  },
  {
    id: 'near-burnout',
    name: '🔥 번아웃 직전',
    description: '하루에 15개 이상의 의뢰를 처리하며 한계에 도전했다.',
    category: 'hidden',
    rarity: 'rare',
    hidden: true,
    conditionText: '하루에 daily 15개 이상 클리어',
    effects: { globalXpBonus: 0.02 },
  },
  {
    id: 'all-nighter',
    name: '🔥 올나이터',
    description: '자정의 어둠 속에서도 의뢰를 완수하는 불굴의 헌터.',
    category: 'hidden',
    rarity: 'rare',
    hidden: true,
    conditionText: '자정~2시 사이 daily 완료 5회',
    effects: { xpBonusByCategory: { challenge: 0.02, habit: 0.01 } },
  },
  {
    id: 'hundred-days-record',
    name: '🎮 백일의 기록',
    description: '백 일의 시간을 시스템과 함께하며 성장의 흔적을 남겼다.',
    category: 'hidden',
    rarity: 'epic',
    hidden: true,
    conditionText: '앱 사용 100일',
    effects: { globalXpBonus: 0.03 },
  },
  {
    id: 'national-level-hunter',
    name: '👑 국가급 사냥꾼',
    description: '국가가 주목하는 최상위 헌터의 반열에 올랐다.',
    category: 'hidden',
    rarity: 'legendary',
    hidden: true,
    conditionText: 'National 랭크 도달',
    effects: { globalXpBonus: 0.05, gateDropBonus: 0.05 },
  },
  {
    id: 'systems-favor',
    name: '👑 시스템의 총애',
    description: '다섯 개의 전설을 손에 쥐며 시스템의 특별한 총애를 받았다.',
    category: 'hidden',
    rarity: 'legendary',
    hidden: true,
    conditionText: 'legendary 아이템 5개 보유',
    effects: { rarityBonus: 0.05, gateDropBonus: 0.03 },
  },
  {
    id: 'sleepless-hunter',
    name: '👑 불면불휴',
    description: '백 일을 쉬지 않고 달려온 불굴의 의지를 증명했다.',
    category: 'hidden',
    rarity: 'legendary',
    hidden: true,
    conditionText: 'daily streak 100일',
    effects: { globalXpBonus: 0.05 },
  },
  // ── Meta Hidden Titles ──────────────────────────────────────────────
  {
    id: 'greeting-the-system',
    name: '🎮 시스템에 인사',
    description: 'LEVEL UP 시스템에 처음 접속하여 헌터의 여정을 시작했다.',
    category: 'hidden',
    rarity: 'normal',
    hidden: true,
    conditionText: '첫 로그인',
    effects: { globalXpBonus: 0.01 },
  },
  {
    id: 'title-collector',
    name: '🎮 컬렉터',
    description: '열 개의 칭호를 모으며 자신의 성장을 기록하고 있다.',
    category: 'hidden',
    rarity: 'rare',
    hidden: true,
    conditionText: '칭호 10개 보유',
    effects: { globalXpBonus: 0.02 },
  },
  {
    id: 'hall-of-hunters',
    name: '🎮 헌터의 전당',
    description: '스물다섯 개의 칭호를 모아 헌터의 전당에 이름을 올렸다.',
    category: 'hidden',
    rarity: 'epic',
    hidden: true,
    conditionText: '칭호 25개 보유',
    effects: { globalXpBonus: 0.03, rarityBonus: 0.01 },
  },
  // ── Additional Hidden Titles (5-5) ─────────────────────────────────
  {
    id: 'portfolio-manager',
    name: '📈 포트폴리오 매니저',
    description: '여섯 번의 운용 일지를 작성하며 자본의 흐름을 기록했다.',
    category: 'hidden',
    rarity: 'rare',
    hidden: true,
    conditionText: 'CMA 운용 일지 6회 작성',
    effects: { xpBonusByCategory: { finance: 0.03, career: 0.01 } },
  },
  {
    id: 'self-reliant-hunter',
    name: '🏠 자립한 헌터',
    description: '생활의 기본을 스스로 관리하며 진정한 자립을 이뤘다.',
    category: 'hidden',
    rarity: 'rare',
    hidden: true,
    conditionText: '빨래 + 청소 + 분리수거 daily 각 10회 누적',
    effects: { xpBonusByCategory: { habit: 0.02, health: 0.01 } },
  },
  {
    id: 'guardian-of-hygiene',
    name: '🏠 위생의 수호자',
    description: '백 번의 관리를 통해 자신의 공간을 지켜낸 수호자.',
    category: 'hidden',
    rarity: 'epic',
    hidden: true,
    conditionText: '자취 daily 카테고리 합산 100회',
    effects: { xpBonusByCategory: { habit: 0.03, health: 0.02 } },
  },
  {
    id: 'perfectionist',
    name: '👑 완벽주의자',
    description: '일주일 동안 단 하나의 빈틈도 허용하지 않은 완벽의 화신.',
    category: 'hidden',
    rarity: 'legendary',
    hidden: true,
    conditionText: '일주일 동안 모든 daily 100% 완료',
    effects: { globalXpBonus: 0.05, rarityBonus: 0.02 },
  },
]

export interface Title {
  id: string
  name: string
  description: string
  unlockedAt: string
  equipped?: boolean
}

export interface SystemMessage {
  id: string
  kind: 'levelup' | 'quest' | 'item' | 'title' | 'rank' | 'info' | 'shadow' | 'story' | 'secret'
  title: string
  lines: string[]
  createdAt: string
}

export interface SecretProgressState {
  meta?: {
    initializedAt?: string
    version?: number
    lastSignalAt?: Record<string, string>
    recentContexts?: string[]
  }
  signals?: Record<string, number>
  unlocked?: string[]
  sealed?: Record<string, string | number | boolean>
  seen?: string[]
  fragmentInk?: Record<string, number>
  initializedAt?: string
  flags?: Record<string, boolean>
  counters?: Record<string, number>
  lastSignals?: Record<string, string>
  discoveredHints?: string[]
  unlockedFragments?: string[]
  hiddenAffinity?: Record<string, number>
  sealedRewards?: Record<string, boolean>
}

export type BoxType = 'daily' | 'weekly' | 'boss'
export type BoxTier = 'normal' | 'enhanced' | 'superior' | 'epic'
export type BoxSource = 'daily_login' | 'weekly_activity' | 'tower_boss' | 'challenge_card' | 'achievement'

export interface BoxReward {
  hunterXp?: number
  gold?: number
  statRewards?: Partial<Record<StatKey, number>>
  shadowEssence?: number
  shadowSummonTickets?: ShadowSummonTicket[]
  shadowSummonShards?: Partial<Record<ShadowSummonShardType, number>>
  shadowFragments?: ShadowFragmentReward[]
  items?: Item[]
  consumables?: Item[]
  message?: string
}

export interface RewardBox {
  id: string
  type: BoxType
  tier: BoxTier
  source: BoxSource
  createdAt: string
  openedAt?: string
  status: 'available' | 'opened'
  label: string
  floor?: number
  reward?: BoxReward
}

export type ChallengeCardDifficulty = 'easy' | 'normal' | 'hard'

export type ChallengeCardCategory =
  | 'workout'
  | 'study'
  | 'finance'
  | 'life'
  | 'sleep'
  | 'gate'
  | 'shadow'
  | 'tower'
  | 'habit'

export type ChallengeCardConditionType =
  | 'completeAnyDaily'
  | 'completeDailyCount'
  | 'completeQuestCategory'
  | 'completeGateAttempt'
  | 'completeGateVictory'
  | 'completeShadowExpedition'
  | 'completeTowerAttempt'
  | 'completeTowerClear'
  | 'openBox'
  | 'completeWorkoutAndStudy'

export interface ChallengeCardCondition {
  type: ChallengeCardConditionType
  target?: number
  category?: Category
}

export interface ChallengeCardReward {
  hunterXp: number
  gold?: number
  shadowEssence: number
  boxUpgradePoints: number
}

export interface ChallengeCard {
  id: string
  date: string
  title: string
  description: string
  difficulty: ChallengeCardDifficulty
  category: ChallengeCardCategory
  condition: ChallengeCardCondition
  reward: ChallengeCardReward
  status: 'candidate' | 'selected' | 'completed' | 'expired'
  selectedAt?: string
  completedAt?: string
}

export interface HunterState {
  name: string
  level: number
  xp: number
  totalXp: number
  rank: Rank
  job: string // legacy display field
  jobId: JobId
  unlockedJobIds: JobId[]
  stats: Record<StatKey, number>
  /** points the user can spend manually on any stat (+1 per level-up) */
  freeStatPoints: number
  streak: number
  lastActiveDate?: string
  /** completions per category since the last level-up. Used to pick auto-distribute target. */
  categoryProgress: Record<Category, number>
  /** ISO date of last streak-protection use. One charge per calendar month at PER >= 10. */
  streakProtectionLastUsed?: string
  /** IDs of unlocked titles */
  ownedTitleIds: string[]
  /** ID of currently equipped title */
  equippedTitleId?: string

  // ── Job System v2 State ───────────────────────────────────────────
  activeJobId?: JobId
  jobs?: Partial<Record<JobId, OwnedJobState>>
  availableAdvancements?: JobId[]
  discoveredHiddenJobIds?: JobId[]
  hiddenSignalKeys?: string[]
  hiddenResonanceProgress?: Record<string, HiddenJobPathProgress>
}

// ── Random Quest System ────────────────────────────────────────────

export interface RandomQuestTemplate {
  id: string
  title: string
  description: string
  category: Category
  difficulty: Difficulty
  xp: number
  weight: number
}

export interface ActiveRandomQuest extends RandomQuestTemplate {
  instanceId: string
  generatedAt: string
  expiresAt: string
  completed: boolean
}

// ───────────────────────────────────────────────────────────────────

export interface AchievementStats {
  questCompletions: {
    total: number
    byQuestId: Record<string, number>
    byCategory: Record<Category, number>
    byType: Record<'daily' | 'main' | 'dungeon', number>
  }
  
  dailyCompletions: {
    total: number
    byQuestId: Record<string, number>
    byCategory: Record<Category, number>
    currentStreakByQuestId: Record<string, number>
    bestStreakByQuestId: Record<string, number>
  }
  
  dungeonClears: {
    total: number
    byQuestId: Record<string, number>
  }
  
  mainClears: {
    total: number
    byQuestId: Record<string, number>
  }
  
  special: {
    // 7시 전 기상 (daily-sleep)
    earlyWakeBefore7Count: number
    earlyWakeBefore7CurrentStreak: number
    earlyWakeBefore7BestStreak: number
    
    // 숏폼 30분 이내 (daily-shortform-limit)
    noShortsWithin30MinCount: number
    noShortsWithin30MinCurrentStreak: number
    noShortsWithin30MinBestStreak: number
    
    // 명상 (daily-meditate)
    meditationCount: number
    meditationCurrentStreak: number
    meditationBestStreak: number
    
    // 시장 마감 점검 (daily-market-close)
    marketCheckCount: number
    
    // 월 소비 제한 (main-spend-monthly)
    spendingLimitMonthlyClearCount: number
    
    // CMA 운용 일지 (dungeon-cma-journal)
    cmaJournalCount: number
    
    // 체중 기록 (daily-weigh)
    weightRecordCount: number
    
    // 심야 완료 (00:00~01:59 daily 완료)
    lateNightCompletionCount: number
    
    // 하루 15개 이상 daily 클리어한 날 수
    daily15PlusClearDays: number
    daily15PlusClearDateKeys: string[]
    
    // 하루 daily 0개 클리어 연속 일수
    zeroDailyClearCurrentStreak: number
    zeroDailyClearBestStreak: number
    
    // 완벽한 주간 (7일 연속 모든 가용 daily 완료)
    perfectDailyWeekCount: number
    
    // 부활 횟수 (streak 보호 사용)
    resurrectionCount: number
  }
  
  app: {
    firstSeenAt?: string
    lastSeenAt?: string
    activeDays: number
    activeDateKeys: string[]
  }
  
  dailyHistory: Record<
    string,
    {
      completedDailyQuestIds: string[]
      completedDailyCount: number
      totalDailyAvailableCount: number
      completedAllAvailableDailies: boolean
    }
  >
}

// ── Infinite Tower System (12-18) ────────────────────────────────────

export type TowerFloorType = 'normal' | 'boss'

export type TowerBattleStatus = 'idle' | 'in_progress' | 'revealing' | 'resolved'

export interface TowerBattleResult {
  outcome: 'victory' | 'defeat' | 'draw'
  floor: number
  firstClear: boolean
  rewards: TowerReward
}

export interface TowerReward {
  hunterXp?: number
  gold?: number
  shadowXp?: number
  shadowEssence?: number
  itemDropChance?: number
  boxType?: 'boss'
  titleId?: string
}

export interface TowerBattleSession {
  id: string
  floor: number
  floorType: TowerFloorType
  monsterIds: string[]
  recommendedPower: number
  status: TowerBattleStatus
  logs: BattleTurn[]
  result?: TowerBattleResult
  showResult?: boolean
}

export interface InfiniteTowerState {
  currentFloor: number
  highestClearedFloor: number
  lastAttemptedFloor?: number
  clearedFloors: Record<number, boolean>
  firstClearRewardsClaimed: Record<number, boolean>
  bossRewardsClaimed: Record<number, boolean>
  activeTowerBattle?: TowerBattleSession
}
