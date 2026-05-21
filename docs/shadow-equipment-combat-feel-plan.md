# 12-28F Shadow / Equipment Combat Feel Plan

이 문서는 그림자와 장비가 전투에서 더 뚜렷하게 체감되도록 만들기 위한 설계안이다. 이번 단계는 설계 문서 작성만 수행하며, 전투 공식, 보상, 저장 구조, 가격, 확률, localStorage key, persist version은 변경하지 않는다.

## 1. 현재 구조 진단

### 그림자 전투 기여 위치

- `src/lib/shadows.ts`
  - `SHADOW_DEFINITIONS`에 104개 그림자의 `rarity`, `rank`, `role`, `basePower`, `effects`, `hiddenUntilObtained`, named 플래그가 정의되어 있다.
  - `getShadowEffects`는 그림자 definition 효과와 trait 효과를 합친 뒤 `SHADOW_INNATE_GRADE_MULTIPLIER`, 강화 레벨, 그림자 레벨 배율을 적용한다.
  - `getEquippedShadowStatBonuses`는 장착 그림자 중 `stat_bonus` 효과만 헌터 스탯 보너스로 합산한다.
- `src/lib/game.ts`
  - `resolveShadowSupportActions`가 실제 전투 중 그림자 보조 행동을 처리한다.
  - 현재 지원 행동은 `bonus_damage`, `execute_damage`, `extra_attack_chance`, `wave_start_bonus`, `skill_damage_bonus`, `guard_counter`, `enemy_defense_down`, `damage_reduction`, `cooldown_support` 등에 반응한다.
  - `role`, `rarity`, `rank`가 보조 행동 발동 확률과 피해량에 반영된다.
- `src/lib/combatPower.ts`
  - `getHunterCombatPowerBreakdown`은 전투력 breakdown의 `shadows` 항목을 주로 `getEquippedShadowStatBonuses`의 헌터 스탯 증가분으로 계산한다.
  - 따라서 그림자가 실제 전투에서 추가타, 처형, 방어, 약화, wave 시작 보조를 수행해도 전투력 숫자에는 충분히 드러나지 않을 수 있다.
- `src/lib/shadowExpeditions.ts`
  - `getShadowExpeditionPower`는 `basePower`, rarity multiplier, enhancement, level, role match, named modifier를 사용한다.
  - 원정에서는 그림자 자체 power 개념이 이미 존재하지만, 전투력 UI 및 게이트/타워 전투와는 분리되어 있다.
- `src/components/ShadowPanel.tsx`
  - `shadowPowerScore`는 정렬/표시용 점수로 rarity, innateGrade, level, enhancement, named status를 반영한다.
  - 이 점수는 실제 전투 공식의 공용 전투력으로 쓰이지 않는다.

### 장비 전투 기여 위치

- `src/lib/game.ts`
  - `getEquipmentStars`는 장비 별을 1~5성으로 정규화하고, 기본값은 2성이다.
  - `EQUIPMENT_STAR_MULTIPLIER`는 1성 0.85, 2성 1.0, 3성 1.18, 4성 1.38, 5성 1.65를 사용한다.
  - `getEnhancedItemEffects`는 장비 별 배율과 강화 배율을 곱해 장비 효과에 반영한다.
  - `calculatePlayerCombatStats`는 장착 장비 효과, 헌터 스탯, 스킬, 소비 효과를 합산해 실제 전투용 스탯을 만든다.
- `src/lib/combatPower.ts`
  - 장비 효과가 `calculatePlayerCombatStats`에 들어가기 때문에 장비 별/강화/효과는 전투력에 반영된다.
- `src/components/Inventory.tsx`, `src/components/EquipmentRevealModal.tsx`
  - 장비 별/rarity/reveal/간단 비교 표시는 존재하지만, 장비가 어느 전투 맥락에서 강해지는지까지는 아직 얕다.

### 현재 반영 범위 요약

