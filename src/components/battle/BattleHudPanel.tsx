import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Shield, Swords, Wand2, Star } from 'lucide-react'
import type { BattleUnit } from '../../lib/directBattleTypes'

interface HudUnitProps {
  unit: BattleUnit
  isActive?: boolean
  isTargeted?: boolean
  isDimmed?: boolean
  onClick?: () => void
  team: 'player' | 'enemy'
}

function getRoleIcon(role?: string) {
  const r = role?.toLowerCase() ?? ''
  if (r.includes('knight') || r.includes('guard') || r.includes('shield')) {
    return <Shield className="h-3 w-3" />
  }
  if (r.includes('mage') || r.includes('witch') || r.includes('wizard') || r.includes('curse') || r.includes('rift')) {
    return <Wand2 className="h-3 w-3" />
  }
  return <Swords className="h-3 w-3" />
}

export function HudUnitCard({ unit, isActive, isTargeted, isDimmed, onClick, team }: HudUnitProps) {
  const isAlive = unit.stats.currentHp > 0
  const hpRatio = unit.stats.maxHp > 0 ? unit.stats.currentHp / unit.stats.maxHp : 0
  const isBoss = unit.metadata?.tags?.includes('boss') || unit.role === 'boss'

  return (
    <button
      type="button"
      disabled={!isAlive || !onClick}
      onClick={onClick}
      className={clsx(
        'relative flex items-center gap-1.5 rounded-lg border bg-black/40 py-1.5 px-2 text-left transition-all',
        team === 'player' ? 'border-cyan-500/20' : 'border-rose-500/20',
        !isAlive && 'opacity-40 border-slate-800 bg-slate-950/60',
        isAlive && isDimmed && 'opacity-55 scale-98 border-slate-800/40 bg-black/20',
        isAlive && isActive && 'opacity-100 border-cyan-400 ring-1 ring-cyan-400 bg-cyan-950/20 shadow-glow shadow-cyan-500/10 scale-102 z-20',
        isAlive && isTargeted && (team === 'player'
          ? 'opacity-100 border-emerald-400 ring-1 ring-emerald-400 bg-emerald-950/20 shadow-glow shadow-emerald-500/10 scale-102 z-20'
          : 'opacity-100 border-rose-500 ring-1 ring-rose-500 bg-rose-950/20 shadow-glow shadow-rose-500/10 scale-102 z-20'
        ),
        onClick ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'
      )}
      style={{ minWidth: '130px', flex: '1 1 0%' }}
    >
      {/* Active/Target badge */}
      {isAlive && (
        <div className="absolute -top-1.5 -right-1 z-10 flex gap-0.5 scale-75">
          {isActive && (
            <span className="rounded bg-cyan-400 px-1 py-0.5 text-[8px] font-black text-black">ACT</span>
          )}
          {isTargeted && (
            <span className={clsx(
              'rounded px-1 py-0.5 text-[8px] font-black text-white',
              team === 'player' ? 'bg-emerald-500' : 'bg-rose-500'
            )}>
              {team === 'player' ? 'AID' : 'TGT'}
            </span>
          )}
        </div>
      )}

      {/* Avatar Icon */}
      <div className={clsx(
        'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
        !isAlive ? 'border-slate-800 bg-slate-900 text-slate-600' :
        team === 'player' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' :
        isBoss ? 'border-rose-400/50 bg-rose-500/15 text-rose-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
      )}>
        {team === 'player' ? (
          getRoleIcon(unit.role)
        ) : isBoss ? (
          <span className="text-sm">👹</span>
        ) : (
          <span className="text-xs">💀</span>
        )}
      </div>

      {/* HP Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 justify-between">
          <span className="truncate text-[10px] font-bold text-white/90">
            {unit.displayName}
          </span>
          {isBoss && (
            <span className="rounded bg-rose-500/80 px-1 py-0.2 text-[7px] font-black text-white shrink-0">BOSS</span>
          )}
        </div>

        {/* HP Bar */}
        <div className="mt-1 h-1.5 overflow-hidden rounded bg-white/10 relative">
          <motion.div
            className={clsx(
              'h-full rounded',
              !isAlive ? 'bg-slate-800' :
              team === 'player' ? 'bg-gradient-to-r from-cyan-400 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'
            )}
            initial={{ width: `${hpRatio * 100}%` }}
            animate={{ width: `${hpRatio * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="mt-0.5 flex justify-between text-[8px] font-semibold text-white/40 tabular-nums">
          <span>HP</span>
          <span>{Math.round(unit.stats.currentHp)} / {Math.round(unit.stats.maxHp)}</span>
        </div>
      </div>
    </button>
  )
}

interface BattleHudPanelProps {
  playerUnits: BattleUnit[]
  enemyUnits: BattleUnit[]
  activeUnitId?: string
  targetUnitIds?: string[]
  onSelectTarget?: (unit: BattleUnit) => void
}

export function BattleHudPanel({
  playerUnits,
  enemyUnits,
  activeUnitId,
  targetUnitIds = [],
  onSelectTarget
}: BattleHudPanelProps) {
  // Sort player units so hunter is always first
  const sortedPlayers = [...playerUnits].sort((a, b) => {
    const aIsHunter = a.role !== 'shadow'
    const bIsHunter = b.role !== 'shadow'
    if (aIsHunter && !bIsHunter) return -1
    if (!aIsHunter && bIsHunter) return 1
    return 0
  })

  const hasActiveAction = !!activeUnitId || targetUnitIds.length > 0

  return {
    EnemyHud: (
      <div className="w-full bg-slate-900/60 border-b border-white/5 py-1 px-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-black tracking-wider text-rose-400/80">Enemy Party HUD</span>
          <span className="text-[8px] text-white/35">체력바 클릭 시 공격 타겟 선택 가능</span>
        </div>
        <div className="flex flex-wrap gap-1 max-h-[68px] sm:max-h-[76px] overflow-y-auto pr-1">
          {enemyUnits.map(unit => {
            const isActive = unit.unitId === activeUnitId
            const isTargeted = targetUnitIds.includes(unit.unitId)
            const isDimmed = hasActiveAction && !isActive && !isTargeted
            return (
              <HudUnitCard
                key={unit.unitId}
                unit={unit}
                team="enemy"
                isActive={isActive}
                isTargeted={isTargeted}
                isDimmed={isDimmed}
                onClick={onSelectTarget ? () => onSelectTarget(unit) : undefined}
              />
            )
          })}
        </div>
      </div>
    ),
    AllyHud: (
      <div className="w-full bg-slate-900/60 border-t border-white/5 py-1 px-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400/80">Ally Party HUD</span>
          <span className="text-[8px] text-white/35">헌터 및 소환 그림자 상태</span>
        </div>
        <div className="flex flex-wrap gap-1 max-h-[68px] sm:max-h-[76px] overflow-y-auto pr-1">
          {sortedPlayers.map(unit => {
            const isActive = unit.unitId === activeUnitId
            const isTargeted = targetUnitIds.includes(unit.unitId)
            const isDimmed = hasActiveAction && !isActive && !isTargeted
            return (
              <HudUnitCard
                key={unit.unitId}
                unit={unit}
                team="player"
                isActive={isActive}
                isTargeted={isTargeted}
                isDimmed={isDimmed}
              />
            )
          })}
        </div>
      </div>
    )
  }
}
