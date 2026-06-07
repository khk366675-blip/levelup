import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import effectPhysicalSlash from '../../assets/effects/effect-physical-slash.png'
import effectPhysicalStrike from '../../assets/effects/effect-physical-strike.png'
import effectPhysicalPierce from '../../assets/effects/effect-physical-pierce.png'
import effectFireSlash from '../../assets/effects/effect-fire-slash.png'
import effectFireStrike from '../../assets/effects/effect-fire-strike.png'
import effectFireBurst from '../../assets/effects/effect-fire-burst.png'
import effectIceStrike from '../../assets/effects/effect-ice-strike.png'
import effectIceBurst from '../../assets/effects/effect-ice-burst.png'
import effectIcePierce from '../../assets/effects/effect-ice-pierce.png'
import effectLightningSlash from '../../assets/effects/effect-lightning-slash.png'
import effectLightningStrike from '../../assets/effects/effect-lightning-strike.png'
import effectLightningBurst from '../../assets/effects/effect-lightning-burst.png'
import effectDarkSlash from '../../assets/effects/effect-dark-slash.png'
import effectDarkBurst from '../../assets/effects/effect-dark-burst.png'
import effectDarkAura from '../../assets/effects/effect-dark-aura.png'
import effectHolyAura from '../../assets/effects/effect-holy-aura.png'
import effectHolyHeal from '../../assets/effects/effect-holy-heal.png'
import effectHolyStrike from '../../assets/effects/effect-holy-strike.png'
import effectSpaceBurst from '../../assets/effects/effect-space-burst.png'
import effectSpaceStrike from '../../assets/effects/effect-space-strike.png'

export type VfxType = 'attack' | 'skill' | 'magic' | 'shadow' | 'curse' | 'heal' | 'guard'

interface BattlefieldVfx {
  id: string
  type: VfxType
  targetX?: number // Coordinate offsets
  targetY?: number
  actorRole?: string // Acting actor's job/role
  isBoss?: boolean   // Acting actor's boss status
  actionId?: string  // [NEW] Unique action ID for mapping
  actionText?: string // [NEW] Display text of the action
}

type Props = {
  vfxs: BattlefieldVfx[]
}

const VFX_IMAGES: Record<string, string> = {
  'physical-slash': effectPhysicalSlash,
  'physical-strike': effectPhysicalStrike,
  'physical-pierce': effectPhysicalPierce,
  'fire-slash': effectFireSlash,
  'fire-strike': effectFireStrike,
  'fire-burst': effectFireBurst,
  'ice-strike': effectIceStrike,
  'ice-burst': effectIceBurst,
  'ice-pierce': effectIcePierce,
  'lightning-slash': effectLightningSlash,
  'lightning-strike': effectLightningStrike,
  'lightning-burst': effectLightningBurst,
  'dark-slash': effectDarkSlash,
  'dark-burst': effectDarkBurst,
  'dark-aura': effectDarkAura,
  'holy-aura': effectHolyAura,
  'holy-heal': effectHolyHeal,
  'holy-strike': effectHolyStrike,
  'space-burst': effectSpaceBurst,
  'space-strike': effectSpaceStrike,
}

