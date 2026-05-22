import { buildHunterBattleUnit, buildMonsterBattleUnit, buildShadowBattleUnit } from '../src/lib/battleUnits.ts'
import {
  buildDirectBattleEncounterParty,
  pickDirectGateEncounterKey,
  pickDirectTowerEncounterKey,
} from '../src/lib/directBattleEncounters.ts'
import { createDirectBattleState, runMockDirectBattle } from '../src/lib/directBattleRuntime.ts'
import { getMockDirectBattleMonster } from '../src/lib/directBattleMonsters.ts'
import { SHADOW_DEFINITIONS } from '../src/lib/shadows.ts'
import type { BattleStats, BattleUnit } from '../src/lib/directBattleTypes.ts'
import type { HunterState, OwnedShadow, Rank, ShadowDefinition } from '../src/lib/types.ts'

type StatRow = {
  label: string
  type: string
  level: number
  hp: number
  atk: number
  def: number
  spd: number
  skill: number
}

const rankBonus: Record<Rank, number> = {
  E: 1,
  D: 2,
  C: 3,
  B: 5,
  A: 7,
  S: 9,
  National: 9,
}

const statTotalForLevel = (level: number): number =>
  30 + Math.max(0, level - 1) * 4

const makeHunter = (level: number): HunterState => {
  const total = statTotalForLevel(level)
  const weights = { STR: 0.24, VIT: 0.22, AGI: 0.18, INT: 0.13, PER: 0.11, SEN: 0.12 }
  return {
    name: `Audit Hunter Lv${level}`,
    level,
    xp: 0,
    totalXp: 0,
    rank: level >= 30 ? 'B' : level >= 20 ? 'C' : level >= 10 ? 'D' : 'E',
    job: 'Audit Job',
    jobId: 'unawakened',
    unlockedJobIds: ['unawakened'],
    stats: {
      STR: Math.max(1, Math.round(total * weights.STR)),
      VIT: Math.max(1, Math.round(total * weights.VIT)),
      AGI: Math.max(1, Math.round(total * weights.AGI)),
      INT: Math.max(1, Math.round(total * weights.INT)),
      PER: Math.max(1, Math.round(total * weights.PER)),
      SEN: Math.max(1, Math.round(total * weights.SEN)),
    },
    freeStatPoints: 0,
    streak: 0,
    categoryProgress: {
      workout: 0,
      study: 0,
      career: 0,
      health: 0,
      mind: 0,
      finance: 0,
      social: 0,
      challenge: 0,
      habit: 0,
    },
    ownedTitleIds: [],
  }
}

const makeOwnedShadow = (
  definition: ShadowDefinition,
  index: number,
  level = 1,
): OwnedShadow => ({
  instanceId: `audit-shadow-${index}-${definition.id}`,
  definitionId: definition.id,
  name: definition.name,
  obtainedAt: new Date(0).toISOString(),
  sourceType: definition.sourceType,
  sourceGateId: definition.sourceGateId,
  sourceQuestId: definition.sourceQuestId,
  rarity: definition.rarity,
  birthRarity: definition.birthRarity ?? definition.rarity,
  innateGrade: 'B',
  rank: definition.rank,
  role: definition.role,
  traits: [],
  level,
  xp: 0,
  isNamed: definition.rank === 'named' || definition.isGateNamed || definition.isAchievementNamed,
  isGateNamed: definition.isGateNamed,
  isAchievementNamed: definition.isAchievementNamed,
  enhancementLevel: 0,
  absorbedCount: 0,
  evolutionStage: 0,
})

const rowFromUnit = (label: string, unit: BattleUnit): StatRow => ({
  label,
  type: unit.unitType,
  level: unit.level,
  hp: unit.stats.maxHp,
  atk: unit.stats.atk,
  def: unit.stats.def,
  spd: unit.stats.spd,
  skill: unit.stats.skillPower,
})

const printRows = (title: string, rows: StatRow[]) => {
  console.log(`\n${title}`)
  console.table(rows)
}

const sumStats = (units: BattleUnit[]): Pick<StatRow, 'hp' | 'atk' | 'def' | 'spd' | 'skill'> =>
  units.reduce(
    (sum, unit) => ({
      hp: sum.hp + unit.stats.maxHp,
      atk: sum.atk + unit.stats.atk,
      def: sum.def + unit.stats.def,
      spd: sum.spd + unit.stats.spd,
      skill: sum.skill + unit.stats.skillPower,
    }),
    { hp: 0, atk: 0, def: 0, spd: 0, skill: 0 },
  )

const hpSummary = (units: BattleUnit[], team: BattleUnit['team']) => {
  const teamUnits = units.filter(unit => unit.team === team)
  const current = teamUnits.reduce((sum, unit) => sum + Math.max(0, unit.stats.currentHp), 0)
  const max = teamUnits.reduce((sum, unit) => sum + unit.stats.maxHp, 0)
  return `${Math.round(current)}/${Math.round(max)}`
}

const representativeShadowIds = [
  'shadow-rat',
  'ember-mender',
  'black-claw',
  'iron-bastion',
  'verk-steel-knight',
]

const shadowDefinitions = representativeShadowIds
  .map(id => SHADOW_DEFINITIONS.find(definition => definition.id === id))
  .filter((definition): definition is ShadowDefinition => Boolean(definition))

