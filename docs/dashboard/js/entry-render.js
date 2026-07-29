/*
 * Minimal renderer for 5etools "entries" markup ({@tag ...} inline refs,
 * nested {type:"entries"|"list"} blocks, and untyped {name, entries} blocks
 * like bestiary traits/actions). Deliberately not the real docs/js/render.js
 * (17k lines, deeply coupled to the full site's globals) — this handles just
 * enough to make dashboard text readable, wrapped in a collapsible row so it
 * expands/collapses like every other 5etools page. Not exhaustive; unknown
 * tags fall back to their first pipe-segment as plain text.
 */
(function (global) {
	"use strict";

	function escapeHtml(str) {
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	const TAG_HANDLERS = {
		b: (parts) => `<b>${parts[0]}</b>`,
		bold: (parts) => `<b>${parts[0]}</b>`,
		i: (parts) => `<i>${parts[0]}</i>`,
		italic: (parts) => `<i>${parts[0]}</i>`,
		dc: (parts) => `DC ${parts[0]}`,
		hit: (parts) => `${parts[0] >= 0 ? "+" : ""}${parts[0]}`,
		h: () => `Hit: `,
		recharge: (parts) => `(Recharge ${parts[0] || "6"}–6)`,
		atk: (parts) => {
			const labels = { mw: "Melee Weapon Attack", rw: "Ranged Weapon Attack", ms: "Melee Spell Attack", rs: "Ranged Spell Attack" };
			return `${parts[0].split(",").map((a) => labels[a] || a).join(" or ")}:`;
		},
	};

	/** Renders a single string's {@tag ...} markup to a safe inline HTML string. */
	function renderInline(str) {
		const escaped = escapeHtml(str);
		return escaped.replace(/\{@(\w+) ([^{}]*?)\}/g, (whole, tag, body) => {
			const parts = body.split("|");
			const handler = TAG_HANDLERS[tag];
			if (handler) return handler(parts);
			// Generic fallback: {@spell fireball|xge} / {@item longsword|phb} / etc
			// -> just the display name (first segment, or the last if given).
			return parts.length >= 3 ? parts[2] : parts[0];
		});
	}

	/** Renders an "entries" array (strings + nested {type, name, entries}) to HTML. */
	function renderEntries(entries) {
		if (!entries) return "";
		return entries.map((entry) => renderEntry(entry)).join("");
	}

	function renderEntry(entry) {
		if (typeof entry === "string") return `<p>${renderInline(entry)}</p>`;
		if (!entry || typeof entry !== "object") return "";

		if (entry.type === "list") {
			const items = (entry.items || [])
				.map((item) => `<li>${typeof item === "string" ? renderInline(item) : renderEntries([item])}</li>`)
				.join("");
			return `<ul>${items}</ul>`;
		}

		if (entry.type === "entries" || entry.type === "section") {
			const heading = entry.name ? `<strong>${escapeHtml(entry.name)}.</strong> ` : "";
			const body = renderEntries(entry.entries || []);
			// Fold the heading into the first paragraph rather than a separate block.
			return body.replace(/^<p>/, `<p>${heading}`) || `<p>${heading}</p>`;
		}

		if (entry.type === "item") {
			const heading = entry.name ? `<strong>${renderInline(entry.name)}</strong> ` : "";
			if (entry.entry) return `${heading}${renderInline(entry.entry)}`;
			if (entry.entries) return `${heading}${renderEntries(entry.entries)}`;
			return heading;
		}

		// Untyped {name, entries} block (bestiary traits/actions use this shape
		// with no "type" field at all) — treat the same as type:"entries".
		if (!entry.type && entry.entries && Array.isArray(entry.entries)) {
			const heading = entry.name ? `<strong>${escapeHtml(entry.name)}.</strong> ` : "";
			const body = renderEntries(entry.entries);
			return body.replace(/^<p>/, `<p>${heading}`) || `<p>${heading}</p>`;
		}

		// Unhandled block type (table, inset, etc.) — skip rather than mis-render.
		return "";
	}

	/**
	 * Builds a collapsible row: closed by default, "+"/"−" marker, full
	 * rendered entries text inside once expanded. Deliberately a plain
	 * div + explicit click toggle rather than native <details>/<summary>
	 * — the native element's toggle is browser default-action-driven,
	 * which proved unreliable to drive programmatically (real users are
	 * unaffected, but it matters for our own automated QA, and a manual
	 * toggle is no less correct).
	 */
	function collapsibleRow({ title, meta = "", entries = [], className = "" }) {
		const row = document.createElement("div");
		row.className = `entry-row ${className}`.trim();
		const summary = document.createElement("div");
		summary.className = "entry-summary";
		summary.innerHTML = `<span class="entry-title">${escapeHtml(title)}</span>${meta ? `<span class="entry-meta">${escapeHtml(meta)}</span>` : ""}`;
		row.appendChild(summary);
		const body = document.createElement("div");
		body.className = "entry-body";
		body.hidden = true;
		body.innerHTML = renderEntries(entries);
		row.appendChild(body);

		summary.addEventListener("click", () => {
			body.hidden = !body.hidden;
			row.classList.toggle("is-open", !body.hidden);
		});

		return row;
	}

	global.WTEntryRender = { escapeHtml, renderInline, renderEntries, collapsibleRow };
})(window);
