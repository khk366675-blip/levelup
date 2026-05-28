import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

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
    <div className="absolute inset-0 pointer-events-none z-45 overflow-hidden">
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
              {/* 1. Attack / Slash / Strike Effect (Reworked to deliver high-intensity glowing explosive sparks) */}
              {isAttack && (
                <div className="relative flex items-center justify-center w-36 h-36">
                  {/* Outer impact shock ring (Thicker neon glowing shockwave) */}
                  <motion.div
                    initial={{ scale: 0.25, opacity: 1 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className={clsx(
                      "absolute w-28 h-28 rounded-full border-8 filter blur-[0.5px]",
                      isBossAction 
                        ? "border-rose-500 bg-rose-950/30 shadow-[0_0_25px_rgba(244,63,94,0.95)]" 
                        : theme === 'swordsman'
                        ? "border-cyan-300 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.85)]"
                        : theme === 'warrior'
                        ? "border-amber-400 bg-amber-950/20 shadow-[0_0_25px_rgba(245,158,11,0.85)]"
                        : theme === 'tracker'
                        ? "border-emerald-300 bg-emerald-950/20 shadow-[0_0_20px_rgba(52,211,153,0.85)]"
                        : "border-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.85)]"
                    )}
                  />
                  
                  {/* Central bright flash core */}
                  <motion.div
                    initial={{ scale: 0.15, opacity: 1 }}
                    animate={{ scale: 1.25, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={clsx(
                      "absolute w-14 h-14 rounded-full filter blur-[0.5px]",
                      isBossAction ? "bg-rose-200" :
                      theme === 'swordsman' ? "bg-cyan-100" :
                      theme === 'warrior' ? "bg-amber-200" :
                      theme === 'tracker' ? "bg-emerald-100" : "bg-white"
                    )}
                  />

                  {/* Explosive Stardust/Spark starburst expansion (Heavy glowing particle burst) */}
                  <svg width="180" height="180" viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none overflow-visible">
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
                      const rad = (angle * Math.PI) / 180
                      const x2 = 50 + Math.cos(rad) * 65
                      const y2 = 50 + Math.sin(rad) * 65
                      
                      const particleColor = isBossAction ? "#f43f5e" :
                        theme === 'swordsman' ? "#22d3ee" :
                        theme === 'warrior' ? "#f59e0b" :
                        theme === 'tracker' ? "#10b981" : "#ffffff"
                        
                      return (
                        <motion.circle
                          key={i}
                          cx="50"
                          cy="50"
                          r={isBossAction ? 6.5 : 4.5} // Visually much larger spark dots!
                          fill={particleColor}
                          style={{
                            filter: `drop-shadow(0 0 5px ${particleColor})` // Heavy magical neon glow!
                          }}
                          animate={{
                            cx: [50, x2],
                            cy: [50, y2],
                            opacity: [1, 1, 0],
                            scale: [1.4, 0.8, 0]
                          }}
                          transition={{ 
                            duration: 0.32, 
                            ease: "easeOut",
                            delay: (i % 3) * 0.02 // Stagger particle sparks for natural eruption
                          }}
                        />
                      )
                    })}
                  </svg>
                </div>
              )}

              {/* 2. Skill Burst / Blast / Sigil (Theme-differentiated) */}
              {isSkill && (
                <div className="relative flex items-center justify-center w-36 h-36">
                  {isBossAction ? (
                    // Boss Action: Ground-cracking crimson blast
                    <>
                      <motion.div
                        animate={{ scale: [0.5, 1.45, 1.65], rotate: [0, -45] }}
                        transition={{ duration: 0.45 }}
                        className="absolute inset-0 rounded-full border-4 border-rose-600 bg-rose-950/20 opacity-40 filter blur-sm shadow-[0_0_35px_rgba(244,63,94,0.9)]"
                      />
                      <motion.div
                        animate={{ scale: [0.7, 1.3], opacity: [0.9, 0] }}
                        transition={{ duration: 0.4 }}
                        className="absolute w-32 h-32 rounded-full border-2 border-rose-400"
                      />
                      <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(244,63,94,1)] z-10 animate-pulse">👑</span>
                    </>
                  ) : theme === 'hidden-shadow' ? (
                    // Shadow Hidden: Dark abyssal blast
                    <>
                      <motion.div
                        animate={{ scale: [0.6, 1.45], opacity: [0.85, 0] }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-[radial-gradient(circle,rgba(168,85,247,0.48),rgba(0,0,0,0.8)_65%,transparent_90%)] rounded-full filter blur-md"
                      />
                      <motion.div
                        animate={{ rotate: 180, scale: [0.5, 1.25] }}
                        transition={{ duration: 0.45 }}
                        className="absolute w-24 h-24 border-2 border-purple-500/35 border-t-purple-400 rounded-full animate-spin"
                      />
                      <span className="text-3xl filter drop-shadow-[0_0_12px_rgba(168,85,247,0.95)] z-10">☠️</span>
                    </>
                  ) : theme === 'hidden-curse' ? (
                    // Curse Hidden: Crimson seal rupture
                    <>
                      <motion.div
                        animate={{ scale: [0.5, 1.35], opacity: [0.9, 0] }}
                        transition={{ duration: 0.42 }}
                        className="absolute inset-0 bg-[radial-gradient(circle,rgba(239,68,68,0.55),transparent_70%)] rounded-full filter blur-sm"
                      />
                      <motion.div
                        animate={{ scale: [0.8, 1.25], rotate: [0, 45, 90] }}
                        transition={{ duration: 0.4 }}
                        className="absolute w-20 h-20 border-2 border-red-600 rounded-sm opacity-40 shadow-[0_0_15px_rgba(239,68,68,0.7)]"
                      />
                      <span className="text-3xl filter drop-shadow-[0_0_12px_rgba(239,68,68,0.95)] z-10">🩸</span>
                    </>
                  ) : theme === 'hidden-rift' ? (
                    // Rift Hidden: Cyan-purple dimension distortion crack
                    <>
                      <motion.div
                        animate={{ scale: [0.6, 1.4, 1.5], rotate: [0, 180] }}
                        transition={{ duration: 0.48 }}
                        className="absolute inset-0 border border-violet-500 bg-violet-600/10 rounded-full opacity-40 filter blur-xs"
                      />
                      <motion.div
                        animate={{ scale: [0.4, 1.2], opacity: [0.9, 0] }}
                        transition={{ duration: 0.38 }}
                        className="absolute w-28 h-28 border-4 border-dashed border-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.75)]"
                      />
                      <span className="text-3xl filter drop-shadow-[0_0_12px_rgba(139,92,246,0.95)] z-10">🌀</span>
                    </>
                  ) : theme === 'swordsman' ? (
                    // Swordsman: Flash swift slash shockwave
                    <>
                      <motion.div
                        animate={{ scaleX: [0.2, 1.45], scaleY: [0.1, 0.4], opacity: [0.9, 0] }}
                        transition={{ duration: 0.32 }}
                        className="absolute w-36 h-20 bg-gradient-to-r from-transparent via-cyan-300 to-transparent filter blur-[1.5px]"
                      />
                      <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(34,211,238,0.9)] z-10">⚡</span>
                    </>
                  ) : theme === 'warrior' ? (
                    // Warrior: Land-crushing flame shockwave
                    <>
                      <motion.div
                        animate={{ scale: [0.6, 1.35], opacity: [0.85, 0] }}
                        transition={{ duration: 0.45 }}
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-600/30 to-red-500/30 filter blur-md"
                      />
                      <motion.div
                        animate={{ scale: [0.4, 1.2], opacity: [0.9, 0] }}
                        transition={{ duration: 0.4 }}
                        className="absolute w-28 h-28 border-3 border-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.8)]"
                      />
                      <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.9)] z-10">💥</span>
                    </>
                  ) : theme === 'mage' ? (
                    // Mage: Rotating magic spell formation
                    <>
                      <motion.div
                        animate={{ rotate: 360, scale: [0.7, 1.25] }}
                        transition={{ duration: 0.5 }}
                        className="absolute w-26 h-26 border-2 border-indigo-400/50 rounded-full border-dashed"
                      />
                      <motion.div
                        animate={{ scale: [0.5, 1.15], opacity: [0.9, 0] }}
                        transition={{ duration: 0.4 }}
                        className="absolute w-20 h-20 rounded-full border border-cyan-400 bg-cyan-400/5"
                      />
                      <span className="text-2xl filter drop-shadow-[0_0_10px_rgba(99,102,241,0.9)] z-10">🔮</span>
                    </>
                  ) : theme === 'guardian' ? (
                    // Guardian: Golden-green holy protection shielding
                    <>
                      <motion.div
                        animate={{ scale: [0.7, 1.2], opacity: [0.85, 0] }}
                        transition={{ duration: 0.45 }}
                        className="absolute w-24 h-24 border-2 border-emerald-400 bg-emerald-500/5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      />
                      <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(52,211,153,0.9)] z-10">🛡️</span>
                    </>
                  ) : theme === 'tactician' ? (
                    // Tactician: Golden strategic buffer sigil
                    <>
                      <motion.div
                        animate={{ scale: [0.6, 1.25], rotate: [0, 45] }}
                        transition={{ duration: 0.42 }}
                        className="absolute w-22 h-22 border-3 border-amber-400 bg-amber-400/5 rounded-lg opacity-40 shadow-[0_0_18px_rgba(245,158,11,0.5)]"
                        style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
                      />
                      <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.9)] z-10">📖</span>
                    </>
                  ) : (
                    // Default Skill
                    <>
                      <motion.div
                        animate={{ scale: [0.6, 1.25, 1.3], rotate: [0, 90] }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 rounded-lg border-2 border-amber-400 bg-amber-500/10 opacity-30 filter blur-sm"
                      />
                      <motion.div
                        animate={{ scale: [0.5, 1.15], opacity: [0.8, 0] }}
                        transition={{ duration: 0.35 }}
                        className="absolute w-24 h-24 rounded-full border-3 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.7)]"
                      />
                      <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.9)] z-10">⚡</span>
                    </>
                  )}
                </div>
              )}

              {/* 3. Magic Circle Effect */}
              {isMagic && (
                <div className="relative flex items-center justify-center w-32 h-32">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 border-2 border-dashed border-cyan-400 rounded-full opacity-40 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                  />
                  <motion.div
                    animate={{ scale: [0.7, 1.2], opacity: [0.6, 0] }}
                    transition={{ duration: 0.45 }}
                    className="absolute w-20 h-20 border border-cyan-200 rounded-full"
                  />
                  <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] z-10">🌀</span>
                </div>
              )}

              {/* 4. Shadow Mist Effect */}
              {isShadow && (
                <div className="relative flex items-center justify-center w-36 h-36">
                  <motion.div
                    animate={{ scale: [0.8, 1.35], opacity: [0.75, 0] }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-[radial-gradient(circle,rgba(168,85,247,0.38),transparent_70%)] rounded-full filter blur-md"
                  />
                  <motion.div
                    animate={{ rotate: [0, -180], scale: [0.7, 1.2] }}
                    transition={{ duration: 0.45 }}
                    className="absolute w-24 h-24 border border-purple-500/40 rounded-full"
                  />
                  <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] z-10">🔮</span>
                </div>
              )}

              {/* 5. Curse Rift Crack Effect */}
              {isCurse && (
                <div className="relative flex items-center justify-center w-28 h-28">
                  <motion.div
                    animate={{ scale: [0.5, 1.25], opacity: [0.8, 0] }}
                    transition={{ duration: 0.45 }}
                    className="absolute inset-0 bg-[radial-gradient(circle,rgba(239,68,68,0.45),transparent_70%)] rounded-full filter blur-md"
                  />
                  <motion.div
                    animate={{ scale: [0.8, 1.2], rotate: 45 }}
                    className="absolute w-16 h-16 border-2 border-rose-500 rounded-sm opacity-35"
                  />
                  <span className="text-3xl filter drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] z-10">🩸</span>
                </div>
              )}

              {/* 6. Heal Pillar Effect */}
              {isHeal && (
                <div className="relative flex flex-col items-center justify-end w-24 h-48">
                  <motion.div
                    animate={{ height: [0, 160], opacity: [0.8, 0] }}
                    transition={{ duration: 0.55 }}
                    className="w-10 rounded-full bg-gradient-to-t from-emerald-500/40 via-emerald-300/60 to-transparent filter blur-[2px]"
                  />
                  <span className="text-2xl filter drop-shadow-[0_0_10px_rgba(52,211,153,0.9)] absolute bottom-6 z-10">✨</span>
                </div>
              )}

              {/* 7. Guard Hex Shield Effect */}
              {isGuard && (
                <div className="relative flex items-center justify-center w-28 h-28">
                  <motion.div
                    animate={{ scale: [0.7, 1.15], opacity: [0.9, 0] }}
                    transition={{ duration: 0.5 }}
                    className="absolute w-20 h-20 border-2 border-cyan-400 bg-cyan-500/5 rounded-lg opacity-40 shadow-[0_0_16px_rgba(34,211,238,0.5)]"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  />
                  <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(34,211,238,0.9)] z-10">🛡️</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
