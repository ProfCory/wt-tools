/*
 * BestiaryManager: DM-side arbiter of which monster records are shared with
 * players this session. Pure data model, no PeerJS knowledge.
 *
 * The critical property: sharedPayload() is the ONLY way anything in here
 * ever leaves the DM's machine, and it can only ever contain monsters
 * explicitly marked shared. There is no "send everything, hide client-side"
 * path -- main.js must never broadcast `this.monsters` or `this.byId`
 * directly, only the output of sharedPayload().
 */
(function (global) {
	"use strict";

	const C = global.WTCompendium;

	class BestiaryManager {
		constructor() {
			this.byId = new Map();
			this.sharedIds = new Set();
		}

		load(monsters) {
			for (const monster of monsters) {
				const id = C.makeId("monster", monster.name, monster.source);
				this.byId.set(id, monster);
			}
		}

		setShared(id, shared) {
			if (shared) this.sharedIds.add(id);
			else this.sharedIds.delete(id);
		}

		isShared(id) {
			return this.sharedIds.has(id);
		}

		/** The only monster data that may ever be sent to players. */
		sharedPayload() {
			return Array.from(this.sharedIds)
				.map((id) => this.byId.get(id))
				.filter(Boolean)
				.map((monster) => ({ id: C.makeId("monster", monster.name, monster.source), monster }));
		}
	}

	global.WTBestiary = { BestiaryManager };
})(window);
