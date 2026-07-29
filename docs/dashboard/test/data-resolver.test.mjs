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

test("item metadata uses source-qualified keys and only safe shorthand aliases", () => {
	const result = resolver.normalizeItemsBase({
		baseitem: [],
		itemMastery: [
			{ name: "Sap", source: "XPHB", entries: ["Current"] },
			{ name: "Sap", source: "HB", entries: ["Custom"] },
			{ name: "Nick", source: "XPHB", entries: ["Unique"] },
		],
		itemProperty: [],
		itemType: [],
	});

	assert.equal(result.masteries.get("Sap|XPHB").entries[0], "Current");
	assert.equal(result.masteries.get("Sap|HB").entries[0], "Custom");
	assert.equal(result.masteries.has("Sap"), false);
	assert.equal(result.masteries.get("Nick"), result.masteries.get("Nick|XPHB"));
});

test("content policy infers core-source editions and filters UA and flags", () => {
	const records = [
		{ name: "Current", source: "XPHB", srd52: true },
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
	assert.equal(resolver.inferEdition(records[0]), "one");
	assert.equal(resolver.inferEdition(records[1]), "classic");
});

test("allowLegacy is enforced for every rule version", () => {
	const legacy = { name: "Legacy", source: "PHB" };
	const current = { name: "Current", source: "XPHB" };
	const allowedSources = ["PHB", "XPHB"];

	for (const ruleVersion of ["2014", "2024", "mixed"]) {
		assert.equal(
			resolver.recordMatchesPolicy(legacy, {
				ruleVersion,
				allowedSources,
				allowLegacy: false,
			}),
			false,
		);
	}
	assert.deepEqual(
		resolver
			.filterDefinitions([legacy, current], {
				ruleVersion: "2014",
				allowedSources,
				allowLegacy: true,
			})
			.map((record) => record.name),
		["Legacy"],
	);
	assert.deepEqual(
		resolver
			.filterDefinitions([legacy, current], {
				ruleVersion: "mixed",
				allowedSources,
				allowLegacy: true,
			})
			.map((record) => record.name),
		["Legacy", "Current"],
	);
});

test("reprintedAs selects only an allowed reprint from a reusable index", () => {
	const legacy = {
		name: "Example",
		source: "PHB",
		reprintedAs: ["Example|XPHB"],
	};
	const current = { name: "Example", source: "XPHB" };
	const index = resolver.buildReprintIndex([legacy, current]);

	assert.equal(
		resolver.resolveReprint(legacy, index, policy2024),
		current,
	);
});
