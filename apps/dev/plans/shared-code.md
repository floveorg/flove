# Plan: Shared Code Abstraction

> Decisions: CA01-CA42 (shared libs, enrichment loader, Central detection, DB abstraction, bottom nav).
> Cross-refs: `plans/central-backend.md` (Central backend API and DB), `plans/standards.md` §SD18 (distro strategy).

## Decisions made

| ID | Topic | Decision |
|----|-------|----------|
| CA01 | Lib location | `apps/appy/` |
| CA02 | Loading | Hybrid (external dev, inlined prod) |
| CA03 | First wave JS | Incremental (one module at a time) |
| CA04 | First wave CSS | Just flove-bar first |
| CA05 | index.html theme | Keep its own pattern |
| CA06 | Dark-by-design | Toggle flips variant |
| CA07 | System preference | System default + override |
| CA08 | Transitions | JS-controlled fade |
| CA09 | Enrichment scope | All 71 apps at once (mechanical script) |
| CA10 | Lib URL | Absolute `https://flove.org/appy/` |
| CA11 | Retry skip | Session-local `flove:enriched=false` on failure |
| CA12 | Hide-on-load | No — app handles own loading states |
| CA13 | Loader mechanism | Self-executing, scans `data-flove-css`/`data-flove-js` markers |
| CA14 | Preconnect | Yes — inject `<link rel="preconnect" href="https://flove.org">` |
| CA15 | Network check | Always attempt, real errors trigger skip |
| CA16 | Enrichment signal | Both `flove:enriched` event + `window.flove` |
| CA17 | File split | `flove.css`/`flove.js` (core) + `flove-advanced.css`/`flove-advanced.js` (full) |
| CA18 | Branch layout | Separate dirs: `apps/` on main, `central/` on central |
| CA19 | SoloRich status | Permanent distro, not a transition |
| CA20 | CentralRich structure | Layers on Central — runtime branching via `<meta>` |
| CA21 | Minification | Never — always readable |
| CA22 | Scan scope | `<head>` default; `data-flove-scope="body"` overrides |
| CA23 | Duplicates | Check existing tags, warn console, skip if found |
| CA24 | Core/advanced loading | Core always; `data-flove-advanced` flag adds advanced |
| CA25 | Opt-in model | By tier — normal/advanced/super default; mini/basic opt-in |
| CA26 | Multi-instance | Once globally — one load, one event, all instances share |
| CA27 | CSP | `flove-loader.js` as external file (CSP-safe, no `'unsafe-inline'`) |
| CA28 | Testing | Manual spot-check 5-10 apps after transformation |
| CA29 | Build tool | One-time script + CI lint rule catches regressions |
| CA30 | Config mechanism | `<meta name="flove:lib-base">` declares base URL per app |
| CA31 | Size budget | Soft guideline 300 bytes — warn in lint, don't fail |
| CA32 | Breaking recovery | Dual-file: `flove.js` + `flove-previous.js`; update `<meta>` to recover |
| CA33 | Distro meta injection | Central+ only: `<meta name="flove:distro" content="central">` |
| CA34 | Skip flag storage | `localStorage` (alongside SQLite) — too trivial for a DB query |
| CA35 | Opt-in comment | Auto-injected `<!-- flove:enrich-optin -->` into mini/basic apps by batch script |
| CA36 | Duplicate handling | Leave old `<script src="../flove.js">` in place; loader detects and skips |
| CA37 | SoloRich persistence | libSQL via `@libsql/client` (wraps sql.js WASM + OPFS). Single shared `flove.db` with `app` column. Fallback: localStorage key `flove:db`. Central uses same libSQL API (remote). |
| CA38 | Central detection | flove.js pings `/api/ping` on `flove.org` (same origin via proxy), caches in localStorage (session). Enables sync + bottom nav on success. |
| CA39 | Default collect() | flove.js provides `window.flove.collect()` returning `{timestamp, selections, ratings}`. Apps override for app-specific data. |
| CA40 | DB abstraction | In flove.js — lazy init on first `flove.db` call. Dynamic import of `@libsql/client` (WASM loaded on demand). Fallback to localStorage silently. |
| CA41 | Device identity | UUID in SQLite `user_config` table, generated on first use. Anonymous until user claims with email. |
| CA42 | Sync API | `window.flove.central.available` (boolean) + `window.flove.sync()` (trigger). Auto-sync on load silent. Sync accessible via bottom nav. |
| CA43 | Bottom nav | flove.js injects a bottom fixed bar with logo → menu → chapters → app lists. Two levels (Category → App). Mirrors `apps/` directory from main. Shared across all Central apps. |
| CA44 | Shared components | flove.js provides CSS layout + JS components: rating widget, card view, modal, form helpers, expandable menu. Maximum code sharing, minimal per-app HTML/CSS/JS. |

## Architecture

### Location (CA01)
- Shared flove.js + flove.css live in `apps/appy/`
- Alongside flove-appy.js (appy-specific shared code)
- Logical grouping, though appy is itself an app

### Loading (CA02)

#### Distro-aware loading (overview)

