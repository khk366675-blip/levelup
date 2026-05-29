import { useState } from 'react'
import {
  Globe,
  Lock,
  Eye,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  X,
  Swords,
} from 'lucide-react'
import { useGame } from '../lib/store'
import { RIFT_REGIONS, RIFT_NODES } from '../lib/seed'
import { getRegionProgress, RIFT_NODE_STATUS_META } from '../lib/riftWorld'
import { getRegionTotalPower } from '../lib/livingWorld'
import { GatePanel } from './GatePanel'
import type { RiftNode, RiftNodeStatus, RiftRegion } from '../lib/types'

export function WorldMapPanel() {
  const riftNodesState = useGame((s) => s.riftNodes ?? {})
  const activeRiftNodeId = useGame((s) => s.activeRiftNodeId)
  const activeGate = useGame((s) => s.activeGate)
  const discoverRiftNode = useGame((s) => s.discoverRiftNode)
  const enterRiftNode = useGame((s) => s.enterRiftNode)
  const livingWorld = useGame((s) => s.livingWorld)

  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(null)

  const [selectedNode, setSelectedNode] = useState<RiftNode | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

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
    } else if (status === 'locked') {
      // 선행 조건 설명 취합
      const reqNames = (node.requiresNodeIds ?? [])
        .map((reqId: string) => RIFT_NODES.find((rn: any) => rn.id === reqId)?.name ?? reqId)
        .join(', ')
      triggerToast(`🔒 이 구역은 잠겨있습니다. 선행 정화 필요: [${reqNames}]`)
    } else {
      // active 또는 cleared
      setSelectedNode(node)
    }
  }

  const handleEnterGate = (node: RiftNode) => {
    enterRiftNode(node.id)
    triggerToast(`[${node.name}] 균열 탐색 및 전투 준비 돌입!`)
  }

  // 현재 노드의 활성 게이트가 켜져 있는지 여부
  const isGateActive =
    activeGate &&
    activeGate.status === 'active' &&
    activeRiftNodeId &&
    RIFT_NODES.some((rn: any) => rn.id === activeRiftNodeId)

  return (
    <div className="space-y-6">
      {/* 균열 상태 토스트 안내 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-purple-500/30 bg-ink-950 px-4 py-3 text-sm text-purple-200 shadow-glow-purple">
          <AlertCircle className="h-4 w-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

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

      {/* MVP-2 World Status Dashboard */}
      {livingWorld && (
        <div className="grid gap-4 md:grid-cols-3 animate-fade-in">
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
              오염도가 30%, 50%, 70%, 85%, 95%를 초과할 때마다 더 강력한 군주가 강림합니다.
            </p>
          </div>

          {/* Box 2: Incident Logs Terminal */}
          <div className="panel corner-bracket border-white/10 bg-ink-950/40 p-4 md:col-span-2 flex flex-col justify-between">
            <div className="br" />
            <div className="flex items-center justify-between text-xs font-bold text-white/70 mb-2">
              <span className="text-cyan-300 flex items-center gap-1.5 font-bold">
                <Swords className="h-4 w-4" /> 세계 동적 사건 로그
              </span>
              <button
                onClick={() => {
                  useGame.getState().debugAdvanceLivingWorldDay()
                  triggerToast("🔮 차원의 시간이 하루 흘렀습니다. 세계가 스스로 1틱 시뮬레이션되었습니다.")
                }}
                className="rounded-md border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/25 px-2 py-0.5 text-[9px] font-black text-purple-200 transition-all cursor-pointer"
              >
                ⏩ 하루 강제 진행 (디버그)
              </button>
            </div>
            
            <div className="h-28 overflow-y-auto rounded bg-black/45 border border-white/5 p-2 font-mono text-[9px] text-white/75 space-y-1 scrollbar-thin scrollbar-thumb-purple-500/20">
              {livingWorld.eventLogs.slice().reverse().map((log, idx) => (
                <div key={idx} className={`${
                  log.includes('전사') || log.includes('폭주') || log.includes('위험') ? 'text-red-400' :
                  log.includes('부상') || log.includes('퇴각') || log.includes('실패') ? 'text-yellow-400' :
                  log.includes('성공') || log.includes('완치') ? 'text-emerald-400' :
                  log.includes('군주') ? 'text-purple-300 font-bold' :
                  'text-white/70'
                }`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 국가 진행도 목록 */}
        <div className="space-y-3 lg:col-span-1">
          <div className="panel corner-bracket border-white/10 bg-ink-950/40 p-4">
            <div className="br" />
            <h3 className="mb-3 text-sm font-bold text-white/80">국가별 정화도</h3>
            <div className="space-y-3">
              {RIFT_REGIONS.map((region: RiftRegion) => {
                const prog = getRegionProgress(region.id, riftNodesState)
                const regionState = livingWorld?.regions[region.id]
                const totalPower = regionState ? getRegionTotalPower(regionState, livingWorld.namedHunters) : 0
                const namedCount = regionState ? regionState.namedHunterIds.length : 0
                const isExpanded = expandedRegionId === region.id

                return (
                  <div key={region.id} className="rounded border border-white/5 bg-ink-950/20 p-2.5 transition-all hover:bg-white/5">
                    <div
                      className="flex items-center justify-between text-xs cursor-pointer select-none"
                      onClick={() => setExpandedRegionId(isExpanded ? null : region.id)}
                    >
                      <span className="font-bold text-white/70 flex items-center gap-1.5">
                        {region.name}
                        {region.id === 'kr' && (
                          <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[8px] font-bold text-sky-300 border border-sky-500/30">
                            거점
                          </span>
                        )}
                      </span>
                      <span className="text-purple-300 font-medium text-[11px]">
                        {prog.cleared}/{prog.total} 정화 ({prog.percent}%)
                      </span>
                    </div>

                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${prog.percent}%` }}
                      />
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/45">
                      <span>총 전력: <span className="font-bold text-cyan-300">{totalPower > 0 ? `${(totalPower / 1000).toFixed(0)}k` : '계산 중'}</span></span>
                      <span>오염도: <span className={`font-bold ${regionState && regionState.corruption >= 50 ? 'text-red-400 animate-pulse' : regionState && regionState.corruption >= 20 ? 'text-yellow-300' : 'text-emerald-400'}`}>{regionState ? `${regionState.corruption}%` : '0%'}</span></span>
                      <span>활성 게이트: <span className="font-bold text-purple-300">{regionState ? regionState.activeGateIds.length : 0}개</span></span>
                    </div>

                    {/* 5축 프로파일 디버그 및 네임드 상세 펼치기 */}
                    {isExpanded && regionState && (
                      <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-2 text-[10px] text-white/60">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-black/35 rounded p-2">
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
                          <div className="flex justify-between col-span-2">
                            <span className="text-white/40">부유함</span>
                            <span className="font-bold text-purple-400">{(regionState.wealth * 100).toFixed(0)}%</span>
                          </div>
                        </div>

                        {/* 네임드 헌터 명단 */}
                        <div className="space-y-1">
                          <div className="text-[9px] font-bold text-white/40 mb-1">소속 네임드 헌터</div>
                          {regionState.namedHunterIds.map((hunterId) => {
                            const hunter = livingWorld?.namedHunters[hunterId]
                            if (!hunter) return null
                            return (
                              <div key={hunterId} className="flex items-center justify-between bg-white/5 px-2 py-1 rounded">
                                <span className="font-bold text-white/80">{hunter.name}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="rounded bg-purple-500/20 px-1 text-[8px] font-black text-purple-300 border border-purple-500/30">
                                    {hunter.rank}
                                  </span>
                                  <span className="text-cyan-300 font-mono text-[9px] font-bold">
                                    ⚔️{(hunter.power / 1000).toFixed(0)}k
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 구역 요약 상세 패널 */}
          {selectedNode ? (
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
                  className="rounded p-1 hover:bg-white/5 text-white/45 hover:text-white"
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
                {/* MVP-2 구역 권장 전력 및 시한 */}
                {(selectedNode.difficulty ?? 0) > 0 && (
                  <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                    <span className="text-white/45">권장 전투력</span>
                    <span className="font-bold text-pink-300">
                      {(selectedNode.difficulty ?? 0).toLocaleString()} CP
                    </span>
                  </div>
                )}
                {selectedNode.daysRemaining !== undefined && (
                  <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                    <span className="text-white/45">소멸/폭주 시한</span>
                    <span className={`font-bold ${(selectedNode.daysRemaining ?? 0) <= 3 ? 'text-red-400 animate-pulse' : 'text-yellow-300'}`}>
                      {selectedNode.daysRemaining}일 남음 / 총 {selectedNode.deadline}일
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                  <span className="text-white/45">매핑 게이트 ID</span>
                  <span className="text-white/70 font-mono text-[10px]">
                    {selectedNode.gateDefId}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                {(riftNodesState[selectedNode.id] ?? selectedNode.status) ===
                'cleared' ? (
                  <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200 text-center">
                    이미 완전히 정화된 구역입니다. 재진입이 가능합니다.
                  </div>
                ) : null}

                <button
                  onClick={() => handleEnterGate(selectedNode)}
                  disabled={
                    (riftNodesState[selectedNode.id] ?? selectedNode.status) ===
                    'locked'
                  }
                  className="btn btn-primary mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs"
                >
                  <Swords className="h-4 w-4" />
                  균열 정화 개시
                </button>
              </div>
            </div>
          ) : (
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
              [ DIMENSIONAL RIFT MAP - MVP-1 ]
            </div>

            {/* 국가(Region) 레이블 렌더링 */}
            {RIFT_REGIONS.map((region: RiftRegion) => {
              const prog = getRegionProgress(region.id, riftNodesState)
              const regionState = livingWorld?.regions[region.id]
              const totalPower = regionState ? getRegionTotalPower(regionState, livingWorld.namedHunters) : 0
              return (
                <div
                  key={region.id}
                  className="absolute pointer-events-none flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${region.labelX}%`, top: `${region.labelY}%` }}
                >
                  <div className="rounded-full bg-black/70 border border-white/5 px-2 py-0.5 text-[10px] font-black text-white/60 backdrop-blur-sm">
                    {region.name}
                  </div>
                  <div className="text-[8px] text-purple-300/80 font-mono mt-0.5 whitespace-nowrap bg-black/40 px-1 rounded">
                    ({prog.cleared}/{prog.total}){totalPower > 0 ? ` ⚔️${(totalPower / 1000).toFixed(0)}k` : ''}
                  </div>
                </div>
              )
            })}

            {/* 노드(Node) 마커 렌더링 */}
            {RIFT_NODES.map((node: any) => {
              const status = riftNodesState[node.id] ?? node.status
              const meta = RIFT_NODE_STATUS_META[status]

              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-300 z-10`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  {/* 노드 링과 코어 */}
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${meta.borderClass} ${meta.bgClass} flex items-center justify-center transition-all group-hover:scale-125 group-hover:border-purple-400`}
                  >
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
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>

                  {/* 마커 아래 노드명 말풍선 */}
                  <div className="mt-1 opacity-60 group-hover:opacity-100 transition-all">
                    <div className="rounded bg-black/80 border border-white/5 px-1.5 py-0.5 text-[9px] font-bold text-white/70 backdrop-blur-sm whitespace-nowrap shadow-md">
                      {node.name}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 인라인 게이트 활성화 HUD (현재 균열에 진입한 경우) */}
      {isGateActive && (
        <div className="panel corner-bracket border-purple-500/40 bg-purple-950/10 p-6 animate-fade-in relative">
          <div className="br" />
          <div className="absolute top-4 right-4 z-10">
            <span className="rounded-full bg-purple-500/20 border border-purple-400/30 px-3 py-1 text-[10px] font-black text-purple-200 tracking-widest animate-pulse">
              균열 정화 전선 활성화
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Swords className="h-5 w-5 text-purple-400" />
              진입한 구역: {RIFT_NODES.find((rn: any) => rn.id === activeRiftNodeId)?.name}
            </h3>
            <p className="text-xs text-white/45 mt-1">
              게이트를 클리어하면 해당 월드맵 노드의 정화도가 올라가고 후속 노드가 해제됩니다.
            </p>
          </div>

          {/* 기존 GatePanel의 전투 모듈을 그대로 인라인 배치하여 자연스럽게 연결 */}
          <div className="border-t border-white/5 pt-4 bg-ink-950/20 rounded-lg p-2 sm:p-4">
            <GatePanel />
          </div>
        </div>
      )}
    </div>
  )
}
