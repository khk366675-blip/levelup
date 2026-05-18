import clsx from 'clsx'
import type { CSSProperties } from 'react'
import type { OwnedShadow, ShadowDefinition, ShadowRarity, ShadowRole } from '../../lib/types'
import { getShadowDefinition } from '../../lib/shadows'

type PortraitSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type ShadowPortraitProps = {
  shadow?: OwnedShadow
  definition?: ShadowDefinition
  size?: PortraitSize
  active?: boolean
  highlighted?: boolean
  evolutionReady?: boolean
  hidden?: boolean
  className?: string
}

const rarityPalette: Record<ShadowRarity, { frame: string; glow: string; mist: string; text: string }> = {
  common: { frame: '#94a3b8', glow: 'rgba(148, 163, 184, 0.38)', mist: 'rgba(148, 163, 184, 0.14)', text: 'text-slate-200' },
  uncommon: { frame: '#34d399', glow: 'rgba(52, 211, 153, 0.45)', mist: 'rgba(52, 211, 153, 0.13)', text: 'text-emerald-200' },
  rare: { frame: '#22d3ee', glow: 'rgba(34, 211, 238, 0.5)', mist: 'rgba(34, 211, 238, 0.14)', text: 'text-cyan-200' },
  epic: { frame: '#a78bfa', glow: 'rgba(167, 139, 250, 0.58)', mist: 'rgba(167, 139, 250, 0.16)', text: 'text-purple-200' },
  legendary: { frame: '#f59e0b', glow: 'rgba(245, 158, 11, 0.7)', mist: 'rgba(245, 158, 11, 0.16)', text: 'text-amber-200' },
}

const roleLabel: Record<ShadowRole, string> = {
  assault: 'ASSAULT',
  guard: 'GUARD',
  scout: 'SCOUT',
  analyst: 'ANALYST',
  support: 'SUPPORT',
  hunter: 'HUNTER',
}

const sizeClass: Record<PortraitSize, string> = {
  xs: 'h-14',
  sm: 'h-20',
  md: 'h-32',
  lg: 'h-44',
  xl: 'h-56',
}

type PortraitProfile = {
  silhouette: string
  weapon: string
  head: string
  shoulders: string
  aura: string
  eyes: string
  rune: string
  accessory: string
  posture: string
  motif: string
  intensity: number
}

const hashString = (value: string): number => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

const fallbackSilhouette = (role: ShadowRole): string => {
  if (role === 'guard') return 'round-shield'
  if (role === 'scout') return 'scout-knife'
  if (role === 'analyst') return 'scroll'
  if (role === 'support') return 'banner'
  if (role === 'hunter') return 'hound'
  return 'blade'
}

const fallbackProfile = (role: ShadowRole, rarity: ShadowRarity, named: boolean, evolved: boolean): PortraitProfile => {
  const silhouette = fallbackSilhouette(role)
  return {
    silhouette,
    weapon: role === 'guard' ? 'short-spear' : role === 'scout' ? 'twin-daggers' : role === 'analyst' ? 'stylus' : role === 'support' ? 'command-staff' : role === 'hunter' ? 'fangs' : 'longsword',
    head: role === 'guard' ? 'low-helm' : role === 'scout' ? 'hood' : role === 'analyst' ? 'thin-hood' : role === 'support' ? 'keeper-hood' : role === 'hunter' ? 'fangs' : 'helm',
    shoulders: role === 'guard' ? 'stout' : role === 'analyst' ? 'narrow' : role === 'support' ? 'command-mantle' : role === 'hunter' ? 'low' : 'pauldrons',
    aura: named ? 'named-corona' : evolved ? 'rune-orbit' : role,
    eyes: named ? 'star-slit' : rarity === 'legendary' || evolved ? 'burning-slit' : role === 'hunter' ? 'ember-points' : 'paired',
    rune: named ? 'ornate' : evolved ? 'evolved' : 'plain',
    accessory: named ? 'named-sigil' : role === 'analyst' ? 'scrolls' : role === 'hunter' ? 'fangs' : 'none',
    posture: role === 'guard' ? 'crouched-guard' : role === 'hunter' ? 'pounce' : role === 'scout' ? 'leaning' : role === 'support' ? 'commanding' : 'braced',
    motif: named ? 'rift-star' : role === 'guard' ? 'shield-rune' : role === 'analyst' ? 'paper-runes' : role === 'hunter' ? 'claw-marks' : 'war-rune',
    intensity: named ? 1.24 : evolved ? 1.14 : 0.92,
  }
}

