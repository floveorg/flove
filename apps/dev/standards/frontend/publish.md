# ✺ flove · Publish to Appy — §13.15

Part of the flove frontend standards catalogue. Index / matrix: `../README.md` ·
contract: `../contract.md` · back to the catalogue: `../frontend.md`. Related:
the export summary-model (`export.md`, §13.12) is what gets published.

---

### 13.15 · Publish to Appy — app → profile bridge

One **shared mechanism** (`apps/appy/flove-appy.js`) so every flove app hands its
result to the user's **Appy** profile the same way. Phase 0/1, **no backend**: a
same-origin `localStorage` bridge (key `flove:appy:played`). The thing published
is the app's §13.12 **summary-model** — there is no second data shape.

**Two complementary paths (both must exist).**

1. **Bridge (automatic, http).** The app writes its summary to `localStorage`;
   an open Appy profile picks it up live. Needs a **shared origin** — flove.org
   or a single local http server.
2. **Manual upload (always works, incl. `file://`).** The user downloads the
   app's `<app>-summary.json` (§13.12) and drops it on Appy's **"Upload summary
   here"**. This is the durable fallback when the bridge can't reach (separate
   `file://` documents, storage blocked). Appy shows both the same way.

The bridge is a convenience over path 2 — never the only path.

**WRITER contract (an app that publishes) — the trio ships together.**
A `data-flove-publish="appy|wizy|more"` button **without** the script (or without
`window.floveSummary`) is a **dead button** — the trio is all-or-nothing. (Don't
confuse it with the unrelated flove.js `data-flove-publish="go"` "Go" hook.) All
three are required:

1. `<script src="flove-appy.js"></script>` — synchronous, **no** `data-app`
   (that attribute is only the legacy floating button). It auto-wires every
   `[data-flove-publish]` click and exposes `window.floveAppy`.
2. `window.floveSummary = () => ({ app:'<App>', …summary-model })` — the §13.12
   model; `app` is required (the record key).
3. The publish buttons: `data-flove-publish="appy | wizy | more"`.

Optional richer agent payload: `window.floveAgentBlock = (summary) => ({ prompt,
schema, context, suggestions })` (wizy mode falls back to a generic block).

**Modes.**
- **`appy`** — save the summary-model to the profile.
- **`wizy`** — same, plus an `agent` block on the record so an AI agent can act on it.
- **`more`** — placeholder for further networks (**nety · 0asis**); shows a
  "coming" hint until the backend phases light it up.

**READER contract (an Appy profile page).** Include the same script; render from
`window.floveAppy.played()` on load **and** re-render via
`window.floveAppy.onChange(paint)` — it fires on the `storage` event (another tab
published), on `focus`, and on `visibilitychange` (covers "profile was already
open"). Reference reader: `apps/appy/appy-mini.html` (`hydrateFromBridge`).

**Record shape** (keyed by `app`, latest wins), under `flove:appy:played`:

```js
{ app, colour, summary, url, via, date }   // via = 'appy' | 'wizy' | null
```

**Honest hint.** The writer reports into `[data-flove-hint]` (fallback
`#hintMessage`), bilingual: *Saved to your Appy profile ✓* · *Nothing to save yet
— use the app first* · *Could not save — storage is blocked*. Never claim success
the write didn't return (`publish()` reports whether `localStorage` actually
persisted).

**Honest limits (normative).** `localStorage` is **per-origin and per-device**.
No cross-device or cross-user propagation here — that is **backend** work
(nety / 0asis, F-phases). Do not imply the profile syncs anywhere; it is the
local, offline path plus the manual-upload fallback.

**Environment matrix (normative).** Where each path works, and what the publish
button must do:

| Environment | Auto bridge (localStorage, same-origin) | Manual upload (`<app>-summary.json`) | Publish-button behaviour |
|---|---|---|---|
| `file://` | ✗ **no** — separate `file://` documents don't share storage (browser-dependent; treat as no) | ✓ always | **Download `<app>-summary.json` + hint "upload it in Appy"** (the file:// fallback) |
| `http://localhost:<port>` | ✓ yes — same origin | ✓ | Write to the profile live (+ live update via `onChange`) |
| `https://…` served (flove.org) | ✓ yes — same origin | ✓ | Write to the profile live |

