import type { BattleBoardLane, BattleUnit, BattleUnitBuildResult } from './directBattleTypes'
import { buildMonsterBattleUnit } from './battleUnits'
import {
  MOCK_DIRECT_BATTLE_MONSTERS,
  getMockDirectBattleMonster,
  type DirectBattleMonsterIntent,
  type DirectBattleMonsterRole,
  type DirectBattleMonsterTargetPriority,
} from './directBattleMonsters'

export type DirectBattleEncounterTier = 'tutorial' | 'standard' | 'elite' | 'boss'
export type DirectBattleEncounterDifficulty = 'easy' | 'normal' | 'hard' | 'boss'

export interface DirectBattleEncounterSlot {
  slotId: string
  monsterId: string
  level?: number
  levelOffset?: number
  boardLane?: BattleBoardLane
  intentHint: DirectBattleMonsterIntent
  targetPriority?: DirectBattleMonsterTargetPriority | 'shadow'
  roleOverride?: DirectBattleMonsterRole
}

export interface DirectBattleEncounterDefinition {
  encounterId: string
  encounterKey: string
  label: string
  labelKo?: string
  description: string
  descriptionKo?: string
  tier: DirectBattleEncounterTier
  difficultyTag: DirectBattleEncounterDifficulty
  recommendedRank?: string[]
  floorBand?: 'low' | 'mid' | 'high' | 'boss'
  bossEncounter?: boolean
  recommendedPlayerUnits: number
  recommendedPartySize: number
  maxRounds: number
  intendedLesson: string
  enemyUnitDefinitions: string[]
  slots: DirectBattleEncounterSlot[]
  tags: string[]
}

export interface DirectBattleEncounterBuildResult {
  encounter: DirectBattleEncounterDefinition
  units: BattleUnit[]
  warnings: string[]
}

