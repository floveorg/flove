# ✺ flove · overview

The read-me-first map of flove. Starts from what actually ships (the frontend)
and builds out to the bigger picture. Each section points to the deep spec in
`backend.md`; the philosophy lives in `worldview.md`.

---

## 1 · What flove is

**flove = flow + love.** A relational worldview expressed as a constellation of
small, single-file, **CSS-first** web apps — each a way of asking *"what is in
your love?"* in a different substance (souls, joys, keys, polarities, wisy…).
The stance is **slow it · flow it · love it**: low-tech, gift-economic,
local-first, no flashy AI. → full: `worldview.md`.

The apps are the **concrete reality today**; the backend (publishing, the common
area, the puzzy engine) is a phased plan layered behind them. So this overview
leads with the frontend and treats the backend as the bigger picture it grows into.

---

## 2 · The three axes of a flove frontend

A flove frontend is described by three **orthogonal** axes (the organizing frame
of the whole family):

| Axis | Question | Values |
|------|----------|--------|
| **tier** | how many features? | nano · mini · basic · normal · advanced · super · mega (nano/mega reserved) |
| **distro** | which runtime / qualities? | CSS-pure → JS (`flove.js`) → backend |
| **surface** | into which medium? | hardware · 2D · 3D · AR · VR |

The same content (a *flove element*, §4) is one thing; these three are
independent choices about how it's presented. They map onto the Tools tree of
the coordinate system (§4): distro/surface are the HTML·CSS·JS·Backend·Hardware
sub-mediums. → full: `flove/standards/frontend.md` §13.1 (tier), §13.11 (surface).

---

## 3 · Frontend standards — the concrete core

**blogy** is the reference implementation; the standards harvested from it form
the catalogue. The **canonical index is the standards matrix**
(`flove/standards/README.md`) — it names every standard (§13.1–§13.14) and links
to the full spec in `flove/standards/frontend.md`. The mandatory contract is
`flove/standards/contract.md`; per-app adoption is `flove/standards/adoption.md`.

→ full: `flove/standards/`.

---

## 4 · The bigger picture (architecture)

Compressed; each subsection points to its full chapter.

**Coordinate system — four trees.** Every unit of work is located on four
0–9 axes: **Standards `o`** (what it means) · **Tools `t`** (what it's made of:
1 Hardware · 2 HTML · 3 CSS · 4 JS · 5 Backend) · **Community `c`** (who sustains
it) · **Usability `u`**, with *flove* at the centre. → `coordinates.md`. (This is
the *coordinate* view; the *substance/app* map is `worldview.md` §3.)

**Local-first architecture + corporate backend.** Apps run client-side
with **local persistence** (added items survive reload; summary = source
of truth + Update; localStorage / IndexedDB); the **`appy`** profile
aggregates per-app summaries (`MyWizy` compares to others). flove's own
backend is **`nety`** (on the flovenet stack: Ed25519 identity, reputation
/ trust, GraphQL gateway) — it serves the common area, the AI (**wizy**)
and the *others'* data behind `MyWizy`. A **Publisher adapter** keeps flove
portable: besides **`NetyPublisher`** (corporate default), `OasisPublisher`
/ `ActivityPubPublisher` are **integration demos** showing flove plugs
into existing backends (0asis is an add-on, not a dependency).
→ §2, §6, §7, §15.

**The flove element.** Every app field maps to one of 9 universal classes —
`Act · Wish · Bond · Place · Person · Time · Object · Freedom · Rating` — carried
by a canonical `FloveElement` with an `asterism_path` (its place in the *whole*
taxonomy). This is what lets the common area treat fields from different apps as
queryable peers. → §3.

**Lifecycle.** user → app (persist + summary + Update) → export "what you
see" → (optional) `appy` profile → (optional) `nety` corporate backend
(common area, wizy) → (optional demo) Publisher → 0asis / AP / Matrix.
→ §4.

**Puzzy engine.** Relational annotation over 7 canonical bipolar axes (e.g.
`INTENSE–BANAL`); the 5-axis and 7-axis models are *distinct*, not nested. The
**5 senses** (hear·touch·view·taste·smell) act as a multi-select meta-rater.
→ `puzzy.md`.

---

## 5 · Roadmap & open questions

Three strands; the **JS distro (F0–F1)** is the live focus, the **`nety`
corporate backend (F2–F5)** follows, and the **external-platform
integration demo** (0asis et al.) runs in parallel, deferred.

**Implementation plans & cross-plan conflicts** live in [`plans/index.md`](plans/index.md). Check [`plans/conflicts.md`](plans/conflicts.md) before starting work.

| Phase | Track | Deliverable |
|-------|-------|-------------|
| **F0** | JS distro | **`mini` + `minifull` (local)** — the `mini` tier + its `-full` variant of every app, persisted locally; added items survive reload, summary = source of truth + **Update**, export "what you see"; `miniappy`/`minifull` aggregate *your own* summaries offline *(in progress)* |
| **F1** | JS distro | **`basic` tier + features** — query **`MyWizy`** (the *local* AI) over your profile + **punctual content download** (pull a few others' summaries on demand to compare) |
| **F2** | nety (corporate) | Identity (Ed25519, flovenet keystore) + Publish button |
| **F3** | nety (corporate) | Common area — semantic search · whole-matrix · cross-link graph · feed (GraphQL gateway) |
| **F4** | nety (corporate) | AI — **wizy** (module 42 = optional engine via the 0asis add-on) |
| **F5** | nety (corporate) | Full puzzy engine (multi-axis · multi-rater · primitives) |
| **—** | integration demo | External bridges: `routing.json` + Publisher adapter → `OasisPublisher` (1st demo), then ActivityPub / Matrix / Solid |

**Open questions** (genuine, deferred): routing authoring (wiki vs curator) ·
AI fine-tuning approach + whose compute · identity masks timing · per-element
visibility vs rely-on-0asis · typed vs untyped cross-links. Parked design
debates (Narrativa axis, a flove-quality measure, P2P node tiers) live in
`coordinates.md` §A.7.
→ full: `backend.md` §9, §12; `coordinates.md` §A.7.

---

*Quick map only — for the full specification read `backend.md`. For the
worldview read `worldview.md`. For the ontology depth read `theory/`.*
