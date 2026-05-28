import clsx from 'clsx'
import { Compass, Eye, Search, Shield, Sparkles, Swords } from 'lucide-react'
import { SHADOW_EXPEDITION_COMMAND_LABEL } from '../../lib/shadowExpeditions'
import { SHADOW_ROLE_LABEL, getShadowDefinition } from '../../lib/shadows'
import { CinematicLogOverlay, type CinematicLogData } from '../CinematicLogOverlay'
import type {
  ExpeditionPhase,
  OwnedShadow,
  ShadowExpedition,
  ShadowExpeditionCommand,
  ShadowExpeditionOutcome,
  ShadowExpeditionType,
  ShadowRole,
} from '../../lib/types'
import { ShadowPortrait } from './ShadowPortrait'

const commandRoles: Record<ShadowExpeditionCommand, ShadowRole[]> = {
  attack: ['assault'],
  defend: ['guard', 'support'],
  scout: ['scout'],
  analyze: ['analyst', 'support'],
  search: ['hunter', 'scout'],
}

const commandIcon: Record<ShadowExpeditionCommand, typeof Swords> = {
  attack: Swords,
  defend: Shield,
  scout: Compass,
  analyze: Eye,
  search: Search,
}

const commandClass: Record<ShadowExpeditionCommand, string> = {
  attack: 'expedition-command-attack',
  defend: 'expedition-command-defend',
  scout: 'expedition-command-scout',
  analyze: 'expedition-command-analyze',
  search: 'expedition-command-search',
}

const roleAura: Record<ShadowRole, string> = {
  assault: 'from-rose-400/40 to-orange-300/5',
  guard: 'from-sky-300/40 to-blue-400/5',
  scout: 'from-teal-300/40 to-cyan-400/5',
  analyst: 'from-purple-300/40 to-fuchsia-400/5',
  support: 'from-emerald-300/35 to-cyan-300/5',
  hunter: 'from-amber-300/40 to-violet-300/5',
}

const roleFormation: Record<ShadowRole, { x: number; y: number; lane: string; anchor: string }> = {
  guard: { x: 50, y: 42, lane: 'FRONT', anchor: 'border-sky-200/35 bg-sky-300/10 text-sky-100' },
  assault: { x: 50, y: 49, lane: 'VANGUARD', anchor: 'border-rose-200/35 bg-rose-300/10 text-rose-100' },
  scout: { x: 30, y: 58, lane: 'LEFT FLANK', anchor: 'border-cyan-200/35 bg-cyan-300/10 text-cyan-100' },
  hunter: { x: 70, y: 58, lane: 'RIGHT FLANK', anchor: 'border-amber-200/35 bg-amber-300/10 text-amber-100' },
  analyst: { x: 40, y: 72, lane: 'REAR ANALYSIS', anchor: 'border-purple-200/35 bg-purple-300/10 text-purple-100' },
  support: { x: 60, y: 72, lane: 'REAR SUPPORT', anchor: 'border-emerald-200/35 bg-emerald-300/10 text-emerald-100' },
}

const phaseVisual: Record<ExpeditionPhase, { label: string; className: string; grid: string }> = {
  muster: { label: 'MUSTER', className: 'from-slate-300/8 via-white/4 to-transparent', grid: 'border-white/8' },
  deploy: { label: 'DEPLOY', className: 'from-cyan-300/12 via-blue-300/7 to-transparent', grid: 'border-cyan-200/12' },
  contact: { label: 'CONTACT', className: 'from-rose-300/12 via-orange-300/7 to-transparent', grid: 'border-rose-200/12' },
  threshold: { label: 'THRESHOLD', className: 'from-purple-300/14 via-cyan-300/8 to-transparent', grid: 'border-purple-200/14' },
  resolution: { label: 'RESOLUTION', className: 'from-emerald-300/14 via-cyan-300/7 to-transparent', grid: 'border-emerald-200/14' },
  return: { label: 'RETURN', className: 'from-amber-300/12 via-slate-200/6 to-transparent', grid: 'border-amber-200/12' },
}

