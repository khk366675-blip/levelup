import type {
  Category,
  GateDefinition,
  HunterState,
  OwnedShadow,
  ShadowDefinition,
  ShadowEffect,
  ShadowEffectType,
  ShadowRank,
  ShadowRarity,
  ShadowRole,
  ShadowTrait,
  StatKey,
} from './types'

export const SHADOW_RARITY_ORDER: ShadowRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
export const SHADOW_RANK_ORDER: ShadowRank[] = ['lesser', 'soldier', 'elite', 'knight', 'marshal', 'monarch', 'named']

export const SHADOW_RARITY_LABEL: Record<ShadowRarity, string> = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
}

export const SHADOW_RANK_LABEL: Record<ShadowRank, string> = {
  lesser: '하급',
  soldier: '병사',
  elite: '정예',
  knight: '기사',
  marshal: '장수',
  monarch: '군주',
  named: '네임드',
}

export const SHADOW_ROLE_LABEL: Record<ShadowRole, string> = {
  assault: '공격',
  guard: '방어',
  scout: '정찰',
  analyst: '분석',
  support: '지원',
  hunter: '사냥',
}

export const SHADOW_TRAITS: ShadowTrait[] = [
  { id: 'sharp', name: '날카로운', description: '피해 +3%', effectType: 'bonus_damage', value: 0.03, allowedRoles: ['assault'] },
  { id: 'fierce', name: '맹렬한', description: '적 HP 50% 이상일 때 피해 +4%', effectType: 'bonus_damage', value: 0.04, allowedRoles: ['assault'] },
  { id: 'executioner', name: '처형자', description: '적 HP 30% 이하일 때 피해 +6%', effectType: 'execute_damage', value: 0.06, allowedRoles: ['assault', 'scout'] },
  { id: 'piercing', name: '관통하는', description: '적 방어 일부 무시', effectType: 'enemy_defense_down', value: 0.02, allowedRoles: ['assault', 'analyst'] },
  { id: 'chain', name: '연속의', description: '낮은 확률 추가타', effectType: 'extra_attack_chance', value: 0.03, allowedRoles: ['assault', 'scout'] },
  { id: 'solid', name: '견고한', description: '받는 피해 -3%', effectType: 'damage_reduction', value: 0.03, allowedRoles: ['guard'] },
  { id: 'unyielding', name: '불굴의', description: 'HP 30% 이하일 때 방어 강화', effectType: 'low_hp_defense', value: 0.04, allowedRoles: ['guard', 'support'] },
  { id: 'guardian', name: '수호의', description: '전투당 1회 피해 일부 감소', effectType: 'damage_reduction', value: 0.04, allowedRoles: ['guard', 'support'] },
  { id: 'steel', name: '강철의', description: '치명 피해 감소', effectType: 'damage_reduction', value: 0.02, allowedRoles: ['guard'] },
  { id: 'agile', name: '민첩한', description: '첫 턴 행동 보조', effectType: 'first_turn_evasion', value: 0.02, allowedRoles: ['scout'] },
  { id: 'quick', name: '재빠른', description: '명중/회피 소폭 증가', effectType: 'first_turn_accuracy', value: 0.02, allowedRoles: ['scout'] },
  { id: 'preemptive', name: '선제의', description: '첫 공격 피해 증가', effectType: 'wave_start_bonus', value: 0.04, allowedRoles: ['scout', 'assault'] },
  { id: 'tracking', name: '추적의', description: '적 회피 감소', effectType: 'enemy_evasion_down', value: 0.02, allowedRoles: ['scout', 'hunter'] },
  { id: 'analytical', name: '분석적인', description: '적 방어력 소폭 감소', effectType: 'enemy_defense_down', value: 0.03, allowedRoles: ['analyst'] },
  { id: 'focused', name: '집중의', description: '스킬 쿨타임 보조 소폭', effectType: 'cooldown_support', value: 0.02, allowedRoles: ['analyst', 'support'] },
  { id: 'calm', name: '침착한', description: '장기전 후반 피해 증가', effectType: 'bonus_damage', value: 0.02, allowedRoles: ['analyst', 'support'] },
  { id: 'tactical', name: '전술적인', description: '수동 전투 스킬 사용 시 보조 피해', effectType: 'skill_damage_bonus', value: 0.03, allowedRoles: ['analyst', 'support'] },
  { id: 'greedy', name: '탐욕스러운', description: '드롭률 +1%', effectType: 'drop_bonus', value: 0.01, allowedRoles: ['hunter'] },
  { id: 'soul-hunter', name: '영혼 사냥꾼', description: '추출 성공률 +1.5%', effectType: 'extraction_bonus', value: 0.015, allowedRoles: ['hunter'] },
  { id: 'lucky', name: '행운의', description: '희귀도 롤 보조', effectType: 'extraction_quality_bonus', value: 0.01, allowedRoles: ['hunter', 'scout'] },
  { id: 'collector', name: '수집가', description: '추출 품질 롤 보조', effectType: 'extraction_quality_bonus', value: 0.015, allowedRoles: ['hunter'] },
]

