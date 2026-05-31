import { buildMonarchBattleUnit, MONARCHS, FINAL_ANGEL } from '../src/lib/monarchs'
import {
  createDirectBattleState,
  executeDirectBattleRound,
  chooseMockPlayerActions,
} from '../src/lib/directBattleRuntime'
import type { BattleUnit, DirectBattleState } from '../src/lib/directBattleTypes'

// 1. 가상의 헌터 파티 빌드 (Hunter + 2 Shadows => 총 3명 생존)
function buildPlayerParty(): BattleUnit[] {
  const hunter: BattleUnit = {
    unitId: 'hunter-1',
    sourceId: 'hunter',
    unitType: 'hunter',
    displayName: '성진우 (Hunter)',
    role: 'hunter',
    team: 'player',
    level: 80,
    stats: {
      maxHp: 15000, currentHp: 15000, atk: 1500, def: 500, spd: 40, skillPower: 1000,
      crit: 0.25, controlPower: 200, supportPower: 100, survivalPower: 300, bossPower: 200, synergyPower: 100,
    },
    statusEffects: [], cooldowns: {}, actionList: [], passiveList: [], actionPriority: 0,
    boardLane: 'front', actionCue: 'slash', metadata: { source: 'hunter', tags: ['hunter'] }
  }

  const shadow1: BattleUnit = {
    unitId: 'shadow-1',
    sourceId: 'shadow-igris',
    unitType: 'shadow',
    displayName: '그림자 이그리스',
    role: 'bruiser',
    team: 'player',
    level: 75,
    stats: {
      maxHp: 10000, currentHp: 10000, atk: 800, def: 600, spd: 30, skillPower: 400,
      crit: 0.15, controlPower: 100, supportPower: 0, survivalPower: 400, bossPower: 100, synergyPower: 50,
    },
    statusEffects: [], cooldowns: {}, actionList: [], passiveList: [], actionPriority: 0,
    boardLane: 'front', actionCue: 'slash', metadata: { source: 'shadow', tags: ['shadow'] }
  }

  const shadow2: BattleUnit = {
    unitId: 'shadow-2',
    sourceId: 'shadow-tank',
    unitType: 'shadow',
    displayName: '그림자 아이언',
    role: 'tank',
    team: 'player',
    level: 75,
    stats: {
      maxHp: 12000, currentHp: 12000, atk: 500, def: 800, spd: 22, skillPower: 200,
      crit: 0.05, controlPower: 150, supportPower: 50, survivalPower: 800, bossPower: 0, synergyPower: 100,
    },
    statusEffects: [], cooldowns: {}, actionList: [], passiveList: [], actionPriority: 0,
    boardLane: 'front', actionCue: 'guard', metadata: { source: 'shadow', tags: ['shadow'] }
  }

  return [hunter, shadow1, shadow2]
}

interface FizzleRecord {
  monarchId: string
  round: number
  actorName: string
  actionId: string
  actionLabel: string
  targetType: string
  effectKind: string
  debugReason: string
  livingPlayers: number
  livingEnemies: number
  isInvalid: boolean
  metadata: any
}

