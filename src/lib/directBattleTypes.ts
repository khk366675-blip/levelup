import type { ShadowBoardLane, ShadowEffectKind, ShadowPassiveEffectKind } from './shadowSkills'

export type BattleUnitType = 'hunter' | 'shadow' | 'monster' | 'boss' | 'minion'
export type BattleTeam = 'player' | 'enemy'
export type BattleBoardLane = ShadowBoardLane | 'boss'
export type BattleActionType = 'basic' | 'skill' | 'guard' | 'support' | 'wait' | 'reaction' | 'passive'
export type BattleTargetType =
  | 'self'
  | 'single_ally'
  | 'all_allies'
  | 'single_enemy'
  | 'all_enemies'
  | 'lowest_hp_ally'
  | 'lowest_hp_enemy'
  | 'highest_threat_enemy'
  | 'boss'
  | 'minion'
  | 'front_lane'
  | 'rear_lane'
export type BattleActionTiming =
  | 'player_selection'
  | 'round_start'
  | 'before_action'
  | 'normal_action'
  | 'after_action'
  | 'reaction'
  | 'passive_trigger'
  | 'round_end'
export type BattleStatusType =
  | 'attackUp'
  | 'attackDown'
  | 'defenseUp'
  | 'defenseDown'
  | 'speedUp'
  | 'speedDown'
  | 'guard'
  | 'protect'
  | 'mark'
  | 'weakness'
  | 'suppression'
  | 'cooldownReduction'
  | 'healOverTime'
  | 'shield'

export const DIRECT_BATTLE_STATUS_LABELS_KO: Record<BattleStatusType, string> = {
  attackUp: '공격 강화',
  attackDown: '공격 약화',
  defenseUp: '방어 강화',
  defenseDown: '방어 약화',
  speedUp: '속도 강화',
  speedDown: '속도 약화',
  guard: '방어 태세',
  protect: '보호',
  mark: '표식',
  weakness: '약점 노출',
  suppression: '억압',
  cooldownReduction: '쿨다운 단축',
  healOverTime: '지속 회복',
  shield: '보호막',
}

export const DIRECT_BATTLE_STATUS_DESCRIPTIONS_KO: Record<BattleStatusType, string> = {
  attackUp: '이번 라운드 공격 피해가 증가합니다.',
  attackDown: '이번 라운드 공격 피해가 감소합니다.',
  defenseUp: '이번 라운드 받는 피해가 감소합니다.',
  defenseDown: '이번 라운드 받는 피해가 증가합니다.',
  speedUp: '행동 속도와 지원 흐름이 좋아집니다.',
  speedDown: '행동 속도와 대응력이 낮아집니다.',
  guard: '이번 라운드 받는 피해를 줄입니다.',
  protect: '보호자가 피해 일부를 대신 받아냅니다.',
  mark: '받는 피해가 증가하는 표식입니다.',
  weakness: '약점이 드러나 받는 피해가 증가합니다.',
  suppression: '공격과 스킬 압박이 약해집니다.',
  cooldownReduction: '스킬 재사용 흐름을 앞당깁니다.',
  healOverTime: '라운드 흐름에 따라 HP를 회복합니다.',
  shield: '보호막이 피해 일부를 흡수합니다.',
}

export interface BattleStats {
  maxHp: number
  currentHp: number
  atk: number
  def: number
  spd: number
  skillPower: number
  crit: number
  controlPower: number
  supportPower: number
  survivalPower: number
  bossPower: number
  synergyPower: number
}

export type BattleAdvancedStats = Pick<
  BattleStats,
  'crit' | 'controlPower' | 'supportPower' | 'survivalPower' | 'bossPower' | 'synergyPower'
>

export interface BattleActionDefinition {
  actionId: string
  label: string
  description?: string
  actionType: BattleActionType
  targetType: BattleTargetType
  effectKind: ShadowEffectKind | ShadowPassiveEffectKind | 'basic' | 'wait'
  basePriority: number
  cooldown?: number
  sourceSkillId?: string
  sourcePassiveId?: string
  actionCue: string
  animationCue?: string
  effectColor?: string
  effects?: any[]
  timing?: string
  masteryMultiplier?: number // 스킬 숙련도 배율 (예: 1.15)
  selectedUpgradeId?: string // 선택된 Lv.5 강화 ID
  isCapstoneUnlocked?: boolean // Lv.10 capstone 각성 활성화 여부
  critRateBonus?: number // 크리티컬 확률 보정
  defenseIgnore?: number // 적 방어 무시 비율
  bossDamageBonus?: number // 보스 대상 추가 피해
  statusValueBonus?: number // 디버프/버프 가치 추가 강화
  telegraphDamageReduction?: number // 보스 예고 피감 보너스
}

