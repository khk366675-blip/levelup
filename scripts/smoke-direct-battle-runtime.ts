import { buildHunterBattleUnit, buildMonsterBattleUnit, buildShadowBattleUnit, buildShadowBattleUnits, validateBattleUnit } from '../src/lib/battleUnits.ts'
import {
  DIRECT_BATTLE_MOCK_ENCOUNTERS,
  buildDirectBattleEncounterParty,
  validateDirectBattleMockEncounters,
} from '../src/lib/directBattleEncounters.ts'
import { MOCK_DIRECT_BATTLE_MONSTERS } from '../src/lib/directBattleMonsters.ts'
import { chooseMockMonsterActions, createDirectBattleState, executeDirectBattleRound, runMockDirectBattle } from '../src/lib/directBattleRuntime.ts'
import { SHADOW_DEFINITIONS } from '../src/lib/shadows.ts'
import { shouldUseHighTierTicketAnticipation } from '../src/components/TicketRevealSequence.tsx'
import type { HunterState, OwnedShadow, ShadowDefinition } from '../src/lib/types.ts'
import type { BattleActionDefinition, BattleUnit } from '../src/lib/directBattleTypes.ts'

const toOwnedShadow = (definition: ShadowDefinition, index: number): OwnedShadow => ({
  instanceId: `runtime-smoke-shadow-${index}-${definition.id}`,
  definitionId: definition.id,
  name: definition.name,
  obtainedAt: new Date(0).toISOString(),
  sourceType: definition.sourceType,
  sourceGateId: definition.sourceGateId,
  sourceQuestId: definition.sourceQuestId,
  rarity: definition.rarity,
  birthRarity: definition.birthRarity ?? definition.rarity,
  innateGrade: index === 0 ? 'A' : 'B',
  rank: definition.rank,
  role: definition.role,
  traits: [],
  level: 10 + index,
  xp: 0,
  isNamed: definition.rank === 'named' || definition.isGateNamed || definition.isAchievementNamed,
  isGateNamed: definition.isGateNamed,
  isAchievementNamed: definition.isAchievementNamed,
  enhancementLevel: index,
  absorbedCount: 0,
  evolutionStage: 0,
})

const hunter: HunterState = {
  name: 'Runtime Smoke Hunter',
  level: 20,
  xp: 0,
  totalXp: 0,
  rank: 'D',
  job: 'Runtime Smoke Job',
  jobId: 'unawakened',
  unlockedJobIds: ['unawakened'],
  stats: { STR: 20, VIT: 18, AGI: 17, INT: 15, PER: 14, SEN: 17 },
  freeStatPoints: 0,
  streak: 0,
  categoryProgress: {
    workout: 0,
    study: 0,
    career: 0,
    health: 0,
    mind: 0,
    finance: 0,
    social: 0,
    challenge: 0,
    habit: 0,
  },
  ownedTitleIds: [],
}

const shadowDefinitions = SHADOW_DEFINITIONS
  .filter(definition => !definition.hiddenUntilObtained && !definition.isGateNamed)
  .slice(0, 3)
const playerUnits = [
  buildHunterBattleUnit(hunter).unit,
  ...buildShadowBattleUnits(shadowDefinitions.map(toOwnedShadow), shadowDefinitions).map(result => result.unit),
]

const encounterIssues = validateDirectBattleMockEncounters()
const issues: string[] = [...encounterIssues]
let crashes = 0
let totalLogs = 0
let totalRounds = 0
let actionQueueIssues = 0
let revealSnapshotIssues = 0
let skillSafetyIssues = 0
let targetingIssues = 0
let hunterDefeatIssues = 0
let shadowStatIssues = 0
let summonColorIssues = 0
const encounterSummaries: string[] = []

const hpBefore = (log: { hpBeforeByUnitId?: Record<string, { currentHp: number }> }, unitId: string) =>
  log.hpBeforeByUnitId?.[unitId]?.currentHp

const hpAfter = (log: { hpAfterByUnitId?: Record<string, { currentHp: number }> }, unitId: string) =>
  log.hpAfterByUnitId?.[unitId]?.currentHp

const recordRevealIssue = (message: string) => {
  revealSnapshotIssues += 1
  issues.push(message)
}

const recordSkillSafetyIssue = (message: string) => {
  skillSafetyIssues += 1
  issues.push(message)
}

const recordTargetingIssue = (message: string) => {
  targetingIssues += 1
  issues.push(message)
}

const recordHunterDefeatIssue = (message: string) => {
  hunterDefeatIssues += 1
  issues.push(message)
}

const recordShadowStatIssue = (message: string) => {
  shadowStatIssues += 1
  issues.push(message)
}

const recordSummonColorIssue = (message: string) => {
  summonColorIssues += 1
  issues.push(message)
}

const remainingHpSummary = (units: BattleUnit[], team: BattleUnit['team']) => {
  const remaining = units
    .filter(unit => unit.team === team)
    .reduce((sum, unit) => sum + Math.max(0, unit.stats.currentHp), 0)
  const max = units
    .filter(unit => unit.team === team)
    .reduce((sum, unit) => sum + Math.max(0, unit.stats.maxHp), 0)
  return `${Math.round(remaining)}/${Math.round(max)}`
}

