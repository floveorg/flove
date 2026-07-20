# ✺ flove · Summary panel — §13.9

Part of the flove frontend standards catalogue. Index / matrix: `../README.md` · contract: `../contract.md` · back to the catalogue: `../frontend.md`.

---

### 13.9 · Summary panel — phrase + insights + views + cycles + download

The **last** step-panel of every app (the one users arrive at after
filling in their fields) aggregates the user's input into a single
**live phrase**, then exposes the full action surface for sending that
phrase out (copy, save, share, publish, download). Reference impl:
`.step-panel.is-summary` in `apps/blogy/blogy-advanced.html`
(line ~7178; inline-copy in `apps/blogy/blogy-advanced-one.html`).

**Insights are a base feature here — static, pure-CSS reflection cards.**
The 4 `insight-*` cards are hand-authored editorial prompts (in blogy:
Who / What / Where / Why), cycled by `#insight-0..4` radios with no AI:
the same four prompts show for every user, so they belong in this
frontend standard. They are the *static* occupant of the Insight slot;
the **AI** version — the 💡 Insight action of §10.6.4, which calls a
user-customizable / local AI (**`MyWizy`**, F1) or the global **wizy**
(Athenea, F4 / §15.1) — later **augments or replaces** these cards. So
§13.9 owns the static cards; §10.6.4 owns the AI behaviour that fills
the same slot.

**Markup outline (canonical):**

```html
<section class="step-panel is-summary">
  <!-- Title row: just the ✦ Summary title + Update (right), shown when the
       summary is expanded, with a caption below explaining when to use it
       (Update = §10.3a). Reset is NOT in the title row anymore — it sits on
       its OWN destructive row at the BOTTOM of the summary, below the action
       buttons (see the reset-row after the actions below), and ALSO as an
       item in the app's ☰ menu where the app has one. Reset is carried on
       `mini` and `basic`, except appy (no Reset there). -->
  <header class="summary-head">
    <h2>✦ Summary</h2>
    <span class="update-wrap update-wrap--title">
      <button class="btn ghost update-btn" type="button" data-flove-update>
        Update <span class="stale-dot" hidden aria-label="Out of date"></span>
      </button>
      <small class="update-hint">
        <span class="t-en">if you re-edited the form</span>
        <span class="t-es">si has reeditado el formulario</span>
      </small>
    </span>
  </header>

  <!-- 4 static reflection cards, one at a time via #insight-N (states 1..4 = a card, 0 = none).
       AI-filled variant = the 💡 Insight action, §10.6.4 -->
  <section class="insight-panel insight-1-content"> … </section>
  <section class="insight-panel insight-2-content"> … </section>
  <section class="insight-panel insight-3-content"> … </section>
  <section class="insight-panel insight-4-content"> … </section>

  <!-- Two clause variants — magic-toggle swaps which is shown -->
  <output class="clause clause-default" data-flove-phrase
          spellcheck="false" aria-label="Summary phrase"> … </output>
  <output class="clause clause-magic"
          spellcheck="false" aria-label="Magic phrase"> … </output>

  <div class="action-grid">
    <!-- Hidden view toggles -->
    <input type="checkbox" id="views-open"     class="ctl">
    <input type="checkbox" id="view-bars"      class="ctl">
    <input type="checkbox" id="view-vertical"  class="ctl">
    <input type="checkbox" id="view-axial"     class="ctl">
    <input type="checkbox" id="view-spider"    class="ctl">

    <!-- Row 1: Views · Insight cycle · Magic/Phrase · Update · Copy -->
    <div class="action-row">
      <label class="btn ghost views-btn" for="views-open"> Views </label>
      <span class="insight-cycle"> 5 insight-step labels (0..4) </span>
      <label class="btn ghost magic-btn-summary" for="magic-toggle">
        <span class="label-off">Magic</span><span class="label-on">Phrase</span>
      </label>
      <!-- Update: re-derives the summary from storage (§10.3a); stale-dot
           lights on an edit event (no polling), clears on click -->
      <button class="btn ghost update-btn" type="button" data-flove-update>
        Update <span class="stale-dot" hidden aria-label="Out of date"></span>
      </button>
      <label class="btn ghost copy-btn" for="copy-hint"
             data-flove-copy="phrase"> Copy </label>
    </div>

    <!-- Row 2 (views subtabs) — 4 view-pick labels -->
    <div class="action-row action-row--views" data-active-view="plain"> … </div>

    <!-- Chart slot — pure-CSS bars + vertical, plus JS-painted SVG -->
    <div class="cssviz-out" aria-hidden="true">
      <div class="cssviz cssviz--bars">     … cssbar.cssax--h/f/l/t  … </div>
      <div class="cssviz cssviz--vertical"> … csscol.cssax--h/f/l/t … </div>
      <div class="cssviz cssviz--svg"></div>            <!-- axial / spider -->
    </div>

    <div class="copy-hint-panel" role="status"> … </div>

    <!-- Row right: 3 cycle-wraps (Save · Share · Publish) -->
    <div class="action-row right">
      <span class="cycle-wrap save-wrap">  … </span>
      <span class="cycle-wrap share-wrap"> … </span>
      <div  class="cycle-wrap pub-wrap">   … </div>
    </div>

    <!-- Export extras — opt-in rows on the right; each, when checked,
         injects an extra field into the summary-model so it rides into
         ALL six export formats (§13.12). Off by default. -->
    <div class="export-extras">
      <label class="export-extra-row">
        <input type="checkbox" class="ctl" id="add-date" data-flove-add-date>
        <span class="t-en">Add date</span><span class="t-es">Añadir fecha</span>
      </label>
      <label class="export-extra-row">
        <input type="checkbox" class="ctl" id="add-profile" data-flove-add-profile>
        <span class="t-en">Add profile</span><span class="t-es">Añadir perfil</span>
      </label>
    </div>

    <!-- Download — own row; one button per canonical format (§13.12 authority,
         supersedes the single data-flove-save="bundle" sketch) -->
    <div class="download-row">
      <a class="btn ghost dl-btn" download="…" data-flove-save="md">MD</a>
      <a class="btn ghost dl-btn" download="…" data-flove-save="json">JSON</a>
      <a class="btn ghost dl-btn" download="…" data-flove-save="xml">XML</a>
      <a class="btn ghost dl-btn" download="…" data-flove-save="html">HTML</a>
      <a class="btn ghost dl-btn" download="…" data-flove-save="jpg">JPG</a>
      <a class="btn ghost dl-btn" download="…" data-flove-save="csv">CSV</a>
    </div>
  </div>
</section>
```