const e = (type: ShadowEffectType, value: number, extra: Partial<ShadowEffect> = {}): ShadowEffect => ({ type, value, ...extra })

export const SHADOW_DEFINITIONS: ShadowDefinition[] = [
  { id: 'shadow-rat', name: '그림자 쥐', description: '틈새를 파고드는 작은 하급 그림자.', rarity: 'common', rank: 'lesser', role: 'scout', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 18, effects: [e('extra_attack_chance', 0.03)] },
  { id: 'rift-remnant', name: '균열의 잔영', description: '전투 시작을 아주 조금 안정시키는 잔류 마력.', rarity: 'common', rank: 'lesser', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 16, effects: [e('wave_start_bonus', 0.03)] },
  { id: 'shadow-sentry', name: '그림자 보초', description: '첫 피격을 받아내는 하급 수비 그림자.', rarity: 'common', rank: 'lesser', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 17, effects: [e('damage_reduction', 0.015)] },
  { id: 'shadow-scout', name: '그림자 정찰병', description: '초반 명중을 돕는 병사 그림자.', rarity: 'uncommon', rank: 'soldier', role: 'scout', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 24, effects: [e('first_turn_accuracy', 0.025)] },
  { id: 'rift-fang', name: '균열 송곳니', description: '약해진 적을 물어뜯는 공격 그림자.', rarity: 'uncommon', rank: 'soldier', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 26, effects: [e('execute_damage', 0.04)] },
  { id: 'dark-vanguard', name: '어둠의 척후', description: '추출의 흐름을 조금 더 잘 붙잡는다.', rarity: 'uncommon', rank: 'soldier', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 20, effects: [e('extraction_bonus', 0.01)] },
  { id: 'black-claw', name: '검은 발톱', description: '짧은 순간 적의 빈틈을 찢는다.', rarity: 'rare', rank: 'elite', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 34, effects: [e('bonus_damage', 0.025), e('extra_attack_chance', 0.02)] },
  { id: 'rift-tracker', name: '균열 추적자', description: '흩어진 전리품의 냄새를 따라간다.', rarity: 'rare', rank: 'elite', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 28, effects: [e('drop_bonus', 0.01)] },

  { id: 'ner-first-rift', name: '첫 균열의 네르', description: '첫 균열의 어둠에서 가장 또렷하게 남은 이름.', rarity: 'legendary', rank: 'named', role: 'scout', sourceType: 'gate_named', sourceGateRank: 'E', sourceGateId: 'gate-rift-alley', basePower: 46, effects: [e('first_turn_accuracy', 0.04), e('first_turn_evasion', 0.03), e('extraction_bonus', 0.02)], hiddenUntilObtained: true, isGateNamed: true, quote: '첫 발을 놓치지 않겠습니다.' },
  { id: 'rook-backstreet', name: '골목의 그림자 루크', description: '뒤틀린 골목을 지키던 수비형 네임드.', rarity: 'legendary', rank: 'named', role: 'guard', sourceType: 'gate_named', sourceGateRank: 'E', sourceGateId: 'gate-rift-backstreet', basePower: 50, effects: [e('damage_reduction', 0.04), e('guard_counter', 0.04), e('first_turn_evasion', 0.02)], hiddenUntilObtained: true, isGateNamed: true, quote: '비켜서지 마십시오.' },
  { id: 'lark-nest-fang', name: '둥지의 송곳니 라크', description: 'wave 전환을 사냥 신호로 받아들이는 네임드.', rarity: 'legendary', rank: 'named', role: 'assault', sourceType: 'gate_named', sourceGateRank: 'E', sourceGateId: 'gate-rift-nest', basePower: 54, effects: [e('wave_start_bonus', 0.06), e('extra_attack_chance', 0.04), e('execute_damage', 0.04)], hiddenUntilObtained: true, isGateNamed: true, quote: '다음 먹잇감은 어디입니까.' },

  { id: 'shadow-infantry', name: '그림자 보병', description: '일정 주기로 전열을 밀어붙이는 병사.', rarity: 'common', rank: 'soldier', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 38, effects: [e('extra_attack_chance', 0.035)] },
  { id: 'sloth-spawn', name: '나태의 종자', description: '방어 자세에 힘을 보탠다.', rarity: 'common', rank: 'soldier', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 36, effects: [e('damage_reduction', 0.025)] },
  { id: 'shadow-spearman', name: '그림자 창병', description: '얇게 적 방어를 찌른다.', rarity: 'common', rank: 'soldier', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 40, effects: [e('enemy_defense_down', 0.025)] },
  { id: 'sloth-guard', name: '나태의 파수병', description: '꾸준한 피해 감소를 제공한다.', rarity: 'uncommon', rank: 'elite', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 48, effects: [e('damage_reduction', 0.025)] },
  { id: 'shadow-chaser', name: '그림자 추격병', description: '적의 회피 동선을 좁힌다.', rarity: 'uncommon', rank: 'elite', role: 'scout', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 46, effects: [e('enemy_evasion_down', 0.025)] },
  { id: 'dark-executor', name: '어둠의 처형병', description: '마무리 구간에서 강해진다.', rarity: 'uncommon', rank: 'elite', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 50, effects: [e('execute_damage', 0.055)] },
  { id: 'black-shieldman', name: '검은 방패병', description: '위기 상황의 피해를 낮춘다.', rarity: 'rare', rank: 'elite', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 55, effects: [e('low_hp_defense', 0.045)] },
  { id: 'sloth-hunter', name: '나태의 사냥꾼', description: '전리품과 그림자의 흔적을 추적한다.', rarity: 'rare', rank: 'elite', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 44, effects: [e('drop_bonus', 0.015), e('extraction_bonus', 0.01)] },
  { id: 'silent-archer', name: '침묵의 궁수', description: '몇 턴마다 원거리 보조 피해를 넣는다.', rarity: 'rare', rank: 'elite', role: 'scout', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 56, effects: [e('extra_attack_chance', 0.045)] },
  { id: 'sloth-knight', name: '나태의 기사', description: '방어 이후 반격 각을 만든다.', rarity: 'epic', rank: 'knight', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 68, effects: [e('guard_counter', 0.055), e('bonus_damage', 0.025)] },
  { id: 'gorn-sloth-captain', name: '나태의 파수장 고른', description: '나태의 소굴 깊은 곳에서 방패를 들던 네임드.', rarity: 'legendary', rank: 'named', role: 'guard', sourceType: 'gate_named', sourceGateRank: 'D', sourceGateId: 'gate-lair-of-sloth', basePower: 82, effects: [e('damage_reduction', 0.055), e('guard_counter', 0.06), e('low_hp_defense', 0.06)], hiddenUntilObtained: true, isGateNamed: true, quote: '무너지지 않는 것이 전술입니다.' },
  { id: 'shark-black-chaser', name: '검은 추격자 샤크', description: '나태의 순찰로에서 선공을 빼앗던 네임드.', rarity: 'legendary', rank: 'named', role: 'scout', sourceType: 'gate_named', sourceGateRank: 'D', sourceGateId: 'gate-sloth-patrol', basePower: 78, effects: [e('first_turn_accuracy', 0.04), e('enemy_evasion_down', 0.035), e('extraction_bonus', 0.025)], hiddenUntilObtained: true, isGateNamed: true, quote: '도망치는 길을 먼저 지우겠습니다.' },

  { id: 'forgetting-recorder', name: '망각의 기록병', description: '적 방어 구조를 기록하고 흔든다.', rarity: 'uncommon', rank: 'elite', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 58, effects: [e('enemy_defense_down', 0.03)] },
  { id: 'fatigue-guardian', name: '피로의 수호병', description: '장기전에서 피해 누적을 줄인다.', rarity: 'uncommon', rank: 'elite', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 60, effects: [e('damage_reduction', 0.03)] },
  { id: 'rift-trainee', name: '균열 훈련병', description: '기본 공격의 틈에 추가타를 넣는다.', rarity: 'uncommon', rank: 'elite', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 62, effects: [e('extra_attack_chance', 0.04)] },
  { id: 'greed-hound', name: '탐욕의 사냥개', description: '전리품과 그림자의 냄새를 동시에 쫓는다.', rarity: 'uncommon', rank: 'elite', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 54, effects: [e('drop_bonus', 0.01), e('extraction_bonus', 0.01)] },
  { id: 'forgetting-scribe', name: '망각의 서기관', description: '주기적으로 적의 방어와 명중을 흔든다.', rarity: 'rare', rank: 'knight', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 72, effects: [e('enemy_defense_down', 0.04), e('enemy_evasion_down', 0.02)] },
  { id: 'fatigue-shieldman', name: '피로의 방패병', description: '방어 행동에 추가 안정성을 준다.', rarity: 'rare', rank: 'knight', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 74, effects: [e('damage_reduction', 0.04)] },
  { id: 'rift-instructor', name: '균열의 교관', description: '장착 그림자들의 움직임을 정렬한다.', rarity: 'rare', rank: 'knight', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 70, effects: [e('bonus_damage', 0.025), e('wave_start_bonus', 0.025)] },
  { id: 'greed-collector', name: '탐욕의 수집가', description: '전투 기여는 낮지만 드롭 감각이 좋다.', rarity: 'rare', rank: 'knight', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 60, effects: [e('drop_bonus', 0.02)] },
  { id: 'forgetting-watcher', name: '망각의 감시자', description: '강공격의 흐름을 예측한다.', rarity: 'epic', rank: 'knight', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 86, effects: [e('enemy_defense_down', 0.045), e('damage_reduction', 0.025)] },
  { id: 'fatigue-wall', name: '피로의 성벽', description: '큰 피해를 한 번 누그러뜨린다.', rarity: 'epic', rank: 'knight', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 90, effects: [e('damage_reduction', 0.055)] },
  { id: 'rift-gladiator', name: '균열의 투사', description: '일정 턴마다 강한 보조 타격을 날린다.', rarity: 'epic', rank: 'knight', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 92, effects: [e('bonus_damage', 0.04), e('extra_attack_chance', 0.055)] },
  { id: 'greed-devourer', name: '탐욕의 포식자', description: '처치 후 다음 wave 첫 행동이 강해진다.', rarity: 'epic', rank: 'knight', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 84, effects: [e('drop_bonus', 0.015), e('wave_start_bonus', 0.05)] },
  { id: 'karden-forgetting-scribe', name: '망각의 서기관 카르덴', description: '망각의 서고에서 약점을 색인하던 네임드.', rarity: 'legendary', rank: 'named', role: 'analyst', sourceType: 'gate_named', sourceGateRank: 'C', sourceGateId: 'gate-archive-of-forgetting', basePower: 110, effects: [e('enemy_defense_down', 0.06), e('cooldown_support', 0.025), e('skill_damage_bonus', 0.04)], hiddenUntilObtained: true, isGateNamed: true, quote: '기록된 약점은 다시 숨지 못합니다.' },
  { id: 'organ-fatigue-shield', name: '피로의 방패 오르간', description: '피로의 회랑을 막아섰던 방패 네임드.', rarity: 'legendary', rank: 'named', role: 'guard', sourceType: 'gate_named', sourceGateRank: 'C', sourceGateId: 'gate-corridor-of-fatigue', basePower: 114, effects: [e('damage_reduction', 0.06), e('guard_counter', 0.06), e('low_hp_defense', 0.05)], hiddenUntilObtained: true, isGateNamed: true, quote: '버티는 자가 마지막을 본다.' },
  { id: 'raban-rift-instructor', name: '균열의 교관 라반', description: '균열의 훈련장에서 군단의 합을 맞춘 네임드.', rarity: 'legendary', rank: 'named', role: 'support', sourceType: 'gate_named', sourceGateRank: 'C', sourceGateId: 'gate-rift-training-grounds', basePower: 108, effects: [e('bonus_damage', 0.045), e('wave_start_bonus', 0.055), e('extra_attack_chance', 0.025)], hiddenUntilObtained: true, isGateNamed: true, quote: '군단은 동시에 움직일 때 강해집니다.' },
  { id: 'grid-greed-hound', name: '탐욕의 사냥개 그리드', description: '탐욕의 금고에서 보물을 물고 사라지던 네임드.', rarity: 'legendary', rank: 'named', role: 'hunter', sourceType: 'gate_named', sourceGateRank: 'C', sourceGateId: 'gate-greed-vault', basePower: 106, effects: [e('drop_bonus', 0.025), e('extraction_quality_bonus', 0.02), e('wave_start_bonus', 0.04)], hiddenUntilObtained: true, isGateNamed: true, quote: '가치 있는 것은 냄새가 납니다.' },

  { id: 'kasim-analyst', name: '분석관 카심', description: '학습이 약점 분석으로 응축된 성취 네임드.', rarity: 'legendary', rank: 'named', role: 'analyst', sourceType: 'achievement_named', sourceQuestId: 'main-kbi-cert', unlockConditionText: 'KBI 금융 AI 리터러시 자격증 합격', basePower: 118, effects: [e('category_xp_bonus', 0.03, { category: 'finance' }), e('category_xp_bonus', 0.03, { category: 'study' }), e('enemy_defense_down', 0.04)], isAchievementNamed: true, quote: '모르는 것은 분석하면 됩니다.' },
  { id: 'rao-market-watcher', name: '시장 감시자 라오', description: '공시의 흐름을 지켜보는 성취 네임드.', rarity: 'epic', rank: 'named', role: 'analyst', sourceType: 'achievement_named', sourceQuestId: 'dungeon-dart-analysis', unlockConditionText: 'DART 공시 분석 30개 기업 완료', basePower: 94, effects: [e('stat_bonus', 2, { stat: 'SEN' }), e('extraction_bonus', 0.03)], isAchievementNamed: true },
  { id: 'charka-finance-patron', name: '금융 패트론 차르카', description: '투자 학회 합격의 후원자 그림자.', rarity: 'legendary', rank: 'named', role: 'support', sourceType: 'achievement_named', sourceQuestId: 'main-club', unlockConditionText: '투자 학회 합격', basePower: 120, effects: [e('category_xp_bonus', 0.05, { category: 'finance' }), e('category_xp_bonus', 0.05, { category: 'career' }), e('drop_bonus', 0.03)], isAchievementNamed: true },
  { id: 'nebl-black-accountant', name: '검은 회계사 네블', description: '금융 용어를 숫자로 정리하는 성취 네임드.', rarity: 'epic', rank: 'named', role: 'analyst', sourceType: 'achievement_named', sourceQuestId: 'dungeon-finance-terms', unlockConditionText: '금융 용어 정리 노트 100개 완료', basePower: 90, effects: [e('stat_bonus', 2, { stat: 'INT' }), e('category_xp_bonus', 0.03, { category: 'finance' })], isAchievementNamed: true },
  { id: 'volen-strategist', name: '전략가 볼렌', description: '백테스팅의 반복에서 태어난 전략 그림자.', rarity: 'epic', rank: 'named', role: 'support', sourceType: 'achievement_named', sourceQuestId: 'dungeon-backtest', unlockConditionText: '포트폴리오 백테스팅 12회 완료', basePower: 96, effects: [e('skill_damage_bonus', 0.035), e('stat_bonus', 1, { stat: 'SEN' }), e('stat_bonus', 1, { stat: 'INT' })], isAchievementNamed: true },
  { id: 'verk-steel-knight', name: '강철의 기사 베르크', description: '벤치프레스 100kg의 힘이 형상화된 네임드.', rarity: 'legendary', rank: 'named', role: 'assault', sourceType: 'achievement_named', sourceQuestId: 'main-bench-100', unlockConditionText: '벤치프레스 100kg 달성', basePower: 126, effects: [e('stat_bonus', 3, { stat: 'STR' }), e('bonus_damage', 0.05), e('skill_damage_bonus', 0.035)], isAchievementNamed: true, quote: '무게는 명령입니다.' },
  { id: 'raven-running-shadow', name: '질주의 그림자 레이븐', description: '5km 25분의 호흡이 남긴 빠른 그림자.', rarity: 'epic', rank: 'named', role: 'scout', sourceType: 'achievement_named', sourceQuestId: 'main-run-5k', unlockConditionText: '5km 25분 달성', basePower: 98, effects: [e('stat_bonus', 3, { stat: 'AGI' }), e('first_turn_evasion', 0.035), e('first_turn_accuracy', 0.025)], isAchievementNamed: true },
  { id: 'moro-restraint-chef', name: '절제의 조리장 모로', description: '요리 루틴에서 깨어난 지원 그림자.', rarity: 'epic', rank: 'named', role: 'support', sourceType: 'achievement_named', sourceQuestId: 'dungeon-cooking-routine', unlockConditionText: '자취 식비/요리 루틴 20회 완료', basePower: 88, effects: [e('category_xp_bonus', 0.03, { category: 'health' }), e('category_xp_bonus', 0.03, { category: 'habit' }), e('drop_bonus', 0.02)], isAchievementNamed: true },
  { id: 'nok-sleep-keeper', name: '수면의 파수꾼 노크', description: '회복 리듬의 문 앞에 선 수호 그림자.', rarity: 'epic', rank: 'named', role: 'guard', sourceType: 'achievement_named', sourceQuestId: 'dungeon-sleep-rhythm', unlockConditionText: '수면 리듬 안정화 30일 완료', basePower: 92, effects: [e('stat_bonus', 2, { stat: 'VIT' }), e('category_xp_bonus', 0.03, { category: 'habit' })], isAchievementNamed: true },
  { id: 'baron-cutting-watcher', name: '커팅의 감시자 바론', description: '72kg / 체지방 15% 목표의 냉정한 감시자.', rarity: 'legendary', rank: 'named', role: 'guard', sourceType: 'achievement_named', sourceQuestId: 'main-cut', unlockConditionText: '72kg / 체지방 15% 달성', basePower: 122, effects: [e('stat_bonus', 2, { stat: 'VIT' }), e('stat_bonus', 2, { stat: 'SEN' }), e('wave_start_bonus', 0.04)], isAchievementNamed: true },
  { id: 'irnel-registrar', name: '기록관 이르넬', description: '학점 4.0의 기록을 지키는 네임드.', rarity: 'legendary', rank: 'named', role: 'support', sourceType: 'achievement_named', sourceQuestId: 'main-gpa', unlockConditionText: '학점 4.0 이상 유지', basePower: 118, effects: [e('category_xp_bonus', 0.05, { category: 'study' }), e('stat_bonus', 2, { stat: 'INT' })], isAchievementNamed: true },
  { id: 'kalt-deadline-executor', name: '시한의 집행자 칼트', description: '마감 전에 끝내는 습관의 그림자.', rarity: 'epic', rank: 'named', role: 'scout', sourceType: 'achievement_named', sourceQuestId: 'dungeon-assignment-early', unlockConditionText: '과제 선제 처리 10회 완료', basePower: 94, effects: [e('stat_bonus', 2, { stat: 'AGI' }), e('wave_start_bonus', 0.04)], isAchievementNamed: true },
  { id: 'seron-saver', name: '절약가 세론', description: '소비 통제에서 생긴 사냥형 지원 그림자.', rarity: 'epic', rank: 'named', role: 'hunter', sourceType: 'achievement_named', sourceQuestId: 'dungeon-expense-record', unlockConditionText: '월 소비 70만원 이하 3개월 또는 생활비 기록 30일 완료', basePower: 86, effects: [e('category_xp_bonus', 0.03, { category: 'finance' }), e('category_xp_bonus', 0.03, { category: 'habit' }), e('drop_bonus', 0.02)], isAchievementNamed: true },
  { id: 'lumen-dawn-vanguard', name: '새벽의 척후 루멘', description: '이른 기상의 축적이 만든 정찰 그림자.', rarity: 'epic', rank: 'named', role: 'scout', sourceType: 'achievement_named', sourceQuestId: 'daily-sleep', unlockConditionText: '7시 전 기상 90일 또는 수면 리듬 던전 완료', basePower: 90, effects: [e('category_xp_bonus', 0.03, { category: 'habit' }), e('stat_bonus', 1, { stat: 'AGI' }), e('stat_bonus', 1, { stat: 'VIT' })], isAchievementNamed: true },
]

