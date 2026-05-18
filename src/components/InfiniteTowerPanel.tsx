import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { Swords, Trophy, Zap, Shield, FastForward, Hand, X } from 'lucide-react'
import { useGame } from '../lib/store'
import {
  getTowerFloorType,
  getTowerRecommendedPower,
  getTowerMonstersForFloor,
} from '../lib/infiniteTower'
import type { CinematicLogData, CinematicLogTone } from './CinematicLogOverlay'
import { CinematicLogOverlay } from './CinematicLogOverlay'
import { CombatLogPanel } from './CombatLogPanel'
import { DramaticReveal, type RevealStep } from './DramaticReveal'
import { gateTurnToLogEntry } from './GatePanel'
import type { ManualBattleAction, ManualBattleSession } from '../lib/types'
import { getEquippedShadows } from '../lib/shadows'
import { getPlayerCombatSkills, BASIC_ATTACK_SKILL } from '../lib/game'
import { SKILL_DEFINITIONS } from '../lib/seed'
import {
  canUseSkill,
  getSkillCooldownTurns,
  getSkillEffectiveDescription,
  getSkillMastery,
  getSkillSourceLabel,
  getSkillTypeLabel,
  isHunterCombatSkill,
} from '../lib/skills'

function classifyTowerLogTurn(turn: { actorId?: string; actorType?: string }): CinematicLogTone {
  if (turn.actorType === 'player') return 'player'
  if (turn.actorType === 'shadow') return 'shadow'
  if (turn.actorType === 'monster') return 'monster'
  if (turn.actorType === 'defense') return 'defense'
  return 'system'
}

function towerTurnToCinematicLog(turn: { turnNumber: number; actorId: string; actorType?: string; message: string; skillId?: string; skillName?: string; damage?: number }, index: number): CinematicLogData | undefined {
  if (!turn.message.trim()) return undefined
  const tone = classifyTowerLogTurn(turn)
  const isHunterSkill =
    turn.actorType === 'player' &&
    Boolean(turn.skillId) &&
    turn.skillId !== 'basic-attack' &&
    turn.skillId !== 'manual-defend' &&
    turn.skillId !== 'system-manual-battle'
  const badgeMap: Record<CinematicLogTone, string> = {
    player: '헌터', shadow: '그림자', monster: '몬스터', system: '시스템',
    reward: '보상', risk: '위험', command: '명령', result: '결과', defense: '방어',
  }
  const bodyParts = [
    turn.skillName && turn.skillName !== turn.message ? turn.skillName : undefined,
    turn.damage !== undefined ? `피해 ${Math.round(turn.damage)}` : undefined,
  ].filter(Boolean)

  return {
    id: `tower-cinematic-${turn.turnNumber}-${turn.actorId}-${index}`,
    tone: isHunterSkill ? 'player' : tone,
    badge: isHunterSkill ? 'SKILL' : badgeMap[tone] ?? '전투',
    title: isHunterSkill && turn.skillName ? `${turn.skillName} 발동` : turn.message,
    body: isHunterSkill
      ? [turn.message, turn.damage !== undefined ? `${Math.round(turn.damage)} 피해` : undefined].filter(Boolean).join(' · ')
      : bodyParts.join(' · ') || undefined,
  }
}

function HpBar({ label, hp, maxHp, color }: { label: string; hp: number; maxHp: number; color: 'cyan' | 'rose' }) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
  const barColor = color === 'cyan' ? 'bg-cyan-400' : 'bg-rose-400'
  return (
    <div>
      <div className="flex justify-between text-[10px] system-text mb-1">
        <span className={color === 'cyan' ? 'text-cyan-200' : 'text-rose-200'}>{label}</span>
        <span className="text-white/60">{Math.max(0, Math.round(hp))} / {Math.round(maxHp)}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', barColor)} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-ink-900/50 border border-white/10 rounded-md px-2.5 py-2">
      <div className="text-[9px] system-text text-white/35">{label}</div>
      <div className="text-sm font-bold text-white/80">{value}</div>
    </div>
  )
}

