# Shadow Portrait Asset Catalog
**Revision:** 12-24C  
**Total shadows registered:** 80 (full roster coverage ongoing — see below)  
**Final goal:** individual PNG/WebP portrait for every shadow soldier.

---

## Status legend
| Status | Meaning |
|--------|---------|
| `missing` | No illustration exists; SVG family silhouette used as fallback |
| `planned` | Visual direction defined; ready for illustration |
| `draft`   | WIP illustration exists but not shipped |
| `final`   | Illustration asset registered in `SHADOW_PORTRAIT_ASSETS` |

---

## Rendering pipeline (ShadowPortrait)
```
1. SHADOW_PORTRAIT_ASSETS[portraitKey]   →  <img> overlay (final)
2. assetFamily === 'named_gate'           →  renderNamedGateDecor SVG
   assetFamily === 'named_achievement'    →  renderAchievementDecor SVG
3. assetFamily dispatch                   →  renderSpearman / Executor / Rift / etc.
4. role-based SVG fallback               →  generic role silhouette
```

---

## Asset families & SVG functions

| Family | SVG Function | Render traits |
|--------|-------------|---------------|
| `rat` | `renderBeast('rat', …)` | 네발, 긴 꼬리, 뾰족한 귀 |
| `scout` | `renderSoldier('scout-knife', …)` | 후드, 쌍 단검 |
| `infantry` | `renderSoldier('blade', …)` | 롱소드, 갑주 |
| `spearman` | `renderSpearman` | 긴 대각선 창, 크로스가드 |
| `executor` | `renderExecutor` | 넓은 어깨, 처형검, 뿔 투구 |
| `shield` | `renderGuard` | 방패, 둔중한 체형 |
| `hound` | `renderBeast('hound', …)` | 네발 추적 짐승 |
| `scribe` | `renderAnalyst` | 두루마리/책, 룬 빛 |
| `support` | `renderSupport` | 깃발/지팡이 |
| `rift` | `renderRift` | 파편화 실루엣, 균열선 |
| `named_gate` | `renderNamedGateDecor` | 황금 균열선 데코 오버레이 |
| `named_achievement` | `renderAchievementDecor` | 왕관 데코 오버레이 |

---

## Phase 1 — E-rank gate extracts (common/uncommon/rare)

| portraitKey | name | role | rarity | assetFamily | status | visual direction |
|-------------|------|------|--------|-------------|--------|-----------------|
| shadow-rat | 그림자 쥐 | scout | common | rat | missing | 낮은 네발, 긴 꼬리, 불씨 눈 |
| rift-remnant | 균열 잔영 | support | common | rift | missing | 비정형 반투명 인간형, 틸 빛 눈 |
| dim-scribe | 흐린 서기병 | analyst | common | scribe | missing | 희미한 후드, 작은 두루마리 |
| shadow-sentry | 그림자 보초 | guard | common | shield | missing | 기본 방패병, 금 간 원형 방패 |
| paper-wisp | 종이 잔영 | analyst | common | scribe | missing | 표류 종이 조각, 연한 황백색 |
| ash-helper | 재 보조병 | support | common | support | missing | 작은 등불, 재색/잿빛 |
| dull-blade | 무딘 칼날병 | assault | common | infantry | missing | 낡은 단검, 어두운 적회색 |
| cracked-guard | 금 간 방패병 | guard | common | shield | missing | 갈라진 원형 방패, 회색 |
| rift-fang | 균열 송곳니 | assault | uncommon | rift | missing | 파편화된 공격자, 적색 균열 |
| dark-vanguard | 어두운 선봉 | hunter | uncommon | hound | missing | 날렵한 추적자 인간형, 청회색 |
| black-claw | 검은 발톱 | assault | rare | infantry | missing | 날카로운 장갑 장착, 암흑 강조 |
| rift-tracker | 균열 추적자 | hunter | rare | hound | missing | 냄새 추적 자세, 틸/흑색 |
| ember-mender | 잿불 치유병 | support | uncommon | support | missing | 따뜻한 주황 등불, 재/불씨 |
| archive-reader | 서고 판독병 | analyst | uncommon | scribe | missing | 두루마리 위 눈 빛남, 연한 시안 |
| mist-runner | 안개 주자 | scout | uncommon | scout | missing | 후드+얇은 망토, 안개 흰색/청색 |
| bone-picker | 뼈 수집병 | hunter | uncommon | hound | missing | 뼈 조각 묶음, 황회색 |
| rift-librarian | 균열 사서 | analyst | rare | scribe | missing | 부유하는 책+균열 빛, 시안 강조 |
| oath-carrier | 맹세 운반병 | support | rare | support | missing | 봉인 두루마리, 황금색 |

