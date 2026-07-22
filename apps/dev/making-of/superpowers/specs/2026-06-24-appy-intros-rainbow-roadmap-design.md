# appy — first-run intros + unified rainbow-card roadmap design

> **Status:** design (brainstorm output, 2026-06-24).
> **Implements:** `backend_plan.md` §13.6 (onboarding, *mandatory*) + §13.2 (i18n /
> `flove:lang` entrance picker), applied to the `appy` tier files.
> **Relates to / evolves:** `2026-06-19-appy-five-apps-tier-ladders-design.md` (the
> profily·social·sety·wizy·vizy *diagonal*, now merged into the rainbow cards below).
> **Touches:** `apps/appy/appy-mini.html`, `apps/appy/appy-basic.html`,
> `context/flove/backend_plan.md` (§13.2 + §13.6 notes).

---

## 1. Goal

Give `appy` a proper first-run experience that satisfies the §13.6 onboarding contract
("loud the first time, discrete afterwards") on **two** moments, and reconcile the
two competing feature-card taxonomies (the §13.2 rainbow cards vs the 2026-06-19 appy
diagonal) into **one** unified rainbow-card roadmap.

Two moments, one shared pattern — **loud once → then permanently re-openable from the nav:**

1. **Download → first landing = `appy-mini` intro.** First open shows the global
   changers (language first) + the rainbow feature roadmap, loud. Picking a language
   stores it and the intro goes quiet forever after; it stays reachable from appy's nav.
2. **Upgrade → landing = `appy-basic` intro.** Tapping "Upgrade to basic" still jumps
   to `appy-basic.html` (state via `appyTransfer`, unchanged). On arrival appy-basic
   greets the user with the features they just reached + a **"Go home →"** button; loud
   once, then reachable from appy-basic's nav.

## 2. Scope

**Build now (this spec → plan):**
- `appy-mini.html`: first-run **global-changer + intro** moment (language via `flove:lang`),
  loud once, with a permanent re-openable home in appy's nav.
- `appy-basic.html`: upgrade-arrival **intro** moment, loud once, carrying the **Go home →**
  button and a permanent re-openable home in appy-basic's nav.
- Migrate appy-mini's language storage from `translate2-lang` → **`flove:lang`** (+ honor a
  `?lang=<code>` URL handoff), per §13.2.

**Design / roadmap (captured here, built incrementally — NOT all built now):**
- The **unified rainbow-card model** (§5) — the card taxonomy + per-card mini→super roadmap.
- The **features-intro content** rendered inside appy-basic's intro is stubbed now and
  **filled in later** (explicitly deferred by the user).
- The **exact permanent nav location** of the re-openable intros / global changers is
  **user-decided later**; this spec marks it `TBD` and only requires that a permanent,
  discoverable entry exists.
  <!-- ↗ pendings:#DS04 -->

**Deliberate divergence from §13.2 (recorded):** §13.2 places the canonical entrance on the
launcher `index.html`. For the **appy download distribution** the first landing is
**`appy-mini` itself**, so appy-mini hosts the §13.2 entrance behaviour (language picker)
instead of `index.html`. The big launcher entrance on `index.html` (full rainbow row +
"Go play") remains a separate, out-of-scope item.

## 3. Current state (what the code does today)

- **Language:** appy-mini uses `.en`/`.es` spans + radios `#lang-en`/`#lang-es`; the
  translate2 IIFE (`appy-mini.html` ~L4737) persists the pick under `translate2-lang`,
  syncs `<html lang>`, and closes the `<details class="lang">` worldball (~L1974) on change.
  **No first-run loud behaviour exists yet.**
- **Upgrade:** `upgradeToBasic()` (~L3396) writes `localStorage['appyTransfer']` then
  `location.href = 'appy-basic.html'`. No arrival celebration on appy-basic.
- **Nav host for the permanent intro:** appy-mini already has a top-bar dropdown menu
  (`#top-dropdown`, `toggleTopMenu()`) whose "About" item (`#menu-about-btn` → `toggleAbout()`)
  opens an `#about-reveal` panel. This reveal-panel pattern is the natural host to reuse.
- **appy-basic** has its own tab-bar nav (Profile · Nety · MyNet · Chat · Activity · Extensions).

## 4. Intro framework (build now)

### 4.1 `appy-mini` — first-run global-changer + intro
- **Gate:** on load, read `flove:lang`. **Absent → first run.** Honor precedence
  `?lang=` URL > `flove:lang` > default. (URL handoff covers `file://` isolation.)
- **Loud once:** when first-run, the global changers are shown prominently in an intro —
  language first (🌐 worldball auto-opened + glow + "Choose your language · Elige tu idioma"
  nudge), alongside the rainbow feature roadmap (§5). It is the obvious first thing.
- **Settle:** the moment the user picks a language, write `flove:lang`, apply, and dismiss
  the loud state. The key now exists → **never loud again**.
- **Permanent home (decided 2026-06-24):** a new **"Account"** item, placed **first** in the
  top-bar dropdown menu (`#top-dropdown`, before "About"), opens an `#account-reveal` panel
  (mirrors the existing `about-reveal` pattern). The **language selector is the first item**
  inside that Account panel; the rainbow roadmap follows. This is the permanent home of the
  global changers after the loud first run.
- **Upgrade** never re-triggers the language loud state.

