# ✺ flove · Frontend standards — catalogue (§13)

The **single source of truth** for the *opt-in* patterns that flove frontends
adopt — the full harvested catalogue (§13), plus regions, elements and
implementation conventions. Promoted here out of `backend.md`.

- **Mandatory contract:** `contract.md` (identity, tokens, CSS-over-JS, file
  pattern, a11y floor, anti-patterns) — the non-negotiable core.
- **At-a-glance index / matrix:** `README.md`. **Adoption per app:** `adoption.md`.
- **Reading map:** `../overview.md`. **Philosophy:** `../worldview.md`.
  **Architecture / backend:** `../backend.md`.

The `§13.x` labels are canonical and unchanged; references elsewhere resolve
here. **blogy** is the reference app — new patterns mature there first, then
other apps adopt them (each standard is opt-in per app except Onboarding §13.6,
which is mandatory family-wide). If a standard outgrows this file, split it to
`frontend/<topic>.md` and leave a pointer here + in `README.md`.

## Three axes of a frontend

| Axis | Question | Values |
|------|----------|--------|
| **tier** | how many features? | nano · mini · basic · normal · advanced · super · mega (nano/mega reserved) |
| **distro** | which runtime / qualities? | CSS-pure → JS (`flove.js`) → backend |
| **surface** | into which medium? | hardware · 2D · 3D · AR · VR |

They map onto the Tools tree of the coordinate system (Hardware·HTML·CSS·JS·Backend).
→ §13.1, §13.11, `../coordinates.md`.

---

## 13 · Frontend standards (harvested from blogy)

blogy is the most-elaborated app in the constellation and has become
the **reference implementation** for several reusable patterns. This
section catalogues those patterns so they can be adopted by other apps
without re-deriving them.

The list grows as new patterns mature in blogy and get extracted.

### 13.1 · Tier model → `frontend/tiers.md`

> Full spec moved to its own chapter, **`frontend/tiers.md`** (it outgrew this file). The `§13.1` label is unchanged.

### 13.2 · i18n — `.t-en` / `.t-es` + `#ui-lang-es`

Pure-CSS language switch. Two radios on the page:
```html
<input type="radio" name="ui-lang" id="ui-lang-en" class="ctl" checked>
<input type="radio" name="ui-lang" id="ui-lang-es" class="ctl">
```
Every translatable string is split into two siblings:
```html
<span class="t-en">All</span><span class="t-es">Todo</span>
```
The rule:
```css
.t-es{ display: none; }
body:has(#ui-lang-es:checked) .t-en{ display: none; }
body:has(#ui-lang-es:checked) .t-es{ display: inline; }
```
For CSS-pure tier files this is the canonical pattern. For `advanced`/
`super` (JS distro), the same markup is read by the `blogy-newlanguage`
form to produce translation seeds — `addnewlang` operates on `STRINGS`
extracted from the `.t-en` / `.t-es` pairs.

**When extending content:** every new visible string MUST be wrapped in
`.t-en` / `.t-es`. The corresponding `STRINGS` entry in the language
form must be added in the same change (see §13.3 sync rule).

Reference impl: `apps/blogy/blogy-advanced-one.html` lines ~2955 (CSS)
and ~8754 (radios), `apps/blogy/blogy-newlanguage.html` for the form.
(The line numbers cited are from the self-contained variant; the
canonical modular `blogy-advanced.html` uses the same pattern but its
line numbers will drift as the shared `flove.js` evolves.)

**Default language — pick once, applies family-wide.** The chosen
language is persisted under **one shared, app-agnostic key**: **`flove:lang`**
(`'en'`/`'es'`/…), a sibling of the `flove:<app>:…` F0 store keys (§10.3a)
but **deliberately not app-scoped** — every app reads and writes the *same*
key, so a single choice is the default across the whole family.

```js
// on change (worldball / radio):  localStorage.setItem('flove:lang', lang)
// on load (init):  const l = localStorage.getItem('flove:lang');
//                  if (l) { check #ui-lang-<l>; applyLang(); }
```

- **Entrance picker (first run).** On the launcher (`index.html`), if
  `flove:lang` is unset, show a §13.6 onboarding step — "Choose your
  language · Elige tu idioma 🌐" — and store the pick. Loud the first
  time, silent after; thereafter only the worldball changes it.
  - **Per-distribution landing override.** A standalone-distributed app may
    host the entrance itself instead of `index.html`. The **appy download**
    lands first on **`appy-mini`** (not the launcher) — so appy-mini carries
    the first-run language picker + global changers; on upgrade the landing
    moves to **`appy-basic`** (Go-home button + features intro). Same §13.2
    `flove:lang` + `?lang=` contract, different host. Spec:
    `flove/docs/superpowers/specs/2026-06-24-appy-intros-rainbow-roadmap-design.md`.
- **Cross-app reach — origin vs `file://`.** localStorage is per-origin.
  Served from **one origin** (`flove.org`, §10.5) the key is shared →
  pick-once-applies-everywhere. As **separate `file://` files** the
  browser isolates storage, so add a **`?lang=<code>` URL handoff**:
  launcher/app links carry the code, the target reads the param first,
  applies it, and stores it locally — works fully offline.
- **Precedence:** `?lang=` URL param **>** stored `flove:lang` **>**
  **English** — the base language and the **default selection** (§13.2
  shows `.t-en` by default; the worldball starts on English).
- **Migration:** apps that today persist `translate2-lang` (e.g.
  `appy-mini.html`) standardize to `flove:lang`; `/translate2` reads both
  during the transition and writes only `flove:lang`.

The **`/translate2`** skill enforces this: the shared `flove:lang` key,
the load-time read + `applyLang()`, and the `?lang=` handoff, so every app
it touches shares one default.

