---
title: Design Review — On-the-Fly Monster Drafting DM Screen Matrix
type: design-review
date: 2026-07-23
reviewer: dnd-designer-agent
ruleset: D&D 2024 (5.5e) — PHB/DMG/MM 2024
source_doc: docs/monster-drafting-matrix.md
---

# Design Review: On-the-Fly Monster Drafting — DM Screen Matrix

A data-accuracy and balance pass on the drafting matrix, grounded in the D&D 2024 DMG
"Damage Severity by Level" table (p.249), the DMG monster-statistics-by-CR guidelines, and
the 2024 PHB condition definitions. The tool is genuinely useful and mostly sound; the
issues below are concentrated in three places: the **HP bands for solo bosses**, the
**save DC not scaling with severity**, and a handful of **save-or-suffer / curse shapes**
that are more lethal than their "severity" label implies.

Sections map 1:1 to the review brief. Corrected numbers are in pipe tables. A prioritized
Fix list closes the report.

---

## 1. Core Table accuracy

**Verdict: the damage columns are an accurate transcription of the DMG 2024 table.** Every
die and every printed average matches the official "Damage Severity by Level" table,
including the DMG's own rounding of 1d10 to `5`.

| Entry | Doc value | True mean | DMG printed | Correct? |
|---|---|---|---|---|
| 1d10 | 5 | 5.5 | 5 | Yes — DMG rounds 1d10 to 5; flag only if you want the true 5.5 |
| 2d10 | 11 | 11.0 | 11 | Yes |
| 4d10 | 22 | 22.0 | 22 | Yes |
| 10d10 | 55 | 55.0 | 55 | Yes |
| 18d10 | 99 | 99.0 | 99 | Yes |
| 24d10 | 132 | 132.0 | 132 | Yes |

The only "discrepancy" is that 1d10 truly averages 5.5, not 5. This is not a transcription
error — the printed DMG cell says 5 — but a DM using `1d10` for a Setback strike is
under-representing average damage by ~9%. Cosmetic; leave it, optionally footnote it.

**Severity progression — internally consistent, and it telescopes cleanly.** The table is
built so each severity column shifts down one tier. This is a real strength worth
documenting explicitly:

| Tier | Setback | Dangerous | Deadly |
|---|---|---|---|
| 1st–4th | 5 (1d10) | 11 (2d10) | 22 (4d10) |
| 5th–10th | 11 (2d10) | 22 (4d10) | 55 (10d10) |
| 11th–16th | 22 (4d10) | 55 (10d10) | 99 (18d10) |
| 17th–20th | 55 (10d10) | 99 (18d10) | 132 (24d10) |

- **Setback(tier n+1) = Dangerous(tier n)** — holds exactly at every step (11, 22, 55).
- **Dangerous(tier n+1) = Deadly(tier n)** — holds exactly at every step (22, 55, 99).

So "a tier's Deadly ≈ the next tier's step" is not just roughly true — it is exactly true
by construction, which is why the aggregation math in §3 mostly works.

**One non-linearity to be aware of (not an error, but it drives the §3 problems):** the
step ratios are *not* uniform. Setback→Dangerous→Deadly ratios per tier:

| Tier | S→Dangerous | Dangerous→Deadly |
|---|---|---|
| 1–4 | ×2.2 | ×2.0 |
| 5–10 | ×2.0 | ×2.5 |
| 11–16 | ×2.5 | ×1.8 |
| 17–20 | ×1.8 | ×1.33 |

The `4d10 → 10d10` jump (×2.5) is a genuine spike in the real DMG table. It means Deadly is
sometimes 2× Setback and sometimes 2.5× Setback, which is what breaks the "3 attacks =
Deadly" claim (see §3).

---

## 2. Save DC / AC / HP bands

The DMG 2024 does **not** tie DC/AC/HP to the damage-severity table — those bands are the
doc's own invention. Checked against the DMG monster-statistics-by-CR guidelines, mapping
each party-level tier to the CR range a Deadly encounter for that tier would use.

