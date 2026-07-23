# Brew file structure & per-type field shapes

## File structure

One JSON object: a `_meta` block that registers the source, then one array per
content type.

```json
{
  "_meta": {
    "sources": [
      {
        "json": "MyCustomSetting",
        "abbreviation": "MCS",
        "full": "My Custom Setting Core Rulebook",
        "authors": ["Your Name"],
        "version": "1.0",
        "url": "https://github.com/you/your-homebrew-repo",
        "targetSchema": "1.0.0"
      }
    ],
    "dateAdded": 1690000000,
    "dateLastModified": 1690000000
  },
  "monster": [ /* … */ ],
  "item": [ /* … */ ]
}
```

- `_meta.sources[].json` is the **source id**. Every entity's `source` must equal
  it exactly, or 5etools won't link the content.
- `json`, `abbreviation`, `full` are **required**; `authors`, `version`, `url`
  recommended. `targetSchema` pins the brew schema version.
- `dateAdded` / `dateLastModified` are Unix epoch seconds.

## Recognized content arrays

`monster`, `monsterFluff`, `legendaryGroup`, `item`, `itemGroup`, `baseitem`,
`itemFluff`, `spell`, `spellFluff`, `race`, `subrace`, `raceFluff`, `background`,
`backgroundFluff`, `feat`, `optionalfeature`, `class`, `subclass`,
`classFeature`, `subclassFeature`, `deity`, `object`, `vehicle`, `trap`,
`hazard`, `cult`, `boon`, `condition`, `disease`, `status`, `action`, `table`,
`variantrule`, `reward`, `psionic`, `language`, `charoption`, `recipe`, `deck`,
`card`, `facility` (2024 Bastions), and their `*Fluff` pairs.

## Monster

```json
{
  "name": "Custom Goblin",
  "source": "MyCustomSetting",
  "page": 1,
  "size": "S",
  "type": "humanoid",
  "alignment": ["N", "E"],
  "ac": [{ "ac": 15, "from": ["leather armor", "shield"] }],
  "hp": { "average": 7, "formula": "2d6" },
  "speed": { "walk": 30 },
  "str": 8, "dex": 14, "con": 10, "int": 10, "wis": 8, "cha": 8,
  "passive": 9,
  "cr": "1/4",
  "trait": [
    { "name": "Nimble Escape",
      "entries": ["The goblin can take the Disengage or Hide action as a bonus action on each of its turns."] }
  ],
  "action": [
    { "name": "Scimitar",
      "entries": ["{@atk mw} {@hit 4} to hit, reach 5 ft., one target. {@h}5 ({@damage 1d6 + 2}) slashing damage."] }
  ]
}
```

Size codes: `T S M L H G`. Type is a lowercase string (or `{ "type": "humanoid",
"tags": ["goblinoid"] }`). Optional blocks mirror official data: `save`, `skill`,
`senses`, `languages`, `resist`, `immune`, `conditionImmune`, `bonus`,
`reaction`, `legendary`, `legendaryActions`, `legendaryGroup`, `spellcasting`,
`environment`. Copy shapes from an official statblock rather than guessing.

## Item

```json
{
  "name": "Sword of the Setting",
  "source": "MyCustomSetting",
  "page": 2,
  "type": "M",
  "rarity": "rare",
  "reqAttune": true,
  "weight": 3,
  "weaponCategory": "martial",
  "property": ["F"],
  "dmg1": "1d8",
  "dmgType": "S",
  "bonusWeapon": "+1",
  "entries": ["You gain a +1 bonus to attack and damage rolls made with this magic weapon. It casts a faint light reminiscent of {@spell dancing lights}."]
}
```

`rarity`: `common uncommon rare "very rare" legendary artifact "none"`. `type`
codes: `M` melee weapon, `R` ranged, `LA/MA/HA` armor, `S` shield, `G` gear,
`P` potion, `SC` scroll, `RD` rod, `WD` wand, `RG` ring, `W` wondrous. `dmgType`:
`A B C F L N P R S T Y` (acid/bludgeoning/cold/fire/lightning/necrotic/piercing/
radiant/slashing/thunder/psychic). Weapon `property`: `A F H L R T 2H V` etc.

## Spell

```json
{
  "name": "Custom Bolt",
  "source": "MyCustomSetting",
  "level": 1,
  "school": "V",
  "time": [{ "number": 1, "unit": "action" }],
  "range": { "type": "point", "distance": { "type": "feet", "amount": 60 } },
  "components": { "v": true, "s": true, "m": "a pinch of soot" },
  "duration": [{ "type": "instant" }],
  "entries": ["A bolt of dark flame streaks to a target within range. Make a ranged spell attack. {@h}the target takes {@damage 3d6} necrotic damage."],
  "entriesHigherLevel": [
    { "type": "entries", "name": "At Higher Levels",
      "entries": ["The damage increases by {@dice 1d6} for each slot level above 1st."] }
  ],
  "classes": { "fromClassList": [{ "name": "Occultist", "source": "MyCustomSetting" }] }
}
```

School codes: `A C D E V I N P T` (abjuration, conjuration, divination,
enchantment, evocation, illusion, necromancy, transmutation... V=evocation,
T=transmutation — verify against official data).

## Background / Feat (2024)

Backgrounds grant an Origin Feat and ability adjustments:

```json
"background": [{
  "name": "Occult Scholar", "source": "MyCustomSetting",
  "ability": [{ "choose": { "weights": [2,1], "from": ["int","wis","cha"] } }],
  "feats": [{ "magic initiate|xphb": true }],
  "skillProficiencies": [{ "arcana": true, "history": true }],
  "entries": ["…"]
}]
```

```json
"feat": [{
  "name": "Ritual Adept", "source": "MyCustomSetting",
  "prerequisite": [{ "level": 4 }],
  "ability": [{ "cha": 1 }],
  "entries": ["…"]
}]
```

For a full class, see `classes.md`.
