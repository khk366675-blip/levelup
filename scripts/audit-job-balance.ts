import { buildHunterBattleUnit, buildShadowBattleUnits } from '../src/lib/battleUnits.ts'
import {
  buildDirectBattleEncounterParty,
  validateDirectBattleMockEncounters,
} from '../src/lib/directBattleEncounters.ts'
import { createDirectBattleState, runMockDirectBattle } from '../src/lib/directBattleRuntime.ts'
import { JOB_DEFINITIONS_V2 } from '../src/lib/jobs.ts'
import { SKILL_DEFINITIONS } from '../src/lib/seed.ts'
import type { HunterState } from '../src/lib/types.ts'
import type { BattleUnit } from '../src/lib/directBattleTypes.ts'

console.log('=== Job System v2 Skill ID Integrity Audit ===');
let missingSkillCount = 0;
const skillDefinitionsMap = new Map(SKILL_DEFINITIONS.map(s => [s.id, s]));

for (const job of JOB_DEFINITIONS_V2) {
  for (const js of job.skills ?? []) {
    if (!skillDefinitionsMap.has(js.skillId)) {
      console.error(`[ERROR] Job "${job.name}" (${job.id}) references missing skillId: "${js.skillId}"`);
      missingSkillCount++;
    }
  }
}

if (missingSkillCount === 0) {
  console.log('✓ All job skill IDs are correctly resolved in SKILL_DEFINITIONS.');
} else {
  console.error(`✗ Found ${missingSkillCount} missing skill references!`);
}

console.log('\n=== Job Balance Simulation (1st Tier Jobs vs small_duo) ===');

const baseStats = { STR: 10, VIT: 10, AGI: 10, INT: 10, PER: 10, SEN: 10 };

const testJobs = [
  { jobId: 'novice-hunter', name: '초보 헌터 (Novice)', stats: { ...baseStats } },
  { jobId: 'swordsman', name: '검객 (Swordsman)', stats: { ...baseStats, STR: 15, AGI: 13 } },
  { jobId: 'warrior', name: '전사 (Warrior)', stats: { ...baseStats, STR: 15, VIT: 13 } },
  { jobId: 'mage', name: '마법사 (Mage)', stats: { ...baseStats, INT: 15, SEN: 13 } },
  { jobId: 'guardian', name: '수호자 (Guardian)', stats: { ...baseStats, VIT: 15, PER: 13 } },
  { jobId: 'scout', name: '추적자 (Scout)', stats: { ...baseStats, AGI: 15, SEN: 13 } },
  { jobId: 'tactician', name: '전술가 (Tactician)', stats: { ...baseStats, INT: 15, PER: 13 } },
];

const ENCOUNTER_KEY = 'lone_charger';
const SIM_COUNT = 50;

for (const testJob of testJobs) {
  let wins = 0;
  let totalRounds = 0;
  let totalDamageDone = 0;
  let totalSkillUses = 0;
  let totalRemainingHpPct = 0;

  for (let i = 0; i < SIM_COUNT; i++) {
    const hunter: HunterState = {
      name: `Test-${testJob.jobId}`,
      level: 10,
      xp: 0,
      totalXp: 0,
      rank: 'E',
      job: testJob.name,
      jobId: testJob.jobId,
      activeJobId: testJob.jobId,
      unlockedJobIds: ['novice-hunter', testJob.jobId],
      stats: testJob.stats,
      freeStatPoints: 0,
      streak: 0,
      categoryProgress: {
        workout: 0, study: 0, career: 0, health: 0, mind: 0, finance: 0, social: 0, challenge: 0, habit: 0
      },
      ownedTitleIds: [],
      jobs: {
        [testJob.jobId]: {
          jobId: testJob.jobId,
          level: 2,
          xp: 100,
        }
      }
    };

    const playerUnitBuild = buildHunterBattleUnit(hunter);
    const enemyBuild = buildDirectBattleEncounterParty(ENCOUNTER_KEY);
    const state = createDirectBattleState([playerUnitBuild.unit, ...enemyBuild.units], {
      battleId: `audit-${testJob.jobId}-${i}`,
      maxRounds: 30,
    });

    const result = runMockDirectBattle(state);

    if (result.winner === 'player') {
      wins++;
    }
    totalRounds += result.roundsSimulated;

    // Calculate metrics
    const finalHunter = result.state.units.find(u => u.unitId === 'hunter-main');
    if (finalHunter) {
      const remainingHpPct = Math.max(0, finalHunter.stats.currentHp) / finalHunter.stats.maxHp;
      totalRemainingHpPct += remainingHpPct;
    }

    // Count skill uses from battle logs
    let skillUses = 0;
    let damageDone = 0;
    for (const turn of result.logs) {
      if (turn.actorUnitId === 'hunter-main') {
        if (turn.eventType === 'damage' && turn.targetUnitIds?.[0] !== 'hunter-main') {
          damageDone += turn.value ?? 0;
        }
        if (turn.eventType === 'damage' || turn.eventType === 'heal' || turn.eventType === 'status') {
          if (turn.actionId && !turn.actionId.includes('basic-attack') && !turn.actionId.includes('basic')) {
            skillUses++;
          }
        }
      }
    }
    totalSkillUses += skillUses;
    totalDamageDone += damageDone;
  }

  const winRate = (wins / SIM_COUNT) * 100;
  const avgRounds = totalRounds / SIM_COUNT;
  const avgRemainingHpPct = (totalRemainingHpPct / SIM_COUNT) * 100;
  const avgDamageDone = totalDamageDone / SIM_COUNT;
  const avgSkillUses = totalSkillUses / SIM_COUNT;

  let warnings: string[] = [];
  if (winRate < 10) warnings.push('Too Weak (Low Win Rate)');
  if (winRate > 95) warnings.push('Too Strong (High Win Rate)');
  if (avgSkillUses === 0 && testJob.jobId !== 'novice-hunter') warnings.push('No Skills Used');

  console.log(`Job: ${testJob.name}`);
  console.log(`  Win Rate: ${winRate.toFixed(1)}%`);
  console.log(`  Avg Rounds: ${avgRounds.toFixed(1)}`);
  console.log(`  Avg Remaining HP: ${avgRemainingHpPct.toFixed(1)}%`);
  console.log(`  Avg Damage Done: ${avgDamageDone.toFixed(1)}`);
  console.log(`  Avg Skill Uses: ${avgSkillUses.toFixed(2)}`);
  if (warnings.length > 0) {
    console.log(`  [WARNINGS] ${warnings.join(', ')}`);
  }
}