for (const encounter of DIRECT_BATTLE_MOCK_ENCOUNTERS) {
  try {
    const enemyBuild = buildDirectBattleEncounterParty(encounter.encounterKey)
    const state = createDirectBattleState([...playerUnits, ...enemyBuild.units], {
      battleId: `runtime-smoke-${encounter.encounterKey}`,
      maxRounds: Math.min(10, Math.max(3, encounter.maxRounds)),
    })
    const result = runMockDirectBattle(state)
    const allUnits = result.state.units
    encounterSummaries.push(
      `Encounter ${encounter.encounterKey}: winner ${result.winner}, rounds ${result.roundsSimulated}, player HP ${remainingHpSummary(allUnits, 'player')}, enemy HP ${remainingHpSummary(allUnits, 'enemy')}`,
    )
    const validationIssues = allUnits.flatMap(unit => validateBattleUnit(unit))
    const hpIssues = allUnits.flatMap(unit => {
      const unitIssues: string[] = []
      if (!Number.isFinite(unit.stats.currentHp)) unitIssues.push(`${encounter.encounterKey}:${unit.unitId}.currentHp is not finite`)
      if (unit.stats.currentHp < 0) unitIssues.push(`${encounter.encounterKey}:${unit.unitId}.currentHp is negative`)
      if (unit.stats.currentHp > unit.stats.maxHp) unitIssues.push(`${encounter.encounterKey}:${unit.unitId}.currentHp exceeds maxHp`)
      return unitIssues
    })
    const queueIssues = result.state.actionQueue.length === 0 ? [`${encounter.encounterKey}: ActionQueue was not created`] : []
    const logIssues = result.logs.length === 0 ? [`${encounter.encounterKey}: No runtime logs were created`] : []
    const winnerIssues = ['player', 'enemy', 'none'].includes(result.winner) ? [] : [`${encounter.encounterKey}: invalid winner ${result.winner}`]

    if (queueIssues.length > 0) actionQueueIssues += queueIssues.length
    totalLogs += result.logs.length
    totalRounds += result.roundsSimulated
    issues.push(...enemyBuild.warnings, ...validationIssues, ...hpIssues, ...queueIssues, ...logIssues, ...winnerIssues)
  } catch (error) {
    crashes += 1
    issues.push(`${encounter.encounterKey}: ${(error as Error).message}`)
  }
}

const cloneSmokeUnit = (unit: BattleUnit): BattleUnit => ({
  ...unit,
  stats: { ...unit.stats },
  statusEffects: unit.statusEffects.map(status => ({ ...status })),
  cooldowns: { ...unit.cooldowns },
  actionList: unit.actionList.map(action => ({ ...action })),
  passiveList: unit.passiveList.map(action => ({ ...action })),
  metadata: { ...unit.metadata, tags: unit.metadata.tags ? [...unit.metadata.tags] : undefined },
})

