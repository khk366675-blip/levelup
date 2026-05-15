# LEVEL UP Gate / Combat Design

11차 작업 0단계 문서. 이 문서는 이후 게이트/전투 시스템 구현의 단일 출처다. 11-0에서는 코드, 타입, store, UI, 전투 시뮬레이터를 구현하지 않고 설계만 확정한다.

## 1. 목적

게이트는 지금까지 쌓아온 성장 시스템을 실제로 사용하는 파밍 콘텐츠다. daily/main/dungeon은 XP와 기본 성장을 만들고, 장비/소모품/직업/스킬은 빌드를 구성한다. 게이트는 그 빌드가 의미를 갖는 전투 콘텐츠이자 장비와 아이템을 얻는 핵심 루프가 된다.

핵심 목표는 다음과 같다.

| 목표 | 설명 |
|---|---|
| 성장 사용처 | 레벨, 스탯, 직업, 장비, 소모품이 전투 결과에 반영되게 한다. |
| 파밍 콘텐츠 | XP보다 장비/아이템 획득을 중심 보상으로 둔다. |
| 부담 완화 | 수동 턴제 조작 대신 자동 전투와 사전 세팅으로 자기관리 앱 흐름을 해치지 않는다. |
| 위험 관리 | 패배는 긴장감을 주되 영구 손실은 만들지 않는다. |
| 재도전성 | 무승부는 보상/패널티 없이 세팅 변경 후 다시 도전할 수 있게 한다. |

## 2. 확정 결정사항

| 항목 | 결정 |
|---|---|
| 전투 방식 | 자동 전투 + 사전 세팅 |
| 스킬 사용 | 초기에는 자동 사용 |
| 전투 로그 | 턴별 로그 표시 |
| 전투 결과 | `victory` / `defeat` / `draw` |
| 승리 | 보상 지급, stamina -20, gate cleared |
| 패배 | 보상 없음, stamina -50 + 부상, gate failed |
| 무승부/시간초과 | 보상 없음, 패널티 없음, active 유지 |
| 패배 패널티 | 영구 손실 없음 |
| 부상 회복 | 6시간 경과 또는 퀘스트 3개 완료 중 빠른 쪽 |
| 부상 회복 카운트 | 부상 발생 이후 완료한 퀘스트만 카운트 |
| 게이트 등장 | 랜덤 출현 + 던전 클리어 보상 혼합 |
| 동시 활성 게이트 | 1개 |
| 기존 active gate 있음 | 새 출현 트리거는 무시, 사용자에게 알리지 않음 |
| 보상 역할 | XP는 보조, 장비/아이템이 핵심 |
| 권장 레벨 | 안내용 |
| 권장 전투력 | 실제 위험도/밸런싱 기준 |
| 밸런싱 | 레벨/스탯/직업/스킬/장비/소모품 모두 고려 |
| 목표 승률 | 권장 전투력 기준 60~80% |
| maxStamina | 초기 100 고정 |
| gateEntryCost | 20 |
| stamina 회복 | 시간당 +10, 퀘스트 완료 시 +5 |
| buff/debuff 중첩 | 같은 stat 효과는 refresh, 누적 없음 |
| 시간 저장 | ISO string 저장, 표시는 local time |
| dateKey | `getDateKey()` local `YYYY-MM-DD` 사용 |

## 3. 핵심 루프

```text
현실 퀘스트 / 던전 수행
→ 게이트 출현
→ 게이트 정보 확인
→ 직업 / 장비 / 소모품 / 스킬 상태 확인
→ 자동 전투 시작
→ 턴 로그 확인
→ 승리: 장비/아이템/XP 획득
→ 패배: 스태미나 감소 + 부상
→ 퀘스트 3개 완료 또는 6시간 경과로 회복
→ 무승부: 보상/패널티 없이 세팅 변경 후 재도전
```

역할 분리:

| 시스템 | 역할 |
|---|---|
| daily/main/dungeon | XP와 기본 성장 |
| 랜덤 퀘스트 | 매일의 변수 |
| 장비 | 빌드 세팅 |
| 소모품 | 일회성 전략 카드 |
| 직업/스킬 | 전투 정체성 |
| 게이트 | 성장 사용처와 파밍 콘텐츠 |

## 4. 도메인 모델

### GateRank

```ts
export type GateRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
```

### GateDefinition

```ts
export interface GateDefinition {
  id: string
  name: string
  description: string
  rank: GateRank

  recommendedLevel: number // 안내용
  recommendedPower: number // 실제 위험도 기준

  monsterIds: string[]
  rewardTableId: string
  failPenaltyId: string

  expiresInHours: number
}
```

### ActiveGate

```ts
export interface ActiveGate {
  instanceId: string
  gateId: string
  spawnedAt: string
  expiresAt: string
  status: 'active' | 'cleared' | 'failed' | 'expired'
  source: 'random' | 'dungeon_clear' | 'event'
}
```