const VFX_MAPPING: Record<string, string> = {
  // 기본 액션
  'basic-guard-stance': 'holy-aura',
  'wait': 'physical-strike',

  // 헌터 직업 스킬 (V2)
  'skill-swordsman-slash': 'physical-slash',
  'skill-warrior-strike': 'physical-strike',
  'skill-mage-burst': 'lightning-burst',
  'skill-guardian-shield': 'holy-aura',
  'skill-scout-strike': 'physical-pierce',
  'skill-tactician-analyze': 'space-strike',
  'skill-swordsmaster-dual': 'physical-slash',
  'skill-spellsword-infusion': 'space-burst',
  'skill-berserker-rage': 'fire-burst',
  'skill-paladin-heal': 'holy-heal',
  'skill-chrono-haste': 'space-burst',
  'skill-alchemist-flask': 'fire-burst',
  'skill-abyss-assassinate': 'dark-slash',
  'skill-strategist-formation': 'space-burst',
  'skill-swordsaint-absolute': 'physical-slash',
  'skill-illusory-strike': 'space-strike',
  'skill-speed-strike': 'physical-slash',
  'skill-runesword-blast': 'lightning-burst',
  'skill-abyss-infusion': 'dark-burst',
  'skill-elemental-burst': 'fire-burst',
  'skill-dragon-roar': 'fire-burst',
  'skill-immortal-spirit': 'holy-aura',
  'skill-hellfire-slash': 'fire-slash',
  'skill-divine-sanctuary': 'holy-aura',
  'skill-holy-redemption': 'holy-heal',
  'skill-infinity-mage-rift': 'space-burst',
  'skill-shadow-assassinate': 'dark-slash',

  // 그림자 스킬 (shadowSkills.ts)
  'assault-rift-cleave': 'space-strike',
  'assault-quick-slash': 'physical-slash',
  'assault-execution-mark': 'dark-slash',
  'assault-burst-drive': 'physical-strike',
  'guard-shadow-barrier': 'dark-aura',
  'guard-intercept-step': 'physical-strike',
  'guard-counter-stance': 'physical-strike',
  'guard-last-line': 'holy-aura',
  'hunter-wounded-chase': 'physical-pierce',
  'hunter-prey-mark-basic': 'dark-aura',
  'hunter-chain-hit': 'lightning-strike',
  'hunter-prey-lock': 'dark-aura',
  'scout-opening-mark': 'space-burst',
  'scout-quick-scan': 'space-burst',
  'scout-evasion-down': 'dark-aura',
  'scout-intent-read': 'space-strike',
  'support-mending-pulse': 'holy-heal',
  'support-stabilizing-aura': 'holy-aura',
  'support-cooldown-thread': 'space-burst',
  'support-legion-buff': 'holy-aura',
  'analyst-weakness-expose': 'space-burst',
  'analyst-defense-index': 'space-burst',
  'analyst-boss-suppression': 'dark-aura',
  'analyst-defense-debuff': 'space-burst',

  // 몬스터 스킬 (seed.ts)
  'monster-bite': 'physical-strike',
  'monster-lazy-curse': 'dark-aura',
  'monster-rift-scratch': 'space-strike',
  'monster-memory-fog': 'dark-aura',
  'monster-drifting-sting': 'physical-pierce',
  'monster-sloth-hook': 'dark-aura',
  'monster-procrastination-chain': 'dark-aura',
  'monster-anxiety-spike': 'physical-pierce',
  'monster-rationalize-haze': 'dark-aura',
  'monster-compromise-shell': 'holy-aura',
  'monster-dread-gaze': 'dark-aura',
  'monster-despair-crush': 'physical-strike',
  'monster-obsession-pierce': 'physical-pierce',
  'monster-frost-fetter': 'ice-strike',
  'monster-ember-brand': 'fire-strike',
  'monster-storm-lunge': 'lightning-strike',
  'monster-void-blur': 'dark-aura',
  
  // 장비 스킬
  'equip-shadow-slash': 'dark-slash',
}

