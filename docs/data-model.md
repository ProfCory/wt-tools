# WT Tools Data Model v0.1

WT Tools treats rules content as a graph of reusable definitions and campaign-specific instances.

## Universal definition

Every SRD or custom block has an `id`, `entity_type`, `name`, `source`, `tags`, and `rules_text`. Future records may add structured `relationships`, `requirements`, `grants`, `modifiers`, and `effects` without breaking the current UI.

## Source separation

- `srd-sample`: manually normalized example content used to test the application.
- `srd-5.2.1`: reserved for records imported and verified against the official SRD.
- `custom`: table-created content using the same envelope as SRD content.
- Non-SRD reference data must never be mislabeled as SRD.

## Namespaced tags

Tags use a `namespace:value` pattern. Initial namespaces include `action`, `damage`, `duration`, `target`, `resource`, `sheet`, `rules`, `weapon`, `armor`, `property`, `roll`, `condition`, `modifier`, and `automation`.

## Runtime instances

Dragging a definition to a character stores only its definition ID in that character's zone. Character state, quantities, prepared status, charges, and notes belong to runtime instances rather than canonical definitions.

## Roles

The playtest supports one DM role and five player slots. Roles are selected without authentication and persisted locally in the browser. This is deliberately an honor-system prototype, not a security boundary.

## Persistence

Version 0.1 stores campaign state in browser `localStorage` under `wt-tools-state-v0.1`. A later version should add JSON import/export and optional shared persistence.

## Import pipeline target

1. Preserve source text and source metadata.
2. Segment candidate entities.
3. Normalize into the universal definition envelope.
4. Generate namespaced tags from structured fields.
5. Resolve graph relationships.
6. Validate against JSON Schema.
7. Human-review low-confidence records.
8. Publish only validated normalized records to the app.
