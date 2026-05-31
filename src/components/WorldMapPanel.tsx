import { useState, useEffect } from 'react'
import {
  Globe,
  Lock,
  Eye,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  X,
  Swords,
  Shield,
  Zap,
  Trophy,
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
import { RIFT_REGIONS, RIFT_NODES } from '../lib/seed'
import { MONARCHS, FINAL_ANGEL } from '../lib/monarchs'
import { getRegionProgress, RIFT_NODE_STATUS_META } from '../lib/riftWorld'
import { getRegionTotalPower } from '../lib/livingWorld'
import { GatePanel } from './GatePanel'
import type { RiftNode, RiftRegion } from '../lib/types'
import { getHunterCombatPower } from '../lib/combatPower'
import { todayKey } from '../lib/game'
import { getRegionalTheme } from '../lib/livingWorldGateContent'
import { getHunterTrait } from '../lib/hunterTraits'


const REGION_FLAGS: Record<string, string> = {
  us: '🇺🇸',
  ca: '🇨🇦',
  mx: '🇲🇽',
  uk: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  it: '🇮🇹',
  cn: '🇨🇳',
  jp: '🇯🇵',
  kr: '🇰🇷',
  ru: '🇷🇺',
  in: '🇮🇳',
  br: '🇧🇷',
  au: '🇦🇺',
  eg: '🇪🇬',
}

function classifyEventLog(log: string) {
  const isAngel = log.includes('Angel') || log.includes('천사') || log.includes('지고의')
  const isMonarch = log.includes('군주') || log.includes('침공') || log.includes('거점')
  const isCollapse = log.includes('폭주') || log.includes('붕괴') || log.includes('위험')
  const isLoveCall = log.includes('러브콜') || log.includes('지원')
  const isCleared = log.includes('격퇴') || log.includes('정화') || log.includes('성공') || log.includes('완치')
  const isAlliance = log.includes('헌터') || log.includes('부상') || log.includes('퇴각') || log.includes('동맹')

  if (isAngel) {
    return {
      badge: '🏆 ULTIMATE',
      badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-glow-amber scale-95 origin-left shrink-0',
      textClass: 'text-amber-200 font-extrabold shadow-glow-amber/5'
    }
  }
  if (isMonarch) {
    return {
      badge: '🚨 CRITICAL',
      badgeClass: 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse font-black scale-95 origin-left shrink-0',
      textClass: 'text-red-400 font-black animate-pulse'
    }
  }
  if (isCollapse) {
    return {
      badge: '💥 COLLAPSE',
      badgeClass: 'bg-orange-500/10 border-orange-500/30 text-orange-400 scale-95 origin-left shrink-0',
      textClass: 'text-orange-400 font-bold'
    }
  }
  if (isLoveCall) {
    return {
      badge: '📞 LOVE CALL',
      badgeClass: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300 scale-95 origin-left shrink-0',
      textClass: 'text-yellow-300'
    }
  }
  if (isCleared) {
    return {
      badge: '🛡️ CLEARED',
      badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 scale-95 origin-left shrink-0',
      textClass: 'text-emerald-400 font-bold'
    }
  }
  if (isAlliance) {
    return {
      badge: '🤝 ALLIANCE',
      badgeClass: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 scale-95 origin-left shrink-0',
      textClass: 'text-cyan-300/90 font-medium'
    }
  }
  return {
    badge: '📡 SIGNAL',
    badgeClass: 'bg-zinc-800/20 border-zinc-700/20 text-zinc-400 scale-95 origin-left shrink-0',
    textClass: 'text-zinc-400/90'
  }
}

export function WorldMapPanel() {
  const riftNodesState = useGame((s) => s.riftNodes ?? {})
  const activeRiftNodeId = useGame((s) => s.activeRiftNodeId)
  const activeGate = useGame((s) => s.activeWorldGate)
  const discoverRiftNode = useGame((s) => s.discoverRiftNode)
  const enterRiftNode = useGame((s) => s.enterRiftNode)
  const livingWorld = useGame((s) => s.livingWorld)

  // L3 전용 신설 월드맵 상태 및 액션 연동
  const worldBattleRetreats = useGame((s) => s.worldBattleRetreats ?? {})
  const manualSession = useGame((s) => s.manualBattleSession)
  const startWorldManualBattle = useGame((s) => s.startWorldManualBattle)

  // 헌터 스펙 및 실효 CP 연동용 상태
  const hunter = useGame((s) => s.hunter)
  const items = useGame((s) => s.items)
  const equipment = useGame((s) => s.equipment)
  const ownedShadows = useGame((s) => s.ownedShadows ?? [])
  const equippedShadowIds = useGame((s) => s.equippedShadowIds ?? [])
  const activeConsumableEffects = useGame((s) => s.activeConsumableEffects ?? [])

  const equippedShadows = ownedShadows.filter((s) => equippedShadowIds.includes(s.instanceId))

  // 실효 CP (본체 + 장착 섀도우 CP 합산)
  const playerPower = getHunterCombatPower({
    hunter,
    items,
    equipment,
    ownedShadows,
    equippedShadowIds,
    activeConsumableEffects,
  })

  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(null)
  const [regionSortBy, setRegionSortBy] = useState<'danger' | 'purify' | 'name'>('danger')
  const [activeDetailRegion, setActiveDetailRegion] = useState<RiftRegion | null>(null)
  const [isAllLogsExpanded, setIsAllLogsExpanded] = useState(false)
  const [selectedNode, setSelectedNode] = useState<RiftNode | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [selectedHelpers, setSelectedHelpers] = useState<string[]>([])

  // [NEW] 통합 보고서 관련 상태 (일일 정세 / 국가별 상세 / 세계 헌터 랭킹)
  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'country' | 'hunter' | null>(null)
  const [selectedReportRegionId, setSelectedReportRegionId] = useState<string>('kr')
  const [selectedReportDay, setSelectedReportDay] = useState<number | null>(null)
  const [hunterRankingSubTab, setHunterRankingSubTab] = useState<'individual' | 'region'>('individual')

  const openReport = (tab: 'daily' | 'country' | 'hunter', regionId?: string) => {
    const summaries = livingWorld?.dailySummaries ?? []
    const maxSummaryDay = summaries.length > 0 ? summaries[summaries.length - 1].day : 0
    if (selectedReportDay === null || selectedReportDay === 0) {
      setSelectedReportDay(maxSummaryDay)
    }
    if (regionId) {
      setSelectedReportRegionId(regionId)
    }
    setActiveReportTab(tab)
  }

  const openDailyReport = () => {
    openReport('daily')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveReportTab(null)
      }
    }
    if (activeReportTab) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [activeReportTab])

  const worldNode = selectedNode ? livingWorld?.riftNodes[selectedNode.id] : null
  const hasLoveCall = worldNode?.loveCall?.active
  const loveCallState = worldNode?.loveCall

  const handleHelperToggle = (hid: string) => {
    if (selectedHelpers.includes(hid)) {
      setSelectedHelpers(selectedHelpers.filter(id => id !== hid))
    } else {
      setSelectedHelpers([...selectedHelpers, hid])
    }
  }

  const activeHelpers = selectedHelpers.map(hid => livingWorld?.namedHunters[hid]).filter(Boolean) as any[]
  const coopHelperCount = activeHelpers.length
  const coopHelperPower = activeHelpers.reduce((sum, h) => sum + h.power, 0)

  const coopBuffs = {
    atk: Math.round(COOP_HELP_ATK_FACTOR * coopHelperPower),
    def: Math.round(COOP_HELP_DEF_FACTOR * coopHelperPower),
    dr: Math.min(COOP_HELP_DR_CAP, COOP_HELP_DR_FACTOR * coopHelperCount),
    rewardRatio: Math.max(COOP_REWARD_MIN_RATIO, 1 - COOP_REWARD_PENALTY_PER_HELPER * coopHelperCount)
  }

  // 로컬 확인 모달 제어용 상태
  const [showRecklessConfirm, setShowRecklessConfirm] = useState(false)
  const [recklessConfirmType, setRecklessConfirmType] = useState<'auto' | 'manual'>('auto')
  // 1. selectedNode 유효성 검증 (존재하지 않는 노드 정리)
  useEffect(() => {
    if (selectedNode) {
      if (selectedNode.id === 'angel') {
        if (!livingWorld?.angelReady) {
          setSelectedNode(null)
          setSelectedHelpers([])
        }
      } else if (livingWorld?.activeMonarchs?.some((m: any) => m.monarchId === selectedNode.id && m.status === 'rampaging')) {
        // 활성(rampaging) 군주는 riftNodes가 아닌 activeMonarchs에 존재 → 유효한 선택으로 인정
      } else {
        const exists = livingWorld?.riftNodes[selectedNode.id]
        if (!exists) {
          setSelectedNode(null)
          setSelectedHelpers([])
        }
      }
    }
  }, [selectedNode, livingWorld])

  // 2. 세계 시드 변경(=새 회차/리셋) 감지 시 로컬 상태 초기화
  useEffect(() => {
    setSelectedNode(null)
    setSelectedHelpers([])
    setShowRecklessConfirm(false)
  }, [livingWorld?.seed])

  // 3. activeRiftNodeId가 undefined로 정리되면 selectedNode도 로컬 상태에서 닫아줌
  useEffect(() => {
    if (!activeRiftNodeId) {
      setSelectedNode(null)
      setSelectedHelpers([])
    }
  }, [activeRiftNodeId])

  // 토스트 메시지 도우미
  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const handleNodeClick = (node: any) => {
    const status = riftNodesState[node.id] ?? node.status

    if (status === 'undiscovered') {
      discoverRiftNode(node.id)
      triggerToast(`[${node.name}] 탐사를 시작하여 구역을 개방했습니다!`)
      setSelectedNode({ ...node, status: 'active' })
      setSelectedHelpers([])
    } else if (status === 'locked') {
      // 선행 조건 설명 취합
      const reqNames = (node.requiresNodeIds ?? [])
        .map((reqId: string) => RIFT_NODES.find((rn: any) => rn.id === reqId)?.name ?? reqId)
        .join(', ')
      triggerToast(`🔒 이 구역은 잠겨있습니다. 선행 정화 필요: [${reqNames}]`)
    } else {
      // active 또는 cleared
      setSelectedNode(node)
      const worldNode = livingWorld?.riftNodes[node.id]
      if (worldNode?.loveCall?.active) {
        setSelectedHelpers(worldNode.loveCall.helperHunterIds ?? [])
      } else {
        setSelectedHelpers([])
      }
    }
  }

  // 현재 노드의 활성 게이트가 켜져 있는지 여부 (기존 E/D/C 일반 게이트 및 동적 스폰/러브콜 게이트 포함)
  const isGateActive =
    activeGate &&
    activeGate.status === 'active' &&
    activeRiftNodeId &&
    (
      RIFT_NODES.some((rn: any) => rn.id === activeRiftNodeId) || 
      MONARCHS.some((m) => m.id === activeRiftNodeId) || 
      activeRiftNodeId === 'angel' ||
      Boolean(livingWorld?.riftNodes[activeRiftNodeId])
    ) &&
    (!manualSession || manualSession.source !== 'world_map')

  // 위험도 계산 함수 (0.6 미만 시 무모, recommendedPower 이상 시 안전, 그 사이 위험)
  const getDangerLevel = (node: RiftNode) => {
    const difficulty = node.difficulty ?? 500
    if (playerPower >= difficulty) return 'safe'
    if (playerPower >= difficulty * 0.6) return 'danger'
    return 'reckless'
  }

  // 당일 후퇴 가드 여부
  const isNodeRetreatedToday = (nodeId: string) => {
    return worldBattleRetreats[nodeId] === todayKey()
  }

  // 국가 정렬 연산
  const sortedRegions = [...RIFT_REGIONS].sort((a, b) => {
    if (regionSortBy === 'name') {
      return a.name.localeCompare(b.name, 'ko')
    }
    const progA = getRegionProgress(a.id, riftNodesState)
    const progB = getRegionProgress(b.id, riftNodesState)
    const stateA = livingWorld?.regions[a.id]
    const stateB = livingWorld?.regions[b.id]

    if (regionSortBy === 'purify') {
      return progB.percent - progA.percent
    }

    // danger (위험도 / 오염도 높은 순)
    const isMonarchA = livingWorld?.activeMonarchs?.some(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(a.id)) ? 1 : 0
    const isMonarchB = livingWorld?.activeMonarchs?.some(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(b.id)) ? 1 : 0
    if (isMonarchA !== isMonarchB) return isMonarchB - isMonarchA

    const hasLcA = Object.values(livingWorld?.riftNodes ?? {}).some((node: any) => node.regionId === a.id && node.loveCall?.active && (riftNodesState[node.id] ?? node.status) === 'active') ? 1 : 0
    const hasLcB = Object.values(livingWorld?.riftNodes ?? {}).some((node: any) => node.regionId === b.id && node.loveCall?.active && (riftNodesState[node.id] ?? node.status) === 'active') ? 1 : 0
    if (hasLcA !== hasLcB) return hasLcB - hasLcA

    const corrA = stateA?.corruption ?? 0
    const corrB = stateB?.corruption ?? 0
    return corrB - corrA
  })

  return (
    <div className="space-y-6 relative">
      {/* 진엔딩 오버레이 (True Ending Overlay) */}
      {livingWorld?.endingState === 'victory' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-lg overflow-y-auto p-4 py-8">
          <div className="panel corner-bracket border-amber-500/50 bg-ink-950/90 p-8 max-w-2xl w-full shadow-glow-amber animate-scale-in text-center space-y-6">
            <div className="br" />
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-amber-500/10 border border-amber-500/40 p-4 shadow-glow-amber animate-pulse">
                <Trophy className="h-10 w-10 text-amber-400 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-amber-300 tracking-widest mt-4 uppercase">
                🏆 세계의 위대한 구원자
              </h3>
              <div className="text-[10px] text-amber-400 font-mono tracking-widest font-black uppercase">
                True Ending: Dawn of Dimensional Peace
              </div>
            </div>

            <p className="text-sm text-white/80 leading-relaxed max-w-xl mx-auto border-t border-b border-white/5 py-6">
              인류 역사상 가장 거대했던 차원의 위기가 마침내 막을 내렸습니다.<br/>
              당신은 심연에서 강림한 8명의 파괴적인 군주들을 모두 물리치고,<br/>
              마지막으로 강림한 <strong>지고의 심판자(천사)</strong>마저 격퇴하여 대균열의 근원을 완벽히 정화했습니다.<br/>
              <br/>
              당신의 흔들리지 않는 의지와 위대한 그림자 군단, 그리고 전 세계 연대 헌터들의 동맹은<br/>
              멸망의 운명에 쓰러져가던 인류를 구원하고 찬란한 평화의 새벽을 가져왔습니다.<br/>
              세계의 역사는 영원히 당신의 구원을 기억할 것입니다.
            </p>

            {/* 이번 회차 기록 브리핑 */}
            <div className="space-y-3 text-xs max-w-md mx-auto">
              <div className="text-left font-bold text-white/50 text-[10px] tracking-widest uppercase mb-1">
                📊 이번 차원 회차 요약 기록
              </div>
              <div className="grid grid-cols-2 gap-2 font-medium">
                <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                  <span>차원 시드(Seed)</span>
                  <span className="font-bold text-cyan-300">#{livingWorld.seed}</span>
                </div>
                <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                  <span>생존/정화 일수</span>
                  <span className="font-bold text-amber-300">{livingWorld.day}일</span>
                </div>
                <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                  <span>격퇴한 군주</span>
                  <span className="font-bold text-red-400">8 / 8 (완성)</span>
                </div>
                <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                  <span>연대 협력 횟수</span>
                  <span className="font-bold text-purple-300">{livingWorld.coopCount ?? 0}회</span>
                </div>
                <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                  <span>최종 헌터 레벨</span>
                  <span className="font-bold text-emerald-300">Lv.{hunter.level}</span>
                </div>
                <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                  <span>복속된 그림자</span>
                  <span className="font-bold text-purple-300">{ownedShadows.length}명</span>
                </div>
              </div>
              
              {/* 이전 총 구원 횟수 */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-[11px] text-amber-200/90 font-bold flex justify-between items-center font-black">
                <span>✨ 누적 세계 구원 횟수</span>
                <span className="text-amber-300 text-sm font-black animate-pulse">
                  {(useGame.getState().hardcoreState?.victoryCount ?? 0) + 1}회째 구원 완료
                </span>
              </div>
            </div>

            <div className="pt-4 max-w-sm mx-auto">
              <button
                onClick={() => {
                  useGame.getState().triggerVictoryReset()
                  triggerToast("🌌 차원 이동 완료: 새로운 차원의 세계로 강림했습니다!")
                }}
                className="btn btn-primary w-full py-3.5 text-xs font-black tracking-widest text-center cursor-pointer shadow-glow-amber border border-amber-500/50 hover:bg-amber-500/25 hover:text-white transition-all duration-300"
              >
                새로운 세계로 차원 이동 (다음 회차 진행)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 균열 상태 토스트 안내 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-purple-500/30 bg-ink-950 px-4 py-3 text-sm text-purple-200 shadow-glow-purple">
          <AlertCircle className="h-4 w-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 무모(Reckless) 진입 확인 모달 */}
      {showRecklessConfirm && selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="panel corner-bracket border-rose-500/40 bg-ink-950 p-6 max-w-md w-full mx-4 shadow-glow-red animate-scale-in">
            <div className="br" />
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="h-6 w-6 animate-pulse" />
              <h4 className="text-lg font-black tracking-wider">⚠️ 위험 경고: 무모한 진입</h4>
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              이 균열 구역의 권장 전투력은 <span className="text-pink-300 font-bold">{(selectedNode.difficulty ?? 500).toLocaleString()} CP</span>이나, 현재 헌터의 실효 전투력은 <span className="text-rose-400 font-bold">{playerPower.toLocaleString()} CP</span>로 60% 미만입니다.
            </p>
            <div className="mt-3 rounded border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300/80 leading-normal">
              정화 도중 일반 몬스터에게 일격에 즉사할 위험이 매우 높습니다! 정화 전선에 진입하기 전에 장착 그림자를 추가하거나 장비를 강화하는 것을 권장합니다.
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRecklessConfirm(false)}
                className="rounded border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white/70 transition-all cursor-pointer"
              >
                돌아가기 (취소)
              </button>
              <button
                onClick={() => {
                  setShowRecklessConfirm(false)
                  startWorldManualBattle(selectedNode.id, selectedHelpers)
                }}
                className="rounded border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/25 px-4 py-2 text-xs font-bold text-rose-200 shadow-glow-red hover:text-white transition-all cursor-pointer"
              >
                강행 진입
              </button>
            </div>
          </div>
        </div>
      )}



      {/* 수동 전투 모드 (전체 오버레이 형태로 GatePanel을 렌더링) */}
      {manualSession && manualSession.source === 'world_map' && (() => {
        const isMonarchSession = MONARCHS.some(m => m.id === manualSession.gateId) || manualSession.gateId === 'angel'
        const monarchData = manualSession.gateId === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === manualSession.gateId)
        
        return (
          <div className="fixed inset-0 z-[90] bg-ink-950 overflow-y-auto p-4 sm:p-6 md:p-8 animate-fade-in scrollbar-thin">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-purple-400">
                  <Swords className="h-5 w-5" />
                  <span className="text-sm font-black tracking-widest text-red-400">
                    {isMonarchSession ? '👑 군주 토벌 작전 개시' : '수동 정화 전투 개시'}
                  </span>
                </div>
                <span className={`rounded px-2.5 py-0.5 text-[10px] font-bold border ${
                  isMonarchSession 
                    ? 'bg-red-500/25 text-red-200 border-red-500/30' 
                    : 'bg-purple-500/25 text-purple-200 border-purple-400/20'
                }`}>
                  {manualSession.gateName}
                </span>
              </div>

              {/* 군주 토벌 전용 상단 서사 보드 */}
              {isMonarchSession && monarchData && (
                <div className="panel corner-bracket border-red-500/40 bg-red-950/15 p-4 space-y-2.5 shadow-glow-red">
                  <div className="br" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-red-400 uppercase tracking-widest">
                      🚨 BOSS IDENTIFIED: {monarchData.rank === 0 ? 'SPECIAL' : `서열 ${monarchData.rank}위`}
                    </span>
                    <span className="font-bold text-pink-300">
                      권장 전투력: {monarchData.recommendedCP.toLocaleString()} CP
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white">{monarchData.name}</h3>
                  <div className="text-xs text-white/70 bg-black/40 rounded p-2.5 border border-white/5 leading-relaxed">
                    <p className="font-semibold text-rose-300 mb-1">Concept: {monarchData.concept}</p>
                    <p className="text-white/60">
                      심연의 군주가 세계를 잠식하고 있습니다. 격렬한 어둠의 기운으로 인해 일반적인 방어력으로는 즉사를 피할 수 없습니다. 그림자 군단의 강력한 수호 장벽 보호가 필수적입니다.
                    </p>
                  </div>
                  
                  {/* 그림자 탱킹 작동 안내 */}
                  <div className="rounded border border-cyan-500/20 bg-cyan-950/10 p-3 text-xs text-cyan-200 flex items-start gap-2.5 leading-relaxed shadow-glow-blue">
                    <Shield className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block text-cyan-300">🛡️ [그림자 탱킹 완성형 장막 활성화]</span>
                      <span className="text-white/70 block mt-0.5 text-[11px]">
                        장착된 그림자 수에 비례하여 방어력 <span className="font-bold text-cyan-200">고정 +{(5000 + 2000 * equippedShadows.length).toLocaleString()}</span> 가산, 회피율 <span className="font-bold text-cyan-200">+{Math.round((0.40 + 0.05 * equippedShadows.length) * 100)}%</span> 상승, 대미지 감쇄가 즉각 적용되어 군주의 즉사 대미지를 무력화합니다.
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 그림자 장착 정보 표시 (일반 전투용) */}
              {!isMonarchSession && equippedShadows.length > 0 && (
                <div className="rounded border border-purple-500/20 bg-purple-500/5 p-3 flex flex-wrap gap-2 items-center text-xs">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span className="text-white/60 font-medium">🛡️ 그림자 탱킹 작동 중:</span>
                  {equippedShadows.map(shadow => (
                    <span key={shadow.instanceId} className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300 font-bold border border-purple-500/10">
                      {shadow.name} (Lv.{shadow.level})
                    </span>
                  ))}
                </div>
              )}

              <div className="bg-ink-900 rounded-xl border border-white/10 p-2 sm:p-4">
                <GatePanel isWorldMapContext={true} />
              </div>
            </div>
          </div>
        )
      })()}

      {/* 헤더 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-purple-300">
            <Globe className="h-6 w-6" />
            <h2 className="text-xl font-black tracking-wider">살아있는 균열 세계</h2>
          </div>
          <p className="mt-1 text-xs text-white/55">
            세계 곳곳의 차원 틈새를 조사하고 균열을 정화하여 차원 평화를 유지하십시오.
          </p>
        </div>
      </div>

      {/* 지고의 심판자(천사) 최종전 진입 배너 */}
      {livingWorld && livingWorld.angelReady && livingWorld.endingState !== 'victory' && (
        <div className="panel corner-bracket border-amber-500 bg-purple-950/25 p-5 shadow-glow-amber flex flex-col md:flex-row items-center justify-between gap-5 mb-6 animate-pulse">
          <div className="br" />
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <h3 className="text-base font-black text-amber-300 tracking-wider">🌟 지고의 심판자 강림 (최종 결전)</h3>
              <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
                모든 심연의 군주(8명)가 퇴치되어 차원의 기둥이 무너지고 <strong>지고의 심판자(천사)</strong>가 전역 강림했습니다!<br/>
                인류의 명운을 건 마지막 격퇴전을 준비하십시오. 이 승리는 차원의 영원한 구원을 의미합니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedNode({
                id: 'angel',
                regionId: 'kr',
                name: FINAL_ANGEL.name,
                x: 50,
                y: 50,
                status: 'active',
                gateDefId: 'angel',
                difficultyRank: 'S',
                difficulty: FINAL_ANGEL.recommendedCP,
                deadline: 999,
                daysRemaining: 999,
                isSGrade: true
              })
              setSelectedHelpers([])
            }}
            className="rounded border border-amber-500/50 bg-amber-500/20 hover:bg-amber-500/35 px-5 py-3 text-xs font-black text-white tracking-widest transition-all cursor-pointer shadow-glow-amber whitespace-nowrap flex items-center gap-1.5 shrink-0"
          >
            <Swords className="h-4 w-4 text-amber-300" /> 최종 결전 준비
          </button>
        </div>
      )}

      {/* 거점 침공 비상 경고 배너 */}
      {livingWorld && livingWorld.homeReachedMonarchId && (() => {
        const monarchId = livingWorld.homeReachedMonarchId
        const mData = MONARCHS.find(m => m.id === monarchId) || FINAL_ANGEL
        return (
          <div className="panel corner-bracket border-red-500 bg-red-950/25 p-5 shadow-glow-red animate-pulse flex flex-col md:flex-row items-center justify-between gap-5 mb-6">
            <div className="br" />
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500 animate-bounce shrink-0" />
              <div>
                <h3 className="text-base font-black text-red-400 tracking-wider">🚨 초비상: 거점 군주 침공</h3>
                <p className="text-xs text-red-200/80 mt-1 leading-relaxed">
                  군주 <span className="font-extrabold text-white">[{mData.name}]</span>이(가) 대한민국의 방어선을 돌파하고 거점에 진입했습니다! 즉각 대응하지 않으면 세계가 멸망합니다.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => {
                  if (playerPower < mData.recommendedCP * 0.6) {
                    setSelectedNode({
                      id: monarchId,
                      regionId: 'kr',
                      name: mData.name,
                      x: 50,
                      y: 50,
                      status: 'active',
                      gateDefId: monarchId,
                      difficultyRank: 'S',
                      difficulty: mData.recommendedCP,
                      deadline: 999,
                      daysRemaining: 999,
                      isSGrade: true
                    })
                    setRecklessConfirmType('manual')
                    setShowRecklessConfirm(true)
                  } else {
                    startWorldManualBattle(monarchId, [])
                  }
                }}
                className="rounded border border-cyan-500/50 bg-cyan-950/20 hover:bg-cyan-500/35 px-4 py-2.5 text-xs font-black text-cyan-200 tracking-widest transition-all cursor-pointer shadow-glow-blue whitespace-nowrap flex items-center gap-1.5"
              >
                <Zap className="h-4 w-4 text-cyan-400" /> 수동 격퇴 개시
              </button>
            </div>
          </div>
        )
      })()}

      {/* MVP-2 World Status Dashboard */}
      {livingWorld && (
        <div className="grid gap-4 md:grid-cols-4 animate-fade-in">
          {/* Box 1: World Corruption and Monarchs */}
          <div className="panel corner-bracket border-purple-500/20 bg-ink-950/40 p-4 flex flex-col justify-between">
            <div className="br" />
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-white/70">
                <span className="flex items-center gap-1.5 text-purple-300">
                  <AlertCircle className="h-4 w-4" /> 전역 오염도 및 침공
                </span>
                <span className="text-[10px] text-white/40">Day {livingWorld.day}</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div className="text-2xl font-black text-red-400 tracking-tight">
                  {livingWorld.worldCorruption}%
                </div>
                {livingWorld.monarchsAppeared > 0 ? (
                  <span className="rounded bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[9px] font-black text-red-300 tracking-wider animate-pulse">
                    🔥 군주 {livingWorld.monarchsAppeared}명 침공 중
                  </span>
                ) : (
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                    평화로움 (군주 0)
                  </span>
                )}
              </div>
              <div className="mt-2.5 h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 bg-gradient-to-r ${
                    livingWorld.worldCorruption >= 70 ? 'from-orange-500 to-red-500' :
                    livingWorld.worldCorruption >= 30 ? 'from-yellow-400 to-orange-500' :
                    'from-cyan-400 to-emerald-400'
                  }`}
                  style={{ width: `${livingWorld.worldCorruption}%` }}
                />
              </div>
            </div>
            <p className="mt-3 text-[10px] text-white/40 leading-normal">
              오염도가 40%, 60%, 78%, 92%, 99%를 초과할 때마다 더 강력한 군주가 강림합니다.
            </p>
          </div>

          {/* Box 2: Incident Logs Terminal (WORLD SIGNAL LOG) */}
          <div className="panel corner-bracket border-white/10 bg-ink-950/40 p-4 md:col-span-2 flex flex-col justify-between min-h-[174px]">
            <div className="br" />
            <div className="flex items-center justify-between text-xs font-bold text-white/70 mb-2.5">
              <span className="text-cyan-300 flex items-center gap-1.5 font-bold tracking-wider uppercase">
                <Swords className="h-4 w-4" /> 📡 WORLD SIGNAL LOG
              </span>
              <div className="flex items-center gap-2 scale-90 sm:scale-100 origin-right">
                <button
                  onClick={openDailyReport}
                  className="rounded border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/25 px-2.5 py-0.5 text-[9px] font-black text-emerald-200 transition-all cursor-pointer flex items-center gap-1"
                >
                  📊 일일 보고서
                </button>
                <button
                  onClick={() => setIsAllLogsExpanded(!isAllLogsExpanded)}
                  className="rounded border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/25 px-2 py-0.5 text-[9px] font-black text-cyan-200 transition-all cursor-pointer"
                >
                  {isAllLogsExpanded ? '▲ 요약 접기' : `▼ 모든 로그 (${livingWorld.eventLogs.length})`}
                </button>
                <button
                  onClick={() => {
                    useGame.getState().debugAdvanceLivingWorldDay()
                    triggerToast("🔮 차원의 시간이 하루 흘렀습니다. 세계가 스스로 1틱 시뮬레이션되었습니다.")
                  }}
                  className="rounded-md border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/25 px-2 py-0.5 text-[9px] font-black text-purple-200 transition-all cursor-pointer"
                >
                  ⏩ 1일 시뮬레이션
                </button>
              </div>
            </div>
            
            <div className="flex-1 rounded bg-black/45 border border-white/5 p-2 scrollbar-thin">
              {(() => {
                const displayedLogs = isAllLogsExpanded 
                  ? livingWorld.eventLogs.slice().reverse() 
                  : livingWorld.eventLogs.slice().reverse().slice(0, 4)

                if (displayedLogs.length === 0) {
                  return (
                    <div className="text-zinc-500 italic py-6 text-center text-xs">
                      📡 현재 세계 전선은 일시적으로 고요합니다.
                    </div>
                  )
                }

                return (
                  <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
                    {displayedLogs.map((log, idx) => {
                      const style = classifyEventLog(log)
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs border-b border-white/5 pb-1 leading-normal transition-all hover:bg-white/5 p-1 rounded">
                          <span className={`chip shrink-0 scale-90 ${style.badgeClass}`} style={{ fontSize: '7.5px', padding: '0.05rem 0.25rem' }}>
                            {style.badge}
                          </span>
                          <span className={`flex-1 font-mono text-[10px] break-all ${style.textClass}`}>
                            {log}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Box 3: Monarchs Status Briefing */}
          <div className="panel corner-bracket border-red-500/25 bg-ink-950/40 p-4 flex flex-col justify-between">
            <div className="br" />
            <div>
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 mb-2.5 font-bold">
                👑 군주 침공 전황 분석
              </span>
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-red-500/20">
                {!livingWorld.activeMonarchs || livingWorld.activeMonarchs.length === 0 ? (
                  <div className="text-[10px] text-white/40 italic py-5 text-center">
                    현재 강림한 군주가 없습니다.
                  </div>
                ) : (
                  livingWorld.activeMonarchs.map((monarch: any) => {
                    const mData = MONARCHS.find(m => m.id === monarch.monarchId)
                    if (!mData) return null
                    const isRampaging = monarch.status === 'rampaging'
                    return (
                      <div
                        key={monarch.monarchId}
                        onClick={() => {
                          if (isRampaging) {
                            const monarchRegionId = monarch.occupiedRegionIds[0] || 'kr'
                            handleNodeClick({
                              id: monarch.monarchId,
                              regionId: monarchRegionId,
                              name: mData.name,
                              x: 50,
                              y: 50,
                              status: 'active',
                              gateDefId: monarch.monarchId,
                              difficultyRank: 'S',
                              difficulty: mData.recommendedCP,
                              deadline: 999,
                              daysRemaining: 999,
                              isSGrade: true
                            })
                          }
                        }}
                        className={`rounded bg-black/35 border p-1.5 flex items-center justify-between text-[10px] transition-all ${
                          isRampaging 
                            ? 'border-red-500/30 hover:border-red-500 hover:bg-red-950/20 cursor-pointer' 
                            : 'border-white/5 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-white/80">{mData.name}</span>
                          <span className="text-[8px] text-white/40 font-mono">서열 {mData.rank}위 | {mData.theme}</span>
                        </div>
                        <div className="text-right">
                          {isRampaging ? (
                            <span className="rounded bg-red-500/15 border border-red-500/25 px-1 py-0.5 text-[8px] font-black text-red-300">
                              {monarch.occupiedRegionIds.length}개국 점령
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 text-[8px] font-bold text-emerald-400 font-mono">
                              격퇴됨
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            <p className="mt-2 text-[8px] text-white/40 leading-normal">
              출현 군주는 3일마다 인접국을 잠식하며, 거점(한국) 도달 시 즉시 강제 전투가 발동됩니다.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 국가 진행도 목록 */}
        <div className="space-y-3 lg:col-span-1">
          {/* 세계 지원 요청 (Rift Help Desk) */}
          <div className="panel corner-bracket border-amber-500/20 bg-ink-950/40 p-4">
            <div className="br" />
            <h3 className="mb-3 text-sm font-bold text-amber-400 flex items-center gap-1.5 font-bold">
              📞 세계 지원 요청 (Love Calls)
            </h3>
            
            {(() => {
              const activeLoveCalls = Object.values(livingWorld?.riftNodes ?? {})
                .filter((node: any) => node.loveCall?.active && (riftNodesState[node.id] ?? node.status) === 'active')

              if (activeLoveCalls.length === 0) {
                return (
                  <div className="rounded border border-white/5 bg-ink-950/20 p-4 text-center text-white/35 text-xs py-6">
                    <Globe className="mx-auto mb-2 h-6 w-6 text-white/15 animate-pulse" />
                    <p className="font-medium text-white/50 leading-relaxed">
                      현재 세계는 아직 당신을 직접 부르지 않습니다.
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      대한민국 전선을 지키고 감시해 주십시오.
                    </p>
                  </div>
                )
              }

              return (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-500/10">
                  {activeLoveCalls.map((node: any) => {
                    const rName = RIFT_REGIONS.find((r) => r.id === node.regionId)?.name ?? node.regionId.toUpperCase()
                    const flag = REGION_FLAGS[node.regionId] || '🌐'
                    const loveCall = node.loveCall
                    if (!loveCall) return null
                    
                    // CP 비교 지표 계산
                    let cpLabel = '진입 무모'
                    let cpColorBadge = 'bg-red-500/10 border-red-500/20 text-red-400'
                    if (playerPower >= node.difficulty) {
                      cpLabel = '안전'
                      cpColorBadge = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    } else if (playerPower >= node.difficulty * 0.7) {
                      cpLabel = '위험'
                      cpColorBadge = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                    }

                    // S급 Named 헌터들 실명 취합
                    const helpersNameList = loveCall.helperHunterIds
                      .map((hid: string) => livingWorld?.namedHunters[hid]?.name)
                      .filter(Boolean)
                      .join(', ')

                    return (
                      <div
                        key={node.id}
                        className="rounded border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10 p-3 transition-all space-y-2 relative shadow-glow-amber/5"
                      >
                        {/* 헤더 */}
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] text-amber-300 flex items-center gap-1">
                            {flag} {rName} 협회
                          </span>
                          <div className="flex gap-1.5 items-center">
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-black text-amber-200 border border-amber-400/20 uppercase tracking-widest animate-pulse">
                              {node.difficultyRank}급
                            </span>
                            <span className={`rounded border px-1.5 py-0.5 text-[8px] font-bold ${
                              (node.daysRemaining ?? 0) <= 2 ? 'bg-red-500/20 border-red-500/30 text-red-300 animate-pulse' : 'bg-black/30 border-white/5 text-yellow-300'
                            }`}>
                              D-{node.daysRemaining}
                            </span>
                          </div>
                        </div>

                        {/* 게이트 이름 & CP */}
                        <div>
                          <div className="font-bold text-xs text-white/95 truncate">
                            {node.name}
                          </div>
                          <div className="flex justify-between items-center text-[10px] mt-1 bg-black/35 rounded px-2 py-1">
                            <div className="flex items-center gap-1">
                              <span className="text-white/40">권장:</span>
                              <span className="font-bold text-white/80 font-mono text-[9px]">
                                {node.difficulty?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-white/40">내 CP:</span>
                              <span className="font-bold text-white/80 font-mono text-[9px]">
                                {playerPower?.toLocaleString()}
                              </span>
                            </div>
                            <span className={`rounded border px-1 py-0.2 text-[8px] font-black tracking-tighter ${cpColorBadge}`}>
                              {cpLabel}
                            </span>
                          </div>
                        </div>

                        {/* 짧은 서사 요약 */}
                        {(() => {
                          const nodeTheme = getRegionalTheme(node.subRegionId || node.regionId)
                          return (
                            <p className="text-[9.5px] text-white/50 leading-relaxed italic bg-black/20 rounded p-1.5 border border-white/5">
                              "{nodeTheme.loveCallNarrative}"
                            </p>
                          )
                        })()}

                        {/* 협력 헌터 목록 */}
                        {helpersNameList ? (
                          <div className="text-[9px] text-white/60 bg-black/20 rounded p-1.5 border border-white/5">
                            <span className="font-bold text-amber-300/80">🤝 공조: </span>
                            <span className="font-medium text-white/70 italic">{helpersNameList}</span>
                          </div>
                        ) : null}

                        {/* 약속 보상 */}
                        <div className="flex items-center justify-between text-[9px] bg-black/40 rounded px-2 py-1 border border-white/5 font-mono">
                          <span className="text-white/40 font-sans">보상:</span>
                          <span className="font-bold text-amber-400">+{loveCall.promisedReward.gold}G</span>
                          <span className="font-bold text-purple-400">+{loveCall.promisedReward.shadowEssence}정수</span>
                          <span className="font-bold text-emerald-400">+{loveCall.promisedReward.hunterXp}XP</span>
                        </div>

                        {/* 조작 버튼 */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            onClick={() => handleNodeClick(node)}
                            className="rounded border border-white/10 bg-black/25 hover:bg-black/60 px-2 py-1 text-[9px] font-bold text-white/70 transition-all cursor-pointer text-center"
                          >
                            📍 지도 확인
                          </button>
                          <button
                            onClick={() => {
                              setSelectedNode(node)
                              setSelectedHelpers(loveCall.helperHunterIds ?? [])
                              
                              const level = getDangerLevel(node)
                              if (level === 'reckless') {
                                setRecklessConfirmType('manual')
                                setShowRecklessConfirm(true)
                              } else {
                                startWorldManualBattle(node.id, loveCall.helperHunterIds ?? [])
                              }
                            }}
                            className="rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 hover:border-amber-400 px-2 py-1 text-[9px] font-black text-amber-200 transition-all cursor-pointer text-center flex items-center justify-center gap-1 shadow-md shadow-amber-950/20"
                          >
                            ⚔️ 원정 수락
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          <div className="panel corner-bracket border-white/10 bg-ink-950/40 p-4">
            <div className="br" />
            
            {/* 정렬 토글 바 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-black text-white/80 tracking-wider">🌐 WORLD PURIFICATION GRID</h3>
              <div className="flex bg-black/45 rounded-md p-0.5 border border-white/5 text-[9px] font-bold">
                <button
                  onClick={() => setRegionSortBy('danger')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${regionSortBy === 'danger' ? 'bg-red-500/20 text-red-300 font-extrabold border border-red-500/30' : 'text-white/50 border border-transparent'}`}
                >
                  🚨 위험도순
                </button>
                <button
                  onClick={() => setRegionSortBy('purify')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${regionSortBy === 'purify' ? 'bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/30' : 'text-white/50 border border-transparent'}`}
                >
                  🛡️ 정화도순
                </button>
                <button
                  onClick={() => setRegionSortBy('name')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${regionSortBy === 'name' ? 'bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-500/30' : 'text-white/50 border border-transparent'}`}
                >
                  🌐 국가명순
                </button>
              </div>
            </div>

            {/* 국가 카드 반응형 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sortedRegions.map((region: RiftRegion) => {
                const prog = getRegionProgress(region.id, riftNodesState)
                const regionState = livingWorld?.regions[region.id]
                const flag = REGION_FLAGS[region.id] || '🌐'
                const occupiedMonarch = livingWorld?.activeMonarchs?.find(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(region.id))
                const hasLoveCall = Object.values(livingWorld?.riftNodes ?? {}).some((node: any) => node.regionId === region.id && node.loveCall?.active && (riftNodesState[node.id] ?? node.status) === 'active')

                return (
                  <div
                    key={region.id}
                    onClick={() => openReport('country', region.id)}
                    className={`rounded-lg border p-2 transition-all duration-300 hover:bg-white/5 cursor-pointer flex flex-col justify-between h-[82px] select-none ${
                      occupiedMonarch 
                        ? 'border-red-500 bg-red-950/20 shadow-glow-red animate-pulse text-red-300' 
                        : hasLoveCall 
                          ? 'border-amber-400/40 bg-amber-950/10 text-amber-200' 
                          : region.id === 'kr'
                            ? 'border-sky-500/40 bg-sky-950/10 text-sky-200 shadow-glow-blue/5'
                            : 'border-white/5 bg-ink-950/30 text-white/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 overflow-hidden">
                      <span className="font-extrabold text-[10px] truncate flex items-center gap-1">
                        <span>{flag}</span>
                        <span className="truncate">{region.name}</span>
                      </span>
                      <div className="flex gap-0.5 shrink-0 scale-90 origin-right">
                        {region.id === 'kr' && (
                          <span className="rounded bg-sky-500/25 px-1 py-0.2 text-[6.5px] font-black text-sky-300 border border-sky-500/30 uppercase tracking-tighter">
                            거점
                          </span>
                        )}
                        {occupiedMonarch && (
                          <span className="rounded bg-red-500/25 px-1 py-0.2 text-[6.5px] font-black text-red-200 border border-red-500/30 uppercase tracking-tighter animate-pulse">
                            🚨침공
                          </span>
                        )}
                        {hasLoveCall && (
                          <span className="rounded bg-amber-500/25 px-1 py-0.2 text-[6.5px] font-black text-amber-300 border border-amber-500/30 uppercase tracking-tighter">
                            📞콜
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-1 flex items-end justify-between leading-none">
                      <div className="flex flex-col">
                        <span className="text-[7.5px] text-white/30 font-bold uppercase tracking-tighter">오염도</span>
                        <span className={`font-mono text-xs font-black ${
                          occupiedMonarch ? 'text-red-400' :
                          regionState && regionState.corruption >= 50 ? 'text-orange-400 font-black animate-pulse' :
                          regionState && regionState.corruption >= 20 ? 'text-yellow-300 font-bold' :
                          'text-emerald-400 font-bold'
                        }`}>
                          {regionState ? `${regionState.corruption}%` : '0%'}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[7.5px] text-white/30 font-bold uppercase tracking-tighter">정화도</span>
                        <span className="font-mono text-xs font-black text-purple-300">
                          {prog.percent}%
                        </span>
                      </div>
                    </div>

                    {/* 얇은 게이지 바 */}
                    <div className="mt-1 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 bg-gradient-to-r ${
                          occupiedMonarch ? 'from-red-500 to-rose-600' : 'from-purple-500 to-cyan-400'
                        }`}
                        style={{ width: `${prog.percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>



          {/* 구역 요약 상세 패널 */}
          {selectedNode ? (() => {
            const isMonarchNode = MONARCHS.some(m => m.id === selectedNode.id) || selectedNode.id === 'angel'
            const monarchData = selectedNode.id === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === selectedNode.id)

            if (isMonarchNode && monarchData) {
              const regionState = livingWorld?.regions[selectedNode.regionId]
              const namedHuntersInRegion = selectedNode.id === 'angel'
                ? Object.keys(livingWorld?.namedHunters ?? {}).filter(hid => livingWorld?.namedHunters[hid]?.status === 'active')
                : (regionState?.namedHunterIds || [])
              const activeMonarchState = livingWorld?.activeMonarchs?.find(m => m.monarchId === selectedNode.id)
              const isDefeated = selectedNode.id === 'angel'
                ? (livingWorld?.endingState === 'victory')
                : (activeMonarchState?.status === 'defeated')
              
              return (
                <div className="panel corner-bracket border-red-500/30 bg-red-950/10 p-4 animate-fade-in">
                  <div className="br" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-200 font-bold">
                        👑 군주 출현 지역: {RIFT_REGIONS.find((r: RiftRegion) => r.id === selectedNode.regionId)?.name}
                      </span>
                      <h4 className="mt-1.5 text-base font-black text-white">
                        {monarchData.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="rounded p-1 hover:bg-white/5 text-white/45 hover:text-white cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                      <span className="text-white/45">군주 상태</span>
                      <span className={isDefeated ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold animate-pulse'}>
                        {isDefeated ? '격퇴됨 (평화)' : '점령지 폭주 중'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                      <span className="text-white/45">서열</span>
                      <span className="font-bold text-red-300">
                        {monarchData.rank === 0 ? 'SPECIAL' : `제 ${monarchData.rank}위`}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                      <span className="text-white/45">개념/테마</span>
                      <span className="font-mono text-purple-300">
                        {monarchData.theme} ({monarchData.concept})
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                      <span className="text-white/45">권장 전투력</span>
                      <span className="font-bold text-pink-300">
                        {monarchData.recommendedCP.toLocaleString()} CP
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                      <span className="text-white/45">헌터 실효 전투력</span>
                      <span className="font-bold text-cyan-300">
                        {playerPower.toLocaleString()} CP
                      </span>
                    </div>

                    {/* 위험도 경고 */}
                    <div className="mt-2.5 rounded border p-3 flex flex-col gap-1.5 bg-black/35 border-white/5">
                      {getDangerLevel(selectedNode) === 'safe' && (
                        <div className="text-emerald-400 flex items-center gap-1.5 text-xs font-bold">
                          <CheckCircle className="h-4 w-4" />
                          <span>안전: 전력이 충분합니다.</span>
                        </div>
                      )}
                      {getDangerLevel(selectedNode) === 'danger' && (
                        <div className="text-yellow-400 flex items-center gap-1.5 text-xs font-bold">
                          <AlertCircle className="h-4 w-4" />
                          <span>위험: 격전이 예상됩니다.</span>
                        </div>
                      )}
                      {getDangerLevel(selectedNode) === 'reckless' && (
                        <div className="text-rose-400 flex flex-col gap-1 text-xs font-bold border border-rose-500/20 bg-rose-500/5 rounded p-2">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 animate-pulse" />
                            <span>⚠️ 무모: 대단히 위험한 수준!</span>
                          </div>
                          <span className="text-[10px] font-medium text-rose-300/80 leading-normal">
                            그림자 수호 장막(그림자 탱킹) 없이는 원킬당합니다.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 그림자 탱킹 상태 안내 */}
                    <div className="rounded border border-purple-500/20 bg-purple-500/5 p-3 text-[11px] text-purple-200">
                      <div className="font-bold text-purple-300 mb-1">🛡️ 그림자 탱킹 준비 상태</div>
                      {equippedShadows.length > 0 ? (
                        <span>
                          장착 그림자 <span className="font-bold text-cyan-300">{equippedShadows.length}명</span>으로 수호 장막 활성화 완료! 즉사 방지 쉴드가 준비되었습니다.
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">
                          ⚠️ 현재 장착된 그림자가 없습니다! 군주전 진입 시 탱킹 버프가 작동하지 않아 100% 즉사합니다. 그림자를 장착하고 도전하십시오.
                        </span>
                      )}
                    </div>

                    {/* 협력 헌터 선택 리스트 */}
                    {!isDefeated && namedHuntersInRegion.length > 0 && (
                      <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-2">
                        <div className="text-xs font-black text-yellow-300">
                          {selectedNode.id === 'angel' 
                            ? '🤝 인류의 최후 연합: 지고의 심판자 격퇴 연대' 
                            : `🤝 연대 전투: ${RIFT_REGIONS.find((r: RiftRegion) => r.id === selectedNode.regionId)?.name} 협력 헌터`}
                        </div>
                        <p className="text-[10px] text-white/70 leading-normal">
                          {selectedNode.id === 'angel'
                            ? '전 세계 모든 생존한 정예 헌터들과 연합하여 공략 전력을 극대화할 수 있습니다.'
                            : '지역 헌터들과 연합하여 공략 버프(스탯 증가)를 얻을 수 있으나 보상이 일부 분배(차감)됩니다.'}
                        </p>
                        <div className="max-h-24 overflow-y-auto space-y-1 scrollbar-thin">
                          {namedHuntersInRegion.map(hid => {
                            const h = livingWorld?.namedHunters[hid]
                            if (!h) return null
                            const isSelected = selectedHelpers.includes(hid)
                            const totalPower = h.power + (h.equipmentScore ?? 0)
                            return (
                              <label key={hid} className="flex items-center justify-between rounded bg-black/35 hover:bg-black/60 px-2 py-1 cursor-pointer select-none text-[10px] border border-white/5">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleHelperToggle(hid)}
                                    className="accent-purple-500 h-3 w-3 cursor-pointer"
                                  />
                                  <span className="font-bold text-white/80">{h.name}</span>
                                  {selectedNode.id === 'angel' && (
                                    <span className="text-[8px] text-white/40 font-bold bg-white/5 px-1.5 py-0.2 rounded border border-white/5">
                                      {RIFT_REGIONS.find(r => r.id === h.regionId)?.name}
                                    </span>
                                  )}
                                  <span className="rounded bg-purple-500/20 px-1 text-purple-300 font-bold" style={{ fontSize: '8px' }}>
                                    {h.rank}
                                  </span>
                                </div>
                                <span className="text-cyan-300 font-mono font-bold">⚔️{totalPower.toLocaleString()}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-2">
                    {isNodeRetreatedToday(selectedNode.id) ? (
                      <div className="rounded border border-rose-500/25 bg-rose-500/5 p-3 text-xs text-rose-300/85 text-center font-bold">
                        ⚠️ 오늘 이 군주에게서 후퇴하여 다시 도전할 수 없습니다. 내일 다시 도전하십시오.
                      </div>
                    ) : isDefeated ? (
                      <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-[11px] text-emerald-200 text-center font-bold">
                        이 군주는 이미 격퇴되었습니다.
                      </div>
                    ) : (
                        <button
                          onClick={() => {
                            const level = getDangerLevel(selectedNode)
                            if (level === 'reckless') {
                              setRecklessConfirmType('manual')
                              setShowRecklessConfirm(true)
                            } else {
                              startWorldManualBattle(selectedNode.id, selectedHelpers)
                            }
                          }}
                          className="btn border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-500/15 w-full flex items-center justify-center gap-2 py-2.5 text-xs text-cyan-200 font-black tracking-widest transition-all cursor-pointer shadow-glow-blue"
                        >
                          <Zap className="h-4 w-4 text-cyan-400" />
                          군주 수동 격퇴 개시
                        </button>
                    )}
                  </div>
                </div>
              )
            }

            return (
              <div className="panel corner-bracket border-purple-500/30 bg-purple-950/15 p-4 animate-fade-in">
                <div className="br" />
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded border border-purple-400/20 bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-200">
                      {RIFT_REGIONS.find((r: RiftRegion) => r.id === selectedNode.regionId)?.name}
                    </span>
                    <h4 className="mt-1.5 text-base font-bold text-white">
                      {selectedNode.name}
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="rounded p-1 hover:bg-white/5 text-white/45 hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                    <span className="text-white/45">정화 상태</span>
                    <span
                      className={
                        (riftNodesState[selectedNode.id] ?? selectedNode.status) === 'cleared' ? 'text-emerald-400 font-bold' :
                        (riftNodesState[selectedNode.id] ?? selectedNode.status) === 'active' ? 'text-cyan-400 font-bold' :
                        (riftNodesState[selectedNode.id] ?? selectedNode.status) === 'undiscovered' ? 'text-white/55' : 'text-white/30'
                      }
                    >
                      {
                        (riftNodesState[selectedNode.id] ?? selectedNode.status) === 'cleared' ? '완전 정화' :
                        (riftNodesState[selectedNode.id] ?? selectedNode.status) === 'active' ? '공략 진행 중' :
                        (riftNodesState[selectedNode.id] ?? selectedNode.status) === 'undiscovered' ? '탐사 대기' : '잠금'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                    <span className="text-white/45">난이도 랭크</span>
                    <span className="font-bold text-cyan-300">
                      {selectedNode.difficultyRank ?? 'E'}-RANK
                    </span>
                  </div>
                  
                  {/* 권장 CP vs 실효 CP 비교 브리핑 */}
                  {(selectedNode.difficulty ?? 0) > 0 && (
                    <>
                      <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                        <span className="text-white/45">권장 전투력</span>
                        <span className="font-bold text-pink-300">
                          {(selectedNode.difficulty ?? 0).toLocaleString()} CP
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                        <span className="text-white/45">헌터 실효 전투력</span>
                        <span className="font-bold text-cyan-300">
                          {playerPower.toLocaleString()} CP
                        </span>
                      </div>

                      {/* 위험도 경고 표시 */}
                      <div className="mt-2.5 rounded border p-3 flex flex-col gap-1.5">
                        {getDangerLevel(selectedNode) === 'safe' && (
                          <div className="text-emerald-400 flex items-center gap-1.5 text-xs font-bold">
                            <CheckCircle className="h-4 w-4" />
                            <span>안전: 격파 수월. 안정적인 정화 전선입니다.</span>
                          </div>
                        )}
                        {getDangerLevel(selectedNode) === 'danger' && (
                          <div className="text-yellow-400 flex items-center gap-1.5 text-xs font-bold">
                            <AlertCircle className="h-4 w-4" />
                            <span>위험: 균열의 압박이 강하나 도전해볼 만합니다.</span>
                          </div>
                        )}
                        {getDangerLevel(selectedNode) === 'reckless' && (
                          <div className="text-rose-400 flex flex-col gap-1 text-xs font-bold border border-rose-500/20 bg-rose-500/5 rounded p-2">
                            <div className="flex items-center gap-1.5">
                              <AlertCircle className="h-4 w-4 animate-pulse" />
                              <span>⚠️ 무모: 매우 높은 즉사 위험 구역!</span>
                            </div>
                            <span className="text-[10px] font-medium text-rose-300/80 leading-normal">
                              치명적인 즉사 위험이 있으니 그림자를 보강하거나 레벨업 후 진입하십시오.
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {selectedNode.daysRemaining !== undefined && (
                    <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                      <span className="text-white/45">소멸/폭주 시한</span>
                      <span className={`font-bold ${(selectedNode.daysRemaining ?? 0) <= 3 ? 'text-red-400 animate-pulse' : 'text-yellow-300'}`}>
                        {selectedNode.daysRemaining}일 남음 / 총 {selectedNode.deadline}일
                      </span>
                    </div>
                  )}
                </div>

                {/* [L1-A] 러브콜 특별 섹션 */}
                {hasLoveCall && loveCallState && (() => {
                  const nodeTheme = getRegionalTheme(selectedNode.subRegionId || selectedNode.regionId)
                  const flag = REGION_FLAGS[selectedNode.regionId] || '🌐'
                  const rName = RIFT_REGIONS.find((r) => r.id === selectedNode.regionId)?.name ?? selectedNode.regionId.toUpperCase()
                  const subName = nodeTheme.name
                  
                  return (
                    <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-yellow-300">
                          <span>📞 긴급 러브콜 지원 요청</span>
                        </div>
                        <span className="text-[9px] text-amber-300 font-bold bg-amber-500/10 border border-amber-400/20 px-1.5 py-0.5 rounded">
                          {flag} {rName} ({subName})
                        </span>
                      </div>

                      {/* 서사적 상황 설명 */}
                      <div className="text-[10px] text-white/70 leading-relaxed border-l-2 border-yellow-500/40 pl-2 py-0.5 bg-black/15 rounded-r">
                        <p className="font-semibold text-yellow-200/90 mb-1 text-[9px] uppercase tracking-wider">상황 보고:</p>
                        <p className="italic">"{nodeTheme.loveCallNarrative}"</p>
                      </div>

                      {/* 방치 위험 경고 */}
                      <div className="rounded bg-rose-950/20 border border-rose-500/20 p-2 text-[9.5px] leading-relaxed text-rose-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold">⚠️ 방치 시 예상 피해:</span>
                          {selectedNode && livingWorld?.regions[selectedNode.regionId] && (
                            <span className="text-[9px] bg-rose-500/20 border border-rose-400/30 text-rose-300 font-bold px-1.5 py-0.2 rounded">
                              현지 오염도: {livingWorld.regions[selectedNode.regionId].corruption}%
                            </span>
                          )}
                        </div>
                        {(selectedNode.daysRemaining ?? 0) <= 2 ? (
                          <span className="text-red-300 font-bold animate-pulse">
                            소멸/폭주 직전! {selectedNode.daysRemaining}일 내 격퇴 실패 시 해당 지역 오염도가 급증하고 방어선이 완전 붕괴됩니다.
                          </span>
                        ) : (
                          <span>
                            D-{selectedNode.daysRemaining}일 이내에 정화하지 못하면 게이트가 폭주하여 주변 전선을 삼켜 오염을 심화시킵니다.
                          </span>
                        )}
                      </div>

                      {/* 보상 정보 */}
                      <div className="rounded bg-black/40 p-2 space-y-1 text-[10px] border border-white/5">
                        <div className="flex justify-between items-center text-[9px] font-bold text-white/40 mb-1">
                          <span>약속 보상 (기본)</span>
                          <span className="text-amber-400 font-normal scale-90 origin-right">※ 특별 위험 수당 적용됨</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">골드 지원금</span>
                          <span className="font-bold text-amber-300">+{loveCallState.promisedReward.gold} Gold</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">어둠의 정수</span>
                          <span className="font-bold text-purple-300">+{loveCallState.promisedReward.shadowEssence} 정수</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">전투 경험치</span>
                          <span className="font-bold text-emerald-300">+{loveCallState.promisedReward.hunterXp} XP</span>
                        </div>
                      </div>

                      {/* 협력 헌터 선택 목록 */}
                      <div className="space-y-1.5">
                        <div className="text-[9px] font-bold text-white/40">협력 헌터 선택 (참전 지원 후보)</div>
                        {loveCallState.helperHunterIds.length === 0 ? (
                          <div className="text-[9px] text-white/40 italic">현재 지원 가능한 헌터가 없습니다.</div>
                        ) : (
                          <div className="max-h-28 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                            {loveCallState.helperHunterIds.map(hid => {
                              const h = livingWorld?.namedHunters[hid]
                              if (!h) return null
                              const isSelected = selectedHelpers.includes(hid)
                              return (
                                <label key={hid} className="flex items-center justify-between rounded bg-black/35 hover:bg-black/60 px-2 py-1.5 text-[10px] cursor-pointer select-none border border-white/5">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleHelperToggle(hid)}
                                      className="accent-purple-500 h-3 w-3 cursor-pointer"
                                    />
                                    <span className="font-bold text-white/80">{h.name}</span>
                                    <span className="rounded bg-purple-500/20 px-1 text-[8px] font-black text-purple-300 border border-purple-500/20">
                                      {h.rank}
                                    </span>
                                  </div>
                                  <span className="text-cyan-300 font-mono font-bold">⚔️{(h.power + (h.equipmentScore ?? 0)).toLocaleString()}</span>
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* 트레이드오프 브리핑 */}
                      <div className="rounded border border-purple-500/20 bg-purple-500/5 p-2 text-[10px] space-y-1.5">
                        <div className="text-[9px] font-bold text-purple-300">⚖️ 협력 전투 트레이드오프 실시간 예측</div>
                        <div className="grid grid-cols-2 gap-1 font-mono text-[9px] text-white/70">
                          <div>공격력 보너스:</div>
                          <div className="text-emerald-400 font-bold">+{coopBuffs.atk.toLocaleString()} ATK</div>
                          <div>방어력 보너스:</div>
                          <div className="text-emerald-400 font-bold">+{coopBuffs.def.toLocaleString()} DEF</div>
                          <div>받는 피해 감소:</div>
                          <div className="text-emerald-400 font-bold">-{Math.round(coopBuffs.dr * 100)}% DMG</div>
                          <div>보상 획득 비율:</div>
                          <div className={coopBuffs.rewardRatio === 1 ? "text-cyan-300 font-bold" : "text-yellow-400 font-bold"}>
                            {Math.round(coopBuffs.rewardRatio * 100)}% (독식 대비 -{Math.round((1 - coopBuffs.rewardRatio) * 100)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* 대한민국 게이트 특별 합류(협력) 섹션 */}
                {!hasLoveCall && selectedNode.regionId === 'kr' && (riftNodesState[selectedNode.id] ?? selectedNode.status) === 'active' && (
                  <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 space-y-3 animate-fade-in">
                    <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300">
                      <span>🤝 대한민국 헌터 연합 합류</span>
                    </div>
                    <p className="text-[10px] text-white/70 leading-normal">
                      대한민국 헌터 협회 동료들과 함께 게이트 공략을 공조합니다. 참전할 S급 헌터를 선택해 주십시오. (협력 시 전투 안정성이 상승합니다.)
                    </p>
                    
                    {/* 협력 헌터 선택 목록 */}
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-bold text-white/40">참전 지원 가능 헌터</div>
                      {(() => {
                        const krRegionState = livingWorld?.regions['kr']
                        const krHelperHunterIds = krRegionState 
                          ? krRegionState.namedHunterIds.filter(hid => livingWorld?.namedHunters[hid]?.status === 'active') 
                          : []

                        if (krHelperHunterIds.length === 0) {
                          return <div className="text-[9px] text-white/40 italic">현재 지원 가능한 헌터가 없습니다.</div>
                        }

                        return (
                          <div className="max-h-28 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                            {krHelperHunterIds.map(hid => {
                              const h = livingWorld?.namedHunters[hid]
                              if (!h) return null
                              const isSelected = selectedHelpers.includes(hid)
                              return (
                                <label key={hid} className="flex items-center justify-between rounded bg-black/35 hover:bg-black/60 px-2 py-1.5 text-[10px] cursor-pointer select-none border border-white/5">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleHelperToggle(hid)}
                                      className="accent-cyan-500 h-3 w-3 cursor-pointer"
                                    />
                                    <span className="font-bold text-white/80">{h.name}</span>
                                    <span className="rounded bg-cyan-500/20 px-1 text-[8px] font-black text-cyan-300 border border-cyan-500/20">
                                      {h.rank}
                                    </span>
                                  </div>
                                  <span className="text-cyan-300 font-mono font-bold">⚔️{(h.power + (h.equipmentScore ?? 0)).toLocaleString()}</span>
                                </label>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>

                    {/* 트레이드오프 브리핑 (헬퍼 선택 시에만 표시) */}
                    {selectedHelpers.length > 0 && (
                      <div className="rounded border border-cyan-500/20 bg-cyan-500/5 p-2 text-[10px] space-y-1.5">
                        <div className="text-[9px] font-bold text-cyan-300">⚖️ 협력 전투 트레이드오프 실시간 예측</div>
                        <div className="grid grid-cols-2 gap-1 font-mono text-[9px] text-white/70">
                          <div>공격력 보너스:</div>
                          <div className="text-emerald-400 font-bold">+{coopBuffs.atk.toLocaleString()} ATK</div>
                          <div>방어력 보너스:</div>
                          <div className="text-emerald-400 font-bold">+{coopBuffs.def.toLocaleString()} DEF</div>
                          <div>받는 피해 감소:</div>
                          <div className="text-emerald-400 font-bold">-{Math.round(coopBuffs.dr * 100)}% DMG</div>
                          <div>보상 획득 비율:</div>
                          <div className={coopBuffs.rewardRatio === 1 ? "text-cyan-300 font-bold" : "text-yellow-400 font-bold"}>
                            {Math.round(coopBuffs.rewardRatio * 100)}% (독식 대비 -{Math.round((1 - coopBuffs.rewardRatio) * 100)}%)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  {isNodeRetreatedToday(selectedNode.id) ? (
                    <div className="rounded border border-rose-500/25 bg-rose-500/5 p-3 text-xs text-rose-300/85 text-center font-bold">
                      ⚠️ 오늘 이 구역에서 후퇴하여 다시 진입할 수 없습니다. 내일 다시 시도하십시오.
                    </div>
                  ) : (
                    <>
                      {(riftNodesState[selectedNode.id] ?? selectedNode.status) === 'cleared' ? (
                        <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-[11px] text-emerald-200 text-center">
                          이미 완전히 정화된 구역입니다. 재정화가 가능합니다.
                        </div>
                      ) : null}

                      {/* 수동 전투 버튼 */}
                      <button
                        onClick={() => {
                          const level = getDangerLevel(selectedNode)
                          if (level === 'reckless') {
                            setRecklessConfirmType('manual')
                            setShowRecklessConfirm(true)
                          } else {
                            startWorldManualBattle(selectedNode.id, selectedHelpers)
                          }
                        }}
                        disabled={
                          (riftNodesState[selectedNode.id] ?? selectedNode.status) === 'locked'
                        }
                        className="btn border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-500/15 w-full flex items-center justify-center gap-2 py-2 text-xs text-cyan-200 transition-all cursor-pointer"
                      >
                        <Zap className="h-4 w-4 text-cyan-400" />
                        수동 조작 정화 (카드 전투)
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })() : (
            <div className="panel corner-bracket border-white/5 bg-ink-950/20 p-8 text-center text-white/35 text-xs">
              <HelpCircle className="mx-auto mb-2 h-8 w-8 text-white/20" />
              지도상의 균열 노드를 선택하여 상세 정보를 확인하십시오.
            </div>
          )}
        </div>

        {/* 맵 컨테이너 */}
        <div className="lg:col-span-2">
          <div
            className="relative w-full rounded-xl border border-white/10 bg-slate-950 overflow-hidden"
            style={{ aspectRatio: '16/9', minHeight: '300px' }}
          >
            {/* 그리드 모티프 배경 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f15_1px,transparent_1px),linear-gradient(to_bottom,#0f0f15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70" />

            {/* 지도 상의 가상 대륙 경계선 대체 홀더 */}
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/5 select-none pointer-events-none font-mono">
              [ DIMENSIONAL RIFT MAP - MVP-2 ]
            </div>

            {/* 국가(Region) 레이블 렌더링 */}
            {RIFT_REGIONS.map((region: RiftRegion) => {
              const prog = getRegionProgress(region.id, riftNodesState)
              const regionState = livingWorld?.regions[region.id]
              const totalPower = regionState ? getRegionTotalPower(regionState, livingWorld.namedHunters) : 0
              const occupiedMonarch = livingWorld?.activeMonarchs?.find(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(region.id))

              return (
                <div
                  key={region.id}
                  className="absolute pointer-events-none flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${region.labelX}%`, top: `${region.labelY}%` }}
                >
                  {/* 점령 시 붉은 글로우 백그라운드 효과 */}
                  {occupiedMonarch && (
                    <div className="absolute -inset-10 rounded-full bg-rose-600/10 blur-xl animate-pulse -z-10" />
                  )}
                  <div className={`rounded-full bg-black/75 border ${occupiedMonarch ? 'border-red-500/80 shadow-glow-red animate-pulse' : 'border-white/5'} px-2.5 py-0.5 text-[10px] font-black ${occupiedMonarch ? 'text-red-400' : 'text-white/60'} backdrop-blur-sm`}>
                    {occupiedMonarch ? `⚠️ ${region.name} (점령됨)` : region.name}
                  </div>
                  <div className={`text-[8px] ${occupiedMonarch ? 'text-red-300 font-bold bg-red-950/40 border border-red-500/25 px-1.5' : 'text-purple-300/80 bg-black/45 px-1'} font-mono mt-0.5 whitespace-nowrap rounded`}>
                    {occupiedMonarch 
                      ? `군주: ${MONARCHS.find(m => m.id === occupiedMonarch.monarchId)?.name ?? occupiedMonarch.monarchId}`
                      : `(${prog.cleared}/${prog.total})${totalPower > 0 ? ` ⚔️${(totalPower / 1000).toFixed(0)}k` : ''}`
                    }
                  </div>
                </div>
              )
            })}

            {/* 노드(Node) 마커 렌더링 - 한국 활성 게이트 또는 활성화된 러브콜(지원 요청) 노출 */}
            {Object.values(livingWorld?.riftNodes ?? {})
              .filter((node: any) => (node.regionId === 'kr' || node.loveCall?.active) && (riftNodesState[node.id] ?? node.status) === 'active')
              .map((node: any) => {
                const status = riftNodesState[node.id] ?? node.status
                const meta = RIFT_NODE_STATUS_META[status]
                const worldNode = livingWorld?.riftNodes[node.id]
                const isNodeRegionOccupied = livingWorld?.activeMonarchs?.some(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(node.regionId))
                const hasLoveCall = worldNode?.loveCall?.active

                return (
                  <button
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-300 z-10`}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    {/* 노드 링과 코어 */}
                    <div
                      className={`relative h-5 w-5 rounded-full border-2 ${
                        isNodeRegionOccupied 
                          ? 'border-red-500 bg-red-950/80 shadow-glow-red animate-pulse' 
                          : hasLoveCall
                            ? 'border-amber-400 bg-amber-950/80 shadow-glow-amber'
                            : `${meta.borderClass} ${meta.bgClass}`
                      } flex items-center justify-center transition-all group-hover:scale-125 ${
                        hasLoveCall ? 'group-hover:border-amber-300' : 'group-hover:border-purple-400'
                      }`}
                    >
                      {hasLoveCall && (
                        <span className="absolute -top-3 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[8px] font-black text-black shadow-glow-yellow animate-bounce z-20">
                          📞
                        </span>
                      )}
                      {status === 'locked' && (
                        <Lock className="h-2 w-2 text-zinc-600" />
                      )}
                      {status === 'cleared' && (
                        <CheckCircle className="h-2 text-emerald-400" style={{ width: '8px' }} />
                      )}
                      {status === 'undiscovered' && (
                        <Eye className="h-2 w-2 text-zinc-500" />
                      )}
                      {status === 'active' && (
                        <div className={`h-1.5 w-1.5 rounded-full ${isNodeRegionOccupied ? 'bg-red-400' : hasLoveCall ? 'bg-amber-400' : 'bg-cyan-400'} animate-ping`} />
                      )}
                    </div>

                    {/* 마커 아래 노드명 말풍선 */}
                    <div className="mt-1 opacity-60 group-hover:opacity-100 transition-all">
                      <div className={`rounded bg-black/80 border ${
                        isNodeRegionOccupied 
                          ? 'border-red-500/40 text-red-300' 
                          : hasLoveCall
                            ? 'border-amber-500/45 text-amber-200 shadow-glow-amber/10'
                            : 'border-white/5 text-white/70'
                      } px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-sm whitespace-nowrap shadow-md`}>
                        {hasLoveCall ? `📞 [지원요청] ${node.name} (D-${node.daysRemaining})` : node.name}
                      </div>
                    </div>
                  </button>
                )
              })}

            {/* 군주 노드 마커 렌더링 */}
            {livingWorld?.activeMonarchs?.filter((m: any) => m.status === 'rampaging').map((monarch: any) => {
              const mData = MONARCHS.find(m => m.id === monarch.monarchId)
              if (!mData) return null
              const regionId = monarch.occupiedRegionIds[0] || 'kr'
              const regionMeta = RIFT_REGIONS.find(r => r.id === regionId)
              const x = regionMeta ? regionMeta.labelX : 50
              const y = regionMeta ? regionMeta.labelY + 6 : 56

              return (
                <button
                  key={monarch.monarchId}
                  onClick={() => handleNodeClick({
                    id: monarch.monarchId,
                    regionId,
                    name: mData.name,
                    x,
                    y,
                    status: 'active',
                    gateDefId: monarch.monarchId,
                    difficultyRank: 'S',
                    difficulty: mData.recommendedCP,
                    deadline: 999,
                    daysRemaining: 999,
                    isSGrade: true
                  })}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-300 z-20 animate-pulse cursor-pointer"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className="relative h-6 w-6 rounded-full border-2 border-red-500 bg-red-950/90 shadow-glow-red flex items-center justify-center transition-all group-hover:scale-125">
                    <span className="text-[10px]">👑</span>
                  </div>
                  <div className="mt-1">
                    <div className="rounded bg-red-950/90 border border-red-500/40 text-red-200 px-1.5 py-0.5 text-[8px] font-black backdrop-blur-sm whitespace-nowrap shadow-md">
                      {mData.name} (침공)
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 인라인 게이트 활성화 HUD (기존 게이트 전선 호환용) */}
      {isGateActive && (
        <div className="panel corner-bracket border-purple-500/40 bg-purple-950/10 p-6 animate-fade-in relative mt-6">
          <div className="br" />
          <div className="absolute top-4 right-4 z-10">
            <span className="rounded-full bg-purple-500/20 border border-purple-400/30 px-3 py-1 text-[10px] font-black text-purple-200 tracking-widest animate-pulse">
              균열 정화 전선 활성화
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Swords className="h-5 w-5 text-purple-400" />
              진입한 구역: {RIFT_NODES.find((rn: any) => rn.id === activeRiftNodeId)?.name ?? livingWorld?.riftNodes[activeRiftNodeId]?.name ?? activeGate.customGateDef?.name ?? '미지의 균열'}
            </h3>
            <p className="text-xs text-white/45 mt-1">
              게이트를 클리어하면 해당 월드맵 노드의 정화도가 올라가고 후속 노드가 해제됩니다.
            </p>
          </div>

          {/* 기존 GatePanel의 전투 모듈을 그대로 인라인 배치하여 자연스럽게 연결 */}
          <div className="border-t border-white/5 pt-4 bg-ink-950/20 rounded-lg p-2 sm:p-4">
            <GatePanel isWorldMapContext={true} />
          </div>
        </div>
      )}

      {/* 국가 정화 현황 상세 모달 (WORLD PURIFICATION DETAILS) */}
      {activeDetailRegion && (() => {
        const region = activeDetailRegion
        const prog = getRegionProgress(region.id, riftNodesState)
        const regionState = livingWorld?.regions[region.id]
        const totalPower = regionState ? getRegionTotalPower(regionState, livingWorld.namedHunters) : 0
        const flag = REGION_FLAGS[region.id] || '🌐'
        const occupiedMonarch = livingWorld?.activeMonarchs?.find(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(region.id))
        const hasLoveCall = Object.values(livingWorld?.riftNodes ?? {}).some((node: any) => node.regionId === region.id && node.loveCall?.active && (riftNodesState[node.id] ?? node.status) === 'active')

        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="panel corner-bracket border-cyan-400/30 bg-ink-950/95 p-6 max-w-md w-full shadow-glow-blue relative animate-scale-in">
              <div className="br" />
              
              {/* 헤더 */}
              <div className="flex items-start justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{flag}</span>
                  <div>
                    <h4 className="text-base font-black text-white flex items-center gap-1.5">
                      {region.name}
                      {region.id === 'kr' && (
                        <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[8px] font-bold text-sky-300 border border-sky-500/30">
                          거점
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">REGION CODE: {region.id.toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDetailRegion(null)}
                  className="rounded p-1 hover:bg-white/5 text-white/45 hover:text-white cursor-pointer transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 본문 정보 */}
              <div className="mt-4 space-y-4">
                
                {/* 점령 및 러브콜 경고 */}
                {occupiedMonarch && (
                  <div className="rounded border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400 font-bold animate-pulse flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>경고: 이 국가는 현재 심연의 군주에 의해 점령되어 잠식 중입니다!</span>
                  </div>
                )}
                {hasLoveCall && !occupiedMonarch && (
                  <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300 font-bold flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>알림: 이 국가의 헌터 협회로부터 지원(러브콜) 요청이 와 있습니다.</span>
                  </div>
                )}

                {/* 정화 진척도 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-white/70">
                    <span>정화 진척도</span>
                    <span className="text-purple-300 font-mono">
                      {prog.cleared}/{prog.total} 구역 완료 ({prog.percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${prog.percent}%` }}
                    />
                  </div>
                </div>

                {/* 핵심 지표 */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="rounded bg-black/45 border border-white/5 p-2">
                    <div className="text-[9px] text-white/40 font-sans uppercase">오염도</div>
                    <div className={`mt-1 font-black ${
                      occupiedMonarch ? 'text-red-400' :
                      regionState && regionState.corruption >= 50 ? 'text-orange-400 animate-pulse' :
                      regionState && regionState.corruption >= 20 ? 'text-yellow-300' :
                      'text-emerald-400'
                    }`}>
                      {regionState ? `${regionState.corruption}%` : '0%'}
                    </div>
                  </div>
                  <div className="rounded bg-black/45 border border-white/5 p-2">
                    <div className="text-[9px] text-white/40 font-sans uppercase">총 전력</div>
                    <div className="mt-1 font-black text-cyan-300">
                      {totalPower > 0 ? `${(totalPower / 1000).toFixed(0)}k` : '계산 중'}
                    </div>
                  </div>
                  <div className="rounded bg-black/45 border border-white/5 p-2">
                    <div className="text-[9px] text-white/40 font-sans uppercase">활성 게이트</div>
                    <div className="mt-1 font-black text-purple-300">
                      {regionState ? regionState.activeGateIds.length : 0}개
                    </div>
                  </div>
                </div>

                {/* 5축 성향 프로파일 */}
                {regionState && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-white/45 tracking-widest uppercase">📊 지역 성향 매개변수 (Profile)</span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-black/35 rounded-lg p-3 border border-white/5 text-[10px] text-white/70">
                      <div className="flex justify-between">
                        <span className="text-white/40">위험 감수성향</span>
                        <span className="font-bold text-red-400">{(regionState.riskAppetite * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">정예형성향</span>
                        <span className="font-bold text-amber-400">{((1 - regionState.populationStyle) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">성장성향</span>
                        <span className="font-bold text-emerald-400">{(regionState.growthBias * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">결속도</span>
                        <span className="font-bold text-blue-400">{(regionState.cohesion * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between col-span-2 border-t border-white/5 pt-1.5 mt-0.5">
                        <span className="text-white/40">부유함</span>
                        <span className="font-bold text-purple-400">{(regionState.wealth * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 소속 네임드 헌터 명단 */}
                {regionState && regionState.namedHunterIds.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-white/45 tracking-widest uppercase">🤝 소속 네임드 헌터 ({regionState.namedHunterIds.length})</span>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {regionState.namedHunterIds.map((hunterId) => {
                        const hunterObj = livingWorld?.namedHunters[hunterId]
                        if (!hunterObj) return null
                        const totalPower = hunterObj.power + (hunterObj.equipmentScore ?? 0)
                        const hasEquip = hunterObj.equipmentItems && hunterObj.equipmentItems.length > 0
                        return (
                          <div key={hunterId} className="flex flex-col gap-1 bg-black/40 border border-white/5 px-2.5 py-2 rounded-md text-[10px]">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white/80">{hunterObj.name}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="rounded bg-purple-500/20 px-1.5 py-0.2 text-[8px] font-black text-purple-300 border border-purple-500/30">
                                  {hunterObj.rank}
                                </span>
                                <span className="text-cyan-300 font-mono font-bold">
                                  ⚔️{totalPower.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {hasEquip && (
                              <div className="flex flex-wrap gap-1 mt-1 border-t border-white/5 pt-1 text-[8px] text-white/55">
                                <span className="text-purple-400/80 font-bold mr-1">🛡️ 장비:</span>
                                {hunterObj.equipmentItems?.map((eq, eqIdx) => {
                                  const rarityColor = 
                                    eq.rarity === 'legendary' ? 'text-amber-400 font-semibold' :
                                    eq.rarity === 'epic' ? 'text-purple-400 font-semibold' :
                                    eq.rarity === 'rare' ? 'text-cyan-400' :
                                    'text-white/60'
                                  return (
                                    <span key={eqIdx} className={`mr-2 ${rarityColor}`}>
                                      [{eq.name}]
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-white/45 italic py-2 text-center border border-dashed border-white/5 rounded">
                    소속 네임드 헌터가 없습니다.
                  </div>
                )}
              </div>

              {/* 하단 닫기 */}
              <div className="mt-6">
                <button
                  onClick={() => setActiveDetailRegion(null)}
                  className="rounded border border-white/10 bg-white/5 hover:bg-white/10 w-full py-2 text-xs font-bold text-white/70 transition-all cursor-pointer text-center"
                >
                  상세 닫기
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 일일 정세 보고서 모달 (전체화면 오버레이) */}
      {/* 통합 정세 보고서 모달 (전체화면 오버레이) */}
      {activeReportTab && livingWorld && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-md flex flex-col p-4 sm:p-6 text-white overflow-hidden font-sans animate-fade-in">
          <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col min-h-0 bg-zinc-900/80 border border-white/10 rounded-xl p-4 sm:p-6 shadow-2xl relative">
            
            {/* Top Close Button */}
            <button 
              onClick={() => setActiveReportTab(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer z-10 text-xs font-mono font-bold"
            >
              ✕ 닫기 (ESC)
            </button>

            {/* Header / Integrated Tab bar */}
            <div className="flex flex-col border-b border-white/10 pb-4 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    {activeReportTab === 'daily' && '📊 일일 정세 보고서'}
                    {activeReportTab === 'country' && '🛡️ 국가별 상세 현황'}
                    {activeReportTab === 'hunter' && '🏆 세계 헌터 랭킹'}
                  </h2>
                  <p className="text-xs text-white/40 mt-1 leading-normal">
                    {activeReportTab === 'daily' && '이전 날짜의 시뮬레이션 지표 스냅샷 및 지역 정화/폭주 데이터를 상세 분석합니다.'}
                    {activeReportTab === 'country' && '선택한 국가의 오염도, 활성 게이트 상태 및 소속 네임드 헌터의 전력을 상세히 진단합니다.'}
                    {activeReportTab === 'hunter' && '전 세계 네임드 헌터들의 실효 전투력 순위와 주요 장비 및 특성 분포를 표시합니다.'}
                  </p>
                </div>
              </div>

              {/* 3대 탭 메뉴 */}
              <div className="flex gap-1 mt-4 bg-black/40 p-1 rounded-lg border border-white/5 self-start">
                <button
                  onClick={() => openReport('daily')}
                  className={`px-4 py-2 rounded-md text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeReportTab === 'daily'
                      ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                      : 'text-white/55 hover:text-white hover:bg-white/5'
                  }`}
                >
                  📊 일일 정세 보고
                </button>
                <button
                  onClick={() => openReport('country', selectedReportRegionId)}
                  className={`px-4 py-2 rounded-md text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeReportTab === 'country'
                      ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                      : 'text-white/55 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🛡️ 국가별 상세
                </button>
                <button
                  onClick={() => openReport('hunter')}
                  className={`px-4 py-2 rounded-md text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeReportTab === 'hunter'
                      ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                      : 'text-white/55 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🏆 세계 헌터 랭킹
                </button>
              </div>
            </div>

            {/* Main Body Scrollable */}
            <div className="flex-1 overflow-y-auto mt-6 pr-1 min-h-0">
              
              {/* [TAB 1] 일일 정세 보고 */}
              {activeReportTab === 'daily' && (
                <div className="space-y-6">
                  {/* Header / Date Navigation */}
                  {(() => {
                    const summaries = livingWorld.dailySummaries ?? []
                    const targetDay = selectedReportDay ?? (summaries.length > 0 ? summaries[summaries.length - 1].day : 0)
                    const currentSummary = summaries.find(s => s.day === targetDay)
                    const prevSummary = summaries.find(s => s.day === targetDay - 1)
                    const minDay = summaries.length > 0 ? summaries[0].day : 0
                    const maxDay = summaries.length > 0 ? summaries[summaries.length - 1].day : 0

                    const handlePrev = () => {
                      if (targetDay > minDay) {
                        setSelectedReportDay(targetDay - 1)
                      }
                    }
                    const handleNext = () => {
                      if (targetDay < maxDay) {
                        setSelectedReportDay(targetDay + 1)
                      }
                    }

                    return (
                      <>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={handlePrev}
                            disabled={targetDay <= minDay}
                            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                          >
                            ◀ 이전 날
                          </button>
                          <span className="font-mono text-xs font-bold px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg">
                            Day {targetDay} / {maxDay}
                          </span>
                          <button
                            onClick={handleNext}
                            disabled={targetDay >= maxDay}
                            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                          >
                            다음 날 ▶
                          </button>
                        </div>

                        {currentSummary ? (
                          <>
                            {/* 1. 핵심 지표 카드 grid */}
                            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                              {/* 지표 1: 전역 오염도 */}
                              {(() => {
                                const val = currentSummary.worldCorruption
                                const prevVal = prevSummary?.worldCorruption ?? 0
                                const diff = val - prevVal
                                const isIncreased = diff > 0
                                const isDecreased = diff < 0
                                return (
                                  <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[100px]">
                                    <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">전역 오염도</span>
                                    <div className="text-2xl font-black text-red-400 mt-1">{val}%</div>
                                    <div className="mt-2 flex items-center justify-between text-[10px]">
                                      <span className="text-white/40">어제 대비</span>
                                      {diff === 0 ? (
                                        <span className="text-white/30 font-bold">-</span>
                                      ) : isIncreased ? (
                                        <span className="text-red-400 font-extrabold flex items-center gap-0.5">▲ +{diff}%</span>
                                      ) : (
                                        <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">▼ {Math.abs(diff)}%</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* 지표 2: 당일 게이트 정화 수 */}
                              {(() => {
                                const val = currentSummary.gatesClearedToday
                                const prevVal = prevSummary?.gatesClearedToday ?? 0
                                const diff = val - prevVal
                                return (
                                  <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[100px]">
                                    <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">당일 게이트 정화</span>
                                    <div className="text-2xl font-black text-emerald-400 mt-1">{val}개</div>
                                    <div className="mt-2 flex items-center justify-between text-[10px]">
                                      <span className="text-white/40">어제 대비</span>
                                      {diff === 0 ? (
                                        <span className="text-white/30 font-bold">-</span>
                                      ) : diff > 0 ? (
                                        <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">▲ +{diff}</span>
                                      ) : (
                                        <span className="text-red-400 font-extrabold flex items-center gap-0.5">▼ {Math.abs(diff)}</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* 지표 3: 당일 게이트 폭주 수 */}
                              {(() => {
                                const val = currentSummary.gatesRampagedToday
                                const prevVal = prevSummary?.gatesRampagedToday ?? 0
                                const diff = val - prevVal
                                return (
                                  <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[100px]">
                                    <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">당일 게이트 폭주</span>
                                    <div className="text-2xl font-black text-red-500 mt-1">{val}개</div>
                                    <div className="mt-2 flex items-center justify-between text-[10px]">
                                      <span className="text-white/40">어제 대비</span>
                                      {diff === 0 ? (
                                        <span className="text-white/30 font-bold">-</span>
                                      ) : diff > 0 ? (
                                        <span className="text-red-500 font-extrabold flex items-center gap-0.5 animate-pulse">▲ +{diff}</span>
                                      ) : (
                                        <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">▼ {Math.abs(diff)}</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* 지표 4: 활성 군주 수 */}
                              {(() => {
                                const val = currentSummary.monarchCount
                                const prevVal = prevSummary?.monarchCount ?? 0
                                const diff = val - prevVal
                                return (
                                  <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[100px]">
                                    <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">활성 군주 세력</span>
                                    <div className="text-2xl font-black text-purple-400 mt-1">{val}명</div>
                                    <div className="mt-2 flex items-center justify-between text-[10px]">
                                      <span className="text-white/40">어제 대비</span>
                                      {diff === 0 ? (
                                        <span className="text-white/30 font-bold">-</span>
                                      ) : diff > 0 ? (
                                        <span className="text-purple-400 font-extrabold flex items-center gap-0.5">▲ +{diff}</span>
                                      ) : (
                                        <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">▼ {Math.abs(diff)}</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>

                            {/* 2. 상세 정보 영역 */}
                            <div className="flex flex-col lg:flex-row gap-6">
                              
                              {/* 주요 사건 로그 (좌) */}
                              <div className="flex-1 bg-black/20 border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col min-h-[300px]">
                                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2 border-b border-white/10 pb-3 mb-4 uppercase">
                                  📢 Day {targetDay} 주요 정세 사건
                                </h3>
                                
                                {(() => {
                                  const dayLogs = livingWorld.eventLogs.filter(log => log.startsWith(`[Day ${targetDay}]`))
                                  
                                  if (dayLogs.length === 0) {
                                    return (
                                      <div className="text-zinc-500 italic py-16 text-center text-xs flex-1 flex items-center justify-center">
                                        📡 이 날짜에는 특별한 전술 사건이나 이상 징후가 보고되지 않았습니다.
                                      </div>
                                    )
                                  }

                                  return (
                                    <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-1 flex-1 scrollbar-thin">
                                      {dayLogs.map((log, idx) => {
                                        const style = classifyEventLog(log)
                                        const cleanText = log.replace(/^\[Day \d+\]\s*/, '')
                                        return (
                                          <div key={idx} className="flex items-start gap-2.5 text-xs border-b border-white/5 pb-2.5 leading-normal transition-all hover:bg-white/5 p-1.5 rounded">
                                            <span className={`chip shrink-0 scale-90 mt-0.5 ${style.badgeClass}`} style={{ fontSize: '7.5px', padding: '0.1rem 0.35rem' }}>
                                              {style.badge}
                                            </span>
                                            <span className={`flex-1 font-mono text-[10.5px] tracking-wide leading-relaxed ${style.textClass}`}>
                                              {cleanText}
                                            </span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )
                                })()}
                              </div>

                              {/* 국가 전선 현황 (우) */}
                              <div className="w-full lg:w-[45%] bg-black/20 border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col min-h-[300px]">
                                <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2 border-b border-white/10 pb-3 mb-4 uppercase">
                                  🛡️ 국가별 전선 오염도 현황
                                </h3>

                                {(() => {
                                  const regionInfos = Object.values(livingWorld.regions).map(r => ({
                                    region: r,
                                    power: getRegionTotalPower(r, livingWorld.namedHunters),
                                    name: RIFT_REGIONS.find(reg => reg.id === r.regionId)?.name ?? r.regionId.toUpperCase()
                                  })).sort((a, b) => {
                                    if (a.region.corruption !== b.region.corruption) {
                                      return a.region.corruption - b.region.corruption
                                    }
                                    return b.power - a.power
                                  })

                                  const strongestFrontierId = regionInfos[0]?.region.regionId

                                  return (
                                    <div className="space-y-3.5 overflow-y-auto max-h-[400px] pr-1 flex-1 scrollbar-thin">
                                      {regionInfos.map(({ region, power, name }) => {
                                        const isStrongest = region.regionId === strongestFrontierId
                                        return (
                                          <div 
                                            key={region.regionId} 
                                            onClick={() => openReport('country', region.regionId)}
                                            className="flex flex-col gap-1.5 p-2 rounded border border-white/5 bg-zinc-950/20 hover:bg-zinc-950/40 cursor-pointer transition-all"
                                          >
                                            <div className="flex items-center justify-between text-xs font-semibold">
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-white/80">{name}</span>
                                                <span className="text-[9px] text-white/35">⚔️{power.toLocaleString()}</span>
                                                {isStrongest && (
                                                  <span className="rounded bg-emerald-500/20 border border-emerald-500/40 text-[8px] font-black text-emerald-400 px-1 py-0.2 select-none tracking-widest scale-90 uppercase animate-pulse">
                                                    ★ 최강
                                                  </span>
                                                )}
                                              </div>
                                              <span className={`font-mono font-bold ${
                                                region.corruption >= 70 ? 'text-red-400' :
                                                region.corruption >= 30 ? 'text-orange-400' :
                                                'text-emerald-400'
                                              }`}>
                                                오염도 {region.corruption}%
                                              </span>
                                            </div>

                                            {/* 게이지 바 */}
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                              <div 
                                                className={`h-full transition-all duration-300 bg-gradient-to-r ${
                                                  region.corruption >= 70 ? 'from-orange-500 to-red-500' :
                                                  region.corruption >= 30 ? 'from-yellow-400 to-orange-500' :
                                                  'from-cyan-400 to-emerald-400'
                                                }`}
                                                style={{ width: `${region.corruption}%` }}
                                              />
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )
                                })()}
                              </div>

                            </div>
                          </>
                        ) : (
                          <div className="text-zinc-500 italic py-24 text-center text-sm flex-1 flex flex-col items-center justify-center gap-3">
                            <span>📊 분석된 요약 데이터가 아직 기록되지 않았습니다.</span>
                            <span className="text-xs text-white/30 leading-normal">
                              첫 일일 퀘스트를 완료하거나 하루를 시뮬레이션(1틱 진행)하면 그날의 요약 스냅샷이 생성됩니다.
                            </span>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}

              {/* [TAB 2] 국가별 상세 현황 */}
              {activeReportTab === 'country' && (
                <div className="space-y-6">
                  {(() => {
                    const regionState = livingWorld.regions[selectedReportRegionId]
                    if (!regionState) {
                      return <div className="text-center py-20 text-zinc-500">지정된 국가의 상태 데이터를 찾을 수 없습니다.</div>
                    }
                    const regionMeta = RIFT_REGIONS.find(r => r.id === selectedReportRegionId)
                    const flag = REGION_FLAGS[selectedReportRegionId] || '🌐'
                    const regionName = regionMeta?.name ?? selectedReportRegionId.toUpperCase()
                    const totalPower = getRegionTotalPower(regionState, livingWorld.namedHunters)
                    const activeGatesCount = regionState.activeGateIds.length

                    const regionHunters = regionState.namedHunterIds
                      .map(id => livingWorld.namedHunters[id])
                      .filter(Boolean)
                    const aliveHuntersCount = regionHunters.filter(h => h.status !== 'dead').length

                    const regionGates = regionState.activeGateIds
                      .map(id => livingWorld.riftNodes[id])
                      .filter(Boolean)

                    const occupiedMonarch = livingWorld.activeMonarchs?.find(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(selectedReportRegionId))

                    return (
                      <div className="flex flex-col gap-6">
                        {/* 1. 상단 요약 배너 */}
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                          <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[90px]">
                            <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">국가 정보</span>
                            <div className="text-xl font-black text-white flex items-center gap-1.5 mt-1 truncate">
                              <span>{flag}</span>
                              <span className="truncate">{regionName}</span>
                            </div>
                            <span className="text-[9px] text-white/30 font-mono mt-1">CODE: {selectedReportRegionId.toUpperCase()}</span>
                          </div>

                          <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[90px]">
                            <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">지역 오염도</span>
                            <div className={`text-2xl font-black mt-1 ${
                              regionState.corruption >= 70 ? 'text-red-500 animate-pulse' :
                              regionState.corruption >= 30 ? 'text-orange-400' :
                              'text-emerald-400'
                            }`}>
                              {regionState.corruption}%
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1">
                              <div 
                                className={`h-full bg-gradient-to-r ${
                                  regionState.corruption >= 70 ? 'from-orange-500 to-red-500' :
                                  regionState.corruption >= 30 ? 'from-yellow-400 to-orange-500' :
                                  'from-cyan-400 to-emerald-400'
                                }`}
                                style={{ width: `${regionState.corruption}%` }}
                              />
                            </div>
                          </div>

                          <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[90px]">
                            <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">국가 총전력</span>
                            <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">
                              {totalPower.toLocaleString()}
                            </div>
                            <span className="text-[9px] text-white/40 mt-1 leading-none font-mono">네임드 + 보정 익명풀</span>
                          </div>

                          <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[90px]">
                            <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">네임드 헌터</span>
                            <div className="text-2xl font-black text-white mt-1 font-mono">
                              {aliveHuntersCount} / {regionHunters.length}
                            </div>
                            <span className="text-[9px] text-white/40 mt-1 leading-none">생존 헌터 수</span>
                          </div>
                        </div>

                        {/* 점령 위기 상태 경보 */}
                        {occupiedMonarch && (
                          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-bold animate-pulse flex items-center gap-2">
                            <span className="text-base">⚠️</span>
                            <span>침공 비상사태: 현재 심연의 군주 [{MONARCHS.find(m => m.id === occupiedMonarch.monarchId)?.name ?? occupiedMonarch.monarchId}]에 의해 국가 영토가 완전히 잠식되었습니다!</span>
                          </div>
                        )}

                        {/* 2. 메인 양방향 레이아웃 (좌: 헌터 리스트, 우: 성향 프로필 & 활성 게이트) */}
                        <div className="flex flex-col lg:flex-row gap-6">
                          
                          {/* 소속 네임드 헌터 (좌) */}
                          <div className="flex-1 bg-black/20 border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col min-h-[300px]">
                            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2 border-b border-white/10 pb-3 mb-4 uppercase">
                              👥 소속 네임드 헌터 현황 ({aliveHuntersCount}명 생존 / {regionHunters.length}명)
                            </h3>
                            
                            <div className="space-y-2.5 overflow-y-auto max-h-[450px] pr-1 flex-1 scrollbar-thin">
                              {regionHunters.map(hunter => {
                                const trait = getHunterTrait(hunter.traitId)
                                const effectivePower = hunter.power + (hunter.equipmentScore ?? 0)
                                const topEquips = (hunter.equipmentItems ?? []).slice(0, 2)
                                
                                const statusBadge = 
                                  hunter.status === 'dead' ? (
                                    <span className="rounded bg-red-500/25 border border-red-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-red-200 shrink-0">전사</span>
                                  ) : hunter.status === 'injured' ? (
                                    <span className="rounded bg-orange-500/25 border border-orange-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-orange-200 shrink-0">부상 ({hunter.injuredTurns}일)</span>
                                  ) : (
                                    <span className="rounded bg-emerald-500/25 border border-emerald-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-emerald-200 shrink-0">정상</span>
                                  )

                                return (
                                  <div 
                                    key={hunter.id} 
                                    className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                      hunter.status === 'dead' 
                                        ? 'border-red-950 bg-red-950/5 opacity-40 text-white/40' 
                                        : 'border-white/5 bg-black/20 hover:bg-white/5 text-white/80'
                                    }`}
                                  >
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`chip shrink-0 text-[8.5px] font-extrabold ${
                                          hunter.rank === 'National' 
                                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 font-black' 
                                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30 font-bold'
                                        }`}>
                                          {hunter.rank}
                                        </span>
                                        <span className={`text-xs font-black ${hunter.status === 'dead' ? 'line-through text-white/30' : 'text-white'}`}>
                                          {hunter.name}
                                        </span>
                                        {statusBadge}
                                        
                                        {trait && (
                                          <div className="relative group shrink-0 select-none">
                                            <span className="rounded bg-cyan-500/10 border border-cyan-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-cyan-300 cursor-help">
                                              🏷️ {trait.name}
                                            </span>
                                            {/* 툴팁 */}
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 bg-zinc-950 border border-cyan-500/40 text-[9.5px] text-cyan-200 p-2 rounded shadow-2xl z-50 text-center leading-normal">
                                              <p className="font-extrabold mb-0.5">특성: {trait.name}</p>
                                              <p className="opacity-85 font-mono text-[8.5px]">{trait.description}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* 보유 장비 */}
                                      {topEquips.length > 0 && (
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <span className="text-[8.5px] text-white/30 font-bold">장비:</span>
                                          {topEquips.map((eq, eIdx) => {
                                            let rarityClass = 'text-zinc-400 bg-zinc-400/5 border-zinc-400/20'
                                            if (eq.rarity === 'legendary') rarityClass = 'text-amber-400 bg-amber-400/10 border-amber-400/30 font-extrabold'
                                            else if (eq.rarity === 'epic') rarityClass = 'text-purple-400 bg-purple-400/10 border-purple-400/30 font-bold'
                                            else if (eq.rarity === 'rare') rarityClass = 'text-blue-400 bg-blue-400/10 border-blue-400/30'
                                            return (
                                              <span key={eIdx} className={`rounded px-1.5 py-0.2 text-[8px] border ${rarityClass}`}>
                                                {eq.name}
                                              </span>
                                            )
                                          })}
                                          {(hunter.equipmentItems?.length ?? 0) > 2 && (
                                            <span className="text-[8px] text-white/30 font-mono">
                                              외 {(hunter.equipmentItems?.length ?? 0) - 2}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="text-left sm:text-right shrink-0 flex flex-col justify-center">
                                      <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider leading-none">실효 전투력</span>
                                      <span className="text-sm font-black text-cyan-300 font-mono mt-1">
                                        {effectivePower.toLocaleString()}
                                      </span>
                                      <span className="text-[8px] text-white/45 font-mono mt-0.5 leading-none">
                                        {hunter.power.toLocaleString()} + ⚙️{hunter.equipmentScore.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* 성향 및 게이트 목록 (우) */}
                          <div className="w-full lg:w-[45%] flex flex-col gap-6">
                            
                            {/* 국가 성향 프로필 */}
                            <div className="bg-black/20 border border-white/5 rounded-xl p-4 sm:p-5">
                              <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2 border-b border-white/10 pb-3 mb-4 uppercase">
                                📊 국가 정책 및 성향 프로필
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-[9px] font-bold text-white/55 mb-1">
                                    <span>🛡️ 신중 전략</span>
                                    <span className="text-amber-400 font-mono">위험 감수 성향 ({(regionState.riskAppetite * 100).toFixed(0)}%)</span>
                                    <span>⚔️ 무모 돌격</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" style={{ width: `${regionState.riskAppetite * 100}%` }} />
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-white border border-black shadow" style={{ left: `${regionState.riskAppetite * 100}%` }} />
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between text-[9px] font-bold text-white/55 mb-1">
                                    <span>👑 소수 정예 (S급 중심)</span>
                                    <span className="text-cyan-400 font-mono">인력 편성 전략 ({(regionState.populationStyle * 100).toFixed(0)}%)</span>
                                    <span>👥 물량 대중 (A~C급 풀)</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                    <div className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500" style={{ width: `${regionState.populationStyle * 100}%` }} />
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-white border border-black shadow" style={{ left: `${regionState.populationStyle * 100}%` }} />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between text-[9px] font-bold text-white/55 mb-1">
                                    <span>📈 안정 지향</span>
                                    <span className="text-pink-400 font-mono">훈련 방식 지향 ({(regionState.growthBias * 100).toFixed(0)}%)</span>
                                    <span>🔥 성장 급진</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ width: `${regionState.growthBias * 100}%` }} />
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-white border border-black shadow" style={{ left: `${regionState.growthBias * 100}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 활성 게이트 목록 */}
                            <div className="bg-black/20 border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col flex-1 min-h-[220px]">
                              <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2 border-b border-white/10 pb-3 mb-4 uppercase">
                                🌀 활성 차원 균열 게이트 ({activeGatesCount}개)
                              </h3>
                              
                              <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1 flex-1 scrollbar-thin">
                                {regionGates.length === 0 ? (
                                  <div className="text-zinc-500 italic py-10 text-center text-xs flex items-center justify-center flex-1">
                                    🛡️ 이 지역에는 활성화된 차원 균열 게이트가 존재하지 않습니다.
                                  </div>
                                ) : (
                                  regionGates.map(gate => {
                                    const isS = gate.isSGrade || gate.difficultyRank === 'S' || gate.difficultyRank === 'National'
                                    return (
                                      <div key={gate.id} className="p-3 bg-zinc-950/40 border border-white/5 rounded-lg flex items-center justify-between text-xs transition-all hover:bg-white/5">
                                        <div className="flex items-center gap-2">
                                          <span className={`chip shrink-0 font-extrabold text-[8.5px] scale-90 ${
                                            isS ? 'bg-red-500/25 text-red-400 border-red-500/30' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20'
                                          }`}>
                                            {gate.difficultyRank || 'C'}급
                                          </span>
                                          <div>
                                            <span className="font-bold text-white/80 block">{gate.name}</span>
                                            <span className="text-[9px] text-white/40 block mt-0.5">권장 CP: {gate.difficulty.toLocaleString()}</span>
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className={`font-mono font-black block ${
                                            gate.daysRemaining <= 3 ? 'text-red-400 animate-pulse' : 'text-zinc-400'
                                          }`}>
                                            폭주 {gate.daysRemaining}일 전
                                          </span>
                                          {gate.loveCall?.active && (
                                            <span className="block text-[8px] text-amber-300 font-extrabold mt-0.5 animate-bounce">
                                              📞 지원 요청
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })
                                )}
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* 하단 15개국 국가 빠른 전환 네비게이션 */}
                        <div className="border-t border-white/5 pt-4">
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-2">국가 빠른 전환</span>
                          <div className="flex flex-wrap gap-1.5">
                            {RIFT_REGIONS.map(reg => {
                              const isSelected = reg.id === selectedReportRegionId
                              const regFlag = REGION_FLAGS[reg.id] || '🌐'
                              return (
                                <button
                                  key={reg.id}
                                  onClick={() => setSelectedReportRegionId(reg.id)}
                                  className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                                    isSelected
                                      ? 'bg-zinc-800 text-white border-white/20 font-black shadow-md'
                                      : 'bg-zinc-950/40 text-white/55 border-white/5 hover:bg-white/5 hover:text-white'
                                  }`}
                                >
                                  <span>{regFlag}</span>
                                  <span>{reg.name}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* [TAB 3] 세계 헌터 랭킹 */}
              {activeReportTab === 'hunter' && (
                <div className="space-y-6">
                  {/* 랭킹 서브 탭 바 */}
                  <div className="flex gap-1 bg-black/30 p-0.5 rounded border border-white/5 self-start w-fit">
                    <button
                      onClick={() => setHunterRankingSubTab('individual')}
                      className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        hunterRankingSubTab === 'individual'
                          ? 'bg-zinc-800 text-white border border-white/10'
                          : 'text-white/45 hover:text-white'
                      }`}
                    >
                      👤 개별 헌터 순위
                    </button>
                    <button
                      onClick={() => setHunterRankingSubTab('region')}
                      className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        hunterRankingSubTab === 'region'
                          ? 'bg-zinc-800 text-white border border-white/10'
                          : 'text-white/45 hover:text-white'
                      }`}
                    >
                      🛡️ 국가별 종합 전력
                    </button>
                  </div>

                  {/* 랭킹 내용물 */}
                  {hunterRankingSubTab === 'individual' ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto rounded-lg border border-white/5 bg-black/20 scrollbar-thin">
                        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                          <thead>
                            <tr className="border-b border-white/10 bg-zinc-950/60 text-white/55 font-bold uppercase tracking-wider text-[9px]">
                              <th className="p-3 w-14 text-center">순위</th>
                              <th className="p-3 w-28">국가</th>
                              <th className="p-3 w-36">헌터명</th>
                              <th className="p-3 w-28 text-center">특성</th>
                              <th className="p-3 w-44">대표 보유 장비</th>
                              <th className="p-3 text-right">실효 전투력 (CP)</th>
                              <th className="p-3 w-20 text-center">상태</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const allHunters = Object.values(livingWorld.namedHunters).map(h => {
                                const effectivePower = h.power + (h.equipmentScore ?? 0)
                                return {
                                  ...h,
                                  effectivePower
                                }
                              }).sort((a, b) => b.effectivePower - a.effectivePower)

                              return allHunters.map((hunter, index) => {
                                const rankNum = index + 1
                                const trait = getHunterTrait(hunter.traitId)
                                const regionMeta = RIFT_REGIONS.find(r => r.id === hunter.regionId)
                                const flag = REGION_FLAGS[hunter.regionId] || '🌐'
                                
                                let rankBadge = <span className="font-mono text-zinc-400 font-bold">{rankNum}</span>
                                if (rankNum === 1) rankBadge = <span className="text-base select-none">🥇</span>
                                else if (rankNum === 2) rankBadge = <span className="text-base select-none">🥈</span>
                                else if (rankNum === 3) rankBadge = <span className="text-base select-none">🥉</span>

                                let rowBgClass = hunter.status === 'dead' 
                                  ? 'opacity-40 bg-red-950/5 text-white/35 line-through decoration-red-900/50' 
                                  : rankNum <= 3
                                    ? 'bg-amber-500/5 hover:bg-amber-500/10'
                                    : 'hover:bg-white/5'

                                const topEquips = (hunter.equipmentItems ?? []).slice(0, 2)

                                const statusBadge = 
                                  hunter.status === 'dead' ? (
                                    <span className="rounded bg-red-500/20 border border-red-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-red-300">전사</span>
                                  ) : hunter.status === 'injured' ? (
                                    <span className="rounded bg-orange-500/20 border border-orange-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-orange-300">부상 ({hunter.injuredTurns}일)</span>
                                  ) : (
                                    <span className="rounded bg-emerald-500/20 border border-emerald-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-emerald-300">정상</span>
                                  )

                                return (
                                  <tr key={hunter.id} className={`border-b border-white/5 transition-all text-white/80 ${rowBgClass}`}>
                                    <td className="p-3 text-center font-bold">{rankBadge}</td>
                                    <td className="p-3 font-semibold">
                                      <span className="flex items-center gap-1.5 truncate cursor-pointer hover:text-white" onClick={() => openReport('country', hunter.regionId)}>
                                        <span>{flag}</span>
                                        <span className="truncate">{regionMeta?.name ?? hunter.regionId.toUpperCase()}</span>
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className={`chip shrink-0 text-[8.5px] scale-90 ${
                                          hunter.rank === 'National' 
                                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 font-black' 
                                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30 font-bold'
                                        }`}>
                                          {hunter.rank}
                                        </span>
                                        <span className="font-extrabold truncate">{hunter.name}</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-center">
                                      {trait ? (
                                        <div className="relative group inline-block select-none">
                                          <span className="rounded bg-cyan-500/10 border border-cyan-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-cyan-300 cursor-help">
                                            🏷️ {trait.name}
                                          </span>
                                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 bg-zinc-950 border border-cyan-500/40 text-[9.5px] text-cyan-200 p-2 rounded shadow-2xl z-50 text-center leading-normal">
                                            <p className="font-extrabold mb-0.5">특성: {trait.name}</p>
                                            <p className="opacity-85 font-mono text-[8.5px]">{trait.description}</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-white/20">-</span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {topEquips.length > 0 ? (
                                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                                          {topEquips.map((eq, eIdx) => {
                                            let rarityClass = 'text-zinc-400 bg-zinc-400/5 border-zinc-400/20'
                                            if (eq.rarity === 'legendary') rarityClass = 'text-amber-400 bg-amber-400/10 border-amber-400/30 font-extrabold'
                                            else if (eq.rarity === 'epic') rarityClass = 'text-purple-400 bg-purple-400/10 border-purple-400/30 font-bold'
                                            else if (eq.rarity === 'rare') rarityClass = 'text-blue-400 bg-blue-400/10 border-blue-400/30'
                                            return (
                                              <span key={eIdx} className={`rounded px-1.5 py-0.2 text-[8px] border ${rarityClass} truncate max-w-[100px]`}>
                                                {eq.name}
                                              </span>
                                            )
                                          })}
                                          {(hunter.equipmentItems?.length ?? 0) > 2 && (
                                            <span className="text-[8px] text-white/30 font-mono">+{hunter.equipmentItems!.length - 2}</span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-white/20 font-mono text-[9px]">-</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <span className="font-mono text-cyan-300 font-extrabold text-[11px] block">
                                        {hunter.effectivePower.toLocaleString()}
                                      </span>
                                      <span className="font-mono text-white/40 text-[8.5px] block leading-none mt-0.5">
                                        {hunter.power.toLocaleString()} + ⚙️{hunter.equipmentScore.toLocaleString()}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">{statusBadge}</td>
                                  </tr>
                                )
                              })
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto rounded-lg border border-white/5 bg-black/20 scrollbar-thin">
                        <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                          <thead>
                            <tr className="border-b border-white/10 bg-zinc-950/60 text-white/55 font-bold uppercase tracking-wider text-[9px]">
                              <th className="p-3 w-14 text-center">순위</th>
                              <th className="p-3">국가명</th>
                              <th className="p-3 text-center">활성 게이트</th>
                              <th className="p-3 text-center">생존 네임드</th>
                              <th className="p-3 text-right">지역 총전력 (CP)</th>
                              <th className="p-3 text-center">지역 오염도</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const regionPowerRanking = Object.values(livingWorld.regions).map(r => {
                                const power = getRegionTotalPower(r, livingWorld.namedHunters)
                                const meta = RIFT_REGIONS.find(reg => reg.id === r.regionId)
                                const aliveHuntersCount = r.namedHunterIds
                                  .map(id => livingWorld.namedHunters[id])
                                  .filter(Boolean)
                                  .filter(h => h.status !== 'dead').length
                                return {
                                  ...r,
                                  name: meta?.name ?? r.regionId.toUpperCase(),
                                  power,
                                  aliveHuntersCount
                                }
                              }).sort((a, b) => b.power - a.power)

                              return regionPowerRanking.map((region, index) => {
                                const rankNum = index + 1
                                const flag = REGION_FLAGS[region.regionId] || '🌐'
                                
                                let rankBadge = <span className="font-mono text-zinc-400 font-bold">{rankNum}</span>
                                if (rankNum === 1) rankBadge = <span className="text-base select-none">🥇</span>
                                else if (rankNum === 2) rankBadge = <span className="text-base select-none">🥈</span>
                                else if (rankNum === 3) rankBadge = <span className="text-base select-none">🥉</span>

                                return (
                                  <tr key={region.regionId} className="border-b border-white/5 hover:bg-white/5 transition-all text-white/80">
                                    <td className="p-3 text-center font-bold">{rankBadge}</td>
                                    <td className="p-3 font-extrabold flex items-center gap-2">
                                      <span className="text-sm">{flag}</span>
                                      <span className="cursor-pointer hover:text-white" onClick={() => openReport('country', region.regionId)}>{region.name}</span>
                                      {region.regionId === 'kr' && (
                                        <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[7px] font-bold text-sky-300 border border-sky-500/30 uppercase scale-90">거점</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center font-mono font-bold text-amber-300">
                                      {region.activeGateIds.length}개
                                    </td>
                                    <td className="p-3 text-center font-mono font-bold">
                                      {region.aliveHuntersCount} / {region.namedHunterIds.length}
                                    </td>
                                    <td className="p-3 text-right font-mono text-cyan-300 font-extrabold text-[11px]">
                                      {region.power.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`font-mono font-bold ${
                                        region.corruption >= 70 ? 'text-red-400 animate-pulse font-black' :
                                        region.corruption >= 30 ? 'text-orange-400' :
                                        'text-emerald-400'
                                      }`}>
                                        {region.corruption}%
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* 통합 푸터 액션 바 */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-3 items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openReport('daily')}
                  className={`rounded border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeReportTab === 'daily'
                      ? 'bg-white/10 border-white/20 text-white cursor-default pointer-events-none'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  📊 일일 정세 보고
                </button>
                <button
                  onClick={() => openReport('country', selectedReportRegionId)}
                  className={`rounded border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeReportTab === 'country'
                      ? 'bg-white/10 border-white/20 text-white cursor-default pointer-events-none'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  🛡️ 국가별 상세 현황
                </button>
                <button
                  onClick={() => openReport('hunter')}
                  className={`rounded border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeReportTab === 'hunter'
                      ? 'bg-white/10 border-white/20 text-white cursor-default pointer-events-none'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  🏆 세계 헌터 랭킹
                </button>
              </div>

              {activeReportTab === 'daily' && (
                <button
                  onClick={() => {
                    setActiveReportTab(null)
                    setIsAllLogsExpanded(true)
                    setTimeout(() => {
                      const logTerminal = document.querySelector('.panel.border-white\\/10')
                      logTerminal?.scrollIntoView({ behavior: 'smooth' })
                    }, 150)
                  }}
                  className="rounded border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/25 px-4 py-1.5 text-xs font-black text-cyan-200 cursor-pointer transition-all"
                >
                  전체 사건 로그 모아보기
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
