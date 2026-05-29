# 12-44A Hardcore Gate Echo

## Gate Echo generation

- On daily reset, the previous active daily cycle is inspected.
- Incomplete daily quests and selected but incomplete challenge cards are grouped by Echo category.
- One Gate Echo is created per category.
- `missedCount` is the number of missed items in that category.
- `strengthLevel` starts from `missedCount`.
- `lastEchoGeneratedForDate` prevents duplicate generation for the same day.

## Echo categories

- `focus`: scattered focus pressure.
- `study`: delayed study and memory pressure.
- `work`: unfinished work/project pressure.
- `exercise`: heavy body-readiness pressure.
- `routine`: routine/sleep/mind pressure.
- `cleanup`: cleanup/organization pressure.
- `health`: health signal pressure.
- `custom` / `unknown`: fallback for uncategorized or one-off items.

## Scaling

- Base multiplier: `1.2 + min(missedCount - 1, 3) * 0.3`.
- Extra multiplier after 4 missed items: `0.1` per item.
- Final cap: `2.7`.
- Echoes use the existing Direct Battle unit system and are tuned as strong single enemies, not Red Gate bosses.

## Lock policy

Gate Echo active blocks:

- Gate battle / GateRun progress
- Infinite Tower battle
- Promotion Exam start
- New Shadow Expedition start

Allowed while Echo is active:

- Gate Echo battle
- Daily quests
- Focus sessions
- Shadow collapse restoration
- Inventory/profile/settings/backup viewing

## Hardcore death reset

- If hardcore mode is enabled and the hunter/player dies in combat, progress resets.
- Player death is decisive even if shadows are alive.
- Before reset, a snapshot is saved to `levelup-save-hardcore-backup`.
- The normal save key remains `levelup-save`.
- Backup metadata includes timestamp, reason, battle context, player level, and backup key.

## Shadow collapse

- Direct Battle shadow units with 0 HP become `collapsed` instead of being deleted.
- Collapsed shadows cannot be equipped or sent on expeditions.
- Restoration spends shadow essence.
- Crystallization is user-confirmed in the Shadow UI and refunds part of the restoration cost.
- High-grade or named collapsed shadows receive an extra confirmation message before crystallization.

## Manual test checklist

- Leave daily quests incomplete, advance daily reset, confirm category Echo creation.
- Confirm same-category misses increase `strengthLevel`.
- Confirm Gate/Tower/Promotion/Expedition actions are blocked while Echoes are active.
- Confirm Daily/Focus/Echo battle/Shadow restore remain available.
- Clear Echoes and confirm the lock is released.
- Lose a combat with hunter HP at 0 and confirm backup plus reset.
- Confirm a defeated shadow becomes collapsed, can be restored with essence, and can be crystallized only by choice.
