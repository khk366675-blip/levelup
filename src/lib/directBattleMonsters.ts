import type { BattleActionDefinition, BattleBoardLane, BattleTargetType, BattleUnitType } from './directBattleTypes'

export type DirectBattleMonsterRole =
  | 'bruiser'
  | 'tank'
  | 'caster'
  | 'assassin'
  | 'support'
  | 'controller'
  | 'minion'
  | 'boss'

export interface DirectBattleMonsterDefinition {
  id: string
  name: string
  role: DirectBattleMonsterRole
  unitType: BattleUnitType
  baseLevel: number
  levelBand: 'early' | 'mid' | 'late' | 'boss'
  statBias: {
    hp: number
    atk: number
    def: number
    spd: number
    skill: number
    crit?: number
    control?: number
    support?: number
    survival?: number
    boss?: number
    synergy?: number
  }
  intentCandidates: DirectBattleMonsterIntent[]
  targetPriority: DirectBattleMonsterTargetPriority
  isBoss?: boolean
  isMinion?: boolean
  boardLane: BattleBoardLane
  actionCue: string
  animationCue: string
  effectColor: string
  descriptionKo?: string
  flavor?: string
  rank?: string
  actionList: BattleActionDefinition[]
}

export type DirectBattleMonsterIntent = 'attack' | 'guard' | 'cast' | 'support' | 'control' | 'summon' | 'charge'
export type DirectBattleMonsterTargetPriority =
  | 'frontline'
  | 'hunter'
  | 'lowest_hp'
  | 'highest_threat'
  | 'boss_support'
  | 'caster_or_support'
  | 'random_pressure'

export interface DirectBattleMockPartySlot {
  monsterId: string
  levelOffset?: number
}

export interface DirectBattleMockPartyDefinition {
  encounterKey: string
  label: string
  difficultyTag: 'easy' | 'normal' | 'hard' | 'boss'
  slots: DirectBattleMockPartySlot[]
}

const monsterAction = (
  params: {
    actionId: string
    label: string
    effectKind: BattleActionDefinition['effectKind']
    actionCue: string
    actionType?: BattleActionDefinition['actionType']
    targetType?: BattleTargetType
    basePriority?: number
    cooldown?: number
    animationCue?: string
    effectColor?: string
    description?: string
  },
): BattleActionDefinition => ({
  actionId: params.actionId,
  label: params.label,
  actionType: params.actionType ?? (
    params.effectKind === 'basic' ? 'basic' :
      params.effectKind === 'guard' ? 'guard' :
        params.effectKind === 'support' ? 'support' :
          params.effectKind === 'wait' ? 'wait' :
            'skill'
  ),
  targetType: params.targetType ?? (
    params.effectKind === 'support' || params.effectKind === 'guard' ? 'lowest_hp_ally' : 'single_enemy'
  ),
  effectKind: params.effectKind,
  basePriority: params.basePriority ?? 0,
  cooldown: params.cooldown ?? (params.effectKind === 'basic' ? 0 : 2),
  description: params.description,
  actionCue: params.actionCue,
  animationCue: params.animationCue ?? params.actionCue,
  effectColor: params.effectColor ?? 'slate',
})

