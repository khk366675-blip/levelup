import { NormalizedCalendarEvent, AiCoachScheduleSummary } from './aiCoachTypes'

/**
 * 캘린더 이벤트 명칭을 마스킹하여 반환합니다.
 */
function maskTitle(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('수업') || t.includes('강의') || t.includes('class') || t.includes('lecture')) {
    return '수업'
  }
  if (t.includes('과외') || t.includes('tutoring')) {
    return '과외'
  }
  if (t.includes('회의') || t.includes('미팅') || t.includes('meeting') || t.includes('업무') || t.includes('work') || t.includes('알바')) {
    return '업무 일정'
  }
  if (t.includes('병원') || t.includes('치과') || t.includes('예약') || t.includes('appointment')) {
    return '예약 일정'
  }
  if (t.includes('약속') || t.includes('식사') || t.includes('dinner') || t.includes('lunch') || t.includes('meet') || t.includes('약속')) {
    return '개인 약속'
  }
  return '개인 일정'
}

/**
 * 이벤트의 카테고리를 추정합니다.
 */
function estimateCategory(title: string): 'class' | 'tutoring' | 'work' | 'appointment' | 'personal' | 'unknown' {
  const t = title.toLowerCase()
  if (t.includes('수업') || t.includes('강의') || t.includes('class') || t.includes('lecture')) {
    return 'class'
  }
  if (t.includes('과외') || t.includes('tutoring')) {
    return 'tutoring'
  }
  if (t.includes('회의') || t.includes('미팅') || t.includes('meeting') || t.includes('업무') || t.includes('work') || t.includes('알바')) {
    return 'work'
  }
  if (t.includes('병원') || t.includes('치과') || t.includes('예약') || t.includes('appointment')) {
    return 'appointment'
  }
  return 'personal'
}

/**
 * HH:MM 형식의 시간 문자열을 하루 중 분(minute)으로 변환합니다.
 */
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

/**
 * 하루 중 분(minute)을 HH:MM 형식의 시간 문자열로 변환합니다.
 */
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * 캘린더 이벤트와 수동 메모를 조합하여 AI 코치용 스케줄 요약을 빌드합니다.
 */