정책:

| 항목 | 정책 |
|---|---|
| 동시 활성 게이트 | 1개 |
| active gate가 있을 때 새 트리거 발생 | 무시 |
| 사용자 알림 | 없음 |
| 큐 저장 | 없음 |
| draw 결과 | active gate 상태 유지 |

### MonsterDefinition

```ts
export interface MonsterDefinition {
  id: string
  name: string
  description: string
  rank: GateRank
  stats: MonsterCombatStats
  skillIds: string[]
}

export interface MonsterCombatStats {
  maxHp: number
  atk: number
  def: number
  speed: number
  critRate: number
  accuracy: number
  evasionRate: number
}
```

### SkillDefinition

```ts
export type SkillOwnerType = 'job' | 'equipment' | 'monster' | 'common'
export type SkillType = 'attack' | 'buff' | 'debuff' | 'heal'

export interface SkillDefinition {
  id: string
  name: string
  description: string

  ownerType: SkillOwnerType
  type: SkillType

  power?: number
  cooldownTurns?: number

  effect?: SkillEffect
}
```

주의:

| 항목 | 설명 |
|---|---|
| 스킬 쿨다운 | 턴 기반 |
| 부상/게이트 회복 | 시간 또는 퀘스트 완료 기반 |

### SkillEffect

```ts
export interface SkillEffect {
  stat?: 'atk' | 'def' | 'speed' | 'critRate' | 'accuracy' | 'evasionRate'
  value: number
  durationTurns?: number
  target: 'self' | 'enemy'
}
```

초기 전투는 player vs monster 중심으로 시작한다. 향후 다수 몬스터/광역 스킬이 필요하면 `target`을 확장할 수 있다.

### ActiveCombatEffect

buff/debuff 지속 턴과 refresh 정책을 위해 활성 효과를 별도 개념으로 둔다.

```ts
export interface ActiveCombatEffect {
  sourceSkillId: string
  stat: 'atk' | 'def' | 'speed' | 'critRate' | 'accuracy' | 'evasionRate'
  value: number
  remainingTurns: number
  targetId: string
}
```

중첩 정책:

| 항목 | 정책 |
|---|---|
| 같은 대상 + 같은 stat 효과 재적용 | 누적하지 않음 |
| 새 효과 적용 방식 | 기존 효과를 덮어쓰고 `remainingTurns` refresh |
| 예시 | `atk +10, 3턴` 효과가 남아 있을 때 같은 효과가 다시 적용되면 `atk +20`이 아니라 `atk +10, 3턴`으로 갱신 |

### PlayerCombatStats

```ts
export interface PlayerCombatStats {
  maxHp: number
  atk: number
  def: number
  speed: number
  critRate: number
  evasionRate: number
  accuracy: number
  skillTotalPower: number
}
```

중요 정책:

| 항목 | 정책 |
|---|---|
| 저장 여부 | 저장값이 아니라 유도값 |
| 계산 재료 | base hunter stats + equipment stat_bonus + job modifiers + consumable temporary_stat_bonus + skill modifiers |
| 칭호/영구 업적 | base stat만 사용 |

### BattleTurn

```ts
export interface BattleTurn {
  turnNumber: number

  actorType: 'player' | 'monster'
  actorId: string
  actorName: string

  targetType: 'player' | 'monster'
  targetId: string
  targetName: string

  skillId?: string
  skillName?: string

  outcome: 'hit' | 'miss' | 'evade' | 'critical' | 'buff' | 'debuff' | 'heal'
  damage?: number
  remainingHp?: number

  message: string
}
```

`actorType`과 `targetType`을 명시해서 player와 monster id 충돌을 방지한다.

### CombatLog

```ts
export interface CombatLog {
  battleId: string
  gateInstanceId: string
  result: 'victory' | 'defeat' | 'draw'
  turns: BattleTurn[]
  totalTurns: number
  playerHpRemaining: number
  rewards: GateReward[]
  penaltyApplied?: GatePenalty
}
```

### GateStatus

```ts
export interface GateStatus {
  stamina: number
  maxStamina: number // 초기 100 고정
  injuredUntil?: string
  recoveryQuestProgress?: number
  recoveryQuestRequired?: number
  lastStaminaRecoveredAt?: string
}
```

정책:

| 항목 | 정책 |
|---|---|
| maxStamina | 초기 100 고정 |
| gateEntryCost | 20 |
| 입장 제한 | `stamina < 20`이면 게이트 입장 불가 |
| 자연 회복 | 시간당 +10 |
| 퀘스트 회복 | daily/main/random 퀘스트 완료 시 stamina +5 |
| 상한 | stamina는 maxStamina 초과 불가 |
| 향후 확장 | 직업/장비/칭호/소모품으로 최대치 증가 가능 |

### GateReward / GatePenalty 초안