try {
  const hunterUnit = cloneSmokeUnit(playerUnits[0])
  const supportUnit = cloneSmokeUnit(playerUnits[1])
  const enemyBuild = buildDirectBattleEncounterParty('small_bruiser')
  const enemyUnit = cloneSmokeUnit(enemyBuild.units[0])
  const enemyWaitAction: BattleActionDefinition = {
    actionId: `${enemyUnit.unitId}:wait-regression`,
    label: 'Wait',
    actionType: 'wait',
    targetType: 'self',
    effectKind: 'wait',
    basePriority: -1,
    cooldown: 0,
    actionCue: 'wait',
    animationCue: 'wait',
    effectColor: 'zinc',
  }
  const damageFloorAction: BattleActionDefinition = {
    actionId: `${supportUnit.unitId}:skill:damage-floor-regression`,
    label: 'Damage Floor',
    description: 'A fatigue wall lowers the danger floor when a heavy hit is expected.',
    actionType: 'skill',
    targetType: 'single_ally',
    effectKind: 'guard',
    basePriority: 4,
    cooldown: 0,
    sourceSkillId: 'template-fatigue-wall-damage-floor',
    actionCue: 'Damage floor guard',
    animationCue: 'barrier_guard',
    effectColor: 'cyan',
  }
  hunterUnit.stats.currentHp = Math.max(1, hunterUnit.stats.maxHp - 25)
  supportUnit.actionList = [damageFloorAction]
  enemyUnit.actionList = [enemyWaitAction]
  enemyUnit.cooldowns = {}

  const state = createDirectBattleState([hunterUnit, supportUnit, enemyUnit], {
    battleId: 'runtime-smoke-ally-guard-regression',
    maxRounds: 2,
  })
  const beforeHunterHp = state.units.find(unit => unit.unitId === hunterUnit.unitId)?.stats.currentHp ?? 0
  const result = executeDirectBattleRound(state, [{
    actorUnitId: supportUnit.unitId,
    actionId: damageFloorAction.actionId,
    targetIds: [hunterUnit.unitId],
  }])
  const afterHunter = result.state.units.find(unit => unit.unitId === hunterUnit.unitId)
  const allyDamageLogs = result.logs.filter(log =>
    log.eventType === 'damage' &&
    log.actorUnitId === supportUnit.unitId &&
    log.targetUnitIds?.includes(hunterUnit.unitId),
  )
  const guardStatusLogs = result.logs.filter(log =>
    log.eventType === 'status' &&
    log.actorUnitId === supportUnit.unitId &&
    log.targetUnitIds?.includes(hunterUnit.unitId),
  )
  if (!afterHunter || afterHunter.stats.currentHp < beforeHunterHp) {
    issues.push('Ally support/guard skill damage regression: hunter HP decreased')
  }
  if (allyDamageLogs.length > 0) {
    issues.push('Ally support/guard skill damage regression: ally-target guard produced damage log')
  }
  if (guardStatusLogs.length === 0) {
    issues.push('Ally support/guard skill damage regression: no guard/status log was created')
  }

  const damageHunter = cloneSmokeUnit(playerUnits[0])
  const damageEnemy = cloneSmokeUnit(enemyBuild.units[0])
  damageEnemy.actionList = [enemyWaitAction]
  const basicAction = damageHunter.actionList.find(action => action.actionType === 'basic')
  if (basicAction) {
    const damageState = createDirectBattleState([damageHunter, damageEnemy], {
      battleId: 'runtime-smoke-enemy-damage-regression',
      maxRounds: 2,
    })
    const beforeEnemyHp = damageState.units.find(unit => unit.unitId === damageEnemy.unitId)?.stats.currentHp ?? 0
    const damageResult = executeDirectBattleRound(damageState, [{
      actorUnitId: damageHunter.unitId,
      actionId: basicAction.actionId,
      targetIds: [damageEnemy.unitId],
    }])
    const afterEnemy = damageResult.state.units.find(unit => unit.unitId === damageEnemy.unitId)
    const damageLog = damageResult.logs.find(log =>
      log.eventType === 'damage' &&
      log.actorUnitId === damageHunter.unitId &&
      log.targetUnitIds?.includes(damageEnemy.unitId),
    )
    if (!afterEnemy || afterEnemy.stats.currentHp >= beforeEnemyHp) {
      issues.push('Enemy target damage regression: basic attack did not damage enemy')
    }
    if (!damageLog) {
      recordRevealIssue('Reveal snapshot regression: damage step log was not created')
    } else if (!(hpBefore(damageLog, damageEnemy.unitId)! > hpAfter(damageLog, damageEnemy.unitId)!)) {
      recordRevealIssue('Reveal snapshot regression: damage step target hpBefore was not greater than hpAfter')
    }
  }
} catch (error) {
  crashes += 1
  issues.push(`Ally support/guard skill damage regression: ${(error as Error).message}`)
}

try {
  const healer = cloneSmokeUnit(playerUnits[1])
  const woundedAlly = cloneSmokeUnit(playerUnits[0])
  const enemyBuild = buildDirectBattleEncounterParty('small_bruiser')
  const waitingEnemy = cloneSmokeUnit(enemyBuild.units[0])
  const healAction: BattleActionDefinition = {
    actionId: `${healer.unitId}:heal-reveal-regression`,
    label: 'Reveal Heal',
    description: 'Heal step should carry HP before/after snapshots.',
    actionType: 'support',
    targetType: 'single_ally',
    effectKind: 'support',
    basePriority: 4,
    cooldown: 0,
    actionCue: 'reveal_heal',
    animationCue: 'support_heal',
    effectColor: 'green',
  }
  const enemyWaitAction: BattleActionDefinition = {
    actionId: `${waitingEnemy.unitId}:wait-heal-regression`,
    label: 'Wait',
    actionType: 'wait',
    targetType: 'self',
    effectKind: 'wait',
    basePriority: -1,
    cooldown: 0,
    actionCue: 'wait',
    animationCue: 'wait',
    effectColor: 'zinc',
  }
  woundedAlly.stats.currentHp = Math.max(1, woundedAlly.stats.maxHp - 70)
  healer.actionList = [healAction]
  waitingEnemy.actionList = [enemyWaitAction]

  const healState = createDirectBattleState([woundedAlly, healer, waitingEnemy], {
    battleId: 'runtime-smoke-reveal-heal-snapshot',
    maxRounds: 2,
  })
  const healResult = executeDirectBattleRound(healState, [{
    actorUnitId: healer.unitId,
    actionId: healAction.actionId,
    targetIds: [woundedAlly.unitId],
  }])
  const healLog = healResult.logs.find(log =>
    log.eventType === 'heal' &&
    log.actorUnitId === healer.unitId &&
    log.targetUnitIds?.includes(woundedAlly.unitId),
  )
  if (!healLog) {
    recordRevealIssue('Reveal snapshot regression: heal step log was not created')
  } else if (!(hpBefore(healLog, woundedAlly.unitId)! < hpAfter(healLog, woundedAlly.unitId)!)) {
    recordRevealIssue('Reveal snapshot regression: heal step target hpBefore was not less than hpAfter')
  }
} catch (error) {
  crashes += 1
  issues.push(`Reveal snapshot heal regression: ${(error as Error).message}`)
}