function resolveVfxImage(vfx: BattlefieldVfx): { image: string; motionType: 'slash' | 'strike' | 'pierce' | 'burst' | 'aura' | 'heal'; element: string } {
  let matchedType = ''

  // 1. ID 매핑 테이블 조회
  if (vfx.actionId && VFX_MAPPING[vfx.actionId]) {
    matchedType = VFX_MAPPING[vfx.actionId]
  }

  // 2. 자동 속성/모션 매칭 알고리즘 (Fallback Tag Inference)
  if (!matchedType) {
    let element = 'physical'
    let motion: 'slash' | 'strike' | 'pierce' | 'burst' | 'aura' | 'heal' = 'strike'

    const text = (vfx.actionText || '').toLowerCase()
    const id = (vfx.actionId || '').toLowerCase()
    const role = (vfx.actorRole || '').toLowerCase()

    const isBasicAttack = id === 'basic' || id === 'basic-attack' || text.includes('기본 공격') || text.includes('기본공격')

    // 2.1 속성(Element) 판별
    if (isBasicAttack) {
      element = 'physical'
    } else if (text.includes('화염') || text.includes('불') || text.includes('폭주') || text.includes('연옥') || id.includes('fire') || id.includes('burn') || id.includes('ember') || id.includes('berserker') || id.includes('slayer')) {
      element = 'fire'
    } else if (text.includes('빙결') || text.includes('서리') || text.includes('냉기') || id.includes('ice') || id.includes('frost') || id.includes('freeze')) {
      element = 'ice'
    } else if (text.includes('뇌전') || text.includes('번개') || text.includes('벼락') || id.includes('lightning') || id.includes('thunder') || id.includes('volt') || id.includes('electric') || id.includes('arcane')) {
      element = 'lightning'
    } else if (text.includes('어둠') || text.includes('그림자') || text.includes('심연') || text.includes('공허') || text.includes('나태') || text.includes('망각') || text.includes('불안') || text.includes('공포') || text.includes('절망') || text.includes('집착') || id.includes('dark') || id.includes('shadow') || id.includes('abyss') || id.includes('void') || id.includes('curse') || role.includes('shadow') || role.includes('curse')) {
      element = 'dark'
    } else if (text.includes('신성') || text.includes('빛') || text.includes('성역') || text.includes('치유') || text.includes('수호') || text.includes('정화') || id.includes('holy') || id.includes('divine') || id.includes('heal') || id.includes('mend') || id.includes('sanctuary') || id.includes('paladin') || id.includes('guardian')) {
      element = 'holy'
    } else if (text.includes('시공') || text.includes('차원') || text.includes('균열') || id.includes('space') || id.includes('rift') || id.includes('dimension') || id.includes('chrono') || role.includes('rift') || role.includes('chrono')) {
      element = 'space'
    }

    // 2.2 모션(Motion) 판별
    if (text.includes('베기') || text.includes('일섬') || text.includes('격참') || text.includes('참격') || id.includes('slash') || id.includes('cleave') || id.includes('blade') || id.includes('cut')) {
      motion = 'slash'
    } else if (text.includes('찌르기') || text.includes('관통') || text.includes('침') || text.includes('가시') || id.includes('pierce') || id.includes('sting') || id.includes('thrust') || id.includes('spike') || id.includes('arrow') || id.includes('bolt')) {
      motion = 'pierce'
    } else if (text.includes('폭발') || text.includes('붕괴') || text.includes('융합') || text.includes('펄스') || text.includes('방출') || id.includes('burst') || id.includes('blast') || id.includes('explode') || id.includes('pulse')) {
      motion = 'burst'
    } else if (text.includes('보호') || text.includes('결계') || text.includes('수호') || text.includes('오라') || text.includes('장막') || text.includes('방벽') || id.includes('shield') || id.includes('barrier') || id.includes('guard') || id.includes('aura') || id.includes('buff')) {
      motion = 'aura'
    } else if (text.includes('회복') || text.includes('치유') || id.includes('heal') || id.includes('mend') || id.includes('recover')) {
      motion = 'heal'
    } else if (text.includes('강타') || text.includes('파쇄') || text.includes('압궤') || text.includes('격타') || text.includes('타격') || id.includes('strike') || id.includes('hit') || id.includes('smash') || id.includes('crush') || id.includes('bite') || id.includes('scratch')) {
      motion = 'strike'
    } else {
      if (vfx.type === 'heal') motion = 'heal'
      else if (vfx.type === 'guard') motion = 'aura'
      else if (vfx.type === 'skill') motion = 'burst'
      else motion = 'slash'
    }

    // 2.3 조립된 조합 매칭 시도 및 폴백
    let key = `${element}-${motion}`
    
    if (!VFX_IMAGES[key]) {
      if (element === 'ice' && motion === 'slash') key = 'ice-strike'
      else if (element === 'space' && motion === 'slash') key = 'space-strike'
      else if (element === 'holy' && motion === 'slash') key = 'holy-strike'
      else if (motion === 'heal') key = 'holy-heal'
      else if (motion === 'aura') {
        key = element === 'dark' ? 'dark-aura' : 'holy-aura'
      } else {
        key = `physical-${motion}`
        if (!VFX_IMAGES[key]) {
          key = 'physical-slash'
        }
      }
    }

    matchedType = key
  }

  const image = VFX_IMAGES[matchedType] || effectPhysicalSlash
  const parts = matchedType.split('-')
  const element = parts[0]
  const motionType = parts[1] as any

  return { image, motionType, element }
}

