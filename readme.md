# WT Tools

A static, GitHub Pages-friendly D&D 2024 campaign dashboard built around
normalized, pretagged rules blocks.

## Application direction

`docs/dashboard/` is the canonical application and the target for the real
character builder, character sheet, and WebRTC campaign experience. GitHub
Pages serves the `docs/` tree.

`site/` is the earlier local-storage draggable-block prototype. Its useful
sheet and interaction concepts may be folded into `docs/dashboard/`, but it is
not a separate production target.

The implementation contract for that work is
[`docs/dashboard/CHARACTER_SHEET_BUILD.md`](docs/dashboard/CHARACTER_SHEET_BUILD.md).

## Current playtest build: 0.1

The `site/` prototype currently provides:

- Honor-system role selection for one DM and five player slots.
- Persistent character basics, abilities, passives, notes, and dashboard zones.
- A searchable library of normalized SRD-style sample blocks.
- Drag-and-drop spells, features, items, conditions, and actions.
- Custom blocks that use the same record envelope as rules content.
- A DM screen with party overview, initiative, private notes, and quick rules.
- Browser-local persistence with no server or account required.

The `docs/dashboard/` shell provides the published-location foundation for the
canonical application and its peer-to-peer room flow.

## Character-sheet contracts

The initial persisted-state contracts are:

- [`campaign.schema.json`](docs/dashboard/schemas/campaign.schema.json)
- [`character.schema.json`](docs/dashboard/schemas/character.schema.json)
- [`choice.schema.json`](docs/dashboard/schemas/choice.schema.json)

They separate reusable rule definitions from campaign policy, character
instances, and reversible player choices.

## DM tools

Standalone, dependency-free helpers live in `docs/tools/`. They are published
alongside the 5etools mirror and linked from the DM panel on the
[`docs/` landing page](docs/index.html):

- **Severity Damage Expander** —
  [`docs/tools/severity-damage.html`](docs/tools/severity-damage.html). It
  expands the DMG 2024 damage-severity chart into a draftable stat line and is
  backed by
  [`docs/monster-drafting-matrix.md`](docs/monster-drafting-matrix.md).
- **5etools Homebrew Importer & Scraper** —
  [`docs/tools/homebrew-importer.html`](docs/tools/homebrew-importer.html). It
  accepts JSON/text/Markdown/CSV, extracts embedded JSON, validates the
  5etools homebrew shape, lints tags, and merges client-side.

### Homebrew conversion workflow

Turning raw statblock, item, spell, or class text into loadable 5etools brew
JSON is an **extract → tag → validate** pipeline:

1. The installable
   [`5etools-homebrew`](.claude/skills/5etools-homebrew/) skill performs the
   semantic conversion.
2. The Homebrew Importer & Scraper validates and merges the JSON before it
   reaches the live site.

The human-readable conversion rules live in
[`docs/5etools-homebrew-conversion-guide.md`](docs/5etools-homebrew-conversion-guide.md).
Design, balance, and setup audits live in [`docs/reviews/`](docs/reviews/).

## Run locally

Serve the repository root with any static server:

```powershell
cd C:\wt-tools
python -m http.server 8000
```

Open `http://localhost:8000/docs/dashboard/` for the canonical application or
`http://localhost:8000/site/` for the legacy prototype. Opening either
`index.html` directly may prevent JSON loading because of local-file security
restrictions.

## GitHub Pages

Pages is configured to serve `main` / `docs`. That published tree contains the
vendored 5etools mirror, the landing page, DM tools, data, and canonical
dashboard shell. The `site/` prototype is not served by Pages.

## Data status

The records in `site/data/` are manually normalized **SRD-style samples for
application testing**, not a complete SRD import. They are deliberately labeled
`srd-sample`.

The vendored data in `docs/data/` mixes source books, editions, SRD/basic-rules
flags, UA, and setting material. The character builder must apply the explicit
campaign policy documented in
[`CHARACTER_SHEET_BUILD.md`](docs/dashboard/CHARACTER_SHEET_BUILD.md); labels
such as "PHB-only" are not sufficient.

See [`docs/data-model.md`](docs/data-model.md) for the definition/instance
boundary and persisted-state model.

