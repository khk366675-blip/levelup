import { useEffect, useRef, useState } from 'react'
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
} from 'lucide-react'
import { useGame } from '../lib/store'
import { GATE_DEFINITIONS, GATE_PENALTIES, GATE_REWARD_TABLES, MONSTER_DEFINITIONS, SKILL_DEFINITIONS } from '../lib/seed'
import {
  calculateCombatPower,
  calculatePlayerCombatStats,
  formatStatReward,
  getActiveGateSuccessBonus,
  estimateGateRisk,
  getEquippedItems,
  getPlayerCombatSkills,
  type GateRisk,
} from '../lib/game'
import type { ActiveConsumableEffect, CombatLog, Item, MonsterDefinition } from '../lib/types'
import type { ManualBattleAction, ManualBattleSession, SkillDefinition } from '../lib/types'

const GATE_ENTRY_COST = 20

const riskMeta: Record<GateRisk, { label: string; className: string }> = {
  low: { label: '위험도 낮음', className: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' },
  normal: { label: '적정 위험', className: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10' },
  high: { label: '위험도 높음', className: 'text-amber-300 border-amber-400/40 bg-amber-400/10' },
  extreme: { label: '매우 위험', className: 'text-rose-300 border-rose-400/40 bg-rose-400/10' },
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
    <div className="bg-ink-900/50 border border-white/10 rounded-md px-2.5 py-2">
      <div className="text-[9px] system-text text-white/35">{label}</div>
      <div className="text-sm font-semibold text-white/85 mt-0.5">{value}</div>
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
  const intervalRef = useRef<number | undefined>(undefined)

  const clearRevealTimer = () => {
    if (intervalRef.current !== undefined) {
      window.clearInterval(intervalRef.current)
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

    let nextCount = 0
    setRevealedLogCount(0)
    onRevealStateChange?.(true)

    intervalRef.current = window.setInterval(() => {
      nextCount += 1
      setRevealedLogCount(Math.min(nextCount, log.turns.length))

      if (nextCount >= log.turns.length) {
        clearRevealTimer()
        onRevealStateChange?.(false)
      }
    }, 500)

    return () => {
      clearRevealTimer()
      onRevealStateChange?.(false)
    }
  }, [log?.battleId, log?.turns.length, onRevealStateChange, shouldReveal])

  if (!log) return null

  const meta = resultMeta[log.result]
  const revealComplete = revealedLogCount >= log.turns.length
  const revealedTurns = log.turns.slice(0, revealedLogCount)
  const visibleTurns = revealComplete
    ? (showFullLog ? log.turns : log.turns.slice(-5))
    : revealedTurns
  const panelClassName = revealComplete ? meta.className : 'border-cyan-400/40 bg-cyan-500/10'
  const iconClassName = revealComplete ? meta.iconClassName : 'text-cyan-300'

  const skipReveal = () => {
    clearRevealTimer()
    setRevealedLogCount(log.turns.length)
    onRevealStateChange?.(false)
  }

  return (
    <div className={`panel corner-bracket p-4 border ${panelClassName}`}>
      <div className="br" />
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

      <div className="flex items-center justify-between gap-3 mb-3">
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

      <div className="space-y-2">
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

function ManualBattlePanel({
  session,
  skills,
  onAction,
  onCancel,
}: {
  session: ManualBattleSession
  skills: SkillDefinition[]
  onAction: (action: ManualBattleAction) => void
  onCancel: () => void
}) {
  const [showFullLog, setShowFullLog] = useState(false)
  const visibleLogs = showFullLog ? session.logs : session.logs.slice(-8)

  return (
    <div className="panel corner-bracket p-5 border-cyan-400/30 bg-cyan-500/5">
      <div className="br" />
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
        <div>
          <div className="system-text text-[11px] text-cyan-300/80 mb-1">MANUAL TURN BATTLE</div>
          <h3 className="text-xl font-bold text-cyan-100">{session.gateName}</h3>
          <div className="text-xs text-white/50 mt-1">
            Wave {session.waveIndex + 1} / {session.waveIndex + 1 + session.remainingMonsterIds.length} · Turn {session.turn} / {session.maxTurns}
          </div>
        </div>
        <div className="text-xs system-text border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 rounded px-2.5 py-1">
          {session.result ?? 'in progress'}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <div className="space-y-4 border border-white/10 rounded-lg p-4 bg-ink-900/35">
          <HpBar label={session.player.name} hp={session.player.hp} maxHp={session.player.maxHp} tone="cyan" />
          <div className="grid grid-cols-3 gap-2">
            <StatPill label="ATK" value={Math.round(session.player.atk)} />
            <StatPill label="DEF" value={Math.round(session.player.def)} />
            <StatPill label="SPD" value={Math.round(session.player.spd)} />
          </div>
        </div>
        <div className="space-y-4 border border-rose-400/20 rounded-lg p-4 bg-rose-500/5">
          <HpBar label={session.monster.name} hp={session.monster.hp} maxHp={session.monster.maxHp} tone="rose" />
          <div className="grid grid-cols-3 gap-2">
            <StatPill label="ATK" value={Math.round(session.monster.atk)} />
            <StatPill label="DEF" value={Math.round(session.monster.def)} />
            <StatPill label="SPD" value={Math.round(session.monster.spd)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
        <button type="button" onClick={() => onAction({ type: 'basic_attack' })} className="btn btn-primary text-sm min-h-11">
          기본 공격
        </button>
        <button type="button" onClick={() => onAction({ type: 'defend' })} className="btn text-sm min-h-11 border-cyan-400/25 bg-cyan-400/10 text-cyan-100">
          방어
        </button>
        {skills.map(skill => {
          const cooldown = session.cooldowns[skill.id] ?? 0
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => onAction({ type: 'skill', skillId: skill.id })}
              disabled={cooldown > 0}
              className="btn text-sm min-h-11 border-purple-400/25 bg-purple-400/10 text-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="block truncate">{skill.name}</span>
              {cooldown > 0 && <span className="ml-1 text-[10px] system-text">CD {cooldown}</span>}
            </button>
          )
        })}
        <button type="button" onClick={() => onAction({ type: 'auto_finish' })} className="btn text-sm min-h-11 border-amber-400/25 bg-amber-400/10 text-amber-100">
          자동 마무리
        </button>
        <button type="button" onClick={onCancel} className="btn text-sm min-h-11 border-rose-400/25 bg-rose-400/10 text-rose-100">
          전투 포기/닫기
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="system-text text-[11px] text-cyan-300/70">
          BATTLE LOG {showFullLog ? `(${session.logs.length})` : '(최근 8줄)'}
        </div>
        {session.logs.length > 8 && (
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

      <div className="space-y-2">
        {visibleLogs.length === 0 && (
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-3 text-xs text-cyan-100/60 system-text">
            행동을 선택하면 전투가 진행됩니다.
          </div>
        )}
        {visibleLogs.map((turn, index) => {
          const outcome = outcomeMeta[turn.outcome]
          return (
            <div key={`${turn.turnNumber}-${turn.actorId}-${index}`} className="rounded-lg border border-white/10 bg-ink-900/35 px-3 py-2 text-xs leading-relaxed text-white/65">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-cyan-300/50 system-text">#{turn.turnNumber}</span>
                {turn.waveNumber && <span className="text-[9px] system-text px-1.5 py-0.5 rounded border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">W{turn.waveNumber}</span>}
                <span className={`text-[9px] system-text px-1.5 py-0.5 rounded border ${outcome.className}`}>{outcome.label}</span>
              </div>
              <p>{turn.message}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const manualSkillOwnerLabel: Record<SkillDefinition['ownerType'], string> = {
  common: '기본',
  job: '직업',
  equipment: '장비',
  monster: '몬스터',
}

const manualSkillTypeLabel: Record<SkillDefinition['type'], string> = {
  attack: '공격',
  buff: '강화',
  debuff: '약화',
  heal: '회복',
}

function ManualHpBar({ label, hp, maxHp, tone }: { label: string; hp: number; maxHp: number; tone: 'cyan' | 'rose' }) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
  const percent = Math.round(ratio * 100)
  const barClassName = ratio <= 0.25
    ? 'bg-rose-300'
    : ratio <= 0.5
      ? 'bg-amber-300'
      : tone === 'cyan'
        ? 'bg-cyan-300'
        : 'bg-rose-300'

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs mb-1">
        <span className="font-semibold text-white/80 truncate">{label}</span>
        <span className="system-text text-white/50 shrink-0">{Math.ceil(Math.max(0, hp))} / {Math.ceil(maxHp)} · {percent}%</span>
      </div>
      <div className="h-4 rounded bg-ink-950/70 border border-white/10 overflow-hidden">
        <div className={`h-full ${barClassName} transition-all`} style={{ width: `${percent}%` }} />
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
  const actionCount = session.logs.filter(log => log.skillId !== 'system-manual-battle').length
  const totalWaves = session.waveIndex + 1 + session.remainingMonsterIds.length
  const result = session.result ? resultMeta[session.result] : undefined
  const visibleLogs = showFullLog ? session.logs : session.logs.slice(-8)
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
    <div className={`panel corner-bracket p-4 sm:p-5 border ${result?.className ?? 'border-cyan-400/30 bg-cyan-500/5'}`}>
      <div className="br" />
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
        <div>
          <div className="system-text text-[11px] text-cyan-300/80 mb-1">MANUAL TURN BATTLE</div>
          <h3 className="text-xl font-bold text-cyan-100">{session.gateName}</h3>
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
          {result?.label ?? '진행 중'}
        </div>
      </div>

      {result && (
        <div className="mb-5 border border-white/10 rounded-lg p-3 bg-ink-900/35">
          <div className="text-sm font-semibold text-white/85">{result.title}</div>
          <div className="text-xs text-white/55 leading-relaxed mt-1">{result.description}</div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-3 mb-5">
        <div className="space-y-4 border border-white/10 rounded-lg p-4 bg-ink-900/35">
          <ManualHpBar label={session.player.name} hp={session.player.hp} maxHp={session.player.maxHp} tone="cyan" />
          <div className="grid grid-cols-3 gap-2">
            <StatPill label="ATK" value={Math.round(session.player.atk)} />
            <StatPill label="DEF" value={Math.round(session.player.def)} />
            <StatPill label="SPD" value={Math.round(session.player.spd)} />
          </div>
        </div>
        <div className="space-y-4 border border-rose-400/20 rounded-lg p-4 bg-rose-500/5">
          <ManualHpBar label={session.monster.name} hp={session.monster.hp} maxHp={session.monster.maxHp} tone="rose" />
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

      <div className="space-y-3 mb-5">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onAction({ type: 'basic_attack' })} className="btn btn-primary text-sm min-h-14">
            기본 공격
          </button>
          <button type="button" onClick={() => onAction({ type: 'defend' })} className="btn text-sm min-h-14 border-cyan-400/25 bg-cyan-400/10 text-cyan-100">
            <span>방어</span>
            <span className="ml-1 text-[10px] system-text text-cyan-100/60">피해 -40%</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {skills.map(skill => {
            const cooldown = session.cooldowns[skill.id] ?? 0
            const disabledReason = cooldown > 0 ? `재사용 대기 ${cooldown}턴` : '사용 가능'
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => onAction({ type: 'skill', skillId: skill.id })}
                disabled={cooldown > 0}
                title={skill.description}
                className="min-h-[72px] rounded-md border border-purple-400/25 bg-purple-400/10 px-3 py-2 text-left text-purple-50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-400/15 transition"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold truncate">{skill.name}</span>
                  <span className="shrink-0 text-[9px] system-text border border-purple-300/25 rounded px-1.5 py-0.5 text-purple-100/70">
                    {manualSkillOwnerLabel[skill.ownerType]}
                  </span>
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-white/55 line-clamp-2">{skill.description}</span>
                <span className="mt-1 flex flex-wrap gap-1.5 text-[10px] system-text text-purple-100/70">
                  <span>{manualSkillTypeLabel[skill.type]}</span>
                  <span>CD {cooldown > 0 ? cooldown : (skill.cooldownTurns ?? 0)}</span>
                  <span className={cooldown > 0 ? 'text-amber-200' : 'text-emerald-200'}>{disabledReason}</span>
                </span>
              </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <button type="button" onClick={() => onAction({ type: 'auto_finish' })} className="btn text-sm min-h-12 border-amber-400/25 bg-amber-400/10 text-amber-100">
            자동 마무리
          </button>
          <button type="button" onClick={onCancel} className="btn text-sm min-h-12 border-rose-400/25 bg-rose-400/10 text-rose-100">
            전투 포기/닫기
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="system-text text-[11px] text-cyan-300/70">
          BATTLE LOG {showFullLog ? `(${session.logs.length})` : '(최근 8줄)'}
        </div>
        {session.logs.length > 8 && (
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

      <div className="space-y-2">
        {visibleLogs.length === 0 && (
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-3 text-xs text-cyan-100/60 system-text">
            행동을 선택하면 전투가 진행됩니다.
          </div>
        )}
        {visibleLogs.map((turn, index) => {
          const outcome = outcomeMeta[turn.outcome]
          const isSystemLog = turn.skillId === 'system-manual-battle'
          return (
            <div
              key={`${turn.turnNumber}-${turn.actorId}-${index}`}
              className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                isSystemLog
                  ? 'border-amber-400/25 bg-amber-400/10 text-amber-50/85'
                  : 'border-white/10 bg-ink-900/35 text-white/65'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-cyan-300/50 system-text">#{turn.turnNumber}</span>
                {turn.waveNumber && <span className="text-[9px] system-text px-1.5 py-0.5 rounded border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">W{turn.waveNumber}</span>}
                <span className={`text-[9px] system-text px-1.5 py-0.5 rounded border ${isSystemLog ? 'text-amber-200 border-amber-400/25 bg-amber-400/10' : outcome.className}`}>
                  {isSystemLog ? 'SYSTEM' : outcome.label}
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
  const hunter = useGame(s => s.hunter)
  const items = useGame(s => s.items)
  const equipment = useGame(s => s.equipment)
  const activeConsumableEffects = useGame(s => s.activeConsumableEffects)
  const activeGate = useGame(s => s.activeGate)
  const gateStatus = useGame(s => s.gateStatus)
  const combatLogs = useGame(s => s.combatLogs)
  const manualBattleSession = useGame(s => s.manualBattleSession)
  const startGateBattle = useGame(s => s.startGateBattle)
  const startManualGateBattle = useGame(s => s.startManualGateBattle)
  const performManualBattleAction = useGame(s => s.performManualBattleAction)
  const cancelManualGateBattle = useGame(s => s.cancelManualGateBattle)

  const equippedItems = getEquippedItems(items, equipment)
  const playerSkills = getPlayerCombatSkills({
    jobId: hunter.jobId,
    equippedItems,
    allSkills: SKILL_DEFINITIONS,
  })
  const combatStats = calculatePlayerCombatStats({
    level: hunter.level,
    stats: hunter.stats,
    equippedItems,
    activeConsumableEffects,
    jobId: hunter.jobId,
    skills: playerSkills,
  })
  const playerPower = calculateCombatPower(combatStats)
  const activeGateOpen = activeGate?.status === 'active'
  const gate = activeGateOpen
    ? GATE_DEFINITIONS.find(g => g.id === activeGate.gateId)
    : undefined

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
        <GateStatusPanel />
        <EmptyGateState />
        <RecentBattleResult
          log={combatLogs[0]}
          shouldReveal={isBattleRevealing}
          onRevealStateChange={setIsBattleRevealing}
        />
      </div>
    )
  }

  if (!gate || !activeGate) {
    return (
      <div className="space-y-4">
        <GateStatusPanel />
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
  const rewardTable = GATE_REWARD_TABLES.find(reward => reward.id === gate.rewardTableId)
  const penalty = GATE_PENALTIES.find(item => item.id === gate.failPenaltyId)
  const risk = estimateGateRisk(playerPower, gate.recommendedPower)
  const riskInfo = riskMeta[risk]
  const isInjured = Boolean(gateStatus.injuredUntil)
  const hasStamina = gateStatus.stamina >= GATE_ENTRY_COST
  const canStart = hasStamina && !isInjured && !isBattleRevealing
  const latestCombatLog = combatLogs[0]
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
    setIsBattleRevealing(true)
    startGateBattle()
  }

  const handleStartManualBattle = () => {
    if (!canStart || !gate) return
    setIsBattleRevealing(false)
    startManualGateBattle(gate.id)
  }

  if (manualBattleSession?.gateInstanceId === activeGate.instanceId) {
    return (
      <div className="space-y-4">
        <GateStatusPanel />
        <ManualBattlePanelV2
          session={manualBattleSession}
          skills={playerSkills}
          items={items}
          monsterDefinition={MONSTER_DEFINITIONS.find(monster => monster.id === gate.monsterIds[manualBattleSession.waveIndex])}
          onAction={performManualBattleAction}
          onCancel={cancelManualGateBattle}
        />
        <RecentBattleResult
          log={combatLogs[0]}
          shouldReveal={isBattleRevealing}
          onRevealStateChange={setIsBattleRevealing}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <GateStatusPanel />

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleStartGateBattle}
                disabled={!canStart}
                className="w-full btn btn-primary text-sm min-h-11 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                자동 전투 시작
              </button>
              <button
                type="button"
                onClick={handleStartManualBattle}
                disabled={!canStart}
                className="w-full btn text-sm min-h-11 border-cyan-400/25 bg-cyan-400/10 text-cyan-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                수동 전투 시작
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
        log={combatLogs[0]}
        shouldReveal={isBattleRevealing}
        onRevealStateChange={setIsBattleRevealing}
      />
    </div>
  )
}
