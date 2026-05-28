import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Lock, Shield, Swords, Wand2 } from 'lucide-react'
import type { BattleActorViewModel } from '../../lib/battlePresentation'
import { getShadowDefinition } from '../../lib/shadows'
import { ShadowPortrait } from '../shadows/ShadowPortrait'
import { ShadowBattleSprite } from './ShadowBattleSprite'
import { HunterBattleSprite } from './HunterBattleSprite'
import { MonsterBattleSprite } from './MonsterBattleSprite'

type Props = {
  actor: BattleActorViewModel
  compact?: boolean
}

/**
 * Returns role icons for hunter or boss roles
 */
function getRoleIcon(role?: string) {
  const r = role?.toLowerCase() ?? ''
  if (r.includes('knight') || r.includes('guard') || r.includes('shield')) {
    return <Shield className="h-3.5 w-3.5" />
  }
  if (r.includes('mage') || r.includes('witch') || r.includes('wizard') || r.includes('curse') || r.includes('rift')) {
    return <Wand2 className="h-3.5 w-3.5" />
  }
  return <Swords className="h-3.5 w-3.5" />
}

export function BattleActorSprite({ actor, compact = false }: Props) {
  const isShadow = actor.kind === 'shadow'
  const isHunter = actor.kind === 'hunter'
  const isBoss = actor.kind === 'boss'
  const isMonster = actor.kind === 'monster'
  
  // Check if this actor uses a PNG battle sprite instead of circular marker card
  const hasSprite =
    isShadow ||
    (isHunter && Boolean(actor.hunterSpriteUrl)) ||
    ((isMonster || isBoss) && Boolean(actor.monsterSpriteUrl))
  
  // Try to load shadow definition if available
  const shadowDef = isShadow && actor.definitionId 
    ? getShadowDefinition(actor.definitionId) 
    : undefined

  // Active / Targeted animations
  const animateState = actor.isDefeated
    ? 'defeated'
    : actor.isActive
    ? 'active'
    : actor.isTargeted
    ? 'targeted'
    : 'idle'

  // Motion variants for 2.5D effects with cinematic staging
  const variants = {
    idle: {
      y: [0, -6, 0],
      opacity: 0.72,
      filter: 'contrast(0.85) grayscale(0.08)',
      transition: {
        y: {
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        opacity: { duration: 0.4 },
        filter: { duration: 0.4 }
      },
    },
    active: {
      y: actor.team === 'ally' ? -32 : 32, // More pronounced dash!
      scale: 1.15, // Higher spotlight scaling!
      opacity: 1,
      filter: 'contrast(1.15) brightness(1.05)',
      transition: {
        duration: 0.35,
        yoyo: 1,
        ease: 'easeOut',
      },
    },
    targeted: {
      x: [0, -8, 8, -6, 6, 0], // More dramatic rumble!
      scale: 1.05,
      opacity: 1,
      filter: 'contrast(1.05)',
      transition: {
        duration: 0.4,
        ease: 'linear',
      },
    },
    defeated: {
      opacity: 0.3,
      scale: 0.85,
      rotate: actor.team === 'ally' ? -15 : 15,
      filter: 'grayscale(1) contrast(0.7)',
      transition: {
        duration: 0.5,
      },
    },
  }

  // Shadow classes / Aura based on grade/rarity
  const auraClass = clsx(
    'pointer-events-none absolute -inset-2 rounded-full opacity-40 blur-md',
    actor.isDefeated && 'hidden',
    isBoss
      ? 'bg-[radial-gradient(circle,rgba(239,68,68,0.4),transparent_70%)] animate-pulse'
      : actor.innateGrade === 'S' || actor.rarity === 'legendary'
      ? 'bg-[radial-gradient(circle,rgba(245,158,11,0.35),transparent_70%)]'
      : actor.innateGrade === 'A' || actor.rarity === 'epic'
      ? 'bg-[radial-gradient(circle,rgba(168,85,247,0.3),transparent_70%)]'
      : actor.team === 'ally'
      ? 'bg-[radial-gradient(circle,rgba(6,182,212,0.18),transparent_70%)]'
      : 'bg-[radial-gradient(circle,rgba(239,68,68,0.15),transparent_70%)]'
  )

  const cardBorderClass = clsx(
    'relative transition-all rounded-full bg-transparent border border-transparent',
    hasSprite
      ? ''
      : actor.isDefeated
      ? 'opacity-30'
      : actor.isActive
      ? 'scale-105 shadow-[0_0_15px_rgba(34,211,238,0.65)]'
      : actor.isTargeted
      ? actor.team === 'ally'
        ? 'scale-102 shadow-[0_0_15px_rgba(52,211,153,0.65)]'
        : 'scale-102 shadow-[0_0_15px_rgba(244,63,94,0.65)]'
      : ''
  )

  return (
    <motion.div
      variants={variants}
      animate={animateState}
      className="relative flex flex-col items-center select-none"
      style={{ zIndex: actor.isActive ? 50 : actor.isTargeted ? 45 : 10 }}
    >
      {/* 2.5D Aura Glow */}
      <div className={auraClass} />

      {/* Shadow Ellipse on Floor */}
      <div
        className={clsx(
          'absolute -bottom-1.5 h-3.5 rounded-full bg-black/70 blur-[1.5px] shadow-2xl transition-all',
          compact ? (isBoss ? 'w-20 h-3' : 'w-14 h-2.5') : isBoss ? 'w-32 h-5.5' : 'w-24 h-4',
          actor.isDefeated && 'opacity-20 scale-75'
        )}
        style={{
          transform: actor.isActive ? 'scale(0.85)' : 'scale(1)',
          opacity: actor.isActive ? 0.4 : 0.7,
        }}
      />

      {/* Main Body */}
      <div
        className={clsx(cardBorderClass, hasSprite ? 'overflow-visible' : 'overflow-hidden')}
        style={{
          width: compact ? (isBoss ? 104 : 80) : (isBoss ? 200 : 144),
          height: compact ? (isBoss ? 136 : 104) : (isBoss ? 250 : 180)
        }}
      >
        {/* Active highlight sheen */}
        {actor.isActive && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent card-premium-shine z-20" />
        )}

        {/* Header Badge */}
        <div className={clsx(
          'absolute top-1 left-1 z-10 flex gap-0.5 font-bold system-text',
          compact ? 'text-[6px]' : 'text-[8px]'
        )}>
          {actor.isBoss && (
            <span className="rounded bg-rose-500 px-1 py-0.5 text-white shadow-sm">BOSS</span>
          )}
          {actor.isNamed && !actor.isBoss && (
            <span className="rounded bg-amber-500 px-1 py-0.5 text-black shadow-sm">NAMED</span>
          )}
          {actor.innateGrade && (
            <span className={clsx(
              'rounded px-1 py-0.5 font-black border',
              actor.innateGrade === 'S' ? 'border-amber-400/40 bg-amber-400/10 text-amber-200' :
              actor.innateGrade === 'A' ? 'border-purple-400/45 bg-purple-400/10 text-purple-200' : 'border-cyan-400/20 bg-cyan-400/8 text-cyan-200'
            )}>
              {actor.innateGrade}
            </span>
          )}
        </div>

        {/* Active/Target status badge overlay inside card */}
        {!actor.isDefeated && actor.isActive && (
          <div className="absolute top-1 right-1 z-30 animate-pulse">
            <span className={clsx(
              'rounded font-black uppercase tracking-wider px-1 py-0.5 text-black bg-cyan-400 shadow-sm shadow-cyan-400/30',
              compact ? 'text-[5.5px]' : 'text-[7.5px]'
            )}>
              ACT
            </span>
          </div>
        )}
        {!actor.isDefeated && actor.isTargeted && (
          <div className="absolute top-1 right-1 z-30 animate-bounce">
            <span className={clsx(
              'rounded font-black uppercase tracking-wider px-1 py-0.5 text-white shadow-sm',
              actor.team === 'ally' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30',
              compact ? 'text-[5.5px]' : 'text-[7.5px]'
            )}>
              {actor.team === 'ally' ? 'AID' : 'TGT'}
            </span>
          </div>
        )}

        {/* 1. RENDER SHADOWS */}
        {isShadow && (
          <div className="absolute inset-0 z-0">
            <ShadowBattleSprite
              definitionId={actor.definitionId}
              isActive={actor.isActive}
              isTargeted={actor.isTargeted}
              isDefeated={actor.isDefeated}
              innateGrade={actor.innateGrade}
              compact={compact}
            />
          </div>
        )}

        {/* 2. RENDER HUNTER */}
        {isHunter && (
          actor.hunterSpriteUrl ? (
            <div className="absolute inset-0 z-0">
              <HunterBattleSprite
                imageUrl={actor.hunterSpriteUrl}
                isActive={actor.isActive}
                isTargeted={actor.isTargeted}
                isSupportTarget={actor.team === 'ally'}
                isDefeated={actor.isDefeated}
                compact={compact}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col justify-center p-1">
              <div className="flex-1 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(6,182,212,0.18),transparent_70%)] animate-pulse" />
                <div
                  className={clsx(
                    'rounded-full border flex items-center justify-center shadow-inner relative',
                    actor.isDefeated ? 'border-slate-800 bg-slate-900 text-slate-500' : 'bg-cyan-500/10 border-cyan-400 text-cyan-200'
                  )}
                  style={{
                    width: compact ? 32 : 56,
                    height: compact ? 32 : 56
                  }}
                >
                  {getRoleIcon(actor.role)}
                </div>
              </div>
            </div>
          )
        )}

        {/* 3. RENDER MONSTER/BOSS */}
        {(isMonster || isBoss) && (
          actor.monsterSpriteUrl ? (
            <div className="absolute inset-0 z-0">
              <MonsterBattleSprite
                imageUrl={actor.monsterSpriteUrl}
                isBoss={isBoss}
                isActive={actor.isActive}
                isTargeted={actor.isTargeted}
                isDefeated={actor.isDefeated}
                compact={compact}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col justify-center p-1">
              <div className="flex-1 flex items-center justify-center relative">
                <div className={clsx(
                  'absolute inset-0 animate-pulse',
                  isBoss 
                    ? 'bg-[radial-gradient(circle,rgba(239,68,68,0.22),transparent_70%)]' 
                    : 'bg-[radial-gradient(circle,rgba(239,68,68,0.12),transparent_75%)]'
                )} />
                <div
                  className={clsx(
                    'flex items-center justify-center relative bg-transparent border-0',
                    actor.isDefeated 
                      ? 'text-slate-600 grayscale' 
                      : isBoss 
                        ? 'text-rose-400 filter drop-shadow-[0_0_12px_rgba(239,68,68,0.75)]' 
                        : 'text-slate-400 filter drop-shadow-[0_0_8px_rgba(226,232,240,0.4)]'
                  )}
                  style={{
                    width: compact ? (isBoss ? 56 : 32) : (isBoss ? 80 : 56),
                    height: compact ? (isBoss ? 72 : 40) : (isBoss ? 96 : 64)
                  }}
                >
                  {isBoss ? (
                    <span className={clsx('filter drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]', compact ? 'text-4xl' : 'text-6xl')}>👹</span>
                  ) : (
                    <span className={clsx(compact ? 'text-2xl' : 'text-4xl')}>💀</span>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* Bottom HP Bar Only */}
        <div className="absolute inset-x-0 bottom-0.5 flex flex-col items-center justify-end z-10 px-2 pointer-events-none">
          <div className={clsx('w-full bg-slate-950/70 rounded-full overflow-hidden border border-white/5 flex items-center', compact ? 'h-[2px]' : 'h-[3px]')}>
            <motion.div
              initial={{ width: `${(actor.hp / actor.maxHp) * 100}%` }}
              animate={{ width: `${(actor.hp / actor.maxHp) * 100}%` }}
              transition={{ duration: 0.3 }}
              className={clsx(
                'h-full rounded-full',
                actor.isDefeated
                  ? 'bg-slate-800'
                  : actor.team === 'ally'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400'
                  : 'bg-gradient-to-r from-rose-600 to-amber-500'
              )}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
