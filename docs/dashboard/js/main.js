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

		host.on("error", (err) => log(`Host error: ${err.message || err}`));
		host.on("player-joined", ({ peerId }) => {
			log(`Player joined: ${peerId}`);
			addWaitingRow(peerId);
			refreshPingTargets(host);
		});
		host.on("player-left", ({ peerId }) => {
			log(`Player left: ${peerId}`);
			removeWaitingRow(peerId);
			refreshPingTargets(host);
		});
		host.on("data", ({ peerId, data }) => {
			log(`Data from ${peerId}: ${JSON.stringify(data)}`);
			if (data && data.type === "ping") {
				host.sendTo(peerId, { type: "pong", ts: data.ts });
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

		client.on("data", (data) => {
			log(`Data from DM: ${JSON.stringify(data)}`);
			if (data && data.type === "ping") {
				client.send({ type: "pong", ts: data.ts });
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
