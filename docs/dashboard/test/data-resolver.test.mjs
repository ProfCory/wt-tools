import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

await import("../js/data-resolver.js");

const resolver = globalThis.WTDataResolver;
const fixture = JSON.parse(
	await readFile(new URL("./fixtures/resolver-fixtures.json", import.meta.url), "utf8"),
);

const policy2024 = {
	ruleVersion: "2024",
	allowedSources: ["XPHB"],
	allowUnearthedArcana: false,
	allowLegacy: false,
	allowCustom: false,
};

test("class feature references require and preserve classSource", () => {
	assert.deepEqual(
		resolver.parseClassFeatureRef("Spellcasting|Wizard|XPHB|1"),
		{
			name: "Spellcasting",
			className: "Wizard",
			classSource: "XPHB",
			level: 1,
		},
	);
	assert.throws(
		() => resolver.parseClassFeatureRef("Spellcasting|Wizard||1"),
		/class source is required/,
	);
	assert.equal(
		resolver.parseClassFeatureRef("Spellcasting|Wizard||1", "PHB").classSource,
		"PHB",
	);
});

test("PHB and XPHB feature collisions produce distinct keys", () => {
	const index = resolver.indexClassFeatures(fixture.classFeatures);
	assert.equal(index.size, 2);
	assert.ok(index.has("Spellcasting|Wizard|PHB|1"));
	assert.ok(index.has("Spellcasting|Wizard|XPHB|1"));
});

test("2024 spell eligibility comes from the generated lookup", () => {
	const result = resolver.resolveSpellEligibility(
		fixture.spell,
		fixture.spellLookup,
		policy2024,
	);

	assert.deepEqual(result.classLists, [{ name: "Wizard", source: "XPHB" }]);
	assert.equal("classes" in fixture.spell, false);
});

test("subclass lookup respects both class and subclass sources", () => {
	const result = resolver.resolveSubclassOptions(
		{ name: "Wizard", source: "XPHB" },
		fixture.subclassLookup,
		policy2024,
	);

	assert.deepEqual(result, [
		{
			type: "subclass",
			name: "Evoker",
			shortName: "Evoker",
			source: "XPHB",
			className: "Wizard",
			classSource: "XPHB",
		},
	]);
});

test("items-base reads baseitem and indexes supporting tables", () => {
	const result = resolver.normalizeItemsBase(fixture.itemsBase);
	assert.equal(result.items[0].name, "Longsword");
	assert.equal(result.masteries.get("Sap").name, "Sap");
	assert.equal(result.properties.get("V").name, "Versatile");
	assert.equal(result.types.get("M").name, "Melee Weapon");
});

test("content policy filters editions, UA, SRD, and basic-rules flags", () => {
	const records = [
		{ name: "Current", source: "XPHB", edition: "one", srd52: true },
		{ name: "Legacy", source: "PHB" },
		{ name: "Playtest", source: "UA2024", edition: "one" },
	];

	assert.deepEqual(
		resolver
			.filterDefinitions(records, policy2024)
			.map((record) => record.name),
		["Current"],
	);
	assert.equal(
		resolver.recordMatchesPolicy(
			{ ...records[0], basicRules2024: false },
			{ ...policy2024, requireBasicRules2024: true },
		),
		false,
	);
});

test("reprintedAs selects only an allowed reprint", () => {
	const legacy = {
		name: "Example",
		source: "PHB",
		reprintedAs: ["Example|XPHB"],
	};
	const current = { name: "Example", source: "XPHB", edition: "one" };

	assert.equal(
		resolver.resolveReprint(legacy, [legacy, current], policy2024),
		current,
	);
});
