# Keys — intro carousel & summary enhancements

**File:** `apps/puzzy/keys.html` (single file; all CSS/JS inline, following existing sections)
**Date:** 2026-06-15

## Goal

Enrich the Keys intro slider with per-slide "See more" chips and click-to-advance,
add a Customize→Start time stat, gate the Normal box behind a pass-code field, and
turn the summary favourite keys into outbound app links.

## Features

### 1. "See more" button on every slide (4 slides)
- A `See more` button sits **below the slider track**, hidden on load.
- When a slide becomes active, its button **appears 5s later, fading in over 3s**.
- Clicking it spawns a batch of **chips that float upward and drift randomly**, each
  carrying a short text; chips self-remove after their animation. **Every click**
  spawns a fresh batch.
- Respects `prefers-reduced-motion` (chips appear/stack without motion).
- Per-slide chip themes (draft copy — user to edit):
  - **Slide 1 — playing in pairs (groups of 2):** "Two minds, one key" · "Pairs spark
    dialogue" · "A partner sees what you miss" · "Agree the order together" · "Twice
    the meaning"
  - **Slide 2 — the game itself:** "Move keys up & down" · "Three words, one whole" ·
    "Order them your way" · "No wrong answers" · "Reorder = reframe"
  - **Slide 3 — take it seriously:** "You play this once" · "Take it seriously" ·
    "Build real networks after" · "Authenticity invites others" · "The more true, the
    more inviting"
  - **Slide 4 — last hint (boxes/links to simpler apps, styled like the chips):**
    "Lighter? Bubbles →" · "Just play → Puzzy" · "Casual → Astry" · "No pressure →
    Realy" — each is a clickable link.

### 2. Click-anywhere advances the slide
- Clicking a slide's background advances **left→right into the next slide** (reuses
  `gotoSlide(introSlide + 1)`).
- Excluded (stopPropagation): See-more button, chips, dots, arrows, Start, Customize
  and its panel. Last slide does nothing on background click.

### 3. Customize→Start time stat
- Record ms from the **first Customize-button click** to the **Start click**
  (`custT0` / `custMs`); if Customize was never opened, omit the sub-line.
- Render as a **sub-line under the existing "intro" time stat, below the tables** in
  the summary general-stats block.

### 4. Normal box → pass-code field
- Clicking the **Normal** box (`#chooser-step1`) reveals, centered below it, a
  **4-letter text field**, no label, inline placeholder `hm..`.
- Typing **`keys`** (case-insensitive) jumps straight to the Normal first-stage step
  (same path as `#normal-go`, bypassing the master-lock).
- Only the Normal box gets this for now.

### 5. Info icon by the field
- An ⓘ icon next to the field; clicking toggles a small hover/tooltip:
  *"Enter Pass Code for starting now (or finish Master mode to get one)."*

### 6. Summary favourite keys → outbound app links (`target="_blank"`)

Paths relative to `apps/puzzy/keys.html`:

| Key | Target | Key | Target |
|---|---|---|---|
| Love | `../lovy.html` | What | `index.html` |
| Joy | `../bubbles.html` | How | `../nety.html` |
| Wisdom | `sety.html` | Gift | `../economy/dealy/freed.html` |
| Ecologic(al) | `../economy/worthing.html` | Exchange | `../economy/dealy/rewardy.html` |
| Craft | `../economy/crafty.html` | Share-lend (Lend) | `../economy/dealy/shary.html` |
| Offer | `../economy/dealy/` | Why | `../metas/souls.html` |
| Personal | `../profily.html` | Local | `../trusty/parenty.html` |
| Social | `../trusty/trusty.html` | | |

## Implementation notes
- Chips: one absolutely-positioned overlay per slider; CSS keyframe float-up; random
  drift derived from chip index + click counter (no `Math.random`).
- Reuse existing panda/idle and `state.t0`/`introMs` timing patterns.
- No new files.

## Out of scope
- Pass-code fields on Adventure/Creative/Master boxes (Normal only for now).
- Real pass-code issuance from finishing Master (tooltip text only).
