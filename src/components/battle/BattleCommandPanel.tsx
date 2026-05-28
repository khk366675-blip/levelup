import React from 'react'
import clsx from 'clsx'
import { Bot, RotateCcw, Swords, EyeOff, ShieldAlert } from 'lucide-react'
import type { BattleUnit, DirectBattleState } from '../../lib/directBattleTypes'

interface BattleCommandPanelProps {
  playerUnits: BattleUnit[]
  enemyUnits: BattleUnit[]
  isFinished: boolean
  isRevealingRound: boolean
  playbackSpeed: 'normal' | 'fast'
  onChangePlaybackSpeed: () => void
  onAutoSelect: () => void
  onExecuteRound: (mode: 'auto' | 'manual') => void
  renderActionControls: (unit: BattleUnit) => React.ReactNode
  onMinimize: () => void
  onGiveUp: () => void
}

export function BattleCommandPanel({
  playerUnits,
  enemyUnits,
  isFinished,
  isRevealingRound,
  playbackSpeed,
  onChangePlaybackSpeed,
  onAutoSelect,
  onExecuteRound,
  renderActionControls,
  onMinimize,
  onGiveUp
}: BattleCommandPanelProps) {
  const hasUnits = enemyUnits.length > 0 && playerUnits.length > 0

  return (
    <div className="w-full bg-[#020617]/90 border-t border-white/10 px-3 py-2 select-none flex flex-col gap-2 shadow-2xl">
      {/* Control Utility Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-white/5 pb-1.5">
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 animate-pulse">CMD CENTER</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {/* Speed Toggle */}
          <button
            type="button"
            onClick={onChangePlaybackSpeed}
            disabled={isFinished || isRevealingRound}
            className="rounded border border-white/10 bg-white/5 text-[9px] text-white/70 py-0.5 px-2 hover:bg-white/10 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ⚡ {playbackSpeed === 'normal' ? '1x' : '2x'}
          </button>
          {/* Auto Select */}
          <button
            type="button"
            onClick={onAutoSelect}
            disabled={isFinished || isRevealingRound}
            className="rounded border border-white/10 bg-white/5 text-[9px] text-white/70 py-0.5 px-2 hover:bg-white/10 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Bot className="h-2.5 w-2.5" />
            자동 선택
          </button>
          {/* Auto Run */}
          <button
            type="button"
            onClick={() => onExecuteRound('auto')}
            disabled={isFinished || isRevealingRound || !hasUnits}
            className="rounded border border-amber-300/20 bg-amber-400/10 text-[9px] text-amber-200 py-0.5 px-2 hover:bg-amber-400/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <RotateCcw className="h-2.5 w-2.5 animate-spin-slow" />
            자동 실행
          </button>
          {/* Manual Run */}
          <button
            type="button"
            onClick={() => onExecuteRound('manual')}
            disabled={isFinished || isRevealingRound || !hasUnits}
            className="rounded border border-cyan-300/20 bg-cyan-400/10 text-[9px] text-cyan-200 py-0.5 px-2 hover:bg-cyan-400/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
          >
            <Swords className="h-2.5 w-2.5" />
            라운드 실행
          </button>
        </div>
      </div>

      {/* Actor Controls Area */}
      <div className="grid gap-2 overflow-y-auto max-h-[120px] sm:max-h-[145px] pr-1 grid-cols-1 sm:grid-cols-2">
        {playerUnits.map(unit => renderActionControls(unit))}
      </div>

      {/* Bottom Actions (Minimize and Give Up) */}
      <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10px]">
        <button
          type="button"
          onClick={onMinimize}
          className="flex items-center gap-1 text-white/40 hover:text-white/80 transition"
        >
          <EyeOff className="h-3.5 w-3.5" />
          전투창 닫기 (최소화)
        </button>
        <button
          type="button"
          onClick={onGiveUp}
          disabled={isRevealingRound}
          className="flex items-center gap-1 text-rose-400/60 hover:text-rose-400 transition disabled:opacity-30"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          전투 포기 (취소)
        </button>
      </div>
    </div>
  )
}
