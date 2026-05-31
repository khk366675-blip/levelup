import { createSeededRng } from './game'

export interface NPCEquipmentItem {
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  slot: 'weapon' | 'armor' | 'accessory'
}

export const NPC_WEAPONS: Record<string, string[]> = {
  common: [
    '수련용 목검',
    '낡은 철단검',
    '연습용 나무활',
    '헌터용 강철도',
    '철제 장창',
    '초심자의 지팡이',
    '구리 수리검',
    '투박한 철퇴'
  ],
  rare: [
    '빛바랜 은검',
    '바람의 속삭임 활',
    '룬 마력 지팡이',
    '대지의 진동 망치',
    '냉기의 강철 창',
    '암살자의 그림자 단검',
    '수호자의 은빛 방패검',
    '정밀한 마도 권총'
  ],
  epic: [
    '그림자 살수 단검',
    '용의 파괴용 대검',
    '폭풍의 눈 장궁',
    '칠흑의 마왕 지팡이',
    '성염의 심판 장창',
    '차원 균열의 인도자',
    '혈풍의 학살 도끼',
    '정화의 빛 마법봉'
  ],
  legendary: [
    '군주의 검 (아스카론)',
    '황혼의 파멸 대검',
    '신궁 (태양의 파편)',
    '심연의 묵시록 지팡이',
    '성창 (롱기누스)',
    '절대자의 봉인검',
    '신성한 불꽃의 바스타드 소드',
    '용제의 이빨 단도'
  ]
}

export const NPC_ARMORS: Record<string, string[]> = {
  common: [
    '훈련용 가죽 가슴보호대',
    '천 재질 후드 겉옷',
    '낡은 사슬 흉갑',
    '보통 헌터 정복',
    '가죽 손목보호대',
    '무딘 강철 투구'
  ],
  rare: [
    '강철 판금 흉갑',
    '야간 위장용 바람 망토',
    '루트 가죽 부츠',
    '은장식 정찰용 가벼운 경갑',
    '바람의 신발',
    '그림자 로브'
  ],
  epic: [
    '수호자의 마력 중갑',
    '용비늘 무늬 코트',
    '계율의 정제 로브',
    '그림자 가죽 망토',
    '기사의 신념 판금 투구',
    '강철 요새의 무거운 건틀릿'
  ],
  legendary: [
    '그림자 군단의 왕관',
    '신성한 아다만티움 전신 갑옷',
    '지고의 심판자 성의 로브',
    '용제의 영혼이 깃든 견갑',
    '차원의 장막 외투',
    '불사조의 깃털 투구'
  ]
}

export const NPC_ACCESSORIES: Record<string, string[]> = {
  common: [
    '구리 반지',
    '동 목걸이',
    '빛바랜 원석 귀걸이',
    '소박한 가죽 가방',
    '행운의 부적 목걸이'
  ],
  rare: [
    '의지의 목걸이',
    '지능의 현자 장식',
    '바람의 수호 팔찌',
    '집중의 마나 반지',
    '고요의 귀걸이'
  ],
  epic: [
    '혈염의 마석 반지',
    '시간의 모래시계 목걸이',
    '차원 공명 팔찌',
    '바람의 영혼 목걸이',
    '치명적인 송곳니 반지'
  ],
  legendary: [
    '용의 눈동자 마력 반지',
    '불사조의 불타는 깃털 브로치',
    '성황의 면류관 목걸이',
    '차원 여행자의 나침반',
    '심연의 마력 구체 펜던트'
  ]
}

/**
 * 헌터의 장비 점수 구간에 따라 활성화할 슬롯과 그 슬롯에 매핑할 등급을 결정합니다.
 */
export function getNPCEquipmentForScore(score: number, rngSeed: number): NPCEquipmentItem[] {
  const rng = createSeededRng(rngSeed)
  
  const pick = (pool: string[]): string => {
    return pool[Math.floor(rng() * pool.length)]
  }

  const items: NPCEquipmentItem[] = []

  // 1. 무기 (Weapon) 슬롯 매핑
  if (score >= 4000) {
    items.push({ name: pick(NPC_WEAPONS.legendary), rarity: 'legendary', slot: 'weapon' })
  } else if (score >= 1500) {
    items.push({ name: pick(NPC_WEAPONS.epic), rarity: 'epic', slot: 'weapon' })
  } else if (score >= 350) {
    items.push({ name: pick(NPC_WEAPONS.rare), rarity: 'rare', slot: 'weapon' })
  } else {
    items.push({ name: pick(NPC_WEAPONS.common), rarity: 'common', slot: 'weapon' })
  }

  // 2. 방어구 (Armor) 슬롯 매핑 (score 100 이상부터 해금)
  if (score >= 100) {
    if (score >= 6000) {
      items.push({ name: pick(NPC_ARMORS.legendary), rarity: 'legendary', slot: 'armor' })
    } else if (score >= 2500) {
      items.push({ name: pick(NPC_ARMORS.epic), rarity: 'epic', slot: 'armor' })
    } else if (score >= 700) {
      items.push({ name: pick(NPC_ARMORS.rare), rarity: 'rare', slot: 'armor' })
    } else {
      items.push({ name: pick(NPC_ARMORS.common), rarity: 'common', slot: 'armor' })
    }
  }

  // 3. 장신구 (Accessory) 슬롯 매핑 (score 350 이상부터 해금)
  if (score >= 350) {
    if (score >= 8000) {
      items.push({ name: pick(NPC_ACCESSORIES.legendary), rarity: 'legendary', slot: 'accessory' })
    } else if (score >= 3500) {
      items.push({ name: pick(NPC_ACCESSORIES.epic), rarity: 'epic', slot: 'accessory' })
    } else if (score >= 1200) {
      items.push({ name: pick(NPC_ACCESSORIES.rare), rarity: 'rare', slot: 'accessory' })
    } else {
      items.push({ name: pick(NPC_ACCESSORIES.common), rarity: 'common', slot: 'accessory' })
    }
  }

  return items
}
