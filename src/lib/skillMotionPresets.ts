export type ActorMotionType =
  | 'dash-slash'          // Swordsman: Lightning swift dash forward with a sharp angle tilt
  | 'heavy-lunge'         // Warrior: Jump high and smash down heavily with visual compression
  | 'cast-hold'           // Mage: Float gently upwards and charge kinetic glowing aura
  | 'guard-raise'         // Guardian: Lower center of gravity, brace for heavy impact
  | 'afterimage-strike'   // Tracker: Blur opacity momentarily, teleport-dash behind the target
  | 'command-cast'        // Tactician: Raise arm, pulse neon strategic strategic runes
  | 'vanish-shadow-strike'// Hidden Shadow: Vanish into abyssal mist, reappear directly in front of target
  | 'curse-cast'          // Hidden Curse: Infuse sinister blood-red seal on the target, brief hover vibration
  | 'rift-step'           // Hidden Rift: Distort space, cyan-purple warp step directly adjacent to target
  | 'hostile-heavy'       // Boss: Heavy screen-rumbling stampede/crush attack forward
  | 'hostile-normal'      // Monster: Direct aggressive dark dash/swipe forward
  | 'default'

export type TargetReactionType =
  | 'quick-hit-shake'     // Light rapid horizontal buzz vibration
  | 'heavy-recoil'        // Massive recoil knockback: pushed back heavily along X-axis with high rotation tilt
  | 'magic-hit-shake'     // Intense magical vibration with bright flash overlay
  | 'guard-block'         // Minimal knockback, solid static frame block feedback
  | 'fast-stagger'        // Short stagger offset back, quick recovery
  | 'buff-debuff-pulse'   // Gentle rhythmic ripple aura response
  | 'dark-flash-shake'    // Screen dimmed flash with extreme heavy recoil tilt
  | 'curse-flicker-stagger'// Blood-red flicker overlay with continuous corrosion shake
  | 'warp-shake'          // Ripple-distortion warp vibration
  | 'boss-heavy-recoil'   // Very short but extremely heavy structural recoil shake
  | 'none'

export type ImpactStyle =
  | 'slash-impact'
  | 'blunt-impact'
  | 'magic-explosion'
  | 'shield-flare'
  | 'quick-cut'
  | 'tactical-marker'
  | 'shadow-cut'
  | 'curse-seal'
  | 'rift-crack'
  | 'default'

export type DamagePopupStyle =
  | 'sharp'
  | 'heavy'
  | 'magic'
  | 'guard'
  | 'quick-sharp'
  | 'tactical'
  | 'shadow'
  | 'curse'
  | 'rift'
  | 'default'

export interface SkillMotionPreset {
  id: string
  actorMotion: ActorMotionType
  targetReaction: TargetReactionType
  impactStyle: ImpactStyle
  damagePopupStyle: DamagePopupStyle
  vfxTone?: string
  durationMs?: number
}