const resolveProfile = (definition: ShadowDefinition | undefined, role: ShadowRole, rarity: ShadowRarity, named: boolean, evolved: boolean): PortraitProfile => {
  const fallback = fallbackProfile(role, rarity, named, evolved)
  return {
    silhouette: definition?.silhouetteType ?? fallback.silhouette,
    weapon: definition?.weaponShape ?? fallback.weapon,
    head: definition?.headShape ?? fallback.head,
    shoulders: definition?.shoulderShape ?? fallback.shoulders,
    aura: definition?.auraType ?? fallback.aura,
    eyes: definition?.eyeStyle ?? fallback.eyes,
    rune: definition?.runeStyle ?? fallback.rune,
    accessory: definition?.accessory ?? fallback.accessory,
    posture: definition?.posture ?? fallback.posture,
    motif: definition?.backgroundMotif ?? fallback.motif,
    intensity: definition?.visualIntensity ?? fallback.intensity,
  }
}

const resolveDefinition = (shadow?: OwnedShadow, definition?: ShadowDefinition): ShadowDefinition | undefined =>
  definition ?? (shadow ? getShadowDefinition(shadow.definitionId) : undefined)

const renderBackgroundMotif = (profile: PortraitProfile, accent: string, seed: number, named: boolean, evolved: boolean) => {
  const opacity = Math.min(0.7, 0.22 + profile.intensity * 0.16)
  if (profile.motif === 'archive-circle') {
    return (
      <g opacity={opacity}>
        <circle cx="58" cy="64" r="35" fill="none" stroke={accent} strokeWidth="1.2" strokeDasharray="3 5" />
        <circle cx="58" cy="64" r="24" fill="none" stroke={accent} strokeWidth="0.8" strokeDasharray="8 6" />
        {[0, 1, 2, 3].map(index => (
          <text key={index} x={52 + Math.cos(index * Math.PI / 2) * 29} y={67 + Math.sin(index * Math.PI / 2) * 29} fill={accent} fontSize="8">*</text>
        ))}
      </g>
    )
  }
  if (profile.motif === 'bastion') {
    return (
      <g opacity={opacity}>
        <path d="M22 102 L22 69 L33 69 L33 61 L45 61 L45 69 L56 69 L56 61 L68 61 L68 69 L80 69 L80 61 L93 61 L93 102" fill="none" stroke={accent} strokeWidth="1.3" />
        <path d="M31 102 L31 76 M58 102 L58 72 M86 102 L86 76" stroke={accent} strokeWidth="1" />
      </g>
    )
  }
  if (profile.motif === 'claw-marks') {
    return (
      <g opacity={opacity}>
        <path d="M30 37 L20 69 M47 31 L37 73 M84 34 L96 73" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M72 38 L81 74" stroke={accent} strokeWidth="1" strokeLinecap="round" opacity="0.65" />
      </g>
    )
  }
  if (profile.motif === 'vault-sigil') {
    return (
      <g opacity={opacity}>
        <path d="M58 26 C76 36 90 45 91 64 C89 83 74 95 58 103 C42 95 27 83 25 64 C26 45 40 36 58 26 Z" fill="none" stroke={accent} strokeWidth="1.2" />
        <circle cx="58" cy="64" r="8" fill="none" stroke={accent} strokeWidth="1" />
        <path d="M58 56 L58 72 M50 64 L66 64" stroke={accent} strokeWidth="1" />
      </g>
    )
  }
  if (profile.motif === 'market-lines' || profile.motif === 'scan-lines') {
    return (
      <g opacity={opacity}>
        {[0, 1, 2].map(index => (
          <path key={index} d={`M24 ${44 + index * 17} C42 ${35 + index * 15} 63 ${53 + index * 8} 92 ${39 + index * 17}`} fill="none" stroke={accent} strokeWidth="1" strokeDasharray="5 5" />
        ))}
      </g>
    )
  }
  if (profile.motif === 'execution-sigil') {
    return (
      <g opacity={opacity}>
        <path d="M58 20 L76 64 L58 108 L40 64 Z" fill="none" stroke={accent} strokeWidth="1.2" />
        <path d="M34 64 L82 64 M58 25 L58 103" stroke={accent} strokeWidth="0.9" />
      </g>
    )
  }
  return (
    <g opacity={opacity}>
      <path d="M58 24 L88 42 L88 83 L58 102 L28 83 L28 42 Z" fill="none" stroke={accent} strokeWidth={named || evolved ? 1.3 : 0.9} strokeDasharray={named ? '6 4' : '4 8'} transform={`rotate(${(seed % 24) - 12} 58 64)`} />
      {named && <path d="M58 18 L64 31 L78 32 L68 42 L71 56 L58 49 L45 56 L48 42 L38 32 L52 31 Z" fill={accent} opacity="0.16" />}
    </g>
  )
}

