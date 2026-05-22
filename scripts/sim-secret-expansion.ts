/**
 * 12-22 secret expansion smoke simulation.
 * Run with: npx tsx scripts/sim-secret-expansion.ts
 */
import {
  applySecretModifiers,
  createInitialSecretProgress,
  ensureSecretProgress,
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
assert((progress.signals?.tower_highest_milestone ?? 0) >= 10, 'compressed signal record was not initialized')

const mergedProgress = ensureSecretProgress({
  counters: { gate_clears: 1 },
}, snapshot)
assert((mergedProgress.counters?.tower_highest_milestone ?? 0) >= 10, 'fallback merge missed existing tower record')
assert((mergedProgress.counters?.gate_clears ?? 0) >= 2, 'fallback merge regressed existing gate record')
assert((mergedProgress.signals?.gate_clears ?? 0) >= 2, 'fallback merge missed compressed gate signal')

let newUserProgress = createInitialSecretProgress()
for (let index = 0; index < 3; index += 1) {
  const result = recordSecretEvent(newUserProgress, { context: 'gate', outcome: 'victory' }, {})
  newUserProgress = result.progress
}
assert((newUserProgress.unlockedFragments?.length ?? 0) >= 1, 'first discovery was too delayed for a new user smoke path')

const retrospectiveFirst = recordSecretEvent(createInitialSecretProgress(snapshot), { context: 'tower', outcome: 'victory', floor: 13 }, snapshot)
const retrospectiveAgain = recordSecretEvent(retrospectiveFirst.progress, { context: 'gate', outcome: 'victory' }, snapshot)
assert(retrospectiveFirst.progress.seen?.includes('retrospective.first'), 'retrospective marker was not recorded')
assert((retrospectiveAgain.messages.filter(message => message.kind === 'story').length) === 0, 'retrospective message repeated')

const first = recordSecretEvent(progress, { context: 'tower', outcome: 'victory', floor: 15, boss: true, firstClear: true }, snapshot)
progress = first.progress
const fragmentsAfterFirst = progress.unlockedFragments?.length ?? 0

const duplicateProbe = recordSecretEvent(progress, { context: 'tower', outcome: 'victory', floor: 15, boss: true, firstClear: false }, snapshot)
progress = duplicateProbe.progress
assert(new Set(progress.unlockedFragments ?? []).size === (progress.unlockedFragments?.length ?? 0), 'fragments duplicated')
assert((progress.unlockedFragments?.length ?? 0) >= fragmentsAfterFirst, 'fragment state regressed')

const boxResult = recordSecretEvent(progress, { context: 'box', boxType: 'boss', source: 'tower_boss' }, snapshot)
assert(boxResult.shadowEssenceBonus <= 1, 'secret bonus exceeded bounded smoke limit')

let cappedProgress = {
  ...progress,
  counters: {
    ...(progress.counters ?? {}),
    boss_boxes_opened: 0,
    gate_extractions_attempted: 2,
    tower_highest_milestone: 10,
  },
  sealedRewards: {},
  sealed: {},
}
let cappedBonus = 0
for (let index = 0; index < 8; index += 1) {
  const result = recordSecretEvent(cappedProgress, { context: 'box', boxType: 'boss', source: 'tower_boss' }, snapshot)
  cappedProgress = result.progress
  cappedBonus += result.shadowEssenceBonus
}
assert(cappedBonus <= 3, 'secret bonus cap was exceeded')

let hintProgress = createInitialSecretProgress()
for (let index = 0; index < 3; index += 1) {
  const result = recordSecretEvent(hintProgress, { context: 'gate', outcome: 'victory' }, {})
  hintProgress = result.progress
}
const hintCount = hintProgress.discoveredHints?.length ?? 0
const cooldownProbe = recordSecretEvent(hintProgress, { context: 'gate', outcome: 'victory' }, {})
assert(hintCount === 1, 'hint did not trigger once at the expected smoke threshold')
assert((cooldownProbe.progress.discoveredHints?.length ?? 0) === hintCount, 'hint cooldown did not prevent immediate repetition')

let farmProgress = createInitialSecretProgress()
for (let index = 0; index < 12; index += 1) {
  const result = recordSecretEvent(farmProgress, { context: 'gate', outcome: 'victory' }, {})
  farmProgress = result.progress
}
assert((farmProgress.signals?.resonance_triad ?? 0) === 0, 'single-context farming advanced triad signal')

let triadProgress = createInitialSecretProgress()
triadProgress = recordSecretEvent(triadProgress, { context: 'tower', outcome: 'victory', floor: 1 }, {}).progress
triadProgress = recordSecretEvent(triadProgress, { context: 'gate', outcome: 'victory' }, {}).progress
triadProgress = recordSecretEvent(triadProgress, { context: 'expedition', outcome: 'success' }, {}).progress
assert((triadProgress.signals?.resonance_triad ?? 0) >= 1, 'triad signal did not advance after diversified smoke path')
assert(applySecretModifiers(100, [20]) <= 115, 'secret modifier cap failed')

const shadowResult = recordSecretEvent(boxResult.progress, { context: 'shadow', action: 'evolve', shadowInstanceId: evolvedShadow.instanceId }, snapshot)
const markedOnce = shadowResult.ownedShadows?.find(shadow => shadow.instanceId === evolvedShadow.instanceId)?.secretTraits?.length ?? 0
const shadowResultAgain = recordSecretEvent(shadowResult.progress, { context: 'shadow', action: 'evolve', shadowInstanceId: evolvedShadow.instanceId }, {
  ...snapshot,
  ownedShadows: shadowResult.ownedShadows ?? snapshot.ownedShadows,
})
const markedTwice = shadowResultAgain.ownedShadows?.find(shadow => shadow.instanceId === evolvedShadow.instanceId)?.secretTraits?.length ?? markedOnce
assert(markedTwice === markedOnce, 'secret trait was granted more than once')

let extractionFailProgress = createInitialSecretProgress()
const extractionFailFirst = recordSecretEvent(extractionFailProgress, { context: 'shadow', action: 'extract', success: false }, {})
extractionFailProgress = extractionFailFirst.progress
const extractionFailSecond = recordSecretEvent(extractionFailProgress, { context: 'shadow', action: 'extract', success: false }, {})
extractionFailProgress = extractionFailSecond.progress
const extractionFailThird = recordSecretEvent(extractionFailProgress, { context: 'shadow', action: 'extract', success: false }, {})
assert((extractionFailProgress.counters?.gate_extractions_failed ?? 0) === 2, 'extraction failure signal was not counted')
assert((extractionFailThird.progress.counters?.gate_extractions_failed ?? 0) === 3, 'extraction failure signal stopped counting')
assert(extractionFailProgress.seen?.includes('shadow.extract.failed.echo'), 'extraction failure marker was not recorded')
assert((extractionFailThird.progress.seen?.filter(id => id === 'shadow.extract.failed.echo').length ?? 0) === 1, 'extraction failure marker repeated')

console.log('Secret expansion smoke simulation')
console.log(`counters=${Object.keys(progress.counters ?? {}).length}`)
console.log(`visibleFragments=${getSecretVisibleFragments(progress).length}`)
console.log('status=ok')
