import { useState, useEffect, useRef } from 'react'
import {
  Globe,
  Lock,
  Eye,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  X,
  Swords,
  Shield,
  Zap,
  Trophy,
} from 'lucide-react'
import {
  useGame,
  COOP_HELP_ATK_FACTOR,
  COOP_HELP_DEF_FACTOR,
  COOP_HELP_DR_FACTOR,
  COOP_HELP_DR_CAP,
  COOP_REWARD_PENALTY_PER_HELPER,
  COOP_REWARD_MIN_RATIO,
} from '../lib/store'
import { RIFT_REGIONS, RIFT_NODES } from '../lib/seed'
import { MONARCHS, FINAL_ANGEL } from '../lib/monarchs'
import { getRegionProgress, RIFT_NODE_STATUS_META } from '../lib/riftWorld'
import { getRegionTotalPower } from '../lib/livingWorld'
import { GatePanel } from './GatePanel'
import { WorldCinematicEngine } from './WorldCinematicEngine'
import type { RiftNode, RiftRegion, WorldEvent } from '../lib/types'
import { getHunterCombatPower } from '../lib/combatPower'
import { todayKey } from '../lib/game'
import { getRegionalTheme } from '../lib/livingWorldGateContent'
import { getHunterTrait } from '../lib/hunterTraits'
import { getEchoTruthReadiness } from '../lib/secrets'

// D3 World Map Imports & Initialization
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo'
import { feature } from 'topojson-client'
import worldAtlasData from 'world-atlas/countries-110m.json'
import { select } from 'd3-selection'
import { zoom, zoomIdentity } from 'd3-zoom'
import 'd3-transition'

// Country Name Mapping to game region IDs
const getRegionIdByCountryName = (name: string): string | null => {
  if (!name) return null
  const lowerName = name.toLowerCase()
  if (lowerName.includes('united states')) return 'us'
  if (lowerName.includes('canada')) return 'ca'
  if (lowerName.includes('mexico')) return 'mx'
  if (lowerName.includes('brazil')) return 'br'
  if (lowerName.includes('united kingdom')) return 'uk'
  if (lowerName.includes('germany')) return 'de'
  if (lowerName.includes('france')) return 'fr'
  if (lowerName.includes('italy')) return 'it'
  if (lowerName.includes('russia')) return 'ru'
  if (lowerName.includes('egypt')) return 'eg'
  if (lowerName.includes('india')) return 'in'
  if (lowerName.includes('china')) return 'cn'
  if (lowerName.includes('korea') || lowerName.includes('south korea')) return 'kr'
  if (lowerName.includes('japan')) return 'jp'
  if (lowerName.includes('australia')) return 'au'
  return null
}

const MAP_WIDTH = 800
const MAP_HEIGHT = 450

// Natural Earth 1 projection optimized for aspect ratio
const projection = geoNaturalEarth1()
  .scale(132)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2])

const pathGenerator = geoPath().projection(projection)
const graticuleGenerator = geoGraticule10()

// Convert TopoJSON to GeoJSON features
let worldFeatures: any[] = []
try {
  worldFeatures = (feature(worldAtlasData as any, worldAtlasData.objects.countries as any) as any).features
} catch (err) {
  console.error('Failed to parse world-atlas TopoJSON:', err)
}

// Live intercept quotes mapping global corruption level to immersive Korean reactions
// Live intercept quotes mapping global corruption level to immersive Korean reactions
const CITIZEN_INTERCEPTS = {
  serene: [
    '🎙️ [뉴스 속보] 기상청 "금일 대기 마력 파동 매우 안정적... 전국 날씨 맑음"',
    '💬 [SNS] "요즘 던전 마석 가공 산업이 호황이라 주식 대박 났네요. 다들 대장비 시대 돌입!"',
    '🛡️ [헌터 협회 소통망] "게이트 난이도가 평년 수준입니다. 신입 교육 일정 차질 없이 진행합니다."',
    '🗣️ [시민 인터뷰] "한국 국가권력급 헌터 분들이 뒤를 든든하게 받쳐주니 마음 편하게 출퇴근하죠."',
    '📡 [글로벌 마력망] "미국-영국 던전 공동 정화 성공률 98% 돌파... 평화로운 나날 지속"',
    '💬 [SNS] "주말에 헌터 협회 견학 다녀왔는데 다들 기운이 엄청나더라고요. 인류 수호선은 든든합니다!"',
    '🎙️ [비즈니스 마켓] "던전 마력석 가공 주얼리 브랜드 매출 급증... 패션 트렌드로 부상"',
    '🗣️ [지하철 대화] "요즘은 게이트가 열려도 사이렌이 안 울리더라고요. 바로 정화 완료되니까요."',
    '🛡️ [길드 연합 주간지] "전역 마나 밀도 최저 수준 기록. 헌터들의 훈련 집중도 최대치 도달."',
    '📡 [마력 방송 인터뷰] "헌터 그레이드 측정기가 업그레이드되었습니다. 더욱 정밀한 랭킹 조회가 가능해집니다."',
    '🎙️ [헌터 아카데미] "올해 수석 졸업생 최지훈 군, 차세대 국가권력급 유망주로 지목."',
    '💬 [SNS] "한강 둔치에서 마력 정화 버블 놀이하는데 꼬마들이 엄청 좋아하네요. 평화롭다~"',
    '🛡️ [길드 마스터 회의] "유럽 전역 던전 관리 상태 양호. 장비 소모품 공급 과잉 현상 대처법 논의."',
    '🗣️ [직장인 대화] "던전 탐험 예능 진짜 재밌지 않냐? 요새 최애 헌터 굿즈 모으는 중임."',
    '📡 [라디오 인터뷰] "마나 에너지 하이브리드 차량 출시! 1회 충전으로 서울-부산 30회 왕복 가능!"',
    '🎙️ [글로벌 통계] "올해 전 세계 게이트 발생 건수 역대 최저. 전력 예비율 사상 최고치."',
    '💬 [SNS] "던전 마나 온천 패키지 다녀옴! 마력으로 피로를 녹여주니까 피부 톤이 완전 미쳤어... 강추!"',
    '🛡️ [보안 통제실] "한국 영토 내 비활성 마력 격벽 상태 청정. 특별 경계령 해제 검토."',
    '🗣️ [시민 광장] "헌터 연봉이 너무 높다는 불평도 있지만, 그분들이 목숨 걸고 지켜주니까 안심하고 노는 거죠."',
    '📡 [학술 발표회] "마력 입자의 의학적 활용 임상 3상 완료. 희귀병 완치율 90% 달해."'
  ],
  alert: [
    '🎙️ [긴급 속보] 일부 국가 차원 오염도 30% 근접... 방재 특별 구역 지정 검토 중',
    '💬 [SNS] "어제 인접 국가 게이트 터지는 소리가 여기까지 들렸어요... 진짜 피난 짐 싸야 하나?"',
    '🛡️ [헌터 협회 소통망] "마수들의 생체 마력이 이상 급증하고 있습니다. 초소 경계를 2단계로 상향합니다."',
    '🗣️ [시민 인터뷰] "대형 마트 통조림이랑 비상식량 매대가 벌써 다 비었어요. 너무 불안합니다."',
    '📡 [글로벌 마력망] "S급 게이트 징후 도처에서 감지... 헌터 길드 연합, 상호 지원 프로토콜 활성화"',
    '🎙️ [재난 대책 본부] "마력 방벽 노후화 구간 긴급 수리 개시. 시민 여러분은 비상 매뉴얼을 숙지해 주십시오."',
    '🗣️ [길거리 대담] "방벽 근처에 사는 사람들은 벌써 이사 가기 시작했대요. 정부 지원금이라도 줘야 하는 거 아닙니까?"',
    '💬 [SNS] "밤하늘에 가끔 균열 틈새가 청록색으로 번뜩이는데 기분이 너무 묘해요... 몸이 떨리네요."',
    '🛡️ [전선 통신망] "용병 매칭 건수가 어제보다 40% 증가했습니다. 최전방 방어선 마력 부하 경고."',
    '📡 [라디오 인터뷰] "일부 비네임드 A급 헌터들이 해외 던전 지원 소집에 자원하여 공항으로 향하고 있습니다."',
    '🎙️ [세계 마나 포럼] "유라시아 동부 균열 왜곡률 이상 급증. 각국 방어군 연합 재조정 필요."',
    '💬 [SNS] "요즘 방벽 검문 왜 이리 빡세냐? 헌터 차량들 사이렌 켜고 계속 지나가네. 무슨 일 있나..."',
    '🛡️ [길드 마스터 성명] "예비 헌터 소집 대기령을 A급까지 확대합니다. 즉시 장비 정비를 완료하십시오."',
    '🗣️ [민간 방재관 인터뷰] "최근 마나 감지기 리드 타임이 30초 단축됐어요. 그만큼 게이트 팽창 속도가 빠르다는 뜻입니다."',
    '📡 [에너지 분석망] "해외 차원 오염 유입 가능성 농후. 서해안 방위 격벽 출력 120% 가동 권장."',
    '🎙️ [긴급 재난 특보] "서태평양 해류 마력 수치 비정상 돌파... 선박 및 항공기 운항 통제 예정."',
    '💬 [SNS] "마나 감지 앱에서 계속 알림 오는데 무서워서 못 자겠어요. 이거 오류 맞죠? 제발..."',
    '🛡️ [헌터 협회 전술실] "대한민국 동부 해안 마나 간섭 무늬 포착. 초소 전력 1.5배 보강 조치."',
    '🗣️ [대형 피난소 현장] "구호용 텐트와 물이 더 필요합니다. 예산 배정이 늦어지면 큰 혼란이 올 겁니다."',
    '📡 [글로벌 뉴스 라디오] "일부 중소국가들, 게이트 억제 실패로 헌터 탈출 행렬... 인접국들 국경 긴장 완화 촉구."'
  ],
  fear: [
    '🎙️ [전쟁 위기 선포] 차원 오염 급속 전파! 방어막 유지 붕괴 위기... 전국 비상 전시에 준하는 특별 조치 발동',
    '💬 [SNS] "옆 도시가 균열 폭풍에 휘말려 완전히 통제 불능이 되었대요... 헌터님들 제발 우리를 살려주세요!"',
    '🛡️ [헌터 협회 소통망] "부상자가 너무 많아 회복 약이 동났습니다... 더 이상 버틸 예비 전력이 없습니다!"',
    '🗣️ [시민 인터뷰] "하늘에 보라색 번개가 계속 쳐요... 무서워서 애를 데리고 지하 대피소 밖으로 나갈 수 없습니다."',
    '📡 [글로벌 마력망] "군주 급 개체의 활동성 급증... 이미 동구권 연합 지휘소가 파괴되었습니다."',
    '🎙️ [속보] 러시아 전역 계엄령 선포... 게이트 주변 마력 폭풍으로 대규모 피난 행렬 발생',
    '🗣️ [지하 벙커 방송] "식수와 비상 전력이 부족합니다. 배급을 1일 1회로 제한하오니 협조 바랍니다."',
    '💬 [SNS] "국가권력급 네임드 헌터들이 방어선에서 피를 흘리며 후퇴했다는 찌라시가 돌고 있어요... 진짜 끝인가요?"',
    '🛡️ [최전방 통신] "치유 계열 헌터들이 마력 고갈로 쓰러졌습니다! 후방 차단 격벽 폐쇄를 승인해주십시오!"',
    '📡 [글로벌 뉴스 채널] "전 세계 항로 및 무역망 전면 폐쇄. 균열 심해에서 침식 파동 감지."',
    '🎙️ [국방부 특별 담화] "한국 영토 외곽 최후 저항선 구축 개시. 모든 가용 장비와 물자 징발령 선포."',
    '💬 [SNS] "외국 뉴스 보는데 국경 무너진 나라들 난민 수용 한계 넘었대... 우리나라 방벽도 무너지면 끝이잖아..."',
    '🛡️ [헌터 협회 긴급 지령] "전사자 및 부상 헌터 발생 수 급증. S급 네임드 분들은 신체 마력 무시하고 즉시 비상 소집!"',
    '🗣️ [주민 대피소] "아들 녀석이 A급 자원 헌터로 차출됐는데, 무사히 돌아올 수 있을까요... 매일 기도만 합니다."',
    '📡 [마력 통신 감청] "아아... 들리나? 사령부 무너졌다! 생존 헌터들은 즉시 개별 생존 프로토콜로..."',
    '🎙️ [속보] 일본 전역 대피 명령... 도쿄 상공 초대형 균열 심각 단계 도달, 국경 초토화 위험',
    '🗣️ [라디오 임시 채널] "전력 공급이 간헐적입니다. 라디오 배터리를 아끼고 정부 통제령에만 채널을 맞추세요."',
    '💬 [SNS] "우리 네임드 헌터님들 이름 검색하니까 전부 \'상태: 부상/요양\'으로 뜨는데... 내 심장이 덜컥 내려앉음..."',
    '🛡️ [요새 사령관 절규] "탄약과 마나 배터리가 떨어졌다! 공중 포격 지원은 왜 아직도 안 오나! 한 시가 급하다!"',
    '📡 [글로벌 마나 감지] "아시아-태평양 상공 대형 소용돌이 관측. 차원 붕괴 한계선 돌파 시점 72시간 남음."'
  ],
  despair: [
    '🎙️ [종말의 카운트다운] 세계 차원 오염도 극값 돌파. 균열 지평선 하늘을 뒤덮어... 생존을 위한 마지막 기도를 올리십시오',
    '💬 [SNS] "하늘 전체가 피빛으로 물들었습니다. 괴수들의 날갯짓 소리가 고막을 찢네요... 인류에게 내일은 없는 건가요?"',
    '🛡️ [헌터 협회 소통망] "군단이 거점을 완전히 에워쌌습니다. 통신 두절 임박... 우리 뒤는 이제 민간인뿐이다. 최후의 항전을!"',
    '🗣️ [시민 인터뷰] "국가권력급 헌터 분들도 다 쓰러졌대요... 이제 누가 우릴 구해주죠? 구원자는 정녕 없습니까?"',
    '📡 [글로벌 마력망] "🚨 초비상 🚨 대한민국 거점 심연의 군주 다이렉트 침공 돌파! 세계 최종 파멸 방어선 가동"',
    '🎙️ [마지막 방송] "이 방송이 인류 역사상 마지막 소리가 될지도 모르겠습니다. 여러분, 부디 침묵 속에서 종말을..."',
    '💬 [SNS] "내일 멸망하더라도 전 끝까지 가족의 손을 놓지 않을 겁니다. 신이여... 한 번만 기적을 내려주십시오."',
    '🛡️ [절망의 보초망] "마력 차단기가 터졌습니다. 군주들의 그림자가 방벽 너머로 기어 올라오고 있습니다. 사격 개시!"',
    '🗣️ [폐허 속 라디오] "모든 대륙의 정부 기능이 정지되었습니다. 우리에게 남겨진 땅은 이제 대한민국 거점뿐입니다."',
    '📡 [마지막 구조 신호] "이 메시지를 듣는 생존자가 있다면... 부디 포기하지 말고 마지막 구원자를 기다리십시오..."',
    '🎙️ [최후의 보루] "전 지구상에 독립 행정이 유지 중인 국가는 단 한 곳, 대한민국뿐입니다. 끝까지 저항하십시오!"',
    '💬 [SNS] "어두운 하늘에서 피눈물이 내립니다. 마수들의 울부짖음이 도시를 뒤흔들어요... 지구여..."',
    '🛡️ [연합 방어선 통신] "대원 80% 전멸. 남은 마력 차단기 1기... 이것마저 꺼지면 끝이다. 마지막 불꽃을 태우자!"',
    '🗣️ [방벽 아래 텐트] "신을 원망하지도 않습니다. 단지 고통 없이 눈을 감게만 해주세요... 안녕, 우리들의 세계."',
    '📡 [절멸 보고] "유럽/아메리카 연합 격벽 침묵. 생존 신호 수신 불가... 오직 대한민국의 격벽만이 홀로 고동칩니다."',
    '🎙️ [인류 최후 방송] "언젠가 후세가 우리 기록을 발견한다면... 우리가 끝까지 포기하지 않고 싸웠음을 기억해주길..."',
    '💬 [SNS] "방벽 밖 하늘에 붉은 마룡이 날아다녀요. 이 세상의 끝은 이토록 아름답고 절망적이군요."',
    '🛡️ [총공격 명령] "마력 충전 완료. 네임드, 비네임드 구분 없이 모든 무장 생존자는 격벽 앞으로 집결하라! 돌격!"',
    '🗣️ [폐墟 라디오 송신] "누군가 듣고 계신가요? 이곳은 서울 지하 3구역 대피소... 제발... 누구라도 대답 좀..."',
    '📡 [종말 징후] "전 지구 해수면 붉은 마나 플라즈마 증발 시작. 차원의 장벽이 완벽히 허물어졌습니다."'
  ]
}

// Calculate precomputed centroids for our 15 game countries with adjustments for optimal visual alignment
const REGION_CENTROIDS: Record<string, [number, number]> = {}
const CENTROID_ADJUSTMENTS: Record<string, [number, number]> = {
  us: [-20, 10],
  ca: [-10, 15],
  ru: [25, 10],
  cn: [-5, 5],
  kr: [1, -2],
  jp: [2, -2],
  au: [0, -5],
  uk: [-3, -6],
  fr: [-2, 2],
  de: [0, -2],
  it: [0, 2],
  in: [-2, -2],
  eg: [0, -2],
  br: [2, 2],
  mx: [-5, 0],
}

worldFeatures.forEach((f: any) => {
  const name = f.properties?.name
  const rId = getRegionIdByCountryName(name)
  if (rId) {
    const centroid = pathGenerator.centroid(f)
    if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
      const adj = CENTROID_ADJUSTMENTS[rId] || [0, 0]
      REGION_CENTROIDS[rId] = [centroid[0] + adj[0], centroid[1] + adj[1]]
    }
  }
})



const REGION_FLAGS: Record<string, string> = {
  us: '🇺🇸',
  ca: '🇨🇦',
  mx: '🇲🇽',
  uk: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  it: '🇮🇹',
  cn: '🇨🇳',
  jp: '🇯🇵',
  kr: '🇰🇷',
  ru: '🇷🇺',
  in: '🇮🇳',
  br: '🇧🇷',
  au: '🇦🇺',
  eg: '🇪🇬',
}

function classifyEventLog(log: string) {
  if (!log || typeof log !== 'string') {
    return {
      badge: '📢 SYSTEM',
      badgeClass: 'bg-zinc-800/80 text-zinc-400',
      textClass: 'text-zinc-500 italic'
    }
  }
  const isAngel = log.includes('Angel') || log.includes('천사') || log.includes('지고의')
  const isMonarch = log.includes('군주') || log.includes('침공') || log.includes('거점')
  const isCollapse = log.includes('폭주') || log.includes('붕괴') || log.includes('위험')
  const isLoveCall = log.includes('러브콜') || log.includes('지원')
  const isCleared = log.includes('격퇴') || log.includes('정화') || log.includes('성공') || log.includes('완치')
  const isAlliance = log.includes('헌터') || log.includes('부상') || log.includes('퇴각') || log.includes('동맹')

  if (isAngel) {
    return {
      badge: '🏆 ULTIMATE',
      badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-glow-amber scale-95 origin-left shrink-0',
      textClass: 'text-amber-200 font-extrabold shadow-glow-amber/5'
    }
  }
  if (isMonarch) {
    return {
      badge: '🚨 CRITICAL',
      badgeClass: 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse font-black scale-95 origin-left shrink-0',
      textClass: 'text-red-400 font-black animate-pulse'
    }
  }
  if (isCollapse) {
    return {
      badge: '💥 COLLAPSE',
      badgeClass: 'bg-orange-500/10 border-orange-500/30 text-orange-400 scale-95 origin-left shrink-0',
      textClass: 'text-orange-400 font-bold'
    }
  }
  if (isLoveCall) {
    return {
      badge: '📞 LOVE CALL',
      badgeClass: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300 scale-95 origin-left shrink-0',
      textClass: 'text-yellow-300'
    }
  }
  if (isCleared) {
    return {
      badge: '🛡️ CLEARED',
      badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 scale-95 origin-left shrink-0',
      textClass: 'text-emerald-400 font-bold'
    }
  }
  if (isAlliance) {
    return {
      badge: '🤝 ALLIANCE',
      badgeClass: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 scale-95 origin-left shrink-0',
      textClass: 'text-cyan-300/90 font-medium'
    }
  }
  return {
    badge: '📡 SIGNAL',
    badgeClass: 'bg-zinc-800/20 border-zinc-700/20 text-zinc-400 scale-95 origin-left shrink-0',
    textClass: 'text-zinc-400/90'
  }
}

