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
  | 'shadow-silence'
  | 'shadow-rend'
  | 'shadow-guard'
  | 'shadow-mend'
  | 'shadow-scan'
  | 'shadow-void'
  | 'default'

export interface SkillMotionPreset {
  id: string
  actorMotion: ActorMotionType
  targetReaction: TargetReactionType
  impactStyle: ImpactStyle
  damagePopupStyle: DamagePopupStyle
  vfxTone?: string
  durationMs?: number
  intensity?: 'basic' | 'skill' | 'signature'
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
    durationMs: 480,
  },
  mage: {
    id: 'mage',
    actorMotion: 'cast-hold',
    targetReaction: 'magic-hit-shake',
    impactStyle: 'magic-explosion',
    damagePopupStyle: 'magic',
    vfxTone: '#818cf8', // Indigo
    durationMs: 720,
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
    durationMs: 600,
  },
  'hidden-shadow': {
    id: 'hidden-shadow',
    actorMotion: 'vanish-shadow-strike',
    targetReaction: 'dark-flash-shake',
    impactStyle: 'shadow-cut',
    damagePopupStyle: 'shadow',
    vfxTone: '#a855f7', // Deep purple
    durationMs: 550,
  },
  'hidden-curse': {
    id: 'hidden-curse',
    actorMotion: 'curse-cast',
    targetReaction: 'curse-flicker-stagger',
    impactStyle: 'curse-seal',
    damagePopupStyle: 'curse',
    vfxTone: '#ef4444', // Crimson red
    durationMs: 680,
  },
  'hidden-rift': {
    id: 'hidden-rift',
    actorMotion: 'rift-step',
    targetReaction: 'warp-shake',
    impactStyle: 'rift-crack',
    damagePopupStyle: 'rift',
    vfxTone: '#6366f1', // Cyan-indigo distortion
    durationMs: 640,
  },
  'shadow-silence': {
    id: 'shadow-silence',
    actorMotion: 'cast-hold',
    targetReaction: 'magic-hit-shake',
    impactStyle: 'magic-explosion',
    damagePopupStyle: 'shadow-silence',
    vfxTone: '#06b6d4', // Muted Cyan
    durationMs: 600,
  },
  'shadow-rend': {
    id: 'shadow-rend',
    actorMotion: 'dash-slash',
    targetReaction: 'quick-hit-shake',
    impactStyle: 'quick-cut',
    damagePopupStyle: 'shadow-rend',
    vfxTone: '#f43f5e', // Rose Red
    durationMs: 400,
  },
  'shadow-guard': {
    id: 'shadow-guard',
    actorMotion: 'guard-raise',
    targetReaction: 'guard-block',
    impactStyle: 'shield-flare',
    damagePopupStyle: 'shadow-guard',
    vfxTone: '#06b6d4', // Cyan Shield Flare
    durationMs: 450,
  },
  'shadow-mend': {
    id: 'shadow-mend',
    actorMotion: 'command-cast',
    targetReaction: 'buff-debuff-pulse',
    impactStyle: 'tactical-marker',
    damagePopupStyle: 'shadow-mend',
    vfxTone: '#10b981', // Emerald Green
    durationMs: 500,
  },
  'shadow-scan': {
    id: 'shadow-scan',
    actorMotion: 'command-cast',
    targetReaction: 'buff-debuff-pulse',
    impactStyle: 'tactical-marker',
    damagePopupStyle: 'shadow-scan',
    vfxTone: '#14b8a6', // Teal weakpoint glyph
    durationMs: 500,
  },
  'shadow-void': {
    id: 'shadow-void',
    actorMotion: 'rift-step',
    targetReaction: 'warp-shake',
    impactStyle: 'rift-crack',
    damagePopupStyle: 'shadow-void',
    vfxTone: '#6366f1', // Purple-cyan crack
    durationMs: 600,
  },
  'shadow-execute': {
    id: 'shadow-execute',
    actorMotion: 'vanish-shadow-strike',
    targetReaction: 'dark-flash-shake',
    impactStyle: 'shadow-cut',
    damagePopupStyle: 'shadow',
    vfxTone: '#a855f7', // Deep purple shadow cut
    durationMs: 550,
  },
  'boss-action': {
    id: 'boss-action',
    actorMotion: 'hostile-heavy',
    targetReaction: 'heavy-recoil',
    impactStyle: 'blunt-impact',
    damagePopupStyle: 'heavy',
    vfxTone: '#f43f5e', // Destructive rose
    durationMs: 560,
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
  kind?: string,
  actionId?: string
): SkillMotionPreset & { intensity: 'basic' | 'skill' | 'signature' } {
  // 0. Determine presentation intensity (Default to basic for normal attacks)
  let intensity: 'basic' | 'skill' | 'signature' = 'signature'
  if (actionId === 'basic-attack') {
    intensity = 'basic'
  } else if (actionId === 'basic-focus-slash') {
    intensity = 'skill'
  } else if (kind === 'attack' && !actionId) {
    intensity = 'basic' // fallback for normal flat attacks
  }

  let basePreset: SkillMotionPreset

  // 1. Check Special Boss Actions
  if (isBoss) {
    basePreset = SKILL_MOTION_PRESETS['boss-action']
  }
  // 2. Check Action Kind exceptions (Heal & Guard have special profiles)
  else if (kind === 'heal') {
    basePreset = SKILL_MOTION_PRESETS['tactician'] // Healing actions map strategically
  }
  else if (kind === 'guard') {
    basePreset = SKILL_MOTION_PRESETS['guardian']  // Blocking actions map defensively
  }
  // 3. Resolve Shadow-specific Skill/Passive presets if actionId matches shadow identifiers
  else if (actionId && (actionId.includes(':skill:') || actionId.includes(':passive:'))) {
    const actId = actionId.toLowerCase()
    if (actId.includes('silence') || actId.includes('suppress')) {
      basePreset = SKILL_MOTION_PRESETS['shadow-silence']
    } else if (actId.includes('cleave') || actId.includes('slash') || actId.includes('strike') || actId.includes('chase') || actId.includes('hit')) {
      basePreset = SKILL_MOTION_PRESETS['shadow-rend']
    } else if (actId.includes('execute') || actId.includes('shadow') || actId.includes('abyss')) {
      basePreset = SKILL_MOTION_PRESETS['shadow-execute']
    } else if (actId.includes('barrier') || actId.includes('guard') || actId.includes('intercept') || actId.includes('protect')) {
      basePreset = SKILL_MOTION_PRESETS['shadow-guard']
    } else if (actId.includes('mend') || actId.includes('pulse') || actId.includes('heal') || actId.includes('aura')) {
      basePreset = SKILL_MOTION_PRESETS['shadow-mend']
    } else if (actId.includes('mark') || actId.includes('scan') || actId.includes('weak') || actId.includes('index') || actId.includes('debuff') || actId.includes('read')) {
      basePreset = SKILL_MOTION_PRESETS['shadow-scan']
    } else if (actId.includes('rift') || actId.includes('void') || actId.includes('crack') || actId.includes('dimension')) {
      basePreset = SKILL_MOTION_PRESETS['shadow-void']
    } else {
      // Fallback based on shadow role if any
      const r = role ? role.toLowerCase() : ''
      if (r === 'assault' || r === 'hunter') {
        basePreset = SKILL_MOTION_PRESETS['shadow-rend']
      } else if (r === 'guard') {
        basePreset = SKILL_MOTION_PRESETS['shadow-guard']
      } else if (r === 'support') {
        basePreset = SKILL_MOTION_PRESETS['shadow-mend']
      } else if (r === 'analyst' || r === 'scout') {
        basePreset = SKILL_MOTION_PRESETS['shadow-scan']
      } else {
        basePreset = SKILL_MOTION_PRESETS['shadow-rend']
      }
    }
  }
  // 4. Resolve role-based preset IDs
  else if (!role) {
    // If enemy monster unit has no explicit role
    basePreset = SKILL_MOTION_PRESETS['monster-action']
  } else {
    const id = role.toLowerCase()

    if (id.includes('shadow') || id.includes('abyss-summoner') || id.includes('phantom-general') || id.includes('disciple') || id.includes('lord')) {
      basePreset = SKILL_MOTION_PRESETS['hidden-shadow']
    }
    else if (id.includes('curse')) {
      basePreset = SKILL_MOTION_PRESETS['hidden-curse']
    }
    else if (id.includes('rift') || id.includes('dimension')) {
      basePreset = SKILL_MOTION_PRESETS['hidden-rift']
    }
    else if (
      id.includes('swordsman') ||
      id.includes('swordsmaster') ||
      id.includes('sword-saint') ||
      id.includes('illusory-swordmaster') ||
      id.includes('speed-striker') ||
      id.includes('spellsword') ||
      id.includes('blade') ||
      id.includes('sword')
    ) {
      basePreset = SKILL_MOTION_PRESETS['swordsman']
    }
    else if (
      id === 'warrior' ||
      id.includes('berserker') ||
      id.includes('slayer') ||
      id.includes('dragon-knight') ||
      id.includes('immortal')
    ) {
      basePreset = SKILL_MOTION_PRESETS['warrior']
    }
    else if (
      id.includes('mage') ||
      id.includes('chronomancer') ||
      id.includes('time-governor') ||
      id.includes('entropy') ||
      id.includes('wizard')
    ) {
      basePreset = SKILL_MOTION_PRESETS['mage']
    }
    else if (
      id.includes('guardian') ||
      id.includes('paladin') ||
      id.includes('shield') ||
      id.includes('holy-redeemer') ||
      id.includes('judgment-knight')
    ) {
      basePreset = SKILL_MOTION_PRESETS['guardian']
    }
    else if (
      id.includes('scout') ||
      id.includes('stalker') ||
      id.includes('tracker') ||
      id.includes('assassin') ||
      id.includes('phantom-stalker') ||
      id.includes('abyss-emperor')
    ) {
      basePreset = SKILL_MOTION_PRESETS['tracker']
    }
    else if (
      id.includes('tactician') ||
      id.includes('strategist') ||
      id.includes('alchemist') ||
      id.includes('chimera') ||
      id.includes('weaver') ||
      id.includes('orchestrator')
    ) {
      basePreset = SKILL_MOTION_PRESETS['tactician']
    } else {
      basePreset = SKILL_MOTION_PRESETS['default']
    }
  }

  return {
    ...basePreset,
    intensity,
  }
}