export const getShadowDefinition = (definitionId: string): ShadowDefinition | undefined =>
  SHADOW_DEFINITIONS.find(def => def.id === definitionId)

export const getShadowSlotCount = (hunter: HunterState): number => {
  const jobTier = hunter.jobId === 'unawakened'
    ? 0
    : hunter.unlockedJobIds.some(id => id !== 'unawakened' && id !== hunter.jobId)
      ? 1
      : 1
  const equippedJobTier = hunter.jobId === 'unawakened' ? 0 : hunter.jobId.includes('oracle') || hunter.jobId.includes('archivist') || hunter.jobId.includes('fighter') || hunter.jobId.includes('judge') || hunter.jobId.includes('harmonizer') ? 2 : jobTier
  let slots = equippedJobTier >= 2 ? 2 : equippedJobTier >= 1 ? 1 : 0
  if (hunter.level >= 30) slots += 1
  if (hunter.level >= 45) slots += 1
  if (hunter.level >= 60) slots += 1
  return Math.min(5, slots)
}

export const getValidEquippedShadowIds = (ownedShadows: OwnedShadow[] | undefined, equippedShadowIds: string[] | undefined, hunter: HunterState): string[] => {
  const ownedIds = new Set((ownedShadows ?? []).map(shadow => shadow.instanceId))
  return (equippedShadowIds ?? []).filter(id => ownedIds.has(id)).slice(0, getShadowSlotCount(hunter))
}