export function WorldMapPanel() {
  const riftNodesState = useGame((s) => s.riftNodes ?? {})
  const activeRiftNodeId = useGame((s) => s.activeRiftNodeId)
  const activeGate = useGame((s) => s.activeWorldGate)
  const discoverRiftNode = useGame((s) => s.discoverRiftNode)
  const enterRiftNode = useGame((s) => s.enterRiftNode)
  const livingWorld = useGame((s) => s.livingWorld)
  const secretProgress = useGame((s) => s.secretProgress)
  const echoTruthReadiness = getEchoTruthReadiness(secretProgress)

  // L3 전용 신설 월드맵 상태 및 액션 연동
  const worldBattleRetreats = useGame((s) => s.worldBattleRetreats ?? {})
  const manualSession = useGame((s) => s.manualBattleSession)
  const startWorldManualBattle = useGame((s) => s.startWorldManualBattle)
  const resolveEndingChoice = useGame((s) => s.resolveEndingChoice)

  // 헌터 스펙 및 실효 CP 연동용 상태
  const hunter = useGame((s) => s.hunter)
  const items = useGame((s) => s.items)
  const equipment = useGame((s) => s.equipment)
  const ownedShadows = useGame((s) => s.ownedShadows ?? [])
  const equippedShadowIds = useGame((s) => s.equippedShadowIds ?? [])
  const activeConsumableEffects = useGame((s) => s.activeConsumableEffects ?? [])

  const equippedShadows = ownedShadows.filter((s) => equippedShadowIds.includes(s.instanceId))

  // 실효 CP (본체 + 장착 섀도우 CP 합산)
  const playerPower = getHunterCombatPower({
    hunter,
    items,
    equipment,
    ownedShadows,
    equippedShadowIds,
    activeConsumableEffects,
  })

  // D3 Zoom & Overlay HUD States
  const [zoomTransform, setZoomTransform] = useState(() => {
    const krCoords = REGION_CENTROIDS['kr'] || [580, 180]
    const initialScale = 1.5
    const tx = MAP_WIDTH / 2 - krCoords[0] * initialScale
    const ty = MAP_HEIGHT / 2 - krCoords[1] * initialScale
    return { k: initialScale, x: tx, y: ty }
  })
  const [isLoveCallsExpanded, setIsLoveCallsExpanded] = useState(true)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const zoomBehaviorRef = useRef<any>(null)

  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(null)
  const [regionSortBy, setRegionSortBy] = useState<'danger' | 'purify' | 'name'>('danger')
  const [activeDetailRegion, setActiveDetailRegion] = useState<RiftRegion | null>(null)
  const [isAllLogsExpanded, setIsAllLogsExpanded] = useState(false)
  const [selectedNode, setSelectedNode] = useState<RiftNode | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [selectedHelpers, setSelectedHelpers] = useState<string[]>([])

  // Stage 2: Settings HUD and scrolling ticker states
  const [animationMode, setAnimationMode] = useState<'all' | 'critical' | 'off'>('all')
  const [animationSpeed, setAnimationSpeed] = useState<1.0 | 1.5 | 2.0>(1.0)
  const [tickerOffset, setTickerOffset] = useState(0)

  // Rotate scrolling news quote every 14 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerOffset(prev => prev + 1)
    }, 14000)
    return () => clearInterval(interval)
  }, [])

  // State & Ref for SVG Map Shockwaves & Ripple VFX
  const [mapEffects, setMapEffects] = useState<Array<{
    id: string
    x: number
    y: number
    color: string
    type: string
    regionId: string
  }>>([])
  const processedMapEvents = useRef<Set<string>>(new Set())
  const lastProcessedMapDay = useRef<number>(-1)

  useEffect(() => {
    if (!livingWorld?.recentEvents || livingWorld.recentEvents.length === 0) return

    const currentDay = livingWorld.day ?? 1
    if (currentDay <= 1 || currentDay < lastProcessedMapDay.current) {
      processedMapEvents.current.clear()
    }
    lastProcessedMapDay.current = currentDay

    const newEffects: typeof mapEffects = []

    livingWorld.recentEvents.forEach(evt => {
      if (processedMapEvents.current.has(evt.id)) return
      processedMapEvents.current.add(evt.id)

      if (evt.regionId) {
        const centroid = REGION_CENTROIDS[evt.regionId]
        if (centroid) {
          const [x, y] = centroid
          let color = '#ef4444' // default red
          if (evt.type === 'awakening') color = '#eab308' // gold
          else if (evt.type === 'defeated') color = '#10b981' // emerald green for purification
          else if (evt.type === 'home_threat' || evt.type === 'home_reached') color = '#dc2626' // bright red
          else if (evt.type === 'occupied' || evt.type === 'expand') color = '#f43f5e' // rose
          else if (evt.type === 'sgrade_gate') color = '#a855f7' // S-grade violet
          else if (evt.type === 'gate_surge') color = '#f97316' // orange
          else if (evt.type === 'gate_open') color = '#06b6d4' // cyan

          const effectId = `eff-${evt.id}-${Date.now()}`
          newEffects.push({
            id: effectId,
            x,
            y,
            color,
            type: evt.type,
            regionId: evt.regionId
          })

          // Auto-remove after 4.5 seconds to allow full CSS animation playback
          setTimeout(() => {
            setMapEffects(prev => prev.filter(eff => eff.id !== effectId))
          }, 4500)
        }
      }
    })

    if (newEffects.length > 0) {
      setMapEffects(prev => [...prev, ...newEffects])
    }
  }, [livingWorld?.recentEvents])

  // [NEW] 통합 보고서 관련 상태 (일일 정세 / 국가별 상세 / 세계 헌터 랭킹)
  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'country' | 'hunter' | null>(null)
  const [selectedReportRegionId, setSelectedReportRegionId] = useState<string>('kr')
  const [selectedReportDay, setSelectedReportDay] = useState<number | null>(null)
  const [hunterRankingSubTab, setHunterRankingSubTab] = useState<'individual' | 'region'>('individual')

  const openReport = (tab: 'daily' | 'country' | 'hunter', regionId?: string) => {
    const summaries = livingWorld?.dailySummaries ?? []
    const maxSummaryDay = summaries.length > 0 ? summaries[summaries.length - 1].day : 0
    if (selectedReportDay === null || selectedReportDay === 0) {
      setSelectedReportDay(maxSummaryDay)
    }
    if (regionId) {
      setSelectedReportRegionId(regionId)
    }
    setActiveReportTab(tab)
  }

  const openDailyReport = () => {
    openReport('daily')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveReportTab(null)
      }
    }
    if (activeReportTab) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [activeReportTab])

  const worldNode = selectedNode ? livingWorld?.riftNodes[selectedNode.id] : null
  const hasLoveCall = worldNode?.loveCall?.active
  const loveCallState = worldNode?.loveCall

  const handleHelperToggle = (hid: string) => {
    if (selectedHelpers.includes(hid)) {
      setSelectedHelpers(selectedHelpers.filter(id => id !== hid))
    } else {
      setSelectedHelpers([...selectedHelpers, hid])
    }
  }

  const activeHelpers = selectedHelpers.map(hid => livingWorld?.namedHunters[hid]).filter(Boolean) as any[]
  const coopHelperCount = activeHelpers.length
  const coopHelperPower = activeHelpers.reduce((sum, h) => sum + h.power, 0)

  const coopBuffs = {
    atk: Math.round(COOP_HELP_ATK_FACTOR * coopHelperPower),
    def: Math.round(COOP_HELP_DEF_FACTOR * coopHelperPower),
    dr: Math.min(COOP_HELP_DR_CAP, COOP_HELP_DR_FACTOR * coopHelperCount),
    rewardRatio: Math.max(COOP_REWARD_MIN_RATIO, 1 - COOP_REWARD_PENALTY_PER_HELPER * coopHelperCount)
  }

  // 로컬 확인 모달 제어용 상태
  const [showRecklessConfirm, setShowRecklessConfirm] = useState(false)
  const [recklessConfirmType, setRecklessConfirmType] = useState<'auto' | 'manual'>('auto')
  // 1. selectedNode 유효성 검증 (존재하지 않는 노드 정리)
  useEffect(() => {
    if (selectedNode) {
      if (selectedNode.id === 'angel') {
        if (!livingWorld?.angelReady) {
          setSelectedNode(null)
          setSelectedHelpers([])
        }
      } else if (livingWorld?.activeMonarchs?.some((m: any) => m.monarchId === selectedNode.id && m.status === 'rampaging')) {
        // 활성(rampaging) 군주는 riftNodes가 아닌 activeMonarchs에 존재 → 유효한 선택으로 인정
      } else {
        const exists = livingWorld?.riftNodes[selectedNode.id]
        if (!exists) {
          setSelectedNode(null)
          setSelectedHelpers([])
        }
      }
    }
  }, [selectedNode, livingWorld])

  // 2. 세계 시드 변경(=새 회차/리셋) 감지 시 로컬 상태 초기화
  useEffect(() => {
    setSelectedNode(null)
    setSelectedHelpers([])
    setShowRecklessConfirm(false)
  }, [livingWorld?.seed])

  // 3. activeRiftNodeId가 undefined로 정리되면 selectedNode도 로컬 상태에서 닫아줌
  useEffect(() => {
    if (!activeRiftNodeId) {
      setSelectedNode(null)
      setSelectedHelpers([])
    }
  }, [activeRiftNodeId])

  // 4. D3 Zoom & Pan behavior configuration
  useEffect(() => {
    if (!svgRef.current) return

    const svg = select(svgRef.current as any)
    const zoomBehavior = zoom<any, any>()
      .scaleExtent([1, 8]) // Zoom limits: 1x to 8x
      .translateExtent([[0, 0], [MAP_WIDTH, MAP_HEIGHT]]) // Pan bounds
      .on('zoom', (event) => {
        setZoomTransform(event.transform)
      })

    zoomBehaviorRef.current = zoomBehavior
    svg.call(zoomBehavior)

    // Set initial custom zoom centered around South Korea (1.5x)
    const krCoords = REGION_CENTROIDS['kr'] || [580, 180]
    const initialScale = 1.5
    const tx = MAP_WIDTH / 2 - krCoords[0] * initialScale
    const ty = MAP_HEIGHT / 2 - krCoords[1] * initialScale

    svg.call(
      zoomBehavior.transform,
      zoomIdentity.translate(tx, ty).scale(initialScale)
    )

    return () => {
      svg.on('.zoom', null)
    }
  }, [])

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const krCoords = REGION_CENTROIDS['kr'] || [580, 180]
      const targetScale = 1.5
      const tx = MAP_WIDTH / 2 - krCoords[0] * targetScale
      const ty = MAP_HEIGHT / 2 - krCoords[1] * targetScale

      select(svgRef.current as any)
        .transition()
        .duration(500)
        .call(
          zoomBehaviorRef.current.transform,
          zoomIdentity.translate(tx, ty).scale(targetScale)
        )
    }
  }

  const focusOnCoords = (x: number, y: number, scale: number = 4) => {
    if (svgRef.current && zoomBehaviorRef.current) {
      select(svgRef.current as any)
        .transition()
        .duration(750)
        .call(
          zoomBehaviorRef.current.transform,
          zoomIdentity
            .translate(MAP_WIDTH / 2 - x * scale, MAP_HEIGHT / 2 - y * scale)
            .scale(scale)
        )
    }
  }

  const getNodeCoordinates = (node: any): [number, number] => {
    const baseCentroid = REGION_CENTROIDS[node.regionId]
    if (!baseCentroid) {
      return [(node.x / 100) * MAP_WIDTH, (node.y / 100) * MAP_HEIGHT]
    }

    const activeNodesInRegion = Object.values(livingWorld?.riftNodes ?? {})
      .filter(
        (n: any) =>
          n.regionId === node.regionId &&
          (riftNodesState[n.id] ?? n.status) === 'active'
      )

    const idx = activeNodesInRegion.findIndex((n: any) => n.id === node.id)
    if (idx === -1 || activeNodesInRegion.length <= 1) {
      if (node.id === 'node-kr-seoul') {
        return [baseCentroid[0] + 5, baseCentroid[1] - 4]
      }
      if (node.id === 'node-kr-incheon') {
        return [baseCentroid[0] - 5, baseCentroid[1] + 3]
      }
      return baseCentroid
    }

    const count = activeNodesInRegion.length
    const radius = 12
    const angle = (idx * 2 * Math.PI) / count
    return [
      baseCentroid[0] + radius * Math.cos(angle),
      baseCentroid[1] + radius * Math.sin(angle)
    ]
  }

  // 토스트 메시지 도우미
  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const handleNodeClick = (node: any) => {
    const status = riftNodesState[node.id] ?? node.status

    if (status === 'undiscovered') {
      discoverRiftNode(node.id)
      triggerToast(`[${node.name}] 탐사를 시작하여 구역을 개방했습니다!`)
      setSelectedNode({ ...node, status: 'active' })
      setSelectedHelpers([])
    } else if (status === 'locked') {
      // 선행 조건 설명 취합
      const reqNames = (node.requiresNodeIds ?? [])
        .map((reqId: string) => RIFT_NODES.find((rn: any) => rn.id === reqId)?.name ?? reqId)
        .join(', ')
      triggerToast(`🔒 이 구역은 잠겨있습니다. 선행 정화 필요: [${reqNames}]`)
    } else if (status === 'cleared') {
      setSelectedNode(node)
      setSelectedHelpers([])
      triggerToast(`[${node.name}]은 이미 정화된 구역입니다.`)
    } else {
      // active
      setSelectedNode(node)
      const worldNode = livingWorld?.riftNodes[node.id]
      if (worldNode?.loveCall?.active) {
        setSelectedHelpers(worldNode.loveCall.helperHunterIds ?? [])
      } else {
        setSelectedHelpers([])
      }
    }
  }

  // 현재 노드의 활성 게이트가 켜져 있는지 여부 (기존 E/D/C 일반 게이트 및 동적 스폰/러브콜 게이트 포함)
  const isGateActive =
    activeGate &&
    activeGate.status === 'active' &&
    activeRiftNodeId &&
    (
      RIFT_NODES.some((rn: any) => rn.id === activeRiftNodeId) || 
      MONARCHS.some((m) => m.id === activeRiftNodeId) || 
      activeRiftNodeId === 'angel' ||
      Boolean(livingWorld?.riftNodes[activeRiftNodeId])
    ) &&
    (!manualSession || manualSession.source !== 'world_map')

  // 위험도 계산 함수 (0.6 미만 시 무모, recommendedPower 이상 시 안전, 그 사이 위험)
  const getDangerLevel = (node: RiftNode) => {
    const difficulty = node.difficulty ?? 500
    if (playerPower >= difficulty) return 'safe'
    if (playerPower >= difficulty * 0.6) return 'danger'
    return 'reckless'
  }

  // 당일 후퇴 가드 여부
  const isNodeRetreatedToday = (nodeId: string) => {
    return worldBattleRetreats[nodeId] === todayKey()
  }

  // 국가 정렬 연산
  const sortedRegions = [...RIFT_REGIONS].sort((a, b) => {
    if (regionSortBy === 'name') {
      return a.name.localeCompare(b.name, 'ko')
    }
    const progA = getRegionProgress(a.id, riftNodesState)
    const progB = getRegionProgress(b.id, riftNodesState)
    const stateA = livingWorld?.regions[a.id]
    const stateB = livingWorld?.regions[b.id]

    if (regionSortBy === 'purify') {
      return progB.percent - progA.percent
    }

    // danger (위험도 / 오염도 높은 순)
    const isMonarchA = livingWorld?.activeMonarchs?.some(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(a.id)) ? 1 : 0
    const isMonarchB = livingWorld?.activeMonarchs?.some(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(b.id)) ? 1 : 0
    if (isMonarchA !== isMonarchB) return isMonarchB - isMonarchA

    const hasLcA = Object.values(livingWorld?.riftNodes ?? {}).some((node: any) => node.regionId === a.id && node.loveCall?.active && (riftNodesState[node.id] ?? node.status) === 'active') ? 1 : 0
    const hasLcB = Object.values(livingWorld?.riftNodes ?? {}).some((node: any) => node.regionId === b.id && node.loveCall?.active && (riftNodesState[node.id] ?? node.status) === 'active') ? 1 : 0
    if (hasLcA !== hasLcB) return hasLcB - hasLcA

    const corrA = stateA?.corruption ?? 0
    const corrB = stateB?.corruption ?? 0
    return corrB - corrA
  })

  const getCitizenQuote = () => {
    const corruption = livingWorld?.worldCorruption ?? 0
    let pool = CITIZEN_INTERCEPTS.serene
    if (corruption >= 75) pool = CITIZEN_INTERCEPTS.despair
    else if (corruption >= 50) pool = CITIZEN_INTERCEPTS.fear
    else if (corruption >= 25) pool = CITIZEN_INTERCEPTS.alert

    // Seeded selection based on day and a tick timer to make it dynamic
    const idx = Math.floor((livingWorld?.day ?? 0) + tickerOffset) % pool.length
    return pool[idx]
  }

  const citizenQuote = getCitizenQuote()

  return (
    <div className="space-y-6 relative">
      {/* 엔딩 및 분기 선택 오버레이 (Ending Branching Overlays) */}
      {livingWorld?.endingState === 'victory' && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/98 backdrop-blur-xl overflow-y-auto p-4 py-8">
          {livingWorld.endingMode === 'choice_pending' ? (
            /* 제3의 선택지 분기 해금 화면 */
            <div className="panel corner-bracket border-purple-500/50 bg-ink-950/95 p-8 max-w-2xl w-full shadow-glow-purple animate-scale-in text-center space-y-6">
              <div className="br" />
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-purple-500/10 border border-purple-500/40 p-4 shadow-glow-purple animate-pulse">
                  <Trophy className="h-10 w-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-black text-purple-300 tracking-widest mt-4 uppercase">
                  👼 지고의 존재와의 대면
                </h3>
                <div className="text-[10px] text-purple-400 font-mono tracking-widest font-black uppercase">
                  True Identity Revealed
                </div>
              </div>

              <p className="text-sm text-white/80 leading-relaxed max-w-xl mx-auto border-t border-b border-white/5 py-6 font-medium">
                쓰러진 지고의 심판자, 그 가면 너머로 드러난 얼굴은 기이할 정도로 낯익습니다.<br />
                그는 당신이 이 길을 걷기 전, 수많은 차원의 굴레를 겪으며 마침내 종착지에 도달했던 <strong>'첫 번째 전임자(Echo)'</strong>였습니다.<br />
                <br />
                스스로 천사가 되어 이 세상을 소멸하고 재창조함으로써 멸망을 막으려 했던 전임자가,<br />
                희미해져 가는 의식 속에서 당신에게 마지막 결단을 묻습니다.
              </p>

              <div className="grid gap-4 md:grid-cols-2 pt-2">
                {/* 선택지 1: 계승 및 루프 */}
                <button
                  onClick={() => resolveEndingChoice('surface')}
                  className="group relative text-left p-5 rounded-lg border border-red-500/25 bg-red-950/10 hover:bg-red-950/20 hover:border-red-500/50 transition-all duration-300 shadow-lg cursor-pointer"
                >
                  <div className="font-black text-red-400 text-sm mb-1.5 flex items-center gap-1.5">
                    <span>⚔️ 굴레의 계승 (처단)</span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                    쓰러진 존재를 처단하고 이번 회차를 완성합니다. 세계는 평화를 되찾는 것처럼 보이지만, 비어 있던 빛의 자리가 오래도록 뒤에 남습니다.
                  </p>
                </button>

                {/* 선택지 2: 해방 및 진엔딩 */}
                <button
                  onClick={() => resolveEndingChoice('true')}
                  className="group relative text-left p-5 rounded-lg border border-amber-500/35 bg-amber-950/10 hover:bg-amber-950/20 hover:border-amber-500/60 transition-all duration-300 shadow-lg cursor-pointer"
                >
                  <div className="font-black text-amber-300 text-sm mb-1.5 flex items-center gap-1.5">
                    <span>✨ 진정한 해방 (구원)</span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                    무기의 끝을 거두고, 축적된 흔적의 파편들을 공명시켜 그의 쇠사슬을 깨부숩니다. 전임자를 굴레에서 해방하고 차원 반복의 거짓된 평화를 영원히 끊어냅니다.
                  </p>
                </button>
              </div>
            </div>
          ) : livingWorld.endingMode === 'true' ? (
            /* 진엔딩 (True Ending) 화면 */
            <div className="panel corner-bracket border-amber-500/50 bg-ink-950/90 p-8 max-w-2xl w-full shadow-glow-amber animate-scale-in text-center space-y-6">
              <div className="br" />
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-amber-500/10 border border-amber-500/40 p-4 shadow-glow-amber animate-pulse">
                  <Trophy className="h-10 w-10 text-amber-400 animate-bounce" />
                </div>
                <h3 className="text-2xl font-black text-amber-300 tracking-widest mt-4 uppercase">
                  🏆 새벽의 구원자
                </h3>
                <div className="text-[10px] text-amber-400 font-mono tracking-widest font-black uppercase">
                  True Ending: Eternal Dawn
                </div>
              </div>

              <p className="text-sm text-white/80 leading-relaxed max-w-xl mx-auto border-t border-b border-white/5 py-6 font-medium">
                마침내 차원의 굴레가 산산조각 났습니다.<br />
                당신은 전임자를 영원한 속박에서 해방하고, 인류를 무한히 반복되던 종말의 궤도에서 끌어냈습니다.<br />
                <br />
                인공적인 천상의 빛 대신 참된 아침 햇살이 대지에 내리쥡니다.<br />
                더 이상 군주들의 위협도, 천사의 단죄도 존재하지 않는 온전한 미래가 시작됩니다.<br />
                당신이 이룩한 영원한 평화는 은하의 모든 역사 속에 찬란한 기적으로 기록될 것입니다.
              </p>

              {/* 이번 회차 기록 브리핑 */}
              <div className="space-y-3 text-xs max-w-md mx-auto">
                <div className="text-left font-bold text-white/50 text-[10px] tracking-widest uppercase mb-1">
                  📊 이번 차원 회차 요약 기록
                </div>
                <div className="grid grid-cols-2 gap-2 font-medium">
                  <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                    <span>차원 시드(Seed)</span>
                    <span className="font-bold text-cyan-300">#{livingWorld.seed}</span>
                  </div>
                  <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                    <span>생존/정화 일수</span>
                    <span className="font-bold text-amber-300">{livingWorld.day}일</span>
                  </div>
                  <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                    <span>격퇴한 군주</span>
                    <span className="font-bold text-red-400">8 / 8 (완성)</span>
                  </div>
                  <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                    <span>연대 협력 횟수</span>
                    <span className="font-bold text-purple-300">{livingWorld.coopCount ?? 0}회</span>
                  </div>
                  <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                    <span>최종 헌터 레벨</span>
                    <span className="font-bold text-emerald-300">Lv.{hunter.level}</span>
                  </div>
                  <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                    <span>복속된 그림자</span>
                    <span className="font-bold text-purple-300">{ownedShadows.length}명</span>
                  </div>
                </div>

                {/* 이전 총 구원 횟수 */}
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-[11px] text-amber-200/90 font-bold flex justify-between items-center font-black">
                  <span>✨ 최종 기록 상태</span>
                  <span className="text-amber-300 text-sm font-black animate-pulse">
                    {secretProgress?.flags?.trueEndingReached ? '기록 보존됨' : '이번 회차 기록'}
                  </span>
                </div>
              </div>

              <div className="pt-4 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    useGame.getState().triggerVictoryReset()
                    triggerToast("🌌 차원 이동 완료: 새로운 평화의 세계로 강림했습니다!")
                  }}
                  className="btn btn-primary w-full py-3.5 text-xs font-black tracking-widest text-center cursor-pointer shadow-glow-amber border border-amber-500/50 hover:bg-amber-500/25 hover:text-white transition-all duration-300"
                >
                  새로운 세계로 차원 이동 (다음 회차 진행)
                </button>
              </div>
            </div>
          ) : (
            /* 표면 엔딩 (Surface Ending) 화면 */
            <div className="panel corner-bracket border-red-500/50 bg-ink-950/90 p-8 max-w-2xl w-full shadow-glow-red animate-scale-in text-center space-y-6">
              <div className="br" />
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-red-500/10 border border-red-500/40 p-4 shadow-glow-red animate-pulse">
                  <Trophy className="h-10 w-10 text-red-400" />
                </div>
                <h3 className="text-2xl font-black text-red-300 tracking-widest mt-4 uppercase">
                  ⚔️ 거짓된 평화의 주역
                </h3>
                <div className="text-[10px] text-red-400 font-mono tracking-widest font-black uppercase">
                  Surface Ending: Echoes of the Loop
                </div>
              </div>

              <p className="text-sm text-white/80 leading-relaxed max-w-xl mx-auto border-t border-b border-white/5 py-6 font-medium">
                지고의 심판자는 격퇴되었고, 차원의 오염은 강제로 봉인되었습니다.<br />
                인류는 멸망의 위기를 극복했으며, 도시는 영웅인 당신의 귀환을 연호합니다.<br />
                <br />
                그러나 영광의 한가운데에서, 당신은 기이한 차가움과 기시감을 느낍니다.<br />
                빛이 바랜 심판자의 의자가 서서히 당신의 형상과 겹쳐 보이며, 침묵 속에서 다시금 균열의 신호음이 울리기 시작합니다.<br />
                세계의 톱니바퀴는 결코 멈추지 않고 다시 처음으로 굴러갑니다.
              </p>

              {/* 이번 회차 기록 브리핑 */}
              <div className="space-y-3 text-xs max-w-md mx-auto">
                <div className="text-left font-bold text-white/50 text-[10px] tracking-widest uppercase mb-1">
                  📊 이번 차원 회차 요약 기록
                </div>
                <div className="grid grid-cols-2 gap-2 font-medium">
                  <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                    <span>차원 시드(Seed)</span>
                    <span className="font-bold text-cyan-300">#{livingWorld.seed}</span>
                  </div>
                  <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                    <span>생존/정화 일수</span>
                    <span className="font-bold text-amber-300">{livingWorld.day}일</span>
                  </div>
                  <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                    <span>격퇴한 군주</span>
                    <span className="font-bold text-red-400">8 / 8 (완성)</span>
                  </div>
                  <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                    <span>연대 협력 횟수</span>
                    <span className="font-bold text-purple-300">{livingWorld.coopCount ?? 0}회</span>
                  </div>
                  <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                    <span>최종 헌터 레벨</span>
                    <span className="font-bold text-emerald-300">Lv.{hunter.level}</span>
                  </div>
                  <div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-white/70 flex justify-between">
                    <span>복속된 그림자</span>
                    <span className="font-bold text-purple-300">{ownedShadows.length}명</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    useGame.getState().triggerVictoryReset()
                    triggerToast("🌌 차원 순화 완료: 굴레가 반복되는 다음 차원으로 이탈합니다.")
                  }}
                  className="btn btn-primary w-full py-3.5 text-xs font-black tracking-widest text-center cursor-pointer shadow-glow-red border border-red-500/50 hover:bg-red-500/25 hover:text-white transition-all duration-300"
                >
                  다음 차원으로 루프 개시
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 균열 상태 토스트 안내 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-purple-500/30 bg-ink-950 px-4 py-3 text-sm text-purple-200 shadow-glow-purple">
          <AlertCircle className="h-4 w-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 무모(Reckless) 진입 확인 모달 */}
      {showRecklessConfirm && selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="panel corner-bracket border-rose-500/40 bg-ink-950 p-6 max-w-md w-full mx-4 shadow-glow-red animate-scale-in">
            <div className="br" />
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="h-6 w-6 animate-pulse" />
              <h4 className="text-lg font-black tracking-wider">⚠️ 위험 경고: 무모한 진입</h4>
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              이 균열 구역의 권장 전투력은 <span className="text-pink-300 font-bold">{(selectedNode.difficulty ?? 500).toLocaleString()} CP</span>이나, 현재 헌터의 실효 전투력은 <span className="text-rose-400 font-bold">{playerPower.toLocaleString()} CP</span>로 60% 미만입니다.
            </p>
            <div className="mt-3 rounded border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300/80 leading-normal">
              정화 도중 일반 몬스터에게 일격에 즉사할 위험이 매우 높습니다! 정화 전선에 진입하기 전에 장착 그림자를 추가하거나 장비를 강화하는 것을 권장합니다.
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRecklessConfirm(false)}
                className="rounded border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white/70 transition-all cursor-pointer"
              >
                돌아가기 (취소)
              </button>
              <button
                onClick={() => {
                  setShowRecklessConfirm(false)
                  startWorldManualBattle(selectedNode.id, selectedHelpers)
                }}
                className="rounded border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/25 px-4 py-2 text-xs font-bold text-rose-200 shadow-glow-red hover:text-white transition-all cursor-pointer"
              >
                강행 진입
              </button>
            </div>
          </div>
        </div>
      )}



      {/* 수동 전투 모드 (전체 오버레이 형태로 GatePanel을 렌더링) */}
      {manualSession && manualSession.source === 'world_map' && (() => {
        const isMonarchSession = MONARCHS.some(m => m.id === manualSession.gateId) || manualSession.gateId === 'angel'
        const monarchData = manualSession.gateId === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === manualSession.gateId)
        
        return (
          <div className="fixed inset-0 z-[90] bg-ink-950 overflow-y-auto p-4 sm:p-6 md:p-8 animate-fade-in scrollbar-thin">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-purple-400">
                  <Swords className="h-5 w-5" />
                  <span className="text-sm font-black tracking-widest text-red-400">
                    {isMonarchSession ? '👑 군주 토벌 작전 개시' : '수동 정화 전투 개시'}
                  </span>
                </div>
                <span className={`rounded px-2.5 py-0.5 text-[10px] font-bold border ${
                  isMonarchSession 
                    ? 'bg-red-500/25 text-red-200 border-red-500/30' 
                    : 'bg-purple-500/25 text-purple-200 border-purple-400/20'
                }`}>
                  {manualSession.gateName}
                </span>
              </div>

              {/* 군주 토벌 전용 상단 서사 보드 */}
              {isMonarchSession && monarchData && (
                <div className="panel corner-bracket border-red-500/40 bg-red-950/15 p-4 space-y-2.5 shadow-glow-red">
                  <div className="br" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-red-400 uppercase tracking-widest">
                      🚨 BOSS IDENTIFIED: {monarchData.rank === 0 ? 'SPECIAL' : `서열 ${monarchData.rank}위`}
                    </span>
                    <span className="font-bold text-pink-300">
                      권장 전투력: {monarchData.recommendedCP.toLocaleString()} CP
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white">{monarchData.name}</h3>
                  <div className="text-xs text-white/70 bg-black/40 rounded p-2.5 border border-white/5 leading-relaxed">
                    <p className="font-semibold text-rose-300 mb-1">Concept: {monarchData.concept}</p>
                    <p className="text-white/60">
                      심연의 군주가 세계를 잠식하고 있습니다. 격렬한 어둠의 기운으로 인해 일반적인 방어력으로는 즉사를 피할 수 없습니다. 그림자 군단의 강력한 수호 장벽 보호가 필수적입니다.
                    </p>
                  </div>
                  
                  {/* 그림자 탱킹 작동 안내 */}
                  <div className="rounded border border-cyan-500/20 bg-cyan-950/10 p-3 text-xs text-cyan-200 flex items-start gap-2.5 leading-relaxed shadow-glow-blue">
                    <Shield className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block text-cyan-300">🛡️ [그림자 탱킹 완성형 장막 활성화]</span>
                      <span className="text-white/70 block mt-0.5 text-[11px]">
                        장착된 그림자 수에 비례하여 방어력 <span className="font-bold text-cyan-200">고정 +{(5000 + 2000 * equippedShadows.length).toLocaleString()}</span> 가산, 회피율 <span className="font-bold text-cyan-200">+{Math.round((0.40 + 0.05 * equippedShadows.length) * 100)}%</span> 상승, 대미지 감쇄가 즉각 적용되어 군주의 즉사 대미지를 무력화합니다.
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 그림자 장착 정보 표시 (일반 전투용) */}
              {!isMonarchSession && equippedShadows.length > 0 && (
                <div className="rounded border border-purple-500/20 bg-purple-500/5 p-3 flex flex-wrap gap-2 items-center text-xs">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span className="text-white/60 font-medium">🛡️ 그림자 탱킹 작동 중:</span>
                  {equippedShadows.map(shadow => (
                    <span key={shadow.instanceId} className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300 font-bold border border-purple-500/10">
                      {shadow.name} (Lv.{shadow.level})
                    </span>
                  ))}
                </div>
              )}

              <div className="bg-ink-900 rounded-xl border border-white/10 p-2 sm:p-4">
                <GatePanel isWorldMapContext={true} />
              </div>
            </div>
          </div>
        )
      })()}

      {/* 헤더 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-white/5 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-purple-300">
            <Globe className="h-6 w-6 animate-pulse" />
            <h2 className="text-xl font-black tracking-wider">살아있는 균열 세계</h2>
          </div>
          <p className="mt-1 text-xs text-white/55">
            세계 곳곳의 차원 틈새를 조사하고 균열을 정화하여 차원 평화를 유지하십시오.
          </p>
        </div>

        {/* Live Broadcast Marquee Ticker (Relocated to Header Right with premium massive readability upgrade) */}
        {livingWorld && (
          <div 
            className="flex-1 lg:max-w-2xl rounded-lg bg-black border-2 px-4 py-2.5 flex items-center gap-4 overflow-hidden select-none relative shadow-[0_6px_25px_rgba(0,0,0,0.8)]"
            style={{
              borderColor: 
                livingWorld.worldCorruption >= 75 ? 'rgba(239, 68, 68, 0.45)' :
                livingWorld.worldCorruption >= 50 ? 'rgba(249, 115, 22, 0.35)' :
                livingWorld.worldCorruption >= 25 ? 'rgba(234, 179, 8, 0.3)' :
                'rgba(6, 182, 212, 0.25)',
              borderLeftWidth: '5px',
              borderLeftColor:
                livingWorld.worldCorruption >= 75 ? '#ef4444' :
                livingWorld.worldCorruption >= 50 ? '#f97316' :
                livingWorld.worldCorruption >= 25 ? '#eab308' :
                '#06b6d4'
            }}
          >
            <span 
              className={`shrink-0 text-[10px] sm:text-xs font-black tracking-widest px-3 py-1 rounded border animate-pulse transition-colors duration-500 uppercase ${
                livingWorld.worldCorruption >= 75 ? 'text-red-400 bg-red-950/60 border-red-700/60 shadow-[0_0_12px_rgba(239,68,68,0.35)]' :
                livingWorld.worldCorruption >= 50 ? 'text-orange-400 bg-orange-950/50 border-orange-700/50' :
                livingWorld.worldCorruption >= 25 ? 'text-yellow-400 bg-yellow-950/50 border-yellow-700/50' :
                'text-cyan-400 bg-cyan-950/50 border-cyan-700/50'
              }`}
            >
              📡 INTERCEPTED SIGNAL
            </span>
            <div className="flex-1 overflow-hidden relative h-6 flex items-center">
              <span 
                className={`absolute whitespace-nowrap animate-marquee font-mono tracking-wide text-xs sm:text-sm font-extrabold ${
                  livingWorld.worldCorruption >= 75 ? 'text-red-400' :
                  livingWorld.worldCorruption >= 50 ? 'text-orange-300' :
                  livingWorld.worldCorruption >= 25 ? 'text-yellow-200' :
                  'text-cyan-200'
                }`}
                style={{
                  textShadow: 
                    livingWorld.worldCorruption >= 75 ? '0 0 10px rgba(239, 68, 68, 0.6)' : 
                    livingWorld.worldCorruption >= 50 ? '0 0 8px rgba(249, 115, 22, 0.4)' : undefined
                }}
              >
                {citizenQuote}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 지고의 심판자(천사) 최종전 진입 배너 */}
      {livingWorld && livingWorld.angelReady && livingWorld.endingState !== 'victory' && (
        <div className="panel corner-bracket border-amber-500 bg-purple-950/25 p-5 shadow-glow-amber flex flex-col md:flex-row items-center justify-between gap-5 mb-6 animate-pulse">
          <div className="br" />
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <h3 className="text-base font-black text-amber-300 tracking-wider">🌟 지고의 심판자 강림 (최종 결전)</h3>
              <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
                모든 심연의 군주(8명)가 퇴치되어 차원의 기둥이 무너지고 <strong>지고의 심판자(천사)</strong>가 강림했습니다!<br/>
                {echoTruthReadiness.reached ? (
                  <span className="text-amber-300 font-bold">✨ [동조 완료] 오래 축적된 자취와 결전 좌표가 같은 위상으로 맞물립니다. 결전 끝에 닫혀 있던 길이 드러날 것입니다.</span>
                ) : (
                  <span className="text-purple-300">⚠️ [여운] 결전 좌표 뒤편에서 아직 맞물리지 않은 잔류 신호가 희미하게 흔들립니다.</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedNode({
                id: 'angel',
                regionId: 'kr',
                name: FINAL_ANGEL.name,
                x: 50,
                y: 50,
                status: 'active',
                gateDefId: 'angel',
                difficultyRank: 'S',
                difficulty: FINAL_ANGEL.recommendedCP,
                deadline: 999,
                daysRemaining: 999,
                isSGrade: true
              })
              setSelectedHelpers([])
            }}
            className="rounded border border-amber-500/50 bg-amber-500/20 hover:bg-amber-500/35 px-5 py-3 text-xs font-black text-white tracking-widest transition-all cursor-pointer shadow-glow-amber whitespace-nowrap flex items-center gap-1.5 shrink-0"
          >
            <Swords className="h-4 w-4 text-amber-300" /> 최종 결전 준비
          </button>
        </div>
      )}

      {/* 거점 침공 비상 경고 배너 */}
      {livingWorld && livingWorld.homeReachedMonarchId && (() => {
        const monarchId = livingWorld.homeReachedMonarchId
        const mData = MONARCHS.find(m => m.id === monarchId) || FINAL_ANGEL
        return (
          <div className="panel corner-bracket border-red-500 bg-red-950/25 p-5 shadow-glow-red animate-pulse flex flex-col md:flex-row items-center justify-between gap-5 mb-6">
            <div className="br" />
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500 animate-bounce shrink-0" />
              <div>
                <h3 className="text-base font-black text-red-400 tracking-wider">🚨 초비상: 거점 군주 침공</h3>
                <p className="text-xs text-red-200/80 mt-1 leading-relaxed">
                  군주 <span className="font-extrabold text-white">[{mData.name}]</span>이(가) 대한민국의 방어선을 돌파하고 거점에 진입했습니다! 즉각 대응하지 않으면 세계가 멸망합니다.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => {
                  if (playerPower < mData.recommendedCP * 0.6) {
                    setSelectedNode({
                      id: monarchId,
                      regionId: 'kr',
                      name: mData.name,
                      x: 50,
                      y: 50,
                      status: 'active',
                      gateDefId: monarchId,
                      difficultyRank: 'S',
                      difficulty: mData.recommendedCP,
                      deadline: 999,
                      daysRemaining: 999,
                      isSGrade: true
                    })
                    setRecklessConfirmType('manual')
                    setShowRecklessConfirm(true)
                  } else {
                    startWorldManualBattle(monarchId, [])
                  }
                }}
                className="rounded border border-cyan-500/50 bg-cyan-950/20 hover:bg-cyan-500/35 px-4 py-2.5 text-xs font-black text-cyan-200 tracking-widest transition-all cursor-pointer shadow-glow-blue whitespace-nowrap flex items-center gap-1.5"
              >
                <Zap className="h-4 w-4 text-cyan-400" /> 수동 격퇴 개시
              </button>
            </div>
          </div>
        )
      })()}

      {/* MVP-2 World Status Dashboard */}
      {livingWorld && (
        <div className="grid gap-4 md:grid-cols-4 animate-fade-in">
          {/* Box 1: World Corruption and Monarchs */}
          <div className="panel corner-bracket border-purple-500/20 bg-ink-950/40 p-4 flex flex-col justify-between">
            <div className="br" />
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-white/70">
                <span className="flex items-center gap-1.5 text-purple-300 font-extrabold text-sm">
                  <AlertCircle className="h-4 w-4" /> 전역 오염도 및 침공
                </span>
                <span className="text-[11px] font-bold text-white/50">Day {livingWorld.day}</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div className="text-3xl font-black text-red-400 tracking-tight">
                  {livingWorld.worldCorruption}%
                </div>
                {livingWorld.monarchsAppeared > 0 ? (
                  <span className="rounded bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-black text-red-300 tracking-wider animate-pulse">
                    🔥 군주 {livingWorld.monarchsAppeared}명 침공 중
                  </span>
                ) : (
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    평화로움 (군주 0)
                  </span>
                )}
              </div>
              <div className="mt-2.5 h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 bg-gradient-to-r ${
                    livingWorld.worldCorruption >= 70 ? 'from-orange-500 to-red-500' :
                    livingWorld.worldCorruption >= 30 ? 'from-yellow-400 to-orange-500' :
                    'from-cyan-400 to-emerald-400'
                  }`}
                  style={{ width: `${livingWorld.worldCorruption}%` }}
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-white/50 leading-relaxed font-semibold">
              오염도가 40%, 60%, 78%, 92%, 99%를 초과할 때마다 더 강력한 군주가 강림합니다.
            </p>
          </div>

          {/* Box 2: Incident Logs Terminal (WORLD SIGNAL LOG) */}
          <div className="panel corner-bracket border-white/10 bg-ink-950/40 p-4 md:col-span-2 flex flex-col justify-between min-h-[174px]">
            <div className="br" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-white/70 mb-2.5 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-cyan-300 flex items-center gap-1.5 font-bold tracking-wider uppercase">
                  <Swords className="h-4 w-4" /> 📡 WORLD SIGNAL LOG
                </span>
                
                {/* Stage 2 Playback HUD Settings Panel */}
                <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded px-2 py-0.5 scale-90 origin-left select-none">
                  <div className="flex items-center gap-1 text-[8px] font-black uppercase text-white/40">
                    🎬 연출
                  </div>
                  <select
                    value={animationMode}
                    onChange={(e) => setAnimationMode(e.target.value as any)}
                    className="bg-transparent border-0 text-[9px] text-white/75 font-bold focus:ring-0 cursor-pointer outline-none p-0"
                  >
                    <option value="all" className="bg-slate-950 text-white font-medium">전체 (All)</option>
                    <option value="critical" className="bg-slate-950 text-white font-medium">핵심만 (Critical)</option>
                    <option value="off" className="bg-slate-950 text-white font-medium">끄기 (Muted)</option>
                  </select>
                  <span className="w-[1px] h-3 bg-white/10" />
                  <div className="flex items-center gap-1 text-[8px] font-black uppercase text-white/40">
                    ⏩ 속도
                  </div>
                  <select
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(parseFloat(e.target.value) as any)}
                    className="bg-transparent border-0 text-[9px] text-white/75 font-bold focus:ring-0 cursor-pointer outline-none p-0"
                  >
                    <option value={1.0} className="bg-slate-950 text-white font-medium">1.0x</option>
                    <option value={1.5} className="bg-slate-950 text-white font-medium">1.5x</option>
                    <option value={2.0} className="bg-slate-950 text-white font-medium">2.0x</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 scale-90 sm:scale-100 origin-right">
                <button
                  onClick={openDailyReport}
                  className="rounded border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/25 px-2.5 py-0.5 text-[9px] font-black text-emerald-200 transition-all cursor-pointer flex items-center gap-1"
                >
                  📊 일일 보고서
                </button>
                <button
                  onClick={() => setIsAllLogsExpanded(!isAllLogsExpanded)}
                  className="rounded border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/25 px-2 py-0.5 text-[9px] font-black text-cyan-200 transition-all cursor-pointer"
                >
                  {isAllLogsExpanded ? '▲ 요약 접기' : `▼ 모든 로그 (${livingWorld.eventLogs.length})`}
                </button>
                <button
                  onClick={() => {
                    useGame.getState().debugAdvanceLivingWorldDay()
                    triggerToast("🔮 차원의 시간이 하루 흘렀습니다. 세계가 스스로 1틱 시뮬레이션되었습니다.")
                  }}
                  className="rounded-md border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/25 px-2 py-0.5 text-[9px] font-black text-purple-200 transition-all cursor-pointer"
                >
                  ⏩ 1일 시뮬레이션
                </button>
              </div>
            </div>
            
            <div className="flex-1 rounded bg-black/45 border border-white/5 p-2 scrollbar-thin">
              {(() => {
                const events = livingWorld.recentEvents || []
                if (events.length > 0) {
                  const displayedEvents = isAllLogsExpanded
                    ? events.slice().reverse()
                    : events.slice().reverse().slice(0, 4)

                  return (
                    <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
                      {displayedEvents.map((evt) => {
                        const isLatest = evt.day === livingWorld.day
                        let borderClass = 'border-white/5 bg-white/5'
                        let badgeClass = 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                        let textClass = 'text-white/70'
                        let icon = '📡'

                        if (evt.severity === 'critical') {
                          borderClass = isLatest ? 'border-red-500/40 bg-red-950/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'border-red-500/25 bg-red-950/10'
                          badgeClass = 'bg-red-500/20 border-red-500/30 text-red-400 font-black animate-pulse'
                          textClass = 'text-red-300 font-bold'
                          icon = '🚨'
                        } else if (evt.severity === 'major') {
                          borderClass = isLatest ? 'border-orange-500/40 bg-orange-950/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 'border-orange-500/25 bg-orange-950/10'
                          badgeClass = 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                          textClass = 'text-orange-300 font-semibold'
                          icon = '⚠️'
                        } else {
                          borderClass = 'border-white/5 bg-white/2 hover:border-white/10'
                          badgeClass = 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400'
                          textClass = 'text-white/60 font-medium'
                          icon = '📡'
                        }

                        if (evt.type === 'awakening') icon = '✨'
                        if (evt.type === 'defeated') icon = '⚔️'
                        if (evt.type === 'occupied') icon = '💀'
                        if (evt.type === 'gate_surge') icon = '💥'
                        if (evt.type === 'sgrade_gate') icon = '👾'
                        if (evt.type === 'home_reached') icon = '🔥'

                        return (
                          <div 
                            key={evt.id} 
                            className={`flex items-center gap-2 text-xs border rounded p-1.5 leading-normal transition-all hover:bg-white/5 ${borderClass} ${
                              isLatest ? 'border-l-2' : ''
                            }`}
                            style={{ 
                              borderLeftColor: isLatest ? (evt.severity === 'critical' ? '#ef4444' : evt.severity === 'major' ? '#f97316' : '#3b82f6') : undefined
                            }}
                          >
                            <span className="shrink-0 text-xs select-none">{icon}</span>
                            <span className={`chip shrink-0 scale-95 ${badgeClass}`} style={{ fontSize: '9px', fontWeight: 900, padding: '0.1rem 0.35rem' }}>
                              Day {evt.day}
                            </span>
                            <span className={`flex-1 font-mono break-all text-white/85 ${textClass}`}>
                              {evt.body}
                            </span>
                            {isLatest && (
                              <span className="text-[8px] font-black uppercase text-cyan-400 bg-cyan-400/10 px-1 py-0.2 rounded animate-pulse select-none shrink-0 tracking-wider">
                                LATEST
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                }

                // Fallback for Day 0 or backward compatibility with eventLogs
                const displayedLogs = isAllLogsExpanded 
                  ? livingWorld.eventLogs.slice().reverse() 
                  : livingWorld.eventLogs.slice().reverse().slice(0, 4)

                if (displayedLogs.length === 0) {
                  return (
                    <div className="text-zinc-500 italic py-6 text-center text-xs">
                      📡 현재 세계 전선은 일시적으로 고요합니다.
                    </div>
                  )
                }

                return (
                  <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
                    {displayedLogs.map((log, idx) => {
                      const style = classifyEventLog(log)
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs border-b border-white/5 pb-1.5 leading-normal transition-all hover:bg-white/5 p-1 rounded">
                          <span className={`chip shrink-0 scale-90 ${style.badgeClass}`} style={{ fontSize: '9px', fontWeight: 800, padding: '0.08rem 0.3rem' }}>
                            {style.badge}
                          </span>
                          <span className={`flex-1 font-mono text-[11px] break-all text-white/75 ${style.textClass}`}>
                            {log}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Box 3: Monarchs Status Briefing */}
          <div className="panel corner-bracket border-red-500/25 bg-ink-950/40 p-4 flex flex-col justify-between">
            <div className="br" />
            <div>
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 mb-2.5 font-bold">
                👑 군주 침공 전황 분석
              </span>
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-red-500/20">
                {!livingWorld.activeMonarchs || livingWorld.activeMonarchs.length === 0 ? (
                  <div className="text-[10px] text-white/40 italic py-5 text-center">
                    현재 강림한 군주가 없습니다.
                  </div>
                ) : (
                  livingWorld.activeMonarchs.map((monarch: any) => {
                    const mData = MONARCHS.find(m => m.id === monarch.monarchId)
                    if (!mData) return null
                    const isRampaging = monarch.status === 'rampaging'
                    return (
                      <div
                        key={monarch.monarchId}
                        onClick={() => {
                          if (isRampaging) {
                            const monarchRegionId = monarch.occupiedRegionIds[0] || 'kr'
                            handleNodeClick({
                              id: monarch.monarchId,
                              regionId: monarchRegionId,
                              name: mData.name,
                              x: 50,
                              y: 50,
                              status: 'active',
                              gateDefId: monarch.monarchId,
                              difficultyRank: 'S',
                              difficulty: mData.recommendedCP,
                              deadline: 999,
                              daysRemaining: 999,
                              isSGrade: true
                            })
                          }
                        }}
                        className={`rounded bg-black/45 border p-2 flex items-center justify-between text-xs transition-all ${
                          isRampaging 
                            ? 'border-red-500/40 hover:border-red-400 hover:bg-red-950/20 cursor-pointer shadow-sm' 
                            : 'border-white/5 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-extrabold text-white">{mData.name}</span>
                          <span className="text-[9px] text-white/50 font-bold tracking-wide mt-0.5">서열 {mData.rank}위 | {mData.theme}</span>
                        </div>
                        <div className="text-right shrink-0">
                          {isRampaging ? (
                            <span className="rounded bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[9px] font-black text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.1)]">
                              {monarch.occupiedRegionIds.length}개국 점령
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-500/20 border border-emerald-500/35 px-2 py-0.5 text-[9px] font-black text-emerald-300">
                              격퇴됨
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            <p className="mt-2 text-[8px] text-white/40 leading-normal">
              출현 군주는 3일마다 인접국을 잠식하며, 거점(한국) 도달 시 즉시 강제 전투가 발동됩니다.
            </p>
          </div>
        </div>
      )}

      {/* MAXIMIZED FULL-WIDTH MAP CONTAINER WITH TAC OVERLAYS */}
      <div className="relative w-full rounded-xl border border-white/10 bg-[#04050c] overflow-hidden select-none h-[620px] lg:h-[72vh] min-h-[480px] shadow-2xl flex">
        {(() => {
          const isMapDataLoaded = worldFeatures && worldFeatures.length > 0

          // Helper to determine region coloring based on game state with premium territorial continental identities
          const getCountryColors = (regionId: string, corruption: number, isOccupied: boolean) => {
            if (regionId === 'kr') {
              return {
                fill: '#1a143b', // Korea (Home Base): deep violet-black
                stroke: '#7f77dd', // electric purple
                glowColor: '#7f77dd',
                stateText: '거점',
              }
            }
            if (isOccupied) {
              return {
                fill: '#380c10', // deep blood red
                stroke: '#e24b4a', // intense military red
                glowColor: '#e24b4a',
                stateText: '점령됨',
              }
            }
            if (corruption > 50) {
              return {
                fill: '#380c10', // deep blood red
                stroke: '#e24b4a', // intense military red
                glowColor: '#e24b4a',
                stateText: '위험',
              }
            }
            if (corruption > 20) {
              return {
                fill: '#2e1d09', // dark copper amber
                stroke: '#ef9f27', // warm alert orange
                glowColor: '#ef9f27',
                stateText: '경계',
              }
            }

            // Safe state (corruption <= 20): Use premium distinct continental palette instead of uniform green
            switch (regionId) {
              case 'us':
              case 'ca':
              case 'mx':
                return {
                  fill: '#0e1626', // North America: Navy Steel
                  stroke: '#3b517d', // Muted Steel Blue
                  glowColor: '#3b517d',
                  stateText: '안전 (북미)',
                }
              case 'uk':
              case 'de':
              case 'fr':
              case 'it':
                return {
                  fill: '#0d1a1b', // Europe: Deep Teal Shadow
                  stroke: '#2f5c5e', // Muted Teal
                  glowColor: '#2f5c5e',
                  stateText: '안전 (유럽)',
                }
              case 'cn':
              case 'jp':
              case 'ru':
              case 'in':
                return {
                  fill: '#141120', // Asia: Dark Indigo Slate
                  stroke: '#443a6b', // Muted Indigo/Violet
                  glowColor: '#443a6b',
                  stateText: '안전 (아시아)',
                }
              case 'br':
              case 'eg':
                return {
                  fill: '#1a130e', // South America / Africa: Dark Terracotta
                  stroke: '#5a4533', // Muted Bronze
                  glowColor: '#5a4533',
                  stateText: '안전 (남미/아프리카)',
                }
              case 'au':
                return {
                  fill: '#101912', // Oceania: Earthy Deep Forest
                  stroke: '#314f38', // Muted Forest Green
                  glowColor: '#314f38',
                  stateText: '안전 (오세아니아)',
                }
              default:
                return {
                  fill: '#0c0e18', // Default Premium Dark slate metallic
                  stroke: '#2e3856', // Metal blue-gray border
                  glowColor: '#2e3856',
                  stateText: '안전',
                }
            }
          }

          // Render curved, animated network lines connecting South Korea to active regions
          const renderConnectingLines = () => {
            const krCentroid = REGION_CENTROIDS['kr']
            if (!krCentroid) return null

            const activeNodes = Object.values(livingWorld?.riftNodes ?? {})
              .filter((node: any) => node.loveCall?.active && (riftNodesState[node.id] ?? node.status) === 'active')
            
            const activeMonarchs = livingWorld?.activeMonarchs?.filter((m: any) => m.status === 'rampaging') ?? []

            const targets: { id: string; coords: [number, number]; type: 'lovecall' | 'monarch' }[] = []

            activeNodes.forEach((node: any) => {
              const coords = REGION_CENTROIDS[node.regionId]
              if (coords) {
                targets.push({ id: node.id, coords, type: 'lovecall' })
              }
            })

            activeMonarchs.forEach((m: any) => {
              const regionId = m.occupiedRegionIds[0] || 'kr'
              const coords = REGION_CENTROIDS[regionId]
              if (coords && regionId !== 'kr') {
                targets.push({ id: m.monarchId, coords, type: 'monarch' })
              }
            })

            return targets.map((t) => {
              const [x1, y1] = krCentroid
              const [x2, y2] = t.coords
              
              // Draw arc via quadratic bezier control point
              const mx = (x1 + x2) / 2
              const my = (y1 + y2) / 2
              const dx = x2 - x1
              const dy = y2 - y1
              const offset = 30
              const length = Math.sqrt(dx * dx + dy * dy)
              const px = -dy / length
              const py = dx / length
              const cx = mx + px * offset
              const cy = my + py * offset

              const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
              const strokeColor = t.type === 'monarch' ? '#e24b4a' : '#ef9f27'

              return (
                <path
                  key={`link-${t.id}`}
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  className="opacity-40"
                  style={{
                    filter: `drop-shadow(0 0 2px ${strokeColor})`,
                  }}
                />
              )
            })
          }

          // Fallback representation if D3 datasets fail to load
          if (!isMapDataLoaded) {
            return (
              <div
                className="relative w-full h-full bg-slate-950 overflow-hidden"
              >
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f15_1px,transparent_1px),linear-gradient(to_bottom,#0f0f15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70" />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/5 select-none pointer-events-none font-mono">
                  [ DIMENSIONAL RIFT MAP - FALLBACK GRID ]
                </div>
                {RIFT_REGIONS.map((region: RiftRegion) => {
                  const prog = getRegionProgress(region.id, riftNodesState)
                  const regionState = livingWorld?.regions[region.id]
                  const totalPower = regionState ? getRegionTotalPower(regionState, livingWorld.namedHunters) : 0
                  const occupiedMonarch = livingWorld?.activeMonarchs?.find(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(region.id))

                  return (
                    <div
                      key={region.id}
                      className="absolute pointer-events-none flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ left: `${region.labelX}%`, top: `${region.labelY}%` }}
                    >
                      {occupiedMonarch && (
                        <div className="absolute -inset-10 rounded-full bg-rose-600/10 blur-xl animate-pulse -z-10" />
                      )}
                      <div className={`rounded-full bg-black/75 border ${occupiedMonarch ? 'border-red-500/80 shadow-glow-red animate-pulse' : 'border-white/5'} px-2.5 py-0.5 text-[10px] font-black ${occupiedMonarch ? 'text-red-400' : 'text-white/60'} backdrop-blur-sm`}>
                        {occupiedMonarch ? `⚠️ ${region.name} (점령됨)` : region.name}
                      </div>
                      <div className={`text-[8px] ${occupiedMonarch ? 'text-red-300 font-bold bg-red-950/40 border border-red-500/25 px-1.5' : 'text-purple-300/80 bg-black/45 px-1'} font-mono mt-0.5 whitespace-nowrap rounded`}>
                        {occupiedMonarch 
                          ? `군주: ${MONARCHS.find(m => m.id === occupiedMonarch.monarchId)?.name ?? occupiedMonarch.monarchId}`
                          : `${totalPower > 0 ? `⚔️ ${(totalPower / 1000).toFixed(0)}k` : ''}`
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }

          // D3 World Map elements
          const activeLoveCalls = Object.values(livingWorld?.riftNodes ?? {})
            .filter((node: any) => node.loveCall?.active && (riftNodesState[node.id] ?? node.status) === 'active')

          return (
            <>
              {/* 바다 및 대륙 렌더링 SVG */}
              <svg
                ref={svgRef}
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                width="100%"
                height="100%"
                className="w-full h-full select-none block"
              >
                <defs>
                  <radialGradient id="ocean-gradient" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" stopColor="#0b1226" />
                    <stop offset="100%" stopColor="#04050c" />
                  </radialGradient>
                  
                  {/* Premium gradients for Stage 2 map effects */}
                  <linearGradient id="awakening-beam" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#eab308" stopOpacity="0" />
                    <stop offset="20%" stopColor="#eab308" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="80%" stopColor="#eab308" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                  </linearGradient>
                  
                  <radialGradient id="purify-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
                    <stop offset="60%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </radialGradient>
                  
                  <radialGradient id="occupy-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.7" />
                    <stop offset="70%" stopColor="#be123c" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>

                  <filter id="glow-base" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <style>{`
                    @keyframes map-dash {
                      to {
                        stroke-dashoffset: -40;
                      }
                    }
                    .link-animation {
                      animation: map-dash 2s linear infinite;
                    }
                    @keyframes pulse-ring {
                      0% { transform: scale(0.3); opacity: 0; }
                      50% { opacity: 0.8; }
                      100% { transform: scale(1.6); opacity: 0; }
                    }
                    .ring-pulse {
                      transform-origin: center;
                      animation: pulse-ring 2s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
                    }
                    
                    /* Stage 2 Micro-animations */
                    @keyframes map-light-beam {
                      0% { transform: scaleX(0.1); opacity: 0; }
                      15% { transform: scaleX(1); opacity: 1; }
                      85% { transform: scaleX(1); opacity: 1; }
                      100% { transform: scaleX(0); opacity: 0; }
                    }
                    .light-beam {
                      animation: map-light-beam 3.5s ease-out forwards;
                    }
                    
                    @keyframes map-purify-glow {
                      0% { transform: scale(0.1); opacity: 0.9; }
                      100% { transform: scale(2.2); opacity: 0; }
                    }
                    .purify-glow {
                      animation: map-purify-glow 3s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
                    }
                    
                    @keyframes map-occupy-pulse {
                      0% { transform: scale(0.1); opacity: 0; }
                      25% { opacity: 0.8; }
                      75% { opacity: 0.8; }
                      100% { transform: scale(1.8); opacity: 0; }
                    }
                    .occupy-pulse {
                      animation: map-occupy-pulse 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                    }
                    
                    @keyframes warning-ping {
                      0% { transform: scale(0.5); opacity: 0.9; stroke-width: 4; }
                      100% { transform: scale(2.4); opacity: 0; stroke-width: 1; }
                    }
                    .warning-ping-slow {
                      animation: warning-ping 3s cubic-bezier(0.16, 1, 0.3, 1) infinite;
                    }
                    
                    /* Scrolling News Marquee Ticker */
                    @keyframes marquee {
                      0% { transform: translateX(100%); }
                      100% { transform: translateX(-100%); }
                    }
                    .animate-marquee {
                      animation: marquee 28s linear infinite;
                    }
                  `}</style>
                </defs>

                {/* ZOOMABLE GROUP WRAPPER */}
                <g transform={`translate(${zoomTransform.x}, ${zoomTransform.y}) scale(${zoomTransform.k})`}>
                  {/* 바다 구형 배경 */}
                  <path d={pathGenerator({ type: 'Sphere' }) || ''} fill="url(#ocean-gradient)" />

                  {/* 경위선 */}
                  <path
                    d={pathGenerator(graticuleGenerator) || ''}
                    fill="none"
                    stroke="#1f2c4d"
                    strokeOpacity="0.2"
                    strokeWidth="0.5"
                  />

                  {/* 대륙 지리 렌더링 */}
                  <g className="countries-shapes">
                    {worldFeatures.map((f: any, idx: number) => {
                      const name = f.properties?.name
                      const regionId = getRegionIdByCountryName(name)

                      if (regionId) {
                        const regionState = livingWorld?.regions[regionId]
                        const corruption = regionState ? regionState.corruption : 0
                        const occupiedMonarch = livingWorld?.activeMonarchs?.find(
                          (m) => m.status === 'rampaging' && m.occupiedRegionIds.includes(regionId)
                        )
                        const colors = getCountryColors(regionId, corruption, !!occupiedMonarch)

                        return (
                          <path
                            key={`country-shape-${regionId}-${idx}`}
                            d={pathGenerator(f) || ''}
                            fill={colors.fill}
                            stroke={colors.stroke}
                            strokeWidth={regionId === 'kr' ? '1.5' : '1.0'}
                            className="transition-all duration-300 hover:fill-opacity-80 cursor-pointer"
                            style={{
                              filter: regionId === 'kr' || occupiedMonarch ? 'url(#glow-base)' : 'none',
                            }}
                            onClick={() => {
                              const regionObj = RIFT_REGIONS.find((r) => r.id === regionId)
                              if (regionObj) {
                                setActiveDetailRegion(regionObj)
                              }
                            }}
                          />
                        )
                      } else {
                        // 비주요 국가는 어두운 대륙색으로 렌더링
                        return (
                          <path
                            key={`country-shape-dark-${idx}`}
                            d={pathGenerator(f) || ''}
                            fill="#0d1120"
                            stroke="#171b30"
                            strokeWidth="0.5"
                            className="pointer-events-none opacity-85"
                          />
                        )
                      }
                    })}
                  </g>

                  {/* 차원 균열 네트워크 연결선 */}
                  <g className="connecting-lines-layer">
                    {renderConnectingLines()}
                  </g>

                  {/* 시네마틱 충격파 / 지진 이펙트 레이어 */}
                  <g className="map-effects-layer">
                    {mapEffects.map((eff) => {
                      if (eff.type === 'awakening') {
                        return (
                          <g key={eff.id}>
                            <circle cx={eff.x} cy={eff.y} r="6" fill="#eab308" opacity="0.8" className="animate-pulse" />
                            <line 
                              x1={eff.x} y1={eff.y} x2={eff.x} y2={eff.y - 120} 
                              stroke="url(#awakening-beam)" strokeWidth="8" 
                              className="light-beam" 
                              style={{ transformOrigin: `${eff.x}px ${eff.y}px` }} 
                            />
                          </g>
                        )
                      }
                      
                      if (eff.type === 'defeated') {
                        return (
                          <g key={eff.id}>
                            <circle 
                              cx={eff.x} cy={eff.y} r="45" 
                              fill="url(#purify-glow)" 
                              className="purify-glow" 
                              style={{ transformOrigin: `${eff.x}px ${eff.y}px` }} 
                            />
                            <circle 
                              cx={eff.x} cy={eff.y} r="45" 
                              fill="none" stroke="#10b981" strokeWidth="2" 
                              className="purify-glow" 
                              style={{ transformOrigin: `${eff.x}px ${eff.y}px`, animationDelay: '0.3s' }} 
                            />
                          </g>
                        )
                      }
                      
                      if (eff.type === 'home_threat' || eff.type === 'home_reached') {
                        return (
                          <g key={eff.id}>
                            <circle 
                              cx={eff.x} cy={eff.y} r="35" 
                              fill="none" stroke="#ef4444" strokeWidth="2.5" 
                              className="warning-ping-slow" 
                              style={{ transformOrigin: `${eff.x}px ${eff.y}px` }} 
                            />
                            <circle 
                              cx={eff.x} cy={eff.y} r="35" 
                              fill="none" stroke="#f97316" strokeWidth="1.5" 
                              className="warning-ping-slow" 
                              style={{ transformOrigin: `${eff.x}px ${eff.y}px`, animationDelay: '1s' }} 
                            />
                            <circle 
                              cx={eff.x} cy={eff.y} r="8" 
                              fill="#ef4444" 
                              className="animate-ping" 
                              style={{ transformOrigin: `${eff.x}px ${eff.y}px` }} 
                            />
                          </g>
                        )
                      }
                      
                      if (eff.type === 'occupied' || eff.type === 'expand') {
                        return (
                          <g key={eff.id}>
                            <circle 
                              cx={eff.x} cy={eff.y} r="50" 
                              fill="url(#occupy-glow)" 
                              className="occupy-pulse" 
                              style={{ transformOrigin: `${eff.x}px ${eff.y}px` }} 
                            />
                            <circle 
                              cx={eff.x} cy={eff.y} r="50" 
                              fill="none" stroke="#f43f5e" strokeWidth="3" 
                              className="occupy-pulse" 
                              style={{ transformOrigin: `${eff.x}px ${eff.y}px` }} 
                            />
                            <circle 
                              cx={eff.x} cy={eff.y} r="50" 
                              fill="none" stroke="#e11d48" strokeWidth="1.5" 
                              className="occupy-pulse" 
                              style={{ transformOrigin: `${eff.x}px ${eff.y}px`, animationDelay: '0.8s' }} 
                            />
                          </g>
                        )
                      }
                      
                      if (eff.type === 'gate_open') {
                        return (
                          <g key={eff.id}>
                            <circle 
                              cx={eff.x} cy={eff.y} r="15" 
                              fill="none" stroke="#06b6d4" strokeWidth="1.5" 
                              className="ring-pulse" 
                              style={{ transformOrigin: `${eff.x}px ${eff.y}px`, animationDuration: '1.8s' }} 
                            />
                          </g>
                        )
                      }
                      
                      if (eff.type === 'gate_surge') {
                        return (
                          <g key={eff.id}>
                            <circle 
                              cx={eff.x} cy={eff.y} r="25" 
                              fill="none" stroke="#dc2626" strokeWidth="3" 
                              className="ring-pulse" 
                              style={{ transformOrigin: `${eff.x}px ${eff.y}px`, animationDuration: '1.2s' }} 
                            />
                            <circle 
                              cx={eff.x} cy={eff.y} r="25" 
                              fill="none" stroke="#ea580c" strokeWidth="1.5" 
                              className="ring-pulse" 
                              style={{ transformOrigin: `${eff.x}px ${eff.y}px`, animationDuration: '1.2s', animationDelay: '0.3s' }} 
                            />
                          </g>
                        )
                      }
                      
                      // Default Monarch Appear / Fallback shockwave
                      return (
                        <g key={eff.id}>
                          <circle 
                            cx={eff.x} cy={eff.y} r="60" 
                            fill="none" stroke={eff.color} strokeWidth="4" 
                            className="ring-pulse" 
                            style={{ transformOrigin: `${eff.x}px ${eff.y}px`, animationDuration: '2.5s' }} 
                          />
                          <circle 
                            cx={eff.x} cy={eff.y} r="60" 
                            fill="none" stroke={eff.color === '#ef4444' ? '#991b1b' : '#334155'} strokeWidth="2" 
                            className="ring-pulse" 
                            style={{ transformOrigin: `${eff.x}px ${eff.y}px`, animationDuration: '2.5s', animationDelay: '0.6s' }} 
                          />
                          <circle 
                            cx={eff.x} cy={eff.y} r="10" 
                            fill={eff.color} 
                            className="animate-pulse" 
                            style={{ opacity: 0.5, filter: `drop-shadow(0 0 10px ${eff.color})` }} 
                          />
                        </g>
                      )
                    })}
                  </g>

                  {/* 거점 국가 중심점 마커 및 레이블 */}
                  <g className="region-markers-layer">
                    {RIFT_REGIONS.map((region: RiftRegion) => {
                      const centroid = REGION_CENTROIDS[region.id]
                      if (!centroid) return null

                      const [x, y] = centroid
                      const prog = getRegionProgress(region.id, riftNodesState)
                      const regionState = livingWorld?.regions[region.id]
                      const totalPower = regionState ? getRegionTotalPower(regionState, livingWorld.namedHunters) : 0
                      const occupiedMonarch = livingWorld?.activeMonarchs?.find(
                        (m) => m.status === 'rampaging' && m.occupiedRegionIds.includes(region.id)
                      )
                      const corruption = regionState ? regionState.corruption : 0
                      const colors = getCountryColors(region.id, corruption, !!occupiedMonarch)

                      // 모든 국가 이름 상시 표시 (유저 지시사항 반영)
                      const isLabelPriority = true
                      const showStats = zoomTransform.k >= 1.8

                      return (
                        <g key={`marker-region-${region.id}`} className="cursor-pointer">
                          {/* 클릭 영역 증강용 투명 써클 */}
                          <circle
                            cx={x}
                            cy={y}
                            r="22"
                            fill="transparent"
                            onClick={() => setActiveDetailRegion(region)}
                          />

                          {/* 점령/위험 상태 시 맥박 링 */}
                          {(occupiedMonarch || corruption > 50) && (
                            <circle
                              cx={x}
                              cy={y}
                              r="15"
                              fill="none"
                              stroke={colors.stroke}
                              strokeWidth="1.5"
                              className="ring-pulse"
                            />
                          )}

                          {/* 국가 중심 원 코어 */}
                          <circle
                            cx={x}
                            cy={y}
                            r={region.id === 'kr' ? '5.5' : '4'}
                            fill={colors.stroke}
                            stroke="#04050c"
                            strokeWidth="1"
                            onClick={() => setActiveDetailRegion(region)}
                            style={{
                              filter: `drop-shadow(0 0 3px ${colors.stroke})`,
                            }}
                          />

                          {/* 텍스트 정보 레이블 (가독성 Contrast Outline 적용) */}
                          <g
                            transform={`translate(${x}, ${y - 12})`}
                            onClick={() => setActiveDetailRegion(region)}
                            className={`transition-opacity duration-300 pointer-events-none ${
                              isLabelPriority ? 'opacity-100' : 'opacity-0 hidden'
                            }`}
                          >
                            <text
                              textAnchor="middle"
                              className="text-[10px] font-black fill-white stroke-black stroke-[3.5px] select-none tracking-wide"
                              style={{
                                paintOrder: 'stroke',
                                strokeLinejoin: 'round',
                              }}
                            >
                              {occupiedMonarch ? `⚠️ ${region.name} (점령됨)` : region.name}
                            </text>
                            
                            {showStats && (
                              <text
                                y="10.5"
                                textAnchor="middle"
                                className={`text-[8.5px] font-mono font-black ${
                                  occupiedMonarch ? 'fill-red-400 font-extrabold' : 'fill-purple-200'
                                } stroke-black stroke-[2.5px] select-none`}
                                style={{
                                  paintOrder: 'stroke',
                                  strokeLinejoin: 'round',
                                }}
                              >
                                {occupiedMonarch
                                  ? `군주: ${MONARCHS.find((m) => m.id === occupiedMonarch.monarchId)?.name ?? occupiedMonarch.monarchId}`
                                  : `${totalPower > 0 ? `⚔️ ${(totalPower / 1000).toFixed(0)}k` : ''}`}
                              </text>
                            )}
                          </g>
                        </g>
                      )
                    })}
                  </g>

                  {/* 게이트 노드 렌더링 - 한국 활성 게이트, 활성화된 러브콜 노드, 그리고 타국가 S급 게이트 */}
                  <g className="gate-nodes-layer">
                    {Object.values(livingWorld?.riftNodes ?? {})
                      .filter(
                        (node: any) =>
                          (node.regionId === 'kr' || node.loveCall?.active || node.isSGrade) &&
                          (riftNodesState[node.id] ?? node.status) === 'active'
                      )
                      .map((node: any) => {
                        const status = riftNodesState[node.id] ?? node.status
                        const worldNode = livingWorld?.riftNodes[node.id]
                        const isNodeRegionOccupied = livingWorld?.activeMonarchs?.some(
                          (m) => m.status === 'rampaging' && m.occupiedRegionIds.includes(node.regionId)
                        )
                        const hasLoveCall = worldNode?.loveCall?.active
                        
                        // 타국가이면서 러브콜도 아직 없는데 S급 게이트인 경우 -> 현황 파악용 비공략 시각 노드
                        const isNonLocalUnacceptedS = node.regionId !== 'kr' && !hasLoveCall && node.isSGrade
                        
                        const [x, y] = getNodeCoordinates(node)

                        const strokeColor = isNodeRegionOccupied 
                          ? '#ef4444' 
                          : hasLoveCall 
                          ? '#fbbf24' 
                          : isNonLocalUnacceptedS 
                          ? '#a855f7' // S급 시각용 얌전한 보라색
                          : '#22d3ee'
                          
                        const bgColor = isNodeRegionOccupied 
                          ? '#380c10' 
                          : hasLoveCall 
                          ? '#2e1d09' 
                          : isNonLocalUnacceptedS 
                          ? '#2e1035' // 얌전한 딥보라 배경
                          : '#083344'

                        // S급 시각 노드는 약간의 존재감을 주되 얌전하게 5.0 (일반 4.5, 서울 허브 5.5)
                        const nodeRadius = isNonLocalUnacceptedS ? 5.0 : 4.5

                        // 줌 스케일 및 러브콜, S급 여부에 따른 라벨 가독성 제어
                        const showGateLabel = hasLoveCall || isNonLocalUnacceptedS || (selectedNode && selectedNode.id === node.id) || zoomTransform.k >= 2.0

                        return (
                          <g
                            key={`gate-node-${node.id}`}
                            className="cursor-pointer group"
                            onClick={() => {
                              if (isNonLocalUnacceptedS) {
                                triggerToast(`[${node.name}]은 타국가의 S급 게이트입니다. 지원 요청(러브콜) 수락 후에 공략할 수 있습니다.`)
                                return
                              }
                              handleNodeClick(node)
                            }}
                          >
                            <circle
                              cx={x}
                              cy={y}
                              r={nodeRadius}
                              fill={bgColor}
                              stroke={strokeColor}
                              strokeWidth="1.5"
                              style={{
                                filter: `drop-shadow(0 0 3px ${strokeColor})`,
                              }}
                            />

                            {hasLoveCall && (
                              <g transform={`translate(${x + 6}, ${y - 6})`}>
                                <circle cx="0" cy="0" r="4.5" fill="#fbbf24" />
                                <text x="0" y="2" textAnchor="middle" className="text-[6px] font-black fill-black">
                                  📞
                                </text>
                              </g>
                            )}

                            {showGateLabel && (
                              <g
                                transform={`translate(${x}, ${y + 11})`}
                                className="opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none"
                              >
                                <text
                                  textAnchor="middle"
                                  className={`text-[7.5px] font-black ${
                                    isNodeRegionOccupied
                                      ? 'fill-red-300'
                                      : hasLoveCall
                                      ? 'fill-amber-200'
                                      : isNonLocalUnacceptedS
                                      ? 'fill-purple-300'
                                      : 'fill-cyan-300'
                                  } stroke-black stroke-[2.5px] select-none`}
                                  style={{
                                    paintOrder: 'stroke',
                                    strokeLinejoin: 'round',
                                  }}
                                >
                                  {hasLoveCall 
                                    ? `📞 [지원] ${node.name}` 
                                    : isNonLocalUnacceptedS 
                                    ? `👿 [S급] ${node.name}` 
                                    : node.name
                                  }
                                </text>
                              </g>
                            )}
                          </g>
                        )
                      })}
                  </g>

                  {/* 군주 노드 침공 아이콘 */}
                  <g className="monarch-invasion-layer">
                    {livingWorld?.activeMonarchs
                      ?.filter((m: any) => m.status === 'rampaging')
                      .map((monarch: any) => {
                        const mData = MONARCHS.find((m) => m.id === monarch.monarchId)
                        if (!mData) return null
                        const regionId = monarch.occupiedRegionIds[0] || 'kr'
                        const centroid = REGION_CENTROIDS[regionId]
                        if (!centroid) return null

                        // 헌터 마커와 겹치지 않게 오른쪽 아래에 배치
                        const x = centroid[0] + 5
                        const y = centroid[1] + 6

                        return (
                          <g
                            key={`monarch-marker-${monarch.monarchId}`}
                            className="cursor-pointer group"
                            onClick={() =>
                              handleNodeClick({
                                id: monarch.monarchId,
                                regionId,
                                name: mData.name,
                                x,
                                y,
                                status: 'active',
                                gateDefId: monarch.monarchId,
                                difficultyRank: 'S',
                                difficulty: mData.recommendedCP,
                                deadline: 999,
                                daysRemaining: 999,
                                isSGrade: true,
                              })
                            }
                          >
                            <circle
                              cx={x}
                              cy={y}
                              r="11"
                              fill="rgba(226, 75, 74, 0.15)"
                              stroke="#e24b4a"
                              strokeWidth="1"
                              className="ring-pulse"
                            />
                            <circle
                              cx={x}
                              cy={y}
                              r="6.5"
                              fill="#3d1216"
                              stroke="#ef4444"
                              strokeWidth="1.5"
                              style={{
                                filter: 'drop-shadow(0 0 4px #ef4444)',
                              }}
                            />
                            <text x={x} y={y + 2.5} textAnchor="middle" className="text-[7.5px] select-none font-bold">
                              👑
                            </text>

                            <g transform={`translate(${x}, ${y + 13})`} className="pointer-events-none">
                              <text
                                textAnchor="middle"
                                className="text-[7.5px] font-black fill-red-200 stroke-black stroke-[2.5px] select-none"
                                style={{
                                  paintOrder: 'stroke',
                                  strokeLinejoin: 'round',
                                }}
                              >
                                {mData.name} (침공)
                              </text>
                            </g>
                          </g>
                        )
                      })}
                  </g>
                </g>
              </svg>

              {/* [OVERLAY 1] COLLAPSIBLE LOVE CALLS HUD (TOP LEFT) */}
              <div 
                className={`absolute top-4 left-4 z-10 w-[300px] max-w-[calc(100vw-2rem)] flex flex-col pointer-events-auto backdrop-blur-md bg-ink-950/85 border border-amber-500/20 rounded-lg shadow-glow-amber/5 overflow-hidden transition-all duration-300 ${
                  isLoveCallsExpanded ? 'max-h-[85%]' : 'max-h-[42px]'
                }`}
              >
                <div className="p-3 border-b border-amber-500/15 flex items-center justify-between bg-amber-500/5">
                  <span className="font-extrabold text-[11px] text-amber-400 flex items-center gap-1.5">
                    📞 세계 지원 요청 ({activeLoveCalls.length})
                  </span>
                  <button
                    onClick={() => setIsLoveCallsExpanded(!isLoveCallsExpanded)}
                    className="rounded hover:bg-white/10 px-2 py-0.5 text-[9px] font-black text-amber-300 transition-all cursor-pointer border border-amber-500/25"
                  >
                    {isLoveCallsExpanded ? '접기 ▲' : '열기 ▼'}
                  </button>
                </div>

                {isLoveCallsExpanded && (
                  <div className="overflow-y-auto p-2.5 space-y-2.5 max-h-[360px] scrollbar-thin">
                    {activeLoveCalls.length === 0 ? (
                      <div className="text-center text-white/35 text-[10px] py-6">
                        <Globe className="mx-auto mb-2 h-5 w-5 text-white/15 animate-pulse" />
                        <p className="font-medium text-white/50">현재 대기 중인 세계의 호출이 없습니다.</p>
                        <p className="text-[8px] text-white/30 mt-0.5">대한민국 거점 전선을 지켜주십시오.</p>
                      </div>
                    ) : (
                      activeLoveCalls.map((node: any) => {
                        const rName = RIFT_REGIONS.find((r) => r.id === node.regionId)?.name ?? node.regionId.toUpperCase()
                        const flag = REGION_FLAGS[node.regionId] || '🌐'
                        const loveCall = node.loveCall
                        if (!loveCall) return null

                        let cpLabel = '진입 무모'
                        let cpColorBadge = 'bg-red-500/10 border-red-500/20 text-red-400'
                        if (playerPower >= node.difficulty) {
                          cpLabel = '안전'
                          cpColorBadge = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        } else if (playerPower >= node.difficulty * 0.7) {
                          cpLabel = '위험'
                          cpColorBadge = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        }

                        const helpersNameList = loveCall.helperHunterIds
                          .map((hid: string) => livingWorld?.namedHunters[hid]?.name)
                          .filter(Boolean)
                          .join(', ')

                        return (
                          <div
                            key={node.id}
                            className="rounded border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 p-2.5 transition-all space-y-1.5 shadow-md"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-[10px] text-amber-300 flex items-center gap-1">
                                {flag} {rName}
                              </span>
                              <div className="flex gap-1 items-center scale-90 origin-right">
                                <span className="rounded bg-amber-500/25 px-1 py-0.2 text-[8px] font-black text-amber-200 border border-amber-400/20 uppercase tracking-tighter">
                                  {node.difficultyRank}급
                                </span>
                                <span className={`rounded border px-1 py-0.2 text-[8px] font-bold ${
                                  (node.daysRemaining ?? 0) <= 2 ? 'bg-red-500/20 border-red-500/30 text-red-300 animate-pulse' : 'bg-black/30 border-white/5 text-yellow-300'
                                }`}>
                                  D-{node.daysRemaining}
                                </span>
                              </div>
                            </div>

                            <div className="font-bold text-[11px] text-white/95 truncate">
                              {node.name}
                            </div>

                            <div className="flex justify-between items-center text-[8.5px] bg-black/40 rounded px-1.5 py-0.5 text-white/70">
                              <span>권장: <strong className="font-mono">{node.difficulty?.toLocaleString()}</strong></span>
                              <span>내 CP: <strong className="font-mono text-cyan-300">{playerPower?.toLocaleString()}</strong></span>
                              <span className={`rounded border px-1 text-[7.5px] font-black ${cpColorBadge}`}>{cpLabel}</span>
                            </div>

                            {helpersNameList && (
                              <div className="text-[8px] text-white/50 bg-black/20 rounded p-1 border border-white/5 truncate">
                                <span className="font-bold text-amber-300/80">공조: </span>
                                <span className="italic">{helpersNameList}</span>
                              </div>
                            )}

                            {/* [GEOGRAPHICAL SMOOTH ZOOM FOCUS] */}
                            <div className="grid grid-cols-2 gap-1 pt-1.5">
                              <button
                                onClick={() => {
                                  const coords = REGION_CENTROIDS[node.regionId]
                                  if (coords) {
                                    focusOnCoords(coords[0], coords[1], 3.5)
                                  }
                                  handleNodeClick(node)
                                }}
                                className="rounded border border-white/10 bg-black/25 hover:bg-black/60 py-1 text-[8.5px] font-bold text-white/75 transition-all cursor-pointer text-center"
                              >
                                📍 추적/확인
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedNode(node)
                                  setSelectedHelpers(loveCall.helperHunterIds ?? [])
                                  
                                  const level = getDangerLevel(node)
                                  if (level === 'reckless') {
                                    setRecklessConfirmType('manual')
                                    setShowRecklessConfirm(true)
                                  } else {
                                    startWorldManualBattle(node.id, loveCall.helperHunterIds ?? [])
                                  }
                                }}
                                className="rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 hover:border-amber-400 py-1 text-[8.5px] font-black text-amber-200 transition-all cursor-pointer text-center flex items-center justify-center gap-0.5 shadow shadow-amber-950/20"
                              >
                                ⚔️ 원정 수락
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* [OVERLAY 2] GEOGRAPHICAL DETAILED DOSSIER HUD (SLIDE IN RIGHT SIDEBAR) */}
              {selectedNode && (() => {
                const isMonarchNode = MONARCHS.some(m => m.id === selectedNode.id) || selectedNode.id === 'angel'
                const monarchData = selectedNode.id === 'angel' ? FINAL_ANGEL : MONARCHS.find(m => m.id === selectedNode.id)
                const regionState = livingWorld?.regions[selectedNode.regionId]

                return (
                  <div className="absolute top-4 right-4 bottom-4 z-10 w-[330px] max-w-[calc(100vw-2rem)] flex flex-col pointer-events-auto backdrop-blur-md bg-ink-950/85 border border-purple-500/25 rounded-lg shadow-glow-purple/10 overflow-hidden animate-slide-in">
                    
                    {/* Header */}
                    <div className="p-3.5 border-b border-purple-500/20 flex items-start justify-between bg-purple-500/5">
                      <div>
                        <span className="rounded border border-purple-400/20 bg-purple-500/10 px-1.5 py-0.5 text-[8.5px] text-purple-200 uppercase tracking-widest font-black">
                          {isMonarchNode ? '👑 군주 출현지' : '📍 차원 균열 작전'} : {RIFT_REGIONS.find((r) => r.id === selectedNode.regionId)?.name}
                        </span>
                        <h4 className="mt-1.5 text-xs font-black text-white truncate max-w-[240px]">
                          {selectedNode.name || selectedNode.id.toUpperCase()}
                        </h4>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="rounded p-1 hover:bg-white/10 text-white/45 hover:text-white cursor-pointer transition-all border border-transparent hover:border-white/10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Dossier Body Scrollable */}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin">
                      {isMonarchNode && monarchData ? (() => {
                        const namedHuntersInRegion = selectedNode.id === 'angel'
                          ? Object.keys(livingWorld?.namedHunters ?? {}).filter(hid => livingWorld?.namedHunters[hid]?.status === 'active')
                          : (regionState?.namedHunterIds || [])
                        const activeMonarchState = livingWorld?.activeMonarchs?.find(m => m.monarchId === selectedNode.id)
                        const isDefeated = selectedNode.id === 'angel'
                          ? (livingWorld?.endingState === 'victory')
                          : (activeMonarchState?.status === 'defeated')

                        return (
                          <>
                            <div className="space-y-2 text-[10px]">
                              <div className="flex justify-between border-b border-white/5 pb-1.5">
                                <span className="text-white/45">군주 전술 상태</span>
                                <span className={isDefeated ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold animate-pulse'}>
                                  {isDefeated ? '격퇴됨 (평화)' : '점령지 폭주/위협 중'}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-white/5 pb-1.5">
                                <span className="text-white/45">군주 서열</span>
                                <span className="font-bold text-red-300">
                                  {monarchData.rank === 0 ? 'SPECIAL' : `제 ${monarchData.rank}위`}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-white/5 pb-1.5">
                                <span className="text-white/45">테마 / 속성</span>
                                <span className="font-mono text-purple-300">
                                  {monarchData.theme}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-white/5 pb-1.5">
                                <span className="text-white/45">권장 전투력</span>
                                <span className="font-bold text-pink-300">
                                  {monarchData.recommendedCP.toLocaleString()} CP
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-white/5 pb-1.5">
                                <span className="text-white/45">내 실효 전투력</span>
                                <span className="font-bold text-cyan-300">
                                  {playerPower.toLocaleString()} CP
                                </span>
                              </div>
                            </div>

                            {/* 위험도 판단 경고 */}
                            <div className="rounded border p-2 flex flex-col gap-1 bg-black/35 border-white/5 text-[9.5px]">
                              {getDangerLevel(selectedNode) === 'safe' && (
                                <div className="text-emerald-400 flex items-center gap-1.5 font-bold">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span>안전: 전력이 충분히 장악하고 있습니다.</span>
                                </div>
                              )}
                              {getDangerLevel(selectedNode) === 'danger' && (
                                <div className="text-yellow-400 flex items-center gap-1.5 font-bold">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  <span>위험: 거센 타격이 예상되는 격전지입니다.</span>
                                </div>
                              )}
                              {getDangerLevel(selectedNode) === 'reckless' && (
                                <div className="text-rose-400 flex flex-col gap-1 font-bold border border-rose-500/20 bg-rose-500/5 rounded p-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
                                    <span>⚠️ 무모: 장비 파손 및 즉사 경보!</span>
                                  </div>
                                  <span className="text-[8.5px] font-medium text-rose-300/80 leading-normal">
                                    그림자 수호 장막(탱킹) 없이는 원샷원킬됩니다.
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* 그림자 탱킹 준비 */}
                            <div className="rounded border border-purple-500/20 bg-purple-500/5 p-2.5 text-[9px] text-purple-200">
                              <div className="font-bold text-purple-300 mb-0.5">🛡️ 그림자 탱킹 시스템</div>
                              {equippedShadows.length > 0 ? (
                                <span>
                                  장착 그림자 <span className="font-bold text-cyan-300">{equippedShadows.length}명</span>으로 수호 장막(Shield) 활성화 완료!
                                </span>
                              ) : (
                                <span className="text-rose-400 font-bold animate-pulse">
                                  ⚠️ 장착 그림자 없음! 진입 시 탱킹 장막 미작동으로 100% 즉사합니다. 그림자 장착 필수!
                                </span>
                              )}
                            </div>

                            {/* 협력 헌터 선택 리스트 */}
                            {!isDefeated && namedHuntersInRegion.length > 0 && (
                              <div className="rounded border border-yellow-500/20 bg-yellow-500/5 p-2.5 space-y-1.5">
                                <div className="text-[10px] font-black text-yellow-300">
                                  {selectedNode.id === 'angel' 
                                    ? '🤝 인류의 최후 연합: 지고의 격퇴 연대' 
                                    : `🤝 연대 전투: 현지 공조 헌터`}
                                </div>
                                <p className="text-[8.5px] text-white/50 leading-normal">
                                  {selectedNode.id === 'angel'
                                    ? '전 세계 모든 생존한 정예 헌터들과 연합하여 공략 전력을 극대화할 수 있습니다.'
                                    : '지역 헌터들과 연합하여 버프를 얻는 대신, 보상이 일부 차감됩니다.'}
                                </p>
                                <div className="max-h-24 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
                                  {namedHuntersInRegion.map(hid => {
                                    const h = livingWorld?.namedHunters[hid]
                                    if (!h) return null
                                    const isSelected = selectedHelpers.includes(hid)
                                    const totalPower = h.power + (h.equipmentScore ?? 0)
                                    return (
                                      <label key={hid} className="flex items-center justify-between rounded bg-black/35 hover:bg-black/60 px-1.5 py-0.5 cursor-pointer select-none text-[8.5px] border border-white/5">
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleHelperToggle(hid)}
                                            className="accent-purple-500 h-2.5 w-2.5 cursor-pointer"
                                          />
                                          <span className="font-bold text-white/80">{h.name}</span>
                                          <span className="rounded bg-purple-500/20 px-1 text-purple-300 font-bold" style={{ fontSize: '7px' }}>
                                            {h.rank}
                                          </span>
                                        </div>
                                        <span className="text-cyan-300 font-mono">⚔️{totalPower.toLocaleString()}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 조작 버튼 */}
                            <div className="pt-2">
                              {isNodeRetreatedToday(selectedNode.id) ? (
                                <div className="rounded border border-rose-500/25 bg-rose-500/5 p-2 text-[9px] text-rose-300/85 text-center font-bold">
                                  ⚠️ 오늘 후퇴 전력이 있어 차단됨. 내일 재진입 가능.
                                </div>
                              ) : isDefeated ? (
                                <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2 text-[9.5px] text-emerald-200 text-center font-bold">
                                  이 군주는 이미 격퇴되었습니다.
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    const level = getDangerLevel(selectedNode)
                                    if (level === 'reckless') {
                                      setRecklessConfirmType('manual')
                                      setShowRecklessConfirm(true)
                                    } else {
                                      startWorldManualBattle(selectedNode.id, selectedHelpers)
                                    }
                                  }}
                                  className="btn border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-500/15 w-full flex items-center justify-center gap-1.5 py-2 text-[10px] text-cyan-200 font-black tracking-widest transition-all cursor-pointer shadow-glow-blue"
                                >
                                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                                  군주 격퇴 원정 개시
                                </button>
                              )}
                            </div>
                          </>
                        )
                      })() : (() => {
                        const status = riftNodesState[selectedNode.id] ?? selectedNode.status

                        return (
                          <>
                            <div className="space-y-2 text-[10px]">
                              <div className="flex justify-between border-b border-white/5 pb-1.5">
                                <span className="text-white/45">구역 정화 상태</span>
                                <span className={
                                  status === 'cleared' ? 'text-emerald-400 font-bold' :
                                  status === 'active' ? 'text-cyan-400 font-bold' : 'text-white/30'
                                }>
                                  {
                                    status === 'cleared' ? '완전 정화 완료' :
                                    status === 'active' ? '정화 작전 진행 중' : '탐사 대기'
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-white/5 pb-1.5">
                                <span className="text-white/45">난이도 등급</span>
                                <span className="font-bold text-cyan-300">
                                  {selectedNode.difficultyRank ?? 'E'}-RANK
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-white/5 pb-1.5">
                                <span className="text-white/45">권장 전투력</span>
                                <span className="font-bold text-pink-300">
                                  {(selectedNode.difficulty ?? 0).toLocaleString()} CP
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-white/5 pb-1.5">
                                <span className="text-white/45">내 전투력</span>
                                <span className="font-bold text-cyan-300">
                                  {playerPower.toLocaleString()} CP
                                </span>
                              </div>

                              {selectedNode.daysRemaining !== undefined && (
                                <div className="flex justify-between border-b border-white/5 pb-1.5">
                                  <span className="text-white/45">소멸/폭주 한계</span>
                                  <span className={`font-bold ${(selectedNode.daysRemaining ?? 0) <= 2 ? 'text-red-400 animate-pulse' : 'text-yellow-300'}`}>
                                    {selectedNode.daysRemaining}일 남음 / 총 {selectedNode.deadline}일
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* 위험도 경고 */}
                            <div className="rounded border p-2 flex flex-col gap-1 bg-black/35 border-white/5 text-[9.5px]">
                              {getDangerLevel(selectedNode) === 'safe' && (
                                <div className="text-emerald-400 flex items-center gap-1.5 font-bold">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span>안전: 아군 전력이 충분히 수월한 공략입니다.</span>
                                </div>
                              )}
                              {getDangerLevel(selectedNode) === 'danger' && (
                                <div className="text-yellow-400 flex items-center gap-1.5 font-bold">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  <span>위험: 균열 압박이 있으나 도전 해볼 만합니다.</span>
                                </div>
                              )}
                              {getDangerLevel(selectedNode) === 'reckless' && (
                                <div className="text-rose-400 flex flex-col gap-1 font-bold border border-rose-500/20 bg-rose-500/5 rounded p-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
                                    <span>⚠️ 무모: 대단히 높은 전사 위험!</span>
                                  </div>
                                  <span className="text-[8.5px] font-medium text-rose-300/80 leading-normal">
                                    레벨업 후 진입하거나 공조 헌터를 대거 영입하십시오.
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* 대한민국 게이트 특별 합류(공조) */}
                            {!hasLoveCall && selectedNode.regionId === 'kr' && status === 'active' && (
                              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-2.5 space-y-1.5">
                                <div className="text-[10px] font-black text-cyan-300">
                                  🤝 대한민국 헌터 연합 동맹
                                </div>
                                <p className="text-[8.5px] text-white/60 leading-normal">
                                  대한민국 헌터 협회 동료들과 공조하여 전투의 안정성을 올립니다.
                                </p>
                                <div className="max-h-24 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
                                  {(() => {
                                    const krRegionState = livingWorld?.regions['kr']
                                    const krHelperHunterIds = krRegionState 
                                      ? krRegionState.namedHunterIds.filter(hid => livingWorld?.namedHunters[hid]?.status === 'active') 
                                      : []

                                    if (krHelperHunterIds.length === 0) {
                                      return <div className="text-[8px] text-white/40 italic">현재 생존 지원 헌터 없음.</div>
                                    }

                                    return krHelperHunterIds.map(hid => {
                                      const h = livingWorld?.namedHunters[hid]
                                      if (!h) return null
                                      const isSelected = selectedHelpers.includes(hid)
                                      return (
                                        <label key={hid} className="flex items-center justify-between rounded bg-black/35 hover:bg-black/60 px-1.5 py-0.5 cursor-pointer select-none text-[8.5px] border border-white/5">
                                          <div className="flex items-center gap-1.5">
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => handleHelperToggle(hid)}
                                              className="accent-cyan-500 h-2.5 w-2.5 cursor-pointer"
                                            />
                                            <span className="font-bold text-white/80">{h.name}</span>
                                            <span className="rounded bg-cyan-500/20 px-1 text-[7px] font-bold text-cyan-300">
                                              {h.rank}
                                            </span>
                                          </div>
                                          <span className="text-cyan-300 font-mono">⚔️{(h.power + (h.equipmentScore ?? 0)).toLocaleString()}</span>
                                        </label>
                                      )
                                    })
                                  })()}
                                </div>
                              </div>
                            )}

                            {/* 긴급 러브콜 지원 요청인 경우 상황판 */}
                            {hasLoveCall && loveCallState && (() => {
                              const nodeTheme = getRegionalTheme(selectedNode.subRegionId || selectedNode.regionId)
                              return (
                                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 space-y-2">
                                  <div className="text-[9.5px] text-white/70 border-l-2 border-amber-500/40 pl-2 py-0.5 bg-black/15 rounded-r leading-relaxed italic">
                                    "{nodeTheme.loveCallNarrative}"
                                  </div>
                                  <div className="rounded bg-black/40 p-1.5 space-y-0.5 text-[8.5px] border border-white/5">
                                    <div className="flex justify-between font-bold text-white/40">
                                      <span>지원금 약속</span>
                                      <span className="text-amber-400">특수 수당 적용</span>
                                    </div>
                                    <div className="flex justify-between text-white/75">
                                      <span>골드 배당</span>
                                      <span className="font-bold text-amber-300">+{loveCallState.promisedReward.gold} G</span>
                                    </div>
                                    <div className="flex justify-between text-white/75">
                                      <span>어둠의 정수</span>
                                      <span className="font-bold text-purple-300">+{loveCallState.promisedReward.shadowEssence} 정수</span>
                                    </div>
                                  </div>

                                  {/* 러브콜 공조 헌터 선택 */}
                                  <div className="space-y-1">
                                    <span className="text-[8.5px] text-white/40 font-bold">협력 공조 헌터 목록</span>
                                    {loveCallState.helperHunterIds.length === 0 ? (
                                      <div className="text-[8px] text-white/40 italic">공조 참전 가능한 지원 헌터 없음.</div>
                                    ) : (
                                      <div className="max-h-24 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
                                        {loveCallState.helperHunterIds.map(hid => {
                                          const h = livingWorld?.namedHunters[hid]
                                          if (!h) return null
                                          const isSelected = selectedHelpers.includes(hid)
                                          return (
                                            <label key={hid} className="flex items-center justify-between rounded bg-black/35 hover:bg-black/60 px-1.5 py-0.5 cursor-pointer select-none text-[8.5px] border border-white/5">
                                              <div className="flex items-center gap-1.5">
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  onChange={() => handleHelperToggle(hid)}
                                                  className="accent-purple-500 h-2.5 w-2.5 cursor-pointer"
                                                />
                                                <span className="font-bold text-white/80">{h.name}</span>
                                                <span className="rounded bg-purple-500/20 px-1 text-[7px] font-bold text-purple-300">
                                                  {h.rank}
                                                </span>
                                              </div>
                                              <span className="text-cyan-300 font-mono">⚔️{(h.power + (h.equipmentScore ?? 0)).toLocaleString()}</span>
                                            </label>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })()}

                            {/* 공조 버프 계산 및 트레이드오프 예측 피드백 */}
                            {selectedHelpers.length > 0 && (
                              <div className="rounded border border-purple-500/20 bg-purple-500/5 p-2 text-[8.5px] space-y-1 font-mono">
                                <div className="text-purple-300 font-bold font-sans">⚖️ 연대 전투 시뮬레이션</div>
                                <div className="grid grid-cols-2 gap-x-1 text-white/70">
                                  <div>공격력 지원:</div>
                                  <div className="text-emerald-400 font-bold">+{coopBuffs.atk.toLocaleString()} ATK</div>
                                  <div>받는 피해:</div>
                                  <div className="text-emerald-400 font-bold">-{Math.round(coopBuffs.dr * 100)}% DMG</div>
                                  <div>보상 배율:</div>
                                  <div className="text-yellow-400 font-bold">{Math.round(coopBuffs.rewardRatio * 100)}% (분배 수당 적용)</div>
                                </div>
                              </div>
                            )}

                            {/* 조작 정화 전투 개시 */}
                            <div className="pt-2">
                              {isNodeRetreatedToday(selectedNode.id) ? (
                                <div className="rounded border border-rose-500/25 bg-rose-500/5 p-2 text-[9px] text-rose-300/85 text-center font-bold">
                                  ⚠️ 오늘 후퇴 이력이 있어 차단됨. 내일 재시도 가능.
                                </div>
                              ) : (
                                <>
                                  {status === 'cleared' && (
                                    <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-1.5 text-[8.5px] text-emerald-200 text-center mb-1">
                                      정화 완료 구역입니다. 반복 공략할 수 없습니다.
                                    </div>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (status !== 'active') return
                                      const level = getDangerLevel(selectedNode)
                                      if (level === 'reckless') {
                                        setRecklessConfirmType('manual')
                                        setShowRecklessConfirm(true)
                                      } else {
                                        startWorldManualBattle(selectedNode.id, selectedHelpers)
                                      }
                                    }}
                                    disabled={status !== 'active'}
                                    className="btn border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-500/15 w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-cyan-200 transition-all cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Zap className="h-3 w-3 text-cyan-400" />
                                    {status === 'cleared' ? '정화 완료' : '수동 조작 정화 개시 (카드 전투)'}
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )
              })()}

              {/* [OVERLAY 3] FLOATING MAP CONTROL ACTIONS (BOTTOM RIGHT) */}
              <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
                <button
                  onClick={() => {
                    if (svgRef.current && zoomBehaviorRef.current) {
                      select(svgRef.current as any)
                        .transition()
                        .duration(300)
                        .call(zoomBehaviorRef.current.scaleBy, 1.5)
                    }
                  }}
                  title="확대"
                  className="w-9 h-9 rounded-full bg-ink-950/85 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all font-mono font-bold text-lg pointer-events-auto shadow-md cursor-pointer select-none"
                >
                  ＋
                </button>
                <button
                  onClick={() => {
                    if (svgRef.current && zoomBehaviorRef.current) {
                      select(svgRef.current as any)
                        .transition()
                        .duration(300)
                        .call(zoomBehaviorRef.current.scaleBy, 1 / 1.5)
                    }
                  }}
                  title="축소"
                  className="w-9 h-9 rounded-full bg-ink-950/85 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all font-mono font-bold text-lg pointer-events-auto shadow-md cursor-pointer select-none"
                >
                  －
                </button>
                <button
                  onClick={handleResetZoom}
                  title="화면 리셋"
                  className="w-9 h-9 rounded-full bg-ink-950/85 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all pointer-events-auto shadow-md cursor-pointer select-none"
                >
                  🎯
                </button>
              </div>

              {/* [OVERLAY 4] GORGEOUS GLASSMORPHIC MAP LEGEND (BOTTOM LEFT) */}
              <div className="absolute bottom-4 left-4 z-10 pointer-events-none bg-ink-950/85 border border-white/10 p-2.5 rounded-lg text-[8.5px] text-white/55 backdrop-blur-sm flex flex-col gap-1 w-32 shadow-lg">
                <span className="font-bold text-white/30 uppercase tracking-widest text-[7.5px] mb-0.5 font-mono">MAP LEGEND</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7f77dd] shadow-glow-blue/40" style={{ filter: 'drop-shadow(0 0 2px #7f77dd)' }} />
                  <span>한국 거점</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e24b4a] shadow-glow-red/40 animate-pulse" style={{ filter: 'drop-shadow(0 0 2px #e24b4a)' }} />
                  <span>군주 점령 / 위험</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef9f27]" style={{ filter: 'drop-shadow(0 0 2px #ef9f27)' }} />
                  <span>경계 (오염 20-50)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b517d]" style={{ filter: 'drop-shadow(0 0 2px #3b517d)' }} />
                  <span>안전 (대륙별 컬러)</span>
                </div>
              </div>
            </>
          )
        })()}
      </div>

      {/* 인라인 게이트 활성화 HUD (기존 게이트 전선 호환용) */}
      {isGateActive && (
        <div className="panel corner-bracket border-purple-500/40 bg-purple-950/10 p-6 animate-fade-in relative mt-6">
          <div className="br" />
          <div className="absolute top-4 right-4 z-10">
            <span className="rounded-full bg-purple-500/20 border border-purple-400/30 px-3 py-1 text-[10px] font-black text-purple-200 tracking-widest animate-pulse">
              균열 정화 전선 활성화
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Swords className="h-5 w-5 text-purple-400" />
              진입한 구역: {RIFT_NODES.find((rn: any) => rn.id === activeRiftNodeId)?.name ?? livingWorld?.riftNodes[activeRiftNodeId]?.name ?? activeGate.customGateDef?.name ?? '미지의 균열'}
            </h3>
            <p className="text-xs text-white/45 mt-1">
              게이트를 클리어하면 해당 월드맵 노드의 정화도가 올라가고 후속 노드가 해제됩니다.
            </p>
          </div>

          {/* 기존 GatePanel의 전투 모듈을 그대로 인라인 배치하여 자연스럽게 연결 */}
          <div className="border-t border-white/5 pt-4 bg-ink-950/20 rounded-lg p-2 sm:p-4">
            <GatePanel isWorldMapContext={true} />
          </div>
        </div>
      )}

      {/* 국가 정화 현황 상세 모달 (WORLD PURIFICATION DETAILS) */}
      {activeDetailRegion && (() => {
        const region = activeDetailRegion
        const prog = getRegionProgress(region.id, riftNodesState)
        const regionState = livingWorld?.regions[region.id]
        const totalPower = regionState ? getRegionTotalPower(regionState, livingWorld.namedHunters) : 0
        const flag = REGION_FLAGS[region.id] || '🌐'
        const occupiedMonarch = livingWorld?.activeMonarchs?.find(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(region.id))
        const hasLoveCall = Object.values(livingWorld?.riftNodes ?? {}).some((node: any) => node.regionId === region.id && node.loveCall?.active && (riftNodesState[node.id] ?? node.status) === 'active')

        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="panel corner-bracket border-cyan-400/30 bg-ink-950/95 p-6 max-w-md w-full shadow-glow-blue relative animate-scale-in">
              <div className="br" />
              
              {/* 헤더 */}
              <div className="flex items-start justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{flag}</span>
                  <div>
                    <h4 className="text-base font-black text-white flex items-center gap-1.5">
                      {region.name}
                      {region.id === 'kr' && (
                        <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[8px] font-bold text-sky-300 border border-sky-500/30">
                          거점
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">REGION CODE: {region.id.toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDetailRegion(null)}
                  className="rounded p-1 hover:bg-white/5 text-white/45 hover:text-white cursor-pointer transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 본문 정보 */}
              <div className="mt-4 space-y-4">
                
                {/* 점령 및 러브콜 경고 */}
                {occupiedMonarch && (
                  <div className="rounded border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400 font-bold animate-pulse flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>경고: 이 국가는 현재 심연의 군주에 의해 점령되어 잠식 중입니다!</span>
                  </div>
                )}
                {hasLoveCall && !occupiedMonarch && (
                  <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300 font-bold flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>알림: 이 국가의 헌터 협회로부터 지원(러브콜) 요청이 와 있습니다.</span>
                  </div>
                )}

                {/* 정화 진척도 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-white/70">
                    <span>정화 진척도</span>
                    <span className="text-purple-300 font-mono">
                      {prog.cleared}/{prog.total} 구역 완료 ({prog.percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${prog.percent}%` }}
                    />
                  </div>
                </div>

                {/* 핵심 지표 */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="rounded bg-black/45 border border-white/5 p-2">
                    <div className="text-[9px] text-white/40 font-sans uppercase">오염도</div>
                    <div className={`mt-1 font-black ${
                      occupiedMonarch ? 'text-red-400' :
                      regionState && regionState.corruption >= 50 ? 'text-orange-400 animate-pulse' :
                      regionState && regionState.corruption >= 20 ? 'text-yellow-300' :
                      'text-emerald-400'
                    }`}>
                      {regionState ? `${regionState.corruption}%` : '0%'}
                    </div>
                  </div>
                  <div className="rounded bg-black/45 border border-white/5 p-2">
                    <div className="text-[9px] text-white/40 font-sans uppercase">총 전력</div>
                    <div className="mt-1 font-black text-cyan-300">
                      {totalPower > 0 ? `${(totalPower / 1000).toFixed(0)}k` : '계산 중'}
                    </div>
                  </div>
                  <div className="rounded bg-black/45 border border-white/5 p-2">
                    <div className="text-[9px] text-white/40 font-sans uppercase">활성 게이트</div>
                    <div className="mt-1 font-black text-purple-300">
                      {regionState ? regionState.activeGateIds.length : 0}개
                    </div>
                  </div>
                </div>

                {/* 5축 성향 프로파일 */}
                {regionState && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-white/45 tracking-widest uppercase">📊 지역 성향 매개변수 (Profile)</span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-black/35 rounded-lg p-3 border border-white/5 text-[10px] text-white/70">
                      <div className="flex justify-between">
                        <span className="text-white/40">위험 감수성향</span>
                        <span className="font-bold text-red-400">{(regionState.riskAppetite * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">정예형성향</span>
                        <span className="font-bold text-amber-400">{((1 - regionState.populationStyle) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">성장성향</span>
                        <span className="font-bold text-emerald-400">{(regionState.growthBias * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">결속도</span>
                        <span className="font-bold text-blue-400">{(regionState.cohesion * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between col-span-2 border-t border-white/5 pt-1.5 mt-0.5">
                        <span className="text-white/40">부유함</span>
                        <span className="font-bold text-purple-400">{(regionState.wealth * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 소속 네임드 헌터 명단 */}
                {regionState && regionState.namedHunterIds.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-white/45 tracking-widest uppercase">🤝 소속 네임드 헌터 ({regionState.namedHunterIds.length})</span>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {regionState.namedHunterIds.map((hunterId) => {
                        const hunterObj = livingWorld?.namedHunters[hunterId]
                        if (!hunterObj) return null
                        const totalPower = hunterObj.power + (hunterObj.equipmentScore ?? 0)
                        const hasEquip = hunterObj.equipmentItems && hunterObj.equipmentItems.length > 0
                        return (
                          <div key={hunterId} className="flex flex-col gap-1 bg-black/40 border border-white/5 px-2.5 py-2 rounded-md text-[10px]">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white/80">{hunterObj.name}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="rounded bg-purple-500/20 px-1.5 py-0.2 text-[8px] font-black text-purple-300 border border-purple-500/30">
                                  {hunterObj.rank}
                                </span>
                                <span className="text-cyan-300 font-mono font-bold">
                                  ⚔️{totalPower.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {hasEquip && (
                              <div className="flex flex-wrap gap-1 mt-1 border-t border-white/5 pt-1 text-[8px] text-white/55">
                                <span className="text-purple-400/80 font-bold mr-1">🛡️ 장비:</span>
                                {hunterObj.equipmentItems?.map((eq, eqIdx) => {
                                  const rarityColor = 
                                    eq.rarity === 'legendary' ? 'text-amber-400 font-semibold' :
                                    eq.rarity === 'epic' ? 'text-purple-400 font-semibold' :
                                    eq.rarity === 'rare' ? 'text-cyan-400' :
                                    'text-white/60'
                                  return (
                                    <span key={eqIdx} className={`mr-2 ${rarityColor}`}>
                                      [{eq.name}]
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-white/45 italic py-2 text-center border border-dashed border-white/5 rounded">
                    소속 네임드 헌터가 없습니다.
                  </div>
                )}
              </div>

              {/* 하단 닫기 */}
              <div className="mt-6">
                <button
                  onClick={() => setActiveDetailRegion(null)}
                  className="rounded border border-white/10 bg-white/5 hover:bg-white/10 w-full py-2 text-xs font-bold text-white/70 transition-all cursor-pointer text-center"
                >
                  상세 닫기
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 일일 정세 보고서 모달 (전체화면 오버레이) */}
      {/* 통합 정세 보고서 모달 (전체화면 오버레이) */}
      {activeReportTab && livingWorld && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-md flex flex-col p-4 sm:p-6 text-white overflow-hidden font-sans animate-fade-in">
          <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col min-h-0 bg-zinc-900/80 border border-white/10 rounded-xl p-4 sm:p-6 shadow-2xl relative">
            
            {/* Top Close Button */}
            <button 
              onClick={() => setActiveReportTab(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer z-10 text-xs font-mono font-bold"
            >
              ✕ 닫기 (ESC)
            </button>

            {/* Header / Integrated Tab bar */}
            <div className="flex flex-col border-b border-white/10 pb-4 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    {activeReportTab === 'daily' && '📊 일일 정세 보고서'}
                    {activeReportTab === 'country' && '🛡️ 국가별 상세 현황'}
                    {activeReportTab === 'hunter' && '🏆 세계 헌터 랭킹'}
                  </h2>
                  <p className="text-xs text-white/40 mt-1 leading-normal">
                    {activeReportTab === 'daily' && '이전 날짜의 시뮬레이션 지표 스냅샷 및 지역 정화/폭주 데이터를 상세 분석합니다.'}
                    {activeReportTab === 'country' && '선택한 국가의 오염도, 활성 게이트 상태 및 소속 네임드 헌터의 전력을 상세히 진단합니다.'}
                    {activeReportTab === 'hunter' && '전 세계 네임드 헌터들의 실효 전투력 순위와 주요 장비 및 특성 분포를 표시합니다.'}
                  </p>
                </div>
              </div>

              {/* 3대 탭 메뉴 */}
              <div className="flex gap-1 mt-4 bg-black/40 p-1 rounded-lg border border-white/5 self-start">
                <button
                  onClick={() => openReport('daily')}
                  className={`px-4 py-2 rounded-md text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeReportTab === 'daily'
                      ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                      : 'text-white/55 hover:text-white hover:bg-white/5'
                  }`}
                >
                  📊 일일 정세 보고
                </button>
                <button
                  onClick={() => openReport('country', selectedReportRegionId)}
                  className={`px-4 py-2 rounded-md text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeReportTab === 'country'
                      ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                      : 'text-white/55 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🛡️ 국가별 상세
                </button>
                <button
                  onClick={() => openReport('hunter')}
                  className={`px-4 py-2 rounded-md text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeReportTab === 'hunter'
                      ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                      : 'text-white/55 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🏆 세계 헌터 랭킹
                </button>
              </div>
            </div>

            {/* Main Body Scrollable */}
            <div className="flex-1 overflow-y-auto mt-6 pr-1 min-h-0">
              
              {/* [TAB 1] 일일 정세 보고 */}
              {activeReportTab === 'daily' && (
                <div className="space-y-6">
                  {/* Header / Date Navigation */}
                  {(() => {
                    const summaries = livingWorld.dailySummaries ?? []
                    const targetDay = selectedReportDay ?? (summaries.length > 0 ? summaries[summaries.length - 1].day : 0)
                    const currentSummary = summaries.find(s => s.day === targetDay)
                    const prevSummary = summaries.find(s => s.day === targetDay - 1)
                    const minDay = summaries.length > 0 ? summaries[0].day : 0
                    const maxDay = summaries.length > 0 ? summaries[summaries.length - 1].day : 0

                    const handlePrev = () => {
                      if (targetDay > minDay) {
                        setSelectedReportDay(targetDay - 1)
                      }
                    }
                    const handleNext = () => {
                      if (targetDay < maxDay) {
                        setSelectedReportDay(targetDay + 1)
                      }
                    }

                    return (
                      <>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={handlePrev}
                            disabled={targetDay <= minDay}
                            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                          >
                            ◀ 이전 날
                          </button>
                          <span className="font-mono text-xs font-bold px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg">
                            Day {targetDay} / {maxDay}
                          </span>
                          <button
                            onClick={handleNext}
                            disabled={targetDay >= maxDay}
                            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                          >
                            다음 날 ▶
                          </button>
                        </div>

                        {currentSummary ? (
                          <>
                            {/* 1. 핵심 지표 카드 grid */}
                            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                              {/* 지표 1: 전역 오염도 */}
                              {(() => {
                                const val = currentSummary.worldCorruption
                                const prevVal = prevSummary?.worldCorruption ?? 0
                                const diff = val - prevVal
                                const isIncreased = diff > 0
                                const isDecreased = diff < 0
                                return (
                                  <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[100px]">
                                    <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">전역 오염도</span>
                                    <div className="text-2xl font-black text-red-400 mt-1">{val}%</div>
                                    <div className="mt-2 flex items-center justify-between text-[10px]">
                                      <span className="text-white/40">어제 대비</span>
                                      {diff === 0 ? (
                                        <span className="text-white/30 font-bold">-</span>
                                      ) : isIncreased ? (
                                        <span className="text-red-400 font-extrabold flex items-center gap-0.5">▲ +{diff}%</span>
                                      ) : (
                                        <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">▼ {Math.abs(diff)}%</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* 지표 2: 당일 게이트 정화 수 */}
                              {(() => {
                                const val = currentSummary.gatesClearedToday
                                const prevVal = prevSummary?.gatesClearedToday ?? 0
                                const diff = val - prevVal
                                return (
                                  <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[100px]">
                                    <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">당일 게이트 정화</span>
                                    <div className="text-2xl font-black text-emerald-400 mt-1">{val}개</div>
                                    <div className="mt-2 flex items-center justify-between text-[10px]">
                                      <span className="text-white/40">어제 대비</span>
                                      {diff === 0 ? (
                                        <span className="text-white/30 font-bold">-</span>
                                      ) : diff > 0 ? (
                                        <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">▲ +{diff}</span>
                                      ) : (
                                        <span className="text-red-400 font-extrabold flex items-center gap-0.5">▼ {Math.abs(diff)}</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* 지표 3: 당일 게이트 폭주 수 */}
                              {(() => {
                                const val = currentSummary.gatesRampagedToday
                                const prevVal = prevSummary?.gatesRampagedToday ?? 0
                                const diff = val - prevVal
                                return (
                                  <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[100px]">
                                    <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">당일 게이트 폭주</span>
                                    <div className="text-2xl font-black text-red-500 mt-1">{val}개</div>
                                    <div className="mt-2 flex items-center justify-between text-[10px]">
                                      <span className="text-white/40">어제 대비</span>
                                      {diff === 0 ? (
                                        <span className="text-white/30 font-bold">-</span>
                                      ) : diff > 0 ? (
                                        <span className="text-red-500 font-extrabold flex items-center gap-0.5 animate-pulse">▲ +{diff}</span>
                                      ) : (
                                        <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">▼ {Math.abs(diff)}</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* 지표 4: 활성 군주 수 */}
                              {(() => {
                                const val = currentSummary.monarchCount
                                const prevVal = prevSummary?.monarchCount ?? 0
                                const diff = val - prevVal
                                return (
                                  <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[100px]">
                                    <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">활성 군주 세력</span>
                                    <div className="text-2xl font-black text-purple-400 mt-1">{val}명</div>
                                    <div className="mt-2 flex items-center justify-between text-[10px]">
                                      <span className="text-white/40">어제 대비</span>
                                      {diff === 0 ? (
                                        <span className="text-white/30 font-bold">-</span>
                                      ) : diff > 0 ? (
                                        <span className="text-purple-400 font-extrabold flex items-center gap-0.5">▲ +{diff}</span>
                                      ) : (
                                        <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">▼ {Math.abs(diff)}</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>

                            {/* 2. 상세 정보 영역 */}
                            <div className="flex flex-col lg:flex-row gap-6">
                              
                              {/* 주요 사건 로그 (좌) */}
                              <div className="flex-1 bg-black/20 border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col min-h-[300px]">
                                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2 border-b border-white/10 pb-3 mb-4 uppercase">
                                  📢 Day {targetDay} 주요 정세 사건
                                </h3>
                                
                                {(() => {
                                  const dayLogs = livingWorld.eventLogs.filter(log => log.startsWith(`[Day ${targetDay}]`))
                                  
                                  if (dayLogs.length === 0) {
                                    return (
                                      <div className="text-zinc-500 italic py-16 text-center text-xs flex-1 flex items-center justify-center">
                                        📡 이 날짜에는 특별한 전술 사건이나 이상 징후가 보고되지 않았습니다.
                                      </div>
                                    )
                                  }

                                  return (
                                    <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-1 flex-1 scrollbar-thin">
                                      {dayLogs.map((log, idx) => {
                                        const style = classifyEventLog(log)
                                        const cleanText = log.replace(/^\[Day \d+\]\s*/, '')
                                        return (
                                          <div key={idx} className="flex items-start gap-2.5 text-xs border-b border-white/5 pb-2.5 leading-normal transition-all hover:bg-white/5 p-1.5 rounded">
                                            <span className={`chip shrink-0 scale-90 mt-0.5 ${style.badgeClass}`} style={{ fontSize: '7.5px', padding: '0.1rem 0.35rem' }}>
                                              {style.badge}
                                            </span>
                                            <span className={`flex-1 font-mono text-[10.5px] tracking-wide leading-relaxed ${style.textClass}`}>
                                              {cleanText}
                                            </span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )
                                })()}
                              </div>

                              {/* 국가 전선 현황 (우) */}
                              <div className="w-full lg:w-[45%] bg-black/20 border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col min-h-[300px]">
                                <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2 border-b border-white/10 pb-3 mb-4 uppercase">
                                  🛡️ 국가별 전선 오염도 현황
                                </h3>

                                {(() => {
                                  const regionInfos = Object.values(livingWorld.regions).map(r => ({
                                    region: r,
                                    power: getRegionTotalPower(r, livingWorld.namedHunters),
                                    name: RIFT_REGIONS.find(reg => reg.id === r.regionId)?.name ?? r.regionId.toUpperCase()
                                  })).sort((a, b) => {
                                    if (a.region.corruption !== b.region.corruption) {
                                      return a.region.corruption - b.region.corruption
                                    }
                                    return b.power - a.power
                                  })

                                  const strongestFrontierId = regionInfos[0]?.region.regionId

                                  return (
                                    <div className="space-y-3.5 overflow-y-auto max-h-[400px] pr-1 flex-1 scrollbar-thin">
                                      {regionInfos.map(({ region, power, name }) => {
                                        const isStrongest = region.regionId === strongestFrontierId
                                        return (
                                          <div 
                                            key={region.regionId} 
                                            onClick={() => openReport('country', region.regionId)}
                                            className="flex flex-col gap-1.5 p-2 rounded border border-white/5 bg-zinc-950/20 hover:bg-zinc-950/40 cursor-pointer transition-all"
                                          >
                                            <div className="flex items-center justify-between text-xs font-semibold">
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-white/80">{name}</span>
                                                <span className="text-[9px] text-white/35">⚔️{power.toLocaleString()}</span>
                                                {isStrongest && (
                                                  <span className="rounded bg-emerald-500/20 border border-emerald-500/40 text-[8px] font-black text-emerald-400 px-1 py-0.2 select-none tracking-widest scale-90 uppercase animate-pulse">
                                                    ★ 최강
                                                  </span>
                                                )}
                                              </div>
                                              <span className={`font-mono font-bold ${
                                                region.corruption >= 70 ? 'text-red-400' :
                                                region.corruption >= 30 ? 'text-orange-400' :
                                                'text-emerald-400'
                                              }`}>
                                                오염도 {region.corruption}%
                                              </span>
                                            </div>

                                            {/* 게이지 바 */}
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                              <div 
                                                className={`h-full transition-all duration-300 bg-gradient-to-r ${
                                                  region.corruption >= 70 ? 'from-orange-500 to-red-500' :
                                                  region.corruption >= 30 ? 'from-yellow-400 to-orange-500' :
                                                  'from-cyan-400 to-emerald-400'
                                                }`}
                                                style={{ width: `${region.corruption}%` }}
                                              />
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )
                                })()}
                              </div>

                            </div>
                          </>
                        ) : (
                          <div className="text-zinc-500 italic py-24 text-center text-sm flex-1 flex flex-col items-center justify-center gap-3">
                            <span>📊 분석된 요약 데이터가 아직 기록되지 않았습니다.</span>
                            <span className="text-xs text-white/30 leading-normal">
                              첫 일일 퀘스트를 완료하거나 하루를 시뮬레이션(1틱 진행)하면 그날의 요약 스냅샷이 생성됩니다.
                            </span>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}

              {/* [TAB 2] 국가별 상세 현황 */}
              {activeReportTab === 'country' && (
                <div className="space-y-6">
                  {(() => {
                    const regionState = livingWorld.regions[selectedReportRegionId]
                    if (!regionState) {
                      return <div className="text-center py-20 text-zinc-500">지정된 국가의 상태 데이터를 찾을 수 없습니다.</div>
                    }
                    const regionMeta = RIFT_REGIONS.find(r => r.id === selectedReportRegionId)
                    const flag = REGION_FLAGS[selectedReportRegionId] || '🌐'
                    const regionName = regionMeta?.name ?? selectedReportRegionId.toUpperCase()
                    const totalPower = getRegionTotalPower(regionState, livingWorld.namedHunters)
                    const activeGatesCount = regionState.activeGateIds.length

                    const regionHunters = regionState.namedHunterIds
                      .map(id => livingWorld.namedHunters[id])
                      .filter(Boolean)
                    const aliveHuntersCount = regionHunters.filter(h => h.status !== 'dead').length

                    const regionGates = regionState.activeGateIds
                      .map(id => livingWorld.riftNodes[id])
                      .filter(Boolean)

                    const occupiedMonarch = livingWorld.activeMonarchs?.find(m => m.status === 'rampaging' && m.occupiedRegionIds.includes(selectedReportRegionId))

                    return (
                      <div className="flex flex-col gap-6">
                        {/* 1. 상단 요약 배너 */}
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                          <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[90px]">
                            <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">국가 정보</span>
                            <div className="text-xl font-black text-white flex items-center gap-1.5 mt-1 truncate">
                              <span>{flag}</span>
                              <span className="truncate">{regionName}</span>
                            </div>
                            <span className="text-[9px] text-white/30 font-mono mt-1">CODE: {selectedReportRegionId.toUpperCase()}</span>
                          </div>

                          <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[90px]">
                            <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">지역 오염도</span>
                            <div className={`text-2xl font-black mt-1 ${
                              regionState.corruption >= 70 ? 'text-red-500 animate-pulse' :
                              regionState.corruption >= 30 ? 'text-orange-400' :
                              'text-emerald-400'
                            }`}>
                              {regionState.corruption}%
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1">
                              <div 
                                className={`h-full bg-gradient-to-r ${
                                  regionState.corruption >= 70 ? 'from-orange-500 to-red-500' :
                                  regionState.corruption >= 30 ? 'from-yellow-400 to-orange-500' :
                                  'from-cyan-400 to-emerald-400'
                                }`}
                                style={{ width: `${regionState.corruption}%` }}
                              />
                            </div>
                          </div>

                          <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[90px]">
                            <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">국가 총전력</span>
                            <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">
                              {totalPower.toLocaleString()}
                            </div>
                            <span className="text-[9px] text-white/40 mt-1 leading-none font-mono">네임드 + 보정 익명풀</span>
                          </div>

                          <div className="bg-black/30 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[90px]">
                            <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">네임드 헌터</span>
                            <div className="text-2xl font-black text-white mt-1 font-mono">
                              {aliveHuntersCount} / {regionHunters.length}
                            </div>
                            <span className="text-[9px] text-white/40 mt-1 leading-none">생존 헌터 수</span>
                          </div>
                        </div>

                        {/* 점령 위기 상태 경보 */}
                        {occupiedMonarch && (
                          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-bold animate-pulse flex items-center gap-2">
                            <span className="text-base">⚠️</span>
                            <span>침공 비상사태: 현재 심연의 군주 [{MONARCHS.find(m => m.id === occupiedMonarch.monarchId)?.name ?? occupiedMonarch.monarchId}]에 의해 국가 영토가 완전히 잠식되었습니다!</span>
                          </div>
                        )}

                        {/* 2. 메인 양방향 레이아웃 (좌: 헌터 리스트, 우: 성향 프로필 & 활성 게이트) */}
                        <div className="flex flex-col lg:flex-row gap-6">
                          
                          {/* 소속 네임드 헌터 (좌) */}
                          <div className="flex-1 bg-black/20 border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col min-h-[300px]">
                            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2 border-b border-white/10 pb-3 mb-4 uppercase">
                              👥 소속 네임드 헌터 현황 ({aliveHuntersCount}명 생존 / {regionHunters.length}명)
                            </h3>
                            
                            <div className="space-y-2.5 overflow-y-auto max-h-[450px] pr-1 flex-1 scrollbar-thin">
                              {regionHunters.map(hunter => {
                                const trait = getHunterTrait(hunter.traitId)
                                const effectivePower = hunter.power + (hunter.equipmentScore ?? 0)
                                const topEquips = (hunter.equipmentItems ?? []).slice(0, 2)
                                
                                const statusBadge = 
                                  hunter.status === 'dead' ? (
                                    <span className="rounded bg-red-500/25 border border-red-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-red-200 shrink-0">전사</span>
                                  ) : hunter.status === 'injured' ? (
                                    <span className="rounded bg-orange-500/25 border border-orange-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-orange-200 shrink-0">부상 ({hunter.injuredTurns}일)</span>
                                  ) : (
                                    <span className="rounded bg-emerald-500/25 border border-emerald-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-emerald-200 shrink-0">정상</span>
                                  )

                                return (
                                  <div 
                                    key={hunter.id} 
                                    className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                      hunter.status === 'dead' 
                                        ? 'border-red-950 bg-red-950/5 opacity-40 text-white/40' 
                                        : 'border-white/5 bg-black/20 hover:bg-white/5 text-white/80'
                                    }`}
                                  >
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`chip shrink-0 text-[8.5px] font-extrabold ${
                                          hunter.rank === 'National' 
                                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 font-black' 
                                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30 font-bold'
                                        }`}>
                                          {hunter.rank}
                                        </span>
                                        <span className={`text-xs font-black ${hunter.status === 'dead' ? 'line-through text-white/30' : 'text-white'}`}>
                                          {hunter.name}
                                        </span>
                                        {statusBadge}
                                        
                                        {trait && (
                                          <div className="relative group shrink-0 select-none">
                                            <span className="rounded bg-cyan-500/10 border border-cyan-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-cyan-300 cursor-help">
                                              🏷️ {trait.name}
                                            </span>
                                            {/* 툴팁 */}
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 bg-zinc-950 border border-cyan-500/40 text-[9.5px] text-cyan-200 p-2 rounded shadow-2xl z-50 text-center leading-normal">
                                              <p className="font-extrabold mb-0.5">특성: {trait.name}</p>
                                              <p className="opacity-85 font-mono text-[8.5px]">{trait.description}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* 보유 장비 */}
                                      {topEquips.length > 0 && (
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <span className="text-[8.5px] text-white/30 font-bold">장비:</span>
                                          {topEquips.map((eq, eIdx) => {
                                            let rarityClass = 'text-zinc-400 bg-zinc-400/5 border-zinc-400/20'
                                            if (eq.rarity === 'legendary') rarityClass = 'text-amber-400 bg-amber-400/10 border-amber-400/30 font-extrabold'
                                            else if (eq.rarity === 'epic') rarityClass = 'text-purple-400 bg-purple-400/10 border-purple-400/30 font-bold'
                                            else if (eq.rarity === 'rare') rarityClass = 'text-blue-400 bg-blue-400/10 border-blue-400/30'
                                            return (
                                              <span key={eIdx} className={`rounded px-1.5 py-0.2 text-[8px] border ${rarityClass}`}>
                                                {eq.name}
                                              </span>
                                            )
                                          })}
                                          {(hunter.equipmentItems?.length ?? 0) > 2 && (
                                            <span className="text-[8px] text-white/30 font-mono">
                                              외 {(hunter.equipmentItems?.length ?? 0) - 2}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="text-left sm:text-right shrink-0 flex flex-col justify-center">
                                      <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider leading-none">실효 전투력</span>
                                      <span className="text-sm font-black text-cyan-300 font-mono mt-1">
                                        {effectivePower.toLocaleString()}
                                      </span>
                                      <span className="text-[8px] text-white/45 font-mono mt-0.5 leading-none">
                                        {hunter.power.toLocaleString()} + ⚙️{hunter.equipmentScore.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* 성향 및 게이트 목록 (우) */}
                          <div className="w-full lg:w-[45%] flex flex-col gap-6">
                            
                            {/* 국가 성향 프로필 */}
                            <div className="bg-black/20 border border-white/5 rounded-xl p-4 sm:p-5">
                              <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2 border-b border-white/10 pb-3 mb-4 uppercase">
                                📊 국가 정책 및 성향 프로필
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-[9px] font-bold text-white/55 mb-1">
                                    <span>🛡️ 신중 전략</span>
                                    <span className="text-amber-400 font-mono">위험 감수 성향 ({(regionState.riskAppetite * 100).toFixed(0)}%)</span>
                                    <span>⚔️ 무모 돌격</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" style={{ width: `${regionState.riskAppetite * 100}%` }} />
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-white border border-black shadow" style={{ left: `${regionState.riskAppetite * 100}%` }} />
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between text-[9px] font-bold text-white/55 mb-1">
                                    <span>👑 소수 정예 (S급 중심)</span>
                                    <span className="text-cyan-400 font-mono">인력 편성 전략 ({(regionState.populationStyle * 100).toFixed(0)}%)</span>
                                    <span>👥 물량 대중 (A~C급 풀)</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                    <div className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500" style={{ width: `${regionState.populationStyle * 100}%` }} />
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-white border border-black shadow" style={{ left: `${regionState.populationStyle * 100}%` }} />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between text-[9px] font-bold text-white/55 mb-1">
                                    <span>📈 안정 지향</span>
                                    <span className="text-pink-400 font-mono">훈련 방식 지향 ({(regionState.growthBias * 100).toFixed(0)}%)</span>
                                    <span>🔥 성장 급진</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ width: `${regionState.growthBias * 100}%` }} />
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-white border border-black shadow" style={{ left: `${regionState.growthBias * 100}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 활성 게이트 목록 */}
                            <div className="bg-black/20 border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col flex-1 min-h-[220px]">
                              <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2 border-b border-white/10 pb-3 mb-4 uppercase">
                                🌀 활성 차원 균열 게이트 ({activeGatesCount}개)
                              </h3>
                              
                              <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1 flex-1 scrollbar-thin">
                                {regionGates.length === 0 ? (
                                  <div className="text-zinc-500 italic py-10 text-center text-xs flex items-center justify-center flex-1">
                                    🛡️ 이 지역에는 활성화된 차원 균열 게이트가 존재하지 않습니다.
                                  </div>
                                ) : (
                                  regionGates.map(gate => {
                                    const isS = gate.isSGrade || gate.difficultyRank === 'S' || gate.difficultyRank === 'National'
                                    return (
                                      <div key={gate.id} className="p-3 bg-zinc-950/40 border border-white/5 rounded-lg flex items-center justify-between text-xs transition-all hover:bg-white/5">
                                        <div className="flex items-center gap-2">
                                          <span className={`chip shrink-0 font-extrabold text-[8.5px] scale-90 ${
                                            isS ? 'bg-red-500/25 text-red-400 border-red-500/30' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20'
                                          }`}>
                                            {gate.difficultyRank || 'C'}급
                                          </span>
                                          <div>
                                            <span className="font-bold text-white/80 block">{gate.name}</span>
                                            <span className="text-[9px] text-white/40 block mt-0.5">권장 CP: {gate.difficulty.toLocaleString()}</span>
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className={`font-mono font-black block ${
                                            gate.daysRemaining <= 3 ? 'text-red-400 animate-pulse' : 'text-zinc-400'
                                          }`}>
                                            폭주 {gate.daysRemaining}일 전
                                          </span>
                                          {gate.loveCall?.active && (
                                            <span className="block text-[8px] text-amber-300 font-extrabold mt-0.5 animate-bounce">
                                              📞 지원 요청
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })
                                )}
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* 하단 15개국 국가 빠른 전환 네비게이션 */}
                        <div className="border-t border-white/5 pt-4">
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-2">국가 빠른 전환</span>
                          <div className="flex flex-wrap gap-1.5">
                            {RIFT_REGIONS.map(reg => {
                              const isSelected = reg.id === selectedReportRegionId
                              const regFlag = REGION_FLAGS[reg.id] || '🌐'
                              return (
                                <button
                                  key={reg.id}
                                  onClick={() => setSelectedReportRegionId(reg.id)}
                                  className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                                    isSelected
                                      ? 'bg-zinc-800 text-white border-white/20 font-black shadow-md'
                                      : 'bg-zinc-950/40 text-white/55 border-white/5 hover:bg-white/5 hover:text-white'
                                  }`}
                                >
                                  <span>{regFlag}</span>
                                  <span>{reg.name}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* [TAB 3] 세계 헌터 랭킹 */}
              {activeReportTab === 'hunter' && (
                <div className="space-y-6">
                  {/* 랭킹 서브 탭 바 */}
                  <div className="flex gap-1 bg-black/30 p-0.5 rounded border border-white/5 self-start w-fit">
                    <button
                      onClick={() => setHunterRankingSubTab('individual')}
                      className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        hunterRankingSubTab === 'individual'
                          ? 'bg-zinc-800 text-white border border-white/10'
                          : 'text-white/45 hover:text-white'
                      }`}
                    >
                      👤 개별 헌터 순위
                    </button>
                    <button
                      onClick={() => setHunterRankingSubTab('region')}
                      className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        hunterRankingSubTab === 'region'
                          ? 'bg-zinc-800 text-white border border-white/10'
                          : 'text-white/45 hover:text-white'
                      }`}
                    >
                      🛡️ 국가별 종합 전력
                    </button>
                  </div>

                  {/* 랭킹 내용물 */}
                  {hunterRankingSubTab === 'individual' ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto rounded-lg border border-white/5 bg-black/20 scrollbar-thin">
                        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                          <thead>
                            <tr className="border-b border-white/10 bg-zinc-950/60 text-white/55 font-bold uppercase tracking-wider text-[9px]">
                              <th className="p-3 w-14 text-center">순위</th>
                              <th className="p-3 w-28">국가</th>
                              <th className="p-3 w-36">헌터명</th>
                              <th className="p-3 w-28 text-center">특성</th>
                              <th className="p-3 w-44">대표 보유 장비</th>
                              <th className="p-3 text-right">실효 전투력 (CP)</th>
                              <th className="p-3 w-20 text-center">상태</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const allHunters = Object.values(livingWorld.namedHunters).map(h => {
                                const effectivePower = h.power + (h.equipmentScore ?? 0)
                                return {
                                  ...h,
                                  effectivePower
                                }
                              }).sort((a, b) => b.effectivePower - a.effectivePower)

                              return allHunters.map((hunter, index) => {
                                const rankNum = index + 1
                                const trait = getHunterTrait(hunter.traitId)
                                const regionMeta = RIFT_REGIONS.find(r => r.id === hunter.regionId)
                                const flag = REGION_FLAGS[hunter.regionId] || '🌐'
                                
                                let rankBadge = <span className="font-mono text-zinc-400 font-bold">{rankNum}</span>
                                if (rankNum === 1) rankBadge = <span className="text-base select-none">🥇</span>
                                else if (rankNum === 2) rankBadge = <span className="text-base select-none">🥈</span>
                                else if (rankNum === 3) rankBadge = <span className="text-base select-none">🥉</span>

                                let rowBgClass = hunter.status === 'dead' 
                                  ? 'opacity-40 bg-red-950/5 text-white/35 line-through decoration-red-900/50' 
                                  : rankNum <= 3
                                    ? 'bg-amber-500/5 hover:bg-amber-500/10'
                                    : 'hover:bg-white/5'

                                const topEquips = (hunter.equipmentItems ?? []).slice(0, 2)

                                const statusBadge = 
                                  hunter.status === 'dead' ? (
                                    <span className="rounded bg-red-500/20 border border-red-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-red-300">전사</span>
                                  ) : hunter.status === 'injured' ? (
                                    <span className="rounded bg-orange-500/20 border border-orange-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-orange-300">부상 ({hunter.injuredTurns}일)</span>
                                  ) : (
                                    <span className="rounded bg-emerald-500/20 border border-emerald-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-emerald-300">정상</span>
                                  )

                                return (
                                  <tr key={hunter.id} className={`border-b border-white/5 transition-all text-white/80 ${rowBgClass}`}>
                                    <td className="p-3 text-center font-bold">{rankBadge}</td>
                                    <td className="p-3 font-semibold">
                                      <span className="flex items-center gap-1.5 truncate cursor-pointer hover:text-white" onClick={() => openReport('country', hunter.regionId)}>
                                        <span>{flag}</span>
                                        <span className="truncate">{regionMeta?.name ?? hunter.regionId.toUpperCase()}</span>
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className={`chip shrink-0 text-[8.5px] scale-90 ${
                                          hunter.rank === 'National' 
                                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 font-black' 
                                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30 font-bold'
                                        }`}>
                                          {hunter.rank}
                                        </span>
                                        <span className="font-extrabold truncate">{hunter.name}</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-center">
                                      {trait ? (
                                        <div className="relative group inline-block select-none">
                                          <span className="rounded bg-cyan-500/10 border border-cyan-500/30 text-[8.5px] px-1.5 py-0.2 font-bold text-cyan-300 cursor-help">
                                            🏷️ {trait.name}
                                          </span>
                                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 bg-zinc-950 border border-cyan-500/40 text-[9.5px] text-cyan-200 p-2 rounded shadow-2xl z-50 text-center leading-normal">
                                            <p className="font-extrabold mb-0.5">특성: {trait.name}</p>
                                            <p className="opacity-85 font-mono text-[8.5px]">{trait.description}</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-white/20">-</span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {topEquips.length > 0 ? (
                                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                                          {topEquips.map((eq, eIdx) => {
                                            let rarityClass = 'text-zinc-400 bg-zinc-400/5 border-zinc-400/20'
                                            if (eq.rarity === 'legendary') rarityClass = 'text-amber-400 bg-amber-400/10 border-amber-400/30 font-extrabold'
                                            else if (eq.rarity === 'epic') rarityClass = 'text-purple-400 bg-purple-400/10 border-purple-400/30 font-bold'
                                            else if (eq.rarity === 'rare') rarityClass = 'text-blue-400 bg-blue-400/10 border-blue-400/30'
                                            return (
                                              <span key={eIdx} className={`rounded px-1.5 py-0.2 text-[8px] border ${rarityClass} truncate max-w-[100px]`}>
                                                {eq.name}
                                              </span>
                                            )
                                          })}
                                          {(hunter.equipmentItems?.length ?? 0) > 2 && (
                                            <span className="text-[8px] text-white/30 font-mono">+{hunter.equipmentItems!.length - 2}</span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-white/20 font-mono text-[9px]">-</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <span className="font-mono text-cyan-300 font-extrabold text-[11px] block">
                                        {hunter.effectivePower.toLocaleString()}
                                      </span>
                                      <span className="font-mono text-white/40 text-[8.5px] block leading-none mt-0.5">
                                        {hunter.power.toLocaleString()} + ⚙️{hunter.equipmentScore.toLocaleString()}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">{statusBadge}</td>
                                  </tr>
                                )
                              })
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto rounded-lg border border-white/5 bg-black/20 scrollbar-thin">
                        <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                          <thead>
                            <tr className="border-b border-white/10 bg-zinc-950/60 text-white/55 font-bold uppercase tracking-wider text-[9px]">
                              <th className="p-3 w-14 text-center">순위</th>
                              <th className="p-3">국가명</th>
                              <th className="p-3 text-center">활성 게이트</th>
                              <th className="p-3 text-center">생존 네임드</th>
                              <th className="p-3 text-right">지역 총전력 (CP)</th>
                              <th className="p-3 text-center">지역 오염도</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const regionPowerRanking = Object.values(livingWorld.regions).map(r => {
                                const power = getRegionTotalPower(r, livingWorld.namedHunters)
                                const meta = RIFT_REGIONS.find(reg => reg.id === r.regionId)
                                const aliveHuntersCount = r.namedHunterIds
                                  .map(id => livingWorld.namedHunters[id])
                                  .filter(Boolean)
                                  .filter(h => h.status !== 'dead').length
                                return {
                                  ...r,
                                  name: meta?.name ?? r.regionId.toUpperCase(),
                                  power,
                                  aliveHuntersCount
                                }
                              }).sort((a, b) => b.power - a.power)

                              return regionPowerRanking.map((region, index) => {
                                const rankNum = index + 1
                                const flag = REGION_FLAGS[region.regionId] || '🌐'
                                
                                let rankBadge = <span className="font-mono text-zinc-400 font-bold">{rankNum}</span>
                                if (rankNum === 1) rankBadge = <span className="text-base select-none">🥇</span>
                                else if (rankNum === 2) rankBadge = <span className="text-base select-none">🥈</span>
                                else if (rankNum === 3) rankBadge = <span className="text-base select-none">🥉</span>

                                return (
                                  <tr key={region.regionId} className="border-b border-white/5 hover:bg-white/5 transition-all text-white/80">
                                    <td className="p-3 text-center font-bold">{rankBadge}</td>
                                    <td className="p-3 font-extrabold flex items-center gap-2">
                                      <span className="text-sm">{flag}</span>
                                      <span className="cursor-pointer hover:text-white" onClick={() => openReport('country', region.regionId)}>{region.name}</span>
                                      {region.regionId === 'kr' && (
                                        <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[7px] font-bold text-sky-300 border border-sky-500/30 uppercase scale-90">거점</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center font-mono font-bold text-amber-300">
                                      {region.activeGateIds.length}개
                                    </td>
                                    <td className="p-3 text-center font-mono font-bold">
                                      {region.aliveHuntersCount} / {region.namedHunterIds.length}
                                    </td>
                                    <td className="p-3 text-right font-mono text-cyan-300 font-extrabold text-[11px]">
                                      {region.power.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`font-mono font-bold ${
                                        region.corruption >= 70 ? 'text-red-400 animate-pulse font-black' :
                                        region.corruption >= 30 ? 'text-orange-400' :
                                        'text-emerald-400'
                                      }`}>
                                        {region.corruption}%
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* 통합 푸터 액션 바 */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-3 items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openReport('daily')}
                  className={`rounded border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeReportTab === 'daily'
                      ? 'bg-white/10 border-white/20 text-white cursor-default pointer-events-none'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  📊 일일 정세 보고
                </button>
                <button
                  onClick={() => openReport('country', selectedReportRegionId)}
                  className={`rounded border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeReportTab === 'country'
                      ? 'bg-white/10 border-white/20 text-white cursor-default pointer-events-none'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  🛡️ 국가별 상세 현황
                </button>
                <button
                  onClick={() => openReport('hunter')}
                  className={`rounded border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeReportTab === 'hunter'
                      ? 'bg-white/10 border-white/20 text-white cursor-default pointer-events-none'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  🏆 세계 헌터 랭킹
                </button>
              </div>

              {activeReportTab === 'daily' && (
                <button
                  onClick={() => {
                    setActiveReportTab(null)
                    setIsAllLogsExpanded(true)
                    setTimeout(() => {
                      const logTerminal = document.querySelector('.panel.border-white\\/10')
                      logTerminal?.scrollIntoView({ behavior: 'smooth' })
                    }, 150)
                  }}
                  className="rounded border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/25 px-4 py-1.5 text-xs font-black text-cyan-200 cursor-pointer transition-all"
                >
                  전체 사건 로그 모아보기
                </button>
              )}
            </div>

          </div>
        </div>
      )}
      
      {/* Reusable cinematic overlay/banner queue engine manager */}
      <WorldCinematicEngine 
        events={livingWorld?.recentEvents ?? []} 
        currentDay={livingWorld?.day ?? 0} 
        animationMode={animationMode}
        playbackSpeed={animationSpeed}
      />
    </div>
  )
}
