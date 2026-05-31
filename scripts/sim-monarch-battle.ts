/**
 * L4-B Monarch battle balance simulation using Direct Battle.
 * Run with: npx tsx scripts/sim-monarch-battle.ts
 */
import { MONARCHS, FINAL_ANGEL, buildMonarchBattleUnit } from '../src/lib/monarchs'
import { SKILL_DEFINITIONS } from '../src/lib/seed'
import {
  calculateCombatPower,
  calculatePlayerCombatStats,
  getPlayerCombatSkills,
} from '../src/lib/game'
import {
  buildHunterBattleUnit,
  buildShadowBattleUnits,
} from '../src/lib/battleUnits'
import {
  createDirectBattleState,
  runMockDirectBattle,
} from '../src/lib/directBattleRuntime'
import { getShadowDefinition } from '../src/lib/shadows'
import { getShadowArmyCombatPower, registerLegionNodeLevelResolver } from '../src/lib/shadowStats'
import type {
  HunterState,
  OwnedShadow,
} from '../src/lib/types'
import type { BattleUnit, BattleStats } from '../src/lib/directBattleTypes'

// Register max level legion nodes for simulation
registerLegionNodeLevelResolver((nodeId) => {
  if (nodeId === 'node_hp') return 10
  if (nodeId === 'node_atk') return 10
  if (nodeId === 'node_def') return 10
  return 0
})

const ITERATIONS = 100

// Tuning Constants (from store.ts or adjustable)
const COOP_HELP_ATK_FACTOR = 0.10
const COOP_HELP_DEF_FACTOR = 0.10
const COOP_HELP_DR_FACTOR = 0.20
const COOP_HELP_DR_CAP = 0.5

const SAFEGUARD_DR_VALUE = 0.15
const SAFEGUARD_DURATION_ROUNDS = 4
const REDIRECT_VALUE = 0.35

// Build a realistic endgame level 100 player
const mockHunter: HunterState = {
  name: '플레이어',
  level: 100,
  xp: 0,
  totalXp: 0,
  rank: 'S',
  job: '그림자 군주',
  jobId: 'fate-harmonizer',
  unlockedJobIds: ['fate-harmonizer'],
  stats: {
    STR: 1200,
    VIT: 600,
    AGI: 400,
    INT: 200,
    PER: 250,
    SEN: 120,
  },
  freeStatPoints: 0,
  streak: 10,
  categoryProgress: { gate: 0, training: 0, shadow: 0, gear: 0 },
  ownedTitleIds: [],
  activeJobId: 'fate-harmonizer',
  jobs: { 'fate-harmonizer': { jobId: 'fate-harmonizer', level: 10, xp: 0 } },
}

