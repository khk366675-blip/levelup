import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import clsx from 'clsx'
import {
  Activity,
  AlertTriangle,
  FastForward,
  List,
  Package,
  Shield,
  Skull,
  Swords,
  Timer,
  Zap,
  Lock,
  ChevronRight,
  Coins,
  Flame,
  Check,
  HelpCircle,
  Dices,
  Compass,
  Heart,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  useGame,
  COOP_HELP_ATK_FACTOR,
  COOP_HELP_DEF_FACTOR,
  COOP_HELP_DR_FACTOR,
  COOP_HELP_DR_CAP,
  COOP_REWARD_PENALTY_PER_HELPER,
  COOP_REWARD_MIN_RATIO,
} from '../lib/store'
import { calculateRealityPressure } from '../lib/realityPressure'
import { FocusSessionPanel } from './FocusSessionPanel'
import { CinematicLogOverlay, type CinematicLogData, type CinematicLogTone } from './CinematicLogOverlay'
import { CombatLogPanel, type CombatLogEntry, type CombatLogEntryTone } from './CombatLogPanel'
import { DramaticReveal, type RevealStep } from './DramaticReveal'
import { DirectBattlePreviewPanel, type DirectBattlePanelCompletePayload } from './DirectBattlePreviewPanel'
import { MonsterIntentPanel } from './MonsterIntentPanel'
import { ShadowPortrait } from './shadows/ShadowPortrait'
import { ShadowExtractionReveal } from './shadows/ShadowExtractionReveal'
import { SkillActionCard, skillSourceSortRank, skillTypeSortRank } from './SkillActionCard'
import { GATE_DEFINITIONS, GATE_PENALTIES, GATE_REWARD_TABLES, MONSTER_DEFINITIONS, SKILL_DEFINITIONS } from '../lib/seed'
import { GATE_THEMES, GATE_MODIFIERS, hydrateGateRunEncounterChoices } from '../lib/gateRunEvents'
import { getWorldGateEventPack } from '../lib/livingWorldGateEvents'
import { pickDirectGateRunEncounterKey } from '../lib/directBattleEncounters'
import { MONARCHS, FINAL_ANGEL, buildMonarchBattleUnit } from '../lib/monarchs'
import {
  calculatePlayerCombatStats,
  formatStatReward,
  getActiveGateSuccessBonus,
  estimateGateRisk,
  getEquippedItems,
  getPlayerCombatSkills,
  isShadowCombatLog,
  type GateRisk,
} from '../lib/game'
import {
  getCombatPowerComparison,
  getHunterCombatPowerBreakdown,
} from '../lib/combatPower'
import type { ActiveGate, ActiveConsumableEffect, BattleTurn, CombatLog, GateDefinition, Item, MonsterDefinition, ShadowExtractResult, StatKey } from '../lib/types'
import type { ManualBattleAction, ManualBattleSession, SkillDefinition } from '../lib/types'
import {
  SHADOW_RARITY_LABEL,
  getEquippedShadows,
  getEquippedShadowStatBonuses,
  getGateShadowPreview,
  getShadowDefinition,
  getShadowExtractionChance,
} from '../lib/shadows'
import { getMonsterIntent, getSkillIntentHint } from '../lib/combatIntent'
import {
  canUseSkill,
  getSkillMastery,
} from '../lib/skills'
import { getSecretVisibleFragments } from '../lib/secrets'
import { pickDirectGateEncounterKey } from '../lib/directBattleEncounters'
import { DailyProgressionPanel } from './DailyProgressionPanel'
import {
  buildGateEchoEnemyUnits,
  canUseMajorAction,
  gateEchoCategoryLabel,
  getActiveGateEchoes,
  getGateEchoDangerLabel,
} from '../lib/gateEchoes'
import {
  isManualBattleSessionPlayerDeath,
  isManualBattleSessionTerminal,
  shouldHideBattleContinueControls,
} from '../lib/manualBattleSessionGuards'
import type { GateEchoState } from '../lib/types'

const GATE_ENTRY_COST = 20

// GatePanel 내에서 사용하는 inline 래퍼
function DailyProgressionPanelInline() {
  return <DailyProgressionPanel />
}



function ArchiveTraceChip({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <div className="rounded border border-violet-200/15 bg-black/15 px-3 py-2 text-[11px] text-violet-100/55">
      <span className="system-text text-violet-200/60">ARCHIVE TRACE</span>
      <span className="ml-2 text-white/45">x{count}</span>
    </div>
  )
}

const sortCombatSkills = (skills: SkillDefinition[], cooldowns: Record<string, number>) => (
  [...skills].sort((a, b) => {
    const aReady = (cooldowns[a.id] ?? 0) <= 0
    const bReady = (cooldowns[b.id] ?? 0) <= 0
    if (aReady !== bReady) return aReady ? -1 : 1
    return skillSourceSortRank(a) - skillSourceSortRank(b)
      || skillTypeSortRank(a) - skillTypeSortRank(b)
      || a.name.localeCompare(b.name, 'ko')
  })
)