### Save DC — bands are fine *across* tiers, wrong *within* a tier

| Tier | Doc DC | CR-appropriate DC (Setback→Deadly monster) | Assessment |
|---|---|---|---|
| 1–4 | 12–13 | 13 → 14–15 | Top of band too low for a Deadly boss |
| 5–10 | 14–16 | 15 → 16–17 | OK, slightly low at Deadly |
| 11–16 | 16–18 | 17 → 18 | Good |
| 17–20 | 18–20 | 19 → 20+ | Good |

**The structural flaw: one DC band covers all three severities at a given tier.** A Deadly
boss and a Setback minion for the same party read the same DC. But a Deadly monster is a
higher-CR creature and should have a *higher* DC. As written, a tier-1–4 Deadly boss saddled
with DC 12 will have its save-or-suffer effects shrugged off — a level-4 PC with a +5 in the
save stat fails only ~35% of the time. **Recommend: DC = bottom of band for Setback, top of
band for Dangerous, top of band +1–2 for Deadly.**

### AC Band — acceptable, but AC is the swingiest lever; the top ends run hot

| Tier | Doc AC | CR-appropriate AC | Assessment |
|---|---|---|---|
| 1–4 | 12–14 | 13–14 | Fine |
| 5–10 | 14–17 | 15–17 | Fine; 17 = a well-armored CR 8–10 |
| 11–16 | 16–19 | 17–18 | Top (19) is high but legal |
| 17–20 | 18–21 | 18–19 | **21 exceeds the DMG norm** (~19); reserve for a deliberate "tank" boss |

A 3-point AC band is a ~15% swing in party hit rate. The doc's "push AC up, HP down"
advice is sound design, but AC is where a wide band does the most damage to a DM's
expectations — a +3 AC delta changes the fight more than a +3 HP-band delta ever will. Flag
in text that AC should move in ±1 steps, not grabbed randomly.

### HP Band — the biggest data problem: **too low at the top for solo bosses**

This is the one number most likely to blow up a mid-session draft. The bands are calibrated
against roughly a single attacker's damage, not a full party's focused fire — which is
exactly the scenario (solo boss) the Legendary/Lair/Mythic sections exist to serve.

Party-of-four focused DPR vs. top-of-band HP:

| Tier | Doc HP (top) | ~Party DPR (4 PCs) | Rounds a top-band solo boss survives | Verdict |
|---|---|---|---|---|
| 1–4 | 60 | ~45–50 | ~1.2 | Way too low for a solo boss |
| 5–10 | 150 | ~110–130 | ~1.2 | Too low |
| 11–16 | 250 | ~180–220 | ~1.2 | Too low |
| 17–20 | 400 | ~260–340 | ~1.3 | Too low |

Consistently, a *top-of-band* solo boss dies in ~1.3 rounds against a full party before it
gets a second turn — the exact action-economy death the boss add-ons are supposed to
prevent. For comparison, MM 2024 solo bosses of the appropriate CR run roughly: CR 5–8
~130–190 HP, CR 11–14 ~220–280 HP, CR 17–20 ~310–400 HP, and even those lean on legendary
resistances and multiattack to last.

**Fix:** either (a) add a clear "**solo boss: ×2–3 the HP band**" multiplier, or (b) split
the column into "HP (in a group)" vs "HP (solo boss)". The lower band ends (15 / 60 / 150 /
250) are fine for chaff and grouped monsters — the problem is purely the solo-at-the-top
case. Notably the doc's own Worked Example quietly fixes this by stacking a Mythic "second
wind" (~+55 HP) onto a ~100 HP boss — but Mythic is a once-per-arc tool, so ordinary Deadly
solos still hit the wall.

---

## 3. Action-shape balance

### Multiattack aggregation — the headline claim mostly holds, with two caveats

"Multiattack(2): two Setback strikes ≈ Dangerous" — verified against the table:

| Tier | 2 × Setback | Dangerous | Δ | Holds? |
|---|---|---|---|---|
| 1–4 | 10 | 11 | −9% | Yes (close) |
| 5–10 | 22 | 22 | 0% | Exact |
| 11–16 | 44 | 55 | −20% | Undershoots |
| 17–20 | 110 | 99 | +11% | Overshoots |

