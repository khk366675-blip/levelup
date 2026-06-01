import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, AlertTriangle, Coins, Sparkles, CheckCircle2, ShieldAlert, BookOpen, Clock, AlertCircle } from 'lucide-react'
import { useGame } from '../lib/store'
import { GATE_DEFINITIONS } from '../lib/seed'

export function FocusSessionOverlay() {
  const activeSession = useGame(s => s.focusSession?.active)
  const history = useGame(s => s.focusSession?.history ?? [])
  const tickFocusSession = useGame(s => s.tickFocusSession)
  const pauseFocusSession = useGame(s => s.pauseFocusSession)
  const resumeFocusSession = useGame(s => s.resumeFocusSession)
  const recordFocusInterruption = useGame(s => s.recordFocusInterruption)
  const completeFocusSession = useGame(s => s.completeFocusSession)
  const cancelFocusSession = useGame(s => s.cancelFocusSession)

  const [showResultRecord, setShowResultRecord] = useState<any | null>(null)
  const [showShakeAlert, setShowShakeAlert] = useState<boolean>(false)
  const [lastInterruptionElapsed, setLastInterruptionElapsed] = useState<number>(0)
  const [confirmAbort, setConfirmAbort] = useState<boolean>(false)

  const prevActiveRef = useRef<any>(activeSession)
  const lastHiddenTimeRef = useRef<number | null>(null)
  const isBlurRef = useRef<boolean>(false)

  // 1. active 세션 종료/전환 감지하여 보상 모달 띄우기
  useEffect(() => {
    if (prevActiveRef.current && !activeSession) {
      const latestHistory = useGame.getState().focusSession?.history ?? []
      if (latestHistory.length > 0) {
        setShowResultRecord(latestHistory[0])
      }
    }
    prevActiveRef.current = activeSession
  }, [activeSession])

  // 2. 타이머 틱 및 탭 이탈/포커스 blur 감지 리스너
  useEffect(() => {
    // 1초마다 tick
    const timer = setInterval(() => {
      if (activeSession && activeSession.status === 'running') {
        tickFocusSession()
      }
    }, 1000)

    const handleInterruptionStart = () => {
      if (activeSession && activeSession.status === 'running') {
        if (lastHiddenTimeRef.current !== null) return
        lastHiddenTimeRef.current = Date.now()
      }
    }

    const handleInterruptionEnd = () => {
      if (lastHiddenTimeRef.current === null) return
      const elapsed = Date.now() - lastHiddenTimeRef.current
      lastHiddenTimeRef.current = null

      // 10초(10000ms) 이상 이탈한 경우만 interruption으로 기록
      if (elapsed >= 10000) {
        recordFocusInterruption(elapsed)
        setLastInterruptionElapsed(elapsed)
        setShowShakeAlert(true)
        setTimeout(() => setShowShakeAlert(false), 6000)
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleInterruptionStart()
      } else {
        handleInterruptionEnd()
      }
    }

    const onBlur = () => {
      isBlurRef.current = true
      handleInterruptionStart()
    }

    const onFocus = () => {
      isBlurRef.current = false
      handleInterruptionEnd()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [activeSession, tickFocusSession, recordFocusInterruption])

  if (!activeSession && !showResultRecord) {
    return null
  }

  // 헬퍼: 포맷 ms -> MM:SS
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 헬퍼: 초 단위 포맷 ms -> N초
  const formatSeconds = (ms: number) => {
    return `${Math.floor(ms / 1000)}초`
  }

  // 집중 진행도
  const current = activeSession ? activeSession.accumulatedFocusedMs : 0
  const planned = activeSession ? activeSession.plannedDurationMs : 1
  const remaining = Math.max(0, planned - current)
  const percent = Math.min(100, Math.round((current / planned) * 100))

  const gateDef = activeSession?.linkedGateId
    ? GATE_DEFINITIONS.find((g: any) => g.id === activeSession.linkedGateId)
    : null

  // 실시간 세션 상태 분석
  const totalInterrupted = activeSession?.totalInterruptedMs ?? 0
  const allowedInterruption = activeSession?.allowedInterruptionMs ?? 60000
  
  let statusText = '집중 유지 중'
  let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  
  if (activeSession) {
    if (activeSession.status === 'paused') {
      statusText = '집중 일시정지'
      statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    } else if (totalInterrupted > 0) {
      if (totalInterrupted >= allowedInterruption * 0.7) {
        statusText = '실패 위험! 흐름 흔들림'
        statusColor = 'text-red-400 bg-red-500/10 border-red-500/30 animate-pulse'
      } else {
        statusText = '주의! 집중 흐름 흔들림'
        statusColor = 'text-amber-300 bg-amber-500/10 border-amber-500/20'
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/97 backdrop-blur-lg select-none overflow-y-auto p-4">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <AnimatePresence mode="wait">
          {/* 1. 진행 상태 화면 */}
          {activeSession && !confirmAbort && (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="panel corner-bracket p-8 bg-ink-900/30 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.05)] text-center space-y-6 relative overflow-hidden"
            >
              <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />

              {/* Status Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] tracking-widest font-mono font-bold ${statusColor}`}>
                    {statusText}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white/90 tracking-wide flex items-center justify-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>오늘의 집중 세션</span>
                </h2>
                {gateDef && (
                  <p className="text-xs text-purple-300/80 font-mono flex items-center justify-center gap-1">
                    🎯 공명 잠입 타겟: <span className="underline font-bold text-purple-200">{gateDef.name}</span>
                  </p>
                )}
              </div>

              {/* Big Minimal Timer */}
              <div className="py-8 flex flex-col items-center justify-center">
                <div className="text-7xl font-light font-mono tracking-tighter text-emerald-300 drop-shadow-[0_0_20px_rgba(110,231,183,0.15)] mb-6">
                  {formatTime(remaining)}
                </div>
                
                {/* Minimal Horizontal Progress Bar */}
                <div className="w-full bg-ink-950/80 rounded-full h-2.5 border border-white/5 p-0.5 relative overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ width: `${percent}%` }}
                    layout
                  />
                </div>

                <div className="flex items-center justify-between w-full mt-3 text-[11px] font-mono text-white/40 px-1">
                  <span>누적 집중: {formatTime(current)}</span>
                  <span>달성도: {percent}%</span>
                  <span>목표 시간: {formatTime(planned)}</span>
                </div>
              </div>

              {/* Interruption Status Metrics */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-5 font-mono text-xs">
                <div className="space-y-1.5 border-r border-white/5">
                  <div className="text-white/40 text-[10px] tracking-wider uppercase">누적 이탈 시간</div>
                  <div className={`text-lg font-bold ${totalInterrupted > 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
                    {formatSeconds(totalInterrupted)}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-white/40 text-[10px] tracking-wider uppercase">허용 이탈 한도</div>
                  <div className="text-lg font-bold text-emerald-300">
                    {formatSeconds(allowedInterruption)}
                  </div>
                </div>
              </div>

              {/* Floating warning for interruption detection */}
              <AnimatePresence>
                {showShakeAlert && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="panel bg-rose-950/20 border border-rose-500/30 p-3.5 text-xs text-rose-200 text-left space-y-1.5 flex items-start gap-3"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">⚠️ 집중 흐름이 끊겼습니다!</div>
                      <div className="text-[10px] text-rose-300/80 leading-relaxed">
                        앱 이탈({Math.floor(lastInterruptionElapsed / 1000)}초)을 감지했습니다. 누적 이탈 시간이 허용치를 초과하면 타이머가 실패 처리됩니다.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active controls */}
              <div className="flex items-center gap-3 justify-center pt-2">
                {activeSession.status === 'running' ? (
                  <button
                    onClick={() => pauseFocusSession()}
                    className="px-5 py-2.5 rounded border border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 text-xs font-semibold font-mono tracking-wider flex items-center gap-1.5 transition-all"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>일시정지</span>
                  </button>
                ) : (
                  <button
                    onClick={() => resumeFocusSession()}
                    className="px-5 py-2.5 rounded border border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 text-xs font-semibold font-mono tracking-wider flex items-center gap-1.5 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-emerald-300" />
                    <span>집중 재개</span>
                  </button>
                )}

                <button
                  onClick={() => setConfirmAbort(true)}
                  className="px-5 py-2.5 rounded border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-300 text-xs font-semibold font-mono tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-rose-300" />
                  <span>세션 중단</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* 2. 중단 확인 화면 */}
          {activeSession && confirmAbort && (
            <motion.div
              key="abort"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="panel corner-bracket p-6 bg-ink-900/50 border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.1)] text-center space-y-5"
            >
              <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
              
              <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto animate-pulse" />
              
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-rose-200">정말로 집중 세션을 중단하시겠습니까?</h3>
                <p className="text-xs text-white/50 leading-relaxed px-4">
                  세션을 중단하는 경우 <span className="text-rose-300 font-bold">확보한 성장 보상(골드, 에센스)이 전부 소멸</span>합니다. 완주 성공 시에만 집중 성과가 인정됩니다.
                </p>
              </div>

              <div className="flex items-center gap-3 justify-center pt-2">
                <button
                  onClick={() => {
                    cancelFocusSession('manual_cancel')
                    setConfirmAbort(false)
                  }}
                  className="px-6 py-2.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono tracking-wider transition-all shadow-md"
                >
                  중단 (보상 소멸)
                </button>
                <button
                  onClick={() => setConfirmAbort(false)}
                  className="px-6 py-2.5 rounded border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-xs font-bold font-mono tracking-wider transition-all"
                >
                  집중으로 복귀
                </button>
              </div>
            </motion.div>
          )}

          {/* 3. 최종 결과 완료/실패 모달 */}
          {showResultRecord && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="panel corner-bracket p-8 bg-ink-900/50 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] text-center space-y-6 relative"
            >
              <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
              
              {showResultRecord.completed ? (
                <div className="space-y-2">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                  <div className="text-[10px] tracking-[0.25em] font-mono text-emerald-400 font-bold">
                    MISSION ACCOMPLISHED // 완벽한 완주
                  </div>
                  <h3 className="text-xl font-bold text-white/90">
                    오늘의 집중 완주 성공!
                  </h3>
                </div>
              ) : (
                <div className="space-y-2">
                  <AlertCircle className="w-16 h-16 text-rose-400 mx-auto" />
                  <div className="text-[10px] tracking-[0.25em] font-mono text-rose-400 font-bold">
                    MISSION SUSPENDED // 집중 종료
                  </div>
                  <h3 className="text-xl font-bold text-rose-300">
                    {showResultRecord.failReason === 'interruption_limit_exceeded' 
                      ? '이탈 한도 초과로 실패' 
                      : showResultRecord.failReason === 'refresh_guard'
                      ? '연결 끊김으로 무효'
                      : '집중 세션 중단'}
                  </h3>
                </div>
              )}

              <p className="text-xs text-white/60 leading-relaxed px-2">
                {showResultRecord.completed
                  ? '축하합니다! 흐트러짐 없이 목표 시간을 끝까지 완주하여 게이트 심층의 성장 자원과 추출 공명 에너지를 모두 획득했습니다.'
                  : showResultRecord.failReason === 'interruption_limit_exceeded'
                  ? '허용 이탈 시간을 초과하여 집중 세션이 실패 처리되었습니다. 완주 성공 시에만 정식 보상을 획득할 수 있습니다.'
                  : showResultRecord.failReason === 'refresh_guard'
                  ? '세션 연결이 끊겨 집중 기록이 실패 처리되었습니다. 확보된 보상은 없지만 다음 도전을 시작해 봅시다.'
                  : '집중 타이머가 수동으로 중단되었습니다. 완주에 성공해야 보상(골드, 에센스)을 온전히 지급받을 수 있습니다.'}
              </p>

              {/* Reward values */}
              <div className="bg-ink-950/80 rounded border border-white/5 p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-white/50 text-[10px] border-b border-white/5 pb-2.5">
                  <span>집중 시간: {Math.floor(showResultRecord.focusedMs / 60000)}분</span>
                  <span>이탈 누적: {formatSeconds(showResultRecord.totalInterruptedMs ?? 0)} ({showResultRecord.interruptionCount}회)</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-left">
                  <div className="flex items-center gap-2 text-amber-300/90">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-[9px] text-white/40">골드 보상</div>
                      <div className="font-bold text-sm">+{showResultRecord.rewards?.gold ?? 0} Gold</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-emerald-300/90">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-[9px] text-white/40">그림자 정수</div>
                      <div className="font-bold text-sm">+{showResultRecord.rewards?.essence ?? 0} 그림자 정수</div>
                    </div>
                  </div>

                  {showResultRecord.completed && showResultRecord.rewards?.shadowFragments && (
                    <div className="flex items-center gap-2 text-purple-300 col-span-2 border-t border-white/5 pt-2">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                      <div>
                        <div className="text-[9px] text-white/40">수집한 흔적</div>
                        <div className="font-bold text-xs">그림자 파편 +{showResultRecord.rewards.shadowFragments} 획득!</div>
                      </div>
                    </div>
                  )}

                  {showResultRecord.completed && showResultRecord.rewards?.extractionBonus && (
                    <div className="flex items-center gap-2 text-emerald-300 col-span-2 border-t border-white/5 pt-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-[9px] text-white/40">추출 공명 활성화</div>
                        <div className="font-bold text-xs">
                          해당 게이트의 그림자 추출 성공률 +{Math.round(showResultRecord.rewards.extractionBonus * 100)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {!showResultRecord.completed && showResultRecord.rewards?.instabilityAdded && (
                    <div className="flex items-center gap-2 text-rose-300 col-span-2 border-t border-white/5 pt-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="text-[9px] text-white/40">게이트 상태 동요</div>
                        <div className="font-bold text-xs">
                          내부 불안정 지수 +{showResultRecord.rewards.instabilityAdded} 누적
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status feedback message */}
              <div className="text-[10px] text-emerald-300/70 font-mono bg-emerald-950/10 border border-emerald-500/10 rounded p-3 text-left leading-relaxed">
                🎯 {showResultRecord.completed 
                  ? '집중 성공 결과가 오늘의 활동 지표 및 현실 준비도(Daily Progression)에 반영되어 내일의 능력치와 헌터 평가에 기여합니다.' 
                  : '집중이 미달성 마감되었습니다. 기존의 골드, 에센스, 그림자 등의 손실은 전혀 없으며, 언제든 다시 시도할 수 있습니다.'}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowResultRecord(null)}
                className="w-full py-3 rounded bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-ink-950 font-bold tracking-widest text-xs transition shadow-md"
              >
                집중 기록 적재
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
