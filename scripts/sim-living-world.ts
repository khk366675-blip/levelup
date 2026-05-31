import { createSeededRng } from '../src/lib/game'
import { initLivingWorld, getRegionTotalPower } from '../src/lib/livingWorld'
import { advanceWorldDay } from '../src/lib/livingWorldTick'

const RUNS = 500
const SIM_DAYS = 100

function runSimulation(seed: number): {
  firstMonarchDay: number | null
  finalWorldCorruption: number
  explodedGatesCount: number
  clearedGatesCount: number
  initialNamedCount: number
  survivingNamedCount: number
  monarchsSpawnedTotal: number
  strongestRegion: string
  weakestRegion: string
  homeInvadedDay: number | null
  totalOccupiedRegions: number
  defeatedMonarchsCount: number
} {
  let state = initLivingWorld(seed)
  const initialNamedCount = Object.keys(state.namedHunters).length

  let firstMonarchDay: number | null = null
  let homeInvadedDay: number | null = null
  let explodedGatesCount = 0
  let clearedGatesCount = 0

  for (let d = 1; d <= SIM_DAYS; d++) {
    const dayRng = createSeededRng(state.seed + state.day)
    state = advanceWorldDay(state, dayRng)

    if (firstMonarchDay === null && (state.monarchsSpawnedTotal ?? 0) > 0) {
      firstMonarchDay = d
    }
    if (homeInvadedDay === null && state.homeReachedMonarchId) {
      homeInvadedDay = d
    }
  }

  // Count gates
  for (const nodeId in state.riftNodes) {
    const node = state.riftNodes[nodeId]
    if (node.status === 'exploded') {
      explodedGatesCount++
    } else if (node.status === 'cleared') {
      clearedGatesCount++
    }
  }

  // Surviving named hunters
  let survivingNamedCount = 0
  for (const hunterId in state.namedHunters) {
    if (state.namedHunters[hunterId].status !== 'dead') {
      survivingNamedCount++
    }
  }

  // Strongest and weakest region
  let maxPower = -1
  let minPower = Infinity
  let strongest = ''
  let weakest = ''

  for (const regionId in state.regions) {
    const power = getRegionTotalPower(state.regions[regionId], state.namedHunters)
    if (power > maxPower) {
      maxPower = power
      strongest = regionId
    }
    if (power < minPower) {
      minPower = power
      weakest = regionId
    }
  }

  let uniqueOccupied = new Set<string>()
  let defeatedMonarchsCount = 0
  if (state.activeMonarchs) {
    state.activeMonarchs.forEach(m => {
      if (m.status === 'rampaging') {
        m.occupiedRegionIds.forEach(rid => uniqueOccupied.add(rid))
      } else if (m.status === 'defeated') {
        defeatedMonarchsCount++
      }
    })
  }

  return {
    firstMonarchDay,
    finalWorldCorruption: state.worldCorruption,
    explodedGatesCount,
    clearedGatesCount,
    initialNamedCount,
    survivingNamedCount,
    monarchsSpawnedTotal: state.monarchsSpawnedTotal ?? 0,
    strongestRegion: strongest,
    weakestRegion: weakest,
    homeInvadedDay,
    totalOccupiedRegions: uniqueOccupied.size,
    defeatedMonarchsCount
  }
}

