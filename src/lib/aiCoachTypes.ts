import { Category, Difficulty } from './types'

/**
 * AI 성장 코치가 담당하는 도메인 목록
 */
export type AiCoachDomain = 'body' | 'study' | 'career' | 'finance' | 'mind' | 'routine' | 'general'

/**
 * 컨디션/수면 등의 상태 레벨
 */
export type AiCoachConditionLevel = 'low' | 'medium' | 'high' | 'unknown'

/**
 * 사용자가 입력한 비정형 하루 기록 원본 항목
 */
export interface AiCoachRawJournalEntry {
  id: string
  date: string // YYYY-MM-DD
  rawText: string
  createdAt: string // ISO Timestamp
}

/**
 * 운동 기록 파싱 결과
 */
export interface ParsedWorkoutRecord {
  label?: string
  bodyPart?: string
  exercises?: {
    name: string
    weight?: string // 예: "50kg", "bodyweight"
    reps?: string // 예: "10회"
    sets?: string // 예: "3세트"
    note?: string
  }[]
  durationMinutes?: number
  intensity?: 'light' | 'moderate' | 'hard' | 'unknown'
}

/**
 * 공부/학습 기록 파싱 결과
 */
export interface ParsedStudyRecord {
  subject?: string // 과목/주제 (예: "KBI 자격증")
  durationMinutes?: number
  stage?: string // 단계 (예: "Stage 03")
  topics?: string[] // 소주제 리스트 (예: ["topic 01", "topic 02"])
  output?: string // 산출물이나 수행 요약
  note?: string
}

/**
 * 투자/재정 기록 파싱 결과
 */
export interface ParsedFinanceRecord {
  label?: string
  transactionType?: 'income' | 'expense' | 'investment' | 'unknown'
  amount?: number
  category?: string
  description?: string
  marketCheck?: boolean // 시장 점검 여부
  note?: string
}

/**
 * 수면 기록 파싱 결과
 */
export interface ParsedSleepRecord {
  bedtime?: string // 예: "02:00"
  wakeTime?: string // 예: "09:30"
  durationHours?: number
  quality?: AiCoachConditionLevel
  note?: string
}

/**
 * 영양/식단 기록 파싱 결과
 */
export interface ParsedNutritionRecord {
  meals?: {
    time?: string
    type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    description: string
    calories?: number
    note?: string
  }[]
  waterIntakeMl?: number
  note?: string
}

/**
 * 루틴 수행 파싱 결과
 */
export interface ParsedRoutineRecord {
  name: string
  status: 'completed' | 'failed' | 'partial'
  note?: string
}

/**
 * 멘탈/기분 파싱 결과
 */
export interface ParsedMoodRecord {
  score?: number // 1 ~ 100
  moodText?: string // 예: "컨디션 별로였고 쇼츠 좀 많이 봄"
  energyLevel?: AiCoachConditionLevel
  stressLevel?: AiCoachConditionLevel
  note?: string
}

/**
 * AI가 해석한 불확실한 항목에 대한 정보
 */
export interface AiCoachUncertainItem {
  text: string // 불확실하게 파싱된 원문 텍스트 조각
  reason: string // 불확실하다고 판단한 이유
  suggestedClarification?: string // 사용자에게 권장하는 명확한 표현 제안
}

/**
 * AI가 분석한 오늘의 최종 파싱 레코드
 */
export interface AiCoachParsedRecord {
  date: string // YYYY-MM-DD
  workout?: ParsedWorkoutRecord[]
  study?: ParsedStudyRecord[]
  finance?: ParsedFinanceRecord[]
  sleep?: ParsedSleepRecord
  nutrition?: ParsedNutritionRecord
  routine?: ParsedRoutineRecord[]
  mood?: ParsedMoodRecord
  freeNotes?: string[]
  uncertain?: AiCoachUncertainItem[]
}

/**
 * LEVEL UP 전체 게임 세이브 데이터에서 코칭에 필요한 요약 정보
 */
export interface AiCoachSaveSummary {
  hunterLevel: number
  rank: string
  recentDailyCompletionRate?: number // 최근 일일 퀘스트 완료율 (0~1)
  categoryCounts?: Record<Category, number> // 카테고리별 누적 완료 횟수
  currentMainGoals?: string[] // 현재 설정된 메인 목표 리스트
  activeDungeons?: {
    id: string
    title: string
    progress?: string // 예: "12/30 steps"
  }[]
  recentAiQuestSuccessRate?: number // AI가 추천했던 퀘스트들의 최근 성공률 (0~1)
  baseDailies?: {
    id: string
    title: string
    category: Category
    difficulty: Difficulty
    cooldownDays?: number
    recurring?: boolean
    lastCompletedAt?: string
  }[]
  maintenanceStatus?: {
    taskKey: string
    questId?: string
    label: string
    lastCompletedAt?: string
    daysSinceCompleted?: number
    suggestedIntervalDays: number
    urgency: 'low' | 'medium' | 'high' | 'unknown'
  }[]
  todayCompletedFocusMs?: number
  todayCompletedFocusSessionCount?: number
  todayFailedFocusSessionCount?: number
  longestFocusSessionMs?: number
  focusQuestProgress?: string
  todayWorldSignalCount?: number
  recentWorldSignalTier?: string
  focusResonanceSignal?: boolean
  redGateSignalObserved?: boolean
  extractionEchoObserved?: boolean
  promotionSealedRecordObserved?: boolean
}