// 9-Way Class Lineage & Special Actor Preset Definitions
export const SKILL_MOTION_PRESETS: Record<string, SkillMotionPreset> = {
  swordsman: {
    id: 'swordsman',
    actorMotion: 'dash-slash',
    targetReaction: 'quick-hit-shake',
    impactStyle: 'slash-impact',
    damagePopupStyle: 'sharp',
    vfxTone: '#22d3ee', // Cyan neon
    durationMs: 380,
  },
  warrior: {
    id: 'warrior',
    actorMotion: 'heavy-lunge',
    targetReaction: 'heavy-recoil',
    impactStyle: 'blunt-impact',
    damagePopupStyle: 'heavy',
    vfxTone: '#f59e0b', // Amber-orange
    durationMs: 460,
  },
  mage: {
    id: 'mage',
    actorMotion: 'cast-hold',
    targetReaction: 'magic-hit-shake',
    impactStyle: 'magic-explosion',
    damagePopupStyle: 'magic',
    vfxTone: '#818cf8', // Indigo
    durationMs: 500,
  },
  guardian: {
    id: 'guardian',
    actorMotion: 'guard-raise',
    targetReaction: 'guard-block',
    impactStyle: 'shield-flare',
    damagePopupStyle: 'guard',
    vfxTone: '#10b981', // Emerald
    durationMs: 400,
  },
  tracker: {
    id: 'tracker',
    actorMotion: 'afterimage-strike',
    targetReaction: 'fast-stagger',
    impactStyle: 'quick-cut',
    damagePopupStyle: 'quick-sharp',
    vfxTone: '#34d399', // Mint green
    durationMs: 350,
  },
  tactician: {
    id: 'tactician',
    actorMotion: 'command-cast',
    targetReaction: 'buff-debuff-pulse',
    impactStyle: 'tactical-marker',
    damagePopupStyle: 'tactical',
    vfxTone: '#f59e0b', // Strategic Gold
    durationMs: 420,
  },
  'hidden-shadow': {
    id: 'hidden-shadow',
    actorMotion: 'vanish-shadow-strike',
    targetReaction: 'dark-flash-shake',
    impactStyle: 'shadow-cut',
    damagePopupStyle: 'shadow',
    vfxTone: '#a855f7', // Deep purple
    durationMs: 480,
  },
  'hidden-curse': {
    id: 'hidden-curse',
    actorMotion: 'curse-cast',
    targetReaction: 'curse-flicker-stagger',
    impactStyle: 'curse-seal',
    damagePopupStyle: 'curse',
    vfxTone: '#ef4444', // Crimson red
    durationMs: 450,
  },
  'hidden-rift': {
    id: 'hidden-rift',
    actorMotion: 'rift-step',
    targetReaction: 'warp-shake',
    impactStyle: 'rift-crack',
    damagePopupStyle: 'rift',
    vfxTone: '#6366f1', // Cyan-indigo distortion
    durationMs: 440,
  },
  'boss-action': {
    id: 'boss-action',
    actorMotion: 'hostile-heavy',
    targetReaction: 'heavy-recoil',
    impactStyle: 'blunt-impact',
    damagePopupStyle: 'heavy',
    vfxTone: '#f43f5e', // Destructive rose
    durationMs: 520,
  },
  'monster-action': {
    id: 'monster-action',
    actorMotion: 'hostile-normal',
    targetReaction: 'quick-hit-shake',
    impactStyle: 'default',
    damagePopupStyle: 'default',
    vfxTone: '#ffffff',
    durationMs: 380,
  },
  default: {
    id: 'default',
    actorMotion: 'default',
    targetReaction: 'quick-hit-shake',
    impactStyle: 'default',
    damagePopupStyle: 'default',
    vfxTone: '#ffffff',
    durationMs: 380,
  },
}

/**
 * Resolves the appropriate SkillMotionPreset based on acting context
 */
export function getSkillMotionPreset(
  role?: string,
  isBoss?: boolean,
  kind?: string
): SkillMotionPreset {
  // 1. Check Special Boss Actions
  if (isBoss) {
    return SKILL_MOTION_PRESETS['boss-action']
  }

  // 2. Check Action Kind exceptions (Heal & Guard have special profiles)
  if (kind === 'heal') {
    return SKILL_MOTION_PRESETS['tactician'] // Healing actions map strategically
  }
  if (kind === 'guard') {
    return SKILL_MOTION_PRESETS['guardian']  // Blocking actions map defensively
  }

  // 3. Resolve role-based preset IDs
  if (!role) {
    // If enemy monster unit has no explicit role
    return SKILL_MOTION_PRESETS['monster-action']
  }
  
  const id = role.toLowerCase()

  if (id.includes('shadow') || id.includes('abyss-summoner') || id.includes('phantom-general') || id.includes('disciple') || id.includes('lord')) {
    return SKILL_MOTION_PRESETS['hidden-shadow']
  }
  if (id.includes('curse')) {
    return SKILL_MOTION_PRESETS['hidden-curse']
  }
  if (id.includes('rift') || id.includes('dimension')) {
    return SKILL_MOTION_PRESETS['hidden-rift']
  }
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
    return SKILL_MOTION_PRESETS['swordsman']
  }
  if (
    id === 'warrior' ||
    id.includes('berserker') ||
    id.includes('slayer') ||
    id.includes('dragon-knight') ||
    id.includes('immortal')
  ) {
    return SKILL_MOTION_PRESETS['warrior']
  }
  if (
    id.includes('mage') ||
    id.includes('chronomancer') ||
    id.includes('time-governor') ||
    id.includes('entropy') ||
    id.includes('wizard')
  ) {
    return SKILL_MOTION_PRESETS['mage']
  }
  if (
    id.includes('guardian') ||
    id.includes('paladin') ||
    id.includes('shield') ||
    id.includes('holy-redeemer') ||
    id.includes('judgment-knight')
  ) {
    return SKILL_MOTION_PRESETS['guardian']
  }
  if (
    id.includes('scout') ||
    id.includes('stalker') ||
    id.includes('tracker') ||
    id.includes('assassin') ||
    id.includes('phantom-stalker') ||
    id.includes('abyss-emperor')
  ) {
    return SKILL_MOTION_PRESETS['tracker']
  }
  if (
    id.includes('tactician') ||
    id.includes('strategist') ||
    id.includes('alchemist') ||
    id.includes('chimera') ||
    id.includes('weaver') ||
    id.includes('orchestrator')
  ) {
    return SKILL_MOTION_PRESETS['tactician']
  }

  // Fallback default
  return SKILL_MOTION_PRESETS['default']
}
