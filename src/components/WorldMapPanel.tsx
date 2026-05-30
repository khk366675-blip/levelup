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
  Shield,
  Zap,
} from 'lucide-react'
import { useGame } from '../lib/store'
import { RIFT_REGIONS, RIFT_NODES } from '../lib/seed'
import { MONARCHS } from '../lib/monarchs'
import { getRegionProgress, RIFT_NODE_STATUS_META } from '../lib/riftWorld'
import { getRegionTotalPower } from '../lib/livingWorld'
import { GatePanel } from './GatePanel'
import type { RiftNode, RiftRegion } from '../lib/types'
import { getHunterCombatPower } from '../lib/combatPower'
import { todayKey } from '../lib/game'
import { DramaticReveal, type RevealStep } from './DramaticReveal'
import { CinematicLogOverlay, type CinematicLogData, type CinematicLogTone } from './CinematicLogOverlay'

// 배틀 로그를 CinematicLogData로 매핑해주는 헬퍼 함수
const mapTurnsToCinematicLogs = (turns: any[]): CinematicLogData[] => {
  return turns.map((t, idx) => {
    let tone: CinematicLogTone = 'system'
    let badge = `Turn ${t.turnNumber || idx + 1}`
    let title = t.message || ''
    let body = ''

    if (t.outcome === 'damage') {
      tone = t.actorType === 'player' ? 'player' : 'monster'
      badge = t.actorType === 'player' ? '플레이어 차례' : '몬스터 차례'
    } else if (t.outcome === 'heal') {
      tone = 'reward'
      badge = '치유'
    } else if (t.outcome === 'miss' || t.outcome === 'evade') {
      tone = 'defense'
      badge = '회피/명중 실패'
    } else if (t.eventType === 'reaction') {
      tone = 'shadow'
      badge = '그림자 수호'
    } else if (t.message && t.message.includes('그림자')) {
      tone = 'shadow'
      badge = '그림자 출격'
    }

    return {
      id: `world-log-${idx}-${Date.now()}`,
      tone,
      badge,
      title,
      body,
    }
  })
}

