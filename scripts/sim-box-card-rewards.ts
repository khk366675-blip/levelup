import { ITEM_POOL } from '../src/lib/seed'

type Tier = 'normal' | 'enhanced' | 'superior' | 'epic'

const runs = 20_000

const tierMultiplier: Record<Tier, number> = {
  normal: 1,
  enhanced: 1.3,
  superior: 1.68,
  epic: 2.0,
}

function rollDailyBox(tier: Tier) {
  const mult = tierMultiplier[tier]
  const xp = Math.round(24 * mult)
  const gold = Math.round((42 + Math.floor(Math.random() * 19)) * mult)
  const essence = Math.max(1, Math.round((1 + Math.floor(Math.random() * 3)) * mult))
  const consumable = Math.random() < 0.08 * mult ? 1 : 0
  const equipment = Math.random() < 0.058 * mult ? 1 : 0
  const normalShards = Math.random() < 0.035 * mult ? 1 : 0
  const rareShards = Math.random() < 0.007 * mult ? 1 : 0
  return { xp, gold, essence, consumable, equipment, normalShards, rareShards }
}

function rollWeeklyBox() {
  const xp = Math.round(115 * tierMultiplier.superior)
  const gold = Math.round((190 + Math.floor(Math.random() * 81)) * tierMultiplier.superior)
  const essence = 5 + Math.floor(Math.random() * 11)
  const consumable = Math.random() < 0.55 ? 1 : 0
  const equipment = Math.random() < 0.42 ? 1 : 0
  const normalShards = Math.random() < 0.12 * tierMultiplier.superior ? 2 : 0
  const rareShards = Math.random() < 0.04 * tierMultiplier.superior ? 1 : 0
  return { xp, gold, essence, consumable, equipment, normalShards, rareShards }
}

function rollBossBox(floor: number, tier: Tier) {
  const mult = tierMultiplier[tier]
  const xp = Math.round((30 + floor * 3) * mult)
  const gold = Math.round((120 + floor * 7 + Math.floor(Math.random() * 45)) * mult)
  const essence = Math.round((5 + floor / 2) * mult)
  const consumable = Math.random() < 0.34 ? 1 : 0
  const equipment = Math.random() < (tier === 'epic' ? 0.84 : 0.68) ? 1 : 0
  const normalShards = Math.random() < 0.26 * mult ? 2 : 0
  const rareShards = Math.random() < 0.11 * mult ? 1 : 0
  return { xp, gold, essence, consumable, equipment, normalShards, rareShards }
}

function add(a: ReturnType<typeof rollDailyBox>, b: ReturnType<typeof rollDailyBox>) {
  a.xp += b.xp
  a.gold += b.gold
  a.essence += b.essence
  a.consumable += b.consumable
  a.equipment += b.equipment
  a.normalShards += b.normalShards
  a.rareShards += b.rareShards
}

const total = { xp: 0, gold: 0, essence: 0, consumable: 0, equipment: 0, normalShards: 0, rareShards: 0 }
const weekly = { xp: 0, gold: 0, essence: 0, consumable: 0, equipment: 0, normalShards: 0, rareShards: 0 }
const boss = { xp: 0, gold: 0, essence: 0, consumable: 0, equipment: 0, normalShards: 0, rareShards: 0 }

for (let i = 0; i < runs; i++) {
  const day = { xp: 15 + 35 + 80 + 25, gold: 22 + 36 + 60 + 85, essence: 1 + 2 + 5 + 2, consumable: 0, equipment: 0, normalShards: 1, rareShards: Math.random() < 0.15 ? 1 : 0 }
  add(day, rollDailyBox('epic'))
  add(total, day)

  const week = { xp: 0, gold: 0, essence: 0, consumable: 0, equipment: 0, normalShards: 0, rareShards: 0 }
  for (let d = 0; d < 7; d++) {
    week.xp += 15 + 35 + 80 + 25
    week.gold += 22 + 36 + 60 + 85
    week.essence += 1 + 2 + 5 + 2
    week.normalShards += 1
    if (Math.random() < 0.15) week.rareShards += 1
    add(week, rollDailyBox('epic'))
  }
  add(week, rollWeeklyBox())
  add(weekly, week)

  add(boss, rollBossBox(15, 'superior'))
}

const avg = (value: number) => (value / runs).toFixed(2)
const equipmentPool = ITEM_POOL.filter(item => item.equippable === true && item.consumable !== true)
const consumablePool = ITEM_POOL.filter(item => item.consumable === true)

console.log('Box/Card reward simulation')
console.log(`runs=${runs}`)
console.log(`itemPool equipment=${equipmentPool.length}, consumables=${consumablePool.length}`)
console.log(`perfect day avg: xp=${avg(total.xp)}, gold=${avg(total.gold)}, essence=${avg(total.essence)}, equipment=${avg(total.equipment)}, consumables=${avg(total.consumable)}, normalShards=${avg(total.normalShards)}, rareShards=${avg(total.rareShards)}`)
console.log(`perfect week avg: xp=${avg(weekly.xp)}, gold=${avg(weekly.gold)}, essence=${avg(weekly.essence)}, equipment=${avg(weekly.equipment)}, consumables=${avg(weekly.consumable)}, normalShards=${avg(weekly.normalShards)}, rareShards=${avg(weekly.rareShards)}`)
console.log(`floor 15 boss box avg: xp=${avg(boss.xp)}, gold=${avg(boss.gold)}, essence=${avg(boss.essence)}, equipment=${avg(boss.equipment)}, consumables=${avg(boss.consumable)}, normalShards=${avg(boss.normalShards)}, rareShards=${avg(boss.rareShards)}`)
