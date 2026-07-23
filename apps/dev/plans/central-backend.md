# Plan: Central Backend

> Decisions: CB01-CB40 + C01-C76 + D01-D21 + E01-E25 (FastAPI + Turso backend for Central distro, serverless on Railway, libSQL everywhere, strategic architecture, platform nav).
> Cross-refs: `plans/shared-code.md` (enrichment loader CA09-CA42),
> `plans/standards.md` §SD18 (distro strategy).

## Decisions made

### Core backend (CB01-CB40)

| ID | Topic | Decision |
|----|-------|----------|
| CB01 | Backend stack | Python/FastAPI, async, Turso (SQLite-compatible HTTP API). Serverless on Railway. No MongoDB. |
| CB02 | First app | blogy — prove Turso pattern before expanding |
| CB03 | API pattern | `POST /api/{app}/save`, `PUT /api/{app}/{id}`, `DELETE /api/{app}/{id}` |
| CB04 | Save response | `{ok: true, id: "..."}` — returns rowid for document reference |
| CB05 | List endpoint | `GET /api/{app}/list?user=name` — retrieves all docs for user |
| CB06 | Pagination | Cursor-based, page size 20, `?cursor=...` for next page |
| CB07 | Port | Part of Railway deployment — no fixed port |
| CB08 | API discovery | Relative `/api/` on same origin. Via GitHub Pages proxy on `flove.org`. No subdomain. |
| CB09 | User identity | Device-generated UUID first (anonymous). Claim with email later via settings modal. |
| CB10 | Authentication | None for proof-of-concept — device UUID, no passwords |
| CB11 | Sync trigger | Both: one-time auto-modal on first Central detection + permanent "Sync" button in topbar. Auto-sync on every load (silent). |
| CB12 | Sync UX | Button disabled while syncing. On success: resets. On error: specific server message + "Retry". Auto-sync failures are silent (retry next load). |
| CB13 | Central modal | One-time auto for advanced/super — shows explanation + "Got it, don't show again". No email prompt in modal (email on first sync click). |
| CB14 | Database | Turso (SQLite-compatible HTTP API). libSQL fork initially, migrate to Turso Database when stable. Self-hosted libSQL server on Railway (persistent volume). |
| CB15 | Data model | Full summary JSON — `{app, user, timestamp, data}` stored as JSON column |
| CB16 | Connection config | `.env` for `CORS_ORIGINS=https://flove.org` and `TURSO_URL=libsql://...` |
| CB17 | Server structure | Single `main.py` — loads app list from `central/apps.json` registry (simple list) |
| CB18 | Libs folder | Central has its own `central/libs/` — NOT `apps/appy/`. Separate from SoloRich. |
| CB19 | Branch model | Full fork — `central/` branch diverges from `main`. Selective cherry-pick of bug fixes back to main. Deploy via PR merge → Railway auto-deploy. |
| CB20 | CORS | Configurable via `.env` — `CORS_ORIGINS=https://flove.org` for production, overridable for dev |
| CB21 | Start script | Railway auto-start via `Procfile` or `railway.toml`. Two services: FastAPI + libSQL server. Connected via internal Railway DNS. Local dev deferred. |
| CB22 | Error handling | Specific error messages from server — shown in the sync button area with "Retry" |
| CB23 | List response | Items only — `{items: [...], next_cursor: "..."}`. No total count. |
| CB24 | Prerequisites | Python 3.10+, `pip install fastapi uvicorn libsql-client` |
| CB25 | Data scope | Everything — full `window.flove.collect()` output stored as `data` JSON. App-defined shape, documented in `central/collect-schemas.json`. |
| CB26 | Deployment | Railway — simple deploy from GitHub, PR merge triggers auto-deploy |
| CB27 | URL | `flove.org/api/` — same domain, no subdomain. GitHub Pages proxies `/api/*` to Railway. |
| CB28 | DB choice | Turso — SQLite-compatible HTTP API, designed for serverless. Same API as local SQLite (libSQL client). |
| CB29 | Discovery | Hybrid: flove.js pings `/api/ping` on `flove.org` (same origin via GitHub Pages proxy), caches result in localStorage for session |
| CB30 | Indexes | `(app, user)` — covers the only list query pattern |
| CB31 | Schema versioning | Yes — `PRAGMA user_version` in SQLite, auto-migrate if schema changes |
| CB32 | Conflict resolution | Last-write-wins by client timestamp |
| CB33 | Offline queue | None — no queue, no auto-retry for Central. (Local SQLite mirror stores pending via flove.js; sync on next load.) |
| CB34 | App registration | Registry file `central/apps.json` — simple list `["blogy", "goddy", ...]`, server validates against it |
| CB35 | Testing | Unit tests — pytest on FastAPI endpoints with in-memory SQLite |
| CB36 | Backport | Selective cherry-pick — backport bug fixes from `central/` to `main` manually |
| CB37 | Rate limiting | None for proof-of-concept |
| CB38 | DB path | Turso handles it — no local file path on server |
| CB39 | DB auto-init | Auto — `CREATE TABLE IF NOT EXISTS` on FastAPI startup event |
| CB40 | API prefix | No version prefix — `/api/{app}/save` |

