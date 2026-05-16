/**
 * 12-7 current gate baseline simulation.
 * Run with: npx tsx scripts/sim-gate-current.ts
 *
 * Measures all existing E/D/C gates against current post-12-6 growth builds.
 * This script does not mutate app state and is not part of the app build.
 */
import {
  GATE_DEFINITIONS,
  ITEM_POOL,
  MONSTER_DEFINITIONS,
  SKILL_DEFINITIONS,
} from '../src/lib/seed'
import {
  calculateCombatPower,
  calculatePlayerCombatStats,
  estimateGateRisk,
  formatEnhancementLabel,
  getEnhancedItemEffects,
  getPlayerCombatSkills,
  summarizeGateWaveBattleSimulations,
} from '../src/lib/game'
import type {
  Item,
  JobId,
  MonsterDefinition,
  StatKey,
} from '../src/lib/types'

const ITERATIONS = 200
const SEED_BASE = 12_700

interface BuildItemSpec {
  name: string
  enhancementLevel?: number
}

interface BuildSpec {
  id: string
  name: string
  intent: string
  level: number
  jobId: JobId
  titleId?: string
  stats: Record<StatKey, number>
  items?: BuildItemSpec[]
}

const BUILDS: BuildSpec[] = [
  {
    id: 'A',
    name: 'Build A — 완전 초급',
    intent: 'Lv3~5, 장비/칭호 없음. E급 입문 가능성 확인',
    level: 5,
    jobId: 'unawakened',
    stats: { STR: 12, VIT: 12, AGI: 11, INT: 11, PER: 11, SEN: 11 },
  },
  {
    id: 'B',
    name: 'Build B — 2주 사용자',
    intent: 'Lv10 전후, common/uncommon 1개, 강화 없음. E 안정/D 위험',
    level: 10,
    jobId: 'unawakened',
    stats: { STR: 20, VIT: 20, AGI: 16, INT: 21, PER: 18, SEN: 17 },
    items: [{ name: '의지의 룬' }],
  },
  {
    id: 'C',
    name: 'Build C — 1개월 사용자',
    intent: 'Lv18~22, 1차 직업, rare 장비 2개, 칭호 1개, 일부 +1. D 도전/C 위험',
    level: 20,
    jobId: 'grimoire-decoder',
    titleId: 'hunter',
    stats: { STR: 26, VIT: 28, AGI: 20, INT: 38, PER: 30, SEN: 24 },
    items: [
      { name: '강철 손목보호대', enhancementLevel: 1 },
      { name: '고요의 반지' },
    ],
  },
  {
    id: 'D',
    name: 'Build D — 2~3개월 사용자',
    intent: 'Lv30 전후, 1차/2차 직업 가능, rare/epic 3개, 주요 장비 +1~+2. C 도전',
    level: 30,
    jobId: 'steelheart-fighter',
    titleId: 'veteran-hunter',
    stats: { STR: 58, VIT: 62, AGI: 42, INT: 72, PER: 58, SEN: 50 },
    items: [
      { name: '그림자 단검', enhancementLevel: 1 },
      { name: '강철 손목보호대', enhancementLevel: 2 },
      { name: '금서의 책갈피', enhancementLevel: 1 },
    ],
  },
  {
    id: 'E',
    name: 'Build E — 6개월 사용자',
    intent: 'Lv45 전후, 2차 직업, epic/legendary 일부, 주요 장비 +2~+4. C 안정/B 설계 기준',
    level: 45,
    jobId: 'fate-harmonizer',
    titleId: 'legend-in-hand',
    stats: { STR: 92, VIT: 98, AGI: 70, INT: 126, PER: 96, SEN: 82 },
    items: [
      { name: '투사의 장갑', enhancementLevel: 3 },
      { name: '검은 정장', enhancementLevel: 2 },
      { name: '시간의 회중시계', enhancementLevel: 3 },
      { name: '시스템의 조각', enhancementLevel: 2 },
    ],
  },
  {
    id: 'F',
    name: 'Build F — 1년 사용자',
    intent: 'Lv60 전후 S랭크, 2차 직업, 강화 장비 다수. E/D/C trivialize 확인',
    level: 60,
    jobId: 'fate-harmonizer',
    titleId: 'national-level-hunter',
    stats: { STR: 140, VIT: 150, AGI: 105, INT: 185, PER: 142, SEN: 122 },
    items: [
      { name: '왕의 검', enhancementLevel: 4 },
      { name: '그림자 왕관', enhancementLevel: 3 },
      { name: '시간의 회중시계', enhancementLevel: 4 },
      { name: '시스템의 조각', enhancementLevel: 4 },
    ],
  },
]

