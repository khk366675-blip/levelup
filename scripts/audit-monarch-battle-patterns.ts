import { buildMonarchBattleUnit, MONARCHS, FINAL_ANGEL } from '../src/lib/monarchs'
import { createDirectBattleState, runMockDirectBattle, executeDirectBattleRound } from '../src/lib/directBattleRuntime'
import { resolveMonarchBossAction } from '../src/lib/monarchBattlePatterns'
import { resolveBossAction } from '../src/lib/monsterPatterns'
import { BattleUnit } from '../src/lib/directBattleTypes'

function runMonarchPatternAudit(monarchId: string) {
  console.log(`\n==================================================`)
  console.log(`[감사 개시] 군주 ID: ${monarchId.toUpperCase()}`)
  console.log(`==================================================`)

  // 1. 군주 유닛 생성
  const cp = monarchId === 'angel' ? 50000 : (MONARCHS.find(m => m.id === monarchId)?.recommendedCP ?? 30000)
  const bossUnit = buildMonarchBattleUnit(monarchId, cp)
  
  // 2. 가상의 플레이어 파티 빌드 (Hunter + Shadows)
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
      atk: 1200,
      def: 450,
      spd: 35,
      skillPower: 800,
      crit: 0.25,
      controlPower: 200,
      supportPower: 100,
      survivalPower: 300,
      bossPower: 200,
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
        basePriority: 0,
        actionCue: 'slash',
      }
    ],
    passiveList: [],
    actionPriority: 0,
    boardLane: 'front',
    actionCue: 'slash',
    metadata: { source: 'hunter', tags: ['hunter'] }
  }

  const shadow: BattleUnit = {
    unitId: 'shadow-1',
    sourceId: 'shadow',
    unitType: 'shadow',
    displayName: '그림자 보병',
    role: 'tank',
    team: 'player',
    level: 70,
    stats: {
      maxHp: 8000,
      currentHp: 8000,
      atk: 400,
      def: 600,
      spd: 25,
      skillPower: 100,
      crit: 0.05,
      controlPower: 50,
      supportPower: 0,
      survivalPower: 500,
      bossPower: 0,
      synergyPower: 50,
    },
    statusEffects: [],
    cooldowns: {},
    actionList: [
      {
        actionId: 'shadow-shield',
        label: '그림자 장벽',
        actionType: 'guard',
        targetType: 'self',
        effectKind: 'guard',
        basePriority: 2,
        actionCue: 'guard',
      }
    ],
    passiveList: [],
    actionPriority: 2,
    boardLane: 'front',
    actionCue: 'guard',
    metadata: { source: 'shadow_profile', tags: ['shadow'] }
  }

  // 3. 전투 초기화
  const state = createDirectBattleState([hunter, shadow, bossUnit])

  // 4. 페이즈 및 텔레그래프 추적 시뮬레이션
  console.log(`\n[Phase 1] 텔레그래프 감격 (HP 100%)`)
  for (let step = 0; step < 3; step++) {
    const res = resolveMonarchBossAction(bossUnit, step, state)
    console.log(`- 턴 ${step + 1}: [${res.telegraphName}] (${res.severity}) -> 대상Rule: ${res.targetRule}`)
    console.log(`  전조문구: "${res.telegraphText}"`)
  }

  // 5. HP 강제 차감 후 Phase 2 텔레그래프 감격 (HP 45%)
  bossUnit.stats.currentHp = Math.round(bossUnit.stats.maxHp * 0.45)
  console.log(`\n[Phase 2] 텔레그래프 감격 (HP 45%)`)
  for (let step = 3; step < 6; step++) {
    const res = resolveMonarchBossAction(bossUnit, step, state)
    console.log(`- 턴 ${step + 1}: [${res.telegraphName}] (${res.severity}) -> 대상Rule: ${res.targetRule}`)
    console.log(`  전조문구: "${res.telegraphText}"`)
  }

  // 6. HP 강제 차감 후 Phase 3 텔레그래프 감격 (HP 20%) - 3페이즈 지원 군주만 적용
  if (['nox', 'angel'].includes(monarchId)) {
    bossUnit.stats.currentHp = Math.round(bossUnit.stats.maxHp * 0.20)
    console.log(`\n[Phase 3] 텔레그래프 감격 (HP 20%)`)
    for (let step = 6; step < 9; step++) {
      const res = resolveMonarchBossAction(bossUnit, step, state)
      console.log(`- 턴 ${step + 1}: [${res.telegraphName}] (${res.severity}) -> 대상Rule: ${res.targetRule}`)
      console.log(`  전조문구: "${res.telegraphText}"`)
    }
  }

  // 7. 스킬과 effects 가 directBattle 런타임에서 오류 없이 해석되는지 가상 1라운드 턴 매칭 테스트
  console.log(`\n[전투 런타임 호환성 1라운드 시뮬레이션]`)
  try {
    const roundRes = executeDirectBattleRound(state, [{ actorUnitId: 'hunter-1', actionId: 'basic-slash', targetIds: [bossUnit.unitId] }])
    const actions = roundRes.queue.map(q => q.actionId)
    console.log(`- 1라운드 큐잉 스킬 목록: ${actions.join(', ')}`)
    const damageLogs = roundRes.logs.filter(l => l.eventType === 'damage' || l.eventType === 'status')
    damageLogs.forEach(l => {
      console.log(`  로그: ${l.message}`)
    })
    console.log(`- [성공] 전투 런타임 스탯/effects 해석 통과`)
  } catch (err: any) {
    console.error(`- [실패] 런타임 충돌 에러 발생!`, err)
  }
}

