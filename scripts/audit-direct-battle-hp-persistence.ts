import { buildMonarchBattleUnit, MONARCHS } from '../src/lib/monarchs'
import { createDirectBattleState, executeDirectBattleRound } from '../src/lib/directBattleRuntime'
import { BattleUnit, DirectBattleState, DirectBattleLogEntry } from '../src/lib/directBattleTypes'

// 1. Helper to deep clone unit state exactly like in DirectBattlePreviewPanel
const cloneUnit = (unit: BattleUnit): BattleUnit => ({
  ...unit,
  stats: { ...unit.stats },
  statusEffects: unit.statusEffects.map(status => ({ ...status })),
  cooldowns: { ...unit.cooldowns },
  actionList: unit.actionList.map(action => ({ ...action })),
  passiveList: unit.passiveList.map(action => ({ ...action })),
  metadata: { ...unit.metadata, tags: unit.metadata.tags ? [...unit.metadata.tags] : undefined },
})

const applyRevealStepResultToState = (
  state: DirectBattleState,
  hpAfterByUnitId: Record<string, { currentHp: number; maxHp: number }>
): DirectBattleState => {
  const nextState = {
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
  }
  for (const [unitId, hpAfter] of Object.entries(hpAfterByUnitId)) {
    const unit = nextState.units.find(candidate => candidate.unitId === unitId)
    if (!unit) continue
    unit.stats.currentHp = Math.max(0, Math.min(unit.stats.maxHp, hpAfter.currentHp))
  }
  return nextState
}

