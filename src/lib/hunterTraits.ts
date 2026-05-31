import { createSeededRng } from './game'

export interface HunterTrait {
  id: string
  name: string
  description: string
  weight: number // 배정 가중치 (희귀도)
  riskMod?: number
  deathMod?: number
  growthMod?: number
  winMod?: number
  loveCallMod?: number
  lootMod?: number
  coopMod?: number
  soloWinMod?: number
  soloMod?: number
  varianceMod?: number
  cleanseMod?: number
}

export const HUNTER_TRAITS: HunterTrait[] = [
  {
    id: 'charger',
    name: '돌격대장',
    description: '낮은 승률의 게이트도 물불 가리지 않고 돌격하며, 성장이 빠르지만 패배 시 사망할 위험이 큽니다.',
    weight: 15,
    riskMod: 2.0,
    deathMod: 1.5,
    growthMod: 1.2
  },
  {
    id: 'cautious',
    name: '신중파',
    description: '충분히 높은 승률의 안전한 게이트만 골라 진입하며, 성장은 더디지만 안전을 완벽히 도모합니다.',
    weight: 15,
    riskMod: 0.5,
    deathMod: 0.5,
    growthMod: 0.8
  },
  {
    id: 'unbreakable',
    name: '불굴',
    description: '치명적인 패배 속에서도 강인한 생명력으로 부상에 그치며, 전사할 확률이 대폭 감소합니다.',
    weight: 10,
    deathMod: 0.2
  },
  {
    id: 'prodigy',
    name: '돌풍의 신예',
    description: '잠재력과 재능이 무궁무진하여, 일일 및 전투 훈련을 통한 성장 속도가 폭발적입니다.',
    weight: 8,
    growthMod: 1.8
  },
  {
    id: 'veteran',
    name: '노련한 베테랑',
    description: '오랜 경험으로 축적된 노하우 덕분에 전력 격차를 극복하고 잘 싸우나, 성장은 정체되어 있습니다.',
    weight: 12,
    winMod: 1.2,
    growthMod: 0.8
  },
  {
    id: 'honorbound',
    name: '명예욕',
    description: '명예와 명성을 중시하여 플레이어의 타국 러브콜 원정 지원에 적극적이며, 약간 호전적입니다.',
    weight: 10,
    loveCallMod: 4.0,
    riskMod: 1.3
  },
  {
    id: 'recluse',
    name: '은둔형',
    description: '타인과의 조화를 꺼려 타국의 러브콜을 무시하고 자국만을 지키며, 홀로 묵묵히 성장합니다.',
    weight: 10,
    loveCallMod: 0.05,
    growthMod: 1.1
  },
  {
    id: 'treasure',
    name: '보물 사냥꾼',
    description: '던전 전리품 획득의 직감이 뛰어나, 게이트 클리어 시 높은 확률로 고성능 장비 대박을 낚아챕니다.',
    weight: 6,
    lootMod: 3.0
  },
  {
    id: 'guardian',
    name: '수호자',
    description: '협력 전투 시 동료 및 본체에 강력한 전력 버프를 가미하지만, 고독한 단독 성장은 다소 느립니다.',
    weight: 8,
    coopMod: 1.3,
    soloMod: 0.7,
    growthMod: 0.8
  },
  {
    id: 'berserker',
    name: '광전사',
    description: '극단적인 투지로 전투에 기복을 주어 대박 혹은 쪽박을 유도하며, 위험을 즐깁니다.',
    weight: 8,
    varianceMod: 1.5,
    riskMod: 1.4
  },
  {
    id: 'strategist',
    name: '전략가',
    description: '균열의 메커니즘을 꿰뚫어 보아, 던전을 정화할 때 주변 오염도를 효율적으로 크게 줄집니다.',
    weight: 8,
    cleanseMod: 1.5
  },
  {
    id: 'lonewolf',
    name: '고독한 늑대',
    description: '협력 전투에서는 다소 시너지가 떨어지지만, 오직 홀로 던전을 공략할 때 최강의 전투 효율을 냅니다.',
    weight: 10,
    coopMod: 0.6,
    soloWinMod: 1.25
  }
]

export function getHunterTrait(traitId?: string): HunterTrait | undefined {
  if (!traitId) return undefined
  return HUNTER_TRAITS.find(t => t.id === traitId)
}

/**
 * 가중치 기반으로 헌터 특성을 시드 기반으로 가중 랜덤 배정해 줍니다.
 */
export function rollHunterTrait(rng: () => number): string {
  const totalWeight = HUNTER_TRAITS.reduce((sum, t) => sum + t.weight, 0)
  let roll = rng() * totalWeight
  for (const trait of HUNTER_TRAITS) {
    roll -= trait.weight
    if (roll <= 0) {
      return trait.id
    }
  }
  return HUNTER_TRAITS[0].id
}
