import type { 
  HunterGradeState, 
  HunterGradeTier, 
  AssociationRatingBreakdown, 
  PromotionExamState, 
  Quest,
  OwnedShadow,
} from './types'

export interface HunterTitleDefinition {
  id: string
  name: string
  description: string
  unlockCondition: string
}

export const HUNTER_TITLE_DEFINITIONS: HunterTitleDefinition[] = [
  { id: 'title_e', name: '신입 헌터', description: '헌터 협회에 등록된 것을 증명하는 첫 표식입니다.', unlockCondition: 'E등급 달성' },
  { id: 'title_d', name: '현장 견습 헌터', description: '실전 협회 게이트 공략을 견습 수료한 헌터입니다.', unlockCondition: 'D등급 달성' },
  { id: 'title_c', name: '게이트 조사관', description: '마력 웅덩이 파장을 분석할 줄 아는 엘리트 대원입니다.', unlockCondition: 'C등급 달성' },
  { id: 'title_b', name: '상급 토벌자', description: '수십 회의 토벌을 지휘하며 길을 열어온 개척자입니다.', unlockCondition: 'B등급 달성' },
  { id: 'title_a', name: '정예 헌터', description: '이계의 위협 속에서도 생존을 견인해내는 핵심 토벌대입니다.', unlockCondition: 'A등급 달성' },
  { id: 'title_s', name: 'S급 헌터', description: '압도적인 마력 위상으로 단독으로 전장을 지배하는 헌터입니다.', unlockCondition: 'S등급 달성' },
  { id: 'title_national', name: '국가권력급 헌터', description: '국가에 대적하거나 수호할 수 있는 정점에 선 인류입니다.', unlockCondition: '국가권력급 달성' },
  { id: 'title_focus', name: '집중 잠입자', description: '한번의 탭 이탈 없이 포커스를 온전히 성공해온 몰입가입니다.', unlockCondition: ' Focus Session 완료 성공 10회 이상' },
  { id: 'title_red_gate', name: '붉은 문 돌파자', description: '차원이 찢어지는 붉은 소용돌이에서 귀환한 생존 요원입니다.', unlockCondition: 'Red Gate 클리어 3회 이상' },
  { id: 'title_shadow_commander', name: '그림자 지휘관', description: '어둠 속 복종을 맹세한 검은 군대를 거느린 군주입니다.', unlockCondition: '보유 그림자 6마리 이상' },
  { id: 'title_boss_slayer', name: '보스 처형자', description: '게이트 최하층에 군림하던 지배자의 목을 베어낸 토벌자입니다.', unlockCondition: '보스 처치 5회 이상' },
  { id: 'title_tactician', name: '각성한 전술가', description: '직업의 한계를 돌파해 마스터리의 극의에 닿은 책사입니다.', unlockCondition: '스킬 마스터리 및 Capstone 해금' }
]

export const GRADE_CUTS: Record<HunterGradeTier, number> = {
  E: 0,
  D: 100,
  C: 300,
  B: 700,
  A: 1400,
  S: 2500,
  NATIONAL: 4000
}

export const GRADE_LABELS: Record<HunterGradeTier, string> = {
  E: 'E급 헌터',
  D: 'D급 헌터',
  C: 'C급 헌터',
  B: 'B급 헌터',
  A: 'A급 헌터',
  S: 'S급 헌터',
  NATIONAL: '국가권력급 헌터'
}

/**
 * 헌터의 현재 게임 데이터를 바탕으로 평가 항목별 세부 점수(Breakdown)를 계산합니다.
 */
