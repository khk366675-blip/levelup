import { todayISO, todayKey } from './game'
import { ITEM_POOL } from './seed'
import { SHADOW_DEFINITIONS, createOwnedShadow } from './shadows'
import type {
  OwnedShadow,
  Item,
  EquipmentSlot,
  ShadowInnateGrade,
  SkillRuntimeState,
  SystemMessage,
  ActiveMonarch,
  LivingWorldState
} from './types'
import { initLivingWorld } from './livingWorld'

// TEMP DEV CHEAT: Rollback keys and configurations
// 나중에 grep DEV_CHEAT 로 쉽게 삭제/복원 가능
export const DEV_CHEAT_STORAGE_KEY = 'levelup-save'
export const DEV_CHEAT_BACKUP_KEY = 'levelup-save-dev-cheat-backup'
export const CURRENT_PERSIST_VERSION = 14

/**
 * 1단계: 현재 브라우저의 저장된 세이브값을 백업합니다. (치트 적용 직전 백업 생성)
 */
export function backupDevCheatSave(state: any): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const rawSave = window.localStorage.getItem(DEV_CHEAT_STORAGE_KEY)
    if (rawSave) {
      window.localStorage.setItem(DEV_CHEAT_BACKUP_KEY, rawSave)
      return true
    }
    
    // 로컬 스토리지에 값이 없으면 인메모리 상태를 직렬화하여 저장
    const { manualBattleSession: _manual, ...persistedState } = state
    window.localStorage.setItem(
      DEV_CHEAT_BACKUP_KEY,
      JSON.stringify({ state: persistedState, version: CURRENT_PERSIST_VERSION })
    )
    return true
  } catch (error) {
    console.error('[DEV_CHEAT] Backup failed', error)
    return false
  }
}

/**
 * 2단계: 백업된 상태에서 원래 상태로 복원합니다.
 */
export function restoreDevCheatSave(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const backup = window.localStorage.getItem(DEV_CHEAT_BACKUP_KEY)
    if (!backup) return false
    
    window.localStorage.setItem(DEV_CHEAT_STORAGE_KEY, backup)
    window.location.reload()
    return true
  } catch (error) {
    console.error('[DEV_CHEAT] Restore failed', error)
    return false
  }
}

/**
 * 3단계: 백업 데이터를 삭제합니다.
 */
export function clearDevCheatBackup(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    window.localStorage.removeItem(DEV_CHEAT_BACKUP_KEY)
    return true
  } catch (error) {
    console.error('[DEV_CHEAT] Clear backup failed', error)
    return false
  }
}

/**
 * 4단계: 치트 프로필 적용 핵심 로직
 */
