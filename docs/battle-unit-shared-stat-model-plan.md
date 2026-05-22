# 12-29B Battle Unit / Shared Combat Stat Model Plan

## Scope

This is a design document for a shared battle unit and combat stat model that can support the future direct-control party battle:

```text
Hunter + Shadow Party vs Monster Party
```

This step does not implement code, change combat formulas, change save structure, alter UI, change rewards, change monster/gate values, or implement 2.5D combat.

## 1. Design Goals

The next combat model needs one common runtime shape for every unit that can appear in battle.

Goals:

- Hunter, shadows, monsters, bosses, and minions should all enter combat as `BattleUnit` objects.
- The battle screen should show all units through the same readable stat language: HP / ATK / DEF / SPD / SKILL.
- Shadows should still keep their internal 13-stat Shadow v2 model.
- Shadow stats should be translated into shared battle stats, not discarded.
- Hunter stats, equipment, titles, and skills should also feed the same shared battle stat model through a conversion layer.
- Monster units should use the same stat names, making future multi-target combat and 2.5D visualization consistent.
- The model should be reusable by:
  - direct many-vs-many runtime
  - action queue
  - status effects
  - target selection
  - 2.5D board unit plates
  - battle logs and tooltips

The design rule is simple:

```text
Internal source stats may differ.
Runtime battle stats should be shared.
```

## 2. Common BattleUnit Concept

`BattleUnit` is the runtime representation of any combat participant.

Included unit types:

- `hunter`
- `shadow`
- `monster`
- `boss`
- `minion`

Candidate fields:

| Field | Purpose |
| --- | --- |
| `unitId` | Runtime unique id. |
| `sourceId` | Source entity id, such as hunter id, shadow instance id, monster definition id. |
| `unitType` | `hunter`, `shadow`, `monster`, `boss`, or `minion`. |
| `displayName` | Revealed battle display name. Hidden units must use safe sealed wording. |
| `role` | Unit role, such as assault, guard, support, bruiser, boss. |
| `team` | `player` or `enemy`. |
| `level` | Runtime level or encounter level. |
| `maxHp` | Maximum HP. |
| `currentHp` | Current HP. |
| `atk` | Basic attack and direct physical pressure. |
| `def` | Damage reduction / guard baseline. |
| `spd` | Action order, initiative, cooldown tempo. |
| `crit` | Critical / burst chance or high-roll tendency. |
| `skillPower` | Active skill power. |
| `controlPower` | Debuff, mark, delay, suppression strength. |
| `supportPower` | Heal, buff, cooldown support strength. |
| `survivalPower` | Emergency guard, low HP protection, self-preservation. |
| `bossPower` | Boss/elite specialization. |
| `synergyPower` | Ally combo and party coordination. |
| `statusEffects` | Runtime status effects on this unit. |
| `cooldowns` | Action/skill cooldown map. |
| `actionList` | Usable active actions in this battle. |
| `passiveList` | Passive/reaction candidates. |
| `actionPriority` | Unit-specific priority modifier. |
| `boardLane` | Front/flank/rear/anchor/boss lane for later board use. |
| `actionCue` | Semantic action cue for logs and later 2.5D. |
| `animationCue` | Future animation hook. |
| `effectColor` | Future effect color token. |
| `metadata` | Safe source metadata, never hidden locked details. |

Important separation:

- `BattleUnit` is runtime state.
- Source models such as hunter state, `OwnedShadow`, and monster definitions remain separate.
- Conversion helpers should build `BattleUnit` from those sources.

## 3. Shared Combat Stats

First-pass visible combat stats:

| Stat | Meaning |
| --- | --- |
| HP | Survival pool. |
| ATK | Basic attack pressure. |
| DEF | Incoming damage reduction / guard baseline. |
| SPD | Action speed, initiative, cooldown tempo. |
| SKILL | Active skill strength. |

Advanced/detail stats:

| Stat | Meaning |
| --- | --- |
| CRIT | Critical, burst, high-roll damage. |
| CONTROL | Debuff, mark, delay, disruption. |
| SUPPORT | Heal, buff, cooldown assistance. |
| SURVIVAL | Emergency protection, low HP sustain, lethal prevention. |
| BOSS | Boss/elite specialization. |
| SYNERGY | Party coordination, combos, role chains. |

Display principle:

- Battle unit plates show HP / ATK / DEF / SPD / SKILL.
- Selected unit detail may show CRIT / CONTROL / SUPPORT / SURVIVAL / BOSS / SYNERGY.
- Shadow raw 13 stats should stay in a collapsible detail panel, not the main battle plate.

## 4. Shadow Stat to Battle Stat Conversion

Shadows keep their 13 internal stats:

- `shadowAttack`
- `shadowDefense`
- `shadowDurability`
- `shadowSpeed`
- `shadowCrit`
- `shadowFinisher`
- `shadowControl`
- `shadowSuppression`
- `shadowSupport`
- `shadowSurvival`
- `shadowBossing`
- `shadowExpedition`
- `shadowSynergy`

These are converted into shared battle stats for runtime and UI.

Recommended mapping:

| Battle Stat | Shadow Inputs |
| --- | --- |
| HP | `shadowDurability`, `shadowSurvival`, level, enhancement, rarity, innateGrade. |
| ATK | `shadowAttack`, part of `shadowCrit`, part of `shadowFinisher`. |
| DEF | `shadowDefense`, part of `shadowDurability`, part of `shadowSurvival`. |
| SPD | `shadowSpeed`, role modifier, innateGrade modifier. |
| CRIT | `shadowCrit`, part of `shadowFinisher`. |
| SKILL | active skill statScaling, role stat, `shadowAttack`, `shadowSupport`, `shadowControl`, or other skill-relevant stat. |
| CONTROL | `shadowControl`, `shadowSuppression`. |
| SUPPORT | `shadowSupport`, part of `shadowSynergy`. |
| SURVIVAL | `shadowSurvival`, part of `shadowDurability`. |
| BOSS | `shadowBossing`, part of `shadowSuppression`. |
| SYNERGY | `shadowSynergy`, part of `shadowSupport`. |

Role hints:

| Shadow Role | Conversion Bias |
| --- | --- |
| assault | Higher ATK/SKILL/CRIT/finisher contribution. |
| guard | Higher HP/DEF/SURVIVAL. |
| hunter | Higher SPD/CRIT/finisher and low HP targeting value. |
| scout | Higher SPD/CONTROL and initiative. |
| support | Higher SUPPORT/SYNERGY and moderate SURVIVAL. |
| analyst | Higher CONTROL/BOSS/SKILL and suppression. |

Quality modifiers:

- Rarity affects baseline potential and skill availability.
- InnateGrade affects stability and growth rather than replacing role identity.
- Level and enhancement should increase shared stats gradually.
- Evolution may add secondary role bias or improve skill conversion.

Guardrails:

- `shadowExpedition` should not heavily increase combat stats.
- `shadowSynergy` should improve party interaction more than raw damage.
- A common S shadow can become very usable in its role, but should not inherit legendary unique effects.
- A legendary C shadow has high profile potential but should still respect lower innate stability.

UI rule:

- Main battle screen shows translated shared stats.
- Shadow detail can expose original 13 stats in a collapsible section.

## 5. Hunter Stat to Battle Stat Conversion

The hunter already has multiple stat sources:

- base level and rank
- six hunter stats: STR, VIT, AGI, INT, PER, SEN
- equipment effects
- equipment stars and rarity
- title effects
- skills and mastery
- active combat effects
- current combatPower helpers

The direct battle system should not replace this structure. It should add a conversion layer.

Recommended conversion direction:

| Battle Stat | Hunter Inputs |
| --- | --- |
| HP | Level, VIT, rank, defensive equipment, title bonuses. |
| ATK | STR, weapon value, offensive item effects, attack skills. |
| DEF | VIT, armor value, damage reduction effects, defensive title/equipment. |
| SPD | AGI, accessory value, speed/evasion effects. |
| CRIT | AGI, STR, weapon effects, skill/equipment crit effects if present. |
| SKILL | INT, equipped skills, weapon/artifact skillValue, skill mastery. |
| CONTROL | INT, SEN, control/debuff skills. |
| SUPPORT | INT, SEN, support skills, accessory/artifact utility. |
| SURVIVAL | VIT, PER, defensive equipment, title protection effects. |
| BOSS | Skill kit, weapon/artifact special effects, challenge/boss-specific bonuses if later defined. |
| SYNERGY | SEN, equipment `shadowSynergyValue`, title/equipment utility. |

Equipment integration:

