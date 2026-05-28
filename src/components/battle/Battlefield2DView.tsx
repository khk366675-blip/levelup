import { useEffect, useState, useMemo, useRef } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { getBattlefieldTheme, type BattleActorViewModel, type BattleLane } from '../../lib/battlePresentation'
import { BattleActorSprite } from './BattleActorSprite'
import { BattleDamagePopup, type PopupType } from './BattleDamagePopup'
import { BattlefieldVfxLayer, type VfxType } from './BattlefieldVfxLayer'

type Battlefield2DViewProps = {
  actors: BattleActorViewModel[]
  battleType: 'gate' | 'tower'
  encounterKey?: string
  phase?: 'idle' | 'acting' | 'victory' | 'defeat' | 'cancelled'
  latestAction?: {
    actorId?: string
    targetIds?: string[]
    kind?: 'attack' | 'skill' | 'heal' | 'guard' | 'shadow' | 'curse' | 'magic' | string
    amount?: number
    text?: string
    isCrit?: boolean
  }
  compact?: boolean
  mode?: 'compact' | 'overlay'
}

// Map lane/team positioning to percentage coordinates
function getLaneYOuter(team: 'ally' | 'enemy', lane: BattleLane, isCompact: boolean): number {
  if (isCompact) {
    if (team === 'ally') {
      if (lane === 'front') return 56 // Shadows
      if (lane === 'mid') return 71  // Hunter
      return 82                      // Backline
    } else {
      if (lane === 'front') return 41 // Enemy minions
      return 26                       // Boss / Enemy back
    }
  } else {
    if (team === 'ally') {
      if (lane === 'front') return 56 // Shadows
      if (lane === 'mid') return 69  // Hunter
      return 80                      // Backline
    } else {
      if (lane === 'front') return 43 // Enemy minions
      return 30                       // Boss / Enemy back
    }
  }
}

// Melee vs Ranged Lineage Evaluator
function isMeleeAction(role?: string, kind?: string): boolean {
  if (kind === 'heal' || kind === 'guard' || kind === 'magic' || kind === 'shadow' || kind === 'curse' || kind === 'skill') {
    return false // Spells and active support abilities are treated as ranged projectiles/magic
  }
  if (!role) return true // default basic attack is melee
  const id = role.toLowerCase()
  
  if (
    id.includes('mage') ||
    id.includes('chronomancer') ||
    id.includes('time-governor') ||
    id.includes('entropy') ||
    id.includes('wizard') ||
    id.includes('caster') ||
    id.includes('mender') ||
    id.includes('disruptor') ||
    id.includes('tactician') ||
    id.includes('strategist') ||
    id.includes('alchemist') ||
    id.includes('chimera') ||
    id.includes('weaver') ||
    id.includes('orchestrator') ||
    id.includes('curse') ||
    id.includes('rift') ||
    id.includes('dimension')
  ) {
    return false // Mages, tacticians, and dimension specialists are ranged
  }
  return true // Swordsman, warrior, tracker, guardian, beast, undead are melee
}

