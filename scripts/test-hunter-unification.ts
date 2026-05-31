import { initLivingWorld } from '../src/lib/livingWorld'
import { getNamedHunterBasePower, buildNpcHunterBattleUnit, convertNamedHunterToHunterState } from '../src/lib/hunterUnified'
import { getHunterCombatPower } from '../src/lib/combatPower'
import { buildHunterBattleUnit } from '../src/lib/battleUnits'
import { ITEM_POOL } from '../src/lib/seed'
import type { Item, EquipmentState } from '../src/lib/types'

function runTest() {
  console.log('=== Starting Hunter Unification Test ===')

  // 1. 시뮬레이션 상태 초기화 및 네임드 헌터 데이터 추출
  const state = initLivingWorld(12345)
  const lee = state.namedHunters['hunter-kr-2'] // 이진성
  const thomas = state.namedHunters['hunter-us-1'] // 토마스 안드레

  if (!lee || !thomas) {
    console.error('Error: Could not find named hunters in initial state.')
    process.exit(1)
  }

  console.log('\n[Loaded NPC Hunters from Simulation]')
  console.log(`- Lee Jin-sung (S-rank KR): level ${lee.level}, Job: ${lee.jobId}, Stats: ${JSON.stringify(lee.stats)}`)
  console.log(`- Thomas Andre (National US): level ${thomas.level}, Job: ${thomas.jobId}, Stats: ${JSON.stringify(thomas.stats)}`)

  // 2. 통일 전투력 산출
  const leePower = getNamedHunterBasePower(lee)
  const thomasPower = getNamedHunterBasePower(thomas)

  console.log('\n[Calculated Unified Combat Power]')
  console.log(`- Lee Jin-sung Unified Power: ${leePower} (Initial .power field: ${lee.power})`)
  console.log(`- Thomas Andre Unified Power: ${thomasPower} (Initial .power field: ${thomas.power})`)

  // 3. 플레이어 공식과의 100% 동일성 검증
  // 플레이어 형식으로 동일 조건 설정 후 getHunterCombatPower 직접 실행해 비교
  function verifyPowerEquivalence(hunter: any): boolean {
    const hunterState = convertNamedHunterToHunterState(hunter)
    const items: Item[] = []
    const baseEquipmentItemIds = hunter.baseEquipmentItemIds ?? []

    baseEquipmentItemIds.forEach((itemId: string, idx: number) => {
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

    const playerPower = getHunterCombatPower({
      hunter: hunterState,
      items,
      equipment,
      ownedShadows: [],
      equippedShadowIds: [],
      activeConsumableEffects: []
    })

    const npcUnifiedPower = getNamedHunterBasePower(hunter)
    console.log(`- Comparison for ${hunter.name}: Player Formula Power = ${playerPower}, NPC Unified Power = ${npcUnifiedPower}`)
    return playerPower === npcUnifiedPower
  }

  const leeOk = verifyPowerEquivalence(lee)
  const thomasOk = verifyPowerEquivalence(thomas)

  if (leeOk && thomasOk) {
    console.log('✅ PASS: NamedHunter unified combat power matches Player combat power formula 1:1!')
  } else {
    console.error('❌ FAIL: NamedHunter unified combat power mismatch!')
  }

  // 4. buildNpcHunterBattleUnit 동작 검증
  console.log('\n[Verifying BattleUnit Build Output]')
  const leeUnit = buildNpcHunterBattleUnit(lee)
  const thomasUnit = buildNpcHunterBattleUnit(thomas)

  console.log(`- Lee Jin-sung BattleUnit stats: HP = ${leeUnit.unit.stats.maxHp}, ATK = ${leeUnit.unit.stats.atk}, DEF = ${leeUnit.unit.stats.def}`)
  console.log(`- Thomas Andre BattleUnit stats: HP = ${thomasUnit.unit.stats.maxHp}, ATK = ${thomasUnit.unit.stats.atk}, DEF = ${thomasUnit.unit.stats.def}`)

  // 플레이어용 buildHunterBattleUnit과 직접 대조
  const leeState = convertNamedHunterToHunterState(lee)
  const leeItems: Item[] = []
  lee.baseEquipmentItemIds?.forEach((itemId: string, idx: number) => {
    const def = ITEM_POOL.find(i => (i as any).id === itemId || i.name === itemId)
    leeItems.push({
      id: `npc-equip-${lee.id}-${idx}`,
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
  const leeEquip: EquipmentState = {}
  leeItems.forEach(item => {
    if (item.slot) {
      leeEquip[item.slot as keyof EquipmentState] = item.id
    }
  })
  const leeSkillStates: Record<string, any> = {}
  lee.skillIds?.forEach((skillId: string) => {
    leeSkillStates[skillId] = {
      skillId,
      masteryLevel: 1,
      masteryXp: 0,
      timesUsed: 0,
      isCapstoneUnlocked: false
    }
  })

  const leePlayerUnit = buildHunterBattleUnit(leeState, {
    items: leeItems,
    equipment: leeEquip,
    skillStates: leeSkillStates,
    unitId: `hunter-npc-${lee.id}`
  })

  const battleUnitOk = (
    leeUnit.unit.stats.maxHp === leePlayerUnit.unit.stats.maxHp &&
    leeUnit.unit.stats.atk === leePlayerUnit.unit.stats.atk &&
    leeUnit.unit.stats.def === leePlayerUnit.unit.stats.def
  )

  if (battleUnitOk) {
    console.log('✅ PASS: buildNpcHunterBattleUnit produces the exact same HP/ATK/DEF stats as buildHunterBattleUnit!')
  } else {
    console.error('❌ FAIL: BattleUnit stats mismatch!')
  }
}

runTest()