export const getEquippedShadows = (ownedShadows: OwnedShadow[] | undefined, equippedShadowIds: string[] | undefined, hunter: HunterState): OwnedShadow[] => {
  const validIds = getValidEquippedShadowIds(ownedShadows, equippedShadowIds, hunter)
  return validIds
    .map(id => (ownedShadows ?? []).find(shadow => shadow.instanceId === id))
    .filter((shadow): shadow is OwnedShadow => Boolean(shadow))
}

export const getShadowEffects = (shadow: OwnedShadow): ShadowEffect[] => {
  const def = getShadowDefinition(shadow.definitionId)
  const traitEffects = shadow.traits.map(trait => ({ type: trait.effectType, value: trait.value }))
  return [...(def?.effects ?? []), ...traitEffects]
}

export const getShadowEffectTotal = (
  shadows: OwnedShadow[],
  type: ShadowEffectType,
  filters: { category?: Category; stat?: StatKey } = {}
): number => shadows.reduce((sum, shadow) => {
  return sum + getShadowEffects(shadow)
    .filter(effect => effect.type === type)
    .filter(effect => !filters.category || effect.category === filters.category)
    .filter(effect => !filters.stat || effect.stat === filters.stat)
    .reduce((inner, effect) => inner + effect.value, 0)
}, 0)

