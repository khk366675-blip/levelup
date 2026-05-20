import clsx from 'clsx'
import { motion, useReducedMotion } from 'framer-motion'
import { FastForward, Sparkles, X } from 'lucide-react'
import { useMemo } from 'react'
import {
  SHADOW_INNATE_GRADE_LABEL,
  SHADOW_RARITY_LABEL,
  SHADOW_ROLE_LABEL,
  getShadowDefinition,
} from '../../lib/shadows'
import type { OwnedShadow, ShadowDefinition, ShadowInnateGrade, ShadowRarity } from '../../lib/types'
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

  if (!reveal) return null

  const success = reveal.success ?? Boolean(reveal.shadow)
  const rarity = reveal.shadow?.rarity ?? reveal.rarity ?? definition?.rarity ?? 'common'
  const innateGrade = reveal.shadow?.innateGrade ?? reveal.innateGrade
  const named = reveal.isNamed ?? Boolean(reveal.shadow?.isNamed || reveal.shadow?.isGateNamed || reveal.shadow?.isAchievementNamed || definition?.rank === 'named')
  const highSignal = named || rarity === 'legendary' || rarity === 'epic' || innateGrade === 'S' || innateGrade === 'A'
  const safeShadow = reveal.shadow
  const copy = sourceCopy[reveal.source]
  const title = reveal.title ?? sourceLabel[reveal.source]
  const headline = reveal.message
    ?? (success ? (reveal.isDuplicate ? copy.duplicate : copy.success) : copy.failure)
  const detail = reveal.detail ?? copy.intro
  const duration = reducedMotion || fast ? 0 : 0.22

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm">
      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration, ease: 'easeOut' }}
        className={clsx(
          'shadow-reveal-card corner-bracket relative max-h-[92vh] w-full max-w-xl overflow-hidden rounded-lg border bg-ink-950/92 p-4 sm:p-5',
          rarityFrame[rarity],
          highSignal && 'shadow-reveal-high',
          !success && 'border-slate-400/35 text-slate-100',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="br" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(96,232,255,0.14),transparent_32%),radial-gradient(circle_at_50%_64%,rgba(168,85,247,0.16),transparent_42%)]" />
        <div className={clsx('shadow-reveal-rift pointer-events-none absolute inset-x-8 top-5 h-px', success ? 'bg-cyan-200/55' : 'bg-slate-200/35')} />
        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] system-text text-white/65">
              <Sparkles className="h-3.5 w-3.5" />
              {title}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-8 items-center gap-1 rounded border border-white/10 bg-white/5 px-2 text-[10px] system-text text-white/55 transition hover:bg-white/10 hover:text-white/80"
            >
              <FastForward className="h-3 w-3" />
              Skip
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-[210px_1fr] md:items-center">
            <div className={clsx('shadow-reveal-core relative mx-auto w-full max-w-[230px]', !safeShadow && 'min-h-52')}>
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
              <h3 className="mt-1 text-2xl font-black leading-tight text-white sm:text-3xl">
                {safeShadow ? safeShadow.name : reveal.ticketLabel ?? (success ? '그림자 신호 감지' : '잔상이 흩어진다')}
              </h3>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[10px] system-text md:justify-start">
                <span className="rounded border border-white/12 bg-white/8 px-2 py-1">{SHADOW_RARITY_LABEL[rarity]}</span>
                {innateGrade && <span className="rounded border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-amber-100">{SHADOW_INNATE_GRADE_LABEL[innateGrade]}</span>}
                {safeShadow && <span className="rounded border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-cyan-100">{SHADOW_ROLE_LABEL[safeShadow.role]}</span>}
                {named && <span className="rounded border border-amber-300/35 bg-amber-300/10 px-2 py-1 text-amber-100">NAMED</span>}
                {reveal.isNew && <span className="rounded border border-emerald-300/35 bg-emerald-300/10 px-2 py-1 text-emerald-100">NEW</span>}
                {reveal.isDuplicate && <span className="rounded border border-purple-300/35 bg-purple-300/10 px-2 py-1 text-purple-100">MEMORY</span>}
              </div>
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
        </div>
      </motion.div>
    </div>
  )
}
