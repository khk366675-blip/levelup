import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

export type PopupType = 'damage' | 'heal' | 'guard' | 'miss'

interface DamagePopup {
  id: string
  text: string
  type: PopupType
  isCrit?: boolean
}

type Props = {
  popups: DamagePopup[]
}

export function BattleDamagePopup({ popups }: Props) {
  return (
    <AnimatePresence>
      {popups.map(pop => {
        const isDamage = pop.type === 'damage'
        const isHeal = pop.type === 'heal'
        const isGuard = pop.type === 'guard'
        const isMiss = pop.type === 'miss'

        // Razor sharp black outer outline using -webkit-text-stroke
        // Bypasses browser blending bugs where transparent text-shadow dims the body fill
        const textStyle: React.CSSProperties = {
          WebkitTextStroke: pop.isCrit ? '2.5px #000000' : '1.8px #000000',
          filter: pop.isCrit 
            ? 'drop-shadow(0 0 10px rgba(245,158,11,0.85)) drop-shadow(0 4px 8px rgba(0,0,0,0.95))'
            : 'drop-shadow(0 3px 6px rgba(0,0,0,0.9))',
          fontWeight: 950,
        }

        const textClass = clsx(
          'font-black text-center tracking-tight select-none uppercase font-sans italic whitespace-nowrap',
          isDamage && pop.isCrit && 'text-4xl sm:text-5xl text-yellow-300', // Super bright lemon gold
          isDamage && !pop.isCrit && 'text-3xl sm:text-4xl text-rose-500', // Neon glowing high-contrast red
          isHeal && 'text-3xl sm:text-4xl text-emerald-400', // Sparkling energetic bright emerald
          isGuard && 'text-xl sm:text-2xl text-white', // Pure solid white
          isMiss && 'text-xl sm:text-2xl text-cyan-300' // High visibility electric neon cyan
        )

        // Mathematical deterministic jitter based on popup ID to prevent overlapping stack issues
        const seed = parseInt(pop.id.slice(-2) || '0', 16) || 0
        const offsetX = Math.sin(seed) * 45
        // Y-axis offset pushes numbers securely above the actor card
        const offsetY = Math.cos(seed) * 20 - 45

        return (
          <motion.div
            key={pop.id}
            initial={{ 
              opacity: 0, 
              y: 20, 
              scale: 0.4,
              rotate: pop.isCrit ? -8 : 0 
            }}
            animate={{ 
              opacity: 1, 
              y: -80, // Float higher for extra dynamic motion feel!
              scale: pop.isCrit ? 1.55 : 1.18, // Single target scale value (strictly solid, no flickering)
              rotate: pop.isCrit ? -4 : 0
            }}
            exit={{ 
              opacity: 0, 
              y: -115,
              scale: 0.8,
              transition: { duration: 0.15 }
            }}
            transition={{
              type: "spring",
              stiffness: 450, // Ultra snappy spring pop
              damping: 18,    // Fluid settle
              mass: 0.75
            }}
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-50 font-black"
            style={{
              left: `${offsetX}px`,
              top: `${offsetY}px`,
            }}
          >
            <div 
              className={textClass}
              style={textStyle}
            >
              {pop.isCrit && <span className="text-[10px] sm:text-xs font-black mr-1 text-yellow-300 bg-black/85 border border-yellow-400 px-1 py-0.5 rounded shadow-sm inline-block">CRIT 🔥</span>}
              {isHeal && <span className="text-sm mr-0.5 font-bold">+</span>}
              {pop.text.replace('+', '')}
            </div>
          </motion.div>
        )
      })}
    </AnimatePresence>
  )
}