### Strategic architecture (D01-D21)

| ID | Topic | Decision |
|----|-------|----------|
| D01 | Anonymous data TTL | No TTL — keep forever. User can claim data years later. |
| D02 | Data portability | Export endpoint — `GET /api/{app}/export?user=ID` returns all user data as downloadable JSON. |
| D03 | Branch lifecycle | Permanent divergence — `central/` never merges back to `main`. Bug fixes cherry-picked both ways. |
| D04 | Error codes | Simple string — `{ok: false, error: "not_found"}`. Client matches against known list. |
| D05 | Data size limits | None — any app, any user, any data size. |
| D06 | Input validation | Structural — validate `data` is valid JSON, `user` is non-empty string, `timestamp` is ISO format. Per-app schema validation pending. |
| D07 | central/apps/ relationship | Central apps are their own apps, not copies of main. Share names and little more else — two different things. |
| D08 | Build order | Railway backend first (deploy FastAPI + libSQL, verify with curl). Test app pending — skip to real apps. |
| D09 | WASM pre-cache | Pre-cache in sw.js — add `@libsql/client` and WASM binary to sw.js cache list. |
| D10 | App serving URL | Same origin — Railway backend serves API at `flove.org/api/*` via GitHub Pages proxy. Central apps in `central/apps/` on the `central/` branch are deployed separately. |
| D11 | Email verification | Confirmation email — send verification link via SMTP Railway. |
| D12 | Monitoring | None for proof-of-concept — rely on Railway logs, check manually. |
| D13 | Email sending | SMTP via Railway — configure SMTP credentials in `.env`, FastAPI sends verification emails directly. |
| D14 | App navigation | Launcher + index — `central/index.html` as launcher, `central/apps/` with standalone files, full-page navigation. Like Solo. |
| D15 | Cross-app isolation | None — any app can read any other app's data. Trust-based. |
| D16 | Nav architecture | Bottom fixed bar, logo on left → click opens homogenized menu with chapters → expand to lists. All apps under chapters within the logo menu. Same pattern across all Central apps. Navigation injected by flove.js. |
| D17 | Dev workflow | Railway staging — `staging-railway-flove.org` (via Railway domain + GitHub Pages proxy) for testing changes. No local dev. |
| D18 | Persistence recovery | Recovery modal — "Reset DB?" prompt with export option before clearing OPFS. |
| D19 | Railway structure | Monorepo — one Railway project with two services: `fastapi` (Python) and `libsql` (Docker). |
| D20 | Apps folder structure | Flat — `central/apps/blogy.html`, same pattern as Solo. Central URLs become primary; Solo URLs maintained as fallback. |
| D21 | Ready signal | Backend API stable — deploy backend first when endpoints work and tests pass. Apps are separate work. |

### Central app development (E01-E25)