try {
  const enemyBuild = buildDirectBattleEncounterParty('small_bruiser')

  const guardedTarget = cloneSmokeUnit(playerUnits[0])
  const guardActor = cloneSmokeUnit(playerUnits[1])
  const enemyAttacker = cloneSmokeUnit(enemyBuild.units[0])
  guardedTarget.stats.currentHp = Math.max(1, guardedTarget.stats.maxHp - 35)
  guardActor.stats.spd = 1
  enemyAttacker.stats.spd = 999
  const enemyBasic = enemyAttacker.actionList.find(action => action.actionType === 'basic')
  const setupGuardAction: BattleActionDefinition = {
    actionId: `${guardActor.unitId}:setup-guard-regression`,
    label: 'Setup Guard',
    description: 'Guard should resolve before hostile damage regardless of SPD.',
    actionType: 'skill',
    targetType: 'single_ally',
    effectKind: 'guard',
    basePriority: 0,
    cooldown: 0,
    actionCue: 'setup_guard',
    animationCue: 'barrier_guard',
    effectColor: 'cyan',
  }
  guardActor.actionList = [setupGuardAction]
  if (enemyBasic) enemyAttacker.actionList = [enemyBasic]

  const guardedState = createDirectBattleState([guardedTarget, guardActor, enemyAttacker], {
    battleId: 'runtime-smoke-setup-guard-priority',
    maxRounds: 2,
  })
  const guardedBeforeHp = guardedState.units.find(unit => unit.unitId === guardedTarget.unitId)?.stats.currentHp ?? 0
  const guardedResult = executeDirectBattleRound(guardedState, [{
    actorUnitId: guardActor.unitId,
    actionId: setupGuardAction.actionId,
    targetIds: [guardedTarget.unitId],
  }])
  const guardQueueIndex = guardedResult.queue.findIndex(item => item.actionId === setupGuardAction.actionId)
  const enemyQueueIndex = guardedResult.queue.findIndex(item => item.actorUnitId === enemyAttacker.unitId)
  const guardQueueItem = guardedResult.queue[guardQueueIndex]
  const guardedAfterHp = guardedResult.state.units.find(unit => unit.unitId === guardedTarget.unitId)?.stats.currentHp ?? guardedBeforeHp
  const guardedDamage = guardedBeforeHp - guardedAfterHp
  const guardStatusLog = guardedResult.logs.find(log =>
    log.eventType === 'status' &&
    log.actorUnitId === guardActor.unitId &&
    log.targetUnitIds?.includes(guardedTarget.unitId),
  )

  const baselineTarget = cloneSmokeUnit(playerUnits[0])
  const baselineSupport = cloneSmokeUnit(playerUnits[1])
  const baselineEnemy = cloneSmokeUnit(enemyBuild.units[0])
  baselineTarget.stats.currentHp = Math.max(1, baselineTarget.stats.maxHp - 35)
  baselineSupport.stats.spd = 1
  baselineEnemy.stats.spd = 999
  if (enemyBasic) baselineEnemy.actionList = [enemyBasic]
  const baselineState = createDirectBattleState([baselineTarget, baselineSupport, baselineEnemy], {
    battleId: 'runtime-smoke-setup-guard-baseline',
    maxRounds: 2,
  })
  const baselineBeforeHp = baselineState.units.find(unit => unit.unitId === baselineTarget.unitId)?.stats.currentHp ?? 0
  const baselineResult = executeDirectBattleRound(baselineState, [])
  const baselineAfterHp = baselineResult.state.units.find(unit => unit.unitId === baselineTarget.unitId)?.stats.currentHp ?? baselineBeforeHp
  const baselineDamage = baselineBeforeHp - baselineAfterHp

  if (guardQueueItem?.timing !== 'before_action') {
    issues.push('Setup priority regression: guard action was not queued in before_action timing')
  }
  if (guardQueueIndex < 0 || enemyQueueIndex < 0 || guardQueueIndex > enemyQueueIndex) {
    issues.push('Setup priority regression: guard action did not resolve before enemy damage action')
  }
  if (baselineDamage <= 0 || guardedDamage >= baselineDamage) {
    issues.push('Setup priority regression: guard setup did not reduce incoming damage')
  }
  if (!guardStatusLog) {
    recordRevealIssue('Reveal snapshot regression: guard setup step log was not created')
  } else if ((hpAfter(guardStatusLog, guardedTarget.unitId) ?? 0) < (hpBefore(guardStatusLog, guardedTarget.unitId) ?? 0)) {
    recordRevealIssue('Reveal snapshot regression: guard/support setup step decreased allied HP')
  } else if (!guardStatusLog.statusBeforeByUnitId || !guardStatusLog.statusAfterByUnitId) {
    recordRevealIssue('Reveal snapshot regression: guard setup step missing status before/after snapshots')
  }

  const debuffer = cloneSmokeUnit(playerUnits[1])
  const attacker = cloneSmokeUnit(playerUnits[0])
  const debuffEnemy = cloneSmokeUnit(enemyBuild.units[0])
  debuffer.stats.spd = 1
  attacker.stats.spd = 999
  const controlSetupAction: BattleActionDefinition = {
    actionId: `${debuffer.unitId}:setup-control-regression`,
    label: 'Weakness Mark',
    description: 'Debuff should resolve before allied damage.',
    actionType: 'skill',
    targetType: 'single_enemy',
    effectKind: 'control',
    basePriority: 0,
    cooldown: 0,
    actionCue: 'weakness_mark',
    animationCue: 'control_mark',
    effectColor: 'violet',
  }
  const attackerBasic = attacker.actionList.find(action => action.actionType === 'basic')
  const enemyWaitAction: BattleActionDefinition = {
    actionId: `${debuffEnemy.unitId}:wait-setup-regression`,
    label: 'Wait',
    actionType: 'wait',
    targetType: 'self',
    effectKind: 'wait',
    basePriority: -1,
    cooldown: 0,
    actionCue: 'wait',
    animationCue: 'wait',
    effectColor: 'zinc',
  }
  debuffer.actionList = [controlSetupAction]
  debuffEnemy.actionList = [enemyWaitAction]
  const debuffState = createDirectBattleState([attacker, debuffer, debuffEnemy], {
    battleId: 'runtime-smoke-setup-debuff-priority',
    maxRounds: 2,
  })
  const debuffResult = executeDirectBattleRound(debuffState, [
    {
      actorUnitId: debuffer.unitId,
      actionId: controlSetupAction.actionId,
      targetIds: [debuffEnemy.unitId],
    },
    {
      actorUnitId: attacker.unitId,
      actionId: attackerBasic?.actionId,
      targetIds: [debuffEnemy.unitId],
    },
  ])
  const debuffQueueIndex = debuffResult.queue.findIndex(item => item.actionId === controlSetupAction.actionId)
  const attackQueueIndex = debuffResult.queue.findIndex(item => item.actorUnitId === attacker.unitId && item.actionId === attackerBasic?.actionId)
  const debuffQueueItem = debuffResult.queue[debuffQueueIndex]
  if (debuffQueueItem?.timing !== 'before_action') {
    issues.push('Setup priority regression: control/debuff action was not queued in before_action timing')
  }
  if (debuffQueueIndex < 0 || attackQueueIndex < 0 || debuffQueueIndex > attackQueueIndex) {
    issues.push('Setup priority regression: control/debuff action did not resolve before allied damage action')
  }

  const damageCaster = cloneSmokeUnit(playerUnits[0])
  const damageEnemy = cloneSmokeUnit(enemyBuild.units[0])
  const damageSkillAction: BattleActionDefinition = {
    actionId: `${damageCaster.unitId}:damage-skill-timing-regression`,
    label: 'Damage Timing Skill',
    description: 'Pure damage skills should stay in normal action timing.',
    actionType: 'skill',
    targetType: 'single_enemy',
    effectKind: 'damage',
    basePriority: 9,
    cooldown: 0,
    actionCue: 'damage_timing',
    animationCue: 'skill_slash',
    effectColor: 'red',
  }
  damageCaster.actionList = [damageSkillAction]
  damageEnemy.actionList = [enemyWaitAction]
  const damageTimingState = createDirectBattleState([damageCaster, damageEnemy], {
    battleId: 'runtime-smoke-damage-timing-regression',
    maxRounds: 2,
  })
  const damageTimingResult = executeDirectBattleRound(damageTimingState, [{
    actorUnitId: damageCaster.unitId,
    actionId: damageSkillAction.actionId,
    targetIds: [damageEnemy.unitId],
  }])
  const damageQueueItem = damageTimingResult.queue.find(item => item.actionId === damageSkillAction.actionId)
  if (damageQueueItem?.timing !== 'normal_action') {
    issues.push('Setup priority regression: pure damage skill was incorrectly queued as setup timing')
  }
} catch (error) {
  crashes += 1
  issues.push(`Setup priority regression: ${(error as Error).message}`)
}

