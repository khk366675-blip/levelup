import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { X, Play, RotateCcw, Swords, Bot, List, Shield, Swords as SwordsIcon, Sparkles } from 'lucide-react'
import type { BattleUnit, DirectBattleState, DirectBattleWinner } from '../../lib/directBattleTypes'
import { Battlefield2DView } from './Battlefield2DView'
import { BattleHudPanel } from './BattleHudPanel'
import { BattleCommandPanel } from './BattleCommandPanel'
import { CinematicLogOverlay } from '../CinematicLogOverlay'
import type { BattleActorViewModel } from '../../lib/battlePresentation'

interface BattleArenaOverlayProps {
  title: string
  note: string
  preview: {
    encounterKey: string
    state: DirectBattleState
    selections: Record<string, any>
    issues: string[]
    logs: any[]
  }
  roundReveal?: {
    steps: any[]
    index: number
  }
  playbackSpeed: 'normal' | 'fast'
  setPlaybackSpeed: React.Dispatch<React.SetStateAction<'normal' | 'fast'>>
  isRevealingRound: boolean
  battlefieldPhase: 'idle' | 'acting' | 'victory' | 'defeat' | 'cancelled'
  latestAction: any
  playerUnits: BattleUnit[]
  enemyUnits: BattleUnit[]
  actors: BattleActorViewModel[]
  skipRoundReveal: () => void
  setAutoSelections: () => void
  executeRound: (mode: 'auto' | 'manual') => void
  renderActionControls: (unit: BattleUnit) => React.ReactNode
  cancelBattle: () => void
  onClose: () => void
  showDetailed: boolean
  setShowDetailed: (show: boolean) => void
  renderUnit: (unit: BattleUnit, tone: 'player' | 'enemy') => React.ReactNode
  isAlive: (unit: any) => boolean
  onSelectTarget: (unit: BattleUnit) => void
  handleRevealLogChange: (log: any, index: number) => void
  handleRevealComplete: () => void
}

