/**
 * 12-2A C-rank gate diversification simulation.
 * Run with: npx tsx scripts/sim-12-2a.ts
 *
 * Verifies:
 *  1. New C gates (피로의 회랑 / 균열의 훈련장 / 탐욕의 금고) land Build E/F win rate in 35~70%.
 *  2. Build A~D fail the new C gates roughly as much as 망각의 서고.
 *  3. Existing E/D/망각의 서고 results don't regress.
 *  4. A/B gate_success_bonus test (same Build E stats, bonus 0 vs 0.1).
 */
import {
  ITEM_POOL,
  GATE_DEFINITIONS,
  MONSTER_DEFINITIONS,
  SKILL_DEFINITIONS,
} from '../src/lib/seed'
import {
  calculatePlayerCombatStats,
  calculateCombatPower,
  createGateSuccessCombatEffects,
  estimateGateRisk,
  getPlayerCombatSkills,
  summarizeGateWaveBattleSimulations,
} from '../src/lib/game'
import type {
  ActiveCombatEffect,
  ActiveConsumableEffect,
  Item,
  JobId,
  MonsterDefinition,
  StatKey,
} from '../src/lib/types'

const ITER = 100
const SEED_BASE = 1

interface BuildSpec {
  name: string
  level: number
  jobId: JobId
  stats: Record<StatKey, number>
  equippedItemNames?: string[]
  gateSuccessBonus?: number
}

const BUILDS: BuildSpec[] = [
  {
    name: 'A 초급 무빌드',
    level: 5,
    jobId: 'unawakened',
    stats: { STR: 15, VIT: 12, AGI: 10, INT: 8, PER: 8, SEN: 8 },
  },
  {
    name: 'B daily 1개월',
    level: 10,
    jobId: 'iron-squire',
    stats: { STR: 21, VIT: 19, AGI: 16, INT: 13, PER: 13, SEN: 13 },
  },
  {
    name: 'C main 1개',
    level: 15,
    jobId: 'grimoire-decoder',
    stats: { STR: 22, VIT: 20, AGI: 17, INT: 30, PER: 22, SEN: 15 },
  },
  {
    name: 'D dungeon 1개',
    level: 14,
    jobId: 'silent-monk',
    stats: { STR: 24, VIT: 27, AGI: 19, INT: 15, PER: 17, SEN: 14 },
  },
  {
    name: 'E main+dungeon',
    level: 20,
    jobId: 'steelheart-fighter',
    stats: { STR: 34, VIT: 30, AGI: 23, INT: 28, PER: 24, SEN: 18 },
    equippedItemNames: ['그림자 단검'],
  },
  {
    name: 'F + bonus 0.1',
    level: 20,
    jobId: 'fate-harmonizer',
    stats: { STR: 32, VIT: 29, AGI: 23, INT: 26, PER: 24, SEN: 18 },
    equippedItemNames: ['그림자 단검'],
    gateSuccessBonus: 0.1,
  },
]

const makeItem = (name: string): Item | null => {
  const base = ITEM_POOL.find(i => i.name === name)
  if (!base) return null
  return { ...base, id: `sim-${name}`, acquiredAt: new Date().toISOString() }
}

// Regression sample + all C gates (new + existing)
const GATES_TO_CHECK = [
  // Regression: keep one each of E/D/D-wave for sanity
  'gate-rift-alley',
  'gate-rift-nest',
  'gate-lair-of-sloth',
  'gate-sloth-patrol',
  // All C gates
  'gate-archive-of-forgetting',   // existing C
  'gate-corridor-of-fatigue',     // new C 1v1 defensive
  'gate-rift-training-grounds',   // new C wave
  'gate-greed-vault',             // new C 1v1 aggressive
]