Within ±20% — a fair abstraction. Note it *undershoots* at 11–16 (because Dangerous there is
2.5× Setback) and *overshoots* at 17–20. The Worked Example's "two 2d10 claws = Dangerous 22"
at tier 5–10 is exactly right.

"Multiattack(3): ... totaling Deadly-ish" — **this one does not hold if read as three
Setback strikes:**

| Tier | 3 × Setback | Deadly | Δ |
|---|---|---|---|
| 1–4 | 15 | 22 | −32% |
| 5–10 | 33 | 55 | −40% |
| 11–16 | 66 | 99 | −33% |
| 17–20 | 165 | 132 | +25% |

Three Setback hits badly undershoot Deadly at every tier except 17–20 (where they
overshoot). The row hedges with "mix of Setback/Dangerous," which *can* reach Deadly (roughly
one Dangerous + two Setback, or three strikes each ~halfway between), but the current wording
invites a DM to draft three Setback strikes and land 40% short. **Fix: state the target
explicitly**, e.g. "three strikes averaging halfway between Setback and Dangerous, aggregate
≈ Deadly," or give a worked number per tier.

### Save-or-suffer / save-or-die-adjacent — under-mitigated and swingy

- **Dangerous "Save-or-suffer"**: one save, on failure = full Dangerous damage **and** a
  condition, **no half on success, no partial on failure.** This is a hard binary. At tier
  5–10 that's 22 damage + Poisoned/Frightened/Restrained on a single DC 15 check. It's within
  tolerance because Dangerous damage isn't lethal to a healthy PC, but flag that binary
  saves are swingier than the "Dangerous = a real fight, not a death" intent. Consider "half
  damage on success, condition only on failure."
- **Deadly "Legendary-style save-or-die-adjacent"**: one save, failure = **full Deadly
  damage + Unconscious/Paralyzed/Stunned.** At tier 5–10 that is 55 damage (≈ a level-8 PC's
  entire HP bar) *and* a condition that makes them auto-fail Str/Dex saves and hands attackers
  auto-crits within 5 ft. That is functionally save-or-die on one roll, delivered by an effect
  whose only telegraph is a parenthetical "use rarely." **This is the most dangerous single
  shape in the doc.** Recommend, as a written guardrail: (1) half damage on a success, (2)
  condition on failure only, (3) mandatory telegraph the round before, (4) a repeat save at
  end of turn to shed the condition. Also worth naming which severe conditions carry the
  hidden "Incapacitated" layer — Paralyzed, Stunned, and Unconscious all include Incapacitated
  (no actions/reactions/concentration), so applying any of them is strictly harsher than the
  word alone suggests.

### Legendary Actions — model is sound, one stacking watch-out

3-point pool, refresh on its turn, spend at end of another creature's turn (not during its
own) — all correct 2024 RAW, and the "don't exceed Dangerous on a legendary" cap is the right
guardrail. The "Cost 3 = a full Standard Action row one tier below" option is where to watch:
if that full action is an **Area burst**, a Deadly boss can drop a Dangerous-tier AoE on the
*whole party* between turns, on top of its own turn and a Lair action. Round-total incoming
damage can spike well past the party's healing throughput. **Recommend: legendary "full
action" should be single-target, or capped at Setback if it's an area effect.**

### Lair Actions — fine. Mythic Traits — fine, but note the double-escalation

Lair on initiative 20, once/round, cycle 2–3 of them — all correct and well-guarded. Mythic
is appropriately fenced as once-per-arc. The one interaction to flag: **"Escalation trigger"
(Deadly-tier action below 50% HP) + Mythic "Escalating rider" (all actions +1 severity) can
compound** — a Dangerous action can become Deadly twice over. The doc's "pick 1–2 mythic rows"
guidance mitigates this; just add a line: *don't stack the Deadly-tier escalation action with
the Escalating-rider mythic on the same monster.*