export function generateScheduleSummary(
  targetDateStr: string, // YYYY-MM-DD
  events: NormalizedCalendarEvent[],
  manualScheduleMemo?: string,
  options: {
    maskEventTitles: boolean
    dayStartHour?: number
    dayEndHour?: number
    includeLocations?: boolean
  } = { maskEventTitles: true }
): AiCoachScheduleSummary {
  const dayStartHour = options.dayStartHour ?? 7
  const dayEndHour = options.dayEndHour ?? 23
  const dayStartMins = dayStartHour * 60
  const dayEndMins = dayEndHour * 60

  const summaryNotes: string[] = []

  // 1. Google 캘린더 이벤트가 없을 경우 -> 수동 일정 fallback 작동
  if (events.length === 0) {
    if (manualScheduleMemo && manualScheduleMemo.trim()) {
      return {
        date: targetDateStr,
        source: 'manualText',
        busyBlocks: [],
        freeBlocks: [],
        estimatedAvailableMinutes: undefined,
        dayLoad: 'unknown',
        notes: [manualScheduleMemo.trim()]
      }
    }

    return {
      date: targetDateStr,
      source: 'none',
      busyBlocks: [],
      freeBlocks: [],
      estimatedAvailableMinutes: undefined,
      dayLoad: 'unknown',
      notes: ['내일 등록된 일정이 없습니다.']
    }
  }

  // 2. Google 캘린더 이벤트 가공 시작
  const busyBlocks: any[] = []
  const intervals: [number, number][] = []

  events.forEach(event => {
    // 종일 일정 처리
    if (event.allDay) {
      busyBlocks.push({
        title: options.maskEventTitles ? '종일 일정' : event.title,
        start: '00:00',
        end: '24:00',
        category: 'personal'
      })
      intervals.push([dayStartMins, dayEndMins]) // 하루 전체 차지
      return
    }

    // 시간 부분 파싱
    try {
      const startDate = new Date(event.start)
      const endDate = new Date(event.end)

      const startH = startDate.getHours()
      const startM = startDate.getMinutes()
      const endH = endDate.getHours()
      const endM = endDate.getMinutes()

      const startMinOfDay = startH * 60 + startM
      const endMinOfDay = endH * 60 + endM

      busyBlocks.push({
        title: options.maskEventTitles ? maskTitle(event.title) : event.title,
        start: minutesToTime(startMinOfDay),
        end: minutesToTime(endMinOfDay),
        category: estimateCategory(event.title)
      })

      // 하루 가용 범위 내로 클램핑하여 intervals에 추가
      const clampStart = Math.max(dayStartMins, startMinOfDay)
      const clampEnd = Math.min(dayEndMins, endMinOfDay)
      if (clampEnd > clampStart) {
        intervals.push([clampStart, clampEnd])
      }
    } catch (e) {
      // 파싱 실패 시 무시
    }
  })

  // 3. 겹치는 Busy intervals 정렬 및 병합
  intervals.sort((a, b) => a[0] - b[0])
  const mergedIntervals: [number, number][] = []
  if (intervals.length > 0) {
    let current = intervals[0]
    for (let i = 1; i < intervals.length; i++) {
      const next = intervals[i]
      if (next[0] <= current[1]) {
        current[1] = Math.max(current[1], next[1])
      } else {
        mergedIntervals.push(current)
        current = next
      }
    }
    mergedIntervals.push(current)
  }

  // 4. Free blocks 계산
  const freeBlocks: any[] = []
  let currentStart = dayStartMins

  mergedIntervals.forEach(interval => {
    if (interval[0] > currentStart) {
      const diff = interval[0] - currentStart
      if (diff >= 30) { // 30분 이상인 경우에만 가용한 자유 블록으로 간주
        freeBlocks.push({
          start: minutesToTime(currentStart),
          end: minutesToTime(interval[0]),
          quality: diff >= 90 ? 'deepWork' : currentStart >= 20 * 60 ? 'light' : 'unknown'
        })
      }
    }
    currentStart = Math.max(currentStart, interval[1])
  })

  if (dayEndMins > currentStart) {
    const diff = dayEndMins - currentStart
    if (diff >= 30) {
      freeBlocks.push({
        start: minutesToTime(currentStart),
        end: minutesToTime(dayEndMins),
        quality: diff >= 90 ? 'deepWork' : currentStart >= 20 * 60 ? 'light' : 'unknown'
      })
    }
  }

  // 5. 가용 분 합산
  let estimatedAvailableMinutes = 0
  freeBlocks.forEach(fb => {
    const startM = timeToMinutes(fb.start)
    const endM = timeToMinutes(fb.end)
    estimatedAvailableMinutes += (endM - startM)
  })

  // 6. dayLoad 계산
  let totalBusyMins = 0
  mergedIntervals.forEach(int => {
    totalBusyMins += (int[1] - int[0])
  })

  const dayTotalMins = dayEndMins - dayStartMins
  let dayLoad: 'light' | 'medium' | 'heavy' | 'unknown' = 'unknown'

  if (totalBusyMins >= dayTotalMins * 0.5) {
    dayLoad = 'heavy'
  } else if (totalBusyMins < 120 && freeBlocks.some(fb => fb.quality === 'deepWork')) {
    dayLoad = 'light'
  } else {
    dayLoad = 'medium'
  }

  // 7. 요약 노트(notes) 작성
  const deepWorkBlocks = freeBlocks.filter(fb => fb.quality === 'deepWork')
  if (dayLoad === 'heavy') {
    summaryNotes.push('내일은 고정 일정이 매우 빡빡하여 피로 관리가 최우선입니다.')
  } else if (deepWorkBlocks.length >= 2) {
    summaryNotes.push(`몰입 가능한 긴 집중 블록(${deepWorkBlocks.length}개)이 확보된 효율적인 날입니다.`)
  } else if (freeBlocks.length === 0) {
    summaryNotes.push('내일은 활동 가능한 여유 시간이 극히 부족합니다. 가벼운 루틴만 권장합니다.')
  } else {
    summaryNotes.push('내일은 적당한 가용 시간과 고정 일정이 공존합니다.')
  }

  // 수동 메모가 같이 있다면 노트에 병합해 준다
  if (manualScheduleMemo && manualScheduleMemo.trim()) {
    summaryNotes.push(`[수동 추가 메모]: ${manualScheduleMemo.trim()}`)
  }

  return {
    date: targetDateStr,
    source: 'googleCalendar',
    busyBlocks,
    freeBlocks,
    estimatedAvailableMinutes,
    dayLoad,
    notes: summaryNotes
  }
}