const renderAura = (profile: PortraitProfile, accent: string, named: boolean, evolved: boolean) => {
  const opacity = Math.min(0.82, 0.22 + profile.intensity * 0.18)
  if (profile.aura === 'barrier' || profile.aura === 'guard-haze') {
    return (
      <g opacity={opacity}>
        <path d="M58 20 C86 32 98 50 96 75 C92 98 74 112 58 119 C42 112 24 98 20 75 C18 50 30 32 58 20 Z" fill="none" stroke={accent} strokeWidth={profile.aura === 'barrier' ? 2.2 : 1.4} />
      </g>
    )
  }
  if (profile.aura === 'rune-orbit' || profile.aura === 'paper-orbit') {
    return (
      <g opacity={opacity}>
        <ellipse cx="58" cy="65" rx="42" ry="20" fill="none" stroke={accent} strokeWidth="1.1" strokeDasharray="4 6" transform="rotate(-18 58 65)" />
        <ellipse cx="58" cy="65" rx="36" ry="17" fill="none" stroke={accent} strokeWidth="0.9" strokeDasharray="8 7" transform="rotate(22 58 65)" />
      </g>
    )
  }
  if (profile.aura === 'speed-lines') {
    return (
      <g opacity={opacity}>
        <path d="M19 39 L53 34 M13 62 L47 56 M18 86 L55 79" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M64 35 L100 28 M68 84 L101 77" stroke={accent} strokeWidth="1" strokeLinecap="round" opacity="0.65" />
      </g>
    )
  }
  if (profile.aura === 'essence-sparks') {
    return (
      <g opacity={opacity}>
        {[0, 1, 2, 3, 4].map(index => (
          <path key={index} d={`M${26 + index * 15} ${33 + ((index * 11) % 42)} l3 5 l5 2 l-5 2 l-3 5 l-3 -5 l-5 -2 l5 -2 Z`} fill={accent} opacity={0.22 + index * 0.08} />
        ))}
      </g>
    )
  }
  if (profile.aura === 'achievement-halo' || profile.aura === 'soft-halo' || profile.aura === 'named-corona' || named) {
    return (
      <g opacity={opacity}>
        <path d="M58 15 C77 20 92 37 96 58 C92 40 77 30 58 29 C39 30 24 40 20 58 C24 37 39 20 58 15 Z" fill={accent} opacity={profile.aura === 'soft-halo' ? 0.1 : 0.18} />
        <circle cx="58" cy="64" r={evolved ? 45 : 41} fill="none" stroke={accent} strokeWidth={profile.aura === 'achievement-halo' ? 1.6 : 1.1} strokeDasharray="10 8" />
      </g>
    )
  }
  return null
}

