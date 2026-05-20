import { BASIC_ATTACK_SKILL, buildBattleSkillContext, chooseSkill, type BattleActorState } from './game'
import { getSkillCooldownTurns, isDamageSkill } from './skills'
import type { ManualBattleSession, MonsterDefinition, SkillDefinition } from './types'

export type MonsterIntentTone = 'danger' | 'guard' | 'weakness' | 'unstable'

export type MonsterIntent = {
  tone: MonsterIntentTone
  label: string
  summary: string
  responseHint: string
}

const projectedCooldowns = (cooldowns: Record<string, number>) => {
  return Object.fromEntries(
    Object.entries(cooldowns).map(([skillId, turns]) => [skillId, Math.max(0, turns - 1)])
  )
}

const createActor = (
  type: BattleActorState['type'],
  id: string,
  name: string,
  stats: ManualBattleSession['player'],
  skillIds: string[],
  cooldowns: Record<string, number>
): BattleActorState => ({
  type,
  id,
  name,
  maxHp: stats.maxHp,
  hp: stats.hp,
  atk: stats.atk,
  def: stats.def,
  speed: stats.spd,
  critRate: stats.critRate ?? 0,
  accuracy: stats.accuracy ?? 0.9,
  evasionRate: stats.evasion ?? 0,
  skillIds,
  cooldowns,
})

const buildMonsterSkillPool = (
  monsterDefinition: MonsterDefinition | undefined,
  allSkills: SkillDefinition[]
): SkillDefinition[] => {
  const monsterSkillIds = new Set([BASIC_ATTACK_SKILL.id, ...(monsterDefinition?.skillIds ?? [])])
  const monsterSkills = allSkills.filter(skill =>
    monsterSkillIds.has(skill.id) &&
    (skill.ownerType === 'common' || skill.ownerType === 'monster')
  )
  return monsterSkills.some(skill => skill.id === BASIC_ATTACK_SKILL.id)
    ? monsterSkills
    : [BASIC_ATTACK_SKILL, ...monsterSkills]
}

export const getMonsterIntent = (
  session: ManualBattleSession,
  monsterDefinition: MonsterDefinition | undefined,
  allSkills: SkillDefinition[]
): MonsterIntent => {
  const monsterSkills = buildMonsterSkillPool(monsterDefinition, allSkills)
  const monsterSkillIds = monsterSkills.map(skill => skill.id)
  const monster = createActor(
    'monster',
    monsterDefinition?.id ?? 'monster',
    session.monster.name,
    session.monster,
    monsterSkillIds,
    projectedCooldowns(session.monsterCooldowns),
  )
  const player = createActor('player', 'player', session.player.name, session.player, [], session.cooldowns)
  const context = buildBattleSkillContext(monster, player, session.activeEffects, session.logs.length + 1)
  const skill = chooseSkill(monster, monsterSkills, context)
  const hpRatio = session.monster.maxHp > 0 ? session.monster.hp / session.monster.maxHp : 0
  const cooldownRemaining = getSkillCooldownTurns(skill)

  if (hpRatio <= 0.28 && isDamageSkill(skill)) {
    return {
      tone: 'weakness',
      label: '약점 노출',
      summary: '몬스터의 자세가 무너지고 있다.',
      responseHint: '공격 스킬로 압박하기 좋은 타이밍',
    }
  }

  if (skill.type === 'defense' || skill.type === 'buff' || skill.type === 'heal') {
    return {
      tone: 'guard',
      label: '방어 자세',
      summary: '몬스터가 흐름을 굳히려 한다.',
      responseHint: '버프 전에 압박하거나 태세를 정비',
    }
  }

  if (skill.type === 'debuff' || skill.type === 'utility') {
    return {
      tone: 'unstable',
      label: '불안정한 움직임',
      summary: '균열 기운이 플레이어 쪽으로 몰린다.',
      responseHint: '장기전 전에 핵심 스킬을 먼저 사용',
    }
  }

  if (isDamageSkill(skill) && ((skill.power ?? 1) >= 1.15 || session.monster.atk > session.player.def * 1.35)) {
    return {
      tone: 'danger',
      label: cooldownRemaining >= 3 ? '강공격 준비' : '연속 공격 조짐',
      summary: '다음 충돌이 무겁게 들어올 수 있다.',
      responseHint: '방어 또는 방어 태세 고려',
    }
  }

  return {
    tone: 'unstable',
    label: '균열 흔들림',
    summary: '몬스터의 호흡이 짧게 흔들린다.',
    responseHint: '안전하게 피해를 누적',
  }
}

export const getSkillIntentHint = (skill: SkillDefinition, intent?: MonsterIntent): string | undefined => {
  if (!intent) return undefined
  if (intent.tone === 'danger' && (skill.type === 'defense' || skill.type === 'buff')) return '추천 대응'
  if (intent.tone === 'weakness' && isDamageSkill(skill)) return '공격 타이밍'
  if ((intent.tone === 'guard' || intent.tone === 'unstable') && (skill.type === 'debuff' || isDamageSkill(skill))) return '선제 압박'
  return undefined
}