### Minion / Swarm / Summon — balanced, matches the doc's own guardrails

1-HP minions, auto-damage swarms (no attack roll, capped at Setback), and "one step below the
boss" summons are all reasonable homebrew. The guidance banning save-or-suffer riders and
multiattacks on minions is exactly right and keeps action economy clean. Minor RAW note: MM
2024 swarms make attack rolls rather than dealing automatic damage — the doc's no-roll
version is slightly more punishing but bounded to Setback, so it's fine as a speed
simplification. Call it out as a deliberate deviation.

---

## 4. Condition-interaction correctness (2024 RAW)

Checked every named condition against the 2024 PHB definitions.

| Location in doc | Claim | 2024 RAW | Verdict |
|---|---|---|---|
| Dangerous "Save-or-suffer" | Poisoned | Disadvantage on attack rolls and ability checks (not saves) | Correct |
| Same | Frightened | Disadvantage on checks & attacks while source in line of sight; can't move closer | Correct |
| Same | Restrained | Speed 0; disadvantage on your attacks & Dex saves; attacks vs you advantage | Correct |
| Setback "Reposition" | Grappled, escape DC = Save DC | Grappled = speed 0 + disadvantage attacking anyone but grappler; ability-granted grapples set their own escape DC | Correct; setting escape = Save DC runs *higher* than a normal 8+prof+Str grapple (esp. tiers 3–4), so grapples get very sticky — intentional but note it |
| Setback "Reposition" | knocks Prone | Prone = disadvantage on your attacks; melee within 5 ft advantage, ranged beyond 5 ft **disadvantage** | Correct (watch the ranged-disadvantage half if reskinning) |
| Deadly "save-or-die-adjacent" | Unconscious / Paralyzed / Stunned | All three **include Incapacitated**; auto-fail **Str & Dex** saves only; Unconscious & Paralyzed give melee auto-crit within 5 ft | Correct but under-stated — see §3; these are far harsher than the label |
| Desert biome | sandstorm "Blinded-adjacent" | Heavily obscured area effectively imposes Blinded when trying to see | Correct; "-adjacent" hedge is fine |
| Beast type | Pack Tactics: advantage when ally adjacent to same target | RAW: advantage if an ally is within 5 ft of target and not incapacitated | Correct |
| Construct type | Immune to Poisoned / Exhaustion / Frightened | Matches typical construct immunities | Correct as flavor |
| Undead type | Immune/resistant to Poisoned & Exhaustion | Matches typical undead immunities | Correct as flavor |
| Arctic biome | Prone on failed Dex save when moving on ice | Legal effect | Correct |

**The Worked Example curse — "target has Disadvantage on death saves until the fiend dies or
1 hour passes":**

- **RAW legality:** legal but non-standard. Death saving throws are d20 Tests, and nothing in
  RAW forbids an effect imposing disadvantage on them — but no printed condition does this, so
  it is pure homebrew, not a named-condition effect.
- **Balance:** this is nastier than its "Dangerous mid-boss" framing. Disadvantage on death
  saves drops per-save success from ~55% to ~30%, roughly doubling the chance a downed PC
  actually dies. And as drafted it is applied **on hit with no save to resist, by a
  Multiattack(2)** (two applications/round), lasts **up to 1 hour**, **persists past the
  fight**, and offers **no save or Remove Curse to end early**. That is a strong, low-telegraph
  TPK-amplifier riding on a "real fight, not a death" tier.
- **Recommend:** (1) require a save to *apply* the curse, or make it trigger only on a crit;
  (2) allow a save at end of each turn and/or Remove Curse to end it; (3) shorten to "until end
  of the fight"; (4) telegraph it (the curse should be visible/known, not a hidden death
  clock). Any two of these bring it back in line.

No other rider in the doc is RAW-illegal. The "Poisoned until the cloud clears" gas cloud in
the example is a fine sustained-area effect (Stinking Cloud / Cloudkill pattern).

---

## 5. Balance verdict per tier — "safe to hand a DM mid-session?"

DPR-vs-party-HP sanity, party of four assumed.

