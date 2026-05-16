/**
 * 12-10D manual battle balance simulation.
 * Run with: npx tsx scripts/sim-manual-battle-balance.ts
 *
 * Compares auto battle vs manual strategies across E/D/C gates and Build A-F.
 * This script is read-only: it does not mutate app state or production data.
 */
import { GATE_DEFINITIONS, ITEM_POOL, MONSTER_DEFINITIONS, SKILL_DEFINITIONS } from '../src/lib/seed'
import {
  BASIC_ATTACK_SKILL,
  buildBattleSkillContext,
  calculatePlayerCombatStats,
  chooseSkill,
  createMonsterBattleActor,
  createPlayerBattleActor,
  createSeededRng,
  decrementCooldowns,
  ensureBasicAttack,
  getPlayerCombatSkills,
  resolveAction,
  simulateGateWaveBattle,
  tickRoundEffects,
} from '../src/lib/game'
import type { BattleActorState } from '../src/lib/game'
import type { ActiveCombatEffect, Item, JobId, MonsterDefinition, SkillDefinition, StatKey } from '../src/lib/types'

const ITERATIONS = 150
const MAX_TURNS = 30
const SEED_BASE = 121_000

type StrategyId =
  | 'auto'
  | 'manual_basic_only'
  | 'manual_skill_first'
  | 'manual_defensive_under_40'
  | 'manual_consumable_smart_none'
  | 'manual_consumable_smart'
  | 'manual_defend_only'

interface BuildItemSpec {
  name: string
  itemPoolIndex?: number
  enhancementLevel?: number
}

interface BuildSpec {
  id: string
  name: string
  level: number
  jobId: JobId
  stats: Record<StatKey, number>
  items?: BuildItemSpec[]
}

interface SimResult {
  result: 'victory' | 'defeat' | 'draw'
  turns: number
  remainingHp: number
  consumableUses: number
}

const BUILDS: BuildSpec[] = [
  {
    id: 'A',
    name: 'Build A Lv5',
    level: 5,
    jobId: 'unawakened',
    stats: { STR: 12, VIT: 12, AGI: 11, INT: 11, PER: 11, SEN: 11 },
  },
  {
    id: 'B',
    name: 'Build B Lv10',
    level: 10,
    jobId: 'unawakened',
    stats: { STR: 20, VIT: 20, AGI: 16, INT: 21, PER: 18, SEN: 17 },
    items: [{ name: '의지의 룬', itemPoolIndex: 21 }],
  },
  {
    id: 'C',
    name: 'Build C Lv20',
    level: 20,
    jobId: 'grimoire-decoder',
    stats: { STR: 26, VIT: 28, AGI: 20, INT: 38, PER: 30, SEN: 24 },
    items: [
      { name: '강철 손목보호대', itemPoolIndex: 34, enhancementLevel: 1 },
      { name: '고요의 반지', itemPoolIndex: 35 },
    ],
  },
  {
    id: 'D',
    name: 'Build D Lv30',
    level: 30,
    jobId: 'steelheart-fighter',
    stats: { STR: 58, VIT: 62, AGI: 42, INT: 72, PER: 58, SEN: 50 },
    items: [
      { name: '그림자 단검', itemPoolIndex: 40, enhancementLevel: 1 },
      { name: '강철 손목보호대', itemPoolIndex: 34, enhancementLevel: 2 },
      { name: '금서의 책갈피', itemPoolIndex: 42, enhancementLevel: 1 },
    ],
  },
  {
    id: 'E',
    name: 'Build E Lv45',
    level: 45,
    jobId: 'fate-harmonizer',
    stats: { STR: 92, VIT: 98, AGI: 70, INT: 126, PER: 96, SEN: 82 },
    items: [
      { name: '투사의 장갑', itemPoolIndex: 44, enhancementLevel: 3 },
      { name: '검은 정장', itemPoolIndex: 39, enhancementLevel: 2 },
      { name: '시간의 회중시계', itemPoolIndex: 51, enhancementLevel: 3 },
      { name: '시스템의 조각', itemPoolIndex: 48, enhancementLevel: 2 },
    ],
  },
  {
    id: 'F',
    name: 'Build F Lv60',
    level: 60,
    jobId: 'fate-harmonizer',
    stats: { STR: 140, VIT: 150, AGI: 105, INT: 185, PER: 142, SEN: 122 },
    items: [
      { name: '왕의 검', itemPoolIndex: 47, enhancementLevel: 4 },
      { name: '그림자 왕관', itemPoolIndex: 52, enhancementLevel: 3 },
      { name: '시간의 회중시계', itemPoolIndex: 51, enhancementLevel: 4 },
      { name: '시스템의 조각', itemPoolIndex: 48, enhancementLevel: 4 },
    ],
  },
]

