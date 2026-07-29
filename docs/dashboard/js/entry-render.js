/*
 * Renders 5etools "entries" markup using the REAL rendering pipeline
 * (../js/render.js + friends, referenced directly from the live site --
 * see the script tags in index.html) instead of a hand-rolled {@tag}
 * parser. That gets us the actual dice rollers and the actual link
 * markup the rest of the site uses, for free, with no drift risk (it's
 * the same file spells.html etc. load). Hover-preview cards are not
 * wired up (would need the search-index/hover-window stack); links still
 * navigate to the real page on click without them, which is all the
 * dashboard needs here.
 */
(function (global) {
	"use strict";

	function escapeHtml(str) {
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	/** Renders an "entries" array/object via the real Renderer. */
	function renderEntries(entries) {
		if (!entries || (Array.isArray(entries) && !entries.length)) return "";
		return Renderer.get().render({ entries: Array.isArray(entries) ? entries : [entries] });
	}

	/**
	 * Builds a collapsible row: closed by default, "+"/"−" marker, full
	 * rendered entries text inside once expanded. A plain div + explicit
	 * click toggle rather than native <details>/<summary> — the native
	 * element's toggle is browser default-action-driven, which proved
	 * unreliable to drive programmatically (real users are unaffected,
	 * but it matters for our own automated QA, and a manual toggle is no
	 * less correct).
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

	global.WTEntryRender = { escapeHtml, renderEntries, collapsibleRow };
})(window);
