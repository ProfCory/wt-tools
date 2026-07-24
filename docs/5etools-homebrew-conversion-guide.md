---
title: 5etools Homebrew Conversion Guide (5.5e / 2024)
type: reference
source: original
date: 2026-07-23
tags: [5etools, homebrew, json, conversion, dnd-2024]
---

# 5etools Homebrew Conversion Guide (5.5e / 2024)

Reference for converting running text (statblocks, items, spells, species) into
valid, interactive **5etools homebrew JSON**. Used two ways:

1. **By hand** — as a lookup for the schema shape and `{@tag}` syntax.
2. **By the skill** — the installable `5etools-homebrew` skill
   (`.claude/skills/5etools-homebrew/`) applies these rules to produce tagged
   JSON, which you then run through the
   **[Homebrew Importer & Scraper](tools/homebrew-importer.html)** to
   validate and merge.

The reliable pipeline is **extract text → verify → tag → validate**, not
"PDF straight to JSON in one pass." PDF parsing mangles tables and multi-column
layouts; get clean text first, then apply the tagging rules below.

---

## 1. File structure

Every homebrew file is one JSON object: a `_meta` block that **registers the
source**, followed by one array per content type (`monster`, `item`, `spell`,
`race`, …).

```json
{
  "_meta": {
    "sources": [
      {
        "json": "MyCustomSetting",
        "abbreviation": "MCS",
        "full": "My Custom Setting Core Rulebook",
        "authors": ["Your Name"],
        "version": "1.0",
        "url": "https://github.com/your-username/your-homebrew-repo",
        "targetSchema": "1.0.0"
      }
    ],
    "dateAdded": 1690000000,
    "dateLastModified": 1690000000
  },
  "monster": [ /* … */ ],
  "item": [ /* … */ ]
}
```

Rules:

- The `_meta.sources[].json` value is the **source id**. Every entity's
  `"source"` field must match it exactly, or 5etools won't link it.
- `json`, `abbreviation`, and `full` are **required**; `authors`, `version`,
  and `url` are recommended. `targetSchema` pins the brew schema version.
- `dateAdded` / `dateLastModified` are Unix epoch seconds.

### Minimal entity examples

```json
"monster": [
  {
    "name": "Custom Goblin",
    "source": "MyCustomSetting",
    "page": 1,
    "size": "S",
    "type": "humanoid",
    "alignment": ["N", "E"],
    "ac": [{ "ac": 15, "from": ["leather armor", "shield"] }],
    "hp": { "average": 7, "formula": "2d6" },
    "speed": { "walk": 30 },
    "str": 8, "dex": 14, "con": 10, "int": 10, "wis": 8, "cha": 8,
    "passive": 9,
    "cr": "1/4",
    "trait": [
      { "name": "Nimble Escape",
        "entries": ["The goblin can take the Disengage or Hide action as a bonus action on each of its turns."] }
    ],
    "action": [
      { "name": "Scimitar",
        "entries": ["{@atk mw} {@hit 4} to hit, reach 5 ft., one target. {@h}5 ({@damage 1d6 + 2}) slashing damage."] }
    ]
  }
]
```

```json
"item": [
  {
    "name": "Sword of the Setting",
    "source": "MyCustomSetting",
    "page": 2,
    "type": "M",
    "rarity": "rare",
    "weight": 3,
    "weaponCategory": "martial",
    "property": ["F"],
    "dmg1": "1d8",
    "dmgType": "S",
    "entries": ["You gain a +1 bonus to attack and damage rolls made with this magic weapon. It casts a faint light reminiscent of {@spell dancing lights}."]
  }
]
```

> When unsure of the exact shape for a complex mechanic (spellcasting block,
> legendary actions, lair actions), open the matching official entry in
> `docs/data/` (e.g. `docs/data/bestiary/bestiary-xmm.json`), find a creature or
> item that works like yours, and copy its structure.

---

## 2. The `{@tag}` system