// Build 4 endgame legendary shadows to reach ~33,000 CP
const equippedShadows: OwnedShadow[] = [
  {
    instanceId: 's1',
    name: '커팅의 감시자 바론',
    role: 'guard',
    definitionId: 'baron-cutting-watcher',
    rarity: 'legendary',
    rank: 'named',
    level: 60,
    xp: 0,
    sourceType: 'achievement_named',
    obtainedAt: new Date().toISOString(),
    traits: [],
    traitIds: [
      'trait_legendary_monarch',
      'trait_epic_all',
      'trait_rare_hp',
      'trait_rare_atk',
      'trait_common_hp',
      'trait_common_atk',
      'trait_common_def',
      'trait_common_spd',
    ],
    shadowPassiveIds: ['pass_hp_3', 'pass_atk_3', 'pass_def_3'],
    enhancementLevel: 10,
    evolutionStage: 5,
    isAchievementNamed: true,
    innateGrade: 'S',
  },
  {
    instanceId: 's2',
    name: '강철의 기사 베르크',
    role: 'assault',
    definitionId: 'verk-steel-knight',
    rarity: 'legendary',
    rank: 'named',
    level: 60,
    xp: 0,
    sourceType: 'achievement_named',
    obtainedAt: new Date().toISOString(),
    traits: [],
    traitIds: [
      'trait_legendary_monarch',
      'trait_epic_all',
      'trait_rare_hp',
      'trait_rare_atk',
      'trait_common_hp',
      'trait_common_atk',
      'trait_common_def',
      'trait_common_spd',
    ],
    shadowPassiveIds: ['pass_hp_3', 'pass_atk_3', 'pass_def_3'],
    enhancementLevel: 10,
    evolutionStage: 5,
    isAchievementNamed: true,
    innateGrade: 'S',
  },
  {
    instanceId: 's3',
    name: '검은 추격자 샤크',
    role: 'scout',
    definitionId: 'shark-black-chaser',
    rarity: 'legendary',
    rank: 'named',
    level: 60,
    xp: 0,
    sourceType: 'gate_named',
    obtainedAt: new Date().toISOString(),
    traits: [],
    traitIds: [
      'trait_legendary_monarch',
      'trait_epic_all',
      'trait_rare_hp',
      'trait_rare_atk',
      'trait_common_hp',
      'trait_common_atk',
      'trait_common_def',
      'trait_common_spd',
    ],
    shadowPassiveIds: ['pass_hp_3', 'pass_atk_3', 'pass_def_3'],
    enhancementLevel: 10,
    evolutionStage: 5,
    isGateNamed: true,
    innateGrade: 'S',
  },
  {
    instanceId: 's4',
    name: '금융 패트론 차르카',
    role: 'support',
    definitionId: 'charka-finance-patron',
    rarity: 'legendary',
    rank: 'named',
    level: 60,
    xp: 0,
    sourceType: 'achievement_named',
    obtainedAt: new Date().toISOString(),
    traits: [],
    traitIds: [
      'trait_legendary_monarch',
      'trait_epic_all',
      'trait_rare_hp',
      'trait_rare_atk',
      'trait_common_hp',
      'trait_common_atk',
      'trait_common_def',
      'trait_common_spd',
    ],
    shadowPassiveIds: ['pass_hp_3', 'pass_atk_3', 'pass_def_3'],
    enhancementLevel: 10,
    evolutionStage: 5,
    isAchievementNamed: true,
    innateGrade: 'S',
  },
]

function runSim(
  monarch: { id: string; name: string; recommendedCP: number },
  shadowCount: number,
  helperPower: number,
  helperCount: number
) {
  let victories = 0
  let totalTurns = 0
  let totalPlayerHpRemaining = 0

  for (let i = 0; i < ITERATIONS; i++) {
    // 1. Build fresh hunter unit
    const hunterBuild = buildHunterBattleUnit(mockHunter, {
      items: [],
      equipment: {
        equippedWeaponId: null,
        equippedArmorId: null,
        equippedRingId: null,
        equippedNecklaceId: null,
        slots: {},
      } as any,
      activeConsumableEffects: [],
      unitId: 'direct-preview-hunter',
    })

    // 2. Build shadows
    const activeShadows = equippedShadows.slice(0, shadowCount)
    const shadowDefinitions = activeShadows
      .map(s => getShadowDefinition(s.definitionId))
      .filter((d): d is NonNullable<typeof d> => Boolean(d))
    const shadowBuilds = buildShadowBattleUnits(activeShadows, shadowDefinitions, {
      unitIdPrefix: 'direct-preview-shadow',
    })

    // 3. Inject coop helpers
    let buffCoopAtk = 0
    let buffCoopDef = 0
    let drCoop = 0
    if (helperCount > 0) {
      buffCoopAtk = Math.round(COOP_HELP_ATK_FACTOR * helperPower)
      buffCoopDef = Math.round(COOP_HELP_DEF_FACTOR * helperPower)
      drCoop = Math.min(COOP_HELP_DR_CAP, COOP_HELP_DR_FACTOR * helperCount)
    }

    if (buffCoopAtk > 0) hunterBuild.unit.stats.atk += buffCoopAtk
    if (buffCoopDef > 0) hunterBuild.unit.stats.def += buffCoopDef
    if (drCoop > 0) {
      hunterBuild.unit.statusEffects.push({
        statusId: `coop-dr-${i}`,
        definitionId: 'shield',
        name: '협력 방어',
        type: 'shield',
        targetUnitId: hunterBuild.unit.unitId,
        durationRounds: 999,
        stackCount: 1,
        maxStacks: 1,
        effectValue: drCoop,
        timing: 'round_start',
      })
    }

    // 4. Inject protect/safeguard if shadows are alive
    if (shadowBuilds.length > 0) {
      hunterBuild.unit.statusEffects.push({
        statusId: `shadow-guard-protect-${i}`,
        definitionId: 'protect',
        name: '그림자 보호',
        type: 'protect',
        sourceUnitId: shadowBuilds[0].unit.unitId,
        targetUnitId: hunterBuild.unit.unitId,
        durationRounds: 999,
        stackCount: 1,
        maxStacks: 1,
        effectValue: REDIRECT_VALUE,
        timing: 'round_start',
      })

      hunterBuild.unit.statusEffects.push({
        statusId: `monarch-safeguard-${i}`,
        definitionId: 'shield',
        name: '그림자 장벽',
        type: 'shield',
        targetUnitId: hunterBuild.unit.unitId,
        durationRounds: SAFEGUARD_DURATION_ROUNDS,
        stackCount: 1,
        maxStacks: 1,
        effectValue: SAFEGUARD_DR_VALUE,
        timing: 'round_start',
      })
    }

    // 5. Build Monarch unit
    const monarchUnit = buildMonarchBattleUnit(monarch.id, monarch.battleCP)

    // 6. Create Direct Battle state
    const dbUnits = [hunterBuild.unit, ...shadowBuilds.map(b => b.unit), monarchUnit]
    const dbState = createDirectBattleState(dbUnits, {
      battleId: `sim-monarch-${monarch.id}-${i}`,
      maxRounds: 25,
    })

    // 7. Run battle
    const result = runMockDirectBattle(dbState)

    if (result.winner === 'player') {
      victories++
    }
    totalTurns += result.roundsSimulated
    const finalHunter = result.state.units.find(u => u.unitType === 'hunter')
    totalPlayerHpRemaining += finalHunter ? finalHunter.stats.currentHp : 0
  }

  return {
    victoryRate: victories / ITERATIONS,
    averageTurns: totalTurns / ITERATIONS,
    averagePlayerHpRemaining: totalPlayerHpRemaining / ITERATIONS,
  }
}

