import React, { useMemo } from 'react'
import { useGame } from '../lib/store'
import type { DailyProgressionState, DailyReadinessLevel } from '../lib/types'

// ── Helpers ────────────────────────────────────────────────────────────

const READINESS_META: Record<DailyReadinessLevel, {
  label: string
  color: string
  gradient: string
  glowColor: string
  icon: string
  desc: string
}> = {
  dormant: {
    label: '잠재 상태',
    color: 'text-zinc-400',
    gradient: 'from-zinc-700/60 to-zinc-800/40',
    glowColor: 'shadow-zinc-900/50',
    icon: '😴',
    desc: '오늘의 첫 걸음을 내디디면 게이트 보너스가 활성화됩니다.',
  },
  awakening: {
    label: '각성 중',
    color: 'text-sky-400',
    gradient: 'from-sky-900/50 to-slate-800/40',
    glowColor: 'shadow-sky-900/40',
    icon: '🌤️',
    desc: '현실 준비도가 쌓이고 있습니다. 계속하세요.',
  },
  focused: {
    label: '집중 상태',
    color: 'text-cyan-300',
    gradient: 'from-cyan-900/50 to-teal-900/30',
    glowColor: 'shadow-cyan-900/40',
    icon: '🔵',
    desc: '집중력이 활성화됐습니다. 게이트 보상이 상승합니다.',
  },
  resonant: {
    label: '공명 상태',
    color: 'text-purple-300',
    gradient: 'from-purple-900/60 to-indigo-900/40',
    glowColor: 'shadow-purple-900/50',
    icon: '⚡',
    desc: '현실과 게임이 공명하고 있습니다. 강력한 보너스가 적용됩니다.',
  },
  transcendent: {
    label: '초월 상태',
    color: 'text-amber-300',
    gradient: 'from-amber-900/60 to-orange-900/40',
    glowColor: 'shadow-amber-900/60',
    icon: '🔱',
    desc: '당신의 현실 준비도가 최고조에 달했습니다. 모든 보너스가 최대치입니다.',
  },
}

interface AxisBarProps {
  label: string
  icon: string
  value: number
  textColor: string
  bgTrackColor: string
  barColor: string   // explicit bg-* class (static, Tailwind-safe)
  detail?: string
}

function AxisBar({ label, icon, value, textColor, bgTrackColor, barColor, detail }: AxisBarProps) {
  const pct = Math.min(100, value)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-zinc-300">
          <span>{icon}</span>
          <span>{label}</span>
          {detail && <span className="text-zinc-500 ml-1">{detail}</span>}
        </span>
        <span className={`font-bold tabular-nums ${textColor}`}>{value}</span>
      </div>
      <div className={`h-2 w-full rounded-full ${bgTrackColor} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${pct}%`, opacity: pct > 0 ? 1 : 0 }}
        />
      </div>
    </div>
  )
}

// BonusBadge: 색상별 static class 맵핑 (Tailwind 퍼지 안전)
const BADGE_ACTIVE_CLASSES: Record<string, string> = {
  amber:  'bg-zinc-800/80 border border-amber-500/40',
  red:    'bg-zinc-800/80 border border-red-500/40',
  purple: 'bg-zinc-800/80 border border-purple-500/40',
  cyan:   'bg-zinc-800/80 border border-cyan-500/40',
}
const BADGE_VALUE_CLASSES: Record<string, string> = {
  amber:  'text-amber-300',
  red:    'text-red-300',
  purple: 'text-purple-300',
  cyan:   'text-cyan-300',
}

interface BonusBadgeProps {
  label: string
  value: number
  icon: string
  color: 'amber' | 'red' | 'purple' | 'cyan'
  active: boolean
}

