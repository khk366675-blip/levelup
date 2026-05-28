import riftMinion from '../assets/battle/monsters/monster-rift-minion-clean.png'
import riftBruiser from '../assets/battle/monsters/monster-rift-bruiser-clean.png'
import riftTank from '../assets/battle/monsters/monster-rift-tank-clean.png'
import riftCaster from '../assets/battle/monsters/monster-rift-caster-clean.png'
import beastAssault from '../assets/battle/monsters/monster-beast-assault-clean.png'
import undeadWarrior from '../assets/battle/monsters/monster-undead-warrior-clean.png'
import riftMender from '../assets/battle/monsters/monster-rift-mender-clean.png'
import memoryDisruptor from '../assets/battle/monsters/monster-memory-disruptor-clean.png'
import bossRiftlord from '../assets/battle/monsters/boss-riftlord-clean.png'
import bossWarden from '../assets/battle/monsters/boss-warden-clean.png'

export type MonsterBattleSpriteKey =
  | 'monster-rift-minion'
  | 'monster-rift-bruiser'
  | 'monster-rift-tank'
  | 'monster-rift-caster'
  | 'monster-beast-assault'
  | 'monster-undead-warrior'
  | 'monster-rift-mender'
  | 'monster-memory-disruptor'
  | 'boss-riftlord'
  | 'boss-warden'

export const MONSTER_BATTLE_SPRITES: Record<MonsterBattleSpriteKey, string> = {
  'monster-rift-minion': riftMinion,
  'monster-rift-bruiser': riftBruiser,
  'monster-rift-tank': riftTank,
  'monster-rift-caster': riftCaster,
  'monster-beast-assault': beastAssault,
  'monster-undead-warrior': undeadWarrior,
  'monster-rift-mender': riftMender,
  'monster-memory-disruptor': memoryDisruptor,
  'boss-riftlord': bossRiftlord,
  'boss-warden': bossWarden,
}

/**
 * Resolves the sprite key based on the monster's definition ID, role, and boss status
 */
export function getMonsterBattleSpriteKey(
  monsterId: string,
  role?: string,
  isBoss: boolean = false
): MonsterBattleSpriteKey {
  const id = monsterId.toLowerCase()
  const r = role?.toLowerCase() ?? ''

  // 1. Boss check
  if (isBoss || id.includes('boss') || r === 'boss') {
    if (id.includes('warden')) {
      return 'boss-warden'
    }
    return 'boss-riftlord'
  }

  // 2. Exact ID pattern matching
  if (id.includes('beast') || id.includes('claw') || id.includes('brawler')) {
    return 'monster-beast-assault'
  }
  if (
    id.includes('undead') ||
    id.includes('skeleton') ||
    id.includes('warrior') ||
    id.includes('bone') ||
    id.includes('pick') ||
    id.includes('gladiator')
  ) {
    return 'monster-undead-warrior'
  }
  if (id.includes('memory') || id.includes('disruptor') || id.includes('registrar')) {
    return 'monster-memory-disruptor'
  }
  if (
    id.includes('mender') ||
    id.includes('chanter') ||
    id.includes('cantor') ||
    id.includes('hexer')
  ) {
    return 'monster-rift-mender'
  }

  // 3. Role-based matching
  if (r === 'support') {
    return 'monster-rift-mender'
  }
  if (r === 'controller') {
    return 'monster-memory-disruptor'
  }
  if (r === 'caster') {
    return 'monster-rift-caster'
  }
  if (r === 'tank') {
    return 'monster-rift-tank'
  }
  if (r === 'bruiser') {
    return 'monster-rift-bruiser'
  }
  if (r === 'minion' || r === 'assassin') {
    return 'monster-rift-minion'
  }

  return 'monster-rift-minion'
}

/**
 * Returns resolved cleaned sprite PNG URL based on the monster attributes
 */
export function getMonsterBattleSpriteUrl(
  monsterId: string,
  role?: string,
  isBoss: boolean = false
): string {
  const key = getMonsterBattleSpriteKey(monsterId, role, isBoss)
  return MONSTER_BATTLE_SPRITES[key]
}
