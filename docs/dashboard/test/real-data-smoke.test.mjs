import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

await import("../js/data-resolver.js");

const resolver = globalThis.WTDataResolver;
const fixture = JSON.parse(
	await readFile(
		new URL("./fixtures/real-data/vendored-shapes.json", import.meta.url),
		"utf8",
	),
);

const policy2024 = {
	ruleVersion: "2024",
	allowedSources: ["XPHB"],
	allowUnearthedArcana: false,
	allowLegacy: false,
	allowCustom: false,
};

test("editionless XPHB spells remain eligible for 2024 and use generated class lists", () => {
	const sample = fixture.xphbSpells;

	assert.equal(sample.observedCount, 391);
	assert.equal(sample.recordsWithEdition, 0);
	assert.equal(sample.recordsWithClasses, 0);
	assert.equal("edition" in sample.representative, false);
	assert.equal("classes" in sample.representative, false);
	assert.equal(
		resolver.recordMatchesPolicy(sample.representative, policy2024),
		true,
	);
	assert.deepEqual(
		resolver.resolveSpellEligibility(
			sample.representative,
			sample.lookup,
			policy2024,
		).classLists,
		[{ name: "Wizard", source: "XPHB" }],
	);
});

test("PHB class feature references inherit their containing class source", () => {
	const parsed = fixture.phbClass.featureRefs.map((ref) =>
		resolver.parseClassFeatureRef(ref, fixture.phbClass.source),
	);

	assert.deepEqual(
		parsed.map(({ name, classSource, level }) => ({
			name,
			classSource,
			level,
		})),
		[
			{ name: "Arcane Recovery", classSource: "PHB", level: 1 },
			{ name: "Spellcasting", classSource: "PHB", level: 1 },
			{ name: "Arcane Tradition", classSource: "PHB", level: 2 },
		],
	);
});

test("nested XPHB background choices retain both weighted ability modes and A/B equipment", () => {
	const [background] = resolver.filterDefinitions(
		[fixture.xphbBackground],
		policy2024,
	);

	assert.ok(background);
	assert.deepEqual(
		background.ability.map((entry) => entry.choose.weighted.weights),
		[
			[2, 1],
			[1, 1, 1],
		],
	);
	assert.deepEqual(
		Object.keys(background.startingEquipment[0]).sort(),
		["A", "B"],
	);
	assert.equal(background.startingEquipment[0].A[1].quantity, 10);
	assert.equal(background.startingEquipment[0].A[2].value, 800);
	assert.equal(background.startingEquipment[0].B[0].value, 5000);
});

test("source-qualified item references resolve without PHB/XPHB metadata collisions", () => {
	const normalized = resolver.normalizeItemsBase(fixture.itemsBase);
	const battleaxe = normalized.items[0];

	assert.equal(
		normalized.masteries.get(battleaxe.mastery[0]).source,
		"XPHB",
	);
	assert.equal(
		normalized.properties.get(battleaxe.property[0]).source,
		"XPHB",
	);
	assert.equal(normalized.types.get(battleaxe.type).source, "XPHB");
	assert.equal(normalized.properties.get("V|PHB").source, "PHB");
	assert.equal(normalized.properties.get("V|XPHB").source, "XPHB");
	assert.equal(normalized.types.get("M|PHB").source, "PHB");
	assert.equal(normalized.types.get("M|XPHB").source, "XPHB");
});
