## 12-38H-prepare Hunter / Monster Battle Sprite Planning & Classification — (2026-05-28)
- **헌터 동일 인물 시각 원칙 수립 (`docs/2.5d-battle-sprite-plan.md` 신규 생성)**: 직업군이 성장하고 각성하더라도 헌터 본연의 고유한 캐릭터 정체성(얼굴, 키, 체형 비율)을 보존하고, 직업별로 무기, 대기 자세, 판금/로브/후드 기어 장비 및 마력 아우라 속성을 분류하여 10종의 헌터 스프라이트 가이드 완성.
- **전체 몬스터 식별 및 10대 에셋 그룹 규격화 (`docs/2.5d-battle-sprite-plan.md`)**: 전투 엔진(`src/lib/directBattleMonsters.ts`)에 구현된 36종 몬스터 목록을 파악 및 집계. 몬스터들을 계열별로 호환할 수 있는 10개 정예 에셋 그룹(`rift-minion`, `rift-bruiser`, `rift-tank`, `rift-caster`, `beast-assault`, `undead-minion` 및 보스 3종 등)으로 분류하고 세부 스펙 정의.
- **1차 에셋 팩 최소 범위 제안 및 후속 로드맵 제시**: 헌터 직업군 대표 에셋 10종 및 몬스터 대표 에셋 10종에 대한 1차 제작 범위를 수립하고, 향후 PNG 저장, 레지스트리 통합, 전투 렌더러 바인딩으로 이어지는 파이프라인 개발 로드맵 설계 완료.
- **무결성 및 안정성 검증**: 코드 변경 없이 `npx tsc --noEmit` 검사 무결 통과. 전투 공식 및 스탯, 세이브 호환성 등 런타임 게임 코어 로직은 100% 무영향 보존.

## 12-38G 2.5D Shadow Battle Sprite Extraction — (2026-05-28)
- **전투 전용 그림자 스프라이트 신설 (`src/components/battle/ShadowBattleSprite.tsx` 신규 생성)**: 기존 카드/도감용 `ShadowPortrait`에 종속되어 둥근 마스크와 액자 프레임에 갇혀 보이던 문제를 해결하기 위해, 투명 배경 PNG 원본 에셋만 단독으로 불러와 렌더링하는 컴포넌트 신설.
- **그림자 유닛 접지감 및 바닥 고정 배정 (`src/components/battle/ShadowBattleSprite.tsx`)**: 바닥 밀착을 위해 `absolute bottom-0 origin-bottom` 기준 정렬을 가하고, 2.5D 전장 크기에 알맞게 반응형 이미지 크기 배율(`scale-[1.32] / scale-[1.38]`)을 적용하여 섀도우가 전장 대지에 서 있는 입체감 강화.
- **BattleActorSprite 내 섀도우 컴포넌트 격리 교체 (`src/components/battle/BattleActorSprite.tsx`)**: `isShadow` 조건부 렌더링 시 기존 `ShadowPortrait` 대신 `ShadowBattleSprite`를 주입 연동. 도감이나 인벤토리 UI에 쓰이던 기존 카드 초상화 레이아웃은 단 1%의 회귀 영향 없이 안전하게 분리 보존.
- **타입 및 빌드 검증**: `npx tsc --noEmit` 타입 안전성 체크 통과 및 `npm run build` 프로덕션 Vite 빌드 성공 완료. 기존 전투 공식, 턴 계산 로직, 저장 데이터 호환 등 코어는 100% 무영향 보존.

## 12-38F 2.5D Actor Card Feel / Cinematic Caption Cleanup — (2026-05-28)
- **Actor 카드 프레임 완전 투명/원형화 (`src/components/battle/BattleActorSprite.tsx`)**: 사각형 테두리와 내부 배경 상자 디자인을 전면 제거하고 둥근 원형 마스크(`rounded-full`)를 인가하여 투명 배경 위에 포트레이트 캐릭터와 엠블럼만 온전히 뜨도록 유닛화.
- **Actor 내부 중복 정보 최소화 (`src/components/battle/BattleActorSprite.tsx`)**: 유닛 내부에 존재하던 이름, 역할명, 분수 HP 텍스트 라벨을 삭제하여 HUD 이관 완료. 캐릭터 아래에 오직 얇은 HP Bar 스트립(`h-[2px] / h-[3px]`)만 노출되도록 하여 초상화 가시 면적 100% 확보.
- **Monster / Boss 실루엣 강화 및 상자 탈거 (`src/components/battle/BattleActorSprite.tsx`)**: 몬스터/보스에 씌워져 있던 사각형 박스 보더를 지우고 👹/💀 본체 이모지를 크게 묘사하고 글로우 효과와 결합해 순수한 괴물 유닛 실루엣 연출.
- **시네마틱 캡션 Skip 카드 제거 및 헤더 통합 (`src/components/battle/BattleArenaOverlay.tsx`)**: 자막을 모달처럼 감싸고 있던 검은색 skip 컨테이너 카드 상자를 삭제하고 한 줄 투명 자막 캡션만 띄움. 연출 진행 중 스킵 버튼과 라운드 배지는 아레나 오버레이 우측 상단 공용 헤더로 이관하여 격리 정돈.
- **타입 및 빌드 검증**: `npx tsc --noEmit` 타입 안전성 체크 통과 및 `npm run build` 프로덕션 Vite 빌드 성공 완료. 기존 전투 공식, 턴 계산 로직, 저장 데이터 호환 등 코어는 100% 무영향 보존.