export const DIRECT_BATTLE_MOCK_ENCOUNTERS: DirectBattleEncounterDefinition[] = [
  {
    encounterId: 'mock-small-bruiser',
    encounterKey: 'small_bruiser',
    label: 'Small Bruiser',
    description: 'A first direct battle shape with one front-line bruiser.',
    tier: 'tutorial',
    difficultyTag: 'easy',
    recommendedPlayerUnits: 2,
    recommendedPartySize: 2,
    maxRounds: 5,
    intendedLesson: 'front target pressure and basic action ordering',
    enemyUnitDefinitions: ['mock-bruiser'],
    tags: ['small_bruiser', 'frontline'],
    slots: [
      {
        slotId: 'front-bruiser',
        monsterId: 'mock-bruiser',
        levelOffset: 0,
        boardLane: 'front',
        intentHint: 'attack',
        targetPriority: 'frontline',
      },
    ],
  },
  {
    encounterId: 'mock-small-duo',
    encounterKey: 'small_duo',
    label: 'Small Duo',
    description: 'A bruiser backed by a weak minion for early target-priority checks.',
    tier: 'tutorial',
    difficultyTag: 'easy',
    recommendedPlayerUnits: 2,
    recommendedPartySize: 2,
    maxRounds: 5,
    intendedLesson: 'target priority between durable pressure and expendable pressure',
    enemyUnitDefinitions: ['mock-bruiser', 'mock-minion'],
    tags: ['small_duo', 'frontline', 'minion'],
    slots: [
      {
        slotId: 'front-bruiser',
        monsterId: 'mock-bruiser',
        levelOffset: 0,
        boardLane: 'front',
        intentHint: 'attack',
        targetPriority: 'frontline',
      },
      {
        slotId: 'flank-minion',
        monsterId: 'mock-minion',
        levelOffset: -1,
        boardLane: 'flank',
        intentHint: 'attack',
        targetPriority: 'lowest_hp',
      },
    ],
  },
  {
    encounterId: 'mock-caster-pair',
    encounterKey: 'caster_pair',
    label: 'Caster Pair',
    description: 'A bruiser and caster pair used to test skill pressure from the rear lane.',
    tier: 'standard',
    difficultyTag: 'normal',
    recommendedPlayerUnits: 3,
    recommendedPartySize: 3,
    maxRounds: 5,
    intendedLesson: 'interrupt or burn down a rear skill threat while front pressure remains',
    enemyUnitDefinitions: ['mock-bruiser', 'mock-caster'],
    tags: ['caster_pair', 'caster', 'frontline'],
    slots: [
      {
        slotId: 'front-bruiser',
        monsterId: 'mock-bruiser',
        levelOffset: 0,
        boardLane: 'front',
        intentHint: 'attack',
        targetPriority: 'frontline',
      },
      {
        slotId: 'rear-caster',
        monsterId: 'mock-caster',
        levelOffset: 0,
        boardLane: 'rear',
        intentHint: 'cast',
        targetPriority: 'hunter',
      },
    ],
  },
  {
    encounterId: 'mock-tank-assassin',
    encounterKey: 'tank_assassin',
    label: 'Tank Assassin',
    description: 'A guard-heavy tank with a fast assassin for protect and low-HP pressure checks.',
    tier: 'elite',
    difficultyTag: 'hard',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 7,
    intendedLesson: 'guard value and lowest-HP target pressure',
    enemyUnitDefinitions: ['mock-tank', 'mock-assassin'],
    tags: ['tank_assassin', 'guard', 'assassin'],
    slots: [
      {
        slotId: 'front-tank',
        monsterId: 'mock-tank',
        levelOffset: 1,
        boardLane: 'front',
        intentHint: 'guard',
        targetPriority: 'boss_support',
      },
      {
        slotId: 'flank-assassin',
        monsterId: 'mock-assassin',
        levelOffset: 1,
        boardLane: 'flank',
        intentHint: 'attack',
        targetPriority: 'lowest_hp',
      },
    ],
  },
  {
    encounterId: 'mock-control-support',
    encounterKey: 'control_support',
    label: 'Control Support',
    description: 'A controller and support pair for debuff, heal, and support-interrupt checks.',
    tier: 'elite',
    difficultyTag: 'hard',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 7,
    intendedLesson: 'support interrupt and control target priority',
    enemyUnitDefinitions: ['mock-controller', 'mock-support'],
    tags: ['control_support', 'control', 'support'],
    slots: [
      {
        slotId: 'rear-controller',
        monsterId: 'mock-controller',
        levelOffset: 0,
        boardLane: 'rear',
        intentHint: 'control',
        targetPriority: 'caster_or_support',
      },
      {
        slotId: 'rear-support',
        monsterId: 'mock-support',
        levelOffset: 0,
        boardLane: 'rear',
        intentHint: 'support',
        targetPriority: 'boss_support',
      },
    ],
  },
  {
    encounterId: 'mock-boss-minion',
    encounterKey: 'boss_minion',
    label: 'Boss Minion',
    description: 'A boss encounter shell with one expendable minion.',
    tier: 'boss',
    difficultyTag: 'boss',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 10,
    intendedLesson: 'boss pressure with a minion target-priority decision',
    enemyUnitDefinitions: ['mock-boss', 'mock-minion'],
    tags: ['boss_minion', 'boss', 'minion'],
    slots: [
      {
        slotId: 'boss-anchor',
        monsterId: 'mock-boss',
        levelOffset: 0,
        boardLane: 'boss',
        intentHint: 'charge',
        targetPriority: 'highest_threat',
      },
      {
        slotId: 'flank-minion',
        monsterId: 'mock-minion',
        levelOffset: 1,
        boardLane: 'flank',
        intentHint: 'attack',
        targetPriority: 'lowest_hp',
      },
    ],
  },
  {
    encounterId: 'mock-boss-support',
    encounterKey: 'boss_support',
    label: 'Boss Support',
    description: 'A boss encounter shell with support minion pressure.',
    tier: 'boss',
    difficultyTag: 'boss',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 10,
    intendedLesson: 'boss pressure plus support interruption',
    enemyUnitDefinitions: ['mock-boss', 'mock-support', 'mock-minion'],
    tags: ['boss_support', 'boss', 'support', 'minion'],
    slots: [
      {
        slotId: 'boss-anchor',
        monsterId: 'mock-boss',
        levelOffset: 0,
        boardLane: 'boss',
        intentHint: 'charge',
        targetPriority: 'highest_threat',
      },
      {
        slotId: 'rear-support',
        monsterId: 'mock-support',
        levelOffset: 1,
        boardLane: 'rear',
        intentHint: 'support',
        targetPriority: 'boss_support',
      },
      {
        slotId: 'flank-minion',
        monsterId: 'mock-minion',
        levelOffset: 1,
        boardLane: 'flank',
        intentHint: 'attack',
        targetPriority: 'lowest_hp',
      },
    ],
  },
  {
    encounterId: 'direct-lone-charger',
    encounterKey: 'lone_charger',
    label: 'Lone Charger',
    labelKo: '단독 돌격병',
    description: 'A single pressure bruiser for low-rank direct combat.',
    descriptionKo: '전열을 안정적으로 압박하는 단독 돌격병.',
    tier: 'tutorial',
    difficultyTag: 'easy',
    recommendedRank: ['E'],
    floorBand: 'low',
    recommendedPlayerUnits: 2,
    recommendedPartySize: 2,
    maxRounds: 5,
    intendedLesson: 'single front pressure and Hunter skill value',
    enemyUnitDefinitions: ['rift-charger'],
    tags: ['easy', 'bruiser', 'frontline'],
    slots: [{ slotId: 'front-charger', monsterId: 'rift-charger', boardLane: 'front', intentHint: 'attack', targetPriority: 'frontline' }],
  },
  {
    encounterId: 'direct-bruiser-shard',
    encounterKey: 'bruiser_shard',
    label: 'Bruiser Shard',
    labelKo: '돌격병과 균열 파편',
    description: 'A bruiser with a nuisance shard.',
    descriptionKo: '돌격병 뒤에 표식 하수인이 붙은 초반 조합.',
    tier: 'tutorial',
    difficultyTag: 'easy',
    recommendedRank: ['E', 'D'],
    floorBand: 'low',
    recommendedPlayerUnits: 2,
    recommendedPartySize: 2,
    maxRounds: 5,
    intendedLesson: 'small minion pressure while front pressure remains',
    enemyUnitDefinitions: ['rift-charger', 'rift-shard'],
    tags: ['easy', 'bruiser', 'minion'],
    slots: [
      { slotId: 'front-charger', monsterId: 'rift-charger', boardLane: 'front', intentHint: 'attack', targetPriority: 'frontline' },
      { slotId: 'flank-shard', monsterId: 'rift-shard', levelOffset: -1, boardLane: 'flank', intentHint: 'control', targetPriority: 'lowest_hp' },
    ],
  },
  {
    encounterId: 'direct-scout-pair',
    encounterKey: 'scout_pair',
    label: 'Scout Pair',
    labelKo: '추적자 2인조',
    description: 'A low-rank pair built around low-HP pressure.',
    descriptionKo: '낮은 HP 대상을 노리는 빠른 추적자와 파편.',
    tier: 'tutorial',
    difficultyTag: 'easy',
    recommendedRank: ['E', 'D'],
    floorBand: 'low',
    recommendedPlayerUnits: 2,
    recommendedPartySize: 2,
    maxRounds: 5,
    intendedLesson: 'low-HP target pressure and guard timing',
    enemyUnitDefinitions: ['fatigue-stalker', 'rift-shard'],
    tags: ['easy', 'assassin', 'minion'],
    slots: [
      { slotId: 'flank-stalker', monsterId: 'fatigue-stalker', levelOffset: -1, boardLane: 'flank', intentHint: 'attack', targetPriority: 'lowest_hp' },
      { slotId: 'flank-shard', monsterId: 'rift-shard', levelOffset: -1, boardLane: 'flank', intentHint: 'control', targetPriority: 'random_pressure' },
    ],
  },
  {
    encounterId: 'direct-small-caster-guard',
    encounterKey: 'small_caster_guard',
    label: 'Small Caster Guard',
    labelKo: '소형 시전자 경호',
    description: 'A weak caster protected by a small shield unit.',
    descriptionKo: '시전자를 먼저 잡을지 방패를 깰지 고르는 초중반 조합.',
    tier: 'standard',
    difficultyTag: 'easy',
    recommendedRank: ['D'],
    floorBand: 'low',
    recommendedPlayerUnits: 3,
    recommendedPartySize: 3,
    maxRounds: 6,
    intendedLesson: 'rear caster priority through a small guard',
    enemyUnitDefinitions: ['shield-minion', 'rift-hexer'],
    tags: ['easy', 'caster', 'guard'],
    slots: [
      { slotId: 'front-shield', monsterId: 'shield-minion', levelOffset: -1, boardLane: 'front', intentHint: 'guard', targetPriority: 'boss_support' },
      { slotId: 'rear-hexer', monsterId: 'rift-hexer', levelOffset: -1, boardLane: 'rear', intentHint: 'cast', targetPriority: 'highest_threat' },
    ],
  },
  {
    encounterId: 'direct-token-skirmish',
    encounterKey: 'token_skirmish',
    label: 'Token Skirmish',
    labelKo: '저주 토큰 소규모전',
    description: 'Small enemies that become annoying if ignored.',
    descriptionKo: '약하지만 방치하면 표식과 둔화가 누적되는 소규모전.',
    tier: 'tutorial',
    difficultyTag: 'easy',
    recommendedRank: ['D'],
    floorBand: 'low',
    recommendedPlayerUnits: 3,
    recommendedPartySize: 3,
    maxRounds: 5,
    intendedLesson: 'cleaning up nuisance minions before they stack control',
    enemyUnitDefinitions: ['rift-charger', 'curse-token'],
    tags: ['easy', 'control', 'minion'],
    slots: [
      { slotId: 'front-charger', monsterId: 'rift-charger', boardLane: 'front', intentHint: 'attack', targetPriority: 'frontline' },
      { slotId: 'flank-token', monsterId: 'curse-token', levelOffset: -1, boardLane: 'flank', intentHint: 'control', targetPriority: 'lowest_hp' },
    ],
  },
  {
    encounterId: 'direct-tank-caster',
    encounterKey: 'tank_caster',
    label: 'Tank Caster',
    labelKo: '철갑 수문장과 주술사',
    description: 'A tank buys time for a high-skill caster.',
    descriptionKo: '탱커가 주문형 적을 살리는 대표 보통 난이도 조합.',
    tier: 'standard',
    difficultyTag: 'normal',
    recommendedRank: ['C'],
    floorBand: 'mid',
    recommendedPlayerUnits: 3,
    recommendedPartySize: 3,
    maxRounds: 6,
    intendedLesson: 'burn through protection or remove the caster',
    enemyUnitDefinitions: ['iron-gatekeeper', 'rift-hexer'],
    tags: ['normal', 'tank', 'caster'],
    slots: [
      { slotId: 'front-gatekeeper', monsterId: 'iron-gatekeeper', boardLane: 'front', intentHint: 'guard', targetPriority: 'boss_support' },
      { slotId: 'rear-hexer', monsterId: 'rift-hexer', boardLane: 'rear', intentHint: 'cast', targetPriority: 'highest_threat' },
    ],
  },
  {
    encounterId: 'direct-assassin-support',
    encounterKey: 'assassin_support',
    label: 'Assassin Support',
    labelKo: '암살자와 치유사',
    description: 'A healer keeps a fast low-HP assassin active.',
    descriptionKo: '빠른 암살자가 흔들고 치유사가 시간을 번다.',
    tier: 'standard',
    difficultyTag: 'normal',
    recommendedRank: ['C'],
    floorBand: 'mid',
    recommendedPlayerUnits: 3,
    recommendedPartySize: 3,
    maxRounds: 6,
    intendedLesson: 'support target priority under assassin pressure',
    enemyUnitDefinitions: ['fatigue-stalker', 'rift-mender-veteran'],
    tags: ['normal', 'assassin', 'support'],
    slots: [
      { slotId: 'flank-stalker', monsterId: 'fatigue-stalker', boardLane: 'flank', intentHint: 'attack', targetPriority: 'lowest_hp' },
      { slotId: 'rear-mender', monsterId: 'rift-mender-veteran', boardLane: 'rear', intentHint: 'support', targetPriority: 'boss_support' },
    ],
  },
  {
    encounterId: 'direct-controller-bruiser',
    encounterKey: 'controller_bruiser',
    label: 'Controller Bruiser',
    labelKo: '교란자와 싸움꾼',
    description: 'Control marks a target for a bruiser.',
    descriptionKo: '제어형 적이 표식을 만들고 싸움꾼이 그 틈을 친다.',
    tier: 'standard',
    difficultyTag: 'normal',
    recommendedRank: ['C', 'B'],
    floorBand: 'mid',
    recommendedPlayerUnits: 3,
    recommendedPartySize: 3,
    maxRounds: 6,
    intendedLesson: 'control setup before bruiser damage',
    enemyUnitDefinitions: ['memory-disruptor', 'black-claw-brawler'],
    tags: ['normal', 'controller', 'bruiser'],
    slots: [
      { slotId: 'front-brawler', monsterId: 'black-claw-brawler', boardLane: 'front', intentHint: 'attack', targetPriority: 'frontline' },
      { slotId: 'rear-disruptor', monsterId: 'memory-disruptor', boardLane: 'rear', intentHint: 'control', targetPriority: 'highest_threat' },
    ],
  },
  {
    encounterId: 'direct-guard-healer',
    encounterKey: 'guard_healer',
    label: 'Guard Healer',
    labelKo: '방패와 치유 라인',
    description: 'Defensive pair that punishes unfocused targeting.',
    descriptionKo: '집중 공격하지 않으면 회복과 보호로 전투가 늘어진다.',
    tier: 'standard',
    difficultyTag: 'normal',
    recommendedRank: ['C', 'B'],
    floorBand: 'mid',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 7,
    intendedLesson: 'break protection and stop healing',
    enemyUnitDefinitions: ['iron-gatekeeper', 'rift-mender-veteran'],
    tags: ['normal', 'tank', 'support'],
    slots: [
      { slotId: 'front-gatekeeper', monsterId: 'iron-gatekeeper', boardLane: 'front', intentHint: 'guard', targetPriority: 'boss_support' },
      { slotId: 'rear-mender', monsterId: 'rift-mender-veteran', boardLane: 'rear', intentHint: 'support', targetPriority: 'boss_support' },
    ],
  },
  {
    encounterId: 'direct-caster-minions',
    encounterKey: 'caster_minions',
    label: 'Caster Minions',
    labelKo: '시전자와 방해 하수인',
    description: 'A caster supported by two nuisance minions.',
    descriptionKo: '강한 주문형 적과 두 하수인의 방해 압박.',
    tier: 'standard',
    difficultyTag: 'normal',
    recommendedRank: ['C', 'B'],
    floorBand: 'mid',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 7,
    intendedLesson: 'decide between caster burst and minion cleanup',
    enemyUnitDefinitions: ['rift-hexer', 'rift-shard', 'curse-token'],
    tags: ['normal', 'caster', 'minion'],
    slots: [
      { slotId: 'rear-hexer', monsterId: 'rift-hexer', boardLane: 'rear', intentHint: 'cast', targetPriority: 'highest_threat' },
      { slotId: 'flank-shard', monsterId: 'rift-shard', levelOffset: -1, boardLane: 'flank', intentHint: 'control', targetPriority: 'random_pressure' },
      { slotId: 'flank-token', monsterId: 'curse-token', levelOffset: -1, boardLane: 'flank', intentHint: 'control', targetPriority: 'lowest_hp' },
    ],
  },
  {
    encounterId: 'direct-chanting-line',
    encounterKey: 'chanting_line',
    label: 'Chanting Line',
    labelKo: '전장 고양 라인',
    description: 'A battle chanter amplifies a bruiser and minion.',
    descriptionKo: '고양자가 공격 흐름을 끌어올리는 3인 라인.',
    tier: 'standard',
    difficultyTag: 'normal',
    recommendedRank: ['B'],
    floorBand: 'mid',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 7,
    intendedLesson: 'support aura target priority',
    enemyUnitDefinitions: ['black-claw-brawler', 'battle-chanter', 'command-imp'],
    tags: ['normal', 'support', 'bruiser', 'minion'],
    slots: [
      { slotId: 'front-brawler', monsterId: 'black-claw-brawler', boardLane: 'front', intentHint: 'attack', targetPriority: 'frontline' },
      { slotId: 'rear-chanter', monsterId: 'battle-chanter', boardLane: 'rear', intentHint: 'support', targetPriority: 'boss_support' },
      { slotId: 'rear-imp', monsterId: 'command-imp', levelOffset: -1, boardLane: 'rear', intentHint: 'support', targetPriority: 'boss_support' },
    ],
  },
  {
    encounterId: 'direct-tank-controller-assassin',
    encounterKey: 'tank_controller_assassin',
    label: 'Tank Controller Assassin',
    labelKo: '탱커·교란자·암살자',
    description: 'A full hard party with protect, mark, and execution pressure.',
    descriptionKo: '보호, 표식, 낮은 HP 처형 압박이 모두 있는 정예 조합.',
    tier: 'elite',
    difficultyTag: 'hard',
    recommendedRank: ['B', 'A'],
    floorBand: 'high',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 8,
    intendedLesson: 'hard target priority across all roles',
    enemyUnitDefinitions: ['wall-sentinel', 'weakness-registrar', 'night-needle'],
    tags: ['hard', 'tank', 'controller', 'assassin'],
    slots: [
      { slotId: 'front-sentinel', monsterId: 'wall-sentinel', boardLane: 'front', intentHint: 'guard', targetPriority: 'boss_support' },
      { slotId: 'rear-registrar', monsterId: 'weakness-registrar', boardLane: 'rear', intentHint: 'control', targetPriority: 'highest_threat' },
      { slotId: 'flank-needle', monsterId: 'night-needle', boardLane: 'flank', intentHint: 'attack', targetPriority: 'lowest_hp' },
    ],
  },
  {
    encounterId: 'direct-double-caster-guard',
    encounterKey: 'double_caster_guard',
    label: 'Double Caster Guard',
    labelKo: '이중 시전자 경호',
    description: 'Two casters protected by a shield minion.',
    descriptionKo: '후열 주문 둘을 방패 하수인이 지키는 화력 조합.',
    tier: 'elite',
    difficultyTag: 'hard',
    recommendedRank: ['B', 'A'],
    floorBand: 'high',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 8,
    intendedLesson: 'survive repeated skill pressure and pick a caster',
    enemyUnitDefinitions: ['shield-minion', 'abyss-pyromancer', 'storm-oracle'],
    tags: ['hard', 'caster', 'guard'],
    slots: [
      { slotId: 'front-shield', monsterId: 'shield-minion', boardLane: 'front', intentHint: 'guard', targetPriority: 'boss_support' },
      { slotId: 'rear-pyro', monsterId: 'abyss-pyromancer', boardLane: 'rear', intentHint: 'cast', targetPriority: 'highest_threat' },
      { slotId: 'rear-oracle', monsterId: 'storm-oracle', boardLane: 'rear', intentHint: 'control', targetPriority: 'highest_threat' },
    ],
  },
  {
    encounterId: 'direct-protected-bruiser',
    encounterKey: 'support_protected_bruiser',
    label: 'Support Protected Bruiser',
    labelKo: '지원 보호 싸움꾼',
    description: 'A bruiser stays alive behind shield and mend support.',
    descriptionKo: '강한 싸움꾼을 보호/회복으로 오래 살리는 조합.',
    tier: 'elite',
    difficultyTag: 'hard',
    recommendedRank: ['B', 'A'],
    floorBand: 'high',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 8,
    intendedLesson: 'focus fire through layered support',
    enemyUnitDefinitions: ['rift-gladiator', 'shield-cantor', 'rift-mender-veteran'],
    tags: ['hard', 'bruiser', 'support'],
    slots: [
      { slotId: 'front-gladiator', monsterId: 'rift-gladiator', boardLane: 'front', intentHint: 'attack', targetPriority: 'highest_threat' },
      { slotId: 'rear-cantor', monsterId: 'shield-cantor', boardLane: 'rear', intentHint: 'guard', targetPriority: 'boss_support' },
      { slotId: 'rear-mender', monsterId: 'rift-mender-veteran', boardLane: 'rear', intentHint: 'support', targetPriority: 'boss_support' },
    ],
  },
  {
    encounterId: 'direct-assassin-mark-combo',
    encounterKey: 'assassin_mark_combo',
    label: 'Assassin Mark Combo',
    labelKo: '표식 암살 콤보',
    description: 'Control marks targets for two fast attackers.',
    descriptionKo: '표식 후 고속 암살자가 낮은 HP를 물어뜯는다.',
    tier: 'elite',
    difficultyTag: 'hard',
    recommendedRank: ['A', 'S'],
    floorBand: 'high',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 8,
    intendedLesson: 'guard wounded allies before execute pressure lands',
    enemyUnitDefinitions: ['weakness-registrar', 'night-needle', 'scarlet-executor'],
    tags: ['hard', 'assassin', 'control'],
    slots: [
      { slotId: 'rear-registrar', monsterId: 'weakness-registrar', boardLane: 'rear', intentHint: 'control', targetPriority: 'highest_threat' },
      { slotId: 'flank-needle', monsterId: 'night-needle', boardLane: 'flank', intentHint: 'attack', targetPriority: 'lowest_hp' },
      { slotId: 'flank-executor', monsterId: 'scarlet-executor', boardLane: 'flank', intentHint: 'charge', targetPriority: 'lowest_hp' },
    ],
  },
  {
    encounterId: 'direct-elite-mixed-party',
    encounterKey: 'elite_mixed_party',
    label: 'Elite Mixed Party',
    labelKo: '정예 혼합 파티',
    description: 'A late-floor mixed party with control, caster, and tank roles.',
    descriptionKo: '탱커, 제어, 주문 피해가 모두 있는 고층 혼합 파티.',
    tier: 'elite',
    difficultyTag: 'hard',
    recommendedRank: ['A', 'S'],
    floorBand: 'high',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 8,
    intendedLesson: 'adapt target priority to a complete enemy party',
    enemyUnitDefinitions: ['oath-bulwark', 'suppression-warden', 'abyss-pyromancer'],
    tags: ['hard', 'mixed', 'tank', 'caster', 'controller'],
    slots: [
      { slotId: 'front-bulwark', monsterId: 'oath-bulwark', boardLane: 'front', intentHint: 'guard', targetPriority: 'boss_support' },
      { slotId: 'rear-warden', monsterId: 'suppression-warden', boardLane: 'rear', intentHint: 'control', targetPriority: 'caster_or_support' },
      { slotId: 'rear-pyro', monsterId: 'abyss-pyromancer', boardLane: 'rear', intentHint: 'cast', targetPriority: 'highest_threat' },
    ],
  },
  {
    encounterId: 'direct-storm-killbox',
    encounterKey: 'storm_killbox',
    label: 'Storm Killbox',
    labelKo: '폭풍 화력진',
    description: 'Control and caster pressure supported by an attack aura.',
    descriptionKo: '전장 고양과 주문/제어 피해가 겹치는 정예 진형.',
    tier: 'elite',
    difficultyTag: 'hard',
    recommendedRank: ['A', 'S'],
    floorBand: 'high',
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 8,
    intendedLesson: 'remove aura or caster before the killbox stabilizes',
    enemyUnitDefinitions: ['storm-oracle', 'battle-chanter', 'scarlet-executor'],
    tags: ['hard', 'caster', 'support', 'assassin'],
    slots: [
      { slotId: 'rear-oracle', monsterId: 'storm-oracle', boardLane: 'rear', intentHint: 'control', targetPriority: 'highest_threat' },
      { slotId: 'rear-chanter', monsterId: 'battle-chanter', boardLane: 'rear', intentHint: 'support', targetPriority: 'boss_support' },
      { slotId: 'flank-executor', monsterId: 'scarlet-executor', boardLane: 'flank', intentHint: 'attack', targetPriority: 'lowest_hp' },
    ],
  },
  {
    encounterId: 'direct-commander-line',
    encounterKey: 'commander_line',
    label: 'Commander Line',
    labelKo: '균열 지휘관 라인',
    description: 'A commander boss with a shield minion and command imp.',
    descriptionKo: '지휘 오라와 하수인 보호가 겹치는 보스 조합.',
    tier: 'boss',
    difficultyTag: 'boss',
    recommendedRank: ['S'],
    floorBand: 'boss',
    bossEncounter: true,
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 10,
    intendedLesson: 'boss aura plus minion protection',
    enemyUnitDefinitions: ['rift-commander', 'shield-minion', 'command-imp'],
    tags: ['boss', 'commander', 'minion', 'support'],
    slots: [
      { slotId: 'boss-commander', monsterId: 'rift-commander', boardLane: 'boss', intentHint: 'support', targetPriority: 'highest_threat' },
      { slotId: 'front-shield', monsterId: 'shield-minion', levelOffset: 1, boardLane: 'front', intentHint: 'guard', targetPriority: 'boss_support' },
      { slotId: 'rear-imp', monsterId: 'command-imp', levelOffset: 1, boardLane: 'rear', intentHint: 'support', targetPriority: 'boss_support' },
    ],
  },
  {
    encounterId: 'direct-oblivion-watch',
    encounterKey: 'oblivion_watch',
    label: 'Oblivion Watch',
    labelKo: '망각의 감시자 파티',
    description: 'A control boss with curse tokens.',
    descriptionKo: '망각 보스가 저주 토큰과 함께 표식/약화를 건다.',
    tier: 'boss',
    difficultyTag: 'boss',
    recommendedRank: ['S'],
    floorBand: 'boss',
    bossEncounter: true,
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 10,
    intendedLesson: 'cleanse pressure through token cleanup or boss burn',
    enemyUnitDefinitions: ['oblivion-watcher', 'curse-token', 'rift-shard'],
    tags: ['boss', 'control', 'minion'],
    slots: [
      { slotId: 'boss-watcher', monsterId: 'oblivion-watcher', boardLane: 'boss', intentHint: 'control', targetPriority: 'highest_threat' },
      { slotId: 'flank-token', monsterId: 'curse-token', levelOffset: 1, boardLane: 'flank', intentHint: 'control', targetPriority: 'lowest_hp' },
      { slotId: 'flank-shard', monsterId: 'rift-shard', levelOffset: 2, boardLane: 'flank', intentHint: 'control', targetPriority: 'random_pressure' },
    ],
  },
  {
    encounterId: 'direct-iron-wall-court',
    encounterKey: 'iron_wall_court',
    label: 'Iron Wall Court',
    labelKo: '철벽 군주 궁정',
    description: 'A defensive boss court.',
    descriptionKo: '철벽 군주와 보호/회복 라인이 시간을 끈다.',
    tier: 'boss',
    difficultyTag: 'boss',
    recommendedRank: ['S'],
    floorBand: 'boss',
    bossEncounter: true,
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 10,
    intendedLesson: 'break defensive layers before the round limit',
    enemyUnitDefinitions: ['iron-wall-lord', 'shield-cantor', 'shield-minion'],
    tags: ['boss', 'tank', 'support'],
    slots: [
      { slotId: 'boss-wall', monsterId: 'iron-wall-lord', boardLane: 'boss', intentHint: 'guard', targetPriority: 'frontline' },
      { slotId: 'rear-cantor', monsterId: 'shield-cantor', levelOffset: 1, boardLane: 'rear', intentHint: 'guard', targetPriority: 'boss_support' },
      { slotId: 'front-shield', monsterId: 'shield-minion', levelOffset: 2, boardLane: 'front', intentHint: 'guard', targetPriority: 'boss_support' },
    ],
  },
  {
    encounterId: 'direct-abyss-devourer-pack',
    encounterKey: 'abyss_devourer_pack',
    label: 'Abyss Devourer Pack',
    labelKo: '심연 포식자 무리',
    description: 'An aggressive boss with spawn pressure.',
    descriptionKo: '심연 포식자가 소환수와 함께 낮은 HP 대상을 압박한다.',
    tier: 'boss',
    difficultyTag: 'boss',
    recommendedRank: ['S'],
    floorBand: 'boss',
    bossEncounter: true,
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 10,
    intendedLesson: 'survive execute pressure while choosing boss or spawn targets',
    enemyUnitDefinitions: ['abyss-devourer', 'abyss-spawn', 'abyss-spawn'],
    tags: ['boss', 'assassin', 'minion'],
    slots: [
      { slotId: 'boss-devourer', monsterId: 'abyss-devourer', boardLane: 'boss', intentHint: 'charge', targetPriority: 'lowest_hp' },
      { slotId: 'flank-spawn-a', monsterId: 'abyss-spawn', levelOffset: 1, boardLane: 'flank', intentHint: 'attack', targetPriority: 'lowest_hp' },
      { slotId: 'flank-spawn-b', monsterId: 'abyss-spawn', levelOffset: 0, boardLane: 'flank', intentHint: 'attack', targetPriority: 'random_pressure' },
    ],
  },
  {
    encounterId: 'direct-memory-warden-party',
    encounterKey: 'memory_warden_party',
    label: 'Memory Warden Party',
    labelKo: '기억 감시관 파티',
    description: 'A boss with suppression and shield support.',
    descriptionKo: '감시관이 억압 필드를 깔고 탱커가 보호한다.',
    tier: 'boss',
    difficultyTag: 'boss',
    recommendedRank: ['S'],
    floorBand: 'boss',
    bossEncounter: true,
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 10,
    intendedLesson: 'control boss plus protective line',
    enemyUnitDefinitions: ['memory-warden-boss', 'oath-bulwark', 'command-imp'],
    tags: ['boss', 'control', 'tank', 'minion'],
    slots: [
      { slotId: 'boss-warden', monsterId: 'memory-warden-boss', boardLane: 'boss', intentHint: 'control', targetPriority: 'highest_threat' },
      { slotId: 'front-bulwark', monsterId: 'oath-bulwark', levelOffset: 1, boardLane: 'front', intentHint: 'guard', targetPriority: 'boss_support' },
      { slotId: 'rear-imp', monsterId: 'command-imp', levelOffset: 1, boardLane: 'rear', intentHint: 'support', targetPriority: 'boss_support' },
    ],
  },
  {
    encounterId: 'direct-boss-double-minion',
    encounterKey: 'boss_double_minion',
    label: 'Boss Double Minion',
    labelKo: '보스와 이중 하수인',
    description: 'A general boss shell with two different minion jobs.',
    descriptionKo: '보스 하나에 방패 하수인과 저주 하수인이 붙은 범용 보스전.',
    tier: 'boss',
    difficultyTag: 'boss',
    recommendedRank: ['A', 'S'],
    floorBand: 'boss',
    bossEncounter: true,
    recommendedPlayerUnits: 4,
    recommendedPartySize: 4,
    maxRounds: 10,
    intendedLesson: 'boss pressure with split minion jobs',
    enemyUnitDefinitions: ['mock-boss', 'shield-minion', 'curse-token'],
    tags: ['boss', 'minion', 'guard', 'control'],
    slots: [
      { slotId: 'boss-anchor', monsterId: 'mock-boss', boardLane: 'boss', intentHint: 'charge', targetPriority: 'highest_threat' },
      { slotId: 'front-shield', monsterId: 'shield-minion', levelOffset: 1, boardLane: 'front', intentHint: 'guard', targetPriority: 'boss_support' },
      { slotId: 'flank-token', monsterId: 'curse-token', levelOffset: 1, boardLane: 'flank', intentHint: 'control', targetPriority: 'lowest_hp' },
    ],
  },
]