export interface BattleStatusEffect {
  statusId: string
  definitionId: string
  name: string
  type: BattleStatusType
  sourceUnitId?: string
  targetUnitId: string
  durationRounds: number
  stackCount: number
  maxStacks: number
  effectValue: number
  timing: BattleActionTiming
}

export interface BattleUnit {
  unitId: string
  sourceId: string
  unitType: BattleUnitType
  displayName: string
  role: string
  team: BattleTeam
  level: number
  stats: BattleStats
  statusEffects: BattleStatusEffect[]
  cooldowns: Record<string, number>
  actionList: BattleActionDefinition[]
  passiveList: BattleActionDefinition[]
  actionPriority: number
  boardLane: BattleBoardLane
  actionCue: string
  animationCue?: string
  effectColor?: string
  metadata: {
    source: 'hunter' | 'shadow_profile' | 'mock_monster'
    rarity?: string
    innateGrade?: string
    definitionId?: string
    profileCombatPower?: number
    tags?: string[]
    hiddenSafe?: boolean
  }
  telegraph?: DirectBattleTelegraph
  monsterPatternState?: {
    patternId: string
    stepIndex: number
    cycleIndex?: number
    cooldowns?: Record<string, number>
  }
}

export interface BattleUnitBuildResult {
  unit: BattleUnit
  warnings: string[]
}

export type DirectBattleWinner = BattleTeam | 'none'
export type DirectBattleStatus = 'ready' | 'in_progress' | 'finished'

export interface BattleTargetRef {
  unitId: string
  team: BattleTeam
}

export interface DirectBattleHpSnapshot {
  currentHp: number
  maxHp: number
}

export interface DirectBattleStatusSnapshot {
  statusId: string
  type: BattleStatusType
  sourceUnitId?: string
  durationRounds: number
  stackCount: number
  effectValue: number
}

export interface DirectBattleActionSelection {
  actorUnitId: string
  actionId?: string
  targetIds?: string[]
}

export interface QueuedBattleAction {
  queueId: string
  actorUnitId: string
  actorType: BattleUnitType
  team: BattleTeam
  actionId: string
  actionType: BattleActionType
  targetIds: string[]
  basePriority: number
  speedPriority: number
  skillPriority: number
  finalPriority: number
  timing: BattleActionTiming
  isReaction: boolean
  sourceSkillId?: string
  sourcePassiveId?: string
  effectKind: BattleActionDefinition['effectKind']
  actionCue: string
  animationCue?: string
  effectColor?: string
}

export interface DirectBattleLogEntry {
  round: number
  actorUnitId?: string
  targetUnitIds?: string[]
  actionId?: string
  timing?: BattleActionTiming
  message: string
  eventType: 'queue' | 'action' | 'damage' | 'heal' | 'status' | 'reaction' | 'fizzle' | 'round' | 'result'
  value?: number
  actionCue?: string
  animationCue?: string
  effectColor?: string
  effectKind?: BattleActionDefinition['effectKind']
  hpBeforeByUnitId?: Record<string, DirectBattleHpSnapshot>
  hpAfterByUnitId?: Record<string, DirectBattleHpSnapshot>
  statusBeforeByUnitId?: Record<string, DirectBattleStatusSnapshot[]>
  statusAfterByUnitId?: Record<string, DirectBattleStatusSnapshot[]>
}

export interface DirectBattleState {
  battleId: string
  round: number
  units: BattleUnit[]
  actionQueue: QueuedBattleAction[]
  logs: DirectBattleLogEntry[]
  status: DirectBattleStatus
  winner: DirectBattleWinner
  isFinished: boolean
  maxRounds: number
}

export interface DirectBattleRoundResult {
  state: DirectBattleState
  queue: QueuedBattleAction[]
  logs: DirectBattleLogEntry[]
}

export interface DirectBattleResult {
  state: DirectBattleState
  winner: DirectBattleWinner
  roundsSimulated: number
  logs: DirectBattleLogEntry[]
  isFinished: boolean
  reason: 'winner' | 'max_rounds' | 'no_units' | 'safety_abort'
}

export type TelegraphSeverity = 'low' | 'medium' | 'high' | 'lethal'

export interface DirectBattleTelegraph {
  actionId: string
  actionName: string
  actionType: string
  telegraphName: string
  telegraphText: string
  severity: TelegraphSeverity
  targetRule?: string
  recommendedDefense?: string
  windupTurns?: number
}
