---
name: 5etools-homebrew
description: >-
  Convert D&D homebrew source material into valid, {@tag}-tagged 5etools
  homebrew JSON (5.5e/2024 rules). Use this whenever the user has homebrew
  content — a class/subclass PDF, a monster or NPC statblock, a magic item, a
  spell, a species/background/feat, or rough notes — and wants it turned into a
  loadable 5etools brew file, "brew JSON", a `.json` for 5etools, or "tagged"
  for the site. Trigger on "convert this to 5etools JSON", "make a homebrew
  file", "tag this statblock", "turn my PDF/notes into brew", "5etools import",
  or any mention of homebrew + 5etools/JSON — even if they don't name the exact
  format. Also use when extracting text from a homebrew PDF as the first step of
  that conversion. Pairs with the WT Tools Homebrew Importer page, which
  validates and merges the JSON this skill produces.
---

# 5etools Homebrew Conversion

Turn homebrew source material into JSON that loads cleanly into 5etools and
renders with interactive dice rollers and tooltips.

## Why this is a skill and not one prompt

Good conversion is **judgment work with a hard correctness floor**. The judgment:
deciding which content array each thing belongs in, choosing the right `{@tag}`
for a mechanic, reconstructing a class table that a PDF shredded into a vertical
stream. The floor: the output must be valid JSON with every `source` wired to a
declared `_meta` source, or 5etools white-screens on load. This skill encodes
both halves so every conversion comes out consistent and loadable.

## The pipeline

Always work in this order — it's the reliable path, and skipping steps is where
conversions go wrong:

1. **Extract** clean text (for PDFs, use the script below — never eyeball a PDF).
2. **Segment** the text into discrete entities and pick each one's content array.
3. **Shape** each entity with its required fields (see `references/schema.md`).
4. **Tag** the mechanics in `entries` with `{@…}` (see `references/tags.md`).
5. **Validate** — self-check, then hand to the importer page.

### 1 · Extract

For text the user already pasted, skip to step 2.

For a PDF, run the bundled extractor — it uses PyMuPDF, which is self-contained
(the `pypdf`/`cryptography` stack is often broken in these environments, so
don't reach for it):

```bash
python3 scripts/extract_pdf.py <file.pdf> [--pages 1-6] > out.txt
```

**PDFs lie about tables.** Multi-column layouts — a class progression table
especially — extract as a vertical stream of cells with the headers detached
(you'll see `Level`, `Proficiency Bonus`, `Features`, then a long column of
numbers). Do not trust the raw order. Find the table's column headers, count the
columns, and reconstruct rows by hand against the level count (1–20 for a class).
When a class has a spell-slot table, the trailing run of numbers per row is the
slots for spell levels 1st→9th — align them by position, and sanity-check against
a real caster's progression before trusting it.

### 2 · Segment

Split into entities and route each to a 5etools content array:

| You have… | Array |
|---|---|
| A creature / NPC statblock | `monster` |
| A magic item or gear | `item` |
| A spell | `spell` |
| A player class | `class` + `classFeature` (+ `subclass` + `subclassFeature`) |
| A subclass on its own | `subclass` + `subclassFeature` |
| A species / lineage | `race` (+ `subrace`) — say "Species" in rendered text |
| A background | `background` |
| A feat | `feat` |
| An invocation / maneuver / boon-style pick | `optionalfeature` |

Classes are the hardest case — read `references/classes.md` before converting one.

### 3 · Shape

Build one JSON object: a `_meta` block, then one array per content type. Every
entity needs a `name` and a `source` equal to `_meta.sources[0].json`.
`references/schema.md` has the file structure and the per-type field shapes.
When unsure of a complex mechanic's shape (spellcasting block, legendary/lair
actions, class table columns), open a structurally-similar **official** entry and
mirror it — do not invent field names:

```bash
# examples — adjust source file to what's present
grep -l '"legendary"' */data/bestiary/bestiary-*.json 2>/dev/null | head
```

Look under the site's `data/` tree (`data/bestiary/`, `data/items.json`,
`data/spells/`, `data/class/`) for real structures.

### 4 · Tag

Tag mechanics so they render interactively; leave pure flavor text plain.
Attacks (`{@atk mw}`, `{@hit 4}`, `{@h}`), damage (`{@damage 1d6 + 2}`), other
dice (`{@dice 1d20+4}`), saves (`{@dc 15}`), and cross-references (`{@spell}`,
`{@item}`, `{@creature}`, `{@condition}`; append `|SOURCE` for custom refs). The
full tables and the 2024 conventions (Species terminology, Weapon Mastery,
level-3 subclasses, Origin Feats, linear exhaustion) live in
`references/tags.md` — read it while tagging.

### 5 · Validate

Before returning, self-check:

- The whole thing is **valid JSON** (parse it).
- Every entity has a `name`; every `source` matches `_meta.sources[0].json`.
- Every `{@tag}` has balanced braces and a real tag name.

Then tell the user to run the file through the **WT Tools Homebrew Importer**
(`site/tools/homebrew-importer.html` in the wt-tools repo — open it in a browser,
drop the file in). It re-checks parse validity, missing `name`/`source`, orphan
sources, and malformed tags before anything touches the live 5etools site, where
a single bad file white-screens the whole thing.

## Output

- If the user names a path, write the `.json` there; otherwise return it inline
  and offer to write it.
- End with a short **"Review these"** list of anything you had to infer — a
  missing CR, an ambiguous damage type, a reconstructed table row — so the user
  can correct what a machine can't know.
- Faithfulness over cleverness: convert what the source says. Don't rebalance,
  rename, or invent content unless asked.

## Reference files

- `references/schema.md` — brew file structure + per-content-type field shapes.
- `references/tags.md` — the `{@tag}` syntax tables + 5.5e/2024 conventions.
- `references/classes.md` — converting full classes: level tables,
  `classFeatures` refs, subclasses, spellcasting progression.
- `scripts/extract_pdf.py` — PyMuPDF text extractor (page-range aware).
