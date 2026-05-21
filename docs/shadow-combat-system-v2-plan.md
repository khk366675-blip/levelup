# 12-28I Shadow Combat System v2 Plan

이 문서는 그림자를 헌터의 보조 효과가 아니라 독립 전투 유닛으로 재설계하기 위한 계획이다. 이번 단계는 설계 문서 작성만 수행하며 코드, 저장 구조, 전투 공식, 보상, 가격, 확률, UI/VFX를 수정하지 않는다.

## 1. 기존 방향 문제 진단

### 현재 시스템의 보조 효과 중심 구조

- `src/lib/shadows.ts`
  - `SHADOW_DEFINITIONS`가 rarity, role, basePower, effects, hiddenUntilObtained, named 계열 플래그를 가진다.
  - `getShadowEffects`는 owned shadow의 innateGrade, level, enhancement 등을 효과 배율로 합산한다.
  - 장착 그림자는 주로 stat bonus 또는 support action의 원천으로 사용된다.
- `src/lib/game.ts`
  - `resolveShadowSupportActions`가 전투 중 그림자 보조 행동을 처리한다.
  - 현재 행동은 bonus damage, execute damage, extra attack chance, damage reduction, cooldown support, defense down 등 헌터 전투에 얹히는 효과에 가깝다.
- `src/lib/combatPower.ts`, `src/components/ShadowPanel.tsx`, `src/components/HunterStatus.tsx`
  - 12-28G 이후 Shadow Combat Power와 13개 shadow stat이 표시 언어로 도입되었다.
  - 그러나 v1 전투 런타임에서는 그림자가 자기 턴, 자기 스킬, 자기 상태를 가진 유닛이라기보다 헌터 행동을 보조하는 modifier에 가깝다.

### 12-28G가 좋은 기반인 이유

- 13개 shadow stat은 그림자별 역할 차이를 숫자로 설명할 수 있는 공용 언어다.
- SCP는 헌터 전투력에 직접 더하지 않는 별도 지표라서, 그림자 군단의 강함을 독립적으로 보여주기 좋다.
- role profile, rarity, innateGrade, level, enhancement, evolution, named status를 derived 계산으로 다루기 때문에 기존 저장 데이터와 호환된다.
- 나중에 2.5D battle board에서 action priority, aura, 배치, 스킬 강도, passive trigger 강도를 결정하는 기반으로 재사용할 수 있다.

### 12-28H가 과도기적 레이어인 이유

- 12-28H는 13개 stat을 `assistAttack`, `guardSupport`, `controlSupport`, `supportUtility`, `survivalGuard`, `bossPressure`, `speedTempo`, `finisherPower`로 묶어 기존 `resolveShadowSupportActions`에 소폭 반영했다.
- 이 방식은 기존 전투를 크게 흔들지 않으면서 rarity/innateGrade/role 차이를 작게 느끼게 하는 안전한 연결이다.
- 하지만 그림자는 여전히 독립 행동 주체가 아니다. 그림자별 active skill, passive, cooldown, trigger, 행동 우선순위, 전투 상태가 없다.
- 따라서 12-28H는 v2 runtime이 안정화되기 전까지 쓰는 bridge layer로 유지하고, 이후 Shadow Unit runtime에 흡수하거나 대체하는 방향이 적절하다.

### 소폭 보정만으로 부족한 이유

- common, legendary, S innateGrade, named 차이가 전투 체감으로 강하게 이어지려면 단순 피해/발동률 bonus보다 행동의 질이 달라져야 한다.
- legendary는 더 높은 숫자뿐 아니라 더 좋은 skill pool, 조건부 반응, 보스전 억제, 고유 passive 후보가 있어야 한다.
- S innateGrade는 같은 그림자 안에서 발동 안정성, 성장률, 효과량이 좋아야 하며 rarity의 고유성을 지우면 안 된다.
- named shadow는 hidden 보호를 유지하면서도 획득 후에는 고유 대사, trigger, passive, boss reaction 같은 개성이 필요하다.

## 2. Shadow Unit 개념 정의

Shadow Unit은 전투에 참여하는 독립 그림자 인스턴스다. 저장 데이터 자체를 즉시 바꾸는 개념이 아니라, `OwnedShadow + ShadowDefinition + derived profile`에서 계산되는 런타임 모델로 시작한다.

각 Shadow Unit은 최소 다음 정보를 가진다.