const renderEyeOverlay = (profile: PortraitProfile, accent: string, role: ShadowRole) => {
  if (role === 'hunter' || profile.silhouette === 'rat' || profile.silhouette.includes('beast') || profile.silhouette.includes('hound')) {
    const y = profile.silhouette === 'rat' ? 88 : 70
    return (
      <g>
        <path d={`M73 ${y} L79 ${y - 1}`} stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
        <path d={`M86 ${y} L92 ${y - 1}`} stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
      </g>
    )
  }
  if (profile.eyes === 'visor') {
    return <path d="M49 36 C55 34 62 34 68 36" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
  }
  if (profile.eyes === 'burning-slit' || profile.eyes === 'predator-slit') {
    return (
      <g>
        <path d="M50 36 L56 35" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M61 35 L68 36" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
      </g>
    )
  }
  if (profile.eyes === 'oracle' || profile.eyes === 'star-slit') {
    return (
      <g>
        <circle cx="53" cy="36" r="2.6" fill={accent} />
        <circle cx="64" cy="36" r="2.6" fill={accent} />
        <path d="M58 26 L61 32 L68 33 L63 38 L64 45 L58 41 L52 45 L53 38 L48 33 L55 32 Z" fill={accent} opacity="0.24" />
      </g>
    )
  }
  return null
}

const renderAdvancedProps = (profile: PortraitProfile, role: ShadowRole, accent: string, seed: number, evolved: boolean, named: boolean) => {
  const strong = named || evolved
  return (
    <g opacity={0.86}>
      {(profile.shoulders === 'heavy-pauldrons' || profile.shoulders === 'spiked-pauldrons') && (
        <>
          <path d="M34 55 C24 58 19 66 18 78 C29 72 39 69 47 68 Z" fill={accent} opacity="0.26" />
          <path d="M82 55 C92 58 97 66 98 78 C87 72 77 69 69 68 Z" fill={accent} opacity="0.26" />
          {profile.shoulders === 'spiked-pauldrons' && <path d="M23 58 L17 44 L36 56 M93 58 L99 44 L80 56" fill={accent} opacity="0.22" />}
        </>
      )}
      {(profile.head.includes('horned') || profile.head.includes('raven') || profile.head.includes('shark')) && (
        <path
          d={profile.head.includes('horned') ? 'M47 27 L34 17 L43 36 M69 27 L82 17 L73 36' : profile.head.includes('raven') ? 'M47 27 L35 22 L45 38 M69 27 L82 22 L71 38' : 'M47 30 L33 27 L45 39 M69 30 L83 27 L71 39'}
          fill={accent}
          opacity="0.26"
        />
      )}
      {(profile.weapon.includes('greatsword') || profile.weapon.includes('execution') || profile.weapon.includes('steel')) && (
        <path d="M84 7 L94 10 L77 110 L67 113 Z" fill="url(#steel)" stroke={accent} strokeWidth={strong ? 1.5 : 0.7} opacity="0.86" />
      )}
      {(profile.weapon.includes('dagger') || profile.weapon === 'twin-daggers' || profile.weapon.includes('blade')) && role === 'scout' && (
        <>
          <path d="M27 55 L13 82 L21 84 L35 58 Z" fill="url(#steel)" stroke={accent} strokeWidth="0.7" />
          <path d="M89 55 L103 82 L95 84 L81 58 Z" fill="url(#steel)" stroke={accent} strokeWidth="0.7" />
        </>
      )}
      {(profile.weapon.includes('spear') || profile.weapon.includes('staff')) && (
        <>
          <path d="M28 24 L28 109" stroke={accent} strokeWidth={profile.weapon.includes('staff') ? 3 : 2.2} strokeLinecap="round" opacity="0.78" />
          <path d={profile.weapon.includes('spear') ? 'M28 13 L34 25 L28 31 L22 25 Z' : 'M28 14 C38 19 38 31 28 36 C18 31 18 19 28 14 Z'} fill={accent} opacity="0.44" />
        </>
      )}
      {(profile.accessory.includes('pages') || profile.accessory.includes('tome') || profile.accessory.includes('ledger') || profile.accessory.includes('scroll')) && (
        <>
          <path d="M20 47 C30 42 39 45 45 53 L42 68 C33 62 27 60 19 64 Z" fill="url(#book)" stroke={accent} strokeWidth="0.8" opacity="0.78" />
          <path d="M73 45 C83 40 92 43 98 51 L94 66 C86 60 80 58 72 62 Z" fill="url(#book)" stroke={accent} strokeWidth="0.8" opacity="0.7" />
          {strong && <path d="M34 24 C43 19 51 22 55 29 L52 40 C45 35 39 34 32 37 Z" fill="url(#book)" stroke={accent} strokeWidth="0.7" opacity="0.62" />}
        </>
      )}
      {(profile.accessory.includes('chain') || profile.accessory.includes('trophy')) && (
        <>
          <path d="M27 74 C45 86 68 88 90 76" stroke={accent} strokeWidth="3" strokeDasharray="4 4" fill="none" opacity="0.72" />
          <circle cx="58" cy="88" r="5" fill="none" stroke={accent} strokeWidth="2" />
          <path d="M58 81 L63 88 L58 96 L53 88 Z" fill={accent} opacity="0.42" />
        </>
      )}
      {(profile.accessory.includes('coin') || profile.accessory.includes('vault')) && (
        <circle cx={29 + (seed % 10)} cy="45" r="5" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.72" />
      )}
      {(profile.accessory.includes('scarf') || profile.accessory.includes('mantle')) && (
        <path d="M45 47 C30 52 25 67 25 86 C38 74 47 66 58 58 C70 66 79 74 91 86 C91 67 86 52 71 47 C64 54 52 54 45 47 Z" fill={accent} opacity="0.14" />
      )}
      {renderEyeOverlay(profile, accent, role)}
    </g>
  )
}