export function InfiniteTowerPanel() {
  const tower = useGame(s => s.infiniteTower)
  const startTowerBattle = useGame(s => s.startTowerBattle)
  const resolveTowerBattle = useGame(s => s.resolveTowerBattle)
  const cancelTowerBattle = useGame(s => s.cancelTowerBattle)
  const startTowerManualBattle = useGame(s => s.startTowerManualBattle)
  const performTowerManualBattleAction = useGame(s => s.performTowerManualBattleAction)
  const cancelTowerManualBattle = useGame(s => s.cancelTowerManualBattle)
  const combatLogs = useGame(s => s.combatLogs)
  const manualSession = useGame(s => s.manualBattleSession)
  const hunter = useGame(s => s.hunter)
  const items = useGame(s => s.items)
  const equipment = useGame(s => s.equipment)
  const ownedShadows = useGame(s => s.ownedShadows ?? [])
  const equippedShadowIds = useGame(s => s.equippedShadowIds ?? [])
  const skillStates = useGame(s => s.skillStates ?? {})

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [cinematicLogs, setCinematicLogs] = useState<CinematicLogData[]>([])
  const [skipSignal, setSkipSignal] = useState(0)
  const [showConsumables, setShowConsumables] = useState(false)
  const [manualCinematicLogs, setManualCinematicLogs] = useState<CinematicLogData[]>([])
  const [manualSkipSignal, setManualSkipSignal] = useState(0)
  const [resultRevealSeenId, setResultRevealSeenId] = useState<string | undefined>()
  const prevLogCountRef = useRef(0)

  const towerState = tower ?? { currentFloor: 1, highestClearedFloor: 0, clearedFloors: {}, firstClearRewardsClaimed: {}, bossRewardsClaimed: {}, activeTowerBattle: undefined }
  const currentFloor = towerState.currentFloor
  const highestCleared = towerState.highestClearedFloor
  const activeBattle = towerState.activeTowerBattle

  const challengeFloor = selectedFloor ?? currentFloor
  const floorType = getTowerFloorType(challengeFloor)
  const recommendedPower = getTowerRecommendedPower(challengeFloor)
  const monsters = getTowerMonstersForFloor(challengeFloor)
  const isBoss = floorType === 'boss'

  const isAutoRevealing = activeBattle?.status === 'revealing'
  const isResolved = activeBattle?.status === 'resolved'
  const showResult = activeBattle?.showResult ?? false

  const towerCombatLog = activeBattle
    ? combatLogs.find(log => log.battleId === activeBattle.id)
    : undefined

  const isTowerManual = manualSession?.source === 'tower'

  // Auto battle: build cinematic logs when revealing
  useEffect(() => {
    if (isAutoRevealing && activeBattle?.logs) {
      const logs = activeBattle.logs
        .map((turn, idx) => towerTurnToCinematicLog(turn as any, idx))
        .filter((l): l is CinematicLogData => Boolean(l))
      setCinematicLogs(logs)
    }
  }, [isAutoRevealing, activeBattle?.id])

  // Manual battle: build cinematic logs from new session logs
  useEffect(() => {
    if (!isTowerManual || !manualSession) return
    const prev = prevLogCountRef.current
    if (manualSession.logs.length > prev) {
      const next = manualSession.logs
        .slice(prev)
        .map((turn, idx) => towerTurnToCinematicLog(turn as any, prev + idx))
        .filter((l): l is CinematicLogData => Boolean(l))
      setManualCinematicLogs(next)
    } else if (manualSession.logs.length < prev) {
      setManualCinematicLogs([])
    }
    prevLogCountRef.current = manualSession.logs.length
  }, [isTowerManual, manualSession?.logs.length])

  const handleAutoBattle = () => {
    setCinematicLogs([])
    startTowerBattle(challengeFloor)
  }

  const handleManualBattle = () => {
    setManualCinematicLogs([])
    prevLogCountRef.current = 0
    startTowerManualBattle(challengeFloor)
  }

  const handleSkip = () => {
    setSkipSignal(s => s + 1)
  }

  const handleCinematicComplete = () => {
    setCinematicLogs([])
    resolveTowerBattle()
  }

  const handleCloseResult = () => {
    cancelTowerBattle()
  }

  const handleManualAction = (action: ManualBattleAction) => {
    performTowerManualBattleAction(action)
  }

  const handleManualCancel = () => {
    cancelTowerManualBattle()
    setManualCinematicLogs([])
    prevLogCountRef.current = 0
  }

  const currentCinematicLogs = isAutoRevealing
    ? cinematicLogs
    : []
  const shouldShowResultReveal = Boolean(
    isResolved &&
    showResult &&
    activeBattle?.result &&
    activeBattle.id !== resultRevealSeenId
  )
  const resultIsBoss = activeBattle?.floorType === 'boss'
  const resultRevealTone = activeBattle?.result?.outcome === 'victory'
    ? resultIsBoss
      ? 'tower'
      : 'success'
    : 'failure'
  const resultRevealSteps: RevealStep[] = activeBattle?.result
    ? activeBattle.result.outcome === 'victory'
      ? [
          {
            title: resultIsBoss ? 'BOSS CLEARED' : 'FLOOR CLEARED',
            text: resultIsBoss ? `${activeBattle.floor}층의 주인이 쓰러졌다.` : `${activeBattle.floor}층을 돌파했다.`,
            subtext: activeBattle.result.firstClear ? '첫 클리어 보상이 열립니다.' : '반복 클리어 보상이 정산됩니다.',
            durationMs: 950,
            tone: resultRevealTone,
          },
          {
            title: 'REWARD',
            text: activeBattle.result.rewards.boxType ? '보스 박스가 전리품에 추가되었다.' : '탑의 보상이 정산된다.',
            subtext: activeBattle.result.rewards.hunterXp ? `XP +${activeBattle.result.rewards.hunterXp}` : undefined,
            durationMs: 1050,
            tone: activeBattle.result.rewards.boxType ? 'rank' : 'success',
            emphasis: true,
          },
        ]
      : [
          {
            title: 'FLOOR HELD',
            text: activeBattle.result.outcome === 'defeat' ? `${activeBattle.floor}층을 넘지 못했다.` : `${activeBattle.floor}층의 시간이 닫혔다.`,
            subtext: '전투력을 정비한 뒤 다시 도전할 수 있습니다.',
            durationMs: 1100,
            tone: 'failure',
            emphasis: true,
          },
        ]
    : []

  const nextBossFloor = Math.ceil((highestCleared + 1) / 5) * 5
  const floorsNear = Array.from(new Set(Array.from({ length: 5 }, (_, i) => Math.max(1, currentFloor - 2 + i)))).filter(f => f >= 1)

  // Manual battle UI helpers
  const equippedItems = items.filter(item => Object.values(equipment).includes(item.id))
  const playerSkills = getPlayerCombatSkills({ jobId: hunter.jobId, equippedItems, allSkills: SKILL_DEFINITIONS, includeBasicKit: true })
    .filter(isHunterCombatSkill)
  const equippedShadows = getEquippedShadows(ownedShadows, equippedShadowIds, hunter)

  const combatConsumables = items.filter(item =>
    item.consumable &&
    item.consumableEffects?.some(effect =>
      effect.type === 'gate_penalty_reduction' ||
      (effect.type === 'temporary_stat_bonus' && effect.stat && effect.stat !== 'INT')
    )
  )
  const consumableGroups = combatConsumables.reduce<Array<{ item: typeof combatConsumables[0]; count: number }>>((groups, item) => {
    const key = `${item.name}:${JSON.stringify(item.consumableEffects)}`
    const existing = groups.find(g => `${g.item.name}:${JSON.stringify(g.item.consumableEffects)}` === key)
    if (existing) existing.count += 1
    else groups.push({ item, count: 1 })
    return groups
  }, [])

  const getConsumableDisabledReason = (item: typeof combatConsumables[0], session: ManualBattleSession): string | undefined => {
    const effectTypes = item.consumableEffects
      ?.filter(effect => effect.type === 'gate_penalty_reduction' || (effect.type === 'temporary_stat_bonus' && effect.stat && effect.stat !== 'INT'))
      .map(effect => effect.type) ?? []
    if (session.consumableUseCount >= 2) return '사용 제한 도달'
    if (session.usedConsumableItemIds.includes(item.id)) return '이미 사용함'
    if (effectTypes.some(type => session.usedConsumableEffectTypes.includes(type))) return '같은 효과 사용함'
    if (effectTypes.includes('gate_penalty_reduction') && session.consumableEffects.some(effect => !effect.consumed && effect.type === 'gate_penalty_reduction')) return '패널티 감소 활성화 중'
    if (effectTypes.includes('temporary_stat_bonus') && session.activeEffects.some(effect => effect.sourceSkillId.startsWith('manual-consumable-stat-'))) return '능력치 소모품 활성화 중'
    return undefined
  }

  const manualMonsterDef = isTowerManual && challengeFloor
    ? getTowerMonstersForFloor(challengeFloor)[0]
    : undefined

  return (
    <div className="panel corner-bracket relative overflow-hidden p-4 sm:p-5 border border-violet-400/30 bg-violet-500/5">
      <div className="br" />
      <DramaticReveal
        isOpen={shouldShowResultReveal}
        steps={resultRevealSteps}
        tone={resultRevealTone}
        position="modal"
        result={activeBattle?.result && (
          <div className="grid gap-2 text-sm">
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white/75">
              {activeBattle.result.outcome === 'victory' ? `${activeBattle.floor}층 클리어` : `${activeBattle.floor}층 재도전 가능`}
            </div>
            {activeBattle.result.rewards.shadowEssence ? (
              <div className="rounded-md border border-purple-300/20 bg-purple-400/10 px-3 py-2 text-purple-100">
                그림자 정수 +{activeBattle.result.rewards.shadowEssence}
              </div>
            ) : null}
            {activeBattle.result.rewards.boxType ? (
              <div className="rounded-md border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-amber-100">
                보스 박스 획득
              </div>
            ) : null}
          </div>
        )}
        onComplete={() => {
          if (activeBattle) setResultRevealSeenId(activeBattle.id)
        }}
      />

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="system-text text-[11px] text-violet-300/80 mb-1">INFINITE TOWER</div>
          <h2 className="text-xl font-bold text-violet-100">무한의 탑</h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] system-text text-white/45">최고 클리어</div>
          <div className="text-lg font-black text-violet-200">{highestCleared}층</div>
        </div>
      </div>

      {/* Floor navigation */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {floorsNear.map(floor => {
          const isCurrent = floor === currentFloor
          const isBossFloor = floor % 5 === 0
          return (
            <button
              key={floor}
              type="button"
              onClick={() => {
                setSelectedFloor(floor)
                if (!isTowerManual) cancelTowerBattle()
              }}
              className={clsx(
                'inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-bold transition',
                isCurrent
                  ? 'border-violet-300/50 bg-violet-400/15 text-violet-100'
                  : 'border-white/10 bg-white/5 text-white/50',
                isBossFloor && 'ring-1 ring-amber-300/30'
              )}
            >
              {isBossFloor && <Trophy className="w-3 h-3 text-amber-300" />}
              {floor}층
            </button>
          )
        })}
      </div>

      {/* Challenge card (shown when no battle active) */}
      {!isAutoRevealing && !isTowerManual && (
        <div className={clsx('mb-4 rounded-lg border p-4', isBoss ? 'tower-boss-warning border-amber-300/25 bg-amber-400/8' : 'border-violet-300/20 bg-violet-400/8')}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={clsx('system-text text-[10px] px-1.5 py-0.5 rounded border', isBoss ? 'border-amber-300/30 text-amber-200' : 'border-violet-300/30 text-violet-200')}>
                {isBoss ? 'BOSS FLOOR' : 'NORMAL'}
              </span>
              <span className="text-sm font-bold text-white/90">{challengeFloor}층</span>
            </div>
          </div>

          <div className="mb-3 space-y-1">
            <div className="text-xs text-white/55">추천 전투력: <span className="font-bold text-white/80">{recommendedPower}</span></div>
            {monsters.length > 0 && (
              <div className="text-xs text-white/55">
                등장 몬스터: {monsters.map(m => m.name).join(', ')}
              </div>
            )}
          </div>

          {isBoss && (
            <div className="mb-3 text-[11px] text-amber-200/70 border border-amber-400/15 rounded px-2 py-1.5 bg-amber-400/5">
              보스층입니다. 수동 전투와 소모품 사용을 권장합니다.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleAutoBattle}
              className={clsx(
                'inline-flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-bold transition',
                isBoss
                  ? 'border-amber-300/35 bg-amber-400/12 text-amber-100 hover:bg-amber-400/18'
                  : 'border-violet-300/35 bg-violet-400/12 text-violet-100 hover:bg-violet-400/18'
              )}
            >
              <Zap className="w-4 h-4" />
              자동 전투
            </button>
            <button
              type="button"
              onClick={handleManualBattle}
              className={clsx(
                'inline-flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-bold transition',
                isBoss
                  ? 'border-amber-300/35 bg-amber-400/12 text-amber-100 hover:bg-amber-400/18'
                  : 'border-cyan-300/35 bg-cyan-400/12 text-cyan-100 hover:bg-cyan-400/18'
              )}
            >
              <Hand className="w-4 h-4" />
              수동 전투
            </button>
          </div>
        </div>
      )}

      {/* Auto battle: cinematic overlay */}
      {isAutoRevealing && (
        <div className="mb-4 relative">
          <CinematicLogOverlay
            logs={currentCinematicLogs}
            visible={currentCinematicLogs.length > 0}
            intervalMs={2600}
            skipSignal={skipSignal}
            onComplete={handleCinematicComplete}
            position="center"
          />
          {currentCinematicLogs.length > 0 && (
            <div className="absolute right-0 top-0 z-40">
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-1 text-[10px] system-text text-amber-200 border border-amber-400/25 bg-amber-400/10 rounded px-2 py-1 hover:bg-amber-400/15 transition"
              >
                <FastForward className="w-3 h-3" />
                스킵
              </button>
            </div>
          )}
          {currentCinematicLogs.length === 0 && (
            <div className="text-center text-xs text-white/40 py-4">전투 결과 확인 중...</div>
          )}
        </div>
      )}

      {/* Manual battle panel */}
      {isTowerManual && manualSession && (
        <div className="mb-4">
          {/* Cinematic overlay for manual actions */}
          <div className="relative mb-4">
            <CinematicLogOverlay
              logs={manualCinematicLogs}
              visible={manualCinematicLogs.length > 0}
              intervalMs={1800}
              skipSignal={manualSkipSignal}
              onComplete={() => setManualCinematicLogs([])}
              position="center"
            />
            {manualCinematicLogs.length > 0 && (
              <div className="absolute right-0 top-0 z-40">
                <button
                  type="button"
                  onClick={() => setManualSkipSignal(s => s + 1)}
                  className="inline-flex items-center gap-1 text-[10px] system-text text-amber-200 border border-amber-400/25 bg-amber-400/10 rounded px-2 py-1 hover:bg-amber-400/15 transition"
                >
                  <FastForward className="w-3 h-3" />
                  스킵
                </button>
              </div>
            )}
          </div>

          {/* Status header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="system-text text-[11px] text-cyan-300/80 mb-0.5">MANUAL TURN BATTLE</div>
              <div className="text-sm font-bold text-cyan-100">{manualSession.gateName}</div>
            </div>
            <div className="text-xs system-text border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 rounded px-2 py-1">
              행동 {manualSession.logs.filter(l => l.skillId !== 'system-manual-battle').length} / {manualSession.maxTurns}
            </div>
          </div>

          {/* HP bars */}
          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <div className="space-y-3 border border-white/10 rounded-lg p-3 bg-ink-900/35">
              <HpBar label={manualSession.player.name} hp={manualSession.player.hp} maxHp={manualSession.player.maxHp} color="cyan" />
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="ATK" value={Math.round(manualSession.player.atk)} />
                <StatPill label="DEF" value={Math.round(manualSession.player.def)} />
                <StatPill label="SPD" value={Math.round(manualSession.player.spd)} />
              </div>
            </div>
            <div className="space-y-3 border border-rose-400/20 rounded-lg p-3 bg-rose-500/5">
              <HpBar label={manualSession.monster.name} hp={manualSession.monster.hp} maxHp={manualSession.monster.maxHp} color="rose" />
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="ATK" value={Math.round(manualSession.monster.atk)} />
                <StatPill label="DEF" value={Math.round(manualSession.monster.def)} />
                <StatPill label="SPD" value={Math.round(manualSession.monster.spd)} />
              </div>
              {manualMonsterDef && (
                <div className="text-xs text-rose-100/65 leading-relaxed border-t border-rose-400/15 pt-2">
                  <span className="system-text text-[10px] text-rose-200/80 mr-2">CURRENT MONSTER</span>
                  <span className="system-text text-[10px] border border-rose-400/25 rounded px-1.5 text-rose-100/70">{manualMonsterDef.rank}-RANK</span>
                  <div className="mt-1">{manualMonsterDef.description}</div>
                </div>
              )}
            </div>
          </div>

          {/* Shadow roster */}
          {equippedShadows.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {equippedShadows.map(shadow => (
                <div key={shadow.instanceId} className="inline-flex items-center gap-1.5 text-[10px] border border-purple-400/20 bg-purple-400/10 text-purple-100/70 rounded px-2 py-1">
                  <span>{shadow.name}</span>
                  <span className="text-white/40">Lv.{shadow.level}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => handleManualAction({ type: 'basic_attack' })} className="btn btn-primary text-sm min-h-12">
                <Swords className="w-4 h-4" /> 기본 공격
              </button>
              <button type="button" onClick={() => handleManualAction({ type: 'defend' })} className="btn text-sm min-h-12 border-cyan-400/25 bg-cyan-400/10 text-cyan-100">
                <Shield className="w-4 h-4" /> 방어 <span className="text-[10px] text-cyan-100/60 ml-1">피해 -40%</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {playerSkills.filter(skill => skill.id !== BASIC_ATTACK_SKILL.id).map(skill => {
                const runtime = getSkillMastery(skillStates, skill.id)
                const cooldown = manualSession.cooldowns[skill.id] ?? 0
                const availability = canUseSkill(skill, manualSession)
                const disabled = !availability.canUse
                const description = getSkillEffectiveDescription(skill, runtime)
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleManualAction({ type: 'skill', skillId: skill.id })}
                    disabled={disabled}
                    title={description}
                    className="min-h-[64px] rounded-md border border-purple-400/25 bg-purple-400/10 px-3 py-2 text-left text-purple-50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-400/15 transition"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold truncate">{skill.name}</span>
                      <span className="shrink-0 text-[9px] system-text border border-purple-300/25 rounded px-1.5 py-0.5 text-purple-100/70">
                        {getSkillSourceLabel(skill)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-white/55 line-clamp-2">{description}</span>
                    <span className="mt-0.5 flex flex-wrap gap-1.5 text-[10px] system-text text-purple-100/70">
                      <span>{getSkillTypeLabel(skill)}</span>
                      <span>CD {cooldown > 0 ? cooldown : getSkillCooldownTurns(skill)}</span>
                      <span className={cooldown > 0 ? 'text-amber-200' : 'text-emerald-200'}>{availability.reason}</span>
                      <span>숙련 Lv.{runtime.masteryLevel ?? 0}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Consumables */}
            <div className="border border-emerald-400/20 bg-emerald-400/5 rounded-lg p-3">
              <button
                type="button"
                onClick={() => setShowConsumables(prev => !prev)}
                className="w-full min-h-10 flex items-center justify-between gap-3 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-emerald-100">소모품 사용</span>
                  <span className="block text-[11px] text-white/45 mt-0.5">
                    전투용 {consumableGroups.length}종 · 사용 {manualSession.consumableUseCount} / 2
                  </span>
                </span>
                <span className="text-[10px] system-text text-emerald-200 border border-emerald-400/25 rounded px-2 py-1">
                  {showConsumables ? '닫기' : '열기'}
                </span>
              </button>
              {showConsumables && (
                <div className="mt-3 space-y-2">
                  <div className="text-[11px] text-emerald-100/65 leading-relaxed">
                    소모품 사용도 플레이어 행동입니다. 사용 후 몬스터가 행동하며, 전투를 포기해도 이미 쓴 소모품은 돌아오지 않습니다.
                  </div>
                  {consumableGroups.length === 0 && (
                    <div className="rounded-md border border-white/10 bg-ink-900/35 px-3 py-3 text-xs text-white/45">
                      전투 중 사용할 수 있는 소모품이 없습니다.
                    </div>
                  )}
                  {consumableGroups.map(({ item, count }) => {
                    const disabledReason = getConsumableDisabledReason(item, manualSession)
                    return (
                      <div key={`${item.name}-${item.id}`} className="rounded-md border border-white/10 bg-ink-900/35 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{item.icon}</span>
                              <span className="text-sm font-semibold text-white/85 truncate">{item.name}</span>
                              <span className="text-[10px] system-text text-white/40">x{count}</span>
                            </div>
                            {disabledReason && <div className="text-[10px] text-amber-200 mt-1">{disabledReason}</div>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleManualAction({ type: 'use_consumable', itemId: item.id })}
                            disabled={Boolean(disabledReason)}
                            className="shrink-0 min-h-10 px-3 rounded-md border border-emerald-400/25 bg-emerald-400/10 text-xs text-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            사용
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <button type="button" onClick={() => handleManualAction({ type: 'auto_finish' })} className="btn text-sm min-h-10 border-amber-400/25 bg-amber-400/10 text-amber-100">
                <Zap className="w-3 h-3" /> 자동 마무리
              </button>
              <button type="button" onClick={handleManualCancel} className="btn text-sm min-h-10 border-rose-400/25 bg-rose-400/10 text-rose-100">
                <X className="w-3 h-3" /> 전투 포기
              </button>
            </div>
          </div>

          {/* Combat log */}
          <CombatLogPanel
            title="RECENT BATTLE LOG"
            subtitle="버튼 입력 직후 최신 행동이 위에 고정됩니다."
            logs={manualSession.logs.map(gateTurnToLogEntry)}
            maxVisible={6}
            latestFirst
            highlightLatest
            compact
            emptyText="행동을 선택하면 전투가 진행됩니다."
            className="mb-2"
          />
        </div>
      )}

      {/* Result card (shown after resolving) */}
      {isResolved && showResult && activeBattle?.result && (
        <div className="mb-4">
          <div className={clsx('rounded-lg border p-4', activeBattle.result.outcome === 'victory' ? 'border-emerald-300/25 bg-emerald-400/8' : 'border-rose-300/25 bg-rose-400/8')}>
            <div className="text-sm font-bold mb-2">
              {activeBattle.result.outcome === 'victory' ? (
                <span className="text-emerald-200">✓ {activeBattle.floor}층 클리어</span>
              ) : activeBattle.result.outcome === 'defeat' ? (
                <span className="text-rose-200">✗ {activeBattle.floor}층 실패</span>
              ) : (
                <span className="text-amber-200">⏱ {activeBattle.floor}층 시간 초과</span>
              )}
            </div>
            <div className="text-xs text-white/55 space-y-0.5">
              {activeBattle.result.rewards.hunterXp ? <div>XP +{activeBattle.result.rewards.hunterXp}</div> : null}
              {activeBattle.result.rewards.shadowEssence ? <div>정수 +{activeBattle.result.rewards.shadowEssence}</div> : null}
              {activeBattle.result.rewards.boxType ? <div className="text-amber-300/80">보스 박스 획득</div> : null}
              {activeBattle.result.firstClear ? <div className="text-emerald-300/70">첫 클리어 보상</div> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCloseResult}
                className="text-[10px] system-text text-white/50 border border-white/10 rounded px-2 py-0.5 hover:bg-white/5 transition"
              >
                닫기
              </button>
              {activeBattle.result.outcome === 'victory' && (
                <button
                  type="button"
                  onClick={() => {
                    handleCloseResult()
                    setSelectedFloor(activeBattle.floor + 1)
                  }}
                  className="text-[10px] system-text text-emerald-200 border border-emerald-400/25 bg-emerald-400/10 rounded px-2 py-0.5 hover:bg-emerald-400/15 transition"
                >
                  다음 층 도전
                </button>
              )}
              {activeBattle.result.outcome !== 'victory' && (
                <button
                  type="button"
                  onClick={handleCloseResult}
                  className="text-[10px] system-text text-amber-200 border border-amber-400/25 bg-amber-400/10 rounded px-2 py-0.5 hover:bg-amber-400/15 transition"
                >
                  재도전
                </button>
              )}
            </div>
          </div>

          {towerCombatLog && (
            <CombatLogPanel
              title="TOWER BATTLE LOG"
              subtitle={`${activeBattle.floor}층 전투 기록`}
              logs={towerCombatLog.turns.map(gateTurnToLogEntry)}
              maxVisible={5}
              highlightLatest
              compact
            />
          )}
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded border border-white/10 bg-white/5 p-2">
          <div className="text-[10px] system-text text-white/45">다음 보스층</div>
          <div className="text-sm font-bold text-amber-200">{nextBossFloor}층</div>
        </div>
        <div className="rounded border border-white/10 bg-white/5 p-2">
          <div className="text-[10px] system-text text-white/45">첫 클리어 보상</div>
          <div className="text-sm font-bold text-emerald-200">
            {Object.keys(towerState.firstClearRewardsClaimed).length}개
          </div>
        </div>
      </div>
    </div>
  )
}