export const DIRECT_BATTLE_GATE_ENCOUNTER_POOLS: Record<string, string[]> = {
  E: ['lone_charger', 'bruiser_shard', 'small_duo', 'scout_pair'],
  D: ['bruiser_shard', 'small_caster_guard', 'token_skirmish', 'tank_caster', 'assassin_support'],
  C: ['tank_caster', 'assassin_support', 'controller_bruiser', 'guard_healer', 'caster_minions'],
  B: ['controller_bruiser', 'guard_healer', 'caster_minions', 'chanting_line', 'tank_controller_assassin', 'double_caster_guard'],
  A: ['tank_controller_assassin', 'double_caster_guard', 'support_protected_bruiser', 'assassin_mark_combo', 'elite_mixed_party', 'storm_killbox'],
  S: ['assassin_mark_combo', 'elite_mixed_party', 'storm_killbox', 'commander_line', 'oblivion_watch', 'abyss_devourer_pack', 'memory_warden_party'],
}

export const DIRECT_BATTLE_TOWER_ENCOUNTER_POOLS = {
  low: ['bruiser_shard', 'scout_pair', 'small_caster_guard', 'token_skirmish', 'tank_caster'],
  mid: ['tank_caster', 'assassin_support', 'controller_bruiser', 'guard_healer', 'caster_minions', 'chanting_line'],
  high: ['tank_controller_assassin', 'double_caster_guard', 'support_protected_bruiser', 'assassin_mark_combo', 'elite_mixed_party', 'storm_killbox'],
  boss: ['boss_minion', 'boss_double_minion', 'commander_line', 'oblivion_watch', 'iron_wall_court', 'abyss_devourer_pack', 'memory_warden_party'],
} as const

