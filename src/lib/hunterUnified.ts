import type { NamedHunter, HunterState, StatKey, JobId, Item, EquipmentState, OwnedJobState } from './types'
import type { BattleUnitBuildResult } from './directBattleTypes'
import { ITEM_POOL } from './seed'
import { getHunterCombatPower } from './combatPower'
import { buildHunterBattleUnit } from './battleUnits'

/**
 * NamedHunter 객체를 플레이어 전용인 HunterState로 맵핑(mock)합니다.
 */
export function convertNamedHunterToHunterState(hunter: NamedHunter): HunterState {
  const level = hunter.level ?? 1
  const stats = hunter.stats ?? { STR: 10, VIT: 10, AGI: 10, INT: 10, PER: 10, SEN: 10 }
  const jobId = hunter.jobId ?? 'novice-hunter'
  
  const ownedJobs: Record<JobId, OwnedJobState> = {
    [jobId]: {
      jobId,
      level: 10, // 스킬 레벨 충족을 위해 10으로 설정
      xp: 0,
      unlockedAt: new Date(0).toISOString(),
      advancedAt: new Date(0).toISOString(),
      masteredAt: new Date(0).toISOString()
    }
  } as Record<JobId, OwnedJobState>

  return {
    name: hunter.name,
    level,
    xp: 0,
    totalXp: 0,
    renown: 0,
    rank: hunter.rank,
    job: 'Warrior', // legacy display
    jobId,
    unlockedJobIds: [jobId],
    stats,
    freeStatPoints: 0,
    streak: 0,
    categoryProgress: {
      workout: 0, study: 0, career: 0, health: 0, mind: 0, finance: 0, social: 0, challenge: 0, habit: 0
    },
    ownedTitleIds: hunter.titleId ? [hunter.titleId] : [],
    equippedTitleId: hunter.titleId,
    activeJobId: jobId,
    jobs: ownedJobs
  }
}

/**
 * 헌터의 기본 장비/스탯/칭호 정보를 바탕으로 플레이어와 100% 동일한 통일 전투력을 산출합니다.
 * 그림자는 동참하지 않으므로 equippedShadows = []로 배제합니다.
 */
export function getNamedHunterBasePower(hunter: NamedHunter): number {
  if (!hunter.stats || !hunter.level || !hunter.jobId) {
    // 하위 호환 폴백: 확장 필드가 없으면 기존 power 필드값을 그대로 기본 파워로 사용
    return hunter.power
  }

  const hunterState = convertNamedHunterToHunterState(hunter)
  
  const items: Item[] = []
  const baseEquipmentItemIds = hunter.baseEquipmentItemIds ?? []
  
  baseEquipmentItemIds.forEach((itemId, idx) => {
    const def = ITEM_POOL.find(i => (i as any).id === itemId || i.name === itemId)
    items.push({
      id: `npc-equip-${hunter.id}-${idx}`,
      name: def?.name ?? itemId,
      icon: def?.icon ?? '⚔️',
      rarity: def?.rarity ?? 'common',
      description: def?.description ?? '기본 장비',
      acquiredAt: new Date(0).toISOString(),
      equippable: true,
      slot: def?.slot ?? 'weapon',
      effects: def?.effects ?? [],
      equipmentStars: 3,
      enhancementLevel: 3,
      combatSkillIds: def?.combatSkillIds ?? []
    })
  })

  const equipment: EquipmentState = {}
  items.forEach(item => {
    if (item.slot) {
      equipment[item.slot as keyof EquipmentState] = item.id
    }
  })

  const power = getHunterCombatPower({
    hunter: hunterState,
    items,
    equipment,
    ownedShadows: [],
    equippedShadowIds: [],
    activeConsumableEffects: []
  })

  return power
}

/**
 * buildHunterBattleUnit을 재사용하여 헌터의 스탯/장비/스킬셋을 기반으로 BattleUnit을 빌드합니다.
 */
export function buildNpcHunterBattleUnit(hunter: NamedHunter, options: any = {}): BattleUnitBuildResult {
  const hunterState = convertNamedHunterToHunterState(hunter)
  
  const items: Item[] = []
  const baseEquipmentItemIds = hunter.baseEquipmentItemIds ?? []
  
  baseEquipmentItemIds.forEach((itemId, idx) => {
    const def = ITEM_POOL.find(i => (i as any).id === itemId || i.name === itemId)
    items.push({
      id: `npc-equip-${hunter.id}-${idx}`,
      name: def?.name ?? itemId,
      icon: def?.icon ?? '⚔️',
      rarity: def?.rarity ?? 'common',
      description: def?.description ?? '기본 장비',
      acquiredAt: new Date(0).toISOString(),
      equippable: true,
      slot: def?.slot ?? 'weapon',
      effects: def?.effects ?? [],
      equipmentStars: 3,
      enhancementLevel: 3,
      combatSkillIds: def?.combatSkillIds ?? []
    })
  })

  const equipment: EquipmentState = {}
  items.forEach(item => {
    if (item.slot) {
      equipment[item.slot as keyof EquipmentState] = item.id
    }
  })

  const skillStates: Record<string, any> = {}
  if (hunter.skillIds) {
    hunter.skillIds.forEach(skillId => {
      skillStates[skillId] = {
        skillId,
        masteryLevel: 1,
        masteryXp: 0,
        timesUsed: 0,
        isCapstoneUnlocked: false
      }
    })
  }

  return buildHunterBattleUnit(hunterState, {
    items,
    equipment,
    skillStates,
    unitId: `hunter-npc-${hunter.id}`,
    ...options
  })
}
