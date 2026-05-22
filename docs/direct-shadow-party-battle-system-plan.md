# 12-29A Direct Shadow Party Battle System Plan

## Scope

This is a design document for moving LEVEL UP combat from a hunter-centered battle with shadow support actions toward a directly controlled many-vs-many turn-based battle:

```text
Hunter + Shadow Party vs Monster Party
```

This step does not implement code, change combat formulas, change save structure, alter rewards, change monster/gate values, build UI, or implement 2.5D combat. The 2.5D board is a future visualization layer for the battle model described here.

## 1. Current Combat Diagnosis

Current Gate and Infinite Tower combat is still hunter-centered.

- The hunter is the primary actor.
- Shadows are equipped as support units.
- Shadow effects enter combat through stat bonuses, support action rolls, and capped `ShadowActionEvent` runtime events.
- The current runtime can make shadows feel more distinct, but it does not make them independent tactical units.

The 12-28 bridge layers should be understood as transitional:

- `12-28H`: adds thin shadow stat modifiers to existing support action logic.
- `12-28L`: adds the first limited `ShadowActionEvent` runtime layer for Gate/Tower.
- `12-28S`: expands effectKind, trigger, statScaling, and metadata interpretation while preserving caps.

These bridge layers are valuable because they let current combat benefit from Shadow v2 data without destabilizing the game. They are not the final battle system.

Why the current structure is insufficient for independent shadows:

- A shadow cannot be selected as the current actor.
- A shadow cannot choose a target.
- A shadow cannot spend an active skill intentionally.
- Monster intent is mostly directed at the hunter.
- Guard, support, control, and positioning cannot fully matter when there is only one real player-side body.
- Passive triggers can exist, but their tactical context is too narrow.

The important design conclusion is:

- 2.5D combat is only presentation.
- Independent shadow units require a combat mechanism change first.
- The battle model must support multiple allied actors and multiple enemy actors before a 2.5D board can meaningfully visualize it.

## 2. Final Combat Target

The final combat shape is:

```text
Hunter + 1-3 Shadows vs 1-3 Monsters
```

Recommended progression:

| Progress Stage | Allied Party | Enemy Party | Use Case |
| --- | --- | --- | --- |
| Early | Hunter + 1 Shadow | 1-2 monsters | First direct-control tutorial, low input load. |
| Mid | Hunter + 2 Shadows | 2 monsters | Role synergy begins to matter. |
| Late | Hunter + 3 Shadows | 2-3 monsters | Full tactical party battle. |
| Boss | Hunter + 3 Shadows | Boss + 1-2 minions | Intent reading, guard, control, and target priority matter. |

The hunter remains important, but shadows become independent combat units instead of modifiers attached to the hunter.

## 3. Direct Control Model

The user should directly command both the hunter and equipped shadows.

First-pass round loop:

```text
Round start
  -> refresh round triggers and monster intents
  -> player chooses hunter action
  -> player chooses each shadow action
  -> selected actions resolve
  -> monsters act
  -> passive / trigger events resolve
  -> cooldowns, durations, deaths, rewards, and round state update
Round end
```

Available shadow actions:

- Basic attack
- Active skill
- Guard / defend
- Wait / charge
- Target selection
- Role-specific command, limited by role and skill set

Role-specific examples:

| Role | Optional Command Candidates |
| --- | --- |
| assault | Execute, burst strike, focus boss. |
| guard | Protect ally, intercept, hold line. |
| hunter | Chase marked target, finish wounded target. |
| scout | Mark target, reveal intent, quick evade. |
| support | Heal, stabilize, reduce cooldown. |
| analyst | Analyze weakness, suppress boss, control lock. |

Passives:

- Trigger automatically.
- Must have clear trigger timing.
- Must use cooldown, lockout, or per-round caps.
- Should never ask the player to manually confirm every passive trigger.

## 4. Control Burden Limits

Direct control can become tiring quickly, so the system should scale slowly.

Principles:

- Start with only one equipped shadow in direct-control combat.
- Unlock second and third direct-control shadow slots through progression.
- Keep each shadow to 2-4 visible choices.
- First implementation should use basic attack, one active skill, guard, and wait.
- Role-specific actions should appear only when they are meaningful.
- Auto and semi-auto are future quality-of-life candidates, not the first implementation.

Suggested command density:

| Unit Type | First-Pass Choices |
| --- | --- |
| Hunter | Basic attack, equipped skill, defend, item or special if already supported. |
| Common shadow | Basic attack, role skill, defend/wait. |
| Rare/epic shadow | Basic attack, active skill, guard/wait, one role command. |
| Legendary/named shadow | Basic attack, unique active, guard/wait, role command, passive auto triggers. |