- `shadowStats` 13종
- Shadow Combat Power와 assist/guard/control/boss/expedition breakdown
- role
- rarity
- innateGrade
- level
- enhancement
- evolution stage
- active skill 후보
- passive 후보
- conditional trigger 후보
- combat behavior profile
- expedition behavior profile
- 2.5D action profile 후보

핵심 원칙은 "그림자가 헌터에게 붙은 옵션"이 아니라 "전장에 참여하는 작은 전투 단위"가 되는 것이다.

## 3. 13개 스탯이 전투를 결정하는 구조

| stat | v2 전투 의미 | 행동 결정 방식 |
| --- | --- | --- |
| `shadowAttack` | 기본 공격과 active skill 피해 | 기본 타격 계수, 공격형 skill damage, assist action 강도 |
| `shadowDefense` | 방어 행동과 피해 차단 | guard action 효율, barrier, 피해 흡수량 |
| `shadowDurability` | 장기전 유지력 | 그림자 행동 지속성, 피로도/쿨다운 불리함 완화, 연속 wave 안정성 |
| `shadowSpeed` | 행동 순서와 행동 빈도 | action priority, 추가 행동 roll, 선공/추격 trigger |
| `shadowCrit` | 폭발 피해 | critical assist, burst skill, high roll damage |
| `shadowFinisher` | 처형과 마무리 행동 | 적 HP가 낮을 때 finisher skill 후보, 막타 우선순위 |
| `shadowControl` | 약화와 턴 방해 | defense/evasion down, intent delay, action interruption |
| `shadowSuppression` | 강적/보스 억제 | boss damage 완화, boss pattern pressure, elite target debuff |
| `shadowSupport` | 아군 보조 | heal, cooldown assist, hunter buff, skill efficiency |
| `shadowSurvival` | 위기 보호 | low HP guard, lethal prevention 후보, emergency shield |
| `shadowBossing` | 보스전 특화 | boss target priority, boss-only damage/control bonus |
| `shadowExpedition` | 원정 특화 | expedition phase success, risk reduction, command match |
| `shadowSynergy` | 군단 조합과 연계 | role combo, chain action, named leader aura 후보 |

v2에서는 매 턴 13개 stat을 모두 직접 굴리지 않는다. 전투 시작 시 Shadow Unit profile을 만들고, runtime은 상황별로 필요한 action score만 계산한다.

예시 action score:

```text
attackActionScore = shadowAttack + shadowCrit * 0.35 + shadowSpeed * 0.2
guardActionScore = shadowDefense + shadowDurability * 0.45 + shadowSurvival * 0.35
controlActionScore = shadowControl + shadowSuppression * 0.35 + shadowSpeed * 0.15
bossActionScore = shadowBossing + shadowSuppression * 0.4 + roleBonus
finisherActionScore = shadowFinisher + shadowCrit * 0.3 + targetLowHpBonus
```

## 4. 그림자 스킬/패시브 체계

### 슬롯 구조

- Active skill
  - common: 0~1개
  - rare/epic: 1개
  - legendary/named: 1~2개
- Passive
  - common: 0~1개
  - rare/epic: 1개
  - legendary/named: 1~2개
- Conditional trigger
  - rare 이상부터 조건부 trigger 후보를 가진다.
  - legendary/named는 보스전, 위기, 처형, 특정 role 조합 같은 고유 조건을 가질 수 있다.

### Skill Definition 설계

- skill id, name, role tags, rarity tier, trigger timing을 가진다.
- 효과는 damage, guard, control, support, bossing, expedition 등으로 분리한다.
- 수치는 고정값보다 `powerScale`, `procChance`, `cooldown`, `cap` 중심으로 설계한다.
- hiddenUntilObtained 대상의 고유 skill name과 설명은 획득 전까지 노출하지 않는다.

### Passive 설계

- 전투 시작 passive: aura, role boost, boss preparation.
- 조건부 passive: low HP, target HP threshold, boss phase, chain action.
- 지속 passive: cooldown 안정성, guard efficiency, support reliability.
- 원정 passive: command match, risk reduction, phase scouting.

### rarity와 skill quality

- common
  - 단순 active 또는 단순 passive.
  - 계수와 trigger가 안정적이지만 복합 효과는 적다.
- rare/epic
  - active 1개, passive 1개.
  - role identity가 명확해지고 조건부 효과가 가능하다.
