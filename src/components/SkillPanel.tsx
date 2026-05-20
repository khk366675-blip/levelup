import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Info, Sword } from 'lucide-react'
import clsx from 'clsx'
import { useGame } from '../lib/store'
import { SKILL_DEFINITIONS } from '../lib/seed'
import {
  getAvailableSkills,
  getEquippedSkillItems,
  getNextMasteryUseTarget,
  getSkillEffectiveDescription,
  getSkillMastery,
  getSkillMasteryProgress,
  getSkillProviderItem,
} from '../lib/skills'
import { SkillActionCard, getSkillSourceMeta, getSkillTypeMeta, skillSourceSortRank, skillTypeSortRank } from './SkillActionCard'

export function SkillPanel() {
  const hunter = useGame(s => s.hunter)
  const items = useGame(s => s.items)
  const equipment = useGame(s => s.equipment)
  const titles = useGame(s => s.titles)
  const skillStates = useGame(s => s.skillStates ?? {})
  const [expanded, setExpanded] = useState(true)
  const [selectedSkillId, setSelectedSkillId] = useState<string | undefined>()

  const equippedItems = useMemo(() => getEquippedSkillItems(items, equipment), [items, equipment])
  const skills = useMemo(
    () => [...getAvailableSkills({ hunter, items, equipment, titles, allSkills: SKILL_DEFINITIONS })]
      .sort((a, b) =>
        skillSourceSortRank(a) - skillSourceSortRank(b) ||
        skillTypeSortRank(a) - skillTypeSortRank(b) ||
        a.name.localeCompare(b.name, 'ko')
      ),
    [hunter, items, equipment, titles]
  )
  const selectedSkill = useMemo(
    () => skills.find(skill => skill.id === selectedSkillId) ?? skills[0],
    [selectedSkillId, skills],
  )
  const selectedRuntime = selectedSkill ? getSkillMastery(skillStates, selectedSkill.id) : undefined
  const selectedProgress = selectedRuntime ? getSkillMasteryProgress(selectedRuntime) : undefined
  const selectedProvider = selectedSkill ? getSkillProviderItem(selectedSkill, equippedItems) : undefined
  const sourceCounts = useMemo(() => {
    return skills.reduce<Record<string, number>>((counts, skill) => {
      const key = getSkillSourceMeta(skill).key
      counts[key] = (counts[key] ?? 0) + 1
      return counts
    }, {})
  }, [skills])

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
          <div className="grid gap-2 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-md border border-cyan-300/18 bg-cyan-400/8 px-3 py-2 text-xs leading-relaxed text-white/62">
              헌터 스킬은 게이트와 무한의 탑 수동 전투에서 사용됩니다. 직접 사용할수록 숙련도가 쌓이고, 전투 중에는 사용 가능 스킬과 쿨다운을 먼저 보여줍니다.
            </div>
            <div className="flex flex-wrap gap-1.5 rounded-md border border-white/10 bg-ink-900/35 px-3 py-2 text-[10px] system-text text-white/50">
              {Object.entries(sourceCounts).map(([source, count]) => (
                <span key={source} className="rounded border border-white/12 bg-white/5 px-1.5 py-0.5">
                  {source} {count}
                </span>
              ))}
              <span className="rounded border border-white/12 bg-white/5 px-1.5 py-0.5">COMBAT READY</span>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {skills.map(skill => {
                const runtime = getSkillMastery(skillStates, skill.id)
                const provider = getSkillProviderItem(skill, equippedItems)
                return (
                  <SkillActionCard
                    key={skill.id}
                    skill={skill}
                    runtime={runtime}
                    providerName={provider?.name}
                    selected={selectedSkill?.id === skill.id}
                    informational
                    onClick={() => setSelectedSkillId(skill.id)}
                  />
                )
              })}
            </div>

            {selectedSkill && selectedRuntime && selectedProgress && (
              <aside className="rounded-md border border-white/12 bg-ink-950/55 p-3">
                <div className="mb-2 flex items-center gap-2 system-text text-[10px] text-cyan-100/65">
                  <Info className="h-3.5 w-3.5" />
                  SKILL DETAIL
                </div>
                <h3 className="text-base font-black text-white/92">{selectedSkill.name}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] system-text">
                  <span className={clsx('rounded border px-1.5 py-0.5', getSkillSourceMeta(selectedSkill).className)}>
                    {getSkillSourceMeta(selectedSkill).key}
                  </span>
                  <span className={clsx('rounded border px-1.5 py-0.5', getSkillTypeMeta(selectedSkill).className)}>
                    {getSkillTypeMeta(selectedSkill).key}
                  </span>
                  {selectedProvider && (
                    <span className="rounded border border-purple-300/25 bg-purple-400/10 px-1.5 py-0.5 text-purple-100">
                      {selectedProvider.name}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-white/62">
                  {getSkillEffectiveDescription(selectedSkill, selectedRuntime)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded border border-white/10 bg-white/5 px-2 py-2">
                    <div className="system-text text-[9px] text-white/35">사용 횟수</div>
                    <div className="font-semibold text-white/80">{selectedRuntime.timesUsed ?? 0}회</div>
                  </div>
                  <div className="rounded border border-white/10 bg-white/5 px-2 py-2">
                    <div className="system-text text-[9px] text-white/35">다음 숙련</div>
                    <div className="font-semibold text-white/80">
                      {getNextMasteryUseTarget(selectedRuntime.timesUsed) ?? '최대'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded border border-cyan-300/15 bg-cyan-400/8 px-2 py-2">
                  <div className="flex items-center justify-between text-[10px] system-text text-cyan-100/65">
                    <span>MASTERY Lv.{selectedProgress.level}/{selectedProgress.maxLevel}</span>
                    <span>{selectedProgress.isMaxLevel ? 'MAX' : `${selectedProgress.currentUses}/${selectedProgress.nextLevelUses}`}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/30">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-200 transition-all"
                      style={{ width: `${selectedProgress.percent}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-[10px] text-white/42">
                    {selectedProgress.isMaxLevel
                      ? '현재 단계의 숙련이 최대입니다.'
                      : `다음 숙련까지 ${Math.max(0, (selectedProgress.nextLevelUses ?? 0) - selectedProgress.currentUses)}회 남음`}
                  </div>
                </div>
                {selectedSkill.recommendedUse && (
                  <div className="mt-3 rounded border border-emerald-300/20 bg-emerald-400/10 px-2 py-2 text-[11px] leading-relaxed text-emerald-100/75">
                    {selectedSkill.recommendedUse}
                  </div>
                )}
              </aside>
            )}
          </div>

          <div className="rounded-md border border-white/10 bg-ink-900/35 px-3 py-2 text-[11px] leading-relaxed text-white/45">
            칭호/특수 스킬 슬롯은 구조만 열어두었습니다. 실제 해금형 스킬트리와 장비 강화 연동은 이후 작업에서 확장합니다.
          </div>
        </div>
      )}
    </section>
  )
}
