# Plan: Standards

> Decisions: SD01-SD17 (repo strategy, analytics, error handling, offline,
> i18n, deprecation, a11y, onboarding, persistence, tokens, performance,
> mobile-first, testing, dependencies, RFC, breaking changes, cadence).

## Decisions made

| ID | Topic | Decision |
|----|-------|----------|
| SD01 | Repo strategy | Multi-repo |
| SD02 | Analytics | Privacy-first (Plausible) |
| SD03 | Error handling | Graceful degradation |
| SD04 | Offline | Full offline |
| SD05 | i18n | Framework ready (en/es now) |
| SD06 | Deprecation | Formal policy (6 months) |
| SD07 | A11y testing | AAA by design |
| SD08 | Onboarding | No onboarding |
| SD09 | State persistence | Ephemerall standard |
| SD10 | Tokens | Hybrid (core + override) |
| SD11 | Performance | Soft guidelines |
| SD12 | Mobile-first | Strict mobile-first |
| SD13 | Testing | Full test suite |
| SD14 | Dependencies | Just documented |
| SD15 | RFC process | No, keep informal |
| SD16 | Breaking changes | Defer until first breaking change |
| SD17 | Release cadence | When ready |
| C09 | "Ready" definition | Checklist: core features + mobile + no crashes + docs |
| C12 | Core features | Scoped to current adoption milestone |
| C16 | Next milestone | JSON distro + trusty SIGNALS cleanup + app links |
| SD18 | Distro strategy | Solo/SoloRich → main, Central → central, CentralRich → central-rich, Decentral → nety branch |

## Architecture

### Multi-repo (SD01)
- Separate repos per project (flove, nety, appy, etc.)
- flove.org aggregates all
- Each repo has its own CLAUDE.md, tests, CI

### Analytics (SD02)
- Plausible, cloud-hosted, GDPR-compliant
- No cookies, no personal data
- Page views, referrers, basic demographics

### Error handling (SD03)
- Graceful degradation: app continues with reduced functionality
- No crash, no blank screen
- Fallback UI for missing features

### Offline (SD04)
- All features work offline
- Data synced when online
- Conflict resolution: last-write-wins

### i18n (SD05)
- English base, Spanish default
- Framework ready: per-string spans + worldball switcher
- Adding a language = translating strings + adding to switcher

### Deprecation (SD06)
- 6 months notice before removal
- Migration guide provided
- Version marker in app metadata

### A11y (SD07)
- AAA by design (not bolted on)
- Follow patterns in development
- Test periodically (not every build)

### Persistence (SD09)
- Ephemerall standard: survive closing, reload resets
- No server-side persistence (for now)
- localStorage + sessionStorage

### Tokens (SD10)
- Core tokens shared across all apps
- Apps can extend/override per their needs
- CSS custom properties pattern

### Testing (SD13)
- Unit + integration + visual regression
- Run on commit (pre-commit hooks)
- Visual regression: screenshot comparison

### Breaking changes (SD16)
- Automatic migration script
- Old apps → new standard
- Run on first load after update

## Tasks

1. Add Plausible snippet to all apps
2. Document graceful degradation patterns
3. Wire ephemerall persistence to all apps
4. Create token system (CSS custom properties)
5. Set up test infrastructure
6. Write migration script for breaking changes
7. Document deprecation policy in contract.md

### Distro strategy (SD18)
- Solo/SoloRich → `main` branch (no backend server)
  - **SoloRich persistence:** libSQL via `@libsql/client` (wraps sql.js WASM + OPFS). Single shared `flove.db` with `app` column. Fallback: localStorage key `flove:db`. Survives cache clears and browser changes. No server, no sync (yet).
