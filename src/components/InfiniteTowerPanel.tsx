import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import clsx from 'clsx'
import { Swords, Trophy, Zap, Shield, FastForward, X } from 'lucide-react'
import { useGame } from '../lib/store'
import {
  getTowerFloorType,
  getTowerRecommendedPower,
  getTowerMonstersForFloor,
} from '../lib/infiniteTower'
import type { CinematicLogData, CinematicLogTone } from './CinematicLogOverlay'
import { CinematicLogOverlay } from './CinematicLogOverlay'
import { CombatLogPanel } from './CombatLogPanel'
import { DirectBattlePreviewPanel, type DirectBattlePanelCompletePayload } from './DirectBattlePreviewPanel'
import { DramaticReveal, type RevealStep } from './DramaticReveal'
import { gateTurnToLogEntry } from './GatePanel'
import { MonsterIntentPanel } from './MonsterIntentPanel'
import { SkillActionCard, skillSourceSortRank, skillTypeSortRank } from './SkillActionCard'
import type { BattleTurn, CombatLog, ManualBattleAction, ManualBattleSession } from '../lib/types'
import { getEquippedShadows } from '../lib/shadows'
import { getPlayerCombatSkills, BASIC_ATTACK_SKILL } from '../lib/game'
import { getDirectBattleEncounterShortLabelKo } from '../lib/directBattleLabels'
import {
  getCombatPowerComparison,
  getHunterCombatPowerBreakdown,
} from '../lib/combatPower'
import { getSecretVisibleFragments } from '../lib/secrets'
import { SKILL_DEFINITIONS } from '../lib/seed'
import { getMonsterIntent, getSkillIntentHint } from '../lib/combatIntent'
import {
  canUseSkill,
  getSkillMastery,
  isHunterCombatSkill,
} from '../lib/skills'
import { pickDirectTowerEncounterKey } from '../lib/directBattleEncounters'

const sortTowerCombatSkills = (skills: ReturnType<typeof getPlayerCombatSkills>, cooldowns: Record<string, number>) => (
  [...skills].sort((a, b) => {
    const aReady = (cooldowns[a.id] ?? 0) <= 0
    const bReady = (cooldowns[b.id] ?? 0) <= 0
    if (aReady !== bReady) return aReady ? -1 : 1
    return skillSourceSortRank(a) - skillSourceSortRank(b)
      || skillTypeSortRank(a) - skillTypeSortRank(b)
      || a.name.localeCompare(b.name, 'ko')
  })
)

function classifyTowerLogTurn(turn: { actorId?: string; actorType?: string }): CinematicLogTone {
  if (turn.actorType === 'player') return 'player'
  if (turn.actorType === 'shadow') return 'shadow'
  if (turn.actorType === 'monster') return 'monster'
  if (turn.actorType === 'defense') return 'defense'
  return 'system'
}

function splitCinematicMessage(message: string) {
  const normalized = message.replace(/\s+/g, ' ').trim()
  const parts = normalized.split(/(?<=[.!?。])\s+|(?<=\.)\s+/).filter(Boolean)
  return {
    title: parts[0] ?? normalized,
    body: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
  }
}

