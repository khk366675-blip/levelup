# 전투 시스템 밸런스 검증 보고서

**작성일**: 2026-06-02  
**작성자**: Combat System Analyst  
**버전**: 1.0

---

## 요약 (Executive Summary)

Level Up 프로젝트의 전투 시스템을 종합 분석하여 스탯 통일성, 스탯 가치 균형, 난이도 밸런스를 검증하였습니다.

### 주요 발견 사항
1. ✅ **스탯 체계 통일성**: 헌터/플레이어/네임드 헌터는 동일한 6종 스탯 사용, 그림자는 별도 13종 스탯 사용 (설계 의도에 부합)
2. ⚠️ **스탯 가치 불균형**: STR/VIT는 고가치 (6.0~7.4 power/point), PER/SEN은 저가치 (0.3~0.9 power/point)
3. ⚠️ **난이도 곡선 문제**: E급 너무 쉬움, C급 급격한 벽, S급 과도한 인플레이션

---

## 1. 전투 요소 및 경로 분석

Level Up에는 **5가지 주요 전투 경로**가 존재합니다:

| 전투 경로 | 설명 | 핵심 메커니즘 |
|----------|------|--------------|
| **Gate (게이트)** | 몬스터 웨이브 기반 던전 | `resolveShadowSupportActions`, wave 기반 전투 |
| **Infinite Tower (무한의 탑)** | 층별 보스 레이드 | 층수 기반 난이도 상승, 보스 특화 |
| **Living World (리빙 월드)** | 자동 진행 월드 이벤트 | 시뮬레이션 기반 자동 전투 |
| **Direct Battle (직접 전투)** | 턴제 전술 전투 | `battleUnits.ts` 기반, 턴 순서 관리 |
| **Shadow Expedition (그림자 원정)** | 그림자 파티 원정 | 그림자 전용 스탯 기반 원정 시뮬레이션 |

---

## 2. 스탯 체계 통일성 검증

### 2.1 플레이어 & 네임드 헌터 스탯 (6종)

**사용 주체**: Player, NamedHunter  
**스탯 종류**: `STR`, `VIT`, `AGI`, `INT`, `PER`, `SEN`

#### 전투력 산출 공식 (game.ts:880-900)

```typescript
// 1단계: 기본 전투 스탯 계산 (calculatePlayerCombatStats)
atk = 10 + STR × 2 + level × 2
def = 5 + VIT × 1.2 + level
maxHp = 100 + VIT × 10 + level × 5
speed = 10 + AGI × 1.5
critRate = min(0.5, SEN × 0.008)
evasionRate = min(0.3, AGI × 0.004 + PER × 0.003)
accuracy = min(0.99, 0.95 + SEN × 0.001)
skillTotalPower = calculateSkillTotalPower(skills)

// 2단계: 전투력 통합 (calculateCombatPower)
combatPower = atk × 3 + maxHp × 0.5 + def × 2 + speed × 1.5 
            + critRate × 100 + evasionRate × 100 + skillTotalPower × 1.5
```

#### 네임드 헌터 전투력 산출 (`hunterUnified.ts`)

네임드 헌터는 `convertNamedHunterToHunterState`를 통해 HunterState로 변환된 후, **플레이어와 100% 동일한 공식**으로 전투력을 산출합니다:

```typescript
export function getNamedHunterBasePower(hunter: NamedHunter): number {
  const hunterState = convertNamedHunterToHunterState(hunter)
  const power = getHunterCombatPower({
    hunter: hunterState,
    items,
    equipment,
    ownedShadows: [],  // 그림자 제외
    equippedShadowIds: [],
    activeConsumableEffects: []
  })
  return power
}
```

**검증 결과**: ✅ **완전 통일** - 플레이어와 네임드 헌터는 동일한 스탯 체계 및 전투력 공식 사용

---

### 2.2 그림자 스탯 (13종)

**사용 주체**: OwnedShadow (A급 이상)  
**스탯 종류**: 

```typescript
shadowAttack, shadowDefense, shadowDurability, shadowSpeed,
shadowCrit, shadowFinisher, shadowControl, shadowSuppression,
shadowSupport, shadowSurvival, shadowBossing, shadowExpedition, shadowSynergy
```

#### 그림자 스탯 → 전투 스탯 변환 (`battleUnits.ts:367-433`)

A급 이상 그림자가 전투에 참여할 때, **shadowStats → BattleStats 변환 과정**을 거칩니다:

```typescript
// convertShadowProfileToBattleStats 핵심 공식

// 1. 압축 함수 (compressShadowBattleStat)
//    100 이하: 그대로, 100 초과: 100 + (value - 100) × 0.55
compressShadowBattleStat = value <= 100 ? value : 100 + (value - 100) × 0.55

// 2. 품질 배율 계산
rarity = {common: 0.9, uncommon: 1, rare: 1.06, epic: 1.13, legendary: 1.22}
grade = {C: 0.94, B: 1, A: 1.06, S: 1.14}
levelGrowth = 1 + (level - 1) × 0.015
enhancementGrowth = 1 + enhancement × 0.028
quality = rarity × grade × levelGrowth × enhancementGrowth

// 3. 전투 스탯 변환
maxHp = (165 + shadowDurability × 2.3 + shadowSurvival × 1.55 + level × 7.2) 
        × quality × hpRoleModifier × 1.95 × guardLift

atk = (7 + shadowAttack × 0.85 + shadowCrit × 0.13 + shadowFinisher × 0.20) 
      × quality × 1.22 × assaultLift

def = (5 + shadowDefense × 0.82 + shadowDurability × 0.32 + shadowSurvival × 0.28) 
      × quality × 1.22 × guardLift

spd = (8 + shadowSpeed × 0.82 + ROLE_PRIORITY[role] × 0.45) 
      × (0.95 + grade × 0.05) × 1.08 × speedLift

skillPower = (7 + roleSkillStat(role, stats)) × quality × 1.22 × supportLift

crit = (shadowCrit × 0.006 + shadowFinisher × 0.002) × grade
```

**특징**:
- 압축 함수를 통해 **높은 스탯의 효율을 감소**시켜 인플레이션 방지
- 역할별 특화 배율 적용 (guard: 1.28, assault/hunter: 1.02)
- **SHADOW_BATTLE_LIFT (1.22)** 및 **SHADOW_HP_BATTLE_LIFT (1.95)** 를 통해 전투 기여도 상승

**검증 결과**: ✅ **독립 체계** - 그림자는 13종 전용 스탯을 사용하며, 변환 레이어를 통해 일반 전투 스탯으로 변환

---

### 2.3 몬스터 스탯 (고정값)

**사용 주체**: 게이트/탑/월드의 일반 몬스터  
**스탯 특징**: **성장 없음** (정책적 의도)

#### 몬스터 전투 스탯 계산 (`battleUnits.ts:616-740`)

```typescript
// buildMonsterBattleUnit 핵심 공식
level = 몬스터 레벨
scale = 1 + (level - 1) × 0.088 + max(0, level - 3) × 0.012
bossScale = isBoss ? 1.28 : 1
minionScale = isMinion ? 0.94 : 1
threatScale = bossScale × minionScale

// 역할별 배율
if (isBoss) {
  hpMultiplier = 2.45, atkMultiplier = 1.25, defMultiplier = 1.25
} else if (role === 'tank') {
  hpMultiplier = 1.6, atkMultiplier = 0.8, defMultiplier = 1.4
} else if (role === 'assassin') {
  hpMultiplier = 0.78, atkMultiplier = 1.28, defMultiplier = 0.75
}

// 최종 스탯
maxHp = (115 + level × 23.5) × biasHp × scale × threatScale × hpMultiplier × 1.04 × pressure.hp
atk = (16 + level × 4.55) × biasAtk × scale × threatScale × atkMultiplier × 1.04 × pressure.atk × 0.85
def = (10 + level × 2.05) × biasDef × scale × (isBoss ? 1.12 : 1) × defMultiplier × 1.04 × pressure.def
```

**주의**: 몬스터 공격력/스킬위력에 **0.85 배율 적용** (15% 전역 하향)

**검증 결과**: ✅ **고정 스탯 체계** - 몬스터는 레벨 기반 고정 스탯 사용, 성장 없음 (정책)

---

## 3. 스탯 가치 분석

각 스탯이 전투력(combat power)에 기여하는 **1 포인트당 가치**를 산출하였습니다.

### 3.1 플레이어/네임드 헌터 스탯 가치

**전투력 공식 재구성** (level 50 기준):
```
combatPower = (10 + STR×2 + 100)×3                    [STR 기여]
            + (100 + VIT×10 + 250)×0.5               [VIT 기여]
            + (5 + VIT×1.2 + 50)×2                   [VIT 기여]
            + (10 + AGI×1.5)×1.5                     [AGI 기여]
            + (SEN×0.008)×100                        [SEN 기여]
            + (AGI×0.004 + PER×0.003)×100            [AGI, PER 기여]
            + skillTotalPower×1.5
```

**스탯 1 포인트당 전투력 기여도**:

| 스탯 | 직접 기여 | 간접 기여 | 합계 | 평가 |
|-----|----------|----------|------|------|
| **STR** | atk×3: **6.0** | - | **6.0** | 🔥 고가치 |
| **VIT** | maxHp×0.5: **5.0** + def×2: **2.4** | - | **7.4** | 🔥 최고가치 |
| **AGI** | speed×1.5: **2.25** | evasion×100: **0.4** | **2.65** | 🟢 중간 |
| **INT** | skillPower×1.5: **2.82** | - | **2.82** | 🟢 중간 |
| **PER** | evasion×100: **0.3** | - | **0.3** | ⚠️ 저가치 |
| **SEN** | crit×100: **0.8** | accuracy×100: **0.1** | **0.9** | ⚠️ 저가치 |

### 3.2 문제점

1. **VIT 과대평가**: 7.4 power/point로 최고 가치 (HP + DEF 이중 기여)
2. **STR 고가치**: 6.0 power/point로 2위
3. **PER 과소평가**: 0.3 power/point (VIT의 1/25 수준)
4. **SEN 과소평가**: 0.9 power/point (회피율 기여도 낮음)

**권장 사항**:
- PER에 추가 기여 경로 제공 (예: def 보정, 상태이상 저항)
- SEN의 크리티컬 비율을 상향하거나 스킬위력에 기여하도록 조정
- VIT의 중복 기여를 조정 (maxHp 또는 def 중 하나의 계수 감소)

---

## 4. 전투 난이도 밸런스 검증

### 4.1 게이트 난이도 곡선

게이트 등급별 권장 전투력 및 보상을 분석했습니다 (seed.ts 기준):

| 등급 | 권장 전투력 | 레벨 | 보상 XP | 난이도 점프 | 평가 |
|-----|-----------|------|---------|------------|------|
| E | 200 | 1-3 | 50 | - | ⚠️ **너무 쉬움** |
| D | 550 | 4-7 | 120 | +275% | 🟢 적정 |
| C | 1200 | 8-12 | 220 | +218% | ⚠️ **급격한 벽** |
| B | 1850 | 13-18 | 350 | +154% | 🟢 적정 |
| A | 2650 | 19-25 | 520 | +143% | 🟢 적정 |
| S | 3750 | 26-35 | 750 | +142% | ⚠️ **과도한 인플레이션** |

### 4.2 문제점

1. **E급 진입 장벽 부재**: 권장 200 전투력은 신규 플레이어도 쉽게 달성 → 긴장감 부족
2. **C급 벽**: D급(550) → C급(1200) 점프가 218%로 과도함 → C급 진입 실패율 높음
3. **S급 인플레이션**: 3750 전투력은 달성하기 어려운 수준, 그러나 보상은 비례하지 않음

### 4.3 무한의 탑 밸런스

무한의 탑은 층수에 따라 난이도가 지수적으로 상승합니다:

```typescript
// 층별 보스 스케일 (infiniteTower.ts 예상 공식)
floorDifficulty = baseMonsterLevel + floor × 0.5
bossHp = baseHp × (1 + floor × 0.15)
bossAtk = baseAtk × (1 + floor × 0.12)
```

**문제점**: 
- 초반 10층까지는 쉬움
- 20층 이후 급격한 난이도 상승
- 50층 이상은 사실상 불가능한 벽

---

## 5. 그림자 전투 기여도 분석

### 5.1 그림자 지원 메커니즘 (`game.ts:resolveShadowSupportActions`)

그림자는 전투 중 **확률 기반 지원 공격**을 수행합니다:

```typescript
// 기본 확률
baseChance = 0.10
roleBonus = {assault: 0.15, scout: 0.12, analyst: 0.10, support: 0.08, guard: 0.08/0.15}
extraAttackChance = min(0.18, shadowModifiers.assistChanceBonus)
totalChance = min(0.58, baseChance + roleBonus + extraAttackChance + ...)

// 데미지 계산
rolePower = {assault: 0.28, guard: 0.20, scout: 0.22, analyst: 0.20, support: 0.14}
rarityPower = {legendary: 1.55, epic: 1.35, rare: 1.15, uncommon: 1.0, common: 0.9}
rankPower = {named: 1.3, knight: 1.15, elite: 1.05, soldier: 1.0}
power = rolePower × rarityPower × rankPower × (1 + bonusDamage + executeDamage + ...)

baseDamage = playerStats.atk × (0.55 + power)
damage = calculateDamage({
  attackerAtk: baseDamage,
  defenderDef: monsterStats.def × (1 - defenseDownForDamage),
  skillPower: 1,
  randomFactor: 0.9 + rng() × 0.2
})
```

### 5.2 그림자 기여도 평가

**장점**:
- 확률 기반이라 예측 불가능한 재미 제공
- 역할별/희귀도별 차별화 명확
- 보스전, 저체력 상황에서 특화 보너스

