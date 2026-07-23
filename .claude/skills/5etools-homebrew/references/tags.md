# {@tag} syntax & 5.5e/2024 conventions

Tags in `entries` strings generate clickable dice rollers and hover tooltips.
Tag the **mechanics**; leave pure flavor plain. An untagged statblock still
loads — it just isn't interactive — so prioritize valid JSON first, rich tagging
second.

## Core combat tags

| Meaning | Tag | Renders as |
|---|---|---|
| Melee Weapon Attack | `{@atk mw}` | *Melee Weapon Attack:* |
| Ranged Weapon Attack | `{@atk rw}` | *Ranged Weapon Attack:* |
| Melee Spell Attack | `{@atk ms}` | *Melee Spell Attack:* |
| Ranged Spell Attack | `{@atk rs}` | *Ranged Spell Attack:* |
| Both melee & ranged | `{@atk mw,rw}` | *Melee or Ranged Weapon Attack:* |
| Hit modifier | `{@hit 5}` | +5 to hit |
| "Hit:" label | `{@h}` | ***Hit:*** |
| Damage (clickable) | `{@damage 1d6 + 2}` | clickable damage |
| Generic dice | `{@dice 1d20 + 4}` | clickable roll |
| Save DC | `{@dc 15}` | DC 15 |
| Recharge | `{@recharge 5}` | (Recharge 5–6) |
| Chance | `{@chance 50}` | 50 percent |
| Scaling damage | `{@scaledamage 3d6\|3-9\|1d6}` | scaling by slot |

## Cross-reference tags

Link to core rules or your own content. For **custom** content append the source
abbreviation with a pipe: `{@item Sword of the Setting|MCS}`.

| Meaning | Core | Custom |
|---|---|---|
| Spell | `{@spell fireball}` | `{@spell custom bolt\|MCS}` |
| Item | `{@item longsword}` | `{@item custom sword\|MCS}` |
| Creature | `{@creature goblin}` | `{@creature custom goblin\|MCS}` |
| Condition | `{@condition prone}` | `{@condition exhaustion\|xphb\|Exhaustion Level 1}` |
| Feat | `{@feat alert\|xphb}` | `{@feat ritual adept\|MCS}` |
| Skill / sense | `{@skill Perception}` | `{@sense darkvision}` |
| Action | `{@action Dash}` | — |
| Class feature | `{@classFeature Rage\|Barbarian\|PHB\|1}` | scoped to class+level |

Text formatting: `{@b bold}`, `{@i italic}`, `{@u underline}`. A pipe inside a
tag separates the display text from the reference target:
`{@spell dancing lights|xphb|faint light}` renders "faint light" but links the
spell.

## Pipe-syntax rule

`{@tag name|source|display}` — only `name` is required. Omit trailing segments
you don't need. Leaving `source` blank but adding a display uses a double pipe:
`{@item longsword||a fine blade}`. Malformed pipes are the #1 cause of broken
tags — count your braces.

## 5.5e / 2024 conventions

Because 5.5e is the primary ruleset, converted text should reflect the 2024
updates. These are about the **rendered wording and structure**, not just codes:

- **Species, not Race.** The JSON key may still be `race` for schema
  compatibility, but rendered descriptions should say "Species."
- **Weapon Mastery.** 2024 weapons have a mastery property (Cleave, Graze, Nick,
  Push, Sap, Slow, Topple, Vex). Label it in entries: `Weapon Mastery: {@b Cleave}`.
- **Subclasses at level 3.** All 5.5e subclasses are chosen at level 3 — keep
  converted class frameworks uniform on that milestone.
- **Origin Feats on backgrounds.** Backgrounds grant a specific Origin Feat and
  ability adjustments; wire them through the `feats` and `ability` arrays.
- **Linear exhaustion (1–6).** Tag it, e.g.
  `{@condition exhaustion|xphb|Exhaustion Level 1}`; don't restate the old 5e
  cumulative effects.
- **Action economy.** Use standard capitalized Action / Bonus Action / Reaction;
  avoid older ambiguous phrasing.

When a 2024 source (`XPHB`, `XMM`, `XDMG`) exists for a referenced core item,
prefer it in the `|source` segment over the 2014 book.
