# 게이트 전투 수치 점검 보고서

작성일: 2026-06-02

## 1. 범위와 기준

이 문서는 “밸런스 평가”라기보다 현재 코드에 정의된 게이트 등급별 전투 수치를 정리한 보고서다.

기준 파일:

- 일반 게이트 고정 정의: `src/lib/seed.ts`의 `GATE_DEFINITIONS`, `MONSTER_DEFINITIONS`
- 월드맵 게이트 동적 정의: `src/lib/livingWorld.ts`, `src/lib/store.ts`의 월드 노드 임시 `GateDefinition` 생성 규칙
- Direct Battle 전투 풀: `src/lib/directBattleEncounters.ts`, `src/lib/directBattleMonsters.ts`, `src/lib/battleUnits.ts`
- 플레이어 전투력 산출: `src/lib/game.ts`, `src/lib/battleUnits.ts`
- 집계 스크립트: `scripts/audit-gate-balance-report.ts`

중요한 구조 차이:

- 현재 고정 일반 게이트는 E/D/C만 정의되어 있다.
- B/A/S 일반 게이트 고정 정의는 아직 없고, 월드맵/승급 심사/Direct Battle encounter pool에서 설계 구간으로 존재한다.
- 월드맵 기본 활성 노드는 현재 E 1개, D 1개다. 이후 B/A/S는 런타임 확장, 러브콜, 군주전, 추가 노드 설계 흐름에서 다룬다.
- Direct Battle 수치는 `recommendedLevel + rankBonus`를 적 레벨로 변환해 산출된다. 아래 Direct Battle 표는 월드맵 기준 레벨 E 6, D 17, C 33, B 50, A 67, S 89를 사용했다.

## 2. 일반 게이트

### 2.1 등급별 게이트/몬스터 요약

| 등급 | 고정 게이트 수 | 권장 레벨 | 권장 CP | Wave | 개별 몬스터 평균 HP/ATK/DEF/SPD | 비고 |
|---|---:|---:|---:|---:|---:|---|
| E | 3 | 3-5 | 300-420 | 1-2 | 117 / 25 / 10 / 15 | 입문용. 장비 없이도 통과 가능 |
| D | 2 | 10-12 | 800-900 | 1-2 | 277 / 61 / 22 / 13 | E 몬스터 혼합 포함 |
| C | 4 | 15-17 | 1620-1720 | 1-2 | 1284 / 228 / 71 / 19 | 현재 고정 일반 게이트의 실질 상한 |

### 2.2 일반 게이트 몬스터 종류별 수치

| 종류 | 몬스터 | 등급 | HP | ATK | DEF | SPD | 전투 성격 |
|---|---|---:|---:|---:|---:|---:|---|
| 하급/소형 | 균열 쥐 | E | 133 | 25 | 10 | 12 | 기본 물기, 낮은 회피 |
| 기동형 | 균열 들개 | E | 100 | 24 | 10 | 18 | 빠른 E급, scratch 보유 |
| 디버프 브루저 | 나태의 고블린 | D | 420 | 96 | 34 | 14 | D급 핵심 몬스터, curse 보유 |
| 탱커형 | 피로의 간수 | C | 1620 | 190 | 100 | 14 | 방어/HP가 높아 장기전 유도 |
| 제어형 | 망각의 파수꾼 | C | 1520 | 240 | 82 | 20 | 기억/집중 방해, C급 표준 위협 |
| 추적형 | 기억 추적자 | C | 1080 | 205 | 58 | 17 | 중간 HP, memory fog |
| 고속형 | 기억 정찰자 | C | 900 | 240 | 52 | 22 | 낮은 HP, 높은 속도/공격 |
| 공격형 | 탐욕의 파수꾼 | C | 1300 | 265 | 64 | 22 | C급 최고 ATK, 짧은 전투 압박 |

### 2.3 일반 게이트 보스 처리

고정 일반 게이트에는 전용 보스 몬스터가 별도로 정의되어 있지 않다. GateRun에서 `boss` encounter가 나오면 해당 게이트의 몬스터 목록 중 보스처럼 보이는 몬스터 또는 마지막 몬스터를 보스 슬롯으로 사용한다.

보스 encounter 기본 보정:

