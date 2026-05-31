import { buildMonarchBattleUnit, MONARCHS, FINAL_ANGEL } from '../src/lib/monarchs'
import { createDirectBattleState } from '../src/lib/directBattleRuntime'
import { resolveMonarchBossAction } from '../src/lib/monarchBattlePatterns'
import { chooseTargetByRule } from '../src/lib/monsterPatterns'
import type { BattleUnit, DirectBattleState, BattleActionDefinition } from '../src/lib/directBattleTypes'

// directBattleRuntime 에서 사용되는 내부 헬퍼들을 수동 구현하여 대조
const allyTargetTypes = new Set<string>([
  'self',
  'single_ally',
  'all_allies',
  'lowest_hp_ally',
])

const isAllyTargetAction = (action: BattleActionDefinition): boolean =>
  allyTargetTypes.has(action.targetType)

const isHostileEffect = (action: BattleActionDefinition): boolean =>
  action.effectKind === 'damage' ||
  action.effectKind === 'hybrid' ||
  action.effectKind === 'control' ||
  action.effectKind === 'stat_shift' ||
  action.effectKind === 'bossing' ||
  action.effectKind === 'basic'

const getOpposingTeam = (team: 'player' | 'enemy'): 'player' | 'enemy' =>
  team === 'player' ? 'enemy' : 'player'

const livingUnits = (state: DirectBattleState, team?: 'player' | 'enemy'): BattleUnit[] =>
  state.units.filter(unit => unit.stats.currentHp > 0 && (!team || unit.team === team))

const findUnit = (state: DirectBattleState, unitId: string): BattleUnit | undefined =>
  state.units.find(unit => unit.unitId === unitId)

const lowestHp = (units: BattleUnit[]): BattleUnit | undefined =>
  [...units].sort((a, b) => (a.stats.currentHp / a.stats.maxHp) - (b.stats.currentHp / b.stats.maxHp))[0]

const highestThreat = (units: BattleUnit[]): BattleUnit | undefined =>
  [...units].sort((a, b) => (b.stats.atk + b.stats.skillPower + b.stats.spd * 0.4) - (a.stats.atk + a.stats.skillPower + a.stats.spd * 0.4))[0]

const firstAlive = (units: BattleUnit[]): BattleUnit | undefined =>
  units.find(u => u.stats.currentHp > 0)

// directBattleRuntime 내의 호스트 행동 검증 함수 복제
const isHostileAction = (action: BattleActionDefinition): boolean => {
  const enemyTargetTypes = new Set<string>([
    'single_enemy',
    'all_enemies',
    'lowest_hp_enemy',
    'highest_threat_enemy',
    'boss',
    'minion',
    'front_lane',
    'rear_lane',
  ])
  if (enemyTargetTypes.has(action.targetType)) return true
  if (action.targetType === 'self' || allyTargetTypes.has(action.targetType)) return false

  if (action.effectKind === 'damage' || action.effectKind === 'hybrid' || action.effectKind === 'control' || action.effectKind === 'basic') return true

  if (action.effects && action.effects.length > 0) {
    const hasEnemyEffect = action.effects.some(e => e.target === 'enemy' || e.value < 0)
    if (hasEnemyEffect) return true
  }
  return false
}

