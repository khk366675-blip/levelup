# 12-28O Shadow 104 Skill/Passive Expansion Plan

## Scope

This document is a planning artifact for expanding the current Shadow Combat System v2 skill/passive/profile layer from the first 12 samples to all 104 entries in `SHADOW_DEFINITIONS`.

No code, save structure, combat formula, UI, reward, economy, localStorage key, or persist version changes are part of this step.

The current 12 prototype/unique-linked shadows are validation samples, not the final coverage target. The final target is that every shadow has a clear role-based active/passive profile, with stronger individuality for named, legendary, achievement, and gate named shadows.

## Expansion Principles

- Every shadow should have at least one role-based active/passive candidate.
- Not every shadow needs a fully unique skill, but every shadow should differ by role, rarity, innateGrade, source lineage, or named status.
- Common and uncommon shadows should stay readable and simple.
- Rare and epic shadows should introduce stronger role identity and one clear condition or tempo.
- Legendary non-hidden shadows should feel advanced, but not automatically stronger than all S-grade lower rarity shadows in every context.
- Named, achievement named, and gate named shadows should receive unique skill/passive treatment when obtained or user-facing unlock conditions allow it.
- `hiddenUntilObtained` and sealed gate named targets must not expose unique skill/passive names, quotes, portraits, exact conditions, or identity in locked user-facing UI.
- Skill/passive design should preserve existing stat/profile helpers and runtime caps. New effects should route through capped or diminishing-return paths.
- 2.5D action cues should be metadata hooks, not visual implementation in this phase.

## Phase Plan

| Phase | Target | Output | Notes |
| --- | --- | --- | --- |
| Phase 1 | common/uncommon general shadows | generic role active/passive pools | Simple, stable, low-specialty skills. Avoid heavy unique handling. |
| Phase 2 | rare/epic general shadows | role + rarity variants and prototype-specific profiles | Add one clear trigger, timing, or tactical identity. |
| Phase 3 | legendary general shadows | advanced non-named templates | Use bossing, finisher, survival, synergy, or command tempo without guaranteed dominance. |
| Phase 4 | named/gate/achievement shadows | unique skill/passive candidates | Hidden gate named unique details stay sealed until obtained. |
| Phase 5 | 2.5D cue cleanup | action cue and animation hook taxonomy | Metadata only; no 2.5D combat implementation here. |

## Assignment Types

| Type | Meaning | Default Use |
| --- | --- | --- |
| `GENERIC_ROLE_ONLY` | Uses only generic role pool skills/passives. | common/uncommon general shadows. |
| `ROLE_TEMPLATE_PLUS` | Uses role pool plus rarity/source variation. | rare/epic general shadows. |
| `PROTOTYPE_SPECIFIC` | Has a specific prototype profile reflecting its identity. | current 12 samples and future standout non-named shadows. |
| `UNIQUE_NAMED` | Needs named unique skill/passive, quote/action cue candidate, and stronger identity. | achievement named and visible named shadows. |
| `SEALED_UNIQUE_HIDDEN` | Needs unique handling, but user-facing details are sealed until obtained. | `hiddenUntilObtained` / gate named targets. |

## Shadow Classification Table

Legend: `Ach` = achievement named, `Gate` = gate named, `Hidden` = `hiddenUntilObtained`, `Sample12` = already linked in the 12-sample layer.

