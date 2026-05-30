import { resolveMonarchBossAction } from './monarchBattlePatterns'
import type { BattleActionDefinition, BattleUnit, DirectBattleState, BattleStatusEffect, DirectBattleTelegraph, TelegraphSeverity } from './directBattleTypes'

export type MonsterPatternRole =
  | 'minion'
  | 'bruiser'
  | 'tank'
  | 'caster'
  | 'assassin'
  | 'mender'
  | 'disruptor'
  | 'boss'


// ── Target Selection Helper ──
export function chooseTargetByRule(
  state: DirectBattleState,
  actor: BattleUnit,
  rule: string,
): string[] {
  const allies = state.units.filter(u => u.team === actor.team && u.stats.currentHp > 0)
  const enemies = state.units.filter(u => u.team !== actor.team && u.stats.currentHp > 0)

  if (enemies.length === 0) return []

  switch (rule) {
    case 'lowestHpPercent': {
      const target = [...enemies].sort((a, b) => (a.stats.currentHp / a.stats.maxHp) - (b.stats.currentHp / b.stats.maxHp))[0]
      return [target.unitId]
    }
    case 'highestThreat': {
      // Hunter has high threat, otherwise sort by ATK
      const target = [...enemies].sort((a, b) => {
        const aVal = a.unitType === 'hunter' ? 9999 : a.stats.atk
        const bVal = b.unitType === 'hunter' ? 9999 : b.stats.atk
        return bVal - aVal
      })[0]
      return [target.unitId]
    }
    case 'shadowPreferred': {
      const shadows = enemies.filter(u => u.unitType === 'shadow')
      if (shadows.length > 0) {
        return [shadows[Math.floor(Math.random() * shadows.length)].unitId]
      }
      return [enemies[0].unitId]
    }
    case 'tauntedTarget': {
      // Find protect/taunted markers
      const taunted = enemies.find(u => u.statusEffects.some(se => se.type === 'protect' || se.type === 'guard'))
      if (taunted) return [taunted.unitId]
      return [enemies[0].unitId]
    }
    case 'bossSupport': {
      // Targets lowest Hp ally
      const target = [...allies].sort((a, b) => a.stats.currentHp - b.stats.currentHp)[0]
      return [target.unitId]
    }
    case 'frontline': {
      const front = enemies.filter(u => u.boardLane === 'front')
      if (front.length > 0) return [front[0].unitId]
      return [enemies[0].unitId]
    }
    case 'random':
    default: {
      const target = enemies[Math.floor(Math.random() * enemies.length)]
      return [target.unitId]
    }
  }
}

