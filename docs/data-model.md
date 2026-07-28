# WT Tools Data Model v0.2

WT Tools treats rules content as a graph of reusable definitions and
campaign-specific instances. The authoritative character-sheet implementation
contract is
[`dashboard/CHARACTER_SHEET_BUILD.md`](dashboard/CHARACTER_SHEET_BUILD.md).

## Universal definition

Every SRD or custom block has an `id`, `entity_type`, `name`, `source`, `tags`,
and `rules_text`. Future records may add structured `relationships`,
`requirements`, `grants`, `modifiers`, and `effects` without breaking the
current UI.

## Source separation

- `srd-sample`: manually normalized example content used to test the
  application.
- `srd-5.2.1`: records imported and verified against the official SRD.
- `custom`: table-created content using the same envelope as SRD content.
- Non-SRD reference data must never be mislabeled as SRD.

Campaigns also carry an explicit content policy. Source codes, rules edition,
legacy/UA/custom flags, `srd52`, `basicRules2024`, `edition`, and `reprintedAs`
are resolved before a definition is offered to a player.

## Namespaced tags

Tags use a `namespace:value` pattern. Initial namespaces include `action`,
`damage`, `duration`, `target`, `resource`, `sheet`, `rules`, `weapon`,
`armor`, `property`, `roll`, `condition`, `modifier`, and `automation`.

## Runtime state

Definitions are immutable. Runtime state is split into three versioned
contracts under `dashboard/schemas/`:

- a campaign selects content and assigns characters to player slots
- a character stores identity, base abilities, separate class progressions,
  proficiencies, spells, resources, inventory instances, conditions, and
  advancement history
- a choice stores the requirements, available options, selection bounds,
  grants, replacements, dependencies, and selected options

Equipment, resources, and conditions use instance IDs. Prepared status,
quantities, charges, equipped state, notes, and selection history never mutate
canonical definitions.

Derived totals are disposable projections. They must be recomputed when a
definition, campaign policy, choice, or resolver version changes.

## Roles

The playtest supports one DM role and five player slots. Roles are selected
without authentication and persisted locally in the browser. This is an
honor-system prototype, not a security boundary.

DM-hidden definitions and private DM notes are security-sensitive message
content: they must be removed before WebRTC serialization, not merely hidden in
the receiving interface.

## Persistence

The prototype may continue to use browser `localStorage`, but campaign,
character, and choice records must be stored as independently versioned
collections. JSON export/import contains those records and validates them
against their schemas. Unknown versions require an explicit migration.

## Import pipeline target

1. Preserve source text and source metadata.
2. Segment candidate entities.
3. Normalize into the universal definition envelope.
4. Generate namespaced tags from structured fields.
5. Resolve graph relationships with source-aware keys.
6. Validate against JSON Schema.
7. Human-review low-confidence records.
8. Publish only validated normalized records to the app.

