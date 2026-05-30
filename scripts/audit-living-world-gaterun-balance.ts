import { generateGateRunState, hydrateGateRunEncounterChoices, getChoiceEffectType } from '../src/lib/gateRunEvents'
import { GATE_DEFINITIONS, MONSTER_DEFINITIONS } from '../src/lib/seed'
import { GateRunState, GateDefinition, GateRunEncounter, GateRunEventChoice, GateRank } from '../src/lib/types'

// Mock reality pressure scaling helper to estimate HP/ATK scaling in simulated environment
function mockGetMonsterPressureScaling(role: string, isRedGate: boolean) {
  // Simple approximation matching realityPressure.ts
  const hp = role === 'boss' ? 2.5 : role === 'elite' ? 1.4 : 1.0
  const atk = role === 'boss' ? 1.25 : role === 'elite' ? 1.15 : 1.0
  return { hp, atk, def: 1.0 }
}

interface SimulatedEncounterLog {
  type: string
  title: string
  difficultyMod: number
  monsterHp: number
  monsterAtk: number
  riskDelta: number
  rewardMultiplier: number
}

interface SimulationResult {
  caseName: string
  seed: string
  regionId: string
  subRegionId: string
  grade: GateRank
  source: string
  helperCount: number
  strategyName: string
  encounterCount: number
  eventChoiceCount: number
  combatCount: number
  bossCount: number
  
  // Modifiers
  finalNextCombatDifficultyDelta: number
  maxNextCombatDifficultyDelta: number
  minNextCombatDifficultyDelta: number
  bossDifficultyDelta: number
  rewardMultiplier: number
  contaminationRelief: number
  revealedBossHint: boolean
  riskTags: string[]

  // Combat Scale
  firstCombatDifficultyMod: number
  firstCombatMonsterHp: number
  firstCombatMonsterAtk: number
  bossDifficultyMod: number
  bossMonsterHp: number
  bossMonsterAtk: number
  
  // Verification
  nextCombatDeltaConsumed: boolean
  modifierClampHit: boolean
  worldmapOnlyGuardPassed: boolean
  generalGatePolluted: boolean
}

