import {
  AiCoachSaveSummary,
  AiCoachMemorySummary,
  AiCoachMemoryState,
  AiCoachSessionRecord,
  AiCoachQuestOutcome,
} from './aiCoachTypes'
import { Quest } from './types'
import type { GameState } from './store'
import { getWorldSignalSummaryForAiCoach } from './worldSignals'

/**
 * Zustand 게임 상태(GameState)로부터 AI 성장 코칭에 필요한 최소 정보만 요약하여 추출합니다.
 * 이 과정에서 secretProgress 및 숨겨진(hidden) 정보는 엄격히 필터링하고 제외합니다.
 */
export function generateAiCoachSaveSummary(state: GameState): AiCoachSaveSummary {
  const { hunter, quests, achievementStats } = state

  // 1. 최근 일일 퀘스트 완료율 계산 (최근 7일 기준)
  let recentDailyCompletionRate = 0
  const dailyHistory = achievementStats?.dailyHistory || {}
  const historyKeys = Object.keys(dailyHistory).sort().reverse() // 최신 날짜순
  const targetDays = historyKeys.slice(0, 7)

  if (targetDays.length > 0) {
    let totalAvailable = 0
    let totalCompleted = 0
    targetDays.forEach(key => {
      const day = dailyHistory[key]
      if (day) {
        totalAvailable += day.totalDailyAvailableCount || 0
        totalCompleted += day.completedDailyCount || 0
      }
    })
    recentDailyCompletionRate = totalAvailable > 0 ? totalCompleted / totalAvailable : 0
  } else {
    // 히스토리가 없는 경우 기본 누적 완료율 우회 계산
    const dailyStats = achievementStats?.questCompletions?.byType?.daily || 0
    recentDailyCompletionRate = dailyStats > 0 ? 0.75 : 0.0 // 가상의 초기값 혹은 0
  }

  // 2. 카테고리별 완료 횟수 (types.ts의 Category 기반)
  const categoryCounts = achievementStats?.questCompletions?.byCategory || {}

  // 3. 현재 메인 목표 목록
  const currentMainGoals = quests
    .filter((q: Quest) => q.type === 'main' && !q.completed)
    .map((q: Quest) => q.title)

  // 4. 활성화된 던전 진행률
  const activeDungeons = quests
    .filter((q: Quest) => q.type === 'dungeon' && !q.completed)
    .map((q: Quest) => ({
      id: q.id,
      title: q.title,
      progress: `${q.currentSteps ?? 0}/${q.totalSteps ?? 30} steps`,
    }))

  // 5. 최근 AI 추천 퀘스트 성공률 (임시 계산 또는 placeholder)
  let aiQuestTotal = 0
  let aiQuestSuccess = 0
  if (achievementStats?.questCompletions?.byQuestId) {
    Object.entries(achievementStats.questCompletions.byQuestId).forEach(([qid, count]) => {
      const countVal = count as number
      if (qid.startsWith('rec-') && countVal > 0) {
        aiQuestTotal += 1
        aiQuestSuccess += 1 // 완료 횟수가 존재하면 완료된 것으로 간주
      }
    })
  }
  const recentAiQuestSuccessRate = aiQuestTotal > 0 ? aiQuestSuccess / aiQuestTotal : undefined

  // 6. 루틴 라이브러리 요약 (baseDailies)
  const baseDailies = quests
    .filter((q: Quest) => q.type === 'daily' && q.recurring !== false)
    .map((q: Quest) => ({
      id: q.id,
      title: q.title,
      category: q.category,
      difficulty: q.difficulty,
      cooldownDays: q.cooldownDays,
      recurring: q.recurring,
      lastCompletedAt: q.lastCompletedAt
    }))

  // 7. 생활 유지관리 상태 계산
  const maintenanceTargets = [
    { taskKey: 'laundry', questId: 'daily-laundry', titleKeyword: '빨래', label: '빨래', suggestedIntervalDays: 4 },
    { taskKey: 'recycle', questId: 'daily-recycle', titleKeyword: '분리수거', label: '분리수거/쓰레기', suggestedIntervalDays: 3 },
    { taskKey: 'cleaning', questId: 'daily-cleaning', titleKeyword: '청소', label: '방 청소/설거지', suggestedIntervalDays: 2 },
    { taskKey: 'weigh', questId: 'daily-weigh', titleKeyword: '체중', label: '공복 체중 기록', suggestedIntervalDays: 2 },
    { taskKey: 'expense', questId: 'dungeon-expense-record', titleKeyword: '생활비', label: '생활비 기록', suggestedIntervalDays: 1 },
    { taskKey: 'water', questId: 'daily-water', titleKeyword: '물 2L', label: '물 2L', suggestedIntervalDays: 1 },
    { taskKey: 'protein', questId: 'daily-protein', titleKeyword: '단백질', label: '단백질', suggestedIntervalDays: 1 },
    { taskKey: 'sleep', questId: 'daily-sleep', titleKeyword: '수면', label: '수면', suggestedIntervalDays: 1 },
    { taskKey: 'no-phone-morning', questId: 'daily-no-phone-morning', titleKeyword: '폰 안 보기', label: '기상 후 폰 안 보기', suggestedIntervalDays: 1 },
    { taskKey: 'shortform-limit', questId: 'daily-shortform-limit', titleKeyword: '숏폼', label: '숏폼 제한', suggestedIntervalDays: 1 }
  ]

  const maintenanceStatus = maintenanceTargets.map(target => {
    // 1) id로 찾거나, 없으면 title 키워드로 찾음
    let matchedQuest = quests.find((q: Quest) => q.id === target.questId)
    if (!matchedQuest) {
      matchedQuest = quests.find((q: Quest) => q.title.includes(target.titleKeyword))
    }

    let lastCompletedAt = matchedQuest?.lastCompletedAt
    let daysSinceCompleted: number | undefined = undefined
    let urgency: 'low' | 'medium' | 'high' | 'unknown' = 'unknown'

    if (lastCompletedAt) {
      try {
        const lastDate = new Date(lastCompletedAt)
        const today = new Date()
        // 날짜 간격 계산 (시간 오차 무시)
        lastDate.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)
        const diffTime = today.getTime() - lastDate.getTime()
        daysSinceCompleted = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))

        if (daysSinceCompleted >= target.suggestedIntervalDays) {
          urgency = 'high'
        } else if (daysSinceCompleted >= target.suggestedIntervalDays - 1) {
          urgency = 'medium'
        } else {
          urgency = 'low'
        }
      } catch (e) {
        urgency = 'unknown'
      }
    }

    return {
      taskKey: target.taskKey,
      questId: matchedQuest?.id || target.questId,
      label: target.label,
      lastCompletedAt,
      daysSinceCompleted,
      suggestedIntervalDays: target.suggestedIntervalDays,
      urgency
    }
  })

  // 8. Focus Session 요약 계산
  const todayISOStr = new Date().toISOString().slice(0, 10)
  
  const todayCompletedFocusMs = (state.focusSession?.history ?? [])
    .filter((r: any) => r.completed && new Date(r.endedAt).toISOString().slice(0, 10) === todayISOStr)
    .reduce((sum: number, r: any) => sum + r.focusedMs, 0)

  const todayCompletedFocusSessionCount = (state.focusSession?.history ?? [])
    .filter((r: any) => r.completed && new Date(r.endedAt).toISOString().slice(0, 10) === todayISOStr)
    .length

  const todayFailedFocusSessionCount = (state.focusSession?.history ?? [])
    .filter((r: any) => !r.completed && new Date(r.endedAt).toISOString().slice(0, 10) === todayISOStr)
    .length

  const longestFocusSessionMs = (state.focusSession?.history ?? [])
    .filter((r: any) => r.completed && new Date(r.endedAt).toISOString().slice(0, 10) === todayISOStr)
    .reduce((max: number, r: any) => Math.max(max, r.focusedMs), 0)

  const focusQuestProgress = `성공 ${todayCompletedFocusSessionCount}회 (${Math.round(todayCompletedFocusMs / (60 * 1000))}분 집중)`

  const wsSummary = getWorldSignalSummaryForAiCoach(state.secretProgress)

  return {
    hunterLevel: hunter.level,
    rank: hunter.rank,
    recentDailyCompletionRate,
    categoryCounts,
    currentMainGoals,
    activeDungeons,
    recentAiQuestSuccessRate,
    baseDailies,
    maintenanceStatus,
    todayCompletedFocusMs,
    todayCompletedFocusSessionCount,
    todayFailedFocusSessionCount,
    longestFocusSessionMs,
    focusQuestProgress,
    ...wsSummary
  }
}

