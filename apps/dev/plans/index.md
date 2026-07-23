# Plans Index

> Implementation plans derived from interview decisions and pending questions.
> Each plan documents decisions, architecture, tasks, and cross-plan conflicts.
> Updated 2026-07-23 with CA01-CA44 (enrichment loader, Central detection, DB abstraction, bottom nav, shared components) and CB01-CB40 + C01-C76 + D01-D21 + E01-E25 (Central backend, Turso, serverless Railway, anonymous identity, libSQL everywhere, strategic architecture, Central nav).

## Active plans

| Plan | Source decisions | Status |
|------|-----------------|--------|
| [nety-frontend.md](nety-frontend.md) | Tabbed app, masks F2, social=MyNet | Ready to build |
| [nety-trust.md](nety-trust.md) | Ranking (×3 bonus), curators (+report), abuse Tier 1 | Ready to build |
| [docs.md](docs.md) | Theme, nav, search, content, contributing, support | Ready to build |
| [backend.md](backend.md) | JSON distro schema, build pipeline, distribution | Ready to build (L04-L06 pending) |
| [shared-code.md](shared-code.md) | CA01-CA42 (enrichment loader, shared libs, Central detection, DB abstraction) | ✅ Implemented — 47 apps enriched |
| [central-backend.md](central-backend.md) | CB01-CB40 + C01-C76 + D01-D21 (FastAPI + Turso, serverless Railway, anonymous identity, libSQL everywhere, Railway monorepo, staging workflow) | Design complete — ready to build |
| [puzzy.md](puzzy.md) | Aggregation, compute | Ready to build |
| [standards.md](standards.md) | Tokens, testing, mobile, i18n, release checklist, SD18-SD19 distro strategy | Ready to build |
| [trusty-cleanup.md](trusty-cleanup.md) | SIGNALS removal, app links (evily/myfamily) | Ready to build (links added) |
| [conflicts.md](conflicts.md) | Cross-plan tensions | Living document — all resolved |

## Next milestone

**Central backend (design complete, ready to build)** — FastAPI + Turso on Railway (monorepo, two services), flove.js Central detection + sync, libSQL in browser with localStorage fallback. Build order: Railway backend first (deploy when API+tests pass) → flove.js Central module → first 5 Central apps. Central URLs become primary; Solo URLs maintained as fallback.

**Pending enhancements (future):** Social curation bundles with contrast, test app for end-to-end pipeline, per-app collect() schema validation, localhost dev support.

## Pending items (deferred)

These were postponed during the design sessions and can be decided later:

| ID | Topic | Reason deferred |
|----|-------|----------------|
| C15 | blogy Central modifications (minimal vs full vs gradual) | App-level detail — decide when building blogy's Central version |
| C24 | Central logging (none vs basic vs file) | Operational detail — start with Railway logs, add file logging later |
| C37 | Localhost dev support | Web-first — Central designed for flove.org. Localhost deferred to CentralRich |
| D06c | Per-app collect() schema validation | Structural validation (valid JSON, non-empty user, ISO timestamp) is enough for proof-of-concept |
| — | Social curation bundles with contrast | Feature enhancement for DecentralRich — not in Central proof-of-concept |
| — | WASM/libSQL preloaded bundled selections | Feature enhancement — not in proof-of-concept |

## How to use this folder

1. **Before starting dev**: read `conflicts.md` to check for known tensions
2. **When answering a new interview question**: add the resulting plan to this folder
3. **When a plan changes**: update `conflicts.md` with new/resolved tensions
4. **Cross-reference**: each plan links back to the interview question and source spec