**E-rank named gate:**

| portraitKey | name | assetFamily | status | visual direction |
|-------------|------|-------------|--------|-----------------|
| ner-first-rift | 첫 균열의 네르 | named_gate | **planned** | 균열 단검, 별 눈금, 황금 발광 |
| rook-backstreet | 뒷골목의 루크 | named_gate | **planned** | 탑 방패, 요새 투구, 황금 균열선 |
| lark-nest-fang | 둥지 송곳니 라크 | named_gate | **planned** | 갈고리 대검, 뿔 투구, 주황 화염 |
| vela-rift-mender | 균열 봉합의 벨라 | named_gate | missing | 봉인 기장, 틸 균열 빛 |
| marn-backstreet-ledger | 골목 장부의 마른 | named_gate | missing | 기록부, 시안 렌즈 |

---

## Phase 2 — D-rank gate extracts

| portraitKey | name | role | rarity | assetFamily | status | visual direction |
|-------------|------|------|--------|-------------|--------|-----------------|
| shadow-infantry | 그림자 보병 | assault | common | infantry | missing | 롱소드+어깨 갑주, 보라 강조 |
| sloth-spawn | 나태 종자 | guard | common | shield | missing | 무거운 원형 방패, 녹회색 |
| shadow-spearman | 그림자 창병 | assault | common | **spearman** | missing | 긴 대각선 창, 어두운 회청색 |
| sloth-guard | 나태 파수병 | guard | uncommon | shield | missing | 둔중한 방패 자세, 올리브그린 |
| shadow-annotator | 그림자 주석병 | analyst | uncommon | scribe | missing | 펜+기록부, 시안 룬 |
| sloth-chorister | 나태 성가병 | support | uncommon | support | missing | 느린 지휘봉, 민트/녹색 |
| shadow-chaser | 그림자 추격병 | scout | uncommon | scout | missing | 날렵한 후드, 스카이블루 |
| dark-executor | 어두운 처형병 | assault | uncommon | **executor** | planned | 거대 처형검, 뿔 투구, 붉은 강조 |
| black-shieldman | 검은 방패병 | guard | rare | shield | missing | 검은 탑 방패, 암적색 강조 |
| sloth-hunter | 나태 사냥꾼 | hunter | rare | hound | missing | 느린 추적자, 황회색 |
| silent-archer | 침묵 궁수 | scout | rare | scout | missing | 활+망토, 어두운 회색/청색 |
| drowsy-medic | 졸음 의무병 | support | common | support | missing | 반쯤 감긴 눈, 청록색 약병 |
| ledger-imp | 장부 임프 | analyst | common | scribe | missing | 작은 장부, 황갈색 룬 |
| rust-axeman | 녹슨 도끼병 | assault | common | infantry | missing | 큰 도끼, 녹슨 갈색 |
| lantern-scout | 등불 정찰병 | scout | uncommon | scout | missing | 등불 들고 후드, 황주황색 |
| mire-shield | 늪 방패병 | guard | uncommon | shield | missing | 진흙 묻은 방패, 올리브 갈색 |
| ravenous-pup | 굶주린 사냥견 | hunter | uncommon | hound | missing | 네발 짐승, 뼈 조각, 갈색 |
| minute-caller | 분침 호출병 | support | rare | support | missing | 시계 문양 지휘봉, 은색 강조 |
| black-annotator | 검은 주석관 | analyst | rare | scribe | missing | 검은 기록부, 심홍/금색 룬 |
| sloth-raider | 나태 약탈병 | hunter | rare | hound | missing | 갈고리+포대, 황갈색 |
| sloth-knight | 나태 기사 | guard | epic | shield | missing | 반격 자세, 에픽 발광 방패, 에메랄드 |
| archive-duelist | 서고 결투병 | analyst | epic | scribe | missing | 룬 검+기록부, 에픽 시안 |

**D-rank named gate:**