const renderSoldier = (silhouette: string, accent: string, seed: number, evolved: boolean) => {
  const mantle = seed % 2 === 0
  const bladeWide = silhouette === 'greatsword'
  const bodyScale = evolved ? 1.08 : 1
  return (
    <g transform={`translate(0 ${evolved ? -3 : 0}) scale(${bodyScale}) translate(${evolved ? -4 : 0} ${evolved ? -4 : 0})`}>
      {mantle && <path d="M47 37 C30 51 28 83 34 104 C43 98 78 99 88 104 C93 76 83 51 67 37 Z" fill="url(#cloak)" opacity="0.72" />}
      <path d="M58 20 C67 20 72 27 72 36 C72 46 66 53 58 53 C50 53 44 46 44 36 C44 27 49 20 58 20 Z" fill="url(#body)" />
      <path d="M42 57 C49 50 68 50 76 57 L84 105 C69 113 47 113 32 105 Z" fill="url(#body)" />
      <path d="M42 57 C51 66 66 66 76 57" fill="none" stroke={accent} strokeWidth="2" opacity="0.55" />
      <path d={bladeWide ? 'M82 15 L91 17 L78 103 L70 105 Z' : 'M80 25 L86 26 L77 101 L72 102 Z'} fill="url(#steel)" opacity="0.9" />
      <path d="M36 69 L20 88" stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.72" />
      <path d="M79 68 L97 86" stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.72" />
      <circle cx="54" cy="36" r="2" fill={accent} />
      <circle cx="63" cy="36" r="2" fill={accent} />
    </g>
  )
}

const renderGuard = (silhouette: string, accent: string, evolved: boolean) => (
  <g transform={`translate(0 ${evolved ? -4 : 0})`}>
    <path d="M58 18 C68 18 75 26 75 37 C75 48 68 56 58 56 C48 56 41 48 41 37 C41 26 48 18 58 18 Z" fill="url(#body)" />
    <path d={silhouette === 'tower-shield'
      ? 'M58 49 C75 53 91 60 91 60 C91 93 77 112 58 118 C39 112 25 93 25 60 C25 60 41 53 58 49 Z'
      : 'M58 52 C74 52 88 65 88 82 C88 101 74 113 58 117 C42 113 28 101 28 82 C28 65 42 52 58 52 Z'}
      fill="url(#shield)"
      stroke={accent}
      strokeWidth={evolved ? 3 : 2}
    />
    <path d="M58 58 L58 109 M36 79 C48 85 68 85 80 79" stroke="rgba(255,255,255,0.45)" strokeWidth="2" fill="none" />
    <circle cx="53" cy="37" r="2" fill={accent} />
    <circle cx="63" cy="37" r="2" fill={accent} />
  </g>
)