## 12-38E 2.5D Arena Visual Hierarchy / Immersion Polish — (2026-05-28)
- **오버레이 배경 암전화 및 캡션 레이아웃 축소 (`src/components/battle/BattleArenaOverlay.tsx`)**: 뒷배경에 `backdrop-blur-[24px]`와 `/96` 투명도를 결합해 비침 현상을 차단하고, CinematicLog 캡션 박스 폭(`max-w-[330px]`) 및 글자 크기, 여백을 줄여 전장의 가시 영역을 보호.
- **Actor 카드 프레임의 전장 유닛화 (`src/components/battle/BattleActorSprite.tsx`)**: 사각형 테두리를 완전히 걷어내고 투명한 마감에 둥근 외곽 오라 링을 둘렀으며, 발밑의 3D 타원 그림자 두께와 투명도를 `bg-black/70 blur-[1.5px] shadow-2xl`로 상향하여 전장 밀착감 제공.
- **Battlefield "전투 무대" 강화 (`src/components/battle/Battlefield2DView.tsx`)**: 2px 굵은 외곽선과 깊은 내부 그림자(`shadow-[inset_0_0_30px_rgba(0,0,0,0.85)]`)를 적용해 필드 경계를 명확히 분리하고, 네 귀퉁이에 Cyan 코너 브래킷 및 층 안개(mist) 레이어를 가미해 전장 테마의 입체성 극대화.
- **선택 집중형 HP HUD 구현 (`src/components/battle/BattleHudPanel.tsx`)**: HUD 유닛에 `isDimmed`를 신설하여 턴 진행 시 액티브/타겟팅 상태가 아닌 대기 유닛들을 반투명(`opacity-55`) 처리해 행동 주목도를 획기적으로 상승.
- **RPG 단축 스킬 조작바 개편 (`src/components/battle/BattleCommandPanel.tsx` & `src/components/DirectBattlePreviewPanel.tsx`)**: 컨트롤 패널 로고를 콤팩트화하고, 개별 아군 행동/타겟 제어판에서 장문 스킬 설명을 제거하고 버튼 최소 높이(`min-h-[2.2rem]`)를 조여 하단 스킬 퀵바 형태로 다듬고 공간 최적화.
- **타입 및 빌드 검증**: `npx tsc --noEmit` 타입 안전성 체크 통과 및 `npm run build` 프로덕션 Vite 빌드 성공 완료. 기존 전투 공식, 턴 계산 로직, 저장 데이터 호환 등 코어는 100% 무영향 보존.

## 12-38C 2.5D Full Battle Mode / Arena Overlay — (2026-05-28)
- **전체화면 아레나 오버레이 도입 (`src/components/battle/BattleArenaOverlay.tsx` 신규 생성)**: 기존 카드 내부에 납작하게 찌그러지던 전투창을 전체화면 모달 구조(`fixed inset-0 z-[100] flex flex-col bg-slate-950/98`)로 분리. 대형 2.5D 전장, 전용 HUD, 조작 Command Panel을 통합 렌더링.
- **HP HUD 분리 탑재 (`src/components/battle/BattleHudPanel.tsx` 신규 생성)**: 액터 내부 HP 표기와 별도로, 상단 Enemy HP HUD(보스 및 타겟팅 상태, HP 수치/바) 및 하단 Ally HP HUD(헌터 및 참여 섀도우 1~3명 HP 상태 통합 표시)를 독립 배치하여 정보 가독성 증대.
- **행동 선택 제어반 분리 (`src/components/battle/BattleCommandPanel.tsx` 신규 생성)**: ⚡ 재생 속도 토글, 자동 선택, 자동 실행, 라운드 실행 단추 및 개별 아군 행동/타겟 제어판을 하단 영역에 조화롭게 결합.
- **최소화 프리뷰 및 포기 정책 이원화 리팩토링 (`src/components/DirectBattlePreviewPanel.tsx`)**: 전투 진행 중일 때 overlay 최소화 버튼(전투창 닫기)을 누르면 백그라운드 진행 상태가 유지되며 기존 카드 위치에는 "전투 진행 중" 간이 요약 카드와 "전투 화면 열기" 버튼이 표시되도록 구현. 전투 포기 버튼을 누르면 전투가 취소(`cancelBattle`)되도록 구분.
- **2.5D Battlefield 오버레이 전장 스케일 다변화 (`src/components/battle/Battlefield2DView.tsx`)**: `mode?: 'compact' | 'overlay'` prop을 신설하여 overlay 모드일 경우 높이를 `h-[36vh] min-h-[300px] md:h-[440px] lg:h-[480px]`로 키우고, 액터 크기를 확대하며, SVG 액션 라인 굵기를 최적화.
- **타입 및 빌드 검증**: `npx tsc --noEmit` 타입 체크 완벽 통과 및 `npm run build` 프로덕션 컴파일 성공. 기존 전투 공식, 턴 순서, 정산 보상, 로컬 저장 구조 등 100% 무영향 보존.

## 12-38B-4 2.5D Actor Image Regression / Battle Pace Tuning Fix — (2026-05-28)
- **Compact Actor 카드 및 아바타 크기 인라인 style 고정 (`src/components/battle/BattleActorSprite.tsx`)**: Tailwind default spacing scale에 없는 클래스로 인해 높이가 0px로 찌그러지던 렌더링 회귀 현상을 방어하기 위해 inline style (`80x104px`, `64x88px`, `144x192px`, `112x144px`)로 치수를 고정해 이미지가 항상 정비율로 보여지도록 복구.
- **ShadowPortrait h-full Precedence 보장 (`src/components/shadows/ShadowPortrait.tsx`)**: 부모 div에서 `className="h-full"`을 전달했을 때 Tailwind의 고정 sizeClass에 씹히지 않도록 inline style `height: '100%'` 강제 정의.
- **전투 재생 속도(playbackSpeed) 튜닝 및 UI 제어반 탑재 (`src/components/DirectBattlePreviewPanel.tsx`)**: `playbackSpeed` ('normal' | 'fast') 상태 변수를 추가하고 CinematicLogOverlay 턴 주기 및 상태 동기화 딜레이(보통 1x: 1950ms/950ms, 빠름 2x: 1100ms/500ms) 조율. 수동 라운드 실행 시 보통 속도(1x), 자동 실행 시 빠른 속(2x) 자동 매핑 및 헤더에 수동 토글용 `⚡ 보통 (1x) / 빠름 (2x)` 버튼 탑재.
- **타입 및 빌드 검증**: `npx tsc --noEmit` 컴파일 무오류 및 `npm run build` 프로덕션 빌드 성공. 기존 밸런스 공식, 경제, 저장소 데이터 100% 무영향 보존.

