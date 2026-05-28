import type { SkillDefinition, SkillRuntimeState } from './types'

export interface SkillUpgradeEffect {
  powerMultiplier?: number // 피해량/회복량 등 곱연산 보너스 (예: 1.1)
  cooldownReduction?: number // 쿨다운 감소 수치 (예: 1)
  defenseIgnore?: number // 방어 무시 비율 (예: 0.15 => 15% 무시)
  critRateBonus?: number // 치명타 확률 추가 (예: 0.1 => 10%)
  statusValueBonus?: number // 부여하는 버프/디버프 상태이상 수치 보정 (예: 0.1)
  bossDamageBonus?: number // 보스 대상 추가 피해 배율 (예: 0.15)
  telegraphDamageReduction?: number // 보스 예고 공격을 피격 시 받는 피해 추가 감소 배율 (예: 0.15)
}

export interface SkillUpgradeDefinition {
  id: string
  skillId: string
  name: string
  description: string
  unlockMasteryLevel: number
  effects: SkillUpgradeEffect
}

// 스킬별 고유 진화/강화 선택지 (Lv.5 전용)
export const SKILL_UPGRADE_DATABASE: Record<string, SkillUpgradeDefinition[]> = {
  // Swordsman (검객 계열)
  'skill-swordsman-flash': [
    {
      id: 'up-swordsman-flash-focus',
      skillId: 'skill-swordsman-flash',
      name: '섬광 집중',
      description: '치명타 확률이 12% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { critRateBonus: 0.12 }
    },
    {
      id: 'up-swordsman-flash-pierce',
      skillId: 'skill-swordsman-flash',
      name: '날카로운 궤적',
      description: '적 방어력을 15% 무시하고 공격합니다.',
      unlockMasteryLevel: 5,
      effects: { defenseIgnore: 0.15 }
    }
  ],
  'skill-swordsman-combo': [
    {
      id: 'up-swordsman-combo-damage',
      skillId: 'skill-swordsman-combo',
      name: '질풍 연격',
      description: '피해량이 12% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { powerMultiplier: 1.12 }
    },
    {
      id: 'up-swordsman-combo-cooldown',
      skillId: 'skill-swordsman-combo',
      name: '기회 포착',
      description: '스킬 재사용 대기시간이 1턴 감소합니다.',
      unlockMasteryLevel: 5,
      effects: { cooldownReduction: 1 }
    }
  ],
  'skill-swordsman-wave': [
    {
      id: 'up-swordsman-wave-power',
      skillId: 'skill-swordsman-wave',
      name: '검기 폭발',
      description: '검기 폭풍의 위력이 15% 강력해집니다.',
      unlockMasteryLevel: 5,
      effects: { powerMultiplier: 1.15 }
    },
    {
      id: 'up-swordsman-wave-crit',
      skillId: 'skill-swordsman-wave',
      name: '검기 비수',
      description: '치명타율이 10% 증가하고 보스에게 8% 추가 피해를 입힙니다.',
      unlockMasteryLevel: 5,
      effects: { critRateBonus: 0.1, bossDamageBonus: 0.08 }
    }
  ],

  // Warrior (전사 계열)
  'skill-warrior-strike': [
    {
      id: 'up-warrior-strike-break',
      skillId: 'skill-warrior-strike',
      name: '갑주 파괴',
      description: '디버프 효과(방어/속도 약화) 수치가 12% 강화됩니다.',
      unlockMasteryLevel: 5,
      effects: { statusValueBonus: 0.12 }
    },
    {
      id: 'up-warrior-strike-heavy',
      skillId: 'skill-warrior-strike',
      name: '중압 강타',
      description: '보스 유닛에게 입히는 피해가 15% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { bossDamageBonus: 0.15 }
    }
  ],
  'skill-warrior-earthquake': [
    {
      id: 'up-warrior-quake-pierce',
      skillId: 'skill-warrior-earthquake',
      name: '지면 함몰',
      description: '적들의 수비력을 15% 무시하고 균열 대미지를 줍니다.',
      unlockMasteryLevel: 5,
      effects: { defenseIgnore: 0.15 }
    },
    {
      id: 'up-warrior-quake-slow',
      skillId: 'skill-warrior-earthquake',
      name: '충격 확산',
      description: '피해량이 10% 증가하며 광역 디버프 효율이 상승합니다.',
      unlockMasteryLevel: 5,
      effects: { powerMultiplier: 1.1, statusValueBonus: 0.08 }
    }
  ],
  'skill-warrior-shout': [
    {
      id: 'up-warrior-shout-defense',
      skillId: 'skill-warrior-shout',
      name: '수호의 포효',
      description: '방어/피감 버프 효율이 12% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { statusValueBonus: 0.12 }
    },
    {
      id: 'up-warrior-shout-cd',
      skillId: 'skill-warrior-shout',
      name: '용맹의 고취',
      description: '쿨다운이 1턴 감소합니다.',
      unlockMasteryLevel: 5,
      effects: { cooldownReduction: 1 }
    }
  ],

  // Mage (마법사 계열)
  'skill-mage-bolt': [
    {
      id: 'up-mage-bolt-amplified',
      skillId: 'skill-mage-bolt',
      name: '마력 증폭',
      description: '단일 피해량이 12% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { powerMultiplier: 1.12 }
    },
    {
      id: 'up-mage-bolt-crit',
      skillId: 'skill-mage-bolt',
      name: '마도 치명',
      description: '치명타 확률이 12% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { critRateBonus: 0.12 }
    }
  ],
  'skill-mage-burst': [
    {
      id: 'up-mage-burst-focus',
      skillId: 'skill-mage-burst',
      name: '압축 폭발',
      description: '비전 마법의 피해가 15% 강력해집니다.',
      unlockMasteryLevel: 5,
      effects: { powerMultiplier: 1.15 }
    },
    {
      id: 'up-mage-burst-splash',
      skillId: 'skill-mage-burst',
      name: '비전 파편',
      description: '치명타 확률이 10% 증가하고 방어력을 10% 무시합니다.',
      unlockMasteryLevel: 5,
      effects: { critRateBonus: 0.1, defenseIgnore: 0.1 }
    }
  ],
  'skill-mage-storm': [
    {
      id: 'up-mage-storm-extend',
      skillId: 'skill-mage-storm',
      name: '폭풍 확산',
      description: '광역 피해량이 12% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { powerMultiplier: 1.12 }
    },
    {
      id: 'up-mage-storm-cd',
      skillId: 'skill-mage-storm',
      name: '마력 순환',
      description: '재사용 대기시간이 1턴 감소합니다.',
      unlockMasteryLevel: 5,
      effects: { cooldownReduction: 1 }
    }
  ],

  // Guardian (수호자 계열)
  'skill-guardian-bash': [
    {
      id: 'up-guardian-bash-stun',
      skillId: 'skill-guardian-bash',
      name: '충격 방패',
      description: '방패 강타의 대미지가 15% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { powerMultiplier: 1.15 }
    },
    {
      id: 'up-guardian-bash-cd',
      skillId: 'skill-guardian-bash',
      name: '신속 대처',
      description: '재사용 대기시간이 1턴 감소합니다.',
      unlockMasteryLevel: 5,
      effects: { cooldownReduction: 1 }
    }
  ],
  'skill-guardian-shield': [
    {
      id: 'up-guardian-shield-heavy',
      skillId: 'skill-guardian-shield',
      name: '굳건한 방벽',
      description: '수호막의 보호막 흡수량 및 피해 감소 효율이 12% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { powerMultiplier: 1.12 }
    },
    {
      id: 'up-guardian-shield-react',
      skillId: 'skill-guardian-shield',
      name: '수호 반응',
      description: '보스의 예고(Telegraph) 공격으로 입는 피해를 추가로 15% 감쇄합니다.',
      unlockMasteryLevel: 5,
      effects: { telegraphDamageReduction: 0.15 }
    }
  ],
  'skill-guardian-stance': [
    {
      id: 'up-guardian-stance-wall',
      skillId: 'skill-guardian-stance',
      name: '철벽의 자세',
      description: '자세 발동 시 아군 방어 강화 및 피감 버프 수치가 10% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { statusValueBonus: 0.1 }
    },
    {
      id: 'up-guardian-stance-boss',
      skillId: 'skill-guardian-stance',
      name: '대보스 기원',
      description: '보스 대상 피격 데미지 감소율이 12% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { telegraphDamageReduction: 0.12 }
    }
  ],

  // Scout/Tracker (추적자 계열)
  'skill-scout-strike': [
    {
      id: 'up-scout-strike-crit',
      skillId: 'skill-scout-strike',
      name: '급소 정밀 타격',
      description: '치명타 확률이 15% 대폭 상승합니다.',
      unlockMasteryLevel: 5,
      effects: { critRateBonus: 0.15 }
    },
    {
      id: 'up-scout-strike-shadow',
      skillId: 'skill-scout-strike',
      name: '그림자 습격',
      description: '적의 방어력을 15% 관통하여 피해를 줍니다.',
      unlockMasteryLevel: 5,
      effects: { defenseIgnore: 0.15 }
    }
  ],
  'skill-scout-mark': [
    {
      id: 'up-scout-mark-heavy',
      skillId: 'skill-scout-mark',
      name: '사냥꾼의 표식',
      description: '표식을 부여받은 적이 받는 피해 수치가 10% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { statusValueBonus: 0.1 }
    },
    {
      id: 'up-scout-mark-slow',
      skillId: 'skill-scout-mark',
      name: '도주 차단',
      description: '표식 부여 시 적의 행동 속도를 추가로 8% 늦춥니다.',
      unlockMasteryLevel: 5,
      effects: { statusValueBonus: 0.08 }
    }
  ],
  'skill-scout-step': [
    {
      id: 'up-scout-step-speed',
      skillId: 'skill-scout-step',
      name: '바람의 발놀림',
      description: '회피 기동 버프의 속도 증가량이 10% 강화됩니다.',
      unlockMasteryLevel: 5,
      effects: { statusValueBonus: 0.1 }
    },
    {
      id: 'up-scout-step-cd',
      skillId: 'skill-scout-step',
      name: '허상 회피',
      description: '쿨다운이 1턴 감소합니다.',
      unlockMasteryLevel: 5,
      effects: { cooldownReduction: 1 }
    }
  ],

  // Tactician (전술가 계열)
  'skill-tactician-analyze': [
    {
      id: 'up-tactician-analyze-heavy',
      skillId: 'skill-tactician-analyze',
      name: '취약점 확대',
      description: '적 방어력 감소 디버프 효율이 12% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { statusValueBonus: 0.12 }
    },
    {
      id: 'up-tactician-analyze-telegraph',
      skillId: 'skill-tactician-analyze',
      name: '패턴 해석',
      description: '보스의 예고(Telegraph) 공격으로 아군 전체가 입는 피해를 12% 추가 차감합니다.',
      unlockMasteryLevel: 5,
      effects: { telegraphDamageReduction: 0.12 }
    }
  ],
  'skill-tactician-command': [
    {
      id: 'up-tactician-command-atk',
      skillId: 'skill-tactician-command',
      name: '섬멸 명령',
      description: '아군 공격력 강화 버프 효율이 10% 증가합니다.',
      unlockMasteryLevel: 5,
      effects: { statusValueBonus: 0.1 }
    },
    {
      id: 'up-tactician-command-cd',
      skillId: 'skill-tactician-command',
      name: '신속 재편성',
      description: '쿨다운이 1턴 감소합니다.',
      unlockMasteryLevel: 5,
      effects: { cooldownReduction: 1 }
    }
  ],
  'skill-tactician-analyze-pulse': [
    {
      id: 'up-tactician-pulse-shred',
      skillId: 'skill-tactician-analyze-pulse',
      name: '집중 약점 노출',
      description: '방깎 디버프 수치가 10% 증가하고, 적인 방어력을 10% 관통합니다.',
      unlockMasteryLevel: 5,
      effects: { statusValueBonus: 0.1, defenseIgnore: 0.1 }
    },
    {
      id: 'up-tactician-pulse-cd',
      skillId: 'skill-tactician-analyze-pulse',
      name: '파동 가속',
      description: '쿨다운이 1턴 단축됩니다.',
      unlockMasteryLevel: 5,
      effects: { cooldownReduction: 1 }
    }
  ]
}

