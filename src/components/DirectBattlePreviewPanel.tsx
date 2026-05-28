/**
 * DirectBattlePreviewPanel
 *
 * 12-29I onwards: This component is the MAIN production direct-control battle panel.
 * - GatePanel uses it for the live "직접 조작 게이트 전투" path
 *   (handleDirectGateBattleComplete -> resolveDirectGateBattle).
 * - InfiniteTowerPanel uses it for the live "무한의 탑 직접 조작 전투" path
 *   (handleDirectTowerBattleComplete -> resolveDirectTowerBattle).
 *
 * The "Preview" name is historical (12-29F/G). The file name is preserved to keep
 * existing imports stable. Treat this as the production direct battle panel.
 * Cancellation grants no reward; victory/defeat are routed through existing
 * Gate/Tower reward + progression actions exactly once per battle.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { Activity, Bot, List, Play, RotateCcw, Shield, Sparkles, Swords, Target, X, Eye, ShieldAlert } from 'lucide-react'
import type {
  ActiveConsumableEffect,
  EquipmentState,
  HunterState,
  Item,
  OwnedShadow,
} from '../lib/types'
import { buildBattleActors } from '../lib/battlePresentation'
import { Battlefield2DView } from './battle/Battlefield2DView'
import { BattleArenaOverlay } from './battle/BattleArenaOverlay'
import { getShadowDefinition } from '../lib/shadows'
import { buildHunterBattleUnit, buildShadowBattleUnits, validateBattleUnit } from '../lib/battleUnits'
import {
  DIRECT_BATTLE_MOCK_ENCOUNTERS,
  buildDirectBattleEncounterParty,
} from '../lib/directBattleEncounters'
import {
  formatDirectBattleWinnerKo,
  getDirectBattleDifficultyLabelKo,
  getDirectBattleEncounterLabelKo,
  getDirectBattleEncounterShortLabelKo,
  getDirectBattleLessonLabelKo,
  getDirectBattleRoleLabelKo,
} from '../lib/directBattleLabels'
import {
  chooseMockPlayerActions,
  createDirectBattleState,
  executeDirectBattleRound,
} from '../lib/directBattleRuntime'
import { CinematicLogOverlay, type CinematicLogData, type CinematicLogTone } from './CinematicLogOverlay'
import { DIRECT_BATTLE_STATUS_LABELS_KO } from '../lib/directBattleTypes'
import type {
  BattleActionDefinition,
  BattleTargetType,
  BattleUnit,
  DirectBattleActionSelection,
  DirectBattleLogEntry,
  DirectBattleState,
} from '../lib/directBattleTypes'

type ManualSelectionMap = Record<string, DirectBattleActionSelection>

type DirectBattlePreviewState = {
  encounterKey: string
  state: DirectBattleState
  selections: ManualSelectionMap
  issues: string[]
  logs: DirectBattleLogEntry[]
}

type RoundRevealState = {
  steps: DirectBattleRevealStep[]
  index: number
  pendingState: DirectBattleState
  pendingSelections: ManualSelectionMap
  pendingIssues: string[]
  pendingCompletion?: DirectBattlePanelCompletePayload
}

type DirectBattleRevealStep = {
  stepId: string
  log: DirectBattleLogEntry
  cinematicLog: CinematicLogData
  actorUnitId?: string
  targetUnitIds: string[]
  hpBeforeByUnitId: NonNullable<DirectBattleLogEntry['hpBeforeByUnitId']>
  hpAfterByUnitId: NonNullable<DirectBattleLogEntry['hpAfterByUnitId']>
  statusBeforeByUnitId?: DirectBattleLogEntry['statusBeforeByUnitId']
  statusAfterByUnitId?: DirectBattleLogEntry['statusAfterByUnitId']
  damageAmount?: number
  healAmount?: number
  effectKind?: DirectBattleLogEntry['effectKind']
  actionCue?: string
  timing?: DirectBattleLogEntry['timing']
}

export type DirectBattlePanelOutcome = 'victory' | 'defeat' | 'cancelled'

export interface DirectBattlePanelCompletePayload {
  outcome: DirectBattlePanelOutcome
  encounterKey: string
  state: DirectBattleState
  logs: DirectBattleLogEntry[]
  rounds: number
}

export interface DirectBattlePreviewPanelProps {
  title: string
  note: string
  hunter: HunterState
  items: Item[]
  equipment: EquipmentState
  activeConsumableEffects: ActiveConsumableEffect[]
  equippedShadows: OwnedShadow[]
  recommendedEncounterKey?: string
  enemyBaseLevel?: number
  contextStats?: Array<{ label: string; value: string | number }>
  autoStart?: boolean
  allowEncounterSelection?: boolean
  startButtonLabel?: string
  restartButtonLabel?: string
  cancelButtonLabel?: string
  onBattleComplete?: (payload: DirectBattlePanelCompletePayload) => void
}

const enemyTargetTypes = new Set<BattleTargetType>([
  'single_enemy',
  'lowest_hp_enemy',
  'highest_threat_enemy',
  'boss',
  'minion',
  'front_lane',
  'rear_lane',
])

const allyTargetTypes = new Set<BattleTargetType>([
  'single_ally',
  'lowest_hp_ally',
])

const cloneBattleState = (state: DirectBattleState): DirectBattleState => ({
  ...state,
  units: state.units.map(unit => ({
    ...unit,
    stats: { ...unit.stats },
    statusEffects: unit.statusEffects.map(status => ({ ...status })),
    cooldowns: { ...unit.cooldowns },
    actionList: unit.actionList.map(action => ({ ...action })),
    passiveList: unit.passiveList.map(action => ({ ...action })),
    metadata: { ...unit.metadata, tags: unit.metadata.tags ? [...unit.metadata.tags] : undefined },
  })),
  actionQueue: state.actionQueue.map(action => ({ ...action, targetIds: [...action.targetIds] })),
  logs: state.logs.map(log => ({
    ...log,
    targetUnitIds: log.targetUnitIds ? [...log.targetUnitIds] : undefined,
    hpBeforeByUnitId: log.hpBeforeByUnitId ? { ...log.hpBeforeByUnitId } : undefined,
    hpAfterByUnitId: log.hpAfterByUnitId ? { ...log.hpAfterByUnitId } : undefined,
    statusBeforeByUnitId: log.statusBeforeByUnitId ? { ...log.statusBeforeByUnitId } : undefined,
    statusAfterByUnitId: log.statusAfterByUnitId ? { ...log.statusAfterByUnitId } : undefined,
  })),
})

const isAlive = (unit: BattleUnit): boolean =>
  unit.stats.currentHp > 0

const livingUnits = (state: DirectBattleState, team?: BattleUnit['team']): BattleUnit[] =>
  state.units.filter(unit => isAlive(unit) && (!team || unit.team === team))

const findUnit = (state: DirectBattleState, unitId?: string): BattleUnit | undefined =>
  unitId ? state.units.find(unit => unit.unitId === unitId) : undefined

const lowestHpUnit = (units: BattleUnit[]): BattleUnit | undefined =>
  [...units].sort((a, b) => (a.stats.currentHp / a.stats.maxHp) - (b.stats.currentHp / b.stats.maxHp))[0]

const firstUsableAction = (unit: BattleUnit, actionType: BattleActionDefinition['actionType']): BattleActionDefinition | undefined =>
  unit.actionList.find(action => action.actionType === actionType && (unit.cooldowns[action.actionId] ?? 0) <= 0)

const actionByType = (unit: BattleUnit, actionType: BattleActionDefinition['actionType']): BattleActionDefinition | undefined =>
  firstUsableAction(unit, actionType) ?? unit.actionList.find(action => action.actionType === actionType)

const getBasicAction = (unit: BattleUnit): BattleActionDefinition | undefined =>
  actionByType(unit, 'basic')

const getGuardAction = (unit: BattleUnit): BattleActionDefinition | undefined =>
  actionByType(unit, 'guard')

const getSkillActions = (unit: BattleUnit): BattleActionDefinition[] =>
  unit.actionList.filter(action => action.actionType === 'skill')

const getPreferredSkillAction = (
  unit: BattleUnit,
  selection?: DirectBattleActionSelection,
): BattleActionDefinition | undefined => {
  const selectedSkill = unit.actionList.find(action => action.actionId === selection?.actionId && action.actionType === 'skill')
  if (selectedSkill) return selectedSkill
  return firstUsableAction(unit, 'skill') ?? getSkillActions(unit)[0]
}

const getPrimaryActions = (
  unit: BattleUnit,
  selection?: DirectBattleActionSelection,
): BattleActionDefinition[] => {
  const actions = [
    getBasicAction(unit),
    getPreferredSkillAction(unit, selection),
    getGuardAction(unit),
  ].filter((action): action is BattleActionDefinition => Boolean(action))

  return actions.filter((action, index, all) => all.findIndex(candidate => candidate.actionId === action.actionId) === index)
}

const getVisibleActions = (unit: BattleUnit): BattleActionDefinition[] => {
  const actions = [
    firstUsableAction(unit, 'basic') ?? unit.actionList.find(action => action.actionType === 'basic'),
    ...getSkillActions(unit),
    firstUsableAction(unit, 'guard') ?? unit.actionList.find(action => action.actionType === 'guard'),
  ].filter((action): action is BattleActionDefinition => Boolean(action))

  return actions.filter((action, index, all) => all.findIndex(candidate => candidate.actionId === action.actionId) === index)
}

const getActionLabelKo = (action: BattleActionDefinition): string => {
  if (action.actionType === 'basic') return '공격'
  if (action.actionType === 'guard') return '방어'
  if (action.actionType === 'skill') return action.label ? `스킬: ${action.label}` : '스킬'
  return action.label
}

const getActionShortLabelKo = (action: BattleActionDefinition): string => {
  if (action.actionType === 'basic') return '공격'
  if (action.actionType === 'guard') return '방어'
  if (action.actionType === 'skill') return action.label ? `스킬: ${action.label}` : '스킬'
  return action.label
}

const hasHangul = (text?: string): boolean =>
  Boolean(text && /[가-힣]/.test(text))

const enemyTargetDescriptionTypes = new Set<BattleTargetType>([
  'single_enemy',
  'all_enemies',
  'lowest_hp_enemy',
  'highest_threat_enemy',
  'boss',
  'minion',
  'front_lane',
  'rear_lane',
])

const getActionDescriptionKo = (action: BattleActionDefinition): string => {
  if (hasHangul(action.description)) return action.description as string
  const targetsEnemy = enemyTargetDescriptionTypes.has(action.targetType)
  const targetsAlly = action.targetType === 'single_ally' || action.targetType === 'all_allies' || action.targetType === 'lowest_hp_ally'
  const targetsSelf = action.targetType === 'self'

  if (action.actionType === 'basic') return '단일 적에게 ATK 기반 피해를 줍니다.'
  if (action.actionType === 'wait') return '행동을 늦추고 다음 공격을 준비합니다.'
  if (action.actionType === 'guard') {
    return action.targetType === 'single_ally'
      ? '아군의 피해를 줄이고 보호합니다.'
      : '방어 태세를 취해 받는 피해를 줄입니다.'
  }
  if (action.actionType === 'skill') {
    if (targetsSelf && (action.effectKind === 'guard' || action.effectKind === 'survival')) return '방어 태세를 취합니다.'
    if (targetsAlly && (action.effectKind === 'guard' || action.effectKind === 'survival')) return '아군의 피해를 줄이고 보호합니다.'
    if (targetsAlly && (action.effectKind === 'support' || action.effectKind === 'cooldown')) return '아군을 회복하거나 강화합니다.'
    if (targetsAlly && (action.effectKind === 'synergy' || action.effectKind === 'stat_shift')) return '아군의 전투 흐름을 강화합니다.'
    if (targetsEnemy && (action.effectKind === 'control' || action.effectKind === 'stat_shift')) return '적에게 약화 효과를 부여합니다.'
    if (targetsEnemy && action.effectKind === 'bossing') return '보스/정예 대상에게 효과적입니다.'
    if (targetsEnemy && (action.effectKind === 'damage' || action.effectKind === 'hybrid')) {
      return action.targetType === 'all_enemies'
        ? '적 전체에게 SKILL 기반 피해를 줍니다.'
        : '단일 적에게 SKILL 기반 피해를 줍니다.'
    }
    if (targetsEnemy && action.effectKind === 'basic') return '단일 적에게 피해를 줍니다.'
    if (targetsAlly) return '아군을 회복하거나 강화합니다.'
    if (targetsEnemy) return '적에게 피해 또는 약화 효과를 줍니다.'
    return '이 유닛의 대표 스킬을 사용합니다.'
  }
  if (action.actionType === 'support') return '아군을 회복하거나 강화합니다.'
  return '이 유닛의 대표 스킬을 사용합니다.'
}

const getTargetTypeLabelKo = (action: BattleActionDefinition): string => {
  if (action.targetType === 'self') return '자신'
  if (action.targetType === 'single_ally') return '아군 1명'
  if (action.targetType === 'all_allies') return '아군 전체'
  if (action.targetType === 'all_enemies') return '적 전체'
  if (action.targetType === 'lowest_hp_ally') return 'HP 낮은 아군'
  if (action.targetType === 'lowest_hp_enemy') return 'HP 낮은 적'
  if (action.targetType === 'boss') return '보스 우선'
  if (action.targetType === 'minion') return '하수인 우선'
  if (action.targetType === 'front_lane') return '전열 우선'
  if (action.targetType === 'rear_lane') return '후열 우선'
  return '적 1명'
}

const getCooldownTextKo = (unit: BattleUnit, action: BattleActionDefinition): string | undefined => {
  const remaining = unit.cooldowns[action.actionId] ?? 0
  if (remaining > 0) return `재사용 대기 ${remaining}`
  if (action.cooldown && action.cooldown > 0) return `쿨다운 ${action.cooldown}`
  return undefined
}

const getTargetCandidates = (
  state: DirectBattleState,
  actor: BattleUnit,
  action: BattleActionDefinition,
): BattleUnit[] => {
  if (action.targetType === 'self') return [actor]
  if (action.targetType === 'all_allies' || allyTargetTypes.has(action.targetType)) {
    return livingUnits(state, actor.team)
  }
  if (action.targetType === 'all_enemies' || enemyTargetTypes.has(action.targetType)) {
    return livingUnits(state, actor.team === 'player' ? 'enemy' : 'player')
  }
  return livingUnits(state, actor.team === 'player' ? 'enemy' : 'player')
}

const getDefaultTargets = (
  state: DirectBattleState,
  actor: BattleUnit,
  action: BattleActionDefinition,
): string[] => {
  const candidates = getTargetCandidates(state, actor, action)
  if (action.targetType === 'self') return [actor.unitId]
  if (action.targetType === 'all_allies' || action.targetType === 'all_enemies') return candidates.map(unit => unit.unitId)
  if (action.actionType === 'guard') return [actor.unitId]
  if (action.targetType === 'boss') return [(candidates.find(unit => unit.unitType === 'boss') ?? candidates[0])?.unitId].filter(Boolean) as string[]
  if (action.targetType === 'minion') return [(candidates.find(unit => unit.unitType === 'minion') ?? candidates[0])?.unitId].filter(Boolean) as string[]
  return [(lowestHpUnit(candidates) ?? candidates[0])?.unitId].filter(Boolean) as string[]
}

const needsManualTarget = (action: BattleActionDefinition): boolean =>
  action.actionType !== 'guard' &&
  action.targetType !== 'self' &&
  action.targetType !== 'all_allies' &&
  action.targetType !== 'all_enemies'

const buildBasicSelections = (state: DirectBattleState): ManualSelectionMap => {
  const selections: ManualSelectionMap = {}
  for (const unit of livingUnits(state, 'player')) {
    const action = firstUsableAction(unit, 'basic') ?? getVisibleActions(unit)[0]
    if (!action) continue
    selections[unit.unitId] = {
      actorUnitId: unit.unitId,
      actionId: action.actionId,
      targetIds: getDefaultTargets(state, unit, action),
    }
  }
  return selections
}

const normalizeSelections = (
  state: DirectBattleState,
  previousSelections: ManualSelectionMap,
): ManualSelectionMap => {
  const selections: ManualSelectionMap = {}
  for (const unit of livingUnits(state, 'player')) {
    const previous = previousSelections[unit.unitId]
    const action = unit.actionList.find(candidate => candidate.actionId === previous?.actionId && (unit.cooldowns[candidate.actionId] ?? 0) <= 0)
      ?? firstUsableAction(unit, 'basic')
      ?? getVisibleActions(unit)[0]
    if (!action) continue

    const validTargets = (previous?.targetIds ?? [])
      .map(targetId => findUnit(state, targetId))
      .filter((target): target is BattleUnit => Boolean(target && isAlive(target)))
    selections[unit.unitId] = {
      actorUnitId: unit.unitId,
      actionId: action.actionId,
      targetIds: validTargets.length > 0 ? validTargets.map(target => target.unitId) : getDefaultTargets(state, unit, action),
    }
  }
  return selections
}

const selectionList = (state: DirectBattleState, selections: ManualSelectionMap): DirectBattleActionSelection[] =>
  livingUnits(state, 'player').map(unit => selections[unit.unitId]).filter((selection): selection is DirectBattleActionSelection => Boolean(selection))

const validatePreviewState = (
  state: DirectBattleState,
  buildWarnings: string[] = [],
): string[] => {
  const hpIssues = state.units.flatMap(unit => {
    const issues: string[] = []
    if (!Number.isFinite(unit.stats.currentHp)) issues.push(`${unit.displayName} 현재 HP가 유효하지 않습니다.`)
    if (unit.stats.currentHp < 0) issues.push(`${unit.displayName} 현재 HP가 0보다 작습니다.`)
    if (unit.stats.currentHp > unit.stats.maxHp) issues.push(`${unit.displayName} 현재 HP가 최대 HP보다 큽니다.`)
    return issues
  })

  return [
    ...buildWarnings,
    ...state.units.flatMap(unit => validateBattleUnit(unit)),
    ...hpIssues,
    ...(['player', 'enemy', 'none'].includes(state.winner) ? [] : [`알 수 없는 승리 진영: ${state.winner}`]),
  ]
}

const getPanelOutcome = (state: DirectBattleState): DirectBattlePanelOutcome => {
  if (state.winner === 'player') return 'victory'
  if (state.winner === 'enemy') return 'defeat'
  return 'cancelled'
}

const findActionForLog = (
  state: DirectBattleState,
  log: DirectBattleLogEntry,
): BattleActionDefinition | undefined => {
  const actor = findUnit(state, log.actorUnitId)
  if (!actor) return undefined
  return actor.actionList.find(action => action.actionId === log.actionId || action.actionCue === log.actionCue || action.animationCue === log.animationCue)
}

const formatBattleLogKo = (
  log: DirectBattleLogEntry,
  state: DirectBattleState,
): DirectBattleLogEntry => {
  const actor = findUnit(state, log.actorUnitId)
  const target = findUnit(state, log.targetUnitIds?.[0])
  const action = findActionForLog(state, log)
  const actorName = actor?.displayName ?? '전투'
  const targetName = target?.displayName ?? '대상'
  const actionName = action?.label ?? (log.actionCue ? log.actionCue : '행동')
  const value = Math.max(0, Math.round(log.value ?? 0))

  let message = log.message
  if (log.eventType === 'damage') {
    message = `${actorName}이/가 ${actionName}을 사용했다. ${targetName}에게 ${value} 피해!`
  } else if (log.eventType === 'heal') {
    message = `${actorName}이/가 ${targetName}의 HP를 ${value} 회복했다.`
  } else if (log.eventType === 'status' && action?.actionType === 'guard') {
    message = target && target.unitId !== actor?.unitId
      ? `${actorName}이/가 ${targetName}을 보호했다.`
      : `${actorName}이/가 방어 태세를 갖췄다.`
  } else if (log.eventType === 'status' && (action?.effectKind === 'guard' || action?.effectKind === 'survival')) {
    message = `${actorName}이/가 ${actionName}으로 ${targetName}의 방어 태세를 강화했다.`
  } else if (log.eventType === 'status') {
    if (log.message.startsWith('[PASSIVE]')) {
      message = log.message
    } else {
      message = `${actorName}이/가 ${actionName} 효과를 발동했다.`
    }
  } else if (log.eventType === 'reaction') {
    message = `${actorName}이/가 ${targetName}을 보호하며 ${value} 피해를 대신 받았다.`
  } else if (log.eventType === 'fizzle') {
    message = `${actorName}의 ${actionName}은/는 대상이 없어 빗나갔다.`
  } else if (log.eventType === 'result') {
    message = state.winner === 'player'
      ? '전투가 끝났다. 아군 승리!'
      : state.winner === 'enemy'
        ? '전투가 끝났다. 패배...'
        : '전투가 끝났다. 결과 없음.'
  }

  return { ...log, message }
}

const directLogToneToCinematicTone = (
  log: DirectBattleLogEntry,
  actor?: BattleUnit,
  action?: BattleActionDefinition,
): CinematicLogTone => {
  if (log.eventType === 'result') return 'result'
  if (log.eventType === 'heal') return 'reward'
  if (log.eventType === 'reaction') return 'defense'
  if (log.eventType === 'status' || action?.actionType === 'guard' || action?.effectKind === 'guard' || action?.effectKind === 'survival') return 'defense'
  if (actor?.team === 'enemy') return 'monster'
  if (actor?.unitType === 'shadow') return 'shadow'
  if (action?.actionType === 'skill') return 'player'
  return 'command'
}

const directLogBadge = (
  log: DirectBattleLogEntry,
  tone: CinematicLogTone,
  action?: BattleActionDefinition,
): string => {
  if (log.eventType === 'result') return 'RESULT'
  if (log.timing === 'passive_trigger' || log.actionId?.includes(':passive:') || action?.actionType === 'passive') return 'PASSIVE'
  if (log.eventType === 'damage') return action?.actionType === 'skill' ? 'SKILL' : 'ATTACK'
  if (log.eventType === 'heal') return 'HEAL'
  if (log.eventType === 'status' || log.eventType === 'reaction') return 'DEFENSE'
  if (log.eventType === 'fizzle') return 'MISS'
  return tone.toUpperCase()
}

const directLogToCinematicLog = (
  log: DirectBattleLogEntry,
  state: DirectBattleState,
  index: number,
): CinematicLogData => {
  const displayLog = formatBattleLogKo(log, state)
  const actor = findUnit(state, log.actorUnitId)
  const target = findUnit(state, log.targetUnitIds?.[0])
  const action = findActionForLog(state, log)
  const actorName = actor?.displayName ?? '전투'
  const targetName = target?.displayName ?? '대상'
  const actionName = action?.label ?? '행동'
  const value = Math.max(0, Math.round(log.value ?? 0))
  const actorIsEnemy = actor?.team === 'enemy'
  const tone = directLogToneToCinematicTone(log, actor, action)
  const targetHpAfter = target ? log.hpAfterByUnitId?.[target.unitId] : undefined

  if (log.eventType === 'result') {
    return {
      id: `direct-cinematic-${state.battleId}-${log.round}-${index}-result`,
      tone,
      badge: 'RESULT',
      title: state.winner === 'player' ? '아군 승리!' : state.winner === 'enemy' ? '패배...' : '전투 종료',
      body: '전투가 끝났습니다.',
    }
  }

  if (log.eventType === 'damage') {
    return {
      id: `direct-cinematic-${state.battleId}-${log.round}-${index}-${log.actorUnitId ?? 'system'}`,
      tone,
      badge: directLogBadge(log, tone, action),
      title: action?.actionType === 'skill'
        ? `${actorName}이/가 ${actionName}을 사용했다!`
        : actorIsEnemy
          ? `${actorName}의 공격!`
          : `${actorName}의 공격!`,
      body: `${targetName}에게 ${value} 피해`,
      visualDelta: {
        target: target?.team === 'enemy' ? 'monster' : 'player',
        hpChange: -value,
        newHp: targetHpAfter ? targetHpAfter.currentHp : target ? Math.max(0, Math.round(target.stats.currentHp)) : undefined,
        maxHp: targetHpAfter ? targetHpAfter.maxHp : target ? Math.round(target.stats.maxHp) : undefined,
      },
    }
  }

  if (log.eventType === 'heal') {
    return {
      id: `direct-cinematic-${state.battleId}-${log.round}-${index}-${log.actorUnitId ?? 'heal'}`,
      tone,
      badge: directLogBadge(log, tone, action),
      title: `${actorName}의 지원!`,
      body: `${targetName} HP ${value} 회복`,
      visualDelta: {
        target: target?.team === 'enemy' ? 'monster' : 'player',
        hpChange: value,
        newHp: targetHpAfter ? targetHpAfter.currentHp : target ? Math.round(target.stats.currentHp) : undefined,
        maxHp: targetHpAfter ? targetHpAfter.maxHp : target ? Math.round(target.stats.maxHp) : undefined,
      },
    }
  }

  if (log.eventType === 'reaction') {
    return {
      id: `direct-cinematic-${state.battleId}-${log.round}-${index}-${log.actorUnitId ?? 'reaction'}`,
      tone,
      badge: directLogBadge(log, tone, action),
      title: '방어가 피해를 줄였다!',
      body: displayLog.message,
    }
  }

  if (log.eventType === 'status') {
    return {
      id: `direct-cinematic-${state.battleId}-${log.round}-${index}-${log.actorUnitId ?? 'status'}`,
      tone,
      badge: directLogBadge(log, tone, action),
      title: action?.actionType === 'guard'
        ? `${actorName}이/가 방어 태세를 갖췄다!`
        : action?.effectKind === 'guard' || action?.effectKind === 'survival'
          ? `${actorName}이/가 ${actionName}을 사용했다!`
          : `${actorName}이/가 ${actionName}을 사용했다!`,
      body: action?.actionType === 'guard' || action?.effectKind === 'guard' || action?.effectKind === 'survival'
        ? `${targetName}의 피해가 감소합니다.`
        : displayLog.message,
    }
  }

  return {
    id: `direct-cinematic-${state.battleId}-${log.round}-${index}-${log.actorUnitId ?? 'system'}`,
    tone,
    badge: directLogBadge(log, tone, action),
    title: displayLog.message,
  }
}

const formatBattleLogsKo = (
  logs: DirectBattleLogEntry[],
  state: DirectBattleState,
): DirectBattleLogEntry[] =>
  logs.map(log => formatBattleLogKo(log, state))

const buildRevealSteps = (
  logs: DirectBattleLogEntry[],
  state: DirectBattleState,
): DirectBattleRevealStep[] =>
  logs.map((log, index) => {
    const hpBeforeByUnitId = log.hpBeforeByUnitId ?? {}
    const hpAfterByUnitId = log.hpAfterByUnitId ?? {}
    const damageAmount = log.eventType === 'damage' || log.eventType === 'reaction' ? Math.max(0, Math.round(log.value ?? 0)) : undefined
    const healAmount = log.eventType === 'heal' ? Math.max(0, Math.round(log.value ?? 0)) : undefined
    return {
      stepId: `direct-reveal-${state.battleId}-${log.round}-${index}-${log.actorUnitId ?? 'system'}-${log.eventType}`,
      log,
      cinematicLog: directLogToCinematicLog(log, state, index),
      actorUnitId: log.actorUnitId,
      targetUnitIds: log.targetUnitIds ?? [],
      hpBeforeByUnitId,
      hpAfterByUnitId,
      statusBeforeByUnitId: log.statusBeforeByUnitId,
      statusAfterByUnitId: log.statusAfterByUnitId,
      damageAmount,
      healAmount,
      effectKind: log.effectKind,
      actionCue: log.actionCue,
      timing: log.timing,
    }
  })

const applyRevealStepResultToState = (
  state: DirectBattleState,
  step: DirectBattleRevealStep,
): DirectBattleState => {
  const nextState = cloneBattleState(state)
  for (const [unitId, hpAfter] of Object.entries(step.hpAfterByUnitId)) {
    const unit = nextState.units.find(candidate => candidate.unitId === unitId)
    if (!unit) continue
    unit.stats.currentHp = Math.max(0, Math.min(unit.stats.maxHp, hpAfter.currentHp))
  }
  if (step.statusAfterByUnitId) {
    for (const [unitId, statuses] of Object.entries(step.statusAfterByUnitId)) {
      const unit = nextState.units.find(candidate => candidate.unitId === unitId)
      if (!unit) continue
      unit.statusEffects = statuses.map(status => ({
        statusId: status.statusId,
        definitionId: status.type,
        name: DIRECT_BATTLE_STATUS_LABELS_KO[status.type] ?? status.type,
        type: status.type,
        sourceUnitId: status.sourceUnitId,
        targetUnitId: unitId,
        durationRounds: status.durationRounds,
        stackCount: status.stackCount,
        maxStacks: Math.max(1, status.stackCount),
        effectValue: status.effectValue,
        timing: step.timing ?? 'normal_action',
      }))
    }
  }
  return nextState
}

const prepareRevealDisplayState = (
  beforeState: DirectBattleState,
  pendingState: DirectBattleState,
): DirectBattleState => ({
  ...cloneBattleState(beforeState),
  round: pendingState.round,
  status: pendingState.status === 'finished' ? 'in_progress' : pendingState.status,
  actionQueue: pendingState.actionQueue.map(action => ({ ...action, targetIds: [...action.targetIds] })),
})

function PreviewStatPill({ label, value }: { label: string | number; value: string | number }) {
  return (
    <div className="bg-ink-900/50 border border-white/10 rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1 text-center sm:text-left min-w-0">
      <div className="text-[8px] sm:text-[9px] system-text text-white/35 truncate leading-tight">{label}</div>
      <div className="text-[10px] sm:text-xs font-bold text-white/80 truncate leading-normal">{value}</div>
    </div>
  )
}

export function DirectBattlePreviewPanel({
  title,
  note,
  hunter,
  items,
  equipment,
  activeConsumableEffects,
  equippedShadows,
  recommendedEncounterKey = 'small_duo',
  enemyBaseLevel,
  contextStats = [],
  autoStart = false,
  allowEncounterSelection = true,
  startButtonLabel = '전투 시작',
  restartButtonLabel = '새 전투 시작',
  cancelButtonLabel = '전투 취소',
  onBattleComplete,
}: DirectBattlePreviewPanelProps) {
  const autoStartedRef = useRef(false)
  const revealApplyTimersRef = useRef<number[]>([])
  const safeRecommendedKey = DIRECT_BATTLE_MOCK_ENCOUNTERS.some(encounter => encounter.encounterKey === recommendedEncounterKey)
    ? recommendedEncounterKey
    : 'small_duo'
  const [encounterKey, setEncounterKey] = useState(safeRecommendedKey)
  const [preview, setPreview] = useState<DirectBattlePreviewState | undefined>()
  const [roundReveal, setRoundReveal] = useState<RoundRevealState | undefined>()
  const [showDetailed, setShowDetailed] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<'normal' | 'fast'>('normal')
  const [overlayOpen, setOverlayOpen] = useState(false)
  const selectedEncounter = DIRECT_BATTLE_MOCK_ENCOUNTERS.find(encounter => encounter.encounterKey === encounterKey)
    ?? DIRECT_BATTLE_MOCK_ENCOUNTERS[0]
  const previewShadows = equippedShadows.slice(0, 3)
  const canStartBattle = previewShadows.length > 0
  const isRevealingRound = Boolean(roundReveal)

  // Memoized 2.5D visual action steps mapping
  const currentRevealStep = roundReveal && roundReveal.steps[roundReveal.index - 1]
  
  const latestAction = useMemo(() => {
    if (!currentRevealStep) return undefined
    const log = currentRevealStep.log
    const val = log.value ?? 0
    let kind = 'attack'
    
    const isShadowAbility = log.actionId?.includes(':skill:') || log.actionId?.includes(':passive:')
    
    if (log.eventType === 'heal') kind = 'heal'
    else if (log.eventType === 'status') {
      const isGuard = log.actionCue === 'guard' || log.animationCue?.includes('guard')
      kind = isGuard ? 'guard' : isShadowAbility ? 'shadow' : 'magic'
    } else if (log.eventType === 'reaction') {
      kind = 'guard'
    } else if (isShadowAbility) {
      kind = 'shadow'
    } else if (log.eventType === 'damage' && (log.actionCue?.includes('shadow') || log.animationCue?.includes('shadow'))) {
      kind = 'shadow'
    }
    
    return {
      actorId: log.actorUnitId,
      targetIds: log.targetUnitIds ?? [],
      kind,
      amount: val > 0 ? Math.round(val) : undefined,
      text: log.message,
      isCrit: Boolean((log as any).isCrit),
      actionId: log.actionId,
      actionType: log.eventType,
    }
  }, [currentRevealStep])

  const battlefieldPhase = useMemo(() => {
    if (roundReveal) return 'acting'
    if (preview?.state.isFinished) {
      if (preview.state.winner === 'player') return 'victory'
      if (preview.state.winner === 'enemy') return 'defeat'
      return 'cancelled'
    }
    return 'idle'
  }, [preview, roundReveal])

  const playerUnits = useMemo(() => preview ? livingUnits(preview.state, 'player') : [], [preview])
  const enemyUnits = useMemo(() => preview ? livingUnits(preview.state, 'enemy') : [], [preview])

  useEffect(() => {
    setEncounterKey(safeRecommendedKey)
    setPreview(undefined)
    setRoundReveal(undefined)
    autoStartedRef.current = false
  }, [safeRecommendedKey])

  useEffect(() => () => {
    for (const timer of revealApplyTimersRef.current) window.clearTimeout(timer)
    revealApplyTimersRef.current = []
  }, [])

  const startBattle = () => {
    setRoundReveal(undefined)
    if (!canStartBattle) {
      setPreview(undefined)
      return
    }

    const shadowDefinitions = previewShadows
      .map(shadow => getShadowDefinition(shadow.definitionId))
      .filter((definition): definition is NonNullable<typeof definition> => Boolean(definition))
    const hunterBuild = buildHunterBattleUnit(hunter, {
      items,
      equipment,
      activeConsumableEffects,
      unitId: 'direct-preview-hunter',
    })
    const shadowBuilds = buildShadowBattleUnits(previewShadows, shadowDefinitions, {
      unitIdPrefix: 'direct-preview-shadow',
    })
    const enemyBuild = buildDirectBattleEncounterParty(encounterKey, enemyBaseLevel)
    const units = [hunterBuild.unit, ...shadowBuilds.map(build => build.unit), ...enemyBuild.units]
    const state = createDirectBattleState(units, {
      battleId: `direct-manual-preview-${encounterKey}`,
      maxRounds: Math.max(6, selectedEncounter.maxRounds),
    })
    const buildWarnings = [
      ...hunterBuild.warnings,
      ...shadowBuilds.flatMap(build => build.warnings),
      ...enemyBuild.warnings,
    ]

    setPreview({
      encounterKey,
      state,
      selections: buildBasicSelections(state),
      issues: validatePreviewState(state, buildWarnings),
      logs: state.logs.slice(-10),
    })
    setOverlayOpen(true)
  }

  useEffect(() => {
    if (!autoStart || preview || !canStartBattle || autoStartedRef.current) return
    autoStartedRef.current = true
    startBattle()
  })

  const finishRoundReveal = (reveal: RoundRevealState) => {
    for (const timer of revealApplyTimersRef.current) window.clearTimeout(timer)
    revealApplyTimersRef.current = []
    setPreview(current => current
      ? {
          ...current,
          state: reveal.pendingState,
          selections: reveal.pendingSelections,
          issues: reveal.pendingIssues,
          logs: formatBattleLogsKo(reveal.pendingState.logs.slice(-10), reveal.pendingState),
        }
      : current)
    setRoundReveal(undefined)
    if (reveal.pendingCompletion) {
      onBattleComplete?.({
        ...reveal.pendingCompletion,
        logs: formatBattleLogsKo(reveal.pendingCompletion.logs, reveal.pendingCompletion.state),
      })
    }
  }

  const handleRevealLogChange = (_log: CinematicLogData, index: number) => {
    if (!roundReveal) return
    const step = roundReveal.steps[index]
    if (!step) return
    setPreview(current => {
      if (!current) return current
      const displayLog = formatBattleLogKo(
        step.log,
        step.log.eventType === 'result' ? roundReveal.pendingState : current.state,
      )
      const nextState = cloneBattleState(current.state)
      nextState.logs = [...current.state.logs, displayLog]
      return {
        ...current,
        state: nextState,
        logs: nextState.logs.slice(-10),
      }
    })
    const applyDelay = playbackSpeed === 'normal' ? 950 : 500
    const applyTimer = window.setTimeout(() => {
      setPreview(current => {
        if (!current) return current
        return {
          ...current,
          state: applyRevealStepResultToState(current.state, step),
        }
      })
    }, applyDelay)
    revealApplyTimersRef.current.push(applyTimer)
    setRoundReveal(current => current ? { ...current, index: Math.max(current.index, index + 1) } : current)
  }

  const handleRevealComplete = () => {
    if (!roundReveal) return
    finishRoundReveal(roundReveal)
  }

  const applySelections = (updater: (current: ManualSelectionMap, state: DirectBattleState) => ManualSelectionMap) => {
    if (isRevealingRound) return
    setPreview(current => current
      ? {
          ...current,
          selections: updater(current.selections, current.state),
        }
      : current)
  }

  const selectAction = (actor: BattleUnit, action: BattleActionDefinition) => {
    applySelections((current, state) => ({
      ...current,
      [actor.unitId]: {
        actorUnitId: actor.unitId,
        actionId: action.actionId,
        targetIds: getDefaultTargets(state, actor, action),
      },
    }))
  }

  const selectTarget = (actor: BattleUnit, target: BattleUnit) => {
    applySelections(current => {
      const selection = current[actor.unitId]
      if (!selection) return current
      return {
        ...current,
        [actor.unitId]: {
          ...selection,
          targetIds: [target.unitId],
        },
      }
    })
  }

  const setAutoSelections = () => {
    if (!preview || preview.state.isFinished || isRevealingRound) return
    const autoSelections = chooseMockPlayerActions(preview.state)
    setPreview({
      ...preview,
      selections: Object.fromEntries(autoSelections.map(selection => [selection.actorUnitId, selection])),
    })
  }

  const executeRound = (mode: 'manual' | 'auto') => {
    if (!preview || preview.state.isFinished || isRevealingRound) return
    if (mode === 'auto') {
      setPlaybackSpeed('fast')
    } else {
      setPlaybackSpeed('normal')
    }
    const state = cloneBattleState(preview.state)
    const selections = mode === 'auto'
      ? chooseMockPlayerActions(state)
      : selectionList(state, normalizeSelections(state, preview.selections))
    const usedSelectionMap: ManualSelectionMap = Object.fromEntries(selections.map(selection => [selection.actorUnitId, selection]))
    const result = executeDirectBattleRound(state, selections)
    const nextState = cloneBattleState(result.state)
    const pendingSelections = normalizeSelections(nextState, usedSelectionMap)
    const pendingIssues = validatePreviewState(nextState)
    const pendingCompletion = !preview.state.isFinished && nextState.isFinished
      ? {
          outcome: getPanelOutcome(nextState),
          encounterKey: preview.encounterKey,
          state: nextState,
          logs: nextState.logs,
          rounds: nextState.round,
        } satisfies DirectBattlePanelCompletePayload
      : undefined
    const revealLogs = result.logs.length > 0
      ? result.logs
      : nextState.logs.slice(preview.state.logs.length)
    const revealSteps = buildRevealSteps(revealLogs, nextState)

    setPreview({
      ...preview,
      state: prepareRevealDisplayState(preview.state, nextState),
      selections: usedSelectionMap,
      issues: pendingIssues,
    })
    setRoundReveal({
      steps: revealSteps,
      index: 0,
      pendingState: nextState,
      pendingSelections,
      pendingIssues,
      pendingCompletion,
    })
  }

  const cancelBattle = () => {
    if (isRevealingRound) return
    if (preview) {
      onBattleComplete?.({
        outcome: 'cancelled',
        encounterKey: preview.encounterKey,
        state: preview.state,
        logs: preview.state.logs,
        rounds: preview.state.round,
      })
    }
    setPreview(undefined)
    setOverlayOpen(false)
  }

  const skipRoundReveal = () => {
    if (!roundReveal) return
    finishRoundReveal(roundReveal)
  }

  const renderUnit = (unit: BattleUnit, tone: 'player' | 'enemy') => {
    const hpRatio = unit.stats.maxHp > 0 ? unit.stats.currentHp / unit.stats.maxHp : 0
    return (
      <div key={unit.unitId} className={clsx(
        'rounded border bg-black/15 px-2.5 py-2',
        tone === 'player' ? 'border-cyan-300/15' : 'border-rose-300/15',
        !isAlive(unit) && 'opacity-45',
      )}>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold text-white/80">{unit.displayName}</span>
          <span className="text-[10px] system-text text-cyan-200/60">{getDirectBattleRoleLabelKo(unit.role)}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded bg-white/10">
          <div
            className={clsx('h-full rounded', tone === 'player' ? 'bg-cyan-300/70' : 'bg-rose-300/70')}
            style={{ width: `${Math.max(0, Math.min(100, hpRatio * 100))}%` }}
          />
        </div>
        <div className="mt-1 text-[10px] text-white/45">
          HP {Math.round(unit.stats.currentHp)} / {Math.round(unit.stats.maxHp)}
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[9px] text-white/45">
          <span>ATK {Math.round(unit.stats.atk)}</span>
          <span>DEF {Math.round(unit.stats.def)}</span>
          <span>SPD {Math.round(unit.stats.spd)}</span>
          <span>SKL {Math.round(unit.stats.skillPower)}</span>
          <span>Lv.{unit.level}</span>
        </div>
      </div>
    )
  }

  const renderActionControls = (unit: BattleUnit) => {
    if (!preview) return null
    const selection = preview.selections[unit.unitId]
    const selectedAction = unit.actionList.find(action => action.actionId === selection?.actionId)
    const candidates = selectedAction ? getTargetCandidates(preview.state, unit, selectedAction) : []
    const selectedTarget = findUnit(preview.state, selection?.targetIds?.[0])
    const skillActions = getSkillActions(unit)
    const primaryActions = getPrimaryActions(unit, selection)
    return (
      <div key={unit.unitId} className="rounded-lg border border-white/5 bg-slate-950/40 p-1.5 sm:p-2.5">
        <div className="mb-1 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black text-cyan-300">{unit.displayName}</span>
            <span className="text-[8px] text-white/35">({getDirectBattleRoleLabelKo(unit.role)})</span>
          </div>
          <div className="text-right text-[8px] text-white/45 font-medium">
            HP {Math.round(unit.stats.currentHp)}/{Math.round(unit.stats.maxHp)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
          {primaryActions.map(action => {
            const isSelected = selection?.actionId === action.actionId
            const isOnCooldown = (unit.cooldowns[action.actionId] ?? 0) > 0
            const cooldownText = getCooldownTextKo(unit, action)
            return (
              <button
                key={action.actionId}
                type="button"
                disabled={isOnCooldown || preview.state.isFinished || isRevealingRound}
                onClick={() => selectAction(unit, action)}
                className={clsx(
                  'flex min-h-[2.2rem] sm:min-h-[2.8rem] min-w-0 flex-col items-center justify-center rounded px-1 py-0.5 text-center text-[9px] sm:text-[10px] font-bold transition disabled:cursor-not-allowed disabled:opacity-30 active:scale-95',
                  isSelected
                    ? 'border-cyan-400/80 bg-cyan-500/20 text-cyan-100 shadow-[0_0_8px_rgba(34,211,238,0.25)]'
                    : 'border-white/5 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/80',
                )}
              >
                <span className="flex w-full min-w-0 items-center justify-center gap-0.5">
                  {action.actionType === 'guard' ? <Shield className="h-2.5 w-2.5 shrink-0 text-amber-400/80" /> : action.actionType === 'skill' ? <Sparkles className="h-2.5 w-2.5 shrink-0 text-cyan-400/80" /> : <Swords className="h-2.5 w-2.5 shrink-0 text-rose-400/80" />}
                  <span className="min-w-0 truncate">{getActionShortLabelKo(action)}</span>
                </span>
                {cooldownText && (
                  <span className={clsx('text-[7.5px] font-medium leading-none scale-90 mt-0.5', isOnCooldown ? 'text-amber-300' : 'text-white/30')}>
                    {cooldownText}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {skillActions.length > 1 && (
          <div className="mt-1 border border-white/5 bg-slate-950/20 p-1 rounded">
            <div className="mb-0.5 text-[8px] text-white/35 font-bold">스킬 선택</div>
            <div className="grid gap-0.5 sm:grid-cols-2">
              {skillActions.map(action => {
                const isSelected = selection?.actionId === action.actionId
                const isOnCooldown = (unit.cooldowns[action.actionId] ?? 0) > 0
                return (
                  <button
                    key={action.actionId}
                    type="button"
                    disabled={isOnCooldown || preview.state.isFinished || isRevealingRound}
                    onClick={() => selectAction(unit, action)}
                    className={clsx(
                      'rounded border px-1 py-0.5 text-left transition text-[9px] disabled:cursor-not-allowed disabled:opacity-30 active:scale-95',
                      isSelected
                        ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-100'
                        : 'border-white/5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70',
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 font-bold">
                      <span className="min-w-0 truncate text-[9px]">{action.label || '스킬'}</span>
                      {isSelected && <span className="shrink-0 text-[7px] text-cyan-300/80">ON</span>}
                    </div>
                    {getCooldownTextKo(unit, action) && (
                      <span className="mt-0.2 block text-[7px] text-amber-200/70">
                        {getCooldownTextKo(unit, action)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-1 border border-white/5 bg-slate-950/20 px-1 py-0.5 text-[8px] text-white/40">
          선택: <span className="text-cyan-300 font-bold">{selectedAction ? getActionLabelKo(selectedAction) : '없음'}</span>
          {selectedTarget && <span className="ml-1 text-white/30">→ {selectedTarget.displayName}</span>}
        </div>

        {selectedAction && needsManualTarget(selectedAction) && (
          <div className="mt-1">
            <div className="mb-0.5 flex items-center gap-1 text-[8px] text-white/35 font-bold">
              <Target className="h-2.5 w-2.5 text-amber-400" />
              타겟 선택
            </div>
            <div className="flex flex-wrap gap-0.5">
              {candidates.map(target => {
                const isSelected = selection?.targetIds?.includes(target.unitId)
                return (
                  <button
                    key={target.unitId}
                    type="button"
                    disabled={!isAlive(target) || preview.state.isFinished || isRevealingRound}
                    onClick={() => selectTarget(unit, target)}
                    className={clsx(
                      'rounded border px-1 py-0.2 text-[8px] transition disabled:cursor-not-allowed disabled:opacity-30 active:scale-95',
                      isSelected
                        ? 'border-amber-400/50 bg-amber-400/10 text-amber-200'
                        : 'border-white/5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70',
                    )}
                  >
                    {target.displayName}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="panel corner-bracket relative overflow-hidden p-4 border-cyan-400/20 bg-cyan-500/5">
        <div className="br" />
        
        {/* 1. 전투 미시작 상태 */}
        {!preview && (
          <>
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-300" />
                  <h3 className="text-sm font-bold text-cyan-100">{title}</h3>
                </div>
                <p className="mt-1 text-xs text-white/45">{note}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={startBattle}
                  disabled={!canStartBattle || isRevealingRound}
                  className="btn border-cyan-400/25 bg-cyan-400/10 text-xs text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" />
                  {startButtonLabel}
                </button>
              </div>
            </div>

            {!canStartBattle && (
              <div className="rounded border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100/75">
                장착된 그림자가 있어야 전투를 시작할 수 있습니다.
              </div>
            )}

            {contextStats.length > 0 && (
              <div className="mb-3 grid gap-2 md:grid-cols-3">
                {contextStats.map(item => (
                  <PreviewStatPill key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            )}

            {allowEncounterSelection ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {DIRECT_BATTLE_MOCK_ENCOUNTERS.map(encounter => (
                  <button
                    key={encounter.encounterKey}
                    type="button"
                    disabled={isRevealingRound}
                    onClick={() => {
                      setEncounterKey(encounter.encounterKey)
                      setPreview(undefined)
                      setRoundReveal(undefined)
                      autoStartedRef.current = false
                    }}
                    className={clsx(
                      'rounded border px-2 py-1 text-[10px] system-text transition',
                      encounterKey === encounter.encounterKey
                        ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100'
                        : 'border-white/10 bg-white/5 text-white/45 hover:text-white/75',
                    )}
                  >
                    <span>{getDirectBattleEncounterShortLabelKo(encounter.encounterKey)}</span>
                    <span className="ml-1 text-white/30">({encounter.encounterKey})</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded border border-cyan-300/15 bg-cyan-300/5 px-3 py-2 text-xs text-cyan-100/70">
                적 조합: {getDirectBattleEncounterLabelKo(encounterKey)}
                <span className="ml-2 text-white/30">({encounterKey})</span>
              </div>
            )}

            <div className="mt-3 rounded border border-white/10 bg-black/10 px-3 py-2 text-xs text-white/50">
              <span className="system-text text-cyan-200/70">{getDirectBattleDifficultyLabelKo(selectedEncounter.difficultyTag)}</span>
              <span className="mx-2 text-white/20">/</span>
              {getDirectBattleLessonLabelKo(selectedEncounter.encounterKey, selectedEncounter.intendedLesson)}
            </div>

            <div className="mt-3 rounded border border-white/10 bg-black/10 px-3 py-2 text-xs text-white/40">
              아직 실행 결과가 없습니다. 전투 시작 후 아군 유닛의 행동과 타겟을 고를 수 있습니다.
            </div>
          </>
        )}

        {/* 2. 전투 진행 중 최소화 요약 카드 */}
        {preview && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-cyan-400/15 pb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-cyan-300 animate-pulse animate-duration-1000" />
                  <h3 className="text-sm font-black text-cyan-100">{title} — 전투 진행 중</h3>
                </div>
                <p className="mt-0.5 text-xs text-white/45">
                  현재 <span className="font-bold text-cyan-300">{preview.state.round}</span> 라운드가 진행 중입니다.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setOverlayOpen(true)}
                  className="btn border-cyan-400/25 bg-cyan-400/10 text-xs text-cyan-100 flex items-center gap-1 py-1 px-3 hover:bg-cyan-400/20 transition"
                >
                  <Eye className="h-3.5 w-3.5" />
                  전투 화면 열기
                </button>
                <button
                  type="button"
                  onClick={cancelBattle}
                  disabled={isRevealingRound}
                  className="btn border-rose-400/25 bg-rose-400/10 text-xs text-rose-100 flex items-center gap-1 py-1 px-3 hover:bg-rose-400/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  전투 포기
                </button>
              </div>
            </div>

            {/* HP summary and status */}
            <div className="grid gap-2 grid-cols-2">
              <div className="rounded border border-cyan-500/15 bg-cyan-950/10 p-2 text-[11px]">
                <div className="text-white/35 font-bold text-[8px] uppercase tracking-wider mb-1">아군 생존자 ({playerUnits.length})</div>
                <div className="flex flex-wrap gap-1">
                  {preview.state.units.filter(u => u.team === 'player').map(unit => {
                    const alive = isAlive(unit)
                    return (
                      <span
                        key={unit.unitId}
                        className={clsx(
                          'rounded-full px-1.5 py-0.5 text-[9px] font-semibold border',
                          alive ? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-200' : 'bg-slate-800 border-slate-700 text-white/30 line-through opacity-50'
                        )}
                      >
                        {unit.displayName}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="rounded border border-rose-500/15 bg-rose-950/10 p-2 text-[11px]">
                <div className="text-white/35 font-bold text-[8px] uppercase tracking-wider mb-1">적군 생존자 ({enemyUnits.length})</div>
                <div className="flex flex-wrap gap-1">
                  {preview.state.units.filter(u => u.team === 'enemy').map(unit => {
                    const alive = isAlive(unit)
                    const isBoss = unit.metadata?.tags?.includes('boss') || unit.role === 'boss'
                    return (
                      <span
                        key={unit.unitId}
                        className={clsx(
                          'rounded-full px-1.5 py-0.5 text-[9px] font-semibold border',
                          alive 
                            ? isBoss ? 'bg-rose-500/20 border-rose-400/40 text-rose-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                            : 'bg-slate-800 border-slate-700 text-white/30 line-through opacity-50'
                        )}
                      >
                        {unit.displayName} {isBoss && '👹'}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Latest Feed preview */}
            {preview.logs.length > 0 && (
              <div className="rounded border border-white/5 bg-black/25 px-2.5 py-1.5 text-[10px] sm:text-[11px] text-white/55 truncate">
                <span className="font-bold text-cyan-300 shrink-0 mr-1.5">LATEST FEED:</span>
                {preview.logs[preview.logs.length - 1].message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. 전체화면 2.5D Battle Overlay Portal */}
      {preview && overlayOpen && (
        <BattleArenaOverlay
          title={title}
          note={note}
          preview={preview}
          roundReveal={roundReveal}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
          isRevealingRound={isRevealingRound}
          battlefieldPhase={battlefieldPhase}
          latestAction={latestAction}
          playerUnits={playerUnits}
          enemyUnits={enemyUnits}
          actors={buildBattleActors(preview.state, latestAction?.actorId, latestAction?.targetIds)}
          skipRoundReveal={skipRoundReveal}
          setAutoSelections={setAutoSelections}
          executeRound={executeRound}
          renderActionControls={renderActionControls}
          cancelBattle={cancelBattle}
          onClose={() => setOverlayOpen(false)}
          showDetailed={showDetailed}
          setShowDetailed={setShowDetailed}
          renderUnit={renderUnit}
          isAlive={isAlive}
          onSelectTarget={(target) => {
            // Find active unit or first controllable player unit to redirect target select
            const activePlayer = playerUnits.find(unit => unit.unitId === latestAction?.actorId) || playerUnits[0]
            if (activePlayer) {
              selectTarget(activePlayer, target)
            }
          }}
          handleRevealLogChange={handleRevealLogChange}
          handleRevealComplete={handleRevealComplete}
        />
      )}
    </>
  )
}