- `difficultyMod`: 1.7
- `riskDelta`: 30
- `rewardMultiplier`: 1.5
- rank가 E가 아니고 몬스터가 2종 이상이면 보스 보조 몬스터 1기를 추가할 수 있음

즉 현재 일반 게이트 보스는 “전용 보스 설계”라기보다 기존 등급 몬스터에 보스 encounter 보정을 얹는 구조다.

## 3. 월드맵 게이트

### 3.1 현재 기본 활성 월드맵 노드

시드 888 기준 초기 월드맵 활성 노드:

| 등급 | 노드 수 | 난이도 CP | 평균 난이도 | 남은 일수 |
|---|---:|---:|---:|---:|
| E | 1 | 853 | 853 | 15 |
| D | 1 | 1790 | 1790 | 13 |

월드맵 게이트는 일반 게이트보다 같은 랭크라도 난이도 CP가 높다. 초기 생성식에서 E/D/C는 기본 난이도 범위에 `1.8` 배율이 붙고, S급은 별도 5000-10000 범위를 사용한다.

### 3.2 월드맵 레거시 몬스터 매핑

월드맵 노드가 고정 `GATE_DEFINITIONS`에 없을 때, `store.ts`에서 랭크별 몬스터 조합을 임시로 만든다.

| 월드맵 등급 | 매핑 몬스터 | 평균 HP/ATK/DEF/SPD | 비고 |
|---|---|---:|---|
| E | 균열 쥐, 균열 들개 | 117 / 25 / 10 / 15 | 일반 E와 동일 |
| D | 나태의 고블린, 나태의 완력병 | 336 / 73 / 33 / 12 | 일반 D보다 순수 D 조합 |
| C | 망각의 파수꾼, 피로의 간수 | 1570 / 215 / 91 / 17 | C 탱커/제어 조합 |
| B | 기억 추적자, 기억 정찰자 | 990 / 223 / 55 / 20 | 현재는 C 몬스터 재활용 |
| A | 탐욕의 파수꾼, 기억 정찰자 | 1100 / 253 / 58 / 22 | 현재는 C 몬스터 재활용 |
| S | 망각의 파수꾼, 탐욕의 파수꾼 | 1410 / 253 / 73 / 21 | 군주전과는 별개, 임시 S 노드용 |

주의: 이 표의 B/A/S는 레거시 wave 전투용 임시 매핑이다. 실제 Direct Battle 기준의 B/A/S 전투 규모는 아래 표처럼 훨씬 크다.

### 3.3 월드맵/Direct Battle 등급별 적 평균

아래 수치는 Direct Battle encounter pool의 “개별 적 유닛 평균”이다. 실제 encounter는 보통 2-3기의 적으로 구성된다.

| 등급 | 기준 적 레벨 | Encounter 수 | 주요 역할 분포 | 개별 적 평균 HP/ATK/DEF/SPD/SKILL | 보스 포함 |
|---|---:|---:|---|---:|---|
| E | 6 | 4 | bruiser, minion, assassin | 419 / 61 / 25 / 18 / 46 | 없음 |
| D | 17 | 5 | bruiser, minion, caster, tank, assassin, support | 1709 / 204 / 105 / 30 / 221 | 없음 |
| C | 33 | 5 | tank, caster, assassin, support, bruiser, controller, minion | 5712 / 558 / 349 / 48 / 663 | 없음 |
| B | 50 | 6 | bruiser, controller, tank, support, caster, minion, assassin | 12700 / 1230 / 710 / 67 / 1504 | 없음 |
| A | 67 | 6 | tank, controller, assassin, caster, bruiser, support | 27890 / 2910 / 1345 / 96 / 3467 | 없음 |
| S | 89 | 7 | controller, assassin, tank, caster, support, boss, minion | 62761 / 4930 / 2262 / 118 / 5350 | 있음 |

### 3.4 월드맵/Direct Battle 보스

Direct Battle 보스 풀은 encounter type이 `boss`일 때 따로 선택된다.

| 등급 | 보스 풀 구조 |
|---|---|
| E/D | `boss_minion`, `boss_double_minion` 중심. Mock Gate Boss + 미니언/방패/저주 토큰 |
| C/B | E/D 보스 풀에 `commander_line`, `oblivion_watch` 추가 |
| A/S | `commander_line`, `oblivion_watch`, `iron_wall_court`, `abyss_devourer_pack`, `memory_warden_party` 중심 |

