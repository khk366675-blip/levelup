import { simulateGateWaveBattle, calculatePlayerCombatStats, getPlayerCombatSkills } from '../src/lib/game'
import { getTowerMonstersForFloor } from '../src/lib/infiniteTower'
import { SKILL_DEFINITIONS } from '../src/lib/seed'

function testBattle(playerStats: any, floor: number, seed = 1) {
  const monsters = getTowerMonstersForFloor(floor)
  const monsterSkills = SKILL_DEFINITIONS.filter(s => s.ownerType === 'monster' && monsters.some(m => m.skillIds.includes(s.id)))
  const skills = [...SKILL_DEFINITIONS.filter(s => s.ownerType === 'common'), ...monsterSkills]
  const result = simulateGateWaveBattle({ playerName: 'Test', playerStats, monsters, skills, seed })
  return result
}

const buildC = { maxHp: 1120, atk: 155, def: 55, speed: 24, critRate: 0.10, accuracy: 0.94, evasionRate: 0.07, skillTotalPower: 1.0 }
const buildD = { maxHp: 1680, atk: 235, def: 80, speed: 30, critRate: 0.12, accuracy: 0.95, evasionRate: 0.09, skillTotalPower: 1.0 }
const buildF = { maxHp: 3030, atk: 420, def: 145, speed: 40, critRate: 0.16, accuracy: 0.96, evasionRate: 0.12, skillTotalPower: 1.0 }

for (const [name, stats] of [['C', buildC], ['D', buildD], ['F', buildF]] as const) {
  console.log(`\n--- Build ${name} vs Floor 5 Boss ---`)
  const monsters = getTowerMonstersForFloor(5)
  console.log('Monster:', monsters[0].name, 'HP:', monsters[0].stats.maxHp, 'ATK:', monsters[0].stats.atk, 'DEF:', monsters[0].stats.def, 'SPD:', monsters[0].stats.speed)
  let wins = 0
  for (let i = 0; i < 10; i++) {
    const result = testBattle(stats, 5, i)
    if (result.result === 'victory') wins++
    console.log(`  seed ${i}: ${result.result}, turns=${result.totalTurns}, playerHP=${result.playerHpRemaining}`)
  }
  console.log(`  Win rate: ${wins}/10`)
}
