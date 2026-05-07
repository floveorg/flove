# ✺ flove-demos · design guide for Claude

This file is the **design contract** for the flove demo apps. For project
background and philosophy, see `context_flove.md`. For the live token
source of truth, read `flove.css` — these notes summarize and constrain.

## 0. Stance

**Slow it · flow it · love it.** Low-tech, relational, no flashy AI.
Calm motion, breathable layouts, generous whitespace. If a feature
*feels* hypey or "AI-cool", it does not belong in flove.

## 1. Identity primitives (mandatory in every app)

Every demo HTML file MUST keep:

1. **The asterism mark** `✺` — brand glyph (`--flove-mark`). Use
   `.flove-asterism` for the rotating hero variant,
   `.flove-asterism--still` for static copies.
2. **The flove-bar** — sticky strip at the very top with the back link
   to `index.html`, the asterism, and the app name. Use `.flove-bar` /
   `.flove-bar--auto` (auto dark) / `.flove-bar--dark`.
3. A **single accent palette** declared in the page's local `:root`
   via the `--app-accent*` tokens. Never hard-code accent colors mid
   stylesheet.

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
  <title>✺ flove · {app}</title>
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

## 5. Visual verification (use the MCP servers)

Whenever you edit a demo's appearance, **open it and look** before
calling the task done. Available tools:

- `playwright` MCP — open the file, screenshot, inspect DOM.
- `chrome-devtools` MCP — same plus performance / network / a11y.

Default check sequence after any visual change:

1. Open the page at desktop width and capture a screenshot.
2. Resize to ~390px (mobile) and capture again.
3. Toggle `prefers-color-scheme: dark` if the app supports it.
4. Tab through interactive elements to confirm focus rings exist.

State explicitly in your reply if you could *not* verify visually
(e.g. headless display unavailable) — never claim a UI works
without seeing it.

## 6. Accessibility floor

- Every interactive element has a visible `:focus-visible` state.
- Color contrast ≥ 4.5:1 for body text against its background.
- Hit targets ≥ 40×40 px on touch.
- Animations respect `@media (prefers-reduced-motion: reduce)`.
- Decorative asterisms are `aria-hidden="true"`.

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
