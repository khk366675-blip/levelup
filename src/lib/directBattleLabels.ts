export const DIRECT_BATTLE_ENCOUNTER_LABELS_KO: Record<string, string> = {
  small_bruiser: '소형 전투: 난폭한 적 1체',
  small_duo: '소형 2인조: 난폭한 적 + 하수인',
  caster_pair: '시전자 조합: 전위 + 주문형 적',
  tank_assassin: '방패와 암살자: 탱커 + 빠른 적',
  control_support: '방해 지원 조합: 제어형 + 지원형',
  boss_minion: '보스 조합: 보스 + 하수인',
  boss_support: '보스 지원 조합: 보스 + 지원 하수인',
}

export const DIRECT_BATTLE_ENCOUNTER_SHORT_LABELS_KO: Record<string, string> = {
  small_bruiser: '난폭한 적',
  small_duo: '2인조',
  caster_pair: '시전자 조합',
  tank_assassin: '탱커+암살자',
  control_support: '제어+지원',
  boss_minion: '보스+하수인',
  boss_support: '보스+지원',
}

export const DIRECT_BATTLE_DIFFICULTY_LABELS_KO: Record<string, string> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
  boss: '보스',
}

export const DIRECT_BATTLE_LESSON_LABELS_KO: Record<string, string> = {
  small_bruiser: '전열 목표 압박과 기본 행동 순서 확인',
  small_duo: '튼튼한 적과 하수인 사이의 목표 우선순위 확인',
  caster_pair: '전열 압박을 받는 동안 후열 주문형 적을 차단하거나 빠르게 처치하는 흐름 확인',
  tank_assassin: '방어 행동의 가치와 낮은 HP 대상 압박 확인',
  control_support: '지원형 적 차단과 제어형 적 우선 처리 확인',
  boss_minion: '보스 압박 중 하수인 처리 우선순위 확인',
  boss_support: '보스 압박과 지원 하수인 차단 흐름 확인',
}

export const DIRECT_BATTLE_ROLE_LABELS_KO: Record<string, string> = {
  hunter: '헌터',
  shadow: '그림자',
  bruiser: '난폭형',
  tank: '탱커',
  caster: '시전자',
  assassin: '암살형',
  support: '지원형',
  controller: '제어형',
  minion: '하수인',
  boss: '보스',
}

export function getDirectBattleEncounterLabelKo(encounterKey: string): string {
  const encounter = DIRECT_BATTLE_MOCK_ENCOUNTERS.find(item => item.encounterKey === encounterKey)
  return DIRECT_BATTLE_ENCOUNTER_LABELS_KO[encounterKey] ?? encounter?.labelKo ?? encounter?.label ?? encounterKey
}

export function getDirectBattleEncounterShortLabelKo(encounterKey: string): string {
  const encounter = DIRECT_BATTLE_MOCK_ENCOUNTERS.find(item => item.encounterKey === encounterKey)
  return DIRECT_BATTLE_ENCOUNTER_SHORT_LABELS_KO[encounterKey] ?? encounter?.labelKo ?? getDirectBattleEncounterLabelKo(encounterKey)
}

export function getDirectBattleDifficultyLabelKo(difficultyTag: string): string {
  return DIRECT_BATTLE_DIFFICULTY_LABELS_KO[difficultyTag] ?? difficultyTag
}

export function getDirectBattleLessonLabelKo(encounterKey: string, fallback: string): string {
  const encounter = DIRECT_BATTLE_MOCK_ENCOUNTERS.find(item => item.encounterKey === encounterKey)
  return DIRECT_BATTLE_LESSON_LABELS_KO[encounterKey] ?? encounter?.descriptionKo ?? fallback
}

export function formatDirectBattleWinnerKo(winner: string): string {
  if (winner === 'player') return '아군 승리'
  if (winner === 'enemy') return '적 승리'
  return '결과 없음'
}

export function getDirectBattleRoleLabelKo(role: string): string {
  return DIRECT_BATTLE_ROLE_LABELS_KO[role] ?? role
}
import { DIRECT_BATTLE_MOCK_ENCOUNTERS } from './directBattleEncounters'
