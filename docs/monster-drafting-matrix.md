---
title: On-the-Fly Monster Drafting — DM Screen Matrix
type: dm-reference
source: original
date: 2026-07-23
tags: [dnd-2024, dm-tools, monster-design, improvisation]
---

# On-the-Fly Monster Drafting — DM Screen Matrix

A core-plus-subtable system for drafting a usable monster in the middle of a session, no Monster Manual lookup required. The core table sets numbers (damage, DC, AC/HP by role). The subtables set flavor and tactics: what it *does* on its turn, phrased around severity so it stays balanced.

**How to draft a monster in 30 seconds:**
1. Pick **Level Tier** (party level) and **Severity** (how big a threat this fight should feel). → Core Table gives you damage dice, save DC, and a target AC/HP band.
2. Pick 1–2 rows from **Standard Actions by Severity** for its turn-to-turn kit.
3. Pick 1 row from **Abilities by Biome** if the environment should matter.
4. Optionally pick 1 row from **Abilities by Monster Type** for a signature trait that sells what it *is*.
5. If this is a solo boss, layer in **Legendary Actions** (action economy), a **Lair Action** or two (home-turf pressure), and/or a **Mythic Trait** (final-form twist) as needed.
6. If you need bodies instead of (or alongside) a boss, pull from **Minion / Swarm / Summon Templates** instead of stat-blocking every mook individually.
7. Slap a name and a sentence of flavor on it. Done — you don't need synergy to be perfect, you need it to not contradict itself.

This trades the Monster Manual's baked-in flavor and cross-ability synergy for speed. That's a fair trade most of the time — a lot of MM entries don't hand you actionable tactics either, just a stat block and a prayer.

---

## Core Table: Damage, DC & Threat Band by Level Tier and Severity

Damage dice are the DMG 2024 "Damage Severity by Level" table (p.249) — reused here to also drive DC and a rough AC/HP band so one lookup sets the whole stat line.

| Level Tier | Setback | Dangerous | Deadly | Save DC | AC Band | HP Band (single target) |
|---|---|---|---|---|---|---|
| 1st–4th | 1d10 (5) | 2d10 (11) | 4d10 (22) | 12–13 | 12–14 | 15–60 |
| 5th–10th | 2d10 (11) | 4d10 (22) | 10d10 (55) | 14–16 | 14–17 | 60–150 |
| 11th–16th | 4d10 (22) | 10d10 (55) | 18d10 (99) | 16–18 | 16–19 | 150–250 |
| 17th–20th | 10d10 (55) | 18d10 (99) | 24d10 (132) | 18–20 | 18–21 | 250–400+ |

**Reading severity as a design intent, not just a damage roll:**

- **Setback** — a nuisance. Costs resources (HP, a reaction, a spell slot) but shouldn't threaten a down. Use for minions, swarm fodder, or a "tax" encounter.
- **Dangerous** — a real fight. Can drop a already-hurt character or force hard choices. This is your default "normal encounter" monster.
- **Deadly** — a genuine threat of death or a TPK-adjacent moment. Use sparingly — bosses, set-piece hazards, "the DMG says don't pull punches here."

**AC/HP band notes:** these are wide on purpose — a Setback-severity monster at the top of its level tier's HP band with high AC plays very differently than a low-AC glass cannon at the bottom of the band with the same severity rating. Push AC up and HP down for a "hits hard, dies fast" skirmisher; invert for a "grinds you down" bruiser. Pick a point in the band that matches the role you want, then move on — don't min-max this part.

---

## Standard Actions by Severity

Pick the action's *shape* from the row matching your chosen severity, then reskin the flavor text to fit whatever you're drafting. Damage numbers reference the Core Table for the party's level tier.

### Setback-tier actions

| Action Shape | Mechanical Template |
|---|---|
| Single strike | One attack roll, Setback damage on hit. |
| Minor debuff | On hit: target has Disadvantage on next roll of a stated type (attack/save/check), no save. |
| Area nuisance | Setback damage in a small area (5–10 ft.), DC save for half. |
| Reposition | No damage; forces movement, knocks Prone, or imposes the Grappled condition (escape DC = Save DC). |
| Warning shot | Telegraphed action that resolves next round — gives players a chance to react before Dangerous damage lands. |

### Dangerous-tier actions

| Action Shape | Mechanical Template |
|---|---|
| Multiattack (2) | Two attack rolls, each dealing Setback damage (aggregate ≈ Dangerous). |
| Single heavy strike | One attack roll, Dangerous damage on hit. |
| Save-or-suffer | DC save; on failure, Dangerous damage **and** a condition (Poisoned, Frightened, Restrained) until end of target's next turn. |
| Area burst | Dangerous damage in a moderate area (15–20 ft. cone/radius), DC save for half. |
| Recharge burst | As above, but locked behind a recharge (5–6 on d6) so it can't spam every round. |
| Lair/terrain trigger | Triggered by the environment (see Biome table) rather than an action — free "action" once per round while conditions hold. |

