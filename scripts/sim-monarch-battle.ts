/**
 * 12-14 Monarch battle balance simulation.
 * Run with: npx tsx scripts/sim-monarch-battle.ts
 */
import { MONARCHS, FINAL_ANGEL } from '../src/lib/monarchs'
import { SKILL_DEFINITIONS } from '../src/lib/seed'
import {
  calculateCombatPower,
  getPlayerCombatSkills,
  summarizeGateWaveBattleSimulations,
} from '../src/lib/game'
import type {
  PlayerCombatStats,
  MonsterDefinition,
  OwnedShadow,
  ActiveCombatEffect,
} from '../src/lib/types'

// ── Configuration Constants ──────────────────────────────────────────
const ITERATIONS = 100
const SEED_BASE = 40000

// 3대 군주 그림자 탱킹 상수 (store.ts의 세팅값과 동일하게 하드코딩)
const MONARCH_SHADOW_GUARD_DEF_BASE = 5000
const MONARCH_SHADOW_GUARD_DEF_PER_SHADOW = 2000
const MONARCH_SHADOW_GUARD_EVASION_BASE = 0.40
const MONARCH_SHADOW_GUARD_EVASION_PER_SHADOW = 0.05
const MONARCH_SHADOW_GUARD_DR_FACTOR = 0.5

// L1-A NPC 협력 상수
const COOP_HELP_ATK_FACTOR = 0.04
const COOP_HELP_DEF_FACTOR = 0.04
const COOP_HELP_DR_FACTOR = 0.05
const COOP_HELP_DR_CAP = 0.5

// ── Build a Realistic End-game Player (Level 100) ────────────────────
const BASE_PLAYER_STATS: PlayerCombatStats = {
  maxHp: 7500,
  atk: 3500,
  def: 550,
  speed: 75,
  critRate: 0.28,
  accuracy: 0.98,
  evasionRate: 0.18,
  skillTotalPower: 1.8,
}

const baseShadow: OwnedShadow = {
  instanceId: 'shadow-1',
  definitionId: 'scout-soldier',
  name: '정찰병',
  role: 'scout',
  rarity: 'common',
  rank: 'soldier',
  level: 1,
  xp: 0,
  sourceType: 'gate_extract',
  obtainedAt: new Date().toISOString(),
  traits: [],
}

const equippedShadows: OwnedShadow[] = [
  { ...baseShadow, instanceId: 's1', role: 'guard', name: '수호군' },
  { ...baseShadow, instanceId: 's2', role: 'assault', name: '돌격군' },
  { ...baseShadow, instanceId: 's3', role: 'scout', name: '정찰군' },
  { ...baseShadow, instanceId: 's4', role: 'analyst', name: '분석군' },
]

const playerSkills = getPlayerCombatSkills({
  jobId: 'fate-harmonizer',
  equippedItems: [],
  allSkills: SKILL_DEFINITIONS,
})