**Entrance · the rainbow row.** **Language** is the lead control, styled as
a **rainbow "windy" button** — a flowing multi-colour gradient (the
worldball 🌐), **always available** (never gated, even at mini). Following
it, **the other seven features sit in a row, each taking one of the seven
rainbow colours in order** (red → violet): a single rainbow read left to
right. **Vizy** comes **after** the rainbow (beyond violet — its own
treatment), since it's the advanced-only one. Each card is gated to **its
own Navigation tier** (the per-element escalation scale, §13.1/§13.8):
below a tier's points threshold the card is **dimmed (~50% opacity) +
inert**, and a locked click says *"Earn more points for upgrading
Navigation."*; it lights to full colour the moment that tier is reached.
Same points economy as mini→basic→normal→advanced (§13.8 counters → gated
tier-pop · §13.13 threshold trigger).

**The seven rainbow cards** (colour ← order in the row):
- 🔴 **Offline** — offline-only mode (`flove:offline`); never touches the network. *(basic)*
- 🟠 **Profile** — your handle/identity (`flove:profile`); the basic info *Add profile* (§13.9) pulls into exports. *(basic)*
- 🟡 **MyWizy** *(seed-data)* — the local AI (F1, §10.6.4 / §15.1) that **seeds suggestions / starter data** while you fill forms. *(basic)*
- 🟢 **PRO** — the **full**-feature unlock across apps (`flove:pro`): PRO is to **full** what **mini** is to the minimal seed — the all-features end of the scale. *(full ⟷ mini)*
- 🔵 **Counters** — the §13.8 arcade counters. *(`normal`)*
- 🟣 **Sound** — the `flove.js` sound engine. *(`normal`)*
- 🟪 **Random** — randomize/shuffle (compass random, §13.4). *(`normal`)*

**After the rainbow — Vizy:** the visualization surface (charts / summary
Views, the `vizy` app) — activates at **`advanced`**.

So the row lights up by ascending tier: **language (mini, always) →
Offline · Profile · MyWizy · PRO (basic) → Counters · Sound · Random
(normal) → Vizy (advanced).**

> **Live card roster — see §13.6.** The seven-card list above is the
> earlier design; §13.6 carries the **later merged roster** (`Offline ·
> Nety · Profile · MyNet · MyWizy · Sety`, 2026-06-24). **PRO** is no
> longer a standalone colour card there — it became the **full**-feature
> tier unlock (PRO ⟷ mini, above); **MyNet** and **Nety** were added.

| Class / hook | Role |
|---|---|
| `entrance-row`, `lang-windy` | The single entrance row; `lang-windy` = the rainbow flowing-gradient language button (worldball). The "windy" animation pauses under `prefers-reduced-motion` (§6). |
| `entrance-feat`, `entrance-feat--rainbow`, `is-locked` | The seven rainbow feature cards (`--rainbow` carries the per-card colour by position); `is-locked` = dimmed (~50%) + inert until its tier is reached |
| `entrance-feat--vizy` | Vizy, placed after the rainbow (advanced-only) with its own beyond-violet treatment |
| `data-flove-gate="<tier>-nav"` | Per-card gate on a Navigation-tier threshold — `basic-nav` (Offline · Profile · MyWizy · PRO), `normal-nav` (Counters · Sound · Random), `advanced-nav` (Vizy) (§13.8/§13.13) |
| `entrance-gate-msg` | The "Earn more points for upgrading Navigation" line shown on a locked click |

**Add a language — self-serve translation prompt.** The entrance shows the
**languages already available** (the worldball options), and beside them a
**`+` button**. Tapping `+` opens a **list of all languages**; choosing one
**copies a plain-text translation prompt to the clipboard** — a
ready-to-paste instruction asking an AI to translate the app into that
language (the user runs it in their own AI; this is the self-serve
companion to the `/translate2` skill Claude runs). The copied text then
**appears in a panel below the button rows**, so the user can read/re-copy
it, with a **big `✕` to collapse it back**, and a **link to a short guide** on
doing the translation quickly and well — the user-facing companion to the
`/translate2` skill, whose canonical home is the flove blog (`flove.org/blog`).
Until that post exists, **omit the `…-doclink`** rather than ship a dead link.
**English is the default selection** (the base language).

| Class / hook | Role |
|---|---|
| `lang-available`, `lang-add`, `lang-add-btn` | The available-languages display + the **`+`** add-language button |
| `lang-add-list` | The pop-open list of all languages shown on `+`; selecting one fires the copy |
| `data-flove-lang-add="<code>"` | Selecting a language — copies the plain-text translation prompt for that language to the clipboard |
| `lang-prompt-panel`, `lang-prompt-text`, `lang-prompt-collapse`, `lang-prompt-doclink` | The panel below the rows holding the copied prompt; `…-collapse` = the big **✕**; `…-doclink` = the "how to translate quickly & well" guide link (→ `flove.org/blog`; omit until that post exists) |

**Launcher · "Go play".** The launcher carries a **Go play** button
(`go-play-btn` / `data-flove-go-play`) that jumps straight to **appy at the
tier the user is in — or will be in**: it resolves to `appy-mini` →
`appy-basic` → `appy-mini-full` … from their Navigation points (the same
threshold/upgrade economy as §13.8 / appy's `upgradeToBasic`/`upgradeToFull`,
`appy-mini.html:3395`). "Where you are" = current tier; "will be" = the next
tier if its threshold has just been crossed.

### 13.3 · Forms-en-iframe — user-extensible app

blogy ships four sibling form files, each opened by the parent via a
CSS-only modal (`<label for="new-X-modal">` + `:has(#new-X-modal:checked)`):

| Modal | File | What it extends |
|-------|------|-----------------|
| `#new-labeler-modal` | `blogy-newlabeler.html` | New stepper panel ("labeler") |
| `#new-wizard-modal` | `blogy-newwizard.html` | New content-injection wizard |
| `#new-language-modal` | `blogy-newlanguage.html` | New language pair |
| `#new-sound-modal` | `blogy-newsound.html` | New sound for an interaction |

The labeler/wizard rename was executed in blogy on 2026-05-23
(see §13.7 rule 4 for the cascade log).

The parent file is **0 JS** (CSS-pure tiers) or **shell-only JS**
(advanced/super). JS lives in the iframe forms — they may read/write
the parent via `window.parent` for live inject.