function main() {
  console.log('==================================================')
  console.log(`[시뮬레이션] 플레이어 개입 없는 100일 월드 시뮬레이션 (${RUNS}회 실행)`)
  console.log('==================================================')

  let firstMonarchDays: number[] = []
  let finalCorruptions: number[] = []
  let explodedGates: number[] = []
  let clearedGates: number[] = []
  let namedSurvivalRates: number[] = []
  let monarchSpawnedTotals: number[] = []
  let homeInvadedDays: number[] = []
  let totalOccupiedRegionsList: number[] = []
  let defeatedMonarchsCountList: number[] = []

  const strongestCounts: Record<string, number> = {}
  const weakestCounts: Record<string, number> = {}

  for (let i = 0; i < RUNS; i++) {
    const seed = 100000 + i * 7
    const result = runSimulation(seed)

    if ((i + 1) % 50 === 0) {
      console.log(`- 진행률: ${i + 1}/${RUNS} 완료`)
    }

    if (result.firstMonarchDay !== null) {
      firstMonarchDays.push(result.firstMonarchDay)
    }
    if (result.homeInvadedDay !== null) {
      homeInvadedDays.push(result.homeInvadedDay)
    }
    finalCorruptions.push(result.finalWorldCorruption)
    explodedGates.push(result.explodedGatesCount)
    clearedGates.push(result.clearedGatesCount)
    namedSurvivalRates.push(result.survivingNamedCount / result.initialNamedCount)
    monarchSpawnedTotals.push(result.monarchsSpawnedTotal)
    totalOccupiedRegionsList.push(result.totalOccupiedRegions)
    defeatedMonarchsCountList.push(result.defeatedMonarchsCount)

    strongestCounts[result.strongestRegion] = (strongestCounts[result.strongestRegion] || 0) + 1
    weakestCounts[result.weakestRegion] = (weakestCounts[result.weakestRegion] || 0) + 1
  }

  const average = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const median = (arr: number[]) => {
    if (arr.length === 0) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  const avgFirstMonarch = average(firstMonarchDays)
  const medFirstMonarch = median(firstMonarchDays)
  const avgCorruption = average(finalCorruptions)
  const medCorruption = median(finalCorruptions)
  const avgExploded = average(explodedGates)
  const avgCleared = average(clearedGates)
  const avgSurvival = average(namedSurvivalRates) * 100
  const avgMonarchs = average(monarchSpawnedTotals)
  const rate8Monarchs = (monarchSpawnedTotals.filter(c => c >= 8).length / RUNS) * 100
  const avgHomeInvaded = average(homeInvadedDays)
  const rateHomeInvaded = (homeInvadedDays.length / RUNS) * 100
  const avgOccupied = average(totalOccupiedRegionsList)
  const avgDefeatedMonarchs = average(defeatedMonarchsCountList)

  console.log(`\n### 1. 주요 밸런스 지표 실측 결과`);
  console.log(`- 평균 첫 군주 등장 시점: ${avgFirstMonarch > 0 ? `${avgFirstMonarch.toFixed(2)} 일차` : '미등장'}`);
  console.log(`- 중앙값 첫 군주 등장 시점: ${medFirstMonarch > 0 ? `${medFirstMonarch} 일차` : '미등장'}`);
  console.log(`- 100일 시점 평균 세계 오염도: ${avgCorruption.toFixed(2)}%`);
  console.log(`- 100일 시점 중앙값 세계 오염도: ${medCorruption}%`);
  console.log(`- 100일 평균 군주 등장 수: ${avgMonarchs.toFixed(2)}명 / 8명`);
  console.log(`- 8군주 등장 완료율 (100% 보장 목표): ${rate8Monarchs.toFixed(2)}%`);
  console.log(`- 평균 폭주 게이트 수: ${avgExploded.toFixed(2)}개`);
  console.log(`- 평균 클리어 게이트 수: ${avgCleared.toFixed(2)}개`);
  console.log(`- 네임드 헌터 평균 생존율: ${avgSurvival.toFixed(2)}%`);
  console.log(`- 거점(한국) 침공 발생률: ${rateHomeInvaded.toFixed(1)}% (${homeInvadedDays.length} / ${RUNS}회)`);
  console.log(`- 평균 거점 침공 시점: ${avgHomeInvaded > 0 ? `${avgHomeInvaded.toFixed(2)} 일차` : '미침공'}`);
  console.log(`- 100일 시점 평균 군주 점령 국가 수: ${avgOccupied.toFixed(2)}개국 / 15개국`);
  console.log(`- 100일 평균 NPC의 군주 격퇴 수: ${avgDefeatedMonarchs.toFixed(2)}명`);

  console.log(`\n### 2. 국가 흥망 빈도 (강국 / 약국 빈도)`);
  console.log(`- 가장 강한 국가 빈도:`);
  Object.entries(strongestCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([reg, count]) => {
      console.log(`  * ${reg.toUpperCase()}: ${((count / RUNS) * 100).toFixed(1)}%`);
    });

  console.log(`- 가장 약한 국가 빈도:`);
  Object.entries(weakestCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([reg, count]) => {
      console.log(`  * ${reg.toUpperCase()}: ${((count / RUNS) * 100).toFixed(1)}%`);
    });

  console.log(`\n### 3. 재현성 검증 (동일 시드로 2회 구동 비교)`);
  const seedForReproducibility = 987654321
  const run1 = runSimulation(seedForReproducibility)
  const run2 = runSimulation(seedForReproducibility)

  const isIdentical = 
    run1.firstMonarchDay === run2.firstMonarchDay &&
    run1.finalWorldCorruption === run2.finalWorldCorruption &&
    run1.explodedGatesCount === run2.explodedGatesCount &&
    run1.clearedGatesCount === run2.clearedGatesCount &&
    run1.survivingNamedCount === run2.survivingNamedCount &&
    run1.monarchsSpawnedTotal === run2.monarchsSpawnedTotal &&
    run1.strongestRegion === run2.strongestRegion &&
    run1.weakestRegion === run2.weakestRegion &&
    run1.homeInvadedDay === run2.homeInvadedDay &&
    run1.totalOccupiedRegions === run2.totalOccupiedRegions &&
    run1.defeatedMonarchsCount === run2.defeatedMonarchsCount

  console.log(`- 동일 시드 (${seedForReproducibility}) 2회 실행 결과 일치 여부: ${isIdentical ? '✅ 일치 (재현성 확보)' : '❌ 불일치 (버그 발생)'}`);
  console.log('==================================================');
}

main()
