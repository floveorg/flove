# nety spec ↔ flovenet ↔ oasis — match / conflict comparison

**Date:** 2026-06-18 · companion to `2026-06-18-nety-access-ecosystem-design.md`
**Purpose:** compare the spec's design decisions against (1) **flovenet's actual Rust
implementation today** and (2) **how oasis (SSB) handles each + an easy implementation
path**. Legend: ✓ match · ◐ partial · ✗ conflict/absent.

> Local artifact (flove `docs/` is gitignored). Built from two code explorations of
> `~/flovenet` and `~/oasis`.

## 0′. Governing stance (2026-06-18) — flovenet-independent, oasis as an add-on

**Decision that frames everything below:** **flovenet and its apps are fully independent of
oasis.** The whole design is implemented **natively in flovenet's own stack** (identity,
social_protocol, 4-facet reputation, invites, circles, permissions, presence, donation,
MyWizy). We **borrow oasis/SSB's good design patterns** (private-group encryption,
follows-as-mirror, offline-first replication, circles, co-signed lineage) as **inspiration to
reimplement natively — NOT as a runtime dependency.**

**oasis is then proposed as an optional add-on** for flovenet apps (§9): an opt-in module that
*integrates* oasis where wanted — SSB federation/interop, its "42" local AI as an optional
MyWizy engine, etc. Read §1–§8 below as **"good patterns to absorb + what the add-on can
bridge,"** not "oasis is the upper layer." The upper layer is **flovenet-native**; oasis plugs
in. See §9 for the add-on design.

## 0. Headline

**flovenet and oasis are complementary, and together they shadow the spec's two layers:**
- **flovenet ≈ the lower nety layer** — real Ed25519 keystore, a reputation engine, a trust
  graph (direct + 2nd-order transitive w/ decay), node roles + a job scheduler. It already
  *is* the resource/reputation substrate.
- **oasis (SSB) ≈ the upper social layer** — f2f follows, private (encrypted) messages,
  tribes/groups, offline-first replication. It already *is* the social/contents layer.

