# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(또는 다른 AI 에이전트)를 위한 가이드입니다. 프로젝트의 구조, 명령어, 규칙을 빠르게 파악하고 일관되게 작업하기 위한 기준 문서입니다.

> 과거 작업 변경 이력(체인지로그)은 이 파일의 책임이 아닙니다. 변경 내역은 git 커밋과 `docs/` 설계 문서로 관리하세요.

---

## 프로젝트 개요

**levelup**은 "솔로 레벨링" 스타일의 현실 자기계발 RPG 웹 게임입니다. 사용자가 운동·학습·커리어·습관 등 현실 퀘스트를 완료하면 헌터 캐릭터가 경험치와 스탯을 얻고, 직업 각성·게이트 전투·그림자 군단·무한의 탑(비활성화됨) 등 게임 시스템을 통해 성장하는 구조입니다.

- **순수 프론트엔드 SPA**입니다. 백엔드 서버가 없으며 모든 상태는 브라우저 `localStorage`에 저장됩니다(`levelup-save`).
- 선택적 외부 연동: Gemini API(AI 코치), Google Calendar(읽기 전용). 둘 다 없어도 핵심 게임은 동작합니다.

---

## 기술 스택

- **빌드/런타임**: Vite 5 + React 18 + TypeScript 5 (ESM, `"type": "module"`)
- **상태 관리**: Zustand 4 + `persist` 미들웨어 (localStorage)
- **스타일링**: Tailwind CSS 3 + PostCSS + autoprefixer
- **애니메이션**: framer-motion 11
- **아이콘**: lucide-react
- **유틸**: clsx
- **에셋 처리(개발용)**: sharp (이미지 가공 스크립트)

경로 별칭: `@/*` → `src/*` (`tsconfig.json`에 정의).

---

## 명령어

```bash
npm install              # 의존성 설치

npm run dev              # 개발 서버 (http://localhost:3002, --host 로 LAN 노출)
npm run build            # 타입 체크(tsc) 후 프로덕션 빌드 (Vite)
npm run preview          # 빌드 결과 미리보기 (port 3002)

# 에셋 가공 스크립트 (sharp 기반)
npm run process-portraits        # 그림자 초상화 일괄 가공
npm run process-portraits-dry    # 위 작업 dry-run
npm run process-tickets          # 티켓 에셋 가공
npm run process-tickets-dry      # 위 작업 dry-run
```

타입 체크만 단독으로 돌리려면:

```bash
npx tsc --noEmit
```

`scripts/` 안의 시뮬레이션/밸런스 점검 스크립트는 `tsx`로 실행합니다(앱 빌드와 무관, 상태를 변경하지 않음):

```bash
npx tsx scripts/sim-gate-current.ts
npx tsx scripts/sim-growth-1year.ts
# 그 외 scripts/sim-*.ts, scripts/audit-*.ts, scripts/smoke-*.ts 동일 패턴
```

Windows 편의 배치 파일: `start_levelup.bat`, `stop_levelup.bat`.

> 패키지 매니저는 **npm**입니다(`package-lock.json` 존재). yarn/pnpm 락파일을 새로 만들지 마세요.

---

## 디렉토리 구조

```
src/
  main.tsx            # 진입점 (React 마운트)
  App.tsx             # 루트 컴포넌트, 탭 네비게이션(보상/상점/군단/퀘스트/게이트/...)
  index.css           # Tailwind 엔트리 + 전역 스타일

  lib/                # 게임 로직 핵심 (UI 비의존, 순수 로직 위주)
    store.ts          # ★ Zustand 스토어 — 거의 모든 게임 액션과 상태 (대형 파일)
    types.ts          # ★ 전 도메인 타입 + 메타 상수 (StatKey, Category, JobId, ...)
    game.ts           # ★ 순수 계산 헬퍼 (레벨/경험치 곡선, 스탯·보상 밸런스, 강화 등)
    seed.ts           # 기본 데이터 풀 (기본 퀘스트/던전/아이템/스킬/몬스터/게이트)

    combatPower.ts    # 헌터 전투력 산출/비교
    directBattle*.ts  # 직접 전투(수동 전투) 런타임/몬스터/인카운터/타입/라벨
    battleUnits.ts battlePresentation.ts combatIntent.ts monsterPatterns.ts
    shadow*.ts        # 그림자(군단) 시스템: 스탯/스킬/전투/원정/초상화 에셋 등
    jobs.ts hunterGrade.ts promotionExams.ts   # 직업/등급/승급 시험
    skills.ts skillUpgrades.ts skillMotionPresets.ts
    infiniteTower.ts(deprecated) gateEchoes.ts gateRunEvents.ts   # 무한의 탑(deprecated) / 게이트
    shop.ts shopProbabilities.ts   # 상점/확률
    realityPressure.ts secrets.ts secretLore.ts worldSignals.ts expeditionLore.ts
    aiCoach*.ts       # AI 코치 (Gemini 클라이언트/프롬프트/요약/타입)
    googleCalendarClient.ts scheduleSummary.ts   # 캘린더 연동
    equipmentPower.ts ticketVisuals.ts ...

  components/         # React UI 컴포넌트 (패널/모달/카드 단위)
    battle/           # 전투 화면 전용 (아레나 오버레이, HUD, 스프라이트, VFX 등)
    shadows/          # 그림자 카드/도감/추출 연출/원정 UI

  assets/             # 게임 이미지 (battle/, shadows/, extraction/, tickets/)

docs/                 # 설계 문서 (전투/직업/그림자/AI코치 시스템 기획서)
scripts/              # 시뮬레이션·밸런스 점검·에셋 가공 스크립트 (tsx/node)
public/               # 정적 파일
```

