/**
 * 12-16 shadow expedition simulation.
 * Run with: npx tsx scripts/sim-shadow-expedition.ts
 */
import {
  SHADOW_EXPEDITION_TEMPLATES,
  SHADOW_EXPEDITION_COMMAND_LABEL,
  SHADOW_EXPEDITION_OUTCOME_LABEL,
  createShadowExpeditionForDate,
  getShadowExpeditionPartyPower,
  resolveShadowExpeditionCommand,
} from '../src/lib/shadowExpeditions'
import { SHADOW_DEFINITIONS, createOwnedShadow } from '../src/lib/shadows'
import type { OwnedShadow, ShadowExpedition, ShadowExpeditionCommand, ShadowExpeditionType, ShadowRole } from '../src/lib/types'

const ITERATIONS = 600
const SEED_BASE = 121_600

const createRng = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

type PartyCase = {
  id: string
  shadowIds: string[]
  level?: number
  enhancementLevel?: number
}

type StrategyId = 'attack_only' | 'balanced' | 'safe' | 'greedy_search' | 'role_matched'

const PARTY_CASES: PartyCase[] = [
  { id: 'low_party', shadowIds: ['shadow-rat', 'shadow-sentry'], level: 1, enhancementLevel: 0 },
  { id: 'basic_party', shadowIds: ['shadow-rat', 'shadow-infantry', 'forgetting-recorder'], level: 4, enhancementLevel: 0 },
  { id: 'trained_party', shadowIds: ['black-shieldman', 'forgetting-scribe', 'fatigue-shieldman', 'rift-gladiator', 'greed-collector'], level: 9, enhancementLevel: 2 },
  { id: 'named_party', shadowIds: ['organ-fatigue-shield', 'karden-forgetting-scribe', 'verk-steel-knight', 'raven-running-shadow', 'grid-greed-hound'], level: 10, enhancementLevel: 2 },
]

const STRATEGIES: StrategyId[] = ['attack_only', 'balanced', 'safe', 'greedy_search', 'role_matched']

const makeParty = (partyCase: PartyCase): OwnedShadow[] => partyCase.shadowIds.map((id, index) => {
  const definition = SHADOW_DEFINITIONS.find(item => item.id === id)
  if (!definition) throw new Error(`Unknown shadow definition: ${id}`)
  return {
    ...createOwnedShadow(definition, () => 0.42),
    instanceId: `${partyCase.id}-${id}-${index}`,
    level: partyCase.level ?? 1,
    xp: 0,
    enhancementLevel: partyCase.enhancementLevel ?? 0,
  }
})

const makeExpedition = (type: ShadowExpeditionType, party: OwnedShadow[]): ShadowExpedition => {
  const template = SHADOW_EXPEDITION_TEMPLATES.find(item => item.type === type)
  if (!template) throw new Error(`Unknown expedition type: ${type}`)
  const base = createShadowExpeditionForDate(`2026-05-${18 + SHADOW_EXPEDITION_TEMPLATES.indexOf(template)}`)
  return {
    ...base,
    id: `sim-${type}`,
    type: template.type,
    title: template.title,
    description: template.description,
    requiredPower: template.requiredPower,
    recommendedRoles: template.recommendedRoles,
    selectedShadowIds: party.map(shadow => shadow.instanceId),
    status: 'in_progress',
    progress: 0,
    risk: template.startRisk,
    turn: 0,
    maxTurns: template.maxTurns,
    logs: [],
    result: undefined,
    searchStacks: 0,
    analyzeStacks: 0,
    scoutStacks: 0,
  }
}

const commandForRole = (role: ShadowRole): ShadowExpeditionCommand => {
  if (role === 'assault') return 'attack'
  if (role === 'guard') return 'defend'
  if (role === 'scout') return 'scout'
  if (role === 'analyst') return 'analyze'
  if (role === 'hunter') return 'search'
  return 'analyze'
}

const chooseCommand = (
  strategy: StrategyId,
  expedition: ShadowExpedition,
  party: OwnedShadow[],
  turn: number
): ShadowExpeditionCommand => {
  if (strategy === 'attack_only') return 'attack'
  if (strategy === 'safe') {
    if (expedition.risk >= 48) return party.some(shadow => shadow.role === 'guard' || shadow.role === 'support') ? 'defend' : 'scout'
    return ['scout', 'defend', 'analyze', 'attack'][turn % 4] as ShadowExpeditionCommand
  }
  if (strategy === 'greedy_search') {
    if ((expedition.searchStacks ?? 0) < 3 && expedition.risk < 78) return 'search'
    if (expedition.risk >= 78) return 'defend'
    return expedition.analyzeStacks ? 'attack' : 'analyze'
  }
  if (strategy === 'role_matched') {
    const role = expedition.recommendedRoles[turn % expedition.recommendedRoles.length]
    const command = commandForRole(role)
    if (command === 'search' && expedition.risk > 72) return 'scout'
    return command
  }
  if (expedition.risk >= 72) return 'defend'
  if (expedition.progress < 35 && (expedition.analyzeStacks ?? 0) === 0) return 'analyze'
  if (expedition.risk <= 45 && (expedition.searchStacks ?? 0) < 1) return 'search'
  return expedition.risk > 58 ? 'scout' : 'attack'
}