So the spec isn't fighting either codebase — it's largely **unifying** them under one design.
The conflicts below are mostly "the spec is richer than what exists yet," plus a few genuine
model clashes (single-score vs four-facets; SSB's non-recoverable identity).

## 1. Per-concept comparison

| # | Spec decision | flovenet today | oasis / SSB today | Oasis impl. ease |
|---|---|---|---|---|
| **Identity / auth** | Ed25519 keypair + linked identities (social→Telegram✦→phone→email→biometrics), only Telegram verified now | ◐ Ed25519 ✓, encrypted keystore (argon2id + ChaCha20) ✓; **only email** linking, no Telegram/phone/biometric, no proof-of-control | ◐ SSB Ed25519 feed ✓; **no external linking** at all | Moderate (add linking msg types) |
| **Trust scoring (4 facets)** | Personal/Local/Social/Global + Activity presence; diversity-weighted; dynamic; graduated slash | ✗/◐ **Single composite score** (`50 + net_contribution×mult + bonus`); tracks contribution, uptime, success, **peer_diversity**, bonus; CRDT LWW; separate **trust_graph (2nd-order transitive + decay)** | ✗ follows/blocks only, **no score**; friend-graph hops via `ssb-friends` | Moderate (new karma type + graph traversal) |
| **Invites (lineage + vouch web)** | invite-coded registration, single-parent tree + vouch web, single/multi-use, budget, public/traceable | ✗ **no invites at all** | ◐ SSB **pub/tribe invites ✓**, but **no lineage/genealogy** (atomic) | Moderate (add `replaces` ancestry chain) |
| **Vouches (diversity-weighted)** | vouch received `+5×voucher×diversity`, collusion self-cancel | ◐ directional **trust edges** w/ transitive weight; **no vouch type, no diversity weighting** | ✗ one-way follows, no endorsement/diversity | Hard (vouch type + diversity calc + consensus) |
| **Resource sharing → contribs** | share compute/storage/AI → Global facet + stars | ◐ **NodeRole {Storage,Compute,Ai,Social}** ✓, **scheduler** matches jobs by reputation ✓; **no cross-node mesh replication**, no reward integration | ✗ **none** — oasis is purely social | Hard (out of SSB scope) |
| **Stars / stages / passwords** | stars=progress → contributing stages → passwords unlock protected sections | ✗ continuous reputation score; **no stars/stages/unlock gating** | ◐ **LARP houses + ECOin UBI** (cosmetic/economic), no feature-unlock-by-points | Easy–Moderate (gate modules by karma) |
| **Donation directing** | earmark own + steward pool; donor-set transparency; **purely voluntary** pool | ✗ none (scheduler = 1 job→1 peer) | ✗ none (UBI auto-distributed by algorithm) | Moderate (donation msg type + routing) |
| **Permissions (private-first, circles)** | private-first; MyNet + tiered rings + tag circles; per-area | ✗ JWT auth only, **public reads, no ACL**, no privacy posture | ◐ SSB **private msgs (`recps`) + blocking ✓**, but **public-default** | Moderate (invert defaults + audience UI) |
| **MyNet / f2f / circles** | f2f substrate (nety) + custom circles (apps); rings + tags | ✗ follow graph exists, **no MyNet/circles/peering prefs** | ◐ SSB **f2f follows ✓ (strong)**, **tribes** as groups; **no named circles** | Easy (reuse tribes as circles) |
| **Presence (graded)** | LIVE/RECENT/REACHABLE/DARK; inside Global; owner-visible | ◐ **minimal** — implicit via mDNS/Kademlia, no presence protocol | ◐ **offline-first replication ✓**, activity timestamps + cosmetic green/orange/red; **no online status** | Easy (map timestamps + ephemeral ping) |
| **Key loss & recovery** | self-backup + **social recovery**; rotation carries standing; probation | ✗ keystore password-change only; **no rotation, no social recovery** | ✗ **SSB identity = keypair forever; loss is permanent** (append-only) | Very hard (breaks append-only / needs sidechain) |

## 2. Where the spec MATCHES reality (build on these)

- **Ed25519 keypair identity + encrypted keystore** — flovenet already ships this; the spec's
  identity core is real, not aspirational.
- **Trust graph w/ 2nd-order transitivity + decay** — flovenet's `trust_graph` is a direct
  precursor to the spec's vouch web / diversity weighting (it even tracks `peer_diversity`).
- **Resource roles + reputation-weighted scheduling** — flovenet's `resource_manager` +
  `scheduler` are the spec's "share resources → earn / draw resources" mechanic in embryo.
- **Offline-first + f2f + private-message capability** — oasis/SSB already embodies the
  spec's presence model and MyNet f2f substrate, and can do private-first with a default flip.

## 3. Where the spec CONFLICTS (decisions needed)

1. **Single composite score (flovenet) vs four scoped facets (spec).** The biggest model
   clash. Options: (a) refactor `reputation_engine` into 4 facets; (b) keep the single score
   and *derive* the four facets as views over existing inputs (contribution→Global,
   trust_graph→Social, …); (c) keep single score internally, present 4 facets in the UI only.
2. **No invite layer in flovenet.** The spec's entire invite web (lineage, budget,
   maturation, accountability) is greenfield in flovenet. oasis has atomic invites but no
   genealogy.
3. **Identity recovery.** Spec wants social recovery; flovenet has none; **SSB fundamentally
   can't** rotate identity. This is the one place the spec and oasis are architecturally
   opposed — recovery would need a sidechain or a non-SSB identity layer.
4. **Privacy posture.** Spec is private-first; both flovenet (public reads) and oasis
   (public-default) are public-first today. A default inversion, not a redesign.
5. **Stars/stages/donation directing** are absent in both — pure additions.

## 4. Easy wins in oasis (low-effort spec alignment)