function towerTurnToCinematicLog(
  turn: { turnNumber: number; actorId: string; actorType?: string; targetType?: 'player' | 'monster'; message: string; skillId?: string; skillName?: string; damage?: number; outcome?: string; remainingHp?: number },
  index: number,
  session?: ManualBattleSession
): CinematicLogData | undefined {
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
  
  const message = splitCinematicMessage(turn.message)
  const actualSession = (session && 'startedAt' in session) ? session : undefined

  let title = isHunterSkill && turn.skillName ? `${turn.skillName} 발동` : message.title
  let bodyText = message.body

  if (actualSession) {
    const playerMaxHp = actualSession.player.maxHp
    const monsterMaxHp = actualSession.monster.maxHp

    const isFinishingBlow = turn.targetType === 'monster' && turn.remainingHp === 0 && (turn.outcome === 'hit' || turn.outcome === 'critical')
    const isPlayerDanger = turn.targetType === 'player' && turn.remainingHp !== undefined && playerMaxHp > 0 && (turn.remainingHp / playerMaxHp) <= 0.3
    const isMonsterWeakness = turn.targetType === 'monster' && turn.remainingHp !== undefined && turn.remainingHp > 0 && monsterMaxHp > 0 && (turn.remainingHp / monsterMaxHp) <= 0.3

    if (isFinishingBlow) {
      title = `[🎯 결정타] ${title}`
    } else if (isPlayerDanger) {
      bodyText = bodyText ? `[⚠️ 위기] ${bodyText}` : `[⚠️ 위기] 생명력 급감!`
    } else if (isMonsterWeakness) {
      title = `[⚡ 기회] ${title}`
    }
  }

  const outcome = turn.outcome
  if (outcome === 'victory' || outcome === 'defeat' || outcome === 'draw' || turn.actorId === 'result') {
    const winKeywords = ['승리', 'victory', 'Cleared']
    const failKeywords = ['패배', 'defeat', 'Failed']
    if (winKeywords.some(k => title.toLowerCase().includes(k.toLowerCase()))) {
      title = `[🏆 승리] ${title}`
    } else if (failKeywords.some(k => title.toLowerCase().includes(k.toLowerCase()))) {
      title = `[❌ 패배] ${title}`
    } else {
      title = `[⏳ 무승부] ${title}`
    }
  }

  const bodyParts = [
    bodyText,
    turn.damage !== undefined ? `피해 ${Math.round(turn.damage)}` : undefined,
    turn.skillName && turn.skillName !== turn.message ? turn.skillName : undefined,
  ].filter(Boolean)

  let visualDelta: CinematicLogData['visualDelta']
  if (turn.damage !== undefined && turn.damage !== 0 && turn.targetType) {
    const isHeal = turn.outcome === 'heal'
    visualDelta = {
      target: turn.targetType,
      hpChange: isHeal ? turn.damage : -turn.damage,
      newHp: turn.remainingHp,
    }
  }

  return {
    id: `tower-cinematic-${turn.turnNumber}-${turn.actorId}-${index}`,
    tone: isHunterSkill ? 'player' : tone,
    badge: isHunterSkill ? 'SKILL' : badgeMap[tone] ?? '전투',
    title,
    body: isHunterSkill
      ? [title, turn.damage !== undefined ? `${Math.round(turn.damage)} 피해` : undefined].filter(Boolean).join(' · ')
      : bodyParts.join(' · ') || undefined,
    visualDelta,
  }
}

