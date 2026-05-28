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
  intensity?: 'basic' | 'skill' | 'signature'
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
        const intensity = pop.intensity ?? 'signature'

        // 1. Setup Solid Core High-Contrast Body Fills based on class preset & intensity
        let textColorClass = 'text-rose-500' // General standard damage
        let strokeColor = '#000000'
        let strokeWidth = '1.8px'
        let critBadge = 'CRIT 🔥'
        let critBadgeColor = 'text-yellow-300 border-yellow-400 bg-black/85'
        let hasBadge = false

        if (isDamage) {
          if (intensity === 'basic') {
            // Basic Attack (Plain Normal damage, minimal stroke, muted career colors)
            strokeWidth = '1.4px'
            if (pop.isCrit) {
              textColorClass = 'text-yellow-400/90'
              critBadge = 'CRIT 🔥'
              critBadgeColor = 'text-yellow-400 border-yellow-500/50 bg-black/60'
              hasBadge = true
            } else {
              if (popStyle === 'sharp') textColorClass = 'text-cyan-600/75'
              else if (popStyle === 'heavy') textColorClass = 'text-amber-700/75'
              else if (popStyle === 'magic') textColorClass = 'text-indigo-600/75'
              else if (popStyle === 'quick-sharp') textColorClass = 'text-emerald-600/75'
              else if (popStyle === 'shadow') textColorClass = 'text-purple-600/75'
              else if (popStyle === 'curse') textColorClass = 'text-red-600/75'
              else if (popStyle === 'rift') textColorClass = 'text-blue-600/75'
              else if (popStyle === 'shadow-silence') textColorClass = 'text-cyan-600/75'
              else if (popStyle === 'shadow-rend') textColorClass = 'text-rose-600/75'
              else if (popStyle === 'shadow-guard') textColorClass = 'text-cyan-600/75'
              else if (popStyle === 'shadow-mend') textColorClass = 'text-emerald-600/75'
              else if (popStyle === 'shadow-scan') textColorClass = 'text-teal-600/75'
              else if (popStyle === 'shadow-void') textColorClass = 'text-indigo-600/75'
              else textColorClass = 'text-rose-600/75'
            }
          } else {
            // Skill (Focus Slash) or Signature
            strokeWidth = pop.isCrit ? '2.5px' : '2.0px'

            if (pop.isCrit) {
              hasBadge = true
              if (popStyle === 'sharp') {
                textColorClass = 'text-cyan-300'
                critBadge = 'SWIFT ⚡'
                critBadgeColor = 'text-cyan-300 border-cyan-400 bg-cyan-950/80'
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
              } else if (popStyle === 'shadow-silence') {
                textColorClass = 'text-cyan-200'
                critBadge = 'SILENCE 🤫'
                critBadgeColor = 'text-cyan-300 border-cyan-400 bg-cyan-950/85'
              } else if (popStyle === 'shadow-rend') {
                textColorClass = 'text-rose-300'
                critBadge = 'REND ⚔️'
                critBadgeColor = 'text-rose-300 border-rose-400 bg-rose-950/85'
              } else if (popStyle === 'shadow-guard') {
                textColorClass = 'text-cyan-300'
                critBadge = 'GUARD 🛡️'
                critBadgeColor = 'text-cyan-300 border-cyan-400 bg-cyan-950/85'
              } else if (popStyle === 'shadow-mend') {
                textColorClass = 'text-emerald-300'
                critBadge = 'MEND 💚'
                critBadgeColor = 'text-emerald-300 border-emerald-400 bg-emerald-950/85'
              } else if (popStyle === 'shadow-scan') {
                textColorClass = 'text-teal-300'
                critBadge = 'SCAN 👁️'
                critBadgeColor = 'text-teal-300 border-teal-400 bg-teal-950/85'
              } else if (popStyle === 'shadow-void') {
                textColorClass = 'text-indigo-200'
                critBadge = 'VOID 🌀'
                critBadgeColor = 'text-indigo-200 border-indigo-300 bg-indigo-950/85'
              } else {
                textColorClass = 'text-yellow-300'
                critBadge = 'CRIT 🔥'
                critBadgeColor = 'text-yellow-300 border-yellow-400 bg-black/85'
              }
            } else {
              // Focus Slash non-crit: Add subtle class tag badge if intensity is 'skill' or 'signature'
              if (intensity === 'skill' || intensity === 'signature') {
                hasBadge = true
                if (popStyle === 'sharp') {
                  textColorClass = 'text-cyan-400'
                  critBadge = 'SWIFT'
                  critBadgeColor = 'text-cyan-400 border-cyan-600/50 bg-cyan-950/50'
                } else if (popStyle === 'heavy') {
                  textColorClass = 'text-amber-500'
                  critBadge = 'CRUSH'
                  critBadgeColor = 'text-amber-500 border-amber-600/50 bg-amber-950/50'
                } else if (popStyle === 'magic') {
                  textColorClass = 'text-indigo-400'
                  critBadge = 'BURST'
                  critBadgeColor = 'text-indigo-400 border-indigo-600/50 bg-indigo-950/50'
                } else if (popStyle === 'quick-sharp') {
                  textColorClass = 'text-emerald-400'
                  critBadge = 'ASSASSIN'
                  critBadgeColor = 'text-emerald-400 border-emerald-600/50 bg-emerald-950/50'
                } else if (popStyle === 'shadow') {
                  textColorClass = 'text-purple-400'
                  critBadge = 'SHADOW'
                  critBadgeColor = 'text-purple-400 border-purple-600/50 bg-purple-950/50'
                } else if (popStyle === 'curse') {
                  textColorClass = 'text-red-500'
                  critBadge = 'RUIN'
                  critBadgeColor = 'text-red-500 border-red-600/50 bg-red-950/50'
                } else if (popStyle === 'rift') {
                  textColorClass = 'text-blue-400'
                  critBadge = 'RIFT'
                  critBadgeColor = 'text-blue-400 border-blue-600/50 bg-blue-950/50'
                } else if (popStyle === 'shadow-silence') {
                  textColorClass = 'text-cyan-400'
                  critBadge = 'SILENCE'
                  critBadgeColor = 'text-cyan-400 border-cyan-600/50 bg-cyan-950/50'
                } else if (popStyle === 'shadow-rend') {
                  textColorClass = 'text-rose-400'
                  critBadge = 'REND'
                  critBadgeColor = 'text-rose-400 border-rose-600/50 bg-rose-950/50'
                } else if (popStyle === 'shadow-guard') {
                  textColorClass = 'text-cyan-400'
                  critBadge = 'GUARD'
                  critBadgeColor = 'text-cyan-400 border-cyan-600/50 bg-cyan-950/50'
                } else if (popStyle === 'shadow-mend') {
                  textColorClass = 'text-emerald-400'
                  critBadge = 'MEND'
                  critBadgeColor = 'text-emerald-400 border-emerald-600/50 bg-emerald-950/50'
                } else if (popStyle === 'shadow-scan') {
                  textColorClass = 'text-teal-400'
                  critBadge = 'SCAN'
                  critBadgeColor = 'text-teal-400 border-teal-600/50 bg-teal-950/50'
                } else if (popStyle === 'shadow-void') {
                  textColorClass = 'text-indigo-400'
                  critBadge = 'VOID'
                  critBadgeColor = 'text-indigo-400 border-indigo-600/50 bg-indigo-950/50'
                } else {
                  textColorClass = 'text-rose-500'
                  critBadge = 'FOCUS'
                  critBadgeColor = 'text-rose-400 border-rose-600/50 bg-rose-950/50'
                }
              } else {
                // Regular Skill non-crit without special intensity
                if (popStyle === 'sharp') textColorClass = 'text-cyan-400'
                else if (popStyle === 'heavy') textColorClass = 'text-amber-500'
                else if (popStyle === 'magic') textColorClass = 'text-indigo-400'
                else if (popStyle === 'quick-sharp') textColorClass = 'text-emerald-400'
                else if (popStyle === 'shadow') textColorClass = 'text-purple-400'
                else if (popStyle === 'curse') textColorClass = 'text-red-500'
                else if (popStyle === 'rift') textColorClass = 'text-blue-400'
                else if (popStyle === 'shadow-silence') textColorClass = 'text-cyan-400'
                else if (popStyle === 'shadow-rend') textColorClass = 'text-rose-400'
                else if (popStyle === 'shadow-guard') textColorClass = 'text-cyan-400'
                else if (popStyle === 'shadow-mend') textColorClass = 'text-emerald-400'
                else if (popStyle === 'shadow-scan') textColorClass = 'text-teal-400'
                else if (popStyle === 'shadow-void') textColorClass = 'text-indigo-400'
                else textColorClass = 'text-rose-500'
              }
            }
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
          ? `drop-shadow(0 0 10px ${popStyle === 'shadow' || popStyle.startsWith('shadow-') ? 'rgba(168,85,247,0.7)' : popStyle === 'curse' ? 'rgba(239,68,68,0.7)' : 'rgba(245,158,11,0.7)'}) drop-shadow(0 4px 8px rgba(0,0,0,0.95))`
          : 'drop-shadow(0 3px 6px rgba(0,0,0,0.9)'

        const textStyle: React.CSSProperties = {
          WebkitTextStroke: `${strokeWidth} ${strokeColor}`,
          filter: dropShadow,
          fontWeight: 950,
        }

        let fontScaleClass = 'text-3xl sm:text-4xl'
        if (isDamage) {
          if (intensity === 'basic') {
            fontScaleClass = pop.isCrit ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
          } else {
            fontScaleClass = pop.isCrit ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'
          }
        } else if (isGuard || isMiss) {
          fontScaleClass = 'text-xl sm:text-2xl'
        }

        const textClass = clsx(
          'font-black text-center tracking-tight select-none uppercase font-sans italic whitespace-nowrap',
          textColorClass,
          fontScaleClass
        )

        // Mathematical deterministic jitter based on popup ID to prevent overlapping stack issues
        const seed = parseInt(pop.id.slice(-2) || '0', 16) || 0
        const offsetX = Math.sin(seed) * 45
        // Y-axis offset pushes numbers securely above the actor card
        const offsetY = Math.cos(seed) * 20 - 45

        // Determine motion scale values based on intensity
        let startScale = 0.4
        let animateScale = 1.18
        if (isDamage) {
          if (intensity === 'basic') {
            startScale = 0.35
            animateScale = pop.isCrit ? 1.25 : 0.95
          } else {
            startScale = 0.4
            animateScale = pop.isCrit ? 1.55 : 1.18
          }
        }

        return (
          <motion.div
            key={pop.id}
            initial={{ 
              opacity: 0, 
              y: 20, 
              scale: startScale,
              rotate: pop.isCrit ? -8 : 0 
            }}
            animate={{ 
              opacity: 1, 
              y: -80, // Float higher for extra dynamic motion feel!
              scale: animateScale, // Single target scale value (strictly solid, no flickering)
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
              {hasBadge && (
                <span className={clsx(
                  "text-[9px] sm:text-[10px] font-black mr-1 bg-black/85 border px-1 py-0.5 rounded shadow-sm inline-block leading-none align-middle transform -translate-y-[2px]",
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
