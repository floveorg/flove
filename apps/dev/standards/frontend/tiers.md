# ✺ flove · Tier model — §13.1

Part of the flove frontend standards catalogue. Index / matrix: `../README.md` · contract: `../contract.md` · back to the catalogue: `../frontend.md`.

---

### 13.1 · Tier model — 7 levels per app

> **Not the maturity scale.** This *tier model* counts an app's **features**
> (`nano · mini · basic · normal · advanced · super · mega`). It is NOT the
> per-tree **maturity scale** in `../coordinates.md` §A.3 (`nano · mini · basic ·
> pro · rich · lib · framework · suite · platform · standard`) — they share the
> first three names by coincidence; different axes.

> **File naming standard — `app-tier-mode` (2026-06-23).** Every build is
> a file `**<app>-<tier>[-<mode>].html**`, hyphen-separated:
> - **tier** (horizontal stepper): `nano · mini · basic · normal · advanced
>   · super · mega`.
> - **mode** (vertical variant under each step, optional — **modes can
>   stack / accumulate**: a build may carry more than one quality, e.g.
>   pure-CSS *and* fuller):
>   - *(none)* = the default build of that tier;
>   - **`-css`** = **0-JS / pure-CSS** version;
>   - **`-one`** = self-contained, all JS inlined;
>   - **`-raw`** = **raw / stripped-and-unstyled** — the bared build:
>     native controls, no chrome, decorative features removed, minimized
>     JS, clean semantic skeleton (full spec below the variants table);
>   - **`-full`** = the **all-apps** build of that tier — the same tier
>     spanning the *whole app constellation* (the local profile build),
>     e.g. `mini-full` = mini across all apps. *(Matches the appy profiles
>     `miniappy`/`minifull`, §11.4 — not "more elements of one app".)*
>
> So `blogy-advanced-css` (0-JS), `blogy-advanced-one`, `keys-mini-css`,
> `keys-advanced-raw`. **Single-file apps with no tier in the name default
> to `-advanced`** (`goddy-advanced.html`, `keys-advanced.html`). Support /
> aux pages (logos, brand, help…) are **not** tiered. Roadmap tie-in:
> **F0 = `mini` + `minifull`**, **F1 = `basic`** (§9). Migration is
> app-by-app; **blogy is done** (the reference). Older filenames
> (`<app>mini.html`, `<app>advanced-css.html`, …) are superseded by this.

A flove app may ship in up to **seven tiers**, numbered 0–6, each as a
separate file. The middle five (mini · basic · normal · advanced · super)
are the canonical tier-pop nav; **nano (0)** and **mega (6)** are reserved
endpoints of the ladder — *defined as standards but not featured yet* (no
files, not shown in the nav until authored).

The tiers are a **complexity ladder — how MUCH the app does** (quantity of
functionality / navigation complexity): nano almost nothing, mini a little,
basic a bit more, normal more, advanced more, super/mega the most.

