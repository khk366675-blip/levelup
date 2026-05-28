import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import type { DamagePopupStyle } from '../../lib/skillMotionPresets'

export type PopupType = 'damage' | 'heal' | 'guard' | 'miss'

interface DamagePopup {
  id: string
  text: string
  type: PopupType
  isCrit?: boolean
  style?: DamagePopupStyle
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

        const popStyle = pop.style ?? 'default'

        // 1. Setup Solid Core High-Contrast Body Fills based on class preset
        let textColorClass = 'text-rose-500' // General standard damage
        let strokeColor = '#000000'
        let strokeWidth = '1.8px'
        let critBadge = 'CRIT 🔥'
        let critBadgeColor = 'text-yellow-300 border-yellow-400'

        if (isDamage) {
          if (pop.isCrit) {
            strokeWidth = '2.5px'
            if (popStyle === 'sharp') {
              textColorClass = 'text-cyan-300'
              critBadge = 'SWIFT ⚡'
              critBadgeColor = 'text-cyan-300 border-cyan-400'
            } else if (popStyle === 'heavy') {
              textColorClass = 'text-amber-300'
              critBadge = 'CRUSH 💥'
              critBadgeColor = 'text-amber-400 border-amber-500 bg-amber-950/80'
            } else if (popStyle === 'magic') {
              textColorClass = 'text-violet-300'
              critBadge = 'BURST 🔮'
              critBadgeColor = 'text-violet-300 border-violet-400 bg-violet-950/80'
            } else if (popStyle === 'quick-sharp') {
              textColorClass = 'text-emerald-300'
              critBadge = 'ASSASSIN 🗡️'
              critBadgeColor = 'text-emerald-300 border-emerald-400 bg-emerald-950/80'
            } else if (popStyle === 'shadow') {
              textColorClass = 'text-purple-300'
              critBadge = 'SHADOW ☠️'
              critBadgeColor = 'text-purple-300 border-purple-400 bg-purple-950/80'
            } else if (popStyle === 'curse') {
              textColorClass = 'text-red-400'
              critBadge = 'RUIN 🩸'
              critBadgeColor = 'text-red-400 border-red-500 bg-red-950/80'
            } else if (popStyle === 'rift') {
              textColorClass = 'text-cyan-200'
              critBadge = 'RIFT 🌀'
              critBadgeColor = 'text-cyan-200 border-cyan-300 bg-cyan-950/80'
            } else {
              textColorClass = 'text-yellow-300' // Default gold crit
            }
          } else {
            // Normal hit color styles
            if (popStyle === 'sharp') textColorClass = 'text-cyan-400'
            else if (popStyle === 'heavy') textColorClass = 'text-amber-500'
            else if (popStyle === 'magic') textColorClass = 'text-indigo-400'
            else if (popStyle === 'quick-sharp') textColorClass = 'text-emerald-400'
            else if (popStyle === 'shadow') textColorClass = 'text-purple-400'
            else if (popStyle === 'curse') textColorClass = 'text-red-500'
            else if (popStyle === 'rift') textColorClass = 'text-blue-400'
            else textColorClass = 'text-rose-500'
          }
        } else if (isHeal) {
          textColorClass = 'text-emerald-400 font-bold'
          strokeColor = '#022c22'
        } else if (isGuard) {
          textColorClass = 'text-slate-100 font-bold'
          strokeColor = '#1e293b'
          strokeWidth = '1.5px'
        } else if (isMiss) {
          textColorClass = 'text-cyan-300 italic'
          strokeColor = '#0f172a'
        }

        // Setup drop shadow styling based on crit magnitude
        const dropShadow = pop.isCrit
          ? `drop-shadow(0 0 10px ${popStyle === 'shadow' ? 'rgba(168,85,247,0.7)' : popStyle === 'curse' ? 'rgba(239,68,68,0.7)' : 'rgba(245,158,11,0.7)'}) drop-shadow(0 4px 8px rgba(0,0,0,0.95))`
          : 'drop-shadow(0 3px 6px rgba(0,0,0,0.9))'

        const textStyle: React.CSSProperties = {
          WebkitTextStroke: `${strokeWidth} ${strokeColor}`,
          filter: dropShadow,
          fontWeight: 950,
        }

        const textClass = clsx(
          'font-black text-center tracking-tight select-none uppercase font-sans italic whitespace-nowrap',
          textColorClass,
          pop.isCrit ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl',
          isGuard && 'text-xl sm:text-2xl',
          isMiss && 'text-xl sm:text-2xl'
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
              stiffness: 450, // Snappy spring pop
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
              {pop.isCrit && (
                <span className={clsx(
                  "text-[10px] sm:text-xs font-black mr-1 bg-black/85 border px-1 py-0.5 rounded shadow-sm inline-block",
                  critBadgeColor
                )}>
                  {critBadge}
                </span>
              )}
              {isHeal && <span className="text-sm mr-0.5 font-bold">+</span>}
              {pop.text.replace('+', '')}
            </div>
          </motion.div>
        )
      })}
    </AnimatePresence>
  )
}