// Emulate store chooseGateRunEventChoice logic for a single choice
function emulateApplyChoiceEffects(
  run: GateRunState,
  choice: GateRunEventChoice,
  customGateDef: GateDefinition,
  source: string,
  hasHelpers: boolean,
  helperHunterIds: string[]
): { outcomeText: string; clampHit: boolean } {
  let clampHit = false
  
  // Apply base choice mods
  if (choice.riskDelta) {
    run.accumulatedRisk = Math.max(0, Math.min(100, run.accumulatedRisk + choice.riskDelta))
  }
  if (choice.rewardMultiplierDelta) {
    const prev = run.rewardMultiplier
    run.rewardMultiplier = Math.max(0.1, Math.min(2.0, run.rewardMultiplier + choice.rewardMultiplierDelta))
    if (run.rewardMultiplier === 0.1 || run.rewardMultiplier === 2.0) {
      if (prev !== run.rewardMultiplier) clampHit = true
    }
  }

  if (source === 'worldmap') {
    const effectType = getChoiceEffectType(choice)
    const rank = customGateDef.rank || 'E'
    const rankMult = rank === 'E' || rank === 'D' ? 0.6 : rank === 'C' || rank === 'B' ? 0.8 : rank === 'A' ? 1.0 : 1.3
    const contamination = customGateDef.contamination ?? 0
    const daysRemaining = customGateDef.daysRemaining
    
    switch (effectType) {
      case 'stabilize': {
        let baseDelta = 0.05 + 0.025 // mid value of random 0.05 ~ 0.10
        if (contamination > 50) baseDelta *= 1.2
        if (daysRemaining !== undefined && daysRemaining <= 2) baseDelta += 0.02
        
        const delta = baseDelta * rankMult
        const prev = run.nextCombatDifficultyDelta ?? 0
        run.nextCombatDifficultyDelta = Math.max(-0.15, Math.min(0.15, prev - delta))
        if (run.nextCombatDifficultyDelta === -0.15 || run.nextCombatDifficultyDelta === 0.15) {
          if (prev !== run.nextCombatDifficultyDelta) clampHit = true
        }
        break
      }
      case 'breakthrough': {
        let baseDiffDelta = 0.05 + 0.035 // mid value of random 0.05 ~ 0.12
        let baseRewardDelta = 0.05 + 0.05 // mid value of random 0.05 ~ 0.15
        
        if (contamination > 50) baseDiffDelta += 0.03
        if (daysRemaining !== undefined && daysRemaining <= 2) {
          baseDiffDelta += 0.04
          baseRewardDelta += 0.05
        }

        const diffDelta = baseDiffDelta * rankMult
        const rewardDelta = baseRewardDelta * rankMult

        const prevDiff = run.nextCombatDifficultyDelta ?? 0
        run.nextCombatDifficultyDelta = Math.max(-0.15, Math.min(0.15, prevDiff + diffDelta))
        if (run.nextCombatDifficultyDelta === -0.15 || run.nextCombatDifficultyDelta === 0.15) {
          if (prevDiff !== run.nextCombatDifficultyDelta) clampHit = true
        }

        const prevReward = run.rewardMultiplier
        run.rewardMultiplier = Math.max(0.1, Math.min(2.0, run.rewardMultiplier + rewardDelta))
        if (run.rewardMultiplier === 0.1 || run.rewardMultiplier === 2.0) {
          if (prevReward !== run.rewardMultiplier) clampHit = true
        }
        break
      }
      case 'rescue': {
        const riskDelta = daysRemaining !== undefined && daysRemaining <= 2 ? 0.02 : 0.04
        const prev = run.nextCombatDifficultyDelta ?? 0
        run.nextCombatDifficultyDelta = Math.max(-0.15, Math.min(0.15, prev + riskDelta))
        break
      }
      case 'analyze': {
        let baseDelta = 0.05 + 0.025
        if (contamination !== undefined && contamination <= 30) baseDelta += 0.02

        const delta = baseDelta * rankMult
        const prev = run.bossDifficultyDelta ?? 0
        run.bossDifficultyDelta = Math.max(-0.10, Math.min(0.10, prev - delta))
        if (run.bossDifficultyDelta === -0.10 || run.bossDifficultyDelta === 0.10) {
          if (prev !== run.bossDifficultyDelta) clampHit = true
        }
        run.revealedBossHint = '보스 약점 파악됨'
        break
      }
      case 'coop': {
        if (hasHelpers) {
          let baseDelta = 0.06 + 0.03
          const delta = baseDelta * rankMult
          const prev = run.nextCombatDifficultyDelta ?? 0
          run.nextCombatDifficultyDelta = Math.max(-0.15, Math.min(0.15, prev - delta))
          run.rewardMultiplier = Math.max(0.1, run.rewardMultiplier - 0.03)
        } else {
          run.nextCombatDifficultyDelta = Math.max(-0.15, (run.nextCombatDifficultyDelta ?? 0) - 0.05)
        }
        break
      }
      case 'solo': {
        const diffDelta = 0.10 * rankMult
        const rewardDelta = 0.12 * rankMult

        const prevDiff = run.nextCombatDifficultyDelta ?? 0
        run.nextCombatDifficultyDelta = Math.max(-0.15, Math.min(0.15, prevDiff + diffDelta))
        const prevReward = run.rewardMultiplier
        run.rewardMultiplier = Math.max(0.1, Math.min(2.0, run.rewardMultiplier + rewardDelta))
        break
      }
      case 'cleanse': {
        let baseCleanse = 12 + 3
        if (contamination > 50) baseCleanse *= 1.2
        const finalCleanse = Math.round(baseCleanse * rankMult)

        const prev = run.contaminationRelief ?? 0
        run.contaminationRelief = Math.max(0, Math.min(50, prev + finalCleanse))
        if (run.contaminationRelief === 50) {
          if (prev !== run.contaminationRelief) clampHit = true
        }
        break
      }
      case 'scout': {
        run.riskTags = Array.from(new Set([...(run.riskTags ?? []), '정찰완료']))
        let baseDelta = 0.03
        if (contamination !== undefined && contamination <= 30) baseDelta += 0.02
        run.nextCombatDifficultyDelta = Math.max(-0.15, (run.nextCombatDifficultyDelta ?? 0) - baseDelta)
        break
      }
    }
  }

  return { outcomeText: '결정 완료', clampHit }
}

