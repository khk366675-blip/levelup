import {
  BALANCED_XP_BY_TYPE,
  DUNGEON_PARTIAL_XP_BUDGET_RATIO,
  rankFromLevel,
  xpToNextLevel,
} from '../src/lib/game'
import {
  DEFAULT_DAILIES,
  DEFAULT_DUNGEONS,
  DEFAULT_MAIN_QUESTS,
  GATE_REWARD_TABLES,
} from '../src/lib/seed'
import type { Difficulty, Quest, Rank } from '../src/lib/types'

type QuestRewardType = Quest['type']
type XpTable = Record<QuestRewardType, Record<Difficulty, number>>

interface RewardConfig {
  name: string
  xpTable: XpTable
  dungeonPartialRatio: number
  gateXp: Record<'E' | 'D' | 'C', number>
}

interface ScenarioConfig {
  name: string
  extraXpPerDay: number
}

interface ScenarioResult {
  name: string
  totalXp365: number
  level365: number
  rank365: Rank
  milestones: Record<number, number | undefined>
}

const DAYS = 365
const DAILY_COMPLETION_RATE = 0.75
const MAIN_INTERVAL_DAYS = 60
const DUNGEON_INTERVAL_DAYS = 30
const MILESTONES = [10, 18, 30, 45, 60]

const baseline12_3XpTable: XpTable = {
  daily: {
    easy: 10,
    normal: 14,
    hard: 22,
    elite: 45,
    apex: 60,
    boss: 80,
  },
  dungeon: {
    easy: 80,
    normal: 140,
    hard: 260,
    elite: 430,
    apex: 680,
    boss: 1050,
  },
  main: {
    easy: 240,
    normal: 450,
    hard: 800,
    elite: 1300,
    apex: 2100,
    boss: 3200,
  },
}

const currentGateXp = Object.fromEntries(
  GATE_REWARD_TABLES.map(table => {
    const rank = table.id.includes('-e-') ? 'E' : table.id.includes('-d-') ? 'D' : 'C'
    return [rank, table.xp]
  })
) as Record<'E' | 'D' | 'C', number>

const rewardConfigs: RewardConfig[] = [
  {
    name: '12-3 baseline',
    xpTable: baseline12_3XpTable,
    dungeonPartialRatio: 0.25,
    gateXp: { E: 90, D: 160, C: 250 },
  },
  {
    name: 'current code',
    xpTable: BALANCED_XP_BY_TYPE,
    dungeonPartialRatio: DUNGEON_PARTIAL_XP_BUDGET_RATIO,
    gateXp: currentGateXp,
  },
]

const scenarios: ScenarioConfig[] = [
  { name: 'A. 보수적', extraXpPerDay: 0 },
  { name: 'B. 현실적', extraXpPerDay: 150 },
  { name: 'C. 적극적', extraXpPerDay: 300 },
]

const formatNumber = (value: number): string => Math.round(value).toLocaleString('ko-KR')

const cycleLength = (quest: Quest): number => {
  if (quest.type !== 'daily') return 1
  return (quest.cooldownDays ?? 0) + 1
}

const averageDailyXpPerDay = (xpTable: XpTable): number => {
  return DEFAULT_DAILIES.reduce((sum, quest) => {
    return sum + (xpTable.daily[quest.difficulty] / cycleLength(quest)) * DAILY_COMPLETION_RATE
  }, 0)
}

const averageMainXp = (xpTable: XpTable): number => {
  if (DEFAULT_MAIN_QUESTS.length === 0) return 0
  return DEFAULT_MAIN_QUESTS.reduce((sum, quest) => sum + xpTable.main[quest.difficulty], 0) / DEFAULT_MAIN_QUESTS.length
}

const averageDungeonXp = (config: RewardConfig): number => {
  if (DEFAULT_DUNGEONS.length === 0) return 0
  return DEFAULT_DUNGEONS.reduce((sum, quest) => {
    const clearXp = config.xpTable.dungeon[quest.difficulty]
    return sum + clearXp * (1 + config.dungeonPartialRatio)
  }, 0) / DEFAULT_DUNGEONS.length
}

const applyXp = (state: { level: number; xp: number; totalXp: number }, amount: number) => {
  let level = state.level
  let xp = state.xp + amount
  let totalXp = state.totalXp + amount

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level)
    level += 1
  }

  return { level, xp, totalXp }
}