export function Battlefield2DView({
  actors,
  battleType,
  encounterKey,
  phase = 'idle',
  latestAction,
  compact = false,
  mode,
}: Battlefield2DViewProps) {
  const isCompact = mode === 'compact' || (mode === undefined && compact)
  const [popups, setPopups] = useState<any[]>([])
  const [vfxs, setVfxs] = useState<any[]>([])
  const lastProcessedActionRef = useRef<string>('')

  const theme = getBattlefieldTheme(battleType, encounterKey)

  // Track coordinates for each actor by ID with overlap avoidance
  const actorCoords = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {}
    
    // Dynamic X-axis positions based on device/viewport to handle larger sprites without overlaps
    const xAllyBack = isCompact ? 18 : 15
    const xAllyFront = isCompact ? 35 : 33
    
    // 1. Ally Team Positioning
    const allyActors = actors.filter(a => a.team === 'ally')
    const hunterActor = allyActors.find(a => a.kind === 'hunter')
    const shadowActors = allyActors.filter(a => a.kind === 'shadow')
    
    // Position Hunter (Left Back)
    if (hunterActor) {
      coords[hunterActor.id] = { x: shadowActors.length === 0 ? (isCompact ? 26 : 24) : xAllyBack, y: 50 }
    }
    
    // Position Shadows (Left Front)
    if (shadowActors.length > 0) {
      shadowActors.forEach((shadow, idx) => {
        const count = shadowActors.length
        let y = 50
        if (count === 1) y = 50
        else if (count === 2) y = idx === 0 ? 33 : 67
        else if (count === 3) y = idx === 0 ? 25 : idx === 1 ? 50 : 75
        else {
          const step = 70 / (count - 1)
          y = 15 + idx * step
        }
        coords[shadow.id] = { x: xAllyFront, y }
      })
    } else if (!hunterActor && allyActors.length > 0) {
      allyActors.forEach((actor, idx) => {
        const count = allyActors.length
        let y = 50
        if (count === 2) y = idx === 0 ? 33 : 67
        else if (count === 3) y = idx === 0 ? 25 : idx === 1 ? 50 : 75
        coords[actor.id] = { x: isCompact ? 28 : 24, y }
      })
    }
    
    // 2. Enemy Team Positioning (Rebalanced to prioritize Horizontal Spacing & Prevent Stack overlapping)
    const enemyActors = actors.filter(a => a.team === 'enemy')
    const bossActor = enemyActors.find(a => a.isBoss || a.kind === 'boss')
    const minionActors = enemyActors.filter(a => !(a.isBoss || a.kind === 'boss'))
    
    if (bossActor) {
      const minionCount = minionActors.length
      if (minionCount === 0) {
        // Boss alone: Centered and magnificent
        coords[bossActor.id] = { x: isCompact ? 73 : 75, y: 50 }
      } else if (minionCount === 1) {
        // Boss 1 + Minion 1: Split horizontally with Boss slightly behind
        coords[bossActor.id] = { x: isCompact ? 78 : 80, y: 47 }
        coords[minionActors[0].id] = { x: isCompact ? 63 : 65, y: 53 }
      } else if (minionCount === 2) {
        // Boss 1 + Minion 2: Horizontal symmetry with Boss as center anchor
        coords[minionActors[0].id] = { x: isCompact ? 60 : 62, y: 54 }
        coords[bossActor.id] = { x: isCompact ? 72 : 74, y: 46 }
        coords[minionActors[1].id] = { x: isCompact ? 83 : 85, y: 50 }
      } else {
        // Boss 1 + Minion 3+: Boss in center-back, Minions spread horizontally in front
        coords[bossActor.id] = { x: isCompact ? 74 : 76, y: 45 }
        minionActors.forEach((minion, idx) => {
          const step = (isCompact ? 22 : 25) / (minionCount - 1)
          const startX = isCompact ? 59 : 61
          const x = startX + idx * step
          const y = idx % 2 === 0 ? 53 : 48
          coords[minion.id] = { x, y }
        })
      }
    } else {
      // Normal Monsters only (No Boss)
      const count = enemyActors.length
      if (count === 1) {
        coords[enemyActors[0].id] = { x: isCompact ? 70 : 72, y: 50 }
      } else if (count === 2) {
        // 2 Monsters: Perfectly separated horizontally
        coords[enemyActors[0].id] = { x: isCompact ? 63 : 65, y: 53 }
        coords[enemyActors[1].id] = { x: isCompact ? 77 : 79, y: 47 }
      } else if (count === 3) {
        // 3 Monsters: Elegant staggered diagonal sweep (fully horizontal, no stacked overlap)
        coords[enemyActors[0].id] = { x: isCompact ? 61 : 63, y: 54 }
        coords[enemyActors[1].id] = { x: isCompact ? 71 : 73, y: 47 }
        coords[enemyActors[2].id] = { x: isCompact ? 81 : 83, y: 51 }
      } else {
        // 4+ Monsters: Multi-anchor horizontal wave layout
        enemyActors.forEach((actor, idx) => {
          const step = (isCompact ? 24 : 28) / (count - 1)
          const startX = isCompact ? 60 : 62
          const x = startX + idx * step
          const y = idx % 2 === 0 ? 53 : 47
          coords[actor.id] = { x, y }
        })
      }
    }
    
    return coords
  }, [actors, isCompact])

  // Watch for latestAction changes and trigger popup and VFX
  useEffect(() => {
    if (!latestAction || !latestAction.actorId) return

    // Prevent rendering flicker caused by multi-trigger react state hooks
    // Dedupes actions so they are only processed exactly once
    const actionFingerprint = `${latestAction.actorId}-${latestAction.kind}-${latestAction.amount}-${latestAction.targetIds?.join(',')}-${latestAction.text}`
    if (lastProcessedActionRef.current === actionFingerprint) {
      return
    }
    lastProcessedActionRef.current = actionFingerprint

    const actor = actors.find(a => a.id === latestAction.actorId)
    const targets = actors.filter(a => latestAction.targetIds?.includes(a.id))
    if (!actor) return

    const actionId = `action-${Date.now()}`
    const actionKind = latestAction.kind ?? 'attack'

    // Determine VfxType
    let vfxType: VfxType = 'attack'
    if (actionKind === 'heal') vfxType = 'heal'
    else if (actionKind === 'guard') vfxType = 'guard'
    else if (actionKind === 'shadow') vfxType = 'shadow'
    else if (actionKind === 'curse') vfxType = 'curse'
    else if (actionKind === 'magic') vfxType = 'magic'
    else if (actionKind === 'skill') vfxType = 'skill'

    // 1. Trigger VFX on targets (or on self if heal/guard)
    const targetsToApply = (vfxType === 'heal' || vfxType === 'guard') ? [actor] : targets

    const newVfxs = targetsToApply.map((t, idx) => {
      const coords = actorCoords[t.id] ?? { x: 50, y: 50 }
      return {
        id: `${actionId}-vfx-${t.id}-${idx}`,
        type: vfxType,
        targetX: coords.x,
        targetY: coords.y,
        actorRole: actor.role,
        isBoss: actor.isBoss || actor.kind === 'boss',
      }
    })

    if (newVfxs.length > 0) {
      setVfxs(prev => [...prev, ...newVfxs])
      setTimeout(() => {
        setVfxs(prev => prev.filter(v => !newVfxs.some(n => n.id === v.id)))
      }, 700)
    }

    // 2. Trigger Damage/Heal numbers on targets
    const newPopups = targets.map((t, idx) => {
      const coords = actorCoords[t.id] ?? { x: 50, y: 50 }
      
      let pText = 'MISS'
      let pType: PopupType = 'miss'

      if (vfxType === 'heal') {
        pText = `+${latestAction.amount ?? 0}`
        pType = 'heal'
      } else if (latestAction.kind === 'guard') {
        pText = 'GUARD'
        pType = 'guard'
      } else if (latestAction.amount !== undefined && latestAction.amount > 0) {
        pText = `-${latestAction.amount}`
        pType = 'damage'
      }

      return {
        id: `${actionId}-pop-${t.id}-${idx}`,
        text: pText,
        type: pType,
        isCrit: latestAction.isCrit,
        targetX: coords.x,
        targetY: coords.y,
      }
    })

    if (newPopups.length > 0) {
      setPopups(prev => [...prev, ...newPopups])
      setTimeout(() => {
        setPopups(prev => prev.filter(p => !newPopups.some(n => n.id === p.id)))
      }, 1000)
    }

  }, [latestAction, actors, actorCoords])

  return (
    <div className={clsx(
      'relative w-full rounded-xl border-2 border-slate-800/80 overflow-hidden bg-gradient-to-b shadow-[inset_0_0_30px_rgba(0,0,0,0.85),0_4px_24px_rgba(0,0,0,0.55)] flex flex-col justify-between select-none',
      theme.bgGradient,
      mode === 'overlay' ? 'h-[42vh] min-h-[350px] md:h-[480px] lg:h-[540px]' : (isCompact ? 'h-[225px] sm:h-[250px]' : 'h-[340px] sm:h-[400px]')
    )}>
      {/* Sky atmospheric filter */}
      <div className={clsx('pointer-events-none absolute inset-0 z-0 opacity-80', theme.skyFilter)} />

      {/* Fog / Mist layers for arena depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(6,182,212,0.04),transparent_70%)] pointer-events-none z-0" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent pointer-events-none z-0 animate-pulse animate-duration-3000" />

      {/* Arena Frame Overlay Corners */}
      <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400/25 pointer-events-none z-10 rounded-tl-sm" />
      <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400/25 pointer-events-none z-10 rounded-tr-sm" />
      <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400/25 pointer-events-none z-10 rounded-bl-sm" />
      <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400/25 pointer-events-none z-10 rounded-br-sm" />

      {/* Grid lines to create depth */}
      <div 
        className={clsx('absolute inset-x-0 bottom-0 h-2/3 border-t border-dashed transform origin-bottom -skew-x-12 scale-y-75 opacity-75 z-0', theme.arenaGrid)}
        style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 100%, transparent 20%, rgba(0,0,0,0.8) 100%)',
          perspective: '500px',
        }}
      />

      {/* VFX Layer */}
      <BattlefieldVfxLayer vfxs={vfxs} />

      {/* Action Overlay Banner (Top-Center) */}
      {latestAction?.text && (
        <div className="absolute top-3 inset-x-0 mx-auto max-w-[280px] z-30 text-center animate-pulse pointer-events-none">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-ink-950/85 px-3 py-1 text-[10px] sm:text-xs system-text text-cyan-200 shadow-glow shadow-cyan-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold text-white">{latestAction.text}</span>
          </div>
        </div>
      )}

      {/* Phase status indicator overlay (Victory/Defeat/Cancel) */}
      {phase !== 'idle' && phase !== 'acting' && (
        <div className="absolute inset-0 z-40 bg-black/45 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
          <div className={clsx(
            'px-6 py-3 rounded-lg border font-black uppercase text-center tracking-widest animate-bounce shadow-2xl',
            phase === 'victory' ? 'border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-glow' :
            phase === 'defeat' ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : 'border-slate-500/40 bg-slate-900/60 text-slate-300'
          )}>
            <div className="text-[10px] system-text text-white/50 tracking-wider">PHASE COMPLETE</div>
            <div className="text-xl sm:text-2xl mt-1">
              {phase === 'victory' ? 'VICTORY' : phase === 'defeat' ? 'DEFEAT' : 'CANCELLED'}
            </div>
          </div>
        </div>
      )}

      {/* 2.5D ARENA SPACE */}
      <div className="relative flex-1 w-full h-full p-4">
        {/* SVG Action Ranged Projectile / Subtle Trail Animation */}
        {latestAction?.actorId && latestAction.targetIds && latestAction.targetIds.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            {latestAction.targetIds.map(targetId => {
              const start = actorCoords[latestAction.actorId!]
              const end = actorCoords[targetId]
              if (!start || !end) return null
              
              const kind = latestAction.kind || 'attack'
              const actor = actors.find(a => a.id === latestAction.actorId)
              
              // Melee attacks do NOT render SVG lines or projectiles to prevent visual clutter
              if (isMeleeAction(actor?.role, kind)) return null
              
              // Color palettes tailored for ranged energy projectiles
              let projectileColor = '#f43f5e' // Crimson rose for general attack
              if (kind === 'heal') projectileColor = '#10b981'
              else if (kind === 'guard') projectileColor = '#f59e0b'
              else if (kind === 'skill') projectileColor = '#22d3ee'
              else if (kind === 'magic') projectileColor = '#6366f1'
              else if (kind === 'shadow') projectileColor = '#a855f7'
              else if (kind === 'curse') projectileColor = '#ef4444'
              
              return (
                <g key={`proj-${latestAction.actorId}-${targetId}`}>
                  {/* 1. Very faint, elegant trajectory guide line (Barely visible, like air turbulence) */}
                  <motion.line
                    x1={`${start.x}%`}
                    y1={`${start.y}%`}
                    x2={`${end.x}%`}
                    y2={`${end.y}%`}
                    stroke={projectileColor}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.12, 0] }}
                    transition={{ duration: 0.35 }}
                  />
                  
                  {/* 2. Traveling magical glow orb (projectile) */}
                  <motion.circle
                    r={isCompact ? 5 : 7}
                    fill={projectileColor}
                    className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    style={{
                      cx: `${start.x}%`,
                      cy: `${start.y}%`
                    }}
                    animate={{
                      cx: [`${start.x}%`, `${end.x}%`],
                      cy: [`${start.y}%`, `${end.y}%`],
                      scale: [0.8, 1.2, 0.7],
                      opacity: [1, 1, 0]
                    }}
                    transition={{
                      duration: 0.35,
                      ease: "easeOut"
                    }}
                  />

                  {/* 3. Small secondary spark following slightly behind (creates a neat tail effect!) */}
                  <motion.circle
                    r={isCompact ? 3 : 4}
                    fill={projectileColor}
                    opacity={0.7}
                    className="filter blur-[1px]"
                    style={{
                      cx: `${start.x}%`,
                      cy: `${start.y}%`
                    }}
                    animate={{
                      cx: [`${start.x}%`, `${end.x}%`],
                      cy: [`${start.y}%`, `${end.y}%`],
                      scale: [0.6, 0.9, 0],
                      opacity: [0.8, 0.8, 0]
                    }}
                    transition={{
                      duration: 0.35,
                      delay: 0.05, // 0.05s lag creates trail visual
                      ease: "easeOut"
                    }}
                  />
                </g>
              )
            })}
          </svg>
        )}

        {/* Actors positioned absolutely using coords */}
        {actors.map(actor => {
          const coords = actorCoords[actor.id] ?? { x: 50, y: 50 }
          return (
            <div
              key={actor.id}
              className="absolute transition-all duration-300"
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <BattleActorSprite actor={actor} compact={isCompact} />
            </div>
          )
        })}

        {/* Render popups relatively centered above each target ID */}
        {popups.map(pop => (
          <div
            key={pop.id}
            className="absolute pointer-events-none z-50"
            style={{
              left: `${pop.targetX}%`,
              top: `${pop.targetY}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <BattleDamagePopup popups={[pop]} />
          </div>
        ))}
      </div>
    </div>
  )
}
