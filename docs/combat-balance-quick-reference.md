# 전투 밸런스 빠른 참조 가이드

> 📊 전체 보고서: `combat-balance-verification-report.md`

---

## 🎯 핵심 공식

### 플레이어/네임드 헌터 전투력 (game.ts:880-900)

```typescript
// 1단계: 전투 스탯 계산
atk = 10 + STR × 2 + level × 2
def = 5 + VIT × 1.2 + level
maxHp = 100 + VIT × 10 + level × 5
speed = 10 + AGI × 1.5
critRate = min(0.5, SEN × 0.008)
evasionRate = min(0.3, AGI × 0.004 + PER × 0.003)

// 2단계: 전투력 통합
combatPower = atk×3 + maxHp×0.5 + def×2 + speed×1.5 
            + critRate×100 + evasionRate×100 + skillPower×1.5
```

**스탯 1포인트 가치**:
- VIT: **7.4** (최고) ← maxHp + def 이중 기여
- STR: **6.0** (2위)
- INT: **2.82**
- AGI: **2.65**
- SEN: **0.9** ⚠️ 저평가
- PER: **0.3** ⚠️ 최저

---

### 그림자 → 전투 스탯 변환 (battleUnits.ts:367-433)

```typescript
// 압축 함수
compressShadowBattleStat = value <= 100 ? value : 100 + (value - 100) × 0.55

// 품질 배율
quality = rarity × grade × levelGrowth × enhancementGrowth

// 전투 스탯
maxHp = (165 + shadowDurability×2.3 + shadowSurvival×1.55 + level×7.2) 
        × quality × hpRoleModifier × 1.95

atk = (7 + shadowAttack×0.85 + shadowCrit×0.13 + shadowFinisher×0.20) 
      × quality × 1.22

def = (5 + shadowDefense×0.82 + shadowDurability×0.32 + shadowSurvival×0.28) 
      × quality × 1.22

spd = (8 + shadowSpeed×0.82 + ROLE_PRIORITY[role]×0.45) × 1.08

skillPower = (7 + roleSkillStat(role, stats)) × quality × 1.22
```

**특징**:
- 압축 함수로 고스탯 효율 감소 (인플레이션 방지)
- SHADOW_BATTLE_LIFT (1.22), SHADOW_HP_BATTLE_LIFT (1.95)
- 역할별 특화: guard(1.28), assault/hunter(1.02)

---

### 몬스터 스탯 (battleUnits.ts:616-740)

```typescript
scale = 1 + (level - 1) × 0.088 + max(0, level - 3) × 0.012

// 역할별 배율
Boss: hp×2.45, atk×1.25, def×1.25
Tank: hp×1.6, atk×0.8, def×1.4
Assassin: hp×0.78, atk×1.28, def×0.75

// 최종 스탯
maxHp = (115 + level×23.5) × scale × roleMultiplier × 1.04
atk = (16 + level×4.55) × scale × roleMultiplier × 1.04 × 0.85  // ← 15% 전역 하향
def = (10 + level×2.05) × scale × roleMultiplier × 1.04
```

**주의**: 몬스터 atk/skillPower는 **0.85 배율 적용** (15% 하향)

---

## ⚖️ 게이트 난이도 곡선

| 등급 | 권장 전투력 | 난이도 점프 | 문제 |
|-----|-----------|------------|------|
| E | 200 | - | ⚠️ 너무 쉬움 |
| D | 550 | +275% | 🟢 적정 |
| C | 1200 | +218% | ⚠️ **급격한 벽** |
| B | 1850 | +154% | 🟢 적정 |
| A | 2650 | +143% | 🟢 적정 |
| S | 3750 | +142% | ⚠️ 인플레이션 |

**권장 조정**:
- E급: 200 → **350**
- C급: 1200 → **1000**
- S급: 3750 → **3200**

---

## 🌑 그림자 지원 메커니즘 (game.ts:resolveShadowSupportActions)

```typescript
// 발동 확률
baseChance = 0.10
roleBonus = {assault: 0.15, scout: 0.12, guard: 0.08~0.15, ...}
totalChance = min(0.58, baseChance + roleBonus + extraAttackChance + ...)  // ← 상한 58%

// 데미지 계산
rolePower = {assault: 0.28, scout: 0.22, guard: 0.20, ...}
rarityPower = {legendary: 1.55, epic: 1.35, rare: 1.15, ...}
rankPower = {named: 1.3, knight: 1.15, elite: 1.05, soldier: 1.0}
power = rolePower × rarityPower × rankPower × (1 + bonuses...)

baseDamage = playerAtk × (0.55 + power)
```

**문제**: 지원 확률 상한 58%가 낮음 → **70%로 상향 권장**

---

## 🚨 주요 문제점

### 1. 스탯 가치 불균형 (최대 25배 격차)
- **PER(0.3)**: VIT의 1/25 수준
- **SEN(0.9)**: VIT의 1/8 수준
- **권장**: PER에 DEF 기여 추가, SEN 크리티컬 비율 상향

### 2. C급 진입 장벽
- D급(550) → C급(1200) 점프가 218%
- **권장**: C급을 1000으로 하향

### 3. 그림자 기여도 부족
- 지원 확률 상한 58%
- B급 이하 체감 기여도 미미
- **권장**: 상한 70%로 상향, B급 최소 보장 추가

---

## ✅ 통일성 검증 결과

| 유닛 타입 | 스탯 체계 | 전투력 공식 | 성장 |
|----------|----------|-----------|------|
| 플레이어 | 6종 (STR/VIT/AGI/INT/PER/SEN) | calculateCombatPower | ✅ 레벨/스탯 성장 |
| 네임드 헌터 | 6종 (동일) | **플레이어와 100% 동일** | ✅ 스탯 보유 |
| 그림자 (A급+) | 13종 (shadow*) | 변환 레이어 → BattleStats | ✅ 레벨/강화/진화 |
| 몬스터 | 고정 스탯 | 레벨 기반 고정 공식 | ❌ 성장 없음 (정책) |

**결론**: 스탯 체계는 유닛 타입별로 명확히 분리되어 있으며, 설계 의도에 부합합니다.

---

## 📁 참조 파일

- `src/lib/game.ts` - 플레이어 전투 공식
- `src/lib/battleUnits.ts` - 그림자/몬스터 전투 유닛 빌드
- `src/lib/shadowStats.ts` - 그림자 전투력 계산
- `src/lib/hunterUnified.ts` - 네임드 헌터 전투력
- `src/lib/combatPower.ts` - 전투력 분해
- `src/lib/seed.ts` - 게이트/몬스터 정의

---

**마지막 갱신**: 2026-06-02