const renderAnalyst = (silhouette: string, accent: string, seed: number, evolved: boolean) => (
  <g transform={`translate(0 ${evolved ? -5 : 0})`}>
    <path d="M58 19 C67 19 73 27 73 37 C73 47 67 55 58 55 C49 55 43 47 43 37 C43 27 49 19 58 19 Z" fill="url(#body)" />
    <path d="M36 64 C43 54 73 54 80 64 L75 112 C63 119 48 119 37 112 Z" fill="url(#cloak)" opacity="0.82" />
    {silhouette === 'book-runes' ? (
      <>
        <path d="M25 73 C36 68 48 70 58 78 C68 70 80 68 91 73 L91 98 C78 94 67 96 58 104 C49 96 38 94 25 98 Z" fill="url(#book)" stroke={accent} strokeWidth="1.5" />
        <path d="M58 78 L58 104" stroke="rgba(255,255,255,0.45)" />
      </>
    ) : (
      <path d="M27 66 C42 61 54 64 61 72 L57 103 C45 96 36 94 25 98 Z" fill="url(#book)" stroke={accent} strokeWidth="1.5" />
    )}
    {[0, 1, 2].map(index => (
      <text key={index} x={36 + index * 17} y={50 - ((seed + index) % 3) * 7} fill={accent} fontSize="9" opacity="0.65">*</text>
    ))}
    <circle cx="54" cy="37" r="2" fill={accent} />
    <circle cx="63" cy="37" r="2" fill={accent} />
  </g>
)

const renderBeast = (silhouette: string, accent: string, seed: number, evolved: boolean) => {
  const chained = silhouette === 'chained-beast'
  const rat = silhouette === 'rat'
  const y = rat ? 18 : 0
  const scale = rat ? 0.78 : evolved ? 1.07 : 1
  return (
    <g transform={`translate(${rat ? 13 : 0} ${y}) scale(${scale})`}>
      <path d="M25 78 C34 55 68 49 91 66 C98 72 99 86 90 94 C75 107 45 104 30 92 C25 88 23 83 25 78 Z" fill="url(#body)" />
      <path d="M83 62 L94 44 L96 70 Z" fill="url(#body)" />
      <path d="M37 62 L27 48 L25 73 Z" fill="url(#body)" opacity="0.88" />
      <path d="M34 91 L27 113 M54 96 L51 116 M75 94 L82 113" stroke="url(#bodyStroke)" strokeWidth="5" strokeLinecap="round" />
      {!rat && <path d="M89 82 C103 79 108 70 106 58" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />}
      {chained && (
        <>
          <path d="M34 75 C50 83 67 84 85 77" stroke={accent} strokeWidth="3" strokeDasharray="5 5" fill="none" opacity="0.78" />
          <circle cx="63" cy="83" r="4" fill="none" stroke={accent} strokeWidth="2" />
        </>
      )}
      <circle cx="75" cy="70" r="2.5" fill={accent} />
      <circle cx="87" cy="70" r="2.5" fill={accent} />
      <path d={`M${22 + (seed % 4)} 82 C12 82 10 92 20 96`} stroke={accent} strokeWidth="2" fill="none" opacity="0.45" />
    </g>
  )
}