const stablePick = (pool: readonly string[], seed: string | number): string => {
  if (pool.length === 0) return 'small_duo'
  const text = String(seed)
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }
  return pool[hash % pool.length]
}

export const pickDirectGateEncounterKey = (rank: string, seed: string | number): string =>
  stablePick(DIRECT_BATTLE_GATE_ENCOUNTER_POOLS[rank] ?? DIRECT_BATTLE_GATE_ENCOUNTER_POOLS.E, `${rank}:${seed}`)

export const pickDirectTowerEncounterKey = (floor: number, floorType: 'normal' | 'boss' | 'elite' | string): string => {
  if (floorType === 'boss') {
    const bossPool = floor >= 20
      ? DIRECT_BATTLE_TOWER_ENCOUNTER_POOLS.boss.slice(2)
      : DIRECT_BATTLE_TOWER_ENCOUNTER_POOLS.boss
    return stablePick(bossPool, `boss:${floor}`)
  }
  const pool = floor <= 4
    ? DIRECT_BATTLE_TOWER_ENCOUNTER_POOLS.low
    : floor <= 9
      ? DIRECT_BATTLE_TOWER_ENCOUNTER_POOLS.mid
      : DIRECT_BATTLE_TOWER_ENCOUNTER_POOLS.high
  return stablePick(pool, `floor:${floor}`)
}

