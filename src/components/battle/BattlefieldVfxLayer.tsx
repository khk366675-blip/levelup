import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import effectSlash from '../../assets/effects/effect-slash.png'
import effectBurst from '../../assets/effects/effect-burst.png'
import effectShockwave from '../../assets/effects/effect-shockwave.png'

export type VfxType = 'attack' | 'skill' | 'magic' | 'shadow' | 'curse' | 'heal' | 'guard'

interface BattlefieldVfx {
  id: string
  type: VfxType
  targetX?: number // Coordinate offsets
  targetY?: number
  actorRole?: string // Acting actor's job/role
  isBoss?: boolean   // Acting actor's boss status
}

type Props = {
  vfxs: BattlefieldVfx[]
}

// 9-way Job Lineage Visual Theme Resolver
function getVfxTheme(role?: string): 'swordsman' | 'warrior' | 'mage' | 'guardian' | 'tracker' | 'tactician' | 'hidden-shadow' | 'hidden-curse' | 'hidden-rift' | 'default' {
  if (!role) return 'default'
  const id = role.toLowerCase()
  
  if (id.includes('shadow') || id.includes('abyss-summoner') || id.includes('phantom-general') || id.includes('disciple') || id.includes('lord')) {
    return 'hidden-shadow'
  }
  if (id.includes('curse')) {
    return 'hidden-curse'
  }
  if (id.includes('rift') || id.includes('dimension')) {
    return 'hidden-rift'
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
    return 'swordsman'
  }
  if (
    id === 'warrior' ||
    id.includes('berserker') ||
    id.includes('slayer') ||
    id.includes('dragon-knight') ||
    id.includes('immortal')
  ) {
    return 'warrior'
  }
  if (
    id.includes('mage') ||
    id.includes('chronomancer') ||
    id.includes('time-governor') ||
    id.includes('entropy') ||
    id.includes('wizard')
  ) {
    return 'mage'
  }
  if (
    id.includes('guardian') ||
    id.includes('paladin') ||
    id.includes('shield') ||
    id.includes('holy-redeemer') ||
    id.includes('judgment-knight')
  ) {
    return 'guardian'
  }
  if (
    id.includes('scout') ||
    id.includes('stalker') ||
    id.includes('tracker') ||
    id.includes('assassin') ||
    id.includes('phantom-stalker') ||
    id.includes('abyss-emperor')
  ) {
    return 'tracker'
  }
  if (
    id.includes('tactician') ||
    id.includes('strategist') ||
    id.includes('alchemist') ||
    id.includes('chimera') ||
    id.includes('weaver') ||
    id.includes('orchestrator')
  ) {
    return 'tactician'
  }
  return 'default'
}

