import { DIRECT_BATTLE_STATUS_LABELS_KO } from './directBattleTypes'
import type {
  BattleActionDefinition,
  BattleStatusEffect,
  BattleTeam,
  BattleUnit,
  DirectBattleActionSelection,
  DirectBattleLogEntry,
  DirectBattleResult,
  DirectBattleRoundResult,
  DirectBattleState,
  DirectBattleWinner,
  QueuedBattleAction,
} from './directBattleTypes'

export interface CreateDirectBattleStateOptions {
  battleId?: string
  maxRounds?: number
}

export type DirectBattlePlayerSelector = (state: DirectBattleState) => DirectBattleActionSelection[]

const TEAM_ORDER: Record<BattleTeam, number> = {
  player: 1,
  enemy: 0,
}

const TIMING_ORDER: Record<QueuedBattleAction['timing'], number> = {
  round_start: 90,
  before_action: 80,
  normal_action: 50,
  reaction: 40,
  after_action: 30,
  passive_trigger: 20,
  round_end: 10,
  player_selection: 0,
}

const cloneStatus = (status: BattleStatusEffect): BattleStatusEffect => ({ ...status })

const cloneUnit = (unit: BattleUnit): BattleUnit => ({
  ...unit,
  stats: { ...unit.stats },
  statusEffects: unit.statusEffects.map(cloneStatus),
  cooldowns: { ...unit.cooldowns },
  actionList: unit.actionList.map(action => ({ ...action })),
  passiveList: unit.passiveList.map(action => ({ ...action })),
  metadata: { ...unit.metadata, tags: unit.metadata.tags ? [...unit.metadata.tags] : undefined },
})

const clamp = (value: number, min = 0, max = 99999): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))

const round = (value: number): number =>
  Math.round(clamp(value))

const isAlive = (unit: BattleUnit): boolean =>
  unit.stats.currentHp > 0

const livingUnits = (state: DirectBattleState, team?: BattleTeam): BattleUnit[] =>
  state.units.filter(unit => isAlive(unit) && (!team || unit.team === team))

const getOpposingTeam = (team: BattleTeam): BattleTeam =>
  team === 'player' ? 'enemy' : 'player'

const addLog = (state: DirectBattleState, entry: Omit<DirectBattleLogEntry, 'round'>) => {
  state.logs.push({ round: state.round, ...entry })
}

const uniqueUnitIds = (unitIds: Array<string | undefined>): string[] =>
  [...new Set(unitIds.filter((unitId): unitId is string => Boolean(unitId)))]

const hpSnapshot = (unit: BattleUnit) => ({
  currentHp: round(unit.stats.currentHp),
  maxHp: round(unit.stats.maxHp),
})

const statusSnapshot = (unit: BattleUnit) =>
  unit.statusEffects.map(status => ({
    statusId: status.statusId,
    type: status.type,
    sourceUnitId: status.sourceUnitId,
    durationRounds: status.durationRounds,
    stackCount: status.stackCount,
    effectValue: status.effectValue,
  }))

const hpSnapshotsFor = (state: DirectBattleState, unitIds: string[]) =>
  Object.fromEntries(
    unitIds
      .map(unitId => findUnit(state, unitId))
      .filter((unit): unit is BattleUnit => Boolean(unit))
      .map(unit => [unit.unitId, hpSnapshot(unit)]),
  )

const statusSnapshotsFor = (state: DirectBattleState, unitIds: string[]) =>
  Object.fromEntries(
    unitIds
      .map(unitId => findUnit(state, unitId))
      .filter((unit): unit is BattleUnit => Boolean(unit))
      .map(unit => [unit.unitId, statusSnapshot(unit)]),
  )

const hasStatus = (unit: BattleUnit, type: BattleStatusEffect['type']): boolean =>
  unit.statusEffects.some(status => status.type === type && status.durationRounds > 0)

const statusValue = (unit: BattleUnit, type: BattleStatusEffect['type']): number =>
  unit.statusEffects
    .filter(status => status.type === type && status.durationRounds > 0)
    .reduce((max, status) => Math.max(max, status.effectValue), 0)

const addStatus = (
  target: BattleUnit,
  params: {
    type: BattleStatusEffect['type']
    name?: string
    sourceUnitId?: string
    durationRounds?: number
    effectValue?: number
    maxStacks?: number
  },
) => {
  const existing = target.statusEffects.find(status => status.type === params.type && status.sourceUnitId === params.sourceUnitId)
  if (existing) {
    existing.durationRounds = Math.max(existing.durationRounds, params.durationRounds ?? 1)
    existing.stackCount = Math.min(existing.maxStacks, existing.stackCount + 1)
    existing.effectValue = Math.max(existing.effectValue, params.effectValue ?? existing.effectValue)
    return
  }

  target.statusEffects.push({
    statusId: `${target.unitId}:${params.type}:${target.statusEffects.length + 1}`,
    definitionId: params.type,
    name: params.name ?? DIRECT_BATTLE_STATUS_LABELS_KO[params.type] ?? params.type,
    type: params.type,
    sourceUnitId: params.sourceUnitId,
    targetUnitId: target.unitId,
    durationRounds: params.durationRounds ?? 1,
    stackCount: 1,
    maxStacks: params.maxStacks ?? 1,
    effectValue: params.effectValue ?? 0,
    timing: 'normal_action',
  })
}

