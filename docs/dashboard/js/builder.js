/*
 * Builder: the only thing that creates/changes construction choices (see
 * CHARACTER_DATA_DESIGN.md). Populates its dropdowns live from
 * WTCompendium — nothing here is a hardcoded list of classes/spells/items.
 * On save it produces a validated character export and hands it to the
 * caller; it does not know about PeerJS or slots.
 */
(function (global) {
	"use strict";

	const C = global.WTCompendium;

	function el(tag, attrs = {}, children = []) {
		const node = document.createElement(tag);
		for (const [k, v] of Object.entries(attrs)) {
			if (k === "text") node.textContent = v;
			else node.setAttribute(k, v);
		}
		for (const child of [].concat(children)) node.appendChild(child);
		return node;
	}

	function field(labelText, inputEl) {
		const label = el("label", { class: "builder-field" });
		label.appendChild(el("span", { text: labelText }));
		label.appendChild(inputEl);
		return label;
	}

	/**
	 * Mounts the builder into `formEl`; `saveBtn` triggers export.
	 * `initial` (optional) is a previous character-full export to prefill.
	 * `onExport(characterExport)` is called on save.
	 */
	async function mount(formEl, saveBtn, { compendium, onExport, initial = null }) {
		formEl.innerHTML = "<p>Loading compendium data…</p>";

		const [classNames, races, backgrounds, armors] = await Promise.all([
			compendium.listClassNames(),
			compendium.listRaces(),
			compendium.listBackgrounds(),
			compendium.listArmorAndShields(),
		]);

		formEl.innerHTML = "";

		const nameInput = el("input", { type: "text", id: "f-name", maxlength: "40" });
		const raceSelect = el("select", { id: "f-race" });
		for (const r of races) raceSelect.appendChild(el("option", { value: r.name, text: r.name }));

		const bgSelect = el("select", { id: "f-background" });
		for (const b of backgrounds) bgSelect.appendChild(el("option", { value: b.name, text: b.name }));

		const classSelect = el("select", { id: "f-class" });
		for (const name of classNames) {
			classSelect.appendChild(el("option", { value: name, text: name[0].toUpperCase() + name.slice(1) }));
		}

		const levelInput = el("input", { type: "number", id: "f-level", min: "1", max: "20", value: "1" });

		const abilityInputs = {};
		const abilitiesFieldset = el("fieldset", {}, el("legend", { text: "Ability Scores" }));
		for (const ab of ["str", "dex", "con", "int", "wis", "cha"]) {
			const input = el("input", { type: "number", id: `f-${ab}`, min: "1", max: "30", value: "10" });
			abilityInputs[ab] = input;
			abilitiesFieldset.appendChild(field(ab.toUpperCase(), input));
		}

		const armorSelect = el("select", { id: "f-armor" });
		armorSelect.appendChild(el("option", { value: "", text: "None" }));
		for (const a of armors.filter((i) => i.type !== "S")) {
			armorSelect.appendChild(el("option", { value: a.name, text: `${a.name} (AC ${a.ac})` }));
		}
		const shieldCheckbox = el("input", { type: "checkbox", id: "f-shield" });

		const spellsWrap = el("div", { id: "f-spells-wrap", hidden: "" });
		spellsWrap.appendChild(el("h4", { text: "Spells known" }));
		const spellsList = el("div", { id: "f-spells-list" });
		spellsWrap.appendChild(spellsList);

		const featuresPreview = el("div", { id: "f-features-preview", class: "builder-preview" });
		const statsPreview = el("div", { id: "f-stats-preview", class: "builder-preview" });

		formEl.appendChild(field("Name", nameInput));
		formEl.appendChild(field("Species", raceSelect));
		formEl.appendChild(field("Background", bgSelect));
		formEl.appendChild(field("Class", classSelect));
		formEl.appendChild(field("Level", levelInput));
		formEl.appendChild(abilitiesFieldset);
		formEl.appendChild(spellsWrap);
		formEl.appendChild(field("Armor", armorSelect));
		formEl.appendChild(field("Shield", shieldCheckbox));
		formEl.appendChild(el("h4", { text: "Granted features" }));
		formEl.appendChild(featuresPreview);
		formEl.appendChild(el("h4", { text: "Derived stats" }));
		formEl.appendChild(statsPreview);

		let currentClassData = null; // { cls, classFeature }
		let selectedSpellIds = new Set();

		function abilityScores() {
			const scores = {};
			for (const ab of Object.keys(abilityInputs)) {
				scores[ab] = parseInt(abilityInputs[ab].value, 10) || 10;
			}
			return scores;
		}

		function renderFeatures() {
			featuresPreview.innerHTML = "";
			if (!currentClassData) return;
			const level = parseInt(levelInput.value, 10) || 1;
			const features = compendium.featuresUpToLevel(
				currentClassData.cls,
				currentClassData.classFeature,
				level
			);
			const list = el("ul", { class: "feature-list" });
			for (const f of features) {
				list.appendChild(el("li", { text: `${f.name} (lvl ${f.level})` }));
			}
			featuresPreview.appendChild(list);
			return features;
		}

		function renderStats() {
			const scores = abilityScores();
			const level = parseInt(levelInput.value, 10) || 1;
			const conMod = C.abilityModifier(scores.con);
			const dexMod = C.abilityModifier(scores.dex);
			const prof = C.proficiencyBonus(level);
			const hp = currentClassData ? C.maxHp(currentClassData.cls.hd.faces, level, conMod) : null;
			const armorItem = armors.find((a) => a.name === armorSelect.value) || null;
			const shieldItem = shieldCheckbox.checked ? armors.find((a) => a.type === "S") : null;
			const ac = C.armorClass(dexMod, armorItem, shieldItem);

			statsPreview.innerHTML = "";
			const rows = [
				["Proficiency bonus", `+${prof}`],
				["Max HP", hp === null ? "— pick a class —" : hp],
				["Armor Class", ac],
				["Passive Perception", 10 + C.abilityModifier(scores.wis)],
			];
			if (currentClassData?.cls.spellcastingAbility) {
				const scMod = C.abilityModifier(scores[currentClassData.cls.spellcastingAbility]);
				rows.push(["Spell attack bonus", `+${prof + scMod}`]);
				rows.push(["Spell save DC", 8 + prof + scMod]);
			}
			const dl = el("dl", { class: "stats-list" });
			for (const [label, value] of rows) {
				dl.appendChild(el("dt", { text: label }));
				dl.appendChild(el("dd", { text: String(value) }));
			}
			statsPreview.appendChild(dl);
		}

		async function renderSpells() {
			spellsList.innerHTML = "";
			if (!currentClassData?.cls.spellcastingAbility) {
				spellsWrap.hidden = true;
				return;
			}
			spellsWrap.hidden = false;
			const className = currentClassData.cls.name;
			const spells = await compendium.listSpellsForClass(className);
			spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
			for (const sp of spells) {
				const id = C.makeId("spell", sp.name, sp.source);
				const cb = el("input", { type: "checkbox", value: id });
				cb.checked = selectedSpellIds.has(id);
				cb.addEventListener("change", () => {
					if (cb.checked) selectedSpellIds.add(id);
					else selectedSpellIds.delete(id);
				});
				const label = el("label", { class: "spell-option" }, [
					cb,
					el("span", { text: ` ${sp.name} (lvl ${sp.level})` }),
				]);
				spellsList.appendChild(label);
			}
		}

		async function onClassOrLevelChange() {
			const className = classSelect.value;
			if (className) currentClassData = await compendium.getClass(className);
			renderFeatures();
			renderStats();
			await renderSpells();
		}

		classSelect.addEventListener("change", onClassOrLevelChange);
		levelInput.addEventListener("change", onClassOrLevelChange);
		levelInput.addEventListener("input", () => {
			renderFeatures();
			renderStats();
		});
		for (const input of Object.values(abilityInputs)) {
			input.addEventListener("input", renderStats);
		}
		armorSelect.addEventListener("change", renderStats);
		shieldCheckbox.addEventListener("change", renderStats);

		if (initial) {
			nameInput.value = initial.name || "";
			if (initial.choices?.species_id) raceSelect.value = races.find((r) => C.makeId("race", r.name, r.source) === initial.choices.species_id)?.name || "";
			if (initial.choices?.background_id) bgSelect.value = backgrounds.find((b) => C.makeId("background", b.name, b.source) === initial.choices.background_id)?.name || "";
			const cls = initial.choices?.classes?.[0];
			if (cls) {
				classSelect.value = C.parseId(cls.class_id).slug;
				levelInput.value = String(cls.level || 1);
			}
			if (initial.choices?.ability_scores) {
				for (const ab of Object.keys(abilityInputs)) {
					if (initial.choices.ability_scores[ab] != null) {
						abilityInputs[ab].value = String(initial.choices.ability_scores[ab]);
					}
				}
			}
			selectedSpellIds = new Set(initial.choices?.selected_spells || []);
		}

		await onClassOrLevelChange();

		saveBtn.addEventListener("click", async () => {
			if (!classSelect.value) {
				alert("Pick a class first.");
				return;
			}
			const scores = abilityScores();
			const level = parseInt(levelInput.value, 10) || 1;
			const race = races.find((r) => r.name === raceSelect.value);
			const background = backgrounds.find((b) => b.name === bgSelect.value);
			const armorItem = armors.find((a) => a.name === armorSelect.value) || null;
			const shieldItem = shieldCheckbox.checked ? armors.find((a) => a.type === "S") : null;
			const features = renderFeatures();
			const conMod = C.abilityModifier(scores.con);
			const dexMod = C.abilityModifier(scores.dex);
			const prof = C.proficiencyBonus(level);

			const derived = {
				level,
				proficiency_bonus: prof,
				max_hp: C.maxHp(currentClassData.cls.hd.faces, level, conMod),
				armor_class: C.armorClass(dexMod, armorItem, shieldItem),
				passive_perception: 10 + C.abilityModifier(scores.wis),
				granted_features: features.map((f) => f.id),
			};
			if (currentClassData.cls.spellcastingAbility) {
				const scMod = C.abilityModifier(scores[currentClassData.cls.spellcastingAbility]);
				derived.spell_attack_bonus = prof + scMod;
				derived.spell_save_dc = 8 + prof + scMod;
			}

			const characterExport = {
				schema_version: "0.1",
				character_id: initial?.character_id || `char_${Math.random().toString(36).slice(2, 10)}`,
				name: nameInput.value.trim() || "Unnamed Character",
				ruleset: "5e-2014",
				choices: {
					species_id: race ? C.makeId("race", race.name, race.source) : null,
					background_id: background ? C.makeId("background", background.name, background.source) : null,
					classes: [
						{
							class_id: C.makeId("class", currentClassData.cls.name, currentClassData.cls.source),
							level,
						},
					],
					ability_scores: scores,
					selected_spells: Array.from(selectedSpellIds),
					selected_equipment: [
						...(armorItem ? [C.makeId("item", armorItem.name, armorItem.source)] : []),
						...(shieldItem ? [C.makeId("item", shieldItem.name, shieldItem.source)] : []),
					],
				},
				derived,
				state: initial?.state || {
					current_hp: derived.max_hp,
					temporary_hp: 0,
					hit_dice_used: 0,
					conditions: [],
					prepared_spells: [],
					inventory_instances: [],
				},
			};

			onExport(characterExport);
		});
	}

	/**
	 * Renders a read-only sheet from a character export — a pure view, no
	 * recomputation. This is what keeps the sheet from ever disagreeing
	 * with what the builder produced.
	 */
	function renderSheet(container, characterExport) {
		container.innerHTML = "";
		const cls = characterExport.choices.classes[0];
		const className = C.parseId(cls.class_id).slug;
		container.appendChild(
			el("h4", { text: `${characterExport.name} — ${className} ${cls.level}` })
		);
		const dl = el("dl", { class: "stats-list" });
		const rows = [
			["AC", characterExport.derived.armor_class],
			["HP", `${characterExport.state.current_hp} / ${characterExport.derived.max_hp}`],
			["Proficiency", `+${characterExport.derived.proficiency_bonus}`],
			["Passive Perception", characterExport.derived.passive_perception],
		];
		for (const [label, value] of rows) {
			dl.appendChild(el("dt", { text: label }));
			dl.appendChild(el("dd", { text: String(value) }));
		}
		container.appendChild(dl);

		if (characterExport.choices.selected_spells.length) {
			container.appendChild(el("h5", { text: "Spells" }));
			const list = el("ul");
			for (const id of characterExport.choices.selected_spells) {
				list.appendChild(el("li", { text: C.parseId(id).slug.replace(/-/g, " ") }));
			}
			container.appendChild(list);
		}
	}

	global.WTBuilder = { mount, renderSheet };
})(window);
