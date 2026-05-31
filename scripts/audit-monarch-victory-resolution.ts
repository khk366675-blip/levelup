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

// Dynamic imports to bypass React environment hoisting errors
const { useGame } = await import('../src/lib/store')
const { MONARCHS, FINAL_ANGEL } = await import('../src/lib/monarchs')
const { initLivingWorld } = await import('../src/lib/livingWorld')

function runVictoryResolutionAudit() {
  console.log(`======================================================================`)
  console.log(`[감사 개시] Monarch Victory Resolution & Re-entry Prevention Audit`)
  console.log(`======================================================================`)

  // 1. 기초 세계 초기화 및 8대 군주 셋업 (Monarch Test Ready 상태 모방)
  const initialWorld = initLivingWorld(777)
  
  // 8대 군주 액티브 상태로 livingWorld 구성
  const activeMonarchs = MONARCHS.map((m, idx) => ({
    monarchId: m.id,
    rank: idx + 1,
    occupiedRegionIds: ['kr'],
    appearedDay: 1,
    status: 'rampaging' as const,
    lastExpandDay: 1
  }))

  useGame.setState({
    livingWorld: {
      ...initialWorld,
      activeMonarchs,
      day: 10,
    },
    riftNodes: {},
    activeGate: undefined,
    manualBattleSession: undefined,
    activeRiftNodeId: undefined,
    messages: []
  })

  const s = useGame.getState()
  console.log(`- 초기화된 군주 개수: ${s.livingWorld?.activeMonarchs?.length}`)
  console.log(`- 전역 오염도: ${s.livingWorld?.worldCorruption}%`)

  // 2. Grellic 수동 격퇴 개시
  console.log(`\n[액션] Grellic 군주전 시작: startWorldManualBattle('grellic')`)
  useGame.getState().startWorldManualBattle('grellic', [])

  let nextState = useGame.getState()
  console.log(`- manualBattleSession 활성화 여부: ${Boolean(nextState.manualBattleSession)}`)
  console.log(`- activeGate.gateId: ${nextState.activeGate?.gateId}`)
  console.log(`- activeRiftNodeId: ${nextState.activeRiftNodeId}`)

  if (!nextState.manualBattleSession || nextState.activeGate?.gateId !== 'grellic') {
    console.error(`❌ [실패] Grellic 전투 세션이 올바르게 구성되지 않았습니다.`)
    process.exit(1)
  }

  // 3. custom mock CombatLog 생성 및 resolveWorldGateBattleOutcome 호출 (승리 정산)
  const mockCombatLog = {
    battleId: 'mock-grellic-battle-123',
    gateInstanceId: 'worldmap-grellic',
    result: 'victory' as const,
    turns: [],
    totalTurns: 15,
    playerHpRemaining: 4500,
    rewards: [],
    totalWaves: 1,
    clearedWaves: 1,
    source: 'worldmap' as const,
    finalOutcome: 'victory' as const,
    defeatReason: 'party_wipe' as const,
    playerDeathDetected: false,
    battleStarted: true,
    actionCount: 20,
    finalized: true,
    shadowCasualtyIds: []
  }

  console.log(`\n[액션] Grellic 격퇴 승리 정산: resolveDirectWorldBattle 호출`)
  useGame.getState().resolveDirectWorldBattle(mockCombatLog, 'grellic', [])

  nextState = useGame.getState()

  // 4. 상태 정산 검증 (defeated 상태, occupiedRegionIds, UI 정리)
  const grellicMonarch = nextState.livingWorld?.activeMonarchs?.find(m => m.monarchId === 'grellic')
  console.log(`- [검증] Grellic status (defeated 예상): ${grellicMonarch?.status}`)
  console.log(`- [검증] Grellic occupiedRegionIds (empty 예상): [${grellicMonarch?.occupiedRegionIds.join(', ')}]`)
  console.log(`- [검증] activeGate (undefined 예상): ${nextState.activeGate}`)
  console.log(`- [검증] manualBattleSession (undefined 예상): ${nextState.manualBattleSession}`)
  console.log(`- [검증] activeRiftNodeId (undefined 예상): ${nextState.activeRiftNodeId}`)

  if (grellicMonarch?.status !== 'defeated' || grellicMonarch.occupiedRegionIds.length > 0) {
    console.error(`❌ [실패] Grellic 군주가 defeated 상태로 정산되지 않았습니다.`)
    process.exit(1)
  }
  if (nextState.activeGate !== undefined || nextState.manualBattleSession !== undefined || nextState.activeRiftNodeId !== undefined) {
    console.error(`❌ [실패] 전장 UI 상태가 정리되지 않았습니다.`)
    process.exit(1)
  }

  // 4.5 추가 방어막 검증: 승리 후 cancelWorldBattle 호출 시, Grellic이 defeated 상태로 계속 유지되는가?
  console.log(`\n[액션] 승리 정산 완료 후 cancelWorldBattle (창 닫기 및 후퇴 덮어쓰기 차단 오염 검증) 실행...`)
  useGame.getState().cancelWorldBattle()
  
  nextState = useGame.getState()
  const grellicMonarchAfterCancel = nextState.livingWorld?.activeMonarchs?.find(m => m.monarchId === 'grellic')
  const grellicRetreated = nextState.worldBattleRetreats?.['grellic']
  console.log(`- [검증] cancel 후 Grellic status (defeated 예상): ${grellicMonarchAfterCancel?.status}`)
  console.log(`- [검증] cancel 후 Grellic 후퇴 기록 등록 여부 (undefined 예상): ${grellicRetreated}`)

  if (grellicMonarchAfterCancel?.status !== 'defeated' || grellicRetreated !== undefined) {
    console.error(`❌ [실패] 승리 완료된 세션에 대해 cancelWorldBattle이 덮어쓰기 오염을 방지하지 못했습니다.`);
    process.exit(1);
  }
  console.log(`✅ [성공] 승리 덮어쓰기 오염 방지 가드 완벽 작동 확인!`)

  // 5. stale overwrite 버그 퇴치 검증 (riftNodes 및 livingWorld.riftNodes 검사)
  const storeNodeStatus = nextState.riftNodes['grellic']
  const worldNodeStatus = nextState.livingWorld?.riftNodes['grellic']?.status
  console.log(`- [검증] 스토어 riftNodes['grellic'] (cleared 예상): ${storeNodeStatus}`)
  console.log(`- [검증] livingWorld.riftNodes['grellic'].status (cleared 예상): ${worldNodeStatus}`)

  if (storeNodeStatus !== 'cleared' || worldNodeStatus !== 'cleared') {
    console.error(`❌ [실패] stale overwrite 버그 발생! 노드 상태가 cleared가 아닙니다.`)
    process.exit(1)
  }
  console.log(`✅ [성공] stale overwrite 수정 완벽 검증!`)

  // 6. Grellic 재진입 차단 검증
  console.log(`\n[액션] 격퇴된 Grellic 재진입 시도: startWorldManualBattle('grellic')`)
  useGame.getState().startWorldManualBattle('grellic', [])

  nextState = useGame.getState()
  console.log(`- [검증] manualBattleSession (차단되어 undefined 예상): ${nextState.manualBattleSession}`)
  console.log(`- [검증] activeGate (차단되어 undefined 예상): ${nextState.activeGate}`)
  
  const lastMsg = nextState.messages[nextState.messages.length - 1]
  console.log(`- [검증] 차단 안내 문구: "${lastMsg?.lines[0]}"`)

  if (nextState.manualBattleSession !== undefined || nextState.activeGate !== undefined) {
    console.error(`❌ [실패] 이미 격퇴된 군주에 재진입이 차단되지 않았습니다.`)
    process.exit(1)
  }
  if (!lastMsg || !lastMsg.lines[0].includes('이미 격퇴된 군주입니다')) {
    console.error(`❌ [실패] 올바른 차단 안내 메시지가 발생하지 않았습니다.`)
    process.exit(1)
  }
  console.log(`✅ [성공] 이미 격퇴된 군주 재진입 차단 및 일반 GateRun 생성 방지 완벽 확인!`)

  // 7. 8대 군주 완파 및 Angel Ready 검증
  console.log(`\n[액션] 나머지 7개 군주도 모두 격퇴 처리...`)
  const fullyDefeatedMonarchs = activeMonarchs.map(m => ({
    ...m,
    status: 'defeated' as const,
    occupiedRegionIds: []
  }))
  
  // Grellic은 5번 과정에서 이미 defeated 처리되었으며, 8명 모두 defeated 될 때의 흐름을 트리거하기 위해
  // grellic이 defeated 될 때의 resolve outcome을 시뮬레이션
  const stateBeforeLastMonarch = {
    ...nextState,
    livingWorld: {
      ...nextState.livingWorld,
      activeMonarchs: fullyDefeatedMonarchs.map(m => m.monarchId === 'celaide' ? { ...m, status: 'rampaging' as const, occupiedRegionIds: ['kr'] } : m),
      angelReady: false,
    }
  }
  useGame.setState(stateBeforeLastMonarch)

  // Celaide를 마지막으로 격파
  console.log(`- 마지막 군주 Celaide 격전 시작...`)
  useGame.getState().startWorldManualBattle('celaide', [])
  useGame.getState().resolveDirectWorldBattle(mockCombatLog, 'celaide', [])

  nextState = useGame.getState()
  console.log(`- [검증] angelReady 플래그 (true 예상): ${nextState.livingWorld?.angelReady}`)
  
  if (nextState.livingWorld?.angelReady !== true) {
    console.error(`❌ [실패] 8대 군주 완파 후 angelReady 플래그가 세팅되지 않았습니다.`)
    process.exit(1)
  }
  console.log(`✅ [성공] 8대 군주 완파 후 angelReady 연쇄 플래그 정상 세팅 확인!`)

  // 8. Angel 최종전 개시 및 격퇴 후 재진입 차단 검증
  console.log(`\n[액션] Angel 최종 격전 개시: startWorldManualBattle('angel')`)
  useGame.getState().startWorldManualBattle('angel', [])
  
  nextState = useGame.getState()
  console.log(`- manualBattleSession.gateId (angel 예상): ${nextState.manualBattleSession?.gateId}`)
  
  if (nextState.manualBattleSession?.gateId !== 'angel') {
    console.error(`❌ [실패] Angel 최종 격전 진입에 실패했습니다.`)
    process.exit(1)
  }

  // Angel 격퇴
  console.log(`\n[액션] Angel 승리 정산: resolveDirectWorldBattle('angel')`)
  useGame.getState().resolveDirectWorldBattle(mockCombatLog, 'angel', [])

  nextState = useGame.getState()
  console.log(`- [검증] endingState (victory 예상): ${nextState.livingWorld?.endingState}`)
  
  if (nextState.livingWorld?.endingState !== 'victory') {
    console.error(`❌ [실패] Angel 격퇴 후 endingState가 victory로 전환되지 않았습니다.`)
    process.exit(1)
  }

  // Angel 재진입 시도 차단
  console.log(`\n[액션] 격퇴된 Angel 재진입 시도: startWorldManualBattle('angel')`)
  useGame.getState().startWorldManualBattle('angel', [])

  nextState = useGame.getState()
  console.log(`- [검증] manualBattleSession (차단되어 undefined 예상): ${nextState.manualBattleSession}`)
  
  const finalMsg = nextState.messages[nextState.messages.length - 1]
  console.log(`- [검증] 차단 안내 문구: "${finalMsg?.lines[0]}"`)

  if (nextState.manualBattleSession !== undefined) {
    console.error(`❌ [실패] 격퇴된 Angel 결전에 재진입이 허용되었습니다.`)
    process.exit(1)
  }
  if (!finalMsg || !finalMsg.lines[0].includes('이미 정화된 결전입니다')) {
    console.error(`❌ [실패] Angel 재진입 차단 문구가 비정상입니다.`)
    process.exit(1)
  }

  console.log(`\n======================================================================`)
  console.log(`🎉 [최종 통과] 모든 Monarch Victory Resolution & Re-entry 감사 통과!`)
  console.log(`======================================================================`)
}

runVictoryResolutionAudit()