const tickRoundStart = (state: DirectBattleState) => {
  for (const unit of state.units) {
    for (const [actionId, remaining] of Object.entries(unit.cooldowns)) {
      unit.cooldowns[actionId] = Math.max(0, remaining - 1)
    }
  }
}

const tickRoundEnd = (state: DirectBattleState) => {
  for (const unit of state.units) {
    unit.statusEffects = unit.statusEffects
      .map(status => ({ ...status, durationRounds: status.durationRounds - 1 }))
      .filter(status => status.durationRounds > 0)
  }
}

const findUnit = (state: DirectBattleState, unitId: string): BattleUnit | undefined =>
  state.units.find(unit => unit.unitId === unitId)

const lowestHp = (units: BattleUnit[]): BattleUnit | undefined =>
  [...units].sort((a, b) => (a.stats.currentHp / a.stats.maxHp) - (b.stats.currentHp / b.stats.maxHp))[0]

const highestThreat = (units: BattleUnit[]): BattleUnit | undefined =>
  [...units].sort((a, b) => (b.stats.atk + b.stats.skillPower + b.stats.spd * 0.4) - (a.stats.atk + a.stats.skillPower + a.stats.spd * 0.4))[0]

const firstAlive = (units: BattleUnit[]): BattleUnit | undefined =>
  units.find(isAlive)

const stableIndex = (seed: string, length: number): number => {
  if (length <= 0) return 0
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return hash % length
}

const stablePick = <T,>(items: T[], seed: string): T | undefined =>
  items[stableIndex(seed, items.length)]

const lowestDefense = (units: BattleUnit[]): BattleUnit | undefined =>
  [...units].sort((a, b) => a.stats.def - b.stats.def || a.unitId.localeCompare(b.unitId))[0]

const highestSupportOrControl = (units: BattleUnit[]): BattleUnit | undefined =>
  [...units].sort((a, b) =>
    (b.stats.supportPower + b.stats.controlPower + b.stats.skillPower * 0.35) -
    (a.stats.supportPower + a.stats.controlPower + a.stats.skillPower * 0.35) ||
    a.unitId.localeCompare(b.unitId),
  )[0]

const highestHp = (units: BattleUnit[]): BattleUnit | undefined =>
  [...units].sort((a, b) => b.stats.currentHp - a.stats.currentHp || a.unitId.localeCompare(b.unitId))[0]

const targetPriorityOf = (unit: BattleUnit): string | undefined =>
  unit.metadata.tags?.find(tag =>
    tag === 'frontline' ||
    tag === 'hunter' ||
    tag === 'lowest_hp' ||
    tag === 'highest_threat' ||
    tag === 'boss_support' ||
    tag === 'caster_or_support' ||
    tag === 'random_pressure',
  )

const chooseEnemyPreferredTarget = (
  state: DirectBattleState,
  actor: BattleUnit,
  action: BattleActionDefinition,
): string[] => {
  if (actor.team !== 'enemy') return []
  if (isAllyTargetAction(action) || action.targetType === 'all_allies' || action.targetType === 'self') return []
  if (action.targetType === 'all_enemies') return []
  if (!isHostileEffect(action)) return []

  const candidates = livingUnits(state, 'player')
  if (candidates.length === 0) return []

  const hunter = candidates.find(unit => unit.unitType === 'hunter')
  const shadows = candidates.filter(unit => unit.unitType === 'shadow')
  const front = candidates.filter(unit => unit.boardLane === 'front')
  const rear = candidates.filter(unit => unit.boardLane === 'rear')
  const role = actor.role
  const priority = targetPriorityOf(actor)
  const seed = `${state.battleId}:r${state.round}:${actor.unitId}:${action.actionId}`
  let target: BattleUnit | undefined

  if (role === 'bruiser') {
    target = highestHp(front.length > 0 ? front : candidates) ?? stablePick(candidates, seed)
  } else if (role === 'tank') {
    target = highestThreat(front.length > 0 ? front : candidates) ?? stablePick(candidates, seed)
  } else if (role === 'caster') {
    target = lowestDefense(candidates) ?? highestSupportOrControl(candidates)
  } else if (role === 'assassin') {
    target = lowestHp([...rear, ...shadows, ...candidates]) ?? stablePick(candidates, seed)
  } else if (role === 'controller') {
    target = highestSupportOrControl(shadows.length > 0 ? shadows : candidates) ?? stablePick(candidates, seed)
  } else if (role === 'support') {
    target = stablePick([...shadows, ...candidates], seed)
  } else if (role === 'minion') {
    target = stablePick(candidates, seed)
  } else if (role === 'boss') {
    const mode = stableIndex(seed, 4)
    target =
      mode === 0 ? hunter :
        mode === 1 ? lowestHp(candidates) :
          mode === 2 ? highestThreat(candidates) :
            stablePick(candidates, seed)
  }

  if (!target && priority === 'lowest_hp') target = lowestHp(candidates)
  if (!target && priority === 'highest_threat') target = highestThreat(candidates)
  if (!target && priority === 'caster_or_support') target = highestSupportOrControl(shadows.length > 0 ? shadows : candidates)
  if (!target && priority === 'frontline') target = highestHp(front.length > 0 ? front : candidates)
  if (!target && priority === 'hunter') target = hunter ?? stablePick(candidates, seed)
  if (!target) target = stablePick(candidates, seed) ?? firstAlive(candidates)

  return target ? [target.unitId] : []
}

