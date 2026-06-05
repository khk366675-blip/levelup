import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../lib/store'
import { RARITY_META, EQUIPMENT_SLOT_LABEL, CATEGORY_META, type Item, type EquipmentSlot, type ActiveConsumableEffect, type RuneItem } from '../lib/types'
import { SKILL_DEFINITIONS } from '../lib/seed'
import {
  canEnhanceItem,
  canEnhanceItemWithGold,
  getGoldEnhancementCost,
  getGoldEnhancementSuccessRate,
  formatEquipmentStars,
  formatEnhancementLabel,
  formatStatReward,
  getEnhancedItemEffects,
  getEnhanceMaterialCandidates,
  getEnhancementLevel,
  getEquipmentStars,
  isEnhanceableEquipment,
  MAX_ITEM_ENHANCEMENT_LEVEL,
} from '../lib/game'
import { compareEquipmentForSlot, getEquipmentPowerBreakdown } from '../lib/equipmentPower'
import { getItemDisplayDescription, getItemDisplayName, sanitizeRetiredTowerText } from '../lib/retiredTowerUi'
import { Package, Sword, Shield, Gem, Scroll, X, Sparkles } from 'lucide-react'
import {
  getRuneDescription,
  getItemRuneSlotsCount,
  getRuneGoldEnhancementCost,
  getRuneGoldEnhancementSuccessRate,
  getRuneValue,
} from '../lib/runes'
import mutationMaterialNormalImg from '../assets/tickets/pack-shadow-shards.png'
import mutationMaterialAdvancedImg from '../assets/tickets/pack-shadow-premium-shards.png'
import mutationMaterialSupremeImg from '../assets/tickets/pack-shadow-premium-shards.png'

const SLOT_ICONS: Record<EquipmentSlot, typeof Sword> = {
  weapon: Sword,
  armor: Shield,
  accessory: Gem,
  artifact: Scroll,
}

const comparisonTone: Record<ReturnType<typeof compareEquipmentForSlot>['verdict'], string> = {
  better: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100',
  sidegrade: 'border-cyan-300/20 bg-cyan-400/8 text-cyan-100/80',
  situational: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  weaker: 'border-white/10 bg-white/5 text-white/50',
}

const formatPercentVal = (val: number): string => {
  const percent = val * 100
  const rounded = Math.round(percent * 10) / 10
  return `${rounded}%`
}

function formatItemEffects(item: Item): string[] {
  const effects = getEnhancedItemEffects(item)
  if (effects.length === 0) return []
  
  return effects.map(effect => {
    switch (effect.type) {
      case 'xp_bonus':
        const categoryLabel = effect.category ? CATEGORY_META[effect.category]?.label || effect.category : '전체'
        return `${categoryLabel} XP +${formatPercentVal(effect.value)}`
      case 'drop_bonus':
        return `드롭률 +${formatPercentVal(effect.value)}`
      case 'rarity_bonus':
        return `레어리티 +${formatPercentVal(effect.value)}`
      case 'stat_bonus':
        return `${effect.stat} ${formatStatReward(effect.value)}`
      case 'crit_bonus':
        return `크리티컬 +${formatPercentVal(effect.value)}`
      case 'evasion_bonus':
        return `회피율 +${formatPercentVal(effect.value)}`
      case 'accuracy_bonus':
        return `명중률 +${formatPercentVal(effect.value)}`
      default:
        return ''
    }
  }).filter(Boolean)
}

function formatConsumableEffects(item: Item): string[] {
  if (!item.consumableEffects || item.consumableEffects.length === 0) return []
  
  return item.consumableEffects.map(effect => {
    switch (effect.type) {
      case 'instant_xp':
        return `즉시 XP +${effect.value}`
      case 'next_quest_xp_bonus':
        return `다음 퀘스트 XP +${Math.round(effect.value * 100)}%`
      case 'next_category_xp_bonus':
        const categoryLabel = effect.category ? CATEGORY_META[effect.category]?.label || effect.category : '전체'
        return `다음 ${categoryLabel} XP +${Math.round(effect.value * 100)}%`
      case 'temporary_drop_bonus':
        return `드롭률 +${Math.round(effect.value * 100)}%`
      case 'temporary_rarity_bonus':
        return `레어리티 +${Math.round(effect.value * 100)}%`
      case 'temporary_stat_bonus':
        return `${effect.stat} ${formatStatReward(effect.value)}`
      case 'gate_penalty_reduction':
        return `다음 게이트 패널티 -${Math.round(effect.value * 100)}%`
      case 'gate_success_bonus':
        return `게이트 전투 보조 +${Math.round(effect.value * 100)}%`
      default:
        return ''
    }
  }).filter(Boolean)
}

function formatCombatSkillNames(item: Item): string[] {
  return (item.combatSkillIds ?? [])
    .map(id => {
      const skill = SKILL_DEFINITIONS.find(s => s.id === id)
      if (!skill) return undefined
      const summary = skill.effectSummary ? ` (${skill.effectSummary})` : ''
      return `${skill.name}${summary}`
    })
    .filter((name): name is string => Boolean(name))
}

function formatActiveEffectSummary(effect: ActiveConsumableEffect): string {
  switch (effect.type) {
    case 'instant_xp':
      return `즉시 XP +${effect.value}`
    case 'next_quest_xp_bonus':
      return `다음 퀘스트 XP +${Math.round(effect.value * 100)}%`
    case 'next_category_xp_bonus':
      const categoryLabel = effect.category ? CATEGORY_META[effect.category]?.label || effect.category : '전체'
      return `다음 ${categoryLabel} XP +${Math.round(effect.value * 100)}%`
    case 'temporary_drop_bonus':
      return `드롭률 +${Math.round(effect.value * 100)}%`
    case 'temporary_rarity_bonus':
      return `레어리티 +${Math.round(effect.value * 100)}%`
    case 'temporary_stat_bonus':
      return `${effect.stat} ${formatStatReward(effect.value)}`
    case 'gate_penalty_reduction':
      return `다음 게이트 패널티 -${Math.round(effect.value * 100)}%`
    case 'gate_success_bonus':
      return `게이트 전투 보조 +${Math.round(effect.value * 100)}%`
    default:
      return '알 수 없는 효과'
  }
}

function formatDuration(duration?: 'next_quest' | 'today' | 'next_gate'): string {
  switch (duration) {
    case 'next_quest':
      return '다음 퀘스트'
    case 'today':
      return '오늘'
    case 'next_gate':
      return '다음 게이트'
    default:
      return '영구'
  }
}