| ID | Topic | Decision |
|----|-------|----------|
| E01 | apps.json format | Flat list — `["blogy", "goddy", ...]`. |
| E02 | collect-schemas.json format | Inline — schema inline in one file per app. |
| E03 | Export format | NDJSON — one JSON object per line, downloadable as `.ndjson`. |
| E04 | First 5 Central apps | appy-mini apps: blogy, souls, inventary, myfamily, keys. |
| E05 | Central index.html | Minimal list — simple row of links. Matches Solo's index. |
| E06 | Error codes | Expanded set: `not_found`, `invalid_json`, `missing_user`, `bad_timestamp`, `app_not_registered`, `method_not_allowed`, `server_error`, `db_error`. |
| E07 | Email verification expiry | 24 hours. |
| E08 | flove.js Central module | Same file, organized by commented sections (`// CENTRAL DETECTION`, `// DB`, `// SYNC`). |
| E09 | Domain | Same domain — `flove.org/api/*` routed to Railway. No subdomain. |
| E10 | Routing mechanism | GitHub Pages proxy — redirect `/api/*` to Railway. |
| E11 | SMTP config | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. |
| E12 | Railway project name | `flove-central`. |
| E13 | Email template | Plain text — "Click here to verify: {{link}}". |
| E14 | Git strategy | Initial commit (skeleton) + feature branches off `central/`. |
| E15 | libSQL Docker image | Official — `ghcr.io/tursodatabase/libsql-server:latest`. |
| E16 | railway.toml | Minimal — Railway auto-detects services. |
| E17 | libSQL volume | Fixed — `/data/flove.db`. |
| E18 | App launch order | blogy first → add goddy second. Prove pattern with 2 categories. |
| E19 | blogy filename | `blogy.html` — same as Solo. The `central/` branch distinguishes it. |
| E20 | First sync scope | Current session only. No historical data. |
| E21 | goddy focus | Publish — goddy items published to a public profile page. First step toward social publishing on Central. |
| E22 | Solo vs Central visual diff | Central apps are more similar navigation, less code overall, more shared libs. Sync + status bar. No per-app redesigns. |
| E23 | Central nav | Bottom fixed bar. Logo on left → onclick opens homogenized menu. Chapters expand to further lists. All apps under chapters within the logo menu. Same across all Central apps. Injected by flove.js. |
| E24 | flove.js shared behaviors | Sync + bottom bar injection + shared layout CSS + JS components (rating widget, card view, modal, expandable menus). Maximum code sharing. |
| E25 | Menu tree depth | Two levels — Category Chapter → App. Auto-mirrors the `apps/` directory structure from the `main` branch. |

## Architecture

### Tech stack

- **Framework:** Python/FastAPI with `libsql-client` or `turso-client` (Turso HTTP API)
- **Database:** Turso — SQLite-compatible, serverless. libSQL fork initially, Turso Database later.
- **Table:** `app_data(app TEXT, user TEXT, timestamp TEXT, data_json TEXT)` — indexed by `(app, user)`
- **User table:** `user_config(user TEXT, email TEXT, created_at TEXT)` — separate from app data
- **Documents:** `data_json` stores the full `window.flove.collect()` JSON — no schema, stored as-is

### API endpoints

```
POST   /api/{app}/save           → {ok: true, id: "..."}
PUT    /api/{app}/{id}           → {ok: true}
DELETE /api/{app}/{id}           → {ok: true}
GET    /api/{app}/list           → {items: [...], next_cursor: "..." | null}
       ?user=NAME                filter by user
       &cursor=TOKEN             cursor-based pagination (page size 20)
POST   /api/{app}/sync-existing  → {ok: true, count: N}
```

### Data flow (web)

```
User opens blogy on flove.org
  → flove.js loads (via enrichment loader)
  → flove.js pings /api/ping (same origin, GitHub Pages proxies to Railway)
  → caches "central=available" in localStorage (session)
  → if first detection: auto-modal shows "Central found" with "Got it, don't show again"
  → flove.js injects bottom nav bar (logo left → menu → chapters → app lists)
  → auto-sync triggers silently:
      → collects data via default collect() {timestamp, selections, ratings}
      → sends POST /api/blogy/save with device UUID as user
      → on success: done (no feedback)
      → on failure: silent retry on next load
  → on first manual Sync click:
      → modal asks for email (validates format)
      → confirmation email sent via SMTP (plain text, 24h expiry)
      → subsequent syncs use email as identity
  → on error after email set: button shows specific server message + "Retry"
  → on success with email: button resets to "Sync"
```