**The tier is independent of implementation.** Whether a build uses JS or
not, embedded or external, is the orthogonal **mode/variant** axis (`-css`,
`-one`, …) — *not* the tier. So "mini" is **not** "the CSS one"; mini is
"the small-functionality one", which may or may not use JS. The JS budget
per tier is deliberately left **open**. *(This supersedes the older "mini =
pure CSS / advanced = JS app" framing — that was conflating tier with mode.)*

**A tier ladder can express three different things** — not only "more
features of the same app":

1. **More functionality, same app** — the classic ladder. Reference:
   **blogy**, a small app that doubles as the worked example of how to
   bring tiered navigation-complexity to other small apps.
2. **Access & conditional permissions** — higher tiers unlock more access /
   gated permissions. Reference: **appy** — the canonical standard for
   high access + conditional permissions.
3. **Different interactions / sub-applications** — a "mother" app offers
   *different* sub-apps per tier, not merely more features of one app.
   Reference: **puzzy**.

(Reorganized 2026-06-01 — see the dated note below; previously `normal`
held the fully-featured app.)

| # | Tier | File suffix | Typical build* | Complexity / status |
|---|------|-------------|--------|---------------------|
| 0 | **nano** | `<app>-nano.html` | CSS-pure | Below mini — the absolute minimal seed (one field + one result, no chrome). **Reserved · not featured yet.** |
| 1 | **mini** | `<app>-mini.html` | CSS-pure | Smallest functional unit; short IDs (`#m`, `#info`). |
| 2 | **basic** | `<app>-basic.html` | CSS-pure | **Simple-complexity standard.** Topbar (mark + title + tier-switcher + menu via logo/title, §13.7.13), a small menu (language + About — *e.g. the "basic" menu*), one entry field + Add, and a static summary + Copy. No compass, labelers, stepper, charts or modals. The plainest reference frontend. |
| 3 | **normal** | `<app>-normal.html` | CSS-pure | **Medium-complexity standard.** Adds compass (3 layouts), magic labelers (3), a tier badge, a 3-step stepper + node nav, a ✦ wizard suggester + ★ rater, a summary with magic-phrase swap + Bars chart, and one modal (New labeler). Still pure CSS. |
| 4 | **advanced** | `<app>-advanced.html` | JS distro · loads `../flove.js` externally | **The fully-featured app** (was the canonical Normal until 2026-06-01). Sub-wizard fan-out, All toggle, full 6-step stepper, insight cycle, 4 chart views, save/share/publish, F2+ pre-publish hooks. New features land here first. |
| 5 | **super** | `<app>-super.html` | JS distro + backend | Advanced + F2+ Publisher hooks + web-of-trust wizards. Currently an in-development placeholder. |
| 6 | **mega** | `<app>-mega.html` | JS distro + backend | Beyond super — the maximal / orchestrated build (multi-instance, full backend). **Reserved · not featured yet.** |

*\* "Typical build" is the build these tiers have **usually** shipped in —
NOT part of the tier definition. The tier is the functionality level; the
build (CSS / JS / embedded) is the orthogonal mode/variant axis (any tier
can ship in any mode).*

**Variants outside the canonical 5-tier nav** (reach via direct URL or
the tier-pop, not shown as their own node):

| Variant | File | What it is |
|---------|------|------------|
| **advanced-css** | `<app>-advanced-css.html` | The *pure-CSS, single-file* variant of Advanced — fully featured in HTML&CSS only, no JS, no external files. Was `<app>basic.html` until the 2026-06-01 reorganization. |
| **advanced-one** | `<app>-advanced-one.html` | The *self-contained / one-file* variant of Advanced — all JavaScript inlined, zero external dependencies. Was `<app>normal-one.html` until the 2026-06-01 reorganization. |
| **`-full`** | `<app>-<tier>-full.html` | The **all-apps / whole-constellation** build of a tier — the same tier spanning *every* app (the local *profile* build), e.g. `mini-full` = **minifull** = mini across all apps. Matches the appy profiles (`miniappy`/`minifull`, §11.4). *(Supersedes the earlier "more elements of one app" reading.)* |
| **`-raw`** | `<app>-<tier>-raw.html` | The **bared** build of a tier — *stripped **and** unstyled*, closest to the raw material: native controls, no chrome, decorative features removed, minimized JS, clean semantic skeleton. Reference: `keys-advanced-raw`. **Full per-axis spec directly below this table.** |

**Two axes — how to read tiers + variants.** The **tiers** (`mini · basic ·
normal · advanced · super`) are the **horizontal** axis: the tier-pop
stepper. The **variants** (`-full · -raw · -one · -css`) are the
**vertical** axis: shown stacked *under each step* of that horizontal
stepper, never as their own step. So a cell in the grid is *(tier ×
variant)* — e.g. `mini × -full` = `minifull`, `advanced × -one` =
`advanced-one`.

#### The `-raw` mode — per-axis spec (polished 2026-07-18)

**`-raw` = closest to the raw material: both *stripped* and *unstyled*.**
A raw build bares its tier down to the functional core plus a clean
semantic document, removing all decoration and chrome. It is *not* a
smaller tier (that's the horizontal axis) and *not* the pure-CSS variant
(`-css` is fully styled + featured, just 0-JS). Raw's positive identity is
the **reference contract** — the semantic skeleton you could hand to
another platform to re-implement (ties to the CSS-pura / portable-spec
distro). Reference instance: `keys-advanced-raw`; the spec is written
app-agnostically so any `<app>-<tier>-raw` follows it.

| Axis | `-raw` position |
|------|-----------------|
| **Styling** | Native browser controls, no design system; only a readability-minimum of CSS (max-width, line-height). Unstyled by intent. |
| **Chrome / nav** | **Dropped** — no tier stepper bar, no menu, no compass, no topbar. |
| **Features** | Drop **charts, the insight cycle, and the magic buttons (✦** labelers / wizard suggesters). Keep the functional core: the **stepper**, the **★ rater**, and **favourites** — in each app's own favourite-related form (keys' *combos* is the reference instance; other apps carry their analogue). |
| **JavaScript** | **Kept but minimized/terse** — the same rawness applied to the script as to the HTML/CSS: only the essential compute plus the kept features, no ornament. |
| **Export** | Keep **`.md · .csv · .json · .html`** (drop `.xml` and `.jpg`). **No rendered summary section** — the collected field data serializes straight to those files. |
| **i18n** | Bilingual EN/ES **content stays** (flove apps are multilingual), but the switcher is a **native control**, not the styled 🌐 worldball. |
| **Persistence** | **Unchanged** — `-raw` does not touch it; governed by the general persistence standards (F0 distro / §13.13), same as any build of that tier. |
| **Semantics** | The positive definition: headings, `<fieldset>`/`<legend>`, real `<label>`s, native inputs, correct document order. No `<div>`-for-styling, no ARIA theater. |

> **Roadmap tie-in (§9).** **F0** ships the **`mini` tier + its `-full`
> variant (`minifull`)** — the simplest, fully-local builds (persistence,
> offline). **F1** ships the **`basic` tier** + features (MyWizy local
> consult + punctual download). Later tiers (`normal`/`advanced`/`super`)
> ride the corporate / demo strands.

> **Pending · optimized `mini` → `-one` rename.** F0's summary, persistence
> and export JS is **inlined per app** — no external renderer file, so each
> app is a self-contained single file that ships and shares on its own
> (§13.9 distro). Today's single-file apps therefore already *are* the
> self-contained form. The plan: a future, more-optimized **`mini`** build
> will take the clean app name, at which point today's full single-file apps
> are renamed with the **`-one`** suffix to mark them as that self-contained
> variant. Until that work lands, the **optimized-`mini` app build is
> pending** and today's single-file apps stand in as the `-one` form.
> *(This pending item is the app **tier/build** rename — distinct from the
> **export** scale, where the `mini` rung = **JSON** is already settled
> (§13.12); the mini **export** is not "N/A".)* F0 itself reaches down to
> **`basic`** (not advanced-only) — see §13.12's tier rule.

`mini`, `basic` and `normal` form the simple→medium complexity showcase
and have *usually* shipped pure-CSS; `advanced` is the fully-featured app
and *usually* ships as the JS build loading `../flove.js`; `super` adds
F2+ Publisher backend hooks. **These are typical builds, not tier
requirements** — the build/mode is the orthogonal variant axis (a `mini`
may use JS, an `advanced-css` is pure-CSS).
**nano (0)** and **mega (6)** bookend the ladder as reserved standards —
nano is the CSS-pure sub-mini seed, mega the backend-orchestrated
super-plus — and are documented here but not yet authored or shown in
the nav.

> **Reorg note · 2026-06-01.** The complexity ladder was folded into
> the tier names. The old `basic` (pure-CSS full app) → `advanced-css`;
> the old `normal` (JS distro full app) → `advanced`; the old
> `normal-one` → `advanced-one`. Two new CSS-pure showcase tiers were
> authored: the simple-complexity standard → `basic`, and the
> medium-complexity standard → `normal`. `mini` and `super` unchanged.

**Tier navigation lives inside each tier file's own topbar** as a
"complexity bar" — a progress-bar-style popover triggered by the
`tier-pop-btn` in the topbar Buttons zone (§13.7). The popover lists
all 5 tier slots with **connecting lines between consecutive nodes**
(rendered via `::after` pseudo-element on each step except the last).
One `<a class="tier-pop-step">` per tier; `tier-pop-step--current` +
`aria-current="page"` marks the file's own tier; `tier-pop-step--wip`
marks any tier whose destination file is an in-development placeholder.

```html
<ul class="tier-pop-rays">
  <li><a class="tier-pop-step" href="<app>-mini.html">…Mini…</a></li>
  <li><a class="tier-pop-step tier-pop-step--current"
         href="<app>-basic.html" aria-current="page">…Basic…</a></li>
  <li><a class="tier-pop-step" href="<app>-normal.html">…Normal…</a></li>
  <li><a class="tier-pop-step" href="<app>-advanced.html">…Advanced…</a></li>
  <li><a class="tier-pop-step tier-pop-step--wip"
         href="<app>-super.html">…Super…</a></li>
</ul>
```

**Complexity-bar visual contract (canonical CSS, replicated in each
tier file):**

```css
/* Connecting lines between consecutive nodes */
.tier-pop-rays{ gap: 1.1rem; }
.tier-pop-step{ position: relative; z-index: 1; }
.tier-pop-step:not(:last-child)::after{
  content: ""; position: absolute;
  top: 9px; left: 100%;
  width: 1.1rem; height: 2px;
  background: var(--line-strong);
  z-index: 0;
}

/* Work-in-progress placeholders (advanced + super while empty): 40% */
.tier-pop-step--wip{ opacity: .4; }
.tier-pop-step--wip:hover, .tier-pop-step--wip:focus-visible{ opacity: .65; }
```

**WIP destination convention.** Clicking a `--wip` tier navigates to
the destination file (an empty placeholder page) which displays a
centered info-box: *"We are developing these features for the near
future."* with a link to `flove.org/development`. The destination
page also carries a minimal topbar back to the active tiers. See
`blogy-super.html` for the reference impl (since 2026-06-01 `super` is
the only WIP placeholder; `advanced` now ships real content).

A parallel `<app>tier.html` (the embedder) may exist that embeds the
filled tiers as iframes for side-by-side demo. It never duplicates
tier markup — only points at the tier files. WIP tiers are NOT
embedded (no iframe); the complexity bar in each embedded tier already
surfaces them.

**When to elevate:** an app gets tiered when there's a clear "let me
choose my complexity level" need. Small demos can ship single-tier.

Reference impl: `apps/blogy/blogy-{mini-css,basic-css,normal-css,advanced,super}.html`
plus the Advanced variants `blogy-advanced-css.html` (pure-CSS single
file) and `blogy-advanced-one.html` (self-contained, all JS inline).

#### Features across the Advanced forms (blogy, reorg 2026-06-01)

The fully-featured app ships in three forms that share **identical
visual markup** (same TOC §2.1–§2.15 in their `<style>` blocks; same
step/topbar/menu/entry HTML): `advanced-css` (pure CSS), `advanced-one`
(self-contained JS) and `advanced` (modular JS, loads `../flove.js`).
These were the old `basic` / `normal-one` / `normal` files before the
2026-06-01 reorg. (The new `basic` and `normal` tiers are separate,
lighter CSS-pure showcases — see §13.1.) What differs between the three
forms is *what's wired dynamically*. Reading the table:

- ✓ = present and functional
- ⊘ = present as markup but not driven (no JS to make it work)
- ✗ = not in this tier
- · = not yet implemented in blogy at all (planned)

> **Column note.** `advanced-css` is the file `blogy-advanced-css.html`
> (was `blogybasic.html` until the 2026-06-01 reorg). `advanced-one` is
> `blogy-advanced-one.html` (was `blogynormal-one.html`). `advanced` is
> `blogy-advanced.html` (was `blogynormal.html`). The new `basic` and
> `normal` tiers are different, lighter files — see §13.1.

**Markup / visual features (same across advanced-css, advanced-one, advanced):**

| Feature | advanced-css | advanced-one | advanced |
|---------|:---:|:---:|:---:|
| 6-step stepper navigation (`#step-0`…`#step-5`) | ✓ | ✓ | ✓ |
| Topbar (Brand + Buttons + Menu) — §13.7 | ✓ | ✓ | ✓ |
| Compass display-modes button + popover — §13.4 | ✓ | ✓ | ✓ |
| Magic preposition mode button + popover — §10.6.3 | ✓ | ✓ | ✓ |
| Tier-pop 5-level switcher — §13.1 | ✓ | ✓ | ✓ |
| Menu sections (Search · Main · Related · Core) — §13.7 | ✓ | ✓ | ✓ |
| Entry fields (4 modifiers: `--main`/`--alternative`/`--extra`/`--note`) — §13.7 | ✓ | ✓ | ✓ |
| Labeler perspective panels (with `labeler-sub`) — §13.1+§13.3 | ✓ | ✓ | ✓ |
| Wizard buttons (lovely · joy · wisdom + `wizard-arm--more`) | ✓ | ✓ | ✓ |
| Rater (4 emoji cells per entry, scoped main vs extra) | ✓ | ✓ | ✓ |
| Forms-in-iframe modals (newlabeler / newwizard / newlanguage / newsound) — §13.3 | ✓ | ✓ | ✓ |
| Onboarding intro overlay (`#intro-open` + `intro-*`) — §13.6 | ✓ | ✓ | ✓ |
| i18n dual-span swap (`.t-en` / `.t-es`) — §13.2 | ✓ | ✓ | ✓ |

**Dynamic behaviors (differ by tier):**

| Feature | advanced-css | advanced-one | advanced |
|---------|:---:|:---:|:---:|
| Live phrase block (`data-flove-phrase` updates on keystroke) | ⊘ no phrase block rendered | ✓ inline serializer | ✓ via `flove-phrase.js` (external) |
| Sound engine (clickable interactions emit sounds) | ⊘ markup only, no JS to fire | ✓ inline sound dispatcher | ✓ via shared `flove.js` |
| Save / Share / Publish action buttons | ⊘ buttons visible but no clipboard / Web Share wiring | ✓ wired inline (Clipboard + Web Share API) | ✓ via shell |
| `flove.wizard` helper (text injection into entry textareas) | ⊘ references in comments only | ✓ helper defined + 17 calls inline | ✓ delegated to shared `flove.js` (0 inline calls) |
| Magic preposition remix (button → rewrites phrase) | ⊘ button only | ✓ inline | ✓ via shell |
| Insight panel (AI provider call) — §10.6.4 | · | · | · planned (advanced first) |
| Format export menu — §10.6.6 | · | · | · planned (advanced first) |
| File-input auto-spawn after upload — §10.9 | ⊘ markup only | ⊘ partial | · |

**Loading model:**

| | advanced-css | advanced-one | advanced |
|--|:---:|:---:|:---:|
| `<script>` tags | 1 (empty placeholder) | 6 inline | 6 (incl. `<script src="../flove.js" defer>` external) |
| `addEventListener` count | 0 | 49 | 4 |
| Lines | ~7.5k | ~10.5k | ~7.7k |
| Self-contained? | yes (100% CSS) | yes (CSS + inline JS) | no (depends on shared `flove.js`) |

**How the three Advanced forms relate:**

- **advanced-css** is the *CSS-pure showcase*: pick this when you want
  a zero-JS, single-file, portable artefact. UI looks like blogy but
  doesn't *do* the dynamic things.
- **advanced-one** is the *self-contained reference variant*: pick this
  when you need full blogy behaviour in one file (CSS + inline JS),
  no external dependencies. Most lines, but standalone. Accessible
  only by direct URL (not in the canonical tier-pop nav).
- **advanced** is the *canonical modular form*: full blogy behaviour
  delegated to shared `flove.js`. Lower duplication across the family,
  smaller per-file footprint, but requires the external module to be
  available. **This is the recommended fully-featured build as of
  2026-06-01.**

**Advanced** is also where new features land first (Insight, Format
menu, F2+ Publisher hooks, web-of-trust wizard suggestions) before
being backported to the lighter `normal`/`basic` showcase tiers.
`super` adds backend hooks on top of advanced (F2+); `mini` is the
quick-glance variant with short IDs.