export const getDirectBattleMockEncounter = (encounterId: string): DirectBattleEncounterDefinition | undefined =>
  DIRECT_BATTLE_MOCK_ENCOUNTERS.find(encounter => encounter.encounterId === encounterId || encounter.encounterKey === encounterId)

export const validateDirectBattleMockEncounters = (): string[] => {
  const issues: string[] = []
  const monsterIds = new Set(MOCK_DIRECT_BATTLE_MONSTERS.map(monster => monster.id))
  const encounterIds = new Set<string>()

  for (const encounter of DIRECT_BATTLE_MOCK_ENCOUNTERS) {
    if (encounterIds.has(encounter.encounterId)) issues.push(`Duplicate encounter id ${encounter.encounterId}`)
    encounterIds.add(encounter.encounterId)
    if (encounterIds.has(encounter.encounterKey)) issues.push(`Duplicate encounter key ${encounter.encounterKey}`)
    encounterIds.add(encounter.encounterKey)
    if (encounter.slots.length === 0) issues.push(`${encounter.encounterId} has no slots`)
    if (encounter.slots.length > 3) issues.push(`${encounter.encounterId} exceeds the 1-3 enemy mock range`)
    if (encounter.maxRounds < 1) issues.push(`${encounter.encounterId} has invalid maxRounds`)
    if (encounter.recommendedPlayerUnits < 1) issues.push(`${encounter.encounterId} has invalid recommendedPlayerUnits`)
    if (encounter.enemyUnitDefinitions.length !== encounter.slots.length) {
      issues.push(`${encounter.encounterId} enemyUnitDefinitions do not match slots`)
    }
    for (const slot of encounter.slots) {
      if (!monsterIds.has(slot.monsterId)) issues.push(`${encounter.encounterId}.${slot.slotId} missing monster ${slot.monsterId}`)
    }
  }

  return issues
}

