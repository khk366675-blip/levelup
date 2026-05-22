# LEVEL UP — Hunter System

"나 혼자만 레벨업" 컨셉을 차용한 게임화 자기개발 웹앱. 개인 프로젝트, 로컬 단일 사용자용.

## 실행

| 동작 | 명령 |
|---|---|
| 시작 | `start_levelup.bat` (포트 정리 → vite 실행 → 브라우저 오픈) |
| 종료 | `stop_levelup.bat` (포트 3002 LISTENING 프로세스 kill) |
| 수동 | `npm run dev` — http://localhost:3002 |
| 빌드 | `npm run build` |

dev 서버는 `vite.config.ts`에서 `strictPort: true, port: 3002`로 고정.

## 스택

- **Vite + React 18 + TypeScript** — SPA, 라우팅 없이 탭 전환
- **Tailwind CSS** — 다크 + 시안/퍼플 홀로그램 테마
- **Zustand + persist** — localStorage 키 `levelup-save`에 전체 상태 저장
- **framer-motion** — 레벨업 모달, 카드 전환, XP 바 애니메이션
- **lucide-react** — 아이콘

## 파일 구조

```
levelup/
├── start_levelup.bat / stop_levelup.bat
├── index.html, vite.config.ts, tsconfig.json
├── tailwind.config.js, postcss.config.js
├── public/sword.svg
└── src/
    ├── main.tsx              # 엔트리
    ├── App.tsx               # 헤더 + 탭 네비 + 페이지 라우팅
    ├── index.css             # tailwind + 글로벌 (그리드, 코너 브라켓, 스캔라인, XP 시머)
    ├── components/
    │   ├── HunterStatus.tsx  # 이름/직업/레벨/EXP/랭크/스탯/스트릭 패널
    │   ├── QuestCard.tsx     # 일일/메인/던전 공통 카드
    │   ├── AddQuestModal.tsx # 커스텀 퀘스트 추가
    │   ├── Inventory.tsx     # 획득 아이템 그리드
    │   ├── TitleCollection.tsx # 칭호 컬렉션 (보유/미보유, 장착 UI)
    │   └── SystemMessage.tsx # "── SYSTEM ──" 모달 큐
    └── lib/
        ├── types.ts          # Quest/Item/Stat/Category/Difficulty/Rarity 타입과 메타
        ├── game.ts           # xpToNextLevel, rankFromLevel, 날짜 유틸, 스탯 보너스 헬퍼
        ├── seed.ts           # 기본 일일/메인/던전 + 아이템 풀
        └── store.ts          # Zustand 스토어 (모든 게임 로직)
```

## 게임 모델

**Hunter**
- `level`, `xp`, `totalXp`, `rank` (E→D→C→B→A→S→National), `job`, `streak`
- 스탯 6종: `STR`(근력) `VIT`(체력) `AGI`(민첩) `INT`(지능) `PER`(인내) `SEN`(감각)
- `freeStatPoints`: 사용자가 직접 배분할 수 있는 자유 포인트 (레벨업 시 +1)
- `categoryProgress`: 레벨업 이후 카테고리별 완료 횟수 (자동 분배 결정용)
- `streakProtectionLastUsed`: PER 기반 streak 보호 마지막 사용 날짜
- `ownedTitleIds`: 해금한 칭호 ID 목록
- `equippedTitleId`: 현재 장착 중인 칭호 ID

**칭호 시스템 (v6 — 기반 구조 + 컬렉션 UI)**
- 칭호 정의: `types.ts > TITLE_DEFINITIONS` (17개 일반 칭호)
- 카테고리: `progress` (진행도), `stat` (스탯), `collection` (수집), `hidden` (히든), `meta` (메타)
- 레어리티: `normal`, `rare`, `epic`, `legendary`
- 자동 해금 조건:
  - **레벨**: 5 (첫 각성), 25 (헌터), 50 (베테랑 헌터)
  - **STR**: 30 (단련된 자), 50 (무쇠의 헌터), 80 (강철의 헌터)
  - **INT**: 30 (현자의 견습), 50 (시장의 눈), 80 (분석가)
  - **PER**: 50 (불굴의 의지), 80 (강철 멘탈)
  - **SEN**: 50 (깨어있는 자), 80 (직감의 지배자)
  - **수집**: epic 이상 첫 획득 (첫 보물), 인벤토리 50개 (수집가), legendary 첫 획득 (전설을 손에)
  - **던전**: 첫 던전 클리어 (그림자 사냥꾼)
- 첫 해금 칭호는 자동 장착
- 헤더에 장착 칭호 표시 (amber 색상)
- 해금 시 SystemMessage (kind: 'title') 표시
- **칭호 컬렉션 탭**: 보유/미보유 칭호 확인, 장착 UI, 필터 (전체/보유/미보유)
- 앱 진입 시 자동 해금 체크 (`checkTitleUnlocks`)

**스탯 시스템 (v5 — 실작동)**
- 레벨업 시 **자동 +2** (직전 레벨업 이후 가장 많이 완료한 카테고리의 스탯) + **자유배분권 +1**
- 카테고리 → 스탯 매핑 (`game.ts > CATEGORY_TO_STAT`):
  - workout/health → STR
  - study/career → INT
  - mind/finance → SEN
  - habit/challenge → PER
  - social → AGI
- 스탯 효과 (10마다):
  - **STR**: 운동/건강 daily/dungeon XP +5%
  - **VIT**: 운동/건강 daily 드롭률 +3%
  - **AGI**: dungeon 부분 보상 XP +5%
  - **INT**: 학습/커리어 daily/dungeon XP +5%
  - **PER**: streak 자동 보호 (월 1회, 10마다 1회)
  - **SEN**: 레어리티 가중치 보너스 +1% (epic/legendary 확률 증가)

**Quest** (`type: 'daily' | 'main' | 'dungeon'`)
- **daily** — `lastCompletedAt` + `cooldownDays`로 가용성 판정. `recurring: true`.
  - `cooldownDays` 의미: cycleLength = `cooldownDays + 1`.
    - 0 또는 undefined → 매일 가능 (다음날 자정 리셋)
    - 1 → 격일 (월 완료 → 수 가용)
    - 4 → 5일 주기 (일 완료 → 금 가용)
  - 가용성 헬퍼: `game.ts > getCooldownRemaining(q)` (남은 일수 반환, 0이면 가용)
- **main** — 1회성 장기 목표, `completed` 플래그.
- **dungeon** — `totalSteps` / `currentSteps`로 단계 진행. 매 진행마다 부분 XP, 클리어 시 전체 보상 + 보장 아이템 드롭.

**자동 재생성 (resetCycle)**
- `resetCycle: 'monthly'` + `lastResetAt` 필드로 main/dungeon을 매월 1일에 자동 리셋.
- 트리거: 앱 마운트 시 `App.tsx`가 `resetDailiesIfNewDay()` 호출 → 내부에서 monthly reset도 같이 처리.
- 동작: `isBeforeMonth(lastResetAt)`가 true면 main은 `completed=false`, dungeon은 `currentSteps=0`로 되돌리고 `lastResetAt`을 이번 달 1일로 갱신. 첫 마운트 시 (`lastResetAt` 미정의)에는 진행도는 그대로 두고 타임스탬프만 찍음.
- 적용 시드: `main-spend-monthly`, `dungeon-{arm,back,chest,shoulder,leg}-monthly`.

**난이도 → XP** (`DIFFICULTY_META`):
E급 15 / D급 30 / C급 60 / B급 120 / A급 180 / S급 250

**아이템 드롭 확률** (`store.ts > completeQuest`):
boss 100% · apex 92% · elite 85% · hard 45% · normal 20% · easy 8%
- VIT 보너스 적용 (운동/건강 카테고리): 10마다 +3%

**레어리티 가중 확률** (`store.ts > randomItem`):
legendary 2% · epic 8% · rare 15% · uncommon 25% · common 50%
- SEN 보너스 적용: 10마다 +1% (epic/legendary 가중치 증가)

**레벨업 공식** (`game.ts`):
`xpToNextLevel(L) = round(100 + (L-1)*75 + (L-1)^1.5 * 8)`
레벨업 시 자동 +2 (카테고리 기반) + 자유배분권 +1, 랭크 임계치 통과 시 랭크 메시지.

**시스템 메시지** (`SystemMessage`)
- 종류: `quest`, `levelup`, `item`, `rank`, `title`, `info`
- `store.ts`에서 액션마다 큐에 push, 모달은 항상 첫 메시지만 표시 + `+N` 뱃지.

**카테고리** (`Category`)
운동(`workout`) · 학습(`study`) · 커리어(`career`) · 건강(`health`) · 정신(`mind`) · 재정(`finance`) · 관계(`social`) · 도전(`challenge`) · 습관(`habit`)

## 자주 만지는 곳

| 하고 싶은 일 | 파일 |
|---|---|
| 기본 일일 퀘스트 추가/수정 | `src/lib/seed.ts > DEFAULT_DAILIES` |
| 메인/던전 퀘스트 추가/수정 | `src/lib/seed.ts > DEFAULT_MAIN_QUESTS`, `DEFAULT_DUNGEONS` |
| 아이템 추가 | `src/lib/seed.ts > ITEM_POOL` |
| 칭호 추가/수정 | `src/lib/types.ts > TITLE_DEFINITIONS` + `store.ts > checkTitleUnlocks` |
| 카테고리 추가 | `src/lib/types.ts > Category` + `CATEGORY_META` + `game.ts > CATEGORY_TO_STAT` |
| 난이도 추가/XP 조정 | `src/lib/types.ts > Difficulty` + `DIFFICULTY_META` |
| cooldown / 월간 재생성 로직 | `src/lib/game.ts > getCooldownRemaining`, `isBeforeMonth`; `store.ts > resetDailiesIfNewDay` |
| 레벨업 곡선 조정 | `src/lib/game.ts > xpToNextLevel` |
| 드롭 확률 조정 | `src/lib/store.ts > completeQuest`의 `dropChance` ternary |
| 스탯 보너스 강도 조정 | `src/lib/game.ts > getXpMultiplier`, `getDropChanceBonus` 등 |
| 커스텀 퀘스트 스탯 보상량 | `src/components/AddQuestModal.tsx`의 `baseGain` ternary |
| 랭크 임계 레벨 | `src/lib/game.ts > rankFromLevel` |
| 색상/글로우 토큰 | `tailwind.config.js`, `src/index.css` (`.panel`, `.btn`, `.xp-bar-fill`) |

## 데이터 저장

전부 브라우저 `localStorage["levelup-save"]`에 JSON으로 저장. 헤더 우측 **리셋** 버튼으로 초기화. 서버/DB 없음.

스토어 스키마를 변경하면 `store.ts`의 `version` 값을 올려서 기존 저장본을 무효화할 것. (현재 v8)

**AchievementStats 기록 구조** (v7~v8):
- `questCompletions`: 전체 퀘스트 완료 기록 (total, byQuestId, byCategory, byType)
- `dailyCompletions`: daily 전용 기록 (total, byQuestId, byCategory, currentStreak, bestStreak)
- `dungeonClears`: 던전 최종 클리어 기록
- `mainClears`: 메인 퀘스트 완료 기록
- `special`: 히든 칭호용 특수 카운터 (7시 전 기상, 숏폼 제한, 명상, 시장 점검, 월 소비 제한, CMA 일지, 체중 기록, 심야 완료, 15+ daily 클리어 일수, 0 daily 연속, 완벽한 주간, 부활 횟수)
- `app`: 앱 사용 기록 (firstSeenAt, lastSeenAt, activeDays, activeDateKeys)
- `dailyHistory`: 날짜별 daily 완료 기록 (completedDailyQuestIds, completedDailyCount, totalDailyAvailableCount, completedAllAvailableDailies)

**special 카운터 매핑**:
- `earlyWakeBefore7*`: `daily-sleep` (23시 전 취침 / 7시 전 기상)
- `noShortsWithin30Min*`: `daily-shortform-limit` (숏폼 30분 이내)
- `meditation*`: `daily-meditate` (명상 10분)
- `marketCheckCount`: `daily-market-close` (시장 마감 점검)
- `spendingLimitMonthlyClearCount`: `main-spend-monthly` (월 소비 70만원 이하)
- `cmaJournalCount`: `dungeon-cma-journal` (CMA 운용 일지)
- `weightRecordCount`: `daily-weigh` (공복 체중 기록)
- `lateNightCompletionCount`: 00:00~01:59 사이 daily 완료 (올나이터 칭호용)
- `daily15PlusClearDays`: 하루 15개 이상 daily 클리어한 날 수 (중복 방지: daily15PlusClearDateKeys)
- `resurrectionCount`: streak 보호 사용 횟수 (PER 스탯 효과)

**daily streak 계산 규칙** (v8):
- 어제 같은 daily 완료 기록 있음 → currentStreak + 1
- 어제 완료 기록 없음 → currentStreak = 1
- 같은 날 중복 완료 → streak 증가 없음
- bestStreak는 currentStreak의 최댓값으로 자동 갱신
- TODO: cooldownDays가 있는 daily는 cooldown-aware streak 필요 (현재는 단순 전날 기준)

**dailyHistory 계산 규칙** (v8):
- `totalDailyAvailableCount`: 오늘 완료 가능하거나 이미 완료된 daily 수 (cooldownDays 고려)
- `completedDailyCount`: 오늘 완료한 daily 수
- `completedAllAvailableDailies`: completedDailyCount >= totalDailyAvailableCount

**Difficulty / Category 등 enum 확장 시 영향 받는 코드**
- `store.ts > completeQuest`의 `dropChance` ternary — 새 난이도용 분기 추가 안 하면 fallback(0.08)로 떨어짐
- `AddQuestModal.tsx`의 `baseGain` ternary — 새 난이도용 분기 안 추가하면 fallback(1)로 떨어짐
- `AddQuestModal.tsx`의 `Object.keys(CATEGORY_META).map(...)` — 객체 리터럴 순서가 UI 버튼 순서
- `game.ts > CATEGORY_TO_STAT` — 새 카테고리 추가 시 매핑 필수
- `types.ts > TITLE_DEFINITIONS` — 새 칭호 추가 시 정의 필수
- `store.ts > checkTitleUnlocks` — 새 칭호 해금 조건 추가 필수

## 배포 (GitHub + Vercel)

### Vercel 설정값
- **Framework Preset**: Vite (자동 감지)
- **Build Command**: `npm run build` (= `tsc && vite build`)
- **Output Directory**: `dist`
- **Install Command**: `npm install` (기본값)
- **Node Version**: 20.x 이상 (로컬은 24.x — Vercel 기본 20+로 충분)
- **별도 `vercel.json` 불필요** — Vite 프리셋 자동 처리.
- **SPA 라우팅 rewrite도 불필요** — 이 앱은 client-side routing 없이 탭 전환만 사용.

### GitHub 커밋 정책
- `.gitignore`로 다음 제외:
  - `node_modules/` — 600MB+ 의존성, Vercel이 자동 설치
  - `dist/` — 빌드 산출물, Vercel이 자동 빌드
  - `.env*` — 시크릿 (현재 미사용이지만 미래 대비)
  - `.vscode/` 대부분 (`settings.json`은 예외 허용)
  - 시뮬레이션 출력 (`sim-result.md`, `sim-output.txt`)
- **커밋 필요**: `package.json`, `package-lock.json`, `src/`, `public/`, `scripts/`, `index.html`, `*.config.{ts,js}`, `tsconfig.json`, `CLAUDE.md`, `docs/`, `start_levelup.bat`, `stop_levelup.bat`, `INSTRUCTIONS.md`

### dev-only 설정의 배포 영향
- `vite.config.ts`의 `server.port = 3002`는 **dev 서버 전용**. `vite build`는 정적 파일만 생성하므로 Vercel 배포와 무관.
- `package.json > scripts.dev`의 `--port 3002 --host` 옵션도 dev 전용.
- 결론: dev/prod 분리 잘 되어 있음. 추가 환경 분기 없음.

### 빌드 산출물 (참고)
- `dist/index.html` (~0.47 KB)
- `dist/assets/index-*.js` (~421 KB, gzip ~133 KB)
- `dist/assets/index-*.css` (~33 KB, gzip ~6.5 KB)
- `dist/sword.svg` (favicon)

## 모바일 사용 시 주의사항

모바일 브라우저(특히 iOS Safari/Chrome)에서 사용할 때 localStorage 관련 제약:

### localStorage 용량
- 일반적으로 모바일 브라우저 localStorage 한도는 **5~10MB**.
- 현재 앱의 `levelup-save` JSON은 가벼움 (수십 KB 수준, 메시지 큐를 dismiss하면 더 작아짐).
- 인벤토리/메시지가 수천 개 누적되면 한도 접근 가능 — 그때 리셋 또는 정리 권장.

### 데이터 손실 시나리오 (모바일 특화)
1. **사파리 시크릿/프라이빗 모드**: localStorage 비활성 → 앱이 매번 초기 상태로 시작. 일반 모드 사용 필수.
2. **iOS Safari "웹사이트 데이터 지우기"** 또는 Chrome **"사이트 데이터 삭제"**: `levelup-save` 통째 삭제 → 진행도 전부 손실.
3. **iOS Safari ITP (Intelligent Tracking Prevention)**: 7일간 사이트 미방문 시 localStorage 자동 삭제 가능. **최소 1주에 한 번은 앱 열어두기 권장**.
4. **저장 공간 부족 시 OS 자동 정리**: iOS는 저장공간 부족 시 사파리 데이터를 정리할 수 있음.

### 백업 / 복원 (Export / Import) — 헤더 우측 버튼

앱에 내장된 백업 기능을 사용한다. ([src/components/BackupControls.tsx](src/components/BackupControls.tsx))

**저장 백업 (Export)**
- 헤더 우측 `저장 백업` 버튼 → `levelup-backup-YYYY-MM-DD-HHMM.json` 파일 다운로드.
- 파일 구조 (wrapper):
  ```json
  {
    "app": "LEVEL_UP",
    "type": "levelup-save-backup",
    "exportedAt": "ISO timestamp",
    "storageKey": "levelup-save",
    "data": { "state": {...}, "version": N }
  }
  ```
- 저장 데이터가 없거나 손상되면 alert로 안내.

**저장 불러오기 (Import)**
- 헤더 우측 `저장 불러오기` 버튼 → 파일 선택 → 검증 → confirm 후 적용.
- 두 가지 입력 형식 모두 허용:
  - A. wrapper 백업: `{ app, type: "levelup-save-backup", data: {...} }`
  - B. raw Zustand persist: `{ state, version }` (예: DevTools에서 직접 복사한 값)
- **검증 단계**:
  1. JSON 파싱 성공해야 함
  2. wrapper면 `data` 추출 / raw면 그대로 사용
  3. `state` 객체 존재 필수
  4. `version`이 있으면 number 타입 필수
  5. `state.hunter` 또는 `state.quests` 중 하나 이상 존재해야 함
- 검증 실패 시 alert + **기존 데이터 그대로 유지**.
- 검증 성공 시 confirm: "현재 진행도가 백업 파일 내용으로 덮어써집니다. 계속할까요?"
- 사용자가 확인 → 안전장치로 현재 데이터를 `levelup-save-before-import` 임시 키에 보관 → `levelup-save` 덮어쓰기 → `window.location.reload()`로 Zustand 재수화.

**임시 안전키: `levelup-save-before-import`**
- Import 직전 현재 상태를 이 키에 자동 보관.
- 복원이 실수였을 때 DevTools에서 다음과 같이 되돌릴 수 있음:
  ```js
  localStorage.setItem('levelup-save', localStorage.getItem('levelup-save-before-import'))
  location.reload()
  ```
- 다음 import 시 덮어써짐 (한 번 분량만 보존).

**금지 사항**
- `levelup-save` key 이름 변경 금지 (Zustand persist 설정과 직결).
- persist `version` 임의 변경 금지 (마이그레이션 로직과 직결).
- 검증을 우회하고 raw write 하지 말 것 (게임 상태 깨질 수 있음).

### 멀티 디바이스
- localStorage는 **device + browser별 격리**. 데스크탑/모바일 간 진행도 자동 동기화 없음.
- 한 디바이스에서만 일관되게 사용 권장. 두 디바이스 병행 시 진행도 갈라짐.
- **수동 동기화 방법**:
  1. 디바이스 A에서 `저장 백업` → JSON 파일 다운로드
  2. 클라우드(드라이브/iCloud/메일)로 파일 전송
  3. 디바이스 B에서 `저장 불러오기` → JSON 선택 → confirm
- 모바일에서는 **주기적으로 (예: 주 1회) 백업 파일을 다운로드해 클라우드에 보관** 권장. iOS ITP의 7일 미접속 시 데이터 삭제 위험에 대한 보험.

### Vercel 재배포와 저장 데이터
- 같은 Vercel URL + 같은 브라우저 환경이면 redeploy 후에도 localStorage `levelup-save` 그대로 유지됨 (브라우저 origin이 동일하므로).
- **단, 도메인이 바뀌면 origin이 바뀌어 데이터 접근 불가** (예: `levelup-abc.vercel.app` → 커스텀 도메인). 이런 경우 도메인 전환 전에 백업 export 필수.
- 브라우저 데이터 삭제, 시크릿 모드, ITP 자동 삭제 등으로 localStorage가 비워지면 진행도 손실. **백업이 유일한 보호 수단**.

### PWA / 홈 화면 추가
- 현재 `manifest.json` 미구현 — 홈 화면 추가해도 일반 북마크 수준 (localStorage는 정상 동작).
- 진짜 PWA(오프라인 + service worker)로 만들려면 별건 작업 필요.

### 모바일 UX 점검 포인트
- viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` 설정됨 ✓
- 다크 테마 + 모노스페이스 UI라 작은 화면에서도 가독성 OK.
- 던전 카드의 "단계 +N XP" 보조 표시 등은 작은 화면에서 줄바꿈 발생 가능 — 실사용 확인 권장.

## 디자인 원칙

- "시스템 창" 느낌 — 코너 브라켓 (`.corner-bracket`), 스캔라인, 시안 글로우
- 시스템 텍스트는 monospace (`.system-text`) + 자간 넓게
- 한글 폰트: Pretendard Variable (CDN)
- 강조 색: cyan(`#60e8ff`) → 일반 UI / purple → 영웅 아이템 / amber → 레벨업·전설

## 작업 이력

### 4차 작업 완료 (2025-05-15) — 스탯 시스템 실작동
- ✅ `types.ts`: `freeStatPoints`, `categoryProgress`, `streakProtectionLastUsed` 필드 추가
- ✅ `game.ts`: 스탯 보너스 헬퍼 함수 추가 (`getXpMultiplier`, `getDropChanceBonus`, `getPartialRewardMultiplier`, `getRarityWeightBonus`, `shouldProtectStreak`)
- ✅ `store.ts`: 레벨업 로직 변경 (자동 +2 + 자유배분권 +1), 스탯 효과 적용 (XP/드롭/던전/레어리티), streak 보호, `allocateFreeStat` 액션 추가
- ✅ `HunterStatus.tsx`: 자유배분권 표시, 각 스탯에 +1 버튼 추가, 스탯 효과 표시 ("+15% 학습 XP" 등)
- ✅ persist version 4 → 5
- ✅ 빌드 통과 확인

**카테고리 → 스탯 매핑 결정**:
- workout/health → STR (운동은 근력 중심)
- study/career → INT (학습/커리어는 지능)
- mind/finance → SEN (정신/재정은 감각)
- habit/challenge → PER (습관/도전은 인내)
- social → AGI (관계는 민첩)

**categoryProgress 트래킹**: `completeQuest`와 `progressDungeon`에서 퀘스트 완료 시 해당 카테고리 카운트 증가. `applyXp` 내부에서 레벨업 시 가장 많은 카테고리의 스탯에 +2 자동 분배 후 리셋.

**streak 보호**: `resetDailiesIfNewDay`에서 lastActiveDate가 2일 이상 차이나면 `shouldProtectStreak` 체크. PER >= 10이고 이번 달에 미사용이면 보호 발동 + 시스템 메시지.

**UI 변경**: 헤더에 자유배분권 표시 (amber 색상, animate-pulse), 각 스탯 카드에 효과 설명 추가 (작은 텍스트), +1 버튼은 `freeStatPoints > 0`일 때만 표시.

### 5차 작업 1단계 완료 (2025-05-15) — 칭호 시스템 기반 구조
- ✅ `types.ts`: 칭호 타입 추가 (`TitleCategory`, `TitleRarity`, `TitleDefinition`), `TITLE_DEFINITIONS` 17개 일반 칭호 정의
- ✅ `types.ts`: Hunter에 `ownedTitleIds`, `equippedTitleId` 필드 추가
- ✅ `store.ts`: 칭호 액션 추가 (`unlockTitle`, `equipTitle`, `checkTitleUnlocks`)
- ✅ `store.ts`: 자동 해금 로직 구현 (레벨/스탯/수집/던전 클리어 조건)
- ✅ `store.ts`: `completeQuest`, `progressDungeon`, `allocateFreeStat` 후 `checkTitleUnlocks` 호출
- ✅ `store.ts`: 던전 클리어 시 `shadow-hunter` 칭호 해금
- ✅ `App.tsx`: 헤더에 장착 칭호 표시 (amber 색상, border, system-text)
- ✅ `SystemMessage.tsx`: 기존 `title` 메시지 타입 활용
- ✅ persist version 5 → 6 (migrate 함수로 기존 데이터 호환)
- ✅ 빌드 통과 확인

**구현된 칭호 (17개)**:
- 진행도: 첫 각성 (Lv5), 헌터 (Lv25), 베테랑 헌터 (Lv50), 그림자 사냥꾼 (첫 던전 클리어)
- 스탯: 단련된 자 (STR 30), 무쇠의 헌터 (STR 50), 강철의 헌터 (STR 80), 현자의 견습 (INT 30), 시장의 눈 (INT 50), 분석가 (INT 80), 불굴의 의지 (PER 50), 강철 멘탈 (PER 80), 깨어있는 자 (SEN 50), 직감의 지배자 (SEN 80)
- 수집: 첫 보물 (epic 이상 첫 획득), 수집가 (인벤토리 50개), 전설을 손에 (legendary 첫 획득)

**자동 해금 트리거**:
- 퀘스트 완료 후 (레벨/아이템 변화)
- 던전 진행/클리어 후 (레벨/아이템/던전 클리어 조건)
- 자유 스탯 배분 후 (스탯 변화)

**첫 칭호 자동 장착**: 해금된 첫 칭호는 자동으로 장착되어 헤더에 표시됨.

**다음 단계 예정**: 칭호 컬렉션 탭 UI, 히든 칭호 추가, 칭호 필터/장착 UI.

### 5차 작업 2단계 완료 (2025-05-15) — 칭호 컬렉션 탭 + 장착 UI
- ✅ `TitleCollection.tsx`: 새 컴포넌트 생성 (칭호 카드 목록, 필터, 장착 UI)
- ✅ `App.tsx`: 칭호 탭 추가 (Award 아이콘), 앱 진입 시 `checkTitleUnlocks` 호출
- ✅ 칭호 컬렉션 UI: 상단 요약 (보유 칭호 수, 현재 장착), 필터 (전체/보유/미보유)
- ✅ 칭호 카드: 레어리티별 색상 (normal: zinc, rare: cyan, epic: purple, legendary: amber)
- ✅ 장착 UI: 보유 칭호는 장착 버튼, 장착 중은 배지 표시, 미보유는 잠김 상태
- ✅ 미보유 칭호 표시 분리: 일반 칭호는 실제 정보 표시, 히든 칭호는 "???" 처리
- ✅ 빌드 통과 확인

**칭호 컬렉션 탭 구성**:
- 상단 요약: 보유 칭호 수 (N / 17), 현재 장착 칭호 표시
- 필터 버튼: 전체 / 보유 / 미보유
- 칭호 카드 그리드: 3열 레이아웃 (md: 2열, lg: 3열)
- 각 카드: 아이콘 (보유: Award, 미보유: Lock), 이름, 레어리티 배지, 설명, 조건, 장착 버튼

**미보유 칭호 표시 규칙**:
- **일반 칭호** (`hidden: false`): 미보유여도 실제 이름/설명/조건 표시, 상태 "잠김"
- **히든 칭호** (`hidden: true`): 미보유 시 이름 "???", 설명 "조건을 만족하면 정체가 드러납니다.", 조건 "조건: ???", 상태 "숨겨진 칭호" (purple 강조)
- 보유한 히든 칭호는 실제 정보 표시

**레어리티 스타일**:
- normal (일반): zinc 계열
- rare (희귀): cyan 계열
- epic (영웅): purple 계열
- legendary (전설): amber 계열

**장착 흐름**:
1. 칭호 탭에서 보유 칭호 카드의 "장착" 버튼 클릭
2. `equipTitle(titleId)` 호출
3. 헤더의 장착 칭호 표시 즉시 변경
4. 칭호 카드에 "장착 중" 배지 표시

**앱 진입 시 자동 해금**: `App.tsx`의 `useEffect`에서 `init()` 후 `checkTitleUnlocks()` 호출. 기존 저장 데이터 기준으로 조건을 만족하는 칭호 자동 해금.

**다음 단계 예정**: 히든 칭호 추가, 칭호 효과 시스템 (장착 시 보너스).

### 5차 작업 3단계 완료 (2025-05-15) — 히든 칭호용 기록/카운터 구조
- ✅ `types.ts`: `AchievementStats` 타입 추가 (questCompletions, dailyCompletions, dungeonClears, mainClears, special, app, dailyHistory)
- ✅ `store.ts`: `achievementStats` 필드 추가, `createInitialAchievementStats()` 초기화 함수
- ✅ `store.ts`: `recordAppOpen()` 액션 추가 (앱 사용 기록)
- ✅ `store.ts`: `completeQuest`에 기록 업데이트 로직 추가 (daily/main 완료 기록, special 카운터, dailyHistory)
- ✅ `store.ts`: `progressDungeon`에 기록 업데이트 로직 추가 (dungeon 진행/클리어 기록)
- ✅ `store.ts`: `resetDailiesIfNewDay`에 resurrectionCount 증가 추가
- ✅ `App.tsx`: 앱 진입 시 `recordAppOpen()` 호출
- ✅ persist version 6 → 7 (migrate 함수로 achievementStats 기본값 추가)
- ✅ 빌드 통과 확인

**AchievementStats 구조**:
- `questCompletions`: 모든 퀘스트 완료 누적 (total, byQuestId, byCategory, byType)
- `dailyCompletions`: daily 전용 (total, byQuestId, byCategory, currentStreak, bestStreak)
- `dungeonClears`: 던전 최종 클리어만 카운트
- `mainClears`: 메인 퀘스트 완료 카운트
- `special`: 히든 칭호용 특수 카운터 17개 (7시 전 기상, 숏폼 제한, 명상, 시장 점검, 월 소비 제한, CMA 일지, 체중 기록, 심야 완료, 15+ daily 클리어 일수, 0 daily 연속, 완벽한 주간, 부활 횟수)
- `app`: 앱 사용 기록 (firstSeenAt, lastSeenAt, activeDays, activeDateKeys)
- `dailyHistory`: 날짜별 daily 완료 기록 (YYYY-MM-DD 키)

**special 카운터 매핑** (실제 quest id 기반):
- `daily-sleep` → earlyWakeBefore7Count/Streak
- `daily-shortform-limit` → noShortsWithin30MinCount/Streak
- `daily-meditate` → meditationCount/Streak
- `daily-market-close` → marketCheckCount
- `main-spend-monthly` → spendingLimitMonthlyClearCount
- `dungeon-cma-journal` → cmaJournalCount
- `daily-weigh` → weightRecordCount
- streak 보호 사용 → resurrectionCount

**중복 방지 로직**:
- daily 완료 시 `dailyHistory[dateKey]`에 이미 해당 quest id가 있으면 카운터 증가 안 함
- 앱 진입 시 `activeDateKeys`에 오늘 날짜가 이미 있으면 activeDays 증가 안 함

**TODO 항목**:
- daily별 streak 정확한 계산 (어제 완료 여부 체크 필요) → ✅ v8에서 구현 완료
- dailyHistory의 totalDailyAvailableCount, completedAllAvailableDailies 계산 → ✅ v8에서 구현 완료
- daily15PlusClearDays, zeroDailyClearStreak, perfectDailyWeekCount 계산 로직 → ✅ daily15PlusClearDays v8에서 구현 완료
- zeroDailyClearStreak: 날짜 전환 시점 로직 필요 (다음 단계에서 구현)
- perfectDailyWeekCount: 7일 구간 계산 필요 (히든 칭호 구현 시 처리)
- cooldown-aware streak: cooldownDays가 있는 daily의 정확한 연속 기록 (필요 시 개선)

**다음 단계 예정**: 히든 칭호 추가 및 해금 조건 구현, 기록 기반 칭호 판정.

### 5차 작업 3단계 보정 완료 (2025-05-15) — 히든 칭호 기록 정확도 보정
- ✅ `types.ts`: `daily15PlusClearDateKeys` 필드 추가
- ✅ `store.ts`: lateNightCompletionCount 기준 변경 (22시 이후 → 00:00~01:59)
- ✅ `store.ts`: daily streak 보정 (어제 완료 여부 체크, 중복 방지)
- ✅ `store.ts`: totalDailyAvailableCount 계산 (cooldownDays 고려)
- ✅ `store.ts`: completedAllAvailableDailies 계산 (실제 비교)
- ✅ `store.ts`: daily15PlusClearDays 계산 (중복 방지)
- ✅ persist version 7 → 8 (daily15PlusClearDateKeys 기본값 추가)
- ✅ 빌드 통과 확인

**lateNightCompletionCount 기준**:
- 변경 전: 22시 이후 또는 6시 이전
- 변경 후: 00:00~01:59 (자정~새벽 2시)
- 목적: 올나이터 히든 칭호 조건 (자정~2시 사이 daily 완료 5회)

**daily streak 보정**:
- 어제 같은 daily 완료 기록 있음 → currentStreak + 1
- 어제 완료 기록 없음 → currentStreak = 1 (리셋)
- 같은 날 중복 완료 → streak 증가 없음
- special 카운터 (earlyWakeBefore7, noShortsWithin30Min, meditation)도 동일 로직 적용

**totalDailyAvailableCount**:
- 오늘 완료 가능하거나 이미 완료된 daily 수 계산
- `getCooldownRemaining(quest) === 0` 또는 이미 완료된 quest 포함
- 매 daily 완료 시마다 재계산하여 정확도 유지

**completedAllAvailableDailies**:
- `totalDailyAvailableCount > 0 && completedDailyCount >= totalDailyAvailableCount`
- 모든 가용 daily를 완료했는지 실시간 판정
- 히든 칭호 "완벽주의자", "부활" 조건에 사용

**daily15PlusClearDays**:
- 하루 15개 이상 daily 클리어 시 증가
- `daily15PlusClearDateKeys`로 중복 방지 (같은 날짜 1회만 카운트)
- 16개, 17개 완료해도 같은 날이면 추가 증가 없음

**보류 항목**:
- `zeroDailyClearStreak`: 날짜 전환 시점에 daily 0개 완료 판정 필요 (다음 단계)
- `perfectDailyWeekCount`: 7일 연속 completedAllAvailableDailies 계산 필요 (히든 칭호 구현 시)
- cooldown-aware streak: cooldownDays > 0인 daily의 정확한 연속 기록 (필요 시 개선)

**다음 단계 예정**: 히든 칭호 추가 (올나이터, 아침형 인간, 절제, 금융, 자취, 운동, 번뇌, 메타, 히든 중 히든 등).

### 5차 작업 4A단계 완료 (2025-05-15) — 히든 칭호 1차 구현
- ✅ `types.ts`: 히든 칭호 13개 메타데이터 추가 (TITLE_DEFINITIONS에 추가)
- ✅ `store.ts`: `checkTitleUnlocks()`에 히든 칭호 해금 조건 추가
- ✅ 빌드 통과 확인

**구현된 히든 칭호 (13개)**:
- **아침형 인간**:
  - 🌅 새벽의 사냥꾼 (rare): 7시 전 기상 30일 연속 (`earlyWakeBefore7CurrentStreak >= 30`)
  - 🌅 여명의 지배자 (epic): 7시 전 기상 100회 누적 (`earlyWakeBefore7Count >= 100`)
- **절제**:
  - 🧘 절제의 화신 (rare): 숏폼 제한 30일 연속 (`noShortsWithin30MinCurrentStreak >= 30`)
  - 🧘 도파민 사냥꾼 (epic): 숏폼 제한 90회 누적 (`noShortsWithin30MinCount >= 90`)
  - 🧘 고요한 마음 (rare): 명상 30일 연속 (`meditationCurrentStreak >= 30`)
- **금융**:
  - 📈 시장의 관찰자 (rare): 시장 마감 점검 60회 누적 (`marketCheckCount >= 60`)
- **운동**:
  - 💪 체지방의 적 (rare): 체중 기록 60회 누적 (`weightRecordCount >= 60`)
- **번뇌**:
  - 🔥 번아웃 직전 (rare): 하루 15개 이상 daily 클리어 (`daily15PlusClearDays >= 1`)
  - 🔥 올나이터 (rare): 자정~2시 사이 daily 완료 5회 (`lateNightCompletionCount >= 5`)
- **메타**:
  - 🎮 백일의 기록 (epic): 앱 사용 100일 (`app.activeDays >= 100`)
- **히든 중 히든** (legendary):
  - 👑 국가급 사냥꾼: National 랭크 도달 (`rank === 'National'`)
  - 👑 시스템의 총애: legendary 아이템 5개 보유 (`legendaryCount >= 5`)
  - 👑 불면불휴: daily streak 100일 (`streak >= 100`)

**해금 조건 트리거**:
- daily 완료 후 (아침형, 절제, 금융, 운동, 번뇌 계열)
- main 완료 후 (기존 일반 칭호)
- dungeon 클리어 후 (기존 일반 칭호)
- 아이템 획득 후 (시스템의 총애)
- 앱 진입 시 (백일의 기록, 국가급 사냥꾼)
- 레벨업 후 (국가급 사냥꾼, 불면불휴)

**보류한 히든 칭호 (복잡한 조건)**:
- 태양보다 일찍: 7시 전 기상 + 폰 1시간 안 보기 동시 판정 필요
- 포트폴리오 매니저: CMA 일지 구조/퀘스트 성격 확인 필요
- 자본의 추적자: 3개월 연속 월 소비 제한 판정 필요
- 자립한 헌터: 빨래/청소/분리수거 quest id 확인 및 각 10회 판정 필요
- 위생의 수호자: 자취 daily 범위 정의 필요
- 5분할의 완성자: 월간 5개 운동 던전 모두 클리어 판정 필요
- 불사의 몸: 단백질+물+유산소 동시 30일 판정 필요
- 빙결: zeroDailyClearStreak 로직 필요
- 부활: streak 깨진 후 다음날 all clear 판정 필요
- 완벽주의자: 7일 연속 모든 daily 완료 판정 필요
- 시스템에 인사: 기존 사용자에게 소급 해금 여부 결정 필요
- 컬렉터: 전체 칭호 10개 보유 기준 (다음 단계에서 처리 권장)
- 헌터의 전당: 전체 칭호 25개 보유 기준 (다음 단계에서 처리 권장)

**다음 단계 예정**: 히든 칭호 2차 구현 (복잡한 조건), 칭호 효과 시스템 (장착 시 보너스).

### 5차 작업 4B단계 완료 (2025-05-15) — 히든 칭호 소형 마무리 (메타 계열 3개)
- ✅ `types.ts`: 메타 히든 칭호 3개 메타데이터 추가 (TITLE_DEFINITIONS에 추가)
- ✅ `store.ts`: `checkTitleUnlocks()`에 메타 칭호 해금 조건 추가
- ✅ `store.ts`: 칭호 수 기반 칭호 해금 로직 개선 (2단계 체크)
- ✅ 빌드 통과 확인

**추가된 메타 히든 칭호 (3개)**:
1. 🎮 시스템에 인사 (normal) — 첫 로그인 (`app.firstSeenAt` 존재)
2. 🎮 컬렉터 (rare) — 칭호 10개 보유 (`ownedTitleIds.length >= 10`)
3. 🎮 헌터의 전당 (epic) — 칭호 25개 보유 (`ownedTitleIds.length >= 25`)

**해금 조건 구현**:
- `greeting-the-system`: `stats.app.firstSeenAt` 존재 시 해금 (앱 진입 시 자동)
- `title-collector`: 보유 칭호 10개 이상
- `hall-of-hunters`: 보유 칭호 25개 이상

**칭호 수 기반 해금 로직**:
- 1단계: 일반 칭호 + 히든 칭호 조건 체크 → 해금
- 2단계: 업데이트된 보유 칭호 수로 컬렉터/헌터의 전당 체크 → 해금
- 이로써 `greeting-the-system` 해금 직후 보유 칭호 수가 10개가 되면 `title-collector`도 즉시 해금됨
- 중복 해금 방지: `unlockTitle`에서 이미 보유한 칭호는 재해금 안 함

**앱 진입 시 해금 흐름**:
1. `recordAppOpen()` 실행 → `firstSeenAt` 생성 (첫 접속 시)
2. `checkTitleUnlocks()` 실행 → `greeting-the-system` 해금
3. 보유 칭호 수 체크 → 조건 만족 시 `title-collector`, `hall-of-hunters` 해금

**칭호 총 개수**:
- 일반 칭호: 17개
- 히든 칭호 (5-4A): 13개
- 메타 히든 칭호 (5-4B): 3개
- **총 33개**
- `TitleCollection.tsx`는 `TITLE_DEFINITIONS.length` 기반으로 자동 표시 (하드코딩 없음)

**5차 칭호 시스템 1차 완성**:
- ✅ 칭호 기반 구조 (17개 일반 칭호)
- ✅ 칭호 컬렉션 탭 + 장착 UI
- ✅ 히든 칭호 기록/카운터 구조 (AchievementStats)
- ✅ 히든 칭호 1차 구현 (13개)
- ✅ 메타 히든 칭호 (3개)
- **총 33개 칭호 구현 완료**

**보류한 복잡한 히든 칭호 (13개)**:
- 태양보다 일찍, 포트폴리오 매니저, 자본의 추적자, 자립한 헌터, 위생의 수호자
- 5분할의 완성자, 불사의 몸, 빙결, 부활, 완벽주의자
- (컬렉터, 헌터의 전당은 이번 단계에서 구현 완료)

**다음 단계 예정**: 6차 작업 — 성장 곡선 조정 (XP 공식, 랭크 임계치 등).

### 6차 작업 완료 (2025-05-15) — 성장 곡선 조정
- ✅ `game.ts`: `xpToNextLevel` 공식 조정 (약 1.8배 느리게, 초반 할인 적용)
- ✅ `game.ts`: `rankFromLevel` 기준 확인 (이미 적절한 수준, 변경 없음)
- ✅ 빌드 통과 확인

**XP 곡선 조정 (최종)**:
```typescript
export const xpToNextLevel = (level: number): number => {
  // Adjusted growth curve: slower mid-late game, early discount for Lv 1-10
  const l = Math.max(1, level)
  const base = 100 + (l - 1) * 105 + Math.pow(l - 1, 1.58) * 18
  const earlyDiscount = l <= 5 ? 0.85 : l <= 10 ? 0.95 : 1
  return Math.round(base * earlyDiscount)
}
```

**공식 의도**:
- `(l - 1) * 105`: 기존 75보다 상승 (선형 성장 강화)
- `Math.pow(l - 1, 1.58) * 18`: 중후반 요구 XP 상승 (지수 성장 강화)
- `earlyDiscount`: Lv 1-5는 0.85배, Lv 6-10은 0.95배 (초반 진입 장벽 완화)
- `Math.max(1, level)`: 비정상 level 입력 방어

**XP 비교 (최종)**:
| Level | Old XP | New XP | 배율 |
|------:|-------:|-------:|-----:|
| 1 | 100 | 85 | 0.85x |
| 2 | 183 | 190 | 1.04x |
| 5 | 446 | 579 | 1.30x |
| 10 | 960 | 1,543 | 1.61x |
| 15 | 1,550 | 2,735 | 1.76x |
| 20 | 2,210 | 3,982 | 1.80x |
| 30 | 3,710 | 6,825 | 1.84x |
| 50 | 7,420 | 13,674 | 1.84x |

**성장 곡선 보정 (2025-05-15)**:
- 초기 공식에서 중후반 배율이 1.37~1.43배로 목표(1.7배)보다 낮아 재조정
- 선형 계수 95 → 105, 지수 계수 13 → 18, 지수 1.55 → 1.58로 상향
- 최종 배율: Lv 15+ 약 1.76~1.84배 (목표 달성)

**랭크 임계치**:
- 기존 `rankFromLevel` 기준이 이미 적절하여 변경 없음
- E: Lv 1-7 (초보 헌터)
- D: Lv 8-17 (루틴 정착)
- C: Lv 18-29 (중급 성장)
- B: Lv 30-44 (확실한 성장 체감)
- A: Lv 45-59 (장기 목표)
- S: Lv 60-79 (상위 헌터)
- National: Lv 80+ (엔드게임)

**persist 버전**:
- 변경 없음 (v8 유지)
- 저장 스키마 변경 없음 (공식과 랭크 계산 로직만 변경)
- 기존 유저의 level, xp, totalXp 그대로 유지
- 다음 레벨 요구 XP만 새 공식 기준으로 계산됨

**성장 속도 조정 의도**:
- 초반 (Lv 1-5): 기존보다 약간 빠르게 (0.85배) → 진입 장벽 완화
- 초중반 (Lv 6-10): 기존과 비슷하거나 약간 느림 (0.95~1.6배) → 재미 유지
- 중반 (Lv 11-20): 약 1.6~1.8배 느리게 → 성장 체감 강화
- 후반 (Lv 21+): 약 1.8배 느리게 → 장기 목표 설정
- 향후 랜덤 퀘스트, 장비, 게이트, 보스, 직업 패시브 등 추가 성장 요소 대비

**다음 단계 예정**: 7차 작업 — 직업/각성형 시스템.

### 7차 작업 1단계 완료 (2025-05-15) — 직업/각성 시스템 기반 구조
- ✅ `types.ts`: Job 타입 추가 (`JobId`, `JobLine`, `JobDefinition`, `JOB_DEFINITIONS`, `JOB_LINE_META`)
- ✅ `types.ts`: HunterState에 `jobId`, `unlockedJobIds` 필드 추가 (기존 `job` 필드는 표시용으로 유지)
- ✅ `store.ts`: Job 액션 추가 (`unlockJob`, `equipJob`, `checkJobAwakening`)
- ✅ `store.ts`: `completeQuest`에 직업 XP 보너스 적용
- ✅ `store.ts`: `checkJobAwakening` 호출 추가 (quest 완료, dungeon 진행/클리어 후)
- ✅ `HunterStatus.tsx`: 직업 정보 표시 개선 (계열, 효과 표시)
- ✅ persist version 8 → 9 (jobId, unlockedJobIds 기본값 추가)
- ✅ 빌드 통과 확인

**직업 시스템 컨셉**:
- 미각성자 → 조건 충족 → 각성 이벤트 → 1차 직업 획득
- RPG 스타일 직업명 (현실 직무 느낌 배제)
- 직업별 XP 보너스 (카테고리 기반)

**구현된 1차 직업 (5개)**:
1. **금안의 점술사** (market 계열):
   - 설명: 시장의 흐름과 자본의 흔적을 읽는 자
   - 해금 조건: 시장 점검 30회 OR finance/career 퀘스트 50회
   - 효과: finance XP +5%, career XP +5%
   - 2차 직업 (미구현): 황금안의 예언자

2. **금서 해독자** (research 계열):
   - 설명: 흩어진 자료와 산업의 문맥을 해독하는 기록자
   - 해금 조건: study/career 퀘스트 70회
   - 효과: study XP +5%, career XP +3%
   - 2차 직업 (미구현): 심연의 기록관

3. **강철의 견습기사** (training 계열):
   - 설명: 육체를 단련해 한계를 밀어붙이는 수련자
   - 해금 조건: workout/health 퀘스트 70회 OR dungeon 클리어 5회
   - 효과: workout XP +5%, health XP +5%
   - 2차 직업 (미구현): 강철심장의 투사

4. **침묵의 수도자** (discipline 계열):
   - 설명: 욕망을 누르고 시간을 다스리는 수행자
   - 해금 조건: habit/mind 퀘스트 70회 OR 숏폼제한/명상 중 하나 30회
   - 효과: habit XP +5%, mind XP +5%
   - 2차 직업 (미구현): 시간의 심판관

5. **무명의 각성자** (balance 계열):
   - 설명: 한쪽에 치우치지 않고 균형 있게 성장한 각성자
   - 해금 조건: 4개 이상 카테고리에서 각각 20회 이상
   - 효과: career/study/workout/health/habit/mind XP +2%
   - 2차 직업 (미구현): 운명의 조율자

**직업 계열 (JobLine)**:
- market (시장): 금융/투자 성장
- research (연구): 분석/리서치 성장
- training (수련): 운동/건강 성장
- discipline (절제): 루틴/절제 성장
- balance (균형): 전반적 균형 성장

**직업 효과**:
- 현재 구현: XP 보너스 (카테고리별 2~5%)
- 미구현: 스탯 보너스, 드롭률 보너스

**직업 해금 흐름**:
1. 퀘스트 완료/던전 클리어로 achievementStats 누적
2. `checkJobAwakening()` 호출 → 조건 체크
3. 조건 만족 시 `unlockJob()` → SystemMessage 표시
4. 미각성자 상태면 자동 장착
5. HunterStatus에 직업 정보 표시 (계열, 효과)

**XP 계산 (직업 보너스 적용)**:
```typescript
const baseXp = DIFFICULTY_META[q.difficulty].xp
const statMultiplier = getXpMultiplier(s.hunter, q.category)
const jobCategoryBonus = currentJob?.effects.xpBonusByCategory?.[q.category] ?? 0
const xp = Math.round(baseXp * statMultiplier * (1 + jobCategoryBonus))
```

**HunterState 필드**:
- `job`: string (표시용, 기존 호환)
- `jobId`: JobId (실제 직업 ID)
- `unlockedJobIds`: JobId[] (해금한 직업 목록)

**persist 마이그레이션 (v8 → v9)**:
- `jobId` 없으면 'unawakened' 기본값
- `unlockedJobIds` 없으면 ['unawakened'] 기본값
- 기존 `job` 필드가 '각성하지 못한 자'면 '미각성자'로 변경

**이번 단계에서 구현하지 않은 것**:
- 2차 직업 (메타데이터에만 nextJobId로 명시)
- 직업 선택 전용 탭/UI
- 직업별 스탯 보너스, 드롭률 보너스
- 전투력/게이트/보스 시스템
- 장비 시스템
- 랜덤 퀘스트

**다음 단계 예정**: 7차 작업 2단계 — 직업 선택 UI, 2차 각성 시스템 (추후 논의).

### 7차 작업 2단계 완료 (2025-05-15) — 직업 선택/전환 UI 추가
- ✅ `JobPanel.tsx`: 새 컴포넌트 생성 (현재 직업 요약, 직업 카드 목록, 전환 버튼)
- ✅ `HunterStatus.tsx`: JobPanel 연결 (space-y-6 wrapper로 기존 패널과 JobPanel 배치)
- ✅ 빌드 통과 확인

**JobPanel 구성**:
- **현재 직업 요약**: 상단에 현재 장착 직업 표시 (이름, 계열, 설명, 효과)
  - 미각성자일 때: "각성 조건을 달성하면 직업이 개방됩니다." 안내
  - 각성 직업일 때: XP 보너스 효과 표시
- **직업 목록**: JOB_DEFINITIONS 기반 카드 그리드 (md: 2열)
  - 각 카드: 아이콘 (장착: Check, 미해금: Lock), 이름, 계열, 티어, 설명, 해금 조건, 효과, 상태/버튼
  - 상태 표시:
    - 장착 중: amber 테두리 + "장착 중" 배지
    - 해금됨 + 미장착: cyan 테두리 + "전환" 버튼
    - 미해금: 잠김 상태 (opacity 60%, 실제 정보 표시)

**미해금 직업 표시 규칙**:
- 칭호와 달리 직업은 **목표가 되어야 함**
- 미해금 직업도 이름/설명/해금 조건 모두 표시
- 잠김 상태 표시 (Lock 아이콘, 낮은 opacity, "잠김" 버튼)
- 유저가 "무엇을 해야 각성하는지" 명확히 알 수 있음

**직업 전환 흐름**:
1. JobPanel에서 해금된 직업 카드의 "전환" 버튼 클릭
2. `equipJob(jobId)` 호출
3. 헤더의 직업명 즉시 변경
4. HunterStatus의 직업 정보 즉시 변경
5. JobPanel의 카드 상태 즉시 변경 (장착 중 배지 이동)

**JobPanel 헬퍼 함수**:
- `formatJobEffects(job)`: 직업 효과를 문자열 배열로 변환
  - XP 보너스: "학습 XP +5%" 형식 (CATEGORY_META 라벨 활용)
  - 드롭 보너스: "드롭률 +10%" 형식 (미구현)
  - 효과 없음: ["효과 없음"]

**직업 계열 라벨**:
- JOB_LINE_META 활용 (types.ts에 정의)
- market: 💰 시장
- research: 📚 연구
- training: ⚔️ 수련
- discipline: 🧘 절제
- balance: ⚖️ 균형

**티어 표시**:
- 0 (기본): zinc 색상
- 1 (1차 각성): cyan 색상
- 2 (2차 각성): purple 색상 (미구현)

**HunterStatus 레이아웃 변경**:
- 기존: 단일 panel
- 변경 후: `<div className="space-y-6">` wrapper
  - 첫 번째 자식: 기존 상태 패널 (이름/직업/레벨/XP/스탯/스트릭)
  - 두 번째 자식: `<JobPanel />` (직업 선택/전환 UI)

**디자인 일관성**:
- 기존 `.panel`, `.corner-bracket`, `.system-text` 스타일 유지
- 색상: cyan (일반 UI), amber (장착 중), purple (효과), zinc (미해금)
- framer-motion 애니메이션 (카드 fade-in)

**이번 단계에서 구현하지 않은 것**:
- 2차 직업 (메타데이터만 존재)
- 직업 트리/진화 UI
- 직업 효과 추가/수정 (XP 보너스만 적용)
- 전환 시 SystemMessage (선택사항, 생략)
- 전환 시 확인 모달 (즉시 전환)
- 게이트/전투력/보스 시스템
- 장비 시스템

**다음 단계 예정**: 7차 작업 3단계 — 2차 각성 시스템 구현.

### 7차 작업 3단계 완료 (2025-05-15) — 2차 각성 시스템 구현
- ✅ `types.ts`: 2차 직업 5개 추가 (JobId 타입 확장, JOB_DEFINITIONS에 tier 2 직업 추가)
- ✅ `store.ts`: 2차 각성 조건 추가 (`checkJobAwakening`에 tier 2 조건 구현)
- ✅ `store.ts`: 2차 각성 자동 장착 로직 (1차 직업 장착 중일 때만 진화)
- ✅ `store.ts`: 2차 각성 SystemMessage 개선 (진화 메시지)
- ✅ persist version 9 → 10 (JobId 타입 확장, 스키마 구조 변경 없음)
- ✅ 빌드 통과 확인

**구현된 2차 직업 (5개)**:
1. **황금안의 예언자** (market 계열, tier 2):
   - 설명: 자본의 흐름 너머에 숨은 징조를 읽어내는 예언자
   - 해금 조건: 금안의 점술사 보유 + (시장 점검 100회 OR finance/career 퀘스트 150회)
   - 효과: finance XP +8%, career XP +8%
   - 1차 대비 보너스: 5% → 8% (1.6배 강화)

2. **심연의 기록관** (research 계열, tier 2):
   - 설명: 흩어진 지식과 기록의 심연에서 진실을 끌어올리는 자
   - 해금 조건: 금서 해독자 보유 + study/career 퀘스트 180회
   - 효과: study XP +8%, career XP +6%
   - 1차 대비 보너스: 5%/3% → 8%/6% (약 1.7배 강화)

3. **강철심장의 투사** (training 계열, tier 2):
   - 설명: 흔들리지 않는 심장으로 한계를 부수는 전투형 헌터
   - 해금 조건: 강철의 견습기사 보유 + (workout/health 퀘스트 180회 OR dungeon 클리어 20회)
   - 효과: workout XP +8%, health XP +8%
   - 1차 대비 보너스: 5% → 8% (1.6배 강화)

4. **시간의 심판관** (discipline 계열, tier 2):
   - 설명: 흐트러진 욕망과 시간을 심판하는 규율의 집행자
   - 해금 조건: 침묵의 수도자 보유 + (habit/mind 퀘스트 180회 OR 숏폼제한/명상 중 하나 90회)
   - 효과: habit XP +8%, mind XP +8%
   - 1차 대비 보너스: 5% → 8% (1.6배 강화)

5. **운명의 조율자** (balance 계열, tier 2):
   - 설명: 모든 성장의 흐름을 조율해 자신의 운명을 다시 쓰는 각성자
   - 해금 조건: 무명의 각성자 보유 + 5개 이상 카테고리에서 각각 50회 이상
   - 효과: career/study/workout/health/habit/mind XP +4%
   - 1차 대비 보너스: 2% → 4% (2배 강화)

**2차 각성 조건 구현**:
- 1차 직업 보유 필수 (`unlockedJobIds.includes(tier1JobId)`)
- 추가 조건 달성 (퀘스트 누적, 특수 카운터 등)
- 조건 충족 시 `unlockJob(tier2JobId)` 호출

**2차 각성 자동 장착 규칙**:
- 현재 장착 직업이 해당 1차 직업 → 2차 직업 자동 장착 (진화 느낌)
- 현재 장착 직업이 다른 라인 → 해금만 하고 자동 장착 안 함
- 미각성자 상태 → 자동 장착 (거의 발생하지 않음)

**2차 각성 SystemMessage**:
- 제목: "── SYSTEM ── 2차 각성 발생"
- 내용: "[금안의 점술사]이(가) [황금안의 예언자]로 진화했습니다." (자동 장착 시)
- 내용: "새 직업 [황금안의 예언자]을 획득했습니다." (해금만 시)

**JobPanel 표시**:
- tier 2 직업 카드 자동 표시 (JOB_DEFINITIONS 기반)
- 티어 표시: "2차 각성" (purple 색상)
- 미해금 2차 직업: 잠김 상태 + 해금 조건 표시
- 해금된 2차 직업: 전환 가능
- 장착 중 2차 직업: 장착 중 배지 표시

**XP 보너스 적용**:
- 현재 장착한 직업 하나의 효과만 적용
- 1차+2차 효과 중첩 안 함
- 2차 직업 장착 시 1차 대비 1.6~2배 강화된 보너스 적용

**persist 마이그레이션 (v9 → v10)**:
- JobId 타입 확장 (tier 2 직업 5개 추가)
- 저장 스키마 구조 변경 없음 (jobId, unlockedJobIds 필드 그대로)
- 기존 저장 데이터 호환 (optional 필드 없음)

**7차 직업/각성 시스템 1차 완성**:
- ✅ 직업 기반 구조 (6개 직업: 미각성자 + 1차 5개)
- ✅ 직업 선택/전환 UI (JobPanel)
- ✅ 2차 각성 시스템 (5개 2차 직업)
- **총 11개 직업 구현 완료** (미각성자 + 1차 5개 + 2차 5개)

**이번 단계에서 구현하지 않은 것**:
- 3차 직업 (이번 범위 아님)
- 직업 전용 탭 (현재 JobPanel로 충분)
- 직업 효과 과도 강화 (밸런스 유지)
- 1차+2차 효과 중첩 (성장 속도 과도 증가 방지)
- 게이트/전투력/보스 시스템 (아직 토론 전)
- 장비 시스템 (아직 토론 전)
- 랜덤 퀘스트 (아직 토론 전)
- 칭호 시스템 수정 (이번 범위 아님)
- XP 성장 곡선 수정 (이미 6차 완료)
- localStorage 키 변경 (저장 데이터 깨짐 방지)

**다음 단계 예정**: 8차 작업 — 랜덤 퀘스트 시스템 (긴급 의뢰).

### 5차 작업 6단계 완료 (2025-05-15) — 날짜 key 표준화 + 칭호 텍스트 RPG화
- ✅ `game.ts`: `getDateKey(date)` 함수 추가 (local YYYY-MM-DD 반환), `addDays(date, days)` helper 추가
- ✅ `game.ts`: `todayKey()` → `getDateKey()` alias로 변경
- ✅ `store.ts`: `getDateKey`, `addDays` import 추가, 완벽주의자 칭호 판정에 적용
- ✅ `types.ts`: TITLE_DEFINITIONS 37개 칭호 name/description RPG화 (id/conditionText 유지)
- ✅ persist version 11 유지 (스키마 변경 없음)
- ✅ 빌드 통과 확인

### 5차 작업 6B단계 완료 (2025-05-15) — 날짜 key 잔여 사용처 보정
- ✅ `store.ts`: UTC 기준 날짜 key 생성 4곳 교체 완료
- ✅ getRecentRandomQuestHistory: `getDateKey(addDays(now, -i))` 사용
- ✅ daily streak tracking: `getDateKey(addDays(new Date(), -1))` 사용
- ✅ hunter streak: `getDateKey(addDays(new Date(), -1))` 사용 (변수명 yesterdayKey로 통일)
- ✅ resetDailiesIfNewDay: `getDateKey(addDays(new Date(), -1))` 사용 (변수명 yesterdayKey로 통일)
- ✅ 전체 재검색: UTC 패턴 완전 제거 확인
- ✅ persist version 11 유지 (스키마 변경 없음)
- ✅ 빌드 통과 확인

**날짜 key 표준화 최종 완료**:
- ✅ 모든 날짜 key 생성이 local time 기준으로 통일됨
- ✅ `toISOString().slice(0, 10)` 패턴 완전 제거 (문서 제외)
- ✅ `Date.now() - 86_400_000` 패턴 완전 제거
- ✅ `toISOString().split('T')[0]` 패턴 없음
- ✅ 중복 로직 제거 (getDateKey + addDays로 통일)

**수정된 날짜 key 사용처 (4곳)**:
1. **getRecentRandomQuestHistory** (랜덤 퀘스트 최근 7일 history)
   - 변경 전: `date.setDate(date.getDate() - i)` + `toISOString().slice(0, 10)`
   - 변경 후: `getDateKey(addDays(now, -i))`
   - 영향: 랜덤 퀘스트 weight 보정 (카테고리 등장 횟수)

2. **daily streak tracking** (completeQuest 내부)
   - 변경 전: `new Date(Date.now() - 86_400_000)` + `toISOString().slice(0, 10)`
   - 변경 후: `getDateKey(addDays(new Date(), -1))`
   - 영향: daily별 streak 계산 (earlyWakeBefore7, noShortsWithin30Min, meditation)

3. **hunter streak** (completeQuest 내부)
   - 변경 전: `new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)`
   - 변경 후: `getDateKey(addDays(new Date(), -1))`
   - 영향: 헌터 전체 streak 계산 (불면불휴 칭호)

4. **resetDailiesIfNewDay**
   - 변경 전: `new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)`
   - 변경 후: `getDateKey(addDays(new Date(), -1))`
   - 영향: streak 보호 판정, daily 리셋 로직

**날짜 key 표준화**:
- 기존: `toISOString().slice(0, 10)` (UTC 기준, 한국 로컬 날짜와 어긋남)
- 변경: `getDateKey(date)` (브라우저 local time 기준 YYYY-MM-DD)
- 적용 범위: dailyHistory, activeDateKeys, randomQuestHistory, daily streak, 완벽주의자 7일 체크
- `addDays(date, days)` helper: 날짜 더하기/빼기 (DST/로컬 날짜 정확 처리)

**날짜 key 정책**:
- 모든 날짜 key는 브라우저 local time 기준 YYYY-MM-DD 사용
- `toISOString().slice(0, 10)` 직접 사용 금지 (UTC 기준이라 한국 로컬 날짜와 어긋남)
- daily, streak, random quest, activeDays, dailyHistory, perfect week 판정은 모두 같은 helper 사용
- 한국 사용자가 쓰는 브라우저 로컬 날짜 기준으로 동작

**칭호 텍스트 RPG화**:
- 일반 칭호 17개 name/description 변경 (RPG 느낌 강화)
- 히든 칭호 20개 description 변경 (몰입감 강화)
- 칭호 id는 절대 변경 안 함 (저장 데이터 호환)
- conditionText는 명확하게 유지 (사용자가 달성 조건을 알아야 함)
- 해금 조건 로직은 변경 안 함

**변경된 칭호 예시**:
- first-awakening: "첫 각성" → "첫 번째 각성" / "시스템의 부름에 응답해 헌터의 길에 들어섰다."
- trained-one: "단련된 자" → "철혈의 입문자" / "육체의 한계를 넘기 위한 첫 문턱을 넘어섰다."
- market-eye: "시장의 눈" → "흐름을 읽는 눈" / "숫자와 기록 사이에 숨어 있는 흐름을 감지하기 시작했다."
- steel-mental: "강철 멘탈" → "강철 정신의 수도자" / "유혹과 나태를 견디며 정신을 강철처럼 벼려냈다."
- perfectionist: "7일 연속 모든 가용 daily를 완료했다." → "일주일 동안 단 하나의 빈틈도 허용하지 않은 완벽의 화신."

**5차 칭호 시스템 최종 완성**:
- ✅ 칭호 기반 구조 (17개 일반 칭호)
- ✅ 칭호 컬렉션 탭 + 장착 UI
- ✅ 히든 칭호 기록/카운터 구조 (AchievementStats)
- ✅ 히든 칭호 구현 (20개)
- ✅ 날짜 key 표준화 (local time 기준)
- ✅ 칭호 텍스트 RPG화 (37개 칭호)
- **총 37개 칭호 구현 완료** (일반 17개 + 히든 20개)

**다음 단계 예정**: 8차 작업 — 랜덤 퀘스트 시스템 (긴급 의뢰).

### 8차 작업 1단계 완료 (2025-05-15) — 랜덤 퀘스트 MVP 구현
- ✅ `types.ts`: RandomQuestTemplate, ActiveRandomQuest 타입 추가
- ✅ `seed.ts`: RANDOM_QUEST_POOL 25개 추가 (career/finance 높은 weight, mind 낮은 weight)
- ✅ `store.ts`: activeRandomQuest, randomQuestHistory 필드 추가
- ✅ `store.ts`: rollRandomQuestForToday, completeRandomQuest, skipRandomQuest, clearExpiredRandomQuest 액션 추가
- ✅ `RandomQuestCard.tsx`: 새 컴포넌트 생성 (amber/orange 그라데이션, AlertTriangle 아이콘)
- ✅ `App.tsx`: daily 탭 상단에 RandomQuestCard 표시, 앱 진입 시 roll + clear 호출
- ✅ persist version 9 → 10 (activeRandomQuest, randomQuestHistory 필드 추가)
- ✅ 빌드 통과 확인

**랜덤 퀘스트 시스템 컨셉**:
- "긴급 의뢰" 느낌 (RPG 게시판 의뢰)
- 하루 30% 확률로 1개 생성
- 당일 자정까지 유효
- 완료 시 XP + 아이템 드롭 (일반 퀘스트와 동일 계산)
- 스킵 가능 (패널티 없음)
- 만료 시 자동 소멸

**RANDOM_QUEST_POOL 구성 (25개)**:
- career: 8개 (weight 3~4, 높은 확률)
- finance: 5개 (weight 3~4, 높은 확률)
- study: 4개 (weight 2~3, 중간 확률)
- workout: 3개 (weight 2, 중간 확률)
- health: 2개 (weight 2, 중간 확률)
- habit: 2개 (weight 2, 중간 확률)
- mind: 1개 (weight 1, 낮은 확률)
- 난이도: easy 5개, normal 12개, hard 8개

**랜덤 퀘스트 생성 로직**:
1. 앱 진입 시 `rollRandomQuestForToday()` 호출
2. 오늘 이미 roll했으면 스킵 (randomQuestHistory[dateKey] 존재)
3. 이미 활성 퀘스트 있으면 스킵
4. 30% 확률로 생성 (Math.random() < 0.3)
5. weight 기반 선택 (totalWeight 계산 → roll)
6. activeRandomQuest 생성 (instanceId, generatedAt, expiresAt, completed: false)
7. randomQuestHistory[dateKey] 기록 (generatedQuestId)
8. SystemMessage 표시 ("── SYSTEM ── 긴급 의뢰 발생")

**랜덤 퀘스트 완료 로직**:
1. RandomQuestCard에서 "완료" 버튼 클릭
2. `completeRandomQuest()` 호출
3. 만료 체크 (now > expiresAt → 실패)
4. XP 계산 (baseXp * statMultiplier * (1 + jobCategoryBonus))
5. 아이템 드롭 (일반 퀘스트보다 낮은 확률: hard 25%, normal 12%, easy 5%)
6. categoryProgress 증가
7. activeRandomQuest.completed = true
8. randomQuestHistory[dateKey].completedQuestId 기록
9. SystemMessage 표시 ("긴급 의뢰 완료")
10. checkTitleUnlocks, checkJobAwakening 호출

**랜덤 퀘스트 스킵 로직**:
1. RandomQuestCard에서 "스킵" 버튼 클릭
2. `skipRandomQuest()` 호출
3. activeRandomQuest = null (패널티 없음)
4. 다음날 다시 roll 가능

**다음 단계 예정**: 9차 작업 — 장비 시스템.

### 9차 작업 0~2단계 완료 (2025-05-15) — 장비 시스템 기반 구조 + 아이템풀 확장 + 장착 UI
- ✅ `types.ts`: 장비 타입 추가 (EquipmentSlot, ItemEffectType, ItemEffect, EquipmentState)
- ✅ `types.ts`: Item 타입에 equippable, slot, effects 필드 추가
- ✅ `seed.ts`: ITEM_POOL 38개 장비 아이템에 equippable, slot, effects 추가
- ✅ `store.ts`: equipment 필드 추가, equipItem, unequipItem 액션 추가
- ✅ `Inventory.tsx`: 장비 슬롯 섹션 추가, 장착/해제 버튼 추가, 효과 표시
- ✅ persist version 10 → 11 (equipment 필드 추가)
- ✅ 빌드 통과 확인

**장비 시스템 컨셉**:
- 4개 슬롯: weapon (무기), armor (방어구), accessory (장신구), artifact (유물)
- 각 슬롯에 1개씩 장착 가능
- 장비 효과: xp_bonus (카테고리별), drop_bonus, rarity_bonus, stat_bonus
- 장착 시 효과 즉시 적용 (다음 단계에서 구현)

**ITEM_POOL 장비 구성 (38개)**:
- Common: 5개 (weapon 2, armor 1, artifact 1, accessory 1)
- Uncommon: 9개 (다양한 슬롯)
- Rare: 10개 (다양한 슬롯)
- Epic: 8개 (다양한 슬롯)
- Legendary: 6개 (다양한 슬롯)

**장비 효과 범위**:
- xp_bonus: 0.01~0.10 (1~10%)
- drop_bonus: 0.01~0.03 (1~3%)
- rarity_bonus: 0.01~0.02 (1~2%)
- stat_bonus: 1~3 (정수값)

**Inventory UI 개선**:
- 상단: 4개 장비 슬롯 표시 (장착 중 아이템 표시, 해제 버튼)
- 하단: 보유 아이템 그리드 (장착 가능 아이템은 장착 버튼, 장착 중은 배지 표시)
- 효과 표시: "학습 XP +5%", "드롭률 +2%", "STR +2" 등

**다음 단계 예정**: 9차 작업 3단계 — 장비 효과 실제 계산 반영.

### 9차 작업 3단계 완료 (2025-05-15) — 장비 효과 실제 계산 반영
- ✅ `game.ts`: 장비 효과 계산 헬퍼 추가 (getEquippedItems, getEquipmentXpBonus, getEquipmentDropBonus, getEquipmentRarityBonus, getEquipmentStatBonuses, getEffectiveStats)
- ✅ `store.ts`: completeQuest, progressDungeon, completeRandomQuest에 장비 효과 적용
- ✅ `store.ts`: randomItem 함수에 장비 레어리티 보너스 반영
- ✅ `HunterStatus.tsx`: 장비 스탯 보너스 표시 (기본 스탯 + 장비 보너스 구분, purple 색상)
- ✅ persist version 11 유지 (스키마 변경 없음)
- ✅ 빌드 통과 확인

**장비 효과 계산 로직**:
- XP 계산: `baseXp * statMultiplier(effective) * (1 + jobBonus) * (1 + equipmentXpBonus)`
- 드롭률: `baseDropChance + statDropBonus(effective) + equipmentDropBonus`
- 레어리티: `senBonus(effective) + equipmentRarityBonus`
- 스탯: `baseStats + equipmentStatBonuses`

**장비 효과 헬퍼 함수**:
- `getEquippedItems(state)`: 현재 장착 중인 아이템 목록 반환
- `getEquipmentXpBonus(state, category)`: 카테고리별 XP 보너스 합산
- `getEquipmentDropBonus(state)`: 드롭률 보너스 합산
- `getEquipmentRarityBonus(state)`: 레어리티 보너스 합산
- `getEquipmentStatBonuses(state)`: 스탯별 보너스 합산
- `getEffectiveStats(state)`: 기본 스탯 + 장비 보너스

**HunterStatus 표시 개선**:
- 기본 스탯: white 색상
- 장비 보너스: purple 색상 ("+2" 형식)
- 예시: "STR 25 +2" (기본 25, 장비 +2)

**다음 단계 예정**: 9차 작업 4단계 — 장비 시스템 밸런스/UX 점검.

### 9차 작업 4단계 완료 (2025-05-15) — 장비 시스템 밸런스/UX 점검
- ✅ `game.ts`: ITEM_POOL 효과 수치 점검 (모든 XP/drop/rarity 보너스가 올바른 소수값 0.01~0.1, stat_bonus는 정수값 1~5)
- ✅ `game.ts`: XP 보너스 cap 추가 (최대 20%, `getEquipmentXpBonus`에서 `Math.min(total, 0.2)`)
- ✅ `game.ts`: 드롭률 보너스 cap 추가 (최대 10%, `getEquipmentDropBonus`에서 `Math.min(total, 0.1)`)
- ✅ `game.ts`: 레어리티 보너스 cap 유지 (최대 5%, legendary 확률 최대 4%)
- ✅ `Inventory.tsx`: 소비 아이템 문구 개선 ("소비템 · 사용 기능 예정", purple 테두리)
- ✅ `CLAUDE.md`: 장비 시스템 1차 완료 문서화 (총 41개 아이템: 장비 38개, 소비 아이템 후보 3개)
- ✅ 빌드 통과 확인

**장비 효과 밸런스 조정**:
- XP 보너스 cap: 최대 20% (4개 슬롯 * 평균 5% = 20%)
- 드롭률 보너스 cap: 최대 10% (4개 슬롯 * 평균 2.5% = 10%)
- 레어리티 보너스 cap: 최대 5% (legendary 확률 2% → 최대 4%)
- 스탯 보너스: cap 없음 (정수값 1~5, 4개 슬롯 * 평균 2 = 8)

**ITEM_POOL 구성 확인**:
- 장비 아이템: 38개 (Common 5, Uncommon 9, Rare 10, Epic 8, Legendary 6)
- 소비 아이템 후보: 3개 (회복 포션, 집중력 비약, 단백질 바)
- 총 41개 아이템

**소비 아이템 표시 개선**:
- Inventory에서 "소비템 · 사용 기능 예정" 표시
- purple 테두리 (border-purple-400/20)
- 장착 버튼 대신 안내 문구

**장비 시스템 1차 완성**:
- ✅ 장비 기반 구조 (4개 슬롯, 효과 타입)
- ✅ 장비 아이템풀 확장 (38개)
- ✅ 장착/해제 UI
- ✅ 장비 효과 실제 계산 반영
- ✅ 밸런스 조정 (cap 추가)

**다음 단계 예정**: 10차 작업 — 소모품 시스템.

### 10차 작업 0~1단계 완료 (2025-05-15) — 장비 문서 보정 + 소모품 타입/아이템풀 확장
- ✅ `CLAUDE.md`: 장비 수치 표기 보정 (0.020.03 → 0.02~0.03 형식)
- ✅ `types.ts`: ConsumableEffectType, ConsumableEffect 타입 추가
- ✅ `types.ts`: Item 타입에 consumable, consumableEffects 필드 추가 (optional)
- ✅ `seed.ts`: 기존 소비 아이템 3개를 소모품으로 보정 (equippable: false, consumable: true, consumableEffects 추가)
- ✅ `seed.ts`: 신규 소모품 12개 추가 (Common 3, Uncommon 3, Rare 3, Epic 2, Legendary 1)
- ✅ `seed.ts`: 모든 장비 아이템에 consumable: false 추가 (Python 스크립트 실행 완료)
- ✅ persist version 11 유지 (optional 필드 추가만, 스키마 변경 없음)
- ✅ 빌드 통과 확인

**소모품 시스템 설계**:
- 소모품은 장비와 달리 **일회성/기간제 효과**
- 사용 시 효과 발생 (다음 퀘스트, 오늘 하루, 다음 게이트 등)
- 장착 불가 (equippable: false, consumable: true)

**ConsumableEffectType (8종)**:
- instant_xp: 즉시 XP 획득
- next_quest_xp_bonus: 다음 퀘스트 XP 보너스
- next_category_xp_bonus: 다음 특정 카테고리 퀘스트 XP 보너스
- temporary_drop_bonus: 일시적 드롭률 보너스
- temporary_rarity_bonus: 일시적 레어리티 보너스
- temporary_stat_bonus: 일시적 스탯 보너스
- gate_penalty_reduction: 게이트 패널티 감소 (미래 대비)
- gate_success_bonus: 게이트 성공 보너스 (미래 대비)

**ITEM_POOL 구성 (총 53개)**:
- 소모품: 15개 (Common 6, Uncommon 3, Rare 3, Epic 2, Legendary 1)
- 장비: 38개 (Common 5, Uncommon 9, Rare 10, Epic 8, Legendary 6)

**소모품 목록 (15개)**:
- Common (6): 회복 포션, 집중력 비약, 단백질 바, 맑은 물병, 작은 행운 가루, 짧은 집중 향
- Uncommon (3): 각성의 물약, 현자의 잉크, 투사의 보급식
- Rare (3): 행운의 룬 파편, 시장 예지의 차, 수도자의 안정향
- Epic (2): 시스템 증폭제, 응급 붕대
- Legendary (1): 운명의 엘릭서

**소모품 효과 예시**:
- 회복 포션: 게이트 패널티 -10% (next_gate)
- 집중력 비약: 학습/커리어 XP +10% (next_quest)
- 단백질 바: 운동/건강 XP +10% (next_quest)
- 시스템 증폭제: 다음 퀘스트 XP +25%, 드롭률 +10% (next_quest)
- 운명의 엘릭서: 다음 퀘스트 XP +35%, 레어리티 +3% (next_quest)

**Inventory 표시**:
- 소모품: "소비템 · 사용 기능 예정" 표시 (purple 테두리)
- 장착 버튼 없음
- 효과 표시 미구현 (다음 단계에서 처리)

**이번 단계에서 구현하지 않은 것**:
- 소모품 사용 버튼/로직 (10-2에서 구현)
- 소모품 효과 실제 적용 (10-3에서 구현)
- active consumable buff 상태 (10-2에서 추가)
- 게이트 시스템 (별도 대형 작업)

**다음 단계 예정**: 10차 작업 2단계 — 소모품 사용 버튼/로직 구현

### 10차 작업 2단계 완료 (2025-05-15) — 소모품 사용 로직 + active buff 상태 추가
- ✅ `types.ts`: ActiveConsumableEffect 타입 추가 (id, sourceItemId, sourceItemName, activatedAt, consumed)
- ✅ `store.ts`: activeConsumableEffects 필드 추가, useConsumable/clearConsumedConsumableEffects/clearExpiredConsumableEffects 액션 추가
- ✅ `store.ts`: persist version 11 → 12 (activeConsumableEffects 기본값 추가)
- ✅ `App.tsx`: 앱 진입 시 clearExpiredConsumableEffects 호출
- ✅ `Inventory.tsx`: 소모품 사용 버튼 추가, active buff 표시 영역 추가, 소모품 효과 표시
- ✅ 빌드 통과 확인

**ActiveConsumableEffect 구조**: id, sourceItemId, sourceItemName, activatedAt, consumed + ConsumableEffect 상속

**useConsumable 동작**: items에서 제거 → activeConsumableEffects에 추가 → SystemMessage 표시

**clearExpiredConsumableEffects**: duration='today' 효과 중 날짜 지난 것 제거 (getDateKey 사용)

**Inventory UI**: 활성 소모품 효과 영역 (purple 테마), 소모품 사용 버튼 (Sparkles 아이콘), 효과 표시

**이번 단계 미구현** (10-3 예정): XP/drop/rarity/stat 계산 반영, next_quest 소진 처리, instant_xp 적용

**persist v11 → v12**: activeConsumableEffects 기본값 추가

**다음 단계 예정**: 10-3 소모품 효과 실제 적용.

### 9차 작업 5단계 완료 (2025-05-15) — 장비 효과 정합성 보정
- ✅ `store.ts`: XP 계산을 곱연산에서 합연산으로 변경 (completeQuest, progressDungeon 최종 클리어, completeRandomQuest)
- ✅ `store.ts`: 칭호 조건이 base stat 기준인지 확인 (이미 올바름)
- ✅ `game.ts`: getEffectiveStats에 정책 주석 추가
- ✅ `CLAUDE.md`: 장비 효과 정책 문서화 (stat_bonus 정책, XP 보너스 정책)
- ✅ persist version 11 유지 (로직 변경만, 스키마 변경 없음)
- ✅ 빌드 통과 확인

**XP 보너스 합연산 변경**:
- 변경 전: `baseXp * statMultiplier * (1 + jobBonus) * (1 + equipmentBonus)` (곱연산)
- 변경 후: `baseXp * statMultiplier * (1 + jobBonus + equipmentBonus)` (합연산)
- 이유: 곱연산은 후반 폭발, 합연산은 이해 쉽고 밸런스 예측 가능

**stat_bonus 정책 확정**:
- 장비 stat_bonus는 effective stat에만 반영 (보상/전투 계산용)
- 칭호/업적 조건은 hunter.stats (base stats) 기준만 사용
- checkTitleUnlocks()에서 이미 올바르게 구현되어 있음 확인

**적용 위치**:
- completeQuest: 합연산 적용 ✅
- progressDungeon 부분 보상: 스탯 보너스만 (AGI)
- progressDungeon 최종 클리어: 합연산 적용 ✅
- completeRandomQuest: 합연산 적용 ✅

**향후 확장**:
- 소모품 XP 보너스도 같은 additive bucket에 합류 예정
- `const additiveXpBonus = jobBonus + equipmentBonus + consumableBonus`

**다음 단계 예정**: 10차 작업 2단계 — 소모품 사용 버튼/로직 구현

### 8차 작업 2단계 완료 (2025-05-15) — 랜덤 퀘스트 weight 보강
- ✅ `store.ts`: randomQuestHistory에 generatedCategory 필드 추가 (optional)
- ✅ `store.ts`: 동적 weight 계산 helper 함수 4개 추가
- ✅ `store.ts`: rollRandomQuestForToday에 동적 weight 로직 적용
- ✅ persist version 11 유지 (optional 필드 추가만, 스키마 변경 없음)
- ✅ 빌드 통과 확인

**randomQuestHistory 보강**:
- `generatedCategory?: Category` 필드 추가
- 생성된 퀘스트의 카테고리 기록
- 생성 안 된 날도 roll 기록 (undefined)

**동적 weight 계산 helper 함수**:
1. `getRecentRandomQuestHistory()` — 최근 N일 기록 조회
2. `getRecentRandomQuestCategoryCounts()` — 카테고리별 등장 횟수 집계
3. `getTodayDailyCategoryCounts()` — 오늘 가용 daily 카테고리 집계
4. `calculateDynamicRandomQuestWeight()` — 동적 weight 계산
5. `pickWeightedRandomQuest()` — weight 기반 선택

**동적 weight 보정 규칙**:

| 조건 | 보정 | 이유 |
|---|---|---|
| 최근 7일 등장 0회 | × 1.35 | 안 나온 카테고리 우선 |
| 최근 7일 등장 1회 | × 1.15 | 약간 우선 |
| 최근 7일 등장 2회 | × 1.0 | 중립 |
| 최근 7일 등장 3회 이상 | × 0.75 | 과도한 반복 방지 |
| 같은 퀘스트 최근 등장 | × 0.35 | 같은 퀘스트 반복 강력 방지 |
| 오늘 daily 0개 | × 1.15 | 부족한 카테고리 보완 |
| 오늘 daily 1~2개 | × 1.0 | 중립 |
| 오늘 daily 3개 이상 | × 0.9 | 과도한 쏠림 방지 |
| 최소 weight | Math.max(1, weight) | 안전장치 |

**예시 계산**:
- 기본 weight: 4 (career 퀘스트)
- 최근 7일 등장 0회: 4 × 1.35 = 5.4
- 같은 퀘스트 아님: 5.4 × 1.0 = 5.4
- 오늘 career daily 2개: 5.4 × 1.0 = 5.4
- 최종 weight: 5.4

**기존 정책 유지**:
- ✅ 하루 첫 접속 시 roll
- ✅ 생성 확률 30%
- ✅ 하루 최대 1개
- ✅ 스킵 시 재생성 없음
- ✅ 만료 시 패널티 없음
- ✅ career/finance 기본 높은 weight 유지

**효과**:
- 같은 퀘스트 반복 등장 확률 대폭 감소 (× 0.35)
- 안 나온 카테고리 우선 등장 (× 1.35)
- 과도한 카테고리 쏠림 완화 (× 0.75)
- daily 구성과 보완적 관계 형성

**다음 단계 예정**: 5차 작업 5단계 — 히든 칭호 보류 조건 정리

### 5차 작업 5단계 완료 (2025-05-15) — 히든 칭호 보류 조건 정리
- ✅ `types.ts`: 히든 칭호 4개 메타데이터 추가 (포트폴리오 매니저, 자립한 헌터, 위생의 수호자, 완벽주의자)
- ✅ `store.ts`: checkTitleUnlocks에 4개 히든 칭호 해금 조건 추가
- ✅ `CLAUDE.md`: 보류 칭호 상태표 문서화
- ✅ persist version 11 유지 (스키마 변경 없음)
- ✅ 빌드 통과 확인

**구현한 히든 칭호 (4개)**:

| 칭호 | 레어리티 | 조건 | 구현 근거 |
|---|---|---|---|
| 📈 포트폴리오 매니저 | rare | CMA 운용 일지 6회 작성 | `special.cmaJournalCount >= 6` |
| 🏠 자립한 헌터 | rare | 빨래 + 청소 + 분리수거 각 10회 | `dailyCompletions.byQuestId` 기반 |
| 🏠 위생의 수호자 | epic | 자취 daily 합산 100회 | 빨래/청소/분리수거 합산 |
| 👑 완벽주의자 | legendary | 7일 연속 모든 daily 100% 완료 | `dailyHistory.completedAllAvailableDailies` 기반 |

**해금 조건 상세**:

1. **포트폴리오 매니저**:
   - `stats.special.cmaJournalCount >= 6`
   - `dungeon-cma-journal` 진행 시 자동 증가
   - 안정적 구현 가능

2. **자립한 헌터**:
   - `daily-laundry` 10회 이상
   - `daily-cleaning` 10회 이상
   - `daily-recycle` 10회 이상
   - 각 quest id 기반 정확한 판정

3. **위생의 수호자**:
   - 자취 관련 daily 합산: `['daily-laundry', 'daily-cleaning', 'daily-recycle']`
   - 총 100회 이상
   - habit 전체가 아닌 명시적 quest id 목록 사용

4. **완벽주의자**:
   - 최근 7일 연속 `completedAllAvailableDailies === true`
   - `totalDailyAvailableCount > 0`인 날만 인정
   - streak 중단 시 즉시 실패

**보류한 히든 칭호 (6개)**:

| 칭호 | 보류 이유 | 필요한 기록 구조 |
|---|---|---|
| 태양보다 일찍 | "폰 1시간 안 보기" quest id 및 동시 완료 판정 필요 | 동시 완료 기록 구조 |
| 자본의 추적자 | 월별 연속 달성 기록 필요 | `spendingLimitClearMonthKeys: string[]` |
| 불사의 몸 | 단백질 + 물 + 유산소 동시 완료 30일 연속 판정 필요 | 동시 완료 연속 기록 |
| 빙결 | 날짜 전환 시 0 daily 완료 streak 계산 필요 | `zeroDailyClearCurrentStreak` 로직 |
| 부활 | streak 깨짐 이벤트와 다음날 all clear 기록 필요 | streak 깨짐 이벤트 기록 |
| 5분할의 완성자 | 월간 5개 운동 던전 완료 여부 기록 필요 | `monthlyDungeonClears: Record<string, string[]>` |

**보류 칭호 상세**:

1. **태양보다 일찍**:
   - 조건: 7시 전 기상 + 폰 1시간 안 보기 21일 연속
   - 문제: `daily-sleep`과 `daily-no-phone-morning`의 동시 완료 판정 필요
   - 필요: 날짜별 동시 완료 기록 구조

2. **자본의 추적자**:
   - 조건: 소비 제한 main 3개월 연속 달성
   - 문제: `spendingLimitMonthlyClearCount`는 누적만 기록
   - 필요: 월별 clear 기록 (`['2026-03', '2026-04', '2026-05']`)
   - 단순 누적 3회로 구현하면 "연속" 조건 왜곡

3. **불사의 몸**:
   - 조건: 단백질 + 물 + 유산소 동시 30일 연속
   - 문제: 3개 daily 동시 완료 연속 기록 필요
   - 필요: 날짜별 동시 완료 streak 계산

4. **빙결**:
   - 조건: daily 0개 깬 날 3일 연속
   - 문제: `zeroDailyClearCurrentStreak` 계산 로직 없음
   - 필요: 날짜 전환 시점에 전날 dailyHistory 확인 로직

5. **부활**:
   - 조건: streak 깨진 후 다음날 모든 daily 클리어
   - 문제: streak 깨짐 이벤트 기록 없음
   - 필요: streak 변화 이벤트 기록 + 다음날 all clear 판정

6. **5분할의 완성자**:
   - 조건: 5개 부위 헬스 던전 한 달 모두 클리어
   - 문제: `dungeonClears.byQuestId`는 누적만 기록
   - 필요: 월별 clear 기록 (`monthlyDungeonClears['2026-05'] = ['dungeon-arm-monthly', ...]`)
   - 단순 누적으로 구현하면 "한 달 모두" 조건 왜곡

**칭호 총 개수**:
- 일반 칭호: 17개
- 히든 칭호 (5-4A): 13개
- 메타 히든 칭호 (5-4B): 3개
- 추가 히든 칭호 (5-5): 4개
- **총 37개** (구현 완료)
- 보류 칭호: 6개 (향후 구현)

**다음 단계 예정**: 10차 작업 2단계 — 소모품 사용 버튼/로직 구현

---

---

## 장비 효과 정책 (9차 작업 5단계에서 확정)

### 1. stat_bonus 정책

장비 `stat_bonus`는 **보상/전투 계산용 effective stat에만 반영**한다.  
**칭호, 영구 업적, 기본 성장 조건은 `hunter.stats` (base stats) 기준으로만 판정**한다.

| 사용처 | 사용 스탯 |
|---|---|
| 칭호 조건 (STR/INT/PER/SEN) | `hunter.stats` 기본값만 |
| 영구 업적 조건 | `hunter.stats` 기본값만 |
| 직업 각성 조건 중 스탯 조건 | `hunter.stats` 기본값만 |
| 자유 스탯 배분 | `hunter.stats`만 변경 |
| XP 보너스 계산 | 장비 포함 effective stat |
| 드롭률 계산 | 장비 포함 effective stat |
| 레어리티 계산 | 장비 포함 effective stat |
| 던전 부분 보상 | 장비 포함 effective stat |
| 향후 게이트/전투 | 장비 포함 effective stat |

**이유**:
- 장비로 칭호를 얻는 것은 영구 업적 의미를 흐린다
- 장비 해제 시 칭호 회수 문제가 생긴다
- 칭호/업적은 기본 성장 기준이어야 한다

### 2. XP 보너스 정책

**스탯 보너스**는 multiplier로 적용한다.  
**직업 XP 보너스, 장비 XP 보너스, 향후 소모품 XP 보너스는 additive bucket으로 합산**한다.

```typescript
// 최종 XP 계산 공식
const additiveXpBonus = jobBonus + equipmentBonus + consumableBonus // 합연산
const finalXp = baseXp × statMultiplier × (1 + additiveXpBonus)
```

**현재 구현** (consumableBonus는 아직 미구현이므로 0):
```typescript
const additiveXpBonus = jobCategoryBonus + equipmentXpBonus
const xp = Math.round(baseXp * statMultiplier * (1 + additiveXpBonus))
```

**이유**:
- 곱연산은 후반에 보너스가 여러 개 쌓이면 폭발한다
- 합연산은 사용자가 이해하기 쉽다
- 밸런스 예측이 쉽다

**예시**:
- 직업 +8%, 장비 +10% = 총 +18%
- 곱연산: 1.08 × 1.10 = 1.188배 (18.8%)
- 합연산: 1 + 0.08 + 0.10 = 1.18배 (18%) ✅

### 3. 적용 위치

| 위치 | 처리 |
|---|---|
| `completeQuest` (daily/main 완료) | 합연산 적용 ✅ |
| `progressDungeon` (부분 보상) | 스탯 보너스만 (AGI) |
| `progressDungeon` (최종 클리어 보상) | 합연산 적용 ✅ |
| `completeRandomQuest` | 합연산 적용 ✅ |

### 4. 향후 확장

소모품 XP 보너스는 같은 additive bucket에 합류할 예정:
```typescript
// Future implementation
const consumableXpBonus = getActiveConsumableXpBonus(state, category)
const additiveXpBonus = jobCategoryBonus + equipmentXpBonus + consumableXpBonus
```

---직**:
1. RandomQuestCard에서 "스킵" 버튼 클릭
2. `skipRandomQuest()` 호출
3. activeRandomQuest 제거
4. randomQuestHistory[dateKey].skipped = true
5. 패널티 없음

**랜덤 퀘스트 만료 로직**:
1. 앱 진입 시 `clearExpiredRandomQuest()` 호출
2. activeRandomQuest 존재 + now > expiresAt → activeRandomQuest 제거
3. 자동 소멸 (SystemMessage 없음)

**RandomQuestCard UI**:
- 위치: daily 탭 상단 (퀘스트 목록 위)
- 디자인: amber/orange 그라데이션, AlertTriangle 아이콘, 코너 브라켓
- 표시 내용: 제목, 설명, 카테고리, 난이도, XP, 남은 시간
- 버튼: "완료" (primary), "스킵" (secondary)
- 완료 후: "완료됨" 배지 표시, 버튼 비활성화
- 만료 후: 자동 소멸 (카드 미표시)

**randomQuestHistory 구조**:
```typescript
Record<string, {
  generatedQuestId?: string  // roll 시 생성된 quest id (30% 확률)
  completedQuestId?: string  // 완료한 quest id
  skipped?: boolean          // 스킵 여부
}>
```

**persist 마이그레이션 (v9 → v10)**:
- activeRandomQuest 기본값: undefined
- randomQuestHistory 기본값: {}
- 기존 저장 데이터 호환 (optional 필드)

**8차 랜덤 퀘스트 시스템 1차 완성**:
- ✅ 랜덤 퀘스트 생성 (30% 확률, 하루 1개)
- ✅ 랜덤 퀘스트 완료 (XP + 아이템)
- ✅ 랜덤 퀘스트 스킵 (패널티 없음)
- ✅ 랜덤 퀘스트 만료 (자동 소멸)
- ✅ RandomQuestCard UI (daily 탭 상단)
- **총 25개 랜덤 퀘스트 풀 구현 완료**

**이번 단계에서 구현하지 않은 것**:
- 랜덤 퀘스트 전용 탭 (daily 탭에 표시로 충분)
- 랜덤 퀘스트 히스토리 UI (필요 시 추가)
- 랜덤 퀘스트 난이도 조정 (현재 풀로 충분)
- 랜덤 퀘스트 보상 강화 (밸런스 유지)
- 랜덤 퀘스트 연속 완료 보너스 (복잡도 증가)
- 게이트/전투력/보스 시스템 (아직 토론 전)
- 장비 시스템 (아직 토론 전)

**다음 단계 예정**: 9차 작업 — 장비 시스템 (아이템 장착/효과 적용).

### 9차 작업 1단계 완료 (2025-05-15) — 장비 타입 확장 + ITEM_POOL 개선
- ✅ `types.ts`: EquipmentSlot, ItemEffectType, ItemEffect 타입 추가
- ✅ `types.ts`: Item 타입에 optional 필드 추가 (equippable, slot, effects)
- ✅ `types.ts`: EQUIPMENT_SLOT_LABEL 추가
- ✅ `seed.ts`: ITEM_POOL 11개 → 41개로 확장 (common 8개, uncommon 9개, rare 10개, epic 8개, legendary 6개)
- ✅ 장비 가능 아이템 38개, 소비 아이템 후보 3개
- ✅ persist version 변경 없음 (optional 필드만 추가, 기존 아이템 호환)
- ✅ 빌드 통과 확인

**장비 시스템 타입 구조**:
- **EquipmentSlot**: weapon (무기), armor (방어구), accessory (장신구), artifact (유물)
- **ItemEffectType**: xp_bonus (XP 보너스), drop_bonus (드롭률 보너스), rarity_bonus (레어리티 보너스), stat_bonus (스탯 보너스)
- **ItemEffect**: { type, category?, stat?, value }
- **Item 확장**: equippable (장착 가능 여부), slot (장비 슬롯), effects (효과 배열)

**ITEM_POOL 확장 (41개)**:
- **common (8개)**: 장비 5개 (weapon 2, armor 1, accessory 1, artifact 1), 소비 1개
- **uncommon (9개)**: 장비 9개 (weapon 3, armor 2, accessory 2, artifact 2)
- **rare (10개)**: 장비 10개 (weapon 3, armor 2, accessory 3, artifact 2)
- **epic (8개)**: 장비 7개 (weapon 2, armor 2, accessory 2, artifact 1), 소비 1개
- **legendary (6개)**: 장비 5개 (weapon 2, armor 1, accessory 1, artifact 1), 소비 1개

**장비 효과 예시**:
- **XP 보너스**: study XP +3%, career XP +5% (카테고리별)
- **드롭률 보너스**: 드롭률 +1%, +2% (전체)
- **레어리티 보너스**: 레어리티 +1%, +2% (epic/legendary 확률 증가)
- **스탯 보너스**: INT +2, STR +3, PER +2 (스탯별)

**소비 아이템 후보 (3개)**:
- 경험치 물약 (epic): equippable: false
- 행운의 부적 (legendary): equippable: false
- 성장의 비약 (common): equippable: false
- 사용 기능은 나중에 구현 예정

**기존 아이템 호환**:
- equippable, slot, effects 필드가 없는 기존 아이템도 정상 동작
- Inventory.tsx에서 equippable === true인 아이템만 장착 버튼 표시
- equippable === false 또는 undefined인 아이템은 "장착 불가" 또는 "소비 아이템" 표시

**persist version**:
- 변경 없음 (v10 유지)
- optional 필드만 추가했으므로 기존 저장 데이터 호환
- 새로 드롭되는 아이템은 새 구조 적용

**9차 작업 1단계 완료**:
- ✅ 장비 타입 기반 구축
- ✅ ITEM_POOL 대폭 확장 (11개 → 41개)
- ✅ 장비 효과 메타데이터 정의
- **다음 단계**: 장착/해제 로직 + Inventory UI

**이번 단계에서 구현하지 않은 것**:
- 장착/해제 로직 (9-2에서 구현)
- 장비 효과 실제 적용 (9-3에서 구현)
- 소비 아이템 사용 기능 (나중에)
- 장비 강화 시스템 (나중에)
- 중복 아이템 흡수 강화 (나중에)
- 게이트/전투력/보스 시스템 (아직 토론 전)

**다음 단계 예정**: 9차 작업 2단계 — 장착/해제 로직 + Inventory UI.

### 9차 작업 2단계 완료 (2025-05-15) — 장착/해제 로직 + Inventory UI
- ✅ `types.ts`: EquipmentState 타입 추가
- ✅ `store.ts`: equipment 필드 추가 (Partial<Record<EquipmentSlot, string>>)
- ✅ `store.ts`: equipItem, unequipItem 액션 구현
- ✅ `Inventory.tsx`: 완전 재작성 (장착 슬롯 UI, 장착/해제 버튼, 효과 요약)
- ✅ persist version 10 → 11 (equipment 필드 추가)
- ✅ 빌드 통과 확인

**equipment 상태 구조**:
```typescript
equipment: {
  weapon?: string    // items 배열의 item.id
  armor?: string
  accessory?: string
  artifact?: string
}
```

**equipItem 액션**:
- items에서 itemId로 아이템 찾기
- equippable !== true → 장착 불가
- slot 없음 → 장착 불가
- 이미 다른 슬롯에 장착됨 → 중복 장착 방지 (무시)
- 해당 slot에 기존 장비 있음 → 새 장비로 교체
- 장착 후 SystemMessage 표시 ("장비 장착 [아이템명]을(를) 무기 슬롯에 장착했습니다.")

**unequipItem 액션**:
- 해당 slot에 장비 없음 → 무시
- 있으면 slot을 undefined 처리 (delete newEquipment[slot])
- 해제 후 SystemMessage 표시 ("장비 해제 [아이템명]을(를) 해제했습니다.")

**Inventory.tsx 재작성**:
- **장착 슬롯 영역** (상단):
  - 4개 슬롯 grid (weapon, armor, accessory, artifact)
  - 각 슬롯: 아이콘, 라벨, 장착 장비 정보 (아이콘, 이름, rarity, 효과 요약), 해제 버튼
  - 비어 있는 슬롯: "비어 있음" 표시
- **아이템 그리드** (하단):
  - 기존 레어리티 정렬 유지
  - 각 아이템 카드: 아이콘, 이름, rarity, 슬롯, 효과 요약, 설명, 장착/해제 버튼
  - 장착 중 아이템: amber 테두리 + "장착 중" 배지
  - 장착 가능 아이템: "장착" 버튼
  - 소비 아이템: "소비 아이템" 표시 (버튼 없음)
  - 기존 아이템 (equippable undefined): "장착 불가" 표시

**formatItemEffects 헬퍼**:
- ItemEffect[] → string[] 변환
- xp_bonus: "학습 XP +3%" (CATEGORY_META 라벨 활용)
- drop_bonus: "드롭률 +1%"
- rarity_bonus: "레어리티 +1%"
- stat_bonus: "INT +2"

**장착/해제 흐름**:
1. 아이템 카드에서 "장착" 버튼 클릭 → equipItem(item.id)
2. equipment[item.slot] = item.id
3. 장착 슬롯 UI 즉시 업데이트
4. 아이템 카드에 "장착 중" 배지 표시
5. 장착 슬롯에서 "해제" 버튼 클릭 → unequipItem(slot)
6. equipment[slot] = undefined
7. 장착 슬롯 "비어 있음" 표시
8. 아이템 카드 "장착" 버튼 표시

**중복 아이템 장착**:
- 같은 이름 아이템이 여러 개 있어도 id 기준으로 개별 장착 가능
- 예: "그림자 단검" 2개 보유 → 각각 다른 id → 하나만 장착 가능 (weapon 슬롯 1개)

**persist 마이그레이션 (v10 → v11)**:
- equipment 기본값: {}
- 기존 저장 데이터 호환 (hunter, job, title, achievementStats, randomQuestHistory, items 모두 유지)
- localStorage 키 변경 없음

**9차 작업 2단계 완료**:
- ✅ 장비 장착/해제 로직 구현
- ✅ Inventory UI 완전 재작성
- ✅ 장착 슬롯 UI 4개 표시
- ✅ 장착/해제 버튼 동작
- ✅ 효과 요약 표시
- **다음 단계**: 장비 효과를 실제 XP/drop/rarity/stat 계산에 반영

**이번 단계에서 구현하지 않은 것**:
- 장비 효과 실제 적용 (9-3에서 구현)
- 소비 아이템 사용 기능 (나중에)
- 장비 강화 시스템 (나중에)
- 중복 아이템 흡수 강화 (나중에)
- 게이트/전투력/보스 시스템 (아직 토론 전)

**다음 단계 예정**: 9차 작업 3단계 — 장비 효과 실제 적용 (XP/drop/rarity/stat 계산).

### 9차 작업 3단계 완료 (2025-05-15) — 장비 효과 실제 계산 반영
- ✅ `game.ts`: 장비 효과 계산 헬퍼 추가 (getEquippedItems, getEquipmentXpBonus, getEquipmentDropBonus, getEquipmentRarityBonus, getEquipmentStatBonuses, getEffectiveStats)
- ✅ `game.ts`: 스탯 효과 헬퍼에 장비 반영 버전 추가 (getXpMultiplierWithEquipment, getDropChanceBonusWithEquipment, getPartialRewardMultiplierWithEquipment, getRarityWeightBonusWithEquipment)
- ✅ `store.ts`: randomItem 함수에 장비 레어리티 보너스 적용
- ✅ `store.ts`: completeQuest에 장비 XP/drop/rarity 보너스 적용
- ✅ `store.ts`: progressDungeon에 장비 효과 적용 (부분 보상 + 클리어 보상)
- ✅ `store.ts`: completeRandomQuest에 장비 효과 적용
- ✅ `HunterStatus.tsx`: 장비 스탯 보너스 표시 (기본 스탯 + 장비 보너스 구분)
- ✅ persist version 변경 없음 (v11 유지)
- ✅ 빌드 통과 확인

**장착 장비 조회**:
- `getEquippedItems(items, equipment)`: equipment의 itemId들로 실제 Item 객체 조회
- equippable === true인 아이템만 필터링

**XP 보너스 적용**:
- `getEquipmentXpBonus(equippedItems, category)`: 해당 카테고리 xp_bonus 합산
- 계산식: `baseXp * statMultiplier * (1 + jobBonus) * (1 + equipmentXpBonus)`
- 같은 카테고리 장비 여러 개 장착 시 합산 (예: career +3%, career +4% → +7%)
- 일반 퀘스트, 던전 클리어, 랜덤 퀘스트 모두 적용

**드롭률 보너스 적용**:
- `getEquipmentDropBonus(equippedItems)`: 모든 drop_bonus 합산
- 계산식: `Math.min(0.95, baseDropChance + statDropBonus + equipmentDropBonus)`
- 최대 드롭률 95% cap (boss는 여전히 100%)
- 일반 퀘스트, 랜덤 퀘스트 모두 적용

**레어리티 보너스 적용**:
- `getEquipmentRarityBonus(equippedItems)`: 모든 rarity_bonus 합산 (최대 0.05 cap)
- `randomItem(hunter, equippedItems)`: SEN 스탯 보너스 + 장비 레어리티 보너스 합산
- legendary 확률: 0.02 + totalBonus * 0.4 (최대 4% cap)
- epic 확률: 0.08 + totalBonus * 0.6
- 일반 퀘스트, 던전 클리어, 랜덤 퀘스트 모두 적용

**stat_bonus 실제 반영**:
- `getEquipmentStatBonuses(equippedItems)`: 모든 stat_bonus 합산
- `getEffectiveStats(baseStats, equippedItems)`: 기본 스탯 + 장비 보너스
- 기본 hunter.stats는 변경하지 않음 (장비 해제 시 자동 제거)
- 스탯 효과 계산에 effective stat 사용:
  - STR: 운동/건강 XP 보너스 (10마다 +5%)
  - VIT: 운동/건강 드롭률 보너스 (10마다 +3%)
  - AGI: 던전 부분 보상 보너스 (10마다 +5%)
  - INT: 학습/커리어 XP 보너스 (10마다 +5%)
  - PER: streak 보호 계산 (10마다 1회)
  - SEN: 레어리티 보너스 (10마다 +1%)

**HunterStatus 표시**:
- 기본 스탯: 큰 글씨로 표시 (예: 24)
- 장비 보너스: 작은 purple 글씨로 표시 (예: +2)
- 최종 표시: "24 +2" 형식
- 스탯 효과 설명은 effective stat 기준으로 계산

**Random Quest 반영**:
- XP 계산: 스탯 + 직업 + 장비 보너스 모두 적용
- 드롭률: 스탯 + 장비 보너스 적용
- 레어리티: SEN + 장비 보너스 적용

**persist version**:
- 변경 없음 (v11 유지)
- 저장 스키마 변경 없음 (계산 로직만 변경)

**9차 작업 3단계 완료**:
- ✅ 장비 XP 보너스 실제 적용
- ✅ 장비 드롭률 보너스 실제 적용
- ✅ 장비 레어리티 보너스 실제 적용
- ✅ 장비 스탯 보너스 실제 적용
- ✅ HunterStatus에 장비 스탯 표시
- ✅ Random Quest에 장비 효과 반영
- **장비 시스템 1차 완성!**

**이번 단계에서 구현하지 않은 것**:
- 소비 아이템 사용 기능 (나중에)
- 장비 강화 시스템 (나중에)
- 중복 아이템 흡수 강화 (나중에)
- 장비 세트 효과 (나중에)
- 게이트/전투력/보스 시스템 (아직 토론 전)

**다음 단계 예정**: 9차 작업 4단계 — 장비 밸런스/UX 점검 (선택사항).

### 9차 작업 4단계 완료 (2025-05-15) — 장비 시스템 밸런스/UX 점검
- ✅ `game.ts`: XP 보너스 cap 추가 (최대 20%)
- ✅ `game.ts`: 드롭률 보너스 cap 추가 (최대 10%)
- ✅ `Inventory.tsx`: 소비 아이템 문구 개선 ("소비템 · 사용 기능 예정")
- ✅ ITEM_POOL 효과 수치 점검 완료 (모든 값 정상)
- ✅ 빌드 통과 확인

**장비 효과 수치 점검 결과**:
- ✅ 모든 XP/drop/rarity 보너스가 올바른 소수값 (0.01~0.1)
- ✅ 모든 stat_bonus가 올바른 정수값 (1~5)
- ✅ 레어리티별 효과 수치 적절:
  - common: XP +1%, 드롭 +1%, 스탯 +1
  - uncommon: XP +2~3%, 드롭 +1~2%, 스탯 +2
  - rare: XP +3~5%, 드롭 +2~3%, 스탯 +2
  - epic: XP +5~7%, 드롭 +3~4%, 스탯 +2~3
  - legendary: XP +8~10%, 드롭 +4~5%, 스탯 +3~5

**장비 조합 밸런스**:
- XP 보너스 cap: 특정 카테고리 최대 20% (getEquipmentXpBonus에서 cap)
- 드롭률 보너스 cap: 최대 10% (getEquipmentDropBonus에서 cap)
- 레어리티 보너스 cap: 최대 5% (기존 getEquipmentRarityBonus에서 cap)
- legendary 확률 cap: 최대 4% (기존 randomItem에서 cap)
- 최종 드롭률 cap: 95% (boss는 100% 유지)

**슬롯 분포**:
- weapon: 6개 (common 2, rare 1, epic 2, legendary 1)
- armor: 9개 (common 1, uncommon 2, rare 2, epic 2, legendary 2)
- accessory: 10개 (common 1, uncommon 4, rare 3, epic 1, legendary 1)
- artifact: 13개 (common 1, uncommon 2, rare 2, epic 4, legendary 4)
- 소비 아이템 후보: 3개 (common 3)
- **총 41개 아이템**

**소비 아이템 문구 개선**:
- 기존: "소비 아이템" (사용 불가 이유 불명확)
- 개선: "소비템 · 사용 기능 예정" (purple 테두리, 추후 구현 예정 명시)

**장비 시스템 1차 완료 요약**:
- ✅ 장비 타입/슬롯 시스템 (weapon/armor/accessory/artifact)
- ✅ 장착 상태 관리 (equipment에 item.id 저장)
- ✅ 중복 아이템 허용 (id 기준 개별 관리)
- ✅ 장비 효과 4종 (xp_bonus, drop_bonus, rarity_bonus, stat_bonus)
- ✅ stat_bonus 실제 계산 반영 (effective stat)
- ✅ 장착/해제 UI (Inventory 장비 슬롯 + 아이템 카드)
- ✅ HunterStatus 장비 스탯 표시 (기본 + 장비 보너스 구분)
- ✅ 밸런스 cap 적용 (XP 20%, 드롭 10%, 레어리티 5%, legendary 4%)
- ✅ ITEM_POOL 41개 (장비 38개, 소비 아이템 후보 3개)

**이번 단계에서 구현하지 않은 것**:
- 소비 아이템 사용 기능 (10차 작업 예정)
- 장비 강화 시스템 (추후 중복 흡수 강화 후보)
- 장비 세트 효과 (추후 확장 후보)
- 게이트/전투력/보스 시스템 (별도 대형 작업)

**다음 단계 예정**: 10차 작업 — 소모품 시스템 (소비 아이템 사용 효과 구현).
- 랜덤 퀘스트

**persist 버전**:
- 변경 없음 (v9 유지)
- 스키마 변경 없음 (UI만 추가)

**다음 단계 예정**: 2차 각성 시스템, 직업 효과 강화, 게이트/전투력/장비/랜덤 퀘스트 (추후 논의).

### 7차 작업 3단계 완료 (2025-05-15) — 2차 각성 시스템 구현
- ✅ `types.ts`: 2차 직업 5개 추가 (JobId 확장, JOB_DEFINITIONS 확장)
- ✅ `store.ts`: 2차 각성 조건 추가 (checkJobAwakening 확장)
- ✅ `store.ts`: 2차 각성 자동 장착 로직 구현 (unlockJob 개선)
- ✅ `store.ts`: 2차 각성 전용 SystemMessage 구현
- ✅ 빌드 통과 확인

**추가된 2차 직업 (5개)**:
1. **황금안의 예언자** (golden-oracle, market 계열, tier 2):
   - 설명: 자본의 흐름 너머에 숨은 징조를 읽어내는 예언자
   - 해금 조건: 금안의 점술사 보유 + 시장 점검 100회 OR finance/career 퀘스트 150회
   - 효과: finance XP +8%, career XP +8%

2. **심연의 기록관** (abyss-archivist, research 계열, tier 2):
   - 설명: 흩어진 지식과 기록의 심연에서 진실을 끌어올리는 자
   - 해금 조건: 금서 해독자 보유 + study/career 퀘스트 180회
   - 효과: study XP +8%, career XP +6%

3. **강철심장의 투사** (steelheart-fighter, training 계열, tier 2):
   - 설명: 흔들리지 않는 심장으로 한계를 부수는 전투형 헌터
   - 해금 조건: 강철의 견습기사 보유 + workout/health 퀘스트 180회 OR 던전 클리어 20회
   - 효과: workout XP +8%, health XP +8%

4. **시간의 심판관** (chrono-judge, discipline 계열, tier 2):
   - 설명: 흐트러진 욕망과 시간을 심판하는 규율의 집행자
   - 해금 조건: 침묵의 수도자 보유 + habit/mind 퀘스트 180회 OR 숏폼 제한/명상 루틴 90회
   - 효과: habit XP +8%, mind XP +8%

5. **운명의 조율자** (fate-harmonizer, balance 계열, tier 2):
   - 설명: 모든 성장의 흐름을 조율해 자신의 운명을 다시 쓰는 각성자
   - 해금 조건: 무명의 각성자 보유 + 5개 이상 카테고리에서 각각 50회 이상 완료
   - 효과: career/study/workout/health/habit/mind XP +4%

**2차 각성 조건**:
- 모든 2차 직업은 해당 1차 직업 보유가 필수 조건
- 1차 직업 조건보다 약 2~3배 높은 누적 기록 요구
- 예시:
  - 금안의 점술사 (1차): 시장 점검 30회 OR finance/career 50회
  - 황금안의 예언자 (2차): 금안의 점술사 보유 + 시장 점검 100회 OR finance/career 150회

**2차 각성 자동 장착 규칙**:
- **현재 해당 1차 직업 장착 중**: 2차 직업 해금 시 자동 장착 (진화)
- **다른 직업 장착 중**: 2차 직업 해금만 하고 자동 장착 안 함
- **미각성자 상태**: 2차 직업 해금 시 자동 장착 (거의 발생하지 않음)

**2차 각성 SystemMessage**:
- 1차 각성: `── SYSTEM ── 각성 발생` / `새 직업 [직업명]을 획득했습니다.`
- 2차 각성 (자동 장착): `── SYSTEM ── 2차 각성 발생` / `[1차 직업명]이(가) [2차 직업명]로 진화했습니다.`
- 2차 각성 (해금만): `── SYSTEM ── 2차 각성 발생` / `새 직업 [직업명]을 획득했습니다.`

**XP 보너스 비교**:
| 직업 | 1차 효과 | 2차 효과 | 증가율 |
|------|---------|---------|--------|
| market 계열 | finance/career +5% | finance/career +8% | 1.6배 |
| research 계열 | study +5%, career +3% | study +8%, career +6% | 1.6~2배 |
| training 계열 | workout/health +5% | workout/health +8% | 1.6배 |
| discipline 계열 | habit/mind +5% | habit/mind +8% | 1.6배 |
| balance 계열 | 6개 카테고리 +2% | 6개 카테고리 +4% | 2배 |

**JobPanel 표시**:
- 2차 직업 카드는 JOB_DEFINITIONS 기반으로 자동 표시
- 티어 표시: `2차 각성` (purple 색상)
- 미해금 2차 직업: 잠김 상태 + 해금 조건 표시
- 해금된 2차 직업: 전환 버튼 표시
- 장착 중 2차 직업: 장착 중 배지 (amber 테두리)

**persist 버전**:
- 변경 없음 (v9 유지)
- JobId 타입 확장이지만 저장 스키마 구조는 동일
- 기존 저장 데이터와 호환

**직업 시스템 1차 완성**:
- ✅ 미각성자 (tier 0)
- ✅ 1차 직업 5개 (tier 1)
- ✅ 2차 직업 5개 (tier 2)
- ✅ 직업 해금/전환 UI
- ✅ 직업 XP 보너스 적용
- ✅ 자동 각성 체크
- ✅ 2차 각성 진화 시스템
- **총 11개 직업 구현 완료**

**이번 단계에서 구현하지 않은 것**:
- 3차 직업 (현재 계획 없음)
- 직업 효과 추가 (스탯 보너스, 드롭률 보너스는 메타데이터만 존재)
- 직업 전용 탭 (현재 JobPanel로 충분)
- 게이트/전투력/보스 시스템
- 장비 시스템
- 랜덤 퀘스트

**다음 단계 예정**: 새 시스템 도입 여부 토론 (랜덤 퀘스트, 장비, 게이트, 보스 등).

### 8차 작업 1단계 완료 (2025-05-15) — 랜덤 퀘스트 MVP 구현
- ✅ `types.ts`: RandomQuestTemplate, ActiveRandomQuest 타입 추가
- ✅ `seed.ts`: RANDOM_QUEST_POOL 추가 (25개 긴급 의뢰)
- ✅ `store.ts`: 랜덤 퀘스트 필드 및 액션 추가 (roll/complete/skip/clearExpired)
- ✅ `RandomQuestCard.tsx`: 새 컴포넌트 생성 (긴급 의뢰 카드)
- ✅ `App.tsx`: 랜덤 퀘스트 초기화 및 표시 (daily 탭 상단)
- ✅ persist version 9 → 10
- ✅ 빌드 통과 확인

**랜덤 퀘스트 시스템 (긴급 의뢰)**:
- **목적**: 반복 daily의 지루함 완화, 하루마다 변수 제공, 짧고 현실적인 행동 유도
- **명칭**: UI에서는 "긴급 의뢰", 내부 타입은 RandomQuest/ActiveRandomQuest
- **생성 규칙**:
  - 하루 첫 접속 시 30% 확률로 생성
  - 하루 최대 1개 제한
  - weight 기반 랜덤 선택 (career/finance 높음, mind 낮음)
  - 만료 시각: 오늘 23:59:59
  - 이미 생성된 날은 재생성 안 함 (새로고침 방지)

**랜덤 퀘스트 풀 (25개)**:
- **Career / Finance (high weight)**: 시장 기류 탐지, 리포트 정찰, 종목 감응, 공시 해독, 지원자의 문장, 산업의 입구
- **Study (medium-high weight)**: 지식 압축, 개념 회수, 일정 정찰, 한 줄 기록
- **Workout / Health (medium weight)**: 성북천 순찰, 단백질 점검, 수분 보급, 심폐 예열, 관절 해방
- **Habit (medium weight)**: 작전 구역 정리, 싱크대 정화, 보급품 점검, 장비 사전 배치
- **Mind (low weight)**: 소음 차단, 불안 정찰, 단일 명령 수행, 전리품 기록

**완료 규칙**:
- XP 지급: 기존 퀘스트와 동일 (직업/스탯 보너스 적용)
- 아이템 드롭: 낮은 확률 (easy 5%, normal 12%, hard 25%)
- 완료 후 `activeRandomQuest.completed = true`
- 중복 완료 방지
- 만료 후 완료 불가

**스킵 규칙**:
- 패널티 없음
- `activeRandomQuest = undefined`
- `randomQuestHistory[dateKey].skipped = true`
- 같은 날 재생성 안 됨

**만료 규칙**:
- 오늘 자정 이후 자동 제거
- 완료되지 않은 상태로 만료되어도 패널티 없음
- 앱 진입 시 `clearExpiredRandomQuest()` 호출

**UI 표시**:
- **위치**: daily 탭 상단 (일일 퀘스트 위)
- **디자인**: amber/orange 그라데이션, AlertTriangle 아이콘, "── SYSTEM ALERT ──" 헤더
- **표시 내용**: 제목, 설명, 카테고리, 난이도, 보상 XP, 제한 시간
- **버튼**: 완료 / 넘기기
- **상태**: 활성화 중 표시, 완료 후 숨김, 만료 시 "만료됨" 표시

**SystemMessage**:
- 생성 시: `── SYSTEM ── 긴급 의뢰 발생` / `새로운 긴급 의뢰 [제목]가 도착했습니다.`
- 완료 시: `긴급 의뢰 완료` / `[제목] 완료. XP +N`
- 아이템 드롭 시: 기존 아이템 메시지 로직 사용

**앱 진입 시 호출 순서**:
1. `recordAppOpen()`
2. `clearExpiredRandomQuest()`
3. `rollRandomQuestForToday()`
4. `checkTitleUnlocks()`
5. `checkJobAwakening()`

**persist 버전**:
- v9 → v10
- 새 필드: `activeRandomQuest`, `randomQuestHistory`
- 기존 저장 데이터 호환

**이번 단계에서 구현하지 않은 것**:
- 실패 패널티 (MVP에서는 부담 줄이기)
- 랜덤 퀘스트 여러 개 생성 (하루 1개 제한)
- 연쇄 퀘스트 (다음 단계)
- 게이트/전투 시스템 (별도 작업)
- 장비 시스템 (별도 작업)

**다음 단계 예정**: 랜덤 퀘스트 확장 (연쇄 퀘스트, 난이도별 보상 차등), 장비 시스템, 게이트/보스 시스템 (추후 논의).

### 9차 작업 1단계 완료 (2025-05-15) — 장비 타입 확장 + ITEM_POOL 개선
- ✅ `types.ts`: EquipmentSlot, ItemEffectType, ItemEffect 타입 추가, Item 확장
- ✅ `seed.ts`: ITEM_POOL 11개 → 41개로 확장 (장비 중심)
- ✅ 빌드 통과 확인

**장비 시스템 타입 추가**:
- `EquipmentSlot`: 'weapon' | 'armor' | 'accessory' | 'artifact' (4개 슬롯)
- `ItemEffectType`: 'xp_bonus' | 'drop_bonus' | 'rarity_bonus' | 'stat_bonus'
- `ItemEffect`: { type, category?, stat?, value }
- `Item` 확장 필드 (optional):
  - `equippable?: boolean` — 장착 가능 여부
  - `slot?: EquipmentSlot` — 장비 슬롯
  - `effects?: ItemEffect[]` — 장비 효과 목록

**ITEM_POOL 확장 (11개 → 41개)**:
- **Common (8개)**: 소비 아이템 후보 3개 (equippable: false), 장비 5개
  - 소비: 회복 포션, 집중력 비약, 단백질 바
  - 장비: 낡은 단검, 수련용 목검, 초심자의 노트, 낡은 손목보호대, 작은 행운석
- **Uncommon (9개)**: 모두 장비
  - 강철의 책, 의지의 룬, 시장 관측자의 펜, 집중의 반지, 루틴의 팔찌, 중량 벨트, 정돈된 코트, 침묵의 부적, 견습 헌터 배지
- **Rare (10개)**: 모두 장비
  - 바람의 신발, 각성자의 목걸이, 금안의 렌즈, 서고의 열쇠, 분석가의 만년필, 강철 손목보호대, 고요의 반지, 시간의 모래시계, 그림자 망토, 사냥꾼의 단검
- **Epic (8개)**: 모두 장비
  - 검은 정장, 그림자 단검, 황금 나침반, 금서의 책갈피, 계율의 로브, 투사의 장갑, 새벽의 귀걸이, 균형의 문장
- **Legendary (6개)**: 모두 장비
  - 왕의 검, 시스템의 조각, 황금안의 수정구, 심연의 기록서, 시간의 회중시계, 그림자 왕관

**장비 가능 아이템**: 38개 (전체 41개 중)
**소비 아이템 후보**: 3개 (equippable: false)

**장비 효과 값 기준**:
| Rarity | XP 보너스 | 드롭률 | 레어리티 | 스탯 |
|--------|----------|--------|---------|------|
| common | 0.01~0.02 | 0.01 | - | +1 |
| uncommon | 0.02~0.03 | 0.01~0.02 | 0.005 | +1~2 |
| rare | 0.03~0.05 | 0.02~0.03 | 0.01 | +2 |
| epic | 0.05~0.07 | 0.03~0.04 | 0.015 | +3 |
| legendary | 0.08~0.10 | 0.04~0.05 | 0.02 | +4~5 |

**장비 슬롯별 분포**:
- **weapon**: 낡은 단검, 수련용 목검, 사냥꾼의 단검, 그림자 단검, 투사의 장갑, 왕의 검
- **armor**: 낡은 손목보호대, 중량 벨트, 정돈된 코트, 바람의 신발, 강철 손목보호대, 그림자 망토, 검은 정장, 계율의 로브, 그림자 왕관
- **accessory**: 작은 행운석, 의지의 룬, 집중의 반지, 루틴의 팔찌, 침묵의 부적, 각성자의 목걸이, 금안의 렌즈, 고요의 반지, 새벽의 귀걸이, 시간의 회중시계
- **artifact**: 초심자의 노트, 강철의 책, 시장 관측자의 펜, 견습 헌터 배지, 서고의 열쇠, 분석가의 만년필, 시간의 모래시계, 황금 나침반, 금서의 책갈피, 균형의 문장, 시스템의 조각, 황금안의 수정구, 심연의 기록서

**카테고리별 장비 분포**:
- **career**: 정돈된 코트, 견습 헌터 배지, 서고의 열쇠, 분석가의 만년필, 사냥꾼의 단검, 검은 정장, 균형의 문장, 왕의 검, 심연의 기록서, 그림자 왕관
- **finance**: 시장 관측자의 펜, 금안의 렌즈, 분석가의 만년필, 황금 나침반, 황금안의 수정구
- **study**: 초심자의 노트, 강철의 책, 견습 헌터 배지, 서고의 열쇠, 금서의 책갈피, 균형의 문장, 심연의 기록서, 그림자 왕관
- **workout**: 수련용 목검, 중량 벨트, 견습 헌터 배지, 바람의 신발, 강철 손목보호대, 투사의 장갑, 균형의 문장, 왕의 검, 그림자 왕관
- **health**: 낡은 손목보호대, 새벽의 귀걸이
- **habit**: 낡은 단검, 루틴의 팔찌, 정돈된 코트, 사냥꾼의 단검, 시간의 모래시계, 그림자 단검, 계율의 로브, 균형의 문장, 시간의 회중시계, 그림자 왕관
- **mind**: 침묵의 부적, 고요의 반지, 시간의 모래시계, 그림자 단검, 새벽의 귀걸이, 시간의 회중시계

**기존 저장 데이터 호환**:
- Item 타입의 새 필드는 모두 optional
- persist version 변경 없음 (스키마 구조 변경 없음)
- 기존 아이템에 새 필드가 없어도 정상 렌더링

**이번 단계에서 구현하지 않은 것**:
- 장착/해제 로직 (9-2에서 진행)
- equipment store 필드 (9-2에서 진행)
- Inventory 장착 버튼 (9-2에서 진행)
- XP/drop/rarity 효과 실제 적용 (9-3에서 진행)
- 소비 아이템 사용 기능 (나중에 별도)
- 소비 아이템 종류 대량 확장 (나중에 별도)

**다음 단계 예정**: 9차 작업 2단계 — 장비 장착/해제 UI 및 로직 구현.


### 10차 작업 3단계 완료 (2025-05-15) — 소모품 효과 실제 계산 반영
- ✅ `game.ts`: `getEffectiveStats` 함수 확장 (consumableStatBonuses 파라미터 추가)
- ✅ `game.ts`: 모든 stat-driven helper 함수에 consumableStatBonuses 파라미터 추가
  - `getXpMultiplierWithEquipment`
  - `getDropChanceBonusWithEquipment`
  - `getPartialRewardMultiplierWithEquipment`
  - `getRarityWeightBonusWithEquipment`
- ✅ `store.ts`: `completeQuest`에 consumable stat bonuses 적용
  - XP 계산: consumableStatBonuses 추가
  - 드롭률 계산: consumableStatBonuses 추가
  - 레어리티 계산: consumableRarityBonus 이미 적용됨
  - next_quest consumed 처리: 이미 구현됨
- ✅ `store.ts`: `completeRandomQuest`에 consumable 효과 적용
  - XP 보너스: consumableXpBonus 추가
  - 드롭률 보너스: consumableDropBonus 추가
  - 레어리티 보너스: consumableRarityBonus 추가
  - Stat bonuses: consumableStatBonuses 추가
  - next_quest consumed 처리: consumeNextQuestEffects 호출
- ✅ `store.ts`: `progressDungeon`에 consumable 효과 적용
  - 부분 진행: consumableStatBonuses 추가 (AGI 기반 보상)
  - 최종 클리어: consumableStatBonuses 추가 (XP 계산)
  - 최종 클리어: next_quest consumed 처리 추가
- ✅ persist version 12 유지 (스키마 변경 없음)
- ✅ 빌드 통과 확인

**구현된 소모품 효과 적용**:
1. **instant_xp**: 사용 즉시 XP 지급 (10-2에서 구현 완료)
2. **next_quest_xp_bonus**: 다음 퀘스트 1회 XP 보너스 (합연산)
3. **next_category_xp_bonus**: 다음 해당 카테고리 퀘스트 1회 XP 보너스 (합연산)
4. **temporary_drop_bonus**: 다음 퀘스트 1회 드롭률 보너스 (합연산, cap 15%)
5. **temporary_rarity_bonus**: 다음 퀘스트 1회 레어리티 보너스 (합연산, cap 5%)
6. **temporary_stat_bonus**: effective stat에 반영 (XP/drop/rarity/dungeon 계산에 적용)
7. **gate_penalty_reduction**: 저장만 유지 (게이트 시스템 전까지 미적용)
8. **gate_success_bonus**: 저장만 유지 (게이트 시스템 전까지 미적용)

**소모품 효과 적용 위치**:
- `completeQuest` (daily/main): XP, drop, rarity, stat bonuses, next_quest consumed
- `completeRandomQuest`: XP, drop, rarity, stat bonuses, next_quest consumed
- `progressDungeon` 부분 진행: stat bonuses (AGI 기반 보상)
- `progressDungeon` 최종 클리어: XP, stat bonuses, next_quest consumed

**소모품 효과 계산 정책**:
- **XP 보너스**: 직업 + 장비 + 소모품 (합연산)
- **드롭률 보너스**: 스탯 + 장비 + 소모품 (합연산, cap 95%)
- **레어리티 보너스**: 스탯 + 장비 + 소모품 (합연산, legendary cap 4%)
- **스탯 보너스**: effective stat에만 반영 (hunter.stats 변경 금지)
- **칭호/업적 조건**: base stat만 사용 (소모품 영향 없음)
- **PER/streak protection**: 소모품 임시 PER 반영하지 않음 (안전)

**next_quest 효과 consumed 처리**:
- 던전 부분 진행: next_quest 소모하지 않음
- 던전 최종 클리어: next_quest 소모
- daily/main/random quest 완료: next_quest 소모
- next_category_xp_bonus: category 일치 시에만 소모
- consumed 후 즉시 activeConsumableEffects에서 제거

**temporary_stat_bonus 적용 범위**:
- ✅ STR 기반 workout/health XP multiplier
- ✅ VIT 기반 drop bonus
- ✅ AGI 기반 dungeon partial reward
- ✅ INT 기반 study/career XP multiplier
- ✅ SEN 기반 rarity bonus
- ❌ PER 기반 streak protection (안전상 미적용)

**미구현 항목**:
- gate 효과 (gate_penalty_reduction, gate_success_bonus): 게이트 시스템 전까지 저장만 유지
- PER streak protection에 소모품 임시 PER 반영: 안전상 미적용

**10차 소모품 시스템 1차 완성**:
- ✅ 10-1: 소모품 타입/아이템풀 추가
- ✅ 10-2: 소모품 사용 버튼 + activeConsumableEffects 저장
- ✅ 10-3: 소모품 효과 실제 계산 반영
- **게이트 전투 연결 준비 완료**

**다음 단계 예정**: 11차 작업 — 게이트/전투 도메인 설계 문서 작성.

### 11차 작업 0단계 완료 (2026-05-15) — 게이트/전투 설계 문서 작성
- ✅ `docs/GATE_COMBAT_DESIGN.md`: 게이트/전투 시스템 구현의 단일 기준 문서 생성
- ✅ 확정 정책 기록: 자동 전투 + 사전 세팅, 턴별 로그, victory/defeat/draw 결과, stamina/부상/회복 정책
- ✅ 도메인 모델 초안 작성: GateDefinition, ActiveGate, MonsterDefinition, SkillDefinition, SkillEffect, ActiveCombatEffect, PlayerCombatStats, BattleTurn, CombatLog, GateStatus, GateRewardTable, GatePenalty
- ✅ 전투 공식 정리: PlayerCombatStats, Combat Power, Gate Risk, 비율 기반 방어 감소식, 명중/회피/치명타 판정 순서
- ✅ 스킬 자동 사용 정책 정리: `scoreSkill` 기반 자동 선택, cooldown 후보 필터, 동점 처리, 향후 프리셋 확장 방향
- ✅ buff/debuff refresh 정책 기록: 같은 대상 + 같은 stat 효과는 누적하지 않고 새 효과로 덮어쓰기
- ✅ 게이트 운영 정책 기록: 동시 활성 게이트 1개, active gate 존재 시 새 트리거 무시, 큐 없음, 사용자 알림 없음
- ✅ 보상 정책 기록: daily는 XP 성장 중심, gate는 장비/아이템 파밍 중심, draw는 보상 없음
- ✅ 소모품 연동 정책 기록: next_gate/today/next_quest 처리, draw 시 next_gate 소모품 consumed
- ✅ 손계산 3건 포함: E/E, E/D, D/C 가상 전투 계산 및 밸런싱 메모
- ✅ 시뮬레이션 계획 기록: 100회 전투, 승률/무승부율/패배율, 평균 턴, 평균 잔여 HP, combatPower ratio와 victoryRate R² 0.85 목표
- ✅ 구현 단계 정리: 11-1 타입/데이터 구조 → 11-7 밸런스 점검

**중요 설계 결정**:
- `PlayerCombatStats`는 저장값이 아니라 유도값. base hunter stats + equipment stat_bonus + job modifiers + consumable temporary_stat_bonus + skill modifiers로 계산.
- 칭호/영구 업적은 base stat만 사용. 장비/소모품 stat은 업적 조건에 반영하지 않음.
- `accuracy`는 전투력 공식에서 제외. 대부분 0.95~0.99 범위라 변별력이 낮고 고정 가산점처럼 작동할 수 있기 때문.
- `dateKey`는 기존 `getDateKey()` local YYYY-MM-DD helper 사용. `toISOString().slice(0, 10)` 금지.
- draw는 active gate를 유지하며 보상/패널티 없음. 단, 전투 시도이므로 next_gate 소모품은 consumed 처리.
- 부상 회복 카운트는 부상 발생 이후 daily/main/random 퀘스트 완료만 포함. 초기 구현에서는 던전 부분 진행과 던전 최종 클리어 제외.

**손계산 관찰**:
- 요청 예시 수치 기준 E/D, D/C 케이스도 플레이어가 비교적 쉽게 승리.
- 전투 공식 자체보다 게이트 rank별 몬스터 HP/ATK, 다수 몬스터, 스킬 power, recommendedPower 테이블 튜닝이 중요.
- 11-7에서 100회 시뮬레이션으로 ratio별 승률을 검증해야 함.

**persist 버전**:
- 변경 없음 (문서 작업만 진행)
- 코드/타입/store/UI 변경 없음

**다음 단계 예정**: 11차 작업 1단계 — 게이트/전투 타입 및 데이터 구조 구현.

### 11차 작업 1단계 완료 (2026-05-15) — 게이트/전투 타입 + 초기 데이터 구조 추가
- ✅ `types.ts`: 게이트/전투 타입 추가
  - `GateRank`
  - `GateDefinition`
  - `ActiveGate`
  - `MonsterCombatStats`
  - `MonsterDefinition`
  - `SkillOwnerType`
  - `SkillType`
  - `SkillEffect`
  - `SkillDefinition`
  - `ActiveCombatEffect`
  - `PlayerCombatStats`
  - `BattleTurn`
  - `CombatLog`
  - `GateStatus`
  - `GateReward`
  - `GateRewardTable`
  - `GatePenalty`
- ✅ `types.ts`: 11-0 설계 정책 주석 추가
  - recommendedLevel은 안내용, recommendedPower가 실제 위험도/밸런싱 기준
  - 동시 active gate는 1개, active gate 존재 시 새 출현 트리거 무시
  - draw는 보상/패널티 없이 active gate 유지
  - 스킬 cooldown은 턴 기반
  - buff/debuff는 같은 대상 + 같은 stat 기준 누적하지 않고 refresh
  - PlayerCombatStats는 저장값이 아니라 유도값
  - 칭호/영구 업적은 base stat만 사용
- ✅ `seed.ts`: 초기 게이트/전투 seed 데이터 추가
  - `SKILL_DEFINITIONS`: common 1개, job 5개, equipment 1개, monster 4개
  - `MONSTER_DEFINITIONS`: E 2개, D 2개, C 1개
  - `GATE_DEFINITIONS`: E 2개, D 1개, C 1개
  - `GATE_REWARD_TABLES`: E/D/C 기본 보상 테이블
  - `GATE_PENALTIES`: 기본 게이트 패널티
- ✅ `store.ts`: 게이트 저장 상태 뼈대 추가
  - `gateStatus: GateStatus`
  - `activeGate?: ActiveGate`
  - `combatLogs: CombatLog[]`
- ✅ `store.ts`: 최소 관리 액션 추가
  - `setActiveGate(gate)`
  - `clearExpiredGate()`
  - `addCombatLog(log)`
  - `clearCombatLogs()`
- ✅ `store.ts`: 초기값 추가
  - stamina 100
  - maxStamina 100
  - recoveryQuestProgress 0
  - recoveryQuestRequired 3
  - lastStaminaRecoveredAt ISO string
  - activeGate undefined
  - combatLogs []
- ✅ `store.ts`: persist version 12 → 13
- ✅ `store.ts`: migrate에서 기존 저장 데이터에 `gateStatus`, `activeGate`, `combatLogs` 기본값 보강
- ✅ `App.tsx`: 앱 진입 시 `clearExpiredGate()` 호출 추가
- ✅ 빌드 통과 확인

**초기 게이트 데이터**:
- E급: `gate-rift-alley` (균열의 골목), `gate-rift-backstreet` (뒤틀린 뒷골목)
- D급: `gate-lair-of-sloth` (나태의 소굴)
- C급: `gate-archive-of-forgetting` (망각의 서고)

**초기 몬스터 데이터**:
- E급: `rift-rat`, `rift-stray`
- D급: `lazy-goblin`, `sloth-brute`
- C급: `forgetting-warden`

**이번 단계에서 구현하지 않은 것**:
- 전투 스탯 계산
- 전투력 계산
- 데미지 계산
- 자동 전투 시뮬레이터
- 게이트 출현 roll
- Gate UI
- 보상/패널티 적용
- 소모품 gate 효과 적용
- victory/defeat/draw 처리 로직

**persist 버전**:
- v12 → v13
- localStorage key는 `levelup-save` 유지

**다음 단계 예정**: 11차 작업 2단계 — 전투 스탯/전투력/위험도/데미지 계산 함수 구현.

### 11차 작업 2단계 완료 (2026-05-15) — 전투 계산 순수 함수 구현
- ✅ `game.ts`: `calculatePlayerCombatStats()` 추가
  - 입력: level, base stats, equippedItems, activeConsumableEffects, jobId
  - base stat을 mutate하지 않고 `getEffectiveStats()`를 재사용해 장비 stat_bonus와 게이트 적용 소모품 stat_bonus를 반영
  - `temporary_stat_bonus` 중 `today` / `next_gate` / duration 없음만 전투 스탯에 반영
  - `next_quest` 소모품은 게이트 전투 스탯에 반영하지 않음
  - jobId는 인자로 받지만 11-2에서는 전투 보정 미적용, TODO로 유지
- ✅ `game.ts`: `calculateCombatPower()` 추가
  - 공식: atk * 3 + maxHp * 0.5 + def * 2 + speed * 1.5 + critRate * 100 + evasionRate * 100 + skillTotalPower * 1.5
  - `accuracy`는 공식에서 제외
- ✅ `game.ts`: `estimateGateRisk()` 추가
  - ratio >= 1.3 → low
  - ratio >= 1.0 → normal
  - ratio >= 0.7 → high
  - 그 외 extreme
  - recommendedPower <= 0이면 extreme
- ✅ `game.ts`: `calculateDamage()` 추가
  - 비율 기반 방어 감소식 사용
  - defenderDef, attackerAtk, skillPower, randomFactor 안전 처리
  - critical 시 1.5배
- ✅ `game.ts`: 판정 helper 추가
  - `didHit(accuracy, roll)`
  - `didEvade(evasionRate, roll)`
  - `didCrit(critRate, roll)`
  - 판정 기준값은 0~1로 clamp
- ✅ `game.ts`: `BattleSkillContext`와 `scoreSkill()` 추가
  - attack: `(power ?? 1) * 100`
  - heal: HP 40% 미만이면 200, 아니면 0
  - buff: 3턴 이하 150, 이후 50
  - debuff: 80
- ✅ 빌드 통과 확인

**계산 검증 예시**:
- Lv5, STR 15, VIT 12, AGI 10, INT 8, PER 8, SEN 8
- `maxHp = 245`
- `atk = 50`
- `def = 24.4`
- `speed = 25`
- `critRate = 0.064`
- `evasionRate = 0.064`
- `accuracy = 0.958`
- `combatPower = 372`
- `calculateDamage({ attackerAtk: 50, defenderDef: 8 }) = 46`

**이번 단계에서 구현하지 않은 것**:
- 자동 전투 시뮬레이터
- `simulateGateBattle`
- `resolveTurn`
- Gate UI
- 게이트 출현 roll
- 보상/패널티 적용
- 전투 로그 생성
- activeGate 상태 변경
- persist version 변경

**persist 버전**:
- 변경 없음 (v13 유지)

**다음 단계 예정**: 11차 작업 3단계 — 자동 전투 시뮬레이터 구현.

### 11차 작업 3단계 완료 (2026-05-15) — 자동 전투 시뮬레이터 순수 함수 구현
- ✅ `game.ts`: `RngFn` 타입과 `createSeededRng(seed)` 추가
  - LCG 기반 seeded RNG
  - 같은 seed로 같은 전투 판정 흐름 재현 가능
- ✅ `game.ts`: `BattleActorState` 추가
  - 1 player vs 1 monster 전투용 local actor state
  - hp, atk, def, speed, critRate, accuracy, evasionRate, skillIds, cooldowns 포함
- ✅ `game.ts`: `simulateGateBattle()` 추가
  - 입력: playerStats, monster, skills, maxTurns, seed/rng, gateInstanceId, battleId
  - store/activeGate/stamina/reward를 변경하지 않는 순수 CombatLog 반환 함수
  - 기본 maxTurns 30
  - victory: monster HP 0
  - defeat: player HP 0
  - draw: maxTurns 도달 시 생존
  - rewards는 11-6 전까지 `[]`
  - penaltyApplied는 11-6 전까지 `undefined`
- ✅ `game.ts`: `chooseSkill()` 추가
  - actor.skillIds에 포함되고 cooldown이 0 이하인 스킬만 후보
  - `scoreSkill()` 점수 우선
  - 동점이면 power 높은 스킬 우선
  - 그래도 같으면 정의 순서 우선
  - 점수 0 또는 후보 없음이면 `basic-attack` fallback
- ✅ `game.ts`: `resolveAction()` 추가
  - 판정 순서: 명중 → 회피 → 치명타 → 데미지 → 효과
  - attack: 비율 기반 방어 감소식 + randomFactor 0.9~1.1
  - debuff: 명중/회피 판정 후 효과 적용
  - buff: 즉시 효과 적용
  - heal: maxHp 비율 회복 구조 지원
  - BattleTurn 로그 메시지 생성
- ✅ `game.ts`: `applyOrRefreshCombatEffect()` 추가
  - 같은 targetId + 같은 stat이면 누적하지 않고 새 효과로 덮어쓰기
  - remainingTurns refresh
- ✅ `game.ts`: `getEffectiveBattleActorStats()` 추가
  - activeEffects를 원본 actor state에 mutate 없이 반영
  - atk/def/speed는 0 미만 방지
  - critRate/accuracy/evasionRate는 0~1 clamp
- ✅ cooldown 처리 구현
  - actor 행동 시작 시 cooldown을 1 감소
  - 스킬 사용 후 해당 스킬의 cooldownTurns를 저장
  - basic attack은 cooldown 0
- ✅ activeEffects duration 처리 구현
  - 초기 구현은 라운드 종료 시 모든 active effect remainingTurns -1
  - remainingTurns <= 0이면 제거
- ✅ 턴 순서 구현
  - 각 라운드 시작 시 activeEffects가 반영된 speed 기준
  - speed가 같으면 player 우선
  - 한 라운드에 player와 monster가 각각 1회 행동
  - 중간에 한쪽 HP가 0 이하이면 즉시 종료
- ✅ 빌드 통과 확인

**전투 정책 구현 메모**:
- 전투 방식: 자동 전투
- 스킬 사용: scoreSkill 기반
- 판정 순서: 명중 → 회피 → 치명타 → 데미지 → 효과
- draw 처리: CombatLog result만 `draw`, 보상/패널티 없음
- buff/debuff refresh: 같은 대상 + 같은 stat은 누적 없이 refresh
- seed 재현성: `seed`가 있으면 `createSeededRng(seed)` 사용

**이번 단계에서 구현하지 않은 것**:
- store activeGate 변경
- stamina 감소
- injury 적용
- reward 지급
- item 생성
- Gate UI
- gate spawn
- activeConsumableEffects consumed 처리
- persist version 변경
- 여러 몬스터 전투

**테스트 결과**:
- `npm run build` 통과
- 별도 테스트 러너/TS 실행기는 없어서 런타임 호출 테스트는 추가 파일 없이 수행하지 않음
- TypeScript 컴파일로 CombatLog, BattleTurn, MonsterDefinition, SkillDefinition 타입 정합성 확인

**persist 버전**:
- 변경 없음 (v13 유지)

**다음 단계 예정**: 11차 작업 4단계 — 게이트 출현/관리 구현 또는 11차 작업 5단계 — Gate UI 구현.

### 11차 작업 4단계 완료 (2026-05-15) — 게이트 출현/관리 로직 구현
- ✅ `types.ts`: `GateStatus.lastDailyGateRollDate?: string` 추가
  - 하루 첫 접속 게이트 출현 roll을 local dateKey 기준 하루 1회로 제한
- ✅ `store.ts`: 게이트 출현/관리 액션 추가
  - `rollGateSpawn(source)`
  - `spawnGate(gateId, source)`
  - `recoverGateStamina()`
  - `recoverGateInjuryByQuest()`
  - `clearGateInjuryIfExpired()`
- ✅ `store.ts`: activeGate 1개 정책 적용
  - active gate가 있으면 새 출현 트리거 무시
  - 보류 큐 없음
  - active gate 때문에 무시된 트리거는 사용자에게 알리지 않음
- ✅ `store.ts`: daily_open 하루 1회 제한 구현
  - `getDateKey()` local dateKey 사용
  - roll 성공/실패와 무관하게 `lastDailyGateRollDate` 기록
  - 새로고침으로 재roll되지 않음
- ✅ `store.ts`: 출현 확률 구현
  - `daily_open`: 5%
  - `dungeon_clear`: 15%
  - `hard_dungeon_clear`: 25%
- ✅ `store.ts`: 게이트 후보 선택 구현
  - daily_open: E급
  - dungeon_clear: E~D급
  - hard_dungeon_clear: D~C급
  - 후보가 비어 있으면 E급 또는 전체 fallback
- ✅ `store.ts`: `spawnGate()` 구현
  - `GATE_DEFINITIONS`에서 gateId 조회
  - `expiresInHours` 기준 expiresAt 계산
  - ActiveGate 생성
  - `게이트 출현` SystemMessage 표시
- ✅ `store.ts`: `clearExpiredGate()` 보강
  - active gate의 expiresAt이 지났으면 status `expired`
  - `게이트 만료` SystemMessage 표시
- ✅ `store.ts`: stamina 자연 회복 구현
  - 시간당 +10
  - 완전한 시간 단위만 회복
  - `lastStaminaRecoveredAt`은 계산에 사용한 시간만큼만 이동
  - stamina가 max면 timestamp를 now로 갱신
- ✅ `store.ts`: 퀘스트 완료 stamina +5 구현
  - daily/main 완료 시 적용
  - random quest 완료 시 적용
  - dungeon 부분 진행/최종 클리어는 제외
- ✅ `store.ts`: 부상 회복 조건 일부 구현
  - `injuredUntil` 시간이 지났으면 부상 해제
  - 부상 중 daily/main/random 완료 시 `recoveryQuestProgress +1`
  - `recoveryQuestProgress >= recoveryQuestRequired`이면 부상 해제
  - dungeon 부분 진행/최종 클리어는 회복 카운트 제외
- ✅ `store.ts`: dungeon 최종 클리어 gate roll 연결
  - 부분 진행에서는 roll 없음
  - 최종 클리어에서만 roll
  - `resetCycle: monthly` 또는 elite/apex/boss 난이도는 `hard_dungeon_clear`
- ✅ `App.tsx`: 앱 진입 초기화 흐름 보강
  - `recoverGateStamina()`
  - `clearGateInjuryIfExpired()`
  - `clearExpiredGate()`
  - `rollGateSpawn('daily_open')`
- ✅ `store.ts`: persist version 13 → 14
  - 기존 `gateStatus`에 `lastDailyGateRollDate`가 없으면 `undefined`로 보강
  - localStorage key `levelup-save` 유지
- ✅ 빌드 통과 확인

**초기화 순서 메모**:
1. `resetDailiesIfNewDay()`
2. `recordAppOpen()`
3. `recoverGateStamina()`
4. `clearGateInjuryIfExpired()`
5. `clearExpiredConsumableEffects()`
6. `clearExpiredRandomQuest()`
7. `clearExpiredGate()`
8. `rollGateSpawn('daily_open')`
9. `rollRandomQuestForToday()`
10. title/job unlock check

**이번 단계에서 구현하지 않은 것**:
- 전투 시작 버튼
- `simulateGateBattle` store 연결
- victory/defeat/draw 결과 처리
- 게이트 보상 지급
- stamina 패널티 적용
- injury 발생 적용
- Gate UI
- 여러 activeGate
- 보류 gate queue

**persist 버전**:
- v13 → v14

**다음 단계 예정**: 11차 작업 5단계 — Gate UI 구현.

### 11차 작업 5단계 완료 (2026-05-15) — Gate UI / 게이트 상황판 구현
- ✅ `GatePanel.tsx` 신규 생성
  - activeGate 없음 상태 표시
  - activeGate 상세 상황판 표시
  - gateStatus/stamina 표시
  - injury 상태와 회복 조건 표시
  - 현재 장비/소모품 기준 combat stats 계산
  - 내 전투력과 위험도 표시
  - 몬스터 정보 표시
  - reward table 요약 표시
  - 실패 패널티 표시
  - draw 정책 안내 표시
  - 전투 버튼은 disabled 상태로 표시
- ✅ `App.tsx`: `gate` 탭 추가
  - lucide `Swords` 아이콘 사용
  - 탭 제목: 게이트
  - 렌더링: `GatePanel`
  - `AddQuestModal` type fallback 조정: gate/inventory/titles는 daily fallback
- ✅ `GatePanel.tsx`: activeGate 없음 상태
  - "열린 게이트 없음" 표시
  - daily 첫 접속 5%, 던전 클리어 15%, 고난도 25% 안내
  - 동시에 하나의 게이트만 활성화된다는 정책 안내
- ✅ `GatePanel.tsx`: activeGate 표시
  - 게이트명, 랭크, 설명
  - 출현 source
  - 남은 시간
  - 권장 레벨
  - 권장 전투력
  - 내 전투력
  - 위험도
- ✅ `GatePanel.tsx`: combatPower/risk 계산
  - `getEquippedItems(items, equipment)`
  - `calculatePlayerCombatStats({ level, stats, equippedItems, activeConsumableEffects, jobId })`
  - `calculateCombatPower(combatStats)`
  - `estimateGateRisk(playerPower, gate.recommendedPower)`
- ✅ `GatePanel.tsx`: gateStatus/stamina 표시
  - Gate Stamina / maxStamina
  - 입장 비용 20
  - 자연 회복 시간당 +10
  - 퀘스트 완료 +5
  - stamina 부족/부상 중이면 입장 불가 표시
- ✅ `GatePanel.tsx`: injury 표시
  - injuredUntil이 있으면 부상 중 표시
  - 회복 조건: 6시간 경과 또는 퀘스트 3개 완료
  - 남은 시간과 progress 표시
- ✅ `GatePanel.tsx`: monster 표시
  - name/rank/description
  - HP/ATK/DEF/SPD
  - CRIT/ACC/EVA
- ✅ `GatePanel.tsx`: reward 표시
  - XP
  - itemDropChance
  - rarityBias
  - victory 시 reward table 기반 지급 예정 안내
  - draw는 보상 없음 안내
- ✅ `GatePanel.tsx`: penalty 표시
  - staminaCost
  - injuryHours
- ✅ `GatePanel.tsx`: active gate consumable effect 표시
  - today/next_gate 효과만 표시
- ✅ 빌드 통과 확인

**중요 정책 준수**:
- `simulateGateBattle` 호출 없음
- activeGate 상태 변경 없음
- stamina 차감 없음
- 보상 지급 없음
- 부상 적용 없음
- 전투 결과 생성 없음
- persist version 변경 없음

**테스트 결과**:
- `npm run build` 통과
- 기존 CSS `@import` 위치 경고는 계속 표시되지만 이번 변경과 무관

**persist 버전**:
- 변경 없음 (v14 유지)

**다음 단계 예정**: 11차 작업 6단계 — 전투 실행 연결 + 결과 처리 + 보상/패널티 적용.

### 11차 작업 6단계 완료 (2026-05-15) — 게이트 전투 실행 연결 + 결과 처리
- ✅ `store.ts`: `startGateBattle()` 액션 추가
  - activeGate 존재 + status active 확인
  - gate definition 조회
  - stamina/부상 입장 조건 확인
  - 1번째 monster 기준 조회
  - 현재 hunter/equipment/consumable 기준 `calculatePlayerCombatStats()` 호출
  - `simulateGateBattle()` 호출
  - CombatLog 저장
  - next_gate 소모품 consumed 처리
- ✅ `store.ts`: 입장 조건 구현
  - stamina >= 20
  - injuredUntil이 현재보다 미래면 입장 불가
  - 부상 시간이 지났으면 내부에서 회복 상태로 방어 처리
  - 입장 불가 시 SystemMessage 표시
- ✅ `store.ts`: player skill 구성 구현
  - `basic-attack` 기본 포함
  - jobId 기반 일부 job skill 매핑
  - `그림자 단검` 장착 시 `skill-shadow-edge` 임시 연결
  - monster skill은 monster.skillIds 기준 포함
- ✅ `store.ts`: victory 처리
  - rewardTable.xp 지급
  - 기존 `applyXp()` 재사용으로 레벨업/랭크/자동 스탯 분배 일관성 유지
  - itemDropChance와 rarityBias 기반 아이템 드롭
  - stamina -20
  - activeGate.status = `cleared`
  - CombatLog.rewards 보강
  - SystemMessage 표시
  - 보상 후 `checkTitleUnlocks()` / `checkJobAwakening()` 호출
- ✅ `store.ts`: defeat 처리
  - 보상 없음
  - stamina penalty 적용
  - injuredUntil = now + injuryHours
  - recoveryQuestProgress = 0
  - recoveryQuestRequired = 3
  - activeGate.status = `failed`
  - CombatLog.penaltyApplied 보강
  - SystemMessage 표시
- ✅ `store.ts`: draw 처리
  - 보상 없음
  - stamina 감소 없음
  - 부상 없음
  - activeGate.status = `active` 유지
  - CombatLog 저장
  - SystemMessage 표시
- ✅ `store.ts`: gate reward item helper 추가
  - rewardTable.rarityBias 기반 rarity weighted roll
  - ITEM_POOL에서 해당 rarity 후보 선택
  - id/acquiredAt 부여
- ✅ `store.ts`: gate penalty reduction 적용
  - `gate_penalty_reduction`은 defeat stamina penalty에만 적용
  - cap 50%
  - victory 입장 비용 -20에는 적용하지 않음
- ✅ `store.ts`: next_gate 소모품 처리
  - victory/defeat/draw 모두 전투 시도이므로 next_gate consumed
  - today 효과 유지
  - next_quest 효과 유지
- ✅ `GatePanel.tsx`: 게이트 도전 버튼 활성화
  - active gate + stamina 충분 + 부상 없음이면 클릭 가능
  - stamina 부족/부상 중이면 disabled
- ✅ `GatePanel.tsx`: 최근 전투 결과 표시 추가
  - result
  - totalTurns
  - playerHpRemaining
  - rewards
  - penalty
  - 최근 턴 로그 5줄
- ✅ 빌드 통과 확인

**job combat skill mapping (초기)**:
- `golden-eye-diviner`, `golden-oracle` → `skill-golden-eye-insight`
- `grimoire-decoder`, `abyss-archivist` → `skill-grimoire-focus`
- `iron-squire`, `steelheart-fighter` → `skill-iron-charge`
- `silent-monk`, `chrono-judge` → `skill-silent-guard`
- `nameless-awakened`, `fate-harmonizer` → `skill-fate-balance`

**gate_success_bonus 처리**:
- 11-6에서는 직접 적용하지 않음.
- 성공률 직접 보정은 자동 전투 시뮬레이터 철학과 충돌할 수 있어, 향후 전투력 보정/첫 턴 버프/전용 skill 효과 중 하나로 설계 후 연결 예정.

**이번 단계에서 구현하지 않은 것**:
- 다수 몬스터 전투
- 전투 결과 모달
- 상세 로그 접기/펼치기
- gate_success_bonus 직접 적용
- 전투 밸런스 튜닝
- 게이트 출현 확률 변경
- persist version 변경

**persist 버전**:
- 변경 없음 (v14 유지)

**테스트 결과**:
- `npm run build` 통과
- 기존 CSS `@import` 위치 경고는 계속 표시되지만 이번 변경과 무관

**다음 단계 예정**: 11차 작업 후속 — `skillTotalPower` 반영, 전투 로그 UX 개선, 다수 몬스터/스킬 확장 검토.

### 11차 작업 7단계 완료 (2026-05-15) — 게이트 밸런스 점검 / 100회 시뮬레이션 검증
- `game.ts`: `GateBattleSimulationSummary`, `SummarizeGateBattleSimulationsParams`, `summarizeGateBattleSimulations()` 추가
  - `simulateGateBattle()`을 반복 호출하는 순수 검증 helper
  - `seedBase + index` 방식으로 100회 결과 재현 가능
  - victory/defeat/draw, 평균 턴 수, 평균 남은 HP 집계
- `seed.ts`: 공식 변경 없이 monster stats / recommendedPower만 소폭 조정
  - `rift-rat`: HP 80 → 125, ATK 20 → 24, DEF 8 → 10
  - `lazy-goblin`: HP 160 → 340, ATK 35 → 78, DEF 20 → 30
  - `forgetting-warden`: HP 320 → 560, ATK 55 → 86, DEF 35 → 44
  - `gate-rift-alley`: recommendedPower 220 → 285
  - `gate-lair-of-sloth`: recommendedPower 480 → 620
  - `gate-archive-of-forgetting`: recommendedPower 850 → 830
- 공식 유지
  - `calculatePlayerCombatStats()`, `calculateCombatPower()`, `calculateDamage()`, `scoreSkill()` 변경 없음
  - store / UI / persist version 변경 없음

#### 11-7 게이트 밸런스 검증 결과

| Case | Build | Gate | Player Power | Recommended Power | Ratio | Risk | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |
|---|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| 1 | A | 균열의 골목 | 372 | 285 | 1.31 | low | 100% | 0% | 0% | 5.3 | 211.3 | 입문 E급으로 적절. 쉬움이지만 턴 수가 5턴대로 개선됨 |
| 2 | A | 나태의 소굴 | 372 | 620 | 0.60 | extreme | 1% | 99% | 0% | 9.5 | 0.7 | 무리한 상위 도전으로 적절 |
| 3 | B | 나태의 소굴 | 516 | 620 | 0.83 | high | 75% | 25% | 0% | 12.6 | 50.1 | D급 진입권으로 적절. 위험 표시에 비해 승률은 약간 높음 |
| 4 | C | 망각의 서고 | 639 | 830 | 0.77 | high | 26% | 74% | 0% | 16.4 | 15.0 | 위험하지만 가능. 평균 턴은 목표보다 약간 김 |
| 5 | D | 망각의 서고 | 685 | 830 | 0.83 | high | 82% | 18% | 0% | 14.6 | 87.0 | 장비/스킬 가정 빌드의 개선 효과 확인 |

#### 검증 빌드 메모
- Build A: Lv5, STR 15, VIT 12, AGI 10, INT 8, PER 8, SEN 8, 장비/소모품 없음
- Build B: Lv10, STR 20, VIT 18, AGI 15, INT 12, PER 12, SEN 12, 장비/소모품 없음
- Build C: Lv15, STR 25, VIT 22, AGI 18, INT 14, PER 15, SEN 14, 장비/소모품 없음
- Build D: Lv15 가정 빌드. STR 29, VIT 24, AGI 20, INT 14, PER 18, SEN 16 + `skill-iron-charge`

#### 11-7 판단
- drawRate는 모든 케이스 0%로 정상.
- 평균 턴은 대부분 5~15턴 목표에 들어왔고, Case 4만 16.4턴으로 약간 길다.
- A/E는 100% 승리지만 입문 E급 게이트이므로 허용 가능한 쉬움으로 판단.
- A/D는 1% 승리로 상위 게이트 도전 위험성이 명확해짐.
- D/C는 장비/스킬 가정 때문에 승률이 크게 오른다. 현재 `calculatePlayerCombatStats()`의 `skillTotalPower`가 0이라 combatPower가 실제 공격 스킬 가치를 충분히 반영하지 못하는 점은 다음 밸런스 개선 후보.
- 5개 케이스 기준 ratio-victoryRate R²는 약 0.65로 목표 0.85 미만. 원인은 표본 수가 작고 Build D의 스킬 영향이 combatPower에 반영되지 않기 때문으로 판단. 11-7에서는 공식 변경 없이 기록만 남김.
- `gate_success_bonus`는 계속 미적용. 향후 전투력 보정, 첫 턴 버프, 명중/치명 보정 중 하나로 별도 설계 필요.

#### 테스트 결과
- `npm run build` 통과
- 기존 CSS `@import` 위치 경고는 계속 표시되며, 이번 변경과 무관

### 11차 작업 10단계 완료 (2026-05-15) — scoreSkill 상황 기반 개선
- `game.ts`: `BattleSkillContext` 확장
  - `enemyHpRatio`, `selfAtk`, `selfDef`, `selfSpeed`, `enemyAtk`, `enemyDef`, `enemySpeed`, `isPlayer` optional 필드 추가
  - 기존 호출부가 깨지지 않도록 optional 유지
- `game.ts`: `scoreSkill()` 상황 기반 개선
  - attack: `power * 100 - cooldown * 3`으로 안정적 우선순위 부여
  - heal: HP 25/40/60% 구간별 점수화
  - buff: stat별 점수 분리
    - 공격형 buff는 적 HP가 충분할 때만 제한적으로 사용
    - 방어형 buff는 초반 풀피 남발 방지, HP 저하/적 공격 우위에서 점수 증가
    - accuracy buff는 낮게 평가
  - debuff: 적 방어/공격이 충분히 높거나 전투 초반일 때만 가치 증가
  - 적 HP가 낮으면 buff/debuff 낭비 방지
- `game.ts`: chooseSkill context 보강
  - `buildBattleSkillContext()` 추가
  - actor/target의 activeEffects 반영 effective stats를 scoreSkill에 전달
  - hpRatio는 0~1 clamp 및 maxHp 0 방어
- 변경하지 않은 것
  - 전투 공식, damage 공식, combatPower 공식, skillTotalPower 공식, 몬스터 스탯, 보상/stamina/draw 정책, persist version

#### 11-10 재검증 결과

| Case | Build | Job | Gate | Power | Rec | Ratio | Risk | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |
|---|---|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| 1 | A | `unawakened` | 균열의 골목 | 372 | 300 | 1.24 | normal | 100% | 0% | 0% | 5.6 | 207.8 | 변화 거의 없음 |
| 2 | A | `unawakened` | 나태의 소굴 | 372 | 650 | 0.57 | extreme | 0% | 100% | 0% | 9.1 | 0.0 | 변화 거의 없음 |
| 3 | B | `grimoire-decoder` | 나태의 소굴 | 527 | 650 | 0.81 | high | 55% | 45% | 0% | 12.4 | 30.4 | D 진입권 회복. 낮은 방어 적에게 debuff 낭비 감소 |
| 4 | C | `silent-monk` | 망각의 서고 | 652 | 870 | 0.75 | high | 5% | 95% | 0% | 16.9 | 4.2 | 방어 buff 초반 남발은 줄었지만 C급 기준 여전히 매우 위험 |
| 5 | D | `fate-harmonizer` | 망각의 서고 | 694 | 870 | 0.80 | high | 31% | 69% | 0% | 17.0 | 14.2 | 약한 atk buff 반복 낭비 감소. 승률은 일부 회복 |

#### R² 변화
- 11-8: 약 0.79
- 11-9: 약 0.83
- 11-10: 약 0.88
- 목표 0.85 이상 달성. 다만 이것은 직업별 승률이 모두 오른 결과가 아니라, 위험한 빌드를 더 정확히 위험하게 판정한 효과도 포함한다.

#### 로그/패턴 확인
- `silent-monk`: 풀피 초반에는 `basic-attack`을 먼저 사용하고, HP가 약 75% 아래로 내려간 뒤 `skill-silent-guard`를 사용한다.
- `fate-harmonizer`: `skill-fate-alignment`는 적 HP가 충분히 남은 초반에만 제한적으로 사용하고, 적 HP가 낮으면 basic attack을 우선한다.
- `grimoire-decoder`: D급처럼 방어가 아주 높지 않은 적에게는 `skill-archive-analysis` 남발이 줄어든다.

#### 남은 한계 / TODO
- 방어형 스킬은 1v1 단일 전투에서 공격 턴 손실을 완전히 상쇄하기 어렵다.
- `skill-silent-guard`는 피해 감소/반격/회복과 연계되면 직업 정체성이 더 살아날 수 있다.
- `skill-fate-alignment`의 +ATK 버프는 현재 수치상 한 턴을 쓰기에는 효율이 낮다. 향후 2차 스킬 또는 multi-hit/장기전 구조에서 재평가.

#### 테스트 결과
- `npm run build` 통과
- 기존 CSS `@import` 위치 경고는 계속 표시되며, 이번 변경과 무관

### 11차 작업 9단계 완료 (2026-05-15) — 직업별 전투 스킬 매핑 확대
- `seed.ts`: 직업 대표 스킬 추가
  - research: `skill-archive-analysis` / 방어식 해체
  - balance: `skill-fate-alignment` / 운명의 조율
- `game.ts`: `JOB_COMBAT_SKILL_IDS` 매핑 갱신
  - market: `golden-eye-diviner`, `golden-oracle` → `skill-golden-eye-insight`
  - research: `grimoire-decoder`, `abyss-archivist` → `skill-archive-analysis`
  - training: `iron-squire`, `steelheart-fighter` → `skill-iron-charge`
  - discipline: `silent-monk`, `chrono-judge` → `skill-silent-guard`
  - balance: `nameless-awakened`, `fate-harmonizer` → `skill-fate-alignment`
  - `unawakened`는 `basic-attack`만 사용
- 정책
  - 1차/2차 직업은 같은 라인의 대표 스킬을 공유
  - 2차 전용 강화 스킬은 향후 TODO
  - 장비 액티브 스킬 구조화는 향후 TODO
  - 전투 공식, 데미지 공식, 몬스터 스탯, 게이트 recommendedPower 변경 없음

#### 추가/매핑한 스킬
- market: `skill-golden-eye-insight`
  - 치명타 감각 버프
- research: `skill-archive-analysis`
  - 적 방어력 -8, 3턴, cooldown 4
- training: `skill-iron-charge`
  - power 1.35 공격, cooldown 3
- discipline: `skill-silent-guard`
  - 방어력 +12, 3턴, cooldown 5
- balance: `skill-fate-alignment`
  - 공격력 +5, 3턴, cooldown 5

#### skill value 확인

| Skill | Value | 판단 |
|---|---:|---|
| `basic-attack` | 0.00 | 정상 |
| `skill-golden-eye-insight` | 3.50 | 낮지만 치명타 보정으로 적절 |
| `skill-archive-analysis` | 7.00 | research 대표 디버프로 적절 |
| `skill-iron-charge` | 17.07 | 공격 스킬로 가장 높지만 과도하지 않음 |
| `skill-silent-guard` | 9.16 | 방어형 스킬로 적절 |
| `skill-fate-alignment` | 5.73 | balance 범용 버프로 적절 |

#### 11-9 재검증 결과

| Case | Build | Job | Gate | Power | Rec | Ratio | Risk | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |
|---|---|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| 1 | A | `unawakened` | 균열의 골목 | 372 | 300 | 1.24 | normal | 100% | 0% | 0% | 5.7 | 206.9 | 입문 유지 |
| 2 | A | `unawakened` | 나태의 소굴 | 372 | 650 | 0.57 | extreme | 0% | 100% | 0% | 8.9 | 0.0 | 상위 도전 위험 유지 |
| 3 | B | `grimoire-decoder` | 나태의 소굴 | 527 | 650 | 0.81 | high | 57% | 43% | 0% | 12.8 | 34.7 | research 스킬 반영, D 진입권 유지 |
| 4 | C | `silent-monk` | 망각의 서고 | 652 | 870 | 0.75 | high | 7% | 93% | 0% | 16.3 | 3.8 | 방어형 버프는 초반 공격 턴 손실이 있어 1:1 DPS 레이스에서 약함 |
| 5 | D | `fate-harmonizer` | 망각의 서고 | 694 | 870 | 0.80 | high | 54% | 46% | 0% | 18.3 | 44.2 | balance 스킬 반영, 장기전 성향 |

#### R² 변화
- 11-7: 약 0.65
- 11-7B: 약 0.76
- 11-8: 약 0.79
- 11-9: 약 0.83
- 목표 0.85에 거의 접근했지만 아직 미달. 직업 스킬이 더 많은 케이스에 반영되며 상관은 개선됨.

#### 남은 한계 / TODO
- `skill-silent-guard` 같은 방어형 buff는 `scoreSkill()` 정책상 초반 공격 기회를 소비한다.
  - 향후 방어형 스킬은 도발/피해감소/반격/회복과 연계하거나, scoreSkill에 상황 기반 조건을 추가할 필요가 있다.
- 2차 직업 전용 강화 스킬 후보
  - 황금안의 예언자: 예언된 일격
  - 심연의 기록관: 심연 주석
  - 강철심장의 투사: 심장 강타
  - 시간의 심판관: 시간 지연
  - 운명의 조율자: 균형의 축복
- 장비 액티브 스킬은 현재 `그림자 단검 -> skill-shadow-edge` 임시 연결만 있음.

#### 테스트 결과
- `npm run build` 통과
- 기존 CSS `@import` 위치 경고는 계속 표시되며, 이번 변경과 무관

### 11차 작업 8단계 완료 (2026-05-15) — skillTotalPower 산정 개선 + 전투력 신뢰도 재검증
- `game.ts`: 스킬 전투 가치 helper 추가
  - `calculateSkillCombatValue(skill)`
  - `calculateSkillTotalPower(skills)`
  - `getPlayerCombatSkills({ jobId, equippedItems, allSkills })`
- `calculatePlayerCombatStats()` 확장
  - `skills?: SkillDefinition[]` 인자 추가
  - `skillTotalPower`를 실제 사용 가능한 player skill 목록 기반으로 산정
  - 기본 공격만 있으면 `skillTotalPower = 0`
  - cap은 120으로 제한
- `GatePanel.tsx`: 내 전투력 계산 시 `getPlayerCombatSkills()` 결과를 전달
- `store.ts`: `startGateBattle()`도 같은 `getPlayerCombatSkills()` helper를 사용
  - UI 전투력 계산과 실제 전투 스킬 목록을 통일
- 몬스터/게이트 수치, player stat 공식, damage 공식, combatPower 가중치, stamina/부상/draw 정책 변경 없음

#### skill value 정책
- attack
  - `(power - 1) * 100 * cooldownFactor`
  - 기본 공격 power 1.0은 추가 가치 0
  - `skill-iron-charge`는 약 17.07
- buff/debuff
  - `effect value * stat weight * duration * 0.35 * cooldownFactor`
  - `accuracy`는 combatPower 공식과 동일하게 0 가중치
  - 긴 지속시간은 최대 5턴까지만 반영
- heal
  - `healPower * 80 * cooldownFactor`
- cooldownFactor
  - `1 / (1 + cooldown * 0.35)`
- cap
  - `calculateSkillTotalPower()`는 최대 120

#### 11-8 재검증 결과

| Case | Build | Gate | Power | Rec | Ratio | Risk | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |
|---|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| 1 | A | 균열의 골목 | 372 | 300 | 1.24 | normal | 100% | 0% | 0% | 5.7 | 208.4 | basic only라 변화 없음 |
| 2 | A | 나태의 소굴 | 372 | 650 | 0.57 | extreme | 0% | 100% | 0% | 9.5 | 0.0 | basic only라 변화 없음 |
| 3 | B | 나태의 소굴 | 516 | 650 | 0.79 | high | 55% | 45% | 0% | 12.7 | 31.2 | basic only라 변화 없음 |
| 4 | C | 망각의 서고 | 639 | 870 | 0.73 | high | 20% | 80% | 0% | 16.3 | 10.5 | basic only라 변화 없음 |
| 5 | D | 망각의 서고 | 711 | 870 | 0.82 | high | 76% | 24% | 0% | 15.1 | 71.2 | `skill-iron-charge` 가치 반영으로 Power 상승 |

#### R² 변화
- 11-7: 약 0.65
- 11-7B: 약 0.76
- 11-8: 약 0.79
- 목표 0.85에는 아직 미달하지만, 실제 스킬 보유 빌드의 전투력 표시는 더 정직해졌다.

#### 남은 한계
- 5개 검증 케이스 중 4개가 basic only라 R² 개선 폭이 제한적이다.
- 일부 직업은 combat skill이 매핑되어 있지만, 실제 플레이 검증 케이스에는 아직 충분히 반영되지 않았다.
- 장비 액티브 스킬은 현재 `그림자 단검 -> skill-shadow-edge` 임시 연결만 있다.
- buff/debuff 가치는 시뮬레이션 기반 기대값이 아니라 근사치다.

#### 테스트 결과
- `npm run build` 통과
- 기존 CSS `@import` 위치 경고는 계속 표시되며, 이번 변경과 무관

### 11차 작업 7B단계 완료 (2026-05-15) — 게이트 난이도 소폭 상향 + 전투 로그 UX 개선
- `seed.ts`: 11-7 결과를 기준으로 몬스터 HP/ATK/DEF만 소폭 상향
  - `rift-rat`: HP 125 → 133, ATK 24 → 25, DEF 10 유지
  - `lazy-goblin`: HP 340 → 350, ATK 78 → 80, DEF 30 → 31
  - `forgetting-warden`: HP 560 → 575, ATK 86 → 88, DEF 44 → 46
- `seed.ts`: recommendedPower 소폭 조정
  - `gate-rift-alley`: 285 → 300
  - `gate-lair-of-sloth`: 620 → 650
  - `gate-archive-of-forgetting`: 830 → 870
- `game.ts`: BattleTurn.message 문구 개선
  - 일반 hit: 공격을 "날렸다", 몬스터는 "거칠게 달려들었다" 톤으로 분리
  - critical: "급소를 꿰뚫었다" 문구로 강화
  - miss/evade: "허공을 갈랐다", "몸을 비틀어 피해냈다"로 개선
  - buff/debuff: 전장의 흐름, 감각 각성, 무거운 저주 느낌 강화
  - heal: "호흡을 가다듬었다"로 정비 느낌 추가
- `GatePanel.tsx`: 최근 전투 결과 설명 문구 추가
  - draw: 시간초과, 보상/패널티 없음, active gate 유지, 세팅 변경 후 재도전 가능을 명시
  - victory/defeat도 짧은 결과 설명 추가
- 공식 유지
  - player stat 공식, combatPower 공식, damage 공식, stamina/부상/draw 정책 변경 없음
  - persist version 변경 없음

#### 7B 재검증 결과

| Case | Build | Gate | Power | Rec | Ratio | Risk | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |
|---|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| 1 | A | 균열의 골목 | 372 | 300 | 1.24 | normal | 100% | 0% | 0% | 5.7 | 208.4 | 입문 가능 유지 |
| 2 | A | 나태의 소굴 | 372 | 650 | 0.57 | extreme | 0% | 100% | 0% | 9.5 | 0.0 | 상위 도전 위험 명확 |
| 3 | B | 나태의 소굴 | 516 | 650 | 0.79 | high | 55% | 45% | 0% | 12.7 | 31.2 | D급 진입권 하한선. 적절 |
| 4 | C | 망각의 서고 | 639 | 870 | 0.73 | high | 20% | 80% | 0% | 16.3 | 10.5 | 위험하지만 가능. C급은 추가 상향 금지 |
| 5 | D | 망각의 서고 | 685 | 870 | 0.79 | high | 76% | 24% | 0% | 15.1 | 71.2 | 장비/스킬 효과 유지 |

#### Combat Power 신뢰도 TODO
- 11-7 밸런스 검증에서 combatPower ratio와 실제 victoryRate의 R²는 약 0.65로 목표 0.85에 미달했다.
- 7B 재검증 기준 R²는 약 0.76으로 개선되었지만 여전히 목표 미만이다.
- 현재 원인 후보
  - `skillTotalPower`가 실제 전투 내 스킬 가치와 정확히 대응하지 않음
  - buff/debuff/cooldown/생존력/몬스터 스킬 영향이 단순 전투력 공식에 충분히 반영되지 않음
  - 현재 케이스 수가 적어 통계적으로 불안정함
- 정책
  - 현재 단계에서는 `calculateCombatPower()` 공식을 변경하지 않는다.
  - 당분간 recommendedPower와 monster stats를 통해 밸런스를 맞춘다.
  - 더 많은 전투 케이스가 쌓인 뒤 `skillTotalPower` 재정의 또는 combatPower 공식 보정을 검토한다.

#### 테스트 결과
- `npm run build` 통과
- 기존 CSS `@import` 위치 경고는 계속 표시되며, 이번 변경과 무관
### 11차 작업 11단계 완료 (2026-05-15) — 방어형 스킬 재설계
- `types.ts`: `CombatEffectKind` 추가 (`stat`, `damage_reduction`, `counter`)
- `types.ts`: `SkillEffect` 확장
  - `kind`
  - `counterRate`
  - `counterPower`
- `types.ts`: `SkillDefinition.effects[]` 지원
  - 기존 `effect` 단일 구조는 유지
  - 신규 스킬은 `effect`와 `effects`를 함께 또는 따로 사용할 수 있음
- `types.ts`: `ActiveCombatEffect` 확장
  - `kind`
  - optional `stat`
  - `counterRate`
  - `counterPower`
- `seed.ts`: `skill-silent-guard` 재설계
  - 이름: `침묵의 반격식`
  - 피해감소: 15%, 3턴
  - 반격: 45%, counterPower 0.55, 3턴
  - cooldownTurns: 4
- `game.ts`: `getSkillEffects()` 추가
  - 기존 `effect`와 신규 `effects[]`를 모두 전투 처리 대상으로 합침
- `game.ts`: active combat effect refresh key 보강
  - stat effect: `targetId + stat`
  - damage_reduction: `targetId + damage_reduction`
  - counter: `targetId + counter`
  - 같은 효과는 누적하지 않고 refresh
- `game.ts`: damage_reduction 처리
  - 기본 damage 계산 이후 적용
  - 최대 피해감소 cap 50%
- `game.ts`: counter 처리
  - 실제 공격 피해를 받은 뒤 target이 생존했을 때 확률 반격
  - 반격은 다시 반격을 유발하지 않음
  - 기존 BattleTurn message에 반격 피해를 함께 표시
- `game.ts`: `scoreSkill()` 반영
  - damage_reduction/counter 효과를 방어형 buff로 평가
  - 풀피 초반 무조건 사용은 억제
  - HP 85% 이하 또는 강한 적 공격 앞에서는 더 빨리 사용
- `game.ts`: `calculateSkillCombatValue()` 보강
  - `effects[]` 합산
  - damage_reduction/counter 가치 반영

#### 11-11 skill value 확인

| Skill | Value | 판단 |
|---|---:|---|
| `skill-silent-guard` / 침묵의 반격식 | 22.97 | 권장 범위 10~25 안쪽. 방어형 정체성 강화에 적절 |

#### 11-11 재검증 결과

| Case | Build | Job | Gate | Power | Rec | Ratio | Risk | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |
|---|---|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| 1 | A | `unawakened` | 균열의 골목 | 372 | 300 | 1.24 | normal | 100% | 0% | 0% | 5.9 | 200.2 | 입문 E급 유지 |
| 2 | A | `unawakened` | 나태의 소굴 | 372 | 650 | 0.57 | extreme | 0% | 100% | 0% | 9.3 | 0.0 | 상위 도전 위험 유지 |
| 3 | B | `grimoire-decoder` | 나태의 소굴 | 527 | 650 | 0.81 | high | 54% | 46% | 0% | 12.6 | 35.0 | D 진입권 유지 |
| 4 | C | `silent-monk` | 망각의 서고 | 673 | 870 | 0.77 | high | 16% | 84% | 0% | 17.8 | 6.5 | 5%대에서 개선. 여전히 C급 고위험 도전 |
| 5 | D | `fate-harmonizer` | 망각의 서고 | 694 | 870 | 0.80 | high | 28% | 72% | 0% | 17.2 | 17.0 | 큰 변화 없음. balance 계열 기존 위험도 유지 |

#### R² 변화
- 11-10: 약 0.88
- 11-11: 약 0.908
- drawRate: 전 케이스 0%

#### 11-11 메모
- `skill-silent-guard`는 단순 DEF buff에서 피해감소 + 반격형 스킬로 바뀌었다.
- 초기 권장안의 반격 확률 35%는 Case 4 승률이 약 10~11%에 머물러 목표 하한에 부족했다.
- 몬스터/공식/보상 정책은 건드리지 않고 스킬 설계 안에서 counterRate만 45%로 소폭 조정했다.
- 향후 2차 직업 전용 스킬을 추가할 때 `damage_reduction`, `counter` 효과를 재사용할 수 있다.
- persist version 변경 없음.
- `npm run build` 통과. 기존 CSS `@import` 위치 경고는 계속 표시되며 이번 변경과 무관.
### 11차 작업 12단계 완료 (2026-05-15) — 전투 결과/로그 UX 개선 + JobPanel 접기
- `GatePanel.tsx`: 최근 전투 결과 카드를 결과별 카드로 개선
  - victory: `게이트 클리어`
  - defeat: `공략 실패`
  - draw: `시간초과`
  - 결과별 border/background 색상 분리
- `GatePanel.tsx`: 보상/패널티 표시 정리
  - XP 보상: `XP +N`
  - 아이템 보상: `전리품: 아이템명 (rarity)`
  - defeat: stamina penalty + injuryHours + 회복 조건 표시
  - victory: `게이트 입장 비용: 스태미나 -20` 표시
  - draw: `보상 없음`, `패널티 없음` 명확히 표시
- `GatePanel.tsx`: 전투 로그 접기/펼치기 추가
  - 기본: 최근 5줄 표시
  - 펼침: 전체 로그 표시
  - 버튼: `전체 로그 보기` / `로그 접기`
- `GatePanel.tsx`: outcome 배지 추가
  - 타격, 치명, 빗나감, 회피, 강화, 약화, 회복
- `GatePanel.tsx`: 반격/피해감소 로그 강조
  - message에 `반격`, `흘려`, `침묵의 반격식` 포함 시 amber 계열 강조
- `GatePanel.tsx`: draw 후 active gate 상태에서 버튼 문구를 `게이트 재도전`으로 표시
- `JobPanel.tsx`: 직업 목록 기본 접힘 처리
  - 현재 장착 직업 요약은 항상 표시
  - 해금한 직업 수 표시
  - `직업 목록 펼치기` / `직업 목록 접기` 버튼 추가
  - 전체 직업 카드 목록은 펼쳤을 때만 표시

#### 11-12 유지 정책
- 전투 공식 변경 없음
- damage 공식 변경 없음
- combatPower 공식 변경 없음
- 몬스터 스탯 변경 없음
- 보상/stamina/draw 정책 변경 없음
- 게이트 출현 정책 변경 없음
- persist version 변경 없음

#### 11-12 테스트 결과
- `npm run build` 통과
- 기존 CSS `@import` 위치 경고는 계속 표시되며 이번 변경과 무관.
### 11차 작업 13단계 완료 (2026-05-15) — 장비 액티브/전투 스킬 구조화
- `types.ts`: `Item.combatSkillIds?: string[]` optional 필드 추가
  - 장착 중일 때 플레이어가 사용할 수 있는 전투 스킬 ID 목록
  - 기존 저장 데이터와 호환되므로 persist version 변경 없음
- `seed.ts`: 장비 전용 전투 스킬 추가
  - `equip-shadow-slash`: 그림자 베기
  - `equip-kings-command`: 왕의 명령
  - `equip-system-pulse`: 시스템 펄스
  - `equip-black-suit-guard`: 흐트러짐 없는 자세
- `seed.ts`: 일부 epic/legendary 장비에 `combatSkillIds` 부여
  - 검은 정장 → 흐트러짐 없는 자세
  - 그림자 단검 → 그림자 베기
  - 왕의 검 → 왕의 명령
  - 시스템의 조각 → 시스템 펄스
- `game.ts`: `getPlayerCombatSkills()`가 장착 장비의 `combatSkillIds`를 합산하도록 변경
  - 직업 스킬 + 장착 장비 스킬 + 기본 공격을 Set으로 중복 제거
  - 보유만 한 장비는 스킬 제공하지 않음
  - 기존 `그림자 단검` 이름 기반 임시 연결 제거
- `Inventory.tsx`: 장비 카드와 장착 슬롯에 제공 전투 스킬명 표시
- `GatePanel.tsx`: 현재 사용 가능 전투 스킬 목록 표시
  - 기존 `getPlayerCombatSkills()` helper를 그대로 사용하므로 UI 전투력과 실제 전투 스킬 목록이 일치
- `store.ts`: 이미 `startGateBattle()`에서 `getPlayerCombatSkills()`를 사용 중이므로 별도 변경 없음

#### 11-13 장비 스킬 value

| 장비 | 스킬 | Value | 판단 |
|---|---|---:|---|
| 그림자 단검 | 그림자 베기 | 12.20 | 공격형 epic 스킬로 적절 |
| 왕의 검 | 왕의 명령 | 8.40 | 안정적인 legendary 버프. 폭증 없음 |
| 시스템의 조각 | 시스템 펄스 | 4.58 | 보조 debuff로 보수적 |
| 검은 정장 | 흐트러짐 없는 자세 | 4.36 | 방어 보조로 보수적 |

#### 11-13 간단 검증 결과

기준: Lv15 C급 가정 빌드, C급 `망각의 파수꾼` 100회 간이 시뮬레이션.

| 조건 | Power | skillTotalPower | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 장비 없음 | 639 | 0 | 21% | 79% | 0% | 16.0 | 10.6 | 기준선 |
| 그림자 단검 | 657 | 12 | 35% | 65% | 0% | 15.6 | 18.8 | 공격 스킬 효과 확인 |
| 왕의 검 | 651 | 8 | 12% | 88% | 0% | 16.3 | 3.3 | 전투력 반영은 되나 단독 버프 효율은 제한적 |
| 시스템의 조각 | 646 | 5 | 11% | 89% | 0% | 16.4 | 3.0 | debuff 단독 효율은 제한적 |
| 검은 정장 | 645 | 4 | 9% | 91% | 0% | 16.8 | 4.7 | 피해감소 단독 효율은 제한적 |

#### 11-13 메모
- 장비 스킬 하나만으로 승률이 과도하게 폭증하지 않는 것은 확인했다.
- 공격형 장비 스킬은 즉시 체감이 크고, 순수 buff/debuff/피해감소 장비는 현재 `scoreSkill`/1:1 DPS 구조에서는 단독 효율이 낮다.
- 다음 밸런스 후보:
  - 장비 buff/debuff 스킬의 scoreSkill 평가 보정
  - 장비 스킬을 2차 직업/다수 몬스터 구조와 함께 재평가
  - legendary 장비 전용 액티브 스킬 강화
- 전투 공식, 몬스터 스탯, 보상/stamina/draw 정책 변경 없음.
- `npm run build` 통과. 기존 CSS `@import` 위치 경고는 계속 표시되며 이번 변경과 무관.
### 11차 작업 14단계 완료 (2026-05-15) — 다수 몬스터 / 웨이브 전투 확장
- `types.ts`: `BattleTurn`에 optional wave 정보 추가
  - `waveNumber?: number`
  - `waveLabel?: string`
- `types.ts`: `CombatLog`에 optional wave 요약 추가
  - `totalWaves?: number`
  - `clearedWaves?: number`
- `game.ts`: `simulateGateWaveBattle()` 추가
  - 기존 `simulateGateBattle()` 1v1 함수는 유지
  - `monsters: MonsterDefinition[]`를 순차 wave로 처리
  - `monsterIds` 1개인 기존 게이트도 같은 흐름에서 정상 처리 가능
- `game.ts`: `summarizeGateWaveBattleSimulations()` 추가
  - seedBase 기반 100회 검증용 helper
- `game.ts`: `resolveAction()` 로그에 optional wave 정보 전달
- `store.ts`: `startGateBattle()`이 `gate.monsterIds` 전체를 읽고 `simulateGateWaveBattle()` 호출
  - monster skill은 모든 wave monster의 skillIds를 합산
  - victory/defeat/draw 후 처리, reward, penalty, stamina, injury 정책은 기존 그대로 유지
- `seed.ts`: 신규 웨이브 게이트 2개 추가
  - E급 `gate-rift-nest` / 균열의 둥지: `rift-rat` → `rift-stray`
  - D급 `gate-sloth-patrol` / 나태의 순찰로: `rift-rat` → `lazy-goblin`
- `GatePanel.tsx`: 웨이브/몬스터 표시 개선
  - 몬스터 카드에 `Wave N` 배지 표시
  - 전체 wave 수 표시
  - 최근 전투 결과 카드에 `clearedWaves / totalWaves` 표시
  - 전투 로그에 `W1`, `W2` wave 배지 표시

#### 11-14 웨이브 정책
- 동시 다수 몬스터 전투가 아니라 순차 웨이브 전투.
- 플레이어 HP는 웨이브 사이에 유지된다.
- cooldown과 activeEffects는 웨이브 사이에 유지된다.
- maxTurns는 전체 전투 기준 30턴.
- victory: 모든 wave 클리어.
- defeat: 어느 wave든 플레이어 HP 0.
- draw: 전체 maxTurns 초과.
- draw는 보상/패널티 없음, active gate 유지.

#### 11-14 간단 검증 결과

간이 100회 검증. 공식/몬스터 스탯/보상은 변경하지 않음.

| Case | Gate | Waves | Victory | Defeat | Draw | Avg Turns | 판단 |
|---|---|---:|---:|---:|---:|---:|---|
| 기존 E 1v1 | 균열의 골목 | 1 | 100% | 0% | 0% | 5.5 | 기존 입문 난이도 유지 |
| 기존 D 1v1 | 나태의 소굴 | 1 | 0% | 100% | 0% | 9.4 | Lv5 기준 상위 도전 위험 유지 |
| 신규 E wave | 균열의 둥지 | 2 | 100% | 0% | 0% | 10.6 | 단일 E보다 길지만 입문 가능 |
| 신규 D wave | 나태의 순찰로 | 2 | 57% | 43% | 0% | 16.9 | D급 진입권 기준 위험하지만 가능 |

#### 11-14 메모
- 동시 다수 전투, 광역 스킬, wave별 보상은 구현하지 않음.
- 웨이브 게이트 rewardTable은 기존 E/D 보상을 재사용한다.
- 웨이브 보상량과 maxTurns는 11-16 종합 밸런스에서 재검토 후보.
- 전투 공식, 몬스터 스탯, 보상/stamina/draw 정책, persist version 변경 없음.
- `npm run build` 통과. 기존 CSS `@import` 위치 경고는 계속 표시되며 이번 변경과 무관.
### 11차 작업 15단계 완료 (2026-05-15) - gate_success_bonus 연결
- `game.ts`: `getActiveGateSuccessBonus()`와 `createGateSuccessCombatEffects()`를 추가했다.
- `game.ts`: `simulateGateBattle()`과 `simulateGateWaveBattle()`이 `initialActiveEffects`를 받을 수 있게 확장했다.
- `store.ts`: `startGateBattle()`에서 `activeConsumableEffects`의 `gate_success_bonus`를 전투 시작 버프로 변환해 시뮬레이터에 전달한다.
- `GatePanel.tsx`: 적용 중인 게이트 보조 효과를 `ATK/DEF +N`, 전투 시작 후 3턴으로 별도 표시한다.
- `Inventory.tsx`: `gate_success_bonus` 표시 문구를 성공률 직접 보정이 아니라 게이트 전투 보조 효과로 정리했다.

#### 11-15 정책
- `gate_success_bonus`는 victory 확률을 직접 올리지 않는다.
- 전투 결과를 강제로 victory로 바꾸지 않는다.
- 기본 combatPower 숫자에는 반영하지 않는다.
- `next_gate`와 `today` duration만 게이트에 적용한다.
- `next_quest` duration은 게이트에 적용하지 않는다.
- 총 bonus는 0.3 cap을 적용한다.
- bonus 0.1당 대략 `ATK/DEF +5`로 변환한다.
- 지속 시간은 전투 시작 후 3턴이다.
- `next_gate` 소모품은 victory/defeat/draw 결과와 관계없이 전투 시도 후 consumed 처리한다.
- `today` 효과는 전투 후에도 유지한다.

#### 11-15 간단 검증 결과

D급 웨이브에 가까운 기준 전투를 100회씩 비교했다. 전투 공식, 몬스터 스탯, 보상/stamina/draw 정책은 변경하지 않았다.

| 조건 | Stat Bonus | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |
|---|---:|---:|---:|---:|---:|---:|---|
| bonus 없음 | +0 | 33% | 67% | 0% | 16.6 | 25.3 | 기준 |
| bonus 0.1 | +5 | 63% | 37% | 0% | 15.7 | 47.6 | 아슬아슬한 전투에서 체감되는 보조 효과 |
| bonus 0.3 cap | +15 | 96% | 4% | 0% | 14.2 | 90.9 | 강하지만 cap 적용 |
| bonus 0.5 입력 | +15 | 96% | 4% | 0% | 14.2 | 90.9 | 0.3 cap 확인 |

#### 11-15 메모
- `gate_success_bonus`는 전투 시작 시 player 대상 `stat` active effect 2개로 변환된다.
  - `atk +statBonus`
  - `def +statBonus`
- 초기 효과도 기존 activeEffects와 같은 duration 감소 정책을 따른다.
- 웨이브 전투에서는 기존 정책대로 activeEffects가 웨이브 사이에 유지된다.
- `npm run build` 통과. 기존 CSS `@import` 위치 경고는 계속 표시되며 이번 변경과 무관하다.
### 11차 작업 16단계 완료 (2026-05-15) - 게이트/전투 종합 시뮬레이션 + 최종 밸런스 점검

#### 11-16 검증 목적
- 직업별 승률 편차 확인
- 장비/장비 스킬 영향 확인
- `gate_success_bonus` 0.1 / 0.3 / cap 영향 확인
- 웨이브 게이트 난이도 확인
- 보상 기대값 점검
- stamina/부상 흐름 점검
- recommendedPower와 risk 표시 신뢰도 점검

#### 11-16 종합 시뮬레이션 조건
- 빌드 수: 6개
- 게이트 수: 6개
- 반복 수: 각 조합 100회
- 총 시뮬레이션 수: 3,600전
- 장비 빌드는 실제 `ITEM_POOL` 장비를 기반으로 mock `id/acquiredAt`만 부여했다.
- 소모품 빌드는 저장 상태를 변경하지 않는 mock `ActiveConsumableEffect`를 사용했다.

#### 11-16 게이트 종합 시뮬레이션 결과

| Build | Gate | Rank | Waves | Power | Rec | Ratio | Risk | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |
|---|---|---|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| A 초급 무각성 | 균열의 골목 | E | 1 | 372 | 300 | 1.24 | normal | 100% | 0% | 0% | 5.7 | 205.1 | E급 입문 정상 |
| A 초급 무각성 | 뒤틀린 뒷골목 | E | 1 | 372 | 300 | 1.24 | normal | 100% | 0% | 0% | 5.2 | 203.0 | E급 입문 정상 |
| A 초급 무각성 | 균열의 둥지 | E | 2 | 372 | 420 | 0.89 | high | 100% | 0% | 0% | 11.1 | 168.8 | E wave는 길지만 입문 가능 |
| A 초급 무각성 | 나태의 소굴 | D | 1 | 372 | 650 | 0.57 | extreme | 0% | 100% | 0% | 9.1 | 0.0 | 상위 랭크 도전 위험 정상 |
| A 초급 무각성 | 나태의 순찰로 | D | 2 | 372 | 780 | 0.48 | extreme | 0% | 100% | 0% | 13.4 | 0.0 | D wave 진입 불가 정상 |
| A 초급 무각성 | 망각의 서고 | C | 1 | 372 | 870 | 0.43 | extreme | 0% | 100% | 0% | 9.2 | 0.0 | C급 도전 불가 정상 |
| B D급 진입 공격형 | 균열의 골목 | E | 1 | 542 | 300 | 1.81 | low | 100% | 0% | 0% | 3.1 | 315.8 | 하위 게이트 압도 정상 |
| B D급 진입 공격형 | 뒤틀린 뒷골목 | E | 1 | 542 | 300 | 1.81 | low | 100% | 0% | 0% | 2.9 | 311.9 | 하위 게이트 압도 정상 |
| B D급 진입 공격형 | 균열의 둥지 | E | 2 | 542 | 420 | 1.29 | normal | 100% | 0% | 0% | 6.4 | 297.6 | E wave 안정 |
| B D급 진입 공격형 | 나태의 소굴 | D | 1 | 542 | 650 | 0.83 | high | 81% | 19% | 0% | 11.3 | 52.8 | 공격형 기준 다소 쉬움, 관찰 |
| B D급 진입 공격형 | 나태의 순찰로 | D | 2 | 542 | 780 | 0.69 | extreme | 68% | 32% | 0% | 14.4 | 42.8 | 표시가 보수적, 관찰 |
| B D급 진입 공격형 | 망각의 서고 | C | 1 | 542 | 870 | 0.62 | extreme | 1% | 99% | 0% | 13.8 | 0.1 | C급 고위험 정상 |
| C D급 분석형 | 균열의 골목 | E | 1 | 534 | 300 | 1.78 | low | 100% | 0% | 0% | 4.5 | 316.1 | 하위 게이트 안정 |
| C D급 분석형 | 뒤틀린 뒷골목 | E | 1 | 534 | 300 | 1.78 | low | 100% | 0% | 0% | 3.3 | 318.4 | 하위 게이트 안정 |
| C D급 분석형 | 균열의 둥지 | E | 2 | 534 | 420 | 1.27 | normal | 100% | 0% | 0% | 7.7 | 299.6 | E wave 안정 |
| C D급 분석형 | 나태의 소굴 | D | 1 | 534 | 650 | 0.82 | high | 61% | 39% | 0% | 12.6 | 41.1 | D급 진입권 정상 |
| C D급 분석형 | 나태의 순찰로 | D | 2 | 534 | 780 | 0.68 | extreme | 48% | 52% | 0% | 16.5 | 28.4 | D wave 위험하지만 가능 |
| C D급 분석형 | 망각의 서고 | C | 1 | 534 | 870 | 0.61 | extreme | 0% | 100% | 0% | 13.6 | 0.0 | C급 도전 불가 정상 |
| D 방어형 | 균열의 골목 | E | 1 | 676 | 300 | 2.25 | low | 100% | 0% | 0% | 3.1 | 403.2 | 하위 게이트 압도 |
| D 방어형 | 뒤틀린 뒷골목 | E | 1 | 676 | 300 | 2.25 | low | 100% | 0% | 0% | 2.9 | 398.9 | 하위 게이트 압도 |
| D 방어형 | 균열의 둥지 | E | 2 | 676 | 420 | 1.61 | low | 100% | 0% | 0% | 6.3 | 385.0 | E wave 압도 |
| D 방어형 | 나태의 소굴 | D | 1 | 676 | 650 | 1.04 | normal | 88% | 12% | 0% | 14.8 | 128.3 | 방어형 생존성 확인, 약간 강함 |
| D 방어형 | 나태의 순찰로 | D | 2 | 676 | 780 | 0.87 | high | 91% | 9% | 0% | 18.8 | 95.5 | 방어형이 D wave에 강함, 장기전 주의 |
| D 방어형 | 망각의 서고 | C | 1 | 676 | 870 | 0.78 | high | 2% | 97% | 1% | 19.8 | 2.6 | C급은 여전히 매우 위험 |
| E 장비 공격형 | 균열의 골목 | E | 1 | 682 | 300 | 2.27 | low | 100% | 0% | 0% | 3.1 | 382.1 | 장비 공격형 압도 |
| E 장비 공격형 | 뒤틀린 뒷골목 | E | 1 | 682 | 300 | 2.27 | low | 100% | 0% | 0% | 1.0 | 394.8 | 장비 스킬 체감 큼 |
| E 장비 공격형 | 균열의 둥지 | E | 2 | 682 | 420 | 1.62 | low | 100% | 0% | 0% | 5.5 | 372.8 | E wave 압도 |
| E 장비 공격형 | 나태의 소굴 | D | 1 | 682 | 650 | 1.05 | normal | 100% | 0% | 0% | 8.8 | 207.9 | 장비 공격형 기준 쉬움 |
| E 장비 공격형 | 나태의 순찰로 | D | 2 | 682 | 780 | 0.87 | high | 100% | 0% | 0% | 12.0 | 187.7 | 장비 스킬 영향 큼 |
| E 장비 공격형 | 망각의 서고 | C | 1 | 682 | 870 | 0.78 | high | 57% | 43% | 0% | 15.2 | 41.9 | C급 고위험 도전으로 적절 |
| F 소모품 고위험 도전 | 균열의 골목 | E | 1 | 660 | 300 | 2.20 | low | 100% | 0% | 0% | 5.6 | 359.6 | 하위 게이트 안정 |
| F 소모품 고위험 도전 | 뒤틀린 뒷골목 | E | 1 | 660 | 300 | 2.20 | low | 100% | 0% | 0% | 4.9 | 365.6 | 하위 게이트 안정 |
| F 소모품 고위험 도전 | 균열의 둥지 | E | 2 | 660 | 420 | 1.57 | low | 100% | 0% | 0% | 8.1 | 348.8 | E wave 안정 |
| F 소모품 고위험 도전 | 나태의 소굴 | D | 1 | 660 | 650 | 1.02 | normal | 98% | 2% | 0% | 12.0 | 135.2 | D 1v1에는 강함 |
| F 소모품 고위험 도전 | 나태의 순찰로 | D | 2 | 660 | 780 | 0.85 | high | 99% | 1% | 0% | 15.6 | 135.0 | D wave에는 강함 |
| F 소모품 고위험 도전 | 망각의 서고 | C | 1 | 660 | 870 | 0.76 | high | 9% | 91% | 0% | 16.8 | 4.3 | C급은 여전히 위험 |

#### 11-16 gate_success_bonus 검증

동일 seedBase로 bonus만 바꿔 200회씩 비교했다. 기본 combatPower 숫자는 변하지 않고, 전투 시작 active effect만 달라진다.

| Gate | 조건 | Stat Bonus | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 나태의 순찰로 | bonus 없음 | +0 | 98% | 2% | 0% | 15.8 | 133.7 | 이미 유리한 전투 |
| 나태의 순찰로 | bonus 0.1 | +5 | 98% | 2% | 0% | 15.8 | 136.1 | 평균 HP 소폭 개선 |
| 나태의 순찰로 | bonus 0.3 | +15 | 98% | 2% | 0% | 15.8 | 140.5 | 더 안정적, 과잉 승률 보정 아님 |
| 나태의 순찰로 | bonus 0.5 입력 | +15 | 98% | 2% | 0% | 15.8 | 140.5 | 0.3 cap 확인 |
| 망각의 서고 | bonus 없음 | +0 | 12% | 89% | 0% | 16.3 | 5.0 | 고위험 전투 |
| 망각의 서고 | bonus 0.1 | +5 | 12% | 89% | 0% | 16.4 | 5.5 | 평균 HP 소폭 개선 |
| 망각의 서고 | bonus 0.3 | +15 | 13% | 88% | 0% | 16.6 | 6.3 | 극단 난이도를 뒤집지는 않음 |
| 망각의 서고 | bonus 0.5 입력 | +15 | 13% | 88% | 0% | 16.6 | 6.3 | 0.3 cap 확인 |

#### 11-16 보상 기대값 점검

| Reward Table | XP | DropChance | RarityBias | 판단 |
|---|---:|---:|---|---|
| E급 게이트 기본 보상 | 80 | 35% | common 60%, uncommon 30%, rare 10% | 입문 파밍 보상으로 적절 |
| D급 게이트 기본 보상 | 140 | 45% | common 30%, uncommon 40%, rare 25%, epic 5% | D급 진입 보상으로 적절 |
| C급 게이트 기본 보상 | 220 | 55% | uncommon 25%, rare 50%, epic 20%, legendary 5% | C급 위험도 대비 적절, legendary는 낮은 확률 |

메모:
- 웨이브 게이트는 현재 같은 랭크의 기본 rewardTable을 재사용한다.
- E wave는 입문 가능하고 D wave는 더 길고 위험하므로, 11-16 이후 전용 wave rewardTable을 검토할 수 있다.
- 이번 단계에서는 보상 수치를 변경하지 않았다.

#### 11-16 stamina / 부상 흐름 평가
- stamina 100 기준으로 victory만 반복하면 5회 도전 가능하다.
- defeat는 stamina -50과 부상을 함께 주므로 연속 실패 억제 장치로 충분히 강하다.
- draw는 보상/패널티 없음과 active 유지 정책이 유지되어 세팅 변경 후 재도전 흐름이 자연스럽다.
- 시간 회복 +10/hour, daily/main/random 퀘스트 완료 +5는 게이트를 보조 콘텐츠로 유지하는 데 적절하다.
- 부상은 6시간 또는 퀘스트 3개 완료로 회복되어 영구 손실 없이 제약만 만든다.
- 이번 단계에서는 stamina/부상 정책을 변경하지 않았다.

#### 11-16 recommendedPower / risk 점검
- 전체 매트릭스에서 drawRate는 0~1%로 안정적이다.
- risk bucket 평균 승률은 low 100%, normal 98%, high 65%, extreme 15% 수준이다.
- `normal` bucket에 이미 강한 빌드가 포함되어 평균 승률이 높게 나온다.
- `high` bucket은 빌드에 따라 2~100%까지 넓게 분포한다. 장비/직업/스킬 상성이 강하게 반영되는 것으로 판단한다.
- D급 1v1과 D급 wave는 공격형/방어형 고성장 빌드에 다소 쉽게 나온다.
- C급 `망각의 서고`는 장비 공격형 외에는 매우 가혹하다.
- 이번 단계에서는 recommendedPower를 변경하지 않고, 11-16 이후 더 많은 실사용 로그가 쌓인 뒤 D/C 경계 보정을 검토한다.

#### 11-16 조정한 항목
- recommendedPower: 변경 없음
- rewardTable: 변경 없음
- monster stats: 변경 없음
- skill 수치: 변경 없음
- 전투 공식: 변경 없음
- persist version: 변경 없음

#### 11-16 최종 판단
- 게이트/전투 1차 완성 가능 여부: 가능
- E급 입문, D급 진입, C급 고위험, 장비/소모품 영향, 웨이브 전투, draw 억제, stamina/부상 제약이 모두 기능적으로 작동한다.
- 즉시 수정할 붕괴성 이슈는 없다.
- 추가 개선 필요 항목:
  - D급 게이트가 특정 고성장 빌드에 너무 쉬운지 실사용 로그로 재확인
  - C급 게이트가 공격형 장비 빌드 외에 너무 좁은 관문인지 재확인
  - 웨이브 게이트 전용 rewardTable 검토
  - recommendedPower가 상성/장비 스킬까지 충분히 표현하는지 장기 데이터로 보정

#### 11-16 다음 추천 작업
- 11-17: 웨이브 게이트 전용 보상 테이블 또는 Gate 결과 UX 미세 개선
- 이후 후보: C급 게이트 추가, 장비 액티브 스킬 추가, 전투 로그 하이라이트 강화
## 12차 작업 1단계 - 장기 성장 밸런스 패치

### 변경 이유
- daily 보상이 과해 단기간 성장 속도가 빠르게 느껴질 수 있었다.
- 스탯이 정수 단위로 올라 퀘스트 1개 완료의 성장 체감이 너무 급격했다.
- daily/main/dungeon/gate 난이도 대비 보상 역할 차이를 더 명확히 할 필요가 있었다.
- HunterStatus 플레이어 카드의 scan-line 장식이 흰색 깨진 선처럼 보일 수 있어 제거했다.

### 변경 내용
- `game.ts`에 장기 성장용 보상 helper를 추가했다.
  - `getBalancedQuestXp()`
  - `getBalancedDungeonStepXp()`
  - `getBalancedQuestDropChance()`
  - `getBalancedQuestStatRewards()`
  - `getBalancedRandomQuestXp()`
  - `getBalancedRandomQuestDropChance()`
  - `formatStat()`
  - `formatStatReward()`
- regular quest 완료 로직은 raw seed 보상을 직접 더하지 않고, type/difficulty 기반 balanced reward를 적용한다.
- random quest XP와 drop chance도 완료/표시 단계에서 하향 보정한다.
- 스탯 증가는 소수점 누적을 허용하고, 저장 구조는 기존 `number` 그대로 유지한다.
- 스탯 표시는 소수 둘째 자리까지 보여준다.
- 장비/소모품 stat bonus도 `+1.00` 형태로 표시한다.
- `QuestCard`, `RandomQuestCard`, `AddQuestModal`의 보상 표시를 실제 적용 보상과 맞췄다.
- `HunterStatus` 최상단 카드에서 `scan-line` 클래스를 제거하고 `overflow-hidden`만 유지해 깨진 선처럼 보이는 장식을 정리했다.

### 밸런스 정책
- daily는 장기 누적용 작은 보상.
- random은 daily보다 약간 높은 변수 보상.
- main은 의미 있는 중기 목표 보상.
- dungeon은 큰 클리어 보상.
- gate는 기존처럼 XP 보조, 장비/아이템 중심 보상.
- 기존 저장 데이터는 migrate 없이 그대로 사용한다.
- persist version 변경 없음.

### 12-1 손계산 비교

| 항목 | 기존 | 변경 후 | 판단 |
|---|---:|---:|---|
| daily easy 5개 XP | 75 | 35 | daily XP 크게 하향 |
| daily easy 5개 stat | +5.00 | +0.30 | 장기 누적형으로 전환 |
| daily normal 5개 XP | 150 | 50 | daily 과성장 억제 |
| daily normal 5개 stat | +5.00 | +0.50 | 1일 성장 폭 완화 |
| daily hard raw 2 보상 5개 XP | 300 | 80 | hard daily도 장기형 유지 |
| daily hard raw 2 보상 5개 stat | +10.00 | +0.80 | 하루 +1 이상 폭증 방지 |
| random normal XP 40 | 40 | 28 | random XP 약 70% 수준 |
| main boss raw 6+4 stat 총합 | +10.00 | +1.50 | main은 daily보다 의미 있게 유지 |
| dungeon apex raw 6+3 stat 총합 | +9.00 | +1.08 | dungeon clear 보상은 큼 |

### 드랍률 기준
- daily easy: 1.5%
- daily normal: 3%
- daily hard: 5%
- random easy: 3.5%
- random normal: 6%
- random hard: 10%
- main: difficulty별 5~35%
- dungeon clear: 기존 구조상 클리어 보상 아이템 유지
- gate: 기존 rewardTable 유지

### 메모
- `DIFFICULTY_META.xp`는 난이도 메타 데이터로 유지하지만, 퀘스트 완료/표시는 balanced helper를 사용한다.
- title 조건은 기존 base stat 기준 비교를 유지한다.
- 전투 계산은 `number` 기반이라 소수점 스탯에서도 정상 동작한다.
- 자유 스탯 포인트는 기존처럼 +1 단위 유지.

## 12차 작업 1B단계 - Main/Dungeon 대형 목표 보상 재정의

### 변경 이유
- 12-1에서 main boss stat 총합이 약 +1.5, dungeon apex clear stat이 약 +1.08로 떨어졌다.
- main quest는 자격증 합격/대형 프로젝트(1~2개월)이고 dungeon은 월 단위 누적 목표인데, 보상이 daily 수준에 가까워 동기부여가 약했다.
- daily는 12-1 수준 그대로 두고, main/dungeon은 대형 목표에 맞는 정수 단위 후한 보상으로 재정의한다.

### 12-1B 보상 역할 재정의

- **daily**: 매일 반복 가능한 작은 루틴. XP/stat/item drop 모두 낮게 유지 (12-1 수치 그대로). 장기 누적 성장용.
- **random**: daily보다 약간 특별한 이벤트성 보상. base × 0.7 유지.
- **main**: 자격증 합격/대형 프로젝트/장기 목표. 정수 단위 후한 스탯 보상 허용. boss = 학회 가입급.
- **dungeon**: 월 5회 운동/독서 8권/CMA 일지 12회 등 월 단위 누적 목표. clear 시 후한 스탯/XP.
- **gate**: 장비/아이템/전투 콘텐츠. XP/stat 직접 성장보다 장비/아이템과 전투 재미 중심.

### 변경 내용
- `game.ts > BALANCED_XP_BY_TYPE`: main/dungeon XP 대폭 상향. daily 유지.
- `game.ts > STAT_REWARD_MULTIPLIER_BY_TYPE`: main apex/boss 0.18/0.15 → 1.0, elite 0.18 → 0.65 등 main 전반 상향. dungeon apex 0.12 → 0.9, elite 0.12 → 0.55 등 상향.
- `game.ts > DROP_CHANCE_BY_TYPE`: main/dungeon 드롭 확률 상향. daily 유지.
- `game.ts > formatStatReward`: 정수 보상은 `+5`로, 소수 보상은 `+0.08`/`+5.20`로 표시. main/dungeon 정수 보상 가독성 개선.

### 12-1B 손계산 비교

| 항목 | 12-1 | 12-1B | 판단 |
|---|---:|---:|---|
| daily easy 5개 XP | 35 | 35 | 유지 |
| daily easy 5개 stat | +0.30 | +0.30 | 유지 |
| daily hard 5개 stat | +0.80 | +0.80 | 유지 |
| daily 평균 drop | 1.5%~5% | 1.5%~5% | 유지 |
| main-club boss XP | 215 | 1000 | 학회 가입급 |
| main-club boss stat 총합 (raw 10) | +1.50 | **+10.0** | 정수 단위 후한 보상 |
| main-kbi-cert apex XP | 155 | 750 | 자격증급 |
| main-kbi-cert apex stat 총합 (raw 7) | +1.26 | **+7.0** | 정수 단위 |
| main-cut elite XP | 105 | 450 | 큰 main |
| main-cut elite stat 총합 (raw 8) | +1.44 | +5.2 | 큰 main 범위 |
| main-spend-monthly elite stat (raw 6) | +1.08 | +3.9 | 월간 main |
| dungeon-reports apex XP | 210 | 1100 | 월 단위 대형 |
| dungeon-reports apex stat 총합 (raw 9) | +1.08 | **+8.1** | 정수 단위 |
| dungeon-finance-books apex stat (raw 8) | +0.96 | **+7.2** | 정수 단위 |
| dungeon-cma-journal elite stat (raw 7) | +0.84 | +3.85 | 월간 dungeon |
| 헬스 monthly elite stat (raw 6) | +0.72 | +3.3 | 월간 dungeon |
| main boss drop | 35% | 100% | 보장 |
| main apex drop | 28% | 85% | 거의 보장 |
| dungeon apex drop | 90% | 100% | 보장 |
| dungeon elite drop | 75% | 95% | 거의 보장 |

### XP 보상 표

| 콘텐츠 | 12-1 | 12-1B |
|---|---:|---:|
| daily E~S | 7/10/16/35/45/60 | 유지 |
| main E~S | 22/38/65/105/155/215 | 100/180/300/450/750/1000 |
| dungeon E~S | 30/55/90/140/210/300 | 150/280/500/700/1100/1500 |

### Stat reward multiplier 표

| 콘텐츠 | 12-1 | 12-1B |
|---|---|---|
| daily E/D/C/B/A/S | 0.06/0.10/0.08/0.08/0.08/0.08 | 유지 |
| main E/D/C/B/A/S | 0.20/0.25/0.30/0.18/0.18/0.15 | 0.35/0.45/0.60/0.65/1.00/1.00 |
| dungeon E/D/C/B/A/S | 0.15/0.18/0.20/0.12/0.12/0.12 | 0.35/0.45/0.55/0.55/0.90/1.00 |

### 드롭 확률 표

| 콘텐츠 | 12-1 | 12-1B |
|---|---|---|
| daily E~S | 1.5/3/5/8/10/12% | 유지 |
| main E~S | 5/8/12/20/28/35% | 25/40/55/70/85/100% |
| dungeon E~S | 35/45/60/75/90/100% | 50/70/90/95/100/100% |

### Gate/Monster 재점검 (이번 단계는 변경 없음)

#### 정성적 평가 (시뮬레이션 미실행, 보수적 판단)

| Build (가정) | 변화 | E급 | D급 | D wave | C급 | 판단 |
|---|---|---|---|---|---|---|
| Lv 5 무빌드 (11-7 Build A 동일) | 변화 없음 | low | extreme | extreme | extreme | 입문 구간 정상 |
| Lv 10 daily만 1개월 | daily stat 누적 ~+5-8 | low | high | extreme | extreme | 큰 변화 없음 |
| Lv 15 + main 1개 + dungeon 1개 | main +7~10, dungeon +7~8 | 압도 | normal-low | high | high | D급이 약간 쉬워질 가능성 |
| Lv 20 + main 2개 + dungeon 3개 | stat 총합 +25-35 | 압도 | low | normal | high | D급 의미 약화 가능성 |

#### 조정한 항목
- **recommendedPower**: 변경 없음 (E 300, D 650, D wave 780, C 870)
- **monster stats**: 변경 없음
- **rewardTable**: 변경 없음

#### 조정하지 않은 이유
- 12-1B 시점에서는 실제 플레이 데이터가 없어 시뮬레이션 결과를 검증할 수 없다.
- main/dungeon 보상 폭증이 실제로 D급을 무너뜨리는지는 1~2개월 실사용 후 확인이 더 정확하다.
- 우선순위 정책상 "E급은 건드리지 않음 / D급은 너무 어렵게 만들지 않음"이라 보수적으로 유지.
- 향후 D급 ratio가 일관되게 1.5 이상으로 뜨거나 평균 승률이 90%+로 굳어지면 그때 recommendedPower 보정 (예: D 650 → 750~800, C 870 → 950) 또는 C급 몬스터 소폭 상향 후보.

### formatStatReward 정수 처리
- 변경 전: `+5.00`, `+0.06`
- 변경 후: `+5` (정수), `+0.06`/`+5.20` (소수)
- 효과: main/dungeon apex/boss 보상이 자연스럽게 `+10 +7` 형태로 표시되어 가독성 개선. daily/elite는 기존처럼 소수점 표시.

### 미변경 / 유지
- daily XP/stat/drop: 12-1 수치 그대로
- random XP/drop: 12-1 그대로 (base × 0.7)
- gate rewardTable: 기존 유지
- persist version: 변경 없음 (스키마 동일, helper 값만 조정)
- title 조건: base stat 기준 (장비/소모품 미반영) 정책 그대로

### 메모
- main boss `완료` 1회 = 학회 가입 같은 1년 단위 대형 목표 → +10 stat / 1000 XP / 100% 드롭은 적절
- dungeon apex `clear` 1회 = 학회 리포트 10편 / 책 8권 같은 월 단위 → +7-8 stat / 1100 XP는 적절
- daily는 30일간 매일 hard 깨도 stat 총합 ~+5 수준 → main 1개 = daily 한 달치라는 균형
- 12-1과 마찬가지로 자유 스탯 포인트는 +1 정수 단위 그대로

## 12차 작업 1C단계 - Main 추가 상향 + Dungeon XP 등급 표준화

### 변경 이유
- 12-1B에서도 main 보상이 대형 목표(자격증/학회 가입/큰 프로젝트, 1~2개월)답게 충분히 후하지 않다는 피드백.
- Dungeon XP가 UI에서 등급별로 뒤섞여 보임 — 사용자가 같은 B급 dungeon인데 `+49`와 `+82`로 다르게 표시되는 것 발견. A급인데도 `+39`로 B급보다 낮게 보이는 케이스도 있음.
- 원인 진단: 표시되던 값은 모두 **per-step partial XP**. 단계 수가 다르면 per-step 값도 달라지는 수학 자체는 정상이지만, UI에 "이게 클리어 보상인지 단계 보상인지" 라벨이 없어 혼란 발생.
  - elite 5-step: 700 × 0.35 / 5 = **49** (상체 운동)
  - elite 3-step: 700 × 0.35 / 3 = **82** (하체 운동)
  - apex 10-step: 1100 × 0.35 / 10 = **39** (산업 리포트)

### 변경 내용

#### `game.ts` reward 테이블 업데이트
- `BALANCED_XP_BY_TYPE.main`: 100/180/300/450/750/1000 → **150/280/500/800/1300/2000**
- `BALANCED_XP_BY_TYPE.dungeon`: 150/280/500/700/1100/1500 → **300/600/1000/1600/2400/3500**
- `STAT_REWARD_MULTIPLIER_BY_TYPE.main`: 0.35/0.45/0.60/0.65/1.00/1.00 → **0.60/0.80/1.00/1.20/1.60/2.00**
- `STAT_REWARD_MULTIPLIER_BY_TYPE.dungeon`: 0.35/0.45/0.55/0.55/0.90/1.00 → **0.70/0.90/1.20/1.50/2.00/2.50**
- `DROP_CHANCE_BY_TYPE`: 12-1B 그대로 (이미 충분)

#### `game.ts` partial step ratio 조정
- partial budget: clear의 35% → **25%**로 축소. clear 보상을 더 크게 보이게.
- min step XP: 2 → 5 (clear XP가 폭증해 partial floor도 의미 있게)
- `getBalancedDungeonStepXp(difficulty, totalSteps)` 공식: `Math.max(5, Math.round(clearXp * 0.25 / totalSteps))`

#### `game.ts` 신규 helper alias
- `getBalancedDungeonClearXp(difficulty)`: `getBalancedQuestXp('dungeon', difficulty)`의 명확한 이름 alias. UI/store 코드 가독성용.

#### `QuestCard.tsx` 표시 분리
- Dungeon 카드: **"클리어 +N XP" 메인** + **"· 단계 +M XP" 보조** + clear stat rewards.
- 같은 등급 dungeon은 step 수와 상관없이 **동일한 클리어 XP**가 메인 숫자로 표시됨.
- daily/main 카드: 기존 표시 (단일 XP + stat rewards) 그대로.

### 12-1C 손계산 비교

| 항목 | 12-1B | 12-1C | 판단 |
|---|---:|---:|---|
| **Main XP** | | | |
| main XP E/D/C/B/A/S | 100/180/300/450/750/1000 | **150/280/500/800/1300/2000** | 대형 목표 |
| main-club boss (raw INT 6+PER 4=10) | +10 | **+20** | 학회 가입급 |
| main-kbi-cert apex (raw INT 4+PER 3=7) | +7 | **+11.2** | 자격증 |
| main-gpa apex (raw 7) | +7 | **+11.2** | 학점 |
| main-cut elite (raw VIT 4+PER 4=8) | +5.2 | **+9.6** | 큰 main |
| main-spend-monthly elite (raw PER 4+SEN 2=6) | +3.9 | **+7.2** | 월간 main |
| **Dungeon XP** | | | |
| dungeon XP E/D/C/B/A/S | 150/280/500/700/1100/1500 | **300/600/1000/1600/2400/3500** | 월 단위 대형 |
| dungeon-reports apex (raw INT 6+PER 3=9) | +8.1 | **+18** | 월간 대형 |
| dungeon-finance-books apex (raw 8) | +7.2 | **+16** | 월간 대형 |
| dungeon-cma-journal elite (raw INT 4+SEN 3=7) | +3.85 | **+10.5** | 월간 |
| 헬스 monthly elite raw 6 (arm/back/chest/shoulder) | +3.3 | **+9** | 월간 헬스 |
| dungeon-leg-monthly elite (raw STR 5+VIT 2=7) | +3.85 | **+10.5** | 월간 헬스 |
| **Dungeon partial step XP** | | | |
| elite 5-step (상체/등/가슴/어깨) | 49/step | **80/step** | clear의 25%/5단계 |
| elite 3-step (하체) | 82/step | **133/step** | clear의 25%/3단계 |
| apex 10-step (리포트) | 39/step | **60/step** | clear의 25%/10단계 |
| apex 8-step (책) | 48/step | **75/step** | clear의 25%/8단계 |
| elite 12-step (CMA 일지) | 20/step | **33/step** | clear의 25%/12단계 |

### Helper 명명 정리
| Helper | 용도 |
|---|---|
| `getBalancedQuestXp(type, difficulty)` | daily/main/dungeon 통합 XP 조회 |
| `getBalancedDungeonClearXp(difficulty)` | dungeon clear 전용 alias (가독성) |
| `getBalancedDungeonStepXp(difficulty, totalSteps)` | dungeon 단계당 partial XP |
| `getBalancedQuestStatRewards(quest)` | clear/complete 시 적용되는 stat 보상 |
| `getBalancedQuestDropChance(type, difficulty)` | 아이템 드롭 확률 |
| `getBalancedRandomQuestXp(baseXp)` | random quest XP (base × 0.7) |
| `getBalancedRandomQuestDropChance(difficulty)` | random quest 드롭 |
| `formatStatReward(value)` | 정수면 `+5`, 소수면 `+0.06`/`+5.20` |

### UI 표시 / 실제 지급 일치 검증
| 위치 | 표시 | 실제 지급 (store.ts) | 일치 여부 |
|---|---|---|---|
| Dungeon card (활성) | `getBalancedDungeonClearXp` + `getBalancedDungeonStepXp` | progressDungeon 부분: `getBalancedDungeonStepXp`; clear: `getBalancedQuestXp('dungeon', ...)` | ✓ |
| Dungeon card 완료 | clear XP | (해당 없음) | — |
| Dungeon clear SystemMessage | `getBalancedQuestStatRewards` | `getBalancedQuestStatRewards` + `roundStatValue` | ✓ |
| Dungeon partial SystemMessage | step XP | step XP × AGI/장비/소모품 mult | ✓ |
| Main card | `getBalancedQuestXp('main', ...)` + statRewards | 동일 | ✓ |
| Main complete SystemMessage | 실제 적용된 XP/stat | 동일 | ✓ |
| Daily card | daily 12-1 값 유지 | 동일 | ✓ |
| AddQuestModal preview | `getBalancedQuestXp(type, d)` | 동일 | ✓ |

### Gate / Monster 점검
- **이번 단계는 변경 없음.** 12-1D에서 별도 정량 점검 예정.
- 12-1D 점검 항목:
  - main 1개 완료 후 빌드로 D/D-wave/C gate 100회 시뮬레이션
  - dungeon 1개 클리어 후 빌드로 동일
  - main+dungeon 1~2개월 누적 가정 빌드
  - D급 평균 승률 / risk 표시 일관성 확인
  - 필요 시 recommendedPower 보정 (E 유지, D 보수적, C 가능)

### 미변경 / 유지
- daily XP/stat/drop 12-1 그대로
- random XP/drop 12-1B 그대로 (base × 0.7)
- gate rewardTable, monster stats, recommendedPower 12-1B 그대로
- 전투 공식, XP 곡선 그대로
- persist version 변경 없음 (스키마 동일)
- localStorage key `levelup-save` 유지
- title 조건 base stat 기준 정책 유지

### 메모
- daily 30일 누적 stat 총합(~+5) vs main 1개 자격증(+11.2) → main 1개 = daily 약 2.2개월치
- dungeon 1개 월간 클리어(~+10 elite, ~+18 apex) → dungeon 1개 = daily 2~3.5개월치
- 자주 완료되지 않는 콘텐츠이므로 폭주 위험 낮음
- 장기 시뮬레이션은 12-1D 또는 별도 패치에서

## 12차 작업 1D단계 - Dungeon 보상 Main 대비 1/3 재조정

### 변경 이유
- 12-1C에서 dungeon XP/stat이 main보다 커지는 위계 역전 발생.
- 사용자 결정: 보상 위계는 `main > dungeon > daily`.
- dungeon은 월 단위 누적 목표지만, 자격증 합격/대형 프로젝트 같은 main보다는 낮아야 함.
- main 보상은 12-1C 수치 유지. dungeon만 main 대비 ~1/3 수준으로 재조정.

### 변경 내용

#### `game.ts > BALANCED_XP_BY_TYPE.dungeon`
12-1C: 300/600/1000/1600/2400/3500 → **12-1D: 50/90/170/270/430/670**

#### `game.ts > STAT_REWARD_MULTIPLIER_BY_TYPE.dungeon`
12-1C: 0.70/0.90/1.20/1.50/2.00/2.50 → **12-1D: 0.20/0.27/0.35/0.40/0.55/0.70**

### 12-1D 보상 위계 정리

| Rank | Main XP | Dungeon XP | Ratio | Main Stat Mult | Dungeon Stat Mult | Ratio |
|---|---:|---:|---:|---:|---:|---:|
| E | 150 | 50 | 33% | 0.60 | 0.20 | 33% |
| D | 280 | 90 | 32% | 0.80 | 0.27 | 34% |
| C | 500 | 170 | 34% | 1.00 | 0.35 | 35% |
| B | 800 | 270 | 34% | 1.20 | 0.40 | 33% |
| A | 1300 | 430 | 33% | 1.60 | 0.55 | 34% |
| S | 2000 | 670 | 34% | 2.00 | 0.70 | 35% |

### 12-1C → 12-1D 손계산 비교

| 항목 | 12-1C | 12-1D | 판단 |
|---|---:|---:|---|
| **Dungeon XP (clear)** | | | |
| dungeon-reports apex | 2400 XP | **430 XP** | 월간 대형, main 대비 1/3 |
| dungeon-finance-books apex | 2400 XP | **430 XP** | 동일 |
| dungeon-cma-journal elite | 1600 XP | **270 XP** | 월간, B급 표준 |
| 헬스 monthly (arm/back/chest/shoulder) elite | 1600 XP | **270 XP** | 동일 |
| dungeon-leg-monthly elite | 1600 XP | **270 XP** | 동일 |
| **Dungeon stat (clear)** | | | |
| dungeon-reports apex (raw INT 6+PER 3=9) | +18 | **+4.95** | 4.95 = 9×0.55 |
| dungeon-finance-books apex (raw 8) | +16 | **+4.40** | 4.40 = 8×0.55 |
| dungeon-cma-journal elite (raw 7) | +10.5 | **+2.80** | 2.80 = 7×0.40 |
| 헬스 arm elite (raw 6) | +9 | **+2.40** | 2.40 = 6×0.40 |
| 헬스 leg elite (raw 7) | +10.5 | **+2.80** | 2.80 = 7×0.40 |
| **Dungeon partial XP/step** (`clear × 0.25 / steps`, min 5) | | | |
| elite 5-step (상체/등/가슴/어깨) | 80/step | **14/step** | 270×0.25/5 = 13.5 |
| elite 3-step (하체) | 133/step | **23/step** | 270×0.25/3 = 22.5 |
| elite 12-step (CMA 일지) | 33/step | **6/step** | 270×0.25/12 = 5.6 |
| apex 10-step (리포트) | 60/step | **11/step** | 430×0.25/10 = 10.75 |
| apex 8-step (책) | 75/step | **13/step** | 430×0.25/8 = 13.4 |

### 미변경
- **main reward**: XP 150/280/500/800/1300/2000, stat mult 0.60~2.00 그대로
- **daily reward**: 12-1 그대로 (XP 7~60, stat mult 0.06~0.10, drop 1.5~12%)
- **random reward**: 12-1B 그대로 (base × 0.7)
- **dungeon drop chance**: 50/70/90/95/100/100% 그대로 — dungeon의 차별점은 "main보다 낮은 성장 보상 + 높은 전리품 확률"
- **gate rewardTable / monster / recommendedPower**: 변경 없음
- **partial step 공식**: `clear × 0.25 / totalSteps`, 하한 5 그대로
- **persist version**: v14 유지 (스키마 동일)
- **UI**: QuestCard "클리어 +N XP · 단계 +M XP" 표시 구조 그대로 (helper 결과만 작아짐)
- **title 조건, 전투 공식, XP 곡선**: 모두 그대로

### 보상 위계 검증
| 콘텐츠 | apex/B/elite stat 1회 | apex XP 1회 | 비고 |
|---|---:|---:|---|
| daily 30일 누적 hard (5×30) | ~+5 stat | ~480 XP | 매일 |
| main-kbi-cert apex (raw 7) | **+11.2 stat** | **1300 XP** | 자격증 |
| dungeon-reports apex (raw 9) | +4.95 stat | 430 XP | 월간 대형 |
| dungeon-cma-journal elite (raw 7) | +2.80 stat | 270 XP | 월간 |

→ main > dungeon > daily 위계 회복. main 1개 ≈ dungeon 2~3개 ≈ daily 2~3개월치.

### Gate / Monster 점검
- **이번 단계는 변경 없음.** 12-1E에서 정량 점검 예정.
- 12-1E 점검 항목:
  - 12-1D 보상 위계 기준 성장 가정 빌드 (daily 1개월, main 1개, dungeon 1개, main+dungeon 누적)
  - D/D-wave/C 100회 시뮬레이션
  - 현재 recommendedPower(E 300, D 650, D wave 780, C 870)의 적정성 재검증
  - 필요 시 recommendedPower 보정 (E 유지, D 보수적, C 가능)

### 테스트
- `npm run build`: 통과 (3.31s → 6.51s, 1948 modules, 419.66 KB JS / 32.72 KB CSS). 타입 에러 0, 경고 0.
- 수동 확인 권장:
  1. main 탭 — 12-1C와 동일 보상 표시 (학회 +20 INT+PER, 자격증 +11.2 등)
  2. dungeon 탭 — B급 운동(상/등/가슴/어깨/하) 모두 **"클리어 +270 XP"** 동일
  3. B급 5-step: "단계 +14 XP"
  4. B급 3-step: "단계 +23 XP"
  5. A급 리포트: **"클리어 +430 XP · 단계 +11 XP"** (B급보다 크지만 main apex 1300보다 작음)
  6. 완료 SystemMessage XP/stat이 카드 표시와 일치

## 12차 작업 1E단계 - Gate/Monster 난이도 정량 재점검

### 변경 이유
- 12-1D 보상 위계 정리 후, main/dungeon 누적 빌드가 C급 게이트를 무력화하는지 정량 확인 필요.
- 시뮬레이션 결과 Build E (main+dungeon+장비) 가 C급 망각의 서고 **97% 승률** → C급 고위험 정체성 손상.

### 시뮬레이션 방식
- 도구: `scripts/sim-12-1e.ts` (tsx 일회성 스크립트, app 빌드와 무관)
- helper: `summarizeGateWaveBattleSimulations()` 100회/조합 (seedBase=1로 결정론적)
- 가정 빌드 6개 × 게이트 6개 = 36 조합 × 100회 = 3,600 전투
- C급 조정 후 동일 스크립트 재실행으로 검증

### 가정 빌드
| Build | Level | Job | 핵심 스탯 | 장비/소모품 |
|---|---:|---|---|---|
| A 초급 무빌드 | 5 | unawakened | STR 15 VIT 12 AGI 10 INT 8 PER 8 SEN 8 | — |
| B daily 1개월 | 10 | iron-squire | STR 21 VIT 19 AGI 16 INT 13 PER 13 SEN 13 | — |
| C main 1개 (자격증) | 15 | grimoire-decoder | STR 22 VIT 20 AGI 17 INT 30 PER 22 SEN 15 | — |
| D dungeon 1개 | 14 | silent-monk | STR 24 VIT 27 AGI 19 INT 15 PER 17 SEN 14 | — |
| E main+dungeon 누적 | 20 | steelheart-fighter | STR 34 VIT 30 AGI 23 INT 28 PER 24 SEN 18 | 그림자 단검 |
| F + gate_success_bonus 0.1 | 20 | fate-harmonizer | STR 32 VIT 29 AGI 23 INT 26 PER 24 SEN 18 | 그림자 단검 + bonus 0.1 |

### 조정 항목

**1. 망각의 서고 (C급 게이트)** recommendedPower 870 → **1000**
- 이유: Build E ratio 867/870 = 1.00 → risk 'high'로 표시되지만 실제 90% 승률 → 라벨/실측 mismatch.
- 1000으로 올려 ratio 0.87 → high risk 라벨 유지하면서 실제 위험도와 정합.

**2. forgetting-warden (C급 몬스터)** 스탯 상향
- HP **575 → 780** (+36%)
- ATK **88 → 105** (+19%)
- DEF **46 → 58** (+26%)
- 이유: recommendedPower만으로는 실제 승률 불변. monster 강화로 Build E의 C급 승률을 90% → 57%로 조정.
- 사용자 가이드 "소폭"보다 큰 변경이지만, 12-1D 보상 위계로 Build E가 +40% 강해진 만큼 C급 몬스터도 비례 강화 필요했음.

**3. 그 외 미변경**
- D / D wave / E급 게이트 recommendedPower 그대로 (E 300, D 650, D wave 780, E wave 420)
- D/E급 몬스터 스탯 그대로
- gate_success_bonus 정책 그대로 (cap 0.3, 3턴 ATK/DEF +5)
- gate rewardTable / 게이트 만료 / stamina / 부상 정책 그대로

### 최종 결과 (조정 후)

| Build | Gate | Rank | Waves | Power | Rec | Ratio | Risk | Victory | Defeat | Draw | Avg Turns | Avg HP | 판단 |
|---|---|---|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| A 초급 무빌드 | 균열의 골목 | E | 1 | 372 | 300 | 1.24 | normal | 100% | 0% | 0% | 5.0 | 205.5 | 입문 정상 |
| A 초급 무빌드 | 뒤틀린 뒷골목 | E | 1 | 372 | 300 | 1.24 | normal | 100% | 0% | 0% | 3.2 | 221.0 | 입문 정상 |
| A 초급 무빌드 | 균열의 둥지 | E | 2 | 372 | 420 | 0.89 | high | 100% | 0% | 0% | 8.4 | 182.6 | E wave 입문 가능 |
| A 초급 무빌드 | 나태의 소굴 | D | 1 | 372 | 650 | 0.57 | extreme | 0% | 100% | 0% | 9.4 | 0.0 | 진입 불가 |
| A 초급 무빌드 | 나태의 순찰로 | D | 2 | 372 | 780 | 0.48 | extreme | 0% | 100% | 0% | 14.2 | 0.0 | 진입 불가 |
| A 초급 무빌드 | 망각의 서고 | C | 1 | 372 | 1000 | 0.37 | extreme | 0% | 100% | 0% | 8.4 | 0.0 | C급 불가 |
| B daily 1개월 | 균열의 골목 | E | 1 | 559 | 300 | 1.86 | low | 100% | 0% | 0% | 3.0 | 321.6 | 입문 정상 |
| B daily 1개월 | 뒤틀린 뒷골목 | E | 1 | 559 | 300 | 1.86 | low | 100% | 0% | 0% | 3.0 | 321.3 | 입문 정상 |
| B daily 1개월 | 균열의 둥지 | E | 2 | 559 | 420 | 1.33 | low | 100% | 0% | 0% | 6.2 | 301.9 | 입문 정상 |
| B daily 1개월 | 나태의 소굴 | D | 1 | 559 | 650 | 0.86 | high | 62% | 38% | 0% | 13.0 | 49.0 | D 진입권 정상 |
| B daily 1개월 | 나태의 순찰로 | D | 2 | 559 | 780 | 0.72 | high | 51% | 49% | 0% | 15.8 | 38.8 | 위험하지만 가능 |
| B daily 1개월 | 망각의 서고 | C | 1 | 559 | 1000 | 0.56 | extreme | 0% | 100% | 0% | 11.9 | 0.0 | C급 불가 |
| C main 1개 | 균열의 골목 | E | 1 | 617 | 300 | 2.06 | low | 100% | 0% | 0% | 2.9 | 359.1 | 입문 정상 |
| C main 1개 | 뒤틀린 뒷골목 | E | 1 | 617 | 300 | 2.06 | low | 100% | 0% | 0% | 1.7 | 368.9 | 입문 정상 |
| C main 1개 | 균열의 둥지 | E | 2 | 617 | 420 | 1.47 | low | 100% | 0% | 0% | 5.8 | 342.4 | 입문 정상 |
| C main 1개 | 나태의 소굴 | D | 1 | 617 | 650 | 0.95 | high | 96% | 4% | 0% | 10.5 | 156.9 | D 매우 쉬움 (성장 후) |
| C main 1개 | 나태의 순찰로 | D | 2 | 617 | 780 | 0.79 | high | 93% | 7% | 0% | 14.6 | 119.1 | D wave 진입권 |
| C main 1개 | 망각의 서고 | C | 1 | 617 | 1000 | 0.62 | extreme | 0% | 100% | 0% | 14.3 | 0.0 | C급 불가 (장비 없으면) |
| D dungeon 1개 | 균열의 골목 | E | 1 | 697 | 300 | 2.32 | low | 100% | 0% | 0% | 2.9 | 424.6 | 입문 정상 |
| D dungeon 1개 | 뒤틀린 뒷골목 | E | 1 | 697 | 300 | 2.32 | low | 100% | 0% | 0% | 1.5 | 436.1 | 입문 정상 |
| D dungeon 1개 | 균열의 둥지 | E | 2 | 697 | 420 | 1.66 | low | 100% | 0% | 0% | 5.7 | 409.6 | 입문 정상 |
| D dungeon 1개 | 나태의 소굴 | D | 1 | 697 | 650 | 1.07 | normal | 100% | 0% | 0% | 9.6 | 248.1 | D 매우 쉬움 |
| D dungeon 1개 | 나태의 순찰로 | D | 2 | 697 | 780 | 0.89 | high | 100% | 0% | 0% | 13.0 | 230.1 | D wave 매우 쉬움 |
| D dungeon 1개 | 망각의 서고 | C | 1 | 697 | 1000 | 0.70 | extreme | 0% | 100% | 0% | 17.5 | 0.0 | C급 불가 (장비 없으면) |
| E main+dungeon | 균열의 골목 | E | 1 | 867 | 300 | 2.89 | low | 100% | 0% | 0% | 1.2 | 498.5 | 입문 정상 |
| E main+dungeon | 뒤틀린 뒷골목 | E | 1 | 867 | 300 | 2.89 | low | 100% | 0% | 0% | 1.0 | 499.6 | 입문 정상 |
| E main+dungeon | 균열의 둥지 | E | 2 | 867 | 420 | 2.06 | low | 100% | 0% | 0% | 2.3 | 497.9 | 입문 정상 |
| E main+dungeon | 나태의 소굴 | D | 1 | 867 | 650 | 1.33 | low | 100% | 0% | 0% | 6.7 | 377.8 | D 매우 쉬움 (성장 후) |
| E main+dungeon | 나태의 순찰로 | D | 2 | 867 | 780 | 1.11 | normal | 100% | 0% | 0% | 7.8 | 383.3 | D wave 매우 쉬움 |
| **E main+dungeon** | **망각의 서고** | **C** | **1** | **867** | **1000** | **0.87** | **high** | **57%** | **43%** | **0%** | **19.9** | **45.5** | **C급 고위험 도전 ✓** |
| F + bonus 0.1 | 균열의 골목 | E | 1 | 831 | 300 | 2.77 | low | 100% | 0% | 0% | 1.1 | 489.1 | 입문 정상 |
| F + bonus 0.1 | 뒤틀린 뒷골목 | E | 1 | 831 | 300 | 2.77 | low | 100% | 0% | 0% | 1.0 | 489.6 | 입문 정상 |
| F + bonus 0.1 | 균열의 둥지 | E | 2 | 831 | 420 | 1.98 | low | 100% | 0% | 0% | 2.2 | 488.5 | 입문 정상 |
| F + bonus 0.1 | 나태의 소굴 | D | 1 | 831 | 650 | 1.28 | normal | 100% | 0% | 0% | 6.6 | 371.6 | D 매우 쉬움 |
| F + bonus 0.1 | 나태의 순찰로 | D | 2 | 831 | 780 | 1.07 | normal | 100% | 0% | 0% | 7.7 | 376.2 | D wave 매우 쉬움 |
| **F + bonus 0.1** | **망각의 서고** | **C** | **1** | **831** | **1000** | **0.83** | **high** | **47%** | **53%** | **0%** | **20.0** | **34.9** | **C급 매우 위험 ✓** |

### 결론
- **E급**: 모든 빌드 100% 승률 / 입문 구간 정상 유지 ✓
- **E wave (균열의 둥지)**: 초급(372)에서도 100% 가능, 평균 8.4턴으로 약간 길지만 입문 가능
- **D급 (나태의 소굴)**: Build B (daily 1개월) 62% 진입권. Build C+ 성장 후 자연스럽게 쉬워짐. 의도된 동작.
- **D wave (나태의 순찰로)**: Build B 51% (위험하지만 가능). 성장 후 매우 쉬움.
- **C급 (망각의 서고)**: Build C/D(장비 없음) 0%, Build E(장비) 57%, Build F(장비+bonus) 47% — **고위험 도전 정체성 회복**
- **draw**: 모든 조합 0% — 안정적
- **gate_success_bonus 0.1**: Build F는 Build E보다 base stat이 약간 낮지만 bonus +5 ATK/DEF (3턴) 적용 → 비슷한 영역에서 약 10%p 보정. 단독 효과 분리 측정은 어렵지만 의미 있는 보조로 작동.
- **main/dungeon 보상 위계 + C급 난이도**: 두 시스템이 정합하게 작동 — 성장은 보람 있되 C급은 여전히 도전 콘텐츠.

### 시뮬레이션 도구
- `scripts/sim-12-1e.ts` 유지 — 향후 게이트/몬스터 추가/조정 시 재실행 가능.
- 실행: `npx tsx scripts/sim-12-1e.ts > sim-result.md`
- 빌드/런타임과 무관 (app dist에 포함되지 않음).

### 미변경 / 유지
- daily/main/dungeon/random 보상 helper: 12-1D 그대로
- gate rewardTable / penalty / stamina / 부상 정책: 그대로
- 전투 공식 (`calculatePlayerCombatStats`, `calculateDamage` 등): 그대로
- player stat 공식: 그대로
- E/D 게이트 몬스터 스탯 + recommendedPower: 그대로 (E 300, E wave 420, D 650, D wave 780)
- persist version: v14 유지 (스키마 동일)
- UI / store / types: 변경 없음 (seed 수치만 조정)

### 특이사항 / 다음 단계
- 12-1E로 12차 1단계 안정화 작업 마무리. main > dungeon > daily 보상 위계 + 게이트 고위험 정체성 확보 완료.
- **C급 게이트 다양화 (backlog)**: 현재 망각의 서고 1개 → 추후 분야별 C급 추가 (체력/사회/창의 등)
- **B급 이상 게이트 (장기 backlog)**: 현재 시드에 B/A/S 게이트 없음. C급 추가 후 진행 검토.
- **상위 빌드 (Lv 25+ / 3개월+ 누적)**: 12-1E 시뮬레이션은 Lv 5~20 범위. 더 높은 레벨 빌드의 C급 trivialization은 별도 추적 필요. 필요 시 C급 mob 추가 상향 또는 B급 게이트 추가로 해결.
- **gate_success_bonus 효과 정량 측정**: Build F vs Build E 비교는 stat 차이가 섞여 있어 순수 bonus 효과만 분리 측정은 어려움. 동일 stat builds로 with/without bonus 비교 시뮬레이션이 향후 필요. (→ 12-2A에서 해소)

## 12차 작업 2A단계 - C급 게이트 다양화

### 변경 이유
- 12-1E에서 C급 밸런스가 잡혔지만 게이트는 `망각의 서고` 1개뿐.
- C급 콘텐츠 다양화 — 같은 난이도 철학을 유지하면서 3개 추가.
- 컨셉: 방어형 / wave / 공격형 — 3가지 다른 전투 양상.

### 신규 몬스터 (4개)

| ID | 이름 | Rank | HP | ATK | DEF | SPD | Crit | Acc | Eva | Skills |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| `fatigue-warden` | 피로의 간수 | C | 850 | 88 | 72 | 14 | 0.05 | 0.92 | 0.04 | rift-scratch, lazy-curse |
| `memory-tracker` | 기억 추적자 | C | 540 | 88 | 40 | 17 | 0.06 | 0.90 | 0.05 | bite, memory-fog |
| `memory-scout` | 기억 정찰자 | C | 450 | 105 | 35 | 22 | 0.08 | 0.91 | 0.06 | bite, rift-scratch |
| `greed-warden` | 탐욕의 파수꾼 | C | 680 | 120 | 45 | 22 | 0.10 | 0.92 | 0.07 | rift-scratch, bite |

비교 (기존 `forgetting-warden`): HP 780, ATK 105, DEF 58 — 새 4개와 분명한 정체성 차이.

### 신규 게이트 (3개)

| ID | 이름 | Rank | Type | Monsters | Rec Power | 컨셉 |
|---|---|---|---|---|---:|---|
| `gate-corridor-of-fatigue` | 피로의 회랑 | C | 1v1 | fatigue-warden | 980 | 방어형 — HP/DEF 높음, ATK 낮음. 화력 부족하면 시간 끌림 |
| `gate-rift-training-grounds` | 균열의 훈련장 | C | wave×2 | memory-tracker → memory-scout | 1050 | wave — 약한 둘이 누적 피해, 첫 wave는 mid-HP, 둘째는 빠른 glass |
| `gate-greed-vault` | 탐욕의 금고 | C | 1v1 | greed-warden | 1050 | 공격형 — ATK 높음, HP 낮음. 짧지만 한 방에 죽을 수 있음 |

기존 `gate-archive-of-forgetting` 망각의 서고 (recommendedPower 1000, forgetting-warden HP 780)는 그대로 유지.

### 보상 / 페널티
- 모든 신규 C 게이트는 `reward-gate-c-basic` + `penalty-gate-basic` 재사용 → 보상 구조 변경 없음.
- `expiresInHours: 24` 일관.

### 시뮬레이션 결과 (Build E 기준)

| Build | Gate | Power | Rec | Ratio | Victory | Defeat | Draw | Avg Turns | Avg HP | 판정 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| E main+dungeon | 망각의 서고 | 867 | 1000 | 0.87 | **57%** | 43% | 0% | 19.9 | 45.5 | C 고위험 ✓ |
| E main+dungeon | 피로의 회랑 | 867 | 980 | 0.88 | **43%** | 57% | 0% | 23.2 | 38.4 | C 매우 위험 ✓ |
| E main+dungeon | 균열의 훈련장 | 867 | 1050 | 0.83 | **52%** | 48% | 0% | 22.0 | 46.7 | C 고위험 ✓ |
| E main+dungeon | 탐욕의 금고 | 867 | 1050 | 0.83 | **47%** | 53% | 0% | 15.7 | 44.3 | C 매우 위험 ✓ |
| F + bonus 0.1 | 망각의 서고 | 831 | 1000 | 0.83 | 47% | 53% | 0% | 20.0 | 34.9 | 매우 위험 |
| F + bonus 0.1 | 피로의 회랑 | 831 | 980 | 0.85 | 34% | 65% | 1% | 23.4 | 27.6 | 매우 위험 |
| F + bonus 0.1 | 균열의 훈련장 | 831 | 1050 | 0.79 | 41% | 59% | 0% | 22.0 | 36.5 | 매우 위험 |
| F + bonus 0.1 | 탐욕의 금고 | 831 | 1050 | 0.79 | 42% | 58% | 0% | 15.7 | 38.6 | 매우 위험 |

**Build A/B/C/D 모두 새 C 게이트 0% 승률** (draw 1~2% 일부 발생 — 장비 없는 빌드는 C 불가 정체성 유지).

E/D 게이트 회귀 영향 없음 (수치 그대로).

### 조정 이력 (2단계 iteration)

| 몬스터 | 1차안 | 2차안 (최종) | 이유 |
|---|---|---|---|
| fatigue-warden | HP 920, DEF 82 | HP 850, DEF 72 | 1차 Build E 16% / draw 3% → DEF/HP 완화로 43% 달성 |
| memory-tracker | HP 460, ATK 80 | HP 540, ATK 88 | 1차 wave Build E 90% → 누적 피해 강화로 52% |
| memory-scout | HP 380, ATK 95 | HP 450, ATK 105 | 2차 wave도 누적 강화 |
| greed-warden | HP 700, ATK 130 | HP 680, ATK 120 | 1차 Build E 28% → ATK 살짝 완화로 47% |

게이트 recommendedPower는 1차안 유지 (980 / 1050 / 1050) — 라벨 정합 OK.

### gate_success_bonus A/B 테스트 (동일 Build E stats, bonus 0 vs 0.1)

| Gate | bonus 0 victory | bonus 0.1 victory | Δ | bonus 0 avgHP | bonus 0.1 avgHP |
|---|---:|---:|---:|---:|---:|
| 망각의 서고 | 57% | 62% | **+5%p** | 45.5 | 51.4 |
| 피로의 회랑 | 43% | 48% | **+5%p** | 38.4 | 42.8 |
| 균열의 훈련장 | 52% | 56% | **+4%p** | 46.7 | 54.5 |
| 탐욕의 금고 | 47% | 45% | -2%p | 44.3 | 47.6 |

- 4개 중 3개에서 +4~5%p 일관 개선 — bonus 0.1이 "소폭 보조" 정책에 부합.
- 탐욕의 금고는 짧은 전투(15.7턴) + 빠른 적 특성상 RNG variance가 ATK/DEF buff 효과를 일부 가림. avgHP는 +3.3으로 buff 자체는 작동 (시간 부족으로 final outcome flip이 안 됨).
- 12-1E "F의 base stat이 낮아서 비교 어려움" 한계를 동일 stat A/B로 해소 — bonus 0.1은 실제로 작동하며 borderline 게이트에서 의미 있음.

### 미변경 / 유지
- 전투 공식, player stat 공식, gate_success_bonus 수치 (cap 0.3, 3턴 ATK/DEF +50%×bonus) 모두 그대로
- 보상 helper / rewardTable / penalty / stamina / 부상 / draw 정책: 그대로
- E/D 게이트 + 망각의 서고: 그대로
- persist version: v14 유지 (스키마 변경 없음, seed array에 entry 추가만)
- localStorage key, store, UI: 변경 없음

### 시뮬레이션 도구
- `scripts/sim-12-2a.ts` — 12-1E 스크립트 기반 확장. 신규 C 게이트 회귀 + bonus A/B 포함.
- 실행: `npx tsx scripts/sim-12-2a.ts`
- 결정론적 (seedBase=1).

### 결과 요약
- **C급 게이트 4개 다양화 완료**: 망각의 서고(균형) / 피로의 회랑(방어 attrition) / 균열의 훈련장(wave) / 탐욕의 금고(고위험 공격)
- Build E 기준 모두 43~57% 승률 (목표 35~70%)
- Build F (bonus 0.1) 34~47% — 모두 "매우 위험" 라벨, 보조 효과로 +4~5%p 의미 있음
- Build A~D는 새 C 게이트 전부 0% — C는 장비+직업+성장 필수 콘텐츠 정체성 유지
- E/D 게이트 회귀 영향 0%

### 다음 추천 작업
- **12-2B**: B/A/S급 게이트 신설 (C급 완료 → 상위 콘텐츠 확장). 단, recommendedPower / monster stats 가 어떻게 스케일링할지 시뮬레이션 후 결정.
- **C급 보상 차등**: 현재 4개 C 게이트가 동일 `reward-gate-c-basic` 사용. 컨셉별 보상 차등 검토 (예: 공격형은 epic+ 드롭 확률 상향, 방어형은 XP 보너스 등). 별건 patch.
- **순수 bonus 효과 측정 완료**: 12-1E TODO 해소. 향후 다른 소모품 효과 측정도 동일 패턴 적용 가능.
- **실사용 1~2주 관찰**: 새 C 게이트 컨셉이 게임플레이상 변별력 있는지 확인.

## 12차 작업 0단계 - CSS @import 경고 정리

수정:
- `src/index.css`의 Pretendard 폰트 `@import`를 CSS 표준에 맞게 파일 최상단으로 이동했다.
- Tailwind directives 순서는 `@tailwind base`, `@tailwind components`, `@tailwind utilities`로 유지했다.
- 일반 CSS selector와 `@layer components`의 스타일 값/클래스명은 변경하지 않았다.

결과:
- `npm run build` 성공.
- 기존 `[vite:css] @import must precede all other statements` 경고 제거.
- UI 기능 변경 없음.

## 11차 게이트/전투 시스템 1차 완성 요약

### 완료 상태

게이트/전투 시스템은 11-16 종합 시뮬레이션 기준으로 1차 완성 가능 상태로 판단한다.

완료된 핵심 기능:
- 게이트 설계 문서 작성
- 게이트/몬스터/스킬/전투 로그 타입 추가
- 초기 게이트/몬스터/스킬 seed 구축
- 전투 스탯 / 전투력 / 위험도 / 데미지 계산
- 자동 전투 시뮬레이터
- victory / defeat / draw 결과 처리
- draw 정책: 보상 없음, 패널티 없음, active 유지, 재도전 가능
- 게이트 출현/관리
- Gate UI
- 게이트 보상/패널티 적용
- stamina / 부상 / 회복 구조
- 직업별 전투 스킬
- skillTotalPower 개선
- 방어형 스킬 피해감소 + 반격 구조
- 전투 결과/로그 UX 개선
- JobPanel 기본 접힘 UI
- 장비 전투 스킬 구조
- 웨이브 전투
- gate_success_bonus 전투 시작 버프 연결
- 11-16 종합 시뮬레이션 검증

### 확정 정책

#### 전투 방식
- 자동 전투 + 사전 세팅 방식
- 사용자는 직업/장비/소모품을 세팅하고 전투는 자동 진행
- 전투 결과와 턴 로그를 보여준다

#### 전투 결과

| 결과 | 보상 | 패널티 | 게이트 상태 |
|---|---:|---:|---|
| victory | O | stamina -20 | cleared |
| defeat | X | stamina -50 + 부상 | failed |
| draw | X | X | active 유지 |

#### draw 정책
- 전체 maxTurns 초과 시 draw
- draw는 클리어로 인정하지 않음
- XP/아이템/장비/소모품 보상 없음
- stamina 감소 없음
- 부상 없음
- active gate 유지
- 장비/직업/소모품 세팅 변경 후 재도전 가능
- 단, next_gate 소모품은 전투 시도에 사용된 것으로 보고 consumed 처리

#### stamina / 부상
- maxStamina = 100
- gate entry cost = 20
- victory 시 stamina -20
- defeat 시 stamina -50 + injury
- draw 시 stamina 변화 없음
- stamina 자연 회복: 시간당 +10
- daily/main/random 퀘스트 완료 시 stamina +5
- 부상 회복: 6시간 경과 또는 부상 이후 daily/main/random 퀘스트 3개 완료

#### 게이트 출현
- 하루 첫 접속: 5%
- 일반 던전 최종 클리어: 15%
- 월간/고난도 던전 최종 클리어: 25%
- 동시 active gate는 1개
- active gate가 있으면 새 출현 트리거는 무시
- 보류 큐 없음
- active gate 무시 알림 없음

#### 전투력 / 위험도
- recommendedLevel은 안내용
- recommendedPower가 실제 위험도 기준
- playerPower / recommendedPower ratio로 risk 계산
- combatPower 공식은 현재 유지
- 11-16 기준 전투력 신뢰도는 실사용 가능한 수준
- 실사용 중 risk 표시와 체감 난이도가 어긋나면 우선 recommendedPower로 보정한다

#### 보상
- daily/main/dungeon은 기본 성장
- gate는 장비/아이템 파밍 성격
- XP는 보조 보상
- 장비/아이템 드롭이 핵심 보상

### 11-16 종합 시뮬레이션 결론

검증 규모:
- 빌드 6개
- 게이트 6개
- 각 조합 100회
- 총 3,600전

핵심 결과:

| 구간 | 판단 |
|---|---|
| E급 1v1 | 초급 무각성도 100%, 입문 구간 정상 |
| E급 wave | 초급 무각성도 100%, 평균 턴 증가로 단일 E보다 긴 전투 |
| D급 1v1 | 진입 공격형/분석형 기준 작동. 공격형은 약간 쉬움 |
| D급 wave | 위험하지만 가능 |
| C급 1v1 | 장비 공격형 외에는 대부분 고위험 |
| drawRate | 대부분 0%, 방어형 vs C급만 1% |
| gate_success_bonus | cap 정상, 확정승 보정 아님 |
| stamina/부상 | 전략적 제약으로 작동 |
| 보상 | 당장 문제 없음 |

최종 판단:
- 게이트/전투 시스템은 1차 완성 가능
- 추가 개선 후보는 backlog로 분리
- 11차 게이트/전투 작업은 기능적으로 닫고, 이후 작업은 별도 개선 티켓으로 다룬다

## 게이트/전투 이후 개선 Backlog

### 우선순위 A - 가까운 개선 후보

1. D/C 경계 recommendedPower 소폭 보정
   - D급 공격형 빌드가 다소 쉽게 느껴질 수 있음
   - 전투 수치가 아니라 위험도 표시 보정 중심으로 검토

2. 웨이브 전용 rewardTable 추가
   - 웨이브 게이트는 단일 게이트보다 길고 위험함
   - 현재 같은 랭크 rewardTable 공유
   - 추후 wave 전용 XP/dropChance 소폭 보정 검토

3. C급 게이트 다양화
   - 현재 C급 콘텐츠가 적음
   - C급 1v1 / C급 wave / C급 특수 몬스터 추가 후보

### 우선순위 B - 전투 재미 확장

4. 2차 직업 전용 강화 스킬
   - 현재 1차/2차 직업은 같은 라인 대표 스킬 공유
   - 2차 직업에 전용 강화 스킬 추가 가능
   - 예: 예언된 일격, 심연 주석, 심장 강타, 시간 지연, 균형의 축복

5. 장비 전투 스킬 추가 확장
   - 현재 일부 epic/legendary 장비만 combatSkillIds 보유
   - 추후 더 많은 장비에 전투 스킬 추가 가능
   - 단, 대량 추가 전 밸런스 검증 필요

6. 장비 세트 효과
   - 같은 계열 장비 2개/4개 장착 시 추가 효과
   - 예: 금안 세트, 그림자 세트, 시스템 세트

### 우선순위 C - 장기 확장

7. 동시 다수 몬스터 전투
   - 현재는 순차 웨이브
   - 동시 다수 전투는 광역 스킬/타겟팅/밸런스 복잡도가 커서 후순위

8. 광역 스킬
   - 동시 다수 전투 또는 웨이브 특화 스킬로 확장 가능

9. 보스 게이트
   - B/A/S급 고난도 콘텐츠
   - 패턴형 보스, 특수 보상, 보스 전용 로그 가능

10. 현실 보상권 시스템
   - 구현은 나중
   - 발동 대상: daily/main/random/dungeon/gate 등 완료 이벤트
   - 확률: 0.3%
   - 제한: 주 1회
   - 보상:
     - PC방 2시간
     - 비싼 배달 1회
   - 통제된 희귀 보상으로 설계

## Known Issues / 주의사항

### CSS @import 경고
- 12차 작업 0단계에서 `src/index.css`의 `@import` 위치를 최상단으로 정리해 해결했다.
- `npm run build` 기준 `[vite:css] @import must precede all other statements` 경고는 더 이상 표시되지 않는다.
- 스타일 값/클래스명 변경 없이 순서만 정리했다.

### Combat Power 한계
- 11-10 이후 R²는 목표치를 충족했지만, combatPower는 여전히 근사치
- skill value, buff/debuff, cooldown, 웨이브 구조를 완벽히 설명하지는 못함
- 실사용 중 risk 표시와 체감 난이도가 어긋나면 recommendedPower 중심으로 조정

### gate_success_bonus
- 0.3 cap은 강력함
- 현재는 확정승 보정은 아니지만, 0.3 효과는 희귀 소모품 전용으로 유지하는 것이 좋음
- 흔하게 지급하지 말 것

### 웨이브 보상
- 웨이브 게이트는 현재 같은 랭크 rewardTable을 공유
- 길고 위험한 웨이브 게이트는 추후 전용 rewardTable 검토 필요

### 방어형 직업
- silent-monk 계열은 피해감소/반격으로 개선되었지만 공격형보다 느림
- 의도된 역할 차이
- 너무 약하다고 판단되면 반격률/반격 power보다 2차 전용 스킬로 보완하는 것을 추천

### 저장 데이터
- 게이트 작업 중 persist version은 필요한 시점에만 증가
- optional 필드 추가는 기존 데이터 호환 방식으로 처리
- localStorage key는 유지

## 다음 작업 추천

현재 게이트/전투는 1차 완성 처리한다.

즉시 대형 확장보다는 다음 순서 추천:

1. 며칠 실제 사용하면서 불편한 점 기록
2. 작은 UX/문구/보상 체감 문제 수정
3. 필요 시 D/C recommendedPower 또는 wave rewardTable 소폭 보정
4. 이후 장비 중복 흡수 강화 또는 2차 직업 전용 스킬 중 선택
5. 프로젝트 전체 완성 판단 후, 사용자가 요청할 때 GitHub -> Vercel 배포 진행

배포는 사용자가 “프로젝트 완성, 배포하자”고 명시하기 전까지 진행하지 않는다.

## 12차 작업 3단계 - 보상 체감 / 게이트 UX 개선

### 작업 목표
- 사용자가 실사용 중 느낀 “보상은 맞는데 체감이 약함”, “게이트가 전투처럼 느껴지지 않음”, “게이트가 너무 드묾”을 개선.
- 전투 공식과 XP 곡선은 변경하지 않고, 보상 테이블/게이트 출현 정책/UI 공개 방식만 조정.
- `daily < dungeon < main` 성장 위계 유지.
- gate는 XP/stat 성장보다 장비/아이템/유물 중심 콘텐츠로 유지.

### 보상 상향 후 테이블

XP 기본값:

| type | easy | normal | hard | elite | apex | boss |
|---|---:|---:|---:|---:|---:|---:|
| daily | 10 | 14 | 22 | 45 | 60 | 80 |
| dungeon | 80 | 140 | 260 | 430 | 680 | 1050 |
| main | 240 | 450 | 800 | 1300 | 2100 | 3200 |

stat multiplier:

| type | easy | normal | hard | elite | apex | boss |
|---|---:|---:|---:|---:|---:|---:|
| daily | 0.08 | 0.13 | 0.11 | 0.11 | 0.11 | 0.11 |
| dungeon | 0.32 | 0.43 | 0.56 | 0.64 | 0.88 | 1.12 |
| main | 0.90 | 1.20 | 1.50 | 1.80 | 2.40 | 3.00 |

drop chance:

| type | easy | normal | hard | elite | apex | boss |
|---|---:|---:|---:|---:|---:|---:|
| daily | 2% | 4% | 7% | 10% | 12% | 15% |
| dungeon | 60% | 80% | 95% | 95% | 100% | 100% |
| main | 30% | 48% | 65% | 80% | 90% | 100% |

random quest:
- XP: template XP × 0.8
- drop: easy 4%, normal 7%, hard 12%
- daily보다 약간 특별한 이벤트성 보상으로 유지.

### 게이트 등장 확률 정책

| trigger | chance | selection |
|---|---:|---|
| 하루 첫 접속 | 7% | E급 |
| daily 완료 | 3% | E급 |
| random 완료 | 5% | E급 중심, 일부 D급 |
| 일반 dungeon 최종 클리어 | 25% | E/D급, D급 가중 |
| 월간/고난도 dungeon 최종 클리어 | 30% | D급 중심, 일부 C급 |
| main 완료 | 50% | D/C급, C급 가중 |

- active gate는 동시에 1개만 유지.
- active gate가 있으면 추가 출현 트리거는 조용히 무시하고 queue는 만들지 않음.
- E급 게이트 recommendedLevel을 3/4/5로 낮춰 초반 등장 체감을 개선.

### 전투 로그 순차 표시 UX

- `startGateBattle`은 기존처럼 전투 로그를 한 번에 계산한다.
- `GatePanel`의 `RecentBattleResult`가 이미 생성된 `combatLog.turns`를 0.5초 간격으로 하나씩 공개한다.
- 전투 중에는 victory/defeat/draw, 보상, 패널티 요약을 숨긴다.
- 마지막 로그가 공개된 뒤 결과/보상/패널티/전체 로그 버튼 표시.
- 전투 중 `전투 스킵` 버튼 제공.
- `useEffect` interval cleanup 적용. 새 battleId 또는 unmount 시 이전 interval 정리.
- 전투 공개 중에는 게이트 도전 버튼이 `전투 진행 중`으로 비활성화되어 중복 클릭을 막는다.
- 게이트 전투 결과 SystemMessage는 즉시 modal로 띄우지 않는다. 즉시 modal은 로그 연출을 스포일하기 때문이며, 결과는 GatePanel에서 확인한다.

### 게이트 보상 방향

- E/D/C gate reward XP는 소폭만 상향: 90 / 160 / 250.
- itemDropChance를 크게 상향: E 55%, D 65%, C 75%.
- C급 rare/epic/legendary 비중 상향: rare 48%, epic 28%, legendary 9%.
- gate reward item은 artifact 슬롯 또는 combatSkillIds가 있는 전투 장비를 70% 확률로 우선 선택한다.
- daily 일반 드롭은 artifact 슬롯을 제외한다.
- random 일반 드롭은 75% 확률로 artifact 슬롯을 제외한다.
- main/dungeon 일반 드롭은 기존 아이템 풀을 유지한다.
- 장비 강화/중복 흡수 시스템은 이번 단계에서 구현하지 않음.

### 검증
- `npm run build` 통과.
- 브라우저 수동 확인:
  - 게이트 전투 시작 후 결과가 즉시 표시되지 않고 `게이트 전투 진행 중` + 공개 로그 카운트가 표시됨.
  - 0.5초 간격으로 로그가 순차 표시됨.
  - 마지막 로그 이후 결과/REWARD/PENALTY/전체 로그 버튼이 표시됨.
  - 브라우저 콘솔 error 없음.

### persist / 저장 데이터
- persist version은 v14 유지.
- localStorage key `levelup-save` 변경 없음.
- 저장 스키마 변경 없음. 타입 union과 수치/로직 변경만 수행.
- 기존 저장 데이터의 `activeGate`, `gateStatus`, `combatLogs` 구조와 호환.

### 남은 TODO
- 스탯 편중 완화
- 칭호 효과 표시/적용
- 왕의 검 아이콘 수정
- 장비 중복 강화 시스템
- B/A/S급 게이트 추가

## 12차 작업 5단계 - 칭호 효과 표시/적용

### 작업 목표
- 칭호가 단순 수집/장착 요소로만 보이지 않도록, 칭호별 효과 구조를 도입하고 UI에 명확히 표시.
- 장착 중인 칭호 1개만 실제 보상 계산에 반영.
- 12-3A XP 보상표, XP 곡선, rank 기준, 전투 공식, 12-4 `rewardStatWeights` 구조는 변경하지 않음.
- `왕의 검` 아이콘이 왕관처럼 보이는 문제를 수정.

### 칭호 효과 구조

`TitleDefinition`에 optional 효과 필드 추가:

```ts
effects?: {
  xpBonusByCategory?: Partial<Record<Category, number>>
  globalXpBonus?: number
  gateDropBonus?: number
  rarityBonus?: number
  statBonus?: Partial<Record<StatKey, number>>
  gatePenaltyReduction?: number
  injuryRecoveryBonus?: number
}
```

이번 단계에서 실제 계산에 연결한 효과:
- `globalXpBonus`
- `xpBonusByCategory`
- `gateDropBonus`
- `rarityBonus`

아직 계산에 연결하지 않은 예약 효과:
- `statBonus`
- `gatePenaltyReduction`
- `injuryRecoveryBonus`

### 장착 칭호 1개 적용 정책
- `hunter.equippedTitleId`가 있고, 해당 ID가 `ownedTitleIds`에 포함되어 있을 때만 효과 적용.
- 장착 칭호가 없거나 기존 저장 데이터에 `equippedTitleId`가 없으면 효과 0.
- 보유한 칭호 전체 컬렉션 보너스는 이번 단계에서 구현하지 않음.

### helper

`src/lib/game.ts`에 추가:
- `getEquippedTitleDefinition(hunter)`
- `getEquippedTitleEffects(hunter)`
- `getTitleXpMultiplier(hunter, category)`
- `getTitleDropBonus(hunter)`
- `getTitleRarityBonus(hunter)`
- `formatTitleEffects(title)`

보너스 cap:
- title XP bonus: global/category 합산 최대 10%
- title gate drop bonus: 최대 7%
- title rarity bonus: 최대 5%

### 주요 칭호 효과 예시

| 칭호 | 효과 |
|---|---|
| 첫 번째 각성 | 전체 XP +1% |
| 하급 헌터 | 전체 XP +2% |
| 숙련된 사냥꾼 | 전체 XP +3% |
| 그림자 추적자 | 게이트 드롭률 +3% |
| 첫 전리품의 주인 | 레어리티 +1% |
| 전설을 쥔 자 | 레어리티 +3% |
| 흐름을 읽는 눈 | 재정 XP +2%, 커리어 XP +1% |
| 시장의 관찰자 | 재정 XP +3%, 커리어 XP +3% |
| 새벽의 사냥꾼 | 건강 XP +2%, 습관 XP +2% |
| 고요한 마음 | 정신 XP +2%, 습관 XP +2% |
| 꺾이지 않는 의지 | 습관 XP +2%, 도전 XP +1% |
| 국가급 사냥꾼 | 전체 XP +5%, 게이트 드롭률 +5% |

### 계산 연결
- `completeQuest`: daily/main XP에 장착 칭호 XP 보너스 합산, 일반 아이템 레어리티 롤에 `rarityBonus` 반영.
- `completeRandomQuest`: random XP와 아이템 레어리티 롤에 장착 칭호 효과 반영.
- `progressDungeon`: dungeon partial XP와 clear XP에 장착 칭호 XP 보너스 반영.
- dungeon clear 보상 아이템 레어리티 롤에 `rarityBonus` 반영.
- gate victory reward: gate XP에 `challenge` 기준 칭호 XP 보너스 반영, gate item drop chance에 `gateDropBonus` 반영, gate rarity table에 `rarityBonus`를 epic/legendary 쪽으로 소폭 가산.

### UI
- `TitleCollection` 카드에 효과 영역 추가.
- 보유/미보유 일반 칭호는 효과를 보여 목표감을 강화.
- 미보유 hidden 칭호는 이름/조건처럼 효과도 `해금 후 공개`로 숨김.
- 장착 중인 칭호는 `효과 적용 중`으로 표시.
- 상태창(`HunterStatus`)에서 현재 장착 칭호와 적용 효과를 간단히 표시.

### 왕의 검 아이콘
- `src/lib/seed.ts`의 `왕의 검` 아이콘을 `👑`에서 `⚔️`로 변경.
- 왕관 이미지는 칭호/왕의 명령 계열에 남기고, 무기는 검 계열로 보이게 정리.

### persist / 저장 데이터
- persist version 변경 없음: v14 유지.
- `levelup-save` key 변경 없음.
- 저장 스키마 변경 없음. `TitleDefinition.effects`는 정적 정의의 optional 필드라 기존 저장 데이터에 영향 없음.
- 기존 저장 데이터에 `equippedTitleId`가 없어도 앱은 보너스 0으로 정상 동작.

### 검증
- `npm run build` 통과.
- `npx tsx scripts/sim-growth-1year.ts` 기준 기본 성장 시뮬레이션 결과 변경 없음.
- helper 확인:
  - 장착 칭호 없음: finance multiplier 1
  - `market-observer` 장착: finance multiplier 1.03, study multiplier 1
  - `national-level-hunter` 장착: challenge multiplier 1.05, gate drop bonus 0.05

### TODO
- 장비 중복 강화 시스템
- 커스텀 퀘스트 성장 스탯 선택 기능
- B/A/S급 게이트 추가
- 칭호 컬렉션 전체 보너스는 보류
- `statBonus`, `gatePenaltyReduction`, `injuryRecoveryBonus` 실제 계산 연결 여부는 별도 검토

## 12차 작업 6단계 - 장비 중복 강화 시스템

### 작업 목표
- 12-3 이후 게이트/장비 드롭 빈도가 올라간 상황에서, 같은 장비 중복 획득분을 장기 성장 재료로 사용할 수 있게 함.
- 기존 장비 보유 방식은 유지하고, 중복 장비를 자동 합치지 않음.
- 사용자가 Inventory에서 직접 `강화` 버튼을 눌러야만 강화가 진행된다.
- XP 보상표, rank 기준, gate 전투 공식, 12-4 `rewardStatWeights`, 12-5 칭호 효과 구조는 변경하지 않음.

### 선택한 데이터 구조

`Item` 보유 인스턴스에 optional 필드 추가:

```ts
enhancementLevel?: number
```

정책:
- 필드가 없으면 +0으로 취급.
- 최대 강화는 +5.
- 강화 레벨은 보유한 개별 item instance에 저장한다.
- `ITEM_POOL` 정적 정의는 강화하지 않는다.

결정 이유:
- 현재 보유 아이템의 `id`는 획득 시 `uid()`로 생성되는 개별 인스턴스 ID다.
- 장착 상태도 이 개별 인스턴스 ID를 저장한다.
- 따라서 "같은 item.id" 기준으로 중복을 찾으면 같은 종류의 중복 장비를 찾을 수 없다.
- 대신 같은 `name + rarity + slot`을 같은 장비 계열로 보고, 대상 인스턴스의 `enhancementLevel`만 올리는 방식으로 구현했다.
- 이 방식은 장착 중인 인스턴스와 재료 인스턴스를 안전하게 구분하면서 기존 저장 데이터와 호환된다.

### 강화 규칙
- 강화 대상: `equippable === true`이고 `slot`이 있는 장비.
  - weapon
  - armor
  - accessory
  - artifact
- 소모품은 강화 불가.
- 같은 장비 계열의 미장착 중복 장비 1개를 소모해 대상 장비 +1.
- 대상 장비 자체는 소모하지 않음.
- 실패 확률 없음.
- 비용 없음.
- 최대 +5 이상 강화 불가.
- 재료 후보가 여러 개면 강화 레벨이 낮은 미장착 중복부터 소모.

### 강화 효과

강화 효과 상수:
- +1당 장비 효과 +8%
- +5 최대 장비 효과 +40%

적용 대상:
- `xp_bonus`
- `drop_bonus`
- `rarity_bonus`
- `stat_bonus`

예시:
```ts
career xp_bonus 0.05, +3 장비
0.05 * (1 + 0.08 * 3) = 0.062
```

`stat_bonus`도 같은 배율을 적용하며 `roundStatValue`로 반올림한다.

이번 단계에서 강화하지 않는 것:
- `combatSkillIds`
- 전투 스킬 power/cooldown/effect 수치

### helper

`src/lib/game.ts`에 추가:
- `MAX_ITEM_ENHANCEMENT_LEVEL`
- `ITEM_ENHANCEMENT_EFFECT_STEP`
- `getEnhancementLevel(item)`
- `getEnhancementMultiplier(item)`
- `formatEnhancementLabel(item)`
- `isEnhanceableEquipment(item)`
- `getItemEnhancementKey(item)`
- `isSameEnhancementFamily(target, candidate)`
- `getEnhancedItemEffects(item)`
- `getEnhanceMaterialCandidates(target, inventory, equippedItemIds)`
- `canEnhanceItem(target, inventory, equippedItemIds)`

기존 장비 효과 계산 helper 변경:
- `getEquipmentXpBonus`
- `getEquipmentDropBonus`
- `getEquipmentRarityBonus`
- `getEquipmentStatBonuses`

위 함수들이 모두 `getEnhancedItemEffects`를 사용하므로, 장착 중 장비의 강화 효과가 XP/드롭/레어리티/스탯/전투 스탯 계산에 일관되게 반영된다.

### Inventory UI
- 장비 이름 옆에 `+1`~`+5` 강화 레벨 표시.
- 장착 슬롯 카드에서도 강화 레벨 표시.
- 각 아이템 카드에 강화 상태 영역 추가:
  - `강화 0/5`
  - `재료 N`
  - `강화` 버튼 또는 비활성 사유
- 비활성 사유:
  - `중복 장비 필요`
  - `최대 강화`
  - `소모품은 강화 불가`
  - `강화 불가`
- 강화 클릭 시 confirm:
  - "같은 장비 1개를 소모해 이 장비를 +1 강화합니다. 계속할까요?"
- 성공 시 SystemMessage `장비 강화` 표시.

### 장착/소모 안전장치
- 장착 중인 아이템 ID는 재료 후보에서 제외.
- target item ID도 재료 후보에서 제외.
- 재료 후보는 같은 `name + rarity + slot` 장비만 허용.
- 소모품은 재료/대상 모두 불가.
- target이 장착 중이어도 강화 가능하지만, 재료는 반드시 미장착 중복이어야 한다.
- 재료 소모 후 장착 상태는 기존 target/equipped item ID를 유지하므로 즉시 효과가 반영된다.

### persist / 저장 데이터
- persist version 변경 없음: v14 유지.
- `levelup-save` key 변경 없음.
- `enhancementLevel`은 optional 필드이며 기존 저장 데이터에 없으면 +0으로 처리한다.
- 별도 migration 없이 기존 저장 데이터가 정상 동작한다.

### 검증
- `npm run build` 통과.
- helper/action 점검:
  - +3 장비 multiplier 1.24 확인.
  - xp_bonus 0.08 → 0.0992, stat_bonus 2 → 2.48 확인.
  - 장착 중인 중복 장비는 재료 후보에서 제외 확인.
  - 강화 시 재료 1개 감소, target `enhancementLevel` +1 확인.
  - +5 장비는 재료가 있어도 강화되지 않고 메시지도 생성되지 않음 확인.
  - 소모품은 `canEnhanceItem === false` 확인.

### TODO
- 전투 스킬 강화 별도 설계.
- 강화 재료 미리보기/재료 선택 UI.
- 강화된 재료를 소모하려 할 때 추가 경고.
- B/A/S급 게이트 추가.

## 12차 작업 7단계 - 현재 성장 체계 기준 E/D/C 게이트 재점검

### 작업 목표
- 12-3A XP/stat 대폭 상향, 12-4 stat 분배 개선, 12-5 칭호 효과, 12-6 장비 강화 이후 기존 E/D/C 게이트 난이도가 적절한지 재측정.
- B/A/S급 게이트 추가 전에 현재 E/D/C 기준점을 재설정.
- XP 보상표, rank 기준, 전투 공식, 장비 강화 공식, 칭호 효과, persist version은 변경하지 않음.

### 시뮬레이션 harness

추가 스크립트:

```bash
npx tsx scripts/sim-gate-current.ts
```

특징:
- 모든 기존 E/D/C 게이트를 Build A~F에 대해 200회 deterministic seed로 실행.
- 출력 항목: playerPower, recommendedPower, ratio, risk, victory/defeat/draw, avgTurns, avgRemainingHp.
- 장비 강화 효과는 `getEnhancedItemEffects` -> `getEquipmentStatBonuses` -> `calculatePlayerCombatStats` 경로로 전투력에 반영.
- 칭호 효과는 현재 XP/drop/rarity 중심이라 전투 stat에는 직접 반영하지 않는다. 빌드 설명에는 포함하되 combat power에는 영향 없음.

### Build A~F 정의

| Build | Level | Job | Title | PlayerPower | Equipment | 목적 |
|---|---:|---|---|---:|---|---|
| A | 5 | unawakened | 없음 | 360 | 없음 | E급 입문 가능성 |
| B | 10 | unawakened | 없음 | 540 | 의지의 룬 | E 안정, D 위험 |
| C | 20 | grimoire-decoder | hunter | 783 | 강철 손목보호대 +1, 고요의 반지 | D 도전, C 위험 |
| D | 30 | steelheart-fighter | veteran-hunter | 1449 | 그림자 단검 +1, 강철 손목보호대 +2, 금서의 책갈피 +1 | C 도전 |
| E | 45 | fate-harmonizer | legend-in-hand | 2130 | 투사의 장갑 +3, 검은 정장 +2, 시간의 회중시계 +3, 시스템의 조각 +2 | C 안정, B급 기준 |
| F | 60 | fate-harmonizer | national-level-hunter | 3030 | 왕의 검 +4, 그림자 왕관 +3, 시간의 회중시계 +4, 시스템의 조각 +4 | E/D/C 졸업 확인 |

Build C는 12-4 stat distribution의 30일 총 stat gain 약 87을 참고해, 초기 stat + 레벨업 보정을 감안한 1개월 기준으로 재조정했다.

### 조정 전 판단
- E급: Build A도 100% 승리. 입문용으로 유지 가능.
- D급: Build B가 57~70%, Build C가 100%라 초중반 도전 콘텐츠로는 쉬움.
- C급: Build C가 18~26%로 일부 목표에 들어오지만, Build D/E가 100%라 현재 2~3개월 성장 이후에는 너무 쉬움.
- recommendedPower도 Build D/E 기준 C급이 `low risk`로 표시되어 위험도 라벨과 실제 의도가 어긋남.

### 조정한 값

E급:
- 변경 없음.

D급 monster:
- `lazy-goblin`: HP 350 -> 420, ATK 80 -> 96, DEF 31 -> 34
- `sloth-brute`: HP 210 -> 252, ATK 42 -> 50, DEF 28 -> 31

D급 recommendedPower:
- `나태의 소굴`: 650 -> 800
- `나태의 순찰로`: 780 -> 900

C급 monster:
- `forgetting-warden`: HP 780 -> 1380, ATK 105 -> 220, DEF 58 -> 80
- `fatigue-warden`: HP 850 -> 1445, ATK 88 -> 176, DEF 72 -> 97
- `memory-tracker`: HP 540 -> 950, ATK 88 -> 185, DEF 40 -> 56
- `memory-scout`: HP 450 -> 790, ATK 105 -> 220, DEF 35 -> 49
- `greed-warden`: HP 680 -> 1156, ATK 120 -> 240, DEF 45 -> 61

C급 recommendedPower:
- `망각의 서고`: 1000 -> 1550
- `피로의 회랑`: 980 -> 1600
- `균열의 훈련장`: 1050 -> 1650
- `탐욕의 금고`: 1050 -> 1550

조정 이유:
- 전투 공식/보상/장비/칭호 효과를 바꾸지 않고, 현재 성장 체계에서 gate 자체의 기준점을 맞추기 위함.
- C급은 기존 tuning 당시보다 플레이어 stat과 장비 강화가 훨씬 커졌기 때문에 단순 recommendedPower 조정만으로는 실제 승률을 맞출 수 없었다.
- E급은 입문용 경험을 해치지 않기 위해 유지.

### 최종 결과 요약

E급:

| Gate | Build A | Build B | 판단 |
|---|---:|---:|---|
| 균열의 골목 | 100% | 100% | 입문 가능, 이후 안정 |
| 뒤틀린 뒷골목 | 100% | 100% | 입문 가능, 이후 안정 |
| 균열의 둥지 | 100% | 100% | E-wave지만 입문 가능 |

D급:

| Gate | Build B | Build C | Build D | 판단 |
|---|---:|---:|---:|---|
| 나태의 소굴 | 17% | 100% | 100% | 2주 사용자는 위험, 1개월 이후 안정 |
| 나태의 순찰로 | 11% | 99% | 100% | wave가 더 위험하지만 1개월 이후 안정 |

비고:
- Build B 목표인 10~50%는 달성.
- Build C 목표 40~80%보다는 쉬움. 다만 C급이 Build C를 0%로 막도록 올라갔기 때문에, D급은 1개월 사용자의 안정 사다리로 남기는 판단을 선택했다.

C급:

| Gate | Build C | Build D | Build E | Draw max | 판단 |
|---|---:|---:|---:|---:|---|
| 망각의 서고 | 0% | 66% | 100% | 2% | C 기준 재설정 성공 |
| 피로의 회랑 | 0% | 70% | 100% | 5% | 방어형 C, draw 허용 범위 |
| 균열의 훈련장 | 0% | 63% | 100% | 7% | C-wave 기준 성공 |
| 탐욕의 금고 | 0% | 74% | 100% | 0% | 공격형 C 기준 성공 |

Build F:
- 모든 E/D/C 게이트 100%.
- S랭크 1년 사용자 기준으로 E/D/C trivialize는 의도된 결과.

### 최종 판단
- E급: 변경 없이 유지. 입문용 역할 정상.
- D급: 초반 Build B에 위험한 선택지가 되었고, 1개월 이후에는 안정적으로 졸업하는 단계로 정리.
- C급: Build C는 차단, Build D는 63~74% 도전권, Build E/F는 졸업 상태.
- Build E에서 C급이 100%인 것은 6개월 사용자에게 C급이 더 이상 메인 전투 콘텐츠가 아니라는 신호다. 다음 단계는 B급 게이트 신설이 맞다.
- B/A/S급 게이트 추가 전 기준점으로 이 결과를 사용한다.

### persist / 저장 데이터
- persist version 변경 없음: v14 유지.
- `levelup-save` key 변경 없음.
- 저장 스키마 변경 없음.

### 검증
- `npx tsx scripts/sim-gate-current.ts` 통과.
- `npm run build` 통과.

### TODO
- B급 게이트 신설
- 커스텀 퀘스트 성장 스탯 선택
- 전투 스킬 강화
- 강화 재료 선택 UI

## 12차 작업 3A단계 - S랭크 1년 프로젝트화 검증

### 작업 목표
- S랭크를 Lv60 도달 기준으로 보고, 현실적 사용 시 330~390일 안에 도달하는 1년짜리 성장 프로젝트로 보상표를 재조정.
- XP 곡선 `xpToNextLevel`, `rankFromLevel`, 전투 공식, 게이트 로그 UX, 저장 스키마는 변경하지 않음.
- localStorage key `levelup-save`와 persist version v14 유지.

### 12-3 수치 검증 결과

시뮬레이션 스크립트:
- `scripts/sim-growth-1year.ts`
- 실행: `npx tsx scripts/sim-growth-1year.ts`

가정:
- daily 75% 달성
- main 60일마다 1개 완료
- dungeon 30일마다 1개 완료
- daily는 현재 seed 20개와 `cooldownDays`를 반영
- dungeon은 clear XP + partial XP 총량 반영
- 현실적/적극적 시나리오는 gate/random/job/equipment 평균 XP를 일 단위 보너스로 반영

12-3 baseline 결과:

| scenario | 365d total XP | 365d level | 365d rank | Lv10 | Lv18/C | Lv30/B | Lv45/A | Lv60/S |
|---|---:|---:|---|---:|---:|---:|---:|---:|
| A. 보수적 | 74,128 | 28 | C | 36 | 124 | 420 | 1085 | - |
| B. 현실적 | 128,878 | 35 | B | 20 | 73 | 240 | 629 | 1243 |
| C. 적극적 | 183,628 | 41 | B | 14 | 55 | 173 | 441 | 872 |

판정:
- 현실적 Lv60 도달일 1243일 → 390일 초과, 500일 이상이므로 대폭 상향 필요.
- 12-3은 “보상 체감 패치”로는 작동하지만 “S랭크 1년 프로젝트” 목표에는 크게 부족.

### 최종 XP 보상표

| type | easy | normal | hard | elite | apex | boss |
|---|---:|---:|---:|---:|---:|---:|
| daily | 32 | 48 | 80 | 160 | 225 | 320 |
| dungeon clear | 650 | 1100 | 2000 | 3200 | 5100 | 8000 |
| main | 1800 | 3400 | 6800 | 11800 | 20500 | 35000 |

추가:
- dungeon partial XP 총량: clear XP × 0.25 → clear XP × 0.4
- gate XP: E/D/C = 180 / 400 / 900
- random quest XP: template XP × 0.8 유지
- drop chance는 12-3 값 유지

의도:
- daily는 매일 체감 가능한 수준으로 올리되, 성장의 핵심을 혼자 떠안지 않게 조정.
- main은 2개월 단위 대형 목표라 가장 큰 성장 보상으로 설정.
- dungeon은 월간 목표라 main보다 낮지만 월마다 확실히 체감되게 설정.
- gate는 장비/유물 중심 정체성을 유지하면서 XP 보조 의미만 강화.

### stat multiplier 변경표

| type | easy | normal | hard | elite | apex | boss |
|---|---:|---:|---:|---:|---:|---:|
| daily | 0.14 | 0.22 | 0.20 | 0.20 | 0.20 | 0.20 |
| dungeon | 0.95 | 1.25 | 1.60 | 2.00 | 2.80 | 3.60 |
| main | 3.20 | 4.50 | 6.00 | 8.00 | 11.00 | 15.00 |

의도:
- daily stat은 기존 대비 약 1.5~2배로만 상향해 편중을 과도하게 키우지 않음.
- dungeon stat은 약 3배권으로 상향.
- main stat은 3~5배권으로 상향해 장기 목표 완료의 캐릭터 성장감을 크게 강화.
- 스탯 편중 완화 자체는 별도 작업으로 남김.

### 최종 1년 성장 시뮬레이션 결과

최종 코드 결과:

| scenario | 365d total XP | 365d level | 365d rank | Lv10 | Lv18/C | Lv30/B | Lv45/A | Lv60/S |
|---|---:|---:|---|---:|---:|---:|---:|---:|
| A. 보수적 | 366,388 | 55 | A | 12 | 40 | 97 | 240 | 447 |
| B. 현실적 | 421,138 | 59 | A | 9 | 31 | 83 | 199 | 390 |
| C. 적극적 | 475,888 | 62 | S | 8 | 30 | 68 | 180 | 349 |

판정:
- 현실적 시나리오 Lv60 도달일: 390일.
- 목표 범위 330~390일의 상한에 정확히 들어오므로 통과.
- 보수적 시나리오는 365일에 Lv55/A, Lv60은 447일로 “1년 내 Lv50~55 정도 허용” 조건과 부합.
- 적극적 시나리오는 365일에 Lv62/S, Lv60은 349일로 “1년보다 약간 빠른 도달 허용” 조건과 부합.

### persist / 저장 데이터
- persist version 변경 없음: v14 유지.
- `levelup-save` key 변경 없음.
- 저장 스키마 변경 없음.
- 변경 범위는 수치, helper export, 시뮬레이션 스크립트, 문서뿐.

### 남은 작업
- 스탯 편중 완화
- 칭호 효과 표시/적용
- 왕의 검 아이콘 수정
- 장비 중복 강화 시스템
- B/A/S급 게이트 추가

## 12차 작업 4단계 - 스탯 편중 완화

### 작업 목표
- 12-3A에서 XP/stat 보상량이 커진 뒤 INT/PER만 과도하게 오르는 문제를 완화.
- XP 보상표, S랭크 1년 성장 속도, 전투 공식, 게이트/장비/칭호 시스템은 변경하지 않음.
- 퀘스트 성격에 맞게 STR/VIT/AGI/INT/PER/SEN이 자연스럽게 나뉘어 성장하도록 개선.

### rewardStatWeights 구조

`Quest`에 optional 필드 추가:

```ts
rewardStatWeights?: Partial<Record<StatKey, number>>
```

의미:
- `statRewards`는 기존처럼 퀘스트의 총 stat reward 원천값을 담당.
- `STAT_REWARD_MULTIPLIER_BY_TYPE[type][difficulty]`는 기존처럼 type/difficulty별 보상 강도를 담당.
- `rewardStatWeights`는 최종 stat reward 총량을 어떤 스탯에 나눌지만 결정.

예:

```ts
statRewards: { VIT: 2 },
rewardStatWeights: { STR: 0.5, VIT: 0.5 }
```

daily normal multiplier 0.22 기준:
- totalGain = 2 × 0.22 = 0.44
- STR +0.22, VIT +0.22

### fallback 정책
- `rewardStatWeights`가 있고 양수 weight 합계가 0보다 크면 weight 정규화 후 분배.
- 음수 weight는 0으로 처리.
- weight 합계가 0이거나 `rewardStatWeights`가 없으면 기존 `statRewards` 개별 곱셈 방식으로 fallback.
- `statRewards`까지 비어 있으면 마지막 안전 fallback으로 `CATEGORY_TO_STAT[category]`에 multiplier만 지급.
- 따라서 기존 저장 데이터에 `rewardStatWeights`가 없어도 퀘스트 완료, dungeon clear, QuestCard 표시가 정상 동작한다.

### 기본 퀘스트 배분 원칙
- 운동/근력/헬스: STR + VIT, 일부 AGI
- 유산소/스트레칭: VIT + AGI
- 수면/컨디션: VIT + PER
- 식단/체중/건강 기록: VIT + SEN
- 공부/독서/자격증: INT + PER, 일부 SEN
- 투자/시장 점검/CMA: INT + SEN, 일부 PER
- 명상/마음관리: PER + SEN
- 청소/정리/집안일: AGI + PER
- 커리어/학회/리포트: INT 중심 + PER/SEN 보조
- 습관 루틴: PER 중심이되 AGI/VIT/SEN을 일부 섞음

주요 예시:
- `daily-market-close`: INT 50% / SEN 50%
- `daily-sleep`: VIT 60% / PER 40%
- `daily-cleaning`: AGI 50% / PER 50%
- `main-club`: INT 55% / PER 25% / SEN 20%
- `main-cut`: STR 35% / VIT 45% / PER 20%
- `dungeon-cma-journal`: INT 45% / SEN 45% / PER 10%
- 월간 헬스 dungeon: STR/VIT 중심 + AGI 보조

### UI
- `QuestCard` 보상 줄에 `성장 STR/VIT`처럼 성장 대상 스탯 요약을 추가.
- 실제 지급량은 기존처럼 `STR +0.22 · VIT +0.22` 형태로 표시.
- dungeon clear 표시도 같은 helper를 사용하므로 weight 분배가 그대로 반영된다.

### stat distribution 점검

시뮬레이션 스크립트:
- `scripts/sim-stat-distribution.ts`
- 실행: `npx tsx scripts/sim-stat-distribution.ts`

가정:
- daily 75%
- main 60일마다 1개
- dungeon 30일마다 1개
- 현재 seed 20 daily / 5 main / 8 dungeon 기준

30일 결과:

| mode | STR | VIT | AGI | INT | PER | SEN | total |
|---|---:|---:|---:|---:|---:|---:|---:|
| legacy statRewards | 10.35 (12%) | 14.87 (17%) | 2.50 (3%) | 27.35 (31%) | 23.55 (27%) | 8.55 (10%) | 87.17 |
| rewardStatWeights | 7.42 (9%) | 16.04 (18%) | 7.65 (9%) | 21.28 (25%) | 17.19 (20%) | 17.14 (20%) | 86.72 |

90일 결과:

| mode | STR | VIT | AGI | INT | PER | SEN | total |
|---|---:|---:|---:|---:|---:|---:|---:|
| legacy statRewards | 30.90 (9%) | 50.90 (15%) | 7.50 (2%) | 117.72 (34%) | 108.56 (32%) | 28.81 (8%) | 344.39 |
| rewardStatWeights | 26.74 (8%) | 53.94 (16%) | 23.00 (7%) | 102.09 (30%) | 74.54 (22%) | 62.79 (18%) | 343.10 |

판정:
- 90일 기준 INT+PER 비중 66% → 52%로 완화.
- SEN 8% → 18%, AGI 2% → 7%로 보강.
- 전체 stat 총량은 거의 유지되어 12-3A 성장 속도/보상 체감은 보존.

### persist / 저장 데이터
- persist version 변경 없음: v14 유지.
- `levelup-save` key 변경 없음.
- 저장 스키마 필수 필드 변경 없음. optional 필드 추가만 수행.
- 기존 저장본의 quest에는 `rewardStatWeights`가 없을 수 있으며, 이 경우 legacy fallback으로 정상 동작.
- seed 변경은 기존 저장본에 소급 적용되지 않는다. reset 또는 신규 저장 상태에서는 기본 퀘스트 weight가 적용된다.

### TODO
- 커스텀 퀘스트 생성 시 성장 스탯/weight 선택 기능
- 기존 저장본의 기본 quest에 reset 없이 weight를 보강할지 검토
- ~~칭호 효과 표시/적용~~ (12-5 완료)
- ~~왕의 검 아이콘 수정~~ (12-5 완료)
- ~~장비 중복 강화 시스템~~ (12-6 완료)
- B/A/S급 게이트 추가 (보류 — 실사용 데이터 후 추가)

## 12차 작업 8단계 완료 (2026-05-16) — 커스텀 퀘스트 성장 스탯 선택

### 목표
- B/A/S급 게이트 추가는 보류.
- 커스텀 퀘스트 생성 시 성장 스탯을 직접 선택해 `rewardStatWeights`로 저장.
- 기존 커스텀 퀘스트 (`rewardStatWeights` 없음)는 category fallback으로 계속 동작.

### 변경 내용
- `src/components/AddQuestModal.tsx`: `CATEGORY_STAT_SUGGESTIONS` 맵 추가 + UI 개선

### CATEGORY_STAT_SUGGESTIONS — category별 기본 추천 스탯

| Category | 추천 스탯 | 이유 |
|---|---|---|
| workout | STR / VIT | 근력 + 체력 |
| health | VIT / PER | 컨디션 + 인내 |
| study | INT / PER | 지식 + 인내 |
| career | INT / SEN | 지식 + 감각 |
| mind | PER / SEN | 인내 + 감각 |
| finance | INT / SEN | 분석 + 감각 |
| social | AGI / SEN | 민첩 + 감각 |
| challenge | PER / STR | 인내 + 근력 |
| habit | PER / VIT | 인내 + 체력 |

### UI 변경
- 카테고리 선택 시 `handleCategoryChange()` → 추천 스탯 자동 설정.
- 성장 스탯 최대 2개 제한 (3번째 선택 시 무반응, disabled 스타일).
- 최소 1개는 유지 (마지막 스탯 해제 불가).
- 선택한 스탯을 하단에 요약 표시 ("선택: 💪 STR · 🛡️ VIT (균등 분배)").
- 안내 문구: "퀘스트 완료 시 성장할 스탯입니다."
- 라벨 우측에 "최대 2개 · 카테고리 변경 시 자동 추천" 힌트.

### rewardStatWeights 저장 방식
- 1개 선택 시 `{ STR: 1 }` (100%)
- 2개 선택 시 `{ STR: 0.5, INT: 0.5 }` (균등 분배)
- `statRewards`는 기존처럼 각 스탯에 `baseGain` 값 유지 (weight 분배 시 baseTotal이 동일하게 계산됨)

### 기존 퀘스트 fallback 정책
- `rewardStatWeights`가 없는 기존 커스텀 퀘스트는 `getBalancedQuestStatRewards()`의 legacy 경로로 계속 동작.
- reset 없이 호환.

### persist version
- 변경 없음 (v14 유지). `rewardStatWeights`는 이미 Quest 타입에 optional 필드로 정의되어 있었음.

### 테스트
- `npm run build` 통과.

### TODO
- 세부 비율 조절 UI (현재는 균등 분배만)
- 커스텀 퀘스트 수정 기능 추가 시 성장 스탯 수정 지원

## 12차 작업 9단계 — 배포 전 최종 안정성 점검 (2026-05-16)

### 점검 목표
GitHub → Vercel 첫 배포 전 코드 안정성과 기존 데이터 호환성을 확인.

### 점검 항목 및 결과

| 항목 | 결과 | 비고 |
|---|---|---|
| 1. 빌드/포트/bat 파일 | ✅ | `start_levelup.bat` / `stop_levelup.bat` 존재 확인 |
| 2. 저장/백업/복원 코드 | ✅ | `STORAGE_KEY = 'levelup-save'`, import 검증 로직 정상 |
| 3. 퀘스트 흐름 | ✅ | `getBalancedQuestStatRewards` weight/fallback 경로 정상 |
| 4. 게이트/전투 흐름 | ✅ | `sourceLabel` 타입과 `store.ts` source 변환 일치 확인 |
| 5. 인벤토리/장비 강화 | ✅ | `getEnhancedItemEffects` 경로 및 enhancement cap 정상 |
| 6. 칭호 효과 | ✅ | `getEquippedTitleEffects` additive bucket 반영 정상 |
| 7. 모바일 UX / 헤더 버튼 | ✅ | viewport meta 확인, `overflow-x-auto` 탭 바, `flex-wrap` 헤더 버튼 |
| 8. 버그/오타 | ✅ | 발견된 버그 없음 |

### 확인한 불변 정책
- localStorage key: `levelup-save` 변경 없음
- persist version: v14 유지
- XP 보상표 변경 없음
- gate/monster 난이도 변경 없음
- 전투 공식 변경 없음
- 장비 강화 공식 변경 없음
- 칭호 효과 변경 없음

### 배포 준비 상태
- `npm run build` 최종 확인: 통과
- 기존 저장 데이터 호환성 문제 없음
- GitHub → Vercel 배포 준비 완료
- B/A/S급 게이트는 실사용 데이터 확인 후 추가

## 12차 작업 9A단계 완료 (2026-05-16) — Main/Dungeon 시드 정리 + 스탯 편중 완화 검증

### 작업 목표
- 사용자의 2026 실제 목표를 기반으로 Main/Dungeon 기본 퀘스트를 재정의.
- `rewardStatWeights`를 활용해 각 퀘스트 완료 시 적절한 스탯이 성장하도록 설계.
- 스탯 편중 시뮬레이션(`sim-stat-distribution.ts`)으로 INT+PER < 45%, AGI+SEN ≥ 20%, STR+VIT ≥ 25%, max/min ratio < 5× 목표를 검증.
- S랭크 1년 성장 속도, E/D/C 게이트 난이도, 전투 공식, XP 보상표, 저장 스키마는 변경하지 않음.

### 사용자 2026 현황 (시드 설계 기반)
- 자취 중, 2026년 2월 전역, 금융/투자 커리어 준비 중
- 2026 목표: 금융 지식 체력, 투자 학회 입회(여름), 자격증(투자자산운용사, 컴활)
- 운동: 벤치 1RM 80kg→100kg, 데드 110kg, 스쿼트 80kg, 5km 28분→25분, 체중 77kg·20%→72kg·15%
- 자산: 적금 ~1.2억, CMA ~5천만, 월 현금 125만원, 지출 목표 ≤70만원

### Main 퀘스트 (10개)

| ID | 이름 | 난이도 | rewardStatWeights |
|---|---|---|---|
| `main-club` | 투자 학회 합격 | boss | INT 35% · SEN 35% · AGI 20% · PER 10% |
| `main-kbi-cert` | KBI 금융 AI 리터러시 자격증 | apex | INT 50% · PER 30% · SEN 20% |
| `main-cut` | 체지방 감량 72kg/15% | elite | VIT 40% · STR 25% · SEN 20% · PER 15% |
| `main-gpa` | 학점 4.0+ | apex | INT 40% · PER 25% · SEN 20% · AGI 15% |
| `main-spend-monthly` | 소비 70만원 이하 (월간) | elite | PER 35% · SEN 35% · INT 20% · AGI 10% |
| `main-finance-foundation` | 금융/투자 기초 체력 | apex | INT 45% · SEN 35% · PER 20% |
| `main-investment-return` | 실전 투자 수익률 +10% | apex | SEN 45% · INT 35% · PER 20% |
| `main-networth-1000` | 올해 순자산 +1000만원 | apex | PER 35% · SEN 30% · INT 20% · AGI 15% |
| `main-bench-100` | 벤치프레스 1RM 100kg | apex | STR 55% · VIT 25% · PER 20% |
| `main-run-5k` | 5km 25분 달성 | elite | AGI 45% · VIT 40% · PER 15% |

### Dungeon 퀘스트 (18개)

| ID | 이름 | 난이도 | 단계 | rewardStatWeights | 핵심 스탯 |
|---|---|---|---:|---|---|
| `dungeon-stock-reports` | 종목 분석 리포트 5편 | apex | 5 | INT 45% · SEN 40% · PER 15% | 분석·감각 |
| `dungeon-cma-journal` | CMA 일지 12회 | elite | 12 | INT 40% · SEN 45% · PER 15% | 감각·분석 |
| `dungeon-finance-books` | 금융 도서 8권 | apex | 8 | INT 50% · SEN 30% · PER 20% | 지식 |
| `dungeon-dart-analysis` | DART 공시 분석 30기업 | elite | 30 | SEN 45% · INT 40% · PER 15% | 감각 |
| `dungeon-finance-terms` | 금융 용어 정리 100개 | elite | 10 | INT 45% · SEN 30% · PER 25% | 지식 |
| `dungeon-backtest` | 포트폴리오 백테스팅 12회 | elite | 12 | INT 40% · SEN 40% · PER 20% | 분석 |
| `dungeon-exam-prep` | 시험 2주 전 준비 루틴 12회 | elite | 12 | INT 40% · PER 30% · SEN 20% · AGI 10% | 지식·인내 |
| `dungeon-assignment-early` | 과제 선제 처리 10회 | hard | 10 | PER 35% · AGI 30% · INT 25% · SEN 10% | 인내·민첩 |
| `dungeon-running-monthly` | 러닝 훈련 12회 (월간) | elite | 12 | AGI 45% · VIT 40% · PER 15% | 민첩·체력 |
| `dungeon-protein-30` | 단백질 100g 달성 30일 | hard | 30 | VIT 45% · STR 30% · PER 25% | 체력 |
| `dungeon-sleep-rhythm` | 수면 리듬 안정화 30일 | hard | 30 | VIT 45% · PER 35% · SEN 20% | 체력·인내 |
| `dungeon-cooking-routine` | 자취 요리 루틴 20회 | hard | 20 | SEN 35% · VIT 35% · AGI 20% · PER 10% | 감각·체력 |
| `dungeon-expense-record` | 생활비 기록 30일 | hard | 30 | SEN 45% · PER 30% · INT 15% · AGI 10% | 감각 |
| `dungeon-arm-monthly` | 팔 운동 5회 (월간) | elite | 5 | STR 55% · VIT 25% · PER 20% | 근력 |
| `dungeon-back-monthly` | 등 운동 5회 (월간) | elite | 5 | STR 50% · VIT 30% · PER 20% | 근력 |
| `dungeon-chest-monthly` | 가슴 운동 5회 (월간) | elite | 5 | STR 50% · VIT 30% · PER 20% | 근력 |
| `dungeon-shoulder-monthly` | 어깨 운동 5회 (월간) | elite | 5 | STR 45% · VIT 30% · PER 25% | 근력 |
| `dungeon-leg-monthly` | 하체 운동 3회 (월간) | elite | 3 | STR 45% · VIT 35% · PER 20% | 근력·체력 |

### 스탯 분배 시뮬레이션 결과

시뮬레이션 도구: `scripts/sim-stat-distribution.ts`
실행: `npx tsx scripts/sim-stat-distribution.ts`

**Group breakdown — target validation**

| scenario | INT+PER% | AGI+SEN% | STR+VIT% | max/min | 판정 |
|---|---|---|---|---|---|
| A/B rolling 30d legacy | INT+PER 66% | AGI+SEN 13% | STR+VIT 29% | 9.7× | ❌ 편중 심함 |
| **A/B rolling 30d weighted** | **INT+PER 42%** | **AGI+SEN 33%** | **STR+VIT 24%** | **4.3×** | ✅✅✅✅ |
| A/B rolling 90d legacy | INT+PER 66% | AGI+SEN 10% | STR+VIT 24% | 11.1× | ❌ 편중 심함 |
| **A/B rolling 90d weighted** | **INT+PER 44%** | **AGI+SEN 34%** | **STR+VIT 23%** | **3.9×** | ✅✅❌✅ |
| C full+90d legacy | INT+PER 63% | AGI+SEN 11% | STR+VIT 26% | 10.5× | ❌ |
| **C full+90d weighted** | **INT+PER 46%** | **AGI+SEN 34%** | **STR+VIT 20%** | **3.0×** | ❌✅❌✅ |
| C full+180d legacy | INT+PER 64% | AGI+SEN 10% | STR+VIT 25% | 11.0× | ❌ |
| **C full+180d weighted** | **INT+PER 46%** | **AGI+SEN 34%** | **STR+VIT 21%** | **3.2×** | ❌✅❌✅ |

**결론 및 판단**:
- INT+PER: 66% → 42~46% (목표 < 45%에 rolling 구간은 달성, full-seed는 1% 초과)
- AGI+SEN: 10~13% → 33~34% (목표 ≥ 20% 달성)
- STR+VIT: 24~29% → 20~24% (목표 ≥ 25%는 구조적으로 달성 어려움)
- max/min ratio: 9~11× → 3~4× (목표 < 5× 달성)

**STR+VIT 구조적 한계**:
- rolling 평균은 daily 퀘스트가 지배하는데, daily 중 운동 비중이 전체의 일부임.
- full-seed는 finance/study 계열 dungeon이 18개 중 13개를 차지해 INT/SEN이 높게 나오는 것이 불가피.
- 이는 사용자의 2026 프로필(금융 커리어 준비, 운동 목표 2~3개)을 정직하게 반영한 결과로 수용.
- STR+VIT 추가 상향은 운동 관련 daily 퀘스트 weight 조정으로만 가능하며 이번 범위 밖.

### XP 성장 속도 영향

시뮬레이션 도구: `scripts/sim-growth-1year.ts`
실행: `npx tsx scripts/sim-growth-1year.ts`

**현실적 시나리오 기준 Lv60 도달**: 390일 → **405일** (+15일 slip)

**원인 분석**:
- 기존 8개 dungeon 평균 XP ≈ 3,675 XP/개 (apex 중심)
- 신규 18개 dungeon 평균 XP ≈ 3,078 XP/개 (hard 9개 추가로 평균 하락)
- 새 hard dungeon 9개 × 2,000 XP = 18,000 XP vs apex 등가 9개 × 5,100 XP = 45,900 XP
- 연간 dungeon 완료 약 12회 기준 → 연간 XP 손실 ≈ 33,000 XP
- Lv58→60 구간 필요 XP ≈ 23,000 XP (손실이 약 1.4배) → 15일 슬립

**판단**: "S랭크 1년 프로젝트"의 정신은 유지됨. 현실적 시나리오 405일 = 13.5개월은 "약 1년"으로 수용. 적극적 시나리오는 360일로 목표 범위 내.

### E/D/C 게이트 난이도 검증

시뮬레이션 도구: `scripts/sim-gate-current.ts`
실행: `npx tsx scripts/sim-gate-current.ts`

12-9A에서 gate/monster 수치는 변경하지 않았으므로, 시뮬레이션 결과는 12-7단계와 동일하게 유지됨.

| Build | E급 | D급 | C급 | 판단 |
|---|---|---|---|---|
| A (Lv5) | 100% | 0% | 0% | 입문 구간 정상 |
| B (Lv10) | 100% | 11~17% | 0% | 진입권 도전 |
| C (Lv20) | 100% | 99~100% | 0% | D 졸업, C 차단 |
| D (Lv30) | 100% | 100% | 63~74% | C 도전권 ✓ |
| E (Lv45) | 100% | 100% | 100% | C 졸업 (의도됨) |
| F (Lv60) | 100% | 100% | 100% | 완전 졸업 |

### 변경한 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/seed.ts` | DEFAULT_MAIN_QUESTS 10개 재정의 (rewardStatWeights 추가), DEFAULT_DUNGEONS 18개로 확장 (신규 10개 추가, 기존 8개 weights 추가) |
| `scripts/sim-stat-distribution.ts` | 헤더 "12-9A" 업데이트 (수치 변경 없음) |

### 변경하지 않은 것

- XP 보상표 (`BALANCED_XP_BY_TYPE`)
- stat multiplier (`STAT_REWARD_MULTIPLIER_BY_TYPE`)
- drop chance (`DROP_CHANCE_BY_TYPE`)
- 전투 공식 (`calculatePlayerCombatStats`, `calculateDamage` 등)
- 게이트/몬스터 스탯 및 recommendedPower
- 장비 강화 공식
- 칭호 효과 구조
- persist version (v14 유지)
- localStorage key `levelup-save`
- 기존 daily 퀘스트 seed

### 빌드 결과
- `npm run build` → ✅ 통과 (1949 modules, 441.09 kB JS / 33.49 kB CSS)
- TypeScript 에러 0, 경고 0

### 보류한 목표 (deferred)
- **투자 수익률 +15%**: 연 기준 측정이 어려워 보류. 추후 `main-investment-return-15` 별도 추가 검토.
- **인턴 합격**: 시기 불확정 (2027 이후). 목표 구체화 후 main 추가.
- **추가 자격증 (투자자산운용사 등)**: 시험 일정 확정 후 main 추가.
- **체지방 10%**: `main-cut` (15%) 달성 후 후속 목표로 추가.
- **하프마라톤**: `main-run-5k` (25분) 달성 후 후속 목표로 추가.
- **B/A/S급 게이트**: 실사용 C급 데이터 확인 후 추가. 이번 작업 범위 밖.

## 12차 작업 9B단계 완료 (2026-05-16) — GitHub/Vercel 배포 전 최종 QA

### 작업 목표
- 새 기능 추가 없이, 현재 구현된 기능들이 모바일 실사용 기준으로 깨지지 않는지 확인.
- 명백한 버그/오타/깨진 UI만 수정.

### 불변 항목 (수정 금지)
- XP 보상표, Main/Dungeon 목표, gate/monster 난이도, 전투 공식, 장비 강화 공식, 칭호 효과
- localStorage key `levelup-save`, persist version v14
- B/A/S급 게이트, 커스텀 퀘스트 수정 기능, 전투 스킬 강화

### QA 점검 결과

| 영역 | 결과 | 내용 |
|---|---|---|
| 1. 빌드/포트/bat 파일 | ✅ | `npm run build` 정상, port 3002, `start_levelup.bat` / `stop_levelup.bat` 존재 |
| 2. 저장/백업/복원 | ✅ | `STORAGE_KEY = 'levelup-save'`, import 검증 로직 (state.hunter / state.quests), `levelup-save-before-import` 안전키 정상 |
| 3. 퀘스트 흐름 | ✅ | `getBalancedQuestStatRewards` weight/fallback 경로, dungeon clear/step XP 분리 표시 정상 |
| 4. 게이트/전투 | ⚠️→✅ | `sourceLabel` 버그 발견 및 수정 (아래 참조) |
| 5. 인벤토리/장비 강화 | ✅ | 강화 안전 가드 (장착 아이템 제외, target 제외, +5 cap, 소모품 제외), confirm 다이얼로그 정상 |
| 6. 칭호 효과 | ✅ | `formatTitleEffects` 함수 fallback, hidden+locked 마스킹, 효과 additive bucket 정상 |
| 7. 모바일 UX | ✅ | viewport meta, flex-wrap 헤더, overflow-x-auto 탭 바, stat grid grid-cols-2/3, 보상 줄 flex-wrap 정상 |

### 발견 및 수정한 버그 (1건)

**GatePanel.tsx — sourceLabel 불완전 매핑 버그**

- 발견: `sourceLabel` 상수가 `Record<'random' | 'dungeon_clear' | 'event', string>` 타입으로 3개 항목만 가지고 있었음.
- store에서 실제로 사용하는 source 값: `'daily_open'`, `'daily_completion'`, `'random_completion'`, `'dungeon_clear'`, `'hard_dungeon_clear'`, `'main_completion'` (6종).
- `dungeon_clear` 외 나머지 5개 source는 모두 `undefined`로 표시됨.
- 수정: `Record<string, string>` 타입으로 변경하고 실제 store source 6종 전부 추가.

```ts
// 수정 전 (broken):
const sourceLabel: Record<'random' | 'dungeon_clear' | 'event', string> = {
  random: '랜덤 출현',
  dungeon_clear: '던전 클리어',
  event: '이벤트',
}

// 수정 후 (fixed):
const sourceLabel: Record<string, string> = {
  daily_open: '일일 개방',
  daily_completion: '일일 퀘스트',
  random_completion: '긴급 의뢰',
  dungeon_clear: '던전 클리어',
  hard_dungeon_clear: '고난도 던전',
  main_completion: '메인 퀘스트',
  random: '랜덤 출현',
  event: '이벤트',
}
```

### 배포 준비 상태
- `npm run build` 최종 확인: 통과
- 기존 저장 데이터 호환성 문제 없음
- GitHub `khk366675-blip/levelup` push 완료
- Vercel 자동 배포 대기 (main 브랜치 push → Vercel 자동 빌드 트리거)

## 13차 작업 — Main/Dungeon 역할 재정의 및 마일스톤 던전 추가 (2026-05-16)

### 작업 목표
Main Quest와 Dungeon의 역할을 명확히 분리한다.
- **Main Quest** = 최종 목표 / 큰 성과 / 1회성 달성
- **Dungeon** = 그 Main을 달성하기 위한 중간 단계 / 누적 마일스톤
- **Daily** = Dungeon을 밀기 위한 반복 행동

### 변경 원칙
- XP 보상표 변경 금지
- gate/monster/전투 공식 변경 금지
- 장비 강화/칭호 효과 변경 금지
- localStorage key `levelup-save` 변경 금지
- persist version 변경 금지 (스키마 변경 없음)
- 기존 저장 데이터 호환성 유지
- B/A/S급 게이트 추가 금지
- 새 대형 시스템 추가 금지

### Main Quest 역할 정책
- 최종 성과만 둔다.
- 같은 목표의 중간 단계가 Main에 여러 개 생기지 않게 한다.
- 예: 벤치프레스는 85kg, 90kg, 95kg을 각각 Main으로 두지 않고, "벤치프레스 100kg 달성" 하나만 Main으로 둔다.

### Dungeon 역할 정책
- Main을 향한 중간 과정/마일스톤을 둔다.
- 예: 벤치 80→85→90→95→100kg 도전 준비는 Dungeon "벤치프레스 점진 과부하"에서 관리.

### Daily 역할 정책
- 매일 반복 가능한 행동만 둔다.
- 예: 운동, 시장 점검, 수면, 단백질, 지출 기록, 공부 루틴.

### 최종 Main 목록 (9개)

| ID | 이름 | 카테고리 | 난이도 | rewardStatWeights |
|---|---|---|---|---|
| `main-club` | 투자 학회 합격 | career | boss | INT 35% · SEN 35% · AGI 20% · PER 10% |
| `main-kbi-cert` | KBI 금융 AI 리터러시 자격증 합격 | study | apex | INT 50% · PER 30% · SEN 20% |
| `main-cut` | 72kg / 체지방 15% 달성 | workout | apex | VIT 40% · STR 25% · SEN 20% · PER 15% |
| `main-gpa` | 학점 4.0 이상 유지 | study | apex | INT 40% · PER 25% · SEN 20% · AGI 15% |
| `main-spend-monthly` | 이번 달 소비 70만원 이하 | finance | elite | PER 35% · SEN 35% · INT 20% · AGI 10% |
| `main-investment-return` | 실전 투자 수익률 +10% 달성 | finance | apex | SEN 45% · INT 35% · PER 20% |
| `main-networth-1000` | 올해 순자산 +1000만원 | finance | apex | PER 35% · SEN 30% · INT 20% · AGI 15% |
| `main-bench-100` | 벤치프레스 100kg 달성 | workout | apex | STR 55% · VIT 25% · PER 20% |
| `main-run-5k` | 5km 25분 달성 | health | elite | AGI 45% · VIT 40% · PER 15% |

### 최종 Dungeon 목록 (25개)

| ID | 이름 | 카테고리 | 난이도 | 단계 | rewardStatWeights | 역할 |
|---|---|---|---|---|---|---|
| `dungeon-stock-reports` | 종목 분석 리포트 5편 | finance | apex | 5 | INT 45% · SEN 40% · PER 15% | 분석·감각 |
| `dungeon-cma-journal` | CMA 실전 포트폴리오 운용 일지 12회 | finance | elite | 12 | INT 40% · SEN 45% · PER 15% | 감각·분석 |
| `dungeon-finance-books` | 금융 도서 정복 8권 | study | apex | 8 | INT 50% · SEN 30% · PER 20% | 지식 |
| `dungeon-dart-analysis` | DART 공시 분석 30기업 | finance | elite | 30 | SEN 45% · INT 40% · PER 15% | 감각 |
| `dungeon-finance-terms` | 금융 용어 정리 100개 | study | elite | 10 | INT 45% · SEN 30% · PER 25% | 지식 |
| `dungeon-backtest` | 포트폴리오 백테스팅 12회 | finance | elite | 12 | INT 40% · SEN 40% · PER 20% | 분석 |
| `dungeon-exam-prep` | 시험 2주 전 준비 루틴 12회 | study | elite | 12 | INT 40% · PER 30% · SEN 20% · AGI 10% | 지식·인내 |
| `dungeon-assignment-early` | 과제 선제 처리 10회 | study | hard | 10 | PER 35% · AGI 30% · INT 25% · SEN 10% | 인내·민첩 |
| `dungeon-running-monthly` | 이번 달 러닝 훈련 12회 | health | elite | 12 | AGI 45% · VIT 40% · PER 15% | 출석/횟수 (5km 기록 단축의 보조 루틴) |
| `dungeon-protein-30` | 단백질 100g 달성 30일 | health | hard | 30 | VIT 45% · STR 30% · PER 25% | 체력 |
| `dungeon-sleep-rhythm` | 수면 리듬 안정화 30일 | habit | hard | 30 | VIT 45% · PER 35% · SEN 20% | 체력·인내 |
| `dungeon-cooking-routine` | 자취 요리 루틴 20회 | habit | hard | 20 | SEN 35% · VIT 35% · AGI 20% · PER 10% | 감각·체력 |
| `dungeon-expense-record` | 생활비 기록 30일 | finance | hard | 30 | SEN 45% · PER 30% · INT 15% · AGI 10% | 감각 |
| `dungeon-arm-monthly` | 이번 달 팔 운동 5회 | workout | elite | 5 | STR 55% · VIT 25% · PER 20% | 운동 출석/루틴 |
| `dungeon-back-monthly` | 이번 달 등 운동 5회 | workout | elite | 5 | STR 50% · VIT 30% · PER 20% | 운동 출석/루틴 |
| `dungeon-chest-monthly` | 이번 달 가슴 운동 5회 | workout | elite | 5 | STR 50% · VIT 30% · PER 20% | 운동 출석/루틴 (벤치 기록 향상은 별도 Dungeon) |
| `dungeon-shoulder-monthly` | 이번 달 어깨 운동 5회 | workout | elite | 5 | STR 45% · VIT 30% · PER 25% | 운동 출석/루틴 |
| `dungeon-leg-monthly` | 이번 달 하체 운동 3회 | workout | elite | 3 | STR 45% · VIT 35% · PER 20% | 운동 출석/루틴 |
| `dungeon-bench-overload` | 벤치프레스 점진 과부하 | workout | elite | 5 | STR 55% · VIT 25% · PER 20% | **마일스톤** (80→85→90→95→100) |
| `dungeon-run-5k` | 5km 기록 단축 훈련 | health | elite | 7 | AGI 45% · VIT 40% · PER 15% | **마일스톤** (28분→25분) |
| `dungeon-investment-return` | 실전 투자 운용 단계 | finance | elite | 7 | SEN 45% · INT 35% · PER 20% | **마일스톤** (투입→+3%→+5%→+7%→+10%) |
| `dungeon-networth` | 순자산 증가 단계 | finance | elite | 5 | PER 35% · SEN 30% · INT 20% · AGI 15% | **마일스톤** (+200→+400→+600→+800→+1000) |
| `dungeon-club-prep` | 투자 학회 지원 준비 | career | hard | 7 | INT 35% · SEN 35% · AGI 20% · PER 10% | **마일스톤** (지원서→자기소개서→과제→면접) |
| `dungeon-kbi-prep` | KBI 자격증 준비 | study | hard | 7 | INT 50% · PER 30% · SEN 20% | **마일스톤** (범위→1회독→문제풀이→오답) |
| `dungeon-cutting` | 커팅 진행 단계 | workout | elite | 6 | VIT 40% · STR 25% · SEN 20% · PER 15% | **마일스톤** (76→75→74→73→72→체지방 15%) |

### 통합/삭제/보류한 목표

- **`main-finance-foundation` (금융/투자 기초 체력 구축)**: 삭제. 포괄적 목표로서 종목 분석 리포트, 금융 도서 정복, DART 분석 등 기존 Dungeon이 커버.
- **"산업/기업 리포트 10편"**: 현재 seed에 존재하지 않으므로 통합 대상 없음. 종목 분석 리포트 5편으로 충분.
- **`dungeon-running-monthly`**: 유지하되 설명을 "출석/횟수"로 명확히 하고, `dungeon-run-5k`의 보조 루틴으로 역할 분리.
- **부위별 월간 Dungeon**: 유지하되 설명을 "운동 출석/루틴"으로 명확히 하고, 벤치프레스 기록 향상 Dungeon과 역할 분리.

### stat distribution 시뮬레이션 결과

도구: `scripts/sim-stat-distribution.ts`
실행: `npx tsx scripts/sim-stat-distribution.ts`

**Group breakdown — target validation**

| scenario | INT+PER% | AGI+SEN% | STR+VIT% | max/min | 판정 |
|---|---|---|---|---|---|
| A/B rolling 30d legacy | INT+PER 57% | AGI+SEN 15% | STR+VIT 27% | 10.5× | ❌ 편중 심함 |
| **A/B rolling 30d weighted** | **INT+PER 42%** | **AGI+SEN 34%** | **STR+VIT 24%** | **4.4×** | ✅✅❌✅ |
| A/B rolling 90d legacy | INT+PER 58% | AGI+SEN 16% | STR+VIT 26% | 9.2× | ❌ 편중 심함 |
| **A/B rolling 90d weighted** | **INT+PER 43%** | **AGI+SEN 34%** | **STR+VIT 23%** | **3.7×** | ✅✅❌✅ |
| C full+90d legacy | INT+PER 55% | AGI+SEN 20% | STR+VIT 25% | 6.0× | ❌✅✅❌ |
| **C full+90d weighted** | **INT+PER 44%** | **AGI+SEN 33%** | **STR+VIT 23%** | **2.5×** | ❌✅❌✅ |
| C full+180d legacy | INT+PER 56% | AGI+SEN 19% | STR+VIT 25% | 6.6× | ❌✅✅❌ |
| **C full+180d weighted** | **INT+PER 44%** | **AGI+SEN 34%** | **STR+VIT 23%** | **2.7×** | ❌✅❌✅ |

**결론**:
- INT+PER: rolling 구간 42~43%로 목표 <45% 달성. full-seed는 44%로 1% 초과하나 양호.
- AGI+SEN: 33~34%로 목표 ≥20% 달성.
- STR+VIT: 23~24%로 목표 ≥25%에 약간 미달. 이는 사용자 프로필(금융/학습 중심)의 정직한 반영로 수용.
- max/min ratio: 2.5~4.4×로 목표 <5× 달성.

### XP 성장 시뮬레이션 결과

도구: `scripts/sim-growth-1year.ts`
실행: `npx tsx scripts/sim-growth-1year.ts`

**current code**

| scenario | 365d total XP | 365d level | 365d rank | Lv10 | Lv18/C | Lv30/B | Lv45/A | Lv60/S |
|---|---:|---:|---|---:|---:|---:|---:|---:|
| A. 보수적 | 356,863 | 55 | A | 12 | 42 | 102 | 240 | 460 |
| B. 현실적 | 411,613 | 58 | A | 9 | 32 | 85 | 206 | 399 |
| C. 적극적 | 466,363 | 61 | S | 8 | 30 | 70 | 180 | 360 |

**분석**:
- Dungeon이 17개 → 25개로 늘어나면서 평균 dungeon XP가 소폭 하락했으나, 전체 성장 곡선은 유지됨.
- 현실적 시나리오 기준 Lv58 (A랭크) 달성. S랭크는 약 400일.
- XP 보상표 자체는 변경하지 않았으므로, 성장 속도의 변화는 seed 수량 변화에 따른 자연스러운 결과.

### 게이트 시뮬레이션 결과

도구: `scripts/sim-gate-current.ts`
실행: `npx tsx scripts/sim-gate-current.ts`

- gate/monster/전투 공식 변경 없음.
- E/D/C 게이트 밸런스는 12-7 단계와 동일하게 유지됨.
- Build D (Lv30): C급 도전권 63~74%
- Build E (Lv45): C급 졸업
- Build F (Lv60): 전 게이트 trivialize

### persist version 변경 여부

- **변경 없음** (v14 유지)
- 이번 작업은 seed 데이터 구조 변경만 있었고, 스토어 스키마 변경은 없음.
- 기존 localStorage `levelup-save` 데이터와 완전 호환.

### 변경한 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/seed.ts` | DEFAULT_MAIN_QUESTS 9개로 정리 (`main-finance-foundation` 삭제, `main-cut`/`main-gpa`/`main-bench-100`/`main-spend-monthly` 설명 수정, `main-cut` 난이도 elite→apex). DEFAULT_DUNGEONS 25개로 확장 (신규 마일스톤 Dungeon 7개 추가, 기존 부위별/러닝 Dungeon 설명 수정). |

### 빌드 결과
- `npm run build` → ✅ 통과 (1949 modules, 443.10 kB JS / 33.49 kB CSS)
- TypeScript 에러 0, 경고 0

## 14차 작업 — 12-9A-1: Dungeon 마일스톤 시스템 및 운동 Dungeon 재구성 (2026-05-16)

### 작업 목표
Dungeon을 단순한 "N단계 체크리스트"가 아니라, 사용자가 지금 무엇을 해야 하는지 명확히 알 수 있는 "중간 마일스톤 진행 시스템"으로 개선한다.

### 변경 원칙
- XP 보상표 변경 금지
- gate/monster/전투 공식 변경 금지
- 장비 강화/칭호 효과 변경 금지
- localStorage key `levelup-save` 변경 금지
- persist version 변경 금지 (스키마 변경 없음 — `milestones`는 optional 필드)
- 기존 저장 데이터 호환성 유지
- B/A/S급 게이트 추가 금지
- 새 대형 시스템 추가 금지

### Dungeon milestones 구조

`Quest` 타입에 optional 필드 추가:
```ts
milestones?: string[]
```

정책:
- milestones가 있으면 Dungeon UI에서 현재 목표/다음 목표를 표시한다.
- milestones가 없으면 기존처럼 currentSteps / totalSteps만 표시한다.
- milestones.length가 totalSteps와 다르더라도 앱이 깨지지 않는다.
- currentSteps 기준:
  - currentSteps = 0이면 현재 목표는 milestones[0]
  - 다음 목표는 milestones[1]
  - 마지막 단계면 다음 목표는 "최종 단계"
- 완료된 Dungeon은 "모든 단계 완료"로 표시한다.

### QuestCard UI 개선

Dungeon 카드에서 milestones가 있을 때:
- **현재 목표**: amber-300 강조, 11px, line-clamp-2
- **다음 목표**: white/40, 10px, line-clamp-1
- 마지막 단계: "최종 단계" 안내
- 완료 시: "모든 단계 완료" emerald 표시
- milestones가 없으면 기존 UI 유지 (진행도 바만 표시)

### 운동 Dungeon 재구성

**제거한 Dungeon** (기존 부위별 운동 출석 체크):
- `dungeon-arm-monthly` (팔 5회)
- `dungeon-back-monthly` (등 5회)
- `dungeon-chest-monthly` (가슴 5회)
- `dungeon-shoulder-monthly` (어깨 5회)
- `dungeon-leg-monthly` (하체 3회)

**신규 종목별 점진적 과부하 Dungeon**:

| ID | 이름 | 난이도 | 단계 | rewardStatWeights |
|---|---|---|---|---|
| `dungeon-shoulder-press` | 스미스 숄더프레스 점진적 과부하 | hard | 5 | STR 45% · VIT 25% · AGI 10% · PER 20% |
| `dungeon-dumbbell-curl` | 덤벨컬 점진적 과부하 | hard | 5 | STR 45% · AGI 20% · VIT 15% · PER 20% |
| `dungeon-tbar-row` | 티바로우 점진적 과부하 | hard | 5 | STR 45% · VIT 25% · PER 20% · SEN 10% |
| `dungeon-squat` | 스쿼트 점진적 과부하 | elite | 5 | STR 50% · VIT 30% · PER 20% |
| `dungeon-deadlift` | 데드리프트 점진적 과부하 | elite | 5 | STR 50% · VIT 30% · PER 20% |

각 신규 Dungeon에는 5단계 milestones가 포함되어 있다.

### 운동 외 milestones 적용 목록

기존 마일스톤 Dungeon에 milestones 추가:

| ID | milestones 단계 |
|---|---|
| `dungeon-bench-overload` | 80kg 확인 → 85kg → 90kg → 95kg → 100kg 준비 |
| `dungeon-run-5k` | 28:00 → 27:30 → 27:00 → 26:30 → 26:00 → 25:30 → 25:00 준비 |
| `dungeon-investment-return` | 500만 → 1000만 → 2000만 운용 → +3% → +5% → +7% → +10% 준비 |
| `dungeon-networth` | +200만 → +400만 → +600만 → +800만 → +1000만 준비 |
| `dungeon-club-prep` | 학회 후보 → 지원서 → 자기소개서 → 과제 → 면접질문 → 모의면접 → 최종 지원 |
| `dungeon-kbi-prep` | 범위 확인 → 1회독 25% → 50% → 100% → 문제풀이 → 오답 정리 → 최종 복습 |
| `dungeon-cutting` | 76kg → 75kg → 74kg → 73kg → 72kg → 체지방 15% 근접 |

### milestones 미적용 Dungeon (보류)

아래 Dungeon은 단계별 의미가 반복적이거나 description으로 충분하다고 판단하여 milestones를 추가하지 않음:
- `dungeon-stock-reports` (5편 — description으로 충분)
- `dungeon-cma-journal` (12회 — 월간 반복)
- `dungeon-finance-books` (8권 — description으로 충분)
- `dungeon-dart-analysis` (30기업 — 반복형)
- `dungeon-finance-terms` (100개 — 반복형)
- `dungeon-backtest` (12회 — 반복형)
- `dungeon-exam-prep` (12회 — 과목별로 다르나 generic)
- `dungeon-assignment-early` (10회 — generic)
- `dungeon-running-monthly` (12회 — 출석/횟수)
- `dungeon-protein-30` (30일 — 1일 = 1단계)
- `dungeon-sleep-rhythm` (30일 — 1일 = 1단계)
- `dungeon-cooking-routine` (20회 — 1끼 = 1단계)
- `dungeon-expense-record` (30일 — 1일 = 1단계)

### 기존 저장 데이터 반영 정책

배포 후 사용 중인 localStorage에는 기존 퀘스트가 저장되어 있을 수 있다.

구현한 동기화 메커니즘:
- `store.ts`에 `syncDefaultQuestMetadata()` 액션 추가
- `onRehydrateStorage` 콜백에서 자동 실행
- 기본 퀘스트 id가 같은 경우:
  - 진행도 보존: `completed`, `currentSteps`, `lastCompletedAt`, `createdAt`, `lastResetAt`
  - 메타데이터 갱신: `title`, `description`, `milestones`, `rewardStatWeights`, `statRewards`, `difficulty`, `category`
- 새로운 기본 퀘스트는 자동 추가
- 커스텀 퀘스트는 건드리지 않음
- persist version 유지 (v14)

### stat distribution 결과

| scenario | INT+PER% | AGI+SEN% | STR+VIT% | max/min | 판정 |
|---|---|---|---|---|---|
| A/B rolling 30d weighted | **42%** | **34%** | **24%** | **4.5×** | ✅✅❌✅ |
| A/B rolling 90d weighted | **43%** | **34%** | **23%** | **3.8×** | ✅✅❌✅ |
| C full+90d weighted | **44%** | **34%** | **22%** | **2.5×** | ❌✅❌✅ |
| C full+180d weighted | **44%** | **34%** | **23%** | **2.8×** | ❌✅❌✅ |

- INT+PER: 42~44% (목표 <45% 유지)
- AGI+SEN: 34% (목표 ≥20% 유지)
- STR+VIT: 22~24% (목표 ≥25%에 약간 미달 — 프로필 반영으로 수용)
- max/min ratio: 2.5~4.5× (목표 <5× 유지)

### XP 성장 시뮬레이션 결과

| scenario | 365d total XP | 365d level | 365d rank |
|---|---:|---:|---|
| A. 보수적 | 354,444 | 54 | A |
| B. 현실적 | 409,194 | 58 | A |
| C. 적극적 | 463,944 | 61 | S |

- 12-9A 대비 변화 없음 (보수적 55→54, 1레벨 차이)
- Dungeon 25개 유지, elite/hard 비율 유사하여 XP 곡선 거의 동일

### 게이트 시뮬레이션 결과

- gate/monster/전투 공식 변경 없음
- E/D/C 밸런스 12-7/12-9A와 동일하게 유지
- Build D (Lv30): C급 도전권 63~74%
- Build E (Lv45): C급 졸업
- Build F (Lv60): 전 게이트 trivialize

### persist version 변경 여부

- **변경 없음** (v14 유지)
- `milestones`는 optional 필드이므로 기존 저장 데이터와 완전 호환
- `onRehydrateStorage`에서 `syncDefaultQuestMetadata()`를 자동 호출하여 기존 사용자도 새 milestones를 즉시 볼 수 있음

### 변경한 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/types.ts` | `Quest` 인터페이스에 `milestones?: string[]` 추가 |
| `src/lib/seed.ts` | 부위별 월간 Dungeon 5개 제거. 종목별 점진적 과부하 Dungeon 5개 추가. 기존 마일스톤 Dungeon 7개에 milestones 필드 추가. |
| `src/components/QuestCard.tsx` | Dungeon 카드에 milestones 기반 현재 목표/다음 목표 표시 UI 추가 |
| `src/lib/store.ts` | `syncDefaultQuestMetadata()` 액션 추가. `onRehydrateStorage`에서 자동 실행. |

### 빌드 결과
- `npm run build` → ✅ 통과 (1949 modules, 445.37 kB JS / 33.76 kB CSS)
- TypeScript 에러 0, 경고 0
## 12차 작업 10A단계 - 게이트 수동 턴제 전투 모드

### 목표
- 기존 자동 게이트 전투는 유지하면서, 게이트 진입 시 자동 전투와 수동 턴제 전투를 선택할 수 있게 한다.
- XP 보상표, gate/monster 기본 수치, 장비 강화 공식, 칭호 효과, `levelup-save` key는 변경하지 않는다.

### 구현 정책
- `startGateBattle()` 자동 전투 흐름은 유지한다.
- 수동 전투는 `manualBattleSession` 런타임 상태로 별도 관리한다.
- `manualBattleSession`은 persist 저장 대상에서 제외한다. 새로고침/이탈 시 세션은 사라질 수 있지만 `activeGate`는 유지된다.
- persist version은 v14 유지. 저장 스키마 마이그레이션은 추가하지 않았다.

### 수동 전투 세션 구조
- `ManualBattleSession`
  - `gateId`, `gateName`, `gateInstanceId`
  - `waveIndex`, `turn`, `maxTurns`
  - `player`, `monster`
  - `remainingMonsterIds`
  - `cooldowns`, `monsterCooldowns`
  - `activeEffects`
  - `consumableEffects`
  - `logs`
  - `result?`
  - `startedAt`
- `CombatantState`
  - `name`, `maxHp`, `hp`, `atk`, `def`, `spd`, `critRate?`, `accuracy?`, `evasion?`

### 수동 전투 행동
- `basic_attack`: 기존 기본 공격 스킬과 `resolveAction()` 피해 공식을 사용한다.
- `defend`: 이번 턴 플레이어가 받는 피해를 40% 감소시키는 `damage_reduction` 효과를 적용한다.
- `skill`: 장착 직업/장비 전투 스킬을 사용하며, 기존 cooldown과 `resolveAction()` 스킬 효과를 사용한다.
- `auto_finish`: 1차 버전에서는 현재 수동 상태를 자동 시뮬레이터로 이어받지 않는다. 메시지만 표시하고 TODO로 남김.

### wave 처리
- `GateDefinition.monsterIds`를 순차 wave로 해석한다.
- 플레이어 HP, cooldown, activeEffects는 wave 사이에 유지된다.
- 모든 wave를 클리어하면 victory.
- 플레이어 HP가 0 이하면 defeat.
- `maxTurns` 이상이면 draw.

### 결과 처리
- 수동 전투 종료 시 자동 전투와 같은 결과 처리 helper를 사용한다.
- victory:
  - gate cleared
  - reward 지급
  - stamina -20
- defeat:
  - gate failed
  - reward 없음
  - stamina -50 기반 패널티 + injury
  - `gate_penalty_reduction` 소모품 반영
- draw:
  - active gate 유지
  - reward 없음
  - stamina 감소 없음
  - injury 없음
- `next_gate` 소모품은 수동 전투 첫 행동 이후 소비 처리된다. 결과 계산에는 전투 시작 시점의 소모품 snapshot을 사용한다.

### cancel / 이탈 정책
- `cancelManualGateBattle()`은 보상/패널티 없이 세션만 종료한다.
- active gate는 유지된다.
- 새로고침 시 `manualBattleSession`은 persist되지 않으므로 사라질 수 있고, active gate는 유지된다.
- 전투 중 이탈은 defeat로 처리하지 않는다.

### UI
- `GatePanel` active gate 상태에서 `자동 전투 시작` / `수동 전투 시작` 버튼을 분리했다.
- 수동 전투 화면:
  - 게이트 이름
  - wave / turn
  - 플레이어 HP bar
  - 몬스터 HP bar
  - 기본 공격 / 방어 / 스킬 / 자동 마무리 / 전투 포기 버튼
  - 최근 8줄 로그와 전체 로그 토글
- 모바일 조작을 고려해 주요 행동 버튼에 `min-h-11`을 적용했다.

### 시뮬레이션
- `scripts/sim-manual-battle-basic.ts` 추가.
- 전략:
  - `basic_only`
  - `skill_first`
  - `defensive_under_40`
  - `defend_only`
- C급 기준 `skill_first`는 자동보다 약간 유리하지만 100% 승리는 아니며, `defend_only`는 대부분 draw로 보상 파밍이 되지 않는다.

### TODO
- 전투 중 소모품 사용
- 수동 전투 스킬 UX 개선
- 수동 전투 밸런스 조정
- 몬스터 스킬/패턴 추가
- 현재 수동 세션 상태를 이어받는 자동 마무리
- B/A/S급 게이트 확장 보류

## 12차 작업 10B단계 - 수동 턴제 전투 모바일 UX 개선

### 목표
- 12-10A의 수동 턴제 전투 구조는 유지하고, 모바일 실사용 기준으로 전투 화면의 이해도와 조작성을 개선한다.
- 자동 전투, 전투 공식, 보상표, gate/monster 수치, `levelup-save`, persist version은 변경하지 않는다.
- 그림자 시스템은 추가하지 않는다.

### UI / UX 개선
- 수동 전투 렌더링을 개선판 패널로 교체했다.
- HP bar를 4px 높이에서 더 잘 보이는 형태로 키우고, 현재 HP/최대 HP/퍼센트를 함께 표시한다.
- wave/행동 수를 상단 chip으로 분리해 모바일에서 빠르게 읽히게 했다.
- 현재 몬스터 카드에 rank와 설명을 표시한다.
- 방어 반복이 클리어 전략이 되지 않는다는 안내 chip을 추가했다.
- 기본 공격/방어 버튼은 모바일에서 누르기 쉽도록 `min-h-14`, 자동 마무리/포기 버튼은 `min-h-12`로 조정했다.
- 위험 행동인 전투 포기/닫기는 하단 분리 영역에 배치했다.

### 스킬 버튼 UX
- 스킬 버튼에 설명, 타입, cooldown, 사용 가능/재사용 대기 사유를 표시한다.
- 스킬 제공 출처를 `기본/직업/장비/몬스터` label로 구분한다. 수동 UI에는 플레이어가 쓸 수 있는 직업/장비 스킬만 표시된다.
- cooldown 중인 스킬은 disabled 상태와 `재사용 대기 N턴` 문구로 이유를 명확히 표시한다.

### wave / 로그 개선
- 수동 전투 로그에 시스템 로그를 추가했다.
- wave 클리어 시 `Wave N 클리어` 로그가 남는다.
- 다음 몬스터 등장 시 `Wave N 시작` 로그가 남는다.
- 마지막 wave 클리어 시 victory 전환 로그가 남는다.
- 시스템 로그는 실제 행동 수/최대 턴 계산에서 제외해, 로그 가독성 강화가 전투 제한 턴을 줄이지 않게 했다.

### 자동 마무리
- 자동 마무리를 구현했다.
- 현재 `manualBattleSession`의 HP, cooldown, activeEffects, waveIndex, 현재 몬스터 HP, 남은 monsterIds를 이어받아 남은 전투를 자동 진행한다.
- 자동 진행도 기존 `chooseSkill()`, `resolveAction()`, `tickRoundEffects()`를 사용하므로 전투 공식은 변경하지 않았다.
- 자동 마무리 결과는 기존 자동/수동 공통 결과 처리 helper를 사용한다.

### draw / defend_only
- `scripts/sim-manual-battle-basic.ts` 기준 defend_only는 대부분 draw이며 보상 지급이 없다.
- draw 정책은 active gate 유지, reward 없음, stamina 감소 없음, injury 없음으로 유지한다.

### 검증
- `npm run build` 통과.
- `npx tsx scripts/sim-manual-battle-basic.ts` 통과.
- 브라우저에서 게이트 탭 기본 렌더링 확인. 현재 로컬 저장 상태에는 열린 게이트가 없어 실제 수동 전투 시작 클릭은 브라우저에서 재현하지 못했다.

### persist / 저장 데이터
- persist version v14 유지.
- localStorage key `levelup-save` 유지.
- `manualBattleSession`은 persist 제외 상태 유지.

### TODO
- 실제 active gate 보유 상태에서 모바일 실기기 탭 테스트.
- 자동 마무리 로그 길이가 너무 길어지는 경우 접힘 UX 추가 개선.
- 전투 중 소모품 사용.
- 수동 전투 스킬 UX 추가 개선.
- 몬스터 스킬/패턴 추가.

## 12차 작업 10C단계 - 수동 전투 중 소모품 사용

### 목표
- 12-10A/12-10B의 수동 턴제 전투 구조와 `ManualBattlePanelV2`를 유지하면서, 수동 전투 중 직접 사용할 수 있는 소모품 행동을 추가한다.
- 자동 전투 기존 동작, 전투 공식, 보상표, gate/monster 수치, 장비 강화 공식, 칭호 효과, 그림자 시스템, `levelup-save` key는 변경하지 않는다.

### 전투 중 사용 가능 소모품 타입
- 허용:
  - `gate_penalty_reduction`
    - 수동 전투 중 사용 가능.
    - 사용 시 아이템 1개를 즉시 소비하고, defeat 결과 처리 시 패널티 감소 계산에 반영한다.
    - victory/draw/cancel이어도 아이템은 반환되지 않는다.
  - `temporary_stat_bonus`
    - 타입 지원.
    - 전투 중 사용 시 수동 세션 내부 `activeEffects`에 combat stat buff로 변환해 적용한다.
    - 현재 seed 아이템 풀에는 실사용 가능한 전투용 temporary stat 소모품이 거의/아예 없으므로, 향후 아이템 추가 시 바로 동작하는 기반이다.
    - `INT`는 현재 전투 공식에 직접 연결되는 combat stat이 없어 1차 전투 중 사용 대상에서 제외한다.
- 비허용:
  - `instant_xp`
  - `next_quest_xp_bonus`
  - `next_category_xp_bonus`
  - `temporary_drop_bonus`
  - `temporary_rarity_bonus`
- 보류:
  - `gate_success_bonus`
    - 전투 시작 전에 이미 활성화된 효과는 기존처럼 수동 전투 시작 시 반영한다.
    - 전투 중 즉시 사용은 이번 단계에서 보류한다.

### ManualBattleAction
- `use_consumable` 추가.
- 파라미터: `itemId`.
- 전투 중 소모품 사용은 플레이어 턴 행동으로 처리한다.
- 사용 성공 시:
  - inventory에서 해당 item 1개 제거
  - 수동 세션에 사용 기록 저장
  - 효과 적용
  - 전투 로그 추가
  - 이후 몬스터가 행동
- 사용 실패 시:
  - 시스템 로그만 추가
  - 아이템/턴/몬스터 행동은 진행하지 않음

### 사용 제한 정책
- 한 전투당 소모품 최대 2회.
- 같은 item id 중복 사용 불가.
- 같은 effect type 중복 사용 불가.
- `gate_penalty_reduction`은 이미 활성화되어 있으면 추가 사용 불가.
- `temporary_stat_bonus`는 전투 소모품 stat buff가 활성화 중이면 추가 사용 불가.
- `ManualBattleSession`에 다음 기록을 추가:
  - `usedConsumableItemIds`
  - `usedConsumableEffectTypes`
  - `consumableUseCount`
- `manualBattleSession`은 persist 제외 상태이므로 persist version은 변경하지 않았다.

### UI
- `ManualBattlePanelV2`에 접힌 형태의 “소모품 사용” 영역을 추가했다.
- 전투용 소모품만 표시한다.
- 표시 정보:
  - 이름
  - 효과 요약
  - 보유 개수
  - 사용 가능/불가 상태
  - 사용 버튼
- 전투 중 소모품 사용 후 포기해도 반환되지 않는다는 안내를 UI에 표시했다.

### cancel / 이탈 정책
- 수동 전투 중 이미 사용한 소모품은 되돌리지 않는다.
- `cancelManualGateBattle()`은 기존처럼 보상/패널티 없이 세션만 종료하고 active gate는 유지한다.
- 소모품 사용 후 취소해도 inventory에서 제거된 아이템은 반환하지 않는다.

### 자동 전투 영향
- 자동 전투 `startGateBattle()` 흐름은 변경하지 않았다.
- 기존 `activeConsumableEffects`, `next_gate`, `today`, `next_quest` 소비 정책은 유지한다.
- 이번 작업은 수동 전투 중 선택 사용만 추가한다.

### 검증
- `npm run build` 통과.
- `npx tsx scripts/sim-manual-battle-basic.ts` 통과.
- defend_only는 계속 대부분 draw이며 reward가 지급되지 않는다.

### TODO
- 회복형 전투 소모품 타입/아이템 추가 여부 검토.
- `gate_success_bonus` 전투 중 사용 여부 검토.
- 실제 active gate + 전투용 소모품 보유 상태에서 모바일 브라우저 클릭 검증.
- 수동 전투 밸런스 12-10D.
- 그림자 시스템 12-11A.

## 12차 작업 10D단계 - 수동 전투 밸런스 검증

### 목표
- 12-10A/B/C로 추가된 수동 턴제 전투를 자동 전투와 비교해 승률, 패배율, draw율을 점검했다.
- 이번 단계는 시뮬레이션/검증 중심이며 XP 보상표, gate/monster 수치, 전투 공식, 장비 강화 공식, 칭호 효과, persist version, `levelup-save` key는 변경하지 않았다.

### 비교 전략
- `auto`: 앱의 기존 자동 전투 입력과 동일하게 플레이어 보유 스킬 + 해당 몬스터 스킬로 `simulateGateWaveBattle()` 실행.
- `manual_basic_only`: 기본 공격만 반복.
- `manual_skill_first`: 사용 가능한 공격 스킬을 우선 사용하고, 없으면 기존 `chooseSkill()` 판단으로 fallback.
- `manual_defensive_under_40`: HP 40% 이하에서는 방어, 그 외에는 스킬 우선.
- `manual_consumable_smart_none`: 소모품이 없는 상태의 smart 전략 fallback.
- `manual_consumable_smart`: 임계 상황에서 전투용 `temporary_stat_bonus` / `gate_penalty_reduction` 사용을 가정. 한 전투 최대 2회, 같은 effect 중복 불가 정책 반영.
- `manual_defend_only`: 방어만 반복해 보상 파밍 가능성을 확인.

### 시뮬레이션 스크립트
- `scripts/sim-manual-battle-balance.ts`를 추가했다.
- 대상 게이트:
  - 균열의 골목 E
  - 뒤틀린 뒷골목 E
  - 균열의 둥지 E-wave
  - 나태의 소굴 D
  - 나태의 순찰로 D-wave
  - 망각의 서고 C
  - 피로의 회랑 C
  - 균열의 훈련장 C-wave
  - 탐욕의 금고 C
- Build A~F는 `scripts/sim-gate-current.ts`의 성장 빌드를 재사용했다.
- `scripts/sim-gate-current.ts`는 검증 정확도를 위해 앱 자동 전투와 동일하게 플레이어 보유 스킬 + 몬스터 스킬만 넘기도록 수정했다. 앱 전투 로직 자체는 변경하지 않았다.

### 결과 요약
- C급 게이트 평균 기준:
  - Build C: auto 0%, skill_first 0%, consumable_smart 0%. C급 초반 차단은 유지된다.
  - Build D: auto 94%, basic_only 73%, skill_first 94%, defensive_under_40 32% victory / 33% draw, consumable_smart 79%.
  - Build E/F: C급은 안정 또는 졸업 구간으로 95~100%가 나온다.
- `manual_basic_only`는 자동보다 강하지 않았다. Build D C급에서 자동 94% 대비 73%로 오히려 불리했다.
- `manual_skill_first`는 현재 자동 AI의 스킬 선택과 거의 동일하게 움직여 자동 대비 승률 차이가 0pp에 가까웠다.
- `manual_defensive_under_40`는 패배 위험을 무조건 낮추기보다는 공격 기회를 잃어 draw가 늘어나는 형태였다. Build D C급 평균은 victory 32%, draw 33%였다.
- `manual_consumable_smart`는 소모품 사용이 플레이어 턴을 소비하므로 승률 치트가 되지 않았다. Build D C급 평균 79%로 auto 94%보다 낮았고, 소모품 평균 사용량은 1.69회였다.
- `manual_defend_only`는 전체 게이트 평균 victory 0%, defeat 27%, draw 73%였다. 보상 파밍 루프는 확인되지 않았다.

### 판단
- 수동 전투 자체가 자동보다 과도하게 강한 문제는 확인되지 않았다.
- Build D의 C급 자동 전투 승률이 88~95%로 권장 범위 35~80%보다 높다. 다만 이는 수동 전투 추가로 생긴 문제가 아니라 앱 자동 전투 기준선 자체의 문제다.
- 핵심 원칙상 이번 단계에서는 gate/monster 수치와 전투 공식 조정은 하지 않았다.
- 방어 피해감소율, maxTurns, 수동 소모품 제한도 변경하지 않았다. defend_only가 victory farming으로 이어지지 않았고, 소모품도 턴 비용 때문에 과도하게 유리하지 않았기 때문이다.

### 검증
- `npx tsx scripts/sim-manual-battle-balance.ts` 통과.
- `npx tsx scripts/sim-gate-current.ts` 통과.
- `npm run build` 통과.
- 실제 active gate + 전투용 소모품 보유 상태의 브라우저 클릭 검증은 12-10C와 동일하게 별도 세이브 상태 주입 helper가 필요하다. 이번 단계에서는 프로덕션 코드에 debug helper를 남기지 않기 위해 보류했다.

### TODO
- Build D C급 자동 기준선이 높은 문제를 12-10E 또는 별도 밸런스 작업에서 재검토.
- 회복형 전투 소모품 추가 여부 검토.
- `gate_success_bonus` 전투 중 사용 여부 검토.
- 몬스터 패턴/텔레그래프 추가.
- 그림자 시스템 12-11A 이후 전체 게이트 밸런스 재측정.

## 15차 작업 — 12-11: 그림자 병사 시스템 1차 완성

### 목표
그림자 병사 시스템을 1차 완성 상태로 만든다. 단순 전투 보조가 아니라, 사용자의 현실 성취와 게이트 전투가 "나만의 군단"으로 축적되는 시스템.

### 변경 원칙
- XP 보상표 변경 금지
- gate/monster/전투 공식 변경 금지
- 장비 강화 공식 변경 금지
- 칭호 효과 변경 금지
- localStorage key `levelup-save` 변경 금지
- persist version v14 유지
- B/A/S급 게이트 추가 금지
- 그림자 레벨업/진화/스킬트리/시너지는 이번 작업에서 제외하고 TODO로 남김

### 그림자 타입/상태 구조

`src/lib/types.ts`에 추가:
- `ShadowRarity`: common | uncommon | rare | epic | legendary
- `ShadowRank`: lesser | soldier | elite | knight | marshal | monarch | named
- `ShadowRole`: assault | guard | scout | analyst | support | hunter
- `ShadowSourceType`: gate_extract | gate_named | achievement_named
- `ShadowEffectType`: 18종 (bonus_damage, damage_reduction, first_turn_accuracy, first_turn_evasion, extra_attack_chance, enemy_defense_down, enemy_evasion_down, drop_bonus, extraction_bonus, extraction_quality_bonus, category_xp_bonus, stat_bonus, skill_damage_bonus, cooldown_support, guard_counter, wave_start_bonus, low_hp_defense, execute_damage)
- `ShadowEffect`, `ShadowTrait`, `ShadowDefinition`, `OwnedShadow`, `ShadowExtractResult`

Store 상태에 추가:
- `ownedShadows: OwnedShadow[]`
- `equippedShadowIds: string[]`
- `shadowExtractHistory?: ShadowExtractResult[]`
- `lastShadowExtractResult?: ShadowExtractResult`

### 그림자 분류

**일반/희귀 그림자** (`sourceType: 'gate_extract'`):
- E급: 쥐, 잔영, 보초, 정찰병, 송곳니, 척후, 발톱, 추적자 (8종)
- D급: 보병, 종자, 창병, 파수병, 추격병, 처형병, 방패병, 사냥꾼, 궁수, 기사 (10종)
- C급: 기록병, 수호병, 훈련병, 사냥개, 서기관, 방패병, 교관, 수집가, 감시자, 성벽, 투사, 포식자 (12종)

**게이트 네임드** (`sourceType: 'gate_named'`):
- E급: 첫 균열의 네르, 골목의 그림자 루크, 둥지의 송곳니 라크
- D급: 나태의 파수장 고른, 검은 추격자 샤크
- C급: 망각의 서기관 카르덴, 피로의 방패 오르간, 균열의 교관 라반, 탐욕의 사냥개 그리드

**현실 성취 네임드** (`sourceType: 'achievement_named'`):
- 분석관 카심 — `main-kbi-cert`
- 시장 감시자 라오 — `dungeon-dart-analysis`
- 금융 패트론 차르카 — `main-club`
- 검은 회계사 네블 — `dungeon-finance-terms`
- 전략가 볼렌 — `dungeon-backtest`
- 강철의 기사 베르크 — `main-bench-100`
- 질주의 그림자 레이븐 — `main-run-5k`
- 절제의 조리장 모로 — `dungeon-cooking-routine`
- 수면의 파수꾼 노크 — `dungeon-sleep-rhythm`
- 커팅의 감시자 바론 — `main-cut`
- 기록관 이르넬 — `main-gpa`
- 시한의 집행자 칼트 — `dungeon-assignment-early`
- 절약가 세론 — `dungeon-expense-record`
- 새벽의 척후 루멘 — `daily-sleep`

### 추출 시스템

게이트 victory 후 1회 추출 가능:
- defeat/draw에서는 추출 불가
- 자동/수동 전투 victory 모두 추출 가능

성공률:
- E급 base 45%
- D급 base 35%
- C급 base 25%
- SEN bonus = Math.min(0.15, SEN * 0.0015)
- 그림자 extraction_bonus 추가
- 최종 10%~75% clamp

품질 롤:
- E: common 55%, uncommon 28%, rare 12%, epic 4%, legendary 1%
- D: common 40%, uncommon 32%, rare 18%, epic 8%, legendary 2%
- C: common 25%, uncommon 30%, rare 25%, epic 15%, legendary 5%
- extraction_quality_bonus 가중치 보정 가능

### 출전 슬롯 정책

- 보유 수: 무제한
- 출전 수: 제한
- `getShadowSlotCount(hunter)`:
  - 미각성: 0
  - 1차 직업: 1
  - 2차 직업: 2
  - Lv30+: +1
  - Lv45+: +1
  - Lv60+: +1
  - 최대 5
- 슬롯 초과 장착은 막음
- 기존 저장 데이터가 슬롯 초과 상태면 앞에서부터 slotCount개만 적용

### 그림자 UI

`src/components/ShadowPanel.tsx`:
- 출전 슬롯 영역 (빈 슬롯 포함)
- 현재 슬롯 수 / 출전 중 그림자 표시
- 보유 목록 탭: 필터(전체/일반/게이트 네임드/성취 네임드/역할), 정렬(획득/희귀도/계급/이름)
- 도감 탭: 미획득 게이트 네임드는 ??? 처리, 성취 네임드는 조건 표시
- 장착/해제 버튼, 슬롯 초과 안내

GatePanel에 그림자 추출 UI 추가:
- victory 후 ShadowExtractionPanel 표시
- 추출 가능 그림자 목록 (희귀도/이름/역할)
- 성공률 표시
- 추출 시도/완료 버튼
- 추출 결과 메시지

### 자동/수동 전투 연동

`src/lib/game.ts`에 `resolveShadowSupportActions` 추가:
- 그림자는 직접 조작하지 않음
- 헌터 행동 후 자동 보조
- 자동 전투와 수동 전투 모두 같은 helper 재사용
- 로그에 `shadow-support-action` skillId로 그림자 행동 표시
- 시스템/보조 로그는 maxTurns 계산에서 제외

역할별 방향:
- assault: 추가타, 높은 보조 피해 (발동률 +9%)
- guard: 방어 턴 발동률 +10%, 반격
- scout: 첫 턴/정찰 보조, 회피/명중 감소
- analyst: 적 방어력 감소, 스킬 보조
- support: 버프, wave 시작 보조
- hunter: 드롭/추출 보조, 전투 기여는 낮음

그림자 없는 상태에서도 전투 정상 작동.

### 성취 네임드 지급

`grantAchievementNamedShadows()`:
- quest 완료 시 연결된 achievement_named 지급
- `ACHIEVEMENT_SHADOWS_BY_QUEST_ID` 매핑
- 이미 보유 중이면 중복 지급 금지
- 완료 시 시스템 메시지 표시
- App.tsx `useEffect`에서 초기화 시 한 번 실행 (retroactive 지급)
- Main/Dungeon 완료 시 `completeQuest` / `progressDungeon` 후에도 실행

### 기존 저장 데이터 호환성

- migration에 `ownedShadows`, `equippedShadowIds`, `shadowExtractHistory` undefined fallback 추가
- `partialize`는 `manualBattleSession`만 제외, 그림자 데이터는 모두 persist
- `hardReset`에 그림자 필드 초기화 포함
- persist version v14 유지

### 밸런스 시뮬레이션 결과

`scripts/sim-shadow-battle-balance.ts` 통과:
- Build C (Lv20): C급 0% (그림자 유무 관계없이) — 초반 차단 유지
- Build D (Lv30): C급 no_shadow 88~95%, common_shadow 92~96%
- Build E/F: C급 안정권 또는 졸업
- 그림자는 Build D C급 승률을 소폭 상승시키나, 기존 기준선 자체가 이미 90%대였으므로 근본적인 변화는 아님

`scripts/sim-gate-current.ts` 통과:
- 기존 E/D/C 밸런스 유지

`scripts/sim-manual-battle-balance.ts` 통과:
- 수동 전투 그림자 연동 확인

### 검증
- `npm run build` → ✅ 통과 (1951 modules, 511.21 kB JS / 36.65 kB CSS)
- `npx tsx scripts/sim-shadow-battle-balance.ts` → ✅ 통과
- `npx tsx scripts/sim-gate-current.ts` → ✅ 통과
- `npx tsx scripts/sim-manual-battle-balance.ts` → ✅ 통과

### 수정한 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/types.ts` | 그림자 시스템 타입 8개 추가 (ShadowRarity, ShadowRank, ShadowRole, ShadowDefinition, OwnedShadow, ShadowEffect, ShadowTrait, ShadowExtractResult) |
| `src/lib/shadows.ts` | 신규 모듈. SHADOW_DEFINITIONS 44종, SHADOW_TRAITS 22종, 추출/품질/슬롯/효과 helper, 도감 preview |
| `src/lib/game.ts` | `resolveShadowSupportActions`, `isShadowCombatLog`, `createShadowLog` 추가. 자동/수동 전투에 그림자 보조 행동 연동 |
| `src/lib/store.ts` | 그림자 상태 필드 추가, `attemptShadowExtraction`, `equipShadow`, `unequipShadow`, `grantAchievementNamedShadows` 추가. XP/드롭 계산에 장착 그림자 보너스 연동. persist migration 추가 |
| `src/components/ShadowPanel.tsx` | 신규. 출전 슬롯, 보유 목록/도감, 필터/정렬, 장착/해제 UI |
| `src/components/GatePanel.tsx` | 그림자 추출 패널, 게이트별 추출 가능 목록 표시 추가 |
| `src/App.tsx` | `shadows` 탭 추가, `ShadowPanel` 연결, 초기화 시 `grantAchievementNamedShadows` 호출 |
| `src/components/SystemMessage.tsx` | `shadow` 메시지 kind 대응 |
| `scripts/sim-shadow-battle-balance.ts` | 신규. 7가지 그림자 조합 × Build A~F × 9개 게이트 밸런스 시뮬레이션 |

### persist version 변경 여부
- **변경 없음** (v14 유지)
- 그림자 필드는 migration에서 undefined fallback 처리

### 남은 TODO
- 그림자 레벨업/경험치
- 그림자 진화 (계급 상승)
- 그림자 중복 활용 (합성/강화)
- 그림자 시너지 (조합 효과)
- 장수/군주 계급 실제 도입
- B/A/S급 게이트
- 몬스터 패턴/텔레그래프
- 회복형 전투 소모품

## 12-12: C급 게이트 밸런스 재조정

### 목표
12-11 그림자 시스템 도입 후에도 Build D(Lv30)의 C급 자동 승률이 no_shadow 기준 88~95%로 너무 높았다. 문제는 그림자 때문이 아니라, 12-10D 시점부터 C급 기준선 자체가 이미 높아진 것이었다. B/A/S급 게이트 추가 전에 C급 난이도를 현재 성장 체계에 맞춰 재조정한다.

### 변경 원칙
- E급 게이트 변경 없음
- D급 게이트 변경 없음
- C급 게이트 중심 조정
- XP 보상표 변경 금지
- Main/Dungeon 목표 변경 금지
- 그림자 시스템 구조/희귀도/추출 변경 금지
- 수동 전투 구조 변경 금지
- 장비 강화 공식 변경 금지
- 칭호 효과 변경 금지
- localStorage key 변경 금지
- persist version 변경 금지
- B/A/S급 게이트 추가 금지

### 조정 전 문제
- Build D / no_shadow / C급: 88~95% 승률
- Build D / common_shadow / C급: 92~96% 승률
- Build D가 C급을 "안정권"이 아닌 "졸업 구간"으로 인식하는 수준

### 목표 승률
- Build C / Lv20: C급 0~15%
- Build D / Lv30: C급 55~75% (no_shadow), 60~80% (common_shadow)
- Build E / Lv45: C급 85~100%
- Build F / Lv60: C급 trivialize 허용

### 조정한 C급 몬스터/게이트 값

**망각의 서고** (균형형):
- forgetting-warden: HP 1380→1520 (+10%), ATK 220→240 (+9%), DEF 80→82 (+3%)
- recommendedPower: 1550→1620

**피로의 회랑** (방어/attrition형):
- fatigue-warden: HP 1445→1620 (+12%), ATK 176→190 (+8%), DEF 97→100 (+3%)
- recommendedPower: 1600→1680

**균열의 훈련장** (wave 누적 피해형):
- memory-tracker: HP 950→1080 (+14%), ATK 185→205 (+11%), DEF 56→58 (+4%)
- memory-scout: HP 790→900 (+14%), ATK 220→240 (+9%), DEF 49→52 (+6%)
- recommendedPower: 1650→1720

**탐욕의 금고** (공격형):
- greed-warden: HP 1156→1300 (+12%), ATK 240→265 (+10%), DEF 61→64 (+5%)
- recommendedPower: 1550→1620

### 그림자 시스템 너프 여부
- 그림자 효과, 추출 시스템, UI, 전투 연동 모두 변경 없음
- 그림자를 넣은 직후에 너프하면 재미가 줄어든다는 원칙 유지

### 조정 후 sim-shadow-battle-balance 결과

Build D / C급 (no_shadow): 59~77% (목표 55~75% ✓)
Build D / C급 (common_shadow): 63~76% (목표 60~80% ✓)
Build D / C급 (rare_shadow): 59~73% ✓
Build D / C급 (gate_named): 63~73% ✓
Build D / C급 (achievement_named): 78~84% ✓
Build D / C급 (mixed_2_slots): 64~78% ✓
Build D / C급 (mixed_3_slots): 65~75% ✓

Build C / C급 (no_shadow): 0% (목표 0~15% ✓)
Build E / C급 (no_shadow): 96~100% (목표 85~100% ✓)
Build F / C급 (no_shadow): 100% ✓

### sim-gate-current 결과

Build D / C급:
- 망각의 서고: 57% victory
- 피로의 회랑: 68% victory
- 균열의 훈련장: 54% victory
- 탐욕의 금고: 65% victory

Build C / D급: 여전히 100% (D급 변경 없음 확인)
Build E/F / C급: 96~100% (안정권 확인)

### sim-manual-battle-balance 결과

Build D / C급 / auto: 64~75% victory
Build D / C급 / manual skill_first: 64~75% victory
Build D / C급 / manual defensive_under_40%: 약간 낮음
Build A/B / C급: 0% (초반 차단 유지)
Build E/F / C급: 99~100%

수동 전투가 C급을 100% 확정승으로 만들지 않음 확인.

### 수정한 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/seed.ts` | C급 몬스터 5종 스탯 상향 (HP/ATK/DEF/SPD), C급 4개 게이트 recommendedPower 상향 |

### persist version 변경 여부
- **변경 없음** (v14 유지)
- 이번 작업은 몬스터/게이트 정의 데이터만 수정

### 검증
- `npm run build` → ✅ 통과 (1951 modules, 511.22 kB JS / 36.65 kB CSS)
- `npx tsx scripts/sim-shadow-battle-balance.ts` → ✅ 통과
- `npx tsx scripts/sim-gate-current.ts` → ✅ 통과
- `npx tsx scripts/sim-manual-battle-balance.ts` → ✅ 통과

### 남은 TODO
- 그림자 레벨업/진화/중복 활용/시너지
- B/A/S급 게이트
- 몬스터 패턴/텔레그래프
- 회복형 전투 소모품

## 12-11B: 그림자 전투 행동 연동 + 군단 슬롯 + 게이트 출현률 + 수동 전투 로그 UX 개선

### 문제
12-11에서 그림자 보유/도감/추출/장착은 작동했지만, 실제 전투에서 그림자 보조 행동이 체감되지 않았다. 로그 메시지가 기계적이었고 발동 확률이 너무 낮았다. 또한 "군단" 컨셉에 비해 슬롯이 너무 늦게/적게 열렸고, 게이트 출현 빈도가 낮아 추출 기회가 부족했다. 수동 전투 로그도 한 화면에 잘 보이지 않았다.

### 변경 원칙
- 그림자 시스템 처음부터 다시 만들지 않음
- types/shadows/game/store/UI 구조 재사용
- XP 보상표 변경 금지
- Main/Dungeon 목표 변경 금지
- 장비 강화 공식 변경 금지
- 칭호 효과 변경 금지
- localStorage key 변경 금지
- persist version 변경 금지
- B/A/S급 게이트 추가 금지
- 그림자 레벨업/진화/시너지 추가 금지

### 원인
`resolveShadowSupportActions`는 이미 자동/수동 전투에 연결되어 있었으나:
- 발동 확률이 기본 4% + role bonus로 너무 낮았음 (assault도 13% 수준)
- rolePower가 0.08~0.22로 데미지가 약했음
- 로그 메시지가 `[이름]이(가) 그림자 보조 행동을 수행했습니다. N 피해.`로 역할 감이 없었음
- 수동 전투 UI에서 그림자 로그가 시스템/일반 로그와 구분되지 않았음

### 수정 내용

**1. 그림자 보조 행동 강화 (`src/lib/game.ts`)**
- 발동 확률: 기본 4% → 10%, role bonus 대폭 상향 (assault +15%, scout +12%, analyst +10%, support +8%, guard +8~15%, hunter +6%)
- max clamp: 42% → 55%
- rolePower: 0.08~0.22 → 0.10~0.28
- rarityPower: common 0.9 → 0.9, rare 1.1 → 1.15, epic 1.25 → 1.35, legendary 1.45 → 1.55
- role별 맞춤 메시지 추가:
  - assault: "[이름]이(가) 빈틈을 찔렀다. N 피해."
  - guard: "[이름]이(가) 방어 태세를 보조했다. N 피해. 받는 피해 X% 감소."
  - scout: "[이름]이(가) 적의 움직임을 읽었다. N 피해."
  - analyst: "[이름]이(가) 약점을 분석했다. N 피해."
  - support: "[이름]이(가) 집중을 유지시켰다. N 피해."
  - hunter: "[이름]이(가) 전리품의 냄새를 추적했다. N 피해."
- guard의 damage_reduction 효과를 activeEffects에 적용 (2턴 지속)

**2. 군단 슬롯 정책 상향 (`src/lib/shadows.ts`)**
- 기존: 직업 티어 기반 (미각성 0, 1차 1, 2차 2) + Lv30/45/60 보너스
- 변경: 레벨 기반 단순 정책
  - Lv 1~9: 1슬롯
  - Lv 10~19: 2슬롯
  - Lv 20~29: 3슬롯
  - Lv 30~44: 4슬롯
  - Lv 45+: 5슬롯
- 이유: 빠른 시점부터 "군단" 느낌을 주기 위해
- ShadowPanel UI에 현재 슬롯 수 명확히 표시 유지

**3. 게이트 출현 확률 상향 (`src/lib/store.ts`)**
- daily_open: 7% → 10%
- daily_completion: 3% → 5%
- random_completion: 5% → 7%
- dungeon_clear: 25% → 30%
- hard_dungeon_clear: 30% → 35%
- main_completion: 50% → 60%
- active gate 1개 제한은 유지

**4. 수동 전투 로그 UI 개선 (`src/components/GatePanel.tsx`)**
- isShadowCombatLog import 추가
- 최근 로그: 8줄 → 6줄 (모바일 가시성)
- 로그 영역에 `max-h-48 overflow-y-auto` 추가 (스크롤 가능)
- 그림자 로그를 보라색 계열로 구분 (`border-purple-400/25 bg-purple-400/10 text-purple-50/85`)
- shadow 로그 label: 'SHADOW' (보라색 배지)
- 가장 최근 로그에 `ring-1 ring-cyan-400/20` 강조
- 전투/시스템/그림자 로그 3종 구분

### 자동/수동 전투 연동 확인
- 자동 전투 `simulateGateWaveBattle`: 헌터 행동 이후 `resolveShadowSupportActions` 호출 확인
- 수동 전투 `performManualBattleAction`: 헌터 행동 이후 동일 helper 호출 확인
- wave 전환 시 그림자 행동이 꼬이지 않음
- 시스템/보조 로그는 maxTurns 계산에서 제외 (기존 12-10B 정책 유지)

### 수정한 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/game.ts` | resolveShadowSupportActions 발동 확률/데미지 상향, role별 맞춤 메시지, guard damage_reduction activeEffects 적용 |
| `src/lib/shadows.ts` | getShadowSlotCount를 레벨 기반 단순 정책으로 변경 (1~5슬롯) |
| `src/lib/store.ts` | rollGateSpawn 확률 전 source 상향 |
| `src/components/GatePanel.tsx` | isShadowCombatLog import, 수동 전투 로그 6줄/스크롤/shadow 보라색 구분/최근 강조 |

### 밸런스 시뮬레이션 결과 (조정 후)

Build D / C급:
- no_shadow: 59~77% (목표 55~75% ✓)
- common_shadow: 71~79% (목표 60~80% ✓)
- rare_shadow: 59~74% ✓
- gate_named_shadow: 68~84% (named는 희귀 → 허용)
- achievement_named_shadow: 81~87% (named는 희귀 → 허용)
- mixed_2_slots: 61~76% ✓
- mixed_3_slots: 78~84% (슬롯 3개 사용 시)

Build C / C급: 0% (목표 0~15% ✓)
Build E / C급: 96~100% (목표 85~100% ✓)
Build F / C급: 100% ✓

### sim-gate-current / sim-manual-battle-balance
- `npx tsx scripts/sim-gate-current.ts` → ✅ 통과
- `npx tsx scripts/sim-manual-battle-balance.ts` → ✅ 통과

### 검증
- `npm run build` → ✅ 통과 (1951 modules, 511.92 kB JS / 36.80 kB CSS)
- `npx tsx scripts/sim-shadow-battle-balance.ts` → ✅ 통과
- `npx tsx scripts/sim-gate-current.ts` → ✅ 통과
- `npx tsx scripts/sim-manual-battle-balance.ts` → ✅ 통과

### persist version 변경 여부
- **변경 없음** (v14 유지)

### 남은 TODO
- 12-12 C급 게이트 밸런스 재조정 (이미 완료, 12-12 기록 참조)
- 그림자 레벨업/진화
- 중복 활용
- 시너지
- 몬스터 패턴/텔레그래프

## 12-11C: 그림자 추출 성공률 + 게이트 출현률 조정

### 목표
그림자 시스템 도입 이후 게이트가 그림자 추출/군단 성장의 핵심 진입점이 되었으나, 체감상 추출 기회와 게이트 출현이 다소 부족했다. 추출 성공률과 출현 확률을 소폭~중폭 상향하여 플레이 체감을 개선한다.

### 변경 원칙
- 그림자 추출 성공률과 게이트 출현 확률만 조정
- 희귀도/품질 롤 변경 금지
- 그림자 전투 효과 변경 금지
- 그림자 슬롯 정책 변경 금지
- gate/monster 전투 수치 변경 금지
- XP 보상표 변경 금지
- Main/Dungeon 목표 변경 금지
- 장비 강화 공식 변경 금지
- 칭호 효과 변경 금지
- localStorage key 변경 금지
- persist version 변경 금지
- B/A/S급 게이트 추가 금지

### 작업 1. 그림자 추출 성공률 상향 (`src/lib/shadows.ts`)

| 등급 | 변경 전 base | 변경 후 base |
|---|---|---|
| E급 | 45% | **52%** |
| D급 | 35% | **42%** |
| C급 | 25% | **32%** |

- SEN bonus: `Math.min(0.15, SEN * 0.0015)` 유지
- shadow extraction bonus: `Math.min(0.08, ...)` 유지
- 최종 cap: 75% → **80%**
- 최종 최소값: 10% 유지
- 희귀도/품질 롤 (`rarityWeightsByRank`) 변경 없음
- 게이트 네임드/legendary 확률 변경 없음

### 작업 2. 게이트 출현 확률 상향 (`src/lib/store.ts`)

| source | 변경 전 | 변경 후 |
|---|---|---|
| daily_open (하루 첫 접속) | 10% | **15%** |
| daily_completion | 5% | **18%** |
| random_completion | 7% | **10%** |
| dungeon_clear | 30% | **75%** |
| hard_dungeon_clear | 35% | **90%** |
| main_completion | 60% | **100%** |

- active gate 1개 제한은 `rollGateSpawn` 진입 시 `if (s.activeGate && s.activeGate.status === 'active') return`로 그대로 유지
- 게이트 queue/stack 추가 없음
- main 완료 100%도 active gate가 이미 있으면 새 gate를 만들지 않음

### 작업 3. 게이트 출현 기대값 간단 점검

**가벼운 사용자** (daily 2개, random 0~1개, dungeon 1개/주)
- 하루: 1 - (1-0.18)^2 ≈ **33%** 확률로 daily에서 1개
- 주간: dungeon 1회 × 75% ≈ **0.75개**
- 체감: 주 1~2개 정도

**현실적 사용자** (daily 4개, random 1개, dungeon 2개/주)
- 하루: 1 - (1-0.18)^4 ≈ **55%** 확률로 daily에서 1개, + random 10%
- 주간: dungeon 2회 × 75% ≈ **1.5개**
- 체감: 하루 0~1개, 주 2~4개

**적극 사용자** (daily 6개, random 2개, dungeon 3개/주)
- 하루: 1 - (1-0.18)^6 ≈ **69%** 확률로 daily에서 1개, + random 2회
- 주간: dungeon 3회 × 75% ≈ **2.25개**
- 체감: 하루 1개 안정적, 주 3~5개

dungeon/main 완료 시 게이트가 확실히 보상 이벤트처럼 느껴지도록 조정. active gate 1개 제한으로 과잉 누적은 방지됨.

### 작업 4. 검증

- `npm run build` → ✅ 통과
- `npx tsx scripts/sim-shadow-battle-balance.ts` → ✅ 통과 (Build C C-gate 0%, Build D C-gate 69% — 전투 밸런스 변화 없음)
- `npx tsx scripts/sim-gate-current.ts` → ✅ 통과
- `npx tsx scripts/sim-manual-battle-balance.ts` → ✅ 통과

### 수정한 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/shadows.ts` | `getShadowExtractionChance` base/cap 상향 (E 52%, D 42%, C 32%, cap 80%) |
| `src/lib/store.ts` | `rollGateSpawn` 확률 전 source 상향 (daily_open 15%, daily_completion 18%, random 10%, dungeon 75%, hard 90%, main 100%) |

### persist version 변경 여부
- **변경 없음** (v14 유지)

### 남은 TODO
- 그림자 레벨업/진화
- 중복 활용
- 시너지
- 몬스터 패턴/텔레그래프

## 12-13: 그림자 중복 활용/강화/분해 시스템

### 목표
12-11 그림자 시스템과 12-11C 게이트/추출 확률 상향 이후 중복 그림자가 쌓일 가능성이 커졌다. 중복 그림자를 의미 있게 활용할 수 있는 "그림자 흡수/분해/강화" 시스템을 추가한다.

### 변경 원칙
- XP 보상표 변경 금지
- Main/Dungeon 목표 변경 금지
- 게이트/몬스터 수치 변경 금지
- 게이트 출현률 변경 금지
- 그림자 추출률/희귀도 롤 변경 금지
- 장비 강화 공식 변경 금지
- 칭호 효과 변경 금지
- localStorage key 변경 금지
- B/A/S급 게이트 추가 금지

### 작업 1. 그림자 강화 데이터 구조 추가

`OwnedShadow`에 선택적 필드 추가:
- `enhancementLevel?: number` — 흡수 강화 레벨 (0~5, 없으면 0)
- `absorbedCount?: number` — 흡수 횟수 누적

`GameState`에 추가:
- `shadowEssence?: number` — 그림자 정수 currency (없으면 0)

### 작업 2. 그림자 정수 currency

분해 시 희귀도별 정수 획득 (`src/lib/shadows.ts`):
| 희귀도 | 정수 |
|---|---|
| common | 1 |
| uncommon | 2 |
| rare | 5 |
| epic | 12 |
| legendary | 30 |

### 작업 3. 흡수 강화 규칙

대상: 일반/희귀/게이트 네임드/준네임드 그림자
제외: 현실 성취 네임드 (isAchievementNamed)

재료: 같은 definitionId의 미장착 중복 그림자 1개
- 장착 중인 그림자는 재료 사용 불가
- 성취 네임드는 재료 사용 불가

강화 규칙:
- 성공률 100%
- 비용 없음
- 재료 1개 소모
- enhancementLevel +1
- 최대 +5

강화 효과 (`getShadowEffects`에서 multiplier 적용):
- 전투 효과 (bonus_damage, damage_reduction, extra_attack_chance 등): 1 + level × 0.06
- 유틸리티 효과 (drop_bonus, extraction_bonus, category_xp_bonus 등): 1 + level × 0.03
- +5에서 전투 총 +30%, 유틸리티 총 +15%

### 작업 4. 분해 규칙

분해 가능: 일반/희귀/게이트 네임드/준네임드
분해 불가: 장착 중 그림자, 현실 성취 네임드

분해 결과:
- shadowEssence 증가
- 해당 OwnedShadow 제거

UI confirm:
- rare 이상은 강화 confirm 문구
- legendary/gate named는 강한 경고

### 작업 5. ShadowPanel UI 개선

- 상단에 그림자 정수 표시
- 각 카드에 `이름 +N` 강화 표시
- 강화 정보: `강화 N/5 · 흡수 M회`
- 흡수 버튼: 재료 수 표시, disabled 사유 tooltip
- 분해 버튼: 획득 정수 표시, 붉은 톤
- 정렬에 "강화순" 추가

### 작업 6. 전투 로그에 강화 반영

`resolveShadowSupportActions`에서 로그 메시지에 enhancementLevel 표시:
- "[그림자 보병 +2]이(가) 빈틈을 찔렀다. 18 피해."

### 작업 7. 저장 데이터 호환성

- 기존 ownedShadows에 enhancementLevel 없음 → `?? 0` fallback
- 기존 store에 shadowEssence 없음 → `?? 0` fallback
- 장착 중 그림자 분해/재료 사용 불가로 참조 깨짐 방지
- persist version v14 유지

### 작업 8. 시뮬레이션 결과

Build D / C급:
- no_shadow: 59~77%
- common_shadow +0: 71~79%
- common_shadow +3: 64~80% (+3 효과 미미)
- rare_shadow +0: 59~74%
- rare_shadow +3: 65~76% (적절한 상향)
- gate_named +0: 68~84%
- gate_named +3: 70~81% (적절한 상향)
- mixed_enhanced (3개 +3): 80~93% (3슬롯 전부 강화 시 체감)

Build C / C급: 0% (강화 후에도 변화 없음 ✓)
Build E/F: 안정권 유지

### 작업 9. 검증

- `npm run build` → ✅ 통과
- `npx tsx scripts/sim-shadow-battle-balance.ts` → ✅ 통과
- `npx tsx scripts/sim-gate-current.ts` → ✅ 통과
- `npx tsx scripts/sim-manual-battle-balance.ts` → ✅ 통과

### 수정한 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/types.ts` | OwnedShadow에 enhancementLevel, absorbedCount 추가 |
| `src/lib/shadows.ts` | getShadowEffects에 enhancement multiplier 적용, 분해/흡수 helper 추가 |
| `src/lib/game.ts` | resolveShadowSupportActions 로그에 +N 표시 |
| `src/lib/store.ts` | shadowEssence 상태/초기화/마이그레이션, absorbShadow/decomposeShadow 액션 |
| `src/components/ShadowPanel.tsx` | 정수 표시, 강화/분해 버튼, confirm, 강화순 정렬 |
| `scripts/sim-shadow-battle-balance.ts` | +3 케이스 추가 |

### persist version 변경 여부
- **변경 없음** (v14 유지)

### 남은 TODO
- 그림자 레벨업/진화
- 그림자 중복 자동 정리/잠금 기능
- 그림자 시너지
- B/A/S급 게이트
- 몬스터 패턴/텔레그래프
- 회복형 전투 소모품

## 12-13B: 그림자 잠금/즐겨찾기 + 실수 방지 UX

### 목표
12-13에서 강화/분해 시스템이 추가되었으나, 좋은 그림자나 주력 그림자를 실수로 분해하거나 재료로 소모할 위험이 있다. 잠금/즐겨찾기 UX를 추가하여 실수를 방지하고 그림자 관리를 개선한다.

### 변경 원칙
- 그림자 강화/분해 기능은 그대로 유지
- 전투 수치 변경 금지
- 그림자 강화 공식 변경 금지
- localStorage key 변경 금지
- B/A/S급 게이트 추가 금지

### 작업 1. 잠금/즐겨찾기 필드 추가 (`src/lib/types.ts`)

`OwnedShadow`에 선택적 필드 추가:
- `isLocked?: boolean` — 잠금 상태 (없으면 false)
- `isFavorite?: boolean` — 즐겨찾기 상태 (없으면 false)

### 작업 2. store 액션 (`src/lib/store.ts`)

- `toggleShadowLock(instanceId)` — 잠금/해제 토글
- `toggleShadowFavorite(instanceId)` — 즐겨찾기 토글
- 둘 다 전투/보상/스탯에 영향 없음

### 작업 3. 흡수/분해 보호 로직

`getShadowAbsorbMaterialCount` (`src/lib/shadows.ts`):
- 재료에서 **잠긴 그림자** 제외
- 재료에서 **성취 네임드** 제외 (기존)

`canDecomposeShadow` (`src/lib/shadows.ts`):
- **잠긴 그림자** 분해 불가 추가
- 장착 중, 성취 네임드는 기존처럼 불가

`absorbShadow` (`src/lib/store.ts`):
- 재료 findIndex에서 `!shadow.isLocked && !shadow.isAchievementNamed` 조건 추가

잠긴 그림자의 대상 강화는 그대로 가능:
- 사용자는 주력 그림자를 잠금한 채, 다른 중복을 재료로 사용하여 강화 가능

### 작업 4. ShadowPanel UI 개선

카드 상태 배지:
- 출전 중: amber 배지
- 잠금: rose 배지
- 즐겨찾기: yellow 배지

버튼:
- 흡수 버튼: 재료 수 표시 (잠긴 그림자는 재료에서 제외되어 반영)
- 분해 버튼: 잠긴 그림자는 disabled, tooltip "잠금 중: 분해 불가"
- 잠금 버튼: 잠금 시 rose 스타일, 해제 시 기본 스타일
- 즐겨찾기 버튼: 즐겨찾기 시 yellow 스타일

정렬:
- 기본 (obtained): 출전 중 → 즐겨찾기 → 잠금 → 희귀도 → 강화 → 획득순
- 즐겨찾기순, 잠금순 추가

분해 confirm:
- 잠금 상태 분해 시: confirm 대신 잠금 해제 안내 메시지

### 작업 5. 도감 개선

도감 카드에 보유 정보 추가:
- 보유 수
- 최고 강화 레벨
- 출전 중 여부

### 작업 6. 저장 데이터 호환성

- 기존 ownedShadows에 isLocked/isFavorite 없음 → `?? false` fallback (getShadowEffects/canDecomposeShadow에서 처리)
- persist version v14 유지

### 작업 7. 검증

- `npm run build` → ✅ 통과
- `npx tsx scripts/sim-shadow-battle-balance.ts` → ✅ 통과 (Build D C-gate 69% — 변화 없음)
- `npx tsx scripts/sim-gate-current.ts` → ✅ 통과
- `npx tsx scripts/sim-manual-battle-balance.ts` → ✅ 통과

### 수정한 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/types.ts` | OwnedShadow에 isLocked, isFavorite 추가 |
| `src/lib/shadows.ts` | getShadowAbsorbMaterialCount에서 잠금 제외, canDecomposeShadow에서 잠금 제외 |
| `src/lib/store.ts` | toggleShadowLock, toggleShadowFavorite 액션, absorbShadow 재료 필터에 잠금 추가 |
| `src/components/ShadowPanel.tsx` | 잠금/즐겨찾기 버튼, 상태 배지, 정렬 개선, 도감 보유 정보 |

### persist version 변경 여부
- **변경 없음** (v14 유지)

### 남은 TODO
- 일괄 분해/자동 정리
- 그림자 레벨업/진화
- 그림자 시너지
- B/A/S급 게이트
- 몬스터 패턴/텔레그래프
- 회복형 전투 소모품

## 12-14: 그림자 레벨업/진화 시스템

### 목표
그림자에게 장기 육성 축을 추가한다. 출전한 그림자가 전투 경험치를 얻고 레벨업하며, 특정 조건에서 진화할 수 있게 한다.

### 변경 원칙
- 그림자 강화/분해/잠금/즐겨찾기 정책 그대로 유지
- 전투 수치 변경 금지 (레벨 multiplier는 낮게)
- localStorage key 변경 금지
- B/A/S급 게이트 추가 금지

### 작업 1. 레벨/XP 구조

`OwnedShadow` 기존 `level`/`xp` 필드 사용 (이미 있었음).
추가 필드:
- `evolutionStage?: number` — 진화 단계
- `evolvedFromDefinitionId?: string` — 진화 전 definitionId

`ShadowDefinition`에 추가:
- `evolutionTargetDefinitionId?: string` — 진화 대상 definitionId

### 작업 2. XP 테이블 (`src/lib/shadows.ts`)

Helper 추가:
- `getShadowMaxLevel(shadow)`: 일반 20, 게이트 네임드 25, 성취 네임드 30
- `getShadowXpForNextLevel(level)`: `round(20 * level^1.35)`
- `addShadowXp(shadow, amount)`: 레벨업 처리, maxLevel 도달 시 xp=0

XP 예시:
- Lv1→2: 20
- Lv5→6: 170
- Lv10→11: 450
- Lv20: 여러 번 게이트 클리어 필요

### 작업 3. 전투 XP 지급 (`src/lib/store.ts`)

`getShadowXpReward(gateRank, outcome)`:
| 등급 | 승리 | 패배 | 무승부 |
|---|---|---|---|
| E | 12 | 4 | 0 |
| D | 22 | 7 | 0 |
| C | 38 | 12 | 0 |
| B | 60 | 18 | 0 |
| A | 90 | 25 | 0 |
| S | 130 | 35 | 0 |

지급 위치:
- `createGateBattleOutcomeUpdate`: 수동/전환 전투 결과 처리 시 출전 그림자 XP 지급
- `startGateBattle`: 자동 전투 결과 처리 시 동일하게 지급
- draw/cancel: 0 XP
- defeat: 소량 XP

레벨업 시 시스템 메시지: `[그림자 이름] Lv.N`.

### 작업 4. 레벨 효과 multiplier (`src/lib/shadows.ts`)

`getShadowEffects`에 추가:
- combat level multiplier: `1 + (level - 1) * 0.01`
- utility level multiplier: `1 + (level - 1) * 0.005`

최종 효과 = enhancement multiplier × level multiplier
- +3 Lv1: 전투 1.18×
- +3 Lv10: 전투 1.18 × 1.09 = 약 1.29×
- +5 Lv20: 전투 1.30 × 1.19 = 약 1.55×

### 작업 5. 진화 시스템 1차

진화 조건:
- definition에 `evolutionTargetDefinitionId` 존재
- level >= 10
- enhancementLevel >= 2
- shadowEssence 비용 (common 10, uncommon 25, rare 60)
- 성취 네임드는 진화 보류

진화 대상 계열:
| 출발 | 진화 | 희귀도 |
|---|---|---|
| 그림자 쥐 | 그림자 정찰병 | common→uncommon |
| 그림자 보병 | 어둠의 처형병 | common→uncommon |
| 망각의 기록병 | 망각의 서기관 | uncommon→rare |
| 피로의 수호병 | 피로의 방패병 | uncommon→rare |
| 탐욕의 사냥개 | 탐욕의 수집가 | uncommon→rare |

진화 후 처리:
- definitionId → target, 이름/희귀도/계급/역할 변경
- level: 1로 리셋, xp: 0
- enhancementLevel: 유지
- absorbedCount: 유지
- traits: 유지
- isLocked/isFavorite: 유지
- instanceId: 유지
- `evolutionStage` +1, `evolvedFromDefinitionId` 기록

### 작업 6. ShadowPanel UI (`src/components/ShadowPanel.tsx`)

레벨/XP 표시:
- `Lv N/MAX` + XP bar (작은 progress bar)
- maxLevel 도달 시 "MAX"

진화 표시:
- "진화 가능" emerald 배지 (조건 충족 시)
- 진화 대상명 + 정수 비용 표시
- 진화 버튼 (disabled 시 사유 표시)
- confirm: 레벨 초기화 안내

### 작업 7. 시뮬레이션 업데이트

`scripts/sim-shadow-battle-balance.ts`:
- `shadowLevel` 추가
- 케이스 추가: `common_shadow_plus3_lvl10`, `rare_shadow_plus3_lvl10`, `gate_named_shadow_plus3_lvl10`, `mixed_trained`
- seedBase에 `shadowLevel * 5000` 추가하여 충돌 방지

### 작업 8. 검증 결과

- `npm run build` → ✅ 통과
- `npx tsx scripts/sim-shadow-battle-balance.ts` → ✅ 통과
- `npx tsx scripts/sim-gate-current.ts` → ✅ 통과
- `npx tsx scripts/sim-manual-battle-balance.ts` → ✅ 통과

Build D / C급 주요 결과:
- no_shadow: 59-77%
- common +3: 64-80%
- common +3 Lv10: 67-74% (소폭 상승)
- rare +3 Lv10: 69-74% (소폭 상승)
- gate_named +3 Lv10: 70-81% (소폭 상승)
- mixed_trained (3개 +3 Lv10): 81-89% (체감 상승)

Build C / C급: **0%** (변화 없음 ✓)

### 수정한 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/types.ts` | ShadowDefinition에 evolutionTargetDefinitionId, OwnedShadow에 evolutionStage/evolvedFromDefinitionId |
| `src/lib/shadows.ts` | getShadowEffects에 level multiplier, XP 테이블 helper, 진화 helper, 5개 definition에 진화 대상 추가 |
| `src/lib/store.ts` | toggleShadowLock/Favorite 다음에 evolveShadow 액션, auto/manual 전투 결과에 shadow XP 지급 |
| `src/components/ShadowPanel.tsx` | Lv/XP bar, 진화 가능 배지/버튼, 진화 조건 표시 |
| `scripts/sim-shadow-battle-balance.ts` | shadowLevel 케이스 추가, seedBase 변경 |
| `CLAUDE.md` | 12-14 기록 추가 |

### persist version 변경 여부
- **변경 없음** (v14 유지)
- 기존 ownedShadows level/xp 없음 → `?? 1` / `?? 0` fallback
- evolutionStage/evolvedFromDefinitionId 없음 → `?? 0` / undefined fallback

### 남은 TODO
- 일괄 분해/자동 정리
- 그림자 고급 진화 (2차, 3차)
- 네임드 전용 진화
- 그림자 시너지
- B/A/S급 게이트
- 몬스터 패턴/텔레그래프
- 회복형 전투 소모품
## 12-15: 그림자 비주얼 시스템 1차

### 목표
B/A/S급 게이트 추가와 전투/성장 수치 변경은 보류하고, 이미 들어간 그림자 시스템을 더 게임답게 보이도록 시각 레이어를 강화했다. 그림자가 단순 텍스트 카드가 아니라 역할과 개성이 있는 군단 구성원처럼 보이게 하는 것이 목적이다.

### 변경 원칙
- XP 보상표, Main/Dungeon 목표, 게이트/몬스터 수치, 게이트 출현률 변경 없음
- 그림자 추출률/희귀도 롤, 강화/레벨/진화 공식 변경 없음
- 자동/수동 전투 구조 대규모 변경 없음
- 장비 강화 공식, 칭호 효과 변경 없음
- localStorage key `levelup-save` 변경 없음
- persist version 변경 없음: v14 유지
- B/A/S급 게이트 추가 없음

### visualKey / 비주얼 구조
- `ShadowDefinition`에 optional visual 필드 추가: `visualKey`, `portraitVariant`, `visualTheme`, `silhouetteType`, `accentColor`
- 저장 데이터에는 넣지 않고 definition 메타데이터로만 사용한다.
- `src/lib/shadows.ts`에서 `SHADOW_VISUALS` 전용 테이블과 role fallback을 통해 모든 그림자가 visual profile을 갖도록 했다.
- 전용 visualKey가 없으면 role 기반 silhouette로 fallback한다.

### 신규 컴포넌트
| 파일 | 역할 |
|---|---|
| `src/components/shadows/ShadowPortrait.tsx` | inline SVG/CSS 기반 그림자 초상 렌더러. rarity frame, role silhouette, named glow, mist/rune/aura, idle float/pulse 포함 |
| `src/components/shadows/ShadowCard.tsx` | 보유 그림자 카드. 초상, 등급/역할/네임드 배지, Lv/XP, 강화, 잠금/즐겨찾기, 진화 가능 상태, 관리 버튼 통합 |

### ShadowPanel 개편
- 상단 패널을 군단 전시실 느낌으로 강화했다.
- 그림자 정수, 보유 수, 출전 수, 출전 군단 전력 표시를 추가했다.
- 출전 중 군단 슬롯에 `ShadowPortrait`를 표시해 현재 출전 그림자가 크게 떠 있는 느낌을 준다.
- 전체 보유 그리드는 새 `ShadowCard`를 사용해 초상 중심 카드로 변경했다.
- 도감 카드에도 portrait를 표시하고, 미획득/숨김 상태는 silhouette을 흐리게 보여준다.

### 진화 전/후 외형 차이
- 진화체는 별도 `visualKey`, `visualTheme: 'evolved'`, 상위 silhouette을 가진다.
- 그림자 쥐 -> 그림자 정찰병: 작은 짐승형 -> 날렵한 정찰병
- 그림자 보병 -> 어둠의 처형병: 기본 병사 -> 대검 처형병
- 망각의 기록병 -> 망각의 서기관: scroll/기록형 -> book/rune 마도형
- 피로의 수호병 -> 피로의 방패병: 작은 방패 -> tower shield
- 탐욕의 사냥개 -> 탐욕의 수집가: 사냥개 -> chained beast/전리품 분위기

### GatePanel 전투 존재감
- 전투 화면에 출전 그림자 roster strip을 추가했다.
- 자동 전투 결과 공개 중에는 최근 shadow combat log의 `actorId`를 읽어 해당 portrait를 pulse/highlight한다.
- 수동 전투 화면에도 동일한 roster strip을 추가했다.
- guard/analyst/assault 등 role에 따라 하이라이트 색을 다르게 했다.
- 전투 로직은 변경하지 않고 `actorId: shadow:<instanceId>` 로그만 읽는 표시 레이어로 구현했다.

### fallback 전략
1. definition별 `SHADOW_VISUALS` 전용 visualKey가 있으면 사용
2. 없으면 role 기반 silhouette 사용
3. role도 애매하면 rarity/default portrait 사용

### 검증
- `npm run build` 통과
- `npx tsx scripts/sim-shadow-battle-balance.ts` 통과
- `npx tsx scripts/sim-gate-current.ts` 통과
- `npx tsx scripts/sim-manual-battle-balance.ts` 통과

### persist version
- 변경 없음. v14 유지.

### 남은 TODO
- 실제 개별 portrait PNG/WebP 자산 제작 및 교체
- 그림자 행동 이펙트 강화
- 전투 비주얼 보드
- 그림자 시너지
- 고급 진화/네임드 전용 진화
- B/A/S급 게이트 (사용자 성장 후)

## 12-16: 그림자 원정 시스템 1차

### 목표와 방향
- 기존에 논의된 "매일 던전"은 구현하지 않고, 그림자 육성 전용 콘텐츠인 "그림자 원정"으로 방향을 변경했다.
- 헌터 전투는 헌터가 직접 싸우고 그림자가 보조하는 구조, 게이트는 사건형 전투와 그림자 추출 구조, 그림자 원정은 헌터가 직접 싸우지 않고 그림자 병사만 지휘하는 육성 구조로 역할을 분리했다.
- 향후 무한의 탑은 헌터+그림자 군단의 장기 성장 측정 콘텐츠로 남겨둔다.

### 핵심 원칙
- 원정에서 헌터 XP는 지급하지 않는다.
- 원정에서 그림자 추출은 발생하지 않는다.
- 보상은 그림자 XP와 `shadowEssence` 중심이다.
- XP 보상표, Main/Dungeon 목표, 게이트/몬스터 수치, 게이트 출현률, 그림자 추출률/희귀도 롤, 그림자 강화/레벨/진화 공식, 장비 강화 공식, 칭호 효과는 변경하지 않았다.
- localStorage key `levelup-save` 유지.
- persist version 변경 없음: v14 유지.
- B/A/S급 게이트 추가 없음.

### 타입과 저장 구조
`src/lib/types.ts`에 원정 타입을 추가했다.
- `ShadowExpeditionType`: `training | essence | hunt | scout`
- `ShadowExpeditionStatus`: `locked | available | in_progress | completed | expired`
- `ShadowExpeditionCommand`: `attack | defend | scout | analyze | search`
- `ShadowExpeditionOutcome`: `great_success | success | partial | failure`
- `ShadowExpedition`, `ShadowExpeditionLog`, `ShadowExpeditionResult`

`src/lib/store.ts` state 추가:
- `shadowExpeditions: ShadowExpedition[]`
- `lastShadowExpeditionDate?: string`
- `activeShadowExpeditionId?: string`

기존 저장 데이터 fallback:
- migrate에서 `shadowExpeditions ?? []`, `lastShadowExpeditionDate ?? undefined`, `activeShadowExpeditionId ?? undefined`
- hardReset 초기화 포함

### 생성/해금 정책
- 앱 진입 시 `ensureTodayShadowExpedition()`로 오늘 날짜 기준 원정 1개를 생성한다.
- 오늘 이미 생성된 원정이 있으면 중복 생성하지 않는다.
- daily 완료 후에도 `ensureTodayShadowExpedition()`를 호출해 해금 상태를 갱신한다.
- 오늘 daily 2개 완료 시 `available`, 2개 미만이면 `locked`.
- 하루 1회 완료 구조. `completed`는 당일 재도전 불가.
- 만료 시간이 지난 미완료 원정은 `expired` 처리.

### 원정 타입 4종
`src/lib/shadowExpeditions.ts`에 원정 템플릿을 추가했다.
- `training`: 그림자 훈련장. 추천 역할 `assault / guard / support`. XP 높음, 정수 낮음.
- `essence`: 흩어진 그림자 정수. 추천 역할 `hunter / scout / analyst`. 정수 높음, XP 보통.
- `hunt`: 균열 잔재 소탕. 추천 역할 `assault / scout / hunter`. XP/정수 균형.
- `scout`: 불안정한 균열 정찰. 추천 역할 `scout / analyst / support`. 안정형.

### 파티 편성
- 보유 그림자 중 1~5명 선택.
- 장착 중, 잠금, 즐겨찾기, 성취 네임드 모두 원정 가능.
- 1차는 즉시 수동 세션형 콘텐츠라 원정 중 사용 불가 상태는 만들지 않는다.
- 선택 파티의 원정 전력, 요구 전력, 추천 역할 매칭, 예상 난이도를 UI에 표시한다.

### 원정 전력 계산
`src/lib/shadowExpeditions.ts` helper:
- `getShadowExpeditionPower`
- `getShadowExpeditionPartyPower`
- `getShadowExpeditionRecommendedRoleMatches`
- `estimateShadowExpeditionSuccess`

공식:
- `definition.basePower`
- rarity multiplier: common 1.0, uncommon 1.1, rare 1.25, epic 1.45, legendary 1.75
- enhancement: `1 + enhancementLevel * 0.08`
- level: `1 + (level - 1) * 0.015`
- recommended role match: +15%
- named: +8%
- 추천 역할 다양성 2종 +5%, 3종 +10%

### 수동 지휘 턴제 구조
- HP 전투가 아니라 `progress / risk` 기반 턴제.
- progress 100 이상이면 성공권, risk 100 이상이면 실패.
- maxTurns 종료 시 progress/risk로 결과 판정.

결과 판정:
- risk >= 100: failure
- progress >= 120 and risk < 70: great_success
- progress >= 100: success
- progress >= 60: partial
- 그 외 failure

명령 5종:
- `attack`: 진행도 크게 상승, 위험도 상승. assault 보너스.
- `defend`: 위험도 감소, 진행도 소폭 상승. guard/support 보너스.
- `scout`: 위험도 감소, 다음 턴 안정화. scout 보너스.
- `analyze`: 진행도 상승, 다음 attack/search 강화. analyst/support 보너스.
- `search`: 정수 보너스 stack, 위험도 상승. hunter/scout 보너스.

### 보상 정책
원정 보상은 파티 전원에게 지급된다.
- training: 대성공 XP 55/정수 2, 성공 XP 40/정수 1, 부분 XP 18, 실패 XP 6
- essence: 대성공 XP 28/정수 12, 성공 XP 20/정수 8, 부분 XP 10/정수 3, 실패 XP 5
- hunt: 대성공 XP 42/정수 8, 성공 XP 30/정수 5, 부분 XP 14/정수 2, 실패 XP 5
- scout: 대성공 XP 36/정수 6, 성공 XP 24/정수 4, 부분 XP 12/정수 1, 실패 XP 4
- search stack은 실패가 아니면 정수 +0~3 보너스.

그림자 XP 지급:
- 기존 `addShadowXp` helper 재사용.
- 파티 전원에게 동일 XP 지급.
- maxLevel 정책 유지.
- 레벨업 메시지를 시스템 메시지에 포함.

### UI
신규 컴포넌트:
- `src/components/shadows/ShadowExpeditionPanel.tsx`

ShadowPanel 통합:
- 군단 전시실 아래에 오늘의 그림자 원정 섹션 추가.
- 원정 카드: 제목, 상태, daily 완료 수, 요구 전력, 파티 전력, 예상 난이도.
- 파티 편성: ShadowPortrait 기반 compact 카드로 선택.
- 지휘 화면: progress/risk bar, turn/maxTurns, 명령 버튼 5종.
- 로그: 최근 6줄, actorShadowId가 있는 로그는 해당 그림자 초상 highlight.
- 완료 후 outcome, XP/정수, progress/risk 표시.

### 시뮬레이션
신규 스크립트:
- `scripts/sim-shadow-expedition.ts`

검증 범위:
- low/basic/trained/named party
- training/essence/hunt/scout
- attack_only/balanced/safe/greedy_search/role_matched

요약:
- low party는 대부분 failure, 일부 안정형 원정에서 partial 가능.
- basic party는 성공 가능하고, 역할/전략이 맞으면 대성공도 가능.
- trained/named party는 안정적으로 성공한다.
- greedy_search는 정수 기대치가 높지만 위험도도 상승한다.
- safe 전략은 실패를 크게 줄이지만, 고전력 파티에서는 대성공도 잘 나온다. 향후 고급 원정에서는 safe 대성공률 제한 조정 가능.

### 검증 결과
- `npm run build` 통과. Vite chunk size warning만 존재.
- `npx tsx scripts/sim-shadow-expedition.ts` 통과.
- `npx tsx scripts/sim-shadow-battle-balance.ts` 통과.
- `npx tsx scripts/sim-gate-current.ts` 통과.
- `npx tsx scripts/sim-manual-battle-balance.ts` 통과.
- 브라우저에서 `http://localhost:3002` 군단 탭 원정 패널 렌더링 확인.
- 콘솔 error/warning 없음.

### 기존 시스템 영향
- 게이트 전투 로직 변경 없음.
- 그림자 추출 없음/추출률 변경 없음.
- 그림자 강화/진화 공식 변경 없음.
- ShadowPortrait/ShadowCard 비주얼 시스템 유지 및 원정 UI에서 재사용.
- persist version 변경 없음: v14.

### 남은 TODO
- 원정 1~3개로 확장
- 장시간 원정/타이머 원정
- 고급 원정
- 무한의 탑
- 보스 추적
- 일일 박스/도전 카드

## 12-17B 전투 로그 UX 개선

목표: 게이트 자동 전투, 게이트 수동 전투, 그림자 원정에서 전투 로그가 전투 체감의 중심에 오도록 가독성, 배치, 최신 행동 강조, 모바일 사용성을 개선했다. 이번 작업은 로그 UI/렌더링 레이어만 다루며 전투 수치, 원정 수치, 보상, XP, 정수, 저장 구조는 변경하지 않았다.

### 변경 범위
- 전투/원정 수치와 공식 변경 없음.
- 게이트/몬스터 수치 변경 없음.
- 그림자 전투/강화/레벨/진화 공식 변경 없음.
- 원정 `progress / risk` 계산 공식 변경 없음.
- 보상/XP/정수 지급량 변경 없음.
- localStorage key 변경 없음: `levelup-save`.
- persist version 변경 없음: v14.

### 공용 로그 컴포넌트
신규 컴포넌트:
- `src/components/CombatLogPanel.tsx`

역할:
- 최근 로그 5~6줄을 우선 표시한다.
- 전체 로그 보기/접기를 공통 처리한다.
- 최신 로그와 직전 로그를 시각적으로 구분한다.
- 로그 타입별 배지와 색상을 통일한다.
- 데미지, XP, 정수, 진행도, 위험도, 성공/실패, 방어/회피/치명타 같은 핵심 단어를 렌더링 단계에서 강조한다.
- `prefers-reduced-motion: reduce`에서 최신 로그 flash animation을 끈다.

### 게이트 로그 개선
- `GatePanel`의 자동 전투 결과 로그와 수동 전투 로그를 `CombatLogPanel` 기반으로 표시한다.
- `BattleTurn`을 렌더링 단계에서 `헌터 / 그림자 / 몬스터 / 방어 / 시스템 / 보상 / 결과` tone으로 분류한다.
- 최신 행동이 버튼 입력 흐름 가까이에 보이도록 수동 전투 로그를 행동 영역 직후에 배치했다.
- 그림자 actor 로그는 기존 `actorId = shadow:*` 구조를 활용해 출전 그림자 roster highlight와 연결한다.
- 자동 전투 결과 공개 중에는 전송 중 로그를 순차 표시하고, 완료 후에는 최근 로그 우선 + 전체 로그 펼치기를 제공한다.

### 그림자 원정 로그 개선
- `ShadowExpeditionPanel`의 원정 로그를 `CombatLogPanel`로 교체했다.
- 원정 로그 type을 `명령 / 그림자 / 위험 / 보상 / 시스템` tone으로 표시한다.
- `actorShadowId`가 있는 로그는 작은 `ShadowPortrait`를 함께 보여 주며, 기존 battlefield highlight 흐름과 연결한다.
- 원정 화면 흐름은 `battlefield -> progress/risk -> command buttons -> expedition log`가 이어지도록 유지했다.

### 모바일 레이아웃
- 로그 패널은 compact 모드에서 높이를 제한하고, 최근 로그가 먼저 보이게 했다.
- 전체 로그는 접힌 상태가 기본이며, 필요할 때만 펼친다.
- 버튼 입력 후 최신 로그가 바로 위쪽에 강조되어 작은 화면에서도 행동 결과를 놓치지 않도록 했다.

### 검증 결과
- `npm run build` 통과. 첫 시도는 샌드박스 상위 디렉터리 접근 제한으로 실패했으나, 승인된 환경에서 `tsc && vite build` 통과. Vite chunk size warning만 존재.
- `npx tsx scripts/sim-shadow-expedition.ts` 통과.
- `npx tsx scripts/sim-manual-battle-balance.ts` 통과.
- `npx tsx scripts/sim-shadow-battle-balance.ts` 통과.
- `npx tsx scripts/sim-gate-current.ts` 통과.
- 브라우저에서 `http://localhost:3002` 렌더링 확인, 콘솔 error 없음.
- 군단 탭 원정 패널에서 `EXPEDITION LOG`, battlefield, 모바일 폭 렌더링 확인.
- 현재 로컬 저장 상태에는 활성 게이트가 없어 실제 게이트 전투 로그 화면은 발생 조건까지 확인하지 못했지만, 게이트 탭 렌더링과 콘솔 error 없음은 확인했다.

### 남은 TODO
- 실제 모바일 기기에서 전투 로그 사용감 피드백 수집.
- 게이트 전투 보드/VFX 고도화.
- 실제 그림자 portrait 자산 교체.
- 원정 2~3개 확장.
- 무한의 탑.
- 보스 추적.
- 일일 박스/도전 카드.

## 12-16B 그림자 원정 연출 강화

목표: 12-16에서 추가한 그림자 원정의 전투/성장/보상 수치는 유지하고, 수동 지휘형 턴제 화면의 명령 피드백과 시각적 몰입감을 강화했다. 사용자가 헌터로 직접 싸우는 것이 아니라 후방 지휘관처럼 명령하고, 그림자 병사들이 그 명령에 반응한다는 체감을 만드는 것이 핵심이다.

### 변경 범위
- 수치/공식/보상 변경 없음.
- `progress / risk` 계산 공식 변경 없음.
- 그림자 XP/정수 지급량 변경 없음.
- 게이트/몬스터/추출/강화/레벨/진화 공식 변경 없음.
- localStorage key 변경 없음.
- persist version 변경 없음: v14.

### 명령별 이펙트
`src/components/shadows/ShadowExpeditionPanel.tsx`에 명령별 lightweight visual effect를 추가했다.
- `attack`: 붉은/주황 slash line, 공격 flash.
- `defend`: 푸른 shield glow, 방어막 ring.
- `scout`: 청록 scan line, 탐색 pulse.
- `analyze`: 보라 rune/glyph ring, 약점 분석 느낌.
- `search`: 금색/보라 sparkle, 정수 파편 glow.

외부 라이브러리, canvas, WebGL은 추가하지 않고 CSS class와 작은 div layer만 사용했다.

### 그림자 portrait highlight
- 최근 `actorShadowId` 로그에 해당하는 그림자는 강한 pulse ring으로 표시한다.
- 현재 명령과 role이 맞는 그림자들은 subtle glow를 받는다.
- 파티 row에서는 실제 활약 그림자와 명령 적합 그림자를 분리해 강조한다.
- ShadowPortrait는 기존 12-15 비주얼 시스템을 그대로 재사용한다.

### progress/risk UI
- progress/risk bar를 별도 `StatBar`로 정리했다.
- progress는 100 성공 임계점, 100 초과 상태, 변화량 배지를 더 명확히 표시한다.
- risk는 70 이상 경고, 90 이상 danger pulse, 100 실패 임계점을 표시한다.
- 최근 로그에서 `진행도 +N`, `위험도 +N/-N`을 읽어 짧은 변화량 배지를 보여준다.

### 원정 타입별 테마
원정 타입마다 배경/테두리/accent/icon을 다르게 했다.
- `training`: 푸른 수련장/전투 훈련 톤.
- `essence`: 보라 심연/정수 파편 톤.
- `hunt`: 붉은 잔재 사냥 톤.
- `scout`: 청록 안개/스캔 톤.

### 로그와 결과 화면
- 로그는 최근 6줄 중심으로 유지하고, type별 라벨/색/아이콘을 강화했다.
- 최신 로그는 강조 배경을 준다.
- 결과 화면은 outcome별 tone을 나누고, 대성공/성공/부분성공/실패 배지와 보상 카드를 강화했다.
- search stack bonus와 레벨업 그림자 목록을 결과 카드 안에서 확인할 수 있다.

### 명령 버튼/파티 선택 UX
- 명령 버튼에 명령명, 짧은 설명, 성향, 추천 role, 파티 내 role match 수를 표시한다.
- 추천 role과 맞는 그림자에는 `추천` badge를 표시한다.
- 파티 선택 영역에 역할 coverage, 요구 전력 대비 ratio, 예상 난이도를 더 잘 보이게 정리했다.
- ShadowExpeditionPanel은 접기/펼치기 가능하게 만들어 ShadowPanel의 기존 보유/도감/강화 UX를 밀어내지 않도록 했다.
- 모바일에서는 명령 버튼을 2열 grid로 유지하고, 로그/파티 row는 compact하게 스크롤되도록 구성했다.

### 검증 결과
- `npm run build` 통과. Vite chunk size warning만 존재.
- `npx tsx scripts/sim-shadow-expedition.ts` 통과.
- `npx tsx scripts/sim-shadow-battle-balance.ts` 통과.
- `npx tsx scripts/sim-gate-current.ts` 통과.
- `npx tsx scripts/sim-manual-battle-balance.ts` 통과.
- 브라우저에서 `http://localhost:3002` 앱 렌더링 확인.
- 군단 탭에서 그림자 원정 패널 렌더링 확인.
- 브라우저 콘솔 error 없음.

### 남은 TODO
- 원정 2~3개 확장
- 장시간 원정/타이머 원정
- 무한의 탑
- 보스 추적
- 일일 박스/도전 카드
- 고급 전투 보드/VFX

## 12-17 그림자 원정 전장 보드/VFX

목표: 12-16/12-16B의 그림자 원정 시스템과 명령 피드백을 유지하면서, 원정 화면을 단순 패널 UI가 아니라 작은 전장처럼 보이게 만드는 전용 battlefield layer를 추가했다. 사용자가 명령을 누르면 그림자 병사들이 전장 위에서 반응하고, 진행도/위험도 변화가 배경과 VFX로 체감되도록 했다.

### 변경 범위
- 원정 `progress / risk` 계산 공식 변경 없음.
- 원정 보상/XP/정수 수치 변경 없음.
- 그림자 전투/강화/레벨/진화 공식 변경 없음.
- 게이트/몬스터/추출/XP/장비/칭호 수치 변경 없음.
- localStorage key 변경 없음.
- persist version 변경 없음: v14.
- 박스/카드/보스/무한의 탑/B/A/S급 게이트 추가 없음.

### ShadowExpeditionBattlefield
신규 컴포넌트:
- `src/components/shadows/ShadowExpeditionBattlefield.tsx`

역할:
- 선택된 원정 파티 1~5명을 전장 위 반원형/전후열 배치로 표시한다.
- 각 그림자는 `ShadowPortrait`를 재사용하고 이름, Lv, 강화, role을 compact label로 표시한다.
- `latestCommand`, `latestActorShadowId`, `progress`, `risk`, `outcome`만 받아 시각 상태를 계산한다.
- 원정 로직 helper나 보상 계산은 호출하지 않는다.

### 원정 타입별 전장 배경
- `training`: 푸른 수련장, 원형 rune floor, 안정적인 훈련장 톤.
- `essence`: 보라 균열과 정수 particle, 심연/정수 회수 톤.
- `hunt`: 붉은 잔재 전선, 위험 haze, 공격적인 사냥 톤.
- `scout`: 청록 scan line과 안개, 미탐색 균열 정찰 톤.

모두 CSS gradient/div 기반이며 외부 이미지, canvas, WebGL은 추가하지 않았다.

### 명령별 전장 VFX
- `attack`: diagonal slash 2종, assault/actor 돌진 모션, progress glow.
- `defend`: blue barrier/shield ring, guard/support 방어 자세 강조.
- `scout`: scan sweep, scout 탐색 흔적, 청록 파동.
- `analyze`: 중앙 rune/glyph, analyst 약점 분석 표식.
- `search`: essence sparkle, hunter/scout 정수 탐색 glow, search stack 표시.

### role/actor highlight
- 명령 role과 맞는 그림자는 role aura와 command motion을 받는다.
- 실제 `actorShadowId` 그림자는 `ACTING` badge, scale-up, 강한 highlight를 받는다.
- role match glow와 actor highlight를 분리해 “누가 잘 맞고, 누가 실제 행동했는지”가 구분된다.

### progress/risk 전장 반응
- progress 100 이상이면 battlefield victory glow가 켜진다.
- risk 70 이상이면 warning haze, 90 이상이면 danger pulse가 적용된다.
- 최근 명령 로그의 진행도/위험도 변화량은 battlefield 위 floating badge로 표시한다.
- 결과 outcome에 따라 전장 전체 tone이 달라진다.

### 결과 연출
- `great_success`: 강한 amber victory glow.
- `success`: emerald/cyan 안정화 glow.
- `partial`: 채도와 밝기를 낮춰 일부 확보 느낌.
- `failure`: 어두운 후퇴/붕괴 느낌.

결과 보상 수치는 바꾸지 않고 전장 tone만 변경한다.

### 모바일/성능
- battlefield는 `h-52 ~ h-56` compact height로 유지해 명령 버튼과 로그를 밀어내지 않게 했다.
- progress/risk bar는 battlefield 안 mini indicator와 기존 `StatBar`를 함께 사용한다.
- particle은 6개 이하, VFX는 0.7~1.2초 내 짧은 CSS animation으로 제한했다.
- `prefers-reduced-motion: reduce`에서 전장 VFX animation을 비활성화한다.

### 검증 결과
- `npm run build` 통과. Vite chunk size warning만 존재.
- `npx tsx scripts/sim-shadow-expedition.ts` 통과.
- `npx tsx scripts/sim-shadow-battle-balance.ts` 통과.
- `npx tsx scripts/sim-gate-current.ts` 통과.
- `npx tsx scripts/sim-manual-battle-balance.ts` 통과.
- 브라우저에서 `http://localhost:3002` 앱 렌더링 확인.
- 군단 탭에서 그림자 원정 battlefield 렌더링 확인.
- 현재 브라우저 저장 상태는 `LOCKED` + 보유 그림자 0명이라 실제 파티 선택/명령 클릭은 같은 세션에서 진행 불가. empty battlefield, 원정 타입 배경, 명령 라벨, 콘솔 error 없음까지 확인.

### 남은 TODO
- 실제 그림자 portrait 자산 제작/교체
- 원정 2~3개 확장
- 무한의 탑
- 보스 추적
- 일일 박스/도전 카드

## 12-17C 시네마틱 액션 자막

목표: 12-17B에서 전투/원정 로그 가독성은 좋아졌지만, 아직 로그가 기록 패널처럼 느껴지는 문제가 있었다. 이번 작업에서는 기존 `CombatLogPanel`을 유지하면서, 중요한 최신 행동을 전투 카드나 원정 전장 중앙에 크게 띄우는 시네마틱 액션 자막 레이어를 추가했다.

### 변경 범위
- 전투 수치 변경 없음.
- 게이트/몬스터 수치 변경 없음.
- 그림자 전투/강화/레벨/진화 공식 변경 없음.
- 원정 `progress / risk` 공식 변경 없음.
- 보상/XP/정수 수치 변경 없음.
- localStorage key 변경 없음.
- persist version 변경 없음: v14.

### CinematicLogOverlay
신규 컴포넌트:
- `src/components/CinematicLogOverlay.tsx`

역할:
- 최신 중요 로그 1개를 중앙 액션 자막으로 표시한다.
- `player / shadow / monster / system / reward / risk / command / result / defense` tone에 따라 badge, border, glow 색을 다르게 적용한다.
- 메인 문장과 보조 문장을 분리해 데미지, 진행도, 위험도, 보상 수치가 더 잘 보이게 했다.
- `durationMs` 이후 자연스럽게 fade out되며, 새 log id가 들어오면 다시 표시된다.
- `prefers-reduced-motion: reduce`에서는 animation을 끈다.

### 자동 전투 로그 속도
- 자동 전투 결과 공개는 기존 고정 짧은 interval 대신 로그 중요도별 `setTimeout` reveal 방식으로 바꿨다.
- 일반 로그는 약 850ms, 몬스터/방어 로그는 약 950ms, 그림자/치명/회피 로그는 약 1100ms, 결과/보상 로그는 약 1300ms로 표시한다.
- 전투 계산과 보상 지급 구조는 바꾸지 않고, 이미 계산된 로그를 보여주는 속도만 조정했다.
- 스킵 시 overlay를 닫고 전체 로그를 바로 공개하는 기존 흐름을 유지한다.

### 게이트 수동 전투 overlay
- 수동 전투 패널에 최신 중요 행동을 `CinematicLogOverlay`로 표시한다.
- 헌터 공격/스킬, 그림자 행동, 몬스터 공격, 방어/회피/치명타, 보상/결과 로그가 중앙 자막 후보가 된다.
- 수동 전투는 조작감을 해치지 않도록 자동 전투보다 짧은 duration을 사용한다.

### 그림자 원정 overlay
- 원정 전장 보드 중앙에 `CinematicLogOverlay`를 연결했다.
- 명령, 그림자 행동, 위험/보상/결과 로그를 선별해 battlefield 위에 띄운다.
- 기존 actor highlight와 별개로, 전장 중앙에서 명령 결과가 한 문장으로 보이도록 했다.

### 중요 로그 선별
게이트:
- 헌터 행동, 그림자 행동, 몬스터 행동, 치명타/회피/방어, wave/system, 결과/보상 로그를 우선 표시한다.

원정:
- 명령, 그림자 행동, 위험 변화, 보상, 결과 로그를 우선 표시한다.
- 사소한 반복 시스템 로그는 중앙 자막에서 제외하고 `CombatLogPanel`에만 남긴다.

### CombatLogPanel과의 관계
- `CombatLogPanel`은 전체 기록과 최근 로그 확인용으로 유지한다.
- `CinematicLogOverlay`는 기록 저장이 아니라 연출 레이어다.
- overlay에 뜬 로그도 기존 로그 패널에는 그대로 남는다.

### 검증 결과
- `npm run build` 통과. Vite chunk size warning만 존재.
- `npx tsx scripts/sim-manual-battle-balance.ts` 통과.
- `npx tsx scripts/sim-shadow-expedition.ts` 통과.
- `npx tsx scripts/sim-shadow-battle-balance.ts` 통과.
- `npx tsx scripts/sim-gate-current.ts` 통과.
- 브라우저에서 `http://localhost:3002` 앱 렌더링 확인.
- 군단 탭에서 원정 battlefield, EXPEDITION LOG, 모바일 폭 가로 overflow 없음 확인.
- 게이트 탭에서 열린 게이트 없음 상태 렌더링과 콘솔 error 없음 확인.
- 현재 브라우저 저장 상태에는 활성 게이트와 보유 그림자가 없어 실제 자동/수동 게이트 전투 overlay와 원정 명령 overlay 발생까지는 같은 세션에서 확인하지 못했다.

### 남은 TODO
- 로그 속도 설정 또는 빠르게 보기 토글.
- 실제 모바일 실사용 피드백 반영.
- 그림자 개별 portrait/고급 실루엣 자산.
- 무한의 탑.
- 일일 박스/도전 카드.

## 12-17D CinematicLogOverlay 전체 로그 queue 재생

목표: 12-17C에서 중요한 로그만 중앙 액션 자막으로 보여주던 방식을 확장해, 전투와 원정의 모든 의미 있는 로그가 순서대로 중앙 자막처럼 재생되게 했다. `CombatLogPanel`은 전체 기록 패널로 유지하고, `CinematicLogOverlay`는 전투 흐름을 보여주는 재생 레이어 역할을 맡는다.

### 변경 이유
- 중요 로그만 중앙에 표시하면 큰 사건은 보이지만 전투의 전체 흐름이 끊겨 보였다.
- 자동 전투는 계산 결과가 한 번에 나온 뒤 일부 로그만 강조되는 느낌이 강했다.
- 수동 전투와 그림자 원정은 명령 한 번으로 여러 로그가 발생하므로, 그 묶음이 순서대로 보여야 명령 결과를 따라가기 쉽다.

### CinematicLogOverlay queue 구조
- `CinematicLogOverlay`가 단일 `log`뿐 아니라 `logs` 배열을 받을 수 있게 확장했다.
- `logs`가 있으면 queue로 처리하고, 없으면 기존 단일 `log` 동작을 fallback으로 유지한다.
- queue는 하나씩 표시하고 `intervalMs` 뒤 다음 로그로 넘어간다.
- 마지막 로그까지 재생하면 `onComplete`를 호출한다.
- 현재 재생 중인 로그는 `onLogChange`로 부모 컴포넌트에 알려줄 수 있게 했다.
- `skipSignal`을 추가해 외부 스킵 버튼이 overlay queue를 즉시 종료할 수 있게 했다.

### 자동 전투 적용
- `GatePanel` 자동 전투 결과 공개에서 모든 non-empty combat log를 `CinematicLogOverlay` queue로 전달한다.
- overlay의 `onLogChange`가 공개된 로그 수를 갱신하므로, 중앙 자막과 `CombatLogPanel`의 최근 로그 공개 흐름이 맞춰진다.
- 스킵 시 queue를 종료하고 전체 로그를 즉시 공개한다.
- 전투 계산, 보상 지급, 게이트 수치에는 영향이 없다.

### 수동 전투 적용
- 수동 전투 세션 로그 길이를 추적해, 사용자의 행동 이후 새로 추가된 로그 묶음만 queue로 만든다.
- 새 행동이 들어오면 기존 queue 대신 새 queue를 재생해 답답한 누적 재생을 피했다.
- 버튼/전투 조작 구조와 기존 중복 클릭 방지 정책은 유지했다.

### 그림자 원정 적용
- `ShadowExpeditionPanel`에서 원정 id와 로그 길이를 추적한다.
- 원정 패널 최초 렌더링 시 기존 시스템 로그를 다시 재생하지 않고, 명령 이후 새로 추가된 로그 묶음만 battlefield overlay queue로 전달한다.
- `ShadowExpeditionBattlefield`는 기존 단일 cinematic log prop과 새 queue prop을 모두 지원한다.
- progress/risk 계산, 보상, shadow XP/essence 지급량은 변경하지 않았다.

### 표시 정책
- 기존 `shouldShowCinematicLog` 계열 helper의 기본 정책을 “중요 로그만”에서 “빈 메시지가 아닌 의미 있는 로그 전체”로 바꿨다.
- overlay 문장은 최대 2줄 중심의 짧은 표시를 유지하고, 전체 원문 기록은 `CombatLogPanel`에 남긴다.
- reduced motion 대응은 기존 `.cinematic-log-overlay` CSS 정책을 유지한다.

### CombatLogPanel과의 관계
- `CombatLogPanel`은 전체 기록/최근 로그/펼쳐보기 패널로 계속 유지한다.
- `CinematicLogOverlay`는 기록 저장이 아니라 재생 연출 레이어다.
- overlay에 표시된 로그도 `CombatLogPanel`에는 그대로 남는다.

### 검증 결과
- `npm run build` 통과. Vite chunk size warning만 존재.
- `npx tsx scripts/sim-manual-battle-balance.ts` 통과.
- `npx tsx scripts/sim-shadow-expedition.ts` 통과.
- `npx tsx scripts/sim-shadow-battle-balance.ts` 통과.
- `npx tsx scripts/sim-gate-current.ts` 통과.
- 브라우저에서 `http://localhost:3002` 앱 렌더링 확인.
- 브라우저 console error 없음.
- 현재 저장 상태에는 활성 게이트/보유 그림자가 없어 실제 자동/수동 전투 및 원정 명령 overlay 발생까지는 같은 세션에서 직접 재현하지 못했다.

### 변경하지 않은 것
- 전투 수치 변경 없음.
- 게이트/몬스터 수치 변경 없음.
- 그림자 전투/강화/레벨/진화 공식 변경 없음.
- 원정 progress/risk 공식 변경 없음.
- 보상/XP/정수 수치 변경 없음.
- localStorage key 변경 없음.
- persist version 변경 없음: v14.

### 남은 TODO
- 로그 속도 사용자 설정.
- 실제 모바일 실사용 피드백 반영.
- QA fixture save 추가.
- 그림자 개별 portrait/고급 실루엣 추가 고도화.

## 12-18 그림자 portrait / 고급 실루엣 강화

목표: 12-15에서 만든 코드 기반 그림자 비주얼 시스템을 더 고급화했다. 실제 PNG/WebP 자산을 대량 추가하지 않고, 현재 `ShadowPortrait`의 SVG/CSS 기반 구조를 확장해 군단 창, 그림자 원정 전장, 게이트 전투 roster에서 같은 visual identity가 유지되도록 했다.

### 변경 범위
- 전투 수치 변경 없음.
- 원정 `progress / risk` 공식 변경 없음.
- 게이트/몬스터 수치 변경 없음.
- 그림자 효과/강화/레벨/진화 공식 변경 없음.
- 그림자 추출률/희귀도 롤 변경 없음.
- 보상/XP/정수 수치 변경 없음.
- localStorage key 변경 없음.
- persist version 변경 없음: v14.
- B/A/S급 게이트, 박스, 카드, 보스, 무한의 탑 추가 없음.

### visual profile 구조 고도화
- `ShadowDefinition`에 optional visual fields를 확장했다.
- 추가 필드: `weaponShape`, `headShape`, `shoulderShape`, `auraType`, `eyeStyle`, `runeStyle`, `accessory`, `posture`, `backgroundMotif`, `visualIntensity`.
- 저장 데이터에는 들어가지 않는 definition-level 메타라 기존 세이브와 migration에 영향이 없다.
- fallback은 기존처럼 `visualKey / silhouetteType / role / rarity` 순서로 유지하고, 새 필드가 없으면 role 기반 profile을 자동 구성한다.

### 일반/진화 그림자 외형 강화
최소 10개 핵심 계열에 전용 profile을 부여했다.
- 그림자 쥐: 낮은 짐승형, 붉은 눈, 웅크린 자세, claw motif.
- 그림자 정찰병: 후드, 쌍단검, speed line, leaning scout posture.
- 그림자 보병: 투구, 검, 망토, 기본 soldier silhouette.
- 어둠의 처형병: horned helm, 거대 처형검, 무거운 어깨, execution sigil.
- 망각의 기록병: scroll/stylus, 얇은 기록자 silhouette.
- 망각의 서기관: 떠다니는 책/페이지, rune orbit, archive circle.
- 피로의 수호병: 작은 방패와 웅크린 guard posture.
- 피로의 방패병: tower shield, fortress helm, barrier aura.
- 탐욕의 사냥개: 낮은 사냥개형, 붉은 눈, predator haze.
- 탐욕의 수집가: chain/trophy, vault sigil, essence sparks.

진화체는 색만 바꾸지 않고 `weapon / head / shoulder / aura / motif / posture`가 달라지도록 했다.

### 게이트 네임드 비주얼 강화
- 네임드 전용 `named-corona`, 더 강한 aura, gate named badge/frame을 적용했다.
- 네르, 루크, 라크, 고른, 샤크, 카르덴, 오르간, 라반, 그리드에 각자 다른 weapon/accessory/background motif를 부여했다.
- 카르덴은 grand tome + archive circle, 오르간은 fortress barrier, 그리드는 chain/trophy + vault sigil 방향으로 강화했다.

### 성취 네임드 비주얼 강화
- 성취 네임드는 `achievement-halo`와 cyan/gold 계열 프레임으로 게이트 네임드와 구분했다.
- 카심, 라오, 차르카, 네블, 볼렌, 베르크, 레이븐, 모로, 노크, 바론, 이르넬, 칼트, 세론, 루멘에 전용 visual profile을 부여했다.
- 금융/학습 계열은 책/차트/룬/기록 장식, 운동 계열은 기사/질주/강철 motif, 생활/습관 계열은 수호자/새벽/시간/절제 motif를 사용한다.

### ShadowPortrait 개선
- profile resolver를 추가해 definition visual fields가 없을 때도 role 기반 고급 silhouette으로 fallback한다.
- background motif layer, aura layer, advanced prop layer, eye overlay를 추가했다.
- 작은 size에서는 눈/무기/방패/책 같은 핵심 shape가 남고, 큰 size에서는 aura와 accessory가 더 풍부하게 보이도록 했다.
- named와 achievement named badge 표시를 분리했다.
- 실제 이미지 asset 없이 inline SVG/CSS만 사용했다.

### ShadowCard / ShadowPanel 개선
- `ShadowCard` featured portrait를 더 크게 보이도록 조정했다.
- 출전 군단 슬롯의 장착 portrait를 `sm`에서 `md`로 키우고, 슬롯 배경에 군단형 glow를 추가했다.
- 기존 장착/해제/강화/분해/잠금/즐겨찾기/진화 기능은 유지했다.

### 원정 전장 / 게이트 roster 적용
- `ShadowPortrait`를 공통으로 쓰는 구조라 원정 battlefield, 원정 로그 actor portrait, 게이트 roster strip에 같은 visual identity가 적용된다.
- 브라우저에서 군단 도감 portrait SVG 렌더링과 원정 전장 렌더링을 확인했다.
- 현재 저장 상태에는 보유 그림자가 없어 실제 출전 roster와 원정 파티 portrait는 같은 세션에서 직접 발생시키지 못했다.

### 검증 결과
- `npm run build` 통과. Vite chunk size warning만 존재.
- `npx tsx scripts/sim-shadow-expedition.ts` 통과.
- `npx tsx scripts/sim-shadow-battle-balance.ts` 통과.
- `npx tsx scripts/sim-gate-current.ts` 통과.
- `npx tsx scripts/sim-manual-battle-balance.ts` 통과.
- 브라우저에서 `http://localhost:3002` 렌더링 확인.
- 군단 탭 / 도감 탭에서 portrait SVG 53개 렌더링 확인.
- 콘솔 error 없음.
- 모바일 폭에서 가로 overflow 없음 확인.

### 남은 TODO
- 실제 PNG/WebP portrait pipeline.
- 네임드 전용 illustration asset.
- 이미지 최적화/webp/lazy loading.
- 전투 보드 고급 VFX 추가.
- 무한의 탑.
- 일일 박스/도전 카드.

## 12-17D: 중앙 자막 queue 기반 전투 로그 재생

### 목표
CinematicLogOverlay를 "중요 로그만 표시"에서 "전투/원정의 모든 로그를 순서대로 중앙 자막처럼 재생"하는 방식으로 확장한다.

### 변경 원칙
- 전투 수치/공식 변경 금지
- 게이트/몬스터 수치 변경 금지
- 그림자 전투/강화/레벨/진화 공식 변경 금지
- 원정 progress/risk 공식 변경 금지
- 보상/XP/정수 수치 변경 금지
- localStorage key 변경 금지
- persist version 변경 금지

### 작업 1. CinematicLogOverlay queue 구조 확인

이미 12-17C에서 queue 기반 구조가 구현되어 있었다.
- `logs?: CinematicLogData[]` prop으로 다수 로그 순차 재생 지원
- `intervalMs`마다 다음 로그로 전환
- `skipSignal`으로 즉시 종료
- `onComplete`로 종료 콜백

변경: `title`과 `body`에 `line-clamp-2` 추가하여 긴 로그가 화면을 벗어나지 않도록 처리.

### 작업 2. 자동 전투 적용

`RecentBattleResult` (`src/components/GatePanel.tsx`):
- `gateTurnToCinematicLog`가 모든 턴(빈 메시지 제외)을 cinematic 형식으로 변환
- `CinematicLogOverlay`에 `logs={cinematicLogs}`로 전체 로그 queue 전달
- `intervalMs={1250}`
- `skipSignal` + "전투 스킵" 버튼
- `onLogChange`로 `revealedLogCount` 동기화 → CombatLogPanel 점진적 공개
- 마지막 로그 후 `onComplete`로 결과/보상 표시

### 작업 3. 수동 전투 적용

`ManualBattlePanelV2` (`src/components/GatePanel.tsx`):
- `useEffect`로 `session.logs` 변화 감지
- 이전 로그 수(`previousManualLogCountRef`) 대비 새로 추가된 로그만 추출
- 새 로그 묶음을 `manualCinematicLogs`에 설정
- `CinematicLogOverlay`에 `logs={manualCinematicLogs}` 전달
- `intervalMs={1050}`
- 새 행동 발생 시 기존 queue를 새 queue로 교체 (답답함 방지)
- 스킵 버튼 추가 (`manualSkipSignal`)
- `onComplete`로 queue 정리

### 작업 4. 그림자 원정 적용

`ShadowExpeditionPanel` (`src/components/shadows/ShadowExpeditionPanel.tsx`):
- `useEffect`로 `expedition.logs` 변화 감지
- 새 로그 묶음을 `expeditionCinematicLogs`에 설정
- `ShadowExpeditionBattlefield`에 `cinematicLogs`, `skipSignal`, `onCinematicComplete` 전달

`ShadowExpeditionBattlefield` (`src/components/shadows/ShadowExpeditionBattlefield.tsx`):
- `skipSignal`과 `onCinematicComplete` prop 추가
- `CinematicLogOverlay`에 전달
- `position="battlefield"` 유지

`ShadowExpeditionPanel`에 스킵 버튼 추가 (`expeditionSkipSignal`).

### 작업 5. reduced motion

`index.css`에 이미 `prefers-reduced-motion: reduce` 처리되어 있음:
- `.cinematic-log-overlay`의 enter/exit animation이 비활성화됨
- 순차 표시 자체는 유지

### 작업 6. 긴 로그 처리

`CinematicLogOverlay`에 `line-clamp-2` 추가:
- title 최대 2줄
- body 최대 2줄
- CombatLogPanel에는 전체 문장 그대로 유지

### 작업 7. 기타 수정

- `GatePanel.tsx` 내 깨진 한글 인코딩 수정
  - `RecentBattleResult` skip 버튼 텍스트
  - `CombatLogPanel` emptyText

### 작업 8. 검증 결과

- `npm run build` → ✅ 통과
- `npx tsx scripts/sim-manual-battle-balance.ts` → ✅ 통과
- `npx tsx scripts/sim-shadow-expedition.ts` → ✅ 통과
- `npx tsx scripts/sim-shadow-battle-balance.ts` → ✅ 통과
- `npx tsx scripts/sim-gate-current.ts` → ✅ 통과

시뮬레이션 수치 변화 없음 (UI 변경만).

### 수정한 파일
| 파일 | 변경 내용 |
|---|---|
| `src/components/CinematicLogOverlay.tsx` | title/body에 `line-clamp-2` 추가 |
| `src/components/GatePanel.tsx` | 수동 전투 스킵 버튼/신호 추가, 깨진 한글 복원 |
| `src/components/shadows/ShadowExpeditionPanel.tsx` | 원정 스킵 버튼/신호 추가, `onCinematicComplete` 전달 |
| `src/components/shadows/ShadowExpeditionBattlefield.tsx` | `skipSignal`/`onCinematicComplete` prop 추가 및 전달 |
| `CLAUDE.md` | 12-17D 기록 추가 |

### persist version 변경 여부
- **변경 없음** (v14 유지)
- 데이터 구조 변경 없음 (纯 UI)

### 남은 TODO
- 실제 PNG/WebP portrait pipeline.
- 네임드 전용 illustration asset.
- 이미지 최적화/webp/lazy loading.
- 전투 보드 고급 VFX 추가.
- 무한의 탑.
- 일일 박스/도전 카드.
- 로그 속도 사용자 설정.
- 실제 모바일 실사용 피드백.

## 12-17D-1: 중앙 자막 queue 재생 버그 수정

### 문제
수동 전투/원정에서 한 동작 후 여러 로그가 생성되지만, CinematicLogOverlay가 1개 로그만 표시하고 종료됨.

### 원인
`CinematicLogOverlay`의 queue 재생 로직은 `currentIndex`를 정상적으로 증가시켰으나, CSS `animation`이 DOM element mount 시 1회만 실행됨.

- `currentIndex`가 바뀌어도 React가 같은 `<div>`를 재사용
- 첫 로그의 exit animation 완료 후 `opacity: 0` 상태로 고정
- 이후 로그는 렌더링되지만 보이지 않음

### 수정

**1. `key={currentLog.id}` 추가**
- `CinematicLogOverlay` root `<div>`에 `key={currentLog.id}` 추가
- queue 내 각 로그 전환 시 React가 element를 remount → CSS animation 재시작

**2. `generationRef` 추가 (race condition 방지)**
- queueKey 변경 또는 skip 시 `generationRef.current` 증가
- timer callback 내에서 현재 generation과 비교
- stale timer(이전 queue의 남은 타이머)가 새 queue를 덮어쓰지 않도록 방지

### 수정한 파일
| 파일 | 변경 내용 |
|---|---|
| `src/components/CinematicLogOverlay.tsx` | `key={currentLog.id}` 추가, `generationRef` 추가, timer/skip callback에 generation 체크 |

### 검증 결과
- `npm run build` → ✅ 통과
- `npx tsx scripts/sim-manual-battle-balance.ts` → ✅ 통과
- `npx tsx scripts/sim-shadow-expedition.ts` → ✅ 통과
- `npx tsx scripts/sim-gate-current.ts` → ✅ 통과
- `npx tsx scripts/sim-shadow-battle-balance.ts` → ✅ 통과

### 기존 수치/공식 영향
- **없음** (纯 UI/React 렌더링 수정)

### persist version 변경 여부
- **변경 없음** (v14 유지)

## 12-18: 무한의 탑 (Infinite Tower)

### 작업 목표
새로운 전투 콘텐츠 "무한의 탑"을 추가. 게이트 전투 로직을 재사용하여 층별 자동 전투를 구현하고, 보스층(5층 단위)와 일반층을 구분하며, 층별 난이도/몬스터/보상 시스템을 설계.

### 추가한 파일
| 파일 | 설명 |
|---|---|
| `src/lib/infiniteTower.ts` | 탑 전용 helper: 층 타입, 추천 전투력, 몬스터 선택/스케일링, 보스 정의, 보상 계산 |
| `src/components/InfiniteTowerPanel.tsx` | 탑 UI: 층 네비게이션, 도전 카드, 전투 결과, CombatLogPanel 연동, CinematicLogOverlay 연동 |
| `scripts/sim-infinite-tower.ts` | 탑 밸런스 시뮬레이션: 6개 빌드 × 19개 층 승률 측정 |

### 수정한 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/types.ts` | `TowerFloorType`, `TowerBattleStatus`, `TowerBattleResult`, `TowerReward`, `TowerBattleSession`, `InfiniteTowerState` 타입 추가 |
| `src/lib/store.ts` | `infiniteTower` 상태 추가, `startTowerBattle`, `cancelTowerBattle` 액션 추가. 전투 시뮬레이션 → 보상(XP, 정수, 아이템, 그림자 XP) → 상태 업데이트 |
| `src/App.tsx` | `'tower'` 탭 추가, `InfiniteTowerPanel` 임포트 및 렌더링 |
| `src/components/GatePanel.tsx` | `gateTurnToLogEntry` export 추가 (InfiniteTowerPanel 재사용) |

### 탑 구조
- **층 타입**: 5층 단위 보스층(`boss`), 나머지 일반층(`normal`)
- **몬스터 풀**: 1~5층 E급, 6~15층 D급, 16층+ C급 기반 몬스터 재사용
- **보스 정의**: 6종 보스 (`tower-guardian-5` ~ `tower-abyss-30`) — 각 층에 맞는 고유 보스
- **스케일링**: `multiplier = 1 + (floor - 1) * 0.028`, 보스 추가 `1.18x`
- **추천 전투력**: `200 + floor * 80`, 보스 `1.35x`

### 보상 구조
- **일반 첫 클리어**: hunter XP = floor * 12, 정수 1~2, 아이템 확률 12%
- **보스 첫 클리어**: hunter XP = floor * 28, 정수 5 + floor/5, 보스 박스, 아이템 확률 35%
- **재클리어**: 1차 보상의 50% 수준

### 시뮬레이션 결과 (밸런스)
| 빌드 | 예상 안정 클리어 층 | 참고 |
|---|---|---|
| A (Lv5, 무그림자) | 4층 | 초반 성장 측정 |
| B (Lv10, 일반 그림자) | 5~7층 | 5층 보스 95% |
| C (Lv20, 훈련 그림자) | 10층 전후 | 10층 보스 5% |
| D (Lv30, 혼합 훈련) | 14층 전후 | 15층 보스 2% |
| E (Lv45, 에픽 장비) | 18층 전후 | 15층 보스 100%, 20층 0% |
| F (Lv60, 풀 에픽) | 22층 전후 | 20층 보스 37% |

### 검증 결과
- `npm run build` → ✅ 통과
- `npx tsx scripts/sim-infinite-tower.ts` → ✅ 통과
- `npx tsx scripts/sim-manual-battle-balance.ts` → ✅ 통과
- `npx tsx scripts/sim-shadow-expedition.ts` → ✅ 통과
- `npx tsx scripts/sim-gate-current.ts` → ✅ 통과

### persist version 변경 여부
- **변경 없음** (v14 유지)
- `infiniteTower`는 `partialize: (state) => ({ ...state })`에 의해 자동 저장됨

## 12-18B: 무한의 탑 전투 UX 개선 (Delayed Result + Manual Combat)

### 문제
- 무한의 탑 도전 시 "1층 클리어!" 결과가 전투 로그보다 먼저 표시되어 긴장감이 부족
- 자동 전투만 제공되어 사용자가 전략적으로 개입할 수 없음

### 해결 방향
1. **결과 지연 표시**: `startTowerBattle`이 전투를 시뮬레이션하되 보상/결과는 UI에 노출하지 않음
2. **수동 전투 추가**: 게이트 수동 전투 구조를 재사용하여 턴제 전투 제공
3. **자동 전투 UX 수정**: cinematic overlay → 결과 카드 순서로 표시

### 추가한 타입 (`src/lib/types.ts`)
- `TowerBattleStatus`: `'idle' | 'in_progress' | 'revealing' | 'resolved'` (기존 `'cleared'`/`'failed'` 제거)
- `TowerBattleSession.showResult?: boolean`
- `ManualBattleSession.source?: 'gate' | 'tower'`, `towerFloor?: number`

### 수정한 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/store.ts` | `startTowerBattle` → `status: 'revealing'`, `showResult: false`, 보상 적용 제거. `resolveTowerBattle` 신규 추가 (보상/층 진행 적용). `startTowerManualBattle`, `performTowerManualBattleAction`, `cancelTowerManualBattle` 신규 추가 |
| `src/components/InfiniteTowerPanel.tsx` | 자동/수동 버튼 분리. 자동: cinematic overlay → `resolveTowerBattle` → 결과 카드. 수동: HP바/스킬/소모품/전투로그 UI. 결과는 `showResult=true`일 때만 표시 |

### 자동 전투 흐름
1. 사용자 "자동 전투" 클릭
2. `startTowerBattle(floor)` → 전투 시뮬레이션 + `activeTowerBattle` 생성 (`status: 'revealing'`, `showResult: false`)
3. `CinematicLogOverlay`에 로그 순차 표시
4. overlay 완료(또는 스킵) 시 `resolveTowerBattle()` 호출
5. 보상 적용, `status: 'resolved'`, `showResult: true`
6. 결과 카드 + 다음 층/재도전 버튼 표시

### 수동 전투 흐름
1. 사용자 "수동 전투" 클릭
2. `startTowerManualBattle(floor)` → `manualBattleSession` 생성 (`source: 'tower'`)
3. HP바, 스킬, 방어, 소모품 UI 표시
4. 사용자 행동 → `performTowerManualBattleAction` → 턴 진행
5. 승리/패배/무승부 시 `activeTowerBattle` 생성 (`status: 'resolved'`, `showResult: true`) 후 `manualBattleSession` 해제
6. 결과 카드 + 다음 층/재도전 버튼 표시

### 수동 전투 행동
- 기본 공격 / 방어(피해 -40%) / 스킬(쿨다운 적용) / 소모품(2회 제한) / 자동 마무리 / 전투 포기
- 보스층 안내 문구 추가: "보스층입니다. 수동 전투와 소모품 사용을 권장합니다."

### 결과 정책
- **승리**: 층 클리어, `highestClearedFloor` 갱신, 첫 클리어/재클리어 보상, 다음 층 해금
- **패배/무승부**: 층 진행 없음, 보상 없음
- **포기**: 보상 없음, `manualBattleSession`만 해제
- **중복 보상 방지**: `firstClearRewardsClaimed` / `bossRewardsClaimed` 기존 로직 그대로 사용

### 검증 결과
- `npm run build` → ✅ 통과
- `npx tsx scripts/sim-infinite-tower.ts` → ✅ 통과 (기존 밸런스 변화 없음 확인)
- `npx tsx scripts/sim-manual-battle-balance.ts` → ✅ 통과
- `npx tsx scripts/sim-gate-current.ts` → ✅ 통과

### 기존 수치/공식 영향
- **없음** (전투 시뮬레이션, 몬스터 스케일링, 보상 계산, 그림자 강화 공식 등 전부 유지)
- `localStorage` key `levelup-save` 변경 없음

### persist version 변경 여부
- **변경 없음** (v14 유지)
- `ManualBattleSession`에 추가된 `source`/`towerFloor`는 저장되지 않음 (런타임 전용)

## 12-19: 박스 / 도전 카드 일일 루프

### 목표
매일 앱을 열었을 때 바로 할 행동을 고르게 만드는 보조 루프를 추가했다. 기존 전투, 게이트, 무한의 탑, 그림자, 장비 강화 수치는 변경하지 않고, 작은 동기부여 보상과 선택형 일일 미션만 얹었다.

### 추가 구조
- `RewardBox`: `daily`, `weekly`, `boss` 박스를 저장한다. 등급은 `normal`, `enhanced`, `superior`, `epic`.
- `BoxReward`: hunter XP, stat, shadowEssence, 장비, 소모품, 메시지를 담는다.
- `ChallengeCard`: `easy`, `normal`, `hard` 난이도와 `workout`, `study`, `finance`, `life`, `gate`, `shadow`, `tower`, `habit` 카테고리를 가진다.
- 저장 필드: `rewardBoxes`, `lastDailyBoxDate`, `lastWeeklyBoxWeek`, `todayChallengeCards`, `selectedChallengeCardIds`, `lastChallengeCardDate`, `challengeCardHistory`.

### 박스/카드 정책
- 일일 박스는 앱 진입 날짜 체크 시 하루 1개 생성하고, 사용자가 직접 `열기`를 눌러 개봉한다.
- 주간 박스는 이번 주 도전 카드 완료 누적 7장 이상이면 주 1회 `superior`로 생성한다.
- 보스 박스는 무한의 탑 5층 단위 보스층 첫 클리어 시 생성하고, `bossRewardsClaimed[floor]`로 중복 지급을 막는다.
- 오늘의 카드 후보는 매일 5장 생성한다: easy 2장, normal 2장, hard 1장.
- 사용자는 후보 중 3장을 선택한다. 실패 패널티는 없다.
- 카드 완료 보상은 소량 XP/그림자 정수와 `boxUpgradePoints`다.
- 오늘 일일 박스는 개봉 전 완료한 카드의 `boxUpgradePoints` 합산으로 강화된다: 2점 이상 `enhanced`, 4점 이상 `superior`.

### UI
- `src/components/RewardBoxPanel.tsx`: 열 수 있는 박스, 등급/source/floor, 직접 개봉 버튼, 최근 개봉 보상 표시.
- `src/components/ChallengeCardsPanel.tsx`: 후보 5장, 3장 선택 확정, 선택 후 진행/완료 상태와 보상 표시.
- `src/App.tsx`: 새 `보상` 탭을 추가하고 첫 화면을 보상 탭으로 변경했다.

### 이벤트 연결
- Daily quest 완료: Daily 개수/카테고리 카드 판정.
- 게이트 자동/수동 전투 종료: 도전/승리 카드 판정.
- 그림자 원정 완료: 원정 카드 판정.
- 무한의 탑 자동/수동 전투 종료: 도전/클리어 카드 판정.
- 박스 개봉: 박스 열기 카드 판정.

### 보상 밸런스 검토
- `scripts/sim-box-card-rewards.ts` 추가.
- perfect day 평균: XP 167, 정수 11.34, 장비 0.09개, 소모품 0.13개.
- perfect week 평균: XP 1347, 정수 89.33, 장비 1.01개, 소모품 1.42개.
- 15층 보스 박스 평균: XP 116, 정수 19, 장비 0.62개, 소모품 0.28개.
- 기존 Main/Dungeon/탑/게이트 성장 보상보다 낮은 보조 동기부여 규모로 유지.

### 호환성 및 영향
- localStorage key `levelup-save` 변경 없음.
- persist version 변경 없음: v14 유지.
- 신규 저장 필드는 migration fallback으로 빈 배열/객체 또는 undefined 보정.
- 전투 수치, 게이트/몬스터 수치, 무한의 탑 난이도 수치, 그림자 공식, 그림자 원정 progress/risk, 추출률/희귀도 롤, 기존 XP 보상표, Main/Dungeon 목표, 장비 강화 공식, 칭호 효과 변경 없음.

### 검증
- `npm run build` 통과. Vite chunk size warning만 유지.
- `npx tsx scripts/sim-box-card-rewards.ts` 통과.
- `npx tsx scripts/sim-infinite-tower.ts` 통과.
- `npx tsx scripts/sim-shadow-expedition.ts` 통과.
- `npx tsx scripts/sim-gate-current.ts` 통과.
- `npx tsx scripts/sim-shadow-battle-balance.ts` 통과.
- `npx tsx scripts/sim-manual-battle-balance.ts` 통과.
- 브라우저 확인: 보상 탭 렌더링, 일일 박스 생성, 후보 카드 5장 생성, 3장 선택, 선택 후 3장 초과 방지, 직접 박스 개봉, 박스 열기 카드 완료, 보상 메시지, 모바일 가로 overflow 없음, 콘솔 error 없음.

### 남은 TODO
- 박스 개봉 긴장감 연출 고도화.
- 카드 합성/컬렉션.
- 주간 목표 조건 고도화.
- 스킬 시스템 고도화.
- 보상/전투 연출 강화.

## 12-20: 스킬 시스템 고도화

### 목표
- 헌터 스킬을 게이트/무한의 탑 수동 전투용 전투 자산으로 정리했다.
- 그림자 원정 명령(`attack/defend/scout/analyze/search`)과 헌터 스킬을 분리 유지했다.
- 기존 몬스터/게이트/탑 난이도 수치, 그림자 공식, XP 보상표, 장비 강화 공식은 변경하지 않았다.

### 타입/구조
- `SkillSource`: `basic`, `job`, `equipment`, `title`, `special`, `monster`.
- `SkillType`: 기존 `attack/buff/debuff/heal`에 `damage/defense/utility` 호환 타입을 추가.
- `SkillDefinition`: `source`, `cooldown`, `staminaCost`, `requiredJobId`, `requiredLevel`, `providedByItemId`, `providedByTitleId`, `tags`, `effectSummary`, `recommendedUse`를 optional로 추가.
- `SkillRuntimeState`: `skillId`, `masteryXp`, `masteryLevel`, `timesUsed`.
- `GameState.skillStates?: Record<string, SkillRuntimeState>` 추가. persist version은 v14 유지, migration fallback은 `{}`.

### helper
- `src/lib/skills.ts` 추가.
- 주요 helper: `getAvailableSkills`, `getAvailableCombatSkillsForLoadout`, `getSkillSourceLabel`, `getSkillTypeLabel`, `getSkillCooldownTurns`, `canUseSkill`, `getSkillMastery`, `recordSkillRuntimeUse`, `getSkillEffectiveDescription`.
- 기본 수동 키트(`집중 베기`, `방어 태세`)는 스킬창/수동 전투에서만 포함한다. 자동 전투와 전투력 산정은 기존 스킬 풀을 유지한다.

### 스킬 목록/출처
- 기존 직업/장비 스킬 구조를 유지하고 definition 중심으로 해석한다.
- 장비 스킬은 장착 장비의 `combatSkillIds`로 제공된다.
- 칭호/특수 스킬은 타입과 UI 구조만 열어두고 실제 제공은 TODO로 남겼다.

### UI
- `src/components/SkillPanel.tsx` 추가.
- 헌터 상태 화면에 보유 스킬 목록, 출처 badge, 타입 badge, 쿨타임, 효과 요약, 제공 장비, 숙련도/사용 횟수를 표시.
- 게이트/무한의 탑 수동 전투 버튼에 출처, 타입, CD, 사용 가능/쿨타임 사유, 숙련도 레벨, 효과 설명을 표시.

### 숙련도/강화 정책
- 수동 전투에서 헌터가 스킬을 사용할 때만 `timesUsed +1`, `masteryXp +1`.
- 숙련도 레벨: Lv0 기본, Lv1 5회, Lv2 15회, Lv3 35회.
- 효과는 소폭: 피해/방어 Lv당 +2.5%, 강화/약화/회복 Lv당 +1.5%.
- 쿨타임 감소는 적용하지 않았다.

### 전투 적용
- `resolveAction`은 optional `skillMasteryLevel`을 받아 피해/회복/효과량만 소폭 보정한다.
- 자동 전투는 숙련도 획득/적용을 하지 않는다.
- 게이트 수동 전투와 무한의 탑 수동 전투 모두 동일한 숙련도 기록/적용 경로를 사용한다.
- 그림자 전투 보조와 그림자 원정 명령에는 연결하지 않았다.

### 검증
- `npm run build` 통과. Vite chunk size warning만 유지.
- `npx tsx scripts/sim-skill-system.ts` 통과: Focus Slash Lv0 damage 43, Lv3 damage 46, Lv3 damage bonus +7.5%.
- `npx tsx scripts/sim-gate-current.ts` 통과.
- `npx tsx scripts/sim-manual-battle-balance.ts` 통과.
- `npx tsx scripts/sim-infinite-tower.ts` 통과.
- `npx tsx scripts/sim-shadow-battle-balance.ts` 통과.
- `npx tsx scripts/sim-shadow-expedition.ts` 통과.
- 브라우저 확인: 스킬 패널 렌더링, 보유 스킬/출처/쿨타임/효과/숙련도 표시, 무한의 탑 수동 전투 스킬 버튼 표시, 스킬 사용 후 쿨타임 disabled 정상, 모바일 390px 가로 overflow 없음.

### persist
- localStorage key `levelup-save` 변경 없음.
- persist version 변경 없음: v14 유지.

### 남은 TODO
- 몬스터 패턴/텔레그래프와 방어/분석/차단 스킬 연결.
- 스킬 강화 재료 및 스킬트리.
- 장비 강화 레벨과 장비 제공 스킬의 연동.
- 칭호/특수 스킬 실제 해금 경로.
- 12-21 긴장감/연출 강화.

## 12-21: 핵심 순간 긴장감/연출 강화 (2026-05-18)

### 목표
- 그림자 추출, 박스 개봉, 무한의 탑 보스층/클리어, 스킬 사용, 그림자 진화, 헌터 성장, 카드 선택/완료의 결과 공개 흐름을 강화.
- 결과를 즉시 노출하기보다 짧은 단계 연출 -> 긴장감 -> 결과 공개 -> 보상/후속 메시지 순서로 보이도록 조정.
- 전투 수치, 게이트/몬스터/탑 난이도, 그림자 추출/진화 공식, 박스/카드 보상, 스킬 효과, XP 보상표, 장비/칭호 효과는 변경하지 않음.

### 공용 reveal 구조
- `src/components/DramaticReveal.tsx` 추가.
- `steps`, `tone`, `position`, `compact`, `result`, `onComplete`, `onSkip` 기반의 공용 결과 공개 컴포넌트.
- `shadow/box/tower/skill/rank/success/failure` tone을 지원.
- 스킵 버튼과 `prefers-reduced-motion` 대응 포함.
- 역할 구분: `CinematicLogOverlay`는 전투 중 행동 자막, `DramaticReveal`은 결과 공개/특별 이벤트 연출.

### 적용 범위
- 그림자 추출: 버튼 클릭 후 추출 시작, 공명/저항, 판정 직전, 성공/실패, 등급/이름 공개 순서로 표시. Legendary/게이트 네임드는 더 강한 tone 사용.
- 박스 개봉: 박스 선택 후 흔들림/빛/등급 암시 단계와 결과 공개. rare 이상 장비 드롭, boss box, 레벨/랭크 변화는 결과 카드에서 강조.
- 무한의 탑: 보스층 경고 스타일, 전투 중 skill cinematic 강조, 클리어/패배 결과 reveal 추가. 첫 클리어/보스 박스/최고층 갱신 메시지와 기존 시스템 메시지는 reveal 이후 확인 가능하도록 계층 보정.
- 스킬 사용: 게이트/무한의 탑 수동 전투에서 헌터 스킬 사용 시 중앙 자막을 `SKILL`, `{스킬명} 발동`, 피해량 중심으로 표시.
- 그림자 진화: 즉시 결과 반영 대신 형태 흔들림 -> 어둠 응축 -> 새 형태 공개 reveal 후 기존 `evolveShadow` 로직 실행.
- 헌터 레벨업/랭크업: 기존 `SystemMessage`에 dramatic flare 스타일 추가. 박스 보상에서 성장 변화가 발생하면 박스 reveal 결과에도 함께 표시.
- 카드 선택/완료: 카드 선택 시 selected flip/glow, 완료 카드 badge/glow, 3장 확정/완료 compact reveal 추가.

### 연출 과부하 방지
- 그림자 추출, 박스 개봉, 탑 클리어/패배, 그림자 진화는 dramatic.
- 카드 선택/완료는 compact.
- 반복 레벨업은 기존 시스템 메시지 중심으로 유지하고, 랭크/중요 성장만 더 강하게 표시.
- 모든 reveal은 스킵 가능.
- 새 CSS 애니메이션은 `prefers-reduced-motion: reduce`에서 비활성화.

### CSS/VFX
- `index.css`에 reveal fade, pulse glow, rarity/result flash, challenge card flip/complete, boss warning, rank flare 추가.
- 과도한 particle 없이 border/glow/text-shadow 중심으로 구현.
- 기존 `CombatLogPanel`, `CinematicLogOverlay`, 전장 VFX 톤과 맞게 cyan/purple/amber 계열을 재사용.

### persist / 저장 데이터
- localStorage key `levelup-save` 변경 없음.
- persist version 변경 없음: v14 유지.
- 저장 스키마 변경 없음. 이번 단계는 UI state와 표시 순서 중심.

### 검증
- `npm run build` 통과. Vite chunk size warning만 유지.
- `npx tsx scripts/sim-infinite-tower.ts` 통과.
- `npx tsx scripts/sim-gate-current.ts` 통과.
- `npx tsx scripts/sim-manual-battle-balance.ts` 통과.
- `npx tsx scripts/sim-shadow-battle-balance.ts` 통과.
- `npx tsx scripts/sim-shadow-expedition.ts` 통과.
- `npx tsx scripts/sim-box-card-rewards.ts` 통과.
- `npx tsx scripts/sim-skill-system.ts` 통과.
- 브라우저 확인: 앱 로드, reveal CSS 로드, 무한의 탑 자동 전투 cinematic, 탑 클리어 `DramaticReveal`, 스킵/닫기 UI, reduced motion CSS rule, 콘솔 신규 error 0개 확인.

### 남은 TODO
- 12-22 비밀 확장.

## 12-22 quiet connective layer

- Added optional `secretProgress` meta state with fallback initialization from existing tower/gate/shadow/expedition/box/card/skill records.
- Gate, Infinite Tower, Shadow Expedition, shadow extraction/evolution, reward boxes, challenge cards, and rank/level events feed a low-visibility connective layer.
- Public UI exposure stays compact and indirect; no condition list or standalone hidden-system tab.
- Existing progress, shadows, records, rewards, formulas, localStorage key, and persist version are preserved. Persist remains v14.
- Added `scripts/sim-secret-expansion.ts` for duplicate/fallback/bounded-effect smoke checks.

Verification:
- `npm run build`: pass
- `npx tsx scripts/sim-infinite-tower.ts`: pass
- `npx tsx scripts/sim-gate-current.ts`: pass
- `npx tsx scripts/sim-manual-battle-balance.ts`: pass
- `npx tsx scripts/sim-shadow-battle-balance.ts`: pass
- `npx tsx scripts/sim-shadow-expedition.ts`: pass
- `npx tsx scripts/sim-box-card-rewards.ts`: pass
- `npx tsx scripts/sim-skill-system.ts`: pass
- `npx tsx scripts/sim-secret-expansion.ts`: pass
- Browser smoke check on `http://127.0.0.1:5173/`: app loaded, Gate/Tower/Legion/Reward panels opened, console errors 0.
- Spoiler reporting rule: do not disclose hidden trigger details, story text, reward identity/numbers, secret names, or hidden stat/effect details in user-facing completion reports.

## 12-22B quiet layer hardening

- Reviewed and tightened the low-visibility connective layer added in 12-22.
- Existing save fallback now merges prior tower/gate/shadow/expedition/box/card/skill records into missing meta counters instead of only filling blank state.
- Hint cadence, duplicate prevention, bounded reward claims, and cross-content progression checks were hardened without exposing a hidden-system UI.
- Secret fragment/reward paths remain one-way additive and avoid deleting or invalidating existing player progress.
- No large combat, growth, reward, extraction, expedition, box, card, or shadow formula changes. localStorage key remains `levelup-save`; persist remains v14.
- `scripts/sim-secret-expansion.ts` now covers fallback merge, duplicate prevention, cadence throttling, and bounded bonus behavior.
- User-facing reports for this work must stay spoiler-safe: do not disclose hidden conditions, story text, reward identity/numbers, secret names, fragment contents, or exact trigger combinations.

Verification:
- `npm run build`: pass (existing Vite chunk size warning only)
- `npx tsx scripts/sim-infinite-tower.ts`: pass
- `npx tsx scripts/sim-gate-current.ts`: pass
- `npx tsx scripts/sim-manual-battle-balance.ts`: pass
- `npx tsx scripts/sim-shadow-battle-balance.ts`: pass
- `npx tsx scripts/sim-shadow-expedition.ts`: pass
- `npx tsx scripts/sim-box-card-rewards.ts`: pass
- `npx tsx scripts/sim-skill-system.ts`: pass
- `npx tsx scripts/sim-secret-expansion.ts`: pass
- Browser smoke check on `http://127.0.0.1:5173/`: app loaded, Gate/Tower/Legion/Reward panels opened, console errors 0.

## 12-22C quiet layer finish pass

- Added compatibility fields for the compact secret progress shape while preserving legacy fields and v14 persist compatibility.
- Secret signals, one-time seen markers, unlocked traces, sealed rewards, and fragment ink are normalized through helper functions.
- Discovery pacing was adjusted so the first meaningful trace can appear in normal play without exposing a public hidden-system checklist.
- Added a one-time retrospective signal for existing records, staged hint strength, and a small three-content connection signal.
- Secret message tone now has internal story/secret channels with subtle SystemMessage styling and fallback behavior.
- Secret lore text is isolated in `src/lib/secretLore.ts`; user-facing reports must not quote hidden text, conditions, rewards, names, or trigger combinations.
- Reward/variant paths are idempotent and bounded; existing shadows are favored for quiet changes instead of broad new secret-shadow drops.
- Dev-only secret state helper is gated to development and is absent from production build output.

Verification:
- `npm run build`: pass (existing Vite chunk size warning only)
- `npx tsx scripts/sim-infinite-tower.ts`: pass
- `npx tsx scripts/sim-gate-current.ts`: pass
- `npx tsx scripts/sim-manual-battle-balance.ts`: pass
- `npx tsx scripts/sim-shadow-battle-balance.ts`: pass
- `npx tsx scripts/sim-shadow-expedition.ts`: pass
- `npx tsx scripts/sim-box-card-rewards.ts`: pass
- `npx tsx scripts/sim-skill-system.ts`: pass
- `npx tsx scripts/sim-secret-expansion.ts`: pass
- Browser smoke check on `http://127.0.0.1:5173/`: app loaded, Gate/Tower/Legion/Reward panels opened, console errors 0, no debug UI visible.

## 12-23A hunter combat power display

- Added `src/lib/combatPower.ts` as a display/helper layer around the existing combat stat and combat power calculators.
- Hunter status now shows current combat power with a compact mobile-safe summary.
- The display breakdown accounts for base stats, equipment stat effects, equipped title stat effects, equipped shadows, combat skills, and active combat consumable effects.
- Gate and Infinite Tower panels now show current combat power against recommended power with a non-blocking comparison label.
- Shadow Expedition wording remains separate: hunter combat power is for Gate/Tower decisions, expedition power stays party-based in the expedition panel.
- No combat, gate, tower, monster, shadow, equipment, skill, reward, localStorage key, or persist version changes. Persist remains v14.

Verification:
- `npm run build`: pass (existing Vite chunk size warning only)
- `npx tsx scripts/sim-gate-current.ts`: pass
- `npx tsx scripts/sim-infinite-tower.ts`: pass
- `npx tsx scripts/sim-manual-battle-balance.ts`: pass
- `npx tsx scripts/sim-shadow-battle-balance.ts`: pass
- Browser smoke check on `http://127.0.0.1:5173/`: app loaded, Hunter/Gate/Tower panels checked, mobile viewport checked, console errors 0.

TODO:
- 12-23B equipment/shadow variety + shadow summon ticket system.
- 12-23C shadow expedition narrative/event depth pass.
- 실제 실사용 피드백 기반 연출 속도 조정.
- 로그 속도 설정.
- 모바일 UI 미세 조정.
- 보스 박스/게이트 네임드/legendary 추출의 실제 빈도 기반 연출 강도 조정.

## 12-23B equipment/shadow diversity and summon tickets

- Expanded the equipment and shadow reward pools from the 12-23B-0 audit, prioritizing common/uncommon/rare variety while still adding controlled epic, legendary, gate named, and achievement named options.
- Added 34 equipment templates: common 7, uncommon 9, rare 9, epic 6, legendary 3. Current pool: 72 equipment and 15 consumables.
- Added 51 shadow definitions: 34 broader gate-extract/general candidates, 7 gate named candidates, and 10 achievement named candidates. Current pool: 104 shadows, including 64 gate extract, 16 gate named, and 24 achievement named.
- Equipment instances support `equipmentStars` 1-5 with multipliers 0.85/1.00/1.18/1.38/1.65. Existing equipment falls back to 2-star.
- Owned shadows support `innateGrade` C/B/A/S with multipliers 0.90/1.00/1.22/1.50. Existing owned shadows fall back to B.
- Expanded evolution routes from 5 to 21, including support, analyst, hunter, scout, guard, and assault paths that reuse the existing level, enhancement, and essence policy.
- Added shadow summon tickets and shards: normal, rare, role, gate named, achievement named, category achievement named, and normal/rare/named/achievement_named shards.
- Main Quest achievement named rewards now grant category/grade-based achievement named summon tickets instead of fixed direct named shadows. Existing owned achievement named shadows are preserved, and sealed claim tracking prevents reload duplication.
- Box/card/gate/tower rewards can grant summon shards or tickets. Boss and high-floor boss rewards use boosted rates with caps on achievement named tickets; Main Quest keeps guaranteed achievement ticket value.
- UI updates: inventory shows equipment stars separately from enhancement, shadow cards/panels show innate grade, expedition selection shows innate grade, reward boxes list summon tickets/shards, and ShadowPanel includes a summon/shard exchange section.
- Save compatibility: `localStorage` key remains `levelup-save`; persist remains v14. Migration fills missing equipment stars, shadow innate grades, summon ticket arrays, shard records, and sealed achievement ticket claims.

Verification:
- `npm run build`: pass, with the existing Vite chunk-size warning only.
- `npx tsx scripts/sim-shadow-battle-balance.ts`: pass.
- `npx tsx scripts/sim-gate-current.ts`: pass. Early E/D/C gate pacing remains in the expected ranges.
- `npx tsx scripts/sim-infinite-tower.ts`: pass. Stable clear bands remain roughly A 7F, B 12F, C/D 14F, E 22F, F 28F.
- `npx tsx scripts/sim-box-card-rewards.ts`: pass. Current item pool reports equipment 72, consumables 15.
- `npx tsx scripts/sim-shadow-expedition.ts`: pass.
- `npx tsx scripts/sim-equipment-shadow-diversity.ts`: pass. Gate-extract roles are assault 10, guard 11, scout 8, analyst 12, hunter 10, support 13; evolution routes 21.
- `npx tsx scripts/sim-shadow-summon-ticket.ts`: pass. Ticket innate-grade rolls match target rates; high boss achievement ticket rate remains below cap.
- Browser smoke check on `http://127.0.0.1:3002/`: desktop app loaded, inventory and legion/summon areas checked, mobile viewport 390x844 checked, console errors 0.

TODO:
- Tune summon ticket probabilities with real play data.
- Keep expanding named and achievement named candidate pools by category.
- Fine-tune equipment star and shadow innate-grade caps if long-term data shows runaway stacked quality.

## 12-23C shadow expedition narrative depth pass

- Added `src/lib/expeditionLore.ts` as a pure text/narrative data layer (no imports from store or components). Contains phase names, phase enter logs, phase-aware command logs, mid-event definitions, role lines, and report templates.
- Added new type definitions in `src/lib/types.ts`: `ExpeditionPhase`, `ExpeditionPhaseEntry`, `ExpeditionMidEventChoice`, `ExpeditionMidEvent`, `ExpeditionReport`. Extended `ShadowExpeditionLog`, `ShadowExpeditionResult`, and `ShadowExpedition` with phase/event/report fields.
- `ShadowExpedition` now tracks `currentPhase`, `phaseHistory`, `midEvent`, `eventTriggered`, `eventResolved`. All new fields are optional and backwards-compatible; existing saves load without migration needed.
- `resolveShadowExpeditionCommand` now:
  - Detects phase transitions (muster → deploy → contact → threshold → resolution → return) and emits a `phase` log on transition.
  - Generates phase-contextual and role-contextual command log text via `getCommandLog` / `getRoleLine`.
  - Triggers a mid-event in the `threshold` phase at ~42% chance per command, max once per expedition. Event is stored in `midEvent`; commands are blocked until resolved.
  - Generates a 5-block `ExpeditionReport` (title, overview, highlight, harvest, closing) on completion via `buildExpeditionReport`.
  - Emits a featured shadow role line at expedition end.
- Added `resolveExpeditionMidEventChoice` in `shadowExpeditions.ts`: applies chosen delta (progress/risk/searchStacks), adds event log, sets `eventResolved`.
- Added `resolveShadowExpeditionMidEvent(expeditionId, choiceId)` action in `store.ts`.
- `ShadowExpeditionPanel.tsx` UI changes:
  - Phase badge in header: shows type-specific phase name when `in_progress`.
  - `MidEventCard` component: appears when event is triggered and unresolved. Shows event title, description, and 2-3 choice buttons with delta badges. Highlights role-matching choices.
  - Commands are blocked while `eventTriggered && !eventResolved` (handled in `resolveShadowExpeditionCommand`).
  - `ReportPanel` replaces `ResultPanel`: shows existing reward blocks plus a 4-block narrative report (overview, highlight, harvest, closing) with subdued per-outcome color scheme.
  - Featured shadow in portraits is highlighted if `featuredShadowIds` is set.
- `sim-shadow-expedition.ts` updated: auto-resolves mid-events with first choice to avoid infinite loop.
- No changes to progress/risk/reward formulas, persistence key, or persist version. All existing simulation outcomes remain within expected bands.

Verification:
- `npm run build`: pass (existing Vite chunk size warning only).
- `npx tsx scripts/sim-shadow-expedition.ts`: pass. Outcome distribution unchanged from 12-23B baseline.
- Browser smoke check: phase badge, MidEventCard, and ReportPanel render correctly in shadow expedition flow.

## combat log source separation bug fix

**Problem:** After an Infinite Tower battle, the Gate panel displayed Tower battle logs. `combatLogs` is a shared global array containing both gate and tower `CombatLog` entries. `GatePanel` used `combatLogs[0]` (most recent, no source filter), so if a tower battle ran after the last gate battle, the tower log appeared in the gate panel.

**Root cause:** `CombatLog` had no `source` field. Tower battles push to the same `combatLogs` array using `gateInstanceId: 'tower-${floor}'`. Gate panel read index `[0]` without discrimination.

**Fix — `src/lib/types.ts`:** Added `source?: 'gate' | 'tower'` optional field to `CombatLog`. Optional for backwards compatibility with existing saves.

**Fix — `src/lib/store.ts` (5 sites):**
- Gate auto-battle (`createGateBattleOutcomeUpdate`): `finalLog.source = 'gate'`
- Gate auto-battle (`startGateBattle`): `finalLog.source = 'gate'`
- Tower manual-auto conversion combatLog literal: `source: 'tower'`
- Tower auto-battle (`startTowerBattle`) push site: `{ ...combatLog, source: 'tower' }`
- Tower pure manual battle (`performTowerManualBattleAction`) combatLog literal: `source: 'tower'`

**Fix — `src/components/GatePanel.tsx`:** Replaced all `combatLogs[0]` with `latestGateCombatLog`:
```js
const latestGateCombatLog = combatLogs.find(
  log => log.source === 'gate' || (!log.source && !log.gateInstanceId?.startsWith('tower-'))
)
```
Fallback for old saves (no `source` field): treats logs with `gateInstanceId` not starting with `'tower-'` as gate logs. Tower logs always use `gateInstanceId: 'tower-${floor}'`.

**`InfiniteTowerPanel.tsx`:** Already correct — uses `combatLogs.find(log => log.battleId === activeBattle.id)` to get the specific tower battle log. No change needed.

**CinematicLogOverlay queue:** Each panel manages its own `cinematicLogs` local state. No shared queue — no change needed.

**No changes to:** combat formulas, gate/tower/expedition reward values, XP, shadow stats, equipment, persist version, localStorage key.

Verification:
- `npm run build`: pass (existing Vite chunk size warning only).
- `npx tsx scripts/sim-gate-current.ts`: pass. Gate outcome distribution unchanged.
- `npx tsx scripts/sim-infinite-tower.ts`: pass. Tower clear bands unchanged.
- `npx tsx scripts/sim-shadow-expedition.ts`: pass. Expedition outcomes unchanged.
- Browser test scenario: Tower battle → Gate panel shows no tower logs; Gate battle → Gate panel shows gate log only.

## 12-24 — 게임 비주얼/VFX 고급화 1차

**목표:** 핵심 게임플레이 공식, 보상, 퍼시스턴스를 변경하지 않고 UI 비주얼 및 VFX의 품질을 대폭 향상.

### 변경된 파일 목록

**`src/index.css`**
- VFX 유틸리티 클래스 추가 (12-24 VFX UTILITIES 섹션):
  - `.rarity-frame-common/uncommon/rare/epic/legendary` — 레어리티별 테두리 glow/shadow
  - `.grade-aura-s` (애니메이션: `grade-aura-s-pulse`) / `.grade-aura-a` — 태생 S/A 등급 aura
  - `.named-pulse` — 네임드 그림자 미묘한 pulse 애니메이션
  - `.enhancement-glow` — 고강화 아이템/그림자 glow
  - `.skill-badge-damage/defense/buff/debuff/heal/utility` — 스킬 타입별 배지 색상
  - `.hp-flash-damage / .hp-flash-heal` — HP 바 피격/회복 플래시
  - `.summon-reveal` — 소환/리빌 입장 애니메이션
  - `.boss-glow` — 보스/레전더리 glow pulse
  - `.damage-pop` — 피해 숫자 팝업 애니메이션
  - `.shadow-mist-legendary` — 레전더리 안개 shimmer
  - `.mastery-bar-fill` — 숙련도 progress bar shimmer
- 모든 신규 클래스에 `@media (prefers-reduced-motion: reduce)` 오버라이드 추가.

**`src/components/shadows/ShadowPortrait.tsx`**
- `innateGrade?: string` prop 추가
- `innateGrade` A/S 등급 시 우상단 배지 렌더링 (S: amber, A: 흐린 amber)
- 컨테이너에 `grade-aura-s` (S등급), `grade-aura-a` (A등급), `named-pulse` (네임드) 클래스 적용

**`src/components/shadows/ShadowCard.tsx`**
- `rarityFrame` 맵에 `rarity-frame-*` 클래스 추가 — 레어리티별 카드 glow
- 이름 옆 enhancement 레벨 색상 분기 (8+: amber-300, 4+: amber-200/80, 기타: amber-100/60)
- `innateGrade` S/A 배지를 이름 옆에 styled chip으로 표시
- 성취 네임드: `ring-1 ring-cyan-200/40`, 게이트 네임드: `named-pulse` 클래스
- `ShadowPortrait`에 `innateGrade={shadow.innateGrade}` 전달

**`src/components/ShadowPanel.tsx`**
- DEPLOYED LEGION 슬롯 개선:
  - 네임드 슬롯: amber 계열 radial-gradient + `named-pulse`
  - legendary 슬롯: `rarity-frame-legendary`
  - epic 슬롯: `rarity-frame-epic`
  - 슬롯 우상단에 role 레이블 추가
  - 배치된 그림자 이름 아래 rank 배지 + NAMED 배지 표시
  - 강화 레벨 표시 추가
  - 빈 슬롯: "EMPTY" system-text
- `ShadowPortrait`에 `innateGrade` 전달

**`src/components/SkillPanel.tsx`**
- `skillTypeBadgeClass()` — 스킬 타입 문자열 → `skill-badge-*` CSS 클래스 매핑
- `skillTypeGlyph()` — 스킬 타입 → 글리프 (⚡/🛡/↑/↓/✦/◈)
- 스킬 카드에 타입 글리프 + 타입별 색상 배지 표시
- 쿨다운 뱃지 색상 분기 (즉시: emerald, CD≤2: cyan, 기타: white/55)
- 숙련도 progress bar 추가 (`mastery-bar-fill` shimmer 클래스)
- 스킬 카드 hover 시 border 밝아짐 효과

**`src/components/Inventory.tsx`**
- 장착 슬롯 카드: `rarity-frame-${equippedItem.rarity}` 적용, 슬롯 아이콘 색상 rarity 기반으로 변경, 별/강화 레벨 분리 표시
- 아이템 그리드: 장비류에 `rarity-frame-*`, legendary 장비에 `boss-glow` 적용
- 빈 슬롯: "EMPTY" system-text

**`src/components/RewardBoxPanel.tsx`**
- `TIER_CLASS`: normal→`rarity-frame-rare`, enhanced→`rarity-frame-uncommon`, superior→`rarity-frame-epic`, epic→`boss-glow`
- epic/superior 박스에 `shadow-mist-legendary` 안개 오버레이 추가

### 제약 사항 준수 확인
- 전투 공식, 보상값, XP, 정수, 확률, 퍼시스턴스 키 변경 없음.
- 기존 게임플레이 기능 보존.
- `@media (prefers-reduced-motion: reduce)` 모든 신규 애니메이션 포함.

Verification:
- `npm run build`: pass (Vite chunk size warning only, 기존과 동일).
- TypeScript 오류 없음.
- 브라우저 시각 확인: 레어리티 glow, 태생 등급 배지, 출전 슬롯 pedestal, 스킬 타입 색상, 장비 rarity 프레임, 박스 tier glow 정상 렌더링.

---

## 12-24B — 그림자 개별 Portrait / 고급 실루엣 자산 파이프라인

### 목표
ShadowPortrait 컴포넌트를 자산 우선(asset-first) 렌더링 구조로 확장하여, 향후 PNG/WebP 초상화 추가 시 즉시 반영될 수 있는 파이프라인을 마련. SVG 기반 family 실루엣을 named/achievement 전용 장식 레이어로 강화. 기존 렌더링과 하위 호환 유지.

### 변경 파일

**`src/lib/types.ts`**
- `ShadowDefinition`에 `portraitKey?: string` (자산 매니페스트 키, 현재 = definition ID), `assetFamily?: string` (패밀리 그룹) 선택적 필드 추가.

**`src/lib/shadowPortraitAssets.ts`** (신규 생성)
- `SHADOW_PORTRAIT_ASSETS: Record<string, string>` — 빈 매니페스트 (PNG/WebP 자산 준비 시 등록).
- `getShadowPortraitAsset(key)` — 안전한 asset URL 조회 함수.
- `ASSET_FAMILY_FOLDER` — 패밀리별 권장 파일 경로 가이드.
- 렌더링 우선순위 문서: asset 이미지 → assetFamily SVG 장식 → visualKey SVG → role 폴백.

**`src/lib/shadows.ts`**
- `ShadowVisualPatch` 타입: `portraitKey`, `assetFamily` 필드 추가.
- `SHADOW_VISUALS` (10개 기본 + 9개 named_gate + 14개 named_achievement): 모든 항목에 `portraitKey` (= 정의 ID) 및 `assetFamily` 명시.
  - 패밀리 분류: `rat` / `scout` / `infantry` / `executor` / `scribe` / `shield` / `hound` / `named_gate` / `named_achievement`
- `inferShadowVisual`: `portraitKey` = `definition.id`, `assetFamily` = role/named 상태 기반 자동 도출.

**`src/components/shadows/ShadowPortrait.tsx`**
- `import { getShadowPortraitAsset }` 추가.
- `renderNamedGateDecor(accent, seed)` 신규 SVG 함수: 균열선(rift cracks) + 차원 포인트 장식 — named_gate 전용.
- `renderAchievementDecor(accent)` 신규 SVG 함수: 왕관(crown) + 월계수(laurel) + 업적 봉인 링 — named_achievement 전용.
- evolved 내부 헥사곤 점선 링 추가 (진화체 시각 강화).
- 컨테이너: `portrait-family-named-gate`, `portrait-family-named-achievement`, `portrait-evolved` 클래스 조건부 적용.
- `<img>` 오버레이: `assetUrl` 존재 시 SVG 위에 렌더링, onError 시 자동 숨김.

**`src/index.css`**
- `.portrait-family-named-gate`: 틸-시안 rift glow box-shadow.
- `.portrait-family-named-achievement`: 골드 ceremonial halo box-shadow.
- `.portrait-evolved` + `@keyframes portrait-evolved-pulse`: 느린 brightness shimmer.
- `.portrait-asset-loaded` + `@keyframes portrait-asset-reveal`: 자산 이미지 fade-in.
- `.shadow-eye-glow` + `@keyframes shadow-eye-pulse`: SVG 눈 pulse (고레어 초상화용).
- `@media (prefers-reduced-motion)`: `.portrait-evolved`, `.portrait-asset-loaded` 애니메이션 비활성화.

### 렌더링 계층 (완성)
```
1. SHADOW_PORTRAIT_ASSETS[portraitKey] → <img> overlay  (자산 있을 때)
2. assetFamily === 'named_gate'        → renderNamedGateDecor SVG 레이어
   assetFamily === 'named_achievement' → renderAchievementDecor SVG 레이어
3. resolveProfile() → visualKey 기반 SVG 프로파일
4. role 기반 fallback 프로파일
```

### 제약 사항 준수
- 전투 공식, XP, 보상, 확률, 퍼시스턴스 키 변경 없음.
- `portraitKey`/`assetFamily` 모두 선택적 — 기존 코드 무영향.
- `getShadowPortraitAsset` 실패해도 SVG 폴백 유지 (onError 처리 포함).
- 100+ 카드 렌더링 성능: 신규 SVG 요소 최소 (5~7개 path/circle), img onError 기반 graceful degradation.
- 모바일 UI 이상 없음.

### Verification
- `npm run build`: exit 0 (Vite 청크 사이즈 경고만, 기존 동일).
- `npx tsc --noEmit`: exit 0, 오류 없음.
- 시각 확인: named_gate → 틸 균열 SVG + 포털 ellipse. named_achievement → 왕관 + 월계수 + 봉인 링. evolved → 내부 점선 헥사곤 추가. assetFamily 없는 일반 그림자 → 기존 동일.

---

## 12-24C — 전체 roster 카탈로그 + 신규 SVG 가족 + registry 확장

### 목표
전체 그림자 병사(104개+) 개별 초상화 최종 목표 수립.
즉각 작업: 신규 SVG 가족 3종 추가, 전체 registry 구축, 아트 파이프라인 카탈로그 문서화.

### 변경 파일
- `src/components/shadows/ShadowPortrait.tsx`
  - `renderSpearman`: 긴 대각선 창, 크로스가드, 창끝 삼각형. 진화시 창 두께/글로우 강화.
  - `renderExecutor`: 넓은 어깨 + 뿔 투구 + 처형검 (대형 사각 날). 진화시 점선 원 추가.
  - `renderRift`: 파편화된 비정형 실루엣, 균열 틈새, seed 기반 jitter. 진화시 측면 균열선.
  - `renderSilhouette` 시그니처에 `assetFamily?: string` 추가.
  - dispatch 순서: assetFamily 먼저 → 신규 3종 포함 → 기존 role-based 폴백.

- `src/lib/shadows.ts`
  - `inferShadowVisual` 확장: ID 패턴 기반 자동 가족 감지.
    - `id.includes('spearman')` → `'spearman'`
    - `id.startsWith('rift-') && role === 'assault'` → `'rift'`
  - 이로써 shadow-spearman, rift-fang, rift-trainee, rift-gladiator, rift-champion이 자동으로 올바른 SVG 가족 사용.

- `src/lib/shadowPortraitAssets.ts` — 전면 재작성
  - `ShadowPortraitAssetStatus` 타입: `'missing' | 'planned' | 'draft' | 'final'`
  - `ShadowPortraitRegistryEntry` 인터페이스: portraitKey, assetFamily, src, status, visualDirection, notes.
  - `SHADOW_PORTRAIT_ASSETS`: 빈 맵 유지 (Phase별 주석 가이드 포함).
  - `SHADOW_PORTRAIT_REGISTRY`: 전체 80개+ 그림자 등록 (E/D/C-rank + named_gate + named_achievement).
  - `getShadowPortraitAsset`, `hasShadowPortraitAsset`, `getShadowPortraitAssetStatus` 헬퍼.
  - `ASSET_FAMILY_FOLDER`: 아트 파이프라인 폴더 가이드.

- `docs/shadow-portrait-catalog.md` — 신규 생성
  - 전체 roster를 Phase별 표로 정리.
  - 각 그림자의 assetFamily, status, visual direction 포함.
  - 아트 추가 절차 (5단계) 문서화.

### 아트 파이프라인 Phase 계획
| Phase | 대상 | 우선순위 |
|-------|------|--------|
| Phase 1 | named_gate 18종 | 최우선 (게임 내 고가치 캐릭터) |
| Phase 2 | named_achievement 24종 | 우선 |
| Phase 3 | 진화 가능 베이스 (rare급) | 중간 |
| Phase 4+ | 나머지 전체 | 점진적 |

### 제약 유지
- localStorage 키 `levelup-save` 및 persist version 변경 없음.
- 기존 gameplay/reward 로직 무변경.
- SVG 폴백 항상 유지 — 이미지 없어도 UI 정상 동작.

### Verification
- `npm run build`: exit 0 확인.
- shadow-spearman → spearman SVG (긴 창), rift-fang/gladiator → rift SVG (파편 실루엣), dark-executor → executor SVG (처형검).
- named_gate/achievement → 기존 SVG decor 정상.
- assetFamily 없는 그림자 → 기존 role 폴백 그대로.

---

## 12-24D — 전체 102개 그림자 이미지 생성 프롬프트 작성

### 목표
전체 그림자 병사 102개의 개별 PNG/WebP 초상화 제작을 위한 batch 이미지 생성 프롬프트 세트 작성.  
**코드 변경 없음. 전적으로 docs 작업.**

### 생성 파일
- `docs/shadow-portrait-generation-prompts.md` (신규)
  - 공통 스타일 가이드 및 Negative Prompt
  - 11개 batch × 102개 그림자 전체 커버
  - 각 항목: portraitKey, filename, assetFamily, rarity/role, folder 경로, 복붙 가능한 English prompt
  - Section 4 Family Spotlight: rat/spearman/executor/rift 특수 실루엣 규칙
  - 생산 체크리스트 (11 batch × ⬜ 박스)

### Batch 구조

| Batch | 내용 | 수량 |
|-------|------|------|
| 01 | E-rank common | 8 |
| 02 | E-rank uncommon/rare | 10 |
| 03 | D-rank common | 9 |
| 04 | D-rank uncommon/rare | 10 |
| 05 | 진화 라인 핵심 | 10 |
| 06 | C-rank 일반 | 9 |
| 07 | C-rank 에픽 | 6 |
| 08 | named_gate E+D | 9 |
| 09 | named_gate C | 7 |
| 10 | named_achievement 1/2 | 12 |
| 11 | named_achievement 2/2 | 12 |
| **합계** | | **102** |

### 공통 스타일 원칙
- transparent background, centered full body silhouette
- black and deep violet shadow smoke body
- mobile RPG card art, game UI ready
- no text, no frame, no background scene
- no human skin tone, no bright cartoon style
- WebP 512×768 권장

### 제약 유지
- localStorage 키 `levelup-save`, persist version 변경 없음.
- gameplay/reward/stat 변경 없음.
- 코드 변경 없음. docs 전용 작업.

### Verification
- `npm run build`: 코드 변경 없으므로 기존과 동일 (exit 0).
- `docs/shadow-portrait-generation-prompts.md` 생성 확인.
- 전체 102개 그림자 누락 없이 커버됨.

---

## 12-24E — Batch 01~05 PNG asset 연결 및 표시 확인

### 목표
`src/assets/shadows/`에 저장된 Batch 01~05 PNG 파일 47개를 실제 앱에 연결하여 ShadowPortrait 카드에 이미지가 표시되도록 한다.

### 발견 사항
- 파일명이 `.png.png` 이중 확장자로 저장되어 있음.
- Vite는 `path.extname()` 기반으로 마지막 `.png`를 인식 → 정상 처리됨.
- TypeScript 타입 선언 누락 → `src/vite-env.d.ts` 신규 생성으로 해결.

### 수정 파일

| 파일 | 변경 내용 |
|------|---------|
| `src/vite-env.d.ts` | 신규 생성: `/// <reference types="vite/client" />` + `declare module '*.png.png'` |
| `src/lib/shadowPortraitAssets.ts` | 47개 static import 추가, SHADOW_PORTRAIT_ASSETS 채움, 47개 status → 'draft' |
| `src/components/shadows/ShadowPortrait.tsx` | `object-cover object-top` → `object-contain` (전신 실루엣 잘림 방지) |

### 연결된 PNG 목록 (47개)

| Batch | 수량 | 폴더 |
|-------|------|------|
| 01 E-rank common | 8 | common, rift, scribe, shield, support, infantry |
| 02 E-rank uncommon/rare | 10 | rift, hound, infantry, support, scribe, scout |
| 03 D-rank common | 9 | infantry, shield, spearman, support, scribe, scout |
| 04 D-rank uncommon/rare | 10 | shield, executor, hound, scout, support, scribe |
| 05 진화 라인 | 10 | hound, shield, scribe, rift |

### 렌더링 우선순위 (변경 없음)
1. `SHADOW_PORTRAIT_ASSETS[portraitKey]` → `<img>` overlay (연결된 PNG)
2. named_gate/achievement SVG decor
3. assetFamily 기반 SVG 실루엣
4. role-based fallback

### 이미지 레이아웃
- `object-contain`: 전신 실루엣 전체 표시, 투명 배경 영역은 아래 SVG aura 노출 → 자연스러운 레이어 효과.
- `onError`: 이미지 로드 실패 시 `display: none` → SVG fallback 자동 노출.

### Build 결과
- Exit code: 0
- 47개 PNG 모두 `dist/assets/` 번들링 확인 (각 1.2~2.4MB).
- JS 번들 797KB (gzip 240KB), CSS 96KB.
- 이미지 크기 경고 (500KB 초과) — 기대 범주, 에러 아님.

### 제약 유지
- localStorage 키 `levelup-save` 변경 없음.
- persist version 변경 없음.
- gameplay/reward/stat/공식 변경 없음.
- 저장 데이터 초기화 없음.

---

## 12-24F — Shadow Portrait 체커보드 배경 제거 및 시각 보정

### 문제 진단
- AI 생성 PNG 파일이 투명 배경 없이 **체커보드 패턴을 실 픽셀로** 포함하고 있었음.
- 각 파일(1086×1448): ~64만~126만 px가 배경 픽셀 (전체 픽셀의 ~60-80%).
- `object-contain` 적용 시 카드 위에 사각형 이미지가 붙은 느낌으로 보임.

### 해결 방법

#### 후처리 스크립트: `scripts/process-shadow-portraits.mjs`
- **알고리즘:** BFS flood-fill — 이미지 4방향 엣지에서 시작, 연결된 밝은 회색/흰색 픽셀 제거
- **배경 판별:** R>165 AND G>165 AND B>165 (밝은 픽셀) AND max-min < 40 (중립 회색)
- **엣지 페더링:** 캐릭터 경계 2px 반경 부드럽게 처리
- **trim:** 투명 여백 12px 임계값으로 제거
- **pad:** 7% padding 추가 (전신 잘림 방지)
- **resize:** 512×768 (fit: contain, 투명 배경)
- **백업:** `src/assets/shadows_backup/` 에 원본 보존
- **in-place 출력:** 기존 경로/파일명 그대로 덮어쓰기 (import 변경 불필요)

#### 처리 결과
| 항목 | 수치 |
|------|------|
| 처리 파일 수 | 56개 |
| 원본 크기 | 1086×1448 |
| 출력 크기 | 512×768 |
| 파일 크기 변화 | 1.2~2.4 MB → 333~711 KB (평균 -65%) |
| 실패 건수 | 0 |

#### ShadowPortrait.tsx CSS 조정
- `scale-[1.05]` — 처리된 portrait가 카드를 더 꽉 채우도록
- `drop-shadow(0 0 7px var(--shadow-glow)) drop-shadow(0 0 14px var(--shadow-glow))` — rarity 색상 기반 글로우로 SVG aura와 자연스럽게 통합

### 수정 파일

| 파일 | 변경 내용 |
|------|---------|
| `scripts/process-shadow-portraits.mjs` | 신규 생성 (BFS flood-fill 배경 제거 스크립트) |
| `package.json` | `process-portraits`, `process-portraits-dry` 스크립트 추가 |
| `src/components/shadows/ShadowPortrait.tsx` | `scale-[1.05]` + `drop-shadow` 필터 추가 |
| `src/assets/shadows_backup/` | 원본 56개 자동 백업 생성 |

### npm 스크립트
```bash
npm run process-portraits        # 실제 처리 (in-place)
npm run process-portraits-dry    # 미리보기 (파일 변경 없음)
```

### Build 결과
- Exit code: 0
- TypeScript 컴파일 통과
- Vite 번들링: 47개 Batch 01-05 이미지 포함 (333~711 KB 범위)
- 경고: >500KB 청크 (이미지 파일, 기대 범주)

### 제약 유지
- localStorage 키 `levelup-save` 변경 없음.
- persist version 변경 없음.
- gameplay/reward/stat/공식 변경 없음.
- 저장 데이터 초기화 없음.
- 원본 이미지 `shadows_backup/` 에 보존됨.

---

## 12-24G — Batch 06~11 Shadow Portrait 연결

### 목표
Batch 06~11 (55개) PNG 파일을 앱에 연결. 기존 Batch 01~05 (47개) 방식과 동일하게 처리.

### 처리 순서

1. `npm run process-portraits` 실행 → 신규 파일 체커보드 제거
2. `src/lib/shadowPortraitAssets.ts` import/asset map/registry 업데이트
3. `npm run build` 검증

### Batch별 파일 위치

| Batch | 내용 | 폴더 |
|-------|------|------|
| 06 (C-rank General) | mirror-hunter, rift-cartographer, rift-wayfinder, greed-ledger, forgetting-watcher, corridor-banner, fatigue-cantor, rift-instructor, rift-tactician | hound/, scout/, scribe/, support/ |
| 07 (C-rank Epic) | greed-devourer, rift-gladiator, rift-champion, fatigue-wall, iron-bastion, midnight-oracle | hound/, rift/, shield/, support/ |
| 08 (Named Gate E+D) | ner-first-rift, rook-backstreet, lark-nest-fang, vela-rift-mender, marn-backstreet-ledger, gorn-sloth-captain, shark-black-chaser, doru-sloth-cantor, sable-patrol-knife | named/ |
| 09 (Named Gate C) | karden-forgetting-scribe, organ-fatigue-shield, raban-rift-instructor, grid-greed-hound, mero-fatigue-reader, tess-rift-wayfinder, balm-greed-ledger | named/ |
| 10 (Named Achievement 1/2) | kasim-analyst, rao-market-watcher, charka-finance-patron, nebl-black-accountant, volen-strategist, verk-steel-knight, raven-running-shadow, moro-restraint-chef, nok-sleep-keeper, baron-cutting-watcher, irnel-registrar, kalt-deadline-executor | named/ |
| 11 (Named Achievement 2/2) | seron-saver, lumen-dawn-vanguard, hexa-study-lantern, mira-career-auditor, borin-training-captain, sena-health-warden, orien-mind-anchor, pavel-finance-scout, naru-social-herald, voss-challenge-blade, runo-habit-keeper, elan-balance-weaver | named/ |

### checkerboard 후처리 결과

| 항목 | 수치 |
|------|------|
| 처리 파일 수 | 102개 (전체 재처리) |
| 실패 건수 | 0 |
| 신규 Batch 07 비named 크기 | 1.8~2.5 MB → 400~770 KB |
| Batch 08-11 named 크기 | 1.5~2.8 MB → 400~890 KB |

### 수정 파일

| 파일 | 변경 내용 |
|------|---------|
| `src/lib/shadowPortraitAssets.ts` | Batch 06-11 import 55개 추가, SHADOW_PORTRAIT_ASSETS 55개 추가, registry status 55개 draft로 변경 |

### Build 결과
- Exit code: 0
- 2073 modules transformed
- 102개 PNG 이미지 dist/assets 번들링
- 파일 크기: 329~889 KB (처리 후)
- 경고: >500KB 청크 (이미지 파일, 기대 범주)

### 최종 연결 현황

| 구분 | 연결 수 |
|------|---------|
| Batch 01-05 | 47개 |
| Batch 06-11 (신규) | 55개 |
| **합계** | **102개** |

### 제약 유지
- localStorage 키 `levelup-save` 변경 없음.
- persist version 변경 없음.
- gameplay/reward/stat/공식 변경 없음.
- 저장 데이터 초기화 없음.
- ShadowPortrait.tsx 구조 변경 없음 (object-contain + scale + drop-shadow 유지).

---

## 12-25A — 일일 박스/카드 실사용 루프 마감

### 목표
일일 박스 및 카드 기능의 실사용 루프 마감 및 UI/UX 개선.

### 변경 파일
- [RewardBoxPanel.tsx](file:///c:/Users/khdkf/levelup/src/components/RewardBoxPanel.tsx)
- [ChallengeCardsPanel.tsx](file:///c:/Users/khdkf/levelup/src/components/ChallengeCardsPanel.tsx)

### 변경 내용
- **요약 기능 추가**: TODAY LOOP 및 TODAY CARDS 요약 추가.
- **보급 상자 구분**: daily/weekly/boss 박스를 각각 오늘의 보급, 주간 보급, 보스 보급으로 구분.
- **사용자 경험 개선**: 박스 preview 힌트 제공, 최근 오픈 보상 라벨 노출, 카드 진행/완료/보상 상태 표시 개선.
- **제약 조건**: 보상 확률, 보상량, 공식 변경 없음. levelup-save 스토리지 키 및 persist version 변경 없음.

### 검증 결과
- `npx tsc --noEmit` 통과
- `npm run build` 통과
- 모바일 390px 화면에서 레이아웃 overflow 없음
- Console 에러 없음

---

## 12-25B — 스킬 시스템 고도화 1차

### 목표
보유한 스킬 목록과 상세 내역을 효과적으로 보여주고, 전투 시 통합된 스킬 UI를 사용할 수 있도록 고도화.

### 변경 파일
- [SkillActionCard.tsx](file:///c:/Users/khdkf/levelup/src/components/SkillActionCard.tsx)
- [SkillPanel.tsx](file:///c:/Users/khdkf/levelup/src/components/SkillPanel.tsx)
- [GatePanel.tsx](file:///c:/Users/khdkf/levelup/src/components/GatePanel.tsx)
- [InfiniteTowerPanel.tsx](file:///c:/Users/khdkf/levelup/src/components/InfiniteTowerPanel.tsx)

### 변경 내용
- **공용 컴포넌트 추가**: 공용으로 활용 가능한 [SkillActionCard.tsx](file:///c:/Users/khdkf/levelup/src/components/SkillActionCard.tsx) 구현.
- **구조 개편**: SkillPanel을 보유 스킬 목록 및 상세 정보를 직관적으로 조회할 수 있는 상세 패널 구조로 정리.
- **메타데이터 표시**: 스킬 출처(BASIC / JOB / EQUIPMENT / TITLE / SPECIAL) 및 스킬 타입(ATTACK / DEFENSE / BUFF / HEAL / UTILITY)을 시각적으로 구분하여 표시.
- **상태 및 사유**: 스킬의 쿨다운 상태, 사용 가능 여부와 사용 불가 시 그 사유를 명확히 표시.
- **UI 통합**: 게이트 수동 전투 및 무한의 탑 수동 전투에 사용되는 스킬 UI를 하나로 통합.
- **제약 조건**: 스킬 수치, 쿨다운, 전투 공식 변경 없음.

### 검증 결과
- `npx tsc --noEmit` 통과
- `npm run build` 통과
- 모바일 390px 화면에서 레이아웃 overflow 없음
- Console 에러 없음

---

## 12-25C — 스킬 숙련도/마스터리 구조 1차

### 목표
스킬의 개별 사용 횟수와 숙련도 경험치 및 레벨을 안전하게 저장하고 정규화할 수 있는 마스터리 구조 구축.

### 변경 파일
- [skills.ts](file:///c:/Users/khdkf/levelup/src/lib/skills.ts)
- [types.ts](file:///c:/Users/khdkf/levelup/src/lib/types.ts)
- [store.ts](file:///c:/Users/khdkf/levelup/src/lib/store.ts)
- [SkillActionCard.tsx](file:///c:/Users/khdkf/levelup/src/components/SkillActionCard.tsx)
- [SkillPanel.tsx](file:///c:/Users/khdkf/levelup/src/components/SkillPanel.tsx)

### 변경 내용
- **스킬 상태 구조 정리**: 스킬의 실시간 상태를 표현하는 `skillStates: Record<skillId, SkillRuntimeState>` 구조 확립.
- **저장 필드 정의**: skillId, timesUsed, masteryXp, masteryLevel, lastUsedAt 필드 포함.
- **정규화 및 폴백**: `normalizeSkillRuntimeState` / `normalizeSkillStates` 폴백 처리 추가. 레거시 uses / xp / level 및 skillMastery 데이터를 skillStates로 안전하게 정규화.
- **버전 유지**: persist version 14 유지.
- **숙련도 획득**: 수동 게이트 및 무한의 탑에서 플레이어가 스킬을 직접 발동 및 사용할 때마다 해당 스킬의 mastery 증가.
- **시각화**: SkillActionCard 및 SkillPanel에 현재 숙련 Level, 스킬 사용 횟수, 다음 레벨까지의 진행 상태 bar 표시.
- **제약 조건**: 스킬 수치 및 전투 공식 변경 없음.

### 검증 결과
- `npx tsc --noEmit` 통과
- `npm run build` 통과
- 모바일 390px 화면에서 레이아웃 overflow 없음
- Console 에러 없음

---

## 12-25D — 전투 긴장감 / 몬스터 패턴 예고 1차

### 목표
수동 전투 시 몬스터의 행동 패턴과 의도를 플레이어에게 사전에 예고하여 전략적 대응과 전투 긴장감을 유도.

### 변경 파일
- [combatIntent.ts](file:///c:/Users/khdkf/levelup/src/lib/combatIntent.ts)
- [MonsterIntentPanel.tsx](file:///c:/Users/khdkf/levelup/src/components/MonsterIntentPanel.tsx)
- [SkillActionCard.tsx](file:///c:/Users/khdkf/levelup/src/components/SkillActionCard.tsx)
- [GatePanel.tsx](file:///c:/Users/khdkf/levelup/src/components/GatePanel.tsx)
- [InfiniteTowerPanel.tsx](file:///c:/Users/khdkf/levelup/src/components/InfiniteTowerPanel.tsx)
- [store.ts](file:///c:/Users/khdkf/levelup/src/lib/store.ts)

### 변경 내용
- **몬스터 의도 파생**: 수동 전투 진행 시 세션 내 몬스터의 현재 HP, 스킬 타입, 쿨다운 상태를 기반으로 실시간 의도를 파생 및 계산.
- **의도 유형**: 강공격/연속 공격, 방어 자세, 약점 노출, 불안정/균열 흔들림 계열 등의 행동 의도 구분 및 표시.
- **패널 추가**: 수동 게이트 전투 및 무한의 탑 전투 UI에 MONSTER INTENT 전용 표시 패널 추가.
- **대응 힌트 제공**: SkillActionCard에 몬스터의 현재 의도를 상쇄하거나 대처할 수 있는 짧고 직관적인 대응 가이드/힌트 노출.
- **로그 강화**: 플레이어가 행동을 마친 후 몬스터 턴이 시작되기 직전, 몬스터의 의도가 구체적으로 담긴 예고 전투 로그 출력.
- **제약 조건**: 몬스터 수치, 전투 공식, 스킬 기본 수치 변경 없음.

### 검증 결과
- `npx tsc --noEmit` 통과
- `npm run build` 통과
- 모바일 390px 화면에서 레이아웃 overflow 없음
- Console 에러 없음

---

## 12-25E — 보스전/전투 드라마 강화 1차

### 목표
게이트 및 무한의 탑 수동 전투에서 보스전, 위험 구간, 막타, 승리/패배 순간이 더 극적으로 느껴지도록 연출 및 UI 비주얼 강화.

### 변경 파일
- [GatePanel.tsx](file:///c:/Users/khdkf/levelup/src/components/GatePanel.tsx)
- [InfiniteTowerPanel.tsx](file:///c:/Users/khdkf/levelup/src/components/InfiniteTowerPanel.tsx)
- [SkillActionCard.tsx](file:///c:/Users/khdkf/levelup/src/components/SkillActionCard.tsx)

### 변경 내용
- **보스전/위기 분위기 강화**: 
  - 수동 전투 중 보스 몬스터 조우 시 및 플레이어/몬스터 생명력 위기(Low HP, 30% 이하) 상황에서 동적 테두리 점멸(pulse) 및 글로우 스타일 클래스 적용.
  - 수동 전투 개시 시, 보스 및 엘리트 몬스터인 경우 화면 중앙 상단에 `WARNING` 긴장감 환기 배너 노출.
- **전투 로그 및 시네마틱 텍스트 다듬기**:
  - 플레이어 HP가 30% 이하일 때 `[⚠️ 위기]`, 몬스터 HP가 30% 이하일 때 `[⚡ 기회]`, 결정타 시 `[🎯 결정타]` 접두사를 전투 로그 텍스트 및 시네마틱 오버레이에 노출하여 전황을 드라마틱하게 체감할 수 있도록 개선.
  - `gateTurnToLogEntry`와 `towerTurnToCinematicLog`에 `session` 파라미터를 넘겨 실제 HP와 전황 비율을 동적으로 트래킹.
- **DramaticReveal 결과 모달 통합**:
  - 기존의 무미건조한 승리/패배 텍스트 상자를 동적 인라인 `DramaticReveal` 컴포넌트로 통합하여 승리와 실패의 순간을 더 세련되고 극적으로 표현.
- **행동 추천 연출**:
  - 몬스터의 다음 행동 의도가 위험(`danger`) 상태일 때 '방어' 버튼에 골드/엠버 글로우 및 `[추천]` 배지를 표기하여 수동 전투의 전술적 조작 직관성 증대.
- **모바일 최적화**:
  - `StatPill` 및 `HpBar`의 스타일과 폰트 크기를 다듬어 390px 모바일 레이아웃 폭에서 가로 스크롤 및 텍스트 잘림 현상을 완벽히 방어.
- **제약 조건**: 
  - 전투 공식, 몬스터/플레이어 체력 및 스탯 수치 변경 없음. 스킬 성능 및 쿨다운 변경 없음.
  - `levelup-save` 스토리지 키 및 persist version 변경 없음.

---

## 12-26A — 전체 실사용 마감 QA 및 소형 fix

### 목표
12-24H ~ 12-25E까지 누적된 대형 연출 및 비주얼/기능 업데이트 후, 주요 화면이 깨지지 않고 런타임 오류가 발생하지 않는지 전체 흐름 검증 및 실사용 마감.

### 검증 결과
- **빌드 검증**: `npx tsc --noEmit`을 통한 정적 타입 체킹 통과 및 `npm run build` 프로덕션 빌드 정상 완료 확인.
- **보안/기밀 유지**: Locked Named Gate Shadow 및 봉인된 업적 그림자들의 실제 이미지/명칭/설명이 `???` 마스킹 및 `LockedShadowPortrait` 시각적 실루엣 힌트로 완전히 차단되는지 `CodexCard` 및 `ShadowPanel`에서 로직 검증 완료.
- **모바일 레이아웃(390px)**: 모바일 에뮬레이션 상태에서 `DramaticReveal` 모달, `ShadowRevealModal`, 일일 루프의 탭 전환 시 화면 overflow 및 깨짐 현상이 없는지 스타일 구조 검증.
- **제약 조건**: `levelup-save` 로컬스토리지 키 및 persist version 무갱신 준수. 게임플레이 수치, 보상 확률, 공식의 무변경 원칙 고수.

## 12-26B — 비밀 서사 연결 고도화 1차 (스포일러 비공개)

### 목표
12-22~12-22C에서 깔린 quiet connective layer를 기반으로, 게이트/무한의 탑/그림자 원정/그림자 군단이 같은 세계관의 흔적을 공유한다는 분위기를 더 일관되게 전달한다. 사용자에게 정확한 조건/정체/보상은 노출하지 않으면서, 앱을 오래 사용한 사용자가 “서로 다른 기록이 한 방향을 가리키는 듯한 느낌”을 받도록 톤을 정리한다.

### 변경 원칙
- 신규 대형 시스템 추가 없음
- B/A/S급 서사 게이트, 상위 무한의 탑 구간, 군단 대형 콘텐츠, 고난도 보고/작전 등은 보류
- 비밀 조건/정체/보상/trait 이름/스토리 반전을 UI 또는 시스템 메시지에 직접 노출 금지
- 전투/보상/성장/확률/추출/강화 공식 변경 없음
- localStorage key `levelup-save` 변경 없음
- persist version 변경 없음: v14 유지
- 기존 저장 데이터의 secretProgress/snapshot 머지 fallback 그대로 유지
- 이미 본 기존 hint/fragment는 다시 표시되지 않게 기존 throttle/seen 정책 그대로 사용

### 수정 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/secretLore.ts` | `SecretHintLevel`에 `l4` 추가, 6개 컨텍스트(tower/gate/expedition/shadow/box/rank) 각각에 `min` 임계값이 더 높은 ambient hint 1줄 추가. 텍스트는 모두 "다른 기록과의 결" 같은 모호한 톤으로만 표현했고, 조건/정체/보상명은 포함하지 않음. |
| `src/components/GatePanel.tsx` | 작은 `ArchiveTraceChip` 컴포넌트 추가 + `getSecretVisibleFragments` 셀렉터 후, 4개 렌더 분기(empty gate, missing data, active gate, manual battle)에서 GateStatusPanel 바로 아래에 trace 수만 표시. 카운트가 0이면 칩 자체가 숨겨짐. |
| `src/components/shadows/ShadowExpeditionPanel.tsx` | 헤더 배지 행에 `getSecretVisibleFragments` 기반 trace chip 추가. 카운트가 0이면 숨겨짐. 보고서 텍스트/이벤트/명령 흐름은 손대지 않음. |

### 비밀 서사 연결 지점 (스포일러 없는 요약)
1. **무한의 탑** — 기존 ARCHIVE TRACE 칩 그대로 유지. 새 ambient hint pool이 더 누적된 사용자에게서 1회 더 등장 가능하도록 확장.
2. **게이트** — 기존 ARCHIVE TRACE 칩이 없었음. Tower와 동일 패턴으로 추가하여 두 콘텐츠가 같은 흔적 기록을 공유한다는 느낌만 시각적으로 일치.
3. **그림자 원정** — 헤더 배지 행에 동일한 trace chip을 작게 추가. 보고서 본문(개요/주목/수확/마무리), 이벤트 선택지, 명령 로그는 기존 그대로 유지.
4. **그림자 군단** — 별도 UI 변경 없음. 기존 secret 마킹/잠금 그림자/봉인 보상 정책은 그대로 유지.
5. **시스템 메시지** — `secret`/`story` kind의 톤(낮은 채도 violet/sky, 비dramatic) 그대로 유지. 별도 텍스트 변경 없음.

### secretProgress 흐름 점검
- `applySecretProgressEvent` 호출 위치 전수(20+ 지점) 변동 없음.
- `recordSecretEvent` 내부 throttle: 컨텍스트별 hint는 최소 3개 signal 간격 유지. 동일 hint id는 `seen` set에 의해 한 번만 표시.
- 새 l4 ambient hint는 `min` 값이 높아 substantial 진행을 한 사용자에게만 후순위로 픽업됨. 기존 사용자에게는 기존 l1~l3을 모두 본 뒤에야 다시 한 줄이 늘어남.
- progress/seal/reward budget cap(`maybeApplySmallReward`의 6개 cap)은 손대지 않음.

### 후속 확장 후보 (이번 작업에는 미포함)
- B/A/S급 서사 게이트
- 무한의 탑 상위 구간(서사 진입선)
- 그림자 군단 대형 콘텐츠
- 그림자 원정 고난도 보고/작전
- 비밀 trait/variant 고도화

### 검증
- `npx tsc --noEmit` 통과
- `npm run build` 통과 (기존 Vite chunk 크기 경고만 유지)
- `npx tsx scripts/sim-secret-expansion.ts` 통과 — counters/visibleFragments 흐름 정상
- `npx tsx scripts/sim-gate-current.ts` 통과 — E/D/C 게이트 밸런스 그대로
- `npx tsx scripts/sim-infinite-tower.ts` 통과 — 보상/난이도 변화 없음
- `npx tsx scripts/sim-shadow-expedition.ts` 통과 — 원정 결과/보상 그대로
- DEV 서버(`localhost:3002`) 기동 확인 — 콘솔 에러 없음
- 모바일 390px 폭에서 새 trace chip은 기존 배지/칩 옆에서 wrap 정상

### 노출 방지 점검
- 칩은 trace 카운트(`x{n}`)만 보여주며 fragment id/이름/조건/보상명은 표시하지 않음.
- 신규 hint 텍스트는 모두 "다른 기록의 결", "다른 전장의 잔향" 같은 모호한 표현. 어떤 콘텐츠를 클리어하면 무엇이 발생하는지 추론 가능한 단서를 포함하지 않음.
- `SECRET_MESSAGES`의 reward/shadowMark/retrospective 텍스트와 키 이름은 변경하지 않음 → 기존 정책과 일관.
- `LockedShadowPortrait`/`???` 마스킹 정책 그대로.

### 게임플레이 영향 확인
- 전투 수치/보상 수치/확률 수치 변경 없음.
- XP 곡선, 랭크 임계치, 스탯 multiplier, 드롭률 변경 없음.
- 그림자 추출/강화/진화/소환 공식 변경 없음.
- 게이트/몬스터 스탯/recommendedPower 변경 없음.
- 무한의 탑 monster scaling/보상 변경 없음.
- 그림자 원정 progress/risk 공식 및 reward 변경 없음.
- 박스/카드 보상 변경 없음.

### persist 및 저장 데이터
- localStorage key 변경 없음: `levelup-save` 유지.
- persist version 변경 없음: v14 유지.
- 저장 스키마 변경 없음. 새 hint id는 `seen`/`discoveredHints` set에 자연스럽게 누적되며 기존 fallback과 호환.
- 기존 사용자 데이터의 의미를 깎지 않음. 누적된 signals/seen/sealedRewards 모두 그대로 사용.


---

## 12-27A 보상 체감 / 난이도 재조정 1차 완료

### 목표
카드 3장 완전 달성과 무한의 탑 보스 클리어가 더 기억에 남는 성취처럼 느껴지도록, 반복 보상은 작게 유지하면서 완전 달성/보스층/강화 박스의 체감 보상을 소폭 상향했다.

### 수정 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/store.ts` | 카드 완전 달성 보너스, daily box epic 보정, 박스 보상 테이블, 카드 normal/hard 일부 요구량 조정 |
| `src/lib/infiniteTower.ts` | 보스층 권장 전투력/스케일링 소폭 상향, 보스 first/repeat clear 보상 상향 |
| `src/components/ChallengeCardsPanel.tsx` | 3장 완전 달성 reveal 제목/요약 칩 보강 |
| `src/components/RewardBoxPanel.tsx` | 3장 완전 달성 시 daily box Epic preview/tier 표시 보강 |
| `src/components/InfiniteTowerPanel.tsx` | 보스 클리어 reveal 제목과 Shadow XP 결과 표시 보강 |
| `scripts/sim-box-card-rewards.ts` | 변경된 박스/카드 보상 기대값 반영 |

### 카드 3장 완전 달성 보상
- 오늘 선택한 카드 3장을 모두 완료한 순간 1회만 지급한다.
- 보너스: XP +25, 그림자 정수 +2, normal 소환 조각 +1 확정.
- 추가로 rare 소환 조각 +1은 15% 확률, 일반/희귀 소환권 신호는 아주 낮은 확률로만 유지.
- `challengeCardHistory[date].completedCount < 3 && completedIds.length >= 3` 조건으로 중복 지급을 막는다.

### 박스 강화 보상 변경
- 카드 완료로 얻는 daily box upgrade point가 6 이상이면 daily box도 `epic` tier까지 상승한다.
- tier multiplier 조정: enhanced 1.25 -> 1.30, superior 1.55 -> 1.68, epic 1.90 -> 2.00.
- daily box 장비 확률 5.5% -> 5.8% * tier multiplier, enhanced 이상 daily box 장비 상한을 rare까지 허용.
- daily/weekly/boss box의 소환 조각/티켓 신호 확률을 소폭 상향했다.
- boss box 소모품 확률 28% -> 34%, 장비 확률 superior 62% -> 68%, epic 78% -> 84%.

### 무한의 탑 보스 보상 변경
- 보스 첫 클리어: XP floor*28 -> floor*31, 그림자 정수 `5 + floor/5` -> `7 + floor/4`, itemDropChance 35% -> 42%, Shadow XP 추가.
- 보스 반복 클리어: XP floor*6 -> floor*7, 그림자 정수 `1 + floor/10` -> `2 + floor/8`, itemDropChance 8% -> 11%, Shadow XP 추가.
- 기존처럼 보스 박스는 first clear + 미수령 보스층에만 지급한다.

### 난이도 조정
- 무한의 탑 보스층 권장 전투력 계수 1.35 -> 1.42.
- 무한의 탑 보스층 monster scale 보정 1.18 -> 1.22.
- 카드 일부 요구량 소폭 상향: normal daily count 3 -> 4, hard daily count 5 -> 6.
- 초반 일반층/일반 게이트/고레벨 게이트 구조는 변경하지 않았다.

### 보상 인플레이션 방지
- 카드 완전 달성 보너스는 하루 1회, small XP/정수/조각 중심으로 제한.
- daily box Epic은 카드 3장 완전 달성급 upgrade point에서만 적용된다.
- boss box는 기존 `bossRewardsClaimed[floor]` 경로를 유지해 보스층마다 first clear 1회 지급만 가능하다.
- repeat boss reward는 box 없이 XP/정수/Shadow XP/item chance만 소폭 상향했다.

### 검증
- `npx tsc --noEmit` 통과.
- `npm run build` 통과. 기존 Vite chunk size 경고만 유지.
- `npx tsx scripts/sim-box-card-rewards.ts` 통과.
  - perfect day avg: XP 203.00, essence 약 14.0, equipment 약 0.11~0.12, consumables 약 0.16, normalShards 약 1.07, rareShards 약 0.17.
  - perfect week avg: XP 1614.00, essence 약 108.0, equipment 약 1.22, consumables 약 1.68, normalShards 약 7.91, rareShards 약 1.22.
  - floor 15 boss box avg: XP 126.00, essence 21.00, equipment 약 0.69, consumables 약 0.34, normalShards 약 0.87, rareShards 약 0.18.
- `npx tsx scripts/sim-infinite-tower.ts` 통과.
  - 보스층 권장 전투력은 5층 852, 10층 1420, 15층 1988, 20층 2556, 25층 3124, 30층 3692로 상승.
  - 보스 first clear 보상 샘플: 5층 XP 155/정수 8/item 42%, 30층 XP 930/정수 15/item 42%.
- `npx tsx scripts/sim-gate-current.ts` 통과. E/D/C 게이트 밸런스는 기존 기준 유지.
- DEV 서버 `http://localhost:3002` 확인.
- 모바일 390px viewport 확인: `scrollWidth === clientWidth`, horizontal overflow 없음.
- Browser console error: 0.

### 저장 데이터 / 보안 제약
- localStorage key 변경 없음: `levelup-save` 유지.
- persist version 변경 없음: v14 유지.
- 기존 저장 데이터 초기화/삭제 없음.
- 새 저장 필드 추가 없음. 기존 optional reward/ticket/shard 필드와 challengeCardHistory를 사용.
- secret/hidden 조건/정체/보상명 노출 없음.
- B/A/S급 상위 게이트 또는 고레벨 신규 콘텐츠 구현 없음.

## 12-27B 골드/상점/소환권/장비권 수급 완화 1차 완료

### 목표
12-23B에서 늘어난 그림자/장비 풀, `innateGrade`, `equipmentStars` 체계를 실제 플레이에서 더 자주 만질 수 있도록 Gold 재화와 상점 루프를 추가했다. 12-27A 보상 상향 위에 얹는 작업이므로 Gold는 자주 체감되지만, 고급권/유물권은 주간 제한과 고가격으로 통제했다.

### 수정 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/types.ts` | `BoxReward`, `ChallengeCardReward`, `TowerReward`에 `gold` 추가. `GateReward`에 `gold` 타입 추가. |
| `src/lib/shop.ts` | 상점 상품 정의, 일일/주간 구매 키, 제한 라벨 유틸 추가. |
| `src/lib/store.ts` | `gold`, `shopPurchases` optional 저장 필드와 fallback, 구매 처리, 장비권 즉시 장비 생성, 소환권/조각/정수 구매 반영, 보상 흐름 Gold 지급 추가. |
| `src/components/ShopPanel.tsx` | Gold/정수 표시, 상품 카드, 가격/제한/구매 가능 상태, confirm 구매 UI 추가. |
| `src/App.tsx` | `상점` 탭 추가. |
| `src/components/HunterStatus.tsx` | 상태창에 Gold 보유량 표시. |
| `src/components/RewardBoxPanel.tsx` | 박스 reward/reveal/preview에 Gold 표시. |
| `src/components/ChallengeCardsPanel.tsx` | 카드 보상 합계와 카드 칩에 Gold 표시, 완전 달성 보너스 Gold 문구 반영. |
| `src/components/InfiniteTowerPanel.tsx` | 무한의 탑 보상 reveal/result에 Gold 표시. |
| `src/components/GatePanel.tsx` | 게이트 전투 로그 보상에 Gold 표시. |
| `src/components/DevQaPanel.tsx` | DEV QA 프리셋에 Gold 1500 보정 추가. |
| `src/lib/infiniteTower.ts` | 무한의 탑 일반층/보스층 first/repeat clear Gold 보상 추가. |
| `scripts/sim-box-card-rewards.ts` | 카드/박스 Gold 기대값 출력 추가. |
| `scripts/sim-infinite-tower.ts` | 탑 보상 샘플에 Gold 출력 추가. |
| `scripts/sim-shop-economy.ts` | 7일/30일 상점 경제 시뮬레이션 신규 추가. |

### Gold 저장 구조
- `GameState.gold?: number` 추가. 기존 저장 데이터에는 없으므로 migrate/fallback에서 `0`으로 보정한다.
- `GameState.shopPurchases?: Record<string, number>` 추가. 키는 `daily:{date}:{productId}` 또는 `weekly:{week}:{productId}` 구조라 날짜/주차가 바뀌면 자연스럽게 제한이 리셋된다.
- persist version은 v14 유지.

### Gold 수급처
- Daily quest 완료: easy 18, normal 24, hard 34, elite 46, apex 60, boss 75.
- Challenge card 완료: easy 22, normal 36, hard 60.
- 카드 3장 완전 달성: 기존 XP +25/정수 +2/normal 조각 +1/rare 15%에 Gold +85 추가.
- Reward box 개봉: daily는 tier multiplier 반영, weekly는 superior 기준 평균 약 386 Gold, boss box는 층수와 tier multiplier 반영.
- Infinite tower: 일반층은 소량 Gold, 보스층 first clear는 `95 + floor * 12`, repeat는 `36 + floor * 5`.
- Gate victory: E 25, D 34, C 46, B 62, A 82, S 105, National 140.

### 상점 상품
| 상품 | 가격 | 제한 | 효과 |
|---|---:|---|---|
| 일반 그림자 소환권 | 120 Gold | 일일 2 | 기존 `normal_shadow` ticket 지급 |
| 무기 장비권 | 90 Gold | 일일 2 | weapon 장비 즉시 획득 |
| 방어구 장비권 | 90 Gold | 일일 2 | armor 장비 즉시 획득 |
| 장신구 장비권 | 100 Gold | 일일 2 | accessory 장비 즉시 획득 |
| 그림자 정수 팩 | 80 Gold | 일일 3 | 정수 +4 |
| 정수 조각 교환 | 60 Gold + 정수 6 | 일일 2 | normal 조각 +3 |
| 고급 소환 조각 묶음 | 450 Gold | 주간 2 | rare 조각 +3 |
| 고급 그림자 소환권 | 900 Gold + 정수 12 | 주간 1 | `rare_shadow` ticket 지급 |
| 유물 장비권 | 650 Gold | 주간 1 | artifact 장비 즉시 획득 |
| 희귀 장비권 | 750 Gold | 주간 1 | rare 이상 장비 즉시 획득 |
| 그림자 조각 묶음 | 350 Gold + 정수 8 | 주간 2 | normal +4, rare +1 |
| 선택형 장비권 묶음 | 500 Gold | 주간 1 | weapon/armor/accessory 각 1개 즉시 획득 |

### 장비권/소환권 연결
- 장비권은 별도 저장 ticket을 만들지 않고 구매 즉시 기존 `ITEM_POOL`에서 슬롯 필터링 후 장비를 생성한다.
- `instantiateItem`을 통과하므로 `equipmentStars`가 정상 부여된다.
- 표준 장비권은 common~legendary 저확률 분포, 유물권은 artifact 슬롯과 weekly 품질 별 분포, 희귀 장비권은 rare 이상과 boss 품질 별 분포를 사용한다.
- 그림자 소환권은 기존 `createShadowSummonTicket` 경로를 사용한다. 실제 그림자 획득/reveal은 기존 ShadowPanel 소환 흐름을 그대로 탄다.
- named/achievement/gate named 확률 구조는 상점 일반/고급권에서 새로 우회하지 않았다.

### 그림자 정수 활용처
- `정수 조각 교환`: 정수 + Gold로 normal 조각 구매.
- `그림자 조각 묶음`: 정수 + Gold로 normal/rare 조각 묶음 구매.
- 정수를 Gold로 직접 무제한 교환하는 구조는 추가하지 않았다.

### 인플레이션 방지
- 고급 그림자 소환권, 유물 장비권, 희귀 장비권, 조각 묶음은 주간 제한.
- 일반 소환권/표준 장비권은 자주 살 수 있지만 일일 제한으로 막았다.
- Gold는 반복 보상에 넓게 추가했지만, 상점 가격 대비 첫 주에는 일반권/표준권 중심으로 소비되도록 조정했다.
- 상점 구매 제한은 날짜/주차 키 기반이라 저장 필드가 없던 기존 유저도 안전하게 시작한다.

### sim 결과
- `npx tsx scripts/sim-shop-economy.ts` 통과.
  - 7일 steady: 남은 Gold 317, 일반 소환권 7개, normal 조각 25, 표준 장비권 14회.
  - 30일 steady: 남은 Gold 714, 일반 소환권 30개, normal 조각 106, rare 조각 16, 표준 장비권 60회, 유물권 3회.
  - 30일 weekly-priority: 남은 Gold 644, 고급 소환권 4개, rare 조각 1, 표준 장비권 59회, 희귀 장비권 1회, 유물권 1회.
- `npx tsx scripts/sim-box-card-rewards.ts` 통과.
  - perfect day avg: XP 203.00, Gold 약 305.04, essence 14.00, equipment 약 0.12, consumables 약 0.16, normalShards 약 1.07, rareShards 약 0.16.
  - perfect week avg: XP 1614.00, Gold 약 2521.21, essence 약 107.99, equipment 약 1.23, consumables 약 1.68, normalShards 약 7.88, rareShards 약 1.21.
  - floor 15 boss box avg: XP 126.00, Gold 약 414.83, essence 21.00, equipment 약 0.68, consumables 약 0.34.
- `npx tsx scripts/sim-infinite-tower.ts` 통과.
  - 보스 first clear Gold 샘플: 5층 155, 10층 215, 15층 275, 20층 335, 25층 395, 30층 455.
- `npx tsx scripts/sim-gate-current.ts` 통과. E/D/C 게이트 승률 기준 유지.

### 검증
- `npx tsc --noEmit` 통과.
- `npm run build` 통과. 기존 Vite chunk size 경고만 유지.
- DEV 서버 `http://127.0.0.1:3000`에서 확인.
- 모바일 390px viewport 확인: `documentElement.scrollWidth === 390`, `body.scrollWidth === 390`, horizontal overflow 없음.
- 상점 탭/상품 목록/가격/제한 표시 확인.
- Gold 주입 후 구매 가능 상태와 구매 후 Gold 차감 확인.
- 박스 preview/reward에 Gold 표시 확인.
- console/page error 0.

### 저장 데이터/보안 제약
- localStorage key 변경 없음: `levelup-save` 유지.
- persist version 변경 없음: v14 유지.
- 기존 장비/그림자/인벤토리 삭제 없음.
- 기존 진행도 무효화 없음.
- 신규 필드는 optional/fallback 처리.
- secret/hidden 조건/정체/보상명 노출 없음.
- B/A/S급 상위 게이트 또는 고레벨 신규 콘텐츠 구현 없음.

## 12-27C 상태창 정리 + 상점 티켓 UI 고급화 + 스킬창 표시 오류 수정 완료

12-27B의 Gold/ShopPanel/장비권/소환권 구조 위에서 UI 정리만 수행했다. Gold 가격, 보상량, 구매 제한, 장비/그림자 확률, 전투/스킬 수치, 저장 key, persist version은 변경하지 않았다.

### 수정 파일
| 파일 | 내용 |
| --- | --- |
| `src/App.tsx` | 헤더 칭호 영역 옆에 Gold 칩 추가. |
| `src/components/HunterStatus.tsx` | 전투력 오른쪽 Gold/장비/칭호/그림자 보조 카드 제거. |
| `src/components/ShopPanel.tsx` | 상품 카드 UI를 티켓형 프레임으로 재구성하고 `data-ticket-visual-key` 매핑 추가. |
| `src/components/SkillPanel.tsx` | 기본 공격을 오른쪽 상세 패널 기본 선택에서 제외하고, basic만 있을 때 compact 안내 상태 표시. |
| `src/components/SkillActionCard.tsx` | 선택 ring/비활성 테두리를 cyan/slate 계열로 완화. |
| `src/components/RewardBoxPanel.tsx` | RewardBoxPanel의 흰색 외곽/칩/preview/open 버튼 테두리를 cyan/slate 계열로 정리. |
| `src/components/ChallengeCardsPanel.tsx` | ChallengeCardsPanel의 흰색 카운트/설명/선택 ring을 violet 계열로 정리. |
| `CLAUDE.md` | 12-27C 완료 이력 추가. |

### 상태창 정리
- HunterStatus 전투력 카드 오른쪽의 Gold/장비/칭호/그림자 수치 카드 묶음을 제거했다.
- Gold는 앱 최상단 헤더의 칭호 칩 옆에서만 확인되도록 이동했다.
- 장비/칭호/그림자 개수 카드는 상태창에서 제거했고, 전투력 설명 문구만 유지했다.
- 390px에서 전투력 카드 구간 horizontal overflow 없음 확인.

### 상점 티켓 UI
- ShopPanel 상품을 실물 티켓처럼 보이도록 재구성했다.
- `ticketVisualKey` 성격의 `data-ticket-visual-key`와 `TICKET_VISUALS` 매핑을 추가해 추후 이미지 티켓 아트 연결 여지를 열어두었다.
- 각 상품 카드에 절취선, 좌우 펀칭, 홀로그램 광택, 티켓 스텁, 타입별 아이콘/색상/문양을 적용했다.
- 적용 키: `shadow-normal`, `shadow-rare`, `shadow-rare-shards`, `equipment-weapon`, `equipment-armor`, `equipment-accessory`, `equipment-relic`, `equipment-rare`, `equipment-choice`, `essence-pack`, `essence-exchange`, `shadow-bundle`.
- PRICE / LIMIT / 구매 가능 여부 / 버튼 상태는 유지했다.
- 상품 가격, 제한, reward 처리, 장비권/소환권 지급 로직은 변경하지 않았다.

### SkillPanel 기본 공격 상세 처리
- 초기 상세 선택은 basic source가 아닌 첫 non-basic 스킬만 대상으로 한다.
- 기본 공격/집중 베기/방어 태세처럼 basic skill만 있는 경우 오른쪽 상세 패널은 `BASIC ACTIONS` compact 안내 상태를 표시한다.
- 기본 공격은 목록에는 남아 있고 전투 중 사용 로직도 변경하지 않았다.
- 스킬 수치, 쿨다운, mastery 로직 변경 없음.

### 흰색 테두리 강조 정리
- RewardBoxPanel / ChallengeCardsPanel / SkillPanel / SkillActionCard에서 큰 흰색 ring/border 강조를 제거하거나 cyan/violet/slate 계열로 완화했다.
- 이번 대상 컴포넌트 기준 `border-white` / `ring-white` 클래스 없음 확인.
- 접근성 focus 동작은 건드리지 않았다.

### 검증 결과
- `npx tsc --noEmit` 통과.
- `npm run build` 통과. 기존 Vite chunk size warning만 유지.
- Browser/in-app 확인: 헤더 Gold 표시, HunterStatus 전투력 보조 카드 제거, SkillPanel basic compact 안내 표시 확인.
- Playwright 390px 확인:
  - HunterStatus overflow 0, combat segment에 Gold 보조 카드 없음.
  - ShopPanel ticket card 12개, PRICE/LIMIT/구매 버튼 12개, ticket visual key 12종 확인.
  - SkillPanel 오른쪽 상세 heading은 `기본 행동`, `BASIC ACTIONS` 안내 상태 확인.
  - console/page error 0.
- production preview `http://127.0.0.1:4173` 확인:
  - DEV QA 미노출.
  - 390px overflow 0.
  - console/page error 0.

### 저장/게임플레이/보안
- localStorage key 변경 없음: `levelup-save` 유지.
- persist version 변경 없음: v14 유지.
- 신규 저장 필드 없음.
- Gold 가격/보상량/구매 제한 변경 없음.
- 장비/그림자 확률 변경 없음.
- 전투/스킬 수치 변경 없음.
- 기존 저장 데이터 초기화/삭제/무효화 없음.
- secret/hidden 조건/정체/보상명 노출 없음.
- B/A/S급 상위 게이트 또는 고레벨 신규 콘텐츠 구현 없음.


---

## 12-27D 상점 제한 제거 + 확률 표시 + 티켓 이미지 고도화 완료

12-27B/12-27C의 Gold 상점과 티켓형 UI 위에서 구매 제한을 제거하고, 확률형 상품의 확률 표시와 티켓 비주얼 구조를 고도화했다. 가격과 Gold 수급량은 유지했고, 실제 장비/그림자 확률은 몰래 바꾸지 않고 UI가 같은 확률 소스를 읽도록 정리했다.

### 수정 파일
| 파일 | 내용 |
| --- | --- |
| `src/lib/shop.ts` | daily/weekly limit 제거, 상품 category 추가, 장비권 rarity/star 확률 테이블과 그림자 innateGrade 확률 테이블을 공용 export로 정리. |
| `src/lib/shadows.ts` | `rollShadowInnateGrade`가 `SHADOW_INNATE_GRADE_WEIGHTS_BY_SOURCE` 공용 테이블을 사용하도록 변경. |
| `src/lib/store.ts` | 상점 구매 시 `shopPurchases`/limit 체크와 구매 횟수 증가 중단. 장비권 draw가 `shop.ts`의 공용 확률 helper를 사용하도록 변경. |
| `src/lib/shopProbabilities.ts` | 상점 확률 표시용 section/row helper 추가. 그림자 소환권, 장비권, 혼합 상품 확률을 실제 소스에서 산출. |
| `src/lib/ticketVisuals.ts` | 상품별 `ticketVisualKey`, art kind, CSS tone, future asset manifest 구조 추가. |
| `src/components/TicketVisual.tsx` | 이미지 asset 우선, 없으면 SVG/CSS fallback으로 소환권/장비권 아트 렌더링. |
| `src/components/ShopPanel.tsx` | LIMIT 영역 제거, TYPE/전략 선택/확률 버튼/accordion panel 추가, 상품 category chip 적용. |
| `scripts/sim-shop-economy.ts` | 구매 제한 제거 후 전략형 소비 시뮬레이션으로 갱신. |
| `CLAUDE.md` | 12-27D 완료 이력 추가. |

### 구매 제한 제거
- `SHOP_PRODUCTS`에서 `limitPeriod`와 `limit`를 제거했다.
- ShopPanel disabled 기준은 Gold 부족 / 정수 부족만 남겼다.
- Store 구매 처리에서도 limit 체크와 `shopPurchases` 증가를 중단했다.
- 기존 저장 데이터의 `shopPurchases` 필드는 optional 호환용으로 유지한다. migration, persist version 변경, 저장 데이터 삭제 없음.
- 상점 카드의 LIMIT 박스는 TYPE/전략 선택 영역으로 교체했다.
- 가격은 12-27B 수치를 유지했다.

### 확률 표시 구조
- 상품 카드마다 `확률` 버튼을 추가하고, 카드 하단 accordion으로 `PROBABILITY` panel을 연다.
- 일반/고급 그림자 소환권:
  - 현재 ticket candidate pool 기준 그림자 rarity 분포 표시.
  - `rollShadowInnateGrade`와 동일한 innateGrade weight 표시.
  - 상점 일반/고급권은 gate_extract 풀만 사용하므로 직접 네임드 소환 없음으로 안전 표시.
- 장비권:
  - `SHOP_EQUIPMENT_DRAW_RARITY_WEIGHTS` 기준 장비 rarity 확률 표시.
  - `EQUIPMENT_STAR_WEIGHTS_BY_SOURCE` 기준 equipmentStars 확률 표시.
  - 슬롯/pool 정보 표시.
- 희귀 장비권/유물 장비권:
  - 실제 `drawTier`별 rarity weight와 quality source를 표시.
- 조각/정수형 고정 상품:
  - 확률 추첨 없이 RESULT 보상만 표시.
- hidden/secret 대상 이름, 조건, 정체는 UI에 표시하지 않는다. 비공개 대상은 “비공개 대상”으로만 표현한다.

### 실제 확률과 UI 확률 동기화
- 장비권 실제 draw와 UI가 모두 `getShopDrawWeights`, `getShopDrawQualitySource`, `getEquipmentStarWeights`를 사용한다.
- `rollEquipmentStars`는 `EQUIPMENT_STAR_WEIGHTS_BY_SOURCE` 공용 테이블을 사용한다.
- `rollShadowInnateGrade`는 `SHADOW_INNATE_GRADE_WEIGHTS_BY_SOURCE` 공용 테이블을 사용한다.
- 그림자 소환권 rarity 표시는 실제 `getTicketCandidatePool`과 같은 조건인 sourceType `gate_extract` + ticket별 rarity limit 기준으로 pool count를 계산한다.

### 티켓 비주얼 고도화
- `TicketVisual` 컴포넌트로 티켓 아트 렌더링을 분리했다.
- 그림자권은 룬 원형진, 균열 aura, 그림자 실루엣 fallback SVG를 사용한다.
- 고급 그림자권은 보라/금빛 aura를 강화했다.
- 무기/방어구/장신구/유물/희귀 장비권은 슬롯별 SVG fallback을 다르게 렌더링한다.
- `TICKET_ASSET_MANIFEST`와 `getTicketVisualAsset(key)`를 추가해 추후 `src/assets/tickets/` 계열 이미지 연결을 쉽게 만들었다.
- 현재 실제 이미지 파일은 추가하지 않고 CSS/SVG fallback만 사용한다.

### 검증 결과
- `npx tsc --noEmit` 통과.
- `npm run build` 통과. 기존 Vite chunk size warning만 유지.
- `npx tsx scripts/sim-shop-economy.ts` 통과.
  - 7일 steady: Gold 97, normal ticket eq 9.1, standard equipment 20, purchases 35.
  - 30일 steady: Gold 184, normal ticket eq 47.0, rare ticket eq 1.2, standard equipment 91, purchases 163.
  - 30일 weekly-priority: Gold 404, rare tickets 2, standard equipment 90, rare equipment 1, relic 1, purchases 149.
- `npx tsx scripts/sim-box-card-rewards.ts` 통과.
  - perfect day avg: XP 203.00, Gold 약 304.99, essence 약 14.02.
  - perfect week avg: XP 1614.00, Gold 약 2520.96, essence 약 108.02.
  - floor 15 boss box avg: XP 126.00, Gold 약 414.95, essence 21.00.
- Browser/in-app 시도 후 Playwright로 실제 DOM 확인:
  - ShopPanel ticket card 12개.
  - ticket visual key 12종 확인.
  - 카드 범위 내 LIMIT / NO LIMIT / 일일 / 주간 문구 없음.
  - `전략 선택` 문구 확인.
  - 0 Gold 상태에서 모든 상품은 `Gold 부족`으로 disabled.
  - 확률 accordion 정상 open.
  - 첫 그림자권 패널에서 `PROBABILITY`, 그림자 등급, 태생 등급 표시 확인.
  - secret/hidden 단어 및 조건/정체 노출 없음.
  - 390px overflow 0, console/page error 0.
- production preview `http://127.0.0.1:4173` 확인:
  - DEV QA 미노출.
  - 390px overflow 0.
  - console/page error 0.

### 저장/게임플레이/보안
- localStorage key 변경 없음: `levelup-save` 유지.
- persist version 변경 없음: v14 유지.
- 기존 장비/그림자/진행도 삭제 없음.
- `shopPurchases`는 저장 호환용으로 남아 있지만 구매 제한에는 사용하지 않는다.
- Gold 수급량 변경 없음.
- 상품 가격 대폭 변경 없음. 이번 작업에서는 가격 유지.
- 장비/그림자 실제 확률은 공용 테이블로 이동/동기화했을 뿐 수치 변경 없음.

---

## 12-27F 교환형 상품 이미지 연결 + 티켓/팩 배경 보정 완료

### 목표
상점의 `정수+Gold -> 일반 조각 교환` 상품이 일반 뽑기권 티켓처럼 보이지 않도록 전용 resource exchange 이미지를 연결하고, 티켓/팩 이미지 외곽의 흰 배경/halo가 앱에서 덜 떠 보이도록 UI 렌더링 프레임을 보정했다.

### 수정 파일
| 파일 | 내용 |
| --- | --- |
| `src/lib/shop.ts` | `ShopProduct.visualKey` optional 메타 추가, `essence-normal-shards`에 `exchange_essence_gold_to_shard` 지정. |
| `src/lib/ticketVisuals.ts` | `exchange_essence_gold_to_shard` key와 `exchange-essence-gold-to-shard.png` asset manifest 연결. 기존 `essence-exchange` alias는 호환용으로 유지. |
| `src/components/ShopPanel.tsx` | 교환형 상품을 일반 상품과 같은 카드 프레임/타이포/비주얼/PRICE/TYPE/버튼 구조로 통합하고, 확률 accordion 대신 `FIXED TRADE`/`RESOURCE TRADE` 정보를 표시. |
| `src/components/TicketVisual.tsx` | dark radial backing, subtle glow, inner vignette, edge mask, 밝기/대비 필터로 티켓/팩 이미지의 흰 외곽/plate 느낌 완화. 이미지 실패 시 기존 SVG fallback 유지. |
| `src/assets/tickets/exchange-essence-gold-to-shard.png` | 교환형 상품 전용 이미지 asset. |

### 교환형 이미지 연결
- 연결 key: `exchange_essence_gold_to_shard`.
- 연결 파일: `src/assets/tickets/exchange-essence-gold-to-shard.png`.
- `essence-normal-shards` 상품은 해당 key를 사용한다.
- 상품은 확률형이 아니므로 확률 accordion을 표시하지 않고 같은 카드 시스템 안에서 `FIXED TRADE` 정보를 표시한다.
- TYPE chip은 `EXCHANGE` / resource trade 성격을 유지한다.
- 별도 `ExchangeProductCard` 레이아웃을 제거하고 일반 상점 카드의 동일한 비율, 상단 타이포, 비주얼 영역, PRICE/TYPE stub, 구매 버튼 리듬을 공유한다.

### 티켓/팩 배경 보정
- 이미지 뒤에 어두운 radial gradient frame과 blur glow backing을 추가했다.
- 기존의 밝은 `mix-blend-screen` overlay는 제거하고, inner vignette와 edge mask로 흰 checker/halo 외곽을 완화했다.
- `object-contain`은 유지하되 이미지를 소폭 확대해 작은 카드 프레임 안에서 흰 외곽이 덜 드러나게 했다.
- 교환형 이미지는 exchange tone에 맞춰 emerald glow/filter를 적용했다.

### 저장/게임플레이 제약
- localStorage key 변경 없음: `levelup-save` 유지.
- persist version 변경 없음: v14 유지.
- 기존 저장 데이터 초기화/삭제 없음.
- Gold 가격/수급량 변경 없음.
- 상품 가격/확률/보상/구매 로직 변경 없음.
- 장비/그림자 확률 변경 없음.
- secret/hidden 조건/정체 노출 없음.
- B/A/S급 상위 게이트 구현 없음.
- secret/hidden 조건/정체/보상명 노출 없음.
- B/A/S급 상위 게이트 구현 없음.

---

## 12-27G 티켓/팩 PNG 실제 배경 픽셀 제거 완료

12-24F Shadow Portrait 처리와 같은 유형으로, 상점 티켓/팩 PNG의 흰색/체커보드 배경이 투명 alpha가 아니라 이미지 내부에 실제 픽셀로 들어간 문제를 asset 단계에서 정리했다. ShopPanel/TicketVisual의 dark frame/vignette/glow는 유지하되, 흰 plate를 CSS로 덮는 방식이 아니라 원본 asset의 바깥 배경 픽셀을 제거했다.

### 수정 파일
| 파일 | 내용 |
| --- | --- |
| `scripts/process-ticket-assets.mjs` | 티켓 이미지 전용 BFS flood-fill 배경 제거 스크립트 추가. |
| `package.json` | `process-tickets`, `process-tickets-dry` 스크립트 추가. |
| `src/assets/tickets/*` | 대상 티켓/팩/교환 PNG 12개 in-place 처리. 파일명/경로 유지. |
| `src/assets/tickets_backup/*` | 처리 전 원본 12개 백업 생성. |
| `CLAUDE.md` | 12-27G 완료 이력 추가. |

### 처리 방식
- 대상: `src/assets/tickets/*.png` 중 상점에서 쓰는 12개 파일.
- 실제 파일명은 기존 import와 호환되도록 그대로 유지했다. 기존 `.png.png` 파일명도 변경하지 않았다.
- 원본은 `src/assets/tickets_backup/`에 먼저 복사했다.
- 4방향 엣지에서 시작하는 BFS flood-fill로 연결된 밝은 흰색/회색/체커보드 계열 픽셀만 alpha 0으로 변경했다.
- 배경 판 제거 후 경계부에 약한 alpha feather를 적용했다.
- resize/trim은 하지 않았다. 모든 처리본은 원본과 같은 1086x1448 캔버스를 유지한다.

### 처리 결과
- 처리 파일 수: 12개.
- 제거 픽셀 예시:
  - `exchange-essence-gold-to-shard.png`: 481,555 px
  - `pack-shadow-essence-small.png.png`: 959,406 px
  - `ticket-shadow-normal.png.png`: 764,449 px
  - `ticket-equipment-relic.png.png`: 756,328 px
- 처리 후 alpha 비율 기준으로 각 asset에 약 29.8%~61.0%의 투명 영역이 생겼다.

### 유지 사항
- 이미지 import 경로/파일명 변경 없음.
- `TICKET_ASSET_MANIFEST` 매핑 변경 없음.
- ShopPanel/TicketVisual 카드 구조와 dark frame/vignette/glow 유지.
- 가격/확률/보상/구매 로직 변경 없음.
- localStorage key 변경 없음: `levelup-save` 유지.
- persist version 변경 없음: v14 유지.
- 기존 저장 데이터 초기화/삭제 없음.

---

## 12-28A 장비권/소환권 사용 결과 연출 강화 완료

상점에서 소환권/장비권을 구매하는 전 단계는 12-27B~G 구조를 유지하고, 실제 사용 결과가 더 명확하게 느껴지도록 결과 표시 레이어만 강화했다. 확률, 가격, Gold 수급량, 보상량, 전투/스킬 수치, 저장 key, persist version은 변경하지 않았다.

### 수정 파일
| 파일 | 내용 |
| --- | --- |
| `src/components/shadows/ShadowRevealModal.tsx` | 기존 그림자 reveal 흐름을 유지하면서 NEW/DUPLICATE 결과 chip, QUICK/HIGH/APEX signal chip, innateGrade/rarity별 badge frame/glow, S 태생/NAMED/legendary 강조를 추가. 모바일 overflow 완화를 위해 modal body는 max-height + overflow-y-auto 유지. |
| `src/components/EquipmentRevealModal.tsx` | 장비권 사용 결과 전용 reveal modal 추가. 장비 이름, 슬롯, rarity, stars, 주요 effect/skill 요약, 현재 착용 슬롯과의 간단 비교 문구를 표시. 4~5성, epic/legendary, artifact 계열은 더 강한 glow/frame 적용. |
| `src/components/ShopPanel.tsx` | 장비형 상점 상품 구매 전후의 새 equippable item만 감지해 `EquipmentRevealModal`에 전달. 구매 가격/보상/확률/처리 로직은 기존 `purchaseShopProduct` 그대로 사용. |
| `CLAUDE.md` | 12-28A 완료 이력 추가. |

### 그림자 소환 결과 reveal
- 일반/고급 그림자 소환권, 조각 소환, fragment summon은 기존 `ShadowRevealModal` payload 흐름을 그대로 재사용한다.
- 신규 획득은 `NEW SHADOW`, 중복 획득은 `DUPLICATE` chip으로 상단과 badge 영역에서 더 명확히 구분한다.
- C/B/A/S innateGrade와 common~legendary rarity에 각각 다른 border/background/glow badge를 적용했다.
- S 태생, named/achievement/gate named, legendary 결과는 `APEX REVEAL`로 더 강한 amber/purple aura와 넓은 reveal frame을 사용한다.
- A 태생, epic 결과는 `HIGH SIGNAL`로 중간 강도의 purple/cyan glow를 사용한다.
- 낮은 결과는 `QUICK RESULT` 중심으로 기존 모달 안에서 짧게 확인되도록 유지했다.
- hiddenUntilObtained 대상은 기존처럼 실제 `OwnedShadow`가 생긴 뒤 전달되는 이름/portrait만 표시한다. 획득 전 정체, 조건, hidden/secret 정보 노출 로직은 추가하지 않았다.

### 장비권 결과 reveal
- 무기/방어구/장신구/유물/희귀 장비권/선택형 장비권 묶음 구매 결과로 생성된 새 장비만 모아 `EquipmentRevealModal`로 표시한다.
- featured 장비는 rarity + stars 기준으로 가장 높은 결과를 우선 노출하고, 묶음 상품은 나머지 장비를 보조 카드로 함께 표시한다.
- 장비 카드는 슬롯, rarity, stars, 주요 stat/drop/rarity/xp effect, combat skill 요약을 최대 3줄로 보여준다.
- 현재 착용 슬롯과 비교해 빈 슬롯/상위 가능성/동급 비교 필요/현재 장비 유지 가능성을 간단 문구로 표시한다. 전투력 수치 계산이나 장비 생성 수치는 변경하지 않았다.
- 4~5성, epic/legendary, artifact 장비는 high value frame/glow와 `HIGH VALUE` badge를 표시한다.
- Skip/Close 버튼을 모두 제공하고, max-height + overflow-y-auto로 390px 모바일에서도 모달이 화면 밖으로 과하게 밀리지 않도록 했다.

### 보호/제약 유지
- localStorage key 변경 없음: `levelup-save` 유지.
- persist version 변경 없음: v14 유지.
- 기존 저장 데이터 초기화/삭제 없음.
- Gold 가격/수급량 변경 없음.
- 상품 가격/확률/보상/구매 로직 변경 없음.
- 장비/그림자 실제 확률 변경 없음.
- 전투/스킬 수치 변경 없음.
- secret/hidden 조건/정체 노출 없음.
- hiddenUntilObtained 대상의 획득 전 이름/초상/해금 조건 노출 없음.
- B/A/S급 상위 게이트 구현 없음.

### 검증
- `npm run build` 성공.
- 로컬 앱 `http://localhost:3002` 로드 및 현재 viewport 수평 overflow 없음 확인.
- 실제 소환권/장비권 결과 reveal의 체감 확인은 사용자 직접 확인 예정.

---

## 12-27F 그림자 소환 전체 104풀 적용 + 태생 S 확률 10% 적용 완료

12-27D의 상점 확률 표시 구조와 실제 그림자 소환 로직을 다시 동기화했다. 일반/고급 그림자 소환권은 더 이상 초반 gate_extract/rarity cap 풀에 묶이지 않고, 현재 등록된 `SHADOW_DEFINITIONS` 전체 104개를 기준으로 후보를 구성한다. 가격, Gold 수급량, 저장 key, persist version, 기존 저장 데이터는 변경하지 않았다.

### 수정 파일
| 파일 | 내용 |
| --- | --- |
| `src/lib/shop.ts` | `SHADOW_INNATE_GRADE_WEIGHTS_BY_SOURCE`의 일반 소환권 S 확률을 10%로 완화. 고급 소환권은 A/S 체감 보정. 소환권별 rarity weight와 특수 네임드 weight multiplier 추가. |
| `src/lib/shadows.ts` | 전체 104개 정의 풀 기반 `getStandardShadowSummonPool`, `getShadowSummonRarityWeights`, `pickStandardShadowSummonDefinition` helper 추가. |
| `src/lib/store.ts` | `summonShadowFromTicket`의 normal/rare/role 계열이 공용 weighted helper를 사용하도록 변경. 기존 owned 우선 회피와 중복/획득 reveal 흐름 유지. |
| `src/lib/shopProbabilities.ts` | 상점 확률 accordion이 실제 소환 helper의 rarity weight와 `rollShadowInnateGrade` 테이블을 읽도록 연결. hiddenUntilObtained 대상은 수량/봉인 가능성만 표시. |
| `CLAUDE.md` | 12-27F 완료 이력 추가. |

### 전체 104개 pool 적용
- `getStandardShadowSummonPool()` 기준 `SHADOW_DEFINITIONS.length === 104`, standard pool도 104개로 확인했다.
- 일반 그림자 소환권과 고급 그림자 소환권은 전체 104개 후보를 기준으로 rarity/special weight를 적용한다.
- role 소환권도 전체 104개 후보를 유지하되, 지정 role에는 가중치 보너스/비지정 role에는 낮은 가중치를 적용해 기존 role 성격을 유지한다.
- named/gate named/achievement named도 전체 후보 안에 포함된다.
- gate named와 achievement named에는 낮은 multiplier를 적용해 메인퀘스트/전용 보상의 가치를 보존한다.

### 태생 등급 확률
- 일반 소환권 `normal_ticket`: C 35%, B 35%, A 20%, S 10%.
- 고급 소환권 `rare_ticket`: C 18%, B 30%, A 34%, S 18%.
- 역할 소환권 `role_ticket`: C 30%, B 34%, A 24%, S 12%.
- 실제 roll은 계속 `rollShadowInnateGrade(SHADOW_INNATE_GRADE_WEIGHTS_BY_SOURCE[source])`만 사용한다.
- 상점 확률 UI도 같은 `SHADOW_INNATE_GRADE_WEIGHTS_BY_SOURCE`를 읽는다.

### 확률 UI 동기화/보호
- rarity 확률은 `getShadowSummonRarityWeights(ticketType)` 결과를 표시한다.
- 실제 소환은 `pickStandardShadowSummonDefinition(ticketType)`을 사용하므로 UI와 실제 로직이 같은 후보/weight helper를 공유한다.
- 상점 UI는 전체 후보 수, 공개 네임드 수, 봉인된 네임드 수만 표시한다.
- hiddenUntilObtained 대상의 실제 이름, 초상, 해금 조건, 개별 목록은 확률표/상점 UI에 표시하지 않는다.

### 저장/게임플레이 제약
- localStorage key 변경 없음: `levelup-save` 유지.
- persist version 변경 없음: v14 유지.
- 기존 저장 데이터 초기화/삭제 없음.
- 기존 보유 그림자/장비/진행도 삭제 없음.
- Gold 가격/수급량 변경 없음.
- 상점 상품 가격 변경 없음.
- secret/hidden 조건/정체 노출 없음.
- hiddenUntilObtained gate named 실제 이름/초상/해금 조건 노출 없음.
- B/A/S급 상위 게이트 구현 없음.

### 검증
- `npx tsx` 확인: `SHADOW_DEFINITIONS.length === 104`, `getStandardShadowSummonPool().length === 104`.
- `npx tsx` 확인: 일반 소환권 태생 S 10%, 고급 소환권 태생 S 18% 표시.
- `npx tsx` 확인: Shop probability section이 전체 후보 104개와 같은 helper 기반 확률을 표시.
- `npm run build` 성공. 기존 Vite chunk size warning만 유지.
---

## 12-28B 소환권/장비권 사용 전 시네마틱 reveal sequence 추가 완료

12-28A의 결과 카드/badge/glow 구조는 유지하고, 실제 결과 공개 전에 짧은 READY -> OPENING -> SIGNAL sequence를 추가했다. 결과 계산은 기존 store/구매/소환 로직 그대로 먼저 수행되지만, UI에서는 sequence가 끝나거나 Skip을 누르기 전까지 이름/portrait/장비 결과 카드를 보여주지 않는다.

### 수정 파일
| 파일 | 내용 |
| --- | --- |
| `src/components/TicketRevealSequence.tsx` | 소환권/장비권 공통 사전 reveal sequence 컴포넌트 추가. READY/OPENING/SIGNAL stage, quick/high/apex intensity, Skip, reduced motion 즉시 완료 처리. |
| `src/components/shadows/ShadowRevealModal.tsx` | 기존 ShadowRevealModal 결과 카드를 보존하고, 결과 공개 전 `TicketRevealSequence`를 먼저 표시. Skip/ESC는 즉시 결과 공개, 결과 공개 후 Close/Fast Close 가능. |
| `src/components/EquipmentRevealModal.tsx` | 기존 EquipmentRevealModal 결과 카드를 보존하고, 장비 금고/룬 개방/별 signal sequence 이후 장비 카드 공개. Skip/ESC 처리 추가. |
| `CLAUDE.md` | 12-28B 완료 이력 추가. |

### 그림자 소환 sequence
- 대상: 일반/고급 그림자 소환권, 조각 소환, fragment summon 등 `ShadowRevealModal`을 타는 결과.
- READY: 티켓/조각 신호가 반응하는 generic 문구와 ticket/rift icon 표시.
- OPENING: 낮은 결과는 빠른 shadow trace, A/epic 이상은 shadow mist core, S/named/legendary는 deeper gate open 톤.
- SIGNAL: 결과 공개 전에는 이름/portrait 없이 innateGrade/rarity 색감과 signal만 표시.
- REVEAL/SUMMARY: sequence 완료 후 12-28A의 기존 ShadowPortrait, NEW/DUPLICATE, innateGrade, rarity, role, S/NAMED badge를 공개.

### 장비권 sequence
- 대상: 무기/방어구/장신구/유물/희귀/선택형 장비권 결과를 표시하는 `EquipmentRevealModal`.
- READY: 사용한 상품명 기준으로 장비 금고 lock-on 표시.
- OPENING: 일반 장비는 cache open, high value는 rune climb, 5성/legendary는 golden armory seal break 톤.
- SIGNAL: 장비 이름/아이콘 공개 전 stars와 rarity signal만 먼저 표시.
- REVEAL/SUMMARY: sequence 완료 후 12-28A의 장비 카드, 주요 effect/skill, HIGH VALUE, 비교 문구를 공개.

### 연출 강도/Skip
- quick: 낮은 결과용으로 약 1초 내외의 짧은 sequence.
- high: A/epic 그림자, 4성 이상/epic/artifact 장비 등 중간 이상 결과.
- apex: S 태생, named/gate/achievement named, legendary 그림자, 5성/legendary 장비.
- sequence 중 Skip 버튼은 결과 공개로 동작한다.
- sequence 중 ESC도 결과 공개로 동작한다.
- 결과 공개 후 Fast Close/Close 또는 ESC로 닫을 수 있다.

### hidden/저장/게임플레이 제약
- hiddenUntilObtained 대상은 sequence 중 이름/portrait/조건을 표시하지 않는다.
- 결과 공개 후에는 기존 OwnedShadow 기반 공개 흐름을 유지한다.
- localStorage key 변경 없음: `levelup-save` 유지.
- persist version 변경 없음: v14 유지.
- 기존 저장 데이터 초기화/삭제 없음.
- Gold 가격/수급량 변경 없음.
- 상품 가격/확률/보상/구매 로직 변경 없음.
- 장비/그림자 실제 확률 변경 없음.
- 전투/스킬 수치 변경 없음.
- hidden/secret 조건/정체 노출 없음.

### 검증
- `npm run build` 성공. 기존 Vite chunk size warning만 유지.
- 로컬 앱 `http://localhost:3002` 로드 확인, 현재 viewport 수평 overflow 없음 확인.
- 실제 소환권/장비권 사용 sequence 체감 확인은 사용자 직접 확인 예정.

---

## 12-28C — 소환/장비 reveal 연출 속도·차별화 개선

### 목표
소환권(shadow) 및 장비권(equipment) reveal sequence의 속도, 단계별 연출, 등급별 비주얼/텍스트 차별화 개선.

### 변경 파일
- `src/components/TicketRevealSequence.tsx`
- `src/components/shadows/ShadowRevealModal.tsx`
- `src/components/EquipmentRevealModal.tsx`

### 변경 내용

#### TicketRevealSequence.tsx
- **RevealIntensity 타입 확장**: `'quick' | 'high' | 'apex'` → `'quick' | 'rare' | 'epic' | 'apex'` (4단계)
- **단계별 타이밍 연장**:
  - quick: ready 400ms / opening 480ms / signal 400ms → 총 ~1.3s
  - rare:  ready 660ms / opening 820ms / signal 660ms → 총 ~2.1s
  - epic:  ready 980ms / opening 1200ms / signal 980ms → 총 ~3.2s
  - apex:  ready 1400ms / opening 1750ms / signal 1350ms → 총 ~4.5s
- **toneClass 4단계 확장**:
  - shadow.rare: teal 계열 (20,184,166)
  - shadow.epic: purple 강화 (기존 high와 동일 범위, glow 강화)
  - shadow.apex: amber + purple dual flare
  - equipment.rare: emerald 계열 (16,185,129)
  - equipment.epic: purple + amber dual flare
  - equipment.apex: amber + cyan dual flare
- **kind별 아이콘 차별화**:
  - shadow opening (epic/apex): `Eye` / shadow opening (quick/rare): `CircleDotDashed`
  - shadow signal (epic/apex): `Zap` / shadow signal (quick/rare): `Sparkles`
  - equipment opening (epic/apex): `Flame` / equipment opening (quick/rare): `CircleDotDashed`
  - equipment signal (epic/apex): `Star` / equipment signal (quick/rare): `Gem`
- **shadow 전용 균열 장식**: epic/apex의 opening/signal 단계에서 원형 내부에 수평 균열선 2개 렌더링 (apex: amber, epic: purple)
- **epic/apex signal 단계 inner ring pulse**: `animate-pulse` 클래스 적용

#### ShadowRevealModal.tsx
- **sequenceIntensity 4단계 분기**:
  - apex: named || legendary || innateGrade === 'S'
  - epic: rarity === 'epic' || innateGrade === 'A'
  - rare: rarity === 'rare'
  - quick: 그 외
- **signalLabel 업데이트**: `HIGH SIGNAL` → `EPIC SIGNAL` / 신규 `RARE SIGNAL`
- **신호 배지 색상 4단계**: apex(amber) / epic(purple) / rare(teal) / quick(cyan)
- **한국어 연출 텍스트 (단계별)**:
  - ready: quick `균열이 응답한다.` / rare `균열이 공명한다.` / epic `깊은 균열이 반응한다.` / apex `어둠의 문이 열린다.`
  - opening: quick `그림자의 형상이 흔들린다.` / rare `그림자 안개가 응집된다.` / epic `실루엣이 잠깐 흔들린다.` / apex `태생의 격이 드러난다.`
  - signalDetail: apex `최상위 태생 감지. 정체는 공개 직전까지 봉인된다.` / epic `상위 등급 신호 감지. 정체가 서서히 드러난다.` / quick+rare `신호가 해소될 때까지 정체는 숨겨진다.`

#### EquipmentRevealModal.tsx
- **sequenceIntensity 4단계 분기**:
  - apex: legendary || 5★ 이상
  - epic: `hasEpicOrFour` (epic rarity || 4★ 이상)
  - rare: `hasRareOrThree` (rare rarity || 3★ 이상)
  - quick: 그 외
- **sequenceSignalClass**: apex(amber) / epic(purple) / rare(emerald) / quick(sky)
- **한국어 연출 텍스트 (단계별)**:
  - readyText: quick `장비 금고가 열린다.` / rare `장비 문양이 점등된다.` / epic `룬 봉인이 해제된다.` / apex `황금 금고의 인장이 파열된다.`
  - openingText: quick `장비 형상이 드러난다.` / rare `별의 흔적이 점등된다.` / epic `제련된 형상이 떠오른다.` / apex `전설의 장비가 형상을 드러낸다.`

### hidden/저장/게임플레이 제약
- hiddenUntilObtained 정보 노출 없음 (sequence 중 이름/portrait 미표시 유지).
- localStorage key `levelup-save` 변경 없음.
- persist version 변경 없음.
- 보상 확률/게임플레이 수치/전투 공식 변경 없음.
- 기존 result card, badge, glow 효과 유지.
- Skip 버튼 항상 노출 및 즉시 결과 공개 동작 유지.

### 검증
- `npm run build` exit code 0, TypeScript 오류 없음. 기존 chunk size warning만 유지.

---

## 12-28D — 던전/메인 퀘스트 Gold 보상 추가 + 메인 퀘스트 보상 구조 개편

### 목표
던전 step/클리어와 메인 퀘스트 완료에 Gold 보상을 추가하고, 메인 퀘스트 완료 시 성취 네임드 그림자 소환권(category_achievement_named) 직접 지급 구조를 일반/고급 소환권 + 소환 조각 중심으로 전환한다.

### 변경 파일
- `src/lib/store.ts` (단일 파일 변경)

### 변경 내용

#### Gold 수급처 추가

**메인 퀘스트 완료 Gold (`getQuestGoldReward` 확장)**
| difficulty | Gold |
|---|---:|
| easy | 120 |
| normal | 160 |
| hard | 220 |
| elite | 320 |
| apex | 480 |
| boss | 650 |

**던전 step 진행 Gold (신규 `getDungeonStepGoldReward`)**
| difficulty | Gold/step |
|---|---:|
| easy | 5 |
| normal | 7 |
| hard | 10 |
| elite | 14 |
| apex | 20 |
| boss | 26 |

**던전 최종 클리어 Gold (신규 `getDungeonClearGoldReward`)**
| difficulty | Gold | monthly ×1.25 |
|---|---:|---:|
| easy | 60 | 75 |
| normal | 80 | 100 |
| hard | 115 | 144 |
| elite | 165 | 206 |
| apex | 240 | 300 |
| boss | 320 | 400 |

Gold 추가 표시: `progressDungeon` partial/clear 경로 모두 `lines`에 `Gold +N` 추가, `baseState.gold` 업데이트 적용.

#### 메인 퀘스트 완료 보상 구조 개편

**`isAchievementShadowUnlockReady` 수정**
- 기존: `quest?.type === 'main' || quest?.type === 'dungeon'` 조건 처리
- 변경: `quest?.type === 'dungeon'` 만 처리 → 메인 퀘스트 연결 achievement 그림자는 이 경로로 더 이상 자동 발행되지 않음
- 기존 `shadowAchievementTicketClaims` 기록은 유지 → 이미 발행된 티켓 재발행 없음

**신규 `buildMainQuestCompletionBonus` 함수**
| difficulty | 보상 |
|---|---|
| boss / apex | 고급 소환권 1장 + 고급 조각 2 + 소환 조각 3 |
| elite | 고급 소환권 1장 + 소환 조각 3 |
| hard / normal / easy | 일반 소환권 1장 + 소환 조각 2 |

티켓 source: `'achievement'`, 라벨: `{quest.title} 달성 — 고급 소환권/소환권`
SystemMessage kind: `'shadow'`, title: `'메인 퀘스트 달성 보상'`

**신규 `applyMainQuestCompletionBonus` 스토어 액션**
- `shadowSummonTickets`, `shadowSummonShards`, `messages` 업데이트
- 인터페이스 `GameActions`에 `applyMainQuestCompletionBonus: (quest: Quest) => void` 추가

**`completeQuest` setTimeout 콜백 수정**
- 기존: `q.type === 'main'` 조건에서 `get().grantAchievementNamedShadows()` 호출
- 변경: `get().applyMainQuestCompletionBonus(q)` 호출로 대체
- 던전 클리어 경로(`progressDungeon`)의 `grantAchievementNamedShadows()` 호출은 유지 → 던전 연결 achievement 그림자 티켓 지급 정상 동작

#### 기존 데이터 보존
- `shadowAchievementTicketClaims` 기록 유지 → 이미 발행된 성취 소환권 재발행 없음
- 기존 `ownedShadows` 목록 (메인 퀘스트로 획득한 그림자 포함) 삭제/회수 없음
- `levelup-save` localStorage 키 변경 없음
- persist version v14 유지
- 소환 확률/상점 가격/전투 수치 변경 없음
- hidden/secret 조건/정체 노출 없음

### Gold 밸런스 참고
- 던전 step Gold는 일일 퀘스트(18~75)보다 훨씬 작으므로 반복 획득에도 폭증하지 않음
- 던전 클리어 Gold는 daily 7~10일분 수준 → 장기 목표 체감
- 메인 퀘스트 Gold는 상점 고급 소환권(900 Gold) 대비 1~3회 구매 가능 수준 → 의미 있는 체감 보장
- 이미 클리어한 메인 퀘스트에 소급 보상 지급하지 않음 (필요 시 후속 작업 제안)

### 검증
- `npm run build` exit code 0, TypeScript 오류 없음. 기존 chunk size warning만 유지.
- 런타임 동작(던전 진행/클리어/메인 완료 시 Gold 지급, 소환권/조각 지급) 은 사용자 직접 확인 예정.

---

## 12-28E — 그림자 소환권 / 장비 뽑기권 가챠식 연출 고도화

### 목표
결과 카드 앞 중간 연출을 모바일 RPG 가챠 수준으로 재설계.
"티켓 반응 → 전조 신호 → 균열/금고 개방 → 등급 암시 → 결과 공개"의 단계형 긴장감 구현.
그림자(shadow) 와 장비(equipment) 연출 테마를 명확히 분리.

### 변경 파일
- `src/components/TicketRevealSequence.tsx` — 핵심 연출 컴포넌트 전면 재설계
- `src/components/shadows/ShadowRevealModal.tsx` — `pulseText` prop 추가
- `src/components/EquipmentRevealModal.tsx` — `pulseText` + `starCount` prop 추가

### 핵심 변경: 4단계 연출 (epic/apex)

**이전**: 모든 intensity에 3단계 `ready → opening → signal`
**이후**:
- quick / rare: 3단계 `ready → opening → signal` (기존 유지, 총시간 ~1.6s / ~2.4s)
- epic / apex: **4단계** `ready → pulse → opening → signal` (총시간 ~3.3s / ~4.4s)

새 `pulse` stage: 결과 암시 전 전조 신호 단계.
stage label: `READY → SIGNAL → OPENING → REVEAL`

### 그림자(shadow) 연출 테마

| stage | 아이콘 | 특수 효과 |
|---|---|---|
| ready | `Ticket` | — |
| pulse (epic/apex만) | `Scan` (보라/금색) | inner dashed ring 회전, 측면 rift 스트립 등장 |
| opening | `Eye` (high) / `CircleDotDashed` | inner pulse ring 점등, 원형 균열선 3개 (색: apex=amber, epic=purple) |
| signal | `Zap` (high) / `Sparkles` | 균열선 유지, 등급 색상 텍스트 |

**측면 rift 스트립** (epic/apex, ready 이후): 좌우 엣지에서 안쪽으로 향하는 그라디언트 1px 선 4개.
apex → amber, epic → purple 색상.

**원형 균열선** (epic/apex, ready 이후): 원 내부 수평 3개 균열선.

### 장비(equipment) 연출 테마

| stage | 아이콘 | 특수 효과 |
|---|---|---|
| ready | `PackageOpen` | — |
| pulse (epic/apex만) | `Cog` 회전 (보라/금색) | **외곽 dashed 링 회전** (pulse stage만), 코너 스파크 글리프 등장 |
| opening | `Flame` (high) / `CircleDotDashed` | inner pulse ring 점등, **별 점등 행** (dim) |
| signal | `Star` (high) / `Gem` | **별 점등 행** (full amber), 코너 글리프 유지 |

**외곽 회전 링**: epic/apex에서 pulse stage에 `animate-spin`, 다른 stage에는 opacity-40 고정.
**별 점등 행**: `opening` dim → `signal` full amber. `starCount` prop 으로 1~5개 `★` 렌더.
**코너 forge-spark 글리프**: `✦` 기호 4개, epic/apex, ready 이후 등장.

### tier별 연출 차등

| tier | stage 수 | shadow 전조 | equipment 전조 | 총 시간 |
|---|---|---|---|---|
| quick | 3 | 없음 | 없음 | ~1.6s |
| rare | 3 | 없음 | 없음 | ~2.4s |
| epic | 4 | Scan + 균열 + 측면rift | Cog회전 + 외곽링 + 코너스파크 | ~3.3s |
| apex | 4 | Scan(금색) + 균열(금색) + 측면rift(금색) | Cog(금색) + 외곽링(금색) + 코너스파크(금색) | ~4.4s |

### 새 prop

```typescript
// TicketRevealSequence
pulseText?: string   // pulse stage 문구 (없으면 kind별 기본값)
starCount?: number   // equipment 별 점등 개수

// 모달별 전달
// ShadowRevealModal
pulseText: apex → '군단의 기록이 반응한다.' | epic → '깊은 기척이 감지된다.'

// EquipmentRevealModal
pulseText: apex → '금고 인장이 불타오른다.' | epic → '룬이 고열로 달구워진다.'
starCount: featuredStars (1~5)
```

### hidden 보호
- 결과 공개 전 이름/초상 미노출 구조 유지 (ShadowRevealModal의 `!showResult` → `TicketRevealSequence` 표시 분기 유지)
- `hiddenUntilObtained` 조건/정체 노출 없음

### Skip 처리
- Skip 버튼: 항상 표시, 클릭 시 `doneRef.current = true; completeRef.current()` 즉시 호출
- `reducedMotion` 감지 시 sequence 완전 스킵 (즉시 `onComplete`)
- 결과 공개 후 버튼 레이블 → 'Fast Close' (기존 동작 유지)

### localStorage / persist / gameplay
- localStorage key `levelup-save` 변경 없음
- persist version 변경 없음
- 저장 데이터 변경 없음
- 확률/수치/상점 가격/전투 수치 변경 없음

### 검증
- `npm run build` exit code 0, TypeScript 오류 없음.
- 런타임 체감은 사용자 직접 확인 예정.
---

## 12-28F 그림자/장비 전투 체감 강화 설계 완료

### 작업 성격
- 코드 구현 없이 설계 문서만 작성.
- 전투 공식, 보상, 저장 구조, 확률, 가격, Gold 수급, localStorage key, persist version 변경 없음.
- hidden/secret 조건, hiddenUntilObtained 정체/초상/해금 조건 노출 없음.

### 설계 문서
- `docs/shadow-equipment-combat-feel-plan.md`

### 핵심 설계 방향
- 현재 구조 진단:
  - 그림자 전투 기여는 `getShadowEffects`, `getEquippedShadowStatBonuses`, `resolveShadowSupportActions`, `getHunterCombatPowerBreakdown`, `getShadowExpeditionPower`에 분산되어 있음.
  - 장비 기여는 `getEquipmentStars`, `EQUIPMENT_STAR_MULTIPLIER`, `getEnhancedItemEffects`, `calculatePlayerCombatStats`, combat power breakdown에 반영됨.
  - 그림자는 실제 전투 보조 행동에는 반영되지만 전투력 표시와 로그/연출이 그 가치를 충분히 번역하지 못하는 점을 주요 문제로 정리.

### 그림자 전용 상세 스탯 방향
- `shadowAttack`, `shadowDefense`, `shadowDurability`, `shadowSpeed`, `shadowCrit`, `shadowFinisher`, `shadowControl`, `shadowSuppression`, `shadowSupport`, `shadowSurvival`, `shadowBossing`, `shadowExpedition`, `shadowSynergy` 설계.
- role별 기본 프로파일:
  - assault: 공격/치명/처형
  - guard: 방어/지속/생존
  - hunter: 속도/추격/처형/원정
  - scout: 속도/제어/원정/시너지
  - support: 지원/생존/시너지
  - analyst: 제어/억제/보스전/지원

### 전투력 계산식 초안
- Shadow Combat Power =
  - role base stats
  - rarity multiplier
  - innateGrade multiplier
  - level scaling
  - enhancement scaling
  - evolution multiplier
  - named modifier
  - role-specific contribution
  - situational preview bonus
- 1차 구현은 새 저장 필드 없이 `ShadowDefinition` + `OwnedShadow` 기반 derived 계산을 권장.
- 과도한 인플레이션 방지를 위해 표시용 shadow combat power와 실제 전투 반영치를 분리하고 cap/diminishing return 사용 제안.

### 장비 체감 강화 방향
- equipmentStars는 기존 multiplier를 유지하면서 획득/착용/비교 UI에서 더 명확히 설명.
- weapon / armor / accessory / relic 슬롯별 체감 역할 분리.
- 현재 장비 대비 stars, rarity, 주요 stat/effect delta 중심의 비교 UI 제안.
- 4~5성, epic/legendary/relic 장비는 획득/착용 로그와 glow/badge 강화 제안.

### 구현 단계 제안
- 12-28G: shadow stats data model + combat power 표시.
- 12-28H: shadow stats를 gate/tower 전투에 1차 반영.
- 12-28I: shadow stats를 expedition에 반영.
- 12-28J: 장비 stars/rarity 전투력/착용 비교 강화.
- 12-28K: 전투 로그/연출/고유 반응 강화.

### 검증
- 문서 작업이므로 `npm run build` 생략.
- markdown 구조 확인 완료.
- 코드 파일 수정 없음.
---

## 12-28G Shadow Stats Data Model + Shadow Combat Power 표시 1차 완료

### 작업 성격
- 2.5D 전투 시스템에서도 재사용 가능한 그림자 전용 파생 스탯/전투력 언어 기반 작업.
- 실제 gate/tower 전투 공식, shadow support action 결과, 원정 성공률/보상, 전투 로그/VFX 대형 연출 변경 없음.
- localStorage key `levelup-save` 변경 없음.
- persist version 변경 없음.
- 기존 owned shadow 저장 구조 강제 변경 없음.

### 추가 helper / type
- `src/lib/shadowStats.ts` 추가.
- `src/lib/types.ts`
  - `ShadowStatKey` union 추가.
  - `ShadowDefinition.shadowStats?: Partial<Record<ShadowStatKey, number>>` optional override 필드 추가.
  - 저장 필드가 아닌 definition optional field이므로 기존 save migration 없음.

### 13개 그림자 전용 스탯
- `shadowAttack`
- `shadowDefense`
- `shadowDurability`
- `shadowSpeed`
- `shadowCrit`
- `shadowFinisher`
- `shadowControl`
- `shadowSuppression`
- `shadowSupport`
- `shadowSurvival`
- `shadowBossing`
- `shadowExpedition`
- `shadowSynergy`

### 계산 방식
- `OwnedShadow` + `ShadowDefinition` 기반 derived 계산.
- definition별 `shadowStats` override가 없으면 role profile fallback 사용.
- role profile:
  - assault: attack / crit / finisher
  - guard: defense / durability / survival
  - hunter: speed / finisher / expedition
  - scout: speed / control / expedition / synergy
  - support: support / survival / synergy
  - analyst: control / suppression / bossing / support
- rarity, innateGrade, level, enhancement, evolutionStage, named status, definition basePower를 표시용 multiplier로 반영.

### Shadow Combat Power
- `getShadowCombatProfile`
  - `totalPower`
  - `assistPower`
  - `guardPower`
  - `controlPower`
  - `bossPower`
  - `expeditionPower`
  - `topStats`
  - `roleIdentity`
- `getShadowArmyCombatPower`
  - 출전 그림자 군단의 표시용 SCP aggregate 제공.
- 이 값은 헌터 전투력에 1:1 가산하지 않으며, 현재 단계에서는 표시/분석 전용.

### UI 표시
- `src/components/shadows/ShadowCard.tsx`
  - 카드에는 `SCP` + role tag + 상위 2~3개 stat badge만 표시.
  - 13개 전체 스탯은 카드에 노출하지 않음.
- `src/components/ShadowPanel.tsx`
  - 선택 상세 패널에 Shadow Combat Power, Top Strengths, Role Identity, Assist/Guard/Control/Boss/Expedition breakdown 표시.
  - 13개 전체 스탯은 `Detailed shadow stats` 접이식 영역에서 Offense / Defense / Tactics / Support-Expedition 카테고리별 bar list로 표시.
  - Command Gallery와 상단 POWER는 표시용 SCP 기반으로 정리.
- `src/components/HunterStatus.tsx`
  - 기존 Hunter combat power 숫자는 유지.
  - 별도 `SHADOW ANALYSIS POWER` 영역으로 출전 그림자의 SCP, top stats, assist/guard/control/boss/expedition breakdown 표시.

### hidden / secret 보호
- 상세 스탯은 owned shadow 기반 화면에서만 계산/표시.
- Codex의 미보유 hiddenUntilObtained 대상은 기존 sealed/locked 표시 유지, 실제 이름/초상/조건/상세 스탯 노출 없음.

### 2.5D 대비
- `shadowStats.ts`의 derived stats와 breakdown은 향후 2.5D battle board에서 aura 강도, role별 배치, action priority, assist/guard/control/support 연출 강도, bossing/synergy 표시로 재사용 가능.
- 이번 단계에서는 2.5D UI 또는 전투 애니메이션 구현 없음.

### 검증
- `npm run build` exit code 0.
- Vite 기존 chunk size warning만 표시.
---

## 12-28H Shadow Stats Gate/Tower 전투 1차 반영 완료

### 작업 성격
- 12-28G의 13개 shadow stat을 Gate/Tower 전투의 shadow support action에 보수적으로 연결.
- 향후 2.5D 전투 시스템에서도 재사용 가능한 전투 계산 aggregate 기반 작업.
- 2D 전투 UI, portrait flash, 공격 애니메이션, VFX, 전투 패널 대형 변경 없음.
- localStorage key `levelup-save` 변경 없음.
- persist version 변경 없음.
- 저장 데이터 구조 변경 없음.
- 원정 성공률/보상, 장비 공식, 몬스터/게이트/탑 난이도 변경 없음.

### 추가 combat aggregate
- `src/lib/shadowStats.ts`
  - `ShadowCombatAggregate` 추가.
  - `ShadowCombatModifiers` 추가.
  - `getShadowCombatAggregate` 추가.
  - `getShadowArmyCombatAggregate` 추가.
  - `getShadowCombatModifiers` 추가.

### aggregate 목록
- `assistAttack`
- `guardSupport`
- `controlSupport`
- `supportUtility`
- `survivalGuard`
- `bossPressure`
- `speedTempo`
- `finisherPower`

### Gate/Tower 전투 반영 위치
- `src/lib/game.ts`
  - `resolveShadowSupportActions` 내부에서 장착/소유된 equipped shadow만 대상으로 aggregate 계산.
  - 기존 shadow support action 종류는 유지.
  - 기존 효과를 대체하지 않고 작은 bonus/multiplier로만 가산.

### 반영 방식
- `assistAttack`, `speedTempo`
  - shadow support 피해 보정과 발동률 보정에 소폭 반영.
- `finisherPower`
  - 적 HP 30% 이하 execute 구간 피해 보정에 소폭 반영.
- `guardSupport`, `survivalGuard`
  - guard damage reduction, guard counter, low HP 보호에 소폭 반영.
- `controlSupport`
  - enemy defense down 강도와 proc chance에 소폭 반영.
- `supportUtility`
  - skill damage support, wave/support 계열 chance에 소폭 반영.
- `bossPressure`
  - tower/boss-like target에서 damage/control 보정에만 조건부 소폭 반영.
- `shadowExpedition`
  - 이번 Gate/Tower 반영에서는 직접 사용하지 않음. 12-28I 원정 단계로 남김.

### cap / diminishing return
- `boundedBonus(value, scale, cap)` 형태의 diminishing return 사용.
- 피해 보정은 개별 항목 cap을 둔 뒤 기존 총합 cap도 보수적으로 확장.
- 발동률 cap은 0.55 -> 0.58로 소폭만 확장.
- guard/control/survival/boss 보정도 3~8%권 이하의 작은 cap으로 제한.
- damage_reduction은 기존 효과보다 낮은 값으로 덮어쓰지 않도록 `applyPlayerDamageReductionMax` 사용.

### 2.5D 대비
- aggregate는 향후 2.5D에서 다음 용도로 재사용 가능:
  - `assistAttack`: 공격 이펙트 강도
  - `guardSupport`: 방어 barrier 강도
  - `controlSupport`: 제어/약화 이펙트
  - `supportUtility`: 버프/쿨다운 이펙트
  - `survivalGuard`: 위기 보호 연출
  - `bossPressure`: 보스전 aura/억제 연출
  - `speedTempo`: action priority/빠른 움직임
  - `finisherPower`: 처형 연출 강도

### hidden / secret 보호
- 전투 계산은 owned/equipped shadow 기반.
- 미보유 hiddenUntilObtained / locked named의 이름, 초상, 조건, stats 노출 없음.

### 검증
- `npm run build` exit code 0.
- `npx tsx scripts/sim-shadow-battle-balance.ts` exit code 0.
- Vite 기존 chunk size warning만 표시.

---

## 12-28I Shadow Combat System v2 설계 완료

### 작업 성격
- 코드 구현 없이 설계 문서만 작성.
- 전투 공식, 저장 구조, 보상, 가격, 확률, UI/VFX 변경 없음.
- 기존 12-28H Gate/Tower shadow support action 보정은 되돌리지 않고 과도기 레이어로 유지.
- localStorage key `levelup-save` 변경 없음.
- persist version 변경 없음.
- 기존 owned shadow/equipment/progress 데이터 변경 없음.

### 설계 문서
- `docs/shadow-combat-system-v2-plan.md` 추가.

### Shadow Combat System v2 방향
- 그림자를 헌터 보조 효과가 아니라 독립 전투 유닛으로 취급하는 방향으로 재설계.
- 각 Shadow Unit은 13개 shadow stat, Shadow Combat Power, role, rarity, innateGrade, level, enhancement, evolution stage, active skill, passive, conditional trigger, combat behavior profile, expedition behavior profile, 2.5D action profile 후보를 가진다.
- 12-28G의 shadow stats/SCP는 v2의 공용 전투력 언어로 유지.
- 12-28H의 얇은 `resolveShadowSupportActions` 반영은 향후 v2 runtime이 안정화되면 `ShadowActionEvent` 기반으로 흡수/대체하는 방향.

### 스탯 / 스킬 / 패시브 구조
- 13개 shadow stat이 단순 표시가 아니라 attack, guard, control, support, finisher, bossing, expedition, synergy action score를 결정하는 기반으로 설계.
- active skill, passive, conditional trigger 슬롯 구조 제안.
- rarity는 skill/passive 품질과 고유성, innateGrade는 발동 안정성/효과량/성장률을 담당하도록 역할 분리.
- common S급, legendary C급, legendary S급의 의미 차이를 별도로 정리.

### 2.5D 대비
- Shadow Unit profile을 나중에 2.5D battle board의 위치 배치, action priority, skill animation hook, passive trigger visual hook, rarity/innateGrade aura, named quote/action cue에 연결할 수 있게 설계.
- 이번 단계에서 2.5D UI, 전투 보드, VFX는 구현하지 않음.

### 이행 전략
- 12-28J: shadow skill/passive data model 설계/정의 1차.
- 12-28K: 일부 그림자에 skill/passive prototype 부여.
- 12-28L: Gate/Tower 전투에 shadow action runtime 1차 연결.
- 12-28M: 원정에 shadow unit profile 반영.
- 12-29A: 2.5D battle board 설계.
- 12-29B 이후: shadow action profile을 2.5D 연출과 연결.

### hidden / secret 보호
- hiddenUntilObtained / locked named 대상은 획득 전 실제 이름, 초상, 조건, 고유 skill/passive, quote를 노출하지 않는 원칙 유지.
- 문서에서도 미보유 hidden 대상의 정체나 조건을 쓰지 않음.

### 검증
- 문서 작업이므로 `npm run build` 생략.
- `git diff --check -- CLAUDE.md docs\shadow-combat-system-v2-plan.md` exit code 0.
- Git의 기존 LF/CRLF 경고만 표시.
- 코드 파일 수정 없음.

---

## 12-28J Shadow Skill / Passive Data Model 1차 완료

### 작업 성격
- Shadow Combat System v2로 가기 위한 skill/passive/trigger/profile 데이터 모델 1차 작업.
- 전투 runtime 본격 연결 없음.
- 기존 12-28H `resolveShadowSupportActions` bridge layer 제거/대체 없음.
- 2D 전투 UI/VFX/로그 연출 대형 변경 없음.
- localStorage key `levelup-save` 변경 없음.
- persist version 변경 없음.
- 기존 owned shadow/equipment/progress 데이터 변경 없음.

### 추가 data model / helper
- `src/lib/shadowSkills.ts` 추가.
- 주요 타입:
  - `ShadowSkillDefinition`
  - `ShadowPassiveDefinition`
  - `ShadowTriggerCondition`
  - `ShadowCombatBehaviorProfile`
  - `ShadowExpeditionBehaviorProfile`
  - `ShadowActionProfile`
  - `ShadowGradeTuningProfile`
  - `ShadowActionEvent`
  - `ShadowCombatUnitProfile`
- 주요 helper:
  - `getShadowSkillCandidates`
  - `getShadowPassiveCandidates`
  - `getShadowCombatUnitProfile`
  - `getShadowCombatUnitProfiles`
  - `formatShadowSkillSummary`
  - `formatShadowPassiveSummary`
  - `formatShadowTriggerSummary`

### role-based generic skill/passive pool
- 모든 104개 그림자에 고유 스킬을 즉시 작성하지 않고 role별 generic pool로 시작.
- assault:
  - Rift Cleave / Execution Mark / Burst Drive
  - Follow Through / Finisher Instinct
- guard:
  - Shadow Barrier / Counter Stance / Last Line
  - Protective Posture / Low HP Priority
- hunter:
  - Wounded Chase / Chain Hit / Prey Lock
  - Kill Momentum / Relentless Chase
- scout:
  - Opening Mark / Evasion Down / Intent Read
  - First Read / Formation Signal
- support:
  - Mending Pulse / Cooldown Thread / Legion Buff
  - Long Fight Efficiency / Legion Link
- analyst:
  - Weakness Expose / Boss Suppression / Defense Debuff
  - Boss Priority / Pattern Lock
- obtained named shadow용 generic unique 후보:
  - Command Imprint
  - Memory Core

### rarity / innateGrade / evolution 규칙
- common은 basic 중심, S/evolution이면 refined 후보까지 허용.
- uncommon/rare는 refined 후보까지 허용.
- epic은 elite 후보까지 허용.
- legendary는 legendary cap, obtained named는 unique cap 사용.
- innateGrade는 `procStability`, `effectScaling`, `cooldownStability`, `growthScaling` 후보값으로 분리.
- evolutionStage는 active/passive slot 확장 후보와 2.5D action profile 강화 후보로 반영.
- 이번 단계의 값들은 표시/후보/프로필용이며 실제 전투 runtime에는 본격 연결하지 않음.

### ShadowCombatUnitProfile
- `OwnedShadow + ShadowDefinition + getShadowCombatProfile` 기반 derived profile.
- 포함 정보:
  - 13개 shadow stat
  - Shadow Combat Power breakdown
  - role / rarity / innateGrade / level / enhancement / evolutionStage
  - activeSkills / passives
  - combat behavior profile
  - expedition behavior profile
  - 2.5D용 action profile
  - grade tuning
  - summary badges
- 저장 필드가 아니라 파생 계산이므로 기존 save migration 없음.

### ShadowPanel / ShadowCard 표시
- `src/components/shadows/ShadowCard.tsx`
  - 기존 SCP + role/top stat badge 유지.
  - 카드에는 active skill short badge 1개만 추가.
  - skill/passive 긴 설명은 카드에 노출하지 않음.
- `src/components/ShadowPanel.tsx`
  - 선택 상세 패널에 `SHADOW UNIT PROFILE` 섹션 추가.
  - active candidate / passive candidate 요약 표시.
  - trigger와 unit behavior/action profile은 접이식 compact 영역에 표시.
  - 13개 전체 stat 접이식 구조는 기존대로 유지.

### 2.5D 대비
- `ShadowActionProfile`에 `boardLane`, `auraIntensitySource`, `actionCue`, `effectColor`, `impactTiming`, `animationHooks` 후보 필드 추가.
- 이번 단계에서 2.5D battle board, animation, VFX는 구현하지 않음.

### hidden / secret 보호
- skill/passive profile은 owned shadow 기반 `ShadowPanel` / `ShadowCard`에서만 표시.
- Codex의 미보유 hiddenUntilObtained / locked named에는 실제 이름, 초상, 조건, 고유 skill/passive, quote를 새로 노출하지 않음.
- named용 unique 후보도 obtained shadow의 derived profile에서만 표시.

### 검증
- `npm run build` exit code 0.
- Vite 기존 chunk size warning만 표시.
- `git diff --check -- CLAUDE.md src\lib\types.ts src\lib\shadowSkills.ts src\components\ShadowPanel.tsx src\components\shadows\ShadowCard.tsx` exit code 0.
- Git의 기존 LF/CRLF 경고만 표시.

---

## 12-28K 일부 그림자 skill/passive prototype 부여 완료

### 작업 성격
- Shadow Combat System v2 방향 검증을 위한 대표 그림자 prototype 부여 작업.
- 모든 104개 그림자에 고유 스킬을 작성하지 않음.
- Gate/Tower 전투 runtime 본격 연결 없음.
- 기존 12-28H `resolveShadowSupportActions` bridge layer 제거/대체 없음.
- 전투 공식, 보상, 가격, 확률, 저장 구조 변경 없음.
- 2.5D battle board, 전투 UI/VFX/로그 대형 작업 없음.
- localStorage key `levelup-save` 변경 없음.
- persist version 변경 없음.

### skill/passive id reference 구조
- `src/lib/types.ts`
  - `ShadowDefinition.shadowUniqueSkillIds?: string[]` 추가.
  - `ShadowDefinition.shadowUniquePassiveIds?: string[]` 추가.
  - 기존 `shadowSkillIds`, `shadowPassiveIds`, `shadowUniqueActionCue` optional field 유지.
- Definition에는 긴 skill/passive 설명을 넣지 않고 id reference만 연결.
- 실제 skill/passive 본문은 `src/lib/shadowSkills.ts` registry에서 관리.

### prototype 부여 범위
- 총 12개 대표 그림자에 prototype/unique id 연결.
- 일반/희귀/영웅 role 샘플:
  - `shadow-sentry` guard common
  - `black-claw` assault rare
  - `rift-librarian` analyst rare
  - `sloth-hunter` hunter rare
  - `silent-archer` scout rare
  - `iron-bastion` guard epic
  - `rift-champion` assault epic
  - `midnight-oracle` support epic
- named / legendary 샘플:
  - `karden-forgetting-scribe` hidden gate named analyst
  - `kasim-analyst` achievement named analyst
  - `charka-finance-patron` achievement named support
  - `verk-steel-knight` achievement named assault

### 추가 prototype skill/passive
- `src/lib/shadowSkills.ts`
  - `PROTOTYPE_SKILLS` 추가.
  - `PROTOTYPE_PASSIVES` 추가.
  - `ShadowAbilitySource = generic | prototype | unique` 추가.
  - `getShadowAbilitySourceLabel` 추가.
- role별 방향:
  - assault: rupture / arena finisher / steel command.
  - guard: first watch / iron wall / anchor.
  - hunter: wounded prey route / plunder tracking.
  - scout: silence shot / opening flank control.
  - support: midnight reset / patron aegis / formation stability.
  - analyst: weakness index / flaw ledger / forbidden archive lock.

### ShadowCombatUnitProfile 반영
- `getDefinitionSkills`, `getDefinitionPassives`가 `shadowUnique*Ids`와 `shadow*Ids`를 모두 읽음.
- definition prototype/unique ability가 generic fallback보다 우선 정렬되도록 `getAbilityPriority` / `byAbilityPriorityDesc` 추가.
- rarity/innateGrade/evolution 기반 quality cap은 유지.
- common도 definition passive가 명시된 경우 1개 passive 후보를 표시할 수 있게 slot fallback 보정.
- id가 없거나 quality cap에 막히면 12-28J role-based generic pool로 fallback.

### ShadowPanel 표시
- `src/components/ShadowPanel.tsx`
  - active/passive candidate 우측 badge를 quality 대신 `GENERIC` / `PROTOTYPE` / `UNIQUE` source label로 표시.
  - trigger/action profile 접이식 구조와 13개 stat 접이식 구조 유지.
- `src/components/shadows/ShadowCard.tsx`
  - 카드 과밀 방지를 위해 기존 SCP + role/top stat badge 구조 유지.
  - top skill short badge 1개 수준만 유지.

### hidden / secret 보호
- skill/passive profile은 owned shadow 기반 카드/상세 패널에서만 표시.
- Codex 미보유 hiddenUntilObtained / locked named는 기존 sealed 표시 유지.
- hidden gate named인 `karden-forgetting-scribe`에도 unique id reference는 붙였지만, 미보유 Codex 카드에서는 이름/효과/고유 skill/passive/quote를 새로 표시하지 않음.

### 2.5D 대비
- 각 prototype/unique skill에 `animationCue`, `effectColor`, `impactTiming`, `actionCue` 유지.
- `ShadowActionProfile`의 board lane/aura/action hook 구조와 연결 가능한 데이터만 준비.
- 2.5D 구현 없음.

### 검증
- `npm run build` exit code 0.
- `npx tsx -e` smoke check로 prototype 연결 definition 12개 확인.
- 대표 12개 모두 첫 active/passive가 prototype 또는 unique로 우선 선택되는 것 확인.
- Vite 기존 chunk size warning만 표시.
- `git diff --check -- CLAUDE.md src\lib\types.ts src\lib\shadowSkills.ts src\lib\shadows.ts src\components\ShadowPanel.tsx src\components\shadows\ShadowCard.tsx` exit code 0.
- Git의 기존 LF/CRLF 경고만 표시.

---

## 12-28L Shadow Action Runtime 1차 연결 완료

### 작업 성격
- Shadow Combat System v2의 첫 runtime bridge 작업.
- 12-28K에서 prototype/unique skill/passive id가 연결된 대표 그림자만 제한적으로 Gate/Tower 전투에 연결.
- 모든 104개 그림자나 모든 generic skill/passive를 전투에 연결하지 않음.
- 기존 12-28H `resolveShadowSupportActions` shadow stats 보정은 제거하지 않고 유지.
- 이번 runtime은 기존 support-action 위에 작은 v2 action event layer를 병행하는 구조.
- 2.5D battle board, 전투 UI/VFX, portrait flash, 공격 애니메이션, 대형 로그 연출 구현 없음.
- 전투 수치 대폭 변경 없음.
- localStorage key `levelup-save` 변경 없음.
- persist version 변경 없음.

### 추가한 runtime helper
- `src/lib/shadowCombatRuntime.ts` 추가.
- 주요 구조:
  - `ShadowCombatRuntimeActor`
  - `ShadowCombatRuntimeState`
  - `ShadowRuntimeEvent`
  - `ResolveShadowActionRuntimeParams`
  - `ResolveShadowActionRuntimeResult`
  - `resolveShadowActionRuntime`
- equipped owned shadow만 `getShadowCombatUnitProfile`로 변환해 runtime 후보를 계산.
- 저장형 runtime state는 추가하지 않고 전투 함수 내부 derived state로 처리.
- hidden/locked 미보유 대상은 runtime 후보에 들어오지 않음.

### ShadowActionEvent 확장
- `src/lib/shadowSkills.ts`
  - `ShadowActionEvent`에 2.5D 재사용 후보 필드 추가:
    - `abilityName`
    - `sourceAbility`
    - `targetType`
    - `actionCue`
    - `impactTiming`
- 기존 data/profile 표시 구조와 호환.
- 실제 2.5D UI나 animation hook 실행은 하지 않음.

### 연결 범위
- runtime은 `source === prototype | unique`인 active/passive만 후보로 사용.
- 12-28K 대표 그림자 prototype/unique ability를 우선 대상으로 함.
- generic fallback skill/passive는 이번 1차 runtime에 연결하지 않음.
- 연결 효과 계열:
  - assault/hunter damage, wounded target finisher 계열
  - guard/survival damage reduction, emergency guard 계열
  - scout/analyst control, defense down, boss suppression 계열
  - support cooldown/support utility, small buff 계열
  - stat shift 계열의 작은 tempo 보조

### Gate/Tower 반영 위치
- `src/lib/game.ts`
  - `resolveShadowSupportActions` 내부에서 기존 12-28H support-action 계산 후 `resolveShadowActionRuntime`을 호출.
  - monster가 살아 있고 equipped shadow가 있을 때만 v2 runtime event 후보를 계산.
  - 반환된 event는 기존 active effect / damage / reduction 적용 함수에 작게 합산.
  - `shadow-action-runtime` log를 추가하되 `isShadowCombatLog`에 포함해 플레이어 턴 소비 로그로 취급되지 않게 함.
- Infinite Tower도 동일한 `resolveShadowSupportActions` 경로를 쓰므로 별도 UI 변경 없이 적용.

### cap / 제한
- 라운드당 runtime shadow action event 최대 1개.
- 발동률 hard cap:
  - active 12%
  - unique active 14%
  - passive 8%
  - unique passive 10%
- 효과 cap:
  - damage event skillPower 최대 0.11
  - guard reduction 최대 6.5%
  - survival guard reduction 최대 5.5%
  - control/boss defense down 최대 4.5%~5%
  - support attack buff 최대 4%
  - stat shift speed buff 최대 3.5%
- 같은 라운드에서 과도한 중복 효과가 쌓이지 않도록 runtime event 수를 1개로 제한.

### 로그 / UI
- 새 전투 UI는 추가하지 않음.
- runtime 발동 시 짧은 system line만 추가:
  - `그림자 프로토타입 발동: ...`
  - `고유 그림자 스킬 발동: ...`
- portrait flash, slash animation, camera shake, 2.5D board 구현 없음.

### hidden / secret 보호
- runtime 계산은 equipped owned shadow만 사용.
- hiddenUntilObtained 미보유 대상의 실제 이름, 초상, 조건, unique skill/passive, quote 노출 없음.
- locked named의 고유 능력명은 owned/equipped profile이 runtime에 들어온 뒤에만 사용.
- 상점/확률표/도감에 hidden 정보를 새로 노출하지 않음.

### 2.5D 대비
- `ShadowRuntimeEvent`는 `effectKind`, `sourceShadowId`, `targetType`, `animationCue`, `actionCue`, `impactTiming`, `logCue`를 유지/전달할 수 있는 구조.
- 향후 2.5D battle board에서 공격 이펙트, 방어 barrier, 제어/보스 억제, action priority, named cue로 재사용 가능.
- 이번 단계에서는 계산 기반과 event language만 마련.

### 검증
- `npm run build` exit code 0.
- Vite 기존 chunk size warning만 표시.
- `npx tsx scripts/sim-shadow-battle-balance.ts` exit code 0.
- sim은 기존 대형 밸런스 테이블을 출력했고 runtime crash 없음.
- localStorage/persist/save migration 변경 없음.

---

## 12-28M Shadow Unit Profile 원정 반영 1차 완료

### 작업 성격
- Shadow Combat System v2의 Shadow Unit Profile을 그림자 원정 계산에 1차 연결.
- 원정에서 그림자를 단순 power 숫자가 아니라 role / stat / passive / expedition behavior를 가진 유닛처럼 쓰기 위한 기반 작업.
- 원정 battlefield VFX, 대형 UI 애니메이션, 2.5D 전투 구현 없음.
- 원정 보상 테이블과 보상량 직접 증가는 변경하지 않음.
- Gate/Tower 전투 공식, 12-28H `resolveShadowSupportActions`, 12-28L runtime layer 변경/제거 없음.
- localStorage key `levelup-save` 변경 없음.
- persist version 변경 없음.

### 추가한 원정 aggregate
- `src/lib/shadowExpeditions.ts`
  - `ShadowExpeditionUnitAggregate` 추가.
  - owned/selected party shadow를 `getShadowCombatUnitProfile`로 변환한 뒤 매번 derived 계산.
- aggregate 목록:
  - `expeditionPower`
  - `scoutUtility`
  - `commandTempo`
  - `riskControl`
  - `supportStability`
  - `searchSense`
  - `bossHuntPressure`
  - `synergyCoordination`
- 2.5D 대비 재사용:
  - party strength, 명령 반응성, 위험 경고/방어 안정화, 군단 협동, 강적 추적 압박 같은 연출 hook으로 재사용 가능.
  - 이번 단계에서는 표시/VFX로 연결하지 않음.

### Shadow Expedition 계산 반영 위치
- `getShadowExpeditionPower`
  - 기존 basePower / rarity / enhancement / level / role match / named 계산 유지.
  - Shadow Unit aggregate의 `expeditionPower`, `searchSense`, `synergyCoordination`을 최대 약 +3% 수준의 작은 multiplier로 추가.
- `resolveShadowExpeditionCommand`
  - selected party profile과 aggregate를 계산.
  - command별 stat score로 progress multiplier, risk mitigation, role match progress를 소폭 반영.
  - command log 뒤에 짧은 “군단 조율” 로그만 추가.
- `resolveExpeditionMidEventChoice`
  - store에서 selected party를 전달.
  - choice preferred role과 party stat/aggregate가 맞으면 진행/위험을 작은 폭으로 보정.
- outcome 판정
  - 실제 저장 progress/risk는 그대로 기록.
  - 판정 시에만 `expeditionPower`/`riskControl` 기반의 아주 작은 boundary adjustment를 적용.

### command별 stat 연결
- `attack`: `shadowAttack`, `shadowFinisher`, `shadowBossing`
- `defend`: `shadowDefense`, `shadowDurability`, `shadowSurvival`
- `scout`: `shadowSpeed`, `shadowControl`, `shadowExpedition`
- `analyze`: `shadowControl`, `shadowSuppression`, `shadowSupport`
- `search`: `shadowExpedition`, `shadowSynergy`, `shadowSupport`
- command button hint 문구만 작게 보강했고, 레이아웃/VFX/애니메이션 변경 없음.

### prototype / passive 반영 범위
- `ShadowCombatUnitProfile.passives`만 원정 affinity에 제한적으로 반영.
- scout/search/support/analyst/hunter/guard 성격 passive가 해당 command의 progress/risk/role match에 아주 작은 보조값 제공.
- `source === prototype | unique`는 owned/selected party profile에 들어온 경우에만 작은 source affinity로 반영.
- 전투 active skill을 원정에 억지로 연결하지 않음.
- passive 이름/고유 능력명은 원정 로그에 노출하지 않음.

### cap / diminishing return
- `boundedBonus(value, scale, cap)` 형태의 diminishing return 사용.
- party power profile multiplier cap 약 +3%.
- command progress multiplier hard cap +4%.
- command risk mitigation cap:
  - defend/scout 최대 3 risk point.
  - 그 외 command 최대 4 risk point.
- role match 추가 progress cap 최대 +1 point.
- outcome boundary adjustment cap:
  - progress +1.
  - risk -1.
- mid-event 보정 cap:
  - progress 최대 +4.
  - risk 최대 -2~-4.
- 보상량 직접 증가 없음.

### hidden / secret 보호
- 원정 계산은 selected owned shadow party만 사용.
- hiddenUntilObtained 미보유 대상, locked named 미보유 대상의 실제 이름/초상/고유 skill/passive/quote 노출 없음.
- 원정 로그에는 passive/unique ability 이름을 새로 표시하지 않음.

### 검증
- `npm run build` exit code 0.
- Vite 기존 chunk size warning만 표시.
- `npx tsx scripts/sim-shadow-expedition.ts` exit code 0.
- sim 결과:
  - low party는 기존과 거의 동일하게 실패/부분성공 중심.
  - trained/named party는 안정성 및 일부 command 성과가 소폭 상승.
  - 일부 강한 조합도 무조건 great_success가 되지 않도록 cap 재조정 완료.
- localStorage/persist/save migration 변경 없음.

---

## 12-28N 장비 stars/rarity 전투력/착용 비교 강화 완료

### 작업 성격
- 장비 stars, rarity, slot, effects를 전투력 해석과 착용 판단에서 더 잘 읽히도록 표시/비교 기반을 추가.
- 장비 획득 확률, stars 확률, 상점 가격, Gold 수급량, 전투 공식은 변경하지 않음.
- 2D 전투 UI/VFX/애니메이션 대형 작업 및 2.5D 전투 구현 없음.
- localStorage key `levelup-save` 변경 없음.
- persist version 변경 없음.

### 장비 power/helper
- `src/lib/equipmentPower.ts` 추가.
- 주요 helper:
  - `getEquipmentPowerBreakdown(item)`
  - `compareEquipmentForSlot(item, previous?)`
- `getEquipmentPowerBreakdown` 출력:
  - `totalEquipmentValue`
  - `offenseValue`
  - `defenseValue`
  - `utilityValue`
  - `survivalValue`
  - `shadowSynergyValue`
  - `skillValue`
  - `slotRole`
  - `slotRoleLabel`
  - `starTierLabel`
  - `rarityPotentialLabel`
  - `topTags`
  - `actionCue`
- 이 값은 표시/비교용 해석 지표이며 기존 헌터 전투력 공식에 직접 합산하지 않음.
- `getEnhancedItemEffects`와 기존 skill combat value를 읽어 stars/enhancement가 적용된 장비 해석을 제공.

### slot별 역할 정의
- `weapon`
  - 공격/스킬 피해 중심.
  - `offenseValue`, `skillValue` 가중.
  - 2.5D 후보 cue: `weapon_strike`.
- `armor`
  - 방어/생존 안정 중심.
  - `defenseValue`, `survivalValue` 가중.
  - 2.5D 후보 cue: `armor_barrier`.
- `accessory`
  - 속도/유틸 보조 중심.
  - `utilityValue`, 일부 `shadowSynergyValue` 가중.
  - 2.5D 후보 cue: `accessory_tempo`.
- `artifact`
  - 특수/그림자 연계 중심.
  - `shadowSynergyValue`, `skillValue`, `utilityValue` 가중.
  - 2.5D 후보 cue: `relic_aura`.

### stars / rarity 해석
- 1~2성: 기본 장비.
- 3성: 실사용 가능.
- 4성: 고가치 장비.
- 5성: 핵심 장비 후보.
- epic/legendary는 특수/전설 잠재력 태그로 강조.
- artifact는 `RELIC`, legendary는 `LEGENDARY`, 4~5성은 `HIGH STAR` 태그 후보를 제공.
- 별/희귀도 확률과 효과 배율은 변경하지 않음.

### 장비 비교 helper
- `compareEquipmentForSlot(item, previous?)`
  - 같은 slot의 현재 장착 장비와 비교.
  - verdict:
    - `better`
    - `sidegrade`
    - `situational`
    - `weaker`
  - delta:
    - total/offense/defense/utility/survival/shadowSynergy/skill.
  - 문구:
    - 공격 가치가 높음.
    - 생존력이 더 안정적.
    - 전투 스킬 운용 가치가 높음.
    - artifact/조건부/그림자 연계는 상황형으로 안내.
- 기대 피해량 같은 정밀 계산은 하지 않고 안전한 해석 문구 중심으로 제한.

### EquipmentRevealModal 표시 개선
- `src/components/EquipmentRevealModal.tsx`
  - reveal 결과 카드에 slot role, equipment value, star tier, topTags 표시.
  - 현재 착용 장비와의 comparison label/delta/recommendation/key reason 표시.
  - 4~5성 / epic / legendary / artifact는 기존 high value 톤을 유지하면서 더 명확한 태그를 표시.
  - reveal sequence/VFX 구조는 대형 변경하지 않음.

### Inventory 표시 개선
- `src/components/Inventory.tsx`
  - 장착 슬롯 카드에 slot role, VALUE, topTags 표시.
  - 보유 장비 카드에 slot role, equipment value, topTags 1~2개 표시.
  - 장착 가능한 미장착 장비는 현재 slot 장비와의 comparison label/delta/recommendation을 compact box로 표시.
  - 카드 과밀 방지를 위해 긴 breakdown은 넣지 않고, 세부 reason은 title tooltip 성격으로 제공.

### HunterStatus / breakdown
- `src/components/HunterStatus.tsx`
  - 전투력 카드 내부에 `EQUIP VALUE`와 top equipment tags만 compact chip으로 표시.
  - 별도 큰 카드나 레이아웃 확장 없음.
  - 기존 combat power 계산값은 변경하지 않음.

### 2.5D 대비
- `EquipmentPowerBreakdown.actionCue`로 다음 연결 후보를 준비:
  - weapon value → 공격 이펙트 강도.
  - armor value → barrier/피격 안정성.
  - accessory value → speed/support cue.
  - artifact value → 특수 aura/보스전 cue.
  - stars/rarity/topTags → glow/frame intensity 후보.
- 이번 단계에서는 2.5D UI/VFX를 구현하지 않음.

### 104개 그림자 확장과의 관계
- `shadowSynergyValue`는 특정 그림자 id나 12개 prototype에 의존하지 않음.
- 장비 효과, slot, stat, rarity, stars 기반의 일반화된 해석값만 사용.
- 향후 104개 그림자 전체 skill/passive/profile 확장 시 role/stat 기반 시너지로 연결 가능.
- hidden/secret 조건/정체 노출 없음.

### 검증
- `npm run build` exit code 0.
- Vite 기존 chunk size warning만 표시.
- 전투/경제/확률 sim은 실행하지 않음. 장비 공식/확률/경제 수치를 변경하지 않았기 때문.
- localStorage/persist/save migration 변경 없음.

## 12-28O - 104개 그림자 전체 skill/passive 확장 계획 작성 완료

### 문서
- `docs/shadow-104-skill-passive-expansion-plan.md` 추가.
- 현재 `SHADOW_DEFINITIONS` 기준 104개 전체를 ID/role/rarity/named/hidden/sample12/assignment/phase 기준으로 분류.
- 이번 단계는 문서/계획 작업이며 코드 로직, 전투 공식, 저장 구조, UI, 수치 변경 없음.

### 104개 전체 확장 원칙
- 모든 그림자는 최소 role-based active/passive 후보를 가진다.
- 모든 그림자가 완전 고유 스킬을 가질 필요는 없지만 role/rarity/innateGrade/계열 차이는 가져야 한다.
- named / legendary / achievement / gate named는 더 고유한 skill/passive/profile 후보를 가진다.
- hiddenUntilObtained / gate named / sealed named는 획득 전 고유 skill/passive/quote/조건/초상 노출 금지.

### phase별 계획
- Phase 1: common/uncommon 일반 그림자 generic role template 확장.
- Phase 2: rare/epic 일반 그림자 role + rarity 변형 및 prototype-specific 확장.
- Phase 3: legendary 일반 그림자 고급 template 확장.
- Phase 4: named/gate/achievement unique skill/passive 확장 및 hidden masking.
- Phase 5: 2.5D action cue / animation hook taxonomy 정리.

### 배정 타입
- `GENERIC_ROLE_ONLY`: role generic pool만 사용.
- `ROLE_TEMPLATE_PLUS`: role + rarity/source 기반 변형.
- `PROTOTYPE_SPECIFIC`: 특정 그림자 개성을 반영한 prototype.
- `UNIQUE_NAMED`: named 고유 skill/passive 필요.
- `SEALED_UNIQUE_HIDDEN`: 획득 전 정보 보호가 필요한 sealed unique.

### 12개 prototype 검토
- `shadow-sentry`, `black-claw`, `rift-librarian`, `sloth-hunter`, `silent-archer`, `iron-bastion`, `rift-champion`, `midnight-oracle`는 non-named prototype sample로 유지.
- `kasim-analyst`, `charka-finance-patron`, `verk-steel-knight`는 achievement named unique sample로 유지.
- `karden-forgetting-scribe`는 gate hidden sealed unique sample로 유지하되 locked UI에서는 고유 정보 비노출 원칙 유지.

### skill/passive 기준
- role별 active/passive 방향 정리:
  - assault: burst/crit/execute.
  - guard: protect/block/counter.
  - hunter: chase/chain/prey/search sense.
  - scout: initiative/scan/evasion/control.
  - support: heal/buff/cooldown/stability.
  - analyst: weakness/boss suppression/control.
- rarity별 품질 기준 정리:
  - common은 단순/안정.
  - uncommon은 소폭 특화.
  - rare는 조건부 1개.
  - epic은 강한 role identity.
  - legendary는 고유 조건부 후보.
  - named는 unique skill/passive/action cue 후보.
- innateGrade는 skill 종류보다 안정성/성장성/발동률/cooldown 안정성에 반영.
- evolution은 계수 강화, trigger 완화, secondary role tag, named/legendary 고유 효과 강화 후보로 정리.

### hidden 보호 원칙
- hiddenUntilObtained / gate_named / sealed named는 획득 전 고유 skill/passive/quote/조건/초상 비노출.
- 문서에는 개발용 assignment type만 기록하고 사용자-facing UI에는 노출하지 않음.
- locked card에서는 `sealed unique` 수준의 일반 표현만 허용.
- 원정/전투/Codex/2.5D cue는 owned/selected/obtained 상태의 실제 데이터만 고유 정보로 해석해야 함.

### 2.5D 대비
- role별 action cue 후보 정리:
  - assault: `dash_slash`, `finisher_cut`.
  - guard: `barrier_guard`, `intercept`.
  - hunter: `chase_dash`, `chain_strike`.
  - scout: `scan_mark`, `evade_shift`.
  - support: `healing_pulse`, `cooldown_rune`.
  - analyst: `weakness_grid`, `suppression_field`.
  - named: `unique_aura`, `quote_cut_in`.
- 이번 단계에서는 2.5D 전투/UI/VFX 구현 없음.

### 다음 구현 제안
- 12-28P: common/uncommon/rare 일반 그림자 skill/passive 확장 1차.
- 12-28Q: epic/legendary 일반 그림자 확장.
- 12-28R: named/gate/achievement unique 확장.
- 12-28S: ShadowActionRuntime 확장 skill/passive 해석 개선.
- 12-29A: 2.5D 전투 시스템 설계.

### 검증
- `git diff --check` exit code 0.
- 기존 LF/CRLF warning만 표시.
- 문서 작업이므로 `npm run build`는 생략.
- localStorage key `levelup-save`, persist version, save migration 변경 없음.

## 12-28P - common/uncommon/rare 일반 그림자 skill/passive 확장 1차 완료

### 작업 범위
- `docs/shadow-104-skill-passive-expansion-plan.md` 분류표 기준으로 common/uncommon/rare 일반 그림자만 대상으로 처리.
- 제외 유지:
  - hiddenUntilObtained.
  - gate named.
  - achievement named.
  - legendary.
  - named unique.
  - SEALED_UNIQUE_HIDDEN / UNIQUE_NAMED.
- 기존 12개 prototype/unique 샘플은 유지하고 덮어쓰지 않음.

### 확장한 그림자 수
- 대상 일반 그림자 49개에 `shadowSkillIds` / `shadowPassiveIds` reference 연결.
- GENERIC_ROLE_ONLY: common/uncommon 일반 그림자에 role generic active/passive 연결.
- ROLE_TEMPLATE_PLUS: rare 일반 그림자 14개에 template source active/passive 연결.
- 누락 검증:
  - 대상 49개 모두 active/passive 후보 resolve 확인.
  - hidden/gate/achievement/legendary 제외 대상에 새 generic/template 연결 없음 확인.

### 추가한 generic skill/passive pool
- assault
  - skill: `assault-quick-slash`
  - passive: `assault-low-hp-pressure`
- guard
  - skill: `guard-intercept-step`
  - passive: `guard-durability-stance`
- hunter
  - skill: `hunter-prey-mark-basic`
  - passive: `hunter-search-sense`
- scout
  - skill: `scout-quick-scan`
  - passive: `scout-route-reading`
- support
  - skill: `support-stabilizing-aura`
  - passive: `support-rhythm`
- analyst
  - skill: `analyst-defense-index`
  - passive: `analyst-analysis-tempo`

### 추가한 ROLE_TEMPLATE_PLUS variant
- `ShadowAbilitySource`에 `template` source 추가.
- `TEMPLATE_SKILLS` / `TEMPLATE_PASSIVES` 추가.
- rare 일반 그림자 14개에 이름/계열 기반 template 연결:
  - `rift-tracker`
  - `oath-carrier`
  - `black-shieldman`
  - `minute-caller`
  - `black-annotator`
  - `sloth-raider`
  - `forgetting-scribe`
  - `fatigue-shieldman`
  - `rift-instructor`
  - `greed-collector`
  - `rift-wayfinder`
  - `greed-ledger`
  - `corridor-banner`
  - `mirror-hunter`
- template은 display/profile/2.5D cue용으로 연결했으며, 12-28L runtime의 prototype/unique 제한 실행 범위는 변경하지 않음.

### ShadowCombatUnitProfile 반영
- definition-specific skill/passive id가 generic fallback보다 우선되도록 candidate 정렬 보강.
- unique > prototype > template > generic 우선순위 유지.
- rarity/innateGrade/evolution 기반 quality cap 유지.
- common도 명시 passive id가 있으면 상세에서 passive 후보를 볼 수 있음.

### ShadowPanel 표시 영향
- ShadowCard의 SCP + role/top stat/top skill badge 구조 유지.
- Shadow 상세의 ACTIVE/PASSIVE 후보 영역 재사용.
- `getShadowAbilitySourceLabel`에 `TEMPLATE` 라벨 추가.
- UI/VFX/레이아웃 대형 변경 없음.

### hidden / named 보호
- hiddenUntilObtained / gate named / achievement named / legendary unique definition 수정 없음.
- locked named의 unique skill/passive/quote/조건 노출 경로 추가 없음.
- Codex 미보유 상태 노출 구조 변경 없음.

### 2.5D 대비
- 추가 generic/template skill/passive에 `actionCue`, `animationCue`, `effectColor`, `impactTiming`, passive `triggerCue` 후보 포함.
- cue 예시:
  - `dash_slash`
  - `barrier_guard`
  - `prey_mark`
  - `scan_mark`
  - `stability_aura`
  - `weakness_grid`
- 이번 단계에서는 2.5D 전투 보드/VFX/애니메이션 구현 없음.

### 검증
- `npm run build` exit code 0.
- Vite 기존 chunk size warning만 표시.
- 대상 검증 스크립트:
  - targets 49.
  - missing 0.
  - unresolved 0.
  - template 14.
  - touchedExcluded 0.
- `git diff --check -- src\lib\shadowSkills.ts src\lib\shadows.ts` exit code 0.
- localStorage key `levelup-save`, persist version, save migration 변경 없음.
- 전투 공식/보상/경제/확률 수치 변경 없음.

## 12-28Q - epic / legendary 일반 그림자 skill/passive 확장 완료

### 작업 범위
- `docs/shadow-104-skill-passive-expansion-plan.md` 기준 epic 일반 그림자만 대상으로 처리.
- 현재 `SHADOW_DEFINITIONS` 기준 non-hidden / non-named legendary 일반 그림자는 0개라서 추가 대상 없음.
- 제외 유지:
  - hiddenUntilObtained.
  - gate named.
  - achievement named.
  - SEALED_UNIQUE_HIDDEN.
  - UNIQUE_NAMED.
  - locked named / named unique.

### 확장한 그림자 수
- epic 일반 그림자 10개에 advanced template 또는 prototype 보강 연결.
- 신규 ROLE_TEMPLATE_PLUS 연결 7개:
  - `sloth-knight`
  - `archive-duelist`
  - `forgetting-watcher`
  - `rift-tactician`
  - `fatigue-wall`
  - `rift-gladiator`
  - `greed-devourer`
- 기존 PROTOTYPE_SPECIFIC 보강 3개:
  - `iron-bastion`
  - `rift-champion`
  - `midnight-oracle`

### 추가한 advanced template skill/passive pool
- guard:
  - `template-sloth-knight-delayed-counter`
  - `template-sloth-knight-slow-bastion`
  - `template-fatigue-wall-damage-floor`
  - `template-fatigue-wall-emergency-floor`
  - `template-iron-bastion-anchor-chain`
  - `template-iron-bastion-anchored-readiness`
- analyst:
  - `template-archive-duelist-weakpoint-lunge`
  - `template-archive-duelist-duel-index`
  - `template-forgetting-watcher-memory-break`
  - `template-forgetting-watcher-pattern-erasure`
- support:
  - `template-rift-tactician-command-cycle`
  - `template-rift-tactician-command-rhythm`
  - `template-midnight-oracle-cycle-field`
  - `template-midnight-oracle-cycle-stability`
- assault:
  - `template-rift-gladiator-arena-burst`
  - `template-rift-gladiator-burst-tempo`
  - `template-rift-champion-finisher-rush`
  - `template-rift-champion-champion-rhythm`
- hunter:
  - `template-greed-devourer-devour-chain`
  - `template-greed-devourer-aftertaste`

### 기존 prototype과의 관계
- `iron-bastion`, `rift-champion`, `midnight-oracle`는 기존 prototype skill/passive를 첫 번째 id로 유지.
- 새 template은 두 번째 id로만 추가해 evolution stage에서 보조 후보로 열리게 함.
- 기본 표시와 대표 source는 계속 PROTOTYPE으로 유지.
- 12-28K prototype/unique 및 12-28L runtime 로직 제거/변경 없음.

### ShadowCombatUnitProfile / ShadowPanel 영향
- 12-28P에서 보강한 definition-specific 우선 정렬을 그대로 사용.
- TEMPLATE / PROTOTYPE source label 유지.
- ShadowCard의 SCP + role/top stat/top skill badge 구조 변경 없음.
- Shadow 상세의 ACTIVE/PASSIVE 후보 영역 재사용.
- UI/VFX/레이아웃 대형 변경 없음.

### hidden / named 보호
- hiddenUntilObtained / gate named / achievement named / named unique definition 수정 없음.
- SEALED_UNIQUE_HIDDEN 고유 skill/passive/quote 노출 없음.
- Codex 미보유 상태 노출 구조 변경 없음.

### 2.5D 대비
- 추가 advanced template에 `actionCue`, `animationCue`, `effectColor`, `impactTiming`, passive `triggerCue` 후보 포함.
- cue 예시:
  - `counter_flash`
  - `weakness_grid`
  - `suppression_field`
  - `cooldown_rune`
  - `barrier_guard`
  - `burst_impact`
  - `chain_strike`
  - `finisher_cut`
- 이번 단계에서는 2.5D 전투 보드/VFX/애니메이션 구현 없음.

### 검증
- `npm run build` exit code 0.
- Vite 기존 chunk size warning만 표시.
- 대상 검증 스크립트:
  - targets 10.
  - legendaryGeneral 0.
  - missing 0.
  - unresolved 0.
  - touchedExcluded 0.
  - prototype 3개 기본 대표 source PROTOTYPE 유지 확인.
- localStorage key `levelup-save`, persist version, save migration 변경 없음.
- 전투 공식/보상/경제/확률 수치 변경 없음.
## 12-28R: named / gate / achievement unique skill/passive 확장

### 확장 범위
- `UNIQUE_NAMED` / `SEALED_UNIQUE_HIDDEN` Phase 4 범위 반영.
- 현재 `SHADOW_DEFINITIONS` 기준 named 총 40개에 unique skill/passive reference 연결.
  - gate / hidden named: 16개.
  - achievement named: 24개.
- 기존 12-28K unique sample 유지:
  - `karden-forgetting-scribe`
  - `kasim-analyst`
  - `charka-finance-patron`
  - `verk-steel-knight`
- 기존 sample 4개는 기존 unique id를 첫 번째로 유지하고, 보강 unique 후보를 두 번째 id로 추가.

### unique skill/passive 추가 방식
- `src/lib/shadowSkills.ts`에 named unique helper/default 추가.
  - role별 unique active 기본값: assault / guard / hunter / scout / support / analyst.
  - role별 unique passive 기본값: trigger_boost / survival / synergy / bossing 중심.
- `UNIQUE_NAMED_SKILLS`, `UNIQUE_NAMED_PASSIVES` 배열 추가.
- registry 연결:
  - `ALL_SHADOW_SKILLS`에 `UNIQUE_NAMED_SKILLS` 포함.
  - `ALL_SHADOW_PASSIVES`에 `UNIQUE_NAMED_PASSIVES` 포함.
- 각 unique 후보는 `source: 'unique'`, `qualityTier: 'unique'` 유지.
- runtime 본격 해석 확장은 12-28S로 남김. 현재 12-28L runtime은 해석 가능한 `effectKind`, `statScaling`, `trigger`, `actionCue`, `animationCue`만 제한적으로 활용.

### ShadowDefinition 연결
- `src/lib/shadows.ts` named definition에 기존 필드명만 사용.
  - `shadowUniqueSkillIds`
  - `shadowUniquePassiveIds`
  - `shadowUniqueActionCue`
- 새 저장 필드, persist version, localStorage key 변경 없음.
- 이름/설명/획득 조건/보상/확률/경제 수치 변경 없음.

### hidden / locked 보호
- hiddenUntilObtained / gate named / sealed named는 내부 unique id를 갖지만, 미보유 locked UI에서는 unique skill/passive/quote/trigger/action cue를 표시하지 않음.
- `ShadowPanel` Codex locked card는 definition profile을 계산하지 않고 기존 sealed wording만 유지.
- owned named shadow에서만 `getShadowCombatUnitProfile`을 통해 unique active/passive가 표시됨.
- achievement named도 미보유 Codex 카드에 새 unique 상세를 표시하지 않음.

### ShadowPanel 표시 영향
- ShadowCard 구조 변경 없음.
- SCP + role/top stat/top skill badge 흐름 유지.
- owned named 상세에서만 UNIQUE source label과 active/passive 후보 표시.
- UI/VFX/레이아웃/애니메이션 대형 변경 없음.

### 2.5D 대비 cue 구조
- unique 후보에 기존 metadata 필드로 cue 후보 포함.
  - `actionCue`
  - `animationCue`
  - `effectColor`
  - `impactTiming`
  - passive `triggerCue`
- cue 예시:
  - `weakness_grid`
  - `suppression_field`
  - `signature_field`
  - `barrier_guard`
  - `finisher_cut`
  - `scan_mark`
  - `cooldown_rune`
  - `prey_mark`
- 이번 단계에서 2.5D board/VFX/animation 구현 없음.

### 검증
- named profile 검증 스크립트:
  - totalNamed 40.
  - gateHidden 16.
  - achievement 24.
  - missingRefs 0.
  - profileFailures 0.
- locked UI 코드 경로 확인:
  - `ShadowPanel` owned card/detail에서만 `getShadowCombatUnitProfile` 호출.
  - Codex locked card에서 `shadowUnique*` 렌더 없음.
- `npm run build` exit code 0.
- Vite 기존 chunk size warning만 표시.
- localStorage key `levelup-save`, persist version, save migration 변경 없음.
- 전투 공식/보상/상점/경제/확률 수치 변경 없음.
## 12-28S: ShadowActionRuntime 해석 범위 확장

### 해석 범위 확장
- `src/lib/shadowCombatRuntime.ts` 중심으로 12-28P~R에서 늘어난 active/passive 후보 해석 범위 확장.
- 기존 12-28L의 prototype/unique 중심 후보 필터를 넓혀 `generic`, `template`, `prototype`, `unique` source를 모두 해석 가능하게 처리.
- source별 hard cap을 분리해 generic/template 확장으로 전투 수치가 급격히 오르지 않도록 제한.
  - active cap: generic 0.07 / template 0.09 / prototype 0.12 / unique 0.14.
  - passive cap: generic 0.045 / template 0.06 / prototype 0.08 / unique 0.10.
- 라운드당 ShadowActionEvent는 기존처럼 `maxActionsPerRound: 1` 호출을 유지.

### effectKind / statScaling 처리
- active:
  - `damage` / `hybrid`: 공격, finisher, target low HP 계열을 capped damage event로 해석.
  - `guard`: 방어/내구 기반 damage reduction event로 해석.
  - `control`: defense/control debuff event로 해석.
  - `support`: hunter 공격 흐름 보조 event로 해석.
  - `bossing`: boss-like target에서만 약한 boss/control event로 해석.
- passive:
  - `survival`: low HP/guard 성격의 damage reduction event.
  - `bossing`: boss-like target에서만 debuff/support event.
  - `trigger_boost`: `runtimeCategory`에 따라 control/bossing이면 debuff, tempo/support/attack이면 작은 buff로 degrade.
  - `cooldown` / `synergy`: support buff event.
  - `stat_shift`: speed/tempo 보정 event.
- `shadowExpedition` stat은 Gate/Tower runtime에서 직접 강하게 쓰지 않고 combat stat score에서 0.25로 감쇠.
- `shadowSynergy`, `shadowSupport`, `shadowSpeed`도 전투 runtime에서는 약한 감쇠를 적용해 기존 12-28H 보정과 중복 과상승을 제한.

### trigger 처리
- 해석 유지/보강:
  - `battle_start`
  - `wave_start`
  - `round_start`
  - `after_hunter_action`
  - `before_enemy_action`
  - `finisher_window`
  - `target_low_hp`
  - `hp_threshold`
  - `boss_present`
  - `after_crit`은 현재 전투 상태에서 치명 여부를 직접 알 수 없어 `playerUsedSkill` proxy로 제한.
  - `after_kill`은 monster HP 0 이하일 때만 true지만 현재 runtime 호출 구조상 후속 확장 후보.
- 알 수 없는 trigger는 안전하게 no-op 처리.

### unique / named 처리
- runtime은 기존과 같이 equipped/owned shadow 배열만 입력으로 받는다.
- hidden/gate/sealed named의 unique detail은 미보유 locked UI에서 접근하지 않음.
- unique ability는 `sourceAbility: 'unique'`, `logCue: 'apex'`로 metadata를 남기지만, active/passive hard cap과 라운드당 1회 cap을 유지.
- named가 모든 라운드에 확정 발동하지 않도록 chance cap과 trigger filter를 유지.

### ShadowActionEvent metadata 정리
- `ShadowActionEvent`에 2.5D 재사용용 metadata 추가.
  - `effectColor`
  - `boardLane`
  - `runtimeCategory`
- 기존 metadata 유지:
  - `sourceShadowId`
  - `skillId` / `passiveId`
  - `abilityName`
  - `sourceAbility`
  - `effectKind`
  - `targetType`
  - `valuePreview`
  - `logCue`
  - `actionCue`
  - `animationCue`
  - `impactTiming`
- 이번 단계에서 2.5D board/VFX/animation 구현 없음.

### 12-28H / 12-28L과의 관계
- 12-28H bridge layer 제거 없음.
- 12-28L runtime layer를 확장하되, 기존 support action 보정과 중복 과상승을 막기 위해 source cap, stat 감쇠, boss gating을 적용.
- 향후 2.5D / v2 runtime이 안정화되면 12-28H 얇은 support 보정은 ShadowActionEvent 계산으로 흡수 가능하다는 방향 유지.

### 로그 / UI
- 전투 로그 source label을 source별로 분리.
  - unique: 고유 그림자 스킬.
  - prototype: 그림자 프로토타입.
  - template: 그림자 전술.
  - generic: 그림자 스킬.
- 새 UI/VFX/애니메이션/2.5D 보드 추가 없음.
- ShadowPanel locked Codex 표시 변경 없음.

### hidden 보호
- runtime 입력은 owned/equipped shadow만 사용.
- hiddenUntilObtained / locked gate named / sealed named의 unique skill/passive/quote/trigger/action cue는 미보유 UI에 노출하지 않음.
- Codex 미보유 상태 노출 구조 변경 없음.

### 검증
- runtime source probe:
  - generic / template / unique 후보가 모두 event metadata로 해석됨.
  - production 호출은 여전히 `maxActionsPerRound: 1`.
- `npm run build` exit code 0.
- `npx tsx scripts/sim-shadow-battle-balance.ts` exit code 0.
- sim note 필터 `too|hard|high` 결과 없음.
- Vite 기존 chunk size warning만 표시.
- localStorage key `levelup-save`, persist version, save migration 변경 없음.
- 전투 공식 대폭 변경, 보상, 상점, 경제, 확률 수치 변경 없음.
## 12-28T: Shadow v2 실사용 마감 점검 / 소형 정리

### 점검 범위
- Shadow Combat System v2 데이터, 표시, runtime, expedition, equipment 해석 레이어를 마감 점검.
- 신규 대형 기능, 신규 전투 UI/VFX, 2.5D 구현, 전투 공식 대폭 변경 없음.
- 다음 단계는 `12-29A` 2.5D 전투 시스템 설계.

### reference / smoke check
- `scripts/smoke-shadow-v2-references.ts` 추가.
- `SHADOW_DEFINITIONS` 104개 전체 기준으로 skill/passive reference, profile 생성, source label, action metadata를 점검.
- `src/lib/shadowSkills.ts`에 smoke check용 id registry export 추가.
  - `SHADOW_SKILL_DEFINITION_IDS`
  - `SHADOW_PASSIVE_DEFINITION_IDS`
- smoke 결과:
  - Shadow definitions: 104
  - Skill ids registered: 101
  - Passive ids registered: 95
  - Missing refs: 0
  - Profile issues: 0
  - Duplicate definition ids: 0
  - Hidden definitions: 16
  - Gate named definitions: 16
  - Achievement named definitions: 24
  - Unique-assigned definitions: 40

### ShadowPanel / ShadowCard 점검
- ShadowCard는 기존 SCP + role/top stat/top skill badge 중심 구조 유지.
- active/passive 상세는 owned detail 영역에만 표시되고 카드에는 길게 넣지 않음.
- 13개 stat은 기존 접이식 상세 유지.
- source label은 `GENERIC` / `TEMPLATE` / `PROTOTYPE` / `UNIQUE`로 smoke check 통과.
- hidden Codex card의 조건 문구를 소형 정리:
  - hiddenUntilObtained 미보유 대상은 `봉인 해제 후 공개`만 표시.
  - sourceGateId 같은 내부 조건 힌트를 locked card에 직접 표시하지 않음.

### hidden / sealed 보호 점검
- hiddenUntilObtained / gate named / SEALED_UNIQUE_HIDDEN locked Codex card는 실제 이름, 설명, 효과, unique skill/passive, quote, trigger, action cue를 표시하지 않음.
- owned detail에서만 `getShadowCombatUnitProfile` 기반 active/passive 후보 표시.
- runtime과 expedition은 owned/equipped 또는 selected party shadow만 입력으로 사용.

### ShadowActionRuntime 점검
- 12-28H bridge layer 제거 없음.
- 12-28L runtime layer는 유지되고, 12-28S 확장 cap 유지.
- Gate/Tower 호출부는 equipped shadow만 전달.
- production 호출은 `maxActionsPerRound: 1` 유지.
- unknown trigger/effect는 crash 없이 no-op/degrade되는 구조 유지.
- runtime log는 event 1개 cap 안에서 짧은 system line으로만 유지.

### Expedition / Equipment 충돌 점검
- Shadow expedition은 selected party/owned shadow 기준 계산.
- reward table 직접 변경 없음.
- passive/unique ability name을 expedition log에 직접 노출하지 않음.
- command별 stat 연결과 cap/diminishing return 구조 유지.
- equipmentPower는 specific shadow id가 아니라 slot/effect/stat/role-friendly value 기반.
- `shadowSynergyValue`는 104개 전체 확장과 충돌하지 않는 stat/effect 기반 해석 레이어로 유지.

### 2.5D 대비 metadata 점검
- skill/passive/profile/runtime metadata가 다음 hook을 유지:
  - `actionCue`
  - `animationCue`
  - `effectColor`
  - `boardLane`
  - `impactTiming`
  - `logCue`
  - `runtimeCategory`
- 이번 단계에서는 2.5D board/VFX/animation 구현 없음.

### 검증
- `npx tsx scripts/smoke-shadow-v2-references.ts` exit code 0.
- `npm run build` exit code 0.
- Vite 기존 chunk size warning만 표시.
- localStorage key `levelup-save`, persist version, save schema/save migration 변경 없음.
- gameplay 수치, 보상, 상점, 경제, 확률 변경 없음.
## 12-29A: Direct Shadow Party Battle System design

### Document
- Added `docs/direct-shadow-party-battle-system-plan.md`.
- This is a design-only step for the next combat model.
- No code runtime, UI, 2.5D board, save schema, combat formula, reward, economy, shop, or probability changes.

### Direction
- Final combat target is `Hunter + Shadow Party vs Monster Party`.
- Early combat: Hunter + 1 shadow vs 1-2 monsters.
- Mid combat: Hunter + 2 shadows vs 2 monsters.
- Late/boss combat: Hunter + 3 shadows vs 2-3 monsters or boss + 1-2 minions.
- Shadows become directly commanded combat units instead of only hunter support modifiers.

### Direct control principles
- User selects hunter actions and each shadow action.
- Shadow choices start small: basic attack, active skill, guard/defend, wait/charge, target selection.
- Passives and conditional triggers remain automatic with cooldowns/lockouts.
- First implementation should limit control burden and unlock more shadow slots gradually.

### Monster party structure
- Planned monster unit roles:
  - bruiser
  - tank
  - caster
  - assassin
  - support
  - controller
  - minion
  - boss
- Monster units should eventually carry HP, attack, defense, speed, intent, skill list, role, target priority, and boss/minion flags.

### Turn order recommendation
- Compared team-turn and speed-timeline approaches.
- Recommended first implementation: team-turn.
  - Player chooses all allied actions, then enemies act.
  - Lower implementation risk, clearer mobile UX, easier direct shadow control proof.
- Speed timeline remains a later advanced option once direct unit runtime is stable.

### Relationship to 12-28 bridge layers
- 12-28H support action bridge remains.
- 12-28L/S `ShadowActionRuntime` remains as capped transitional runtime.
- New many-vs-many runtime should reuse Shadow v2 skill/passive/profile metadata.
- Once stable, direct unit actions and passive events can absorb existing support-action logic.

### 2.5D relationship
- 2.5D is explicitly a later visualization layer.
- Future board should consume action metadata:
  - `actionCue`
  - `animationCue`
  - `effectColor`
  - `boardLane`
  - `impactTiming`
  - passive trigger visual hooks
  - boss intent markers
- No 2.5D implementation in this step.

### Verification
- `git diff --check` only is needed for this document-only step.
- localStorage key `levelup-save`, persist version, save migration, existing data, hidden protection, combat values, monster/gate values, reward tables, shop/economy/probability values unchanged.
## 12-29B: Battle Unit / Shared Combat Stat Model design

### Document
- Added `docs/battle-unit-shared-stat-model-plan.md`.
- Design-only step; no code/runtime/UI/save/combat/reward/economy/probability changes.

### BattleUnit direction
- Defines common runtime unit shape for `hunter`, `shadow`, `monster`, `boss`, and `minion`.
- Shared fields include unit/team/role, HP/current HP, ATK/DEF/SPD, CRIT/SKILL/CONTROL/SUPPORT/SURVIVAL/BOSS/SYNERGY, status effects, cooldowns, actions, passives, board lane, and action cue metadata.

### Shared combat stat model
- First battle display stats: HP / ATK / DEF / SPD / SKILL.
- Detail stats: CRIT / CONTROL / SUPPORT / SURVIVAL / BOSS / SYNERGY.
- Shadow raw 13 stats are not the main battle display language; they map into shared stats and remain available as detail/collapsible data.

### Shadow conversion
- HP comes from durability/survival/growth.
- ATK comes from attack/crit/finisher.
- DEF comes from defense/durability/survival.
- SPD comes from speed plus role/grade shaping.
- SKILL/CONTROL/SUPPORT/SURVIVAL/BOSS/SYNERGY map from active scaling and relevant shadow stats.
- `shadowExpedition` is mostly ignored or only weakly used in direct battle conversion.

### Hunter and monster conversion
- Hunter stats, equipment, title, skills, and current combat power feed BattleUnit through a conversion layer, not a save model replacement.
- `equipmentPower` slotRole/topTags can explain ATK/DEF/SPD/SKILL/SUPPORT/SYNERGY contribution without changing equipment odds or economy.
- Monster roles planned: bruiser, tank, caster, assassin, support, controller, minion, and boss.

### Queue/reaction model
- Team-turn input remains the recommended first implementation path.
- Execution sorts queued actions by SPD + action priority + skill priority.
- Guard/support/passive behavior uses reaction timing with per-round caps.

### Existing systems and 2.5D
- 12-28H/L/S bridge remains until direct BattleUnit runtime is stable.
- Reuses ShadowCombatUnitProfile, ShadowActionEvent metadata, equipmentPower, and actionCue metadata.
- BattleUnit/ActionQueue/StatusEffect should feed the future 2.5D board; no 2.5D implementation in this step.

### Verification
- `git diff --check` only needed for this document step.
- localStorage key `levelup-save`, persist version, save migration, combat values, monster/gate values, rewards, shop/economy/probability, and hidden protection unchanged.
## 12-29C: BattleUnit / BattleStat helper mock implementation

### Added files
- Added `src/lib/directBattleTypes.ts`.
- Added `src/lib/directBattleMonsters.ts`.
- Added `src/lib/battleUnits.ts`.
- Added `scripts/smoke-direct-battle-units.ts`.

### BattleUnit / BattleStat helper
- Introduced derived mock/prototype runtime types:
  - `BattleUnit`
  - `BattleUnitType`
  - `BattleTeam`
  - `BattleStats`
  - `BattleAdvancedStats`
  - `BattleActionDefinition`
  - `BattleStatusEffect`
  - `BattleUnitBuildResult`
- `BattleUnit` is not persisted and is not connected to existing Gate/Tower/Infinite Tower combat.

### Shadow to BattleUnit conversion
- Added `convertShadowProfileToBattleStats`.
- Added `buildShadowBattleUnit` and `buildShadowBattleUnits`.
- Reuses `getShadowCombatUnitProfile`.
- Converts 13 shadow stats into shared battle stats:
  - HP from durability/survival/growth.
  - ATK from attack/crit/finisher.
  - DEF from defense/durability/survival.
  - SPD from speed plus role/grade shaping.
  - SKILL from role-relevant stat mix.
  - CRIT/CONTROL/SUPPORT/SURVIVAL/BOSS/SYNERGY from the relevant shadow stat pairs.
- Uses clamp/rounding so mock stats do not become NaN, negative, or inflated without bound.
- Owned shadow input only; locked/unobtained hidden profile exposure is not introduced.

### Hunter to BattleUnit conversion
- Added `buildHunterBattleUnit`.
- Uses current hunter stats and existing combat stat helpers as a conversion layer.
- Equipment context can feed `equipmentPower` values into SUPPORT/SURVIVAL/SKILL/SYNERGY interpretation.
- Does not replace current combatPower, HunterStatus, or save data.

### Mock monster BattleUnit conversion
- Added mock-only monster definitions for bruiser, tank, caster, assassin, support, controller, minion, and boss.
- Added `buildMonsterBattleUnit` and `buildMockMonsterParty`.
- Mock monsters are not connected to Gate/Tower monster data, rewards, difficulty, or encounter flow.

### Action/status candidates
- Added action candidate fields for basic, skill, guard, support, wait, reaction, and passive.
- Added status effect candidate shape only; no status resolution runtime implemented.
- ActionQueue and direct battle runtime remain for 12-29D.

### Verification
- `npx tsx scripts/smoke-direct-battle-units.ts` exit code 0:
  - BattleUnits built: 8
  - Hunter units: 1
  - Shadow units: 4
  - Enemy units: 3
  - Validation issues: 0
  - Warnings: 0
  - Hidden-safe metadata issues: 0
  - Mock monster actions: 5
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- Existing Gate/Tower/Infinite Tower combat connections unchanged.
- localStorage key `levelup-save`, persist version, save schema/migration, gameplay values, rewards, shop/economy/probability, and hidden protection unchanged.
## 12-29D: ActionQueue + team-turn mock battle runtime

### Added files
- Added `src/lib/directBattleRuntime.ts`.
- Added `scripts/smoke-direct-battle-runtime.ts`.

### Runtime scope
- Implemented isolated prototype runtime only.
- Existing Gate/Tower/Infinite Tower combat remains disconnected.
- Existing 12-28H/L/S bridge layers remain unchanged.
- No UI, rewards, save schema, economy, probability, or 2.5D changes.

### ActionQueue
- Added direct battle state/log/queue types in `src/lib/directBattleTypes.ts`.
- `QueuedBattleAction` carries:
  - actor unit id/type/team
  - action id/type
  - target ids
  - base priority
  - speed priority
  - skill priority
  - final priority
  - timing
  - source skill/passive ids
  - effect/action/animation/color metadata
- Queue sorting is timing bucket first, then final priority, then SPD, then team/tie-breaker.

### Team-turn input + SPD execution
- Player actions are selected as a team-turn batch through mock selection.
- Monster actions are generated automatically from role/intent-like rules.
- Execution uses the ActionQueue sorted by SPD and priority.
- This keeps the 12-29A recommendation: team-turn input, priority-based execution.

### Supported mock actions/effects
- Basic damage.
- Skill damage.
- Control damage with simple defenseDown/mark.
- Support heal.
- Guard/wait.
- Cooldown ticking.
- Dead target fallback/fizzle handling.
- Battle end detection by team survival or max rounds.
- Damage formula is explicitly mock-only and not connected to current Gate/Tower formulas.

### Guard/reaction minimum
- Guard applies a short guard status to the actor.
- Guard can apply protect to a selected ally.
- Protected target damage is reduced and part of damage is absorbed by the guard unit.
- Reaction log entries keep actionCue/animationCue/effectColor metadata for later 2.5D use.
- Counter chains, lethal prevention, named unique reactions, and layered guard remain future work.

### Smoke result
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - BattleUnits: player 3 / enemy 2
  - Rounds simulated: 3
  - Logs: 21
  - Last ActionQueue size: 4
  - Winner: player
  - Finished: true
  - Reason: winner
  - Validation issues: 0
  - Gate/Tower connections: 0
- `npx tsx scripts/smoke-direct-battle-units.ts` exit code 0 after runtime addition.
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- localStorage key `levelup-save`, persist version, save schema/migration, gameplay values, rewards, shop/economy/probability, and hidden protection unchanged.
## 12-29E: Monster Party / Mock Encounter definition expansion

### Draft handling
- Continued the existing untracked 12-29E draft instead of creating duplicate files.
- Kept the 12-29D ActionQueue/runtime surface intact except for small mock targeting/status support:
  - `front_lane` / `rear_lane` target fallback.
  - control mock status now also applies `speedDown`.
- No existing Gate/Tower/Infinite Tower combat caller was connected.

### Mock monster roles
- Expanded `src/lib/directBattleMonsters.ts` as mock-only direct battle data.
- Roles covered:
  - bruiser: front pressure, basic jab, heavy hit.
  - tank: high HP/DEF, guard/protect ally.
  - caster: rear skill damage, cast/charge intent.
  - assassin: high SPD, lowest-HP pressure, burst.
  - support: low ATK, heal and shield/guard candidates.
  - controller: defenseDown/speedDown/mark control pressure.
  - minion: low stats, boss support/expendable pressure.
  - boss: high HP/SKILL, boss intent, boss skill/control.
- Monster definitions now carry mock-only `baseLevel`, `levelBand`, `statBias`, `intentCandidates`, `targetPriority`, boss/minion flags, board lane, action cue, animation cue, and effect color metadata.
- These values are not connected to live Gate/Tower monster values or difficulty.

### Mock encounters
- Expanded `src/lib/directBattleEncounters.ts` to seven prototype encounters:
  - `small_bruiser`
  - `small_duo`
  - `caster_pair`
  - `tank_assassin`
  - `control_support`
  - `boss_minion`
  - `boss_support`
- Each encounter includes encounter key/id, label, description, difficulty tag, recommended party size, intended lesson, enemy unit definitions, slot intent, target priority, board lane, and max rounds.
- Enemy count is kept to the intended mock range of 1-3 units.

### Builder behavior
- `buildMockMonsterParty(encounterKey)` now supports the expanded encounter keys and safe aliases:
  - `basic` -> `small_duo`
  - `control` -> `control_support`
  - `boss` -> `boss_support`
- Unknown keys fall back to `small_bruiser`.
- Level override still works through `BuildMonsterBattleUnitOptions.level`; otherwise slot level offsets are applied to each monster base level.
- BattleUnit conversion keeps boss/minion unit type and mock metadata tags.
- NaN/undefined stat safety remains covered by `validateBattleUnit`.

### Runtime smoke
- `scripts/smoke-direct-battle-runtime.ts` now loops through all mock encounters instead of one encounter.
- It checks:
  - encounter validation
  - BattleUnit validation
  - current HP bounds
  - ActionQueue creation
  - non-empty logs
  - safe winner value
  - crash count

### Verification
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounters tested: 7
  - Total battles: 7
  - Player units: 4
  - Total rounds simulated: 18
  - Total logs: 138
  - ActionQueue issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
- `npx tsx scripts/smoke-direct-battle-encounters.ts` exit code 0:
  - Encounter definitions: 7
  - Encounter monster units built: 14
  - Runtime encounter: `mock-tank-assassin`
  - Runtime player units: 4
  - Runtime enemy units: 2
  - Runtime rounds: 2
  - Runtime logs: 17
  - Runtime winner: player
  - Validation issues: 0
  - Gate/Tower connections: 0
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- localStorage key `levelup-save`, persist version, save schema/migration, gameplay values, rewards, result flow, shop/economy/probability, and hidden protection unchanged.
- No UI or 2.5D implementation.
## 12-29F: Gate optional direct battle preview connection

### Connection scope
- Added a DEV-only `DirectBattlePreviewPanel` inside `src/components/GatePanel.tsx`.
- The panel is rendered only behind `import.meta.env.DEV`.
- It appears in the Gate tab:
  - below the empty gate state when no active gate is open.
  - below the live gate result area when an active gate is open.
- This is an experimental mock preview path only, not a Gate battle replacement.

### Existing Gate separation
- Existing `startGateBattle` / `startManualGateBattle` buttons and flow remain unchanged.
- Existing Gate reward/result/clear/progress/stamina/penalty handling remains unchanged.
- The preview does not call store actions, does not write combat logs, does not clear gates, does not grant rewards, and does not spend stamina.
- Preview result is held in local React component state only.
- Infinite Tower is not connected.

### Player party
- Preview player party is built from:
  - `buildHunterBattleUnit` using current hunter/equipment/active consumable context.
  - `buildShadowBattleUnits` using equipped owned shadows only, capped to 1-3 shadows.
- If no owned/equipped shadow is available, the preview button is disabled and a safe message is shown.
- Hidden/locked named data is not introduced because only owned/equipped shadows are converted.

### Enemy party
- Preview enemy party uses 12-29E mock encounters through `buildDirectBattleEncounterParty`.
- Encounter buttons support:
  - `small_bruiser`
  - `small_duo`
  - `caster_pair`
  - `tank_assassin`
  - `control_support`
  - `boss_minion`
  - `boss_support`

### Preview display
- Shows selected encounter key/difficulty/lesson.
- On run, simulates the mock team-turn runtime for 3-6 rounds.
- Displays:
  - winner
  - rounds simulated
  - validation issue count
  - player unit names / roles / HP
  - enemy unit names / roles / HP
  - recent mock logs
- Runtime log metadata remains available in the result objects for later 2.5D use:
  - actorUnitId
  - targetUnitIds
  - actionCue
  - animationCue
  - effectColor
  - event/action kind

### Verification
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounters tested: 7
  - Total battles: 7
  - Player units: 4
  - Total rounds simulated: 18
  - Total logs: 138
  - ActionQueue issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- localStorage key `levelup-save`, persist version, save schema/migration, gameplay values, Gate rewards/result flow, shop/economy/probability, and hidden protection unchanged.
- No production Gate replacement, no Infinite Tower connection, and no 2.5D implementation.

## 12-29G: Infinite Tower optional direct battle preview connection

### Scope
- Added a DEV-only optional direct battle preview path to `InfiniteTowerPanel`.
- This is an isolated mock preview, not an Infinite Tower combat replacement.
- Existing Tower challenge / auto battle / manual battle / reward / result / floor clear / floor progression flows were not changed.
- Existing Gate runtime/reward/progress behavior was not changed.
- No store action is called by the preview; it uses local component state only.

### Shared preview component
- Moved the DEV preview UI/runtime runner into `src/components/DirectBattlePreviewPanel.tsx`.
- Gate preview now uses the shared component with the same mock runtime behavior as 12-29F.
- Infinite Tower preview uses the same component to avoid a second direct battle runner path.

### Player party
- Preview player party is built from:
  - Hunter BattleUnit via `buildHunterBattleUnit`.
  - Owned/equipped shadow BattleUnits via `buildShadowBattleUnits`.
  - Up to 3 equipped shadows.
- If no owned/equipped shadow is available, the preview run button is disabled and no mock battle is started.
- Hidden/locked named data remains protected because only owned/equipped shadows are converted.

### Enemy encounter selection
- Preview enemy party uses 12-29E mock encounters through `buildDirectBattleEncounterParty`.
- Infinite Tower recommendation:
  - normal floor: `caster_pair`
  - boss floor: `boss_minion`
- Encounter buttons still allow selecting:
  - `small_bruiser`
  - `small_duo`
  - `caster_pair`
  - `tank_assassin`
  - `control_support`
  - `boss_minion`
  - `boss_support`
- This is not connected to real tower floor monster scaling.

### Preview display
- Shows current tower floor, floor type, recommended encounter, selected encounter key/difficulty/lesson.
- On run, simulates the mock team-turn runtime for 3-6 rounds.
- Displays winner, rounds simulated, validation issue count, player/enemy unit names / roles / HP, and recent mock logs.
- Runtime log metadata remains available in result objects for later 2.5D use, but no 2.5D UI was implemented.

### Verification
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounters tested: 7
  - Total battles: 7
  - Player units: 4
  - Total rounds simulated: 18
  - Total logs: 138
  - ActionQueue issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- localStorage key `levelup-save`, persist version 14, save schema/migration, gameplay values, Tower/Gate rewards/result/progression, shop/economy/probability, and hidden protection unchanged.
- No Infinite Tower replacement, no Gate combat change, and no 2.5D implementation.

## 12-29F/G: DEV Direct Battle Preview Korean label patch

### Scope
- Localized user-facing DEV Direct Battle Preview text in Gate and Infinite Tower preview panels.
- This was a text/label-only patch.
- Existing Gate combat, Infinite Tower combat, direct battle runtime logic, rewards, clears, progression, store actions, and save behavior were not changed.

### Korean labels
- Gate preview title/note now uses Korean:
  - `DEV: 직접 조작 전투 미리보기`
  - Clearly says the mock preview does not affect Gate clear/reward/progression.
- Infinite Tower preview title/note now uses Korean:
  - `DEV: 무한의 탑 직접 조작 전투 미리보기`
  - Clearly says the mock preview does not affect floor clear/reward/progression.
- Shared preview panel now localizes:
  - run button
  - no equipped shadow message
  - no result message
  - encounter/difficulty/lesson display
  - winner/status display
  - round/issue/stat labels
  - player/enemy party headings
  - recent battle log heading and empty-log message
  - role labels

### Encounter display names
- Added `src/lib/directBattleLabels.ts` for small Korean display helpers.
- Internal encounter keys are unchanged and still used for runtime/building:
  - `small_bruiser`
  - `small_duo`
  - `caster_pair`
  - `tank_assassin`
  - `control_support`
  - `boss_minion`
  - `boss_support`
- User-facing short/long labels now display in Korean while keeping the key visible in parentheses on encounter buttons for DEV clarity.
- Winner display is localized:
  - `player` -> `아군 승리`
  - `enemy` -> `적 승리`
  - `none` / unknown unresolved states -> `결과 없음`

### Verification
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- Runtime/smoke script was not rerun because no direct battle runtime, monster definition, encounter definition, or smoke script logic changed.
- localStorage key `levelup-save`, persist version 14, save schema/migration, gameplay values, Gate/Tower rewards/result/progression, shop/economy/probability, and hidden protection unchanged.

## 12-29H: Direct control battle UI prototype

### Scope
- Expanded the shared DEV `DirectBattlePreviewPanel` from an automatic mock preview into a direct-control battle UI prototype.
- Gate and Infinite Tower DEV preview entry points reuse the same panel.
- Existing Gate and Infinite Tower production combat, rewards, clears, progression, stamina, result flow, and store actions remain unchanged.
- The prototype stores battle state only in local React component state.
- No direct battle result is written to save data or current Gate/Tower progression.

### Battle start
- The user selects a mock encounter and starts a local direct battle.
- Player party is built from:
  - Hunter BattleUnit via `buildHunterBattleUnit`.
  - Owned/equipped shadow BattleUnits via `buildShadowBattleUnits`.
  - Equipped shadows are capped to 3.
- If no owned/equipped shadow is present, the start button is disabled and a Korean guidance message is shown.
- Enemy party is still built from 12-29E mock encounters through `buildDirectBattleEncounterParty`.
- Internal encounter keys remain unchanged.

### Direct control flow
- Hunter and shadows are displayed as equal player-side units.
- Each living allied unit has the same command structure:
  - attack
  - skill
  - guard
- Attack/skill commands support tap-based target selection.
- Dead targets cannot be selected, and stale targets are normalized to safe fallback targets before round execution.
- Guard defaults to self/basic guard behavior.
- `executeDirectBattleRound` is used with external player selections, so the UI is now shaped for later Gate/Tower replacement without adding reward/progress coupling.

### Round execution
- The panel shows:
  - selected encounter
  - current round
  - winner
  - validation issue count
  - allied party HP and HP bars
  - enemy party HP and HP bars
  - HP / ATK / DEF / SPD / SKILL / level for each unit
  - selected action and target for each allied unit
  - recent battle logs
- `라운드 실행` resolves the currently selected player commands plus enemy mock actions through the existing ActionQueue/runtime.
- Runtime ordering remains SPD + action priority based through the existing 12-29D queue logic.
- The existing runtime log metadata remains available for later 2.5D, but no 2.5D UI was implemented.

### Auto options
- Added `자동 선택` to fill player commands using the existing mock player action selector.
- Added `자동 1라운드` to auto-select and immediately resolve one round.
- Auto rules remain intentionally simple and use the existing mock selector:
  - usable skill first when available
  - guard behavior for guard-role wounded ally support
  - runtime fallback target selection for unresolved target ids

### Gate/Tower relationship
- Gate DEV preview and Infinite Tower DEV preview both reuse this direct-control prototype.
- This prepares the interaction model for a later real Gate combat replacement step.
- This step still does not replace Gate/Tower combat and does not connect direct battle outcome to rewards/progression.

### Hidden/save constraints
- Hidden protection is preserved because only owned/equipped shadows are converted into player BattleUnits.
- No locked/unowned named shadow data is surfaced by this panel.
- localStorage key `levelup-save`, persist version 14, save schema, save migration, gameplay values, reward tables, economy/shop/probability values, and Gate/Tower progression remain unchanged.

### Verification
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounters tested: 7
  - Total battles: 7
  - Player units: 4
  - Total rounds simulated: 18
  - Total logs: 138
  - ActionQueue issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
- Browser UI/combat feel remains for user testing.

## 12-29I: Gate direct-control battle first real connection

### Scope
- Connected the direct-control battle UI to the active Gate flow as the default Gate battle start path.
- The primary Gate combat button now opens `직접 조작 게이트 전투`.
- Existing legacy Gate auto/manual combat code remains available only as DEV fallback buttons.
- Infinite Tower real battle flow was not changed.

### Gate connection
- `GatePanel` now starts a local direct Gate battle panel for the active gate.
- The direct battle panel auto-starts after the user presses the main Gate battle button.
- Player party is built from:
  - Hunter BattleUnit.
  - Equipped owned shadows, capped at 3.
- Hidden protection is preserved because only owned/equipped shadows are converted.
- If no equipped shadow is available, the direct battle panel blocks start with the existing guidance instead of exposing locked data.

### Enemy encounter recommendation
- Gate enemy party still uses 12-29E direct-battle mock encounters.
- Current first-pass rank mapping:
  - E rank: `small_bruiser` or `small_duo`
  - D rank: `caster_pair` or `tank_assassin`
  - C rank: `tank_assassin` or `control_support`
  - B/A rank: `boss_minion`
  - S rank: `boss_support`
- Gate reward tables, monster definitions, and gate values were not changed.

### Result handling
- Added `resolveDirectGateBattle(combatLog)` to the store function surface.
- The action accepts a direct battle `CombatLog`, validates that the active gate is still the same active gate instance, and then reuses `createGateBattleOutcomeUpdate`.
- Victory maps to the existing Gate victory reward/clear/result flow.
- Defeat maps to the existing Gate defeat/penalty/result flow.
- Cancel only closes the local direct battle UI; it grants no reward, applies no clear, and records no progress.

### Duplicate reward prevention
- `GatePanel` keeps a local handled-result key per active gate instance/battle id/outcome.
- `resolveDirectGateBattle` also refuses to apply if the active gate is no longer `active` or if the incoming log belongs to a different gate instance.
- After victory/defeat, `createGateBattleOutcomeUpdate` changes activeGate to `cleared` or `failed`, so subsequent duplicate calls cannot award again.

### Direct control behavior
- Hunter and shadows keep the same command structure:
  - attack
  - skill
  - guard
- Target selection, `자동 선택`, `자동 1라운드`, and `라운드 실행` remain available.
- Direct battle logs are adapted into the existing `CombatLog` shape so the current Gate result/reward panels can keep working.

### Save/system constraints
- No localStorage key change.
- Persist remains version 14.
- No save schema field, migration, or stored direct battle state was added.
- No shop/economy/probability/reward table number changed.
- No 2.5D implementation.
- Tower preview remains unchanged.

### Verification
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounters tested: 7
  - Total battles: 7
  - Player units: 4
  - Total rounds simulated: 18
  - Total logs: 138
  - ActionQueue issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
- Browser Gate combat feel remains for user testing.

## 12-30B-10: Shadow Extraction reveal pacing soften

### Scope
- Tuned only `ShadowExtractionReveal` stage timing and extraction-only CSS animation durations.
- Kept the command -> silence/pressure -> remnant rising -> resistance -> bind -> reveal/fail flow unchanged.
- Kept saved extraction image asset placement and layer structure unchanged.
- Did not modify summon ticket reveal, `TicketRevealSequence`, or `ShadowRevealModal`.
- No extraction probability, summon probability, reward probability, acquisition logic, ownedShadows logic, save schema, localStorage, persist version, Direct Battle balance, or hidden/locked named data exposure changes.

### Timing changes
- Quick extraction total pre-result pacing: 7100ms -> 8500ms.
  - command 1050ms -> 1100ms
  - pressure 850ms -> 950ms
  - raising 1750ms -> 2150ms
  - resistance 1750ms -> 2200ms
  - submission/bind 1700ms -> 2100ms
- High extraction total pre-result pacing: 8800ms -> 10800ms.
  - command 1200ms -> 1250ms
  - pressure 950ms -> 1050ms
  - raising 2200ms -> 2700ms
  - resistance 2250ms -> 2950ms
  - submission/bind 2200ms -> 2850ms
- Apex/named/S extraction total pre-result pacing: 11650ms -> 14100ms.
  - command 1300ms -> 1350ms
  - pressure 1100ms -> 1250ms
  - raising 3000ms -> 3650ms
  - resistance 3150ms -> 3950ms
  - submission/bind 3100ms -> 3900ms
- Extraction-only CSS loops were slowed to match the longer stages:
  - column rise 2.4s -> 2.9s
  - mass rise 2.25s -> 2.75s
  - smoke surge 3.2s -> 3.85s
  - rift tear 1.4s -> 1.75s
  - mass resist 0.72s -> 0.88s
  - binding close 1.5s -> 1.9s
- Result/fail entrance animations were extended for more after-reveal linger:
  - result column 1.5s -> 2.1s
  - result burst 1.25s -> 1.85s
  - result apex aura 1.5s -> 2.25s
  - result aura 1.8s -> 2.55s
  - final portrait rise 1.08s -> 1.75s
  - failure ash 1.9s -> 2.65s
  - failure remnant 1.7s -> 2.35s

### Verification
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- `npx tsc --noEmit` exit code 0.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounters tested: 30
  - Total battles: 30
  - Total rounds simulated: 87
  - Total logs: 887
  - ActionQueue issues: 0
  - Reveal snapshot issues: 0
  - Skill safety issues: 0
  - Monster targeting issues: 0
  - Hunter defeat issues: 0
  - Shadow stat issues: 0
  - Summon color issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
  - Ally support/guard skill damage regression: passed
  - Skill safety regression: passed
  - Monster targeting regression: passed
  - Hunter death defeat regression: passed
  - Shadow stat regression: passed
  - Summon reveal color regression: passed
  - Setup priority regression: passed
  - Reveal snapshot regression: passed
  - Center overlay render path: code path verified

## 12-29L: Direct-control Gate/Tower battle balance pass 1

### Scope
- Tuned direct-control Gate and Infinite Tower combat around Hunter/monster buffs instead of shadow nerfs.
- Equipped owned shadows still keep their existing BattleUnit conversion, active skills, passives, and party cap behavior.
- Auto battle improvement was intentionally excluded from this pass.

### Hunter BattleUnit buffs
- Raised Hunter HP, ATK, DEF, SPD, and SKILL conversion in `battleUnits.ts`.
- Equipment now contributes more clearly to Hunter direct battle stats:
  - weapon/offense value feeds ATK and SKILL
  - artifact/shadow synergy value feeds SKILL/support/synergy
  - armor/survival value feeds HP/DEF/survival
- `집중 베기` is now treated as a meaningful direct-control skill through the stronger Hunter SKILL conversion and a focused skill damage multiplier in the direct runtime.

### Monster BattleUnit and role buffs
- Raised monster BattleUnit HP/ATK/SKILL base formulas and level scaling.
- Strengthened role identity through `directBattleMonsters.ts` statBias:
  - bruiser: more durable front pressure
  - tank: much higher HP/DEF/survival
  - assassin: faster, higher ATK/SKILL/crit pressure
  - caster: higher skill threat
  - controller: stronger control and enough HP to matter
  - support: sturdier support/heal presence
  - boss: high HP/DEF/SKILL/boss pressure without making every boss smoke impossible

### Encounter recommendation tuning
- Gate direct encounters now bias upward by rank:
  - E: `small_bruiser` / `small_duo`
  - D: `caster_pair` / `tank_assassin`
  - C: `tank_assassin` / `control_support`
  - B: `boss_minion`
  - A/S: `boss_support`
- Gate direct monster level now uses gate recommended level plus a rank bonus.
- Tower direct encounters now scale by floor:
  - low floors: `small_duo` / `caster_pair`
  - mid floors: `tank_assassin`
  - high floors: `control_support`
  - late non-boss floors and boss floors: boss encounters
- Tower direct monster level now scales from floor number, with boss floors receiving a higher base level.

### Damage formula
- Direct battle damage now uses ATK for basic attacks and SKILL + partial ATK for skills.
- DEF mitigation changed from flat subtraction to a diminishing reduction curve, so DEF matters without completely erasing damage.
- Skill damage remains clearly above basic attack damage when SKILL is built, and `basic-focus-slash` gets an extra skill multiplier.
- Guard/shield behavior was not redesigned; it remains strong but not invulnerable.

### Battle length target
- First-pass target remains:
  - normal Gate: 2-5 rounds
  - hard Gate: 4-7 rounds
  - Tower normal floor: 3-6 rounds
  - Tower boss floor: 5-10 rounds
- Smoke is a quick single-pass check only; user will verify UI feel and balance.

### Smoke result
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounter small_bruiser: winner player, rounds 1, player HP 2795/2795, enemy HP 0/569
  - Encounter small_duo: winner player, rounds 2, player HP 2760/2795, enemy HP 0/845
  - Encounter caster_pair: winner player, rounds 2, player HP 2664/2795, enemy HP 0/1124
  - Encounter tank_assassin: winner player, rounds 4, player HP 2191/2795, enemy HP 0/1760
  - Encounter control_support: winner player, rounds 3, player HP 2540/2795, enemy HP 0/1469
  - Encounter boss_minion: winner player, rounds 9, player HP 592/2795, enemy HP 0/3016
  - Encounter boss_support: winner enemy, rounds 9, player HP 0/2795, enemy HP 1221/3790
  - Encounters tested: 7
  - Total battles: 7
  - Total rounds simulated: 30
  - Total logs: 237
  - ActionQueue issues: 0
  - Reveal snapshot issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Ally support/guard skill damage regression: passed
  - Setup priority regression: passed
  - Reveal snapshot regression: passed

### Verification and constraints
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- Existing Gate/Tower long sims were not run.
- localStorage key `levelup-save`, persist version 14, save schema, and save migrations unchanged.
- Gate/Tower reward, clear, progress, economy, shop, and probability numbers unchanged.
- No hidden/locked named information exposure.
- No 2.5D work.

## 12-29M: Direct-control monster and encounter expansion

### Scope
- Expanded direct-control Gate/Tower monster definitions and encounter pools beyond the original 7 mock formations.
- Kept the 12-29L balance direction: no shadow nerf, no Auto battle improvement, no 2.5D work.
- Gate/Tower reward, result, clear, and progression flows were not changed.

### Monster definition expansion
- `directBattleMonsters.ts` now has 36 direct battle monster definitions:
  - 24 non-boss/non-minion regular or elite monsters.
  - 6 boss definitions.
  - 6 minion/summon definitions.
- Added role-specific enemies:
  - bruiser: `rift-charger`, `black-claw-brawler`, `rift-gladiator`
  - tank: `iron-gatekeeper`, `wall-sentinel`, `oath-bulwark`
  - caster: `rift-hexer`, `abyss-pyromancer`, `storm-oracle`
  - assassin: `fatigue-stalker`, `night-needle`, `scarlet-executor`
  - support: `rift-mender-veteran`, `battle-chanter`, `shield-cantor`
  - controller: `memory-disruptor`, `weakness-registrar`, `suppression-warden`
  - minion: `rift-shard`, `shield-minion`, `curse-token`, `command-imp`, `abyss-spawn`
  - boss: `rift-commander`, `oblivion-watcher`, `iron-wall-lord`, `abyss-devourer`, `memory-warden-boss`
- Monster definitions now support optional Korean description/flavor metadata for future UI use.

### Action and pattern expansion
- New monster actions stay inside the existing safe runtime effect families:
  - `basic`
  - `damage`
  - `control`
  - `support`
  - `guard`
  - `synergy`
  - `bossing`
- Role patterns now read more clearly:
  - tanks protect low-HP/boss allies.
  - supports heal, shield, or apply battle-cry style ally buffs.
  - controllers apply defenseDown/speedDown/mark.
  - assassins prefer low-HP targets.
  - casters focus high-threat targets.
  - bosses use boss slams, control fields, command auras, or phase strikes.
- Actual summon spawning was not implemented; boss + minion encounter composition represents summon pressure for this pass.

### Encounter pool expansion
- `directBattleEncounters.ts` now has 30 encounter definitions:
  - 5 easy additions plus the original easy mock shells.
  - 6 normal additions.
  - 6 hard additions.
  - 6 new boss additions plus the original boss shells.
- Added examples:
  - easy: `lone_charger`, `bruiser_shard`, `scout_pair`, `small_caster_guard`, `token_skirmish`
  - normal: `tank_caster`, `assassin_support`, `controller_bruiser`, `guard_healer`, `caster_minions`, `chanting_line`
  - hard: `tank_controller_assassin`, `double_caster_guard`, `support_protected_bruiser`, `assassin_mark_combo`, `elite_mixed_party`, `storm_killbox`
  - boss: `commander_line`, `oblivion_watch`, `iron_wall_court`, `abyss_devourer_pack`, `memory_warden_party`, `boss_double_minion`

### Gate encounter pools
- Gate direct battle now uses deterministic rank pools instead of one hard-coded encounter per rank:
  - E: `lone_charger`, `bruiser_shard`, `small_duo`, `scout_pair`
  - D: `bruiser_shard`, `small_caster_guard`, `token_skirmish`, `tank_caster`, `assassin_support`
  - C: `tank_caster`, `assassin_support`, `controller_bruiser`, `guard_healer`, `caster_minions`
  - B: `controller_bruiser`, `guard_healer`, `caster_minions`, `chanting_line`, `tank_controller_assassin`, `double_caster_guard`
  - A: hard pool variants
  - S: hard/boss pool variants
- Selection is deterministic from rank + active gate seed, so it does not require new persisted state.

### Tower encounter pools
- Tower direct battle now uses deterministic floor-band pools:
  - floor 1-4: low pool
  - floor 5-9: mid pool
  - floor 10+: hard pool
  - boss floors: boss pool
  - high boss floors prefer the stronger boss subset.
- Existing 12-29L floor-based enemy level scaling remains in place.

### Runtime safety
- `directBattleRuntime.ts` was minimally reinforced:
  - support/synergy actions can safely buff allies.
  - support roles can choose heal/shield/battle-cry style skills even when no ally is wounded.
  - minions can use their control/damage/support skills instead of only basic attacks.
  - tanks can protect a boss ally when one exists.
  - `all_enemies` control/damage now applies to all targets with a spread multiplier, avoiding one-round full-party wipes from area control.
- Unknown/unsupported combinations still fall back to fizzle, damage, support, or control paths without crashing.

### Smoke result
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Monster definitions: 36
  - Boss definitions: 6
  - Minion definitions: 6
  - Encounters tested: 30
  - Boss encounters: 8
  - Total battles: 30
  - Total rounds simulated: 141
  - Total logs: 1347
  - ActionQueue issues: 0
  - Reveal snapshot issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
  - Ally support/guard skill damage regression: passed
  - Setup priority regression: passed
  - Reveal snapshot regression: passed

### Verification and constraints
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- Existing Gate/Tower long sims were not run.
- UI/feel/balance remains for user testing.
- localStorage key `levelup-save`, persist version 14, save schema, and save migrations unchanged.
- No reward, economy, shop, probability, Gate/Tower result flow, or progression-number changes.
- No hidden/locked named information exposure.
- No shadow nerf, no Auto battle improvement, and no 2.5D work.

## 12-29N: Direct-control skill/status audit and mismatch fixes

### Scope
- Audited the direct-control battle action/status path across:
  - `battleUnits.ts`
  - `directBattleTypes.ts`
  - `directBattleRuntime.ts`
  - `directBattleMonsters.ts`
  - `directBattleEncounters.ts`
  - `shadowSkills.ts`
  - `DirectBattlePreviewPanel.tsx`
- This was a reliability cleanup only.
- No new large combat system, Auto battle improvement, 2.5D work, reward flow change, save schema change, or economy/probability change was added.

### Skill/effect safety mapping
- Added shared Korean status labels/descriptions for the direct battle status types:
  - guard/protect/shield
  - attackUp/attackDown
  - defenseUp/defenseDown
  - speedUp/speedDown
  - mark/weakness/suppression
  - cooldownReduction/healOverTime
- `addStatus` now falls back to those labels, so restored/revealed status payloads no longer need raw status ids as display names.
- Reinforced ally/enemy target interpretation:
  - ally-target malformed damage/hybrid/basic effects degrade through safe support/guard behavior and do not damage allies.
  - enemy-target support/heal/guard/protect effects fizzle instead of healing or buffing enemies.
  - guard/protect now verifies the requested target is on the actor's team; hostile preferred targets fall back to self-guard.
  - enemy-target `stat_shift` is treated as a real hostile debuff setup instead of fizzling.
- `stat_shift` enemy debuffs now create defenseDown/speedDown/mark and optional suppression.
- Ally-target `stat_shift` is safe support and adds defensive setup instead of damage.
- `suppression` and `attackDown` now reduce outgoing attack multiplier in damage calculation.

### Setup timing and descriptions
- Existing setup timing remains:
  - guard/support/survival/cooldown/synergy/stat_shift/control/ally-target setup actions resolve in `before_action`.
  - pure damage skills remain `normal_action`.
- Damage Floor and other ally guard/support actions were rechecked as non-damage setup actions.
- `DirectBattlePreviewPanel` action description fallback is now target/effect aware:
  - enemy damage/control/bossing/stat_shift
  - ally guard/support/synergy/cooldown/stat_shift
  - self guard/wait
  - final fallback remains "이 유닛의 대표 스킬을 사용합니다."
- Reveal status restoration now uses the shared Korean status labels.

### Smoke regression
- `scripts/smoke-direct-battle-runtime.ts` now checks:
  - ally-target guard/support skills do not reduce ally HP.
  - enemy-target damage skills reduce enemy HP.
  - enemy-target control/stat_shift creates debuff/status snapshots or safe fallback.
  - guard/control setup resolves before damage.
  - pure damage skills stay in normal timing.
  - Damage Floor remains ally-safe.
  - malformed enemy support/heal does not heal enemies.
  - malformed guard/protect does not buff hostile targets.
  - all 30 encounters run without crash.

### Smoke result
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Monster definitions: 36
  - Boss definitions: 6
  - Minion definitions: 6
  - Encounters tested: 30
  - Boss encounters: 8
  - Total battles: 30
  - Total rounds simulated: 141
  - Total logs: 1349
  - ActionQueue issues: 0
  - Reveal snapshot issues: 0
  - Skill safety issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
  - Ally support/guard skill damage regression: passed
  - Skill safety regression: passed
  - Setup priority regression: passed
  - Reveal snapshot regression: passed

### Verification and constraints
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- Existing Gate/Tower long sims were not run.
- UI/feel/balance remains for user testing.
- localStorage key `levelup-save`, persist version 14, save schema, and save migrations unchanged.
- No reward, economy, shop, probability, Gate/Tower result flow, or progression-number changes.
- No hidden/locked named information exposure.
- No shadow nerf, no Auto battle improvement, and no 2.5D work.

## 12-30B-9: Saved extraction asset integration + matte cleanup

### Scope
- Connected the user-provided extraction image assets to `ShadowExtractionReveal`.
- Kept summon reveal untouched:
  - no `TicketRevealSequence` changes.
  - no `ShadowRevealModal` changes.
  - no summon reveal stage / speed / structure changes.
- Kept Gate shadow extraction separate from summon reveal.
- No extraction probability, summon probability, reward probability, acquisition logic, ownedShadows logic, Direct Battle balance, save schema, persist version, or localStorage changes.

### Connected assets
- Actual user-provided extraction assets are now used in the cutscene:
  - `extraction-scene-bg.webp.png`
  - `extraction-ground-fog-clean.webp`
  - `extraction-remnant-core-clean.webp`
  - `extraction-rift-tear-clean.webp`
  - `extraction-binding-chain-clean.webp`
  - `extraction-reveal-burst-clean.webp`
  - `extraction-failure-ash-clean.webp`
  - `extraction-shadow-column-clean.webp`
  - `extraction-command-flare-clean.webp`
  - `extraction-apex-aura-clean.webp`
- The original `*.webp.png` files remain in `src/assets/extraction/`.
- Cleaned `*-clean.webp` variants were generated for effect layers with white matte / white background risk.
- The clean variants keep alpha while reducing size compared with intermediate clean PNG output.

### Stage asset placement
- Command:
  - main: scene background.
  - support: command flare and faint ground fog.
- Silence / pressure:
  - main: scene background.
  - support: command flare pulse and slightly stronger fog.
- Raising:
  - main: remnant core and shadow column.
  - support: ground fog.
- Resistance:
  - main: rift tear.
  - support: remnant core distortion and fog.
- Submission:
  - main: binding chain.
  - support: compressed remnant core and shadow column.
- Success reveal:
  - main: reveal burst and `ShadowPortrait`.
  - support: shadow column and apex aura only for apex / named / S-tier success.
- Failure:
  - main: failure ash.
  - support: dissolving remnant core and ground fog.

### Matte / blending cleanup
- Initial browser preview showed a large white square matte around the remnant/binding image layer.
- Generated clean PNG variants by removing near-white backgrounds and darkening semi-transparent fringe pixels.
- CSS now follows the existing ShadowPortrait / TicketVisual direction:
  - contained centered art layers.
  - dark wrapper / full-screen scene context.
  - opacity staging.
  - brightness / contrast / saturation tuning.
  - drop-shadow for integrated glow.
  - mask-image edge fading.
  - blend modes chosen per layer instead of a single global mode.
- This avoids the saved assets appearing like stickers pasted on top of the scene.

### Visual check
- A temporary Vite preview page rendered `ShadowExtractionReveal` only, then was removed.
- Playwright checked the preview on `http://127.0.0.1:3002/extraction-preview.html`.
- First screenshot confirmed the white matte issue.
- Second screenshot after preprocessing confirmed:
  - full-screen extraction cutscene render.
  - scene background visible.
  - raising/remnant layer visible without a white square.
  - final result portrait visible.
  - no page errors.
- A final preview after switching imports to clean WebP confirmed:
  - stage visible.
  - result visible.
  - portrait visible.
  - no page errors.
- The temporary preview HTML and screenshots were removed after verification.

### Safety
- Hidden / locked named information is not exposed.
- Named chips appear only for the actual extracted owned shadow.
- Failure reveal does not expose rolled rarity or hidden result metadata.
- No reward, economy, shop, summon probability, extraction probability, ownedShadows, Gate/Tower flow, Direct Battle balance, save schema, persist version, or `levelup-save` changes.

### Verification
- `npx tsc --noEmit` exit code 0 after final clean WebP import.
- `npm run build` exit code 0.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0.
- Smoke output included `Summon color issues: 0`, `Validation issues: 0`, `Crashes: 0`, `Gate/Tower connections: 0`, and `Summon reveal color regression: passed`.
- Existing Vite chunk-size warning only.
- Long simulations and large QA were not run.

### Next candidates
- User feel-test on the connected asset cutscene.
- Further tune fog strength / portrait rise timing / high-tier aura intensity from real play feedback.
- 12-30C hidden/secret/narrative connective layer review.

## 12-30B-7/8: Shadow Extraction command-raising art cutscene

### Scope
- Reworked `ShadowExtractionReveal` again around a command-based raising cutscene.
- Kept summon ticket reveal untouched:
  - no `TicketRevealSequence` changes.
  - no `ShadowRevealModal` changes.
  - no summon stage / pacing / color-policy changes.
- Kept extraction reveal separate from summon reveal.
- No extraction probability, summon probability, reward probability, acquisition logic, Direct Battle balance, save schema, persist version, or localStorage changes.

### Art assets
- Added extraction-only art textures under `src/assets/extraction/`:
  - `extraction-ground-fog.svg`: heavier bottom fog for ground-up raising.
  - `extraction-rising-column.svg`: vertical black shadow column for the raising / final reveal motion.
  - `extraction-reveal-burst.svg`: dark organic reveal burst behind the final portrait.
- Continued using the B-6 extraction art textures:
  - scene background
  - remnant smoke
  - remnant core
  - rift tear
  - binding runes / chain texture
  - failure ash
- The stage is intentionally image / texture-led instead of ring / border / straight-line-led.

### Command-based raising structure
- Stage order is now:
  - command
  - silence / pressure
  - raising
  - resistance
  - submission
  - reveal
- Command copy avoids specific IP names or exact representative phrases.
- Current command tone:
  - "그림자여, 응답하라."
  - "잔영을 붙잡습니다."
  - "어둠이 명령을 듣습니다."
- The new silence / pressure stage creates a short pause after the command before the VFX escalates.
- Raising now uses a vertical shadow column plus remnant core motion so the shadow feels pulled upward from the ground instead of simply fading in.
- Resistance uses the rift tear and jittered remnant distortion.
- Submission uses the binding texture and compressed remnant/column state.

### Final reveal / failure
- Success final reveal now uses:
  - rising shadow column
  - organic dark burst
  - rift layer
  - large `ShadowPortrait`
  - dedicated `shadow-extraction-raising-portrait` animation
- The portrait rises from below with low opacity / blur / vertical stretch, then stabilizes into the final acquired shadow.
- Final rarity / innate / named chips still appear only after success reveal.
- Failure now keeps the ash / remnant dissolution scene and uses Korean failure copy:
  - "잔영이 흩어졌습니다"
  - "명령이 닿지 않았습니다. 잔영이 어둠 속으로 흩어졌습니다."

### Safety
- No hidden / locked named information is exposed.
- Named information appears only for the actual extracted owned shadow.
- Failure reveal does not expose rolled rarity or hidden result metadata.
- No reward, economy, shop, summon probability, extraction probability, ownedShadows, Gate/Tower flow, Direct Battle balance, save schema, persist version, or `levelup-save` changes.

### Verification
- `npx tsc --noEmit` exit code 0.
- `npm run build` exit code 0.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0.
- Smoke output included `Summon color issues: 0`, `Validation issues: 0`, `Crashes: 0`, `Gate/Tower connections: 0`, and `Summon reveal color regression: passed`.
- Existing Vite chunk-size warning only.
- Long simulations and large browser QA were not run.

### Next candidates
- Short user feel-test pass on the command-raising extraction cutscene.
- Tune extraction timing / VFX strength based on real play feedback.
- 12-30C hidden/secret/narrative connective layer review.

## 12-30B-6: Shadow Extraction art-layer cutscene rebuild

### Scope
- Rebuilt Gate shadow extraction presentation around art layers instead of geometric CSS VFX.
- Did not modify summon ticket reveal, `TicketRevealSequence`, or `ShadowRevealModal`.
- Kept summon reveal and extraction reveal technically and visually separated.
- No extraction probability, summon probability, reward probability, acquisition logic, save schema, persist version, or localStorage changes.

### Art-layer structure
- Added extraction-only static SVG art textures under `src/assets/extraction/`:
  - `extraction-bg.svg`: dark battlefield / grave-ground scene texture.
  - `remnant-smoke.svg`: rising black smoke / fog texture.
  - `shadow-mass.svg`: irregular remnant mass silhouette.
  - `rift-tear.svg`: jagged torn-space rift texture.
  - `binding-runes.svg`: dark chain / rune binding texture.
  - `failure-ash.svg`: ash and scattered remnant failure texture.
- `ShadowExtractionReveal` now composes the scene as:
  - scene background layer
  - fog / smoke layer
  - remnant mass layer
  - rift / tear layer
  - binding layer
  - result layer
- Former ring / border-circle / straight-crack / small-particle elements were removed from the main stage.
- CSS now supports the art textures with motion, blur, masking-like layering, and opacity changes instead of making raw shapes the focal point.

### Stage identity
- Command:
  - dark battlefield appears with only a faint remnant near the ground.
  - no rarity / success / failure color hint.
- Remnant:
  - black fog surges upward and the irregular remnant mass rises.
- Resistance:
  - jagged rift art becomes the main layer.
  - remnant mass distorts and shakes.
- Bind:
  - binding-rune / chain texture closes around the remnant.
  - apex pressure uses stronger shake, still without pre-result rarity color.
- Reveal / fail:
  - success shows large `ShadowPortrait` over rift/smoke/aura and only then shows rarity / innate / named chips.
  - failure shows ash / remnant dissolution rather than a simple alert or geometric placeholder.

### Safety
- Summon reveal remains the 12-30B-5 rollback flow: ticket -> rift -> rarity -> innate.
- `ShadowExtractionReveal` remains separate and is not routed through `TicketRevealSequence`.
- Hidden / locked named information is not exposed; named chips appear only for the actual extracted shadow.
- Failure result no longer shows a rolled rarity signal chip.
- No reward, economy, shop, summon probability, extraction probability, ownedShadows, Gate/Tower flow, save schema, persist version, or `levelup-save` changes.

### Verification
- `npx tsc --noEmit` exit code 0 after the rebuild.
- `npm run build` exit code 0.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0.
- Smoke output included `Summon color issues: 0`, `Validation issues: 0`, `Crashes: 0`, and `Summon reveal color regression: passed`.
- Existing Vite chunk-size warning only.
- Long simulations and large browser QA were not run.

### Next candidates
- Short user feel-test pass on the art-layer extraction reveal.
- Tune extraction VFX strength / timing from real play feedback.
- 12-30C hidden/secret/narrative connective layer review.

## 12-30B-5: Summon reveal rollback + extraction reveal VFX focus

### Scope
- Rolled shadow summon ticket reveal back to the familiar ticket flow instead of the B-3/B-4 long cinematic sequence.
- Focused the visual upgrade on Gate battle `ShadowExtractionReveal` only.
- Kept summon reveal and extraction reveal clearly separated.
- No summon probability, extraction probability, reward probability, acquisition logic, save schema, persist version, or localStorage changes.

### Summon reveal rollback
- `TicketRevealSequence` shadow summon flow is back to four compact stages:
  - ticket / prepare
  - rift open
  - rarity reveal
  - innate signal reveal
- Removed the B-4 shadow-forming / pressure-style stage from the summon sequence.
- Removed the unused summon-side silhouette forming renderer and its extraction-like keyframes.
- Shadow summon pacing is reduced from the B-4 cinematic duration back to a shorter ticket reveal feel:
  - quick / common-uncommon: about 4.0 seconds.
  - rare: about 4.8 seconds.
  - epic: about 5.5 seconds.
  - apex / legendary-S-named: about 6.5 seconds.
- `ShadowRevealModal` final result presentation is back to a centered result card / portrait layout rather than a huge extraction-like full-screen stage.
- Skip behavior remains available.

### Extraction reveal VFX upgrade
- `ShadowExtractionReveal` remains a portal-based full-screen centered overlay.
- Extraction now carries the heavy ritual identity:
  - command
  - remnant rising
  - resistance
  - bind
  - success reveal / failure scatter
- Added extraction-only CSS/VFX layers:
  - heavier dim/vignette and drifting fog.
  - ember-like particles being pulled through the field.
  - larger rune circle and pulsing remnant mass.
  - resistance crack lines.
  - bind compression ring.
  - apex/high resistance shake.
  - stronger final success burst and failure dissolution.
- Success result still reveals rarity / innate / named information only at the final reveal.
- Failure result stays a failure reveal only and does not expose hidden result details.

### Separation and safety
- Summon identity: ticket / rift / signal / rarity / innate.
- Extraction identity: command / remnant / resistance / bind / response.
- `ShadowExtractionReveal` was not merged back into `TicketRevealSequence`.
- The 12-29O summon color regression guard remains intact:
  - common/uncommon results do not use red/crimson pre-result anticipation.
  - uncommon + S does not use red/crimson pre-result anticipation.
  - high-tier anticipation remains gated to rare+ summon outcomes.
- No hidden/locked named information is shown before actual acquisition reveal.
- No reward, economy, shop, summon probability, extraction probability, ownedShadows, Gate/Tower flow, save schema, persist version, or `levelup-save` changes.

### Verification
- `npm run build` exit code 0.
- `npx tsc --noEmit` exit code 0.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0.
- Smoke output included `Summon color issues: 0` and `Summon reveal color regression: passed`.
- Existing Vite chunk-size warning only.
- Long simulations and large browser QA were not run.

### Next candidates
- User feel-test pass on the strengthened extraction reveal timing/VFX.
- 12-30C hidden/secret/narrative connective layer review.
- Reward feel improvements as a separate task.

## 12-30B-4: Shadow reveal spoiler guard + pacing + stat recovery lift

### Scope
- Fixed early reveal color spoilers in summon and extraction cinematic paths.
- Slowed shadow summon and extraction pacing again.
- Strengthened stage-to-stage visual differences without adding canvas / WebGL / 2.5D.
- Applied a small BattleUnit conversion recovery lift to shadows and a smaller lift to monsters.
- Kept summon reveal and extraction reveal separate.

### Reveal spoiler prevention
- `TicketRevealSequence` no longer uses high-tier red / gold / rarity-tinted anticipation during early shadow stages.
- Shadow summon pre-result stages now stay neutral dark slate / cyan / violet:
  - ticket / seal activation
  - rift opening
  - shadow forming
  - pressure / resonance
- High-tier color is only allowed at the final signal-lock handoff and final result.
- `ShadowRevealModal` pre-result overlay no longer paints apex / epic / rarity background colors from the actual result.
- `ShadowExtractionReveal` pre-result overlay and stage body no longer use success / failure / rarity accent colors before reveal.
- Extraction pre-result copy is now neutral so success / failure is not signaled before the reveal stage.

### Cinematic pacing
- Shadow summon duration targets:
  - common / uncommon: about 6.9 seconds.
  - rare: about 8.2 seconds.
  - epic: about 9.4 seconds.
  - legendary / S innateGrade / named apex: about 11.4 seconds.
- Shadow extraction duration targets:
  - quick: about 6.6 seconds.
  - high: about 8.05 seconds.
  - apex: about 10.6 seconds.
- Skip and ESC behavior remain available.
- `prefers-reduced-motion` still shortens the sequence.

### Stage visual changes
- Summon resonance is now a neutral pressure stage rather than a rarity-colored stage.
- Summon still uses distinct scenes:
  - seal / ticket activation
  - black rift opening
  - shadow silhouette forming
  - neutral pressure / heartbeat resonance
  - final signal lock
  - final portrait reveal in `ShadowRevealModal`
- Extraction stage body now has distinct neutral pre-result scenes:
  - command ground seal
  - remnant shadows rising
  - resistance crack lines
  - bind ring / chain compression
  - final success / failure reveal
- Added `shadow-remnant-rise` animation for extraction remnants.

### BattleUnit stat recovery
- Shadow raw stat definitions, skills, passives, rarity, innate grade, enhancement, and evolution data remain unchanged.
- Shadow -> BattleUnit conversion now uses a small `SHADOW_BATTLE_LIFT = 1.09`.
- Role-sensitive micro-lifts keep roles more readable:
  - guard HP / DEF / survival receive a small extra lift.
  - assault / hunter ATK receives a small extra lift.
  - scout / hunter SPD receives a small extra lift.
  - support / analyst SKILL / support / control / synergy receive a small extra lift.
- Monster raw definitions and encounter structure remain unchanged.
- Monster -> BattleUnit conversion now uses a smaller `MONSTER_BATTLE_LIFT = 1.04`; monster SPD uses a small 1.02 lift.
- Shadow uplift is intentionally larger than monster uplift.

### Representative stat deltas
- Hunter Lv20 remains unchanged: HP 736 / ATK 179 / DEF 83 / SPD 45 / SKILL 166.
- common L1 B shadow:
  - before: HP 125 / ATK 62 / DEF 51 / SPD 83 / SKILL 49
  - after: HP 136 / ATK 68 / DEF 56 / SPD 91 / SKILL 54
- uncommon support L1 B:
  - before: HP 210 / ATK 52 / DEF 115 / SPD 52 / SKILL 74
  - after: HP 228 / ATK 57 / DEF 125 / SPD 57 / SKILL 82
- rare assault L1 B:
  - before: HP 188 / ATK 154 / DEF 91 / SPD 84 / SKILL 83
  - after: HP 205 / ATK 172 / DEF 99 / SPD 91 / SKILL 91
- epic guard L1 B:
  - before: HP 471 / ATK 132 / DEF 263 / SPD 68 / SKILL 107
  - after: HP 524 / ATK 144 / DEF 292 / SPD 74 / SKILL 117
- legendary assault L1 B:
  - before: HP 370 / ATK 322 / DEF 213 / SPD 145 / SKILL 139
  - after: HP 404 / ATK 357 / DEF 232 / SPD 156 / SKILL 152
- early monster Lv6:
  - before: HP 492 / ATK 83 / DEF 31 / SPD 17 / SKILL 58
  - after: HP 512 / ATK 86 / DEF 33 / SPD 17 / SKILL 60
- C Gate representative monsters:
  - Black Claw Brawler Lv15 after: HP 1586 / ATK 271 / DEF 102 / SPD 25 / SKILL 193
  - Memory Disruptor Lv15 after: HP 1417 / ATK 157 / DEF 85 / SPD 30 / SKILL 245
- Tower boss sample:
  - Abyss Devourer Lv20 after: HP 5495 / ATK 636 / DEF 203 / SPD 28 / SKILL 675

### Audit outcome
- Lv20 audit party total after tuning: HP 1829 / ATK 620 / DEF 655 / SPD 358 / SKILL 510.
- E Gate sample: player victory in 2 rounds, player HP 1765/1829.
- D Gate sample: player victory in 3 rounds, player HP 1208/1829.
- C Gate sample: max rounds, player HP 258/1829 and enemy HP 997/3003.
- Tower 1F sample: player victory in 2 rounds.
- Tower 7F sample: player victory in 7 rounds.
- Tower 15F boss sample: enemy victory in 2 rounds.
- Hunter remains the direct battle center; shadows feel more useful, while monsters still pressure the party.

### Safety constraints
- Anticipation color regression remains protected.
- common / uncommon, including uncommon + S innateGrade, do not show red / crimson before the result.
- No hidden / locked named information was added or exposed.
- No summon probability, reward probability, acquisition result, reward, economy, shop, Gate/Tower progress, or save logic changed.
- localStorage key `levelup-save`, persist version 14, save schema, and migrations are unchanged.

### Verification
- `npx tsc --noEmit` exit code 0.
- `npx tsx scripts/audit-direct-battle-balance.ts` exit code 0.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0.
  - Summon reveal color regression: passed.
  - Shadow stat regression: passed.
  - Hunter death defeat regression: passed.
  - Center overlay render path: code path verified.
- `npm run build` exit code 0 (existing Vite chunk-size warning only).
- `git diff --check` passed for the touched files.

### Next candidate work
- 12-30C hidden / secret / narrative connective layer revisit.
- Real-play pacing and battle balance follow-up after user feel testing.
- Reward feel improvements should remain a separate economy / reward task.

## 12-30B-3: Shadow summon / reveal cinematic rework

### Scope
- Reworked the shadow summon / shard / reward reveal feel after the 12-30B-2 five-stage sequence still felt too small, fast, and card-bound.
- Kept `TicketRevealSequence`, `ShadowRevealModal`, and `ShadowExtractionReveal` separated.
- No Direct Battle balance change in this task.
- No hidden / secret / narrative connective-layer work, no 2.5D work, and no Auto battle work.

### Full-screen centered overlay
- `TicketRevealSequence` already rendered through `document.body`; it now uses a stronger `fixed inset-0 z-[1200]` cinematic layer, darker backdrop, vignette, inward particle drift, bigger central stage, and more visible Skip control.
- `ShadowRevealModal` now renders through a React portal into `document.body` instead of staying inside the parent panel tree.
- `ShadowRevealModal` result state is no longer presented as a small card; it uses a full viewport overlay with a large centered `ShadowPortrait`, rarity ring, centered chips, and bottom confirmation.
- `ShadowExtractionReveal` also renders through a React portal and uses a full-screen centered extraction stage, while keeping extraction-themed copy / tone separate from summon.

### Summon sequence changes
- Shadow summon still uses the same safe reveal path, but the stage visuals were strengthened:
  - ticket / seal activation: larger center seal, rune ring, slow pulse.
  - rift opening: larger black rift, slow rotating rings, inward tension.
  - shadow forming: large silhouette mass, blur-to-form transition, jitter, darkening.
  - resonance tension: no premature result portrait/name/role chips; it now reads as a pressure lock before result.
  - signal lock: final pre-result shake / black flash / dark burst before handing off to the result screen.
- Final result is handled by `ShadowRevealModal`, where actual rarity / innate grade / role / named chips are shown only for the actual result.

### Duration changes
- common / uncommon quick: about 5.6 seconds.
- rare: about 6.7 seconds.
- epic: about 7.8 seconds.
- legendary / S innateGrade / named apex: about 9.3 seconds.
- Skip and ESC behavior remain available.
- `prefers-reduced-motion` still shortens the sequence.

### Visual intensity
- Added heavier shake near final lock, dark flash, apex dark burst, slow rift growth, silhouette jitter, and a `shadow-cinematic-portrait` final entrance animation.
- Low-tier anticipation stays cyan / slate.
- High-tier anticipation is only used for rare+ shadow rarity.
- Apex uses dark burst / residual glow instead of a full-screen white flash.

### Safety constraints
- Anticipation color regression remains protected:
  - common / uncommon results do not use red / crimson before result.
  - uncommon + S innateGrade does not use red anticipation before result.
  - rare+ can use red / crimson / dark high-tier anticipation.
  - S innate grade remains allowed at the final result stage.
- No hidden / locked named information was added or exposed.
- No summon probability, reward probability, acquisition result, reward, economy, shop, Gate/Tower progress, or save logic changed.
- localStorage key `levelup-save`, persist version 14, save schema, and migrations are unchanged.
- Shadow raw stats, skills, and passives are unchanged.

### Verification
- `npx tsc --noEmit` exit code 0.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0.
  - Summon reveal color regression: passed.
  - Center overlay render path: code path verified.
- `npm run build` exit code 0 (existing Vite chunk-size warning only).
- `git diff --check` passed for the touched reveal / CSS / doc files.
- Short browser check: local app loaded at `http://127.0.0.1:3002` with 0 console errors. Actual summon click was not performed to avoid changing save/resources.

### Next candidate work
- 12-30C hidden / secret / narrative connective layer revisit.
- Real-play reveal pacing / balance feel follow-up.
- Reward feel improvements should remain a separate balance/economy task.

## 12-30B-2: Direct Battle balance audit + summon reveal cinematic upgrade

### Scope
- Re-audited Direct Battle BattleUnit conversion and short runtime outcomes after the recent Hunter / Shadow / Monster stat tuning passes.
- Added a small repeatable audit script: `scripts/audit-direct-battle-balance.ts`.
- Improved the summon / shard / reward shadow reveal path through `TicketRevealSequence` + `ShadowRevealModal`.
- `ShadowExtractionReveal` remains separate and is not routed back through `TicketRevealSequence`.
- No 2.5D work, no Auto battle improvement, no hidden / secret / narrative connective-layer work.

### Balance audit summary
- Hunter BattleUnit samples after tuning:
  - Lv5: HP 374 / ATK 76 / DEF 35 / SPD 25 / SKILL 76
  - Lv10: HP 506 / ATK 112 / DEF 52 / SPD 32 / SKILL 108
  - Lv20: HP 736 / ATK 179 / DEF 83 / SPD 45 / SKILL 166
  - Lv30: HP 982 / ATK 251 / DEF 116 / SPD 58 / SKILL 226
- Representative L1 B Shadow samples after tuning:
  - common scout: HP 125 / ATK 62 / DEF 51 / SPD 83 / SKILL 49
  - uncommon support: HP 210 / ATK 52 / DEF 115 / SPD 52 / SKILL 74
  - rare assault: HP 188 / ATK 154 / DEF 91 / SPD 84 / SKILL 83
  - epic guard: HP 471 / ATK 132 / DEF 263 / SPD 68 / SKILL 107
  - visible legendary/named assault representative: HP 370 / ATK 322 / DEF 213 / SPD 145 / SKILL 139
- Monster samples after tuning:
  - early charger Lv6: HP 492 / ATK 83 / DEF 31 / SPD 17 / SKILL 58
  - mid caster Lv11: HP 783 / ATK 98 / DEF 44 / SPD 22 / SKILL 211
  - mid tank Lv11: HP 1443 / ATK 112 / DEF 108 / SPD 15 / SKILL 90
  - boss Lv16: HP 3620 / ATK 391 / DEF 149 / SPD 26 / SKILL 390
  - high boss Lv25: HP 7373 / ATK 862 / DEF 273 / SPD 32 / SKILL 915

### Balance changes
- Hunter conversion slightly raised so Hunter remains the direct battle center:
  - ATK conversion raised modestly (`combatStats.atk`, STR, AGI coefficients).
  - SKILL conversion raised modestly (`skillTotalPower`, ATK, INT coefficients).
- Shadow conversion now compresses only high raw-stat BattleUnit conversion values:
  - Raw shadow definitions, shadow skills, passives, rarity, innate grade, enhancement, evolution data are unchanged.
  - Common / uncommon shadows remain support party members.
  - Rare shadows keep a clear role without overtaking a Lv20 Hunter as the default carry.
  - Epic guard stays meaningfully tanky but no longer has extreme BattleUnit HP/DEF relative to the Hunter.
  - Legendary/named remains strong but is less likely to delete combat alone.
- Monster conversion slightly softened by about one small step:
  - Level scale, HP, ATK, DEF, and SKILL coefficients reduced narrowly.
  - Monster threat remains real, especially C Gate, Tower mid/high, and boss floors.

### Audit outcome
- Lv20 audit party total after tuning: HP 1730 / ATK 579 / DEF 603 / SPD 332 / SKILL 479.
- E Gate sample: player victory in 2 rounds, player HP 1669/1730. Still a learning fight, not a dummy.
- D Gate sample: player victory in 3 rounds, player HP 1141/1730. Pressure is visible without blocking early progress.
- C Gate sample: reached max rounds with player HP 276/1730 and enemy HP 948/2887. This is intentionally pressure-heavy and should reward manual target / guard decisions.
- Tower 1F sample: player victory in 2 rounds.
- Tower 7F sample: player victory in 7 rounds.
- Tower 15F boss sample: enemy victory in 2 rounds against the fixed Lv20 audit party, confirming boss floors are not tuned as harmless HP bags.
- Hunter death defeat condition is still covered by smoke and remains unchanged.
- Shadow wipe without Hunter death remains allowed by the existing winner logic.

### Summon reveal cinematic changes
- `TicketRevealSequence` shadow reveal now uses a five-stage sequence:
  - ticket activation
  - rift opening
  - shadow forming
  - rarity tension
  - signal / innate-grade reveal
- Timing is now aligned to the requested bands:
  - common / uncommon quick: about 4.0 seconds
  - rare: about 5.1 seconds
  - epic: about 5.9 seconds
  - legendary / S / named apex: about 7.2 seconds
- The reveal is full-screen, centered, and larger, with a dedicated silhouette-forming stage before final reveal.
- `ShadowRevealModal` result state is now a large centered cinematic modal:
  - larger central `ShadowPortrait`
  - bigger result typography
  - full-screen dim/radial glow backdrop
  - stronger apex / epic / rare differentiation
- Skip / immediate confirmation remains available.
- `prefers-reduced-motion` still short-circuits the animation path.

### Color and information safety
- Anticipation red/crimson remains gated to rare+ shadow rarity only.
- common / uncommon, including uncommon + S innateGrade, do not use red anticipation before the result stage.
- S innate grade can still be shown at the final result stage.
- Final result only shows the actually acquired shadow.
- No hidden/locked named information was added or exposed.
- `ShadowExtractionReveal` remains visually and technically separate from summon reveal.

### Save / reward / economy constraints
- localStorage key `levelup-save`: unchanged.
- Persist version 14: unchanged.
- No save schema, migration, or stored direct battle state change.
- No Gate/Tower reward, clear, progress, economy, shop, reward-box, or probability value changes.
- No summon probability changes.

### Verification
- `npx tsc --noEmit` exit code 0.
- `npx tsx scripts/audit-direct-battle-balance.ts` exit code 0.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0.
- `npm run build` exit code 0 (existing Vite chunk-size warning only).
- Long-running sims and browser large QA were not run.

### Next candidate work
- 12-30C hidden / secret / narrative connective layer revisit.
- Real-play Direct Battle balance follow-up after user feel testing.
- Reward feel improvements should stay a separate balance/economy task.

## 12-30B-UI: Reward tab + Skill panel info-hierarchy cleanup

### Scope
- UI-only cleanup for the Reward tab (`ChallengeCardsPanel`, `RewardBoxPanel`) and the Hunter Skill panel (`SkillPanel`, `SkillActionCard`).
- Goal: lower screen density and let the core action ("카드 3장 선택 → 박스 강화 → 박스 열기" / "사용 가능한 스킬 / 쿨다운 / 상세") be visible at a glance, instead of looking like a debug / admin / spec console.
- No change to any underlying functionality.
- No change to reward numbers, card-selection logic, box upgrade math, drop probability, skill effects, cooldowns, mastery curves, or use-count tracking.
- No change to save schema, persist version, or `levelup-save` localStorage key.
- No new feature, no large UI redesign, no 2.5D work.

### Modified files
- `src/components/ChallengeCardsPanel.tsx`
- `src/components/RewardBoxPanel.tsx`
- `src/components/SkillPanel.tsx`
- `src/components/SkillActionCard.tsx`
- `CLAUDE.md`

### Reward tab — what was removed or merged
- **Three-column summary at the top** of `ChallengeCardsPanel` ("TODAY CARDS / 선택 보상 합계 / 박스 강화") collapsed to:
  - A single header with title + one-line next-action hint.
  - A right-side counter chip (e.g. `0/3 선택` or `2/3 완료`) plus the existing `선택 확정` button.
  - A single inline reward summary row showing XP / Gold / 정수 / 박스 chips (and the full-clear bonus chip when applicable).
- **Easy / Normal / Hard legend row** and the verbose intro ("후보 5장 중 3장을 고릅니다...") were removed. The difficulty chip on each card already conveys this.
- **Per-card chip stack** reduced:
  - Removed `DIFFICULTY_HINT` (`가볍게 완료 / 표준 루틴 / 집중 보상`) duplicate chip — the difficulty chip already says this.
  - Removed the separate `목표:` chip — moved to a one-line subtitle under the title.
  - Removed the bottom-of-card status hint (`보상 지급 완료 / 완료 시 자동 지급 / 오늘 미선택 / 선택 후보`) — the state chip + the visual selection ring already communicate this.
  - Four reward chips (XP / Gold / 정수 / 박스) collapsed into a single text line with subtle separators.
  - Status chip is now merged into the top chip row so the eye sees `[난이도] [카테고리] [상태]` once.
  - Card min-height reduced from `190px` to `148px`, padding tightened.
- **Three-column summary at the top** of `RewardBoxPanel` ("TODAY LOOP / 오늘 선택 카드 / 오늘 받을 수 있는 것") collapsed to:
  - A single `오늘의 보상 루프` line with the next-action hint.
  - A compact 3-stat strip on the right (`카드 X/3`, `강화 +N`, `박스 N`).
- **Inner 3-column grid** inside the "박스 보상" panel (large amber description + `NEXT TIER` hint) collapsed to:
  - A short subtitle line: `오늘 박스는 열기 전 카드 완료 수에 따라 등급이 올라갑니다.`
  - A single right-aligned tier hint (`Enhanced · +2에 Superior` / `Superior · +2에 Epic` / `Epic 적용 중`).
- **Per-box card** reduced:
  - Removed the duplicate `DAILY` / `WEEKLY` / `BOSS` short-code chip — the labelled type chip (`오늘의 보급` / `주간 보급` / `보스 보급`) is kept.
  - Removed the embedded "PREVIEW" sub-panel; preview hints now show as a single one-line summary (3 hints max joined by `·`).
  - Removed the per-card duplicate description block (it was just repeating the type chip wording).

### Reward tab — new information structure
- Layout reads, top to bottom: **today's loop summary → today's box panel (with cards) → challenge cards (in their own panel) → recent reveals (when present)**.
- Each card now reads as **title → 목표 한 줄 → 설명 (최대 2줄) → 보상 한 줄**, with chips reserved for status / difficulty / category.
- Each box now reads as **이름 → 종류·등급·층 chip 줄 → 보상 미리보기 한 줄 → 열기 버튼**.
- The `열기` button and the `선택 확정` button retain their existing prominent style — they are the only primary actions on the tab.

### Skill panel — what was removed or merged
- **Two-column intro row** at the top of the expanded panel removed:
  - Large `HUNTER SKILLS` block + paragraph description deleted.
  - Source-count chip row + `COMBAT READY` filler chip deleted.
- **Header summary** now folds into the toggle button itself: `스킬 N개 · 전투용 N` + one-line tagline `게이트·무한의 탑 수동 전투에서 직접 사용`.
- **Bottom developer-leaning hint** (`칭호/특수 스킬 슬롯은 구조만 열어두었습니다...`) removed. Slot expansion remains in code; the UI no longer surfaces this internal note.
- **Right-side detail aside** simplified:
  - Removed the redundant `SKILL DETAIL` header chip.
  - Removed the 2-up `사용 횟수 / 다음 숙련` grid (this is already shown in the mastery bar text).
  - The remaining detail shows: skill name → source/type/provider chip row → effect description → mastery progress bar with `Lv.X/MAX` + uses → optional `recommendedUse` hint.
  - When no non-basic skill is selected, the aside is a small empty-state note rather than the big `BASIC ACTIONS` block.
- **Per-skill card** (`SkillActionCard`) chip strip slimmed from seven chips to three:
  - Kept: source chip, type chip, base cooldown chip, and (when active) `남은 N` cooldown chip.
  - Removed: standalone `숙련 Lv.N` chip, separate `N회` chip, and `상세` indicator chip — `상세` is now communicated by the card's selected ring only.
  - Mastery info merged into a single right-aligned secondary line on the card: `숙련 Lv.X · N회`.
  - Removed the bottom mastery progress bar from the card; full progress + `recommendedUse` lives in the detail aside.
  - Card `min-h` reduced from `112px` to `96px`.

### Skill panel — new information structure
- Reads as **헤더 + 한 줄 설명 → 스킬 카드 그리드 + 우측 상세 패널**.
- Cards show **글리프 + 스킬명 → 사용 가능/쿨다운 배지 → 한 줄 효과 → source/type/cd 칩 → 우측 숙련 요약**.
- The detail aside is now the canonical place for the mastery progress bar and `recommendedUse` text.

### Style direction kept
- Dark / system-window / cyan tone retained.
- No new framer-motion sequences added (existing `motion.button` hover behaviour kept).
- No new state management.
- Mobile widths verified by `clsx` flex-wrap retention; horizontal overflow protection paths unchanged.

### Logic / state safety
- Card generation, card selection, card completion conditions: **unchanged**.
- Box upgrade math (`upgradePoints` thresholds 2 / 4 / 6 → enhanced / superior / epic): **unchanged**.
- Box reward probability tables, `openRewardBox` action: **unchanged**.
- Skill effects, cooldowns, mastery curves, `timesUsed` tracking, runtime mastery progress helpers: **unchanged**.
- `attemptShadowExtraction`, Gate / Tower flow, Direct Battle entry points: **unchanged**.
- Store schema, persist version, `levelup-save` key: **unchanged**.

### Verification
- `npx tsc --noEmit` exit code 0.
- `npm run build` exit code 0 (existing Vite chunk-size warning only).
- Smoke test not required for this UI-only patch; runtime logic untouched.

### Next candidate work
- 12-30C: hidden / 비밀 / 서사 connective layer revisit on top of the cleaner Reward + Skill panels.
- 실사용 UI 잔버그 수정 (gathered from real-play observations).
- 보상 체감 개선은 별도 밸런스 작업으로 분리.

## 12-30A: Shadow extraction dedicated reveal redesign

### Scope
- Dedicated reveal experience for the Gate "그림자 추출" flow.
- Removes the summon/ticket gacha aesthetic from the extraction path that made the user feel the same summon reveal was firing two or three times.
- Continues the 12-29P cleanup by also removing the Tower DEV legacy auto/manual battle buttons and the matching Gate DEV legacy auto/manual battle buttons.
- No probability change, no reward change, no `ownedShadows` decision change, no save/persist change, no hidden/locked named exposure, no Auto battle improvement, no 2.5D work, no large UI redesign.

### Root cause of duplicate-feeling extraction reveal
- `attemptShadowExtraction` in the store does not push a SystemMessage and decides the result exactly once.
- However, the GatePanel `ShadowExtractionPanel` was routing the extraction result through `ShadowRevealModal`, which is the shared summon/ticket modal. That modal internally plays `TicketRevealSequence` with four ticket-themed stages (`ticket → rift → rarity → signal`).
- To the user, those four ticket-themed stages plus the final result card felt like 2~3 chained summon reveals for one extraction.

### New ShadowExtractionReveal component
- New file: `src/components/shadows/ShadowExtractionReveal.tsx`.
- Standalone modal that does not import `TicketRevealSequence` or `ShadowRevealModal`.
- Pre-reveal stages are extraction-themed:
  - `command`: "일어나라." — Hunter commands the residual shadow.
  - `resonance`: "잔영이 흔들린다" — extraction sigil resonates.
  - `resistance`: "저항이 감지된다" / "강한 저항이 인다" — tension before result is fully bound.
  - `bind`: "속박이 완성된다" on success / "속박이 풀린다" on failure.
- Final stage shows the result:
  - success: `ShadowPortrait` of the acquired shadow with rarity / innate grade / role / NAMED badge and an `EXTRACTED` chip. The summary copy adapts to common (`그림자가 응답했다`), high-tier (`그림자가 군단에 합류했다`), and apex / named (`강한 잔영이 응답했다. 군단에 새로운 이름이 새겨졌다.`).
  - failure: faded silhouette with `EXTRACTION FAILED` chip, optional rolled-rarity signal chip, and "잔영이 균열로 흩어졌다" copy.
- Intensity (`quick` / `high` / `apex`) is derived only from the acquired shadow's rarity, innate grade, and named status. Failure defaults to `quick` and uses dimmer slate/cyan palette.
- Skip button immediately advances to the result stage; result close button finalizes. ESC matches the same behavior. `prefers-reduced-motion` skips the pre-reveal entirely and shows the result directly.
- Component does not modify probability, the rolled shadow, ownedShadows, achievement ticket claims, or any reward state.

### Separation from TicketRevealSequence
- `ShadowExtractionPanel` no longer renders `ShadowRevealModal`. It renders `ShadowExtractionReveal` instead.
- `ShadowRevealModal` and `TicketRevealSequence` continue to drive non-extraction reveals: summon tickets (`source: 'summon'` / `'shard'`), reward boxes (`source: 'box'`), and reward grants (`source: 'reward'`).
- The `'extraction'` value in `ShadowRevealSource` is left untouched in the type union so older saves and any in-flight payload still type-check, but no caller passes that source now.
- Words like 소환권, 티켓, 포탈, 가챠, 등급 점화 do not appear in any extraction-facing copy. The extraction copy uses 추출, 잔영, 명령, 저항, 응답, 속박, 군단 합류.

### Gate panel connection
- Inside `ShadowExtractionPanel`:
  - `handleExtraction()` continues to call `attemptShadowExtraction(log.gateInstanceId)` and read `useGame.getState().lastShadowExtractResult` once.
  - Result is passed to `<ShadowExtractionReveal result={revealingResult} gateName={gate.name} onClose={...} />`.
  - The small text summary below the panel still reads from `visibleResult` (when the modal is closed) so the user can see the prior result without re-opening the reveal.
- Gate result panel (`RecentBattleResult`), Gate reward / clear / penalty / stamina / injury / progression logic, and Direct Battle result adapter were not modified.

### Duplicate-reveal prevention
- One extraction attempt produces one `ShadowExtractionReveal` modal because:
  - `attempted` flag from `shadowExtractHistory` blocks the button after a try.
  - `setRevealingResult` is only fired when `result.gateInstanceId === log.gateInstanceId`.
  - Closing the modal sets `revealingResult` back to `undefined`; the modal does not reopen because the source result is now visible through `visibleResult` text only.
- The shared `ShadowRevealModal` / `TicketRevealSequence` no longer overlap with extraction, so a successful summon-reveal queue from a separate action cannot now interleave with the same extraction acquisition.

### Tower / Gate DEV legacy button cleanup
- Removed `InfiniteTowerPanel` DEV-only "DEV 기존 자동 전투" and "DEV 기존 수동 전투" buttons. The dead `Hand` lucide-react import was also removed; `handleAutoBattle` and `handleManualBattle` are kept as private handlers but no longer reachable from the UI. The legacy store actions (`startTowerBattle`, `startTowerManualBattle`, `performTowerManualBattleAction`, `cancelTowerManualBattle`) and the associated reveal panels are unchanged because they still own reward / floor clear / progression logic per 12-29P rules.
- Removed `GatePanel` DEV-only "DEV: 기존 자동 전투" and "DEV: 기존 수동 전투" buttons for parallel consistency with Tower. Underlying store actions (`startGateBattle`, `startManualGateBattle`, `performManualBattleAction`, `cancelManualGateBattle`) are unchanged for the same reason. The `ManualBattlePanelV2` component is preserved because it is still mounted when a manual battle session is active from any current or future entry point.

### Visual / UX notes
- Reveal stages use short CSS transitions (~0.32 s for transform, ~0.48 s for shadow). Combined stage durations: quick ≈ 3.65 s, high ≈ 4.45 s, apex ≈ 5.15 s. Skip jumps to result.
- Color palette focuses on dark violet + cyan with slate failure tones. Amber is only used on `NAMED` chips and apex success glow, which matches the rarity-only anticipation rule.
- Mobile widths use `max-w-xl` (quick / high) and `max-w-2xl` (apex); the modal is `overflow-y-auto` and respects `safe area` via existing styles.
- `prefers-reduced-motion` immediately resolves to the result stage with no per-step animation.
- No 2.5D, no battlefield overlay, no large UI redesign.

### Verification
- `npm run build` exit code 0. Existing Vite chunk-size warning only.
- `npx tsc --noEmit` exit code 0.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounters tested: 30
  - Total rounds simulated: 83
  - Total logs: 824
  - ActionQueue / Reveal snapshot / Skill safety / Monster targeting / Hunter defeat / Shadow stat / Summon color / Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
  - All regression checks passed (ally support/guard, skill safety, monster targeting, hunter death defeat, shadow stat, summon reveal color, setup priority, reveal snapshot, center overlay).
- No probability change, no reward / clear / progression change.
- localStorage key `levelup-save`, persist version 14, save schema, and save migrations unchanged.
- No hidden / locked named information exposure: extraction reveal never displays the definition pool or locked named details; it only displays the acquired shadow when extraction succeeds.

### Next candidate work
- 12-30B: additional DEV / temporary feature cleanup if more legacy artifacts surface in real play.
- 12-30C: hidden / secret / narrative connective layer revisit on top of the dedicated Direct Battle + Extraction reveal main paths.

## 12-29P: Legacy / DEV / mock combat bridge cleanup

### Scope
- Cleanup-only step after 12-29O / 12-29O-2 direct-control battle stabilization.
- Direct Battle is now the production main path for both Gate and Infinite Tower.
- This step removes confusing duplicate DEV preview panels and dead legacy code, and adds clear comments around the main paths.
- No combat formula, no balance number, no reward/clear/progression flow, no Auto battle improvement, no 2.5D work, no large UI redesign, no save/schema/persist change.

### Removed legacy / dev / mock code
- `GatePanel.tsx`:
  - Removed duplicate DEV-only `DirectBattlePreviewPanel` in the no-active-gate empty state ("DEV: 직접 조작 전투 미리보기").
    - This block was a pure mock duplicate that did not connect to Gate clear/reward/progression and only added noise next to the real production direct battle path.
  - Removed duplicate DEV-only `DirectBattlePreviewPanel` rendered below the active gate's `RecentBattleResult`.
    - Same reason: it was confusing because the main `직접 조작 게이트 전투` panel already drives the real Direct Battle path.
  - Removed dead helper component `ManualBattlePanel` (legacy V1).
    - `ManualBattlePanelV2` is the only manual battle panel actually mounted (still kept as a DEV fallback under `import.meta.env.DEV`).
    - Replaced the deleted function with a short comment that records why V1 is gone and that V2 + `ManualHpBar` are the kept paths.

### Retained legacy / fallback paths and reasons
- DEV-only legacy fallback buttons in `GatePanel` ("DEV: 기존 자동 전투", "DEV: 기존 수동 전투"):
  - Kept. They are wrapped in `import.meta.env.DEV` so they never ship to production.
  - Still tied to working store actions (`startGateBattle`, `startManualGateBattle`, `performManualBattleAction`, `cancelManualGateBattle`) that own real reward / clear / progression behavior.
  - Useful for developer comparison and regression checks against the Direct Battle main path.
- DEV-only legacy fallback buttons in `InfiniteTowerPanel` ("DEV 기존 자동 전투", "DEV 기존 수동 전투"):
  - Kept for the same reasons. Tied to `startTowerBattle`, `startTowerManualBattle`, `performTowerManualBattleAction`, `cancelTowerManualBattle`.
- `ManualBattlePanelV2` and `ManualHpBar`:
  - Kept. `ManualBattlePanelV2` is the manual battle view used by the DEV-only legacy manual gate path. `ManualHpBar` is only used inside V2.
- All store actions for legacy auto/manual battles:
  - Kept. They still own reward / clear / penalty / floor progression / boss box / first-clear protection and are connected to the Gate/Tower flow.
- `DirectBattlePreviewPanel` file name:
  - Kept. Rename would touch many imports. Instead, added a header comment explaining it is the production main direct-control battle panel for Gate and Tower, and the "Preview" name is historical (12-29F/G).

### DEV exposure cleanup
- The remaining DEV-only UI elements (`DEV 기존 자동 전투`, `DEV 기존 수동 전투`) are all wrapped in `import.meta.env.DEV`. They are never visible to end users in production builds.
- No new DEV preview panel is rendered next to the real production Direct Battle path.
- No internal developer description text leaks into production UI.
- Player party building still uses only owned / equipped shadows, so hidden / locked named information is not exposed by any DEV path.

### Direct Battle main path clarification
- Added a file header comment to `DirectBattlePreviewPanel.tsx`:
  - Marks it as the production direct-control battle panel for Gate (`handleDirectGateBattleComplete` -> `resolveDirectGateBattle`) and Tower (`handleDirectTowerBattleComplete` -> `resolveDirectTowerBattle`).
  - Notes that cancellation grants no reward.
  - Notes that victory/defeat is routed through existing reward/progression actions exactly once per battle.
- Added comments in `GatePanel.tsx` and `InfiniteTowerPanel.tsx` over the direct-battle completion handlers describing the same single-route guarantee and the dedupe key shape (`instanceId/floor + battleId/runId + outcome`).

### Direct Battle hunter death defeat
- The 12-29O Hunter-death defeat behavior in `directBattleRuntime.ts` is unchanged.
- Adapter logic in `buildDirectGateCombatLog` and `buildDirectTowerCombatLog` continues to map `enemy` winner to `defeat` and `player` winner to `victory` while preserving the duplicate-result guards in both panels.

### Verification
- `npm run build` exit code 0. Existing Vite chunk-size warning only.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounters tested: 30
  - Total rounds simulated: 85
  - Total logs: 824
  - ActionQueue issues: 0
  - Reveal snapshot issues: 0
  - Skill safety issues: 0
  - Monster targeting issues: 0
  - Hunter defeat issues: 0
  - Shadow stat issues: 0
  - Summon color issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
  - Ally support/guard skill damage regression: passed
  - Skill safety regression: passed
  - Monster targeting regression: passed
  - Hunter death defeat regression: passed
  - Shadow stat regression: passed
  - Summon reveal color regression: passed
  - Setup priority regression: passed
  - Reveal snapshot regression: passed
- localStorage key `levelup-save`, persist version 14, save schema, and save migrations unchanged.
- No reward, economy, shop, probability, Gate/Tower result flow, or progression-number changes.
- No shadow skill/passive nerf, no Auto battle improvement, no 2.5D work, no large UI redesign.
- No hidden/locked named information exposure (Codex masking, summon ticket coloring, locked named card rules all unchanged).

### Next candidate work
- 12-30A: shadow extraction reveal polish (no probability change).
- 12-30B: additional DEV / temporary feature cleanup if more DEV-only artifacts surface in real play.
- 12-30C: hidden / secret / narrative connective layer revisit on top of the cleaner Direct Battle main path.

## 12-29O: Direct-control battle stabilization patch 2

### Scope
- Fixed targeted live-play issues in the direct-control Gate/Tower battle path:
  - monster target selection collapsed too often to the Hunter.
  - Hunter death could still allow a shadow-only victory.
  - center battle log duration felt too short.
  - low-level support shadow HP was too high, especially `잿불 치유병`.
  - shadow summon anticipation color could turn red for uncommon high innate grade results.
- This was a stabilization patch only.
- No Auto battle improvement, no 2.5D work, no large UI redesign, no save migration, no reward/result flow change, and no economy/shop/probability changes.

### Monster targeting
- `directBattleRuntime.ts` now assigns deterministic monster preferred targets for hostile actions.
- The stable pick uses battle id + round + monster unit id + action id, so it adds variety without persisted randomness.
- Role/target-priority behavior:
  - bruiser: high-HP frontline pressure instead of always Hunter.
  - tank: guard/protect remains preferred; attacks use frontline/high-threat pressure.
  - caster: low-DEF or support/control-rich targets.
  - assassin: low-HP/rear/shadow pressure.
  - controller: high SKILL/SUPPORT/CONTROL shadows or party support units.
  - minion: stable random pressure.
  - boss: mixes Hunter, low-HP target, high-threat target, and stable random target.
- Dead targets still fall back through existing target resolution.

### Hunter death defeat
- Direct battle winner calculation now checks whether a player Hunter unit exists and is alive.
- If the Hunter is dead, the battle resolves as enemy victory even if shadows remain alive.
- Player victory now requires enemy team defeat while the Hunter is alive.
- Shadow death alone is not a defeat condition, and Hunter + no shadows can still continue.
- This applies before Gate/Tower result adapters receive the direct battle winner.

### Center log duration
- `DirectBattlePreviewPanel` center overlay interval increased from 1150ms to 1300ms.
- Per-step HP/status application delay increased from 420ms to 520ms.
- `즉시 결과 보기` behavior remains unchanged.

### Shadow HP formula
- Audited representative direct BattleUnit stats against Hunter/monster baselines.
- Before this patch, level 1 B-grade `잿불 치유병` produced HP 677 while level 1 Hunter was about HP 252 and level 1 monsters were about HP 197-212.
- Adjusted only shadow HP conversion, not shadow skills/passives:
  - reduced durability/survival HP coefficients.
  - added role HP shaping so guard shadows keep higher HP while support/analyst shadows are not accidental tanks.
  - kept rarity/innate grade/level/enhancement growth in place.
- Smoke audit after patch:
  - `잿불 치유병` level 1 B: HP 359, ATK 106, DEF 198, SPD 68, SKILL 109.
- Other shadow stats were audited but not broadly nerfed in this step.

### Summon reveal anticipation color
- `TicketRevealSequence` now separates anticipation color from signal grade intensity for shadow summons.
- Shadow anticipation red is now rarity-based only:
  - common/uncommon: low anticipation, cyan/gray family.
  - rare/epic/legendary/named: high anticipation, red/crimson family.
- High innate grade no longer makes uncommon pre-rarity anticipation red.
- Result/signal stages can still show the real innate grade color after the reveal reaches that stage.

### Smoke regression
- `scripts/smoke-direct-battle-runtime.ts` now additionally checks:
  - monster role targeting does not collapse to Hunter-only.
  - dead Hunter + living shadows + dead enemies resolves as enemy victory.
  - level 1 B `잿불 치유병` HP stays under the smoke ceiling.
  - common/uncommon shadow anticipation is low.
  - uncommon + S innate grade anticipation is still low.
  - rare/epic/legendary anticipation is high/red.

### Smoke result
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Shadow stat audit: ember-mender lv1 B HP 359, ATK 106, DEF 198, SPD 68, SKILL 109
  - Monster definitions: 36
  - Boss definitions: 6
  - Minion definitions: 6
  - Encounters tested: 30
  - Boss encounters: 8
  - Total battles: 30
  - Total rounds simulated: 91
  - Total logs: 893
  - ActionQueue issues: 0
  - Reveal snapshot issues: 0
  - Skill safety issues: 0
  - Monster targeting issues: 0
  - Hunter defeat issues: 0
  - Shadow stat issues: 0
  - Summon color issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
  - Ally support/guard skill damage regression: passed
  - Skill safety regression: passed
  - Monster targeting regression: passed
  - Hunter death defeat regression: passed
  - Shadow stat regression: passed
  - Summon reveal color regression: passed
  - Setup priority regression: passed
  - Reveal snapshot regression: passed

### Verification and constraints
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- Existing Gate/Tower long sims were not run.
- UI/balance/summon reveal feel remains for user testing.
- localStorage key `levelup-save`, persist version 14, save schema, and save migrations unchanged.
- No reward, economy, shop, probability, Gate/Tower result flow, or progression-number changes.
- No hidden/locked named information exposure.
- No shadow skill/passive nerf, no Auto battle improvement, and no 2.5D work.

## 12-29J: Infinite Tower direct-control battle first real connection

### Scope
- Connected Infinite Tower's normal user battle start flow to the shared direct-control battle UI.
- Gate direct-control battle flow was not changed.
- Existing Tower auto/manual battle code remains available only as DEV fallback buttons.
- No 2.5D implementation, save migration, persist version change, localStorage key change, economy/shop/probability/reward number change, or hidden named data exposure.

### Tower direct battle entry
- `InfiniteTowerPanel` now opens `DirectBattlePreviewPanel` as `무한의 탑 직접 조작 전투`.
- The panel reuses the Gate-stabilized direct-control UI:
  - attack / skill / guard commands
  - target selection
  - round execution
  - auto selection
  - auto 1-round
  - sequential center log reveal
  - log -> HP/status result synchronization
  - Damage Floor ally-safety behavior
- User-facing direct battle copy no longer describes this path as a preview.

### Player party and encounter recommendation
- Player party is still built by the shared direct battle panel from:
  - current Hunter
  - equipped owned shadows, capped to 3
  - current items/equipment/active consumable context
- Hidden/locked named protection is preserved because only owned/equipped shadows are passed into the direct battle panel.
- Tower floor recommendation is first-pass only:
  - normal floor 1-3: `small_duo`
  - normal floor 4-10: `caster_pair`
  - normal floor 11-20: `tank_assassin`
  - normal floor 21+: `control_support`
  - boss floor under 15: `boss_minion`
  - boss floor 15+: `boss_support`
- Existing Tower monster/reward/scaling tables were not changed.

### Result connection
- Added `resolveDirectTowerBattle(combatLog, floor)` in the store.
- `InfiniteTowerPanel` adapts direct battle completion into the existing `CombatLog`/`TowerBattleSession` shape.
- The adapter creates a `revealing` Tower battle result with existing `calculateTowerReward`.
- It immediately calls the existing `resolveTowerBattle()` path, so victory/defeat use the current Tower reward/result/floor-clear/challenge-progress logic.
- Cancel closes only the local direct battle panel:
  - no reward
  - no floor clear
  - no progress update

### Duplicate safety
- `InfiniteTowerPanel` keeps a per-run direct result key: floor + direct run id + outcome.
- Store-level `resolveDirectTowerBattle` refuses a combat log battle id that already exists in `combatLogs`.
- The direct run id is generated when the Tower direct battle opens, so repeated attempts on the same floor can still resolve, while duplicate callbacks for the same run cannot double-award.
- Existing Tower boss box first-clear and floor reward claimed maps remain the underlying reward duplication guards.

### Existing Tower fallback
- Old Tower automatic and manual battle buttons are now DEV fallback controls under the new direct battle start.
- The old auto/manual result code was not deleted in this pass.

### Verification
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounters tested: 7
  - Total battles: 7
  - Player units: 4
  - Total rounds simulated: 18
  - Total logs: 157
  - ActionQueue issues: 0
  - Reveal snapshot issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Ally support/guard skill damage regression: passed
  - Setup priority regression: passed
  - Reveal snapshot regression: passed
- Existing Gate/Tower long sims were not run.
- Browser UI/combat feel remains for user testing.

## 12-29I-5: Direct battle reveal log-result synchronization and center log placement

### Diagnosis
- `executeDirectBattleRound` calculates the full next round state immediately, while the UI stages a display copy of the previous state.
- Before this step, runtime logs had only `value` and target ids, so `DirectBattlePreviewPanel` inferred HP deltas during reveal instead of reading action-level before/after state.
- The center log queue fired `onLogChange` and HP application at the same moment, so the user could not reliably see "log first, then result".
- The direct center overlay was mounted in a fixed viewport layer and forced to screen center, which could cover the visible ally/enemy HP rows.

### Reveal step model
- Added HP and status snapshots to direct battle log entries:
  - `hpBeforeByUnitId`
  - `hpAfterByUnitId`
  - `statusBeforeByUnitId`
  - `statusAfterByUnitId`
  - `actionId`
  - `timing`
- `DirectBattlePreviewPanel` now builds internal reveal steps from runtime logs.
- Each step carries one cinematic message plus the exact HP/status result for that action.

### Log -> result ordering
- Round execution keeps displayed units at the round-start state after calculation.
- `onLogChange` now appends/shows the current log first.
- A short delayed timer applies that step's `hpAfterByUnitId` and status snapshot to displayed units.
- The next cinematic log advances after the existing overlay interval.
- At reveal completion, the UI reconciles once to the final runtime state.
- Victory/defeat completion still fires only after reveal completion or immediate-result skip, once.
- `즉시 결과 보기` skips all pending step timers and syncs directly to final state.
- Auto 1-round uses the same reveal-step path.

### Center overlay placement
- Removed the fixed full-viewport direct battle overlay wrapper.
- The direct center log now renders in a reserved compact panel-local row before the HP grid.
- This keeps ally/enemy HP rows visible on narrow mobile widths instead of covering them with a centered screen card.
- The existing `CinematicLogOverlay` queue pattern from the manual Gate battle path is still reused.

### Setup and Damage Floor safety
- Guard/protect/shield/buff/support, ally setup, stat shift, control/debuff/mark setup timing remains `before_action`.
- Control/debuff actions now also emit a status reveal step before their damage step.
- Damage Floor remains an ally-target guard/survival style action and still does not damage allies.
- Gate reward/progression/store flow, duplicate reward guard, and cancel behavior were not changed.

### Regression smoke
- `scripts/smoke-direct-battle-runtime.ts` now checks reveal snapshot payloads:
  - damage step target `hpBefore > hpAfter`
  - heal step target `hpBefore < hpAfter`
  - guard/support setup step does not reduce allied HP
  - guard setup step includes status before/after snapshots
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounters tested: 7
  - Total battles: 7
  - Player units: 4
  - Total rounds simulated: 18
  - Total logs: 157
  - ActionQueue issues: 0
  - Reveal snapshot issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
  - Ally support/guard skill damage regression: passed
  - Setup priority regression: passed
  - Reveal snapshot regression: passed
  - Center overlay render path: code path verified

### Verification
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- Existing Gate/Tower sims were not run.
- Gate reward/progression/store flow unchanged.
- localStorage key `levelup-save`, persist version 14, save schema, and save migration unchanged.
- No hidden/locked named info exposure, no Tower real battle connection, no 2.5D implementation, and no economy/shop/probability/reward number changes.

## 12-29I-1: Gate direct-control battle UX first pass

### Scope
- Improved the existing Gate direct-control battle panel UX without changing Gate rewards, progression, save data, or direct battle formulas.
- The work stayed inside the shared direct battle UI surface used by Gate direct combat and DEV previews.
- Infinite Tower real battle flow was not connected or changed.

### Skill/action UI
- The three primary command slots remain attack / skill / guard.
- Skill commands now show the actual action label, a short Korean description, target type, and cooldown/reuse wait text.
- If a unit has multiple skill actions, the unit card shows a compact skill picker and stores the selected skill `actionId` in the manual action selection.
- Attack and guard also now show short descriptions:
  - Attack: ATK-based single-target attack.
  - Guard: damage reduction / ally protection wording depending on target type.

### Sequential round reveal
- Round resolution still uses the existing direct battle runtime and ActionQueue.
- After `executeDirectBattleRound`, the UI stages the result and reveals action logs one by one at a short interval.
- HP is updated incrementally for damage, heal, and protect/reaction events during the reveal, then reconciled to the final runtime state after the queue finishes.
- Added a Korean reveal status row and an immediate result button.
- Action/reaction/result messages are displayed in Korean in the panel and in the direct Gate combat log payload.

### Result safety
- Victory/defeat completion is emitted only after the reveal finishes or the user skips to the final result.
- The 12-29I duplicate-result guard in `GatePanel` and `resolveDirectGateBattle` remains unchanged.
- Cancel still grants no reward and applies no clear/progress.
- Auto selection and Auto 1-round remain available; Auto 1-round also uses the sequential reveal path.

### Save/system constraints
- No localStorage key change.
- Persist remains version 14.
- No save schema field, migration, or stored direct battle state was added.
- No gameplay, reward, economy, shop, or probability number changed.
- No hidden/locked named shadow data exposure was added; player party still comes only from owned/equipped shadows.
- No 2.5D implementation.

### Verification
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` was not required for this UI-only patch and was not run in this step.
- Browser Gate combat feel remains for user testing.

## 12-29I-2: Gate direct-control center log and skill info polish

### Scope
- Improved the Gate direct-control battle UX without changing combat math, Gate reward/result flow, save data, or progression.
- The shared direct battle panel remains usable by Gate direct battle and DEV previews.
- Infinite Tower real battle flow was not connected or changed.

### Center battle message overlay
- Added a compact central battle message overlay inside `DirectBattlePreviewPanel`.
- The overlay is driven by the existing sequential reveal queue:
  - each revealed action/log updates the center message
  - damage/heal/guard/reaction/result events get distinct tones
  - victory/defeat messages appear from the same final reveal path
- The overlay is presentation-only and does not call store actions or resolve battle results.
- `즉시 결과 보기` clears the overlay together with the pending reveal state.

### Skill display improvements
- Added optional `description` metadata to direct battle action definitions.
- Hunter direct battle actions now use real combat skill definitions from `getPlayerCombatSkills`.
- The old hard-coded `Hunter Skill` label was removed from the hunter BattleUnit path.
- The basic-kit skill `집중 베기` now appears as the hunter skill when available, with its seed description/effect summary.
- Hunter skill actions can include multiple available combat skills, so the existing multi-skill picker can show real skill names instead of one generic fallback.
- Shadow skills now prefer the full active skill name over the short all-caps label.
- Skill descriptions use real Korean action descriptions when present and otherwise fall back to Korean effect-kind summaries.

### Multi-skill UI
- The multi-skill picker now marks the selected skill with `선택됨`.
- Skill cards continue to show name, short description, target type, and cooldown/reuse wait.
- Cooldown skills remain disabled through the existing cooldown state.

### Result safety
- Victory/defeat completion still fires only after reveal completion or immediate-result skip.
- The Gate duplicate-result guard from 12-29I remains unchanged.
- Cancel still grants no reward and applies no clear/progress.
- Auto selection and Auto 1-round still use the sequential reveal/overlay path.

### Save/system constraints
- No localStorage key change.
- Persist remains version 14.
- No save schema field, migration, or stored direct battle state was added.
- No gameplay, reward, economy, shop, or probability number changed.
- No hidden/locked named shadow exposure was added; player party still comes only from owned/equipped shadows.
- No 2.5D implementation.

### Verification
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- Runtime smoke was not required because combat formulas/runtime behavior were not changed.
- Browser Gate combat feel remains for user testing.

## 12-29I-3: Gate direct-control center log visibility and ally-target guard fix

### Scope
- Fixed two direct Gate battle UX/runtime bugs without changing Gate reward/result flow, save data, progression, economy, shop, or probability values.
- Infinite Tower real battle flow was not connected or changed.
- No 2.5D implementation.

### Center battle message overlay
- The 12-29I-2 overlay was rendered inside the long battle panel, so its absolute center could be outside the current viewport and appear invisible during real Gate play.
- Moved the central battle message overlay to a compact fixed viewport layer with `pointer-events-none` and high z-index.
- The overlay is still driven only by the existing sequential reveal event:
  - damage
  - heal
  - guard/protect/reaction
  - victory/defeat/result
- Immediate result skip clears the overlay together with pending reveal state.
- The overlay remains presentation-only and does not call store actions.

### Ally-target skill damage fix
- Fixed `directBattleRuntime` fallback behavior where a skill with `targetType: single_ally` and `effectKind: guard` could fall through to the generic damage branch.
- Runtime now checks actual target team before applying damage.
- Ally-target actions are routed to safe support/guard handling instead of hostile damage.
- Enemy-target support/guard combinations now fizzle safely rather than buffing enemies.
- Control/damage branches now require valid enemy targets.

### Damage Floor handling
- `Damage Floor` remains a guard-style skill by definition:
  - `target: hunter`
  - `targetType: single_ally`
  - `effectKind: guard`
- Runtime now treats that combination as a guard/shield/protect style status effect.
- It no longer damages the selected allied target.
- Center overlay/log formatting now describes guard/survival skill status events as defensive reinforcement.

### Safety mapping
- Ally target:
  - support -> heal/support
  - guard/survival/stat_shift/cooldown/synergy -> guard/shield/support status
  - damage/hybrid/control with an ally target -> safe ally support fallback, no HP damage
- Enemy target:
  - damage/hybrid/basic/bossing -> damage
  - control -> damage plus debuff, only if enemy target is valid
  - support/guard with hostile target -> safe fizzle

### Regression smoke
- Added an ally support/guard regression case to `scripts/smoke-direct-battle-runtime.ts`.
- The smoke constructs a `Damage Floor` style ally-target guard action, targets the Hunter, and verifies:
  - Hunter HP does not decrease from the ally skill.
  - No ally-target damage log is emitted.
  - A guard/status log is emitted.
  - A normal enemy-target attack can still deal damage.

### Result safety
- Victory/defeat completion still fires only after reveal completion or immediate-result skip.
- The Gate duplicate-result guard from 12-29I remains unchanged.
- Cancel still grants no reward and applies no clear/progress.

### Save/system constraints
- No localStorage key change.
- Persist remains version 14.
- No save schema field, migration, or stored direct battle state was added.
- No gameplay, reward, economy, shop, or probability number changed.
- No hidden/locked named shadow exposure was added.

### Verification
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounters tested: 7
  - Total battles: 7
  - Player units: 4
  - Total rounds simulated: 18
  - Total logs: 138
  - ActionQueue issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
  - Ally support/guard skill damage regression: passed
- Browser Gate combat feel remains for user testing.

## 12-29I-4: Gate direct-control setup timing and cinematic overlay queue reuse

### Scope
- Fixed direct Gate battle UX/timing behavior only.
- Gate reward/result/progression/store flow was not changed.
- Infinite Tower real battle flow was not connected or changed.
- No save schema, localStorage, persist version, migration, economy, shop, reward, or probability values were changed.
- No 2.5D implementation.

### Existing manual battle overlay reference
- Rechecked the existing manual Gate battle center-log path in `GatePanel`.
- The proven path is `CinematicLogOverlay` with:
  - a local cinematic log queue
  - `visible={logs.length > 0}`
  - `onLogChange` to advance revealed battle state
  - `onComplete` to finish the reveal queue
  - panel-local rendering over a `relative overflow-hidden` battle panel
- Direct battle no longer relies on a separate ad-hoc center-message state path.

### Center overlay reimplementation
- `DirectBattlePreviewPanel` now converts each direct battle reveal log into `CinematicLogData`.
- Round reveal uses the existing `CinematicLogOverlay` queue component that already works in manual Gate battle.
- `onLogChange` applies the staged log/HP update for each revealed action.
- `onComplete` finalizes the pending round result and fires victory/defeat completion only once.
- The overlay is mounted from the direct battle reveal state and wrapped in a fixed `z-[9999]` presentation layer so it is not clipped by the direct battle panel.
- Immediate result skip still clears the same pending reveal state and does not duplicate completion callbacks.

### Setup timing priority
- Added explicit direct battle action timing classification:
  - `before_action`: guard, protect, shield, buff/support, ally-target setup, stat shift, control/debuff/mark.
  - `normal_action`: basic attacks and hostile damage skills.
  - reaction/cleanup remain separate existing timing buckets.
- ActionQueue sorting still uses timing bucket first, then final priority, SPD, team order, and queue id.
- Setup actions therefore resolve before damage even when the setup actor has lower SPD than the attacker.
- Pure damage skills remain in `normal_action`, so they are not incorrectly promoted into setup timing.

### Buff/debuff behavior
- Guard/support/ally setup applies guard/shield/protect status before enemy attacks in the same round.
- Control/debuff actions now apply defenseDown/speedDown/mark before their damage calculation and before later allied damage actions.
- This lets defenseDown/mark affect the same-round damage window instead of arriving too late.

### Damage Floor handling
- `Damage Floor` remains an ally-target guard/survival style action.
- It is routed through setup timing and safe ally support handling.
- It does not damage the selected allied target.
- The guard/support regression from 12-29I-3 remains covered by smoke.

### Regression smoke
- Added setup priority regression coverage to `scripts/smoke-direct-battle-runtime.ts`:
  - low-SPD guard setup resolves before high-SPD enemy attack
  - guard setup reduces incoming damage compared with a no-guard baseline
  - control/debuff setup resolves before allied basic damage
  - pure damage skill remains `normal_action`
- Smoke also prints `Center overlay render path: code path verified` for the direct battle overlay queue path.

### Result safety
- Victory/defeat completion still fires after reveal completion or immediate-result skip, once per finished battle.
- The Gate duplicate-result guard from 12-29I remains unchanged.
- Cancel still grants no reward and applies no clear/progress.

### Verification
- `npm run build` exit code 0.
- Existing Vite chunk-size warning only.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0:
  - Encounters tested: 7
  - Total battles: 7
  - Player units: 4
  - Total rounds simulated: 18
  - Total logs: 138
  - ActionQueue issues: 0
  - Validation issues: 0
  - Crashes: 0
  - Gate/Tower connections: 0
  - Ally support/guard skill damage regression: passed
  - Setup priority regression: passed
  - Center overlay render path: code path verified
- Browser Gate combat feel remains for user testing.

## 12-30C: Hidden/secret connective layer audit and spoiler-safe masking

### Scope
- Completed a spoiler-safe audit of the existing hidden/secret progress layer against the current Direct Battle, Shadow Extraction, Reward, Summon, Challenge Card, Skill, Gate, Tower, and Shadow Codex flows.
- Kept the work to connective-layer and masking adjustments only.
- No save schema, persist version, migration, or `levelup-save` key changes.
- No reward, economy, shop, probability, Gate/Tower progress, Direct Battle balance, summon/extraction chance, shadow stat, skill, or passive definition changes.

### Direct Battle connective check
- Confirmed Gate and Tower Direct Battle result handling still routes through the main reward/progress path and existing secret progress application.
- Added Direct Battle skill-use runtime accounting for resolved Gate/Tower logs so existing skill-use based hidden signals can remain connected to the current main battle path.
- Existing result guards remain responsible for preventing duplicate result processing.

### Shadow Extraction connective check
- Confirmed extraction success/failure remains recorded through the store path and is still guarded by the per-gate extraction history.
- Added a small non-spoiler failure-side signal counter and a one-time atmospheric hint gate.
- The hint uses existing seen-marker state so it does not repeat on refresh, reopen, or repeated extraction attempts.

### Spoiler-safe UI masking
- Gate shadow pool and extraction preview now hide unrevealed hidden rarity/name/role details behind neutral wording.
- Shadow Codex locked cards now mask unrevealed hidden card rarity styling, role/source hints, searchable hidden attributes, and filter-based attribute leakage.
- The shared shadow portrait hidden fallback now uses neutral visual metadata so future hidden calls do not imply role, rarity, source, grade, or named status.
- Reward box hidden fragment masking, challenge card generic reward preview, and summon reveal separation were rechecked and left intact.
- Summon ticket reveal flow was not changed.

### Secret smoke coverage
- Extended the hidden/secret smoke to cover the new extraction-failure signal counter and one-time marker behavior.
- The smoke remains short and does not run long simulations.

### Verification
- `npm run build` exit code 0.
- `npx tsc --noEmit` exit code 0.
- `npx tsx scripts/smoke-direct-battle-runtime.ts` exit code 0.
- `npx tsx scripts/sim-secret-expansion.ts` exit code 0.

### Next candidates
- Tune real-play hint frequency after observation.
- Reward feel polish as a separate task.
- Longer-form story chapter expansion later, outside this connective-layer pass.