/**
 * 코치 장기 메모리 요약 (최근 수일간의 트렌드 및 학습 내용)
 */
export interface AiCoachMemorySummary {
  windowDays: number // 메모리가 포괄하는 기간 (예: 7일, 14일)
  repeatedFailures: string[] // 반복적으로 실패 중인 과제나 행동 유형
  stableHabits: string[] // 안정적으로 정착된 좋은 습관
  improvingAreas: string[] // 개선되고 있는 영역
  overloadedAreas: string[] // 과부하(피로 축적 등) 징후가 보이는 영역
  recentWorkoutFocus?: string[] // 최근 집중한 운동 부위/종목
  recentStudyFocus?: string[] // 최근 집중한 학습 과목/주제
  sleepPattern?: string // 수면 패턴에 대한 분석 텍스트
  coachNotes?: string[] // AI 코치진이 작성해 둔 관찰 메모
}

/**
 * 코치가 제안하는 퀘스트/설정 변경 등의 행동 추천
 */
export interface AiCoachRecommendation {
  id: string // 추천 ID (UUID 혹은 유니크 문자열)
  type: 'daily' | 'dungeonSuggestion' | 'mainSuggestion' | 'note'
  title: string
  description: string
  category: Category
  difficulty?: Difficulty
  reason: string // 이 퀘스트/변경을 추천하는 이유 (매우 중요)
  estimatedMinutes?: number
  priority: 'core' | 'support' | 'optional'
  status: 'draft' | 'approved' | 'edited' | 'rejected'
}

export interface AiCoachMainQuestSuggestion {
  title: string
  finalGoal: string
  category: Category
  description?: string
  milestones: {
    title: string
    description?: string
    order: number
    importance?: 'minor' | 'normal' | 'major'
  }[]
  reason: string
}

export interface AiCoachMainMilestoneSuggestion {
  mainQuestId?: string
  mainQuestTitle?: string
  title: string
  description?: string
  importance?: 'minor' | 'normal' | 'major'
  reason: string
}

export interface AiCoachMainProgressDetection {
  mainQuestId?: string
  mainQuestTitle: string
  milestoneTitle: string
  evidence: string
  confidence: 'low' | 'medium' | 'high'
  suggestedAction: 'markComplete' | 'addEvidence' | 'review'
}

/**
 * AI 코치의 최종 분석 및 제안 응답 구조
 */
export interface AiCoachResponse {
  parsedToday: AiCoachParsedRecord
  coachSummary: {
    overallCondition: AiCoachConditionLevel
    mainIssue: string // 오늘 가장 두드러진 피드백 포인트
    tomorrowStrategy: string // 내일을 위한 종합적인 접근 전략
    loadRecommendation: 'light' | 'normal' | 'heavy' // 내일 권장할 업무/운동 강도
  }
  domainCoaches: {
    domain: AiCoachDomain
    diagnosis: string // 각 도메인 코치의 개별 진단
    recommendation: string // 각 도메인 코치의 처방/조언
    risk?: string // 도메인별 리스크 및 경고 요인
  }[]
  recommendedActions: AiCoachRecommendation[] // 내일의 일일 퀘스트 추천
  dungeonSuggestions: AiCoachRecommendation[] // 던전 진행/참여 제안
  mainGoalSuggestions: AiCoachRecommendation[] // 장기 메인 목표 조정을 위한 제안
  warnings: string[] // 긴급 리스크 경고 (예: 수면 3시간 미만 경고)
  uncertain: AiCoachUncertainItem[] // 전체 분석 중 모호하여 확정이 필요했던 정보들
  dailyPlan?: AiCoachDailyPlan // 전체 일일 플랜 설계 데이터

  // Main Quest v2 제안용 추가
  mainQuestSuggestions?: AiCoachMainQuestSuggestion[]
  mainMilestoneSuggestions?: AiCoachMainMilestoneSuggestion[]
  mainProgressDetections?: AiCoachMainProgressDetection[]
}

/**
 * AI가 계획한 퀘스트 항목
 */
export interface AiCoachPlannedQuest {
  id: string
  title: string
  description: string
  category: Category
  difficulty: Difficulty
  priority: 'core' | 'support' | 'recovery' | 'maintenance' | 'optional'
  estimatedMinutes?: number
  energyCost?: 'low' | 'medium' | 'high'
  mentalLoad?: 'low' | 'medium' | 'high'
  physicalLoad?: 'low' | 'medium' | 'high'
  preferredTimeWindow?: 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime'
  reason: string
  source: 'existingDaily' | 'aiGenerated' | 'modifiedExisting' | 'maintenance'
  baseQuestId?: string
  status: 'draft' | 'approved' | 'edited' | 'rejected' | 'added'
}