export function BattleArenaOverlay({
  title,
  note,
  preview,
  roundReveal,
  playbackSpeed,
  setPlaybackSpeed,
  isRevealingRound,
  battlefieldPhase,
  latestAction,
  playerUnits,
  enemyUnits,
  actors,
  skipRoundReveal,
  setAutoSelections,
  executeRound,
  renderActionControls,
  cancelBattle,
  onClose,
  showDetailed,
  setShowDetailed,
  renderUnit,
  isAlive,
  onSelectTarget,
  handleRevealLogChange,
  handleRevealComplete,
}: BattleArenaOverlayProps) {
  const [visualTestJob, setVisualTestJob] = useState<string>('off')

  // Body scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Find any active enemy unit that has a telegraph with severity medium/high/lethal
  const bossTelegraphs = preview.state.units
    .filter(u => u.team === 'enemy' && u.stats.currentHp > 0 && (u as any).telegraph && (u as any).telegraph.severity !== 'low')
    .map(u => ({
      unitName: u.displayName,
      isBoss: u.unitType === 'boss',
      telegraph: (u as any).telegraph,
    }))

  const activeWarning = bossTelegraphs.find(bt => bt.telegraph.severity === 'lethal') ||
                        bossTelegraphs.find(bt => bt.telegraph.severity === 'high') ||
                        bossTelegraphs.find(bt => bt.telegraph.severity === 'medium')

  // Create HUD Panel components
  const { EnemyHud, AllyHud } = BattleHudPanel({
    playerUnits: preview.state.units.filter(u => u.team === 'player'),
    enemyUnits: preview.state.units.filter(u => u.team === 'enemy'),
    activeUnitId: latestAction?.actorId,
    targetUnitIds: latestAction?.targetIds ?? [],
    onSelectTarget,
  })

  // Format winner name
  const getWinnerName = (winner?: DirectBattleWinner | null) => {
    if (winner === 'player') return '아군 승리'
    if (winner === 'enemy') return '적군 승리 (패배)'
    if (winner === 'none') return '무승부'
    return '진행 중'
  }

  const overlayContent = (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#020617]/96 backdrop-blur-[24px] text-white select-none overflow-hidden font-sans">
      {/* Background ambient light glow */}
      <div className="absolute top-0 left-1/4 w-[50vw] h-[30vh] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[50vw] h-[30vh] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Battle Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/85 px-4 py-2.5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-glow shadow-cyan-500" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-100">{title}</h2>
          </div>
          <p className="text-[10px] text-white/40">{note}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Active Round Skip Button */}
          {roundReveal && roundReveal.steps.length > 0 && (
            <button
              type="button"
              onClick={skipRoundReveal}
              className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-200 hover:bg-amber-500/20 transition active:scale-95 flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
            >
              전투 연출 스킵
            </button>
          )}
          {/* Round Indicator Badge */}
          <div className="rounded bg-black/45 border border-cyan-400/25 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
            ROUND <span className="font-black text-white">{preview.state.round}</span>
          </div>
          {/* Close minimize button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-white/10 bg-white/5 p-1 text-white/70 hover:bg-white/10 hover:text-white transition"
            title="최소화 (전투창 닫기)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* DEV · Battle Visual Test Override Bar */}
      <div className="bg-slate-950/90 border-b border-cyan-500/25 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 z-30 text-[11px] shrink-0">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold tracking-wider uppercase">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
          <span>DEV · Battle Visual Test</span>
          <span className="text-[9px] font-normal text-white/50 lowercase italic ml-1 leading-none">(실제 직업/스탯/저장 영향 없음)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-[10px]">표시 직업 오버라이드:</span>
          <select
            value={visualTestJob}
            onChange={(e) => setVisualTestJob(e.target.value)}
            className="bg-slate-900 border border-cyan-500/40 rounded px-2 py-0.5 text-cyan-200 text-[10px] font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="off">기존 직업 (Off)</option>
            <option value="base">노비스 헌터 (Base)</option>
            <option value="swordsman">검객 (Swordsman) ⚡</option>
            <option value="warrior">마검사/전사 (Warrior) 💥</option>
            <option value="mage">마법사 (Mage) 🔮</option>
            <option value="guardian">수호자 (Guardian) 🛡️</option>
            <option value="tracker">추적자 (Tracker) 🗡️</option>
            <option value="tactician">전술가 (Tactician) 📜</option>
            <option value="hidden-shadow">그림자 군주 (Hidden Shadow) ☠️</option>
            <option value="hidden-curse">저주술사 (Hidden Curse) 🩸</option>
            <option value="hidden-rift">차원지배자 (Hidden Rift) 🌀</option>
          </select>
        </div>
      </div>

      {/* HUD: Enemy Units HP */}
      {EnemyHud}

      {/* Main 2.5D Battlefield Arena */}
      <main className="flex-1 relative flex items-center justify-center bg-black/30 p-2 overflow-hidden">
        {activeWarning && !isRevealingRound && (
          <div className="absolute top-2 left-4 right-4 z-40 bg-gradient-to-r from-red-950/80 via-red-900/60 to-red-950/80 border border-red-500/40 rounded px-3 py-1.5 backdrop-blur-sm shadow-lg flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">⚠️</span>
              <div className="min-w-0">
                <div className="text-[9px] font-black text-red-400 tracking-wider uppercase leading-none">
                  {activeWarning.isBoss ? 'BOSS WARNING' : 'ELITE WARNING'}
                </div>
                <div className="text-[10px] text-white/90 font-bold truncate leading-tight mt-0.5">
                  [{activeWarning.unitName}]이(가) <span className="text-red-300">"{activeWarning.telegraph.telegraphName}"</span>을(를) 준비 중!
                </div>
              </div>
            </div>
            <div className="text-[9px] text-red-200/90 font-semibold bg-red-950/50 border border-red-400/20 rounded px-1.5 py-0.5 shrink-0">
              {activeWarning.telegraph.telegraphText}
            </div>
          </div>
        )}

        <Battlefield2DView
          actors={actors}
          battleType="gate"
          encounterKey={preview.encounterKey}
          phase={battlefieldPhase}
          latestAction={latestAction}
          mode="overlay"
          visualTestJob={visualTestJob}
        />

        {/* Round Reveal Cinematic Log Overlay */}
        {roundReveal && roundReveal.steps.length > 0 && (
          <div className="absolute inset-0 z-50 bg-black/10 flex flex-col justify-end p-4 pointer-events-none">
            <div className="w-full max-w-[340px] mx-auto mb-2 animate-fade-in z-50 pointer-events-auto">
              <div className="relative min-h-[48px] z-50">
                <CinematicLogOverlay
                  logs={roundReveal.steps.map(step => step.cinematicLog)}
                  visible={roundReveal.steps.length > 0}
                  intervalMs={playbackSpeed === 'normal' ? 1950 : 1100}
                  onLogChange={handleRevealLogChange}
                  onComplete={handleRevealComplete}
                  position="inline"
                  className="!relative !w-full !left-0 !top-0 text-[10px] sm:text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Battle Ended Screen Overlay */}
        {preview.state.isFinished && !roundReveal && (
          <div className="absolute inset-0 z-[45] bg-black/75 backdrop-blur-[3px] flex items-center justify-center">
            <div className={clsx(
              'max-w-[400px] w-[90%] border rounded-xl p-5 text-center shadow-3xl animate-bounce-short',
              preview.state.winner === 'player' ? 'border-amber-400/40 bg-slate-900/90 shadow-amber-400/10' : 'border-rose-500/40 bg-slate-900/90 shadow-rose-500/10'
            )}>
              <div className="text-white/40 text-[10px] font-black uppercase tracking-widest">BATTLE COMPLETE</div>
              <div className={clsx(
                'text-2xl font-black mt-1 uppercase tracking-wider',
                preview.state.winner === 'player' ? 'text-amber-400' : 'text-rose-400'
              )}>
                {getWinnerName(preview.state.winner)}
              </div>
              <p className="text-xs text-white/50 mt-2 px-4 leading-relaxed">
                {preview.state.winner === 'player' 
                  ? '차원의 틈새를 돌파했습니다! 아군의 승리로 직접 전투가 종료되었습니다.'
                  : '토벌에 실패했습니다. 유닛 구성을 변경하거나 추가 성장을 권장합니다.'
                }
              </p>
              <div className="mt-4 flex flex-col gap-1.5 justify-center">
                <div className="text-[10px] text-white/30">총 소요 라운드: {preview.state.round}R</div>
                <button
                  type="button"
                  onClick={onClose}
                  className={clsx(
                    'rounded-lg border px-4 py-2 text-xs font-bold transition shadow-md mt-1',
                    preview.state.winner === 'player'
                      ? 'border-amber-400/40 bg-amber-400/20 text-amber-200 hover:bg-amber-400/30'
                      : 'border-rose-400/40 bg-rose-400/20 text-rose-200 hover:bg-rose-400/30'
                  )}
                >
                  정산 완료 및 전투창 닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* HUD: Player Units HP */}
      {AllyHud}

      {/* Command Selector Panel */}
      <BattleCommandPanel
        playerUnits={playerUnits}
        enemyUnits={enemyUnits}
        isFinished={preview.state.isFinished}
        isRevealingRound={isRevealingRound}
        playbackSpeed={playbackSpeed}
        onChangePlaybackSpeed={() => setPlaybackSpeed(prev => prev === 'normal' ? 'fast' : 'normal')}
        onAutoSelect={setAutoSelections}
        onExecuteRound={executeRound}
        renderActionControls={renderActionControls}
        onMinimize={onClose}
        onGiveUp={cancelBattle}
      />

      {/* Recent Logs & Details Accordion */}
      <footer className="shrink-0 bg-slate-950 border-t border-white/10">
        {/* Recent logs (1 line) */}
        {!showDetailed && preview.logs.length > 0 && (
          <div className="px-3 py-1.5 bg-black/40 flex items-center justify-between text-[10px] text-white/55 border-b border-white/5">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-cyan-400 shrink-0">LATEST FEED:</span>
              <span className="truncate">{preview.logs[preview.logs.length - 1].message || preview.logs[preview.logs.length - 1]}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDetailed(true)}
              className="text-[9px] text-cyan-400 shrink-0 font-bold hover:underline"
            >
              로그 펼치기 ▲
            </button>
          </div>
        )}

        {/* Detailed accordion content */}
        {showDetailed && (
          <div className="border-t border-white/5 bg-slate-900/95 max-h-[160px] overflow-y-auto p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-1">
              <span className="text-[10px] font-bold text-white/50">전체 전투 정보 및 상세 로그</span>
              <button
                type="button"
                onClick={() => setShowDetailed(false)}
                className="text-[9px] text-cyan-400 font-bold hover:underline"
              >
                상세 정보 접기 ▼
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-[9px] font-bold system-text text-cyan-200/70">아군 파티 상세 스탯</div>
                <div className="space-y-1">{preview.state.units.filter(unit => unit.team === 'player').map(unit => renderUnit(unit, 'player'))}</div>
              </div>
              <div>
                <div className="mb-1 text-[9px] font-bold system-text text-rose-200/70">적 파티 상세 스탯</div>
                <div className="space-y-1">{preview.state.units.filter(unit => unit.team === 'enemy').map(unit => renderUnit(unit, 'enemy'))}</div>
              </div>
            </div>

            <div className="rounded border border-white/10 bg-black/25 p-2">
              <div className="mb-1.5 flex items-center gap-2 text-[9px] text-white/45 font-bold">
                <List className="h-3 w-3" />
                전체 전투 로그
              </div>
              <div className="max-h-[100px] overflow-y-auto space-y-0.5 pr-1 scrollbar-thin text-[10px] text-white/60">
                {preview.logs.length === 0 ? (
                  <div className="text-white/40">아직 로그가 없습니다.</div>
                ) : (
                  preview.logs.map((log, index) => (
                    <div key={`${log.round || 'r'}-${index}`} className="leading-snug">
                      <span className="mr-1.5 text-cyan-200/50">{log.round || 'Round'}R</span>
                      {log.message || log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </footer>
    </div>
  )

  return createPortal(overlayContent, document.body)
}
