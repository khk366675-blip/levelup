import clsx from 'clsx'
import { motion, useReducedMotion } from 'framer-motion'
import { FastForward, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  SHADOW_INNATE_GRADE_LABEL,
  SHADOW_RARITY_LABEL,
  SHADOW_ROLE_LABEL,
  formatShadowEffect,
  getShadowDefinition,
  getShadowEffects,
} from '../../lib/shadows'
import type { OwnedShadow, ShadowDefinition, ShadowInnateGrade, ShadowRarity } from '../../lib/types'
import { TicketRevealSequence } from '../TicketRevealSequence'
import { ShadowPortrait } from './ShadowPortrait'

export type ShadowRevealSource = 'summon' | 'shard' | 'extraction' | 'box' | 'reward'

export type ShadowRevealPayload = {
  shadow?: OwnedShadow
  definition?: ShadowDefinition
  rarity?: ShadowRarity
  innateGrade?: ShadowInnateGrade
  isNamed?: boolean
  isNew?: boolean
  isDuplicate?: boolean
  success?: boolean
  source: ShadowRevealSource
  title?: string
  message?: string
  detail?: string
  ticketLabel?: string
}

type Props = {
  reveal?: ShadowRevealPayload
  onClose: () => void
  fast?: boolean
}

const rarityFrame: Record<ShadowRarity, string> = {
  common: 'border-slate-300/35 text-slate-100',
  uncommon: 'border-emerald-300/40 text-emerald-100',
  rare: 'border-cyan-300/45 text-cyan-100',
  epic: 'border-purple-300/55 text-purple-100 shadow-glow-purple',
  legendary: 'border-amber-300/65 text-amber-100 boss-glow',
}

const innateFrame: Record<ShadowInnateGrade, string> = {
  C: 'border-slate-300/22 bg-slate-400/8 text-slate-100',
  B: 'border-cyan-300/28 bg-cyan-400/10 text-cyan-100',
  A: 'border-purple-300/42 bg-purple-400/12 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.18)]',
  S: 'border-amber-300/55 bg-amber-400/14 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.26)]',
}

const rarityBadge: Record<ShadowRarity, string> = {
  common: 'border-slate-300/22 bg-slate-400/8 text-slate-100',
  uncommon: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100',
  rare: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
  epic: 'border-purple-300/40 bg-purple-400/12 text-purple-100',
  legendary: 'border-amber-300/48 bg-amber-400/14 text-amber-100',
}

const sourceLabel: Record<ShadowRevealSource, string> = {
  summon: 'SHADOW SUMMON',
  shard: 'SHARD RESONANCE',
  extraction: 'SHADOW EXTRACTION',
  box: 'BOX SIGNAL',
  reward: 'REWARD SIGNAL',
}

const sourceCopy: Record<ShadowRevealSource, { intro: string; success: string; duplicate: string; failure: string }> = {
  summon: {
    intro: '소환권의 표식이 열리고 그림자 안개가 응답한다.',
    success: '군단의 기록에 새 그림자가 새겨졌다.',
    duplicate: '이미 각인된 기척이 파편의 기억으로 환원되었다.',
    failure: '기척이 닿았지만 형상은 완성되지 않았다.',
  },
  shard: {
    intro: '흩어진 조각들이 하나의 형상으로 맞물린다.',
    success: '그림자의 형상이 응답했다.',
    duplicate: '동일한 기척이 군단의 뒤편에 겹쳐졌다.',
    failure: '조각의 결속이 잠시 흔들렸다.',
  },
  extraction: {
    intro: '균열의 잔향이 손끝에 모여든다.',
    success: '그림자가 군단에 합류했다.',
    duplicate: '익숙한 잔상이 군단의 기억에 겹쳐졌다.',
    failure: '잔상이 흩어지고 균열이 닫혔다.',
  },
  box: {
    intro: '상자 안쪽에서 그림자의 표식이 번진다.',
    success: '보상 기록에 그림자 신호가 남았다.',
    duplicate: '기억의 조각이 보상 기록에 남았다.',
    failure: '그림자 신호가 희미하게 사라졌다.',
  },
  reward: {
    intro: '보상 표식 사이로 그림자 안개가 흐른다.',
    success: '군단으로 이어지는 보상이 감지되었다.',
    duplicate: '잔향이 조각의 기록으로 남았다.',
    failure: '잔상이 흩어진다.',
  },
}