export const MOCK_DIRECT_BATTLE_MONSTERS: DirectBattleMonsterDefinition[] = [
  {
    id: 'mock-bruiser',
    name: 'Mock Rift Bruiser',
    role: 'bruiser',
    unitType: 'monster',
    baseLevel: 6,
    levelBand: 'early',
    statBias: { hp: 1.45, atk: 1.3, def: 1.05, spd: 0.98, skill: 1.02, crit: 0.9 },
    intentCandidates: ['attack', 'charge'],
    targetPriority: 'frontline',
    boardLane: 'front',
    actionCue: 'bruiser_swing',
    animationCue: 'monster-heavy-swing',
    effectColor: 'red',
    actionList: [
      monsterAction({
        actionId: 'mock-bruiser-jab',
        label: 'Rift Jab',
        effectKind: 'basic',
        actionCue: 'bruiser_jab',
        targetType: 'front_lane',
        effectColor: 'red',
      }),
      monsterAction({
        actionId: 'mock-bruiser-swing',
        label: 'Heavy Swing',
        effectKind: 'damage',
        actionCue: 'bruiser_swing',
        targetType: 'front_lane',
        basePriority: 1,
        cooldown: 2,
        effectColor: 'red',
      }),
    ],
  },
  {
    id: 'mock-tank',
    name: 'Mock Gate Bulwark',
    role: 'tank',
    unitType: 'monster',
    baseLevel: 7,
    levelBand: 'mid',
    statBias: { hp: 2, atk: 0.96, def: 1.58, spd: 0.74, skill: 0.82, survival: 1.48 },
    intentCandidates: ['guard', 'attack'],
    targetPriority: 'boss_support',
    boardLane: 'front',
    actionCue: 'tank_guard',
    animationCue: 'monster-guard',
    effectColor: 'stone',
    actionList: [
      monsterAction({
        actionId: 'mock-tank-bash',
        label: 'Shield Bash',
        effectKind: 'basic',
        actionCue: 'tank_bash',
        targetType: 'front_lane',
        effectColor: 'stone',
      }),
      monsterAction({
        actionId: 'mock-tank-guard',
        label: 'Bulwark Guard',
        effectKind: 'guard',
        actionCue: 'tank_guard',
        targetType: 'lowest_hp_ally',
        basePriority: 2,
        cooldown: 2,
        effectColor: 'stone',
      }),
    ],
  },
  {
    id: 'mock-caster',
    name: 'Mock Rift Caster',
    role: 'caster',
    unitType: 'monster',
    baseLevel: 7,
    levelBand: 'mid',
    statBias: { hp: 1.22, atk: 0.88, def: 0.78, spd: 1.02, skill: 1.74, control: 1.26 },
    intentCandidates: ['cast', 'charge', 'attack'],
    targetPriority: 'highest_threat',
    boardLane: 'rear',
    actionCue: 'caster_bolt',
    animationCue: 'monster-cast',
    effectColor: 'violet',
    actionList: [
      monsterAction({
        actionId: 'mock-caster-spark',
        label: 'Rift Spark',
        effectKind: 'basic',
        actionCue: 'caster_spark',
        targetType: 'highest_threat_enemy',
        effectColor: 'violet',
      }),
      monsterAction({
        actionId: 'mock-caster-bolt',
        label: 'Rift Bolt',
        effectKind: 'damage',
        actionCue: 'caster_bolt',
        targetType: 'highest_threat_enemy',
        basePriority: 1,
        cooldown: 2,
        effectColor: 'violet',
      }),
    ],
  },
  {
    id: 'mock-assassin',
    name: 'Mock Shadow Assassin',
    role: 'assassin',
    unitType: 'monster',
    baseLevel: 8,
    levelBand: 'mid',
    statBias: { hp: 1.2, atk: 1.48, def: 0.78, spd: 1.54, skill: 1.28, crit: 1.48 },
    intentCandidates: ['attack', 'charge'],
    targetPriority: 'lowest_hp',
    boardLane: 'flank',
    actionCue: 'assassin_dash',
    animationCue: 'monster-dash',
    effectColor: 'rose',
    actionList: [
      monsterAction({
        actionId: 'mock-assassin-stab',
        label: 'Quick Stab',
        effectKind: 'basic',
        actionCue: 'assassin_stab',
        targetType: 'lowest_hp_enemy',
        basePriority: 2,
        effectColor: 'rose',
      }),
      monsterAction({
        actionId: 'mock-assassin-burst',
        label: 'Flank Burst',
        effectKind: 'damage',
        actionCue: 'assassin_burst',
        targetType: 'lowest_hp_enemy',
        basePriority: 2,
        cooldown: 2,
        effectColor: 'rose',
      }),
    ],
  },
  {
    id: 'mock-support',
    name: 'Mock Rift Mender',
    role: 'support',
    unitType: 'monster',
    baseLevel: 7,
    levelBand: 'mid',
    statBias: { hp: 1.48, atk: 0.72, def: 0.96, spd: 1.06, skill: 1.08, support: 1.62, survival: 1.08, synergy: 1.24 },
    intentCandidates: ['support', 'control'],
    targetPriority: 'boss_support',
    boardLane: 'rear',
    actionCue: 'support_pulse',
    animationCue: 'monster-support',
    effectColor: 'emerald',
    actionList: [
      monsterAction({
        actionId: 'mock-support-tap',
        label: 'Weak Tap',
        effectKind: 'basic',
        actionCue: 'support_tap',
        targetType: 'single_enemy',
        effectColor: 'emerald',
      }),
      monsterAction({
        actionId: 'mock-support-pulse',
        label: 'Mending Pulse',
        effectKind: 'support',
        actionCue: 'support_pulse',
        targetType: 'lowest_hp_ally',
        basePriority: 1,
        cooldown: 2,
        effectColor: 'emerald',
      }),
      monsterAction({
        actionId: 'mock-support-shield',
        label: 'Soft Shield',
        effectKind: 'guard',
        actionCue: 'support_shield',
        targetType: 'lowest_hp_ally',
        basePriority: 1,
        cooldown: 3,
        effectColor: 'emerald',
      }),
    ],
  },
  {
    id: 'mock-controller',
    name: 'Mock Intent Breaker',
    role: 'controller',
    unitType: 'monster',
    baseLevel: 8,
    levelBand: 'mid',
    statBias: { hp: 1.52, atk: 0.9, def: 0.92, spd: 1.1, skill: 1.32, control: 1.78 },
    intentCandidates: ['control', 'cast'],
    targetPriority: 'caster_or_support',
    boardLane: 'rear',
    actionCue: 'controller_field',
    animationCue: 'monster-control',
    effectColor: 'cyan',
    actionList: [
      monsterAction({
        actionId: 'mock-controller-jolt',
        label: 'Control Jolt',
        effectKind: 'basic',
        actionCue: 'controller_jolt',
        targetType: 'highest_threat_enemy',
        effectColor: 'cyan',
      }),
      monsterAction({
        actionId: 'mock-controller-field',
        label: 'Intent Field',
        effectKind: 'control',
        actionCue: 'controller_field',
        targetType: 'highest_threat_enemy',
        basePriority: 1,
        cooldown: 2,
        effectColor: 'cyan',
      }),
    ],
  },
  {
    id: 'mock-minion',
    name: 'Mock Rift Minion',
    role: 'minion',
    unitType: 'minion',
    baseLevel: 5,
    levelBand: 'early',
    statBias: { hp: 1.05, atk: 0.94, def: 0.76, spd: 0.98, skill: 0.86, synergy: 0.85 },
    intentCandidates: ['attack', 'support'],
    targetPriority: 'random_pressure',
    isMinion: true,
    boardLane: 'flank',
    actionCue: 'minion_swarm',
    animationCue: 'monster-minion',
    effectColor: 'zinc',
    actionList: [
      monsterAction({
        actionId: 'mock-minion-scratch',
        label: 'Scratch',
        effectKind: 'basic',
        actionCue: 'minion_scratch',
        targetType: 'single_enemy',
        effectColor: 'zinc',
      }),
      monsterAction({
        actionId: 'mock-minion-harry',
        label: 'Harry',
        effectKind: 'control',
        actionCue: 'minion_harry',
        targetType: 'lowest_hp_enemy',
        basePriority: 1,
        cooldown: 2,
        effectColor: 'zinc',
      }),
    ],
  },
  {
    id: 'mock-boss',
    name: 'Mock Gate Boss',
    role: 'boss',
    unitType: 'boss',
    baseLevel: 12,
    levelBand: 'boss',
    statBias: { hp: 2.45, atk: 1.48, def: 1.38, spd: 0.9, skill: 1.68, control: 1.22, boss: 2.05, survival: 1.62 },
    intentCandidates: ['attack', 'control', 'charge', 'summon'],
    targetPriority: 'highest_threat',
    isBoss: true,
    boardLane: 'boss',
    actionCue: 'boss_intent',
    animationCue: 'monster-boss',
    effectColor: 'crimson',
    actionList: [
      monsterAction({
        actionId: 'mock-boss-crush',
        label: 'Boss Crush',
        effectKind: 'damage',
        actionCue: 'boss_crush',
        targetType: 'highest_threat_enemy',
        cooldown: 2,
        effectColor: 'crimson',
      }),
      monsterAction({
        actionId: 'mock-boss-suppression',
        label: 'Suppression Roar',
        effectKind: 'control',
        actionCue: 'boss_suppression',
        targetType: 'all_enemies',
        basePriority: 1,
        cooldown: 3,
        effectColor: 'crimson',
      }),
    ],
  },
  {
    id: 'rift-charger',
    name: 'Rift Charger',
    role: 'bruiser',
    unitType: 'monster',
    baseLevel: 5,
    levelBand: 'early',
    statBias: { hp: 1.35, atk: 1.34, def: 0.98, spd: 1.02, skill: 1.04, crit: 0.95 },
    intentCandidates: ['attack', 'charge'],
    targetPriority: 'frontline',
    boardLane: 'front',
    actionCue: 'rift_charger_drive',
    animationCue: 'monster-charge',
    effectColor: 'orange',
    descriptionKo: '전열을 밀어붙이는 기본 압박형 돌격병.',
    actionList: [
      monsterAction({ actionId: 'rift-charger-strike', label: 'Driving Strike', effectKind: 'basic', actionCue: 'charger_strike', targetType: 'front_lane', effectColor: 'orange' }),
      monsterAction({ actionId: 'rift-charger-crush', label: 'Crushing Blow', effectKind: 'damage', actionCue: 'charger_crush', targetType: 'front_lane', basePriority: 1, cooldown: 2, effectColor: 'orange' }),
    ],
  },
  {
    id: 'black-claw-brawler',
    name: 'Black Claw Brawler',
    role: 'bruiser',
    unitType: 'monster',
    baseLevel: 9,
    levelBand: 'mid',
    statBias: { hp: 1.5, atk: 1.42, def: 1.08, spd: 0.96, skill: 1.12, crit: 1.02 },
    intentCandidates: ['attack', 'charge'],
    targetPriority: 'frontline',
    boardLane: 'front',
    actionCue: 'black_claw_pressure',
    animationCue: 'monster-heavy-swing',
    effectColor: 'red',
    descriptionKo: '표식이 찍힌 전열을 집요하게 두드리는 싸움꾼.',
    actionList: [
      monsterAction({ actionId: 'black-claw-hook', label: 'Hook Punch', effectKind: 'basic', actionCue: 'black_claw_hook', targetType: 'front_lane', effectColor: 'red' }),
      monsterAction({ actionId: 'black-claw-pressure', label: 'Pressure Attack', effectKind: 'control', actionCue: 'black_claw_pressure', targetType: 'front_lane', basePriority: 1, cooldown: 2, effectColor: 'red' }),
    ],
  },
  {
    id: 'rift-gladiator',
    name: 'Rift Gladiator',
    role: 'bruiser',
    unitType: 'monster',
    baseLevel: 14,
    levelBand: 'late',
    statBias: { hp: 1.7, atk: 1.55, def: 1.16, spd: 1, skill: 1.26, crit: 1.1, survival: 1.08 },
    intentCandidates: ['attack', 'charge'],
    targetPriority: 'highest_threat',
    boardLane: 'front',
    actionCue: 'gladiator_breaker',
    animationCue: 'monster-heavy-swing',
    effectColor: 'amber',
    descriptionKo: '후반부 전열을 버티며 가장 위협적인 대상을 압박한다.',
    actionList: [
      monsterAction({ actionId: 'rift-gladiator-cut', label: 'Arena Cut', effectKind: 'basic', actionCue: 'gladiator_cut', targetType: 'highest_threat_enemy', effectColor: 'amber' }),
      monsterAction({ actionId: 'rift-gladiator-breaker', label: 'Guard Breaker', effectKind: 'hybrid', actionCue: 'gladiator_breaker', targetType: 'highest_threat_enemy', basePriority: 1, cooldown: 2, effectColor: 'amber' }),
    ],
  },
  {
    id: 'iron-gatekeeper',
    name: 'Iron Gatekeeper',
    role: 'tank',
    unitType: 'monster',
    baseLevel: 8,
    levelBand: 'mid',
    statBias: { hp: 2.1, atk: 0.92, def: 1.76, spd: 0.68, skill: 0.82, survival: 1.72, support: 0.72 },
    intentCandidates: ['guard', 'attack'],
    targetPriority: 'boss_support',
    boardLane: 'front',
    actionCue: 'iron_gatekeeper_wall',
    animationCue: 'monster-guard',
    effectColor: 'slate',
    descriptionKo: '후열과 보스를 지키는 철갑 수문장.',
    actionList: [
      monsterAction({ actionId: 'iron-gatekeeper-bash', label: 'Iron Bash', effectKind: 'basic', actionCue: 'iron_bash', targetType: 'front_lane', effectColor: 'slate' }),
      monsterAction({ actionId: 'iron-gatekeeper-wall', label: 'Shield Wall', effectKind: 'guard', actionCue: 'shield_wall', targetType: 'lowest_hp_ally', basePriority: 3, cooldown: 2, effectColor: 'slate' }),
    ],
  },
  {
    id: 'wall-sentinel',
    name: 'Wall Sentinel',
    role: 'tank',
    unitType: 'monster',
    baseLevel: 12,
    levelBand: 'late',
    statBias: { hp: 2.28, atk: 0.86, def: 1.92, spd: 0.62, skill: 0.86, survival: 1.9, synergy: 0.9 },
    intentCandidates: ['guard', 'support'],
    targetPriority: 'boss_support',
    boardLane: 'front',
    actionCue: 'wall_sentinel_protect',
    animationCue: 'monster-guard',
    effectColor: 'stone',
    descriptionKo: '방패벽을 세워 후열 화력을 오래 살린다.',
    actionList: [
      monsterAction({ actionId: 'wall-sentinel-ram', label: 'Wall Ram', effectKind: 'basic', actionCue: 'wall_ram', targetType: 'front_lane', effectColor: 'stone' }),
      monsterAction({ actionId: 'wall-sentinel-protect', label: 'Protect Line', effectKind: 'guard', actionCue: 'protect_line', targetType: 'lowest_hp_ally', basePriority: 3, cooldown: 2, effectColor: 'stone' }),
      monsterAction({ actionId: 'wall-sentinel-rally', label: 'Hold Formation', effectKind: 'synergy', actionCue: 'hold_formation', targetType: 'all_allies', basePriority: 2, cooldown: 3, effectColor: 'stone' }),
    ],
  },
  {
    id: 'oath-bulwark',
    name: 'Oath Bulwark',
    role: 'tank',
    unitType: 'monster',
    baseLevel: 17,
    levelBand: 'late',
    statBias: { hp: 2.46, atk: 0.94, def: 2.1, spd: 0.58, skill: 0.94, survival: 2.05, support: 0.95 },
    intentCandidates: ['guard', 'support'],
    targetPriority: 'boss_support',
    boardLane: 'front',
    actionCue: 'oath_bulwark_interpose',
    animationCue: 'monster-guard',
    effectColor: 'cyan',
    descriptionKo: '보스 조합에서 보호막과 도발선을 담당하는 정예 탱커.',
    actionList: [
      monsterAction({ actionId: 'oath-bulwark-slam', label: 'Oath Slam', effectKind: 'basic', actionCue: 'oath_slam', targetType: 'front_lane', effectColor: 'cyan' }),
      monsterAction({ actionId: 'oath-bulwark-interpose', label: 'Interpose', effectKind: 'guard', actionCue: 'interpose', targetType: 'lowest_hp_ally', basePriority: 4, cooldown: 2, effectColor: 'cyan' }),
    ],
  },
  {
    id: 'rift-hexer',
    name: 'Rift Hexer',
    role: 'caster',
    unitType: 'monster',
    baseLevel: 8,
    levelBand: 'mid',
    statBias: { hp: 1.14, atk: 0.8, def: 0.72, spd: 1.04, skill: 1.92, control: 1.35, crit: 1.02 },
    intentCandidates: ['cast', 'control'],
    targetPriority: 'highest_threat',
    boardLane: 'rear',
    actionCue: 'rift_hexer_bolt',
    animationCue: 'monster-cast',
    effectColor: 'violet',
    descriptionKo: '후열에서 높은 SKILL 피해와 약화를 섞는 주술사.',
    actionList: [
      monsterAction({ actionId: 'rift-hexer-spark', label: 'Hex Spark', effectKind: 'basic', actionCue: 'hex_spark', targetType: 'highest_threat_enemy', effectColor: 'violet' }),
      monsterAction({ actionId: 'rift-hexer-bolt', label: 'Rift Hex Bolt', effectKind: 'damage', actionCue: 'hex_bolt', targetType: 'highest_threat_enemy', basePriority: 1, cooldown: 2, effectColor: 'violet' }),
      monsterAction({ actionId: 'rift-hexer-weaken', label: 'Weakening Rune', effectKind: 'control', actionCue: 'weakening_rune', targetType: 'highest_threat_enemy', basePriority: 1, cooldown: 3, effectColor: 'violet' }),
    ],
  },
  {
    id: 'abyss-pyromancer',
    name: 'Abyss Pyromancer',
    role: 'caster',
    unitType: 'monster',
    baseLevel: 13,
    levelBand: 'late',
    statBias: { hp: 1.2, atk: 0.84, def: 0.74, spd: 0.98, skill: 2.15, control: 1.12, crit: 1.12 },
    intentCandidates: ['cast', 'charge'],
    targetPriority: 'highest_threat',
    boardLane: 'rear',
    actionCue: 'abyss_flame',
    animationCue: 'monster-cast',
    effectColor: 'amber',
    descriptionKo: '방어는 약하지만 한 번의 주문 피해가 높은 화염술사.',
    actionList: [
      monsterAction({ actionId: 'abyss-pyromancer-ember', label: 'Abyss Ember', effectKind: 'basic', actionCue: 'abyss_ember', targetType: 'highest_threat_enemy', effectColor: 'amber' }),
      monsterAction({ actionId: 'abyss-pyromancer-flame', label: 'Abyss Flame', effectKind: 'damage', actionCue: 'abyss_flame', targetType: 'highest_threat_enemy', basePriority: 2, cooldown: 2, effectColor: 'amber' }),
    ],
  },
  {
    id: 'storm-oracle',
    name: 'Storm Oracle',
    role: 'caster',
    unitType: 'monster',
    baseLevel: 16,
    levelBand: 'late',
    statBias: { hp: 1.32, atk: 0.88, def: 0.82, spd: 1.1, skill: 2.02, control: 1.38, synergy: 1.1 },
    intentCandidates: ['cast', 'support'],
    targetPriority: 'caster_or_support',
    boardLane: 'rear',
    actionCue: 'storm_oracle_chain',
    animationCue: 'monster-cast',
    effectColor: 'cyan',
    descriptionKo: '후열에서 속도와 약화를 흔드는 폭풍 예언자.',
    actionList: [
      monsterAction({ actionId: 'storm-oracle-jolt', label: 'Static Jolt', effectKind: 'basic', actionCue: 'static_jolt', targetType: 'highest_threat_enemy', effectColor: 'cyan' }),
      monsterAction({ actionId: 'storm-oracle-chain', label: 'Storm Chain', effectKind: 'control', actionCue: 'storm_chain', targetType: 'highest_threat_enemy', basePriority: 2, cooldown: 2, effectColor: 'cyan' }),
    ],
  },
  {
    id: 'fatigue-stalker',
    name: 'Fatigue Stalker',
    role: 'assassin',
    unitType: 'monster',
    baseLevel: 7,
    levelBand: 'mid',
    statBias: { hp: 1.06, atk: 1.54, def: 0.72, spd: 1.68, skill: 1.32, crit: 1.55, control: 0.86 },
    intentCandidates: ['attack', 'charge'],
    targetPriority: 'lowest_hp',
    boardLane: 'flank',
    actionCue: 'fatigue_stalker_backstab',
    animationCue: 'monster-dash',
    effectColor: 'rose',
    descriptionKo: '체력이 낮은 아군을 빠르게 추적한다.',
    actionList: [
      monsterAction({ actionId: 'fatigue-stalker-cut', label: 'Quick Cut', effectKind: 'basic', actionCue: 'quick_cut', targetType: 'lowest_hp_enemy', basePriority: 3, effectColor: 'rose' }),
      monsterAction({ actionId: 'fatigue-stalker-backstab', label: 'Backstab', effectKind: 'damage', actionCue: 'backstab', targetType: 'lowest_hp_enemy', basePriority: 3, cooldown: 2, effectColor: 'rose' }),
    ],
  },
  {
    id: 'night-needle',
    name: 'Night Needle',
    role: 'assassin',
    unitType: 'monster',
    baseLevel: 11,
    levelBand: 'mid',
    statBias: { hp: 1.02, atk: 1.62, def: 0.68, spd: 1.82, skill: 1.42, crit: 1.7, control: 1.02 },
    intentCandidates: ['attack', 'control'],
    targetPriority: 'lowest_hp',
    boardLane: 'flank',
    actionCue: 'night_needle_mark',
    animationCue: 'monster-dash',
    effectColor: 'fuchsia',
    descriptionKo: '표식을 찍은 뒤 낮은 HP 대상을 노리는 고속 암살자.',
    actionList: [
      monsterAction({ actionId: 'night-needle-prick', label: 'Needle Prick', effectKind: 'basic', actionCue: 'needle_prick', targetType: 'lowest_hp_enemy', basePriority: 3, effectColor: 'fuchsia' }),
      monsterAction({ actionId: 'night-needle-mark', label: 'Marked Backstab', effectKind: 'control', actionCue: 'needle_mark', targetType: 'lowest_hp_enemy', basePriority: 3, cooldown: 2, effectColor: 'fuchsia' }),
    ],
  },
  {
    id: 'scarlet-executor',
    name: 'Scarlet Executor',
    role: 'assassin',
    unitType: 'monster',
    baseLevel: 16,
    levelBand: 'late',
    statBias: { hp: 1.18, atk: 1.82, def: 0.78, spd: 1.74, skill: 1.58, crit: 1.82, boss: 0.72 },
    intentCandidates: ['attack', 'charge'],
    targetPriority: 'lowest_hp',
    boardLane: 'flank',
    actionCue: 'scarlet_execute',
    animationCue: 'monster-dash',
    effectColor: 'red',
    descriptionKo: '후반 조합에서 결정타 압박을 담당한다.',
    actionList: [
      monsterAction({ actionId: 'scarlet-executor-slice', label: 'Scarlet Slice', effectKind: 'basic', actionCue: 'scarlet_slice', targetType: 'lowest_hp_enemy', basePriority: 3, effectColor: 'red' }),
      monsterAction({ actionId: 'scarlet-executor-execute', label: 'Execute Marked', effectKind: 'damage', actionCue: 'execute_marked', targetType: 'lowest_hp_enemy', basePriority: 4, cooldown: 2, effectColor: 'red' }),
    ],
  },
  {
    id: 'rift-mender-veteran',
    name: 'Rift Mender Veteran',
    role: 'support',
    unitType: 'monster',
    baseLevel: 8,
    levelBand: 'mid',
    statBias: { hp: 1.5, atk: 0.68, def: 1.02, spd: 1.04, skill: 1.18, support: 1.82, survival: 1.2, synergy: 1.24 },
    intentCandidates: ['support', 'guard'],
    targetPriority: 'boss_support',
    boardLane: 'rear',
    actionCue: 'veteran_mending_pulse',
    animationCue: 'monster-support',
    effectColor: 'emerald',
    descriptionKo: '회복 우선순위를 강제로 만들며 전투를 늘린다.',
    actionList: [
      monsterAction({ actionId: 'rift-mender-veteran-tap', label: 'Mender Tap', effectKind: 'basic', actionCue: 'mender_tap', targetType: 'single_enemy', effectColor: 'emerald' }),
      monsterAction({ actionId: 'rift-mender-veteran-pulse', label: 'Mend Ally', effectKind: 'support', actionCue: 'mend_ally', targetType: 'lowest_hp_ally', basePriority: 2, cooldown: 2, effectColor: 'emerald' }),
      monsterAction({ actionId: 'rift-mender-veteran-shield', label: 'Shield Ally', effectKind: 'guard', actionCue: 'shield_ally', targetType: 'lowest_hp_ally', basePriority: 2, cooldown: 3, effectColor: 'emerald' }),
    ],
  },
  {
    id: 'battle-chanter',
    name: 'Battle Chanter',
    role: 'support',
    unitType: 'monster',
    baseLevel: 12,
    levelBand: 'late',
    statBias: { hp: 1.42, atk: 0.72, def: 0.92, spd: 1.08, skill: 1.24, support: 1.52, survival: 1, synergy: 1.72 },
    intentCandidates: ['support', 'charge'],
    targetPriority: 'boss_support',
    boardLane: 'rear',
    actionCue: 'battle_chanter_cry',
    animationCue: 'monster-support',
    effectColor: 'amber',
    descriptionKo: '아군 공격 흐름을 끌어올려 먼저 처리할 이유를 만든다.',
    actionList: [
      monsterAction({ actionId: 'battle-chanter-tap', label: 'Chanter Tap', effectKind: 'basic', actionCue: 'chanter_tap', targetType: 'single_enemy', effectColor: 'amber' }),
      monsterAction({ actionId: 'battle-chanter-cry', label: 'Battle Cry', effectKind: 'synergy', actionCue: 'battle_cry', targetType: 'all_allies', basePriority: 2, cooldown: 3, effectColor: 'amber' }),
      monsterAction({ actionId: 'battle-chanter-mend', label: 'Rally Mend', effectKind: 'support', actionCue: 'rally_mend', targetType: 'lowest_hp_ally', basePriority: 1, cooldown: 3, effectColor: 'amber' }),
    ],
  },
  {
    id: 'shield-cantor',
    name: 'Shield Cantor',
    role: 'support',
    unitType: 'monster',
    baseLevel: 15,
    levelBand: 'late',
    statBias: { hp: 1.62, atk: 0.66, def: 1.08, spd: 0.98, skill: 1.22, support: 1.78, survival: 1.46, synergy: 1.34 },
    intentCandidates: ['support', 'guard'],
    targetPriority: 'boss_support',
    boardLane: 'rear',
    actionCue: 'shield_cantor_hymn',
    animationCue: 'monster-support',
    effectColor: 'teal',
    descriptionKo: '보스와 탱커에게 보호막을 겹쳐 전선을 굳힌다.',
    actionList: [
      monsterAction({ actionId: 'shield-cantor-note', label: 'Shield Note', effectKind: 'basic', actionCue: 'shield_note', targetType: 'single_enemy', effectColor: 'teal' }),
      monsterAction({ actionId: 'shield-cantor-hymn', label: 'Barrier Hymn', effectKind: 'guard', actionCue: 'barrier_hymn', targetType: 'lowest_hp_ally', basePriority: 3, cooldown: 2, effectColor: 'teal' }),
    ],
  },
  {
    id: 'memory-disruptor',
    name: 'Memory Disruptor',
    role: 'controller',
    unitType: 'monster',
    baseLevel: 8,
    levelBand: 'mid',
    statBias: { hp: 1.34, atk: 0.82, def: 0.9, spd: 1.14, skill: 1.42, control: 1.92, synergy: 0.95 },
    intentCandidates: ['control', 'cast'],
    targetPriority: 'highest_threat',
    boardLane: 'rear',
    actionCue: 'memory_disrupt',
    animationCue: 'monster-control',
    effectColor: 'cyan',
    descriptionKo: '기억을 흐려 방어와 속도를 동시에 낮춘다.',
    actionList: [
      monsterAction({ actionId: 'memory-disruptor-jolt', label: 'Memory Jolt', effectKind: 'basic', actionCue: 'memory_jolt', targetType: 'highest_threat_enemy', effectColor: 'cyan' }),
      monsterAction({ actionId: 'memory-disruptor-field', label: 'Disrupt Memory', effectKind: 'control', actionCue: 'memory_disrupt', targetType: 'highest_threat_enemy', basePriority: 2, cooldown: 2, effectColor: 'cyan' }),
    ],
  },
  {
    id: 'weakness-registrar',
    name: 'Weakness Registrar',
    role: 'controller',
    unitType: 'monster',
    baseLevel: 12,
    levelBand: 'late',
    statBias: { hp: 1.38, atk: 0.78, def: 0.94, spd: 1.08, skill: 1.38, control: 2.08, support: 0.88 },
    intentCandidates: ['control', 'support'],
    targetPriority: 'highest_threat',
    boardLane: 'rear',
    actionCue: 'weakness_register',
    animationCue: 'monster-control',
    effectColor: 'violet',
    descriptionKo: '약점을 기록해 아군 화력이 박히는 창을 만든다.',
    actionList: [
      monsterAction({ actionId: 'weakness-registrar-ink', label: 'Ink Needle', effectKind: 'basic', actionCue: 'ink_needle', targetType: 'highest_threat_enemy', effectColor: 'violet' }),
      monsterAction({ actionId: 'weakness-registrar-mark', label: 'Weakness Register', effectKind: 'control', actionCue: 'weakness_register', targetType: 'highest_threat_enemy', basePriority: 2, cooldown: 2, effectColor: 'violet' }),
    ],
  },
  {
    id: 'suppression-warden',
    name: 'Suppression Warden',
    role: 'controller',
    unitType: 'monster',
    baseLevel: 16,
    levelBand: 'late',
    statBias: { hp: 1.56, atk: 0.86, def: 1.02, spd: 1.02, skill: 1.48, control: 2.18, survival: 1.1 },
    intentCandidates: ['control', 'guard'],
    targetPriority: 'caster_or_support',
    boardLane: 'rear',
    actionCue: 'suppression_field',
    animationCue: 'monster-control',
    effectColor: 'blue',
    descriptionKo: '전체 억압에 가까운 컨트롤 압박을 담당한다.',
    actionList: [
      monsterAction({ actionId: 'suppression-warden-jolt', label: 'Warden Jolt', effectKind: 'basic', actionCue: 'warden_jolt', targetType: 'highest_threat_enemy', effectColor: 'blue' }),
      monsterAction({ actionId: 'suppression-warden-field', label: 'Suppression Field', effectKind: 'control', actionCue: 'suppression_field', targetType: 'all_enemies', basePriority: 2, cooldown: 3, effectColor: 'blue' }),
    ],
  },
  {
    id: 'rift-shard',
    name: 'Rift Shard',
    role: 'minion',
    unitType: 'minion',
    baseLevel: 5,
    levelBand: 'early',
    statBias: { hp: 0.96, atk: 0.9, def: 0.72, spd: 1.02, skill: 0.88, control: 0.72, synergy: 0.82 },
    intentCandidates: ['attack', 'control'],
    targetPriority: 'random_pressure',
    isMinion: true,
    boardLane: 'flank',
    actionCue: 'rift_shard_chip',
    animationCue: 'monster-minion',
    effectColor: 'zinc',
    descriptionKo: '약하지만 표식과 잔피해로 전투를 귀찮게 만든다.',
    actionList: [
      monsterAction({ actionId: 'rift-shard-chip', label: 'Shard Chip', effectKind: 'basic', actionCue: 'shard_chip', targetType: 'single_enemy', effectColor: 'zinc' }),
      monsterAction({ actionId: 'rift-shard-splinter', label: 'Splinter Mark', effectKind: 'control', actionCue: 'splinter_mark', targetType: 'lowest_hp_enemy', basePriority: 1, cooldown: 3, effectColor: 'zinc' }),
    ],
  },
  {
    id: 'shield-minion',
    name: 'Shield Minion',
    role: 'minion',
    unitType: 'minion',
    baseLevel: 8,
    levelBand: 'mid',
    statBias: { hp: 1.24, atk: 0.72, def: 1.08, spd: 0.82, skill: 0.7, survival: 1.18, support: 0.74 },
    intentCandidates: ['guard', 'support'],
    targetPriority: 'boss_support',
    isMinion: true,
    boardLane: 'front',
    actionCue: 'shield_minion_cover',
    animationCue: 'monster-guard',
    effectColor: 'slate',
    descriptionKo: '보스 앞을 막는 방패 하수인.',
    actionList: [
      monsterAction({ actionId: 'shield-minion-bump', label: 'Shield Bump', effectKind: 'basic', actionCue: 'shield_bump', targetType: 'front_lane', effectColor: 'slate' }),
      monsterAction({ actionId: 'shield-minion-cover', label: 'Cover Boss', effectKind: 'guard', actionCue: 'cover_boss', targetType: 'lowest_hp_ally', basePriority: 2, cooldown: 2, effectColor: 'slate' }),
    ],
  },
  {
    id: 'curse-token',
    name: 'Curse Token',
    role: 'minion',
    unitType: 'minion',
    baseLevel: 9,
    levelBand: 'mid',
    statBias: { hp: 0.92, atk: 0.76, def: 0.68, spd: 1.16, skill: 1.04, control: 1.22, synergy: 0.9 },
    intentCandidates: ['control', 'attack'],
    targetPriority: 'lowest_hp',
    isMinion: true,
    boardLane: 'flank',
    actionCue: 'curse_token_brand',
    animationCue: 'monster-control',
    effectColor: 'violet',
    descriptionKo: '방치하면 표식과 둔화를 계속 얹는 저주 토큰.',
    actionList: [
      monsterAction({ actionId: 'curse-token-prick', label: 'Curse Prick', effectKind: 'basic', actionCue: 'curse_prick', targetType: 'lowest_hp_enemy', effectColor: 'violet' }),
      monsterAction({ actionId: 'curse-token-brand', label: 'Curse Brand', effectKind: 'control', actionCue: 'curse_brand', targetType: 'lowest_hp_enemy', basePriority: 1, cooldown: 2, effectColor: 'violet' }),
    ],
  },
  {
    id: 'command-imp',
    name: 'Command Imp',
    role: 'minion',
    unitType: 'minion',
    baseLevel: 11,
    levelBand: 'late',
    statBias: { hp: 1.02, atk: 0.72, def: 0.7, spd: 1.2, skill: 0.9, support: 1.02, synergy: 1.35 },
    intentCandidates: ['support', 'attack'],
    targetPriority: 'boss_support',
    isMinion: true,
    boardLane: 'rear',
    actionCue: 'command_imp_squeal',
    animationCue: 'monster-support',
    effectColor: 'amber',
    descriptionKo: '하수인이지만 아군 공격 흐름을 끌어올린다.',
    actionList: [
      monsterAction({ actionId: 'command-imp-scratch', label: 'Command Scratch', effectKind: 'basic', actionCue: 'command_scratch', targetType: 'single_enemy', effectColor: 'amber' }),
      monsterAction({ actionId: 'command-imp-squeal', label: 'Shrill Command', effectKind: 'synergy', actionCue: 'shrill_command', targetType: 'all_allies', basePriority: 1, cooldown: 3, effectColor: 'amber' }),
    ],
  },
  {
    id: 'abyss-spawn',
    name: 'Abyss Spawn',
    role: 'minion',
    unitType: 'minion',
    baseLevel: 13,
    levelBand: 'late',
    statBias: { hp: 1.18, atk: 1.06, def: 0.82, spd: 1.08, skill: 1.1, control: 0.98, survival: 0.9 },
    intentCandidates: ['attack', 'charge'],
    targetPriority: 'random_pressure',
    isMinion: true,
    boardLane: 'flank',
    actionCue: 'abyss_spawn_lunge',
    animationCue: 'monster-minion',
    effectColor: 'rose',
    descriptionKo: '보스 옆에서 잔딜이 아닌 실제 압박을 주는 소환수.',
    actionList: [
      monsterAction({ actionId: 'abyss-spawn-claw', label: 'Spawn Claw', effectKind: 'basic', actionCue: 'spawn_claw', targetType: 'single_enemy', effectColor: 'rose' }),
      monsterAction({ actionId: 'abyss-spawn-lunge', label: 'Abyss Lunge', effectKind: 'damage', actionCue: 'abyss_lunge', targetType: 'lowest_hp_enemy', basePriority: 1, cooldown: 2, effectColor: 'rose' }),
    ],
  },
  {
    id: 'rift-commander',
    name: 'Rift Commander',
    role: 'boss',
    unitType: 'boss',
    baseLevel: 14,
    levelBand: 'boss',
    statBias: { hp: 2.55, atk: 1.52, def: 1.34, spd: 0.98, skill: 1.68, control: 1.18, boss: 2.12, survival: 1.58, synergy: 1.36 },
    intentCandidates: ['attack', 'support', 'summon'],
    targetPriority: 'highest_threat',
    isBoss: true,
    boardLane: 'boss',
    actionCue: 'rift_commander_order',
    animationCue: 'monster-boss',
    effectColor: 'crimson',
    descriptionKo: '하수인과 전열을 지휘하는 균열 지휘관.',
    actionList: [
      monsterAction({ actionId: 'rift-commander-slam', label: 'Command Slam', effectKind: 'damage', actionCue: 'command_slam', targetType: 'highest_threat_enemy', basePriority: 1, cooldown: 2, effectColor: 'crimson' }),
      monsterAction({ actionId: 'rift-commander-order', label: 'Command Aura', effectKind: 'synergy', actionCue: 'command_aura', targetType: 'all_allies', basePriority: 2, cooldown: 3, effectColor: 'crimson' }),
    ],
  },
  {
    id: 'oblivion-watcher',
    name: 'Oblivion Watcher',
    role: 'boss',
    unitType: 'boss',
    baseLevel: 16,
    levelBand: 'boss',
    statBias: { hp: 2.42, atk: 1.34, def: 1.25, spd: 1, skill: 1.88, control: 1.8, boss: 2.18, survival: 1.46 },
    intentCandidates: ['control', 'cast'],
    targetPriority: 'highest_threat',
    isBoss: true,
    boardLane: 'boss',
    actionCue: 'oblivion_watcher_gaze',
    animationCue: 'monster-boss',
    effectColor: 'violet',
    descriptionKo: '망각의 시선으로 표식과 약화를 누적시키는 보스.',
    actionList: [
      monsterAction({ actionId: 'oblivion-watcher-gaze', label: 'Oblivion Gaze', effectKind: 'control', actionCue: 'oblivion_gaze', targetType: 'all_enemies', basePriority: 2, cooldown: 3, effectColor: 'violet' }),
      monsterAction({ actionId: 'oblivion-watcher-strike', label: 'Memory Collapse', effectKind: 'damage', actionCue: 'memory_collapse', targetType: 'highest_threat_enemy', basePriority: 1, cooldown: 2, effectColor: 'violet' }),
    ],
  },
  {
    id: 'iron-wall-lord',
    name: 'Iron Wall Lord',
    role: 'boss',
    unitType: 'boss',
    baseLevel: 18,
    levelBand: 'boss',
    statBias: { hp: 2.9, atk: 1.34, def: 1.82, spd: 0.72, skill: 1.42, control: 1.02, boss: 2.05, survival: 2.08, support: 1.22 },
    intentCandidates: ['guard', 'attack'],
    targetPriority: 'frontline',
    isBoss: true,
    boardLane: 'boss',
    actionCue: 'iron_wall_lord_bastion',
    animationCue: 'monster-boss',
    effectColor: 'slate',
    descriptionKo: '전투를 길게 끌고 가는 방어형 보스.',
    actionList: [
      monsterAction({ actionId: 'iron-wall-lord-slam', label: 'Bastion Slam', effectKind: 'damage', actionCue: 'bastion_slam', targetType: 'front_lane', basePriority: 1, cooldown: 2, effectColor: 'slate' }),
      monsterAction({ actionId: 'iron-wall-lord-bastion', label: 'Iron Bastion', effectKind: 'guard', actionCue: 'iron_bastion', targetType: 'lowest_hp_ally', basePriority: 4, cooldown: 2, effectColor: 'slate' }),
    ],
  },
  {
    id: 'abyss-devourer',
    name: 'Abyss Devourer',
    role: 'boss',
    unitType: 'boss',
    baseLevel: 20,
    levelBand: 'boss',
    statBias: { hp: 2.72, atk: 1.72, def: 1.28, spd: 0.88, skill: 2.02, control: 1.26, boss: 2.42, survival: 1.72 },
    intentCandidates: ['attack', 'charge', 'summon'],
    targetPriority: 'lowest_hp',
    isBoss: true,
    boardLane: 'boss',
    actionCue: 'abyss_devourer_phase',
    animationCue: 'monster-boss',
    effectColor: 'rose',
    descriptionKo: '낮은 HP 대상을 찢는 공격형 보스.',
    actionList: [
      monsterAction({ actionId: 'abyss-devourer-bite', label: 'Devouring Bite', effectKind: 'damage', actionCue: 'devouring_bite', targetType: 'lowest_hp_enemy', basePriority: 2, cooldown: 2, effectColor: 'rose' }),
      monsterAction({ actionId: 'abyss-devourer-phase', label: 'Phase Strike', effectKind: 'bossing', actionCue: 'phase_strike', targetType: 'highest_threat_enemy', basePriority: 2, cooldown: 3, effectColor: 'rose' }),
    ],
  },
  {
    id: 'memory-warden-boss',
    name: 'Memory Warden',
    role: 'boss',
    unitType: 'boss',
    baseLevel: 19,
    levelBand: 'boss',
    statBias: { hp: 2.62, atk: 1.42, def: 1.38, spd: 0.94, skill: 1.78, control: 1.95, boss: 2.24, survival: 1.7, synergy: 1.08 },
    intentCandidates: ['control', 'support', 'summon'],
    targetPriority: 'highest_threat',
    isBoss: true,
    boardLane: 'boss',
    actionCue: 'memory_warden_decree',
    animationCue: 'monster-boss',
    effectColor: 'blue',
    descriptionKo: '제어와 보호 하수인을 함께 운용하는 기록 보스.',
    actionList: [
      monsterAction({ actionId: 'memory-warden-decree', label: 'Warden Decree', effectKind: 'control', actionCue: 'warden_decree', targetType: 'all_enemies', basePriority: 2, cooldown: 3, effectColor: 'blue' }),
      monsterAction({ actionId: 'memory-warden-smite', label: 'Archive Smite', effectKind: 'damage', actionCue: 'archive_smite', targetType: 'highest_threat_enemy', basePriority: 1, cooldown: 2, effectColor: 'blue' }),
    ],
  },
]