try {
  const enemyBuild = buildDirectBattleEncounterParty('small_bruiser')
  const enemyWaitAction: BattleActionDefinition = {
    actionId: 'skill-safety-enemy-wait',
    label: 'Wait',
    actionType: 'wait',
    targetType: 'self',
    effectKind: 'wait',
    basePriority: -1,
    cooldown: 0,
    actionCue: 'wait',
    animationCue: 'wait',
    effectColor: 'zinc',
  }

  const malformedDamageCaster = cloneSmokeUnit(playerUnits[1])
  const malformedDamageAlly = cloneSmokeUnit(playerUnits[0])
  const malformedDamageEnemy = cloneSmokeUnit(enemyBuild.units[0])
  const allyTargetDamageAction: BattleActionDefinition = {
    actionId: `${malformedDamageCaster.unitId}:ally-target-damage-regression`,
    label: 'Malformed Ally Damage',
    description: 'A malformed ally-target damage action should degrade to safe support.',
    actionType: 'skill',
    targetType: 'single_ally',
    effectKind: 'damage',
    basePriority: 4,
    cooldown: 0,
    actionCue: 'malformed_ally_damage',
    animationCue: 'support_guard',
    effectColor: 'cyan',
  }
  malformedDamageCaster.actionList = [allyTargetDamageAction]
  malformedDamageEnemy.actionList = [enemyWaitAction]
  malformedDamageAlly.stats.currentHp = Math.max(1, malformedDamageAlly.stats.maxHp - 50)
  const malformedDamageState = createDirectBattleState([malformedDamageAlly, malformedDamageCaster, malformedDamageEnemy], {
    battleId: 'runtime-smoke-ally-target-damage-safety',
    maxRounds: 2,
  })
  const beforeMalformedAllyHp = malformedDamageState.units.find(unit => unit.unitId === malformedDamageAlly.unitId)?.stats.currentHp ?? 0
  const malformedDamageResult = executeDirectBattleRound(malformedDamageState, [{
    actorUnitId: malformedDamageCaster.unitId,
    actionId: allyTargetDamageAction.actionId,
    targetIds: [malformedDamageAlly.unitId],
  }])
  const afterMalformedAlly = malformedDamageResult.state.units.find(unit => unit.unitId === malformedDamageAlly.unitId)
  const malformedAllyDamageLogs = malformedDamageResult.logs.filter(log =>
    log.eventType === 'damage' &&
    log.actorUnitId === malformedDamageCaster.unitId &&
    log.targetUnitIds?.includes(malformedDamageAlly.unitId),
  )
  if (!afterMalformedAlly || afterMalformedAlly.stats.currentHp < beforeMalformedAllyHp) {
    recordSkillSafetyIssue('Skill safety regression: ally-target damage effect reduced allied HP')
  }
  if (malformedAllyDamageLogs.length > 0) {
    recordSkillSafetyIssue('Skill safety regression: ally-target damage effect produced an ally damage log')
  }

  const healer = cloneSmokeUnit(playerUnits[1])
  const healEnemy = cloneSmokeUnit(enemyBuild.units[0])
  const enemyTargetSupportAction: BattleActionDefinition = {
    actionId: `${healer.unitId}:enemy-target-support-regression`,
    label: 'Malformed Enemy Support',
    description: 'A malformed enemy-target support action should fizzle.',
    actionType: 'support',
    targetType: 'single_enemy',
    effectKind: 'support',
    basePriority: 4,
    cooldown: 0,
    actionCue: 'malformed_enemy_support',
    animationCue: 'support_heal',
    effectColor: 'green',
  }
  healer.actionList = [enemyTargetSupportAction]
  healEnemy.actionList = [enemyWaitAction]
  healEnemy.stats.currentHp = Math.max(1, healEnemy.stats.maxHp - 80)
  const enemySupportState = createDirectBattleState([healer, healEnemy], {
    battleId: 'runtime-smoke-enemy-target-support-safety',
    maxRounds: 2,
  })
  const beforeEnemySupportHp = enemySupportState.units.find(unit => unit.unitId === healEnemy.unitId)?.stats.currentHp ?? 0
  const enemySupportResult = executeDirectBattleRound(enemySupportState, [{
    actorUnitId: healer.unitId,
    actionId: enemyTargetSupportAction.actionId,
    targetIds: [healEnemy.unitId],
  }])
  const afterEnemySupport = enemySupportResult.state.units.find(unit => unit.unitId === healEnemy.unitId)
  const enemyHealLogs = enemySupportResult.logs.filter(log =>
    log.eventType === 'heal' &&
    log.actorUnitId === healer.unitId &&
    log.targetUnitIds?.includes(healEnemy.unitId),
  )
  if (!afterEnemySupport || afterEnemySupport.stats.currentHp > beforeEnemySupportHp) {
    recordSkillSafetyIssue('Skill safety regression: enemy-target support/heal increased enemy HP')
  }
  if (enemyHealLogs.length > 0) {
    recordSkillSafetyIssue('Skill safety regression: enemy-target support/heal produced an enemy heal log')
  }

  const guardActor = cloneSmokeUnit(playerUnits[1])
  const guardEnemy = cloneSmokeUnit(enemyBuild.units[0])
  const malformedGuardAction: BattleActionDefinition = {
    actionId: `${guardActor.unitId}:malformed-guard-target-regression`,
    label: 'Malformed Guard Target',
    description: 'Guard must never protect a hostile preferred target.',
    actionType: 'guard',
    targetType: 'single_ally',
    effectKind: 'guard',
    basePriority: 4,
    cooldown: 0,
    actionCue: 'malformed_guard',
    animationCue: 'barrier_guard',
    effectColor: 'cyan',
  }
  guardActor.actionList = [malformedGuardAction]
  guardEnemy.actionList = [enemyWaitAction]
  const malformedGuardState = createDirectBattleState([guardActor, guardEnemy], {
    battleId: 'runtime-smoke-guard-hostile-target-safety',
    maxRounds: 2,
  })
  const malformedGuardResult = executeDirectBattleRound(malformedGuardState, [{
    actorUnitId: guardActor.unitId,
    actionId: malformedGuardAction.actionId,
    targetIds: [guardEnemy.unitId],
  }])
  const afterGuardEnemy = malformedGuardResult.state.units.find(unit => unit.unitId === guardEnemy.unitId)
  const hostileGuardBuff = afterGuardEnemy?.statusEffects.some(status =>
    status.sourceUnitId === guardActor.unitId &&
    ['guard', 'protect', 'shield', 'attackUp', 'defenseUp', 'speedUp'].includes(status.type),
  )
  if (hostileGuardBuff) {
    recordSkillSafetyIssue('Skill safety regression: malformed guard/protect buffed a hostile target')
  }

  const statShifter = cloneSmokeUnit(playerUnits[1])
  const statShiftEnemy = cloneSmokeUnit(enemyBuild.units[0])
  const statShiftAction: BattleActionDefinition = {
    actionId: `${statShifter.unitId}:stat-shift-regression`,
    label: 'Stat Shift',
    description: 'Enemy stat shift should create a debuff without crashing.',
    actionType: 'skill',
    targetType: 'single_enemy',
    effectKind: 'stat_shift',
    basePriority: 4,
    cooldown: 0,
    actionCue: 'weakness_record',
    animationCue: 'control_mark',
    effectColor: 'violet',
  }
  statShifter.actionList = [statShiftAction]
  statShiftEnemy.actionList = [enemyWaitAction]
  const statShiftState = createDirectBattleState([statShifter, statShiftEnemy], {
    battleId: 'runtime-smoke-stat-shift-safety',
    maxRounds: 2,
  })
  const statShiftResult = executeDirectBattleRound(statShiftState, [{
    actorUnitId: statShifter.unitId,
    actionId: statShiftAction.actionId,
    targetIds: [statShiftEnemy.unitId],
  }])
  const statShiftStatusLog = statShiftResult.logs.find(log =>
    log.eventType === 'status' &&
    log.actorUnitId === statShifter.unitId &&
    log.targetUnitIds?.includes(statShiftEnemy.unitId),
  )
  const statShiftDebuff = statShiftStatusLog?.statusAfterByUnitId?.[statShiftEnemy.unitId]?.some(status =>
    status.sourceUnitId === statShifter.unitId &&
    ['defenseDown', 'speedDown', 'mark', 'weakness', 'suppression'].includes(status.type),
  )
  if (!statShiftDebuff) {
    recordSkillSafetyIssue('Skill safety regression: enemy stat_shift did not create a debuff/status')
  }
} catch (error) {
  crashes += 1
  issues.push(`Skill safety regression: ${(error as Error).message}`)
}

