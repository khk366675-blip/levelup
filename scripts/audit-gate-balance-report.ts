import { GATE_DEFINITIONS, MONSTER_DEFINITIONS } from '../src/lib/seed'
import { initLivingWorld } from '../src/lib/livingWorld'
import {
  DIRECT_BATTLE_GATE_ENCOUNTER_POOLS,
  buildDirectBattleEncounterParty,
  getDirectBattleMockEncounter,
} from '../src/lib/directBattleEncounters'
import { calculateCombatPower, calculatePlayerCombatStats, getPlayerCombatSkills } from '../src/lib/game'
import { buildHunterBattleUnit } from '../src/lib/battleUnits'
import { ITEM_POOL, SKILL_DEFINITIONS } from '../src/lib/seed'
import type { EquipmentState, HunterState, Item, JobId, StatKey } from '../src/lib/types'

const ranks = ['E', 'D', 'C', 'B', 'A', 'S'] as const

const avg = (values: number[]) =>
  values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0

const minmaxText = (values: number[]) => {
  if (!values.length) return '0'
  const min = Math.min(...values)
  const max = Math.max(...values)
  return min === max ? String(min) : `${min}-${max}`
}

console.log('GENERAL_GATES')
for (const rank of ranks) {
  const gates = GATE_DEFINITIONS.filter(gate => gate.rank === rank)
  if (!gates.length) continue
  const monsterIds = Array.from(new Set(gates.flatMap(gate => gate.monsterIds)))
  const monsters = monsterIds
    .map(id => MONSTER_DEFINITIONS.find(monster => monster.id === id))
    .filter((monster): monster is NonNullable<typeof monster> => Boolean(monster))

  console.log(JSON.stringify({
    rank,
    gateCount: gates.length,
    recommendedLevel: minmaxText(gates.map(gate => gate.recommendedLevel)),
    recommendedPower: minmaxText(gates.map(gate => gate.recommendedPower)),
    avgRecommendedPower: avg(gates.map(gate => gate.recommendedPower)),
    waves: minmaxText(gates.map(gate => gate.monsterIds.length)),
    avgMonster: {
      hp: avg(monsters.map(monster => monster.stats.maxHp)),
      atk: avg(monsters.map(monster => monster.stats.atk)),
      def: avg(monsters.map(monster => monster.stats.def)),
      speed: avg(monsters.map(monster => monster.stats.speed)),
    },
    monsters: monsters.map(monster => ({
      id: monster.id,
      name: monster.name,
      rank: monster.rank,
      maxHp: monster.stats.maxHp,
      atk: monster.stats.atk,
      def: monster.stats.def,
      speed: monster.stats.speed,
      crit: monster.stats.critRate,
      accuracy: monster.stats.accuracy,
      evasion: monster.stats.evasionRate,
      skillIds: monster.skillIds,
    })),
  }))
}

console.log('PLAYER_TIER_ASSUMPTIONS')
const categoryProgress = {
  workout: 0,
  study: 0,
  career: 0,
  health: 0,
  mind: 0,
  finance: 0,
  social: 0,
  challenge: 0,
  habit: 0,
}

const itemBy = (slot: string, rarity: string, index = 0) =>
  ITEM_POOL.filter(item => item.slot === slot && item.rarity === rarity)[index]
  ?? ITEM_POOL.find(item => item.slot === slot)

const makeItem = (
  slot: string,
  rarity: string,
  enhancementLevel = 0,
  equipmentStars: Item['equipmentStars'] = 3,
  index = 0,
): Item => {
  const base = itemBy(slot, rarity, index)
  if (!base) throw new Error(`Missing item for ${slot}/${rarity}`)
  return {
    ...base,
    id: `audit-${slot}-${rarity}-${index}`,
    acquiredAt: '2026-06-02T00:00:00.000Z',
    enhancementLevel,
    equipmentStars,
  }
}

