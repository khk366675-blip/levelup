export interface MonarchVisualEffect {
  monarchId: string
  displayName: string
  theme: string
  paletteName: string
  fieldClass: string
  auraClass: string
  telegraphClass: string
  particleClass: string
  backgroundMotif: string
  primaryColor: string
  glowColor: string
}

// 8명의 군주 + 최종 지고의 심판자(Angel)에 대한 전용 2.5D 시각 연출 메타데이터 매핑
export const MONARCH_VISUAL_EFFECTS: Record<string, MonarchVisualEffect> = {
  grellic: {
    monarchId: 'grellic',
    displayName: '부패의 모왕 그렐릭',
    theme: 'decay',
    paletteName: '녹갈색 부패',
    fieldClass: 'monarch-field-grellic',
    auraClass: 'monarch-aura-grellic',
    telegraphClass: 'monarch-telegraph-grellic',
    particleClass: 'monarch-particle-grellic',
    backgroundMotif: '🐛 부패의 충만',
    primaryColor: '#16a34a', // 녹색
    glowColor: 'rgba(22,163,74,0.3)',
  },
  celaide: {
    monarchId: 'celaide',
    displayName: '빙결의 여군주 셀라이드',
    theme: 'frost',
    paletteName: '차가운 서리 푸른색',
    fieldClass: 'monarch-field-celaide',
    auraClass: 'monarch-aura-celaide',
    telegraphClass: 'monarch-telegraph-celaide',
    particleClass: 'monarch-particle-celaide',
    backgroundMotif: '❄️ 한기의 쇄도',
    primaryColor: '#38bdf8', // 스카이블루
    glowColor: 'rgba(56,189,248,0.35)',
  },
  igris: {
    monarchId: 'igris',
    displayName: '백염의 군주 이그리스',
    theme: 'whiteflame',
    paletteName: '순백/오렌지 백염',
    fieldClass: 'monarch-field-igris',
    auraClass: 'monarch-aura-igris',
    telegraphClass: 'monarch-telegraph-igris',
    particleClass: 'monarch-particle-igris',
    backgroundMotif: '🔥 백염의 춤사위',
    primaryColor: '#fed7aa', // 연황색/백염
    glowColor: 'rgba(254,215,170,0.4)',
  },
  dorga: {
    monarchId: 'dorga',
    displayName: '강철의 패왕 도르가',
    theme: 'steel',
    paletteName: '메탈릭 실버 회색',
    fieldClass: 'monarch-field-dorga',
    auraClass: 'monarch-aura-dorga',
    telegraphClass: 'monarch-telegraph-dorga',
    particleClass: 'monarch-particle-dorga',
    backgroundMotif: '🛡️ 무쇠의 철벽',
    primaryColor: '#94a3b8', // 청동회색
    glowColor: 'rgba(148,163,184,0.3)',
  },
  mirage: {
    monarchId: 'mirage',
    displayName: '환영의 군주 미라쥬',
    theme: 'mirage',
    paletteName: '아지랑이 보랏빛',
    fieldClass: 'monarch-field-mirage',
    auraClass: 'monarch-aura-mirage',
    telegraphClass: 'monarch-telegraph-mirage',
    particleClass: 'monarch-particle-mirage',
    backgroundMotif: '🌀 신기루 환각',
    primaryColor: '#c084fc', // 연보라
    glowColor: 'rgba(192,132,252,0.35)',
  },
  pesta: {
    monarchId: 'pesta',
    displayName: '역병의 대공 페스타',
    theme: 'plague',
    paletteName: '자줏빛 역병 포자',
    fieldClass: 'monarch-field-pesta',
    auraClass: 'monarch-aura-pesta',
    telegraphClass: 'monarch-telegraph-pesta',
    particleClass: 'monarch-particle-pesta',
    backgroundMotif: '☣️ 자줏빛 균사 포자',
    primaryColor: '#d946ef', // 마젠타/자색
    glowColor: 'rgba(217,70,239,0.35)',
  },
  belatus: {
    monarchId: 'belatus',
    displayName: '폭풍의 군주 벨라투스',
    theme: 'gale',
    paletteName: '사선 바람 칼날 하늘색',
    fieldClass: 'monarch-field-belatus',
    auraClass: 'monarch-aura-belatus',
    telegraphClass: 'monarch-telegraph-belatus',
    particleClass: 'monarch-particle-belatus',
    backgroundMotif: '🌪️ 질풍의 폭사',
    primaryColor: '#22d3ee', // 시안
    glowColor: 'rgba(34,211,238,0.4)',
  },
  nox: {
    monarchId: 'nox',
    displayName: '공허의 절대자 녹스',
    theme: 'void',
    paletteName: '심연 칠흑 암자색',
    fieldClass: 'monarch-field-nox',
    auraClass: 'monarch-aura-nox',
    telegraphClass: 'monarch-telegraph-nox',
    particleClass: 'monarch-particle-nox',
    backgroundMotif: '🪐 공허의 절대 특이점',
    primaryColor: '#8b5cf6', // 퍼플
    glowColor: 'rgba(139,92,246,0.5)',
  },
  angel: {
    monarchId: 'angel',
    displayName: '지고의 심판자',
    theme: 'divine',
    paletteName: '찬란한 신성 황금색',
    fieldClass: 'monarch-field-angel',
    auraClass: 'monarch-aura-angel',
    telegraphClass: 'monarch-telegraph-angel',
    particleClass: 'monarch-particle-angel',
    backgroundMotif: '🕊️ 심판의 성소',
    primaryColor: '#fbbf24', // 황금
    glowColor: 'rgba(251,191,36,0.45)',
  },
}

// 해당 sourceId(또는 대소문자 무관 ID)가 군주 비주얼 대상인지 여부
export function isMonarchVisualBoss(sourceId?: string): boolean {
  if (!sourceId) return false
  const key = sourceId.toLowerCase()
  return Object.prototype.hasOwnProperty.call(MONARCH_VISUAL_EFFECTS, key)
}

// 군주 고유 비주얼 효과 정보 조회 (안전 fallback 제공)
export function getMonarchVisualEffect(sourceId?: string): MonarchVisualEffect | undefined {
  if (!sourceId) return undefined
  const key = sourceId.toLowerCase()
  return MONARCH_VISUAL_EFFECTS[key]
}

// 군주 전용 필드 클래스 매핑 헬퍼
export function getMonarchFieldClass(sourceId?: string, phase: number = 1): string {
  const fx = getMonarchVisualEffect(sourceId)
  if (!fx) return ''
  return `${fx.fieldClass} monarch-phase-${phase}`
}

// 군주 전용 아우라 클래스 매핑 헬퍼
export function getMonarchAuraClass(sourceId?: string, phase: number = 1): string {
  const fx = getMonarchVisualEffect(sourceId)
  if (!fx) return ''
  return `${fx.auraClass} monarch-aura-phase-${phase}`
}