function RuneEquipSelector({ targetId, targetType, slotIdx }: { targetId: string, targetType: 'shadow' | 'equipment', slotIdx: number }) {
  const runes = useGame(s => s.runes ?? [])
  const equipRune = useGame(s => s.equipRune)
  const availableRunes = runes.filter(r => r.type === targetType)

  if (availableRunes.length === 0) {
    return <span className="text-white/30 text-[9px] block text-center py-0.5 font-medium">장착 가능 룬 없음</span>
  }

  return (
    <select
      value=""
      onChange={(e) => {
        const val = e.target.value
        if (val) {
          equipRune(val, targetId, targetType, slotIdx)
        }
      }}
      className="bg-slate-900 border border-white/10 text-white/70 text-[9px] rounded px-1.5 py-0.5 outline-none max-w-[130px] font-bold"
    >
      <option value="" disabled>+ 룬 장착</option>
      {availableRunes.map(r => (
        <option key={r.id} value={r.id}>
          {r.icon} {r.name} {r.enhancementLevel > 0 ? `+${r.enhancementLevel}` : ''} ({getRuneDescription(r)})
        </option>
      ))}
    </select>
  )
}

export function Inventory() {
  const items = useGame(s => s.items)
  const equipment = useGame(s => s.equipment)
  const activeConsumableEffects = useGame(s => s.activeConsumableEffects)
  const equipItem = useGame(s => s.equipItem)
  const unequipItem = useGame(s => s.unequipItem)
  const enhanceItem = useGame(s => s.enhanceItem)
  const enhanceItemWithGold = useGame(s => s.enhanceItemWithGold)
  const gold = useGame(s => s.gold)
  const useConsumable = useGame(s => s.useConsumable)

  const runes = useGame(s => s.runes ?? [])
  const unequipRune = useGame(s => s.unequipRune)
  const enhanceRuneWithGold = useGame(s => s.enhanceRuneWithGold)
  
  const mutationMaterialNormal = useGame(s => s.mutationMaterialNormal ?? 0)
  const mutationMaterialAdvanced = useGame(s => s.mutationMaterialAdvanced ?? 0)
  const mutationMaterialSupreme = useGame(s => s.mutationMaterialSupreme ?? 0)

  const [inventoryTab, setInventoryTab] = useState<'items' | 'runes' | 'rune-enhance'>('items')
  const [selectedEnhanceRuneId, setSelectedEnhanceRuneId] = useState<string | null>(null)
  
  const [enhancingRuneId, setEnhancingRuneId] = useState<string | null>(null)
  const [runeEnhancePhase, setRuneEnhancePhase] = useState<'none' | 'tension' | 'success' | 'failure'>('none')
  const [runeEnhanceResult, setRuneEnhanceResult] = useState<{
    success: boolean
    greatSuccess: boolean
    prevLevel: number
    nextLevel: number
    cost: number
    runeIcon: string
    runeName: string
  } | null>(null)

  const [enhancingItemId, setEnhancingItemId] = useState<string | null>(null)
  const [animationPhase, setAnimationPhase] = useState<'none' | 'tension' | 'success' | 'failure'>('none')
  const [animationResult, setAnimationResult] = useState<{
    success: boolean
    greatSuccess: boolean
    prevLevel: number
    nextLevel: number
    cost?: number
    type: 'gold' | 'synth'
    itemIcon: string
    itemName: string
    prevEffects: string[]
    nextEffects: string[]
  } | null>(null)

  // Equipment slots section
  const slots: EquipmentSlot[] = ['weapon', 'armor', 'accessory', 'artifact']

  // Check if item is equipped
  const isEquipped = (itemId: string) => {
    return Object.values(equipment).includes(itemId)
  }

  const equippedItemIds = new Set(Object.values(equipment).filter((id): id is string => Boolean(id)))

  // Get equipped item for a slot
  const getEquippedItem = (slot: EquipmentSlot) => {
    const itemId = equipment[slot]
    return itemId ? items.find(i => i.id === itemId) : undefined
  }

  if (items.length === 0) {
    return (
      <div className="panel corner-bracket p-12 text-center">
        <div className="br" />
        <div className="text-6xl mb-3 opacity-30">📦</div>
        <div className="text-cyan-300/60 system-text text-sm">인벤토리가 비어있습니다</div>
        <div className="text-white/40 text-xs mt-1">퀘스트를 완료하여 아이템을 획득하세요</div>
      </div>
    )
  }

  // group by rarity desc
  const order = ['legendary', 'epic', 'rare', 'uncommon', 'common'] as const
  const sorted = [...items].sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity))

  return (
    <div className="space-y-6">
      {/* Active Consumable Effects */}
      {activeConsumableEffects.length > 0 && (
        <div className="panel corner-bracket p-4 bg-purple-500/5 border-purple-400/30">
          <div className="br" />
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-300" />
            <div className="system-text text-[11px] text-purple-300">
              ── 활성 소모품 효과 ──
            </div>
          </div>
          <div className="space-y-2">
            {activeConsumableEffects.map(effect => (
              <div
                key={effect.id}
                className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-purple-200">
                      {sanitizeRetiredTowerText(effect.sourceItemName)}
                    </div>
                    <div className="text-xs text-purple-300/80 mt-1">
                      {formatActiveEffectSummary(effect)}
                    </div>
                    <div className="text-[10px] text-purple-300/50 system-text mt-1">
                      {formatDuration(effect.duration)}
                      {effect.consumed && <span className="ml-2 text-amber-300">(소진됨)</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Slots */}
      <div className="panel corner-bracket p-4">
        <div className="br" />
        <div className="system-text text-[11px] text-cyan-400/70 mb-3">
          ── 장착 장비 ──
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {slots.map(slot => {
            const Icon = SLOT_ICONS[slot]
            const equippedItem = getEquippedItem(slot)
            const equippedCombatSkills = equippedItem ? formatCombatSkillNames(equippedItem) : []
            const slotRarityClass = equippedItem ? `rarity-frame-${equippedItem.rarity}` : ''
            const equippedPower = equippedItem ? getEquipmentPowerBreakdown(equippedItem) : undefined

            return (
              <div
                key={slot}
                className={`panel corner-bracket p-3 bg-ink-900/50 border-cyan-400/20 ${slotRarityClass} transition-all`}
              >
                <div className="br" />
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${equippedItem ? RARITY_META[equippedItem.rarity].color : 'text-cyan-300/50'}`} />
                  <div className="text-xs system-text text-cyan-300/65">
                    {EQUIPMENT_SLOT_LABEL[slot]}
                  </div>
                </div>

                {equippedItem ? (
                  <div>
                    <div className="text-2xl text-center mb-1">{equippedItem.icon}</div>
                    <div className={`text-xs font-semibold text-center leading-snug ${RARITY_META[equippedItem.rarity].color}`}>
                      {getItemDisplayName(equippedItem)}
                    </div>
                    <div className="mt-0.5 text-center text-[10px] font-bold text-yellow-200/80">
                      {formatEquipmentStars(equippedItem)}
                      {formatEnhancementLabel(equippedItem) && (
                        <span className="ml-1 text-amber-300">{formatEnhancementLabel(equippedItem)}</span>
                      )}
                    </div>
                    {equippedPower && (
                      <div className="mt-1.5 rounded border border-white/10 bg-black/18 px-2 py-1 text-center">
                        <div className="text-[9px] system-text text-white/35">{equippedPower.slotRoleLabel}</div>
                        <div className="text-[10px] font-bold tabular-nums text-white/70">VALUE {equippedPower.totalEquipmentValue}</div>
                        <div className="mt-1 flex flex-wrap justify-center gap-1">
                          {equippedPower.topTags.slice(0, 2).map(tag => (
                            <span key={tag} className="rounded border border-cyan-300/15 bg-cyan-300/8 px-1.5 py-0.5 text-[8px] system-text text-cyan-100/60">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {equippedItem.effects && equippedItem.effects.length > 0 && (
                      <div className="text-[9px] text-purple-300/60 system-text mt-1 text-center">
                        {formatItemEffects(equippedItem).slice(0, 2).join(', ')}
                      </div>
                    )}
                    {equippedCombatSkills.length > 0 && (
                      <div className="text-[9px] text-amber-300/70 system-text mt-1 text-center">
                        전투 스킬: {equippedCombatSkills.join(', ')}
                      </div>
                    )}

                    {/* 룬 소켓 목록 */}
                    {(() => {
                      const maxSlots = getItemRuneSlotsCount(equippedItem)
                      return (
                        <div className="mt-2 border-t border-white/5 pt-1.5 space-y-1">
                          <div className="text-[9px] system-text text-rose-300 font-bold text-center">
                            🔮 룬 소켓 ({maxSlots}개)
                          </div>
                          <div className="space-y-1">
                            {Array.from({ length: maxSlots }).map((_, slotIdx) => {
                              const rune = equippedItem.runeSlots?.[slotIdx]
                              return (
                                <div key={slotIdx} className="flex items-center justify-between bg-black/40 rounded px-1.5 py-0.5 text-[9px] border border-white/5">
                                  {rune ? (
                                    <>
                                      <span className="truncate text-white/80 max-w-[100px] font-bold" title={getRuneDescription(rune)}>
                                        {rune.icon} {rune.name}
                                      </span>
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`[${rune.name}]을 해제하시겠습니까?`)) {
                                            unequipRune(equippedItem.id, 'equipment', slotIdx)
                                          }
                                        }}
                                        className="text-[8px] text-rose-400 hover:text-rose-300 font-bold shrink-0 ml-1"
                                      >
                                        해제
                                      </button>
                                    </>
                                  ) : (
                                    <RuneEquipSelector targetId={equippedItem.id} targetType="equipment" slotIdx={slotIdx} />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}

                    <button
                      onClick={() => unequipItem(slot)}
                      className="w-full mt-2 text-[10px] py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 transition flex items-center justify-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      해제
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-white/20 text-[10px] system-text">
                    EMPTY
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Inventory Tabs */}
      <div>
        <div className="flex border-b border-white/10 mb-4 gap-2 overflow-x-auto">
          <button
            onClick={() => setInventoryTab('items')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
              inventoryTab === 'items'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            📦 보유 아이템 ({items.length}개)
          </button>
          <button
            onClick={() => setInventoryTab('runes')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
              inventoryTab === 'runes'
                ? 'border-rose-400 text-rose-300'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            🔮 보유 룬 ({runes.length}개)
          </button>
          <button
            onClick={() => setInventoryTab('rune-enhance')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
              inventoryTab === 'rune-enhance'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            🔥 룬 강화 제단
          </button>
        </div>

        {inventoryTab === 'items' && (
          <div>
            {/* Mutation Materials HUD */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="panel bg-purple-950/20 border border-purple-500/20 rounded-lg p-2.5 flex items-center gap-3">
                <img src={mutationMaterialNormalImg} className="w-8 h-8 object-contain" alt="" />
                <div>
                  <div className="text-[10px] text-white/40">일반 변이 촉매</div>
                  <div className="text-xs font-bold text-white">{mutationMaterialNormal}개</div>
                </div>
              </div>
              <div className="panel bg-purple-950/20 border border-purple-500/20 rounded-lg p-2.5 flex items-center gap-3">
                <img src={mutationMaterialAdvancedImg} className="w-8 h-8 object-contain" alt="" />
                <div>
                  <div className="text-[10px] text-purple-300/60 font-semibold">고급 변이 촉매</div>
                  <div className="text-xs font-bold text-purple-200">{mutationMaterialAdvanced}개</div>
                </div>
              </div>
              <div className="panel bg-purple-950/20 border border-purple-500/20 rounded-lg p-2.5 flex items-center gap-3">
                <img src={mutationMaterialSupremeImg} className="w-8 h-8 object-contain" alt="" />
                <div>
                  <div className="text-[10px] text-amber-300/60 font-semibold">최고급 변이 촉매</div>
                  <div className="text-xs font-bold text-amber-200">{mutationMaterialSupreme}개</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sorted.map((item, i) => {
            const meta = RARITY_META[item.rarity]
            const equipped = isEquipped(item.id)
            const canEquip = item.equippable === true && item.slot
            const isConsumable = item.consumable === true
            const effects = formatItemEffects(item)
            const consumableEffects = formatConsumableEffects(item)
            const combatSkillNames = formatCombatSkillNames(item)
            const enhancementLevel = getEnhancementLevel(item)
            const enhancementLabel = formatEnhancementLabel(item)
            const equipmentStars = getEquipmentStars(item)
            const equipmentPower = canEquip ? getEquipmentPowerBreakdown(item) : undefined
            const currentSlotItem = item.slot ? getEquippedItem(item.slot) : undefined
            const equipmentComparison = canEquip && !equipped ? compareEquipmentForSlot(item, currentSlotItem) : undefined
            const enhanceable = isEnhanceableEquipment(item)
            const enhanceMaterials = getEnhanceMaterialCandidates(item, items, equippedItemIds)
            const canEnhance = canEnhanceItem(item, items, equippedItemIds)
            const enhanceDisabledReason =
              isConsumable ? '소모품은 강화 불가' :
              !enhanceable ? '강화 불가' :
              enhanceMaterials.length === 0 ? '중복 장비 필요' :
              ''
            const handleEnhance = () => {
              if (!canEnhance) return
              const ok = window.confirm('같은 장비 1개를 소모해 이 장비를 +1 강화합니다. 계속할까요?')
              if (!ok) return
              
              setEnhancingItemId(item.id)
              setAnimationPhase('tension')
              
              setTimeout(() => {
                const res = enhanceItem(item.id)
                if (res) {
                  const afterItem = { ...item, enhancementLevel: res.nextLevel }
                  setAnimationResult({
                    success: res.success,
                    greatSuccess: res.greatSuccess,
                    prevLevel: res.prevLevel,
                    nextLevel: res.nextLevel,
                    type: 'synth',
                    itemIcon: item.icon,
                    itemName: item.name,
                    prevEffects: formatItemEffects(item),
                    nextEffects: formatItemEffects(afterItem)
                  })
                  setAnimationPhase(res.success ? 'success' : 'failure')
                } else {
                  setEnhancingItemId(null)
                  setAnimationPhase('none')
                }
              }, 800)
            }
            
            const goldCost = getGoldEnhancementCost(item)
            const successRate = getGoldEnhancementSuccessRate(item)
            const successRatePct = Math.round(successRate * 100)
            const canGoldEnhance = canEnhanceItemWithGold(item, gold ?? 0)
            const goldEnhanceDisabledReason =
              isConsumable ? '소모품 강화 불가' :
              !enhanceable ? '강화 불가' :
              (gold ?? 0) < goldCost ? '골드 부족' :
              ''
            const handleGoldEnhance = () => {
              if (!canGoldEnhance) return
              const ok = window.confirm(`${goldCost.toLocaleString()} 골드를 소모해 ${successRatePct}% 확률로 +1 강화에 도전하시겠습니까?`)
              if (!ok) return
              
              setEnhancingItemId(item.id)
              setAnimationPhase('tension')
              
              setTimeout(() => {
                const res = enhanceItemWithGold(item.id)
                if (res) {
                  const afterItem = { ...item, enhancementLevel: res.nextLevel }
                  setAnimationResult({
                    success: res.success,
                    greatSuccess: res.greatSuccess,
                    prevLevel: res.prevLevel,
                    nextLevel: res.nextLevel,
                    cost: res.cost,
                    type: 'gold',
                    itemIcon: item.icon,
                    itemName: item.name,
                    prevEffects: formatItemEffects(item),
                    nextEffects: formatItemEffects(afterItem)
                  })
                  setAnimationPhase(res.success ? 'success' : 'failure')
                } else {
                  setEnhancingItemId(null)
                  setAnimationPhase('none')
                }
              }, 800)
            }

            const nextLevelItem = (item.equippable && !item.consumable)
              ? { ...item, enhancementLevel: enhancementLevel + 1 }
              : null
            const nextEffects = nextLevelItem ? formatItemEffects(nextLevelItem) : []
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -3 }}
                className={[
                  'relative bg-ink-800/60 border rounded-lg p-4 backdrop-blur-sm transition-all',
                  equipped ? 'border-amber-400/60 ring-2 ring-amber-400/40' : `border-white/10 ring-1 ${meta.ring}`,
                  item.equippable && !item.consumable ? `rarity-frame-${item.rarity}` : '',
                  (item.equippable && !item.consumable && enhancementLevel >= 10) ? 'ring-4 ring-orange-500/80 border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.5)]' :
                  (item.equippable && !item.consumable && enhancementLevel >= 5) ? 'ring-2 ring-yellow-400/50 border-yellow-400/70 shadow-[0_0_15px_rgba(245,158,11,0.25)]' :
                  (item.equippable && !item.consumable && enhancementLevel >= 3) ? 'enhancement-glow' : '',
                  item.rarity === 'legendary' && 'boss-glow',
                ].filter(Boolean).join(' ')}
              >
                <div className="text-4xl text-center mb-2">{item.icon}</div>
                <div className={`text-center text-sm font-semibold ${meta.color}`}>
                  {getItemDisplayName(item)}
                  {enhancementLabel && (
                    <span className={[
                      'ml-1 font-bold',
                      enhancementLevel >= 10 ? 'text-orange-400 font-black drop-shadow-[0_0_10px_rgba(249,115,22,0.9)] animate-pulse' :
                      enhancementLevel >= 5 ? 'text-yellow-400 font-extrabold drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse' : 'text-amber-300'
                    ].filter(Boolean).join(' ')}>{enhancementLabel}</span>
                  )}
                  {item.equippable && !item.consumable && <span className="ml-1 text-yellow-200">{formatEquipmentStars(item)}</span>}
                </div>
                <div className="text-center text-[10px] system-text mt-0.5 uppercase tracking-wider opacity-70">
                  <span className={meta.color}>[{meta.label}]</span>
                  {item.slot && (
                    <span className="ml-1 text-cyan-300/60">· {EQUIPMENT_SLOT_LABEL[item.slot]}</span>
                  )}
                  {isConsumable && (
                    <span className="ml-1 text-purple-300/60">· 소모품</span>
                  )}
                  {item.equippable && !item.consumable && (
                    <span className="ml-1 text-yellow-300/70">· {equipmentStars}성</span>
                  )}
                </div>

                {equipmentPower && (
                  <div className="mt-2 rounded border border-white/10 bg-black/18 p-2">
                    <div className="flex items-center justify-between gap-2 text-[10px] system-text">
                      <span className="text-cyan-100/60">{equipmentPower.slotRoleLabel}</span>
                      <span className="font-bold tabular-nums text-white/70">VALUE {equipmentPower.totalEquipmentValue}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                      {equipmentPower.topTags.slice(0, 2).map(tag => (
                        <span key={tag} className="rounded border border-cyan-300/15 bg-cyan-300/8 px-1.5 py-0.5 text-[8px] system-text text-cyan-100/65">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {effects.length > 0 && (
                  <div className="text-[9px] text-purple-300/70 system-text mt-2 text-center space-y-0.5">
                    {effects.map((eff, idx) => (
                      <div key={idx}>{eff}</div>
                    ))}
                  </div>
                )}
                
                {consumableEffects.length > 0 && (
                  <div className="text-[9px] text-purple-300/70 system-text mt-2 text-center space-y-0.5">
                    {consumableEffects.map((eff, idx) => (
                      <div key={idx}>{eff}</div>
                    ))}
                  </div>
                )}

                {combatSkillNames.length > 0 && (
                  <div className="text-[9px] text-amber-300/75 system-text mt-2 text-center space-y-0.5">
                    <div>전투 스킬: {combatSkillNames.join(', ')}</div>
                  </div>
                )}
                
                <div className="text-xs text-white/50 text-center mt-2 leading-snug">{getItemDisplayDescription(item)}</div>

                {equipmentComparison && (
                  <div
                    className={`mt-2 rounded border px-2 py-1.5 text-[10px] leading-relaxed ${comparisonTone[equipmentComparison.verdict]}`}
                    title={`${equipmentComparison.keyReason} ${equipmentComparison.recommendation}`}
                  >
                    <div className="flex items-center justify-between gap-2 system-text">
                      <span>{equipmentComparison.label}</span>
                      <span>{equipmentComparison.totalDelta >= 0 ? '+' : ''}{equipmentComparison.totalDelta}</span>
                    </div>
                    <div className="mt-0.5 text-white/55">{equipmentComparison.recommendation}</div>
                  </div>
                )}

                {enhanceable && (
                  <div className="mt-3 rounded-md border border-white/10 bg-white/5 p-2 text-left">
                    <div className="flex items-center justify-between gap-2 text-[10px] system-text border-b border-white/5 pb-1 mb-1.5">
                      <span className="text-amber-200/70 font-semibold">장비 강화 (+{enhancementLevel})</span>
                      <span className="text-white/40">재료 {enhanceMaterials.length}개</span>
                    </div>

                    {/* 강화 성공 시 스탯 변화 미리보기 */}
                    {nextEffects.length > 0 && (
                      <div className="mb-2.5 px-2 py-1.5 rounded bg-black/35 border border-white/5 text-[9px] system-text text-cyan-200/90">
                        <div className="text-white/35 text-[8px] mb-1 text-center">강화 성공 시 스탯 변화</div>
                        <div className="space-y-0.5">
                          {effects.map((eff, idx) => {
                            const nextEff = nextEffects[idx] || ''
                            return (
                              <div key={idx} className="flex justify-between items-center gap-2">
                                <span className="text-white/60">{eff}</span>
                                <span className="text-cyan-300 font-medium">→ {nextEff}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* 합성 강화 */}
                    <div className="space-y-1 mb-2.5">
                      <div className="flex justify-between items-center text-[9px] text-white/50">
                        <span>합성 강화 (중복 1개 소모)</span>
                        <span className={enhanceMaterials.length > 0 ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
                          보유: {enhanceMaterials.length}개
                        </span>
                      </div>
                      <button
                        onClick={handleEnhance}
                        disabled={!canEnhance}
                        className="w-full text-[10px] py-1 rounded bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 border border-amber-400/30 transition disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-amber-400/15"
                        title={canEnhance ? '중복 장비 1개를 소모해 +1 강화' : enhanceDisabledReason}
                      >
                        {canEnhance ? '합성 강화 (100% 성공)' : '재료 부족'}
                      </button>
                    </div>

                    {/* 골드 강화 */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-white/50">
                        <span>골드 강화 ({successRatePct}% 확률)</span>
                        <span className={(gold ?? 0) >= goldCost ? "text-yellow-400 font-medium" : "text-red-400 font-medium"}>
                          {goldCost.toLocaleString()} G
                        </span>
                      </div>
                      <button
                        onClick={handleGoldEnhance}
                        disabled={!canGoldEnhance}
                        className="w-full text-[10px] py-1 rounded bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-200 border border-yellow-500/30 transition disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-yellow-500/15"
                        title={canGoldEnhance ? `${goldCost.toLocaleString()} 골드 소모해 ${successRatePct}% 확률로 강화 시도` : goldEnhanceDisabledReason}
                      >
                        {(gold ?? 0) < goldCost ? '골드 부족' : '골드 강화 시도'}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="mt-3">
                  {equipped ? (
                    <div className="text-center py-1.5 rounded bg-amber-400/20 text-amber-300 text-xs font-medium border border-amber-400/40">
                      장착 중
                    </div>
                  ) : isConsumable ? (
                    <button
                      onClick={() => useConsumable(item.id)}
                      disabled={!consumableEffects.length}
                      className="w-full btn btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/40"
                    >
                      <Sparkles className="w-3 h-3" />
                      사용
                    </button>
                  ) : canEquip ? (
                    <button
                      onClick={() => equipItem(item.id)}
                      className="w-full btn btn-primary text-xs"
                    >
                      장착
                    </button>
                  ) : (
                    <div className="text-center py-1.5 rounded bg-white/5 text-white/30 text-xs">
                      장착 불가
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
      )}

      {inventoryTab === 'runes' && (
        <div>
          {runes.length === 0 ? (
            <div className="panel corner-bracket p-12 text-center">
              <div className="br" />
              <div className="text-6xl mb-3 opacity-30">🔮</div>
              <div className="text-cyan-300/60 system-text text-sm">보유 중인 룬이 없습니다</div>
              <div className="text-white/40 text-xs mt-1">상점에서 룬 상자를 보급받거나 게이트 및 원정대 보상으로 획득하세요</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {runes.map((rune) => (
                <motion.div
                  key={rune.id}
                  whileHover={{ y: -2 }}
                  className="panel corner-bracket p-3 bg-ink-800/40 border border-rose-500/15 rounded-lg flex flex-col justify-between"
                >
                  <div className="br" />
                  <div>
                    <div className="text-3xl text-center mb-1.5">{rune.icon}</div>
                    <div className="text-xs font-bold text-center text-rose-200 text-ellipsis overflow-hidden whitespace-nowrap">
                      {rune.name} {rune.enhancementLevel > 0 && `+${rune.enhancementLevel}`}
                    </div>
                    <div className="text-[10px] text-center text-white/50 mt-0.5">
                      {rune.grade.toUpperCase()} · {rune.type === 'shadow' ? '그림자룬' : '장비룬'}
                    </div>
                    <div className="text-[11px] text-center text-rose-300 font-semibold mt-2 bg-rose-950/20 border border-rose-500/10 rounded py-1 px-1.5">
                      {getRuneDescription(rune)}
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setSelectedEnhanceRuneId(rune.id)
                        setInventoryTab('rune-enhance')
                      }}
                      className="w-full py-1 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded text-[10px] font-bold text-rose-200 transition"
                    >
                      강화 제단으로 송신
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {inventoryTab === 'rune-enhance' && (
        <div>
          {(() => {
            const selectedRune = runes.find(r => r.id === selectedEnhanceRuneId)
            if (!selectedRune) {
              return (
                <div className="panel corner-bracket p-8 text-center bg-rose-950/5 border border-rose-500/15">
                  <div className="br" />
                  <div className="text-4xl mb-2">🔮</div>
                  <div className="text-sm font-semibold text-rose-300">선택된 룬이 없습니다</div>
                  <div className="text-xs text-white/40 mt-1">보유 룬 탭에서 강화를 진행할 룬을 선택해주세요.</div>
                  <button
                    onClick={() => setInventoryTab('runes')}
                    className="mt-3 btn btn-ghost text-xs border border-rose-500/30 text-rose-200 bg-rose-500/5 hover:bg-rose-500/10"
                  >
                    보유 룬 목록으로 이동
                  </button>
                </div>
              )
            }

            const cost = getRuneGoldEnhancementCost(selectedRune)
            const rate = getRuneGoldEnhancementSuccessRate(selectedRune)
            const ratePct = Math.round(rate * 100)
            const canEnhance = (gold ?? 0) >= cost && selectedRune.enhancementLevel < 5

            const nextLevelRune = { ...selectedRune, enhancementLevel: selectedRune.enhancementLevel + 1 }
            const currentDesc = getRuneDescription(selectedRune)
            const nextDesc = selectedRune.enhancementLevel < 5 ? getRuneDescription(nextLevelRune) : '최대 레벨'

            return (
              <div className="max-w-md mx-auto panel corner-bracket p-5 bg-ink-900/60 border border-rose-500/20 relative overflow-hidden">
                <div className="br" />
                <div className="text-center space-y-4">
                  <div className="inline-block px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full text-[10px] text-rose-300 font-bold uppercase tracking-wider">
                    🔮 룬 마력 제단
                  </div>

                  <div className="space-y-1">
                    <div className="text-5xl animate-pulse">{selectedRune.icon}</div>
                    <h4 className="text-base font-bold text-white mt-2">
                      {selectedRune.name} {selectedRune.enhancementLevel > 0 && `+${selectedRune.enhancementLevel}`}
                    </h4>
                    <p className="text-[10px] text-white/40">
                      {selectedRune.grade.toUpperCase()} · {selectedRune.type === 'shadow' ? '그림자룬' : '장비룬'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-black/45 border border-white/5 p-3 text-left space-y-2 font-mono">
                    <div className="text-[9px] text-white/30 text-center uppercase tracking-wider border-b border-white/5 pb-1 mb-2">효과 미리보기</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">현재 효과:</span>
                      <span className="text-white font-semibold">{currentDesc}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">강화 효과:</span>
                      <span className={selectedRune.enhancementLevel < 5 ? "text-rose-300 font-bold" : "text-white/30 font-medium"}>
                        {nextDesc}
                      </span>
                    </div>
                  </div>

                  {selectedRune.enhancementLevel < 5 ? (
                    <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                      <div className="p-2 bg-black/30 border border-white/5 rounded">
                        <div className="text-[9px] text-white/40">성공 확률</div>
                        <div className="text-sm font-bold text-rose-300 mt-0.5">{ratePct}%</div>
                      </div>
                      <div className="p-2 bg-black/30 border border-white/5 rounded">
                        <div className="text-[9px] text-white/40">필요 골드</div>
                        <div className={`text-sm font-bold mt-0.5 ${(gold ?? 0) >= cost ? "text-yellow-400" : "text-red-400"}`}>
                          {cost.toLocaleString()} G
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-bold rounded">
                      ★ 최대 강화 (+5) 상태입니다 ★
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setInventoryTab('runes')}
                      className="flex-1 py-2 rounded text-xs border border-white/10 hover:border-white/20 text-white/50 hover:text-white transition font-bold"
                    >
                      뒤로가기
                    </button>
                    {selectedRune.enhancementLevel < 5 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!canEnhance) return
                          setEnhancingRuneId(selectedRune.id)
                          setRuneEnhancePhase('tension')

                          setTimeout(() => {
                            const res = enhanceRuneWithGold(selectedRune.id)
                            if (res) {
                              setRuneEnhanceResult({
                                success: res.success,
                                greatSuccess: res.greatSuccess,
                                prevLevel: res.prevLevel,
                                nextLevel: res.nextLevel,
                                cost: res.cost,
                                runeIcon: selectedRune.icon,
                                runeName: selectedRune.name,
                              })
                              setRuneEnhancePhase(res.success ? 'success' : 'failure')
                            } else {
                              setEnhancingRuneId(null)
                              setRuneEnhancePhase('none')
                            }
                          }, 800)
                        }}
                        disabled={!canEnhance}
                        className="flex-1 py-2 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 rounded text-xs font-black transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {(gold ?? 0) < cost ? '골드 부족' : '강화 시도'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>

      {/* 강화 연출 및 결과 모달 */}
      <AnimatePresence>
        {enhancingItemId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="panel corner-bracket max-w-md w-full p-6 bg-ink-950/95 border-cyan-500/30 text-center relative overflow-hidden"
            >
              <div className="br" />
              
              {/* Tension Phase */}
              {animationPhase === 'tension' && (
                <div className="py-8 space-y-6">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    {/* Spinning outer runes / glow */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 shadow-[inset_0_0_15px_rgba(99,102,241,0.3)]"
                    />
                    {/* Converging energy waves */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <motion.div
                        animate={{ scale: [1.5, 0.8], opacity: [0, 0.8, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeIn' }}
                        className="w-16 h-16 rounded-full border border-cyan-300/30 absolute"
                      />
                    </div>
                    {/* Faded Item Icon in Center */}
                    <div className="text-4xl relative z-10 select-none filter blur-[1px] opacity-70 animate-pulse">
                      {items.find(i => i.id === enhancingItemId)?.icon || '✨'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-cyan-300 font-bold text-lg system-text animate-pulse">
                      마력 주입 중...
                    </h3>
                    <p className="text-xs text-white/50">장비의 기류를 안정시키는 중입니다.</p>
                  </div>
                </div>
              )}

              {/* Success Phase */}
              {animationPhase === 'success' && animationResult && (() => {
                const nextLvl = animationResult.nextLevel;
                const isDivine = nextLvl >= 15;
                const isEpic = nextLvl >= 10;
                const isHigh = nextLvl >= 7;
                
                let bgGradient = "bg-cyan-950/20 border-cyan-400/20";
                let radialGlow = "bg-cyan-500/10";
                let badgeClass = "bg-cyan-500/10 border-cyan-400/30 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]";
                let badgeText = "★ 강화 성공 ★";
                let levelClass = "text-amber-300";
                
                if (isDivine) {
                  bgGradient = "bg-purple-950/35 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]";
                  radialGlow = "bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 blur-3xl animate-pulse";
                  badgeClass = "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]";
                  badgeText = "👑 신화적 강화 성공! 👑";
                  levelClass = "text-purple-400 font-black drop-shadow-[0_0_20px_rgba(168,85,247,1)]";
                } else if (isEpic) {
                  bgGradient = "bg-red-950/35 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
                  radialGlow = "bg-gradient-to-r from-red-500/25 to-orange-500/25 blur-3xl";
                  badgeClass = "bg-gradient-to-r from-red-600 to-orange-600 border-orange-400/50 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]";
                  badgeText = "🔥 경이로운 강화 성공! 🔥";
                  levelClass = "text-orange-400 font-black drop-shadow-[0_0_15px_rgba(249,115,22,0.9)]";
                } else if (isHigh) {
                  bgGradient = "bg-yellow-950/20 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]";
                  radialGlow = "bg-yellow-500/15 blur-2xl";
                  badgeClass = "bg-yellow-500/20 border-yellow-400/40 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.3)]";
                  badgeText = "✦ 고급 강화 성공 ✦";
                  levelClass = "text-yellow-400 font-extrabold drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]";
                } else if (nextLvl >= 5) {
                  badgeText = "★ 강화 성공 ★";
                  levelClass = "text-yellow-300 font-semibold";
                }

                return (
                  <div className="space-y-6 relative">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1.2 }}
                      className={`absolute inset-0 pointer-events-none rounded-full ${radialGlow}`}
                      style={{ filter: 'blur(40px)', zIndex: 0 }}
                    />
                    
                    {isHigh && (
                      <>
                        <motion.div
                          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 ${isDivine ? 'border-purple-500/30' : isEpic ? 'border-red-500/30' : 'border-yellow-500/30'} pointer-events-none`}
                        />
                        {isDivine && (
                          <motion.div
                            animate={{ scale: [1, 3], opacity: [0.4, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-pink-500/20 pointer-events-none"
                          />
                        )}
                      </>
                    )}

                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="space-y-1 relative z-10"
                    >
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeClass} animate-bounce`}>
                        {badgeText}
                      </div>
                      {animationResult.greatSuccess && !isDivine && !isEpic && (
                        <div className="text-[10px] text-yellow-300 font-bold mt-1">대성공!! (+2단계 상승)</div>
                      )}
                      <h3 className="text-2xl font-black text-white mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                        {animationResult.itemName}
                      </h3>
                      <div className="text-xl font-bold text-yellow-400 flex items-center justify-center gap-2">
                        <span className="text-white/40 line-through text-sm">+{animationResult.prevLevel}</span>
                        <span>→</span>
                        <motion.span
                          animate={isHigh ? { scale: [1, 1.25, 1], filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"] } : {}}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className={levelClass}
                        >
                          +{animationResult.nextLevel}
                        </motion.span>
                      </div>
                    </motion.div>

                    <div className="relative py-4 flex flex-col items-center z-10">
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                        className={`text-6xl relative z-10 p-4 bg-white/5 border rounded-full shadow-lg ${isDivine ? 'border-purple-500/40 shadow-purple-500/20' : isEpic ? 'border-red-500/40 shadow-red-500/20' : isHigh ? 'border-yellow-500/40 shadow-yellow-500/20' : 'border-white/10'}`}
                      >
                        {animationResult.itemIcon}
                      </motion.div>
                      
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.span animate={{ y: [-20, -60], x: [-10, -20], opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} className={`absolute left-10 ${isDivine ? 'text-purple-300' : isEpic ? 'text-red-400' : 'text-yellow-300'}`}>✦</motion.span>
                        <motion.span animate={{ y: [-15, -55], x: [10, 20], opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }} transition={{ duration: 1.3, repeat: Infinity, delay: 0.3 }} className={`absolute right-10 ${isDivine ? 'text-pink-300' : isEpic ? 'text-orange-400' : 'text-yellow-400'}`}>✨</motion.span>
                        <motion.span animate={{ y: [-25, -65], opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }} transition={{ duration: 1.6, repeat: Infinity, delay: 0.5 }} className={`absolute top-0 ${isDivine ? 'text-cyan-300' : isEpic ? 'text-yellow-300' : 'text-cyan-300'}`}>✦</motion.span>
                      </div>
                    </div>

                    <div className={`rounded-lg border p-4 text-left space-y-2 relative z-10 ${bgGradient}`}>
                      <div className="text-[10px] system-text text-cyan-300/60 uppercase tracking-wider text-center border-b border-cyan-400/10 pb-1 mb-2">스탯 변동 결과</div>
                      {animationResult.prevEffects.map((eff, idx) => {
                        const nextEff = animationResult.nextEffects[idx] || ''
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-white/60">{eff}</span>
                            <span className="text-cyan-300 font-bold">→ {nextEff}</span>
                          </div>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setEnhancingItemId(null)
                        setAnimationPhase('none')
                        setAnimationResult(null)
                      }}
                      className="w-full btn btn-primary py-2.5 text-sm font-bold shadow-lg relative z-10"
                    >
                      확인
                    </button>
                  </div>
                );
              })()}

              {/* Failure Phase */}
              {animationPhase === 'failure' && animationResult && (
                <div className="space-y-6 relative">
                  <div className="absolute inset-0 pointer-events-none rounded-full bg-red-500/5 blur-3xl" style={{ zIndex: 0 }} />
                  
                  {/* Failure Indicator */}
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ x: [-12, 12, -8, 8, -4, 4, 0] }}
                    transition={{ duration: 0.4 }}
                    className="space-y-1 relative z-10"
                  >
                    <div className="inline-flex items-center gap-1 bg-red-950/60 border border-red-500/40 px-3 py-1 rounded-full text-red-400 text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                      강화 실패
                    </div>
                    <h3 className="text-xl font-bold text-white/80 mt-2">
                      {animationResult.itemName}
                    </h3>
                    <p className="text-xs text-white/40">장비 안정화 장치 작동 ── 차수가 유지됩니다.</p>
                  </motion.div>

                  {/* Faded Item Icon */}
                  <div className="relative py-2 flex flex-col items-center opacity-60 relative z-10">
                    <div className="text-6xl p-4 bg-white/5 border border-white/5 rounded-full">
                      {animationResult.itemIcon}
                    </div>
                  </div>

                  {/* Stat changes preview */}
                  <div className="rounded-lg border border-white/5 bg-white/5 p-4 text-left space-y-1 opacity-70 relative z-10">
                    <div className="text-[10px] system-text text-white/30 uppercase tracking-wider text-center border-b border-white/5 pb-1 mb-2">스탯 (변동 없음)</div>
                    {animationResult.prevEffects.map((eff, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-white/60">
                        <span>{eff}</span>
                        <span>{eff}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions: Retry & Close */}
                  <div className="flex gap-3 relative z-10">
                    <button
                      onClick={() => {
                        setEnhancingItemId(null)
                        setAnimationPhase('none')
                        setAnimationResult(null)
                      }}
                      className="flex-1 py-2 border border-white/20 hover:border-white/40 text-white/60 hover:text-white rounded text-sm transition"
                    >
                      닫기
                    </button>
                    {animationResult.type === 'gold' && (
                      <button
                        onClick={() => {
                          const targetItem = items.find(i => i.id === enhancingItemId)
                          if (targetItem && canEnhanceItemWithGold(targetItem, gold ?? 0)) {
                            setAnimationPhase('tension')
                            setAnimationResult(null)
                            setTimeout(() => {
                              const res = enhanceItemWithGold(targetItem.id)
                              if (res) {
                                const afterItem = { ...targetItem, enhancementLevel: res.nextLevel }
                                setAnimationResult({
                                  success: res.success,
                                  greatSuccess: res.greatSuccess,
                                  prevLevel: res.prevLevel,
                                  nextLevel: res.nextLevel,
                                  cost: res.cost,
                                  type: 'gold',
                                  itemIcon: targetItem.icon,
                                  itemName: targetItem.name,
                                  prevEffects: formatItemEffects(targetItem),
                                  nextEffects: formatItemEffects(afterItem)
                                })
                                setAnimationPhase(res.success ? 'success' : 'failure')
                              } else {
                                setEnhancingItemId(null)
                                setAnimationPhase('none')
                              }
                            }, 800)
                          } else {
                            setEnhancingItemId(null)
                            setAnimationPhase('none')
                            setAnimationResult(null)
                          }
                        }}
                        disabled={!(items.find(i => i.id === enhancingItemId) && canEnhanceItemWithGold(items.find(i => i.id === enhancingItemId)!, gold ?? 0))}
                        className="flex-1 py-2 bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/40 text-yellow-300 rounded text-sm font-bold transition disabled:opacity-45 disabled:cursor-not-allowed"
                      >
                        재도전
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 룬 강화 연출 및 결과 모달 */}
      <AnimatePresence>
        {enhancingRuneId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="panel corner-bracket max-w-md w-full p-6 bg-ink-950/95 border-rose-500/30 text-center relative overflow-hidden"
            >
              <div className="br" />
              
              {/* Tension Phase */}
              {runeEnhancePhase === 'tension' && (
                <div className="py-8 space-y-6">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 rounded-full border-2 border-dashed border-rose-400/60 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-2 rounded-full border border-pink-400/30 bg-rose-500/10 shadow-[inset_0_0_15px_rgba(244,63,94,0.3)]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <motion.div
                        animate={{ scale: [1.5, 0.8], opacity: [0, 0.8, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeIn' }}
                        className="w-16 h-16 rounded-full border border-rose-300/30 absolute"
                      />
                    </div>
                    <div className="text-4xl relative z-10 select-none filter blur-[1.5px] opacity-70 animate-pulse">
                      {runes.find(r => r.id === enhancingRuneId)?.icon || '🔮'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-rose-300 font-bold text-lg system-text animate-pulse">
                      룬 마력 공명 중...
                    </h3>
                    <p className="text-xs text-white/50">제단의 기류를 응집하는 중입니다.</p>
                  </div>
                </div>
              )}

              {/* Success Phase */}
              {runeEnhancePhase === 'success' && runeEnhanceResult && (() => {
                const nextLvl = runeEnhanceResult.nextLevel;
                const isMax = nextLvl >= 5;
                
                let bgGradient = "bg-rose-950/20 border-rose-400/20";
                let radialGlow = "bg-rose-500/10";
                let badgeClass = "bg-rose-500/10 border-rose-400/30 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]";
                let badgeText = "★ 룬 강화 성공 ★";
                let levelClass = "text-rose-300";
                
                if (isMax) {
                  bgGradient = "bg-purple-950/35 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]";
                  radialGlow = "bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20 blur-3xl animate-pulse";
                  badgeClass = "bg-gradient-to-r from-purple-600 to-rose-600 border-purple-400/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]";
                  badgeText = "👑 최대 각성 성공! 👑";
                  levelClass = "text-purple-400 font-black drop-shadow-[0_0_20px_rgba(168,85,247,1)]";
                }

                return (
                  <div className="space-y-6 relative">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1.2 }}
                      className={`absolute inset-0 pointer-events-none rounded-full ${radialGlow}`}
                      style={{ filter: 'blur(40px)', zIndex: 0 }}
                    />
                    
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="space-y-1 relative z-10"
                    >
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeClass} animate-bounce`}>
                        {badgeText}
                      </div>
                      {runeEnhanceResult.greatSuccess && (
                        <div className="text-[10px] text-yellow-300 font-bold mt-1">대성공!! (+2단계 상승)</div>
                      )}
                      <h3 className="text-2xl font-black text-white mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                        {runeEnhanceResult.runeName}
                      </h3>
                      <div className="text-xl font-bold text-yellow-400 flex items-center justify-center gap-2">
                        <span className="text-white/40 line-through text-sm">+{runeEnhanceResult.prevLevel}</span>
                        <span>→</span>
                        <motion.span
                          animate={isMax ? { scale: [1, 1.25, 1], filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"] } : {}}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className={levelClass}
                        >
                          +{runeEnhanceResult.nextLevel}
                        </motion.span>
                      </div>
                    </motion.div>

                    <div className="relative py-4 flex flex-col items-center z-10">
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                        className={`text-6xl relative z-10 p-4 bg-white/5 border rounded-full shadow-lg ${isMax ? 'border-purple-500/40 shadow-purple-500/20' : 'border-rose-500/40 shadow-rose-500/20'}`}
                      >
                        {runeEnhanceResult.runeIcon}
                      </motion.div>
                    </div>

                    <button
                      onClick={() => {
                        setEnhancingRuneId(null)
                        setRuneEnhancePhase('none')
                        setRuneEnhanceResult(null)
                      }}
                      className="w-full btn btn-primary py-2.5 text-sm font-bold shadow-lg relative z-10"
                    >
                      확인
                    </button>
                  </div>
                );
              })()}

              {/* Failure Phase */}
              {runeEnhancePhase === 'failure' && runeEnhanceResult && (
                <div className="space-y-6 relative">
                  <div className="absolute inset-0 pointer-events-none rounded-full bg-red-500/5 blur-3xl" style={{ zIndex: 0 }} />
                  
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ x: [-12, 12, -8, 8, -4, 4, 0] }}
                    transition={{ duration: 0.4 }}
                    className="space-y-1 relative z-10"
                  >
                    <div className="inline-flex items-center gap-1 bg-red-950/60 border border-red-500/40 px-3 py-1 rounded-full text-red-400 text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                      강화 실패
                    </div>
                    <h3 className="text-xl font-bold text-white/80 mt-2">
                      {runeEnhanceResult.runeName}
                    </h3>
                    <p className="text-xs text-white/40">룬의 공명이 흩어졌습니다 ── 강화 레벨이 유지됩니다.</p>
                  </motion.div>

                  <div className="relative py-2 flex flex-col items-center opacity-60 relative z-10">
                    <div className="text-6xl p-4 bg-white/5 border border-white/5 rounded-full">
                      {runeEnhanceResult.runeIcon}
                    </div>
                  </div>

                  <div className="flex gap-3 relative z-10">
                    <button
                      onClick={() => {
                        setEnhancingRuneId(null)
                        setRuneEnhancePhase('none')
                        setRuneEnhanceResult(null)
                      }}
                      className="flex-1 py-2 border border-white/20 hover:border-white/40 text-white/60 hover:text-white rounded text-sm transition"
                    >
                      닫기
                    </button>
                    <button
                      onClick={() => {
                        const targetRune = runes.find(r => r.id === enhancingRuneId)
                        if (targetRune && (gold ?? 0) >= getRuneGoldEnhancementCost(targetRune)) {
                          setRuneEnhancePhase('tension')
                          setRuneEnhanceResult(null)
                          setTimeout(() => {
                            const res = enhanceRuneWithGold(targetRune.id)
                            if (res) {
                              setRuneEnhanceResult({
                                success: res.success,
                                greatSuccess: res.greatSuccess,
                                prevLevel: res.prevLevel,
                                nextLevel: res.nextLevel,
                                cost: res.cost,
                                runeIcon: targetRune.icon,
                                runeName: targetRune.name,
                              })
                              setRuneEnhancePhase(res.success ? 'success' : 'failure')
                            } else {
                              setEnhancingRuneId(null)
                              setRuneEnhancePhase('none')
                            }
                          }, 800)
                        } else {
                          setEnhancingRuneId(null)
                          setRuneEnhancePhase('none')
                          setRuneEnhanceResult(null)
                        }
                      }}
                      disabled={!(runes.find(r => r.id === enhancingRuneId) && (gold ?? 0) >= getRuneGoldEnhancementCost(runes.find(r => r.id === enhancingRuneId)!))}
                      className="flex-1 py-2 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-300 rounded text-sm font-bold transition disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      재도전
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
