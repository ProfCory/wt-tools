import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const dashboardDirectory = join(testDirectory, "..");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const contracts = Object.fromEntries(
  await Promise.all(
    ["campaign", "character", "choice"].map(async (name) => [
      name,
      {
        schema: await readJson(join(dashboardDirectory, "schemas", `${name}.schema.json`)),
        fixture: await readJson(
          join(testDirectory, "fixtures", "schemas", `${name}.valid.json`),
        ),
      },
    ]),
  ),
);

function duplicateValues(values) {
  const seen = new Set();
  return [...new Set(values.filter((value) => seen.has(value) || !seen.add(value)))];
}

function requireUniqueIds(records, label) {
  const duplicates = duplicateValues(records.map(({ id }) => id));
  assert.deepEqual(duplicates, [], `${label} ids must be unique`);
}

function validateCampaign(campaign) {
  requireUniqueIds(campaign.playerSlots, "player slot");

  const slotIds = new Set(campaign.playerSlots.map(({ id }) => id));
  for (const assignment of campaign.characterAssignments) {
    assert.ok(
      slotIds.has(assignment.slotId),
      `assignment references unknown slot ${assignment.slotId}`,
    );
  }

  assert.deepEqual(
    duplicateValues(campaign.characterAssignments.map(({ slotId }) => slotId)),
    [],
    "a player slot may have only one character assignment",
  );
  assert.deepEqual(
    duplicateValues(campaign.characterAssignments.map(({ characterId }) => characterId)),
    [],
    "a character may be assigned to only one player slot",
  );
}

function validateCharacter(character) {
  const totalLevel = character.classes.reduce((sum, entry) => sum + entry.level, 0);
  assert.ok(totalLevel >= 1 && totalLevel <= 20, "total class level must be between 1 and 20");

  requireUniqueIds(character.resources, "resource");
  requireUniqueIds(character.inventory, "inventory");
  requireUniqueIds(character.conditions, "condition");

  for (const resource of character.resources) {
    assert.ok(
      resource.current <= resource.maximum,
      `resource ${resource.id} current value must not exceed maximum`,
    );
  }
}

function validateChoice(choice) {
  requireUniqueIds(choice.options, "choice option");

  assert.ok(
    choice.minimumSelections <= choice.maximumSelections,
    "minimumSelections must not exceed maximumSelections",
  );
  assert.ok(
    choice.maximumSelections <= choice.options.length,
    "maximumSelections must not exceed the number of options",
  );
  assert.ok(
    choice.selectedOptionIds.length >= choice.minimumSelections &&
      choice.selectedOptionIds.length <= choice.maximumSelections,
    "selected option count must be within the selection bounds",
  );

  const optionIds = new Set(choice.options.map(({ id }) => id));
  for (const selectedId of choice.selectedOptionIds) {
    assert.ok(optionIds.has(selectedId), `selected option ${selectedId} does not exist`);
  }
}

function validateBusinessContracts({ campaign, character, choice }) {
  validateCampaign(campaign);
  validateCharacter(character);
  validateChoice(choice);

  const assignedCharacterIds = new Set(
    campaign.characterAssignments.map(({ characterId }) => characterId),
  );
  assert.ok(assignedCharacterIds.has(character.id), "fixture character must be assigned");
  assert.equal(character.campaignId, campaign.id, "character must reference its campaign");
  assert.equal(choice.characterId, character.id, "choice must reference its character");
  assert.ok(character.choiceIds.includes(choice.id), "character must reference its choice");
}

test("example records satisfy their JSON Schemas when Ajv 2020 is installed", async (context) => {
  const requireFromDocs = createRequire(join(dashboardDirectory, "..", "package.json"));
  let Ajv2020;
  let addFormats;
  try {
    ({ default: Ajv2020 } = requireFromDocs("ajv/dist/2020"));
    ({ default: addFormats } = requireFromDocs("ajv-formats"));
  } catch {
    context.skip("Ajv 2020 is not installed in the repository dependency tree");
    return;
  }

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const [name, { schema, fixture }] of Object.entries(contracts)) {
    const validate = ajv.compile(schema);
    assert.equal(
      validate(fixture),
      true,
      `${name} fixture failed schema validation:\n${JSON.stringify(validate.errors, null, 2)}`,
    );
  }
});

test("example records satisfy cross-record and business invariants", () => {
  validateBusinessContracts({
    campaign: contracts.campaign.fixture,
    character: contracts.character.fixture,
    choice: contracts.choice.fixture,
  });
});

test("choice bounds, count, option existence, and option ids are enforced", () => {
  const bounds = structuredClone(contracts.choice.fixture);
  bounds.minimumSelections = 2;
  bounds.maximumSelections = 1;
  assert.throws(() => validateChoice(bounds), /minimumSelections/);

  const count = structuredClone(contracts.choice.fixture);
  count.selectedOptionIds = [];
  assert.throws(() => validateChoice(count), /selected option count/);

  const missing = structuredClone(contracts.choice.fixture);
  missing.selectedOptionIds = ["option-missing"];
  assert.throws(() => validateChoice(missing), /does not exist/);

  const duplicates = structuredClone(contracts.choice.fixture);
  duplicates.options[1].id = duplicates.options[0].id;
  assert.throws(() => validateChoice(duplicates), /option ids must be unique/);
});

test("campaign assignments reference unique slots and characters", () => {
  const unknown = structuredClone(contracts.campaign.fixture);
  unknown.characterAssignments[0].slotId = "slot-missing";
  assert.throws(() => validateCampaign(unknown), /unknown slot/);

  const duplicateCharacter = structuredClone(contracts.campaign.fixture);
  duplicateCharacter.characterAssignments.push({
    slotId: "slot-bren",
    characterId: "character-seren",
  });
  assert.throws(() => validateCampaign(duplicateCharacter), /only one player slot/);
});

test("character level, resource bounds, and instance ids are enforced", () => {
  const level = structuredClone(contracts.character.fixture);
  level.classes.push({
    class: { type: "class", name: "Fighter", source: "XPHB" },
    level: 18,
  });
  assert.throws(() => validateCharacter(level), /total class level/);

  const resource = structuredClone(contracts.character.fixture);
  resource.resources[0].current = 2;
  assert.throws(() => validateCharacter(resource), /must not exceed maximum/);

  const duplicate = structuredClone(contracts.character.fixture);
  duplicate.inventory.push(structuredClone(duplicate.inventory[0]));
  assert.throws(() => validateCharacter(duplicate), /inventory ids must be unique/);
});