Bracketed tags in `entries` strings generate clickable dice rollers and hover
tooltips on the rendered site. Tag mechanics; leave plain flavor text plain.

### Core combat tags

| Meaning | Tag | Renders as |
|---|---|---|
| Melee Weapon Attack | `{@atk mw}` | *Melee Weapon Attack:* |
| Ranged Weapon Attack | `{@atk rw}` | *Ranged Weapon Attack:* |
| Melee Spell Attack | `{@atk ms}` | *Melee Spell Attack:* |
| Ranged Spell Attack | `{@atk rs}` | *Ranged Spell Attack:* |
| Hit modifier | `{@hit 5}` | +5 to hit |
| "Hit:" label | `{@h}` | ***Hit:*** |
| Damage (clickable) | `{@damage 1d6 + 2}` | clickable damage button |
| Generic dice | `{@dice 1d20 + 4}` | clickable roll |
| Save DC | `{@dc 15}` | DC 15 |
| Recharge | `{@recharge 5}` | (Recharge 5–6) |

### Cross-referencing tags

Link to core rules or your own content. For **custom** content, append the
source abbreviation with a pipe: `{@item Sword of the Setting|MCS}`.

| Meaning | Core | Custom |
|---|---|---|
| Spell | `{@spell fireball}` | `{@spell custom spell\|MCS}` |
| Item | `{@item longsword}` | `{@item custom item\|MCS}` |
| Creature | `{@creature goblin}` | `{@creature custom goblin\|MCS}` |
| Condition | `{@condition prone}` | `{@condition exhaustion\|XPHB\|Exhaustion Level 1}` |

Formatting: `{@b bold}`, `{@i italic}`, `{@u underline}`.

---

## 3. 5.5e (2024) conventions

Because 5.5e is the primary ruleset, converted text should reflect the 2024 updates:

- **Species vs. Race.** The JSON key may still be `"race"` for schema
  back-compat, but **rendered descriptions should say "Species."**
- **Weapon Mastery.** 2024 adds Cleave, Graze, Nick, Push, Sap, Slow, Topple,
  Vex. Label them in the `entries` array, e.g. `Weapon Mastery: {@b Cleave}`.
- **Subclasses at level 3.** All 5.5e subclasses are chosen at level 3 — keep
  converted class frameworks uniform on that milestone.
- **Backgrounds grant Origin Feats + ability adjustments.** Use the appropriate
  feat arrays to link the granted Origin Feats.
- **Exhaustion is a linear 1–6 track.** Tag it cleanly, e.g.
  `{@condition exhaustion|phb|Exhaustion Level 1}` — don't restate the old
  cumulative 5e effects.
- **Action economy.** Use standard capitalized Action / Bonus Action / Reaction;
  avoid older ambiguous phrasing.

---

## 4. Maintenance & version control

- Keep this guide alongside the `wt-tools` README so humans and the conversion
  agent share one source of truth.
- **Validate every `.json` before committing.** A single parse error
  white-screens the site. Run files through the
  [Homebrew Importer & Scraper](tools/homebrew-importer.html) first — it
  reports parse errors, missing `name`/`source`, orphan sources, and malformed
  `{@tag}` syntax before anything reaches the live site.
- Host homebrew JSON in a **separate repo** from the core 5etools mirror to avoid
  merge conflicts when the mirror updates; link the raw JSON URLs from that
  repo's README for one-click loading during session prep.

---

## 5. Conversion checklist (per file)

1. Extract clean text (verify tables/columns survived).
2. Segment into entities; choose the right content array for each.
3. Fill required fields (`name`, `source`, plus type-specific shape).
4. Tag mechanics with `{@…}`; leave flavor plain.
5. Apply 5.5e conventions (§3).
6. Ensure every `source` matches a `_meta.sources[].json`.
7. Validate in the importer; fix all errors and orphan-source warnings.
8. Merge/export; commit only validated JSON.