- **Circles** ← reuse SSB **tribes** as named circles (easy).
- **Presence (graded)** ← map existing activity timestamps to LIVE/RECENT/REACHABLE/DARK +
  an ephemeral non-replicated `ping` for "online now" (easy).
- **Private-first** ← invert message defaults to encrypted + explicit audience UI (moderate).
- **Stage gating** ← gate module access by existing karma/UBI signals (easy–moderate).

## 5. Resolved decisions (2026-06-18)

1. **Facet model → derive four facets as VIEWS.** Keep flovenet's working reputation engine;
   expose Personal/Local/Social/Global as derived views over inputs it already has
   (auth→Personal, invite-net→Local, trust_graph→Social, contribution→Global). No engine
   rewrite.
2. **Upper layer → flovenet `social_protocol` + oasis/SSB as a bridge** — *to be refined*
   (§6). Lean on flovenet for infra, bridge to oasis-style social where it's stronger; exact
   seam still open.
3. **Invite layer → frontend mock now + real path adapts oasis pub-invites** (extend atomic
   pub/tribe invites with a lineage `replaces` chain). Both treated as mocks/specs this round;
   not built in flovenet Rust yet.
4. **Recovery → accept "no recovery" for now.** Mock in the nety frontend (§6.7); real social
   recovery is an acknowledged hard future milestone, not a blocker. Honest about the SSB /
   flovenet limitation.

## 6. Resolved — the flovenet ↔ oasis bridge

1. **One Ed25519 keypair spans both layers.** Your single key is *both* the flovenet keystore
   identity *and* the SSB/social feed identity — derived into each layer, but one identity.
   Feasible because both stacks are already Ed25519; the keypair is the unifying thread (and
   the anchor for the §6.7 recovery story, even if recovery itself is deferred).
2. **flovenet's GraphQL gateway is the data bridge.** The upper (oasis-style) social layer
   **reads the portable trust base from flovenet's existing GraphQL gateway** — the four
   derived facets (§5.1), contributing stage, presence, and resource state (§7.3 portable
   base). Reuses the seam flovenet already ships rather than inventing a new translator.

**Net architecture:** one keypair → flovenet (lower: identity, reputation→4 derived facets,
trust graph, resources/scheduler) → **GraphQL gateway** → oasis-style upper layer (social
follows, tribes→circles, private-first messages, presence). The nety frontend is the visible
bridge; per-app overlays (§7.3) layer on top. This is the concrete backend realization of the
spec's two-layer design.

## 7. Data ownership map (who owns what)

> **Read in light of §0′/§9.** In the **flovenet-independent baseline, flovenet owns ALL of
> these natively** (circles, presence, social content included — §9a). The "SSB / oasis
> authoritative" entries below describe the **oasis add-on scenario** (§9b), where federation
> is opted in. So treat the SSB column as *"where it lives when the add-on is installed,"* not
> a dependency of the core.

Resolves the flovenet/SSB overlaps (add-on scenario). Authoritative store in **bold**.

| Data | Authoritative store | Surfaced / mirrored as |
|---|---|---|
| Identity (Ed25519 keypair, keystore) | **flovenet (lower)** | SSB feed derived from same key |
| Reputation / four facets | **flovenet** (derived views over its inputs) | read via GraphQL into upper layer + per-app overlays |
| **Trust graph + vouches** (feed scoring) | **flovenet `trust_graph`** (authoritative) | SSB follows = a social *mirror/view* of it |
| Invites / lineage | mock now; real = **SSB pub-invites + `replaces` lineage** (upper), **accountability/scoring computed in flovenet** | public invite tree in nety frontend |
| Resources / scheduling / stars / stages | **flovenet (lower)** | progress + stage board in nety frontend |
| Social content (posts, profiles, messages) | **SSB / oasis (upper)** | extended profily |
| MyNet f2f substrate | **flovenet** (peering/follow) | SSB social MyNet view |
| **Circles** = **Social facet** (Local = its parent scope) | **SSB tribes (upper apps layer ONLY)** — canonical | permission unit in profily |
| Permissions | authored upper (profily over tribes/circles); enforced via **SSB private msgs (`recps`)** + read-gating | coarse pickers on nety passport |
| Presence (graded) | **SSB** timestamps + ephemeral ping (upper) | + flovenet reachability (lower); graded glow in nety |

