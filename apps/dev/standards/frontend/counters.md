# ✺ flove · Counters — §13.8

Part of the flove frontend standards catalogue. Index / matrix: `../README.md` · contract: `../contract.md` · back to the catalogue: `../frontend.md`.

---

### 13.8 · Counters (floating arcade chips)

Three fixed bottom-left chips that track user engagement: **Clicks ·
Selections · Stars**. Hidden until each chip has ≥1 point; once a
chip would be a threshold gate (see §13.8 *Gated tier-pop*, upcoming),
its current value drives the gate.

**Markup (canonical):**

```html
<div class="float-counters" aria-live="polite">
  <div class="pc pc-clicks is-empty" id="chipClicks" title="Total clicks">
    <div class="pc-badge"><span class="pc-num" id="pointsClicks">0</span></div>
    <span class="pc-label">Clicks</span>
  </div>
  <div class="pc pc-sel is-empty" id="chipSelections" title="…">
    <div class="pc-badge"><span class="pc-num" id="pointsSelections">0</span></div>
    <span class="pc-label">Selections</span>
  </div>
  <div class="pc pc-stars is-empty" id="chipStars" title="…">
    <div class="pc-badge"><span class="pc-num" id="pointsStars">0</span></div>
    <span class="pc-label">Stars</span>
  </div>
</div>
```

**Vocabulary (`pc-*` family):**

| Class | Role |
|-------|------|
| `float-counters` | Fixed-position wrapper bottom-left, vertical flex |
| `pc` | One counter chip (clicks / sel / stars) |
| `pc.is-empty` | Hides the chip until it has ≥1 point |
| `pc.pulse` | Animation on increment (`ptPop` keyframes) |
| `pc-badge` | The shape (`clip-path` per type) with neutral fill + colour grow via `--col` custom prop |
| `pc-num` | The number text |
| `pc-label` | The lowercase label ("Clicks" / "Selections" / "Stars") |
| `pc-clicks` · `pc-sel` · `pc-stars` | Per-counter modifier — drives shape & colour |

Shapes (clip-path): clicks = dodecagon, selections = triangle,
stars = 5-pointed star. Colour fills (orange / orange / gold) grow
linearly with the count, saturating at the chip's growth-max.

**Canonical default saturation (Marc 2026-05-23):**

| Counter | Growth-max |
|---------|------------|
| Clicks | **100** |
| Selections | **100** |
| Stars | **5** |

These are the defaults all flove apps inherit. Apps may override per
chip if their UX needs different thresholds, but the defaults above
are the canonical reference (used by `blogy-advanced.html` via
`apps/flove.js` and by `blogy-advanced-one.html` inline).

**Counting rules (declared by Marc 2026-05-23):**

| Counter | Rule |
|---------|------|
| **Clicks** | +1 on every click anywhere in the page (cumulative). |
| **Selections** | Live count of the currently-checked: hearts (`#rater-show-*`) + emojis (`name^="rate-"`) + labelers (`name="topbar-labeler"` non-none) + wizards (`name^="wizard-choice-"` non-none) + non-empty textareas. |
| **Stars** | Live count of non-empty textareas (whether typed by the user OR injected by a wizard). |

**JS module — `window.flove.counters`:**

| Member | Use |
|--------|-----|
| `refresh()` | Recompute and repaint all three chips |
| `clicks` (getter) | Cumulative click count |
| `selections` (getter) | Live selection count |
| `stars` (getter) | Live star count |
| `addClick()` | Manual hook to bump the click counter (e.g. for synthetic events) |

**Distro:**

- **blogy-advanced (modular)** — loads the module from `apps/flove.js`
  (appended 2026-05-23). No inline script needed.
- **blogy-advanced-one (self-contained)** — same code inlined inside a
  `<script>` block before `</body>`.
- **Other tiers (mini / basic / advanced placeholder / super
  placeholder)** — do not yet include counters; add the markup + CSS
  block + (for non-modular tiers) the inline JS to enable.