const GATE_IDS = [
  'gate-rift-alley',
  'gate-rift-backstreet',
  'gate-rift-nest',
  'gate-lair-of-sloth',
  'gate-sloth-patrol',
  'gate-archive-of-forgetting',
  'gate-corridor-of-fatigue',
  'gate-rift-training-grounds',
  'gate-greed-vault',
]

const STRATEGIES: Array<{ id: StrategyId; label: string }> = [
  { id: 'auto', label: 'auto' },
  { id: 'manual_basic_only', label: 'manual basic only' },
  { id: 'manual_skill_first', label: 'manual skill first' },
  { id: 'manual_defensive_under_40', label: 'manual defensive under 40%' },
  { id: 'manual_consumable_smart_none', label: 'manual consumable smart (no consumables)' },
  { id: 'manual_consumable_smart', label: 'manual consumable smart (stat+penalty)' },
  { id: 'manual_defend_only', label: 'manual defend only' },
]

const makeItem = (spec: BuildItemSpec): Item => {
  const base = ITEM_POOL.find(item => item.name === spec.name) ?? (
    typeof spec.itemPoolIndex === 'number' ? ITEM_POOL[spec.itemPoolIndex] : undefined
  )
  if (!base) throw new Error(`Unknown item in sim build: ${spec.name}`)
  return {
    ...base,
    id: `sim-${spec.name}-${spec.enhancementLevel ?? 0}`,
    acquiredAt: '2026-05-16T00:00:00.000Z',
    enhancementLevel: spec.enhancementLevel,
  }
}