**Rule of thumb:** *scoring/identity/resources are authoritative in flovenet; social
content/circles/presence are authoritative in SSB/oasis; the GraphQL gateway carries
flovenet's portable base upward; vouches live in flovenet, follows mirror them in SSB.*

> **Naming:** the user-facing term is **"circles"** (preferred). **SSB "tribes" is only the
> under-the-hood storage primitive** we build circles on — it is never surfaced in the UI or
> the spec language. Everywhere below, "tribes" = implementation detail; "circles" = the name.

### 7.1 Which facets are "circles" — and on which layer

Not all four scopes are grouping constructs:
- **Social facet = circles** (the tiered rings + tag circles), with **Local as its parent
  scope**. **Circles exist in BOTH layers** — *nety circles* (lower) and *appy circles*
  (upper) run **parallel (the same circles), easily connectable** across the GraphQL bridge.
  When the oasis add-on is used, the appy side can be backed by tribes; natively both are the
  flovenet OR-Set circles (§9a).
- **Personal** (authentication) and **Global** (contribs) are **not circles** — they're
  scalar standing/identity constructs that live on the **lower (flovenet) layer** (keystore
  identity; reputation/resources). They surface upward via the GraphQL base but aren't
  tribe-backed.

So the facet↔layer split: **Personal + Global** are scalar standing (identity + contribution),
authoritative lower in flovenet; **Social = circles**, which exist in **both layers in
parallel** (nety circles ↔ appy circles, connectable); **Local** is the invite-lineage parent
that bridges them. Coarse circle/permission controls show on the nety passport
(public/all-MyNet/private); fine circle-level rules live in appy/profily.

