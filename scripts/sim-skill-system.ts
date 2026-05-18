import { SKILL_DEFINITIONS } from '../src/lib/seed'
import { BASIC_ATTACK_SKILL, resolveAction, type BattleActorState } from '../src/lib/game'
import {
  getAvailableCombatSkillsForLoadout,
  getSkillMastery,
  getSkillMasteryEffectBonus,
  recordSkillRuntimeUse,
} from '../src/lib/skills'

const makeActor = (name: string, id: string, skillIds: string[]): BattleActorState => ({
  type: id === 'player' ? 'player' : 'monster',
  id,
  name,
  maxHp: 220,
  hp: 220,
  atk: 48,
  def: 18,
  speed: 20,
  critRate: 0,
  accuracy: 1,
  evasionRate: 0,
  skillIds,
  cooldowns: {},
})

const focusSlash = SKILL_DEFINITIONS.find(skill => skill.id === 'basic-focus-slash')
const guardStance = SKILL_DEFINITIONS.find(skill => skill.id === 'basic-guard-stance')
if (!focusSlash || !guardStance) {
  throw new Error('Required basic skills are missing')
}

const available = getAvailableCombatSkillsForLoadout({
  jobId: 'unawakened',
  equippedItems: [],
  allSkills: SKILL_DEFINITIONS,
  includeBasicKit: true,
})

let skillStates = {}
for (let i = 0; i < 35; i += 1) {
  skillStates = recordSkillRuntimeUse(skillStates, focusSlash.id)
}

const level0 = getSkillMastery(undefined, focusSlash.id)
const level3 = getSkillMastery(skillStates, focusSlash.id)
const attacker0 = makeActor('Hunter', 'player', [BASIC_ATTACK_SKILL.id, focusSlash.id])
const attacker3 = makeActor('Hunter', 'player', [BASIC_ATTACK_SKILL.id, focusSlash.id])
const target0 = makeActor('Target', 'target', [])
const target3 = makeActor('Target', 'target', [])

const rng = () => 0.5
const baseline = resolveAction({
  actor: attacker0,
  target: target0,
  skill: focusSlash,
  activeEffects: [],
  rng,
  turnNumber: 1,
  skillMasteryLevel: level0.masteryLevel,
}).log.damage ?? 0

const mastered = resolveAction({
  actor: attacker3,
  target: target3,
  skill: focusSlash,
  activeEffects: [],
  rng,
  turnNumber: 1,
  skillMasteryLevel: level3.masteryLevel,
}).log.damage ?? 0

console.log('Skill system simulation')
console.log(`Available hunter skills: ${available.map(skill => skill.id).join(', ')}`)
console.log(`Focus Slash Lv0 damage: ${baseline}`)
console.log(`Focus Slash Lv3 damage: ${mastered}`)
console.log(`Lv3 damage bonus: +${Math.round(getSkillMasteryEffectBonus(focusSlash, 3) * 1000) / 10}%`)
console.log(`Guard Stance Lv3 bonus: +${Math.round(getSkillMasteryEffectBonus(guardStance, 3) * 1000) / 10}%`)
console.log(`Damage delta: +${Math.round(((mastered / baseline) - 1) * 1000) / 10}%`)