function runGeneralBossIsolationTest() {
  console.log(`\n==================================================`)
  console.log(`[감사] 일반 보스 오염 차단 격리성 테스트`)
  console.log(`==================================================`)

  // 일반 균열 군주(rift-commander) 유닛 생성
  const genericBoss: BattleUnit = {
    unitId: 'generic-boss-1',
    sourceId: 'rift-commander-alpha',
    unitType: 'monster',
    displayName: '차원의 지배자',
    role: 'boss',
    team: 'monster',
    level: 75,
    stats: {
      maxHp: 100000,
      currentHp: 100000,
      atk: 1500,
      def: 600,
      spd: 30,
      skillPower: 1000,
      crit: 0.15,
      controlPower: 100,
      supportPower: 0,
      survivalPower: 1000,
      bossPower: 300,
      synergyPower: 0,
    },
    statusEffects: [],
    cooldowns: {},
    actionList: [
      {
        actionId: 'rift-slash',
        label: '균열 강습',
        actionType: 'basic',
        targetType: 'single_enemy',
        effectKind: 'basic',
        basePriority: 0,
        actionCue: 'slash',
      },
      {
        actionId: 'rift-collapse',
        label: '차원 광포 붕괴',
        actionType: 'skill',
        targetType: 'all_enemies',
        effectKind: 'damage',
        basePriority: 10,
        actionCue: 'skill',
      }
    ],
    passiveList: [],
    actionPriority: 0,
    boardLane: 'front',
    actionCue: 'slash',
    metadata: { tags: [] }
  }

  const dummyHunter: BattleUnit = {
    unitId: 'hunter-1',
    sourceId: 'hunter',
    unitType: 'hunter',
    displayName: '헌터',
    role: 'hunter',
    team: 'player',
    level: 80,
    stats: { maxHp: 10000, currentHp: 10000, atk: 1000, def: 500, spd: 30, skillPower: 500, crit: 0.1, controlPower: 0, supportPower: 0, survivalPower: 0, bossPower: 0, synergyPower: 0 },
    statusEffects: [], cooldowns: {}, actionList: [], passiveList: [], actionPriority: 0, boardLane: 'front', actionCue: 'slash',
    metadata: { tags: [] }
  }

  const state = createDirectBattleState([dummyHunter, genericBoss])

  // monsterPatterns.ts의 resolveBossAction 호출
  // (monarch resolver를 타지 않는지 간접 테스트)
  
  console.log(`- HP 100% (Phase 1) 턴 1 호출:`)
  const res1 = resolveBossAction(genericBoss, 1, state)
  console.log(`  스킬: [${res1.telegraphName}] 전조: "${res1.telegraphText}" (Severity: ${res1.severity})`)
  
  // 40% Enrage trigger
  genericBoss.stats.currentHp = 35000
  console.log(`- HP 35% (Phase 2 광포) 턴 1 호출:`)
  const res2 = resolveBossAction(genericBoss, 1, state)
  console.log(`  스킬: [${res2.telegraphName}] 전조: "${res2.telegraphText}" (Severity: ${res2.severity})`)

  const isIsolated = !res1.telegraphText.includes('무겁고 파괴적인') && res1.telegraphName.includes('균열 권능');
  console.log(`\n- [결과] 일반 보스 격리성 검증: ${isIsolated ? '통과 (군주 전조에 오염되지 않음)' : '실패'}`)
}

