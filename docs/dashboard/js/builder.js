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
	const R = global.WTEntryRender;

	const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];

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
	 * A collapsible group for arbitrary DOM content (filter controls + a
	 * long checklist), styled like R.collapsibleRow but built from real
	 * child elements instead of rendered entries markup. Returns a setMeta
	 * hook so callers can keep e.g. a "3 selected" count current without
	 * rebuilding the section (which would blow away its open/closed state).
	 */
	function collapsibleSection(title, bodyEl, { startOpen = false } = {}) {
		const row = el("div", { class: "entry-row" + (startOpen ? " is-open" : "") });
		const summary = el("div", { class: "entry-summary" });
		const titleSpan = el("span", { class: "entry-title", text: title });
		const metaSpan = el("span", { class: "entry-meta" });
		summary.appendChild(titleSpan);
		summary.appendChild(metaSpan);
		row.appendChild(summary);
		bodyEl.classList.add("entry-body");
		bodyEl.hidden = !startOpen;
		row.appendChild(bodyEl);
		summary.addEventListener("click", () => {
			bodyEl.hidden = !bodyEl.hidden;
			row.classList.toggle("is-open", !bodyEl.hidden);
		});
		return { row, setMeta: (text) => { metaSpan.textContent = text; } };
	}

	const FEAT_CATEGORY_LABELS = {
		G: "General",
		O: "Origin",
		FS: "Fighting Style",
		"FS:P": "Fighting Style",
		"FS:R": "Fighting Style",
		EB: "Epic Boon",
	};
	const FEAT_CATEGORY_FILTERS = [
		["all", "All categories"],
		["G", "General"],
		["O", "Origin"],
		["FS", "Fighting Style"],
		["EB", "Epic Boon"],
	];
	function featCategoryGroup(category) {
		return String(category || "").startsWith("FS") ? "FS" : category;
	}

	/**
	 * Mounts the builder into `formEl`; `saveBtn` triggers export.
	 * `initial` (optional) is a previous character-full export to prefill.
	 * `onExport(characterExport)` is called on save.
	 */
	async function mount(formEl, saveBtn, { compendium, onExport, initial = null }) {
		formEl.innerHTML = "<p>Loading compendium data…</p>";

		const [classNames, races, backgrounds, armors, feats] = await Promise.all([
			compendium.listClassNames(),
			compendium.listRaces(),
			compendium.listBackgrounds(),
			compendium.listArmorAndShields(),
			compendium.listFeats(),
		]);

		formEl.innerHTML = "";

		const nameInput = el("input", { type: "text", id: "f-name", maxlength: "40" });
		const raceSelect = el("select", { id: "f-race" });
		for (const r of races) raceSelect.appendChild(el("option", { value: r.name, text: r.name }));
		const racePreview = el("div", { class: "menu-preview" });

		const bgSelect = el("select", { id: "f-background" });
		for (const b of backgrounds) bgSelect.appendChild(el("option", { value: b.name, text: b.name }));
		const bgPreview = el("div", { class: "menu-preview" });

		const classSelect = el("select", { id: "f-class" });
		for (const name of classNames) {
			classSelect.appendChild(el("option", { value: name, text: name[0].toUpperCase() + name.slice(1) }));
		}

		// Subclasses have no entries text of their own in the data (their
		// description lives in the first subclass feature, e.g. "Abjurer" at
		// level 3) -- so no separate preview block, just the select; its
		// features fold straight into the granted-features preview below.
		const subclassSelect = el("select", { id: "f-subclass" });

		const levelInput = el("input", { type: "number", id: "f-level", min: "1", max: "20", value: "1" });

		const abilityInputs = {};
		const abilitiesFieldset = el("fieldset", {}, el("legend", { text: "Ability Scores" }));
		for (const ab of ABILITIES) {
			const input = el("input", { type: "number", id: `f-${ab}`, min: "1", max: "30", value: "10" });
			abilityInputs[ab] = input;
			abilitiesFieldset.appendChild(field(ab.toUpperCase(), input));
		}

		// Bonus helper: several unenforced ways to bump scores. 2024 species
		// don't grant ability bonuses (backgrounds do), so "background" reads
		// the selected background's real 2/1-or-1/1/1 weighted choice data;
		// "species" is a legacy/optional-rule fallback for tables still
		// using 2014-style fixed racial bonuses. Nothing here validates
		// against the others -- pick one, hit Apply, sort out any overlap
		// yourself.
		const asiMethodSelect = el("select", { id: "f-asi-method" }, [
			el("option", { value: "none", text: "— none —" }),
			el("option", { value: "background", text: "Background bonus (2024)" }),
			el("option", { value: "flex21", text: "Flexible +2/+1 (any abilities)" }),
			el("option", { value: "flex111", text: "Flexible +1/+1/+1 (any abilities)" }),
			el("option", { value: "species", text: "Species bonus (legacy 2014 rule)" }),
		]);
		const asiControls = el("div", { id: "f-asi-controls" });
		const asiApplyBtn = el("button", { type: "button", text: "Apply to scores above" });
		const asiFieldset = el("fieldset", {}, [
			el("legend", { text: "Ability score bonus helper" }),
			field("Method", asiMethodSelect),
			asiControls,
			asiApplyBtn,
		]);

		const armorSelect = el("select", { id: "f-armor" });
		armorSelect.appendChild(el("option", { value: "", text: "None" }));
		for (const a of armors.filter((i) => C.baseType(i) !== "S")) {
			armorSelect.appendChild(el("option", { value: a.name, text: `${a.name} (AC ${a.ac})` }));
		}
		const shieldCheckbox = el("input", { type: "checkbox", id: "f-shield" });

		// Spells: filterable by level (cantrip/1st-9th) since a full class list
		// can run 40-60+ rows; wrapped in a collapsible section so it can be
		// tucked away once picks are made without losing them.
		const spellsWrap = el("div", { id: "f-spells-wrap", hidden: "" });
		const spellLevelFilter = el("select", { id: "f-spell-level-filter" }, [
			el("option", { value: "all", text: "All levels" }),
			el("option", { value: "0", text: "Cantrip" }),
			...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => el("option", { value: String(lvl), text: `Level ${lvl}` })),
		]);
		const spellsList = el("div", { id: "f-spells-list" });
		const spellsSectionBody = el("div", {}, [field("Filter by level", spellLevelFilter), spellsList]);
		const spellsSection = collapsibleSection("Spells known", spellsSectionBody, { startOpen: true });
		spellsWrap.appendChild(spellsSection.row);

		// Feats: no prerequisite checking (ability/class/level requirements
		// aren't enforced here) -- a plain checklist beats no feat support at
		// all. Filterable by category since the 2024 list runs 70+ entries.
		const featCategoryFilter = el(
			"select",
			{ id: "f-feat-category-filter" },
			FEAT_CATEGORY_FILTERS.map(([value, text]) => el("option", { value, text }))
		);
		const featsList = el("div", { id: "f-feats-list" });
		const featsSectionBody = el("div", {}, [field("Filter by category", featCategoryFilter), featsList]);
		const featsSection = collapsibleSection("Feats", featsSectionBody);

		const featuresPreview = el("div", { id: "f-features-preview", class: "builder-preview" });
		const statsPreview = el("div", { id: "f-stats-preview", class: "builder-preview" });

		// Order matches how a player actually fills this in: identity ->
		// what you get from it (features) -> ability scores -> spells ->
		// gear -> the numbers those choices add up to. The spell menu can
		// run to 200+ rows, so it and everything after it must come last —
		// otherwise it buries the rest of the form thousands of pixels down.
		formEl.appendChild(field("Name", nameInput));
		formEl.appendChild(field("Species", raceSelect));
		formEl.appendChild(racePreview);
		formEl.appendChild(field("Background", bgSelect));
		formEl.appendChild(bgPreview);
		formEl.appendChild(field("Class", classSelect));
		formEl.appendChild(field("Subclass", subclassSelect));
		formEl.appendChild(field("Level", levelInput));
		formEl.appendChild(el("h4", { text: "Granted features" }));
		formEl.appendChild(featuresPreview);
		formEl.appendChild(abilitiesFieldset);
		formEl.appendChild(asiFieldset);
		formEl.appendChild(featsSection.row);
		formEl.appendChild(field("Armor", armorSelect));
		formEl.appendChild(field("Shield", shieldCheckbox));
		formEl.appendChild(el("h4", { text: "Derived stats" }));
		formEl.appendChild(statsPreview);
		formEl.appendChild(spellsWrap);

		let currentClassData = null; // { cls, classFeature, raw }
		let selectedSpellIds = new Set();
		let selectedFeatIds = new Set();
		let lastRenderedSpells = []; // full spell objects (name/level/entries) for the current class, so save can pull entries text for the sheet without a second fetch
		let subclassBuiltForClass = null; // guards against wiping the picked subclass on every level change

		feats.sort((a, b) => featCategoryGroup(a.category).localeCompare(featCategoryGroup(b.category)) || a.name.localeCompare(b.name));

		function selectedSubclassEntry() {
			if (!currentClassData || !subclassSelect.value) return null;
			return compendium.subclassesForClass(currentClassData).find((s) => s.name === subclassSelect.value) || null;
		}

		function renderSubclassOptions() {
			subclassSelect.innerHTML = "";
			subclassSelect.appendChild(el("option", { value: "", text: "— none —" }));
			if (!currentClassData) return;
			for (const s of compendium.subclassesForClass(currentClassData)) {
				subclassSelect.appendChild(el("option", { value: s.name, text: s.name }));
			}
		}

		function abilityScores() {
			const scores = {};
			for (const ab of Object.keys(abilityInputs)) {
				scores[ab] = parseInt(abilityInputs[ab].value, 10) || 10;
			}
			return scores;
		}

		function renderFeatures() {
			featuresPreview.innerHTML = "";
			if (!currentClassData) return [];
			const level = parseInt(levelInput.value, 10) || 1;
			const features = compendium.featuresUpToLevel(
				currentClassData.cls,
				currentClassData.classFeature,
				level
			);
			const subclass = selectedSubclassEntry();
			const subclassFeatures = subclass
				? compendium.subclassFeaturesUpToLevel(subclass, currentClassData.raw.subclassFeature, level)
				: [];
			const allFeatures = [...features, ...subclassFeatures].sort((a, b) => a.level - b.level);
			for (const f of allFeatures) {
				featuresPreview.appendChild(
					R.collapsibleRow({ title: f.name, meta: `lvl ${f.level}`, entries: f.entries })
				);
			}
			return allFeatures;
		}

		function renderRacePreview() {
			racePreview.innerHTML = "";
			const race = races.find((r) => r.name === raceSelect.value);
			if (!race) return;
			racePreview.appendChild(
				R.collapsibleRow({ title: race.name, meta: race.source, entries: race.entries })
			);
		}

		function renderBackgroundPreview() {
			bgPreview.innerHTML = "";
			const background = backgrounds.find((b) => b.name === bgSelect.value);
			if (!background) return;
			bgPreview.appendChild(
				R.collapsibleRow({ title: background.name, meta: background.source, entries: background.entries })
			);
		}

		/** Every ability the currently-selected ASI method could touch. */
		function renderAsiControls() {
			asiControls.innerHTML = "";
			const method = asiMethodSelect.value;
			if (method === "species") {
				const race = races.find((r) => r.name === raceSelect.value);
				const abilityBlock = race?.ability?.[0];
				if (!abilityBlock) {
					asiControls.appendChild(el("p", { text: "No structured ability bonus in the data for this species — apply it by hand if the book text grants one." }));
					return;
				}
				const fixed = ABILITIES.filter((ab) => abilityBlock[ab]);
				if (fixed.length) {
					asiControls.appendChild(
						el("p", { text: `Fixed: ${fixed.map((ab) => `${ab.toUpperCase()} +${abilityBlock[ab]}`).join(", ")}` })
					);
				}
				if (abilityBlock.choose) {
					asiControls.appendChild(el("p", { text: `Choose ${abilityBlock.choose.count} from ${abilityBlock.choose.from.map((a) => a.toUpperCase()).join(", ")} (+1 each):` }));
					for (const ab of abilityBlock.choose.from) {
						const cb = el("input", { type: "checkbox", value: ab, "data-role": "species-choose" });
						asiControls.appendChild(el("label", { class: "spell-option" }, [cb, el("span", { text: ` ${ab.toUpperCase()}` })]));
					}
				}
			} else if (method === "flex21") {
				asiControls.appendChild(el("p", { text: "Pick the ability that gets +2, and a different one that gets +1." }));
				const plusTwo = el("select", { "data-role": "flex21-two" });
				const plusOne = el("select", { "data-role": "flex21-one" });
				for (const sel of [plusTwo, plusOne]) {
					for (const ab of ABILITIES) sel.appendChild(el("option", { value: ab, text: ab.toUpperCase() }));
				}
				asiControls.appendChild(field("+2 to", plusTwo));
				asiControls.appendChild(field("+1 to", plusOne));
			} else if (method === "flex111") {
				asiControls.appendChild(el("p", { text: "Pick three abilities to get +1 each." }));
				for (const ab of ABILITIES) {
					const cb = el("input", { type: "checkbox", value: ab, "data-role": "flex111" });
					asiControls.appendChild(el("label", { class: "spell-option" }, [cb, el("span", { text: ` ${ab.toUpperCase()}` })]));
				}
			} else if (method === "background") {
				const background = backgrounds.find((b) => b.name === bgSelect.value);
				const choices = (background?.ability || [])
					.map((entry) => entry.choose?.weighted)
					.filter(Boolean);
				if (!choices.length) {
					asiControls.appendChild(el("p", { text: "This background has no structured ability bonus in the data." }));
					return;
				}
				const spreadSelect = el("select", { "data-role": "bg-spread" });
				choices.forEach((c, i) => {
					spreadSelect.appendChild(el("option", { value: String(i), text: `+${c.weights.join("/+")}` }));
				});
				asiControls.appendChild(field("Spread", spreadSelect));
				const pickersWrap = el("div", { "data-role": "bg-pickers" });
				asiControls.appendChild(pickersWrap);

				function renderPickers() {
					pickersWrap.innerHTML = "";
					const chosen = choices[Number(spreadSelect.value)];
					const from = chosen.from.map((ab) => ab.toLowerCase());
					if (new Set(chosen.weights).size === 1) {
						asiControls.querySelector("p.bg-hint")?.remove();
						pickersWrap.appendChild(el("p", { class: "bg-hint", text: `Pick ${chosen.weights.length} abilities to get +${chosen.weights[0]} each, from this background's list.` }));
						for (const ab of from) {
							const cb = el("input", { type: "checkbox", value: ab, "data-role": "bg-pick-equal" });
							pickersWrap.appendChild(el("label", { class: "spell-option" }, [cb, el("span", { text: ` ${ab.toUpperCase()}` })]));
						}
					} else {
						chosen.weights.forEach((w, tier) => {
							const sel = el("select", { "data-role": `bg-pick-${tier}` });
							for (const ab of from) sel.appendChild(el("option", { value: ab, text: ab.toUpperCase() }));
							pickersWrap.appendChild(field(`+${w} to`, sel));
						});
					}
				}
				spreadSelect.addEventListener("change", renderPickers);
				renderPickers();
			}
		}

		function applyAsiBonus() {
			const method = asiMethodSelect.value;
			const deltas = {};
			if (method === "species") {
				const race = races.find((r) => r.name === raceSelect.value);
				const abilityBlock = race?.ability?.[0];
				if (!abilityBlock) return;
				for (const ab of ABILITIES) if (abilityBlock[ab]) deltas[ab] = (deltas[ab] || 0) + abilityBlock[ab];
				for (const cb of asiControls.querySelectorAll('[data-role="species-choose"]:checked')) {
					deltas[cb.value] = (deltas[cb.value] || 0) + 1;
				}
			} else if (method === "flex21") {
				const two = asiControls.querySelector('[data-role="flex21-two"]')?.value;
				const one = asiControls.querySelector('[data-role="flex21-one"]')?.value;
				if (two) deltas[two] = (deltas[two] || 0) + 2;
				if (one) deltas[one] = (deltas[one] || 0) + 1;
			} else if (method === "flex111") {
				for (const cb of asiControls.querySelectorAll('[data-role="flex111"]:checked')) {
					deltas[cb.value] = (deltas[cb.value] || 0) + 1;
				}
			} else if (method === "background") {
				const background = backgrounds.find((b) => b.name === bgSelect.value);
				const choices = (background?.ability || []).map((entry) => entry.choose?.weighted).filter(Boolean);
				const spreadIndex = Number(asiControls.querySelector('[data-role="bg-spread"]')?.value || 0);
				const chosen = choices[spreadIndex];
				if (!chosen) return;
				if (new Set(chosen.weights).size === 1) {
					for (const cb of asiControls.querySelectorAll('[data-role="bg-pick-equal"]:checked')) {
						deltas[cb.value] = (deltas[cb.value] || 0) + chosen.weights[0];
					}
				} else {
					chosen.weights.forEach((w, tier) => {
						const ab = asiControls.querySelector(`[data-role="bg-pick-${tier}"]`)?.value;
						if (ab) deltas[ab] = (deltas[ab] || 0) + w;
					});
				}
			}
			for (const [ab, delta] of Object.entries(deltas)) {
				abilityInputs[ab].value = String((parseInt(abilityInputs[ab].value, 10) || 10) + delta);
			}
			renderStats();
		}

		function renderStats() {
			const scores = abilityScores();
			const level = parseInt(levelInput.value, 10) || 1;
			const conMod = C.abilityModifier(scores.con);
			const dexMod = C.abilityModifier(scores.dex);
			const prof = C.proficiencyBonus(level);
			const hp = currentClassData ? C.maxHp(currentClassData.cls.hd.faces, level, conMod) : null;
			const armorItem = armors.find((a) => a.name === armorSelect.value) || null;
			const shieldItem = shieldCheckbox.checked ? armors.find((a) => C.baseType(a) === "S") : null;
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

		function renderSpellRows() {
			spellsList.innerHTML = "";
			const filter = spellLevelFilter.value;
			for (const sp of lastRenderedSpells) {
				if (filter !== "all" && String(sp.level) !== filter) continue;
				const id = C.makeId("spell", sp.name, sp.source);
				const row = R.collapsibleRow({
					title: sp.name,
					meta: sp.level === 0 ? "cantrip" : `lvl ${sp.level}`,
					entries: sp.entries,
				});
				const cb = el("input", { type: "checkbox", value: id, class: "entry-select" });
				cb.checked = selectedSpellIds.has(id);
				// Selecting a spell shouldn't also toggle its description open.
				cb.addEventListener("click", (e) => e.stopPropagation());
				cb.addEventListener("change", () => {
					if (cb.checked) selectedSpellIds.add(id);
					else selectedSpellIds.delete(id);
					spellsSection.setMeta(`${selectedSpellIds.size} selected`);
				});
				row.querySelector(".entry-summary").append(cb);
				spellsList.appendChild(row);
			}
			spellsSection.setMeta(`${selectedSpellIds.size} selected`);
		}

		async function renderSpells(token) {
			if (!currentClassData?.cls.spellcastingAbility) {
				spellsWrap.hidden = true;
				lastRenderedSpells = [];
				spellsList.innerHTML = "";
				return;
			}
			const className = currentClassData.cls.name;
			const spells = await compendium.listSpellsForClass(className, currentClassData.cls.source);
			if (token !== requestToken) return; // a newer class/level change superseded this fetch
			spellsWrap.hidden = false;
			spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
			lastRenderedSpells = spells;
			renderSpellRows();
		}

		function renderFeatRows() {
			featsList.innerHTML = "";
			const filter = featCategoryFilter.value;
			for (const feat of feats) {
				if (filter !== "all" && featCategoryGroup(feat.category) !== filter) continue;
				const id = C.makeId("feat", feat.name, feat.source);
				const row = R.collapsibleRow({
					title: feat.name,
					meta: FEAT_CATEGORY_LABELS[feat.category] || feat.category || "",
					entries: feat.entries,
				});
				const cb = el("input", { type: "checkbox", value: id, class: "entry-select" });
				cb.checked = selectedFeatIds.has(id);
				cb.addEventListener("click", (e) => e.stopPropagation());
				cb.addEventListener("change", () => {
					if (cb.checked) selectedFeatIds.add(id);
					else selectedFeatIds.delete(id);
					featsSection.setMeta(`${selectedFeatIds.size} selected`);
				});
				row.querySelector(".entry-summary").append(cb);
				featsList.appendChild(row);
			}
			featsSection.setMeta(`${selectedFeatIds.size} selected`);
		}

		let requestToken = 0;

		/**
		 * Rapid class/level changes fire this repeatedly; each call's async
		 * fetches (getClass, listSpellsForClass) race independently, and an
		 * older, slower call finishing after a newer one would otherwise
		 * overwrite the DOM with stale data. The token makes every step
		 * check "am I still the latest request?" before touching anything.
		 */
		async function onClassOrLevelChange() {
			const token = ++requestToken;
			const className = classSelect.value;
			if (className) currentClassData = await compendium.getClass(className);
			if (token !== requestToken) return;
			// Subclass options only depend on the class, not level -- rebuilding
			// them on every level tick would wipe out the player's pick.
			if (subclassBuiltForClass !== className) {
				renderSubclassOptions();
				subclassBuiltForClass = className;
			}
			renderFeatures();
			renderStats();
			await renderSpells(token);
		}

		classSelect.addEventListener("change", onClassOrLevelChange);
		subclassSelect.addEventListener("change", renderFeatures);
		levelInput.addEventListener("change", onClassOrLevelChange);
		levelInput.addEventListener("input", () => {
			renderFeatures();
			renderStats();
		});
		spellLevelFilter.addEventListener("change", renderSpellRows);
		featCategoryFilter.addEventListener("change", renderFeatRows);
		for (const input of Object.values(abilityInputs)) {
			input.addEventListener("input", renderStats);
		}
		armorSelect.addEventListener("change", renderStats);
		shieldCheckbox.addEventListener("change", renderStats);
		raceSelect.addEventListener("change", () => {
			renderRacePreview();
			if (asiMethodSelect.value === "species") renderAsiControls();
		});
		bgSelect.addEventListener("change", () => {
			renderBackgroundPreview();
			if (asiMethodSelect.value === "background") renderAsiControls();
		});
		asiMethodSelect.addEventListener("change", renderAsiControls);
		asiApplyBtn.addEventListener("click", applyAsiBonus);
		renderAsiControls();

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
			selectedFeatIds = new Set(initial.choices?.selected_feats || []);
		}

		renderRacePreview();
		renderBackgroundPreview();
		await onClassOrLevelChange();

		const initialSubclassId = initial?.choices?.classes?.[0]?.subclass_id;
		if (initialSubclassId) {
			const subSlug = C.parseId(initialSubclassId).slug;
			const match = Array.from(subclassSelect.options).find((o) => C.slugify(o.value) === subSlug);
			if (match) {
				subclassSelect.value = match.value;
				renderFeatures();
			}
		}
		renderFeatRows();

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
			const shieldItem = shieldCheckbox.checked ? armors.find((a) => C.baseType(a) === "S") : null;
			const subclass = selectedSubclassEntry();
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
				granted_features: features.map((f) => ({ id: f.id, name: f.name, level: f.level, entries: f.entries })),
			};
			if (currentClassData.cls.spellcastingAbility) {
				const scMod = C.abilityModifier(scores[currentClassData.cls.spellcastingAbility]);
				derived.spell_attack_bonus = prof + scMod;
				derived.spell_save_dc = 8 + prof + scMod;
			}
			// Display convenience for the sheet -- resolves each selected spell's
			// full entries text once, at save time, so the sheet can render it
			// without recomputing or re-fetching (it just trusts this export).
			derived.selected_spell_details = Array.from(selectedSpellIds).map((id) => {
				const sp = lastRenderedSpells.find((s) => C.makeId("spell", s.name, s.source) === id);
				return sp
					? { id, name: sp.name, level: sp.level, entries: sp.entries }
					: { id, name: C.parseId(id).slug.replace(/-/g, " "), level: null, entries: [] };
			});
			// Same idea for feats -- no prerequisite validation happened above,
			// this just records what was checked.
			derived.selected_feat_details = Array.from(selectedFeatIds).map((id) => {
				const feat = feats.find((f) => C.makeId("feat", f.name, f.source) === id);
				return feat
					? { id, name: feat.name, category: feat.category, entries: feat.entries }
					: { id, name: C.parseId(id).slug.replace(/-/g, " "), category: null, entries: [] };
			});

			const characterExport = {
				schema_version: "0.1",
				character_id: initial?.character_id || `char_${Math.random().toString(36).slice(2, 10)}`,
				name: nameInput.value.trim() || "Unnamed Character",
				ruleset: "5e-2024",
				choices: {
					species_id: race ? C.makeId("race", race.name, race.source) : null,
					background_id: background ? C.makeId("background", background.name, background.source) : null,
					classes: [
						{
							class_id: C.makeId("class", currentClassData.cls.name, currentClassData.cls.source),
							level,
							subclass_id: subclass ? C.makeId("subclass", subclass.name, subclass.source) : null,
						},
					],
					ability_scores: scores,
					selected_spells: Array.from(selectedSpellIds),
					selected_feats: Array.from(selectedFeatIds),
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
		const subclassName = cls.subclass_id ? ` (${C.parseId(cls.subclass_id).slug.replace(/-/g, " ")})` : "";
		container.appendChild(
			el("h4", { text: `${characterExport.name} — ${className}${subclassName} ${cls.level}` })
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

		if (characterExport.derived.granted_features?.length) {
			container.appendChild(el("h5", { text: "Features" }));
			for (const f of characterExport.derived.granted_features) {
				container.appendChild(
					R.collapsibleRow({ title: f.name, meta: `lvl ${f.level}`, entries: f.entries || [] })
				);
			}
		}

		const spellDetails = characterExport.derived.selected_spell_details;
		if (spellDetails?.length) {
			container.appendChild(el("h5", { text: "Spells" }));
			for (const sp of spellDetails) {
				container.appendChild(
					R.collapsibleRow({
						title: sp.name,
						meta: sp.level === 0 ? "cantrip" : sp.level != null ? `lvl ${sp.level}` : "",
						entries: sp.entries || [],
					})
				);
			}
		} else if (characterExport.choices.selected_spells.length) {
			// Older export from before selected_spell_details existed -- fall
			// back to plain names rather than showing nothing.
			container.appendChild(el("h5", { text: "Spells" }));
			const list = el("ul");
			for (const id of characterExport.choices.selected_spells) {
				list.appendChild(el("li", { text: C.parseId(id).slug.replace(/-/g, " ") }));
			}
			container.appendChild(list);
		}

		const featDetails = characterExport.derived.selected_feat_details;
		if (featDetails?.length) {
			container.appendChild(el("h5", { text: "Feats" }));
			for (const f of featDetails) {
				container.appendChild(
					R.collapsibleRow({
						title: f.name,
						meta: FEAT_CATEGORY_LABELS[f.category] || f.category || "",
						entries: f.entries || [],
					})
				);
			}
		} else if (characterExport.choices.selected_feats?.length) {
			// Older export from before selected_feat_details existed.
			container.appendChild(el("h5", { text: "Feats" }));
			const list = el("ul");
			for (const id of characterExport.choices.selected_feats) {
				list.appendChild(el("li", { text: C.parseId(id).slug.replace(/-/g, " ") }));
			}
			container.appendChild(list);
		}
	}

	global.WTBuilder = { mount, renderSheet };
})(window);
