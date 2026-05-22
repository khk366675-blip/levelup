import {
  buildHunterBattleUnit,
  buildMockMonsterParty,
  buildShadowBattleUnits,
  validateBattleUnit,
} from '../src/lib/battleUnits.ts'
import { SHADOW_DEFINITIONS } from '../src/lib/shadows.ts'
import type { HunterState, OwnedShadow, ShadowDefinition } from '../src/lib/types.ts'

const toOwnedShadow = (definition: ShadowDefinition, index: number): OwnedShadow => ({
  instanceId: `direct-smoke-shadow-${index}-${definition.id}`,
  definitionId: definition.id,
  name: definition.name,
  obtainedAt: new Date(0).toISOString(),
  sourceType: definition.sourceType,
  sourceGateId: definition.sourceGateId,
  sourceQuestId: definition.sourceQuestId,
  rarity: definition.rarity,
  birthRarity: definition.birthRarity ?? definition.rarity,
  innateGrade: index % 3 === 0 ? 'A' : 'B',
  rank: definition.rank,
  role: definition.role,
  traits: [],
  level: 8 + index,
  xp: 0,
  isNamed: definition.rank === 'named' || definition.isGateNamed || definition.isAchievementNamed,
  isGateNamed: definition.isGateNamed,
  isAchievementNamed: definition.isAchievementNamed,
  enhancementLevel: index,
  absorbedCount: 0,
  evolutionStage: 0,
})

const hunter: HunterState = {
  name: 'Smoke Hunter',
  level: 18,
  xp: 0,
  totalXp: 0,
  rank: 'D',
  job: 'Smoke Job',
  jobId: 'unawakened',
  unlockedJobIds: ['unawakened'],
  stats: { STR: 18, VIT: 17, AGI: 15, INT: 14, PER: 13, SEN: 16 },
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

const visibleGeneralDefinitions = SHADOW_DEFINITIONS
  .filter(definition => !definition.hiddenUntilObtained && !definition.isGateNamed)
  .slice(0, 4)
const shadows = visibleGeneralDefinitions.map(toOwnedShadow)

const results = [
  buildHunterBattleUnit(hunter),
  ...buildShadowBattleUnits(shadows, visibleGeneralDefinitions),
  ...buildMockMonsterParty('boss'),
]

const units = results.map(result => result.unit)
const validationIssues = units.flatMap(unit => validateBattleUnit(unit))
const warningLines = results.flatMap(result => result.warnings)
const hiddenLeaks = units.filter(unit => unit.metadata.hiddenSafe !== true)

console.log(`BattleUnits built: ${units.length}`)
console.log(`Hunter units: ${units.filter(unit => unit.unitType === 'hunter').length}`)
console.log(`Shadow units: ${units.filter(unit => unit.unitType === 'shadow').length}`)
console.log(`Enemy units: ${units.filter(unit => unit.team === 'enemy').length}`)
console.log(`Validation issues: ${validationIssues.length}`)
console.log(`Warnings: ${warningLines.length}`)
console.log(`Hidden-safe metadata issues: ${hiddenLeaks.length}`)
console.log(`Mock monster actions: ${units.filter(unit => unit.team === 'enemy').reduce((sum, unit) => sum + unit.actionList.length, 0)}`)

if (warningLines.length > 0) {
  console.warn('Warnings:')
  for (const warning of warningLines) console.warn(`- ${warning}`)
}

if (validationIssues.length > 0) {
  console.error('Validation issues:')
  for (const issue of validationIssues) console.error(`- ${issue}`)
}

if (hiddenLeaks.length > 0) {
  console.error('Hidden-safe metadata issues:')
  for (const unit of hiddenLeaks) console.error(`- ${unit.unitId}`)
}

if (validationIssues.length > 0 || hiddenLeaks.length > 0) {
  process.exitCode = 1
}
