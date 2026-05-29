import type { HardcoreState, ManualBattleSession } from './types'
import { ensureHardcoreState } from './gateEchoes'

export const isManualBattleSessionPlayerDeath = (session?: ManualBattleSession): boolean =>
  Boolean(
    session &&
      (
        session.playerDeathDetected ||
        session.defeatReason === 'player_dead' ||
        session.player.hp <= 0
      )
  )

export const isManualBattleSessionFinished = (session?: ManualBattleSession): boolean =>
  Boolean(session?.finalized || session?.result || session?.finalOutcome)

export const isManualBattleSessionDefeated = (session?: ManualBattleSession): boolean =>
  Boolean(session?.result === 'defeat' || session?.finalOutcome === 'defeat' || session?.defeatReason)

export const isManualBattleSessionTerminal = (session?: ManualBattleSession): boolean =>
  isManualBattleSessionFinished(session) || isManualBattleSessionPlayerDeath(session) || Boolean(session?.hardcoreDeathHandled)

export const shouldHideBattleContinueControls = (session?: ManualBattleSession): boolean =>
  isManualBattleSessionTerminal(session)

export const shouldApplyHardcoreDeathReset = (source?: string): boolean => {
  return source === 'gate' || source === 'gate_echo' || source === 'echo' || source === 'red_gate'
}

export const shouldApplyShadowCollapse = (source?: string): boolean => {
  return source === 'gate' || source === 'gate_echo' || source === 'echo' || source === 'red_gate'
}

export const shouldRetrySameFloor = (source?: string): boolean => {
  return source === 'tower'
}

export const isGateHardcoreSource = (source?: string): boolean => {
  return source === 'gate' || source === 'gate_echo' || source === 'echo' || source === 'red_gate'
}

export const shouldTriggerHardcoreDeathFromSession = (
  state: { hardcoreState?: HardcoreState },
  session?: ManualBattleSession,
): boolean => {
  const source = session?.source
  if (source && !shouldApplyHardcoreDeathReset(source)) {
    return false
  }
  return ensureHardcoreState(state.hardcoreState).enabled &&
    !ensureHardcoreState(state.hardcoreState).resetPending &&
    isManualBattleSessionPlayerDeath(session) &&
    !session?.hardcoreDeathHandled
}
