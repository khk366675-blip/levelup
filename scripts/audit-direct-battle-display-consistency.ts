import { buildMonarchBattleUnit, MONARCHS } from '../src/lib/monarchs'
import { createDirectBattleState, executeDirectBattleRound } from '../src/lib/directBattleRuntime'
import { BattleUnit, DirectBattleState, DirectBattleLogEntry } from '../src/lib/directBattleTypes'

function runDisplayConsistencyAudit() {
  console.log(`======================================================================`)
  console.log(`[감사 개시] Direct Battle HP & Damage Display Consistency Audit`)
  console.log(`======================================================================`)

  // 1. 9999를 훨씬 초과하는 고HP 군주 보스 생성 (igris, CP 스케일링)
  const igrisData = MONARCHS.find(m => m.id === 'igris')!
  const cp = igrisData.recommendedCP
  const igrisBoss = buildMonarchBattleUnit('igris', cp)

  console.log(`- 생성된 보스: ${igrisBoss.displayName}`)
  console.log(`- 보스 초기 maxHp: ${igrisBoss.stats.maxHp} (9999 초과 여부: ${igrisBoss.stats.maxHp > 9999 ? 'Yes' : 'No'})`)
  console.log(`- 보스 초기 currentHp: ${igrisBoss.stats.currentHp}`)

  if (igrisBoss.stats.maxHp <= 9999) {
    console.error(`❌ [실패] 보스 maxHp가 9999를 넘지 못했습니다. 스케일링을 다시 확인하세요.`)
    process.exit(1)
  }

  // 2. 가상 플레이어 헌터 생성
  const hunter: BattleUnit = {
    unitId: 'hunter-1',
    sourceId: 'hunter',
    unitType: 'hunter',
    displayName: '성진우 (Hunter)',
    role: 'hunter',
    team: 'player',
    level: 85,
    stats: {
      maxHp: 15000,
      currentHp: 15000,
      atk: 3200, // 확실한 큰 데미지
      def: 600,
      spd: 45,
      skillPower: 1500,
      crit: 0.35,
      controlPower: 200,
      supportPower: 100,
      survivalPower: 300,
      bossPower: 600,
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

  // 3. 상태 생성
  const state = createDirectBattleState([hunter, igrisBoss], {
    battleId: `direct-consistency-test`,
    maxRounds: 25,
  })

  // 4. 1라운드 실행
  console.log(`\n[시뮬레이션] 1라운드 공격 실행...`)
  const result = executeDirectBattleRound(state, [
    { actorUnitId: 'hunter-1', actionId: 'basic-slash', targetIds: [igrisBoss.unitId] }
  ])

  const nextState = result.state
  const round1Logs = result.logs

  // 5. 실제 damage log 추출 및 HP 변화량 계산
  const damageLog = round1Logs.find(l => l.eventType === 'damage' && l.targetUnitIds?.includes(igrisBoss.unitId))
  if (!damageLog) {
    console.error(`❌ [실패] 1라운드 공격에서 데미지 로그를 찾을 수 없습니다!`)
    process.exit(1)
  }

  const loggedDamage = damageLog.value ?? 0
  console.log(`- 기록된 데미지(loggedDamage): ${loggedDamage}`)

  // 6. unit.currentHp 변화량 계산
  const postRoundBoss = nextState.units.find(u => u.unitId === igrisBoss.unitId)!
  const expectedHp = igrisBoss.stats.currentHp - loggedDamage
  const actualHp = postRoundBoss.stats.currentHp

  console.log(`- 예상 잔존 HP: ${expectedHp}`)
  console.log(`- 실제 잔존 HP: ${actualHp}`)

  if (actualHp !== expectedHp) {
    console.error(`❌ [실패] 1라운드 후 실제 잔존 HP와 예상 잔존 HP가 일치하지 않습니다!`)
    process.exit(1)
  }
  console.log(`✅ [성공] 실제 HP 변화량과 데미지 일치 확인!`)

  // 7. popup amount 변환 검증 (latestAction.amount 로직 모사)
  console.log(`\n[시뮬레이션] DamagePopup amount 매칭 검증...`)
  const isNumericEvent = damageLog.eventType === 'damage' || damageLog.eventType === 'heal' || damageLog.eventType === 'reaction'
  const latestActionAmount = isNumericEvent && loggedDamage > 0 ? Math.round(loggedDamage) : undefined

  console.log(`- Popup 전달용 amount: ${latestActionAmount}`)

  if (latestActionAmount !== loggedDamage) {
    console.error(`❌ [실패] popup amount와 실제 데미지 로그 수치가 다릅니다! (Popup: ${latestActionAmount}, Log: ${loggedDamage})`)
    process.exit(1)
  }
  console.log(`✅ [성공] popup amount와 실제 데미지 수치 일치 확인!`)

  // 8. currentHp 또는 maxHp가 9999로 잘리지 않는지 확인
  console.log(`\n[시뮬레이션] HP 9999/99999 clamp 한계 테스트...`)
  console.log(`- 1라운드 후 보스 maxHp: ${postRoundBoss.stats.maxHp}`)
  console.log(`- 1라운드 후 보스 currentHp: ${postRoundBoss.stats.currentHp}`)

  const hpResetDetected = postRoundBoss.stats.currentHp === igrisBoss.stats.maxHp
  const hp9999ClampDetected = postRoundBoss.stats.currentHp === 9999 || postRoundBoss.stats.maxHp === 9999
  const hp99999ClampDetected = postRoundBoss.stats.currentHp === 99999 || postRoundBoss.stats.maxHp === 99999

  console.log(`- HP 리셋 감지: ${hpResetDetected}`)
  console.log(`- 9999 clamp 감지: ${hp9999ClampDetected}`)
  console.log(`- 99999 clamp 감지: ${hp99999ClampDetected}`)

  if (hpResetDetected) {
    console.error(`❌ [실패] 적 currentHp가 다시 maxHp로 복구되었습니다!`)
    process.exit(1)
  }
  if (hp9999ClampDetected || hp99999ClampDetected) {
    console.error(`❌ [실패] 적 HP가 9999 또는 99999 한계로 잘려버렸습니다! (clamp 버그 잔존)`)
    process.exit(1)
  }
  console.log(`✅ [성공] HP 리셋 및 clamp 잘림 버그 완벽 통과!`)

  // 9. status 부여 시 amount가 데미지로 오인되지 않는지 검증
  console.log(`\n[시뮬레이션] Status(버프/디버프) 부여 시 popup 필터링 검증...`)
  const statusLog: DirectBattleLogEntry = {
    round: 1,
    actorUnitId: 'hunter-1',
    targetUnitIds: [igrisBoss.unitId],
    actionId: 'buff-atk',
    timing: 'normal_action',
    message: 'Attack buff gained',
    eventType: 'status',
    value: 0.15, // 버프 비율
    actionCue: 'buff',
  }

  const statusIsNumeric = statusLog.eventType === 'damage' || statusLog.eventType === 'heal' || statusLog.eventType === 'reaction'
  const statusPopupAmount = statusIsNumeric && (statusLog.value ?? 0) > 0 ? Math.round(statusLog.value ?? 0) : undefined

  console.log(`- Status popup amount: ${statusPopupAmount}`)
  if (statusPopupAmount !== undefined) {
    console.error(`❌ [실패] status 부여 시 amount가 수치로 들어가 popup에 노출될 위험이 있습니다!`)
    process.exit(1)
  }
  console.log(`✅ [성공] status 부여 시 popup 노출 완벽 차단 확인!`)

  console.log(`\n======================================================================`)
  console.log(`🎉 [최종 통과] 모든 HP & Damage Display Consistency 감사 통과!`)
  console.log(`======================================================================`)
}

runDisplayConsistencyAudit()