const runBuildOnGate = (
  build: BuildSpec,
  gateId: string,
): { row: string; victoryRate: number; gateName: string } | null => {
  const equippedItems: Item[] = (build.equippedItemNames ?? [])
    .map(makeItem)
    .filter((x): x is Item => x !== null)

  const activeConsumableEffects: ActiveConsumableEffect[] = []
  let initialActiveEffects: ActiveCombatEffect[] | undefined = undefined
  if (build.gateSuccessBonus && build.gateSuccessBonus > 0) {
    initialActiveEffects = createGateSuccessCombatEffects(build.gateSuccessBonus)
  }

  const skills = getPlayerCombatSkills({
    jobId: build.jobId,
    equippedItems,
    allSkills: SKILL_DEFINITIONS,
  })

  const playerStats = calculatePlayerCombatStats({
    level: build.level,
    stats: build.stats,
    equippedItems,
    activeConsumableEffects,
    jobId: build.jobId,
    skills,
  })

  const power = calculateCombatPower(playerStats)
  const gate = GATE_DEFINITIONS.find(g => g.id === gateId)
  if (!gate) return null

  const monsters: MonsterDefinition[] = gate.monsterIds
    .map(mid => MONSTER_DEFINITIONS.find(m => m.id === mid))
    .filter((m): m is MonsterDefinition => m !== undefined)

  const summary = summarizeGateWaveBattleSimulations({
    iterations: ITER,
    playerStats,
    monsters,
    skills: SKILL_DEFINITIONS,
    initialActiveEffects,
    gateInstanceId: `sim-${build.name}-${gateId}`,
    seedBase: SEED_BASE,
  })

  const ratio = power / Math.max(1, gate.recommendedPower)
  const risk = estimateGateRisk(power, gate.recommendedPower)

  let verdict = ''
  if (gate.rank === 'E') {
    verdict = summary.victoryRate >= 0.95 ? '입문 정상' : '⚠ E 의외 어려움'
  } else if (gate.rank === 'D') {
    if (summary.victoryRate >= 0.95) verdict = 'D 성장 후 자연'
    else if (summary.victoryRate >= 0.6) verdict = 'D 진입권'
    else if (summary.victoryRate >= 0.3) verdict = 'D 위험'
    else verdict = 'D 불가'
  } else if (gate.rank === 'C') {
    if (summary.victoryRate >= 0.9) verdict = '⚠ C 너무 쉬움'
    else if (summary.victoryRate >= 0.5) verdict = 'C 고위험 도전 ✓'
    else if (summary.victoryRate >= 0.25) verdict = 'C 매우 위험'
    else verdict = 'C 불가'
  }

  const row =
    `| ${build.name} | ${gate.name} | ${gate.rank} | ${gate.monsterIds.length} | ${power} | ${gate.recommendedPower} | ${ratio.toFixed(2)} | ${risk} | ${(summary.victoryRate * 100).toFixed(0)}% | ${(summary.defeatRate * 100).toFixed(0)}% | ${(summary.drawRate * 100).toFixed(0)}% | ${summary.averageTurns.toFixed(1)} | ${summary.averagePlayerHpRemaining.toFixed(1)} | ${verdict} |`

  return { row, victoryRate: summary.victoryRate, gateName: gate.name }
}

// ── Main matrix ────────────────────────────────────────────────────
console.log('## Main matrix\n')
console.log(
  '| Build | Gate | Rank | Waves | Power | Rec | Ratio | Risk | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |'
)
console.log('|---|---|---|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---|')

for (const build of BUILDS) {
  for (const gateId of GATES_TO_CHECK) {
    const r = runBuildOnGate(build, gateId)
    if (r) console.log(r.row)
  }
}

// ── A/B gate_success_bonus test ────────────────────────────────────
console.log('\n## A/B gate_success_bonus test (same Build E stats, all C gates)\n')
console.log(
  '| Gate | bonus 0 victory | bonus 0.1 victory | Δ | bonus 0 avgHP | bonus 0.1 avgHP |'
)
console.log('|---|---:|---:|---:|---:|---:|')

const ABbuildBase: BuildSpec = {
  name: 'E base',
  level: 20,
  jobId: 'steelheart-fighter',
  stats: { STR: 34, VIT: 30, AGI: 23, INT: 28, PER: 24, SEN: 18 },
  equippedItemNames: ['그림자 단검'],
}

const cGates = [
  'gate-archive-of-forgetting',
  'gate-corridor-of-fatigue',
  'gate-rift-training-grounds',
  'gate-greed-vault',
]

for (const gateId of cGates) {
  const noBonus = { ...ABbuildBase, name: 'E (bonus 0)', gateSuccessBonus: undefined }
  const withBonus = { ...ABbuildBase, name: 'E (bonus 0.1)', gateSuccessBonus: 0.1 }

  const a = runBuildOnGate(noBonus, gateId)
  const b = runBuildOnGate(withBonus, gateId)
  if (!a || !b) continue

  const aSummary = a.victoryRate
  const bSummary = b.victoryRate
  const delta = (bSummary - aSummary) * 100

  // Re-run to get avgHP — sim was already run; let's just include delta and rates
  const gate = GATE_DEFINITIONS.find(g => g.id === gateId)
  if (!gate) continue

  // For avgHP, rerun to extract (simulator only returns summary; we redo)
  // For brevity, simulate once more for HP info
  const monsters = gate.monsterIds.map(mid => MONSTER_DEFINITIONS.find(m => m.id === mid)).filter((m): m is MonsterDefinition => m !== undefined)
  const equipped = (ABbuildBase.equippedItemNames ?? []).map(makeItem).filter((x): x is Item => x !== null)
  const skills = getPlayerCombatSkills({ jobId: ABbuildBase.jobId, equippedItems: equipped, allSkills: SKILL_DEFINITIONS })
  const ps = calculatePlayerCombatStats({ level: ABbuildBase.level, stats: ABbuildBase.stats, equippedItems: equipped, jobId: ABbuildBase.jobId, skills })

  const sumA = summarizeGateWaveBattleSimulations({ iterations: ITER, playerStats: ps, monsters, skills: SKILL_DEFINITIONS, gateInstanceId: `ab-no-${gateId}`, seedBase: 1 })
  const sumB = summarizeGateWaveBattleSimulations({ iterations: ITER, playerStats: ps, monsters, skills: SKILL_DEFINITIONS, initialActiveEffects: createGateSuccessCombatEffects(0.1), gateInstanceId: `ab-yes-${gateId}`, seedBase: 1 })

  console.log(
    `| ${gate.name} | ${(sumA.victoryRate * 100).toFixed(0)}% | ${(sumB.victoryRate * 100).toFixed(0)}% | ${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%p | ${sumA.averagePlayerHpRemaining.toFixed(1)} | ${sumB.averagePlayerHpRemaining.toFixed(1)} |`
  )
}