/**
 * 최근 활동 통계를 분석하여 장기 성장 추세 및 코칭 메모리를 요약 생성합니다.
 */
export function generateAiCoachMemorySummary(state: GameState): AiCoachMemorySummary {
  // 12-31F: 상태에 aiCoachMemory가 존재하고, 최소 3개 이상 분석 데이터가 누적되었다면 rollingSummary를 우선 활용
  if (state.aiCoachMemory?.rollingSummary) {
    const memory = state.aiCoachMemory
    if (memory.sessions.length >= 3) {
      return memory.rollingSummary
    }
  }

  // 데이터가 부족하거나 없을 때는 룰 기반의 기본 요약을 fallback으로 사용
  const fallbackSummary = generateFallbackMemorySummary(state)
  return {
    ...fallbackSummary,
    coachNotes: [
      '학습 데이터 부족 (며칠 더 사용하면 코치가 패턴을 학습합니다)',
      ...(fallbackSummary.coachNotes || [])
    ]
  }
}

/**
 * 게임의 기본 통계치에 의존한 Fallback용 룰 기반 메모리 요약 생성
 */
function generateFallbackMemorySummary(state: GameState): AiCoachMemorySummary {
  const { achievementStats, quests } = state
  const special = achievementStats?.special || {}

  // 1. 반복 실패 중인 일일 퀘스트 추출
  const repeatedFailures: string[] = []
  const currentStreakMap = achievementStats?.dailyCompletions?.currentStreakByQuestId || {}
  
  quests.forEach((q: Quest) => {
    if (q.type === 'daily' && q.recurring) {
      const streak = currentStreakMap[q.id] ?? 0
      const completedCount = achievementStats?.questCompletions?.byQuestId?.[q.id] ?? 0
      if (completedCount > 0 && streak === 0) {
        repeatedFailures.push(q.title)
      }
    }
  })

  // 2. 안정적으로 정착된 습관
  const stableHabits: string[] = []
  quests.forEach((q: Quest) => {
    if (q.type === 'daily') {
      const streak = currentStreakMap[q.id] ?? 0
      if (streak >= 7) {
        stableHabits.push(q.title)
      }
    }
  })

  // 3. 개선 중인 영역 / 피로 영역
  const improvingAreas: string[] = []
  const overloadedAreas: string[] = []

  if ((special.earlyWakeBefore7Count ?? 0) >= 5) {
    improvingAreas.push('수면/기상 루틴')
  }
  if ((special.noShortsWithin30MinCount ?? 0) >= 5) {
    improvingAreas.push('도파민 절제(숏폼 제한)')
  }
  if ((special.meditationCount ?? 0) >= 5) {
    improvingAreas.push('정신 건강(명상)')
  }
  if ((special.marketCheckCount ?? 0) >= 10) {
    improvingAreas.push('금융 시장 분석')
  }

  if ((special.daily15PlusClearDays ?? 0) >= 2) {
    overloadedAreas.push('일일 일정 과부하 (피로 누적 주의)')
  }

  // 4. 최근 집중 영역 분석 (workout / study)
  const recentWorkoutFocus: string[] = []
  const recentStudyFocus: string[] = []

  quests.forEach((q: Quest) => {
    const completedCount = achievementStats?.questCompletions?.byQuestId?.[q.id] ?? 0
    if (completedCount > 0) {
      if (q.category === 'workout' && !recentWorkoutFocus.includes(q.title)) {
        recentWorkoutFocus.push(q.title)
      }
      if (q.category === 'study' && !recentStudyFocus.includes(q.title)) {
        recentStudyFocus.push(q.title)
      }
    }
  })

  // 5. 수면 패턴 텍스트 생성
  let sleepPattern = '패턴 분석 중'
  const wakeCount = special.earlyWakeBefore7Count ?? 0
  const wakeStreak = special.earlyWakeBefore7CurrentStreak ?? 0
  if (wakeStreak >= 7) {
    sleepPattern = `매우 양호 (7시 전 기상 ${wakeStreak}일 연속 유지 중)`
  } else if (wakeCount > 0) {
    sleepPattern = `개선 중 (누적 7시 전 기상 ${wakeCount}회 달성)`
  } else {
    sleepPattern = '취침 및 기상 시간 불규칙 우려'
  }

  // 6. 코치 메모 및 관찰 리스트 생성
  const coachNotes: string[] = []
  if ((special.lateNightCompletionCount ?? 0) >= 3) {
    coachNotes.push('자정 이후 심야 시간대 퀘스트 완료 건이 존재합니다. 충분한 수면 확보 권장.')
  }
  if ((special.resurrectionCount ?? 0) > 0) {
    coachNotes.push(`스트릭 부활 보호를 ${special.resurrectionCount}회 사용했습니다. 습관 유지 페이스 조절 필요.`)
  }
  if (stableHabits.length > 0) {
    coachNotes.push(`현재 ${stableHabits.length}개의 일일 루틴이 양호한 연속 성과를 보이고 있습니다.`)
  }

  return {
    windowDays: 7,
    repeatedFailures: repeatedFailures.slice(0, 3),
    stableHabits: stableHabits.slice(0, 3),
    improvingAreas,
    overloadedAreas,
    recentWorkoutFocus: recentWorkoutFocus.slice(0, 3),
    recentStudyFocus: recentStudyFocus.slice(0, 3),
    sleepPattern,
    coachNotes,
  }
}

