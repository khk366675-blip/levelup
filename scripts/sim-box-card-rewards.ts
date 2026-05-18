import { ITEM_POOL } from '../src/lib/seed'

type Tier = 'normal' | 'enhanced' | 'superior' | 'epic'

const runs = 20_000

const tierMultiplier: Record<Tier, number> = {
  normal: 1,
  enhanced: 1.25,
  superior: 1.55,
  epic: 1.9,
}

function rollDailyBox(tier: Tier) {
  const mult = tierMultiplier[tier]
  const xp = Math.round(24 * mult)
  const essence = Math.max(1, Math.round((1 + Math.floor(Math.random() * 3)) * mult))
  const consumable = Math.random() < 0.08 * mult ? 1 : 0
  const equipment = Math.random() < 0.055 * mult ? 1 : 0
  return { xp, essence, consumable, equipment }
}

function rollWeeklyBox() {
  const xp = Math.round(115 * tierMultiplier.superior)
  const essence = 5 + Math.floor(Math.random() * 11)
  const consumable = Math.random() < 0.55 ? 1 : 0
  const equipment = Math.random() < 0.42 ? 1 : 0
  return { xp, essence, consumable, equipment }
}

function rollBossBox(floor: number, tier: Tier) {
  const mult = tierMultiplier[tier]
  const xp = Math.round((30 + floor * 3) * mult)
  const essence = Math.round((5 + floor / 2) * mult)
  const consumable = Math.random() < 0.28 ? 1 : 0
  const equipment = Math.random() < (tier === 'epic' ? 0.78 : 0.62) ? 1 : 0
  return { xp, essence, consumable, equipment }
}

function add(a: ReturnType<typeof rollDailyBox>, b: ReturnType<typeof rollDailyBox>) {
  a.xp += b.xp
  a.essence += b.essence
  a.consumable += b.consumable
  a.equipment += b.equipment
}

const total = { xp: 0, essence: 0, consumable: 0, equipment: 0 }
const weekly = { xp: 0, essence: 0, consumable: 0, equipment: 0 }
const boss = { xp: 0, essence: 0, consumable: 0, equipment: 0 }

for (let i = 0; i < runs; i++) {
  const day = { xp: 15 + 35 + 80, essence: 1 + 2 + 5, consumable: 0, equipment: 0 }
  add(day, rollDailyBox('superior'))
  add(total, day)

  const week = { xp: 0, essence: 0, consumable: 0, equipment: 0 }
  for (let d = 0; d < 7; d++) {
    week.xp += 15 + 35 + 80
    week.essence += 1 + 2 + 5
    add(week, rollDailyBox('superior'))
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
console.log(`perfect day avg: xp=${avg(total.xp)}, essence=${avg(total.essence)}, equipment=${avg(total.equipment)}, consumables=${avg(total.consumable)}`)
console.log(`perfect week avg: xp=${avg(weekly.xp)}, essence=${avg(weekly.essence)}, equipment=${avg(weekly.equipment)}, consumables=${avg(weekly.consumable)}`)
console.log(`floor 15 boss box avg: xp=${avg(boss.xp)}, essence=${avg(boss.essence)}, equipment=${avg(boss.equipment)}, consumables=${avg(boss.consumable)}`)
