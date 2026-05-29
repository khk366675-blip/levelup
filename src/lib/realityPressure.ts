import type { DailyProgressionState, FocusSessionState, ActiveGate, RealityPressureSnapshot } from './types'

/**
 * 현실 행동(준비도 및 성공 집중 공명 세션)에 기반하여 몬스터 강화 수치(Reality Pressure)를 산출합니다.
 */
export const calculateRealityPressure = (
  dailyProgression?: DailyProgressionState,
  focusSession?: FocusSessionState,
  activeGate?: ActiveGate
): RealityPressureSnapshot => {
  let readinessTier = 'dormant'
  let focusResonanceTier = 'none'
  
  let hpMultiplier = 1.0
  let atkMultiplier = 1.0
  let defMultiplier = 1.0
  
  const reasonLabels: string[] = []

  // 1. DailyProgression readiness 기반 몬스터 강화
  if (dailyProgression) {
    readinessTier = dailyProgression.readinessLevel || 'dormant'
    
    // dormant: +0%, awakening: +2%, focused: +4%, resonant: +8%, transcendent: +12%
    if (readinessTier === 'awakening') {
      hpMultiplier += 0.02
      atkMultiplier += 0.02
      defMultiplier += 0.005
      reasonLabels.push('현실 각성공명 (+2%)')
    } else if (readinessTier === 'focused') {
      hpMultiplier += 0.04
      atkMultiplier += 0.04
      defMultiplier += 0.01
      reasonLabels.push('현실 몰입공명 (+4%)')
    } else if (readinessTier === 'resonant') {
      hpMultiplier += 0.08
      atkMultiplier += 0.07
      defMultiplier += 0.02
      reasonLabels.push('현실 집단공명 (+8%)')
    } else if (readinessTier === 'transcendent') {
      hpMultiplier += 0.12
      atkMultiplier += 0.10
      defMultiplier += 0.03
      reasonLabels.push('현실 초월공명 (+12%)')
    }
  }

  // 2. Focus Session 공명 기반 몬스터 강화 (성공 세션 completed: true만 반영)
  if (focusSession && focusSession.history && activeGate) {
    const dateKey = new Date().toISOString().slice(0, 10)
    const activeGateId = activeGate.gateId
    
    // 오늘 완료된 성공 세션 중 해당 게이트에 연결된 세션 필터링
    const matchedRecords = focusSession.history.filter(r => {
      if (!r.completed || r.linkedGateId !== activeGateId) return false
      const recordDate = new Date(r.endedAt).toISOString().slice(0, 10)
      return recordDate === dateKey
    })

    if (matchedRecords.length > 0) {
      let focusBonusHp = 0
      let focusBonusAtk = 0
      
      matchedRecords.forEach(r => {
        const plannedMin = r.plannedDurationMs / (60 * 1000)
        if (plannedMin >= 50) {
          focusBonusHp += 0.06
          focusBonusAtk += 0.05
          focusResonanceTier = '50m'
        } else if (plannedMin >= 25) {
          focusBonusHp += 0.04
          focusBonusAtk += 0.03
          focusResonanceTier = '25m'
        } else {
          focusBonusHp += 0.02
          focusBonusAtk += 0.01
          focusResonanceTier = '15m'
        }
      })

      // 집중 공명에 따른 누적 추가 한계 cap (+8%)
      const cappedHp = Math.min(0.08, focusBonusHp)
      const cappedAtk = Math.min(0.08, focusBonusAtk)
      
      if (cappedHp > 0) {
        hpMultiplier += cappedHp
        atkMultiplier += cappedAtk
        defMultiplier += cappedHp * 0.25 // 방어력은 hp 가산치의 25% 수준으로 보수적으로 계산
        reasonLabels.push(`집중 공명 심도 (+${Math.round(cappedHp * 100)}%)`)
      }
    }
  }

  return {
    readinessTier,
    focusResonanceTier,
    monsterHpMultiplier: hpMultiplier,
    monsterAtkMultiplier: atkMultiplier,
    monsterDefMultiplier: defMultiplier,
    bossExtraMultiplier: 1.20,
    eliteExtraMultiplier: 1.0,
    telegraphPressureBonus: 0,
    reasonLabels
  }
}

/**
 * 몬스터 종류와 Red Gate 여부를 고려하여 최종적인 스탯 곱연산 보정치를 산출합니다. (최종 Cap 적용)
 */
export const getMonsterPressureScaling = (
  snapshot?: RealityPressureSnapshot,
  monsterType?: 'boss' | 'elite' | 'minion' | string,
  isRedGate = false
): { hp: number; atk: number; def: number } => {
  if (!snapshot) {
    return { hp: 1.0, atk: 1.0, def: 1.0 }
  }

  const hpBase = snapshot.monsterHpMultiplier - 1.0
  const atkBase = snapshot.monsterAtkMultiplier - 1.0
  const defBase = snapshot.monsterDefMultiplier - 1.0

  let hpFactor = 1.0
  let atkFactor = 1.0
  let defFactor = 1.0

  const isBoss = monsterType === 'boss'
  const isElite = monsterType === 'elite'

  if (isBoss) {
    hpFactor = 1.20
    atkFactor = 1.20
    defFactor = 1.20
  } else if (isElite) {
    hpFactor = 1.0
    atkFactor = 1.0
    defFactor = 1.0
  } else {
    // 일반 몬스터는 압박도를 75% 수준으로 완화
    hpFactor = 0.75
    atkFactor = 0.75
    defFactor = 0.75
  }

  let finalHpAdd = hpBase * hpFactor
  let finalAtkAdd = atkBase * atkFactor
  let finalDefAdd = defBase * defFactor

  // 최종 Cap 적용 (과도한 몬스터 파워 인플레이션 차단)
  if (isRedGate) {
    // Red Gate의 경우 기존 보정치에 겹쳐서 과증폭되지 않도록 reality pressure 추가분 cap을 아주 낮게 제한 (+10~15%)
    if (isBoss) {
      finalHpAdd = Math.min(0.15, finalHpAdd)
      finalAtkAdd = Math.min(0.15, finalAtkAdd)
      finalDefAdd = Math.min(0.04, finalDefAdd)
    } else {
      finalHpAdd = Math.min(0.10, finalHpAdd)
      finalAtkAdd = Math.min(0.10, finalAtkAdd)
      finalDefAdd = Math.min(0.03, finalDefAdd)
    }
  } else {
    // 일반 Gate cap: 일반 +15%, elite +20%, boss +25%
    if (isBoss) {
      finalHpAdd = Math.min(0.25, finalHpAdd)
      finalAtkAdd = Math.min(0.25, finalAtkAdd)
      finalDefAdd = Math.min(0.08, finalDefAdd)
    } else if (isElite) {
      finalHpAdd = Math.min(0.20, finalHpAdd)
      finalAtkAdd = Math.min(0.20, finalAtkAdd)
      finalDefAdd = Math.min(0.06, finalDefAdd)
    } else {
      finalHpAdd = Math.min(0.15, finalHpAdd)
      finalAtkAdd = Math.min(0.15, finalAtkAdd)
      finalDefAdd = Math.min(0.04, finalDefAdd)
    }
  }

  return {
    hp: 1.0 + finalHpAdd,
    atk: 1.0 + finalAtkAdd,
    def: 1.0 + finalDefAdd
  }
}