// ── Generic Role Pattern Mapper ──
export function resolveNextActionForRole(
  unit: BattleUnit,
  stepIndex: number,
  state: DirectBattleState,
): {
  action: BattleActionDefinition
  telegraphName: string
  telegraphText: string
  severity: TelegraphSeverity
  targetRule: string
} {
  const role = (unit.role || 'minion') as MonsterPatternRole
  const basic = unit.actionList.find(a => a.actionType === 'basic') ?? unit.actionList[0]
  const skill = unit.actionList.find(a => a.actionType === 'skill' && a.actionId !== basic.actionId)
  const guard = unit.actionList.find(a => a.actionType === 'guard')
  const support = unit.actionList.find(a => a.actionType === 'support')

  // Default Fallbacks
  const defaultAction = {
    action: basic,
    telegraphName: '공격',
    telegraphText: '가벼운 기본 공격 예정',
    severity: 'low' as const,
    targetRule: 'frontline',
  }

  if (role === 'minion') {
    return defaultAction
  }

  if (role === 'bruiser') {
    const cycleStep = stepIndex % 3
    if (cycleStep === 1 && skill) {
      return {
        action: skill,
        telegraphName: '돌격 준비 💥',
        telegraphText: '다음 턴 강타 · Guardian 수호막/방어 대응 권장',
        severity: 'high',
        targetRule: 'lowestHpPercent',
      }
    }
    return defaultAction
  }

  if (role === 'tank') {
    const cycleStep = stepIndex % 3
    if (cycleStep === 1 && guard) {
      return {
        action: guard,
        telegraphName: '방어 태세 🛡️',
        telegraphText: '대형 보호막 활성화 · Warrior 방어파쇄/관통 스킬 필요',
        severity: 'medium',
        targetRule: 'bossSupport',
      }
    }
    return defaultAction
  }

  if (role === 'caster') {
    const cycleStep = stepIndex % 4
    if (cycleStep === 2 && skill) {
      return {
        action: skill,
        telegraphName: '룬 집중 🔮',
        telegraphText: '다음 턴 광역 비전 폭격 · 신속히 처치하거나 보호막 전개 권장',
        severity: 'high',
        targetRule: 'highestThreat',
      }
    }
    return defaultAction
  }

  if (role === 'assassin') {
    const cycleStep = stepIndex % 3
    if (cycleStep === 1 && skill) {
      return {
        action: skill,
        telegraphName: '암살 기습 💀',
        telegraphText: 'HP가 가장 낮은 아군 노림 · Guardian 도발로 대상 차단 권장',
        severity: 'high',
        targetRule: 'lowestHpPercent',
      }
    }
    return defaultAction
  }

  if (role === 'mender') {
    // Dynamic trigger: heal if any ally is wounded, else support or attack
    const wounded = state.units.some(u => u.team === unit.team && u.stats.currentHp / u.stats.maxHp < 0.75)
    if (wounded && support) {
      return {
        action: support,
        telegraphName: '치유 의식 💚',
        telegraphText: '부상당한 아군 회복 시도 · 극딜로 저지하거나 우선 처치 필요',
        severity: 'medium',
        targetRule: 'bossSupport',
      }
    }
    return defaultAction
  }

  if (role === 'disruptor') {
    const cycleStep = stepIndex % 3
    if (cycleStep === 1 && skill) {
      return {
        action: skill,
        telegraphName: '기억 교란 🌀',
        telegraphText: '아군에게 강력한 능력 저하 디버프 예정 · Tactician 전장 분석 권장',
        severity: 'medium',
        targetRule: 'highestThreat',
      }
    }
    return defaultAction
  }

  return defaultAction
}

