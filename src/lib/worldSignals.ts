import type { SecretProgressState, WorldSignalEntry, WorldSignalState } from './types'

export const WORLD_SIGNAL_TEMPLATES = {
  // Focus Session
  focus_resonance_faint: {
    id: 'focus_resonance_faint',
    source: 'focus' as const,
    tier: 'faint' as const,
    title: '미세한 공명',
    body: '현실의 집중 기록이 시스템 잔류 상태와 미세한 공명을 남겼습니다.',
    spoilerLevel: 0,
  },
  focus_resonance_clear: {
    id: 'focus_resonance_clear',
    source: 'focus' as const,
    tier: 'clear' as const,
    title: '집중 공명 반응',
    body: '현실 측정값과 게이트 심도가 같은 주파수로 흔들리는 현상이 관측됩니다.',
    spoilerLevel: 1,
  },
  focus_resonance_distorted: {
    id: 'focus_resonance_distorted',
    source: 'focus' as const,
    tier: 'distorted' as const,
    title: '비정상적인 관측값',
    body: '협회 관측 로그에 비정상적인 현실 집중 공명 주파수가 기록되었습니다.',
    spoilerLevel: 2,
  },
  focus_resonance_severe: {
    id: 'focus_resonance_severe',
    source: 'focus' as const,
    tier: 'severe' as const,
    title: '동기화 주파수 변동',
    body: '현실의 집중 파형이 게이트 내부 구조를 일시적으로 고정시키는 현상이 포착되었습니다.',
    spoilerLevel: 3,
  },

  // Red Gate
  red_gate_spawn: {
    id: 'red_gate_spawn',
    source: 'red_gate' as const,
    tier: 'faint' as const,
    title: '붉은 균열 감지',
    body: '붉은 문 너머의 신호가 이전보다 또렷하게 기록에 새겨지고 있습니다.',
    spoilerLevel: 1,
  },
  red_gate_clear: {
    id: 'red_gate_clear',
    source: 'red_gate' as const,
    tier: 'clear' as const,
    title: '균열 동기화 완료',
    body: '붉은 균열의 파형이 헌터 기록과 완전히 동기화되어 특수 로그로 전송되었습니다.',
    spoilerLevel: 1,
  },
  red_gate_pressure_spike: {
    id: 'red_gate_pressure_spike',
    source: 'red_gate' as const,
    tier: 'severe' as const,
    title: '게이트 붕괴 위험',
    body: '게이트 내부에서 협회에 정식 등록되지 않은 이질적인 주파수가 급증하고 있습니다.',
    spoilerLevel: 2,
  },
  red_gate_leak: {
    id: 'red_gate_leak',
    source: 'red_gate' as const,
    tier: 'distorted' as const,
    title: '이상 신호 누출',
    body: '문이 닫힌 뒤에도 잔류 게이트 관측값이 사라지지 않고 공중에 흔들립니다.',
    spoilerLevel: 2,
  },

  // Extraction
  extraction_fail_echo: {
    id: 'extraction_fail_echo',
    source: 'extraction' as const,
    tier: 'faint' as const,
    title: '그림자 잔향',
    body: '추출 실패의 잔향이 그림자 기록의 빈자리로 스며들었습니다.',
    spoilerLevel: 1,
  },
  extraction_boss_success: {
    id: 'extraction_boss_success',
    source: 'extraction' as const,
    tier: 'clear' as const,
    title: '미등록 서열 반응',
    body: '보스 그림자 추출 성공 이후, 군단 기록 내부에서 미등록 서열의 주파수가 감지되었습니다.',
    spoilerLevel: 2,
  },
  extraction_named_echo: {
    id: 'extraction_named_echo',
    source: 'extraction' as const,
    tier: 'severe' as const,
    title: '어둠의 서명',
    body: '그림자가 새로운 흔적을 공명하며, 이름을 부르기도 전에 주인을 인지하는 반응을 보입니다.',
    spoilerLevel: 3,
  },
  extraction_silence: {
    id: 'extraction_silence',
    source: 'extraction' as const,
    tier: 'distorted' as const,
    title: '그림자의 침묵',
    body: '아직 응답하지 않은 이름이 차가운 침묵의 잔향으로 기록에 남았습니다.',
    spoilerLevel: 1,
  },

  // Hunter Grade / Promotion
  promotion_exam_available: {
    id: 'promotion_exam_available',
    source: 'promotion' as const,
    tier: 'faint' as const,
    title: '비공개 평가 대기',
    body: '협회 승급 심사 대상자 평가표 일부가 비공개 특수 등급으로 이관 대기 중입니다.',
    spoilerLevel: 1,
  },
  promotion_exam_start: {
    id: 'promotion_exam_start',
    source: 'promotion' as const,
    tier: 'clear' as const,
    title: '심사 기록 이관',
    body: '승급 심사가 시작되며, 일반 평가 경로가 아닌 미확인 채널로 심사 결과가 복사되고 있습니다.',
    spoilerLevel: 1,
  },
  promotion_exam_clear: {
    id: 'promotion_exam_clear',
    source: 'promotion' as const,
    tier: 'clear' as const,
    title: '비공개 승급 동기화',
    body: '승급 심사 통과와 동시에 협회 메인프레임에 미확인 파형 동기화 기록이 추가되었습니다.',
    spoilerLevel: 2,
  },
  promotion_sealed_national: {
    id: 'promotion_sealed_national',
    source: 'promotion' as const,
    tier: 'sealed' as const,
    title: '권한 제한 항목',
    body: '국가권력급 심사 항목의 세부 조건 및 세부 판정표가 상위 보안 권한으로 봉인되었습니다.',
    spoilerLevel: 3,
  },

  // Shadow Expedition
  expedition_censor: {
    id: 'expedition_censor',
    source: 'expedition' as const,
    tier: 'sealed' as const,
    title: '자동 검열 기록',
    body: '원정 보고서의 마지막 문단이 협회 특수 보안 규정에 의해 자동으로 검열되었습니다.',
    spoilerLevel: 3,
  },
  expedition_coordinate_mismatch: {
    id: 'expedition_coordinate_mismatch',
    source: 'expedition' as const,
    tier: 'distorted' as const,
    title: '좌표 불일치',
    body: '정찰조가 지도에 존재하지 않는 동일한 위상 기하 좌표를 반복해서 보고했습니다.',
    spoilerLevel: 2,
  },
  expedition_shadow_gaze: {
    id: 'expedition_shadow_gaze',
    source: 'expedition' as const,
    tier: 'clear' as const,
    title: '그림자의 시선',
    body: '그림자 개체 중 하나가 명령 없이 특정 심도 너머를 오랫동안 바라보는 이상 행동을 보였습니다.',
    spoilerLevel: 1,
  },
  expedition_scout_find: {
    id: 'expedition_scout_find',
    source: 'expedition' as const,
    tier: 'clear' as const,
    title: '미확인 잔향 관측',
    body: '원정 정찰 헌터로부터 보고서 여백에 기록되지 않은 미확인 인장의 잔재가 전달되었습니다.',
    spoilerLevel: 2,
  },

  // Echo (전임자 흔적)
  echo_faint_footstep: {
    id: 'echo_faint_footstep',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '낯익은 발자취',
    body: '이곳의 공간 곡선이 이미 누군가에 의해 정밀하게 정돈되었던 흔적을 보여줍니다.',
    spoilerLevel: 0,
  },
  echo_faint_coordinates: {
    id: 'echo_faint_coordinates',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '비정상적 잔류 좌표',
    body: '차원 기하학적 분석기에 과거 소속이 불분명한 각성자의 이동 경로가 짧게 표시되었습니다.',
    spoilerLevel: 0,
  },
  echo_clear_predecessor: {
    id: 'echo_clear_predecessor',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '첫 번째 기록',
    body: '현재의 인장과 거의 완벽히 동일하지만, 수십 차례 이상 더 오래된 연대의 신호 기록이 검출되었습니다.',
    spoilerLevel: 1,
  },
  echo_distorted_reflection: {
    id: 'echo_distorted_reflection',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '어긋난 투영',
    body: '그림자의 심층 데이터 속에서 마치 나 자신을 바라보는 듯한 모순적인 피드백 신호가 감지됩니다.',
    spoilerLevel: 2,
  },
  echo_severe_angel_will: {
    id: 'echo_severe_angel_will',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '심판자의 잔향',
    body: '지고의 심판자가 방출하는 격막 신호 사이에 "나를 딛고 나아가라"는 메시지가 고정되어 흐릅니다.',
    spoilerLevel: 3,
  },
}

