import { buildMonarchBattleUnit, MONARCHS, FINAL_ANGEL } from '../src/lib/monarchs'
import { createDirectBattleState, runMockDirectBattle, executeDirectBattleRound } from '../src/lib/directBattleRuntime'
import { resolveMonarchBossAction } from '../src/lib/monarchBattlePatterns'
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

function main() {
  console.log(`==================================================`)
  console.log(`Living Rift World L4-B2 군주 8명 고유 전투 패턴 QA 감사`)
  console.log(`==================================================`)

  const monarchIds = ['grellic', 'celaide', 'igris', 'dorga', 'mirage', 'pesta', 'belatus', 'nox', 'angel']
  monarchIds.forEach(id => {
    runMonarchPatternAudit(id)
  })
}

main()