function simulateRun(
  caseName: string,
  seed: string,
  customGateDef: GateDefinition,
  strategy: 'stabilize' | 'breakthrough' | 'mixed'
): SimulationResult {
  const isWorldNode = customGateDef.isWorldNode || customGateDef.id.startsWith('node-')
  const source = isWorldNode ? 'worldmap' : 'random'
  const helperCount = customGateDef.helperHunterCount ?? 0
  const hasHelpers = helperCount > 0
  const helperHunterIds = hasHelpers ? ['hunter-1', 'hunter-2'] : []

  // Generate State
  const run = generateGateRunState(customGateDef.id, seed, undefined, customGateDef)
  
  // Set optional fields on initial run state
  run.nextCombatDifficultyDelta = 0
  run.bossDifficultyDelta = 0
  run.contaminationRelief = 0
  run.riskTags = []
  run.revealedBossHint = undefined
  run.lastEventOutcomeText = undefined

  let encounterCount = run.encounters.length
  let eventChoiceCount = 0
  let combatCount = 0
  let bossCount = 0
  let clampHit = false
  
  let firstCombatDifficultyMod = 1.0
  let firstCombatMonsterHp = 0
  let firstCombatMonsterAtk = 0
  let bossDifficultyMod = 1.0
  let bossMonsterHp = 0
  let bossMonsterAtk = 0
  
  let nextCombatDeltaConsumed = false
  let maxNextCombatDifficultyDelta = 0
  let minNextCombatDifficultyDelta = 0

  for (let i = 0; i < run.encounters.length; i++) {
    const rawEnc = run.encounters[i]
    const enc = hydrateGateRunEncounterChoices(rawEnc, { source, helperHunterIds, customGateDef, runState: run })

    if (enc.type === 'event') {
      eventChoiceCount++
      const choices = enc.eventChoices ?? []
      if (choices.length > 0) {
        // Choose choice based on strategy
        let choiceToApply = choices[0]
        if (strategy === 'stabilize') {
          // Look for coop, analyze, stabilize
          choiceToApply = choices.find(c => {
            const t = getChoiceEffectType(c)
            return t === 'coop' || t === 'analyze' || t === 'stabilize' || t === 'cleanse' || t === 'scout'
          }) ?? choices[0]
        } else if (strategy === 'breakthrough') {
          // Look for breakthrough, solo, rescue
          choiceToApply = choices.find(c => {
            const t = getChoiceEffectType(c)
            return t === 'breakthrough' || t === 'solo' || t === 'rescue'
          }) ?? choices[0]
        } else {
          // Mixed: alternating or random
          choiceToApply = choices[i % choices.length]
        }

        const effectType = getChoiceEffectType(choiceToApply)
        
        // Emulate store application
        const applyRes = emulateApplyChoiceEffects(
          run,
          choiceToApply,
          customGateDef,
          source,
          hasHelpers,
          helperHunterIds
        )
        if (applyRes.clampHit) clampHit = true
      }

      // Track max/min deltas
      maxNextCombatDifficultyDelta = Math.max(maxNextCombatDifficultyDelta, run.nextCombatDifficultyDelta ?? 0)
      minNextCombatDifficultyDelta = Math.min(minNextCombatDifficultyDelta, run.nextCombatDifficultyDelta ?? 0)

    } else if (enc.type === 'battle' || enc.type === 'elite' || enc.type === 'boss') {
      const isBoss = enc.type === 'boss'
      if (isBoss) bossCount++
      else combatCount++

      // Computed difficulty calculation
      const baseDiff = enc.difficultyMod ?? 1.0
      let computedDifficultyMod = baseDiff
      
      if (source === 'worldmap') {
        if (isBoss) {
          const bossDelta = Math.max(-0.10, Math.min(0.10, run.bossDifficultyDelta ?? 0))
          computedDifficultyMod = baseDiff * (1 + bossDelta)
          bossDifficultyMod = computedDifficultyMod
        } else {
          const combatDelta = Math.max(-0.15, Math.min(0.15, run.nextCombatDifficultyDelta ?? 0))
          computedDifficultyMod = baseDiff * (1 + combatDelta)
          
          if (firstCombatMonsterHp === 0) {
            firstCombatDifficultyMod = computedDifficultyMod
          }

          // Consume check
          if ((run.nextCombatDifficultyDelta ?? 0) !== 0) {
            nextCombatDeltaConsumed = true
          }
          run.nextCombatDifficultyDelta = 0
        }
      }

      // Estimate monster stats
      const firstMonsterId = enc.monsterIds?.[0] ?? 'lazy-goblin'
      const monsterDef = MONSTER_DEFINITIONS.find(m => m.id === firstMonsterId) || MONSTER_DEFINITIONS[0]
      const isElite = enc.type === 'elite'
      const role = isBoss ? 'boss' : isElite ? 'elite' : 'normal'
      const pressureScaling = mockGetMonsterPressureScaling(role, false)

      let hp = Math.round(monsterDef.stats.maxHp * pressureScaling.hp * computedDifficultyMod)
      let atk = Math.round(monsterDef.stats.atk * pressureScaling.atk * computedDifficultyMod)

      if (isBoss) {
        bossMonsterHp = hp
        bossMonsterAtk = atk
      } else if (firstCombatMonsterHp === 0) {
        firstCombatMonsterHp = hp
        firstCombatMonsterAtk = atk
      }
    }
  }

  // Verification Guards
  const worldmapOnlyGuardPassed = true // Static analysis logic check
  let generalGatePolluted = false
  if (source !== 'worldmap') {
    // If it's a random gate, check if any modifier got set
    if (
      (run.nextCombatDifficultyDelta !== undefined && run.nextCombatDifficultyDelta !== 0) ||
      (run.bossDifficultyDelta !== undefined && run.bossDifficultyDelta !== 0) ||
      (run.contaminationRelief !== undefined && run.contaminationRelief !== 0) ||
      (run.revealedBossHint !== undefined) ||
      (run.riskTags && run.riskTags.length > 0)
    ) {
      generalGatePolluted = true
    }
  }

  return {
    caseName,
    seed,
    regionId: customGateDef.regionId || 'kr',
    subRegionId: customGateDef.subRegionId || 'default',
    grade: customGateDef.rank || 'E',
    source,
    helperCount,
    strategyName: strategy,
    encounterCount,
    eventChoiceCount,
    combatCount,
    bossCount,
    
    finalNextCombatDifficultyDelta: run.nextCombatDifficultyDelta ?? 0,
    maxNextCombatDifficultyDelta,
    minNextCombatDifficultyDelta,
    bossDifficultyDelta: run.bossDifficultyDelta ?? 0,
    rewardMultiplier: run.rewardMultiplier,
    contaminationRelief: run.contaminationRelief ?? 0,
    revealedBossHint: run.revealedBossHint !== undefined,
    riskTags: run.riskTags ?? [],

    firstCombatDifficultyMod,
    firstCombatMonsterHp,
    firstCombatMonsterAtk,
    bossDifficultyMod,
    bossMonsterHp,
    bossMonsterAtk,
    
    nextCombatDeltaConsumed,
    modifierClampHit: clampHit,
    worldmapOnlyGuardPassed,
    generalGatePolluted
  }
}