| 요소 | 현재 반영 | 진단 |
| --- | --- | --- |
| shadow rarity | definition rarity, 지원 행동 피해 배율, 원정 power, UI 정렬 | 전투에는 반영되지만 전투력 숫자와 로그 체감이 약함 |
| innateGrade | `getShadowEffects` 효과 배율, UI/reveal badge | 같은 그림자 내 재능 차이는 있으나 별도 combat power 언어가 부족함 |
| shadow level | `getShadowEffects`, 원정 power | 성장감은 있으나 주요 화면에서 전투 단위로 읽히기 어렵다 |
| enhancement | `getShadowEffects`, 원정 power, UI 정렬 | 투자 가치는 있으나 전투 로그/전투력 표현이 약하다 |
| evolution | owned shadow field와 evolution target 존재 | 역할 확장/전투 스케일 변화가 명확한 별도 언어로 정리되지 않았다 |
| named status | 원정 named modifier, 지원 행동 rank power, reveal/portrait 보호 | 고유 반응, 고유 로그, 보스전 존재감은 더 강화 가능 |
| equipmentStars | 장비 효과 multiplier, 전투력 | 수치 반영은 명확하지만 획득/착용/비교 체감은 더 강화 가능 |
| equipment rarity | item effects와 reveal tone | rarity별 특수성/슬롯별 정체성이 더 선명해질 수 있다 |

### common과 legendary 체감 진단

현재 legendary 그림자는 `basePower`, rarity multiplier, rank power, named flag, effects 구성에서 common보다 강해질 수 있다. 그러나 사용자가 체감하는 층위에서는 다음 약점이 있다.

- 수치 차이는 있으나 체감이 약한 부분
  - 전투력 breakdown의 `shadows` 항목이 `stat_bonus` 중심이라 추가타/처형/약화/방어 보조의 가치가 숫자로 잘 보이지 않는다.
  - rarity와 rank가 `resolveShadowSupportActions` 내부 피해량에는 반영되지만, 로그 문구는 대체로 role 중심이라 legendary다운 차이를 강하게 전달하지 못한다.
  - 원정 power와 전투 power가 서로 다른 언어를 사용한다.
- 표현이 부족한 부분
  - 고등급 그림자가 발동했을 때 portrait flash, badge, glow, 전용 로그, 보스전 반응이 충분히 계층화되어 있지 않다.
  - common S급, legendary C급, legendary S급의 차이를 사용자가 즉시 이해할 수 있는 설명 구조가 부족하다.
  - 장비도 5성/legendary/relic 획득은 좋아 보이지만, 착용 후 전투에서 어떤 방식으로 좋아졌는지의 피드백이 약하다.

## 2. 그림자 전용 상세 스탯 설계

그림자는 헌터에게 붙는 단순 보너스가 아니라 별도의 전투 단위처럼 읽혀야 한다. 아래 스탯들은 저장 필드로 바로 추가하기보다, 1차 구현에서는 `ShadowDefinition + OwnedShadow`로부터 파생 계산하는 방식을 우선한다.

