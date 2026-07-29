/*
 * Compendium: read-only loader over the real wt-tools SRD data at
 * ../data/ (docs/data/, see DATA_MAP.md for the real file shapes). Never
 * writes anything — the builder only ever reads from here.
 *
 * MVP scope: the "classic" (2014/PHB) edition only, one source per
 * category, to keep this phase's fetch footprint and complexity bounded.
 * Extending to more sourcebooks/editions later is additive, not a rewrite
 * — see CHARACTER_DATA_DESIGN.md.
 *
 * Canonical IDs reuse 5etools' own Name|Source tag convention:
 *   <type>|<slugified-name>|<lowercase-source>
 */
(function (global) {
	"use strict";

	const DATA_ROOT = "../data/";
	const CORE_CLASS_NAMES = [
		"artificer", "barbarian", "bard", "cleric", "druid", "fighter",
		"monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard",
	];

	function slugify(name) {
		return String(name)
			.toLowerCase()
			.replace(/'/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
	}

	function makeId(type, name, source) {
		return `${type}|${slugify(name)}|${String(source || "").toLowerCase()}`;
	}

	function parseId(id) {
		const [type, slug, source] = String(id).split("|");
		return { type, slug, source };
	}

	function abilityModifier(score) {
		return Math.floor((score - 10) / 2);
	}

	function proficiencyBonus(level) {
		return 2 + Math.floor((Math.max(1, level) - 1) / 4);
	}

	/** Standard 5e HP-by-level: max at 1st, average roll thereafter. */
	function maxHp(hitDieFaces, level, conMod) {
		if (level <= 1) return hitDieFaces + conMod;
		const perLevelAvg = Math.floor(hitDieFaces / 2) + 1;
		return hitDieFaces + conMod + (level - 1) * (perLevelAvg + conMod);
	}

	/** armorItem/shieldItem are baseitem entries (or null). */
	function armorClass(dexMod, armorItem, shieldItem) {
		let ac;
		if (!armorItem) {
			ac = 10 + dexMod;
		} else if (armorItem.type === "LA") {
			ac = armorItem.ac + dexMod;
		} else if (armorItem.type === "MA") {
			const cap = typeof armorItem.dexCapMax === "number" ? armorItem.dexCapMax : 2;
			ac = armorItem.ac + Math.min(dexMod, cap);
		} else {
			ac = armorItem.ac; // HA: no Dex
		}
		if (shieldItem) ac += shieldItem.ac || 2;
		return ac;
	}

	class Compendium {
		constructor() {
			this._cache = new Map();
		}

		async _fetchJson(path) {
			if (this._cache.has(path)) return this._cache.get(path);
			const res = await fetch(DATA_ROOT + path);
			if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
			const json = await res.json();
			this._cache.set(path, json);
			return json;
		}

		async listClassNames() {
			const index = await this._fetchJson("class/index.json");
			return CORE_CLASS_NAMES.filter((n) => index[n]);
		}

		/** Returns the "classic" (2014) edition entry + its features. */
		async getClass(classNameLower) {
			const index = await this._fetchJson("class/index.json");
			const file = index[classNameLower];
			if (!file) throw new Error(`Unknown class: ${classNameLower}`);
			const data = await this._fetchJson(`class/${file}`);
			const cls = data.class.find((c) => c.edition === "classic") || data.class[0];
			return { cls, classFeature: data.classFeature, raw: data };
		}

		/** Resolves classFeatures refs up to `level`, with entries text. */
		featuresUpToLevel(classEntry, classFeatureList, level) {
			const refs = (classEntry.classFeatures || [])
				.map((r) => (typeof r === "string" ? r : r.classFeature))
				.filter(Boolean);
			const parsed = refs.map((ref) => {
				const [name, className, , levelStr] = ref.split("|");
				return { name, className: className || classEntry.name, level: parseInt(levelStr, 10) || 1 };
			});
			return parsed
				.filter((r) => r.level <= level)
				.map((r) => {
					const full = classFeatureList.find(
						(f) => f.name === r.name && f.level === r.level && f.className === r.className
					);
					return {
						id: makeId("feature", `${classEntry.name}-${r.name}-${r.level}`, classEntry.source),
						name: r.name,
						level: r.level,
						entries: full ? full.entries : [],
					};
				})
				.sort((a, b) => a.level - b.level);
		}

		async listRaces() {
			const data = await this._fetchJson("races.json");
			return data.race.filter((r) => r.source === "PHB");
		}

		async listBackgrounds() {
			const data = await this._fetchJson("backgrounds.json");
			return data.background.filter((b) => b.source === "PHB" && !b.name.startsWith("Variant"));
		}

		async listBaseItems() {
			const data = await this._fetchJson("items-base.json");
			return data.baseitem.filter((i) => i.source === "PHB");
		}

		async listArmorAndShields() {
			const items = await this.listBaseItems();
			return items.filter((i) => ["LA", "MA", "HA", "S"].includes(i.type));
		}

		async spellSourceLookup() {
			return this._fetchJson("generated/gendata-spell-source-lookup.json");
		}

		async getSpells(sourceCode) {
			const data = await this._fetchJson(`spells/spells-${sourceCode.toLowerCase()}.json`);
			return data.spell;
		}

		/**
		 * All PHB spells a given class (display name, e.g. "Wizard") can
		 * learn. The lookup is keyed [sourceOfSpellList][spellNameLower].
		 */
		async listSpellsForClass(className) {
			const [lookup, phbSpells] = await Promise.all([
				this.spellSourceLookup(),
				this.getSpells("phb"),
			]);
			const phbLookup = lookup.phb || {};
			return phbSpells.filter((sp) => {
				const entry = phbLookup[sp.name.toLowerCase()];
				return !!entry?.class?.PHB?.[className];
			});
		}

		/** DM-only browsing source; defaults to the core Monster Manual. */
		async getBestiary(sourceCode = "mm") {
			const data = await this._fetchJson(`bestiary/bestiary-${sourceCode.toLowerCase()}.json`);
			return data.monster;
		}
	}

	global.WTCompendium = {
		Compendium,
		slugify,
		makeId,
		parseId,
		abilityModifier,
		proficiencyBonus,
		maxHp,
		armorClass,
	};
})(window);
