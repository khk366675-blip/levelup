import React from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { getShadowDefinition } from '../../lib/shadows'
import { getShadowPortraitAsset } from '../../lib/shadowPortraitAssets'

type ShadowBattleSpriteProps = {
  definitionId?: string
  isActive?: boolean
  isTargeted?: boolean
  isDefeated?: boolean
  innateGrade?: string
  compact?: boolean
}

export function ShadowBattleSprite({
  definitionId,
  isActive = false,
  isTargeted = false,
  isDefeated = false,
  innateGrade,
  compact = false
}: ShadowBattleSpriteProps) {
  const shadowDef = definitionId ? getShadowDefinition(definitionId) : undefined
  const assetUrl = shadowDef ? getShadowPortraitAsset(shadowDef.portraitKey) : undefined

  if (!assetUrl) {
    // Return a simple shadow orb placeholder if PNG asset is missing
    return (
      <div className="flex items-center justify-center bg-purple-950/20 rounded-full border border-purple-500/20 text-purple-400 text-xl h-full w-full animate-pulse">
        👥
      </div>
    )
  }

  // Active / Targeted special glow filter
  const glowFilter = isDefeated
    ? 'grayscale(1) contrast(0.5) opacity(0.35)'
    : isActive
    ? 'drop-shadow(0 0 16px rgba(168,85,247,0.85)) drop-shadow(0 0 6px rgba(168,85,247,0.6))'
    : isTargeted
    ? 'drop-shadow(0 0 14px rgba(244,63,94,0.85)) drop-shadow(0 0 6px rgba(244,63,94,0.5))'
    : innateGrade === 'S'
    ? 'drop-shadow(0 -2px 10px rgba(245,158,11,0.45))'
    : innateGrade === 'A'
    ? 'drop-shadow(0 -2px 8px rgba(168,85,247,0.35))'
    : 'drop-shadow(0 -2px 8px rgba(139,92,246,0.3))'

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end pointer-events-none select-none overflow-visible">
      {/* 2.5D Free Floating Shadow PNG */}
      <img
        src={assetUrl}
        alt={shadowDef?.name || 'Shadow Unit'}
        className={clsx(
          "absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom transition-all duration-300 pointer-events-none select-none",
          isActive && "animate-pulse"
        )}
        style={{
          maxHeight: compact ? 110 : 185,
          maxWidth: compact ? 120 : 200,
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
