import { SHADOW_DEFINITIONS } from '../src/lib/shadows.ts'
import {
  SHADOW_PASSIVE_DEFINITION_IDS,
  SHADOW_SKILL_DEFINITION_IDS,
  getShadowAbilitySourceLabel,
  getShadowCombatUnitProfile,
} from '../src/lib/shadowSkills.ts'
import type { OwnedShadow, ShadowDefinition } from '../src/lib/types.ts'

const toOwnedShadow = (definition: ShadowDefinition): OwnedShadow => ({
  instanceId: `smoke-${definition.id}`,
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
  level: 1,
  xp: 0,
  isNamed: definition.rank === 'named',
  isGateNamed: definition.isGateNamed,
  isAchievementNamed: definition.isAchievementNamed,
  enhancementLevel: 0,
  absorbedCount: 0,
  evolutionStage: 0,
})

const duplicateDefinitionIds = SHADOW_DEFINITIONS
  .map(definition => definition.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index)

const missingRefs = SHADOW_DEFINITIONS.flatMap(definition => [
  ...(definition.shadowSkillIds ?? []).map(id => ({ definitionId: definition.id, kind: 'skill', id, unique: false })),
  ...(definition.shadowUniqueSkillIds ?? []).map(id => ({ definitionId: definition.id, kind: 'skill', id, unique: true })),
  ...(definition.shadowPassiveIds ?? []).map(id => ({ definitionId: definition.id, kind: 'passive', id, unique: false })),
  ...(definition.shadowUniquePassiveIds ?? []).map(id => ({ definitionId: definition.id, kind: 'passive', id, unique: true })),
]).filter(ref => ref.kind === 'skill'
  ? !SHADOW_SKILL_DEFINITION_IDS.has(ref.id)
  : !SHADOW_PASSIVE_DEFINITION_IDS.has(ref.id))

const profileIssues = SHADOW_DEFINITIONS.flatMap(definition => {
  try {
    const profile = getShadowCombatUnitProfile(toOwnedShadow(definition), definition)
    const issues: string[] = []
    if (profile.definitionId !== definition.id) issues.push('definition mismatch')
    if (profile.displayState !== 'revealed') issues.push('owned profile not revealed')
    if (profile.activeSkills.length === 0) issues.push('no active skill candidate')
    if (profile.passives.length === 0 && definition.rarity !== 'common') issues.push('no passive candidate')
    if (!profile.actionProfile.actionCue) issues.push('missing actionCue')
    if (!profile.actionProfile.effectColor) issues.push('missing effectColor')
    if (!profile.actionProfile.boardLane) issues.push('missing boardLane')
    for (const ability of [...profile.activeSkills, ...profile.passives]) {
      const label = getShadowAbilitySourceLabel(ability)
      if (!['GENERIC', 'TEMPLATE', 'PROTOTYPE', 'UNIQUE'].includes(label)) {
        issues.push(`bad source label ${ability.id}:${label}`)
      }
      if (!ability.actionCue) issues.push(`missing ability actionCue ${ability.id}`)
    }
    return issues.map(issue => ({ definitionId: definition.id, issue }))
  } catch (error) {
    return [{ definitionId: definition.id, issue: error instanceof Error ? error.message : String(error) }]
  }
})

const hiddenDefinitions = SHADOW_DEFINITIONS.filter(definition => definition.hiddenUntilObtained)
const gateNamedDefinitions = SHADOW_DEFINITIONS.filter(definition => definition.isGateNamed)
const achievementNamedDefinitions = SHADOW_DEFINITIONS.filter(definition => definition.isAchievementNamed)
const uniqueAssignedDefinitions = SHADOW_DEFINITIONS.filter(definition =>
  (definition.shadowUniqueSkillIds?.length ?? 0) > 0 || (definition.shadowUniquePassiveIds?.length ?? 0) > 0)

console.log(`Shadow definitions: ${SHADOW_DEFINITIONS.length}`)
console.log(`Skill ids registered: ${SHADOW_SKILL_DEFINITION_IDS.size}`)
console.log(`Passive ids registered: ${SHADOW_PASSIVE_DEFINITION_IDS.size}`)
console.log(`Missing refs: ${missingRefs.length}`)
console.log(`Profile issues: ${profileIssues.length}`)
console.log(`Duplicate definition ids: ${duplicateDefinitionIds.length}`)
console.log(`Hidden definitions: ${hiddenDefinitions.length}`)
console.log(`Gate named definitions: ${gateNamedDefinitions.length}`)
console.log(`Achievement named definitions: ${achievementNamedDefinitions.length}`)
console.log(`Unique-assigned definitions: ${uniqueAssignedDefinitions.length}`)

if (missingRefs.length > 0) {
  console.error('Missing refs:')
  for (const ref of missingRefs) console.error(`- ${ref.definitionId}: ${ref.kind} ${ref.id}`)
}

if (profileIssues.length > 0) {
  console.error('Profile issues:')
  for (const issue of profileIssues) console.error(`- ${issue.definitionId}: ${issue.issue}`)
}

if (duplicateDefinitionIds.length > 0) {
  console.error(`Duplicate definition ids: ${duplicateDefinitionIds.join(', ')}`)
}

if (missingRefs.length || profileIssues.length || duplicateDefinitionIds.length) {
  process.exitCode = 1
}