| 스탯 | 의미 | 전투 사용 방식 | 높은 role | 차이가 커지는 구간 | UI 표시 |
| --- | --- | --- | --- | --- | --- |
| `shadowAttack` | 그림자의 기본 공격 기여 | 보조 공격 피해, wave 시작 선제타, 기본 assist 피해 | assault, hunter, scout | rare 이상, A/S 태생, 강화 | 공격 기여 막대, "Assist DMG" |
| `shadowDefense` | 헌터 피해를 줄이는 방어 보조 | 받는 피해 감소, 방어 자세 보정, 보호막 후보 | guard, support | guard legendary, S 태생, evolution | 방어 보조 막대, "Guard" |
| `shadowDurability` | 그림자 자체의 지속성과 장기전 안정성 | 장기전 발동률 유지, 연속 wave 피로 완화 | guard, support | epic 이상, 강화/레벨 | 지속성 막대, "Endurance" |
| `shadowSpeed` | 행동 빈도, 선공, 추격 능력 | 보조 행동 발동 주기, 첫 턴 명중/회피, 추격 발동 | scout, hunter, assault | scout S, rare 이상 | 속도 막대, "Tempo" |
| `shadowCrit` | 폭발 피해와 치명 보조 | critical assist, 스킬 직후 추가 피해 | assault, hunter | A/S 태생, epic/legendary | 치명 보조 badge |
| `shadowFinisher` | 마무리/처형 기여 | 적 HP 30% 이하 추가 피해, 막타 로그 | assault, hunter | S 태생, named, legendary | "Finisher" tag |
| `shadowControl` | 속박, 방해, 약화 | 적 방어/회피/명중 감소, 턴 지연 후보 | analyst, scout | analyst rare 이상, evolution | 약화 아이콘, "Control" |
| `shadowSuppression` | 강적/보스 억제 | 보스 피해 완화, 보스 공격 패턴 약화 | analyst, guard, support | epic/legendary, named | 보스 억제 badge |
| `shadowSupport` | 회복, 버프, 스킬 보조 | cooldown support, 스킬 피해 보정, wave 정렬 | support, analyst | support S, named | 지원 막대, "Support" |
| `shadowSurvival` | 헌터 위기 보호 | low HP 방어, 치명타 방지 후보, 긴급 보호 로그 | guard, support | S 태생, 강화, 4단계 evolution | 위기 보호 표시 |
| `shadowBossing` | 보스전 특화 | 보스층 damage/suppression 보정, 보스전 전용 발동률 | assault, analyst, guard | legendary, named, S 태생 | "Boss" tag |
| `shadowExpedition` | 원정 기여 | 원정 성공률, 위험도 감소, phase별 command 보정 | hunter, scout, support | hunter/scout rare 이상 | 원정 power 하위 항목 |
| `shadowSynergy` | 군단 조합/시너지 | role 다양성, 같은 계열 연계, named leader 보정 | support, analyst, scout | named, legendary, evolution | 군단 시너지 pips |

### 스탯 표시 원칙

- 모든 스탯을 한 번에 크게 노출하지 않는다.
- 카드 요약에는 상위 3개 스탯만 표시한다.
- 상세 패널에는 13개 스탯을 compact radar/table로 보여준다.
- 전투력 breakdown에는 `Shadow Combat Power`, `Assist`, `Guard`, `Control`, `Boss`, `Expedition` 같은 묶음 지표를 먼저 보여준다.
- hiddenUntilObtained 대상은 획득 전 이름, 초상, 조건, 고유 스탯 프로파일을 노출하지 않는다. 표시가 필요하면 "sealed named candidate"처럼 정체를 숨긴 표현만 쓴다.

## 3. Role별 스탯 프로파일 설계

| role | 강점 | 약점 | 전투 체감 행동 | 로그/연출 방향 | 원정 차이 |
| --- | --- | --- | --- | --- | --- |
| `assault` | `shadowAttack`, `shadowCrit`, `shadowFinisher` | 방어/지원 낮음 | 추가타, 처형, 스킬 직후 강공 | 붉은/자색 타격 flash, 막타 문구 | attack command 성공률 증가 |
| `guard` | `shadowDefense`, `shadowDurability`, `shadowSurvival` | 속도/처형 낮음 | 피해 감소, 방어 후 반격, 위기 보호 | 방패 frame, 충격 흡수 로그 | defend command, 위험도 감소 |
| `hunter` | `shadowSpeed`, `shadowFinisher`, `shadowCrit`, 보상 감각 | 순수 방어 낮음 | 추격, 전리품 감지, 낮은 HP 적 마무리 | 추적선/발자국 느낌의 로그 | hunt/search, 보상 품질 후보 |
| `scout` | `shadowSpeed`, `shadowControl`, `shadowExpedition`, `shadowSynergy` | 장기 피해 낮음 | 선공 보조, 회피선 차단, wave 시작 정렬 | 빠른 portrait flash, 선제 신호 | scout command, phase 정보 보정 |
| `support` | `shadowSupport`, `shadowSurvival`, `shadowSynergy`, `shadowDurability` | 단독 피해 낮음 | cooldown 보조, wave 안정, 위기 회복 후보 | 청록/금색 pulse, 군단 정렬 로그 | 장기 원정 안정성 증가 |
| `analyst` | `shadowControl`, `shadowSuppression`, `shadowBossing`, `shadowSupport` | 직접 피해 낮거나 중간 | 약점 분석, 보스 억제, 방어/회피 감소 | scan line, 약점 표식 로그 | analyze/search command 강화 |