## 12-38B-3 2.5D Battle Viewport Height / HP Clipping / Action Clarity Fix — (2026-05-28)
- **Compact 전장 높이 적정 비율 복원 (`src/components/battle/Battlefield2DView.tsx`)**: 전장 공간감과 기운을 회복하기 위해 compact 모드 높이를 `195px`에서 `225px sm:h-[250px]`로 상향 조정하고 Scroll-Free 제어반 흐름을 보존함.
- **Y축 좌표 안전 구역 이격 배정 (`src/components/battle/Battlefield2DView.tsx`)**: 상하단 경계 엣지에 걸쳐지던 Y축 좌표 비율을 전면 조율(Boss 26%, Minion 41%, Shadow 56%, Hunter 71%)하여 clipping 위험 사전 방지.
- **HP Bar 및 수치 라벨 카드 내부 매립 (`src/components/battle/BattleActorSprite.tsx`)**: 카드를 `w-16 h-22`로 소폭 축소하고, HP Bar를 카드 Visual 내부(이름 마스크 하단)로 이식하여 컨테이너 경계 잘림 현상을 영구 차단.
- **Action Clarity 상태 배지 및 SVG 빔 궤적 오버레이 (`src/components/battle/Battlefield2DView.tsx` & `src/components/battle/BattleActorSprite.tsx` & `src/index.css`)**: 행동 유닛의 `ACT` 배지(Cyan)와 테두리 글로우, 타겟 유닛의 `TGT` (Rose) 및 `AID` (Emerald) 배지와 글로우 링 연출 가미. 행동자 → 대상자 중심점을 잇는 Marching-Ants 흐름 효과의 SVG Action Direction Beam을 구현하여 턴 진행 중 행동의 방향성을 직관화함.
- **타입 및 빌드 검증**: `npx tsc --noEmit` 컴파일 무오류 및 `npm run build` 프로덕션 빌드 성공. 기존 밸런스 공식, 경제, 저장소 데이터 100% 무영향 보존.

## 12-38B-2 2.5D Battle Viewport / Control First UX Fix — (2026-05-28)
- **컴팩트 전장 높이 대폭 축소 (`src/components/battle/Battlefield2DView.tsx`)**: 모바일 직접 조작 전장 높이를 `280px`에서 `195px`로 대폭 축소하여 화면 수직 공간을 확보하고 스크롤 없는 전투 명령이 가능하도록 Viewport 최적화.
- **액터 세로 겹침 방지 Staggered X축 배치 알고리즘 적용 (`src/components/battle/Battlefield2DView.tsx`)**: 아군(헌터 vs 그림자) 및 적군(보스 vs 하수인) 간의 X축 좌표가 세로로 일렬 탑처럼 겹쳐서 답답하게 보이던 현상을 Staggered 엇갈림 분산 좌표 배정으로 원천 해결. 그림자 1명일 때 30:70 좌우 대치 유도 및 3명일 때 50% 회피 유도로 헌터(50%)와의 겹침 방지.
- **제어반 레이아웃 1줄 통합 및 조작 우선순위 재조합 (`src/components/DirectBattlePreviewPanel.tsx`)**: 직접 조작 제어반 헤더 타이틀과 설명 문구를 1줄로 병합하고 실행 버튼군도 한 줄에 모아서 세로폭 압축. 실시간 최근 2줄 로그 피드를 전장 하단이 아닌 조작 패널 하단(아코디언 위)으로 이동하여 상황판(전장) 다음에 즉시 조작 카드가 밀착 노출되도록 개선.
- **상단 요약 및 조작 카드 압축 (`src/components/DirectBattlePreviewPanel.tsx`)**: 상단 요약 카드(`PreviewStatPill`)의 세로 패딩 축소 및 검증 이슈가 0일 때 조건부 미노출 처리. 조작 선택 카드 내 버튼의 최소 높이를 `min-h-[2.8rem]`으로 압축하고 설명을 `line-clamp-1`로 제한하여 화면 밀도 최적화.
- **타입 및 빌드 검증**: `npx tsc --noEmit` 컴파일 무오류 및 `npm run build` 프로덕션 빌드 성공. 기존 밸런스 공식, 경제, 저장소 데이터 100% 무영향 보존.

## 12-38B-hotfix 2.5D Battle Actor Image Rendering Fix — (2026-05-28)
- **ShadowPortrait 가로 찌그러짐 수정 (`src/components/shadows/ShadowPortrait.tsx`)**: 루트 div의 className에 `w-full` 클래스가 누락되어 absolute wrapper 내부에서 쪼그라들던 현상을 `w-full` 주입으로 해결.
- **BattleActorSprite Tailwind CSS 표준 클래스 복구 (`src/components/battle/BattleActorSprite.tsx`)**: Tailwind CSS 기본 스페이싱 가이드라인에 정의되지 않은 비표준 클래스(`w-18`, `h-30`, `w-9`, `h-11`)들을 표준 클래스(`w-20`, `h-28`, `w-24`, `h-32`, `w-10`, `h-10`, `w-16`, `h-20`, `w-10`, `h-12`)로 변경하여 가로세로 비율이 0px 혹은 비정상적으로 찌그러지는 현상 해결.
- **그림자 PNG 렌더링 무결성 확보**: BattleActorSprite 내에서 `ShadowPortrait`를 그릴 때 `className="w-full h-full"`을 명시적으로 넘겨주어 이미지 스케일과 drop-shadow 필터가 정상 매핑되도록 지원.
- **타입 및 빌드 검증**: `npx tsc --noEmit` 컴파일 무오류 및 `npm run build` 프로덕션 빌드 성공. 기존 밸런스 공식, 경제, 저장소 데이터 100% 무영향 보존.

## 12-38B 2.5D Battle Screen Layout / Actor Position UX Fix — (2026-05-28)
- **2.5D Battlefield 겹침 방지 좌표/슬롯 정교 배정 알고리즘 개선 (`src/components/battle/Battlefield2DView.tsx`)**: Y축 컨테이너를 하나로 통합하여 절대 좌표계 일관성을 제공하고, Y축 층 격차를 명확하게 확보(Shadows Y=64%, Hunter Y=82% 등)함. X축 슬롯 분산 알고리즘을 도입하여 1명~4명 이상 상황별 좌표 배열을 제공하고, 적 보스 몬스터가 겹치지 않고 항상 중앙에 오고 하수인은 양옆에 배정되도록 개선.
- **모바일/콤팩트 액터 렌더링 개선 (`src/components/battle/BattleActorSprite.tsx`)**: `compact` prop에 맞춰 카드 바디의 너비/높이, 헌터 서클, 몬스터 아이콘, 오라 크기, HP Bar 및 폰트 크기를 모바일 뷰포트에 맞게 비례 축소함.
- **전장 조작부 콤팩트 재배치 및 아코디언 UI 도입 (`src/components/DirectBattlePreviewPanel.tsx`)**: Battlefield2DView에 `compact={true}` prop을 명시하여 전장 높이를 줄이고, 바로 아래에 실시간 "턴 명령 요약" 패널을 배치하여 조작 흐름을 개선. 실행 버튼 하단에 최근 2줄의 콤팩트 로그를 기본 노출. 기나긴 상세 파티 스탯 리스트와 전체 전투 로그는 `showDetailed` 상태를 타는 예쁜 접이식 아코디언(Collapsible) UI로 감싸 기본 상태를 접어두어, 불필요한 세로 스크롤 없이 한 화면에서 조작 가능하게 수정.
- **타입 및 빌드 검증**: `npx tsc --noEmit` 타입 검사 무결성 및 `npm run build` 빌드 검사 통과. 기존 게임 플레이 로직, 공식, 저장 구조는 100% 온전하게 보존.