### 4.2 `appy-basic` — upgrade-arrival intro
- **Gate:** on load, if `appyTransfer` is present and a one-time flag (e.g.
  `appy-basic-welcomed`) is unset → just arrived via upgrade → play the loud reveal once,
  then set the flag.
- **Loud once:** a "welcome to basic" reveal highlighting the features just reached
  (basic-tier cards). The detailed features-intro **content is implemented later**; this
  spec only wires the loud-once → permanent-home framework + the Go-home button.
- **Go home →** (permanent): navigates to the flove landing — repo-root `index.html`
  (`../../index.html` from `apps/appy/`). Always available; also surfaced inside the loud reveal.
- **Permanent home (decided 2026-06-24):** same as appy-mini — an **"Account"** item first in
  `#top-dropdown` → `#account-reveal` panel, **language selector as its first item**, then the
  features intro / rainbow roadmap. The **Go home →** button also lives in that panel.

### 4.3 Shared mechanics
- Reuse the **`about-reveal` reveal-panel + top-bar-menu** pattern already in the files.
- Follow §13.6 "loud first time, discrete after"; prefer CSS over JS where it expresses it.
- Storage keys: **`flove:lang`** (shared, family-wide — replaces `translate2-lang` in appy-mini)
  + a per-file one-time flag for the loud gate (`appy-basic-welcomed`). No other new keys.
- a11y: collapsed-but-rendered intro panels stay out of the a11y tree (§6 of CLAUDE.md —
  `inert` for JS builds / `visibility:hidden` for CSS-pure).

## 5. Unified rainbow-card roadmap (design)

Merges the 2026-06-19 diagonal (`profily·social·sety·wizy·vizy`) **into** the §13.2 rainbow
cards. Each top-level card is a rainbow colour and carries a **mini→super roadmap** built
from the diagonal's per-tier features. **PRO is removed**; **MyNet and Nety are added.**

### 5.1 Top-level colour cards + nesting tree
```
🔴 Offline      local-first
🟠 Nety         resources — run a node, lend CPU/GPU/RAM
🟡 Profile      ← profily (identity)
🟢 MyNet        ← social (connections)
🔵 MyWizy       ← wizy (agents)
🟣 Sety         ← sety (data) — PARENT of the presentation/data sub-tree:
                  ├─ Sound
                  ├─ Random ─► Counters
                  │          └► Vizy
                  └─ Vizy            (shared capstone — direct child of Sety and of Random)
```

### 5.2 Per-card roadmap (mini → super)
| Card | Home tier | Roadmap |
|------|-----------|---------|
| **Offline** | mini | local store → larger resource quotas (normal) |
| **Nety** | mini | run a node, lend compute (mini) → priority relays & scheduling (advanced) |
| **Profile** | mini | profily-mini passport (mini) → editable full profily + apps-i-played (basic) → MyWizy-assisted compose (advanced) → stewardship / governance on profile (super) |
| **MyNet** | basic | follow/support, feed, circles, text chat (basic) → agent-augmented social + audio/video chat (advanced) |
| **MyWizy** | advanced | agents preview/seed, locked (mini) → one passive agent / summaries (basic) → full wizy sliders, bound to MyNet (advanced) → orchestration, steward others' MyWizy (super) |
| **Sety** | **advanced** | data management, relations / preferred raters, viz-shape seed; deeper trust config — **activates at advanced**; parents the sub-tree below |
| ↳ **Sound** | advanced | sound engine (under Sety, advanced+) |
| ↳ **Random** | advanced | compass shuffle / re-presentation views (under Sety, advanced+) |
| ↳ **Counters** | advanced | arcade-chip counters → complexity-bar unlocks (§13.8) |
| ↳ **Vizy** | super | first look List/Rainbow (basic teaser) → agent-driven 3D/4D / XR (advanced) → full vizy studio (super capstone) |

> **Sety gating (user, 2026-06-24):** Sety **activates at the `advanced` nav**, not normal.
> Because it parents the sub-tree, its children (Sound · Random · Counters) gate at
> **advanced+**; **Vizy** stays the **super** capstone reached via both Sety and Random.

**Locked-card behaviour (reaffirmed):** every rainbow card the user hasn't reached **stays
opacity-dimmed and keeps displaying its "upgrade your Navigation" affordance** — the card is
not hidden, it persistently advertises the upgrade (dimmed + inert, §13.8/§13.13). Clicking a
locked card reads "Earn more points for upgrading Navigation." Cards activate (full opacity,
interactive) only once their Navigation tier is reached.

## 6. Open items (deferred, not blocking the build)
- ~~Exact nav placement~~ → **decided 2026-06-24:** "Account" item first in `#top-dropdown`
  → `#account-reveal`, language selector first (both files).
- Full features-intro content inside appy-basic — **implemented later** (this plan extends
  appy-basic substantially but the deep per-feature intro copy is iterative).
- Whether the rainbow roadmap renders identically in both files or appy-basic shows a
  "reached" emphasis — resolve in the plan.

## 7. Backend_plan integration
- **§13.2** — add a note: appy download distribution lands first on `appy-mini` (not
  `index.html`); appy-mini hosts the entrance language picker; key is `flove:lang`.
- **§13.6** — add the appy two-moment intro as a reference instance of the onboarding
  contract (loud once → permanent re-openable nav home), for both appy-mini and appy-basic.
- Record the **unified rainbow-card model** (§5) as the canonical merge of the §13.2
  rainbow cards and the diagonal (supersedes the standalone diagonal taxonomy for card UI).