| portraitKey | name | assetFamily | status | visual direction |
|-------------|------|-------------|--------|-----------------|
| gorn-sloth-captain | 나태 소대장 고른 | named_gate | **planned** | 황금 창+탑 방패, 나태 문장 에폴렛 |
| shark-black-chaser | 검은 추격자 샤크 | named_gate | **planned** | 쌍 단검, 상어 후드, 청색 속도선 |
| doru-sloth-cantor | 나태 선창자 도루 | named_gate | missing | 지휘봉+나태 문장, 민트 균열선 |
| sable-patrol-knife | 순찰검 세이블 | named_gate | missing | 검은 역수 단검, 적 균열선 |

---

## Phase 3 — C-rank gate extracts

| portraitKey | name | role | rarity | assetFamily | status | visual direction |
|-------------|------|------|--------|-------------|--------|-----------------|
| forgetting-recorder | 망각 기록병 | analyst | uncommon | scribe | missing | 두루마리+룬 적기, 차가운 시안 |
| fatigue-guardian | 피로 수호병 | guard | uncommon | shield | missing | 낡은 원형 방패, 에메랄드 강조 |
| rift-trainee | 균열 훈련병 | assault | uncommon | **rift** | missing | 반투명 균열 실루엣, 틸 파편 |
| greed-hound | 탐욕 사냥개 | hunter | uncommon | hound | planned | 핑크 불꽃 눈, 먹잇감 자세 |
| forgetting-scribe | 망각 서기관 | analyst | rare | scribe | planned | 부유 페이지+룬 깃털, 진화 시안 |
| fatigue-shieldman | 피로 방패병 | guard | rare | shield | planned | 성벽 방패, 진화 에메랄드 |
| rift-instructor | 균열 교관 | support | rare | support | missing | 교관 지팡이+군단 깃발, 보라 |
| greed-collector | 탐욕 수집가 | hunter | rare | hound | planned | 체인 짐승, 황금 구슬 눈 |
| rift-wayfinder | 균열 길잡이 | scout | rare | scout | missing | 나침반 후드, 틸/스카이블루 |
| forgetting-watcher | 망각 감시자 | analyst | epic | scribe | missing | 에픽 눈 룬+기록부, 심청색 |
| rift-tactician | 균열 전술관 | support | epic | support | missing | 전술판+지휘봉, 에픽 보라 |
| fatigue-wall | 피로 성벽 | guard | epic | shield | missing | 요새형 방패, 에픽 철회색 |
| rift-gladiator | 균열 투사 | assault | epic | **rift** | missing | 파편 무장, 에픽 적 균열 |
| greed-devourer | 탐욕 포식자 | hunter | epic | hound | missing | 집어삼키는 자세, 에픽 황금 |
| rift-cartographer | 균열 지도병 | scout | uncommon | scout | missing | 나침반+지도 두루마리, 틸 |
| fatigue-cantor | 피로 선창병 | support | uncommon | support | missing | 악보 지휘봉, 민트 강조 |
| greed-ledger | 탐욕 장부병 | analyst | rare | scribe | missing | 황금 장부, 황색 룬 |
| corridor-banner | 회랑 기수 | support | rare | support | missing | 군단 깃발, 보라/황금 |
| mirror-hunter | 거울 사냥꾼 | hunter | rare | hound | missing | 거울 방패 추적자, 은/틸 |
| iron-bastion | 철의 보루 | guard | epic | shield | missing | 에픽 요새 방패, 철회/금색 |
| rift-champion | 균열 투장 | assault | epic | **rift** | missing | 에픽 균열 파편 무장, 적 균열 |
| midnight-oracle | 자정 예언병 | support | epic | support | missing | 에픽 예언봉, 청보라 달빛 |

**C-rank named gate:**

| portraitKey | name | assetFamily | status | visual direction |
|-------------|------|-------------|--------|-----------------|
| karden-forgetting-scribe | 망각 서기 카든 | named_gate | **planned** | 룬 깃털+대형 기록부, 황금 균열선 |
| organ-fatigue-shield | 피로 방패 오르간 | named_gate | **planned** | 요새 방패, 에메랄드 균열선 |
| raban-rift-instructor | 균열 교관 라반 | named_gate | **planned** | 지휘봉+군단 깃발, 보라 균열선 |
| grid-greed-hound | 탐욕 사냥개 그리드 | named_gate | **planned** | 체인 짐승, 황금 균열선 |
| mero-fatigue-reader | 피로 판독관 메로 | named_gate | missing | 분석 기록부, 틸 균열선 |
| tess-rift-wayfinder | 균열 길잡이 테스 | named_gate | missing | 나침반 후드, 청색 균열선 |
| balm-greed-ledger | 탐욕 장부관 발름 | named_gate | missing | 황금 장부, 황금 균열선 |

