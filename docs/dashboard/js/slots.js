/*
 * SlotManager: the 5 character slots for a session. Pure data model, no
 * PeerJS knowledge — main.js wires it to room events and broadcasts.
 *
 * Slot shape (see CHARACTER_DATA_DESIGN.md — characterId is reserved for
 * Phase 3, unused until then):
 *   { index, peerId, name, characterId, claimedAt }
 */
(function (global) {
	"use strict";

	const SLOT_COUNT = 5;

	function createEmptySlots() {
		return Array.from({ length: SLOT_COUNT }, (_, index) => ({
			index,
			peerId: null,
			name: null,
			characterId: null,
			claimedAt: null,
		}));
	}

	class SlotManager {
		constructor() {
			this.slots = createEmptySlots();
		}

		/**
		 * @returns {{ok: true, slots}|{ok: false, reason: string}}
		 */
		claim(peerId, index, name) {
			const slot = this.slots[index];
			if (!slot) return { ok: false, reason: "invalid-slot" };
			if (slot.peerId && slot.peerId !== peerId) {
				return { ok: false, reason: "slot-taken" };
			}
			const alreadyHeld = this.slots.find((s) => s.peerId === peerId && s.index !== index);
			if (alreadyHeld) return { ok: false, reason: "peer-already-has-slot" };

			slot.peerId = peerId;
			slot.name = String(name || "").slice(0, 40) || `Player ${index + 1}`;
			slot.claimedAt = Date.now();
			return { ok: true, slots: this.slots };
		}

		snapshot() {
			return this.slots.map((s) => ({ ...s }));
		}
	}

	global.WTSlots = { SlotManager, createEmptySlots, SLOT_COUNT };
})(window);
