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
  return eligible[Math.floor(Math.random() * eligible.length)]
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