11-1에서 실제 타입으로 확정한다.

```ts
export interface GateReward {
  type: 'xp' | 'item' | 'equipment' | 'consumable'
  amount?: number
  itemId?: string
  rarity?: ItemRarity
}

export interface GatePenalty {
  staminaLost: number
  injuredUntil?: string
}

export interface GateRewardTable {
  id: string
  rank: GateRank
  xpRange: [number, number]
  itemRarityWeights: Partial<Record<ItemRarity, number>>
  consumableChance?: number
}
```

## 5. 시간 저장 / 날짜 정책

| 항목 | 정책 |
|---|---|
| 시간 필드 | `spawnedAt`, `expiresAt`, `injuredUntil`, `lastStaminaRecoveredAt` 등은 ISO 8601 string으로 저장 |
| 계산 | `Date` 객체로 비교 |
| 표시 | 사용자 브라우저 local time으로 변환 |
| dateKey | 기존 `getDateKey()` helper 사용 |
| 금지 | `toISOString().slice(0, 10)`으로 dateKey를 만들지 않음 |

dateKey는 local `YYYY-MM-DD` 기준이어야 한다. UTC 기반 slice는 한국 시간 자정 근처에서 날짜가 어긋날 수 있다.

## 6. 전투 스탯 공식

```ts
maxHp = 100 + VIT * 10 + level * 5
atk = 10 + STR * 2 + level * 2
def = 5 + VIT * 1.2 + level
speed = 10 + AGI * 1.5
critRate = Math.min(0.5, SEN * 0.008)
evasionRate = Math.min(0.3, AGI * 0.004 + PER * 0.003)
accuracy = Math.min(0.99, 0.95 + SEN * 0.001)
```

정책 설명:

| 항목 | 설명 |
|---|---|
| accuracy base 0.95 | 초반 빗나감 스트레스 방지 |
| critRate cap 0.5 | SEN 의미를 살리되 과도한 치명 방지 |
| evasion cap 0.3 | 회피 빌드 가능하지만 무적 방지 |
| VIT | HP와 방어력에 영향 |
| STR | 공격력에 영향 |
| AGI/PER | 회피와 속도에 영향 |
| SEN | 치명타와 명중에 영향 |

`PlayerCombatStats`는 base hunter stats에 장비, 직업, 소모품, 전투 중 스킬 효과를 반영해서 계산한다. 칭호/영구 업적 조건에는 base stat만 사용한다.

## 7. 전투력 공식

```ts
export function calculateCombatPower(stats: PlayerCombatStats): number {
  return Math.round(
    stats.atk * 3 +
    stats.maxHp * 0.5 +
    stats.def * 2 +
    stats.speed * 1.5 +
    stats.critRate * 100 +
    stats.evasionRate * 100 +
    stats.skillTotalPower * 1.5
  )
}
```

중요:

`accuracy`는 전투력 공식에서 제외한다. `accuracy`는 대부분 0.95~0.99 범위라 변별력이 낮고, 고정 가산점처럼 작동할 수 있기 때문이다.

검증 기준:

| 지표 | 목표 |
|---|---|
| combatPower ratio vs victoryRate | R² 0.85 이상 |
| 권장 전투력 근처 | 승률 60~80% |
| 1.3배 이상 우위 | 승률 80~95% |
| 0.7배 이하 열세 | 승률 30% 이하 또는 매우 위험 |

## 8. 위험도 공식

```ts
export type GateRisk = 'low' | 'normal' | 'high' | 'extreme'

export function estimateGateRisk(playerPower: number, recommendedPower: number): GateRisk {
  const ratio = playerPower / recommendedPower

  if (ratio >= 1.3) return 'low'
  if (ratio >= 1.0) return 'normal'
  if (ratio >= 0.7) return 'high'
  return 'extreme'
}
```

UI 표시:

| Risk | 표시 |
|---|---|
| low | 위험도 낮음 |
| normal | 적정 위험 |
| high | 위험도 높음 |
| extreme | 매우 위험 |

## 9. 데미지 공식

차감형 방어 공식은 방어력이 높아질수록 데미지가 1로 고정되는 문제가 생길 수 있다. 따라서 비율 기반 방어 감소식을 사용한다.

```ts
const randomFactor = randomBetween(0.9, 1.1)
const defenseReduction = defender.def / (defender.def + 100)

const baseDamage =
  attacker.atk *
  skillPower *
  randomFactor *
  (1 - defenseReduction)

let damage = Math.max(1, Math.round(baseDamage))

if (isCritical) {
  damage = Math.round(damage * 1.5)
}
```

예시:

| def | damage reduction |
|---:|---:|
| 20 | 약 16.7% |
| 50 | 약 33.3% |
| 100 | 50% |
| 200 | 약 66.7% |

장점:

| 장점 | 설명 |
|---|---|
| 방어력 확장성 | 방어력이 높아도 데미지가 1에 고정되지 않음 |
| 후반 대응 | 후반 방어력 인플레이션에 견딤 |
| 튜닝 용이 | `def + 100`의 100 값을 조정해 전체 방어 효율을 조절 가능 |

## 10. 명중/회피/치명타 순서

전투 판정 순서는 아래로 고정한다.

1. 명중 판정
2. 회피 판정
3. 치명타 판정
4. 데미지 계산
5. 상태이상 / buff / debuff 적용

의미:

| 단계 | 설명 |
|---|---|
| 명중 실패 | 공격이 빗나감 |
| 회피 성공 | 공격은 들어왔지만 대상이 회피 |
| 치명타 성공 | 피해량 1.5배 |
| 피해 계산 | 방어력 반영 |
| 상태효과 | 스킬 부가효과 |

## 11. 스킬 자동 사용 정책

초기에는 스킬 프리셋을 구현하지 않는다. 현재 직업/장비/몬스터가 가진 스킬을 자동 전투 AI가 사용한다.

### scoreSkill 의사코드

```ts
function scoreSkill(skill: SkillDefinition, context: BattleContext): number {
  if (skill.type === 'attack') {
    return (skill.power ?? 1) * 100
  }

  if (skill.type === 'heal') {
    if (context.self.hpRatio < 0.4) return 200
    return 0
  }

  if (skill.type === 'buff') {
    if (context.turnNumber <= 3) return 150
    return 50
  }

  if (skill.type === 'debuff') {
    return 80
  }

  return 0
}
```

스킬 선택 정책:

1. cooldown이 끝난 스킬만 후보
2. `scoreSkill` 점수가 가장 높은 스킬 선택
3. 점수가 0이면 기본 공격
4. 동점이면 power가 높은 스킬 우선
5. 그래도 같으면 정의 순서 우선

향후 확장:

| 확장 | 내용 |
|---|---|
| 스킬 우선순위 설정 | 어떤 스킬을 먼저 쓸지 |
| 자동 사용 ON/OFF | 특정 스킬 끄기 |
| 스킬 프리셋 | 사전 세팅 저장 |
| 직업별 4스킬 완성 | 기본/강공/buff/궁극기 |
| 장비 액티브 스킬 | 일부 epic/legendary 장비 |

중요:

초기 구현은 작게 시작하지만, 최종 목표는 다양한 스킬 시스템 완성이다.

## 12. 전투 진행

턴 구조:

```text
전투 시작
→ actor 순서 결정
→ 스킬 후보 확인
→ scoreSkill로 스킬 선택
→ 명중/회피/치명타 판정
→ 피해/효과 적용
→ 로그 기록
→ 승패/무승부 체크
→ 다음 턴
```

턴 제한:

| 항목 | 값 |
|---|---:|
| 목표 턴 | 5~15턴 |
| 최대 턴 | 30턴 |
| 30턴 초과 | 무승부 |

actor 순서는 초기 구현에서 speed 내림차순으로 정한다. speed가 같으면 player 우선으로 시작해도 된다. 다수 몬스터를 도입하면 각 actor를 initiative 목록에 넣는다.

## 13. 전투 결과

```ts
export type BattleResultType = 'victory' | 'defeat' | 'draw'
```

| 결과 | 조건 | 보상 | 패널티 | 게이트 상태 |
|---|---|---|---|---|
| victory | 몬스터 전멸 | O | stamina -20 | cleared |
| defeat | 플레이어 HP 0 | X | stamina -50 + 부상 | failed |
| draw | 30턴 초과 | X | X | active 유지 |

무승부 / 시간초과 정책:

| 항목 | 정책 |
|---|---|
| 조건 | 30턴 초과 시 draw 처리 |
| 클리어 인정 | 인정하지 않음 |
| 보상 | XP/아이템/장비/소모품 없음 |
| 패널티 | stamina 감소와 부상 없음 |
| active gate | 유지 |
| 재도전 | 장비, 직업, 소모품 세팅을 바꾼 뒤 다시 도전 가능 |

## 14. 패배 패널티 / 회복

패배 시:

```text
패배
→ stamina -50
→ injuredUntil = now + 6h
→ recoveryQuestProgress = 0
→ recoveryQuestRequired = 3
→ gate status = failed
```

회복 조건:

부상은 둘 중 빠른 쪽으로 회복된다.

1. 6시간 경과
2. 부상 발생 이후 daily/main/random 퀘스트 3개 완료

중요 정책:

| 항목 | 정책 |
|---|---|
| 카운트 시작 | 부상 발생 시점부터 |
| 이전 완료 퀘스트 | 회복 카운트에 포함하지 않음 |
| 부상 발생 시 | `recoveryQuestProgress = 0`으로 초기화 |
| 퀘스트 완료 시 | daily/main/random 퀘스트 완료마다 +1 |
| 즉시 회복 | `recoveryQuestProgress >= recoveryQuestRequired`이면 부상 해제 |
| 던전 부분 진행 | 회복 카운트 제외 |
| 던전 최종 클리어 | 초기 구현에서는 제외 |