### Server structure (central/ branch)

```
central/
  main.py            — FastAPI app, Turso init, all routes (auto-creates tables)
  apps.json          — registry: ["blogy", "goddy", "souls", "pracsys", "inventary"]
  collect-schemas.json — per-app schema inline (field names + types)
  requirements.txt   — fastapi, uvicorn, libsql-client
  .env               — CORS_ORIGINS=https://flove.org, SMTP_* vars
  index.html         — Central launcher (minimal link list)
  apps/
    blogy.html       — Central app, flove.js-powered (bottom nav, sync, shared CSS)
    goddy.html
    souls.html
    pracsys.html
    inventary.html
```

Central apps are thinner than Solo apps: no topbar, no individual nav — flove.js injects the shared bottom bar and menu. Each app provides only its core content + interaction JS. Shared CSS (flove.css) provides layout, cards, forms, rating widget, expandable menu components.

### Identity model (progressive)

**Phase 1 (anonymous):** Device-generated UUID stored in SQLite (`user_config` table). Auto-sync uses this UUID. No email needed to use Central.

**Phase 2 (claim):** User clicks "Claim your data" in the Central settings modal. Enters email (validated for format). Confirmation email sent via SMTP (plain text, 24h expiry). Past data merges to the email identity. Future syncs use email.

**Phase 3 (future):** More identity methods — Telegram, mobile, biometrics. Deferred.

Multi-user auth deferred to CentralRich.

### Browser-side persistence (SoloRich + Central)

**Primary:** libSQL via `@libsql/client` in the browser, wrapping sql.js WASM + OPFS. Single shared `flove.db` with `app` column. Init is lazy — first call to `flove.db.query()` triggers WASM load.

**Fallback:** localStorage key `flove:db` stores everything as one JSON blob. Used when WASM/OPFS isn't available (old browser, WASM fails to load). Silent fallback — no user-facing message.

**Central detection:** flove.js pings `/api/ping` on `flove.org` (same origin, GitHub Pages proxies to Railway). Caches result in localStorage for the session. On success: enables sync button + auto-sync + bottom nav. On failure: no nav, no sync, app works as SoloRich.

### Conflict resolution

Last-write-wins by client timestamp. The server trusts the latest `timestamp` field in the document. For the same document edited on two devices, the one with the later timestamp wins. No merge logic for proof-of-concept.

### Central modal

Auto-shows once on first Central detection (for advanced/super tiers). Shows:
- Brief explanation of Central sync
- "Got it, don't show again" checkbox
- Email input (only on first sync click, not in the auto-modal)

After dismissal, the "Sync" button stays accessible via the bottom nav menu.

### Central navigation (bottom bar)

flove.js injects a **bottom fixed bar** across all Central apps:

- **Left:** flove logo (clickable)
- **Click → homogenized menu** overlay with chapters
- **Chapters:** mirror the `apps/` directory structure from `main` branch — categories as chapters
- **Chapters expand** to show app lists (two levels: Category → App)
- All Central apps, categories, and future features accessible from this menu

No individual topbar or per-app nav in Central apps. flove.js handles the shared navigation layer.

### Future: CentralRich (PostgreSQL + JSONB)

When Central grows beyond Turso:
- FastAPI stays, Turso replaced with `asyncpg` for PostgreSQL
- JSONB columns: `CREATE TABLE app_data (id UUID, app TEXT, user TEXT, ts TIMESTAMPTZ, data JSONB)`
- JSONB `@>` operator queries the same `collect()` JSON — no client-side change
- Migration from Turso: export to Parquet → pgloader bulk-insert
- PostgreSQL's JOINs enable trust graph queries and cross-app aggregation

### Conflicts

- CB09 (email-only) × future multi-user: email is not secure auth. Migration: add password or OAuth when CentralRich arrives.
- CB11 (manual sync) × offline-first: SoloRich apps with SQLite accumulate changes locally. A `flove:pending-sync` flag tracks unsaved changes; the Sync button shows a count.
- Turso (libSQL) × Turso Database (beta): start with libSQL (production fork), migrate to Turso Database (Rust rewrite, concurrent writes) when stable.