export const getEquippedShadowCategoryXpBonus = (shadows: OwnedShadow[], category: Category): number =>
  Math.min(0.08, getShadowEffectTotal(shadows, 'category_xp_bonus', { category }))

export const getEquippedShadowDropBonus = (shadows: OwnedShadow[]): number =>
  Math.min(0.06, getShadowEffectTotal(shadows, 'drop_bonus'))

export const getEquippedShadowStatBonuses = (shadows: OwnedShadow[]): Partial<Record<StatKey, number>> => {
  const bonuses: Partial<Record<StatKey, number>> = {}
  for (const shadow of shadows) {
    for (const effect of getShadowEffects(shadow)) {
      if (effect.type === 'stat_bonus' && effect.stat) {
        bonuses[effect.stat] = (bonuses[effect.stat] ?? 0) + effect.value
      }
    }
  }
  return bonuses
}

export const formatShadowEffect = (effect: ShadowEffect): string => {
  const pct = `${Math.round(effect.value * 100)}%`
  switch (effect.type) {
    case 'bonus_damage': return `피해 +${pct}`
    case 'damage_reduction': return `받는 피해 -${pct}`
    case 'first_turn_accuracy': return `첫 턴 명중 +${pct}`
    case 'first_turn_evasion': return `첫 턴 회피 +${pct}`
    case 'extra_attack_chance': return `추가 공격 확률 +${pct}`
    case 'enemy_defense_down': return `적 방어 감소 ${pct}`
    case 'enemy_evasion_down': return `적 회피 감소 ${pct}`
    case 'drop_bonus': return `드롭률 +${pct}`
    case 'extraction_bonus': return `추출 성공률 +${pct}`
    case 'extraction_quality_bonus': return `추출 품질 +${pct}`
    case 'category_xp_bonus': return `${effect.category ?? 'category'} XP +${pct}`
    case 'stat_bonus': return `${effect.stat ?? 'STAT'} +${effect.value}`
    case 'skill_damage_bonus': return `스킬 피해 +${pct}`
    case 'cooldown_support': return `쿨타임 보조 ${pct}`
    case 'guard_counter': return `방어/피격 반격 +${pct}`
    case 'wave_start_bonus': return `wave 시작 보조 +${pct}`
    case 'low_hp_defense': return `저체력 방어 +${pct}`
    case 'execute_damage': return `처형 피해 +${pct}`
    default: return `${effect.type} ${effect.value}`
  }
}