function getElementGlow(element: string, isBoss?: boolean): string {
  if (isBoss) return 'rgba(244, 63, 94, 0.85)' // Rose-crimson for boss actions
  switch (element) {
    case 'fire': return 'rgba(249, 115, 22, 0.85)' // Orange
    case 'ice': return 'rgba(56, 189, 248, 0.8)' // Ice blue
    case 'lightning': return 'rgba(234, 179, 8, 0.85)' // Yellow
    case 'dark': return 'rgba(168, 85, 247, 0.85)' // Purple
    case 'holy': return 'rgba(251, 191, 36, 0.9)' // Amber/Gold
    case 'space': return 'rgba(34, 211, 238, 0.85)' // Teal/Cyan
    default: return 'rgba(255, 255, 255, 0.8)' // White/Physical
  }
}

// 9-way Job Lineage Visual Theme Resolver
function getVfxTheme(role?: string): 'swordsman' | 'warrior' | 'mage' | 'guardian' | 'tracker' | 'tactician' | 'hidden-shadow' | 'hidden-curse' | 'hidden-rift' | 'default' {
  if (!role) return 'default'
  const id = role.toLowerCase()
  
  if (id.includes('shadow') || id.includes('abyss-summoner') || id.includes('phantom-general') || id.includes('disciple') || id.includes('lord')) {
    return 'hidden-shadow'
  }
  if (id.includes('curse')) {
    return 'hidden-curse'
  }
  if (id.includes('rift') || id.includes('dimension')) {
    return 'hidden-rift'
  }
  if (
    id.includes('swordsman') ||
    id.includes('swordsmaster') ||
    id.includes('sword-saint') ||
    id.includes('illusory-swordmaster') ||
    id.includes('speed-striker') ||
    id.includes('spellsword') ||
    id.includes('blade') ||
    id.includes('sword')
  ) {
    return 'swordsman'
  }
  if (
    id === 'warrior' ||
    id.includes('berserker') ||
    id.includes('slayer') ||
    id.includes('dragon-knight') ||
    id.includes('immortal')
  ) {
    return 'warrior'
  }
  if (
    id.includes('mage') ||
    id.includes('chronomancer') ||
    id.includes('time-governor') ||
    id.includes('entropy') ||
    id.includes('wizard')
  ) {
    return 'mage'
  }
  if (
    id.includes('guardian') ||
    id.includes('paladin') ||
    id.includes('shield') ||
    id.includes('holy-redeemer') ||
    id.includes('judgment-knight')
  ) {
    return 'guardian'
  }
  if (
    id.includes('scout') ||
    id.includes('stalker') ||
    id.includes('tracker') ||
    id.includes('assassin') ||
    id.includes('phantom-stalker') ||
    id.includes('abyss-emperor')
  ) {
    return 'tracker'
  }
  if (
    id.includes('tactician') ||
    id.includes('strategist') ||
    id.includes('alchemist') ||
    id.includes('chimera') ||
    id.includes('weaver') ||
    id.includes('orchestrator')
  ) {
    return 'tactician'
  }
  return 'default'
}

