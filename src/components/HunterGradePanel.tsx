import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Lock, Sparkles, Shield, ChevronRight, Zap, Target, Flame, Users, BookOpen, Clock } from 'lucide-react'
import { useGame } from '../lib/store'
import { canUseMajorAction } from '../lib/gateEchoes'
import { HUNTER_TITLE_DEFINITIONS, GRADE_CUTS, GRADE_LABELS } from '../lib/hunterGrade'
import { PROMOTION_EXAM_DEFINITIONS } from '../lib/promotionExams'
import type { HunterGradeTier, AssociationRatingBreakdown } from '../lib/types'

const GRADE_THEME: Record<HunterGradeTier, { bg: string; border: string; text: string; glow: string; label: string; aura: string }> = {
  E: {
    bg: 'bg-zinc-950/80',
    border: 'border-zinc-500/30',
    text: 'text-zinc-400',
    glow: 'shadow-zinc-500/10',
    label: 'E급 헌터',
    aura: 'from-zinc-500/0 via-zinc-500/10 to-zinc-500/0'
  },
  D: {
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    label: 'D급 헌터',
    aura: 'from-emerald-500/0 via-emerald-500/10 to-emerald-500/0'
  },
  C: {
    bg: 'bg-cyan-950/80',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/25',
    label: 'C급 헌터',
    aura: 'from-cyan-500/0 via-cyan-500/15 to-cyan-500/0'
  },
  B: {
    bg: 'bg-purple-950/80',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/30',
    label: 'B급 헌터',
    aura: 'from-purple-500/0 via-purple-500/20 to-purple-500/0'
  },
  A: {
    bg: 'bg-pink-950/80',
    border: 'border-pink-500/40',
    text: 'text-pink-400',
    glow: 'shadow-pink-500/40',
    label: 'A급 헌터',
    aura: 'from-pink-500/0 via-pink-500/25 to-pink-500/0'
  },
  S: {
    bg: 'bg-amber-950/85',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/50',
    label: 'S급 헌터',
    aura: 'from-amber-500/5 via-amber-500/30 to-amber-500/5'
  },
  NATIONAL: {
    bg: 'bg-red-950/90',
    border: 'border-red-500/60',
    text: 'text-red-400',
    glow: 'shadow-red-600/70',
    label: '국가권력급 헌터',
    aura: 'from-red-500/10 via-red-500/40 to-red-500/10'
  }
}