export type WorldSignalTemplateId = keyof typeof WORLD_SIGNAL_TEMPLATES

export const createInitialWorldSignalState = (): WorldSignalState => ({
  intensity: 0,
  discoveredSignalIds: [],
  counters: {
    focusResonance: 0,
    redGateContact: 0,
    extractionEcho: 0,
    promotionAuthority: 0,
    shadowExpeditionFindings: 0,
    realityPressureSpikes: 0,
    bossAnomalies: 0,
    echoDiscoveries: 0,
  },
  recentSignals: [],
})

export const ensureWorldSignalState = (state?: WorldSignalState): WorldSignalState => {
  const initial = createInitialWorldSignalState()
  if (!state) return initial
  
  // tower 관련 레거시 신호 및 발견 정보 안전 필터링
  const filteredDiscovered = Array.isArray(state.discoveredSignalIds)
    ? state.discoveredSignalIds.filter(id => id !== 'tower_anomaly' && id !== 'tower_boss_anomaly' && id in WORLD_SIGNAL_TEMPLATES)
    : initial.discoveredSignalIds

  const filteredRecent = Array.isArray(state.recentSignals)
    ? (state.recentSignals as any[]).filter(s => s.source !== 'tower' && s.id !== 'tower_anomaly' && s.id !== 'tower_boss_anomaly' && s.id in WORLD_SIGNAL_TEMPLATES)
    : initial.recentSignals

  return {
    intensity: typeof state.intensity === 'number' ? state.intensity : initial.intensity,
    discoveredSignalIds: filteredDiscovered,
    counters: {
      focusResonance: state.counters?.focusResonance ?? initial.counters.focusResonance,
      redGateContact: state.counters?.redGateContact ?? initial.counters.redGateContact,
      extractionEcho: state.counters?.extractionEcho ?? initial.counters.extractionEcho,
      promotionAuthority: state.counters?.promotionAuthority ?? initial.counters.promotionAuthority,
      shadowExpeditionFindings: state.counters?.shadowExpeditionFindings ?? initial.counters.shadowExpeditionFindings,
      realityPressureSpikes: state.counters?.realityPressureSpikes ?? initial.counters.realityPressureSpikes,
      bossAnomalies: state.counters?.bossAnomalies ?? initial.counters.bossAnomalies,
      echoDiscoveries: state.counters?.echoDiscoveries ?? initial.counters.echoDiscoveries,
    },
    lastSignalAt: state.lastSignalAt ?? initial.lastSignalAt,
    recentSignals: filteredRecent,
  }
}

