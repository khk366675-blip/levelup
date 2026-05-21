import { SHOP_PRODUCTS, type ShopProduct } from '../src/lib/shop'

type Wallet = {
  gold: number
  essence: number
  normalTickets: number
  rareTickets: number
  normalShards: number
  rareShards: number
  equipmentDraws: number
  relicDraws: number
  rareEquipmentDraws: number
  purchases: number
}

const productById = new Map(SHOP_PRODUCTS.map(product => [product.id, product]))

const dailyIncome = () => ({
  gold: 6 * 24 + 22 + 36 + 60 + 85 + 101,
  essence: 1 + 2 + 5 + 2 + 4,
})

const weeklyIncome = () => ({
  gold: 386,
  essence: 10,
})

const bossIncome = (floor: number) => ({
  gold: 95 + floor * 12,
  essence: Math.round(7 + floor / 4),
})

function canBuy(wallet: Wallet, product: ShopProduct): boolean {
  return wallet.gold >= product.priceGold &&
    wallet.essence >= (product.priceEssence ?? 0)
}

function applyReward(wallet: Wallet, product: ShopProduct) {
  const visit = (reward: ShopProduct['reward']) => {
    if (reward.kind === 'shadow_ticket') {
      if (reward.ticketType === 'rare_shadow') wallet.rareTickets += reward.quantity
      else wallet.normalTickets += reward.quantity
      return
    }
    if (reward.kind === 'shadow_shards') {
      wallet.normalShards += reward.shards.normal ?? 0
      wallet.rareShards += reward.shards.rare ?? 0
      return
    }
    if (reward.kind === 'shadow_essence') {
      wallet.essence += reward.amount
      return
    }
    if (reward.kind === 'equipment_draw') {
      if (reward.drawTier === 'relic') wallet.relicDraws += reward.quantity
      else if (reward.drawTier === 'rare') wallet.rareEquipmentDraws += reward.quantity
      else wallet.equipmentDraws += reward.quantity
      return
    }
    for (const child of reward.rewards) visit(child)
  }
  visit(product.reward)
}

function buy(wallet: Wallet, id: string): boolean {
  const product = productById.get(id)
  if (!product || !canBuy(wallet, product)) return false
  wallet.gold -= product.priceGold
  wallet.essence -= product.priceEssence ?? 0
  wallet.purchases += 1
  applyReward(wallet, product)
  return true
}

function buyWhile(wallet: Wallet, id: string, max = 99) {
  let count = 0
  while (count < max && buy(wallet, id)) count += 1
}

function simulate(days: number, strategy: 'steady' | 'weekly-priority') {
  const wallet: Wallet = {
    gold: 0,
    essence: 0,
    normalTickets: 0,
    rareTickets: 0,
    normalShards: 0,
    rareShards: 0,
    equipmentDraws: 0,
    relicDraws: 0,
    rareEquipmentDraws: 0,
    purchases: 0,
  }

  for (let day = 1; day <= days; day++) {
    const daily = dailyIncome()
    wallet.gold += daily.gold
    wallet.essence += daily.essence

    if (day % 7 === 0) {
      const weekly = weeklyIncome()
      wallet.gold += weekly.gold
      wallet.essence += weekly.essence
    }
    if (day % 5 === 0) {
      const boss = bossIncome(day)
      wallet.gold += boss.gold
      wallet.essence += boss.essence
    }

    if (strategy === 'weekly-priority' && day % 7 === 0) {
      const weekIndex = Math.floor(day / 7)
      buyWhile(wallet, 'rare-shadow-ticket', 2)
      buy(wallet, weekIndex % 2 === 0 ? 'rare-equipment-ticket' : 'relic-draw-ticket')
      buy(wallet, 'equipment-choice-bundle')
      buyWhile(wallet, 'rare-shadow-shards', 2)
      buy(wallet, 'shadow-shard-bundle')
    }

    buy(wallet, 'normal-shadow-ticket')
    buy(wallet, 'weapon-draw-ticket')
    buy(wallet, day % 2 === 0 ? 'armor-draw-ticket' : 'accessory-draw-ticket')
    buy(wallet, 'essence-normal-shards')

    if (strategy === 'steady' && day % 7 === 0) {
      buy(wallet, 'rare-shadow-shards')
      buy(wallet, 'shadow-shard-bundle')
      buy(wallet, 'relic-draw-ticket')
      buy(wallet, 'rare-equipment-ticket')
      buy(wallet, 'rare-shadow-ticket')
      buy(wallet, 'equipment-choice-bundle')
    }

    if (strategy === 'steady') {
      buyWhile(wallet, day % 2 === 0 ? 'armor-draw-ticket' : 'accessory-draw-ticket', 2)
      buyWhile(wallet, 'normal-shadow-ticket', 2)
    } else {
      buyWhile(wallet, 'weapon-draw-ticket', 2)
    }
  }

  return wallet
}

function summarize(days: number, strategy: 'steady' | 'weekly-priority') {
  const result = simulate(days, strategy)
  const normalTicketEquiv = result.normalTickets + result.normalShards / 10
  const rareTicketEquiv = result.rareTickets + result.rareShards / 10
  console.log(`--- ${days} day shop economy (${strategy}) ---`)
  console.log(`remaining: gold=${result.gold}, essence=${result.essence}`)
  console.log(`shadow: normalTickets=${result.normalTickets}, normalShards=${result.normalShards}, normalTicketEq=${normalTicketEquiv.toFixed(1)}`)
  console.log(`shadow: rareTickets=${result.rareTickets}, rareShards=${result.rareShards}, rareTicketEq=${rareTicketEquiv.toFixed(1)}`)
  console.log(`equipment: standard=${result.equipmentDraws}, rare=${result.rareEquipmentDraws}, relic=${result.relicDraws}`)
  console.log(`purchases=${result.purchases}`)
}

console.log('Shop economy simulation')
console.log(`products=${SHOP_PRODUCTS.length}`)
summarize(7, 'steady')
summarize(30, 'steady')
summarize(30, 'weekly-priority')
