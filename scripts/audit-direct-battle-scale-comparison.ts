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

function printUnitRow(title: string, unit: any) {
  console.log(
    `${title.padEnd(20)} | HP:${String(unit.stats.maxHp).padEnd(6)} | ATK:${String(unit.stats.atk).padEnd(5)} | DEF:${String(unit.stats.def).padEnd(4)} | SPD:${String(unit.stats.spd).padEnd(3)} | SKL:${String(unit.stats.skillPower).padEnd(5)}`
  )
}

function runComparison() {
  console.log(`======================================================================`)
  console.log(`[감사 시뮬레이터] Direct Battle Scale Comparison Audit`)
  console.log(`======================================================================`)

  // 1. Monarch Test Ready 상태 생성
  let state = useGame.getState()
  // Mock initialized state
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
  const angelCheatState = applyDevCheatProfile('angelTestReady', state)

  // 2. Monarch Test Ready Player
  const monarchPlayer = buildHunterBattleUnit(monarchCheatState.hunter, {
    items: monarchCheatState.items,
    equipment: monarchCheatState.equipment,
    activeConsumableEffects: [],
  }).unit

  // 3. Angel Test Ready Player
  const angelPlayer = buildHunterBattleUnit(angelCheatState.hunter, {
    items: angelCheatState.items,
    equipment: angelCheatState.equipment,
    activeConsumableEffects: [],
  }).unit

  console.log(`\n=== [플레이어 생존 & 전투 스탯 스케일] ===`)
  printUnitRow("Monarch Test Hunter", monarchPlayer)
  printUnitRow("Angel Test Hunter", angelPlayer)

  // 4. 그림자 5명 스펙
  console.log(`\n=== [그림자 Roster 생존 & 전투 스탯 스케일] ===`)
  const shadowIds = [
    'dev-shadow-ner-first-rift', // guard (방어형)
    'dev-shadow-rook-backstreet', // assault (공격형)
    'dev-shadow-lark-nest-fang', // hunter (딜러)
    'dev-shadow-gorn-sloth-captain', // guard (방어형)
    'dev-shadow-shark-black-chaser' // scout (기동형)
  ]
  
  shadowIds.forEach(instanceId => {
    const shadow = monarchCheatState.ownedShadows.find((s: any) => s.instanceId === instanceId)
    if (shadow) {
      const def = getShadowDefinition(shadow.definitionId)
      const build = buildShadowBattleUnit(shadow, def).unit
      printUnitRow(`${build.displayName} (${build.role})`, build)
    }
  })

  // 5. 일반 몬스터들
  console.log(`\n=== [게이트 몬스터 생존 & 전투 스탯 스케일] ===`)
  // E급 lazy-goblin
  const ratDef = getMockDirectBattleMonster('lazy-goblin')
  if (ratDef) {
    const build = buildMonsterBattleUnit(ratDef, { level: 5 }).unit
    printUnitRow("Lazy Goblin (E-Rank, Lv.5)", build)
  }
  // A급 greed-warden
  const wardenDef = getMockDirectBattleMonster('greed-warden')
  if (wardenDef) {
    const build = buildMonsterBattleUnit(wardenDef, { level: 60 }).unit
    printUnitRow("Greed Warden (A-Rank, Lv.60)", build)
  }
  // S급 boss
  const lordDef = getMockDirectBattleMonster('forgetting-warden')
  if (lordDef) {
    const build = buildMonsterBattleUnit(lordDef, { level: 80 }).unit
    printUnitRow("Forgetting Warden (S-Rank, Lv.80)", build)
  }

  // 6. 군주들 스펙
  console.log(`\n=== [9대 군주/보스 생존 & 전투 스탯 스케일] ===`)
  const monarchsToAudit = ['grellic', 'dorga', 'pesta', 'nox', 'angel']
  monarchsToAudit.forEach(mid => {
    const monarchData = mid === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === mid)!
    const monarchUnit = buildMonarchBattleUnit(mid, monarchData.recommendedCP)
    console.log(
      `${monarchData.name.padEnd(20)} | HP:${String(monarchUnit.stats.maxHp).padEnd(6)} | ATK:${String(monarchUnit.stats.atk).padEnd(5)} | DEF:${String(monarchUnit.stats.def).padEnd(4)} | SPD:${String(monarchUnit.stats.spd).padEnd(3)}`
    )
  })

  console.log(`======================================================================`)
}

runComparison()
