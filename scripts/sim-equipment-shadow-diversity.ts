/**
 * 12-23B equipment/shadow diversity smoke simulation.
 * Run with: npx tsx scripts/sim-equipment-shadow-diversity.ts
 */
import { ITEM_POOL } from '../src/lib/seed'
import {
  EQUIPMENT_STAR_MULTIPLIER,
  getEnhancedItemEffects,
} from '../src/lib/game'
import { SHADOW_DEFINITIONS } from '../src/lib/shadows'
import type { EquipmentStars, Item, ShadowRarity, ShadowRole } from '../src/lib/types'

const rarityOrder: ShadowRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const roles: ShadowRole[] = ['assault', 'guard', 'scout', 'analyst', 'hunter', 'support']
const stars: EquipmentStars[] = [1, 2, 3, 4, 5]

const countBy = <T, K extends string>(items: T[], key: (item: T) => K | undefined) => {
  const result: Record<string, number> = {}
  for (const item of items) {
    const value = key(item) ?? 'unknown'
    result[value] = (result[value] ?? 0) + 1
  }
  return result
}

const equipment = ITEM_POOL.filter(item => item.equippable === true && item.consumable !== true)
const consumables = ITEM_POOL.filter(item => item.consumable === true)
const shadows = SHADOW_DEFINITIONS
const gateExtractShadows = shadows.filter(shadow => shadow.sourceType === 'gate_extract')
const gateNamed = shadows.filter(shadow => shadow.isGateNamed)
const achievementNamed = shadows.filter(shadow => shadow.isAchievementNamed)
const evolutionRoutes = shadows.filter(shadow => shadow.evolutionTargetDefinitionId)

const starAdjustedSamples = equipment.slice(0, 12).map(item => {
  const base = getEnhancedItemEffects(item, 0)
  const best = getEnhancedItemEffects({ ...item, equipmentStars: 5 } as Item, 0)
  const firstBase = base[0]?.value ?? 0
  const firstBest = best[0]?.value ?? 0
  return {
    id: item.id,
    rarity: item.rarity,
    base: firstBase,
    fiveStar: firstBest,
    ratio: firstBase > 0 ? firstBest / firstBase : 0,
  }
})

console.log('12-23B equipment/shadow diversity simulation')
console.log(`equipment=${equipment.length}, consumables=${consumables.length}`)
console.log(`equipmentByRarity=${JSON.stringify(countBy(equipment, item => item.rarity))}`)
console.log(`equipmentBySlot=${JSON.stringify(countBy(equipment, item => item.slot))}`)
console.log(`equipmentStarMultipliers=${JSON.stringify(Object.fromEntries(stars.map(star => [star, EQUIPMENT_STAR_MULTIPLIER[star]])))}`)
console.log(`shadowDefinitions=${shadows.length}, gateExtract=${gateExtractShadows.length}, gateNamed=${gateNamed.length}, achievementNamed=${achievementNamed.length}`)
console.log(`shadowByRarity=${JSON.stringify(countBy(shadows, shadow => shadow.rarity))}`)
console.log(`gateExtractByRank=${JSON.stringify(countBy(gateExtractShadows, shadow => shadow.sourceGateRank))}`)
console.log(`gateExtractByRole=${JSON.stringify(Object.fromEntries(roles.map(role => [role, gateExtractShadows.filter(shadow => shadow.role === role).length])))}`)
console.log(`achievementNamedByCategory=${JSON.stringify(countBy(achievementNamed, shadow => shadow.sourceCategory))}`)
console.log(`evolutionRoutes=${evolutionRoutes.length}`)
console.log(`evolutionBySourceRole=${JSON.stringify(Object.fromEntries(roles.map(role => [role, evolutionRoutes.filter(shadow => shadow.role === role).length])))}`)
console.log(`maxBasePowerByRarity=${JSON.stringify(Object.fromEntries(rarityOrder.map(rarity => [rarity, Math.max(...shadows.filter(shadow => shadow.rarity === rarity).map(shadow => shadow.basePower), 0)])))}`)
console.log(`sampleFiveStarRatio=${JSON.stringify(starAdjustedSamples.slice(0, 4))}`)