const playerBuilds: Array<{
  rank: (typeof ranks)[number]
  level: number
  jobId: JobId
  stats: Record<StatKey, number>
  items: Item[]
  shadowPlan: string
}> = [
  {
    rank: 'E',
    level: 5,
    jobId: 'unawakened',
    stats: { STR: 12, VIT: 12, AGI: 11, INT: 11, PER: 11, SEN: 11 },
    items: [],
    shadowPlan: '없음',
  },
  {
    rank: 'D',
    level: 12,
    jobId: 'unawakened',
    stats: { STR: 22, VIT: 22, AGI: 17, INT: 22, PER: 19, SEN: 18 },
    items: [makeItem('accessory', 'uncommon', 0, 2)],
    shadowPlan: 'E급 common/uncommon 0-1기',
  },
  {
    rank: 'C',
    level: 22,
    jobId: 'grimoire-decoder',
    stats: { STR: 28, VIT: 30, AGI: 22, INT: 42, PER: 32, SEN: 26 },
    items: [makeItem('armor', 'rare', 1, 3), makeItem('accessory', 'rare', 0, 3)],
    shadowPlan: 'E/D급 1-2기, rare 1기 기대',
  },
  {
    rank: 'B',
    level: 45,
    jobId: 'fate-harmonizer',
    stats: { STR: 92, VIT: 98, AGI: 70, INT: 126, PER: 96, SEN: 82 },
    items: [
      makeItem('weapon', 'epic', 2, 4),
      makeItem('armor', 'epic', 2, 4),
      makeItem('accessory', 'legendary', 2, 4),
      makeItem('artifact', 'legendary', 2, 4),
    ],
    shadowPlan: 'rare/epic 2-3기, 역할 분산 시작',
  },
  {
    rank: 'A',
    level: 60,
    jobId: 'fate-harmonizer',
    stats: { STR: 140, VIT: 150, AGI: 105, INT: 185, PER: 142, SEN: 122 },
    items: [
      makeItem('weapon', 'legendary', 4, 5),
      makeItem('armor', 'legendary', 3, 5),
      makeItem('accessory', 'legendary', 4, 5),
      makeItem('artifact', 'legendary', 4, 5),
    ],
    shadowPlan: 'epic/legendary 3-4기, 보스 대응 1기 필요',
  },
  {
    rank: 'S',
    level: 80,
    jobId: 'fate-harmonizer',
    stats: { STR: 220, VIT: 230, AGI: 170, INT: 270, PER: 210, SEN: 190 },
    items: [
      makeItem('weapon', 'legendary', 5, 5),
      makeItem('armor', 'legendary', 5, 5),
      makeItem('accessory', 'legendary', 5, 5),
      makeItem('artifact', 'legendary', 5, 5),
    ],
    shadowPlan: 'legendary/named 4-5기, 보스/제어/수비 역할 완성',
  },
]

for (const build of playerBuilds) {
  const hunter: HunterState = {
    name: `${build.rank} Hunter`,
    level: build.level,
    xp: 0,
    totalXp: 0,
    renown: 0,
    rank: build.rank,
    job: '',
    jobId: build.jobId,
    activeJobId: build.jobId,
    unlockedJobIds: [build.jobId],
    stats: build.stats,
    freeStatPoints: 0,
    streak: 0,
    categoryProgress,
    ownedTitleIds: [],
    jobs: {
      [build.jobId]: {
        jobId: build.jobId,
        level: 10,
        xp: 0,
      },
    },
  }
  const equipment: EquipmentState = {}
  for (const item of build.items) {
    if (item.slot) equipment[item.slot] = item.id
  }
  const skills = getPlayerCombatSkills({
    jobId: build.jobId,
    jobLevel: 10,
    equippedItems: build.items,
    allSkills: SKILL_DEFINITIONS,
  })
  const combatStats = calculatePlayerCombatStats({
    level: build.level,
    stats: build.stats,
    equippedItems: build.items,
    jobId: build.jobId,
    skills,
  })
  const unit = buildHunterBattleUnit(hunter, { items: build.items, equipment }).unit
  console.log(JSON.stringify({
    rank: build.rank,
    level: build.level,
    jobId: build.jobId,
    combatPower: calculateCombatPower(combatStats),
    equipment: build.items.map(item => ({
      slot: item.slot,
      rarity: item.rarity,
      enhancementLevel: item.enhancementLevel ?? 0,
      equipmentStars: item.equipmentStars ?? 2,
      name: item.name,
    })),
    shadowPlan: build.shadowPlan,
    battleUnit: {
      hp: unit.stats.maxHp,
      atk: unit.stats.atk,
      def: unit.stats.def,
      spd: unit.stats.spd,
      skill: unit.stats.skillPower,
      crit: unit.stats.crit,
      control: unit.stats.controlPower,
      support: unit.stats.supportPower,
      survival: unit.stats.survivalPower,
      boss: unit.stats.bossPower,
      synergy: unit.stats.synergyPower,
    },
  }))
}