export const buildAssociationRatingBreakdown = (state: any): AssociationRatingBreakdown => {
  const focusSession = state.focusSession
  const achievementStats = state.achievementStats
  const combatLogs = state.combatLogs ?? []
  const ownedShadows = state.ownedShadows ?? []
  const skillStates = state.skillStates ? Object.values(state.skillStates) : []
  const hunter = state.hunter

  // 1. realLife: 현실 집중 성과 (Focus Session)
  let realLifeScore = 0
  if (focusSession) {
    // 1-1. 성공 누적 시간 (1시간 = 3600000ms 당 15점, 최대 600점)
    const focusedMs = focusSession.totalFocusedMs ?? 0
    const focusHours = focusedMs / (60 * 60 * 1000)
    realLifeScore += Math.min(600, Math.floor(focusHours * 15))

    // 1-2. 성공 완료 횟수 (completed: true 1회당 12점, 최대 400점)
    const history = focusSession.history ?? []
    const successCount = history.filter((r: any) => r.completed).length
    realLifeScore += Math.min(400, successCount * 12)
  }

  // 2. gateClears: 게이트 실적
  let gateScore = 0
  const gateCleared = achievementStats?.gateClearedCount ?? 0
  // 1회당 20점, 최대 700점
  gateScore += Math.min(700, gateCleared * 20)

  // 텍스트/직접 전투 로그 중 게이트 성공 개수 보정 (1회당 15점, 최대 300점)
  const gateVictoryLogs = combatLogs.filter((log: any) => log.source === 'gate' && log.result === 'victory').length
  gateScore += Math.min(300, gateVictoryLogs * 15)

  // 3. redGate: 레드 게이트 돌파
  let redGateScore = 0
  const redGateCleared = achievementStats?.redGateClearedCount ?? 0
  // 1회당 180점, 최대 700점
  redGateScore += Math.min(700, redGateCleared * 180)

  // 붉은 마력이 녹아든 로그 보정 (1회당 100점, 최대 300점)
  const redGateLogs = combatLogs.filter((log: any) => log.isRedGate || log.battleId?.includes('-red-')).length
  redGateScore += Math.min(300, redGateLogs * 100)

  // 4. bossKills: 보스 토벌
  let bossScore = 0
  // 보스전 클리어 수 (신설 stats 또는 id 기반 boss 카운트)
  const bossKills = achievementStats?.bossKillsCount ?? 0
  bossScore += Math.min(600, bossKills * 80)

  // 무한의 탑 정복 진도 (5층당 80점 보너스, 최대 400점)
  const tower = state.infiniteTower
  if (tower) {
    const maxFloor = tower.highestClearedFloor ?? tower.maxFloor ?? 0
    bossScore += Math.min(400, Math.floor(maxFloor / 5) * 80)
  }

  // 5. legion: 그림자 군단
  let legionScore = 0
  // 보유 그림자 마리수 (마리당 40점, 최대 400점)
  legionScore += Math.min(400, ownedShadows.length * 40)

  // 그림자 Rarity 등급 보너스 (최고 Rarity)
  let maxRarityWeight = 0
  ownedShadows.forEach((shadow: any) => {
    // Legendary 등급 칭호 가중 (150점)
    if (shadow.rarity === 'Legendary') {
      maxRarityWeight = Math.max(maxRarityWeight, 250)
    } else if (shadow.rarity === 'Epic') {
      maxRarityWeight = Math.max(maxRarityWeight, 120)
    } else if (shadow.rarity === 'Rare') {
      maxRarityWeight = Math.max(maxRarityWeight, 60)
    }
  });
  legionScore += maxRarityWeight

  // Named shadow 보유 가중치 (마리당 70점, 최대 350점)
  const namedIds = ['igris', 'tank', 'iron', 'kaisell', 'tusk', 'beru', 'jinu']
  const namedCount = ownedShadows.filter((s: any) => namedIds.includes(s.definitionId)).length
  legionScore += Math.min(350, namedCount * 70)

  // 6. mastery: 숙련/각성
  let masteryScore = 0
  // 헌터 레벨 (1레벨당 12점, 최대 500점)
  if (hunter && hunter.level) {
    masteryScore += Math.min(500, hunter.level * 12)
  }

  // 스킬 마스터리 합계 (1레벨당 8점, 최대 300점)
  let totalMasteryLvl = 0
  skillStates.forEach((sk: any) => {
    totalMasteryLvl += sk.masteryLevel ?? 0
  })
  masteryScore += Math.min(300, totalMasteryLvl * 8)

  // Capstone 해금 보너스 (1개당 100점, 최대 200점)
  const capstoneCount = skillStates.filter((sk: any) => sk.isCapstoneUnlocked).length
  masteryScore += Math.min(200, capstoneCount * 100)

  return {
    realLife: realLifeScore,
    gateClears: gateScore,
    redGate: redGateScore,
    bossKills: bossScore,
    legion: legionScore,
    mastery: masteryScore
  }
}

