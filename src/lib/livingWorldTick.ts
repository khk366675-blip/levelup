import type { LivingWorldState, NamedHunter, RegionState, RiftNode, Rank, ActiveMonarch, WorldEvent, OpportunityReward } from './types'
import { RIFT_REGIONS, REGION_ADJACENCY, RIFT_NODES, GATE_DEFINITIONS } from './seed'
import { MONARCHS } from './monarchs'
import { getRegionalTheme } from './livingWorldGateContent'
import { getNPCEquipmentForScore } from './hunterEquipment'
import { getHunterTrait } from './hunterTraits'
import { getNamedHunterBasePower } from './hunterUnified'
import { canHunterAnswerLoveCall } from './renown'

type RngFn = () => number

export interface AdvanceWorldDayOptions {
  loveCallHelperMaxRank?: Rank
  playerRank?: Rank
  playerPower?: number
}

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
export function advanceWorldDay(state: LivingWorldState, rng: RngFn, options: AdvanceWorldDayOptions = {}): LivingWorldState {
  const nextDay = state.day + 1
  const nextNamedHunters = { ...state.namedHunters }
  const nextRegions = { ...state.regions }
  const nextRiftNodes = { ...state.riftNodes }
  const logs: string[] = [...state.eventLogs]
  const recentEvents: WorldEvent[] = [...(state.recentEvents ?? [])]
  let nextWorldCorruption = state.worldCorruption
  let nextActiveMonarchs: ActiveMonarch[] = [...(state.activeMonarchs ?? [])]
  let nextHomeReachedMonarchId = state.homeReachedMonarchId
  let nextMonarchsSpawnedTotal = state.monarchsSpawnedTotal ?? 0
  const loveCallHelperMaxRank = options.loveCallHelperMaxRank ?? 'National'

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

  function addEvent(
    type: WorldEvent['type'],
    severity: WorldEvent['severity'],
    title: string,
    body: string,
    regionId?: string,
    monarchId?: string,
    cinematic = false,
    quote?: string,
    subtitle?: string
  ) {
    const event: WorldEvent = {
      id: `evt-${nextDay}-${type}-${Math.floor(rng() * 100000)}`,
      day: nextDay,
      type,
      severity,
      title,
      body,
      regionId,
      monarchId,
      cinematic,
      quote,
      subtitle
    }
    recentEvents.push(event)
    if (recentEvents.length > 60) {
      recentEvents.shift()
    }
    return event
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
        const regIdUpper = hunter.regionId.toUpperCase()
        const recoveryBops = [
          `🏥 [완치 복귀] [${regIdUpper}]의 네임드 헌터 [${hunter.name}]이(가) 병상을 털고 일어나 마력 조율을 끝마치고 현역 전선에 복귀했습니다!`,
          `💪 [전력 복구] 오랜 치료 끝에 [${regIdUpper}]의 수호자 [${hunter.name}] 헌터가 부상에서 완전히 회복되어 즉시 던전 공략에 다시 합류합니다!`,
          `✨ [전선 복귀] [${regIdUpper}]의 핵심 헌터 [${hunter.name}]이(가) 마나 치료를 완수하고 건강한 상태로 격벽 방어선에 도달했습니다!`,
          `🏥 [건강 회복] 부상을 이겨낸 [${hunter.name}] 헌터가 마력 회로의 역류를 다스리고 부상 전력에서 활성 상태로 격벽 수호에 복귀했습니다!`
        ]
        const chosenRecovery = recoveryBops[Math.floor(rng() * recoveryBops.length)]
        addLog(chosenRecovery)
        
        const recoveryQuotes = [
          `"치료는 끝났다. 내 칼날은 여전히 예리해. 기다려라 마수들아!"`,
          `"다시는 방심하지 않는다. 내 몸을 지켜준 의료진과 동료들을 위해 싸우겠다."`,
          `"마력 회로 복구 완료. 전 대원, 내 뒤를 따르라! 전장으로 간다!"`,
          `"오래 기다렸지? 자, 밀린 방재 임무를 확실하게 끝내볼까!"`
        ]
        const chosenQuote = recoveryQuotes[Math.floor(rng() * recoveryQuotes.length)]
        
        addEvent('awakening', 'minor', '헌터 완치 복귀', chosenRecovery, hunter.regionId, undefined, false, chosenQuote, `HUNTER SIGNAL RESTORED`)
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
      if (node.opportunity) {
        const remaining = (node.opportunity.daysRemaining ?? 1) - 1
        if (remaining <= 0) {
          // 기회형 한정 시간 이벤트 만료 - 여파 없이 소멸
          const region = { ...nextRegions[node.regionId] }
          const rName = RIFT_REGIONS.find(r => r.id === node.regionId)?.name ?? node.regionId.toUpperCase()
          
          addLog(`⏳ [${rName}]의 한정 이벤트 [${node.opportunity.title}]이(가) 시간이 만료되어 흔적도 없이 사라졌습니다.`)
          
          node.opportunity = undefined
          node.status = 'undiscovered'
          node.daysRemaining = node.deadline || 7
          
          region.activeGateIds = region.activeGateIds.filter(id => id !== node.id)
          nextRegions[node.regionId] = region
          nextRiftNodes[node.id] = node
        } else {
          node.opportunity.daysRemaining = remaining
          node.daysRemaining = remaining
          nextRiftNodes[node.id] = node
        }
        continue
      }

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

        const rampageBops = [
          `💥 [대재앙] [${rName}]의 [${node.name}] 게이트가 무방비로 방치된 끝에 한계를 초과하여 광역 폭주(Rampage)했습니다! 마수들이 현실을 피침식합니다! 지역 오염도 +${corruptionAdd}%, 전역 오염도 +${globalCorruptionAdd}%`,
          `💀 [지면 붕괴] 방치된 [${node.name}] 게이트가 거대 왜곡을 일으키며 [${rName}] 구역에 엄청난 마력을 방출하며 폭발했습니다! 지역 오염도 +${corruptionAdd}%, 전역 오염도 +${globalCorruptionAdd}%`,
          `🚨 [격벽 파손] [${rName}]에서 장기간 관리되지 않은 [${node.name}] 게이트가 현실 침식 장막을 뚫고 폭주하여 마물들이 쏟아져 나옵니다! 지역 오염도 +${corruptionAdd}%, 전역 오염도 +${globalCorruptionAdd}%`
        ]
        const chosenRampage = rampageBops[Math.floor(rng() * rampageBops.length)]
        addLog(chosenRampage)
        
        const panicQuotes = [
          `"사령부 보고! 차원 차단 격벽이 녹아내리고 있습니다! 제발 누구든 도와줘요!"`,
          `"마수들의 해일이 밀려옵니다... 방어 병력은 전부 흩어졌습니다! 긴급 대피 통보!"`,
          `"이곳은 침식 구역 통제실... 치익... 전원 차단... 으아아아악!"`,
          `"게이트의 마력이 폭발했습니다... 도시 전체가 보라색 오염층에 잠기고 있습니다!"`
        ]
        const chosenPanic = panicQuotes[Math.floor(rng() * panicQuotes.length)]

        addEvent('gate_surge', 'major', '게이트 폭주', chosenRampage, node.regionId, undefined, false, chosenPanic, `CIVILIAN CRISIS INTERCEPT`)

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
      if (gate.opportunity) continue // 기회형 이벤트는 플레이어 독점이므로 NPC가 공략하지 않음
      // 해당 게이트에 파견된 헌터들의 전력합 산출
      const activePower = getActiveRegionPower(region, nextNamedHunters, gate, nextRiftNodes)
      const ratio = activePower / Math.max(1, gate.difficulty ?? 0)

      // 러브콜 발송 여부 판단 (파견 전력이 없거나, 타국의 S급 게이트가 폭주 직전인 경우)
      const shouldTriggerLoveCall = !gate.loveCall?.active && 
                                   (gate.daysRemaining ?? 0) <= 5 && 
                                   (activePower <= 0 || (gate.isSGrade && gate.regionId !== 'kr'))

      if (shouldTriggerLoveCall) {
        const helperHunterIds: string[] = []
        for (const hid in nextNamedHunters) {
          const h = nextNamedHunters[hid]
          if (
            h &&
            h.regionId === regionId &&
            h.status === 'active' &&
            canHunterAnswerLoveCall(h.rank, loveCallHelperMaxRank)
          ) {
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
        addEvent('gate_open', 'minor', '용병 러브콜 발송', `📢 [${rName}]의 [${gate.name}] 게이트에 대해 지원 요청이 들어왔습니다.`, gate.regionId, undefined, false)
      }

      // 파견 전력이 0 이하인 경우 도전하지 않고 방치 처리
      if (activePower <= 0) {
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
      // 핫픽스: Day 0일 때 시작점인 '서울 동대문 균열'(node-kr-seoul)은 NPC 헌터들이 첫날 정화하지 못하도록 차단하여 플레이어에게 남겨둡니다.
      const isChallenging = winChance >= adjustedMinRequiredWinChance && !isOccupied && !(state.day === 0 && gate.id === 'node-kr-seoul')

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

                // [각성 시스템] 헌터 잠재력 각성 판정 및 도약 적용
                if ((hunter.rank === 'A' || hunter.rank === 'S') && !hunter.awakened && hunter.potential !== undefined) {
                  // 각성 확률: potential * 0.008 (고잠재력 1.0 기준 클리어당 0.8% 확률)
                  const awakenChance = hunter.potential * 0.008
                  if (rng() < awakenChance) {
                    hunter.awakened = true
                    const oldRank = hunter.rank
                    const newRank = oldRank === 'A' ? 'S' : 'National'
                    hunter.rank = newRank

                    // 1. 스탯 대폭 상승 (stats 모든 능력치 1.40배)
                    if (hunter.stats) {
                      const statsMult = 1.40
                      const nextStats = { ...hunter.stats }
                      for (const statKey in nextStats) {
                        (nextStats as any)[statKey] = Math.round((nextStats as any)[statKey] * statsMult)
                      }
                      hunter.stats = nextStats
                    } else {
                      // stats 가 없는 경우 power 직접 증가
                      hunter.power = Math.round(hunter.power * 1.40)
                    }

                    // 2. 보너스 스킬 주입 (A->S 면 공격력 패시브, S->National 이면 체력 패시브)
                    if (hunter.skillIds) {
                      const bonusSkill = newRank === 'S' ? 'pass_atk_3' : 'pass_hp_3'
                      if (!hunter.skillIds.includes(bonusSkill)) {
                        hunter.skillIds = [...hunter.skillIds, bonusSkill]
                      }
                    }

                    // 3. 통일 전투력 최신화 (stats 및 rank 변경 사항 자동 재계산 적용)
                    if (hunter.stats && hunter.level && hunter.jobId) {
                      hunter.power = getNamedHunterBasePower(hunter)
                    }

                    const regName = RIFT_REGIONS.find(r => r.id === regionId)?.name ?? regionId.toUpperCase()
                    const awakenBops = [
                      `✨ [각성 발동] [${regName}]의 [${hunter.name}] 헌터가 전투 중 극적인 각성을 거치며 등급이 [${oldRank}] $\\to$ [${newRank}]급으로 도약했습니다! 스탯이 대폭 강화되어 새로운 전력이 되었습니다.`,
                      `⚡ [한계 돌파 각성] [${regName}]의 [${hunter.name}] 헌터가 사투 끝에 잠재 마력을 폭발시키며 [${oldRank}] $\\to$ [${newRank}]급으로 전율적인 한계 돌파에 성공했습니다!`,
                      `🌟 [영웅 각성 탄생] [${regName}]의 수호자 [${hunter.name}] 헌터가 마력 공명을 통해 극적으로 각성하며 등급이 [${oldRank}] $\\to$ [${newRank}]급으로 급상승했습니다!`
                    ]
                    const chosenAwaken = awakenBops[Math.floor(rng() * awakenBops.length)]
                    addLog(chosenAwaken)

                    const awakenQuotes = [
                      `"마력이... 끊임없이 솟구쳐 오르는구나. 내 안의 한계를 깨부수고 말겠다!"`,
                      `"이제 마수들의 격랑이 두렵지 않다. 내가 바로 인류의 선봉이 되리라!"`,
                      `"이 강력한 울림... 내 영혼의 불꽃이 드디어 각성했군. 지켜봐라, 우리의 내일을!"`,
                      `"힘이 끓어 넘친다... 동료들이여, 내 등 뒤를 지켜라. 내가 전부 베어 넘기겠다!"`
                    ]
                    const chosenQuote = awakenQuotes[Math.floor(rng() * awakenQuotes.length)]
                    addEvent('awakening', 'major', '헌터 한계돌파 각성', chosenAwaken, regionId, undefined, true, chosenQuote, `HUNTER EVOLUTION SIGNAL`)
                  }
                }

                const difficultyVal = gate.difficulty ?? 500
                let equipGain = Math.round(difficultyVal * (0.005 + rng() * 0.01) * dispatchRatio)

                const baseLuckyChance = 0.04
                const adjustedLuckyChance = baseLuckyChance * lootMod * dispatchRatio
                const isLuckyDrop = rng() < adjustedLuckyChance
                if (isLuckyDrop) {
                  const luckyAdd = Math.round(500 + rng() * 600)
                  equipGain += luckyAdd
                  const dropBops = [
                    `🍀 [대박 드랍] [${hunter.name}] 헌터가 던전 깊은 곳의 고대 상자에서 전설급 명검을 발굴하여 무장을 업그레이드했습니다! (+${luckyAdd} 장비전투력)`,
                    `💎 [희귀 유물] [${hunter.name}] 헌터가 마수 우두머리로부터 오라가 서린 성스러운 장갑을 획득했습니다! (+${luckyAdd} 장비전투력)`,
                    `📦 [신성 보구] [${hunter.name}] 헌터가 게이트 지휘관실에서 눈부신 절대 방어 판금 갑옷을 노획했습니다! (+${luckyAdd} 장비전투력)`,
                    `🛡️ [마력 유물] [${hunter.name}] 헌터가 고농축 마력 왜곡구 내에서 충격 흡수 오라 코트를 손에 넣었습니다! (+${luckyAdd} 장비전투력)`
                  ]
                  const chosenDrop = dropBops[Math.floor(rng() * dropBops.length)]
                  addLog(chosenDrop)
                  
                  const dropQuotes = [
                    `"이 무기에서 뿜어져 나오는 서늘한 기운... 이걸로 더 많은 게이트를 봉인하겠어!"`,
                    `"내 오랜 장비를 교체할 때가 되었군. 엄청난 성능이다..."`,
                    `"이 귀중한 보구는 우리 팀의 든든한 방패가 될 것입니다."`,
                    `"하핫! 던전 탐험 끝에 이런 귀한 물건을 건지다니, 운이 아주 좋군!"`
                  ]
                  const chosenDropQuote = dropQuotes[Math.floor(rng() * dropQuotes.length)]
                  addEvent('gate_open', 'minor', '고성능 전설 장비 획득', chosenDrop, hunter.regionId, undefined, false, chosenDropQuote, `TACTICAL DROP INTERCEPT`)
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

          const victoryBops = [
            `⚔️ [게이트 정화] [${rName}] 헌터들이 [${gate.name}] 게이트 깊숙이 침투하여 군단장을 참수하고 공략에 성공했습니다! (승률: ${Math.round(winChance * 100)}%) 지역 오염도 -${adjustedCleanse}%`,
            `🛡️ [완벽 방어] [${rName}] 수호대가 [${gate.name}] 게이트 마수들의 대규모 차원 파동을 격퇴하고 정화했습니다! (승률: ${Math.round(winChance * 100)}%) 지역 오염도 -${adjustedCleanse}%`,
            `✨ [정화 완수] [${rName}] 연합팀이 고난도의 [${gate.name}] 게이트 코어를 분쇄하며 차원 틈새를 성공적으로 봉인했습니다! (승률: ${Math.round(winChance * 100)}%) 지역 오염도 -${adjustedCleanse}%`,
            `🌀 [균열 봉쇄] [${rName}] 헌터들이 마수들의 포위를 뚫고 [${gate.name}] 던전을 완벽히 제어 및 정화했습니다! (승률: ${Math.round(winChance * 100)}%) 지역 오염도 -${adjustedCleanse}%`
          ]
          const chosenVictory = victoryBops[Math.floor(rng() * victoryBops.length)]
          addLog(chosenVictory)
          
          const victoryQuotes = [
            `"마지막 마수까지 처단 완료. 게이트 붕괴가 멈췄습니다!"`,
            `"후우... 꽤 거친 전투였지만, 인류의 수호선은 오늘도 건재하다!"`,
            `"코어 해제 성공! 전원 부상 수습하고 귀환 및 다음 방지 임무 준비!"`,
            `"우리가 해냈다! 이 땅은 우리가 지킨다!"`
          ]
          const chosenVictoryQuote = victoryQuotes[Math.floor(rng() * victoryQuotes.length)]
          
          addEvent('gate_open', 'minor', '게이트 정화 성공', chosenVictory, gate.regionId, undefined, false, chosenVictoryQuote, `GATE SEALED SUCCESSFULLY`)
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
              const deathBops = [
                `💀 비보 전달. [${rName}]의 찬란한 영웅 [${hunter.name}] 헌터가 차원 던전 심부에서 최후까지 항전하다 장렬히 전사했습니다...`,
                `🖤 전선의 거성이 지다. [${rName}]의 S급 헌터 [${hunter.name}]이(가) 침식 게이트 공략 중 아군을 수호하고 전사했습니다...`,
                `🥀 [${rName}]의 희망 [${hunter.name}] 헌터가 균열 속에서 밀려드는 마수들의 격랑을 홀로 막아내며 산화했습니다...`,
                `🪦 명복을 빕니다. [${rName}]의 수호자 [${hunter.name}] 헌터가 차원 침공 방어선에서 고결한 희생을 치렀습니다.`,
                `🥀 전사 통보. [${rName}]의 기둥이었던 [${hunter.name}] 헌터가 [${gate.name}]의 보스 마수와 공멸하며 뜨거운 생을 마감했습니다...`,
                `🪦 영웅 잠들다. [${rName}] 방어 기지의 수장 [${hunter.name}]이(가) 침공 세력을 저지하고 영면하셨음을 엄숙히 알립니다.`
              ]
              const chosenDeath = deathBops[Math.floor(rng() * deathBops.length)]
              
              const deathQuotes = [
                `"방벽을... 사수해라. 나의 동료들이여, 인류의 불빛을 꺼뜨리지 마라..."`,
                `"난 부끄럽지 않다... 마지막까지 인류를 위해 방패가 되었으니..."`,
                `"괴물놈들... 너희들의 파멸도 멀지 않았다... 먼저 가서 기다리마..."`,
                `"내 죽음이 헛되지 않게... 끝까지 이 세계를 지켜다오..."`
              ]
              const chosenDeathQuote = deathQuotes[Math.floor(rng() * deathQuotes.length)]
              
              addEvent('awakening', 'major', '네임드 헌터 전사', chosenDeath, region.regionId, undefined, true, chosenDeathQuote, `HEROIC SACRIFICE LOG`)
            } else {
              hunter.status = 'injured'
              hunter.injuredTurns = 3
              addLog(`🩹 [${rName}] 헌터들이 [${gate.name}] 공략 중 퇴각했습니다. 네임드 헌터 [${hunter.name}]이(가) 심한 부상을 입어 3일간 요양합니다.`)
              const injuryBops = [
                `🩹 [${rName}]의 네임드 헌터 [${hunter.name}]이(가) 던전 공략 실패로 중상을 입어 전선에서 일시 이탈했습니다.`,
                `🩹 부상 비상! [${rName}]의 [${hunter.name}] 헌터가 마수와의 사투 끝에 깊은 상흔을 입고 3일간 집중 치료에 돌입합니다.`,
                `🩹 전력 공백... [${rName}]의 주축인 [${hunter.name}] 헌터가 게이트 전투 중 마력 역류로 부상을 입어 안정을 취합니다.`,
                `🩹 [${rName}]의 수호단장 [${hunter.name}] 헌터가 기습적인 균열 폭발을 온몸으로 막아내고 심각한 부상을 입어 후송되었습니다.`,
                `🩹 심한 부상. [${hunter.name}] 헌터가 무리한 돌파를 감행하다 차원 마력 폭풍에 휩쓸려 전신 마비성 골절을 입었습니다.`,
                `🩹 긴급 요양. [${hunter.name}] 헌터가 퇴각 대열을 수호하다 오른팔 마나 통로에 치명적인 타격을 입었습니다.`
              ]
              const chosenInjury = injuryBops[Math.floor(rng() * injuryBops.length)]
              
              const injuryQuotes = [
                `"크윽... 상처가 깊지만 아직 내 심장은 고동치고 있다. 3일만 기다려라..."`,
                `"크억, 뼈가 으스러졌나... 하지만 이 정도 통증으론 날 멈출 수 없다!"`,
                `"미안하군... 방심했어. 치료되는 즉시 전선으로 돌아가 마수들의 목을 베겠다."`,
                `"아직... 싸울 수... 흐윽... 동료들아 무사히 퇴각해서 다행이다..."`
              ]
              const chosenInjuryQuote = injuryQuotes[Math.floor(rng() * injuryQuotes.length)]
              
              addEvent('awakening', 'minor', '헌터 심각한 부상', chosenInjury, region.regionId, undefined, false, chosenInjuryQuote, `HUNTER CASUALTY SIGNAL`)
            }
            nextNamedHunters[targetHunterId] = hunter
        } else {
          // 네임드가 없으면 익명 풀 헌터가 전사 (A/B/C급 중 전력비에 비례해 감축)
          const pool = { ...region.pool }
          if (pool.countA > 0 && rng() < 0.2) {
            pool.countA = Math.max(0, pool.countA - 1)
            addLog(`🩹 [${rName}]의 A급 익명 헌터 1명이 전투 중 전사했습니다.`)
            addEvent('gate_open', 'minor', '익명 헌터 전사', `🩹 [${rName}]의 A급 익명 헌터 1명이 전투 중 전사했습니다.`, region.regionId, undefined, false)
          } else if (pool.countB > 0 && rng() < 0.4) {
            pool.countB = Math.max(0, pool.countB - 1)
            addLog(`🩹 [${rName}]의 B급 익명 헌터 1명이 전투 중 전사했습니다.`)
            addEvent('gate_open', 'minor', '익명 헌터 전사', `🩹 [${rName}]의 B급 익명 헌터 1명이 전투 중 전사했습니다.`, region.regionId, undefined, false)
          } else if (pool.countC > 0) {
            pool.countC = Math.max(0, pool.countC - 1)
            addLog(`🩹 [${rName}]의 C급 익명 헌터 1명이 전투 중 전사했습니다.`)
            addEvent('gate_open', 'minor', '익명 헌터 전사', `🩹 [${rName}]의 C급 익명 헌터 1명이 전투 중 전사했습니다.`, region.regionId, undefined, false)
          }
          region.pool = pool
        }

        // 실패 패널티로 지역 오염도 추가 상승
        const corrupt = Math.round(3 + rng() * 5)
        region.corruption = Math.min(100, region.corruption + corrupt)
        addLog(`⚠️ [${rName}] 게이트 공략 실패의 여파로 지역 오염도가 +${corrupt}% 상승했습니다.`)
        addEvent('gate_surge', 'minor', '게이트 공략 실패', `⚠️ [${rName}] 게이트 공략 실패로 지역 오염도가 상승했습니다.`, region.regionId, undefined, false)
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
    const spawnChance = (isKr ? 0.42 : 0.23) + nextDay * 0.006
    if (rng() < spawnChance) {
      const region = { ...nextRegions[regionId] }
      // 한 국가당 점증하는 활성 게이트 상한 체크
      if (region && region.activeGateIds.length < (4 + Math.floor(nextDay / 16))) {
        const isSGrade = nextDay >= SGRADE_START_DAY && rng() < (nextDay < 60 ? SGRADE_CHANCE_EARLY : nextDay < 90 ? SGRADE_CHANCE_MID : SGRADE_CHANCE_LATE)
        
                const newGateId = `gate-spawn-${nextDay}-${regionId}-${Math.floor(rng() * 10000)}`
        const rName = RIFT_REGIONS.find(r => r.id === regionId)?.name ?? regionId.toUpperCase()
        
        let subRegionId = regionId
        if (regionId === 'kr') {
          const krSubRegions = ['seoul', 'incheon', 'busan', 'jeju', 'daejeon', 'daegu', 'gwangju']
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
        if (isSGrade) {
          addEvent('sgrade_gate', 'major', 'S급 게이트 활성화', `🚨 [${rName}] 지역에 대재앙급 S급 게이트 [${gateName}]가 열렸습니다!`, regionId, undefined, true)
        } else {
          addEvent('gate_open', 'minor', '신규 게이트 오픈', `🚨 [${rName}] 지역에 ${rank}급 게이트 [${gateName}]가 활성화되었습니다.`, regionId, undefined, false)
        }
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
        addEvent('monarch_appear', 'critical', '군주 출현', `👑 제 ${targetMonarchData.rank}위 군주 [${targetMonarchData.name}] (테마: ${targetMonarchData.theme})이(가) [${rName}] 지역에 강림했습니다!`, targetRegionId, targetMonarchData.id, true)
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
        addEvent('occupied', 'major', '영역 확장', `👑 군주 [${monarchName}]이(가) 인접한 [${expName}] 지역으로 영역을 확장했습니다!`, expandRegionId, monarch.monarchId, true)

        // 거점 위협 감지 (한국 인접 지역 jp, cn 점령 시)
        if (REGION_ADJACENCY['kr'].includes(expandRegionId)) {
          addLog(`👑 🚨 [거점 위협] 군주 [${monarchName}]이(가) [${expName}]을(를) 장악하여 대한민국 국경에 도달했습니다! 침공 위협이 심각해집니다.`)
          addEvent('home_threat', 'critical', '거점 위협 경보', `👑 군주 [${monarchName}]이(가) [${expName}]을(를) 장악하여 거점 바로 직전까지 침투했습니다!`, 'kr', monarch.monarchId, true)
        }
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
              const defeatBops = [
                `⚔️ 인류의 반격! [${expName}]의 영웅들이 연합 전선을 구축해 침략자 군주 [${monarchData.name}]을(를) 격퇴하는 위대한 역사를 썼습니다!`,
                `✨ 영광의 승전보! 전 세계의 이목이 집중된 사투 끝에, [${expName}] 연합군이 군주 [${monarchData.name}]의 목을 베고 대지를 정화했습니다!`,
                `🌈 기적의 강림! 멸망의 포화 속에서 [${expName}]의 수호자들이 군주 [${monarchData.name}]의 침략군을 마침내 궤멸시키고 승리했습니다!`,
                `🛡️ 절망을 가른 검날! [${expName}] 전선에서 수많은 희생 끝에 군주 [${monarchData.name}]의 본체를 소멸하는 데 완전히 성공했습니다!`,
                `🎉 세기의 대승! [${expName}]에서 인류의 결사수호대가 군주 [${monarchData.name}]의 방어벽을 깨부수고 기적적인 종지부를 찍었습니다!`
              ]
              const chosenDefeat = defeatBops[Math.floor(rng() * defeatBops.length)]
              
              const victoryQuotes = [
                `"인류의 불꽃은 결코 꺼지지 않는다! 군주여, 심연으로 되돌아가라!"`,
                `"승리다! 우리가 마침내 거대한 재앙을 꺾었다! 전 대원, 영토 수복을 선언한다!"`,
                `"믿기지 않는군... 우리가 신적 존재를 상대로 정말 이겼어..."`,
                `"오늘의 희생을 잊지 마라. 이 승리는 내일의 희망이다!"`
              ]
              const chosenVictoryQuote = victoryQuotes[Math.floor(rng() * victoryQuotes.length)]
              addEvent('defeated', 'critical', '군주 격퇴 성공', chosenDefeat, challengeRegId, monarchData.id, true, chosenVictoryQuote, `MONARCH DEFEATED TRANSMISSION`)
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
                const tragedyBops = [
                  `💀 참변 발생! [${regName}]의 정예 연합이 군주 [${monarchData.name}] 토벌에 나섰으나 격퇴당했고, 네임드 [${hunter.name}]이(가) 치명상을 입고 퇴각했습니다...`,
                  `🩸 붉은 전장. [${regName}]의 저항선이 군주 [${monarchData.name}]의 군단 앞에 처참히 붕괴되었으며, [${hunter.name}] 헌터가 생사가 불투명한 중상을 입었습니다.`,
                  `🚨 파멸의 낙인! 군주 [${monarchData.name}]의 압도적인 힘 앞에 [${regName}]의 수호단이 몰살당하는 참변이 일어났고, [${hunter.name}] 헌터만 겨우 살아서 탈출했습니다.`,
                  `💥 방어선 잔해... [${regName}]의 헌터들이 군주 [${monarchData.name}]에 맞서 분투했으나 전멸에 가까운 참패를 겪었고, [${hunter.name}] 헌터는 극심한 부상을 지고 복귀했습니다.`,
                  `🩸 심연의 공포. 군주 [${monarchData.name}]의 압도적인 아우라에 헌터들이 제대로 칼도 휘두르지 못하고 도륙당했으며, [${hunter.name}]은(는) 큰 내상을 입었습니다.`
                ]
                const chosenTragedy = tragedyBops[Math.floor(rng() * tragedyBops.length)]
                
                const tragicQuotes = [
                  `"크악... 크흐윽... 이 자의 힘은 차원이 다르다... 후퇴해라! 당장 전원 후퇴!"`,
                  `"안 돼! 방어벽이 모래성처럼 허물어지고 있어... 괴물... 신이시여..."`,
                  `"우린... 처음부터 싸울 상대가 안 되었던 거야... 도망쳐..."`,
                  `"내 칼날이... 닿지도 않아... 크윽! 지원은 없는 건가!"`
                ]
                const chosenTragicQuote = tragicQuotes[Math.floor(rng() * tragicQuotes.length)]
                addEvent('occupied', 'major', '토벌 실패 참변', chosenTragedy, challengeRegId, monarchData.id, true, chosenTragicQuote, `TRAGIC TRANSMISSION INTERCEPTED`)
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
    addEvent('home_reached', 'critical', '거점 침입 (초비상)', `🚨 군주 [${monarchName}]이(가) 거점(대한민국)에 침입하여 강제 결전이 선포되었습니다!`, 'kr', nextHomeReachedMonarchId, true)
  } else {
    // 대한민국 영토가 안전해졌다면 (격퇴 등으로) 플래그를 클리어
    nextHomeReachedMonarchId = undefined
  }

  // ==========================================
  // [기회형 한정 시간 월드 이벤트 생성 롤링]
  // ==========================================
  const playerRank = options.playerRank ?? 'E'
  const playerPower = options.playerPower ?? 300

  // 현재 활성화된 기회 이벤트 개수 세기
  let activeOppCount = 0
  for (const nodeId in nextRiftNodes) {
    if (nextRiftNodes[nodeId].opportunity) {
      activeOppCount++
    }
  }

  // 기회 노드 최대 2개 유지. 개수가 0개이면 100% 스폰, 1개이면 30% 확률로 스폰
  const maxOpp = 2
  const shouldSpawnOpp = activeOppCount === 0 || (activeOppCount < maxOpp && rng() < 0.3)

  if (shouldSpawnOpp) {
    // 스폰 대상 노드 후보 찾기: 군주 점령지가 아니고, loveCall이나 opportunity가 없으며, S급 노드가 아니고, cleared가 아닌 노드
    const oppCandidates = Object.keys(nextRiftNodes).filter(nodeId => {
      const node = nextRiftNodes[nodeId]
      const isOccupied = nextActiveMonarchs.some(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(node.regionId))
      return (
        node &&
        !isOccupied &&
        !node.loveCall?.active &&
        !node.opportunity &&
        !node.isSGrade &&
        node.status !== 'cleared'
      )
    })

    if (oppCandidates.length > 0) {
      const chosenNodeId = oppCandidates[Math.floor(rng() * oppCandidates.length)]
      const node = { ...nextRiftNodes[chosenNodeId] }
      const region = { ...nextRegions[node.regionId] }
      const rName = RIFT_REGIONS.find(r => r.id === node.regionId)?.name ?? node.regionId.toUpperCase()

      // 1. 이벤트 타입 결정: 3종 중 무작위
      const oppTypes: ('rift' | 'merchant' | 'anomaly')[] = ['rift', 'merchant', 'anomaly']
      const chosenType = oppTypes[Math.floor(rng() * oppTypes.length)]

      // 2. 등급 스케일링
      // 플레이어의 현재 랭크 주변 랭크 중 무작위 선택
      const RANKS: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'National']
      const pRankIdx = RANKS.indexOf(playerRank)
      const minIdx = Math.max(0, pRankIdx - 1)
      const maxIdx = Math.min(RANKS.length - 2, pRankIdx + 1) // S급까지만 (National 제외)
      const oppRankIdx = Math.floor(minIdx + rng() * (maxIdx - minIdx + 1))
      const oppRank = RANKS[oppRankIdx]

      // 권장 전투력 스케일링
      const rankCPRange: Record<Rank, [number, number]> = {
        E: [200, 700],
        D: [600, 1500],
        C: [1400, 3200],
        B: [3000, 6000],
        A: [5500, 9500],
        S: [9000, 20000],
        National: [20000, 40000]
      }
      const [rMin, rMax] = rankCPRange[oppRank]
      let oppDifficulty = Math.round(playerPower * (0.85 + rng() * 0.4))
      oppDifficulty = Math.max(rMin, Math.min(rMax, oppDifficulty))

      const daysRemaining = Math.round(3 + rng() * 4) // 3 ~ 6일 시한

      let title = ''
      let description = ''
      let promisedReward: OpportunityReward = {}
      let cost: { gold?: number; shadowEssence?: number } | undefined = undefined
      let loreId: string | undefined = undefined

      if (chosenType === 'rift') {
        const variants = [
          {
            title: `[마기 폭주 균열] ${node.name || '미확인 균열'}`,
            description: `해당 구역의 차원 장막을 뚫고 폭주하는 마기가 극도로 과열되어 솟구칩니다. 날뛰는 마수들로 인해 전투가 극도로 까다롭지만, 평소보다 대량의 정수를 추출할 수 있습니다.`,
            goldMult: 1.4,
            xpMult: 1.4,
            essenceBonus: 2,
          },
          {
            title: `[절대 영도의 서리 균열] ${node.name || '미확인 균열'}`,
            description: `차원 장벽 뒤편의 절대 영도 냉기가 주변 대지를 얼려버렸습니다. 몸이 무거워지고 마력 순환이 정체되지만, 중심부 심층에는 정제된 얼어붙은 귀금속 골드가 풍부하게 응축되어 있습니다.`,
            goldMult: 2.5,
            xpMult: 1.1,
            essenceBonus: 0,
          },
          {
            title: `[부패의 독무 균열] ${node.name || '미확인 균열'}`,
            description: `지독한 맹독과 유기성 산성 안개가 흐르는 늪지형 균열입니다. 호흡기 차단막을 뚫는 침식 기운을 버텨야 하나, 마수의 시체로부터 연금술 촉매로 쓰이는 마력 에센스를 대거 획득합니다.`,
            goldMult: 1.1,
            xpMult: 1.2,
            essenceBonus: 3,
          },
          {
            title: `[왜곡된 시간의 균열] ${node.name || '미확인 균열'}`,
            description: `시간선이 가닥가닥 엉켜 불규칙하게 흐르는 혼돈의 왜곡 지대입니다. 시공의 인과율이 흔들려 변칙적인 공습을 가해오지만, 공략 성공 시 영혼의 격벽이 강화되어 막대한 경험을 선물합니다.`,
            goldMult: 1.2,
            xpMult: 2.6,
            essenceBonus: 1,
          },
          {
            title: `[공허의 침식 균열] ${node.name || '미확인 균열'}`,
            description: `모든 사물의 윤곽을 삼켜버릴 듯한 불길한 어둠이 아지랑이칩니다. 심연의 공허를 마주하는 사투 속에서 헌터들은 무한한 전율을 느끼며, 클리어 시 정수와 경험치를 동시에 대폭 가산받습니다.`,
            goldMult: 1.5,
            xpMult: 1.8,
            essenceBonus: 2,
          },
          {
            title: `[고대 마수 둥지 균열] ${node.name || '미확인 균열'}`,
            description: `인간의 흔적이 닿지 않은 야성적인 고대 용족 계열 마수들의 둥지입니다. 강력한 둥지 군락과 군단원들이 가로막고 있으나, 그들이 둥지 깊은 곳에 쌓아둔 보물상자를 완전히 약탈할 수 있습니다.`,
            goldMult: 2.8,
            xpMult: 1.0,
            essenceBonus: 0,
          }
        ]

        const variant = variants[Math.floor(rng() * variants.length)]
        title = variant.title
        description = variant.description

        const goldReward = Math.round(oppDifficulty * 1.5 * variant.goldMult * (1 + rng() * 0.25))
        const xpReward = Math.round(oppDifficulty * 1.2 * variant.xpMult * (1 + rng() * 0.25))
        const baseEssence = oppRank === 'E' || oppRank === 'D' ? 80 : oppRank === 'C' || oppRank === 'B' ? 150 : 250
        const essenceReward = baseEssence + variant.essenceBonus * 20
 
        promisedReward = {
          gold: goldReward,
          hunterXp: xpReward,
          shadowEssence: essenceReward,
          text: `골드 +${goldReward.toLocaleString()}G, 정수 +${essenceReward}개, 경험치 +${xpReward.toLocaleString()}`
        }
      } else if (chosenType === 'merchant') {
        const variants = [
          {
            title: `[수상한 연금술사] ${rName}의 이동 실험실`,
            description: `음산한 마기가 감도는 보라색 후드를 쓴 연금술사가 정밀 비약을 만들기 위한 에센스 및 재고 거래를 은밀히 제안해 옵니다.`,
            goldCostScale: 3.2,
            essenceRewardScale: 1.0,
            goldRewardScale: 9.0,
            xpRewardScale: 4.2
          },
          {
            title: `[심연의 유물 수집가] ${rName}의 진열대`,
            description: `문명 이전의 심연 유물들을 가공하여 가치를 매기는 유물 학자입니다. 역사적 가치가 깃든 정수와 자금의 긴급 교환을 중재합니다.`,
            goldCostScale: 3.5,
            essenceRewardScale: 1.2,
            goldRewardScale: 10.0,
            xpRewardScale: 3.8
          },
          {
            title: `[그림자 장막의 암거래상] ${rName}의 밀수품`,
            description: `지하 암시장의 통제 구역에서 밀수된 특별 장비와 정수들을 급전이 필요하다는 이유로 거래하는 검은 손의 브로커입니다.`,
            goldCostScale: 3.8,
            essenceRewardScale: 1.1,
            goldRewardScale: 11.5,
            xpRewardScale: 4.0
          },
          {
            title: `[베일 쓴 맹약의 환전상] ${rName}의 금고`,
            description: `가면 뒤에 얼굴을 숨긴 금융 길드의 대리인입니다. 높은 수수료를 물지만 확실한 자금 회전과 그림자 에센스의 상호 환전을 중재합니다.`,
            goldCostScale: 3.0,
            essenceRewardScale: 0.9,
            goldRewardScale: 8.5,
            xpRewardScale: 4.5
          },
          {
            title: `[방랑하는 차원 만물상] ${rName}의 차원 짐마차`,
            description: `차원 왜곡의 틈새를 횡단하며 온갖 기묘한 잡화를 팔고 수집하는 방랑 짐꾼입니다. 마나 비약과 정수 등의 교환 기회를 단기 제공합니다.`,
            goldCostScale: 3.4,
            essenceRewardScale: 1.0,
            goldRewardScale: 9.5,
            xpRewardScale: 4.8
          }
        ]

        const variant = variants[Math.floor(rng() * variants.length)]
        title = variant.title
        description = variant.description

        const merchantOption = rng()
        if (merchantOption < 0.4) {
          // 1. 골드를 소모하여 대량의 그림자 정수 획득
          const baseEss = oppRank === 'E' || oppRank === 'D' ? 90 : oppRank === 'C' || oppRank === 'B' ? 180 : 270
          const essenceReward = Math.round(baseEss * variant.essenceRewardScale)
          const goldCost = Math.round(essenceReward * 15 * (0.3 + variant.goldCostScale * 0.2) * (1 + rng() * 0.2))
          cost = { gold: goldCost }
          promisedReward = {
            shadowEssence: essenceReward,
            text: `[교환] 그림자 정수 +${essenceReward}개 (비용: ${goldCost.toLocaleString()}G)`
          }
        } else if (merchantOption < 0.7) {
          // 2. 그림자 정수를 소모하여 고성능 아이템/장비 보조 골드 획득
          const essenceCost = oppRank === 'E' || oppRank === 'D' ? 40 : oppRank === 'C' || oppRank === 'B' ? 80 : 150
          const goldReward = Math.round(essenceCost * 22 * (0.8 + variant.goldRewardScale * 0.1) * (1 + rng() * 0.2))
          cost = { shadowEssence: essenceCost }
          promisedReward = {
            gold: goldReward,
            text: `[판매] 골드 +${goldReward.toLocaleString()}G (비용: 그림자 정수 ${essenceCost}개)`
          }
        } else {
          // 3. 골드를 지불하여 헌터에게 대량의 비약 경험치 주입
          const goldCost = Math.round(oppDifficulty * 2.0)
          const xpReward = Math.round(oppDifficulty * variant.xpRewardScale)
          cost = { gold: goldCost }
          promisedReward = {
            hunterXp: xpReward,
            text: `[비약 수령] 헌터 경험치 +${xpReward.toLocaleString()} (비용: ${goldCost.toLocaleString()}G)`
          }
        }
      } else {
        // anomaly (탐색형 이상 현상)
        const variants = [
          {
            title: `[고대 마력 기둥 잔해] ${node.name || '잔해 발굴지'}`,
            description: `지상 위로 솟구친 고대의 거대 기둥 잔해에서 방전되는 에너지가 주변 차원을 왜곡하고 있습니다. 해독기를 가동해 정보를 복원하십시오.`,
            lore: `"프로젝트 에테르 보고서: 마수가 죽을 때 남기는 마력 핵은 자연의 열역학 제2법칙을 정면으로 위배한다. 이것은 지구의 에너지 순환 체계가 아닌 다른 우주, 또는 침식하는 군주들의 세계로부터 주입되는 고유의 외래 물질이다."`
          },
          {
            title: `[추락한 마력 철운석] ${node.name || '유성 충돌지'}`,
            description: `대기권을 격파하고 충돌한 정체불명의 금속질 유성체입니다. 운석 균열에서 파란 마나 오라가 지글거립니다. 중화 및 시료 채취를 가동하십시오.`,
            lore: `"격벽 건설 비망록: 차원 장막이 파열되어 건설된 마력 격벽들은 일종의 임시 수문(Sluice Gate)에 불과하다. 심연의 마력 파동 수위가 일정 임계점을 초과하면, 전역 방벽은 연쇄 방손되고 말 것이다. 시간이 얼마 없다."`
          },
          {
            title: `[봉인된 잊힌 제단] ${node.name || '심층 신전'}`,
            description: `오랜 세월 매몰되어 있던 심연의 제단이 마력의 공명으로 모습을 드러냈습니다. 마수들이 공양을 하던 석판의 암호를 해독해 고대 잔류 사념을 추출하십시오.`,
            lore: `"한 퇴역 헌터의 일기: 군주들이라고 자칭하는 아홉 영적 신격들이 세계를 돌며 파멸을 일으킨다. 그들의 학살은 악의가 아닌, 일종의 엄격한 연극(Play)과 같다. 우리는 다음 막이 오르기 전 무대를 쓸고 갈 부속품에 불과한가?"`
          },
          {
            title: `[침몰한 차원 연구소] ${node.name || '연구 지휘소'}`,
            description: `게이트 왜곡으로 지반이 침하하면서 완전히 침식당한 옛 비밀 국가 연구 구역입니다. 중앙 백업 터미널을 복구하고 숨겨진 마력 로그를 획득하십시오.`,
            lore: `"학술 기록물: 각성이 발생할 때 뇌하수체와 척수 마력 배출구의 진동수가 게이트 내부 코어 파동과 정확히 공명함을 확인했다. 각성은 인류를 구원할 진화가 아니라, 게이트에 귀속되도록 설계된 잠재적 전염병(Infection)이다."`
          },
          {
            title: `[균열에 삼켜진 마을 터] ${node.name || '폐허 거점'}`,
            description: `오염 침식이 빠르게 고착화되자 버려진 채 방치된 국경 방어구역 인근의 옛 마을 잔해입니다. 무너진 가옥 속에서 남겨진 기억 보관 큐브를 발굴하십시오.`,
            lore: `"상인의 장부 뒤편 기록: 그림자 정수(Shadow Essence)는 단순한 광물 결정체가 아니다. 그것은 거대 왜곡에 짓눌려 소멸한 생명들의 압축된 잔류 영혼(Soul Residue)이며, 그 힘을 이끌어내기 위해선 끊임없이 소유자의 마력을 연료로 바쳐야 한다."`
          }
        ]

        const variant = variants[Math.floor(rng() * variants.length)]
        title = variant.title
        description = variant.description

        const essenceReward = oppRank === 'E' || oppRank === 'D' ? 50 : oppRank === 'C' || oppRank === 'B' ? 100 : 180
        const goldCost = Math.round(essenceReward * 10)
        cost = { gold: goldCost }
        loreId = `lore-${nextDay}-${Math.floor(rng() * 10000)}`

        const xpReward = Math.round(oppDifficulty * 1.5 * (1 + rng() * 0.2))
 
        promisedReward = {
          shadowEssence: essenceReward,
          hunterXp: xpReward,
          lore: variant.lore,
          text: `[발굴 완수] 정수 +${essenceReward}개, 경험치 +${xpReward.toLocaleString()}, 고대 연구 기록 발굴 (비용: ${goldCost.toLocaleString()}G)`
        }
      }

      node.opportunity = {
        type: chosenType,
        title,
        description,
        promisedReward,
        cost,
        daysRemaining,
        difficultyRank: oppRank,
        loreId
      }

      // 기회 노드는 활성화되어야 함
      node.status = 'active'
      node.daysRemaining = daysRemaining
      node.difficulty = oppDifficulty
      node.difficultyRank = oppRank

      // 해당 지역의 activeGateIds에 추가
      if (!region.activeGateIds.includes(node.id)) {
        region.activeGateIds.push(node.id)
      }

      nextRegions[node.regionId] = region
      nextRiftNodes[node.id] = node

      addLog(`✨ [기회 출현] [${rName}] 구역에 한정 기회 [${title}]이(가) 나타났습니다! (시한 ${daysRemaining}일)`)
      addEvent('gate_open', 'minor', '한정 월드 이벤트 발생', `✨ [${rName}]에 새로운 기회 [${title}]이(가) 출현했습니다.`, node.regionId, undefined, false, undefined, `WORLD OPPORTUNITY DETECTED`)
    }
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
    recentEvents,
    dailySummaries: nextSummaries,
    monarchsSpawnedTotal: nextMonarchsSpawnedTotal
  }
}
