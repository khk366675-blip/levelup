import { useState, useEffect } from 'react'
import {
  Brain,
  Sparkles,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
  Flame,
  Dumbbell,
  BookOpen,
  Moon,
  Smile,
  CheckCircle2,
  Trash2,
  Edit3,
  RefreshCw,
  Plus,
  Calendar,
  Lock,
  Unlock,
  Clock,
  Compass
} from 'lucide-react'
import { useGame } from '../lib/store'
import { buildAiCoachPrompt } from '../lib/aiCoachPrompt'
import { generateAiCoachSaveSummary, generateAiCoachMemorySummary } from '../lib/aiCoachSummary'
import { callAiCoachApi, AiCoachApiResult, extractJsonObjectFromText, validateAiCoachResponse } from '../lib/aiCoachClient'
import { CATEGORY_META, DIFFICULTY_META, type Category, type Difficulty } from '../lib/types'
import { AiCoachRecommendation, NormalizedCalendarEvent } from '../lib/aiCoachTypes'
import { requestCalendarAccess, fetchCalendarEvents } from '../lib/googleCalendarClient'
import { generateScheduleSummary } from '../lib/scheduleSummary'
import { getDateKey, addDays } from '../lib/game'


const VALID_CATEGORIES: Category[] = ['workout', 'health', 'study', 'career', 'mind', 'finance', 'social', 'challenge', 'habit']
const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'elite', 'apex', 'boss']

// AI 응답 데이터 정규화 및 카테고리 매핑 fallback
function sanitizeCategory(cat: string): Category {
  if (!cat) return 'habit'
  const c = cat.toLowerCase()
  if (['workout', 'body', 'exercise', 'training'].includes(c)) return 'workout'
  if (['study', 'learning', 'education', 'book'].includes(c)) return 'study'
  if (['career', 'job', 'work', 'office', 'programming'].includes(c)) return 'career'
  if (['health', 'nutrition', 'diet', 'food', 'salad'].includes(c)) return 'health'
  if (['mind', 'mental', 'meditation', 'psychology'].includes(c)) return 'mind'
  if (['finance', 'money', 'investment', 'budget'].includes(c)) return 'finance'
  if (['social', 'relationship', 'friendship', 'meeting'].includes(c)) return 'social'
  if (['challenge', 'adventure'].includes(c)) return 'challenge'
  if (['habit', 'routine', 'cleaning'].includes(c)) return 'habit'
  
  // 정규 카테고리에 속해 있는지 재검증
  const isRegular = VALID_CATEGORIES.includes(c as Category)
  if (isRegular) return c as Category
  
  return 'habit' // 최종 fallback
}

// AI 응답 데이터 정규화 및 난이도 매핑 fallback
function sanitizeDifficulty(diff: string): Difficulty {
  if (!diff) return 'normal'
  const d = diff.toLowerCase() as Difficulty
  if (VALID_DIFFICULTIES.includes(d)) return d
  return 'normal' // 최종 fallback
}

