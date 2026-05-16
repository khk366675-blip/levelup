/**
 * 12-11 shadow battle balance simulation.
 * Run with: npx tsx scripts/sim-shadow-battle-balance.ts
 */
import { GATE_DEFINITIONS, ITEM_POOL, MONSTER_DEFINITIONS, SKILL_DEFINITIONS } from '../src/lib/seed'
import {
  calculateCombatPower,
  calculatePlayerCombatStats,
  formatEnhancementLabel,
  getPlayerCombatSkills,
  summarizeGateWaveBattleSimulations,
} from '../src/lib/game'
import { SHADOW_DEFINITIONS, createOwnedShadow, getEquippedShadowStatBonuses } from '../src/lib/shadows'
import type { Item, JobId, MonsterDefinition, OwnedShadow, StatKey } from '../src/lib/types'

const ITERATIONS = 160
const SEED_BASE = 121_100

interface BuildItemSpec {
  name: string
  enhancementLevel?: number
}

interface BuildSpec {
  id: string
  level: number
  jobId: JobId
  stats: Record<StatKey, number>
  items?: BuildItemSpec[]
}

const BUILDS: BuildSpec[] = [
  { id: 'A', level: 5, jobId: 'unawakened', stats: { STR: 12, VIT: 12, AGI: 11, INT: 11, PER: 11, SEN: 11 } },
  { id: 'B', level: 10, jobId: 'unawakened', stats: { STR: 20, VIT: 20, AGI: 16, INT: 21, PER: 18, SEN: 17 }, items: [{ name: '의지의 룬' }] },
  { id: 'C', level: 20, jobId: 'grimoire-decoder', stats: { STR: 26, VIT: 28, AGI: 20, INT: 38, PER: 30, SEN: 24 }, items: [{ name: '강철 손목보호대', enhancementLevel: 1 }, { name: '고요의 반지' }] },
  { id: 'D', level: 30, jobId: 'steelheart-fighter', stats: { STR: 58, VIT: 62, AGI: 42, INT: 72, PER: 58, SEN: 50 }, items: [{ name: '그림자 단검', enhancementLevel: 1 }, { name: '강철 손목보호대', enhancementLevel: 2 }, { name: '금서의 책갈피', enhancementLevel: 1 }] },
  { id: 'E', level: 45, jobId: 'fate-harmonizer', stats: { STR: 92, VIT: 98, AGI: 70, INT: 126, PER: 96, SEN: 82 }, items: [{ name: '투사의 장갑', enhancementLevel: 3 }, { name: '검은 정장', enhancementLevel: 2 }, { name: '시간의 회중시계', enhancementLevel: 3 }, { name: '시스템의 조각', enhancementLevel: 2 }] },
  { id: 'F', level: 60, jobId: 'fate-harmonizer', stats: { STR: 140, VIT: 150, AGI: 105, INT: 185, PER: 142, SEN: 122 }, items: [{ name: '왕의 검', enhancementLevel: 4 }, { name: '그림자 왕관', enhancementLevel: 3 }, { name: '시간의 회중시계', enhancementLevel: 4 }, { name: '시스템의 조각', enhancementLevel: 4 }] },
]

const GATE_IDS = [
  'gate-rift-alley',
  'gate-rift-backstreet',
  'gate-rift-nest',
  'gate-lair-of-sloth',
  'gate-sloth-patrol',
  'gate-archive-of-forgetting',
  'gate-corridor-of-fatigue',
  'gate-rift-training-grounds',
  'gate-greed-vault',
]

const CASES: Array<{ id: string; shadowIds: string[]; enhanceLevel?: number }> = [
  { id: 'no_shadow', shadowIds: [] },
  { id: 'common_shadow', shadowIds: ['shadow-infantry'] },
  { id: 'common_shadow_plus3', shadowIds: ['shadow-infantry'], enhanceLevel: 3 },
  { id: 'rare_shadow', shadowIds: ['black-shieldman'] },
  { id: 'rare_shadow_plus3', shadowIds: ['black-shieldman'], enhanceLevel: 3 },
  { id: 'gate_named_shadow', shadowIds: ['organ-fatigue-shield'] },
  { id: 'gate_named_shadow_plus3', shadowIds: ['organ-fatigue-shield'], enhanceLevel: 3 },
  { id: 'achievement_named_shadow', shadowIds: ['verk-steel-knight'] },
  { id: 'mixed_2_slots', shadowIds: ['shadow-infantry', 'sloth-hunter'] },
  { id: 'mixed_3_slots', shadowIds: ['raban-rift-instructor', 'forgetting-scribe', 'greed-collector'] },
  { id: 'mixed_enhanced', shadowIds: ['shadow-infantry', 'black-shieldman', 'organ-fatigue-shield'], enhanceLevel: 3 },
]