const rarityWeightsByRank: Record<'E' | 'D' | 'C', Record<ShadowRarity, number>> = {
  E: { common: 55, uncommon: 28, rare: 12, epic: 4, legendary: 1 },
  D: { common: 40, uncommon: 32, rare: 18, epic: 8, legendary: 2 },
  C: { common: 25, uncommon: 30, rare: 25, epic: 15, legendary: 5 },
}

export const getShadowExtractionChance = (hunter: HunterState, gate: GateDefinition, equippedShadows: OwnedShadow[] = []): number => {
  const base = gate.rank === 'C' ? 0.25 : gate.rank === 'D' ? 0.35 : 0.45
  const senBonus = Math.min(0.15, (hunter.stats.SEN ?? 0) * 0.0015)
  const shadowBonus = Math.min(0.08, getShadowEffectTotal(equippedShadows, 'extraction_bonus'))
  return Math.max(0.1, Math.min(0.75, base + senBonus + shadowBonus))
}

const pickWeighted = <T extends string>(weights: Record<T, number>, rng: () => number): T => {
  const values = Object.values(weights) as number[]
  const total = values.reduce((sum, value) => sum + value, 0)
  let roll = rng() * total
  for (const [key, value] of Object.entries(weights) as Array<[T, number]>) {
    roll -= value
    if (roll <= 0) return key
  }
  return Object.keys(weights)[0] as T
}

