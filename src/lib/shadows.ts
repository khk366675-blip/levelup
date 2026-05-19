import type {
  Category,
  GateDefinition,
  HunterState,
  OwnedShadow,
  ShadowDefinition,
  ShadowEffect,
  ShadowEffectType,
  ShadowInnateGrade,
  ShadowRank,
  ShadowRarity,
  ShadowRole,
  ShadowSummonTicket,
  ShadowSummonTicketSource,
  ShadowSummonTicketType,
  ShadowVisualTheme,
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

export const SHADOW_FRAGMENT_SUMMON_COST: Record<ShadowRarity, number> = {
  common: 8,
  uncommon: 12,
  rare: 20,
  epic: 35,
  legendary: 60,
}

export const SHADOW_INNATE_GRADE_LABEL: Record<ShadowInnateGrade, string> = {
  C: 'C 태생',
  B: 'B 태생',
  A: 'A 태생',
  S: 'S 태생',
}

export const SHADOW_INNATE_GRADE_MULTIPLIER: Record<ShadowInnateGrade, number> = {
  C: 0.9,
  B: 1,
  A: 1.22,
  S: 1.5,
}

const rollWeightedGrade = (weights: Record<ShadowInnateGrade, number>, rng: () => number = Math.random): ShadowInnateGrade => {
  const entries = Object.entries(weights) as Array<[ShadowInnateGrade, number]>
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = rng() * total
  for (const [grade, weight] of entries) {
    roll -= weight
    if (roll <= 0) return grade
  }
  return 'B'
}

export const rollShadowInnateGrade = (
  source: 'gate_extract' | 'normal_ticket' | 'rare_ticket' | 'role_ticket' | 'gate_named_ticket' | 'achievement_ticket' | 'main_s_achievement_ticket',
  rng: () => number = Math.random
): ShadowInnateGrade => {
  if (source === 'main_s_achievement_ticket') return rollWeightedGrade({ C: 0, B: 0, A: 60, S: 40 }, rng)
  if (source === 'achievement_ticket') return rollWeightedGrade({ C: 0, B: 20, A: 55, S: 25 }, rng)
  if (source === 'gate_named_ticket') return rollWeightedGrade({ C: 0, B: 45, A: 40, S: 15 }, rng)
  if (source === 'role_ticket') return rollWeightedGrade({ C: 25, B: 45, A: 25, S: 5 }, rng)
  if (source === 'rare_ticket') return rollWeightedGrade({ C: 20, B: 45, A: 28, S: 7 }, rng)
  if (source === 'normal_ticket') return rollWeightedGrade({ C: 55, B: 32, A: 11, S: 2 }, rng)
  return rollWeightedGrade({ C: 62, B: 30, A: 7.5, S: 0.5 }, rng)
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

type ShadowVisualPatch = Pick<
  ShadowDefinition,
  | 'visualKey'
  | 'portraitVariant'
  | 'portraitKey'
  | 'assetFamily'
  | 'visualTheme'
  | 'silhouetteType'
  | 'accentColor'
  | 'weaponShape'
  | 'headShape'
  | 'shoulderShape'
  | 'auraType'
  | 'eyeStyle'
  | 'runeStyle'
  | 'accessory'
  | 'posture'
  | 'backgroundMotif'
  | 'visualIntensity'
>

const SHADOW_ROLE_VISUAL_THEME: Record<ShadowRole, ShadowVisualTheme> = {
  assault: 'soldier',
  guard: 'guard',
  scout: 'scout',
  analyst: 'analyst',
  support: 'support',
  hunter: 'beast',
}

const SHADOW_VISUALS: Record<string, ShadowVisualPatch> = {
  'shadow-rat':        { portraitKey: 'shadow-rat',        assetFamily: 'rat',      visualKey: 'beast-rat-ember',              portraitVariant: 'rat',                  visualTheme: 'beast',   silhouetteType: 'rat',         accentColor: '#f43f5e', headShape: 'snout',        auraType: 'low-mist',       eyeStyle: 'ember-points', accessory: 'tail-whip',       posture: 'crouched',       backgroundMotif: 'claw-marks',     visualIntensity: 0.78 },
  'shadow-scout':      { portraitKey: 'shadow-scout',      assetFamily: 'scout',    visualKey: 'scout-knife-evolved',          portraitVariant: 'runner',               visualTheme: 'evolved', silhouetteType: 'scout-knife', accentColor: '#38bdf8', weaponShape: 'twin-daggers', headShape: 'hood', shoulderShape: 'light-mantle', auraType: 'speed-lines',    eyeStyle: 'visor',        accessory: 'scarf',           posture: 'leaning',        backgroundMotif: 'scan-lines',     visualIntensity: 1.08 },
  'shadow-infantry':   { portraitKey: 'shadow-infantry',   assetFamily: 'infantry', visualKey: 'soldier-blade-mantle',         portraitVariant: 'infantry',             visualTheme: 'soldier', silhouetteType: 'blade',       accentColor: '#818cf8', weaponShape: 'longsword',    headShape: 'helm', shoulderShape: 'pauldrons',    auraType: 'battle-mist',    eyeStyle: 'paired',       accessory: 'short-cape',      posture: 'braced',         backgroundMotif: 'war-rune',       visualIntensity: 0.92 },
  'dark-executor':     { portraitKey: 'dark-executor',     assetFamily: 'executor', visualKey: 'executor-greatsword-evolved',  portraitVariant: 'executioner',          visualTheme: 'evolved', silhouetteType: 'greatsword',  accentColor: '#f43f5e', weaponShape: 'execution-blade', headShape: 'horned-helm', shoulderShape: 'heavy-pauldrons', auraType: 'blood-flare', eyeStyle: 'burning-slit', accessory: 'torn-cloak',    posture: 'towering',       backgroundMotif: 'execution-sigil', visualIntensity: 1.32 },
  'forgetting-recorder': { portraitKey: 'forgetting-recorder', assetFamily: 'scribe', visualKey: 'analyst-scroll-record',      portraitVariant: 'recorder',             visualTheme: 'analyst', silhouetteType: 'scroll',      accentColor: '#22d3ee', weaponShape: 'stylus',       headShape: 'thin-hood', shoulderShape: 'narrow',       auraType: 'faint-runes',    eyeStyle: 'small-glow',   accessory: 'scrolls',         posture: 'reading',        backgroundMotif: 'paper-runes',    visualIntensity: 0.92 },
  'forgetting-scribe': { portraitKey: 'forgetting-scribe', assetFamily: 'scribe',   visualKey: 'analyst-book-evolved',         portraitVariant: 'scribe',               visualTheme: 'evolved', silhouetteType: 'book-runes',  accentColor: '#67e8f9', weaponShape: 'rune-quill',   headShape: 'scribe-cowl', shoulderShape: 'wide-robes',   auraType: 'rune-orbit',     eyeStyle: 'oracle',       accessory: 'floating-pages',  posture: 'casting',        backgroundMotif: 'archive-circle',  visualIntensity: 1.22 },
  'fatigue-guardian':  { portraitKey: 'fatigue-guardian',  assetFamily: 'shield',   visualKey: 'guard-tower-fatigue',          portraitVariant: 'guardian',             visualTheme: 'guard',   silhouetteType: 'round-shield', accentColor: '#34d399', weaponShape: 'short-spear',  headShape: 'low-helm', shoulderShape: 'stout',        auraType: 'guard-haze',     eyeStyle: 'dim',          accessory: 'small-shield',    posture: 'crouched-guard', backgroundMotif: 'shield-rune',    visualIntensity: 0.9  },
  'fatigue-shieldman': { portraitKey: 'fatigue-shieldman', assetFamily: 'shield',   visualKey: 'guard-wall-evolved',           portraitVariant: 'shieldman',            visualTheme: 'evolved', silhouetteType: 'tower-shield', accentColor: '#10b981', weaponShape: 'wall-shield',  headShape: 'fortress-helm', shoulderShape: 'wall-plates', auraType: 'barrier',        eyeStyle: 'steady',       accessory: 'fortress-lines',  posture: 'wall',           backgroundMotif: 'bastion',        visualIntensity: 1.26 },
  'greed-hound':       { portraitKey: 'greed-hound',       assetFamily: 'hound',    visualKey: 'beast-hound-greed',            portraitVariant: 'hound',                visualTheme: 'beast',   silhouetteType: 'hound',       accentColor: '#fb7185', headShape: 'fangs',          auraType: 'predator-haze',  eyeStyle: 'ember-points', accessory: 'fangs',           posture: 'pounce',         backgroundMotif: 'claw-marks',     visualIntensity: 0.98 },
  'greed-collector':   { portraitKey: 'greed-collector',   assetFamily: 'hound',    visualKey: 'hunter-collector-evolved',     portraitVariant: 'collector',            visualTheme: 'evolved', silhouetteType: 'chained-beast', accentColor: '#f59e0b', headShape: 'fangs',         auraType: 'essence-sparks', eyeStyle: 'gold-points',  accessory: 'chains-trophy',   posture: 'pounce',         backgroundMotif: 'vault-sigil',    visualIntensity: 1.24 },

  'ner-first-rift':          { portraitKey: 'ner-first-rift',          assetFamily: 'named_gate',        visualKey: 'named-first-rift-scout',   portraitVariant: 'named-scout',    visualTheme: 'named', silhouetteType: 'scout-knife',  accentColor: '#facc15', weaponShape: 'rift-dagger',      headShape: 'hood',          shoulderShape: 'light-mantle',    auraType: 'named-corona',      eyeStyle: 'star-slit',    accessory: 'first-rift-mark',  posture: 'leaning',    backgroundMotif: 'rift-star',        visualIntensity: 1.34 },
  'rook-backstreet':         { portraitKey: 'rook-backstreet',         assetFamily: 'named_gate',        visualKey: 'named-rook-guard',         portraitVariant: 'named-guard',    visualTheme: 'named', silhouetteType: 'tower-shield', accentColor: '#facc15', weaponShape: 'tower-shield',     headShape: 'fortress-helm', shoulderShape: 'wall-plates',     auraType: 'named-corona',      eyeStyle: 'steady',       accessory: 'street-crest',     posture: 'wall',       backgroundMotif: 'bastion',          visualIntensity: 1.34 },
  'lark-nest-fang':          { portraitKey: 'lark-nest-fang',          assetFamily: 'named_gate',        visualKey: 'named-lark-fang',          portraitVariant: 'named-fang',     visualTheme: 'named', silhouetteType: 'greatsword',   accentColor: '#f97316', weaponShape: 'hooked-blade',     headShape: 'horned-helm',   shoulderShape: 'spiked-pauldrons', auraType: 'blood-flare',       eyeStyle: 'burning-slit', accessory: 'fang-mantle',      posture: 'towering',   backgroundMotif: 'claw-marks',       visualIntensity: 1.36 },
  'gorn-sloth-captain':      { portraitKey: 'gorn-sloth-captain',      assetFamily: 'named_gate',        visualKey: 'named-gorn-captain',       portraitVariant: 'named-guard',    visualTheme: 'named', silhouetteType: 'tower-shield', accentColor: '#facc15', weaponShape: 'captain-spear',    headShape: 'fortress-helm', shoulderShape: 'heavy-pauldrons',  auraType: 'named-corona',      eyeStyle: 'steady',       accessory: 'captain-plume',    posture: 'wall',       backgroundMotif: 'bastion',          visualIntensity: 1.38 },
  'shark-black-chaser':      { portraitKey: 'shark-black-chaser',      assetFamily: 'named_gate',        visualKey: 'named-shark-chaser',       portraitVariant: 'named-scout',    visualTheme: 'named', silhouetteType: 'scout-knife',  accentColor: '#60a5fa', weaponShape: 'twin-daggers',     headShape: 'shark-hood',    shoulderShape: 'light-mantle',    auraType: 'speed-lines',       eyeStyle: 'predator-slit', accessory: 'shadow-tailcoat', posture: 'leaning',    backgroundMotif: 'scan-lines',       visualIntensity: 1.34 },
  'karden-forgetting-scribe':{ portraitKey: 'karden-forgetting-scribe', assetFamily: 'named_gate',       visualKey: 'named-karden-archive',     portraitVariant: 'named-analyst',  visualTheme: 'named', silhouetteType: 'book-runes',   accentColor: '#67e8f9', weaponShape: 'rune-quill',       headShape: 'scribe-cowl',   shoulderShape: 'wide-robes',      auraType: 'rune-orbit',        eyeStyle: 'oracle',       accessory: 'grand-tome',       posture: 'casting',    backgroundMotif: 'archive-circle',   visualIntensity: 1.42 },
  'organ-fatigue-shield':    { portraitKey: 'organ-fatigue-shield',    assetFamily: 'named_gate',        visualKey: 'named-organ-shield',       portraitVariant: 'named-guard',    visualTheme: 'named', silhouetteType: 'tower-shield', accentColor: '#34d399', weaponShape: 'wall-shield',      headShape: 'fortress-helm', shoulderShape: 'wall-plates',     auraType: 'barrier',           eyeStyle: 'steady',       accessory: 'fortress-lines',   posture: 'wall',       backgroundMotif: 'bastion',          visualIntensity: 1.42 },
  'raban-rift-instructor':   { portraitKey: 'raban-rift-instructor',   assetFamily: 'named_gate',        visualKey: 'named-raban-banner',       portraitVariant: 'named-support',  visualTheme: 'named', silhouetteType: 'banner',       accentColor: '#a78bfa', weaponShape: 'command-staff',    headShape: 'officer-helm',  shoulderShape: 'command-mantle',  auraType: 'command-halo',      eyeStyle: 'paired',       accessory: 'banner',           posture: 'commanding', backgroundMotif: 'war-rune',         visualIntensity: 1.32 },
  'grid-greed-hound':        { portraitKey: 'grid-greed-hound',        assetFamily: 'named_gate',        visualKey: 'named-grid-vault-hound',   portraitVariant: 'named-hunter',   visualTheme: 'named', silhouetteType: 'chained-beast', accentColor: '#f59e0b', headShape: 'fangs',              auraType: 'essence-sparks',    eyeStyle: 'gold-points',  accessory: 'chains-trophy',    posture: 'pounce',     backgroundMotif: 'vault-sigil',      visualIntensity: 1.42 },

  'kasim-analyst':           { portraitKey: 'kasim-analyst',           assetFamily: 'named_achievement', visualKey: 'achievement-kasim-oracle', portraitVariant: 'achievement-analyst', visualTheme: 'named', silhouetteType: 'book-runes',  accentColor: '#facc15', weaponShape: 'rune-quill',       headShape: 'oracle-cowl',   shoulderShape: 'wide-robes',      auraType: 'achievement-halo',  eyeStyle: 'oracle',       accessory: 'chart-tome',       posture: 'casting',    backgroundMotif: 'archive-circle',   visualIntensity: 1.42 },
  'rao-market-watcher':      { portraitKey: 'rao-market-watcher',      assetFamily: 'named_achievement', visualKey: 'achievement-rao-market',   portraitVariant: 'achievement-analyst', visualTheme: 'named', silhouetteType: 'scroll',      accentColor: '#38bdf8', weaponShape: 'stylus',           headShape: 'thin-hood',     shoulderShape: 'narrow',          auraType: 'achievement-halo',  eyeStyle: 'visor',        accessory: 'chart-scroll',     posture: 'reading',    backgroundMotif: 'market-lines',     visualIntensity: 1.24 },
  'charka-finance-patron':   { portraitKey: 'charka-finance-patron',   assetFamily: 'named_achievement', visualKey: 'achievement-charka-patron', portraitVariant: 'achievement-support', visualTheme: 'named', silhouetteType: 'banner',      accentColor: '#f59e0b', weaponShape: 'patron-staff',     headShape: 'officer-helm',  shoulderShape: 'command-mantle',  auraType: 'achievement-halo',  eyeStyle: 'gold-points',  accessory: 'coin-sigil',       posture: 'commanding', backgroundMotif: 'vault-sigil',      visualIntensity: 1.4  },
  'nebl-black-accountant':   { portraitKey: 'nebl-black-accountant',   assetFamily: 'named_achievement', visualKey: 'achievement-nebl-ledger',  portraitVariant: 'achievement-analyst', visualTheme: 'named', silhouetteType: 'book-runes',  accentColor: '#94a3b8', weaponShape: 'ledger-quill',     headShape: 'scribe-cowl',   shoulderShape: 'wide-robes',      auraType: 'paper-orbit',       eyeStyle: 'small-glow',   accessory: 'ledger',           posture: 'reading',    backgroundMotif: 'paper-runes',      visualIntensity: 1.24 },
  'volen-strategist':        { portraitKey: 'volen-strategist',        assetFamily: 'named_achievement', visualKey: 'achievement-volen-strategy',portraitVariant: 'achievement-support', visualTheme: 'named', silhouetteType: 'banner',      accentColor: '#a78bfa', weaponShape: 'command-staff',    headShape: 'officer-helm',  shoulderShape: 'command-mantle',  auraType: 'command-halo',      eyeStyle: 'visor',        accessory: 'strategy-board',   posture: 'commanding', backgroundMotif: 'war-rune',         visualIntensity: 1.28 },
  'verk-steel-knight':       { portraitKey: 'verk-steel-knight',       assetFamily: 'named_achievement', visualKey: 'achievement-verk-steel',   portraitVariant: 'achievement-assault', visualTheme: 'named', silhouetteType: 'greatsword',  accentColor: '#f43f5e', weaponShape: 'steel-greatsword', headShape: 'horned-helm',   shoulderShape: 'heavy-pauldrons',  auraType: 'achievement-halo',  eyeStyle: 'burning-slit', accessory: 'steel-plates',     posture: 'towering',   backgroundMotif: 'war-rune',         visualIntensity: 1.44 },
  'raven-running-shadow':    { portraitKey: 'raven-running-shadow',    assetFamily: 'named_achievement', visualKey: 'achievement-raven-runner', portraitVariant: 'achievement-scout',   visualTheme: 'named', silhouetteType: 'scout-knife', accentColor: '#38bdf8', weaponShape: 'twin-daggers',     headShape: 'raven-hood',    shoulderShape: 'light-mantle',    auraType: 'speed-lines',       eyeStyle: 'visor',        accessory: 'wing-scarf',       posture: 'leaning',    backgroundMotif: 'scan-lines',       visualIntensity: 1.26 },
  'moro-restraint-chef':     { portraitKey: 'moro-restraint-chef',     assetFamily: 'named_achievement', visualKey: 'achievement-moro-hearth',  portraitVariant: 'achievement-support', visualTheme: 'named', silhouetteType: 'banner',      accentColor: '#34d399', weaponShape: 'hearth-ladle',     headShape: 'keeper-hood',   shoulderShape: 'command-mantle',  auraType: 'soft-halo',         eyeStyle: 'steady',       accessory: 'hearth-mark',      posture: 'commanding', backgroundMotif: 'shield-rune',      visualIntensity: 1.18 },
  'nok-sleep-keeper':        { portraitKey: 'nok-sleep-keeper',        assetFamily: 'named_achievement', visualKey: 'achievement-nok-keeper',   portraitVariant: 'achievement-guard',   visualTheme: 'named', silhouetteType: 'round-shield', accentColor: '#60a5fa', weaponShape: 'moon-shield',     headShape: 'low-helm',      shoulderShape: 'stout',           auraType: 'soft-halo',         eyeStyle: 'dim',          accessory: 'moon-mark',        posture: 'crouched-guard', backgroundMotif: 'shield-rune',    visualIntensity: 1.18 },
  'baron-cutting-watcher':   { portraitKey: 'baron-cutting-watcher',   assetFamily: 'named_achievement', visualKey: 'achievement-baron-watch',  portraitVariant: 'achievement-guard',   visualTheme: 'named', silhouetteType: 'tower-shield', accentColor: '#f43f5e', weaponShape: 'watcher-shield',   headShape: 'fortress-helm', shoulderShape: 'wall-plates',     auraType: 'achievement-halo',  eyeStyle: 'predator-slit', accessory: 'watcher-chain',   posture: 'wall',       backgroundMotif: 'bastion',          visualIntensity: 1.36 },
  'irnel-registrar':         { portraitKey: 'irnel-registrar',         assetFamily: 'named_achievement', visualKey: 'achievement-irnel-registrar',portraitVariant: 'achievement-support', visualTheme: 'named', silhouetteType: 'scroll',      accentColor: '#67e8f9', weaponShape: 'registrar-quill',  headShape: 'scribe-cowl',   shoulderShape: 'wide-robes',      auraType: 'paper-orbit',       eyeStyle: 'oracle',       accessory: 'scrolls',          posture: 'reading',    backgroundMotif: 'archive-circle',   visualIntensity: 1.32 },
  'kalt-deadline-executor':  { portraitKey: 'kalt-deadline-executor',  assetFamily: 'named_achievement', visualKey: 'achievement-kalt-deadline', portraitVariant: 'achievement-scout',   visualTheme: 'named', silhouetteType: 'scout-knife', accentColor: '#f97316', weaponShape: 'clock-blade',      headShape: 'hood',          shoulderShape: 'light-mantle',    auraType: 'speed-lines',       eyeStyle: 'burning-slit', accessory: 'clock-sigil',      posture: 'leaning',    backgroundMotif: 'execution-sigil',  visualIntensity: 1.28 },
  'seron-saver':             { portraitKey: 'seron-saver',             assetFamily: 'named_achievement', visualKey: 'achievement-seron-saver',  portraitVariant: 'achievement-hunter',  visualTheme: 'named', silhouetteType: 'chained-beast', accentColor: '#f59e0b', headShape: 'fangs',             auraType: 'essence-sparks',    eyeStyle: 'gold-points',  accessory: 'coin-chain',       posture: 'pounce',     backgroundMotif: 'vault-sigil',      visualIntensity: 1.24 },
  'lumen-dawn-vanguard':     { portraitKey: 'lumen-dawn-vanguard',     assetFamily: 'named_achievement', visualKey: 'achievement-lumen-dawn',   portraitVariant: 'achievement-scout',   visualTheme: 'named', silhouetteType: 'scout-knife', accentColor: '#fde68a', weaponShape: 'dawn-dagger',      headShape: 'raven-hood',    shoulderShape: 'light-mantle',    auraType: 'soft-halo',         eyeStyle: 'star-slit',    accessory: 'dawn-scarf',       posture: 'leaning',    backgroundMotif: 'rift-star',        visualIntensity: 1.26 },
}

const inferShadowVisual = (definition: ShadowDefinition): ShadowVisualPatch => {
  const named = definition.isGateNamed || definition.isAchievementNamed || definition.rank === 'named'
  const visualTheme = named ? 'named' : SHADOW_ROLE_VISUAL_THEME[definition.role]
  const silhouetteType =
    definition.role === 'guard' ? 'round-shield' :
    definition.role === 'scout' ? 'scout-knife' :
    definition.role === 'analyst' ? 'scroll' :
    definition.role === 'support' ? 'banner' :
    definition.role === 'hunter' ? 'hound' :
    'blade'
  const assetFamily =
    named
      ? (definition.isAchievementNamed ? 'named_achievement' : 'named_gate')
      : definition.id.includes('spearman') ? 'spearman'
      : (definition.id.startsWith('rift-') || definition.id.startsWith('rift_')) && definition.role === 'assault' ? 'rift'
      : definition.role === 'guard'   ? 'shield'
      : definition.role === 'scout'   ? 'scout'
      : definition.role === 'analyst' ? 'scribe'
      : definition.role === 'support' ? 'support'
      : definition.role === 'hunter'  ? 'hound'
      : 'infantry'
  return {
    portraitKey: definition.id,
    assetFamily,
    visualKey: `${definition.role}-${definition.rank}-${definition.id}`,
    portraitVariant: `${definition.role}-${definition.rarity}`,
    visualTheme,
    silhouetteType,
    accentColor: named ? '#facc15' : undefined,
    weaponShape:
      definition.role === 'guard' ? 'short-spear' :
      definition.role === 'scout' ? 'twin-daggers' :
      definition.role === 'analyst' ? 'stylus' :
      definition.role === 'support' ? 'command-staff' :
      definition.role === 'hunter' ? 'fangs' :
      'longsword',
    headShape:
      definition.role === 'guard' ? 'low-helm' :
      definition.role === 'scout' ? 'hood' :
      definition.role === 'analyst' ? 'thin-hood' :
      definition.role === 'support' ? 'keeper-hood' :
      definition.role === 'hunter' ? 'fangs' :
      'helm',
    shoulderShape:
      definition.role === 'guard' ? 'stout' :
      definition.role === 'analyst' ? 'narrow' :
      definition.role === 'support' ? 'command-mantle' :
      definition.role === 'hunter' ? 'low' :
      'pauldrons',
    auraType: named ? (definition.isAchievementNamed ? 'achievement-halo' : 'named-corona') : SHADOW_ROLE_VISUAL_THEME[definition.role],
    eyeStyle: named ? 'star-slit' : undefined,
    runeStyle: named ? 'ornate' : undefined,
    accessory: definition.isAchievementNamed ? 'achievement-sigil' : definition.isGateNamed ? 'gate-sigil' : undefined,
    posture: definition.role === 'guard' ? 'crouched-guard' : definition.role === 'hunter' ? 'pounce' : definition.role === 'scout' ? 'leaning' : undefined,
    backgroundMotif: named ? (definition.isAchievementNamed ? 'rift-star' : 'war-rune') : undefined,
    visualIntensity: named ? 1.22 : 1,
  }
}

export const SHADOW_DEFINITIONS: ShadowDefinition[] = ([
  { id: 'shadow-rat', name: '그림자 쥐', description: '틈새를 파고드는 작은 하급 그림자.', rarity: 'common', rank: 'lesser', role: 'scout', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 18, effects: [e('extra_attack_chance', 0.03)], evolutionTargetDefinitionId: 'shadow-scout' },
  { id: 'rift-remnant', name: '균열의 잔영', description: '전투 시작을 아주 조금 안정시키는 잔류 마력.', rarity: 'common', rank: 'lesser', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 16, effects: [e('wave_start_bonus', 0.03)], evolutionTargetDefinitionId: 'rift-mender' },
  { id: 'dim-scribe', name: '희미한 기록병', description: '전투의 첫 약점을 더듬어 찾는 하급 분석 그림자.', rarity: 'common', rank: 'lesser', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 17, effects: [e('enemy_defense_down', 0.018)], evolutionTargetDefinitionId: 'shadow-annotator' },
  { id: 'shadow-sentry', name: '그림자 보초', description: '첫 피격을 받아내는 하급 수비 그림자.', rarity: 'common', rank: 'lesser', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 17, effects: [e('damage_reduction', 0.015)] },
  { id: 'rift-mender', name: '균열 봉합자', description: '불안정한 wave 전환을 정리하는 지원 그림자.', rarity: 'uncommon', rank: 'soldier', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 23, effects: [e('wave_start_bonus', 0.035), e('damage_reduction', 0.012)] },
  { id: 'shadow-scout', name: '그림자 정찰병', description: '초반 명중을 돕는 병사 그림자.', rarity: 'uncommon', rank: 'soldier', role: 'scout', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 24, effects: [e('first_turn_accuracy', 0.025)] },
  { id: 'rift-fang', name: '균열 송곳니', description: '약해진 적을 물어뜯는 공격 그림자.', rarity: 'uncommon', rank: 'soldier', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 26, effects: [e('execute_damage', 0.04)] },
  { id: 'dark-vanguard', name: '어둠의 척후', description: '추출의 흐름을 조금 더 잘 붙잡는다.', rarity: 'uncommon', rank: 'soldier', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 20, effects: [e('extraction_bonus', 0.01)] },
  { id: 'black-claw', name: '검은 발톱', description: '짧은 순간 적의 빈틈을 찢는다.', rarity: 'rare', rank: 'elite', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 34, effects: [e('bonus_damage', 0.025), e('extra_attack_chance', 0.02)] },
  { id: 'rift-tracker', name: '균열 추적자', description: '흩어진 전리품의 냄새를 따라간다.', rarity: 'rare', rank: 'elite', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 28, effects: [e('drop_bonus', 0.01)] },
  { id: 'paper-wisp', name: '종이 잔영', description: '약한 기록 마력이 모인 분석형 하급 그림자.', rarity: 'common', rank: 'lesser', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 15, effects: [e('enemy_evasion_down', 0.014)], evolutionTargetDefinitionId: 'archive-reader' },
  { id: 'ash-helper', name: '재의 보조병', description: '작은 방어 주문으로 선두를 받쳐준다.', rarity: 'common', rank: 'lesser', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 15, effects: [e('damage_reduction', 0.012)], evolutionTargetDefinitionId: 'ember-mender' },
  { id: 'dull-blade', name: '무딘 칼날병', description: '낮은 위력으로 꾸준히 찌르는 공격 그림자.', rarity: 'common', rank: 'lesser', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 19, effects: [e('bonus_damage', 0.016)] },
  { id: 'cracked-guard', name: '금 간 방패병', description: '불완전한 방패를 든 하급 수비 그림자.', rarity: 'common', rank: 'lesser', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 18, effects: [e('low_hp_defense', 0.018)] },
  { id: 'ember-mender', name: '잿불 치유병', description: '불안정한 전장 흐름을 고쳐 잡는 지원 그림자.', rarity: 'uncommon', rank: 'soldier', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 25, effects: [e('cooldown_support', 0.01), e('wave_start_bonus', 0.025)] },
  { id: 'archive-reader', name: '서고 판독병', description: '적의 움직임을 읽어 약점을 남긴다.', rarity: 'uncommon', rank: 'soldier', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 24, effects: [e('enemy_defense_down', 0.024)] },
  { id: 'mist-runner', name: '안개 주자', description: '흐릿한 동선으로 첫 턴을 보조한다.', rarity: 'uncommon', rank: 'soldier', role: 'scout', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 25, effects: [e('first_turn_evasion', 0.024)] },
  { id: 'bone-picker', name: '뼈 수집병', description: '작은 전리품도 놓치지 않는 사냥 그림자.', rarity: 'uncommon', rank: 'soldier', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 22, effects: [e('drop_bonus', 0.008), e('extraction_quality_bonus', 0.004)] },
  { id: 'rift-librarian', name: '균열 사서', description: '하급 기록병의 상위 개체. 방어 흐름을 색인한다.', rarity: 'rare', rank: 'elite', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 36, effects: [e('enemy_defense_down', 0.032), e('skill_damage_bonus', 0.018)] },
  { id: 'oath-carrier', name: '맹세 운반병', description: '군단의 시작 타이밍을 맞추는 지원 그림자.', rarity: 'rare', rank: 'elite', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'E', basePower: 34, effects: [e('wave_start_bonus', 0.038), e('cooldown_support', 0.012)] },

  { id: 'ner-first-rift', name: '첫 균열의 네르', description: '첫 균열의 어둠에서 가장 또렷하게 남은 이름.', rarity: 'legendary', rank: 'named', role: 'scout', sourceType: 'gate_named', sourceGateRank: 'E', sourceGateId: 'gate-rift-alley', basePower: 46, effects: [e('first_turn_accuracy', 0.04), e('first_turn_evasion', 0.03), e('extraction_bonus', 0.02)], hiddenUntilObtained: true, isGateNamed: true, quote: '첫 발을 놓치지 않겠습니다.' },
  { id: 'rook-backstreet', name: '골목의 그림자 루크', description: '뒤틀린 골목을 지키던 수비형 네임드.', rarity: 'legendary', rank: 'named', role: 'guard', sourceType: 'gate_named', sourceGateRank: 'E', sourceGateId: 'gate-rift-backstreet', basePower: 50, effects: [e('damage_reduction', 0.04), e('guard_counter', 0.04), e('first_turn_evasion', 0.02)], hiddenUntilObtained: true, isGateNamed: true, quote: '비켜서지 마십시오.' },
  { id: 'lark-nest-fang', name: '둥지의 송곳니 라크', description: 'wave 전환을 사냥 신호로 받아들이는 네임드.', rarity: 'legendary', rank: 'named', role: 'assault', sourceType: 'gate_named', sourceGateRank: 'E', sourceGateId: 'gate-rift-nest', basePower: 54, effects: [e('wave_start_bonus', 0.06), e('extra_attack_chance', 0.04), e('execute_damage', 0.04)], hiddenUntilObtained: true, isGateNamed: true, quote: '다음 먹잇감은 어디입니까.' },

  { id: 'shadow-infantry', name: '그림자 보병', description: '일정 주기로 전열을 밀어붙이는 병사.', rarity: 'common', rank: 'soldier', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 38, effects: [e('extra_attack_chance', 0.035)], evolutionTargetDefinitionId: 'dark-executor' },
  { id: 'sloth-spawn', name: '나태의 종자', description: '방어 자세에 힘을 보탠다.', rarity: 'common', rank: 'soldier', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 36, effects: [e('damage_reduction', 0.025)] },
  { id: 'shadow-spearman', name: '그림자 창병', description: '얇게 적 방어를 찌른다.', rarity: 'common', rank: 'soldier', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 40, effects: [e('enemy_defense_down', 0.025)] },
  { id: 'sloth-guard', name: '나태의 파수병', description: '꾸준한 피해 감소를 제공한다.', rarity: 'uncommon', rank: 'elite', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 48, effects: [e('damage_reduction', 0.025)] },
  { id: 'shadow-annotator', name: '그림자 주석병', description: '전투 기록에 약점 표시를 남기는 분석 그림자.', rarity: 'uncommon', rank: 'elite', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 45, effects: [e('enemy_defense_down', 0.028), e('skill_damage_bonus', 0.015)], evolutionTargetDefinitionId: 'forgetting-scribe' },
  { id: 'sloth-chorister', name: '나태의 성가병', description: '느린 박자로 방어 호흡을 맞추는 지원 그림자.', rarity: 'uncommon', rank: 'elite', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 43, effects: [e('cooldown_support', 0.012), e('damage_reduction', 0.015)], evolutionTargetDefinitionId: 'rift-instructor' },
  { id: 'shadow-chaser', name: '그림자 추격병', description: '적의 회피 동선을 좁힌다.', rarity: 'uncommon', rank: 'elite', role: 'scout', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 46, effects: [e('enemy_evasion_down', 0.025)] },
  { id: 'dark-executor', name: '어둠의 처형병', description: '마무리 구간에서 강해진다.', rarity: 'uncommon', rank: 'elite', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 50, effects: [e('execute_damage', 0.055)] },
  { id: 'black-shieldman', name: '검은 방패병', description: '위기 상황의 피해를 낮춘다.', rarity: 'rare', rank: 'elite', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 55, effects: [e('low_hp_defense', 0.045)] },
  { id: 'sloth-hunter', name: '나태의 사냥꾼', description: '전리품과 그림자의 흔적을 추적한다.', rarity: 'rare', rank: 'elite', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 44, effects: [e('drop_bonus', 0.015), e('extraction_bonus', 0.01)] },
  { id: 'silent-archer', name: '침묵의 궁수', description: '몇 턴마다 원거리 보조 피해를 넣는다.', rarity: 'rare', rank: 'elite', role: 'scout', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 56, effects: [e('extra_attack_chance', 0.045)] },
  { id: 'drowsy-medic', name: '졸음 의무병', description: '느린 호흡으로 장기전 피해를 완화한다.', rarity: 'common', rank: 'soldier', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 35, effects: [e('damage_reduction', 0.022)], evolutionTargetDefinitionId: 'sloth-chorister' },
  { id: 'ledger-imp', name: '장부 임프', description: '전리품과 약점 기록을 동시에 남기는 분석 그림자.', rarity: 'common', rank: 'soldier', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 34, effects: [e('enemy_defense_down', 0.022)], evolutionTargetDefinitionId: 'shadow-annotator' },
  { id: 'rust-axeman', name: '녹슨 도끼병', description: '무거운 첫 타격을 노리는 공격 그림자.', rarity: 'common', rank: 'soldier', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 41, effects: [e('execute_damage', 0.032)] },
  { id: 'lantern-scout', name: '등불 정찰병', description: '어둠 속에서 회피선을 밝혀낸다.', rarity: 'uncommon', rank: 'elite', role: 'scout', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 47, effects: [e('first_turn_accuracy', 0.026), e('enemy_evasion_down', 0.014)], evolutionTargetDefinitionId: 'silent-archer' },
  { id: 'mire-shield', name: '늪 방패병', description: '진흙처럼 느리지만 단단한 방어 그림자.', rarity: 'uncommon', rank: 'elite', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 49, effects: [e('damage_reduction', 0.028), e('low_hp_defense', 0.018)], evolutionTargetDefinitionId: 'black-shieldman' },
  { id: 'ravenous-pup', name: '굶주린 사냥견', description: '추출 흔적을 물고 늘어지는 사냥 그림자.', rarity: 'uncommon', rank: 'elite', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 43, effects: [e('extraction_bonus', 0.012), e('drop_bonus', 0.008)], evolutionTargetDefinitionId: 'sloth-hunter' },
  { id: 'minute-caller', name: '분침 호출병', description: '짧은 명령으로 스킬 흐름을 앞당긴다.', rarity: 'rare', rank: 'elite', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 57, effects: [e('cooldown_support', 0.018), e('wave_start_bonus', 0.026)] },
  { id: 'black-annotator', name: '검은 주석관', description: '적 방어와 스킬 타이밍을 함께 분석한다.', rarity: 'rare', rank: 'elite', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 58, effects: [e('enemy_defense_down', 0.036), e('skill_damage_bonus', 0.022)] },
  { id: 'sloth-raider', name: '나태의 약탈병', description: '느린 적의 빈틈을 뜯어내는 사냥형 그림자.', rarity: 'rare', rank: 'elite', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 53, effects: [e('drop_bonus', 0.018), e('execute_damage', 0.024)] },
  { id: 'sloth-knight', name: '나태의 기사', description: '방어 이후 반격 각을 만든다.', rarity: 'epic', rank: 'knight', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 68, effects: [e('guard_counter', 0.055), e('bonus_damage', 0.025)] },
  { id: 'archive-duelist', name: '서고 결투병', description: '분석한 약점을 직접 찌르는 공격형 분석 그림자.', rarity: 'epic', rank: 'knight', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'D', basePower: 69, effects: [e('enemy_defense_down', 0.04), e('bonus_damage', 0.03)] },
  { id: 'gorn-sloth-captain', name: '나태의 파수장 고른', description: '나태의 소굴 깊은 곳에서 방패를 들던 네임드.', rarity: 'legendary', rank: 'named', role: 'guard', sourceType: 'gate_named', sourceGateRank: 'D', sourceGateId: 'gate-lair-of-sloth', basePower: 82, effects: [e('damage_reduction', 0.055), e('guard_counter', 0.06), e('low_hp_defense', 0.06)], hiddenUntilObtained: true, isGateNamed: true, quote: '무너지지 않는 것이 전술입니다.' },
  { id: 'shark-black-chaser', name: '검은 추격자 샤크', description: '나태의 순찰로에서 선공을 빼앗던 네임드.', rarity: 'legendary', rank: 'named', role: 'scout', sourceType: 'gate_named', sourceGateRank: 'D', sourceGateId: 'gate-sloth-patrol', basePower: 78, effects: [e('first_turn_accuracy', 0.04), e('enemy_evasion_down', 0.035), e('extraction_bonus', 0.025)], hiddenUntilObtained: true, isGateNamed: true, quote: '도망치는 길을 먼저 지우겠습니다.' },

  { id: 'forgetting-recorder', name: '망각의 기록병', description: '적 방어 구조를 기록하고 흔든다.', rarity: 'uncommon', rank: 'elite', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 58, effects: [e('enemy_defense_down', 0.03)], evolutionTargetDefinitionId: 'forgetting-scribe' },
  { id: 'fatigue-guardian', name: '피로의 수호병', description: '장기전에서 피해 누적을 줄인다.', rarity: 'uncommon', rank: 'elite', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 60, effects: [e('damage_reduction', 0.03)], evolutionTargetDefinitionId: 'fatigue-shieldman' },
  { id: 'rift-trainee', name: '균열 훈련병', description: '기본 공격의 틈에 추가타를 넣는다.', rarity: 'uncommon', rank: 'elite', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 62, effects: [e('extra_attack_chance', 0.04)] },
  { id: 'greed-hound', name: '탐욕의 사냥개', description: '전리품과 그림자의 냄새를 동시에 쫓는다.', rarity: 'uncommon', rank: 'elite', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 54, effects: [e('drop_bonus', 0.01), e('extraction_bonus', 0.01)], evolutionTargetDefinitionId: 'greed-collector' },
  { id: 'forgetting-scribe', name: '망각의 서기관', description: '주기적으로 적의 방어와 명중을 흔든다.', rarity: 'rare', rank: 'knight', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 72, effects: [e('enemy_defense_down', 0.04), e('enemy_evasion_down', 0.02)] },
  { id: 'fatigue-shieldman', name: '피로의 방패병', description: '방어 행동에 추가 안정성을 준다.', rarity: 'rare', rank: 'knight', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 74, effects: [e('damage_reduction', 0.04)] },
  { id: 'rift-instructor', name: '균열의 교관', description: '장착 그림자들의 움직임을 정렬한다.', rarity: 'rare', rank: 'knight', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 70, effects: [e('bonus_damage', 0.025), e('wave_start_bonus', 0.025)] },
  { id: 'greed-collector', name: '탐욕의 수집가', description: '전투 기여는 낮지만 드롭 감각이 좋다.', rarity: 'rare', rank: 'knight', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 60, effects: [e('drop_bonus', 0.02)] },
  { id: 'rift-wayfinder', name: '균열 길잡이', description: '복잡한 전장 동선을 먼저 읽어 출전을 돕는다.', rarity: 'rare', rank: 'knight', role: 'scout', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 76, effects: [e('first_turn_accuracy', 0.035), e('wave_start_bonus', 0.025)] },
  { id: 'forgetting-watcher', name: '망각의 감시자', description: '강공격의 흐름을 예측한다.', rarity: 'epic', rank: 'knight', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 86, effects: [e('enemy_defense_down', 0.045), e('damage_reduction', 0.025)] },
  { id: 'rift-tactician', name: '균열 전술관', description: '군단의 타이밍을 엮어 스킬 피해와 wave 대응을 보조한다.', rarity: 'epic', rank: 'knight', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 88, effects: [e('skill_damage_bonus', 0.035), e('wave_start_bonus', 0.04)] },
  { id: 'fatigue-wall', name: '피로의 성벽', description: '큰 피해를 한 번 누그러뜨린다.', rarity: 'epic', rank: 'knight', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 90, effects: [e('damage_reduction', 0.055)] },
  { id: 'rift-gladiator', name: '균열의 투사', description: '일정 턴마다 강한 보조 타격을 날린다.', rarity: 'epic', rank: 'knight', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 92, effects: [e('bonus_damage', 0.04), e('extra_attack_chance', 0.055)] },
  { id: 'greed-devourer', name: '탐욕의 포식자', description: '처치 후 다음 wave 첫 행동이 강해진다.', rarity: 'epic', rank: 'knight', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 84, effects: [e('drop_bonus', 0.015), e('wave_start_bonus', 0.05)] },
  { id: 'rift-cartographer', name: '균열 지도병', description: '복잡한 C급 게이트 동선을 지도처럼 펼친다.', rarity: 'uncommon', rank: 'elite', role: 'scout', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 59, effects: [e('first_turn_accuracy', 0.028), e('enemy_evasion_down', 0.018)], evolutionTargetDefinitionId: 'rift-wayfinder' },
  { id: 'fatigue-cantor', name: '피로의 선창병', description: '피로한 군단의 박자를 다시 맞춘다.', rarity: 'uncommon', rank: 'elite', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 57, effects: [e('cooldown_support', 0.016), e('damage_reduction', 0.018)], evolutionTargetDefinitionId: 'rift-instructor' },
  { id: 'greed-ledger', name: '탐욕 장부병', description: '전리품 가치를 미리 계산하는 분석 그림자.', rarity: 'rare', rank: 'knight', role: 'analyst', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 71, effects: [e('drop_bonus', 0.012), e('enemy_defense_down', 0.028)], evolutionTargetDefinitionId: 'forgetting-watcher' },
  { id: 'corridor-banner', name: '회랑 기수', description: '원정과 wave 전환에서 군단을 정렬한다.', rarity: 'rare', rank: 'knight', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 73, effects: [e('wave_start_bonus', 0.036), e('skill_damage_bonus', 0.02)], evolutionTargetDefinitionId: 'rift-tactician' },
  { id: 'mirror-hunter', name: '거울 사냥꾼', description: '희귀한 추출 흔적의 품질을 조금 끌어올린다.', rarity: 'rare', rank: 'knight', role: 'hunter', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 67, effects: [e('extraction_quality_bonus', 0.014), e('drop_bonus', 0.012)], evolutionTargetDefinitionId: 'greed-devourer' },
  { id: 'iron-bastion', name: '철의 보루', description: '방패병 계열의 상위 분기. 낮은 체력에서 매우 단단하다.', rarity: 'epic', rank: 'knight', role: 'guard', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 92, effects: [e('low_hp_defense', 0.06), e('damage_reduction', 0.036)] },
  { id: 'rift-champion', name: '균열 투장', description: '훈련병 계열의 상위 분기. 추가타와 처형을 겸한다.', rarity: 'epic', rank: 'knight', role: 'assault', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 94, effects: [e('extra_attack_chance', 0.045), e('execute_damage', 0.042)] },
  { id: 'midnight-oracle', name: '자정의 예언병', description: '장기전에서 스킬 피해를 안정적으로 보조한다.', rarity: 'epic', rank: 'knight', role: 'support', sourceType: 'gate_extract', sourceGateRank: 'C', basePower: 86, effects: [e('cooldown_support', 0.024), e('skill_damage_bonus', 0.034)] },
  { id: 'karden-forgetting-scribe', name: '망각의 서기관 카르덴', description: '망각의 서고에서 약점을 색인하던 네임드.', rarity: 'legendary', rank: 'named', role: 'analyst', sourceType: 'gate_named', sourceGateRank: 'C', sourceGateId: 'gate-archive-of-forgetting', basePower: 110, effects: [e('enemy_defense_down', 0.06), e('cooldown_support', 0.025), e('skill_damage_bonus', 0.04)], hiddenUntilObtained: true, isGateNamed: true, quote: '기록된 약점은 다시 숨지 못합니다.' },
  { id: 'organ-fatigue-shield', name: '피로의 방패 오르간', description: '피로의 회랑을 막아섰던 방패 네임드.', rarity: 'legendary', rank: 'named', role: 'guard', sourceType: 'gate_named', sourceGateRank: 'C', sourceGateId: 'gate-corridor-of-fatigue', basePower: 114, effects: [e('damage_reduction', 0.06), e('guard_counter', 0.06), e('low_hp_defense', 0.05)], hiddenUntilObtained: true, isGateNamed: true, quote: '버티는 자가 마지막을 본다.' },
  { id: 'raban-rift-instructor', name: '균열의 교관 라반', description: '균열의 훈련장에서 군단의 합을 맞춘 네임드.', rarity: 'legendary', rank: 'named', role: 'support', sourceType: 'gate_named', sourceGateRank: 'C', sourceGateId: 'gate-rift-training-grounds', basePower: 108, effects: [e('bonus_damage', 0.045), e('wave_start_bonus', 0.055), e('extra_attack_chance', 0.025)], hiddenUntilObtained: true, isGateNamed: true, quote: '군단은 동시에 움직일 때 강해집니다.' },
  { id: 'grid-greed-hound', name: '탐욕의 사냥개 그리드', description: '탐욕의 금고에서 보물을 물고 사라지던 네임드.', rarity: 'legendary', rank: 'named', role: 'hunter', sourceType: 'gate_named', sourceGateRank: 'C', sourceGateId: 'gate-greed-vault', basePower: 106, effects: [e('drop_bonus', 0.025), e('extraction_quality_bonus', 0.02), e('wave_start_bonus', 0.04)], hiddenUntilObtained: true, isGateNamed: true, quote: '가치 있는 것은 냄새가 납니다.' },
  { id: 'vela-rift-mender', name: '균열 봉합자 벨라', description: '골목 균열을 닫던 지원형 네임드.', rarity: 'legendary', rank: 'named', role: 'support', sourceType: 'gate_named', sourceGateRank: 'E', sourceGateId: 'gate-rift-alley', basePower: 48, effects: [e('wave_start_bonus', 0.05), e('cooldown_support', 0.018)], hiddenUntilObtained: true, isGateNamed: true, quote: '틈은 작을 때 닫아야 합니다.' },
  { id: 'marn-backstreet-ledger', name: '골목 장부관 마른', description: '골목의 이동 경로를 기록하던 분석형 네임드.', rarity: 'legendary', rank: 'named', role: 'analyst', sourceType: 'gate_named', sourceGateRank: 'E', sourceGateId: 'gate-rift-backstreet', basePower: 49, effects: [e('enemy_defense_down', 0.048), e('first_turn_accuracy', 0.026)], hiddenUntilObtained: true, isGateNamed: true },
  { id: 'doru-sloth-cantor', name: '나태의 선창자 도루', description: '소굴 안쪽에서 파수병들의 호흡을 맞춘 네임드.', rarity: 'legendary', rank: 'named', role: 'support', sourceType: 'gate_named', sourceGateRank: 'D', sourceGateId: 'gate-lair-of-sloth', basePower: 79, effects: [e('damage_reduction', 0.036), e('cooldown_support', 0.026), e('wave_start_bonus', 0.03)], hiddenUntilObtained: true, isGateNamed: true },
  { id: 'sable-patrol-knife', name: '순찰검 세이블', description: '나태의 순찰로에서 선공을 빼앗던 공격형 네임드.', rarity: 'legendary', rank: 'named', role: 'assault', sourceType: 'gate_named', sourceGateRank: 'D', sourceGateId: 'gate-sloth-patrol', basePower: 80, effects: [e('bonus_damage', 0.045), e('extra_attack_chance', 0.036), e('execute_damage', 0.03)], hiddenUntilObtained: true, isGateNamed: true },
  { id: 'mero-fatigue-reader', name: '피로 판독관 메로', description: '회랑의 피로도를 수치처럼 읽어내던 분석형 네임드.', rarity: 'legendary', rank: 'named', role: 'analyst', sourceType: 'gate_named', sourceGateRank: 'C', sourceGateId: 'gate-corridor-of-fatigue', basePower: 109, effects: [e('enemy_defense_down', 0.052), e('enemy_evasion_down', 0.03), e('skill_damage_bonus', 0.025)], hiddenUntilObtained: true, isGateNamed: true },
  { id: 'tess-rift-wayfinder', name: '균열 길잡이 테스', description: '훈련장 깊은 길을 먼저 밟는 정찰형 네임드.', rarity: 'legendary', rank: 'named', role: 'scout', sourceType: 'gate_named', sourceGateRank: 'C', sourceGateId: 'gate-rift-training-grounds', basePower: 107, effects: [e('first_turn_accuracy', 0.046), e('first_turn_evasion', 0.036), e('wave_start_bonus', 0.036)], hiddenUntilObtained: true, isGateNamed: true },
  { id: 'balm-greed-ledger', name: '탐욕 장부관 발름', description: '금고의 전리품 가치를 숫자로 매기던 네임드.', rarity: 'legendary', rank: 'named', role: 'analyst', sourceType: 'gate_named', sourceGateRank: 'C', sourceGateId: 'gate-greed-vault', basePower: 105, effects: [e('drop_bonus', 0.022), e('extraction_quality_bonus', 0.018), e('enemy_defense_down', 0.035)], hiddenUntilObtained: true, isGateNamed: true },

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
  { id: 'hexa-study-lantern', name: '학습 등불 헥사', description: '반복 학습의 불씨에서 태어난 지원 네임드.', rarity: 'epic', rank: 'named', role: 'support', sourceType: 'achievement_named', sourceCategory: 'study', unlockConditionText: '학습 계열 성취 소환권 후보', basePower: 92, effects: [e('category_xp_bonus', 0.035, { category: 'study' }), e('cooldown_support', 0.018)], isAchievementNamed: true },
  { id: 'mira-career-auditor', name: '커리어 감사관 미라', description: '보고서와 마감의 흔적을 점검하는 분석 네임드.', rarity: 'epic', rank: 'named', role: 'analyst', sourceType: 'achievement_named', sourceCategory: 'career', unlockConditionText: '커리어 계열 성취 소환권 후보', basePower: 94, effects: [e('category_xp_bonus', 0.035, { category: 'career' }), e('enemy_defense_down', 0.034)], isAchievementNamed: true },
  { id: 'borin-training-captain', name: '수련대장 보린', description: '훈련 기록이 만든 공격형 성취 네임드.', rarity: 'legendary', rank: 'named', role: 'assault', sourceType: 'achievement_named', sourceCategory: 'workout', unlockConditionText: '운동 계열 성취 소환권 후보', basePower: 121, effects: [e('category_xp_bonus', 0.04, { category: 'workout' }), e('bonus_damage', 0.045), e('stat_bonus', 2, { stat: 'STR' })], isAchievementNamed: true },
  { id: 'sena-health-warden', name: '건강 감시관 세나', description: '회복 루틴을 지키는 방어형 성취 네임드.', rarity: 'epic', rank: 'named', role: 'guard', sourceType: 'achievement_named', sourceCategory: 'health', unlockConditionText: '건강 계열 성취 소환권 후보', basePower: 91, effects: [e('category_xp_bonus', 0.035, { category: 'health' }), e('damage_reduction', 0.035)], isAchievementNamed: true },
  { id: 'orien-mind-anchor', name: '정신의 닻 오리엔', description: '흔들림을 붙잡아주는 지원형 성취 네임드.', rarity: 'legendary', rank: 'named', role: 'support', sourceType: 'achievement_named', sourceCategory: 'mind', unlockConditionText: '정신 계열 성취 소환권 후보', basePower: 116, effects: [e('category_xp_bonus', 0.045, { category: 'mind' }), e('cooldown_support', 0.025), e('damage_reduction', 0.02)], isAchievementNamed: true },
  { id: 'pavel-finance-scout', name: '재정 정찰관 파벨', description: '숫자 흐름을 먼저 발견하는 정찰 네임드.', rarity: 'epic', rank: 'named', role: 'scout', sourceType: 'achievement_named', sourceCategory: 'finance', unlockConditionText: '재정 계열 성취 소환권 후보', basePower: 93, effects: [e('category_xp_bonus', 0.035, { category: 'finance' }), e('first_turn_accuracy', 0.035), e('drop_bonus', 0.014)], isAchievementNamed: true },
  { id: 'naru-social-herald', name: '관계 전령 나루', description: '연결과 약속의 흐름에서 태어난 지원 네임드.', rarity: 'epic', rank: 'named', role: 'support', sourceType: 'achievement_named', sourceCategory: 'social', unlockConditionText: '관계 계열 성취 소환권 후보', basePower: 88, effects: [e('category_xp_bonus', 0.035, { category: 'social' }), e('wave_start_bonus', 0.035)], isAchievementNamed: true },
  { id: 'voss-challenge-blade', name: '도전검 보스', description: '연속 도전의 압력을 칼날로 바꾼 네임드.', rarity: 'legendary', rank: 'named', role: 'assault', sourceType: 'achievement_named', sourceCategory: 'challenge', unlockConditionText: '도전 계열 성취 소환권 후보', basePower: 124, effects: [e('category_xp_bonus', 0.04, { category: 'challenge' }), e('skill_damage_bonus', 0.04), e('execute_damage', 0.035)], isAchievementNamed: true },
  { id: 'runo-habit-keeper', name: '습관 보관자 루노', description: '반복을 기록하고 지키는 성취 네임드.', rarity: 'epic', rank: 'named', role: 'guard', sourceType: 'achievement_named', sourceCategory: 'habit', unlockConditionText: '습관 계열 성취 소환권 후보', basePower: 90, effects: [e('category_xp_bonus', 0.035, { category: 'habit' }), e('low_hp_defense', 0.04)], isAchievementNamed: true },
  { id: 'elan-balance-weaver', name: '균형 직조자 엘란', description: '여러 분야를 고르게 완수한 기록이 부른 네임드.', rarity: 'legendary', rank: 'named', role: 'analyst', sourceType: 'achievement_named', sourceCategory: 'challenge', unlockConditionText: '상위 성취 소환권 후보', basePower: 120, effects: [e('category_xp_bonus', 0.025, { category: 'study' }), e('category_xp_bonus', 0.025, { category: 'workout' }), e('category_xp_bonus', 0.025, { category: 'habit' }), e('enemy_defense_down', 0.038)], isAchievementNamed: true },
] as ShadowDefinition[]).map(definition => ({
  ...definition,
  birthRarity: definition.birthRarity ?? definition.rarity,
  ...inferShadowVisual(definition),
  ...SHADOW_VISUALS[definition.id],
}))

export const getShadowDefinition = (definitionId: string): ShadowDefinition | undefined =>
  SHADOW_DEFINITIONS.find(def => def.id === definitionId)

export const getShadowSlotCount = (hunter: HunterState): number => {
  // 12-11B: level-based simple policy for "legion" feel
  let slots = 1
  if (hunter.level >= 10) slots += 1
  if (hunter.level >= 20) slots += 1
  if (hunter.level >= 30) slots += 1
  if (hunter.level >= 45) slots += 1
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

const COMBAT_EFFECT_TYPES: Set<ShadowEffectType> = new Set([
  'bonus_damage', 'damage_reduction', 'first_turn_accuracy', 'first_turn_evasion',
  'extra_attack_chance', 'enemy_defense_down', 'enemy_evasion_down',
  'skill_damage_bonus', 'guard_counter', 'wave_start_bonus', 'low_hp_defense', 'execute_damage',
])

export const getCombatEnhancementMultiplier = (level: number): number => 1 + level * 0.06
export const getUtilityEnhancementMultiplier = (level: number): number => 1 + level * 0.03

export const getCombatLevelMultiplier = (level: number): number => 1 + (level - 1) * 0.01
export const getUtilityLevelMultiplier = (level: number): number => 1 + (level - 1) * 0.005

export const getShadowEffects = (shadow: OwnedShadow): ShadowEffect[] => {
  const def = getShadowDefinition(shadow.definitionId)
  const enh = shadow.enhancementLevel ?? 0
  const lv = shadow.level ?? 1
  const innateMul = SHADOW_INNATE_GRADE_MULTIPLIER[shadow.innateGrade ?? 'B'] ?? 1
  const combatMul = getCombatEnhancementMultiplier(enh) * getCombatLevelMultiplier(lv)
  const utilMul = getUtilityEnhancementMultiplier(enh) * getUtilityLevelMultiplier(lv)
  const applyMul = (effects: ShadowEffect[]): ShadowEffect[] => effects.map(effect => ({
    ...effect,
    value: COMBAT_EFFECT_TYPES.has(effect.type)
      ? effect.value * innateMul * combatMul
      : effect.value * innateMul * utilMul,
  }))
  const baseEffects = applyMul(def?.effects ?? [])
  const traitEffects = applyMul(shadow.traits.map(trait => ({ type: trait.effectType, value: trait.value })))
  const secretTraitEffects = (shadow.secretTraits ?? []).flatMap((trait): ShadowEffect[] => {
    if (trait === 'silent-oath') {
      return [
        { type: 'category_xp_bonus', value: 0.01, category: 'challenge' },
        { type: 'drop_bonus', value: 0.005 },
      ]
    }
    return []
  })
  return [...baseEffects, ...traitEffects, ...secretTraitEffects]
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
  const base = gate.rank === 'C' ? 0.32 : gate.rank === 'D' ? 0.42 : 0.52
  const senBonus = Math.min(0.15, (hunter.stats.SEN ?? 0) * 0.0015)
  const shadowBonus = Math.min(0.08, getShadowEffectTotal(equippedShadows, 'extraction_bonus'))
  return Math.max(0.1, Math.min(0.80, base + senBonus + shadowBonus))
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

export const createOwnedShadow = (
  definition: ShadowDefinition,
  rng: () => number = Math.random,
  options: { innateGrade?: ShadowInnateGrade; innateSource?: Parameters<typeof rollShadowInnateGrade>[0] } = {}
): OwnedShadow => ({
  instanceId: `shadow-${Date.now()}-${Math.floor(rng() * 1_000_000)}`,
  definitionId: definition.id,
  name: definition.name,
  obtainedAt: new Date().toISOString(),
  sourceType: definition.sourceType,
  sourceGateId: definition.sourceGateId,
  sourceQuestId: definition.sourceQuestId,
  rarity: definition.rarity,
  birthRarity: definition.birthRarity ?? definition.rarity,
  innateGrade: options.innateGrade ?? rollShadowInnateGrade(options.innateSource ?? (definition.sourceType === 'gate_extract' ? 'gate_extract' : 'normal_ticket'), rng),
  rank: definition.rank,
  role: definition.role,
  traits: pickTrait(definition, definition.rarity, rng),
  isNamed: definition.rank === 'named' || definition.isGateNamed || definition.isAchievementNamed,
  isGateNamed: definition.isGateNamed,
  isAchievementNamed: definition.isAchievementNamed,
})

export const createShadowSummonTicket = (params: {
  ticketType: ShadowSummonTicketType
  source?: ShadowSummonTicketSource
  label?: string
  definitionId?: string
  role?: ShadowRole
  category?: Category
  grade?: ShadowSummonTicket['grade']
  rarityFloor?: ShadowRarity
}): ShadowSummonTicket => ({
  id: `shadow-ticket-${params.ticketType}-${Date.now()}-${Math.floor(Math.random() * 100_000)}`,
  ticketType: params.ticketType,
  kind: params.ticketType === 'achievement_named_shadow' || params.ticketType === 'category_achievement_named' ? 'achievement_named' : 'standard',
  label: params.label ?? (
    params.ticketType === 'normal_shadow' ? '일반 그림자 소환권' :
    params.ticketType === 'rare_shadow' ? '희귀 그림자 소환권' :
    params.ticketType === 'role_shadow' ? `${params.role ? SHADOW_ROLE_LABEL[params.role] : '역할'} 그림자 소환권` :
    params.ticketType === 'gate_named_shadow' ? '게이트 네임드 그림자 소환권' :
    params.ticketType === 'achievement_named_shadow' ? '성취 네임드 소환권' :
    `${params.category ?? '분야'} 성취 네임드 소환권`
  ),
  createdAt: new Date().toISOString(),
  source: params.source ?? 'system',
  definitionId: params.definitionId,
  role: params.role,
  category: params.category,
  grade: params.grade,
  rarityFloor: params.rarityFloor,
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
  const shadow = createOwnedShadow(definition, rng, { innateSource: 'gate_extract' })
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

export const MAX_SHADOW_ENHANCEMENT_LEVEL = 5

export const SHADOW_DECOMPOSE_ESSENCE: Record<ShadowRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 5,
  epic: 12,
  legendary: 30,
}

export const getShadowAbsorbMaterialCount = (
  target: OwnedShadow,
  ownedShadows: OwnedShadow[] | undefined,
  equippedShadowIds: string[] | undefined
): number => {
  const equippedSet = new Set(equippedShadowIds ?? [])
  return (ownedShadows ?? []).filter(
    s => s.definitionId === target.definitionId && s.instanceId !== target.instanceId && !equippedSet.has(s.instanceId) && !s.isLocked && !s.isAchievementNamed
  ).length
}

export const canAbsorbShadow = (
  target: OwnedShadow,
  ownedShadows: OwnedShadow[] | undefined,
  equippedShadowIds: string[] | undefined
): boolean => {
  if ((target.enhancementLevel ?? 0) >= MAX_SHADOW_ENHANCEMENT_LEVEL) return false
  if (target.isAchievementNamed) return false
  return getShadowAbsorbMaterialCount(target, ownedShadows, equippedShadowIds) > 0
}

export const canDecomposeShadow = (
  shadow: OwnedShadow,
  equippedShadowIds: string[] | undefined
): boolean => {
  const equippedSet = new Set(equippedShadowIds ?? [])
  if (equippedSet.has(shadow.instanceId)) return false
  if (shadow.isAchievementNamed) return false
  if (shadow.isLocked) return false
  return true
}

export const getShadowMaxLevel = (shadow: OwnedShadow): number => {
  if (shadow.isAchievementNamed) return 30
  if (shadow.isGateNamed) return 25
  return 20
}

export const getShadowXpForNextLevel = (level: number): number => {
  if (level < 1) return getShadowXpForNextLevel(1)
  return Math.max(1, Math.round(20 * Math.pow(level, 1.35)))
}

export const addShadowXp = (shadow: OwnedShadow, amount: number): { shadow: OwnedShadow; leveledUp: boolean; newLevel: number } => {
  const maxLevel = getShadowMaxLevel(shadow)
  let level = shadow.level ?? 1
  let xp = (shadow.xp ?? 0) + amount
  let leveledUp = false

  while (level < maxLevel) {
    const required = getShadowXpForNextLevel(level)
    if (xp < required) break
    xp -= required
    level += 1
    leveledUp = true
  }

  if (level >= maxLevel) {
    level = maxLevel
    xp = 0
  }

  return { shadow: { ...shadow, level, xp }, leveledUp, newLevel: level }
}

export const getShadowXpReward = (gateRank: string, outcome: 'victory' | 'defeat' | 'draw'): number => {
  const base: Record<string, { victory: number; defeat: number; draw: number }> = {
    E: { victory: 12, defeat: 4, draw: 0 },
    D: { victory: 22, defeat: 7, draw: 0 },
    C: { victory: 38, defeat: 12, draw: 0 },
    B: { victory: 60, defeat: 18, draw: 0 },
    A: { victory: 90, defeat: 25, draw: 0 },
    S: { victory: 130, defeat: 35, draw: 0 },
  }
  return base[gateRank]?.[outcome] ?? 0
}

const EVOLUTION_COST: Record<string, number> = {
  common: 10,
  uncommon: 25,
  rare: 60,
}

export const getEvolutionCost = (shadow: OwnedShadow): number => {
  return EVOLUTION_COST[shadow.rarity] ?? 0
}

export const canEvolveShadow = (shadow: OwnedShadow, shadowEssence: number = 0): { canEvolve: boolean; reason?: string; cost?: number; targetDefinition?: ShadowDefinition } => {
  const def = getShadowDefinition(shadow.definitionId)
  if (!def?.evolutionTargetDefinitionId) return { canEvolve: false, reason: '진화 대상 없음' }
  if (shadow.isAchievementNamed) return { canEvolve: false, reason: '성취 네임드는 진화 보류' }
  const target = getShadowDefinition(def.evolutionTargetDefinitionId)
  if (!target) return { canEvolve: false, reason: '진화 대상 정보 없음' }
  const maxLevel = getShadowMaxLevel(shadow)
  const level = shadow.level ?? 1
  if (level < 10) return { canEvolve: false, reason: '레벨 10 이상 필요' }
  if ((shadow.enhancementLevel ?? 0) < 2) return { canEvolve: false, reason: '강화 +2 이상 필요' }
  const cost = getEvolutionCost(shadow)
  if (shadowEssence < cost) return { canEvolve: false, reason: `그림자 정수 ${cost} 필요`, cost, targetDefinition: target }
  return { canEvolve: true, cost, targetDefinition: target }
}
