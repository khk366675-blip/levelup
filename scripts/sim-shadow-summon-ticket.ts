/**
 * 12-23B shadow summon ticket/shard simulation.
 * Run with: npx tsx scripts/sim-shadow-summon-ticket.ts
 */
import { rollShadowInnateGrade, SHADOW_DEFINITIONS } from '../src/lib/shadows'
import type {
  ShadowDefinition,
  ShadowInnateGrade,
  ShadowRarity,
  ShadowRole,
  ShadowSummonTicketType,
} from '../src/lib/types'

const runs = 100_000
const rarityOrder: ShadowRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const roles: ShadowRole[] = ['assault', 'guard', 'scout', 'analyst', 'hunter', 'support']

const createRng = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

const innateSourceForTicket = (ticketType: ShadowSummonTicketType, grade?: 'standard' | 'rare' | 'elite' | 's_rank') => {
  if (grade === 's_rank') return 'main_s_achievement_ticket' as const
  if (ticketType === 'category_achievement_named' || ticketType === 'achievement_named_shadow') return 'achievement_ticket' as const
  if (ticketType === 'gate_named_shadow') return 'gate_named_ticket' as const
  if (ticketType === 'role_shadow') return 'role_ticket' as const
  if (ticketType === 'rare_shadow') return 'rare_ticket' as const
  return 'normal_ticket' as const
}

const candidatePool = (ticketType: ShadowSummonTicketType, role?: ShadowRole, grade?: 'standard' | 'rare' | 'elite' | 's_rank'): ShadowDefinition[] => {
  if (ticketType === 'gate_named_shadow') return SHADOW_DEFINITIONS.filter(def => def.isGateNamed)
  if (ticketType === 'category_achievement_named' || ticketType === 'achievement_named_shadow') {
    const minRarity = grade === 's_rank' || grade === 'elite' ? 'legendary' : 'epic'
    const minIndex = rarityOrder.indexOf(minRarity)
    return SHADOW_DEFINITIONS.filter(def => def.isAchievementNamed && rarityOrder.indexOf(def.rarity) >= minIndex)
  }
  const rarityLimit = ticketType === 'rare_shadow' ? 'epic' : 'rare'
  const maxIndex = rarityOrder.indexOf(rarityLimit)
  return SHADOW_DEFINITIONS.filter(def =>
    def.sourceType === 'gate_extract' &&
    rarityOrder.indexOf(def.rarity) <= maxIndex &&
    (!role || def.role === role)
  )
}

const rollTicket = (ticketType: ShadowSummonTicketType, seed: number, role?: ShadowRole, grade?: 'standard' | 'rare' | 'elite' | 's_rank') => {
  const rng = createRng(seed)
  const pool = candidatePool(ticketType, role, grade)
  const gradeCounts: Record<ShadowInnateGrade, number> = { C: 0, B: 0, A: 0, S: 0 }
  const rarityCounts: Record<string, number> = {}
  for (let i = 0; i < runs; i++) {
    const definition = pool[Math.floor(rng() * pool.length)]
    if (!definition) continue
    rarityCounts[definition.rarity] = (rarityCounts[definition.rarity] ?? 0) + 1
    const innate = rollShadowInnateGrade(innateSourceForTicket(ticketType, grade), rng)
    gradeCounts[innate] += 1
  }
  const pct = (count: number) => `${((count / runs) * 100).toFixed(2)}%`
  return {
    ticketType,
    role,
    grade,
    poolSize: pool.length,
    innate: Object.fromEntries(Object.entries(gradeCounts).map(([key, value]) => [key, pct(value)])),
    rarity: Object.fromEntries(Object.entries(rarityCounts).map(([key, value]) => [key, pct(value)])),
  }
}

const simulateBoxDrops = (source: 'daily' | 'weekly' | 'boss' | 'highBoss', seed: number) => {
  const rng = createRng(seed)
  const total = {
    normalShard: 0,
    rareShard: 0,
    namedShard: 0,
    achievementShard: 0,
    normalTicket: 0,
    rareTicket: 0,
    roleTicket: 0,
    gateNamedTicket: 0,
    achievementTicket: 0,
  }
  const multiplier = source === 'highBoss' ? 2 : 1
  for (let i = 0; i < runs; i++) {
    if (source === 'daily') {
      if (rng() < 0.03) total.normalShard += 1
      if (rng() < 0.005) total.rareShard += 1
      if (rng() < 0.002) total.normalTicket += 1
      if (rng() < 0.0003) total.rareTicket += 1
      if (rng() < 0.00005) total.achievementShard += 1
      continue
    }
    if (source === 'weekly') {
      if (rng() < 0.10) total.normalShard += 1
      if (rng() < 0.03) total.rareShard += 1
      if (rng() < 0.02) total.normalTicket += 1
      if (rng() < 0.005) total.rareTicket += 1
      if (rng() < 0.003) total.roleTicket += 1
      if (rng() < 0.001) total.namedShard += 1
      if (rng() < 0.0002) total.gateNamedTicket += 1
      continue
    }
    if (rng() < 0.20 * multiplier) total.normalShard += 1
    if (rng() < 0.08 * multiplier) total.rareShard += 1
    if (rng() < 0.02 * multiplier) total.namedShard += 1
    if (rng() < 0.05 * multiplier) total.normalTicket += 1
    if (rng() < 0.02 * multiplier) total.rareTicket += 1
    if (rng() < 0.01 * multiplier) total.roleTicket += 1
    if (rng() < 0.003 * multiplier) total.gateNamedTicket += 1
    if (rng() < Math.min(0.0005 * multiplier, 0.002)) total.achievementTicket += 1
  }
  return Object.fromEntries(Object.entries(total).map(([key, value]) => [key, `${((value / runs) * 100).toFixed(3)}%`]))
}

console.log('12-23B shadow summon ticket simulation')
console.log(`runs=${runs}`)
console.log(JSON.stringify(rollTicket('normal_shadow', 12_230), null, 2))
console.log(JSON.stringify(rollTicket('rare_shadow', 12_231), null, 2))
console.log(JSON.stringify(rollTicket('role_shadow', 12_232, roles[5]), null, 2))
console.log(JSON.stringify(rollTicket('gate_named_shadow', 12_233), null, 2))
console.log(JSON.stringify(rollTicket('achievement_named_shadow', 12_234, undefined, 'standard'), null, 2))
console.log(JSON.stringify(rollTicket('category_achievement_named', 12_235, undefined, 's_rank'), null, 2))
console.log(`boxDaily=${JSON.stringify(simulateBoxDrops('daily', 12_236))}`)
console.log(`boxWeekly=${JSON.stringify(simulateBoxDrops('weekly', 12_237))}`)
console.log(`boxBoss=${JSON.stringify(simulateBoxDrops('boss', 12_238))}`)
console.log(`boxHighBoss=${JSON.stringify(simulateBoxDrops('highBoss', 12_239))}`)