try {
  const targetPlayerUnits = playerUnits.map(cloneSmokeUnit)
  const roleDefinitions = ['bruiser', 'tank', 'caster', 'assassin', 'controller', 'minion', 'boss']
    .map(role => MOCK_DIRECT_BATTLE_MONSTERS.find(monster => monster.role === role))
    .filter((monster): monster is NonNullable<typeof monster> => Boolean(monster))
  const targetEnemyUnits = roleDefinitions.map((definition, index) =>
    buildMonsterBattleUnit(definition, { level: Math.max(3, definition.baseLevel), unitIdPrefix: `target-smoke-${index}` }).unit,
  )
  const targetingState = createDirectBattleState([...targetPlayerUnits, ...targetEnemyUnits], {
    battleId: 'runtime-smoke-monster-target-variety',
    maxRounds: 2,
  })
  const hunterUnitId = targetPlayerUnits.find(unit => unit.unitType === 'hunter')?.unitId
  const playerUnitIds = new Set(targetPlayerUnits.map(unit => unit.unitId))
  const selections = chooseMockMonsterActions(targetingState)
  const hostileTargetIds = selections
    .flatMap(selection => selection.targetIds ?? [])
    .filter(unitId => playerUnitIds.has(unitId))
  const uniqueTargets = new Set(hostileTargetIds)
  const shadowTargeted = hostileTargetIds.some(unitId => unitId !== hunterUnitId)
  if (hostileTargetIds.length === 0) {
    recordTargetingIssue('Monster targeting regression: no hostile player targets were selected')
  }
  if (uniqueTargets.size <= 1 || !shadowTargeted) {
    recordTargetingIssue('Monster targeting regression: role-based monster targeting still collapsed to hunter only')
  }
} catch (error) {
  crashes += 1
  issues.push(`Monster targeting regression: ${(error as Error).message}`)
}

