import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Lock, Shield, Swords, Wand2 } from 'lucide-react'
import type { BattleActorViewModel } from '../../lib/battlePresentation'
import { getShadowDefinition } from '../../lib/shadows'
import { ShadowPortrait } from '../shadows/ShadowPortrait'
import { ShadowBattleSprite } from './ShadowBattleSprite'
import { HunterBattleSprite } from './HunterBattleSprite'
import { MonsterBattleSprite } from './MonsterBattleSprite'
import type { ActorMotionType, TargetReactionType } from '../../lib/skillMotionPresets'

type Props = {
  actor: BattleActorViewModel
  compact?: boolean
  activeMotion?: ActorMotionType
  hitReaction?: TargetReactionType
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

export function BattleActorSprite({ 
  actor, 
  compact = false,
  activeMotion = 'default',
  hitReaction = 'none',
}: Props) {
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

  // Dynamic values based on motion presets to mimic " 준비 -> 돌격 -> 충돌(Hit Stop) -> 회귀 "
  let activeX: number[] = [0, actor.team === 'ally' ? 32 : -32, 0]
  let activeY: number[] = [0, 0, 0]
  let activeScale: number[] = [1, 1.15, 1]
  let activeRotate: number[] = [0, 0, 0]
  let activeOpacity: number[] = [1, 1, 1]
  let activeTimes: number[] = [0, 0.22, 0.72, 1] // Extended middle holds for Hit Stop!
  let activeDuration = 0.44

  if (activeMotion === 'dash-slash') {
    activeX = actor.team === 'ally' ? [0, 52, 0] : [0, -52, 0]
    activeRotate = actor.team === 'ally' ? [0, 12, 0] : [0, -12, 0]
    activeTimes = [0, 0.18, 0.68, 1]
    activeDuration = 0.38
  } else if (activeMotion === 'heavy-lunge') {
    activeY = actor.team === 'ally' ? [0, -48, -55, 0] : [0, 48, 55, 0]
    activeX = actor.team === 'ally' ? [0, 24, 28, 0] : [0, -24, -28, 0]
    activeScale = [1, 1.25, 1.25, 1]
    activeTimes = [0, 0.24, 0.74, 1]
    activeDuration = 0.48
  } else if (activeMotion === 'cast-hold') {
    // Mage: Float gently and charge kinetic energy during 45% cast time, burst at 55%
    activeY = [0, -22, -22, 0]
    activeScale = [1, 1.15, 1.15, 1]
    activeTimes = [0, 0.45, 0.85, 1]
    activeDuration = 0.72
  } else if (activeMotion === 'guard-raise') {
    activeX = actor.team === 'ally' ? [0, 10, 0] : [0, -10, 0]
    activeScale = [1, 1.06, 1]
    activeRotate = actor.team === 'ally' ? [0, -5, 0] : [0, 5, 0]
    activeTimes = [0, 0.2, 0.7, 1]
    activeDuration = 0.4
  } else if (activeMotion === 'afterimage-strike') {
    // Tracker: Vanish near-completely (opacity 0.05) and appear on side-step instantly
    activeX = actor.team === 'ally' ? [0, 68, 0] : [0, -68, 0]
    activeOpacity = [1, 0.05, 0.05, 1]
    activeTimes = [0, 0.15, 0.65, 1]
    activeDuration = 0.35
  } else if (activeMotion === 'command-cast') {
    // Tactician: Raise arm, command glyph pulses for 45% timing
    activeY = [0, -14, 0]
    activeScale = [1, 1.12, 1]
    activeTimes = [0, 0.45, 0.8, 1]
    activeDuration = 0.6
  } else if (activeMotion === 'vanish-shadow-strike') {
    // Hidden Shadow: Vanish 100% into shadow mist (opacity 0) for 35% prepare, then execute
    activeX = actor.team === 'ally' ? [0, 65, 0] : [0, -65, 0]
    activeOpacity = [1, 0, 0, 1]
    activeTimes = [0, 0.35, 0.85, 1]
    activeDuration = 0.55
  } else if (activeMotion === 'curse-cast') {
    // Hidden Curse: Dark blood curse ritual hover vibration
    activeY = [0, -12, 0]
    activeRotate = [0, 6, -6, 0]
    activeTimes = [0, 0.5, 0.85, 1]
    activeDuration = 0.68
  } else if (activeMotion === 'rift-step') {
    // Hidden Rift: Distort space, compress horizontally (scaleX 0.05) to warp adjacent to target
    activeX = actor.team === 'ally' ? [0, 62, 0] : [0, -62, 0]
    activeScale = [1, 0.05, 1.25, 1]
    activeOpacity = [1, 0.05, 0.95, 1]
    activeTimes = [0, 0.45, 0.85, 1]
    activeDuration = 0.64
  } else if (activeMotion === 'hostile-heavy') {
    activeX = actor.team === 'ally' ? [0, 60, 0] : [0, -60, 0]
    activeY = [0, 14, -14, 0]
    activeScale = [1, 1.3, 1]
    activeTimes = [0, 0.26, 0.76, 1]
    activeDuration = 0.56
  } else if (activeMotion === 'hostile-normal') {
    activeX = actor.team === 'ally' ? [0, 35, 0] : [0, -35, 0]
    activeScale = [1, 1.12, 1]
    activeTimes = [0, 0.2, 0.7, 1]
    activeDuration = 0.4
  }

  // Target reaction shake/recoil configs to emulate real impact physics
  let reactX: number[] = [0, -6, 6, -4, 4, 0]
  let reactY: number[] = [0, 0, 0]
  let reactScale: number[] = [1, 1.04, 1]
  let reactRotate: number[] = [0, 0, 0]
  let reactTimes: number[] = [0, 0.15, 0.35, 0.55, 0.75, 1]
  let reactDuration = 0.44

  if (hitReaction === 'quick-hit-shake') {
    reactX = [0, -9, 9, -6, 6, -3, 3, 0]
    reactTimes = [0, 0.12, 0.28, 0.44, 0.6, 0.76, 0.92, 1]
    reactDuration = 0.38
  } else if (hitReaction === 'heavy-recoil') {
    reactX = actor.team === 'ally' ? [0, -42, -48, -12, 0] : [0, 42, 48, 12, 0]
    reactRotate = actor.team === 'ally' ? [0, -15, -18, -4, 0] : [0, 15, 18, 4, 0]
    reactScale = [1, 0.94, 0.94, 0.98, 1]
    reactTimes = [0, 0.15, 0.65, 0.85, 1]
    reactDuration = 0.48
  } else if (hitReaction === 'magic-hit-shake') {
    // Mage target stays idle during 45% cast time, then shakes intensely when burst occurs
    reactX = [0, 0, -12, 12, -8, 8, 0]
    reactY = [0, 0, -18, 18, -10, 10, 0]
    reactScale = [1, 1, 1.15, 0.95, 1]
    reactTimes = [0, 0.45, 0.6, 0.75, 0.9, 1]
    reactDuration = 0.72
  } else if (hitReaction === 'guard-block') {
    reactX = actor.team === 'ally' ? [0, -4, 0] : [0, 4, 0]
    reactScale = [1, 0.97, 1]
    reactTimes = [0, 0.15, 0.75, 1]
    reactDuration = 0.4
  } else if (hitReaction === 'fast-stagger') {
    reactX = actor.team === 'ally' ? [0, -18, 0] : [0, 18, 0]
    reactRotate = actor.team === 'ally' ? [0, -6, 0] : [0, 6, 0]
    reactDuration = 0.35
  } else if (hitReaction === 'buff-debuff-pulse') {
    reactScale = [1, 1.18, 1]
    reactDuration = 0.6
  } else if (hitReaction === 'dark-flash-shake') {
    // Hidden Shadow: Target dim-shred flash recoil occurs starting at 35% vanish step
    reactX = actor.team === 'ally' ? [0, 0, -48, -54, -12, 0] : [0, 0, 48, 54, 12, 0]
    reactRotate = actor.team === 'ally' ? [0, 0, -22, -25, -5, 0] : [0, 0, 22, 25, 5, 0]
    reactScale = [1, 1, 0.85, 0.85, 0.95, 1]
    reactTimes = [0, 0.35, 0.5, 0.7, 0.88, 1]
    reactDuration = 0.55
  } else if (hitReaction === 'curse-flicker-stagger') {
    // Hidden Curse: Crimson seal pulses for 40% time, then target corrodes and staggered
    reactX = [0, 0, -8, 8, -6, 6, 0]
    reactY = [0, 0, 9, -9, 5, -5, 0]
    reactScale = [1, 1.05, 0.92, 0.92, 0.98, 1]
    reactTimes = [0, 0.4, 0.55, 0.7, 0.85, 0.95, 1]
    reactDuration = 0.68
  } else if (hitReaction === 'warp-shake') {
    // Hidden Rift: Space cracks at 45%, target gets sucked in (scale 0.72) and warped staggered
    reactScale = [1, 1, 0.72, 1.25, 1]
    reactX = [0, 0, -18, 18, 0]
    reactTimes = [0, 0.45, 0.6, 0.8, 1]
    reactDuration = 0.64
  } else if (hitReaction === 'boss-heavy-recoil') {
    reactX = [0, -14, 14, -10, 10, 0]
    reactY = [0, 8, -8, 0]
    reactDuration = 0.56
  }

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
      x: activeX,
      y: activeY,
      scale: activeScale,
      rotate: activeRotate,
      opacity: activeOpacity,
      filter: 'contrast(1.15) brightness(1.05)',
      transition: {
        duration: activeDuration,
        times: activeTimes,
        ease: 'easeOut',
      },
    },
    targeted: {
      x: reactX,
      y: reactY,
      scale: reactScale,
      rotate: reactRotate,
      opacity: 1,
      filter: 'contrast(1.05)',
      transition: {
        duration: reactDuration,
        times: reactTimes,
        ease: 'easeOut',
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

  // Signature Skill Presentation Pack 01: Prepare Overlay
  const renderPrepareEffect = () => {
    if (!activeMotion || activeMotion === 'default') return null

    let element: React.ReactNode = null

    if (activeMotion === 'dash-slash') {
      // Swordsman Prepare: 청백색 스파크 섬광 수축
      element = (
        <motion.div
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: [1.8, 0.7, 0], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.35, ease: 'easeIn' }}
          className="absolute inset-0 rounded-full border-4 border-cyan-400 filter blur-[1px] shadow-[0_0_15px_#22d3ee]"
        />
      )
    } else if (activeMotion === 'heavy-lunge') {
      // Warrior Prepare: 붉은/오렌지색 파워 축적
      element = (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.25, 0.9], opacity: [0, 0.8, 0.8, 0] }}
          transition={{ duration: 0.42 }}
          className="absolute inset-0 bg-gradient-to-t from-amber-600/30 via-red-500/40 to-transparent filter blur-sm"
        />
      )
    } else if (activeMotion === 'cast-hold') {
      // Mage Prepare: 캐스팅 룬 45% 캐스팅 전조 동안 압축 회전
      element = (
        <motion.div
          initial={{ scale: 0.5, rotate: 0, opacity: 0 }}
          animate={{ scale: [0.8, 1.25, 1.25, 0], rotate: [0, 180, 270, 360], opacity: [0, 0.95, 0.95, 0] }}
          transition={{ duration: 0.72, ease: 'easeOut' }}
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 border border-dashed border-indigo-400 rounded-full flex items-center justify-center bg-indigo-500/5 shadow-[0_0_10px_rgba(129,140,248,0.5)]"
        >
          <span className="text-[8px] text-indigo-200">🔮</span>
        </motion.div>
      )
    } else if (activeMotion === 'guard-raise') {
      // Guardian Prepare: 초록빛 방패 오라
      element = (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: [1, 1.12, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 0.38 }}
          className="absolute -inset-1 border-2 border-emerald-400/60 rounded-full bg-emerald-500/5 filter blur-[0.5px]"
        />
      )
    } else if (activeMotion === 'afterimage-strike') {
      // Tracker Prepare: 투명 잔상 기습 실루엣 흐려짐 강화
      element = (
        <motion.div
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: [0, 0.85, 0], scale: [1, 1.35, 1.6] }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 bg-emerald-400/20 rounded-full filter blur-md"
        />
      )
    } else if (activeMotion === 'command-cast') {
      // Tactician Prepare: 금빛 책 홀로그램
      element = (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.8, 1.15, 0.8], opacity: [0, 0.95, 0] }}
          transition={{ duration: 0.6 }}
          className="absolute -top-4 w-12 h-12 border-2 border-amber-400/40 rounded bg-amber-500/5 rotate-45 flex items-center justify-center"
        >
          <span className="text-[8px] text-amber-200 -rotate-45">📖</span>
        </motion.div>
      )
    } else if (activeMotion === 'vanish-shadow-strike') {
      // Hidden Shadow Prepare: 자색 어둠 안개 침강
      element = (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: [1, 1.45, 1.25, 0], opacity: [0, 0.95, 0.95, 0] }}
          transition={{ duration: 0.55 }}
          className="absolute inset-0 bg-purple-950/60 border border-purple-500/30 rounded-full filter blur-sm shadow-[0_0_15px_rgba(168,85,247,0.8)]"
        />
      )
    } else if (activeMotion === 'curse-cast') {
      // Hidden Curse Prepare: 붉은 균열 오라
      element = (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.25, 1], opacity: [0, 0.85, 0] }}
          transition={{ duration: 0.68 }}
          className="absolute inset-0 bg-red-950/45 border-2 border-red-500/35 rounded-full filter blur-[1px] shadow-[0_0_12px_rgba(239,68,68,0.7)]"
        />
      )
    } else if (activeMotion === 'rift-step') {
      // Hidden Rift Prepare: 공간 왜곡 지글거림
      element = (
        <motion.div
          initial={{ scaleX: 1, opacity: 0 }}
          animate={{ scaleX: [1, 0.1, 1.2, 1], opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.64 }}
          className="absolute inset-0 border-2 border-violet-400 bg-violet-500/10 rounded-full filter blur-xs shadow-[0_0_15px_rgba(139,92,246,0.6)]"
        />
      )
    } else if (activeMotion === 'hostile-heavy') {
      // Boss Prepare: 적색 해골 경고 오라
      element = (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [1, 1.45, 1.1], opacity: [0, 1, 0] }}
          transition={{ duration: 0.56 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 flex items-center justify-center z-30"
        >
          <div className="absolute inset-0 bg-red-600/10 rounded-full filter blur-md animate-ping" />
          <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(239,68,68,0.95)]">👹</span>
        </motion.div>
      )
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-25 overflow-visible">
        {element}
      </div>
    )
  }

  // Signature Skill Presentation Pack 01: Impact & Reaction Overlay
  const renderImpactEffect = () => {
    if (hitReaction === 'none') return null

    let element: React.ReactNode = null

    if (hitReaction === 'quick-hit-shake') {
      // Swordsman Impact: 청백 사선 베기 흔적
      element = (
        <motion.div
          initial={{ scaleX: 0.1, scaleY: 0.6, rotate: -30, opacity: 0 }}
          animate={{ scaleX: [0.1, 1.45, 0.2], scaleY: [0.6, 0.3, 0.1], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="absolute w-44 h-8 bg-gradient-to-r from-transparent via-cyan-200 to-transparent filter blur-[0.5px] shadow-[0_0_12px_#22d3ee] z-30"
        />
      )
    } else if (hitReaction === 'heavy-recoil') {
      // Warrior Impact: 발밑 충격파 균열
      element = (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.2, opacity: 1 }}
            animate={{ scale: [0.2, 1.7, 1.9], opacity: [1, 0.8, 0] }}
            transition={{ duration: 0.44, ease: 'easeOut' }}
            className="absolute w-36 h-36 rounded-full border-4 border-amber-500 bg-amber-950/20 filter blur-xs shadow-[0_0_20px_#f59e0b] z-20"
          />
          <motion.div
            initial={{ scale: 0.1, opacity: 1 }}
            animate={{ scale: [0.1, 1.2, 0], opacity: [1, 0.9, 0] }}
            transition={{ duration: 0.25 }}
            className="absolute w-16 h-16 rounded-full bg-white filter blur-[1px] z-30"
          />
        </div>
      )
    } else if (hitReaction === 'magic-hit-shake') {
      // Mage: Explodes with 45% (0.32s) delay synced with signature casting timing
      element = (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 0.3, 1.7, 1.9, 0], opacity: [0, 0, 1, 0.8, 0] }}
            transition={{ duration: 0.72, times: [0, 0.45, 0.6, 0.75, 1] }}
            className="absolute w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.7),transparent_70%)] filter blur-sm shadow-[0_0_25px_rgba(99,102,241,0.85)] z-30"
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ rotate: [0, 90], scale: [0.5, 0.5, 1.45, 0], opacity: [0, 0, 0.95, 0] }}
            transition={{ duration: 0.72, times: [0, 0.45, 0.7, 1] }}
            className="absolute w-20 h-20 border-2 border-dashed border-indigo-400 rounded-full"
          />
        </div>
      )
    } else if (hitReaction === 'guard-block') {
      // Guardian Impact: 에메랄드 헥사곤 보호막 Aegis Shield
      element = (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 1.15, 0.9], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.38, ease: 'easeOut' }}
          className="absolute w-24 h-24 border-3 border-emerald-400 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.7)] z-35 flex items-center justify-center font-black text-emerald-200"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            textShadow: '0 0 5px rgba(52,211,153,0.8)'
          }}
        >
          <span className="text-[10px] tracking-widest system-text">AEGIS</span>
        </motion.div>
      )
    } else if (hitReaction === 'fast-stagger') {
      // Tracker: 15% (0.05s) vanish strike delay, rendering quick X cuts on side-step
      element = (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scaleX: 0.1, rotate: 45, opacity: 0 }}
            animate={{ scaleX: [0.1, 0.1, 1.65, 0.2], opacity: [0, 0, 1, 0] }}
            transition={{ duration: 0.35, times: [0, 0.15, 0.45, 1] }}
            className="absolute w-36 h-4 bg-gradient-to-r from-transparent via-emerald-300 to-transparent filter blur-[0.5px] z-30"
          />
          <motion.div
            initial={{ scaleX: 0.1, rotate: -45, opacity: 0 }}
            animate={{ scaleX: [0.1, 0.1, 1.65, 0.2], opacity: [0, 0, 1, 0] }}
            transition={{ duration: 0.35, times: [0, 0.25, 0.55, 1] }}
            className="absolute w-36 h-4 bg-gradient-to-r from-transparent via-emerald-300 to-transparent filter blur-[0.5px] z-30"
          />
        </div>
      )
    } else if (hitReaction === 'buff-debuff-pulse') {
      // Tactician: Command glyph pulses for 45% timing on target, followed by gold command pulse aura
      element = (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Tactical Marker brackets */}
          <motion.div
            initial={{ scale: 0.2, rotate: 45, opacity: 0 }}
            animate={{ scale: [0.2, 1.25, 1.25, 0], rotate: [45, 45, 90, 90], opacity: [0, 0.95, 0.95, 0] }}
            transition={{ duration: 0.6, times: [0, 0.15, 0.45, 1] }}
            className="absolute w-22 h-22 border-3 border-amber-400 bg-amber-400/5 rounded-lg z-30 shadow-[0_0_18px_rgba(245,158,11,0.7)]"
            style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 0.8, 1.65, 1.85], opacity: [0, 0, 0.9, 0] }}
            transition={{ duration: 0.6, times: [0, 0.45, 0.75, 1] }}
            className="absolute w-28 h-28 rounded-full border-2 border-dashed border-amber-300 z-20"
          />
        </div>
      )
    } else if (hitReaction === 'dark-flash-shake') {
      // Hidden Shadow: Execution blade drops down at exactly 35% vanish step
      element = (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: [0, 0, 1.75, 0.2], opacity: [0, 0, 1, 0] }}
            transition={{ duration: 0.55, times: [0, 0.35, 0.55, 1] }}
            className="absolute w-8 h-44 bg-gradient-to-b from-transparent via-purple-950/90 to-transparent border-l border-purple-400/40 filter blur-[1px] z-30"
          />
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 0.4, 1.5, 1.75, 0], opacity: [0, 0, 0.9, 0.9, 0] }}
            transition={{ duration: 0.55, times: [0, 0.35, 0.6, 0.85, 1] }}
            className="absolute w-36 h-36 bg-[radial-gradient(circle,rgba(168,85,247,0.5),transparent_70%)] filter blur-md z-20"
          />
        </div>
      )
    } else if (hitReaction === 'curse-flicker-stagger') {
      // Hidden Curse: Brand seal pulses for 40% time, then target shatters in crimson flakes
      element = (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.25, 1.05, 1.35, 0], opacity: [0, 1, 0.85, 1, 0] }}
            transition={{ duration: 0.68, times: [0, 0.15, 0.4, 0.55, 1] }}
            className="absolute w-20 h-20 border-2 border-dashed border-red-600 rounded-full flex items-center justify-center bg-red-950/10 shadow-[0_0_15px_rgba(239,68,68,0.8)] z-30"
          >
            <span className="text-xl text-red-500 filter drop-shadow-[0_0_4px_red] animate-pulse">🩸</span>
          </motion.div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 0.8, 1.45, 0], opacity: [0, 0, 0.85, 0] }}
            transition={{ duration: 0.68, times: [0, 0.4, 0.7, 1] }}
            className="absolute w-28 h-28 bg-[radial-gradient(circle,rgba(239,68,68,0.45),transparent_70%)] filter blur-sm z-20"
          />
        </div>
      )
    } else if (hitReaction === 'warp-shake') {
      // Hidden Rift: Rift dimensional crack distortion opens at 45% time, sucking target in
      element = (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.4, rotate: 0, opacity: 0 }}
            animate={{ scale: [0.4, 1.35, 1.35, 0], rotate: [0, 90, 120, 180], opacity: [0, 0.95, 0.95, 0] }}
            transition={{ duration: 0.64, times: [0, 0.25, 0.45, 1] }}
            className="absolute w-28 h-28 border-2 border-violet-500 bg-violet-600/10 rounded-full filter blur-xs shadow-[0_0_20px_rgba(139,92,246,0.85)] z-30"
          />
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 0.2, 1.35, 0], opacity: [0, 0, 1, 0] }}
            transition={{ duration: 0.64, times: [0, 0.45, 0.75, 1] }}
            className="absolute w-16 h-16 border-3 border-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.7)] z-35"
          />
        </div>
      )
    } else if (hitReaction === 'boss-heavy-recoil') {
      // Boss hostile impact: 큰 적색 충격파
      element = (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.2, opacity: 1 }}
            animate={{ scale: [0.2, 1.8, 2.1], opacity: [1, 0.8, 0] }}
            transition={{ duration: 0.56, ease: 'easeOut' }}
            className="absolute w-44 h-44 rounded-full border-6 border-rose-600 bg-rose-950/20 filter blur-xs shadow-[0_0_30px_#ef4444] z-20"
          />
        </div>
      )
    }

    return (
      <div className="absolute inset-0 pointer-events-none z-35 overflow-visible flex items-center justify-center">
        {element}
      </div>
    )
  }

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

      {/* Prepare Effect (Signature Prepare Visuals) */}
      {renderPrepareEffect()}

      {/* Impact/Reaction Effect (Signature Impact Visuals) */}
      {renderImpactEffect()}

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