export function BattlefieldVfxLayer({ vfxs }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[125] overflow-hidden">
      {/* SVG Neon Glow Filters Definition */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="vfx-glow-heavy" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 1.8 0" in="blur1" result="glow1" />
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.8 0" in="blur2" result="glow2" />
            <feMerge>
              <feMergeNode in="glow2" />
              <feMergeNode in="glow1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="vfx-glow-medium" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 1.4 0" in="blur" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <AnimatePresence>
        {vfxs.map(vfx => {
          const isAttack = vfx.type === 'attack'
          const isSkill = vfx.type === 'skill'
          const isMagic = vfx.type === 'magic'
          const isShadow = vfx.type === 'shadow'
          const isCurse = vfx.type === 'curse'
          const isHeal = vfx.type === 'heal'
          const isGuard = vfx.type === 'guard'
          
          const theme = getVfxTheme(vfx.actorRole)
          const isBossAction = vfx.isBoss

          // Get primary theme color for color styling
          const themeColor = isBossAction ? "#f43f5e" :
            theme === 'swordsman' ? "#22d3ee" :
            theme === 'warrior' ? "#f59e0b" :
            theme === 'tracker' ? "#10b981" :
            theme === 'mage' ? "#818cf8" :
            theme === 'guardian' ? "#34d399" :
            theme === 'tactician' ? "#fbbf24" :
            theme === 'hidden-shadow' ? "#a855f7" :
            theme === 'hidden-curse' ? "#ef4444" :
            theme === 'hidden-rift' ? "#c084fc" : "#ffffff"

          const resolved = resolveVfxImage(vfx)
          const glowColor = getElementGlow(resolved.element, vfx.isBoss)

          const isBasicAttack = vfx.actionId === 'basic' || vfx.actionId === 'basic-attack' || (vfx.actionText || '').includes('기본 공격') || (vfx.actionText || '').includes('기본공격')

          console.log('[LEVELUP VFX DEBUG] Rendering VFX:', {
            id: vfx.id,
            actionId: vfx.actionId,
            actionText: vfx.actionText,
            type: vfx.type,
            resolved,
            glowColor,
            targetX: vfx.targetX,
            targetY: vfx.targetY,
            isBasicAttack
          })

          return (
            <motion.div
              key={vfx.id}
              initial={{ opacity: 0, scale: 0.55 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.42, ease: 'easeOut' }}
              className="absolute flex items-center justify-center"
              style={{
                left: vfx.targetX !== undefined ? `${vfx.targetX}%` : '50%',
                top: vfx.targetY !== undefined 
                  ? `calc(${vfx.targetY}% - ${vfx.isBoss ? '76px' : '52px'})` 
                  : '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* 1. Attack / Slash / Strike Effect (Multi-layered shockwave & glowing slash path) */}
              {isAttack && (
                <div className="relative flex items-center justify-center w-40 h-40">
                  {/* B안 테스트: 참격 이미지 추가 연출 - 기본 공격이 아닐 때만 렌더링! */}
                  {!isBasicAttack && resolved.motionType === 'slash' && (
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center overflow-visible">
                      <motion.img
                        src={resolved.image}
                        alt="slash-vfx"
                        initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                        animate={{ scale: [0.6, 1.45, 1.55, 1.6], rotate: [-45, 10, 20, 25], opacity: [0, 1, 0.8, 0] }}
                        transition={{ duration: 0.72, ease: 'easeOut', times: [0, 0.15, 0.75, 1] }}
                        className="max-w-none w-64 h-64 object-contain pointer-events-none z-30"
                        style={{ mixBlendMode: 'screen', filter: `brightness(1.45) contrast(1.2) drop-shadow(0 0 16px ${glowColor})` }}
                      />
                    </div>
                  )}
                  {!isBasicAttack && resolved.motionType === 'pierce' && (
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center overflow-visible">
                      <motion.img
                        src={resolved.image}
                        alt="pierce-vfx"
                        initial={{ scaleX: 0.2, scaleY: 0.6, opacity: 0 }}
                        animate={{ scaleX: [0.3, 1.8, 1.9], scaleY: [0.6, 1.0, 0.8], opacity: [0, 1, 0.8, 0] }}
                        transition={{ duration: 0.64, ease: 'easeOut' }}
                        className="max-w-none w-60 h-60 object-contain pointer-events-none z-30"
                        style={{ mixBlendMode: 'screen', filter: `brightness(1.45) contrast(1.2) drop-shadow(0 0 16px ${glowColor})` }}
                      />
                    </div>
                  )}
                  {!isBasicAttack && resolved.motionType === 'strike' && (
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center overflow-visible">
                      <motion.img
                        src={resolved.image}
                        alt="strike-vfx"
                        initial={{ scale: 0.3, rotate: 0, opacity: 0 }}
                        animate={{ scale: [0.4, 1.4, 1.6, 1.7], rotate: [0, 10, 15, 20], opacity: [0, 0.95, 0.7, 0] }}
                        transition={{ duration: 0.64, ease: 'easeOut', times: [0, 0.18, 0.8, 1] }}
                        className="max-w-none w-56 h-56 object-contain pointer-events-none z-20"
                        style={{ mixBlendMode: 'screen', filter: `brightness(1.35) contrast(1.15) drop-shadow(0 0 12px ${glowColor})` }}
                      />
                    </div>
                  )}
                  
                  {/* B안 테스트: 원래의 담백한 기본 공격 절차적 이펙트들 - 기본 공격일 때만 렌더링! */}
                  {isBasicAttack && (
                    <>
                      {/* Shockwave Ring Layer 1 (Wide thin expansion) */}
                      <motion.div
                        initial={{ scale: 0.2, opacity: 1 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={clsx(
                          "absolute w-28 h-28 rounded-full border-4 filter blur-[0.5px]",
                          isBossAction 
                            ? "border-rose-500 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.9)]" 
                            : theme === 'swordsman'
                            ? "border-cyan-300 bg-cyan-950/10 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                            : theme === 'warrior'
                            ? "border-amber-400 bg-amber-950/10 shadow-[0_0_25px_rgba(245,158,11,0.8)]"
                            : theme === 'tracker'
                            ? "border-emerald-300 bg-emerald-950/10 shadow-[0_0_20px_rgba(52,211,153,0.8)]"
                            : "border-white bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                        )}
                      />
                      {/* Shockwave Ring Layer 2 (Faster tighter neon glow ring) */}
                      <motion.div
                        initial={{ scale: 0.1, opacity: 0.9 }}
                        animate={{ scale: 1.3, opacity: 0 }}
                        transition={{ duration: 0.22, delay: 0.03, ease: "easeOut" }}
                        className={clsx(
                          "absolute w-28 h-28 rounded-full border-[6px]",
                          isBossAction ? "border-rose-400" :
                          theme === 'swordsman' ? "border-cyan-200" :
                          theme === 'warrior' ? "border-amber-300" :
                          theme === 'tracker' ? "border-emerald-200" : "border-white"
                        )}
                        style={{ filter: 'url(#vfx-glow-medium)' }}
                      />
                      {/* Core central flash */}
                      <motion.div
                        initial={{ scale: 0.15, opacity: 1 }}
                        animate={{ scale: [1.3, 0], opacity: [1, 0] }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute w-12 h-12 bg-white rounded-full filter blur-[1px] z-10"
                        style={{ boxShadow: `0 0 20px ${themeColor}` }}
                      />
                    </>
                  )}
                </div>
              )}

              {/* 2. Skill Burst / Blast / Sigil (Theme-differentiated SVG Masterpieces) */}
              {isSkill && (
                <div className="relative flex items-center justify-center w-40 h-40">
                  {/* B안 테스트: 스킬 발동 시 이미지 추가 */}
                  {resolved.motionType === 'burst' && (
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center overflow-visible">
                      <motion.img
                        src={resolved.image}
                        alt="burst-vfx"
                        initial={{ scale: 0.5, rotate: 0, opacity: 0 }}
                        animate={{ scale: [0.6, 1.6, 1.8, 1.95], rotate: [0, 45, 75, 90], opacity: [0, 1, 0.85, 0] }}
                        transition={{ duration: 0.96, ease: 'easeOut', times: [0, 0.2, 0.8, 1] }}
                        className="max-w-none w-72 h-72 object-contain pointer-events-none z-30"
                        style={{ mixBlendMode: 'screen', filter: `brightness(1.5) contrast(1.25) drop-shadow(0 0 20px ${glowColor})` }}
                      />
                    </div>
                  )}
                  {resolved.motionType === 'slash' && (
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center overflow-visible">
                      <motion.img
                        src={resolved.image}
                        alt="skill-slash-vfx"
                        initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                        animate={{ scale: [0.7, 1.5, 1.7, 1.8], rotate: [-45, 15, 30, 40], opacity: [0, 1, 0.8, 0] }}
                        transition={{ duration: 0.82, ease: 'easeOut', times: [0, 0.15, 0.8, 1] }}
                        className="max-w-none w-72 h-72 object-contain pointer-events-none z-30"
                        style={{ mixBlendMode: 'screen', filter: `brightness(1.5) contrast(1.25) drop-shadow(0 0 18px ${glowColor})` }}
                      />
                    </div>
                  )}
                  {resolved.motionType === 'pierce' && (
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center overflow-visible">
                      <motion.img
                        src={resolved.image}
                        alt="skill-pierce-vfx"
                        initial={{ scaleX: 0.2, scaleY: 0.7, opacity: 0 }}
                        animate={{ scaleX: [0.3, 2.0, 2.2], scaleY: [0.7, 1.1, 0.9], opacity: [0, 1, 0.8, 0] }}
                        transition={{ duration: 0.78, ease: 'easeOut' }}
                        className="max-w-none w-64 h-64 object-contain pointer-events-none z-30"
                        style={{ mixBlendMode: 'screen', filter: `brightness(1.5) contrast(1.25) drop-shadow(0 0 18px ${glowColor})` }}
                      />
                    </div>
                  )}
                  {resolved.motionType === 'strike' && (
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center overflow-visible">
                      <motion.img
                        src={resolved.image}
                        alt="skill-strike-vfx"
                        initial={{ scale: 0.3, rotate: 0, opacity: 0 }}
                        animate={{ scale: [0.4, 1.6, 1.8], rotate: [0, 20], opacity: [0, 1, 0.8, 0] }}
                        transition={{ duration: 0.78, ease: 'easeOut' }}
                        className="max-w-none w-64 h-64 object-contain pointer-events-none z-30"
                        style={{ mixBlendMode: 'screen', filter: `brightness(1.4) contrast(1.2) drop-shadow(0 0 16px ${glowColor})` }}
                      />
                    </div>
                  )}


                </div>
              )}

              {/* 3. Magic Circle Effect (High precision dual-ring magic shield) */}
              {isMagic && (
                <div className="relative flex items-center justify-center w-36 h-36">
                  {/* B안 테스트: 마법 스킬 투명화 PNG 이미지 추가 */}
                  {!isBasicAttack && resolved.image && (
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center overflow-visible">
                      <motion.img
                        src={resolved.image}
                        alt="magic-vfx-image"
                        initial={{ scale: 0.4, rotate: 0, opacity: 0 }}
                        animate={{
                          scale: [0.5, 1.4, 1.5, 1.6],
                          rotate: [0, 45, 90],
                          opacity: [0, 1, 0.85, 0]
                        }}
                        transition={{ duration: 0.68, ease: 'easeOut', times: [0, 0.15, 0.75, 1] }}
                        className="max-w-none w-64 h-64 object-contain pointer-events-none z-30"
                        style={{ mixBlendMode: 'screen', filter: `brightness(1.5) contrast(1.2) drop-shadow(0 0 16px ${glowColor})` }}
                      />
                    </div>
                  )}

                </div>
              )}

              {/* 4. Shadow Mist Effect (Swirling dark purple clouds) */}
              {isShadow && (
                <div className="relative flex items-center justify-center w-40 h-40">
                  <motion.div
                    animate={{ scale: [0.7, 1.4], opacity: [0.8, 0] }}
                    transition={{ duration: 0.52 }}
                    className="absolute inset-0 bg-[radial-gradient(circle,rgba(168,85,247,0.42),transparent_75%)] rounded-full filter blur-md"
                  />
                  
                  {/* B안 테스트: 그림자 스킬 투명화 PNG 이미지 추가 */}
                  {!isBasicAttack && resolved.image && (
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center overflow-visible">
                      <motion.img
                        src={resolved.image}
                        alt="shadow-vfx-image"
                        initial={{ scale: 0.4, rotate: resolved.motionType === 'slash' ? -35 : 0, opacity: 0 }}
                        animate={{
                          scale: resolved.motionType === 'slash' ? [0.5, 1.5, 1.6, 1.65] : [0.4, 1.35, 1.45, 1.5],
                          rotate: resolved.motionType === 'slash' ? [-35, 15, 25, 30] : [0, 30, 45, 50],
                          opacity: [0, 1, 0.85, 0]
                        }}
                        transition={{ duration: 0.68, ease: 'easeOut', times: [0, 0.15, 0.75, 1] }}
                        className="max-w-none w-64 h-64 object-contain pointer-events-none z-30"
                        style={{ mixBlendMode: 'screen', filter: `brightness(1.5) contrast(1.2) drop-shadow(0 0 16px ${glowColor})` }}
                      />
                    </div>
                  )}

                </div>
              )}

              {/* 5. Curse Rift Crack Effect (Ruinous Crimson Seal Fragmenting) */}
              {isCurse && (
                <div className="relative flex items-center justify-center w-32 h-32">
                  <motion.div
                    animate={{ scale: [0.5, 1.3], opacity: [0.85, 0] }}
                    transition={{ duration: 0.45 }}
                    className="absolute inset-0 bg-[radial-gradient(circle,rgba(239,68,68,0.48),transparent_70%)] rounded-full filter blur-md"
                  />

                  {/* B안 테스트: 저주 스킬 투명화 PNG 이미지 추가 */}
                  {!isBasicAttack && resolved.image && (
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center overflow-visible">
                      <motion.img
                        src={resolved.image}
                        alt="curse-vfx-image"
                        initial={{ scale: 0.4, rotate: 0, opacity: 0 }}
                        animate={{
                          scale: [0.5, 1.4, 1.5, 1.55],
                          rotate: [-15, 15, 25, 30],
                          opacity: [0, 1, 0.8, 0]
                        }}
                        transition={{ duration: 0.68, ease: 'easeOut', times: [0, 0.15, 0.75, 1] }}
                        className="max-w-none w-60 h-60 object-contain pointer-events-none z-30"
                        style={{ mixBlendMode: 'screen', filter: `brightness(1.45) contrast(1.2) drop-shadow(0 0 16px ${glowColor})` }}
                      />
                    </div>
                  )}

                </div>
              )}

              {/* 6. Heal Pillar Effect (Rising Emerald Crosses & Sparkling Dust) */}
              {isHeal && (
                <div className="relative flex flex-col items-center justify-end w-28 h-52">
                  {/* B안 테스트: 치유/정화 이미지 추가 */}
                  <div className="absolute bottom-0 left-1/2 w-0 h-0 flex flex-col items-center justify-end overflow-visible">
                    <motion.img
                      src={resolved.image}
                      alt="heal-vfx"
                      initial={{ y: 40, scale: 0.5, opacity: 0 }}
                      animate={{ y: [-20, -60], scale: [0.8, 1.35], opacity: [0, 1, 0.9, 0] }}
                      transition={{ duration: 0.88, ease: 'easeOut' }}
                      className="max-w-none w-44 h-72 object-contain pointer-events-none z-30"
                      style={{ mixBlendMode: 'screen', filter: `brightness(1.4) contrast(1.2) drop-shadow(0 0 14px ${glowColor})` }}
                    />
                  </div>
                  {/* Glowing vertical aura beam */}
                  <motion.div
                    animate={{ height: [0, 180], opacity: [0.85, 0] }}
                    transition={{ duration: 0.58, ease: "easeOut" }}
                    className="w-12 rounded-full bg-gradient-to-t from-emerald-500/35 via-emerald-300/50 to-transparent filter blur-[2.5px]"
                  />
                  
                  {/* Rising Holy Cross particles */}
                  <svg width="80" height="180" className="absolute inset-0 pointer-events-none overflow-visible">
                    {Array.from({ length: 6 }).map((_, i) => {
                      const dx = -20 + (i % 3) * 20
                      const duration = 0.5 + (i % 2) * 0.1
                      const delay = i * 0.08
                      return (
                        <motion.g
                          key={i}
                          filter="url(#vfx-glow-medium)"
                          animate={{
                            x: [40 + dx, 40 + dx],
                            y: [160, 20],
                            opacity: [0, 0.95, 0.95, 0],
                            scale: [0.5, 1.2, 0.5]
                          }}
                          transition={{ duration, delay, ease: "easeOut" }}
                        >
                          <path
                            d="M 0,-8 L 0,8 M -8,0 L 8,0"
                            stroke="#34d399"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                          />
                        </motion.g>
                      )
                    })}
                  </svg>
                </div>
              )}

              {/* 7. Guard Hex Shield Effect (Hexagonal Aegis Grid Deflection) */}
              {isGuard && (
                <div className="relative flex items-center justify-center w-32 h-32">
                  {/* B안 테스트: 가드/오라 보호막 이미지 추가 */}
                  <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center overflow-visible">
                    <motion.img
                      src={resolved.image}
                      alt="guard-vfx"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: [0.7, 1.15, 1.05], opacity: [0, 1, 0.9, 0] }}
                      transition={{ duration: 0.78, ease: 'easeOut' }}
                      className="max-w-none w-48 h-48 object-contain pointer-events-none z-30"
                      style={{ mixBlendMode: 'screen', filter: `brightness(1.4) contrast(1.2) drop-shadow(0 0 16px ${glowColor})` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