/**
 * 최근 세션과 퀘스트 성과를 분석하여 롤링 메모리 요약(rollingSummary)을 빌드합니다.
 * (12-31F)
 */
export function computeRollingSummary(state: GameState): AiCoachMemorySummary {
  const memory = state.aiCoachMemory
  if (!memory || memory.sessions.length < 3) {
    return {
      windowDays: 7,
      repeatedFailures: [],
      stableHabits: [],
      improvingAreas: [],
      overloadedAreas: [],
      recentWorkoutFocus: [],
      recentStudyFocus: [],
      sleepPattern: '패턴 분석 중',
      coachNotes: ['학습 데이터 부족 (며칠 더 사용하면 코치가 패턴을 학습합니다)']
    }
  }

  const { sessions, questOutcomes } = memory

  // 1. 최근 7일 및 30일 완료율 계산
  const now = new Date()
  const oneDayMs = 24 * 60 * 60 * 1000

  const getRateForDays = (days: number) => {
    const limitDate = new Date(now.getTime() - days * oneDayMs)
    const activeOutcomes = questOutcomes.filter((out: AiCoachQuestOutcome) => {
      if (!out.addedAt) return false
      return new Date(out.addedAt) >= limitDate
    })

    if (activeOutcomes.length === 0) return null
    const completed = activeOutcomes.filter((out: AiCoachQuestOutcome) => out.status === 'completed').length
    return Math.round((completed / activeOutcomes.length) * 100)
  }

  const rate7d = getRateForDays(7)
  const rate30d = getRateForDays(30)

  // 2. 반복 실패 및 안정 습관 분석 (동일 타이틀 기준)
  const questStats: Record<string, { total: number; completed: number; category: string }> = {}
  questOutcomes.forEach((out: AiCoachQuestOutcome) => {
    if (!questStats[out.title]) {
      questStats[out.title] = { total: 0, completed: 0, category: out.category }
    }
    questStats[out.title].total += 1
    if (out.status === 'completed') {
      questStats[out.title].completed += 1
    }
  })

  const repeatedFailures: string[] = []
  const stableHabits: string[] = []

  Object.entries(questStats).forEach(([title, stat]) => {
    if (stat.total >= 2) {
      const completionRate = stat.completed / stat.total
      if (completionRate <= 0.3) {
        repeatedFailures.push(title)
      } else if (completionRate >= 0.8) {
        stableHabits.push(title)
      }
    }
  })

  // 3. 과부하 패턴 식별 (일 계획 소요 시간은 크나 실제 완료율이 매우 낮았던 세션 검출)
  const overloadedAreas: string[] = []
  let overloadCount = 0
  sessions.forEach((session: AiCoachSessionRecord) => {
    const estTime = session.dailyPlanSummary?.estimatedTotalMinutes ?? 0
    const questCount = session.dailyPlanSummary?.questCount ?? 0
    
    // 해당 날짜(YYYY-MM-DD)에 계획된 AI 퀘스트들의 아웃컴 완료 현황 확인
    const dayOutcomes = questOutcomes.filter((out: AiCoachQuestOutcome) => out.plannedDate === session.date)
    if (dayOutcomes.length >= 4) {
      const compCount = dayOutcomes.filter((out: AiCoachQuestOutcome) => out.status === 'completed').length
      const dayRate = compCount / dayOutcomes.length
      if ((estTime >= 180 || questCount >= 7) && dayRate <= 0.4) {
        overloadCount += 1
      }
    }
  })
  if (overloadCount >= 2) {
    overloadedAreas.push('계획 총 소요시간 대비 완료율 저조 (일정 과부하 징후)')
  }

  // 4. 수면 부족과 실패 연관성 분석
  let sleepDeprivedFailureTrend = false
  const sleepLowSessions = sessions.filter((s: AiCoachSessionRecord) => {
    const hours = s.parsedSummary.sleepDurationHours ?? 8
    const quality = s.parsedSummary.sleepQuality ?? 'medium'
    return hours < 6 || quality === 'low'
  })
  
  if (sleepLowSessions.length >= 2) {
    let failedQuestsOnLowSleep = 0
    let totalQuestsOnLowSleep = 0
    sleepLowSessions.forEach((se: AiCoachSessionRecord) => {
      // 수면 부족 세션을 기록한 '내일'의 퀘스트 완료 아웃컴 대조
      const nextDayOutcomes = questOutcomes.filter((out: AiCoachQuestOutcome) => out.plannedDate === se.date)
      totalQuestsOnLowSleep += nextDayOutcomes.length
      failedQuestsOnLowSleep += nextDayOutcomes.filter((out: AiCoachQuestOutcome) => out.status === 'expired' || out.status === 'added').length
    })
    if (totalQuestsOnLowSleep > 0 && (failedQuestsOnLowSleep / totalQuestsOnLowSleep) >= 0.5) {
      sleepDeprivedFailureTrend = true
    }
  }

  // 5. 최근 focusAreas 추세 분석
  const recentWorkoutFocus: string[] = []
  const recentStudyFocus: string[] = []
  
  const recentSessions = sessions.slice(-5)
  recentSessions.forEach((se: AiCoachSessionRecord) => {
    se.dailyPlanSummary?.focusAreas?.forEach((area: string) => {
      if (area.includes('운동') || area.includes('근력') || area.includes('헬스')) {
        if (!recentWorkoutFocus.includes(area)) recentWorkoutFocus.push(area)
      } else if (area.includes('공부') || area.includes('학습') || area.includes('자격증') || area.includes('개발')) {
        if (!recentStudyFocus.includes(area)) recentStudyFocus.push(area)
      }
    })
  })

  // 6. 유지관리(maintenance) 및 일반 코치 노트 컴파일
  const coachNotes: string[] = []
  if (rate7d !== null) {
    coachNotes.push(`최근 7일 AI 추천 퀘스트 완료율은 ${rate7d}% 입니다.`)
  }
  if (rate30d !== null) {
    coachNotes.push(`최근 30일 AI 추천 퀘스트 완료율은 ${rate30d}% 입니다.`)
  }
  if (sleepDeprivedFailureTrend) {
    coachNotes.push('⚠️ 수면 부족이나 낮은 수면 품질이 감지된 날에 계획 완료율이 하락하는 경향이 관찰됩니다.')
  }
  
  // 유지관리 퀘스트 지연 여부 분석
  const maintenanceOutcomes = questOutcomes.filter((out: AiCoachQuestOutcome) => out.category === 'health' || out.category === 'habit')
  const failedMaintenance = maintenanceOutcomes.filter((out: AiCoachQuestOutcome) => out.status === 'expired').length
  if (maintenanceOutcomes.length >= 5 && (failedMaintenance / maintenanceOutcomes.length) >= 0.5) {
    coachNotes.push('🧹 청소, 분리수거 등 정기 유지관리 퀘스트의 지연 횟수가 많습니다. 가벼운 습관 위주 배치가 필요합니다.')
  }

  const improvingAreas: string[] = []
  if (stableHabits.length > 0) {
    improvingAreas.push('안정된 핵심 습관 유지')
  }
  if (rate7d !== null && rate7d >= 75) {
    improvingAreas.push('안정적인 계획 수행률')
  }

  return {
    windowDays: 30,
    repeatedFailures: repeatedFailures.slice(0, 3),
    stableHabits: stableHabits.slice(0, 3),
    improvingAreas,
    overloadedAreas,
    recentWorkoutFocus: recentWorkoutFocus.slice(0, 3),
    recentStudyFocus: recentStudyFocus.slice(0, 3),
    sleepPattern: sleepLowSessions.length > 0 ? '불규칙 또는 부족 패턴 일부 관찰됨' : '비교적 규칙적인 패턴 유지 중',
    coachNotes
  }
}
