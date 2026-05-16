/**
 * 12-10A manual battle smoke simulation.
 * Run with: npx tsx scripts/sim-manual-battle-basic.ts
 *
 * Compares auto wave combat with simple manual strategies. This does not mutate
 * app state and intentionally reuses the same combat helpers as the app.
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
  getEquippedItems,
  getPlayerCombatSkills,
  resolveAction,
  simulateGateWaveBattle,
  tickRoundEffects,
} from '../src/lib/game'
import type { BattleActorState } from '../src/lib/game'
import type { ActiveCombatEffect, EquipmentState, JobId, MonsterDefinition, SkillDefinition, StatKey } from '../src/lib/types'

type Strategy = 'basic_only' | 'skill_first' | 'defensive_under_40' | 'defend_only'

const MAX_TURNS = 30
const ITERATIONS = 100

const equipment: EquipmentState = {
  weapon: ITEM_POOL.find(item => item.name.includes('그림자'))?.id,
  armor: ITEM_POOL.find(item => item.name.includes('강철'))?.id,
}

const build = {
  name: 'Manual baseline C-rank tester',
  level: 30,
  jobId: 'steelheart-fighter' as JobId,
  stats: { STR: 58, VIT: 62, AGI: 42, INT: 72, PER: 58, SEN: 50 } as Record<StatKey, number>,
}

const equippedItems = getEquippedItems(ITEM_POOL, equipment)
const playerSkills = getPlayerCombatSkills({ jobId: build.jobId, equippedItems, allSkills: SKILL_DEFINITIONS })
const playerStats = calculatePlayerCombatStats({
  level: build.level,
  stats: build.stats,
  equippedItems,
  activeConsumableEffects: [],
  jobId: build.jobId,
  skills: playerSkills,
})

const pickManualSkill = (
  strategy: Strategy,
  player: BattleActorState,
  monster: BattleActorState,
  skills: SkillDefinition[],
  activeEffects: ActiveCombatEffect[],
  turnNumber: number
): SkillDefinition | 'defend' => {
  if (strategy === 'defend_only') return 'defend'
  if (strategy === 'defensive_under_40' && player.hp / player.maxHp < 0.4) return 'defend'
  if (strategy === 'basic_only') return BASIC_ATTACK_SKILL

  const context = buildBattleSkillContext(player, monster, activeEffects, turnNumber)
  return chooseSkill(player, skills, context)
}

const simulateManual = (gate: (typeof GATE_DEFINITIONS)[number], strategy: Strategy, seed: number) => {
  const rng = createSeededRng(seed)
  const monsters = gate.monsterIds
    .map(id => MONSTER_DEFINITIONS.find(monster => monster.id === id))
    .filter((monster): monster is MonsterDefinition => Boolean(monster))
  const monsterSkillIds = new Set(monsters.flatMap(monster => monster.skillIds))
  const monsterSkills = SKILL_DEFINITIONS.filter(skill => skill.ownerType === 'monster' && monsterSkillIds.has(skill.id))
  const allSkills = ensureBasicAttack([...playerSkills, ...monsterSkills])
  let player = createPlayerBattleActor(build.name, playerStats, allSkills)
  let activeEffects: ActiveCombatEffect[] = []
  let turns = 0
  let clearedWaves = 0

  for (const monsterDef of monsters) {
    let monster = createMonsterBattleActor(monsterDef)
    while (player.hp > 0 && monster.hp > 0 && turns < MAX_TURNS) {
      player = decrementCooldowns(player)
      const picked = pickManualSkill(strategy, player, monster, allSkills, activeEffects, turns + 1)
      if (picked === 'defend') {
        activeEffects = [
          ...activeEffects.filter(effect => !(effect.targetId === 'player' && effect.kind === 'damage_reduction')),
          {
            sourceSkillId: 'manual-defend',
            kind: 'damage_reduction',
            value: 0.4,
            remainingTurns: 1,
            targetId: 'player',
          },
        ]
        turns += 1
      } else {
        const resolved = resolveAction({
          actor: player,
          target: monster,
          skill: picked,
          activeEffects,
          rng,
          turnNumber: turns + 1,
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

  return player.hp <= 0
    ? 'defeat'
    : clearedWaves >= monsters.length
      ? 'victory'
      : 'draw'
}

const summarize = (gate: (typeof GATE_DEFINITIONS)[number], strategy: Strategy) => {
  const counts = { victory: 0, defeat: 0, draw: 0 }
  for (let i = 0; i < ITERATIONS; i += 1) {
    counts[simulateManual(gate, strategy, 12100 + i) as keyof typeof counts] += 1
  }
  return counts
}

for (const gate of GATE_DEFINITIONS.filter(item => ['E', 'D', 'C'].includes(item.rank))) {
  const monsters = gate.monsterIds
    .map(id => MONSTER_DEFINITIONS.find(monster => monster.id === id))
    .filter((monster): monster is MonsterDefinition => Boolean(monster))
  const auto = simulateGateWaveBattle({
    playerName: build.name,
    playerStats,
    monsters,
    skills: playerSkills,
    seed: 12100,
    gateInstanceId: gate.id,
  })

  console.log(`\n${gate.name} (${gate.rank}) auto=${auto.result}`)
  for (const strategy of ['basic_only', 'skill_first', 'defensive_under_40', 'defend_only'] as Strategy[]) {
    const result = summarize(gate, strategy)
    console.log(`  ${strategy}: W ${result.victory} / D ${result.defeat} / Draw ${result.draw}`)
  }
}
