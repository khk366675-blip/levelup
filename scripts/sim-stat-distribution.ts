import {
  getBalancedQuestStatRewards,
  roundStatValue,
  STAT_REWARD_MULTIPLIER_BY_TYPE,
} from '../src/lib/game'
import {
  DEFAULT_DAILIES,
  DEFAULT_DUNGEONS,
  DEFAULT_MAIN_QUESTS,
} from '../src/lib/seed'
import type { Quest, StatKey } from '../src/lib/types'

const STAT_KEYS: StatKey[] = ['STR', 'VIT', 'AGI', 'INT', 'PER', 'SEN']
const DAILY_COMPLETION_RATE = 0.75
const MAIN_INTERVAL_DAYS = 60
const DUNGEON_INTERVAL_DAYS = 30

type StatTotals = Record<StatKey, number>

const emptyTotals = (): StatTotals => ({
  STR: 0,
  VIT: 0,
  AGI: 0,
  INT: 0,
  PER: 0,
  SEN: 0,
})

const addRewards = (totals: StatTotals, rewards: Partial<Record<StatKey, number>>, scale = 1) => {
  for (const stat of STAT_KEYS) {
    totals[stat] = roundStatValue(totals[stat] + (rewards[stat] ?? 0) * scale)
  }
}

const legacyStatRewards = (quest: Quest): Partial<Record<StatKey, number>> => {
  const multiplier = STAT_REWARD_MULTIPLIER_BY_TYPE[quest.type][quest.difficulty]
  const rewards: Partial<Record<StatKey, number>> = {}
  for (const [stat, value] of Object.entries(quest.statRewards) as Array<[StatKey, number]>) {
    rewards[stat] = roundStatValue((value ?? 0) * multiplier)
  }
  return rewards
}

const cycleLength = (quest: Quest): number => (quest.cooldownDays ?? 0) + 1

const averageQuestRewards = (
  quests: Quest[],
  rewardFn: (quest: Quest) => Partial<Record<StatKey, number>>
): Partial<Record<StatKey, number>> => {
  const totals = emptyTotals()
  if (quests.length === 0) return totals
  for (const quest of quests) addRewards(totals, rewardFn(quest), 1 / quests.length)
  return totals
}

const simulate = (
  days: number,
  rewardFn: (quest: Quest) => Partial<Record<StatKey, number>>
): StatTotals => {
  const totals = emptyTotals()
  const avgMainRewards = averageQuestRewards(DEFAULT_MAIN_QUESTS, rewardFn)
  const avgDungeonRewards = averageQuestRewards(DEFAULT_DUNGEONS, rewardFn)

  for (let day = 1; day <= days; day += 1) {
    for (const quest of DEFAULT_DAILIES) {
      addRewards(totals, rewardFn(quest), DAILY_COMPLETION_RATE / cycleLength(quest))
    }
    if (day % MAIN_INTERVAL_DAYS === 0) addRewards(totals, avgMainRewards)
    if (day % DUNGEON_INTERVAL_DAYS === 0) addRewards(totals, avgDungeonRewards)
  }

  return totals
}

const total = (totals: StatTotals): number => STAT_KEYS.reduce((sum, stat) => sum + totals[stat], 0)

const printRow = (label: string, totals: StatTotals) => {
  const sum = total(totals)
  const cells = STAT_KEYS.map(stat => `${totals[stat].toFixed(2)} (${sum > 0 ? Math.round((totals[stat] / sum) * 100) : 0}%)`)
  console.log(`| ${label} | ${cells.join(' | ')} | ${sum.toFixed(2)} |`)
}

console.log('# LEVEL UP stat distribution simulation')
console.log(`Assumptions: daily ${Math.round(DAILY_COMPLETION_RATE * 100)}%, main every ${MAIN_INTERVAL_DAYS}d, dungeon every ${DUNGEON_INTERVAL_DAYS}d.`)
console.log(`Seed counts: daily ${DEFAULT_DAILIES.length}, main ${DEFAULT_MAIN_QUESTS.length}, dungeon ${DEFAULT_DUNGEONS.length}.`)

for (const days of [30, 90]) {
  console.log(`\n## ${days} days`)
  console.log('| mode | STR | VIT | AGI | INT | PER | SEN | total |')
  console.log('|---|---:|---:|---:|---:|---:|---:|---:|')
  printRow('legacy statRewards', simulate(days, legacyStatRewards))
  printRow('rewardStatWeights', simulate(days, getBalancedQuestStatRewards))
}
