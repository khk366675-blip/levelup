
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