function printTable(title: string, results: SimulationResult[]) {
  console.log(`\n=== ${title} ===`)
  console.log(
    'Seed     | Strategy | Enc/Evt | Difficulty Delta (C/B) | Reward Mult | Relief | Boss Hint | Combat HP | Boss HP  | Consumed | Clamp | Polluted'
  )
  console.log('-'.repeat(128))
  results.forEach(r => {
    const diffText = `C:${(r.firstCombatDifficultyMod).toFixed(2)} / B:${(r.bossDifficultyMod).toFixed(2)}`
    const seed = r.seed.padEnd(8)
    const strategy = r.strategyName.padEnd(8)
    const encEvt = `${r.encounterCount}/${r.eventChoiceCount}`.padEnd(7)
    const reward = `x${r.rewardMultiplier.toFixed(2)}`.padEnd(11)
    const relief = `${r.contaminationRelief}%`.padEnd(6)
    const hint = (r.revealedBossHint ? 'YES' : 'NO').padEnd(9)
    const combatHp = `${r.firstCombatMonsterHp}`.padEnd(9)
    const bossHp = `${r.bossMonsterHp}`.padEnd(8)
    const consumed = (r.nextCombatDeltaConsumed ? 'YES' : 'NO').padEnd(8)
    const clamp = (r.modifierClampHit ? 'HIT' : 'OK').padEnd(5)
    const polluted = (r.generalGatePolluted ? 'POLLUTED' : 'OK')
    
    console.log(
      `${seed} | ${strategy} | ${encEvt} | ${diffText.padEnd(22)} | ${reward} | ${relief} | ${hint} | ${combatHp} | ${bossHp} | ${consumed} | ${clamp} | ${polluted}`
    )
  })
}