Reference impl: tail of `apps/flove.js` (module) and tail of
`apps/blogy/blogy-advanced-one.html` (inline copy).

**Collapse + timer toggles (Marc 2026-05-28):**

Two ~26 px round chips wrap the counter stack — both sit inside
`.float-counters` and share the badge palette (`#dcd5d5` neutral, accent
ink). They MUST be ~40 % smaller than the Clicks badge so they read as
satellites, not peers.

```html
<div class="float-counters" aria-live="polite">
  <div class="pc-advance-text" id="advanceText" hidden>…</div>
  <button class="pc-toggle pc-collapse" id="countersCollapse">−</button>
  <div class="pc pc-clicks …">…</div>
  <div class="pc pc-sel …">…</div>
  <div class="pc pc-stars …">…</div>
  <button class="pc-toggle pc-timer-toggle" id="timerToggle" aria-pressed="false">+</button>
  <div class="pc-timer" id="pcTimer" aria-live="polite">
    <div class="pc-timer__row"><span>Total</span><b id="timerTotal">0s</b></div>
    <div class="pc-timer__row"><span>Clicks</span><b id="timerClicks">0</b></div>
    <div class="pc-timer__row"><span>Avg gap</span><b id="timerAvg">—</b></div>
    <div class="pc-timer__row"><span>Last</span><b id="timerLast">—</b></div>
  </div>
  <button class="pc-toggle pc-expand" id="countersExpand">+</button>
</div>
```

| Class | Role |
|-------|------|
| `pc-toggle` | Base round 26 px chip (shared by collapse / timer / expand) |
| `pc-collapse` | "−" above the stack — adds `is-collapsed` to `.float-counters` |
| `pc-timer-toggle` | "+" below the stack — adds `is-on` to `#pcTimer`, flips its glyph to "−" |
| `pc-expand` | "+" shown only when `.float-counters.is-collapsed` — restores default state |
| `pc-timer` / `pc-timer__row` | Timer panel + its label/value rows |

Behaviour rules:

- **Collapse** (`pc-collapse` → `.is-collapsed`): hides the chips, the
  unlock text, the timer panel, and both `pc-collapse` / `pc-timer-toggle`
  themselves; leaves only `pc-expand`. Collapsing also force-hides the
  timer panel (do not preserve `is-on` across collapse).
- **Timer** (`pc-timer-toggle` → `pc-timer.is-on`): souls-style event
  log (each document click pushes `Date.now()` into a soft-capped 500-
  entry array). Rows: **Total** (`now − first`), **Clicks** (count),
  **Avg gap** (mean Δ between consecutive events, `—` until ≥ 2 events),
  **Last** (`now − last`). Tick `renderTimer` once per second while the
  panel is open; clear the interval when closed/collapsed. Duration
  format = the souls `fmtDuration` (sub-10 s shows `1.4s`, then `s` /
  `m s` / `h m`).
- **Click counting**: the toggle clicks DO count toward the page's
  cumulative `Clicks` counter (no `stopPropagation` on the buttons —
  consistent with "any click anywhere on the page").

Reference impl: `apps/blogy/blogy-advanced.html` and `apps/blogy/blogy-advanced-one.html`
(inline copies, identical block). When `apps/flove.js` grows a
`window.flove.timer` module, both inline copies should collapse to a
call into it.

#### Gated tier-pop — counters drive complexity-bar unlocks (nested under Counters)

WIP nodes in the complexity bar (`tier-pop-step--wip`, currently
advanced + super — see §13.1) are **non-clickable by default**.
`flove.counters` checks unlock thresholds on every refresh; when a
node's thresholds are met it gains `.is-unlocked` and becomes clickable
with a reddish aura.

**Default thresholds (Marc 2026-05-23):**