export function BattlefieldVfxLayer({ vfxs }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[125] overflow-hidden">
      {/* SVG Neon Glow Filters Definition */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="vfx-glow-heavy" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 1.8 0" in="blur1" result="glow1" />
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.8 0" in="blur2" result="glow2" />
            <feMerge>
              <feMergeNode in="glow2" />
              <feMergeNode in="glow1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="vfx-glow-medium" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 1.4 0" in="blur" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <AnimatePresence>
        {vfxs.map(vfx => {
          const isAttack = vfx.type === 'attack'
          const isSkill = vfx.type === 'skill'
          const isMagic = vfx.type === 'magic'
          const isShadow = vfx.type === 'shadow'
          const isCurse = vfx.type === 'curse'
          const isHeal = vfx.type === 'heal'
          const isGuard = vfx.type === 'guard'
          
          const theme = getVfxTheme(vfx.actorRole)
          const isBossAction = vfx.isBoss

          // Get primary theme color for color styling
          const themeColor = isBossAction ? "#f43f5e" :
            theme === 'swordsman' ? "#22d3ee" :
            theme === 'warrior' ? "#f59e0b" :
            theme === 'tracker' ? "#10b981" :
            theme === 'mage' ? "#818cf8" :
            theme === 'guardian' ? "#34d399" :
            theme === 'tactician' ? "#fbbf24" :
            theme === 'hidden-shadow' ? "#a855f7" :
            theme === 'hidden-curse' ? "#ef4444" :
            theme === 'hidden-rift' ? "#c084fc" : "#ffffff"

          return (
            <motion.div
              key={vfx.id}
              initial={{ opacity: 0, scale: 0.55 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.42, ease: 'easeOut' }}
              className="absolute flex items-center justify-center"
              style={{
                left: vfx.targetX !== undefined ? `${vfx.targetX}%` : '50%',
                top: vfx.targetY !== undefined ? `${vfx.targetY}%` : '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* 1. Attack / Slash / Strike Effect (Multi-layered shockwave & glowing slash path) */}
              {isAttack && (
                <div className="relative flex items-center justify-center w-40 h-40">
                  {/* B안 테스트: 참격 이미지 추가 연출 (모든 일반공격 시 참격 투사 및 크기 1.5배 거대화) */}
                  <motion.img
                    src={effectSlash}
                    alt="slash-vfx"
                    initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                    animate={{ scale: [0.6, 1.45, 1.55, 1.6], rotate: [-45, 10, 20, 25], opacity: [0, 1, 0.8, 0] }}
                    transition={{ duration: 0.72, ease: 'easeOut', times: [0, 0.15, 0.75, 1] }}
                    className="absolute w-64 h-64 object-contain pointer-events-none z-30"
                    style={{ mixBlendMode: 'screen', filter: 'brightness(1.45) contrast(1.2) drop-shadow(0 0 16px rgba(34, 211, 238, 0.8))' }}
                  />
                  
                  {/* B안 테스트: 충격파 링 이미지 추가 연출 (크기 거대화) */}
                  <motion.img
                    src={effectShockwave}
                    alt="shockwave-vfx"
                    initial={{ scale: 0.3, rotate: 0, opacity: 0 }}
                    animate={{ scale: [0.4, 1.4, 1.6, 1.7], rotate: [0, 10, 15, 20], opacity: [0, 0.95, 0.7, 0] }}
                    transition={{ duration: 0.64, ease: 'easeOut', times: [0, 0.18, 0.8, 1] }}
                    className="absolute w-56 h-56 object-contain pointer-events-none z-20"
                    style={{ mixBlendMode: 'screen', filter: 'brightness(1.35) contrast(1.15) drop-shadow(0 0 12px rgba(34, 211, 238, 0.6))' }}
                  />
                  {/* Shockwave Ring Layer 1 (Wide thin expansion) */}
                  <motion.div
                    initial={{ scale: 0.2, opacity: 1 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={clsx(
                      "absolute w-28 h-28 rounded-full border-4 filter blur-[0.5px]",
                      isBossAction 
                        ? "border-rose-500 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.9)]" 
                        : theme === 'swordsman'
                        ? "border-cyan-300 bg-cyan-950/10 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                        : theme === 'warrior'
                        ? "border-amber-400 bg-amber-950/10 shadow-[0_0_25px_rgba(245,158,11,0.8)]"
                        : theme === 'tracker'
                        ? "border-emerald-300 bg-emerald-950/10 shadow-[0_0_20px_rgba(52,211,153,0.8)]"
                        : "border-white bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                    )}
                  />
                  
                  {/* Shockwave Ring Layer 2 (Faster tighter neon glow ring) */}
                  <motion.div
                    initial={{ scale: 0.1, opacity: 0.9 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{ duration: 0.22, delay: 0.03, ease: "easeOut" }}
                    className={clsx(
                      "absolute w-28 h-28 rounded-full border-[6px]",
                      isBossAction ? "border-rose-400" :
                      theme === 'swordsman' ? "border-cyan-200" :
                      theme === 'warrior' ? "border-amber-300" :
                      theme === 'tracker' ? "border-emerald-200" : "border-white"
                    )}
                    style={{ filter: 'url(#vfx-glow-medium)' }}
                  />

                  {/* Core central flash */}
                  <motion.div
                    initial={{ scale: 0.15, opacity: 1 }}
                    animate={{ scale: [1.3, 0], opacity: [1, 0] }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute w-12 h-12 bg-white rounded-full filter blur-[1px] z-10"
                    style={{ boxShadow: `0 0 20px ${themeColor}` }}
                  />

                  {/* SVG Container: Dynamic Slash Arc and Spark Bursts */}
                  <svg width="220" height="220" viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none overflow-visible">
                    {/* Glowing Slash Arc (Slice trajectory) */}
                    <motion.path
                      d="M 15 85 Q 48 24 85 15"
                      fill="none"
                      stroke={
                        isBossAction ? "#fda4af" :
                        theme === 'swordsman' ? "#67e8f9" :
                        theme === 'warrior' ? "#fcd34d" :
                        theme === 'tracker' ? "#6ee7b7" : "#ffffff"
                      }
                      strokeWidth="6.5"
                      strokeLinecap="round"
                      filter="url(#vfx-glow-heavy)"
                      initial={{ pathLength: 0, opacity: 1 }}
                      animate={{ pathLength: [0, 1, 1], pathOffset: [0, 0, 1], opacity: [0, 1, 0] }}
                      transition={{ duration: 0.26, ease: "easeInOut" }}
                    />

                    {/* Staggered Spark Eruption (18 Particles) */}
                    {Array.from({ length: 18 }).map((_, i) => {
                      const angle = (i * 20 + (i % 3) * 7) * (Math.PI / 180)
                      const radius = 38 + (i % 4) * 9
                      const x2 = 50 + Math.cos(angle) * radius
                      const y2 = 50 + Math.sin(angle) * radius
                      
                      const isPolygon = i % 4 === 0
                      const isLine = i % 4 === 1
                      
                      if (isPolygon) {
                        // Diamond shard particle
                        const pts = `50,50 52.5,47.5 50,45 47.5,47.5`
                        const moveX = Math.cos(angle) * radius
                        const moveY = Math.sin(angle) * radius
                        return (
                          <motion.polygon
                            key={i}
                            points={pts}
                            fill={themeColor}
                            filter="url(#vfx-glow-medium)"
                            animate={{
                              transform: [`translate(0px, 0px) rotate(0deg) scale(1.5)`, `translate(${moveX}px, ${moveY}px) rotate(${i * 80}deg) scale(0)`]
                            }}
                            transition={{
                              duration: 0.35,
                              ease: "easeOut",
                              delay: (i % 4) * 0.015
                            }}
                          />
                        )
                      }
                      
                      if (isLine) {
                        // Laser spark ray
                        return (
                          <motion.line
                            key={i}
                            x1="50" y1="50" x2="50" y2="50"
                            stroke={themeColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            filter="url(#vfx-glow-medium)"
                            animate={{
                              x1: [50, 50 + Math.cos(angle) * (radius - 10)],
                              y1: [50, 50 + Math.sin(angle) * (radius - 10)],
                              x2: [50, x2],
                              y2: [50, y2],
                              opacity: [1, 1, 0]
                            }}
                            transition={{
                              duration: 0.3,
                              ease: "easeOut",
                              delay: (i % 4) * 0.01
                            }}
                          />
                        )
                      }

                      return (
                        <motion.circle
                          key={i}
                          cx="50"
                          cy="50"
                          r={(i % 3 === 0) ? 4.5 : 2.5}
                          fill={themeColor}
                          filter="url(#vfx-glow-medium)"
                          animate={{
                            cx: [50, x2],
                            cy: [50, y2],
                            opacity: [1, 1, 0],
                            scale: [1.6, 0.7, 0]
                          }}
                          transition={{ 
                            duration: 0.32, 
                            ease: "easeOut",
                            delay: (i % 4) * 0.012
                          }}
                        />
                      )
                    })}
                  </svg>
                </div>
              )}

              {/* 2. Skill Burst / Blast / Sigil (Theme-differentiated SVG Masterpieces) */}
              {isSkill && (
                <div className="relative flex items-center justify-center w-40 h-40">
                  {/* B안 테스트: 스킬 발동 시 마력 폭발 이미지 추가 (크기 거대화) */}
                  <motion.img
                    src={effectBurst}
                    alt="burst-vfx"
                    initial={{ scale: 0.5, rotate: 0, opacity: 0 }}
                    animate={{ scale: [0.6, 1.6, 1.8, 1.95], rotate: [0, 45, 75, 90], opacity: [0, 1, 0.85, 0] }}
                    transition={{ duration: 0.96, ease: 'easeOut', times: [0, 0.2, 0.8, 1] }}
                    className="absolute w-72 h-72 object-contain pointer-events-none z-30"
                    style={{ mixBlendMode: 'screen', filter: 'brightness(1.5) contrast(1.25) drop-shadow(0 0 20px rgba(129, 140, 248, 0.85))' }}
                  />

                  {/* B안 테스트: 스킬 피격 시 충격파 링 이미지 추가 (크기 거대화) */}
                  <motion.img
                    src={effectShockwave}
                    alt="shockwave-vfx"
                    initial={{ scale: 0.3, rotate: 0, opacity: 0 }}
                    animate={{ scale: [0.4, 1.6, 1.75, 1.85], rotate: [0, -15, -25, -30], opacity: [0, 0.95, 0.7, 0] }}
                    transition={{ duration: 0.82, ease: 'easeOut', times: [0, 0.18, 0.8, 1] }}
                    className="absolute w-60 h-60 object-contain pointer-events-none z-20"
                    style={{ mixBlendMode: 'screen', filter: 'brightness(1.4) contrast(1.2) drop-shadow(0 0 16px rgba(34, 211, 238, 0.65))' }}
                  />
                  {isBossAction ? (
                    // 2.1 Boss Action: Ground-cracking Crimson Doom Ritual
                    <>
                      <motion.div
                        animate={{ scale: [0.5, 1.5, 1.7], rotate: [0, -90] }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-full border-4 border-rose-600 bg-rose-950/20 opacity-30 filter blur-sm shadow-[0_0_35px_rgba(244,63,94,0.95)]"
                      />
                      <svg width="240" height="240" viewBox="0 0 120 120" className="absolute pointer-events-none overflow-visible">
                        {/* Doom Runes */}
                        <motion.circle
                          cx="60" cy="60" r="48"
                          fill="none" stroke="#f43f5e" strokeWidth="2.5"
                          strokeDasharray="4, 16, 28, 4"
                          filter="url(#vfx-glow-heavy)"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                        {/* Cracking Rift Lines */}
                        {[-60, -30, 0, 30, 60].map((deg, index) => {
                          const rad = (deg * Math.PI) / 180
                          const x2 = 60 + Math.sin(rad) * 55
                          const y2 = 60 - Math.cos(rad) * 55
                          return (
                            <motion.path
                              key={index}
                              d={`M 60,60 L ${60 + (x2 - 60) * 0.4},${60 + (y2 - 60) * 0.4} L ${60 + (x2 - 60) * 0.8},${60 + (y2 - 60) * 0.7} L ${x2},${y2}`}
                              fill="none" stroke="#f43f5e" strokeWidth="3.5"
                              strokeLinecap="round" strokeLinejoin="round"
                              filter="url(#vfx-glow-heavy)"
                              initial={{ pathLength: 0, opacity: 1 }}
                              animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                              transition={{ duration: 0.48, ease: "easeOut", delay: index * 0.02 }}
                            />
                          )
                        })}
                        {/* Doom Shards */}
                        {Array.from({ length: 16 }).map((_, i) => {
                          const a = i * 22.5 * (Math.PI / 180)
                          const radVal = 40 + (i % 3) * 15
                          const tx = Math.cos(a) * radVal
                          const ty = Math.sin(a) * radVal
                          return (
                            <motion.polygon
                              key={i}
                              points="60,60 63,55 60,52 57,55"
                              fill="#fda4af"
                              filter="url(#vfx-glow-medium)"
                              animate={{
                                transform: [`translate(0px, 0px) scale(1.6)`, `translate(${tx}px, ${ty}px) rotate(${i * 45}deg) scale(0)`]
                              }}
                              transition={{ duration: 0.5, ease: "easeOut", delay: (i % 3) * 0.02 }}
                            />
                          )
                        })}
                      </svg>
                    </>
                  ) : theme === 'hidden-shadow' ? (
                    // 2.2 Shadow Hidden: Dark Abyssal Void Vortex
                    <>
                      <motion.div
                        animate={{ scale: [0.6, 1.5], opacity: [0.9, 0] }}
                        transition={{ duration: 0.52 }}
                        className="absolute inset-0 bg-[radial-gradient(circle,rgba(168,85,247,0.5),rgba(0,0,0,0.95)_70%,transparent_95%)] rounded-full filter blur-md"
                      />
                      <svg width="220" height="220" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                        {/* Abyssal Swirling Spirals */}
                        {[0, 120, 240].map((offset, i) => (
                          <motion.path
                            key={i}
                            d="M 50,50 Q 65,30 80,45 T 50,85 T 15,50 T 50,15"
                            fill="none" stroke="#a855f7" strokeWidth="3.5"
                            strokeLinecap="round"
                            filter="url(#vfx-glow-heavy)"
                            animate={{ rotate: [offset, offset + 360], scale: [0.5, 1.25, 0] }}
                            transition={{ duration: 0.52, ease: "easeInOut" }}
                          />
                        ))}
                        {/* Shadow tendril lines */}
                        {Array.from({ length: 8 }).map((_, i) => {
                          const angle = i * 45 * (Math.PI / 180)
                          const radVal = 55
                          const cpX = 50 + Math.cos(angle + 0.3) * 30
                          const cpY = 50 + Math.sin(angle + 0.3) * 30
                          const targetX = 50 + Math.cos(angle) * radVal
                          const targetY = 50 + Math.sin(angle) * radVal
                          return (
                            <motion.path
                              key={i}
                              d={`M 50,50 Q ${cpX},${cpY} ${targetX},${targetY}`}
                              fill="none" stroke="#d8b4fe" strokeWidth="2"
                              strokeLinecap="round"
                              filter="url(#vfx-glow-medium)"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1, opacity: [1, 0.8, 0] }}
                              transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.02 }}
                            />
                          )
                        })}
                      </svg>
                    </>
                  ) : theme === 'hidden-curse' ? (
                    // 2.3 Curse Hidden: Crimson Blood Curse Ritual Seal
                    <>
                      <motion.div
                        animate={{ scale: [0.5, 1.4], opacity: [0.9, 0] }}
                        transition={{ duration: 0.44 }}
                        className="absolute inset-0 bg-[radial-gradient(circle,rgba(239,68,68,0.5),transparent_75%)] rounded-full filter blur-sm"
                      />
                      <svg width="200" height="200" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                        {/* Pentagram Geometric Lines */}
                        <motion.polygon
                          points="50,15 82,75 18,75"
                          fill="none" stroke="#ef4444" strokeWidth="2"
                          filter="url(#vfx-glow-heavy)"
                          animate={{ rotate: 180, scale: [0.5, 1.2] }}
                          transition={{ duration: 0.44 }}
                        />
                        <motion.polygon
                          points="50,85 82,25 18,25"
                          fill="none" stroke="#ef4444" strokeWidth="2"
                          filter="url(#vfx-glow-heavy)"
                          animate={{ rotate: -180, scale: [0.5, 1.2] }}
                          transition={{ duration: 0.44 }}
                        />
                        <motion.circle
                          cx="50" cy="50" r="38"
                          fill="none" stroke="#b91c1c" strokeWidth="3"
                          strokeDasharray="8, 6"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.5, ease: "linear" }}
                        />
                        {/* Blood bubbles rising */}
                        {Array.from({ length: 14 }).map((_, i) => {
                          const dx = -20 + (i % 5) * 10
                          const dy = -45 - (i % 3) * 10
                          return (
                            <motion.circle
                              key={i}
                              cx={50 + dx}
                              cy="50"
                              r={1.5 + (i % 3)}
                              fill="#f87171"
                              filter="url(#vfx-glow-medium)"
                              animate={{
                                y: [0, dy],
                                opacity: [0, 1, 1, 0],
                                scale: [0.8, 1.3, 0.4]
                              }}
                              transition={{ duration: 0.55, ease: "easeOut", delay: (i % 4) * 0.03 }}
                            />
                          )
                        })}
                      </svg>
                    </>
                  ) : theme === 'hidden-rift' ? (
                    // 2.4 Rift Hidden: Spatial Lightning Dimension Crack
                    <>
                      <motion.div
                        animate={{ scale: [0.6, 1.5], rotate: [0, 120] }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 border border-violet-500 bg-violet-600/5 rounded-full opacity-30 filter blur-xs"
                      />
                      <svg width="220" height="220" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                        {/* Spatial Distortion Distortion Rings */}
                        {[0, 0.08, 0.16].map((del, i) => (
                          <motion.circle
                            key={i}
                            cx="50" cy="50" r="40"
                            fill="none" stroke="#a855f7" strokeWidth={4 - i}
                            filter="url(#vfx-glow-heavy)"
                            initial={{ scale: 0.2, opacity: 1 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 0.45, delay: del, ease: "easeOut" }}
                          />
                        ))}
                        {/* Zigzag Lightning Crack path */}
                        <motion.path
                          d="M 12,50 L 32,42 L 48,64 L 68,36 L 88,50"
                          fill="none" stroke="#22d3ee" strokeWidth="4.5"
                          strokeLinecap="round" strokeLinejoin="round"
                          filter="url(#vfx-glow-heavy)"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                          transition={{ duration: 0.42, ease: "easeInOut" }}
                        />
                        <motion.path
                          d="M 12,50 L 32,42 L 48,64 L 68,36 L 88,50"
                          fill="none" stroke="#ffffff" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                          transition={{ duration: 0.42, ease: "easeInOut" }}
                        />
                      </svg>
                    </>
                  ) : theme === 'swordsman' ? (
                    // 2.5 Swordsman: Swift Dual Neon X-Slash
                    <svg width="240" height="240" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                      {/* Slash 1 (Diagonal Left) */}
                      <motion.path
                        d="M 15,15 Q 50,50 85,85"
                        fill="none" stroke="#22d3ee" strokeWidth="5.5"
                        strokeLinecap="round"
                        filter="url(#vfx-glow-heavy)"
                        initial={{ pathLength: 0, opacity: 1 }}
                        animate={{ pathLength: [0, 1, 1], pathOffset: [0, 0, 1], opacity: [0, 1, 0] }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                      />
                      {/* Slash 2 (Diagonal Right) */}
                      <motion.path
                        d="M 85,15 Q 50,50 15,85"
                        fill="none" stroke="#22d3ee" strokeWidth="5.5"
                        strokeLinecap="round"
                        filter="url(#vfx-glow-heavy)"
                        initial={{ pathLength: 0, opacity: 1 }}
                        animate={{ pathLength: [0, 1, 1], pathOffset: [0, 0, 1], opacity: [0, 1, 0] }}
                        transition={{ duration: 0.28, ease: "easeInOut", delay: 0.06 }}
                      />
                      {/* Diamond Sword Qi Sparks */}
                      {Array.from({ length: 14 }).map((_, i) => {
                        const a = i * 25.7 * (Math.PI / 180)
                        const radVal = 30 + (i % 3) * 12
                        const tx = Math.cos(a) * radVal
                        const ty = Math.sin(a) * radVal
                        return (
                          <motion.polygon
                            key={i}
                            points="50,50 53,46 50,42 47,46"
                            fill="#e0f7fa"
                            filter="url(#vfx-glow-medium)"
                            animate={{
                              transform: [`translate(0px, 0px) scale(1.4)`, `translate(${tx}px, ${ty}px) rotate(${i * 90}deg) scale(0)`]
                            }}
                            transition={{ duration: 0.38, ease: "easeOut", delay: (i % 3) * 0.02 }}
                          />
                        )
                      })}
                    </svg>
                  ) : theme === 'warrior' ? (
                    // 2.6 Warrior: Crimson Ground Eruption Magma Blast
                    <>
                      <motion.div
                        animate={{ scale: [0.6, 1.45], opacity: [0.9, 0] }}
                        transition={{ duration: 0.45 }}
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600/30 via-amber-500/40 to-transparent filter blur-md"
                      />
                      <svg width="220" height="220" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                        {/* Shockwaves */}
                        {[0, 0.08, 0.16].map((del, i) => (
                          <motion.circle
                            key={i}
                            cx="50" cy="50" r="36"
                            fill="none" stroke="#f59e0b" strokeWidth={5 - i}
                            filter="url(#vfx-glow-heavy)"
                            initial={{ scale: 0.2, opacity: 1 }}
                            animate={{ scale: 1.65, opacity: 0 }}
                            transition={{ duration: 0.44, delay: del, ease: "easeOut" }}
                          />
                        ))}
                        {/* Magma Embers (Polygon shapes exploding) */}
                        {Array.from({ length: 18 }).map((_, i) => {
                          const angle = (i * 20 + (i % 3) * 9) * (Math.PI / 180)
                          const radVal = 40 + (i % 4) * 12
                          const tx = Math.cos(angle) * radVal
                          const ty = Math.sin(angle) * radVal
                          return (
                            <motion.polygon
                              key={i}
                              points="50,50 54,45 50,40 46,45"
                              fill={i % 2 === 0 ? "#ef4444" : "#f59e0b"}
                              filter="url(#vfx-glow-medium)"
                              animate={{
                                transform: [`translate(0px, 0px) scale(1.6)`, `translate(${tx}px, ${ty}px) rotate(${i * 45}deg) scale(0)`]
                              }}
                              transition={{ duration: 0.46, ease: "easeOut", delay: (i % 4) * 0.012 }}
                            />
                          )
                        })}
                      </svg>
                    </>
                  ) : theme === 'mage' ? (
                    // 2.7 Mage: Ancient Double-Circle Magic Sigil
                    <>
                      <svg width="220" height="220" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                        {/* Outer Runes ring */}
                        <motion.circle
                          cx="50" cy="50" r="43"
                          fill="none" stroke="#818cf8" strokeWidth="1.8"
                          strokeDasharray="6, 8, 20, 4"
                          filter="url(#vfx-glow-heavy)"
                          animate={{ rotate: 360, scale: [0.6, 1.25, 0] }}
                          transition={{ duration: 0.58, ease: "easeInOut" }}
                        />
                        {/* Inner geometric hexagram */}
                        <motion.polygon
                          points="50,15 80,67 20,67"
                          fill="none" stroke="#67e8f9" strokeWidth="1.2"
                          filter="url(#vfx-glow-heavy)"
                          animate={{ rotate: -180, scale: [0.6, 1.2, 0] }}
                          transition={{ duration: 0.58, ease: "easeInOut" }}
                        />
                        <motion.polygon
                          points="50,85 80,33 20,33"
                          fill="none" stroke="#67e8f9" strokeWidth="1.2"
                          filter="url(#vfx-glow-heavy)"
                          animate={{ rotate: 180, scale: [0.6, 1.2, 0] }}
                          transition={{ duration: 0.58, ease: "easeInOut" }}
                        />
                        {/* Magic core flash */}
                        <motion.circle
                          cx="50" cy="50" r="10"
                          fill="#ffffff"
                          filter="url(#vfx-glow-heavy)"
                          animate={{ scale: [0.2, 1.5, 0] }}
                          transition={{ duration: 0.44 }}
                        />
                        {/* Magic Star Dust particles */}
                        {Array.from({ length: 20 }).map((_, i) => {
                          const angle = i * 18 * (Math.PI / 180)
                          const radVal = 35 + (i % 3) * 15
                          const tx = Math.cos(angle) * radVal
                          const ty = Math.sin(angle) * radVal
                          return (
                            <motion.circle
                              key={i}
                              cx="50" cy="50"
                              r="2.5"
                              fill="#c084fc"
                              filter="url(#vfx-glow-medium)"
                              animate={{
                                cx: [50, 50 + tx],
                                cy: [50, 50 + ty],
                                opacity: [1, 1, 0],
                                scale: [1.6, 0.8, 0]
                              }}
                              transition={{ duration: 0.5, ease: "easeOut", delay: (i % 5) * 0.02 }}
                            />
                          )
                        })}
                      </svg>
                    </>
                  ) : theme === 'guardian' ? (
                    // 2.8 Guardian: Triple Emerald Hexagon Shield + Holy Cross Beam
                    <>
                      <svg width="220" height="220" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                        {/* Multi-layered hexagonal grids */}
                        {[0, 15, 30].map((rot, i) => (
                          <motion.polygon
                            key={i}
                            points="50,14 81,32 81,68 50,86 19,68 19,32"
                            fill="none" stroke="#34d399" strokeWidth={2 - i * 0.4}
                            filter="url(#vfx-glow-heavy)"
                            animate={{ rotate: [rot, rot + 45], scale: [0.5, 1.25, 0] }}
                            transition={{ duration: 0.48, ease: "easeOut" }}
                          />
                        ))}
                        {/* Golden Holy Cross shaft of light */}
                        <motion.path
                          d="M 50,10 L 50,90 M 20,45 L 80,45"
                          fill="none" stroke="#fbbf24" strokeWidth="4.5"
                          strokeLinecap="round"
                          filter="url(#vfx-glow-heavy)"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                          transition={{ duration: 0.42, ease: "easeInOut", delay: 0.05 }}
                        />
                      </svg>
                    </>
                  ) : theme === 'tactician' ? (
                    // 2.9 Tactician: Golden Octagon Tactical Formula
                    <>
                      <svg width="200" height="200" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                        {/* Octagram matrix lines */}
                        <motion.polygon
                          points="50,15 75,25 85,50 75,75 50,85 25,75 15,50 25,25"
                          fill="none" stroke="#fbbf24" strokeWidth="2.2"
                          filter="url(#vfx-glow-heavy)"
                          animate={{ rotate: 90, scale: [0.6, 1.25, 0] }}
                          transition={{ duration: 0.52 }}
                        />
                        <motion.polygon
                          points="50,15 75,25 85,50 75,75 50,85 25,75 15,50 25,25"
                          fill="none" stroke="#fbbf24" strokeWidth="1"
                          filter="url(#vfx-glow-heavy)"
                          animate={{ rotate: -90, scale: [0.6, 1.15, 0] }}
                          transition={{ duration: 0.52 }}
                        />
                        <motion.circle
                          cx="50" cy="50" r="28"
                          fill="none" stroke="#f59e0b" strokeWidth="1"
                          strokeDasharray="4, 4"
                          animate={{ rotate: 180 }}
                          transition={{ duration: 0.52 }}
                        />
                        {/* Floating formula grid cards */}
                        {Array.from({ length: 8 }).map((_, i) => {
                          const a = i * 45 * (Math.PI / 180)
                          const dx = Math.cos(a) * 45
                          const dy = Math.sin(a) * 45
                          return (
                            <motion.rect
                              key={i}
                              x="46" y="46" width="8" height="8" rx="1"
                              fill="none" stroke="#fbbf24" strokeWidth="1.2"
                              filter="url(#vfx-glow-medium)"
                              animate={{
                                transform: [`translate(0px,0px) rotate(0deg) scale(1)`, `translate(${dx}px,${dy}px) rotate(${i * 90}deg) scale(0)`]
                              }}
                              transition={{ duration: 0.48, ease: "easeOut", delay: 0.05 }}
                            />
                          )
                        })}
                      </svg>
                    </>
                  ) : (
                    // 2.10 Default Skill: Amber Core Energy Ring
                    <>
                      <motion.div
                        animate={{ scale: [0.6, 1.3, 1.45], rotate: [0, 90] }}
                        transition={{ duration: 0.42 }}
                        className="absolute inset-0 rounded-lg border-2 border-amber-400 bg-amber-500/5 opacity-30 filter blur-sm"
                      />
                      <svg width="200" height="200" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                        <motion.circle
                          cx="50" cy="50" r="35"
                          fill="none" stroke="#f59e0b" strokeWidth="3.5"
                          filter="url(#vfx-glow-heavy)"
                          initial={{ scale: 0.3, opacity: 1 }}
                          animate={{ scale: 1.45, opacity: 0 }}
                          transition={{ duration: 0.38, ease: "easeOut" }}
                        />
                        <motion.path
                          d="M 15,50 L 50,15 L 85,50 L 50,85 Z"
                          fill="none" stroke="#f59e0b" strokeWidth="1.5"
                          animate={{ rotate: 180, scale: [0.5, 1.2, 0] }}
                          transition={{ duration: 0.42 }}
                        />
                      </svg>
                    </>
                  )}
                </div>
              )}

              {/* 3. Magic Circle Effect (High precision dual-ring magic shield) */}
              {isMagic && (
                <div className="relative flex items-center justify-center w-36 h-36">
                  <svg width="180" height="180" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                    <motion.circle
                      cx="50" cy="50" r="42"
                      fill="none" stroke="#22d3ee" strokeWidth="2"
                      strokeDasharray="6, 4, 18, 6"
                      filter="url(#vfx-glow-heavy)"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.polygon
                      points="50,18 78,68 22,68"
                      fill="none" stroke="#06b6d4" strokeWidth="1.2"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.circle
                      cx="50" cy="50" r="30"
                      fill="none" stroke="#e0f7fa" strokeWidth="1"
                      animate={{ scale: [0.7, 1.25], opacity: [0.65, 0] }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    />
                  </svg>
                </div>
              )}

              {/* 4. Shadow Mist Effect (Swirling dark purple clouds) */}
              {isShadow && (
                <div className="relative flex items-center justify-center w-40 h-40">
                  <motion.div
                    animate={{ scale: [0.7, 1.4], opacity: [0.8, 0] }}
                    transition={{ duration: 0.52 }}
                    className="absolute inset-0 bg-[radial-gradient(circle,rgba(168,85,247,0.42),transparent_75%)] rounded-full filter blur-md"
                  />
                  <svg width="200" height="200" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                    {[0, 120, 240].map((rot, i) => (
                      <motion.path
                        key={i}
                        d="M 50,50 Q 62,35 75,50 T 50,78 T 25,50"
                        fill="none" stroke="#a855f7" strokeWidth="2.5"
                        strokeLinecap="round"
                        filter="url(#vfx-glow-heavy)"
                        animate={{ rotate: [rot, rot - 180], scale: [0.65, 1.25, 0] }}
                        transition={{ duration: 0.48, ease: "easeOut" }}
                      />
                    ))}
                  </svg>
                </div>
              )}

              {/* 5. Curse Rift Crack Effect (Ruinous Crimson Seal Fragmenting) */}
              {isCurse && (
                <div className="relative flex items-center justify-center w-32 h-32">
                  <motion.div
                    animate={{ scale: [0.5, 1.3], opacity: [0.85, 0] }}
                    transition={{ duration: 0.45 }}
                    className="absolute inset-0 bg-[radial-gradient(circle,rgba(239,68,68,0.48),transparent_70%)] rounded-full filter blur-md"
                  />
                  <svg width="160" height="160" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                    <motion.polygon
                      points="50,15 80,45 80,75 50,85 20,75 20,45"
                      fill="none" stroke="#ef4444" strokeWidth="3"
                      filter="url(#vfx-glow-heavy)"
                      animate={{ scale: [0.6, 1.2, 0], rotate: 45 }}
                      transition={{ duration: 0.45 }}
                    />
                    {/* Cracking Shard Lines */}
                    {Array.from({ length: 8 }).map((_, i) => {
                      const angle = i * 45 * (Math.PI / 180)
                      const radVal = 42
                      const tx = Math.cos(angle) * radVal
                      const ty = Math.sin(angle) * radVal
                      return (
                        <motion.line
                          key={i}
                          x1="50" y1="50" x2={50 + tx} y2={50 + ty}
                          stroke="#fee2e2" strokeWidth="1.5"
                          filter="url(#vfx-glow-medium)"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1, opacity: [1, 0] }}
                          transition={{ duration: 0.4, delay: 0.05 }}
                        />
                      )
                    })}
                  </svg>
                </div>
              )}

              {/* 6. Heal Pillar Effect (Rising Emerald Crosses & Sparkling Dust) */}
              {isHeal && (
                <div className="relative flex flex-col items-center justify-end w-28 h-52">
                  {/* Glowing vertical aura beam */}
                  <motion.div
                    animate={{ height: [0, 180], opacity: [0.85, 0] }}
                    transition={{ duration: 0.58, ease: "easeOut" }}
                    className="w-12 rounded-full bg-gradient-to-t from-emerald-500/35 via-emerald-300/50 to-transparent filter blur-[2.5px]"
                  />
                  
                  {/* Rising Holy Cross particles */}
                  <svg width="80" height="180" className="absolute inset-0 pointer-events-none overflow-visible">
                    {Array.from({ length: 6 }).map((_, i) => {
                      const dx = -20 + (i % 3) * 20
                      const duration = 0.5 + (i % 2) * 0.1
                      const delay = i * 0.08
                      return (
                        <motion.g
                          key={i}
                          filter="url(#vfx-glow-medium)"
                          animate={{
                            x: [40 + dx, 40 + dx],
                            y: [160, 20],
                            opacity: [0, 0.95, 0.95, 0],
                            scale: [0.5, 1.2, 0.5]
                          }}
                          transition={{ duration, delay, ease: "easeOut" }}
                        >
                          <path
                            d="M 0,-8 L 0,8 M -8,0 L 8,0"
                            stroke="#34d399"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                          />
                        </motion.g>
                      )
                    })}
                  </svg>
                </div>
              )}

              {/* 7. Guard Hex Shield Effect (Hexagonal Aegis Grid Deflection) */}
              {isGuard && (
                <div className="relative flex items-center justify-center w-32 h-32">
                  <svg width="160" height="160" viewBox="0 0 100 100" className="absolute pointer-events-none overflow-visible">
                    {/* Core Hexagon Grid */}
                    <motion.polygon
                      points="50,15 80,30 80,70 50,85 20,70 20,30"
                      fill="none" stroke="#22d3ee" strokeWidth="4.5"
                      filter="url(#vfx-glow-heavy)"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: [0.6, 1.15, 0.9], opacity: [0, 1, 0.85, 0] }}
                      transition={{ duration: 0.48, ease: 'easeOut' }}
                    />
                    {/* Honeycomb grid sub-lines */}
                    <motion.path
                      d="M 50,15 L 50,85 M 20,30 L 80,70 M 20,70 L 80,30"
                      fill="none" stroke="#0891b2" strokeWidth="1.5"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: [0.6, 1.15, 0.9], opacity: [0, 0.8, 0.6, 0] }}
                      transition={{ duration: 0.48, ease: 'easeOut' }}
                    />
                  </svg>
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