/**
 * 기본(기존) 퀘스트에 대한 AI의 유지/수정/대체 등 결정 사항
 */
export interface AiCoachBaseQuestDecision {
  baseQuestId?: string
  title: string
  decision: 'keep' | 'modify' | 'skip' | 'replace'
  reason: string
  replacementQuestId?: string
}

/**
 * 생활 유지관리 과제에 대한 판단 결과
 */
export interface AiCoachMaintenanceDecision {
  taskKey: string
  label: string
  lastCompletedAt?: string
  daysSinceCompleted?: number
  urgency: 'low' | 'medium' | 'high' | 'unknown'
  decision: 'include' | 'defer' | 'ignore'
  reason: string
}

/**
 * 가용 시간 및 스케줄에 따른 가설/조건
 */
export interface AiCoachScheduleAssumption {
  label: string
  timeRange?: string
  impact: 'low' | 'medium' | 'high'
  note: string
}

/**
 * AI가 생성한 하루 전체 계획
 */
export interface AiCoachDailyPlan {
  dateTarget: 'today' | 'tomorrow'
  loadRecommendation: 'light' | 'normal' | 'heavy'
  strategyTitle: string
  strategySummary: string
  focusAreas: string[]
  estimatedTotalMinutes?: number
  capacityComment?: string
  quests: AiCoachPlannedQuest[]
  baseQuestDecisions: AiCoachBaseQuestDecision[]
  maintenanceDecisions?: AiCoachMaintenanceDecision[]
  scheduleAssumptions?: AiCoachScheduleAssumption[]
}

/**
 * 캘린더 등 연동에서 확보할 스케줄 요약 정보 (12-31E 구글캘린더 연동 대비)
 */
export interface AiCoachScheduleSummary {
  date: string
  source: 'manualText' | 'googleCalendar' | 'none'
  busyBlocks: {
    title: string
    start?: string
    end?: string
    category?: 'class' | 'tutoring' | 'work' | 'appointment' | 'personal' | 'unknown'
  }[]
  freeBlocks?: {
    start?: string
    end?: string
    quality: 'short' | 'deepWork' | 'light' | 'unknown'
  }[]
  estimatedAvailableMinutes?: number
  dayLoad: 'light' | 'medium' | 'heavy' | 'unknown'
  notes?: string[]
}

/**
 * 구글 캘린더에서 정규화된 이벤트 구조
 */
export interface NormalizedCalendarEvent {
  id: string
  title: string
  start: string // ISO Timestamp
  end: string // ISO Timestamp
  allDay: boolean
  location?: string
}

/**
 * 캘린더 호출 결과 타입
 */
export type CalendarFetchResult =
  | { ok: true; events: NormalizedCalendarEvent[] }
  | { ok: false; error: string }

/**
 * 스케줄 개인정보/마스킹 설정 옵션
 */
export interface SchedulePrivacyOptions {
  maskEventTitles: boolean
  includeLocations: boolean
}

/**
 * AI 성장 코칭 세션의 요약 기록
 */
export interface AiCoachSessionRecord {
  id: string
  date: string
  createdAt: string
  rawJournalPreview?: string
  parsedSummary: {
    workoutDone?: boolean
    studyMinutes?: number
    sleepDurationHours?: number
    sleepQuality?: AiCoachConditionLevel
    moodLevel?: AiCoachConditionLevel
    mainNotes?: string[]
    uncertainCount?: number
  }
  dailyPlanSummary?: {
    strategyTitle?: string
    loadRecommendation?: 'light' | 'normal' | 'heavy'
    estimatedTotalMinutes?: number
    questCount?: number
    coreCount?: number
    supportCount?: number
    recoveryCount?: number
    maintenanceCount?: number
    focusAreas?: string[]
  }
  recommendedQuestIds?: string[]
  addedQuestIds?: string[]
  scheduleSummarySnapshot?: {
    dayLoad?: 'light' | 'medium' | 'heavy' | 'unknown'
    estimatedAvailableMinutes?: number
    busyBlockCount?: number
    deepWorkBlockCount?: number
  }
}

/**
 * AI가 생성하여 사용자 일일에 등록된 퀘스트의 성과 기록
 */
export interface AiCoachQuestOutcome {
  questId: string
  title: string
  category: string
  difficulty: string
  source: 'aiCoach'
  coachReason?: string
  plannedDate?: string
  addedAt?: string
  completedAt?: string
  status: 'added' | 'completed' | 'expired' | 'skipped'
}

/**
 * AI 코치 장기 기억 상태 구조
 */
export interface AiCoachMemoryState {
  sessions: AiCoachSessionRecord[]
  questOutcomes: AiCoachQuestOutcome[]
  rollingSummary: AiCoachMemorySummary
  lastUpdatedAt?: string
}

/**
 * AI Coach Core Context (장기 방향성/우선순위/운영 원칙 등 수동 설정 정보)
 */
export interface AiCoachCoreContext {
  text: string
  updatedAt?: string
  version?: number
}