const resolveDefinition = (reveal: ShadowRevealPayload): ShadowDefinition | undefined =>
  reveal.definition ?? (reveal.shadow ? getShadowDefinition(reveal.shadow.definitionId) : undefined)

export function ShadowRevealModal({ reveal, onClose, fast = false }: Props) {
  const reducedMotion = useReducedMotion()
  const definition = useMemo(() => reveal ? resolveDefinition(reveal) : undefined, [reveal])
  const [sequenceComplete, setSequenceComplete] = useState(false)

  useEffect(() => {
    setSequenceComplete(Boolean(fast || reducedMotion))
  }, [fast, reducedMotion, reveal])

  useEffect(() => {
    if (!reveal) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (sequenceComplete || reducedMotion || fast) {
        onClose()
        return
      }
      setSequenceComplete(true)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fast, onClose, reducedMotion, reveal, sequenceComplete])

  if (!reveal) return null

  const success = reveal.success ?? Boolean(reveal.shadow)
  const rarity = reveal.shadow?.rarity ?? reveal.rarity ?? definition?.rarity ?? 'common'
  const innateGrade = reveal.shadow?.innateGrade ?? reveal.innateGrade
  const named = reveal.isNamed ?? Boolean(reveal.shadow?.isNamed || reveal.shadow?.isGateNamed || reveal.shadow?.isAchievementNamed || definition?.rank === 'named')
  const apexSignal = named || rarity === 'legendary' || innateGrade === 'S'
  const highSignal = apexSignal || rarity === 'epic' || innateGrade === 'A'
  const safeShadow = reveal.shadow
  const copy = sourceCopy[reveal.source]
  const title = reveal.title ?? sourceLabel[reveal.source]
  const resultLabel = reveal.isDuplicate ? 'DUPLICATE' : reveal.isNew ? 'NEW SHADOW' : success ? 'ACQUIRED' : 'FAILED'
  const signalLabel = apexSignal ? 'APEX REVEAL' : (rarity === 'epic' || innateGrade === 'A') ? 'EPIC SIGNAL' : (rarity === 'rare') ? 'RARE SIGNAL' : 'QUICK RESULT'
  const headline = reveal.message
    ?? (success ? (reveal.isDuplicate ? copy.duplicate : copy.success) : copy.failure)
  const detail = reveal.detail ?? copy.intro
  const duration = reducedMotion || fast ? 0 : 0.22
  const showResult = sequenceComplete || reducedMotion || fast
  const sequenceIntensity = apexSignal ? 'apex' : (rarity === 'epic' || innateGrade === 'A') ? 'epic' : (rarity === 'rare') ? 'rare' : 'quick'
  const sequenceSignalClass = innateGrade === 'S' || rarity === 'legendary'
    ? 'text-amber-100'
    : innateGrade === 'A' || rarity === 'epic'
      ? 'text-purple-100'
      : rarity === 'rare'
        ? 'text-cyan-100'
        : 'text-slate-100'
  const sequenceSignal = success
    ? `${innateGrade ? `${innateGrade} INNATE / ` : ''}${SHADOW_RARITY_LABEL[rarity]} SIGNAL`
    : 'TRACE UNSTABLE'
  const completeSequence = () => setSequenceComplete(true)


  return createPortal(
    <div className="fixed inset-0 z-[880] flex items-center justify-center overflow-hidden bg-black/72 p-3 backdrop-blur-sm">
      <div className={clsx(
        'pointer-events-none absolute inset-0',
        !showResult
          ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.10),transparent_42%),radial-gradient(circle_at_50%_54%,rgba(124,58,237,0.12),transparent_62%)]'
          : apexSignal
          ? 'bg-[radial-gradient(circle_at_50%_48%,rgba(245,158,11,0.20),transparent_34%),radial-gradient(circle_at_50%_54%,rgba(88,28,135,0.24),transparent_58%)]'
          : highSignal
            ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.18),transparent_42%),radial-gradient(circle_at_50%_56%,rgba(34,211,238,0.11),transparent_62%)]'
            : 'bg-[radial-gradient(circle_at_50%_52%,rgba(34,211,238,0.13),transparent_48%)]',
      )} />
      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration, ease: 'easeOut' }}
        className={clsx(
          'shadow-reveal-card corner-bracket relative max-h-[92vh] w-full overflow-y-auto rounded-lg border bg-ink-950/92 p-4 sm:p-5',
          apexSignal ? 'max-w-2xl' : 'max-w-xl',
          showResult ? rarityFrame[rarity] : 'text-white',
          showResult && highSignal && 'shadow-reveal-high',
          showResult && !success && 'text-slate-100',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="br" />
        <div className={clsx(
          'pointer-events-none absolute inset-0',
          !showResult
            ? 'bg-[radial-gradient(circle_at_50%_12%,rgba(96,232,255,0.10),transparent_32%),radial-gradient(circle_at_50%_64%,rgba(124,58,237,0.12),transparent_46%)]'
            : apexSignal
            ? 'bg-[radial-gradient(circle_at_50%_4%,rgba(251,191,36,0.24),transparent_34%),radial-gradient(circle_at_50%_60%,rgba(168,85,247,0.18),transparent_44%)]'
            : 'bg-[radial-gradient(circle_at_50%_12%,rgba(96,232,255,0.14),transparent_32%),radial-gradient(circle_at_50%_64%,rgba(168,85,247,0.16),transparent_42%)]',
        )} />
        <div className={clsx('shadow-reveal-rift pointer-events-none absolute inset-x-[12vw] top-5 h-px', success ? 'bg-cyan-200/55' : 'bg-slate-200/35')} />
        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <div className="inline-flex items-center gap-2 rounded border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] system-text text-white/65">
                <Sparkles className="h-3.5 w-3.5" />
                {title}
              </div>
              {showResult && <div className={clsx(
                'rounded border px-2.5 py-1 text-[10px] system-text',
                reveal.isDuplicate
                  ? 'border-purple-300/35 bg-purple-400/10 text-purple-100'
                  : reveal.isNew
                    ? 'border-emerald-300/35 bg-emerald-400/10 text-emerald-100'
                    : 'border-white/12 bg-white/8 text-white/62',
              )}>
                {resultLabel}
              </div>}
              {showResult && <div className={clsx(
                'rounded border px-2.5 py-1 text-[10px] system-text',
                apexSignal ? 'border-amber-300/45 bg-amber-400/12 text-amber-100' : (rarity === 'epic' || innateGrade === 'A') ? 'border-purple-300/35 bg-purple-400/10 text-purple-100' : (rarity === 'rare') ? 'border-teal-300/30 bg-teal-400/10 text-teal-100' : 'border-cyan-300/20 bg-cyan-400/8 text-cyan-100/70',
              )}>
                {signalLabel}
              </div>}
            </div>
            <button
              type="button"
              onClick={showResult ? onClose : completeSequence}
              className="inline-flex min-h-8 items-center gap-1 rounded border border-white/10 bg-white/5 px-2 text-[10px] system-text text-white/55 transition hover:bg-white/10 hover:text-white/80"
            >
              <FastForward className="h-3 w-3" />
              {showResult ? 'Fast Close' : 'Skip'}
            </button>
          </div>

          {!showResult ? (
            <TicketRevealSequence
              kind="shadow"
              intensity={sequenceIntensity}
              title={title}
              signalGrade={innateGrade ?? 'C'}
              shadowRarity={rarity}
              onComplete={completeSequence}
            />
          ) : (
          <>
          <div className={clsx('grid gap-4 md:items-center', apexSignal ? 'md:grid-cols-[240px_1fr]' : 'md:grid-cols-[210px_1fr]')}>
            <div className={clsx('shadow-reveal-core relative mx-auto w-full', apexSignal ? 'max-w-[260px]' : 'max-w-[230px]', !safeShadow && 'min-h-52')}>
              <div className={clsx(
                'pointer-events-none absolute rounded-full border',
                apexSignal ? 'inset-0 border-amber-200/20 shadow-[0_0_78px_rgba(245,158,11,0.28)]' : highSignal ? 'inset-3 border-purple-200/16 shadow-[0_0_58px_rgba(168,85,247,0.20)]' : 'inset-5 border-cyan-200/14 shadow-[0_0_42px_rgba(34,211,238,0.16)]',
              )} />
              <div className="pointer-events-none absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
              {safeShadow ? (
                <ShadowPortrait
                  shadow={safeShadow}
                  definition={definition}
                  size="xl"
                  active={success}
                  highlighted={highSignal}
                  evolutionReady={highSignal}
                  innateGrade={innateGrade}
                  className="summon-reveal"
                />
              ) : (
                <div className="flex h-56 items-center justify-center rounded-md border border-white/10 bg-ink-900/70">
                  <div className="text-center">
                    <div className={clsx('mx-auto mb-3 h-20 w-20 rounded-full border', success ? 'border-cyan-200/35 shadow-glow' : 'border-slate-200/20')} />
                    <div className="system-text text-lg tracking-[0.35em] text-white/38">???</div>
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 text-center md:text-left">
              <div className={clsx('system-text text-[10px]', success ? 'text-cyan-200/70' : 'text-slate-200/60')}>
                {success ? 'RESONANCE CONFIRMED' : 'TRACE LOST'}
              </div>
              <h3 className={clsx('mt-2 font-black leading-tight text-white', apexSignal ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl')}>
                {safeShadow ? safeShadow.name : reveal.ticketLabel ?? (success ? '그림자 신호 감지' : '잔상이 흩어진다')}
              </h3>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[10px] system-text md:justify-start">
                <span className={clsx('rounded border px-2 py-1', rarityBadge[rarity])}>{SHADOW_RARITY_LABEL[rarity]}</span>
                {innateGrade && <span className={clsx('rounded border px-2 py-1', innateFrame[innateGrade])}>{SHADOW_INNATE_GRADE_LABEL[innateGrade]}</span>}
                {safeShadow && <span className="rounded border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-cyan-100">{SHADOW_ROLE_LABEL[safeShadow.role]}</span>}
                {named && <span className="rounded border border-amber-300/35 bg-amber-300/10 px-2 py-1 text-amber-100">NAMED</span>}
                {reveal.isNew && <span className="rounded border border-emerald-300/35 bg-emerald-300/10 px-2 py-1 text-emerald-100">NEW</span>}
                {reveal.isDuplicate && <span className="rounded border border-purple-300/35 bg-purple-300/10 px-2 py-1 text-purple-100">DUPLICATE</span>}
                {innateGrade === 'S' && <span className="rounded border border-amber-200/45 bg-amber-300/12 px-2 py-1 text-amber-100">S INNATE</span>}
              </div>
              {safeShadow && (() => {
                const effects = getShadowEffects(safeShadow).slice(0, 6)
                if (effects.length === 0) return null
                return (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {effects.map((eff, i) => (
                      <span key={i} className="rounded border border-white/12 bg-white/5 px-2 py-0.5 text-[10px] system-text text-white/70">
                        {formatShadowEffect(eff)}
                      </span>
                    ))}
                  </div>
                )
              })()}
              <p className="mt-4 text-sm font-semibold leading-relaxed text-white/82">{headline}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/50">{detail}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mx-auto mt-5 flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-5 text-xs font-bold text-white transition hover:bg-white/15"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </button>
          </>
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}