const hunterRows = [5, 10, 20, 30].map(level =>
  rowFromUnit(`Hunter Lv${level}`, buildHunterBattleUnit(makeHunter(level)).unit),
)

const shadowRows = shadowDefinitions.map((definition, index) =>
  rowFromUnit(
    `${definition.rarity} ${definition.role} L1 B`,
    buildShadowBattleUnit(makeOwnedShadow(definition, index), definition).unit,
  ),
)

const monsterRows = [
  ['rift-charger', 6],
  ['rift-hexer', 11],
  ['iron-gatekeeper', 11],
  ['rift-commander', 16],
  ['abyss-devourer', 25],
].flatMap(([id, level], index) => {
  const monster = getMockDirectBattleMonster(String(id))
  return monster ? [rowFromUnit(`${monster.name} Lv${level}`, buildMonsterBattleUnit(monster, { level: Number(level), unitIdPrefix: `audit-monster-${index}` }).unit)] : []
})

printRows('Hunter BattleUnit stat samples', hunterRows)
printRows('Shadow BattleUnit stat samples', shadowRows)
printRows('Monster BattleUnit stat samples', monsterRows)

const playerParty = [
  buildHunterBattleUnit(makeHunter(20)).unit,
  ...shadowDefinitions.slice(0, 4).map((definition, index) =>
    buildShadowBattleUnit(makeOwnedShadow(definition, index), definition).unit,
  ),
]

printRows('Lv20 audit player party', playerParty.map(unit => rowFromUnit(unit.displayName, unit)))
console.log('Lv20 audit player party totals')
console.table([sumStats(playerParty)])

const gateSamples: Array<{ rank: Rank; recommendedLevel: number; seed: string }> = [
  { rank: 'E', recommendedLevel: 4, seed: 'audit-e' },
  { rank: 'D', recommendedLevel: 8, seed: 'audit-d' },
  { rank: 'C', recommendedLevel: 12, seed: 'audit-c' },
]

console.log('\nGate encounter audit')
for (const sample of gateSamples) {
  const encounterKey = pickDirectGateEncounterKey(sample.rank, sample.seed)
  const enemyLevel = Math.max(1, sample.recommendedLevel + (rankBonus[sample.rank] ?? 1))
  const enemyBuild = buildDirectBattleEncounterParty(encounterKey, enemyLevel)
  const state = createDirectBattleState([...playerParty, ...enemyBuild.units], {
    battleId: `audit-gate-${sample.rank}`,
    maxRounds: enemyBuild.encounter.maxRounds,
  })
  const result = runMockDirectBattle(state)
  console.log(
    `${sample.rank}-Gate ${encounterKey} Lv${enemyLevel}: winner=${result.winner}, rounds=${result.roundsSimulated}, playerHP=${hpSummary(result.state.units, 'player')}, enemyHP=${hpSummary(result.state.units, 'enemy')}`,
  )
  console.table(enemyBuild.units.map(unit => rowFromUnit(unit.displayName, unit)))
}

const towerSamples = [
  { floor: 1, type: 'normal' },
  { floor: 7, type: 'normal' },
  { floor: 15, type: 'boss' },
  { floor: 25, type: 'boss' },
] as const

console.log('\nTower encounter audit')
for (const sample of towerSamples) {
  const encounterKey = pickDirectTowerEncounterKey(sample.floor, sample.type)
  const enemyLevel = sample.type === 'boss'
    ? 8 + Math.floor(sample.floor * 0.85)
    : 5 + Math.floor(sample.floor * 0.72)
  const enemyBuild = buildDirectBattleEncounterParty(encounterKey, enemyLevel)
  const state = createDirectBattleState([...playerParty, ...enemyBuild.units], {
    battleId: `audit-tower-${sample.floor}`,
    maxRounds: enemyBuild.encounter.maxRounds,
  })
  const result = runMockDirectBattle(state)
  console.log(
    `Tower ${sample.floor}F ${sample.type} ${encounterKey} Lv${enemyLevel}: winner=${result.winner}, rounds=${result.roundsSimulated}, playerHP=${hpSummary(result.state.units, 'player')}, enemyHP=${hpSummary(result.state.units, 'enemy')}`,
  )
  console.table(enemyBuild.units.map(unit => rowFromUnit(unit.displayName, unit)))
}

const hunterLv20 = hunterRows.find(row => row.label === 'Hunter Lv20')
const commonShadow = shadowRows[0]
const rareShadow = shadowRows.find(row => row.label.includes('rare'))
const earlyMonster = monsterRows[0]
const bossMonster = monsterRows[monsterRows.length - 1]
const ratio = (a?: number, b?: number) => a && b ? Math.round((a / b) * 100) / 100 : 0

console.log('\nRelative balance notes')
console.log(`Common shadow ATK vs Hunter Lv20 ATK: ${ratio(commonShadow?.atk, hunterLv20?.atk)}x`)
console.log(`Rare shadow ATK vs Hunter Lv20 ATK: ${ratio(rareShadow?.atk, hunterLv20?.atk)}x`)
console.log(`Early monster ATK vs Hunter Lv20 ATK: ${ratio(earlyMonster?.atk, hunterLv20?.atk)}x`)
console.log(`Boss monster HP vs full Lv20 party HP: ${ratio(bossMonster?.hp, sumStats(playerParty).hp)}x`)