S급 대표 보스 라인:

- Rift Commander: 지휘/시너지형 보스
- Oblivion Watcher: 제어형 보스
- Iron Wall Lord: 방어형 보스
- Abyss Devourer: 공격/처형형 보스
- Memory Warden: 제어 + 보호 라인 보스

GateRun 보스 encounter에서는 기본적으로 난이도 1.7배, 보상 1.5배가 적용된다. 월드맵 선택지에 따라 일반 전투는 `nextCombatDifficultyDelta` -15%~+15%, 보스는 `bossDifficultyDelta` -10%~+10%가 추가로 반영될 수 있다.

## 4. 플레이어 측 도달 기준

아래 표는 “해당 등급 게이트에 도달했을 때 적당한 헌터 상태”를 가정해 산출한 기준이다. `combatPower`는 헌터 본체 중심 전투력이고, `BattleUnit` 수치는 실제 Direct Battle에 투입되는 헌터 본체 스탯이다. 그림자는 별도 유닛으로 참가하므로 본체 CP보다 실제 파티 체감 전투력은 더 높다.

| 목표 등급 | 헌터 레벨 | 직업/장비 가정 | 그림자 가정 | 본체 CP | 헌터 BattleUnit HP/ATK/DEF/SPD/SKILL |
|---|---:|---|---|---:|---:|
| E | 5 | 미각성, 장비 없음 | 없음 | 360 | 743 / 85 / 61 / 31 / 94 |
| D | 12 | 미각성, uncommon 장신구 1개 | E급 0-1기 | 592 | 1213 / 151 / 110 / 41 / 166 |
| C | 22 | 1차 직업, rare 장비 2개, +1 일부 | E/D급 1-2기, rare 1기 기대 | 825 | 1681 / 209 / 166 / 50 / 271 |
| B | 45 | 2차 직업, epic/legendary 4부위, +2 내외 | rare/epic 2-3기 | 2133 | 4733 / 638 / 466 / 137 / 882 |
| A | 60 | legendary 4부위, +3~+4, 5성 일부 | epic/legendary 3-4기 | 3030 | 6928 / 890 / 691 / 200 / 1166 |
| S | 80 | legendary 4부위, +5, 5성 | legendary/named 4-5기 | 4458 | 10243 / 1316 / 1023 / 300 / 1668 |

### 4.1 기존 일반 게이트 시뮬레이션 기준

기존 `scripts/sim-gate-current.ts` 결과 요약:

- Lv5 / CP 360: E 게이트 100% 승리, D/C는 차단
- Lv10 / CP 540: E 안정, D는 12-16% 승리로 위험 도전권
- Lv20 / CP 783: D 100%에 가까워져 다소 쉬움, C는 0%로 차단
- Lv30 / CP 1449: C 55-68% 승리, 현재 C 도전 기준에 가장 근접
- Lv45 / CP 2130: C 100% 승리, C 졸업/B 진입 기준
- Lv60 / CP 3030: E/D/C 완전 trivialize

## 5. 종합 메모

1. 일반 게이트 고정 정의는 E/D/C까지만 있어, 현재의 “일반 게이트 밸런스”는 초중반 전투 수치 점검에 머문다.
2. 월드맵의 레거시 몬스터 매핑은 B/A/S에서도 C급 몬스터를 재활용한다. 난이도 CP와 Direct Battle 풀로 보정되지만, 레거시 wave만 보면 상위 등급 몬스터 정체성이 약하다.
3. Direct Battle의 B/A/S는 수치가 매우 크게 상승한다. 특히 A/S는 개별 적 평균 HP가 27890/62761까지 오르므로, 헌터 본체 CP만으로는 부족하고 그림자 파티, 역할 대응, 보스 대응 스킬을 전제로 봐야 한다.
4. 보스 전용 몬스터는 일반 고정 게이트에는 부족하다. 상위 게이트의 체감 품질을 올리려면 B/A/S 전용 레거시 몬스터 또는 일반 게이트 보스 정의를 추가하는 편이 좋다.
5. 플레이어 성장 기준으로는 Lv30 전후가 C 도전권, Lv45 전후가 B 진입권, Lv60+가 A 진입권, Lv80+가 S 진입권으로 보는 것이 자연스럽다.
