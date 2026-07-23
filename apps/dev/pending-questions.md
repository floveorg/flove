# Pending Questions

> **Next milestone: JSON distro** (routing.json + metadata + trusty cleanup + app links).
> All implementation questions answered. 3 backend skipped.

---

## Backend (skipped)

### L04 — How should the backend expose its API?

| Option | Description |
|--------|-------------|
| a. REST | Standard HTTP endpoints. Simple, verbose, widely supported. |
| b. GraphQL | Flexible query language. Powerful, complex setup. |
| c. tRPC | Type-safe RPC for TypeScript. Best DX, TypeScript required. |
| d. WebSocket | Real-time bidirectional. Complex, needed for live features. |

★ suggested: a · ref: DEP04

### L05 — How should the backend handle CORS?

| Option | Description |
|--------|-------------|
| a. Strict (flove.org only) | Only allow flove.org origins. Most secure. |
| b. Permissive (all origins) | Allow any origin. Simple, less secure. |
| c. Env-based (configurable) | Set allowed origins via env var. Flexible. |

★ suggested: c · ref: DEP05

### L06 — How should the backend handle rate limiting?

| Option | Description |
|--------|-------------|
| a. IP-based | Limit by IP address. Simple, shared IP issues. |
| b. Token-based | Limit by API key/user. More accurate, requires auth. |
| c. None | No rate limiting. Simplest, vulnerable to abuse. |
| d. Hybrid | IP-based for anonymous, token-based for authenticated. |

★ suggested: d · ref: DEP06