// Compute player combat power
const hunterSkills = getPlayerCombatSkills({
  jobId: 'fate-harmonizer',
  equippedItems: [],
  allSkills: SKILL_DEFINITIONS,
})
const hunterStats = calculatePlayerCombatStats({
  level: mockHunter.level,
  stats: mockHunter.stats,
  equippedItems: [],
  activeConsumableEffects: [],
  jobId: 'fate-harmonizer',
  skills: hunterSkills,
})
const hunterCP = calculateCombatPower(hunterStats)

// Compute shadow army combat power
const shadowArmyCP = getShadowArmyCombatPower(equippedShadows).totalPower

console.log('=== 군주 격퇴전 밸런스 시뮬레이션 (Direct Battle) ===')
console.log(`플레이어 스펙: CP ${hunterCP.toLocaleString()} (HP ${hunterStats.maxHp.toLocaleString()}, ATK ${hunterStats.atk.toLocaleString()}, DEF ${hunterStats.def.toLocaleString()})`)
console.log(`그림자 군단 자체 전투력: CP ${shadowArmyCP.toLocaleString()}`)
console.log(`시뮬레이션 반복 횟수: ${ITERATIONS}회\n`)

console.log('| 군주 명칭 | 권장 CP | 솔로 격퇴 승률 | 그림자 탱킹(4명) 승률 | 풀 팀(그림자4+협력2) 승률 | 평균 턴수 | 생존 HP (풀팀) |')
console.log('|---|---:|---:|---:|---:|---:|---:|')

const targets = [...MONARCHS, FINAL_ANGEL]

for (const monarch of targets) {
  // 1. 솔로 격퇴 (그림자 없음, 협력 없음)
  const simSolo = runSim(monarch, 0, 0, 0)
  
  // 2. 그림자 탱킹 완성형 (4명 장착, 협력 없음)
  const simShadowOnly = runSim(monarch, 4, 0, 0)

  // 3. 풀 팀 (그림자 4명 장착 + 협력 헌터 2명 전투력 15k씩 = 30k 지원)
  const simFull = runSim(monarch, 4, 30000, 2)

  console.log(
    `| ${monarch.name} | ${monarch.recommendedCP.toLocaleString()} | ` +
    `${Math.round(simSolo.victoryRate * 100)}% | ` +
    `${Math.round(simShadowOnly.victoryRate * 100)}% | ` +
    `${Math.round(simFull.victoryRate * 100)}% | ` +
    `${simFull.averageTurns.toFixed(1)} | ` +
    `${Math.round(simFull.averagePlayerHpRemaining).toLocaleString()} |`
  )
}

console.log('\n=== 시뮬레이션 완료 ===')
