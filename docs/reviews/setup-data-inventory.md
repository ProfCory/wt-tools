---
title: WT Tools + 5etools Mirror Setup & Data Inventory Audit
type: admin-audit
date: 2026-07-23
auditor: github-admin-agent
---

# WT Tools + 5etools Mirror — Setup & Data Inventory Audit

Scope: verify the vendored 5etools static-site mirror (`docs/`) and the WT Tools
dashboard build 0.1 (`site/`) still load and function, export a data inventory,
and record findings. No commits or pushes were made; this file and
`docs/reviews/data-inventory.json` are written for someone else to commit.

Verification method: static filesystem/JSON inspection only. No browser or live
GitHub Pages deployment was exercised. Counts and sizes were computed with
`find`, `wc`, `du -sb`, `stat`, and `jq` — not estimated.

---

## 1. Pages / workflow health

**Workflow location:** `docs/.github/workflows/pages.yml` (plus
`docs/.github/workflows/main.yml` for Docker/release). Note these live under
`docs/`, not the repository root — they are the vendored 5etools workflows and
operate on the `docs/` tree as their working root.

**Trigger:** `push` of tags matching `v**`, plus manual `workflow_dispatch`.

**Critical finding — the deploy job is disabled.** In `pages.yml` the actual
GitHub Pages publish steps are commented out under a `# TODO(Future)` block:

- `actions/configure-pages`
- `actions/upload-pages-artifact` (`path: '.'`)
- `actions/deploy-pages`

The job currently only runs the 5etools service-worker + SEO build steps and
then stops. **As written, no GitHub Pages deployment actually happens from this
workflow.** If Pages is live today it is being served by a repository *Pages
settings* branch/folder configuration, not by this workflow.