### Role 프로파일 수치 예시

아래는 100점 budget 기반의 기본 분포 예시다. 실제 구현 시 definition별 개성을 더해 15~25점 범위의 오차를 허용한다.

| role | Atk | Def | Dur | Spd | Crit | Fin | Ctrl | Supp | Sup | Surv | Boss | Exp | Syn |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assault | 86 | 36 | 42 | 58 | 74 | 82 | 34 | 42 | 24 | 30 | 58 | 32 | 38 |
| guard | 42 | 88 | 82 | 30 | 24 | 34 | 46 | 62 | 38 | 86 | 58 | 34 | 42 |
| hunter | 68 | 38 | 44 | 76 | 64 | 72 | 42 | 38 | 28 | 36 | 48 | 78 | 46 |
| scout | 54 | 34 | 38 | 88 | 46 | 50 | 68 | 48 | 34 | 42 | 44 | 84 | 64 |
| support | 32 | 56 | 66 | 42 | 24 | 28 | 48 | 56 | 88 | 74 | 44 | 60 | 82 |
| analyst | 38 | 42 | 48 | 52 | 34 | 36 | 88 | 82 | 64 | 46 | 76 | 66 | 72 |

## 4. Rarity / innateGrade / level / enhancement / evolution 역할 분리

- `rarity`
  - 그림자 존재 자체의 희귀성, 기본 포텐셜, 특수 효과 가능성을 뜻한다.
  - 같은 role이라도 legendary는 스탯 총량, 특수 스탯 상한, 고유 로그 후보가 더 높다.
- `innateGrade`
  - 같은 그림자 안에서 태생 재능을 뜻한다.
  - C/B/A/S는 "이 개체가 얼마나 잘 태어났는가"이며, rarity를 뒤집기보다 같은 rarity 안의 성능 폭을 만든다.
- `level`
  - 꾸준한 동행 성장이다.
  - 모든 스탯에 낮고 안정적인 누적 보정을 준다.
- `enhancement`
  - 재화를 투자한 성장이다.
  - 전투 스탯과 핵심 role 스탯에 level보다 더 뚜렷한 보정을 준다.
- `evolution`
  - 역할 확장, 스탯 스케일 상승, 특수성 강화다.
  - 단순 수치 상승뿐 아니라 보조 role tag, 고유 발동 조건, synergy slot을 열 수 있다.
- `named / achievement / gate named`
  - 고유 반응, 고유 로그, 특수 passive 후보를 뜻한다.
  - hidden/secret 보호 때문에 획득 전 정체와 조건은 노출하지 않는다.

### 케이스 해석

- common S급 그림자
  - 낮은 rarity의 base potential은 유지하지만, S 태생으로 주력 role 스탯과 발동 안정성이 매우 좋다.
  - "저희귀 고재능" 포지션: 초중반에 오래 쓰기 좋고, 강화/레벨 투자 효율이 높다.
- legendary C급 그림자
  - 존재 자체의 base potential과 고유 효과 후보는 크지만, 태생 재능이 낮아 성장 효율과 안정성이 덜하다.
  - "희귀하지만 덜 깨어난 개체" 포지션: 기본 성능은 높으나 S급 common이 특정 상황에서 비빌 수 있다.
- legendary S급 그림자
  - rarity base, S 태생, named/evolution 가능성이 모두 겹친 apex 결과다.
  - 전투력, 고유 로그, 보스전 반응, reveal 강도 모두 최상위로 처리한다.

## 5. Shadow Combat Power 계산식 초안

### 기본식

```text
Shadow Combat Power =
  roleBaseStatScore
  * rarityMultiplier
  * innateGradeMultiplier
  * levelScaling
  * enhancementScaling
  * evolutionMultiplier
  * namedModifier
  + roleSpecificContribution
  + situationalPreviewBonus
```

### 후보 multiplier

