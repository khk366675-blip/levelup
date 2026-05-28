import React from 'react'
import clsx from 'clsx'

type MonsterBattleSpriteProps = {
  imageUrl?: string
  isBoss?: boolean
  isActive?: boolean
  isTargeted?: boolean
  isDefeated?: boolean
  compact?: boolean
}

export function MonsterBattleSprite({
  imageUrl,
  isBoss = false,
  isActive = false,
  isTargeted = false,
  isDefeated = false,
  compact = false
}: MonsterBattleSpriteProps) {

  if (!imageUrl) {
    return null
  }

  // Active / Targeted special glow filter suited for hostile red/crimson themed monsters
  const glowFilter = isDefeated
    ? 'grayscale(1) contrast(0.5) opacity(0.35)'
    : isActive
    ? 'drop-shadow(0 0 18px rgba(239,68,68,0.85)) drop-shadow(0 0 6px rgba(239,68,68,0.6))'
    : isTargeted
    ? 'drop-shadow(0 0 16px rgba(244,63,94,0.85)) drop-shadow(0 0 6px rgba(244,63,94,0.5))'
    : isBoss
    ? 'drop-shadow(0 -3px 12px rgba(239,68,68,0.4)) animate-pulse'
    : 'drop-shadow(0 -2px 8px rgba(239,68,68,0.22))'

  // Scale settings - Bosses are larger but kept within limits to prevent clipping
  const maxHeight = isBoss
    ? (compact ? 145 : 255)
    : (compact ? 112 : 190)

  const maxWidth = isBoss
    ? (compact ? 155 : 270)
    : (compact ? 122 : 205)

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end pointer-events-none select-none overflow-visible">
      {/* 2.5D Free Floating Monster PNG */}
      <img
        src={imageUrl}
        alt={isBoss ? "Boss Unit" : "Monster Unit"}
        className={clsx(
          "absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom transition-all duration-300 pointer-events-none select-none",
          isActive && "animate-pulse"
        )}
        style={{
          maxHeight,
          maxWidth,
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