const simulateScenario = (config: RewardConfig, scenario: ScenarioConfig): ScenarioResult => {
  const dailyXp = averageDailyXpPerDay(config.xpTable)
  const mainXp = averageMainXp(config.xpTable)
  const dungeonXp = averageDungeonXp(config)
  let state = { level: 1, xp: 0, totalXp: 0 }
  const milestones: Record<number, number | undefined> = Object.fromEntries(MILESTONES.map(level => [level, undefined]))
  let day = 0

  while (day < 2_000 && milestones[60] === undefined) {
    day += 1
    let todayXp = dailyXp + scenario.extraXpPerDay
    if (day % MAIN_INTERVAL_DAYS === 0) todayXp += mainXp
    if (day % DUNGEON_INTERVAL_DAYS === 0) todayXp += dungeonXp
    state = applyXp(state, todayXp)

    for (const milestone of MILESTONES) {
      if (milestones[milestone] === undefined && state.level >= milestone) {
        milestones[milestone] = day
      }
    }

    if (day === DAYS) {
      // Keep running past 365 only to resolve missing milestone days.
    }
  }

  const state365 = simulateUntilDay(config, scenario, DAYS)
  return {
    name: scenario.name,
    totalXp365: state365.totalXp,
    level365: state365.level,
    rank365: rankFromLevel(state365.level),
    milestones,
  }
}

const simulateUntilDay = (config: RewardConfig, scenario: ScenarioConfig, days: number) => {
  const dailyXp = averageDailyXpPerDay(config.xpTable)
  const mainXp = averageMainXp(config.xpTable)
  const dungeonXp = averageDungeonXp(config)
  let state = { level: 1, xp: 0, totalXp: 0 }

  for (let day = 1; day <= days; day += 1) {
    let todayXp = dailyXp + scenario.extraXpPerDay
    if (day % MAIN_INTERVAL_DAYS === 0) todayXp += mainXp
    if (day % DUNGEON_INTERVAL_DAYS === 0) todayXp += dungeonXp
    state = applyXp(state, todayXp)
  }

  return state
}

const printConfigSummary = (config: RewardConfig) => {
  console.log(`\n## ${config.name}`)
  console.log(`daily avg/day @75% with cooldowns: ${formatNumber(averageDailyXpPerDay(config.xpTable))} XP`)
  console.log(`main avg per 60d: ${formatNumber(averageMainXp(config.xpTable))} XP`)
  console.log(`dungeon avg per 30d incl partial: ${formatNumber(averageDungeonXp(config))} XP`)
  console.log(`dungeon partial budget ratio: ${(config.dungeonPartialRatio * 100).toFixed(0)}%`)
  console.log(`gate XP E/D/C: ${config.gateXp.E} / ${config.gateXp.D} / ${config.gateXp.C}`)
}

const printResults = (config: RewardConfig) => {
  printConfigSummary(config)
  console.log('\n| scenario | 365d total XP | 365d level | 365d rank | Lv10 | Lv18/C | Lv30/B | Lv45/A | Lv60/S |')
  console.log('|---|---:|---:|---|---:|---:|---:|---:|---:|')
  for (const scenario of scenarios) {
    const result = simulateScenario(config, scenario)
    const day = (level: number) => result.milestones[level] ? String(result.milestones[level]) : '-'
    console.log(
      `| ${result.name} | ${formatNumber(result.totalXp365)} | ${result.level365} | ${result.rank365} | ${day(10)} | ${day(18)} | ${day(30)} | ${day(45)} | ${day(60)} |`
    )
  }
}

console.log('# LEVEL UP 1-year growth simulation')
console.log(`Assumptions: daily ${Math.round(DAILY_COMPLETION_RATE * 100)}%, main every ${MAIN_INTERVAL_DAYS}d, dungeon every ${DUNGEON_INTERVAL_DAYS}d.`)
console.log(`Seed counts: daily ${DEFAULT_DAILIES.length}, main ${DEFAULT_MAIN_QUESTS.length}, dungeon ${DEFAULT_DUNGEONS.length}.`)
for (const config of rewardConfigs) {
  printResults(config)
}