초기 구현에서는 daily/main/random 퀘스트 완료만 부상 회복 카운트에 포함한다. 던전 부분 진행과 던전 최종 클리어는 제외한다.

## 15. stamina 회복 / 입장 제한

정책:

| 항목 | 값 |
|---|---:|
| maxStamina | 100 |
| gateEntryCost | 20 |
| 입장 제한 | stamina < 20이면 게이트 입장 불가 |
| 승리 시 | stamina -20 |
| 무승부 시 | stamina 변화 없음 |
| 패배 시 | stamina -50 |
| 하한 | stamina는 0 미만으로 내려가지 않음 |

회복:

| 회복 방식 | 값 |
|---|---:|
| 시간 경과 자연 회복 | 1시간당 +10 |
| daily/main/random 퀘스트 완료 | stamina +5 |
| 상한 | maxStamina 초과 불가 |

UI:

| 상황 | 표시 |
|---|---|
| stamina 부족 | 입장 버튼 비활성화 |
| 안내 문구 | "게이트 스태미나 부족" |

## 16. 게이트 출현 정책

출현 방식은 랜덤 출현 + 던전 클리어 보상 혼합이다.

출현 확률 초안:

| 트리거 | 확률 |
|---|---:|
| 하루 첫 접속 | 5% |
| 일반 던전 최종 클리어 | 15% |
| 월간/고난도 던전 최종 클리어 | 25% |

정책:

| 항목 | 결정 |
|---|---|
| 동시 활성 게이트 | 1개 |
| active gate 있음 | 새 출현 트리거 무시 |
| 보류 큐 | 없음 |
| 사용자 알림 | 없음 |
| 제한 시간 | 24시간 |

명시 문구:

동시 활성 게이트가 있는 동안 발생한 새로운 게이트 출현 트리거는 무시된다. 사용자는 해당 트리거 발생 사실을 알지 못한다.

## 17. 보상 정책

핵심 원칙:

| 콘텐츠 | 중심 보상 |
|---|---|
| daily | XP 성장 중심 |
| gate | 장비/아이템 파밍 중심 |

XP:

게이트 XP = daily 일주일치의 50~80% 수준.

아이템/장비:

| 랭크 | 보상 방향 |
|---|---|
| E | common/uncommon 중심, rare 낮은 확률 |
| D | uncommon/rare 중심 |
| C | rare 중심, epic 낮은 확률 |
| B | rare/epic 중심 |
| A | epic 중심, legendary 낮은 확률 |
| S | 추후 |

소모품도 게이트 보상에 포함 가능하다.

무승부 보상:

draw는 보상 없음. XP도 없고, 아이템/장비/소모품 드롭도 없다.

## 18. 소모품 연동

이미 구현된 소모품 효과 중 게이트 관련 효과:

| 효과 | 게이트 적용 |
|---|---|
| gate_penalty_reduction | 패배 패널티 감소 |
| gate_success_bonus | 전투력 또는 전투 보정 |
| temporary_stat_bonus | combat stats에 반영 |
| temporary_rarity_bonus | 보상 rarity에 반영 가능 |
| temporary_drop_bonus | 보상 roll에 반영 가능 |

정책:

| duration | 처리 |
|---|---|
| next_gate | 게이트 전투 1회에 적용 후 consumed |
| today | 오늘 동안 gate에도 적용 가능 |
| next_quest | 게이트에는 적용하지 않음 |

draw 시 소모품 처리 정책:

draw는 전투 시도였으므로 `next_gate` 소모품은 consumed 처리한다. 단, 보상/패널티는 발생하지 않는다.

## 19. 시뮬레이션 / 밸런싱 계획

게이트 추가 또는 공식 변경 시 100회 시뮬레이션을 기준으로 평가한다.

```text
simulateBattle 100회
→ victoryRate / drawRate / defeatRate
→ averageTurns
→ averageHpRemaining
→ playerPower / gatePower ratio와 승률 상관 확인
```

목표:

| 상태 | 목표 승률 |
|---|---:|
| ratio < 0.7 | 30% 이하 |
| 0.7~1.0 | 30~60% |
| 1.0~1.3 | 60~80% |
| 1.3 이상 | 80~95% |

전투력 공식 검증:

combatPower ratio와 victoryRate의 R² 0.85 이상 목표.

랜덤 시드 정책:

`simulateGateBattle`는 선택적으로 seed를 받을 수 있게 설계한다. 디버깅/재현 테스트 시 같은 seed로 같은 결과를 재현할 수 있게 한다. 일반 플레이에서는 seed 없이 무작위로 실행한다.