**But circles reach down into the lower layer for donation directing.** Although circles are
*authored/stored* upstairs (tribes), they can be *referenced* as **targets of lower-layer
donation directing** (§8.2): a peer can choose to direct their nety resource donations **to a
named circle — e.g. "to my `close` ring, mostly or only."** So the lower layer doesn't *own*
circles, but it can *aim donations at them* (resolved via the GraphQL bridge: flovenet asks
the upper layer who's in the circle, then routes to those peers).

## 8. Adoption plan — copy oasis's matches, refine the conflicts

The strategy: **reuse oasis/SSB's working logic wherever it matches the spec**, and resolve
each conflict deliberately rather than rebuilding from scratch.

### 8a. Copy these (good parts / SSB matches to reuse)

| From oasis / SSB | Reused as (in the spec) | Notes |
|---|---|---|
| **Ed25519 feeds** | the shared identity (one keypair, §6) | already aligned — same key anchors flovenet + SSB |
| **`ssb-friends` follows + hops** | the **social follow mirror** of flovenet's trust_graph | follows mirror vouches; hops inform diversity |
| **Private messages (`recps`) + blocking** | the **permissions enforcement** mechanism (§6.6) | encrypt-to-audience is exactly per-area gating |
| **Tribes** | **named circles** (Social/Local, upper layer) | tribe-per-circle; the canonical circle store |
| **Offline-first gossip replication** | the **REACHABLE** presence state + content availability (§7.1) | "offline ≠ unreachable" is native here |
| **Activity timestamps + ephemeral ping** | **graded presence** LIVE/RECENT/REACHABLE/DARK | map existing buckets; add non-replicated ping for LIVE |
| **Pub / tribe invites** | base for **invite codes** (§6.1, §6.3) | extend with a `replaces` lineage chain |
| **LARP houses / ECOin-UBI plumbing** | optional scaffolding for **stars/stages** gating | reuse the karma/UBI routing to gate module access |

### 8b. Refine these (conflicts → resolution)

| Conflict | Refinement |
|---|---|
| **No resource mesh in SSB** | Don't force resources into SSB — **flovenet owns the lower layer**; bridge via GraphQL. The layer split *is* the resolution. |
| **No facet scoring** | Scoring stays in **flovenet** (4 derived facets); SSB follows feed only the **Social mirror**. Surfaced upward via GraphQL. |
| **Public-default privacy** | **Flip SSB defaults to private-first** — encrypt-by-default + explicit audience UI (§6.6). A config/UI inversion, not a redesign. |
| **No invite lineage** | **Extend SSB invites with a `replaces` ancestry chain**; accountability/scoring computed in flovenet. Additive. |
| **No donation directing** | **flovenet routes donations**, asking the GraphQL bridge for circle membership (§7.1, §8.2); optional SSB `donation` message for the social record. |
| **Identity non-recoverable (SSB)** | **Accept for now** (§5.4). The shared keypair + social vouchers are the *future* substrate for a recovery sidechain — deferred, not designed away. |

**Bottom line:** the spec is mostly **flovenet (lower) + a privacy-flipped, invite-extended,
score-bridged oasis (upper)** — copying SSB's mature social/offline/encryption logic and
adding only what's genuinely missing (lineage, donation routing, the GraphQL score bridge).

### 8c. Invite lineage — co-signed SSB edges

How the genealogy is built on top of SSB's atomic invites:
- **Lineage edge = a co-signed `invite-lineage` SSB message.** On registration, the edge
  (parent → child) is **co-signed by both inviter and invitee** — inviter attests "I let them
  in", invitee attests "I joined via X". Published to SSB so it's **public, replicated and
  traceable** (satisfies §6.4 flagging). Non-repudiable: neither side can later forge or deny
  it; nobody can claim a parent who didn't co-sign.
- **Single parent enforced** — exactly one accepted lineage edge per peer (the clean tree,
  §6.4); additional vouches are separate edges (the vouch web).
- **flovenet ingests the edges** via the GraphQL bridge to compute subtree credit, slash
  cascade, disown marks and invite budget (scoring stays lower-layer).
- **Disown** = a later signed `disown` message referencing the edge — it marks the edge
  publicly (visible "disowned" on the tree) but the **original edge stays traceable** (you
  can't erase that you let them in, §6.3).

### 8d. Donation routing — flow & rules

- **Intent:** declare a direct-donation — **target** (circle / peer / project) + **bias**:
  *mostly* (weighted preference) or *only* (exclusive target).
- **Timing — standing default + per-donation override:** set a standing policy ("always send
  my donations mostly to my `close` circle") that auto-applies, and override it on any
  individual donation.
- **Resolution + routing:** flovenet resolves the target — if a **circle**, it asks the
  **GraphQL bridge** for membership (circles authored upstairs) — then the **scheduler routes**
  the donated resources to those peers honoring the bias.
- **Overflow ("only" mode):** if the exclusive target can't absorb the donation, the surplus
  **falls back to the shared commons pool** — never idle, never auto-returned. So *only* =
  "exclusively this target, else the commons," and *mostly* = a weighted split.
- **Record:** an optional SSB `donation` message logs it per the donor's transparency choice
  (public ledger / contributor-visible / private, §8.2).
- **Pool stewardship (expert):** the same flow, directing from the pool rather than your own
  contributions.

### 8e. Private-first flip on SSB

Inverting oasis's public-default to the spec's private-first (§6.6):
- **Default audience = private.** New content defaults private (self / a default circle);
  you opt-in to widen per area. This is the one-line inversion of oasis's defaults.
- **Circles = SSB private groups (box2/envelope)** with a shared group key — posting to a
  circle **encrypts to the group key**, which scales past box1's ~7-recipient cap and reuses
  circles-as-tribes directly. **box1 `recps`** is kept only for tiny ad-hoc DMs.
- **Audience → SSB mapping:**
  - **private** → your own group / unshared.
  - **ring or tag circle** → that circle's **box2 group key**.
  - **all-MyNet** → the MyNet group key.
  - **public** → a plaintext public SSB message.
- **Public is a normal audience choice** in the picker (no special permanence prompt) —
  though note technically SSB's append-only log makes a public post **irreversible** (can't
  be narrowed later). Private-first defaults already protect against accidental exposure.

### 8f. GraphQL portable-base schema (the bridge contract)

The fields the upper (oasis-style) layer reads from flovenet's GraphQL gateway (§6.2 of this
doc). **The resolver enforces §6.6 visibility** — flovenet never ships raw private scores
upward; per-facet it returns `EXACT` / `TIER` / `HIDDEN` according to the subject's own
permission. Lineage and presence are always visible (invites are traceable §6.4; presence is
public §7.1).

```graphql
type PortableBase {
  peerId: ID!            # CIDv1 derived from pubkey
  pubkey: String!        # ed25519:...   (same key as the SSB feed)
  facets: Facets!
  stage: Stage!
  presence: Presence!    # always visible
  resources: ResourceState!
  vouches: VouchSummary!
  lineage: LineagePosition!   # always visible/traceable
}
type Facets { personal: FacetView!  local: FacetView!  social: FacetView!  global: FacetView! }
type FacetView {
  visibility: Visibility!   # resolver-enforced per subject's §6.6 setting
  value: Float              # 0..1, only when EXACT & permitted
  tier: Int                # coarse 1..5, when TIER
}
enum Visibility { EXACT TIER HIDDEN }
type Stage { level: StageLevel!  cu: Float  nextThresholdCu: Float }   # cu visibility-gated
enum StageLevel { NEWBIE KNOWN HOMIE EXPERT LEGEND }
type Presence { state: PresenceState!  lastActive: String }
enum PresenceState { LIVE RECENT REACHABLE DARK }
type ResourceState { roles: [NodeRole!]!  offeredCu: Float  drawableCu: Float }  # drawable gated by stage/floors
enum NodeRole { STORAGE COMPUTE AI SOCIAL VALIDATION }
type VouchSummary { received: Int!  weightedScore: Float }   # weightedScore visibility-gated
type LineagePosition { parent: ID  maturedDescendants: Int!  disowned: Boolean! }

type Query {
  portableBase(peerId: ID!): PortableBase!   # applies the VIEWER's permissions
  me: PortableBase!                          # your own — full EXACT
}
```

Maps directly onto flovenet types: `FacetView`←reputation_engine (derived views), `Stage`←CU
thresholds (§8.1), `Presence`←reachability+Activity, `ResourceState`←resource_manager/
scheduler, `VouchSummary`←trust_graph, `LineagePosition`←the co-signed lineage edges (§8c).

## 9. flovenet-independent build + oasis as an add-on

Per the governing stance (§0′): flovenet apps implement everything **natively**; oasis is
**opt-in**. Two halves.

### 9a. Lessons flovenet apps LEARN from oasis (absorb natively — no dependency)

Reimplement these *patterns* in flovenet's own stack; oasis is the teacher, not the runtime:

| Lesson from oasis / SSB | How flovenet apps absorb it natively |
|---|---|
| **box2 private-group encryption** | flovenet implements **native private groups** for circles — encrypt-to-group key, scales past small recipient lists. (Pattern learned; own crypto.) |
| **Follows as a social mirror of trust** | flovenet's `social_protocol` exposes lightweight **follows** as a mirror of the authoritative `trust_graph` (vouches). |
| **Offline-first / replication reachability** | flovenet's storage replication + gossip already give **REACHABLE** presence — adopt SSB's "offline ≠ unreachable" ethos natively. |
| **Private-first defaults** | flovenet apps **default to private** — fixing the exact gap oasis has (public-default). The lesson is what *not* to do. |
| **Co-signed invite lineage** | a **native flovenet invite module**: co-signed parent→child edges, single-parent tree, public/traceable (§8c) — modelled on but independent of SSB invites. |
| **Circles (from tribes)** | **native circles** (tiered rings + tag circles), learned from tribes but flovenet-owned. |
| **Local-first AI (the "42" ethos)** | **MyWizy runs on flovenet-native local AI** (`NodeRole::Ai`) by default — private, offline, FOSS — absorbing 42's local-first principle, not its code. |
| **LARP houses / ECOin-UBI gamification** | inform flovenet's **stages/stars** progression UX. |

**Native circles — implementation.** The greenfield piece, built on flovenet's existing
primitives (no SSB):
- **Membership = an OR-Set CRDT gossiped over libp2p gossipsub** — reuses the same CRDT +
  gossipsub stack flovenet already runs for reputation. Eventually-consistent, offline-
  tolerant; tiered rings + tag circles are each their own OR-Set group.
- **Encryption = a per-circle symmetric group key** (ChaCha20-Poly1305), **sealed to each
  member** (Ed25519→X25519 sealed box). Posting to a circle encrypts with the group key;
  ciphertext lives in the existing hybrid storage backend.
- **Forward secrecy = rotate the group key on member removal** — re-seal a fresh key to the
  remaining members so a removed peer can't read future content (re-key cost on churn
  accepted). This matters most for a `close` ring.