---

## Phase 4 — Achievement named shadows

| portraitKey | name | role | rarity | status | visual direction |
|-------------|------|------|--------|--------|-----------------|
| kasim-analyst | 분석관 카심 | analyst | legendary | planned | 오라클 두건+도표 기록부, 황금/시안 왕관 |
| rao-market-watcher | 시장 감시자 라오 | analyst | epic | missing | 차트 두루마리, 스카이블루 왕관 |
| charka-finance-patron | 금융 후원자 차르카 | support | legendary | planned | 코인 문장 지팡이, 황금 왕관 |
| nebl-black-accountant | 검은 회계사 네블 | analyst | epic | missing | 장부+연필, 은/황갈색 왕관 |
| volen-strategist | 전략가 볼렌 | support | epic | missing | 전략판 지휘봉, 보라 왕관 |
| verk-steel-knight | 강철 기사 베르크 | assault | legendary | planned | 강철 대검+뿔 투구, 적 왕관 |
| raven-running-shadow | 질주 그림자 레이번 | scout | epic | missing | 날개 스카프, 스카이블루 왕관 |
| moro-restraint-chef | 절제 조리장 모로 | support | epic | missing | 국자+화로 문장, 에메랄드 왕관 |
| nok-sleep-keeper | 수면 파수꾼 노크 | guard | epic | missing | 달빛 방패, 청색 왕관 |
| baron-cutting-watcher | 커팅 감시자 바론 | guard | legendary | planned | 감시 방패+체인, 적 왕관 |
| irnel-registrar | 기록관 이르넬 | support | legendary | missing | 정밀 기록부, 시안 왕관 |
| kalt-deadline-executor | 시한 집행자 칼트 | scout | epic | missing | 시계 단검, 주황 왕관 |
| seron-saver | 절약가 세론 | hunter | epic | missing | 코인 체인, 황금 왕관 |
| lumen-dawn-vanguard | 새벽 척후 루멘 | scout | epic | missing | 새벽 단검+빛 스카프, 황백색 왕관 |
| hexa-study-lantern | 학습 등불 헥사 | support | epic | missing | 등불 지원자, 황금 왕관 |
| mira-career-auditor | 커리어 감사관 미라 | analyst | epic | missing | 보고서 분석, 보라 왕관 |
| borin-training-captain | 수련 대장 보린 | assault | legendary | missing | 훈련 대검, 적/황 왕관 |
| sena-health-warden | 건강 감시관 세나 | guard | epic | missing | 회복 방패, 에메랄드 왕관 |
| orien-mind-anchor | 정신의 닻 오리엔 | support | legendary | missing | 닻 지팡이, 보라 왕관 |
| pavel-finance-scout | 재정 정찰관 파벨 | scout | epic | missing | 숫자 나침반, 스카이블루 왕관 |
| naru-social-herald | 관계 전령 나루 | support | epic | missing | 연결 깃발, 민트 왕관 |
| voss-challenge-blade | 도전검 보스 | assault | legendary | missing | 도전 칼날, 황적색 왕관 |
| runo-habit-keeper | 습관 보관자 루노 | guard | epic | missing | 기록 방패, 보라/청색 왕관 |
| elan-balance-weaver | 균형 직조자 엘란 | analyst | legendary | missing | 다중 균형 룬, 황금 왕관 |

---

## Summary by status

| Status | Count |
|--------|-------|
| final | 0 |
| draft | 0 |
| planned | 16 |
| missing | 64+ |
| **Total registered** | **80+** |

---

## How to add an asset (step-by-step)

1. Create illustration → save as `/public/assets/shadows/<family>/<portraitKey>.webp`
2. Open `src/lib/shadowPortraitAssets.ts`
3. Uncomment or add entry in `SHADOW_PORTRAIT_ASSETS`:
   ```ts
   'ner-first-rift': '/assets/shadows/named/ner-first-rift.webp',
   ```
4. Update `status` in `SHADOW_PORTRAIT_REGISTRY` to `'draft'` or `'final'`
5. Run `npm run build` to verify

The `<img>` overlay in `ShadowPortrait` will automatically render over the SVG fallback once the entry exists.