## 12-38A Shared 2.5D Battle Presentation Foundation — (2026-05-28)
- **공용 Battle Actor ViewModel & 어댑터 설계 (`src/lib/battlePresentation.ts`)**: `DirectBattleState`의 유닛 정보와 HP 데이터를 2.5D 렌더링용 뷰 모델로 매핑. 깊이감을 위해 유닛별 Lane(`front` 그림자, `mid` 헌터, `back` 몬스터/보스) 배정 및 Gate/Tower 테마 구분용 `getBattlefieldTheme` 구성 완료.
- **2.5D Battle Actor Sprite 컴포넌트 (`src/components/battle/BattleActorSprite.tsx`)**: 그림자 고화질 PNG 연동(`ShadowPortrait` 재사용), 헌터 고유 마력 아바타/직업 데코, 몬스터/보스 적대 오라 적용 및 보스 거대화 비주얼 차등화. `idle`(y축 float), `active`(dash 돌격), `target`(shake 피격 진동 및 타겟팅 링), `defeated`( grayscale 흑백 투명화) 애니메이션 구현 완료.
- **데미지 / 회복 수치 팝업 컴포넌트 (`src/components/battle/BattleDamagePopup.tsx`)**: 공격 피해 붉은색 수치 및 치명타 대형 `CRIT!` 황금 팝업, 지속 회복 연두색 `+값` 수치, 방어 `GUARD`, 회피 `MISS` 팝업 연출 완료.
- **Battlefield VFX 이펙트 레이어 컴포넌트 (`src/components/battle/BattlefieldVfxLayer.tsx`)**: 액터 종류 및 스킬 유형(`latestAction.kind`)을 기반으로 타겟 유닛 좌표에 이펙트 출력. `attack`(대각 베기 SVG), `skill`(황금 스파크 폭발), `magic`(마법진), `shadow`(보랏빛 안개), `curse`(핏빛 균열), `heal`(신성한 빛 기둥), `guard`(육각 다면체 방패) VFX 구현 완료.
- **2.5D Arena Battlefield View 컴포넌트 (`src/components/battle/Battlefield2DView.tsx`)**: 2.5D 그리드 라인과 depth 그라데이션이 적용된 전장 공간 렌더링. 진영/Lane별 유닛 상대 좌표 맵핑 및 액션별 팝업/VFX 타이머 소멸 라이프사이클 관리, 웅장한 전투 결과 오버레이(`VICTORY` / `DEFEAT`) 구현 완료.
- **전투 대시보드 2.5D 전장 탑재 (`src/components/DirectBattlePreviewPanel.tsx`)**: 최신 연출 스텝(`currentRevealStep`)과 HP 변동 데이터를 2.5D Battlefield 뷰가 먹을 수 있는 입력 구조(`latestAction`, `battlefieldPhase`)로 가공해 `Battlefield2DView`에 데이터 매핑 및 마운트 완료. `log.isCrit` 컴파일 오류 캐스팅(`(log as any).isCrit`) 수정 완료.
- **타입 정합성 및 빌드 검증**: `npx tsc --noEmit` 타입 검사 완료 (오류 0개) 및 `npm run build` 프로덕션 번들 빌드 성공 완료.
- **게임 코어 로직 100% 보존**: 전투의 피해 공식, 라운드/턴 순서 계산, 상태이상 연산 및 승패 판정, 획득 보상 밸런스 및 로컬 저장 구조(persist v14)를 완벽하게 보존함.

## 12-37C Skill / Reward / Evolution Reveal Polish — (2026-05-28)
- **보상 상자(Reward Box) 2열 카드 그리드화 (`src/components/RewardBoxPanel.tsx`)**: 기존의 수직 텍스트 목록 나열에서 탈피하여 3D 플로팅 효과가 연계된 **2열 프리미엄 카드 그리드**로 개편. Rarity별(Legendary/Epic 골드, Ticket 하늘, Fragment/Essence 보라)로 카드 테두리, HSL 광택, 섀도우를 유기적으로 적용하고 레벨업/랭크업 전용 배지(`👑 RANK UP` / `⚡ LEVEL UP`) 추가 완료.
- **그림자 진화 3D 초상화 노출 (`src/components/ShadowPanel.tsx`)**: 진화 연출(`DramaticReveal`) 완료 시, `result` 영역에 **진화 성공한 새로운 군주급 초상화(xl 크기)와 이름**이 웅장한 골드 룬 오라 레이아웃 속에서 떠오르도록 비주얼 보완 완료.
- **태생 등급 재각성 드라마틱 리빌 탑재 (`src/components/ShadowPanel.tsx`)**: 컴포넌트 레벨에서 시도시점 전후 스냅샷을 비교하는 안전한 감사 래퍼(`handleReawaken`) 연동. 성공 시 찬란히 고동치는 **골드 오라**와 함께 등급 상승 화살표 연출(`C -> B`, `B -> A`, `A -> S`)을 렌더링하고, 실패 시 등급이 안전 장치로 인해 안전하게 유지되었음을 안심시키는 가이드 팝업 구현 완료.
- **특성 재굴림 & 슬롯 개방 프리미엄 리빌 (`src/components/ShadowPanel.tsx`)**: 특성 재굴림 완료 시 이전/신규 특성을 대조하고 Rarity별 등급(Legendary 황금, Epic 보라, Rare 하늘) 배지 및 아우라 카드로 시각화. 슬롯 개방 시 `MAGIC CORE EXPANDED` 배지와 함께 청록 맥동 아우라를 심어 마력 회로 확장감 극대화 완료.
- **직업 스킬 해금 및 임박 시그널 시각화 보완 (`src/components/JobPanel.tsx`)**: 방금 해금된 신규 스킬에 **`NEW` 청록 맥동 배지**를 부여해 사용 가능한 상태임을 알리고, 다음 레벨 도달 시 바로 해금될 임박 스킬에 **`NEXT LV` 주황 맥동 배지**를 이식하여 뚜렷한 목표 제시 완료.
- **컴파일 정합성 및 빌드 무결성 검증**: `npx tsc --noEmit` 타입 검사 완료 (오류 0개) 및 `npm run build` 프로덕션 번들 빌드 성공 완료.
- **게임 로직 100% 보존**: 보상 테이블/확률, 소환권 획득 확률, 진화/재각성/재굴림/슬롯 해금 조건 및 성공률, 비용 공식 등 인게임 성장 경제/밸런스 공식과 로컬 저장 구조(persist v14)를 완벽하게 보존함.

