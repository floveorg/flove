# nety-frontend — Implementation Plan

> Derived from interview decisions Q2, Q4, Q9 (2026-07-22).
> Source spec: `making-of/superpowers/specs/2026-06-18-nety-access-ecosystem-design.md`
> Existing build: `making-of/superpowers/plans/2026-06-18-nety-frontend-build.md`

## Decisions

| Q | Decision | Source |
|---|----------|--------|
| Q2 | Nety frontend = **Tabbed app** | Overrode "Hybrid" suggestion |
| Q4 | Identity masks = **F2 (early)** | Overrode "F5 (late)" suggestion |
| Q9 | Social = **Profily-integrated MyNet** | Agreed with suggestion |

## Architecture

Single self-contained HTML file (flove-standard). Tabbed layout like `miniappy.html`.

### Tab structure

```
┌─────────────────────────────────────────┐
│ [global mask selector bar]              │  ← NEW: masks F2
├─────┬─────┬──────┬─────────┬───────────┤
│Ident│Access│MyNet │Circles │ Activity  │
│ity  │      │(=Social)│       │           │
└─────┴─────┴──────┴─────────┴───────────┘
```

### Mask selector (Q4 → F2)

- Global bar above tabs, visible on all tabs
- Shows current mask name + avatar
- Dropdown to switch masks
- "Create new mask" option
- Affects content on ALL tabs (MyNet feed, circles, activity)

### Mask recovery (C03, C15, I08)

- Recovery code generated at mask creation
- Displayed as downloadable text file (one of fields of `souls-summary.json`)
- User writes down or saves file
- Lost code = new mask only (no recovery of old mask)

### MyNet = Social (Q9)

- MyNet tab IS the social app
- Features from `appy-five-apps-tier-ladder-design.md` §4 #21-25
- Basic tier home: follow/support, feed, favourites, circles, chat

### Tabs (revised from miniappy)

| Tab | Content | Notes |
|-----|---------|-------|
| **Identity** | Profile card, extend profile, keypair | Renamed from "Profile" |
| **Access** | Welcome, network stats, resource posture | Renamed from "Nety" |
| **MyNet** | Invites, tree, social feed, favourites, groups, chat | Merged MyNet + Chat |
| **Circles** | Circle management, permissions | Extracted from MyNet |
| **Activity** | Stage ladder, facet rings, donations, moderation queue | Unchanged |

## Implementation tasks

- [ ] T1: Design mask selector UI (global bar above tabs)
- [ ] T2: Refactor miniappy.html tab structure (5 tabs, rename)
- [ ] T3: Merge Chat into MyNet tab
- [ ] T4: Extract Circles as standalone tab
- [ ] T5: Wire mask switching to all tab content
- [ ] T6: Add mask creation flow
- [ ] T7: Update vocabulary (Identity, Access naming)

## Conflicts to watch

- **Mask selector × tabbed layout**: no natural place for mask UI in tabbed design → global bar solves it but adds vertical space
- **Masks F2 × deferred crypto recovery (Q5)**: masks need key management from day one, but key recovery is deferred → use simple password-based recovery for v1

## Pending decisions that affect this plan

- Q3: Hardware quotas (affects Access tab resource display)
- Q5: Crypto key recovery (affects Identity tab key management)
- Q13-20: Docs decisions (don't affect this plan)