// 런타임의 resolveTargets 복제하여 시뮬레이션용 분석값 추출
function simulateResolveTargets(
  state: DirectBattleState,
  actor: BattleUnit,
  action: BattleActionDefinition,
  preferredTargetIds: string[] = [],
): {
  preferredBefore: string[]
  preferredAfter: string[]
  resolved: string[]
  isHostile: boolean
} {
  const preferredBefore = [...preferredTargetIds]
  let preferred = preferredTargetIds
    .map(id => findUnit(state, id))
    .filter((unit): unit is BattleUnit => Boolean(unit && unit.stats.currentHp > 0))

  const isHostile = isHostileAction(action)
  if (isHostile) {
    preferred = preferred.filter(unit => unit.team !== actor.team)
  } else {
    preferred = preferred.filter(unit => unit.team === actor.team)
  }

  const preferredAfter = preferred.map(u => u.unitId)

  // AoE 오버라이드 
  if (action.targetType === 'all_enemies') {
    const enemies = livingUnits(state, getOpposingTeam(actor.team))
    return {
      preferredBefore,
      preferredAfter,
      resolved: enemies.map(unit => unit.unitId),
      isHostile
    }
  }
  if (action.targetType === 'all_allies') {
    const allies = livingUnits(state, actor.team)
    return {
      preferredBefore,
      preferredAfter,
      resolved: allies.map(unit => unit.unitId),
      isHostile
    }
  }
  if (action.targetType === 'self') {
    return {
      preferredBefore,
      preferredAfter,
      resolved: [actor.unitId],
      isHostile
    }
  }

  if (preferred.length > 0) {
    return {
      preferredBefore,
      preferredAfter,
      resolved: [preferred[0].unitId],
      isHostile
    }
  }

  const allies = livingUnits(state, actor.team)
  const enemies = livingUnits(state, getOpposingTeam(actor.team))
  const enemyBoss = enemies.find(unit => unit.unitType === 'boss')
  const enemyMinion = enemies.find(unit => unit.unitType === 'minion')

  let resolved: string[] = []
  if (action.targetType === 'single_ally') resolved = [(lowestHp(allies) ?? actor).unitId]
  else if (action.targetType === 'lowest_hp_ally') resolved = [(lowestHp(allies) ?? actor).unitId]
  else if (action.targetType === 'lowest_hp_enemy') resolved = lowestHp(enemies)?.unitId ? [lowestHp(enemies)!.unitId] : []
  else if (action.targetType === 'highest_threat_enemy') resolved = highestThreat(enemies)?.unitId ? [highestThreat(enemies)!.unitId] : []
  else if (action.targetType === 'boss') resolved = [(enemyBoss ?? firstAlive(enemies))?.unitId].filter((id): id is string => Boolean(id))
  else if (action.targetType === 'minion') resolved = [(enemyMinion ?? firstAlive(enemies))?.unitId].filter((id): id is string => Boolean(id))
  else if (action.targetType === 'front_lane') {
    resolved = [(enemies.find(unit => unit.boardLane === 'front') ?? firstAlive(enemies))?.unitId].filter((id): id is string => Boolean(id))
  }
  else if (action.targetType === 'rear_lane') {
    resolved = [(enemies.find(unit => unit.boardLane === 'rear') ?? firstAlive(enemies))?.unitId].filter((id): id is string => Boolean(id))
  }
  else if (action.targetType === 'single_enemy') {
    resolved = [(firstAlive(enemies))?.unitId].filter((id): id is string => Boolean(id))
  } else {
    if (isHostile) {
      resolved = [(firstAlive(enemies))?.unitId].filter((id): id is string => Boolean(id))
    } else {
      resolved = [(firstAlive(allies))?.unitId].filter((id): id is string => Boolean(id))
    }
  }

  return {
    preferredBefore,
    preferredAfter,
    resolved,
    isHostile
  }
}

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