## 12-37B Job / Advancement Premium Visual Upgrade — (2026-05-28)
- **Premium Job VFX CSS 설계 (`src/index.css`)**: 1차 청록 맥동(`.tier-aura-first`), 2차 자수정 보라(`.tier-aura-second`), 3차 찬란한 골드 룬(`.tier-aura-third`), 히든 그림자 칠흑(`.tier-aura-hidden-shadow`), 히든 저주 핏빛(`.tier-aura-hidden-curse`), 히든 차원 공간 왜곡(`.tier-aura-hidden-rift`) 아우라 및 전용 `@keyframes` 애니메이션 주입 완료.
- **Active Job 카드 프리미엄화 & 스킬 트리 탑재 (`src/components/JobPanel.tsx`)**: Active Job 카드를 `motion.div` 3D 입체 플로팅 및 `card-premium-shine` 3D 광택 레이아웃으로 리디자인. 숙련도 XP 프로그레스 바 HSL 그라데이션 반짝임(`mastery-bar-fill`) 연동. **CLASS SKILLS (직업 스킬 트리)** 섹션을 신설하여 해금 스킬(Swords 쌍검 엠블럼)과 잠긴 스킬(Lock 자물쇠 엠블럼 + 해금 레벨 안내)을 콤팩트하고 미려하게 시각화 완료.
- **전직 후보 카드 3D 연출 및 힌트 고도화 (`src/components/JobPanel.tsx`)**: 후보 카드를 `motion.div` 호버 플로팅(-4px, 1.025배) 모션 및 프리미엄 광택으로 업그레이드. 전직 가능 시 HSL 맥동 `AWAKENING READY` / `전직 가능` 배지 노출. 전직 요건 상태(`condLines`)를 둥글고 단정한 `bg-ink-950/60` 컴팩트 칩셋박스로 시각화. 미해금 히든 후보는 정체를 숨기되 계열별 균열 아우라 기척을 강화하여 신비로운 존재감 주입.
- **클래스 도감 카드 3D 및 상태 배지 세련화 (`src/components/JobPanel.tsx`)**: 도감 목록 카드를 3D 플로팅으로 리팩토링하고 해금/장착 상태에 따른 맞춤 오라 적용 및 장착 중 / 선택하기 그라데이션 버튼 세련화 완료.
- **컴파일 정합성 및 빌드 무결성 검증**: `npx tsc --noEmit` 타입 검사 완료 (오류 0개) 및 `npm run build` 프로덕션 번들 빌드 성공 완료.
- **게임 로직 100% 보존**: 전직 조건 판단(`checkJobAwakening`), 전직 수락 수동 흐름(`advanceToJob`), 직업 스킬 수치, 경제 밸런스, 로컬 세이브 구조(`levelup-save`, persist v14)를 완벽하게 보존함.

## 12-37A Shadow Legion Premium Visual Upgrade — (2026-05-28)
- **Premium VFX CSS 설계 (`src/index.css`)**: S태생 황금오라(`grade-aura-s`), A태생 은백오라(`grade-aura-a`), Named 신화오라(`named-pulse`), Deployed 장착 광택(`shadow-deployed-glow`), Evolved 테두리, 3D 프리미엄 카드 광택(`card-premium-shine`) 클래스 및 전용 Keyframes 추가 완료.
- **초상화 크기 및 Hover 인터랙션 개선 (`src/components/shadows/ShadowPortrait.tsx`)**: PNG 에셋 기본 스케일을 `scale-[1.15]`와 `translate-y-[3%]` 오프셋으로 최적화하여 도감 및 카드에서 머리가 잘려 나가는(Head Cropping) 현상 원천 해결. `group-hover:scale-[1.25] group-hover:translate-y-[1%]` 줌 호버 애니메이션 및 drop-shadow 필터 주입 완료.
- **카드 프레임 입체화 (`src/components/shadows/ShadowCard.tsx`)**: `whileHover` 플로팅 모션(-4px) 및 `card-premium-shine` 3D 샤인 레이아웃 결합. Deployed/Evolved/Named/S태생/A태생 결속 오라 및 배지 동적 바인딩 완료.
- **군단 사령부 대시보드 및 Deployed 슬롯 리뉴얼 (`src/components/ShadowPanel.tsx`)**: S/A태생 개수, Named 개수, 최고레벨, 평균레벨, 최고 SCP를 감사하는 통계 대시보드 추가. 장착 슬롯(`DEPLOYED LEGION`)의 `ShadowPortrait` 크기를 `md`에서 `lg`로 키워 이미지 존재감 극대화. 닫는 태그 Framer motion 정합성 보완 완료.
- **원정 편성 및 전장 비주얼 일체화 (`src/components/shadows/ShadowExpeditionPanel.tsx` & `ShadowExpeditionBattlefield.tsx`)**: 원정대 선택 창의 미니그림자 카드를 `motion.button`으로 전환하고 3D 플로팅, 광택 적용. 포트레이트 크기를 `xs`에서 `sm`으로 20px 이상 확대. 원정 Battlefield 전장 유닛들의 오라를 `grade-aura-s`, `grade-aura-a`, `named-pulse`, `shadow-evolved-card`와 직접 연계하여 전장 시각 완성도 폭발 및 Active Actor 포트레이트 보완 완료.
- **게임 로직 보존 및 무결성 검증**: 전투 공식, 그림자 스탯 공식, 정수 소모/강화/소환/원정 확률 및 세이브 구조(`levelup-save`, persist v14)를 100% 보존한 상태에서 `npx tsc --noEmit` 무오류 통과 및 `npm run build` 빌드 성공 검증 완료.

