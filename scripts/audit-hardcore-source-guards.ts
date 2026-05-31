import {
  shouldApplyHardcoreDeathReset,
  shouldApplyShadowCollapse,
  isGateHardcoreSource,
  shouldTriggerHardcoreDeathFromSession,
  isWorldMapBattleSource
} from '../src/lib/manualBattleSessionGuards'
import type { ManualBattleSession, HardcoreState } from '../src/lib/types'

function runHardcoreSourceGuardsAudit() {
  console.log(`======================================================================`)
  console.log(`[감사 개시] Hardcore Source Guards Audit (world_map vs worldmap)`)
  console.log(`======================================================================`)

  // 1. worldmap / world_map alias 검사
  const test1 = isWorldMapBattleSource('worldmap')
  const test2 = isWorldMapBattleSource('world_map')
  const test3 = isWorldMapBattleSource('gate')

  console.log(`- isWorldMapBattleSource('worldmap') === true: ${test1}`)
  console.log(`- isWorldMapBattleSource('world_map') === true: ${test2}`)
  console.log(`- isWorldMapBattleSource('gate') === false: ${!test3}`)

  if (!test1 || !test2 || test3) {
    console.error(`❌ [실패] isWorldMapBattleSource 헬퍼가 제대로 작동하지 않습니다.`)
    process.exit(1)
  }

  // 2. shouldApplyHardcoreDeathReset 검사
  const hGate = shouldApplyHardcoreDeathReset('gate')
  const hEcho = shouldApplyHardcoreDeathReset('gate_echo')
  const hRed = shouldApplyHardcoreDeathReset('red_gate')
  const hWmap = shouldApplyHardcoreDeathReset('worldmap')
  const hWmap_ = shouldApplyHardcoreDeathReset('world_map')
  const hTower = shouldApplyHardcoreDeathReset('tower')
  const hExam = shouldApplyHardcoreDeathReset('promotion_exam')

  console.log(`- shouldApplyHardcoreDeathReset('gate') === true: ${hGate}`)
  console.log(`- shouldApplyHardcoreDeathReset('gate_echo') === true: ${hEcho}`)
  console.log(`- shouldApplyHardcoreDeathReset('red_gate') === true: ${hRed}`)
  console.log(`- shouldApplyHardcoreDeathReset('worldmap') === true: ${hWmap}`)
  console.log(`- shouldApplyHardcoreDeathReset('world_map') === true: ${hWmap_}`)
  console.log(`- shouldApplyHardcoreDeathReset('tower') === false: ${!hTower}`)
  console.log(`- shouldApplyHardcoreDeathReset('promotion_exam') === false: ${!hExam}`)

  if (!hGate || !hEcho || !hRed || !hWmap || !hWmap_ || hTower || hExam) {
    console.error(`❌ [실패] shouldApplyHardcoreDeathReset 가드가 오작동합니다.`)
    process.exit(1)
  }

  // 3. shouldApplyShadowCollapse & isGateHardcoreSource 검사
  const sCollapse = shouldApplyShadowCollapse('world_map')
  const isHardcore = isGateHardcoreSource('world_map')

  console.log(`- shouldApplyShadowCollapse('world_map') === true: ${sCollapse}`)
  console.log(`- isGateHardcoreSource('world_map') === true: ${isHardcore}`)

  if (!sCollapse || !isHardcore) {
    console.error(`❌ [실패] shouldApplyShadowCollapse / isGateHardcoreSource 가 world_map을 무시합니다.`)
    process.exit(1)
  }

  // 4. shouldTriggerHardcoreDeathFromSession 검사
  const hardcoreState: HardcoreState = {
    enabled: true,
    deathCount: 0,
    resetPending: false,
    history: []
  }

  const deadSession: ManualBattleSession = {
    gateId: 'grellic',
    gateName: 'grellic',
    gateInstanceId: 'worldmap-grellic-1234',
    waveIndex: 0,
    turn: 5,
    maxTurns: 200,
    player: {
      unitId: 'hunter',
      displayName: '성진우',
      unitType: 'hunter',
      stats: { maxHp: 1000, currentHp: 0, atk: 100, def: 50, spd: 15 },
      skills: [],
      cooldowns: {},
      activeEffects: [],
      team: 'player',
      sourceId: 'hunter',
      hp: 0
    },
    monster: {
      unitId: 'grellic',
      displayName: '그렐릭',
      unitType: 'monster',
      stats: { maxHp: 5000, currentHp: 5000, atk: 200, def: 100, spd: 10 },
      skills: [],
      cooldowns: {},
      activeEffects: [],
      team: 'monster',
      sourceId: 'grellic',
      hp: 5000
    },
    remainingMonsterIds: [],
    cooldowns: {},
    monsterCooldowns: {},
    activeEffects: [],
    logs: [],
    source: 'world_map',
    playerDeathDetected: true
  }

  const isTriggered = shouldTriggerHardcoreDeathFromSession({ hardcoreState }, deadSession)
  console.log(`- shouldTriggerHardcoreDeathFromSession with 'world_map' and dead player === true: ${isTriggered}`)

  if (!isTriggered) {
    console.error(`❌ [실패] shouldTriggerHardcoreDeathFromSession이 world_map 사망 세션에서 리셋을 감지하지 못했습니다.`)
    process.exit(1)
  }

  console.log(`\n======================================================================`)
  console.log(`🎉 [최종 통과] 모든 Hardcore Source Guards 감사 통과!`)
  console.log(`======================================================================`)
}

runHardcoreSourceGuardsAudit()
