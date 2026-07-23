# WT Tools

A static, GitHub Pages-friendly D&D 2024 campaign dashboard built around normalized, pretagged rules blocks.

## Current playtest build: 0.1

The app currently provides:

- Honor-system role selection for one DM and five player slots.
- Persistent character basics, abilities, passives, notes, and dashboard zones.
- A searchable library of normalized SRD-style sample blocks.
- Drag-and-drop spells, features, items, conditions, and actions.
- Custom blocks that use the same record envelope as rules content.
- A DM screen with party overview, initiative, private notes, and quick rules.
- Browser-local persistence with no server or account required.

## DM tools

Standalone, dependency-free helpers that live alongside the dashboard:

- **Severity Damage Expander** — [`site/tools/severity-damage.html`](site/tools/severity-damage.html).
  Expands the DMG 2024 "Damage Severity by Level" core chart into a draftable stat
  line: pick party level + severity, place concrete AC/HP inside the tier band with a
  role slider, split the damage into a multiattack routine, and copy a ready-to-run
  monster draft. Backed by the matrix in
  [`docs/monster-drafting-matrix.md`](docs/monster-drafting-matrix.md).
- **5etools Homebrew Importer &amp; Scraper** — [`site/tools/homebrew-importer.html`](site/tools/homebrew-importer.html).
  Drop `.json`/`.txt`/`.md`/`.csv` files (or paste text); it scrapes embedded JSON
  — whole files and fenced ` ```json ` blocks alike — validates it against the
  5etools homebrew shape (`_meta.sources` + content arrays), lints the `{@tag}`
  syntax, and merges everything into one downloadable homebrew file. Fully
  client-side; works offline on a local game network.

### Homebrew conversion workflow

Turning raw statblock/item/spell text into loadable 5etools brew JSON is a
two-step, **extract → tag → validate** pipeline:

1. The **[`homebrew-converter`](.claude/agents/homebrew-converter.md)**
   agent applies the tagging rules to produce `{@tag}`-tagged JSON, following
   [`docs/5etools-homebrew-conversion-guide.md`](docs/5etools-homebrew-conversion-guide.md)
   (schema template, `{@tag}` table, 5.5e/2024 conventions).
2. The **Homebrew Importer & Scraper** page validates and merges that JSON into a
   clean, downloadable brew file before it ever touches the live site.

Design/balance and setup audits for this material live in
[`docs/reviews/`](docs/reviews/).

## Run locally

Serve the repository root with any static server, then open `/site/`.

```powershell
cd C:\wt-tools
python -m http.server 8000
```

Open `http://localhost:8000/site/`.

Opening `site/index.html` directly may prevent the browser from loading JSON because of local-file security restrictions.

## GitHub Pages

Configure Pages to deploy from the branch containing the build and use `/site` as the published folder when that option is available. The app contains no build step or external dependency.

## Data status

The included records are manually normalized **SRD-style samples for application testing**, not a complete SRD import. They are deliberately labeled `srd-sample`. The next data milestone is a licensed SRD 5.2.1 ingestion and validation pipeline.

See [`docs/data-model.md`](docs/data-model.md) for the record model, source separation rules, tags, runtime instances, and planned import flow.