const riskMeta: Record<GateRisk, { label: string; className: string }> = {
  low: { label: '위험도 낮음', className: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' },
  normal: { label: '적정 위험', className: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10' },
  high: { label: '위험도 높음', className: 'text-amber-300 border-amber-400/40 bg-amber-400/10' },
  extreme: { label: '매우 위험', className: 'text-rose-300 border-rose-400/40 bg-rose-400/10' },
}

const getDirectGateEncounterKey = (gate: GateDefinition, seed?: string, encounterType?: string): string => {
  const effectiveSeed = seed ?? `${gate.id}:${gate.name}:${gate.monsterIds.join('|')}`
  if (encounterType && encounterType !== 'battle') {
    return pickDirectGateRunEncounterKey(gate.rank, encounterType, effectiveSeed)
  }
  return pickDirectGateEncounterKey(gate.rank, effectiveSeed)
}

const getDirectGateEnemyBaseLevel = (gate: GateDefinition): number => {
  const rankBonus: Record<GateDefinition['rank'], number> = {
    E: 1,
    D: 2,
    C: 3,
    B: 5,
    A: 7,
    S: 9,
  }
  return Math.max(1, gate.recommendedLevel + (rankBonus[gate.rank] ?? 1))
}

const directLogToGateTurn = (
  payload: DirectBattlePanelCompletePayload,
  index: number,
): BattleTurn => {
  const log = payload.logs[index]
  const actor = payload.state.units.find(unit => unit.unitId === log.actorUnitId)
  const target = payload.state.units.find(unit => unit.unitId === log.targetUnitIds?.[0])
  const fallbackTarget = target ?? actor ?? payload.state.units[0]
  const actorIsEnemy = actor?.team === 'enemy'
  const targetIsEnemy = fallbackTarget?.team === 'enemy'
  const outcome: BattleTurn['outcome'] =
    log.eventType === 'heal' ? 'heal' :
    log.eventType === 'status' || log.eventType === 'reaction' ? 'buff' :
    'hit'

  return {
    turnNumber: index + 1,
    waveNumber: Math.max(1, log.round),
    actorType: actorIsEnemy ? 'monster' : 'player',
    actorId: actor?.unitId ?? `direct-system-${index + 1}`,
    actorName: actor?.displayName ?? 'Direct Battle',
    targetType: targetIsEnemy ? 'monster' : 'player',
    targetId: fallbackTarget?.unitId ?? `direct-target-${index + 1}`,
    targetName: fallbackTarget?.displayName ?? 'Direct Battle',
    skillId: log.actionCue,
    skillName: log.actionCue,
    outcome,
    damage: log.eventType === 'damage' ? log.value : undefined,
    remainingHp: fallbackTarget ? Math.round(fallbackTarget.stats.currentHp) : undefined,
    message: log.message,
  }
}

const buildDirectGateCombatLog = (
  payload: DirectBattlePanelCompletePayload,
  activeGate: ActiveGate,
  gate: GateDefinition,
): CombatLog => {
  const playerUnits = payload.state.units.filter(unit => unit.team === 'player')
  const hunterUnit = playerUnits.find(unit => unit.unitType === 'hunter') ?? playerUnits[0]
  const hunterDied = didDirectBattleHunterDie(payload)
  const resolvedOutcome = hunterDied ? 'defeat' : payload.outcome
  const resolvedDefeatReason = hunterDied ? 'player_dead' : payload.defeatReason
  const resolvedPlayerDeathDetected = hunterDied || payload.playerDeathDetected
  const resolvedFinalOutcome = hunterDied ? 'defeat' : payload.finalOutcome

  const turns: BattleTurn[] = payload.logs.length > 0
    ? payload.logs.map((_, index) => directLogToGateTurn(payload, index))
    : [{
        turnNumber: 1,
        actorType: 'player',
        actorId: hunterUnit?.unitId ?? 'direct-battle',
        actorName: hunterUnit?.displayName ?? 'Hunter',
        targetType: 'monster',
        targetId: 'direct-battle-result',
        targetName: gate.name,
        outcome: 'hit',
        message: resolvedOutcome === 'victory' ? '직접 조작 게이트 전투에서 승리했습니다.' : '직접 조작 게이트 전투에서 패배했습니다.',
      }]

  return {
    battleId: `direct-gate-${activeGate.instanceId}-${Date.now()}`,
    gateInstanceId: activeGate.instanceId,
    result: resolvedOutcome === 'victory' ? 'victory' : 'defeat',
    turns,
    totalTurns: Math.max(1, payload.rounds),
    playerHpRemaining: Math.max(0, Math.round(hunterUnit?.stats.currentHp ?? 0)),
    rewards: [],
    penaltyApplied: undefined,
    totalWaves: gate.monsterIds.length,
    clearedWaves: resolvedOutcome === 'victory' ? gate.monsterIds.length : 0,
    source: 'gate',
    finalOutcome: resolvedFinalOutcome,
    defeatReason: resolvedDefeatReason,
    playerDeathDetected: resolvedPlayerDeathDetected,
    battleStarted: payload.battleStarted,
    actionCount: payload.actionCount,
    finalized: payload.finalized || hunterDied,
    shadowCasualtyIds: playerUnits
      .filter(unit => unit.unitType === 'shadow' && unit.stats.currentHp <= 0)
      .map(unit => unit.sourceId),
  }
}

const didDirectBattleHunterDie = (payload: DirectBattlePanelCompletePayload): boolean =>
  payload.state.units.some(unit => unit.team === 'player' && unit.unitType === 'hunter' && unit.stats.currentHp <= 0)

const buildDirectEchoCombatLog = (
  payload: DirectBattlePanelCompletePayload,
  echo: GateEchoState,
): CombatLog => {
  const playerUnits = payload.state.units.filter(unit => unit.team === 'player')
  const hunterUnit = playerUnits.find(unit => unit.unitType === 'hunter') ?? playerUnits[0]
  const hunterDied = didDirectBattleHunterDie(payload)
  const resolvedOutcome = hunterDied ? 'defeat' : payload.outcome
  const resolvedDefeatReason = hunterDied ? 'player_dead' : payload.defeatReason
  const resolvedPlayerDeathDetected = hunterDied || payload.playerDeathDetected
  const resolvedFinalOutcome = hunterDied ? 'defeat' : payload.finalOutcome

  const turns: BattleTurn[] = payload.logs.length > 0
    ? payload.logs.map((_, index) => directLogToGateTurn(payload, index))
    : [{
        turnNumber: 1,
        actorType: 'player',
        actorId: hunterUnit?.unitId ?? 'gate-echo-battle',
        actorName: hunterUnit?.displayName ?? 'Hunter',
        targetType: 'monster',
        targetId: 'gate-echo-result',
        targetName: echo.name,
        outcome: 'hit',
        message: resolvedOutcome === 'victory'
          ? 'Gate Echo 전투에서 잔향을 정화했습니다.'
          : 'Gate Echo 전투에서 쓰러졌습니다.',
      }]

  return {
    battleId: `direct-echo-${echo.id}-${Date.now()}`,
    gateInstanceId: echo.id,
    result: resolvedOutcome === 'victory' ? 'victory' : 'defeat',
    turns,
    totalTurns: Math.max(1, payload.rounds),
    playerHpRemaining: Math.max(0, Math.round(hunterUnit?.stats.currentHp ?? 0)),
    rewards: [],
    penaltyApplied: undefined,
    totalWaves: 1,
    clearedWaves: resolvedOutcome === 'victory' ? 1 : 0,
    source: 'echo',
    finalOutcome: resolvedFinalOutcome,
    defeatReason: resolvedDefeatReason,
    playerDeathDetected: resolvedPlayerDeathDetected,
    battleStarted: payload.battleStarted,
    actionCount: payload.actionCount,
    finalized: payload.finalized || hunterDied,
    shadowCasualtyIds: playerUnits
      .filter(unit => unit.unitType === 'shadow' && unit.stats.currentHp <= 0)
      .map(unit => unit.sourceId),
  }
}

const sourceLabel: Record<string, string> = {
  daily_open: '일일 개방',
  daily_completion: '일일 퀘스트',
  random_completion: '긴급 의뢰',
  dungeon_clear: '던전 클리어',
  hard_dungeon_clear: '고난도 던전',
  main_completion: '메인 퀘스트',
  random: '랜덤 출현',
  event: '이벤트',
}

function formatTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return '만료됨'

  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)

  if (hours > 0) return `${hours}시간 ${minutes}분 남음`
  return `${minutes}분 남음`
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function formatConsumable(effect: ActiveConsumableEffect): string {
  switch (effect.type) {
    case 'gate_penalty_reduction':
      return `${effect.sourceItemName}: 패널티 -${formatPercent(effect.value)}`
    case 'gate_success_bonus':
      return `${effect.sourceItemName}: 게이트 전투 보조 +${formatPercent(effect.value)}`
    case 'temporary_stat_bonus':
      return `${effect.sourceItemName}: ${effect.stat} ${formatStatReward(effect.value)}`
    case 'temporary_drop_bonus':
      return `${effect.sourceItemName}: 드롭률 +${formatPercent(effect.value)}`
    case 'temporary_rarity_bonus':
      return `${effect.sourceItemName}: 레어리티 +${formatPercent(effect.value)}`
    default:
      return `${effect.sourceItemName}: 게이트 미적용`
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

function GateEchoPanel({ echoes, onStart }: { echoes: GateEchoState[]; onStart: (echoId: string) => void }) {
  if (echoes.length === 0) {
    return (
      <div className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
        하드코어 규칙 활성: 사망 시 진행 리셋, 그림자 붕괴 활성.
      </div>
    )
  }

  return (
    <div className="panel corner-bracket border-rose-400/35 bg-rose-950/25 p-4">
      <div className="br" />
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-rose-200">
            <Skull className="h-5 w-5" />
            <h3 className="text-lg font-black">Gate Echo 발생</h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/65">
            미완료 퀘스트의 잔향이 오늘의 게이트를 막고 있습니다. 먼저 Echo를 정화해야 합니다.
          </p>
        </div>
        <span className="rounded border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[10px] font-bold text-amber-100">
          하드코어 규칙 활성
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {echoes.map(echo => (
          <div key={echo.id} className="rounded-md border border-white/10 bg-ink-950/45 p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-white">{echo.name}</span>
                  <span className="rounded border border-cyan-300/25 bg-cyan-300/10 px-1.5 py-0.5 text-[10px] text-cyan-100">
                    {gateEchoCategoryLabel[echo.category]}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-white/55">{echo.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs font-black text-amber-200">{getGateEchoDangerLabel(echo)}</div>
                <div className="text-[10px] text-white/45">강화 {echo.strengthLevel}단계</div>
              </div>
            </div>
            <div className="mb-3 rounded border border-rose-300/15 bg-rose-300/10 px-2 py-1 text-[11px] text-rose-100/85">
              미완료 {gateEchoCategoryLabel[echo.category]} 목표 {echo.missedCount}개에서 발생
            </div>
            <button
              type="button"
              onClick={() => onStart(echo.id)}
              className="btn btn-primary w-full min-h-10 text-sm"
            >
              Gate Echo 정화
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const resultMeta: Record<CombatLog['result'], {
  label: string
  title: string
  description: string
  className: string
  iconClassName: string
}> = {
  victory: {
    label: '승리',
    title: '게이트 클리어',
    description: '균열을 돌파했습니다. 전리품과 경험치를 획득했습니다.',
    className: 'border-emerald-400/40 bg-emerald-500/10',
    iconClassName: 'text-emerald-300',
  },
  defeat: {
    label: '패배',
    title: '공략 실패',
    description: '몬스터에게 밀려났습니다. 부상을 회복한 뒤 다시 도전할 수 있습니다.',
    className: 'border-rose-400/40 bg-rose-500/10',
    iconClassName: 'text-rose-300',
  },
  draw: {
    label: '무승부',
    title: '시간초과',
    description: '제한 턴 안에 게이트를 클리어하지 못했습니다. 보상과 패널티는 없으며, 세팅을 바꾼 뒤 다시 도전할 수 있습니다.',
    className: 'border-amber-400/40 bg-amber-500/10',
    iconClassName: 'text-amber-300',
  },
}

const outcomeMeta: Record<CombatLog['turns'][number]['outcome'], { label: string; className: string }> = {
  hit: { label: '타격', className: 'text-cyan-200 border-cyan-400/25 bg-cyan-400/10' },
  critical: { label: '치명', className: 'text-amber-200 border-amber-400/35 bg-amber-400/10' },
  miss: { label: '빗나감', className: 'text-slate-300 border-slate-400/20 bg-white/5' },
  evade: { label: '회피', className: 'text-emerald-200 border-emerald-400/25 bg-emerald-400/10' },
  buff: { label: '강화', className: 'text-purple-200 border-purple-400/25 bg-purple-400/10' },
  debuff: { label: '약화', className: 'text-rose-200 border-rose-400/25 bg-rose-400/10' },
  heal: { label: '회복', className: 'text-emerald-200 border-emerald-400/25 bg-emerald-400/10' },
}

function includesAny(message: string, keywords: string[]) {
  return keywords.some(keyword => message.includes(keyword))
}

function classifyGateLogTurn(turn: CombatLog['turns'][number]): CombatLogEntryTone {
  if (isShadowCombatLog(turn)) return 'shadow'
  if (turn.skillId === 'system-manual-battle') {
    if (includesAny(turn.message, ['보상', '획득', 'reward', 'Reward'])) return 'reward'
    if (includesAny(turn.message, ['승리', '패배', '무승부', 'victory', 'defeat', 'draw'])) return 'result'
    return 'system'
  }
  if (includesAny(turn.message, ['보상', '획득', '정수', 'XP'])) return 'reward'
  if (
    turn.outcome === 'miss' ||
    turn.outcome === 'evade' ||
    includesAny(turn.message, ['방어', '회피', '막았', '반격', '피해 감소'])
  ) return 'defense'
  if (turn.actorType === 'monster') return 'monster'
  return 'player'
}

function getGateLogLabel(turn: CombatLog['turns'][number], tone: CombatLogEntryTone) {
  if (tone === 'shadow') return '그림자'
  if (tone === 'player') return '헌터'
  if (tone === 'monster') return '몬스터'
  if (tone === 'defense') return '방어'
  if (tone === 'reward') return '보상'
  if (tone === 'result') return '결과'
  if (tone === 'system') return '시스템'
  return outcomeMeta[turn.outcome]?.label ?? 'LOG'
}

export function gateTurnToLogEntry(
  turn: CombatLog['turns'][number],
  index: number,
  session?: ManualBattleSession
): CombatLogEntry {
  const tone = classifyGateLogTurn(turn)
  const metaParts = [
    turn.skillName,
    turn.damage !== undefined ? `DMG ${Math.round(turn.damage)}` : undefined,
  ].filter(Boolean)

  const actualSession = (session && 'startedAt' in session) ? session : undefined

  let message = turn.message
  if (actualSession) {
    const playerMaxHp = actualSession.player.maxHp
    const monsterMaxHp = actualSession.monster.maxHp

    const isFinishingBlow = turn.targetType === 'monster' && turn.remainingHp === 0 && (turn.outcome === 'hit' || turn.outcome === 'critical')
    const isPlayerDanger = turn.targetType === 'player' && turn.remainingHp !== undefined && playerMaxHp > 0 && (turn.remainingHp / playerMaxHp) <= 0.3
    const isMonsterWeakness = turn.targetType === 'monster' && turn.remainingHp !== undefined && turn.remainingHp > 0 && monsterMaxHp > 0 && (turn.remainingHp / monsterMaxHp) <= 0.3

    if (isFinishingBlow) {
      message = `[🎯 결정타] ${message}`
    } else if (isPlayerDanger) {
      message = `[⚠️ 위기] ${message}`
    } else if (isMonsterWeakness) {
      message = `[⚡ 기회] ${message}`
    }
  }

  if (tone === 'result') {
    if (includesAny(message, ['승리', 'victory', 'Cleared'])) {
      message = `[🏆 승리] ${message}`
    } else if (includesAny(message, ['패배', 'defeat', 'Failed'])) {
      message = `[❌ 패배] ${message}`
    } else {
      message = `[⏳ 무승부] ${message}`
    }
  }

  return {
    id: `${turn.turnNumber}-${turn.actorId}-${turn.skillId ?? 'basic'}-${index}`,
    turn: turn.turnNumber,
    wave: turn.waveNumber,
    tone,
    label: getGateLogLabel(turn, tone),
    actorName: tone === 'system' || tone === 'result' || tone === 'reward' ? undefined : turn.actorName,
    meta: metaParts.join(' / ') || undefined,
    message,
  }
}

const cinematicGateBadge: Record<CinematicLogTone, string> = {
  player: '헌터',
  shadow: '그림자',
  monster: '몬스터',
  system: '시스템',
  reward: '보상',
  risk: '위험',
  command: '명령',
  result: '결과',
  defense: '방어',
}

function shouldShowCinematicGateLog(turn?: CombatLog['turns'][number]) {
  if (!turn) return false
  return turn.message.trim().length > 0
}

function splitCinematicMessage(message: string) {
  const normalized = message.replace(/\s+/g, ' ').trim()
  const parts = normalized.split(/(?<=[.!?。])\s+|(?<=\.)\s+/).filter(Boolean)
  return {
    title: parts[0] ?? normalized,
    body: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
  }
}

function gateTurnToCinematicLog(
  turn: CombatLog['turns'][number],
  index: number,
  session?: ManualBattleSession
): CinematicLogData | undefined {
  if (!shouldShowCinematicGateLog(turn)) return undefined
  const isHunterSkill =
    turn.actorType === 'player' &&
    Boolean(turn.skillId) &&
    turn.skillId !== 'basic-attack' &&
    turn.skillId !== 'manual-defend' &&
    turn.skillId !== 'system-manual-battle'
  const tone = classifyGateLogTurn(turn) as CinematicLogTone
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

  if (tone === 'result') {
    if (includesAny(title, ['승리', 'victory', 'Cleared'])) {
      title = `[🏆 승리] ${title}`
    } else if (includesAny(title, ['패배', 'defeat', 'Failed'])) {
      title = `[❌ 패배] ${title}`
    } else {
      title = `[⏳ 무승부] ${title}`
    }
  }

  const bodyParts = [
    bodyText,
    turn.damage !== undefined ? `피해 ${Math.round(turn.damage)}` : undefined,
    turn.skillName && turn.skillName !== turn.actorName ? turn.skillName : undefined,
  ].filter(Boolean)

  let visualDelta: CinematicLogData['visualDelta']
  if (turn.damage !== undefined && turn.damage !== 0) {
    const isHeal = turn.outcome === 'heal'
    visualDelta = {
      target: turn.targetType,
      hpChange: isHeal ? turn.damage : -turn.damage,
      newHp: turn.remainingHp,
    }
  }

  return {
    id: `gate-cinematic-${turn.turnNumber}-${turn.actorId}-${turn.skillId ?? 'basic'}-${index}`,
    tone: isHunterSkill ? 'player' : tone,
    badge: isHunterSkill ? 'SKILL' : cinematicGateBadge[tone],
    title,
    body: isHunterSkill
      ? [title, turn.damage !== undefined ? `${Math.round(turn.damage)} 피해` : undefined].filter(Boolean).join(' · ')
      : bodyParts.join(' · ') || undefined,
    visualDelta,
  }
}

function getGateRevealDelay(turn?: CombatLog['turns'][number]) {
  if (!turn) return 850
  const tone = classifyGateLogTurn(turn)
  if (tone === 'reward' || tone === 'result') return 1300
  if (tone === 'shadow' || turn.outcome === 'critical' || turn.outcome === 'evade') return 1100
  if (tone === 'monster' || tone === 'defense') return 950
  return 850
}

const rarityClassName = (rarity?: string): string => {
  switch (rarity) {
    case 'legendary':
      return 'text-amber-200'
    case 'epic':
      return 'text-purple-200'
    case 'rare':
      return 'text-cyan-200'
    case 'uncommon':
      return 'text-emerald-200'
    default:
      return 'text-white/70'
  }
}

function RewardSummary({ log }: { log: CombatLog }) {
  if (log.rewards.length === 0) {
    return <div className="text-xs text-white/45">보상 없음</div>
  }

  return (
    <div className="space-y-1.5">
      {log.rewards.map((reward, index) => (
        <div key={`${reward.type}-${index}`} className="text-xs text-white/70">
          {reward.type === 'xp' ? (
            <span className="text-cyan-200">XP +{reward.amount ?? 0}</span>
          ) : reward.type === 'gold' ? (
            <span className="text-amber-200">Gold +{reward.amount ?? 0}</span>
          ) : (
            <span>
              전리품:{' '}
              <span className={rarityClassName(reward.rarity)}>
                {reward.itemName ?? '알 수 없는 아이템'}
                {reward.rarity ? ` (${reward.rarity})` : ''}
              </span>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function PenaltySummary({ log }: { log: CombatLog }) {
  if (log.penaltyApplied) {
    return (
      <div className="space-y-1.5 text-xs text-rose-100/80">
        <div>스태미나 -{log.penaltyApplied.staminaCost}</div>
        {log.penaltyApplied.injuryHours && <div>부상 {log.penaltyApplied.injuryHours}시간</div>}
        <div className="text-white/45">회복 조건: 6시간 또는 퀘스트 3개</div>
      </div>
    )
  }

  if (log.result === 'victory') {
    return <div className="text-xs text-emerald-100/75">게이트 입장 비용: 스태미나 -20</div>
  }

  return <div className="text-xs text-white/45">패널티 없음</div>
}

const getShadowActorInstanceId = (actorId?: string): string | undefined =>
  actorId?.startsWith('shadow:') ? actorId.slice('shadow:'.length) : undefined

function ShadowBattleRoster({
  shadows,
  activeShadowId,
  compact = false,
}: {
  shadows: ReturnType<typeof getEquippedShadows>
  activeShadowId?: string
  compact?: boolean
}) {
  if (shadows.length === 0) return null

  return (
    <div className="rounded-lg border border-purple-400/20 bg-purple-500/5 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="system-text text-[10px] text-purple-200/75">SHADOW ROSTER</div>
        <div className="text-[10px] text-white/35">{shadows.length} deployed</div>
      </div>
      <div className={compact ? 'flex gap-2 overflow-x-auto pb-1' : 'grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5'}>
        {shadows.map(shadow => {
          const active = activeShadowId === shadow.instanceId
          const def = getShadowDefinition(shadow.definitionId)
          const flashClass =
            active && shadow.role === 'guard' ? 'ring-emerald-300/60 border-emerald-300/45 bg-emerald-400/10' :
            active && shadow.role === 'analyst' ? 'ring-cyan-300/60 border-cyan-300/45 bg-cyan-400/10' :
            active && shadow.role === 'assault' ? 'ring-rose-300/60 border-rose-300/45 bg-rose-400/10' :
            active ? 'ring-purple-300/60 border-purple-300/45 bg-purple-400/10' :
            'border-white/10 bg-ink-900/35'
          return (
            <div
              key={shadow.instanceId}
              className={`min-w-[118px] rounded-md border p-2 transition ${flashClass} ${active ? 'ring-2 animate-pulse' : ''}`}
            >
              <ShadowPortrait shadow={shadow} definition={def} size="xs" active={active} highlighted={active || Boolean(shadow.isNamed)} />
              <div className="mt-1 truncate text-[11px] font-semibold text-white/80">{shadow.name}</div>
              <div className="text-[9px] system-text text-white/40">Lv {shadow.level ?? 1} / {shadow.role}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ShadowExtractionPanel({
  log,
  gateId,
}: {
  log?: CombatLog
  gateId?: string
}) {
  const [revealingResult, setRevealingResult] = useState<ShadowExtractResult | undefined>()
  const hunter = useGame(s => s.hunter)
  const ownedShadows = useGame(s => s.ownedShadows ?? [])
  const equippedShadowIds = useGame(s => s.equippedShadowIds ?? [])
  const extractHistory = useGame(s => s.shadowExtractHistory ?? [])
  const lastResult = useGame(s => s.lastShadowExtractResult)
  const attemptShadowExtraction = useGame(s => s.attemptShadowExtraction)
  const activeGate = useGame(s => s.activeGate)
  const gate = (gateId ? GATE_DEFINITIONS.find(item => item.id === gateId) : undefined)
    ?? (activeGate?.gateId === gateId ? activeGate?.customGateDef : undefined)
  if (!log || log.result !== 'victory' || !gate) return null

  const equippedShadows = getEquippedShadows(ownedShadows, equippedShadowIds, hunter)
  const chance = getShadowExtractionChance(hunter, gate, equippedShadows)
  const attempted = extractHistory.some(result => result.gateInstanceId === log.gateInstanceId)
  const preview = getGateShadowPreview(gate)
  const ownedDefinitionIds = new Set(ownedShadows.map(shadow => shadow.definitionId))
  const relatedResult = lastResult?.gateInstanceId === log.gateInstanceId ? lastResult : undefined
  const visibleResult = revealingResult?.gateInstanceId === log.gateInstanceId ? undefined : relatedResult

  // 12-30A: Shadow extraction uses the dedicated ShadowExtractionReveal modal.
  // It is intentionally separate from ticket/summon reveals so the user does
  // not see two or three back-to-back "ticket-style" stages for one extraction.
  const handleExtraction = () => {
    if (attempted) return
    attemptShadowExtraction(log.gateInstanceId)
    const result = useGame.getState().lastShadowExtractResult
    if (result?.gateInstanceId === log.gateInstanceId) {
      setRevealingResult(result)
    }
  }

  return (
    <div className="panel corner-bracket p-4 border-purple-400/25 bg-purple-500/5">
      <div className="br" />
      <ShadowExtractionReveal
        result={revealingResult}
        gateName={gate.name}
        onClose={() => setRevealingResult(undefined)}
      />
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <div className="system-text text-[11px] text-purple-300/80 mb-1">SHADOW EXTRACTION</div>
          <h3 className="text-lg font-bold text-purple-100">그림자 추출</h3>
          <p className="text-xs text-white/55 mt-1 leading-relaxed">
            victory 후 1회 시도할 수 있습니다. 현재 성공률 {Math.round(chance * 100)}%.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExtraction}
          disabled={attempted}
          className="btn btn-primary text-xs min-h-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {attempted ? '추출 완료' : '그림자 추출 시도'}
        </button>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/10 bg-ink-900/35 p-3">
          <div className="system-text text-[10px] text-cyan-300/70 mb-2">추출 가능 그림자</div>
          <div className="space-y-1.5">
            {preview.map(def => {
              const obtained = ownedDefinitionIds.has(def.id)
              const hidden = def.hiddenUntilObtained && !obtained
              return (
                <div key={def.id} className="text-xs text-white/65 flex justify-between gap-3">
                  <span>{hidden ? '[???] 미확인 신호' : `[${SHADOW_RARITY_LABEL[def.rarity]}] ${def.name}`}</span>
                  <span className="text-white/35">{hidden ? '봉인' : def.role}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-ink-900/35 p-3">
          <div className="system-text text-[10px] text-purple-300/70 mb-2">최근 결과</div>
          {visibleResult ? (
            <div className={visibleResult.success ? 'text-xs text-emerald-100/80' : 'text-xs text-amber-100/80'}>
              {visibleResult.message}
            </div>
          ) : (
            <div className="text-xs text-white/40">아직 추출하지 않았습니다.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function RecentBattleResult({
  log,
  shouldReveal = false,
  onRevealStateChange,
}: {
  log?: CombatLog
  shouldReveal?: boolean
  onRevealStateChange?: (isRevealing: boolean) => void
}) {
  const [showFullLog, setShowFullLog] = useState(false)
  const [revealedLogCount, setRevealedLogCount] = useState(0)
  const [skipSignal, setSkipSignal] = useState(0)
  const intervalRef = useRef<number | undefined>(undefined)

  const clearRevealTimer = () => {
    if (intervalRef.current !== undefined) {
      window.clearTimeout(intervalRef.current)
      intervalRef.current = undefined
    }
  }

  useEffect(() => {
    clearRevealTimer()
    setShowFullLog(false)

    if (!log) {
      setRevealedLogCount(0)
      onRevealStateChange?.(false)
      return
    }

    if (!shouldReveal || log.turns.length === 0) {
      setRevealedLogCount(log.turns.length)
      onRevealStateChange?.(false)
      return
    }

    setRevealedLogCount(0)
    onRevealStateChange?.(true)

    return () => {
      clearRevealTimer()
      onRevealStateChange?.(false)
    }
  }, [log?.battleId, log?.turns.length, onRevealStateChange, shouldReveal])

  const hunter = useGame(s => s.hunter)
  const ownedShadows = useGame(s => s.ownedShadows ?? [])
  const equippedShadowIds = useGame(s => s.equippedShadowIds ?? [])

  if (!log) return null

  const meta = resultMeta[log.result]
  const revealComplete = revealedLogCount >= log.turns.length
  const revealedTurns = log.turns.slice(0, revealedLogCount)
  const visibleTurns = revealComplete ? log.turns : revealedTurns
  const cinematicLogs = log.turns
    .map((turn, index) => gateTurnToCinematicLog(turn, index))
    .filter((item): item is CinematicLogData => Boolean(item))
  const equippedShadows = getEquippedShadows(ownedShadows, equippedShadowIds, hunter)
  const activeShadowId = [...visibleTurns].reverse().map(turn => getShadowActorInstanceId(turn.actorId)).find(Boolean)
  const panelClassName = revealComplete ? meta.className : 'border-cyan-400/40 bg-cyan-500/10'
  const iconClassName = revealComplete ? meta.iconClassName : 'text-cyan-300'

  const skipReveal = () => {
    clearRevealTimer()
    setSkipSignal(signal => signal + 1)
    setRevealedLogCount(log.turns.length)
    onRevealStateChange?.(false)
  }

  return (
    <div className={`panel corner-bracket relative overflow-hidden p-4 border ${panelClassName}`}>
      <div className="br" />
      <CinematicLogOverlay
        logs={cinematicLogs}
        visible={shouldReveal && !revealComplete}
        intervalMs={1400}
        skipSignal={skipSignal}
        onLogChange={(_, index) => setRevealedLogCount(Math.min(index + 1, log.turns.length))}
        onComplete={() => {
          setRevealedLogCount(log.turns.length)
          onRevealStateChange?.(false)
        }}
        position="center"
      />
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <Swords className={`w-5 h-5 mt-0.5 ${iconClassName} ${revealComplete ? '' : 'animate-pulse'}`} />
          <div>
            <div className="system-text text-[11px] text-cyan-300/70 mb-1">RECENT BATTLE</div>
            <h3 className="text-lg font-bold text-white/90">
              {revealComplete ? meta.title : '게이트 전투 진행 중'}
            </h3>
            <p className="text-xs text-white/55 leading-relaxed mt-1">
              {revealComplete ? meta.description : '전투 로그가 순차적으로 전송되고 있습니다.'}
            </p>
          </div>
        </div>
        <div className={`text-xs system-text px-2.5 py-1 rounded border ${panelClassName} ${iconClassName}`}>
          {revealComplete ? meta.label : `${revealedLogCount}/${log.turns.length}`}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatPill label="공개 로그" value={`${revealedLogCount} / ${log.turns.length}`} />
        <StatPill label="총 턴" value={revealComplete ? log.totalTurns : '-'} />
        <StatPill label="남은 HP" value={revealComplete ? Math.round(log.playerHpRemaining) : '-'} />
        <StatPill
          label="웨이브"
          value={revealComplete && log.totalWaves ? `${log.clearedWaves ?? 0} / ${log.totalWaves}` : '-'}
        />
      </div>

      <div className="mb-4">
        <ShadowBattleRoster shadows={equippedShadows} activeShadowId={activeShadowId} />
      </div>

      {revealComplete && (
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div className="border border-white/10 rounded-lg p-3 bg-ink-900/35">
            <div className="system-text text-[10px] text-purple-300/70 mb-2">REWARD</div>
            <RewardSummary log={log} />
          </div>
          <div className="border border-white/10 rounded-lg p-3 bg-ink-900/35">
            <div className="system-text text-[10px] text-rose-300/70 mb-2">PENALTY</div>
            <PenaltySummary log={log} />
          </div>
        </div>
      )}

      {revealComplete && log.result === 'draw' && (
        <div className="mb-4 border border-amber-400/25 bg-amber-400/10 rounded-lg p-3 text-xs text-amber-100/80 leading-relaxed">
          보상과 패널티는 없습니다. 게이트는 유지되며, 장비/직업/소모품 세팅을 바꾼 뒤 다시 도전할 수 있습니다.
        </div>
      )}

      <div className="space-y-3">
        {!revealComplete && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={skipReveal}
              className="inline-flex items-center gap-1.5 text-[10px] system-text text-amber-200 border border-amber-400/25 bg-amber-400/10 rounded px-2 py-1 hover:bg-amber-400/15 transition"
            >
              <FastForward className="w-3 h-3" />
              전투 스킵
            </button>
          </div>
        )}
        <CombatLogPanel
          key={`${log.battleId}-${revealComplete ? 'complete' : 'revealing'}`}
          title="BATTLE LOG"
          subtitle={revealComplete ? '최근 행동 우선 / 전체 로그 펼치기 가능' : `${revealedLogCount} / ${log.turns.length} 전송 중`}
          logs={visibleTurns.map((turn, index) => gateTurnToLogEntry(turn, index))}
          maxVisible={revealComplete ? 5 : 6}
          latestFirst={revealComplete}
          highlightLatest
          defaultExpanded={!revealComplete}
          emptyText="전투 개시 대기 중..."
        />
      </div>

      <div className="hidden">
        <div className="system-text text-[11px] text-cyan-300/70">
          BATTLE LOG {revealComplete ? (showFullLog ? `(${log.turns.length})` : '(최근 5줄)') : '(전송 중)'}
        </div>
        {!revealComplete && (
          <button
            type="button"
            onClick={skipReveal}
            className="inline-flex items-center gap-1.5 text-[10px] system-text text-amber-200 border border-amber-400/25 bg-amber-400/10 rounded px-2 py-1 hover:bg-amber-400/15 transition"
          >
            <FastForward className="w-3 h-3" />
            전투 스킵
          </button>
        )}
        {revealComplete && log.turns.length > 5 && (
          <button
            type="button"
            onClick={() => setShowFullLog(prev => !prev)}
            className="inline-flex items-center gap-1.5 text-[10px] system-text text-cyan-200 border border-cyan-400/25 bg-cyan-400/10 rounded px-2 py-1 hover:bg-cyan-400/15 transition"
          >
            <List className="w-3 h-3" />
            {showFullLog ? '로그 접기' : '전체 로그 보기'}
          </button>
        )}
      </div>

      <div className="hidden">
        {visibleTurns.length === 0 && (
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-3 text-xs text-cyan-100/60 system-text">
            전투 개시 대기 중...
          </div>
        )}
        {visibleTurns.map((turn, index) => {
          const outcome = outcomeMeta[turn.outcome]
          const isCounterLog =
            turn.message.includes('반격') ||
            turn.message.includes('흘려') ||
            turn.message.includes('침묵의 반격식')

          return (
            <div
              key={`${turn.turnNumber}-${turn.actorId}-${index}`}
              className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                isCounterLog
                  ? 'border-amber-400/30 bg-amber-400/10 text-amber-50/85'
                  : 'border-white/10 bg-ink-900/35 text-white/60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-cyan-300/50 system-text">#{turn.turnNumber}</span>
                {turn.waveNumber && (
                  <span className="text-[9px] system-text px-1.5 py-0.5 rounded border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">
                    W{turn.waveNumber}
                  </span>
                )}
                <span className={`text-[9px] system-text px-1.5 py-0.5 rounded border ${outcome.className}`}>
                  {isCounterLog ? '반격' : outcome.label}
                </span>
              </div>
              <p>{turn.message}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GateStatusPanel() {
  const gateStatus = useGame(s => s.gateStatus)
  const isInjured = Boolean(gateStatus.injuredUntil)
  const canEnter = gateStatus.stamina >= GATE_ENTRY_COST && !isInjured

  return (
    <div className="panel corner-bracket p-4">
      <div className="br" />
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-300" />
          <div className="system-text text-[11px] text-cyan-300/80">GATE STATUS</div>
        </div>
        <div className={`text-[10px] system-text px-2 py-1 rounded border ${canEnter ? 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' : 'text-amber-300 border-amber-400/30 bg-amber-400/10'}`}>
          {canEnter ? '입장 가능' : '입장 불가'}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill label="Gate Stamina" value={`${gateStatus.stamina} / ${gateStatus.maxStamina}`} />
        <StatPill label="입장 비용" value={GATE_ENTRY_COST} />
        <StatPill label="자연 회복" value="시간당 +10" />
        <StatPill label="퀘스트 회복" value="+5" />
      </div>

      {isInjured && (
        <div className="mt-4 border border-rose-400/30 bg-rose-500/10 rounded-lg p-3">
          <div className="flex items-center gap-2 text-rose-300 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <div className="text-sm font-semibold">부상 중</div>
          </div>
          <div className="text-xs text-white/60 leading-relaxed">
            회복 조건: 6시간 경과 또는 퀘스트 3개 완료
          </div>
          <div className="text-xs text-white/60 mt-1">
            남은 시간: {gateStatus.injuredUntil ? formatTimeRemaining(gateStatus.injuredUntil) : '-'}
          </div>
          <div className="text-xs text-white/60 mt-1">
            진행도: {gateStatus.recoveryQuestProgress ?? 0} / {gateStatus.recoveryQuestRequired ?? 3}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyGateState() {
  return (
    <div className="flex flex-col gap-4">
      {/* Daily Progression Readiness Panel */}
      <DailyProgressionPanelInline />

      <div className="panel corner-bracket p-8 text-center">
        <div className="br" />
        <div className="text-5xl mb-3 opacity-30">🌀</div>
        <h3 className="text-lg font-bold text-cyan-100">열린 게이트 없음</h3>
        <p className="text-sm text-white/50 mt-2 max-w-xl mx-auto leading-relaxed">
          현재 감지된 균열이 없습니다. daily 퀘스트를 수행하거나 던전을 클리어하면 낮은 확률로 게이트가 출현합니다.
        </p>

        <div className="grid md:grid-cols-4 gap-3 mt-6 text-left">
          <StatPill label="하루 첫 접속" value="7%" />
          <StatPill label="daily 완료" value="3%" />
          <StatPill label="던전 클리어" value="25~30%" />
          <StatPill label="main 완료" value="50%" />
        </div>

        <div className="text-[11px] system-text text-cyan-300/45 mt-5">
          동시에 하나의 게이트만 활성화됩니다.
        </div>
      </div>
    </div>
  )
}

function MonsterCard({ monster, waveNumber }: { monster: MonsterDefinition; waveNumber?: number }) {
  return (
    <div className="bg-rose-500/5 border border-rose-400/20 rounded-lg p-4">
      <div className="flex items-start gap-3 mb-3">
        <Skull className="w-5 h-5 text-rose-300 mt-0.5" />
        <div>
          <div className="flex items-center gap-2">
            {waveNumber && (
              <span className="text-[10px] system-text text-cyan-200 border border-cyan-400/30 bg-cyan-400/10 rounded px-1.5">
                Wave {waveNumber}
              </span>
            )}
            <h4 className="text-sm font-bold text-rose-200">{monster.name}</h4>
            <span className="text-[10px] system-text text-rose-300/70 border border-rose-400/30 rounded px-1.5">
              {monster.rank}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1 leading-relaxed">{monster.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <StatPill label="HP" value={monster.stats.maxHp} />
        <StatPill label="ATK" value={monster.stats.atk} />
        <StatPill label="DEF" value={monster.stats.def} />
        <StatPill label="SPD" value={monster.stats.speed} />
      </div>
      <div className="text-[10px] text-white/40 system-text mt-3">
        CRIT {formatPercent(monster.stats.critRate)} · ACC {formatPercent(monster.stats.accuracy)} · EVA {formatPercent(monster.stats.evasionRate)}
      </div>
    </div>
  )
}

function HpBar({ label, hp, maxHp, tone }: { label: string; hp: number; maxHp: number; tone: 'cyan' | 'rose' }) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
  const barClassName = tone === 'cyan' ? 'bg-cyan-300' : 'bg-rose-300'

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs mb-1">
        <span className="font-semibold text-white/80">{label}</span>
        <span className="system-text text-white/50">{Math.ceil(Math.max(0, hp))} / {Math.ceil(maxHp)}</span>
      </div>
      <div className="h-3 rounded bg-ink-950/70 border border-white/10 overflow-hidden">
        <div
          className={`h-full ${barClassName} transition-all`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  )
}

// 12-29P: Legacy `ManualBattlePanel` removed. `ManualBattlePanelV2` is the only
// in-use manual battle panel (DEV fallback path). It uses `ManualHpBar` below.

function ManualHpBar({ label, hp, maxHp, tone }: { label: string; hp: number; maxHp: number; tone: 'cyan' | 'rose' }) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
  const percent = Math.round(ratio * 100)
  const barClassName = ratio <= 0.25
    ? 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse'
    : ratio <= 0.5
      ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
      : tone === 'cyan'
        ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
        : 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]'

  const isLowHp = ratio > 0 && ratio <= 0.3

  return (
    <div>
      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs mb-1">
        <span className="font-semibold text-white/85 truncate flex items-center gap-1.5 min-w-0">
          <span className="truncate">{label}</span>
          {isLowHp && (
            tone === 'cyan' ? (
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
          {Math.ceil(Math.max(0, hp))}/{Math.ceil(maxHp)} · {percent}%
        </span>
      </div>
      <div className="h-3 sm:h-4 rounded bg-ink-950/70 border border-white/10 overflow-hidden relative">
        <div className={`h-full ${barClassName} transition-all duration-300`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function ManualBattlePanelV2({
  session,
  skills,
  items,
  monsterDefinition,
  onAction,
  onCancel,
}: {
  session: ManualBattleSession
  skills: SkillDefinition[]
  items: Item[]
  monsterDefinition?: MonsterDefinition
  onAction: (action: ManualBattleAction) => void
  onCancel: () => void
}) {
  const [showFullLog, setShowFullLog] = useState(false)
  const [showConsumables, setShowConsumables] = useState(false)
  const [manualCinematicLogs, setManualCinematicLogs] = useState<CinematicLogData[]>([])
  const [manualSkipSignal, setManualSkipSignal] = useState(0)
  const [isRevealing, setIsRevealing] = useState(false)
  const [visualPlayer, setVisualPlayer] = useState(session.player)
  const [visualMonster, setVisualMonster] = useState(session.monster)
  const previousManualLogCountRef = useRef(session.logs.length)
  const sessionKeyRef = useRef(session.startedAt)
  const actionCount = session.logs.filter(log => log.skillId !== 'system-manual-battle').length
  const totalWaves = session.waveIndex + 1 + session.remainingMonsterIds.length
  const result = session.result ? resultMeta[session.result] : undefined
  const visibleLogs = showFullLog ? session.logs : session.logs.slice(-6)
  const hunter = useGame(s => s.hunter)
  const ownedShadows = useGame(s => s.ownedShadows ?? [])
  const equippedShadowIds = useGame(s => s.equippedShadowIds ?? [])
  const skillStates = useGame(s => s.skillStates ?? {})
  const equippedShadows = getEquippedShadows(ownedShadows, equippedShadowIds, hunter)
  const activeShadowId = [...visibleLogs].reverse().map(turn => getShadowActorInstanceId(turn.actorId)).find(Boolean)
  const battleLocked = isRevealing || Boolean(session.result)
  const playerDeathDetected = Boolean(session.playerDeathDetected || session.player.hp <= 0)
  const hideContinueControls = shouldHideBattleContinueControls(session)
  const monsterIntent = monsterDefinition ? getMonsterIntent(session, monsterDefinition, SKILL_DEFINITIONS) : undefined

  const isBoss = monsterDefinition?.rank === 'S'
  const isElite = monsterDefinition?.rank === 'A' || monsterDefinition?.rank === 'B'
  const isPlayerLowHp = session.player.hp / session.player.maxHp <= 0.3
  
  const panelStyleClass = isPlayerLowHp
    ? 'border-rose-500 bg-rose-950/10 shadow-[inset_0_0_30px_rgba(244,63,94,0.15)] animate-pulse'
    : isBoss
      ? 'border-amber-500 bg-amber-950/5 shadow-[inset_0_0_24px_rgba(245,158,11,0.12),0_0_20px_rgba(245,158,11,0.08)]'
      : isElite
        ? 'border-purple-400/50 bg-purple-950/5 shadow-[inset_0_0_20px_rgba(167,139,250,0.08)]'
        : 'border-cyan-400/30 bg-cyan-500/5'

  const resultRevealSteps = useMemo<RevealStep[]>(() => {
    if (!session.result) return []
    const isWin = session.result === 'victory'
    return isWin
      ? [
          {
            title: isBoss ? 'BOSS CLEARED' : isElite ? 'ELITE CLEARED' : 'GATE CLEARED',
            text: isBoss 
              ? `${session.gateName}의 보스를 처단했습니다!` 
              : isElite 
                ? `${session.gateName}의 정예 몬스터를 격퇴했습니다.` 
                : '게이트의 균열을 안정화했습니다.',
            subtext: '경험치와 정수, 전리품이 곧 헌터 인벤토리에 지급됩니다.',
            durationMs: 1200,
            tone: isBoss ? 'box' : 'success',
          }
        ]
      : [
          {
            title: session.result === 'draw' ? 'LIMIT EXCEEDED' : 'GATE FAILED',
            text: session.result === 'draw' ? '시간을 초과하여 균열 돌파에 실패했습니다.' : '차원 폭주를 견디지 못하고 쓰러졌습니다.',
            subtext: session.result === 'draw' ? '헌터의 세팅을 강화하고 재도전해 주십시오.' : '부상 치료 완료 후 다시 도전할 수 있습니다.',
            durationMs: 1200,
            tone: 'failure',
          }
        ]
  }, [session.result, session.gateName, isBoss, isElite])

  useEffect(() => {
    if (sessionKeyRef.current !== session.startedAt) {
      sessionKeyRef.current = session.startedAt
      setVisualPlayer(session.player)
      setVisualMonster(session.monster)
      previousManualLogCountRef.current = session.logs.length
      setManualCinematicLogs([])
      setIsRevealing(false)
    }
  }, [session.startedAt, session.logs.length, session.monster, session.player])

  useEffect(() => {
    if (isRevealing) return
    if (session.logs.length === previousManualLogCountRef.current) {
      setVisualPlayer(session.player)
      setVisualMonster(session.monster)
    }
  }, [session.logs.length, session.player, session.monster, isRevealing])

  useEffect(() => {
    const previousCount = previousManualLogCountRef.current
    if (session.logs.length > previousCount) {
      const nextLogs = session.logs
        .slice(previousCount)
        .map((turn, index) => gateTurnToCinematicLog(turn, previousCount + index, session))
        .filter((item): item is CinematicLogData => Boolean(item))
      if (nextLogs.length > 0) {
        setManualCinematicLogs(nextLogs)
        setIsRevealing(true)
      }
    } else if (session.logs.length < previousCount) {
      setManualCinematicLogs([])
      setIsRevealing(false)
      setVisualPlayer(session.player)
      setVisualMonster(session.monster)
    }
    previousManualLogCountRef.current = session.logs.length
  }, [session.logs])

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
    setVisualPlayer(session.player)
    setVisualMonster(session.monster)
  }, [session.player, session.monster])

  const handleSkip = useCallback(() => {
    setManualSkipSignal(s => s + 1)
    setIsRevealing(false)
    setManualCinematicLogs([])
    setVisualPlayer(session.player)
    setVisualMonster(session.monster)
  }, [session.player, session.monster])
  const combatConsumables = items.filter(item =>
    item.consumable &&
    item.consumableEffects?.some(effect =>
      effect.type === 'gate_penalty_reduction' ||
      (effect.type === 'temporary_stat_bonus' && effect.stat && effect.stat !== 'INT')
    )
  )
  const consumableGroups = combatConsumables.reduce<Array<{ item: Item; count: number }>>((groups, item) => {
    const key = `${item.name}:${JSON.stringify(item.consumableEffects)}`
    const existing = groups.find(group => `${group.item.name}:${JSON.stringify(group.item.consumableEffects)}` === key)
    if (existing) existing.count += 1
    else groups.push({ item, count: 1 })
    return groups
  }, [])

  const getConsumableDisabledReason = (item: Item): string | undefined => {
    const effectTypes = item.consumableEffects
      ?.filter(effect =>
        effect.type === 'gate_penalty_reduction' ||
        (effect.type === 'temporary_stat_bonus' && effect.stat && effect.stat !== 'INT')
      )
      .map(effect => effect.type) ?? []
    if (session.consumableUseCount >= 2) return '사용 제한 도달'
    if (session.usedConsumableItemIds.includes(item.id)) return '이미 사용함'
    if (effectTypes.some(type => session.usedConsumableEffectTypes.includes(type))) return '같은 효과 사용함'
    if (
      effectTypes.includes('gate_penalty_reduction') &&
      session.consumableEffects.some(effect => !effect.consumed && effect.type === 'gate_penalty_reduction')
    ) return '패널티 감소 활성화 중'
    if (
      effectTypes.includes('temporary_stat_bonus') &&
      session.activeEffects.some(effect => effect.sourceSkillId.startsWith('manual-consumable-stat-'))
    ) return '능력치 소모품 활성화 중'
    return undefined
  }

  const formatManualConsumableEffect = (item: Item): string => {
    const parts = item.consumableEffects
      ?.filter(effect =>
        effect.type === 'gate_penalty_reduction' ||
        (effect.type === 'temporary_stat_bonus' && effect.stat && effect.stat !== 'INT')
      )
      .map(effect => {
        if (effect.type === 'gate_penalty_reduction') return `패배 패널티 -${Math.round(effect.value * 100)}%`
        if (effect.type === 'temporary_stat_bonus') return `${effect.stat} +${effect.value} / 3턴`
        return '전투 효과'
      }) ?? []
    return parts.join(', ')
  }

  return (
    <div className={`panel corner-bracket relative overflow-hidden p-4 sm:p-5 border transition-all duration-500 ${panelStyleClass}`}>
      <div className="br" />
      <CinematicLogOverlay
        logs={manualCinematicLogs}
        visible={manualCinematicLogs.length > 0}
        intervalMs={2600}
        skipSignal={manualSkipSignal}
        onLogChange={handleLogChange}
        onComplete={handleQueueComplete}
        position="center"
      />
      {isRevealing && (
        <div className="absolute right-3 top-3 z-40">
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
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
        <div>
          <div className="system-text text-[11px] text-cyan-300/80 mb-1">MANUAL TURN BATTLE</div>
          <h3 className="text-xl font-bold text-cyan-100 flex items-center gap-2">
            {session.gateName}
            {isBoss && <span className="text-[10px] bg-amber-500 text-ink-950 font-black px-1.5 py-0.5 rounded animate-pulse">BOSS</span>}
            {!isBoss && isElite && <span className="text-[10px] bg-purple-500 text-white font-black px-1.5 py-0.5 rounded">ELITE</span>}
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[10px] system-text border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 rounded px-2 py-1">
              Wave {session.waveIndex + 1} / {totalWaves}
            </span>
            <span className="text-[10px] system-text border border-white/10 bg-ink-900/50 text-white/55 rounded px-2 py-1">
              행동 {actionCount} / {session.maxTurns}
            </span>
            <span className="text-[10px] system-text border border-amber-400/20 bg-amber-400/10 text-amber-100/75 rounded px-2 py-1">
              방어만으로는 클리어하기 어렵습니다
            </span>
          </div>
        </div>
        <div className="text-xs system-text border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 rounded px-2.5 py-1">
          {result && !isRevealing ? result.label : '진행 중'}
        </div>
      </div>

      {actionCount === 0 && !isRevealing && !session.result && (isBoss || isElite) && (
        <div className="mb-5 rounded border border-amber-500/30 bg-amber-500/10 p-3.5 text-center animate-pulse">
          <div className="text-[10px] system-text text-amber-400 font-bold tracking-widest">
            WARNING · DANGEROUS ENTITY ENCOUNTERED
          </div>
          <div className="text-sm font-black text-amber-200 mt-0.5">
            {isBoss ? '⚠️ 강력한 균열의 지배자가 감지되었습니다!' : '⚡ 정예 차원 개체가 출현했습니다!'}
          </div>
        </div>
      )}

      {session.result && !isRevealing && (
        <div className="mb-5">
          <DramaticReveal
            isOpen={true}
            steps={resultRevealSteps}
            tone={session.result === 'victory' ? (isBoss ? 'box' : 'success') : 'failure'}
            position="inline"
            compact
            result={
              <div className="text-xs text-white/55 mt-1 leading-relaxed border-t border-white/10 pt-2 text-center">
                게이트 정산 대기 중... 아래 '전투 완료/닫기' 버튼을 눌러 결과 화면으로 돌아가십시오.
              </div>
            }
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-3 mb-5">
        <div className="space-y-4 border border-white/10 rounded-lg p-4 bg-ink-900/35">
          <ManualHpBar label={visualPlayer.name} hp={visualPlayer.hp} maxHp={visualPlayer.maxHp} tone="cyan" />
          <div className="grid grid-cols-3 gap-2">
            <StatPill label="ATK" value={Math.round(session.player.atk)} />
            <StatPill label="DEF" value={Math.round(session.player.def)} />
            <StatPill label="SPD" value={Math.round(session.player.spd)} />
          </div>
        </div>
        <div className="space-y-4 border border-rose-400/20 rounded-lg p-4 bg-rose-500/5">
          <ManualHpBar label={visualMonster.name} hp={visualMonster.hp} maxHp={visualMonster.maxHp} tone="rose" />
          <div className="grid grid-cols-3 gap-2">
            <StatPill label="ATK" value={Math.round(session.monster.atk)} />
            <StatPill label="DEF" value={Math.round(session.monster.def)} />
            <StatPill label="SPD" value={Math.round(session.monster.spd)} />
          </div>
          {monsterDefinition && (
            <div className="text-xs text-rose-100/65 leading-relaxed border-t border-rose-400/15 pt-3">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="system-text text-[10px] text-rose-200/80">CURRENT MONSTER</span>
                <span className="system-text text-[10px] border border-rose-400/25 rounded px-1.5 text-rose-100/70">
                  {monsterDefinition.rank}-RANK
                </span>
              </div>
              {monsterDefinition.description}
            </div>
          )}
        </div>
      </div>

      {monsterIntent && !session.result && (
        <div className="mb-5">
          <MonsterIntentPanel intent={monsterIntent} />
        </div>
      )}

      <div className="mb-5">
        <ShadowBattleRoster shadows={equippedShadows} activeShadowId={activeShadowId} compact />
      </div>

      <div className="space-y-3 mb-5">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={battleLocked} onClick={() => onAction({ type: 'basic_attack' })} className="btn btn-primary text-sm min-h-14 disabled:opacity-50 disabled:cursor-not-allowed">
            기본 공격
          </button>
          <button
            type="button"
            disabled={battleLocked}
            onClick={() => onAction({ type: 'defend' })}
            className={clsx(
              "btn text-sm min-h-14 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden transition-all duration-300",
              monsterIntent?.tone === 'danger'
                ? "border-amber-400 bg-amber-450/20 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse"
                : "border-cyan-400/25 bg-cyan-400/10 text-cyan-100"
            )}
          >
            {monsterIntent?.tone === 'danger' && (
              <span className="absolute top-1 left-1 text-[8px] font-black bg-amber-500 text-ink-950 px-1 rounded tracking-tighter">
                추천
              </span>
            )}
            <span>방어</span>
            <span className={clsx("ml-1 text-[10px] system-text", monsterIntent?.tone === 'danger' ? "text-amber-200/80 font-bold" : "text-cyan-100/60")}>
              피해 -40%
            </span>
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="system-text text-[11px] text-cyan-200/75">COMBAT SKILLS</span>
          <span className="text-[11px] text-white/45">사용 가능 우선 · 출처/타입/쿨다운 표시</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sortCombatSkills(skills, session.cooldowns).map(skill => {
            const runtime = getSkillMastery(skillStates, skill.id)
            const cooldown = session.cooldowns[skill.id] ?? 0
            const availability = canUseSkill(skill, session)
            const disabledReason = battleLocked
              ? (session.result ? '전투 종료' : '연출 중')
              : availability.reason
            return (
              <SkillActionCard
                key={skill.id}
                skill={skill}
                runtime={runtime}
                cooldownRemaining={cooldown}
                disabled={battleLocked || !availability.canUse}
                disabledReason={disabledReason}
                tacticalHint={getSkillIntentHint(skill, monsterIntent)}
                onClick={() => onAction({ type: 'skill', skillId: skill.id })}
              />
            )
          })}
        </div>
        <div className="border border-emerald-400/20 bg-emerald-400/5 rounded-lg p-3">
          <button
            type="button"
            onClick={() => setShowConsumables(prev => !prev)}
            className="w-full min-h-11 flex items-center justify-between gap-3 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-emerald-100">소모품 사용</span>
              <span className="block text-[11px] text-white/45 mt-0.5">
                전투용 {consumableGroups.length}종 · 사용 {session.consumableUseCount} / 2
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
                const disabledReason = getConsumableDisabledReason(item)
                return (
                  <div key={`${item.name}-${item.id}`} className="rounded-md border border-white/10 bg-ink-900/35 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-sm font-semibold text-white/85 truncate">{item.name}</span>
                          <span className="text-[10px] system-text text-white/40">x{count}</span>
                        </div>
                        <div className="text-[11px] text-emerald-100/70 mt-1">{formatManualConsumableEffect(item)}</div>
                        {disabledReason && <div className="text-[10px] text-amber-200 mt-1">{disabledReason}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => onAction({ type: 'use_consumable', itemId: item.id })}
                        disabled={battleLocked || Boolean(disabledReason)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <button type="button" disabled={battleLocked} onClick={() => onAction({ type: 'auto_finish' })} className="btn text-sm min-h-12 border-amber-400/25 bg-amber-400/10 text-amber-100 disabled:opacity-50 disabled:cursor-not-allowed">
            자동 마무리
          </button>
          {!hideContinueControls && (
            <button type="button" onClick={onCancel} className="btn text-sm min-h-12 border-rose-400/25 bg-rose-400/10 text-rose-100">
              전투 포기/닫기
            </button>
          )}
          {hideContinueControls && (
            <div className="rounded border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-center text-xs text-rose-100">
              {playerDeathDetected ? '하드코어 사망 정산 중' : '전투 기록 종료'}
            </div>
          )}
        </div>
      </div>

      <CombatLogPanel
        title="RECENT BATTLE LOG"
        subtitle="버튼 입력 직후 최신 행동이 위에 고정됩니다."
        logs={session.logs.map((turn, index) => gateTurnToLogEntry(turn, index, session))}
        maxVisible={6}
        latestFirst
        highlightLatest
        compact
        emptyText="행동을 선택하면 전투가 진행됩니다."
        className="mb-4"
      />

      <div className="hidden">
        <div className="system-text text-[11px] text-cyan-300/70">
          BATTLE LOG {showFullLog ? `(${session.logs.length})` : '(최근 6줄)'}
        </div>
        {session.logs.length > 6 && (
          <button
            type="button"
            onClick={() => setShowFullLog(prev => !prev)}
            className="inline-flex items-center gap-1.5 text-[10px] system-text text-cyan-200 border border-cyan-400/25 bg-cyan-400/10 rounded px-2 py-1"
          >
            <List className="w-3 h-3" />
            {showFullLog ? '로그 접기' : '전체 로그'}
          </button>
        )}
      </div>

      <div className="hidden">
        {visibleLogs.length === 0 && (
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-3 text-xs text-cyan-100/60 system-text">
            행동을 선택하면 전투가 진행됩니다.
          </div>
        )}
        {visibleLogs.map((turn, index) => {
          const outcome = outcomeMeta[turn.outcome]
          const isSystemLog = turn.skillId === 'system-manual-battle'
          const isShadowLog = isShadowCombatLog(turn)
          const isLast = index === visibleLogs.length - 1
          return (
            <div
              key={`${turn.turnNumber}-${turn.actorId}-${index}`}
              className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                isShadowLog
                  ? 'border-purple-400/25 bg-purple-400/10 text-purple-50/85'
                  : isSystemLog
                    ? 'border-amber-400/25 bg-amber-400/10 text-amber-50/85'
                    : 'border-white/10 bg-ink-900/35 text-white/65'
              } ${isLast ? 'ring-1 ring-cyan-400/20' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`system-text ${isLast ? 'text-cyan-200' : 'text-cyan-300/50'}`}>#{turn.turnNumber}</span>
                {turn.waveNumber && <span className="text-[9px] system-text px-1.5 py-0.5 rounded border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">W{turn.waveNumber}</span>}
                <span className={`text-[9px] system-text px-1.5 py-0.5 rounded border ${
                  isShadowLog ? 'text-purple-200 border-purple-400/25 bg-purple-400/10' :
                  isSystemLog ? 'text-amber-200 border-amber-400/25 bg-amber-400/10' : outcome.className
                }`}>
                  {isShadowLog ? 'SHADOW' : isSystemLog ? 'SYSTEM' : outcome.label}
                </span>
              </div>
              <p>{turn.message}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function GatePanel() {
  const [isBattleRevealing, setIsBattleRevealing] = useState(false)
  const [isDirectGateBattleOpen, setIsDirectGateBattleOpen] = useState(false)
  const [selectedEchoId, setSelectedEchoId] = useState<string | undefined>()
  const directGateResultIdsRef = useRef(new Set<string>())
  const hunter = useGame(s => s.hunter)
  const items = useGame(s => s.items)
  const equipment = useGame(s => s.equipment)
  const activeConsumableEffects = useGame(s => s.activeConsumableEffects)
  const activeGate = useGame(s => s.activeGate)
  const ownedShadows = useGame(s => s.ownedShadows ?? [])
  const equippedShadowIds = useGame(s => s.equippedShadowIds ?? [])
  const gateStatus = useGame(s => s.gateStatus)
  const quests = useGame(s => s.quests)
  const dailyProgression = useGame(s => s.dailyProgression)
  const focusSession = useGame(s => s.focusSession)
  const hardcoreState = useGame(s => s.hardcoreState)
  const resolveGateEchoBattle = useGame(s => s.resolveGateEchoBattle)
  const currentPressure = useMemo(() => {
    if (!activeGate) return undefined
    return calculateRealityPressure(dailyProgression, focusSession, activeGate, quests)
  }, [dailyProgression, focusSession, activeGate, quests])
  const combatLogs = useGame(s => s.combatLogs)
  const latestGateCombatLog = combatLogs.find(
    log => log.source === 'gate' || (!log.source && !log.gateInstanceId?.startsWith('tower-'))
  )
  const manualBattleSession = useGame(s => s.manualBattleSession)
  const startGateBattle = useGame(s => s.startGateBattle)
  const resolveDirectGateBattle = useGame(s => s.resolveDirectGateBattle)
  const startManualGateBattle = useGame(s => s.startManualGateBattle)
  const performManualBattleAction = useGame(s => s.performManualBattleAction)
  const cancelManualGateBattle = useGame(s => s.cancelManualGateBattle)
  const performWorldManualBattleAction = useGame(s => s.performWorldManualBattleAction)
  const cancelWorldBattle = useGame(s => s.cancelWorldBattle)
  const resolveDirectWorldBattle = useGame(s => s.resolveDirectWorldBattle)
  const finalizeHardcoreDeathFromSession = useGame(s => s.finalizeHardcoreDeathFromSession)
  const visibleTraces = useGame(s => getSecretVisibleFragments(s.secretProgress))
  const traceCount = visibleTraces.length

  const equippedItems = getEquippedItems(items, equipment)
  const equippedShadows = getEquippedShadows(ownedShadows, equippedShadowIds, hunter)
  const activeEchoes = getActiveGateEchoes(hardcoreState)
  const selectedEcho = activeEchoes.find(echo => echo.id === selectedEchoId)
  const gateLock = canUseMajorAction(hardcoreState, 'gate')
  const shadowStatBonuses = getEquippedShadowStatBonuses(equippedShadows)
  const combatStatsInput = { ...hunter.stats }
  for (const [stat, value] of Object.entries(shadowStatBonuses)) {
    combatStatsInput[stat as StatKey] = combatStatsInput[stat as StatKey] + (value ?? 0)
  }
  const playerSkills = getPlayerCombatSkills({
    jobId: hunter.jobId,
    equippedItems,
    allSkills: SKILL_DEFINITIONS,
  })
  const manualPlayerSkills = getPlayerCombatSkills({
    jobId: hunter.jobId,
    equippedItems,
    allSkills: SKILL_DEFINITIONS,
    includeBasicKit: true,
  })
  const combatStats = calculatePlayerCombatStats({
    level: hunter.level,
    stats: combatStatsInput,
    equippedItems,
    activeConsumableEffects,
    jobId: hunter.jobId,
    skills: playerSkills,
  })
  const combatPower = getHunterCombatPowerBreakdown({
    hunter,
    items,
    equipment,
    ownedShadows,
    equippedShadowIds,
    activeConsumableEffects,
  })
  const playerPower = combatPower.total
  const activeGateOpen = activeGate?.status === 'active'
  const gate = activeGateOpen
    ? (GATE_DEFINITIONS.find(g => g.id === activeGate.gateId) ?? activeGate.customGateDef)
    : undefined

  const isMonarchSession = manualBattleSession && manualBattleSession.source === 'world_map' && (MONARCHS.some(m => m.id === manualBattleSession.gateId) || manualBattleSession.gateId === 'angel')

  if (isMonarchSession && manualBattleSession) {
    const monarchId = manualBattleSession.gateId
    const monarchData = monarchId === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === monarchId)
    const recommendedCP = monarchData?.recommendedCP ?? 30000

    const handleDirectWorldBattleComplete = (payload: DirectBattlePanelCompletePayload) => {
      const hunterDied = Boolean(payload.battleStarted && (payload.actionCount ?? 0) > 0 && didDirectBattleHunterDie(payload))

      if (payload.outcome === 'cancelled' && !hunterDied) {
        cancelWorldBattle()
        return
      }

      const resolvedOutcome = hunterDied ? 'defeat' : payload.outcome
      const resultKey = `worldmap-${monarchId}:${payload.state.battleId}:${resolvedOutcome}`
      if (directGateResultIdsRef.current.has(resultKey)) return
      directGateResultIdsRef.current.add(resultKey)

      const playerUnits = payload.state.units.filter(unit => unit.team === 'player')
      const hunterUnit = playerUnits.find(unit => unit.unitType === 'hunter') ?? playerUnits[0]

      const turns: BattleTurn[] = payload.logs.length > 0
        ? payload.logs.map((_, index) => directLogToGateTurn(payload, index))
        : [{
            turnNumber: 1,
            actorType: 'player',
            actorId: hunterUnit?.unitId ?? 'direct-monarch-battle',
            actorName: hunterUnit?.displayName ?? 'Hunter',
            targetType: 'monster',
            targetId: monarchId,
            targetName: monarchData?.name ?? 'Monarch',
            outcome: 'hit',
            message: resolvedOutcome === 'victory' ? '군주 토벌전에서 승리했습니다.' : '군주 토벌전에서 패배했습니다.',
          }]

      // Add intro/setup logs for completeness
      turns.unshift({
        turnNumber: 0,
        waveNumber: 1,
        waveLabel: 'Wave 1',
        actorType: 'player',
        actorId: 'system',
        actorName: 'System',
        targetType: 'monster',
        targetId: `monarch-${monarchId}`,
        targetName: monarchData?.name ?? 'Monarch',
        skillId: 'monarch-intro',
        skillName: '군주 강림',
        outcome: 'buff',
        message: `🔥 [군주 출현] 권장 영역에 군주 [${monarchData?.name}]이(가) 나타났습니다!`,
      })

      if (equippedShadows.length > 0) {
        turns.unshift({
          turnNumber: 0,
          waveNumber: 1,
          waveLabel: 'Wave 1',
          actorType: 'player',
          actorId: 'system',
          actorName: 'System',
          targetType: 'player',
          targetId: 'player',
          targetName: hunter.name || '헌터',
          skillId: 'shadow-shield',
          skillName: '그림자 방패',
          outcome: 'buff',
          message: `🛡️ [그림자 방패] 그림자 군단이 독립 유닛으로 배치되었습니다! 그림자가 살아있는 동안 적의 공격을 대신 흡수하며, 전멸 시 본체가 위험해집니다.`,
        })
      }

      const combatLog: CombatLog = {
        battleId: `worldmap-monarch-${monarchId}-${Date.now()}`,
        gateInstanceId: `worldmap-${monarchId}`,
        result: resolvedOutcome === 'victory' ? 'victory' : 'defeat',
        turns,
        totalTurns: Math.max(1, payload.rounds),
        playerHpRemaining: Math.max(0, Math.round(hunterUnit?.stats.currentHp ?? 0)),
        rewards: [],
        totalWaves: 1,
        clearedWaves: resolvedOutcome === 'victory' ? 1 : 0,
        source: 'worldmap',
        finalOutcome: resolvedOutcome === 'victory' ? 'victory' : 'defeat',
        defeatReason: hunterDied ? 'player_dead' : 'party_wipe',
        playerDeathDetected: hunterDied,
        battleStarted: payload.battleStarted,
        actionCount: payload.actionCount,
        finalized: payload.finalized || hunterDied,
        shadowCasualtyIds: playerUnits
          .filter(unit => unit.unitType === 'shadow' && unit.stats.currentHp <= 0)
          .map(unit => unit.sourceId),
      }

      resolveDirectWorldBattle(combatLog, monarchId, manualBattleSession.helperHunterIds)
      cancelManualGateBattle()
    }

    const helperHunterIds = manualBattleSession.helperHunterIds
    let helperPower = 0
    let helperCount = 0
    let buffCoopAtk = 0
    let buffCoopDef = 0
    let drCoop = 0

    const livingWorld = useGame.getState().livingWorld
    if (helperHunterIds && helperHunterIds.length > 0 && livingWorld) {
      for (const hid of helperHunterIds) {
        const h = livingWorld.namedHunters[hid]
        if (h && h.status === 'active') {
          helperPower += h.power
          helperCount++
        }
      }
    }


    if (helperCount > 0) {
      buffCoopAtk = Math.round(COOP_HELP_ATK_FACTOR * helperPower)
      buffCoopDef = Math.round(COOP_HELP_DEF_FACTOR * helperPower)
      drCoop = Math.min(COOP_HELP_DR_CAP, COOP_HELP_DR_FACTOR * helperCount)
    }

    // Build the initial stats modifier and status effects for the hunter unit!
    const statsModifier: Partial<any> = {}
    if (buffCoopAtk > 0) statsModifier.atk = buffCoopAtk
    if (buffCoopDef > 0) statsModifier.def = buffCoopDef

    const statusEffects: any[] = []
    if (drCoop > 0) {
      statusEffects.push({
        statusId: `coop-dr-${Date.now()}`,
        definitionId: 'guard',
        name: '협력 방어',
        type: 'guard',
        targetUnitId: 'direct-preview-hunter',
        durationRounds: 999,
        stackCount: 1,
        maxStacks: 1,
        effectValue: drCoop,
        timing: 'round_start',
      })
    }

    if (equippedShadows.length > 0) {
      // Find first shadow's unit ID (constructed in DirectBattlePreviewPanel as `direct-preview-shadow-${shadow.instanceId}`)
      const firstShadowUnitId = `direct-preview-shadow-${equippedShadows[0].instanceId}`
      statusEffects.push({
        statusId: `shadow-guard-protect-${Date.now()}`,
        definitionId: 'protect',
        name: '그림자 보호',
        type: 'protect',
        sourceUnitId: firstShadowUnitId,
        targetUnitId: 'direct-preview-hunter',
        durationRounds: 999,
        stackCount: 1,
        maxStacks: 1,
        effectValue: 0.35,
        timing: 'round_start',
      })

      // Safeguard DR (15% for 4 rounds)
      statusEffects.push({
        statusId: `monarch-safeguard-${Date.now()}`,
        definitionId: 'guard',
        name: '그림자 장벽',
        type: 'guard',
        targetUnitId: 'direct-preview-hunter',
        durationRounds: 4,
        stackCount: 1,
        maxStacks: 1,
        effectValue: 0.15,
        timing: 'round_start',
      })
    }

    return (
      <div className="space-y-4">
        <DirectBattlePreviewPanel
          source="world_map"
          title="군주 격퇴전"
          note="그림자가 전방에서 공격을 받아내어 본체를 수호합니다. 그림자가 모두 쓰러지면 본체가 위험에 처합니다."
          hunter={hunter}
          items={items}
          equipment={equipment}
          activeConsumableEffects={activeConsumableEffects}
          equippedShadows={equippedShadows}
          contextStats={[
            { label: '군주', value: monarchData?.name ?? monarchId },
            { label: '권장 CP', value: `${recommendedCP.toLocaleString()} CP` },
          ]}
          customEnemyUnits={[buildMonarchBattleUnit(monarchId, recommendedCP)]}
          customBattleId={`direct-monarch-${monarchId}`}
          maxRoundsOverride={25}
          autoStart
          allowEncounterSelection={false}
          startButtonLabel="격퇴전 개시"
          restartButtonLabel="다시 준비"
          cancelButtonLabel="후퇴"
          onBattleComplete={handleDirectWorldBattleComplete}
          initialHunterStatsModifier={statsModifier}
          initialHunterStatusEffects={statusEffects}
        />
      </div>
    )
  }

  // 12-29I: 월드맵 수동 전투 세션에 대한 최상단 렌더링 예외 가드 추가
  if (manualBattleSession && manualBattleSession.source === 'world_map') {
    const worldMonsterDef = MONSTER_DEFINITIONS.find(monster => monster.id === manualBattleSession.gateId) || MONSTER_DEFINITIONS[0]
    return (
      <div className="space-y-4">
        <ManualBattlePanelV2
          session={manualBattleSession}
          skills={manualPlayerSkills.filter(skill => skill.id !== 'basic-attack')}
          items={items}
          monsterDefinition={worldMonsterDef}
          onAction={performWorldManualBattleAction || performManualBattleAction}
          onCancel={cancelWorldBattle}
        />
      </div>
    )
  }

  useEffect(() => {
    setIsDirectGateBattleOpen(false)
    directGateResultIdsRef.current.clear()
  }, [activeGate?.instanceId])

  // 멀티 인카운터: 단계 클리어(isLast 아님) 시 isBattleRevealing 자동 리셋하여 다음 단계 버튼 활성화
  const runStateEncounterIndex = activeGate?.runState?.currentEncounterIndex
  useEffect(() => {
    if (runStateEncounterIndex !== undefined && runStateEncounterIndex > 0) {
      setIsBattleRevealing(false)
    }
  }, [runStateEncounterIndex])

  const manualGateDefinition =
    manualBattleSession && (!manualBattleSession.source || manualBattleSession.source === 'gate')
      ? (GATE_DEFINITIONS.find(g => g.id === manualBattleSession.gateId) ?? activeGate?.customGateDef)
      : undefined
  const terminalGateSession =
    manualBattleSession &&
    (!manualBattleSession.source || manualBattleSession.source === 'gate') &&
    isManualBattleSessionTerminal(manualBattleSession)
  const terminalGateSessionKey = terminalGateSession ? `${manualBattleSession.gateInstanceId}:${manualBattleSession.startedAt}` : undefined
  const finalizedTerminalSessionsRef = useRef(new Set<string>())

  useEffect(() => {
    if (!terminalGateSession || !terminalGateSessionKey) return
    if (finalizedTerminalSessionsRef.current.has(terminalGateSessionKey)) return
    finalizedTerminalSessionsRef.current.add(terminalGateSessionKey)
    finalizeHardcoreDeathFromSession()
  }, [finalizeHardcoreDeathFromSession, terminalGateSession, terminalGateSessionKey])

  const handleDirectEchoBattleComplete = (payload: DirectBattlePanelCompletePayload) => {
    if (!selectedEcho) return
    const hunterDied = Boolean(payload.battleStarted && (payload.actionCount ?? 0) > 0 && didDirectBattleHunterDie(payload))
    if (payload.outcome === 'cancelled' && !hunterDied) {
      setSelectedEchoId(undefined)
      return
    }
    const resolvedOutcome = hunterDied ? 'defeat' : payload.outcome
    const resultKey = `${selectedEcho.id}:${payload.state.battleId}:${resolvedOutcome}`
    if (directGateResultIdsRef.current.has(resultKey)) return
    directGateResultIdsRef.current.add(resultKey)
    const updatedPayload = {
      ...payload,
      outcome: resolvedOutcome,
      ...(hunterDied ? {
        playerDeathDetected: true,
        defeatReason: 'player_dead' as const,
        finalOutcome: 'defeat' as const,
        finalized: true,
      } : {})
    }
    resolveGateEchoBattle(selectedEcho.id, buildDirectEchoCombatLog(updatedPayload, selectedEcho))
    setSelectedEchoId(undefined)
    setIsBattleRevealing(true)
  }

  if (selectedEcho) {
    return (
      <div className="space-y-4">
        <GateEchoPanel echoes={activeEchoes} onStart={setSelectedEchoId} />
        <DirectBattlePreviewPanel
          source="gate_echo"
          title="Gate Echo 정화 전투"
          note="미완료 일일퀘스트의 잔향을 먼저 정화해야 주요 행동이 재개됩니다."
          hunter={hunter}
          items={items}
          equipment={equipment}
          activeConsumableEffects={activeConsumableEffects}
          equippedShadows={equippedShadows}
          contextStats={[
            { label: 'Echo', value: selectedEcho.name },
            { label: '위험도', value: getGateEchoDangerLabel(selectedEcho) },
            { label: '강화', value: `${selectedEcho.strengthLevel}단계` },
          ]}
          customEnemyUnits={buildGateEchoEnemyUnits(selectedEcho, hunter)}
          customBattleId={`direct-echo-${selectedEcho.id}`}
          maxRoundsOverride={10 + Math.min(6, selectedEcho.strengthLevel)}
          autoStart
          allowEncounterSelection={false}
          startButtonLabel="정화 시작"
          restartButtonLabel="다시 준비"
          cancelButtonLabel="정비로 돌아가기"
          onBattleComplete={handleDirectEchoBattleComplete}
        />
      </div>
    )
  }

  if (terminalGateSession) {
    const deathTerminal = isManualBattleSessionPlayerDeath(manualBattleSession)
    return (
      <div className="space-y-4">
        <GateStatusPanel />
        <div className="panel corner-bracket border-rose-400/35 bg-rose-950/20 p-4">
          <div className="br" />
          <div className="text-sm font-black text-rose-100">
            {deathTerminal ? '헌터 사망이 확정되었습니다.' : '전투 기록이 종료되었습니다.'}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-white/65">
            {deathTerminal
              ? '하드코어 정산이 진행 중입니다. 사망 전 백업을 저장한 뒤 진행 기록이 초기화됩니다.'
              : '종료된 전투는 다시 진행하거나 포기할 수 없습니다. 정산 상태를 정리하고 있습니다.'}
          </p>
        </div>
      </div>
    )
  }

  if (
    manualBattleSession &&
    manualGateDefinition &&
    (!manualBattleSession.source || manualBattleSession.source === 'gate') &&
    !isManualBattleSessionTerminal(manualBattleSession) &&
    activeGate?.instanceId === manualBattleSession.gateInstanceId
  ) {
    return (
      <div className="space-y-4">
        <GateStatusPanel />
        <ArchiveTraceChip count={traceCount} />
        <ManualBattlePanelV2
          session={manualBattleSession}
          skills={manualPlayerSkills.filter(skill => skill.id !== 'basic-attack')}
          items={items}
          monsterDefinition={MONSTER_DEFINITIONS.find(monster => monster.id === manualGateDefinition.monsterIds[manualBattleSession.waveIndex])}
          onAction={performManualBattleAction}
          onCancel={cancelManualGateBattle}
        />
      </div>
    )
  }

  const gateConsumables = activeConsumableEffects.filter(effect =>
    !effect.consumed && (effect.duration === 'today' || effect.duration === 'next_gate')
  )
  const gateSuccessBonus = getActiveGateSuccessBonus(activeConsumableEffects)
  const gateSuccessStatBonus = gateSuccessBonus > 0
    ? Math.max(1, Math.round(gateSuccessBonus * 50))
    : 0

  if (!activeGateOpen) {
    return (
      <div className="space-y-4">
        <FocusSessionPanel />
        <GateEchoPanel echoes={activeEchoes} onStart={setSelectedEchoId} />
        <GateStatusPanel />
        <ArchiveTraceChip count={traceCount} />
        <EmptyGateState />
        <RecentBattleResult
          log={latestGateCombatLog}
          shouldReveal={isBattleRevealing}
          onRevealStateChange={setIsBattleRevealing}
        />
        <ShadowExtractionPanel log={latestGateCombatLog} gateId={activeGate?.gateId} />
      </div>
    )
  }

  if (!gate || !activeGate) {
    return (
      <div className="space-y-4">
        <FocusSessionPanel />
        <GateEchoPanel echoes={activeEchoes} onStart={setSelectedEchoId} />
        <GateStatusPanel />
        <ArchiveTraceChip count={traceCount} />
        <div className="panel corner-bracket p-8 text-center border-rose-400/30">
          <div className="br" />
          <AlertTriangle className="w-8 h-8 text-rose-300 mx-auto mb-3" />
          <div className="text-rose-200 font-semibold">게이트 데이터를 찾을 수 없습니다.</div>
        </div>
      </div>
    )
  }

  const monsters = gate.monsterIds
    .map(id => MONSTER_DEFINITIONS.find(monster => monster.id === id))
    .filter((monster): monster is MonsterDefinition => Boolean(monster))
  const shadowPreview = getGateShadowPreview(gate)
  const ownedShadowDefinitionIds = new Set(ownedShadows.map(shadow => shadow.definitionId))
  const rewardTable = GATE_REWARD_TABLES.find(reward => reward.id === gate.rewardTableId)
  const penalty = GATE_PENALTIES.find(item => item.id === gate.failPenaltyId)
  const risk = estimateGateRisk(playerPower, gate.recommendedPower)
  const riskInfo = riskMeta[risk]
  const powerComparison = getCombatPowerComparison(playerPower, gate.recommendedPower)
  const powerComparisonClass =
    powerComparison.tone === 'stable'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
      : powerComparison.tone === 'challenge'
        ? 'border-amber-400/25 bg-amber-400/10 text-amber-100'
        : 'border-rose-400/25 bg-rose-400/10 text-rose-100'
  const isInjured = Boolean(gateStatus.injuredUntil)
  const hasStamina = gateStatus.stamina >= GATE_ENTRY_COST
  const canStart = hasStamina && !isInjured && !isBattleRevealing && gateLock.allowed
  const latestCombatLog = latestGateCombatLog
  const canRetry =
    latestCombatLog?.gateInstanceId === activeGate.instanceId &&
    latestCombatLog.result === 'draw'
  const actionLabel = !hasStamina
    ? '스태미나 부족'
    : isInjured
      ? '부상 회복 필요'
      : isBattleRevealing
        ? '전투 진행 중'
        : canRetry
        ? '게이트 재도전'
        : '게이트 도전'

  const handleStartGateBattle = () => {
    if (!canStart) return
    setIsDirectGateBattleOpen(true)
    setIsBattleRevealing(false)
  }

  const handleStartLegacyGateBattle = () => {
    if (!canStart) return
    setIsBattleRevealing(true)
    startGateBattle()
  }

  const handleStartManualBattle = () => {
    if (!canStart || !gate) return
    setIsBattleRevealing(false)
    startManualGateBattle(gate.id)
  }

  // 12-29I: Main Gate direct-battle result hook.
  // Cancellation grants no reward. Victory/defeat are routed exactly once per
  // (instanceId, battleId, outcome) through store.resolveDirectGateBattle, which
  // owns the existing Gate reward / clear / penalty / progression logic.
  const handleDirectGateBattleComplete = (payload: DirectBattlePanelCompletePayload) => {
    if (!activeGate || !gate) return
    const hunterDied = Boolean(payload.battleStarted && (payload.actionCount ?? 0) > 0 && didDirectBattleHunterDie(payload))

    if (payload.outcome === 'cancelled' && !hunterDied) {
      setIsDirectGateBattleOpen(false)
      return
    }

    const resolvedOutcome = hunterDied ? 'defeat' : payload.outcome
    const resultKey = `${activeGate.instanceId}:${payload.state.battleId}:${resolvedOutcome}`
    if (directGateResultIdsRef.current.has(resultKey)) return
    directGateResultIdsRef.current.add(resultKey)
    const updatedPayload = {
      ...payload,
      outcome: resolvedOutcome,
      ...(hunterDied ? {
        playerDeathDetected: true,
        defeatReason: 'player_dead' as const,
        finalOutcome: 'defeat' as const,
        finalized: true,
      } : {})
    }
    resolveDirectGateBattle(buildDirectGateCombatLog(updatedPayload, activeGate, gate))
    setIsDirectGateBattleOpen(false)
    setIsBattleRevealing(true)
  }

  // 멀티 인카운터 런에서는 현재 인카운터 타입을 반영한 encounter key 사용
  const activeRunEncounterType = activeGate.runState
    ? activeGate.runState.encounters[activeGate.runState.currentEncounterIndex]?.type
    : undefined
  const directGateEncounterKey = getDirectGateEncounterKey(
    gate,
    activeGate.runState
      ? `${activeGate.instanceId}:enc${activeGate.runState.currentEncounterIndex}`
      : activeGate.instanceId,
    activeRunEncounterType
  )

  if (isDirectGateBattleOpen) {
    // S급 협력 헌터 버프/공조 효과 계산하여 직접 주입!
    const helperHunterIds = activeGate.helperHunterIds
    let helperPower = 0
    let helperCount = 0
    let buffCoopAtk = 0
    let buffCoopDef = 0
    let drCoop = 0

    const livingWorld = useGame.getState().livingWorld
    if (helperHunterIds && helperHunterIds.length > 0 && livingWorld) {
      for (const hid of helperHunterIds) {
        const h = livingWorld.namedHunters[hid]
        if (h && h.status === 'active') {
          helperPower += h.power
          helperCount++
        }
      }
    }

    if (helperCount > 0) {
      buffCoopAtk = Math.round(COOP_HELP_ATK_FACTOR * helperPower)
      buffCoopDef = Math.round(COOP_HELP_DEF_FACTOR * helperPower)
      drCoop = Math.min(COOP_HELP_DR_CAP, COOP_HELP_DR_FACTOR * helperCount)
    }

    const statsModifier: Partial<any> = {}
    if (buffCoopAtk > 0) statsModifier.atk = buffCoopAtk
    if (buffCoopDef > 0) statsModifier.def = buffCoopDef

    const statusEffects: any[] = []
    if (drCoop > 0) {
      statusEffects.push({
        statusId: `coop-dr-${Date.now()}`,
        definitionId: 'guard',
        name: '협력 방어',
        type: 'guard',
        targetUnitId: 'direct-preview-hunter',
        durationRounds: 999,
        stackCount: 1,
        maxStacks: 1,
        effectValue: drCoop,
        timing: 'round_start',
      })
    }

    if (equippedShadows.length > 0) {
      const firstShadowUnitId = `direct-preview-shadow-${equippedShadows[0].instanceId}`
      statusEffects.push({
        statusId: `shadow-guard-protect-${Date.now()}`,
        definitionId: 'protect',
        name: '그림자 보호',
        type: 'protect',
        sourceUnitId: firstShadowUnitId,
        targetUnitId: 'direct-preview-hunter',
        durationRounds: 999,
        stackCount: 1,
        maxStacks: 1,
        effectValue: 0.35,
        timing: 'round_start',
      })

      statusEffects.push({
        statusId: `monarch-safeguard-${Date.now()}`,
        definitionId: 'guard',
        name: '그림자 장벽',
        type: 'guard',
        targetUnitId: 'direct-preview-hunter',
        durationRounds: 4,
        stackCount: 1,
        maxStacks: 1,
        effectValue: 0.15,
        timing: 'round_start',
      })
    }

    const currentEnc = activeGate.runState?.encounters[activeGate.runState.currentEncounterIndex]

    return (
      <div className="space-y-4">
        <GateStatusPanel />
        <ArchiveTraceChip count={traceCount} />
        <DirectBattlePreviewPanel
          source={activeGate?.runState?.isPromotionExam ? 'promotion_exam' : (activeGate?.runState?.redGateState ? 'red_gate' : 'gate')}
          title="직접 조작 게이트 전투"
          note="실제 게이트 전투 후보입니다. 승리/패배 결과는 기존 게이트 보상/패널티 처리로 한 번만 연결됩니다."
          hunter={hunter}
          items={items}
          equipment={equipment}
          activeConsumableEffects={activeConsumableEffects}
          equippedShadows={equippedShadows}
          recommendedEncounterKey={directGateEncounterKey}
          enemyBaseLevel={getDirectGateEnemyBaseLevel(gate)}
          contextStats={[
            { label: '게이트', value: gate.name },
            { label: '랭크', value: `${gate.rank}-RANK` },
            { label: '적 조합', value: directGateEncounterKey },
          ]}
          autoStart
          allowEncounterSelection={false}
          startButtonLabel="전투 시작"
          restartButtonLabel="처음부터 다시"
          cancelButtonLabel="전투 취소"
          onBattleComplete={handleDirectGateBattleComplete}
          pressureSnapshot={activeGate.runState?.pressureSnapshot}
          isRedGate={Boolean(activeGate.runState?.redGateState)}
          initialHunterStatsModifier={statsModifier}
          initialHunterStatusEffects={statusEffects}
          difficultyMod={currentEnc?.difficultyMod}
        />
      </div>
    )
  }

  if (
    manualBattleSession?.gateInstanceId === activeGate.instanceId &&
    !isManualBattleSessionTerminal(manualBattleSession)
  ) {
    return (
      <div className="space-y-4">
        <GateStatusPanel />
        <ArchiveTraceChip count={traceCount} />
        <ManualBattlePanelV2
          session={manualBattleSession}
          skills={manualPlayerSkills.filter(skill => skill.id !== 'basic-attack')}
          items={items}
          monsterDefinition={MONSTER_DEFINITIONS.find(monster => monster.id === gate.monsterIds[manualBattleSession.waveIndex])}
          onAction={performManualBattleAction}
          onCancel={cancelManualGateBattle}
        />
        <RecentBattleResult
          log={latestGateCombatLog}
          shouldReveal={isBattleRevealing}
          onRevealStateChange={setIsBattleRevealing}
        />
      </div>
    )
  }

  if (activeEchoes.length > 0) {
    return (
      <div className="space-y-4">
        <FocusSessionPanel />
        <GateEchoPanel echoes={activeEchoes} onStart={setSelectedEchoId} />
        <GateStatusPanel />
        <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100">
          Echo 정화 후 게이트 진입이 재개됩니다.
        </div>
        <RecentBattleResult
          log={latestGateCombatLog}
          shouldReveal={isBattleRevealing}
          onRevealStateChange={setIsBattleRevealing}
        />
      </div>
    )
  }

  if (activeGate.runState) {
    return (
      <GateRunPanel
        activeGate={activeGate}
        runState={activeGate.runState}
        gate={gate}
        hunter={hunter}
        items={items}
        equipment={equipment}
        activeConsumableEffects={activeConsumableEffects}
        equippedShadows={equippedShadows}
        playerPower={playerPower}
        riskMeta={riskMeta}
        canStart={canStart}
        latestGateCombatLog={latestGateCombatLog}
        isBattleRevealing={isBattleRevealing}
        setIsBattleRevealing={setIsBattleRevealing}
        setIsDirectGateBattleOpen={setIsDirectGateBattleOpen}
        handleStartManualBattle={handleStartManualBattle}
        handleStartLegacyGateBattle={handleStartLegacyGateBattle}
        handleStartGateBattle={handleStartGateBattle}
      />
    )
  }

  return (
    <div className="space-y-4">
      <FocusSessionPanel />
      <GateEchoPanel echoes={activeEchoes} onStart={setSelectedEchoId} />
      <GateStatusPanel />
      <ArchiveTraceChip count={traceCount} />

      <div className="panel corner-bracket p-5 bg-gradient-to-br from-amber-500/10 via-ink-800/60 to-cyan-500/5 border-amber-400/30">
        <div className="br" />
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-5 h-5 text-amber-300 animate-pulse" />
              <div className="system-text text-[11px] text-amber-300/90">GATE DETECTED</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-bold text-amber-100">{gate.name}</h3>
              <span className="text-xs system-text text-amber-300 border border-amber-400/40 rounded px-2 py-0.5">
                {gate.rank}-RANK
              </span>
            </div>
            <p className="text-sm text-white/65 mt-2 leading-relaxed">{gate.description}</p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <div className="inline-flex items-center gap-1.5 border border-cyan-400/30 bg-cyan-400/10 rounded-md px-3 py-2 text-xs text-cyan-200">
              <Timer className="w-3.5 h-3.5" />
              {formatTimeRemaining(activeGate.expiresAt)}
            </div>
            <div className={`inline-flex items-center gap-1.5 border rounded-md px-3 py-2 text-xs ${riskInfo.className}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {riskInfo.label}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatPill label="출현 경로" value={sourceLabel[activeGate.source]} />
          <StatPill label="권장 레벨" value={`Lv.${gate.recommendedLevel}`} />
          <StatPill label="권장 전투력" value={gate.recommendedPower} />
          <StatPill label="내 전투력" value={playerPower} />
        </div>

        {currentPressure && currentPressure.reasonLabels.length > 0 && (
          <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-200">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-bold text-[12px] text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                현실 공명에 의한 게이트 심도 변화
              </div>
              <div className="text-white/70 text-[11px] leading-relaxed">
                사용자의 현실 행동 공명(준비도 및 성공 집중 세션)이 이 게이트에 감응하여 보상이 강화된 대신, 몬스터 반응도 예리해졌습니다.
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                {currentPressure.reasonLabels.map((label: string, idx: number) => (
                  <span key={idx} className="bg-cyan-500/10 border border-cyan-400/35 rounded px-2 py-0.5 text-[9px] text-cyan-200">
                    {label}
                  </span>
                ))}
                <span className="bg-rose-500/10 border border-rose-400/35 rounded px-2 py-0.5 text-[9px] text-rose-200 font-bold">
                  심층 반응: 몬스터 압박도 +{Math.round((currentPressure.monsterHpMultiplier - 1.0) * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        <div className={`mb-5 rounded-lg border px-3 py-2 text-xs ${powerComparisonClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="system-text">전투력 비교 · {powerComparison.label}</span>
            <span className="font-mono">
              현재 {playerPower.toLocaleString()} / 권장 {gate.recommendedPower.toLocaleString()} / 차이 {powerComparison.diff >= 0 ? '+' : ''}{powerComparison.diff.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Skull className="w-4 h-4 text-rose-300" />
                <div className="system-text text-[11px] text-rose-300/80">MONSTER</div>
                <span className="text-[10px] system-text text-cyan-300/60 border border-cyan-400/20 rounded px-1.5">
                  {monsters.length} Waves
                </span>
              </div>
              <div className="space-y-3">
                {monsters.length > 0 ? (
                  monsters.map((monster, index) => (
                    <MonsterCard
                      key={`${monster.id}-${index}`}
                      monster={monster}
                      waveNumber={index + 1}
                    />
                  ))
                ) : (
                  <div className="text-sm text-white/45 border border-white/10 rounded-lg p-4">
                    몬스터 정보를 찾을 수 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="border border-cyan-400/15 rounded-lg p-4 bg-cyan-400/5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-cyan-300" />
                <div className="system-text text-[11px] text-cyan-300/80">COMBAT STATS</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <StatPill label="HP" value={Math.round(combatStats.maxHp)} />
                <StatPill label="ATK" value={Math.round(combatStats.atk)} />
                <StatPill label="DEF" value={Math.round(combatStats.def)} />
                <StatPill label="SPD" value={Math.round(combatStats.speed)} />
              </div>
              <div className="text-[10px] text-white/40 system-text mt-3">
                CRIT {formatPercent(combatStats.critRate)} · ACC {formatPercent(combatStats.accuracy)} · EVA {formatPercent(combatStats.evasionRate)}
              </div>
              <div className="text-[10px] text-amber-200/70 system-text mt-2 leading-relaxed">
                사용 가능 스킬: {playerSkills.map(skill => skill.name).join(', ')}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ShadowBattleRoster shadows={equippedShadows} compact />

            <div className="border border-purple-400/20 rounded-lg p-4 bg-purple-500/5">
              <div className="system-text text-[11px] text-purple-300/80 mb-3">SHADOW POOL</div>
              <div className="space-y-1.5">
                {shadowPreview.map(def => {
                  const obtained = ownedShadowDefinitionIds.has(def.id)
                  const hidden = def.hiddenUntilObtained && !obtained
                  return (
                    <div key={def.id} className="flex justify-between gap-3 text-xs">
                      <span className="text-white/60">{hidden ? '[???] 미확인 신호' : `[${SHADOW_RARITY_LABEL[def.rarity]}] ${def.name}`}</span>
                      <span className="text-purple-200/70">{hidden ? '봉인' : def.role}</span>
                    </div>
                  )
                })}
              </div>
              <div className="text-[10px] text-white/35 leading-relaxed pt-2">
                victory 후 이 게이트에서 1회 그림자 추출을 시도할 수 있습니다.
              </div>
            </div>

            <div className="border border-purple-400/20 rounded-lg p-4 bg-purple-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-purple-300" />
                <div className="system-text text-[11px] text-purple-300/80">REWARD</div>
              </div>
              {rewardTable ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-white/50">XP 보상</span>
                    <span className="text-purple-200 font-semibold">{rewardTable.xp}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-white/50">아이템 드롭률</span>
                    <span className="text-purple-200 font-semibold">{formatPercent(rewardTable.itemDropChance)}</span>
                  </div>
                  {rewardTable.rarityBias && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="text-[10px] system-text text-white/35 mb-2">희귀도 경향</div>
                      <div className="space-y-1">
                        {Object.entries(rewardTable.rarityBias).map(([rarity, chance]) => (
                          <div key={rarity} className="flex justify-between text-xs">
                            <span className="text-white/50">{rarity}</span>
                            <span className="text-purple-200">{formatPercent(chance ?? 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-[10px] text-white/35 leading-relaxed pt-2">
                    승리 시 reward table 기반 지급 예정. draw는 보상 없음.
                  </div>
                </div>
              ) : (
                <div className="text-sm text-white/45">보상 정보를 찾을 수 없습니다.</div>
              )}
            </div>

            <div className="border border-rose-400/20 rounded-lg p-4 bg-rose-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-rose-300" />
                <div className="system-text text-[11px] text-rose-300/80">FAIL PENALTY</div>
              </div>
              {penalty ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-white/50">스태미나 손실</span>
                    <span className="text-rose-200 font-semibold">-{penalty.staminaCost}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-white/50">부상 시간</span>
                    <span className="text-rose-200 font-semibold">{penalty.injuryHours ?? 0}시간</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-white/45">패널티 정보를 찾을 수 없습니다.</div>
              )}
            </div>

            {gateConsumables.length > 0 && (
              <div className="border border-amber-400/20 rounded-lg p-4 bg-amber-500/5">
                <div className="system-text text-[11px] text-amber-300/80 mb-2">ACTIVE GATE EFFECTS</div>
                <div className="space-y-1 text-xs text-amber-100/75">
                  {gateConsumables.map(effect => (
                    <div key={effect.id}>{formatConsumable(effect)}</div>
                  ))}
                  {gateSuccessBonus > 0 && (
                    <div className="text-purple-200">
                      게이트 보조 효과: ATK/DEF +{gateSuccessStatBonus} · 전투 시작 후 3턴
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border border-cyan-400/20 rounded-lg p-4 bg-cyan-500/5">
              <div className="text-xs text-cyan-100/70 leading-relaxed">
                시간초과 시 draw 처리됩니다. draw는 보상과 패널티 없이 게이트가 유지되어 세팅 변경 후 재도전할 수 있습니다.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={handleStartGateBattle}
                disabled={!canStart}
                className="w-full btn btn-primary text-sm min-h-11 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                직접 조작 게이트 전투 시작
              </button>
            </div>
            {!canStart && (
              <div className="text-[10px] system-text text-center text-amber-300/60">
                {actionLabel}
              </div>
            )}
            <div className="text-[10px] system-text text-center text-cyan-300/45">
              draw는 보상/패널티 없이 게이트가 유지됩니다.
            </div>
          </div>
        </div>
      </div>
      <RecentBattleResult
        log={latestGateCombatLog}
        shouldReveal={isBattleRevealing}
        onRevealStateChange={setIsBattleRevealing}
      />
      <ShadowExtractionPanel log={latestGateCombatLog} gateId={gate.id} />
    </div>
  )
}

interface GateRunPanelProps {
  activeGate: ActiveGate
  runState: any
  gate: GateDefinition
  hunter: any
  items: Item[]
  equipment: any
  activeConsumableEffects: ActiveConsumableEffect[]
  equippedShadows: any[]
  playerPower: number
  riskMeta: any
  canStart: boolean
  latestGateCombatLog: CombatLog | undefined
  isBattleRevealing: boolean
  setIsBattleRevealing: (val: boolean) => void
  setIsDirectGateBattleOpen: (val: boolean) => void
  handleStartManualBattle: () => void
  handleStartLegacyGateBattle: () => void
  handleStartGateBattle: () => void
}

function GateRunPanel({
  activeGate,
  runState,
  gate,
  hunter,
  items,
  equipment,
  activeConsumableEffects,
  equippedShadows,
  playerPower,
  riskMeta,
  canStart,
  latestGateCombatLog,
  isBattleRevealing,
  setIsBattleRevealing,
  setIsDirectGateBattleOpen,
  handleStartManualBattle,
  handleStartLegacyGateBattle,
  handleStartGateBattle,
}: GateRunPanelProps) {
  const [selectedEncId, setSelectedEncId] = useState<string | null>(null)
  const [activeRestOption, setActiveRestOption] = useState<'heal' | 'buff' | 'cooldown'>('heal')

  // store actions
  const chooseGateRunEventChoice = useGame(s => s.chooseGateRunEventChoice)
  const claimGateRunTreasure = useGame(s => s.claimGateRunTreasure)
  const performGateRunRest = useGame(s => s.performGateRunRest)
  const absorbGateRunShadowTrace = useGame(s => s.absorbGateRunShadowTrace)
  const abandonGateRun = useGame(s => s.abandonGateRun)
  const attemptShadowExtraction = useGame(s => s.attemptShadowExtraction)

  const currentEncounterIndex = runState.currentEncounterIndex
  const encounters = runState.encounters
  const rawCurrentEncounter = encounters[currentEncounterIndex]
  const currentEncounter = useMemo(() => hydrateGateRunEncounterChoices(rawCurrentEncounter, activeGate), [rawCurrentEncounter, activeGate])

  const isRedGate = runState.redGateState && (runState.redGateState.status === 'opened' || runState.redGateState.status === 'cleared')

  // 테마 디자인 매핑
  const theme = GATE_THEMES.find(t => t.id === runState.themeId) ?? GATE_THEMES[0]
  const themeClass: Record<string, string> = {
    theme_rift: 'from-purple-950/40 via-purple-900/10 to-indigo-950/30 border-purple-500/35 text-purple-200',
    theme_beast: 'from-red-950/40 via-red-900/10 to-rose-950/30 border-rose-500/35 text-rose-200',
    theme_iron: 'from-slate-800/50 via-slate-900/20 to-zinc-900/40 border-slate-500/35 text-slate-200',
    theme_specter: 'from-zinc-900/60 via-stone-900/30 to-neutral-900/50 border-violet-500/35 text-violet-200',
    theme_supply: 'from-emerald-950/40 via-teal-900/10 to-emerald-900/20 border-emerald-500/35 text-emerald-200',
    theme_cursed: 'from-amber-950/45 via-amber-900/15 to-orange-950/35 border-amber-500/35 text-amber-200',
  }
  const redThemeStyle = 'from-red-950/65 via-red-900/20 to-zinc-950 border-red-500/50 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.2)] bg-red-950/30'
  const themeStyle = isRedGate ? redThemeStyle : (themeClass[theme.id] ?? themeClass.theme_rift)

  // 모디파이어 상세 정보 매핑
  const getModInfo = (modId: string) => {
    const mod = GATE_MODIFIERS.find(m => m.id === modId)
    if (!mod) return { name: modId, desc: '', style: 'border-zinc-500 bg-zinc-900/35 text-zinc-300' }
    let style = 'border-zinc-500 bg-zinc-900/35 text-zinc-300'
    if (mod.type === 'positive') style = 'border-emerald-500/40 bg-emerald-900/10 text-emerald-200'
    else if (mod.type === 'dangerous') style = 'border-rose-500/40 bg-rose-900/10 text-rose-200'
    else if (mod.type === 'rare') style = 'border-fuchsia-500/45 bg-fuchsia-900/15 text-fuchsia-200 animate-pulse'
    return { name: mod.name, desc: mod.description, style }
  }

  // 인카운터 타입별 색상/아이콘 헬퍼
  const getEncounterMeta = (type: string) => {
    switch (type) {
      case 'battle':
        return { icon: <Swords className="w-4 h-4" />, label: '일반 전투', color: 'text-rose-400 border-rose-500/30' }
      case 'elite':
        return { icon: <AlertTriangle className="w-4 h-4 text-amber-300" />, label: '정예 강습', color: 'text-amber-400 border-amber-500/30' }
      case 'boss':
        return { icon: <Skull className="w-4 h-4 text-red-50 animate-bounce" />, label: '구역 보스', color: 'text-red-500 border-red-500/45 bg-red-950/15' }
      case 'event':
        return { icon: <Dices className="w-4 h-4" />, label: '왜곡 징후', color: 'text-cyan-400 border-cyan-500/30' }
      case 'rest':
        return { icon: <Activity className="w-4 h-4" />, label: '정비 휴식처', color: 'text-emerald-400 border-emerald-500/30' }
      case 'treasure':
        return { icon: <Package className="w-4 h-4" />, label: '보물 상자', color: 'text-yellow-400 border-yellow-500/30' }
      case 'shadow_trace':
        return { icon: <Zap className="w-4 h-4 text-indigo-300" />, label: '그림자 흔적', color: 'text-indigo-400 border-indigo-500/35' }
      default:
        return { icon: <HelpCircle className="w-4 h-4" />, label: '미지 구역', color: 'text-zinc-400 border-zinc-500/30' }
    }
  }

  // UI 상에서 선택된 인카운터의 세부 내용
  const rawActiveDetailEnc = encounters.find((e: any) => e.id === (selectedEncId ?? currentEncounter.id)) ?? currentEncounter
  const activeDetailEnc = useMemo(() => hydrateGateRunEncounterChoices(rawActiveDetailEnc, activeGate), [rawActiveDetailEnc, activeGate])

  const computedDiffMod = useMemo(() => {
    const baseDiff = activeDetailEnc.difficultyMod ?? 1.0
    if (activeGate.source !== 'worldmap') return baseDiff
    
    const isBoss = activeDetailEnc.isBoss || activeDetailEnc.type === 'boss'
    if (isBoss) {
      const bossDelta = Math.max(-0.10, Math.min(0.10, runState.bossDifficultyDelta ?? 0))
      return baseDiff * (1 + bossDelta)
    } else if (activeDetailEnc.type === 'battle' || activeDetailEnc.type === 'elite') {
      const combatDelta = Math.max(-0.15, Math.min(0.15, runState.nextCombatDifficultyDelta ?? 0))
      return baseDiff * (1 + combatDelta)
    }
    return baseDiff
  }, [activeDetailEnc, runState, activeGate])

  const eventPack = useMemo(() => {
    if (activeGate.source !== 'worldmap') return null
    const subRegionId = activeGate.customGateDef?.subRegionId
    const regionId = activeGate.customGateDef?.regionId
    return getWorldGateEventPack(regionId, subRegionId)
  }, [activeGate])

  const getSeededIndex = (seed: string, length: number): number => {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % length
  }

  // 수동 전투 공략
  const onStartManual = () => {
    if (!canStart) return
    setIsBattleRevealing(false)
    handleStartManualBattle()
  }

  // 자동 전투 공략
  const onStartAuto = () => {
    if (!canStart) return
    setIsDirectGateBattleOpen(true)
    setIsBattleRevealing(false)
  }

  return (
    <div className="space-y-4">
      <FocusSessionPanel />
      {/* Red Gate Warning Banner */}
      {isRedGate && (
        <div className="mb-4 rounded-lg border border-red-500 bg-red-950/60 p-4 text-red-200 animate-pulse flex items-start gap-3 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-xs tracking-wider uppercase text-red-400">RED GATE INSTABILITY ACTIVATED</div>
            <p className="text-[11px] text-red-300 leading-relaxed mt-0.5">
              게이트가 붉게 뒤틀립니다. 도망칠 수 없는 붉은 균열이 전장을 삼킵니다! 남은 구역의 몬스터 전투 난이도가 대폭 강화되지만, 클리어 시 해당 게이트의 몬스터 그림자 추출 성공률 및 고등급/보스급 그림자의 공명 확률이 대폭 가산됩니다.
            </p>
          </div>
        </div>
      )}

      {/* Reality Pressure Warning Banner */}
      {runState.pressureSnapshot && runState.pressureSnapshot.reasonLabels.length > 0 && (
        <div className="mb-4 rounded-lg border border-cyan-500 bg-cyan-950/45 p-4 text-cyan-200 flex items-start gap-3 shadow-[0_0_10px_rgba(34,211,238,0.2)] animate-fade-in">
          <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <div className="font-bold text-xs tracking-wider uppercase text-cyan-400">REALITY RESONANCE ACTIVE</div>
            <p className="text-[11px] text-cyan-300 leading-relaxed mt-0.5">
              현실 공명으로 게이트 심도가 깊어졌습니다. 보상과 몬스터 위험이 동시에 증가합니다!
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {runState.pressureSnapshot.reasonLabels.map((label: string, idx: number) => (
                <span key={idx} className="bg-cyan-500/10 border border-cyan-400/30 rounded px-2 py-0.5 text-[9px] text-cyan-200">
                  {label}
                </span>
              ))}
              <span className="bg-rose-500/10 border border-rose-400/30 rounded px-2 py-0.5 text-[9px] text-rose-300 font-bold">
                심층 반응: 몬스터 압박도 +{Math.round((runState.pressureSnapshot.monsterHpMultiplier - 1.0) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Theme and Modifier banner */}
      <div className={`panel corner-bracket p-5 bg-gradient-to-br border ${themeStyle}`}>
        <div className="br" />
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              <div className="system-text text-[11px] tracking-wider opacity-85">DUNGEON RUN ACTIVATED</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-bold tracking-tight">
                {eventPack 
                  ? `[${eventPack.localeName}] ${activeGate.customGateDef?.name || theme.name}`
                  : theme.name}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 border rounded opacity-90">
                {eventPack ? '세계 원정 작전' : theme.tag}
              </span>
            </div>
            <p className="text-xs text-white/70 mt-2 leading-relaxed max-w-2xl">
              {(() => {
                if (!eventPack) return theme.description
                const intro = eventPack.introBriefings[getSeededIndex(runState.seed, eventPack.introBriefings.length)]
                const threat = eventPack.threatBriefings[getSeededIndex(runState.seed, eventPack.threatBriefings.length)]
                const hasContamination = activeGate.customGateDef?.contamination !== undefined
                const loveCallBrief = hasContamination ? eventPack.loveCallBriefings[getSeededIndex(runState.seed, eventPack.loveCallBriefings.length)] : ''
                return `[작전 브리핑] ${intro} ${threat} ${loveCallBrief}`
              })()}
            </p>
            <div className="text-[10px] text-white/45 mt-1 border-t border-white/10 pt-1.5">
              <span className="font-semibold text-amber-300">
                {eventPack ? '작전 환경:' : '특수 룰:'}
              </span>{' '}
              {(() => {
                if (!eventPack) return theme.specialVariable
                const cVal = activeGate.customGateDef?.contamination
                const dVal = activeGate.customGateDef?.daysRemaining
                let extra = ''
                if (cVal !== undefined) extra += `지맥 오염도: ${cVal}% | `
                if (dVal !== undefined) extra += `잔여 폭주 기한: D-${dVal}일 | `
                return `${extra}${theme.specialVariable}`
              })()}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 lg:justify-end lg:max-w-xs">
            {runState.modifierIds.map((modId: string) => {
              const mod = getModInfo(modId)
              return (
                <div key={modId} className={`border rounded px-2.5 py-1 text-[10px] font-medium leading-tight ${mod.style}`} title={mod.desc}>
                  {mod.name}
                </div>
              )
            })}
            {runState.modifierIds.length === 0 && (
              <div className="text-[10px] text-white/35 border border-white/5 rounded px-2.5 py-1">
                활성화된 이계 모디파이어 없음
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Dungeon Dashboard (위험도 / 보상 계기판) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={clsx(
          "panel p-3 text-center transition-all duration-300",
          isRedGate ? "border-red-500/30 bg-red-950/20 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]" : "border-rose-500/20 bg-rose-500/5"
        )}>
          <div className={clsx("text-[10px] system-text", isRedGate ? "text-red-400" : "text-rose-300/80")}>누적 위험도</div>
          <div className={clsx("text-xl font-bold mt-1", isRedGate ? "text-red-100" : "text-rose-100")}>{runState.accumulatedRisk} / 100</div>
          <div className="w-full bg-rose-950/40 rounded-full h-1 mt-2 overflow-hidden">
            <div className={clsx("h-1 transition-all duration-300", isRedGate ? "bg-red-500 animate-pulse" : "bg-rose-500")} style={{ width: `${runState.accumulatedRisk}%` }} />
          </div>
        </div>
        <div className="panel p-3 border-amber-500/20 bg-amber-500/5 text-center">
          <div className="text-[10px] system-text text-amber-300/80">보상 획득 배율</div>
          <div className="text-xl font-bold text-amber-100 mt-1">x{runState.rewardMultiplier.toFixed(2)}</div>
          <div className="text-[9px] text-amber-300/50 mt-1">이벤트 선택으로 증감</div>
        </div>
        <div className="panel p-3 border-indigo-500/20 bg-indigo-500/5 text-center">
          <div className="text-[10px] system-text text-indigo-300/80">추출 공명 보정</div>
          <div className="text-xl font-bold text-indigo-100 mt-1">+{runState.extractionBonusPercent ?? 0}%</div>
          <div className="text-[9px] text-indigo-300/50 mt-1">군주의 조각 흡수량 비례</div>
        </div>
        <div className="panel p-3 border-cyan-500/20 bg-cyan-500/5 text-center">
          <div className="text-[10px] system-text text-cyan-300/80">현재 누적 전리품</div>
          <div className="text-[10px] text-cyan-200 mt-1 font-semibold truncate">
            {runState.accumulatedRewards.gold}G / {runState.accumulatedRewards.essence}정수
          </div>
          <div className="text-[9px] text-cyan-300/50 mt-1">
            클리어 시 최종 수령 ({runState.accumulatedRewards.items.length}개 템)
          </div>
        </div>
      </div>

      {/* 2.5. 공조 헌터 브리핑 섹션 (러브콜/월드맵 게이트인 경우) */}
      {(() => {
        const livingWorld = useGame.getState().livingWorld
        if (activeGate.source !== 'worldmap') return null
        
        const helperHunterIds = activeGate.helperHunterIds
        let helperPower = 0
        let helperCount = 0
        let buffCoopAtk = 0
        let buffCoopDef = 0
        let drCoop = 0

        if (helperHunterIds && helperHunterIds.length > 0 && livingWorld) {
          for (const hid of helperHunterIds) {
            const h = livingWorld.namedHunters[hid]
            if (h && h.status === 'active') {
              helperPower += h.power
              helperCount++
            }
          }
        }

        if (helperCount > 0) {
          buffCoopAtk = Math.round(COOP_HELP_ATK_FACTOR * helperPower)
          buffCoopDef = Math.round(COOP_HELP_DEF_FACTOR * helperPower)
          drCoop = Math.min(COOP_HELP_DR_CAP, COOP_HELP_DR_FACTOR * helperCount)
        }

        const rewardRatio = Math.max(COOP_REWARD_MIN_RATIO, 1 - COOP_REWARD_PENALTY_PER_HELPER * helperCount)

        return (
          <div className={`panel p-4 border ${
            helperCount > 0
              ? 'border-cyan-500/25 bg-cyan-950/15 text-cyan-200'
              : 'border-rose-500/25 bg-rose-950/15 text-rose-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold tracking-wider uppercase">Expedition Cooperation (공조 작전)</h4>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${
                helperCount > 0 ? 'bg-cyan-500/20 text-cyan-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {helperCount > 0 ? '🤝 COOP ACTIVE' : '🚨 SOLO EXPEDITION'}
              </span>
            </div>
            {helperCount > 0 ? (
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-2">
                  {helperHunterIds?.map(hid => {
                    const h = livingWorld?.namedHunters[hid]
                    if (!h) return null
                    return (
                      <span key={hid} className="inline-flex items-center gap-1 bg-black/45 border border-cyan-500/30 rounded px-2 py-1 text-xs">
                        <span className="font-bold text-white/90">{h.name}</span>
                        <span className="text-[9px] bg-cyan-500/10 border border-cyan-400/20 px-1 text-cyan-300 rounded font-black">{h.rank}</span>
                        <span className="text-[9px] text-cyan-300/70 font-mono font-bold">⚔️{h.power.toLocaleString()}</span>
                      </span>
                    )
                  })}
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed mt-1">
                  S급 Named 헌터들의 긴급 개입으로 플레이어의 전투 능력이 강화되었습니다: {' '}
                  <span className="font-bold text-cyan-300">공격력 +{buffCoopAtk.toLocaleString()}</span>,{' '}
                  <span className="font-bold text-cyan-300">방어력 +{buffCoopDef.toLocaleString()}</span>,{' '}
                  <span className="font-bold text-cyan-300">피해 감소 -{Math.round(drCoop * 100)}%</span>.
                  (보상 분배에 따라 전리품 배율이 {Math.round(rewardRatio * 100)}%로 차감 반영되었습니다.)
                </p>
                {(() => {
                  const line = eventPack?.coopLines[getSeededIndex(runState.seed, eventPack.coopLines.length)]
                  if (!line) return null
                  return (
                    <p className="mt-2 text-[10.5px] text-cyan-300 border-l border-cyan-500/35 pl-2 italic">
                      📡 공조 사냥꾼 무선: "{line}"
                    </p>
                  )
                })()}
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[11px] text-rose-300/80 leading-relaxed font-semibold">
                  ⚠️ 아군의 지원 병력 없이 단독으로 침투한 전선입니다. 극한의 단독 원정 디버프 위험에 주의하십시오!
                </p>
                {(() => {
                  const warning = eventPack?.soloWarnings[getSeededIndex(runState.seed, eventPack.soloWarnings.length)]
                  if (!warning) return null
                  return (
                    <p className="mt-1 text-[10.5px] text-rose-300 border-l border-rose-500/35 pl-2 italic">
                      🚨 작전 통제 경고: "{warning}"
                    </p>
                  )
                })()}
              </div>
            )}
          </div>
        )
      })()}

      {/* 2.7. 작전 효과 및 전술 현황판 (A-2) */}
      {(() => {
        const hasOutcome = Boolean(runState.lastEventOutcomeText)
        const hasNextCombatMod = Boolean(runState.nextCombatDifficultyDelta)
        const hasBossMod = Boolean(runState.bossDifficultyDelta)
        const hasCleanseMod = Boolean(runState.contaminationRelief)
        const hasRiskTags = Boolean(runState.riskTags && runState.riskTags.length > 0)
        
        if (!hasOutcome && !hasNextCombatMod && !hasBossMod && !hasCleanseMod && !hasRiskTags) return null

        return (
          <div className="panel p-4 border-cyan-500/20 bg-cyan-950/5 text-zinc-200 space-y-3">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold tracking-wider uppercase text-cyan-300">Operation Status & Tactical Info (작전 효과 및 전술 현황)</h4>
            </div>

            {runState.lastEventOutcomeText && (
              <div className="bg-zinc-950/40 border border-zinc-800 p-3 rounded-lg text-xs leading-relaxed text-cyan-200">
                <span className="font-semibold text-cyan-400">💡 최근 선택 결과:</span>{' '}
                {runState.lastEventOutcomeText}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1 text-xs">
              {/* 다음 전투 위험도 보정 */}
              {hasNextCombatMod && (
                <div className="p-2 border border-zinc-800/80 bg-zinc-900/40 rounded flex items-center justify-between">
                  <span className="text-zinc-400">다음 전투 난이도</span>
                  <span className={clsx(
                    "font-bold",
                    runState.nextCombatDifficultyDelta! < 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {runState.nextCombatDifficultyDelta! < 0 ? '안정화 ' : '위험 상승 '}
                    ({runState.nextCombatDifficultyDelta! > 0 ? '+' : ''}{Math.round(runState.nextCombatDifficultyDelta! * 100)}%)
                  </span>
                </div>
              )}

              {/* 보스전 위험도 보정 */}
              {hasBossMod && (
                <div className="p-2 border border-zinc-800/80 bg-zinc-900/40 rounded flex items-center justify-between">
                  <span className="text-zinc-400">보스전 난이도</span>
                  <span className={clsx(
                    "font-bold",
                    runState.bossDifficultyDelta! < 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {runState.bossDifficultyDelta! < 0 ? '분석 완료 ' : '경보 활성 '}
                    ({runState.bossDifficultyDelta! > 0 ? '+' : ''}{Math.round(runState.bossDifficultyDelta! * 100)}%)
                  </span>
                </div>
              )}

              {/* 오염 정화 보너스 */}
              {hasCleanseMod && (
                <div className="p-2 border border-zinc-800/80 bg-zinc-900/40 rounded flex items-center justify-between">
                  <span className="text-zinc-400">노드 정화력</span>
                  <span className="font-bold text-cyan-300">
                    +{Math.round(runState.contaminationRelief!)}% (증폭)
                  </span>
                </div>
              )}
            </div>

            {runState.revealedBossHint && (
              <div className="bg-amber-950/15 border border-amber-500/20 p-2.5 rounded text-xs text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300">🔍 보스 약점 징후 확보:</span>{' '}
                  {runState.revealedBossHint}
                </div>
              </div>
            )}

            {hasRiskTags && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {runState.riskTags?.map((tag: string, idx: number) => (
                  <span key={idx} className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] px-2 py-0.5 rounded font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* 3. Dungeon Map / Timeline */}
      <div className="panel p-4 border-zinc-700/40 bg-zinc-900/60">
        <div className="system-text text-[10px] text-zinc-400 tracking-wider mb-3">DUNGEON TIMELINE MAP</div>
        <div className="flex flex-col md:flex-row items-stretch gap-2 overflow-x-auto pb-2">
          {encounters.map((enc: any, idx: number) => {
            const meta = getEncounterMeta(enc.type)
            const isCurrent = idx === currentEncounterIndex
            const isCleared = enc.status === 'cleared'
            const isAvailable = enc.status === 'available'
            const isLocked = enc.status === 'locked'

            return (
              <button
                key={enc.id}
                type="button"
                onClick={() => setSelectedEncId(enc.id)}
                className={clsx(
                  'flex-1 text-left p-3.5 border rounded-lg transition-all duration-300 relative overflow-hidden',
                  isCleared && 'border-zinc-800/40 bg-zinc-950/30 opacity-60 hover:opacity-90',
                  isAvailable && (isRedGate 
                    ? 'border-red-500 bg-red-950/20 shadow-[0_0_12px_rgba(239,68,68,0.25)] ring-1 ring-red-500/30' 
                    : 'border-amber-400 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/25'),
                  isLocked && 'border-zinc-800 bg-zinc-950/20 opacity-30 cursor-not-allowed',
                  selectedEncId === enc.id ? 'ring-2 ring-cyan-400 border-cyan-400' : ''
                )}
                disabled={isLocked}
              >
                {/* 상단 뱃지 */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold ${meta.color}`}>
                    {meta.icon}
                    <span>{meta.label}</span>
                  </div>
                  {isCleared && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  {isAvailable && (
                    isRedGate
                      ? <span className="text-[8px] px-1 bg-red-600 text-white rounded font-bold animate-pulse">RED ACTIVE</span>
                      : <span className="text-[8px] px-1 bg-amber-400 text-zinc-950 rounded font-bold animate-pulse">ACTIVE</span>
                  )}
                  {isLocked && <Lock className="w-3 h-3 text-zinc-600" />}
                </div>

                <div className="text-xs font-semibold text-zinc-100 truncate">{enc.title}</div>
                <div className="text-[9px] text-zinc-400 mt-1 truncate">{enc.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Encounter Detail Panel */}
      <div className="panel p-5 border-cyan-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-cyan-950/15">
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-3 mb-4 gap-2">
          <div>
            <div className="text-[10px] system-text text-cyan-400 font-bold tracking-wider">SELECTED ENCOUNTER PANEL</div>
            <h4 className="text-lg font-bold text-zinc-100 mt-1 flex items-center gap-2">
              {getEncounterMeta(activeDetailEnc.type).icon}
              {activeDetailEnc.title}
            </h4>
          </div>
          <div className="text-xs text-zinc-400">
            상태:{' '}
            <span className={clsx(
              'font-semibold',
              activeDetailEnc.status === 'cleared' && 'text-emerald-400',
              activeDetailEnc.status === 'available' && 'text-amber-400 animate-pulse',
              activeDetailEnc.status === 'locked' && 'text-zinc-500'
            )}>
              {activeDetailEnc.status === 'cleared' ? '공략 완료' : activeDetailEnc.status === 'available' ? '진행 가능' : '접근 불가'}
            </span>
          </div>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed mb-5">{activeDetailEnc.description}</p>

        {/* 세부 인카운터별 UI 조립 */}
        {activeDetailEnc.status === 'cleared' ? (
          <div className="p-4 border border-zinc-800 bg-zinc-950/20 rounded-lg text-center text-xs text-zinc-500">
            이미 완료된 구역입니다. 더 이상 상호작용할 수 없습니다.
          </div>
        ) : activeDetailEnc.status === 'locked' ? (
          <div className="p-4 border border-zinc-800 bg-zinc-950/20 rounded-lg text-center text-xs text-zinc-500">
            이전 인카운터 구역을 먼저 격파해 차원 잠금을 해제해야 합니다.
          </div>
        ) : (
          <div className="space-y-4">
            {/* A. 전투/정예/보스 방 */}
            {(activeDetailEnc.type === 'battle' || activeDetailEnc.type === 'elite' || activeDetailEnc.type === 'boss') && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 bg-zinc-950/40 p-4 rounded-lg border border-zinc-800">
                  <div>
                    <div className="text-[10px] system-text text-zinc-400 mb-1.5">매칭된 몬스터 리스트</div>
                    <div className="space-y-1.5">
                      {activeDetailEnc.monsterIds?.map((mId: string, idx: number) => {
                        const monster = MONSTER_DEFINITIONS.find(m => m.id === mId)
                        if (!monster) return null
                        return (
                          <div key={`${mId}-${idx}`} className="text-xs text-rose-200 font-medium flex items-center justify-between border-b border-zinc-800/40 pb-1">
                            <span>• {monster.name} ({monster.rank}-RANK)</span>
                            <span className="text-[9px] text-rose-400/80">HP 계수 x{computedDiffMod.toFixed(2)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] system-text text-zinc-400 mb-1.5">전투 배율 요약</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                      <div>위험도 계수: <span className="text-rose-400 font-bold">+{activeDetailEnc.riskDelta}</span></div>
                      <div>보상 배율: <span className="text-amber-400 font-bold">x{(activeDetailEnc.rewardMultiplier ?? 1.0).toFixed(2)}</span></div>
                      {activeDetailEnc.specialRuleId && (
                        <div className="col-span-2 text-cyan-300 mt-2 border-t border-zinc-800/80 pt-1 text-[10px]">
                          적용 버프/디버프: {activeDetailEnc.specialRuleId}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onStartAuto}
                    className="btn btn-primary w-full min-h-12 text-sm flex items-center justify-center gap-2"
                  >
                    <Swords className="w-5 h-5 animate-pulse" />
                    <span>균열 공략 개시 (2.5D 전투)</span>
                  </button>
                </div>
              </div>
            )}

            {/* B. 이벤트 인카운터 */}
            {activeDetailEnc.type === 'event' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-cyan-300 tracking-wider">차원의 선택지 수집 완료 — 선택하십시오</div>
                <div className="grid grid-cols-1 gap-2.5">
                  {/* store.ts나 events 데이터 구조에서 choices 매핑 */}
                  {activeDetailEnc.eventChoices?.map((choice: any) => {
                    const isCoopActive = activeGate.helperHunterIds && activeGate.helperHunterIds.length > 0
                    const isLockedByCoop = choice.requiresCoop && !isCoopActive
                    const isLockedBySolo = choice.requiresSolo && isCoopActive
                    const isLocked = isLockedByCoop || isLockedBySolo
                    const lockReason = isLockedByCoop
                      ? (choice.conditionHint || '🚨 [협력 Named 헌터 필요] 이 선택지는 지원 대원이 참가한 상태여야 활성화됩니다.')
                      : (choice.conditionHint || '🚨 [단독 돌입 필요] 이 선택지는 다른 헌터가 없을 때만 선택 가능합니다.')

                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => !isLocked && chooseGateRunEventChoice(choice.id)}
                        disabled={isLocked}
                        className={clsx(
                          "text-left p-3.5 border rounded-lg transition-all duration-200 group flex flex-col justify-between",
                          isLocked
                            ? "border-zinc-800 bg-zinc-950/20 opacity-50 cursor-not-allowed text-zinc-500"
                            : "border-cyan-500/30 bg-cyan-950/10 hover:bg-cyan-950/20 hover:border-cyan-400 text-cyan-200"
                        )}
                      >
                        <div className={clsx(
                          "font-bold flex items-center gap-2 text-sm",
                          isLocked ? "text-zinc-500" : "text-cyan-200 group-hover:text-cyan-100"
                        )}>
                          <ChevronRight className={clsx("w-4 h-4", isLocked ? "text-zinc-600" : "text-cyan-400")} />
                          <span>{choice.label}</span>
                          {choice.requiresCoop && (
                            <span className="text-[9px] bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded">
                              협력 전용
                            </span>
                          )}
                          {choice.requiresSolo && (
                            <span className="text-[9px] bg-rose-500/10 border border-rose-400/20 text-rose-300 font-bold px-1.5 py-0.5 rounded">
                              단독 전용
                            </span>
                          )}
                        </div>
                        <div className={clsx(
                          "text-xs mt-1.5 pl-6",
                          isLocked ? "text-zinc-600" : "text-white/70"
                        )}>
                          {choice.description}
                        </div>
                        {isLocked && (
                          <div className="text-[10px] text-amber-400/90 font-bold mt-2 pl-6 animate-pulse">
                            {lockReason}
                          </div>
                        )}
                      </button>
                    )
                  })}
                  {(!activeDetailEnc.eventChoices || activeDetailEnc.eventChoices.length === 0) && (
                    <div className="text-center text-xs text-zinc-500 border border-zinc-800 p-4 rounded-lg">
                      차원 불안정 현상 감지. 마력 공명을 통해 구역 안정화 후 우회하여 다음으로 통과합니다.
                      <button
                        type="button"
                        onClick={() => chooseGateRunEventChoice('choice_rift_stabilize')}
                        className="btn btn-secondary text-xs mt-3 block mx-auto"
                      >
                        마력 공명을 통해 구역 안정화 후 우회
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* C. 보물 인카운터 */}
            {activeDetailEnc.type === 'treasure' && (
              <div className="text-center p-6 border border-zinc-800 bg-zinc-950/40 rounded-lg">
                <Package className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-bounce" />
                <h5 className="text-sm font-bold text-yellow-200">흘러나온 고대 차원 보석함 발견</h5>
                <p className="text-xs text-zinc-400 mt-1.5 max-w-md mx-auto">
                  이계의 마력이 응축되어 생성된 보물 상자입니다. 복잡한 전투 없이 고스란히 정수와 골드로 회수할 수 있습니다.
                </p>
                <button
                  type="button"
                  onClick={claimGateRunTreasure}
                  className="btn btn-primary mt-5 px-6 min-h-10 text-xs font-semibold"
                >
                  보물 상자 개봉하여 보상 적립
                </button>
              </div>
            )}

            {/* D. 휴식 인카운터 */}
            {activeDetailEnc.type === 'rest' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveRestOption('heal')}
                    className={clsx(
                      'p-3 border rounded-lg text-left transition-all duration-200',
                      activeRestOption === 'heal' ? 'border-emerald-400 bg-emerald-950/15' : 'border-zinc-800 hover:border-zinc-700'
                    )}
                  >
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 fill-emerald-300" />
                      상처 봉합 및 휴식
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">다음 전투 아군 받는 피해 -20% 영구 감소 버프 부여</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRestOption('buff')}
                    className={clsx(
                      'p-3 border rounded-lg text-left transition-all duration-200',
                      activeRestOption === 'buff' ? 'border-emerald-400 bg-emerald-950/15' : 'border-zinc-800 hover:border-zinc-700'
                    )}
                  >
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5" />
                      신속의 기류 훈련
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">다음 전투 시작 시 아군 전체 속도 +15% 버프 획득</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRestOption('cooldown')}
                    className={clsx(
                      'p-3 border rounded-lg text-left transition-all duration-200',
                      activeRestOption === 'cooldown' ? 'border-emerald-400 bg-emerald-950/15' : 'border-zinc-800 hover:border-zinc-700'
                    )}
                  >
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <FastForward className="w-3.5 h-3.5" />
                      정신 마력 온천 욕
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">마음이 정돈되며 리스크가 소폭 경감되는 효과</div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => performGateRunRest(activeRestOption)}
                  className="btn btn-primary w-full min-h-10 text-xs font-semibold"
                >
                  선택한 정비 행동 수행 및 통과
                </button>
              </div>
            )}

            {/* E. 그림자 흔적 인카운터 */}
            {activeDetailEnc.type === 'shadow_trace' && (
              <div className="text-center p-6 border border-zinc-800 bg-zinc-950/40 rounded-lg">
                <Flame className="w-12 h-12 text-indigo-400 mx-auto mb-3 animate-pulse" />
                <h5 className="text-sm font-bold text-indigo-200">짙게 스며나온 어둠의 흔적 발견</h5>
                <p className="text-xs text-zinc-400 mt-1.5 max-w-md mx-auto">
                  이 방의 흔적을 헌터의 그림자 군단에 병합 정화합니다. 군주의 교감이 깊어지며 최종 공략 후 **그림자 추출 확률 공명 보정률이 +6%** 추가로 영구 축적됩니다.
                </p>
                <button
                  type="button"
                  onClick={absorbGateRunShadowTrace}
                  className="btn btn-primary mt-5 px-6 min-h-10 text-xs font-semibold"
                >
                  흔적을 성불시켜 추출 공명률 축적
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Dungeon Exit & Control Board */}
      <div className="flex flex-wrap items-center justify-between bg-zinc-950/45 p-4 border border-zinc-800/85 rounded-lg gap-3">
        <div>
          <div className="text-[10px] text-zinc-400">던전 공략 완료 후</div>
          <div className="text-xs text-zinc-300 mt-1">
            보스 및 최종 몬스터를 격파하여 던전 런을 정복하면 누적된 모든 전리품과 대량의 클리어 보상을 한 번에 가져가게 됩니다.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {runState.completed ? (
            <button
              type="button"
              onClick={() => attemptShadowExtraction(activeGate.instanceId)}
              className="btn btn-primary min-h-10 px-5 text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            >
              던전 클리어 보상 수령 & 그림자 추출 개시!
            </button>
          ) : (
            <button
              type="button"
              onClick={abandonGateRun}
              className="btn border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/25 text-rose-200 min-h-10 px-5 text-xs font-semibold"
            >
              공략 중단 및 탈출 (부분 누적 보상만 들고 퇴각)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
