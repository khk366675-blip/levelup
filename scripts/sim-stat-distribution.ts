import {
  getBalancedQuestStatRewards,
  getBalancedQuestXp,
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

// A: daily 75% + main every 60d + dungeon every 30d (rolling average)
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

// B: simulate Scenario C — all mains completed once + all dungeons cleared once + N days of dailies at 75%
const simulateFullSeed = (
  dailyDays: number,
  rewardFn: (quest: Quest) => Partial<Record<StatKey, number>>
): StatTotals => {
  const totals = emptyTotals()

  // All main quests completed once
  for (const quest of DEFAULT_MAIN_QUESTS) {
    addRewards(totals, rewardFn(quest))
  }

  // All dungeons cleared once (full clear = complete reward)
  for (const quest of DEFAULT_DUNGEONS) {
    addRewards(totals, rewardFn(quest))
  }

  // Daily quests at 75% for dailyDays
  for (let day = 1; day <= dailyDays; day += 1) {
    for (const quest of DEFAULT_DAILIES) {
      addRewards(totals, rewardFn(quest), DAILY_COMPLETION_RATE / cycleLength(quest))
    }
  }

  return totals
}

const total = (totals: StatTotals): number => STAT_KEYS.reduce((sum, stat) => sum + totals[stat], 0)

const printRow = (label: string, totals: StatTotals) => {
  const sum = total(totals)
  const cells = STAT_KEYS.map(stat => `${totals[stat].toFixed(1)} (${sum > 0 ? Math.round((totals[stat] / sum) * 100) : 0}%)`)
  console.log(`| ${label} | ${cells.join(' | ')} | ${sum.toFixed(1)} |`)
}

const printGroupRow = (label: string, totals: StatTotals) => {
  const sum = total(totals)
  if (sum === 0) {
    console.log(`| ${label} | — | — | — | — |`)
    return
  }
  const intPer = ((totals.INT + totals.PER) / sum * 100).toFixed(0)
  const agiSen = ((totals.AGI + totals.SEN) / sum * 100).toFixed(0)
  const strVit = ((totals.STR + totals.VIT) / sum * 100).toFixed(0)
  const statVals = STAT_KEYS.map(s => totals[s])
  const maxV = Math.max(...statVals)
  const minV = Math.min(...statVals)
  const ratio = minV > 0 ? (maxV / minV).toFixed(1) : '∞'
  const targets = [
    Number(intPer) < 45 ? '✅ INT+PER<45%' : `❌ INT+PER=${intPer}%`,
    Number(agiSen) >= 20 ? '✅ AGI+SEN≥20%' : `❌ AGI+SEN=${agiSen}%`,
    Number(strVit) >= 25 ? '✅ STR+VIT≥25%' : `❌ STR+VIT=${strVit}%`,
    Number(ratio) < 5 ? `✅ ratio<5× (${ratio}×)` : `❌ ratio=${ratio}×`,
  ]
  console.log(`| ${label} | INT+PER ${intPer}% | AGI+SEN ${agiSen}% | STR+VIT ${strVit}% | max/min ${ratio}× | ${targets.join(' ')} |`)
}

// ── run ───────────────────────────────────────────────────────────────────────

console.log('# LEVEL UP stat distribution simulation — 12-9A')
console.log(`Assumptions: daily ${Math.round(DAILY_COMPLETION_RATE * 100)}%, main every ${MAIN_INTERVAL_DAYS}d, dungeon every ${DUNGEON_INTERVAL_DAYS}d.`)
console.log(`Seed counts: daily ${DEFAULT_DAILIES.length}, main ${DEFAULT_MAIN_QUESTS.length}, dungeon ${DEFAULT_DUNGEONS.length}.`)

// Scenarios A & B: rolling average (same as before)
for (const days of [30, 90]) {
  console.log(`\n## Scenario A/B — ${days} days rolling (daily 75%, main/dungeon by interval)`)
  console.log('| mode | STR | VIT | AGI | INT | PER | SEN | total |')
  console.log('|---|---:|---:|---:|---:|---:|---:|---:|')
  printRow('legacy statRewards', simulate(days, legacyStatRewards))
  printRow('rewardStatWeights', simulate(days, getBalancedQuestStatRewards))
}

// Scenario C: full seed completion + 90d / 180d dailies
console.log(`\n## Scenario C — all mains + all dungeons cleared once, + daily 90d`)
console.log('| mode | STR | VIT | AGI | INT | PER | SEN | total |')
console.log('|---|---:|---:|---:|---:|---:|---:|---:|')
printRow('legacy statRewards', simulateFullSeed(90, legacyStatRewards))
printRow('rewardStatWeights', simulateFullSeed(90, getBalancedQuestStatRewards))

console.log(`\n## Scenario C — all mains + all dungeons cleared once, + daily 180d`)
console.log('| mode | STR | VIT | AGI | INT | PER | SEN | total |')
console.log('|---|---:|---:|---:|---:|---:|---:|---:|')
printRow('legacy statRewards', simulateFullSeed(180, legacyStatRewards))
printRow('rewardStatWeights', simulateFullSeed(180, getBalancedQuestStatRewards))

// Group output for target validation
console.log(`\n## Group breakdown — target validation`)
console.log('| scenario | INT+PER% | AGI+SEN% | STR+VIT% | max/min | targets |')
console.log('|---|---|---|---|---|---|')
for (const [label, totals] of [
  ['A/B rolling 30d legacy', simulate(30, legacyStatRewards)],
  ['A/B rolling 30d weighted', simulate(30, getBalancedQuestStatRewards)],
  ['A/B rolling 90d legacy', simulate(90, legacyStatRewards)],
  ['A/B rolling 90d weighted', simulate(90, getBalancedQuestStatRewards)],
  ['C full+90d legacy', simulateFullSeed(90, legacyStatRewards)],
  ['C full+90d weighted', simulateFullSeed(90, getBalancedQuestStatRewards)],
  ['C full+180d legacy', simulateFullSeed(180, legacyStatRewards)],
  ['C full+180d weighted', simulateFullSeed(180, getBalancedQuestStatRewards)],
] as [string, StatTotals][]) {
  printGroupRow(label, totals)
}

console.log(`\nTargets: INT+PER < 45% | AGI+SEN ≥ 20% | STR+VIT ≥ 25% | max/min ratio < 5×`)
