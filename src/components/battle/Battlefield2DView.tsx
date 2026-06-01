import { useEffect, useState, useMemo, useRef } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { getBattlefieldTheme, type BattleActorViewModel, type BattleLane } from '../../lib/battlePresentation'
import { BattleActorSprite } from './BattleActorSprite'
import { BattleDamagePopup, type PopupType } from './BattleDamagePopup'
import { BattlefieldVfxLayer, type VfxType } from './BattlefieldVfxLayer'
import { getSkillMotionPreset, type ActorMotionType, type TargetReactionType } from '../../lib/skillMotionPresets'
import { getHunterBattleSpriteUrl } from '../../lib/hunterBattleSprites'
import { isMonarchVisualBoss, getMonarchFieldClass } from '../../lib/monarchVisualEffects'

type FormationLane = BattleActorViewModel['boardLane']

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
    actionId?: string
    actionType?: string
  }
  compact?: boolean
  mode?: 'compact' | 'overlay'
  visualTestJob?: string
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const normalizeFormationLane = (actor: BattleActorViewModel): FormationLane => {
  if (actor.boardLane) return actor.boardLane
  if (actor.kind === 'boss') return 'boss'
  if (actor.lane === 'back') return 'rear'
  if (actor.lane === 'mid') return 'anchor'
  return 'front'
}

// Map lane/team positioning to percentage coordinates. BattleLane remains a
// fallback, while boardLane is the read-only formation depth used for display.
function getLaneYOuter(team: 'ally' | 'enemy', lane: BattleLane, isCompact: boolean, boardLane?: FormationLane): number {
  const formationLane = boardLane ?? (lane === 'back' ? 'rear' : lane === 'mid' ? 'anchor' : 'front')
  if (team === 'ally') {
    if (formationLane === 'rear') return isCompact ? 39 : 38
    if (formationLane === 'flank') return isCompact ? 53 : 52
    if (formationLane === 'anchor') return isCompact ? 58 : 57
    return isCompact ? 64 : 63
  }

  if (formationLane === 'rear' || formationLane === 'boss') return isCompact ? 37 : 36
  if (formationLane === 'flank') return isCompact ? 50 : 49
  if (formationLane === 'anchor') return isCompact ? 54 : 53
  return isCompact ? 60 : 59
}

function getLaneXOuter(team: 'ally' | 'enemy', boardLane: FormationLane, isCompact: boolean): number {
  if (team === 'ally') {
    if (boardLane === 'rear') return isCompact ? 13 : 12
    if (boardLane === 'anchor') return isCompact ? 20 : 18
    if (boardLane === 'flank') return isCompact ? 25 : 24
    return isCompact ? 31 : 29
  }

  if (boardLane === 'rear' || boardLane === 'boss') return isCompact ? 82 : 84
  if (boardLane === 'anchor') return isCompact ? 76 : 78
  if (boardLane === 'flank') return isCompact ? 71 : 72
  return isCompact ? 65 : 66
}

