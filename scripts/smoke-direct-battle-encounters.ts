import { buildHunterBattleUnit, buildShadowBattleUnits, validateBattleUnit } from '../src/lib/battleUnits.ts'
import {
  DIRECT_BATTLE_MOCK_ENCOUNTERS,
  buildDirectBattleEncounterParty,
  validateDirectBattleMockEncounters,
} from '../src/lib/directBattleEncounters.ts'
import { createDirectBattleState, runMockDirectBattle } from '../src/lib/directBattleRuntime.ts'
import { SHADOW_DEFINITIONS } from '../src/lib/shadows.ts'
import type { HunterState, OwnedShadow, ShadowDefinition } from '../src/lib/types.ts'

const hunter: HunterState = {
  name: 'Encounter Smoke Hunter',
  level: 22,
  xp: 0,
  totalXp: 0,
  rank: 'D',
  job: 'Encounter Smoke Job',
  jobId: 'unawakened',
  unlockedJobIds: ['unawakened'],
  stats: { STR: 21, VIT: 19, AGI: 18, INT: 16, PER: 15, SEN: 18 },
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

const toOwnedShadow = (definition: ShadowDefinition, index: number): OwnedShadow => ({
  instanceId: `encounter-smoke-shadow-${index}-${definition.id}`,
  definitionId: definition.id,
  name: definition.name,
  obtainedAt: new Date(0).toISOString(),
  sourceType: definition.sourceType,
  sourceGateId: definition.sourceGateId,
  sourceQuestId: definition.sourceQuestId,
  rarity: definition.rarity,
  birthRarity: definition.birthRarity ?? definition.rarity,
  innateGrade: index === 0 ? 'A' : 'B',
  rank: definition.rank,
  role: definition.role,
  traits: [],
  level: 12 + index,
  xp: 0,
  isNamed: definition.rank === 'named' || definition.isGateNamed || definition.isAchievementNamed,
  isGateNamed: definition.isGateNamed,
  isAchievementNamed: definition.isAchievementNamed,
  enhancementLevel: index,
  absorbedCount: 0,
  evolutionStage: 0,
})

const shadowDefinitions = SHADOW_DEFINITIONS
  .filter(definition => !definition.hiddenUntilObtained && !definition.isGateNamed)
  .slice(0, 3)
const playerUnits = [
  buildHunterBattleUnit(hunter).unit,
  ...buildShadowBattleUnits(shadowDefinitions.map(toOwnedShadow), shadowDefinitions).map(result => result.unit),
]

const encounterIssues = validateDirectBattleMockEncounters()
const encounterBuilds = DIRECT_BATTLE_MOCK_ENCOUNTERS.map(encounter => buildDirectBattleEncounterParty(encounter.encounterId))
const unitIssues = encounterBuilds.flatMap(build => build.units.flatMap(unit => validateBattleUnit(unit)))
const warningIssues = encounterBuilds.flatMap(build => build.warnings)
const runtimeEncounter = buildDirectBattleEncounterParty('tank_assassin')
const state = createDirectBattleState([...playerUnits, ...runtimeEncounter.units], {
  battleId: 'encounter-smoke-direct-battle',
  maxRounds: runtimeEncounter.encounter.maxRounds,
})
const result = runMockDirectBattle(state)
const runtimeIssues = [
  ...(result.logs.length === 0 ? ['No runtime logs were created'] : []),
  ...(result.state.actionQueue.length === 0 ? ['No ActionQueue was created'] : []),
  ...result.state.units.flatMap(unit => {
    const issues: string[] = []
    if (!Number.isFinite(unit.stats.currentHp)) issues.push(`${unit.unitId}.currentHp is not finite`)
    if (unit.stats.currentHp < 0) issues.push(`${unit.unitId}.currentHp is negative`)
    if (unit.stats.currentHp > unit.stats.maxHp) issues.push(`${unit.unitId}.currentHp exceeds maxHp`)
    return issues
  }),
]
const issues = [...encounterIssues, ...unitIssues, ...warningIssues, ...runtimeIssues]

console.log(`Encounter definitions: ${DIRECT_BATTLE_MOCK_ENCOUNTERS.length}`)
console.log(`Encounter monster units built: ${encounterBuilds.reduce((sum, build) => sum + build.units.length, 0)}`)
console.log(`Runtime encounter: ${runtimeEncounter.encounter.encounterId}`)
console.log(`Runtime player units: ${playerUnits.length}`)
console.log(`Runtime enemy units: ${runtimeEncounter.units.length}`)
console.log(`Runtime rounds: ${result.roundsSimulated}`)
console.log(`Runtime logs: ${result.logs.length}`)
console.log(`Runtime winner: ${result.winner}`)
console.log(`Validation issues: ${issues.length}`)
console.log('Gate/Tower connections: 0')

if (issues.length > 0) {
  console.error('Issues:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exitCode = 1
}