// Generic Upgrade Builder
export const getAvailableUpgradesForSkill = (skill: SkillDefinition): SkillUpgradeDefinition[] => {
  const custom = SKILL_UPGRADE_DATABASE[skill.id]
  if (custom) return custom

  const skillId = skill.id
  // Fallback: 스킬의 type 속성에 따라 generic 업그레이드를 동적으로 구성
  if (skill.type === 'attack' || skill.type === 'damage') {
    return [
      {
        id: `up-gen-atk-power-${skillId}`,
        skillId,
        name: '집중 강화',
        description: '스킬 피해량이 10% 증가합니다.',
        unlockMasteryLevel: 5,
        effects: { powerMultiplier: 1.1 }
      },
      {
        id: `up-gen-atk-crit-${skillId}`,
        skillId,
        name: '예리한 일격',
        description: '스킬 사용 시 치명타 확률이 10% 증가합니다.',
        unlockMasteryLevel: 5,
        effects: { critRateBonus: 0.1 }
      }
    ]
  } else if (skill.type === 'defense') {
    return [
      {
        id: `up-gen-def-shield-${skillId}`,
        skillId,
        name: '굳건한 보호막',
        description: '보호막량 및 피해감소 효과가 12% 증가합니다.',
        unlockMasteryLevel: 5,
        effects: { powerMultiplier: 1.12 }
      },
      {
        id: `up-gen-def-cd-${skillId}`,
        skillId,
        name: '신속 장벽',
        description: '재사용 대기시간이 1턴 감소합니다.',
        unlockMasteryLevel: 5,
        effects: { cooldownReduction: 1 }
      }
    ]
  } else if (skill.type === 'heal') {
    return [
      {
        id: `up-gen-heal-power-${skillId}`,
        skillId,
        name: '치유 증폭',
        description: '스킬의 회복 효과가 12% 증가합니다.',
        unlockMasteryLevel: 5,
        effects: { powerMultiplier: 1.12 }
      },
      {
        id: `up-gen-heal-cd-${skillId}`,
        skillId,
        name: '정밀 영창',
        description: '재사용 대기시간이 1턴 감소합니다.',
        unlockMasteryLevel: 5,
        effects: { cooldownReduction: 1 }
      }
    ]
  } else if (skill.type === 'buff') {
    return [
      {
        id: `up-gen-buff-power-${skillId}`,
        skillId,
        name: '효과 극대화',
        description: '부여하는 긍정적 버프 효과의 가치가 10% 강화됩니다.',
        unlockMasteryLevel: 5,
        effects: { statusValueBonus: 0.1 }
      },
      {
        id: `up-gen-buff-cd-${skillId}`,
        skillId,
        name: '전술 순환',
        description: '재사용 대기시간이 1턴 감소합니다.',
        unlockMasteryLevel: 5,
        effects: { cooldownReduction: 1 }
      }
    ]
  } else {
    // debuff, utility 등
    return [
      {
        id: `up-gen-debuff-power-${skillId}`,
        skillId,
        name: '약화 강화',
        description: '부여하는 악화 디버프 효과의 가치가 10% 강화됩니다.',
        unlockMasteryLevel: 5,
        effects: { statusValueBonus: 0.1 }
      },
      {
        id: `up-gen-debuff-cd-${skillId}`,
        skillId,
        name: '신속 교란',
        description: '재사용 대기시간이 1턴 감소합니다.',
        unlockMasteryLevel: 5,
        effects: { cooldownReduction: 1 }
      }
    ]
  }
}

// Lv.10 Capstone 보너스 정의
export const getSkillCapstoneUpgrade = (skill: SkillDefinition): SkillUpgradeEffect => {
  const cdSkills = ['skill-swordsman-flash', 'skill-swordsman-combo', 'skill-warrior-strike', 'skill-warrior-shout', 'skill-guardian-bash', 'skill-guardian-shield', 'skill-scout-strike', 'skill-scout-step', 'skill-tactician-command', 'skill-tactician-analyze-pulse']
  
  if (cdSkills.includes(skill.id)) {
    return { cooldownReduction: 1, powerMultiplier: 1.05 }
  }

  // 기본형 캡스톤: 스킬 종류에 따라 분기
  if (skill.type === 'attack' || skill.type === 'damage') {
    return { bossDamageBonus: 0.10, powerMultiplier: 1.05 }
  } else if (skill.type === 'defense' || skill.type === 'heal') {
    return { powerMultiplier: 1.10 }
  } else {
    return { statusValueBonus: 0.08, cooldownReduction: 1 }
  }
}