const resolveTargets = (
  state: DirectBattleState,
  actor: BattleUnit,
  action: BattleActionDefinition,
  preferredTargetIds: string[] = [],
): string[] => {
  const preferred = preferredTargetIds
    .map(id => findUnit(state, id))
    .filter((unit): unit is BattleUnit => Boolean(unit && isAlive(unit)))
  if (preferred.length > 0) return preferred.map(unit => unit.unitId)

  const allies = livingUnits(state, actor.team)
  const enemies = livingUnits(state, getOpposingTeam(actor.team))
  const enemyBoss = enemies.find(unit => unit.unitType === 'boss')
  const enemyMinion = enemies.find(unit => unit.unitType === 'minion')

  if (action.targetType === 'self') return [actor.unitId]
  if (action.targetType === 'single_ally') return [(lowestHp(allies) ?? actor).unitId]
  if (action.targetType === 'all_allies') return allies.map(unit => unit.unitId)
  if (action.targetType === 'lowest_hp_ally') return [(lowestHp(allies) ?? actor).unitId]
  if (action.targetType === 'all_enemies') return enemies.map(unit => unit.unitId)
  if (action.targetType === 'lowest_hp_enemy') return lowestHp(enemies)?.unitId ? [lowestHp(enemies)!.unitId] : []
  if (action.targetType === 'highest_threat_enemy') return highestThreat(enemies)?.unitId ? [highestThreat(enemies)!.unitId] : []
  if (action.targetType === 'boss') return [(enemyBoss ?? firstAlive(enemies))?.unitId].filter((id): id is string => Boolean(id))
  if (action.targetType === 'minion') return [(enemyMinion ?? firstAlive(enemies))?.unitId].filter((id): id is string => Boolean(id))
  if (action.targetType === 'front_lane') {
    return [(enemies.find(unit => unit.boardLane === 'front') ?? firstAlive(enemies))?.unitId].filter((id): id is string => Boolean(id))
  }
  if (action.targetType === 'rear_lane') {
    return [(enemies.find(unit => unit.boardLane === 'rear') ?? firstAlive(enemies))?.unitId].filter((id): id is string => Boolean(id))
  }
  return [(firstAlive(enemies))?.unitId].filter((id): id is string => Boolean(id))
}

const getDefaultAction = (unit: BattleUnit): BattleActionDefinition | undefined =>
  unit.actionList.find(action => action.actionType === 'basic') ?? unit.actionList[0]

const getAction = (unit: BattleUnit, actionId?: string): BattleActionDefinition | undefined =>
  unit.actionList.find(action => action.actionId === actionId) ?? getDefaultAction(unit)

const allyTargetTypes = new Set<BattleActionDefinition['targetType']>([
  'self',
  'single_ally',
  'all_allies',
  'lowest_hp_ally',
])

const isAllyTargetAction = (action: BattleActionDefinition): boolean =>
  allyTargetTypes.has(action.targetType)

const isSupportLikeEffect = (action: BattleActionDefinition): boolean =>
  action.actionType === 'support' ||
  action.effectKind === 'support' ||
  action.effectKind === 'guard' ||
  action.effectKind === 'survival' ||
  action.effectKind === 'cooldown' ||
  action.effectKind === 'synergy' ||
  action.effectKind === 'stat_shift'

const isHostileEffect = (action: BattleActionDefinition): boolean =>
  action.effectKind === 'damage' ||
  action.effectKind === 'hybrid' ||
  action.effectKind === 'control' ||
  action.effectKind === 'stat_shift' ||
  action.effectKind === 'bossing' ||
  action.effectKind === 'basic'

const actionTiming = (action: BattleActionDefinition): QueuedBattleAction['timing'] => {
  if (
    action.actionType === 'guard' ||
    isSupportLikeEffect(action) ||
    action.effectKind === 'control' ||
    isAllyTargetAction(action)
  ) {
    return 'before_action'
  }
  return 'normal_action'
}

const skillPriority = (action: BattleActionDefinition): number => {
  if (action.actionType === 'guard') return 18
  if (action.actionType === 'support') return 14
  if (action.actionType === 'skill') return 10
  if (action.actionType === 'basic') return 4
  if (action.actionType === 'wait') return -4
  return 0
}

export const createDirectBattleState = (
  units: BattleUnit[],
  options: CreateDirectBattleStateOptions = {},
): DirectBattleState => {
  const state: DirectBattleState = {
    battleId: options.battleId ?? `direct-battle-${Date.now()}`,
    round: 0,
    units: units.map(cloneUnit),
    actionQueue: [],
    logs: [],
    status: 'ready',
    winner: 'none',
    isFinished: false,
    maxRounds: options.maxRounds ?? 5,
  }
  updateBattleResult(state)
  return state
}