핵심 3대 파일은 `src/lib/store.ts`, `src/lib/types.ts`, `src/lib/game.ts`입니다. 게임 메커니즘을 건드릴 때는 거의 항상 이 셋 중 하나 이상을 보게 됩니다.

---

## 아키텍처 핵심

### 상태 흐름
- 모든 게임 상태와 행동(action)은 `src/lib/store.ts`의 단일 Zustand 스토어(`useGame`)에 집중되어 있습니다. 컴포넌트는 `useGame(s => s.xxx)`로 셀렉터를 통해 상태/액션을 구독합니다.
- 순수 계산(경험치 곡선, 보상 밸런스, 스탯 보너스, 전투력 등)은 `game.ts`·`combatPower.ts` 같은 비-스토어 모듈에 분리되어 있습니다. **로직을 추가할 때는 "순수 계산은 lib 헬퍼로, 상태 변경은 store 액션으로"** 원칙을 따르세요.
- 정적 게임 데이터(기본 퀘스트, 아이템 풀, 스킬/몬스터/게이트 정의)는 `seed.ts`에 있습니다.

### 영속성 (중요)
- 스토어는 `persist` 미들웨어로 `localStorage` 키 **`levelup-save`** 에 저장되며, 현재 **`version: 14`** 입니다.
- 저장 스키마(`HunterState` 등 영속 데이터 구조)를 바꾸면 **반드시 `store.ts`의 `migrate` 함수에 마이그레이션 단계를 추가**해서 기존 사용자 세이브가 깨지지 않게 하세요. 스키마를 바꿨다면 `version`도 올립니다.
- `onRehydrateStorage`에서 `syncDefaultQuestMetadata()`를 호출해, 시드(seed)의 기본 퀘스트 메타데이터(제목/설명/마일스톤/가중치)는 최신으로 동기화하되 사용자 진행도(완료 여부, 진행 단계)는 보존합니다. 커스텀 퀘스트는 건드리지 않습니다.
- `manualBattleSession`처럼 휘발성이어야 하는 상태는 `partialize`에서 제외합니다.

### 도메인 모델 요약 (`types.ts`)
- **스탯**: `STR/VIT/AGI/INT/PER/SEN` (근력/체력/민첩/지능/인내/감각)
- **카테고리**: 운동·학습·커리어·건강·정신·재정·관계·도전·습관 — 각 카테고리는 특정 스탯에 매핑됩니다(`CATEGORY_TO_STAT`).
- **난이도/랭크**: `easy~boss` 난이도, `E~National` 랭크(레벨 기반, `rankFromLevel`).
- **직업 시스템**: 레거시 직업과 v2 직업 체계(`JobTier`, `JobRarity`, 히든 클래스, 공명/시그널 기반 해금)가 공존하며 마이그레이션 맵으로 연결됩니다.

---

## 환경 변수

`.env.example` 참고. 로컬에서는 복사해 `.env.local`을 만들고 채웁니다.

- `VITE_GEMINI_API_KEY` — AI 코치(Gemini)용. **`VITE_` 접두사 변수는 빌드 시 브라우저 번들에 노출**되므로, 공개 배포 시에는 서버리스 프록시 등으로 키를 감싸야 합니다. 평문 키를 클라이언트에 박지 마세요.
- `VITE_GOOGLE_CLIENT_ID` — Google Calendar 읽기 전용 OAuth. scope는 `calendar.readonly`만 사용. client secret은 절대 프론트엔드에 두지 않습니다.

`.env*` 파일은 `.gitignore`에 등록되어 있습니다. 커밋하지 마세요.

---

## 작업 규칙 / 컨벤션

1. **변경 후 항상 타입 체크와 빌드를 통과시키세요.**
   ```bash
   npx tsc --noEmit && npm run build
   ```
   이 저장소는 `tsc`를 빌드 게이트로 사용합니다(`build`가 `tsc && vite build`). 타입 에러가 있으면 빌드가 실패합니다. `tsconfig`는 `strict: true`입니다.

2. **게임 코어 로직(전투 공식, 경험치/스탯 밸런스, 경제, 저장 데이터 구조)은 신중하게 다루세요.** 밸런스나 수식을 바꿀 때는 `scripts/`의 관련 시뮬레이션/audit 스크립트로 영향을 점검하는 것이 이 프로젝트의 관행입니다(예: 게이트 밸런스 → `sim-gate-current.ts`, 직업 밸런스 → `audit-job-balance.ts`).

