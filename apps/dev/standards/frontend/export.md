# ✺ flove · Export & share — §13.12

Part of the flove frontend standards catalogue. Index / matrix: `../README.md` · contract: `../contract.md` · back to the catalogue: `../frontend.md`.

---

### 13.12 · Export & share contract — summary-model → 6 formats + Web Share

The last step-panel (§13.9) already aggregates the user's input into a
live phrase. This section fixes **how that phrase leaves the app** — the
six download formats and the share-to-mobile path — so every app exports
the *same* content the *same* way. The `/export` skill audits an app
against this contract.

**Single source — the summary-model.** One plain object is the source of
truth. The live summary phrase renders from it, every download format
serializes from it, and the rating Views render from it. There is no
second copy of the data, so the summary, the charts and every export can
never disagree:

```js
{ app:'<app>', version:1, phrase:'<live phrase>',
  sections:[{ label, title, items:[…] }],   // the recap blocks
  raters:[{ key, emoji, n, max }],           // ratings — also feed the Views
  picked:[…], stats?:{…},
  date?:'<ISO>',                             // present iff "Add date" is on (§13.9)
  profile?:{ handle, … } }                   // present iff "Add profile" is on — from appy(-mini)
```

The optional **`date`** and **`profile`** keys are the **Add date** /
**Add profile** export extras (§13.9): present only when their right-side
checkbox is on, absent otherwise (so parity still holds). `profile` is
basic info — at minimum the username/handle — read from the appy(-mini)
profile. Like all keys, the names stay stable English; only prose
renderings localize.

**Parity (the core invariant).** The set of filled items in
`sections[].items` ≡ what the live phrase shows ≡ what every one of the
six formats contains. An item the user selected or added that is missing
from any format — or a stale item that lingers after deselection — is a
contract violation. Empty fields are omitted (the model carries only
filled items, the way `summary()` does in souls); when the model is
*entirely* empty the export controls are disabled — there is nothing
to send.

**Verification — every format survives a parse-back.** Parity is not
eyeballed: the JSON re-parses and reconstructs the same item set; the
XML passes a `DOMParser` with no error; the HTML, loaded in a sandbox,
contains the phrase. A format that cannot be parsed back to the same
content fails the contract regardless of how it looks.

**Hostile input survives intact.** Whatever the user types — `<script>`,
ampersands, quotes, commas, newlines, emoji, RTL text — comes out *whole
and inert* in all six formats: no broken XML, no CSV column bleed, and
crucially no markup injection in the HTML export. The shared `esc`/
`escAttr`, RFC-4180 quoting and `JSON.stringify` below are what guarantee
it; this is the one place a correctness slip is also a (small) security
slip.

**i18n parity is per active language.** The items the user typed are
language-agnostic, but section labels localize with §13.2 — so parity is
checked *in the active language*: an export taken while the UI is in
Spanish carries Spanish labels. Switching language and re-exporting must
reflect it; a half-translated export is a violation.

**Views are renderings of `raters[]`.** The four chart Views
(bars · vertical · axial · spider) are four drawings of the *same*
`raters[]` array — never a separate state. Each `{ n, max }` maps to bar
height / column height / axis length / spider radius. So a rating the
user sees in a View equals the rater in the JSON equals the value the
phrase reports. "Tuning the Views" means exactly this: each View renders
`raters[]` faithfully, no drift between chart and number.

**The six canonical formats** (all generated client-side, immediate download):

| Format | Ext | MIME | Structure | Ref (`metas/souls.html`) |
|--------|-----|------|-----------|--------------------------|
| Markdown | `.md` | `text/markdown;charset=utf-8` | `# <app>` heading + phrase + sections; raters as a table | `summary()` + heading |
| JSON | `.json` | `application/json;charset=utf-8` | the summary-model, `JSON.stringify(…,null,2)` — **round-trip** format | `portraitData()` |
| XML | `.xml` | `application/xml;charset=utf-8` | well-formed `<?xml…?>`, every value through shared `esc`/`escAttr` | `portraitXml()` |
| HTML | `.html` | `text/html;charset=utf-8` | standalone `<!doctype>` + inline `<style>`, phrase + styled recap | `buildPortraitHtml()` |
| JPG | `.jpg` | `image/jpeg` (q ≥ 0.9) | canvas render of the summary grid — **visual-only** (cannot round-trip) | `downloadPortraitJpg()` |
| CSV | `.csv` | `text/csv;charset=utf-8` | one row per element; RFC-4180 quoting | `portraitCsv()` |

**Why six, not seven (no `txt`).** Plain `.txt` is intentionally
excluded: Markdown already carries the plain-text content and renders as
readable text everywhere, so a separate `.txt` would just duplicate `.md`
with no round-trip or formatting gain. The canonical set is the six above.

**Correctness floor.** These are the format bugs the audit found most
often, so they are normative: a single shared `esc`/`escAttr` pair serves
both XML and HTML (never hand-rolled per format); JSON is built only with
`JSON.stringify` (never string concatenation); CSV follows RFC-4180 (a
field containing comma, quote or newline is wrapped in quotes, inner
quotes doubled); every text MIME carries `;charset=utf-8` so the
asterisms and emoji survive the trip.

