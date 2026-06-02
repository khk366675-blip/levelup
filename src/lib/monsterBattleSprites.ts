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

import angel from '../assets/battle/monsters/angel-clean.png'
import anxietyLancer from '../assets/battle/monsters/anxiety-lancer-clean.png'
import belatus from '../assets/battle/monsters/belatus-clean.png'
import boredomArcher from '../assets/battle/monsters/boredom-archer-clean.png'
import celaide from '../assets/battle/monsters/celaide-clean.png'
import compromiseBastion from '../assets/battle/monsters/compromise-bastion-clean.png'
import despairColossus from '../assets/battle/monsters/despair-colossus-clean.png'
import dorga from '../assets/battle/monsters/dorga-clean.png'
import fearReaper from '../assets/battle/monsters/fear-reaper-clean.png'
import frostVassal from '../assets/battle/monsters/frost-vassal-clean.png'
import grellic from '../assets/battle/monsters/grellic-clean.png'
import igris from '../assets/battle/monsters/igris-clean.png'
import ironOathKnight from '../assets/battle/monsters/iron-oath-knight-clean.png'
import mirage from '../assets/battle/monsters/mirage-clean.png'
import mirageCutthroat from '../assets/battle/monsters/mirage-cutthroat-clean.png'
import nox from '../assets/battle/monsters/nox-clean.png'
import obsessionChoir from '../assets/battle/monsters/obsession-choir-clean.png'
import pesta from '../assets/battle/monsters/pesta-clean.png'
import prideDuelist from '../assets/battle/monsters/pride-duelist-clean.png'
import procrastinationJailer from '../assets/battle/monsters/procrastination-jailer-clean.png'
import rationalizationSwarm from '../assets/battle/monsters/rationalization-swarm-clean.png'
import selfDoubtOracle from '../assets/battle/monsters/self-doubt-oracle-clean.png'
import stormHerald from '../assets/battle/monsters/storm-herald-clean.png'
import whiteflameExecutor from '../assets/battle/monsters/whiteflame-executor-clean.png'

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
  | 'angel'
  | 'anxiety-lancer'
  | 'belatus'
  | 'boredom-archer'
  | 'celaide'
  | 'compromise-bastion'
  | 'despair-colossus'
  | 'dorga'
  | 'fear-reaper'
  | 'frost-vassal'
  | 'grellic'
  | 'igris'
  | 'iron-oath-knight'
  | 'mirage'
  | 'mirage-cutthroat'
  | 'nox'
  | 'obsession-choir'
  | 'pesta'
  | 'pride-duelist'
  | 'procrastination-jailer'
  | 'rationalization-swarm'
  | 'self-doubt-oracle'
  | 'storm-herald'
  | 'whiteflame-executor'

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
  'angel': angel,
  'anxiety-lancer': anxietyLancer,
  'belatus': belatus,
  'boredom-archer': boredomArcher,
  'celaide': celaide,
  'compromise-bastion': compromiseBastion,
  'despair-colossus': despairColossus,
  'dorga': dorga,
  'fear-reaper': fearReaper,
  'frost-vassal': frostVassal,
  'grellic': grellic,
  'igris': igris,
  'iron-oath-knight': ironOathKnight,
  'mirage': mirage,
  'mirage-cutthroat': mirageCutthroat,
  'nox': nox,
  'obsession-choir': obsessionChoir,
  'pesta': pesta,
  'pride-duelist': prideDuelist,
  'procrastination-jailer': procrastinationJailer,
  'rationalization-swarm': rationalizationSwarm,
  'self-doubt-oracle': selfDoubtOracle,
  'storm-herald': stormHerald,
  'whiteflame-executor': whiteflameExecutor,
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

  // Exact ID matching for newly added monsters with unique sprites
  const exactMatches: Record<string, MonsterBattleSpriteKey> = {
    'angel': 'angel',
    'anxiety-lancer': 'anxiety-lancer',
    'belatus': 'belatus',
    'boredom-archer': 'boredom-archer',
    'celaide': 'celaide',
    'compromise-bastion': 'compromise-bastion',
    'despair-colossus': 'despair-colossus',
    'dorga': 'dorga',
    'fear-reaper': 'fear-reaper',
    'frost-vassal': 'frost-vassal',
    'grellic': 'grellic',
    'igris': 'igris',
    'iron-oath-knight': 'iron-oath-knight',
    'mirage': 'mirage',
    'mirage-cutthroat': 'mirage-cutthroat',
    'nox': 'nox',
    'obsession-choir': 'obsession-choir',
    'pesta': 'pesta',
    'pride-duelist': 'pride-duelist',
    'procrastination-jailer': 'procrastination-jailer',
    'rationalization-swarm': 'rationalization-swarm',
    'self-doubt-oracle': 'self-doubt-oracle',
    'storm-herald': 'storm-herald',
    'whiteflame-executor': 'whiteflame-executor',
  }

  if (id in exactMatches) {
    return exactMatches[id]
  }

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