console.log('WORLD_NODES_SEED_888')
const world = initLivingWorld(888)
const nodes = Object.values(world.riftNodes)
for (const rank of ranks) {
  const rankNodes = nodes.filter(node => node.difficultyRank === rank)
  if (!rankNodes.length) continue

  console.log(JSON.stringify({
    rank,
    nodeCount: rankNodes.length,
    difficulty: minmaxText(rankNodes.map(node => node.difficulty)),
    avgDifficulty: avg(rankNodes.map(node => node.difficulty)),
    daysRemaining: minmaxText(rankNodes.map(node => node.daysRemaining)),
  }))
}

console.log('WORLD_LEGACY_MONSTER_MAP')
const worldMonsterMap: Record<(typeof ranks)[number], string[]> = {
  E: ['rift-rat', 'rift-stray'],
  D: ['lazy-goblin', 'sloth-brute'],
  C: ['forgetting-warden', 'fatigue-warden'],
  B: ['memory-tracker', 'memory-scout'],
  A: ['greed-warden', 'memory-scout'],
  S: ['forgetting-warden', 'greed-warden'],
}
for (const rank of ranks) {
  const monsters = worldMonsterMap[rank]
    .map(id => MONSTER_DEFINITIONS.find(monster => monster.id === id))
    .filter((monster): monster is NonNullable<typeof monster> => Boolean(monster))

  console.log(JSON.stringify({
    rank,
    monsterIds: monsters.map(monster => monster.id),
    avgMonster: {
      hp: avg(monsters.map(monster => monster.stats.maxHp)),
      atk: avg(monsters.map(monster => monster.stats.atk)),
      def: avg(monsters.map(monster => monster.stats.def)),
      speed: avg(monsters.map(monster => monster.stats.speed)),
    },
    monsters: monsters.map(monster => ({
      id: monster.id,
      name: monster.name,
      baseRank: monster.rank,
      maxHp: monster.stats.maxHp,
      atk: monster.stats.atk,
      def: monster.stats.def,
      speed: monster.stats.speed,
      crit: monster.stats.critRate,
      accuracy: monster.stats.accuracy,
      evasion: monster.stats.evasionRate,
      skillIds: monster.skillIds,
    })),
  }))
}

console.log('DIRECT_POOLS_SUMMARY')
const targetBaseLevel: Record<(typeof ranks)[number], number> = {
  E: 6,
  D: 17,
  C: 33,
  B: 50,
  A: 67,
  S: 89,
}
for (const rank of ranks) {
  const pool = DIRECT_BATTLE_GATE_ENCOUNTER_POOLS[rank] ?? []
  const encounterRows = pool.map(key => {
    const encounter = getDirectBattleMockEncounter(key)
    const built = buildDirectBattleEncounterParty(key, targetBaseLevel[rank])
    return {
      key,
      tier: encounter?.tier,
      difficultyTag: encounter?.difficultyTag,
      recommendedPartySize: encounter?.recommendedPartySize,
      slots: built.units.map(unit => ({
        id: unit.sourceId,
        role: unit.role,
        unitType: unit.unitType,
        level: unit.level,
        hp: unit.stats.maxHp,
        atk: unit.stats.atk,
        def: unit.stats.def,
        spd: unit.stats.spd,
        skill: unit.stats.skillPower,
      })),
    }
  })
  const units = encounterRows.flatMap(row => row.slots)
  const roleCounts = units.reduce<Record<string, number>>((acc, unit) => {
    acc[unit.role] = (acc[unit.role] ?? 0) + 1
    return acc
  }, {})

  console.log(JSON.stringify({
    rank,
    baseLevel: targetBaseLevel[rank],
    encounterCount: pool.length,
    encounters: pool,
    roleCounts,
    avgUnit: {
      hp: avg(units.map(unit => unit.hp)),
      atk: avg(units.map(unit => unit.atk)),
      def: avg(units.map(unit => unit.def)),
      spd: avg(units.map(unit => unit.spd)),
      skill: avg(units.map(unit => unit.skill)),
    },
    bossUnits: units.filter(unit => unit.unitType === 'boss').map(unit => unit.id),
    samples: encounterRows.slice(0, 3),
  }))
}
