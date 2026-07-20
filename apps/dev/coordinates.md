# ✺ flove · Coordinate system (four-tree taxonomy)

The framework that locates any flove unit of work on four independent trees —
**Standards `o`** · **Tools `t`** · **Community `c`** · **Usability `u`** — with
flove at the centre. Promoted out of `backend.md` to stand as its own
chapter; the `§A.x` labels are unchanged. Shallower view: `overview.md` §4.
Philosophy: `worldview.md`. The backend that uses these coordinates:
`backend.md`.

*Note — this is a **maturity scale per tree** (§A.3: nano·mini·basic·pro·rich·
lib·framework·suite·platform·standard). It is NOT the frontend **tier model**
(`standards/frontend.md` §13.1: nano·mini·basic·normal·advanced·super·mega),
which counts an app's features. The two share the first three names by
coincidence; they are different axes.*

---

## A · Project coordinate system (four-tree taxonomy)

flove's units of work (apps, demos, installations, organizations) are
located by a **four-tree coordinate system** with the project at the
centre. Each tree is an independent dimension; together they describe
what a thing **means**, what it's **made of**, **who** sustains it,
and how **usable** it feels. (This is the *coordinate* view of flove's map;
the *substance/app* view is `worldview.md` §3, and the compressed picture is
`overview.md` §4.)

### A.1 · The four trees

| Tree | Letter | Measures | Internal structure |
|---|---|---|---|
| **Standards** | `o` (ontology) | semantic/ontological depth — what the thing means | one 0–9 scale |
| **Tools** | `t` | medium of materialization — what the thing is made of | sub-trees 1–5 inside (Hardware, HTML, CSS, JS, Backend), each with its own 0–9 |
| **Community** | `c` | social/legal entity that sustains the project | one 0–9 scale |
| **Usability** | `u` | how usable, accessible, well-handled the thing is | one 0–9 scale |

Letter rationale: `o` avoids the Standards/Style letter clash that the
earlier draft hit; `u` cleanly names the Usability axis that replaced
the earlier "Style"/"Narrativa" experiments.

### A.2 · Sub-trees inside Tools

Within `t`, five sub-mediums are numbered 1–5. The second digit (after
the dot) gives position within the canonical x.0–x.9 scale (§A.3):

| Sub-tree | Number | Examples |
|---|---|---|
| Hardware (no code) | `t1.N` | cards, installations, totems |
| HTML | `t2.N` | semantic markup, microdata, RDFa |
| CSS | `t3.N` | styling, animation, layout |
| JS | `t4.N` | scripting, interactivity, state |
| Backend | `t5.N` | server-side, persistence, federation |

A single unit of work can occupy several sub-trees simultaneously; see
multi-tool notation in §A.6.

### A.3 · Canonical scale x.0–x.9

Every tree (and every sub-tree of Tools) shares the same 0–9 scale,
measuring complexity / sophistication / maturity:

| N | Name | Criterion |
|---|---|---|
| 0 | nano | atomic element, proof-of-concept, "hello world" |
| 1 | mini | small functional unit |
| 2 | basic | idiomatic standard use |
| 3 | pro | production-grade, polished, documented |
| 4 | rich | full vocabulary of the medium |
| 5 | lib | packaged for reuse by others |
| 6 | framework | lib + opinions + structured lifecycle |
| 7 | suite | integrated set of frameworks/tools |
| 8 | platform | service offered to third parties |
| 9 | standard-de-facto | reference that other implementations imitate |

Same scale, every tree:

- `o5` = ontology packaged as a reusable vocabulary
- `t3.6` = CSS at framework level (an opinionated CSS framework)
- `c4` = community as rich entity (cooperative, foundation)
- `u8` = usability productised as a third-party usability platform

### A.4 · Centre — `content-scope` + flove

At the centre of the four trees sits the project itself, characterised
by two elements:

- **content-scope** — the substance and breadth of what the project
  carries (its actual content, plus how broad/deep that content goes).
- **flove** — the love-quality apex; written explicitly to declare the
  project aspires to flove-quality.

flove is an **ontological quality in itself**, independent of standards
level: a project can have abundant flove with poor standards (warmth
without polish), or impeccable standards without flove (dry ontology
without soul).

### A.5 · Geometry — square with vertices at the corners

The four trees occupy the **four corners of a square**; the project
lives at the centre.

```
   ┌───────────────────────────────────────────┐
   │ ◤ Standards (o)              Tools (t) ◥  │
   │                                           │
   │                                           │
   │                ✺ flove                    │
   │             content-scope                 │
   │              2026-05                      │
   │                                           │
   │                                           │
   │ ◣ Community (c)         Usability (u) ◢   │
   └───────────────────────────────────────────┘
```

Reading the edges:

- **Top** (Standards ↔ Tools): the *making* — what it means and what
  it's made of.
- **Bottom** (Community ↔ Usability): the *handling* — who sustains
  it and how it's used.
- **Left column** (Standards ↔ Community): the *grounding* — semantic
  ground and social ground.
- **Right column** (Tools ↔ Usability): the *surface* — production
  surface and user surface.

### A.6 · Syntax

**Linear compact form:**

```
<project> · <YYYY-MM> · o<N> · t<sub.N>[, t<sub.N>…] · c<N> · u<N>
```

Examples:

| Example | Reading |
|---|---|
| `flove · 2026-05 · o2 · t3.6 · c0 · u4` | flove, May 2026, basic ontology, CSS pro tool, nano community (solo author), rich usability |
| `goddy · 2026-05 · o3 · t{2.4, 3.6, 4.5} · c0 · u4` | goddy app combining HTML rich + CSS pro + JS lib |
| `cards · 2026-05 · o2 · t1.1 · c0 · u3` | a 3D-printed mini installation hosting a mini app |

**Multi-tool notation**: `t{a, b, c}` — a set of sub-tree coordinates
inside the Tools tree. The set notation is parser-friendly and reads
naturally as "this work combines these three media".

### A.7 · Parked debates

Items deferred for later resolution; reopen on demand:

- **Narrativa / Films axis.** Earlier drafts had a 7th tier "Narrativa"
  with `image → vignette → scene → story → gamificado → interactivo →
  films → inmersivo → canon → mythos`. Currently absorbed into
  `content-scope` at the centre; may split out again as its own
  coordinate (perhaps under Usability, perhaps as a new tree) if it
  earns it.
- **flove-quality measure.** flove at the centre may receive its own
  intensity/extension coordinates — provisional syntax
  `flove[q<N>, k<N>]` where `q` = cantidad (extension) and `k` =
  calidad (intensity). Not active yet.
- **Tiers >5 in Tools.** What lives beyond Backend (P2P, mesh, AI
  stacks) has not been numbered.
- **Gitea ↔ `docs/index.html` sibling-category rule.** When
  uploading a project to its Gitea repo, also add the matching item
  to the same-named category inside `docs/index.html`. **Note:** the
  order is not the same in both places — match by category name, not
  by position.