function BonusBadge({ label, value, icon, color, active }: BonusBadgeProps) {
  const pct = Math.round(value * 100)
  const containerClass = active
    ? BADGE_ACTIVE_CLASSES[color]
    : 'bg-zinc-900/50 border border-zinc-700/30 opacity-40'
  const valueClass = active ? BADGE_VALUE_CLASSES[color] : 'text-zinc-500'
  return (
    <div className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-all duration-500 ${containerClass}`}>
      <span className="text-base">{icon}</span>
      <span className={`text-xs font-bold tabular-nums ${valueClass}`}>
        {pct > 0 ? `+${pct}%` : '—'}
      </span>
      <span className="text-[10px] text-zinc-500 leading-tight text-center">{label}</span>
    </div>
  )
}


// ── Main Component ─────────────────────────────────────────────────────

export function DailyProgressionPanel() {
  const dp = useGame(s => s.dailyProgression)
  const recalculate = useGame(s => s.recalculateDailyProgression)

  // 상태가 없으면 기본 dormant 표시
  const state: DailyProgressionState = useMemo(() => dp ?? {
    dateKey: new Date().toISOString().slice(0, 10),
    focusResonance: 0,
    bodyReadiness: 0,
    mindBalance: 0,
    routineScore: 0,
    overallReadiness: 0,
    readinessLevel: 'dormant',
    gateRewardBonus: 0,
    redGateResistBonus: 0,
    skillXpBonus: 0,
    extractionBonus: 0,
    todayCompletionsByCategory: {},
    todayTotalCompletions: 0,
    isRecoveryMode: false,
  }, [dp])

  const meta = READINESS_META[state.readinessLevel]
  const isActive = state.overallReadiness >= 15

  return (
    <div className={`rounded-xl border border-zinc-700/50 bg-gradient-to-b ${meta.gradient} p-4 flex flex-col gap-4 transition-all duration-700 shadow-lg ${isActive ? meta.glowColor : ''}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <div>
            <div className={`text-sm font-bold ${meta.color}`}>{meta.label}</div>
            <div className="text-[10px] text-zinc-500">현실 준비도 시스템</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <div className={`text-2xl font-black tabular-nums ${meta.color}`}>
            {state.overallReadiness}
          </div>
          <div className="text-[10px] text-zinc-500">/ 100</div>
        </div>
      </div>

      {/* 종합 게이지 */}
      <div className="relative h-3 w-full rounded-full bg-zinc-800/80 overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out ${
            state.readinessLevel === 'transcendent' ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-glow' :
            state.readinessLevel === 'resonant'     ? 'bg-gradient-to-r from-purple-500 to-indigo-400' :
            state.readinessLevel === 'focused'      ? 'bg-gradient-to-r from-cyan-500 to-teal-400' :
            state.readinessLevel === 'awakening'    ? 'bg-gradient-to-r from-sky-600 to-sky-400' :
                                                     'bg-zinc-700'
          }`}
          style={{ width: `${state.overallReadiness}%` }}
        />
        {/* 레벨 임계선 표시 */}
        {[15, 35, 55, 80].map(threshold => (
          <div
            key={threshold}
            className="absolute top-0 bottom-0 w-px bg-zinc-600/50"
            style={{ left: `${threshold}%` }}
          />
        ))}
      </div>

      {/* 리커버리 모드 배너 */}
      {state.isRecoveryMode && (
        <div className="rounded-lg bg-blue-900/30 border border-blue-700/40 px-3 py-2 flex items-start gap-2">
          <span className="text-blue-400 mt-0.5">🌙</span>
          <div className="text-xs text-blue-300">
            <div className="font-semibold">리커버리 모드</div>
            <div className="text-blue-400/70 mt-0.5">어제 휴식을 취했습니다. 오늘 퀘스트를 하나씩 완료하면 준비도가 회복됩니다. 패널티는 없습니다.</div>
          </div>
        </div>
      )}

      {/* 4개 축 바 */}
      <div className="flex flex-col gap-2.5">
        <AxisBar
          label="집중 공명"
          icon="📚"
          value={state.focusResonance}
          textColor="text-cyan-400"
          bgTrackColor="bg-cyan-950/50"
          barColor="bg-cyan-400"
          detail={`학습·커리어·재정 ${state.todayCompletionsByCategory?.study ?? 0}+${state.todayCompletionsByCategory?.career ?? 0}+${state.todayCompletionsByCategory?.finance ?? 0}회`}
        />
        <AxisBar
          label="신체 준비도"
          icon="🏋️"
          value={state.bodyReadiness}
          textColor="text-emerald-400"
          bgTrackColor="bg-emerald-950/50"
          barColor="bg-emerald-400"
          detail={`운동·건강 ${state.todayCompletionsByCategory?.workout ?? 0}+${state.todayCompletionsByCategory?.health ?? 0}회`}
        />
        <AxisBar
          label="정신 균형"
          icon="🧘"
          value={state.mindBalance}
          textColor="text-purple-400"
          bgTrackColor="bg-purple-950/50"
          barColor="bg-purple-400"
          detail={`정신·습관 ${state.todayCompletionsByCategory?.mind ?? 0}+${state.todayCompletionsByCategory?.habit ?? 0}회`}
        />
        <AxisBar
          label="루틴 점수"
          icon="🔁"
          value={state.routineScore}
          textColor="text-amber-400"
          bgTrackColor="bg-amber-950/50"
          barColor="bg-amber-400"
          detail={`오늘 완료 ${state.todayTotalCompletions}개`}
        />
      </div>


      {/* 게임 보너스 뱃지 */}
      <div>
        <div className="text-[10px] text-zinc-500 mb-2 font-medium tracking-wider uppercase">게이트 보너스</div>
        <div className="grid grid-cols-4 gap-1.5">
          <BonusBadge
            label="보상 배율"
            value={state.gateRewardBonus}
            icon="⚔️"
            color="amber"
            active={state.gateRewardBonus > 0}
          />
          <BonusBadge
            label="레드저항"
            value={state.redGateResistBonus}
            icon="🛡️"
            color="red"
            active={state.redGateResistBonus > 0}
          />
          <BonusBadge
            label="스킬XP"
            value={state.skillXpBonus}
            icon="✨"
            color="purple"
            active={state.skillXpBonus > 0}
          />
          <BonusBadge
            label="추출률"
            value={state.extractionBonus}
            icon="👁️"
            color="cyan"
            active={state.extractionBonus > 0}
          />
        </div>
      </div>

      {/* 설명 텍스트 */}
      <p className="text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-700/30 pt-3">
        {meta.desc}
      </p>
    </div>
  )
}

export default DailyProgressionPanel