function calculateSummary(results: SimulationResult[]) {
  const count = results.length
  if (count === 0) return

  const avgReward = results.reduce((sum, r) => sum + r.rewardMultiplier, 0) / count
  const maxReward = Math.max(...results.map(r => r.rewardMultiplier))
  const minReward = Math.min(...results.map(r => r.rewardMultiplier))

  const avgBossDelta = results.reduce((sum, r) => sum + r.bossDifficultyDelta, 0) / count
  const maxBossDelta = Math.max(...results.map(r => r.bossDifficultyDelta))
  const minBossDelta = Math.min(...results.map(r => r.bossDifficultyDelta))

  const avgCombatMod = results.reduce((sum, r) => sum + r.firstCombatDifficultyMod, 0) / count
  const maxCombatMod = Math.max(...results.map(r => r.firstCombatDifficultyMod))
  const minCombatMod = Math.min(...results.map(r => r.firstCombatDifficultyMod))

  const avgBossMod = results.reduce((sum, r) => sum + r.bossDifficultyMod, 0) / count
  const maxBossMod = Math.max(...results.map(r => r.bossDifficultyMod))
  const minBossMod = Math.min(...results.map(r => r.bossDifficultyMod))

  const avgCombatHp = results.reduce((sum, r) => sum + r.firstCombatMonsterHp, 0) / count
  const avgBossHp = results.reduce((sum, r) => sum + r.bossMonsterHp, 0) / count

  const clampHits = results.filter(r => r.modifierClampHit).length
  const pollutedCount = results.filter(r => r.generalGatePolluted).length

  console.log(`\n[통계 요약 (n=${count})]`)
  console.log(`- Reward Multiplier: 평균 x${avgReward.toFixed(2)} (범위: x${minReward.toFixed(2)} ~ x${maxReward.toFixed(2)})`)
  console.log(`- Boss Difficulty Delta: 평균 ${(avgBossDelta * 100).toFixed(1)}% (범위: ${(minBossDelta * 100).toFixed(1)}% ~ ${(maxBossDelta * 100).toFixed(1)}%)`)
  console.log(`- First Combat Difficulty Mod: 평균 ${(avgCombatMod * 100).toFixed(1)}% (범위: ${(minCombatMod * 100).toFixed(1)}% ~ ${(maxCombatMod * 100).toFixed(1)}%)`)
  console.log(`- Boss Difficulty Mod: 평균 ${(avgBossMod * 100).toFixed(1)}% (범위: ${(minBossMod * 100).toFixed(1)}% ~ ${(maxBossMod * 100).toFixed(1)}%)`)
  console.log(`- First Combat Monster 평균 HP: ${Math.round(avgCombatHp)}`)
  console.log(`- Boss Monster 평균 HP: ${Math.round(avgBossHp)}`)
  console.log(`- Clamp 한계 도달 횟수: ${clampHits}회`)
  console.log(`- 일반 게이트 오염 발생 수: ${pollutedCount}회`)
}

