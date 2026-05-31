import type { LivingWorldState, NamedHunter, RegionState, RiftNode, Rank, ActiveMonarch } from './types'
import { RIFT_REGIONS, REGION_ADJACENCY, RIFT_NODES } from './seed'
import { MONARCHS } from './monarchs'
import { getRegionalTheme } from './livingWorldGateContent'
import { getNPCEquipmentForScore } from './hunterEquipment'
import { getHunterTrait } from './hunterTraits'
import { getNamedHunterBasePower } from './hunterUnified'

type RngFn = () => number

// =====================================================================
// 밸런스 튜닝 상수 (살아있는 균열 세계)
// 목표 기준선: 플레이어 개입 없이 100일 시뮬 시 → 세계 오염도 70%+,
//   군주 2~3명 등장, 거의 모든 회차에서 군주 최소 1명 등장(세계가 무너지는 궤도).
// 밸런스가 어긋나면 아래 숫자만 조정해 재측정한다. (로직은 건드리지 않음)
// =====================================================================

// [레버1] 게이트 난이도 배율. 일반 게이트 기본 난이도에 곱해 NPC 성공률을 낮춘다.
//   기존 99% 성공률 → 목표 70~80%대. 값↑ = 세계가 더 위험.
const GATE_DIFFICULTY_MULT = 2.45

// [레버2] S급 게이트 조기화. 시작일을 앞당기고 출현 확률을 올린다.
const SGRADE_START_DAY = 20
const SGRADE_CHANCE_EARLY = 0.4   // SGRADE_START_DAY~59일
const SGRADE_CHANCE_MID = 0.65    // 60~89일
const SGRADE_CHANCE_LATE = 0.9    // 90일+

// [레버3] 정화 보너스 감소. 클리어 시 지역 오염 감소량을 줄여 오염이 쌓이게 한다.
//   기존 5~10 → 축소. 값↓ = 오염이 더 잘 쌓임.
const CLEANSE_MIN = 1
const CLEANSE_RANGE = 2   // 실제 정화 = CLEANSE_MIN ~ CLEANSE_MIN+CLEANSE_RANGE

// [레버4] 군주 등장 후 오염 가속. 군주가 하나라도 있으면 매일 이만큼 전역 오염 상승.
//   주의: 군주 '수에 비례'시키면 양성 피드백으로 폭주(0 아니면 5로 양극화)하므로,
//   고정 소량으로 두어 서서히 압박만 가한다. (설계 4장: 1막 멈추지 않되 점진적)
const MONARCH_DAILY_CORRUPTION = 0.6

// [레버5] 군주 등장 오염 임계값. 각 군주가 등장하는 전역 오염도 경계.
//   간격이 좁으면 오염 상승 시 군주가 우르르 등장한다. 100일 평균 2~3명이 목표.
//   5명(천사 직전)은 오염 거의 만렙(plateau)에서만 도달하도록 상한을 높게 둔다.
const MONARCH_THRESHOLDS = [45, 63, 80, 92, 98]   // 1~5번째 군주 등장 오염도
const MONARCH_EXPAND_INTERVAL = 3 // 군주 영역 확장 주기 (일)

/**
 * 특정 지역의 가용 총전력을 계산합니다. (사망/부상 헌터 제외)
 */