**Intended publish root (when the commented steps are enabled):** `path: '.'`
resolved against the workflow's checkout, i.e. the `docs/` 5etools tree — which
matches what `docs/dashboard/DATA_MAP.md` states ("the GitHub Pages site root,
which is the `docs/` folder").

**Contradiction (flagged):** The repository `readme.md` instructs a human to
configure Pages to *"use `/site` as the published folder."* This directly
contradicts both `DATA_MAP.md` and the workflow, which treat `docs/` as the
Pages root.

| Source | Claimed Pages publish root |
|---|---|
| `readme.md` → "GitHub Pages" section | `/site` |
| `docs/dashboard/DATA_MAP.md` | `docs/` |
| `docs/.github/workflows/pages.yml` (commented target) | `.` = `docs/` tree |

These cannot all be right. If Pages serves `/site`, the WT Tools dashboard loads
but the entire 5etools mirror and `docs/dashboard/` WebRTC shell (which fetch
`../data/...` relative to `docs/dashboard/index.html`) are NOT published and the
dashboard's SRD fetches would 404. If Pages serves `docs/`, the 5etools mirror
and dashboard shell work but the `readme.md` instructions are wrong. **This must
be reconciled before relying on a deploy.**

Status: **YELLOW** — workflow present but its deploy steps are inert, and the
documented publish folder conflicts across three sources.

---

## 2. 5etools mirror setup integrity

**Version:** 5etools **2.22.0** (`docs/package.json` → `name: 5etools`,
`version: 2.22.0`).

**Entry points present:**

| File | Present | Notes |
|---|---|---|
| `docs/index.html` | Yes | landing/search page; loads `js/index.js`, `js/omnisearch.js`, `js/omnidexer.js`, filters, etc. |
| `docs/5etools.html` | Yes | loads `js/styleswitch.js` and `sw-injector.js` |
| `docs/js/` bootstrap | Yes | `utils.js`, `render.js`, `styleswitch.js`, `parser.js` all present |
| `docs/dashboard/index.html` | Yes | custom WebRTC shell; assets below all resolve |

`js/5etools.js` does not exist as a discrete file — this is expected for 2.22.0;
`5etools.html` bootstraps via `styleswitch.js` + the build-injected
`sw-injector.js`. `sw-injector.js` / `sw.js` are **not on disk** — they are
generated at build time by `pages.yml` (`npm run build:sw:prod`), so their
absence in the repo is normal, not a defect.

**Dashboard shell assets (all resolve):** `dashboard/vendor/peerjs.min.js`
(92,826 b), `dashboard/js/room.js`, `dashboard/js/main.js`,
`dashboard/css/style.css`.

**Index-file integrity — all three resolve with ZERO missing targets:**

| Index | Entries | Missing on disk |
|---|---|---|
| `data/spells/index.json` | 17 | 0 |
| `data/class/index.json` | 15 | 0 |
| `data/bestiary/index.json` | 106 | 0 |

Every filename referenced by each index was checked against disk (not just a
spot-check of 3–4): all present. Sample resolutions:
`spells: AAG→spells-aag.json, AI→spells-ai.json, BMT→spells-bmt.json`;
`class: artificer→class-artificer.json, barbarian→class-barbarian.json`;
`bestiary: AATM→bestiary-aatm.json, ABH→bestiary-abh.json, AI→bestiary-ai.json`.

Status: **GREEN** — mirror is internally consistent; all index files fully
resolve; version identifiable.

---

## 3. Data inventory / export

### 3a. `docs/data/` — 5etools mirror data

**Totals: 494 files, 108,872,106 bytes (~104 MiB apparent, ~105 MB on disk).**

| Category | Files | Bytes | ~Size |
|---|---:|---:|---|
| adventure (`adventure/` + `adventures.json`) | 99 | 47,550,302 | 46 MiB |
| book (`book/` + `books.json`) | 60 | 20,189,085 | 20 MiB |
| bestiary (`bestiary/`) | 202 | 17,223,781 | 17 MiB |
| generated (`generated/`) | 11 | 6,949,158 | 6.7 MiB |
| items (items.json, items-base.json, magicvariants.json) | 3 | 3,111,558 | 3.0 MiB |
| class (`class/`) | 33 | 2,812,891 | 2.7 MiB |
| spells (`spells/`) | 30 | 2,110,767 | 2.1 MiB |
| races / species (races + fluff + foundry) | 3 | 1,103,467 | 1.1 MiB |
| recipes (recipes + fluff) | 2 | 1,010,585 | 1.0 MiB |
| backgrounds (backgrounds + fluff) | 2 | 1,001,682 | 1.0 MiB |
| deities | 1 | 785,626 | 767 KiB |
| variantrules | 1 | 677,006 | 661 KiB |
| feats (feats + fluff + foundry) | 3 | 389,860 | 381 KiB |
| optionalfeatures (+ fluff + foundry) | 3 | 246,264 | 240 KiB |
| vehicles (+ fluff + foundry) | 3 | 174,188 | 170 KiB |
| trapshazards (+ fluff) | 2 | 163,321 | 160 KiB |
| rewards (+ fluff + foundry) | 3 | 140,361 | 137 KiB |
| psionics (+ foundry) | 2 | 109,025 | 106 KiB |
| conditionsdiseases (+ fluff) | 2 | 66,086 | 65 KiB |
| languages (+ fluff) | 2 | 63,603 | 62 KiB |
| actions (actions + foundry) | 2 | 47,836 | 47 KiB |
| objects (+ fluff) | 2 | 43,686 | 43 KiB |
| tables | 1 | 19,867 | 19 KiB |

Notes: the category rows above group the primary data file with its `fluff-*`
and `foundry-*` companions where present; single-file top-level categories not
consumed by the dashboard (e.g. `names.json`, `loot.json`, `decks.json`,
`life.json`, `senses.json`, `skills.json`, `msbcr.json`, `cultsboons.json`,
`bastions.json`, `charcreationoptions.json`, `encounters.json`) exist but are
not broken out. The three heavy directories (adventure, book, bestiary) account
for ~84 % of total bytes.

### 3b. `site/data/` — WT Tools dashboard data

`site/data/blocks.json` is **valid JSON**, a flat array of **8 blocks**. All are
labeled `content_type: srd-sample` per the data model (manually normalized
SRD-*style* samples, explicitly not an SRD import). System `dnd-5e`, rules
version `2024` across all blocks.

| entity_type | count |
|---|---:|
| rule | 2 |
| spell | 2 |
| item | 2 |
| condition | 1 |
| feature | 1 |

| content_type | count |
|---|---:|
| srd-sample | 8 |

Blocks: `rule:advantage`, `rule:concentration`, `condition:poisoned`,
`spell:magic-missile`, `spell:light`, `item:longsword`, `item:shield`,
`feature:arcane-recovery`.

The schema `site/data/block.schema.json` (JSON Schema draft 2020-12,
`$id: https://profcory.github.io/wt-tools/data/block.schema.json`) requires
`id, entity_type, name, source, tags, rules_text`, constrains `entity_type` to a
10-value enum, and constrains tags to `^[a-z0-9-]+:[a-z0-9-]+$` unique items.

### 3c. Machine-readable export

Written to **`docs/reviews/data-inventory.json`** (valid JSON, verified with
`jq`) containing `generated_date`, `docs_data` (per-category file_count +
total_bytes for all 23 categories above), `docs_data_totals`, and `site_blocks`
(count + entity_types + content_types). See §5 confirmation.

Status: **GREEN** — inventory complete and exported.

---

## 4. Dashboard functional check (static)

**Method disclaimer:** No browser was run. This is a static + JSON-parse
verification of `site/app.js`, `site/data/blocks.json`, and
`site/data/block.schema.json`.

**Load path:** `site/app.js` `init()` calls
`state.blocks = await fetch('data/blocks.json').then(r => r.json())` then renders
the library. The fetch path is relative (`data/blocks.json`), so the dashboard
requires being served over HTTP from `site/` — consistent with the readme's
warning that opening `index.html` from `file://` breaks JSON loading.

**Persistence:** localStorage key **`wt-tools-state-v0.1`**
(`const key='wt-tools-state-v0.1'`). `load()` reads it and `Object.assign`s onto
`state`; `save()` writes `JSON.stringify(state)`. Persistence is **browser-local
only — no server, no account**, matching the data model.

**Schema validation of all 8 blocks (static jq, field-by-field):**

| Check | Result |
|---|---|
| required top-level fields (`id, entity_type, name, source, tags, rules_text`) present | PASS all 8 |
| `source.{system, rules_version, content_type}` all present | PASS all 8 |
| `entity_type` within enum | PASS all 8 |
| `tags` is array, every tag matches `^[a-z0-9-]+:[a-z0-9-]+$` | PASS all 8 |
| `tags` unique | PASS all 8 |

**No block would fail the schema.** Example tag set (validates):
`rule:advantage` → `["rules:2024","roll:d20","sheet:reference"]`.

Status: **GREEN** — data loads via a well-formed path, every block is
schema-valid, persistence model confirmed (static verification only).

---

## Status

| Subsystem | Status | Justification |
|---|---|---|
| Pages | **YELLOW** | Workflow exists but its deploy steps are commented out (`# TODO(Future)`), so it publishes nothing; readme says publish `/site` while DATA_MAP + workflow say `docs/` — an unreconciled contradiction. |
| 5etools mirror | **GREEN** | v2.22.0; entry points present; all 3 index files (17/15/106 entries) resolve to on-disk files with zero missing. |
| Dashboard | **GREEN** | `app.js` fetches `data/blocks.json` correctly; all 8 blocks pass schema; localStorage key `wt-tools-state-v0.1`; browser-local persistence confirmed (static check). |
| Data | **GREEN** | 494 files / ~104 MiB under `docs/data/` inventoried and exported; 8 `srd-sample` blocks in `site/`. |

## Action items

1. **Reconcile the Pages publish-folder contradiction (high).** Decide whether
   Pages serves `docs/` (5etools mirror + dashboard shell, per DATA_MAP/workflow)
   or `/site` (WT Tools app, per readme). Fix the two docs that are wrong. If
   `/site` is chosen, the `docs/dashboard/` WebRTC shell's `../data/...` SRD
   fetches will 404 — account for that.
2. **Enable or remove the dead deploy job (high).** Uncomment the
   `configure-pages` / `upload-pages-artifact` / `deploy-pages` steps in
   `docs/.github/workflows/pages.yml`, or delete the placeholder and document
   that Pages is configured via repo settings instead. As-is the workflow builds
   artifacts and deploys nothing.
3. **Confirm the live Pages source of truth (medium).** Since the workflow does
   not deploy, verify how (if at all) the site is currently published (repo Pages
   settings branch/folder) and record it so the two mechanisms don't diverge.
4. **Document the `site/` vs `docs/` split (low).** The repo hosts two separate
   apps; a one-line note in the readme clarifying which one Pages serves would
   prevent the recurring `/site` vs `docs/` confusion.
5. **No data integrity issues found** — no remediation needed for index files or
   dashboard blocks.

---

*Companion export: `docs/reviews/data-inventory.json` (written this run).*