3. **저장 호환성을 깨지 마세요.** 영속 상태 구조 변경 시 `migrate` 갱신 + `version` 증가는 필수입니다(위 "영속성" 참고).

4. **새 게임 데이터는 `seed.ts`에**, **새 타입은 `types.ts`에**, **순수 계산은 `game.ts`(또는 도메인별 lib 모듈)에**, **상태 변경 액션은 `store.ts`에** 추가하는 분리 원칙을 지키세요.

5. **스타일은 Tailwind 유틸리티 클래스로** 작성합니다. 다만 Tailwind 기본 spacing scale에 없는 임의 치수가 0px로 찌그러지는 회귀가 과거에 있었으니, 커스텀 픽셀 치수가 중요한 곳은 inline style 사용도 고려하세요.

6. **UI 문자열은 한국어**가 기본입니다(라벨·메시지). 기존 톤과 용어(헌터/게이트/그림자/군단/각성 등)를 유지하세요.

7. 컴포넌트는 패널/모달/카드 단위로 `components/`에 두고, 전투·그림자 전용은 각각 `components/battle/`, `components/shadows/` 하위에 배치합니다.

---

## TEMP DEV CHEAT (임시 검증용 치트)

Living Rift World 군주 및 Angel 결전 검증을 위한 임시 치트 모듈이 내장되어 있습니다. 이 기능은 개발 모드(`import.meta.env.DEV`)에서만 작동하며 프로덕션 빌드 번들에서는 원천 제외됩니다.

- **치트 UI 위치**: `src/components/dev/DevCheatPanel.tsx` (App 최하단 렌더링)
- **치트 로직 위치**: `src/lib/devCheats.ts` (백업/복원/삭제 및 Monarch/Angel 프로필 주입)
- **치트 백업 Key**: `levelup-save-dev-cheat-backup` (로컬스토리지 복사본)
- **검증 완료 후 기능 완전 롤백/삭제 방법**:
  1. `src/lib/devCheats.ts` 파일 삭제
  2. `src/components/dev/DevCheatPanel.tsx` 파일 삭제
  3. `src/App.tsx`에서 `DevCheatPanel` import문과 최하단 렌더링 코드 제거
  4. 검색어 `DEV_CHEAT`로 확인 및 잔여 제거

---

## 참고 문서

`docs/` 폴더에 시스템별 설계 문서가 있습니다(전투, 게이트, 직업 v2, 그림자 스킬/전투/장비/원정, AI 성장 코치 등). 해당 시스템을 수정하기 전에 관련 설계 문서를 먼저 확인하면 의도를 빠르게 파악할 수 있습니다.

### 최근 검증 문서
- `docs/combat-balance-verification-report.md` — 전투 시스템 종합 밸런스 검증 보고서 (2026-06-02)

---

## 작업 이력

### 2026-06-02: 전투 시스템 밸런스 검증 (10-4 작업)

**작업 내용**:
- 전투 시스템 5개 경로 파악: Gate, Infinite Tower, Living World, Direct Battle, Shadow Expedition
- 플레이어/네임드 헌터 스탯 체계(6종) 및 전투력 공식 분석
- 그림자 스탯 체계(13종) 및 전투 스탯 변환 공식 파악 (`battleUnits.ts:convertShadowProfileToBattleStats`)
- 몬스터 고정 스탯 체계 분석 (정책적으로 성장 없음)
- 스탯 가치 분석: VIT(7.4)/STR(6.0) 고가치, PER(0.3)/SEN(0.9) 저가치 발견
- 난이도 곡선 문제: E급 너무 쉬움, C급 급격한 벽, S급 인플레이션
- 그림자 전투 기여도 메커니즘 분석 (`resolveShadowSupportActions`)

**검증 결과**:
1. ✅ **스탯 통일성**: 헌터/플레이어는 6종 스탯 통일, 그림자는 13종 전용 스탯 + 변환 레이어, 몬스터는 고정 스탯
2. ⚠️ **스탯 가치 불균형**: PER/SEN 과소평가 (VIT의 1/25 수준), 조정 권장
3. ⚠️ **난이도 밸런스**: C급 벽(218% 점프), E급/S급 재조정 필요

**권장 사항**:
- PER에 DEF 기여 추가 또는 상태이상 저항 추가
- SEN의 크리티컬 비율 상향 또는 스킬위력 기여 추가
- C급 권장 전투력 하향 (1200 → 1000)
- 그림자 지원 확률 상한 상향 (58% → 70%)

**관련 파일**:
- `docs/combat-balance-verification-report.md` — 검증 보고서 (신규)
- `src/lib/game.ts` — 전투 공식 및 전투력 계산
- `src/lib/battleUnits.ts` — 그림자 스탯 변환 로직
- `src/lib/shadowStats.ts` — 그림자 전투력 계산
- `src/lib/hunterUnified.ts` — 네임드 헌터 통합 전투력
- `src/lib/combatPower.ts` — 헌터 전투력 분해

**persist version**: 12 유지 (스키마 변경 없음)