## 20. 손계산 3건

계산 편의를 위해 `randomFactor = 1.0`, crit 없음, evade 없음, 기본 공격 `skillPower = 1.0`으로 가정한다. 한 라운드는 player 1회, monster 1회 행동으로 본다. 실제 구현에서는 speed, 명중, 회피, 치명타, 스킬 사용에 따라 결과가 달라진다.

### Case 1: E급 헌터 vs E급 게이트

예시 조건:

| 항목 | 값 |
|---|---|
| 헌터 | Lv5 |
| 스탯 | STR 15, VIT 12, AGI 10, INT 8, PER 8, SEN 8 |
| 보정 | 직업/장비/소모품 보정 없음 |
| 게이트 | 균열의 골목 |
| recommendedPower | 220 |
| 몬스터 | 균열 쥐 |
| 몬스터 스탯 | HP 80, ATK 20, DEF 8, SPEED 12, CRIT 0.03, ACC 0.9, EVA 0.02 |

헌터 combat stats:

| 스탯 | 계산 | 값 |
|---|---|---:|
| maxHp | 100 + 12 * 10 + 5 * 5 | 245 |
| atk | 10 + 15 * 2 + 5 * 2 | 50 |
| def | 5 + 12 * 1.2 + 5 | 24.4 |
| speed | 10 + 10 * 1.5 | 25 |
| critRate | 8 * 0.008 | 0.064 |
| evasionRate | 10 * 0.004 + 8 * 0.003 | 0.064 |
| accuracy | 0.95 + 8 * 0.001 | 0.958 |
| skillTotalPower | 없음 | 0 |

전투력:

```text
50 * 3 + 245 * 0.5 + 24.4 * 2 + 25 * 1.5 + 0.064 * 100 + 0.064 * 100 + 0 * 1.5
= 371.6
≈ 372
```

위험도:

| 항목 | 값 |
|---|---:|
| playerPower | 372 |
| gate recommendedPower | 220 |
| ratio | 1.69 |
| risk | low |

예상 damage:

| 공격 | 계산 | 피해 |
|---|---|---:|
| 헌터 → 균열 쥐 | 50 * (1 - 8 / 108) | 46 |
| 균열 쥐 → 헌터 | 20 * (1 - 24.4 / 124.4) | 16 |

예상 턴 수:

| 항목 | 값 |
|---|---:|
| 몬스터 처치 필요 공격 | ceil(80 / 46) = 2 |
| 플레이어 사망 필요 피격 | ceil(245 / 16) = 16 |
| 예상 결과 | 승리, 약 2라운드 |

평가:

| 항목 | 평가 |
|---|---|
| 난이도 | 너무 쉬움 |
| 목표 턴 5~15턴 대비 | 2라운드라 짧음 |
| 공식 수정 필요 여부 | E/E 입문 게이트로는 가능하지만, 일반 E 게이트라면 몬스터 HP를 올리거나 2마리 구성이 필요 |

### Case 2: E급 헌터 vs D급 게이트

예시 조건:

| 항목 | 값 |
|---|---|
| 헌터 | Lv5 |
| 스탯 | Case 1과 동일 |
| 게이트 | 나태의 소굴 |
| recommendedPower | 480 |
| 몬스터 | 나태의 고블린 |
| 몬스터 스탯 | HP 160, ATK 35, DEF 20, SPEED 14, CRIT 0.05, ACC 0.9, EVA 0.04 |

헌터 combat stats:

Case 1과 동일.

| 항목 | 값 |
|---|---:|
| playerPower | 372 |
| gate recommendedPower | 480 |
| ratio | 0.775 |
| risk | high |

예상 damage:

| 공격 | 계산 | 피해 |
|---|---|---:|
| 헌터 → 나태의 고블린 | 50 * (1 - 20 / 120) | 42 |
| 나태의 고블린 → 헌터 | 35 * (1 - 24.4 / 124.4) | 28 |

예상 턴 수:

| 항목 | 값 |
|---|---:|
| 몬스터 처치 필요 공격 | ceil(160 / 42) = 4 |
| 플레이어 사망 필요 피격 | ceil(245 / 28) = 9 |
| 예상 결과 | 승리, 약 4라운드 |

평가:

| 항목 | 평가 |
|---|---|
| 난이도 | 너무 쉬움 |
| 목표 턴 5~15턴 대비 | 4라운드라 짧고, high 위험도에 비해 안전함 |
| 공식 수정 필요 여부 | 공식 자체보다 D급 몬스터 HP/ATK, 스킬, 다수 몬스터 또는 recommendedPower 기준 재조정 필요 |

### Case 3: D급 헌터 vs C급 게이트

예시 조건:

| 항목 | 값 |
|---|---|
| 헌터 | Lv15 |
| 스탯 | STR 25, VIT 22, AGI 18, INT 14, PER 15, SEN 14 |
| 보정 | 손계산에서는 직업/장비 보정 0으로 단순화 |
| 게이트 | 망각의 서고 |
| recommendedPower | 850 |
| 몬스터 | 망각의 파수꾼 |
| 몬스터 스탯 | HP 320, ATK 55, DEF 35, SPEED 20, CRIT 0.08, ACC 0.92, EVA 0.06 |

헌터 combat stats:

| 스탯 | 계산 | 값 |
|---|---|---:|
| maxHp | 100 + 22 * 10 + 15 * 5 | 395 |
| atk | 10 + 25 * 2 + 15 * 2 | 90 |
| def | 5 + 22 * 1.2 + 15 | 46.4 |
| speed | 10 + 18 * 1.5 | 37 |
| critRate | 14 * 0.008 | 0.112 |
| evasionRate | 18 * 0.004 + 15 * 0.003 | 0.117 |
| accuracy | 0.95 + 14 * 0.001 | 0.964 |
| skillTotalPower | 없음 | 0 |

전투력:

```text
90 * 3 + 395 * 0.5 + 46.4 * 2 + 37 * 1.5 + 0.112 * 100 + 0.117 * 100 + 0 * 1.5
= 638.2
≈ 639
```

위험도:

| 항목 | 값 |
|---|---:|
| playerPower | 639 |
| gate recommendedPower | 850 |
| ratio | 0.752 |
| risk | high |

예상 damage:

| 공격 | 계산 | 피해 |
|---|---|---:|
| 헌터 → 망각의 파수꾼 | 90 * (1 - 35 / 135) | 67 |
| 망각의 파수꾼 → 헌터 | 55 * (1 - 46.4 / 146.4) | 38 |

예상 턴 수:

| 항목 | 값 |
|---|---:|
| 몬스터 처치 필요 공격 | ceil(320 / 67) = 5 |
| 플레이어 사망 필요 피격 | ceil(395 / 38) = 11 |
| 예상 결과 | 승리, 약 5라운드 |

평가:

| 항목 | 평가 |
|---|---|
| 난이도 | 적절과 너무 쉬움 사이, high 위험도치고는 쉬움 |
| 목표 턴 5~15턴 대비 | 5라운드로 하한선에 걸침 |
| 공식 수정 필요 여부 | 5~15턴 목표에는 들어오지만 C급 high 위험도라면 몬스터 스킬/방어/HP 추가 튜닝 필요 |

손계산 총평:

| 관찰 | 메모 |
|---|---|
| 전투력 ratio와 실제 손계산 체감 | 예시 몬스터들이 recommendedPower 대비 약함 |
| 공식 자체 | 비율 방어식은 안정적이고 데미지 1 고정 문제를 피함 |
| 튜닝 방향 | 게이트 rank별 몬스터 HP/ATK, 다수 몬스터, 스킬 power, reward/risk 테이블을 100회 시뮬레이션으로 조정 |

## 21. UI 설계

### Gate Panel

| 항목 | 내용 |
|---|---|
| 게이트명 | 균열의 골목 |
| 랭크 | E/D/C/B/A/S |
| 제한 시간 | 23시간 남음 |
| 권장 레벨 | 안내용 |
| 권장 전투력 | 실제 기준 |
| 내 전투력 | 현재 세팅 기준 |
| 위험도 | 낮음/보통/높음/매우 높음 |
| 몬스터 | 등장 몬스터 |
| 주요 보상 | 장비/아이템 |
| 버튼 | 입장 |

### Pre-Battle Setup

초기에는 복잡한 프리셋 없이 확인형 UI로 시작한다.

| 항목 | 내용 |
|---|---|
| 현재 직업 | 장착 직업 |
| 현재 장비 | 4슬롯 |
| 적용 중 소모품 | next_gate/today 효과 |
| 내 전투력 | 계산값 |
| 예상 위험도 | risk |
| 패배 시 패널티 | stamina/부상 |
| draw 안내 | 시간초과 시 보상/패널티 없이 재도전 가능 |
| 시작 버튼 | 자동 전투 시작 |

### Battle Result

| 항목 | 내용 |
|---|---|
| 결과 | 승리/패배/무승부 |
| 전투 요약 | 턴 수, 남은 HP |
| 보상 | XP, 아이템, 소모품 |
| 패널티 | stamina 감소, 부상 |
| 턴 로그 | 펼치기/접기 |
| 회복 조건 | 부상 시 퀘스트 3개 또는 6시간 |
| 무승부 안내 | 세팅 변경 후 재도전 가능 |

## 22. 구현 단계

### 11-1 타입/데이터 구조

추가 예정:

| 타입 | 목적 |
|---|---|
| GateDefinition | 게이트 정적 정의 |
| ActiveGate | 현재 활성 게이트 인스턴스 |
| MonsterDefinition | 몬스터 정적 정의 |
| SkillDefinition | 스킬 정적 정의 |
| SkillEffect | 스킬 효과 |
| ActiveCombatEffect | 전투 중 활성 buff/debuff |
| PlayerCombatStats | 유도 전투 스탯 |
| BattleTurn | 턴 로그 항목 |
| CombatLog | 전투 로그 |
| GateStatus | stamina/부상 상태 |
| GateRewardTable | 보상 테이블 |
| GatePenalty | 패배 패널티 |

### 11-2 전투 스탯/전투력 계산

```text
calculatePlayerCombatStats()
calculateCombatPower()
estimateGateRisk()
calculateDamage()
```

### 11-3 자동 전투 시뮬레이터

```text
simulateGateBattle()
resolveTurn()
chooseSkill()
scoreSkill()
applySkillEffect()
generateCombatLog()
```

### 11-4 게이트 출현/관리

```text
rollGateSpawn()
spawnGateFromDungeonClear()
expireGate()
recoverGateStamina()
```

### 11-5 UI

```text
GatePanel
PreBattleSetup
BattleResultModal
CombatLogView
```

### 11-6 보상/패널티

```text
applyGateRewards()
applyGatePenalty()
consumeGateConsumables()
recoverGateInjuryProgress()
```

### 11-7 밸런스 점검

```text
simulate 100 battles
victoryRate/drawRate/defeatRate
averageTurns
averageHpRemaining
R² 확인
```

## 23. 하지 말아야 할 것

| 금지 | 이유 |
|---|---|
| 전투력 넘으면 자동 클리어 | 게임성 없음 |
| 실패 패널티 없음 | 긴장감 없음 |
| 레벨만으로 위험도 계산 | 장비/직업/소모품 무시 |
| 장비/소모품 stat을 칭호 조건에 반영 | 업적 의미 붕괴 |
| 스킬을 임시로 대충 만들고 끝 | 게이트 완성도 부족 |
| XP 보상을 과하게 줌 | daily 의미 약화 |
| 동시 게이트 여러 개 | 사용자 부담 증가 |
| 수동 턴제 조작 강제 | 자기관리 앱 본질 훼손 |
| 전투 로그를 건조하게 출력 | 흥미 저하 |
| 보류 게이트 큐 구현 | 복잡도 증가 |
| draw에 보상 지급 | 클리어 실패인데 보상을 주는 모순 발생 |
| draw에 패배 패널티 적용 | 장기전/세팅 실패에 대한 불쾌감 증가 |

## 24. 테스트/검토 기준

11-0은 문서 작업이므로 `npm run build`는 필수는 아니다. 다만 문서만 추가해도 프로젝트가 깨지지 않는지 확인 차원에서 실행할 수 있다.

검토 체크리스트:

| 항목 | 확인 |
|---|---|
| 확정 결정사항 | 문서에 표로 기록 |
| 도메인 모델 | TypeScript 스타일 의사 타입 포함 |
| 전투 스탯 공식 | 수치 공식 포함 |
| 전투력 공식 | `accuracy` 제외 정책 포함 |
| 위험도 공식 | ratio 기준 포함 |
| 데미지 공식 | 비율 기반 방어 감소식 포함 |
| 판정 순서 | 명중 → 회피 → 치명타 → 데미지 → 상태효과 |
| scoreSkill | 자동 스킬 선택 의사코드 포함 |
| buff/debuff refresh | 같은 대상 + 같은 stat은 덮어쓰기 |
| 패배/회복 정책 | stamina -50, 부상, 6시간/퀘스트 3개 |
| stamina 회복 정책 | 시간당 +10, 퀘스트 +5 |
| draw 정책 | 보상/패널티 없음, active 유지 |
| 게이트 출현 정책 | 랜덤 + 던전 클리어, active 있으면 무시 |
| 보상 정책 | XP 보조, 장비/아이템 핵심 |
| 손계산 3건 | E/E, E/D, D/C 포함 |
| 시뮬레이션 계획 | 100회, R² 검증 포함 |
| 구현 단계 | 11-1~11-7 포함 |
# Implementation Status

2026-05-15, 11-16 종합 시뮬레이션 기준으로 Gate/Combat v1은 구현 완료 상태로 판단한다.

- Gate/combat v1 is implemented.
- Auto battle is active.
- Wave battle is supported.
- Equipment combat skills are supported.
- Job combat skills are supported.
- Consumable `gate_success_bonus` is connected as a start-of-battle buff.
- `draw` keeps the active gate with no reward and no penalty.
- Final balance simulation passed v1 criteria.

현재 1차 완성 범위는 자동 전투, 순차 웨이브, 직업/장비/소모품 전투 스킬, 게이트 출현/관리, 보상/패널티, stamina/부상 회복, 전투 로그 UI를 포함한다. 이후 개선은 `CLAUDE.md`의 게이트/전투 Backlog에서 별도 관리한다.