- legendary/named
  - active 1~2개, passive 1~2개.
  - boss, survival, finisher, synergy 같은 특수 조건에서 강한 반응을 가진다.
  - named는 획득 후 고유 reaction cue, quote, skill hook 후보를 가진다.

### innateGrade의 영향

- 발동률 안정성: S는 같은 skill이라도 low roll이 적고 trigger chance가 높다.
- 효과량: skill coefficient에 작은 multiplier를 제공한다.
- 성장률: level/enhancement가 skill power로 전환되는 비율이 높다.
- cooldown 안정성: 높은 innateGrade는 긴 cooldown skill의 체감 공백을 줄일 수 있다.

### evolution의 영향

- stage 1: 기존 role skill의 계수 또는 안정성 강화.
- stage 2: conditional trigger 추가 또는 passive 강화.
- stage 3: secondary role tag 또는 synergy hook 개방.
- stage 4 이후 후보: named/legendary 고유 skill의 phase 2 효과 개방.

## 5. Rarity / innateGrade 역할 재정의

- rarity
  - 그림자 종류 자체의 희귀성, 기본 포텐셜, skill/passive 품질, 고유성, 특수 action 후보를 뜻한다.
  - legendary는 skill pool의 품질과 특수 trigger 후보가 높지만, 낮은 innateGrade라면 발동 안정성과 성장 효율은 제한된다.
- innateGrade
  - 같은 그림자 개체의 태생 재능이다.
  - stat 성장, 발동 안정성, 효과량, cooldown 안정성, high roll 확률에 영향을 준다.
  - rarity의 고유 skill 품질을 대체하지 않고, 그 skill을 얼마나 잘 다루는지에 가깝다.

### 케이스 해석

- common S급 그림자
  - skill 구조는 단순하지만 발동 안정성과 성장 효율이 좋다.
  - 특정 role에서 실전성이 높고 투자 효율이 좋다.
  - 단, legendary 고유 passive나 boss-only 반응은 부족하다.
- legendary C급 그림자
  - 고유 skill/passive 후보와 높은 기본 포텐셜은 있다.
  - 그러나 발동 안정성, 성장 효율, 효과량이 낮아 즉시 압도하지는 않는다.
  - 특정 보스나 조합에서는 common S보다 유용할 수 있다.
- legendary S급 그림자
  - rarity의 고유성, S급 안정성, high-end growth가 겹친 apex 개체다.
  - 단, 모든 상황에서 정답이 되지 않도록 role 상성, cooldown, boss/general/expedition 분리를 둔다.

## 6. Role별 전투 행동 설계

### assault

- 기본 행동: 강한 공격, 치명, 처형.
- active 예시: 단일 대상 강타, HP 낮은 적 처형, 짧은 burst window.
- passive 예시: hunter skill 이후 추가 타격, critical assist chance 증가.
- trigger 예시: 적 HP 35% 이하, hunter가 critical을 낸 직후, boss stagger 상태.
- 2.5D 후보: 전방 돌진, 붉은 slash arc, finisher cut-in hook.

### guard

- 기본 행동: 피해 차단, barrier, 반격.
- active 예시: 다음 공격 피해 감소, guard counter, party shield.
- passive 예시: hunter HP가 낮을수록 guard priority 상승.
- trigger 예시: hunter HP 40% 이하, boss heavy attack 예고, wave start.
- 2.5D 후보: 헌터 앞 방패 위치, barrier dome, counter stance.

### hunter

- 기본 행동: 추격, 마무리, 빠른 연속 공격.
- active 예시: 약한 적 추격, wounded target strike, chain hit.
- passive 예시: 적 처치 후 action priority 증가.
- trigger 예시: 적 HP 50% 이하, wave 전환, 회피 성공 후.
- 2.5D 후보: 측면 이동, 잔상 dash, target mark chase.

### scout

- 기본 행동: 선공, 정보, 회피/의도 약화.
- active 예시: enemy intent reveal, evasion down, opening mark.
- passive 예시: wave start 때 control action 우선권 증가.
- trigger 예시: 전투 시작, 새 적 등장, 적이 강한 skill을 준비할 때.
- 2.5D 후보: 후방/측면 정찰 위치, scan line, mark projectile.

### support