| 항목 | 후보값 | 설명 |
| --- | --- | --- |
| rarity | common 0.85, uncommon 1.0, rare 1.18, epic 1.42, legendary 1.75 | 원정의 rarity 감각과 유사하되 전투력 표시용으로 정리 |
| innateGrade | C 0.90, B 1.00, A 1.18, S 1.38 | 현재 effect multiplier보다 표시 inflation을 조금 낮게 잡는 후보 |
| levelScaling | `1 + min(0.35, (level - 1) * 0.012)` | 장기 성장, 과도한 누적 방지 |
| enhancementScaling | `1 + min(0.45, enhancement * 0.075)` | 투자 체감은 주되 상한 설정 |
| evolutionMultiplier | stage 0: 1.00, 1: 1.12, 2: 1.25, 3: 1.40 | evolution을 role 확장과 함께 표현 |
| namedModifier | normal 1.00, named 1.08~1.18 | 고유성 보정, 실제 수치는 보수적으로 |

### roleSpecificContribution

역할별 핵심 스탯에는 소폭 가산을 준다.

- assault: `shadowAttack`, `shadowCrit`, `shadowFinisher`
- guard: `shadowDefense`, `shadowDurability`, `shadowSurvival`
- hunter: `shadowSpeed`, `shadowFinisher`, `shadowExpedition`
- scout: `shadowSpeed`, `shadowControl`, `shadowSynergy`
- support: `shadowSupport`, `shadowSurvival`, `shadowSynergy`
- analyst: `shadowControl`, `shadowSuppression`, `shadowBossing`

### 인플레이션 방지

- Shadow Combat Power는 헌터 전투력에 1:1로 더하지 않는다.
- `combatPower.ts`에는 별도 breakdown으로 `shadowAssistPower`를 표시하고, 실제 gate/tower 추천 전투력 비교에는 낮은 변환율을 사용한다.
- 보조 행동 발동률은 hard cap과 diminishing return을 유지한다.
- 같은 역할 5개를 장착했을 때는 role diversity 보너스를 받지 못하게 하여 단일 스탯 몰빵을 제한한다.
- situational bonus는 UI에서 "boss", "expedition", "wave"처럼 조건부로 분리해 표시한다.

### 저장 호환

- 1차 구현은 새 저장 필드 없이 `ShadowDefinition`, `OwnedShadow`의 기존 필드에서 파생한다.
- 나중에 definition별 `shadowStats`를 추가하더라도 optional field로 두고, 없으면 role profile과 basePower로 fallback한다.
- 기존 owned shadow에 새 스탯이 없어도 계산 가능해야 하므로 persist version 변경은 원칙적으로 필요 없다.

### UI 표시

- ShadowPanel 카드: `SCP 1,240`, 상위 3개 스탯 badge.
- 상세 패널: 13개 스탯 compact table/radar.
- HunterStatus breakdown: `Shadows`를 단순 stat bonus가 아니라 `Assist`, `Guard`, `Control`, `Boss`, `Expedition` 하위 설명으로 분리.
- 전투 준비 화면: 장착 그림자 조합의 강점 문장 1개만 표시한다.

## 6. 전투 메커니즘 반영 설계

### 1차 구현 범위

- `shadowAttack`
  - 현재 보조 공격 피해 계산의 rolePower/rarityPower 이후에 작은 가중치로 반영한다.
- `shadowDefense`
  - `damage_reduction`, guard phase 반격, 방어 자세 보정에 연결한다.
- `shadowSpeed`
  - 보조 행동 발동 확률과 wave start 보조 발동률에 연결한다.
- `shadowFinisher`
  - 적 HP 30% 이하 execute 구간에 연결한다.
- `shadowControl`
  - enemy defense/evasion down의 발동 확률과 지속 턴에 연결한다.
- `shadowSupport`
  - cooldown support와 skill damage support 발동에 연결한다.
- `shadowSurvival`
  - 헌터 HP 낮을 때 피해 감소/긴급 보호 로그에 연결한다.
- `shadowExpedition`
  - 원정 power와 command match 보정에 연결한다.

### 후속 확장 범위

- `shadowCrit`
  - critical assist와 burst log 추가.
- `shadowDurability`
  - 긴 전투에서 발동률 감소를 막거나 장기전 안정성 보정.
- `shadowSuppression`
  - 보스 패턴 약화, 보스 강공 피해 완화.
