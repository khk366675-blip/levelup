import type { HunterState, PlayerCombatStats, SkillDefinition, OwnedShadow, Item, EquipmentSlot } from '../src/lib/types'
import type { JobId } from '../src/lib/types'
import { calculatePlayerCombatStats, getPlayerCombatSkills, simulateGateWaveBattle } from '../src/lib/game'
import { getTowerMonstersForFloor, getTowerRecommendedPower, calculateTowerReward } from '../src/lib/infiniteTower'
import { SKILL_DEFINITIONS, ITEM_POOL } from '../src/lib/seed'
import { JOB_DEFINITIONS } from '../src/lib/types'
import { getEquippedShadows } from '../src/lib/shadows'

// ── Inline helper (store.ts exports stripped in sim) ─────────────────
function simGetEquippedItems(items: Item[], equipment: Partial<Record<EquipmentSlot, string>>): Item[] {
  return Object.values(equipment)
    .map(id => items.find(item => item.id === id))
    .filter((item): item is Item => Boolean(item))
}

// ── Build definitions ────────────────────────────────────────────────

interface BuildConfig {
  name: string
  level: number
  stats: PlayerCombatStats
  jobId: JobId
  equipment: Partial<Record<EquipmentSlot, string>>
  shadowCondition: 'no_shadow' | 'common_shadow' | 'trained_shadow' | 'mixed_trained'
}

function createBuilds(): BuildConfig[] {
  return [
    { name: 'A', level: 5,  stats: { maxHp: 380,  atk: 55,  def: 22, speed: 14, critRate: 0.06, accuracy: 0.92, evasionRate: 0.04, skillTotalPower: 1.0 }, jobId: 'unawakened', equipment: {}, shadowCondition: 'no_shadow' },
    { name: 'B', level: 10, stats: { maxHp: 640,  atk: 88,  def: 34, speed: 18, critRate: 0.08, accuracy: 0.93, evasionRate: 0.05, skillTotalPower: 1.0 }, jobId: 'unawakened', equipment: {}, shadowCondition: 'common_shadow' },
    { name: 'C', level: 20, stats: { maxHp: 1120, atk: 155, def: 55, speed: 24, critRate: 0.10, accuracy: 0.94, evasionRate: 0.07, skillTotalPower: 1.0 }, jobId: 'grimoire-decoder', equipment: { weapon: 'item-weapon-common-1' }, shadowCondition: 'trained_shadow' },
    { name: 'D', level: 30, stats: { maxHp: 1680, atk: 235, def: 80, speed: 30, critRate: 0.12, accuracy: 0.95, evasionRate: 0.09, skillTotalPower: 1.0 }, jobId: 'grimoire-decoder', equipment: { weapon: 'item-weapon-common-1', armor: 'item-armor-common-1' }, shadowCondition: 'mixed_trained' },
    { name: 'E', level: 45, stats: { maxHp: 2420, atk: 345, def: 118, speed: 36, critRate: 0.14, accuracy: 0.96, evasionRate: 0.11, skillTotalPower: 1.0 }, jobId: 'golden-eye-diviner', equipment: { weapon: 'item-weapon-rare-1', armor: 'item-armor-rare-1', accessory: 'item-accessory-rare-1' }, shadowCondition: 'mixed_trained' },
    { name: 'F', level: 60, stats: { maxHp: 3030, atk: 420, def: 145, speed: 40, critRate: 0.16, accuracy: 0.96, evasionRate: 0.12, skillTotalPower: 1.0 }, jobId: 'fate-harmonizer', equipment: { weapon: 'item-weapon-epic-1', armor: 'item-armor-epic-1', accessory: 'item-accessory-epic-1', artifact: 'item-artifact-epic-1' }, shadowCondition: 'mixed_trained' },
  ]
}

const SIM_DATE = new Date().toISOString()

function createShadows(condition: BuildConfig['shadowCondition']): OwnedShadow[] {
  if (condition === 'no_shadow') return []
  const base: OwnedShadow = {
    instanceId: 'shadow-1', definitionId: 'scout-soldier', name: '정찰병',
    role: 'scout', rarity: 'common', rank: 'soldier',
    level: 1, xp: 0, sourceType: 'gate_extract',
    obtainedAt: SIM_DATE, traits: [],
  }
  if (condition === 'common_shadow') {
    return [
      { ...base, instanceId: 's1' },
      { ...base, instanceId: 's2', role: 'assault', definitionId: 'assault-soldier', name: '돌격병' },
    ]
  }
  if (condition === 'trained_shadow') {
    return [
      { ...base, instanceId: 's1', level: 5, xp: 100 },
      { ...base, instanceId: 's2', role: 'assault', definitionId: 'assault-soldier', name: '돌격병', level: 5, xp: 100 },
      { ...base, instanceId: 's3', role: 'guard', definitionId: 'guard-soldier', name: '수호병', level: 4, xp: 80 },
    ]
  }
  // mixed_trained
  return [
    { ...base, instanceId: 's1', level: 10, xp: 300, rarity: 'uncommon', rank: 'elite' },
    { ...base, instanceId: 's2', role: 'assault', definitionId: 'assault-soldier', name: '돌격병', level: 10, xp: 300, rarity: 'uncommon', rank: 'elite' },
    { ...base, instanceId: 's3', role: 'guard', definitionId: 'guard-soldier', name: '수호병', level: 8, xp: 200, rarity: 'common', rank: 'soldier' },
    { ...base, instanceId: 's4', role: 'analyst', definitionId: 'analyst-soldier', name: '분석관', level: 8, xp: 200, rarity: 'common', rank: 'soldier' },
  ]
}

