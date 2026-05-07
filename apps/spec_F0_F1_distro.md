# ✺ flove · F0 + F1 distro spec — feature-driven rewrite

This replaces the previous architectural draft with the actual UX
Rafael described. The data model below is the floor that makes the
features work; it's not the point. The features are the point.

The spec covers four pieces:

1. **Per-textarea controls** — voice, add-another (both naming modes).
2. **Live legible phrase** below the form.
3. **The six-button action bar** on the phrase: Copy / Share / Magic / Insight / Publish / Format.
4. **Common HTML shell** so each app only writes its middle.

Everything works offline. Insight and Publish use network when wired,
and degrade gracefully when not.

---

## 1 · Per-textarea controls

Every `<textarea>` (and every `<input type="text">`) inside a flove
form gets two small controls injected by the shell:

| Glyph | What it does |
|-------|--------------|
| 🎙️    | Web Speech API recording. Click to start, click to stop. Final transcript is appended (with a leading space if the field is non-empty). State: `is-recording` class while live; visible pulse from CSS. |
| ➕    | Adds another input of the same logical field. Keeps focus on the new one so the user can type immediately. |

The voice button is hidden if `SpeechRecognition` is unsupported. The
add-another button is hidden if the field declares
`data-flove-multi="off"`.

### 1.1 · Multi-value naming — both modes are supported

Set on the field, or on the form as a default:

```html
<!-- per-field -->
<textarea name="what" data-flove-multi="numbered"></textarea>

<!-- form-wide default -->
<form data-flove-app="loves" data-flove-multi="array"> … </form>
```

Default if neither is declared: `numbered`.

#### 1.1.a · numbered mode

The first clone keeps the base name. Subsequent clones append `_2`,
`_3`, …  Snapshot keys stay flat:

```json
{
  "what":     "a long walk together",
  "what_2":   "a quiet morning",
  "what_3":   "a song"
}
```

Best for: forms that read like spreadsheets, or apps where each entry
is conceptually distinct (and may want its own subtype later). The
phrase serializer renders each numbered key as its own clause.

#### 1.1.b · array mode

All fields share the bracketed name `baseName[]`. Snapshot collapses
them into an array:

```json
{
  "what": [
    "a long walk together",
    "a quiet morning",
    "a song"
  ]
}
```

Best for: clearly-list-shaped fields (tags, ingredients, attendees).
The phrase serializer joins array values with commas.

#### 1.1.c · what `readFormFields` does

The same JS handles both, deterministically:

- `name="x"` only once → scalar at `x`.
- `name="x"` repeated (numbered mode collisions) → auto-array at `x`.
- `name="x[]"` (any count) → array at `x`.
- `name="x.y"` → still nested at `x.y` (existing dotted-path support).

Apps don't need to change anything — `data-flove-multi` is just a hint
to the cloner about which name pattern to emit.

---

## 2 · Live legible phrase

A read-only block sits **below** the form, always visible, updated on
every keystroke. Format:

```
✺ <app>/<type>(<subtype>) · <key>: <value> · <key>: <value> · yyyy-mm-dd
```

Multi-value fields are rendered as one clause each (numbered) or as
comma-joined values (array). Empty fields are skipped.

The phrase block is the visual home of the action bar in §3 — they
share a card so it's clear that the buttons act on what's shown.

---

## 3 · The six-button action bar

One row, six buttons, attached to the phrase block. Glyph + label
shown on desktop; glyph only on narrow viewports. Order is fixed.

| # | Glyph | Label   | Default behavior                                     | Long-press / Shift |
|---|-------|---------|------------------------------------------------------|--------------------|
| 1 | 📋    | Copy    | Copies the current phrase to clipboard.              | Copies the JSON.   |
| 2 | 📤    | Share   | `navigator.share({ text: phrase, files: [json] })`   | Phrase only.       |
| 3 | 🪄    | Magic   | Rewrites the phrase using random prepositions before each value. Different on each press. | Cycles language (es ↔ en). |
| 4 | 💡    | Insight | Opens the insight panel (§3.4).                       | Skips dialog if a default provider is configured. |
| 5 | ✺     | Publish | Opens the publish multi-select (§3.5).                | Skips selector if a single destination matches.   |
| 6 | 📁    | Format  | Opens the format menu (§3.6).                         | Repeats the last chosen format.                   |