**Sync rule:** when adding visible content to the parent, sync the
sibling forms in the same turn:
- New i18n string → `STRINGS` entry in `newlanguage`.
- New stepper panel → `TEXT_VARS` field in `newlabeler` (label by panel
  name, not by step number — visual and DOM order may differ).
- New clickable interaction → key in `newsound` (and `CLASS_MAP` in
  the sound engine if a new prefix is introduced).
- New wizard → only if the wizard mechanics change (rare).

**Pattern reuse:** any app that wants to be user-extensible (custom
sections, languages, sounds) should adopt this 4-iframe shape. Apps
that don't need extension can skip it.

### 13.4 · Compass — re-presents the contents on the surface (pure CSS)

A small circular button in the topbar that reveals a row of layout
modes when clicked. The compass **re-presents the same content —
reordering it *or* re-sizing it — within the current surface** (§13.11);
it does *not* change the surface itself (that is the surface axis).
All CSS, no JS.

**The five canonical compass sub-icons (layout modes):** `list` ·
`random` · `cloud` · `bubbles` · `increase`. (list = ordered list view;
random = shuffled order; cloud = tag-cloud layout, re-flowed and packed
with *each item* sized by its own weight; bubbles = floating-bubble
layout; increase = the items shown **bigger or smaller individually**
according to some parameter applied to each one — the parameter is a
forward-looking hook, not fixed yet — keeping the current arrangement
but emphasising items by that value, unlike `cloud`'s tag-cloud re-flow.)
`list`/`random` reorder; `cloud`/`bubbles`/`increase` re-size or
re-place — both are "re-presenting" the same content. An app shows the
subset that makes sense for its content; the order above is canonical.
```html
<input type="checkbox" id="compass-open" class="ctl">
<div class="compass-wrap">
  <label class="compass-btn" for="compass-open" title="Display modes"
         aria-label="Display modes" tabindex="0"></label>
  <div class="mode-buttons">
    <input type="radio" name="disp-mode" id="disp-default" class="ctl" checked>
    <input type="radio" name="disp-mode" id="disp-random"  class="ctl">
    <!-- … more modes … -->
  </div>
</div>
```
`body:has(#compass-open:checked) .mode-buttons{ display: inline-flex; }`
reveals the row. Each `disp-<mode>` radio drives a layout-reorder
ruleset (`body:has(#disp-random:checked) .X{ order: N; }`).

**a11y.** Because the reorder is pure CSS `order:` (and the resize modes
are pure CSS too), the DOM — and therefore the tab and screen-reader
order — is unchanged. The compass is a *visual* re-presentation, not a
content edit, so the canonical reading order is always preserved; don't
push `order:` so far that keyboard focus jumps around incoherently
(§6 a11y floor).

**When to add:** apps with more than one valid presentation (ordering)
of the same content on the same surface. Apps with a single layout don't
need a compass.

**Best fit — medium-populated lists.** The compass earns its place on a
*moderately populated list of items* (roughly a handful to a few dozen):
few enough that reordering / resizing stays legible, many enough that
more than one arrangement is genuinely useful. On a tiny set there is
nothing to re-present; on a very large one the CSS reorder/resize turns
noisy. The ideal would be a compass that re-presents *any* DOM subtree
generically, but applying it across arbitrary elements is too costly —
per-element `order:` / sizing rulesets don't generalize cleanly in pure
CSS — so the standard scopes it to the app's main item list.

**Compass complexity levels (own scale — independent of the app's tier).**
The compass has its *own* mini→super ladder, **chosen separately from the
app's overall complexity tier** (§13.1). Each level = the level below + one
more mode:

| compass level | layout modes |
|---|---|
| **compass-mini** | `list · random` |
| **compass-basic** | + `cloud` |
| **compass-normal** | + `bubbles` |
| **compass-advanced** | the **5**: `list · random · cloud · bubbles · increase` |
| **compass-super** | the 5 + (future) backend-driven modes |

> **Composable.** A given app picks its compass level *à la carte*: e.g. a
> `blogy-mini` (overall mini app) may still carry a **`compass-advanced`**.
> This applies to standard elements in general — compass, menu (§13.5),
> stepper, summary… each has its own mini→super scale you add where you
> want, not locked to the app's overall tier. *(So the per-tier rows in the
> §13.5 topbar table are the **typical default** escalation, not a
> requirement.)*

Reference impl: `apps/blogy/blogy-mini-css.html` lines ~181–308 (CSS) and
~854–932 (markup).

### 13.5 · Topbar

The sticky strip at the top of every flove app (the `.flove-bar` /
topbar). Which controls it carries is **itself a per-tier standard** —
the topbar grows with the tier, the same way the content does. blogy is
the reference; the escalation is:

| Topbar element | mini | basic | normal | advanced |
|----------------|:----:|:-----:|:------:|:--------:|
| App mark (inline SVG) | ✓ | ✓ | ✓ | ✓ |
| App title | ✓ | ✓ | ✓ | ✓ |
| Tier switcher (`tier-pop` / `level-pop`, §13.1) | ✓ | ✓ | ✓ | ✓ |
| Menu panel — opened by **logo/title click** (§13.7.13, *not* a ☰ button) | ✓ minimal | ✓ + language · About | ✓ | ✓ |
| ⚙ `settings-btn` — topbar collapse (§13.7.13) | — | ✓ | — | ✓ |
| Tier badge | — | — | ✓ | ✓ |
| Compass — display modes (§13.4) | — | — | ✓ | ✓ |
| Magic labelers (✨ + labeler chips) | — | — | ✓ | ✓ |
| Magic-mode header variant · app-toggle | — | — | — | ✓ |

Read each tier's row as the **typical default** topbar for that tier
(not a hard requirement — see the composability note below):
`mini` = mark · title · tier-switcher · minimal menu; `basic` adds the
language + About menu; `normal` adds the compass, magic labelers and
tier badge; `advanced` adds the magic-mode header variant and app
toggle. nano (0) carries no topbar (bare seed); super/mega inherit
advanced's topbar plus their backend affordances.

**Menu trigger (§13.7.13, canonical).** The dropdown menu opens on
**click of the logo (`mark-link`) or the title (`title-label`)** — both
are `for="d-menu"`; the `mark-link` is a `<label>`, not a reload `<a>`.
There is **no ☰ hamburger**. A separate **⚙ `settings-btn`** (reusing the
old `.menu-btn` size/shape) toggles `#topbar-collapsed`, hiding every
non-brand topbar child — it *replaced* the ☰ `menu-btn`, but it collapses
the bar, it does **not** open the menu.

**Menu complexity levels (own scale — independent of the app's tier).**
Like the compass (§13.4), the menu has its *own* mini→super ladder,
chosen separately from the app's overall tier.

**Three canonical subsections — the same in EVERY menu tier.** A menu is
always organized into these three; higher levels add *content within*
them, never new top-level sections:

1. **App** — this app + you: **About · 🌐 Language ball · Profile**.
2. **Related Apps** — **3** related apps (from the family / close ones).
   **Every app carries this section** (Related is de-facto standard alongside
   the mandatory Main). Each related app is shown with its **real inlined
   mark** — the app's isotipo SVG, **not** an initial badge; a wordmark-only
   app (no isotipo, e.g. lowy) shows its wordmark scaled instead. These badge
   marks are a **mark-propagation surface** — see §13.7 *Mark propagation*.
3. **Flove** — the ecosystem: **About · Apps · Home**.

*(These correspond to the §13.7 Menu-sections taxonomy: App ≈ Main,
Related Apps ≈ Related, Flove ≈ Core. The Search row joins at
`menu-advanced`.)*

**What each level carries (structure constant, content grows):**

| menu level | App | Related Apps | Flove |
|---|---|---|---|
| **menu-mini** | About · Language · Profile | 3 related apps | About · Apps · Home |
| **menu-basic** | + a setting or two | 3 | (same) |
| **menu-normal** | + the app's own sub-views + basic settings | 3 (+ browse) | + community · blog |
| **menu-advanced** | + full system settings (sound · visibility · language) + a **Search** row | 3 (+ browse all) | + design system |
| **menu-super** | + backend: certify · publish targets · web-of-trust | 3 | (same) |

*(menu-mini's content is fixed by Marc as the baseline; the basic→super
additions above are the proposed growth — refine per element as needed.)*

> **Composable** (same rule as §13.4): an app sets its menu level à la
> carte — e.g. a `blogy-mini` may carry a **`menu-normal`**. The §13.5
> topbar table above shows the *typical* pairing per tier; the actual
> compass-level and menu-level are picked independently.

The **behaviours** of these controls are specified in §10 (canonical):
🪄 Magic preposition-remix — §10.6.3; header UX (logo-reload, filterable
categories, common + custom menu) — §10.8; six-button action bar — §10.6.
This subsection fixes *which controls appear at which tier*; §10 fixes
*how each behaves*.

### 13.6 · Onboarding paso-a-paso at first use

Every app must offer a step-by-step intro, **very visible the first
time** the user enters; available but discrete afterwards.
Implementation is free (overlay, modal, side panel, CSS-only tour) as
long as the "loud first time, ignorable after" contract is met.

Prefer CSS over JS. A `<details open>` collapsed after first dismiss,
or a `:has(#seen-intro:checked)` gate persisted via a CSS-only mechanism,
are valid pure-CSS approaches.

This is the only standard declared as **mandatory across the family**
(2026-05-07). All other §13 items are opt-in patterns.

**Reference instance — appy two-moment intro (2026-06-24).** appy applies
the contract at **two** moments, each *loud once → then permanently
re-openable from the **☰ menu*** — the standard slot, alongside About ·
Language · Theme (§13.5, §13.14). An app may add a second entry point, but the
menu is the canonical one:
- **`appy-mini`** (download first-landing): global changers shown loud, language
  first (`flove:lang`, §13.2); settles silent once a language is picked.
- **`appy-basic`** (upgrade landing, via `appyTransfer`): "features you reached"
  reveal + a permanent **Go home →** button (→ launcher `index.html`); loud once,
  gated by a one-time flag (`appy-basic-welcomed`).

The intros surface the **unified rainbow-card roadmap** — the §13.2 rainbow
cards merged with the diagonal (`2026-06-19-appy-five-apps-tier-ladders`).
**PRO reframed as the full-feature tier unlock — no longer a standalone
card (PRO ⟷ mini, §13.2); MyNet + Nety added.** Top-level colour cards, each carrying a
mini→super roadmap from the diagonal:
`Offline · Nety · Profile(←profily) · MyNet(←social) · MyWizy(←wizy) · Sety(←sety)`.
**Sety parents** the presentation/data sub-tree: `Sound · Random(→Counters, →Vizy) · Vizy`
(Vizy = shared capstone). **Sety activates at the `advanced` nav** (its children gate
advanced+; Vizy stays the `super` capstone). Locked rainbow cards stay **opacity-dimmed
and keep advertising their "upgrade Navigation" affordance** (not hidden; §13.8/§13.13).
This supersedes the standalone diagonal taxonomy for card UI.
Spec: `flove/docs/superpowers/specs/2026-06-24-appy-intros-rainbow-roadmap-design.md`.

### 13.7 · Canonical vocabulary → `frontend/vocabulary.md`

> Full spec moved to its own chapter, **`frontend/vocabulary.md`** (it outgrew this file). The `§13.7` label is unchanged.

### 13.8 · Counters → `frontend/counters.md`

> Full spec moved to its own chapter, **`frontend/counters.md`** (it outgrew this file). The `§13.8` label is unchanged.

### 13.9 · Summary panel → `frontend/summary.md`

> Full spec moved to its own chapter, **`frontend/summary.md`** (it outgrew this file). The `§13.9` label is unchanged.

### 13.10 · Nav-tab title — `<App> · FLOVE` (app favicon · app name · brand)

The browser tab reads, left to right: **the app's own favicon**, then
the **app name**, then the brand **FLOVE**. So the `<title>` (the nav-tab
label) is the **app name first**, a middle dot `·`, then `FLOVE`. The app
name is in its natural display case; `FLOVE` is uppercase. The leading
`✺` asterism is **not** part of the tab title — the app's SVG mark is the
favicon, and the brand mark lives in the flove-bar.

```html
<!-- canonical -->
<title>Goddy · FLOVE</title>

<!-- NOT -->
<title>FLOVE · GODDY</title>       <!-- old order — superseded 2026-07-18 -->
<title>✺ flove · Goddy</title>     <!-- older: asterism + wrong order -->
```

| Rule | Value |
|------|-------|
| Order | **app name → separator → brand** (app first) |
| Favicon | the **app's own** SVG mark = the tab icon (`<link rel="icon">`) |
| App token | app name in **display case** (e.g. `Goddy`, `Blogy`, `Keys`) |
| Separator | ` · ` (space · space, U+00B7 middle dot) |
| Brand token | `FLOVE` (uppercase), **last** |
| Leading glyph | none — no `✺` in the tab title |

This is **display text for the tab only**. It does NOT rename the app,
its files, the in-page `.flove-app-name`, or the lowercase brand used in
prose/`flove.css`. **Supersedes the earlier `FLOVE · <APP>` order
(2026-07-18).** Reference impl: `apps/goddy.html`.

### 13.11 · Surfaces — hardware · 2D · 3D · AR · VR

A flove frontend is described by **three orthogonal axes**. The same
flove element (the content/data — see §3) is one thing; how it is
presented is three independent choices:

| Axis | Question | Values |
|------|----------|--------|
| **tier** (§13.1) | *how many features?* | mini · basic · normal · advanced · super |
| **distro** | *which qualities/runtime?* | CSS-pure → JS (`flove.js`) → backend (super) |
| **surface** | *into which medium is it rendered?* | **hardware · 2D · 3D · AR · VR** |

`surface` is the new axis: it names the **medium** the content is
rendered into, the way `tier` names the feature count and `distro`
names the runtime qualities. The three compose — in principle any tier
can target any surface — but **2D is the baseline** every tier already
targets, and the richer surfaces grow up from `advanced`.

Do not confuse `surface` with the **Compass** (§13.4): the compass
re-*lays-out* the **same** medium (2D canonical vs. random vs. compact);
`surface` switches the **medium itself**. A surface switcher, when one
ships, is the natural big-sibling of the compass (same `compass-wrap`
popover pattern, one `disp-surface-<s>` radio per surface).

| Surface | Medium | flove approach | Status |
|---------|--------|----------------|--------|
| **hardware** | tangible — printed decks, cards, boards | export the element to a printable / foldable artifact for analog play; no screen | concept |
| **2D** | flat screen (HTML + CSS) | **the canonical surface** — single self-contained file, pure-CSS-first (§13 as a whole *is* the 2D standard) | shipping · reference |
| **3D** | in-browser 3D scene (WebGL) | Three.js / Babylon.js, glTF art; same element data, spatial layout | planned |
| **AR** | camera overlay (WebXR AR) | A-Frame / WebXR; the element anchored in real space | planned |
| **VR** | immersive headset (WebXR / OpenXR) | web: A-Frame / Three.js WebXR · native: Godot + Monado + godot-xr-tools; locomotion via arm-swing / walk-in-place | planned |

**Open-source-first (firm).** The non-2D surfaces follow the
free-as-in-freedom criterion: WebXR (A-Frame / Three.js / Babylon) for
browser 3D·AR·VR, Godot + Monado for native VR, glTF as the art bridge,
CC0 assets, libre hardware (Relativty / libsurvive / DIY ODT). The full
technology survey, incompatibilities and hardware notes live in the
context repo at **`research/vr_interfaces.md`**.

**blogy is the reference demo for this axis too.** As surfaces are
built they ship as blogy variants (e.g. `blogy-3d` / `blogy-ar` /
`blogy-vr`, and a printable `blogy-hardware`), the same way blogy is
the reference for the tier ladder. 2D blogy (`apps/blogy/*`) is the
shipping baseline; the rest are planned and grow from `advanced`.

**When to add a surface.** Only when the content genuinely gains from
the medium (spatial relations → 3D, situated overlay → AR, embodied
presence → VR, tactile/giftable → hardware). A flat list or form has no
reason to leave 2D — *slow it · flow it · love it* applies to surfaces
too: reach for the simplest medium that carries the meaning.

### 13.12 · Export & share contract → `frontend/export.md`

> Full spec moved to its own chapter, **`frontend/export.md`** (it outgrew this file). The `§13.12` label is unchanged.

### 13.13 · Locking — gate access to F0-mini files (method × trigger)

An **F0 package** is a set of self-contained HTML files the user already
holds on disk. **Locking** lets some of those files (or a whole subset)
require an unlock before they can be navigated: a gate panel sits at the
**top** of the file, the rest of the page is withheld below it, and the
file becomes navigable only once the gate opens. **Scope: the F0 minis**
(`mini` + `minifull`, §13.9) — locking is a mini-package capability, not
an advanced-tier one.

Locking has **two orthogonal axes** — pick one of each:

- **Method** = *how* the content is withheld (Low / Mid / High).
- **Trigger** = *what* opens the gate (a **pass**, or reaching a
  **threshold**). The trigger axis runs **parallel** to the method axis
  and is **fully independent** of it — either trigger may open any of
  Low / Mid / High.

> **Honesty rule.** Only **High** is real protection. Low and Mid are
> **deterrents** — the content is in the file the user holds, so
> view-source / devtools / disabling JS defeats them. Label them as
> "privacy by default", never as security. Do not imply a Low/Mid lock
> keeps a determined reader out.

**Axis 1 — Method (Low / Mid / High):**

| Level | Mechanism | Real protection? | Bypass |
|---|---|---|---|
| **Low** — hide-only | Content overlaid / blurred (`opacity:0`, `visibility:hidden`, or a covering panel); a pass field on top. The hide is **pure CSS**; any check is a thin JS compare (or none — purely a "are you sure" curtain). | ❌ deterrent only | view-source, or delete the overlay node |
| **Mid** — passphrase gate | JS checks an entered passphrase against a **stored hash** (never plaintext); content stays hidden until it matches, navigation is locked until then. The passphrase can come from anywhere the app likes — the **keys** app is just one *demo* of minting a memorable, shareable phrase; **the rule does not depend on it**. | ❌ stronger deterrent + real auth UX, but content is present in the file | view-source (content is gated, not encrypted) |
| **High** — encryption (Web Crypto) | Content shipped as **ciphertext** (AES-GCM; key derived from the passphrase via PBKDF2/Argon2). Without the pass there is literally nothing to read. **One passphrase can unlock a whole set** — derive one key and encrypt every file in the locked subset with it, or wrap a shared master key per file (package-level unlock). | ✅ genuine | none without the pass; **lose the pass = lose the content** — *unless* the user saved the optional **recovery phrase** (one-time mnemonic; added by the High demo add-on, below) |

**Axis 2 — Trigger (pass / threshold), parallel to method:**

| Trigger | Opens the gate when… | Works with |
|---|---|---|
| **Pass** | the user enters the correct passphrase (the keys-generated phrase for Mid; the decryption key for High). | Low / Mid / High |
| **Threshold** | a **counter / score** milestone is reached (§13.8 gated tier-pop — e.g. N stars/items), unlocking automatically. Same shape as appy's stars → `upgradeToFull` at 100⭐ (`appy-mini.html`). | **Low / Mid / High — freely**, independent of method. (Implementation note: at High the milestone releases the locally-held key — same crypto, key-on-device.) |

Pass and threshold can be combined (open by **either**) — the canonical
case below uses exactly that.

**Canonical use — `mini → minifull` progression.** The gate between a
`mini` and its `-full` variant is a lock: `minifull` (the fuller feature
set) stays withheld until the user **enters a pass** *or* **reaches a
threshold**. This unifies two existing patterns: the §13.8 counter-driven
*gated tier-pop* (threshold) and the appy `upgradeToFull`/`appyTransfer`
handoff (carry state across the unlock). The unlocked `minifull` re-derives
from the same local store (§13.9) — no data is lost across the gate.

**Worked flow — "generate once, crypt forever" (the recommended High path).**
This is the preferred shape when the upgrade unlocks a whole **set** of
files (e.g. the 7-app mini distro, hub = `appy-mini.html`). On the
**upgrade click**, instead of silently releasing an on-device key, the
gate asks the user to **own a passphrase**:

1. **Create or generate.** The user either types their own passphrase
   **or** taps *Generate* for a random one. **Each click of *Generate*
   yields a different password** (re-roll until one is liked — one shown
   at a time, *not* a list of many at once), with a **Copy** button to
   stash the current one.
2. **Enable.** An **Enable** button sits below the create/generate area.
   On click it **decrypts the rest of the files** in the set with that one
   passphrase (single-pass-for-a-set, `data-flove-lock-set`), then shows:
   > *"Enjoy more features from now. You can also change and use this
   > password for crypting all your files when you close your session."*
3. **One pass, both directions.** That same passphrase is the user's
   **crypter pass**: it decrypted the initial set **and** is reused to
   **(re-)encrypt all their files later** (e.g. on session close / leaving
   the device). Entered **once**; not re-prompted per file.
4. **Change it in account.** Account/settings carries a **"change apps
   crypter pass"** field — rotating it re-wraps the key / re-encrypts the
   set under the new passphrase.
5. **Crypt on exit.** The same account section carries a **"Crypt on
   exit"** button, captioned below:
   > *"Leave all encrypted when you close, add the password to decrypt
   > it."*
   When armed, the whole set is (re-)encrypted under the crypter pass on
   session close, so on the next open everything is ciphertext again until
   the pass is entered — closing the "generate once, crypt forever" loop.

**Why this is the best plan.** Because the secret is now **user-owned**
(typed or generated-then-copied), this is **genuine High** protection — it
fixes the honesty catch of a pure auto-unlock (where the key, shipping
on-device, protects nothing from the holder). The user holds the key; the
files at rest are real ciphertext.

**Minimum baseline — always reachable.** The pass-key strategy is present
in **every file anyway, as a minimum version**: absent a user passphrase,
a file still carries the on-device auto-unlock (key-on-device, Low/Mid
grade — deterrent, see the honesty rule). Setting/generating a user pass
**elevates that same hook to real High**. So locking degrades gracefully:
every file is at least minimally gated, and opts up to true encryption the
moment the user owns a pass — no file is ever left with *no* lock hook.

**Markup / vocabulary (the `flove-lock` pattern):**

| Class / hook | Role |
|---|---|
| `flove-lock`, `lock-gate` | The gate panel pinned at the top of a locked file; holds the pass field + the unlock affordance |
| `lock-level--low` / `--mid` / `--high` | Method marker on the gate (drives the CSS hide and which JS path runs) |
| `lock-veil` | The element that withholds the page below (`opacity`/`visibility`/cover) at Low; absent at High (content isn't even in the DOM until decrypted) |
| `lock-pass`, `lock-pass-hint` | Passphrase input + its caption (any source; keys app is only a demo) |
| `lock-pass-gen`, `lock-pass-copy` | *Generate* re-roll button (each click overwrites the field with a **different** random password — one at a time, not a list) + the **Copy** button for the current value |
| `lock-enable`, `data-flove-lock-enable` | The **Enable** button below create/generate — decrypts the set, then shows the "you can **also** change & reuse this pass for crypting on session close" note |
| `lock-threshold`, `lock-progress` | Optional threshold readout — how close the counter is to auto-unlock (§13.8) |
| `data-flove-lock="low\|mid\|high"` | Method hook — bound by the gate script |
| `data-flove-unlock="pass\|threshold\|either"` | Trigger hook — declares what opens this gate |
| `data-flove-lock-set="<id>"` | Marks files that share **one** passphrase/key (the single-pass-for-a-set, High) |
| `lock-crypter-pass`, `data-flove-crypter-pass` | The account/settings **"change apps crypter pass"** field — rotates the one passphrase that (de/re)crypts the whole set |
| `lock-crypt-exit`, `lock-crypt-exit-hint`, `data-flove-crypt-exit` | The account **"Crypt on exit"** button + its caption "Leave all encrypted when you close, add the password to decrypt it" — arms re-encryption of the whole set under the crypter pass on session close |

The F0 launcher/index marks locked entries (🔒) and, where a threshold
applies, may show progress toward the unlock.

**High demo add-on — `Enable login` (F0/F1, recovery + multiuser).** The
reference implementation of this **High** path ships as the optional
**private add-on** to F0/F1 — design spec
`docs/superpowers/specs/2026-06-25-flove-private-addon-login-encryption-design.md`
(flove repo). It is the one-button surface the simplification asks for
(`lock-enable` "Enable login" + `lock-crypt-exit` + `lock-crypter-pass`),
**pinned to appy's Privacy tab** (`#tab-privacy` / `switchTab('privacy')` in
`appy-mini`/`appy-basic`, today a hidden placeholder it un-hides + fills),
realised as **always-encrypted-at-rest content/data in
browser storage** (a static `.html` can't rewrite itself on close; the file is
a decrypting shell over an AES-GCM blob). Two refinements it adds to the model
above:

- **Optional recovery phrase.** On Enable the user is shown a one-time
  BIP39-style mnemonic that **independently wraps the data key**, so a
  forgotten crypter pass is survivable (set a new pass from the phrase). This
  relaxes "lose the pass = lose the content" **only when** the phrase was saved
  — itself a second secret to guard. The crypter pass derives a KEK that wraps a
  random data key, so *changing the pass only re-wraps the key* (no bulk
  re-encrypt).
- **Multiuser = copied folders.** A multiuser distro is **N copied whole
  folders**, each with its **own crypter pass + own encrypted data** (no in-app
  user picker — you open your folder). Since browser storage is **per-origin**,
  each copy carries a distinct **`distroId`**; the lock layer namespaces its
  ciphertext by it and derives the key only from that copy's pass, so copies in
  the same browser stay mutually unreadable. *Pack mechanics (copy count,
  generation, labelling) are a deferred follow-up spec.*

**keys app = implementation demo only.** The locking rule is
**self-contained and depends on no keys file.** `apps/puzzy/keys-advanced.html`
and its raw mode `keys-advanced-raw.html` are merely a *reference demo* of
one way to mint a passphrase — the triads/combinations the app builds
become a memorable, shareable phrase. Any app may generate or accept a
passphrase its own way; keys is an example, not a requirement. Net-new
there — no lock/crypto exists in those files yet.

**CSS-over-JS.** Low's hide is CSS (`opacity`/`visibility` + the §6 a11y
rule: closed gate is `inert`/`visibility:hidden` so withheld content
leaves the a11y tree). Mid (hash check) and High (Web Crypto) **require
JS** — a justified exception (§3): a secret check and decryption cannot be
expressed in CSS. All of it stays **inline, single-file, offline / `file://`**
(no external module), consistent with §13.9's inline-is-the-rule.

**Cross-refs:** §13.1 (tiers + `-raw` mode), §13.8 (counters → gated
tier-pop = the threshold trigger), §13.9 (F0 minis, local store, the
`-one`/`minifull` naming), §10.5 (shared origin — a lock guards only its
own file's view, never other apps' data), §13.12 (a High-locked file
**exports as ciphertext** until decrypted).

### 13.14 · Contrast · theme switcher — `flove:theme` (2026-07-18)

A standard **light ↔ dark appearance toggle**, offered as a settings item
in the menu (the ◐ control, alongside language + About, §13.5/§13.7). It
mirrors the language switcher (§13.2): an **OS-aware default** plus a
manual override, persisted under **one shared, app-agnostic key** so the
choice carries across the whole family.

**Mechanism (CSS-first — JS only for the click + persistence, §3):**

1. **Palettes in CSS.** Ship a light `:root` palette as the base, and a
   dark palette under `@media (prefers-color-scheme: dark)` — so with no
   choice made, the app **follows the OS**.
2. **Manual override.** `:root[data-theme="light"]` and
   `:root[data-theme="dark"]` force a theme regardless of the OS.
3. **The control.** A ◐ button (`aria-label="Toggle theme"`). On click,
   read the **effective** current theme — `data-theme` if set, else the
   media-query result — and flip to the opposite:

   ```js
   const KEY = 'flove:theme';                       // shared, family-wide
   const saved = localStorage.getItem(KEY);
   if (saved) document.documentElement.dataset.theme = saved;   // on load
   btn.onclick = () => {
     const cur = document.documentElement.dataset.theme
       || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
     const next = cur === 'dark' ? 'light' : 'dark';
     document.documentElement.dataset.theme = next;
     localStorage.setItem(KEY, next);
     // if the page advertises one, keep <meta name="theme-color"> in sync
   };
   ```

4. **Persistence.** Shared key **`flove:theme`** in `localStorage`
   (`light` | `dark`; **unset = follow OS**) — the exact parallel of
   `flove:lang` (§13.2), so setting the theme in one app carries to the
   next. Do **not** namespace it per app.

| Rule | Value |
|------|-------|
| States | **light ↔ dark** (2-state); unset = **auto / OS** |
| Default | `@media (prefers-color-scheme: dark)` — respects the OS |
| Override | `:root[data-theme="light" \| "dark"]` |
| Control | ◐ button, menu/settings item (with language + About) |
| Key | **`flove:theme`** (shared, family-wide — like `flove:lang`) |
| theme-color | update `<meta name="theme-color">` on toggle if present |

Each app supplies its **own two palettes** (its light look and its dark
look — e.g. psicosocial's *night/dawn* is that app's flavor of dark/light).
The switcher is the shared mechanism; the palettes are the app's own.
**Reference impl:** `apps/economy/lowy.html`. Roll-out is app-by-app
(harmonize any existing per-app theme key to `flove:theme`).

### 13.15 · Publish to Appy → `frontend/publish.md`

> The app → Appy profile bridge (`flove-appy.js`): the WRITER trio
> (script + `window.floveSummary` + `data-flove-publish` buttons), the READER
> contract, the modes (appy · wizy · more), the honest `localStorage` limits and
> the manual-upload fallback, plus tiers & scalability. Full spec in
> **`frontend/publish.md`**.

---

## 14 · Frontend adoption checklist → `adoption.md`

The per-app adoption table (the frontend roadmap — which app has adopted which
standard) is a **living table**, so it lives on its own in **`adoption.md`**.

---

## Regions

A flove frontend is partitioned into **regions**. The top level is the
*presentation context*; each context is itself structured into the same four
sub-regions.

**Contexts (top-level regions):**

| Context | What it is |
|---------|------------|
| **Normal** | the base in-page flow (the document itself) |
| **ModalSoft** | a *soft* overlay — dismissible (outside-click / Esc), non-blocking: popovers, menus, light sheets |
| **ModalHard** | a *hard* dialog — blocking; the backdrop catches clicks; the user must act or cancel |

**Sub-regions (inside each context):**

| Sub-region | What it holds |
|------------|---------------|
| **Topbar** | sticky identity / nav strip (mark, title, tier-pop, ☰ menu, compass…) |
| **Middle** | the main content area (entry, stepper, summary…) |
| **Footer** | bottom strip (stepper nav, action bar, badges…) |
| **Modal** | the slot where this context raises an overlay |

The **Modal** sub-region is recursive: a `Normal` page raises a `ModalSoft` or
`ModalHard` into its Modal slot, and that modal in turn has its own
Topbar / Middle / Footer / Modal. Regions are *where* an element lives; pair this
with Elements (below, *what* it is).

---

## Elements

The component families a region is built from — grounded in the canonical
vocabulary (§13.7) and the real blogy components. Categories and their sub-classes:

| Category | Elements (class families) |
|----------|---------------------------|
| **Identity** | `flove-mark` / favicon · `flove-bar` / topbar · `title` · tier badge |
| **Navigation** | `tier-pop` / `level-pop` · `step-` (stepper) · `compass-` · `menu-` |
| **Input** | `entry-` (field / textarea) · `labeler-` (personality switch) · `wizard-` / `wizardry-` (content suggester) · `rate-` (rater) · `field-fab` (mic / file) |
| **Feedback** | `counter-` / counters · `summary` panel · insights · `splash`/`bubble` · toast |
| **Action** | action bar (copy · share · magic · insight · publish · format) · `add-` / Add |
| **Overlay** | `modal-` · `act-pop` / popover · forms-in-iframe (`newlabeler` · `newwizard` · `newlanguage` · `newsound`) |
| **State** | `.ctl` hidden inputs + `body:has(#x:checked)` (the pure-CSS state machine) |

Each element declares which **region** (above) it sits in and carries a canonical
prefix (§13.7); specialise with `--<variant>`, never a synonym.

---

## Implementation conventions (from the code)

Concrete patterns the blogy code establishes, beyond the catalogue:

- **State machine = `.ctl` + `:has()`.** Hidden `<input>` (checkbox/radio)
  `class="ctl"` toggled by a `<label for>`; layout reacts via
  `body:has(#x:checked) …`. `.ctl` MUST be **`position: fixed`** (1×1, top-left) —
  *not* `absolute` — so focusing a hidden input via its label never scroll-jumps the
  page.
- **CSS-variable-driven labelers.** Each labeler (personality) is a
  `body:has(#labeler-X:checked){ --labeler-logo:…; --labeler-title:…; … }` block
  (40+ overridable `--labeler-*` vars). Adding a labeler = one radio + one block,
  zero JS.
- **"Bare" components.** Topbar toggles / labeler chips are transparent by default
  (no bg, no border); the accent fill appears only on activation. The glyph reads
  full-size and clear at rest.
- **Tokens scale with tier.** mini/basic use flat values; advanced adds explicit
  stacking tokens (`--z-overlay/-topbar/-dropdown/-subdrop`) and panel tokens
  (`--panel-blur`, `--fill-pressed`, `--grad-active`, `--btn-trans`).
- **Favicon** = inline SVG data-URI of the app mark (24×24 for light tiers, 32×32 for
  advanced); never external `<use>`.
- **Reduced motion** = `@media (prefers-reduced-motion: reduce)` in every file;
  advanced tiers *also* gate JS animations with `matchMedia('(prefers-reduced-motion:
  reduce)').matches`.
- **Mic FAB offset** (normal+): `.field-fab{ bottom: -31px; left: 50%;
  transform: translateX(-50%) }` centres a 32px button on the field's bottom border.

---

## Known inconsistencies / migration debt

Real today — blogy is mid-migration; these are the gaps to close (canonical → keep):

- **i18n prefix:** `.l-en`/`.l-es` (mini·basic·normal) vs `.t-en`/`.t-es` (advanced).
  → unify on **`.t-*`**.
- **Radio group names:** `name="labeler"`/`"wizard"` (light tiers) vs
  `"topbar-labeler"`/`"wizardry-pick"` (advanced). → unify.
- **Vocab drift across tiers:** `r-lovely` (mini) → `ray-formal` (basic/normal) →
  `labeler-formal` (advanced). Canonical is **`labeler-*`** (§13.7); `ray-*`/`bot-*`
  are the old vocabulary.
- Some advanced **code comments** still say "RAY"/"BOT" as locked terms while the
  classes use `labeler-`/`wizard-` — comments lag the rename.

---

*Source of truth for the flove frontend. Contract: `contract.md`. Map:
`overview.md`. §13/§14 promoted here from `backend.md` on 2026-07-20. ✺*