| Distro | Loading strategy | Shared lib status |
|--------|-----------------|-------------------|
| **Solo** | Fully self-contained — all code inlined, no external files | N/A |
| **SoloRich** | Self-contained base + enrichment loader tries external libs; silent skip on fail | Optional (progressive enhancement). Browser persistence: libSQL via `@libsql/client` (sql.js WASM + OPFS), fallback localStorage. |
| **Central** | Hybrid: external during dev, inlined for production | Mandatory (backend depends on them) |
| **CentralRich** | Hybrid (same as Central) + runtime branching via `<meta>` | Mandatory |
| **Decentral** | Hybrid (same as Central) + P2P network layer | Mandatory |
| **DecentralRich** | Hybrid + P2P + Turso cloud sync (SQLite-compatible, concurrent writes) | Mandatory |

#### Enrichment loader architecture (SoloRich)

**What it is.** A small JS file (`flove-loader.js`, ~300 bytes soft cap, never minified) that apps load via `<script src="https://flove.org/appy/flove-loader.js">`. It dynamically fetches shared libs and applies them when available. The app works fully without them — enrichment is additive, never required.

**How apps configure it.** Apps declare the lib base URL and which libs to try using HTML markers:

```html
<meta name="flove:lib-base" content="https://flove.org/appy">

<link data-flove-css href="flove.css" rel="stylesheet">
<script data-flove-js src="flove.js"></script>
```

The loader reads `meta[name="flove:lib-base"]`, scans `<head>` for elements with `data-flove-css` / `data-flove-js`, checks for existing tags with the same filename (duplicate warning to console, skip if found), injects `<link rel="preconnect">` for the base domain, then dynamically creates `<link>` / `<script>` elements pointing to the absolute URL. Core `flove.css`/`flove.js` always loads when markers are present; advanced via `data-flove-advanced` flag.

**What happens on success.** The loader fires `new CustomEvent('flove:enriched')` on `document` and exposes `window.flove`. CSS from `flove.css` applies its shared styles (topbar, tokens, compass). JS from `flove.js` registers shared behaviors. Central+ additionally injects `<meta name="flove:distro" content="central">`.

**What happens on failure.** The loader silently removes the failed `<script>`/`<link>`. Sets `localStorage.flove:enriched = 'false'` for this session (only resets on full page close/reopen). The app continues running at its base Solo capability. No console errors, no UI breakage. Dual-file recovery: if `flove.js` breaks, apps pin `<meta name="flove:lib-base" content="https://flove.org/appy-previous">` to use the last stable version.

**Opt-in model.** Apps at `normal`, `advanced`, `super` tier carry the markers by default (the batch transformation script adds them). Apps at `mini` and `basic` tier must opt in by adding markers explicitly. The lint rule (`lint/flove-loader-check`) flags any app at normal+ that's missing `flove-loader.js` and flags any mini/basic app that has it without a documented opt-in reason.

**CSP safety.** `flove-loader.js` is an external file with a `src` attribute — no inline `<script>` block. No `'unsafe-inline'` required. CSP can use `script-src 'self' https://flove.org`. The chicken-and-egg tradeoff: on `file://` (no server), the loader itself can't load, so enrichment never runs — the app stays in Solo mode, which is functionally correct.

**Multi-instance.** One global load — the enrichment fires once and all flove instances on the page share the same `window.flove` and event.

**Branch layout.**
- `main` branch: `apps/` directory with Solo/SoloRich versions
- `central` branch: `central/` directory with Central versions (same filenames, different directory)
- `central-rich`: layers on top of `central` via `<meta name="flove:distro" content="centralrich">` — no separate directory
- Decentral: nety's own branch

### index.html Theme (CA05)
- apps/index.html keeps its own theme pattern
- Does NOT adopt shared theme toggle
- More code, but tailored to its needs as central hub

### Dark-by-Design (CA06)
- Toggle flips variant: dark apps show light when toggled
- All apps have the toggle visible
- Most flexible, more CSS work

### System Preference (CA07)
- Follow system preference by default
- localStorage overrides user choice
- Most flexible, adaptive to environment

### Transitions (CA08)
- JS-controlled fade: fade out → swap → fade in
- No FOUC, smoothest experience
- Most code, but worth it for polish

## Tasks

### Shared lib extraction
1. Move flove-bar CSS to `apps/appy/flove.css`
2. Create build script for inlining (dev → external, prod → inline)
3. Move sound engine to `apps/appy/flove.js` (first module)
4. Test sound engine in isolation
5. Move summary actions (second module)
6. Add JS-controlled fade to theme toggle
7. Implement system preference detection + localStorage override
8. Wire dark-by-design variant flipping

### Enrichment loader
9. Write `flove-loader.js` (~300 bytes, never minified, CSP-safe external file)
10. Write batch transformation script (inject markers + loader ref into all apps)
11. Write lint rule `lint/flove-loader-check` (flag missing markers, flag unauthorized opt-in)
12. Manual spot-check testing on 5-10 apps (`file://` + localhost)
13. Create `flove.css`/`flove.js` (core) and `flove-advanced.css`/`flove-advanced.js` (full) at `apps/appy/`
14. Set up dual-file recovery: `flove.js` + `flove-previous.js` maintained in `apps/appy/`
15. Wire `flove:enriched` event + `window.flove` exposure in core `flove.js`

## Conflicts

- CA02 (hybrid loading) needs a build step — adds complexity to deploy
- CA05 (index.html keeps own pattern) means theme inconsistency with other apps
- CA27 (CSP-safe external loader) × CA11 (session skip): on `file://`, the loader itself can't load, so enrichment never runs — app stays in Solo. Acceptable: functionally correct.
- CA29 (one-time script) × CA25 (opt-in by tier): if an app changes tier after the transformation, the lint rule catches it but doesn't auto-fix. Manual re-run of the script may be needed.
