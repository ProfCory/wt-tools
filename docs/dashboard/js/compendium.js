/*
 * Compendium: read-only loader over the real wt-tools SRD data at
 * ../data/ (docs/data/, see DATA_MAP.md for the real file shapes). Never
 * writes anything — the builder only ever reads from here.
 *
 * MVP scope: the "one" (2024/XPHB) edition only, one source per category,
 * to keep this phase's fetch footprint and complexity bounded. Falls back
 * to "classic" (2014/PHB) only where a class has no 2024 entry at all.
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

	/** "MA|XPHB" -> "MA" (2024 reprints qualify their type code by source). */
	function baseType(item) {
		return String(item?.type || "").split("|")[0];
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
		const type = baseType(armorItem);
		if (!armorItem) {
			ac = 10 + dexMod;
		} else if (type === "LA") {
			ac = armorItem.ac + dexMod;
		} else if (type === "MA") {
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

		/** Returns the 2024 ("one") edition entry + its features, falling back to classic. */
		async getClass(classNameLower) {
			const index = await this._fetchJson("class/index.json");
			const file = index[classNameLower];
			if (!file) throw new Error(`Unknown class: ${classNameLower}`);
			const data = await this._fetchJson(`class/${file}`);
			const cls = data.class.find((c) => c.edition === "one") || data.class.find((c) => c.edition === "classic") || data.class[0];
			return { cls, classFeature: data.classFeature, raw: data };
		}

		/**
		 * Resolves classFeatures refs up to `level`, with entries text.
		 * classFeature[] holds every edition's features for this class in one
		 * array (e.g. Wizard has a PHB "Spellcasting" lvl 1 AND an XPHB
		 * "Spellcasting" lvl 1 -- same name+level, different text), so a
		 * match must also pin classSource to the selected class entry's own
		 * source or it can silently resolve the wrong edition's wording.
		 */
		featuresUpToLevel(classEntry, classFeatureList, level) {
			const refs = (classEntry.classFeatures || [])
				.map((r) => (typeof r === "string" ? r : r.classFeature))
				.filter(Boolean);
			const parsed = refs.map((ref) => {
				const [name, className, classSource, levelStr] = ref.split("|");
				return {
					name,
					className: className || classEntry.name,
					classSource: classSource || classEntry.source,
					level: parseInt(levelStr, 10) || 1,
				};
			});
			return parsed
				.filter((r) => r.level <= level)
				.map((r) => {
					const full = classFeatureList.find(
						(f) =>
							f.name === r.name &&
							f.level === r.level &&
							f.className === r.className &&
							f.classSource === r.classSource
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
			return data.race.filter((r) => r.source === "XPHB");
		}

		async listBackgrounds() {
			const data = await this._fetchJson("backgrounds.json");
			return data.background.filter((b) => b.source === "XPHB");
		}

		async listBaseItems() {
			const data = await this._fetchJson("items-base.json");
			return data.baseitem.filter((i) => i.source === "XPHB");
		}

		async listArmorAndShields() {
			const items = await this.listBaseItems();
			// 2024 reprints use type codes like "MA|XPHB", not plain "MA".
			return items.filter((i) => ["LA", "MA", "HA", "S"].includes(baseType(i)));
		}

		async spellSourceLookup() {
			return this._fetchJson("generated/gendata-spell-source-lookup.json");
		}

		async getSpells(sourceCode) {
			const data = await this._fetchJson(`spells/spells-${sourceCode.toLowerCase()}.json`);
			return data.spell;
		}

		/**
		 * All 2024 (XPHB) spells a given class (display name + its own
		 * source, e.g. "Wizard"/"XPHB" or "Artificer"/"EFA" -- not every
		 * 2024 class's grants are recorded under XPHB itself) can learn.
		 * The lookup is keyed [sourceOfSpellList][spellNameLower].
		 */
		async listSpellsForClass(className, classSource = "XPHB") {
			const [lookup, xphbSpells] = await Promise.all([
				this.spellSourceLookup(),
				this.getSpells("xphb"),
			]);
			const xphbLookup = lookup.xphb || {};
			return xphbSpells.filter((sp) => {
				const entry = xphbLookup[sp.name.toLowerCase()];
				return !!entry?.class?.[classSource]?.[className];
			});
		}

		/** DM-only browsing source; defaults to the 2024 Monster Manual. */
		async getBestiary(sourceCode = "xmm") {
			const data = await this._fetchJson(`bestiary/bestiary-${sourceCode.toLowerCase()}.json`);
			return data.monster;
		}

		/** 2024 subclasses for a class entry returned by getClass(). */
		subclassesForClass(classData) {
			return classData.raw.subclass.filter(
				(s) => s.edition === "one" && s.classSource === classData.cls.source
			);
		}

		/**
		 * Resolves a subclass's own feature refs up to `level`, same shape as
		 * featuresUpToLevel(). Refs are 6-field:
		 * Name|ClassName|ClassSource|SubclassShortName|SubclassSource|Level.
		 */
		subclassFeaturesUpToLevel(subclassEntry, subclassFeatureList, level) {
			const refs = (subclassEntry.subclassFeatures || []);
			const parsed = refs.map((ref) => {
				const [name, className, classSource, subclassShortName, subclassSource, levelStr] = ref.split("|");
				return {
					name,
					className: className || subclassEntry.className,
					classSource: classSource || subclassEntry.classSource,
					subclassShortName: subclassShortName || subclassEntry.shortName,
					subclassSource: subclassSource || subclassEntry.source,
					level: parseInt(levelStr, 10) || 1,
				};
			});
			return parsed
				.filter((r) => r.level <= level)
				.map((r) => {
					const full = subclassFeatureList.find(
						(f) =>
							f.name === r.name &&
							f.level === r.level &&
							f.className === r.className &&
							f.classSource === r.classSource &&
							f.subclassShortName === r.subclassShortName &&
							f.subclassSource === r.subclassSource
					);
					return {
						id: makeId("subclass-feature", `${subclassEntry.name}-${r.name}-${r.level}`, subclassEntry.source),
						name: r.name,
						level: r.level,
						entries: full ? full.entries : [],
					};
				})
				.sort((a, b) => a.level - b.level);
		}

		/** 2024 (XPHB) feats -- no prerequisite filtering, just the raw list. */
		async listFeats() {
			const data = await this._fetchJson("feats.json");
			return data.feat.filter((f) => f.source === "XPHB");
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
		baseType,
	};
})(window);