function runRealtimeQueueResolutionAudit() {
  console.log(`======================================================================`)
  console.log(`[감사 개시] DirectBattle 런타임 큐 기반 Target Resolution & Fizzle 분석`)
  console.log(`======================================================================`)

  const monarchIds = ['grellic', 'celaide', 'igris', 'dorga', 'mirage', 'pesta', 'belatus', 'nox', 'angel']
  const fizzleRecords: FizzleRecord[] = []
  let totalRoundsSimulated = 0
  let totalFailures = 0

  // 빈도 통계 수집용
  const actionFizzleCounts: Record<string, number> = {}
  const targetTypeFizzleCounts: Record<string, number> = {}
  const monarchFizzleCounts: Record<string, number> = {}

  for (const monarchId of monarchIds) {
    console.log(`\n------------------------------------------------------------------`)
    console.log(`>> 군주: ${monarchId.toUpperCase()} 시뮬레이션 개시 (10라운드)`)
    console.log(`------------------------------------------------------------------`)

    // 보스 및 플레이어 배치
    const cp = monarchId === 'angel' ? 50000 : (MONARCHS.find(m => m.id === monarchId)?.recommendedCP ?? 30000)
    const bossUnit = buildMonarchBattleUnit(monarchId, cp)
    const players = buildPlayerParty()

    // 보스 HP가 3페이즈까지 골고루 깎이도록 플레이어 공격력과 보스 HP 교환
    bossUnit.stats.maxHp = bossUnit.stats.maxHp * 2.5
    bossUnit.stats.currentHp = bossUnit.stats.maxHp

    // 전투 시작
    const state = createDirectBattleState([...players, bossUnit], { maxRounds: 15 })

    for (let round = 1; round <= 10; round++) {
      totalRoundsSimulated++
      
      // 플레이어는 매 라운드 mock 액션 수행
      const playerSelections = chooseMockPlayerActions(state)

      // 보스 HP 비율을 인위적으로 조정하여 다양한 페이즈(1, 2, 3)를 경험하도록 시뮬레이션
      // 1~3라운드: Phase 1 (HP 100% -> 75%)
      // 4~7라운드: Phase 2 (HP 50%)
      // 8~10라운드: Phase 3 (HP 15%) - Nox/Angel의 경우 3페이즈 진입
      if (round === 4) {
        const boss = state.units.find(u => u.unitId === bossUnit.unitId)
        if (boss) boss.stats.currentHp = Math.round(boss.stats.maxHp * 0.5)
      } else if (round === 8) {
        const boss = state.units.find(u => u.unitId === bossUnit.unitId)
        if (boss) boss.stats.currentHp = Math.round(boss.stats.maxHp * 0.15)
      }

      // 라운드 실행!
      const roundResult = executeDirectBattleRound(state, playerSelections)

      // 이번 라운드에 발생한 fizzle 로그 스캔
      const fizzles = roundResult.logs.filter(l => l.eventType === 'fizzle')
      for (const log of fizzles) {
        const metadata = log.metadata ?? {}
        const actor = state.units.find(u => u.unitId === log.actorUnitId)
        const isEnemyActor = actor?.team === 'enemy'

        const livingPlayers = state.units.filter(u => u.team === 'player' && u.stats.currentHp > 0)
        const livingEnemies = state.units.filter(u => u.team === 'enemy' && u.stats.currentHp > 0)

        // Invalid Fizzle 판별 조건:
        // 1. 적군(보스/하수인)의 Hostile 액션인데, 플레이어가 1명 이상 살아있는데 fizzle 발생
        // 2. 적군(보스/하수인)의 Self/Ally 서포트 액션인데, 적군 본인이 살아있는데 fizzle 발생
        let isInvalid = false
        if (isEnemyActor) {
          const targetType = metadata.targetType ?? 'single_enemy'
          const isAllyType = ['self', 'single_ally', 'all_allies', 'lowest_hp_ally'].includes(targetType)

          if (isAllyType) {
            if (livingEnemies.length > 0) {
              isInvalid = true
            }
          } else {
            if (livingPlayers.length > 0) {
              isInvalid = true
            }
          }
        }

        if (isInvalid) {
          totalFailures++
        }

        const rec: FizzleRecord = {
          monarchId,
          round,
          actorName: actor?.displayName ?? log.actorUnitId ?? 'system',
          actionId: log.actionId ?? 'unknown',
          actionLabel: actor?.actionList.find(a => a.actionId === log.actionId)?.label ?? 'unknown',
          targetType: metadata.targetType ?? 'unknown',
          effectKind: metadata.effectKind ?? 'unknown',
          debugReason: metadata.debugReason ?? 'unknown',
          livingPlayers: livingPlayers.length,
          livingEnemies: livingEnemies.length,
          isInvalid,
          metadata,
        }

        fizzleRecords.push(rec)

        // 통계 수집
        actionFizzleCounts[rec.actionId] = (actionFizzleCounts[rec.actionId] ?? 0) + 1
        targetTypeFizzleCounts[rec.targetType] = (targetTypeFizzleCounts[rec.targetType] ?? 0) + 1
        monarchFizzleCounts[monarchId] = (monarchFizzleCounts[monarchId] ?? 0) + 1
      }

      if (state.isFinished) {
        break
      }
    }
  }

  // ── 통계 및 테이블 출력 ──
  console.log(`\n======================================================================`)
  console.log(`📊 [감사 결과 통계 요약]`)
  console.log(`======================================================================`)
  console.log(`* 총 시뮬레이션 라운드 수: ${totalRoundsSimulated}`)
  console.log(`* 발생한 총 Fizzle 건수: ${fizzleRecords.length}`)
  console.log(`* 허용되지 않은 결함 Fizzle 건수: ${totalFailures}`)

  if (fizzleRecords.length > 0) {
    console.log(`\n[FIZZLE METADATA TABLE]`)
    console.log(`------------------------------------------------------------------------------------------------------------------------------------------------`)
    console.log(`| Monarch  | Rnd | Actor             | Action ID                   | TargetType           | EffectKind | Reason                 | Invalid? |`)
    console.log(`------------------------------------------------------------------------------------------------------------------------------------------------`)
    for (const rec of fizzleRecords) {
      const invalidStr = rec.isInvalid ? '🔴 INVALID' : '🟢 VALID'
      const monarchPad = rec.monarchId.padEnd(8).substring(0, 8)
      const rndPad = String(rec.round).padEnd(3)
      const actorPad = rec.actorName.padEnd(17).substring(0, 17)
      const actionPad = rec.actionId.padEnd(27).substring(0, 27)
      const typePad = rec.targetType.padEnd(20).substring(0, 20)
      const kindPad = rec.effectKind.padEnd(10).substring(0, 10)
      const reasonPad = rec.debugReason.padEnd(22).substring(0, 22)
      console.log(`| ${monarchPad} | ${rndPad} | ${actorPad} | ${actionPad} | ${typePad} | ${kindPad} | ${reasonPad} | ${invalidStr} |`)
    }
    console.log(`------------------------------------------------------------------------------------------------------------------------------------------------`)

    console.log(`\n[군주별 Fizzle 빈도]`)
    console.dir(monarchFizzleCounts)

    console.log(`\n[TargetType별 Fizzle 빈도]`)
    console.dir(targetTypeFizzleCounts)

    console.log(`\n[Action별 Fizzle 빈도]`)
    console.dir(actionFizzleCounts)
  } else {
    console.log(`\n✨ 발생한 Fizzle 건수가 전혀 없습니다!`)
  }

  console.log(`\n======================================================================`)
  if (totalFailures > 0) {
    console.error(`❌ [실패] 실제 플레이와 동일한 런타임 큐 상에서 불합리한 Fizzle이 ${totalFailures}건 검출되었습니다!`)
    process.exit(1)
  } else {
    console.log(`✅ [성공] 살아있는 대상이 있는 상태에서의 불합리한 Fizzle이 단 한 건도 발견되지 않았습니다.`)
  }
}

runRealtimeQueueResolutionAudit()