/**
 * breakdown의 각 축을 합산하여 최종 평가 점수(Association Rating Score)를 계산합니다.
 */
export const calculateAssociationRatingScore = (breakdown: AssociationRatingBreakdown): number => {
  return (
    breakdown.realLife +
    breakdown.gateClears +
    breakdown.redGate +
    breakdown.bossKills +
    breakdown.legion +
    breakdown.mastery
  )
}

/**
 * 점수를 컷에 대치하여 승급 가능한 목표 HunterGrade를 계산합니다.
 */
export const resolveGradeFromRating = (score: number): HunterGradeTier => {
  if (score >= GRADE_CUTS.NATIONAL) return 'NATIONAL'
  if (score >= GRADE_CUTS.S) return 'S'
  if (score >= GRADE_CUTS.A) return 'A'
  if (score >= GRADE_CUTS.B) return 'B'
  if (score >= GRADE_CUTS.C) return 'C'
  if (score >= GRADE_CUTS.D) return 'D'
  return 'E'
}

/**
 * 칭호 해금 검사를 수행하여 언락할 수 있는 모든 칭호 목록을 반환합니다.
 */
export const evaluateTitleUnlocks = (state: any, currentGrade: HunterGradeTier): string[] => {
  const unlocked = new Set<string>(['title_e']) // E등급 기본 해금
  
  // 등급별 자동 언락
  if (currentGrade !== 'E') unlocked.add('title_d')
  if (['C', 'B', 'A', 'S', 'NATIONAL'].includes(currentGrade)) unlocked.add('title_c')
  if (['B', 'A', 'S', 'NATIONAL'].includes(currentGrade)) unlocked.add('title_b')
  if (['A', 'S', 'NATIONAL'].includes(currentGrade)) unlocked.add('title_a')
  if (['S', 'NATIONAL'].includes(currentGrade)) unlocked.add('title_s')
  if (currentGrade === 'NATIONAL') unlocked.add('title_national')

  // 행동 기반 칭호
  const focusSession = state.focusSession
  if (focusSession) {
    const successCount = (focusSession.history ?? []).filter((r: any) => r.completed).length
    if (successCount >= 10 || (focusSession.totalFocusedMs ?? 0) >= 10 * 60 * 60 * 1000) {
      unlocked.add('title_focus')
    }
  }

  const redGateCleared = state.achievementStats?.redGateClearedCount ?? 0
  if (redGateCleared >= 3) {
    unlocked.add('title_red_gate')
  }

  const ownedShadows = state.ownedShadows ?? []
  if (ownedShadows.length >= 6) {
    unlocked.add('title_shadow_commander')
  }

  const bossKills = state.achievementStats?.bossKillsCount ?? 0
  if (bossKills >= 5) {
    unlocked.add('title_boss_slayer')
  }

  const skillStates = state.skillStates ? Object.values(state.skillStates) : []
  const hasCapstone = skillStates.some((sk: any) => sk.isCapstoneUnlocked)
  const hunter = state.hunter
  const isHighJob = (hunter?.jobs?.[hunter?.activeJobId || '']?.level ?? 1) >= 5
  if (hasCapstone || isHighJob) {
    unlocked.add('title_tactician')
  }

  return Array.from(unlocked)
}

/**
 * 기존 플레이어가 있을 때, E등급으로 묶여 시작하지 않도록 레벨과 군단 데이터를 활용해
 * 보수적이고 안전한 초기 하한 등급(B등급 이하)을 산출합니다. (마이그레이션용)
 */