const makeItem = (spec: BuildItemSpec): Item => {
  const base = ITEM_POOL.find(item => item.name === spec.name)
  if (!base) throw new Error(`Unknown item in sim build: ${spec.name}`)
  return {
    ...base,
    id: `sim-${spec.name}-${spec.enhancementLevel ?? 0}`,
    acquiredAt: '2026-05-16T00:00:00.000Z',
    enhancementLevel: spec.enhancementLevel,
  }
}

const makeShadows = (ids: string[], enhanceLevel?: number): OwnedShadow[] => ids.map(id => {
  const def = SHADOW_DEFINITIONS.find(item => item.id === id)
  if (!def) throw new Error(`Unknown shadow in sim case: ${id}`)
  return { ...createOwnedShadow(def, () => 0.42), enhancementLevel: enhanceLevel ?? 0 }
})

const applyShadowStatBonuses = (stats: Record<StatKey, number>, shadows: OwnedShadow[]): Record<StatKey, number> => {
  const next = { ...stats }
  const bonuses = getEquippedShadowStatBonuses(shadows)
  for (const [stat, value] of Object.entries(bonuses)) {
    next[stat as StatKey] += value ?? 0
  }
  return next
}

const monsterSkillsFor = (monsters: MonsterDefinition[]) => {
  const ids = new Set(monsters.flatMap(monster => monster.skillIds))
  return SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && ids.has(skill.id))
}

console.log('# 12-13 Shadow Battle Balance (with enhancement)')
console.log(`iterations: ${ITERATIONS}`)
console.log('')
console.log('| Build | Case | Gate | Rank | Power | Victory | Defeat | Draw | AvgTurns | AvgHP | Notes |')
console.log('|---|---|---|---|---:|---:|---:|---:|---:|---:|---|')

for (const build of BUILDS) {
  const equippedItems = (build.items ?? []).map(makeItem)
  for (const testCase of CASES) {
    const shadows = makeShadows(testCase.shadowIds, testCase.enhanceLevel)
    const skills = getPlayerCombatSkills({ jobId: build.jobId, equippedItems, allSkills: SKILL_DEFINITIONS })
    const playerStats = calculatePlayerCombatStats({
      level: build.level,
      stats: applyShadowStatBonuses(build.stats, shadows),
      equippedItems,
      jobId: build.jobId,
      skills,
    })
    const power = calculateCombatPower(playerStats)

    for (const gateId of GATE_IDS) {
      const gate = GATE_DEFINITIONS.find(item => item.id === gateId)
      if (!gate) throw new Error(`Unknown gate: ${gateId}`)
      const monsters = gate.monsterIds
        .map(monsterId => MONSTER_DEFINITIONS.find(monster => monster.id === monsterId))
        .filter((monster): monster is MonsterDefinition => Boolean(monster))
      const summary = summarizeGateWaveBattleSimulations({
        iterations: ITERATIONS,
        playerStats,
        monsters,
        skills: [...skills, ...monsterSkillsFor(monsters)],
        equippedShadows: shadows,
        gateInstanceId: `sim-shadow-${build.id}-${testCase.id}-${gate.id}`,
        seedBase: SEED_BASE + build.id.charCodeAt(0) * 10_000 + testCase.id.length * 100 + gate.id.length + (testCase.enhanceLevel ?? 0) * 1_000,
      })
      const notes: string[] = []
      if (build.id === 'C' && gate.rank === 'C' && summary.victoryRate > 0.35) notes.push('Build C C-gate too easy')
      if (build.id === 'D' && gate.rank === 'C' && summary.victoryRate >= 0.95) notes.push('Build D C-gate high')
      if (build.id === 'D' && gate.rank === 'C' && testCase.enhanceLevel && summary.victoryRate >= 0.98) notes.push('D C-gate enhanced too high')
      if (gate.rank === 'E' && build.id === 'A' && summary.victoryRate < 0.6) notes.push('E entry hard')

      console.log(
        `| ${build.id} | ${testCase.id} | ${gate.name} | ${gate.rank} | ${power} | ` +
        `${(summary.victoryRate * 100).toFixed(0)}% | ${(summary.defeatRate * 100).toFixed(0)}% | ${(summary.drawRate * 100).toFixed(0)}% | ` +
        `${summary.averageTurns.toFixed(1)} | ${summary.averagePlayerHpRemaining.toFixed(1)} | ${notes.join(', ') || '-'} |`
      )
    }
  }
}