### 3.1 · Copy

Clipboard write of the phrase as it is currently displayed (so if
Magic was just pressed, that's what gets copied — what you see is what
you copy). Toast: `✺ phrase copied`.

### 3.2 · Share

`navigator.share({ title: 'flove · <app>', text: phrase, files: […JSON…] })`
when supported; on desktop without `navigator.share`, falls back to
copying the phrase. Mobile share-sheet target apps (WhatsApp, Mail,
Telegram, Notes, …) become available for free.

### 3.3 · Magic — preposition remix

Reads the same fields as the phrase, prepends each value with a random
preposition drawn from a per-language pool, no preposition repeats
within a phrase unless the pool is exhausted. Pressing Magic again
re-rolls.

Default pools:

```
es: con · sobre · bajo · entre · hacia · desde · durante · según ·
    ante · tras · junto a · cerca de · frente a · gracias a ·
    a través de · en torno a
en: with · about · beneath · between · toward · from · during ·
    according to · before · after · beside · near · across ·
    around · concerning · inside
```

Language is read from `<html lang>`, falling back to `en`. Apps may
override by passing `floveShell({ magic: { prepositions: { … } } })`.

Result example (es, `loves/act(gift)`):

```
✺ loves/act(gift) · sobre a long walk together · hacia M. · durante intimate
```

The phrase block has two visual states: `phrase` (canonical) and
`phrase phrase--magic`. Toggling Copy uses whichever is shown.

### 3.4 · Insight — both modes specified

Insight calls a user-customizable AI. The shell supports two modes,
both implemented:

#### Mode A · default provider (skip dialog)

If the page boots with a provider, no dialog. One click → fetch →
result panel.

```html
<script type="module">
  import { floveShell } from './flove-shell.js';
  floveShell({
    insight: {
      url:     'https://my-endpoint/insight',
      headers: { 'Authorization': 'Bearer …' },
      prompt:  'Give one-paragraph insight about this flove element. Element JSON follows.',
    }
  });
</script>
```

The shell POSTs `{ prompt, element }` and renders `response.text` (or
`response.choices[0].message.content`, both shapes supported).

#### Mode B · config dialog (default when nothing is wired)

First click opens a dialog with three fields: endpoint URL, headers
(JSON), prompt template. The values are saved in `localStorage` under
`flove.insight.config` and reused on subsequent presses.

A small *(reset)* link in the dialog clears the config so the user can
re-prompt. The dialog says explicitly: "Bring your own AI. Nothing is
sent until you press *Run insight*."

#### Result panel

Either way, the response is shown inline below the action bar, with
its own Copy / Share / Save buttons (because an insight is itself a
small flove element of `type: "insight"`).

### 3.5 · Publish — multi-select platforms

Click → modal with a checkbox list of platforms. The list is the
union of:

1. **Routed destinations** — `routing.json` matches for this element
   (e.g. `oasis · market/gifts`).
2. **User custom platforms** — added via *Add platform* in the dialog.
   Saved in `localStorage` under `flove.publish.platforms`.

Each platform has: name, URL/endpoint, optional handler kind
(`webshare`, `webhook`, `mailto`, `clipboard`, `download`).

User ticks ≥1, presses *Publish*. The shell calls each platform
sequentially, shows a per-platform success/failure list. Without a
publisher adapter wired (F2 not yet running), the dialog is
**dry-run-only** — it just shows which platforms WOULD have received
the element.

Long-press / Shift-click skips the dialog if exactly one route
matches.

### 3.6 · Format — export menu

Click → small popover with five choices, all generated client-side:

| Format          | Extension       | Use case                                  |
|-----------------|-----------------|-------------------------------------------|
| FloveElement    | `.flove.json`   | Round-trip with other flove apps          |
| Phrase          | `.flove.txt`    | Drop into a notebook, message, README     |
| Markdown        | `.md`           | Heading + table; pasteable into anything  |
| CSV             | `.csv`          | One row per element; spreadsheet-friendly |
| Key : Value     | `.txt`          | One field per line; minimal               |

Choosing a format triggers an immediate download. Long-press / Shift
re-runs the last format chosen, so power-users can hammer the button.

---

## 4 · Common HTML shell

The whole boilerplate an app needs is now this small:

```html
<!doctype html>
<html lang="es" data-flove-app="<APP>">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
  <title>✺ flove · <APP-TITLE></title>
  <link rel="stylesheet" href="flove.css">
  <style>
    :root {
      --app-accent:        #6ee7b7;
      --app-accent-soft:   #a7f3d0;
      --app-ink-on-accent: #042418;
    }
  </style>
</head>
<body>
  <div class="flove-bar">
    <a class="flove-home" href="index.html">←</a>
    <span class="flove-mark flove-asterism">✺</span>
    <span class="flove-app-name"><APP-TITLE></span>
  </div>

  <main>
    <form data-flove-app="<APP>" data-flove-type="element">
      <!-- app's own fields here -->
    </form>
    <!-- shell renders phrase + 6-button bar here automatically -->
  </main>

  <script type="module">
    import { floveShell } from './flove-shell.js';
    floveShell();
  </script>
</body>
</html>
```

The shell injects: phrase block, action bar, per-textarea controls,
publish/insight/format dialogs as needed.

App-side concerns: app title, app accent CSS variables, the form's
own fields. Everything else is shell territory.

---

## 5 · JS distro — current file manifest

```
~/flove-demos/
├── flove.css            shared styles + design tokens
├── flove-io.js          element snapshot + draft persistence
├── flove-phrase.js      legible-phrase serializer (canonical + magic)
├── flove-routing.js     routing.json matcher (dry-run capable)
├── flove-insight.js     insight dialog + provider call
├── flove-shell.js       feature center (per-textarea + phrase + 6 buttons + dialogs)
├── routing.json         apps → 0asis modules (F1 data)
└── _template.html       starter page
```

`flove-shell.js` is the only import an app needs.

---

## 7 · Header UX

The shell enhances any existing `.flove-bar` element. It does not
replace the bar — it adds three things:

```
[ ←back ]  [ ✺logo ]  [ App name ]    [ ── categories ── ]    [ spacer ]    [ ☰ menu ]
```

### 7.1 · Back arrow (left)

Already provided by every app's `.flove-bar` as `<a class="flove-home"
href="index.html">←</a>`. Returns to the launcher. The shell does
not touch it.

### 7.2 · Logo · click to reload

The shell binds a `click` handler on every `.flove-mark` /
`.flove-asterism` inside the bar. Clicking reloads the page. Drafts
survive (they live in IndexedDB).

### 7.3 · Filterable categories (center)

Apps declare categories *once*, either via meta or a data attribute:

```html
<!-- option A: page-wide -->
<meta name="flove-categories" content="metaphysics, science, biology, linguistics, psicosocial">

<!-- option B: scoped to a form -->
<form data-flove-app="loves" data-flove-categories="gifts, wishes, days">
```

The shell renders one chip per category in the bar's center, multi-
select, persisted to `localStorage` under `flove.filter.<app>`. Each
toggle dispatches a custom event:

```js
document.addEventListener('flove:filter', (ev) => {
  const active = ev.detail.categories;   // ["gifts", "wishes"]
  // app filters its own list / form / view
});
```

The shell **renders** the chips; the app **acts** on the filter. This
keeps the shell small and the app in charge of what filtering means.

### 7.4 · Common menu (right) · non-invasive dropdown

A `☰` button on the right opens a small dropdown anchored to the
button. Two sections:

**Common (shell-provided):**
- 📂 my drafts — opens the drafts modal (any app's drafts visible; only the current app's drafts can be loaded back into the form).
- 💡 insight provider — clears the saved insight config so the next 💡 click re-opens the dialog.
- ✺ publish platforms — opens the platforms manager (add / remove custom destinations without publishing).
- ↻ reload — same as clicking the logo.
- 🏠 all apps — link to `index.html`.

**Custom (app-provided):** any element marked with
`data-flove-menu="custom"` has its children moved into this section.

```html
<!-- somewhere in the app's body, hidden if you like -->
<div data-flove-menu="custom" hidden>
  <button class="flove-menu__item" onclick="exportLog()">📜 export full log</button>
  <a class="flove-menu__item" href="#help">❓ how this app works</a>
