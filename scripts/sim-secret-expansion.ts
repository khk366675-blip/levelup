/**
 * 12-22 secret expansion smoke simulation.
 * Run with: npx tsx scripts/sim-secret-expansion.ts
 */
import {
  createInitialSecretProgress,
  getSecretVisibleFragments,
  recordSecretEvent,
} from '../src/lib/secrets'
import { SHADOW_DEFINITIONS, createOwnedShadow } from '../src/lib/shadows'
import type { OwnedShadow, RewardBox, ShadowExpedition } from '../src/lib/types'

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message)
}

const sampleDefinition = SHADOW_DEFINITIONS.find(item => item.evolutionTargetDefinitionId)
if (!sampleDefinition) throw new Error('No evolvable shadow definition found')

const evolvedShadow: OwnedShadow = {
  ...createOwnedShadow(sampleDefinition, () => 0.42),
  level: 12,
  evolutionStage: 1,
}

const snapshot = {
  infiniteTower: {
    highestClearedFloor: 12,
    bossRewardsClaimed: { 5: true, 10: true },
  },
  combatLogs: [
    { result: 'victory' as const },
    { result: 'victory' as const },
    { result: 'defeat' as const },
  ],
  shadowExtractHistory: [
    { success: true, shadow: evolvedShadow },
    { success: false },
  ],
  ownedShadows: [evolvedShadow],
  shadowExpeditions: [
    { result: { outcome: 'success' } },
    { result: { outcome: 'great_success' } },
  ] as ShadowExpedition[],
  rewardBoxes: [
    { type: 'boss', status: 'opened' },
  ] as RewardBox[],
  challengeCardHistory: {
    '2026-05-18': { completedIds: ['a', 'b'], completedCount: 2 },
  },
  skillStates: {
    skill: { timesUsed: 3, masteryLevel: 1 },
  },
}

let progress = createInitialSecretProgress(snapshot)
assert((progress.counters?.tower_highest_milestone ?? 0) >= 10, 'existing tower record was not reflected')
assert((progress.counters?.gate_extractions_attempted ?? 0) === 2, 'existing extraction record was not reflected')

const first = recordSecretEvent(progress, { context: 'tower', outcome: 'victory', floor: 15, boss: true, firstClear: true }, snapshot)
progress = first.progress
const fragmentsAfterFirst = progress.unlockedFragments?.length ?? 0

const duplicateProbe = recordSecretEvent(progress, { context: 'tower', outcome: 'victory', floor: 15, boss: true, firstClear: false }, snapshot)
progress = duplicateProbe.progress
assert(new Set(progress.unlockedFragments ?? []).size === (progress.unlockedFragments?.length ?? 0), 'fragments duplicated')
assert((progress.unlockedFragments?.length ?? 0) >= fragmentsAfterFirst, 'fragment state regressed')

const boxResult = recordSecretEvent(progress, { context: 'box', boxType: 'boss', source: 'tower_boss' }, snapshot)
assert(boxResult.shadowEssenceBonus <= 1, 'secret bonus exceeded bounded smoke limit')

const shadowResult = recordSecretEvent(boxResult.progress, { context: 'shadow', action: 'evolve', shadowInstanceId: evolvedShadow.instanceId }, snapshot)
const markedOnce = shadowResult.ownedShadows?.find(shadow => shadow.instanceId === evolvedShadow.instanceId)?.secretTraits?.length ?? 0
const shadowResultAgain = recordSecretEvent(shadowResult.progress, { context: 'shadow', action: 'evolve', shadowInstanceId: evolvedShadow.instanceId }, {
  ...snapshot,
  ownedShadows: shadowResult.ownedShadows ?? snapshot.ownedShadows,
})
const markedTwice = shadowResultAgain.ownedShadows?.find(shadow => shadow.instanceId === evolvedShadow.instanceId)?.secretTraits?.length ?? markedOnce
assert(markedTwice === markedOnce, 'secret trait was granted more than once')

console.log('Secret expansion smoke simulation')
console.log(`counters=${Object.keys(progress.counters ?? {}).length}`)
console.log(`visibleFragments=${getSecretVisibleFragments(progress).length}`)
console.log('status=ok')
