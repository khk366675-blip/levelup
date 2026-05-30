import type { BattleUnit, DirectBattleState } from './directBattleTypes'
import { getHunterBattleSpriteUrl } from './hunterBattleSprites'
import { getMonsterBattleSpriteUrl } from './monsterBattleSprites'

export type BattleActorTeam = 'ally' | 'enemy'

export type BattleActorKind = 'hunter' | 'shadow' | 'monster' | 'boss'

export type BattleLane = 'front' | 'mid' | 'back'

export interface BattleActorViewModel {
  id: string
  name: string
  team: BattleActorTeam
  kind: BattleActorKind
  lane: BattleLane
  
  hp: number
  maxHp: number
  
  portraitUrl?: string
  role?: string
  rarity?: string
  innateGrade?: 'C' | 'B' | 'A' | 'S'
  definitionId?: string // To easily find shadow/monster definitions
  hunterSpriteUrl?: string
  monsterSpriteUrl?: string
  
  isActive?: boolean
  isTargeted?: boolean
  isDefeated?: boolean
  isBoss?: boolean
  isNamed?: boolean
  telegraph?: any
  presentationId?: string
  sourceId?: string
}

/**
 * Determine lane layout for units in direct combat state
 */
export function getUnitLane(unit: BattleUnit): BattleLane {
  if (unit.team === 'enemy') {
    return unit.unitType === 'boss' ? 'back' : 'front'
  }
  // Ally team
  if (unit.unitType === 'hunter') return 'mid'
  if (unit.unitType === 'shadow') return 'front'
  return 'back'
}

/**
 * Maps a single BattleUnit to a BattleActorViewModel
 */
export function mapUnitToViewModel(
  unit: BattleUnit,
  activeUnitId?: string,
  targetUnitIds: string[] = []
): BattleActorViewModel {
  const isHunter = unit.unitType === 'hunter'
  const isShadow = unit.unitType === 'shadow'
  const isBoss = unit.unitType === 'boss'
  const isMonsterUnit = !isHunter && !isShadow
  
  let kind: BattleActorKind = 'monster'
  if (isHunter) kind = 'hunter'
  else if (isShadow) kind = 'shadow'
  else if (isBoss) kind = 'boss'
  
  const innateGrade = unit.metadata?.innateGrade as 'C' | 'B' | 'A' | 'S' | undefined
  const named = Boolean(
    unit.metadata?.tags?.includes('named') ||
    unit.metadata?.tags?.includes('boss') ||
    (unit.metadata as any).isNamed ||
    (unit.metadata as any).isGateNamed ||
    (unit.metadata as any).isAchievementNamed ||
    (unit.metadata as any).rank === 'named'
  )

  return {
    id: unit.unitId,
    name: unit.displayName,
    team: unit.team === 'player' ? 'ally' : 'enemy',
    kind,
    lane: getUnitLane(unit),
    hp: Math.max(0, Math.round(unit.stats.currentHp)),
    maxHp: Math.round(unit.stats.maxHp),
    portraitUrl: undefined,
    role: unit.role,
    rarity: unit.metadata?.rarity,
    innateGrade,
    definitionId: unit.metadata?.definitionId,
    hunterSpriteUrl: isHunter ? getHunterBattleSpriteUrl(unit.role) : undefined,
    monsterSpriteUrl: isMonsterUnit ? getMonsterBattleSpriteUrl(unit.metadata?.definitionId || unit.unitId, unit.role, isBoss) : undefined,
    isActive: unit.unitId === activeUnitId,
    isTargeted: targetUnitIds.includes(unit.unitId),
    isDefeated: unit.stats.currentHp <= 0,
    isBoss,
    isNamed: named,
    telegraph: unit.telegraph,
    presentationId: (isShadow && unit.unitId === activeUnitId) ? 'shadow-skill' : undefined,
    sourceId: unit.sourceId,
  }
}

/**
 * Adapter to build viewmodels for all battle units
 */
export function buildBattleActors(
  state: DirectBattleState,
  activeUnitId?: string,
  targetUnitIds: string[] = []
): BattleActorViewModel[] {
  return state.units.map(unit => mapUnitToViewModel(unit, activeUnitId, targetUnitIds))
}

/**
 * Gate battlefield theme based on encounter key
 */
export function getBattlefieldTheme(battleType: 'gate' | 'tower', encounterKey?: string): {
  bgGradient: string
  arenaGrid: string
  skyFilter: string
} {
  if (battleType === 'tower') {
    return {
      bgGradient: 'from-slate-950 via-purple-950/80 to-ink-950',
      arenaGrid: 'border-purple-500/10 bg-purple-500/[0.02]',
      skyFilter: 'bg-[radial-gradient(circle_at_50%_20%,rgba(139,92,246,0.18),transparent_55%)] shadow-mist-legendary',
    }
  }
  
  // Gate themes based on key
  if (encounterKey?.includes('red') || encounterKey?.includes('boss')) {
    return {
      bgGradient: 'from-slate-950 via-rose-950/80 to-ink-950',
      arenaGrid: 'border-rose-500/10 bg-rose-500/[0.02]',
      skyFilter: 'bg-[radial-gradient(circle_at_50%_20%,rgba(244,63,94,0.15),transparent_55%)]',
    }
  }
  
  if (encounterKey?.includes('named') || encounterKey?.includes('large')) {
    return {
      bgGradient: 'from-slate-950 via-indigo-950/80 to-ink-950',
      arenaGrid: 'border-indigo-500/10 bg-indigo-500/[0.02]',
      skyFilter: 'bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.14),transparent_55%)]',
    }
  }
  
  // Default cyan gate
  return {
    bgGradient: 'from-slate-950 via-cyan-950/70 to-ink-950',
    arenaGrid: 'border-cyan-500/10 bg-cyan-500/[0.02]',
    skyFilter: 'bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.12),transparent_55%)]',
  }
}
