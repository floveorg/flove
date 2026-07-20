# Launch language chooser — design

**Date:** 2026-07-04

## Goal

When flove is launched from the localhost launcher, show an **English / Español**
chooser *before* the app opens. Picking **Español** makes every app open in Spanish
by default. The chooser appears **only until a choice is made** — once chosen, future
launches go straight to the app in the remembered language.

## Key insight — no app files change

The launcher (`start-flove.sh`) serves the whole flove root on **one origin**
(`http://localhost:8642`). All translated apps (34 of them) already read the same
`localStorage['translate2-lang']` key to pick their language, defaulting to English
(the translate2 engine — see `applyLang()`/`init()` in any translated app).

Because `localStorage` is shared per-origin, **writing that one key once at a launch
gate makes every app open in the chosen language.** No per-file edits, no build step.

The rejected alternative — editing each app's default `<html lang>` / engine default —
is fragile, redundant, and 34× the surface area. YAGNI.

## Components

### 1. `launch.html` (new, flove root)

Served at `http://localhost:8642/launch.html`. A small, self-contained, on-brand splash.

Behavior:

1. On load, read `localStorage['translate2-lang']`.
   - **Set** (`en`/`es`) → immediately `location.replace()` to the entry app. Chooser
     never renders. This is the "only until chosen" behavior.
   - **Not set / unreadable** → render the chooser.
2. Chooser shows the flove sprout icon, a 🌐, and two large buttons: **English** and
   **Español** (both labels shown, since no language is chosen yet).
3. Click a button → `localStorage.setItem('translate2-lang', 'en'|'es')` →
   `location.replace('apps/appy/appy-mini.html')`.

Uses `location.replace` (not `assign`) so the chooser isn't left in history — Back from
the app doesn't bounce through the gate.

Minimal JS (localStorage + redirect are inherently JS); layout/visuals are CSS.
Brand palette from `flove-icon.svg` gradient (`#ff3344 → #ff8a3a → #ffd633`) and
`index.html` `:root` (`--ink:#1a1820`, `--mut:#6a6478`, `--accent:#ff8a8a`).

### 2. `start-flove.sh` (one-line edit)

`ENTRY="apps/appy/appy-mini.html"` → `ENTRY="launch.html"`.

Everything else (server bootstrap, `file://` fallback) is unchanged. The launcher now
opens `launch.html`, which forwards to `apps/appy/appy-mini.html` after (or instead of)
the choice.

## Data flow

```
double-click .desktop → start-flove.sh → serve root on :8642 → open launch.html
   launch.html: localStorage['translate2-lang']?
      set  → replace → appy-mini.html (opens in that language)
      unset→ [English|Español] → write key → replace → appy-mini.html
                                                  ↓ (shared origin)
                              every other app reads the key on next open
```

## Error handling / edge cases

- **`localStorage` throws** (private mode / blocked): treat as "not set" → show chooser;
  the `setItem` is wrapped in try/catch; if it can't persist, we still redirect (the app
  falls back to English default). No crash.
- **`file://` fallback** (server couldn't start): `start-flove.sh` opens
  `launch.html` directly; `file://` localStorage is not reliably shared across files, so
  the choice may not carry to other apps. Already a documented degraded mode — unchanged.
- **2 of 36 switcher-apps don't use `translate2-lang`** — they stay English regardless.
  Out of scope; noted for a later pass.

## Testing

- Fresh origin (clear `translate2-lang`): launch → chooser shows → pick Español →
  lands on `appy-mini.html` in Spanish; open another app → Spanish.
- Second launch: goes straight to `appy-mini.html` in the remembered language, no chooser.
- Pick English path mirrors the above.
- `start-flove.sh` still serves and opens (now via `launch.html`).

## Out of scope

- Re-showing the chooser on demand (the per-app 🌐 worldball already re-switches language).
- Additional languages (English + Spanish only, matching current translate2 coverage).
- The 2 non-keyed apps; the `file://` sharing limitation.