## LEVEL UP 외부 참고용 종합 티어표 문서 작성 (12-36A) — (2026-05-28)
- **종합 티어표 문서 신규 작성**: [levelup-tier-list.md](file:///c:/Users/khdkf/levelup/docs/levelup-tier-list.md)를 새로 만들어 그림자, 장비, 직업군 전체를 객관적인 데이터와 후반 성장성, 범용성에 기초하여 SSS~C 등급표로 체계화 완료.
- **그림자 티어표**: 70여 종이 넘는 전체 그림자(소환형, 게이트 네임드, 성취 네임드 포함)를 basePower, effects, named 가치, 진화 가능성 및 innate grade와의 시너지를 기반으로 면밀히 분석하고 1~2문장의 평가 이유와 함께 맵핑 완료.
- **장비 티어표**: ITEM_POOL 내의 40종 이상의 일반/특수 장비를 희귀도, 파츠별 장착 슬롯, 고유 스탯 보정치, 특수 효과(effects) 및 액티브/패시브 스킬 유무, 카테고리성장 XP 시너지를 활용해 객관적 티어로 맵핑 완료.
- **직업 티어표**: Novice tier부터 1차, 2차, 3차 일반 및 3대 히든 계열(그림자, 저주, 시공/균열) 전직 트리 전체를 전투 성능, 기동성, 스킬 개성, 인과 반사/파멸 저주 등의 고유 효과, 운용 난이도 및 퀘스트 성장 친화도(Affinity)를 감안해 맵핑 완료.
- **코드 무결성 유지**: 문서 작성에 초점을 두어 별도 앱 UI나 게임 로직(밸런스 수치, 전투 공식, 보상, 확률, 저장 구조)은 일체 변경하지 않았음을 100% 검증 완료.

## 히든 직업 해금 조건 난이도 재조정 및 희귀성 강화 (12-34D) — (2026-05-28)
- **Hidden Resonance 공명 데이터 모델 구축**: 계열별(`shadow`, `curse`, `rift`) 누적 공명 수치 및 신호 발생 횟수를 추적하는 `HiddenJobPathProgress` 타입을 [types.ts](file:///c:/Users/khdkf/levelup/src/lib/types.ts)에 정의하고 `HunterState`에 저장 구조 연동 완료.
- **신호 공명 가중치 설계 및 누적 연동**: [store.ts](file:///c:/Users/khdkf/levelup/src/lib/store.ts) 내부에 `SIGNAL_WEIGHTS` 가중치 테이블과 `addHiddenSignalToState` 헬퍼 함수를 적용하여 그림자 추출 시도(+1) 및 성공(+3), rare 이상(+4) 및 named 획득(+5), 원정 성공(+2) 및 대성공(+4), 생사경 극복 승리(+3) 및 S급/보스전 긴박 승리(+5), 장기전(+2/curse & rift), 탑 보스 긴박 승리(+5) 등 정밀 신호 가중치 누적 구현 완료.
- **히든 1~3차 전직 조건 다중화**: [jobs.ts](file:///c:/Users/khdkf/levelup/src/lib/jobs.ts)의 모든 히든 직업 `unlockCondition`에 `resonanceRequired` 요구량과 관련 signal 조건 등록. 스토어의 `checkJobAwakening`에서 런타임 검증(히든 1차는 원정 성공 경험이나 생사경 극복 등 다중 조건 조합 필수, 히든 2/3차는 이전 히든 직업 레벨 충족 여부 체크) 구현 완료.
- **하위 호환 마이그레이션**: 저장 파일 로드 런타임에 resonance 데이터가 없을 경우 기존 단방향 `hiddenSignalKeys`를 기반으로 공명 점수를 정밀 복원하여 자동 저장(persist)해주는 `migrateHiddenResonance` 탑재.
- **UI 동적 힌트 마스킹 및 스포일러 방지**: [JobPanel.tsx](file:///c:/Users/khdkf/levelup/src/components/JobPanel.tsx)에 `getDynamicHiddenHint` 헬퍼를 추가하여 미해금 히든 클래스 카드의 힌트 문구와 이름(???)이 공명 누적 수준에 따라 4단계로 동적 변화하도록 구현 (0%: 완전 침묵 -> 50% 미만: 반응 시작 -> 100% 미만: 기척 뚜렷 -> 충족: 복원 및 임박). 상세 공명 수치는 일절 차단하여 RPG 게임 감성 보존 완료.
- **무결성 검증**: `npx tsc --noEmit` 타입 검사 무오류 통과, `npm run build` 빌드 검사 통과, `scripts/smoke-direct-battle-runtime.ts` 테스트 통과 완료.

## Shadow Essence Advanced Usage Expansion — 그림자 정수 고급/후반 사용처 확장 (2026-05-27)
- **그림자 고유 특성(Trait) 재굴림 및 부여**: 그림자 등급에 따라 특성 슬롯 개수를 차등 배분(`getShadowMaxTraitSlots`, 네임드/진화체/Rare+: 2개, 일반: 1개)하고, 전설 3%, 영웅 12%, 희귀 25%, 일반 60% 가중치 기반 특성 재굴림(`rerollShadowTrait`) 기능 및 점증 비용 공식 구현.
- **스킬 및 패시브 마력 회로 (슬롯 개방)**: 레벨 10 이상, 강화 +2 이상, Rare 등급 이상 조건에서 패시브 및 액티브 보조 스킬 슬롯 개방(`unlockShadowSlot`) 및 기운 장착 드롭다운 연동 구현. 네임드 그림자는 마력 회로 완전 개방 혜택 부여.
- **군단 시너지 결속 성좌 (Legion Node) & 순환 참조 해결**: 모든 그림자에 상시 적용되는 6종의 군단 단련 성좌 노드(`SHADOW_LEGION_NODES`) 추가. 스탯 계산 모듈과의 순환 참조 방지를 위해 `registerLegionNodeLevelResolver` 리졸버 구조를 탑재해 `store.ts`와 `shadowStats.ts` 간의 실시간 스탯/전투력 동기화 완료.
- **전설 히든 진화 물질 합성 연성소**: 차기 진화 및 군주급 그림자 한계 돌파를 위한 4종의 고부가가치 히든 진화 재료 합성 액션(`craftHiddenEvolutionMaterial`) 및 인벤토리 아이템 생성 연동 완료.
- **태생 등급 재각성 시스템 검수 및 저장소 호환성 확보**: `reawakenShadowInnateGrade` 액션의 조건 검증을 정밀 확인 및 보완하고, Hydration 병합 시 `shadowLegionNodes` 빈 객체 fallback 코드를 탑재하여 기존 세이브 파일 호환성 100% 보장.
- **UI/UX 개선 및 컴파일/빌드 검증**: `ShadowPanel.tsx` 내의 그림자 정수 연구소 & 상점 탭을 Collapsible Layout으로 완성. `npx tsc --noEmit` 무결성 패스, `npm run build` 빌드 성공, 모의 전투 및 대규모 원정 시뮬레이션 무크래시 완료.

## Shadow Essence Usage Expansion 1차 — 그림자 정수 사용처 확장 (2026-05-27)

- **그림자 집중 훈련소**: 그림자 정수를 소모해 무제한 훈련 가능한 시스템 구축. 등급별(Epic x1.15, Legendary x1.3), 태생 등급별(A x1.2, S x1.5), Named 여부(x1.5)를 복합 곱연산하여 최종 비용 가중치 계산(`getShadowTrainingCostMultiplier`) 및 안전한 최대 레벨 제한 돌파 방어.
- **그림자 정수 상점**:
  - 일반 그림자 소환권 구매(60정수) 액션 및 소환권 인벤토리 연결 완료.
  - 그림자 추출 보조 촉매🧪 구매(30정수) 액션 및 인벤토리 추가 완료.
- **추출 촉매 자동 소모 및 보정 연동**: 게이트 클리어 후 추출(`attemptShadowExtraction`) 실행 시, 인벤토리에서 촉매를 감지하면 자동으로 1개 소모하고 성공률에 고정 보정치 `bonusChance: +5% (+0.05)`를 합산 판정하여 결과 피드백을 안내하도록 완벽 바인딩.
- **고급 정수 연구소 (태생 등급 재각성)**:
  - 헌터 레벨 10 이상, 강화 +3 이상 조건 충족 시 정수 100을 소비하여 C$\rightarrow$B(50%), B$\rightarrow$A(30%), A$\rightarrow$S(10%) 확률로 태생 등급 한계 돌파를 시도하고 실패 시 등급이 보존되는 재각성 액션 구현 완료.
  - 고유 특성 재굴림, 스킬 슬롯 확장, 군단 시너지 결속, 히든 진화 재료 합성 등 12-35B 패치 타겟들에 대해 비활성화 자물쇠 카드로 선공개하여 디자인 확장성을 마련.
- **UI/UX 구현**: `ShadowPanel.tsx` 상단에 미려한 아코디언(Collapsible) 디자인의 보랏빛 "그림자 정수 연구소 & 상점" (Essence Lab) 섹션을 탑재하여 집중 훈련, 소환/촉매 상점, 등급 재각성 연구 시도를 유기적으로 렌더링.
- **안정성 확인**: `npx tsc --noEmit` 컴파일 검사 성공, `npm run build` 빌드 성공, `smoke-direct-battle-runtime.ts` 30회 전투 및 `sim-shadow-expedition.ts` 600회 원정 시뮬레이션 무크래시 통과 완료.
- **제외 범위 준수**: 훈련 및 상점 구매에 일일/주간 제한 절대 금지 준수, 보관 슬롯 및 1회성 전투 버프 등의 편의형 소모 금지 준수, 기존 데이터 호환성 보장 및 `persist version v14`, `levelup-save` 호환성 완벽 유지.

## Job System v2 완성 검수 — 직업별 스킬 실전 작동 확인 + 최소 밸런스 점검 + 누락 보완 (2026-05-27)
- **직업 스킬 레벨 적용 수정**: `src/lib/game.ts`의 `getPlayerCombatSkills` 및 `store.ts`, `battleUnits.ts`, `combatPower.ts`에서 직업 스킬을 로드할 때 `jobLevel` 파라미터가 누락되어 1차 직업의 2레벨 해금 스킬 등이 전투 중에 누락되던 버그를 수정하여, `activeJobId` 및 해당 직업의 실제 레벨(`jobLevel`)을 바인딩해 전달하도록 수정 완료.
- **직업별 스킬 실제 연결 감사**: `jobs.ts`와 `seed.ts`의 `SKILL_DEFINITIONS`를 연동 감사하여 모든 직업군의 스킬 ID가 정상적으로 정의되어 있음을 100% 검증.
- **최소 밸런스 감사 스크립트 작성 및 실행**: `scripts/audit-job-balance.ts`를 신규 추가하여 `lone_charger` 상대로 헌터 레벨 10/기본 스탯 10/직업 레벨 2 조건에서 50회 모의 시뮬레이션을 돌려 1차 직업군(6종)의 전투 성능(승률, 소요 턴, 생존율, 스킬 사용 횟수)을 비교 검증. 초보 헌터 대비 고유 직업군의 뛰어난 성능 및 생존 버프/디버프 사용 편차가 뚜렷하게 관찰됨을 확인.
- **전투 런타임 안정성 및 회귀 검증**: `npx tsc --noEmit` 컴파일 검사 성공, `npm run build` 빌드 성공, `npx tsx scripts/smoke-direct-battle-runtime.ts`를 통한 30회 전투 시뮬레이션 무크래시 통과 완료.
- **로직 보존**: AI Coach, Daily, Main, Core 로직 변경 없으며, `persist version v14`, `levelup-save` 호환성을 완벽 유지함.

## Job System v2 완성 패치 — 단계별 전직 트리 및 히든 계열 완성 (2026-05-27)
- **직업 풀 대규모 확장 및 선택지 보장**: [jobs.ts](file:///c:/Users/khdkf/levelup/src/lib/jobs.ts)를 전면 수정하여 일반 전직군을Novice $\rightarrow$ 1차(6종) $\rightarrow$ 2차(8종) $\rightarrow$ 3차(24종) 구조로 재편하고, 각 단계당 3개 이상의 선택지를 노출하도록 설계 완료.
- **히든 클래스 계열화 및 특수 기믹 감지**: 그림자 계열, 저주 계열, 차원 계열의 3대 히든 계열 트리(1차 $\rightarrow$ 2차 $\rightarrow$ 3차 구조)를 완비하고, [store.ts](file:///c:/Users/khdkf/levelup/src/lib/store.ts)에서 직접 전투 결과 정산(`resolveDirectGateBattle`, `resolveDirectTowerBattle`) 및 그림자 추출 시점에 `'low-hp-victory'`, `'long-battle-victory'`, `'shadow-extraction-attempt'` 등의 고유 플레이 시그널을 감지하여 퍼시스트하도록 구현.
- **엄격한 전직 경로 및 계열 검증**: 스토어 내의 `checkJobAwakening` 및 `advanceToJob` 액션에서 이전/이후 계열 검증을 강화하여 마법사에서 광전사 등 엉뚱한 경로로 우회 전직하는 것을 차단.
- **UI/UX 개선 및 도감 접기**: [JobPanel.tsx](file:///c:/Users/khdkf/levelup/src/components/JobPanel.tsx)를 리뉴얼하여 현재 장착 직업에서 파생되는 다음 티어 후보군만 표시하고 전체 전직 구조도는 하단에 Collapsible 클래스 도감으로 배치. 특히 미해금된 히든 후보(???)들은 전직 후보에서 숨겨 도감과 함께 접히도록 로직을 완성하였으며, [jobs.ts](file:///c:/Users/khdkf/levelup/src/lib/jobs.ts)의 히든 해금 힌트들을 시적이고 수치가 노출되지 않는 추상적인 형태로 리팩토링 완료.
- **런타임 크래시 방지 및 시드 스킬 등록**: [seed.ts](file:///c:/Users/khdkf/levelup/src/lib/seed.ts)의 `SKILL_DEFINITIONS`에 신규 추가된 직업 스킬 39종의 메타데이터를 선언하여 전직 시 스킬 렌더링이나 사용에서 런타임 오류가 발생하지 않도록 조치.
- **안정성 확인**: `npx tsc --noEmit` 타입 검증, `npm run build` 번들 빌드, `npx tsx scripts/smoke-direct-battle-runtime.ts`를 통한 30회 다중 전투 시뮬레이션 무크래시 검증 완료.

## Job System v2 리뉴얼 1차 구현 — RPG/웹툰식 전직 트리 및 기반 설계 (2026-05-27)
- **직업 데이터셋 V2 도입**: [jobs.ts](file:///c:/Users/khdkf/levelup/src/lib/jobs.ts)를 신규 작성하여 Novice, 1차, 2차, 3차 및 히든(마스킹 지원) 직업 29종 및 전직 조건(`JobUnlockCondition`), 친화도(`JobGrowthAffinity`) 등 설계.
- **타입 정의 및 헌터 상태 확장**: [types.ts](file:///c:/Users/khdkf/levelup/src/lib/types.ts)에 `JobTier`, `JobDefinitionV2`, `OwnedJobState` 등 정의 및 `HunterState`에 `jobs`, `activeJobId`, `availableAdvancements`, `discoveredHiddenJobIds` 상태 확장.
- **수동 전직 및 activeJob XP 획득 연동**: [store.ts](file:///c:/Users/khdkf/levelup/src/lib/store.ts)에서 자동 전직을 차단하고, 전직 조건 달성 시 `availableAdvancements`에 후보가 등록되어 플레이어가 직접 선택하여 수락하는 전직 구조 구축. 일일 퀘스트 완료 시 활성 직업에 기본 XP를 부여하고, 친화 카테고리가 일치할 경우 보너스 XP 획득 연동.
- **기존 데이터 호환 보장 (Fallback)**: Rehydration 마이그레이션 단계에서 구버전 직업 세이브 데이터를 신규 V2 데이터로 안전하게 변환 및 없는 경우 초보 헌터(`novice-hunter`)로 폴백하여 로컬 세이브 (`levelup-save`, persist version 14) 유지.
- **스킬 연동 및 UI 리뉴얼**: [skills.ts](file:///c:/Users/khdkf/levelup/src/lib/skills.ts)를 수정하여 활성 직업 및 직업 레벨에 따라 스킬을 정상 조회하도록 수정. [JobPanel.tsx](file:///c:/Users/khdkf/levelup/src/components/JobPanel.tsx) UI를 접힘 상태, 활성 직업 카드, 전직 후보 선택 UI, 히든 직업 마스킹 처리 등으로 리뉴얼. [HunterStatus.tsx](file:///c:/Users/khdkf/levelup/src/components/HunterStatus.tsx) 렌더링 수정.
- **안정성 검증 완료**: `npx tsc --noEmit` 타입 체크 및 `npm run build` 프로덕션 빌드 성공.

## 전투 턴수 제한 제거 패치 — 게이트/무한의 탑 전투가 7턴 전후에서 중단되고 패배 처리되는 문제 수정 (2026-05-25)
- **Direct Battle 턴수 제한 제거 및 Hard Safety 도입**: directBattleRuntime.ts 내에서 `state.round >= state.maxRounds` 조건으로 인해 전투가 강제 종료되는 부분을 제거하고, 무한 루프 방지용 `HARD_SAFETY_ROUND_LIMIT = 200`을 도입하여 200턴 도달 시 'safety_abort' 및 무승부(none) 상태로 중단하도록 수정.
- **Direct Battle Outcome 판정 수정**: DirectBattlePreviewPanel.tsx의 `getPanelOutcome`에서 winner가 player면 victory, enemy면 defeat, 그 외(stalemate/none)의 경우는 cancelled로 맵핑하여 강제 패배로 기록되지 않도록 수정.
- **Auto/Manual Battle Simulator 턴 제한 상향**: game.ts 내의 `simulateGateBattle` 및 `simulateGateWaveBattle`에서 maxTurns 기본값을 30에서 200으로 크게 늘려 일반 전투에서는 턴 제한 초과로 인한 무승부(draw)가 발생하지 않도록 조치.
- **Game State Store 및 Manual Battle config 수정**: resolveDirectGateBattle 및 resolveDirectTowerBattle에서 draw/cancelled 결과가 패배(defeat)로 변환되지 않고 무승부/시간초과로 올바르게 기록되도록 결과 맵핑 수정. 수동 전투 시작(startManualGateBattle, startTowerManualBattle) 시에도 maxTurns 설정을 30에서 200으로 증가.
- **기존 데이터 보존**: persist v14 및 levelup-save key 유지.