function runTargetResolutionAudit() {
  console.log(`======================================================================`)
  console.log(`[감사 개시] DirectBattle Target Resolution 및 Fizzle 방지 감사 스크립트`)
  console.log(`======================================================================`)

  const monarchIds = ['grellic', 'celaide', 'igris', 'dorga', 'mirage', 'pesta', 'belatus', 'nox', 'angel']
  let totalTests = 0
  let totalFailures = 0

  for (const monarchId of monarchIds) {
    console.log(`\n--------------------------------------------------`)
    console.log(`>> 군주: ${monarchId.toUpperCase()} 분석 중...`)
    console.log(`--------------------------------------------------`)

    // 보스 정보 및 파티 빌드
    const cp = monarchId === 'angel' ? 50000 : (MONARCHS.find(m => m.id === monarchId)?.recommendedCP ?? 30000)
    const bossUnit = buildMonarchBattleUnit(monarchId, cp)

    // 페이즈 정의
    const phases = [
      { name: 'Phase 1 (HP 100%)', hpPct: 1.0 },
      { name: 'Phase 2 (HP 50%)', hpPct: 0.5 },
    ]
    if (['nox', 'angel'].includes(monarchId)) {
      phases.push({ name: 'Phase 3 (HP 20%)', hpPct: 0.2 })
    }

    for (const phase of phases) {
      console.log(`\n  [${phase.name}]`)

      // 매 페이즈마다 새로운 3인 플레이어 팀 생성
      const players = buildPlayerParty()
      const state = createDirectBattleState([...players, bossUnit])

      // HP 강제 주입
      bossUnit.stats.currentHp = Math.round(bossUnit.stats.maxHp * phase.hpPct)

      // 최소 6턴 cycle의 텔레그래프를 direct battle action으로 생성하여 검사
      for (let turn = 0; turn < 6; turn++) {
        totalTests++
        // 텔레그래프 분석
        const telegraph = resolveMonarchBossAction(bossUnit, turn, state)
        const action = telegraph.action

        // 1. preferred target 설정 시뮬레이션 (chooseTargetByRule)
        const preferredIds = chooseTargetByRule(state, bossUnit, telegraph.targetRule)

        // 2. resolveTargets 시뮬레이션
        const sim = simulateResolveTargets(state, bossUnit, action, preferredIds)

        // 3. living 플레이어/에너미 목록 추출
        const livingPlayers = livingUnits(state, 'player')
        const livingEnemies = livingUnits(state, 'enemy')

        // 4. fizzle 발생 가능 여부 판별 (targets.length === 0 이고 targetType !== 'self')
        const isSelfType = action.targetType === 'self'
        const initialFizzle = sim.resolved.length === 0 && !isSelfType

        // 1차 fallback retargeting 적용 후 최종 fizzle 여부 판별
        let finalResolved = [...sim.resolved]
        if (finalResolved.length === 0 && !isSelfType) {
          const fallbackSim = simulateResolveTargets(state, bossUnit, action, [])
          finalResolved = [...fallbackSim.resolved]
        }
        const finalFizzle = finalResolved.length === 0 && !isSelfType

        // 5. 모순 검사
        const targetTypeIsAlly = allyTargetTypes.has(action.targetType)
        const isHostile = sim.isHostile
        let contradiction = false
        let errorMsg = ''

        if (targetTypeIsAlly && isHostile) {
          contradiction = true
          errorMsg = `[모순] targetType('${action.targetType}')은 아군 대상인데 hostile 판단됨.`
        }
        if (isSelfType && isHostile) {
          contradiction = true
          errorMsg = `[모순] targetType('self')인데 hostile 판단됨.`
        }

        // 6. 통과 기준 검사
        let passed = true
        let reason = 'PASS'

        if (contradiction) {
          passed = false
          reason = `FAIL: ${errorMsg}`
        } else if (isHostile) {
          // 적대 행동인데 타겟이 없거나 아군 대상을 타겟팅한 경우
          if (finalResolved.length === 0) {
            passed = false
            reason = `FAIL: Hostile 스킬인데 타겟 없음 (fizzle 발생)`
          } else {
            const hasEnemyTarget = finalResolved.some(id => findUnit(state, id)?.team === 'player')
            if (!hasEnemyTarget) {
              passed = false
              reason = `FAIL: Hostile 스킬인데 적군(player)을 타겟으로 잡지 않음 (${finalResolved.join(', ')})`
            }
          }
        } else {
          // 서포트/아군 행동인데 적을 타겟팅하거나 타겟이 빈 경우
          if (finalResolved.length === 0) {
            passed = false
            reason = `FAIL: Support/Self 스킬인데 타겟 없음 (fizzle 발생)`
          } else {
            const hasAllyTarget = finalResolved.some(id => findUnit(state, id)?.team === 'enemy')
            if (!hasAllyTarget) {
              passed = false
              reason = `FAIL: Support/Self 스킬인데 아군(enemy)을 타겟으로 잡지 않음 (${finalResolved.join(', ')})`
            }
          }
        }

        // AoE 스킬 특수 검사
        if (passed && action.targetType === 'all_enemies') {
          if (finalResolved.length !== livingPlayers.length) {
            passed = false
            reason = `FAIL: all_enemies 광역 스킬인데 살아있는 플레이어 파티 전원(${livingPlayers.length}명)을 잡지 않음 (실제: ${finalResolved.length}명)`
          }
        }

        if (!passed) {
          totalFailures++
        }

        // 상세 출력
        console.log(`    - 턴 ${turn + 1}: ${action.label} (${action.actionId})`)
        console.log(`      * [Telegraph] Rule: ${telegraph.targetRule} | TargetType: ${action.targetType} | EffectKind: ${action.effectKind}`)
        console.log(`      * [Properties] isHostile: ${isHostile} | isAllyTarget: ${isAllyTargetAction(action)}`)
        console.log(`      * [Resolution] Preferred(before/after): [${sim.preferredBefore.join(', ')}] -> [${sim.preferredAfter.join(', ')}]`)
        console.log(`      * [Resolution] Final Resolved Targets: [${finalResolved.join(', ')}]`)
        console.log(`      * [Status] Players: ${livingPlayers.length} | Enemies: ${livingEnemies.length}`)
        console.log(`      * [Fizzle] Initial Would Fizzle: ${initialFizzle} | Final Fizzle: ${finalFizzle}`)
        console.log(`      * [Audit Result] ${passed ? '🟢 PASS' : '🔴 ' + reason}`)
      }
    }
  }

  console.log(`\n======================================================================`)
  console.log(`[감사 완료] 총 테스트 수: ${totalTests} | 실패 건수: ${totalFailures}`)
  console.log(`======================================================================`)

  if (totalFailures > 0) {
    console.error(`❌ [실패] 일부 군주 액션의 Target Resolution 검증에 실패했습니다.`)
    process.exit(1)
  } else {
    console.log(`✅ [성공] 모든 군주 액션의 Target Resolution 및 Fizzle 방지 조건이 완벽히 만족합니다.`)
  }
}

runTargetResolutionAudit()