| Severity | Safe to hand a DM as-is? | Key sanity note |
|---|---|---|
| **Setback** | **Yes.** | ~5–55 damage per tier is nuisance-level vs party HP; matches "costs resources, shouldn't threaten a down." Minions/swarms bounded to Setback stay fun-chaff. No changes needed. |
| **Dangerous** | **Mostly yes**, with one caveat. | Single-target Dangerous (11–99) can drop an already-hurt PC — correct by design. The binary **save-or-suffer** (full damage + condition, no half) is swingier than intended; recommend half-on-success. The Worked Example curse is a Dangerous draft doing Deadly-adjacent work — fix per §4. |
| **Deadly** | **Not without guardrails.** | Two problems compound: (1) **HP bands too low** means a Deadly *solo* boss dies in ~1.3 rounds unless you multiply HP or add Mythic; (2) the **save-or-die-adjacent** shape is one failed save = ~a full HP bar of damage + a lockdown condition, with only a parenthetical warning. Hand this tier over only with the "×2–3 HP for solo" note and a mandatory-telegraph rule on the save-or-die shape. As written it is the riskiest part of the tool. |

Overall: the tool is **safe for Setback/Dangerous group fights out of the box**, and safe for
Deadly *group* fights. It is **not safe for solo Deadly bosses** until the HP bands and the
save-or-die shape get the guardrails below — which is precisely the use case the
Legendary/Lair/Mythic machinery is built for, so the gap matters.

---

## Fix list

### Must-fix
1. **HP bands are too low for solo bosses.** Top-of-band solo bosses die in ~1.3 rounds vs a
   full party at every tier. Add a "**solo boss: ×2–3 HP band**" multiplier or a separate
   solo HP column. (§2)
2. **Save-or-die-adjacent shape is functionally save-or-die on one roll.** Deadly damage + a
   severe (Incapacitated-bearing) condition on a single failed save, with no half-on-success
   and only a parenthetical warning. Add: half damage on success, condition on failure only,
   mandatory telegraph, and a repeat save to end. (§3)
3. **Worked-Example death-save curse is over-tuned and under-telegraphed.** No save to apply,
   two applications/round, up to 1 hour, persists past the fight, no way to end it. Add a save
   and/or crit-only trigger, an end condition (repeat save / Remove Curse / end of fight), and
   telegraph it. (§4)

### Should-fix
4. **Save DC doesn't scale with severity within a tier.** Specify DC = low-of-band for
   Setback, top-of-band for Dangerous, top+1–2 for Deadly, so Deadly bosses' effects actually
   bite. (§2)
5. **Multiattack(3) "= Deadly" undershoots ~30–40%** if read as three Setback strikes. State
   the intended per-strike value (≈ halfway between Setback and Dangerous) or give per-tier
   numbers. (§3)
6. **Cap the Cost-3 legendary "full action" when it's an area effect** (single-target, or
   Setback-only if AoE) so a boss can't drop party-wide Dangerous damage between turns on top
   of its own turn and a lair action. (§3)
7. **Dangerous "Save-or-suffer" should grant half damage on a success** rather than
   full-or-nothing, to match the "real fight, not a death" intent. (§3)

### Optional
8. Footnote that **1d10 truly averages 5.5**, not 5 (the DMG's printed rounding), for DMs who
   want exact expected damage. (§1)
9. Note that the **grapple escape DC = Save DC** runs higher than a standard 8+prof+Str
   grapple, especially at tiers 3–4 — intentional stickiness, but call it out. (§4)
10. Flag the **auto-damage swarm** (no attack roll) as a deliberate simplification of the MM
    2024 attack-roll swarm. (§3)
11. Add one line to Mythic guidance: **don't stack** the Deadly-tier "Escalation trigger"
    action with the "Escalating rider" mythic on the same monster. (§3)
12. Document the table's clean **telescoping property** (Setback[n+1]=Dangerous[n],
    Dangerous[n+1]=Deadly[n]) — it's a real strength and helps DMs reason about scaling. (§1)