export const createActionQueue = (
  state: DirectBattleState,
  selections: DirectBattleActionSelection[],
): QueuedBattleAction[] => {
  const selectionByActor = new Map(selections.map(selection => [selection.actorUnitId, selection]))
  const queue: QueuedBattleAction[] = []

  for (const actor of livingUnits(state)) {
    const selection = selectionByActor.get(actor.unitId)
    if (actor.team === 'player' && !selection) continue

    const action = getAction(actor, selection?.actionId)
    if (!action) continue

    const speedPriority = actor.stats.spd
    const actionSkillPriority = skillPriority(action)
    const timing = actionTiming(action)
    const finalPriority = action.basePriority * 10 + actionSkillPriority + actor.actionPriority + speedPriority * 0.1
    queue.push({
      queueId: `${state.battleId}:r${state.round}:${queue.length + 1}:${actor.unitId}`,
      actorUnitId: actor.unitId,
      actorType: actor.unitType,
      team: actor.team,
      actionId: action.actionId,
      actionType: action.actionType,
      targetIds: resolveTargets(state, actor, action, selection?.targetIds),
      basePriority: action.basePriority,
      speedPriority,
      skillPriority: actionSkillPriority,
      finalPriority,
      timing,
      isReaction: false,
      sourceSkillId: action.sourceSkillId,
      sourcePassiveId: action.sourcePassiveId,
      effectKind: action.effectKind,
      actionCue: action.actionCue,
      animationCue: action.animationCue,
      effectColor: action.effectColor,
    })
  }

  return queue.sort((a, b) =>
    TIMING_ORDER[b.timing] - TIMING_ORDER[a.timing] ||
    b.finalPriority - a.finalPriority ||
    b.speedPriority - a.speedPriority ||
    TEAM_ORDER[b.team] - TEAM_ORDER[a.team] ||
    a.queueId.localeCompare(b.queueId)
  )
}

const getAttackMultiplier = (unit: BattleUnit): number =>
  Math.max(
    0.35,
    1 +
      statusValue(unit, 'attackUp') -
      Math.min(0.35, statusValue(unit, 'attackDown')) -
      Math.min(0.3, statusValue(unit, 'suppression')),
  )

const getDefenseValue = (unit: BattleUnit): number =>
  unit.stats.def * (1 - Math.min(0.5, statusValue(unit, 'defenseDown')))

const getDamageBonus = (target: BattleUnit): number =>
  hasStatus(target, 'mark') || hasStatus(target, 'weakness') ? 1.12 : 1

const computeDamage = (
  actor: BattleUnit,
  target: BattleUnit,
  action: BattleActionDefinition,
): number => {
  const actorAttack = action.actionType === 'skill'
    ? actor.stats.skillPower * 1.2 + actor.stats.atk * 0.52
    : actor.stats.atk * 1.08
  const controlBonus = action.effectKind === 'control' ? actor.stats.controlPower * 0.22 : 0
  const bossBonus = action.effectKind === 'bossing' && target.unitType === 'boss' ? actor.stats.bossPower * 0.34 : 0
  const rawPower = actorAttack + controlBonus + bossBonus
  const defense = getDefenseValue(target)
  const defenseAnchor = action.actionType === 'skill' ? 210 : 250
  const defenseReduction = defense / (defense + defenseAnchor + rawPower * 0.42)
  const targetSpreadMultiplier = action.targetType === 'all_enemies' ? 0.48 : 1
  const skillMultiplier = action.sourceSkillId === 'basic-focus-slash'
    ? 1.34
    : action.actionType === 'skill'
      ? 1.08
      : 1
  const minimumDamage = Math.max(3, actor.level * 0.75, rawPower * 0.14)
  return round(Math.max(
    minimumDamage,
    rawPower * (1 - defenseReduction) * skillMultiplier * targetSpreadMultiplier * getAttackMultiplier(actor) * getDamageBonus(target),
  ))
}

const findProtector = (state: DirectBattleState, target: BattleUnit, attacker: BattleUnit): BattleUnit | undefined => {
  if (target.team === attacker.team) return undefined
  const protect = target.statusEffects.find(status => status.type === 'protect' && status.sourceUnitId && status.durationRounds > 0)
  const protector = protect?.sourceUnitId ? findUnit(state, protect.sourceUnitId) : undefined
  return protector && isAlive(protector) ? protector : undefined
}

const applyDamage = (
  state: DirectBattleState,
  actor: BattleUnit,
  target: BattleUnit,
  amount: number,
  action: BattleActionDefinition,
): number => {
  let damage = amount
  const protector = findProtector(state, target, actor)

  if (protector && protector.unitId !== target.unitId) {
    const redirected = round(damage * 0.35)
    damage = round(damage * 0.72)
    const snapshotIds = uniqueUnitIds([protector.unitId, target.unitId])
    const hpBeforeByUnitId = hpSnapshotsFor(state, snapshotIds)
    const statusBeforeByUnitId = statusSnapshotsFor(state, snapshotIds)
    protector.stats.currentHp = Math.max(0, protector.stats.currentHp - redirected)
    addLog(state, {
      actorUnitId: protector.unitId,
      targetUnitIds: [target.unitId],
      actionId: action.actionId,
      timing: 'reaction',
      message: `${protector.displayName} protected ${target.displayName} and absorbed ${redirected}.`,
      eventType: 'reaction',
      value: redirected,
      actionCue: 'protect',
      animationCue: 'guard-reaction',
      effectColor: protector.effectColor,
      effectKind: 'guard',
      hpBeforeByUnitId,
      hpAfterByUnitId: hpSnapshotsFor(state, snapshotIds),
      statusBeforeByUnitId,
      statusAfterByUnitId: statusSnapshotsFor(state, snapshotIds),
    })
  }

  if (hasStatus(target, 'guard')) damage = round(damage * 0.62)
  if (hasStatus(target, 'shield')) damage = round(damage * Math.max(0.35, 1 - statusValue(target, 'shield')))

  const snapshotIds = uniqueUnitIds([target.unitId])
  const hpBeforeByUnitId = hpSnapshotsFor(state, snapshotIds)
  const statusBeforeByUnitId = statusSnapshotsFor(state, snapshotIds)
  target.stats.currentHp = Math.max(0, target.stats.currentHp - damage)
  addLog(state, {
    actorUnitId: actor.unitId,
    targetUnitIds: [target.unitId],
    actionId: action.actionId,
    timing: actionTiming(action),
    message: `${actor.displayName} used ${action.label} on ${target.displayName} for ${damage} damage.`,
    eventType: 'damage',
    value: damage,
    actionCue: action.actionCue,
    animationCue: action.animationCue,
    effectColor: action.effectColor,
    effectKind: action.effectKind,
    hpBeforeByUnitId,
    hpAfterByUnitId: hpSnapshotsFor(state, snapshotIds),
    statusBeforeByUnitId,
    statusAfterByUnitId: statusSnapshotsFor(state, snapshotIds),
  })
  return damage
}

