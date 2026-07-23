# Conflicts & Tensions Tracker

> Cross-plan tensions identified from interview decisions (2026-07-23).
> Updated 2026-07-23 with D01-D21 strategic decisions (Central URLs primary, staging workflow, Railway monorepo, no TTL).

## Hard conflicts

### H1: Tabbed app (Q2) × Masks F2 (Q4)

**Files**: `nety-frontend.md`
**Status**: Resolved — global mask bar above tabs

The tabbed layout has no natural place for mask switching. Masks affect every tab's content.

**Resolution**: Global mask selector bar above the tab strip. Adds ~40px vertical space. All tabs read current mask from shared state.

### H2: Weighted ranking (Q6) × Self-selected curators (Q7)

**Files**: `nety-trust.md`
**Status**: Resolved — curator bonus with decay

Trust-weighted ranking means higher-stage users have more influence. But curators are self-selected with community veto.

**Resolution**: Curator status grants ×3 weight bonus that decays 10%/week. Full resolution requires the trust layer to work first.

### H3: Multi-repo (SD01) × Full test suite (SD13)

**Files**: `standards.md`
**Status**: Resolved — shared CI infrastructure across repos

**Resolution**: Shared test runner script invoked from any repo. CI config duplicated per repo with shared workflow template.

### H4: PR merge deploy (C70) × central/ has both backend + apps (C72)

**Files**: `central-backend.md`, `plans/index.md`
**Status**: Open — deploy pipeline needs to distinguish backend changes from app changes

The `central/` branch contains both the FastAPI backend (needs Railway deploy) and modified app versions (need flove.org deploy, same as main). A PR could change both, but the deploy pipeline is PR→Railway for backend. App changes in `central/` would need a separate deploy path.

**Resolution**: Pending — separate deploy paths or restrict `central/` PRs to backend-only.

## Soft tensions

### S1: Hybrid abuse (Q8) × Deferred infrastructure

**Files**: `nety-trust.md`
**Status**: Resolved — Tier 1 defined

Tier 1 = self-selection + community veto + simple report form. Tier 2 (jury) deferred.

### S2: Profily-integrated MyNet (Q9) × Tabbed app (Q2)

**Files**: `nety-frontend.md`
**Status**: Accepted — discoverability trade-off

MyNet tab is prominent (tab #3 of 5). Social features are the headline content.

### S3: Masks F2 (Q4) × Deferred crypto recovery (Q5)

**Files**: `nety-frontend.md`
**Status**: Resolved — recovery code v1

Recovery code displayed once at mask creation, user writes down. Lost code = new mask only.

### S4: Full offline (SD04) × Privacy-first analytics (SD02)

**Files**: `standards.md`
**Status**: Accepted — analytics degraded offline

Plausible needs network. When offline, analytics don't fire.

### S5: Anonymous device ID (C51) × data permanence

**Files**: `central-backend.md`
**Status**: Accepted — user must claim data before clearing browser

Auto-sync uses a device-generated UUID. If the user clears browser data (localStorage, OPFS), the UUID is lost and server data becomes orphaned. The claim flow (email) fixes this, but only if the user claims before clearing data.

**Resolution**: Document in Central modal: "Your data is linked to this device. Set an email to keep it if you clear your browser data."

## Coherent clusters

### C1: "Decide Now" (Q6 + Q7 + Q8)

All three overrode "Defer" suggestions. Tightly coupled: ranking needs curators, curators need abuse system.

### C2: "Privacy-First" (Q4 + Q9)

Early masks + integrated social = privacy-by-design in the social layer.

### C3: "Simple Wins" (Q2 + Q10)

Tabbed app (simple) + defer vizy XR/VR (don't add complexity).

### C4: "libSQL Everywhere" (C64 + C65 + C66 + CA37)

Same engine across SoloRich, Central, Decentral, DecentralRich. One API (`@libsql/client`), one schema, trivial SoloRich→Central migration (change connection string from local file to remote).

## Resolved this session

| Conflict | Resolution |
|----------|------------|
| H2: ranking × curators | ×3 bonus, 10%/week decay |
| S1: abuse × deferred | Tier 1 = self-selection + veto + report form |
| S3: masks × recovery | Recovery code, lost = new mask |
| C16: milestone scope | JSON distro + trusty cleanup + app links |
| C07: deep link direction | One-way, trusty → maty/evily |
| C14: deep link params | `?from={app}&item={id}` |
| C11: deep link mechanism | URL params |
| C26: deep link HTML | Separate div below item |
| C04: MongoDB × SQLite/Turso | No MongoDB — Turso for serverless SQLite, PostgreSQL for CentralRich |
| C15: central/solo branch name | Renamed to `central/` |
| C18: local persistence | libSQL via `@libsql/client` (sql.js WASM + OPFS), fallback localStorage |
| D07: central/apps vs main/apps | Central apps are their own, share names only — two different things |
| D10: Central app serving | Same origin (`flove.org/api/*` proxy), no cross-origin issues |
| D20: URL hierarchy | Central URLs become primary; Solo URLs on main maintained as fallback |
