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

  // Active / Targeted special glow filter - Halved blur radius to make borders sharp and clear
  const glowFilter = isDefeated
    ? 'grayscale(1) contrast(0.5) opacity(0.35)'
    : isActive
    ? 'drop-shadow(0 0 8px rgba(168,85,247,0.9)) drop-shadow(0 0 3px rgba(168,85,247,0.7))'
    : isTargeted
    ? 'drop-shadow(0 0 7px rgba(244,63,94,0.9)) drop-shadow(0 0 3px rgba(244,63,94,0.6))'
    : innateGrade === 'S'
    ? 'drop-shadow(0 -1px 4px rgba(245,158,11,0.6))'
    : innateGrade === 'A'
    ? 'drop-shadow(0 -1px 4px rgba(168,85,247,0.5))'
    : 'drop-shadow(0 -1px 4px rgba(139,92,246,0.4))'

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
          maxHeight: compact ? 250 : 360,
          maxWidth: compact ? 260 : 380,
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