function HpBar({ label, hp, maxHp, color }: { label: string; hp: number; maxHp: number; color: 'cyan' | 'rose' }) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
  const percent = Math.round(ratio * 100)
  
  const barClassName = ratio <= 0.25
    ? 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse'
    : ratio <= 0.5
      ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
      : color === 'cyan'
        ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
        : 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]'

  const isLowHp = ratio > 0 && ratio <= 0.3

  return (
    <div>
      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs mb-1">
        <span className="font-semibold text-white/85 truncate flex items-center gap-1.5 min-w-0">
          <span className="truncate">{label}</span>
          {isLowHp && (
            color === 'cyan' ? (
              <span className="shrink-0 text-[8px] font-black bg-rose-500/25 text-rose-300 border border-rose-500/35 px-1 rounded tracking-tighter animate-pulse">
                DANGER
              </span>
            ) : (
              <span className="shrink-0 text-[8px] font-black bg-amber-500/25 text-amber-300 border border-amber-500/35 px-1 rounded tracking-tighter animate-pulse">
                FINISH CHANCE
              </span>
            )
          )}
        </span>
        <span className="system-text text-white/50 shrink-0 select-none">
          {Math.max(0, Math.ceil(hp))}/{Math.ceil(maxHp)} · {percent}%
        </span>
      </div>
      <div className="h-3 sm:h-4 rounded bg-ink-950/70 border border-white/10 overflow-hidden relative">
        <div className={`h-full ${barClassName} transition-all duration-300`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

const getDirectTowerEncounterKey = (floor: number, floorType = getTowerFloorType(floor)): string =>
  pickDirectTowerEncounterKey(floor, floorType)

const getDirectTowerEnemyBaseLevel = (floor: number, floorType = getTowerFloorType(floor)): number => {
  const normalLevel = 5 + Math.floor(floor * 0.72)
  const bossLevel = 8 + Math.floor(floor * 0.85)
  return Math.max(1, floorType === 'boss' ? bossLevel : normalLevel)
}

const directLogToTowerTurn = (
  payload: DirectBattlePanelCompletePayload,
  index: number,
): BattleTurn => {
  const log = payload.logs[index]
  const actor = payload.state.units.find(unit => unit.unitId === log.actorUnitId)
  const target = payload.state.units.find(unit => unit.unitId === log.targetUnitIds?.[0])
  const fallbackTarget = target ?? actor ?? payload.state.units[0]
  const actorIsEnemy = actor?.team === 'enemy'
  const targetIsEnemy = fallbackTarget?.team === 'enemy'
  const hpAfter = fallbackTarget ? log.hpAfterByUnitId?.[fallbackTarget.unitId]?.currentHp : undefined
  const outcome: BattleTurn['outcome'] =
    log.eventType === 'heal' ? 'heal' :
    log.eventType === 'status' || log.eventType === 'reaction' ? 'buff' :
    'hit'

  return {
    turnNumber: index + 1,
    waveNumber: Math.max(1, log.round),
    actorType: actorIsEnemy ? 'monster' : 'player',
    actorId: actor?.unitId ?? `direct-tower-system-${index + 1}`,
    actorName: actor?.displayName ?? 'Direct Tower Battle',
    targetType: targetIsEnemy ? 'monster' : 'player',
    targetId: fallbackTarget?.unitId ?? `direct-tower-target-${index + 1}`,
    targetName: fallbackTarget?.displayName ?? 'Direct Tower Battle',
    skillId: log.actionId ?? log.actionCue,
    skillName: log.actionCue,
    outcome,
    damage: log.eventType === 'damage' || log.eventType === 'reaction' || log.eventType === 'heal' ? log.value : undefined,
    remainingHp: hpAfter ?? (fallbackTarget ? Math.round(fallbackTarget.stats.currentHp) : undefined),
    message: log.message,
  }
}

const buildDirectTowerCombatLog = (
  payload: DirectBattlePanelCompletePayload,
  floor: number,
  runId: string,
): CombatLog => {
  const playerUnits = payload.state.units.filter(unit => unit.team === 'player')
  const hunterUnit = playerUnits.find(unit => unit.unitType === 'hunter') ?? playerUnits[0]
  const turns: BattleTurn[] = payload.logs.length > 0
    ? payload.logs.map((_, index) => directLogToTowerTurn(payload, index))
    : [{
        turnNumber: 1,
        actorType: 'player',
        actorId: hunterUnit?.unitId ?? 'direct-tower-battle',
        actorName: hunterUnit?.displayName ?? 'Hunter',
        targetType: 'monster',
        targetId: 'direct-tower-result',
        targetName: `무한의 탑 ${floor}층`,
        outcome: 'hit',
        message: payload.outcome === 'victory'
          ? `무한의 탑 ${floor}층 직접 조작 전투에서 승리했습니다.`
          : `무한의 탑 ${floor}층 직접 조작 전투에서 패배했습니다.`,
      }]

  return {
    battleId: runId,
    gateInstanceId: `tower-${floor}`,
    result: payload.outcome === 'victory' ? 'victory' : 'defeat',
    turns,
    totalTurns: Math.max(1, payload.rounds),
    playerHpRemaining: Math.max(0, Math.round(hunterUnit?.stats.currentHp ?? 0)),
    rewards: [],
    totalWaves: 1,
    clearedWaves: payload.outcome === 'victory' ? 1 : 0,
    source: 'tower',
  }
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-ink-900/50 border border-white/10 rounded-md px-1 py-1.5 sm:px-2.5 sm:py-2 text-center sm:text-left min-w-0">
      <div className="text-[8px] sm:text-[9px] system-text text-white/35 truncate">{label}</div>
      <div className="text-xs sm:text-sm font-bold text-white/80 truncate">{value}</div>
    </div>
  )
}

export function InfiniteTowerPanel() {
  const tower = useGame(s => s.infiniteTower)
  const startTowerBattle = useGame(s => s.startTowerBattle)
  const resolveTowerBattle = useGame(s => s.resolveTowerBattle)
  const resolveDirectTowerBattle = useGame(s => s.resolveDirectTowerBattle)
  const cancelTowerBattle = useGame(s => s.cancelTowerBattle)
  const startTowerManualBattle = useGame(s => s.startTowerManualBattle)
  const performTowerManualBattleAction = useGame(s => s.performTowerManualBattleAction)
  const cancelTowerManualBattle = useGame(s => s.cancelTowerManualBattle)
  const combatLogs = useGame(s => s.combatLogs)
  const manualSession = useGame(s => s.manualBattleSession)
  const hunter = useGame(s => s.hunter)
  const items = useGame(s => s.items)
  const equipment = useGame(s => s.equipment)
  const activeConsumableEffects = useGame(s => s.activeConsumableEffects ?? [])
  const ownedShadows = useGame(s => s.ownedShadows ?? [])
  const equippedShadowIds = useGame(s => s.equippedShadowIds ?? [])
  const skillStates = useGame(s => s.skillStates ?? {})
  const visibleTraces = useGame(s => getSecretVisibleFragments(s.secretProgress))

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [cinematicLogs, setCinematicLogs] = useState<CinematicLogData[]>([])
  const [skipSignal, setSkipSignal] = useState(0)
  const [showConsumables, setShowConsumables] = useState(false)
  const [manualCinematicLogs, setManualCinematicLogs] = useState<CinematicLogData[]>([])
  const [manualSkipSignal, setManualSkipSignal] = useState(0)
  const [isRevealing, setIsRevealing] = useState(false)
  const [visualPlayer, setVisualPlayer] = useState(manualSession?.player ?? { name: '', hp: 0, maxHp: 0, atk: 0, def: 0, spd: 0 })
  const [visualMonster, setVisualMonster] = useState(manualSession?.monster ?? { name: '', hp: 0, maxHp: 0, atk: 0, def: 0, spd: 0 })
  const [resultRevealSeenId, setResultRevealSeenId] = useState<string | undefined>()
  const [isDirectTowerBattleOpen, setIsDirectTowerBattleOpen] = useState(false)
  const [directTowerBattleFloor, setDirectTowerBattleFloor] = useState<number | undefined>()
  const prevLogCountRef = useRef(0)
  const manualSessionKeyRef = useRef<string | undefined>(manualSession?.startedAt)
  const directTowerResultIdsRef = useRef(new Set<string>())
  const directTowerBattleRunIdRef = useRef<string | undefined>()

  const towerState = tower ?? { currentFloor: 1, highestClearedFloor: 0, clearedFloors: {}, firstClearRewardsClaimed: {}, bossRewardsClaimed: {}, activeTowerBattle: undefined }
  const currentFloor = towerState.currentFloor
  const highestCleared = towerState.highestClearedFloor
  const activeBattle = towerState.activeTowerBattle

  const challengeFloor = selectedFloor ?? currentFloor
  const floorType = getTowerFloorType(challengeFloor)
  const recommendedPower = getTowerRecommendedPower(challengeFloor)
  const hunterPower = getHunterCombatPowerBreakdown({
    hunter,
    items,
    equipment,
    ownedShadows,
    equippedShadowIds,
    activeConsumableEffects,
  }).total
  const powerComparison = getCombatPowerComparison(hunterPower, recommendedPower)
  const powerComparisonClass =
    powerComparison.tone === 'stable'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
      : powerComparison.tone === 'challenge'
        ? 'border-amber-400/25 bg-amber-400/10 text-amber-100'
        : 'border-rose-400/25 bg-rose-400/10 text-rose-100'
  const monsters = getTowerMonstersForFloor(challengeFloor)
  const isBoss = floorType === 'boss'

  const isAutoRevealing = activeBattle?.status === 'revealing'
  const isResolved = activeBattle?.status === 'resolved'
  const showResult = activeBattle?.showResult ?? false

  const towerCombatLog = activeBattle
    ? combatLogs.find(log => log.battleId === activeBattle.id)
    : undefined

  const isTowerManual = manualSession?.source === 'tower'
  const manualFloor = manualSession?.towerFloor ?? challengeFloor
  const manualFloorType = getTowerFloorType(manualFloor)
  const isTowerBoss = manualFloorType === 'boss'
  const isTowerPlayerLowHp = manualSession ? manualSession.player.hp / manualSession.player.maxHp <= 0.3 : false

  const manualPanelStyleClass = isTowerPlayerLowHp
    ? 'border-rose-500 bg-rose-950/10 shadow-[inset_0_0_30px_rgba(244,63,94,0.15)] animate-pulse'
    : isTowerBoss
      ? 'border-amber-500 bg-amber-950/5 shadow-[inset_0_0_24px_rgba(245,158,11,0.12),0_0_20px_rgba(245,158,11,0.08)]'
      : 'border-cyan-400/30 bg-cyan-500/5'

  const towerResultRevealSteps = useMemo<RevealStep[]>(() => {
    if (!manualSession?.result) return []
    const isWin = manualSession.result === 'victory'
    return isWin
      ? [
          {
            title: isTowerBoss ? 'BOSS DEFEATED' : 'FLOOR CLEARED',
            text: isTowerBoss
              ? `무한의 탑 ${manualFloor}층의 수호자를 처단했습니다!`
              : `무한의 탑 ${manualFloor}층 공략에 성공했습니다.`,
            subtext: '다음 층으로 나아갈 자격을 획득했습니다.',
            durationMs: 1200,
            tone: isTowerBoss ? 'box' : 'success',
          }
        ]
      : [
          {
            title: manualSession.result === 'draw' ? 'LIMIT EXCEEDED' : 'CHALLENGE FAILED',
            text: manualSession.result === 'draw' ? '제한 행동 횟수를 초과했습니다.' : '탑의 마력에 굴복하고 말았습니다.',
            subtext: manualSession.result === 'draw' ? '더 효율적인 무공/스킬 세팅이 필요합니다.' : '다시 전열을 가다듬고 도전하십시오.',
            durationMs: 1200,
            tone: 'failure',
          }
        ]
  }, [manualSession?.result, manualFloor, isTowerBoss])

  // Auto battle: build cinematic logs when revealing
  useEffect(() => {
    if (isAutoRevealing && activeBattle?.logs) {
      const logs = activeBattle.logs
        .map((turn, idx) => towerTurnToCinematicLog(turn as any, idx))
        .filter((l): l is CinematicLogData => Boolean(l))
      setCinematicLogs(logs)
    }
  }, [isAutoRevealing, activeBattle?.id])

  useEffect(() => {
    if (manualSessionKeyRef.current !== manualSession?.startedAt) {
      manualSessionKeyRef.current = manualSession?.startedAt
      if (!manualSession) return
      setVisualPlayer(manualSession.player)
      setVisualMonster(manualSession.monster)
      prevLogCountRef.current = manualSession.logs.length
      setManualCinematicLogs([])
      setIsRevealing(false)
    }
  }, [manualSession])

  // Sync visual state with actual only when no new unrevealed logs are waiting.
  useEffect(() => {
    if (!manualSession || isRevealing) return
    if (manualSession.logs.length === prevLogCountRef.current) {
      setVisualPlayer(manualSession.player)
      setVisualMonster(manualSession.monster)
    }
  }, [manualSession?.logs.length, manualSession?.player, manualSession?.monster, isRevealing])

  // Manual battle: build cinematic logs from new session logs
  useEffect(() => {
    if (!isTowerManual || !manualSession) return
    const prev = prevLogCountRef.current
    if (manualSession.logs.length > prev) {
      const next = manualSession.logs
        .slice(prev)
        .map((turn, idx) => towerTurnToCinematicLog(turn as any, prev + idx, manualSession))
        .filter((l): l is CinematicLogData => Boolean(l))
      if (next.length > 0) {
        setManualCinematicLogs(next)
        setIsRevealing(true)
      }
    } else if (manualSession.logs.length < prev) {
      setManualCinematicLogs([])
      setIsRevealing(false)
      setVisualPlayer(manualSession.player)
      setVisualMonster(manualSession.monster)
    }
    prevLogCountRef.current = manualSession.logs.length
  }, [isTowerManual, manualSession?.logs.length])

  const handleLogChange = useCallback((log: CinematicLogData, _index: number) => {
    if (log.visualDelta) {
      const { target, hpChange, newHp } = log.visualDelta
      if (target === 'player') {
        setVisualPlayer(prev => ({
          ...prev,
          hp: newHp !== undefined ? newHp : Math.max(0, prev.hp + hpChange),
        }))
      } else {
        setVisualMonster(prev => ({
          ...prev,
          hp: newHp !== undefined ? newHp : Math.max(0, prev.hp + hpChange),
        }))
      }
    }
  }, [])

  const handleQueueComplete = useCallback(() => {
    setIsRevealing(false)
    setManualCinematicLogs([])
    if (manualSession) {
      setVisualPlayer(manualSession.player)
      setVisualMonster(manualSession.monster)
    }
  }, [manualSession])

  const handleManualSkip = useCallback(() => {
    setManualSkipSignal(s => s + 1)
    setIsRevealing(false)
    setManualCinematicLogs([])
    if (manualSession) {
      setVisualPlayer(manualSession.player)
      setVisualMonster(manualSession.monster)
    }
  }, [manualSession])

  const handleAutoBattle = () => {
    setCinematicLogs([])
    startTowerBattle(challengeFloor)
  }

  const handleManualBattle = () => {
    setManualCinematicLogs([])
    setIsRevealing(false)
    prevLogCountRef.current = 0
    startTowerManualBattle(challengeFloor)
  }

  const handleDirectTowerBattle = () => {
    setCinematicLogs([])
    setManualCinematicLogs([])
    setIsRevealing(false)
    cancelTowerBattle()
    if (isTowerManual) cancelTowerManualBattle()
    directTowerResultIdsRef.current.clear()
    directTowerBattleRunIdRef.current = `direct-tower-${challengeFloor}-${Date.now()}`
    setDirectTowerBattleFloor(challengeFloor)
    setIsDirectTowerBattleOpen(true)
  }

  // 12-29J: Main Tower direct-battle result hook.
  // Cancellation grants no reward. Victory/defeat are routed exactly once per
  // (floor, runId, outcome) through store.resolveDirectTowerBattle, which owns
  // the existing floor clear / boss box / reward / progression logic.
  const handleDirectTowerBattleComplete = (payload: DirectBattlePanelCompletePayload) => {
    const floor = directTowerBattleFloor ?? challengeFloor
    const runId = directTowerBattleRunIdRef.current ?? `direct-tower-${floor}-${payload.state.battleId}`
    if (payload.outcome === 'cancelled') {
      setIsDirectTowerBattleOpen(false)
      setDirectTowerBattleFloor(undefined)
      directTowerBattleRunIdRef.current = undefined
      return
    }

    const resultKey = `${floor}:${runId}:${payload.outcome}`
    if (directTowerResultIdsRef.current.has(resultKey)) return
    directTowerResultIdsRef.current.add(resultKey)
    resolveDirectTowerBattle(buildDirectTowerCombatLog(payload, floor, runId), floor)
    setIsDirectTowerBattleOpen(false)
    setDirectTowerBattleFloor(undefined)
    directTowerBattleRunIdRef.current = undefined
  }

  const handleSkip = () => {
    setSkipSignal(s => s + 1)
  }

  const handleCinematicComplete = () => {
    setCinematicLogs([])
    resolveTowerBattle()
  }

  const handleCloseResult = (event?: { preventDefault?: () => void; stopPropagation?: () => void }) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
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
  const manualBattleLocked = isRevealing || Boolean(manualSession?.result)
  const shouldShowResultReveal = Boolean(
    !isTowerManual &&
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
            title: resultIsBoss ? 'BOSS REWARD CLEARED' : 'FLOOR CLEARED',
            text: resultIsBoss ? `${activeBattle.floor}층의 주인이 쓰러졌다.` : `${activeBattle.floor}층을 돌파했다.`,
            subtext: activeBattle.result.firstClear ? '첫 클리어 보상이 열립니다.' : '반복 클리어 보상이 정산됩니다.',
            durationMs: 950,
            tone: resultRevealTone,
          },
          {
            title: 'REWARD',
            text: activeBattle.result.rewards.boxType ? '보스 박스가 전리품에 추가되었다.' : '탑의 보상이 정산된다.',
            subtext: [
              activeBattle.result.rewards.hunterXp ? `XP +${activeBattle.result.rewards.hunterXp}` : undefined,
              activeBattle.result.rewards.gold ? `Gold +${activeBattle.result.rewards.gold}` : undefined,
            ].filter(Boolean).join(' / ') || undefined,
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
  const monsterIntent = isTowerManual && manualSession && manualMonsterDef
    ? getMonsterIntent(manualSession, manualMonsterDef, SKILL_DEFINITIONS)
    : undefined
  const directBattleFloor = directTowerBattleFloor ?? challengeFloor
  const directBattleFloorType = getTowerFloorType(directBattleFloor)
  const directTowerEncounterKey = getDirectTowerEncounterKey(directBattleFloor, directBattleFloorType)

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
            {activeBattle.result.rewards.gold ? (
              <div className="rounded-md border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-amber-100">
                Gold +{activeBattle.result.rewards.gold}
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
        onClose={() => {
          if (activeBattle) setResultRevealSeenId(activeBattle.id)
          cancelTowerBattle()
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

      {visibleTraces.length > 0 && (
        <div className="mb-4 rounded border border-violet-200/15 bg-black/15 px-3 py-2 text-[11px] text-violet-100/55">
          <span className="system-text text-violet-200/60">ARCHIVE TRACE</span>
          <span className="ml-2 text-white/45">x{visibleTraces.length}</span>
        </div>
      )}

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
                setIsDirectTowerBattleOpen(false)
                setDirectTowerBattleFloor(undefined)
                directTowerBattleRunIdRef.current = undefined
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
      {!isDirectTowerBattleOpen && !isAutoRevealing && !isTowerManual && (
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
            <div className={`rounded border px-2 py-1.5 text-[11px] ${powerComparisonClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="system-text">전투력 비교 · {powerComparison.label}</span>
                <span className="font-mono">
                  현재 {hunterPower.toLocaleString()} / 권장 {recommendedPower.toLocaleString()} / 차이 {powerComparison.diff >= 0 ? '+' : ''}{powerComparison.diff.toLocaleString()}
                </span>
              </div>
            </div>
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

          <div className="grid gap-2">
            <button
              type="button"
              onClick={handleDirectTowerBattle}
              className={clsx(
                'inline-flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-bold transition',
                isBoss
                  ? 'border-amber-300/35 bg-amber-400/12 text-amber-100 hover:bg-amber-400/18'
                  : 'border-violet-300/35 bg-violet-400/12 text-violet-100 hover:bg-violet-400/18'
              )}
            >
              <Swords className="w-4 h-4" />
              무한의 탑 직접 조작 전투
            </button>
            <div className="text-[11px] text-white/45">
              추천 적 조합: <span className="text-violet-100/80">{getDirectBattleEncounterShortLabelKo(getDirectTowerEncounterKey(challengeFloor, floorType))}</span>
            </div>
          </div>
        </div>
      )}

      {isDirectTowerBattleOpen && (
        <div className="mb-4">
          <DirectBattlePreviewPanel
            title="무한의 탑 직접 조작 전투"
            note="승리/패배 결과는 기존 무한의 탑 보상과 층 진행 처리로 한 번만 연결됩니다."
            hunter={hunter}
            items={items}
            equipment={equipment}
            activeConsumableEffects={activeConsumableEffects}
            equippedShadows={equippedShadows}
            recommendedEncounterKey={directTowerEncounterKey}
            enemyBaseLevel={getDirectTowerEnemyBaseLevel(directBattleFloor, directBattleFloorType)}
            contextStats={[
              { label: '현재 층', value: `${directBattleFloor}층` },
              { label: '층 구분', value: directBattleFloorType === 'boss' ? '보스층' : '일반층' },
              { label: '추천 조합', value: getDirectBattleEncounterShortLabelKo(directTowerEncounterKey) },
            ]}
            autoStart
            allowEncounterSelection={false}
            startButtonLabel="전투 시작"
            restartButtonLabel="처음부터 다시"
            cancelButtonLabel="전투 취소"
            onBattleComplete={handleDirectTowerBattleComplete}
          />
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
        <div className={clsx("mb-4 border rounded-lg p-4 sm:p-5 transition-all duration-500 relative overflow-hidden", manualPanelStyleClass)}>
          {/* Cinematic overlay for manual actions */}
          <div className="relative mb-4">
            <CinematicLogOverlay
              logs={manualCinematicLogs}
              visible={manualCinematicLogs.length > 0}
              intervalMs={1800}
              skipSignal={manualSkipSignal}
              onLogChange={handleLogChange}
              onComplete={handleQueueComplete}
              position="center"
            />
            {isRevealing && (
              <div className="absolute right-0 top-0 z-40">
                <button
                  type="button"
                  onClick={handleManualSkip}
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
              <div className="text-sm font-bold text-cyan-100 flex items-center gap-2">
                {manualSession.gateName}
                {isTowerBoss && <span className="text-[9px] bg-amber-500 text-ink-950 font-black px-1.5 py-0.5 rounded animate-pulse">BOSS</span>}
              </div>
            </div>
            <div className="text-xs system-text border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 rounded px-2 py-1">
              행동 {manualSession.logs.filter(l => l.skillId !== 'system-manual-battle').length} / {manualSession.maxTurns}
            </div>
          </div>

          {/* WARNING banner for boss/elite */}
          {manualSession.logs.filter(l => l.skillId !== 'system-manual-battle').length === 0 && !isRevealing && !manualSession.result && isTowerBoss && (
            <div className="mb-4 rounded border border-amber-500/30 bg-amber-500/10 p-3.5 text-center animate-pulse">
              <div className="text-[10px] system-text text-amber-400 font-bold tracking-widest">
                WARNING · TOWER GUARDIAN DETECTED
              </div>
              <div className="text-sm font-black text-amber-200 mt-0.5">
                ⚠️ 무한의 탑 {manualFloor}층 보스 몬스터가 출현했습니다!
              </div>
            </div>
          )}

          {/* HP bars */}
          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <div className="space-y-3 border border-white/10 rounded-lg p-3 bg-ink-900/35">
              <HpBar label={visualPlayer.name} hp={visualPlayer.hp} maxHp={visualPlayer.maxHp} color="cyan" />
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="ATK" value={Math.round(manualSession.player.atk)} />
                <StatPill label="DEF" value={Math.round(manualSession.player.def)} />
                <StatPill label="SPD" value={Math.round(manualSession.player.spd)} />
              </div>
            </div>
            <div className="space-y-3 border border-rose-400/20 rounded-lg p-3 bg-rose-500/5">
              <HpBar label={visualMonster.name} hp={visualMonster.hp} maxHp={visualMonster.maxHp} color="rose" />
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

          {monsterIntent && !manualSession.result && (
            <div className="mb-4">
              <MonsterIntentPanel intent={monsterIntent} compact />
            </div>
          )}

          {manualSession.result && !isRevealing && (
            <div className="mb-4">
              <DramaticReveal
                isOpen={true}
                steps={towerResultRevealSteps}
                tone={manualSession.result === 'victory' ? (isTowerBoss ? 'box' : 'success') : 'failure'}
                position="inline"
                compact
                result={
                  <div className="text-xs text-white/55 mt-1 leading-relaxed border-t border-white/10 pt-2 text-center">
                    도전 정산 대기 중... 아래 '전투 포기' 혹은 창을 닫아 결과를 확인하십시오.
                  </div>
                }
              />
            </div>
          )}

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
              <button type="button" disabled={manualBattleLocked} onClick={() => handleManualAction({ type: 'basic_attack' })} className="btn btn-primary text-sm min-h-12 disabled:opacity-50 disabled:cursor-not-allowed">
                <Swords className="w-4 h-4" /> 기본 공격
              </button>
              <button
                type="button"
                disabled={manualBattleLocked}
                onClick={() => handleManualAction({ type: 'defend' })}
                className={clsx(
                  "btn text-sm min-h-12 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden transition-all duration-300",
                  monsterIntent?.tone === 'danger'
                    ? "border-amber-400 bg-amber-450/20 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse"
                    : "border-cyan-400/25 bg-cyan-400/10 text-cyan-100"
                )}
              >
                {monsterIntent?.tone === 'danger' && (
                  <span className="absolute top-0.5 left-1 text-[8px] font-black bg-amber-500 text-ink-950 px-1 rounded tracking-tighter">
                    추천
                  </span>
                )}
                <Shield className="w-4 h-4" />
                <span>방어</span>
                <span className={clsx("text-[10px] ml-1", monsterIntent?.tone === 'danger' ? "text-amber-200/80 font-bold" : "text-cyan-100/60")}>
                  피해 -40%
                </span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="system-text text-[11px] text-cyan-200/75">COMBAT SKILLS</span>
              <span className="text-[11px] text-white/45">사용 가능 우선 · 쿨다운/사유 표시</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sortTowerCombatSkills(
                playerSkills.filter(skill => skill.id !== BASIC_ATTACK_SKILL.id),
                manualSession.cooldowns,
              ).map(skill => {
                const runtime = getSkillMastery(skillStates, skill.id)
                const cooldown = manualSession.cooldowns[skill.id] ?? 0
                const availability = canUseSkill(skill, manualSession)
                const disabled = !availability.canUse || manualBattleLocked
                const disabledReason = manualBattleLocked
                  ? (manualSession.result ? '전투 종료' : '연출 중')
                  : availability.reason
                return (
                  <SkillActionCard
                    key={skill.id}
                    skill={skill}
                    runtime={runtime}
                    cooldownRemaining={cooldown}
                    disabled={disabled}
                    disabledReason={disabledReason}
                    tacticalHint={getSkillIntentHint(skill, monsterIntent)}
                    onClick={() => handleManualAction({ type: 'skill', skillId: skill.id })}
                  />
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
                            disabled={manualBattleLocked || Boolean(disabledReason)}
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
              <button type="button" disabled={manualBattleLocked} onClick={() => handleManualAction({ type: 'auto_finish' })} className="btn text-sm min-h-10 border-amber-400/25 bg-amber-400/10 text-amber-100 disabled:opacity-50 disabled:cursor-not-allowed">
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
            logs={manualSession.logs.map((turn, index) => gateTurnToLogEntry(turn, index, manualSession))}
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
      {!isTowerManual && isResolved && showResult && activeBattle?.result && (
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
              {activeBattle.result.rewards.gold ? <div>Gold +{activeBattle.result.rewards.gold}</div> : null}
              {activeBattle.result.rewards.shadowXp ? <div>Shadow XP +{activeBattle.result.rewards.shadowXp}</div> : null}
              {activeBattle.result.rewards.shadowEssence ? <div>정수 +{activeBattle.result.rewards.shadowEssence}</div> : null}
              {activeBattle.result.rewards.boxType ? <div className="text-amber-300/80">보스 박스 획득</div> : null}
              {activeBattle.result.firstClear ? <div className="text-emerald-300/70">첫 클리어 보상</div> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCloseResult}
                onPointerUp={handleCloseResult}
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
                  onPointerUp={(event) => {
                    handleCloseResult(event)
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
                  onPointerUp={handleCloseResult}
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
              logs={towerCombatLog.turns.map((turn, index) => gateTurnToLogEntry(turn, index))}
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