### Deadly-tier actions

| Action Shape | Mechanical Template |
|---|---|
| Multiattack (3) | Three attack rolls, mix of Setback/Dangerous damage totaling Deadly-ish across the round. |
| Signature strike | One attack roll, Deadly damage on hit — reserve for a boss's "big swing," telegraph it the round before if you can. |
| Legendary-style save-or-die-adjacent | DC save; failure = Deadly damage and a severe condition (Unconscious, Paralyzed, Stunned) — use rarely, and only when the table has agreed to high lethality. |
| Battlefield-wide burst | Deadly damage in a large area (30+ ft.), DC save for half — this is a whole-party-threatening event, use once per fight at most. |
| Escalation trigger | Ability upgrades in severity as the monster loses HP thresholds (e.g., Dangerous at full HP, Deadly below 50%) — good for solo bosses fighting a full party. |

---

## Abilities by Biome

Pick one to make the environment a participant in the fight instead of scenery. Severity of the *effect* (not raw damage) still maps to the Core Table if you want it to deal damage.

| Biome | Ability Flavor | Suggested Shape |
|---|---|---|
| Forest / jungle | Roots/vines grapple or entangle; canopy blocks ranged attacks and imposes Disadvantage on Perception | Reposition or Save-or-suffer (Restrained) |
| Mountain / highlands | Rockslide or thin air; forced movement toward a ledge, or Exhaustion accumulation over time | Area nuisance or Escalation trigger |
| Swamp / marsh | Difficult terrain that's also hazardous (sucking mud, methane pockets); Poisoned on failed save | Area burst, low severity, ongoing |
| Desert | Heat exhaustion, sandstorm reduces visibility (Blinded-adjacent), mirage/illusion misdirection | Minor debuff or Area nuisance |
| Arctic / tundra | Cold damage riders on attacks; ice terrain imposes Prone on failed DEX save when moving | Single strike + Reposition combo |
| Underdark / caves | Total darkness exploited (blindsight vs. non-seeing PCs), cave-ins, spore clouds (Poisoned/Frightened) | Save-or-suffer or Lair trigger |
| Coastal / aquatic | Drowning rules apply, currents force movement, tide timing as a countdown clock | Reposition or Escalation trigger |
| Urban / dungeon interior | Traps, collapsing structures, crowd/civilian complications, narrow corridors limiting positioning | Warning shot or Area burst (small, contained) |
| Planar / extradimensional | Reality distortion — teleportation, gravity shifts, area deals psychic instead of physical | Any shape, reskin damage type to psychic/force |
| Volcanic / elemental | Environmental Deadly-tier damage sources (lava, ash storms) that don't need a "monster" at all | Escalation trigger or standalone hazard |

---

## Abilities by Monster Type

A single "signature trait" pulled by creature type, meant to be the one thing that makes the draft feel like *that kind of monster* rather than a reskinned generic. Combine with one Standard Action row above.

| Monster Type | Signature Trait Flavor | Suggested Shape |
|---|---|---|
| Aberration | Alters reality/mind on hit or proximity — Frightened, Charmed, or short-term memory loss, no obvious cause | Save-or-suffer |
| Beast | Pack tactics (Advantage when ally is adjacent to same target) or superior senses (Advantage on Perception/tracking) | Passive trait, pairs with Multiattack |
| Celestial | Radiant damage rider; can end one condition on itself or an ally once per fight; smites on a critical | Single heavy strike + passive |
| Construct | Immune to Poisoned/Exhaustion/Frightened; extremely resistant to conditions generally; slow but relentless | Passive trait, pairs with Reposition-resistant single strike |
| Dragon | Breath weapon (Area burst, Dangerous–Deadly, recharge) plus a passive fear aura (Frightened at close range) | Recharge burst + passive |
| Elemental | Immune to its own damage type; leaves a hazardous area behind it as it moves | Area nuisance (persistent, not one-shot) |
| Fey | Illusion/charm-based control rather than raw damage; teleport short distances as a bonus action-equivalent | Minor debuff or Save-or-suffer, low direct damage |
| Fiend | Damage rider is always something nasty (necrotic/fire) plus a curse-like debuff that lingers past the fight | Single strike + lingering minor debuff |
| Giant | Simply hits much harder than its tier suggests — bump one severity step on a single strike, forced movement on hit | Single heavy strike (upgraded) |
| Humanoid (notable NPC) | Tactical intelligence — uses cover, focuses the weakest-looking PC, retreats/calls for help below 50% HP | Behavioral note, not a mechanical ability |
| Monstrosity | Grab-and-hold: Multiattack where one hit grapples and a second hit auto-damages grappled targets | Multiattack (2) with a grapple rider |
| Ooze | Splits or corrodes equipment on hit; immune to nonmagical weapon damage or one damage type entirely | Passive trait, pairs with any single strike |
| Plant | Slow, high HP, hits are secondary to area control (spores, roots, overgrowth restricting movement) | Area nuisance (persistent) + Reposition |
| Undead | Immune/resistant to Poisoned and Exhaustion; life drain heals it on hit; Frightened aura for the newly-dead-adjacent | Single strike with life-drain rider |