export function AiCoachPanel() {
  const [journalText, setJournalText] = useState('')
  const [scheduleNotes, setScheduleNotes] = useState('') // 내일 일정 메모 추가
  const [loading, setLoading] = useState(false)
  const [apiResult, setApiResult] = useState<AiCoachApiResult | null>(null)
  const [showRawJson, setShowRawJson] = useState(false)
  const [copied, setCopied] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  const [showJsonPaste, setShowJsonPaste] = useState(false)
  const [fallbackJsonText, setFallbackJsonText] = useState('')

  const [showDetailedData, setShowDetailedData] = useState(false)
  const [detailedQuests, setDetailedQuests] = useState<Record<string, boolean>>({})
  const toggleQuestDetail = (id: string) => {
    setDetailedQuests(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Google Calendar Integration States (12-31E)
  const [calendarStatus, setCalendarStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [calendarEvents, setCalendarEvents] = useState<NormalizedCalendarEvent[]>([])
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [maskTitles, setMaskTitles] = useState<boolean>(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // 0. 구글 캘린더 불러오기 핸들러 (12-31E)
  const handleLoadCalendar = async () => {
    setCalendarStatus('loading')
    setCalendarError(null)
    try {
      // 1) Access Token 요청 (Consent UI 팝업)
      const token = await requestCalendarAccess()
      setAccessToken(token)

      // 2) 내일 00:00:00 ~ 모레 00:00:00 구하기 (local 시간 기준)
      const now = new Date()
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
      const dayAfterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0, 0)

      // Local timezone offset을 반영한 ISO String 생성 헬퍼
      const getLocalISOString = (date: Date) => {
        const tzo = -date.getTimezoneOffset()
        const dif = tzo >= 0 ? '+' : '-'
        const pad = (num: number) => String(num).padStart(2, '0')
        return date.getFullYear() +
          '-' + pad(date.getMonth() + 1) +
          '-' + pad(date.getDate()) +
          'T' + pad(date.getHours()) +
          ':' + pad(date.getMinutes()) +
          ':' + pad(date.getSeconds()) +
          dif + pad(Math.floor(Math.abs(tzo) / 60)) +
          ':' + pad(Math.abs(tzo) % 60)
      }

      const timeMin = getLocalISOString(tomorrow)
      const timeMax = getLocalISOString(dayAfterTomorrow)

      // 3) 이벤트 페치
      const fetchResult = await fetchCalendarEvents(token, timeMin, timeMax)
      if (fetchResult.ok) {
        setCalendarEvents(fetchResult.events)
        setCalendarStatus('success')
      } else {
        setCalendarError(fetchResult.error)
        setCalendarStatus('error')
      }
    } catch (err: any) {
      setCalendarError(err.message || '인증 혹은 캘린더 정보 조회에 실패했습니다.')
      setCalendarStatus('error')
    }
  }

  // 구글 캘린더 정보 혹은 수동 메모를 병합한 scheduleSummary 빌드 헬퍼 (12-31E)
  const getActiveScheduleSummary = () => {
    const targetDateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0] // 내일 날짜 (YYYY-MM-DD)
    
    if (calendarStatus === 'success') {
      return generateScheduleSummary(
        targetDateStr,
        calendarEvents,
        scheduleNotes,
        {
          maskEventTitles: maskTitles,
          includeLocations: false
        }
      )
    }

    // fallback: 수동 메모만 있거나 아예 없을 때
    if (scheduleNotes.trim()) {
      return {
        date: targetDateStr,
        source: 'manualText' as const,
        busyBlocks: [],
        freeBlocks: [],
        estimatedAvailableMinutes: undefined,
        dayLoad: 'unknown' as const,
        notes: [scheduleNotes.trim()]
      }
    }

    return {
      date: targetDateStr,
      source: 'none' as const,
      busyBlocks: [],
      freeBlocks: [],
      estimatedAvailableMinutes: undefined,
      dayLoad: 'unknown' as const,
      notes: ['내일 등록된 일정이 없습니다.']
    }
  }


  // 도메인 코치 피드백을 보여주기 위한 현재 선택 도메인 탭
  const [selectedDomain, setSelectedDomain] = useState<string>('body')

  // 로컬 추천 상태 복제본 및 ID별 가공 상태 (fallback용)
  const [recommendations, setRecommendations] = useState<AiCoachRecommendation[]>([])
  
  // 전체 일일 플랜 전용 상태
  const [dailyPlanData, setDailyPlanData] = useState<any | null>(null)
  const [dailyPlanQuests, setDailyPlanQuests] = useState<any[]>([])

  const [actionStates, setActionStates] = useState<Record<string, 'draft' | 'approved' | 'edited' | 'rejected' | 'added'>>({})
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({})
  const [editForms, setEditForms] = useState<Record<string, { title: string; description: string; category: Category; difficulty: Difficulty }>>({})

  // 스토어 daily 퀘스트 추가 액션
  const addAiCoachDailyQuest = useGame(s => s.addAiCoachDailyQuest)
  const replaceAiCoachDailyPlan = useGame(s => s.replaceAiCoachDailyPlan)
  const aiCoachMemory = useGame(s => s.aiCoachMemory)
  const recordAiCoachSession = useGame(s => s.recordAiCoachSession)
  const aiCoachCoreContext = useGame(s => s.aiCoachCoreContext)
  const updateAiCoachCoreContext = useGame(s => s.updateAiCoachCoreContext)
  const addMainQuest = useGame(s => s.addMainQuest)
  const quests = useGame(s => s.quests)

  const [showLongTermSuggestions, setShowLongTermSuggestions] = useState(false)
  const [appliedMainQuests, setAppliedMainQuests] = useState<Record<string, boolean>>({})

  // 새 Main Quest 후보 원클릭 추가
  const handleAddMainQuestSuggestion = (suggestion: any, index: number) => {
    const key = `main-${index}-${suggestion.title}`
    if (appliedMainQuests[key]) return

    const currentQuests = useGame.getState().quests
    const isDuplicate = currentQuests.some(cq => 
      cq.type === 'main' && 
      cq.title.trim() === suggestion.title.trim() && 
      cq.finalGoal?.trim() === suggestion.finalGoal?.trim()
    )

    if (isDuplicate) {
      alert('이미 유사한 메인 퀘스트가 등록되어 있습니다.')
      return
    }

    // 카테고리 정규화
    const sanitizedCat = sanitizeCategory(suggestion.category)

    addMainQuest({
      title: suggestion.title,
      description: suggestion.description || suggestion.reason || '',
      category: sanitizedCat,
      finalGoal: suggestion.finalGoal,
      milestones: [],
      source: 'aiCoach',
      coachReason: suggestion.reason
    })

    setAppliedMainQuests(prev => ({ ...prev, [key]: true }))
  }



  const [showCoreContext, setShowCoreContext] = useState(false)
  const [coreText, setCoreText] = useState(aiCoachCoreContext?.text || '')
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')

  // 스토어 로딩 후 coreText 동기화
  useEffect(() => {
    if (aiCoachCoreContext?.text !== undefined) {
      setCoreText(aiCoachCoreContext.text)
    }
  }, [aiCoachCoreContext?.text])

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedState(true)
      setTimeout(() => setCopiedState(false), 2000)
    }).catch(() => {
      alert('클립보드 복사에 실패했습니다. 직접 복사해 주세요.')
    })
  }

  // 1. Gemini API 호출 분석 실행 및 응답 클렌징 후 자동 적용
  const handleAnalyze = async () => {
    if (!journalText.trim()) return
    setLoading(true)
    setApiResult(null)
    setRecommendations([])
    setDailyPlanData(null)
    setDailyPlanQuests([])
    setActionStates({})
    setEditingIds({})
    setEditForms({})

    const state = useGame.getState()
    const saveSummary = generateAiCoachSaveSummary(state)
    const memorySummary = generateAiCoachMemorySummary(state)

    // schedule notes 파싱 (12-31E 구글 캘린더 연동 및 병합 지원)
    const scheduleSummary = getActiveScheduleSummary()

    const prompt = buildAiCoachPrompt({
      rawJournal: journalText,
      saveSummary,
      memorySummary,
      scheduleSummary,
      coreContext: aiCoachCoreContext
    })

    const result = await callAiCoachApi(prompt)
    setApiResult(result)
    setLoading(false)

    if (result.ok) {
      const res = result.response
      const plan = res.dailyPlan

      // ── 자동 적용 실패 안전장치 검증 ──
      if (!plan || !plan.quests || !Array.isArray(plan.quests)) {
        alert('AI Daily Plan 구조가 올바르지 않습니다. 프롬프트 복사 fallback을 사용해 보세요.')
        return
      }

      let rawQuests = plan.quests
      
      // 중복 title 제거
      const seenTitles = new Set<string>()
      const uniqueQuests: any[] = []
      for (const q of rawQuests) {
        if (!q.title) continue
        const trimTitle = q.title.trim()
        if (!seenTitles.has(trimTitle)) {
          seenTitles.add(trimTitle)
          uniqueQuests.push(q)
        }
      }
      
      rawQuests = uniqueQuests

      if (rawQuests.length < 5) {
        alert(`중복 제거 후 생성된 퀘스트가 너무 적습니다 (최소 5개 필요, 현재 ${rawQuests.length}개). 기존 계획을 유지하며 자동 적용하지 않습니다.`)
        return
      }

      if (rawQuests.length > 20) {
        alert(`생성된 퀘스트 수가 너무 많아 (${rawQuests.length}개) 상위 18개로 제한하여 적용합니다.`)
        rawQuests = rawQuests.slice(0, 18)
      }

      // 12-31F: 분석 성공 시 세션 요약 기록
      try {
        const parsed = res.parsedToday
        recordAiCoachSession({
          date: parsed.date || new Date().toISOString().split('T')[0],
          rawJournalPreview: journalText ? journalText.slice(0, 150) : undefined,
          parsedSummary: {
            workoutDone: parsed.workout && parsed.workout.length > 0,
            studyMinutes: parsed.study?.reduce((acc: number, cur: any) => acc + (cur.durationMinutes ?? 0), 0),
            sleepDurationHours: parsed.sleep?.durationHours,
            sleepQuality: parsed.sleep?.quality,
            moodLevel: parsed.mood?.energyLevel,
            mainNotes: parsed.freeNotes,
            uncertainCount: parsed.uncertain?.length || res.uncertain?.length
          },
          dailyPlanSummary: {
            strategyTitle: plan.strategyTitle,
            loadRecommendation: plan.loadRecommendation,
            estimatedTotalMinutes: plan.estimatedTotalMinutes,
            questCount: rawQuests.length,
            coreCount: rawQuests.filter((q: any) => q.priority === 'core').length,
            supportCount: rawQuests.filter((q: any) => q.priority === 'support').length,
            recoveryCount: rawQuests.filter((q: any) => q.priority === 'recovery').length,
            maintenanceCount: rawQuests.filter((q: any) => q.priority === 'maintenance').length,
            focusAreas: plan.focusAreas
          },
          recommendedQuestIds: rawQuests.map((q: any) => q.id),
          scheduleSummarySnapshot: scheduleSummary && scheduleSummary.source !== 'none' ? {
            dayLoad: scheduleSummary.dayLoad,
            estimatedAvailableMinutes: scheduleSummary.estimatedAvailableMinutes,
            busyBlockCount: scheduleSummary.busyBlocks?.length,
            deepWorkBlockCount: scheduleSummary.freeBlocks?.filter((fb: any) => fb.quality === 'deepWork').length
          } : undefined
        })
      } catch (err) {
        console.error('AI 세션 요약 기록 실패:', err)
      }

      // 정규화 (category, difficulty)
      const sanitizedQuests = rawQuests.map(q => ({
        ...q,
        category: sanitizeCategory(q.category),
        difficulty: sanitizeDifficulty(q.difficulty || 'normal')
      }))
      setDailyPlanQuests(sanitizedQuests)
      setDailyPlanData(plan)

      // INP 이슈 방지: 무거운 스토어 변경 연산을 setTimeout으로 양보하여 브라우저가 먼저 화면을 갱신하도록 합니다.
      setTimeout(() => {
        try {
          const todayStr = getDateKey()
          replaceAiCoachDailyPlan(sanitizedQuests, todayStr)
        } catch (err) {
          console.error('AI Daily Plan 자동 적용 실패:', err)
          setTimeout(() => {
            alert('AI Daily Plan의 자동 스토어 적용 중 에러가 발생했습니다.')
          }, 50)
        }
      }, 50)

      if (res.domainCoaches.length > 0) {
        setSelectedDomain(res.domainCoaches[0].domain)
      }
    }
  }

  // 2. 프롬프트 복사 fallback 실행
  const handleCopyPrompt = () => {
    const state = useGame.getState()
    const saveSummary = generateAiCoachSaveSummary(state)
    const memorySummary = generateAiCoachMemorySummary(state)

    // schedule notes 파싱 (12-31E 구글 캘린더 연동 및 병합 지원)
    const scheduleSummary = getActiveScheduleSummary()

    const prompt = buildAiCoachPrompt({
      rawJournal: journalText || '// 오늘 하루에 대한 자유로운 기록이 이곳에 병합됩니다.',
      saveSummary,
      memorySummary,
      scheduleSummary,
      coreContext: aiCoachCoreContext
    })

    copyToClipboard(prompt, setPromptCopied)
    setShowJsonPaste(true)
  }

  // 수동 복사 JSON 적용 핸들러
  const handleApplyFallbackJson = () => {
    if (!fallbackJsonText.trim()) return
    try {
      const parsedJson = extractJsonObjectFromText(fallbackJsonText)
      const validatedResponse = validateAiCoachResponse(parsedJson)

      if (!validatedResponse) {
        alert('올바른 AI 응답 JSON 스키마 규격이 아닙니다. 복사한 JSON 전체를 정확히 붙여넣어 주세요.')
        return
      }

      const plan = validatedResponse.dailyPlan
      if (!plan || !plan.quests || !Array.isArray(plan.quests)) {
        alert('AI Daily Plan 구조가 올바르지 않습니다.')
        return
      }

      let rawQuests = plan.quests
      
      // 중복 title 제거
      const seenTitles = new Set<string>()
      const uniqueQuests: any[] = []
      for (const q of rawQuests) {
        if (!q.title) continue
        const trimTitle = q.title.trim()
        if (!seenTitles.has(trimTitle)) {
          seenTitles.add(trimTitle)
          uniqueQuests.push(q)
        }
      }
      rawQuests = uniqueQuests

      if (rawQuests.length < 5) {
        alert(`중복 제거 후 생성된 퀘스트가 너무 적습니다 (최소 5개 필요, 현재 ${rawQuests.length}개).`)
        return
      }

      if (rawQuests.length > 20) {
        rawQuests = rawQuests.slice(0, 18)
      }

      // 12-31F: AI 세션 요약 기록
      try {
        const parsed = validatedResponse.parsedToday
        recordAiCoachSession({
          date: parsed.date || new Date().toISOString().split('T')[0],
          rawJournalPreview: journalText ? journalText.slice(0, 150) : undefined,
          parsedSummary: {
            workoutDone: parsed.workout && parsed.workout.length > 0,
            studyMinutes: parsed.study?.reduce((acc: number, cur: any) => acc + (cur.durationMinutes ?? 0), 0),
            sleepDurationHours: parsed.sleep?.durationHours,
            sleepQuality: parsed.sleep?.quality,
            moodLevel: parsed.mood?.energyLevel,
            mainNotes: parsed.freeNotes,
            uncertainCount: parsed.uncertain?.length || validatedResponse.uncertain?.length
          },
          dailyPlanSummary: {
            strategyTitle: plan.strategyTitle,
            loadRecommendation: plan.loadRecommendation,
            estimatedTotalMinutes: plan.estimatedTotalMinutes,
            questCount: rawQuests.length,
            focusAreas: plan.focusAreas
          },
          recommendedQuestIds: rawQuests.map((q: any) => q.id),
        })
      } catch (err) {
        console.error('AI 세션 요약 기록 실패:', err)
      }

      // 정규화 (category, difficulty)
      const sanitizedQuests = rawQuests.map(q => ({
        ...q,
        category: sanitizeCategory(q.category),
        difficulty: sanitizeDifficulty(q.difficulty || 'normal')
      }))
      setDailyPlanQuests(sanitizedQuests)
      setDailyPlanData(plan)
      setApiResult({ ok: true, response: validatedResponse, rawText: fallbackJsonText })

      // INP 이슈 방지: 블로킹을 유발하는 alert() 대신 이미 화면에 렌더링되는 성공 배너(apiResult.ok)로 처리를 완료하고 패널을 닫습니다.
      setTimeout(() => {
        try {
          const todayStr = getDateKey()
          replaceAiCoachDailyPlan(sanitizedQuests, todayStr)
          setShowJsonPaste(false)
        } catch (err) {
          console.error('AI Daily Plan 자동 적용 실패:', err)
          alert('스토어 적용 중 에러가 발생했습니다.')
        }
      }, 50)

    } catch (e: any) {
      alert(`JSON 파싱 실패: ${e?.message || e}`)
    }
  }

  // 3. 추천 카드 상태 조작 핸들러
  const handleApprove = (id: string) => {
    setActionStates(prev => ({ ...prev, [id]: 'approved' }))
  }

  const handleReject = (id: string) => {
    setActionStates(prev => ({ ...prev, [id]: 'rejected' }))
  }

  const handleDraft = (id: string) => {
    setActionStates(prev => ({ ...prev, [id]: 'draft' }))
  }

  // 4. 인라인 수정 핸들러
  const startEditing = (action: any) => {
    setEditingIds(prev => ({ ...prev, [action.id]: true }))
    setEditForms(prev => ({
      ...prev,
      [action.id]: {
        title: editForms[action.id]?.title || action.title,
        description: editForms[action.id]?.description || action.description || '',
        category: editForms[action.id]?.category || action.category,
        difficulty: editForms[action.id]?.difficulty || (action.difficulty || 'normal')
      }
    }))
  }

  const saveEdit = (id: string) => {
    setEditingIds(prev => ({ ...prev, [id]: false }))
    setActionStates(prev => ({ ...prev, [id]: 'approved' }))
  }

  const cancelEdit = (id: string) => {
    setEditingIds(prev => ({ ...prev, [id]: false }))
  }

  const handleFieldChange = (id: string, field: string, value: any) => {
    setEditForms(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
  }

  // 5. 개별 daily 퀘스트 실제 저장소 추가 및 중복 방지 (dailyPlan / fallback 둘 다 작동)
  const handleAddQuest = (action: any) => {
    const currentState = actionStates[action.id] || 'draft'
    if (currentState === 'added' || currentState === 'rejected') return

    const isEdited = editForms[action.id]
    const finalTitle = isEdited ? editForms[action.id].title : action.title
    const finalDesc = isEdited ? editForms[action.id].description : action.description
    const finalCat = isEdited ? editForms[action.id].category : action.category
    const finalDiff = isEdited ? editForms[action.id].difficulty : (action.difficulty || 'normal')

    // 중복 체크: 이미 1회성 퀘스트로 동일한 제목과 카테고리가 등록되어 있다면 스킵
    const currentQuests = useGame.getState().quests
    const isDuplicate = currentQuests.some(cq => 
      cq.type === 'daily' && 
      !cq.recurring && 
      cq.title === finalTitle && 
      cq.category === finalCat
    )

    if (!isDuplicate) {
      addAiCoachDailyQuest({
        title: finalTitle.trim() || 'AI 추천 퀘스트',
        description: finalDesc?.trim() || undefined,
        category: finalCat,
        difficulty: finalDiff,
        coachReason: action.reason || 'AI 성장 코치단 처방',
        priority: action.priority,
        estimatedMinutes: action.estimatedMinutes
      })
    }

    setActionStates(prev => ({
      ...prev,
      [action.id]: 'added'
    }))
  }

  // 6. 승인된 전체 퀘스트 일괄 추가 (fallback용)
  const handleAddAllApproved = () => {
    recommendations.forEach(action => {
      const state = actionStates[action.id]
      if (state === 'draft' || state === 'approved') {
        handleAddQuest(action)
      }
    })
  }

  // 7. 전체 Daily Plan 확정 및 스토어 일괄 추가 (중복 방지 강화)
  const handleConfirmPlan = () => {
    const currentQuests = useGame.getState().quests

    dailyPlanQuests.forEach(quest => {
      const currentState = actionStates[quest.id] || quest.status
      if (currentState === 'rejected' || currentState === 'added') return

      const isEdited = editForms[quest.id]
      const finalTitle = isEdited ? editForms[quest.id].title : quest.title
      const finalDesc = isEdited ? editForms[quest.id].description : quest.description
      const finalCat = isEdited ? editForms[quest.id].category : quest.category
      const finalDiff = isEdited ? editForms[quest.id].difficulty : quest.difficulty

      const isDuplicate = currentQuests.some(cq => 
        cq.type === 'daily' && 
        !cq.recurring && 
        cq.title === finalTitle && 
        cq.category === finalCat
      )

      if (!isDuplicate) {
        addAiCoachDailyQuest({
          title: finalTitle.trim(),
          description: finalDesc?.trim() || undefined,
          category: finalCat,
          difficulty: finalDiff,
          coachReason: quest.reason || 'AI Daily Plan 처방',
          priority: quest.priority,
          estimatedMinutes: quest.estimatedMinutes
        })
      }

      setActionStates(prev => ({
        ...prev,
        [quest.id]: 'added'
      }))
    })
  }

  // 도메인 한글명 매핑
  const domainLabelMap: Record<string, string> = {
    body: '💪 신체/운동',
    study: '📚 학습/커리어',
    career: '💻 직무/업무',
    finance: '💰 투자/금융',
    mind: '🧘 루틴/멘탈',
    routine: '🧹 고정 습관',
    general: '⚖️ 총괄 조율'
  }

  return (
    <div className="space-y-6">
      {/* ── 안내 및 주의사항 패널 ── */}
      <div className="panel corner-bracket p-4 bg-indigo-950/20 border border-cyan-400/10 text-sm">
        <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1 text-cyan-100">
            <div className="font-bold text-cyan-300">AI 성장 코치단 가이드라인</div>
            <p className="text-xs text-cyan-300/70 leading-relaxed">
              정형화된 입력 양식 없이 오늘 하루 있었던 일이나 운동, 공부 내용, 수면 시간 등을 일기처럼 자유롭게 적으세요.
              성장 코치단이 내일의 하루 전체 Daily Plan을 여러 일정을 감안해 통째로 설계합니다.
            </p>
            <div className="flex items-center gap-1 text-[11px] text-purple-300 font-semibold mt-2">
              <Info className="w-3.5 h-3.5" />
              <span>개인정보 외부 전송 주의: 주민번호, 계좌번호, 비밀번호 등 민감정보는 입력창에 적지 마세요.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 🎯 AI 코치 Core (장기 지침) ── */}
      <div className="panel corner-bracket p-5 space-y-4 bg-slate-950/40 border border-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.02)]">
        <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
        <div className="flex justify-between items-center border-b border-cyan-400/10 pb-2 cursor-pointer" onClick={() => setShowCoreContext(!showCoreContext)}>
          <h4 className="text-xs font-bold text-cyan-200 flex items-center gap-1.5 font-mono tracking-wider">
            <Sparkles className="w-4 h-4 text-cyan-400" /> AI COACH CORE (핵심 방향성)
          </h4>
          <div className="flex items-center gap-2">
            {!aiCoachCoreContext?.text && (
              <span className="text-[10px] text-amber-400 animate-pulse font-semibold">
                ⚠️ 작성 필요
              </span>
            )}
            {aiCoachCoreContext?.updatedAt && (
              <span className="text-[9px] text-cyan-300/30 font-mono">
                최근 수정: {new Date(aiCoachCoreContext.updatedAt).toLocaleString()}
              </span>
            )}
            {showCoreContext ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-cyan-400" />}
          </div>
        </div>

        {(!aiCoachCoreContext?.text || showCoreContext) && (
          <div className="space-y-3 transition-all duration-300">
            <p className="text-xs text-cyan-300/60 leading-relaxed">
              AI 코치가 매번 플랜을 짤 때 참고할 사용자의 장기 방향성, 핵심 프로젝트 및 운영 원칙입니다.
              이 내용은 매일 초기화되지 않고 <strong>사용자가 직접 저장할 때만</strong> 변경됩니다.
            </p>
            
            <div className="relative">
              <textarea
                value={coreText}
                onChange={(e) => setCoreText(e.target.value)}
                placeholder={`[현재 최우선 방향]
- KBI 금융 AI 리터러시 자격증 준비
- 커팅/수면 리듬 회복

[큰 프로젝트]
- KBI Stage 03 완료 후 문제풀이 루틴으로 전환
- 벤치프레스 100kg 장기 목표

[AI 코치 운영 원칙]
- 과제는 실제 달성 가능한 양으로 조정
- 수면 부족 시 회복 우선 배치`}
                rows={6}
                className="w-full bg-ink-950/60 border border-cyan-400/20 rounded p-3 text-xs text-cyan-100 placeholder-cyan-300/20 focus:outline-none focus:border-cyan-400 font-sans leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
              <span className="text-[10px] text-purple-300 flex items-center gap-1 font-semibold">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Core는 저장되어 매번 AI 코치 프롬프트에 포함됩니다. 민감한 개인정보는 입력하지 마세요.
              </span>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {saveSuccessMsg && (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {saveSuccessMsg}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    updateAiCoachCoreContext(coreText)
                    setSaveSuccessMsg('Core 저장 완료')
                    setTimeout(() => setSaveSuccessMsg(''), 3000)
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-cyan-950/20"
                >
                  Core 저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 🧠 AI 코치 메모리 대시보드 (12-31F) ── */}
      {aiCoachMemory && (
        <div className="panel corner-bracket p-5 space-y-4 bg-slate-950/40 border border-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.02)]">
          <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
          <div className="flex justify-between items-center border-b border-cyan-400/10 pb-2">
            <h4 className="text-xs font-bold text-cyan-200 flex items-center gap-1.5 font-mono tracking-wider">
              <Brain className="w-4 h-4 text-cyan-400 animate-pulse" /> AI COACH MEMORY
            </h4>
            {aiCoachMemory.lastUpdatedAt && (
              <span className="text-[9px] text-cyan-300/30 font-mono">
                Last Update: {new Date(aiCoachMemory.lastUpdatedAt).toLocaleString()}
              </span>
            )}
          </div>

          {aiCoachMemory.sessions.length < 3 ? (
            /* 데이터 부족 상태 (fallback) */
            <div className="space-y-3 py-1">
              <p className="text-xs text-cyan-300/60 leading-relaxed">
                📊 <strong>학습 데이터 축적 중...</strong> ({aiCoachMemory.sessions.length}/3 sessions)
              </p>
              <div className="w-full bg-ink-950/60 h-1.5 rounded-full overflow-hidden border border-cyan-400/15">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (aiCoachMemory.sessions.length / 3) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-purple-300 leading-relaxed">
                * 며칠 동안 하루 기록 분석을 더 진행하면, AI 코치가 학습 완료율 및 과부하 지수, 수면과 습관 간의 상관관계를 자동으로 파악해 개인화 피드백을 제공합니다.
              </p>
            </div>
          ) : (() => {
            const summary = aiCoachMemory.rollingSummary
            
            // 최근 7일/30일 완료율 텍스트 계산
            const getOutcomesRate = (days: number) => {
              const limit = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
              const items = aiCoachMemory.questOutcomes.filter(o => o.addedAt && new Date(o.addedAt) >= limit)
              if (items.length === 0) return null
              const comps = items.filter(o => o.status === 'completed').length
              return Math.round((comps / items.length) * 100)
            }
            const rate7d = getOutcomesRate(7)
            const rate30d = getOutcomesRate(30)

            return (
              <div className="space-y-4 text-xs">
                {/* 2열 통계 그리드 */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* 1열: 계획 완료율 */}
                  <div className="space-y-3 bg-ink-950/40 p-3 rounded border border-cyan-400/5">
                    <div className="text-[11px] font-bold text-cyan-300">📈 플랜 수행 성공률</div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-2 bg-ink-950/60 rounded border border-cyan-400/5">
                        <div className="text-[10px] text-cyan-300/50">최근 7일</div>
                        <div className={`text-base font-bold font-mono mt-1 ${rate7d !== null ? (rate7d >= 75 ? 'text-emerald-400' : rate7d >= 50 ? 'text-cyan-300' : 'text-red-400') : 'text-cyan-300/30'}`}>
                          {rate7d !== null ? `${rate7d}%` : '-'}
                        </div>
                      </div>
                      <div className="p-2 bg-ink-950/60 rounded border border-cyan-400/5">
                        <div className="text-[10px] text-cyan-300/50">최근 30일</div>
                        <div className={`text-base font-bold font-mono mt-1 ${rate30d !== null ? (rate30d >= 75 ? 'text-emerald-400' : rate30d >= 50 ? 'text-cyan-300' : 'text-red-400') : 'text-cyan-300/30'}`}>
                          {rate30d !== null ? `${rate30d}%` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2열: 안정 습관 & 실패 정체 목록 */}
                  <div className="space-y-2.5">
                    {summary.stableHabits && summary.stableHabits.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <span className="text-[11px] font-bold text-emerald-400 shrink-0 mt-0.5">🟢 안정 습관:</span>
                        <div className="flex flex-wrap gap-1">
                          {summary.stableHabits.map((h, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded font-semibold">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {summary.repeatedFailures && summary.repeatedFailures.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <span className="text-[11px] font-bold text-red-400 shrink-0 mt-0.5">🔴 반복 지연:</span>
                        <div className="flex flex-wrap gap-1">
                          {summary.repeatedFailures.map((f, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-300 rounded font-semibold">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {summary.overloadedAreas && summary.overloadedAreas.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold bg-amber-500/5 border border-amber-500/15 p-1.5 rounded">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>피로 누적 경고: 계획 대비 수행 저하 구간 감지</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 하단 코치 소견 */}
                {summary.coachNotes && summary.coachNotes.length > 0 && (
                  <div className="bg-cyan-500/5 border border-cyan-500/10 p-3 rounded space-y-1.5 text-[11px] text-cyan-300/80 leading-relaxed font-mono">
                    <div className="text-[10px] font-bold text-cyan-300/60 mb-1">📋 AI 코치단 분석 리포트</div>
                    {summary.coachNotes.map((note, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 mt-0.5">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── 자유 기록 및 일정 입력 폼 ── */}
      <div className="panel corner-bracket p-5 space-y-4">
        <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-cyan-200 flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" /> 오늘 하루 자유 기록
          </label>
          <span className="text-[10px] text-cyan-300/40">기록 방식 제한 없음</span>
        </div>

        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="여기에 자유롭게 적으세요. 예시:&#10;- 헬스 가슴: 벤치 50kg 10회 3세트 소화.&#10;- 공부: KBI 자격증 1시간 공부. Stage 03 Topic 01~02 읽음.&#10;- 수면: 새벽 2시 취침, 오전 9시 30분 기상. 컨디션 뻐근함.&#10;- 퇴근 후 쇼츠 많이 봐서 시간 낭비함."
          className="w-full h-32 bg-ink-950/60 border border-cyan-400/20 rounded-md p-3 text-sm text-cyan-50 focus:border-cyan-400 focus:outline-none placeholder-cyan-300/20 font-mono resize-none"
        />

        {/* 내일 일정 & 가용 시간 관리 (12-31E 구글 캘린더 연동 및 프리뷰) */}
        <div className="space-y-4 border-t border-cyan-400/10 pt-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-200">내일 일정 & 가용 시간 관리</span>
            </div>
            {/* 마스킹 옵션 토글 */}
            <label className="flex items-center gap-1.5 text-[11px] text-cyan-300/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={maskTitles}
                onChange={(e) => setMaskTitles(e.target.checked)}
                className="w-3 h-3 rounded bg-ink-950 border-cyan-400/30 text-cyan-400 focus:ring-0 focus:ring-offset-0"
              />
              {maskTitles ? (
                <span className="flex items-center gap-0.5 text-cyan-300">
                  <Lock className="w-3 h-3 text-cyan-400" /> 일정 제목 마스킹 활성
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-amber-300 font-semibold">
                  <Unlock className="w-3 h-3 text-amber-400" /> 마스킹 해제 (개인정보 주의)
                </span>
              )}
            </label>
          </div>

          <div className="flex flex-col gap-3">
            {/* 연결/불러오기 버튼 및 상태 */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleLoadCalendar}
                disabled={calendarStatus === 'loading'}
                className={`text-xs px-4 py-2 rounded-md font-bold transition duration-300 flex items-center gap-1.5 border ${
                  calendarStatus === 'loading'
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400/30 cursor-not-allowed'
                    : calendarStatus === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                    : 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40 hover:bg-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                }`}
              >
                {calendarStatus === 'loading' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>캘린더 동기화 중...</span>
                  </>
                ) : calendarStatus === 'success' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>캘린더 재동기화</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Google Calendar에서 불러오기</span>
                  </>
                )}
              </button>

              <span className="text-[10px] text-cyan-300/40 leading-relaxed max-w-md">
                🔒 캘린더는 읽기 전용으로만 사용되며, 일정 원문 대신 요약된 시간 정보만 AI에 전달됩니다.
              </span>
            </div>

            {/* 에러 상태일 때 */}
            {calendarStatus === 'error' && (
              <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-md text-xs text-red-200/90 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  캘린더 연동 실패
                </p>
                <p className="text-[11px] opacity-80">{calendarError}</p>
                <p className="text-[10px] text-cyan-300/50 pt-1">
                  * VITE_GOOGLE_CLIENT_ID가 올바르고 Google Cloud에 로컬 개발 주소가 JavaScript Origins로 등록되어 있는지 확인해 주세요. 실패하더라도 수동 일정 메모를 적어 진행할 수 있습니다.
                </p>
              </div>
            )}

            {/* 연동 성공 시 상세 정보 프리뷰 렌더링 (Glassmorphism & Interactive design) */}
            {calendarStatus === 'success' && (() => {
              const summary = getActiveScheduleSummary()
              return (
                <div className="bg-ink-950/80 border border-cyan-400/30 rounded-lg p-4 space-y-4 shadow-[0_0_15px_rgba(6,182,212,0.05)] animate-fadeIn">
                  {/* 상단 헤더 요약 */}
                  <div className="flex justify-between items-center border-b border-cyan-400/10 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        summary.dayLoad === 'heavy' ? 'border-red-400/30 bg-red-500/10 text-red-300' :
                        summary.dayLoad === 'light' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' :
                        'border-cyan-400/30 bg-cyan-500/10 text-cyan-300'
                      }`}>
                        부하량: {summary.dayLoad.toUpperCase()}
                      </span>
                      {summary.estimatedAvailableMinutes !== undefined && (
                        <span className="text-xs text-cyan-300 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          가용 시간: <strong>{Math.floor(summary.estimatedAvailableMinutes / 60)}시간 {summary.estimatedAvailableMinutes % 60}분</strong> ({summary.estimatedAvailableMinutes}분)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded">
                      동기화 완료 (이벤트 {calendarEvents.length}개)
                    </span>
                  </div>

                  {/* 바쁜 일정 (Busy Blocks) */}
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-cyan-300/80">고정 일정 (Busy Blocks)</h5>
                    {summary.busyBlocks.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {summary.busyBlocks.map((block, idx) => (
                          <div key={idx} className="p-2 bg-ink-950/40 border border-cyan-400/5 rounded flex items-center justify-between text-xs font-mono">
                            <span className="text-cyan-100 max-w-[160px] truncate" title={block.title}>
                              📌 {block.title}
                            </span>
                            <span className="text-cyan-300/50 text-[10px]">
                              {block.start} ~ {block.end}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-cyan-300/40 italic">내일 고정 일정이 없습니다.</p>
                    )}
                  </div>

                  {/* 자유 가용 블록 (Free Blocks) */}
                  <div className="space-y-1.5 border-t border-cyan-400/5 pt-3">
                    <h5 className="text-[11px] font-bold text-cyan-300/80">가용 시간대 (Free Blocks)</h5>
                    {summary.freeBlocks && summary.freeBlocks.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {summary.freeBlocks.map((block, idx) => (
                          <div key={idx} className="p-2 bg-ink-950/40 border border-cyan-400/5 rounded flex items-center justify-between text-xs font-mono">
                            <span className="flex items-center gap-1.5">
                              <span>⚡ {block.start} ~ {block.end}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-sans font-semibold ${
                                block.quality === 'deepWork' ? 'border-amber-400/30 bg-amber-500/10 text-amber-300' :
                                block.quality === 'light' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' :
                                'border-zinc-500/30 bg-zinc-500/10 text-zinc-400'
                              }`}>
                                {block.quality === 'deepWork' ? '집중 몰입' : block.quality === 'light' ? '가벼운 작업' : '보통'}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-cyan-300/40 italic">여유 가용 시간이 존재하지 않습니다.</p>
                    )}
                  </div>

                  {/* AI 코치진 요약 코멘트 */}
                  {summary.notes && summary.notes.length > 0 && (
                    <div className="bg-cyan-500/5 border border-cyan-400/10 p-2 rounded text-[11px] text-cyan-300/80 leading-relaxed">
                      {summary.notes.filter(note => !note.startsWith('[수동 추가 메모]')).map((note, i) => (
                        <div key={i}>📋 {note}</div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* 수동 일정 메모 (fallback / 추가 내용) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-cyan-200 flex items-center gap-1">
                  <span>{calendarStatus === 'success' ? '📝 수동 추가 일정 메모 (캘린더 외 추가 내용)' : '📝 내일 일정 메모 (수동)'}</span>
                </label>
                {calendarStatus !== 'success' && (
                  <span className="text-[9px] text-cyan-300/40">구글 캘린더 연동을 안 하는 경우 사용</span>
                )}
              </div>
              <textarea
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                placeholder={calendarStatus === 'success' ? "캘린더 외에 수동으로 추가하고 싶은 일정이 있다면 적어주세요. 예: 저녁에 식단 장보기" : "내일 특별 일정이 있으면 적어주세요. 예: 10:30~13:00 수업, 17:00~19:00 과외"}
                className="w-full h-16 bg-ink-950/60 border border-cyan-400/20 rounded-md p-2 text-xs text-cyan-50 focus:border-cyan-400 focus:outline-none placeholder-cyan-300/20 font-mono resize-none"
              />
            </div>
          </div>
        </div>


        <div className="flex gap-2 flex-wrap pt-2">
          <button
            onClick={handleAnalyze}
            disabled={loading || !journalText.trim()}
            className="btn btn-primary flex items-center gap-2 px-5 py-2.5 font-bold shadow-glow disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                <span>AI 전체 플랜 설계 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>AI 전체 Plan 생성</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyPrompt}
            disabled={loading}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2.5 text-xs text-cyan-300 hover:text-white"
            title="Gemini API Key가 없거나 호출 오류 시 프롬프트를 복사하여 외부 AI 서비스에 수동으로 입력할 수 있습니다."
          >
            {promptCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">프롬프트 복사 완료</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>프롬프트 복사 (Key 에러 대안)</span>
              </>
            )}
          </button>
        </div>

        {/* 외부 AI 결과 JSON 붙여넣기 패널 */}
        {showJsonPaste && (
          <div className="panel corner-bracket p-4 bg-indigo-950/20 border border-cyan-400/20 space-y-3 animate-fadeIn mt-4">
            <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-cyan-200">
                📥 외부 AI 분석 결과 JSON 붙여넣기
              </label>
              <button 
                onClick={() => setShowJsonPaste(false)}
                className="text-[10px] text-cyan-400/50 hover:text-cyan-300"
              >
                닫기
              </button>
            </div>
            <p className="text-[11px] text-cyan-300/60 leading-relaxed">
              ChatGPT, Claude 등에 복사한 프롬프트를 입력해 나온 <strong>JSON 응답 전체</strong>를 아래에 붙여넣고 [분석 결과 적용] 버튼을 눌러주세요.
            </p>
            <textarea
              value={fallbackJsonText}
              onChange={(e) => setFallbackJsonText(e.target.value)}
              placeholder={`{ "parsedToday": ..., "coachSummary": ..., "dailyPlan": ... }`}
              rows={6}
              className="w-full bg-ink-950/60 border border-cyan-400/20 rounded p-2.5 text-xs text-cyan-100 placeholder-cyan-300/20 focus:outline-none focus:border-cyan-400 font-mono leading-relaxed resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleApplyFallbackJson}
                disabled={!fallbackJsonText.trim()}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded text-xs font-bold transition-all disabled:opacity-40 shadow-md shadow-emerald-950/20"
              >
                분석 결과 적용
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 분석 결과 화면 ── */}
      {apiResult && (
        <div className="space-y-6">
          {/* 1. 실패 상태 표시 */}
          {!apiResult.ok && (
            <div className="panel corner-bracket p-5 border-red-500/30 bg-red-950/10 space-y-4">
              <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-red-300">분석을 완료하지 못했습니다</div>
                  <p className="text-xs text-red-200/80 leading-relaxed">{apiResult.error}</p>
                </div>
              </div>

              {/* API 호출 실패시 프롬프트 복사 fallback 안내 */}
              <div className="border-t border-red-500/10 pt-4 space-y-3">
                <p className="text-xs text-cyan-300/80">
                  <strong>💡 팁:</strong> 발급받은 Gemini API 키가 없거나 할당량이 초과된 경우, 아래 버튼을 눌러 구성된 프롬프트를 복사한 뒤 외부 AI 챗봇에 붙여넣어 결과를 얻을 수 있습니다.
                </p>
                <button
                  onClick={handleCopyPrompt}
                  className="btn btn-primary text-xs flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>최종 분석 프롬프트 복사하기</span>
                </button>
              </div>

              {/* 에러 상태에서도 생성된 rawText가 있다면 디버깅용으로 표시 */}
              {apiResult.rawText && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="text-xs text-red-400/70 hover:text-red-300 flex items-center gap-1"
                  >
                    <span>원문 결과 보기</span>
                    {showRawJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showRawJson && (
                    <pre className="bg-ink-950/80 p-3 rounded text-xs text-red-200/60 overflow-x-auto font-mono max-h-60 border border-red-500/15">
                      {apiResult.rawText}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. 성공 상태 표시 */}
          {apiResult.ok && (
            <div className="space-y-6 animate-fadeIn">
              {/* 1) 적용 완료 메시지 */}
              <div className="panel corner-bracket p-4 bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <div className="font-bold text-sm text-emerald-200 font-mono">AI Daily Plan이 현재 일일퀘스트로 적용되었습니다!</div>
                  <p className="text-xs text-emerald-300/80 leading-relaxed font-sans">
                    새 Plan을 생성하기 전까지 현재 Plan이 유지됩니다.
                  </p>
                </div>
              </div>

              {/* 2) 간단한 총괄 요약 & 3) 퀘스트 구성 요약 */}
              {dailyPlanData && (
                <div className="panel corner-bracket p-5 bg-gradient-to-br from-indigo-950/40 to-purple-950/30 border border-cyan-400/20 space-y-4">
                  <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                  
                  <div className="flex justify-between items-start gap-4 flex-wrap sm:flex-nowrap">
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 tracking-wider">DAILY STRATEGY</span>
                      <h3 className="text-base font-bold text-cyan-200 mt-1.5 flex items-center gap-1.5">
                        <Brain className="w-4.5 h-4.5 text-cyan-400 font-mono" /> {dailyPlanData.strategyTitle}
                      </h3>
                      <p className="text-xs text-cyan-300/60 mt-1 leading-relaxed font-sans">{dailyPlanData.strategySummary}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${
                        dailyPlanData.loadRecommendation === 'heavy' ? 'border-red-400/20 bg-red-500/10 text-red-300' :
                        dailyPlanData.loadRecommendation === 'light' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' :
                        'border-cyan-400/20 bg-cyan-500/10 text-cyan-300'
                      }`}>
                        권장 강도: {dailyPlanData.loadRecommendation.toUpperCase()}
                      </span>
                      {dailyPlanData.estimatedTotalMinutes && (
                        <span className="text-[10px] text-cyan-300 bg-ink-950/60 border border-cyan-400/10 px-2 py-0.5 rounded font-mono">
                          총 소요: 약 {dailyPlanData.estimatedTotalMinutes}분
                        </span>
                      )}
                      <span className="text-[10px] text-cyan-300 bg-ink-950/60 border border-cyan-400/10 px-2 py-0.5 rounded font-mono">
                        총 퀘스트: {dailyPlanQuests.length}개
                      </span>
                    </div>
                  </div>

                  {/* 퀘스트 구성 요약 배지 */}
                  <div className="flex flex-wrap gap-2 text-xs border-t border-cyan-400/10 pt-3">
                    <span className="text-cyan-300/50 self-center">퀘스트 구성:</span>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded font-semibold text-[10px]">
                      Core {dailyPlanQuests.filter(q => q.priority === 'core').length}개
                    </span>
                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded font-semibold text-[10px]">
                      Support {dailyPlanQuests.filter(q => q.priority === 'support').length}개
                    </span>
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded font-semibold text-[10px]">
                      Maintenance {dailyPlanQuests.filter(q => q.priority === 'maintenance').length}개
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded font-semibold text-[10px]">
                      Recovery {dailyPlanQuests.filter(q => q.priority === 'recovery').length}개
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded font-semibold text-[10px]">
                      Optional/Micro {dailyPlanQuests.filter(q => q.priority === 'optional').length}개
                    </span>
                  </div>

                  {/* 5) Calendar 반영 여부 */}
                  <div className="text-[11px] text-cyan-300/70 flex items-center gap-1 font-mono pt-1">
                    <span>📅 스케줄 연동 상태:</span>
                    {getActiveScheduleSummary().source === 'googleCalendar' ? (
                      <span className="text-emerald-400 font-bold">"Google Calendar 일정 반영됨"</span>
                    ) : getActiveScheduleSummary().source === 'manualText' ? (
                      <span className="text-amber-400 font-bold">"수동 일정 메모 기반 반영됨"</span>
                    ) : (
                      <span className="text-zinc-400">"일정 정보 없음 (기본 설정 반영)"</span>
                    )}
                  </div>
                </div>
              )}

              {/* 4) 간단 미리보기 (퀘스트 제목만 리스트) */}
              <div className="panel corner-bracket p-5 space-y-3 bg-slate-950/20">
                <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                <h4 className="text-xs font-bold text-cyan-200 flex items-center gap-1.5 font-mono tracking-wider">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> 반영된 퀘스트 리스트 ({dailyPlanQuests.length}개)
                </h4>
                
                <div className="space-y-1 bg-ink-950/40 p-3 rounded border border-cyan-400/10 max-h-80 overflow-y-auto">
                  {dailyPlanQuests.map((quest, idx) => {
                    const meta = CATEGORY_META[quest.category as Category]
                    return (
                      <div key={quest.id} className="py-2 border-b border-cyan-400/5 last:border-0 text-xs">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-300/40 font-mono w-4">{idx + 1}.</span>
                            <span className="font-bold text-cyan-50">{quest.title}</span>
                            {meta && (
                              <span className="text-[9px] border border-cyan-400/20 px-1.5 py-0.2 rounded text-cyan-300 bg-cyan-400/5">
                                {meta.icon} {meta.label}
                              </span>
                            )}
                            <span className="text-[9px] text-cyan-300/40 font-mono">[{quest.priority.toUpperCase()}]</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {quest.estimatedMinutes && (
                              <span className="text-[10px] text-cyan-300/50 font-mono">{quest.estimatedMinutes}분</span>
                            )}
                            <button 
                              type="button"
                              onClick={() => toggleQuestDetail(quest.id)}
                              className="text-[10px] text-cyan-300/60 hover:text-cyan-200 underline focus:outline-none"
                            >
                              {detailedQuests[quest.id] ? '상세 닫기' : '상세'}
                            </button>
                          </div>
                        </div>

                        {detailedQuests[quest.id] && (
                          <div className="mt-1.5 p-2 bg-indigo-950/20 border border-cyan-500/10 rounded text-[11px] text-cyan-300 space-y-1 font-sans leading-relaxed animate-fadeIn">
                            {quest.description && <div><strong>설명:</strong> {quest.description}</div>}
                            <div><strong>처방 이유:</strong> {quest.reason}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 🎯 AI 장기 목표 제안 섹션 */}
              {(Array.isArray(apiResult.response.mainQuestSuggestions) && apiResult.response.mainQuestSuggestions.length > 0) && (
                <div className="panel corner-bracket p-5 space-y-4 bg-slate-950/20 border border-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.02)]">
                  <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                  <div className="flex justify-between items-center border-b border-purple-500/10 pb-2 cursor-pointer font-sans" onClick={() => setShowLongTermSuggestions(!showLongTermSuggestions)}>
                    <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5 font-mono tracking-wider">
                      <Compass className="w-4 h-4 text-purple-400" /> AI 장기 목표 제안 
                      <span className="text-[10px] px-1.5 py-0.2 bg-purple-500/15 text-purple-300 rounded border border-purple-500/20 font-normal">
                        {apiResult.response.mainQuestSuggestions.length}건
                      </span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-cyan-300/50">원클릭 적용 지원</span>
                      {showLongTermSuggestions ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
                    </div>
                  </div>

                  {/* 제안 반영 안내 배너 */}
                  <div className="panel corner-bracket p-3 bg-purple-950/30 border border-purple-500/20 text-purple-200 text-[11px] leading-relaxed">
                    <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                    💡 <strong>안내:</strong> 장기 목표(Main Quest) 제안은 일일퀘스트와 달리 <strong>자동 반영되지 않습니다.</strong> 아래의 제안 목록에서 필요한 항목만 직접 선택하여 적용하십시오.
                  </div>

                  {showLongTermSuggestions && (
                    <div className="space-y-5 animate-fadeIn">
                      {/* 새 Main Quest 후보 제안 */}
                      {apiResult.response.mainQuestSuggestions && apiResult.response.mainQuestSuggestions.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                            <span>✨ 새 메인 퀘스트(장기 목표) 제안</span>
                          </h5>
                          <div className="grid md:grid-cols-2 gap-3">
                            {apiResult.response.mainQuestSuggestions.map((suggestion, idx) => {
                              const key = `main-${idx}-${suggestion.title}`
                              const isAdded = appliedMainQuests[key]
                              const currentQuests = quests.filter(q => q.type === 'main')
                              const isDuplicate = currentQuests.some(cq => 
                                cq.title.trim() === suggestion.title.trim() && 
                                cq.finalGoal?.trim() === suggestion.finalGoal?.trim()
                              )

                              return (
                                <div key={idx} className="p-3 bg-ink-950/40 border border-purple-500/5 rounded-md flex flex-col justify-between text-xs space-y-2">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                      <span className="font-bold text-cyan-50 text-[13px]">{suggestion.title}</span>
                                      <span className="text-[9px] px-1.5 py-0.2 rounded border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 font-mono shrink-0">
                                        {CATEGORY_META[suggestion.category as Category]?.label || suggestion.category}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-cyan-300/60 leading-relaxed font-sans mt-1">
                                      <strong>최종 목표:</strong> {suggestion.finalGoal}
                                    </p>
                                    {suggestion.description && (
                                      <p className="text-[10px] text-cyan-300/40 leading-relaxed font-sans">
                                        {suggestion.description}
                                      </p>
                                    )}
                                    <p className="text-[10px] text-amber-300/80 bg-amber-500/5 p-1.5 border border-amber-500/10 rounded leading-relaxed mt-1 font-sans">
                                      💡 <strong>이유:</strong> {suggestion.reason}
                                    </p>

                                  </div>

                                  <div className="pt-2 border-t border-cyan-400/5 flex items-center justify-between">
                                    {isDuplicate ? (
                                      <span className="text-[10px] text-amber-300/70">이미 등록된 메인 퀘스트</span>
                                    ) : (
                                      <span className="text-[10px] text-purple-300/40 font-mono">AI Coach 처방</span>
                                    )}
                                    <button
                                      type="button"
                                      disabled={isAdded || isDuplicate}
                                      onClick={() => handleAddMainQuestSuggestion(suggestion, idx)}
                                      className={`px-3 py-1.5 rounded text-[11px] font-bold transition flex items-center gap-1 shadow-md ${
                                        isAdded
                                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                                          : isDuplicate
                                          ? 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-400/60 cursor-not-allowed'
                                          : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold'
                                      }`}
                                    >
                                      {isAdded ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>추가 완료</span>
                                        </>
                                      ) : isDuplicate ? (
                                        <span>등록 불가</span>
                                      ) : (
                                        <>
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Main으로 추가</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}


                    </div>
                  )}
                </div>
              )}

              {/* 추가 장기 제안 뱃지 알림 */}
              {(apiResult.response.mainGoalSuggestions?.length > 0) && (
                <div className="p-3 bg-purple-950/15 border border-purple-500/20 rounded text-xs text-purple-300 flex items-center justify-between flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Info className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>AI 코치의 추가 장기 목표 제안이 {apiResult.response.mainGoalSuggestions.length}건 존재합니다.</span>
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowDetailedData(true)} 
                    className="text-[11px] text-cyan-300 hover:text-white underline font-bold"
                  >
                    자세히 보기
                  </button>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────
                  분석 상세 데이터 (접기 형태의 디버깅/상세 정보 통합 섹션)
                  ───────────────────────────────────────────────────────── */}
              <div className="border-t border-cyan-400/10 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDetailedData(!showDetailedData)}
                  className="w-full py-2.5 bg-ink-950/60 hover:bg-ink-950 border border-cyan-400/10 rounded flex justify-between items-center px-4 text-xs font-bold text-cyan-300 transition shadow-md"
                >
                  <span className="flex items-center gap-1.5 font-mono tracking-wider">
                    <Brain className="w-4 h-4 text-cyan-400" /> AI 분석 상세 보고서 및 원본 JSON 보기
                  </span>
                  {showDetailedData ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-cyan-400" />}
                </button>

                {showDetailedData && (
                  <div className="mt-4 space-y-6 animate-fadeIn">
                    {/* 분야별 진단 결과 (도메인 코치 피드백) */}
                    <div className="panel corner-bracket p-5 space-y-4">
                      <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                      <h4 className="text-sm font-bold text-cyan-200 flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-cyan-400 animate-pulse" /> 분야별 코치 진단 및 처방
                      </h4>

                      {/* 도메인 탭 전환 */}
                      <div className="flex gap-1 overflow-x-auto p-1 bg-ink-950/80 rounded-md border border-cyan-400/5">
                        {apiResult.response.domainCoaches.map((coach) => (
                          <button
                            key={coach.domain}
                            type="button"
                            onClick={() => setSelectedDomain(coach.domain)}
                            className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                              selectedDomain === coach.domain
                                ? 'bg-cyan-500/25 border border-cyan-400/50 text-white font-bold'
                                : 'text-white/40 hover:text-white/70'
                            }`}
                          >
                            {domainLabelMap[coach.domain] || coach.domain}
                          </button>
                        ))}
                      </div>

                      {/* 탭 본문 */}
                      {apiResult.response.domainCoaches.map((coach) => {
                        if (coach.domain !== selectedDomain) return null
                        return (
                          <div key={coach.domain} className="space-y-3 bg-ink-950/40 p-4 rounded border border-cyan-400/10 animate-fadeIn">
                            <div>
                              <div className="text-xs font-bold text-cyan-300">코치단 진단 (Diagnosis)</div>
                              <p className="text-xs text-cyan-50 mt-1 leading-relaxed">{coach.diagnosis}</p>
                            </div>
                            <div className="border-t border-cyan-400/5 pt-3">
                              <div className="text-xs font-bold text-amber-300">처방 및 지침 (Recommendation)</div>
                              <p className="text-xs text-cyan-50 mt-1 leading-relaxed">{coach.recommendation}</p>
                            </div>
                            {coach.risk && (
                              <div className="border-t border-cyan-400/5 pt-3">
                                <div className="text-xs font-bold text-red-400">주의 위협 요소 (Risk Factors)</div>
                                <p className="text-xs text-red-200/90 mt-1 leading-relaxed">{coach.risk}</p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* 오늘 기록된 통계 요약 & 불확실 항목 */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* 파싱된 주요 내용 */}
                      <div className="panel corner-bracket p-4 space-y-3">
                        <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                        <h4 className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-cyan-400" /> 오늘 기록된 통계 요약 (AI 파싱)
                        </h4>
                        <div className="space-y-2 text-[11px] text-cyan-300/80 font-mono">
                          {apiResult.response.parsedToday.workout && apiResult.response.parsedToday.workout.length > 0 && (
                            <div className="flex items-start gap-2 bg-ink-950/20 p-2 rounded">
                              <Dumbbell className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-red-300">운동량 파싱됨:</div>
                                {apiResult.response.parsedToday.workout.map((w, idx) => (
                                  <div key={idx} className="mt-0.5">
                                    {w.label} ({w.bodyPart}) - {w.durationMinutes}분 (강도: {w.intensity})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {apiResult.response.parsedToday.study && apiResult.response.parsedToday.study.length > 0 && (
                            <div className="flex items-start gap-2 bg-ink-950/20 p-2 rounded">
                              <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-cyan-300">학습/공부 파싱됨:</div>
                                {apiResult.response.parsedToday.study.map((s, idx) => (
                                  <div key={idx} className="mt-0.5">
                                    {s.subject} {s.stage && `[${s.stage}]`} {s.topics && `(${s.topics.join(', ')})`} - {s.durationMinutes}분
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {apiResult.response.parsedToday.sleep && (
                            <div className="flex items-start gap-2 bg-ink-950/20 p-2 rounded">
                              <Moon className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-yellow-300">수면 파싱됨:</div>
                                <div>
                                  {apiResult.response.parsedToday.sleep.bedtime} ~ {apiResult.response.parsedToday.sleep.wakeTime} (시간: {apiResult.response.parsedToday.sleep.durationHours}h, 품질: {apiResult.response.parsedToday.sleep.quality})
                                </div>
                              </div>
                            </div>
                          )}
                          {apiResult.response.parsedToday.mood && (
                            <div className="flex items-start gap-2 bg-ink-950/20 p-2 rounded">
                              <Smile className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-pink-300">기분/멘탈 파싱됨:</div>
                                <div>
                                  점수: {apiResult.response.parsedToday.mood.score ?? '기록 없음'}, 내용: {apiResult.response.parsedToday.mood.moodText}
                                </div>
                              </div>
                            </div>
                          )}
                          {!apiResult.response.parsedToday.workout?.length &&
                           !apiResult.response.parsedToday.study?.length &&
                           !apiResult.response.parsedToday.sleep &&
                           !apiResult.response.parsedToday.mood && (
                             <p className="text-cyan-300/40 italic">파싱된 구조화 통계가 없습니다.</p>
                           )}
                        </div>
                      </div>

                      {/* 모호/불확실 항목 */}
                      <div className="panel corner-bracket p-4 space-y-3">
                        <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                        <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> 불확실한 기록 항목 (Uncertain)
                        </h4>
                        {apiResult.response.uncertain && apiResult.response.uncertain.length > 0 ? (
                          <div className="space-y-2 text-[11px] leading-relaxed">
                            {apiResult.response.uncertain.map((item, idx) => (
                              <div key={idx} className="bg-purple-950/15 border border-purple-500/10 p-2.5 rounded space-y-1">
                                <div className="font-bold text-purple-300">"{item.text}"</div>
                                <div className="text-cyan-300/70">이유: {item.reason}</div>
                                {item.suggestedClarification && (
                                  <div className="text-amber-300/90 font-semibold">💡 제안: {item.suggestedClarification}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-cyan-300/40 italic pt-2">불확실한 항목이 없습니다. 훌륭한 작성 상태입니다.</p>
                        )}
                      </div>
                    </div>

                    {/* 기존 루틴 라이브러리 조율 현황 */}
                    {dailyPlanData.baseQuestDecisions && dailyPlanData.baseQuestDecisions.length > 0 && (
                      <div className="panel corner-bracket p-5 space-y-4">
                        <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                        <h4 className="text-sm font-bold text-cyan-200 flex items-center gap-1.5">
                          <Brain className="w-4 h-4 text-cyan-400" /> 루틴 라이브러리 조율 현황
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3 text-xs">
                          {dailyPlanData.baseQuestDecisions.map((dec: any, i: number) => {
                            const decColorMap: Record<string, string> = {
                              keep: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
                              modify: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
                              skip: 'bg-red-500/10 border-red-500/20 text-red-300',
                              replace: 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                            }

                            return (
                              <div key={i} className="p-3 bg-ink-950/40 border border-cyan-400/5 rounded-md space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-cyan-200">{dec.title}</span>
                                  <span className={`text-[9px] px-2 py-0.5 rounded border font-mono font-bold ${decColorMap[dec.decision] || 'border-cyan-400/20'}`}>
                                    {dec.decision.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-[11px] text-cyan-300/60 leading-relaxed">{dec.reason}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* 생활 유지관리 판단 */}
                    {dailyPlanData.maintenanceDecisions && dailyPlanData.maintenanceDecisions.length > 0 && (
                      <div className="panel corner-bracket p-5 space-y-4">
                        <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                        <h4 className="text-sm font-bold text-cyan-200 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-cyan-400" /> 생활 유지관리(Maintenance) 처방 의사결정
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3 text-xs">
                          {dailyPlanData.maintenanceDecisions.map((dec: any, i: number) => {
                            const urgencyColorMap: Record<string, string> = {
                              high: 'text-red-400 bg-red-500/5 border-red-500/10',
                              medium: 'text-amber-400 bg-amber-500/5 border-amber-500/10',
                              low: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10',
                              unknown: 'text-zinc-400 bg-zinc-500/5 border-zinc-500/10'
                            }
                            const decisionColorMap: Record<string, string> = {
                              include: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
                              defer: 'bg-red-500/15 text-red-200 border-red-500/30',
                              ignore: 'bg-zinc-500/15 text-zinc-200 border-zinc-500/30'
                            }

                            return (
                              <div key={i} className="p-3 bg-ink-950/40 border border-cyan-400/5 rounded-md space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-cyan-200">{dec.label}</span>
                                  <div className="flex gap-1 text-[9px]">
                                    <span className={`px-1 rounded border ${urgencyColorMap[dec.urgency] || ''}`}>
                                      긴급: {dec.urgency.toUpperCase()}
                                    </span>
                                    <span className={`px-1 rounded border font-bold ${decisionColorMap[dec.decision] || ''}`}>
                                      {dec.decision === 'include' ? '포함' : dec.decision === 'defer' ? '미룸' : '무시'}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-cyan-300/60 leading-relaxed">{dec.reason}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* 스케줄/가용 시간 가정 */}
                    {dailyPlanData.scheduleAssumptions && dailyPlanData.scheduleAssumptions.length > 0 && (
                      <div className="panel corner-bracket p-5 space-y-4">
                        <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                        <h4 className="text-sm font-bold text-cyan-200 flex items-center gap-1.5">
                          <Moon className="w-4 h-4 text-cyan-400" /> 스케줄 가용 시간 및 가정사항
                        </h4>
                        <div className="space-y-2 text-xs">
                          {dailyPlanData.scheduleAssumptions.map((ass: any, i: number) => {
                            const impactColorMap: Record<string, string> = {
                              high: 'text-red-400 font-bold',
                              medium: 'text-amber-400 font-bold',
                              low: 'text-emerald-400 font-bold'
                            }

                            return (
                              <div key={i} className="flex items-start gap-2 bg-ink-950/20 p-2.5 rounded border border-cyan-400/5">
                                <div className="shrink-0 mt-0.5 text-cyan-400">🔹</div>
                                <div className="space-y-0.5">
                                  <div className="font-bold text-cyan-200">
                                    {ass.label} {ass.timeRange && <span className="text-[9px] text-cyan-300/50 font-mono">({ass.timeRange})</span>}
                                  </div>
                                  <p className="text-[11px] text-cyan-300/60 leading-relaxed">{ass.note}</p>
                                  <div className="text-[10px] text-cyan-300/40">
                                    가용량 영향도: <span className={impactColorMap[ass.impact] || ''}>{ass.impact.toUpperCase()}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* 메인 퀘스트 조정 제안 */}
                    {(Array.isArray(apiResult.response.mainGoalSuggestions) && apiResult.response.mainGoalSuggestions.length > 0) && (
                      <div className="panel corner-bracket p-5 space-y-4">
                        <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                        <h4 className="text-sm font-bold text-cyan-200 flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-cyan-400" /> 메인 목표 조정 제안 (제안 전용)
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {apiResult.response.mainGoalSuggestions.map((action: any) => (
                            <div key={action.id} className="p-3 border border-purple-500/10 bg-purple-950/5 rounded-md text-xs space-y-1">
                              <div className="font-bold text-purple-300 flex justify-between items-center">
                                <span>[메인 목표 제안] {action.title}</span>
                                <span className="text-[9px] px-1.5 py-0.5 border border-purple-400/20 bg-purple-500/15 rounded text-purple-300 font-normal">제안만 표시</span>
                              </div>
                              <p className="text-[11px] text-cyan-300/60">{action.description}</p>
                              <p className="text-[10px] text-amber-300/80 pt-1">이유: {action.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* JSON raw 보기 토글 */}
                    <div className="panel corner-bracket p-4 space-y-2 bg-slate-950/40">
                      <div className="tl" /> <div className="tr" /> <div className="bl" /> <div className="br" />
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setShowRawJson(!showRawJson)}
                          className="text-xs text-cyan-300/60 hover:text-cyan-200 flex items-center gap-1 focus:outline-none"
                        >
                          <span>분석 원본 JSON 데이터</span>
                          {showRawJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {showRawJson && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(JSON.stringify(apiResult.response, null, 2), setCopied)}
                            className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 bg-ink-950/60 px-2.5 py-1 border border-cyan-400/10 rounded"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300">복사 완료</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>JSON 복사</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      {showRawJson && (
                        <pre className="bg-ink-950/80 p-3 rounded text-[11px] text-cyan-200/80 overflow-x-auto font-mono max-h-60 border border-cyan-400/10">
                          {JSON.stringify(apiResult.response, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