</div>
```

The custom section is dropped if the app provides nothing.

The dropdown closes on outside-click, on resize-position, and after
any item activation. No backdrop, no full-screen takeover —
non-invasive by design.

---

## 8 · Field-type policy

The shell's per-field controls (🎙 voice, ➕ add-another, file
auto-spawn) only apply to fields where they make sense.

### 8.1 · Cloneable types (get the ➕ button)

```
textarea, select,
input[type=text|search|email|url|tel|number|
            date|time|datetime-local|month|week|file]
input          (no type attribute)
```

Skipped: `password, checkbox, radio, range, color, hidden, submit, button`.
Cloning radio/checkbox groups is ambiguous and best done by the app.

### 8.2 · Voice (🎙) — only on text-like fields

Shows on: `textarea`, `input[type=text|search|email|url|tel]`, and
`input` without a type. Hidden everywhere else (no point dictating
into a date picker).

Hidden globally if `SpeechRecognition` is unsupported. Recording
state has a CSS `is-recording` class with a soft pink pulse.

### 8.3 · Core fields — never enhanced

Field is treated as a singleton (no ➕, no 🎙 record, no clone) when:

- `type="password"`, OR
- `data-flove-core="true"` (per-field opt-out), OR
- the (stripped) field name is in this list:
  ```
  username, user, login, handle,
  password, pass, pwd, passphrase,
  token, apikey, api_key, secret
  ```

The denylist is intentionally short. For anything else (email
fields used in login flows, OTPs, captcha responses), apps should
mark `data-flove-core="true"` explicitly.

### 8.4 · Per-form opt-outs

Apps with their own field UX can disable shell enhancement without
losing the phrase card + 6-button bar:

```html
<form data-flove-app="wanty" data-flove-enhance="off">
  <!-- the app renders its own textareas with custom voice/add buttons.
       The shell still snapshots the form (mirror inputs are typical
       here) and renders the phrase card after it. -->
</form>
```

### 8.5 · File inputs — auto-spawn after upload

When the user picks a file in the *last* file input of a group, the
shell automatically spawns a new empty file input below it. Manual
➕ also still works. Combine with `data-flove-multi="numbered"` to
get `photo`, `photo_2`, `photo_3` …, or `data-flove-multi="array"`
for `photo[]`.

Note: the snapshot stores file *names*, not file contents. Reading
file bytes for upload is the publisher's job (F2). Local-first
behavior is filename-only; this keeps drafts small and IDB-fast.

---

## 9 · What changed vs. the previous spec

- **v0.2 → v0.3 (this revision):**
  - Header is now a first-class concept: logo-reload, filterable
    categories at center, common+custom menu on the right.
  - Field-type policy: ➕ extended to all reasonable input types
    (including file, with auto-spawn on upload), 🎙 only on text-like
    fields, core fields like password/username never cloned.
  - Drafts modal under the menu lets users load or delete any saved
    flove element on the device.
- **v0.1 → v0.2:**
  - Action bar grew from 4 to 6 buttons (Save dropped → Format menu;
    Insight + Magic added).
  - Phrase moved from optional preview to mandatory block.
  - Per-textarea voice + add-another introduced.
  - Multi-value field naming first-class (numbered + array).

---

*Spec status: draft v0.3 · 2026-05-05 · header + field-type policy.*
