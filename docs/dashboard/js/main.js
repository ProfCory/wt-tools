(function () {
	"use strict";

	const $ = (sel) => document.querySelector(sel);

	const els = {
		roleChooser: $("#role-chooser"),
		btnHost: $("#btn-host"),
		btnStandaloneBuilder: $("#btn-standalone-builder"),
		standalonePanel: $("#standalone-panel"),
		btnStandaloneBack: $("#btn-standalone-back"),
		standaloneListWrap: $("#standalone-list-wrap"),
		standaloneList: $("#standalone-list"),
		btnStandaloneNew: $("#btn-standalone-new"),
		standaloneBuilderWrap: $("#standalone-builder-wrap"),
		standaloneBuilderHeading: $("#standalone-builder-heading"),
		standaloneBuilderForm: $("#standalone-builder-form"),
		btnStandaloneSave: $("#btn-standalone-save"),
		btnStandaloneCancel: $("#btn-standalone-cancel"),
		standaloneSheetWrap: $("#standalone-sheet-wrap"),
		standaloneSheetView: $("#standalone-sheet-view"),
		btnStandaloneDone: $("#btn-standalone-done"),
		dmPanel: $("#dm-panel"),
		playerPanel: $("#player-panel"),
		roomLink: $("#room-link"),
		roomCode: $("#room-code"),
		waitingList: $("#waiting-list"),
		playerStatus: $("#player-status"),
		log: $("#event-log"),
		btnPing: $("#btn-ping"),
		pingTargetWrap: $("#ping-target-wrap"),
		pingTarget: $("#ping-target"),
		dmSlots: $("#dm-slots"),
		playerSlotsWrap: $("#player-slots-wrap"),
		playerSlots: $("#player-slots"),
		builderWrap: $("#builder-wrap"),
		builderForm: $("#builder-form"),
		btnBuildSave: $("#btn-build-save"),
		sheetWrap: $("#sheet-wrap"),
		sheetView: $("#sheet-view"),
		dmBestiaryList: $("#dm-bestiary-list"),
		playerBestiaryWrap: $("#player-bestiary-wrap"),
		playerBestiaryList: $("#player-bestiary-list"),
	};

	function log(msg) {
		const line = document.createElement("div");
		line.className = "log-line";
		const ts = new Date().toLocaleTimeString();
		line.textContent = `[${ts}] ${msg}`;
		els.log.prepend(line);
	}

	function showPanel(panel) {
		for (const p of [els.roleChooser, els.dmPanel, els.playerPanel, els.standalonePanel]) {
			p.hidden = p !== panel;
		}
	}

	// Characters built without a DM session (no code yet) live here, keyed by
	// character_id, so they can be re-opened, re-exported, or picked up later
	// once the player actually joins a room -- see loadSavedCharacters() use
	// in maybeShowBuilder().
	const SAVED_CHARACTERS_KEY = "wt-dashboard-saved-characters";

	function loadSavedCharacters() {
		try {
			return JSON.parse(localStorage.getItem(SAVED_CHARACTERS_KEY) || "[]");
		} catch {
			return [];
		}
	}

	function upsertSavedCharacter(characterExport) {
		const list = loadSavedCharacters();
		const idx = list.findIndex((c) => c.character_id === characterExport.character_id);
		if (idx >= 0) list[idx] = characterExport;
		else list.push(characterExport);
		localStorage.setItem(SAVED_CHARACTERS_KEY, JSON.stringify(list));
	}

	function deleteSavedCharacter(characterId) {
		const list = loadSavedCharacters().filter((c) => c.character_id !== characterId);
		localStorage.setItem(SAVED_CHARACTERS_KEY, JSON.stringify(list));
	}

	function downloadCharacterJson(characterExport) {
		const blob = new Blob([JSON.stringify(characterExport, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${(characterExport.name || "character").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function addWaitingRow(peerId) {
		const row = document.createElement("li");
		row.dataset.peerId = peerId;
		row.innerHTML = `<span class="peer-id">${peerId}</span> <span class="peer-state">connected, unclaimed</span>`;
		els.waitingList.appendChild(row);
	}

	function removeWaitingRow(peerId) {
		els.waitingList.querySelector(`[data-peer-id="${CSS.escape(peerId)}"]`)?.remove();
	}

	/**
	 * Renders the 5 slots into `container`. In player mode, empty slots get a
	 * name input + Claim button; `onClaim(index, name)` fires on click.
	 */
	function renderSlots(container, slots, { myPeerId = null, onClaim = null, characters = null } = {}) {
		container.innerHTML = "";
		for (const slot of slots) {
			const li = document.createElement("li");
			li.className = "slot" + (slot.peerId ? " slot-claimed" : " slot-empty");
			li.dataset.slotIndex = String(slot.index);

			const label = document.createElement("span");
			label.className = "slot-label";
			label.textContent = `Slot ${slot.index + 1}: `;
			li.appendChild(label);

			if (slot.peerId) {
				const name = document.createElement("span");
				name.className = "slot-name";
				name.textContent = slot.name + (slot.peerId === myPeerId ? " (you)" : "");
				li.appendChild(name);

				const charExport = characters?.get(slot.peerId);
				if (charExport) {
					const cls = charExport.choices.classes[0];
					const summary = document.createElement("span");
					summary.className = "slot-char-summary";
					summary.textContent = ` — ${charExport.name}, Lvl ${cls.level}, AC ${charExport.derived.armor_class}, HP ${charExport.state.current_hp}/${charExport.derived.max_hp}`;
					li.appendChild(summary);
				}
			} else if (onClaim) {
				const input = document.createElement("input");
				input.type = "text";
				input.placeholder = `Player ${slot.index + 1}`;
				input.className = "slot-name-input";
				input.maxLength = 40;
				const btn = document.createElement("button");
				btn.type = "button";
				btn.textContent = "Claim";
				btn.addEventListener("click", () => onClaim(slot.index, input.value));
				li.appendChild(input);
				li.appendChild(btn);
			} else {
				const name = document.createElement("span");
				name.className = "slot-name slot-name-empty";
				name.textContent = "empty";
				li.appendChild(name);
			}

			container.appendChild(li);
		}
	}

	function monsterMeta(m) {
		const acEntry = Array.isArray(m.ac) ? m.ac[0] : m.ac;
		const ac = typeof acEntry === "object" ? acEntry.ac : acEntry;
		const hp = m.hp?.average ?? m.hp;
		return `CR ${m.cr ?? "?"} · AC ${ac ?? "?"} · HP ${hp ?? "?"}`;
	}

	/**
	 * Renders monster rows. Pass `onToggle` (DM only) to add a share
	 * checkbox per row; omitted entirely on the player side, which only
	 * ever receives monsters the DM already chose to share.
	 */
	function renderBestiaryList(container, monsters, { onToggle = null } = {}) {
		container.innerHTML = "";
		for (const m of monsters) {
			const id = WTCompendium.makeId("monster", m.name, m.source);
			const row = WTEntryRender.collapsibleRow({
				title: m.name,
				meta: monsterMeta(m),
				entries: [...(m.trait || []), ...(m.action || [])],
			});
			if (onToggle) {
				const cb = document.createElement("input");
				cb.type = "checkbox";
				cb.className = "entry-select";
				cb.title = "Share with players";
				cb.addEventListener("click", (e) => e.stopPropagation());
				cb.addEventListener("change", () => onToggle(id, cb.checked));
				row.querySelector(".entry-summary").append(cb);
			}
			container.appendChild(row);
		}
	}

	function refreshPingTargets(host) {
		els.pingTarget.innerHTML = "";
		for (const peerId of host.connections.keys()) {
			const opt = document.createElement("option");
			opt.value = peerId;
			opt.textContent = peerId;
			els.pingTarget.appendChild(opt);
		}
		els.pingTargetWrap.hidden = host.connections.size === 0;
		els.btnPing.disabled = host.connections.size === 0;
	}

	/**
	 * The "no code yet" path: builds and exports a character with no PeerJS
	 * connection at all. Saved characters live in this browser's localStorage
	 * and can also be downloaded as a .json file to bring into a real session
	 * later (a real session's builder offers to import any saved here -- see
	 * maybeShowBuilder in startAsPlayer).
	 */
	function initStandaloneBuilder() {
		const standaloneCompendium = new WTCompendium.Compendium();

		function classSummary(characterExport) {
			const cls = characterExport.choices.classes[0];
			const className = WTCompendium.parseId(cls.class_id).slug;
			return `${className}, Lvl ${cls.level}`;
		}

		function showList() {
			els.standaloneListWrap.hidden = false;
			els.standaloneBuilderWrap.hidden = true;
			els.standaloneSheetWrap.hidden = true;
			renderStandaloneList();
		}

		function renderStandaloneList() {
			const saved = loadSavedCharacters();
			els.standaloneList.innerHTML = "";
			if (!saved.length) {
				const li = document.createElement("li");
				li.innerHTML = `<span class="slot-name slot-name-empty">No saved characters yet.</span>`;
				els.standaloneList.appendChild(li);
				return;
			}
			for (const c of saved) {
				const li = document.createElement("li");
				li.className = "slot";
				li.innerHTML = `<span class="slot-name">${c.name}</span><span class="slot-char-summary"> — ${classSummary(c)}</span>`;

				const btnLoad = document.createElement("button");
				btnLoad.type = "button";
				btnLoad.textContent = "Edit";
				btnLoad.addEventListener("click", () => openBuilder(c));

				const btnExport = document.createElement("button");
				btnExport.type = "button";
				btnExport.textContent = "Export";
				btnExport.addEventListener("click", () => downloadCharacterJson(c));

				const btnDelete = document.createElement("button");
				btnDelete.type = "button";
				btnDelete.textContent = "Delete";
				btnDelete.addEventListener("click", () => {
					if (!confirm(`Delete "${c.name}"? This can't be undone.`)) return;
					deleteSavedCharacter(c.character_id);
					renderStandaloneList();
				});

				li.appendChild(btnLoad);
				li.appendChild(btnExport);
				li.appendChild(btnDelete);
				els.standaloneList.appendChild(li);
			}
		}

		async function openBuilder(initial) {
			els.standaloneListWrap.hidden = true;
			els.standaloneSheetWrap.hidden = true;
			els.standaloneBuilderWrap.hidden = false;
			els.standaloneBuilderHeading.textContent = initial ? `Editing: ${initial.name}` : "New Character";
			await WTBuilder.mount(els.standaloneBuilderForm, els.btnStandaloneSave, {
				compendium: standaloneCompendium,
				initial,
				onExport: (characterExport) => {
					upsertSavedCharacter(characterExport);
					downloadCharacterJson(characterExport);
					log(`Saved & exported character: ${characterExport.name}`);
					els.standaloneBuilderWrap.hidden = true;
					els.standaloneSheetWrap.hidden = false;
					WTBuilder.renderSheet(els.standaloneSheetView, characterExport);
				},
			});
		}

		els.btnStandaloneBuilder.addEventListener("click", () => {
			showPanel(els.standalonePanel);
			showList();
		});
		els.btnStandaloneBack.addEventListener("click", () => showPanel(els.roleChooser));
		els.btnStandaloneNew.addEventListener("click", () => openBuilder(null));
		els.btnStandaloneCancel.addEventListener("click", showList);
		els.btnStandaloneDone.addEventListener("click", showList);
	}

	async function startAsDM() {
		showPanel(els.dmPanel);
		log("Starting host session…");
		const host = new WTRoom.DMHost();
		const slotManager = new WTSlots.SlotManager();
		const bestiaryManager = new WTBestiary.BestiaryManager();
		const compendium = new WTCompendium.Compendium();
		const characters = new Map(); // peerId -> latest character-full export

		function renderDmSlots() {
			renderSlots(els.dmSlots, slotManager.snapshot(), { characters });
		}
		renderDmSlots();

		function renderDmBestiary() {
			renderBestiaryList(els.dmBestiaryList, Array.from(bestiaryManager.byId.values()), {
				onToggle: (id, shared) => {
					bestiaryManager.setShared(id, shared);
					host.broadcast({ type: "bestiary-sync", monsters: bestiaryManager.sharedPayload() });
				},
			});
		}
		compendium
			.getBestiary("xmm")
			.then((monsters) => {
				bestiaryManager.load(monsters);
				renderDmBestiary();
			})
			.catch((err) => log(`Failed to load bestiary: ${err.message || err}`));

		host.on("error", (err) => log(`Host error: ${err.message || err}`));
		host.on("player-joined", ({ peerId }) => {
			log(`Player joined: ${peerId}`);
			addWaitingRow(peerId);
			refreshPingTargets(host);
			host.sendTo(peerId, { type: "slots-sync", slots: slotManager.snapshot() });
			host.sendTo(peerId, { type: "bestiary-sync", monsters: bestiaryManager.sharedPayload() });
		});
		host.on("player-left", ({ peerId }) => {
			// Slot claims persist through a dropped connection (a network
			// blip shouldn't let someone else steal an active player's
			// slot) — the transport link, not the claim, is what's gone.
			log(`Player left: ${peerId}`);
			removeWaitingRow(peerId);
			refreshPingTargets(host);
		});
		host.on("data", ({ peerId, data }) => {
			log(`Data from ${peerId}: ${JSON.stringify(data)}`);
			if (data && data.type === "ping") {
				host.sendTo(peerId, { type: "pong", ts: data.ts });
			} else if (data && data.type === "claim-slot") {
				const result = slotManager.claim(peerId, data.index, data.name);
				if (result.ok) {
					renderDmSlots();
					host.broadcast({ type: "slots-sync", slots: slotManager.snapshot() });
				} else {
					host.sendTo(peerId, { type: "claim-rejected", index: data.index, reason: result.reason });
				}
			} else if (data && data.type === "character-full") {
				characters.set(peerId, data.character);
				log(`Character update from ${peerId}: ${data.character.name}`);
				renderDmSlots();
			}
		});

		try {
			const { roomCode, url } = await host.start();
			els.roomCode.textContent = roomCode;
			els.roomLink.value = url;
			log(`Room ready: ${roomCode}`);
		} catch (err) {
			log(`Failed to start room: ${err.message || err}`);
			return;
		}

		els.btnPing.addEventListener("click", () => {
			const target = els.pingTarget.value;
			if (!target) return;
			const ts = Date.now();
			log(`Sending ping to ${target}`);
			host.sendTo(target, { type: "ping", ts });
		});
	}

	async function startAsPlayer(roomCode) {
		showPanel(els.playerPanel);
		els.playerStatus.textContent = `Connecting to room ${roomCode}…`;
		log(`Connecting to room ${roomCode}…`);
		const client = new WTRoom.PlayerClient(roomCode);
		const compendium = new WTCompendium.Compendium();
		let latestSlots = WTSlots.createEmptySlots();
		let builderMounted = false;
		let latestCharacter = null;

		function renderPlayerSlots() {
			renderSlots(els.playerSlots, latestSlots, {
				myPeerId: client.peer?.id,
				onClaim: (index, name) => {
					log(`Claiming slot ${index + 1} as "${name}"…`);
					client.send({ type: "claim-slot", index, name });
				},
			});
		}

		function mountPlayerBuilder(initial) {
			WTBuilder.mount(els.builderForm, els.btnBuildSave, {
				compendium,
				initial,
				onExport: (characterExport) => {
					latestCharacter = characterExport;
					client.send({ type: "character-full", character: characterExport });
					log(`Saved character: ${characterExport.name}`);
					els.sheetWrap.hidden = false;
					WTBuilder.renderSheet(els.sheetView, characterExport);
				},
			});
		}

		/** Offers to prefill from a character built earlier via the "no code" path. */
		function renderImportPicker(saved) {
			const wrap = document.createElement("div");
			wrap.className = "builder-preview";
			const select = document.createElement("select");
			select.appendChild(new Option("— start blank —", ""));
			for (const c of saved) select.appendChild(new Option(c.name, c.character_id));
			const btn = document.createElement("button");
			btn.type = "button";
			btn.textContent = "Start";
			btn.addEventListener("click", () => {
				const chosen = saved.find((c) => c.character_id === select.value) || null;
				wrap.remove();
				mountPlayerBuilder(chosen);
			});
			wrap.append("Bring in a saved character? ", select, btn);
			els.builderWrap.insertBefore(wrap, els.builderForm);
		}

		function maybeShowBuilder() {
			const myClaim = latestSlots.find((s) => s.peerId === client.peer?.id);
			if (!myClaim || builderMounted) return;
			builderMounted = true;
			els.builderWrap.hidden = false;

			if (!latestCharacter) {
				const saved = loadSavedCharacters();
				if (saved.length) {
					renderImportPicker(saved);
					return;
				}
			}
			mountPlayerBuilder(latestCharacter);
		}

		client.on("data", (data) => {
			log(`Data from DM: ${JSON.stringify(data)}`);
			if (data && data.type === "ping") {
				client.send({ type: "pong", ts: data.ts });
			} else if (data && data.type === "slots-sync") {
				latestSlots = data.slots;
				els.playerSlotsWrap.hidden = false;
				renderPlayerSlots();
				maybeShowBuilder();
			} else if (data && data.type === "claim-rejected") {
				log(`Slot ${data.index + 1} claim rejected: ${data.reason}`);
			} else if (data && data.type === "bestiary-sync") {
				els.playerBestiaryWrap.hidden = false;
				renderBestiaryList(els.playerBestiaryList, data.monsters.map((m) => m.monster));
			}
		});
		client.on("disconnected", () => {
			els.playerStatus.textContent = "Disconnected from DM.";
			log("Disconnected from DM.");
		});

		els.pingTargetWrap.hidden = true;
		els.btnPing.disabled = true;
		els.btnPing.addEventListener("click", () => {
			const ts = Date.now();
			log("Sending ping to DM");
			client.send({ type: "ping", ts });
		});

		try {
			await client.connect();
			els.playerStatus.textContent =
				"Connected. Waiting room — the DM hasn't started the session yet.";
			els.btnPing.disabled = false;
			log("Connected to DM.");
		} catch (err) {
			els.playerStatus.textContent = `Could not connect: ${err.message || err}`;
			log(`Connect failed: ${err.message || err}`);
		}
	}

	function init() {
		initStandaloneBuilder();
		const roomCode = WTRoom.roomCodeFromUrl();
		if (roomCode) {
			startAsPlayer(roomCode);
			return;
		}
		showPanel(els.roleChooser);
		els.btnHost.addEventListener("click", startAsDM);
	}

	document.addEventListener("DOMContentLoaded", init);
})();
