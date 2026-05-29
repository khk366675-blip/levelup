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
    // 1-1. 성공 누적 시간 (diminishing return)
    const focusedMs = focusSession.totalFocusedMs ?? 0
    const focusHours = focusedMs / (60 * 60 * 1000)
    let hourPoints = 0
    if (focusHours <= 5) {
      hourPoints = focusHours * 12
    } else if (focusHours <= 15) {
      hourPoints = 60 + (focusHours - 5) * 10
    } else if (focusHours <= 35) {
      hourPoints = 160 + (focusHours - 15) * 8
    } else {
      hourPoints = 320 + (focusHours - 35) * 4
    }
    realLifeScore += Math.min(450, Math.floor(hourPoints))

    // 1-2. 성공 완료 횟수 (diminishing return)
    const history = focusSession.history ?? []
    const successCount = history.filter((r: any) => r.completed).length
    let countPoints = 0
    if (successCount <= 5) {
      countPoints = successCount * 10
    } else if (successCount <= 20) {
      countPoints = 50 + (successCount - 5) * 6
    } else {
      countPoints = 140 + (successCount - 20) * 3
    }
    realLifeScore += Math.min(250, countPoints)
  }

  // 2. gateClears: 게이트 실적 (diminishing return)
  let gateScore = 0
  const gateCleared = achievementStats?.gateClearedCount ?? 0
  let clearPoints = 0
  if (gateCleared <= 10) {
    clearPoints = gateCleared * 12
  } else if (gateCleared <= 30) {
    clearPoints = 120 + (gateCleared - 10) * 8
  } else {
    clearPoints = 280 + (gateCleared - 30) * 5
  }
  gateScore += Math.min(500, clearPoints)

  // 텍스트/직접 전투 로그 중 게이트 성공 개수 보정 (최대 200점)
  const gateVictoryLogs = combatLogs.filter((log: any) => log.source === 'gate' && log.result === 'victory').length
  gateScore += Math.min(200, gateVictoryLogs * 15)

  // 3. redGate: 레드 게이트 돌파 (diminishing return)
  let redGateScore = 0
  const redGateCleared = achievementStats?.redGateClearedCount ?? 0
  let redPoints = 0
  if (redGateCleared <= 3) {
    redPoints = redGateCleared * 150
  } else {
    redPoints = 450 + (redGateCleared - 3) * 50
  }
  redGateScore += Math.min(600, redPoints)

  const redGateLogs = combatLogs.filter((log: any) => log.isRedGate || log.battleId?.includes('-red-')).length
  redGateScore += Math.min(200, redGateLogs * 40)

  // 4. bossKills: 보스 토벌 (diminishing return)
  let bossScore = 0
  const bossKills = achievementStats?.bossKillsCount ?? 0
  let killPoints = 0
  if (bossKills <= 5) {
    killPoints = bossKills * 60
  } else if (bossKills <= 15) {
    killPoints = 300 + (bossKills - 5) * 30
  } else {
    killPoints = 600 + (bossKills - 15) * 10
  }
  bossScore += Math.min(700, killPoints)

  const tower = state.infiniteTower
  if (tower) {
    const maxFloor = tower.highestClearedFloor ?? tower.maxFloor ?? 0
    bossScore += Math.min(300, Math.floor(maxFloor / 5) * 50)
  }

  // 5. legion: 그림자 군단 (diminishing return)
  let legionScore = 0
  const shadowCount = ownedShadows.length
  let countPoints = 0
  if (shadowCount <= 3) {
    countPoints = shadowCount * 25
  } else if (shadowCount <= 8) {
    countPoints = 75 + (shadowCount - 3) * 15
  } else {
    countPoints = 150 + (shadowCount - 8) * 10
  }
  legionScore += Math.min(300, countPoints)

  // 그림자 Rarity 등급 보너스 (최고 Rarity)
  let maxRarityWeight = 0
  ownedShadows.forEach((shadow: any) => {
    if (shadow.rarity === 'Legendary') {
      maxRarityWeight = Math.max(maxRarityWeight, 250)
    } else if (shadow.rarity === 'Epic') {
      maxRarityWeight = Math.max(maxRarityWeight, 150)
    } else if (shadow.rarity === 'Rare') {
      maxRarityWeight = Math.max(maxRarityWeight, 60)
    }
  });
  legionScore += maxRarityWeight

  // Named shadow 보유 가중치 (최대 300점)
  const namedIds = ['igris', 'tank', 'iron', 'kaisell', 'tusk', 'beru', 'jinu']
  const namedCount = ownedShadows.filter((s: any) => namedIds.includes(s.definitionId)).length
  legionScore += Math.min(300, namedCount * 60)

  // 6. mastery: 숙련/각성 (diminishing return)
  let masteryScore = 0
  if (hunter && hunter.level) {
    const lvl = hunter.level
    let lvlPoints = 0
    if (lvl <= 15) {
      lvlPoints = lvl * 10
    } else if (lvl <= 35) {
      lvlPoints = 150 + (lvl - 15) * 12
    } else {
      lvlPoints = 390 + (lvl - 35) * 8
    }
    masteryScore += Math.min(600, lvlPoints)
  }

  // 스킬 마스터리 트레이닝 레벨 (단순 unlock은 1레벨이므로 0점으로 보정하여 제외, 최대 300점)
  let totalMasteryLvl = 0
  skillStates.forEach((sk: any) => {
    const trainingLvl = Math.max(0, (sk.masteryLevel ?? 1) - 1)
    totalMasteryLvl += trainingLvl
  })
  masteryScore += Math.min(300, totalMasteryLvl * 10)

  // Capstone 해금 보너스 (최대 360점)
  const capstoneCount = skillStates.filter((sk: any) => sk.isCapstoneUnlocked).length
  masteryScore += Math.min(360, capstoneCount * 120)

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
 * 헌터 레벨과 수집된 실적에 기반하여 마이그레이션 시 자동 획득할 수 있는 최대 등급을 제한합니다.
 */