`localhost` and served `http(s)` behave identically (both are same-origin
origins). The one real split is **`file://`**: the bridge can't reach another
document, so on `file://` the publish button **degrades to downloading the JSON**
that the user then uploads in Appy — never a silent no-op or a false "saved ✓".

## Tiers & scalability (→ `../adoption.md`)

- **Colour registry.** `flove-appy.js` holds a `COLOURS` map (app → brand
  colour). **Extend it as each app adopts Publish** — that is how the mechanism
  scales from today's handful to the whole catalogue. An app not in the map
  still publishes (colour falls back), but add it for the profile's colour-coding.
- **By tier.** `mini` does **not** publish (the mini profile is local JSON only,
  §13.12). From **`basic`** up, the `appy` + `wizy` buttons ship. **`more`**
  (nety / 0asis) stays inert until the backend phases (F2+).
- **Rollout.** Adopting Publish across the family = (1) add the WRITER trio to
  each emitter, (2) add its colour to `COLOURS`, (3) tick it in `adoption.md`.
  The canonical first emitters are souls · realy · inventary · pracsys · myfamily
  (the apps whose summaries most enrich a profile), then outward.
- **Cross-device** propagation is the backend milestone (nety publish / 0asis),
  not part of this phase-0/1 standard.

## Auto-publish (F1) — DONE, always on (local phase)

Publish is a **manual click**; auto-publish keeps the profile in sync **without
re-clicking**. Implemented in `flove-appy.js` and **always on** in phase 0/1
(**no toggle**) — because it is **entirely local**: a same-origin `localStorage`
write on the same device, so **nothing leaves the browser**. There is no data
egress to consent to here; consent gates the LATER cross-device step (below).

- **Always on, no toggle.** Every WRITER auto-syncs. (An earlier design gated it
  behind an opt-in `flove:appy:auto` toggle; dropped as needless friction for a
  local-only save — the manual click already covered "save to profile".)
- **Target = `appy`, never `wizy`.** Auto-sync writes the **profile record**
  (`appy` mode). **`wizy` stays an explicit click** — handing a summary to an
  agent is a deliberate act, not a background write. `more` (nety/0asis) is F2+.
- **When it fires.** `flove-appy.js` auto-wires it to any **`[data-flove-update]`**
  (§13.9) click, in the **capture phase** — so Update-based apps need **no extra
  JS**. **Live-state apps** (no Update button, e.g. goddy) call
  **`window.floveAppy.autoSync()`** where they persist. **Debounced** (~800 ms):
  the summary is read *after* the app's own Update handler recomputes it, and rapid
  changes collapse to one write. `publish()` merges by app (latest wins) — no
  duplicates, and an open Appy profile reflects it live via `onChange`.
- **`file://` has no auto path.** Auto-publish needs the localStorage bridge, so
  it is **http-only**; on `file://` `autoSync()` is a **no-op** and the **manual
  download** (environment matrix above) stays the path.
- **Honest indicator (optional).** Drop `<span data-flove-auto-state>` and it shows
  a subtle *saving… / saved to Appy ✓ / couldn't save*, driven by what `publish()`
  actually returned — never a claimed save that didn't persist. Absent → silent
  (still correct; an open Appy shows the live result).
- **Consent belongs to the cross-device step.** All of the above is local. When
  real cross-device / cross-user propagation arrives (**nety / 0asis, F2+** — the
  moment data leaves the device), **that** step gates on explicit consent. This
  local save does not.
- **Tier & scale.** Same as manual publish: a `basic`+ capability; the `COLOURS`
  registry is unchanged.

Downloaded files are static snapshots: the browser cannot rewrite a file already
on disk, but every fresh download carries the current summary. Auto-publish keeps
the **profile** live; **downloads** stay current by re-downloading.

API: `window.floveAppy.autoSync()` — debounced local save to the profile; no-op on
`file://`. The manual `appy`/`wizy` buttons remain the floor.

**Reference:** `apps/appy/flove-appy.js` (the bridge) · `apps/appy/appy-mini.html`
(a working READER) · `apps/metas/goddy.html` · `apps/metas/souls.html` (working
WRITERs, all three parts).