| Shadow ID | Role | Rarity | Ach | Gate | Hidden | Sample12 | Assignment | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `shadow-rat` | scout | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `rift-remnant` | support | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `dim-scribe` | analyst | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `shadow-sentry` | guard | common | - | - | - | Y | PROTOTYPE_SPECIFIC | Phase 2/4 sample |
| `rift-mender` | support | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `shadow-scout` | scout | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `rift-fang` | assault | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `dark-vanguard` | hunter | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `black-claw` | assault | rare | - | - | - | Y | PROTOTYPE_SPECIFIC | Phase 2/4 sample |
| `rift-tracker` | hunter | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `paper-wisp` | analyst | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `ash-helper` | support | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `dull-blade` | assault | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `cracked-guard` | guard | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `ember-mender` | support | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `archive-reader` | analyst | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `mist-runner` | scout | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `bone-picker` | hunter | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `rift-librarian` | analyst | rare | - | - | - | Y | PROTOTYPE_SPECIFIC | Phase 2/4 sample |
| `oath-carrier` | support | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `ner-first-rift` | scout | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `rook-backstreet` | guard | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `lark-nest-fang` | assault | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `shadow-infantry` | assault | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `sloth-spawn` | guard | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `shadow-spearman` | assault | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `sloth-guard` | guard | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `shadow-annotator` | analyst | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `sloth-chorister` | support | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `shadow-chaser` | scout | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `dark-executor` | assault | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `black-shieldman` | guard | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `sloth-hunter` | hunter | rare | - | - | - | Y | PROTOTYPE_SPECIFIC | Phase 2/4 sample |
| `silent-archer` | scout | rare | - | - | - | Y | PROTOTYPE_SPECIFIC | Phase 2/4 sample |
| `drowsy-medic` | support | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `ledger-imp` | analyst | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `rust-axeman` | assault | common | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `lantern-scout` | scout | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `mire-shield` | guard | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `ravenous-pup` | hunter | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `minute-caller` | support | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `black-annotator` | analyst | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `sloth-raider` | hunter | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `sloth-knight` | guard | epic | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `archive-duelist` | analyst | epic | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `gorn-sloth-captain` | guard | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `shark-black-chaser` | scout | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `forgetting-recorder` | analyst | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `fatigue-guardian` | guard | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `rift-trainee` | assault | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `greed-hound` | hunter | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `forgetting-scribe` | analyst | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `fatigue-shieldman` | guard | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `rift-instructor` | support | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `greed-collector` | hunter | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `rift-wayfinder` | scout | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `forgetting-watcher` | analyst | epic | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `rift-tactician` | support | epic | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `fatigue-wall` | guard | epic | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `rift-gladiator` | assault | epic | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `greed-devourer` | hunter | epic | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `rift-cartographer` | scout | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `fatigue-cantor` | support | uncommon | - | - | - | - | GENERIC_ROLE_ONLY | Phase 1 |
| `greed-ledger` | analyst | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `corridor-banner` | support | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `mirror-hunter` | hunter | rare | - | - | - | - | ROLE_TEMPLATE_PLUS | Phase 2 |
| `iron-bastion` | guard | epic | - | - | - | Y | PROTOTYPE_SPECIFIC | Phase 2/4 sample |
| `rift-champion` | assault | epic | - | - | - | Y | PROTOTYPE_SPECIFIC | Phase 2/4 sample |
| `midnight-oracle` | support | epic | - | - | - | Y | PROTOTYPE_SPECIFIC | Phase 2/4 sample |
| `karden-forgetting-scribe` | analyst | legendary | - | Y | Y | Y | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `organ-fatigue-shield` | guard | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `raban-rift-instructor` | support | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `grid-greed-hound` | hunter | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `vela-rift-mender` | support | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `marn-backstreet-ledger` | analyst | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `doru-sloth-cantor` | support | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `sable-patrol-knife` | assault | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `mero-fatigue-reader` | analyst | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `tess-rift-wayfinder` | scout | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `balm-greed-ledger` | analyst | legendary | - | Y | Y | - | SEALED_UNIQUE_HIDDEN | Phase 4 |
| `kasim-analyst` | analyst | legendary | Y | - | - | Y | UNIQUE_NAMED | Phase 4 |
| `rao-market-watcher` | analyst | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `charka-finance-patron` | support | legendary | Y | - | - | Y | UNIQUE_NAMED | Phase 4 |
| `nebl-black-accountant` | analyst | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `volen-strategist` | support | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `verk-steel-knight` | assault | legendary | Y | - | - | Y | UNIQUE_NAMED | Phase 4 |
| `raven-running-shadow` | scout | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `moro-restraint-chef` | support | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `nok-sleep-keeper` | guard | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `baron-cutting-watcher` | guard | legendary | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `irnel-registrar` | support | legendary | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `kalt-deadline-executor` | scout | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `seron-saver` | hunter | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `lumen-dawn-vanguard` | scout | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `hexa-study-lantern` | support | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `mira-career-auditor` | analyst | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `borin-training-captain` | assault | legendary | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `sena-health-warden` | guard | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `orien-mind-anchor` | support | legendary | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `pavel-finance-scout` | scout | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `naru-social-herald` | support | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `voss-challenge-blade` | assault | legendary | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `runo-habit-keeper` | guard | epic | Y | - | - | - | UNIQUE_NAMED | Phase 4 |
| `elan-balance-weaver` | analyst | legendary | Y | - | - | - | UNIQUE_NAMED | Phase 4 |

