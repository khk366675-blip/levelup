/**
 * Expedition Lore & Narrative Text Pool (12-23C)
 * Separated from main logic for maintainability.
 * Do NOT import from store.ts or components.
 */
import type {
  ExpeditionMidEvent,
  ExpeditionPhase,
  ExpeditionReport,
  ShadowExpeditionCommand,
  ShadowExpeditionOutcome,
  ShadowExpeditionType,
  ShadowRole,
} from './types'

// ── Phase Display Names ──────────────────────────────────────────────

export const PHASE_COMMON_NAMES: Record<ExpeditionPhase, string> = {
  muster: '소집',
  deploy: '출정',
  contact: '접촉',
  threshold: '분기',
  resolution: '결행',
  return: '귀환',
}

const PHASE_TYPE_NAMES: Record<ShadowExpeditionType, Partial<Record<ExpeditionPhase, string>>> = {
  training: { deploy: '정렬', contact: '대련', threshold: '한계', resolution: '봉인 해제' },
  essence:  { deploy: '추적', contact: '식별', threshold: '회수', resolution: '봉합' },
  hunt:     { deploy: '추적', contact: '포착', threshold: '교전', resolution: '소탕' },
  scout:    { deploy: '진입', contact: '관측', threshold: '기록', resolution: '후퇴' },
}

export function getPhaseDisplayName(phase: ExpeditionPhase, type: ShadowExpeditionType): string {
  return PHASE_TYPE_NAMES[type]?.[phase] ?? PHASE_COMMON_NAMES[phase]
}

// ── Phase Thresholds ────────────────────────────────────────────────

export function getExpeditionPhase(progress: number): ExpeditionPhase {
  if (progress >= 100) return 'return'
  if (progress >= 80)  return 'resolution'
  if (progress >= 60)  return 'threshold'
  if (progress >= 25)  return 'contact'
  if (progress > 0)    return 'deploy'
  return 'muster'
}

// ── Phase Enter Logs ────────────────────────────────────────────────

const PHASE_ENTER_LOGS: Record<ShadowExpeditionType, Record<ExpeditionPhase, string[]>> = {
  training: {
    muster:     ['군단이 출정을 기다린다.', '무기 검수 소리가 들린다.', '그림자들이 정렬했다.'],
    deploy:     ['훈련장으로 진입한다.', '대련 상대가 모습을 드러냈다.', '열이 완료되었다.'],
    contact:    ['첫 동작이 교차한다.', '움직임이 빨라진다.', '훈련 상대와 맞붙었다.'],
    threshold:  ['한계가 가까워진다.', '그림자 하나가 멈춰 섰다.', '숨소리가 달라졌다.'],
    resolution: ['마지막 봉인이 풀린다.', '모든 그림자가 한 곳으로 모인다.'],
    return:     ['훈련장이 고요해진다.', '그림자들이 제자리로 돌아온다.'],
  },
  essence: {
    muster:     ['정수 탐지기가 깜빡인다.', '흩어진 흔적이 포착됐다.'],
    deploy:     ['정수 파편이 눈에 띈다.', '흔적이 선명해진다.', '추적이 속도를 낸다.'],
    contact:    ['정수의 결이 감지된다.', '회수 가능한 양이 확인됐다.', '정수가 반응하기 시작했다.'],
    threshold:  ['회수 지점에 도달했다.', '정수가 움직이려 한다.', '봉합 준비가 필요하다.'],
    resolution: ['정수를 끌어당긴다.', '봉합이 진행 중이다.', '마지막 정수가 안정된다.'],
    return:     ['정수를 운반한다.', '귀환 길이 열렸다.', '정수가 안정을 찾았다.'],
  },
  hunt: {
    muster:     ['잔재의 냄새가 난다.', '그림자들이 포위망을 짠다.', '사냥 준비가 완료되었다.'],
    deploy:     ['잔재의 흔적을 찾았다.', '추적이 시작된다.', '움직임이 감지된다.'],
    contact:    ['잔재와 마주했다.', '전열이 충돌한다.', '첫 타격이 들어갔다.'],
    threshold:  ['잔재가 마지막 발악을 한다.', '결정적 순간이 왔다.'],
    resolution: ['마무리 타격을 가한다.', '잔재가 소멸해간다.', '소탕이 진행 중이다.'],
    return:     ['사냥이 끝났다.', '전장이 조용해진다.', '그림자들이 귀환한다.'],
  },
  scout: {
    muster:     ['정찰 장비를 점검한다.', '정찰병이 출발 준비를 마쳤다.'],
    deploy:     ['균열 가장자리에 도달했다.', '정찰 구역에 진입했다.', '주변을 탐색하기 시작한다.'],
    contact:    ['관측 지점에 도착했다.', '중요한 흔적을 발견했다.', '기록을 시작한다.'],
    threshold:  ['위험 신호가 감지됐다.', '기록할 것이 너무 많다.', '결정이 필요한 순간이다.'],
    resolution: ['수집을 마무리한다.', '마지막 기록을 남긴다.', '후퇴 준비가 완료되었다.'],
    return:     ['정찰병들이 복귀했다.', '수집한 정보를 정리한다.'],
  },
}

