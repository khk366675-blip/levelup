import React from 'react'
import clsx from 'clsx'

type HunterBattleSpriteProps = {
  imageUrl?: string
  isActive?: boolean
  isTargeted?: boolean
  isSupportTarget?: boolean
  isDefeated?: boolean
  compact?: boolean
}

export function HunterBattleSprite({
  imageUrl,
  isActive = false,
  isTargeted = false,
  isSupportTarget = true, // Players are typically support/aid targets on their own team
  isDefeated = false,
  compact = false
}: HunterBattleSpriteProps) {

  if (!imageUrl) {
    return null
  }

  // Active / Targeted special glow filter suited for cyan themed hunter
  const glowFilter = isDefeated
    ? 'grayscale(1) contrast(0.5) opacity(0.35)'
    : isActive
    ? 'drop-shadow(0 0 16px rgba(34,211,238,0.85)) drop-shadow(0 0 6px rgba(34,211,238,0.6))'
    : isTargeted
    ? isSupportTarget
      ? 'drop-shadow(0 0 14px rgba(52,211,153,0.85)) drop-shadow(0 0 6px rgba(52,211,153,0.5))'
      : 'drop-shadow(0 0 14px rgba(244,63,94,0.85)) drop-shadow(0 0 6px rgba(244,63,94,0.5))'
    : 'drop-shadow(0 -2px 8px rgba(6,182,212,0.35))'

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end pointer-events-none select-none overflow-visible">
      {/* 2.5D Free Floating Hunter PNG */}
      <img
        src={imageUrl}
        alt="Hunter Unit"
        className={clsx(
          "absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom transition-all duration-300 pointer-events-none select-none",
          isActive && "animate-pulse"
        )}
        style={{
          maxHeight: compact ? 115 : 195,
          maxWidth: compact ? 125 : 210,
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          objectPosition: 'bottom center',
          filter: glowFilter
        }}
        draggable={false}
      />
    </div>
  )
}
