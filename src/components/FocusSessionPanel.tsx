import { useState } from 'react'
import { Play, Target, ChevronRight, BookOpen, Clock } from 'lucide-react'
import { useGame } from '../lib/store'
import { GATE_DEFINITIONS } from '../lib/seed'

export function FocusSessionPanel() {
  const activeGate = useGame(s => s.activeGate)
  const activeSession = useGame(s => s.focusSession?.active)
  const startFocusSession = useGame(s => s.startFocusSession)

  const [durationMin, setDurationMin] = useState<number>(25)
  const [useLinkedGate, setUseLinkedGate] = useState<boolean>(true)
  const [customInputOpen, setCustomInputOpen] = useState<boolean>(false)
  const [customMinText, setCustomMinText] = useState<string>('25')

  if (activeSession) {
    return null // active session이 있으면 Overlay가 전체 화면을 가릴 것이므로 렌더링 필요 없음
  }

  const presets = [15, 25, 50]

  const handleStart = () => {
    let finalMin = durationMin
    if (customInputOpen) {
      const parsed = parseInt(customMinText, 10)
      if (isNaN(parsed) || parsed < 5 || parsed > 120) {
        alert('집중 시간은 5분에서 120분 사이로 입력해주세요.')
        return
      }
      finalMin = parsed
    }

    const linkedGateId = (useLinkedGate && activeGate) ? activeGate.gateId : undefined
    startFocusSession(finalMin * 60 * 1000, linkedGateId)
  }

  const gateDef = activeGate ? (GATE_DEFINITIONS.find((g: any) => g.id === activeGate.gateId) ?? activeGate.customGateDef) : null

  // 이탈 허용 시간 계산용 가이드
  const getAllowedInterruptionText = () => {
    if (customInputOpen) {
      const parsed = parseInt(customMinText, 10)
      if (isNaN(parsed) || parsed < 5 || parsed > 120) return '허용 이탈: -'
      const plannedDurationMs = parsed * 60 * 1000
      const pct = plannedDurationMs * 0.05
      let allowedMs = Math.min(120 * 1000, pct)
      allowedMs = Math.max(60 * 1000, allowedMs)
      return `허용 이탈: ${Math.floor(allowedMs / 1000)}초`
    }
    if (durationMin === 15) return '허용 이탈: 60초'
    if (durationMin === 25) return '허용 이탈: 90초'
    if (durationMin === 50) return '허용 이탈: 120초'
    return ''
  }

  return (
    <div className="panel corner-bracket p-5 bg-ink-950/60 border border-emerald-500/20 shadow-lg relative overflow-hidden">
      <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
      
      {/* Background subtle glowing effects */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <BookOpen className="text-emerald-400 w-4 h-4 animate-pulse" />
            <h3 className="text-sm font-bold tracking-wider text-emerald-200 uppercase font-mono">
              오늘의 집중 스터디 타이머
            </h3>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            현실에서 공부나 업무에 집중하는 동안 집중 이력이 측정되고, 완료 시 보상이 정식 지급됩니다.<br />
            <span className="text-emerald-300 font-bold">완주 성공 시에만 골드와 마도 정수가 지급</span>되며, 누적 이탈 시간이 허용치를 초과하면 실패 처리됩니다.
          </p>
        </div>

        {/* Action presets and custom input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            {/* Preset Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-ink-900/60 rounded-md border border-emerald-500/10">
              {presets.map(min => (
                <button
                  key={min}
                  type="button"
                  onClick={() => {
                    setDurationMin(min)
                    setCustomInputOpen(false)
                  }}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-all ${
                    durationMin === min && !customInputOpen
                      ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-200 shadow-glow'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {min}분
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomInputOpen(true)}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-all ${
                  customInputOpen
                    ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-200 shadow-glow'
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                직접 입력
              </button>
            </div>
            <span className="text-[10px] font-mono text-emerald-300/80 mr-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {getAllowedInterruptionText()}
            </span>
          </div>

          {/* Custom Input Panel */}
          {customInputOpen && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="5"
                max="120"
                value={customMinText}
                onChange={(e) => setCustomMinText(e.target.value)}
                className="w-16 px-2 py-1 text-xs text-center font-mono font-bold bg-ink-900 border border-emerald-500/30 rounded focus:border-emerald-400 focus:outline-none"
              />
              <span className="text-[10px] text-white/40 font-mono">분</span>
            </div>
          )}

          {/* Linked Gate toggle if active gate exists */}
          {activeGate && (
            <label className="flex items-center gap-2 cursor-pointer select-none border border-purple-500/20 bg-purple-950/20 rounded px-3 py-2 text-xs text-purple-300">
              <input
                type="checkbox"
                checked={useLinkedGate}
                onChange={(e) => setUseLinkedGate(e.target.checked)}
                className="accent-purple-400"
              />
              <div className="flex items-center gap-1 font-mono">
                <Target className="w-3.5 h-3.5" />
                <span>[{gateDef?.name || '활성 게이트'}] 공명 잠입</span>
              </div>
            </label>
          )}

          {/* Start button */}
          <button
            onClick={handleStart}
            className="btn bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-ink-950 font-bold px-5 py-2.5 rounded-md flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.15)] transition"
          >
            <Play className="w-4 h-4 fill-ink-950 stroke-none" />
            <span className="text-xs font-bold tracking-wider">집중 시작</span>
            <ChevronRight className="w-3.5 h-3.5 text-ink-950" />
          </button>
        </div>
      </div>
    </div>
  )
}