## Role Skill/Passive Criteria

| Role | Active Direction | Passive Direction | Expedition/Profile Hooks | 2.5D Cue Family |
| --- | --- | --- | --- | --- |
| assault | burst, crit, execute, extra strike | finisher tempo, damage ramp, low-HP pressure | attack command, bossHuntPressure, shadowAttack, shadowFinisher | `dash_slash`, `finisher_cut`, `burst_impact` |
| guard | guard stance, intercept, counter | damage block, survival floor, retaliation | defend command, riskControl, supportStability, shadowDefense | `barrier_guard`, `intercept`, `counter_flash` |
| hunter | chase, mark prey, chain hit | loot sense, pursuit tempo, finishing pressure | attack/search command, bossHuntPressure, searchSense | `chase_dash`, `chain_strike`, `prey_mark` |
| scout | scan, first action, evasion/control | initiative, intent weakening, route reading | scout/search command, commandTempo, scoutUtility | `scan_mark`, `evade_shift`, `route_ping` |
| support | heal, buff, cooldown, stabilize | aura, damage smoothing, wave support | analyze/search/defend command, supportStability, synergyCoordination | `healing_pulse`, `cooldown_rune`, `stability_aura` |
| analyst | weakness analysis, boss suppression, control field | defense/evasion reduction, tactical index | analyze command, riskControl, bossHuntPressure, shadowControl | `weakness_grid`, `suppression_field`, `analysis_lock` |

## Rarity Quality Criteria

| Rarity | Skill/Passive Quality | Design Limit |
| --- | --- | --- |
| common | simple generic effect, short cooldown, stable trigger | no unique identity required; one role verb is enough. |
| uncommon | slightly specialized generic effect | may add source lineage flavor, but should stay template-based. |
| rare | one conditional effect or clearer role tempo | good place for `ROLE_TEMPLATE_PLUS` and selected prototypes. |
| epic | strong role identity and visible trigger | can use sharper cooldown/trigger/capped secondary effect. |
| legendary | advanced conditional effect with boss, finisher, survival, or synergy identity | must be capped; not automatic great success in combat/expedition. |
| named | unique skill/passive and quote/action cue candidate | hidden/gate named details only after obtained or safe unlock state. |

## InnateGrade Criteria

InnateGrade should mostly change the stability and growth of a skill, not replace the skill identity itself.

| InnateGrade | Expected Difference |
| --- | --- |
| C | lower reliability, weaker scaling, stricter trigger, or less cooldown stability. |
| B | standard reliability and baseline growth. |
| A | slightly better trigger rate, effect amount, growth, or cooldown stability. |
| S | clearly stable trigger, better growth, stronger cap approach, and smoother cooldown floor. |

## Evolution Criteria

Evolution should deepen a profile without forcing new unique identity on every general shadow.

| Evolution Stage | Skill/Passive Impact |
| --- | --- |
| Stage 1 | coefficient, duration, or trigger value improves. |
| Stage 2 | trigger condition loosens or cooldown floor improves. |
| Stage 3 | secondary role tag or minor passive side-effect can unlock. |
| Stage 4 | legendary/named candidates may strengthen their unique effect, still capped. |

## Current 12 Prototype Review

