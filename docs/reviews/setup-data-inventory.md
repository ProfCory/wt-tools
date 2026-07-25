---
title: WT Tools + 5etools Mirror Setup & Data Inventory Audit
type: admin-audit
date: 2026-07-23
auditor: github-admin-agent
status: superseded
superseded_date: 2026-07-24
superseded_by: ../dashboard/CHARACTER_SHEET_BUILD.md
---

# WT Tools + 5etools Mirror — Setup & Data Inventory Audit

> **Superseded:** This audit captured a point-in-time Phase 0 inventory. Its
> Pages-source contradiction was resolved by making `docs/dashboard/` the
> canonical application and documenting `main` / `docs` as the publish source.
> Use
> [`../dashboard/CHARACTER_SHEET_BUILD.md`](../dashboard/CHARACTER_SHEET_BUILD.md)
> for the current data resolver, source policy, state schemas, choice engine,
> WebRTC contract, and phased implementation plan.

The companion machine-readable file
[`data-inventory.json`](data-inventory.json) remains a historical snapshot of
the 2026-07-23 repository contents. Counts and sizes in that export should not
be treated as live invariants.

## Historical conclusions retained

- The vendored 5etools mirror was internally consistent at the time of the
  audit.
- `docs/data/` contained a broad mixture of sources and editions, not a
  character-builder-safe default corpus.
- `site/data/blocks.json` contained eight schema-valid `srd-sample` records.
- `site/` was a browser-local draggable-block prototype.
- `docs/dashboard/` was a separate WebRTC shell.

The application-direction decision is now explicit: extend
`docs/dashboard/`, port useful `site/` concepts into it, and do not maintain two
production character sheets.

