import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  Calendar,
  Compass,
  Coins,
  Eclipse,
  Gift,
  Package,
  ShoppingBag,
  Skull,
  Swords,
  Plus,
  RotateCcw,
  Brain,
  AlertTriangle,
  Globe,
} from 'lucide-react'
import { useGame } from './lib/store'
import { todayKey, getDateKey, addDays } from './lib/game'
import { TITLE_DEFINITIONS } from './lib/types'
import { HunterStatus } from './components/HunterStatus'
import { QuestCard } from './components/QuestCard'
import { SystemMessageQueue } from './components/SystemMessage'
import { AddQuestModal } from './components/AddQuestModal'
import { Inventory } from './components/Inventory'
import { RandomQuestCard } from './components/RandomQuestCard'
import { GatePanel } from './components/GatePanel'
import { HunterGradePanel } from './components/HunterGradePanel'
import { ShadowPanel } from './components/ShadowPanel'
import { BackupControls } from './components/BackupControls'
import { ClueRecordsModal } from './components/ClueRecordsModal'
import { RewardBoxPanel } from './components/RewardBoxPanel'
import { ChallengeCardsPanel } from './components/ChallengeCardsPanel'
import { ShopPanel } from './components/ShopPanel'
import { AiCoachPanel } from './components/AiCoachPanel'
import { FocusSessionOverlay } from './components/FocusSessionOverlay'
import { WorldMapPanel } from './components/WorldMapPanel'
import { TitleScreen } from './components/TitleScreen'

type Tab = 'rewards' | 'shop' | 'daily' | 'main' | 'gate' | 'shadows' | 'inventory' | 'grade' | 'coach' | 'worldmap'

const TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
  { key: 'rewards',   label: '보상',           icon: Gift },
  { key: 'shop',      label: '상점',           icon: ShoppingBag },
  { key: 'shadows',   label: '군단',         icon: Eclipse },
  { key: 'daily',     label: '일일 퀘스트', icon: Calendar },
  { key: 'main',      label: '메인 퀘스트', icon: Compass },
  { key: 'worldmap',  label: '월드맵',      icon: Globe },
  { key: 'gate',      label: '게이트',      icon: Swords },
  { key: 'inventory', label: '인벤토리',    icon: Package },
  { key: 'grade',     label: '등급/칭호',    icon: Award },
  { key: 'coach',     label: 'AI 코치',      icon: Brain },
]

const MOBILE_TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
  { key: 'rewards',   label: '보상',           icon: Gift },
  { key: 'daily',     label: '일일',           icon: Calendar },
  { key: 'worldmap',  label: '월드맵',         icon: Globe },
  { key: 'gate',      label: '게이트',         icon: Swords },
  { key: 'grade',     label: '등급',           icon: Award },
  { key: 'shadows',   label: '군단',           icon: Eclipse },
  { key: 'coach',     label: 'AI 코치',        icon: Brain },
]