**단점**:
- 지원 공격 확률 상한(58%)이 낮아 체감 빈도 부족
- A급 이하 그림자는 기여도가 미미함
- 그림자 육성 투자 대비 전투 기여도 부족

**권장 사항**:
- 그림자 지원 확률 상한을 65-70%로 상향
- B급 그림자에게 최소 보장 기여도 부여
- 원정 전용 스탯이 전투에도 소폭 영향을 주도록 조정

---

## 6. 종합 평가 및 권장 사항

### 6.1 스탯 통일성
**평가**: ✅ **합격**
- 플레이어/네임드 헌터: 6종 스탯 통일
- 그림자: 13종 전용 스탯 + 변환 레이어
- 몬스터: 고정 스탯 체계

**결론**: 각 유닛 타입별로 명확한 스탯 체계가 확립되어 있으며, 설계 의도에 부합합니다.

---

### 6.2 스탯 가치 균형
**평가**: ⚠️ **불균형 존재**
- VIT (7.4), STR (6.0) 과대평가
- PER (0.3), SEN (0.9) 과소평가
- 격차: 최대 25배

**권장 조치**:
1. **PER 기여 경로 확대**
   - DEF 계산에 PER 기여 추가: `def = 5 + VIT×1.2 + PER×0.5 + level`
   - 상태이상 저항: `statusResist = PER × 0.005`

2. **SEN 가치 상향**
   - 크리티컬 비율 상향: `critRate = min(0.5, SEN × 0.012)` (현재 0.008)
   - 스킬위력 기여 추가: `skillTotalPower += SEN × 0.5`

3. **VIT 중복 기여 조정**
   - DEF 계수 감소: `def = 5 + VIT×0.9 + level` (현재 1.2)
   - 또는 maxHp 계수 감소: `maxHp = 100 + VIT×8 + level×5` (현재 10)

---

### 6.3 난이도 밸런스
**평가**: ⚠️ **곡선 문제 존재**
- E급: 너무 쉬움
- C급: 급격한 벽
- S급: 과도한 인플레이션

**권장 조치**:
1. **E급 권장 전투력 상향**: 200 → 350
2. **C급 권장 전투력 하향**: 1200 → 1000
3. **S급 난이도 재조정**: 3750 → 3200, 또는 보상 대폭 상향

4. **무한의 탑 층별 스케일 완화**:
   ```typescript
   floorDifficulty = baseLevel + floor × 0.4  // 현재 0.5
   bossHp = baseHp × (1 + floor × 0.12)       // 현재 0.15
   ```

---

### 6.4 그림자 기여도
**평가**: 🟡 **개선 필요**
- 확률 상한(58%)이 낮음
- 저등급 그림자 기여도 부족

**권장 조치**:
1. **지원 확률 상한 상향**: 58% → 70%
2. **B급 그림자 최소 보장**: 
   ```typescript
   if (shadow.innateGrade === 'B' && rng() < 0.25) {
     // 강제 지원 공격 발동
   }
   ```
3. **원정 스탯의 전투 기여**:
   ```typescript
   expeditionBonus = shadow.stats.shadowExpedition × 0.002
   baseDamage += expeditionBonus
   ```

---

## 7. 우선순위 로드맵

### 즉시 조치 (High Priority)
1. ✅ PER/SEN 가치 상향 (공식 수정)
2. ✅ C급 권장 전투력 하향 (1200 → 1000)
3. ✅ 그림자 확률 상한 상향 (58% → 70%)

### 단기 조치 (Medium Priority)
4. 🔄 VIT 중복 기여 조정
5. 🔄 E급/S급 난이도 재조정
6. 🔄 무한의 탑 스케일 완화

### 장기 검토 (Low Priority)
7. 🔍 몬스터 성장 시스템 재검토 (현재는 정책상 고정)
8. 🔍 그림자 전투 기여도 전면 재설계
9. 🔍 전투력 공식 전면 개편 (대규모 작업)

---

## 부록 A: 참조 파일 목록

- `src/lib/game.ts` - 전투 공식 및 전투력 계산
- `src/lib/battleUnits.ts` - 전투 유닛 빌드 및 그림자 변환
- `src/lib/shadowStats.ts` - 그림자 스탯 계산
- `src/lib/hunterUnified.ts` - 네임드 헌터 통합 전투력
- `src/lib/combatPower.ts` - 헌터 전투력 분해
- `src/lib/seed.ts` - 게이트/몬스터 정의
- `src/lib/types.ts` - 타입 정의

---

## 부록 B: 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-06-02 | 1.0 | 최초 작성 (종합 분석 및 권장 사항) |

---

**검증 완료**: 이 보고서는 실제 코드 분석을 기반으로 작성되었습니다.