export function applyDevCheatProfile(profileId: 'monarchTestReady' | 'angelTestReady', state: any): any {
  if (!import.meta.env.DEV) {
    console.error('[DEV_CHEAT] Cheat actions can only be executed in development mode!')
    return state
  }

  // 1. 기존 백업이 없을 때만 치트 적용 전 상태 백업
  if (typeof window !== 'undefined' && !window.localStorage.getItem(DEV_CHEAT_BACKUP_KEY)) {
    backupDevCheatSave(state)
  }

  // RNG 생성기 (그림자 및 아이템 속성 롤링용)
  const makeRng = (seed: number) => {
    let nextSeed = seed
    return () => {
      const value = Math.sin(nextSeed++) * 10000
      return value - Math.floor(value)
    }
  }
  const rng = makeRng(888)

  // 2. 플레이어 사양 강화 (Monarch / Angel)
  const isAngel = profileId === 'angelTestReady'
  const targetLevel = isAngel ? 120 : 100
  const targetStat = isAngel ? 600 : 350

  const originalHunter = state.hunter || {}
  
  // 직업 및 직업 정보 세팅
  const targetJobId = 'shadow-lord'
  const unlockedJobs = originalHunter.unlockedJobIds || []
  const nextUnlockedJobIds = Array.from(new Set([
    ...unlockedJobs,
    'shadow-lord',
    'novice-hunter',
    'swordsman',
    'warrior',
    'mage',
    'guardian',
    'scout',
    'tactician'
  ]))

  const originalJobs = originalHunter.jobs || {}
  const nextJobs = { ...originalJobs }
  nextUnlockedJobIds.forEach((jobId) => {
    if (!nextJobs[jobId]) {
      nextJobs[jobId] = {
        jobId,
        level: 10,
        xp: 0,
        unlockedAt: todayISO(),
        advancedAt: todayISO(),
        masteredAt: todayISO()
      }
    } else {
      nextJobs[jobId] = {
        ...nextJobs[jobId],
        level: Math.max(nextJobs[jobId].level || 1, 10)
      }
    }
  })

  // 스탯 객체 빌드
  const nextStats = {
    STR: targetStat,
    VIT: targetStat,
    AGI: targetStat,
    INT: targetStat,
    PER: targetStat,
    SEN: targetStat
  }

  // 칭호 목록 추가
  const originalTitles = originalHunter.ownedTitleIds || []
  const nextOwnedTitleIds = Array.from(new Set([
    ...originalTitles,
    'first-awakening',
    'hunter',
    'veteran-hunter',
    'legend-in-hand',
    'ruler-of-dawn',
    'dopamine-hunter'
  ]))

  const updatedHunter = {
    ...originalHunter,
    level: targetLevel,
    xp: 0,
    totalXp: 9999999,
    rank: isAngel ? 'National' : 'S',
    jobId: targetJobId,
    activeJobId: targetJobId,
    unlockedJobIds: nextUnlockedJobIds,
    jobs: nextJobs,
    stats: nextStats,
    freeStatPoints: 0,
    ownedTitleIds: nextOwnedTitleIds,
    equippedTitleId: 'legend-in-hand'
  }

  // 3. 재화 지급
  const nextGold = 10000000 // 1천만 골드
  const nextShadowEssence = 50000 // 5만 정수

  // 4. 프리미엄 장비 지급 및 장착
  // seed ITEM_POOL에서 4개 전설 장비 검색 및 인스턴스화
  const weaponDef = ITEM_POOL.find((i) => i.name === '왕의 검' && i.slot === 'weapon')
  const armorDef = ITEM_POOL.find((i) => i.name === '그림자 왕관' && i.slot === 'armor')
  const accessoryDef = ITEM_POOL.find((i) => i.name === '시간의 회중시계' && i.slot === 'accessory')
  const artifactDef = ITEM_POOL.find((i) => i.name === '시스템의 조각' && i.slot === 'artifact')

  const devWeapon: Item = {
    id: 'dev-legendary-weapon',
    name: weaponDef?.name || '왕의 검',
    icon: weaponDef?.icon || '⚔️',
    rarity: 'legendary',
    description: weaponDef?.description || '개발용 전설 무기',
    acquiredAt: todayISO(),
    equippable: true,
    slot: 'weapon',
    effects: weaponDef?.effects || [{ type: 'xp_bonus', category: 'career', value: 0.08 }],
    equipmentStars: 5,
    enhancementLevel: 5,
    combatSkillIds: weaponDef?.combatSkillIds || ['equip-kings-command']
  }

  const devArmor: Item = {
    id: 'dev-legendary-armor',
    name: armorDef?.name || '그림자 왕관',
    icon: armorDef?.icon || '👑',
    rarity: 'legendary',
    description: armorDef?.description || '개발용 전설 방어구',
    acquiredAt: todayISO(),
    equippable: true,
    slot: 'armor',
    effects: armorDef?.effects || [{ type: 'drop_bonus', value: 0.02 }],
    equipmentStars: 5,
    enhancementLevel: 5
  }

  const devAccessory: Item = {
    id: 'dev-legendary-accessory',
    name: accessoryDef?.name || '시간의 회중시계',
    icon: accessoryDef?.icon || '⏱️',
    rarity: 'legendary',
    description: accessoryDef?.description || '개발용 전설 장신구',
    acquiredAt: todayISO(),
    equippable: true,
    slot: 'accessory',
    effects: accessoryDef?.effects || [{ type: 'stat_bonus', stat: 'PER', value: 3 }],
    equipmentStars: 5,
    enhancementLevel: 5
  }

  const devArtifact: Item = {
    id: 'dev-legendary-artifact',
    name: artifactDef?.name || '시스템의 조각',
    icon: artifactDef?.icon || '🔮',
    rarity: 'legendary',
    description: artifactDef?.description || '개발용 전설 유물',
    acquiredAt: todayISO(),
    equippable: true,
    slot: 'artifact',
    effects: artifactDef?.effects || [{ type: 'rarity_bonus', value: 0.02 }],
    equipmentStars: 5,
    enhancementLevel: 5,
    combatSkillIds: artifactDef?.combatSkillIds || ['equip-system-pulse']
  }

  // 기존 dev 아이템 및 장비 필터링 제거 후 추가
  const originalItems = state.items || []
  const filteredItems = originalItems.filter((i: Item) => !i.id.startsWith('dev-legendary-'))
  const nextItems = [...filteredItems, devWeapon, devArmor, devAccessory, devArtifact]

  const nextEquipment = {
    ...state.equipment,
    weapon: 'dev-legendary-weapon',
    armor: 'dev-legendary-armor',
    accessory: 'dev-legendary-accessory',
    artifact: 'dev-legendary-artifact'
  }

  // 5. 그림자 군단 주입 및 고벨류화
  const SHADOW_DEV_IDS = [
    'ner-first-rift',
    'rook-backstreet',
    'lark-nest-fang',
    'gorn-sloth-captain',
    'shark-black-chaser',
    'karden-forgetting-scribe',
    'organ-fatigue-shield',
    'raban-rift-instructor',
    'grid-greed-hound',
    'kasim-analyst',
    'rao-market-watcher',
    'charka-finance-patron',
    'volen-strategist',
    'verk-steel-knight',
    'raven-running-shadow',
    'moro-restraint-chef',
    'nok-sleep-keeper',
    'baron-cutting-watcher',
    'irnel-registrar',
    'kalt-deadline-executor',
    'seron-saver',
    'lumen-dawn-vanguard'
  ]

  const shadowLevel = isAngel ? 95 : 80
  const devShadows: OwnedShadow[] = []

  SHADOW_DEV_IDS.forEach((defId) => {
    const definition = SHADOW_DEFINITIONS.find((def) => def.id === defId)
    if (definition) {
      const baseShadow = createOwnedShadow(definition, rng, { innateGrade: 'S' })
      devShadows.push({
        ...baseShadow,
        instanceId: `dev-shadow-${definition.id}`,
        level: shadowLevel,
        xp: 0,
        innateGrade: 'S',
        rank: definition.rank || 'named',
        rarity: 'legendary',
        isFavorite: true,
        evolutionStage: 2,
        enhancementLevel: 5,
        absorbedCount: 5
      })
    }
  })

  // 기존 dev 그림자 제거 및 합체
  const originalShadows = state.ownedShadows || []
  const filteredShadows = originalShadows.filter((s: OwnedShadow) => !s.instanceId.startsWith('dev-shadow-'))
  const nextOwnedShadows = [...filteredShadows, ...devShadows]

  // 상위 5명 자동 출전
  const nextEquippedShadowIds = [
    'dev-shadow-ner-first-rift',
    'dev-shadow-rook-backstreet',
    'dev-shadow-lark-nest-fang',
    'dev-shadow-gorn-sloth-captain',
    'dev-shadow-shark-black-chaser'
  ]

  // 6. 플레이어 스킬 고레벨화
  const originalSkillStates = state.skillStates || {}
  const nextSkillStates = { ...originalSkillStates }
  
  const skillIdsToBoost = [
    'basic-attack',
    'basic-focus-slash',
    'basic-guard-stance',
    'equip-kings-command',
    'equip-system-pulse',
    'equip-shadow-slash',
    'equip-black-suit-guard'
  ]

  skillIdsToBoost.forEach((id) => {
    nextSkillStates[id] = {
      skillId: id,
      masteryLevel: 10,
      masteryXp: 0,
      timesUsed: 100,
      isCapstoneUnlocked: true
    }
  })

  // 7. Living Rift World 상태 설정 보정
  let nextLivingWorld: LivingWorldState
  const originalLW = state.livingWorld

  if (originalLW) {
    nextLivingWorld = { ...originalLW }
  } else {
    // 만약 월드가 없으면 강제 초기화
    nextLivingWorld = initLivingWorld(888)
  }

  // 군단 노드 및 군주 리스트 빌드
  const monarchIds = ['grellic', 'celaide', 'igris', 'dorga', 'mirage', 'pesta', 'belatus', 'nox']
  const monarchRegions = ['cn', 'jp', 'us', 'de', 'fr', 'uk', 'ru', 'us']

  if (isAngel) {
    // Angel Ready 세팅: 8군주 모두 퇴치(defeated) 처리 및 angelReady 활성화
    const activeMonarchs: ActiveMonarch[] = monarchIds.map((mid, idx) => ({
      monarchId: mid,
      rank: 8 - idx,
      occupiedRegionIds: [monarchRegions[idx]],
      appearedDay: idx + 1,
      status: 'defeated' as const,
      lastExpandDay: idx + 1
    }))

    nextLivingWorld.activeMonarchs = activeMonarchs
    nextLivingWorld.angelReady = true
    nextLivingWorld.monarchsAppeared = 8
    nextLivingWorld.worldCorruption = 0
    
    // 사건 로그 추가
    nextLivingWorld.eventLogs = [
      ...(nextLivingWorld.eventLogs || []),
      `[DEV_CHEAT] 지고의 심판자(천사) 검증용 강제 해금 완료`
    ]
  } else {
    // Monarch Ready 세팅: 8군주 모두 활성(rampaging) 배치
    const activeMonarchs: ActiveMonarch[] = monarchIds.map((mid, idx) => ({
      monarchId: mid,
      rank: 8 - idx,
      occupiedRegionIds: [monarchRegions[idx]],
      appearedDay: idx + 1,
      status: 'rampaging' as const,
      lastExpandDay: idx + 1
    }))

    nextLivingWorld.activeMonarchs = activeMonarchs
    nextLivingWorld.angelReady = false
    nextLivingWorld.monarchsAppeared = 8
    nextLivingWorld.worldCorruption = 45
    
    // 사건 로그 추가
    nextLivingWorld.eventLogs = [
      ...(nextLivingWorld.eventLogs || []),
      `[DEV_CHEAT] 8명의 군단 침공 강제 활성화 완료`
    ]
  }

  // 8. 시스템 메시지 생성
  const nextMessages: SystemMessage[] = [
    ...(state.messages || []),
    {
      id: `dev-cheat-msg-${Date.now()}`,
      kind: 'info',
      title: isAngel ? 'DEV: Angel 검증 모드 적용' : 'DEV: Monarch 검증 모드 적용',
      lines: [
        `[TEMP DEV CHEAT] 검증 프로필이 무사히 주입되었습니다.`,
        `- 플레이어 레벨: Lv.${targetLevel} S/National 등급 (스탯 ${targetStat})`,
        `- 장비: 5성 +5강 legendary 전설 세트 자동 장착`,
        `- 그림자: 22명의 태생 S급 Lv.${shadowLevel} 전설 그림자 군단 지원`,
        `- 재화: 10,000,000 Gold / 50,000 Shadow Essence 지급`,
        `- 월드맵: ${isAngel ? '지고의 심판자(천사) 결전 노드 개방' : '8명의 군주 정화 전선 노출'}`
      ],
      createdAt: todayISO()
    }
  ]

  return {
    ...state,
    hunter: updatedHunter,
    gold: nextGold,
    shadowEssence: nextShadowEssence,
    items: nextItems,
    equipment: nextEquipment,
    ownedShadows: nextOwnedShadows,
    equippedShadowIds: nextEquippedShadowIds,
    skillStates: nextSkillStates,
    livingWorld: nextLivingWorld,
    messages: nextMessages
  }
}