const pickTrait = (definition: ShadowDefinition, rarity: ShadowRarity, rng: () => number): ShadowTrait[] => {
  if (definition.sourceType === 'achievement_named') return []
  const explicit = definition.possibleTraits
    ? SHADOW_TRAITS.filter(trait => definition.possibleTraits?.includes(trait.id))
    : []
  const pool = (explicit.length > 0 ? explicit : SHADOW_TRAITS).filter(trait =>
    (!trait.allowedRoles || trait.allowedRoles.includes(definition.role)) &&
    (!trait.allowedRarities || trait.allowedRarities.includes(rarity))
  )
  if (pool.length === 0) return []
  return [pool[Math.floor(rng() * pool.length)]]
}

const rankPoolFor = (gate: GateDefinition, rarity: ShadowRarity): ShadowDefinition[] => {
  const gateNamed = SHADOW_DEFINITIONS.filter(def =>
    def.sourceType === 'gate_named' &&
    def.sourceGateId === gate.id &&
    def.rarity === rarity
  )
  if (rarity === 'legendary' && gateNamed.length > 0) return gateNamed

  const general = SHADOW_DEFINITIONS.filter(def =>
    def.sourceType === 'gate_extract' &&
    def.sourceGateRank === gate.rank &&
    def.rarity === rarity
  )
  if (general.length > 0) return general
  if (rarity === 'epic') {
    const epicNamed = SHADOW_DEFINITIONS.filter(def =>
      def.sourceType === 'gate_named' &&
      def.sourceGateId === gate.id
    )
    if (epicNamed.length > 0) return epicNamed
  }
  return SHADOW_DEFINITIONS.filter(def =>
    def.sourceType === 'gate_extract' &&
    def.sourceGateRank === gate.rank
  )
}

