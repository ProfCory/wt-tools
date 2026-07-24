---
title: External-Facing Links Audit
type: link-audit
date: 2026-07-23
scope: user-authored pages (docs/index.html, site/, docs/dashboard/, authored docs/*.md)
---

# External-Facing Links Audit

All external (`http`/`https`) links reachable from the project's **own** pages —
the GitHub Pages landing page (`docs/index.html`), the WT Tools dashboard
(`site/`), the WebRTC dashboard (`docs/dashboard/`), and the authored markdown
docs. The ~thousands of external references inside the vendored 5etools codebase
(`docs/js/`, `docs/data/`, the stock 5etools HTML pages) are **out of scope** —
this is your customization surface only.

## ⚠️ Verification caveat — read first

Liveness was probed from the CI sandbox, whose **egress proxy enforces an
organization allowlist**. Most hosts here return `403 CONNECT (policy denial)`
or a connect failure — that means *this environment isn't allowed to reach the
host*, **not** that the link is dead. Your own `profcory.github.io` pages, for
example, are policy-blocked from here and could not be tested. **Open the
"yours" links below in your own browser to truly confirm them.** Only the
`✅ 200` rows are genuinely proven live-and-reachable.

Status legend:

- `✅ 200` — reachable and allowed from the sandbox (genuinely live).
- `🚫 blocked` — egress-policy denial / connect refused; **inconclusive**, verify manually.
- `⚠️ host-gated` — host returned 400/403 to an anonymous request (github.com does this); **likely live**, verify manually.

---

## 1. Yours — verify these first

These are links you added and control. All are policy-blocked from the sandbox,
so none could be auto-confirmed — please spot-check each in a browser.

### 1a. Wanderer • Torch • Nevos campaign site (`docs/index.html`)

| Link | Sandbox |
|---|---|
| https://profcory.github.io/wanderer-torch-nevos/index.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/general.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/resources.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/calendar.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/character-form.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/discord.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/eaw.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/guildshop.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/crimson_horn_shop.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/KING.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/SOL.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/Enter%20the%20Chat.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/Crafting%20and%20Harvesting.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/The%20Fog%20%26%20the%20Feather.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/DM%20Screen%20Monday%20Torchbearers.html | 🚫 blocked |
| https://profcory.github.io/wanderer-torch-nevos/DM%20Screen%20Friday%20Reclaiming%20the%20Scarred%20Stand.html | 🚫 blocked |

> Note: the link labeled **"Discord-TBD"** in `docs/index.html` (line ~288) points at
> `wanderer-torch-nevos/discord.html` — looks like a placeholder to finalize.

### 1b. Your external services (`docs/index.html`)

| Link | What it is | Sandbox |
|---|---|---|
| https://chatgpt.com/g/g-68d1c70c0c0481918536f5a040de82be-downtime-forge | "Downtime Forge" custom GPT | 🚫 blocked |
| https://startplaying.games/gm/1609884279199x791348377616252000 | Your StartPlaying GM page | 🚫 blocked |

### 1c. WT Tools schema `$id` (`site/data/block.schema.json`, `docs/data-model.md`)

| Link | Sandbox |
|---|---|
| https://profcory.github.io/wt-tools/data/block.schema.json | 🚫 blocked |

> **Structural flag (no network needed):** this `$id` only resolves if GitHub
> Pages publishes the **`/site`** folder as root (then
> `site/data/block.schema.json` → `/wt-tools/data/block.schema.json`). If Pages
> publishes **`docs/`** instead — which the setup audit found the rest of the
> structure expects — this URL **404s** (there is no `docs/data/block.schema.json`).
> It's a JSON-Schema `$id`, so validation still works regardless, but the link
> is dead-or-alive depending on the same Pages-folder decision flagged in
> `setup-data-inventory.md`. Resolve that decision and this link follows.

---

## 2. Vendored 5etools ecosystem (`docs/index.html`)

Shipped with the 5etools mirror; you inherited these on the landing page. Worth
a glance since they're on *your* front page, but they're upstream's to maintain.

| Link | Sandbox |
|---|---|
| https://raw.githubusercontent.com/TheGiddyLimit/plutonium-next/master/module.json | ✅ 200 |
| https://raw.githubusercontent.com/TheGiddyLimit/plutonium-next/master/module-foundry12.json | ✅ 200 |
| https://raw.githubusercontent.com/TheGiddyLimit/plutonium-next/master/module-foundry13.json | ✅ 200 |
| https://raw.githubusercontent.com/DeathStalker471/betterR20/refs/heads/dev-beta-death/dist/betteR20-5et2014.user.js | ✅ 200 |
| https://raw.githubusercontent.com/DeathStalker471/betterR20/refs/heads/dev-beta-death/dist/betteR20-5etools.user.js | ✅ 200 |
| https://github.com/5etools-mirror-3/5etools-src/ | ⚠️ host-gated |
| https://github.com/5etools-mirror-3/5etools-src/releases/latest | ⚠️ host-gated |
| https://github.com/5etools-mirror-3/5etools-src/blob/main/CONTRIBUTING.md | ⚠️ host-gated |
| https://github.com/5etools-mirror-3/5etools-2014-src/ | ⚠️ host-gated |
| https://github.com/5etools-mirror-3/5etools-2014-src/releases/latest | ⚠️ host-gated |
| https://github.com/5etools-mirror-3/5etools-img/releases/latest | ⚠️ host-gated |
| https://github.com/DeathStalker471/betterR20/raw/refs/heads/Jumpgate-Importer/dist/betteR20-5et2014.user.js | ⚠️ host-gated |
| https://github.com/DeathStalker471/betterR20/raw/refs/heads/Jumpgate-Importer/dist/betteR20-5etools.user.js | ⚠️ host-gated |
| https://2014.5e.tools/ | 🚫 blocked |
| https://get.5e.tools/ | 🚫 blocked |
| https://discord.gg/5etools | 🚫 blocked |
| https://wiki.tercept.net/ | 🚫 blocked |
| https://wiki.tercept.net/en/5eTools/InstallGuide | 🚫 blocked |
| https://wiki.tercept.net/en/betteR20 | 🚫 blocked |
| https://foundryvtt.com/ | 🚫 blocked |

## 3. Vendored third-party / utility links (`docs/index.html`)

| Link | Sandbox |
|---|---|
| https://cloud.google.com/free | ✅ 200 |
| https://aws.amazon.com/free | 🚫 blocked |
| https://chrome.google.com/webstore/detail/rivet/igmilfmbmkmpkjjgoabaagaoohhhbjde | 🚫 blocked |
| https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo | 🚫 blocked |
| https://addons.mozilla.org/en-GB/firefox/addon/rivet/ | 🚫 blocked |
| https://addons.mozilla.org/firefox/addon/tampermonkey/ | 🚫 blocked |
| https://developer.mozilla.org/en-US/docs/Learn/Common_questions/set_up_a_local_testing_server | 🚫 blocked |
| https://play.google.com/store/apps/details?id=com.sylkat.apache | 🚫 blocked |
| https://www.raspberrypi.org/products/ | 🚫 blocked |
| https://wiki.roll20.net/images/f/f0/5E_OGL_Sheet_Core_v2.6.png | 🚫 blocked |

## 4. Dashboard vendor references (`docs/dashboard/`)

PeerJS attribution/support links (from the vendored `peerjs.min.js` / README).

| Link | Sandbox |
|---|---|
| https://github.com/peers/peerjs | ⚠️ host-gated |
| https://github.com/peers/peerjs/issues | ⚠️ host-gated |
| https://peerjs.com | 🚫 blocked |
| https://opencollective.com/peer | 🚫 blocked |

---

## Summary

- **53** unique external links across your own pages.
- **6** confirmed live from the sandbox (`✅ 200`): `cloud.google.com`, the 3
  plutonium-next `module*.json`, and 2 betterR20 `raw.githubusercontent` scripts.
- **10** host-gated (`⚠️`) — all `github.com`, almost certainly live, just not
  anonymously HEAD-able through the proxy.
- **37** policy-blocked (`🚫`) — **not verifiable from here**, including every one
  of your own `profcory.github.io` links. These need a manual browser check.
- **1 structural issue:** the `block.schema.json` `$id` resolves only under a
  `/site` Pages deployment; under a `docs/` deployment it 404s. Tied to the
  open Pages-folder decision in `setup-data-inventory.md`.

**Action for you:** open Section 1 (your own links) in a browser to confirm the
campaign site, custom GPT, and StartPlaying page all resolve, then decide the
Pages-folder question so the schema `$id` lands.