const GATES_TO_CHECK = [
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

const makeItem = (spec: BuildItemSpec): Item => {
  const base = ITEM_POOL.find(item => item.name === spec.name)
  if (!base) throw new Error(`Unknown item in sim build: ${spec.name}`)
  return {
    ...base,
    id: `sim-${spec.name}-${spec.enhancementLevel ?? 0}`,
    acquiredAt: '2026-05-16T00:00:00.000Z',
    enhancementLevel: spec.enhancementLevel,
  }
}

const buildEquipmentText = (items: Item[]): string => {
  if (items.length === 0) return '없음'
  return items
    .map(item => `${item.name}${formatEnhancementLabel(item) ? ` ${formatEnhancementLabel(item)}` : ''}`)
    .join(', ')
}

const describeEnhancedEffects = (items: Item[]): string => {
  const effectLines = items.flatMap(item =>
    getEnhancedItemEffects(item)
      .filter(effect => effect.type === 'stat_bonus')
      .map(effect => `${item.name}${formatEnhancementLabel(item)} ${effect.stat} ${effect.value}`)
  )
  return effectLines.length > 0 ? effectLines.join(', ') : '전투 stat_bonus 없음'
}

const verdictFor = (buildId: string, gateRank: string, victoryRate: number, drawRate: number): string => {
  const v = victoryRate * 100
  const d = drawRate * 100
  if (d > 15) return 'draw 과다 점검'

  if (gateRank === 'E') {
    if (buildId === 'A') return v >= 60 ? '목표 통과' : 'E 입문 과난도'
    return v >= 90 ? '안정' : 'E 안정성 부족'
  }

  if (gateRank === 'D') {
    if (buildId === 'B') return v >= 10 && v <= 50 ? '목표 통과' : v > 50 ? 'B 기준 쉬움' : 'B 기준 과난도'
    if (buildId === 'C') return v >= 40 && v <= 80 ? '목표 통과' : v > 80 ? 'C 기준 쉬움' : 'C 기준 과난도'
    if (buildId === 'D' || buildId === 'E' || buildId === 'F') return v >= 80 ? '안정' : '고성장 안정성 부족'
    return '참고'
  }

  if (gateRank === 'C') {
    if (buildId === 'C') return v <= 35 ? '목표 통과' : 'C가 1개월 기준 쉬움'
    if (buildId === 'D') return v >= 35 && v <= 75 ? '목표 통과' : v > 75 ? 'D 기준 쉬움' : 'D 기준 과난도'
    if (buildId === 'E') return v >= 70 && v <= 95 ? '목표 통과' : v > 95 ? 'C 졸업/B급 필요' : 'E 기준 과난도'
    if (buildId === 'F') return 'trivialize OK'
    return v <= 10 ? '초반 차단' : '초반 과진입'
  }

  return '참고'
}

console.log('# 12-7 Current E/D/C gate simulation')
console.log(`iterations per Build × Gate: ${ITERATIONS}`)
console.log(`seedBase: ${SEED_BASE}`)
console.log('')

console.log('## Build definitions')
console.log('| Build | Level | Job | Title | Stats | Equipment | Enhanced combat stat effects | Intent |')
console.log('|---|---:|---|---|---|---|---|---|')

const buildRuntime = new Map<string, {
  power: number
  playerStats: ReturnType<typeof calculatePlayerCombatStats>
  skills: typeof SKILL_DEFINITIONS
  equippedItems: Item[]
}>()

for (const build of BUILDS) {
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
    jobId: build.jobId,
    skills,
  })
  const power = calculateCombatPower(playerStats)

  buildRuntime.set(build.id, { power, playerStats, skills, equippedItems })

  console.log(
    `| ${build.id} | ${build.level} | ${build.jobId} | ${build.titleId ?? '없음'} | ` +
    `${Object.entries(build.stats).map(([stat, value]) => `${stat} ${value}`).join(', ')} | ` +
    `${buildEquipmentText(equippedItems)} | ${describeEnhancedEffects(equippedItems)} | ${build.intent} |`
  )
}

console.log('')
console.log('## Gate matrix')
console.log('| Build | Gate | Rank | Waves | PlayerPower | Recommended | Ratio | Risk | Victory | Defeat | Draw | AvgTurns | AvgRemainingHp | Verdict |')
console.log('|---|---|---|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---|')

for (const build of BUILDS) {
  const runtime = buildRuntime.get(build.id)
  if (!runtime) continue

  for (const gateId of GATES_TO_CHECK) {
    const gate = GATE_DEFINITIONS.find(item => item.id === gateId)
    if (!gate) throw new Error(`Unknown gate: ${gateId}`)
    const monsters = gate.monsterIds
      .map(monsterId => MONSTER_DEFINITIONS.find(monster => monster.id === monsterId))
      .filter((monster): monster is MonsterDefinition => Boolean(monster))
    const monsterSkillIds = new Set(monsters.flatMap(monster => monster.skillIds))
    const monsterSkills = SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && monsterSkillIds.has(skill.id))

    const summary = summarizeGateWaveBattleSimulations({
      iterations: ITERATIONS,
      playerStats: runtime.playerStats,
      monsters,
      skills: [...runtime.skills, ...monsterSkills],
      gateInstanceId: `sim-current-${build.id}-${gate.id}`,
      seedBase: SEED_BASE + build.id.charCodeAt(0) * 100 + gate.id.length,
    })

    const ratio = runtime.power / Math.max(1, gate.recommendedPower)
    const risk = estimateGateRisk(runtime.power, gate.recommendedPower)
    const verdict = verdictFor(build.id, gate.rank, summary.victoryRate, summary.drawRate)

    console.log(
      `| ${build.id} | ${gate.name} | ${gate.rank} | ${gate.monsterIds.length} | ` +
      `${runtime.power} | ${gate.recommendedPower} | ${ratio.toFixed(2)} | ${risk} | ` +
      `${(summary.victoryRate * 100).toFixed(0)}% | ${(summary.defeatRate * 100).toFixed(0)}% | ${(summary.drawRate * 100).toFixed(0)}% | ` +
      `${summary.averageTurns.toFixed(1)} | ${summary.averagePlayerHpRemaining.toFixed(1)} | ${verdict} |`
    )
  }
}