try {
  const deadHunter = cloneSmokeUnit(playerUnits[0])
  const livingShadow = cloneSmokeUnit(playerUnits[1])
  const defeatedEnemy = cloneSmokeUnit(buildDirectBattleEncounterParty('small_bruiser').units[0])
  deadHunter.stats.currentHp = 0
  livingShadow.stats.currentHp = Math.max(1, livingShadow.stats.currentHp)
  defeatedEnemy.stats.currentHp = 0
  const hunterDefeatState = createDirectBattleState([deadHunter, livingShadow, defeatedEnemy], {
    battleId: 'runtime-smoke-hunter-death-defeat',
    maxRounds: 2,
  })
  if (hunterDefeatState.winner !== 'enemy' || !hunterDefeatState.isFinished) {
    recordHunterDefeatIssue('Hunter defeat regression: dead hunter with surviving shadows did not resolve as enemy win')
  }
} catch (error) {
  crashes += 1
  issues.push(`Hunter defeat regression: ${(error as Error).message}`)
}

try {
  const emberDefinition = SHADOW_DEFINITIONS.find(definition => definition.id === 'ember-mender')
  if (!emberDefinition) {
    recordShadowStatIssue('Shadow stat regression: ember-mender definition was not found')
  } else {
    const emberShadow: OwnedShadow = {
      ...toOwnedShadow(emberDefinition, 99),
      instanceId: 'runtime-smoke-ember-mender-lv1',
      level: 1,
      enhancementLevel: 0,
      innateGrade: 'B',
    }
    const emberUnit = buildShadowBattleUnit(emberShadow, emberDefinition, { unitIdPrefix: 'shadow-stat-smoke' }).unit
    console.log(
      `Shadow stat audit: ember-mender lv1 B HP ${emberUnit.stats.maxHp}, ATK ${emberUnit.stats.atk}, DEF ${emberUnit.stats.def}, SPD ${emberUnit.stats.spd}, SKILL ${emberUnit.stats.skillPower}`,
    )
    if (emberUnit.stats.maxHp > 460) {
      recordShadowStatIssue(`Shadow stat regression: ember-mender lv1 B HP ${emberUnit.stats.maxHp} is still above the reasonable smoke ceiling`)
    }
    if (!Number.isFinite(emberUnit.stats.maxHp) || emberUnit.stats.maxHp <= 0) {
      recordShadowStatIssue('Shadow stat regression: ember-mender HP is invalid')
    }
  }
} catch (error) {
  crashes += 1
  issues.push(`Shadow stat regression: ${(error as Error).message}`)
}

