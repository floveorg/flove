# ✺ flove · Frontend contract (mandatory)

The **non-negotiable** rules every flove app follows — identity, tokens,
CSS-over-JS, file pattern, the a11y floor, anti-patterns. This is the stable
core; the *opt-in* patterns catalogue lives in `frontend.md`, and the
at-a-glance index in `README.md` (this folder's matrix). Philosophy:
`../worldview.md`. Architecture: `../backend.md`. Live token source of
truth: `flove.css` — these notes summarize and constrain it.

## 0. Stance

**Slow it · flow it · love it.** Low-tech, relational, no flashy AI.
Calm motion, breathable layouts, generous whitespace. If a feature
*feels* hypey or "AI-cool", it does not belong in flove.

## 1. Identity primitives (mandatory in every app)

Every demo HTML file MUST keep:

1. **The app's custom mark** — an inline `<svg class="flove-mark">`
   inside the flove-bar, replacing the older `✺` asterism brand glyph.
   Each app has its own SVG mark drawn to convey its purpose, but they
   share corporate signature: same `viewBox 0 0 100 100`, same stroke
   vocabulary (`stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`),
   and a category gradient (one of the 7 category palettes).
   There is **no** central catalog: each app's mark is drawn in its own
   showcase `images/apps/logos/<app>/<app>-logos.html` (the master), and
   the gradient + paths are **inlined** into the flove-bar per file — do
   NOT use external `<use>` (Chrome blocks `file://` cross-document SVG
   references). Keep every inlined copy in sync (see `frontend.md §13.7` ·
   *Mark propagation* + *App image assets — the logos folder*).
   The rotating asterism (`.flove-asterism`) is preserved only for
   decorative footer copies (`.flove-asterism--still` next to "all apps").
2. **The flove-bar** — sticky strip at the very top with the back link
   to `index.html`, the app's custom mark (point 1), and the app name.
   Use `.flove-bar` / `.flove-bar--auto` (auto dark) / `.flove-bar--dark`.
3. A **single accent palette** declared in the page's local `:root`
   via the `--app-accent*` tokens. Never hard-code accent colors mid
   stylesheet. The mark's gradient stops come from the app's category
   palette (the 7 canonical category colors; see the app's
   `images/apps/logos/<app>/<app>-logos.html`).

## 2. Token discipline

Always prefer tokens from `flove.css` over ad-hoc values.

| Use case        | Token                                         |
|-----------------|-----------------------------------------------|
| Accent color    | `--app-accent`, `--app-accent-soft`, `--app-ink-on-accent` |
| Radius          | `--flove-radius-sm` (12) · `--flove-radius` (20) · `--flove-radius-lg` (28) · `--flove-radius-pill` |
| Motion          | `--flove-ease`, `--flove-fast` (.15s) · `--flove-medium` (.25s) · `--flove-slow` (.4s) |
| Font UI         | `var(--flove-font-ui)` (Inter)                |
| Font display    | `var(--flove-font-display)` (Georgia)         |

Each app may declare its own background/ink palette in its local
`:root`, but must keep the family geometry and motion tokens.

## 3. CSS over JS (firm)

Implement with CSS first. Reach for JS only when CSS literally cannot
express it (state machines, data, persistence). Examples:

- Reveal/hover/focus/expand → `:hover`, `:focus-visible`, `:has()`,
  `details/summary`, `popover`, anchor positioning. Not JS.
- Theming → CSS custom properties + `@media (prefers-color-scheme)`.
  Not a JS theme switcher.
- Layout reflow → container queries / grid. Not JS measuring.

If you find yourself writing a `useEffect`-style listener for layout,
stop and look for a CSS answer.

## 4. File pattern

A flove demo is a **single self-contained HTML file**:

```
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>{App} · FLOVE</title> <!-- app name · FLOVE; app favicon; no asterism — frontend.md §13.10 -->
  <link rel="stylesheet" href="flove.css" />
  <style>
    :root { --app-accent: …; --app-accent-soft: …; --app-ink-on-accent: …; }
    /* app-local styles */
  </style>
</head>
<body>
  <nav class="flove-bar"> … </nav>
  <main> … </main>
</body>
</html>
```

Use `_template.html` as the starting point. Do not introduce a build
step, framework, or bundler. Vanilla HTML + CSS + small JS only.

## 5. Visual verification

No browser-automation MCP is available in this environment — verifying
visually is Marc's job, not Claude's. After any visual change:

1. Describe in plain text **what you changed and where to look** — the
   selectors, the layout zone, the breakpoint that matters.
2. Flag explicitly which states need attention (mobile ~390px, dark
   mode if the app supports it, focus rings, reduced motion).
3. State explicitly that you have not verified visually; never claim a
   UI works without it having been opened.

Marc loads the page in his own browser to confirm. If something looks
off, he reports back and you iterate. Don't try to launch a browser,
take screenshots, or call playwright/chrome-devtools — they're not
wired and the attempts only add noise.

## 6. Accessibility floor

- Every interactive element has a visible `:focus-visible` state.
- Color contrast ≥ 4.5:1 for body text against its background.
- Hit targets ≥ 40×40 px on touch.
- Animations respect `@media (prefers-reduced-motion: reduce)`.
- Decorative asterisms are `aria-hidden="true"`.
- **Collapsed-but-rendered panels stay out of the a11y tree.** A panel
  hidden via `max-width:0` / `opacity:0` / `transform` (not `display:none`)
  still keeps its focusable controls in the tab order + screen-reader tree
  while invisible. Remove them when closed: **JS builds** mirror the toggle
  with `el.inert = !open` (CSS can't toggle `inert`; reference:
  `worthing.html` `.magic-arms` ↔ `#magic-open`); **`-0` / CSS-pure builds**
  add `visibility:hidden` to the closed state (+ `visibility 0s linear <dur>`
  on the close transition so the animation isn't cut). Panels already
  `display:none` when closed need nothing.

## 7. Anti-patterns (do not do)

- Inventing a new accent / radius / easing instead of using the token.
- Adding a JS dependency to do what CSS can do (see §3).
- Overriding `.flove-bar` styles per-app — extend with a modifier class.
- Heavy gradients, neon glows, or "AI-shimmer" effects.
- Modal-stacked, dense, dashboard-like layouts. Flove breathes.
- Removing the asterism or the back-to-launcher link.

## 8. When in doubt

Re-read `flove.css` and `index.html` (the launcher) — they are the
canonical reference for the family look. Match their restraint.

## 9. The harvested catalogue → `frontend.md`

The opt-in patterns (tier model, i18n, compass, topbar, onboarding, canonical
vocabulary, counters, summary, surfaces, export, locking, theme —
**§13.1–§13.14**) live in **`frontend.md`**; the per-app **adoption checklist
(§14)** in **`adoption.md`**; the at-a-glance index in **`README.md`**.

When Marc names a pattern ("tier model", "compass", "topbar", "surfaces",
"forms-iframe", "i18n t-en", "export", "locking"…), look it up in
`frontend.md §13.x` before doing anything. `ray-*`/`bot-*` are the **old**
vocabulary — use `labeler-*`/`wizard-*` (§13.7).