| Shadow ID | Role | Rarity / Named | Current Direction | Future Decision |
| --- | --- | --- | --- | --- |
| `shadow-sentry` | guard | common / normal | first-watch guard and low-rarity defensive vow sample. | Keep as low-rarity prototype proving common shadows can still have identity. |
| `black-claw` | assault | rare / normal | rupture, bleed-scent, burst/execute pressure. | Keep; use as rare assault prototype reference. |
| `rift-librarian` | analyst | rare / normal | weakness indexing and catalog control. | Keep; use as rare analyst reference. |
| `sloth-hunter` | hunter | rare / normal | prey tracking and expedition/search-compatible plunder sense. | Keep; use as hunter reward-sense reference without direct reward inflation. |
| `silent-archer` | scout | rare / normal | ranged silence, spacing, initiative. | Keep; use as scout tempo/control reference. |
| `iron-bastion` | guard | epic / normal | wall, anchor, survival floor. | Keep; use as epic guard durability reference. |
| `rift-champion` | assault | epic / normal | arena burst, extra attack, champion tempo. | Keep; use as epic assault tempo reference. |
| `midnight-oracle` | support | epic / normal | cooldown reset rhythm and cycle support. | Keep; use as epic support tempo reference. |
| `karden-forgetting-scribe` | analyst | legendary / gate hidden | sealed unique analyst profile; exact user-facing details must remain hidden until obtained. | Keep sealed; Phase 4 should define obtained-only unique copy and locked-card masking. |
| `kasim-analyst` | analyst | legendary / achievement named | unique analysis/sovereignty profile. | Keep; Phase 4 can add quote/action cue polish after visible unlock path is safe. |
| `charka-finance-patron` | support | legendary / achievement named | unique patron/aegis support profile. | Keep; Phase 4 can expand support and synergy identity. |
| `verk-steel-knight` | assault | legendary / achievement named | unique steel-command assault profile. | Keep; Phase 4 can expand finisher and discipline identity. |

## 104-Shadow Work Allocation Summary

| Assignment | Count | Recommended Implementation Step |
| --- | ---: | --- |
| `GENERIC_ROLE_ONLY` | 35 | 12-28P |
| `ROLE_TEMPLATE_PLUS` | 24 | 12-28P / 12-28Q |
| `PROTOTYPE_SPECIFIC` | 8 | Existing 12-sample layer plus future Phase 2 audit |
| `UNIQUE_NAMED` | 24 | 12-28R |
| `SEALED_UNIQUE_HIDDEN` | 13 | 12-28R with locked-state masking |

The count above treats the four current unique-linked named samples as either `UNIQUE_NAMED` or `SEALED_UNIQUE_HIDDEN`, not as separate prototype count. The eight non-named prototype samples remain `PROTOTYPE_SPECIFIC`.

## 2.5D Action Cue Criteria

Action cues are future metadata hooks. They should remain short, semantic, and role-readable.

| Role/Type | Cue Candidates | Visual Meaning Later |
| --- | --- | --- |
| assault | `dash_slash`, `finisher_cut`, `burst_impact` | quick forward motion, impact spike, execution timing. |
| guard | `barrier_guard`, `intercept`, `counter_flash` | defensive wall, ally protection, counter response. |
| hunter | `chase_dash`, `chain_strike`, `prey_mark` | target pursuit, chained hit, hunt pressure. |
| scout | `scan_mark`, `evade_shift`, `route_ping` | first read, dodge reposition, pathfinding/intent mark. |
| support | `healing_pulse`, `cooldown_rune`, `stability_aura` | recovery, cooldown tempo, party stabilization. |
| analyst | `weakness_grid`, `suppression_field`, `analysis_lock` | weak-point overlay, boss/control suppression, indexed target. |
| named | `unique_aura`, `quote_cut_in`, `signature_field` | obtained-only special presentation for named identities. |

## Hidden Protection Rules

- `hiddenUntilObtained`, `gate_named`, and sealed named entries must not expose unique skill/passive names, quotes, exact unlock identity, or portraits in user-facing locked UI.
- Development docs may record internal assignment types and implementation phases, but user-facing UI should only show generic locked language.
- Locked cards may show wording such as `sealed unique`, role silhouette, rarity envelope, or source category if already allowed by existing UI.
- Expedition, combat runtime, Codex, inventory, and reveal UI must only use actual owned/selected shadow data when resolving unique details.
- Any future 2.5D cue for sealed named targets must degrade to generic role cues before the target is obtained.

## Next Implementation Steps

- `12-28P`: common/uncommon/rare general shadow skill/passive expansion pass 1.
- `12-28Q`: epic/legendary general shadow expansion.
- `12-28R`: named/gate/achievement unique expansion with hidden masking.
- `12-28S`: improve `ShadowActionRuntime` interpretation for broader skill/passive coverage.
- `12-29A`: 2.5D combat system design, consuming role/profile/action cue metadata without changing the current plan retroactively.

## Verification Notes

- Document-only step.
- No code logic, combat formula, save schema, persist version, localStorage key, reward table, economy, UI, or VFX changes.
- `SHADOW_DEFINITIONS` count checked as 104 while drafting this plan.