const applyHeal = (
  state: DirectBattleState,
  actor: BattleUnit,
  target: BattleUnit,
  action: BattleActionDefinition,
) => {
  const heal = round(Math.max(5, actor.stats.supportPower * 0.42 + actor.stats.skillPower * 0.18))
  const snapshotIds = uniqueUnitIds([target.unitId])
  const hpBeforeByUnitId = hpSnapshotsFor(state, snapshotIds)
  const statusBeforeByUnitId = statusSnapshotsFor(state, snapshotIds)
  const before = target.stats.currentHp
  target.stats.currentHp = Math.min(target.stats.maxHp, target.stats.currentHp + heal)
  addLog(state, {
    actorUnitId: actor.unitId,
    targetUnitIds: [target.unitId],
    actionId: action.actionId,
    timing: actionTiming(action),
    message: `${actor.displayName} stabilized ${target.displayName} for ${target.stats.currentHp - before} HP.`,
    eventType: 'heal',
    value: target.stats.currentHp - before,
    actionCue: action.actionCue,
    animationCue: action.animationCue,
    effectColor: action.effectColor,
    effectKind: action.effectKind,
    hpBeforeByUnitId,
    hpAfterByUnitId: hpSnapshotsFor(state, snapshotIds),
    statusBeforeByUnitId,
    statusAfterByUnitId: statusSnapshotsFor(state, snapshotIds),
  })
}

const applyAllySupport = (
  state: DirectBattleState,
  actor: BattleUnit,
  target: BattleUnit,
  action: BattleActionDefinition,
) => {
  if (action.effectKind === 'support' || action.actionType === 'support') {
    applyHeal(state, actor, target, action)
    return
  }

  const guardValue = action.effectKind === 'survival' ? 0.32 : 0.28
  const shieldValue = action.effectKind === 'cooldown' || action.effectKind === 'synergy' ? 0.12 : 0.18
  const snapshotIds = uniqueUnitIds([target.unitId])
  const hpBeforeByUnitId = hpSnapshotsFor(state, snapshotIds)
  const statusBeforeByUnitId = statusSnapshotsFor(state, snapshotIds)
  if (action.effectKind === 'synergy' || action.effectKind === 'hybrid' || action.effectKind === 'bossing') {
    addStatus(target, {
      type: 'attackUp',
      sourceUnitId: actor.unitId,
      durationRounds: 1,
      effectValue: action.effectKind === 'bossing' ? 0.22 : 0.16,
    })
  }
  if (action.effectKind === 'stat_shift') {
    addStatus(target, {
      type: 'defenseUp',
      sourceUnitId: actor.unitId,
      durationRounds: 1,
      effectValue: 0.16,
    })
  }
  addStatus(target, {
    type: action.effectKind === 'cooldown' || action.effectKind === 'synergy' ? 'speedUp' : 'guard',
    sourceUnitId: actor.unitId,
    durationRounds: 1,
    effectValue: guardValue,
  })
  addStatus(target, {
    type: 'shield',
    sourceUnitId: actor.unitId,
    durationRounds: 1,
    effectValue: shieldValue,
  })
  if (target.unitId !== actor.unitId) {
    addStatus(target, {
      type: 'protect',
      sourceUnitId: actor.unitId,
      durationRounds: 1,
      effectValue: 0.22,
    })
  }
  addLog(state, {
    actorUnitId: actor.unitId,
    targetUnitIds: [target.unitId],
    actionId: action.actionId,
    timing: actionTiming(action),
    message: `${actor.displayName} reinforced ${target.displayName} with ${action.label}.`,
    eventType: 'status',
    value: round((guardValue + shieldValue) * 100),
    actionCue: action.actionCue,
    animationCue: action.animationCue,
    effectColor: action.effectColor,
    effectKind: action.effectKind,
    hpBeforeByUnitId,
    hpAfterByUnitId: hpSnapshotsFor(state, snapshotIds),
    statusBeforeByUnitId,
    statusAfterByUnitId: statusSnapshotsFor(state, snapshotIds),
  })
}