export function getPhaseEnterLog(type: ShadowExpeditionType, phase: ExpeditionPhase): string {
  const pool = PHASE_ENTER_LOGS[type]?.[phase] ?? ['전장의 상황이 변했다.']
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Command Logs (phase × type) ─────────────────────────────────────

const COMMAND_LOGS: Record<ShadowExpeditionCommand, Record<ExpeditionPhase, string[]>> = {
  attack: {
    muster:     ['출정 전 마지막 점검이다.', '전열을 가다듬는다.'],
    deploy:     ['선제 진입을 감행한다.', '앞으로 나아간다.', '전방을 압박한다.'],
    contact:    ['전열이 충돌한다.', '적과 맞붙었다.', '공격이 시작됐다.', '전선을 밀어붙인다.'],
    threshold:  ['위험한 강행을 단행한다.', '결단의 순간이다.', '마지막 돌파를 시도한다.'],
    resolution: ['최종 돌파를 실행한다.', '모든 것을 건 공격이다.', '마무리를 향해 간다.'],
    return:     ['남은 적을 정리한다.', '마지막 경계를 선다.'],
  },
  defend: {
    muster:     ['방어 태세를 점검한다.', '전열을 정비한다.'],
    deploy:     ['안정적인 진행을 선택한다.', '전열을 유지하며 나아간다.'],
    contact:    ['전열을 지킨다.', '방어선을 유지한다.', '적의 공격을 견뎌낸다.', '군단의 호흡을 정돈한다.'],
    threshold:  ['위기 직전 전열을 재정비한다.', '한숨 돌린다.', '방어 태세를 가다듬는다.'],
    resolution: ['안정적인 마무리를 선택한다.', '전열을 유지하며 완수한다.'],
    return:     ['귀환로를 확보한다.', '후방을 지킨다.'],
  },
  scout: {
    muster:     ['정찰 계획을 검토한다.', '지형을 미리 파악한다.'],
    deploy:     ['길을 확인한다.', '앞을 탐색한다.', '정찰이 먼저 나간다.', '안전한 경로를 모색한다.'],
    contact:    ['상황을 더 파악한다.', '주변을 살핀다.', '위험을 확인한다.'],
    threshold:  ['위험 회피를 모색한다.', '숨은 경로를 찾는다.', '돌파구를 탐색한다.'],
    resolution: ['마지막 확인을 한다.', '빠져나갈 길을 확보한다.'],
    return:     ['귀환로를 확인한다.', '후방을 정찰한다.'],
  },
  analyze: {
    muster:     ['패턴을 분석한다.', '과거 기록을 참조한다.'],
    deploy:     ['주변을 읽어낸다.', '규칙성을 찾는다.', '패턴을 파악하기 시작한다.'],
    contact:    ['적의 움직임을 해석한다.', '패턴을 읽어낸다.', '불일치를 발견했다.', '약점을 기록한다.'],
    threshold:  ['결정적 패턴을 찾았다.', '핵심을 꿰뚫었다.', '모든 것이 연결된다.'],
    resolution: ['마지막 분석을 마친다.', '기록을 완성한다.', '해석을 정리한다.'],
    return:     ['분석 결과를 정리한다.', '기록을 마무리한다.'],
  },
  search: {
    muster:     ['수색 계획을 세운다.', '목표물을 확인한다.'],
    deploy:     ['주변을 뒤진다.', '숨겨진 것을 찾기 시작한다.'],
    contact:    ['전투 중 놓친 것을 찾는다.', '주변을 수색한다.'],
    threshold:  ['숨겨진 것이 눈에 띈다.', '발견의 순간이 다가온다.'],
    resolution: ['보상을 회수한다.', '모든 것을 챙긴다.', '마지막 수색을 한다.'],
    return:     ['남은 것이 있는지 확인한다.', '마무리 수색을 한다.'],
  },
}

export function getCommandLog(command: ShadowExpeditionCommand, phase: ExpeditionPhase): string {
  const pool = COMMAND_LOGS[command]?.[phase] ?? ['명령이 실행되었다.']
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Role Lines ──────────────────────────────────────────────────────

type RoleLineContext = 'command' | 'success' | 'failure' | 'great_success' | 'event' | 'report'

const ROLE_LINES: Record<ShadowRole, Record<RoleLineContext, string[]>> = {
  assault: {
    command:       ['전방 확인. 진입한다.', '길을 만든다.', '막는 것은 없다.'],
    success:       ['뚫었다.', '전열이 무너졌다.', '진입 완료.'],
    failure:       ['전선이 무너지지 않았다.', '이번엔 아니다.', '다음에는 다를 것이다.'],
    great_success: ['완전히 찢었다.', '저항이 없다.', '전위 임무 완료.'],
    event:         ['명령만 내려라.', '기다리는 것은 내 몫이 아니다.'],
    report:        ['전방은 정리됐다.', '다음 명령을 기다린다.'],
  },
  guard: {
    command:       ['전열 유지한다.', '아무도 잃지 않는다.', '방어선 지킨다.'],
    success:       ['전열이 무너지지 않았다.', '손실 없음.', '후방 안전.'],
    failure:       ['전열은 살아있다.', '후퇴가 아니라 정비다.', '다음 명령을 기다린다.'],
    great_success: ['군단 전원 귀환.', '한 명도 잃지 않았다.', '방어선 완전히 지켰다.'],
    event:         ['전열을 정돈한다.', '이상 없다.'],
    report:        ['군단 이상 없음.', '손실 보고 없음.'],
  },
  scout: {
    command:       ['확인하고 온다.', '먼저 본다.', '길 있다. 따라와라.'],
    success:       ['경로 확보.', '이상 없다.', '지도 갱신.'],
    failure:       ['뭔가 달랐다.', '기록은 남긴다.', '다음엔 다른 길 찾는다.'],
    great_success: ['숨겨진 경로 발견.', '지도에 없던 길이 있었다.', '보고 완료.'],
    event:         ['뭔가 이상하다.', '기다려라.'],
    report:        ['이상 신호가 있었다.', '기록해뒀다.'],
  },
  analyst: {
    command:       ['패턴을 읽는다.', '기록한다.', '반복이다. 구조가 보인다.'],
    success:       ['예측이 맞았다.', '구조가 보였다.', '기록 완료.'],
    failure:       ['변수가 있었다.', '다음 시도에는 보정한다.', '기록은 남긴다.'],
    great_success: ['완전히 해석됐다.', '이 구조, 다음에도 쓸 수 있다.', '분석 완료.'],
    event:         ['이 패턴은 전에 본 적이 있다.', '반복이 있다.'],
    report:        ['기록이 쌓였다.', '다음 원정에 참고할 수 있다.'],
  },
  hunter: {
    command:       ['냄새가 난다.', '놓치지 않는다.', '이미 보고 있다.'],
    success:       ['잡았다.', '흔적대로였다.', '예상대로다.'],
    failure:       ['놓쳤다. 하지만 흔적은 남아있다.', '다음엔 앞을 막는다.', '아직 사냥이 끝나지 않았다.'],
    great_success: ['완벽한 사냥이었다.', '흔적 하나도 남기지 않았다.', '끝.'],
    event:         ['다른 냄새가 섞였다.', '이건 처음 보는 종류다.'],
    report:        ['사냥감 확인.', '흔적 기록 완료.'],
  },
  support: {
    command:       ['전원 지원한다.', '후열 정비한다.', '모두 확인됐다.'],
    success:       ['전원 무사.', '보급 완료.', '정비 완료.'],
    failure:       ['노력은 헛되지 않았다.', '전원 살아있다.', '다음을 준비한다.'],
    great_success: ['군단이 최상 상태다.', '모두 준비됐다.', '완전 정비 완료.'],
    event:         ['상황을 안정시킨다.', '군단 상태 확인.'],
    report:        ['후방 정비 완료.', '군단 준비됐다.'],
  },
}

export function getRoleLine(role: ShadowRole, context: RoleLineContext): string {
  const pool = ROLE_LINES[role]?.[context] ?? ['임무 수행 중.']
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Mid Events ──────────────────────────────────────────────────────

export const MID_EVENTS: ExpeditionMidEvent[] = [
  {
    id: 'echo_expedition_artifact',
    type: 'any',
    phase: 'threshold',
    title: '전임자의 유물 발견',
    description: '원정 중 한 그림자가 차원 왜곡 영역 구석에서 과거 주인이 사용했던 것으로 추정되는 낯선 기록기와 망가진 유물을 발견했습니다.',
    recentCooldown: 5,
    choices: [
      {
        id: 'investigate',
        label: '기록기 분석 및 유물 수거',
        description: '과거 전임자의 기록을 면밀히 분석하고 유물을 가져갑니다. (Echo 공명도 증가)',
        progressDelta: 5,
        riskDelta: 5,
        log: '과거 전임자가 남긴 기하학적 수식과 조각들이 해독되며, 세계의 반향이 깊어집니다.',
      },
      {
        id: 'seal',
        label: '현 상태로 안전하게 밀봉',
        description: '위험 요소를 배제하고 발견물을 안전하게 밀봉 처리합니다.',
        progressDelta: 3,
        riskDelta: -5,
        log: '발견물은 밀봉되어 보존되었고, 정찰 경로는 안정화되었습니다.',
      },
    ],
  },
  // training
  {
    id: 'training_rift_in_sparring',
    type: 'training',
    phase: 'threshold',
    title: '대련 중 균열',
    description: '훈련 중 한 그림자가 같은 동작을 반복하다 멈춰 섰다. 뭔가 다른 흔적이 느껴진다.',
    recentCooldown: 3,
    choices: [
      {
        id: 'ignore',
        label: '묵인한다',
        description: '훈련에 집중한다.',
        progressDelta: 5,
        log: '그림자는 다시 움직이기 시작했다. 훈련이 계속된다.',
      },
      {
        id: 'analyze',
        label: '분석가 투입',
        description: '패턴을 분석한다.',
        progressDelta: 3,
        riskDelta: -5,
        log: '분석 결과, 그림자 내부에 미세한 변화가 기록됐다.',
        preferredRoles: ['analyst'],
      },
      {
        id: 'swap',
        label: '다른 그림자로 교체',
        description: '안정적인 훈련을 선택한다.',
        progressDelta: 2,
        riskDelta: -3,
        log: '훈련이 안정적으로 이어졌다.',
        preferredRoles: ['support'],
      },
      {
        id: 'combat_sparring_rift',
        label: '균열의 망령 처단 (전투 돌입)',
        description: '훈련장 균열 너머에 있는 위협적인 존재를 처단합니다. 성공 시 대량의 원정 진행도를 얻지만, 실패 시 부상 위험이 있습니다.',
        triggerCombat: true,
        enemyEncounterKey: 'scout_pair',
        enemyBaseLevel: 10,
        log: '훈련 대련 중, 균열에서 망령들이 튀어나왔습니다! 전투를 개시합니다.',
      },
    ],
  },
  {
    id: 'training_limit_break',
    type: 'training',
    phase: 'threshold',
    title: '자발적 한계 돌파',
    description: '한 그림자가 명령 없이 한계까지 밀어붙이고 있다.',
    recentCooldown: 4,
    choices: [
      {
        id: 'allow',
        label: '허용한다',
        description: '그림자의 의지를 따른다.',
        progressDelta: 8,
        riskDelta: 5,
        log: '그림자가 한계를 넘어섰다. 흔적이 남았다.',
      },
      {
        id: 'restrain',
        label: '제지한다',
        description: '안정적인 훈련을 선택한다.',
        progressDelta: 4,
        riskDelta: -3,
        log: '훈련이 통제 범위 안에서 완료됐다.',
      },
    ],
  },
  // essence
  {
    id: 'essence_echo',
    type: 'essence',
    phase: 'threshold',
    title: '반향이 같은 정수',
    description: '회수된 정수에서 과거 기록과 비슷한 결이 감지된다.',
    recentCooldown: 3,
    choices: [
      {
        id: 'force',
        label: '회수 강행',
        description: '리스크를 감수하고 회수한다.',
        progressDelta: 10,
        riskDelta: 8,
        log: '정수를 강제로 끌어냈다. 흔적이 남았다.',
      },
      {
        id: 'analyze_first',
        label: '분석 우선',
        description: '안전을 위해 분석한다.',
        progressDelta: 5,
        riskDelta: -2,
        log: '분석 중 이상한 패턴이 기록됐다.',
        preferredRoles: ['analyst'],
      },
      {
        id: 'seal_withdraw',
        label: '봉합 후 철수',
        description: '안전한 방향을 선택한다.',
        progressDelta: 3,
        riskDelta: -5,
        log: '정수를 안정적으로 봉합했다.',
      },
      {
        id: 'combat_essence_beast',
        label: '정수 식탐 괴수 격퇴 (전투 돌입)',
        description: '정수의 냄새를 맡고 나타난 공허 괴수와 싸웁니다. 성공 시 대성공으로 이어질 수 있습니다.',
        triggerCombat: true,
        enemyEncounterKey: 'tank_caster',
        enemyBaseLevel: 12,
        log: '공허 괴수가 마력을 흡수하려 달려듭니다. 전투가 시작됩니다.',
      },
    ],
  },
  {
    id: 'essence_name',
    type: 'essence',
    phase: 'threshold',
    title: '누군가의 이름',
    description: '그림자 정수 회수 중 그림자 하나가 부르지 않은 이름에 반응했다.',
    recentCooldown: 4,
    choices: [
      {
        id: 'ignore',
        label: '무시한다',
        description: '집중을 유지한다.',
        progressDelta: 4,
        log: '그림자는 다시 집중했다.',
      },
      {
        id: 'calm',
        label: '진정시킨다',
        description: '그림자를 안정시킨다.',
        progressDelta: 6,
        riskDelta: -3,
        log: '그림자가 안정됐다. 작은 흔적이 남았다.',
        preferredRoles: ['support'],
      },
      {
        id: 'analyze_essence',
        label: '정수 추가 분석',
        description: '정수와의 연결을 분석한다.',
        progressDelta: 5,
        log: '정수에서 미세한 반응이 기록됐다.',
        preferredRoles: ['analyst'],
      },
    ],
  },
  // hunt
  {
    id: 'hunt_familiar_trail',
    type: 'hunt',
    phase: 'threshold',
    title: '익숙한 흔적',
    description: '사냥감의 흔적이 과거 게이트와 닮아있다.',
    recentCooldown: 3,
    choices: [
      {
        id: 'pursue',
        label: '추격한다',
        description: '흔적을 따라 깊이 들어간다.',
        progressDelta: 8,
        riskDelta: 5,
        log: '추격이 성공했다. 보상이 늘어났다.',
      },
      {
        id: 'retreat_report',
        label: '후퇴 후 보고',
        description: '안전한 선택을 한다.',
        progressDelta: 2,
        riskDelta: -5,
        log: '안전하게 철수했다. 흔적은 기록됐다.',
      },
      {
        id: 'call_analyst',
        label: '분석가 호출',
        description: '패턴을 분석한 뒤 행동한다.',
        progressDelta: 4,
        riskDelta: -2,
        log: '패턴 분석이 진행됐다. 구조가 보였다.',
        preferredRoles: ['analyst'],
      },
      {
        id: 'combat_hunt_gate_boss',
        label: '잔재의 지도자 처단 (전투 돌입)',
        description: '사냥 구역의 정점에 있는 정예 몬스터와 전투를 치릅니다. 승리 시 높은 확률로 대성공 보상을 획득합니다.',
        triggerCombat: true,
        enemyEncounterKey: 'assassin_support',
        enemyBaseLevel: 14,
        log: '차원의 틈새에서 거대한 지도자 개체가 모습을 드러냈습니다! 전투를 치릅니다.',
      },
    ],
  },
  {
    id: 'hunt_hidden_one',
    type: 'hunt',
    phase: 'threshold',
    title: '숨은 한 마리',
    description: '소탕 완료 직전, 한 마리가 너무 조용하다.',
    recentCooldown: 3,
    choices: [
      {
        id: 'finish',
        label: '마무리 공격',
        description: '확실하게 끝낸다.',
        progressDelta: 7,
        riskDelta: 3,
        log: '소탕 완료. 잔재가 없다.',
        preferredRoles: ['assault', 'hunter'],
      },
      {
        id: 'capture',
        label: '포획 시도',
        description: '리스크가 있지만 추가 보상을 노린다.',
        progressDelta: 6,
        riskDelta: 8,
        searchStackDelta: 1,
        log: '추가 수색 보너스가 누적됐다.',
        preferredRoles: ['hunter'],
      },
      {
        id: 'ignore',
        label: '무시한다',
        description: '목표만 달성하고 철수한다.',
        progressDelta: 4,
        riskDelta: -3,
        log: '목표를 달성하고 철수했다.',
      },
    ],
  },
  // scout
  {
    id: 'scout_wrong_map',
    type: 'scout',
    phase: 'threshold',
    title: '잘못된 지도',
    description: '정찰 중 지형이 기록과 어긋난다.',
    recentCooldown: 3,
    choices: [
      {
        id: 'retreat',
        label: '후퇴한다',
        description: '안전하게 철수한다.',
        progressDelta: 2,
        riskDelta: -5,
        log: '안전하게 복귀했다. 지도를 재검토한다.',
      },
      {
        id: 'push',
        label: '강행한다',
        description: '리스크를 감수하고 진입한다.',
        progressDelta: 9,
        riskDelta: 7,
        log: '진입에 성공했다. 하지만 예상보다 위험했다.',
        preferredRoles: ['scout'],
      },
      {
        id: 'remap',
        label: '기록 갱신 후 우회',
        description: '새로운 경로를 찾는다.',
        progressDelta: 5,
        riskDelta: -2,
        log: '새로운 경로를 발견했다. 기록이 갱신됐다.',
        preferredRoles: ['analyst', 'scout'],
      },
      {
        id: 'combat_scout_ambush',
        label: '매복 부대 기습 돌파 (전투 돌입)',
        description: '정찰 도중 매복한 마물 부대를 기습적으로 정면 돌파합니다.',
        triggerCombat: true,
        enemyEncounterKey: 'token_skirmish',
        enemyBaseLevel: 8,
        log: '정찰병들이 사방에서 둘러싸고 있던 매복병들을 인지했습니다! 전투를 통해 활로를 엽니다.',
      },
    ],
  },
  {
    id: 'scout_silent_soldier',
    type: 'scout',
    phase: 'threshold',
    title: '보고가 끊긴 정찰병',
    description: '한 그림자의 보고가 잠시 끊겼다. 단, 잃지는 않았다.',
    recentCooldown: 4,
    choices: [
      {
        id: 'wait',
        label: '전원 대기',
        description: '복귀를 기다린다.',
        progressDelta: 1,
        riskDelta: -4,
        log: '그림자가 복귀했다. 시간이 소모됐다.',
      },
      {
        id: 'send_another',
        label: '다른 그림자 파견',
        description: '수색에 나선다.',
        progressDelta: 5,
        riskDelta: 5,
        log: '파견 그림자가 연락을 재개했다. 위험도가 올랐다.',
        preferredRoles: ['scout'],
      },
      {
        id: 'withdraw',
        label: '전원 후퇴',
        description: '안전을 선택한다.',
        progressDelta: 2,
        riskDelta: -8,
        log: '전원 안전하게 복귀했다.',
      },
    ],
  },
  {
    id: 'special_rift_sanctuary_event_1',
    type: 'special_sanctuary' as any,
    phase: 'threshold',
    title: '균열의 이상 공명',
    description: '전당 하층의 균열이 붉은색 잔향을 내뿜으며 뒤틀리고 있습니다. 정밀 수색할지, 속도를 낼지 결정해야 합니다.',
    choices: [
      {
        id: 'scout_quiet',
        label: '우회 정찰',
        description: '그림자 추적자를 앞세워 조심스럽게 우회 정찰합니다. (진행도 +15, 위험도 -5)',
        progressDelta: 15,
        riskDelta: -5,
        preferredRoles: ['scout'],
        log: '그림자 추적자가 안전한 우회 경로를 파악하여 아군 전열이 안정적으로 진입했습니다.',
      },
      {
        id: 'charge_forward',
        label: '정면 돌파',
        description: '방패병을 앞세워 적들의 경계망을 정면 돌파합니다. (진행도 +35, 위험도 +15)',
        progressDelta: 35,
        riskDelta: 15,
        preferredRoles: ['guard', 'assault'],
        log: '방패병의 비호 아래 돌진대형으로 경계망을 격파하고 빠르게 중심부로 다가갑니다.',
      },
    ],
  },
  {
    id: 'special_rift_sanctuary_event_2',
    type: 'special_sanctuary' as any,
    phase: 'threshold',
    title: '수호병의 등장',
    description: '균열 너머에서 이계의 성좌를 수호하는 고대 수호병이 나타났습니다. 그림자들을 지휘하여 최후의 일전을 준비해야 합니다.',
    choices: [
      {
        id: 'engage_combat',
        label: '결전 결행',
        description: '전투를 결행합니다. 수호병을 처단하고 균열의 정수를 강제 회수합니다.',
        log: '그림자들이 무기를 들어 올리며 수호병을 포위합니다. 전투가 시작됩니다.',
      },
    ],
  },
  {
    id: 'special_abyss_resonance_event_1',
    type: 'special_abyss' as any,
    phase: 'threshold',
    title: '심연의 부름',
    description: '공동의 깊은 어둠 속에서 과거 누군가가 남긴 듯한 좌표 잔향이 흘러나옵니다. 신호를 추적하거나 어둠을 경계해야 합니다.',
    choices: [
      {
        id: 'track_signal',
        label: '신호 해독',
        description: '분석가를 투입하여 기하학적 신호의 진동수를 해독합니다. (진행도 +20, 위험도 -10)',
        progressDelta: 20,
        riskDelta: -10,
        preferredRoles: ['analyst'],
        log: '분석가가 고대 신호를 해독하는 동안, 군단은 안전하고 명확한 좌표 방향을 획득했습니다.',
      },
      {
        id: 'guard_area',
        label: '경계 태세',
        description: '정비 상태를 유지하며 어둠 속 습격을 방어합니다. (진행도 +10, 위험도 -20)',
        progressDelta: 10,
        riskDelta: -20,
        preferredRoles: ['guard', 'support'],
        log: '수호병들의 경계막 아래 전열을 재정비하고 안정적으로 심연 심도로 나아갑니다.',
      },
    ],
  },
  {
    id: 'special_abyss_resonance_event_2',
    type: 'special_abyss' as any,
    phase: 'threshold',
    title: '심연의 폭군',
    description: '과거 세계의 멸망을 노래했던 심연의 폭군이 잠에서 깨어나 포효합니다. 전임자의 비극을 반복하지 않으려면 이 폭군을 쓰러뜨려야 합니다.',
    choices: [
      {
        id: 'trigger_abyss_combat',
        label: '결전 결행',
        description: '폭군과의 결전을 선언합니다. 그림자들이 일제히 무기를 뽑아듭니다.',
        log: '심연의 폭군이 울부짖고, 어둠의 군단이 폭군을 향해 돌격합니다. 전투가 시작됩니다.',
      },
    ],
  },
  // 3. 백화의 제단 수색
  {
    id: 'special_whiteflame_event_1',
    type: 'special_whiteflame' as any,
    phase: 'threshold',
    title: '백화의 화염',
    description: '제단 전방에 이르는 차원 통로가 백색의 강한 화염으로 막혀 있습니다. 조심스럽게 마력을 흘려 끄거나, 힘으로 화염을 가릅니다.',
    choices: [
      {
        id: 'whiteflame_scout',
        label: '마력 결 정찰',
        description: '그림자 정찰병을 시켜 백화의 마력 패턴을 파악하고 정밀하게 우회합니다. (진행도 +18, 위험도 -8)',
        progressDelta: 18,
        riskDelta: -8,
        preferredRoles: ['scout'],
        log: '정찰병이 마력의 흐름이 끊기는 지점을 발견하여, 군단이 안전하게 돌파했습니다.',
      },
      {
        id: 'whiteflame_charge',
        label: '화염 가르기',
        description: '강력한 타격력으로 화염 기둥을 베어내어 즉시 강행 돌파합니다. (진행도 +32, 위험도 +10)',
        progressDelta: 32,
        riskDelta: 10,
        preferredRoles: ['assault'],
        log: '돌격대장이 백화의 마력을 일검에 흩뿌리며 통로를 힘차게 뚫어냈습니다.',
      },
    ],
  },
  {
    id: 'special_whiteflame_event_2',
    type: 'special_whiteflame' as any,
    phase: 'threshold',
    title: '제단의 심판자',
    description: '백화의 불꽃을 다스리는 제단의 심판자가 제단을 지키기 위해 검을 뽑아들었습니다. 전투가 불가피합니다.',
    choices: [
      {
        id: 'engage_whiteflame_combat',
        label: '결전 결행',
        description: '심판자를 쓰러뜨리고 백화의 제단을 평정합니다.',
        triggerCombat: true,
        enemyEncounterKey: 'controller_bruiser',
        enemyBaseLevel: 16,
        log: '백색의 불꽃을 등진 심판자를 향해 그림자들이 일제히 무기를 뽑아 진격합니다. 전투가 시작됩니다.',
      },
    ],
  },

  // 4. 심연의 묘지기 각성
  {
    id: 'special_grave_guard_event_1',
    type: 'special_grave_guard' as any,
    phase: 'threshold',
    title: '묘지의 파수 비석',
    description: '묘지 초입에 영혼을 옥죄는 저주의 파수 비석이 늘어서 있습니다. 마력의 공명을 안정화시키거나 힘으로 격파합니다.',
    choices: [
      {
        id: 'grave_analyst',
        label: '비석 공명 해제',
        description: '분석가를 시켜 비석에 적힌 어둠의 룬을 해독하고 속박을 풉니다. (진행도 +22, 위험도 -12)',
        progressDelta: 22,
        riskDelta: -12,
        preferredRoles: ['analyst'],
        log: '분석가가 룬의 배열을 바꾸자 비석들의 저주가 사그라들어 아군이 가볍게 진격합니다.',
      },
      {
        id: 'grave_guard_block',
        label: '방벽 구축 돌파',
        description: '수호병의 견고한 방벽 아래 저주를 차단하며 전진합니다. (진행도 +15, 위험도 -20)',
        progressDelta: 15,
        riskDelta: -20,
        preferredRoles: ['guard'],
        log: '수호병들의 견고한 방어가 파수 비석의 기세를 찍어누르며 군단을 호위했습니다.',
      },
    ],
  },
  {
    id: 'special_grave_guard_event_2',
    type: 'special_grave_guard' as any,
    phase: 'threshold',
    title: '각성한 심연 묘지기',
    description: '심연 묘지의 지배자이자 거대한 육신을 가진 묘지기가 대검을 치켜들며 군단을 압박해 옵니다.',
    choices: [
      {
        id: 'engage_grave_combat',
        label: '결전 결행',
        description: '묘지기를 격퇴하여 심연 하층의 정수를 획득합니다.',
        triggerCombat: true,
        enemyEncounterKey: 'iron_wall_court',
        enemyBaseLevel: 20,
        log: '묘지기의 거대한 대검이 바닥을 가르자, 그림자들이 맹렬하게 기습을 전개합니다. 전투가 시작됩니다.',
      },
    ],
  },

  // 5. 위상 붕괴 좌표 정찰
  {
    id: 'special_coordinate_collapse_event_1',
    type: 'special_coordinate_collapse' as any,
    phase: 'threshold',
    title: '좌표 왜곡 지대',
    description: '발견된 좌표 주위의 공간이 조각조각 부서지며 차원 붕괴 현상이 일어나고 있습니다. 안전을 최우선으로 할지, 붕괴 속을 돌파할지 정해야 합니다.',
    choices: [
      {
        id: 'coordinate_scout',
        label: '안전 경로 개척',
        description: '신속하게 무너지는 공간의 결을 포착하여 우회로를 찾습니다. (진행도 +18, 위험도 -10)',
        progressDelta: 18,
        riskDelta: -10,
        preferredRoles: ['scout'],
        log: '정찰병이 부서지는 공간 사이로 보이지 않는 중력선을 파악해 가장 안전한 길로 안내했습니다.',
      },
      {
        id: 'coordinate_support',
        label: '위상 유지 보조',
        description: '지원형 그림자들의 힘을 모아 붕괴하는 좌표 주변의 공간을 일시 고정합니다. (진행도 +15, 위험도 -18)',
        progressDelta: 15,
        riskDelta: -18,
        preferredRoles: ['support'],
        log: '지원조가 기하학적 정렬 장막을 펼쳐 왜곡을 억제하며 군단을 전진시켰습니다.',
      },
    ],
  },
  {
    id: 'special_coordinate_collapse_event_2',
    type: 'special_coordinate_collapse' as any,
    phase: 'threshold',
    title: '왜곡의 감시자',
    description: '위상 붕괴 좌표의 한가운데서 균열을 감시하는 다차원 집행자가 나타나 무기를 치켜세웁니다.',
    choices: [
      {
        id: 'engage_coordinate_combat',
        label: '결전 결행',
        description: '집행자를 격퇴하고 위상 붕괴를 조율합니다.',
        triggerCombat: true,
        enemyEncounterKey: 'oblivion_watch',
        enemyBaseLevel: 18,
        log: '집행자의 위상 공격을 무마하며, 군단이 붕괴하는 파편 속에서 격렬히 부딪칩니다. 전투가 시작됩니다.',
      },
    ],
  },

  // 6. 군주의 깊은 잔영
  {
    id: 'special_monarch_gaze_event_1',
    type: 'special_monarch_gaze' as any,
    phase: 'threshold',
    title: '군주의 위압',
    description: '고대 군주의 눈빛이 그림자들의 영혼에 깊은 압박을 가하고 있습니다. 압박에 굴하지 않고 군단의 결속을 다져야 합니다.',
    choices: [
      {
        id: 'monarch_support',
        label: '군주 영혼의 위로',
        description: '지원가들이 군단의 흐트러진 마력을 결속시키고 사기를 보존합니다. (진행도 +15, 위험도 -25)',
        progressDelta: 15,
        riskDelta: -25,
        preferredRoles: ['support'],
        log: '지원조의 마력 흐름이 군단에 평온을 주며 위압감을 이겨냈습니다.',
      },
      {
        id: 'monarch_hunter',
        label: '위압 원천 추적',
        description: '추적자가 위압의 근원지를 탐지하여 기선을 제압합니다. (진행도 +30, 위험도 +10)',
        progressDelta: 30,
        riskDelta: 10,
        preferredRoles: ['hunter'],
        log: '추적자가 위압이 시작되는 어둠의 결을 꿰뚫어 보고 중심부의 좌표를 특정했습니다.',
      },
    ],
  },
  {
    id: 'special_monarch_gaze_event_2',
    type: 'special_monarch_gaze' as any,
    phase: 'threshold',
    title: '군주의 진령',
    description: '위압감의 핵심에 도달하자, 거대한 검은색 갑주를 입은 군주의 메아리가 위엄 있는 목소리로 결전을 준비합니다.',
    choices: [
      {
        id: 'engage_monarch_combat',
        label: '결전 결행',
        description: '군주의 잔영과 결전을 치러 그 권능의 일부를 쟁취합니다.',
        triggerCombat: true,
        enemyEncounterKey: 'boss_double_minion',
        enemyBaseLevel: 28,
        log: '군주의 갑주가 불타오르고, 전사들이 소리치며 거대 심연의 중심을 강타합니다. 전투가 개시됩니다.',
      },
    ],
  },
]

export function pickMidEvent(
  type: ShadowExpeditionType,
  recentEventIds: string[]
): ExpeditionMidEvent | undefined {
  const eligible = MID_EVENTS.filter(event => {
    if (event.type !== 'any' && event.type !== type) return false
    const cooldown = event.recentCooldown ?? 2
    const recentIdx = recentEventIds.lastIndexOf(event.id)
    if (recentIdx >= 0 && recentEventIds.length - recentIdx <= cooldown) return false
    return true
  })
  if (eligible.length === 0) return undefined

  // Weight combat events higher (4x weight) to make shadow battles more frequent
  const weightedList: ExpeditionMidEvent[] = []
  for (const event of eligible) {
    const hasCombat = event.choices.some(c => c.triggerCombat)
    const weight = hasCombat ? 4 : 1
    for (let i = 0; i < weight; i++) {
      weightedList.push(event)
    }
  }
  return weightedList[Math.floor(Math.random() * weightedList.length)]
}

// ── Report Templates ────────────────────────────────────────────────

const REPORT_TITLES: Record<ShadowExpeditionOutcome, string[]> = {
  great_success: ['예상치를 넘은 보고', '완전 임무 완수', '군단 최고 성과'],
  success:       ['원정 완료 보고', '임무 완수 보고', '귀환 완료'],
  partial:       ['부분 완수 보고', '목표 일부 회수', '조기 철수 보고'],
  failure:       ['철수 보고', '임무 중단 보고', '귀환 완료 — 재시도 권고'],
}

const REPORT_OVERVIEW: Record<ShadowExpeditionOutcome, string[]> = {
  great_success: [
    '군단이 영역 깊은 곳까지 도달했다. 모든 목표를 초과 달성했다.',
    '목표를 넘어선 성과가 기록됐다. 군단의 판단이 옳았다.',
    '예상 이상의 성과다. 군단이 스스로 움직였다.',
  ],
  success: [
    '목표를 완수하고 귀환했다. 예정된 성과다.',
    '군단이 임무를 완료했다. 손실 없음.',
    '목표 달성 후 안전하게 귀환했다.',
  ],
  partial: [
    '목표 일부를 회수하고 철수했다. 상황이 허락하지 않았다.',
    '완전한 달성은 아니었지만, 가져올 수 있는 것은 가져왔다.',
    '조기 철수를 선택했다. 군단은 무사하다.',
  ],
  failure: [
    '목표를 달성하지 못했다. 군단은 귀환했다.',
    '이번 원정은 성과 없이 끝났다. 군단은 무사하다.',
    '철수를 결정했다. 기록은 남는다.',
  ],
}

const REPORT_HIGHLIGHT: Record<ShadowExpeditionOutcome, string[]> = {
  great_success: [
    '{name}의 움직임이 결정적이었다.',
    '{name}이 전선을 바꿨다.',
    '{name}이 예상 밖의 성과를 만들었다.',
  ],
  success: [
    '{name}이 중심을 잡았다.',
    '{name}의 역할이 임무를 완성했다.',
    '{name}이 군단을 이끌었다.',
  ],
  partial: [
    '{name}이 후방을 지켰다.',
    '{name} 덕분에 손실 없이 철수했다.',
    '{name}이 남은 것을 챙겼다.',
  ],
  failure: [
    '{name}이 끝까지 자리를 지켰다.',
    '{name}의 판단이 군단을 살렸다.',
    '{name}이 마지막까지 포기하지 않았다.',
  ],
}

const REPORT_HARVEST: Record<ShadowExpeditionOutcome, string[]> = {
  great_success: [
    '목표 초과 달성. 보상이 이어졌다.',
    '기대 이상의 수확이다.',
    '추가 흔적까지 확보됐다.',
  ],
  success: [
    '목표한 만큼을 가져왔다.',
    '계획한 수확이 완료됐다.',
    '예정된 보상이 회수됐다.',
  ],
  partial: [
    '절반 이상을 회수했다.',
    '가져올 수 있는 것은 가져왔다.',
    '손에 잡힌 것이 있다.',
  ],
  failure: [
    '이번에는 빈손이다. 기록만 남았다.',
    '수확은 없지만 기록이 쌓였다.',
    '다음 원정을 위한 정보가 남았다.',
  ],
}

const REPORT_CLOSING: Record<ShadowExpeditionOutcome, string[]> = {
  great_success: [
    '군단의 다음 출정을 기다린다.',
    '이 성과는 기록될 것이다.',
    '군단이 증명했다.',
  ],
  success: [
    '다음 원정이 열린다.',
    '군단이 돌아왔다.',
    '오늘의 성과는 내일로 이어진다.',
  ],
  partial: [
    '다음 원정에서 이어갈 수 있다.',
    '완전한 달성은 다음 기회다.',
    '준비는 됐다. 다음이 있다.',
  ],
  failure: [
    '이 명령은 헛되지 않았다.',
    '군단이 돌아왔다. 그것으로 충분하다.',
    '다음 원정이 기다린다.',
  ],
}

function pickOne(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)]
}

function fillName(template: string, name: string): string {
  return template.replace('{name}', name)
}

export function buildExpeditionReport(
  outcome: ShadowExpeditionOutcome,
  featuredName: string
): ExpeditionReport {
  return {
    title:    pickOne(REPORT_TITLES[outcome]),
    overview: pickOne(REPORT_OVERVIEW[outcome]),
    highlight: fillName(pickOne(REPORT_HIGHLIGHT[outcome]), featuredName),
    harvest:  pickOne(REPORT_HARVEST[outcome]),
    closing:  pickOne(REPORT_CLOSING[outcome]),
  }
}
