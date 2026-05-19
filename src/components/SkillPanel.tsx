import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles, Sword, TimerReset } from 'lucide-react'
import clsx from 'clsx'
import { useGame } from '../lib/store'
import { SKILL_DEFINITIONS } from '../lib/seed'
import {
  getAvailableSkills,
  getEquippedSkillItems,
  getNextMasteryUseTarget,
  getSkillCooldownTurns,
  getSkillEffectiveDescription,
  getSkillMastery,
  getSkillProviderItem,
  getSkillSourceLabel,
  getSkillTypeLabel,
} from '../lib/skills'

const sourceTone: Record<string, string> = {
  기본: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
  직업: 'border-amber-300/30 bg-amber-400/10 text-amber-100',
  장비: 'border-purple-300/30 bg-purple-400/10 text-purple-100',
  칭호: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  특수: 'border-rose-300/30 bg-rose-400/10 text-rose-100',
  몬스터: 'border-white/10 bg-white/5 text-white/60',
}

const skillTypeBadgeClass = (type: string): string => {
  if (type.includes('피해') || type.includes('damage') || type.includes('공격')) return 'skill-badge-damage'
  if (type.includes('방어') || type.includes('defense') || type.includes('shield')) return 'skill-badge-defense'
  if (type.includes('버프') || type.includes('buff') || type.includes('강화')) return 'skill-badge-buff'
  if (type.includes('디버프') || type.includes('debuff') || type.includes('약화')) return 'skill-badge-debuff'
  if (type.includes('회복') || type.includes('heal')) return 'skill-badge-heal'
  return 'skill-badge-utility'
}

const skillTypeGlyph = (type: string): string => {
  if (type.includes('피해') || type.includes('damage') || type.includes('공격')) return '⚡'
  if (type.includes('방어') || type.includes('defense') || type.includes('shield')) return '🛡'
  if (type.includes('버프') || type.includes('buff') || type.includes('강화')) return '↑'
  if (type.includes('디버프') || type.includes('debuff') || type.includes('약화')) return '↓'
  if (type.includes('회복') || type.includes('heal')) return '✦'
  return '◈'
}

export function SkillPanel() {
  const hunter = useGame(s => s.hunter)
  const items = useGame(s => s.items)
  const equipment = useGame(s => s.equipment)
  const titles = useGame(s => s.titles)
  const skillStates = useGame(s => s.skillStates ?? {})
  const [expanded, setExpanded] = useState(true)

  const equippedItems = useMemo(() => getEquippedSkillItems(items, equipment), [items, equipment])
  const skills = useMemo(
    () => getAvailableSkills({ hunter, items, equipment, titles, allSkills: SKILL_DEFINITIONS }),
    [hunter, items, equipment, titles]
  )

  return (
    <section className="panel corner-bracket p-4 sm:p-5 border border-cyan-400/20 bg-cyan-500/5">
      <div className="br" />
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="system-text text-[11px] text-cyan-300/75">HUNTER SKILLS</span>
          <span className="mt-1 flex items-center gap-2 text-lg font-bold text-cyan-50">
            <Sword className="w-4 h-4 text-cyan-200" />
            스킬
            <span className="text-[11px] system-text text-white/45">{skills.length}개 보유</span>
          </span>
        </span>
        <span className="shrink-0 rounded border border-cyan-300/25 bg-cyan-400/10 px-2 py-1 text-cyan-100">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="text-xs leading-relaxed text-white/55">
            헌터 스킬은 게이트와 무한의 탑 수동 전투에서 사용됩니다. 그림자 원정 명령과는 별도로 관리됩니다.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {skills.map(skill => {
              const source = getSkillSourceLabel(skill)
              const runtime = getSkillMastery(skillStates, skill.id)
              const nextTarget = getNextMasteryUseTarget(runtime.timesUsed)
              const provider = getSkillProviderItem(skill, equippedItems)
              const progress = nextTarget
                ? `${runtime.timesUsed ?? 0}/${nextTarget}`
                : `${runtime.timesUsed ?? 0}회`

              const typeLabel = getSkillTypeLabel(skill)
              const typeBadge = skillTypeBadgeClass(typeLabel)
              const typeGlyph = skillTypeGlyph(typeLabel)
              const masteryPct = Math.min(100, ((runtime.masteryLevel ?? 0) / 5) * 100)
              const cdTurns = getSkillCooldownTurns(skill)

              return (
                <div
                  key={skill.id}
                  className="rounded-md border border-white/12 bg-ink-900/50 px-3 py-3 transition-colors hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] system-text text-white/35">{typeGlyph}</span>
                        <h3 className="text-sm font-semibold text-white truncate">{skill.name}</h3>
                        <span className={clsx('text-[9px] system-text rounded border px-1.5 py-0.5', sourceTone[source] ?? sourceTone['기본'])}>
                          {source}
                        </span>
                        <span className={clsx('text-[9px] system-text rounded border px-1.5 py-0.5', typeBadge)}>
                          {typeLabel}
                        </span>
                      </div>
                      {provider && (
                        <div className="mt-1 text-[10px] text-purple-200/65">
                          제공 장비: {provider.name}
                        </div>
                      )}
                    </div>
                    <span className={clsx(
                      'shrink-0 inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] system-text',
                      cdTurns === 0
                        ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
                        : cdTurns <= 2
                          ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100'
                          : 'border-white/12 bg-white/5 text-white/55',
                    )}>
                      <TimerReset className="w-3 h-3" />
                      {cdTurns === 0 ? '즉시' : `CD ${cdTurns}턴`}
                    </span>
                  </div>

                  <p className="mt-2 min-h-8 text-xs leading-relaxed text-white/60">
                    {getSkillEffectiveDescription(skill, runtime)}
                  </p>

                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] system-text">
                      <span className="inline-flex items-center gap-1 rounded border border-amber-300/22 bg-amber-400/10 px-2 py-1 text-amber-100/80">
                        <Sparkles className="w-3 h-3" />
                        숙련 Lv.{runtime.masteryLevel ?? 0}
                      </span>
                      <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-white/40">
                        {progress}
                      </span>
                      {skill.recommendedUse && (
                        <span className="rounded border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-emerald-100/65">
                          {skill.recommendedUse}
                        </span>
                      )}
                    </div>
                    {masteryPct > 0 && (
                      <div className="h-1 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full mastery-bar-fill transition-all"
                          style={{ width: `${masteryPct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="rounded-md border border-white/10 bg-ink-900/35 px-3 py-2 text-[11px] leading-relaxed text-white/45">
            칭호/특수 스킬 슬롯은 구조만 열어두었습니다. 실제 해금형 스킬트리와 장비 강화 연동은 이후 작업에서 확장합니다.
          </div>
        </div>
      )}
    </section>
  )
}
