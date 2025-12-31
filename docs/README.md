# W&T Tools — Index Customization & Sitemap

This repository is a customized front page for a locally hosted / GitHub Pages–hosted **5etools** instance, adapted to serve as the **player + DM entry point** for the *Wanderer & Torch / Nevos* campaigns.

The goal of these changes is to:
- Preserve **full 5etools functionality**
- Match **native 5etools layout and behavior**
- Add **Wanderer & Torch–specific navigation**
- Keep all W&T content **external** to this repo
- Remain compliant and easy to maintain across updates

---

## What Was Changed (Index Page)

### 1. Branding
- Page title changed from **5etools** → **W&T Tools**
- Header text updated to reflect W&T as the table’s home base
- All underlying scripts, bundles, and data loading remain unchanged

### 2. Wanderer & Torch Links Section
A new section titled **“Wanderer & Torch Links”** was added:

- Uses **Bootstrap panel/card styling** to visually match the rest of 5etools
- Does **not** override or replace any existing 5etools navigation
- Serves as a quick-launch hub for:
  - Players
  - Lore
  - DMs
  - Community links

**Important design decision**:
- All W&T links point to the *separate main site*  
  👉 https://profcory.github.io/wanderer-torch-nevos/
- This repo stays focused on tools; lore and campaign content live elsewhere

### 3. Light / Dark Mode Compatibility
- W&T panels inherit the same light/dark behavior as the rest of the page
- Styling respects existing theme toggles and background gradients
- No hard-coded colors that would break future theme updates

### 4. Patreon Removal
- The default 5etools Patreon section was **removed/hidden**
- This keeps the page focused on table use and avoids confusion for players

### 5. Compliance / Use Notes (Collapsible)
- The original disclaimer text was preserved
- It is now hidden behind a **collapsible “Compliance / Use Notes” row**
- Click the chevron (`>`) to expand and view details
- Reduces visual clutter while keeping legal context accessible

---

## What Was NOT Changed (On Purpose)

- No core JavaScript files were modified
- No data loaders, indexes, or JSON files were touched
- No navigation IDs or DOM hooks were renamed
- No 5etools features were removed or disabled
- This file can be safely diffed and re-applied after upstream updates

---

## File Strategy

### Modified
- `index.html`  
  (previous version should be kept as `index.html.old`)

### Not Modified
- `/js/*`
- `/css/*` (except inline additions specific to the index)
- `/data/*`
- `/img/*`
- Service worker and bundle files

---

## Sitemap (Human Reference)

This is a **logical sitemap**, not a crawler sitemap.

### W&T External Site (Primary World Content)
Hosted separately at:  
https://profcory.github.io/wanderer-torch-nevos/

- Home / Overview
- Campaigns
  - Monday Campaign
  - Friday Campaign
- Timeline
- Cosmology
- Pantheon
- Zodiacal Regions
- Calendar / Timekeeping
- DM Index
- DM Screens
- Player Handouts
- House Rules
- Community Links (Discord, StartPlaying, etc.)

### This Repo (Tools Only)
Serves as a tool launcher and rules reference.

#### Core 5etools Sections
- Books
- Adventures
- Rules Glossary
- Conditions
- Bestiary
- DM Screen
- Loot Generator
- CR Calculator
- Spells
- Items
- Classes
- Feats
- Backgrounds
- Optional Features
- Generators
- Homebrew Tools
- Plutonium / Foundry Support

#### Custom Additions
- Wanderer & Torch Links (external)
- Collapsible Compliance / Use Notes

---

## Updating in the Future

### Safe to Update Automatically
- 5etools data updates
- Bundle/script updates
- JSON content

### Manual Review Recommended
- `index.html` (re-apply W&T block if upstream overwrites)
- Any change affecting:
  - Header markup
  - Navigation containers
  - Theme toggles

### Tip
Keep a small diff or patch of the W&T section so it can be reinserted quickly after upstream merges.

---

## Intent Summary

This setup treats:
- **5etools** as the *rules engine*
- **Wanderer & Torch** as the *world and table identity*

They are intentionally separate, lightly coup