const renderSupport = (silhouette: string, accent: string, seed: number, evolved: boolean) => (
  <g transform={`translate(0 ${evolved ? -4 : 0})`}>
    <path d="M58 19 C67 19 73 27 73 37 C73 47 67 55 58 55 C49 55 43 47 43 37 C43 27 49 19 58 19 Z" fill="url(#body)" />
    <path d="M38 59 C48 52 68 52 78 59 L86 111 C68 118 48 118 30 111 Z" fill="url(#cloak)" />
    <path d="M30 28 L30 102" stroke={accent} strokeWidth="3" strokeLinecap="round" />
    <path d="M32 31 C48 25 56 35 72 29 L72 61 C57 68 48 56 32 63 Z" fill="url(#banner)" stroke={accent} strokeWidth="1.5" opacity="0.88" />
    <path d="M50 76 C58 65 66 76 58 88 C50 76 66 76 58 65" stroke={accent} strokeWidth="2" fill="none" opacity="0.6" />
    <circle cx="54" cy="37" r="2" fill={accent} />
    <circle cx="63" cy="37" r="2" fill={accent} />
    {seed % 2 === 0 && <path d="M83 63 C91 72 91 87 82 96" stroke={accent} strokeWidth="2" fill="none" opacity="0.52" />}
  </g>
)

const renderSilhouette = (silhouette: string, role: ShadowRole, accent: string, seed: number, evolved: boolean) => {
  if (role === 'guard' || silhouette.includes('shield')) return renderGuard(silhouette, accent, evolved)
  if (role === 'analyst' || silhouette.includes('book') || silhouette === 'scroll') return renderAnalyst(silhouette, accent, seed, evolved)
  if (role === 'hunter' || silhouette.includes('hound') || silhouette.includes('beast') || silhouette === 'rat') return renderBeast(silhouette, accent, seed, evolved)
  if (role === 'support' || silhouette === 'banner') return renderSupport(silhouette, accent, seed, evolved)
  return renderSoldier(silhouette, accent, seed, evolved)
}

