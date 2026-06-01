import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Sword } from 'lucide-react'
import clsx from 'clsx'
import { useGame } from '../lib/store'
import { SKILL_DEFINITIONS } from '../lib/seed'
import {
  getAvailableSkills,
  getEquippedSkillItems,
  getSkillDefinitionSource,
  getSkillEffectiveDescription,
  getSkillMastery,
  getSkillMasteryProgress,
  getSkillProviderItem,
} from '../lib/skills'
import { SkillActionCard, getSkillSourceMeta, getSkillTypeMeta, skillSourceSortRank, skillTypeSortRank } from './SkillActionCard'
import { getAvailableUpgradesForSkill } from '../lib/skillUpgrades'
import { sanitizeRetiredTowerText } from '../lib/retiredTowerUi'

export function SkillPanel() {
  const hunter = useGame(s => s.hunter)
  const items = useGame(s => s.items)
  const equipment = useGame(s => s.equipment)
  const titles = useGame(s => s.titles)
  const skillStates = useGame(s => s.skillStates ?? {})
  const selectSkillUpgrade = useGame(s => s.selectSkillUpgrade)
  const [expanded, setExpanded] = useState(false)
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
  const combatSkillCount = useMemo(
    () => skills.filter(skill => getSkillDefinitionSource(skill) !== 'basic').length,
    [skills],
  )
  const defaultDetailSkill = useMemo(
    () => skills.find(skill => getSkillDefinitionSource(skill) !== 'basic'),
    [skills],
  )
  const selectedSkill = useMemo(
    () => skills.find(skill => skill.id === selectedSkillId && getSkillDefinitionSource(skill) !== 'basic') ?? defaultDetailSkill,
    [selectedSkillId, skills, defaultDetailSkill],
  )
  const selectedRuntime = selectedSkill ? getSkillMastery(skillStates, selectedSkill.id) : undefined
  const selectedProgress = selectedRuntime ? getSkillMasteryProgress(selectedRuntime) : undefined
  const selectedProvider = selectedSkill ? getSkillProviderItem(selectedSkill, equippedItems) : undefined

  return (
    <section className="panel corner-bracket p-4 sm:p-5 border border-cyan-400/20 bg-cyan-500/5">
      <div className="br" />
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-lg font-bold text-cyan-50">
            <Sword className="w-4 h-4 text-cyan-200" />
            스킬
            <span className="text-[11px] system-text text-white/45">{skills.length}개 · 전투용 {combatSkillCount}</span>
          </span>
          <span className="mt-1 block text-[11px] text-white/45">게이트 수동 전투에서 직접 사용</span>
        </span>
        <span className="shrink-0 rounded border border-cyan-300/25 bg-cyan-400/10 px-2 py-1 text-cyan-100">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {skills.map(skill => {
              const runtime = getSkillMastery(skillStates, skill.id)
              const provider = getSkillProviderItem(skill, equippedItems)
              return (
                <SkillActionCard
                  key={skill.id}
                  skill={skill}
                  runtime={runtime}
                  providerName={sanitizeRetiredTowerText(provider?.name)}
                  selected={selectedSkill?.id === skill.id && getSkillDefinitionSource(skill) !== 'basic'}
                  informational
                  onClick={() => setSelectedSkillId(getSkillDefinitionSource(skill) === 'basic' ? undefined : skill.id)}
                />
              )
            })}
          </div>

          {selectedSkill && selectedRuntime && selectedProgress ? (
            <aside className="rounded-md border border-cyan-300/18 bg-ink-950/55 p-3">
              <h3 className="text-base font-black text-white/92">{selectedSkill.name}</h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] system-text">
                <span className={clsx('rounded border px-1.5 py-0.5', getSkillSourceMeta(selectedSkill).className)}>
                  {getSkillSourceMeta(selectedSkill).key}
                </span>
                <span className={clsx('rounded border px-1.5 py-0.5', getSkillTypeMeta(selectedSkill).className)}>
                  {getSkillTypeMeta(selectedSkill).key}
                </span>
                {selectedProvider && (
                  <span className="rounded border border-purple-300/25 bg-purple-400/10 px-1.5 py-0.5 text-purple-100">
                    {sanitizeRetiredTowerText(selectedProvider.name)}
                  </span>
                )}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-white/65">
                {getSkillEffectiveDescription(selectedSkill, selectedRuntime)}
              </p>
              <div className="mt-3 rounded border border-cyan-300/15 bg-cyan-400/8 px-2 py-2">
                <div className="flex items-center justify-between text-[10px] system-text text-cyan-100/65">
                  <span>숙련 Lv.{selectedProgress.level}/{selectedProgress.maxLevel}</span>
                  <span>{selectedProgress.isMaxLevel ? 'MAX' : `${selectedProgress.currentXp}/${selectedProgress.nextLevelXp} XP`}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-200 transition-all"
                    style={{ width: `${selectedProgress.percent}%` }}
                  />
                </div>
              </div>

              {/* Evolution & Upgrades Area */}
              {selectedProgress.level >= 5 && (
                <div className="mt-3 border-t border-cyan-300/10 pt-3">
                  <div className="text-[11px] font-bold text-cyan-300 mb-2">스킬 강화 분기 (Lv.5 이상)</div>
                  
                  {selectedRuntime.selectedUpgradeId ? (
                    (() => {
                      const upgrades = getAvailableUpgradesForSkill(selectedSkill)
                      const activeUpgrade = upgrades.find(u => u.id === selectedRuntime.selectedUpgradeId)
                      return activeUpgrade ? (
                        <div className="rounded border border-amber-300/20 bg-amber-400/5 p-2 text-xs">
                          <div className="font-bold text-amber-200">⚔️ {activeUpgrade.name} (적용됨)</div>
                          <div className="mt-1 text-[10.5px] text-white/70 leading-relaxed">{activeUpgrade.description}</div>
                        </div>
                      ) : null
                    })()
                  ) : (
                    <div className="space-y-1.5">
                      {getAvailableUpgradesForSkill(selectedSkill).map(upgrade => (
                        <button
                          key={upgrade.id}
                          type="button"
                          onClick={() => {
                            if (window.confirm(`"${upgrade.name}" 강화를 적용하시겠습니까?\n한 번 선택하면 변경할 수 없습니다.`)) {
                              selectSkillUpgrade(selectedSkill.id, upgrade.id)
                            }
                          }}
                          className="w-full text-left rounded border border-cyan-300/20 bg-cyan-400/5 hover:bg-cyan-400/15 hover:border-cyan-300/40 p-2 transition active:scale-[0.98]"
                        >
                          <div className="text-[11px] font-bold text-cyan-200 flex items-center justify-between">
                            <span>⚡ {upgrade.name}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-100 font-normal">선택 가능</span>
                          </div>
                          <div className="mt-1 text-[10px] text-white/55 leading-relaxed">{upgrade.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Capstone Activation Indicator */}
              {selectedRuntime.isCapstoneUnlocked && (
                <div className="mt-3 rounded border border-amber-400/30 bg-amber-400/10 p-2 text-center text-xs font-black tracking-wider text-amber-200 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.12)]">
                  👑 시그니처 각성 완료 (Lv.10 Capstone)
                </div>
              )}

              {selectedSkill.recommendedUse && (
                <div className="mt-2.5 rounded border border-emerald-300/22 bg-emerald-400/8 px-2 py-2 text-[11px] leading-relaxed text-emerald-100/75">
                  {selectedSkill.recommendedUse}
                </div>
              )}
            </aside>
          ) : (
            <aside className="rounded-md border border-cyan-300/12 bg-ink-900/35 p-3 text-[11px] leading-relaxed text-white/45">
              직업·장비·칭호 스킬을 얻으면 여기에서 상세 정보를 확인할 수 있습니다.
            </aside>
          )}
        </div>
      )}
    </section>
  )
}
