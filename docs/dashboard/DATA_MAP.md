# wt-tools `/data` schema map (Phase 0)

Read-only inventory of the SRD JSON the dashboard will fetch. All paths are
relative to the GitHub Pages site root, which is the `docs/` folder (deployed
via `docs/.github/workflows/pages.yml`) — i.e. at runtime the dashboard
fetches `../data/...` relative to `docs/dashboard/index.html`.

## Spells
- `data/spells/index.json` — map of source code → filename, e.g.
  `{"PHB": "spells-phb.json", "XPHB": "spells-xphb.json", ...}`
- `data/spells/spells-<source>.json` — top-level key `spell`: array of spell
  objects. Key fields used: `name`, `source`, `level`, `school`, `time`,
  `range`, `components`, `duration`, `entries`, `classes`/`reprintedAs`.
- `data/spells/fluff-spells-<source>.json` — flavor text/images, keyed by
  `spellFluff`. Not required for Phase 3 (mechanics only).

## Classes
- `data/class/index.json` — map of class name (lowercase) → filename, e.g.
  `{"wizard": "class-wizard.json", ...}`.
- `data/class/class-<name>.json` — top-level keys: `_meta`, `class`,
  `subclass`, `classFeature`, `subclassFeature`.
  - `class[]`: one entry per class/edition variant. Fields used: `name`,
    `source`, `hd`, `proficiency`, `spellcastingAbility`,
    `casterProgression`, `startingProficiencies`, `startingEquipment`,
    `multiclassing`, `classTableGroups`, `classFeatures` (array of feature
    refs, either a string `"FeatureName|ClassName||level"` or an object
    `{classFeature: "...", gainSubclassFeature: true}`), `subclassTitle`.
  - `classFeature[]`: the actual feature text, looked up by matching
    `name`+`className`+`level` against the refs in `class[].classFeatures`.
    Fields: `name`, `className`, `classSource`, `level`, `entries`.
  - `subclass[]` / `subclassFeature[]`: same pattern, scoped to a subclass.

## Species (races)
- `data/races.json` — top-level keys: `_meta`, `race`, `subrace`.
  - `race[]` fields used: `name`, `source`, `size`, `speed`, `ability`,
    `traitTags`, `languageProficiencies`, `entries`.

## Backgrounds
- `data/backgrounds.json` — top-level keys: `_meta`, `background`.
  - `background[]` fields used: `name`, `source`, `ability`, `feats`,
    `skillProficiencies`, `toolProficiencies`, `startingEquipment`,
    `entries`.

## Items / Equipment
- `data/items.json` — top-level keys: `_meta`, `item`, `itemGroup`.
  - `item[]` fields used: `name`, `source`, `type`, `rarity`, `weight`,
    `value`, `entries`. (`items-base.json` holds the non-magical base
    items — mundane weapons/armor/gear — same `item[]` shape.)

## Bestiary (DM-only, Phase 4 relevant)
- `data/bestiary/index.json` — map of source code → filename.
- `data/bestiary/bestiary-<source>.json` — top-level key `monster`: array.
  Fields used: `name`, `source`, `size`, `type`, `alignment`, `ac`, `hp`,
  `speed`, ability scores (`str`/`dex`/`con`/`int`/`wis`/`cha`), `skill`,
  `passive`, `languages`, `cr`, `trait`, `action`, `environment`.
  - This is the dataset Phase 4's DM-hide flag applies to — a bestiary entry
    marked hidden by the DM must be filtered out of the payload before it
    ever reaches `RTCDataChannel.send()`, not just hidden in the DOM.

## Notes for later phases
- All files are static, pre-generated JSON — safe to `fetch()` directly,
  no API layer needed.
- Index files (`class/index.json`, `spells/index.json`, `bestiary/index.json`)
  are the discovery mechanism: load the index first, then lazy-load only the
  source file(s) actually needed (e.g. PHB-only for a default SRD build).
- `classFeature`/`subclassFeature` cross-referencing (string ref parsing) is
  the trickiest part of Phase 3 and should get its own small parsing helper
  (`parseFeatureRef("Arcane Recovery|Wizard||1")` →
  `{name, className, source, level}`).