export function ShadowPortrait({
  shadow,
  definition,
  size = 'md',
  active = false,
  highlighted = false,
  evolutionReady = false,
  hidden = false,
  className,
}: ShadowPortraitProps) {
  const def = resolveDefinition(shadow, definition)
  const rarity = def?.rarity ?? shadow?.rarity ?? 'common'
  const role = def?.role ?? shadow?.role ?? 'assault'
  const named = Boolean(def?.isGateNamed || def?.isAchievementNamed || def?.rank === 'named' || shadow?.isNamed)
  const evolved = Boolean((shadow?.evolutionStage ?? 0) > 0 || def?.visualTheme === 'evolved')
  const visualKey = def?.visualKey ?? `${role}-${rarity}`
  const seed = hashString(visualKey)
  const palette = rarityPalette[rarity]
  const accent = def?.accentColor ?? palette.frame
  const profile = resolveProfile(def, role, rarity, named, evolved)
  const silhouette = profile.silhouette
  const runeRotation = (seed % 28) - 14
  const mistShift = (seed % 18) - 9
  const label = hidden ? 'Unknown shadow' : (def?.name ?? shadow?.name ?? 'Shadow')
  const sourceTone = def?.isAchievementNamed || shadow?.isAchievementNamed ? 'ACHIEVEMENT' : def?.isGateNamed || shadow?.isGateNamed ? 'GATE NAMED' : 'NAMED'
  const style = {
    '--shadow-accent': accent,
    '--shadow-frame': palette.frame,
    '--shadow-glow': palette.glow,
    '--shadow-mist': palette.mist,
  } as CSSProperties

  return (
    <div
      className={clsx(
        'relative isolate overflow-hidden rounded-md border bg-ink-950/80',
        sizeClass[size],
        def?.isAchievementNamed || shadow?.isAchievementNamed ? 'border-cyan-200/50' : named ? 'border-amber-300/50' : 'border-white/10',
        active && 'ring-2 ring-cyan-300/35',
        highlighted && 'shadow-glow-purple',
        evolutionReady && 'shadow-glow',
        className,
      )}
      style={{
        ...style,
        borderColor: active || named ? accent : undefined,
        boxShadow: highlighted || active || named
          ? `0 0 ${Math.round(24 + profile.intensity * 8)}px ${palette.glow}, inset 0 0 30px rgba(2, 6, 23, 0.85)`
          : `inset 0 0 24px rgba(2, 6, 23, 0.9)`,
      }}
      aria-label={label}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,var(--shadow-mist),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.1),rgba(2,6,23,0.95))]" />
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(circle at 50% 34%, ${accent}22, transparent ${named ? 44 : 34}%), radial-gradient(circle at 50% 88%, ${accent}16, transparent 42%)`,
        }}
      />
      <div
        className={clsx('absolute inset-x-6 bottom-3 h-9 rounded-full blur-xl', (active || highlighted) && 'animate-pulse')}
        style={{ background: `radial-gradient(circle, ${palette.glow}, transparent 70%)`, transform: `translateX(${mistShift}px)` }}
      />
      <svg className={clsx('absolute inset-0 h-full w-full', !hidden && 'animate-float')} viewBox="0 0 116 128" role="img">
        <defs>
          <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#172033" />
            <stop offset="45%" stopColor="#050816" />
            <stop offset="100%" stopColor="#02030a" />
          </linearGradient>
          <linearGradient id="cloak" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.34" />
            <stop offset="55%" stopColor="#111827" stopOpacity="0.84" />
            <stop offset="100%" stopColor="#02030a" />
          </linearGradient>
          <linearGradient id="shield" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.42" />
            <stop offset="45%" stopColor="#111827" />
            <stop offset="100%" stopColor="#02030a" />
          </linearGradient>
          <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.8" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="book" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="banner" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.58" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="bodyStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#02030a" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.65" />
          </linearGradient>
        </defs>
        <g opacity={hidden ? 0.28 : 1}>
          {renderAura(profile, accent, named, evolved)}
          {renderBackgroundMotif(profile, accent, seed, named, evolved)}
          <path d="M58 10 L103 35 L103 91 L58 119 L13 91 L13 35 Z" fill="none" stroke={accent} strokeWidth={named ? 2.8 : evolved ? 2 : 1.4} opacity={named ? 0.82 : 0.42 + profile.intensity * 0.06} />
          <path d="M58 22 L89 40 L89 85 L58 104 L27 85 L27 40 Z" fill="none" stroke={accent} strokeDasharray={profile.rune === 'ornate' ? '2 4 8 4' : '5 7'} strokeWidth={named ? 1.25 : 1} opacity={named || evolved ? 0.38 : 0.25} transform={`rotate(${runeRotation} 58 64)`} />
          {renderSilhouette(silhouette, role, accent, seed, evolved)}
          {renderAdvancedProps(profile, role, accent, seed, evolved, named)}
        </g>
      </svg>
      {hidden && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-950/45 backdrop-blur-[1px]">
          <div className="system-text text-lg text-white/35">???</div>
        </div>
      )}
      <div className="absolute left-2 top-2 flex items-center gap-1">
        <span className={clsx('rounded border px-1.5 py-0.5 text-[8px] system-text', palette.text)} style={{ borderColor: palette.frame, background: 'rgba(2,6,23,0.58)' }}>
          {roleLabel[role]}
        </span>
        {named && (
          <span className={clsx(
            'rounded border px-1.5 py-0.5 text-[8px] system-text',
            def?.isAchievementNamed || shadow?.isAchievementNamed
              ? 'border-cyan-200/45 bg-cyan-200/15 text-cyan-100'
              : 'border-amber-300/50 bg-amber-300/15 text-amber-100',
          )}>
            {sourceTone}
          </span>
        )}
      </div>
      {(active || highlighted || evolutionReady) && (
        <div
          className={clsx('pointer-events-none absolute inset-0 rounded-md', evolutionReady ? 'animate-shimmer' : 'animate-pulse')}
          style={{ boxShadow: `inset 0 0 22px ${active ? palette.glow : 'rgba(52, 211, 153, 0.4)'}` }}
        />
      )}
      {evolved && (
        <div className="absolute bottom-2 right-2 rounded border border-emerald-300/35 bg-emerald-300/10 px-1.5 py-0.5 text-[8px] system-text text-emerald-100">
          EVO
        </div>
      )}
    </div>
  )
}