- 기본 행동: 회복, buff, cooldown, 안정성.
- active 예시: hunter heal, skill cooldown assist, attack/guard buff.
- passive 예시: 장기전에서 support efficiency 상승.
- trigger 예시: hunter HP 55% 이하, skill cooldown 중, guard shadow와 동시 장착.
- 2.5D 후보: 후방 aura, healing pulse, cooldown rune.

### analyst

- 기본 행동: 약점 분석, 보스 억제, control.
- active 예시: boss suppression, weakness expose, defense/control debuff.
- passive 예시: boss target에게 action score 증가.
- trigger 예시: boss battle start, elite enemy 등장, 적이 방어 버프를 가질 때.
- 2.5D 후보: 분석 grid, boss aura dampening, weak point reticle.

## 7. 전투 시스템 v2 흐름 설계

### 기본 흐름

```text
Battle start
  -> build ShadowCombatUnitProfile for equipped shadows
  -> initialize ShadowCombatRuntimeState
  -> each round:
       hunter action resolves
       monster intent/action resolves by existing battle layer
       shadow action scheduler evaluates ready units
       shadow active/passive/trigger events resolve
       caps and diminishing returns apply
       battle state summary updates
```

### 헌터와 그림자 행동의 관계

- 헌터는 여전히 전투의 중심 플레이어 유닛이다.
- 그림자는 독립 action queue를 갖되, 매 라운드 모든 그림자가 행동하지 않는다.
- `shadowSpeed`, skill cooldown, role priority, trigger condition이 행동 빈도를 결정한다.
- low rarity 또는 낮은 innateGrade는 단순하고 낮은 빈도의 action으로 시작한다.
- high rarity, S innateGrade, named는 더 좋은 trigger와 안정성을 가진다.

### 여러 그림자 장착 시 행동 순서

- 각 그림자마다 `actionReadiness`를 가진다.
- 라운드마다 speedTempo, cooldown, trigger score를 반영해 readiness가 증가한다.
- ready shadow 중 priority가 높은 1~2개만 행동한다.
- 같은 role 중복은 diminishing return을 둔다.
- role diversity는 synergy action 후보를 열 수 있지만, 무한 중첩은 금지한다.

### 1차 구현 범위

- equipped shadow만 Shadow Unit으로 변환한다.
- active skill은 role별 generic skill pool에서 시작한다.
- passive는 1개 이하로 제한한다.
- 라운드당 shadow action은 최대 1개 또는 낮은 확률의 2개로 제한한다.
- 기존 `resolveShadowSupportActions`는 bridge layer로 유지하되, v2 action runtime이 켜진 전투에서는 일부 효과를 흡수한다.

### 후속 확장 범위

- named 전용 skill/passive.
- evolution stage별 skill upgrade.
- boss phase trigger.
- expedition behavior profile.
- 2.5D action animation hooks.
- shadow fatigue 또는 durability 기반 장기전 tuning.

## 8. 2.5D 전투 대비

v2 Shadow Unit은 2.5D 전투 보드의 표시와 행동 모두에 연결될 수 있어야 한다.

- shadow action profile
  - idle stance, action stance, skill cast, guard stance, hit reaction, retreat.
- role별 위치 배치
  - assault/hunter는 전방 또는 측면.
  - guard는 헌터 전면.
  - scout/analyst는 측면/후방 정보 위치.
  - support는 후방 aura 위치.
- active skill animation hook
  - skill definition에 `animationCue`, `effectColor`, `impactTiming` 후보를 둔다.
- passive trigger visual hook
  - passive definition에 `triggerCue`, `auraPulse`, `screenHint` 후보를 둔다.
- rarity/innateGrade aura
  - rarity는 aura 품질과 frame.
  - innateGrade는 pulse 안정성, glow intensity, reveal strength.
- named quote/action cue
  - 획득 후 공개된 named에만 짧은 전용 quote/action cue를 허용한다.
- bossing/suppression/action priority
  - bossPressure가 높은 그림자는 보스 등장 시 위치와 aura가 달라질 수 있다.

이번 문서는 2.5D 구현을 하지 않는다. 2.5D가 오더라도 재사용 가능한 데이터와 이벤트 구조만 제안한다.

## 9. 데이터 모델 초안

실제 코드는 작성하지 않는다. 아래는 구현 시 참고할 pseudo type이다.