- `equipmentPower.totalEquipmentValue` should remain primarily interpretive.
- Equipment effects and existing combat helpers remain authoritative where they already feed combat.
- `slotRole` can inform stat bias:
  - weapon -> ATK / SKILL / CRIT
  - armor -> HP / DEF / SURVIVAL
  - accessory -> SPD / SUPPORT / CONTROL / SYNERGY
  - artifact/relic -> SKILL / SUPPORT / BOSS / SYNERGY
- `topTags` can help UI explain why a stat is high.

Implementation principle for later:

- Build a `BattleUnit` from current hunter state through a helper.
- Do not mutate the hunter save model.
- Do not replace current combatPower immediately.
- Keep old Gate/Tower combat compatible until the new runtime is optional and stable.

## 6. Monster Stat Model

Monsters should use the same shared battle stat names as hunter and shadows.

Monster unit fields:

- HP
- ATK
- DEF
- SPD
- CRIT candidate
- SKILL
- CONTROL
- SUPPORT
- role
- intent
- actionList
- passiveList candidate
- target priority
- boss flag
- minion flag
- boardLane
- actionCue metadata

Monster role tendencies:

| Monster Role | Stat Bias |
| --- | --- |
| bruiser | Balanced HP/ATK. |
| tank | High HP/DEF, low SPD. |
| caster | High SKILL/CONTROL, lower DEF. |
| assassin | High SPD/CRIT, lower HP. |
| support | High SUPPORT, moderate DEF, low ATK. |
| controller | High CONTROL/SPD, low direct damage. |
| minion | Lower total stats, narrow support or pressure role. |
| boss | High HP, strong SKILL, special BOSS pattern budget. |

Intent model:

- `attack`: direct damage.
- `guard`: protect self or ally.
- `cast`: skill action next.
- `support`: heal/buff enemy party.
- `control`: debuff or delay player team.
- `summon`: create minion, boss only or special caster.
- `charge`: delayed high-impact action.

Boss/minion distinction:

- Boss has stronger intent and phase behavior.
- Minions should create tactical target priorities, not just inflate HP totals.
- Boss skills may reference minion count or protected states.

## 7. Team Turn Input + SPD Execution

12-29A recommends team-turn as the first direct battle mode. SPD should still matter.

Model:

```text
Input phase:
  Player chooses hunter and shadow actions.
  Monster intents are selected or revealed.

Queue phase:
  All chosen player actions and monster actions enter ActionQueue.

Execution phase:
  Actions are sorted by SPD + action priority + skill priority.
  Reactions can interrupt under specific timing rules.
```

This gives:

- simple player input
- meaningful SPD
- room for scout/hunter identity
- clear reaction timing for guard/support/passive

Priority sources:

- unit SPD
- action base priority
- skill priority
- role modifier
- status effect modifier
- guard/reaction special timing

Examples:

- Fast scout marks an enemy before the hunter attacks.
- Guard action can create a protect state before enemy attacks if chosen.
- Slow heavy skill can resolve after faster enemy actions.
- Survival passive can interrupt lethal damage regardless of normal queue order, subject to cap.

## 8. ActionQueue Design

`ActionQueue` is the ordered list of actions and reactions to resolve.

ActionQueue item candidates:

| Field | Purpose |
| --- | --- |
| `queueId` | Runtime id for the queued item. |
| `actorUnitId` | Unit taking the action. |
| `actorType` | Hunter/shadow/monster/boss/minion. |
| `team` | Player or enemy. |
| `actionId` | Runtime action id. |
| `actionType` | Basic, skill, guard, support, item, wait, reaction, passive. |
| `targetIds` | Resolved or intended targets. |
| `basePriority` | Priority from action kind. |
| `speedPriority` | Priority from actor SPD. |
| `skillPriority` | Priority from skill or passive. |
| `finalPriority` | Final sortable value. |
| `timing` | Timing bucket. |
| `isReaction` | Whether this item can interrupt. |
| `sourceSkillId` | Active skill id if any. |
| `sourcePassiveId` | Passive id if any. |
| `effectKind` | Damage, guard, control, support, etc. |
| `actionCue` | Log/2.5D cue. |
| `animationCue` | Future animation hook. |
| `effectColor` | Future effect color. |

Timing candidates:

- `player_selection`
- `round_start`
- `before_action`
- `normal_action`
- `after_action`
- `reaction`
- `passive_trigger`
- `round_end`

Resolution principle:

- Normal actions sort by `finalPriority`.
- Reactions can insert into `before_action`, `reaction`, or `after_action` timing.
- Passive triggers must obey per-round and per-passive caps.

## 9. Guard / Support / Passive Reaction Timing

Guard, support, and passive effects need reaction timing to matter.

Guard:

- Guard action does not immediately attack.
- It creates `guard` or `protect` status.
- If a protected ally is targeted, the guard unit can intercept.
- Intercept can reduce damage, redirect damage, or trigger counter.

Support:

- Support action may heal immediately or apply a buff.
- Support passive may trigger when an ally drops below a threshold.
- Cooldown support should be capped to prevent infinite skill loops.

Counter:

- Counter passive can trigger after successful guard or after being hit.
- Counter should have per-round cap and cooldown/lockout.

Survival:

- Survival passive can trigger at low HP or lethal damage.
- It should not fully prevent all defeat loops.
- It should have strict lockout and clear trigger wording.

Reaction caps:

| Reaction Type | First-Pass Cap |
| --- | --- |
| guard intercept | 1 per guard unit per round. |
| survival save | 1 per unit per battle or long cooldown. |
| support emergency | 1 per support unit per round. |
| counter | 1 per unit per round. |
| unique passive | strict individual cooldown. |

## 10. Targeting Structure

BattleUnit targeting should be shared across hunter, shadows, and monsters.

Target types:

- `self`
- `single_ally`
- `all_allies`
- `single_enemy`
- `all_enemies`
- `lowest_hp_ally`
- `lowest_hp_enemy`
- `highest_threat_enemy`
- `boss`
- `minion`
- `protected_ally`
- `front_lane`
- `rear_lane`

Role targeting rules:

| Actor/Role | Typical Targets |
| --- | --- |
| assault | Single enemy, boss, low HP enemy. |
| hunter-role shadow | Single enemy, lowest HP enemy, marked enemy. |
| guard | Ally, protected ally, self, party. |
| support | Ally, all allies, lowest HP ally. |
| scout | Enemy, highest threat enemy, front/rear lane for marking. |
| analyst | Boss, caster/controller, highest DEF enemy, highest threat enemy. |
| monster bruiser | Hunter or front player unit. |
| monster assassin | Lowest HP ally or rear lane. |
| monster controller | Highest SKILL/SUPPORT player unit. |
| boss | Intent-specific target priority. |

Targeting must support:

- manual target selection
- default target suggestion
- auto target for quick command
- target validation if target dies before action resolves

If a selected target is gone:

- retarget using action fallback if allowed
- otherwise action fizzles safely
- never crash the runtime

## 11. Status Effect Model

Status effects should be common across all BattleUnits.

Candidate fields:

| Field | Purpose |
| --- | --- |
| `statusId` | Runtime status id. |
| `definitionId` | Optional source definition id. |
| `name` | Display name. Hidden sources must use safe names. |
| `type` | Status category. |
| `sourceUnitId` | Unit that applied it. |
| `targetUnitId` | Unit receiving it. |
| `durationRounds` | Remaining duration. |
| `stackCount` | Current stacks. |
| `maxStacks` | Maximum stacks. |
| `effectValue` | Numeric magnitude. |
| `dispellable` | Whether it can be removed. |
| `timing` | When it applies or ticks. |
| `sourceSkillId` | Optional skill source. |
| `sourcePassiveId` | Optional passive source. |

Status candidates:

- `attackUp`
- `attackDown`
- `defenseUp`
- `defenseDown`
- `speedUp`
- `speedDown`
- `guard`
- `protect`
- `mark`
- `weakness`
- `suppression`
- `stun`
- `silence`
- `cooldownReduction`
- `healOverTime`
- `shield`

First-pass status set should be small:

- `attackUp`
- `defenseDown`
- `speedDown`
- `guard`
- `protect`
- `mark`
- `weakness`
- `suppression`
- `shield`

Deferred:

- stun/silence chains
- complex dots/hots
- dispel rules
- boss-specific scripted statuses
- position-changing statuses

## 12. Direct Battle Runtime Migration Strategy

Recommended implementation sequence:

| Step | Goal |
| --- | --- |
| `12-29C` | Implement BattleUnit / BattleStat helper code with mock data only. |
| `12-29D` | Implement ActionQueue + team-turn mock battle runtime. |
| `12-29E` | Add Monster Party data model + mock encounter definitions. |
| `12-29F` | Connect optional direct battle mode to Gate. |
| `12-29G` | Connect optional direct battle mode to Infinite Tower. |
| `12-29H` | Plan bridge absorption/replacement for existing support actions. |
| `12-29I` | Start 2.5D BattleBoard design/implementation. |

Migration guardrails:

- Keep current combat active while the new runtime is experimental.
- Use mock battles before connecting Gate/Tower.
- Do not change rewards while runtime is being validated.
- Do not add save schema until runtime state needs persistence.
- Keep battle result payload compatible with existing reward/log systems.

## 13. Relationship to Existing Systems

Existing systems should be reused, not thrown away.

Keep:

- 12-28H support-action bridge until replacement is stable.
- 12-28L/S `ShadowActionRuntime` as transitional capped runtime.
- `ShadowCombatUnitProfile` as the shadow conversion source.
- `ShadowActionEvent` metadata as the basis for direct action/passive events.
- `equipmentPower` as a stat explanation and slot-role signal.
- existing Gate/Tower reward and result flow.

New direct runtime should:

- build `BattleUnit` objects from hunter, equipped shadows, and monster party definitions.
- translate shadow raw stats into shared combat stats.
- translate hunter/equipment state into shared combat stats.
- translate monster definitions into shared combat stats.
- emit battle logs compatible with current result panels where possible.

## 14. UI Display Principles

Combat UI should stay readable despite more units.

Main battle display:

- HP
- ATK
- DEF
- SPD
- SKILL

Selected unit detail:

- CRIT
- CONTROL
- SUPPORT
- SURVIVAL
- BOSS
- SYNERGY
- status effects
- cooldowns

Shadow advanced detail:

- raw 13 shadow stats in collapsible panel.
- active/passive source labels only for owned/revealed shadows.
- hidden locked named details remain sealed.

Action buttons:

- 2-4 visible actions per unit.
- Basic attack / skill / guard / wait as first-pass base.
- Target selection should be tap-based.
- Mobile 390px must remain usable.

2.5D later:

- Unit plate can use HP and compact stat icons.
- Tooltip/selected panel can show full shared stats.
- Raw shadow stats should remain optional detail, not board clutter.

## 15. 2.5D Readiness

BattleUnit, BattleStat, ActionQueue, and StatusEffect should feed the future 2.5D battle board.

2.5D-relevant fields:

- `unitType`
- `team`
- `boardLane`
- `currentHp`
- `maxHp`
- `statusEffects`
- `actionCue`
- `animationCue`
- `effectColor`
- selected target ids
- action timing
- reaction timing
- intent marker

2.5D should not invent combat rules. It should display:

- unit placement
- queued action
- target relation
- guard/protect relation
- passive trigger
- boss intent
- status changes

No 2.5D implementation belongs in this step.

## 16. Balance Principles

Shared stat conversion must avoid runaway battle power.

Principles:

- Shadows should feel like allies, not replacements for the hunter.
- Three shadows should create more decisions, not automatic wins.
- HP/DEF inflation must be controlled or battles become too long.
- SPD must matter without making scout/hunter roles mandatory.
- Support should not create infinite sustain.
- Control needs boss resistance, cooldowns, or diminishing returns.
- Named/legendary units should be strong through identity, not unlimited throughput.
- Monster parties should scale by role pressure, not only raw HP.
- Bosses should reward guard/support/control decisions without requiring one exact solution.

Conversion guardrails:

- Use caps and diminishing returns on derived secondary stats.
- Keep first-pass enemy counts small.
- Avoid stacking multiple support cooldown effects without lockouts.
- Let low-rarity high-grade shadows be good in-role without unique effects.

## 17. Explicitly Out of Scope

Do not implement in 12-29B:

- Code changes.
- Direct battle runtime.
- Monster mass creation.
- Gate/Tower connection.
- 2.5D board.
- UI implementation.
- Save structure changes.
- Persist version changes.
- localStorage key changes.
- Combat formula changes.
- Reward/economy/shop/probability changes.
- Hidden named detail exposure.

## 18. Verification Notes

- Document-only design step.
- `git diff --check` is sufficient verification.
- No build is required because no runtime code should change.
- No localStorage, persist, save schema, combat value, reward, gate, monster, shop, economy, probability, or hidden-information behavior changes are part of this step.
