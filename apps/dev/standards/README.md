# ✺ flove · Standards — the matrix (stable index)

The stable index of the flove frontend standards. This file changes rarely: it
only **names** each standard and points to where it's specified. The full text
lives once — in `frontend.md`, or, for the biggest standards, in its own
`frontend/<topic>.md`; keep descriptions *there*, not here. An
interactive, navigable version (tiers × standards) is [`flove-tiers-matrix.html`](../flove-tiers-matrix.html).

**The three files of this sub-book:**

| File | What | Nature |
|------|------|--------|
| [`contract.md`](contract.md) | the **mandatory** rules (§0–8) every app follows | short · stable · non-negotiable |
| [`frontend.md`](frontend.md) | the **opt-in catalogue** (§13) + regions · elements · conventions | long · grows |
| [`adoption.md`](adoption.md) | the **per-app checklist** (§14) — who adopted what | a living table |

## The catalogue at a glance (§13 → `frontend.md`)

Standards with their own deep chapter link to `frontend/…`; the rest live inline in `frontend.md`.

| § | Standard | One line |
|---|----------|----------|
| 13.1 | [**Tier model**](frontend/tiers.md) | 7 tier slots as separate files + `tier-pop` nav |
| 13.2 | **i18n** | pure-CSS `.t-en`/`.t-es` swap; shared `flove:lang` default |
| 13.3 | **Forms-in-iframe** | user-extensible: newlabeler / newwizard / newlanguage / newsound |
| 13.4 | **Compass** | re-presents contents *within* the current surface |
| 13.5 | **Topbar** | which controls the topbar carries, per tier |
| 13.6 | **Onboarding** | **MANDATORY** — loud first time, discrete after |
| 13.7 | [**Canonical vocabulary**](frontend/vocabulary.md) | `entry-` `labeler-` `wizard-` `step-` … (was `ray-`/`bot-`) |
| 13.8 | [**Counters**](frontend/counters.md) | floating arcade chips; gated `tier-pop` unlocks |
| 13.9 | [**Summary panel**](frontend/summary.md) | phrase + insights + views + cycles + download |
| 13.10 | **Nav-tab title** | `<App> · FLOVE` (favicon · name · brand) |
| 13.11 | **Surfaces** | the medium axis (hardware · 2D · 3D · AR · VR) |
| 13.12 | [**Export & share**](frontend/export.md) | one *summary-model* → 6 formats (`md·json·xml·html·jpg·csv`) + Web Share |
| 13.13 | **Locking** | method (Low · Mid · High) × trigger (pass · threshold) |
| 13.14 | **Contrast / theme** | light↔dark ◐ toggle; shared `flove:theme` key |
| 13.15 | [**Publish to Appy**](frontend/publish.md) | app → profile bridge (`flove-appy.js`): writer trio + reader + appy/wizy/more; localStorage + manual-upload fallback |
| 14 | **Adoption checklist** | per-app table → [`adoption.md`](adoption.md) |

The `§13.x` labels are **canonical** — references across the whole context book
resolve to them here, regardless of which file physically hosts the section.
**blogy** is the reference app; new patterns mature there first.

*If a standard outgrows `frontend.md`, split it to `frontend/<topic>.md` and
leave a pointer in that file and in this table — deepen without moving the index.*

## Working with these standards

The standards are the **dev-docs** chapter of flove. They live in the docsify
home at **`apps/dev/`** (`flove.org/apps/dev/` once published) — the canonical
home of the whole context pack (docs · standards · theory). This `standards/`
folder is that home's source of truth.

- **Consult** — open `apps/dev/index.html` (docsify) and use its sidebar +
  built-in search, or ask the **agent search**: the knowledge base under
  `docs/theory/kb/` indexes the whole corpus, these standards included. It runs
  on FTS keyword search out of the box (`python3 ingest.py --reset` to rebuild,
  `retrieve.py` / `serve.py` to query); semantic embeddings are optional and
  **kept off for now**, so no heavyweight model is needed.
- **Edit** — change the `.md` file that *owns* the fact (one home per fact; every
  other file points to it). Edit the markdown here — the standalone
  `standards/index.html` page is maintained separately, so don't hand-edit it to
  change a standard. When you add or rename a doc, update `apps/dev/_sidebar.md`
  so it shows in the docsify nav.
- **Publish** — commit + push (scoped) to Gitea `marc/flove`; the live site
  updates via a separate `update-web`.
