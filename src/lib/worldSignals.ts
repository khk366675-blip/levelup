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
  echo_unresolved_angel: {
    id: 'echo_unresolved_angel',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '미완성 공명',
    body: '결전 좌표의 빛이 잠시 어긋났다가 되돌아옵니다. 닿지 못한 기록이 아직 뒤편에서 흔들립니다.',
    spoilerLevel: 2,
  },
  echo_ultimate_truth: {
    id: 'echo_ultimate_truth',
    source: 'echo' as const,
    tier: 'sealed' as const,
    title: '응축되는 진실',
    body: '대균열의 심연에서 방출되는 빛의 궤적과 플레이어의 흔적이 완벽한 위상 동조를 이룹니다. 종착지가 눈앞에 다가왔습니다.',
    spoilerLevel: 3,
  },
  mystery_v1_clue1: {
    id: 'mystery_v1_clue1',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 예리한 감지',
    body: '어둠 속에서 가장 민첩하게 움직이는 눈이 대지 위에 미세한 파동을 감지합니다.',
    spoilerLevel: 1,
  },
  mystery_v1_clue2: {
    id: 'mystery_v1_clue2',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 외길의 궤적',
    body: '무리로부터 떨어져 나와 오직 홀로 걷는 고독한 좌표만이 왜곡을 바로잡는 열쇠가 됩니다.',
    spoilerLevel: 1,
  },
  mystery_v1_clue3: {
    id: 'mystery_v1_clue3',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 소리 없는 추적',
    body: '바람을 쫓는 자의 발걸음은 소리가 없고, 그 흔적은 오직 허공의 주파수로만 남을 뿐입니다.',
    spoilerLevel: 1,
  },
  mystery_v1_clue4: {
    id: 'mystery_v1_clue4',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 홀로 서는 파수',
    body: '공유되지 않는 정적 속에서, 단 한 명의 파수꾼만이 그 심연의 틈새로 손을 뻗습니다.',
    spoilerLevel: 1,
  },
  mystery_v1_clue5: {
    id: 'mystery_v1_clue5',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 탐색의 기하학',
    body: '끝없는 위상의 경계를 살피고 지도를 복구하는 행렬 속에 해답의 기하학이 숨겨져 있습니다.',
    spoilerLevel: 2,
  },
  mystery_v1_clue6: {
    id: 'mystery_v1_clue6',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 경계의 도정',
    body: '그늘진 경계선을 확인하기 위해 먼 길을 다녀오는 고요한 여정 끝에 숨겨진 보상이 맺힙니다.',
    spoilerLevel: 2,
  },
  mystery_v1_clue7: {
    id: 'mystery_v1_clue7',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 바람의 공명',
    body: '오직 하나의 고독한 바람이 경계의 정찰 임무를 완수하고 귀환할 때, 공간의 뒤틀림이 풀려납니다.',
    spoilerLevel: 2,
  },
  mystery_v1_clue8: {
    id: 'mystery_v1_clue8',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 고립된 자의 해답',
    body: '다른 동료의 손길 없이 홀로 정찰의 길을 개척하는 바람의 자취만이 봉인된 마지막 조각을 완성합니다.',
    spoilerLevel: 2,
  },
  mystery_v2_clue1: {
    id: 'mystery_v2_clue1',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 서고의 고뇌',
    body: '기록의 심연 속에서, 지식을 탐하는 조용한 시선이 책장 사이에서 흔들립니다.',
    spoilerLevel: 1,
  },
  mystery_v2_clue2: {
    id: 'mystery_v2_clue2',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 균열하는 외피',
    body: '형태를 단단하게 고정하던 원래의 껍질에 미세한 균열이 생기며 더 깊은 본질로 도약할 준비를 합니다.',
    spoilerLevel: 1,
  },
  mystery_v2_clue3: {
    id: 'mystery_v2_clue3',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 문자 속의 잔향',
    body: '숫자와 암호화된 잔향을 읽어내던 무형의 조각이 지식의 무게를 견디며 고뇌하고 있습니다.',
    spoilerLevel: 1,
  },
  mystery_v2_clue4: {
    id: 'mystery_v2_clue4',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 서열의 승격',
    body: '한계를 규정짓던 격의 형태가 한 단계 높은 고대의 서열로 승격될 때 차원의 힘이 방출됩니다.',
    spoilerLevel: 1,
  },
  mystery_v2_clue5: {
    id: 'mystery_v2_clue5',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 그림자의 의식',
    body: '스스로의 격을 증명하기 위해 군단의 어둠을 끌어올려 형상을 승화시키는 의식이 필요합니다.',
    spoilerLevel: 2,
  },
  mystery_v2_clue6: {
    id: 'mystery_v2_clue6',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 변천하는 무늬',
    body: '기록의 형태가 새롭게 벼려지고 그 격이 변할 때, 비로소 묻혀 있던 흔적이 스스로를 드러냅니다.',
    spoilerLevel: 2,
  },
  mystery_v2_clue7: {
    id: 'mystery_v2_clue7',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 해독자의 돌파',
    body: '진실을 해독하는 자가 스스로의 껍질을 깨고 더 깊은 격으로 나아갈 때, 봉인이 깨어집니다.',
    spoilerLevel: 2,
  },
  mystery_v2_clue8: {
    id: 'mystery_v2_clue8',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 분석의 각성',
    body: '군단에 기록된 분석의 눈이 자신의 서열 한계를 깨뜨려 진화의 단계를 밟을 때 해답이 도래합니다.',
    spoilerLevel: 2,
  },
  mystery_v3_clue1: {
    id: 'mystery_v3_clue1',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 조율의 오라',
    body: '타인을 북돋우고 대열을 보조하는 어둠의 손길들이 조용히 눈을 듭니다.',
    spoilerLevel: 1,
  },
  mystery_v3_clue2: {
    id: 'mystery_v3_clue2',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 연무장의 모래',
    body: '자신을 벼려내고 힘을 기르는 혹독한 연무장의 모래바람이 불어옵니다.',
    spoilerLevel: 1,
  },
  mystery_v3_clue3: {
    id: 'mystery_v3_clue3',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 삼각의 대열',
    body: '홀로 서는 대신 셋 이상이 모여 어깨를 나란히 할 때, 비로소 대형이 완성됩니다.',
    spoilerLevel: 1,
  },
  mystery_v3_clue4: {
    id: 'mystery_v3_clue4',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 훈련의 발걸음',
    body: '조율하는 자들이 훈련의 여정에 발을 들여놓을 때 흔적이 깊어집니다.',
    spoilerLevel: 1,
  },
  mystery_v3_clue5: {
    id: 'mystery_v3_clue5',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 동조의 공명',
    body: '보조의 오라를 방출하는 세 개의 그림자가 연무장의 차원 격막을 흔듭니다.',
    spoilerLevel: 2,
  },
  mystery_v3_clue6: {
    id: 'mystery_v3_clue6',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 육성의 흔적',
    body: '셋 이상의 지원군이 전력의 육성을 위해 먼 정찰의 훈련을 완수하려 합니다.',
    spoilerLevel: 2,
  },
  mystery_v3_clue7: {
    id: 'mystery_v3_clue7',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 지원의 결말',
    body: '성장의 도정에 대열을 돌보는 세 온기가 함께 머무르며 결실을 맺을 때, 마침내 감춰진 길이 열립니다.',
    spoilerLevel: 2,
  },
  mystery_v3_clue8: {
    id: 'mystery_v3_clue8',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 조율된 연무',
    body: '오직 다른 이를 북돋우는 세 줄기 그림자만이 스스로를 담금질하는 긴 여정에서 살아 돌아올 때, 봉인된 조각이 맞춰집니다.',
    spoilerLevel: 2,
  },
  mystery_v4_clue1: {
    id: 'mystery_v4_clue1',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 칼날의 오라',
    body: '가장 날카로운 칼날을 쥔 그림자가 살기를 뿜습니다.',
    spoilerLevel: 1,
  },
  mystery_v4_clue2: {
    id: 'mystery_v4_clue2',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 철벽의 수호',
    body: '어떤 충격도 흡수하는 굳건한 방패를 든 그림자가 그 뒤를 받칩니다.',
    spoilerLevel: 1,
  },
  mystery_v4_clue3: {
    id: 'mystery_v4_clue3',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 대칭의 대형',
    body: '오직 둘만이 등을 맞댄 고독한 구도가 대지 위에 그려집니다.',
    spoilerLevel: 1,
  },
  mystery_v4_clue4: {
    id: 'mystery_v4_clue4',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 사냥의 어둠',
    body: '피비린내 나는 흔적을 쫓는 혹독한 사냥터의 어둠이 짙어집니다.',
    spoilerLevel: 1,
  },
  mystery_v4_clue5: {
    id: 'mystery_v4_clue5',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 대칭의 칼날',
    body: '검과 방패 한 쌍만이 고립된 사냥의 전장으로 조용히 나아갑니다.',
    spoilerLevel: 2,
  },
  mystery_v4_clue6: {
    id: 'mystery_v4_clue6',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 균형의 오라',
    body: '공격과 수비의 조화가 완벽한 대칭을 이루며 차원 좌표를 자극합니다.',
    spoilerLevel: 2,
  },
  mystery_v4_clue7: {
    id: 'mystery_v4_clue7',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 대칭의 성과',
    body: '공격과 수호의 완벽한 짝이 포식의 영지에서 온전히 둘만의 숨결을 증명할 때, 위상의 궤적이 겹치기 시작합니다.',
    spoilerLevel: 2,
  },
  mystery_v4_clue8: {
    id: 'mystery_v4_clue8',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 공수의 종막',
    body: '그 어떤 도움도 없이, 서로를 등진 두 개의 대칭된 빛만이 차가운 사슬을 끊어내고 복귀할 때 봉인이 풀려납니다.',
    spoilerLevel: 2,
  },
  mystery_v5_clue1: {
    id: 'mystery_v5_clue1',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 침묵하는 어둠',
    body: '거느리던 어둠의 권속들을 모두 그림자 밑으로 되돌려 고요를 만듭니다.',
    spoilerLevel: 1,
  },
  mystery_v5_clue2: {
    id: 'mystery_v5_clue2',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 탑의 관문',
    body: '끝없이 솟구쳐 오른 탑의 가장 높은 관문이 위엄을 드러냅니다.',
    spoilerLevel: 1,
  },
  mystery_v5_clue3: {
    id: 'mystery_v5_clue3',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 고립된 군주',
    body: '동반자 없이 홀로 대적하는 고독한 군주의 형상이 성벽 위에 섭니다.',
    spoilerLevel: 1,
  },
  mystery_v5_clue4: {
    id: 'mystery_v5_clue4',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 날것의 투지',
    body: '그림자 군단을 모두 해제하고 자신의 육신만으로 심판자 앞에 마주합니다.',
    spoilerLevel: 1,
  },
  mystery_v5_clue5: {
    id: 'mystery_v5_clue5',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 독보적 파동',
    body: '어둠의 마력을 걷어낸 순수한 헌터의 파동이 탑의 주파수와 공명합니다.',
    spoilerLevel: 2,
  },
  mystery_v5_clue6: {
    id: 'mystery_v5_clue6',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 수호자의 도발',
    body: '탑의 수호자가 기다리는 층에서, 부리는 자가 힘을 감추고 홀로 승전보를 올리려 합니다.',
    spoilerLevel: 2,
  },
  mystery_v5_clue7: {
    id: 'mystery_v5_clue7',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 고독의 제패',
    body: '거느리던 어둠을 완전히 잠재운 채, 홀로 하늘을 찌르는 관문의 지배자와 마주하여 승리할 때 봉인의 빗장이 풀립니다.',
    spoilerLevel: 2,
  },
  mystery_v5_clue8: {
    id: 'mystery_v5_clue8',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 독보의 전장',
    body: '그림자의 장막을 모두 걷어낸 완전한 고독 속에서, 가장 높은 심판의 대좌를 홀로 딛고 일어설 때 숨겨진 통로가 개방됩니다.',
    spoilerLevel: 2,
  },
  mystery_v6_clue1: {
    id: 'mystery_v6_clue1',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 초심의 영광',
    body: '헌터로서 세상에 처음 발을 들이며 받았던 최초의 격식과 명예가 있습니다.',
    spoilerLevel: 1,
  },
  mystery_v6_clue2: {
    id: 'mystery_v6_clue2',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 초심의 균열',
    body: '차원의 균열이 벌어지는 차가운 전장으로 다시 향합니다.',
    spoilerLevel: 1,
  },
  mystery_v6_clue3: {
    id: 'mystery_v6_clue3',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 예전의 명예',
    body: '강력해진 힘 뒤에 숨겨진 초심의 흔적을 머리에 얹고 어둠을 대면해야 합니다.',
    spoilerLevel: 1,
  },
  mystery_v6_clue4: {
    id: 'mystery_v6_clue4',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 최초의 왕관',
    body: '가장 처음에 얻었던 영광의 왕관을 다시 장착하고 격돌의 순간을 맞이합니다.',
    spoilerLevel: 1,
  },
  mystery_v6_clue5: {
    id: 'mystery_v6_clue5',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 초심의 파동',
    body: '초심의 인장이 방출하는 빛이 게이트 내부의 탁한 마력과 융합하여 기묘한 위상을 이룹니다.',
    spoilerLevel: 2,
  },
  mystery_v6_clue6: {
    id: 'mystery_v6_clue6',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 인장의 승리',
    body: '오래된 기억의 칭호를 머리에 얹고, 차원의 문 너머를 정화하는 승리를 기록해야 합니다.',
    spoilerLevel: 2,
  },
  mystery_v6_clue7: {
    id: 'mystery_v6_clue7',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 초심의 게이트',
    body: '시작의 영광을 머리에 얹고 차원의 장벽을 정화하여 흔적을 지울 때, 끊어졌던 연결 통로가 드러납니다.',
    spoilerLevel: 2,
  },
  mystery_v6_clue8: {
    id: 'mystery_v6_clue8',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 기원의 복원',
    body: '시스템에 처음 발을 들여놓던 날의 오래된 서약을 머리에 이고 붉은 문 너머를 정복할 때, 봉인된 기억이 깨어납니다.',
    spoilerLevel: 2,
  },
  mystery_v7_clue1: {
    id: 'mystery_v7_clue1',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 미미한 소리',
    body: '군단에서 가장 작고 미미하지만 무수히 번지는 어둠의 포식자들이 소동을 일으킵니다.',
    spoilerLevel: 1,
  },
  mystery_v7_clue2: {
    id: 'mystery_v7_clue2',
    source: 'echo' as const,
    tier: 'faint' as const,
    title: '📡 이상 징후: 정찰의 임무',
    body: '위상을 살피고 경계를 파헤치는 탐색의 정찰로가 눈앞에 펼쳐집니다.',
    spoilerLevel: 1,
  },
  mystery_v7_clue3: {
    id: 'mystery_v7_clue3',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 군집의 쥐 떼',
    body: '하찮은 존재 셋이 무리를 지어 대열을 가득 채울 때 뜻밖의 틈새가 발견됩니다.',
    spoilerLevel: 1,
  },
  mystery_v7_clue4: {
    id: 'mystery_v7_clue4',
    source: 'echo' as const,
    tier: 'clear' as const,
    title: '📡 이상 징후: 포식의 궤적',
    body: '쥐 떼만이 정찰의 숲 속으로 조용히 기어들어가 흔적을 남기려 합니다.',
    spoilerLevel: 1,
  },
  mystery_v7_clue5: {
    id: 'mystery_v7_clue5',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 작은 파동',
    body: '미약한 어둠의 파동 세 개가 중첩되어 정찰 좌표의 왜곡을 유도합니다.',
    spoilerLevel: 2,
  },
  mystery_v7_clue6: {
    id: 'mystery_v7_clue6',
    source: 'echo' as const,
    tier: 'distorted' as const,
    title: '📡 이상 징후: 하찮은 대열',
    body: '오직 쥐의 형상만을 대동한 채로, 경계를 정찰하는 고요한 임무를 성공적으로 완수해야 합니다.',
    spoilerLevel: 2,
  },
  mystery_v7_clue7: {
    id: 'mystery_v7_clue7',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 쥐 떼의 정찰',
    body: '가장 천대받던 작은 존재들의 삼중주가 경계를 탐색하고 돌아와 발걸음을 맞출 때 위상의 공명이 봉합됩니다.',
    spoilerLevel: 2,
  },
  mystery_v7_clue8: {
    id: 'mystery_v7_clue8',
    source: 'echo' as const,
    tier: 'severe' as const,
    title: '📡 이상 징후: 작은 군단의 비상',
    body: '다른 무장 없이 오직 세 개의 아주 미약한 그림자들만이 어둠의 길을 살펴 무사히 귀환할 때, 감춰졌던 심연의 보물이 모습을 드러냅니다.',
    spoilerLevel: 2,
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
