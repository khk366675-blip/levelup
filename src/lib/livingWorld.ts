import { createSeededRng } from './game'
import { RIFT_REGIONS, REGION_HUNTER_BASES } from './seed'
import type {
  LivingWorldState,
  RegionState,
  NamedHunter,
  HunterPool
} from './types'

/**
 * 특정 지역의 총전력을 계산합니다. (네임드 헌터 전투력 합 + 익명 풀 전투력 합)
 */
export function getRegionTotalPower(
  regionState: RegionState,
  namedHunters: Record<string, NamedHunter>
): number {
  let namedPower = 0
  for (const hunterId of regionState.namedHunterIds) {
    const hunter = namedHunters[hunterId]
    if (hunter && hunter.status !== 'dead') {
      namedPower += hunter.power
    }
  }

  const pool = regionState.pool
  const poolPower =
    pool.countA * pool.avgPowerA +
    pool.countB * pool.avgPowerB +
    pool.countC * pool.avgPowerC

  return namedPower + poolPower
}

/**
 * 세계 전체의 총전력을 계산합니다.
 */
export function getWorldTotalPower(livingWorld: LivingWorldState): number {
  let total = 0
  for (const regionId in livingWorld.regions) {
    const region = livingWorld.regions[regionId]
    total += getRegionTotalPower(region, livingWorld.namedHunters)
  }
  return total
}

/**
 * 시드 기반 의사난수(RNG)를 이용하여 세계 상태를 초기화합니다.
 * 같은 seed 값이 입력되면 항상 동일한 결과가 반환되어 재현성을 보장합니다.
 */
export function initLivingWorld(seed: number): LivingWorldState {
  const rng = createSeededRng(seed)
  const regions: Record<string, RegionState> = {}
  const namedHunters: Record<string, NamedHunter> = {}

  // 15개국 각각에 대해 상태 초기화
  for (const region of RIFT_REGIONS) {
    const regionId = region.id
    
    // 5축 프로파일 롤링 (0 ~ 1 사이 실수)
    const riskAppetite = rng()
    const populationStyle = rng()
    const growthBias = rng()
    const cohesion = rng()
    const wealth = rng()

    // 해당 국가의 헌터 베이스 데이터 찾기
    const baseData = REGION_HUNTER_BASES.find(b => b.regionId === regionId)
    
    const namedHunterIds: string[] = []
    let pool: HunterPool = {
      countA: 0,
      countB: 0,
      countC: 0,
      avgPowerA: 0,
      avgPowerB: 0,
      avgPowerC: 0
    }

    if (baseData) {
      // 1. 네임드 헌터 생성
      baseData.namedHunters.forEach((hBase, idx) => {
        const hunterId = `hunter-${regionId}-${idx + 1}`
        namedHunterIds.push(hunterId)

        // 베이스 전투력 롤링
        const basePower = hBase.powerRange[0] + rng() * (hBase.powerRange[1] - hBase.powerRange[0])
        
        // 정예형 (populationStyle이 0에 가까울수록)일 때 네임드 헌터 전투력 강화 보너스
        // populationStyle이 0이면 1.25배, 1이면 0.75배
        const eliteFactor = 1.25 - populationStyle * 0.5
        const power = Math.round(basePower * eliteFactor)

        // 성장률 롤링
        const growthRate = hBase.growthRange[0] + rng() * (hBase.growthRange[1] - hBase.growthRange[0])

        namedHunters[hunterId] = {
          id: hunterId,
          regionId,
          name: hBase.name,
          rank: hBase.rank,
          power,
          growthRate,
          status: 'active'
        }
      })

      // 2. 익명 헌터 풀 생성
      const pBase = baseData.pool
      const baseCountA = pBase.countARange[0] + rng() * (pBase.countARange[1] - pBase.countARange[0])
      const baseCountB = pBase.countBRange[0] + rng() * (pBase.countBRange[1] - pBase.countBRange[0])
      const baseCountC = pBase.countCRange[0] + rng() * (pBase.countCRange[1] - pBase.countCRange[0])

      // 머릿수형 (populationStyle이 1에 가까울수록)일 때 익명 풀 인원수 증가 보너스
      // populationStyle이 1이면 1.3배, 0이면 0.7배
      const swarmFactor = 0.7 + populationStyle * 0.6
      const countA = Math.round(baseCountA * swarmFactor)
      const countB = Math.round(baseCountB * swarmFactor)
      const countC = Math.round(baseCountC * swarmFactor)

      const avgPowerA = Math.round(pBase.avgPowerARange[0] + rng() * (pBase.avgPowerARange[1] - pBase.avgPowerARange[0]))
      const avgPowerB = Math.round(pBase.avgPowerBRange[0] + rng() * (pBase.avgPowerBRange[1] - pBase.avgPowerBRange[0]))
      const avgPowerC = Math.round(pBase.avgPowerCRange[0] + rng() * (pBase.avgPowerCRange[1] - pBase.avgPowerCRange[0]))

      pool = {
        countA,
        countB,
        countC,
        avgPowerA,
        avgPowerB,
        avgPowerC
      }
    }

    regions[regionId] = {
      regionId,
      riskAppetite,
      populationStyle,
      growthBias,
      cohesion,
      wealth,
      namedHunterIds,
      pool
    }
  }

  return {
    seed,
    day: 0,
    homeRegionId: 'kr',
    regions,
    namedHunters
  }
}