const battlefieldTheme: Record<ShadowExpeditionType, { board: string; floor: string; accent: string; label: string; particles: string }> = {
  training: {
    board: 'bg-[radial-gradient(circle_at_50%_70%,rgba(59,130,246,0.2),transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.85),rgba(2,6,23,0.96))]',
    floor: 'border-blue-300/20 shadow-[0_0_36px_rgba(59,130,246,0.14)]',
    accent: 'text-blue-100',
    label: 'TRAINING GROUND',
    particles: 'bg-blue-200/55',
  },
  essence: {
    board: 'bg-[radial-gradient(circle_at_52%_38%,rgba(168,85,247,0.24),transparent_34%),linear-gradient(180deg,rgba(37,20,63,0.84),rgba(2,6,23,0.97))]',
    floor: 'border-purple-300/25 shadow-[0_0_42px_rgba(168,85,247,0.18)]',
    accent: 'text-purple-100',
    label: 'ESSENCE FIELD',
    particles: 'bg-violet-200/60',
  },
  hunt: {
    board: 'bg-[radial-gradient(circle_at_55%_36%,rgba(244,63,94,0.22),transparent_34%),linear-gradient(180deg,rgba(48,14,24,0.86),rgba(2,6,23,0.97))]',
    floor: 'border-rose-300/24 shadow-[0_0_42px_rgba(244,63,94,0.16)]',
    accent: 'text-rose-100',
    label: 'REMNANT FRONT',
    particles: 'bg-rose-200/55',
  },
  scout: {
    board: 'bg-[radial-gradient(circle_at_50%_36%,rgba(45,212,191,0.2),transparent_36%),linear-gradient(180deg,rgba(9,43,50,0.82),rgba(2,6,23,0.97))]',
    floor: 'border-teal-300/24 shadow-[0_0_40px_rgba(45,212,191,0.14)]',
    accent: 'text-teal-100',
    label: 'UNKNOWN RIFT',
    particles: 'bg-teal-200/55',
  },
}

const outcomeClass: Record<ShadowExpeditionOutcome, string> = {
  great_success: 'expedition-outcome-great',
  success: 'expedition-outcome-success',
  partial: 'expedition-outcome-partial',
  failure: 'expedition-outcome-failure',
}

type ShadowExpeditionBattlefieldProps = {
  expedition: ShadowExpedition
  selectedShadows: OwnedShadow[]
  latestCommand?: ShadowExpeditionCommand
  latestActorShadowId?: string
  progressDelta?: number
  riskDelta?: number
  outcome?: ShadowExpeditionOutcome
  cinematicLog?: CinematicLogData
  cinematicLogs?: CinematicLogData[]
  skipSignal?: number
  onCinematicComplete?: () => void
}

const barWidth = (value: number): string => `${Math.max(0, Math.min(100, value))}%`

const clampPosition = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))

const getRolePosition = (shadow: OwnedShadow, index: number, party: OwnedShadow[]) => {
  const base = roleFormation[shadow.role]
  const sameRoleIndex = party.slice(0, index).filter(item => item.role === shadow.role).length
  const sameLaneIndex = party.slice(0, index).filter(item => roleFormation[item.role].lane === base.lane).length
  const direction = sameRoleIndex % 2 === 0 ? -1 : 1
  const spread = Math.ceil(sameRoleIndex / 2) * 8
  const laneDrop = sameLaneIndex > 0 ? Math.min(8, sameLaneIndex * 4) : 0

  return {
    x: clampPosition(base.x + direction * spread, 18, 82),
    y: clampPosition(base.y + laneDrop, 33, 78),
    lane: base.lane,
    anchor: base.anchor,
    scale: shadow.role === 'guard' || shadow.role === 'assault' ? 'scale-105' : '',
  }
}

