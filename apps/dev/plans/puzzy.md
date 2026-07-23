# Plan: Puzzy

> Decisions: PZQ01 (aggregation), PZQ02 (compute).

## Decisions made

| Topic | Decision |
|-------|----------|
| Aggregation | Mean + dispersion (statistical summary) |
| Compute | Hybrid with offline cache |

## Architecture

### Aggregation
- Common area shows: average rating + spread (std dev or IQR)
- Not juxtaposition (too cluttered), not toggle (hidden info)
- Single number + dispersion indicator
- Example: `4.2 ± 0.8` or `★★★★☆ (±1.2)`

### Compute
- Client-first: puzzy calculations run in browser
- Server fallback: if client can't compute, server calculates
- Offline cache: computed ratings cached for offline use
- Cache invalidation: on new rating submission

## Tasks

1. Define aggregation display format (visual spec)
2. Implement client-side puzzy compute
3. Add server fallback endpoint
4. Wire offline cache (ephemerall persistence)

## Conflicts

- Offline cache needs ephemerall standard to be finalized
- Server fallback needs module-42 backend
