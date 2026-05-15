/**
 * 12-1E Gate/Monster simulation harness.
 * Run with: npx tsx scripts/sim-12-1e.ts
 *
 * Runs 6 hypothetical growth builds × 6 gates × 100 iterations each.
 * Prints a markdown table to stdout for CLAUDE.md.
 *
 * This is a one-shot analysis script. Not part of the app build.
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

// Resolve item names → full Item objects (with sim ids)
const makeItem = (name: string): Item | null => {
  const base = ITEM_POOL.find(i => i.name === name)
  if (!base) return null
  return { ...base, id: `sim-${name}`, acquiredAt: new Date().toISOString() }
}

// Gates to check (E, E-wave, D, D-wave, C, plus 뒤틀린 뒷골목 E as control)
const GATES_TO_CHECK = [
  'gate-rift-alley',         // E 1v1
  'gate-rift-backstreet',    // E 1v1 (sister)
  'gate-rift-nest',          // E wave
  'gate-lair-of-sloth',      // D 1v1
  'gate-sloth-patrol',       // D wave
  'gate-archive-of-forgetting', // C 1v1
]

const rows: string[] = []
rows.push(
  '| Build | Gate | Rank | Waves | Power | Rec | Ratio | Risk | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |'
)
rows.push('|---|---|---|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---|')

for (const build of BUILDS) {
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

  for (const gateId of GATES_TO_CHECK) {
    const gate = GATE_DEFINITIONS.find(g => g.id === gateId)
    if (!gate) continue

    const monsters: MonsterDefinition[] = gate.monsterIds
      .map(mid => MONSTER_DEFINITIONS.find(m => m.id === mid))
      .filter((m): m is MonsterDefinition => m !== undefined)

    const summary = summarizeGateWaveBattleSimulations({
      iterations: ITER,
      playerStats,
      monsters,
      skills: SKILL_DEFINITIONS, // simulator filters by actor's skillIds
      initialActiveEffects,
      gateInstanceId: `sim-${build.name}-${gateId}`,
      seedBase: SEED_BASE,
    })

    const ratio = power / Math.max(1, gate.recommendedPower)
    const risk = estimateGateRisk(power, gate.recommendedPower)

    // Verdict
    const winRate = summary.victoryRate
    let verdict = ''
    if (gate.rank === 'E') {
      if (winRate >= 0.95) verdict = '입문 정상'
      else if (winRate >= 0.7) verdict = 'E급 약간 도전'
      else verdict = '⚠ E급 의외로 어려움'
    } else if (gate.rank === 'D') {
      if (winRate >= 0.95) verdict = gate.monsterIds.length > 1 ? 'D wave 매우 쉬움' : 'D 매우 쉬움 (성장 후 자연스러움)'
      else if (winRate >= 0.6) verdict = '진입~중급 정상'
      else if (winRate >= 0.3) verdict = '위험하지만 가능'
      else verdict = '진입 불가'
    } else if (gate.rank === 'C') {
      if (winRate >= 0.9) verdict = '⚠ C급 너무 쉬움'
      else if (winRate >= 0.5) verdict = 'C급 고위험 도전'
      else if (winRate >= 0.1) verdict = 'C급 매우 위험'
      else verdict = 'C급 불가'
    }

    rows.push(
      `| ${build.name} | ${gate.name} | ${gate.rank} | ${gate.monsterIds.length} | ${power} | ${gate.recommendedPower} | ${ratio.toFixed(2)} | ${risk} | ${(winRate * 100).toFixed(0)}% | ${(summary.defeatRate * 100).toFixed(0)}% | ${(summary.drawRate * 100).toFixed(0)}% | ${summary.averageTurns.toFixed(1)} | ${summary.averagePlayerHpRemaining.toFixed(1)} | ${verdict} |`
    )
  }
}

console.log(rows.join('\n'))