export const getMockDirectBattleMonster = (id: string): DirectBattleMonsterDefinition | undefined =>
  MOCK_DIRECT_BATTLE_MONSTERS.find(monster => monster.id === id)

export const DIRECT_BATTLE_MOCK_PARTIES: DirectBattleMockPartyDefinition[] = [
  {
    encounterKey: 'small_bruiser',
    label: 'Small Bruiser',
    difficultyTag: 'easy',
    slots: [{ monsterId: 'mock-bruiser' }],
  },
  {
    encounterKey: 'small_duo',
    label: 'Small Duo',
    difficultyTag: 'easy',
    slots: [{ monsterId: 'mock-bruiser' }, { monsterId: 'mock-minion', levelOffset: -1 }],
  },
  {
    encounterKey: 'caster_pair',
    label: 'Caster Pair',
    difficultyTag: 'normal',
    slots: [{ monsterId: 'mock-bruiser' }, { monsterId: 'mock-caster' }],
  },
  {
    encounterKey: 'tank_assassin',
    label: 'Tank Assassin',
    difficultyTag: 'hard',
    slots: [{ monsterId: 'mock-tank' }, { monsterId: 'mock-assassin' }],
  },
  {
    encounterKey: 'control_support',
    label: 'Control Support',
    difficultyTag: 'hard',
    slots: [{ monsterId: 'mock-controller' }, { monsterId: 'mock-support' }],
  },
  {
    encounterKey: 'boss_minion',
    label: 'Boss Minion',
    difficultyTag: 'boss',
    slots: [{ monsterId: 'mock-boss' }, { monsterId: 'mock-minion', levelOffset: 1 }],
  },
  {
    encounterKey: 'boss_support',
    label: 'Boss Support',
    difficultyTag: 'boss',
    slots: [{ monsterId: 'mock-boss' }, { monsterId: 'mock-support' }, { monsterId: 'mock-minion' }],
  },
]

const ENCOUNTER_ALIASES: Record<string, string> = {
  basic: 'small_duo',
  control: 'control_support',
  boss: 'boss_support',
  'mock-small-gate': 'small_duo',
  'mock-control-pair': 'control_support',
  'mock-elite-formation': 'tank_assassin',
  'mock-boss-minions': 'boss_support',
}

export const getDirectBattleMockParty = (encounterKey: string): DirectBattleMockPartyDefinition => {
  const normalizedKey = ENCOUNTER_ALIASES[encounterKey] ?? encounterKey
  return DIRECT_BATTLE_MOCK_PARTIES.find(party => party.encounterKey === normalizedKey) ?? DIRECT_BATTLE_MOCK_PARTIES[0]
}

export const buildMockMonsterEncounterDefinitions = (encounterKey: string): DirectBattleMonsterDefinition[] =>
  getDirectBattleMockParty(encounterKey).slots
    .map(slot => getMockDirectBattleMonster(slot.monsterId))
    .filter((monster): monster is DirectBattleMonsterDefinition => Boolean(monster))
