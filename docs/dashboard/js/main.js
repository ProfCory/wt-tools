(function () {
	"use strict";

	const $ = (sel) => document.querySelector(sel);

	const els = {
		roleChooser: $("#role-chooser"),
		btnHost: $("#btn-host"),
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
	};

	function log(msg) {
		const line = document.createElement("div");
		line.className = "log-line";
		const ts = new Date().toLocaleTimeString();
		line.textContent = `[${ts}] ${msg}`;
		els.log.prepend(line);
	}

	function showPanel(panel) {
		for (const p of [els.roleChooser, els.dmPanel, els.playerPanel]) {
			p.hidden = p !== panel;
		}
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
	function renderSlots(container, slots, { myPeerId = null, onClaim = null } = {}) {
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

	async function startAsDM() {
		showPanel(els.dmPanel);
		log("Starting host session…");
		const host = new WTRoom.DMHost();
		const slotManager = new WTSlots.SlotManager();

		function renderDmSlots() {
			renderSlots(els.dmSlots, slotManager.snapshot());
		}
		renderDmSlots();

		host.on("error", (err) => log(`Host error: ${err.message || err}`));
		host.on("player-joined", ({ peerId }) => {
			log(`Player joined: ${peerId}`);
			addWaitingRow(peerId);
			refreshPingTargets(host);
			host.sendTo(peerId, { type: "slots-sync", slots: slotManager.snapshot() });
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
		let latestSlots = WTSlots.createEmptySlots();

		function renderPlayerSlots() {
			renderSlots(els.playerSlots, latestSlots, {
				myPeerId: client.peer?.id,
				onClaim: (index, name) => {
					log(`Claiming slot ${index + 1} as "${name}"…`);
					client.send({ type: "claim-slot", index, name });
				},
			});
		}

		client.on("data", (data) => {
			log(`Data from DM: ${JSON.stringify(data)}`);
			if (data && data.type === "ping") {
				client.send({ type: "pong", ts: data.ts });
			} else if (data && data.type === "slots-sync") {
				latestSlots = data.slots;
				els.playerSlotsWrap.hidden = false;
				renderPlayerSlots();
			} else if (data && data.type === "claim-rejected") {
				log(`Slot ${data.index + 1} claim rejected: ${data.reason}`);
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
