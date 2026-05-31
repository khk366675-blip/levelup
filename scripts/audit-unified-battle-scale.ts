const mockStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

(globalThis as any).window = {
  localStorage: mockStorage,
  sessionStorage: mockStorage,
  location: {
    reload: () => {},
  }
};
(globalThis as any).localStorage = mockStorage;

// 동적 임포트
const { useGame } = await import('../src/lib/store')
const { buildHunterBattleUnit, buildShadowBattleUnit, buildMonsterBattleUnit } = await import('../src/lib/battleUnits')
const { getShadowDefinition } = await import('../src/lib/shadows')
const { MONARCHS, FINAL_ANGEL, buildMonarchBattleUnit } = await import('../src/lib/monarchs')
const { applyDevCheatProfile } = await import('../src/lib/devCheats')
const { getMockDirectBattleMonster } = await import('../src/lib/directBattleMonsters')
const { initLivingWorld } = await import('../src/lib/livingWorld')
const { getHunterTrait } = await import('../src/lib/hunterTraits')
const { createDirectBattleState, executeDirectBattleRound, runMockDirectBattle, chooseMockPlayerActions } = await import('../src/lib/directBattleRuntime')
const { ITEM_POOL } = await import('../src/lib/seed')

// basic attack definition
const mockBasicAttackAction = {
  actionId: 'basic-attack',
  label: '기본 공격',
  actionType: 'basic',
  targetType: 'single_enemy',
  effectKind: 'basic',
  basePriority: 0,
  cooldown: 0,
  actionCue: 'basic',
  animationCue: 'basic',
  effectColor: 'zinc',
  masteryMultiplier: 1,
  critRateBonus: 0,
  bossDamageBonus: 0,
  defenseIgnore: 0,
}

// computeExpectedDamage
function computeExpectedDamage(actor: any, target: any) {
  const getAttackMultiplier = (unit: any): number => {
    const getStatusValue = (u: any, type: string): number => {
      return u.statusEffects
        ? u.statusEffects
            .filter((status: any) => status.type === type && status.durationRounds > 0)
            .reduce((max: number, status: any) => Math.max(max, status.effectValue), 0)
        : 0
    }
    return Math.max(
      0.35,
      1 +
        getStatusValue(unit, 'attackUp') -
        Math.min(0.35, getStatusValue(unit, 'attackDown')) -
        Math.min(0.3, getStatusValue(unit, 'suppression')),
    )
  }

  const getDefenseValue = (unit: any): number => {
    const getStatusValue = (u: any, type: string): number => {
      return u.statusEffects
        ? u.statusEffects
            .filter((status: any) => status.type === type && status.durationRounds > 0)
            .reduce((max: number, status: any) => Math.max(max, status.effectValue), 0)
        : 0
    }
    return unit.stats.def * (1 - Math.min(0.5, getStatusValue(unit, 'defenseDown')))
  }

  const getDamageBonus = (t: any): number => {
    const hasStatus = (u: any, type: string): boolean => {
      return u.statusEffects ? u.statusEffects.some((status: any) => status.type === type && status.durationRounds > 0) : false
    }
    return hasStatus(t, 'mark') || hasStatus(t, 'weakness') ? 1.12 : 1
  }

  const actorAttack = actor.stats.atk * 1.08;
  const rawPower = actorAttack;
  
  const defense = getDefenseValue(target);
  const defenseAnchor = 250;
  const defenseReduction = defense / (defense + defenseAnchor + rawPower * 0.42);
  
  const skillMultiplier = 1;
  const targetSpreadMultiplier = 1;
  
  const minimumDamage = Math.max(3, actor.level * 0.75, rawPower * 0.14);
  return Math.round(Math.max(
    minimumDamage,
    rawPower * (1 - defenseReduction) * skillMultiplier * targetSpreadMultiplier * getAttackMultiplier(actor) * getDamageBonus(target),
  ));
}

// getActiveRegionPower 복제 (livingWorldTick.ts 내부 구현 참고)
function getActiveRegionPowerLocal(region: any, namedHunters: Record<string, any>): number {
  let namedPower = 0
  const activeNamedCount = region.namedHunterIds.filter((id: string) => namedHunters[id]?.status === 'active').length

  for (const hunterId of region.namedHunterIds) {
    const hunter = namedHunters[hunterId]
    if (hunter && hunter.status === 'active') {
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
      namedPower += p
    }
  }

  const pool = region.pool
  const poolPower =
    (pool.countA * pool.avgPowerA +
     pool.countB * pool.avgPowerB +
     pool.countC * pool.avgPowerC) * 0.08

  return Math.round(namedPower + poolPower)
}