/**
 * Checks if a world signal should be emitted based on cooling and caps.
 */
export const shouldEmitWorldSignal = (
  state: WorldSignalState,
  templateId: WorldSignalTemplateId
): boolean => {
  const template = WORLD_SIGNAL_TEMPLATES[templateId]
  if (!template) return false

  // Major signals (spoiler level >= 2) bypass daily caps and cooldowns
  const isMajor = template.spoilerLevel >= 2

  // 1. Duplicate Prevention: same ID consecutive
  const lastSignal = state.recentSignals[0]
  if (lastSignal && lastSignal.id === templateId) {
    return false
  }

  if (!isMajor) {
    // 2. Cooldown by Source: check if any signal from the same source occurred within 120 seconds
    const now = Date.now()
    const sameSourceSignals = state.recentSignals.filter(s => s.source === template.source)
    if (sameSourceSignals.length > 0) {
      const lastSourceTime = Math.max(...sameSourceSignals.map(s => s.at))
      if (now - lastSourceTime < 120000) {
        return false // cooldown active
      }
    }

    // 3. Daily Cap: Max 3 minor signals per 24 hours
    const last24hCount = state.recentSignals.filter(s => {
      const sTemplate = WORLD_SIGNAL_TEMPLATES[s.id as WorldSignalTemplateId]
      const sSpoiler = sTemplate ? sTemplate.spoilerLevel : 0
      return sSpoiler < 2 && (now - s.at < 24 * 60 * 60 * 1000)
    }).length

    if (last24hCount >= 3) {
      return false // Daily cap exceeded
    }
  }

  return true
}

/**
 * Creates and appends a new signal, updates intensity and counters.
 */
