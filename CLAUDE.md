# LEVEL UP — 프로젝트 가이드

## 프로젝트 개요
솔로 레벨링 웹툰 세계관 기반 RPG 웹앱. 헌터가 게이트를 클리어하고, 그림자를 소환/육성하며, 직업을 전직하는 성장형 RPG.

## 기술 스택
- **Framework**: React + TypeScript + Vite
- **State**: Zustand (persist v14, key: `levelup-save`)
- **UI**: Tailwind CSS + Framer Motion
- **Scripts**: `npx tsx scripts/...`

## 빌드 & 검증 명령어
```bash
npx tsc --noEmit       # 타입 검사
npm run build          # 프로덕션 빌드
npx tsx scripts/smoke-direct-battle-runtime.ts  # 전투 런타임 검증
```

## 주요 저장소 불변 규칙
- persist version: **v14**, key: **`levelup-save`**
- 세이브 호환성을 깨는 변경은 반드시 마이그레이션 코드 동반

## 핵심 시스템 현황

### 전투 시스템 (`src/lib/`, `src/components/battle/`)
- **DirectBattle**: 실시간 2.5D 전장 (`Battlefield2DView.tsx`, `BattleArenaOverlay.tsx`)
- 턴 한계: `HARD_SAFETY_ROUND_LIMIT = 200` (무한루프 방지)
- 전장 모드: `compact` / `overlay` (prop으로 구분)
- 핵심 파일: `directBattleRuntime.ts`, `directBattleMonsters.ts` (36종 몬스터)

### 그림자 시스템 (`src/components/shadows/`, `src/lib/shadowStats.ts`)
- 그림자 초상화: `ShadowPortrait.tsx` (카드/도감용), `ShadowBattleSprite.tsx` (전투 전용)
- Legion Node 성좌 6종 (`SHADOW_LEGION_NODES`), 순환 참조 방지용 리졸버 구조
- 태생 등급 재각성: C→B(50%), B→A(30%), A→S(10%)

### 직업 시스템 (`src/lib/jobs.ts`, `src/components/JobPanel.tsx`)
- 트리: Novice → 1차(6종) → 2차(8종) → 3차(24종) + 히든 3계열(그림자/저주/차원)
- 히든 직업: Hidden Resonance 공명 점수 누적으로 해금 (`HiddenJobPathProgress`)
- 전직은 반드시 수동 선택 (`advanceToJob`), 자동 전직 없음

### 히든 직업 공명 가중치 (`SIGNAL_WEIGHTS`)
| 이벤트 | 점수 |
|--------|------|
| 그림자 추출 시도 | +1 |
| 추출 성공 | +3 |
| rare 이상 획득 | +4 |
| named 획득 | +5 |
| 원정 성공/대성공 | +2/+4 |
| 생사경 극복 승리 | +3 |
| S급/보스 긴박 승리 | +5 |

## 주요 컴포넌트 위치
```
src/components/
  battle/
    BattleArenaOverlay.tsx   # 전체화면 전투 오버레이
    Battlefield2DView.tsx    # 2.5D 전장 렌더러
    BattleActorSprite.tsx    # 유닛 스프라이트 (inline style 크기 고정)
    BattleHudPanel.tsx       # HP HUD
    BattleCommandPanel.tsx   # 조작 패널
    ShadowBattleSprite.tsx   # 전투용 그림자 PNG 렌더러
  shadows/
    ShadowPortrait.tsx       # 카드/도감용 그림자 초상화
    ShadowCard.tsx
  DirectBattlePreviewPanel.tsx  # 전투 진입/미니뷰 패널
  JobPanel.tsx
  ShadowPanel.tsx

src/lib/
  battlePresentation.ts    # 전투 ViewModel 어댑터
  directBattleRuntime.ts   # 전투 엔진 코어
  directBattleMonsters.ts  # 36종 몬스터 정의
  jobs.ts                  # 직업 트리 정의
  store.ts                 # Zustand 스토어 (전체 게임 상태)
  types.ts                 # 타입 정의
  shadowStats.ts           # 그림자 스탯 계산
```

## CSS 핵심 클래스 (`src/index.css`)
- `.grade-aura-s`, `.grade-aura-a` — 태생 등급 오라
- `.tier-aura-first/second/third` — 직업 티어 오라
- `.tier-aura-hidden-shadow/curse/rift` — 히든 직업 오라
- `.card-premium-shine` — 3D 광택 카드
- `.named-pulse` — Named 그림자 맥동

## 작업 원칙
- 코드 변경 후 반드시 `npx tsc --noEmit` → `npm run build` 검증
- 게임 밸런스 수치(공식, 확률, 보상)는 명시적 지시 없이 변경 금지
- `BattleActorSprite.tsx` 크기는 Tailwind 비표준 클래스 금지, inline style 사용
