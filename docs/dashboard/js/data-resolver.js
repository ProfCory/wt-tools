/*
 * Source-aware data helpers for the WT Tools character builder.
 *
 * This module intentionally has no DOM or network dependency. It can run in a
 * browser through window.WTDataResolver or under Node for fixture tests.
 */
(function (global) {
	"use strict";

	const LEGACY_EDITIONS = new Set(["classic", "legacy"]);
	const CURRENT_EDITION = "one";
	const CURRENT_SOURCES = new Set(["xphb", "xdmg", "xmm", "xsrd"]);
	const LEGACY_SOURCES = new Set(["phb", "dmg", "mm"]);
	const COMPILED_POLICY = Symbol("compiledPolicy");

	function normalizeKey(value) {
		return String(value || "").trim().toLowerCase();
	}

	function assertNonEmpty(value, label) {
		if (value === undefined || value === null || String(value).trim() === "") {
			throw new TypeError(`${label} is required`);
		}
		return String(value).trim();
	}

	function parseDefinitionRef(value, defaultType) {
		if (value && typeof value === "object") {
			return {
				type: value.type || defaultType,
				name: assertNonEmpty(value.name, "definition name"),
				source: assertNonEmpty(value.source, "definition source"),
			};
		}

		const [name, source] = String(value || "").split("|");
		return {
			type: defaultType,
			name: assertNonEmpty(name, "definition name"),
			source: assertNonEmpty(source, "definition source"),
		};
	}

	function unwrapFeatureRef(value, propertyName) {
		if (typeof value === "string") return value;
		if (value && typeof value[propertyName] === "string") return value[propertyName];
		throw new TypeError(`Expected a ${propertyName} string reference`);
	}

	function parseClassFeatureRef(value, fallbackClassSource) {
		const raw = unwrapFeatureRef(value, "classFeature");
		const [name, className, classSource, levelText] = raw.split("|");
		const level = Number(levelText);

		if (!Number.isInteger(level) || level < 1) {
			throw new TypeError(`Invalid class feature level in "${raw}"`);
		}

		return {
			name: assertNonEmpty(name, "feature name"),
			className: assertNonEmpty(className, "class name"),
			classSource: assertNonEmpty(classSource || fallbackClassSource, "class source"),
			level,
		};
	}

	function classFeatureKey(value) {
		const ref =
			typeof value === "string" || value?.classFeature
				? parseClassFeatureRef(value)
				: value;
		return [
			assertNonEmpty(ref.name, "feature name"),
			assertNonEmpty(ref.className, "class name"),
			assertNonEmpty(ref.classSource, "class source"),
			Number(ref.level),
		].join("|");
	}

	function parseSubclassFeatureRef(value) {
		const raw = unwrapFeatureRef(value, "subclassFeature");
		const [
			name,
			className,
			classSource,
			subclassShortName,
			subclassSource,
			levelText,
		] = raw.split("|");
		const level = Number(levelText);

		if (!Number.isInteger(level) || level < 1) {
			throw new TypeError(`Invalid subclass feature level in "${raw}"`);
		}

		return {
			name: assertNonEmpty(name, "feature name"),
			className: assertNonEmpty(className, "class name"),
			classSource: assertNonEmpty(classSource, "class source"),
			subclassShortName: assertNonEmpty(subclassShortName, "subclass short name"),
			subclassSource: assertNonEmpty(subclassSource, "subclass source"),
			level,
		};
	}

	function subclassFeatureKey(value) {
		const ref =
			typeof value === "string" || value?.subclassFeature
				? parseSubclassFeatureRef(value)
				: value;
		return [
			assertNonEmpty(ref.name, "feature name"),
			assertNonEmpty(ref.className, "class name"),
			assertNonEmpty(ref.classSource, "class source"),
			assertNonEmpty(ref.subclassShortName, "subclass short name"),
			assertNonEmpty(ref.subclassSource, "subclass source"),
			Number(ref.level),
		].join("|");
	}

	function indexByKey(records, keyFactory) {
		const index = new Map();
		for (const record of records || []) {
			const key = keyFactory(record);
			if (index.has(key)) throw new Error(`Duplicate definition key: ${key}`);
			index.set(key, record);
		}
		return index;
	}

	function indexClassFeatures(records) {
		return indexByKey(records, classFeatureKey);
	}

	function indexSubclassFeatures(records) {
		return indexByKey(records, subclassFeatureKey);
	}

	function inferEdition(record) {
		const explicit = normalizeKey(record?.edition);
		if (explicit) return explicit;

		const source = normalizeKey(record?.source);
		if (CURRENT_SOURCES.has(source)) return CURRENT_EDITION;
		if (LEGACY_SOURCES.has(source)) return "classic";
		return "";
	}

	function compilePolicy(policy) {
		if (policy?.[COMPILED_POLICY] === true) return policy;
		const value = policy || {};
		return {
			[COMPILED_POLICY]: true,
			ruleVersion: value.ruleVersion || "mixed",
			allowedSources:
				value.allowedSources instanceof Set
					? value.allowedSources
					: new Set(value.allowedSources || []),
			allowUnearthedArcana: value.allowUnearthedArcana === true,
			allowLegacy: value.allowLegacy === true,
			allowCustom: value.allowCustom === true,
			requireSrd52: value.requireSrd52 === true,
			requireBasicRules2024: value.requireBasicRules2024 === true,
		};
	}

	function isUnearthedArcanaSource(source) {
		return /^UA/i.test(source || "");
	}

	function isCustomSource(source) {
		return normalizeKey(source) === "custom";
	}

	function recordMatchesCompiledPolicy(record, active) {
		if (!record || !record.source) return false;

		if (!active.allowedSources.has(record.source)) return false;
		if (isUnearthedArcanaSource(record.source) && !active.allowUnearthedArcana) {
			return false;
		}
		if (isCustomSource(record.source) && !active.allowCustom) return false;
		if (active.requireSrd52 && record.srd52 !== true) return false;
		if (active.requireBasicRules2024 && record.basicRules2024 !== true) return false;

		const edition = inferEdition(record);
		const isCurrent = edition === CURRENT_EDITION;
		const isLegacy = LEGACY_EDITIONS.has(edition);

		if (isLegacy && !active.allowLegacy) return false;
		if (active.ruleVersion === "2014" && isCurrent) return false;
		if (active.ruleVersion === "2014" && !isLegacy) return false;
		if (active.ruleVersion === "2024" && !isCurrent && !isLegacy) return false;
		if (active.ruleVersion === "mixed" && !edition) return true;

		return isCurrent || isLegacy;
	}

	function recordMatchesPolicy(record, policy) {
		return recordMatchesCompiledPolicy(record, compilePolicy(policy));
	}

	function filterDefinitions(records, policy) {
		const active = compilePolicy(policy);
		return (records || []).filter((record) =>
			recordMatchesCompiledPolicy(record, active),
		);
	}

	function definitionKey(record) {
		return `${normalizeKey(record?.name)}|${normalizeKey(record?.source)}`;
	}

	function buildReprintIndex(records) {
		return indexByKey(records, definitionKey);
	}

	function resolveReprint(record, recordsOrIndex, policy) {
		if (!record) return null;
		const active = compilePolicy(policy);
		const byKey =
			recordsOrIndex instanceof Map
				? recordsOrIndex
				: buildReprintIndex(recordsOrIndex);

		const reprints = Array.isArray(record.reprintedAs)
			? record.reprintedAs
			: record.reprintedAs
				? [record.reprintedAs]
				: [];
		for (const rawRef of reprints) {
			const ref = parseDefinitionRef(rawRef, record.type || "definition");
			const candidate = byKey.get(
				`${normalizeKey(ref.name)}|${normalizeKey(ref.source)}`,
			);
			if (candidate && recordMatchesCompiledPolicy(candidate, active)) return candidate;
		}

		return recordMatchesCompiledPolicy(record, active) ? record : null;
	}

	function lookupSpellNode(spell, lookup) {
		return lookup?.[normalizeKey(spell.source)]?.[normalizeKey(spell.name)] || null;
	}

	function resolveSpellEligibility(spell, lookup, policy) {
		const node = lookupSpellNode(spell, lookup);
		const active = compilePolicy(policy);
		const classLists = [];

		for (const [classSource, classNames] of Object.entries(node?.class || {})) {
			if (!active.allowedSources.has(classSource)) continue;
			for (const className of Object.keys(classNames || {})) {
				classLists.push({ name: className, source: classSource });
			}
		}

		classLists.sort(
			(a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source),
		);

		return {
			definition: {
				type: "spell",
				name: spell.name,
				source: spell.source,
			},
			classLists,
		};
	}

	function resolveSubclassOptions(classRef, lookup, policy) {
		const active = compilePolicy(policy);
		const classNode = lookup?.[classRef.source]?.[classRef.name] || {};
		const options = [];

		for (const [subclassSource, subclasses] of Object.entries(classNode)) {
			if (!active.allowedSources.has(subclassSource)) continue;
			for (const [shortName, details] of Object.entries(subclasses || {})) {
				options.push({
					type: "subclass",
					name: details.name || shortName,
					shortName,
					source: subclassSource,
					className: classRef.name,
					classSource: classRef.source,
				});
			}
		}

		return options.sort(
			(a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source),
		);
	}

	function mapByCode(records, codeFields) {
		const result = new Map();
		const aliases = new Map();
		for (const record of records || []) {
			const code = codeFields.map((field) => record[field]).find(Boolean);
			if (!code) continue;

			const source = record.source && String(record.source).trim();
			if (source) {
				const qualified = `${code}|${source}`;
				if (result.has(qualified)) {
					throw new Error(`Duplicate item metadata key: ${qualified}`);
				}
				result.set(qualified, record);
			}

			if (!aliases.has(code)) aliases.set(code, []);
			aliases.get(code).push(record);
		}

		for (const [code, matches] of aliases) {
			if (matches.length === 1 || matches.every((record) => !record.source)) {
				result.set(code, matches[0]);
			}
		}
		return result;
	}

	function normalizeItemsBase(data) {
		if (!data || !Array.isArray(data.baseitem)) {
			throw new TypeError("items-base data must contain baseitem[]");
		}

		return {
			items: data.baseitem,
			masteries: mapByCode(data.itemMastery, ["name", "abbreviation"]),
			properties: mapByCode(data.itemProperty, ["abbreviation", "name"]),
			types: mapByCode(data.itemType, ["abbreviation", "name"]),
		};
	}

	const api = {
		buildReprintIndex,
		classFeatureKey,
		compilePolicy,
		filterDefinitions,
		inferEdition,
		indexClassFeatures,
		indexSubclassFeatures,
		isUnearthedArcanaSource,
		normalizeItemsBase,
		parseClassFeatureRef,
		parseDefinitionRef,
		parseSubclassFeatureRef,
		recordMatchesPolicy,
		resolveReprint,
		resolveSpellEligibility,
		resolveSubclassOptions,
		subclassFeatureKey,
	};

	global.WTDataResolver = Object.freeze(api);
})(typeof window === "undefined" ? globalThis : window);