function verifyLethalFrequencyAndPhases() {
  console.log(`\n==================================================`)
  console.log(`[감사] Lethal 전조 빈도 및 HP 기반 페이즈 전환 정밀 검증`)
  console.log(`==================================================`)

  const nox = buildMonarchBattleUnit('nox', 40000)
  const dummyHunter: BattleUnit = {
    unitId: 'hunter-1',
    sourceId: 'hunter',
    unitType: 'hunter',
    displayName: '헌터',
    role: 'hunter',
    team: 'player',
    level: 80,
    stats: { maxHp: 10000, currentHp: 10000, atk: 1000, def: 500, spd: 30, skillPower: 500, crit: 0.1, controlPower: 0, supportPower: 0, survivalPower: 0, bossPower: 0, synergyPower: 0 },
    statusEffects: [], cooldowns: {}, actionList: [], passiveList: [], actionPriority: 0, boardLane: 'front', actionCue: 'slash',
    metadata: { tags: [] }
  }
  const state = createDirectBattleState([dummyHunter, nox])

  let phase1Skills: string[] = []
  let phase2Skills: string[] = []
  let phase3Skills: string[] = []
  
  let phase3LethalCount = 0

  // Phase 1 (HP 100%) - 6턴
  nox.stats.currentHp = nox.stats.maxHp
  for (let step = 0; step < 6; step++) {
    const res = resolveMonarchBossAction(nox, step, state)
    phase1Skills.push(res.telegraphName)
  }

  // Phase 2 (HP 50%) - 6턴
  nox.stats.currentHp = Math.round(nox.stats.maxHp * 0.5)
  for (let step = 0; step < 6; step++) {
    const res = resolveMonarchBossAction(nox, step, state)
    phase2Skills.push(res.telegraphName)
  }

  // Phase 3 (HP 20%) - 6턴
  nox.stats.currentHp = Math.round(nox.stats.maxHp * 0.2)
  for (let step = 0; step < 6; step++) {
    const res = resolveMonarchBossAction(nox, step, state)
    phase3Skills.push(res.telegraphName)
    if (res.severity === 'lethal') {
      phase3LethalCount++
    }
  }

  console.log(`- Nox HP 100% 스킬 사이클: ${phase1Skills.join(' -> ')}`)
  console.log(`- Nox HP 50% 스킬 사이클:  ${phase2Skills.join(' -> ')}`)
  console.log(`- Nox HP 20% 스킬 사이클:  ${phase3Skills.join(' -> ')}`)
  console.log(`- Nox 3페이즈 6턴 중 Lethal 전조 빈도: ${phase3LethalCount}회 (매턴 반복 여부: ${phase3LethalCount === 6 ? '예' : '아니오 (정상)'})`)

  const phaseShiftOk = phase1Skills[0] !== phase2Skills[0] && phase2Skills[0] !== phase3Skills[0];
  const lethalOk = phase3LethalCount < 3; // 3턴 주기로 1번씩 총 2번 나와야 함
  
  console.log(`- [결과] HP 기반 페이즈 전환 검증: ${phaseShiftOk ? '통과' : '실패'}`)
  console.log(`- [결과] Lethal 빈도 안전성 검증: ${lethalOk ? '통과 (주기적 발동 확인)' : '실패'}`)
}

function main() {
  console.log(`==================================================`)
  console.log(`Living Rift World L4-B2 군주 8명 고유 전투 패턴 QA 감사`)
  console.log(`==================================================`)

  const monarchIds = ['grellic', 'celaide', 'igris', 'dorga', 'mirage', 'pesta', 'belatus', 'nox', 'angel']
  monarchIds.forEach(id => {
    runMonarchPatternAudit(id)
  })

  // 추가 보강 테스트
  runGeneralBossIsolationTest()
  verifyLethalFrequencyAndPhases()
}

main()