export const createOwnedShadow = (definition: ShadowDefinition, rng: () => number = Math.random): OwnedShadow => ({
  instanceId: `shadow-${Date.now()}-${Math.floor(rng() * 1_000_000)}`,
  definitionId: definition.id,
  name: definition.name,
  obtainedAt: new Date().toISOString(),
  sourceType: definition.sourceType,
  sourceGateId: definition.sourceGateId,
  sourceQuestId: definition.sourceQuestId,
  rarity: definition.rarity,
  rank: definition.rank,
  role: definition.role,
  traits: pickTrait(definition, definition.rarity, rng),
  isNamed: definition.rank === 'named' || definition.isGateNamed || definition.isAchievementNamed,
  isGateNamed: definition.isGateNamed,
  isAchievementNamed: definition.isAchievementNamed,
})

export const rollShadowExtraction = (
  gate: GateDefinition,
  hunter: HunterState,
  equippedShadows: OwnedShadow[] = [],
  rng: () => number = Math.random
) => {
  const chance = getShadowExtractionChance(hunter, gate, equippedShadows)
  if (rng() > chance) {
    return {
      gateId: gate.id,
      gateName: gate.name,
      attemptedAt: new Date().toISOString(),
      success: false,
      chance,
      message: '그림자 추출에 실패했습니다. 흩어진 마력이 어둠 속으로 사라집니다.',
    }
  }

  const qualityBonus = Math.min(0.06, getShadowEffectTotal(equippedShadows, 'extraction_quality_bonus'))
  const rankKey = gate.rank === 'C' ? 'C' : gate.rank === 'D' ? 'D' : 'E'
  const baseWeights = { ...rarityWeightsByRank[rankKey] }
  baseWeights.legendary += qualityBonus * 80
  baseWeights.epic += qualityBonus * 120
  baseWeights.common = Math.max(5, baseWeights.common - qualityBonus * 120)
  const rolledRarity = pickWeighted(baseWeights, rng)
  const pool = rankPoolFor(gate, rolledRarity)
  const definition = pool[Math.floor(rng() * pool.length)] ?? pool[0]
  const shadow = createOwnedShadow(definition, rng)
  const prefix = definition.isGateNamed
    ? '평범한 그림자가 아닙니다.'
    : '그림자 추출에 성공했습니다.'
  return {
    gateId: gate.id,
    gateName: gate.name,
    attemptedAt: shadow.obtainedAt,
    success: true,
    chance,
    rolledRarity,
    shadow,
    message: `${prefix} [${SHADOW_RARITY_LABEL[shadow.rarity]}] ${shadow.name}이(가) 군단에 합류했습니다.`,
  }
}

export const getGateShadowPreview = (gate: GateDefinition): ShadowDefinition[] => {
  const general = SHADOW_DEFINITIONS.filter(def =>
    def.sourceType === 'gate_extract' &&
    def.sourceGateRank === gate.rank
  ).slice(0, 5)
  const named = SHADOW_DEFINITIONS.filter(def => def.sourceType === 'gate_named' && def.sourceGateId === gate.id)
  return [...general, ...named]
}

export const ACHIEVEMENT_SHADOWS_BY_QUEST_ID: Record<string, string[]> = SHADOW_DEFINITIONS
  .filter(def => def.sourceType === 'achievement_named' && def.sourceQuestId)
  .reduce((map, def) => {
    const questId = def.sourceQuestId as string
    map[questId] = [...(map[questId] ?? []), def.id]
    return map
  }, {} as Record<string, string[]>)