const runOne = (
  type: ShadowExpeditionType,
  party: OwnedShadow[],
  strategy: StrategyId,
  seed: number
): ShadowExpedition => {
  let expedition = makeExpedition(type, party)
  const rng = createRng(seed)
  let commandIndex = 0
  while (expedition.status === 'in_progress' && !expedition.result) {
    const command = chooseCommand(strategy, expedition, party, commandIndex)
    expedition = resolveShadowExpeditionCommand(
      expedition,
      party,
      command,
      rng,
      () => `sim-log-${seed}-${commandIndex++}`
    )
  }
  return expedition
}

console.log('# 12-16 Shadow Expedition Simulation')
console.log(`iterations: ${ITERATIONS}`)
console.log('')
console.log('| Party | Expedition | Strategy | Power/Req | Great | Success | Partial | Failure | AvgTurns | AvgProgress | AvgRisk | AvgXP | AvgEssence | Notes |')
console.log('|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|')

for (const partyCase of PARTY_CASES) {
  const party = makeParty(partyCase)
  for (const template of SHADOW_EXPEDITION_TEMPLATES) {
    const power = getShadowExpeditionPartyPower(party, template)
    for (const strategy of STRATEGIES) {
      const counts = { great_success: 0, success: 0, partial: 0, failure: 0 }
      let turns = 0
      let progress = 0
      let risk = 0
      let xp = 0
      let essence = 0
      for (let i = 0; i < ITERATIONS; i += 1) {
        const result = runOne(template.type, party, strategy, SEED_BASE + i + partyCase.id.length * 1_000 + template.type.length * 10_000 + strategy.length * 100)
        const outcome = result.result?.outcome ?? 'failure'
        counts[outcome] += 1
        turns += result.turn
        progress += result.result?.progress ?? result.progress
        risk += result.result?.risk ?? result.risk
        xp += result.result?.shadowXpGained ?? 0
        essence += result.result?.essenceGained ?? 0
      }
      const notes: string[] = []
      const failureRate = counts.failure / ITERATIONS
      const greatRate = counts.great_success / ITERATIONS
      const successPlus = (counts.great_success + counts.success) / ITERATIONS
      if (partyCase.id === 'low_party' && successPlus > 0.65) notes.push('low may be generous')
      if (partyCase.id === 'basic_party' && successPlus < 0.35) notes.push('basic may be harsh')
      if (partyCase.id === 'trained_party' && failureRate > 0.12) notes.push('trained unstable')
      if (strategy === 'greedy_search' && essence / ITERATIONS < 3) notes.push('greedy reward low')
      if (strategy === 'safe' && greatRate > 0.4) notes.push('safe great too high')
      console.log(
        `| ${partyCase.id} | ${template.title} | ${strategy} | ${power}/${template.requiredPower} | ` +
        `${((counts.great_success / ITERATIONS) * 100).toFixed(0)}% | ` +
        `${((counts.success / ITERATIONS) * 100).toFixed(0)}% | ` +
        `${((counts.partial / ITERATIONS) * 100).toFixed(0)}% | ` +
        `${((counts.failure / ITERATIONS) * 100).toFixed(0)}% | ` +
        `${(turns / ITERATIONS).toFixed(1)} | ${(progress / ITERATIONS).toFixed(1)} | ${(risk / ITERATIONS).toFixed(1)} | ` +
        `${(xp / ITERATIONS).toFixed(1)} | ${(essence / ITERATIONS).toFixed(1)} | ${notes.join(', ') || '-'} |`
      )
    }
  }
}

console.log('')
console.log('Command reference:')
for (const command of Object.keys(SHADOW_EXPEDITION_COMMAND_LABEL) as ShadowExpeditionCommand[]) {
  console.log(`- ${command}: ${SHADOW_EXPEDITION_COMMAND_LABEL[command]}`)
}
console.log('Outcome reference:')
for (const outcome of Object.keys(SHADOW_EXPEDITION_OUTCOME_LABEL) as Array<keyof typeof SHADOW_EXPEDITION_OUTCOME_LABEL>) {
  console.log(`- ${outcome}: ${SHADOW_EXPEDITION_OUTCOME_LABEL[outcome]}`)
}