function getFormationMeta(actor: BattleActorViewModel): { lane: FormationLane; laneLabel: string; roleLabel: string } {
  const lane = normalizeFormationLane(actor)
  const laneLabel =
    lane === 'rear' ? '후열' :
    lane === 'anchor' ? '앵커' :
    lane === 'flank' ? '측면' :
    lane === 'boss' ? '후방' :
    '전열'

  const role = actor.role?.toLowerCase() ?? ''
  const roleLabel =
    actor.isBoss || actor.kind === 'boss' ? 'BOSS' :
    role.includes('guard') || role.includes('tank') || role.includes('knight') || role.includes('shield') ? '방어' :
    role.includes('support') || role.includes('mender') || role.includes('healer') ? '지원' :
    role.includes('analyst') || role.includes('tactician') || role.includes('controller') || role.includes('caster') ? '전술' :
    role.includes('scout') || role.includes('hunter') || role.includes('assassin') || role.includes('tracker') ? '기동' :
    '공격'

  return { lane, laneLabel, roleLabel }
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
  visualTestJob = 'off',
}: Battlefield2DViewProps) {
  const isCompact = mode === 'compact' || (mode === undefined && compact)
  const [popups, setPopups] = useState<any[]>([])
  const [vfxs, setVfxs] = useState<any[]>([])
  const lastProcessedActionRef = useRef<string>('')

  // 0. presentation-only DEV/QA job visual override
  const overriddenActors = useMemo(() => {
    if (!visualTestJob || visualTestJob === 'off') return actors
    return actors.map(actor => {
      if (actor.kind === 'hunter') {
        let overrideRole = actor.role
        if (visualTestJob === 'base') overrideRole = 'novice-hunter'
        else if (visualTestJob === 'swordsman') overrideRole = 'swordsman'
        else if (visualTestJob === 'warrior') overrideRole = 'warrior'
        else if (visualTestJob === 'mage') overrideRole = 'mage'
        else if (visualTestJob === 'guardian') overrideRole = 'guardian'
        else if (visualTestJob === 'tracker') overrideRole = 'tracker'
        else if (visualTestJob === 'tactician') overrideRole = 'tactician'
        else if (visualTestJob === 'hidden-shadow') overrideRole = 'shadow'
        else if (visualTestJob === 'hidden-curse') overrideRole = 'curse'
        else if (visualTestJob === 'hidden-rift') overrideRole = 'rift'

        return {
          ...actor,
          role: overrideRole,
          hunterSpriteUrl: getHunterBattleSpriteUrl(overrideRole),
        }
      }
      return actor
    })
  }, [actors, visualTestJob])

  const theme = getBattlefieldTheme(battleType, encounterKey)

  // Track coordinates for each actor by ID with dynamic safe-zone distribution
  const actorCoords = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {}
    
    // Y Safe Zone boundaries to prevent clipping (top overlay vs bottom border)
    const SAFE_Y_TOP = isCompact ? 30 : 28
    const SAFE_Y_BOTTOM = isCompact ? 70 : 72

    const laneOrder: FormationLane[] = ['rear', 'anchor', 'flank', 'front', 'boss']
    const getLaneSpreadY = (actor: BattleActorViewModel, idx: number, count: number) => {
      const lane = normalizeFormationLane(actor)
      const base = getLaneYOuter(actor.team, actor.lane, isCompact, lane)
      if (count <= 1) return clamp(base, SAFE_Y_TOP, SAFE_Y_BOTTOM)
      const spacing = (isCompact ? 6.5 : 8.5) * (count >= 4 ? 0.82 : 1)
      return clamp(base + (idx - (count - 1) / 2) * spacing, SAFE_Y_TOP, SAFE_Y_BOTTOM)
    }

    const positionTeam = (team: 'ally' | 'enemy') => {
      const teamActors = overriddenActors.filter(actor => actor.team === team)
      const actorsByLane = laneOrder.map(lane => {
        const actorsInLane = teamActors.filter(actor => normalizeFormationLane(actor) === lane)
        return { lane, actors: actorsInLane }
      })

      actorsByLane.forEach(({ lane, actors: actorsInLane }) => {
        actorsInLane.forEach((actor, idx) => {
          const count = actorsInLane.length
          const baseX = getLaneXOuter(team, lane, isCompact)
          const laneTuck = teamActors.length >= 4 ? 0.8 : 1
          const xStep = (isCompact ? 1.6 : 2.1) * laneTuck
          const xDirection = team === 'ally' ? 1 : -1
          const x = clamp(baseX + (idx - (count - 1) / 2) * xStep * xDirection, 8, 90)
          const y = getLaneSpreadY(actor, idx, count)
          coords[actor.id] = { x, y }
        })
      })
    }

    positionTeam('ally')
    positionTeam('enemy')
    
    return coords
  }, [overriddenActors, isCompact])

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

    const actor = overriddenActors.find(a => a.id === latestAction.actorId)
    const targets = overriddenActors.filter(a => latestAction.targetIds?.includes(a.id))
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
        actorRole: actor.kind === 'shadow' ? `shadow-${actor.role}` : actor.role,
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
    const preset = getSkillMotionPreset(actor.role, actor.isBoss, latestAction.kind, latestAction.actionId)
    const popupStyle = preset.damagePopupStyle
    const intensity = preset.intensity

    const newPopups = targets.map((t, idx) => {
      const coords = actorCoords[t.id] ?? { x: 50, y: 50 }
      
      let pText = ''
      let pType: PopupType = 'miss'

      if (latestAction.actionType === 'heal') {
        pText = `+${latestAction.amount ?? 0}`
        pType = 'heal'
      } else if (latestAction.actionType === 'reaction' || latestAction.kind === 'guard') {
        pText = 'GUARD'
        pType = 'guard'
      } else if (latestAction.actionType === 'damage') {
        if (latestAction.amount !== undefined && latestAction.amount > 0) {
          pText = `-${latestAction.amount}`
          pType = 'damage'
        } else {
          pText = '0'
          pType = 'damage'
        }
      } else if (latestAction.actionType === 'fizzle') {
        pText = 'MISS'
        pType = 'miss'
      } else {
        // status 나 기타 이벤트는 숫자 데미지 팝업을 띄우지 않음
        return null
      }

      return {
        id: `${actionId}-pop-${t.id}-${idx}`,
        text: pText,
        type: pType,
        isCrit: latestAction.isCrit,
        targetX: coords.x,
        targetY: coords.y,
        style: popupStyle,
        intensity,
      }
    }).filter((p): p is NonNullable<typeof p> => p !== null)

    if (newPopups.length > 0) {
      setPopups(prev => [...prev, ...newPopups])
      setTimeout(() => {
        setPopups(prev => prev.filter(p => !newPopups.some(n => n.id === p.id)))
      }, 1000)
    }

  }, [latestAction, actors, actorCoords])

  // Find active and alive monarch boss
  const monarchActor = useMemo(() => {
    return overriddenActors.find(a => a.team === 'enemy' && !a.isDefeated && isMonarchVisualBoss(a.sourceId))
  }, [overriddenActors])

  const monarchPhase = useMemo(() => {
    if (!monarchActor || !monarchActor.sourceId) return 1
    const id = monarchActor.sourceId.toLowerCase()
    const hpPct = monarchActor.hp / monarchActor.maxHp
    if (id === 'nox') {
      return hpPct < 0.3 ? 3 : hpPct < 0.7 ? 2 : 1
    } else if (id === 'angel') {
      return hpPct < 0.4 ? 3 : hpPct < 0.7 ? 2 : 1
    } else {
      const threshold = ['grellic', 'igris', 'dorga'].includes(id) ? 0.6 : 0.5
      return hpPct <= threshold ? 2 : 1
    }
  }, [monarchActor])

  const activeSeverity = monarchActor?.telegraph?.severity

  return (
    <div className={clsx(
      'relative w-full rounded-xl border-2 border-slate-800/80 overflow-hidden bg-gradient-to-b shadow-[inset_0_0_30px_rgba(0,0,0,0.85),0_4px_24px_rgba(0,0,0,0.55)] flex flex-col justify-between select-none',
      theme.bgGradient,
      mode === 'overlay' 
        ? 'h-[25vh] min-h-[190px] xs:h-[29vh] xs:min-h-[220px] sm:h-[31vh] sm:min-h-[240px] md:h-[420px] lg:h-[480px]' 
        : (isCompact ? 'h-[190px] sm:h-[220px]' : 'h-[300px] sm:h-[340px]')
    )}>
      {/* Sky atmospheric filter */}
      <div className={clsx('pointer-events-none absolute inset-0 z-0 opacity-80', theme.skyFilter)} />

      {/* Monarch Premium 2.5D Field Vignette & Aura Layer */}
      {monarchActor && monarchActor.sourceId && (
        <div 
          className={clsx(
            'pointer-events-none absolute inset-0 z-0 transition-all duration-700',
            getMonarchFieldClass(monarchActor.sourceId, monarchPhase),
            activeSeverity === 'lethal' && 'monarch-telegraph-lethal',
            activeSeverity === 'high' && 'monarch-telegraph-high'
          )}
        />
      )}

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

      {/* Formation depth guides: boardLane is read-only; these only reveal existing lanes. */}
      <div className="pointer-events-none absolute inset-x-4 top-[35%] z-[1] flex items-center gap-2 opacity-70">
        <div className="h-px flex-1 border-t border-dashed border-cyan-200/16" />
        <span className="rounded border border-cyan-200/15 bg-black/25 px-1.5 py-0.5 text-[8px] font-bold text-cyan-100/45">후열</span>
        <div className="h-px flex-1 border-t border-dashed border-rose-200/16" />
      </div>
      <div className="pointer-events-none absolute inset-x-4 top-[61%] z-[1] flex items-center gap-2 opacity-70">
        <div className="h-px flex-1 border-t border-dashed border-cyan-200/22" />
        <span className="rounded border border-white/15 bg-black/30 px-1.5 py-0.5 text-[8px] font-bold text-white/50">전열</span>
        <div className="h-px flex-1 border-t border-dashed border-rose-200/22" />
      </div>

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
              const actor = overriddenActors.find(a => a.id === latestAction.actorId)
              
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
                    cx={`${start.x}%`}
                    cy={`${start.y}%`}
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
                    cx={`${start.x}%`}
                    cy={`${start.y}%`}
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
        {overriddenActors.map(actor => {
          const coords = actorCoords[actor.id] ?? { x: 50, y: 50 }
          
          let activeMotion: ActorMotionType | undefined
          let hitReaction: TargetReactionType | undefined
          let intensity: 'basic' | 'skill' | 'signature' | undefined
 
          if (latestAction && latestAction.actorId === actor.id) {
            const preset = getSkillMotionPreset(actor.role, actor.isBoss, latestAction.kind, latestAction.actionId)
            activeMotion = preset.actorMotion
            intensity = preset.intensity
          }
 
          if (latestAction && latestAction.targetIds?.includes(actor.id)) {
            const attacker = overriddenActors.find(a => a.id === latestAction.actorId)
            const preset = getSkillMotionPreset(attacker?.role, attacker?.isBoss, latestAction.kind, latestAction.actionId)
            hitReaction = preset.targetReaction
            if (!intensity) intensity = preset.intensity
          }
 
          const formationMeta = getFormationMeta(actor)
          return (
            <div
              key={actor.id}
              className="absolute transition-all duration-300"
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: actor.isActive ? 100 : actor.isTargeted ? 90 : Math.round(coords.y),
              }}
            >
              {actor.telegraph && !actor.isDefeated && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none select-none">
                  {/* Severity Aura ring underneath */}
                  {actor.telegraph.severity === 'lethal' && (
                    <div className="absolute -inset-1 rounded-full bg-red-600/30 blur-md animate-ping" />
                  )}
                  {actor.telegraph.severity === 'high' && (
                    <div className="absolute -inset-1 rounded-full bg-amber-600/20 blur-sm animate-pulse" />
                  )}
                  
                  {/* Action Badge */}
                  <div className={clsx(
                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border flex items-center gap-1 shadow-md whitespace-nowrap",
                    actor.telegraph.severity === 'lethal' ? "bg-red-950/90 border-red-500 text-red-200 animate-pulse font-black" :
                    actor.telegraph.severity === 'high' ? "bg-amber-950/90 border-amber-500 text-amber-200" :
                    actor.telegraph.severity === 'medium' ? "bg-orange-950/90 border-orange-500 text-orange-200" :
                    "bg-zinc-900/90 border-zinc-700 text-zinc-300"
                  )}>
                    <span className="animate-pulse">⚠️</span>
                    <span>{actor.telegraph.telegraphName}</span>
                  </div>
                  
                  {/* Brief Text / Recommendation under the badge */}
                  <div className="text-[7px] scale-90 text-white/70 font-semibold bg-black/80 px-1 mt-0.5 rounded border border-white/5 whitespace-nowrap shadow-sm">
                    {actor.telegraph.telegraphText}
                  </div>
                </div>
              )}

              <BattleActorSprite 
                actor={actor} 
                compact={
                  isCompact || 
                  (actor.team === 'ally' && overriddenActors.filter(a => a.team === 'ally').length >= 4) ||
                  (actor.team === 'enemy' && overriddenActors.filter(a => a.team === 'enemy').length >= 4 && !actor.isBoss && actor.kind !== 'boss')
                } 
                activeMotion={activeMotion}
                hitReaction={hitReaction}
                intensity={intensity}
                yCoord={coords.y}
              />
              <div className={clsx(
                'mx-auto mt-1 flex w-max max-w-[92px] items-center justify-center gap-1 rounded-full border bg-black/70 px-1.5 py-0.5 text-[8px] font-black leading-none shadow-md backdrop-blur-sm',
                actor.team === 'ally'
                  ? formationMeta.lane === 'rear'
                    ? 'border-cyan-200/20 text-cyan-100/80'
                    : 'border-emerald-200/20 text-emerald-100/80'
                  : formationMeta.lane === 'rear' || formationMeta.lane === 'boss'
                  ? 'border-rose-200/20 text-rose-100/80'
                  : 'border-amber-200/20 text-amber-100/80'
              )}>
                <span>{formationMeta.laneLabel}</span>
                <span className="text-white/25">/</span>
                <span className="text-white/55">{formationMeta.roleLabel}</span>
              </div>
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
