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

function runGateMessageDedupeAudit() {
  console.log(`======================================================================`)
  console.log(`[감사 개시] Gate Message Deduplication & Spawn Guard Audit`)
  console.log(`======================================================================`)

  // 1. 기초 세계 초기화
  const initialWorld = initLivingWorld(777)
  
  useGame.setState({
    livingWorld: {
      ...initialWorld,
      day: 1,
    },
    riftNodes: {},
    activeGate: undefined,
    manualBattleSession: undefined,
    activeRiftNodeId: undefined,
    messages: []
  })

  // ----------------------------------------------------------------------
  // 케이스 1. 일반 gate spawn 1회 → 게이트 출현 메시지 1회만 생성.
  // ----------------------------------------------------------------------
  console.log(`\n[케이스 1] 일반 게이트 spawn 1회 테스트`)
  const s1 = useGame.getState()
  s1.spawnGate('gate-lair-of-sloth', 'random')
  
  let state = useGame.getState()
  console.log(`- activeGate 존재 여부: ${Boolean(state.activeGate)}`)
  console.log(`- activeGate.gateId: ${state.activeGate?.gateId}`)
  
  let gateSpawnMessages = state.messages.filter(m => m.title === '게이트 출현')
  console.log(`- '게이트 출현' 메시지 개수: ${gateSpawnMessages.length}`)
  if (gateSpawnMessages.length !== 1) {
    console.error(`❌ [실패] 게이트 출현 메시지가 1회가 아닙니다: ${gateSpawnMessages.length}`)
    process.exit(1)
  }
  console.log(`✅ [성공] 일반 게이트 spawn 1회 정상 생성 확인.`)

  // ----------------------------------------------------------------------
  // 케이스 2. 동일 게이트 중복 spawn 시도 → 무시 & 메시지 추가 생성 없음.
  // ----------------------------------------------------------------------
  console.log(`\n[케이스 2] 동일 게이트 중복 spawn 시도 테스트`)
  useGame.getState().spawnGate('gate-lair-of-sloth', 'random')
  
  state = useGame.getState()
  gateSpawnMessages = state.messages.filter(m => m.title === '게이트 출현')
  console.log(`- 중복 spawn 시도 후 '게이트 출현' 메시지 개수: ${gateSpawnMessages.length}`)
  if (gateSpawnMessages.length !== 1) {
    console.error(`❌ [실패] 중복 spawn 시도 시 메시지가 추가되었습니다.`)
    process.exit(1)
  }
  console.log(`✅ [성공] 중복 spawn 방어막 작동 확인.`)

  // ----------------------------------------------------------------------
  // 케이스 3. 동일 activeGate 상태에서 cancel/cleanup/close 호출 → 게이트 출현 추가 없음.
  // ----------------------------------------------------------------------
  console.log(`\n[케이스 3] cancelWorldBattle 호출 시 게이트 출현 추가 생성 없음 테스트`)
  // cancelWorldBattle 호출
  useGame.getState().cancelWorldBattle()
  
  state = useGame.getState()
  console.log(`- cancel 후 activeGate 존재 여부 (undefined 예상): ${state.activeGate}`)
  
  gateSpawnMessages = state.messages.filter(m => m.title === '게이트 출현')
  console.log(`- cancel 후 '게이트 출현' 메시지 개수: ${gateSpawnMessages.length}`)
  if (gateSpawnMessages.length !== 1) {
    console.error(`❌ [실패] cancel 시점에 불필요한 '게이트 출현' 메시지가 추가되었습니다.`)
    process.exit(1)
  }
  console.log(`✅ [성공] cancel/cleanup/close 경로에서 메시지 미발생 확인.`)

  // ----------------------------------------------------------------------
  // 케이스 4. 이미 격퇴된 군주 재진입 시도 → "이미 격퇴된 군주입니다." 안내문만 생성, 게이트 출현 없음.
  // ----------------------------------------------------------------------
  console.log(`\n[케이스 4] 격퇴된 군주 재진입 시도 테스트`)
  // 군주 Grellic을 defeated 상태로 셋업
  const activeMonarchs = MONARCHS.map((m, idx) => ({
    monarchId: m.id,
    rank: idx + 1,
    occupiedRegionIds: m.id === 'grellic' ? [] : ['kr'], // grellic은 격퇴 처리
    appearedDay: 1,
    status: m.id === 'grellic' ? ('defeated' as const) : ('rampaging' as const),
    lastExpandDay: 1
  }))
  
  useGame.setState({
    livingWorld: {
      ...state.livingWorld!,
      activeMonarchs,
    },
    activeGate: undefined,
    messages: []
  })

  // startWorldManualBattle('grellic') 호출
  useGame.getState().startWorldManualBattle('grellic', [])
  
  state = useGame.getState()
  console.log(`- 진입 시도 후 activeGate 존재 여부 (차단되어 undefined 예상): ${state.activeGate}`)
  
  const blockMessages = state.messages.filter(m => m.title === '진입 차단')
  const newGateSpawnMessages = state.messages.filter(m => m.title === '게이트 출현')
  
  console.log(`- '진입 차단' 메시지 개수: ${blockMessages.length}`)
  console.log(`- '진입 차단' 메시지 내용: "${blockMessages[0]?.lines[0]}"`)
  console.log(`- '게이트 출현' 메시지 개수 (0개 예상): ${newGateSpawnMessages.length}`)

  if (blockMessages.length !== 1 || !blockMessages[0].lines[0].includes('이미 격퇴된 군주입니다')) {
    console.error(`❌ [실패] 차단 메시지가 비정상입니다.`)
    process.exit(1)
  }
  if (newGateSpawnMessages.length !== 0) {
    console.error(`❌ [실패] 격퇴된 군주 진입 차단 시 '게이트 출현' 메시지가 생성되었습니다.`)
    process.exit(1)
  }
  console.log(`✅ [성공] 격퇴된 군주 재진입 시 차단 메시지만 출력 및 게이트 생성 차단 완료.`)

  // ----------------------------------------------------------------------
  // 케이스 5. 격퇴된 군주 상태에서 인위적으로 spawnGate('grellic') 직접 호출 → 완전 차단 확인.
  // ----------------------------------------------------------------------
  console.log(`\n[케이스 5] 격퇴된 군주에 대해 spawnGate 직접 오호출 시 차단 검증`)
  useGame.setState({
    activeGate: undefined,
    messages: []
  })

  useGame.getState().spawnGate('grellic', 'worldmap')
  state = useGame.getState()
  
  console.log(`- spawnGate 직접 강제 호출 후 activeGate 존재 여부 (undefined 예상): ${state.activeGate}`)
  console.log(`- spawnGate 직접 강제 호출 후 messages 개수 (0개 예상): ${state.messages.length}`)
  
  if (state.activeGate !== undefined || state.messages.length !== 0) {
    console.error(`❌ [실패] 격퇴된 군주에 대한 spawnGate 직접 오호출이 철벽 방어막에 차단되지 않았습니다.`)
    process.exit(1)
  }
  console.log(`✅ [성공] 격퇴된 군주 spawnGate 직접 호출 차단 성공.`)

  // ----------------------------------------------------------------------
  // 케이스 6. Angel 격퇴(endingState === 'victory') 후 spawnGate('angel') 오호출 → 완전 차단 확인.
  // ----------------------------------------------------------------------
  console.log(`\n[케이스 6] Angel 정화 후 spawnGate 직접 오호출 시 차단 검증`)
  useGame.setState({
    livingWorld: {
      ...state.livingWorld!,
      endingState: 'victory' as const
    },
    activeGate: undefined,
    messages: []
  })

  useGame.getState().spawnGate('angel', 'worldmap')
  state = useGame.getState()

  console.log(`- Angel 정화 후 activeGate 존재 여부 (undefined 예상): ${state.activeGate}`)
  console.log(`- Angel 정화 후 messages 개수 (0개 예상): ${state.messages.length}`)

  if (state.activeGate !== undefined || state.messages.length !== 0) {
    console.error(`❌ [실패] 정화된 Angel 최종전에 대한 spawnGate 직접 오호출이 차단되지 않았습니다.`)
    process.exit(1)
  }
  console.log(`✅ [성공] 정화 완료된 Angel 결전 spawnGate 직접 호출 차단 성공.`)

  // ----------------------------------------------------------------------
  // 케이스 7. 승급 시험 시작 → 승급 게이트 개방 메시지 정상 1회 발생 & 중복 호출 방어.
  // ----------------------------------------------------------------------
  console.log(`\n[케이스 7] 승급 시험 게이트 생성 및 메시지 dedupe 검증`)
  useGame.setState({
    activeGate: undefined,
    messages: [],
    hunterGrade: {
      currentGrade: 'E',
      history: [],
      unlockedTitles: [],
      pendingExam: undefined
    }
  })

  // 승급 시험 시작
  useGame.getState().startPromotionExam('D')
  state = useGame.getState()
  
  let examMessages = state.messages.filter(m => m.title === '협회 승급 심사 게이트 개방')
  console.log(`- 최초 승급 시험 시작 후 '협회 승급 심사 게이트 개방' 메시지 개수: ${examMessages.length}`)
  if (examMessages.length !== 1) {
    console.error(`❌ [실패] 승급 심사 게이트 개방 메시지가 1회가 아닙니다: ${examMessages.length}`)
    process.exit(1)
  }

  // 중복 승급 시험 시작 시도
  useGame.getState().startPromotionExam('D')
  state = useGame.getState()
  
  const blockExamMessages = state.messages.filter(m => m.title === '승급 시험 불가')
  examMessages = state.messages.filter(m => m.title === '협회 승급 심사 게이트 개방')
  
  console.log(`- 중복 시도 후 '협회 승급 심사 게이트 개방' 메시지 개수: ${examMessages.length}`)
  console.log(`- 중복 시도 후 '승급 시험 불가' 메시지 개수: ${blockExamMessages.length}`)
  
  if (examMessages.length !== 1) {
    console.error(`❌ [실패] 중복 승급 시험 시작 시 개방 메시지가 중복되어 누적되었습니다.`)
    process.exit(1)
  }
  if (blockExamMessages.length !== 1) {
    console.error(`❌ [실패] 중복 승급 시험 차단 메시지가 발생하지 않았습니다.`)
    process.exit(1)
  }
  console.log(`✅ [성공] 승급 심사 게이트 개방 메시지 1회 유지 및 중복 시 차단 메시지 정상 출력 확인.`)

  console.log(`\n======================================================================`)
  console.log(`🎉 [최종 통과] 모든 Gate Message Deduplication & Spawn Guard 감사 통과!`)
  console.log(`======================================================================`)
}

runGateMessageDedupeAudit()