```ts
type ShadowCombatUnitProfile = {
  shadowId: string
  definitionId: string
  displayState: 'revealed' | 'sealed'
  role: ShadowRole
  rarity: Rarity
  innateGrade: ShadowInnateGrade
  level: number
  enhancement: number
  evolutionStage: number
  stats: ShadowStatBlock
  combatPower: ShadowCombatPowerBreakdown
  activeSkills: ShadowSkillDefinition[]
  passives: ShadowPassiveDefinition[]
  behavior: ShadowCombatBehaviorProfile
  expeditionBehavior: ShadowExpeditionBehaviorProfile
  actionProfile: ShadowActionProfile
}
```

```ts
type ShadowSkillDefinition = {
  id: string
  name: string
  roleTags: ShadowRole[]
  qualityTier: 'basic' | 'refined' | 'elite' | 'legendary' | 'unique'
  timing: 'round_start' | 'after_hunter_action' | 'before_enemy_action' | 'after_enemy_action' | 'finisher_window'
  target: 'enemy' | 'boss' | 'hunter' | 'party' | 'self'
  effectKind: 'damage' | 'guard' | 'control' | 'support' | 'bossing' | 'hybrid'
  statScaling: Partial<Record<ShadowStatKey, number>>
  baseChance: number
  cooldownRounds: number
  cap?: number
  trigger?: ShadowTriggerCondition
  animationCue?: string
}
```

```ts
type ShadowPassiveDefinition = {
  id: string
  name: string
  qualityTier: 'basic' | 'refined' | 'elite' | 'legendary' | 'unique'
  effectKind: 'stat_shift' | 'trigger_boost' | 'cooldown' | 'survival' | 'synergy' | 'bossing'
  statScaling: Partial<Record<ShadowStatKey, number>>
  condition?: ShadowTriggerCondition
  stackRule: 'none' | 'unique' | 'diminishing' | 'role_capped'
}
```

```ts
type ShadowTriggerCondition = {
  timing: 'battle_start' | 'round_start' | 'hp_threshold' | 'target_low_hp' | 'boss_present' | 'after_crit' | 'after_kill' | 'wave_start'
  hpThreshold?: number
  targetHpThreshold?: number
  requiresBoss?: boolean
  roleCombo?: ShadowRole[]
  cooldownGate?: number
}
```

```ts
type ShadowCombatBehaviorProfile = {
  preferredActions: Array<'attack' | 'guard' | 'control' | 'support' | 'finisher' | 'bossing'>
  actionPriorityWeights: Record<string, number>
  maxActionsPerRound: number
  duplicateRolePenalty: number
  bossPriorityBonus: number
}
```

```ts
type ShadowActionProfile = {
  boardLane: 'front' | 'flank' | 'rear' | 'anchor'
  spriteScaleHint: number
  auraIntensitySource: 'rarity' | 'innateGrade' | 'combatPower'
  animationHooks: {
    idle: string
    activeSkill?: string
    passiveTrigger?: string
    guard?: string
    finisher?: string
  }
}
```

```ts
type ShadowCombatRuntimeState = {
  shadowId: string
  actionReadiness: number
  cooldowns: Record<string, number>
  passiveLocks: Record<string, number>
  roundActionsUsed: number
  temporaryModifiers: Array<ShadowRuntimeModifier>
}
```

```ts
type ShadowActionEvent = {
  sourceShadowId: string
  skillId?: string
  passiveId?: string
  timing: string
  effectKind: string
  valuePreview: number
  targetId?: string
  logCue: 'minor' | 'normal' | 'high' | 'apex'
  animationCue?: string
}
```

## 10. 기존 시스템과의 이행 전략

| 단계 | 목표 | 예상 수정 파일 | 위험도 | 저장 구조 변경 | 검증 |
| --- | --- | --- | --- | --- | --- |
| 12-28J | shadow skill/passive data model 설계/정의 1차 | `src/lib/shadowSkills.ts`, `src/lib/types.ts`, `src/lib/shadowStats.ts` | 중간 | 불필요하게 optional/derived로 시작 | build, type check, hidden 표시 확인 |
| 12-28K | 일부 그림자에 skill/passive prototype 부여 | `src/lib/shadows.ts`, `src/lib/shadowSkills.ts`, `src/components/ShadowPanel.tsx` | 중간 | 불필요 | 카드/상세 UI 확인, 104개 fallback 확인 |
| 12-28L | Gate/Tower 전투에 shadow action runtime 1차 연결 | `src/lib/game.ts`, `src/lib/shadowCombatRuntime.ts`, battle sim scripts | 높음 | 가능하면 불필요 | manual/auto combat sim, cap 회귀 |
| 12-28M | 원정에 shadow unit profile 반영 | `src/lib/shadowExpeditions.ts`, expedition UI | 중간 | 불필요 | 원정 성공률 snapshot, 보상량 유지 확인 |
| 12-29A | 2.5D battle board 설계 | `docs/`, prototype components 후보 | 문서 단계 낮음 | 없음 | 문서 검토 |
| 12-29B 이후 | shadow action profile을 2.5D 연출과 연결 | 2.5D board, animation hooks | 높음 | 미정 | desktop/mobile visual QA |

