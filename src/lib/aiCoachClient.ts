import { AiCoachResponse } from './aiCoachTypes'

// 사용할 Gemini 모델 상수
export const GEMINI_MODEL = 'gemini-2.5-flash'

export type AiCoachApiResult =
  | { ok: true; response: AiCoachResponse; rawText: string }
  | { ok: false; error: string; rawText?: string; prompt?: string }

/**
 * 텍스트 데이터로부터 JSON 객체 형태만을 안전하게 추출합니다.
 * 마크다운 코드 블록(```json ... ```)이나 불필요한 서술 문구가 섞여 있어도
 * 첫 '{'와 마지막 '}'를 기준으로 잘라내어 파싱을 시도합니다.
 */
export function extractJsonObjectFromText(text: string): unknown {
  let cleanText = text.trim()

  // 1. 마크다운 ```json ... ``` 코드블록 제거
  const mdJsonRegex = /```json\s*([\s\S]*?)\s*```/
  const jsonMatch = cleanText.match(mdJsonRegex)
  if (jsonMatch && jsonMatch[1]) {
    cleanText = jsonMatch[1].trim()
  } else {
    // 2. 일반 마크다운 ``` ... ``` 코드블록 제거
    const mdRegex = /```\s*([\s\S]*?)\s*```/
    const genericMatch = cleanText.match(mdRegex)
    if (genericMatch && genericMatch[1]) {
      cleanText = genericMatch[1].trim()
    }
  }

  // 3. 첫 '{'와 마지막 '}' 사이 영역만 잘라내기
  const startIdx = cleanText.indexOf('{')
  const endIdx = cleanText.lastIndexOf('}')
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleanText = cleanText.slice(startIdx, endIdx + 1)
  }

  return JSON.parse(cleanText)
}

/**
 * 파싱된 JSON 객체가 AiCoachResponse 타입 스키마를 준수하는지 간단히 수동 검증합니다.
 */
export function validateAiCoachResponse(value: any): AiCoachResponse | null {
  if (!value || typeof value !== 'object') return null

  // 필수 속성 존재 여부 및 타입 체크
  if (!value.parsedToday || typeof value.parsedToday !== 'object') return null
  if (!value.coachSummary || typeof value.coachSummary !== 'object') return null
  if (!Array.isArray(value.domainCoaches)) return null
  if (!Array.isArray(value.recommendedActions)) return null

  // 세부 필수 서브 속성 체크
  const summary = value.coachSummary
  if (!summary.overallCondition || !summary.tomorrowStrategy || !summary.loadRecommendation) {
    return null
  }

  // dailyPlan 검증 (존재하는 경우)
  if (value.dailyPlan) {
    const plan = value.dailyPlan
    if (typeof plan !== 'object') return null
    if (!Array.isArray(plan.quests)) return null
    if (!Array.isArray(plan.baseQuestDecisions)) return null
  }

  return value as AiCoachResponse
}

/**
 * Gemini API를 fetch를 이용해 직접 호출합니다.
 * API key가 설정되어 있지 않거나 에러 발생 시 명확하고 친절한 메시지를 반환합니다.
 */
export async function callAiCoachApi(prompt: string): Promise<AiCoachApiResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey || apiKey.trim() === '') {
    return {
      ok: false,
      error: 'VITE_GEMINI_API_KEY가 설정되지 않았습니다. Google AI Studio에서 API 키를 발급받아 .env.local에 설정해 주세요.',
      prompt,
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      const status = response.status
      let errorMsg = `API 요청 실패 (HTTP ${status})`
      try {
        const errorJson = await response.json()
        if (errorJson?.error?.message) {
          errorMsg = `${errorMsg}: ${errorJson.error.message}`
        }
      } catch {
        // 응답 본문 파싱 실패 시 기본 에러명 사용
      }

      // 상태별 사용자 메시지 세분화
      if (status === 401 || status === 403) {
        errorMsg = `API 인증 실패 (HTTP ${status}): 유효하지 않거나 만료된 Gemini API Key입니다. 키 설정을 재확인해 주세요.`
      } else if (status === 429) {
        errorMsg = 'API 호출 제한 초과 (HTTP 429): Quota(할당량)를 초과했거나 과도한 요청이 발생했습니다. 잠시 후 다시 시도해 주세요.'
      }

      return {
        ok: false,
        error: errorMsg,
        prompt,
      }
    }

    const data = await response.json()
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawText) {
      return {
        ok: false,
        error: 'Gemini 응답 내용이 비어 있습니다. 잠시 후 다시 시도해 주세요.',
        prompt,
      }
    }

    try {
      const parsedJson = extractJsonObjectFromText(rawText)
      const validatedResponse = validateAiCoachResponse(parsedJson)

      if (!validatedResponse) {
        return {
          ok: false,
          error: 'AI가 반환한 데이터가 필요한 JSON 형식 규격을 충족하지 않습니다.',
          rawText,
          prompt,
        }
      }

      return {
        ok: true,
        response: validatedResponse,
        rawText,
      }
    } catch (parseError: any) {
      return {
        ok: false,
        error: `AI 응답 JSON 파싱 실패: ${parseError?.message || parseError}. 프롬프트 복사 모드로 시도하거나 기록을 다시 다듬어 분석해 보세요.`,
        rawText,
        prompt,
      }
    }
  } catch (netError: any) {
    return {
      ok: false,
      error: `네트워크 에러: API 서버에 연결할 수 없습니다. 인터넷 상태를 확인해 주세요. (${netError?.message || netError})`,
      prompt,
    }
  }
}