export const getMaxAutoGradeByLevel = (level: number): HunterGradeTier => {
  if (level < 10) return 'D'
  if (level < 20) return 'C'
  if (level < 35) return 'B'
  if (level < 50) return 'A'
  return 'A' // S 및 NATIONAL 등급은 마이그레이션 자동 지급 대상에서 완전히 배제
}

/**
 * 헌터의 실적 데이터에 명확하고 강력한 증거가 기록되어 있는지 대조합니다.
 */
export const hasStrongEvidenceForGrade = (targetGrade: HunterGradeTier, state: any): boolean => {
  const level = state.hunter?.level ?? 1
  const stats = state.achievementStats
  const gateCleared = stats?.gateClearedCount ?? 0
  const bossKills = stats?.bossKillsCount ?? 0
  const redGateCleared = stats?.redGateClearedCount ?? 0
  const totalFocusedMs = state.focusSession?.totalFocusedMs ?? 0
  const shadows = state.ownedShadows ?? []
  const skillStates = state.skillStates ? Object.values(state.skillStates) : []

  if (targetGrade === 'E' || targetGrade === 'D') return true
  
  if (targetGrade === 'C') {
    // C급 증거: 레벨 10 이상이며 게이트 10회 이상/보스 2회 이상/집중 5시간 이상/그림자 3마리 이상 중 하나
    const hasEvidence = gateCleared >= 10 || bossKills >= 2 || totalFocusedMs >= 5 * 60 * 60 * 1000 || shadows.length >= 3
    return level >= 10 && hasEvidence
  }
  
  if (targetGrade === 'B') {
    // B급 증거: 레벨 20 이상이며 보스 5회 이상/레드게이트 1회 이상/마스터리 누적 30 레벨업 이상 중 하나
    let totalMastery = 0
    skillStates.forEach((sk: any) => {
      totalMastery += Math.max(0, (sk.masteryLevel ?? 1) - 1)
    })
    const hasEvidence = bossKills >= 5 || redGateCleared >= 1 || totalMastery >= 30
    return level >= 20 && hasEvidence
  }
  
  if (targetGrade === 'A') {
    // A급 증거: 레벨 35 이상이며 레드게이트 3회 이상/레전더리 그림자 보유/보스 10회 이상/극의(Capstone) 해금 중 하나
    const hasLegendaryShadow = shadows.some((s: any) => s.rarity === 'Legendary')
    const hasCapstone = skillStates.some((sk: any) => sk.isCapstoneUnlocked)
    const hasEvidence = redGateCleared >= 3 || hasLegendaryShadow || bossKills >= 10 || hasCapstone
    return level >= 35 && hasEvidence
  }
  
  // S 및 NATIONAL은 마이그레이션 자동 지급 불가
  return false
}

/**
 * 마이그레이션 후보 등급을 레벨 및 증거 조건을 적용해 최종 제한합니다.
 */
export const clampMigratedGradeByEvidence = (candidateGrade: HunterGradeTier, state: any): HunterGradeTier => {
  const level = state.hunter?.level ?? 1
  const maxByLvl = getMaxAutoGradeByLevel(level)
  
  const tiers: HunterGradeTier[] = ['E', 'D', 'C', 'B', 'A', 'S', 'NATIONAL']
  const candidateIdx = tiers.indexOf(candidateGrade)
  const maxIdx = tiers.indexOf(maxByLvl)
  
  let currentTargetIdx = Math.min(candidateIdx, maxIdx)
  
  while (currentTargetIdx > 1) { // D등급까지는 레벨 조건만 충족하면 보정
    const gradeToCheck = tiers[currentTargetIdx]
    if (hasStrongEvidenceForGrade(gradeToCheck, state)) {
      break
    }
    currentTargetIdx--
  }
  
  return tiers[currentTargetIdx]
}

/**
 * 특정 등급의 승급 시험(Promotion Exam)을 시작할 수 있는 자격이 주어지는지 판단합니다.
 */
