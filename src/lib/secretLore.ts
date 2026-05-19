export type SecretLoreContext = 'tower' | 'gate' | 'expedition' | 'shadow' | 'box' | 'rank'
export type SecretHintLevel = 'l1' | 'l2' | 'l3'

export type SecretHintDefinition = {
  id: string
  level: SecretHintLevel
  min: number
  line: string
}

export const SECRET_HINTS: Record<SecretLoreContext, SecretHintDefinition[]> = {
  tower: [
    { id: 'tower-line-1', level: 'l1', min: 2, line: '탑의 기록이 아주 짧게 진동했다.' },
    { id: 'tower-line-2', level: 'l2', min: 5, line: '발밑의 층계가 이전 전투의 흔적을 기억하는 듯하다.' },
    { id: 'tower-line-3', level: 'l3', min: 8, line: '층계 너머의 침묵이 다른 전장의 응답을 기다린다.' },
  ],
  gate: [
    { id: 'gate-line-1', level: 'l1', min: 2, line: '협회 단말에 출처를 알 수 없는 짧은 보고가 남았다.' },
    { id: 'gate-line-2', level: 'l2', min: 5, line: '균열 너머에서 탑과 닮은 압력이 스쳐 지나갔다.' },
    { id: 'gate-line-3', level: 'l3', min: 8, line: '현장 기록 일부가 그림자 원정 보고와 같은 문양을 가리킨다.' },
  ],
  expedition: [
    { id: 'expedition-line-1', level: 'l1', min: 2, line: '귀환 보고서 끝에 읽을 수 없는 검은 인장이 찍혔다.' },
    { id: 'expedition-line-2', level: 'l2', min: 5, line: '그림자들이 같은 방향으로 고개를 숙였다.' },
    { id: 'expedition-line-3', level: 'l3', min: 8, line: '보고서의 여백이 탑과 게이트의 기록을 함께 물고 돌아왔다.' },
  ],
  shadow: [
    { id: 'shadow-line-1', level: 'l1', min: 2, line: '추출의 잔향이 평소보다 오래 손끝에 남았다.' },
    { id: 'shadow-line-2', level: 'l2', min: 5, line: '몇몇 그림자가 이름 없는 명령을 기다리는 듯하다.' },
    { id: 'shadow-line-3', level: 'l3', min: 8, line: '군단의 일부가 아직 내려지지 않은 명령을 먼저 알아챘다.' },
  ],
  box: [
    { id: 'box-line-1', level: 'l1', min: 2, line: '상자 안쪽에 사라지는 문양이 잠깐 떠올랐다.' },
    { id: 'box-line-2', level: 'l2', min: 4, line: '보상 기록 사이에 낯선 여백이 생겼다.' },
    { id: 'box-line-3', level: 'l3', min: 7, line: '정산되지 않은 흔적 하나가 다른 기록과 맞물렸다.' },
  ],
  rank: [
    { id: 'rank-line-1', level: 'l1', min: 2, line: '시스템 평가 뒤편에서 다른 기준이 함께 움직였다.' },
    { id: 'rank-line-2', level: 'l2', min: 4, line: '성장의 기록이 세 방향으로 갈라졌다가 다시 합쳐졌다.' },
    { id: 'rank-line-3', level: 'l3', min: 7, line: '쌓아온 기록이 하나의 응답으로 정렬되기 시작했다.' },
  ],
}

export const SECRET_MESSAGES = {
  firstTrace: {
    title: '기록의 여백',
    lines: ['읽을 수 없는 기록 조각이 조용히 남았다.'],
  },
  fragmentTrace: {
    title: '기록의 여백',
    lines: ['흐릿하던 기록 조각이 조금 더 선명해졌다.'],
  },
  hint: {
    title: '이상한 신호',
  },
  resonance: {
    title: '희미한 반향',
    lines: ['서로 다른 기록들이 아주 짧게 같은 방향을 가리켰다.'],
  },
  reward: {
    tower: { title: '희미한 공명', lines: ['보상 사이에 작은 잔향이 더해졌다.'] },
    expedition: { title: '조용한 회수', lines: ['귀환한 그림자가 작은 잔재를 바쳤다.'] },
    box: { title: '상자의 잔향', lines: ['상자 바닥에 남은 빛이 정수로 가라앉았다.'] },
  },
  shadowMark: {
    title: '낯선 흔적',
    lines: ['그림자 하나가 말없이 새로운 흔적을 받아들였다.'],
  },
  retrospective: {
    tower: { title: '오래된 발자취', lines: ['이미 지나온 층계가 조용히 다시 울렸다.'] },
    gate: { title: '누적된 현장 기록', lines: ['이전 균열의 보고들이 짧게 한 줄로 정렬되었다.'] },
    expedition: { title: '남아 있던 명령', lines: ['그림자들이 예전 명령의 끝을 아직 기억하고 있었다.'] },
  },
}