// ── Boss-Specific Cycles ──
export function resolveBossAction(
  unit: BattleUnit,
  stepIndex: number,
  state: DirectBattleState,
): {
  action: BattleActionDefinition
  telegraphName: string
  telegraphText: string
  severity: TelegraphSeverity
  targetRule: string
} {
  const hpPct = unit.stats.currentHp / unit.stats.maxHp
  const basic = unit.actionList.find(a => a.actionType === 'basic') ?? unit.actionList[0]
  const skillA = unit.actionList.find(a => a.actionType === 'skill' || a.effectKind === 'control') ?? basic
  const skillB = unit.actionList.find(a => (a.actionType === 'skill' || a.actionType === 'guard' || a.actionType === 'support') && a.actionId !== skillA.actionId) ?? skillA

  // 0. 심연의 군주들 및 지고의 심판자 (L4-B Monarchs and Angel)
  const isMonarch = ['grellic', 'celaide', 'igris', 'dorga', 'mirage', 'pesta', 'belatus', 'nox', 'angel'].includes(unit.sourceId)
  if (isMonarch) {
    return resolveMonarchBossAction(unit, stepIndex, state)
  }

  // 1. 균열 군주 (boss-riftlord / rift-commander / mock-boss)
  if (unit.sourceId.includes('rift-commander') || unit.sourceId.includes('mock-boss')) {
    // 40% Enrage trigger: faster and lethal
    const isEnraged = hpPct < 0.4
    const cycleLen = isEnraged ? 3 : 4
    const cycleStep = stepIndex % cycleLen

    if (cycleStep === 1) {
      return {
        action: skillA,
        telegraphName: isEnraged ? '차원 광포 붕괴 🪐' : '균열 권능 충전 🪐',
        telegraphText: isEnraged ? '아군 전체에 즉사급 광역 피해 예정 · 무조건 방어/수호막 권장' : '다음 턴 강력한 전체 공격 · Guardian 수호막 권장',
        severity: isEnraged ? 'lethal' : 'high',
        targetRule: 'highestThreat',
      }
    }
    if (cycleStep === 2 && skillB) {
      return {
        action: skillB,
        telegraphName: '지휘의 외침 🛡️',
        telegraphText: '적 전체 버프 부여 · Tactician 전장 분석 오라로 지쇄 권장',
        severity: 'medium',
        targetRule: 'bossSupport',
      }
    }
    return {
      action: basic,
      telegraphName: '균열 강습',
      telegraphText: '보스의 기본 참격 타격 예정',
      severity: 'medium',
      targetRule: 'frontline',
    }
  }

  // 2. 철벽 군주 (boss-warden / iron-wall-lord)
  if (unit.sourceId.includes('iron-wall-lord')) {
    const cycleStep = stepIndex % 4
    const isLowHp = hpPct < 0.4

    if (cycleStep === 1) {
      return {
        action: skillA,
        telegraphName: isLowHp ? '단죄의 처형 단두대 💥' : '처형의 방패 짓이기기 💥',
        telegraphText: isLowHp ? '방어력을 관통하는 치명적 단일 처형 타격 · Guardian 수호막 필수' : '강력한 단일 강타 예정 · 수호막/방어 대응 권장',
        severity: isLowHp ? 'lethal' : 'high',
        targetRule: 'lowestHpPercent',
      }
    }
    if (cycleStep === 2 && skillB) {
      return {
        action: skillB,
        telegraphName: '철벽 영역 전개 🛡️',
        telegraphText: '아군 전체에 단단한 가드 전개 · Warrior 파쇄강타로 즉시 분쇄 권장',
        severity: 'high',
        targetRule: 'bossSupport',
      }
    }
    return {
      action: basic,
      telegraphName: '철벽의 고리',
      telegraphText: '무거운 기본 방패 휘두르기 예정',
      severity: 'medium',
      targetRule: 'frontline',
    }
  }

  // 3. 심연 포식자 (boss-beast / abyss-devourer)
  if (unit.sourceId.includes('abyss-devourer')) {
    const cycleStep = stepIndex % 3
    const isEnraged = hpPct < 0.5

    if (cycleStep === 1) {
      return {
        action: skillA,
        telegraphName: isEnraged ? '광포 영혼 갈취 💀' : '심연 포식의 이빨 💀',
        telegraphText: isEnraged ? '피해 증가 상태의 대상을 짓이겨 즉사 피해 · Guardian 도발로 타겟 유도' : '피해 흡수 및 치명타 강격 예정 · 수호막 대기',
        severity: isEnraged ? 'lethal' : 'high',
        targetRule: 'lowestHpPercent',
      }
    }
    return {
      action: basic,
      telegraphName: '심연 손톱 할퀴기',
      telegraphText: '빠른 속도의 어둠 손톱 타격 예정',
      severity: 'medium',
      targetRule: 'random',
    }
  }

  // 4. 기록 감시관 (memory-warden-boss)
  if (unit.sourceId.includes('memory-warden-boss')) {
    const cycleStep = stepIndex % 4
    if (cycleStep === 1) {
      return {
        action: skillA,
        telegraphName: '감시관의 억압 선포 🌀',
        telegraphText: '아군 전체의 쿨다운 및 집중 교란 명중 감소 디버프 예정',
        severity: 'high',
        targetRule: 'highestThreat',
      }
    }
    if (cycleStep === 2 && skillB) {
      return {
        action: skillB,
        telegraphName: '망각의 정죄 💥',
        telegraphText: '표식이 새겨진 대상 격침 강타 예정 · Guardian 보호/도발 전환',
        severity: 'medium',
        targetRule: 'lowestHpPercent',
      }
    }
  }

  // General Boss Default
  return {
    action: skillA ?? basic,
    telegraphName: '보스 강타 💥',
    telegraphText: '보스 고유의 무겁고 치명적인 광역/단일 폭발 타격 예정',
    severity: 'high',
    targetRule: 'highestThreat',
  }
}