---

## Legendary Actions

For solo monsters fighting a full party — lets the monster act between PC turns so action economy doesn't crush it in one round. Grant a pool of **3 legendary action points per round**, refreshing at the start of its turn, usable only at the end of another creature's turn (not while it's currently taking its own turn).

| Cost | Action Shape | Mechanical Template |
|---|---|---|
| 1 | Minor strike | One attack roll, Setback damage on hit. No movement. |
| 1 | Reposition | Move up to half speed without provoking Opportunity Attacks. |
| 1 | Sense/detect | Make a Wisdom (Perception) check, or force a check from a nearby PC (e.g., resist an effect). |
| 2 | Heavy strike | One attack roll, Dangerous damage on hit. |
| 2 | Minor area effect | Small area (10 ft.), Setback damage, DC save for half — good for a "keeps everyone honest" zone deterrent. |
| 3 | Full action | A full turn's worth of action — one full Standard Action row (see above) at the tier one step below the monster's own severity. |

**Guidance:** budget 3 points/round so the monster gets roughly "one strong thing or two small things" between each of its own turns. Don't let legendary actions deal Deadly-tier damage on their own — that's what its actual turn is for.

---

## Mythic Traits

For a "final form" twist on a boss once it hits 0 HP or a set HP threshold — the fight doesn't end, it transforms. Use once per campaign arc per villain; this is a top-shelf tool, not a default.

| Trigger | Effect Shape | Mechanical Template |
|---|---|---|
| Drops to 0 HP | Second wind | Instead of dying/falling unconscious, regains HP equal to its Deadly-tier damage value (Core Table) and gains a new trait below. |
| Drops to 0 HP | Escalating rider | As above, but its Standard Actions shift up one severity tier permanently for the rest of the fight (Dangerous → Deadly). |
| Reaches 50% of mythic HP | Environmental shift | The battlefield itself changes — biome ability (see Biome table) activates or intensifies; reskin as the boss "warping" its surroundings. |
| Any mythic trigger | New resistance/immunity | Gains resistance or immunity to whatever damage type the party has leaned on hardest this fight. |
| Any mythic trigger | Mythic action pool | Gains a legendary-action-style pool (see above) it didn't have before, usable only during the mythic phase. |
| Final trigger (last threshold) | Death throes | On true death, one last Deadly-tier area burst centered on itself — telegraph this one, it's a "get clear" moment, not a gotcha. |

**Guidance:** pick 1–2 rows, not all of them — a mythic phase should feel like "oh, it's not over" once, not a Russian-doll of transformations. Always telegraph the mythic trigger narratively (a scream, a crack spreading across its hide) so the table reads it as a moment, not a DM fiat HP reset.

---

## Lair Actions

For a monster fighting on its home turf — triggers on **initiative count 20** (losing ties), once per round, representing the lair itself acting. Doesn't cost the monster anything; it's the *place* taking a turn.

| Lair Feature | Effect Shape | Mechanical Template |
|---|---|---|
| Structural | Collapse/shift | A section of terrain becomes difficult terrain, collapses, or opens a hazard (chasm, portcullis) — Reposition-shape, forced movement or area denial. |
| Elemental | Environmental damage pulse | Setback-to-Dangerous damage (party level tier) in a defined zone, DC save for half — reskin to the lair's theme (frost, spores, embers). |
| Sensory | Obscurement | Darkness, fog, or blinding light fills an area — Disadvantage on Perception or attacks for anyone inside. |
| Summoning | Reinforcements | Once per fight (not every round), the lair action instead pulls in 1–2 entries from the Minion/Swarm/Summon table below. |
| Debuff | Draining aura | Creatures in a zone have Disadvantage on saves against the boss's other abilities, or the boss gains temp HP each lair-action round. |
| Restorative | Boss regeneration | The boss regains a small flat HP amount (Setback-tier value) — good for lair themes tied directly to the boss's life force. |

**Guidance:** pick 2–3 lair actions and cycle or randomize which fires each round (d6, reroll on repeat) rather than using all of them every round — that's a Deadly-tier fight all by itself. Lair actions stop the moment the party leaves the lair or the boss dies.

---

## Minion / Swarm / Summon Templates

For "lots of weak things at once" instead of one strong thing — pads out an encounter's body count without inflating a single stat block, and resolves fast at the table.

| Template | Shape | Mechanical Template |
|---|---|---|
| Minion (single-hit) | 1 HP effectively — dies on any hit that deals damage, no HP tracking needed | AC per Core Table band, one Setback-tier attack, no saves needed to kill it |
| Minion (mob, tracked) | Small HP pool (¼ of single-target Core Table HP band) shared narrative purpose, but tracked individually | Same as above, with real HP instead of hit-to-kill |
| Swarm (single stat block, area presence) | One stat block represents the whole cluster; occupies a 10 ft. (or larger) space; can't be flanked in the usual sense | Deals Setback damage automatically to anyone who starts their turn in its space (no attack roll), Dangerous-tier HP pool for the whole swarm |
| Swarm (degrading) | As above, but its damage output steps down in severity as its HP drops past thresholds (Dangerous → Setback → gone) | Represents the swarm thinning out — no need to track exact numbers, just current tier |
| Summon (temporary ally-of-boss) | A boss's action pulls in 1d4 Minion-template creatures, or one Setback-severity creature, that act on the boss's initiative count | Draft the summoned creature itself from this whole matrix at one severity step below the boss |
| Summon (lair-triggered) | See Lair Actions table — a lair action itself is the summon trigger, once per fight | As above |

**Guidance:** minions and swarms exist to make a fight feel populated and let a Multiattack or Area burst matter narratively (clearing 4 minions in one swing feels great) — don't give them save-or-suffer riders or multiattacks of their own, that's what turns "fun chaff" into "annoying bookkeeping."

---

## Quick Worked Example

*Party is level 6. I need a "real fight" mid-boss for a swamp encounter, type: fiend.*

1. **Core Table**, 5th–10th tier, Dangerous → 4d10 damage (avg 22), Save DC 15, AC 15, HP ~100.
2. **Standard Action**, Dangerous tier → Multiattack (2): two claw strikes, each 2d10 (Setback-tier damage per hit, aggregating to Dangerous across the round).
3. **Biome (swamp)** → Area burst, low severity, ongoing: a lingering poison-gas cloud in a 10 ft. radius, DC 15 Con save or Poisoned until the cloud clears.
4. **Monster Type (fiend)** → damage rider: claw damage is necrotic instead of slashing, plus a lingering curse — target has Disadvantage on death saves until the fiend dies or 1 hour passes.

Total draft time: under a minute, zero MM lookups, and it has a clear identity (necrotic-clawed swamp fiend that poisons the area and curses on hit) without needing a paragraph of lore.

**Scaling the same draft up to a boss fight:** add a **Legendary Action** pool (3/round: minor strikes and repositions between PC turns), a **Lair Action** (the swamp itself pulses poison gas on initiative 20, cycling with a collapsing-ground reposition effect), and one **Mythic Trait** (Escalating rider — at 0 HP it doesn't die, it regains ~55 HP and its claw multiattack shifts from Dangerous- to Deadly-tier damage for the rest of the fight). Now the same swamp fiend anchors an entire boss encounter instead of a single fight-in-a-vacuum.

---

## Design Notes

- **This is a drafting tool, not a balancing spreadsheet.** The Core Table numbers are DMG-sourced and safe; everything below it is a menu of flavor, not verified math. Sanity-check total damage-per-round against the party's HP if it's a Deadly-tier fight.
- **Combine sparingly.** One Standard Action + one Biome ability + one Type ability is usually plenty for anything short of a boss. Stacking three-plus abilities onto a single mid-tier monster creates action-economy problems fast.
- **Reskin freely.** "Save-or-suffer: Poisoned" and "Save-or-suffer: Frightened" are the same mechanical shape — the condition and damage type are where the flavor lives, not the shape.
- **Escalation triggers are your boss-fight lever.** A single monster fighting a full party dies to action economy unless it gets to do more as it gets hurt — that's what the Deadly-tier escalation row is for.
- **Legendary/Lair/Mythic are boss-only add-ons, not defaults.** A standard Dangerous- or Deadly-severity monster doesn't need any of them. Reach for these specifically when one creature needs to carry an entire encounter against a full party — they exist to fix action economy and fight-length pacing, not to make a monster "cooler."
- **Minions/swarms are the population lever.** Use them when the encounter needs bodies on the field — either alongside a boss (to threaten action economy from the party's side too) or as the whole encounter on their own (a swarm doesn't need a boss to be a real fight).