- **Permissions (§6.6)** then = "encrypt this content to circle X's current group key";
  donation directing (§8d) resolves circle membership from the same OR-Set.

**Native invite / lineage module — implementation.**
- **Invite codes = offline-verifiable signed tokens** — an inviter's Ed25519 signature over
  `{expiry, single|multi, nonce}`; anyone can verify it without the inviter online.
  **Single-use** is pre-committed; **multi-use** still requires the inviter to **co-sign each
  registrant** before the edge is accepted (per-registrant validation, §6.3).
- **Lineage tree = append-only signed records gossiped over libp2p** — each co-signed
  parent→child edge (§8c) is a signed record, gossiped and stored; the public tree is
  **reconstructed from edges**. Immutable, traceable, offline-verifiable — satisfies "can't
  erase who let you in" (§6.4). (SSB-like in spirit, flovenet-native.)
- **Budget integrity = eventual-consistency, soft-enforced.** There is **no central
  counter**; each issued invite is a public signed record. Over-issuance is **not
  hard-blocked** — brief drift is tolerated under network partition and **reconciled later by
  slashing** the over-issuer (excess invites flagged after the fact). This leans on
  flovenet's CRDT/eventual-consistency model + the §7.1 slash mechanism rather than strict
  pre-checks — fitting a P2P network with no global lock.

### 9b. oasis as an optional add-on (proposed implementation)

An **opt-in module**; flovenet apps are fully functional without it. When installed, it
integrates oasis where the user wants it:

- **SSB federation bridge** — sync flovenet social content ↔ SSB feeds so a flovenet user can
  **interoperate with the wider SSB / oasis network**. Identity bridges for free: the **same
  Ed25519 key** doubles as an SSB feed (the only place the §6 "one keypair, both layers"
  idea is used — and now it's *optional*).
- **"42" as an optional MyWizy engine** — register oasis's local gguf model as a **pluggable
  inference backend** for the athen-ia agents (alongside flovenet's native AI).
- **oasis social views** — optionally surface oasis's mature social UI for federated content.
- **Integration shape:** the add-on talks to flovenet through its **GraphQL gateway** + a thin
  SSB adapter; it reads the portable base (§8f) and maps flovenet circles/posts ↔ SSB
  groups/messages. Install adds capability; uninstall loses only the federation, never core
  function.

**Net:** flovenet apps are a complete, independent product that **learned the right lessons
from oasis**; oasis becomes a bridge to the broader SSB world for those who opt in.