const addFizzleLog = (
  state: DirectBattleState,
  actor: BattleUnit,
  action: BattleActionDefinition,
  targetIds: string[],
  reason: string,
) => {
  const snapshotIds = uniqueUnitIds([actor.unitId, ...targetIds])
  addLog(state, {
    actorUnitId: actor.unitId,
    targetUnitIds: targetIds,
    actionId: action.actionId,
    timing: actionTiming(action),
    message: `${actor.displayName}'s ${action.label} ${reason}.`,
    eventType: 'fizzle',
    actionCue: action.actionCue,
    animationCue: action.animationCue,
    effectColor: action.effectColor,
    effectKind: action.effectKind,
    hpBeforeByUnitId: hpSnapshotsFor(state, snapshotIds),
    hpAfterByUnitId: hpSnapshotsFor(state, snapshotIds),
    statusBeforeByUnitId: statusSnapshotsFor(state, snapshotIds),
    statusAfterByUnitId: statusSnapshotsFor(state, snapshotIds),
  })
}

const executeAction = (state: DirectBattleState, queued: QueuedBattleAction) => {
  const actor = findUnit(state, queued.actorUnitId)
  if (!actor || !isAlive(actor)) return
  const action = getAction(actor, queued.actionId)
  if (!action) return

  if ((actor.cooldowns[action.actionId] ?? 0) > 0) {
    const snapshotIds = uniqueUnitIds([actor.unitId, ...queued.targetIds])
    addLog(state, {
      actorUnitId: actor.unitId,
      targetUnitIds: queued.targetIds,
      actionId: action.actionId,
      timing: queued.timing,
      message: `${actor.displayName}'s ${action.label} is still on cooldown.`,
      eventType: 'fizzle',
      actionCue: action.actionCue,
      animationCue: action.animationCue,
      effectColor: action.effectColor,
      effectKind: action.effectKind,
      hpBeforeByUnitId: hpSnapshotsFor(state, snapshotIds),
      hpAfterByUnitId: hpSnapshotsFor(state, snapshotIds),
      statusBeforeByUnitId: statusSnapshotsFor(state, snapshotIds),
      statusAfterByUnitId: statusSnapshotsFor(state, snapshotIds),
    })
    return
  }

  const targets = queued.targetIds
    .map(id => findUnit(state, id))
    .filter((target): target is BattleUnit => Boolean(target && isAlive(target)))
  if (targets.length === 0 && action.targetType !== 'self') {
    const snapshotIds = uniqueUnitIds([actor.unitId, ...queued.targetIds])
    addLog(state, {
      actorUnitId: actor.unitId,
      targetUnitIds: queued.targetIds,
      actionId: action.actionId,
      timing: queued.timing,
      message: `${actor.displayName}'s ${action.label} found no valid target.`,
      eventType: 'fizzle',
      actionCue: action.actionCue,
      animationCue: action.animationCue,
      effectColor: action.effectColor,
      effectKind: action.effectKind,
      hpBeforeByUnitId: hpSnapshotsFor(state, snapshotIds),
      hpAfterByUnitId: hpSnapshotsFor(state, snapshotIds),
      statusBeforeByUnitId: statusSnapshotsFor(state, snapshotIds),
      statusAfterByUnitId: statusSnapshotsFor(state, snapshotIds),
    })
    return
  }
  const allyTargets = targets.filter(target => target.team === actor.team)
  const enemyTargets = targets.filter(target => target.team !== actor.team)

  if (action.actionType === 'wait') {
    const snapshotIds = uniqueUnitIds([actor.unitId])
    const hpBeforeByUnitId = hpSnapshotsFor(state, snapshotIds)
    const statusBeforeByUnitId = statusSnapshotsFor(state, snapshotIds)
    addStatus(actor, { type: 'attackUp', sourceUnitId: actor.unitId, durationRounds: 1, effectValue: 0.12 })
    addLog(state, {
      actorUnitId: actor.unitId,
      targetUnitIds: [actor.unitId],
      actionId: action.actionId,
      timing: queued.timing,
      message: `${actor.displayName} waited and charged their next action.`,
      eventType: 'status',
      actionCue: action.actionCue,
      animationCue: action.animationCue,
      effectColor: action.effectColor,
      effectKind: action.effectKind,
      hpBeforeByUnitId,
      hpAfterByUnitId: hpSnapshotsFor(state, snapshotIds),
      statusBeforeByUnitId,
      statusAfterByUnitId: statusSnapshotsFor(state, snapshotIds),
    })
    return
  }

  if (allyTargets.length > 0 && action.actionType !== 'guard') {
    for (const target of allyTargets) applyAllySupport(state, actor, target, action)
    if (action.cooldown) actor.cooldowns[action.actionId] = action.cooldown
    return
  }

  if (enemyTargets.length > 0 && !isHostileEffect(action) && !isAllyTargetAction(action)) {
    addFizzleLog(state, actor, action, enemyTargets.map(target => target.unitId), 'had no safe hostile effect')
    if (action.cooldown) actor.cooldowns[action.actionId] = action.cooldown
    return
  }

  if (action.actionType === 'guard') {
    const requestedTarget = targets[0] ?? actor
    const target = requestedTarget.team === actor.team ? requestedTarget : actor
    const snapshotIds = uniqueUnitIds([actor.unitId, target.unitId])
    const hpBeforeByUnitId = hpSnapshotsFor(state, snapshotIds)
    const statusBeforeByUnitId = statusSnapshotsFor(state, snapshotIds)
    addStatus(actor, { type: 'guard', sourceUnitId: actor.unitId, durationRounds: 1, effectValue: 0.38 })
    if (target.unitId !== actor.unitId) {
      addStatus(target, { type: 'protect', sourceUnitId: actor.unitId, durationRounds: 1, effectValue: 0.35 })
    }
    addLog(state, {
      actorUnitId: actor.unitId,
      targetUnitIds: [target.unitId],
      actionId: action.actionId,
      timing: queued.timing,
      message: target.unitId === actor.unitId
        ? `${actor.displayName} took a guard stance.`
        : `${actor.displayName} guarded ${target.displayName}.`,
      eventType: 'status',
      actionCue: action.actionCue,
      animationCue: action.animationCue,
      effectColor: action.effectColor,
      effectKind: action.effectKind,
      hpBeforeByUnitId,
      hpAfterByUnitId: hpSnapshotsFor(state, snapshotIds),
      statusBeforeByUnitId,
      statusAfterByUnitId: statusSnapshotsFor(state, snapshotIds),
    })
    return
  }

  if (action.effectKind === 'support' || action.actionType === 'support') {
    if (allyTargets.length === 0) {
      addFizzleLog(state, actor, action, queued.targetIds, 'had no valid ally target')
      if (action.cooldown) actor.cooldowns[action.actionId] = action.cooldown
      return
    }
    for (const target of allyTargets) applyHeal(state, actor, target, action)
    if (action.cooldown) actor.cooldowns[action.actionId] = action.cooldown
    return
  }

  if (action.effectKind === 'control' || action.effectKind === 'stat_shift') {
    if (enemyTargets.length === 0) {
      addFizzleLog(state, actor, action, queued.targetIds, 'had no valid enemy target')
      if (action.cooldown) actor.cooldowns[action.actionId] = action.cooldown
      return
    }
    for (const target of enemyTargets) {
      const snapshotIds = uniqueUnitIds([target.unitId])
      const hpBeforeByUnitId = hpSnapshotsFor(state, snapshotIds)
      const statusBeforeByUnitId = statusSnapshotsFor(state, snapshotIds)
      const isSuppression =
        action.targetType === 'all_enemies' ||
        /suppress|warden|decree|gaze|record|mark|weak/i.test(`${action.actionId} ${action.label} ${action.actionCue}`)
      addStatus(target, { type: 'defenseDown', sourceUnitId: actor.unitId, durationRounds: 1, effectValue: action.effectKind === 'stat_shift' ? 0.2 : 0.18 })
      addStatus(target, { type: 'speedDown', sourceUnitId: actor.unitId, durationRounds: 1, effectValue: action.effectKind === 'stat_shift' ? 0.14 : 0.12 })
      addStatus(target, { type: 'mark', sourceUnitId: actor.unitId, durationRounds: 1, effectValue: 0.1 })
      if (isSuppression) {
        addStatus(target, { type: 'suppression', sourceUnitId: actor.unitId, durationRounds: 1, effectValue: 0.12 })
      }
      addLog(state, {
        actorUnitId: actor.unitId,
        targetUnitIds: [target.unitId],
        actionId: action.actionId,
        timing: queued.timing,
        message: `${actor.displayName} exposed ${target.displayName} with ${action.label}.`,
        eventType: 'status',
        value: isSuppression ? 4 : 3,
        actionCue: action.actionCue,
        animationCue: action.animationCue,
        effectColor: action.effectColor,
        effectKind: action.effectKind,
        hpBeforeByUnitId,
        hpAfterByUnitId: hpSnapshotsFor(state, snapshotIds),
        statusBeforeByUnitId,
        statusAfterByUnitId: statusSnapshotsFor(state, snapshotIds),
      })
      if (action.effectKind === 'control') {
        applyDamage(state, actor, target, computeDamage(actor, target, action), action)
      }
    }
    if (action.cooldown) actor.cooldowns[action.actionId] = action.cooldown
    return
  }

  if (enemyTargets.length === 0) {
    addFizzleLog(state, actor, action, queued.targetIds, 'had no valid enemy target')
    if (action.cooldown) actor.cooldowns[action.actionId] = action.cooldown
    return
  }
  for (const target of enemyTargets) applyDamage(state, actor, target, computeDamage(actor, target, action), action)
  if (action.cooldown) actor.cooldowns[action.actionId] = action.cooldown
}