| Tier | clicks ≥ | selections ≥ | stars ≥ |
|------|---------:|-------------:|--------:|
| advanced | 20 | 10 | 2 |
| super | (locked indefinitely until spec'd) | | |

Apps may override per-tier thresholds by editing the `UNLOCK` map at
the top of the counters module.

**CSS contract (canonical, all 4 active tier files):**

```css
.tier-pop-step--wip{
  opacity: .4;
  pointer-events: none;
  cursor: default;
}
.tier-pop-step--wip.is-unlocked{
  opacity: .85;
  pointer-events: auto;
  cursor: pointer;
  border-radius: 12px;
  animation: tier-pop-step-aura 2.2s ease-in-out infinite;
}
.tier-pop-step--wip.is-unlocked:hover,
.tier-pop-step--wip.is-unlocked:focus-visible{ opacity: 1; }
.tier-pop-step--wip.is-unlocked .tier-pop-node{
  background: var(--accent);
  border-color: var(--accent-deep);
}
.tier-pop-step--wip.is-unlocked .tier-pop-label{
  color: var(--accent-deep);
  font-weight: 700;
}
@keyframes tier-pop-step-aura{
  0%, 100%{ box-shadow: 0 0 8px 2px rgba(var(--accent-rgb), .35); }
  50%{ box-shadow: 0 0 14px 5px rgba(var(--accent-rgb), .55); }
}
```

**Level-progress message on Download click.** The user gets a
status pill **anchored below the Download button** (`.dl-btn`) when
they click it, populated with one of two texts depending on whether
the threshold is met:

| Threshold | Message |
|-----------|---------|
| Met (`.advanced` unlocked) | `🎉 You can now go to the next Level.` |
| Not met | `Increase your counters to get to the next Level` |

The Download click itself is NOT blocked — message is purely
informative. Pill auto-hides after 5 seconds.

```html
<div id="unlockToast" class="flove-unlock-toast" role="status" aria-live="polite"></div>
```

Element is empty by default; JS sets `textContent` on each click and
positions it via `position:fixed; left:<rect.left>px; top:<rect.bottom+8>px`
using `dl-btn.getBoundingClientRect()`. Accent-gradient pill with
white text, bounce-in animation via the `.is-on` class.

**JS hooks** (in `flove.js` and inline in blogy-advanced-one):
- `checkUnlocks()` runs at the end of every `refresh()`. Walks the
  `UNLOCK` map; for any newly-met tier, applies `.is-unlocked` to
  its `tier-pop-step` (so the aura starts immediately). Tracked in
  `unlocked = {}` so each tier transitions once.
- `showDlMessage(text)` positions and shows the toast below `.dl-btn`.
- A delegated `click` listener on `document` catches any `.dl-btn`
  click, evaluates thresholds, and calls `showDlMessage` with the
  matching text.

**Once unlocked, stays unlocked** for the session (no relocking if
the user clears state). Reload resets — no persistence yet.

**Iframe overlay on unlocked tier click.** Once a WIP tier is
unlocked, clicking its `.tier-pop-step--wip.is-unlocked` link is
intercepted (preventDefault) and opens the destination in a centered
iframe overlay instead of navigating away. This is the proof-of-concept
gating — the user sees the destination tier in-context without losing
the current tier's state. Markup:

```html
<div id="tierIframeOverlay" class="tier-iframe-overlay" hidden>
  <div class="tier-iframe-backdrop"></div>
  <button type="button" class="tier-iframe-close" aria-label="Close">✕</button>
  <iframe class="tier-iframe-frame" src="" title="Tier preview" loading="lazy"></iframe>
</div>
```

Closes on: click of `.tier-iframe-close` (the X button), click of
`.tier-iframe-backdrop` (outside the iframe), or pressing `Escape`.
Body scroll is locked while open (`overflow: hidden`). The iframe's
`src` is cleared on close to stop any in-frame activity.

Reference impl: `apps/flove.js` (the `UNLOCK` const + `checkUnlocks()`
+ `showDlMessage()` + `openTierIframe()` / `closeTierIframe()` near
the tail) and the corresponding inline copy in
`apps/blogy/blogy-advanced-one.html`.