function runAudit() {
  console.log(`\n======================================================================`)
  console.log(`[감사 보고서] 통합 전투 스케일 감사 (측정·진단 전용)`)
  console.log(`======================================================================\n`)

  // 1. 상태 셋업
  let state = useGame.getState()
  if (!state.hunter) {
    state = {
      ...state,
      hunter: {
        level: 1,
        stats: { STR: 10, VIT: 10, AGI: 10, INT: 10, PER: 10, SEN: 10 },
        jobId: 'novice-hunter',
        jobs: {},
        ownedTitleIds: [],
      },
      items: [],
      equipment: {},
      ownedShadows: [],
      equippedShadowIds: [],
    }
  }

  const monarchCheatState = applyDevCheatProfile('monarchTestReady', state)
  
  // 대표 플레이어 빌드
  const playerMonarch = buildHunterBattleUnit(monarchCheatState.hunter, {
    items: monarchCheatState.items,
    equipment: monarchCheatState.equipment,
    activeConsumableEffects: [],
  }).unit

  // 중간 성장 플레이어 빌드 (Lv35)
  const totalStats = 30 + (35 - 1) * 4 // 166
  const weights = { STR: 0.25, VIT: 0.25, AGI: 0.20, INT: 0.10, PER: 0.10, SEN: 0.10 }
  const midHunter = {
    name: "Middle Hunter Lv35",
    level: 35,
    xp: 0,
    totalXp: 0,
    rank: 'C' as const,
    job: 'Warrior',
    jobId: 'warrior',
    unlockedJobIds: ['unawakened', 'warrior'],
    stats: {
      STR: Math.max(1, Math.round(totalStats * weights.STR)),
      VIT: Math.max(1, Math.round(totalStats * weights.VIT)),
      AGI: Math.max(1, Math.round(totalStats * weights.AGI)),
      INT: Math.max(1, Math.round(totalStats * weights.INT)),
      PER: Math.max(1, Math.round(totalStats * weights.PER)),
      SEN: Math.max(1, Math.round(totalStats * weights.SEN)),
    },
    freeStatPoints: 0,
    streak: 0,
    categoryProgress: {
      workout: 0, study: 0, career: 0, health: 0, mind: 0, finance: 0, social: 0, challenge: 0, habit: 0
    },
    ownedTitleIds: ['hunter'],
  }

  const midWeaponDef = ITEM_POOL.find(i => i.slot === 'weapon' && i.rarity === 'epic') || ITEM_POOL.find(i => i.slot === 'weapon');
  const midArmorDef = ITEM_POOL.find(i => i.slot === 'armor' && i.rarity === 'epic') || ITEM_POOL.find(i => i.slot === 'armor');

  const middleItems: any[] = [];
  if (midWeaponDef) {
    middleItems.push({
      id: 'mid-weapon-1',
      name: midWeaponDef.name,
      icon: midWeaponDef.icon,
      rarity: 'epic',
      description: '적당히 쓸만한 강철 대검',
      acquiredAt: new Date().toISOString(),
      equippable: true,
      slot: 'weapon',
      effects: midWeaponDef.effects || [],
      equipmentStars: 3,
      enhancementLevel: 3,
      combatSkillIds: midWeaponDef.combatSkillIds || []
    });
  }
  if (midArmorDef) {
    middleItems.push({
      id: 'mid-armor-1',
      name: midArmorDef.name,
      icon: midArmorDef.icon,
      rarity: 'epic',
      description: '적당히 튼튼한 강철 흉갑',
      acquiredAt: new Date().toISOString(),
      equippable: true,
      slot: 'armor',
      effects: midArmorDef.effects || [],
      equipmentStars: 3,
      enhancementLevel: 3
    });
  }

  const middleEquipment = {
    weapon: midWeaponDef ? 'mid-weapon-1' : undefined,
    armor: midArmorDef ? 'mid-armor-1' : undefined
  };

  const playerMiddle = buildHunterBattleUnit(midHunter, {
    items: middleItems,
    equipment: middleEquipment,
    activeConsumableEffects: [],
  }).unit

  // 대표 그림자 3종 빌드 (Lv.80 Monarch Ready 사양)
  const shadowIds = [
    'dev-shadow-lark-nest-fang',   // 딜러 (assault)
    'dev-shadow-ner-first-rift',    // 탱커 (scout/guard)
    'dev-shadow-shark-black-chaser' // 지원/유틸 (scout)
  ]
  const shadowUnits: any[] = []
  shadowIds.forEach(instanceId => {
    const shadow = monarchCheatState.ownedShadows.find((s: any) => s.instanceId === instanceId)
    if (shadow) {
      const def = getShadowDefinition(shadow.definitionId)
      const build = buildShadowBattleUnit(shadow, def).unit
      shadowUnits.push(build)
    }
  })

  // 일반 몬스터 빌드
  const monsterDefs = [
    { rank: 'E', id: 'rift-charger', lv: 5 },
    { rank: 'C', id: 'rift-hexer', lv: 15 },
    { rank: 'A', id: 'rift-gladiator', lv: 60 },
    { rank: 'S', id: 'abyss-devourer', lv: 80 }
  ]
  const monsterUnits: any[] = []
  monsterDefs.forEach(m => {
    const def = getMockDirectBattleMonster(m.id)
    if (def) {
      const build = buildMonsterBattleUnit(def, { level: m.lv }).unit
      monsterUnits.push({ rank: m.rank, unit: build, label: `${def.name} (${m.rank}-Rank, Lv.${m.lv})` })
    }
  })

  // 군주 8명 + 천사 빌드
  const monarchIds = ['grellic', 'celaide', 'igris', 'dorga', 'mirage', 'pesta', 'belatus', 'nox', 'angel']
  const monarchUnits: any[] = []
  monarchIds.forEach(mid => {
    const monarchData = mid === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === mid)!
    const monarchUnit = buildMonarchBattleUnit(mid, monarchData.recommendedCP)
    monarchUnits.push({ id: mid, data: monarchData, unit: monarchUnit })
  })

  // =====================================================================
  // [표 1] 시스템 B (실제 전투) BattleUnit 스탯
  // =====================================================================
  console.log(`### 표 1 — 시스템 B (실제 전투) BattleUnit 스탯`);
  console.log(`------------------------------------------------------------------------------------------------------------------------`);
  console.log(`${'구분'.padEnd(30)} | ${'maxHp'.padStart(8)} | ${'atk'.padStart(6)} | ${'def'.padStart(6)} | ${'spd'.padStart(4)} | ${'기본공격 1회 기대 피해량 (대상)'}`);
  console.log(`------------------------------------------------------------------------------------------------------------------------`);

  // Grellic target for players, Player target for monsters
  const grellicUnit = monarchUnits.find(m => m.id === 'grellic')!.unit;

  // 플레이어 출력
  console.log(`${'Monarch Test Player (Lv.100)'.padEnd(30)} | ${String(playerMonarch.stats.maxHp).padStart(8)} | ${String(playerMonarch.stats.atk).padStart(6)} | ${String(playerMonarch.stats.def).padStart(6)} | ${String(playerMonarch.stats.spd).padStart(4)} | ${String(computeExpectedDamage(playerMonarch, grellicUnit)).padStart(5)} (vs 그렐릭)`);
  console.log(`${'Middle Player (Lv.35)'.padEnd(30)} | ${String(playerMiddle.stats.maxHp).padStart(8)} | ${String(playerMiddle.stats.atk).padStart(6)} | ${String(playerMiddle.stats.def).padStart(6)} | ${String(playerMiddle.stats.spd).padStart(4)} | ${String(computeExpectedDamage(playerMiddle, grellicUnit)).padStart(5)} (vs 그렐릭)`);

  // 그림자 출력
  shadowUnits.forEach(su => {
    console.log(`${(`${su.displayName} (${su.role})`).padEnd(30)} | ${String(su.stats.maxHp).padStart(8)} | ${String(su.stats.atk).padStart(6)} | ${String(su.stats.def).padStart(6)} | ${String(su.stats.spd).padStart(4)} | ${String(computeExpectedDamage(su, grellicUnit)).padStart(5)} (vs 그렐릭)`);
  })

  // 일반 몬스터 출력
  monsterUnits.forEach(mu => {
    console.log(`${mu.label.padEnd(30)} | ${String(mu.unit.stats.maxHp).padStart(8)} | ${String(mu.unit.stats.atk).padStart(6)} | ${String(mu.unit.stats.def).padStart(6)} | ${String(mu.unit.stats.spd).padStart(4)} | ${String(computeExpectedDamage(mu.unit, playerMonarch)).padStart(5)} (vs Monarch)`);
  })

  // 군주 + 천사 출력
  monarchUnits.forEach(mu => {
    console.log(`${mu.data.name.padEnd(30)} | ${String(mu.unit.stats.maxHp).padStart(8)} | ${String(mu.unit.stats.atk).padStart(6)} | ${String(mu.unit.stats.def).padStart(6)} | ${String(mu.unit.stats.spd).padStart(4)} | ${String(computeExpectedDamage(mu.unit, playerMonarch)).padStart(5)} (vs Monarch)`);
  })

  // 하수인 출력
  console.log(`${'하수인/보조몹'.padEnd(30)} | ${'N/A'.padStart(8)} | ${'N/A'.padStart(6)} | ${'N/A'.padStart(6)} | ${'N/A'.padStart(4)} | 해당사항 없음 (군주전은 100% 단일 보스 결전 구조임)`);
  console.log(`------------------------------------------------------------------------------------------------------------------------\n`);

  // =====================================================================
  // [표 2] 1라운드 교환비 (실제 전투 성립성)
  // =====================================================================
  // 아군 파티 구성: 대표 플레이어 (Monarch Ready) + top 5 그림자
  const allyParty = [
    playerMonarch,
    ...monarchCheatState.ownedShadows.slice(0, 5).map((s: any) => {
      const def = getShadowDefinition(s.definitionId)
      return buildShadowBattleUnit(s, def).unit
    })
  ]

  // 시뮬레이션 대상 정의
  const exchangeTargets = [
    { name: '부패의 모왕 그렐릭 (약체 군주)', unit: monarchUnits.find(m => m.id === 'grellic')!.unit },
    { name: '강철의 패왕 도르가 (중위 군주)', unit: monarchUnits.find(m => m.id === 'dorga')!.unit },
    { name: '공허의 절대자 녹스 (상위 군주)', unit: monarchUnits.find(m => m.id === 'nox')!.unit },
    { name: '지고의 심판자 (천사)', unit: monarchUnits.find(m => m.id === 'angel')!.unit },
    { name: '심연의 포식자 (S급 게이트 보스)', unit: monsterUnits.find(mu => mu.rank === 'S')!.unit }
  ]

  console.log(`### 표 2 — 1라운드 교환비 (실제 전투 성립성)`);
  console.log(`* 아군 구성: Monarch Test Player(Lv.100) + 5대 그림자 군단`);
  console.log(`------------------------------------------------------------------------------------------------------------------------`);
  console.log(`${'상대 대상'.padEnd(32)} | ${'아군가한피해'.padStart(12)} | ${'적가한피해'.padStart(10)} | ${'적HP감소율'.padStart(10)} | ${'아군HP감소율'.padStart(12)} | ${'예상처치라운드 (승자)'}`);
  console.log(`------------------------------------------------------------------------------------------------------------------------`);

  exchangeTargets.forEach(target => {
    // 1라운드 시뮬레이션
    const simUnits = [...allyParty.map(u => ({ ...u })), { ...target.unit }]
    const state = createDirectBattleState(simUnits, { maxRounds: 200 })
    
    // 체력 스냅샷
    const hpBefore: Record<string, number> = {}
    state.units.forEach(u => { hpBefore[u.unitId] = u.stats.currentHp })

    // 1라운드 진행
    const playerSelections = chooseMockPlayerActions(state)
    executeDirectBattleRound(state, playerSelections)

    const hpAfter: Record<string, number> = {}
    state.units.forEach(u => { hpAfter[u.unitId] = u.stats.currentHp })

    // 가한 피해 계산
    const enemyInState = state.units.find(u => u.team === 'enemy')!
    const allyDmgDealt = Math.max(0, hpBefore[enemyInState.unitId] - hpAfter[enemyInState.unitId])

    let enemyDmgDealt = 0
    let allyHpMaxSum = 0
    let allyHpBeforeSum = 0
    let allyHpAfterSum = 0

    state.units.filter(u => u.team === 'player').forEach(u => {
      allyHpMaxSum += u.stats.maxHp
      allyHpBeforeSum += hpBefore[u.unitId]
      allyHpAfterSum += hpAfter[u.unitId]
    })
    enemyDmgDealt = Math.max(0, allyHpBeforeSum - allyHpAfterSum)

    const enemyHpReductionPct = (allyDmgDealt / target.unit.stats.maxHp) * 100
    const allyHpReductionPct = (enemyDmgDealt / allyHpMaxSum) * 100

    // 전체 모의전 실행
    const simStateFull = createDirectBattleState(simUnits, { maxRounds: 200 })
    const fullResult = runMockDirectBattle(simStateFull)

    const resultLabel = `${fullResult.roundsSimulated}R (${fullResult.winner === 'player' ? '아군승' : fullResult.winner === 'enemy' ? '적군승' : '무승부'})`

    console.log(
      `${target.name.padEnd(32)} | ${String(Math.round(allyDmgDealt)).padStart(12)} | ${String(Math.round(enemyDmgDealt)).padStart(10)} | ${enemyHpReductionPct.toFixed(1).padStart(9)}% | ${allyHpReductionPct.toFixed(1).padStart(11)}% | ${resultLabel.padStart(16)}`
    )
  })
  console.log(`------------------------------------------------------------------------------------------------------------------------\n`);

  // =====================================================================
  // [표 3] 시스템 A (NPC 시뮬) 전력 단위
  // =====================================================================
  const livingWorldState = initLivingWorld(888)
  const regionsToAudit = ['kr', 'us', 'cn', 'ru']

  console.log(`### 표 3 — 시스템 A (NPC 시뮬) 전력 단위`);
  console.log(`* 888 시드로 생성된 livingWorldState 기준 실측`);
  console.log(`------------------------------------------------------------------------------------------------------------------------`);
  console.log(`1) 대표 국가 getActiveRegionPower 실측값:`);
  regionsToAudit.forEach(rid => {
    const region = livingWorldState.regions[rid]
    const power = getActiveRegionPowerLocal(region, livingWorldState.namedHunters)
    console.log(`   - ${rid.toUpperCase()} 가용 총전력: ${power} CP (소속 네임드 수: ${region.namedHunterIds.length}명)`);
  })

  console.log(`\n2) 네임드 헌터 개별 전력 (기본 power + 장비 score) 분포:`);
  Object.values(livingWorldState.namedHunters).slice(0, 8).forEach(hunter => {
    const totalPower = hunter.power + (hunter.equipmentScore ?? 0)
    console.log(`   - [${hunter.rank}급 / ${hunter.regionId.toUpperCase()}] ${hunter.name.padEnd(16)}: CP ${totalPower} (기본: ${hunter.power} + 장비: ${hunter.equipmentScore})`);
  })
  console.log(`   - (네임드 S급 헌터의 평균 전투력 대역은 약 3,000 ~ 5,500으로 잡혀 있음)`);

  console.log(`\n3) 초기 게이트 difficulty 난이도 분포:`);
  const activeGates = Object.values(livingWorldState.riftNodes)
  const gatesByRank: Record<string, number[]> = { E: [], D: [], C: [], S: [] }
  activeGates.forEach(g => {
    if (gatesByRank[g.difficultyRank]) {
      gatesByRank[g.difficultyRank].push(g.difficulty)
    }
  })
  for (const [rank, diffs] of Object.entries(gatesByRank)) {
    const avg = diffs.length > 0 ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : 0
    console.log(`   - ${rank}급 게이트 (수량: ${diffs.length}개): 평균 난이도 ${avg} CP (범위: ${diffs.length > 0 ? Math.min(...diffs) : 0} ~ ${diffs.length > 0 ? Math.max(...diffs) : 0})`);
  }

  console.log(`\n4) 승률 계산 winChance 곡선 샘플 (아군전력 / 게이트난이도 비율 기준):`);
  const testRatios = [0.5, 0.8, 1.0, 1.2, 1.5, 2.0]
  testRatios.forEach(ratio => {
    let winChance = 0.5
    if (ratio >= 1.5) {
      winChance = 0.85 + (ratio - 1.5) * 0.1
    } else if (ratio >= 1.0) {
      winChance = 0.5 + (ratio - 1.0) * 0.7
    } else {
      winChance = 0.5 * ratio
    }
    winChance = Math.max(0.01, Math.min(0.99, winChance))
    console.log(`   - 전력비율 ${ratio.toFixed(1)}배일 때 -> 시뮬레이션 승률: ${Math.round(winChance * 100)}%`);
  })
  console.log(`------------------------------------------------------------------------------------------------------------------------\n`);

  // =====================================================================
  // [표 4] 두 시스템 교차 비교 (핵심)
  // =====================================================================
  console.log(`### 표 4 — 두 시스템 교차 비교 (핵심)`);
  console.log(`* 비교 대상: 난이도 13,000의 S급 게이트`);
  console.log(`------------------------------------------------------------------------------------------------------------------------`);
  console.log(`[시스템 A - NPC 추상 시뮬레이션]`);
  const npcPower = 15000;
  const ratio = npcPower / 13000;
  let winChance = 0.5
  if (ratio >= 1.5) winChance = 0.85 + (ratio - 1.5) * 0.1
  else if (ratio >= 1.0) winChance = 0.5 + (ratio - 1.0) * 0.7
  else winChance = 0.5 * ratio
  winChance = Math.max(0.01, Math.min(0.99, winChance))
  console.log(`- 기준 조건: 게이트 난이도 13,000 vs NPC 연합군 전력 15,000`);
  console.log(`- 계산된 승률비율 (전력비): ${ratio.toFixed(2)}배`);
  console.log(`- 시스템 A 판정 최종 승률: ${Math.round(winChance * 100)}%`);
  console.log(`- 전투 방식: 즉시 확률 주사위 롤링 (사망/부상 판정)`);

  console.log(`\n[시스템 B - 플레이어 실제 전투 시뮬레이션]`);
  // 난이도 13000에 대응되는 S급 몬스터 'abyss-devourer' Lv.80 빌드
  const bossDef = getMockDirectBattleMonster('abyss-devourer')!;
  // difficulty 13000인 경우, battleUnits.ts에서는 difficultyMod = 1.0을 기본으로 level 80 스케일을 적용함
  const bossUnit = buildMonsterBattleUnit(bossDef, { level: 80 }).unit;
  console.log(`- 몬스터 개체: [S-Rank, Lv.80] ${bossUnit.displayName}`);
  console.log(`- 몬스터 스탯: HP ${bossUnit.stats.maxHp} | ATK ${bossUnit.stats.atk} | DEF ${bossUnit.stats.def} | SPD ${bossUnit.stats.spd}`);
  
  // 플레이어 파티가 S급 몬스터를 격퇴할 때의 모의 전투 시뮬레이션
  const simStateCross = createDirectBattleState([...allyParty.map(u => ({ ...u })), { ...bossUnit }], { maxRounds: 200 })
  const resultCross = runMockDirectBattle(simStateCross)
  console.log(`- 대표 플레이어 파티의 실제 전투 결과:`);
  console.log(`  - 예상 처치 소요 턴: ${resultCross.roundsSimulated} 라운드`);
  console.log(`  - 전투 최종 승리자: ${resultCross.winner === 'player' ? '플레이어 파티 승리' : '몬스터 승리'}`);
  
  // 1라운드 후 HP 감소
  const hpBeforeCross: Record<string, number> = {}
  simStateCross.units.forEach(u => { hpBeforeCross[u.unitId] = u.stats.currentHp })
  const crossState1R = createDirectBattleState([...allyParty.map(u => ({ ...u })), { ...bossUnit }], { maxRounds: 200 })
  executeDirectBattleRound(crossState1R, chooseMockPlayerActions(crossState1R))
  
  const bossInState = crossState1R.units.find(u => u.team === 'enemy')!
  const playerInState = crossState1R.units.find(u => u.team === 'player' && u.unitType === 'hunter')!
  
  const boss1RDmg = bossUnit.stats.maxHp - bossInState.stats.currentHp
  const player1RDmg = playerMonarch.stats.maxHp - playerInState.stats.currentHp
  
  console.log(`  - 1라운드 교환비:`);
  console.log(`    - 아군이 가한 피해: ${boss1RDmg} (적 HP 감소율: ${((boss1RDmg / bossUnit.stats.maxHp) * 100).toFixed(1)}%)`);
  console.log(`    - 플레이어가 받은 피해: ${player1RDmg} (플레이어 본체 HP 감소율: ${((player1RDmg / playerMonarch.stats.maxHp) * 100).toFixed(1)}%)`);
  console.log(`------------------------------------------------------------------------------------------------------------------------`);
}

runAudit()