const updateBattleResult = (state: DirectBattleState) => {
  const playerAlive = livingUnits(state, 'player').length > 0
  const enemyAlive = livingUnits(state, 'enemy').length > 0
  const hunterUnits = state.units.filter(unit => unit.team === 'player' && unit.unitType === 'hunter')
  const hunterDefeated = hunterUnits.length > 0 && !hunterUnits.some(isAlive)
  let winner: DirectBattleWinner = 'none'
  if (hunterDefeated) winner = 'enemy'
  else if (playerAlive && !enemyAlive) winner = 'player'
  else if (!playerAlive && enemyAlive) winner = 'enemy'
  else if (!playerAlive && !enemyAlive) winner = 'none'

  state.winner = winner
  state.isFinished = winner !== 'none' || state.round >= state.maxRounds || hunterDefeated || !playerAlive || !enemyAlive
  state.status = state.isFinished ? 'finished' : state.round > 0 ? 'in_progress' : state.status
}

export const chooseMockPlayerActions = (state: DirectBattleState): DirectBattleActionSelection[] =>
  livingUnits(state, 'player').map(unit => {
    const woundedAlly = lowestHp(livingUnits(state, 'player'))
    const firstSkill = unit.actionList.find(action => action.actionType === 'skill' && (unit.cooldowns[action.actionId] ?? 0) <= 0)
    const guard = unit.actionList.find(action => action.actionType === 'guard' && (unit.cooldowns[action.actionId] ?? 0) <= 0)
    if (unit.role === 'guard' && guard && woundedAlly && woundedAlly.stats.currentHp / woundedAlly.stats.maxHp < 0.7) {
      return { actorUnitId: unit.unitId, actionId: guard.actionId, targetIds: [woundedAlly.unitId] }
    }
    if (firstSkill) return { actorUnitId: unit.unitId, actionId: firstSkill.actionId }
    return { actorUnitId: unit.unitId, actionId: getDefaultAction(unit)?.actionId }
  })