- `shadowBossing`
  - 보스층/보스 몬스터 상대로만 별도 보정.
- `shadowSynergy`
  - role diversity, named leader, 같은 계열 연계 보정.

### 복잡도 제한

- 전투 턴마다 13개 스탯을 모두 직접 계산하지 않는다.
- 전투 시작 시 장착 그림자의 derived stats를 한 번 계산하고, 턴 처리에서는 필요한 aggregate만 참조한다.
- 첫 구현은 `assist`, `guard`, `control`, `support`, `survival` 5개 aggregate로 시작해도 된다.

## 7. 표현 체감 설계

- 전투 로그 문구 차등
  - common/low result는 짧고 반복 피로가 낮은 문구.
  - epic/legendary/S/named는 등급 badge와 함께 더 강한 동사 사용.
- rarity / innateGrade / named badge
  - 로그 옆에 `LEGENDARY`, `S-BORN`, `NAMED`, `BOSSING` 같은 작은 badge를 표시한다.
- shadow portrait flash
  - 보조 행동 발동 시 장착 portrait가 0.6초 flash.
  - S/legendary/named는 border glow와 짧은 camera shake 후보.
- 보스전 특수 반응
  - `shadowSuppression` 또는 `shadowBossing`이 높은 그림자가 보스전 시작 시 반응 로그를 낸다.
  - hidden 대상은 획득 전 정체 노출 금지.
- 위기 상황 보호 로그
  - HP 낮을 때 `shadowSurvival` 발동: "군단이 치명상을 흘려냈다" 계열의 짧은 문구.
- finisher 발동 로그
  - `shadowFinisher` 발동 시 막타/처형 로그를 별도 색상으로 표시.
- legendary/named 전용 짧은 대사
  - 획득한 owned shadow 기준으로만 quote 표시.
  - hiddenUntilObtained 대상의 미획득 quote, 이름, portrait, 조건은 표시하지 않는다.
- 원정 보고서 반응
  - great success에서 고등급 그림자의 역할별 짧은 보고 문구 추가.

## 8. 장비 체감 강화 설계

### stars와 rarity

- `equipmentStars`
  - 이미 effect multiplier에 반영되어 있으므로, UI에서는 "이 장비가 왜 강한지"를 더 분명히 보여준다.
  - 4~5성은 착용/획득 로그에서 별도 badge와 glow를 쓴다.
- rarity
  - common/rare/epic/legendary는 수치 크기뿐 아니라 특수 효과 후보 수와 고유 문구 강도를 다르게 둔다.
  - legendary/relic 계열은 장착 시 전투 시작 로그 또는 보스전 반응 후보를 가진다.

### 슬롯별 역할

| 슬롯 | 체감 방향 | UI 비교 |
| --- | --- | --- |
| weapon | 공격력, 스킬 피해, 치명/처형 | 예상 피해 상승, 공격 badge |
| armor | HP, 방어, 위기 생존 | 생존력 상승, 방어 badge |
| accessory | 속도, 명중, 회피, 보조 효과 | 안정성/tempo badge |
| relic / artifact | 특수 효과, 그림자/스킬/보스 보정 | 조건부 power와 특수 tag |

### 장비 착용 비교 UI

- 현재 장착 장비와 새 장비를 같은 슬롯 기준으로 비교한다.
- 표시 항목은 `stars`, `rarity`, 주요 stat delta, 특수 effect delta로 제한한다.
- 복잡한 기대 피해 계산은 1차에서 하지 않고, "전투력 상승 가능", "생존력 상승", "조건부 효과 강함" 같은 안전한 문구를 사용한다.
- 4~5성, epic/legendary/relic은 획득 로그와 착용 로그를 강화한다.

### 그림자/헌터/스킬 영향 후보

- weapon: `shadowAttack`, 헌터 skill damage와 연계.
- armor: `shadowDefense`, `shadowSurvival` 발동 시 추가 안정성.
- accessory: `shadowSpeed`, `shadowControl` 발동률 보조.
- relic/artifact: `shadowBossing`, `shadowSynergy`, 특정 role 조합 보정 후보.

## 9. 구현 단계 제안