- Central → `central/` branch (FastAPI + Turso, serverless on Railway)
  - **Central backend:** Python/FastAPI, Turso (SQLite-compatible HTTP API via libSQL), deployed on Railway at `flove.org/api/*` (same origin, GitHub Pages proxies `/api/*` to Railway). Monorepo project with two services: FastAPI + libSQL server (persistent volume), connected via internal Railway DNS. Full CRUD: `POST/PUT/DELETE /api/{app}/save`, `GET /api/{app}/list?user=NAME`. Staging on Railway domain + proxy. Full spec in [`plans/central-backend.md`](../plans/central-backend.md).
  - **Central apps:** `central/apps/` flat directory. Central apps share names with Solo apps but are lighter (no topbar, no per-app nav — flove.js injects bottom bar). Solo URLs on main maintained as fallback.
  - **Web-first:** Central is designed for flove.org first. Localhost dev support deferred. Dev workflow via Railway staging.
  - **Registry:** `central/apps.json` (simple app name list); `central/collect-schemas.json` (per-app field docs).
  - **Deploy:** PR merge to `central/` → Railway auto-deploy for backend. Central apps deploy separately.
  - **Identity:** Anonymous device UUID first, claim with email later (verified via SMTP).
  - **SoloRich→Central upgrade:** flove.js pings `flove.org/api/ping` (same-origin via GitHub Pages proxy) → enables sync + bottom nav. Same libSQL API, just change connection string from local file to remote.
- CentralRich → layers on top of Central via `<meta name="flove:distro" content="centralrich">`, no separate directory
  - **CentralRich backend:** Python/FastAPI + PostgreSQL with JSONB columns. JSONB gives document flexibility + relational power (JOINs for nety's trust graph). Single DB for both Central summaries and future nety integration. Migrate from SQLite via `pgloader`.
- Decentral → nety's own branch (P2P network layer)
  - **Decentral persistence:** SQLite per peer — each P2P node stores its own data locally. Queries are local (no cross-user aggregation at this level). Sync via P2P protocol.
  - **DecentralRich** (future) → Turso (SQLite-compatible, embedded replicas per peer + cloud sync). Each peer has a local Turso replica (same `~/.flove/flove.db` format, reads in microseconds). Writes sync to Turso Cloud primary when online; offline writes queue locally. Turso Database (Rust rewrite) enables concurrent writes from many peers without locking — essential for trust graphs and content discovery across peers. The entire stack stays SQLite-compatible: no migration from Decentral→DecentralRich, just add sync.
- Branches diverge at the shared-code boundary: `main` apps are self-contained w/ enrichment loader;
  `central/` dir holds Central versions (same filenames as `apps/`, different dir); CentralRich
  runtime-branches from Central's code via the `<meta>` tag; Decentral adds the P2P layer separately.
  The frontend tier model (§13.1) is identical across all branches — only the backend depth and
  code organization differ.
- Recovery: dual-file maintenance — `flove.js` (current) + `flove-previous.js` (last stable).
  On breaking change, apps pin `<meta name="flove:lib-base" content="https://flove.org/appy-previous">`
  to recover without server-side revert.

### Enrichment contract (SD19)
- `flove-loader.js` is an external CSP-safe file at `https://flove.org/appy/flove-loader.js` (~300 bytes, enrichment only)
- `flove.js` (loaded by enrichment loader) adds: Central detection, sync logic, DB abstraction (libSQL/localStorage), bottom nav bar with menu → chapters → app lists
- Apps configure via `<meta name="flove:lib-base">` + `data-flove-css`/`data-flove-js` markers in `<head>`
- Core libs (`flove.css`/`flove.js`) load when markers present; advanced libs load when `data-flove-advanced` is also present
- On success: `flove:enriched` event + `window.flove` exposed
- On failure: silent skip, `localStorage.flove:enriched=false` set for session
- Central+ injects `<meta name="flove:distro">` for CSS/JS runtime branching
- SoloRich is a permanent distro, not a transition state
- Soft size cap: 300 bytes on the loader, warned by lint rule

## Conflicts

- SD01 (multi-repo) × SD13 (testing): test infrastructure needs to work across repos
- SD04 (full offline) × SD02 (analytics): Plausible needs network