const formatPct = (value: number): string => `${(value * 100).toFixed(0)}%`
const deltaPct = (value: number): string => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(0)}pp`

const getBuildRuntime = (build: BuildSpec) => {
  const equippedItems = (build.items ?? []).map(makeItem)
  const skills = getPlayerCombatSkills({
    jobId: build.jobId,
    equippedItems,
    allSkills: SKILL_DEFINITIONS,
  })
  const playerStats = calculatePlayerCombatStats({
    level: build.level,
    stats: build.stats,
    equippedItems,
    activeConsumableEffects: [],
    jobId: build.jobId,
    skills,
  })
  return { equippedItems, skills, playerStats }
}

const playerSkillIdsFrom = (skills: SkillDefinition[]): string[] => {
  return ensureBasicAttack(skills)
    .filter(skill => skill.ownerType === 'common' || skill.ownerType === 'job' || skill.ownerType === 'equipment')
    .map(skill => skill.id)
}

const chooseManualSkillFirst = (
  player: BattleActorState,
  monster: BattleActorState,
  skills: SkillDefinition[],
  activeEffects: ActiveCombatEffect[],
  turnNumber: number
): SkillDefinition => {
  const playerUsableSkills = ensureBasicAttack(skills).filter(skill =>
    player.skillIds.includes(skill.id) &&
    (player.cooldowns[skill.id] ?? 0) <= 0
  )
  const attackSkills = playerUsableSkills
    .filter(skill => skill.type === 'attack' && skill.id !== BASIC_ATTACK_SKILL.id)
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0))
  if (attackSkills[0]) return attackSkills[0]

  const context = buildBattleSkillContext(player, monster, activeEffects, turnNumber)
  return chooseSkill(player, playerUsableSkills, context)
}

const applyManualDefend = (activeEffects: ActiveCombatEffect[]): ActiveCombatEffect[] => {
  return [
    ...activeEffects.filter(effect => !(effect.targetId === 'player' && effect.kind === 'damage_reduction')),
    {
      sourceSkillId: 'manual-defend',
      kind: 'damage_reduction',
      value: 0.4,
      remainingTurns: 1,
      targetId: 'player',
    },
  ]
}

const applySmartStatConsumable = (activeEffects: ActiveCombatEffect[], build: BuildSpec): ActiveCombatEffect[] => {
  const statValue = build.id === 'C' ? 6 : build.id === 'D' ? 8 : 10
  return [
    ...activeEffects,
    {
      sourceSkillId: 'manual-consumable-stat-sim-str',
      kind: 'stat',
      stat: 'atk',
      value: statValue * 2,
      remainingTurns: 3,
      targetId: 'player',
    },
  ]
}

const monsterSkillsFor = (monsters: MonsterDefinition[]): SkillDefinition[] => {
  const ids = new Set(monsters.flatMap(monster => monster.skillIds))
  return SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && ids.has(skill.id))
}

const simulateAuto = (
  build: BuildSpec,
  gate: (typeof GATE_DEFINITIONS)[number],
  seed: number
): SimResult => {
  const runtime = getBuildRuntime(build)
  const monsters = gate.monsterIds
    .map(id => MONSTER_DEFINITIONS.find(monster => monster.id === id))
    .filter((monster): monster is MonsterDefinition => Boolean(monster))
  const log = simulateGateWaveBattle({
    playerName: build.name,
    playerStats: runtime.playerStats,
    monsters,
    skills: [...runtime.skills, ...monsterSkillsFor(monsters)],
    seed,
    gateInstanceId: `sim-${build.id}-${gate.id}`,
  })
  return {
    result: log.result,
    turns: log.totalTurns,
    remainingHp: log.playerHpRemaining,
    consumableUses: 0,
  }
}

const simulateManual = (
  build: BuildSpec,
  gate: (typeof GATE_DEFINITIONS)[number],
  strategy: Exclude<StrategyId, 'auto'>,
  seed: number
): SimResult => {
  const rng = createSeededRng(seed)
  const runtime = getBuildRuntime(build)
  const monsters = gate.monsterIds
    .map(id => MONSTER_DEFINITIONS.find(monster => monster.id === id))
    .filter((monster): monster is MonsterDefinition => Boolean(monster))
  const allSkills = ensureBasicAttack([...runtime.skills, ...monsterSkillsFor(monsters)])
  const playerSkillIds = playerSkillIdsFrom(runtime.skills)
  let player = createPlayerBattleActor(build.name, runtime.playerStats, allSkills)
  player = { ...player, skillIds: playerSkillIds }
  let activeEffects: ActiveCombatEffect[] = []
  let turns = 0
  let clearedWaves = 0
  let consumableUses = 0
  let usedStatConsumable = false
  let usedPenaltyConsumable = false
  const hasConsumables = strategy === 'manual_consumable_smart'

  for (const monsterDef of monsters) {
    let monster = createMonsterBattleActor(monsterDef)
    while (player.hp > 0 && monster.hp > 0 && turns < MAX_TURNS) {
      player = decrementCooldowns(player)
      const hpRatio = player.hp / player.maxHp
      const canUseConsumable = hasConsumables && consumableUses < 2
      const shouldUseStatConsumable =
        strategy === 'manual_consumable_smart' &&
        canUseConsumable &&
        !usedStatConsumable &&
        gate.rank === 'C' &&
        hpRatio <= 0.8
      const shouldUsePenaltyConsumable =
        strategy === 'manual_consumable_smart' &&
        canUseConsumable &&
        !usedPenaltyConsumable &&
        hpRatio <= 0.35

      if (shouldUseStatConsumable) {
        activeEffects = applySmartStatConsumable(activeEffects, build)
        usedStatConsumable = true
        consumableUses += 1
        turns += 1
      } else if (shouldUsePenaltyConsumable) {
        usedPenaltyConsumable = true
        consumableUses += 1
        turns += 1
      } else if (strategy === 'manual_defend_only') {
        activeEffects = applyManualDefend(activeEffects)
        turns += 1
      } else if (strategy === 'manual_defensive_under_40' && hpRatio < 0.4) {
        activeEffects = applyManualDefend(activeEffects)
        turns += 1
      } else {
        const picked = strategy === 'manual_basic_only'
          ? BASIC_ATTACK_SKILL
          : chooseManualSkillFirst(player, monster, allSkills, activeEffects, turns + 1)
        const resolved = resolveAction({
          actor: player,
          target: monster,
          skill: picked,
          activeEffects,
          rng,
          turnNumber: turns + 1,
          waveNumber: clearedWaves + 1,
        })
        player = {
          ...resolved.actor,
          cooldowns: { ...resolved.actor.cooldowns, [picked.id]: picked.cooldownTurns ?? 0 },
        }
        monster = resolved.target
        activeEffects = resolved.activeEffects
        turns += 1
      }

      if (player.hp <= 0 || monster.hp <= 0 || turns >= MAX_TURNS) break

      monster = decrementCooldowns(monster)
      const monsterSkill = chooseSkill(
        monster,
        allSkills.filter(skill => skill.ownerType === 'common' || skill.ownerType === 'monster'),
        buildBattleSkillContext(monster, player, activeEffects, turns + 1)
      )
      const resolved = resolveAction({
        actor: monster,
        target: player,
        skill: monsterSkill,
        activeEffects,
        rng,
        turnNumber: turns + 1,
        waveNumber: clearedWaves + 1,
      })
      monster = {
        ...resolved.actor,
        cooldowns: { ...resolved.actor.cooldowns, [monsterSkill.id]: monsterSkill.cooldownTurns ?? 0 },
      }
      player = resolved.target
      activeEffects = tickRoundEffects(resolved.activeEffects)
      turns += 1

    }

    if (monster.hp <= 0) clearedWaves += 1
    if (player.hp <= 0 || turns >= MAX_TURNS) break
  }

  return {
    result: player.hp <= 0
      ? 'defeat'
      : clearedWaves >= monsters.length
        ? 'victory'
        : 'draw',
    turns,
    remainingHp: Math.max(0, player.hp),
    consumableUses,
  }
}

const summarize = (results: SimResult[]) => {
  const victoryCount = results.filter(result => result.result === 'victory').length
  const defeatCount = results.filter(result => result.result === 'defeat').length
  const drawCount = results.filter(result => result.result === 'draw').length
  return {
    victoryRate: victoryCount / results.length,
    defeatRate: defeatCount / results.length,
    drawRate: drawCount / results.length,
    avgTurns: results.reduce((sum, result) => sum + result.turns, 0) / results.length,
    avgRemainingHp: results.reduce((sum, result) => sum + result.remainingHp, 0) / results.length,
    consumableUsedAvg: results.reduce((sum, result) => sum + result.consumableUses, 0) / results.length,
  }
}

const summarizeRows = (filteredRows: typeof rows) => {
  if (filteredRows.length === 0) return undefined
  return {
    victoryRate: filteredRows.reduce((sum, row) => sum + row.summary.victoryRate, 0) / filteredRows.length,
    defeatRate: filteredRows.reduce((sum, row) => sum + row.summary.defeatRate, 0) / filteredRows.length,
    drawRate: filteredRows.reduce((sum, row) => sum + row.summary.drawRate, 0) / filteredRows.length,
    consumableUsedAvg: filteredRows.reduce((sum, row) => sum + row.summary.consumableUsedAvg, 0) / filteredRows.length,
  }
}

const rows: Array<{
  build: BuildSpec
  gate: (typeof GATE_DEFINITIONS)[number]
  strategy: StrategyId
  summary: ReturnType<typeof summarize>
}> = []

for (const build of BUILDS) {
  for (const gateId of GATE_IDS) {
    const gate = GATE_DEFINITIONS.find(item => item.id === gateId)
    if (!gate) throw new Error(`Unknown gate: ${gateId}`)

    for (const strategy of STRATEGIES) {
      const results: SimResult[] = []
      for (let i = 0; i < ITERATIONS; i += 1) {
        const seed = SEED_BASE + build.id.charCodeAt(0) * 10_000 + gate.id.length * 100 + i
        results.push(strategy.id === 'auto'
          ? simulateAuto(build, gate, seed)
          : simulateManual(build, gate, strategy.id, seed))
      }
      rows.push({ build, gate, strategy: strategy.id, summary: summarize(results) })
    }
  }
}

console.log('# 12-10D Manual Battle Balance')
console.log(`iterations: ${ITERATIONS}`)
console.log(`maxTurns: ${MAX_TURNS}`)
console.log('')

console.log('## Full Matrix')
console.log('| Build | Gate | Rank | Strategy | Victory | Defeat | Draw | AvgTurns | AvgHP | Consumables |')
console.log('|---|---|---|---|---:|---:|---:|---:|---:|---:|')
for (const row of rows) {
  const label = STRATEGIES.find(strategy => strategy.id === row.strategy)?.label ?? row.strategy
  console.log(
    `| ${row.build.id} | ${row.gate.name} | ${row.gate.rank} | ${label} | ` +
    `${formatPct(row.summary.victoryRate)} | ${formatPct(row.summary.defeatRate)} | ${formatPct(row.summary.drawRate)} | ` +
    `${row.summary.avgTurns.toFixed(1)} | ${row.summary.avgRemainingHp.toFixed(1)} | ${row.summary.consumableUsedAvg.toFixed(2)} |`
  )
}

console.log('')
console.log('## Delta Summary vs Auto')
console.log('| Build | Gate | Rank | SkillFirst dV | Defensive dV / dDraw | ConsumableSmart dV | DefendOnly Draw | Notes |')
console.log('|---|---|---|---:|---:|---:|---:|---|')
for (const build of BUILDS) {
  for (const gateId of GATE_IDS) {
    const gate = GATE_DEFINITIONS.find(item => item.id === gateId)
    if (!gate) continue
    const get = (strategy: StrategyId) => rows.find(row => row.build.id === build.id && row.gate.id === gate.id && row.strategy === strategy)?.summary
    const auto = get('auto')
    const skill = get('manual_skill_first')
    const defensive = get('manual_defensive_under_40')
    const consumable = get('manual_consumable_smart')
    const defendOnly = get('manual_defend_only')
    if (!auto || !skill || !defensive || !consumable || !defendOnly) continue

    const notes: string[] = []
    if (build.id === 'C' && gate.rank === 'C' && skill.victoryRate > 0.35) notes.push('Build C C급 과승 주의')
    if (build.id === 'D' && gate.rank === 'C' && consumable.victoryRate >= 0.95) notes.push('Build D consumable 과승')
    if (defendOnly.victoryRate > 0) notes.push('defend farming risk')
    if (defendOnly.drawRate >= 0.8) notes.push('defend draw OK')

    console.log(
      `| ${build.id} | ${gate.name} | ${gate.rank} | ` +
      `${deltaPct(skill.victoryRate - auto.victoryRate)} | ` +
      `${deltaPct(defensive.victoryRate - auto.victoryRate)} / ${deltaPct(defensive.drawRate - auto.drawRate)} | ` +
      `${deltaPct(consumable.victoryRate - auto.victoryRate)} | ` +
      `${formatPct(defendOnly.drawRate)} | ${notes.join(', ') || '-'} |`
    )
  }
}

console.log('')
console.log('## Key Balance Checks')
console.log('| Scope | Strategy | Victory | Defeat | Draw | Consumables |')
console.log('|---|---|---:|---:|---:|---:|')
for (const build of BUILDS.filter(item => ['C', 'D', 'E', 'F'].includes(item.id))) {
  for (const strategy of STRATEGIES) {
    const summary = summarizeRows(rows.filter(row => row.build.id === build.id && row.gate.rank === 'C' && row.strategy === strategy.id))
    if (!summary) continue
    console.log(
      `| Build ${build.id} / C gates | ${strategy.label} | ` +
      `${formatPct(summary.victoryRate)} | ${formatPct(summary.defeatRate)} | ${formatPct(summary.drawRate)} | ` +
      `${summary.consumableUsedAvg.toFixed(2)} |`
    )
  }
}

const defendOnlyAll = summarizeRows(rows.filter(row => row.strategy === 'manual_defend_only'))
if (defendOnlyAll) {
  console.log(
    `| All gates | manual defend only | ${formatPct(defendOnlyAll.victoryRate)} | ` +
    `${formatPct(defendOnlyAll.defeatRate)} | ${formatPct(defendOnlyAll.drawRate)} | ` +
    `${defendOnlyAll.consumableUsedAvg.toFixed(2)} |`
  )
}
