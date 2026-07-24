# Character data architecture (design reference for Phase 3+)

Folds the builder/sheet separation discussed for Phase 3 into a concrete plan
against this repo's real data (`DATA_MAP.md`) and this project's WebRTC sync
model. Not implemented yet — this is the contract later phases build to.

## One rules authority

The **builder** is the only thing that creates or changes construction
choices. The **character sheet** is a renderer over the builder's exported
data plus live play state. The sheet never recomputes AC/HP/DCs/etc itself —
it trusts the export. This is what keeps DM and player views from silently
disagreeing once state is flowing over a data channel instead of one shared
database.

## Document shape

```json
{
  "schema_version": "0.1",
  "character_id": "char_<uuid>",
  "name": "Gil Barke",
  "ruleset": "5e-2024",
  "choices": { "...": "builder-controlled decisions" },
  "derived": { "...": "calculated: AC, HP max, DCs, passives, granted features" },
  "state": { "...": "runtime: current HP, conditions, prepared spells, notes" }
}
```

- `choices` — species, background, class/subclass+level, ability scores,
  feats, proficiency picks, learned/known spells, starting equipment.
- `derived` — computed by the builder at export time: proficiency bonus,
  max HP, AC, spell attack/DC, passives, the list of granted features.
- `state` — changes during play: current HP, temp HP, hit dice used,
  conditions, prepared spells, inventory instances, freeform notes.

## Canonical reference IDs — adapted to the real data

The real `docs/data` files key entries by `{name, source}` pairs (e.g. a spell
is `{name: "Fireball", source: "XGE"}`), not by slug. 5etools' own inline
markup already uses a `Name|Source` convention for cross-references
(`{@spell Fireball|xge}`), so canonical IDs reuse that shape instead of
inventing a new one:

```
<type>|<slugified-name>|<lowercase-source>
spell|magic-missile|phb
class|wizard|phb
subclass|illusionist|xge     (classFeature/subclassFeature refs resolve via
                               the class file's own className+level fields)
race|human|phb
background|sage|phb
item|quarterstaff|phb
```

A small `resolveId(type, name, source)` / `parseId(id)` pair of helpers is
the normalization layer between real SRD JSON and these IDs — needed before
any builder step can populate a dropdown from `docs/data`.

## What syncs over the data channel, and when

`choices` + `derived` change rarely (character creation, level-up) and can be
large (full spell/feature text refs). `state` changes constantly during play
and must stay cheap. Two message types, not one:

- `character-full` — `{character_id, schema_version, choices, derived}`,
  sent once on export/level-up. Infrequent, can be "large."
- `character-state` — `{character_id, patch: {...}}`, sent on any in-play
  state change (HP tick, condition added, spell prepared/unprepared).
  Frequent, must stay small — a patch, not the whole document.

The DM peer holds the authoritative merged copy of every connected
character (same "single authority" principle applied to session state, not
just rules state); the party-tracker view reads only the small summary
projection (`level`, `classes`, `armor_class`, `current_hp`/`max_hp`,
`passives`, `conditions`) computed from that merged copy, never the full
export.

## Rebuild / level-up flow

Sheet → "Open Builder" → builder imports the current `character-full` →
player makes allowed changes → validates → re-exports `character-full`.
Client-side reconciliation on receipt:

```js
function applyBuilderExport(existing, builderExport) {
  return {
    ...builderExport,
    state: reconcileState(existing.state, builderExport), // cap current_hp
                                                            // to new max_hp,
                                                            // drop spells no
                                                            // longer known,
                                                            // preserve notes
  };
}
```

## Relevance to Phase 2 (slot claiming, this phase)

Each of the 5 slots needs a `character_id` field from day one, even though no
character exists behind it yet — so Phase 3 has somewhere to attach the
export without changing the slot schema:

```json
{ "index": 0, "peerId": null, "name": null, "characterId": null, "claimedAt": null }
```
