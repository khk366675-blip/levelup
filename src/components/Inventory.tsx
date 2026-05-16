import { motion } from 'framer-motion'
import { useGame } from '../lib/store'
import { RARITY_META, EQUIPMENT_SLOT_LABEL, CATEGORY_META, type Item, type EquipmentSlot, type ActiveConsumableEffect } from '../lib/types'
import { SKILL_DEFINITIONS } from '../lib/seed'
import {
  canEnhanceItem,
  formatEnhancementLabel,
  formatStatReward,
  getEnhancedItemEffects,
  getEnhanceMaterialCandidates,
  getEnhancementLevel,
  isEnhanceableEquipment,
  MAX_ITEM_ENHANCEMENT_LEVEL,
} from '../lib/game'
import { Package, Sword, Shield, Gem, Scroll, X, Sparkles } from 'lucide-react'

const SLOT_ICONS: Record<EquipmentSlot, typeof Sword> = {
  weapon: Sword,
  armor: Shield,
  accessory: Gem,
  artifact: Scroll,
}

function formatItemEffects(item: Item): string[] {
  const effects = getEnhancedItemEffects(item)
  if (effects.length === 0) return []
  
  return effects.map(effect => {
    switch (effect.type) {
      case 'xp_bonus':
        const categoryLabel = effect.category ? CATEGORY_META[effect.category]?.label || effect.category : '전체'
        return `${categoryLabel} XP +${Math.round(effect.value * 100)}%`
      case 'drop_bonus':
        return `드롭률 +${Math.round(effect.value * 100)}%`
      case 'rarity_bonus':
        return `레어리티 +${Math.round(effect.value * 100)}%`
      case 'stat_bonus':
        return `${effect.stat} ${formatStatReward(effect.value)}`
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
    .map(id => SKILL_DEFINITIONS.find(skill => skill.id === id)?.name)
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

export function Inventory() {
  const items = useGame(s => s.items)
  const equipment = useGame(s => s.equipment)
  const activeConsumableEffects = useGame(s => s.activeConsumableEffects)
  const equipItem = useGame(s => s.equipItem)
  const unequipItem = useGame(s => s.unequipItem)
  const enhanceItem = useGame(s => s.enhanceItem)
  const useConsumable = useGame(s => s.useConsumable)

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
                      {effect.sourceItemName}
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
            
            return (
              <div
                key={slot}
                className="panel corner-bracket p-3 bg-ink-900/50 border-cyan-400/20"
              >
                <div className="br" />
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-cyan-300/70" />
                  <div className="text-xs system-text text-cyan-300/70">
                    {EQUIPMENT_SLOT_LABEL[slot]}
                  </div>
                </div>
                
                {equippedItem ? (
                  <div>
                    <div className="text-2xl text-center mb-1">{equippedItem.icon}</div>
                    <div className={`text-xs font-semibold text-center ${RARITY_META[equippedItem.rarity].color}`}>
                      {equippedItem.name}
                      {formatEnhancementLabel(equippedItem) && (
                        <span className="ml-1 text-amber-300">{formatEnhancementLabel(equippedItem)}</span>
                      )}
                    </div>
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
                    <button
                      onClick={() => unequipItem(slot)}
                      className="w-full mt-2 text-[10px] py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 transition flex items-center justify-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      해제
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-white/30 text-xs">
                    비어 있음
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Item Grid */}
      <div>
        <div className="system-text text-[11px] text-cyan-400/70 mb-3">
          ── 보유 아이템 ({items.length}개) ──
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
            const enhanceable = isEnhanceableEquipment(item)
            const enhanceMaterials = getEnhanceMaterialCandidates(item, items, equippedItemIds)
            const canEnhance = canEnhanceItem(item, items, equippedItemIds)
            const enhanceDisabledReason =
              isConsumable ? '소모품은 강화 불가' :
              !enhanceable ? '강화 불가' :
              enhancementLevel >= MAX_ITEM_ENHANCEMENT_LEVEL ? '최대 강화' :
              enhanceMaterials.length === 0 ? '중복 장비 필요' :
              ''
            const handleEnhance = () => {
              if (!canEnhance) return
              const ok = window.confirm('같은 장비 1개를 소모해 이 장비를 +1 강화합니다. 계속할까요?')
              if (ok) enhanceItem(item.id)
            }
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -3 }}
                className={`relative bg-ink-800/60 border ${equipped ? 'border-amber-400/60 ring-2 ring-amber-400/40' : 'border-white/10'} ring-1 ${meta.ring} rounded-lg p-4 backdrop-blur-sm`}
              >
                <div className="text-4xl text-center mb-2">{item.icon}</div>
                <div className={`text-center text-sm font-semibold ${meta.color}`}>
                  {item.name}
                  {enhancementLabel && <span className="ml-1 text-amber-300">{enhancementLabel}</span>}
                </div>
                <div className="text-center text-[10px] system-text mt-0.5 uppercase tracking-wider opacity-70">
                  <span className={meta.color}>[{meta.label}]</span>
                  {item.slot && (
                    <span className="ml-1 text-cyan-300/60">· {EQUIPMENT_SLOT_LABEL[item.slot]}</span>
                  )}
                  {isConsumable && (
                    <span className="ml-1 text-purple-300/60">· 소모품</span>
                  )}
                </div>
                
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
                
                <div className="text-xs text-white/50 text-center mt-2 leading-snug">{item.description}</div>

                <div className="mt-3 rounded-md border border-white/10 bg-white/5 p-2">
                  <div className="flex items-center justify-between gap-2 text-[10px] system-text">
                    <span className="text-amber-200/70">강화 {enhancementLevel}/{MAX_ITEM_ENHANCEMENT_LEVEL}</span>
                    <span className="text-white/40">재료 {enhanceMaterials.length}</span>
                  </div>
                  <button
                    onClick={handleEnhance}
                    disabled={!canEnhance}
                    className="w-full mt-1.5 text-[10px] py-1 rounded bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 border border-amber-400/30 transition disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-amber-400/15"
                    title={canEnhance ? '중복 장비 1개를 소모해 +1 강화' : enhanceDisabledReason}
                  >
                    {canEnhance ? '강화' : enhanceDisabledReason}
                  </button>
                </div>
                
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
    </div>
  )
}