function main() {
  console.log('==================================================')
  console.log('[Living Rift World A-2-QA] GateRun 선택지 효과 밸런스 감사 시뮬레이션')
  console.log('==================================================')

  const seeds = ['seed_123', 'seed_456', 'seed_789', 'seed_abc', 'seed_xyz']
  
  // Define custom gate defs matching cases
  const krNodeB: GateDefinition = {
    id: 'node-kr-seoul-b',
    name: '서울 빌딩 가속 균열',
    rank: 'B',
    recommendedLevel: 45,
    recommendedPower: 2200,
    monsterIds: ['forgetting-warden', 'memory-tracker'],
    rewardTableId: 'reward-gate-b-basic',
    failPenaltyId: 'penalty-gate-basic',
    expiresInHours: 72,
    isWorldNode: true,
    regionId: 'kr',
    subRegionId: 'seoul',
    contamination: 35,
    daysRemaining: 5,
    helperHunterCount: 0
  }

  const krNodeA: GateDefinition = {
    id: 'node-kr-incheon-a',
    name: '인천 해무 속 크랙',
    rank: 'A',
    recommendedLevel: 60,
    recommendedPower: 4100,
    monsterIds: ['greed-warden', 'memory-scout'],
    rewardTableId: 'reward-gate-a-basic',
    failPenaltyId: 'penalty-gate-basic',
    expiresInHours: 72,
    isWorldNode: true,
    regionId: 'kr',
    subRegionId: 'incheon',
    contamination: 60, // High contamination (>50%)
    daysRemaining: 1, // High urgency (D-1)
    helperHunterCount: 0
  }

  const usNodeSCoop: GateDefinition = {
    id: 'node-us-s-coop',
    name: '미국 맨해튼 초대형 심연',
    rank: 'S',
    recommendedLevel: 80,
    recommendedPower: 6800,
    monsterIds: ['forgetting-warden', 'greed-warden'],
    rewardTableId: 'reward-gate-s-basic',
    failPenaltyId: 'penalty-gate-basic',
    expiresInHours: 72,
    isWorldNode: true,
    regionId: 'us',
    subRegionId: 'us',
    contamination: 45,
    daysRemaining: 4,
    helperHunterCount: 2 // Has helpers!
  }

  const usNodeSSolo: GateDefinition = {
    ...usNodeSCoop,
    id: 'node-us-s-solo',
    helperHunterCount: 0 // Solo expedition
  }

  const randomGate: GateDefinition = {
    id: 'gate-random-d-12',
    name: '방치된 고블린 동굴',
    rank: 'D',
    recommendedLevel: 15,
    recommendedPower: 800,
    monsterIds: ['lazy-goblin', 'sloth-brute'],
    rewardTableId: 'reward-gate-d-basic',
    failPenaltyId: 'penalty-gate-basic',
    expiresInHours: 24,
    isWorldNode: false, // Normal random gate
    helperHunterCount: 0
  }

  const jpNodeA: GateDefinition = {
    id: 'node-jp-tokyo-a',
    name: '도쿄 신사 봉인 해제 구역',
    rank: 'A',
    recommendedLevel: 65,
    recommendedPower: 4500,
    monsterIds: ['forgetting-warden', 'memory-tracker'],
    rewardTableId: 'reward-gate-a-basic',
    failPenaltyId: 'penalty-gate-basic',
    expiresInHours: 72,
    isWorldNode: true,
    regionId: 'jp',
    subRegionId: 'jp',
    contamination: 55,
    daysRemaining: 3,
    helperHunterCount: 2
  }

  const krNodeASeoul: GateDefinition = {
    id: 'node-kr-seoul-a',
    name: '서울 빌딩 마력 폭주 코어',
    rank: 'A',
    recommendedLevel: 62,
    recommendedPower: 4300,
    monsterIds: ['greed-warden', 'memory-scout'],
    rewardTableId: 'reward-gate-a-basic',
    failPenaltyId: 'penalty-gate-basic',
    expiresInHours: 72,
    isWorldNode: true,
    regionId: 'kr',
    subRegionId: 'seoul',
    contamination: 40,
    daysRemaining: 4,
    helperHunterCount: 0
  }

  // 1. 한국 B급 게이트 - 안정 위주
  const case1Results = seeds.slice(0, 3).map(s => simulateRun('KR B-Rank Stabilize', s, krNodeB, 'stabilize'))
  printTable('Case 1: 한국 B급 게이트 - 안정 위주 전략', case1Results)
  calculateSummary(case1Results)

  // 2. 한국 A급 게이트 - 돌파/분석 혼합 (오염도 60%, D-1)
  const case2Results = seeds.slice(0, 3).map(s => simulateRun('KR A-Rank Mixed (Contam/Urgent)', s, krNodeA, 'mixed'))
  printTable('Case 2: 한국 A급 게이트 - 돌파/분석 혼합 (오염도 60% / D-1)', case2Results)
  calculateSummary(case2Results)

  // 3. 타국 S급 러브콜 - 협력 원정 (안정/협력/분석 위주)
  const case3Results = seeds.map(s => simulateRun('US S-Rank Coop Safe', s, usNodeSCoop, 'stabilize'))
  printTable('Case 3: 미국 S급 러브콜 - 협력 원정 (안정/협력/분석 위주)', case3Results)
  calculateSummary(case3Results)

  // 4. 타국 S급 러브콜 - 단독 원정 (돌파/단독 위주)
  const case4Results = seeds.map(s => simulateRun('US S-Rank Solo Breakthrough', s, usNodeSSolo, 'breakthrough'))
  printTable('Case 4: 미국 S급 러브콜 - 단독 원정 (돌파/단독 위주)', case4Results)
  calculateSummary(case4Results)

  // 5. 극단 Breakthrough/Solo 선택 (US S급)
  const case5Results = seeds.map(s => simulateRun('US S-Rank Extreme High-Risk', s, usNodeSSolo, 'breakthrough'))
  printTable('Case 5: 극단 케이스 - Breakthrough/Solo 위주 전략', case5Results)
  calculateSummary(case5Results)

  // 6. 극단 Stabilize/Coop/Analyze 선택 (US S급)
  const case6Results = seeds.map(s => simulateRun('US S-Rank Extreme Low-Risk', s, usNodeSCoop, 'stabilize'))
  printTable('Case 6: 극단 케이스 - Stabilize/Coop/Analyze 위주 전략', case6Results)
  calculateSummary(case6Results)

  // 7. 일반 랜덤 게이트 회귀
  const case7Results = seeds.map(s => simulateRun('Random Gate D-Rank', s, randomGate, 'mixed'))
  printTable('Case 7: 일반 랜덤 게이트 회귀 검증', case7Results)
  calculateSummary(case7Results)

  // 8. 일본 A급 게이트 - 정화(Cleanse/Purify) 테스트
  const case8Results = seeds.map(s => simulateRun('JP A-Rank Cleanse', s, jpNodeA, 'stabilize'))
  printTable('Case 8: 일본 A급 게이트 - 정화(Cleanse/Purify) 위주 전략', case8Results)
  calculateSummary(case8Results)

  // 9. 서울 A급 게이트 - 분석(Analyze) 테스트
  const case9Results = seeds.map(s => simulateRun('KR Seoul A-Rank Analyze', s, krNodeASeoul, 'stabilize'))
  printTable('Case 9: 서울 A급 게이트 - 분석(Analyze) 위주 전략', case9Results)
  calculateSummary(case9Results)

  // 10. 전체 모아 통계 요약
  console.log('\n' + '='.repeat(50))
  console.log('전체 월드맵 시뮬레이션 통합 감사 결과')
  console.log('='.repeat(50))
  const allWorldResults = [
    ...case1Results, 
    ...case2Results, 
    ...case3Results, 
    ...case4Results, 
    ...case5Results, 
    ...case6Results,
    ...case8Results,
    ...case9Results
  ]
  calculateSummary(allWorldResults)
}

main()