| 단계 | 목표 | 예상 수정 파일 | 위험도 | 저장 구조 변경 | 검증 |
| --- | --- | --- | --- | --- | --- |
| 12-28G | shadow stats data model + combat power 표시 | `src/lib/shadowStats.ts`, `src/lib/shadows.ts`, `src/lib/combatPower.ts`, `src/components/ShadowPanel.tsx`, `src/components/HunterStatus.tsx` | 중간 | 불필요. optional derived/fallback 권장 | unit/helper 확인, build, 기존 save 로드 |
| 12-28H | shadow stats를 gate/tower 전투에 1차 반영 | `src/lib/game.ts`, `src/lib/store.ts`, `src/components/GatePanel.tsx`, `src/components/InfiniteTowerPanel.tsx` | 높음 | 불필요 | combat sim 필요, 낮은/높은 rarity 비교 |
| 12-28I | shadow stats를 expedition에 반영 | `src/lib/shadowExpeditions.ts`, `src/lib/expeditionLore.ts`, expedition UI | 중간 | 불필요 | 원정 성공률/로그 snapshot, role match 확인 |
| 12-28J | 장비 stars/rarity 전투력/착용 비교 강화 | `src/lib/game.ts`, `src/lib/combatPower.ts`, `src/components/Inventory.tsx`, `src/components/EquipmentRevealModal.tsx` | 중간 | 불필요 | 장비 비교 UI, 1~5성 전투력 차이 확인 |
| 12-28K | 전투 로그/연출/고유 반응 강화 | combat log components, `ShadowRevealModal`, `GatePanel`, `BattleLog` 계열 | 낮음~중간 | 불필요 | 모바일 overflow, hidden 보호, 반복 피로 확인 |

### 단계별 원칙

- 12-28G는 표시와 파생 계산만 다룬다. 실제 전투 승률은 바꾸지 않는다.
- 12-28H부터 전투 결과에 영향을 주므로 sim과 회귀 확인이 필요하다.
- 12-28I는 원정 성공률/보상 체감에 영향을 줄 수 있으므로 보상량 자체를 바꾸지 않고 성공 판정 보정부터 다룬다.
- 12-28J는 기존 장비 stars multiplier를 보존하고, 비교/표현/전투력 breakdown을 개선한다.
- 12-28K는 표현 강화 중심이라 수치 위험은 낮지만 hidden/secret 보호 검증이 중요하다.

## 10. 안전성 / 호환성

- 기존 owned shadow fallback
  - `OwnedShadow`에 새 stat field가 없어도 role profile, definition basePower, rarity, innateGrade, level, enhancement, evolutionStage로 파생한다.
- persist version
  - 파생 계산만 추가하면 persist version 변경은 필요 없다.
  - 나중에 `ShadowDefinition.shadowStats` 같은 optional definition field를 추가해도 저장 migration은 필요 없다.
- 기존 데이터 보존
  - 기존 owned shadows, equipment, progress는 그대로 사용한다.
  - 이름/portrait/hidden 조건은 기존 owned 공개 기준을 유지한다.
- 수치 인플레이션 방지
  - shadow combat power는 표시용/조건부 power와 실제 전투 반영치를 분리한다.
  - 발동률, 피해 보정, bossing 보정에는 cap과 diminishing return을 둔다.
  - role diversity와 situational tag를 사용해 단일 최적해를 줄인다.
- sim 필요 구분
  - 12-28G, 12-28K는 build와 UI 확인 중심.
  - 12-28H, 12-28I, 12-28J는 전투/원정/전투력 sim이 필요하다.

## 11. 권장 결론

현재 시스템에는 그림자와 장비의 등급 차이를 만들 재료가 이미 있다. 문제는 그 차이가 여러 helper에 흩어져 있고, 전투력 숫자와 로그/연출이 그 가치를 충분히 번역하지 못한다는 점이다.

따라서 다음 구현은 "새로운 대형 전투 시스템"보다 먼저, 그림자 전용 derived stats와 Shadow Combat Power를 공용 언어로 만들고, 그 언어를 전투력 표시, 전투 로그, 원정, 장비 비교에 순차적으로 연결하는 방식이 가장 안전하다.