function simulateTowerFloor(build: BuildConfig, floor: number, iterations = 100): { winRate: number; avgTurns: number } {
  const equippedItems = simGetEquippedItems(ITEM_POOL as unknown as Item[], build.equipment)
  const shadows = createShadows(build.shadowCondition)
  const equippedShadowIds = shadows.map(s => s.instanceId)
  const hunter: HunterState = {
    name: `Build ${build.name}`,
    level: build.level,
    stats: { STR: 10, VIT: 10, AGI: 10, INT: 10, PER: 10, SEN: 10 },
    jobId: build.jobId,
    job: '미각성자',
    unlockedJobIds: [build.jobId],
    freeStatPoints: 0,
    xp: 0,
    totalXp: 0,
    rank: 'E',
    streak: 0,
    categoryProgress: { workout: 0, study: 0, career: 0, finance: 0, health: 0, mind: 0, social: 0, habit: 0, challenge: 0 },
    ownedTitleIds: [],
  }
  const equippedShadows = getEquippedShadows(shadows, equippedShadowIds, hunter)
  const playerSkills = getPlayerCombatSkills({ jobId: build.jobId, equippedItems, allSkills: SKILL_DEFINITIONS })
  // Use build.stats as the intended combat stats (bypassing calculatePlayerCombatStats recalculation)
  const playerStats = build.stats

  const monsters = getTowerMonstersForFloor(floor)
  if (monsters.length === 0) return { winRate: 0, avgTurns: 0 }

  const monsterSkillIds = new Set(monsters.flatMap(m => m.skillIds))
  const monsterSkills = SKILL_DEFINITIONS.filter(s => s.ownerType === 'monster' && monsterSkillIds.has(s.id))
  const skills = [...playerSkills, ...monsterSkills]

  let wins = 0
  let totalTurns = 0

  for (let i = 0; i < iterations; i++) {
    const result = simulateGateWaveBattle({
      playerName: build.name,
      playerStats,
      monsters,
      skills,
      equippedShadows,
      seed: i + floor * 1000 + build.level * 100000,
    })
    if (result.result === 'victory') wins++
    totalTurns += result.totalTurns
  }

  return { winRate: wins / iterations, avgTurns: totalTurns / iterations }
}

// ── Main simulation ──────────────────────────────────────────────────

const builds = createBuilds()
const testFloors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 17, 20, 22, 25, 28, 30]
const bossFloors = [5, 10, 15, 20, 25, 30]

console.log('=== 무한의 탑 시뮬레이션 ===\n')

for (const build of builds) {
  console.log(`--- Build ${build.name} (Lv.${build.level}, ${build.shadowCondition}) ---`)
  let stableMaxFloor = 0
  for (const floor of testFloors) {
    const { winRate, avgTurns } = simulateTowerFloor(build, floor, 100)
    const isBoss = floor % 5 === 0
    const recPower = getTowerRecommendedPower(floor)
    const stars = winRate >= 0.9 ? '★★★' : winRate >= 0.6 ? '★★☆' : winRate >= 0.3 ? '★☆☆' : '☆☆☆'
    const status = winRate >= 0.5 ? '가능' : '어려움'
    if (winRate >= 0.5) stableMaxFloor = floor
    console.log(`  ${isBoss ? '👑' : '  '} ${floor.toString().padStart(2)}층 | 승률 ${(winRate * 100).toFixed(0).padStart(3)}% | 평균 ${avgTurns.toFixed(1).padStart(4)}턴 | 추천 ${recPower} | ${stars} ${status}`)
  }
  console.log(`  → 안정 클리어 예상: ${stableMaxFloor}층\n`)
}

console.log('--- 보스층 상세 ---')
for (const build of builds) {
  for (const floor of bossFloors) {
    const { winRate, avgTurns } = simulateTowerFloor(build, floor, 200)
    const recPower = getTowerRecommendedPower(floor)
    console.log(`  Build ${build.name} | ${floor}층 보스 | 승률 ${(winRate * 100).toFixed(1)}% | 평균 ${avgTurns.toFixed(1)}턴 | 추천 ${recPower}`)
  }
  console.log('')
}

console.log('--- 보상 샘플 (첫 클리어) ---')
for (const floor of [1, 5, 10, 15, 20, 25, 30]) {
  const reward = calculateTowerReward(floor, 'victory', true)
  console.log(`  ${floor}층 | XP ${reward.hunterXp ?? 0} | 정수 ${reward.shadowEssence ?? 0} | 박스 ${reward.boxType ?? '-'} | 아이템 확률 ${((reward.itemDropChance ?? 0) * 100).toFixed(0)}%`)
}

console.log('\n=== 시뮬레이션 완료 ===')