export function ShadowExpeditionBattlefield({
  expedition,
  selectedShadows,
  latestCommand,
  latestActorShadowId,
  progressDelta,
  riskDelta,
  outcome,
  cinematicLog,
  cinematicLogs,
  skipSignal,
  onCinematicComplete,
}: ShadowExpeditionBattlefieldProps) {
  const theme = battlefieldTheme[expedition.type]
  const Icon = latestCommand ? commandIcon[latestCommand] : Sparkles
  const commandMatchedRoles = latestCommand ? commandRoles[latestCommand] : []
  const currentPhase = expedition.currentPhase ?? 'muster'
  const phase = phaseVisual[currentPhase]
  const actor = latestActorShadowId ? selectedShadows.find(shadow => shadow.instanceId === latestActorShadowId) : undefined
  const riskHigh = expedition.risk >= 70
  const riskCritical = expedition.risk >= 90
  const progressReady = expedition.progress >= 100
  const outcomeTone = outcome ? outcomeClass[outcome] : undefined

  return (
    <section
      className={clsx(
        'expedition-battlefield relative isolate overflow-hidden rounded-lg border border-white/10 p-3',
        theme.board,
        riskHigh && 'expedition-battlefield-risk',
        riskCritical && 'expedition-battlefield-danger',
        progressReady && 'expedition-battlefield-victory',
        outcomeTone,
      )}
      aria-label="그림자 원정 전장"
    >
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden>
        <div className={clsx('absolute inset-0 bg-gradient-to-br', phase.className)} />
        <div className="absolute inset-x-5 top-7 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        <div className="absolute inset-x-8 top-12 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className={clsx('absolute inset-x-[16%] bottom-[18%] h-[34%] rounded-[50%] border bg-ink-950/25 blur-[0.2px]', phase.grid)} />
        <div className={clsx('absolute inset-x-[20%] bottom-[19%] h-[28%] rounded-[50%] border', theme.floor)} />
        <div className="absolute left-1/2 top-[56%] h-[72%] w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="absolute left-[17%] right-[17%] top-[58%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute left-1/2 top-[58%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 opacity-60" />
        <div className="absolute left-1/2 top-[58%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-md border border-white/8 opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.035)_50%,transparent_100%)] expedition-bf-scan" />
        {[0, 1, 2, 3, 4, 5].map(index => (
          <span
            key={index}
            className={clsx('absolute h-1 w-1 rounded-full shadow-[0_0_12px_currentColor] expedition-bf-particle', theme.particles)}
            style={{
              left: `${18 + index * 12}%`,
              top: `${26 + (index % 3) * 16}%`,
              animationDelay: `${index * 0.28}s`,
            }}
          />
        ))}
      </div>
      <CinematicLogOverlay
        log={cinematicLog}
        logs={cinematicLogs}
        visible={Boolean(cinematicLog || cinematicLogs?.length)}
        intervalMs={2600}
        skipSignal={skipSignal}
        onComplete={onCinematicComplete}
        position="battlefield"
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <div className={clsx('system-text text-[10px]', theme.accent)}>{theme.label}</div>
          <div className="text-xs text-white/45">
            TURN {expedition.turn} / {expedition.maxTurns} · {phase.label}
          </div>
        </div>
        <div className={clsx(
          'inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] system-text',
          latestCommand ? 'border-white/15 bg-white/10 text-white/75' : 'border-white/10 bg-ink-950/35 text-white/35',
        )}>
          <Icon className="h-3.5 w-3.5" />
          {latestCommand ? SHADOW_EXPEDITION_COMMAND_LABEL[latestCommand] : '대기'}
        </div>
      </div>

      {actor && (
        <div className="relative z-10 mt-2 flex items-center gap-2 rounded-md border border-amber-300/20 bg-amber-300/10 px-2 py-1.5">
          <div className="h-8 w-8 shrink-0">
            <ShadowPortrait shadow={actor} definition={getShadowDefinition(actor.definitionId)} size="xs" active highlighted innateGrade={actor.innateGrade} />
          </div>
          <div className="min-w-0">
            <div className="system-text text-[9px] text-amber-100/60">ACTIVE ACTOR</div>
            <div className="truncate text-xs font-bold text-amber-50">
              {actor.name} <span className="font-normal text-white/45">/ {SHADOW_ROLE_LABEL[actor.role]}</span>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 mt-2 h-60 sm:h-64">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {latestCommand && <CommandVfx command={latestCommand} searchStacks={expedition.searchStacks ?? 0} />}
          {typeof progressDelta === 'number' && (
            <div className="expedition-bf-float absolute left-[58%] top-[16%] rounded border border-emerald-300/30 bg-emerald-400/15 px-2 py-1 text-[10px] system-text text-emerald-100">
              진행도 +{progressDelta}
            </div>
          )}
          {typeof riskDelta === 'number' && (
            <div className={clsx(
              'expedition-bf-float absolute right-[10%] top-[29%] rounded border px-2 py-1 text-[10px] system-text',
              riskDelta > 0
                ? 'border-rose-300/30 bg-rose-400/15 text-rose-100'
                : 'border-sky-300/30 bg-sky-400/15 text-sky-100',
            )}>
              위험도 {riskDelta > 0 ? '+' : ''}{riskDelta}
            </div>
          )}
        </div>

        {selectedShadows.length === 0 ? (
          <div className="absolute inset-x-4 top-[38%] rounded-md border border-dashed border-white/10 bg-ink-950/30 p-5 text-center text-sm text-white/40">
            전장에 배치할 그림자를 선택하세요.
          </div>
        ) : (
          selectedShadows.slice(0, 5).map((shadow, index) => {
            const definition = getShadowDefinition(shadow.definitionId)
            const position = getRolePosition(shadow, index, selectedShadows.slice(0, 5))
            const isActor = latestActorShadowId === shadow.instanceId
            const commandMatch = commandMatchedRoles.includes(shadow.role)
            const isNamed = Boolean(shadow.isNamed || shadow.isGateNamed || shadow.isAchievementNamed)
            const isHighGrade = shadow.innateGrade === 'S' || shadow.innateGrade === 'A'
            const isEvolved = Boolean(shadow.evolvedFromDefinitionId || shadow.evolutionStage)
            return (
              <div
                key={shadow.instanceId}
                className="absolute w-[86px] -translate-x-1/2 -translate-y-1/2 sm:w-[96px]"
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
              >
                <div
                  className={clsx(
                    'relative transition-transform duration-300',
                    position.scale,
                    commandMatch && latestCommand && commandClass[latestCommand],
                    isActor && 'expedition-unit-acting z-20',
                  )}
                >
                  <div className={clsx('absolute inset-x-1 bottom-1 h-12 rounded-full bg-gradient-to-t blur-xl shadow-deployed-glow', roleAura[shadow.role], (commandMatch || isActor || isHighGrade || isNamed) && 'opacity-100', !(commandMatch || isActor || isHighGrade || isNamed) && 'opacity-55')} />
                  {(isHighGrade || isNamed || isEvolved) && (
                    <div className={clsx(
                      'pointer-events-none absolute -inset-2 rounded-full border shadow-[0_0_22px_currentColor] transition-all duration-300',
                      isNamed ? 'border-amber-200/45 text-amber-200/30 named-pulse' : isEvolved ? 'border-emerald-200/40 text-emerald-200/25 shadow-evolved-card' : 'border-cyan-200/40 text-cyan-200/25',
                      shadow.innateGrade === 'S' && 'grade-aura-s ring-1 ring-amber-300/30',
                      shadow.innateGrade === 'A' && 'grade-aura-a ring-1 ring-slate-300/30',
                    )} />
                  )}
                  {isActor && (
                    <div className="absolute -right-1 -top-1 z-20 rounded border border-amber-200/50 bg-amber-300/20 px-1.5 py-0.5 text-[8px] system-text text-amber-100">
                      ACTING
                    </div>
                  )}
                  {commandMatch && latestCommand === 'defend' && (
                    <div className="pointer-events-none absolute -inset-1 z-10 rounded-full border border-sky-200/35 shadow-[0_0_22px_rgba(125,211,252,0.28)]" />
                  )}
                  {commandMatch && latestCommand === 'analyze' && (
                    <div className="pointer-events-none absolute -inset-2 z-10 rotate-45 rounded-md border border-purple-200/35 shadow-[0_0_20px_rgba(168,85,247,0.24)]" />
                  )}
                  {(shadow.isNamed || shadow.isGateNamed || shadow.isAchievementNamed) && !isActor && (
                    <div className="absolute -left-1 -top-1 z-20 rounded border border-amber-300/50 bg-amber-300/20 px-1 py-px text-[7px] system-text text-amber-100">
                      {shadow.isAchievementNamed ? 'ACH' : 'NAMED'}
                    </div>
                  )}
                  {shadow.innateGrade === 'S' && (
                    <div className="absolute -right-1 -top-1 z-20 rounded border border-amber-200/55 bg-amber-300/22 px-1 py-px text-[7px] system-text font-bold text-amber-100">
                      S
                    </div>
                  )}
                  <ShadowPortrait
                    shadow={shadow}
                    definition={definition}
                    size="md"
                    active={isActor}
                    highlighted={isActor || commandMatch || isNamed || isHighGrade || isEvolved}
                    innateGrade={shadow.innateGrade}
                    className="relative z-10"
                  />
                  <div className="relative z-10 mt-1 rounded border border-white/10 bg-ink-950/70 px-1.5 py-1 text-center">
                    <div className="truncate text-[10px] font-semibold text-white/80">{shadow.name}</div>
                    <div className="system-text text-[8px] text-white/40">
                      Lv {shadow.level ?? 1}
                      {(shadow.enhancementLevel ?? 0) > 0 ? ` +${shadow.enhancementLevel}` : ''} / {SHADOW_ROLE_LABEL[shadow.role]}
                    </div>
                    <div className={clsx('mt-1 rounded border px-1 py-px text-[7px] system-text', position.anchor)}>
                      {position.lane}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="relative z-10 grid gap-2 sm:grid-cols-2">
        <BattleMiniBar label="PROGRESS" value={expedition.progress} kind="progress" />
        <BattleMiniBar label="RISK" value={expedition.risk} kind="risk" />
      </div>
    </section>
  )
}

function CommandVfx({ command, searchStacks }: { command: ShadowExpeditionCommand; searchStacks: number }) {
  if (command === 'attack') {
    return (
      <>
        <div className="expedition-vfx-slash absolute left-[16%] top-[34%] h-1 w-[70%] rotate-[-18deg] rounded-full bg-gradient-to-r from-transparent via-rose-100/80 to-transparent" />
        <div className="expedition-vfx-slash expedition-vfx-delay absolute left-[24%] top-[54%] h-0.5 w-[46%] rotate-[19deg] rounded-full bg-gradient-to-r from-transparent via-orange-200/70 to-transparent" />
      </>
    )
  }
  if (command === 'defend') {
    return (
      <div className="expedition-vfx-shield absolute left-1/2 top-[55%] h-36 w-56 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-sky-100/35 bg-sky-300/5 shadow-[inset_0_0_34px_rgba(125,211,252,0.16),0_0_26px_rgba(125,211,252,0.16)]" />
    )
  }
  if (command === 'scout') {
    return (
      <>
        <div className="expedition-vfx-scan absolute inset-y-8 left-[18%] w-px bg-cyan-100/60 shadow-[0_0_18px_rgba(34,211,238,0.5)]" />
        <div className="expedition-vfx-scan expedition-vfx-delay absolute inset-x-[12%] top-[36%] h-px bg-teal-100/45 shadow-[0_0_18px_rgba(45,212,191,0.45)]" />
      </>
    )
  }
  if (command === 'analyze') {
    return (
      <>
        <div className="expedition-vfx-rune absolute left-1/2 top-[48%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-md border border-purple-100/35" />
        <div className="absolute left-1/2 top-[48%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-100/70 shadow-[0_0_22px_rgba(217,70,239,0.75)]" />
      </>
    )
  }
  return (
    <>
      {[0, 1, 2, 3, 4].map(index => (
        <span
          key={index}
          className="expedition-vfx-spark absolute h-1.5 w-1.5 rounded-full bg-amber-100/85 shadow-[0_0_16px_rgba(251,191,36,0.85)]"
          style={{
            left: `${28 + index * 10}%`,
            top: `${28 + (index % 2) * 28}%`,
            animationDelay: `${index * 0.12}s`,
          }}
        />
      ))}
      {searchStacks > 0 && (
        <div className="absolute bottom-[16%] right-[18%] rounded border border-amber-200/30 bg-amber-300/15 px-2 py-1 text-[10px] system-text text-amber-100">
          정수 x{searchStacks}
        </div>
      )}
    </>
  )
}

function BattleMiniBar({ label, value, kind }: { label: string; value: number; kind: 'progress' | 'risk' }) {
  const nearComplete = kind === 'progress' && value >= 85
  const critical = kind === 'risk' && value >= 90
  return (
    <div className={clsx(
      'rounded-md border p-2 transition-all',
      kind === 'risk' && critical ? 'border-rose-400/30 bg-rose-950/40' : 'border-white/10 bg-ink-950/45',
    )}>
      <div className="mb-1 flex justify-between text-[9px] system-text">
        <span className={clsx(
          kind === 'progress' ? 'text-cyan-200/65' : critical ? 'text-rose-200/75' : 'text-white/45',
        )}>{label}</span>
        <span className={clsx(
          kind === 'risk' && value >= 70 ? 'text-rose-200/70' : 'text-white/45',
          'font-bold',
        )}>{value}/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            kind === 'progress'
              ? nearComplete
                ? 'mastery-bar-fill'
                : 'bg-gradient-to-r from-cyan-300 to-emerald-300'
              : value >= 90
                ? 'bg-gradient-to-r from-orange-300 to-rose-500'
                : value >= 70
                  ? 'bg-gradient-to-r from-yellow-300 to-orange-400'
                  : 'bg-gradient-to-r from-slate-300 to-sky-300',
          )}
          style={{ width: barWidth(value) }}
        />
      </div>
    </div>
  )
}