export default function App() {
  const [showTitle, setShowTitle] = useState(true)
  const [tab, setTab] = useState<Tab>('rewards')
  const [clueOpen, setClueOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [showRoutineLibrary, setShowRoutineLibrary] = useState(false)
  const [showTomorrowPlanPreview, setShowTomorrowPlanPreview] = useState(false)
  const quests = useGame(s => s.quests)
  const hunter = useGame(s => s.hunter)
  const gold = useGame(s => s.gold ?? 0)
  const removeQuest = useGame(s => s.removeQuest)
  const resetGameProgress = useGame(s => s.resetGameProgressOnly)
  const hardResetAll = useGame(s => s.hardResetAll)
  const init = useGame(s => s.resetDailiesIfNewDay)
  const checkTitles = useGame(s => s.checkTitleUnlocks)
  const checkJobs = useGame(s => s.checkJobAwakening)
  const recordAppOpen = useGame(s => s.recordAppOpen)
  const clearExpiredRandomQuest = useGame(s => s.clearExpiredRandomQuest)
  const clearExpiredConsumableEffects = useGame(s => s.clearExpiredConsumableEffects)
  const clearExpiredGate = useGame(s => s.clearExpiredGate)
  const recoverGateStamina = useGame(s => s.recoverGateStamina)
  const clearGateInjuryIfExpired = useGame(s => s.clearGateInjuryIfExpired)
  const rollGateSpawn = useGame(s => s.rollGateSpawn)
  const rollRandomQuest = useGame(s => s.rollRandomQuestForToday)
  const grantAchievementNamedShadows = useGame(s => s.grantAchievementNamedShadows)
  const ensureTodayShadowExpedition = useGame(s => s.ensureTodayShadowExpedition)
  const ensureDailyRewardSystems = useGame(s => s.ensureDailyRewardSystems)
  const syncDefaultQuestMetadata = useGame(s => s.syncDefaultQuestMetadata)
  const ensureMainQuestMilestonesBackfilled = useGame(s => s.ensureMainQuestMilestonesBackfilled)
  const initialized = useGame(s => s.initialized)
  const manualBattleSession = useGame(s => s.manualBattleSession)
  const activeFocusSession = useGame(s => s.focusSession?.active)
  const isOverlayActive = Boolean(manualBattleSession || activeFocusSession)

  const tabAnchorRef = useRef<HTMLDivElement | null>(null)

  const scrollToTabAnchor = (behavior: ScrollBehavior) => {
    if (tabAnchorRef.current) {
      const element = tabAnchorRef.current
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      // Mobile header: 56px, Desktop header: 64px
      // Mobile offset = 56px + 4px extra space = 60px
      // Desktop offset = 64px + 8px extra space = 72px
      const offset = window.innerWidth >= 768 ? 72 : 60
      const scrollPosition = elementPosition - offset
      
      const currentScroll = window.scrollY
      if (Math.abs(currentScroll - scrollPosition) > 2) {
        window.scrollTo({
          top: scrollPosition,
          behavior
        })
      }
    } else {
      window.scrollTo({ top: 0, behavior })
    }
  }

  const handleTabChange = (newTab: Tab) => {
    if (newTab === tab) {
      scrollToTabAnchor('smooth')
    } else {
      setTab(newTab)
      setTimeout(() => {
        scrollToTabAnchor('auto')
      }, 0)
    }
  }

  useEffect(() => {
    init()
    recordAppOpen()
    recoverGateStamina()
    clearGateInjuryIfExpired()
    clearExpiredConsumableEffects()
    clearExpiredRandomQuest()
    clearExpiredGate()
    ensureDailyRewardSystems()
    ensureTodayShadowExpedition()
    rollGateSpawn('daily_open')
    rollRandomQuest()

    // 메인 퀘스트 마일스톤 백필 및 기본 메타데이터 동기화 보장
    try {
      syncDefaultQuestMetadata()
      ensureMainQuestMilestonesBackfilled()
    } catch (e) {
      console.error('Failed to backfill or sync quests:', e)
    }

    // Check title and job unlocks on app mount
    setTimeout(() => {
      checkTitles()
      checkJobs()
      grantAchievementNamedShadows()
    }, 100)
  }, [init, checkTitles, checkJobs, grantAchievementNamedShadows, recordAppOpen, recoverGateStamina, clearGateInjuryIfExpired, clearExpiredConsumableEffects, clearExpiredRandomQuest, clearExpiredGate, ensureDailyRewardSystems, ensureTodayShadowExpedition, rollGateSpawn, rollRandomQuest, syncDefaultQuestMetadata, ensureMainQuestMilestonesBackfilled])

  const today = todayKey()
  const tomorrow = getDateKey(addDays(new Date(), 1))

  const dailies = quests.filter(q => q.type === 'daily')
  
  // AI Daily Plan (날짜 조건 없이 항상 현재 활성 Plan으로 표시)
  const aiPlanDailies = dailies.filter(q => 
    q.recurring === false && 
    (q.coachGenerated === true || q.coachPlanId !== undefined || q.coachReason !== undefined)
  )

  const userQuests = dailies.filter(q => 
    q.recurring === false && 
    !(q.coachGenerated === true || q.coachPlanId !== undefined || q.coachReason !== undefined)
  )
  const routineDailies = dailies.filter(q => q.recurring === true)
  const mains = quests.filter(q => q.type === 'main')

  const handleReset = () => {
    if (window.confirm(
      '게임 진행만 초기화합니다.\n\n' +
      '레벨, 스탯, 장비, 그림자, 골드 및 전투/보상/상점 진행도만 리셋되며,\n' +
      'AI 코치 Core, Daily Plan, Daily 라이브러리, Main Quest 구조 및 CoachMemory 등의 자기관리 데이터는 안전하게 유지됩니다.\n\n' +
      '계속 진행하시겠습니까?'
    )) {
      resetGameProgress()
    }
  }

  const handleResetAll = () => {
    const isFirstConfirmed = window.confirm(
      '【주의】 전체 리셋은 앱의 모든 데이터를 완전히 삭제합니다.\n\n' +
      '게임 진행도뿐 아니라 작성하신 AI 코치 Core Context, AI Coach Memory, AI Daily Plan, Daily Quest, Main Quest 구조, Milestone 등 모든 데이터가 공장 초기화됩니다.\n\n' +
      '계속 진행하시겠습니까?'
    )
    if (!isFirstConfirmed) return

    const isSecondConfirmed = window.confirm(
      '정말로 모든 데이터를 삭제하시겠습니까?\n' +
      '이 작업은 절대 되돌릴 수 없으며 앱을 처음 설치한 상태로 돌아갑니다.'
    )
    if (!isSecondConfirmed) return

    const userInput = window.prompt(
      '실행을 위해 아래 입력창에 "전체 리셋" 이라고 정확하게 입력해주십시오.'
    )
    if (userInput === '전체 리셋') {
      hardResetAll()
    } else {
      alert('입력값이 일치하지 않아 전체 리셋이 취소되었습니다.')
    }
  }

  // Get equipped title
  const equippedTitle = hunter.equippedTitleId 
    ? TITLE_DEFINITIONS.find(t => t.id === hunter.equippedTitleId)
    : undefined

  return (
    <AnimatePresence mode="wait">
      {showTitle ? (
        <TitleScreen key="title-screen" onEnter={() => setShowTitle(false)} />
      ) : (
        <motion.div
          key="game-screen"
          className="relative z-10 min-h-screen text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
      <SystemMessageQueue />

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-ink-900/60 border-b border-cyan-400/15">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <motion.div
              animate={{ rotate: [0, 4, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-2xl"
            >
              ⚔️
            </motion.div>
            <div>
              <div className="text-lg font-bold tracking-wider system-text bg-gradient-to-r from-cyan-200 via-white to-purple-200 bg-clip-text text-transparent">
                LEVEL UP
              </div>
              <div className="text-[10px] text-cyan-300/50 system-text -mt-0.5">HUNTER SYSTEM v1.0</div>
            </div>
            {equippedTitle && (
              <div className="text-xs text-amber-300 border border-amber-400/30 rounded-full px-2.5 py-0.5 system-text bg-amber-400/5">
                칭호: {equippedTitle.name}
              </div>
            )}
            <div className="flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.08)]">
              <Coins className="h-3.5 w-3.5" />
              {gold.toLocaleString()} Gold
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <BackupControls />
            <button
              onClick={() => setClueOpen(true)}
              className="btn btn-ghost text-xs text-purple-200/85 hover:text-purple-100 border border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 shadow-[0_0_8px_rgba(168,85,247,0.05)]"
              title="지금까지 수집된 차원 관측 단서를 확인합니다"
            >
              📡 관측 기록
            </button>
            <button 
              onClick={handleReset} 
              className="btn btn-ghost text-xs text-red-300/70 hover:text-red-200" 
              title="게임 진행만 초기화합니다. AI 코치 Core, Daily Plan, Main Quest 구조, CoachMemory는 유지됩니다."
            >
              <RotateCcw className="w-3.5 h-3.5" /> 게임 진행 리셋
            </button>
            <button 
              onClick={handleResetAll} 
              className="btn text-xs text-red-400 font-bold bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 hover:border-red-500/60" 
              title="모든 데이터를 초기화합니다. AI 코치 Core, Daily Plan, Main Quest, CoachMemory까지 모두 삭제됩니다."
            >
              <AlertTriangle className="w-3.5 h-3.5" /> 전체 리셋
            </button>
          </div>
        </div>
      </header>

      <main className={`max-w-6xl mx-auto px-4 py-6 space-y-6 ${!isOverlayActive ? 'pb-24 md:pb-6' : ''}`}>
        <HunterStatus currentTab={tab} onTabChange={handleTabChange} />

        {/* 12-41UX-hotfix: Tab Anchor position for scroll offset adjustment */}
        <div ref={tabAnchorRef} className="scroll-mt-[60px] md:scroll-mt-[72px]" />

        {/* Tabs */}
        <div className="sticky top-[56px] md:top-[64px] z-20 backdrop-blur-md bg-ink-950/75 border border-cyan-400/15 p-1 rounded-lg overflow-x-auto flex gap-1 shadow-[0_4px_20px_rgba(0,0,0,0.45)]">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`flex-1 min-w-fit relative px-4 py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition
                  ${active ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                {active && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-cyan-400/15 border border-cyan-400/50 rounded-md shadow-glow"
                  />
                )}
                <Icon className="w-4 h-4 relative" />
                <span className="relative">{t.label}</span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {tab === 'rewards' && (
              <Section
                title="보상"
                subtitle="일일 박스와 오늘의 도전 카드"
              >
                <RewardBoxPanel />
              </Section>
            )}

            {tab === 'shop' && (
              <Section
                title="상점"
                subtitle="Gold로 소환권과 장비권을 보급합니다"
              >
                <ShopPanel />
              </Section>
            )}

            {tab === 'daily' && (
              <Section
                title="일일 퀘스트"
                subtitle="매일 자정에 초기화 · 작은 습관이 쌓여 레벨이 된다"
                onAdd={() => setAddOpen(true)}
              >
                {/* Random Quest Card */}
                <RandomQuestCard />

                <div className="space-y-6">
                  {/* AI Daily Plan 섹션 */}
                  {aiPlanDailies.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
                        <h3 className="text-sm font-bold text-purple-300 flex items-center gap-1.5 font-mono tracking-wider">
                          🤖 AI COACH DAILY PLAN
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-purple-400/30 bg-purple-950/40 text-purple-300 font-mono">
                          {aiPlanDailies.filter(q => (q.aiPriority || q.coachPriority) === 'core').length} Core / {aiPlanDailies.length} Total
                        </span>
                      </div>
                      
                      {/* priority 순 정렬하여 렌더링: core -> support -> maintenance -> recovery -> optional */}
                      <div className="grid md:grid-cols-2 gap-3">
                        {[...aiPlanDailies].sort((a, b) => {
                          const priorityOrder = { core: 0, support: 1, maintenance: 2, recovery: 3, optional: 4 };
                          const orderA = (a.aiPriority || a.coachPriority) ? priorityOrder[(a.aiPriority || a.coachPriority)!] : 9;
                          const orderB = (b.aiPriority || b.coachPriority) ? priorityOrder[(b.aiPriority || b.coachPriority)!] : 9;
                          return orderA - orderB;
                        }).map(q => (
                          <div key={q.id} className="group">
                            <QuestCard quest={q} removable onRemove={() => removeQuest(q.id)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="panel corner-bracket p-8 text-center bg-purple-950/10 border border-purple-500/25">
                      <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                      <div className="text-purple-300/80 font-medium text-sm">
                        아직 생성된 AI Daily Plan이 없습니다.
                      </div>
                      <div className="text-xs text-purple-400/50 mt-1.5 leading-relaxed">
                        AI 코치 탭에서 전체 Plan을 생성하세요.
                      </div>
                    </div>
                  )}

                  {/* 사용자 추가 일일 퀘스트 섹션 */}
                  {userQuests.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
                        <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5 font-mono tracking-wider">
                          👤 사용자 추가 일일 퀘스트 ({userQuests.length})
                        </h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        {userQuests.map(q => (
                          <div key={q.id} className="group">
                            <QuestCard quest={q} removable onRemove={() => removeQuest(q.id)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiPlanDailies.length === 0 && userQuests.length === 0 && (
                    <EmptyState text="일일 퀘스트가 없습니다. 추가해보세요." />
                  )}

                  {/* 기본 루틴 라이브러리 섹션 (접이식) */}
                  {routineDailies.length > 0 && (
                    <div className="panel corner-bracket p-4 bg-slate-950/20 border border-cyan-400/10">
                      <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                      <div
                        className="flex justify-between items-center cursor-pointer select-none"
                        onClick={() => setShowRoutineLibrary(!showRoutineLibrary)}
                      >
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-mono tracking-wider">
                            📚 기본 루틴 라이브러리 ({routineDailies.length})
                          </h4>
                          <p className="text-[10px] text-cyan-300/40">
                            AI 코치가 참고하는 기본 루틴입니다. (메인 수행 목록에는 표시되지 않습니다.)
                          </p>
                        </div>
                        <span className="text-cyan-300/50">
                          {showRoutineLibrary ? '▲ 접기' : '▼ 펼치기'}
                        </span>
                      </div>

                      {showRoutineLibrary && (
                        <div className="grid md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-cyan-400/10">
                          {routineDailies.map(q => (
                            <div key={q.id} className="group">
                              <QuestCard quest={q} removable onRemove={() => removeQuest(q.id)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {tab === 'main' && (
              <Section
                title="메인 퀘스트 v2"
                subtitle="장기 목표 · 최종 목표 도달을 위한 순차 마일스톤과 중간 보상 연동"
                onAdd={() => setAddOpen(true)}
              >
                {/* v2 안내 배너 */}
                <div className="panel corner-bracket p-4 bg-indigo-950/20 border border-cyan-400/10 text-cyan-200 text-xs mb-4">
                  <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                  🎯 <strong>장기 목표 & 마일스톤 통합 관리:</strong> 하나의 메인 퀘스트에 여러 마일스톤(Milestone)을 엮어 단계적으로 클리어하십시오. 각 마일스톤 완수 시마다 전리품 상자, 인내 스탯(PER), Gold 등 중간 보상이 앱 규칙에 따라 자동으로 안전하게 지급됩니다.
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {mains.map(q => (
                    <div key={q.id} className="group">
                      <QuestCard quest={q} removable onRemove={() => removeQuest(q.id)} />
                    </div>
                  ))}
                </div>
                {mains.length === 0 && <EmptyState text="아직 추가된 메인 퀘스트가 없습니다." />}
              </Section>
            )}

            {tab === 'inventory' && (
              <Section title="인벤토리" subtitle="획득한 아이템 보관함">
                <Inventory />
              </Section>
            )}

            {tab === 'gate' && (
              <Section title="게이트" subtitle="출현한 균열과 전투 준비 상태">
                <GatePanel />
              </Section>
            )}

            {tab === 'shadows' && (
              <Section title="군단" subtitle="그림자 도감 / 보유 / 출전 선택">
                <ShadowPanel />
              </Section>
            )}

            {tab === 'grade' && (
              <Section title="헌터 등급" subtitle="헌터 협회 공인 등급과 자격 증명">
                <HunterGradePanel />
              </Section>
            )}

            {tab === 'coach' && (
              <Section
                title="AI 성장 코치"
                subtitle="자유 기록 기반 분석 및 내일의 퀘스트 설계 제안"
              >
                <AiCoachPanel />
              </Section>
            )}

            {tab === 'worldmap' && (
              <Section
                title="살아있는 균열 세계"
                subtitle="세계 각지에 발생한 균열 노드를 실시간 정찰 및 정화"
              >
                <WorldMapPanel />
              </Section>
            )}
          </motion.div>
        </AnimatePresence>

        <footer className="text-center text-[10px] text-cyan-300/30 system-text py-6">
          ── SYSTEM // {initialized ? 'ONLINE' : 'BOOTING'} ──
        </footer>
      </main>

      <AddQuestModal open={addOpen} onClose={() => setAddOpen(false)} type={tab === 'main' ? 'main' : 'daily'} />
      <ClueRecordsModal open={clueOpen} onClose={() => setClueOpen(false)} />
      
      {/* Mobile Bottom Quick Nav */}
      {!isOverlayActive && (
        <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-ink-950/90 border-t border-cyan-400/25 backdrop-blur-lg px-2 pb-[safe-area-inset-bottom] pt-2 shadow-[0_-4px_25px_rgba(0,0,0,0.6)]">
          <div className="flex justify-around items-center max-w-lg mx-auto">
            {MOBILE_TABS.map(t => {
              const Icon = t.icon
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className={`flex flex-col items-center justify-center py-1 flex-1 transition min-w-[50px] relative
                    ${active ? 'text-cyan-300 font-bold scale-105' : 'text-white/45 hover:text-white/70'}`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${active ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'text-white/45'}`} />
                  <span className="text-[9px] tracking-tight">{t.label}</span>
                  {active && (
                    <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] animate-pulse" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <FocusSessionOverlay />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Section({
  title, subtitle, children, onAdd,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  onAdd?: () => void
}) {
  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-100 tracking-wide">{title}</h2>
          <p className="text-xs text-cyan-300/50 mt-0.5">{subtitle}</p>
        </div>
        {onAdd && (
          <button onClick={onAdd} className="btn btn-primary text-xs">
            <Plus className="w-3.5 h-3.5" /> 추가
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="panel corner-bracket p-10 text-center">
      <div className="br" />
      <div className="text-cyan-300/60 system-text text-sm">{text}</div>
    </div>
  )
}