**Canonical name = "Summary" (family-wide).** The panel is **always**
called **Summary** — label `✦ Summary` and the `summary-*` / `is-summary`
class family below. Apps that named it something else — `invitation`
(willy/myfamily's `invitation-card`), `resume` (worthing), a bare
`phrase`-as-panel, or any other word — **rename to `summary` / `summary-*`**
(label + internal classes/ids). The one exception is the canonical
**live-phrase element** `data-flove-phrase` (and the `summaryModel`
keys): that hook keeps its name — it's a *part* of the Summary, not an
alternate name for it.

**Vocabulary (`step-panel.is-summary` family):**

| Class / hook | Role |
|---|---|
| `step-panel.is-summary` | The last step panel — owns padding/border so the absolutely-positioned download-toast sits inside |
| `insight-panel`, `insight-N-content` | 4 static reflection cards above the phrase (blogy: Who/What/Where/Why; per-app labelling). AI-filled variant = §10.6.4 |
| `insight-cycle`, `insight-step` | Button cycle showing 1 of 5 states via `#insight-0..4` radios (states 1..4 reveal a card, 0 = none) |
| `clause`, `clause-default`, `clause-magic` | The two phrase variants; swapped by `#magic-toggle` |
| `clause-code`, `flove-phrase-heart`, `flove-phrase-picked`, `flove-phrase-text`, `flove-phrase-emos`, `flove-phrase-note-lbl` | Inline parts the JS injects into `[data-flove-phrase]` |
| `flove-recap`, `flove-recap-row`, `flove-recap-emo`, `flove-recap-lbl`, `flove-recap-val`, `flove-mini-bar`, `flove-mini-fill` | Rater recap rows appended to the phrase |
| `action-grid` | The grid that wraps the rows under the phrase |
| `action-row`, `action-row--views`, `action-row.right` | Button rows (default, views subtabs, right-cluster) |
| `views-btn`, `view-pick` | The "Views" trigger + the 4 subtab buttons (Bars / Vertical / Axial / Spider) |
| `cssviz-out`, `cssviz`, `cssviz--bars`, `cssviz--vertical`, `cssviz--svg` | Chart slot — reserved height so toggling never reflows |
| `cssbar`, `csscol`, `cssbar-emo`, `cssbar-trk`, `csscol-trk`, `cssax--h/f/l/t` | Per-axis bar/column primitives (one per rater emoji) |
| `copy-btn`, `copy-hint-panel` | Manual-copy affordance + how-to panel |
| `summary-head`, `update-wrap`, `update-wrap--title`, `update-btn`, `stale-dot`, `update-hint` | Re-derive-from-storage button + staleness dot (§10.3a), in **two places**: action-row 1 (left of Copy) and beside the `✦ Summary` title (`update-wrap--title`, shown when the panel is expanded, with the `update-hint` caption "if you re-edited the form"). Dot lights on an edit event, clears on Update — no polling/timer |
| `reset-wrap`, `reset-btn`, `reset-hint` | **Reset** ("start new play") — sits on its **own destructive row at the bottom of the summary, below the action buttons** (Update / export / share / publish), set apart as the last, irreversible action, with the `reset-hint` caption "Clear all and start new play" below the button. Also surfaced as a **`Reset` item in the app's ☰ menu** where the app has one — both go through the same confirm-guarded handler. Overrides persistence: clears this app's own keys and reloads to a fresh, all-to-be-filled state (§10.3a). Carried on **`mini` and `basic`** (advanced/super may inherit); **not in appy**. *(The old `reset-wrap--title` title-row-left placement is superseded — the title row now holds just ✦ Summary + Update.)* |
| `cycle-wrap`, `cycle-trigger`, `cycle-step`, `cycle-step--open`, `cycle-step--close`, `cycle-row`, `cycle-row.above`, `cycle-row.below` | The open/close pattern shared by Save / Share / Publish; "above" rows reveal contextual pickers (e.g. schedule), "below" rows reveal sub-buttons |
| `save-wrap`, `save-btn` | Save cycle host; sub-row holds the **6** format toggles (`save-fmt-md/json/xml/html/jpg/csv` — the §13.12 canonical set, no `txt`) + `save-app` |
| `share-wrap`, `share-btn`, `share-sub` | Share cycle host + sub-targets. **Mobile** and **Apps** are the §13.12-canonical share targets (`data-flove-share="mobile"` / `"apps"`); **Print** and **Email** are optional per-app extras. |
| `pub-wrap`, `publish-btn`, `pub-row--schedule`, `pub-cal`, `pub-cal-panel`, `pub-cal-sel`, `pub-cal-d/m/y`, `pub-hh`, `pub-mm`, `pub-colon`, `pub-target`, `pub-all-btn` | Publish cycle + the date/time/audience scheduler that rides on the "above" cycle-row |
| `plat-row`, `plat-viewport`, `plat-track`, `plat-set`, `plat-nav` | 3-pane slider (3 platforms per page, `＋` advances; wraps 2→0) |
| `plat-card`, `plat-card-icon`, `plat-card-name`, `plat-card-info`, `plat-more`, `plat-more-tier`, `plat-tier-title`, `plat-tier-cards` | Per-platform cards (legacy tier deck kept hidden in blogy-advanced) |
| `plat-intro`, `plat-intro--wizardry/reddit/0asis` | Per-platform intro blocks revealed by the chosen `pub-plat-*` radio |
| `wizardry-grid`, `wizardry-cell`, `wizardry-cell-icon`, `wizardry-cell-name`, `wizardry-cell-info` | Wizard-picker grid shown when Wizy is the publish target |
| `go-btn` | Inline "✈ Go" beside Publish when the publish cycle is open |
| `magic-btn-summary` | Magic/Phrase toggle inside the summary (NOT the topbar `magic-btn`) |
| `download-row`, `dl-btn` | Download row holding the per-format buttons (`data-flove-save="<fmt>"`, §13.12); also the anchor for the unlock-toast per §13.8 |
| `export-extras`, `export-extra-row`, `add-date`, `add-profile` | Two opt-in checkbox rows on the **right** of the summary. **Add date** stamps the current date into the model; **Add profile** pulls basic profile info (the username/handle, read from the appy(-mini) profile) into the model. Both off by default; when checked the field rides into **all six** export formats (§13.12). |

**Behavior contracts:**

| Contract | Mechanism |
|---|---|
| **Insights cycle** | 5 sibling radios `insight-0..4`; each `insight-step` is a `<label for="insight-N">`; CSS reveals `.insight-N-content` via `body:has(#insight-N:checked)`. States 1..4 reveal a (static) card; state 0 = none. AI-filled variant = §10.6.4. |
| **Magic ↔ Phrase swap** | Single `#magic-toggle` checkbox; CSS shows `.clause-magic` and the `.label-on` variant of `magic-btn-summary` when checked, otherwise `.clause-default` + `.label-off`. |
| **Views (multi-toggle)** | 4 independent `view-*` checkboxes (no "Plain" radio — multiple views can be on at once). `#views-open` only toggles the *subtab row*; checking a view paints the matching `cssviz--<view>` chart. |
| **Cycle pattern (Save/Share/Publish)** | 4 radios `cycle-none/save/share/pub` form one exclusive group; each `cycle-step--open` is `for="cycle-<name>"`, each `cycle-step--close` is `for="cycle-none"`. CSS reveals the matching `cycle-row.below` (sub-buttons) and `cycle-row.above` (schedule, when applicable). |
| **Publish above-row** | The schedule (`pub-row--schedule`) sits in the `cycle-row.above` slot; visibility is *also* gated on the chosen `pub-plat-*` (e.g. 0asis schedules; Reddit doesn't). |
| **Platforms slider** | 3 `plat-set` columns inside one `plat-track`; `plat-nav` (`＋`) is a label for `pub-plat-set-0/1/2` radios that translate the track. Wraps 2 → 0. |
| **Update (re-derive)** | `.update-btn[data-flove-update]` re-derives the summary from storage so "what you see is what you export" holds; the `.stale-dot` lights on an edit event and clears on click. Event-driven, **no polling timer** (§10.3a). Appears **twice** — left of Copy in action-row 1, and beside the title (`update-wrap--title`) when the summary is expanded, with the caption "if you re-edited the form". `basic` and up carry both (F0 reaches down to `basic`, §13.9 distro); on `mini` (pending) both are absent. |
| **Reset (start new play)** | `.reset-btn[data-flove-reset]` returns **this one app** to a fresh start. Mechanic (§10.3a): after a confirm it empties **only this app's own store** (`flove:<app>:items` + `:v`) and calls `location.reload()` — the reload rebuilds the empty default and replays any intro, so no manual in-DOM teardown is needed (Reset ≡ Reload). Surfaced in **two places** wired to the same handler: its **own destructive row at the bottom of the summary, below the action buttons** (`reset-row`), with the caption **"Clear all and start new play"**; and a **`Reset` item in the app's ☰ menu** where present. When an app carries two `[data-flove-reset]` controls, bind them with `querySelectorAll`/delegation (not a lone `querySelector`) so both fire. Carried on **`mini` and `basic`**, **except appy** (see below). **Scope is THIS file only** — remove just the app's own namespaced keys; **never `localStorage.clear()`**. Other flove apps share the same origin (`flove.org`, §10.5 shared quota) and **keep their persisted data**. **Destructive** — guard with a confirm so a stray click can't erase a session (the menu Reset routes through the same confirm). **appy is excluded — no Reset button** (it aggregates other apps' imported summaries; a "start over" there is out of scope and would be confusing). |
| **Download bundle** | Each format is a real `<a download>` whose `href` is rebuilt on click from the summary-model + views; per §13.8 the download row also anchors the unlock-toast. **The export/save/share DOM hooks are fixed by §13.12 (authority) — per-format `data-flove-save="<fmt>"`, which supersedes the older single `data-flove-save="bundle"` sketch.** |
| **Add date / Add profile (export extras)** | Two right-side opt-in checkboxes that **augment the summary-model before export**, so they round-trip through all six formats (§13.12). `#add-date` adds a `date` field (current date, ISO in machine formats / localized in prose). `#add-profile` adds a `profile` field (basic info — at minimum the username/handle — **read from the appy(-mini) profile**; if no appy profile is present, the checkbox is disabled or yields nothing, never a broken export). Both **off by default**; unchecking removes the field so parity holds (no stale date/profile lingers). |

**JS hooks (data-* contract):**

| Attribute | Bound by |
|---|---|
| `data-flove-root`, `data-flove-title` | `<main>` — identifies the app root + bundle filename |
| `data-flove-phrase` | `clause-default` — the live mirror target the phrase renderer writes into |
| `data-flove-copy="phrase"` | `copy-btn` — manual-copy hint trigger (no clipboard write; pure how-to panel) |
| `data-flove-update` | `update-btn` — re-derives the summary from storage; toggles `.stale-dot` (§10.3a) |
| `data-flove-reset` | `reset-btn` — clears this app's selections + its **own** namespaced store keys only (never `localStorage.clear()`; other apps keep their data) and returns to a fresh start ("start new play", §10.3a clear-my-data); `mini` + `basic`, not appy |
| `data-flove-share` | `share-btn` — opens the share cycle |
| `data-flove-print` | `share-sub` (Print) — `window.print()` |
| `data-flove-share-menu`, `data-flove-share-menu="mobile"` | `share-sub` (Apps / Mobile) — Web Share API |
| `data-flove-publish="go"`, `data-go-publish` | `go-btn` — fires the publish action to the chosen `pub-plat-*` |
| `data-flove-save="<fmt>"` | each format button — rebuilds `href` + filename and triggers that format's download. **Per-format, per §13.12** (supersedes the old `data-flove-save="bundle"`). |
| `data-fmt`, `data-view`, `data-active-view`, `data-wizardry`, `data-when-set` | Picker labels — used by the renderers/save-bundler to enumerate selections |
| `data-flove-add-date` | `#add-date` checkbox — when checked, the save-bundler adds the `date` field to the model so it appears in every export |
| `data-flove-add-profile` | `#add-profile` checkbox — when checked, the save-bundler adds the `profile` field (username/handle from the appy(-mini) profile) to the model for every export |

**Distro — all F0 JS is inline (no third-file calls).**

- **Inline is the rule.** The summary renderers, save-bundler, share,
  publish, the persistence layer (§10.3a) and the Update/stale loop live
  **inline in each app's own file** — no external renderer module, no
  call out to a shared script — so every app is a self-contained single
  HTML file that can be shared and opened on its own. `apps/flove.js`
  stays the *optional* **sound engine** only; the summary never depends
  on it. *(This supersedes the earlier "renderers live in `apps/flove.js`"
  framing — they never did; F0 makes inline the rule, for portability.)*
- **Tier reach — basic and up.** F0 (persistence + summary + Update +
  export) is implemented from the **`basic`** tier upward, not
  advanced-only: inline JS is cheap enough that `basic` carries it. See
  §13.12's tier rule (updated to match).
- **`mini` app build is pending.** A future, more-optimized `mini` will
  take the clean app name; at that point today's single-file apps are
  renamed with the **`-one`** suffix (the self-contained variant, §13.1).
  Until then the current files already *are* the self-contained form.
  *(The pending item is the app **build/rename**; the `mini` **export**
  rung = JSON is already settled, §13.12.)*
- **advanced / super** — inherit the same inline F0 surface; `super` adds
  its backend affordances on top.

**Per-app overrides:** apps may drop sub-features (e.g. omit Publish if the app has no outbound surface) but MUST keep the outer `.step-panel.is-summary` + `.clause[data-flove-phrase]` + the per-format `.dl-btn[data-flove-save="<fmt>"]` buttons (§13.12) so the renderer / exporters / unlock-toast (§13.8) keep working.
