import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  Calendar,
  Compass,
  Eclipse,
  Gift,
  Package,
  Skull,
  Swords,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { useGame } from './lib/store'
import { TITLE_DEFINITIONS } from './lib/types'
import { HunterStatus } from './components/HunterStatus'
import { QuestCard } from './components/QuestCard'
import { SystemMessageQueue } from './components/SystemMessage'
import { AddQuestModal } from './components/AddQuestModal'
import { Inventory } from './components/Inventory'
import { TitleCollection } from './components/TitleCollection'
import { RandomQuestCard } from './components/RandomQuestCard'
import { GatePanel } from './components/GatePanel'
import { ShadowPanel } from './components/ShadowPanel'
import { BackupControls } from './components/BackupControls'
import { InfiniteTowerPanel } from './components/InfiniteTowerPanel'
import { RewardBoxPanel } from './components/RewardBoxPanel'
import { ChallengeCardsPanel } from './components/ChallengeCardsPanel'

type Tab = 'rewards' | 'daily' | 'main' | 'dungeon' | 'gate' | 'shadows' | 'inventory' | 'titles' | 'tower'

const TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
  { key: 'rewards',   label: '보상',           icon: Gift },
  { key: 'shadows',   label: '군단',         icon: Eclipse },
  { key: 'daily',     label: '일일 퀘스트', icon: Calendar },
  { key: 'main',      label: '메인 퀘스트', icon: Compass },
  { key: 'dungeon',   label: '던전',        icon: Skull },
  { key: 'gate',      label: '게이트',      icon: Swords },
  { key: 'tower',     label: '무한의 탑',   icon: Swords },
  { key: 'inventory', label: '인벤토리',    icon: Package },
  { key: 'titles',    label: '칭호',        icon: Award },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('rewards')
  const [addOpen, setAddOpen] = useState(false)
  const quests = useGame(s => s.quests)
  const hunter = useGame(s => s.hunter)
  const removeQuest = useGame(s => s.removeQuest)
  const reset = useGame(s => s.hardReset)
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
  const initialized = useGame(s => s.initialized)

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
    // Check title and job unlocks on app mount
    setTimeout(() => {
      checkTitles()
      checkJobs()
      grantAchievementNamedShadows()
    }, 100)
  }, [init, checkTitles, checkJobs, grantAchievementNamedShadows, recordAppOpen, recoverGateStamina, clearGateInjuryIfExpired, clearExpiredConsumableEffects, clearExpiredRandomQuest, clearExpiredGate, ensureDailyRewardSystems, ensureTodayShadowExpedition, rollGateSpawn, rollRandomQuest])

  const dailies = quests.filter(q => q.type === 'daily')
  const mains = quests.filter(q => q.type === 'main')
  const dungeons = quests.filter(q => q.type === 'dungeon')

  const handleReset = () => {
    if (window.confirm('정말 모든 데이터를 초기화할까요? 되돌릴 수 없습니다.')) reset()
  }

  // Get equipped title
  const equippedTitle = hunter.equippedTitleId 
    ? TITLE_DEFINITIONS.find(t => t.id === hunter.equippedTitleId)
    : undefined

  return (
    <div className="relative z-10 min-h-screen text-white">
      <SystemMessageQueue />

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-ink-900/60 border-b border-cyan-400/15">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
              <div className="ml-2 text-xs text-amber-300 border border-amber-400/30 rounded-full px-2.5 py-0.5 system-text bg-amber-400/5">
                칭호: {equippedTitle.name}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <BackupControls />
            <button onClick={handleReset} className="btn btn-ghost text-xs text-red-300/70 hover:text-red-200" title="초기화">
              <RotateCcw className="w-3.5 h-3.5" /> 리셋
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <HunterStatus />

        {/* Tabs */}
        <div className="flex gap-1 p-1 panel rounded-lg overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
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
                <div className="space-y-4">
                  <RewardBoxPanel />
                  <ChallengeCardsPanel />
                </div>
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
                
                <div className="grid md:grid-cols-2 gap-3">
                  {dailies.map(q => (
                    <div key={q.id} className="group">
                      <QuestCard quest={q} removable onRemove={() => removeQuest(q.id)} />
                    </div>
                  ))}
                </div>
                {dailies.length === 0 && <EmptyState text="일일 퀘스트가 없습니다. 추가해보세요." />}
              </Section>
            )}

            {tab === 'main' && (
              <Section
                title="메인 퀘스트"
                subtitle="장기 목표 · 한 번 완료하면 영구 보상"
                onAdd={() => setAddOpen(true)}
              >
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

            {tab === 'dungeon' && (
              <Section
                title="던전"
                subtitle="여러 단계로 이루어진 도전 · 클리어 시 거대한 보상"
                onAdd={() => setAddOpen(true)}
              >
                <div className="grid md:grid-cols-2 gap-3">
                  {dungeons.map(q => (
                    <div key={q.id} className="group">
                      <QuestCard quest={q} removable onRemove={() => removeQuest(q.id)} />
                    </div>
                  ))}
                </div>
                {dungeons.length === 0 && <EmptyState text="입장 가능한 던전이 없습니다." />}
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

            {tab === 'tower' && (
              <Section title="무한의 탑" subtitle="헌터와 군단의 성장을 측정하는 전투 콘텐츠">
                <InfiniteTowerPanel />
              </Section>
            )}

            {tab === 'shadows' && (
              <Section title="군단" subtitle="그림자 도감 / 보유 / 출전 선택">
                <ShadowPanel />
              </Section>
            )}

            {tab === 'titles' && (
              <Section title="칭호" subtitle="헌터의 업적과 영광">
                <TitleCollection />
              </Section>
            )}
          </motion.div>
        </AnimatePresence>

        <footer className="text-center text-[10px] text-cyan-300/30 system-text py-6">
          ── SYSTEM // {initialized ? 'ONLINE' : 'BOOTING'} ──
        </footer>
      </main>

      <AddQuestModal open={addOpen} onClose={() => setAddOpen(false)} type={tab === 'main' || tab === 'dungeon' ? tab : 'daily'} />
    </div>
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