// ── Run simulation for a scenario ─────────────────────────────────────
function runSim(
  monarch: { id: string; name: string; recommendedCP: number },
  shadowCount: number,
  helperPower: number,
  helperCount: number
) {
  // 1. 군주 몬스터 생성
  const cp = monarch.recommendedCP
  const monsterDef: MonsterDefinition = {
    id: monarch.id,
    name: monarch.name,
    description: '심연의 군주',
    rank: 'S',
    stats: {
      maxHp: Math.round(cp * 0.45),
      atk: Math.round(cp * 0.12),
      def: Math.round(cp * 0.04),
      speed: Math.round(20 + cp * 0.0001),
      critRate: 0.15,
      accuracy: 0.95,
      evasionRate: 0.10,
    },
    skillIds: ['monster-rift-scratch', 'monster-lazy-curse', 'monster-memory-fog'],
  }

  // 2. 초기 전투 버프/효과 구성
  const initialActiveEffects: ActiveCombatEffect[] = []

  // 그림자 탱킹 효과 주입
  if (shadowCount > 0) {
    const buffDef = MONARCH_SHADOW_GUARD_DEF_BASE + MONARCH_SHADOW_GUARD_DEF_PER_SHADOW * shadowCount
    const buffEvasion = MONARCH_SHADOW_GUARD_EVASION_BASE + MONARCH_SHADOW_GUARD_EVASION_PER_SHADOW * shadowCount
    initialActiveEffects.push(
      {
        sourceSkillId: 'monarch-shadow-guard-def',
        kind: 'stat',
        stat: 'def',
        value: buffDef,
        remainingTurns: 999,
        targetId: 'player',
      },
      {
        sourceSkillId: 'monarch-shadow-guard-eva',
        kind: 'stat',
        stat: 'evasionRate',
        value: buffEvasion,
        remainingTurns: 999,
        targetId: 'player',
      },
      {
        sourceSkillId: 'monarch-shadow-guard-dr',
        kind: 'damage_reduction',
        value: MONARCH_SHADOW_GUARD_DR_FACTOR,
        remainingTurns: 999,
        targetId: 'player',
      }
    )
  }

  // 협력 버프 주입
  let buffCoopAtk = 0
  let buffCoopDef = 0
  let drCoop = 0
  if (helperCount > 0) {
    buffCoopAtk = Math.round(COOP_HELP_ATK_FACTOR * helperPower)
    buffCoopDef = Math.round(COOP_HELP_DEF_FACTOR * helperPower)
    drCoop = Math.min(COOP_HELP_DR_CAP, COOP_HELP_DR_FACTOR * helperCount)

    if (buffCoopAtk > 0) {
      initialActiveEffects.push({
        sourceSkillId: 'world-map-coop-atk',
        kind: 'stat',
        stat: 'atk',
        value: buffCoopAtk,
        remainingTurns: 999,
        targetId: 'player',
      })
    }
    if (buffCoopDef > 0) {
      initialActiveEffects.push({
        sourceSkillId: 'world-map-coop-def',
        kind: 'stat',
        stat: 'def',
        value: buffCoopDef,
        remainingTurns: 999,
        targetId: 'player',
      })
    }
    if (drCoop > 0) {
      initialActiveEffects.push({
        sourceSkillId: 'world-map-coop-dr',
        kind: 'damage_reduction',
        value: drCoop,
        remainingTurns: 999,
        targetId: 'player',
      })
    }
  }

  // 3. 스킬 풀 수집
  const monsterSkillIds = new Set(monsterDef.skillIds)
  const monsterSkills = SKILL_DEFINITIONS.filter(
    s => s.ownerType === 'monster' && monsterSkillIds.has(s.id)
  )
  const allSkills = [...playerSkills, ...monsterSkills]

  // 4. 시뮬레이션 돌리기
  const summary = summarizeGateWaveBattleSimulations({
    iterations: ITERATIONS,
    playerStats: BASE_PLAYER_STATS,
    monsters: [monsterDef],
    skills: allSkills,
    equippedShadows: shadowCount > 0 ? equippedShadows.slice(0, shadowCount) : [],
    initialActiveEffects,
    gateInstanceId: `sim-monarch-${monarch.id}`,
    seedBase: SEED_BASE + monarch.recommendedCP,
  })

  return summary
}

// ── Run all simulations and print results ─────────────────────────────
console.log('=== 군주 격퇴전 밸런스 시뮬레이션 ===')
console.log(`플레이어 스펙: CP ${calculateCombatPower(BASE_PLAYER_STATS).toLocaleString()} (HP ${BASE_PLAYER_STATS.maxHp.toLocaleString()}, ATK ${BASE_PLAYER_STATS.atk.toLocaleString()}, DEF ${BASE_PLAYER_STATS.def.toLocaleString()})`)
console.log(`시뮬레이션 반복 횟수: ${ITERATIONS}회\n`)

console.log('| 군주 명칭 | 권장 CP | 솔로 격퇴 승률 | 그림자 탱킹(4명) 승률 | 풀 팀(그림자4+협력2) 승률 | 평균 턴수 | 생존 HP (풀팀) |')
console.log('|---|---:|---:|---:|---:|---:|---:|')

const targets = [...MONARCHS, FINAL_ANGEL]

for (const monarch of targets) {
  // 1. 솔로 격퇴 (그림자 없음, 협력 없음)
  const simSolo = runSim(monarch, 0, 0, 0)
  
  // 2. 그림자 탱킹 완성형 (4명 장착, 협력 없음)
  const simShadowOnly = runSim(monarch, 4, 0, 0)

  // 3. 풀 팀 (그림자 4명 장착 + 협력 헌터 2명 전투력 5k씩 = 10k 지원)
  const simFull = runSim(monarch, 4, 10000, 2)

  console.log(
    `| ${monarch.name} | ${monarch.recommendedCP.toLocaleString()} | ` +
    `${Math.round(simSolo.victoryRate * 100)}% | ` +
    `${Math.round(simShadowOnly.victoryRate * 100)}% | ` +
    `${Math.round(simFull.victoryRate * 100)}% | ` +
    `${simFull.averageTurns.toFixed(1)} | ` +
    `${Math.round(simFull.averagePlayerHpRemaining).toLocaleString()} |`
  )
}

console.log('\n* 격퇴 조건 요약:')
console.log('1) 솔로 격퇴: 즉사 방지 수호막(그림자 탱킹)이 없어 높은 공격력의 군주에게 1~2턴 내로 즉사하여 승률이 0%에 수렴합니다.')
console.log('2) 그림자 탱킹: 방어력 극대화와 대미지 감쇄가 전개되어 약한 군주(그렐릭, 셀라이드 등)는 무난히 단독 격퇴가 가능해집니다.')
console.log('3) 풀 팀: 최강 군주(녹스, 천사 등)를 상대하기 위해서는 그림자 탱킹 수호막 외에 지역 협력 헌터들의 CP 가산 버프가 합쳐져야 격퇴 승률이 보장됩니다.')
console.log('\n=== 시뮬레이션 완료 ===')