Quick command candidates:

- Auto-target lowest HP enemy.
- Repeat last round action.
- Recommended action based on role.
- Guard all low-HP allies.

## 5. Shadow Unit Combat Role

The existing Shadow v2 model should feed the new battle runtime rather than be replaced.

Relevant current foundations:

- `ShadowCombatUnitProfile`
- 13 shadow stats
- active skill definitions
- passive definitions
- source labels: `GENERIC`, `TEMPLATE`, `PROTOTYPE`, `UNIQUE`
- action metadata: `actionCue`, `animationCue`, `effectColor`, `boardLane`, `impactTiming`, `logCue`, `runtimeCategory`

### 13 Shadow Stats in Direct Battle

| Stat | Direct Battle Meaning |
| --- | --- |
| `shadowAttack` | Basic attack and active damage baseline. |
| `shadowDefense` | Damage reduction while guarding or intercepting. |
| `shadowDurability` | Max HP, shield duration, guard persistence, cooldown reliability. |
| `shadowSpeed` | Action order, wait/charge gain, initiative, timeline position later. |
| `shadowCrit` | Critical chance or high-roll damage for attack skills. |
| `shadowFinisher` | Low-HP target bonuses and execute skills. |
| `shadowControl` | Marking, evasion down, intent delay, target disruption. |
| `shadowSuppression` | Boss/elite control, pattern weakening, cast interruption. |
| `shadowSupport` | Healing, buff strength, cooldown assistance. |
| `shadowSurvival` | Emergency guard, self-preservation, low-HP passives. |
| `shadowBossing` | Boss targeting, boss-only damage/control bonuses. |
| `shadowExpedition` | Mostly ignored in battle or used only as a weak secondary cue. |
| `shadowSynergy` | Combo passives, ally buffs, role-chain reliability. |

### Role Behavior

| Role | Direct Unit Identity |
| --- | --- |
| assault | Direct damage, burst windows, execute pressure. |
| guard | Protect allies, intercept attacks, taunt, block damage. |
| hunter | Chase, mark prey, chain hit, finish wounded enemies. |
| scout | First action, mark targets, weaken enemy intent, evade. |
| support | Heal, buff, cooldown, stabilize long fights. |
| analyst | Expose weakness, suppress boss patterns, control priority targets. |

### ShadowActionEvent Evolution

The current `ShadowActionEvent` should evolve from "support event attached to hunter combat" into a generic event emitted by direct unit actions and passive triggers.

Future event categories:

- `unit_action`: chosen active action by hunter or shadow.
- `passive_trigger`: automatic passive trigger.
- `reaction`: guard, counter, intercept, survival event.
- `status_apply`: buff/debuff/status effect.
- `cooldown_event`: cooldown reduction or lockout.
- `visual_hint`: metadata-only cue for later 2.5D.

`ShadowCombatRuntimeState` should later expand from per-round event caps into direct unit state:

- current cooldowns by unit and skill id
- charge / readiness
- passive lockouts
- guard target
- marked target ids
- action already chosen this round
- temporary status effects
- per-round trigger history

## 6. Monster Party Structure

Many-vs-many combat requires monsters to become units instead of a single target.

Monster unit roles:

| Role | Purpose |
| --- | --- |
| bruiser | Basic attack pressure. |
| tank | High HP/defense, protects enemies. |
| caster | Skill-based damage, delayed intent. |
| assassin | Fast single-target pressure. |
| support | Heal, shield, buff. |
| controller | Debuff, delay, silence, target disruption. |
| minion | Boss support, summoned unit, expendable pressure. |
| boss | Major threat with phases and special intent. |

Every monster unit should eventually have:

- HP
- attack
- defense
- speed
- role
- intent
- skill list
- target priority
- boss flag
- minion flag
- status effects
- action cue metadata

First-pass monster party examples:

| Encounter | Party Shape |
| --- | --- |
| Small gate | 1 bruiser or 1 bruiser + 1 minion. |
| D/C gate | bruiser + caster or tank + assassin. |
| B/A gate | 2-role party with support/controller option. |
| Boss gate | boss + minion, or boss + support minion. |
| Tower boss | boss + rotating summon/minion pattern. |

## 7. Turn Order Options

### Candidate A: Team Turn

Flow:

```text
Player selects all allied actions
Allied actions resolve
Enemy actions resolve
Round cleanup
```

Pros:

- Easier to understand.
- Easier to implement.
- Works well on mobile.
- Lets the user plan all shadow actions together.
- Lower risk for the first prototype.

Cons:

- Speed is less expressive.
- Reactive play is weaker.
- Some scout/assassin identity needs special rules.

### Candidate B: Speed Timeline

Flow:

```text
All units enter a timeline
Fast units act earlier
Each action advances time / readiness
```

Pros:

- More tactical.
- Speed, scout, assassin, cooldown, and delay effects matter naturally.
- Easier to make boss intent timing dramatic later.

Cons:

- More complex state management.
- More UI burden.
- Harder on mobile.
- Riskier to integrate with current Gate/Tower combat.

### Recommendation

Use Candidate A, team turn, for the first implementation.

Reason:

- The first goal is to prove direct shadow control.
- The user can command hunter and shadows without timeline overload.
- `shadowSpeed` can still matter through initiative bonuses, first action perks, quick skills, and later timeline migration.
- Candidate B should remain the long-term advanced mode after the battle unit model is stable.

## 8. Targeting System

Targeting becomes a first-class system in many-vs-many combat.

Target types:

- Single enemy
- All enemies
- Single ally
- All allies
- Self
- Front enemy
- Back enemy
- Lowest HP enemy
- Highest threat enemy
- Boss only
- Minion only

Targeting rules:

| Action Type | Targeting Need |
| --- | --- |
| damage | enemy single, enemy all, front priority, boss priority. |
| finisher | lowest HP enemy or target below threshold. |
| guard | ally single, self, all allies for rare/unique skills. |
| support | lowest HP ally, selected ally, all allies. |
| control | caster/controller/boss priority or selected enemy. |
| scout | enemy intent target or all enemies for mark. |
| analyst | boss, highest defense enemy, highest threat enemy. |

Guard targeting:

- Guard unit can protect one ally.
- Some guard skills can protect the party for one incoming hit.
- Taunt can redirect attacks from low-HP allies.

Boss/minion priority:

- Bossing skills prefer boss targets.
- Hunter/finisher skills can choose wounded minions to reduce pressure.
- Analyst can suppress boss intent or strip minion protection.

## 9. Skill and Passive Interpretation

Current 104-shadow skill/passive definitions should be interpreted gradually.

### First-Pass Supported Effects

| Effect Family | First-Pass Interpretation |
| --- | --- |
| damage | Direct damage to selected enemy. |
| finisher | Bonus damage when target HP is below threshold. |
| guard | Reduce incoming damage, protect selected ally. |
| survival | Auto guard/self shield when HP is low. |
| control | Apply defense/evasion/speed down or delay intent. |
| bossing | Weak bonus/control only when boss target exists. |
| support | Heal, attack/defense buff, cooldown support. |
| tempo | Charge/readiness bonus or cooldown reduction. |
| synergy | Small ally buff or combo reliability. |
| unique | Same families above, stronger identity, strict caps. |

### Deferred Effects

Defer these until the runtime and UI are stable:

- Complex multi-step combos.
- Multi-round trap fields.
- Full timeline manipulation.
- Position-changing attacks.
- Summoned ally shadows.
- Boss phase-specific unique scripts.
- Cross-shadow named quotes or cinematic cut-ins.

Design rule:

- Do not force every existing `effectKind` to be fully supported on day one.
- Unsupported effects should degrade to safe generic damage, guard, support, or no-op behavior.
- Named/hidden unique details must only surface for owned/unlocked shadows.

## 10. Gate/Tower Migration Strategy

Replacing current Gate/Tower combat immediately is too risky. The new system should run beside the existing system first.

Suggested steps:

| Step | Goal |
| --- | --- |
| `12-29B` | Design Monster Party / Battle Unit data model. |
| `12-29C` | Build separate many-vs-many runtime prototype with mock/test battle only. |
| `12-29D` | Add optional new battle mode to Gate behind a flag or isolated path. |
| `12-29E` | Add optional new battle mode to Infinite Tower. |
| `12-29F` | Gradually absorb existing support action bridge into direct unit runtime. |
| `12-29G` | Start 2.5D battle board design/implementation. |

Migration principles:

- Keep old combat playable during the transition.
- Do not change reward tables during the battle model prototype.
- Do not migrate save structure until the runtime has proven stable.
- Keep battle result shape compatible with existing logs/rewards where possible.

## 11. Relationship to 12-28H / 12-28L / 12-28S

Current support action and `ShadowActionRuntime` should not be removed yet.

Relationship:

- `12-28H` remains the lightweight bridge for current combat.
- `12-28L/S` remain the capped ShadowActionEvent bridge.
- New many-vs-many runtime should reuse skill/passive/profile definitions.
- New runtime should convert `ShadowActionEvent` ideas into direct unit actions and passive events.
- Once stable, the direct runtime can absorb or replace support-action logic.