function runHpPersistenceAudit() {
  console.log(`======================================================================`)
  console.log(`[감사 개시] Direct Battle HP Persistence & Persistence Audit`)
  console.log(`======================================================================`)

  // 1. 군주 유닛 생성 (grellic) 및 customEnemyUnits 모방
  const grellicData = MONARCHS.find(m => m.id === 'grellic')!
  const cp = grellicData.recommendedCP
  const grellicBoss = buildMonarchBattleUnit('grellic', cp)

  // 2. 가상 플레이어 헌터 생성
  const hunter: BattleUnit = {
    unitId: 'hunter-1',
    sourceId: 'hunter',
    unitType: 'hunter',
    displayName: '성진우 (Hunter)',
    role: 'hunter',
    team: 'player',
    level: 80,
    stats: {
      maxHp: 12000,
      currentHp: 12000,
      atk: 2500, // 높은 공격력으로 확실히 HP를 깎게 만듬
      def: 500,
      spd: 40,
      skillPower: 1200,
      crit: 0.3,
      controlPower: 200,
      supportPower: 100,
      survivalPower: 300,
      bossPower: 500,
      synergyPower: 100,
    },
    statusEffects: [],
    cooldowns: {},
    actionList: [
      {
        actionId: 'basic-slash',
        label: '기본 베기',
        actionType: 'basic',
        targetType: 'single_enemy',
        effectKind: 'basic',
        basePriority: 10,
        actionCue: 'slash',
      }
    ],
    passiveList: [],
    actionPriority: 10,
    boardLane: 'front',
    actionCue: 'slash',
    metadata: { source: 'hunter', tags: ['hunter'] }
  }

  // 3. customEnemyUnits 복사 (DirectBattlePreviewPanel startBattle 구현 모방)
  const originalEnemyUnits = [grellicBoss]
  
  // deep clone
  const clonedEnemyUnits = originalEnemyUnits.map(cloneUnit)
  const units = [hunter, ...clonedEnemyUnits]

  const state = createDirectBattleState(units, {
    battleId: `direct-monarch-grellic-test`,
    maxRounds: 25,
  })

  const bossUnitId = grellicBoss.unitId
  const initialMaxHp = grellicBoss.stats.maxHp
  const initialCurrentHp = grellicBoss.stats.currentHp

  console.log(`- 초기화 적 이름: ${grellicBoss.displayName}`)
  console.log(`- 초기화 적 HP: ${initialCurrentHp} / ${initialMaxHp}`)

  // 4. executeDirectBattleRound 1회 실행
  console.log(`\n[시뮬레이션] 1라운드 실행...`)
  const result = executeDirectBattleRound(state, [
    { actorUnitId: 'hunter-1', actionId: 'basic-slash', targetIds: [bossUnitId] }
  ])

  const nextState = result.state
  const round1Logs = result.logs

  // 5. 적 currentHp가 감소했는지 확인
  const postRound1Boss = nextState.units.find(u => u.unitId === bossUnitId)!
  const postRound1Hp = postRound1Boss.stats.currentHp
  console.log(`- 1라운드 직후 HP: ${postRound1Hp} / ${initialMaxHp}`)

  if (postRound1Hp >= initialCurrentHp) {
    console.error(`❌ [실패] 1라운드 실행 후 적 HP가 전혀 감소하지 않았습니다! (이전 HP: ${initialCurrentHp}, 현재 HP: ${postRound1Hp})`)
    process.exit(1)
  }
  console.log(`✅ [성공] 1라운드 실행 후 적 HP 감소 확인 (감소량: ${initialCurrentHp - postRound1Hp})`)

  // 6. reveal 단계 시뮬레이션 및 HP After 확인
  console.log(`\n[시뮬레이션] Reveal 단계 시뮬레이션 적용...`)
  
  // round1Logs에서 HP 변경 기록을 안전하게 추출하여 순차 적용
  let revealHpState = { ...state } // 1라운드 이전 상태에서 시작하여 reveal 적용
  
  const hpAfterMap: Record<string, { currentHp: number; maxHp: number }> = {}
  
  round1Logs.forEach((log) => {
    if (log.hpAfterByUnitId) {
      Object.assign(hpAfterMap, log.hpAfterByUnitId)
    }
  })

  // reveal 완료 후 state 적용
  const postRevealState = applyRevealStepResultToState(state, hpAfterMap)
  const postRevealBoss = postRevealState.units.find(u => u.unitId === bossUnitId)!
  const postRevealHp = postRevealBoss.stats.currentHp

  console.log(`- Reveal 완료 후 HP: ${postRevealHp} / ${initialMaxHp}`)

  if (postRevealHp !== postRound1Hp) {
    console.error(`❌ [실패] Reveal 단계 시뮬레이션 적용 후 HP가 1라운드 최종 상태와 다릅니다! (라운드 최종: ${postRound1Hp}, Reveal 최종: ${postRevealHp})`)
    process.exit(1)
  }
  if (postRevealHp === initialMaxHp) {
    console.error(`❌ [실패] Reveal 완료 후 적 HP가 다시 MaxHP로 리셋되었습니다!`)
    process.exit(1)
  }
  console.log(`✅ [성공] Reveal 완료 후 HP 유지 및 보존 확인!`)

  // 7. 2라운드 시작 전(다음 턴) currentHp 유지 확인
  console.log(`\n[시뮬레이션] 2라운드 직전(다음 턴 대기) 상태 검증...`)
  const prepareNextRoundState = {
    ...postRevealState,
    round: nextState.round,
    status: nextState.status,
  }

  const prepBoss = prepareNextRoundState.units.find(u => u.unitId === bossUnitId)!
  const prepHp = prepBoss.stats.currentHp

  console.log(`- 2라운드 시작 직전 HP: ${prepHp} / ${initialMaxHp}`)
  if (prepHp !== postRound1Hp) {
    console.error(`❌ [실패] 2라운드 진입 전 HP 보존 실패! (이전 HP: ${postRound1Hp}, 대기 HP: ${prepHp})`)
    process.exit(1)
  }
  console.log(`✅ [성공] 2라운드 직전 HP 보존 확인!`)

  console.log(`\n======================================================================`)
  console.log(`🎉 [최종 통과] 모든 Direct Battle HP 보존 및 회귀 방지 감사 통과!`)
  console.log(`======================================================================`)
}

runHpPersistenceAudit()
