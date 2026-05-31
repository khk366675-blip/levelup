/** @deprecated Kept for typescript and store hydration compliance. */
import type { MonsterDefinition, MonsterCombatStats, TowerFloorType, TowerReward, InfiniteTowerState, TowerBattleResult } from './types'
import { MONSTER_DEFINITIONS } from './seed'

export const TOWER_FLOOR_MONSTER_POOL: Record<string, string[]> = {
  early: ['rift-rat', 'rift-stray'],
  mid: ['lazy-goblin', 'sloth-brute'],
  late: ['forgetting-warden', 'fatigue-warden', 'memory-tracker', 'memory-scout', 'greed-warden'],
}

export const TOWER_BOSS_IDS = [
  'tower-guardian-5',
  'tower-knight-10',
  'tower-warden-15',
  'tower-judge-20',
  'tower-monarch-25',
  'tower-abyss-30',
]

export function getTowerFloorType(floor: number): TowerFloorType {
  if (floor % 5 === 0) return 'boss'
  return 'normal'
}

export function getTowerRecommendedPower(floor: number): number {
  const base = 200 + floor * 80
  const isBoss = floor % 5 === 0
  return Math.round(base * (isBoss ? 1.42 : 1.0))
}

export function getTowerMonsterIds(floor: number): string[] {
  const isBoss = floor % 5 === 0
  if (isBoss) {
    const bossIndex = Math.min(Math.floor(floor / 5) - 1, TOWER_BOSS_IDS.length - 1)
    return [TOWER_BOSS_IDS[bossIndex]]
  }

  if (floor <= 5) return [pickRandom(TOWER_FLOOR_MONSTER_POOL.early)]
  if (floor <= 10) return [pickRandom(TOWER_FLOOR_MONSTER_POOL.mid)]
  if (floor <= 15) {
    return [...TOWER_FLOOR_MONSTER_POOL.mid]
  }
  if (floor <= 25) {
    return pickUniqueRandom(TOWER_FLOOR_MONSTER_POOL.late, 2)
  }
  return pickUniqueRandom(TOWER_FLOOR_MONSTER_POOL.late, 3)
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickUniqueRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function getBaseMonsterForTower(monsterId: string): MonsterDefinition | undefined {
  if (monsterId.startsWith('tower-')) {
    return createTowerBossDefinition(monsterId)
  }
  return MONSTER_DEFINITIONS.find(m => m.id === monsterId)
}

export function scaleMonsterForFloor(base: MonsterDefinition, floor: number): MonsterDefinition {
  const isBoss = floor % 5 === 0
  const baseMultiplier = 1 + (floor - 1) * 0.045
  
  let countMitigation = 1.0
  if (!isBoss) {
    if (floor <= 10) countMitigation = 1.0
    else if (floor <= 15) countMitigation = 0.76
    else if (floor <= 25) countMitigation = 0.58
    else countMitigation = 0.46
  }

  const bossMultiplier = isBoss ? 1.11 : 1.0
  const finalMult = baseMultiplier * bossMultiplier * countMitigation

  const scale = (v: number) => Math.max(1, Math.round(v * finalMult))

  return {
    ...base,
    id: `tower-${floor}-${base.id}`,
    name: `${base.name} (탑 ${floor}층)`,
    stats: {
      maxHp: scale(base.stats.maxHp),
      atk: scale(base.stats.atk),
      def: scale(base.stats.def),
      speed: scale(base.stats.speed),
      critRate: Math.min(0.25, base.stats.critRate + floor * 0.002),
      accuracy: Math.min(0.98, base.stats.accuracy + floor * 0.0015),
      evasionRate: Math.min(0.25, base.stats.evasionRate + floor * 0.0015),
    },
  }
}

function createTowerBossDefinition(bossId: string): MonsterDefinition | undefined {
  const bossTemplates: Record<string, Partial<MonsterDefinition> & { stats: MonsterCombatStats }> = {
    'tower-guardian-5': {
      name: '첫 번째 문지기',
      description: '무한의 탑 5층을 지키는 초급 보스. 거대한 몸집으로 통로를 막는다.',
      rank: 'D',
      stats: { maxHp: 300, atk: 58, def: 22, speed: 12, critRate: 0.05, accuracy: 0.91, evasionRate: 0.04 },
      skillIds: ['monster-bite', 'monster-lazy-curse'],
    },
    'tower-knight-10': {
      name: '계단의 기사',
      description: '10층의 복도를 순찰하는 기사형 몬스터. 빠르게 접근한다.',
      rank: 'D',
      stats: { maxHp: 550, atk: 110, def: 36, speed: 16, critRate: 0.07, accuracy: 0.92, evasionRate: 0.06 },
      skillIds: ['monster-bite', 'monster-rift-scratch'],
    },
    'tower-warden-15': {
      name: '검은 감시자',
      description: '15층에서 그림자를 감시하는 보스. 강력한 단일 공격을 가한다.',
      rank: 'C',
      stats: { maxHp: 820, atk: 160, def: 50, speed: 17, critRate: 0.09, accuracy: 0.93, evasionRate: 0.07 },
      skillIds: ['monster-rift-scratch', 'monster-memory-fog'],
    },
    'tower-judge-20': {
      name: '균열의 심판자',
      description: '20층에 도달한 자를 시험하는 상급 보스. 균열의 힘을 다룬다.',
      rank: 'C',
      stats: { maxHp: 1150, atk: 220, def: 66, speed: 19, critRate: 0.10, accuracy: 0.94, evasionRate: 0.08 },
      skillIds: ['monster-lazy-curse', 'monster-memory-fog'],
    },
    'tower-monarch-25': {
      name: '층계의 군주',
      description: '25층에 거주하는 강력한 보스. 주변 몬스터를 지휘한다.',
      rank: 'C',
      stats: { maxHp: 1480, atk: 280, def: 82, speed: 20, critRate: 0.11, accuracy: 0.94, evasionRate: 0.09 },
      skillIds: ['monster-bite', 'monster-rift-scratch', 'monster-memory-fog'],
    },
    'tower-abyss-30': {
      name: '심연의 잔영',
      description: '30층에 나타나는 심연의 잔재. 균열의 정점에 가까운 존재.',
      rank: 'C',
      stats: { maxHp: 1850, atk: 330, def: 98, speed: 22, critRate: 0.12, accuracy: 0.95, evasionRate: 0.10 },
      skillIds: ['monster-rift-scratch', 'monster-lazy-curse', 'monster-memory-fog'],
    },
  }

  const template = bossTemplates[bossId]
  if (!template) return undefined

  return {
    id: bossId,
    name: template.name!,
    description: template.description!,
    rank: template.rank as 'E' | 'D' | 'C' | 'B' | 'A' | 'S',
    stats: template.stats,
    skillIds: template.skillIds!,
  }
}

export function getTowerMonstersForFloor(floor: number): MonsterDefinition[] {
  const ids = getTowerMonsterIds(floor)
  return ids
    .map(id => {
      const base = getBaseMonsterForTower(id)
      if (!base) return undefined
      return scaleMonsterForFloor(base, floor)
    })
    .filter((m): m is MonsterDefinition => Boolean(m))
}

export function calculateTowerReward(
  floor: number,
  outcome: 'victory' | 'defeat' | 'draw',
  isFirstClear: boolean
): TowerReward {
  if (outcome !== 'victory') return {}

  const isBoss = floor % 5 === 0

  if (isFirstClear) {
    if (isBoss) {
      return {
        hunterXp: Math.round(floor * 31),
        gold: Math.round(95 + floor * 12),
        shadowXp: Math.max(2, Math.round(floor / 2)),
        shadowEssence: Math.round(7 + floor / 4),
        boxType: 'boss',
        itemDropChance: 0.42,
      }
    }
    return {
      hunterXp: Math.round(floor * 12),
      gold: Math.round(10 + floor * 3),
      shadowEssence: floor <= 5 ? 1 : 2,
      itemDropChance: 0.12,
    }
  }

  // repeat clear
  if (isBoss) {
    return {
      hunterXp: Math.round(floor * 7),
      gold: Math.round(36 + floor * 5),
      shadowXp: Math.max(1, Math.round(floor / 4)),
      shadowEssence: Math.round(2 + floor / 8),
      itemDropChance: 0.11,
    }
  }
  return {
    hunterXp: Math.round(floor * 3),
    gold: Math.round(4 + floor),
    shadowEssence: 1,
    itemDropChance: 0.04,
  }
}

export function createInitialTowerState(): InfiniteTowerState {
  return {
    currentFloor: 1,
    highestClearedFloor: 0,
    clearedFloors: {},
    firstClearRewardsClaimed: {},
    bossRewardsClaimed: {},
  }
}

export function getNextUnlockFloor(state: InfiniteTowerState): number {
  return state.highestClearedFloor + 1
}