이행 원칙:

- 기존 12-28H 변경은 당장 제거하지 않는다.
- v2 runtime이 충분히 안정화되면 12-28H식 얇은 support-action 보정은 `ShadowActionEvent` 계산으로 흡수한다.
- 초반에는 generic role skill pool로 시작하고, 모든 104개 그림자 고유 스킬 작성은 후속 단계로 미룬다.
- 저장 필드는 강제 migration 대신 definition optional field와 derived runtime을 우선한다.

## 11. 밸런스 안전장치

- common 보호
  - common은 단순하지만 cooldown이 짧고 안정적인 기본 skill을 가진다.
  - S급 common은 높은 발동 안정성과 성장 효율로 특정 role에서 충분히 쓸 수 있게 한다.
- legendary 제한
  - legendary는 고유성과 skill 품질이 높지만 cooldown, role 상성, 조건부 trigger를 둔다.
  - 보스전 특화 legendary가 일반 wave 최적해가 되지 않게 한다.
- S innateGrade 제한
  - S는 효과량과 안정성을 올리지만, rarity의 skill quality와 role identity를 대체하지 않는다.
- active/passive cap
  - 발동률 hard cap, round action cap, duplicate passive cap을 둔다.
  - high rarity stacking은 diminishing return을 적용한다.
- 중복 시너지 제한
  - 같은 role 5개 조합이 모든 전투에서 최적이 되지 않게 role diversity와 duplicate penalty를 함께 둔다.
- 콘텐츠 분리
  - bossing, general wave, expedition, tower endurance에서 강점이 나뉘어야 한다.
  - shadowExpedition은 전투 피해가 아니라 원정 phase와 risk에 더 크게 연결한다.

## 12. UI 표시 원칙

- ShadowCard
  - SCP, role, top stat badge, top skill badge만 표시한다.
  - 13개 stat과 긴 skill 설명은 카드에 넣지 않는다.
- Shadow detail panel
  - active/passive 요약을 먼저 표시한다.
  - skill/passive 설명이 길면 접이식으로 둔다.
  - 13개 stat은 기존 12-28G 원칙처럼 접이식/카테고리별 compact table로 유지한다.
- HunterStatus
  - 헌터 전투력 숫자와 Shadow Unit power를 혼동하지 않게 별도 보조 지표로 둔다.
- hidden/locked named
  - 획득 전 실제 이름, 초상, 조건, 고유 skill/passive, quote를 노출하지 않는다.
  - 필요하면 "sealed named skill candidate" 같은 비식별 표현만 사용한다.

## 13. 이번 설계에서 구현하지 말아야 할 것

- 2.5D 전투 구현.
- 전투 UI/VFX 대형 수정.
- portrait flash, slash animation, full battle board 추가.
- 모든 104개 그림자에 고유 skill/passive 즉시 작성.
- 대규모 밸런스 수치 변경.
- 저장 구조 강제 migration.
- persist version 변경.
- 기존 12-28H 로직 즉시 제거.
- hidden/secret 조건 또는 미보유 hiddenUntilObtained 정체 노출.

## 14. 결론

Shadow Combat System v2의 핵심은 그림자를 헌터 modifier가 아니라 독립 전투 유닛으로 번역하는 것이다. 12-28G의 shadow stats와 SCP는 이 전환의 언어이고, 12-28H의 얇은 combat aggregate는 안정적인 과도기 레이어다.

다음 단계에서는 저장 구조를 강제로 바꾸기보다 `OwnedShadow + ShadowDefinition`에서 `ShadowCombatUnitProfile`을 파생하고, generic role skill/passive부터 적용하는 것이 안전하다. 충분히 검증되면 기존 support-action 보정은 v2 action runtime의 이벤트로 자연스럽게 흡수할 수 있다.