export function HunterGradePanel() {
  const s = useGame()
  const hunterGrade = s.hunterGrade
  const hunter = s.hunter
  const startPromotionExam = s.startPromotionExam
  const equipHunterTitle = s.equipHunterTitle
  const hardcoreState = s.hardcoreState
  const examLock = canUseMajorAction(hardcoreState, 'promotion_exam')

  const [activeTab, setActiveTab] = useState<'status' | 'titles' | 'history'>('status')

  if (!hunterGrade) {
    return (
      <div className="panel p-8 text-center text-cyan-300/50 system-text">
        헌터 등급 상태를 수화 중입니다...
      </div>
    )
  }

  const { currentGrade, ratingScore, ratingBreakdown, unlockedTitles, equippedTitleId, pendingExam, history } = hunterGrade
  const theme = GRADE_THEME[currentGrade]

  // 다음 등급 정보 계산
  const tiers: HunterGradeTier[] = ['E', 'D', 'C', 'B', 'A', 'S', 'NATIONAL']
  const currentIdx = tiers.indexOf(currentGrade)
  const nextGrade = currentIdx < tiers.length - 1 ? tiers[currentIdx + 1] : null
  const nextCut = nextGrade ? GRADE_CUTS[nextGrade] : 0
  const progressPercent = nextGrade ? Math.min(100, (ratingScore / nextCut) * 100) : 100

  // 6대 축 메타데이터 정의
  const axisMeta: Record<keyof AssociationRatingBreakdown, { label: string; icon: any; color: string; desc: string; detail: string }> = {
    realLife: {
      label: '현실 몰입 성과',
      icon: Clock,
      color: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20',
      desc: '집중 잠입 누적 시간 및 완수 횟수',
      detail: `${Math.floor((s.focusSession?.totalFocusedMs ?? 0) / (60 * 60 * 1000))}시간 / ${(s.focusSession?.history ?? []).filter((r: any) => r.completed).length}회 성공`
    },
    gateClears: {
      label: '게이트 토벌',
      icon: Shield,
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20',
      desc: '던전 게이트 성공 정복 실적',
      detail: `${s.achievementStats.gateClearedCount ?? 0}회 정복 완료`
    },
    redGate: {
      label: '차원 붕괴 대응',
      icon: Flame,
      color: 'text-red-400 border-red-500/20 bg-red-950/20',
      desc: '인큐베이팅 완료된 Red Gate 생존',
      detail: `${s.achievementStats.redGateClearedCount ?? 0}회 돌파`
    },
    bossKills: {
      label: '보스 처형 실적',
      icon: Target,
      color: 'text-amber-400 border-amber-500/20 bg-amber-950/20',
      desc: '게이트 지배자 베기 및 Tower 공략',
      detail: `${s.achievementStats.bossKillsCount ?? 0}마리 처단 (Tower ${s.infiniteTower?.highestClearedFloor ?? 0}F)`
    },
    legion: {
      label: '그림자 군단 위엄',
      icon: Users,
      color: 'text-purple-400 border-purple-500/20 bg-purple-950/20',
      desc: '군사 규모 및 최상위 등급 위상',
      detail: `${s.ownedShadows?.length ?? 0}마리 충성 맹세`
    },
    mastery: {
      label: '각성 & 숙련 성과',
      icon: BookOpen,
      color: 'text-pink-400 border-pink-500/20 bg-pink-950/20',
      desc: '헌터 레벨, 스킬 숙련 및 극의 해금',
      detail: `Lv.${hunter.level} (${(Object.values(s.skillStates ?? {})).filter((sk: any) => sk.isCapstoneUnlocked).length}개 극의)`
    }
  }

  // 장착 중인 칭호 이름
  const equippedTitleName = HUNTER_TITLE_DEFINITIONS.find(t => t.id === equippedTitleId)?.name ?? '칭호 없음'

  return (
    <div className="space-y-6">
      {/* 1. 메인 헌터 등급 요약 프로필 */}
      <div className={`relative overflow-hidden panel corner-bracket p-6 md:p-8 border border-cyan-500/20 ${theme.bg} ${theme.glow} shadow-lg transition-all duration-500`}>
        <div className="br" />
        {/* 등급별 백그라운드 아우라 */}
        <div className={`absolute inset-0 bg-gradient-to-r ${theme.aura} opacity-30 blur-2xl pointer-events-none`} />

        <div className="relative flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-6 flex-col md:flex-row text-center md:text-left">
            {/* 등급 대형 인시그니아 */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-24 h-24 rounded-full flex items-center justify-between border-2 bg-ink-950/90 shadow-2xl relative ${theme.border}`}
            >
              {/* 회전하는 테두리 효과 (S/NATIONAL 이상) */}
              {(currentGrade === 'S' || currentGrade === 'NATIONAL') && (
                <div className={`absolute -inset-1 rounded-full border-2 border-dashed animate-spin ${theme.border} opacity-50`} />
              )}
              <span className={`w-full text-center text-4xl font-extrabold tracking-wider filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] ${theme.text}`}>
                {currentGrade}
              </span>
            </motion.div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-semibold system-text ${theme.border} ${theme.text} bg-black/40`}>
                  {theme.label}
                </span>
                {equippedTitleId && (
                  <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 bg-amber-500/5 system-text flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    {equippedTitleName}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 justify-center md:justify-start">
                {hunter.name} <span className="text-sm font-medium text-white/50">헌터</span>
              </h2>
              <p className="text-xs text-white/60 system-text max-w-md">
                "이 칭호와 오라는 당신이 지상에 남긴 모든 실적과 현실 속 한계를 향해 싸운 몰입의 깊이를 공식 증명합니다."
              </p>
            </div>
          </div>

          {/* 총평 및 스코어 표시 */}
          <div className="w-full md:w-auto min-w-[220px] panel bg-black/40 border border-white/5 p-4 rounded text-center md:text-right">
            <div className="text-[10px] text-cyan-400/60 system-text tracking-widest uppercase mb-1">협회 종합 평가 점수 (Association Rating)</div>
            <div className="text-3xl font-extrabold text-white filter drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
              {ratingScore} <span className="text-sm font-medium text-white/40">Points</span>
            </div>
            {nextGrade ? (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-white/40 system-text">
                  <span>다음 등급: {GRADE_LABELS[nextGrade]}</span>
                  <span>{ratingScore} / {nextCut}</span>
                </div>
                {/* 등급 게이지 */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full bg-cyan-400 transition-all duration-1000 ${currentGrade === 'NATIONAL' ? 'bg-red-500' : 'bg-cyan-500'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {/* 평가 점수는 도달했으나 조건 미충족 상태인 경우 경고 알림 */}
                {!pendingExam && ratingScore >= nextCut && (
                  <div className="mt-2 text-left panel border-red-500/20 bg-red-500/5 p-2 rounded text-[10px] text-red-300 leading-normal system-text">
                    <div className="font-bold flex items-center gap-1 text-[9px] mb-0.5 text-red-200">
                      <Zap className="w-2.5 h-2.5 text-red-400" />
                      심사 승인 대기 중 (조건 미달)
                    </div>
                    {nextGrade === 'C' && '레벨 10 이상 또는 충분한 던전/집중 실적 필요'}
                    {nextGrade === 'B' && '레벨 20 이상 및 (보스 1회 또는 게이트 20회 이상) 필요'}
                    {nextGrade === 'A' && '레벨 35 이상 및 (레드게이트 1회 또는 보스 5회 이상) 필요'}
                    {nextGrade === 'S' && '레벨 45 이상 및 (레드게이트 2회 또는 보스 8회 이상 등) 필요'}
                    {nextGrade === 'NATIONAL' && '레벨 55 이상 및 레드게이트 5회 & 보스 15회 이상 필요'}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-1 text-[10px] text-amber-300 font-semibold system-text animate-pulse">
                ★ 인류 정점급 (국가권력급 헌터) 달성 ★
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. 승급 시험 대기 알림판 */}
      {pendingExam && (() => {
        const examDef = pendingExam.targetGrade !== 'E' ? PROMOTION_EXAM_DEFINITIONS[pendingExam.targetGrade] : null
        if (!examDef) return null

        return (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`panel corner-bracket p-6 border shadow-2xl relative bg-black/90 overflow-hidden ${
                pendingExam.status === 'available'
                  ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/20 via-black to-amber-950/10'
                  : 'border-cyan-500/40 bg-gradient-to-br from-cyan-950/20 via-black to-cyan-950/10'
              }`}
            >
              <div className="br" />
              {/* Decorative radial glows */}
              <div className={`absolute top-0 right-0 w-48 h-48 rounded-full filter blur-3xl pointer-events-none opacity-20 ${
                pendingExam.status === 'available' ? 'bg-amber-500' : 'bg-cyan-500'
              }`} />
              
              <div className="relative space-y-4">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        pendingExam.status === 'available'
                          ? 'border border-amber-500/30 text-amber-400 bg-amber-500/10'
                          : 'border border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
                      }`}>
                        공식 승급 심사령
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold border border-red-500/30 text-red-400 bg-red-500/10">
                        위험도: {examDef.riskLevel}
                      </span>
                    </div>
                    <h3 className={`text-lg font-extrabold tracking-tight ${
                      pendingExam.status === 'available' ? 'text-amber-300' : 'text-cyan-300'
                    }`}>
                      {examDef.name}
                    </h3>
                  </div>
                  
                  {pendingExam.status === 'available' ? (
                    <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
                      <button
                        onClick={() => startPromotionExam(pendingExam.targetGrade)}
                        disabled={!examLock.allowed}
                        className={`w-full sm:w-auto btn text-xs py-2 px-5 font-bold shadow-lg flex items-center gap-1.5 justify-center ${
                          !examLock.allowed
                            ? 'border-red-500/40 text-red-400 bg-red-950/15 cursor-not-allowed opacity-60'
                            : 'border-amber-500/60 text-amber-300 bg-amber-500/15 hover:bg-amber-500/35 hover:scale-[1.02] active:scale-95 shadow-amber-500/10'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        {!examLock.allowed ? '심사령 개방 잠김' : '심사 게이트 개방'}
                      </button>
                      {!examLock.allowed && (
                        <span className="text-[9px] text-red-400 font-semibold max-w-[240px] text-right leading-tight">
                          ⚠️ {examLock.reason}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full sm:w-auto text-center text-xs font-bold text-cyan-300/90 bg-cyan-950/30 border border-cyan-500/30 px-4 py-2 rounded system-text animate-pulse">
                      게이트 탭에서 심사 진행 중
                    </div>
                  )}
                </div>

                {/* Subtitle / Concept */}
                <div className="space-y-1">
                  <div className="text-xs text-white/50 font-medium">심사 테마: <span className="text-white/80">{examDef.concept}</span></div>
                  <p className="text-xs text-white/70 leading-relaxed font-sans">{examDef.description}</p>
                </div>

                {/* Detail Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="panel bg-white/5 border border-white/5 p-3 rounded">
                    <div className="text-[10px] text-white/40 mb-1 system-text">권장 전투력</div>
                    <div className="text-sm font-extrabold text-cyan-400">
                      {examDef.recommendedPower} <span className="text-[10px] font-normal text-white/50">이상 권장</span>
                    </div>
                  </div>
                  
                  <div className="panel bg-white/5 border border-white/5 p-3 rounded">
                    <div className="text-[10px] text-white/40 mb-1 system-text">심사 통과 요건</div>
                    <div className="text-xs font-bold text-white/90 leading-tight">
                      {examDef.clearRequirement}
                    </div>
                  </div>
                  
                  <div className="panel bg-white/5 border border-white/5 p-3 rounded">
                    <div className="text-[10px] text-white/40 mb-1 system-text">평가 안전 조항</div>
                    <div className="text-[10px] font-medium text-white/80 leading-normal">
                      {examDef.failurePolicy}
                    </div>
                  </div>
                </div>

                {/* Badges / Extras */}
                <div className="flex flex-wrap gap-2 pt-1 text-[10px] system-text text-white/60">
                  {examDef.shadowUsageAdvised && (
                    <span className="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      그림자 군단 소환 적극 활용
                    </span>
                  )}
                  {examDef.telegraphEmphasis && (
                    <span className="px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      정밀한 전조(Telegraph) 패턴 감지
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white/40 flex items-center gap-1">
                    총 {examDef.encounterCount}개 관문 연속 돌파
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )
      })()}

      {/* 3. 탭 셀렉터 */}
      <div className="flex border-b border-white/10 gap-1">
        {[
          { key: 'status' as const, label: '협회 실적 & 6대 평가' },
          { key: 'titles' as const, label: '공식 칭호 관리' },
          { key: 'history' as const, label: '평가 승급 이력' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-3 text-sm font-semibold transition border-b-2 -mb-[2px] ${
              activeTab === t.key
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 4. 탭 콘텐츠 */}
      <div>
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* 6대 평가 축 breakdown Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(axisMeta) as Array<keyof AssociationRatingBreakdown>).map(key => {
                const meta = axisMeta[key]
                const score = ratingBreakdown[key] ?? 0
                const percent = Math.min(100, (score / 1000) * 100)
                const Icon = meta.icon

                return (
                  <div key={key} className={`panel p-5 border rounded flex flex-col justify-between transition hover:border-white/15 ${meta.color.split(' ').slice(1).join(' ')}`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold uppercase tracking-wider system-text flex items-center gap-1.5 ${meta.color.split(' ')[0]}`}>
                          <Icon className="w-4 h-4" />
                          {meta.label}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {score} <span className="text-[10px] text-white/40">/ 1000</span>
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mb-3">{meta.desc}</p>
                    </div>

                    <div className="space-y-2">
                      {/* 미니 게이지 바 */}
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full ${meta.color.split(' ')[0].replace('text-', 'bg-')}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-white/40 system-text flex items-center justify-between">
                        <span>현재 실적</span>
                        <span className="font-semibold text-white/70">{meta.detail}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 안내 경고판 */}
            <div className="panel p-5 bg-black/40 border border-white/5 text-xs text-white/50 space-y-2 leading-relaxed">
              <h4 className="font-bold text-white/80 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                헌터 협회 평가 점수(Association Rating) 정밀 정산 공식 안내
              </h4>
              <p>
                - 헌터 협회 등급 시스템은 캐릭터 전투력과 별개로 **헌터의 현실적 자기관리 몰입 깊이와 게임 속 업적**을 종합 평점화(Diminishing Soft-cap 적용)한 명예 체계입니다.
              </p>
              <p>
                - **강등 방지 단조성(Monotonicity) 보장:** 집중 실패나 루틴 이탈로 현실 준비도 점수가 변하더라도, 이미 한 번 달성한 현재 헌터 등급은 **절대 강등되지 않고 박제 유지**됩니다.
              </p>
              <p>
                - **마이그레이션 보정 안내:** 최초 시스템 편입 시, 기존에 수행했던 레벨, 습득 스킬, 그림자 군단 규모 등의 활동 실적이 협회 보정 계산식을 거쳐 등급으로 자동 환산 및 초기 배정되었습니다.
              </p>
              <p>
                - **등급 심사 승격 확정제:** 평가 점수가 컷에 도달하더라도 최소 조건(레벨/기록) 충족 후 개방되는 **심사 게이트(Promotion Exam Gate)**를 격파하기 전까지는 이전 등급에 안전하게 고정 유지됩니다.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'titles' && (
          <div className="space-y-4">
            <div className="panel p-4 bg-ink-950/50 border border-white/5 rounded flex justify-between items-center text-xs">
              <span className="text-white/60">현재 칭호 장착으로 해금 및 자격 증명이 프로필과 엠블럼 테두리에 연동됩니다.</span>
              <span className="font-semibold text-cyan-400">잠금 해제: {unlockedTitles.length} / {HUNTER_TITLE_DEFINITIONS.length}</span>
            </div>

            {/* 칭호 그리드 리스트 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {HUNTER_TITLE_DEFINITIONS.map(title => {
                const isUnlocked = unlockedTitles.includes(title.id)
                const isEquipped = equippedTitleId === title.id
                
                // 등급별 칭호 여부 확인
                const isRankTitle = ['title_e', 'title_d', 'title_c', 'title_b', 'title_a', 'title_s', 'title_national'].includes(title.id)

                return (
                  <div
                    key={title.id}
                    className={`panel corner-bracket p-4 flex flex-col justify-between transition duration-300 ${
                      isUnlocked
                        ? isEquipped
                          ? 'border-amber-500/40 bg-amber-950/5'
                          : 'border-white/10 bg-ink-950/40'
                        : 'border-white/5 opacity-50 bg-black/60'
                    }`}
                  >
                    <div className="br" />
                    <div>
                      {/* 카드 헤더 */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isUnlocked ? (
                            <Award className={`w-4 h-4 ${isEquipped ? 'text-amber-400' : 'text-cyan-400'}`} />
                          ) : (
                            <Lock className="w-4 h-4 text-white/30" />
                          )}
                          <h4 className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
                            {title.name}
                          </h4>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full system-text ${
                          isRankTitle ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {isRankTitle ? '공식 등급' : '특수 업적'}
                        </span>
                      </div>

                      {/* 설명 및 해금 요건 */}
                      <p className="text-xs text-white/60 mb-2 leading-relaxed">{title.description}</p>
                      <div className="text-[10px] system-text text-white/40 mb-3">
                        요건: <span className={isUnlocked ? 'text-cyan-300/80' : 'text-white/30'}>{title.unlockCondition}</span>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div>
                      {isUnlocked ? (
                        isEquipped ? (
                          <div className="w-full text-center py-1.5 rounded bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/40">
                            장착 중
                          </div>
                        ) : (
                          <button
                            onClick={() => equipHunterTitle(title.id)}
                            className="w-full text-center py-1.5 rounded bg-cyan-400/10 text-cyan-300 text-xs font-semibold border border-cyan-500/20 hover:bg-cyan-500/25 hover:border-cyan-400/40 transition"
                          >
                            칭호 장착
                          </button>
                        )
                      ) : (
                        <div className="w-full text-center py-1.5 rounded bg-white/5 text-white/30 text-xs border border-white/5">
                          미해금 자격
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="panel corner-bracket p-6">
            <div className="br" />
            <h3 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              공식 헌터 등급 평가 이력 (Evaluation Timeline)
            </h3>

            {/* 타임라인 */}
            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
              {history && history.length > 0 ? (
                history.map((entry, idx) => (
                  <div key={idx} className="flex gap-4 relative pl-8">
                    {/* 마커 노드 */}
                    <div className="absolute left-2.5 top-2.5 w-1.5 h-1.5 -ml-1 rounded-full bg-cyan-400 ring-4 ring-cyan-950" />
                    
                    <div className="flex-1 bg-white/5 border border-white/5 p-3 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold ${GRADE_THEME[entry.grade]?.text ?? 'text-cyan-400'}`}>
                            {GRADE_LABELS[entry.grade] ?? entry.grade}
                          </span>
                          <span className="text-[10px] text-white/40 system-text">
                            {new Date(entry.at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-xs text-white/70">{entry.reason}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 hidden md:block" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 text-xs text-white/30 system-text">
                  등급 변경 이력이 기록되지 않았습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
