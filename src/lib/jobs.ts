import { type JobDefinitionV2, type JobId } from './types'

export const JOB_DEFINITIONS_V2: JobDefinitionV2[] = [
  // Novice Tier
  {
    id: 'novice-hunter',
    name: '초보 헌터',
    tier: 'novice',
    rarity: 'common',
    description: '아직 정식 각성을 하지 않은 초보 헌터. 시스템의 가이드에 따라 기본기를 다지는 단계입니다.',
    combatStyle: '기본 무기를 사용하는 밸런스형 전투 스타일.',
    archetype: 'special',
    branch: 'none',
    primaryStats: ['STR', 'VIT', 'AGI', 'INT', 'PER', 'SEN'],
    statModifiers: {},
    growthAffinity: {
      questCategoryBonus: {}
    },
    unlockCondition: {},
    skills: []
  },

  // 1차 직업군 (First Tier)
  {
    id: 'swordsman',
    name: '검객',
    tier: 'first',
    rarity: 'common',
    description: '날카로운 검날로 전장을 지배하는 헌터. 빠른 연속 공격과 급소 타격에 특화되어 있습니다.',
    combatStyle: '공격적인 검술과 빠른 속도.',
    archetype: 'warrior',
    branch: 'sword',
    previousJobIds: ['novice-hunter'],
    nextJobIds: ['swordsmaster', 'spellsword', 'berserker'],
    primaryStats: ['STR', 'AGI'],
    statModifiers: { STR: 5, AGI: 3 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.15 }
    },
    unlockCondition: { hunterLevel: 10 },
    skills: [{ skillId: 'skill-swordsman-slash', unlockLevel: 2, source: 'job' }]
  },
  {
    id: 'warrior',
    name: '전사',
    tier: 'first',
    rarity: 'common',
    description: '강인한 육체와 무거운 무기로 적을 분쇄하는 헌터. 강력한 일격과 강인함이 장점입니다.',
    combatStyle: '묵직한 공격และ 생존력.',
    archetype: 'warrior',
    branch: 'none',
    previousJobIds: ['novice-hunter'],
    nextJobIds: ['berserker', 'paladin', 'swordsmaster'],
    primaryStats: ['STR', 'VIT'],
    statModifiers: { STR: 5, VIT: 5 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.15 }
    },
    unlockCondition: { hunterLevel: 10 },
    skills: [{ skillId: 'skill-warrior-strike', unlockLevel: 2, source: 'job' }]
  },
  {
    id: 'mage',
    name: '마법사',
    tier: 'first',
    rarity: 'common',
    description: '마력을 운용하여 광역 마법을 구사하는 헌터. 지식을 탐구하며 원거리 화력에 능합니다.',
    combatStyle: '원거리 마법 및 광역 피해.',
    archetype: 'mage',
    branch: 'magic',
    previousJobIds: ['novice-hunter'],
    nextJobIds: ['chronomancer', 'battle-alchemist', 'spellsword'],
    primaryStats: ['INT', 'SEN'],
    statModifiers: { INT: 5, SEN: 3 },
    growthAffinity: {
      questCategoryBonus: { study: 0.15 }
    },
    unlockCondition: { hunterLevel: 10 },
    skills: [{ skillId: 'skill-mage-burst', unlockLevel: 2, source: 'job' }]
  },
  {
    id: 'guardian',
    name: '수호자',
    tier: 'first',
    rarity: 'common',
    description: '아군을 보호하고 전열을 유지하는 철벽의 헌터. 뛰어난 방어력과 인내심으로 버텨냅니다.',
    combatStyle: '방어력 증가 및 피해 감소 보조.',
    archetype: 'cleric',
    branch: 'shield',
    previousJobIds: ['novice-hunter'],
    nextJobIds: ['paladin', 'battle-alchemist', 'berserker'],
    primaryStats: ['VIT', 'PER'],
    statModifiers: { VIT: 5, PER: 5 },
    growthAffinity: {
      questCategoryBonus: { health: 0.15 }
    },
    unlockCondition: { hunterLevel: 10 },
    skills: [{ skillId: 'skill-guardian-shield', unlockLevel: 2, source: 'job' }]
  },
  {
    id: 'scout',
    name: '추적자',
    tier: 'first',
    rarity: 'common',
    description: '민첩한 움직임과 정보 수집으로 적을 교란하는 헌터. 탐색과 은밀한 타격이 특기입니다.',
    combatStyle: '기동성과 치명타 위주.',
    archetype: 'rogue',
    branch: 'shadow',
    previousJobIds: ['novice-hunter'],
    nextJobIds: ['abyss-stalker', 'swordsmaster', 'chronomancer'],
    primaryStats: ['AGI', 'SEN'],
    statModifiers: { AGI: 5, SEN: 5 },
    growthAffinity: {
      questCategoryBonus: { habit: 0.15 }
    },
    unlockCondition: { hunterLevel: 10 },
    skills: [{ skillId: 'skill-scout-strike', unlockLevel: 2, source: 'job' }]
  },
  {
    id: 'tactician',
    name: '전술가',
    tier: 'first',
    rarity: 'common',
    description: '전장의 흐름을 분석하고 아군을 지휘하는 두뇌형 헌터. 전략과 효율적인 전투를 추구합니다.',
    combatStyle: '아군 지원 및 전장 제어.',
    archetype: 'tactician',
    branch: 'none',
    previousJobIds: ['novice-hunter'],
    nextJobIds: ['grand-strategist', 'battle-alchemist', 'chronomancer'],
    primaryStats: ['INT', 'PER'],
    statModifiers: { INT: 5, PER: 3 },
    growthAffinity: {
      questCategoryBonus: { career: 0.15 }
    },
    unlockCondition: { hunterLevel: 10 },
    skills: [{ skillId: 'skill-tactician-analyze', unlockLevel: 2, source: 'job' }]
  },

  // 2차 직업군 (Second Tier)
  {
    id: 'swordsmaster',
    name: '검호',
    tier: 'second',
    rarity: 'rare',
    description: '자신의 검술을 극의로 이끄는 검사. 더욱 신속하고 날카로운 일섬을 구사합니다.',
    combatStyle: '더 빠른 공격과 치명타.',
    archetype: 'warrior',
    branch: 'sword',
    previousJobIds: ['swordsman', 'warrior', 'scout'],
    nextJobIds: ['sword-saint', 'illusory-swordmaster', 'speed-striker'],
    primaryStats: ['STR', 'AGI'],
    statModifiers: { STR: 12, AGI: 8 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.2, challenge: 0.1 }
    },
    unlockCondition: { hunterLevel: 30, previousJobLevel: 10, bossClearCount: 5 },
    skills: [
      { skillId: 'skill-swordsman-slash', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-swordsmaster-dual', unlockLevel: 3, source: 'job' }
    ]
  },
  {
    id: 'spellsword',
    name: '마검사',
    tier: 'second',
    rarity: 'rare',
    description: '검술과 마법을 결합하여 근접 물리력과 마력을 동시에 구사하는 헌터입니다.',
    combatStyle: '물리와 마법 마력을 결합한 하이브리드 전투.',
    archetype: 'warrior',
    branch: 'magic',
    previousJobIds: ['swordsman', 'mage'],
    nextJobIds: ['rune-spellsword', 'abyss-spellsword', 'elemental-spellsword'],
    primaryStats: ['STR', 'INT'],
    statModifiers: { STR: 10, INT: 10 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.15, study: 0.15 }
    },
    unlockCondition: { hunterLevel: 30, previousJobLevel: 10, gateClearCount: 15 },
    skills: [
      { skillId: 'skill-swordsman-slash', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-spellsword-infusion', unlockLevel: 3, source: 'job' }
    ]
  },
  {
    id: 'berserker',
    name: '광전사',
    tier: 'second',
    rarity: 'rare',
    description: '자신의 체력을 깎아 극한의 공격력을 얻는 파괴적인 전사.',
    combatStyle: '위기 상태에서의 무자비한 공격력 폭발.',
    archetype: 'warrior',
    branch: 'none',
    previousJobIds: ['warrior', 'swordsman', 'guardian'],
    nextJobIds: ['dragon-knight', 'immortal-berserker', 'hellfire-slayer'],
    primaryStats: ['STR', 'VIT'],
    statModifiers: { STR: 15, VIT: 8 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.25 }
    },
    unlockCondition: { hunterLevel: 30, previousJobLevel: 10, towerFloorCleared: 10 },
    skills: [
      { skillId: 'skill-warrior-strike', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-berserker-rage', unlockLevel: 3, source: 'job' }
    ]
  },
  {
    id: 'paladin',
    name: '성역 기사',
    tier: 'second',
    rarity: 'rare',
    description: '신성한 성역을 전개하여 아군을 치유하고 적의 공격을 흡수하는 수호 기사.',
    combatStyle: '아군 생존 보조 및 자신 방어 극대화.',
    archetype: 'cleric',
    branch: 'shield',
    previousJobIds: ['guardian', 'warrior'],
    nextJobIds: ['divine-guardian', 'holy-redeemer', 'judgment-knight'],
    primaryStats: ['VIT', 'PER'],
    statModifiers: { VIT: 12, PER: 10 },
    growthAffinity: {
      questCategoryBonus: { health: 0.2, mind: 0.1 }
    },
    unlockCondition: { hunterLevel: 30, previousJobLevel: 10, gateClearCount: 15 },
    skills: [
      { skillId: 'skill-guardian-shield', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-paladin-heal', unlockLevel: 3, source: 'job' }
    ]
  },
  {
    id: 'chronomancer',
    name: '시간술사',
    tier: 'second',
    rarity: 'rare',
    description: '시간의 왜곡을 일으켜 적을 둔화하고 자신 및 아군의 속도를 폭발적으로 가속합니다.',
    combatStyle: '행동 속도 제어 및 시간 지연.',
    archetype: 'mage',
    branch: 'chrono',
    previousJobIds: ['mage', 'scout', 'tactician'],
    nextJobIds: ['time-governor', 'infinity-mage', 'entropy-manipulator'],
    primaryStats: ['INT', 'SEN'],
    statModifiers: { INT: 15, SEN: 8 },
    growthAffinity: {
      questCategoryBonus: { study: 0.2, habit: 0.1 }
    },
    unlockCondition: { hunterLevel: 30, previousJobLevel: 10, mainStageCompletedCount: 5 },
    skills: [
      { skillId: 'skill-mage-burst', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-chrono-haste', unlockLevel: 3, source: 'job' }
    ]
  },
  {
    id: 'battle-alchemist',
    name: '전투 연금술사',
    tier: 'second',
    rarity: 'rare',
    description: '불안정한 원소 플라스크를 투척하여 아군의 힘을 돋우거나 적에게 폭발을 가합니다.',
    combatStyle: '다양한 물약을 사용한 원소 파괴 및 아군 강화.',
    archetype: 'tactician',
    branch: 'alchemy',
    previousJobIds: ['tactician', 'mage', 'guardian'],
    nextJobIds: ['sage-alchemist', 'elixir-creator', 'chimera-summoner'],
    primaryStats: ['INT', 'PER'],
    statModifiers: { INT: 12, PER: 10 },
    growthAffinity: {
      questCategoryBonus: { career: 0.2, finance: 0.1 }
    },
    unlockCondition: { hunterLevel: 30, previousJobLevel: 10, gateClearCount: 15 },
    skills: [
      { skillId: 'skill-tactician-analyze', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-alchemist-flask', unlockLevel: 3, source: 'job' }
    ]
  },
  {
    id: 'abyss-stalker',
    name: '심연 추적자',
    tier: 'second',
    rarity: 'rare',
    description: '심연의 어둠 속으로 녹아들어 적의 배후를 냉정하게 암습하는 은밀한 암살자.',
    combatStyle: '은신 기동 및 순간적인 대량의 물리 치명타.',
    archetype: 'rogue',
    branch: 'shadow',
    previousJobIds: ['scout'],
    nextJobIds: ['abyss-emperor', 'shadow-assassin', 'phantom-stalker'],
    primaryStats: ['AGI', 'SEN'],
    statModifiers: { AGI: 12, SEN: 10 },
    growthAffinity: {
      questCategoryBonus: { habit: 0.2, mind: 0.1 }
    },
    unlockCondition: { hunterLevel: 30, previousJobLevel: 10, shadowCount: 3 },
    skills: [
      { skillId: 'skill-scout-strike', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-abyss-assassinate', unlockLevel: 3, source: 'job' }
    ]
  },
  {
    id: 'grand-strategist',
    name: '마도 전략가',
    tier: 'second',
    rarity: 'rare',
    description: '마력의 공식을 분석하여 최적의 공격 진형 및 방어 전략을 설계하는 최고의 참모.',
    combatStyle: '전략적 피해 분산 및 집중 공격 전술.',
    archetype: 'tactician',
    branch: 'none',
    previousJobIds: ['tactician'],
    nextJobIds: ['grand-master-strategist', 'war-orchestrator', 'fate-weaver'],
    primaryStats: ['INT', 'PER'],
    statModifiers: { INT: 12, PER: 12 },
    growthAffinity: {
      questCategoryBonus: { career: 0.2, study: 0.1 }
    },
    unlockCondition: { hunterLevel: 30, previousJobLevel: 10, bossClearCount: 5 },
    skills: [
      { skillId: 'skill-tactician-analyze', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-strategist-formation', unlockLevel: 3, source: 'job' }
    ]
  },

  // 3차 직업군 (Third Tier - 24종)
  // 검호(swordsmaster) 계열 3차
  {
    id: 'sword-saint',
    name: '검성',
    tier: 'third',
    rarity: 'epic',
    description: '검의 한계를 넘어서 검의 의지와 일치하는 궁극의 경지에 도달한 자.',
    combatStyle: '무자비하고 정교한 절대적인 검풍 격참.',
    archetype: 'warrior',
    branch: 'sword',
    previousJobIds: ['swordsmaster'],
    primaryStats: ['STR', 'AGI'],
    statModifiers: { STR: 25, AGI: 20 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.3, challenge: 0.2 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, towerFloorCleared: 30, bossClearCount: 15 },
    skills: [
      { skillId: 'skill-swordsman-slash', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-swordsmaster-dual', unlockLevel: 5, source: 'job' },
      { skillId: 'skill-swordsaint-absolute', unlockLevel: 10, source: 'job' }
    ]
  },
  {
    id: 'illusory-swordmaster',
    name: '환영검사',
    tier: 'third',
    rarity: 'epic',
    description: '검날 끝에 마력으로 형상화한 수십 개의 잔상을 생성하여 단숨에 적을 혼란시키고 베어버리는 검사.',
    combatStyle: '환영 복제 타격 및 대량의 회피 능력.',
    archetype: 'warrior',
    branch: 'sword',
    previousJobIds: ['swordsmaster'],
    primaryStats: ['STR', 'AGI'],
    statModifiers: { STR: 20, AGI: 25 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.2, mind: 0.2, challenge: 0.1 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, gateClearCount: 30 },
    skills: [
      { skillId: 'skill-swordsman-slash', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-illusory-strike', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'speed-striker',
    name: '질풍검제',
    tier: 'third',
    rarity: 'epic',
    description: '공기 저항을 극한으로 줄여 음속의 속도로 도검을 휘두르는 초속의 검제.',
    combatStyle: '빠른 기동력을 결합한 초고속 공격 연속 타격.',
    archetype: 'warrior',
    branch: 'sword',
    previousJobIds: ['swordsmaster'],
    primaryStats: ['AGI', 'SEN'],
    statModifiers: { AGI: 30, SEN: 15 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.25, habit: 0.15 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, bossClearCount: 15 },
    skills: [
      { skillId: 'skill-swordsman-slash', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-speed-strike', unlockLevel: 5, source: 'job' }
    ]
  },

  // 마검사(spellsword) 계열 3차
  {
    id: 'rune-spellsword',
    name: '룬 마검사',
    tier: 'third',
    rarity: 'epic',
    description: '고대 룬 문자를 검날에 각인하여 자연 원소의 힘을 다스리는 최고위 마법 검사.',
    combatStyle: '룬 폭발 및 근접 하이브리드 원소 강습.',
    archetype: 'warrior',
    branch: 'magic',
    previousJobIds: ['spellsword'],
    primaryStats: ['STR', 'INT'],
    statModifiers: { STR: 22, INT: 22 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.2, study: 0.2, challenge: 0.1 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, gateClearCount: 40 },
    skills: [
      { skillId: 'skill-swordsman-slash', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-spellsword-infusion', unlockLevel: 5, source: 'job' },
      { skillId: 'skill-runesword-blast', unlockLevel: 10, source: 'job' }
    ]
  },
  {
    id: 'abyss-spellsword',
    name: '심연마검사',
    tier: 'third',
    rarity: 'epic',
    description: '심연의 마기를 도검에 불어넣어 적의 생명력을 잠식하는 암흑의 마검사.',
    combatStyle: '심연 잠식 디버프 및 어둠 속성 복합 타격.',
    archetype: 'warrior',
    branch: 'magic',
    previousJobIds: ['spellsword'],
    primaryStats: ['STR', 'INT'],
    statModifiers: { STR: 20, INT: 24 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.15, study: 0.25, mind: 0.1 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, shadowCount: 5 },
    skills: [
      { skillId: 'skill-swordsman-slash', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-abyss-infusion', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'elemental-spellsword',
    name: '원소마검사',
    tier: 'third',
    rarity: 'epic',
    description: '화염과 빙결, 번개의 3대 원소 마력을 도검에 둘러 다채로운 속성 공격을 전개하는 기사.',
    combatStyle: '원소 속성 복합 연격.',
    archetype: 'warrior',
    branch: 'magic',
    previousJobIds: ['spellsword'],
    primaryStats: ['STR', 'INT'],
    statModifiers: { STR: 22, INT: 22 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.2, study: 0.2, health: 0.1 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, gateClearCount: 30 },
    skills: [
      { skillId: 'skill-swordsman-slash', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-elemental-burst', unlockLevel: 5, source: 'job' }
    ]
  },

  // 광전사(berserker) 계열 3차
  {
    id: 'dragon-knight',
    name: '용혈 기사',
    tier: 'third',
    rarity: 'epic',
    description: '용의 심장을 이식하여 파괴적인 물리 화력하고 거대한 용언의 생명력을 다스리는 투사.',
    combatStyle: '엄청난 생명력을 기반으로 한 고위 용의 강습.',
    archetype: 'warrior',
    branch: 'none',
    previousJobIds: ['berserker'],
    primaryStats: ['STR', 'VIT'],
    statModifiers: { STR: 28, VIT: 18 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.3, health: 0.1 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, towerFloorCleared: 30, bossClearCount: 15 },
    skills: [
      { skillId: 'skill-warrior-strike', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-berserker-rage', unlockLevel: 5, source: 'job' },
      { skillId: 'skill-dragon-roar', unlockLevel: 10, source: 'job' }
    ]
  },
  {
    id: 'immortal-berserker',
    name: '불사전사',
    tier: 'third',
    rarity: 'epic',
    description: '죽음에 달하는 위기에 처할수록 생명력이 오히려 고착화되어 쓰러지지 않는 불멸의 전사.',
    combatStyle: '생명력 1 고정 생존 위기 극복 및 급증하는 공격력.',
    archetype: 'warrior',
    branch: 'none',
    previousJobIds: ['berserker'],
    primaryStats: ['STR', 'VIT'],
    statModifiers: { STR: 26, VIT: 22 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.3, mind: 0.1 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, towerFloorCleared: 25 },
    skills: [
      { skillId: 'skill-warrior-strike', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-immortal-spirit', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'hellfire-slayer',
    name: '연옥학살자',
    tier: 'third',
    rarity: 'epic',
    description: '타오르는 연옥의 대검을 소환하여 전장을 초토화시키는 파괴적인 심연의 도살자.',
    combatStyle: '화염 폭발 검기와 광역 화염 지속 대미지.',
    archetype: 'warrior',
    branch: 'none',
    previousJobIds: ['berserker'],
    primaryStats: ['STR', 'PER'],
    statModifiers: { STR: 30, PER: 14 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.25, challenge: 0.15 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, bossClearCount: 20 },
    skills: [
      { skillId: 'skill-warrior-strike', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-hellfire-slash', unlockLevel: 5, source: 'job' }
    ]
  },

  // 성역 기사(paladin) 계열 3차
  {
    id: 'divine-guardian',
    name: '성역 수호자',
    tier: 'third',
    rarity: 'epic',
    description: '빛의 성역을 소생시켜 적의 어떤 공격도 무효화하는 불패의 수호 방패.',
    combatStyle: '절대적인 방패 전개 및 지속 회복.',
    archetype: 'cleric',
    branch: 'shield',
    previousJobIds: ['paladin'],
    primaryStats: ['VIT', 'PER'],
    statModifiers: { VIT: 25, PER: 20 },
    growthAffinity: {
      questCategoryBonus: { health: 0.3, mind: 0.2 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, gateClearCount: 40 },
    skills: [
      { skillId: 'skill-guardian-shield', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-paladin-heal', unlockLevel: 5, source: 'job' },
      { skillId: 'skill-divine-sanctuary', unlockLevel: 10, source: 'job' }
    ]
  },
  {
    id: 'holy-redeemer',
    name: '성스러운 구원자',
    tier: 'third',
    rarity: 'epic',
    description: '아군의 상처를 고결한 성법으로 완전히 정화하여 전장을 재편하는 위대한 사제.',
    combatStyle: '고위 치유 마법 및 해로운 효과 해제.',
    archetype: 'cleric',
    branch: 'shield',
    previousJobIds: ['paladin'],
    primaryStats: ['VIT', 'SEN'],
    statModifiers: { VIT: 20, SEN: 25 },
    growthAffinity: {
      questCategoryBonus: { health: 0.25, social: 0.15 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, gateClearCount: 30 },
    skills: [
      { skillId: 'skill-guardian-shield', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-holy-redemption', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'judgment-knight',
    name: '심판의 성기사',
    tier: 'third',
    rarity: 'epic',
    description: '신성 마력을 검날에 직접 융합하여 어둠을 단죄하는 심판의 대리인.',
    combatStyle: '방어력 무시 추가 대미지 및 단죄 효과 타격.',
    archetype: 'cleric',
    branch: 'shield',
    previousJobIds: ['paladin'],
    primaryStats: ['STR', 'PER'],
    statModifiers: { STR: 22, PER: 22 },
    growthAffinity: {
      questCategoryBonus: { health: 0.2, workout: 0.2 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, bossClearCount: 15 },
    skills: [
      { skillId: 'skill-guardian-shield', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-judgment-strike', unlockLevel: 5, source: 'job' }
    ]
  },

  // 시간술사(chronomancer) 계열 3차
  {
    id: 'time-governor',
    name: '시간의 관리자',
    tier: 'third',
    rarity: 'epic',
    description: '과거와 미래의 균열을 통제하여 전투의 인과율 자체를 왜곡하는 초월적인 지배자.',
    combatStyle: '시간 역행 및 턴 속도 폭발 제어.',
    archetype: 'mage',
    branch: 'chrono',
    previousJobIds: ['chronomancer'],
    primaryStats: ['INT', 'SEN'],
    statModifiers: { INT: 28, SEN: 18 },
    growthAffinity: {
      questCategoryBonus: { study: 0.3, habit: 0.2 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, mainStageCompletedCount: 15 },
    skills: [
      { skillId: 'skill-mage-burst', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-chrono-haste', unlockLevel: 5, source: 'job' },
      { skillId: 'skill-time-rewind', unlockLevel: 10, source: 'job' }
    ]
  },
  {
    id: 'infinity-mage',
    name: '무한의 마도사',
    tier: 'third',
    rarity: 'epic',
    description: '시공간 속에 무한한 마력 회로를 구축하여 멈추지 않는 마력 탄환을 폭격하는 마도사.',
    combatStyle: '쿨다운 무시 쉴 새 없는 원거리 마도 폭격.',
    archetype: 'mage',
    branch: 'chrono',
    previousJobIds: ['chronomancer'],
    primaryStats: ['INT', 'SEN'],
    statModifiers: { INT: 30, SEN: 14 },
    growthAffinity: {
      questCategoryBonus: { study: 0.3, challenge: 0.1 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, gateClearCount: 40 },
    skills: [
      { skillId: 'skill-mage-burst', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-infinity-cascade', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'entropy-manipulator',
    name: '엔트로피 조작자',
    tier: 'third',
    rarity: 'epic',
    description: '공간의 엔트로피를 역전시켜 적의 에너지를 동결하거나 고온으로 붕괴시키는 시공학자.',
    combatStyle: '광역 동결 및 감전, 상태이상 복합 마법.',
    archetype: 'mage',
    branch: 'chrono',
    previousJobIds: ['chronomancer'],
    primaryStats: ['INT', 'AGI'],
    statModifiers: { INT: 25, AGI: 20 },
    growthAffinity: {
      questCategoryBonus: { study: 0.25, habit: 0.15 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, towerFloorCleared: 30 },
    skills: [
      { skillId: 'skill-mage-burst', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-entropy-collapse', unlockLevel: 5, source: 'job' }
    ]
  },

  // 전투 연금술사(battle-alchemist) 계열 3차
  {
    id: 'sage-alchemist',
    name: '현자의 연금술사',
    tier: 'third',
    rarity: 'epic',
    description: '물질을 재창조하고 가치를 고속으로 순환시키는 황금의 현자.',
    combatStyle: '초고속 연금 투척 및 아군 한계 돌파 서포팅.',
    archetype: 'tactician',
    branch: 'alchemy',
    previousJobIds: ['battle-alchemist'],
    primaryStats: ['INT', 'PER'],
    statModifiers: { INT: 25, PER: 20 },
    growthAffinity: {
      questCategoryBonus: { career: 0.3, finance: 0.2 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, gateClearCount: 40 },
    skills: [
      { skillId: 'skill-tactician-analyze', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-alchemist-flask', unlockLevel: 5, source: 'job' },
      { skillId: 'skill-sage-transmutation', unlockLevel: 10, source: 'job' }
    ]
  },
  {
    id: 'elixir-creator',
    name: '엘릭서 창조자',
    tier: 'third',
    rarity: 'epic',
    description: '죽어가는 생명도 불사로 환원하는 기적의 만능약 엘릭서를 전장에 공급하는 비전술사.',
    combatStyle: '무적 베리어 투척 및 치명적인 공격 상쇄 공급.',
    archetype: 'tactician',
    branch: 'alchemy',
    previousJobIds: ['battle-alchemist'],
    primaryStats: ['INT', 'PER'],
    statModifiers: { INT: 22, PER: 24 },
    growthAffinity: {
      questCategoryBonus: { career: 0.2, health: 0.2 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, bossClearCount: 15 },
    skills: [
      { skillId: 'skill-tactician-analyze', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-elixir-infusion', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'chimera-summoner',
    name: '키메라 소환사',
    tier: 'third',
    rarity: 'epic',
    description: '연금 마법으로 다양한 생명체들의 이형을 결합한 연금야수 키메라를 창조해 전장에 소환합니다.',
    combatStyle: '키메라 소환수 소환 및 강력한 도발 유지.',
    archetype: 'tactician',
    branch: 'alchemy',
    previousJobIds: ['battle-alchemist'],
    primaryStats: ['INT', 'SEN'],
    statModifiers: { INT: 24, SEN: 22 },
    growthAffinity: {
      questCategoryBonus: { career: 0.25, study: 0.15 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, shadowCount: 3 },
    skills: [
      { skillId: 'skill-tactician-analyze', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-summon-chimera', unlockLevel: 5, source: 'job' }
    ]
  },

  // 심연 추적자(abyss-stalker) 계열 3차
  {
    id: 'abyss-emperor',
    name: '심연검제',
    tier: 'third',
    rarity: 'epic',
    description: '그림자와 어둠을 신화적인 검날로 엮어 적으로 하여금 도망칠 수 없는 공포를 선사합니다.',
    combatStyle: '심연의 어둠 연타와 극대 치명 습격.',
    archetype: 'rogue',
    branch: 'shadow',
    previousJobIds: ['abyss-stalker'],
    primaryStats: ['AGI', 'SEN'],
    statModifiers: { AGI: 25, SEN: 20 },
    growthAffinity: {
      questCategoryBonus: { habit: 0.3, mind: 0.2 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, shadowCount: 10 },
    skills: [
      { skillId: 'skill-scout-strike', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-abyss-assassinate', unlockLevel: 5, source: 'job' },
      { skillId: 'skill-abyss-emperor-slash', unlockLevel: 10, source: 'job' }
    ]
  },
  {
    id: 'shadow-assassin',
    name: '그림자 암살자',
    tier: 'third',
    rarity: 'epic',
    description: '적의 그림자 속으로 완벽히 동화되어 타겟을 소리 소문 없이 절명시키는 궁극의 자객.',
    combatStyle: '완벽한 은신 및 급습 일격 필살.',
    archetype: 'rogue',
    branch: 'shadow',
    previousJobIds: ['abyss-stalker'],
    primaryStats: ['AGI', 'SEN'],
    statModifiers: { AGI: 28, SEN: 18 },
    growthAffinity: {
      questCategoryBonus: { habit: 0.35, challenge: 0.1 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, gateClearCount: 40 },
    skills: [
      { skillId: 'skill-scout-strike', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-shadow-kill', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'phantom-stalker',
    name: '환영추적자',
    tier: 'third',
    rarity: 'epic',
    description: '자신의 흔적을 허상으로 파쇄해 흩뿌리며 사방에서 보이지 않는 칼날로 적을 기만하는 추적 기사.',
    combatStyle: '연속 회피 및 급소 연사 난도질.',
    archetype: 'rogue',
    branch: 'shadow',
    previousJobIds: ['abyss-stalker'],
    primaryStats: ['AGI', 'STR'],
    statModifiers: { AGI: 25, STR: 20 },
    growthAffinity: {
      questCategoryBonus: { habit: 0.25, workout: 0.15 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, bossClearCount: 15 },
    skills: [
      { skillId: 'skill-scout-strike', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-phantom-assault', unlockLevel: 5, source: 'job' }
    ]
  },

  // 마도 전략가(grand-strategist) 계열 3차
  {
    id: 'grand-master-strategist',
    name: '마도 전략가 상위직',
    tier: 'third',
    rarity: 'epic',
    description: '완벽한 전략과 진형 통제로 전장의 변수를 0으로 수렴시키는 대장군.',
    combatStyle: '전략적 피해 분산 및 집중 공격 전술.',
    archetype: 'tactician',
    branch: 'none',
    previousJobIds: ['grand-strategist'],
    primaryStats: ['INT', 'PER'],
    statModifiers: { INT: 25, PER: 25 },
    growthAffinity: {
      questCategoryBonus: { career: 0.3, study: 0.2 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, bossClearCount: 15 },
    skills: [
      { skillId: 'skill-tactician-analyze', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-strategist-formation', unlockLevel: 5, source: 'job' },
      { skillId: 'skill-strategist-checkmate', unlockLevel: 10, source: 'job' }
    ]
  },
  {
    id: 'war-orchestrator',
    name: '전쟁 조율사',
    tier: 'third',
    rarity: 'epic',
    description: '전장을 하나의 교향곡처럼 지휘하여 적군의 리듬을 파괴하고 아군을 지고의 용맹으로 가득 차게 만드는 지휘자.',
    combatStyle: '광역 아군 물리 공방 버프 및 행동 가속.',
    archetype: 'tactician',
    branch: 'none',
    previousJobIds: ['grand-strategist'],
    primaryStats: ['INT', 'PER'],
    statModifiers: { INT: 22, PER: 28 },
    growthAffinity: {
      questCategoryBonus: { career: 0.25, social: 0.15 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, gateClearCount: 40 },
    skills: [
      { skillId: 'skill-tactician-analyze', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-orchestrate-march', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'fate-weaver',
    name: '운명 조율사',
    tier: 'third',
    rarity: 'epic',
    description: '전술적 분석을 인과율의 배열과 엮어 아군에게 최선의 치명 경로를 제공하고 위기를 넘기게 돕는 신탁 기사.',
    combatStyle: '치명타 유발 극대화 및 치명적 대미지 1회 극복.',
    archetype: 'tactician',
    branch: 'none',
    previousJobIds: ['grand-strategist'],
    primaryStats: ['INT', 'SEN'],
    statModifiers: { INT: 24, SEN: 26 },
    growthAffinity: {
      questCategoryBonus: { career: 0.2, mind: 0.2 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, towerFloorCleared: 30 },
    skills: [
      { skillId: 'skill-tactician-analyze', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-weave-fate', unlockLevel: 5, source: 'job' }
    ]
  },

  // ─────────────────────────────────────────────────────────────────
  // 히든 직업 계열 (Hidden Class Families)
  // ─────────────────────────────────────────────────────────────────

  // 1. 그림자 계열 (Shadow Branch)
  {
    id: 'shadow-disciple',
    name: '그림자 추종자',
    tier: 'first',
    rarity: 'hidden',
    description: '그림자 속 어둠의 지배 조건에 흥미를 느끼고, 심연의 힘에 한 발을 내딛은 자.',
    combatStyle: '그림자 힘의 기본 전개.',
    archetype: 'special',
    branch: 'shadow',
    previousJobIds: ['novice-hunter'],
    nextJobIds: ['shadow-commander'],
    primaryStats: ['SEN', 'INT'],
    statModifiers: { SEN: 10, INT: 5 },
    growthAffinity: {
      questCategoryBonus: { mind: 0.15, challenge: 0.15 }
    },
    unlockCondition: { shadowCount: 1, resonanceRequired: { shadow: 10 }, hiddenSignalKeys: ['shadow-extract-success'] },
    hiddenProfile: {
      isHidden: true,
      maskedName: '어두운 그늘의 신도',
      revealName: '그림자 추종자',
      hintLevel: 'vague',
      hintText: '어둠은 그대의 등 뒤에서 속삭인다. 망자의 잔영을 비틀어 그 영혼의 경계를 흔들어라.'
    },
    skills: [{ skillId: 'skill-shadow-command', unlockLevel: 1, source: 'job' }]
  },
  {
    id: 'shadow-commander',
    name: '그림자 지휘관',
    tier: 'second',
    rarity: 'hidden',
    description: '그림자 부하들의 사기를 조율하며 단단한 지휘 편제를 구상하는 고급 지휘관.',
    combatStyle: '그림자 유닛의 기본 스탯 강화 및 공동 공격.',
    archetype: 'special',
    branch: 'shadow',
    previousJobIds: ['shadow-disciple'],
    nextJobIds: ['shadow-lord', 'abyss-summoner', 'phantom-general'],
    primaryStats: ['SEN', 'INT'],
    statModifiers: { SEN: 18, INT: 12 },
    growthAffinity: {
      questCategoryBonus: { mind: 0.2, challenge: 0.2 }
    },
    unlockCondition: { hunterLevel: 30, previousJobLevel: 10, shadowCount: 3, resonanceRequired: { shadow: 25 } },
    hiddenProfile: {
      isHidden: true,
      maskedName: '검은 장군',
      revealName: '그림자 지휘관',
      hintLevel: 'partial',
      hintText: '그늘의 종들을 이끄는 자여, 더 많은 어둠을 모아 그대의 군대 앞에 명령을 내릴 권능을 쟁취하라.'
    },
    skills: [
      { skillId: 'skill-shadow-command', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-shadow-boost', unlockLevel: 3, source: 'job' }
    ]
  },
  {
    id: 'shadow-lord',
    name: '그림자 군주',
    tier: 'third',
    rarity: 'legendary',
    description: '그림자를 완전히 지배하고 망자들을 이끄는 절대적인 지배자. 군단을 통솔하는 데 최적화되어 있습니다.',
    combatStyle: '그림자 소환 및 강화, 소환 능력 극대화.',
    archetype: 'special',
    branch: 'shadow',
    previousJobIds: ['shadow-commander'],
    primaryStats: ['SEN', 'INT'],
    statModifiers: { SEN: 30, INT: 20 },
    growthAffinity: {
      questCategoryBonus: { mind: 0.25, challenge: 0.25 }
    },
    unlockCondition: { shadowCount: 5, towerFloorCleared: 20, resonanceRequired: { shadow: 50 }, hiddenSignalKeys: ['shadow-evolved'] },
    hiddenProfile: {
      isHidden: true,
      maskedName: '미확인 군주',
      revealName: '그림자 군주',
      hintLevel: 'clear',
      hintText: '망자들의 진정한 주인이여, 어둠의 군단을 거느리고 하늘을 찌르는 탑의 끝에서 군주의 선언을 하라.'
    },
    skills: [
      { skillId: 'skill-shadow-command', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-shadow-extraction', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'abyss-summoner',
    name: '심연 소환사',
    tier: 'third',
    rarity: 'legendary',
    description: '그림자의 차원을 넘어서 그림자 너머에 웅크린 심연의 본체들을 전장에 강제 현신시키는 영매.',
    combatStyle: '심연 구체 발사 및 고위 심연 괴수 주기적 현신 타격.',
    archetype: 'special',
    branch: 'shadow',
    previousJobIds: ['shadow-commander'],
    primaryStats: ['SEN', 'INT'],
    statModifiers: { SEN: 20, INT: 30 },
    growthAffinity: {
      questCategoryBonus: { mind: 0.2, study: 0.2 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, towerFloorCleared: 30, resonanceRequired: { shadow: 50 } },
    hiddenProfile: {
      isHidden: true,
      maskedName: '기괴한 강령술사',
      revealName: '심연 소환사',
      hintLevel: 'partial',
      hintText: '그늘진 경계선을 더 깊이 헤집어, 그림자 너머 아득한 심연의 밑바닥을 강제로 들여다보아라.'
    },
    skills: [
      { skillId: 'skill-shadow-command', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-abyss-gate', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'phantom-general',
    name: '환영 대장군',
    tier: 'third',
    rarity: 'legendary',
    description: '그림자 부대원들의 능력치를 극한으로 버프하고, 그들로 하여금 불굴의 저항 장막을 전개하도록 지휘하는 강철 군장.',
    combatStyle: '소환수들의 공격력/방어력 50% 버프 및 탱킹 위주.',
    archetype: 'special',
    branch: 'shadow',
    previousJobIds: ['shadow-commander'],
    primaryStats: ['SEN', 'PER'],
    statModifiers: { SEN: 22, PER: 28 },
    growthAffinity: {
      questCategoryBonus: { mind: 0.2, workout: 0.2 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, bossClearCount: 20, resonanceRequired: { shadow: 50 } },
    hiddenProfile: {
      isHidden: true,
      maskedName: '칠흑의 군단 사령관',
      revealName: '환영 대장군',
      hintLevel: 'partial',
      hintText: '군단의 앞을 가로막는 수많은 거수들을 베어내고, 그 기세로 하여금 영원한 철벽을 도출하라.'
    },
    skills: [
      { skillId: 'skill-shadow-command', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-general-rally', unlockLevel: 5, source: 'job' }
    ]
  },

  // 2. 저주 계열 (Curse Branch)
  {
    id: 'curse-initiate',
    name: '저주 입문자',
    tier: 'first',
    rarity: 'hidden',
    description: '체력이 극도로 소진된 생사경에서 역전의 희열을 느끼고, 해로운 오라를 활용하기 시작한 마도사.',
    combatStyle: '적 둔화 및 소폭 공격력 감소 기본 디버프 전개.',
    archetype: 'special',
    branch: 'curse',
    previousJobIds: ['novice-hunter'],
    nextJobIds: ['puppet-master'],
    primaryStats: ['INT', 'SEN'],
    statModifiers: { INT: 10, SEN: 5 },
    growthAffinity: {
      questCategoryBonus: { study: 0.15, mind: 0.15 }
    },
    unlockCondition: { hunterLevel: 15, resonanceRequired: { curse: 12 }, hiddenSignalKeys: ['low-hp-victory'] },
    hiddenProfile: {
      isHidden: true,
      maskedName: '희미한 사령 마법사',
      revealName: '저주 입문자',
      hintLevel: 'vague',
      hintText: '심장이 멎어가는 칠흑의 위기, 죽음의 문턱에서 피워내는 역전의 불꽃.'
    },
    skills: [{ skillId: 'skill-puppet-curse', unlockLevel: 1, source: 'job' }]
  },
  {
    id: 'puppet-master',
    name: '저주 인형사',
    tier: 'second',
    rarity: 'hidden',
    description: '보이지 않는 실로 전장을 통제하고 저주를 내리는 어둠의 술사.',
    combatStyle: '적의 능력치 디버프 및 지속 제어.',
    archetype: 'special',
    branch: 'curse',
    previousJobIds: ['curse-initiate'],
    nextJobIds: ['soul-reaper', 'doom-herald', 'fate-breaker'],
    primaryStats: ['INT', 'SEN'],
    statModifiers: { INT: 22, SEN: 18 },
    growthAffinity: {
      questCategoryBonus: { study: 0.2, mind: 0.2 }
    },
    unlockCondition: { hunterLevel: 30, previousJobLevel: 10, gateClearCount: 15, resonanceRequired: { curse: 25 } },
    hiddenProfile: {
      isHidden: true,
      maskedName: '어둠의 직포자',
      revealName: '저주 인형사',
      hintLevel: 'partial',
      hintText: '운명의 실타래를 등 뒤에서 조율하며, 차원의 틈새를 닫는 시련을 통해 인과의 뒤틀림을 증명하라.'
    },
    skills: [
      { skillId: 'skill-puppet-curse', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-puppet-control', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'soul-reaper',
    name: '영혼 약탈자',
    tier: 'third',
    rarity: 'legendary',
    description: '쓰러진 자들의 영혼을 수확하여 스스로의 힘으로 변환하는 저승의 사자.',
    combatStyle: '생명력 흡수 및 적 처치 시 공격력 증가.',
    archetype: 'special',
    branch: 'curse',
    previousJobIds: ['puppet-master'],
    primaryStats: ['STR', 'SEN'],
    statModifiers: { STR: 22, SEN: 18 },
    growthAffinity: {
      questCategoryBonus: { workout: 0.2, challenge: 0.2 }
    },
    unlockCondition: { hunterLevel: 45, bossClearCount: 10, resonanceRequired: { curse: 45 } },
    hiddenProfile: {
      isHidden: true,
      maskedName: '영혼 수집가',
      revealName: '영혼 약탈자',
      hintLevel: 'partial',
      hintText: '소멸해야 마땅할 강적들의 혼백을 거두고, 저승의 업화를 검날에 둘러라.'
    },
    skills: [
      { skillId: 'skill-soul-reap', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-soul-harvest', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'doom-herald',
    name: '파멸의 전령',
    tier: 'third',
    rarity: 'legendary',
    description: '어두운 종언의 신탁을 전하며, 자신이 타격한 상대에게 턴마다 기하급수적으로 증가하는 맹독성 낙인을 심습니다.',
    combatStyle: '지속 스택형 파멸 저주 및 폭발 낙인 전개.',
    archetype: 'special',
    branch: 'curse',
    previousJobIds: ['puppet-master'],
    primaryStats: ['INT', 'SEN'],
    statModifiers: { INT: 28, SEN: 22 },
    growthAffinity: {
      questCategoryBonus: { study: 0.25, mind: 0.15 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, towerFloorCleared: 25, resonanceRequired: { curse: 50 } },
    hiddenProfile: {
      isHidden: true,
      maskedName: '파멸을 부르는 오라',
      revealName: '파멸의 전령',
      hintLevel: 'partial',
      hintText: '사슬을 엮어 인형을 매달고, 마스터한 저주의 오라로 하여금 시련의 높은 전당을 침식하라.'
    },
    skills: [
      { skillId: 'skill-puppet-curse', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-doom-decree', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'fate-breaker',
    name: '인과 파괴자',
    tier: 'third',
    rarity: 'legendary',
    description: '인형에 적의 인과를 결착시켜 적이 가한 대미지를 반사하고 강제로 상태이상을 반사하는 역설의 술사.',
    combatStyle: '수동 반사 대미지 메커니즘 및 디버프 복사 전개.',
    archetype: 'special',
    branch: 'curse',
    previousJobIds: ['puppet-master'],
    primaryStats: ['INT', 'PER'],
    statModifiers: { INT: 26, PER: 24 },
    growthAffinity: {
      questCategoryBonus: { study: 0.2, challenge: 0.2 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, gateClearCount: 35, resonanceRequired: { curse: 50 } },
    hiddenProfile: {
      isHidden: true,
      maskedName: '운명을 끊어내는 바늘',
      revealName: '인과 파괴자',
      hintLevel: 'partial',
      hintText: '거대한 운명의 흐름을 찢어 발기고, 차원의 틈을 닫는 시련 속에서 단죄의 반격식을 입증하라.'
    },
    skills: [
      { skillId: 'skill-puppet-curse', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-break-fate', unlockLevel: 5, source: 'job' }
    ]
  },

  // 3. 차원/시간 계열 (Chrono/Rift Branch)
  {
    id: 'rift-sensing-hunter',
    name: '균열 감응자',
    tier: 'first',
    rarity: 'hidden',
    description: '시간과 공간의 미세한 흐름에 감응하여 전투 중 찰나의 빈틈을 비정상적으로 포착해 역전을 전개한 헌터.',
    combatStyle: '차원 변 왜곡 회피 확률 가산.',
    archetype: 'special',
    branch: 'chrono',
    previousJobIds: ['novice-hunter'],
    nextJobIds: ['dimension-traveler'],
    primaryStats: ['AGI', 'SEN'],
    statModifiers: { AGI: 10, SEN: 5 },
    growthAffinity: {
      questCategoryBonus: { habit: 0.15, finance: 0.15 }
    },
    unlockCondition: { hunterLevel: 15, resonanceRequired: { rift: 12 }, hiddenSignalKeys: ['long-battle-victory'] },
    hiddenProfile: {
      isHidden: true,
      maskedName: '시공간의 부스러기 목격자',
      revealName: '균열 감응자',
      hintLevel: 'vague',
      hintText: '찰나의 균열, 끝나지 않을 것 같은 긴 투쟁의 소용돌이 속에서 열리는 다른 세계의 길.'
    },
    skills: [{ skillId: 'skill-dimension-arrow', unlockLevel: 1, source: 'job' }]
  },
  {
    id: 'dimension-traveler',
    name: '차원 방랑자',
    tier: 'second',
    rarity: 'hidden',
    description: '게이트의 균열을 연구하여 시공간을 가볍게 통과하는 초차원적 도약 기교를 익힌 기사.',
    combatStyle: '물리 공격 회피율 대폭 상승 및 턴 속도 수동 가산.',
    archetype: 'special',
    branch: 'chrono',
    previousJobIds: ['rift-sensing-hunter'],
    nextJobIds: ['dimension-hunter', 'void-navigator', 'chrono-saber'],
    primaryStats: ['AGI', 'SEN'],
    statModifiers: { AGI: 22, SEN: 18 },
    growthAffinity: {
      questCategoryBonus: { habit: 0.2, finance: 0.2 }
    },
    unlockCondition: { hunterLevel: 30, previousJobLevel: 10, gateClearCount: 25, resonanceRequired: { rift: 25 } },
    hiddenProfile: {
      isHidden: true,
      maskedName: '경계의 도약자',
      revealName: '차원 방랑자',
      hintLevel: 'partial',
      hintText: '경계선 너머의 방랑자여, 수많은 균열의 관문을 통과해 공간 위상을 자유로이 통제하라.'
    },
    skills: [
      { skillId: 'skill-dimension-arrow', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-dimension-phase', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'dimension-hunter',
    name: '차원 사냥꾼',
    tier: 'third',
    rarity: 'legendary',
    description: '차원의 경계를 자유롭게 넘나들며 공간을 찢는 화살을 쏘는 사냥꾼.',
    combatStyle: '차원 왜곡 및 공간 왜곡 타격.',
    archetype: 'special',
    branch: 'chrono',
    previousJobIds: ['dimension-traveler'],
    primaryStats: ['AGI', 'SEN'],
    statModifiers: { AGI: 28, SEN: 22 },
    growthAffinity: {
      questCategoryBonus: { habit: 0.25, finance: 0.25 }
    },
    unlockCondition: { hunterLevel: 50, gateClearCount: 50, resonanceRequired: { rift: 50 } },
    hiddenProfile: {
      isHidden: true,
      maskedName: '경계의 파수꾼',
      revealName: '차원 사냥꾼',
      hintLevel: 'clear',
      hintText: '공간을 가르는 투사가 되어, 온 세상의 게이트를 닫아 인과의 평형을 수호하라.'
    },
    skills: [
      { skillId: 'skill-dimension-arrow', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-dimension-phase', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'void-navigator',
    name: '공허 항해자',
    tier: 'third',
    rarity: 'legendary',
    description: '차원 사이의 차디찬 허공인 공허의 중력을 구사하여 상대를 제어하고 침묵시키는 우주론자.',
    combatStyle: '공허 흡입 홀딩 및 적 행동 억제 침묵.',
    archetype: 'special',
    branch: 'chrono',
    previousJobIds: ['dimension-traveler'],
    primaryStats: ['INT', 'SEN'],
    statModifiers: { INT: 28, SEN: 22 },
    growthAffinity: {
      questCategoryBonus: { study: 0.25, finance: 0.15 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, towerFloorCleared: 30, resonanceRequired: { rift: 50 } },
    hiddenProfile: {
      isHidden: true,
      maskedName: '성간의 방랑자',
      revealName: '공허 항해자',
      hintLevel: 'partial',
      hintText: '방랑의 끝에서 성간의 허공을 직면하라. 소리조차 닿지 않는 영겁의 탑 높은 곳에서 공허의 중력을 정위하라.'
    },
    skills: [
      { skillId: 'skill-dimension-arrow', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-void-gravitation', unlockLevel: 5, source: 'job' }
    ]
  },
  {
    id: 'chrono-saber',
    name: '시공의 기사',
    tier: 'third',
    rarity: 'legendary',
    description: '차원 검강을 소환해 시간 도약 공격을 전개하여 찰나의 순간에 적을 3회 베어내는 신속의 칼날.',
    combatStyle: '연속 타격 및 강력한 가속 회피.',
    archetype: 'special',
    branch: 'chrono',
    previousJobIds: ['dimension-traveler'],
    primaryStats: ['AGI', 'STR'],
    statModifiers: { AGI: 30, STR: 20 },
    growthAffinity: {
      questCategoryBonus: { habit: 0.25, workout: 0.15 }
    },
    unlockCondition: { hunterLevel: 50, previousJobLevel: 20, bossClearCount: 20, resonanceRequired: { rift: 50 } },
    hiddenProfile: {
      isHidden: true,
      maskedName: '찰나의 광검사',
      revealName: '시공의 기사',
      hintLevel: 'partial',
      hintText: '찰나와 영원의 경계를 칼날로 베어내어, 수많은 지배자들의 영혼을 시공 속으로 흩뿌려라.'
    },
    skills: [
      { skillId: 'skill-dimension-arrow', unlockLevel: 1, source: 'job' },
      { skillId: 'skill-chrono-slash', unlockLevel: 5, source: 'job' }
    ]
  }
]