In other words:

```text
Current:
  Hunter action -> shadow support modifier/event

Future:
  Hunter action + Shadow unit action + Shadow passive event -> battle state
```

## 12. 2.5D Battle Readiness

2.5D should visualize the direct battle system, not define it.

Data needed for later 2.5D:

- shadow `actionCue`
- monster `actionCue`
- board lane
- unit position
- selected target
- attack animation hook
- guard animation hook
- support aura hook
- boss intent marker
- passive trigger visual hook
- hit / guard / miss / down state

Suggested board lanes:

| Lane | Typical Units |
| --- | --- |
| front | hunter, assault, guard, bruiser, tank. |
| flank | hunter, scout, hunter-role shadows, assassin. |
| rear | support, analyst, caster, controller. |
| boss | boss anchor position. |

This document does not implement the 2.5D board.

## 13. UI/UX Draft

Direct many-vs-many combat needs compact, repeatable controls.

Core panels:

- Allied party panel
- Enemy party panel
- Current selected unit
- Action buttons
- Target selection
- Turn/round indicator
- Status effect chips
- Skill cooldown display
- Battle log

Recommended desktop layout:

```text
[ Enemy Party / Intent ]
[ Battle Space ]
[ Allied Party ]
[ Selected Unit Actions + Log ]
```

Recommended mobile 390px layout:

```text
Enemy row
Compact battle area
Ally row
Selected unit action bar
Collapsible log/status
```

Mobile constraints:

- Keep action buttons to 2 columns.
- Show only 2-4 actions for the selected unit.
- Use icon + short label.
- Put detailed skill text behind press/hold or details.
- Avoid requiring drag targeting.
- Tap action, tap target, confirm automatically unless the action is high impact.

Selection flow:

```text
Select unit -> choose action -> choose target -> action queued
```

Optional quick flow:

```text
Tap recommended action -> auto target -> action queued
```

## 14. Difficulty and Balance Principles

Many-vs-many combat changes both difficulty and battle length.

Principles:

- Normal gates should stay short.
- Boss battles can be longer and more strategic.
- Early game starts with one shadow.
- Monster count increases gradually.
- Rarity and unique skills should feel good but not guarantee auto-win.
- Guard/support/control must matter, not only damage.
- Minions should create target-priority decisions, not just extra HP.
- Boss intent should reward scout/analyst/guard planning.

Battle length targets:

| Encounter Type | Target Length |
| --- | --- |
| Early normal gate | 2-4 rounds. |
| Mid normal gate | 3-5 rounds. |
| Hard gate | 4-7 rounds. |
| Boss gate | 6-10 rounds. |
| Tower boss | 6-12 rounds, depending on floor. |

Balance guardrails:

- One shadow should not replace the hunter.
- Three shadows should add options, not remove risk.
- Support must not create infinite sustain.
- Guard must not permanently negate all damage.
- Control must have boss resistance or cooldown gates.
- Unique named skills should have strong identity and strict lockouts.

## 15. Do Not Implement in This Step

Explicitly out of scope for 12-29A:

- 2.5D implementation.
- Real battle runtime implementation.
- Existing Gate/Tower replacement.
- Monster mass creation.
- Full battle UI implementation.
- Balance number changes.
- Save structure changes.
- Persist version changes.
- localStorage key changes.
- Reward/economy/probability changes.
- Hidden named detail exposure.

## 16. Hidden Protection

Direct battle must preserve the existing hidden rules.

- `hiddenUntilObtained` targets cannot show real names, portraits, quotes, unique skill/passive names, trigger conditions, or unique cues before obtained.
- Locked gate named units should use sealed wording only.
- Internal docs and runtime definitions can reference ids, but user-facing locked UI must not expose details.
- Future battle preview, enemy log, 2.5D cue, and codex views must degrade sealed unique details to generic role wording.

## 17. Recommended Next Work

Recommended follow-up sequence:

| Step | Description |
| --- | --- |
| `12-29B` | Monster Party / Battle Unit data model design. |
| `12-29C` | Separate many-vs-many runtime prototype and mock battle simulation. |
| `12-29D` | Optional Gate connection, isolated from current production combat. |
| `12-29E` | Optional Infinite Tower connection. |
| `12-29F` | Bridge layer absorption plan and support-action cleanup. |
| `12-29G` | 2.5D board design and first visual implementation. |

## Verification Notes

- Document-only design step.
- No code runtime, UI, combat formula, save schema, reward, shop, economy, probability, localStorage, or persist changes.
- `git diff --check` is sufficient verification for this step.
