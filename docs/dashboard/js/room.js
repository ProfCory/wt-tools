/*
 * Room: thin wrapper around PeerJS for the dashboard's WebRTC session.
 *
 * Message protocol (JSON over the PeerJS data channel):
 *   { type: "ping", ts }
 *   { type: "pong", ts }
 * Later phases add more message types (slot-claim, sheet-update, vtt-*, etc.)
 * — every message MUST have a "type" field so peers can dispatch on it.
 */
(function (global) {
	"use strict";

	const ROOM_PARAM = "room";
	const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

	// Defaults to PeerJS's public cloud signaling server. Set
	// window.WT_PEER_SERVER_OPTIONS (before this script loads) to point at a
	// self-hosted PeerServer instead, e.g. for local testing.
	function peerOptions(extra) {
		return Object.assign({ debug: 1 }, global.WT_PEER_SERVER_OPTIONS || {}, extra || {});
	}

	function generateRoomCode(length = 5) {
		let code = "";
		for (let i = 0; i < length; i++) {
			code += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
		}
		return code;
	}

	function roomCodeFromUrl(url = global.location.href) {
		const parsed = new URL(url);
		return parsed.searchParams.get(ROOM_PARAM);
	}

	function urlForRoom(roomCode) {
		const url = new URL(global.location.href);
		url.search = "";
		url.searchParams.set(ROOM_PARAM, roomCode);
		return url.toString();
	}

	/**
	 * EventTarget-style emitter so callers can do room.on("event", cb).
	 */
	class Emitter {
		constructor() {
			this._listeners = new Map();
		}
		on(event, cb) {
			if (!this._listeners.has(event)) this._listeners.set(event, new Set());
			this._listeners.get(event).add(cb);
			return this;
		}
		off(event, cb) {
			this._listeners.get(event)?.delete(cb);
			return this;
		}
		emit(event, payload) {
			this._listeners.get(event)?.forEach((cb) => {
				try {
					cb(payload);
				} catch (err) {
					console.error(`[room] listener for "${event}" threw`, err);
				}
			});
		}
	}

	/**
	 * DMHost: creates a Peer with a short custom room code and accepts
	 * incoming player connections.
	 */
	class DMHost extends Emitter {
		constructor() {
			super();
			this.roomCode = null;
			this.peer = null;
			/** @type {Map<string, RTCDataConnection>} peerId -> conn */
			this.connections = new Map();
		}

		start() {
			return new Promise((resolve, reject) => {
				const attempt = (triesLeft) => {
					const code = generateRoomCode();
					const peer = new Peer(`wt-dash-${code}`, peerOptions());

					const onOpen = (id) => {
						peer.off("error", onError);
						this.peer = peer;
						this.roomCode = code;
						this._wireIncoming();
						resolve({ roomCode: code, url: urlForRoom(code) });
					};
					const onError = (err) => {
						peer.off("open", onOpen);
						if (err && err.type === "unavailable-id" && triesLeft > 0) {
							peer.destroy();
							attempt(triesLeft - 1);
							return;
						}
						reject(err);
					};

					peer.once("open", onOpen);
					peer.once("error", onError);
				};
				attempt(5);
			});
		}

		_wireIncoming() {
			this.peer.on("connection", (conn) => {
				conn.on("open", () => {
					this.connections.set(conn.peer, conn);
					this.emit("player-joined", { peerId: conn.peer, conn });
				});
				conn.on("data", (data) => {
					this.emit("data", { peerId: conn.peer, data });
				});
				conn.on("close", () => {
					this.connections.delete(conn.peer);
					this.emit("player-left", { peerId: conn.peer });
				});
			});
			this.peer.on("error", (err) => this.emit("error", err));
		}

		sendTo(peerId, message) {
			this.connections.get(peerId)?.send(message);
		}

		broadcast(message) {
			for (const conn of this.connections.values()) conn.send(message);
		}
	}

	/**
	 * PlayerClient: creates its own Peer and connects to the DM's room code.
	 */
	class PlayerClient extends Emitter {
		constructor(roomCode) {
			super();
			this.roomCode = roomCode;
			this.peer = null;
			this.conn = null;
		}

		connect() {
			return new Promise((resolve, reject) => {
				const peer = new Peer(peerOptions());

				peer.once("open", () => {
					this.peer = peer;
					const conn = peer.connect(`wt-dash-${this.roomCode}`, { reliable: true });
					this.conn = conn;

					conn.once("open", () => {
						this.emit("connected");
						resolve();
					});
					conn.on("data", (data) => this.emit("data", data));
					conn.on("close", () => this.emit("disconnected"));
					conn.on("error", (err) => reject(err));
				});

				peer.once("error", (err) => reject(err));
			});
		}

		send(message) {
			this.conn?.send(message);
		}
	}

	global.WTRoom = {
		DMHost,
		PlayerClient,
		roomCodeFromUrl,
		urlForRoom,
		generateRoomCode,
	};
})(window);