export function WorldMapPanel() {
  const riftNodesState = useGame((s) => s.riftNodes ?? {})
  const activeRiftNodeId = useGame((s) => s.activeRiftNodeId)
  const activeGate = useGame((s) => s.activeGate)
  const discoverRiftNode = useGame((s) => s.discoverRiftNode)
  const enterRiftNode = useGame((s) => s.enterRiftNode)
  const livingWorld = useGame((s) => s.livingWorld)

  // L3 전용 신설 월드맵 상태 및 액션 연동
  const activeWorldBattle = useGame((s) => s.activeWorldBattle)
  const worldBattleRetreats = useGame((s) => s.worldBattleRetreats ?? {})
  const manualSession = useGame((s) => s.manualBattleSession)
  const startWorldBattle = useGame((s) => s.startWorldBattle)
  const startWorldManualBattle = useGame((s) => s.startWorldManualBattle)
  const cancelWorldBattle = useGame((s) => s.cancelWorldBattle)
  const resolveWorldBattle = useGame((s) => s.resolveWorldBattle)

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
  const [selectedNode, setSelectedNode] = useState<RiftNode | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [selectedHelpers, setSelectedHelpers] = useState<string[]>([])

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

  const COOP_HELP_ATK_FACTOR = 0.005
  const COOP_HELP_DEF_FACTOR = 0.005
  const COOP_HELP_DR_FACTOR = 0.05
  const COOP_HELP_DR_CAP = 0.5
  const COOP_REWARD_PENALTY_PER_HELPER = 0.15
  const COOP_REWARD_MIN_RATIO = 0.3

  const playerBaseAtk = hunter.stats.STR * 4 + hunter.stats.AGI * 2
  const playerBaseDef = hunter.stats.VIT * 4 + hunter.stats.PER * 2
  const coopBuffs = {
    atk: Math.round(playerBaseAtk * COOP_HELP_ATK_FACTOR * coopHelperPower),
    def: Math.round(playerBaseDef * COOP_HELP_DEF_FACTOR * coopHelperPower),
    dr: Math.min(COOP_HELP_DR_CAP, COOP_HELP_DR_FACTOR * coopHelperCount),
    rewardRatio: Math.max(COOP_REWARD_MIN_RATIO, 1 - COOP_REWARD_PENALTY_PER_HELPER * coopHelperCount)
  }

  // 로컬 확인 모달 제어용 상태
  const [showRecklessConfirm, setShowRecklessConfirm] = useState(false)
  const [recklessConfirmType, setRecklessConfirmType] = useState<'auto' | 'manual'>('auto')

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

  // 현재 노드의 활성 게이트가 켜져 있는지 여부 (기존 E/D/C 일반 게이트 전선)
  const isGateActive =
    activeGate &&
    activeGate.status === 'active' &&
    activeRiftNodeId &&
    RIFT_NODES.some((rn: any) => rn.id === activeRiftNodeId) &&
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

  return (
    <div className="space-y-6 relative">
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
                  if (recklessConfirmType === 'auto') {
                    startWorldBattle(selectedNode.id, selectedHelpers)
                  } else {
                    startWorldManualBattle(selectedNode.id, selectedHelpers)
                  }
                }}
                className="rounded border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/25 px-4 py-2 text-xs font-bold text-rose-200 shadow-glow-red hover:text-white transition-all cursor-pointer"
              >
                강행 진입
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 자동 전투 시네마틱 오버레이 */}
      {activeWorldBattle && activeWorldBattle.status === 'revealing' && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center mb-10 animate-pulse">
            <h3 className="text-lg font-black tracking-widest text-purple-400">자동 균열 정화 전투 진행 중</h3>
            <p className="text-xs text-white/40 mt-1">심연의 파동을 억제하고 정화 전선을 구축하는 중입니다...</p>
          </div>
          
          <div className="relative w-full max-w-lg h-56 flex items-center justify-center">
            <CinematicLogOverlay
              visible={true}
              logs={mapTurnsToCinematicLogs(activeWorldBattle.logs)}
              onComplete={() => resolveWorldBattle()}
              intervalMs={2200}
              position="inline"
            />
          </div>
          
          <div className="mt-10">
            <button
              onClick={() => cancelWorldBattle()}
              className="rounded border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-200 tracking-wider transition-all cursor-pointer"
            >
              🏳️ 전투 후퇴 (당일 재진입 제한)
            </button>
          </div>
        </div>
      )}

      {/* 자동 전투 결과 Dramatic Reveal */}
      {activeWorldBattle && activeWorldBattle.status === 'resolved' && activeWorldBattle.result && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="max-w-md w-full mx-4">
            <DramaticReveal
              isOpen={true}
              steps={[
                {
                  title: activeWorldBattle.result.outcome === 'victory' ? '정화 성공' : '정화 실패',
                  text: activeWorldBattle.result.outcome === 'victory' 
                    ? '🎉 균열 정화 완료!' 
                    : '💀 정화 공략 실패...',
                  subtext: activeWorldBattle.result.outcome === 'victory'
                    ? `[${activeWorldBattle.gateName}]의 심연 에너지를 완벽히 차단하고 정화했습니다.`
                    : `[${activeWorldBattle.gateName}] 공략 도중 부상을 당해 복귀했습니다.`,
                }
              ]}
              tone={activeWorldBattle.result.outcome === 'victory' ? 'success' : 'failure'}
              position="inline"
              result={
                <div className="mt-6 space-y-4">
                  {activeWorldBattle.result.outcome === 'victory' ? (
                    <div className="grid gap-2 text-xs font-medium">
                      <div className="text-white/40 text-center mb-1">획득 보상 목록</div>
                      {activeWorldBattle.result.rewards.hunterXp ? (
                        <div className="rounded border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-emerald-300 flex justify-between">
                          <span>전투 정화 XP</span>
                          <span className="font-bold">+{activeWorldBattle.result.rewards.hunterXp} XP</span>
                        </div>
                      ) : null}
                      {activeWorldBattle.result.rewards.gold ? (
                        <div className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-amber-300 flex justify-between">
                          <span>정화 지원금</span>
                          <span className="font-bold">+{activeWorldBattle.result.rewards.gold} Gold</span>
                        </div>
                      ) : null}
                      {activeWorldBattle.result.rewards.shadowEssence ? (
                        <div className="rounded border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-purple-300 flex justify-between">
                          <span>어둠의 정수</span>
                          <span className="font-bold">+{activeWorldBattle.result.rewards.shadowEssence} 정수</span>
                        </div>
                      ) : null}
                      {activeWorldBattle.result.helperHunterIds && activeWorldBattle.result.helperHunterIds.length > 0 && (
                        <div className="rounded border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-purple-300 text-center text-[10px]">
                          <span>🤝 협력한 헌터: </span>
                          <span className="font-bold">
                            {activeWorldBattle.result.helperHunterIds
                              .map(hid => livingWorld?.namedHunters[hid]?.name)
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300/80 text-center">
                      6시간 동안 행동 불능 및 부상 상태가 되며, 회복 퀘스트를 3개 클리어하거나 대기 시간이 지나야 공략을 재개할 수 있습니다.
                    </div>
                  )}
                  
                  <button
                    onClick={() => cancelWorldBattle()} // 세션 클리어용 호출
                    className="btn btn-primary mt-4 w-full py-2.5 text-xs font-black tracking-widest text-center cursor-pointer"
                  >
                    정화 전선 정리 후 복귀
                  </button>
                </div>
              }
            />
          </div>
        </div>
      )}

      {/* 수동 전투 모드 (전체 오버레이 형태로 GatePanel을 렌더링) */}
      {manualSession && manualSession.source === 'world_map' && (
        <div className="fixed inset-0 z-[90] bg-ink-950 overflow-y-auto p-4 sm:p-6 md:p-8 animate-fade-in scrollbar-thin">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Swords className="h-5 w-5" />
                <span className="text-sm font-black tracking-widest">수동 정화 전투 개시</span>
              </div>
              <span className="rounded bg-purple-500/25 px-2.5 py-0.5 text-[10px] font-bold text-purple-200 border border-purple-400/20">
                {manualSession.gateName}
              </span>
            </div>
            
            {/* 그림자 장착 정보 표시 */}
            {equippedShadows.length > 0 && (
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
              <GatePanel />
            </div>
          </div>
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

      {/* 거점 침공 비상 경고 배너 */}
      {livingWorld && livingWorld.homeReachedMonarchId && (
        <div className="panel corner-bracket border-red-500 bg-red-950/20 p-5 shadow-glow-red animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="br" />
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500 animate-bounce" />
            <div>
              <h3 className="text-base font-black text-red-400 tracking-wider">🚨 초비상: 거점 군주 침공</h3>
              <p className="text-xs text-red-200/80 mt-1 leading-relaxed">
                군주 <span className="font-extrabold text-white">[{MONARCHS.find(m => m.id === livingWorld.homeReachedMonarchId)?.name || livingWorld.homeReachedMonarchId}]</span>이(가) 대한민국의 방어선을 돌파하고 거점에 진입했습니다! 즉각 대응하지 않으면 세계가 멸망합니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => triggerToast("⚔️ [L4-B 전투 예고] 군주와의 직접 카드 대결은 다음 업데이트(L4-B)에서 완벽히 오픈됩니다! 현재는 거점 도달 전투 stub 상태입니다.")}
            className="rounded border border-red-500/50 bg-red-500/20 hover:bg-red-500/35 px-4 py-2.5 text-xs font-black text-white tracking-widest transition-all cursor-pointer shadow-glow-red whitespace-nowrap"
          >
            ⚔️ 군주 격퇴전 개시 (L4-B 준비)
          </button>
        </div>
      )}

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
                    return (
                      <div key={monarch.monarchId} className="rounded bg-black/35 border border-white/5 p-1.5 flex items-center justify-between text-[10px]">
                        <div className="flex flex-col">
                          <span className="font-bold text-white/80">{mData.name}</span>
                          <span className="text-[8px] text-white/40 font-mono">서열 {mData.rank}위 | {mData.theme}</span>
                        </div>
                        <div className="text-right">
                          {monarch.status === 'rampaging' ? (
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
          <div className="panel corner-bracket border-white/10 bg-ink-950/40 p-4">
            <div className="br" />
            <h3 className="mb-3 text-sm font-bold text-white/80">국가별 정화도</h3>
            <div className="space-y-3">
              {RIFT_REGIONS.map((region: RiftRegion) => {
                const prog = getRegionProgress(region.id, riftNodesState)
                const regionState = livingWorld?.regions[region.id]
                const totalPower = regionState ? getRegionTotalPower(regionState, livingWorld.namedHunters) : 0
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
                            const hunterObj = livingWorld?.namedHunters[hunterId]
                            if (!hunterObj) return null
                            return (
                              <div key={hunterId} className="flex items-center justify-between bg-white/5 px-2 py-1 rounded">
                                <span className="font-bold text-white/80">{hunterObj.name}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="rounded bg-purple-500/20 px-1 text-[8px] font-black text-purple-300 border border-purple-500/30">
                                    {hunterObj.rank}
                                  </span>
                                  <span className="text-cyan-300 font-mono text-[9px] font-bold">
                                    ⚔️{(hunterObj.power / 1000).toFixed(0)}k
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
              {hasLoveCall && loveCallState && (
                <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-yellow-300">
                    <span>📞 긴급 러브콜 지원 요청</span>
                  </div>
                  <p className="text-[10px] text-white/70 leading-normal">
                    {RIFT_REGIONS.find((r: RiftRegion) => r.id === selectedNode.regionId)?.name} 헌터 협회가 자력 방어가 불가능하여 공식 협조를 요청했습니다.
                  </p>
                  
                  {/* 보상 정보 */}
                  <div className="rounded bg-black/40 p-2 space-y-1 text-[10px]">
                    <div className="text-[9px] font-bold text-white/40 mb-1">약속 보상 (기본)</div>
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
                              <span className="text-cyan-300 font-mono font-bold">⚔️{h.power.toLocaleString()}</span>
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

                    {/* 자동 전투 버튼 */}
                    <button
                      onClick={() => {
                        const level = getDangerLevel(selectedNode)
                        if (level === 'reckless') {
                          setRecklessConfirmType('auto')
                          setShowRecklessConfirm(true)
                        } else {
                          startWorldBattle(selectedNode.id, selectedHelpers)
                        }
                      }}
                      disabled={
                        (riftNodesState[selectedNode.id] ?? selectedNode.status) === 'locked'
                      }
                      className="btn btn-primary w-full flex items-center justify-center gap-2 py-2 text-xs cursor-pointer"
                    >
                      <Swords className="h-4 w-4" />
                      자동 정화 전투 (시네마틱)
                    </button>

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

            {/* 노드(Node) 마커 렌더링 */}
            {RIFT_NODES.map((node: any) => {
              const status = riftNodesState[node.id] ?? node.status
              const meta = RIFT_NODE_STATUS_META[status]
              const worldNode = livingWorld?.riftNodes[node.id]
              const isNodeRegionOccupied = livingWorld?.activeMonarchs?.some(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(node.regionId))

              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-300 z-10`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  {/* 노드 링과 코어 */}
                  <div
                    className={`relative h-5 w-5 rounded-full border-2 ${isNodeRegionOccupied ? 'border-red-500 bg-red-950/80 shadow-glow-red animate-pulse' : `${meta.borderClass} ${meta.bgClass}`} flex items-center justify-center transition-all group-hover:scale-125 group-hover:border-purple-400`}
                  >
                    {worldNode?.loveCall?.active && (
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
                      <div className={`h-1.5 w-1.5 rounded-full ${isNodeRegionOccupied ? 'bg-red-400' : 'bg-cyan-400'} animate-ping`} />
                    )}
                  </div>

                  {/* 마커 아래 노드명 말풍선 */}
                  <div className="mt-1 opacity-60 group-hover:opacity-100 transition-all">
                    <div className={`rounded bg-black/80 border ${isNodeRegionOccupied ? 'border-red-500/40 text-red-300' : 'border-white/5 text-white/70'} px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-sm whitespace-nowrap shadow-md`}>
                      {node.name}
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