export const createInitialHunterGradeState = (state: any): HunterGradeState => {
  const breakdown = buildAssociationRatingBreakdown(state)
  const score = calculateAssociationRatingScore(breakdown)
  
  // E~B등급 사이에서만 보수적으로 추정
  let inferredGrade: HunterGradeTier = resolveGradeFromRating(score)
  if (inferredGrade === 'S' || inferredGrade === 'NATIONAL') {
    inferredGrade = 'A' // S급과 국가권력급은 직접 승급 시험을 거쳐야 함!
  }

  const unlocked = evaluateTitleUnlocks(state, inferredGrade)

  return {
    currentGrade: inferredGrade,
    ratingScore: score,
    highestRatingScore: score,
    ratingBreakdown: breakdown,
    unlockedTitles: unlocked,
    equippedTitleId: 'title_e',
    cosmeticTier: inferredGrade === 'A' ? 4 : inferredGrade === 'B' ? 3 : inferredGrade === 'C' ? 2 : inferredGrade === 'D' ? 1 : 0,
    history: [
      { grade: 'E', at: Date.now(), reason: '헌터 협회 최초 가입' },
      ...(inferredGrade !== 'E' ? [{ grade: inferredGrade, at: Date.now(), reason: '기존 성과 통합 특별 평가 승급' }] : [])
    ]
  }
}

/**
 * 헌터의 최신 상태를 받아 등급 상태(Zustand store 연계)를 갱신합니다. (등급 하락 절대 금지)
 */
export const recalcHunterGradeState = (
  prev: HunterGradeState | undefined,
  fullState: any,
  reason = '성과 재평가'
): HunterGradeState => {
  if (!prev) {
    return createInitialHunterGradeState(fullState)
  }

  const breakdown = buildAssociationRatingBreakdown(fullState)
  const score = calculateAssociationRatingScore(breakdown)
  const highest = Math.max(prev.highestRatingScore, score)
  
  // 1. 단조 증가 랭크 산출
  let potentialGrade = resolveGradeFromRating(score)
  
  // 현재 랭크 서열 인덱스
  const tiers: HunterGradeTier[] = ['E', 'D', 'C', 'B', 'A', 'S', 'NATIONAL']
  const prevIdx = tiers.indexOf(prev.currentGrade)
  const potentialIdx = tiers.indexOf(potentialGrade)
  
  // 강등 방지 (prevIdx보다 potentialIdx가 낮아지더라도 현재 랭크 유지)
  const finalGrade = potentialIdx < prevIdx ? prev.currentGrade : prev.currentGrade
  const nextTargetIdx = prevIdx + 1
  
  let pendingExam = prev.pendingExam

  // 2. 승급 조건 돌파 시 승급 시험 available 주입
  if (nextTargetIdx < tiers.length) {
    const nextTargetGrade = tiers[nextTargetIdx]
    const nextCut = GRADE_CUTS[nextTargetGrade]
    
    // 점수 컷을 도달했고, 현재 pendingExam이 없거나 status가 available이 아닌 경우
    if (score >= nextCut) {
      if (!pendingExam || pendingExam.targetGrade !== nextTargetGrade) {
        pendingExam = {
          targetGrade: nextTargetGrade,
          status: 'available',
          createdAt: Date.now()
        }
      }
    }
  }

  const unlocked = evaluateTitleUnlocks(fullState, finalGrade)
  
  // 이전 해금 칭호와 병합
  const finalUnlocked = Array.from(new Set([...(prev.unlockedTitles ?? []), ...unlocked]))

  return {
    ...prev,
    ratingScore: score,
    highestRatingScore: highest,
    ratingBreakdown: breakdown,
    pendingExam,
    unlockedTitles: finalUnlocked,
    cosmeticTier: finalGrade === 'NATIONAL' ? 6 : finalGrade === 'S' ? 5 : finalGrade === 'A' ? 4 : finalGrade === 'B' ? 3 : finalGrade === 'C' ? 2 : finalGrade === 'D' ? 1 : 0,
    lastEvaluatedAt: Date.now()
  }
}
