import type { LivingWorldState, NamedHunter, RegionState, RiftNode, Rank } from './types'
import { RIFT_REGIONS, REGION_ADJACENCY, RIFT_NODES } from './seed'

type RngFn = () => number

/**
 * 특정 지역의 가용 총전력을 계산합니다. (사망/부상 헌터 제외)
 */
function getActiveRegionPower(region: RegionState, namedHunters: Record<string, NamedHunter>): number {
  let namedPower = 0
  for (const hunterId of region.namedHunterIds) {
    const hunter = namedHunters[hunterId]
    if (hunter && hunter.status === 'active') {
      namedPower += hunter.power
    }
  }

  const pool = region.pool
  // 게이트 하나에 일시 동원되는 익명 풀 전력은 실효 기여도인 8% 수준으로 제한
  const poolPower =
    (pool.countA * pool.avgPowerA +
     pool.countB * pool.avgPowerB +
     pool.countC * pool.avgPowerC) * 0.08

  return Math.round(namedPower + poolPower)
}

/**
 * 하루의 세계 시뮬레이션 틱을 한 번 진행합니다.
 * 순수 함수로 구성되어 있어 입력된 상태를 기반으로 변경된 새로운 상태를 반환합니다.
 */
export function advanceWorldDay(state: LivingWorldState, rng: RngFn): LivingWorldState {
  const nextDay = state.day + 1
  const nextNamedHunters = { ...state.namedHunters }
  const nextRegions = { ...state.regions }
  const nextRiftNodes = { ...state.riftNodes }
  const logs: string[] = [...state.eventLogs]
  let nextWorldCorruption = state.worldCorruption

  function addLog(msg: string) {
    logs.push(`[Day ${nextDay}] ${msg}`)
    // 최대 로그 60개 유지
    if (logs.length > 60) {
      logs.shift()
    }
  }

  // 1. 헌터 성장 및 부상 치료
  for (const hunterId in nextNamedHunters) {
    const hunter = { ...nextNamedHunters[hunterId] }
    const region = nextRegions[hunter.regionId]

    if (hunter.status === 'injured') {
      const turns = (hunter.injuredTurns ?? 3) - 1
      if (turns <= 0) {
        hunter.status = 'active'
        hunter.injuredTurns = undefined
        addLog(`🏥 ${region.regionId.toUpperCase()}의 네임드 헌터 [${hunter.name}]이(가) 부상에서 완치되어 복귀했습니다.`)
      } else {
        hunter.injuredTurns = turns
      }
    } else if (hunter.status === 'active') {
      // 성장률 롤링 및 천장 적용 (성향 growthBias 반영)
      const biasMultiplier = 1 + (region?.growthBias ?? 0.5) * 0.25
      const growth = hunter.power * (hunter.growthRate - 1) * biasMultiplier
      let nextPower = Math.round(hunter.power + growth)

      // 네임드 S급 성장 천장 (4,500 ~ 5,500 대역)
      const cap = 4500 + (region?.growthBias ?? 0.5) * 1000
      if (nextPower > cap) {
        nextPower = Math.round(cap)
      }
      hunter.power = nextPower
    }

    nextNamedHunters[hunterId] = hunter
  }

  // 익명 풀 점진성장 (Cap 이하 성장)
  for (const regionId in nextRegions) {
    const region = { ...nextRegions[regionId] }
    const pool = { ...region.pool }

    // 하루 약 +0.5% ~ +0.8% 내외 성장
    const growthMult = 1.005 + rng() * 0.003
    pool.avgPowerA = Math.min(2500, Math.round(pool.avgPowerA * growthMult))
    pool.avgPowerB = Math.min(1300, Math.round(pool.avgPowerB * growthMult))
    pool.avgPowerC = Math.min(700, Math.round(pool.avgPowerC * growthMult))

    region.pool = pool
    nextRegions[regionId] = region
  }

  // 2. 게이트 시한 경과 및 폭주 처리
  for (const nodeId in nextRiftNodes) {
    const node = { ...nextRiftNodes[nodeId] }

    if (node.status === 'active') {
      const remaining = (node.daysRemaining ?? 0) - 1
      if (remaining <= 0) {
        // 폭주!
        node.status = 'exploded'
        node.daysRemaining = 0

        const region = { ...nextRegions[node.regionId] }
        const rName = RIFT_REGIONS.find(r => r.id === node.regionId)?.name ?? node.regionId.toUpperCase()

        // 오염 가중
        const corruptionAdd = Math.round(15 + rng() * 10)
        region.corruption = Math.min(100, region.corruption + corruptionAdd)

        // 전역 오염도 가중 (폭주 게이트당 약 12 ~ 18 상승)
        const globalCorruptionAdd = Math.round(12 + rng() * 6)
        nextWorldCorruption = Math.min(100, nextWorldCorruption + globalCorruptionAdd)

        // 활성 게이트 목록에서 제거
        region.activeGateIds = region.activeGateIds.filter(id => id !== node.id)

        addLog(`💥 [${rName}]의 [${node.name}] 게이트가 방치되어 폭주했습니다! 지역 오염도 +${corruptionAdd}%, 전역 오염도 +${globalCorruptionAdd}%`)

        nextRegions[node.regionId] = region
      } else {
        node.daysRemaining = remaining
      }
      nextRiftNodes[node.id] = node
    }
  }

  // 3. 국가별 게이트 대응 판단 및 도전 판정
  for (const regionId in nextRegions) {
    const region = { ...nextRegions[regionId] }
    if (region.activeGateIds.length === 0) continue

    const rName = RIFT_REGIONS.find(r => r.id === regionId)?.name ?? regionId.toUpperCase()

    // 가장 시한이 촉박한 게이트를 최우선 대응 타겟으로 설정
    let targetGate: RiftNode | null = null
    for (const gateId of region.activeGateIds) {
      const gate = nextRiftNodes[gateId]
      if (gate && gate.status === 'active') {
        if (!targetGate || (gate.daysRemaining ?? 0) < (targetGate.daysRemaining ?? 0)) {
          targetGate = gate
        }
      }
    }

    if (!targetGate) continue

    // 해당 게이트에 대한 승률 산출
    const activePower = getActiveRegionPower(region, nextNamedHunters)
    const ratio = activePower / Math.max(1, targetGate.difficulty ?? 0)

    let winChance = 0.5
    if (ratio >= 1.5) {
      winChance = 0.85 + (ratio - 1.5) * 0.1
    } else if (ratio >= 1.0) {
      winChance = 0.5 + (ratio - 1.0) * 0.7
    } else {
      winChance = 0.5 * ratio
    }
    winChance = Math.max(0.01, Math.min(0.99, winChance))

    // 국가 성향(riskAppetite) 대조 도전 결정
    // riskAppetite가 1이면 승률이 30%여도 도전, 0이면 75% 이상일 때만 도전
    const minRequiredWinChance = 0.75 - region.riskAppetite * 0.45
    const isChallenging = winChance >= minRequiredWinChance

    if (isChallenging) {
      const isSuccess = rng() < winChance

      if (isSuccess) {
        // 공략 성공!
        const gate = { ...targetGate }
        gate.status = 'cleared'
        gate.daysRemaining = 0
        nextRiftNodes[gate.id] = gate

        region.activeGateIds = region.activeGateIds.filter(id => id !== gate.id)

        // 참전 헌터 성장 보너스
        for (const hunterId of region.namedHunterIds) {
          const hunter = { ...nextNamedHunters[hunterId] }
          if (hunter.status === 'active') {
            const bonusMult = 1.01 + rng() * 0.02
            hunter.power = Math.round(hunter.power * bonusMult)
            // 천장 재가드
            const cap = 4500 + region.growthBias * 1000
            if (hunter.power > cap) hunter.power = Math.round(cap)
            nextNamedHunters[hunterId] = hunter
          }
        }

        // 오염 정화 보너스 (지역 오염도 -5% ~ -10%)
        const cleanse = Math.round(5 + rng() * 5)
        region.corruption = Math.max(0, region.corruption - cleanse)

        addLog(`⚔️ [${rName}] 헌터들이 [${gate.name}] 게이트 공략에 성공했습니다! (승률: ${Math.round(winChance * 100)}%) 지역 오염도 -${cleanse}%`)
      } else {
        // 공략 실패! (부상 또는 사망)
        const diffRatio = (targetGate.difficulty ?? 0) / Math.max(1, activePower)
        // 전력 격차가 크고 무모할수록 사망률 최대 22%
        const deathChance = 0.02 + Math.max(0, diffRatio - 1.0) * 0.2

        // 활성 상태인 네임드 중 무작위 1명 타겟
        const activeNamedIds = region.namedHunterIds.filter(id => nextNamedHunters[id].status === 'active')
        
        if (activeNamedIds.length > 0) {
          const targetHunterId = activeNamedIds[Math.floor(rng() * activeNamedIds.length)]
          const hunter = { ...nextNamedHunters[targetHunterId] }

          const isDead = rng() < deathChance
          if (isDead) {
            hunter.status = 'dead'
            addLog(`💀 [${rName}] 헌터들이 [${targetGate.name}] 공략 중 패배했습니다. 무모한 전투의 결과로 네임드 헌터 [${hunter.name}]이(가) 전사했습니다!`)
          } else {
            hunter.status = 'injured'
            hunter.injuredTurns = 3
            addLog(`🩹 [${rName}] 헌터들이 [${targetGate.name}] 공략 중 퇴각했습니다. 네임드 헌터 [${hunter.name}]이(가) 심한 부상을 입어 3일간 요양합니다.`)
          }
          nextNamedHunters[targetHunterId] = hunter
        } else {
          // 네임드가 없으면 익명 풀 헌터가 전사 (A/B/C급 중 전력비에 비례해 감축)
          const pool = { ...region.pool }
          if (pool.countA > 0 && rng() < 0.2) {
            pool.countA = Math.max(0, pool.countA - 1)
            addLog(`🩹 [${rName}]의 A급 익명 헌터 1명이 전투 중 전사했습니다.`)
          } else if (pool.countB > 0 && rng() < 0.4) {
            pool.countB = Math.max(0, pool.countB - 1)
            addLog(`🩹 [${rName}]의 B급 익명 헌터 1명이 전투 중 전사했습니다.`)
          } else if (pool.countC > 0) {
            pool.countC = Math.max(0, pool.countC - 1)
            addLog(`🩹 [${rName}]의 C급 익명 헌터 1명이 전투 중 전사했습니다.`)
          }
          region.pool = pool
        }

        // 실패 패널티로 지역 오염도 추가 상승
        const corrupt = Math.round(3 + rng() * 5)
        region.corruption = Math.min(100, region.corruption + corrupt)
        addLog(`⚠️ [${rName}] 게이트 공략 실패의 여파로 지역 오염도가 +${corrupt}% 상승했습니다.`)
      }
    } else {
      // 자력 불가능 방치 러브콜 플래그
      if ((targetGate.daysRemaining ?? 0) <= 5) {
        addLog(`📞 [${rName}]가 자력으로 공략할 수 없는 게이트 [${targetGate.name}] (권장전력: ${targetGate.difficulty})에 대해 지원 요청(러브콜) 기척을 흘립니다.`)
      }
    }

    nextRegions[regionId] = region
  }

  // 4. 오염 전파
  for (const regionId in nextRegions) {
    const region = { ...nextRegions[regionId] }
    if (region.corruption >= 30) {
      // 오염이 30 이상인 나라의 오염 전파
      const spread = (region.corruption - 30) * 0.08
      const adjacents = REGION_ADJACENCY[regionId] || []
      
      for (const adjId of adjacents) {
        const adjRegion = nextRegions[adjId]
        if (adjRegion) {
          const updatedAdj = { ...adjRegion }
          const oldCorr = updatedAdj.corruption
          updatedAdj.corruption = Math.min(100, updatedAdj.corruption + Math.round(spread * (0.8 + rng() * 0.4)))
          if (updatedAdj.corruption !== oldCorr) {
            nextRegions[adjId] = updatedAdj
          }
        }
      }
    }
  }

  // 5. 게이트 점진적 생성 & S급 게이트 점진적 추가 (Day 30 이후)
  // 각 지역별 매일 18%의 확률로 새로운 게이트 생성 롤링
  for (const regionId in nextRegions) {
    if (rng() < 0.18) {
      const region = { ...nextRegions[regionId] }
      // 한 국가당 최대 4개 이하의 활성 게이트를 가질 때만 스폰
      if (region && region.activeGateIds.length < 4) {
        const isSGrade = nextDay >= 30 && rng() < (nextDay < 60 ? 0.25 : nextDay < 90 ? 0.55 : 0.85)
        
        const newGateId = `gate-spawn-${nextDay}-${regionId}-${Math.floor(rng() * 10000)}`
        const rName = RIFT_REGIONS.find(r => r.id === regionId)?.name ?? regionId.toUpperCase()
        
        let gateName = '심연의 균열'
        let difficulty = 600
        let deadline = 10
        let rank: Rank = 'C'

        if (isSGrade) {
          gateName = rng() < 0.5 ? '초대형 군단의 틈' : '군주의 심연 균열'
          difficulty = Math.round(8000 + rng() * 6000) // 8000~14000 CP (S급 강도 대폭 상향!)
          deadline = Math.round(6 + rng() * 4) // 6~10일 시한
          rank = 'S'
        } else {
          const difficultyRoll = rng()
          if (difficultyRoll < 0.4) {
            gateName = '보이지 않는 하수구'
            difficulty = Math.round(300 + rng() * 300)
            deadline = Math.round(8 + rng() * 4) // E급 8~12일
            rank = 'E'
          } else if (difficultyRoll < 0.8) {
            gateName = '나태의 메아리 회랑'
            difficulty = Math.round(700 + rng() * 400)
            deadline = Math.round(7 + rng() * 4) // D급 7~11일
            rank = 'D'
          } else {
            gateName = '기억 유실의 서고'
            difficulty = Math.round(1300 + rng() * 600)
            deadline = Math.round(6 + rng() * 4) // C급 6~10일
            rank = 'C'
          }
        }

        nextRiftNodes[newGateId] = {
          id: newGateId,
          regionId,
          name: gateName,
          x: Math.round(20 + rng() * 60),
          y: Math.round(20 + rng() * 60),
          status: 'active',
          gateDefId: isSGrade ? 'gate-lair-of-sloth' : 'gate-rift-alley',
          difficultyRank: rank,
          difficulty,
          deadline,
          daysRemaining: deadline,
          isSGrade
        }

        region.activeGateIds = [...region.activeGateIds, newGateId]
        nextRegions[regionId] = region

        addLog(`🚨 [${rName}] 지역에 새로운 ${rank}급 게이트 [${gateName}] (권장전력: ${difficulty})이(가) 활성화되었습니다!`)
      }
    }
  }

  // 6. 군주 등장 조건 판정
  // 전역 오염도가 30, 50, 70, 85, 95를 초과할 때마다 군주 등장 카운트 증가
  const nextMonarchsLimit = 
    nextWorldCorruption >= 95 ? 5 :
    nextWorldCorruption >= 85 ? 4 :
    nextWorldCorruption >= 70 ? 3 :
    nextWorldCorruption >= 50 ? 2 :
    nextWorldCorruption >= 30 ? 1 : 0

  let nextMonarchsAppeared = state.monarchsAppeared
  if (nextMonarchsLimit > nextMonarchsAppeared) {
    const monarchIndex = nextMonarchsAppeared + 1
    
    // 무작위 오염된 국가에 침공 (오염도 10 이상인 국가 중 하나 선택)
    const highlyCorruptedRegions = Object.keys(nextRegions).filter(id => nextRegions[id].corruption >= 10)
    const targetRegionId = highlyCorruptedRegions.length > 0 
      ? highlyCorruptedRegions[Math.floor(rng() * highlyCorruptedRegions.length)]
      : RIFT_REGIONS[Math.floor(rng() * RIFT_REGIONS.length)].id
      
    const rName = RIFT_REGIONS.find(r => r.id === targetRegionId)?.name ?? targetRegionId.toUpperCase()

    addLog(`👑 ⚡ [위험] 심연의 봉인이 파괴되며 제 ${monarchIndex}군주가 [${rName}] 지역으로 침공을 개시했습니다! 세계 종말이 가속화됩니다.`)
    nextMonarchsAppeared = nextMonarchsLimit
  }

  return {
    ...state,
    day: nextDay,
    regions: nextRegions,
    namedHunters: nextNamedHunters,
    riftNodes: nextRiftNodes,
    worldCorruption: nextWorldCorruption,
    monarchsAppeared: nextMonarchsAppeared,
    eventLogs: logs
  }
}
