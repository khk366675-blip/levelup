/**
 * ShadowExtractionReveal
 *
 * Dedicated reveal for the Gate shadow extraction flow.
 *
 * This stays intentionally separate from TicketRevealSequence / ShadowRevealModal.
 * The store has already computed the extraction result before this component is
 * mounted; this file only presents that result and never rerolls, refunds, or
 * writes persistence.
 */

import clsx from 'clsx'
import { motion, useReducedMotion } from 'framer-motion'
import { FastForward, Skull, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import apexAuraUrl from '../../assets/extraction/extraction-apex-aura-clean.webp'
import bindingChainUrl from '../../assets/extraction/extraction-binding-chain-clean.webp'
import commandFlareUrl from '../../assets/extraction/extraction-command-flare-clean.webp'
import failureAshUrl from '../../assets/extraction/extraction-failure-ash-clean.webp'
import groundFogUrl from '../../assets/extraction/extraction-ground-fog-clean.webp'
import remnantCoreUrl from '../../assets/extraction/extraction-remnant-core-clean.webp'
import revealBurstUrl from '../../assets/extraction/extraction-reveal-burst-clean.webp'
import riftTearUrl from '../../assets/extraction/extraction-rift-tear-clean.webp'
import sceneBgUrl from '../../assets/extraction/extraction-scene-bg.webp.png'
import shadowColumnUrl from '../../assets/extraction/extraction-shadow-column-clean.webp'
import {
  SHADOW_INNATE_GRADE_LABEL,
  SHADOW_RARITY_LABEL,
  SHADOW_ROLE_LABEL,
  getShadowDefinition,
  SHADOW_FRAGMENT_SUMMON_COST,
} from '../../lib/shadows'
import type { OwnedShadow, ShadowExtractResult, ShadowRarity } from '../../lib/types'
import { ShadowPortrait } from './ShadowPortrait'
import { GATE_DEFINITIONS } from '../../lib/seed'
import { getMockDirectBattleMonster } from '../../lib/directBattleMonsters'
import { getMonsterBattleSpriteUrl } from '../../lib/monsterBattleSprites'

type Props = {
  result?: ShadowExtractResult
  gateName?: string
  onClose: () => void
}

type ExtractionStage = 'detect' | 'resonance' | 'resistance' | 'command' | 'threshold' | 'reveal'
type ExtractionIntensity = 'quick' | 'high' | 'apex'

const QUICK_STAGES: Array<{ id: ExtractionStage; ms: number }> = [
  { id: 'detect', ms: 1600 },
  { id: 'resonance', ms: 1600 },
  { id: 'resistance', ms: 1600 },
  { id: 'command', ms: 1200 },
  { id: 'threshold', ms: 2000 },
]

const HIGH_STAGES: Array<{ id: ExtractionStage; ms: number }> = [
  { id: 'detect', ms: 2200 },
  { id: 'resonance', ms: 2400 },
  { id: 'resistance', ms: 2600 },
  { id: 'command', ms: 1600 },
  { id: 'threshold', ms: 3200 },
]

const APEX_STAGES: Array<{ id: ExtractionStage; ms: number }> = [
  { id: 'detect', ms: 2800 },
  { id: 'resonance', ms: 3200 },
  { id: 'resistance', ms: 3800 },
  { id: 'command', ms: 2000 },
  { id: 'threshold', ms: 4800 },
]

const rarityShadowAccent: Record<ShadowRarity, { glow: string; border: string; aura: string }> = {
  common: {
    glow: 'rgba(148, 163, 184, 0.34)',
    border: 'border-slate-300/35',
    aura: 'shadow-[0_0_82px_rgba(148,163,184,0.22)]',
  },
  uncommon: {
    glow: 'rgba(52, 211, 153, 0.36)',
    border: 'border-emerald-300/35',
    aura: 'shadow-[0_0_92px_rgba(52,211,153,0.24)]',
  },
  rare: {
    glow: 'rgba(34, 211, 238, 0.44)',
    border: 'border-cyan-300/40',
    aura: 'shadow-[0_0_104px_rgba(34,211,238,0.30)]',
  },
  epic: {
    glow: 'rgba(168, 85, 247, 0.52)',
    border: 'border-purple-300/50',
    aura: 'shadow-[0_0_120px_rgba(168,85,247,0.34)]',
  },
  legendary: {
    glow: 'rgba(245, 158, 11, 0.58)',
    border: 'border-amber-300/55',
    aura: 'shadow-[0_0_140px_rgba(245,158,11,0.36)]',
  },
}

const stageCopy: Record<ExtractionStage, { title: string; detail: string }> = {
  detect: {
    title: '잔류 그림자 감지',
    detail: '전장에 일렁이는 마력의 잔영을 탐색하고 있습니다.',
  },
  resonance: {
    title: '영혼 공명 측정',
    detail: '잔영과 주파수를 일치시키는 중입니다. 공명율 측정 진행 중...',
  },
  resistance: {
    title: '그림자의 강한 저항',
    detail: '잔영이 군주의 속박을 벗어나려고 격렬하게 저항하고 있습니다.',
  },
  command: {
    title: '군주의 절대 명령',
    detail: '"일어나라." 거부할 수 없는 절대적인 어둠의 음성이 내려앉습니다.',
  },
  threshold: {
    title: '추출 임계점 도달...',
    detail: '마력의 속박이 최고조에 달했습니다. 잔영의 반응을 조율하는 중입니다.',
  },
  reveal: {
    title: '응답의 순간',
    detail: '추출 결과가 온전하게 마주합니다.',
  },
}

const stageLabel: Record<ExtractionStage, string> = {
  detect: 'DETECTION',
  resonance: 'RESONANCE',
  resistance: 'RESISTANCE',
  command: 'MONARCH\'S COMMAND',
  threshold: 'THRESHOLD',
  reveal: 'RESULT',
}

const resolveIntensity = (
  shadow?: OwnedShadow,
  rolledRarity?: ShadowRarity,
  isBossExtraction?: boolean,
): ExtractionIntensity => {
  if (isBossExtraction) return 'apex'
  const rarity = shadow?.rarity ?? rolledRarity
  const named = Boolean(shadow?.isNamed || shadow?.isGateNamed || shadow?.isAchievementNamed)
  const grade = shadow?.innateGrade
  if (named || rarity === 'legendary' || grade === 'S') return 'apex'
  if (rarity === 'epic' || rarity === 'rare' || grade === 'A') return 'high'
  return 'quick'
}

export function ShadowExtractionReveal({ result, gateName, onClose }: Props) {
  const reducedMotion = useReducedMotion()
  const [stage, setStage] = useState<ExtractionStage>('detect')
  const [isFast, setIsFast] = useState(false)
  const timersRef = useRef<number[]>([])

  const intensity = useMemo(
    () => resolveIntensity(result?.shadow, result?.rolledRarity, result?.isBossExtraction),
    [result?.shadow, result?.rolledRarity, result?.isBossExtraction],
  )

  const stages = useMemo(() => {
    if (intensity === 'apex') return APEX_STAGES
    if (intensity === 'high') return HIGH_STAGES
    return QUICK_STAGES
  }, [intensity])

  const success = Boolean(result?.success && result.shadow)
  const definition = useMemo(
    () => (result?.shadow ? getShadowDefinition(result.shadow.definitionId) : undefined),
    [result?.shadow],
  )
  const rarity: ShadowRarity = result?.shadow?.rarity ?? result?.rolledRarity ?? 'common'
  const accent = rarityShadowAccent[rarity]
  const named = Boolean(result?.shadow?.isNamed || result?.shadow?.isGateNamed || result?.shadow?.isAchievementNamed)
  const innateGrade = result?.shadow?.innateGrade

  // 12-40D: 연출 단계 중 노출할 몬스터 실루엣 스프라이트 도출
  const monsterSpriteUrl = useMemo(() => {
    if (!result) return undefined
    const gateDef = GATE_DEFINITIONS.find(g => g.id === result.gateId)
    if (!gateDef) return undefined
    const representativeMonsterId = gateDef.monsterIds.find(mId => {
      const m = getMockDirectBattleMonster(mId)
      return m?.unitType === 'boss'
    }) ?? gateDef.monsterIds[0] ?? 'mock-minion'
    const targetMonster = getMockDirectBattleMonster(representativeMonsterId)
    return getMonsterBattleSpriteUrl(representativeMonsterId, targetMonster?.role, targetMonster?.unitType === 'boss')
  }, [result])

  const clearTimers = () => {
    for (const handle of timersRef.current) window.clearTimeout(handle)
    timersRef.current = []
  }

  useEffect(() => {
    setStage('detect')
    clearTimers()
    if (!result) return
    if (reducedMotion) {
      setStage('reveal')
      return
    }

    let elapsed = 0
    for (const step of stages) {
      const duration = isFast ? step.ms / 2.5 : step.ms
      elapsed += duration
      const id = step.id
      const handle = window.setTimeout(() => {
        const nextIndex = stages.findIndex(item => item.id === id) + 1
        if (nextIndex >= stages.length) setStage('reveal')
        else setStage(stages[nextIndex].id)
      }, elapsed)
      timersRef.current.push(handle)
    }
    return clearTimers
  }, [result, stages, reducedMotion, isFast])

  useEffect(() => {
    if (!result) return
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (stage === 'reveal') onClose()
      else {
        clearTimers()
        setStage('reveal')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [result, stage, onClose])

  if (!result) return null

  const showReveal = stage === 'reveal'
  const skipToReveal = () => {
    clearTimers()
    setStage('reveal')
  }

  const artVars = {
    '--extraction-bg': `url(${sceneBgUrl})`,
    '--extraction-command-flare': `url(${commandFlareUrl})`,
    '--extraction-ground-fog': `url(${groundFogUrl})`,
    '--extraction-mass': `url(${remnantCoreUrl})`,
    '--extraction-column': `url(${shadowColumnUrl})`,
    '--extraction-rift': `url(${riftTearUrl})`,
    '--extraction-binding': `url(${bindingChainUrl})`,
    '--extraction-burst': `url(${revealBurstUrl})`,
    '--extraction-apex-aura': `url(${apexAuraUrl})`,
    '--extraction-ash': `url(${failureAshUrl})`,
  } as CSSProperties

  return createPortal(
    <div className="fixed inset-0 z-[1080] overflow-hidden bg-black text-white" style={artVars}>
      <div className="shadow-extraction-scene-bg" />
      <div className="shadow-extraction-scene-grade" style={{ opacity: showReveal && success ? 1 : 0, background: `radial-gradient(circle at 50% 42%, ${accent.glow}, transparent 45%)` }} />
      <div className="shadow-extraction-scene-fog" />
      <div className="shadow-extraction-scene-vignette" />

      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.24, ease: 'easeOut' }}
        className={clsx(
          'relative z-10 flex h-full w-full flex-col overflow-y-auto p-4 sm:p-6',
          !reducedMotion && !showReveal && intensity === 'apex' && (stage === 'resistance' || stage === 'resonance') && 'shadow-extraction-shake',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={gateName ? `${gateName} shadow extraction` : 'shadow extraction'}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center gap-2 rounded border border-purple-200/20 bg-black/30 px-2.5 py-1 text-[10px] system-text text-purple-100/80 backdrop-blur-sm">
              <Skull className="h-3.5 w-3.5" />
              {result.isBossExtraction ? 'BOSS SHADOW EXTRACTION' : 'SHADOW EXTRACTION'}
            </div>
            {gateName && (
              <div className="rounded border border-white/10 bg-black/24 px-2.5 py-1 text-[10px] system-text text-white/55 backdrop-blur-sm">
                {gateName}
              </div>
            )}
            <div className="rounded border border-cyan-100/16 bg-black/24 px-2.5 py-1 text-[10px] system-text text-cyan-100/72 backdrop-blur-sm">
              {stageLabel[stage]}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showReveal && (
              <button
                type="button"
                onClick={() => setIsFast(!isFast)}
                className={clsx(
                  "inline-flex min-h-8 items-center gap-1 rounded border px-2.5 text-[10px] system-text transition backdrop-blur-sm",
                  isFast 
                    ? "border-amber-300 bg-amber-400/20 text-amber-200" 
                    : "border-white/12 bg-black/30 text-white/62 hover:bg-white/10 hover:text-white/90"
                )}
              >
                FAST 2.5x
              </button>
            )}
            <button
              type="button"
              onClick={showReveal ? onClose : skipToReveal}
              className="inline-flex min-h-8 items-center gap-1 rounded border border-white/12 bg-black/30 px-2 text-[10px] system-text text-white/62 backdrop-blur-sm transition hover:bg-white/10 hover:text-white/90"
            >
              <FastForward className="h-3 w-3" />
              {showReveal ? 'Fast Close' : 'Skip'}
            </button>
          </div>
        </div>

        <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center">
          {showReveal ? (
            <RevealResult
              result={result}
              success={success}
              rarity={rarity}
              named={named}
              innateGrade={innateGrade}
              definition={definition}
              intensity={intensity}
              accent={accent}
              onClose={onClose}
            />
          ) : (
            <StageBody
              stage={stage}
              intensity={intensity}
              copy={stageCopy[stage]}
              reducedMotion={Boolean(reducedMotion)}
              monsterSpriteUrl={monsterSpriteUrl}
              isBossExtraction={Boolean(result.isBossExtraction)}
            />
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}

function StageBody({
  stage,
  intensity,
  copy,
  reducedMotion,
  monsterSpriteUrl,
  isBossExtraction,
}: {
  stage: ExtractionStage
  intensity: ExtractionIntensity
  copy: { title: string; detail: string }
  reducedMotion: boolean
  monsterSpriteUrl?: string
  isBossExtraction: boolean
}) {
  return (
    <div className={clsx(
      'shadow-extraction-cutscene relative flex flex-col items-center justify-center text-center',
      `shadow-extraction-stage-${stage}`,
      `shadow-extraction-intensity-${intensity}`,
      reducedMotion && 'shadow-extraction-reduced',
      isBossExtraction && 'shadow-extraction-boss-mode border border-red-500/20 shadow-[0_0_80px_rgba(239,68,68,0.15)] bg-black/60',
    )}>
      <div className="shadow-extraction-ground-haze" />
      <div className="shadow-extraction-art-command-flare" />
      <div className="shadow-extraction-art-smoke shadow-extraction-smoke-back" />
      <div className="shadow-extraction-art-rift" />
      <div className="shadow-extraction-art-column" />
      
      {/* 12-40D: 추출 대상 몬스터의 흑백 실루엣 표시 */}
      {monsterSpriteUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
          <img
            src={monsterSpriteUrl}
            alt="Monster Silhouette"
            className={clsx(
              "object-contain transition-all duration-300 pointer-events-none",
              (stage === 'resistance' || (isBossExtraction && stage === 'resonance')) ? "animate-pulse scale-[1.08] shadow-[0_0_50px_rgba(239,68,68,0.2)]" : "scale-[1.02]",
              isBossExtraction ? "h-64 opacity-[0.32]" : "h-52 opacity-[0.16]"
            )}
            style={{
              filter: isBossExtraction 
                ? 'drop-shadow(0 0 35px rgba(239, 68, 68, 0.7)) brightness(0)' 
                : 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.45)) brightness(0) invert(1)',
            }}
          />
        </div>
      )}

      <div className="shadow-extraction-art-mass" />
      <div className="shadow-extraction-art-binding" />
      <div className="shadow-extraction-art-smoke shadow-extraction-smoke-front" />
      
      <div className="shadow-extraction-stage-copy z-10 flex flex-col items-center">
        <div className="system-text text-[10px] tracking-[0.36em] text-cyan-100/52">
          {isBossExtraction ? 'BOSS RITUAL' : 'EXTRACTION RITUAL'} · {stageLabel[stage]}
        </div>
        <h3 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
          {copy.title}
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-200/62">
          {copy.detail}
        </p>

        {/* 12-40D: 실시간 공명도 및 저항력 게이지바 연출 */}
        {stage === 'resonance' && (
          <div className="mt-6 w-full max-w-xs bg-cyan-950/40 border border-cyan-800/30 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex justify-between text-[10px] system-text text-cyan-200 mb-1">
              <span>군주 파동 동기화 중...</span>
              <span className="animate-pulse font-bold">78%</span>
            </div>
            <div className="h-1.5 w-full bg-cyan-950 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 animate-pulse transition-all duration-500" style={{ width: '78%' }} />
            </div>
          </div>
        )}

        {stage === 'resistance' && (
          <div className="mt-6 w-full max-w-xs bg-red-950/40 border border-red-800/30 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex justify-between text-[10px] system-text text-red-200 mb-1">
              <span>그림자 반발지수</span>
              <span className="font-bold text-red-400 animate-pulse">DANGER (92%)</span>
            </div>
            <div className="h-1.5 w-full bg-red-950 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-600 to-red-400 animate-pulse transition-all duration-300" style={{ width: '92%' }} />
            </div>
          </div>
        )}

        {stage === 'threshold' && (
          <div className="mt-6 w-full max-w-xs bg-purple-950/40 border border-purple-800/30 rounded-lg p-2.5 backdrop-blur-sm animate-pulse">
            <div className="flex justify-between text-[10px] system-text text-purple-200 mb-1">
              <span>마력 봉착 임계치</span>
              <span className="font-bold text-purple-300">LIMIT REACHED</span>
            </div>
            <div className="h-1.5 w-full bg-purple-950 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-100" style={{ width: '100%' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RevealResult({
  result,
  success,
  rarity,
  named,
  innateGrade,
  definition,
  intensity,
  accent,
  onClose,
}: {
  result: ShadowExtractResult
  success: boolean
  rarity: ShadowRarity
  named: boolean
  innateGrade?: string
  definition?: ReturnType<typeof getShadowDefinition>
  intensity: ExtractionIntensity
  accent: { glow: string; border: string; aura: string }
  onClose: () => void
}) {
  const shadow = result.shadow
  const summaryCopy = success
    ? named
      ? '이름을 가진 그림자가 명령에 응답해 군단에 합류했습니다.'
      : intensity === 'apex'
        ? '강한 그림자가 일어서 군단의 대열에 섰습니다.'
        : intensity === 'high'
          ? '그림자가 형체를 얻고 군단에 합류했습니다.'
          : '명령에 응답했습니다. 새 그림자가 군단에 합류했습니다.'
    : result.isBossExtraction
      ? '보스 그림자의 파동이 너무 강해 추출에 실패했습니다. 하지만 잔향 속에서 강한 흔적을 수집했습니다.'
      : '명령이 닿지 않았습니다. 잔영이 어둠 속으로 흩어졌으나, 소량의 파편 흔적을 수집했습니다.'

  return (
    <div className={clsx(
      'shadow-extraction-result',
      success ? 'shadow-extraction-result-success' : 'shadow-extraction-result-fail',
      intensity === 'apex' && success && 'shadow-extraction-result-apex',
    )}>
      <div className="shadow-extraction-result-smoke" />
      {success ? (
        <>
          <div className="shadow-extraction-result-rift" />
          <div className="shadow-extraction-result-column" />
          <div className="shadow-extraction-result-burst" />
          {intensity === 'apex' && <div className="shadow-extraction-result-apex-aura" />}
          <div className="shadow-extraction-result-aura" style={{ boxShadow: `0 0 ${intensity === 'apex' ? 150 : 110}px ${accent.glow}` }} />
          {shadow && (
            <ShadowPortrait
              shadow={shadow}
              definition={definition}
              size="xl"
              active
              highlighted={intensity !== 'quick'}
              evolutionReady={intensity === 'apex'}
              innateGrade={innateGrade}
              className={clsx('shadow-extraction-raising-portrait shadow-extraction-final-portrait w-full max-w-[min(80vw,28rem)]', intensity === 'apex' ? 'h-[min(60vh,34rem)]' : 'h-[min(54vh,30rem)]')}
            />
          )}
        </>
      ) : (
        <div className="shadow-extraction-failure-scene">
          <div className="shadow-extraction-failure-ash" />
          <div className="shadow-extraction-failure-remnant" />
          <div className="system-text text-lg tracking-[0.4em] text-slate-200/58">FADED</div>
        </div>
      )}

      <div className="relative z-10 min-w-0 max-w-3xl text-center">
        <div className={clsx('system-text text-[10px]', success ? 'text-cyan-200/74' : 'text-slate-200/62')}>
          {success ? 'COMMAND ANSWERED' : 'TRACE LOST'}
        </div>
        <h3 className="mt-1 text-2xl font-black leading-tight text-white sm:text-3xl">
          {shadow ? shadow.name : '잔영이 흩어졌습니다'}
        </h3>
        {success && shadow && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[10px] system-text">
            <span className={clsx('rounded border px-2 py-1 text-slate-100', accent.border)}>
              {SHADOW_RARITY_LABEL[rarity]}
            </span>
            {innateGrade && (
              <span className="rounded border border-purple-300/30 bg-purple-400/10 px-2 py-1 text-purple-100">
                {SHADOW_INNATE_GRADE_LABEL[innateGrade as keyof typeof SHADOW_INNATE_GRADE_LABEL] ?? innateGrade}
              </span>
            )}
            <span className="rounded border border-cyan-300/22 bg-cyan-400/8 px-2 py-1 text-cyan-100/80">
              {SHADOW_ROLE_LABEL[shadow.role]}
            </span>
            {named && (
              <span className="rounded border border-amber-300/35 bg-amber-400/10 px-2 py-1 text-amber-100">
                NAMED
              </span>
            )}
            <span className="rounded border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-emerald-100">
              EXTRACTED
            </span>
          </div>
        )}
        {!success && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="flex flex-wrap justify-center gap-1.5 text-[10px] system-text">
              <span className="rounded border border-slate-300/25 bg-slate-400/10 px-2 py-1 text-slate-100">
                EXTRACTION FAILED
              </span>
              {result.resonanceBonusPercent !== undefined && result.resonanceBonusPercent > 0 && (
                <span className="rounded border border-amber-300/35 bg-amber-400/15 px-2 py-1 text-amber-200 animate-pulse font-bold">
                  다음 공명 보정 +{result.resonanceBonusPercent}% 누적
                </span>
              )}
            </div>
            {result.rewardFragmentName && (
              <div className="mt-2 text-xs text-cyan-200/90 bg-cyan-950/50 border border-cyan-800/40 rounded-lg px-4 py-2 flex items-center gap-2 max-w-sm">
                <span className="text-[10px] bg-cyan-900/60 px-1.5 py-0.5 rounded text-cyan-300 font-semibold">REWARD</span>
                <span>{result.rewardFragmentName} 조각 +{result.rewardFragmentCount ?? 1} 획득</span>
              </div>
            )}
          </div>
        )}
        <p className="mt-4 text-sm font-semibold leading-relaxed text-white/82">{summaryCopy}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="relative z-10 mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-5 text-xs font-bold text-white transition hover:bg-white/15"
      >
        <X className="h-3.5 w-3.5" />
        Close
      </button>
    </div>
  )
}
