import hunterBase from '../assets/battle/hunters/hunter-base-clean.png'
import hunterSwordsman from '../assets/battle/hunters/hunter-swordsman-clean.png'
import hunterWarrior from '../assets/battle/hunters/hunter-warrior-clean.png'
import hunterMage from '../assets/battle/hunters/hunter-mage-clean.png'
import hunterGuardian from '../assets/battle/hunters/hunter-guardian-clean.png'
import hunterTracker from '../assets/battle/hunters/hunter-tracker-clean.png'
import hunterTactician from '../assets/battle/hunters/hunter-tactician-clean.png'
import hunterHiddenShadow from '../assets/battle/hunters/hunter-hidden-shadow-clean.png'
import hunterHiddenCurse from '../assets/battle/hunters/hunter-hidden-curse-clean.png'
import hunterHiddenRift from '../assets/battle/hunters/hunter-hidden-rift-clean.png'

export type HunterBattleSpriteKey =
  | 'hunter-base'
  | 'hunter-swordsman'
  | 'hunter-warrior'
  | 'hunter-mage'
  | 'hunter-guardian'
  | 'hunter-tracker'
  | 'hunter-tactician'
  | 'hunter-hidden-shadow'
  | 'hunter-hidden-curse'
  | 'hunter-hidden-rift'

export const HUNTER_BATTLE_SPRITES: Record<HunterBattleSpriteKey, string> = {
  'hunter-base': hunterBase,
  'hunter-swordsman': hunterSwordsman,
  'hunter-warrior': hunterWarrior,
  'hunter-mage': hunterMage,
  'hunter-guardian': hunterGuardian,
  'hunter-tracker': hunterTracker,
  'hunter-tactician': hunterTactician,
  'hunter-hidden-shadow': hunterHiddenShadow,
  'hunter-hidden-curse': hunterHiddenCurse,
  'hunter-hidden-rift': hunterHiddenRift,
}

/**
 * Resolves the sprite key based on the active jobId / class information
 */
export function getHunterBattleSpriteKey(jobId?: string): HunterBattleSpriteKey {
  if (!jobId || jobId === 'novice-hunter') {
    return 'hunter-base'
  }

  const id = jobId.toLowerCase()

  // 1. Hidden branch detection
  if (id.includes('shadow') || id.includes('abyss-summoner') || id.includes('phantom-general')) {
    return 'hunter-hidden-shadow'
  }
  if (id.includes('curse')) {
    return 'hunter-hidden-curse'
  }
  if (id.includes('rift') || id.includes('dimension')) {
    return 'hunter-hidden-rift'
  }

  // 2. Normal class branch detection
  // Swordsman Lineage
  if (
    id.includes('swordsman') ||
    id.includes('swordsmaster') ||
    id.includes('sword-saint') ||
    id.includes('illusory-swordmaster') ||
    id.includes('speed-striker') ||
    id.includes('spellsword') ||
    id.includes('blade') ||
    id.includes('sword')
  ) {
    return 'hunter-swordsman'
  }

  // Warrior Lineage
  if (
    id === 'warrior' ||
    id.includes('berserker') ||
    id.includes('slayer') ||
    id.includes('dragon-knight') ||
    id.includes('immortal')
  ) {
    return 'hunter-warrior'
  }

  // Mage Lineage
  if (
    id.includes('mage') ||
    id.includes('chronomancer') ||
    id.includes('time-governor') ||
    id.includes('entropy') ||
    id.includes('wizard')
  ) {
    return 'hunter-mage'
  }

  // Guardian Lineage
  if (
    id.includes('guardian') ||
    id.includes('paladin') ||
    id.includes('shield') ||
    id.includes('holy-redeemer') ||
    id.includes('judgment-knight')
  ) {
    return 'hunter-guardian'
  }

  // Tracker Lineage
  if (
    id.includes('scout') ||
    id.includes('stalker') ||
    id.includes('tracker') ||
    id.includes('assassin') ||
    id.includes('phantom-stalker') ||
    id.includes('abyss-emperor')
  ) {
    return 'hunter-tracker'
  }

  // Tactician Lineage
  if (
    id.includes('tactician') ||
    id.includes('strategist') ||
    id.includes('alchemist') ||
    id.includes('chimera') ||
    id.includes('weaver') ||
    id.includes('orchestrator')
  ) {
    return 'hunter-tactician'
  }

  return 'hunter-base'
}

/**
 * Returns resolved sprite PNG URL based on the hunter's jobId
 */
export function getHunterBattleSpriteUrl(jobId?: string): string {
  const key = getHunterBattleSpriteKey(jobId)
  return HUNTER_BATTLE_SPRITES[key]
}