export const emitWorldSignal = (
  secretState: SecretProgressState,
  templateId: WorldSignalTemplateId
): { progress: SecretProgressState; signal: WorldSignalEntry | null } => {
  const progress = { ...secretState }
  const wsState = ensureWorldSignalState(progress.worldSignals)

  if (!shouldEmitWorldSignal(wsState, templateId)) {
    progress.worldSignals = wsState
    return { progress, signal: null }
  }

  const template = WORLD_SIGNAL_TEMPLATES[templateId]
  const now = Date.now()

  const entry: WorldSignalEntry = {
    id: template.id,
    at: now,
    source: template.source,
    tier: template.tier,
    title: template.title,
    body: template.body,
    spoilerLevel: template.spoilerLevel,
    seen: false,
  }

  // Update counters
  const nextCounters = { ...wsState.counters }
  if (template.source === 'focus') nextCounters.focusResonance++
  else if (template.source === 'red_gate') nextCounters.redGateContact++
  else if (template.source === 'extraction') nextCounters.extractionEcho++
  else if (template.source === 'promotion') nextCounters.promotionAuthority++
  else if (template.source === 'expedition') nextCounters.shadowExpeditionFindings++
  else if ((template.source as any) === 'boss' || (template.source as any) === 'tower') nextCounters.bossAnomalies++
  else if ((template.source as any) === 'echo') nextCounters.echoDiscoveries++

  // Update intensity: faint gives 1, clear gives 3, distorted/severe gives 5, sealed gives 7. Cap at 100.
  let intensityBonus = 1
  if (template.tier === 'clear') intensityBonus = 3
  else if (template.tier === 'distorted' || template.tier === 'severe') intensityBonus = 5
  else if (template.tier === 'sealed') intensityBonus = 7

  const nextIntensity = Math.min(100, wsState.intensity + intensityBonus)
  const nextDiscovered = wsState.discoveredSignalIds.includes(templateId)
    ? wsState.discoveredSignalIds
    : [...wsState.discoveredSignalIds, templateId]

  // Add to recent signals and trim to last 30 entries
  const nextRecent = [entry, ...wsState.recentSignals].slice(0, 30)

  progress.worldSignals = {
    intensity: nextIntensity,
    discoveredSignalIds: nextDiscovered,
    counters: nextCounters,
    lastSignalAt: now,
    recentSignals: nextRecent,
  }

  return { progress, signal: entry }
}

/**
 * Filter visible signals according to user's current maximum allowed spoiler level.
 */
export const getVisibleWorldSignals = (
  secretState: SecretProgressState | undefined,
  maxSpoilerLevel = 2
): WorldSignalEntry[] => {
  if (!secretState || !secretState.worldSignals) return []
  const wsState = ensureWorldSignalState(secretState.worldSignals)
  return wsState.recentSignals.filter(s => s.spoilerLevel <= maxSpoilerLevel)
}

/**
 * Returns a brief summary of today's signals for AI Coach context (avoiding direct spoilers)
 */
export const getWorldSignalSummaryForAiCoach = (
  secretState: SecretProgressState | undefined
): {
  todayWorldSignalCount: number
  recentWorldSignalTier: string
  focusResonanceSignal: boolean
  redGateSignalObserved: boolean
  extractionEchoObserved: boolean
  promotionSealedRecordObserved: boolean
} => {
  const result = {
    todayWorldSignalCount: 0,
    recentWorldSignalTier: 'faint',
    focusResonanceSignal: false,
    redGateSignalObserved: false,
    extractionEchoObserved: false,
    promotionSealedRecordObserved: false,
  }

  if (!secretState || !secretState.worldSignals) return result
  const wsState = ensureWorldSignalState(secretState.worldSignals)
  const now = Date.now()

  const todaySignals = wsState.recentSignals.filter(s => now - s.at < 24 * 60 * 60 * 1000)
  result.todayWorldSignalCount = todaySignals.length

  if (todaySignals.length > 0) {
    // Pick the highest tier observed today
    const tiers = todaySignals.map(s => s.tier)
    if (tiers.includes('sealed')) result.recentWorldSignalTier = 'sealed'
    else if (tiers.includes('severe')) result.recentWorldSignalTier = 'severe'
    else if (tiers.includes('distorted')) result.recentWorldSignalTier = 'distorted'
    else if (tiers.includes('clear')) result.recentWorldSignalTier = 'clear'
  }

  // Set boolean indicators based on today's sources
  todaySignals.forEach(s => {
    if (s.source === 'focus') result.focusResonanceSignal = true
    if (s.source === 'red_gate') result.redGateSignalObserved = true
    if (s.source === 'extraction') result.extractionEchoObserved = true
    if (s.source === 'promotion') result.promotionSealedRecordObserved = true
  })

  return result
}