export const canStartExamForGrade = (targetGrade: HunterGradeTier, state: any): boolean => {
  const level = state.hunter?.level ?? 1
  const stats = state.achievementStats
  const gateCleared = stats?.gateClearedCount ?? 0
  const bossKills = stats?.bossKillsCount ?? 0
  const redGateCleared = stats?.redGateClearedCount ?? 0
  const totalFocusedMs = state.focusSession?.totalFocusedMs ?? 0
  const shadows = state.ownedShadows ?? []
  const skillStates = state.skillStates ? Object.values(state.skillStates) : []

  if (targetGrade === 'D') {
    return true // E -> D는 스코어만 충족하면 상시 허용
  }
  
  if (targetGrade === 'C') {
    // C급 시험 조건: 레벨 10 이상 또는 충분한 C급 증거 보유
    const hasEvidence = gateCleared >= 10 || bossKills >= 2 || totalFocusedMs >= 5 * 60 * 60 * 1000 || shadows.length >= 3
    return level >= 10 || hasEvidence
  }
  
  if (targetGrade === 'B') {
    // B급 시험 조건: 레벨 20 이상 및 보스 1회 이상 처단 기록 또는 게이트 20회 클리어
    return level >= 20 && (bossKills >= 1 || gateCleared >= 20)
  }
  
  if (targetGrade === 'A') {
    // A급 시험 조건: 레벨 35 이상 및 레드게이트 1회 이상 돌파 또는 보스 5회 이상 처단
    return level >= 35 && (redGateCleared >= 1 || bossKills >= 5)
  }
  
  if (targetGrade === 'S') {
    // S급 시험 조건: 레벨 45 이상 및 레드게이트 2회 이상 / 보스 8회 이상 / 마스터리 트레이닝 40 이상 / 그림자 8마리 이상
    let totalMastery = 0
    skillStates.forEach((sk: any) => {
      totalMastery += Math.max(0, (sk.masteryLevel ?? 1) - 1)
    })
    return level >= 45 && (redGateCleared >= 2 || bossKills >= 8 || totalMastery >= 40 || shadows.length >= 8)
  }
  
  if (targetGrade === 'NATIONAL') {
    // 국가권력급 시험 조건: 레벨 55 이상 및 레드게이트 5회 이상 및 보스 15회 이상 처단
    return level >= 55 && redGateCleared >= 5 && bossKills >= 15
  }
  
  return false
}

/**
 * 기존 플레이어가 있을 때, E등급으로 묶여 시작하지 않도록 레벨과 군단 데이터를 활용해
 * 보수적이고 안전한 초기 하한 등급(B등급 이하)을 산출합니다. (마이그레이션용)
 */
export const createInitialHunterGradeState = (state: any): HunterGradeState => {
  const breakdown = buildAssociationRatingBreakdown(state)
  const score = calculateAssociationRatingScore(breakdown)
  
  // E~A등급 사이에서만 보수적으로 추정
  let inferredGrade: HunterGradeTier = resolveGradeFromRating(score)
  if (inferredGrade === 'S' || inferredGrade === 'NATIONAL') {
    inferredGrade = 'A' // S급과 국가권력급은 직접 승급 시험을 거쳐야 함!
  }

  // 레벨 및 실적 증거 기반 최종 제한 가드 적용
  inferredGrade = clampMigratedGradeByEvidence(inferredGrade, state)

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
  
  // 1. 단조 증가 랭크 산출 (강등 방지 원칙)
  const finalGrade = prev.currentGrade
  
  const tiers: HunterGradeTier[] = ['E', 'D', 'C', 'B', 'A', 'S', 'NATIONAL']
  const prevIdx = tiers.indexOf(finalGrade)
  const nextTargetIdx = prevIdx + 1
  
  let pendingExam = prev.pendingExam

  // 진행 중(in_progress)인 승급 심사는 절대로 덮어씌우거나 상태를 갱신하지 않고 유지함
  if (pendingExam && pendingExam.status === 'in_progress') {
    // Keep it as is
  } else {
    // 2. 승급 조건 돌파 시 승급 시험 available 주입
    if (nextTargetIdx < tiers.length) {
      const nextTargetGrade = tiers[nextTargetIdx]
      const nextCut = GRADE_CUTS[nextTargetGrade]
      
      // 점수 컷을 도달했고, 시험 시작 특별 진입 자격을 충족한 경우
      if (score >= nextCut && canStartExamForGrade(nextTargetGrade, fullState)) {
        if (!pendingExam || pendingExam.targetGrade !== nextTargetGrade) {
          pendingExam = {
            targetGrade: nextTargetGrade,
            status: 'available',
            createdAt: Date.now()
          }
        }
      } else {
        // 더 이상 조건이 맞지 않으면 available 대기 상태 시험을 제거
        if (pendingExam && pendingExam.status === 'available') {
          pendingExam = undefined
        }
      }
    } else {
      pendingExam = undefined
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