export const chooseMockMonsterActions = (state: DirectBattleState): DirectBattleActionSelection[] =>
  livingUnits(state, 'enemy').map(unit => {
    const woundedAlly = lowestHp(livingUnits(state, 'enemy'))
    const basic = getDefaultAction(unit)
    const skill = unit.actionList.find(action => action.actionType === 'skill' && (unit.cooldowns[action.actionId] ?? 0) <= 0)
    const guard = unit.actionList.find(action => action.actionType === 'guard')
    const support = unit.actionList.find(action => action.actionType === 'support' && (unit.cooldowns[action.actionId] ?? 0) <= 0)
    const supportSkill = unit.actionList.find(action =>
      (action.effectKind === 'synergy' || action.effectKind === 'guard' || action.effectKind === 'support') &&
      (unit.cooldowns[action.actionId] ?? 0) <= 0
    )
    const bossAlly = livingUnits(state, 'enemy').find(ally => ally.unitType === 'boss')

    const withPreferredTarget = (action: BattleActionDefinition | undefined): DirectBattleActionSelection => ({
      actorUnitId: unit.unitId,
      actionId: action?.actionId,
      targetIds: action ? chooseEnemyPreferredTarget(state, unit, action) : undefined,
    })

    if (unit.role === 'support' && support && woundedAlly && woundedAlly.stats.currentHp / woundedAlly.stats.maxHp < 0.82) {
      return { actorUnitId: unit.unitId, actionId: support.actionId, targetIds: [woundedAlly.unitId] }
    }
    if (unit.role === 'support' && supportSkill) {
      return isHostileEffect(supportSkill) ? withPreferredTarget(supportSkill) : { actorUnitId: unit.unitId, actionId: supportSkill.actionId }
    }
    if (unit.role === 'tank' && guard && woundedAlly && woundedAlly.unitId !== unit.unitId) {
      const target = bossAlly && bossAlly.unitId !== unit.unitId ? bossAlly : woundedAlly
      return { actorUnitId: unit.unitId, actionId: guard.actionId, targetIds: [target.unitId] }
    }
    if ((unit.role === 'caster' || unit.role === 'controller' || unit.role === 'boss' || unit.role === 'assassin' || unit.role === 'minion') && skill) {
      return withPreferredTarget(skill)
    }
    return withPreferredTarget(basic)
  })

export const executeDirectBattleRound = (
  state: DirectBattleState,
  playerSelections: DirectBattleActionSelection[],
): DirectBattleRoundResult => {
  if (state.isFinished) return { state, queue: [], logs: [] }

  state.round += 1
  state.status = 'in_progress'
  tickRoundStart(state)
  addLog(state, { message: `Round ${state.round} started.`, eventType: 'round' })

  const monsterSelections = chooseMockMonsterActions(state)
  const queue = createActionQueue(state, [...playerSelections, ...monsterSelections])
  state.actionQueue = queue
  addLog(state, {
    message: `ActionQueue prepared with ${queue.length} actions.`,
    eventType: 'queue',
    value: queue.length,
    actionCue: 'action_queue',
  })

  const logStart = state.logs.length
  for (const queued of queue) {
    executeAction(state, queued)
    updateBattleResult(state)
    if (state.winner !== 'none') break
  }

  tickRoundEnd(state)
  updateBattleResult(state)
  if (state.isFinished) {
    addLog(state, {
      message: state.winner === 'none' ? 'Battle reached the mock round limit.' : `${state.winner} team won the mock battle.`,
      eventType: 'result',
      actionCue: 'battle_result',
    })
  }

  return { state, queue, logs: state.logs.slice(logStart) }
}

export const runMockDirectBattle = (
  initialState: DirectBattleState,
  selector: DirectBattlePlayerSelector = chooseMockPlayerActions,
): DirectBattleResult => {
  const state = initialState
  updateBattleResult(state)
  if (state.isFinished) {
    return {
      state,
      winner: state.winner,
      roundsSimulated: state.round,
      logs: state.logs,
      isFinished: state.isFinished,
      reason: livingUnits(state).length === 0 ? 'no_units' : 'winner',
    }
  }

  while (!state.isFinished && state.round < state.maxRounds) {
    executeDirectBattleRound(state, selector(state))
  }

  return {
    state,
    winner: state.winner,
    roundsSimulated: state.round,
    logs: state.logs,
    isFinished: state.isFinished,
    reason: state.winner !== 'none' ? 'winner' : state.round >= state.maxRounds ? 'max_rounds' : 'no_units',
  }
}