**JPG degradation.** Being the one lossy, visual-only format, the JPG
renders at ≥ 1080px wide (share quality) and, when the summary is too
long to fit, truncates *visibly* with an ellipsis (`…`) — it never drops
content in silence. Everything it omits is still present, complete, in
the other five formats.

**Filename.** `<app>-summary.<ext>`, with the word `summary` localized to
the active UI language (§13.2): `summary` (en) · `resumen` (es) · the
matching word for any other language added via `translate2`
(e.g. `souls-resumen.json`). The human-facing prose *inside* each export
(the MD heading, the HTML `<title>`, the `navigator.share` title) follows
the same active language — but the **machine names do not**: JSON keys,
XML element names and CSV headers stay in stable English so round-trip
and parsing never break. Download is universal across the family:
`Blob → URL.createObjectURL → <a download>.click() → revokeObjectURL`.

**Share to mobile.** Default share carries text (the phrase). The `files`
variant attaches the **standalone HTML** export (`<app>-summary.html`) —
the best artifact for a mobile app to receive: self-contained, opens
anywhere, full content (a flat JPG loses the text; JSON previews almost
nowhere). The file is always guarded by `navigator.canShare({ files })`.
Fallback ladder, in order:

1. `navigator.share({ title:'flove · <app>', text:phrase, files:[html] })` — when `canShare` accepts the file
2. `navigator.share({ title, text:phrase })` — text only
3. `navigator.clipboard.writeText(phrase)` — copy, with a toast
4. share-intent rows — WhatsApp / Telegram / `mailto:` (and `window.open`+print) as explicit menu options

PWA, web-app-manifest and service-worker are **out of scope for phase 1**:
"share to mobile" means the Web Share API, not an installable app.

**DOM hooks (canonical).** So the controls are found and repaired the
same way in every app, the action surface speaks one vocabulary (this
supersedes the older `data-flove-save="bundle"` sketch and the
`[data-action][data-fmt]` form):

| Hook | Element | Meaning |
|------|---------|---------|
| `data-flove-save="<fmt>"` | each format button | download that format (`md`/`json`/`xml`/`html`/`jpg`/`csv`) |
| `data-flove-share="mobile"` | the mobile-share button | run the Web Share ladder above |
| `data-flove-share="apps"` | the in-page intent grid | explicit WhatsApp / Telegram / mail links (optional sibling of `mobile`) |
| `data-flove-copy="phrase"` | the copy button | copy the live phrase |

**Round-trip honesty.** JSON carries `version:1` and is *import-ready*.
The *full* importer is **F1**, but **`mini-full` ships a minimal
`<input type="file">` import already in F0** — it is the no-backend
durable closure (§10.3b feature 5), reading an exported profile back so a
shared single file regains its data even on `file://`. Beyond that
minimal reader, the rich import UI stays deferred to F1. JPG is
**visual-only**: being raster it is the one format that cannot round-trip.

**Distro.** This is the **JS-distro** contract — the six formats need
real JS (Blob, canvas, Web Share). In the **CSS-pure distro** export is
inherently N/A; its send-surface reduces to a print stylesheet plus
copy-to-clipboard. The `/export` skill audits against the distro the app
actually targets and never reports "export missing" on a CSS-pure app.

**Tier rule — export has its own mini→super scale** (like every standard
element, §13.5), composable independently of the app's overall tier:

- **`mini` export = JSON only.** A single `.json` download — the model
  serialized with `JSON.stringify`, nothing else: no six-format bundle,
  no rating Views, no Web-Share `files` path. It is the smallest durable
  closure, the round-trip archive stripped of the presentation formats.
  This **supersedes the old "`mini` is pending / N-A"**: a JSON-only
  export *is* a conformant export, just at the mini rung. **Demo:
  `appy/appy-mini.html`**, whose `exportProfile()` (profile-model) and
  `getSettings()` (settings-model) each emit a plain JSON via the shared
  `downloadBlob` — no other format, no share path. The **format is the
  standard: always JSON** (a single `.json`, built with `JSON.stringify`)
  — that is the one mini invariant. What's **free is the model inside**:
  no fixed summary-model, no parity / parse-back audit at the mini rung —
  each app **phrases its mini JSON freely** (whatever shape fits it). The
  `/export` skill is the **`basic`-export** demo/auditor and does not
  police mini models; JSON-as-the-format is all the mini rung fixes.
- **`basic` export upward = the actual model.** From the **`basic`** tier
  the app carries the *full* contract above — all six formats
  (`md·json·xml·html·jpg·csv`), parity, the rating Views and the
  Web-Share-to-mobile path. Because all F0 JS is **inline** (§13.9 distro)
  the cost is low enough that `basic`, not just `advanced`, carries it;
  `normal`/`advanced`/`super` inherit it.

Reference implementations: `appy/appy-mini.html` (**mini** — JSON only),
`blogy/blogy-advanced.html` (md/json/xml/html) and `metas/souls.html`
(the full six-format model that `basic`-and-up implements).