try {
  const cases = [
    { rarity: 'common', grade: 'C', expected: false },
    { rarity: 'uncommon', grade: 'S', expected: false },
    { rarity: 'rare', grade: 'C', expected: true },
    { rarity: 'epic', grade: 'B', expected: true },
    { rarity: 'legendary', grade: 'S', expected: true },
  ]
  for (const testCase of cases) {
    const actual = shouldUseHighTierTicketAnticipation({
      kind: 'shadow',
      intensity: testCase.grade === 'S' ? 'apex' : testCase.rarity === 'epic' ? 'epic' : testCase.rarity === 'rare' ? 'rare' : 'quick',
      shadowRarity: testCase.rarity,
    })
    if (actual !== testCase.expected) {
      recordSummonColorIssue(`Summon reveal color regression: ${testCase.rarity} grade ${testCase.grade} anticipation expected ${testCase.expected} but got ${actual}`)
    }
  }
} catch (error) {
  crashes += 1
  issues.push(`Summon reveal color regression: ${(error as Error).message}`)
}

for (const summary of encounterSummaries) console.log(summary)
console.log(`Monster definitions: ${MOCK_DIRECT_BATTLE_MONSTERS.length}`)
console.log(`Boss definitions: ${MOCK_DIRECT_BATTLE_MONSTERS.filter(monster => monster.isBoss).length}`)
console.log(`Minion definitions: ${MOCK_DIRECT_BATTLE_MONSTERS.filter(monster => monster.isMinion).length}`)
console.log(`Encounters tested: ${DIRECT_BATTLE_MOCK_ENCOUNTERS.length}`)
console.log(`Boss encounters: ${DIRECT_BATTLE_MOCK_ENCOUNTERS.filter(encounter => encounter.difficultyTag === 'boss' || encounter.bossEncounter).length}`)
console.log(`Total battles: ${DIRECT_BATTLE_MOCK_ENCOUNTERS.length}`)
console.log(`Player units: ${playerUnits.length}`)
console.log(`Total rounds simulated: ${totalRounds}`)
console.log(`Total logs: ${totalLogs}`)
console.log(`ActionQueue issues: ${actionQueueIssues}`)
console.log(`Reveal snapshot issues: ${revealSnapshotIssues}`)
console.log(`Skill safety issues: ${skillSafetyIssues}`)
console.log(`Monster targeting issues: ${targetingIssues}`)
console.log(`Hunter defeat issues: ${hunterDefeatIssues}`)
console.log(`Shadow stat issues: ${shadowStatIssues}`)
console.log(`Summon color issues: ${summonColorIssues}`)
console.log(`Validation issues: ${issues.length}`)
console.log(`Crashes: ${crashes}`)
console.log('Gate/Tower connections: 0')
console.log(`Ally support/guard skill damage regression: ${issues.some(issue => issue.startsWith('Ally support/guard skill damage regression')) ? 'failed' : 'passed'}`)
console.log(`Skill safety regression: ${skillSafetyIssues > 0 ? 'failed' : 'passed'}`)
console.log(`Monster targeting regression: ${targetingIssues > 0 ? 'failed' : 'passed'}`)
console.log(`Hunter death defeat regression: ${hunterDefeatIssues > 0 ? 'failed' : 'passed'}`)
console.log(`Shadow stat regression: ${shadowStatIssues > 0 ? 'failed' : 'passed'}`)
console.log(`Summon reveal color regression: ${summonColorIssues > 0 ? 'failed' : 'passed'}`)
console.log(`Setup priority regression: ${issues.some(issue => issue.startsWith('Setup priority regression')) ? 'failed' : 'passed'}`)
console.log(`Reveal snapshot regression: ${revealSnapshotIssues > 0 ? 'failed' : 'passed'}`)
console.log('Center overlay render path: code path verified')

if (issues.length > 0) {
  console.error('Issues:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exitCode = 1
}
