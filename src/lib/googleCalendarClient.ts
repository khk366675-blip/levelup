import { NormalizedCalendarEvent, CalendarFetchResult } from './aiCoachTypes'

let tokenClient: any = null

/**
 * Google Identity Services Script를 브라우저에 동적으로 로드합니다.
 */
export function loadGoogleGsiScript(): Promise<boolean> {
  return new Promise((resolve) => {
    // 이미 로드되었는지 확인
    if ((window as any).google?.accounts?.oauth2) {
      resolve(true)
      return
    }

    // 이미 script 태그가 있는지 확인
    const existingScript = document.getElementById('google-gsi-client')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true))
      existingScript.addEventListener('error', () => resolve(false))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.id = 'google-gsi-client'
    script.async = true
    script.defer = true
    script.onload = () => {
      resolve(true)
    }
    script.onerror = () => {
      resolve(false)
    }
    document.head.appendChild(script)
  })
}

/**
 * Google Identity Services Token Client를 이용해 캘린더 읽기 권한을 요청합니다.
 * Access Token을 반환하는 Promise를 리턴합니다.
 */
export function requestCalendarAccess(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!clientId) {
      reject(new Error('VITE_GOOGLE_CLIENT_ID 환경변수가 설정되지 않았습니다. .env.local 설정을 확인해 주세요.'))
      return
    }

    const loaded = await loadGoogleGsiScript()
    if (!loaded) {
      reject(new Error('Google Identity Services 스크립트 로드에 실패했습니다. 네트워크 상태를 확인하세요.'))
      return
    }

    try {
      const google = (window as any).google
      
      // Token Client 초기화 및 권한 요청 (쓰기 권한 금지)
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(`권한 부여 실패: ${response.error_description || response.error}`))
            return
          }
          if (response.access_token) {
            resolve(response.access_token)
          } else {
            reject(new Error('Access Token을 획득하지 못했습니다.'))
          }
        },
        error_callback: (err: any) => {
          reject(new Error(`OAuth 오류: ${err.message || '인증 과정에서 실패가 발생했습니다.'}`))
        }
      })

      // 팝업 요청
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } catch (e: any) {
      reject(new Error(`Google 인증 초기화 오류: ${e.message || e}`))
    }
  })
}

/**
 * 구글 캘린더 REST API를 호출하여 일정 범위 내의 이벤트 목록을 불러옵니다.
 */
export async function fetchCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarFetchResult> {
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.searchParams.append('timeMin', timeMin)
  url.searchParams.append('timeMax', timeMax)
  url.searchParams.append('singleEvents', 'true')
  url.searchParams.append('orderBy', 'startTime')
  url.searchParams.append('maxResults', '50')

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errText = await response.text()
      let parsedErr: any
      try { parsedErr = JSON.parse(errText) } catch { }
      const msg = parsedErr?.error?.message || `HTTP ${response.status}`
      return { ok: false, error: `캘린더 API 호출 에러: ${msg}` }
    }

    const data = await response.json()
    const rawEvents = data.items || []

    const normalizedEvents: NormalizedCalendarEvent[] = rawEvents.map((item: any) => {
      const allDay = !item.start?.dateTime
      const start = allDay ? item.start?.date : item.start?.dateTime
      const end = allDay ? item.end?.date : item.end?.dateTime
      return {
        id: item.id || Math.random().toString(),
        title: item.summary || '제목 없음',
        start: start || '',
        end: end || '',
        allDay,
        location: item.location || undefined,
      }
    })

    return { ok: true, events: normalizedEvents }
  } catch (err: any) {
    return { ok: false, error: `네트워크 에러: ${err.message || err}` }
  }
}