function getActiveRegionPower(
  region: RegionState,
  namedHunters: Record<string, NamedHunter>,
  gate?: RiftNode,
  nextRiftNodes?: Record<string, RiftNode>
): number {
  const RANK_INDEX: Record<string, number> = {
    E: 0, D: 1, C: 2, B: 3, A: 4, S: 5, National: 6
  }

  function getRankMatchWeight(hunterRank: string, gateRank: string, daysRemaining?: number): number {
    const hIdx = RANK_INDEX[hunterRank] ?? 2
    const gIdx = RANK_INDEX[gateRank] ?? 2
    const distance = Math.abs(hIdx - gIdx)
    
    let weight = 0.0
    if (distance === 0) weight = 1.0
    else if (distance === 1) weight = 0.5
    else if (distance === 2) weight = 0.1
    
    // 긴급 완화 (daysRemaining <= 3 이고 거리 3 이내인 경우 완화계수 0.3~0.4 적용)
    if (daysRemaining !== undefined && daysRemaining <= 3) {
      if (distance === 1) weight = 0.7
      else if (distance === 2) weight = 0.4
      else if (distance === 3) weight = 0.3
    }
    
    return weight
  }

  // 1. 해당 지역의 활성화된 게이트들 목록 추출 (파견 비율 분배용)
  const activeGates: RiftNode[] = []
  if (gate && nextRiftNodes) {
    for (const gid of region.activeGateIds) {
      const g = nextRiftNodes[gid]
      if (g && g.status === 'active') {
        activeGates.push(g)
      }
    }
  }

  let namedPower = 0
  const activeNamedNamedHunters = region.namedHunterIds
    .map(id => namedHunters[id])
    .filter(h => h && h.status === 'active') as NamedHunter[]
  const activeNamedCount = activeNamedNamedHunters.length

  for (const hunter of activeNamedNamedHunters) {
    let p = hunter.power + (hunter.equipmentScore ?? 0)
    const trait = getHunterTrait(hunter.traitId)
    
    if (trait) {
      if (trait.winMod) p *= trait.winMod
      if (activeNamedCount === 1) {
        if (trait.soloWinMod) p *= trait.soloWinMod
        if (trait.soloMod) p *= trait.soloMod
      } else if (activeNamedCount > 1) {
        if (trait.coopMod) p *= trait.coopMod
      }
    }

    // 파견 비율 계산
    let ratio = 1.0
    if (gate && activeGates.length > 0) {
      let hunterScores: Record<string, number> = {}
      let totalScore = 0
      for (const g of activeGates) {
        const gRank = g.difficultyRank ?? 'C'
        const weight = getRankMatchWeight(hunter.rank, gRank, g.daysRemaining)
        const score = weight * (10 / Math.max(1, g.daysRemaining))
        hunterScores[g.id] = score
        totalScore += score
      }
      ratio = totalScore > 0 ? (hunterScores[gate.id] ?? 0) / totalScore : 0.0
    }

    namedPower += p * ratio
  }

  const pool = region.pool
  let poolPower = 0

  if (gate && activeGates.length > 0) {
    // 각 익명 풀 등급에 대해서도 매칭 비율 계산
    const anonGroups = [
      { rank: 'C', count: pool.countC, avgPower: pool.avgPowerC },
      { rank: 'B', count: pool.countB, avgPower: pool.avgPowerB },
      { rank: 'A', count: pool.countA, avgPower: pool.avgPowerA },
    ]

    for (const grp of anonGroups) {
      let groupScores: Record<string, number> = {}
      let totalScore = 0
      for (const g of activeGates) {
        const gRank = g.difficultyRank ?? 'C'
        const weight = getRankMatchWeight(grp.rank, gRank, g.daysRemaining)
        const score = weight * (10 / Math.max(1, g.daysRemaining))
        groupScores[g.id] = score
        totalScore += score
      }
      const ratio = totalScore > 0 ? (groupScores[gate.id] ?? 0) / totalScore : 0.0
      poolPower += (grp.count * grp.avgPower) * 0.08 * ratio
    }
  } else {
    // gate가 지정되지 않은 경우 기존 계산
    poolPower = (pool.countA * pool.avgPowerA +
                 pool.countB * pool.avgPowerB +
                 pool.countC * pool.avgPowerC) * 0.08
  }

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
  let nextActiveMonarchs: ActiveMonarch[] = [...(state.activeMonarchs ?? [])]
  let nextHomeReachedMonarchId = state.homeReachedMonarchId
  let nextMonarchsSpawnedTotal = state.monarchsSpawnedTotal ?? 0

  // [NEW] 틱 시작 전 통계 계산 (플레이어 클리어 반영)
  const initialClearedCount = Object.values(state.riftNodes).filter(n => n.status === 'cleared').length
  const initialExplodedCount = Object.values(state.riftNodes).filter(n => n.status === 'exploded').length
  let npcClearedToday = 0
  let npcExplodedToday = 0

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
      if (hunter.stats && hunter.level && hunter.jobId) {
        // [헌터 스탯 통일 1단계] 스탯 기반 헌터는 레벨/스탯이 고정되므로 랜덤 성장 배제 및 통일 전투력 최신화
        hunter.power = getNamedHunterBasePower(hunter)
      } else {
        // 성장률 롤링 및 천장 적용 (성향 growthBias 및 특성 growthMod 반영)
        const trait = getHunterTrait(hunter.traitId)
        const growthMod = trait?.growthMod ?? 1.0

        const biasMultiplier = 1 + (region?.growthBias ?? 0.5) * 0.25
        const growth = hunter.power * (hunter.growthRate - 1) * biasMultiplier * growthMod
        let nextPower = Math.round(hunter.power + growth)

        // 네임드 S급 성장 천장 (4,500 ~ 5,500 대역)
        const cap = 4500 + (region?.growthBias ?? 0.5) * 1000
        if (nextPower > cap) {
          nextPower = Math.round(cap)
        }
        hunter.power = nextPower
      }
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
        node.loveCall = undefined
        npcExplodedToday++

        const region = { ...nextRegions[node.regionId] }
        const rName = RIFT_REGIONS.find(r => r.id === node.regionId)?.name ?? node.regionId.toUpperCase()

        // 오염 가중
        const corruptionAdd = Math.round(12 + rng() * 6)
        region.corruption = Math.min(100, region.corruption + corruptionAdd)

        // 전역 오염도 가중
        const globalCorruptionAdd = Math.round(10 + rng() * 5)
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
    const rName = RIFT_REGIONS.find(r => r.id === regionId)?.name ?? regionId.toUpperCase()
    const isOccupied = nextActiveMonarchs.some(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(regionId))

    if (isOccupied) {
      region.corruption = Math.min(100, region.corruption + 3)
    }

    // 1. 해당 지역의 모든 활성 게이트 목록 추출
    const regionActiveGates: RiftNode[] = []
    for (const gateId of region.activeGateIds) {
      const gate = nextRiftNodes[gateId]
      if (gate && gate.status === 'active') {
        regionActiveGates.push(gate)
      }
    }

    if (regionActiveGates.length === 0) {
      nextRegions[regionId] = region
      continue
    }

    const RANK_INDEX: Record<string, number> = {
      E: 0, D: 1, C: 2, B: 3, A: 4, S: 5, National: 6
    }
    function getRankMatchWeight(hunterRank: string, gateRank: string, daysRemaining?: number): number {
      const hIdx = RANK_INDEX[hunterRank] ?? 2
      const gIdx = RANK_INDEX[gateRank] ?? 2
      const distance = Math.abs(hIdx - gIdx)
      
      let weight = 0.0
      if (distance === 0) weight = 1.0
      else if (distance === 1) weight = 0.5
      else if (distance === 2) weight = 0.1
      
      if (daysRemaining !== undefined && daysRemaining <= 3) {
        if (distance === 1) weight = 0.7
        else if (distance === 2) weight = 0.4
        else if (distance === 3) weight = 0.3
      }
      
      return weight
    }

    // 2. 각 활성 게이트별로 도전 판정
    for (const gate of regionActiveGates) {
      // 해당 게이트에 파견된 헌터들의 전력합 산출
      const activePower = getActiveRegionPower(region, nextNamedHunters, gate, nextRiftNodes)
      const ratio = activePower / Math.max(1, gate.difficulty ?? 0)

      // 파견 전력이 0보다 큰 경우에만 도전 시도
      if (activePower <= 0) {
        // 이 게이트에 파견된 헌터가 없다면 (등급 미스매치로 방치됨) -> 도전하지 않고 방치 처리
        if ((gate.daysRemaining ?? 0) <= 5) {
          if (!gate.loveCall?.active) {
            const helperHunterIds: string[] = []
            for (const hid in nextNamedHunters) {
              const h = nextNamedHunters[hid]
              if (h && h.regionId === regionId && h.status === 'active') {
                helperHunterIds.push(h.id)
              }
            }
            const promisedGold = Math.round(gate.difficulty * 0.2 * (1 + (5 - gate.daysRemaining) * 0.15))
            const promisedEssence = Math.round(gate.difficulty * 0.08 * (1 + (5 - gate.daysRemaining) * 0.15))
            const promisedXp = Math.round(gate.difficulty * 0.15 * (1 + (5 - gate.daysRemaining) * 0.15))

            gate.loveCall = {
              active: true,
              promisedReward: {
                gold: promisedGold,
                shadowEssence: promisedEssence,
                hunterXp: promisedXp
              },
              helperHunterIds,
              issuedDay: nextDay
            }
            nextRiftNodes[gate.id] = gate
            addLog(`📢 [${rName}]에서 긴급 방치 게이트 [${gate.name}] (시한 ${gate.daysRemaining}일)에 대해 용병 헌터 러브콜을 발송했습니다!`)
          }
        }
        continue
      }

      let winChance = 0.5
      if (ratio >= 1.5) {
        winChance = 0.85 + (ratio - 1.5) * 0.1
      } else if (ratio >= 1.0) {
        winChance = 0.5 + (ratio - 1.0) * 0.7
      } else {
        winChance = 0.5 * ratio
      }
      winChance = Math.max(0.01, Math.min(0.99, winChance))

      // Berserker 기복 (varianceMod) 반영 - 이 게이트에 실제 파견된 헌터들의 가중 평균 반영
      let avgVarianceMod = 1.0
      let berserkerCount = 0
      let activeHunterCount = 0

      for (const hid of region.namedHunterIds) {
        const h = nextNamedHunters[hid]
        if (h && h.status === 'active') {
          let totalScore = 0
          let targetScore = 0
          for (const g of regionActiveGates) {
            const gRank = g.difficultyRank ?? 'C'
            const w = getRankMatchWeight(h.rank, gRank, g.daysRemaining)
            const s = w * (10 / Math.max(1, g.daysRemaining))
            totalScore += s
            if (g.id === gate.id) {
              targetScore = s
            }
          }
          const dispatchRatio = totalScore > 0 ? targetScore / totalScore : 0.0
          
          if (dispatchRatio > 0) {
            activeHunterCount += dispatchRatio
            const t = getHunterTrait(h.traitId)
            if (t?.varianceMod) {
              avgVarianceMod += (t.varianceMod - 1.0) * dispatchRatio
              berserkerCount += dispatchRatio
            }
          }
        }
      }
      if (berserkerCount > 0 && activeHunterCount > 0) {
        const noise = (rng() - 0.5) * 0.4 * ((avgVarianceMod / activeHunterCount) - 1.0)
        winChance = Math.max(0.01, Math.min(0.99, winChance + noise))
      }

      // 국가 성향(riskAppetite) 대조 도전 결정 및 이 게이트에 파견된 헌터들의 riskMod 가중 반영
      const minRequiredWinChance = 0.75 - region.riskAppetite * 0.45
      let avgRiskMod = 1.0
      let riskModSum = 0
      let activeRiskHunterCount = 0

      for (const hid of region.namedHunterIds) {
        const h = nextNamedHunters[hid]
        if (h && h.status === 'active') {
          let totalScore = 0
          let targetScore = 0
          for (const g of regionActiveGates) {
            const gRank = g.difficultyRank ?? 'C'
            const w = getRankMatchWeight(h.rank, gRank, g.daysRemaining)
            const s = w * (10 / Math.max(1, g.daysRemaining))
            totalScore += s
            if (g.id === gate.id) {
              targetScore = s
            }
          }
          const dispatchRatio = totalScore > 0 ? targetScore / totalScore : 0.0
          
          if (dispatchRatio > 0) {
            const t = getHunterTrait(h.traitId)
            riskModSum += (t?.riskMod ?? 1.0) * dispatchRatio
            activeRiskHunterCount += dispatchRatio
          }
        }
      }
      if (activeRiskHunterCount > 0) {
        avgRiskMod = riskModSum / activeRiskHunterCount
      }
      const adjustedMinRequiredWinChance = Math.max(0.1, Math.min(0.9, minRequiredWinChance / avgRiskMod))

      // 점령된 상태에서는 NPC 헌터 게이트 도전이 불가 (자력 방어 수단 완전 상실)
      const isChallenging = winChance >= adjustedMinRequiredWinChance && !isOccupied

      if (isChallenging) {
        const isSuccess = rng() < winChance

        if (isSuccess) {
          // 공략 성공!
          const gNode = { ...gate }
          gNode.status = 'cleared'
          gNode.daysRemaining = 0
          gNode.loveCall = undefined
          nextRiftNodes[gNode.id] = gNode
          npcClearedToday++

          region.activeGateIds = region.activeGateIds.filter(id => id !== gNode.id)

          // 참전 헌터 성장 보너스 - 기여도 비례 반영
          let hIdx = 0
          for (const hunterId of region.namedHunterIds) {
            hIdx++
            const hunter = { ...nextNamedHunters[hunterId] }
            if (hunter.status === 'active') {
              let totalScore = 0
              let targetScore = 0
              for (const g of regionActiveGates) {
                const gRank = g.difficultyRank ?? 'C'
                const w = getRankMatchWeight(hunter.rank, gRank, g.daysRemaining)
                const s = w * (10 / Math.max(1, g.daysRemaining))
                totalScore += s
                if (g.id === gate.id) {
                  targetScore = s
                }
              }
              const dispatchRatio = totalScore > 0 ? targetScore / totalScore : 0.0

              if (dispatchRatio > 0) {
                const trait = getHunterTrait(hunter.traitId)
                const growthMod = trait?.growthMod ?? 1.0
                const lootMod = trait?.lootMod ?? 1.0

                const bonusMult = 1.01 + (rng() * 0.02) * growthMod * dispatchRatio
                hunter.power = Math.round(hunter.power * bonusMult)
                const cap = 4500 + region.growthBias * 1000
                if (hunter.power > cap) hunter.power = Math.round(cap)

                const difficultyVal = gate.difficulty ?? 500
                let equipGain = Math.round(difficultyVal * (0.005 + rng() * 0.01) * dispatchRatio)

                const baseLuckyChance = 0.04
                const adjustedLuckyChance = baseLuckyChance * lootMod * dispatchRatio
                const isLuckyDrop = rng() < adjustedLuckyChance
                if (isLuckyDrop) {
                  const luckyAdd = Math.round(500 + rng() * 600)
                  equipGain += luckyAdd
                  addLog(`🍀 [대박 드랍] [${hunter.name}] 헌터가 전리품으로 고성능 장비를 획득했습니다! (+${luckyAdd} 장비전투력)`)
                }

                const oldScore = hunter.equipmentScore ?? 0
                const nextScore = oldScore + equipGain
                hunter.equipmentScore = nextScore

                const itemSeed = Math.floor(nextScore + nextDay + hIdx)
                hunter.equipmentItems = getNPCEquipmentForScore(nextScore, itemSeed)

                nextNamedHunters[hunterId] = hunter
              }
            }
          }

          // 오염 정화 보너스 (지역 오염도 감소 - 파견 비율 가중치 반영)
          const cleanse = Math.round(CLEANSE_MIN + rng() * CLEANSE_RANGE)
          
          let avgCleanseMod = 1.0
          let strategistCount = 0
          let activeCleanseHunterCount = 0

          for (const hid of region.namedHunterIds) {
            const h = nextNamedHunters[hid]
            if (h && h.status === 'active') {
              let totalScore = 0
              let targetScore = 0
              for (const g of regionActiveGates) {
                const gRank = g.difficultyRank ?? 'C'
                const w = getRankMatchWeight(h.rank, gRank, g.daysRemaining)
                const s = w * (10 / Math.max(1, g.daysRemaining))
                totalScore += s
                if (g.id === gate.id) {
                  targetScore = s
                }
              }
              const dispatchRatio = totalScore > 0 ? targetScore / totalScore : 0.0

              if (dispatchRatio > 0) {
                activeCleanseHunterCount += dispatchRatio
                const t = getHunterTrait(h.traitId)
                if (t?.cleanseMod) {
                  avgCleanseMod += (t.cleanseMod - 1.0) * dispatchRatio
                  strategistCount += dispatchRatio
                }
              }
            }
          }
          
          let adjustedCleanse = cleanse
          if (strategistCount > 0 && activeCleanseHunterCount > 0) {
            adjustedCleanse = Math.round(cleanse * (avgCleanseMod / activeCleanseHunterCount))
          }
          region.corruption = Math.max(0, region.corruption - adjustedCleanse)

          addLog(`⚔️ [${rName}] 헌터들이 [${gate.name}] 게이트 공략에 성공했습니다! (승률: ${Math.round(winChance * 100)}%) 지역 오염도 -${adjustedCleanse}%`)
        } else {
          // 공략 실패! (부상 또는 사망)
          const diffRatio = (gate.difficulty ?? 0) / Math.max(1, activePower)
          const deathChance = 0.02 + Math.max(0, diffRatio - 1.0) * 0.2

          const candidateNamedWithRatio: { hunterId: string, ratio: number }[] = []
          for (const hid of region.namedHunterIds) {
            const h = nextNamedHunters[hid]
            if (h && h.status === 'active') {
              let totalScore = 0
              let targetScore = 0
              for (const g of regionActiveGates) {
                const gRank = g.difficultyRank ?? 'C'
                const w = getRankMatchWeight(h.rank, gRank, g.daysRemaining)
                const s = w * (10 / Math.max(1, g.daysRemaining))
                totalScore += s
                if (g.id === gate.id) {
                  targetScore = s
                }
              }
              const dispatchRatio = totalScore > 0 ? targetScore / totalScore : 0.0
              if (dispatchRatio > 0) {
                candidateNamedWithRatio.push({ hunterId: hid, ratio: dispatchRatio })
              }
            }
          }

          if (candidateNamedWithRatio.length > 0) {
            let totalWeight = candidateNamedWithRatio.reduce((sum, item) => sum + item.ratio, 0)
            let rVal = rng() * totalWeight
            let targetHunterId = candidateNamedWithRatio[0].hunterId
            let runningSum = 0
            for (const item of candidateNamedWithRatio) {
              runningSum += item.ratio
              if (rVal <= runningSum) {
                targetHunterId = item.hunterId
                break
              }
            }

            const hunter = { ...nextNamedHunters[targetHunterId] }
            const trait = getHunterTrait(hunter.traitId)
            const deathMod = trait?.deathMod ?? 1.0
            const adjustedDeathChance = deathChance * deathMod

            const isDead = rng() < adjustedDeathChance
            if (isDead) {
              hunter.status = 'dead'
              addLog(`💀 [${rName}] 헌터들이 [${gate.name}] 공략 중 패배했습니다. 무모한 전투의 결과로 네임드 헌터 [${hunter.name}]이(가) 전사했습니다!`)
            } else {
              hunter.status = 'injured'
              hunter.injuredTurns = 3
              addLog(`🩹 [${rName}] 헌터들이 [${gate.name}] 공략 중 퇴각했습니다. 네임드 헌터 [${hunter.name}]이(가) 심한 부상을 입어 3일간 요양합니다.`)
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
  // 각 지역별 새로운 게이트 생성 롤링 (한국은 플레이어 활동 보장을 위해 35%로 상향, 타국은 18% 유지)
  for (const regionId in nextRegions) {
    const isKr = regionId === 'kr'
    const spawnChance = (isKr ? 0.35 : 0.18) + nextDay * 0.006
    if (rng() < spawnChance) {
      const region = { ...nextRegions[regionId] }
      // 한 국가당 점증하는 활성 게이트 상한 체크
      if (region && region.activeGateIds.length < (4 + Math.floor(nextDay / 16))) {
        const isSGrade = nextDay >= SGRADE_START_DAY && rng() < (nextDay < 60 ? SGRADE_CHANCE_EARLY : nextDay < 90 ? SGRADE_CHANCE_MID : SGRADE_CHANCE_LATE)
        
                const newGateId = `gate-spawn-${nextDay}-${regionId}-${Math.floor(rng() * 10000)}`
        const rName = RIFT_REGIONS.find(r => r.id === regionId)?.name ?? regionId.toUpperCase()
        
        let subRegionId = regionId
        if (regionId === 'kr') {
          const krSubRegions = ['seoul', 'incheon', 'busan', 'jeju']
          subRegionId = krSubRegions[Math.floor(rng() * krSubRegions.length)]
        }
        const theme = getRegionalTheme(subRegionId)
        
        let gateName = '심연의 균열'
        if (theme.gateNames && theme.gateNames.length > 0) {
          gateName = theme.gateNames[Math.floor(rng() * theme.gateNames.length)]
        }
        
        let difficulty = 600
        let deadline = 10
        let rank: Rank = 'C'

        if (isSGrade) {
          difficulty = Math.round(8000 + rng() * 6000) // 8000~14000 CP (S급 강도 대폭 상향!)
          deadline = Math.round(6 + rng() * 4) // 6~10일 시한
          rank = 'S'
        } else {
          const difficultyRoll = rng()
          if (difficultyRoll < 0.40) {
            difficulty = Math.round((300 + rng() * 300) * GATE_DIFFICULTY_MULT)
            deadline = Math.round(8 + rng() * 4) // E급 8~12일
            rank = 'E'
          } else if (difficultyRoll < 0.70) {
            difficulty = Math.round((700 + rng() * 400) * GATE_DIFFICULTY_MULT)
            deadline = Math.round(7 + rng() * 4) // D급 7~11일
            rank = 'D'
          } else if (difficultyRoll < 0.85) {
            difficulty = Math.round((1300 + rng() * 600) * GATE_DIFFICULTY_MULT)
            deadline = Math.round(6 + rng() * 4) // C급 6~10일
            rank = 'C'
          } else if (difficultyRoll < 0.95) {
            difficulty = Math.round((2200 + rng() * 800) * GATE_DIFFICULTY_MULT)
            deadline = Math.round(5 + rng() * 4) // B급 5~9일
            rank = 'B'
          } else {
            difficulty = Math.round((3500 + rng() * 1200) * GATE_DIFFICULTY_MULT)
            deadline = Math.round(4 + rng() * 4) // A급 4~8일
            rank = 'A'
          }
        }

        // 월드맵 지역 표시 좌표 기준으로 약간의 편차(-3 ~ +3)를 주어 근처에 생성되도록 함
        const regionMeta = RIFT_REGIONS.find(r => r.id === regionId)
        const baseX = regionMeta ? regionMeta.labelX : 50
        const baseY = regionMeta ? regionMeta.labelY : 50
        const gateX = Math.max(5, Math.min(95, Math.round(baseX - 3 + rng() * 6)))
        const gateY = Math.max(5, Math.min(95, Math.round(baseY - 3 + rng() * 6)))

        nextRiftNodes[newGateId] = {
          id: newGateId,
          regionId,
          subRegionId,
          name: gateName,
          x: gateX,
          y: gateY,
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

  // 5.5 [레버4] 군주 등장 후 오염 가속 — 등장한 군주 수에 비례해 매일 전역 오염 상승
  // (설계 4장: 1막은 군주 등장 후에도 멈추지 않으며 군주가 압박을 가중한다)
  if (nextActiveMonarchs.length > 0) {
    nextWorldCorruption = Math.min(100, nextWorldCorruption + MONARCH_DAILY_CORRUPTION)
  }

  // 6. 군주 등장 조건 판정 (하이브리드 트리거)
  const TH8 = [38, 48, 57, 66, 74, 82, 90, 97]
  let corruptionStage = 0
  for (let i = 0; i < 8; i++) {
    if (nextWorldCorruption >= TH8[i]) {
      corruptionStage = i + 1
    }
  }
  // 시간 상한: Day50 첫 군주 보장, 이후 7일마다 +1 강제
  let timeStage = 0
  if (nextDay >= 50) {
    timeStage = Math.min(8, 1 + Math.floor((nextDay - 50) / 7))
  }
  const nextMonarchsLimit = Math.min(8, Math.max(corruptionStage, timeStage))

  if (nextMonarchsLimit > nextMonarchsSpawnedTotal) {
    // 임계값 초과에 따른 군주 순차 스폰
    const spawnCount = nextMonarchsLimit - nextMonarchsSpawnedTotal
    for (let k = 0; k < spawnCount; k++) {
      const spawnIndex = nextMonarchsSpawnedTotal + k
      const targetMonarchData = MONARCHS[spawnIndex]
      if (targetMonarchData) {
        // 무작위 오염된 국가에 침공 (오염도 10 이상인 국가 중 하나 선택)
        const highlyCorruptedRegions = Object.keys(nextRegions).filter(id => nextRegions[id].corruption >= 10)
        const targetRegionId = highlyCorruptedRegions.length > 0 
          ? highlyCorruptedRegions[Math.floor(rng() * highlyCorruptedRegions.length)]
          : RIFT_REGIONS[Math.floor(rng() * RIFT_REGIONS.length)].id
          
        const rName = RIFT_REGIONS.find(r => r.id === targetRegionId)?.name ?? targetRegionId.toUpperCase()

        // 신규 ActiveMonarch 개체 생성
        const newMonarch: ActiveMonarch = {
          monarchId: targetMonarchData.id,
          rank: targetMonarchData.rank,
          occupiedRegionIds: [targetRegionId],
          appearedDay: nextDay,
          status: 'rampaging',
          lastExpandDay: nextDay
        }

        nextActiveMonarchs.push(newMonarch)
        nextMonarchsSpawnedTotal++
        
        // 침공당한 지역의 오염도 즉시 급증 (+20%)
        nextRegions[targetRegionId].corruption = Math.min(100, nextRegions[targetRegionId].corruption + 20)

        addLog(`👑 ⚡ [군주 출현] 제 ${targetMonarchData.rank}위 군주 [${targetMonarchData.name}] (테마: ${targetMonarchData.theme})이(가) [${rName}] 지역으로 침공을 개시했습니다! 해당 국가 오염도 급증 및 세계 종말이 가속화됩니다.`)
      }
    }
  }

  // 7. 군주 영역 확장 & NPC 저항 & 거점 침공 가드
  // 7-1) 영역 확장
  for (let mIdx = 0; mIdx < nextActiveMonarchs.length; mIdx++) {
    const monarch = { ...nextActiveMonarchs[mIdx] }
    if (monarch.status !== 'rampaging') continue

    // 3일마다 영역 확장
    if (nextDay - monarch.lastExpandDay >= MONARCH_EXPAND_INTERVAL) {
      // 점령국들과 인접한 미점령국 목록 확보
      const allAdjacents: string[] = []
      for (const regId of monarch.occupiedRegionIds) {
        const adjacents = REGION_ADJACENCY[regId] || []
        for (const adj of adjacents) {
          if (!allAdjacents.includes(adj)) {
            allAdjacents.push(adj)
          }
        }
      }

      // 군주 본인이 이미 점령한 국가 제외
      const unassignedAdjacents = allAdjacents.filter(adj => !monarch.occupiedRegionIds.includes(adj))

      if (unassignedAdjacents.length > 0) {
        // rng()로 무작위 1개 선택
        const expandRegionId = unassignedAdjacents[Math.floor(rng() * unassignedAdjacents.length)]
        const expName = RIFT_REGIONS.find(r => r.id === expandRegionId)?.name ?? expandRegionId.toUpperCase()
        const monarchName = MONARCHS.find(mon => mon.id === monarch.monarchId)?.name ?? monarch.monarchId.toUpperCase()

        monarch.occupiedRegionIds.push(expandRegionId)
        monarch.lastExpandDay = nextDay

        // 점령당한 지역 오염도 즉시 급증 (+20%)
        nextRegions[expandRegionId].corruption = Math.min(100, nextRegions[expandRegionId].corruption + 20)

        addLog(`👑 📢 [영역 확장] 군주 [${monarchName}]이(가) 인접한 [${expName}] 지역으로 영역을 확장했습니다!`)
      }
    }

    // 7-2) NPC 저항 (세계 천장 반영)
    // 점령지 내에서 NPC들의 저항 시도
    if (monarch.occupiedRegionIds.length > 0) {
      const monarchData = MONARCHS.find(mon => mon.id === monarch.monarchId)
      if (monarchData) {
        // 군주의 서열이 7~8위 (그렐릭, 셀라이드)인 경우 가끔 격퇴 가능
        if (monarchData.rank >= 7) {
          // 점령지 중 무작위 1곳의 헌터들이 도전
          const challengeRegId = monarch.occupiedRegionIds[Math.floor(rng() * monarch.occupiedRegionIds.length)]
          const reg = nextRegions[challengeRegId]
          if (reg) {
            const activeRegionPower = getActiveRegionPower(reg, nextNamedHunters)
            // 총전력이 군주 권장 CP보다 클 때, 12% 확률로 격퇴 성공
            if (activeRegionPower >= monarchData.recommendedCP && rng() < 0.12) {
              monarch.status = 'defeated'
              monarch.occupiedRegionIds = []
              const expName = RIFT_REGIONS.find(r => r.id === challengeRegId)?.name ?? challengeRegId.toUpperCase()

              addLog(`⚔️ 🎉 [군주 격퇴] [${expName}]의 NPC 헌터들이 연합하여 군주 [${monarchData.name}]을(를) 격퇴하는 기적을 일으켰습니다! 영역이 해방되었습니다.`)
            }
          }
        } else {
          // 6위 이상 강한 군주는 NPC가 저항해도 무조건 실패 (전멸 처리)
          if (rng() < 0.1) { // 매 틱 10%의 확률로 NPC가 도전했다가 참패하는 이벤트
            const challengeRegId = monarch.occupiedRegionIds[Math.floor(rng() * monarch.occupiedRegionIds.length)]
            const reg = nextRegions[challengeRegId]
            if (reg) {
              const regName = RIFT_REGIONS.find(r => r.id === challengeRegId)?.name ?? challengeRegId.toUpperCase()
              // 부상 또는 사망
              const activeNamedIds = reg.namedHunterIds.filter(id => nextNamedHunters[id].status === 'active')
              if (activeNamedIds.length > 0) {
                const targetHunterId = activeNamedIds[Math.floor(rng() * activeNamedIds.length)]
                const hunter = { ...nextNamedHunters[targetHunterId] }
                hunter.status = 'injured'
                hunter.injuredTurns = 4 // 군주와의 조우로 깊은 내상을 입어 4일간 요양
                nextNamedHunters[targetHunterId] = hunter
                
                // 오염 폭증 (+15%)
                reg.corruption = Math.min(100, reg.corruption + 15)

                addLog(`💀 [참변] [${regName}]의 헌터들이 군주 [${monarchData.name}]에게 저항을 시도했으나 참패하여 흩어졌습니다! [${hunter.name}] 헌터가 치명적인 부상을 입었습니다.`)
              }
            }
          }
        }
      }
    }

    nextActiveMonarchs[mIdx] = monarch
  }

  // 7-3) 거점 도달(한국) 감지 및 강제 전투 플래그 세팅
  // 살아있는(rampaging) 모든 군주 중 occupiedRegionIds에 'kr'이 있는지 스캔
  const krInvaders = nextActiveMonarchs.filter(m => m.status === 'rampaging' && m.occupiedRegionIds.includes('kr'))
  if (krInvaders.length > 0) {
    // 거점에 도달한 군주들 중 rank가 가장 높은(낮은 숫자) 군주를 선택
    krInvaders.sort((a, b) => a.rank - b.rank)
    nextHomeReachedMonarchId = krInvaders[0].monarchId
    const monarchName = MONARCHS.find(mon => mon.id === nextHomeReachedMonarchId)?.name ?? nextHomeReachedMonarchId.toUpperCase()
    
    addLog(`🚨 ⚠️ [초비상] 군주 [${monarchName}]이(가) 대한민국의 방어선을 돌파하고 거점에 도달했습니다! 더 이상 도망칠 곳은 없습니다. 강제 전투가 걸립니다!`)
  } else {
    // 대한민국 영토가 안전해졌다면 (격퇴 등으로) 플래그를 클리어
    nextHomeReachedMonarchId = undefined
  }

  // [NEW] dailySummaries 갱신 계산
  const prevSummaries = state.dailySummaries ?? []
  const lastSummary = prevSummaries[prevSummaries.length - 1]
  const prevCumulativeCleared = lastSummary ? lastSummary.cumulativeClearedGatesCount : 0
  const prevCumulativeExploded = lastSummary ? lastSummary.cumulativeRampagedGatesCount : 0

  // 당일 플레이어가 정화한 횟수
  const playerClearedToday = Math.max(0, initialClearedCount - prevCumulativeCleared)
  const totalClearedToday = playerClearedToday + npcClearedToday
  const totalExplodedToday = npcExplodedToday // 플레이어는 폭주를 유발하지 않음

  const nextCumulativeCleared = prevCumulativeCleared + totalClearedToday
  const nextCumulativeExploded = prevCumulativeExploded + totalExplodedToday

  const activeMonarchCount = nextActiveMonarchs.filter(m => m.status === 'rampaging').length

  const todaySummary = {
    day: state.day, // 현재 종료된 Day 날짜
    worldCorruption: nextWorldCorruption,
    gatesClearedToday: totalClearedToday,
    gatesRampagedToday: totalExplodedToday,
    monarchCount: activeMonarchCount,
    cumulativeClearedGatesCount: nextCumulativeCleared,
    cumulativeRampagedGatesCount: nextCumulativeExploded
  }

  const nextSummaries = [...prevSummaries, todaySummary]
  // 최근 30일 데이터만 유지
  if (nextSummaries.length > 30) {
    nextSummaries.shift()
  }

  return {
    ...state,
    day: nextDay,
    regions: nextRegions,
    namedHunters: nextNamedHunters,
    riftNodes: nextRiftNodes,
    worldCorruption: nextWorldCorruption,
    monarchsAppeared: nextActiveMonarchs.length, // 기존 monarchsAppeared 숫자 카운트도 연동
    activeMonarchs: nextActiveMonarchs,
    homeReachedMonarchId: nextHomeReachedMonarchId,
    eventLogs: logs,
    dailySummaries: nextSummaries,
    monarchsSpawnedTotal: nextMonarchsSpawnedTotal
  }
}