export const buildDirectBattleEncounterParty = (
  encounterId: string,
  baseLevel?: number,
): DirectBattleEncounterBuildResult => {
  const encounter = getDirectBattleMockEncounter(encounterId) ?? DIRECT_BATTLE_MOCK_ENCOUNTERS[0]
  const warnings: string[] = encounter.encounterId === encounterId || encounter.encounterKey === encounterId
    ? []
    : [`Unknown encounter ${encounterId}; fallback encounter used.`]
  const unitResults = encounter.slots.flatMap((slot, index): BattleUnitBuildResult[] => {
    const monster = getMockDirectBattleMonster(slot.monsterId)
    if (!monster) {
      warnings.push(`Missing mock monster ${slot.monsterId} in slot ${slot.slotId}.`)
      return []
    }
    const level = Math.max(1, slot.level ?? (baseLevel ?? monster.baseLevel) + (slot.levelOffset ?? 0))
    const result = buildMonsterBattleUnit(monster, {
      unitIdPrefix: `${encounter.encounterId}-${slot.slotId}-${index + 1}`,
      level,
    })
    return [{
      ...result,
      unit: {
        ...result.unit,
        role: slot.roleOverride ?? result.unit.role,
        boardLane: slot.boardLane ?? result.unit.boardLane,
        metadata: {
          ...result.unit.metadata,
          tags: [
            ...(result.unit.metadata.tags ?? []),
            encounter.encounterId,
            encounter.encounterKey,
            encounter.tier,
            encounter.difficultyTag,
            slot.intentHint,
            ...(slot.targetPriority ? [slot.targetPriority] : []),
          ],
        },
      },
    }]
  })

  return {
    encounter,
    units: unitResults.map(result => result.unit),
    warnings: [
      ...warnings,
      ...unitResults.flatMap(result => result.warnings),
    ],
  }
}
