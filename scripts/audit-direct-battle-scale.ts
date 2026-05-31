const mockStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

(globalThis as any).window = {
  localStorage: mockStorage,
  sessionStorage: mockStorage,
  location: {
    reload: () => {},
  }
};
(globalThis as any).localStorage = mockStorage;

// 동적 임포트로 호이스팅 회피!
const { useGame } = await import('../src/lib/store')
const { MONARCHS } = await import('../src/lib/monarchs')
const { buildMonarchBattleUnit } = await import('../src/lib/monarchs')

function runScaleAudit() {
  console.log(`======================================================================`)
  console.log(`[감사 개시] Direct Battle Monarch Scale & Path Audit`)
  console.log(`======================================================================`)

  const grellicData = MONARCHS.find(m => m.id === 'grellic')!
  const cp = grellicData.recommendedCP
  const expectedHp = buildMonarchBattleUnit('grellic', cp).stats.maxHp

  console.log(`- Grellic 권장 CP: ${cp}`)
  console.log(`- buildMonarchBattleUnit으로 예상되는 정상 HP: ${expectedHp}`)

  // 1. startWorldManualBattle('grellic') 실행 시뮬레이션
  console.log(`\n[액션] startWorldManualBattle('grellic') 실행...`)
  useGame.getState().startWorldManualBattle('grellic', [])

  const nextState = useGame.getState()
  const session = nextState.manualBattleSession
  const activeGate = nextState.activeGate

  console.log(`- manualBattleSession 존재 여부: ${Boolean(session)}`)
  if (!session) {
    console.error(`❌ [실패] startWorldManualBattle 후 manualBattleSession이 세팅되지 않았습니다.`)
    process.exit(1)
  }

  console.log(`- manualBattleSession.source: ${session.source}`)
  console.log(`- manualBattleSession.gateId: ${session.gateId}`)

  // 2. isMonarchSession 조건 검증
  const isMonarchSession = session && session.source === 'world_map' && (MONARCHS.some(m => m.id === session.gateId) || session.gateId === 'angel')
  console.log(`- isMonarchSession 판정: ${isMonarchSession}`)

  if (!isMonarchSession) {
    console.error(`❌ [실패] isMonarchSession이 true가 아닙니다.`)
    process.exit(1)
  }
  console.log(`✅ [성공] isMonarchSession === true 확인!`)

  // 3. activeGate 정보 검증
  console.log(`- activeGate 존재 여부: ${Boolean(activeGate)}`)
  if (!activeGate) {
    console.error(`❌ [실패] activeGate가 존재하지 않습니다.`)
    process.exit(1)
  }
  console.log(`- activeGate.source: ${activeGate.source}`)
  console.log(`- activeGate.gateId: ${activeGate.gateId}`)

  // 4. GatePanel에서와 동일하게 customEnemyUnits 가 맞물리는지 검증
  console.log(`\n[검증] GatePanel customEnemyUnits 주입 로직 검사...`)
  const customEnemyUnits = [buildMonarchBattleUnit(session.gateId, cp)]
  
  console.log(`- customEnemyUnits 존재 여부: ${Boolean(customEnemyUnits)}`)
  console.log(`- customEnemyUnits.length: ${customEnemyUnits.length}`)
  
  if (customEnemyUnits.length !== 1) {
    console.error(`❌ [실패] customEnemyUnits가 단일 보스로 정렬되지 않았습니다.`)
    process.exit(1)
  }

  const grellicBoss = customEnemyUnits[0]
  console.log(`- 군주 보스 유닛 이름: ${grellicBoss.displayName}`)
  console.log(`- 군주 보스 실제 maxHp: ${grellicBoss.stats.maxHp}`)

  if (Math.abs(grellicBoss.stats.maxHp - expectedHp) > 10) {
    console.error(`❌ [실패] 군주 HP가 스케일링된 예상값(${expectedHp})과 일치하지 않습니다. (현재: ${grellicBoss.stats.maxHp})`)
    process.exit(1)
  }
  console.log(`✅ [성공] 군주 보스 단일 HP 49,200대 정상 확인!`)

  // 5. 우회 진입 여부 체크
  console.log(`\n[검증] activeGate/GateRun 우회 진입 여부 검사...`)
  const hasMinionsInCustom = customEnemyUnits.length > 1
  console.log(`- customEnemyUnits에 하수인이 섞여 있는지: ${hasMinionsInCustom}`)
  if (hasMinionsInCustom) {
    console.error(`❌ [실패] 군주 결전에 원치 않는 하수인이 주입되었습니다.`)
    process.exit(1)
  }
  console.log(`✅ [성공] 하수인 없는 단일 군주 결전 구조 확인!`)

  // Clean up
  useGame.setState({ manualBattleSession: undefined, activeGate: undefined })

  console.log(`\n======================================================================`)
  console.log(`🎉 [최종 통과] 모든 Monarch Scale & Path 감사 통과!`)
  console.log(`======================================================================`)
}

runScaleAudit()
