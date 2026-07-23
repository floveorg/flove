# nety — Access & Identity Ecosystem (Kinetic Mesh redesign)

**Date:** 2026-06-18
**Author:** Marc (marcflove)
**Status:** design — awaiting approval before implementation plan

> This spec lives under `flove/docs/`, which is gitignored (flove docs policy — local
> backups, not the Gitea workflow). The *code* changes DO follow the Gitea commit+push
> workflow at implementation time.

---

## Table of Contents

- [1. Goal](#1-goal)
- [2. Architecture — two domains + tier model](#2-architecture--two-domains--tier-model)
  - [2.1 The appy tier model (central organizing frame)](#21-the-appy-tier-model-central-organizing-frame)
- [3. Access & onboarding](#3-access--onboarding)
  - [3.1 Register (basic-tier — covered by the one inline script)](#31-register)
  - [3.2 Share resources → earn stars](#32-share-resources--earn-stars)
  - [3.3 Invites](#33-invites)
  - [3.4 Public invite web — two layers](#34-public-invite-web--two-layers)
  - [3.5 MyNet — your personal network (spans both layers)](#35-mynet--your-personal-network)
  - [3.6 Permissions layer — discretionary access control](#36-permissions-layer--discretionary-access-control)
  - [3.7 Key loss & recovery](#37-key-loss--recovery)
  - [3.8 Publishing & moderation queue](#38-publishing--moderation-queue)
- [4. Trust & identity model](#4-trust--identity-model)
  - [4.1 Trust scoring (the engine)](#41-trust-scoring-the-engine)
  - [4.2 Provisional weight table](#42-provisional-weight-table)
  - [4.3 Trust portability to apps](#43-trust-portability-to-apps)
  - [4.4 Verify section rendering — concentric scope rings (CSS-pure)](#44-verify-section-rendering--concentric-scope-rings)
- [5. Economy — stars, stages, donations](#5-economy--stars-stages-donations)
  - [5.1 Contributing-stage ladder](#51-contributing-stage-ladder)
  - [5.2 Donation directing — two degrees, donor-controlled transparency](#52-donation-directing--two-degrees-donor-controlled-transparency)
- [6. Honesty](#6-honesty)
- [7. Frontend — aesthetic / Kinetic Mesh](#7-frontend--aesthetic--kinetic-mesh)
- [8. Page structure](#8-page-structure)
- [9. Constraints](#9-constraints)
- [10. Linked pages](#10-linked-pages)
  - [10.1 `apps/profily.html`](#101-appsprofily-html)
  - [10.2 `apps/puzzy/sety.html`](#102-appspuzzysetyhtml)
  - [10.3 `apps/wizy.html`](#103-appswizyrhtml)
  - [10.4 `apps/index.html`](#104-appsindexhtml)
- [11. Implementation sequence](#11-implementation-sequence)
- [12. Verification](#12-verification)
- [13. Out of scope / future](#13-out-of-scope--future)

---

## 1. Goal

Redesign `apps/nety.html` into a **bold, maximalist "Kinetic Mesh"** landing whose
decoration *is* the P2P network, and grow it into the **access point** that bridges nety's
lower infrastructure layer to the upper flove apps layer: log into nety with your keypair,
share resources and receive trusts to earn **points/stars**, gather **invites + trust**,
and **reach contributing stages that grant passwords unlocking protected sections** of the
upper apps layer — where an extended profile and the full app ecosystem live. (Apps are free;
contribution earns access to protected/advanced sections, not the apps themselves.)

## 2. Architecture — two domains + tier model

This is the spine of the whole design. Keep the two layers visually and conceptually
distinct on the page.

| | **Lower layer — `nety`** (flovenet basic) | **Upper layer — `appy`** (the apps) |
|---|---|---|
| **Is** | **hardware** — P2P resource sharing (compute/storage/AI/network) | **data-software** — login + contents (the apps) |
| **You do** | log in (keypair), share resources, receive trusts + invites | use apps, build content |
| **Profile** | **`profily-mini`** — the basic identity card | **`profily`** — the full/extended profile |
| **MyNet** | **f2f layer** — direct friend-to-friend connections (the trusted-peer substrate) | **custom layer** on the f2f base — richer social graph, app contexts |
| **Circles** | **nety circles** | **appy circles** — **parallel to nety's, easily connectable** |
| **MyWizy** (athen-ia finetuner; **Wizy** = the app) | tunes **f2f connectivity** (peering/relay/replication) | tunes the **apps experience** (recommendations, sety/appy agents) |
| **Currency** | **earns** points/stars (progress from resources given + trusts received) | **reaches contributing stages** → granted **passwords** that open protected sections (apps stay free) |
| **Home** | `apps/nety.html` | `apps/index.html` (the appy gallery) + each app |

**Naming:** the lower layer is **`nety`** (flovenet's basic resource-sharing layer); the
upper apps layer is **`appy`**. The basic profile in nety is **`profily-mini`**; its full
counterpart in appy is **`profily`**. **Circles exist in both layers** — *nety circles* and
*appy circles* run **parallel (the same circles) and are easily connectable** — so circles
aren't upper-only; each layer has its own view, linked across the bridge.

**Three distinct access axes** (don't conflate them): **invites/trust** = network entry +
Sybil-resistant standing (§3.1–3.4, §4); **MyNet** = your personal f2f connections (§3.5);
**permissions** = discretionary access you grant (§3.6). Entry ≠ who you connect to ≠ what
you let them do.

### 2.1 The appy tier model (central organizing frame)

**Two parallel tiered domains.** The system is **`nety` (hardware)** and **`appy`
(data-software)** — each its own domain, each delivered in flove's tier model (mini → basic →
normal → advanced → super):
- **`nety` — hardware:** compute / storage / AI / network **resources**. Its tiers are a
  **quota ladder, not a feature ladder** — every tier shares the **same resource types**;
  higher tiers just raise **how *much* you contribute/draw** (mini = light client sharing →
  super = large-quota contributor). Giving nety hardware is the open on-ramp (§3.1).
- **`appy` — data-software:** the **apps, data, profiles, social**. Its tiers are a **feature
  ladder** — each tier adds more **software/data features** *and* unlocks more **trust scope**
  (the table below).

**The two ladders advance independently — and both feed your standing.** You progress in each
domain separately: a big **hardware** contributor can be low in **appy**, or vice versa.
Hardware contribution feeds the **Global** facet; software/social activity feeds **Personal /
Local / Social**. Either path raises your overall stage — which is exactly why you can *skip
nety contributions and substitute more authentication/trust* (see the substitution path
below). They run **in parallel and connect** (one keypair, parallel circles, the trust
bridge §4.3). The table
below is the **appy (data-software) feature ladder**.

| Tier | flove frontend tier (JS budget) | Integrates (app) | Trust scope it adds |
|---|---|---|---|
| **mini** | pure CSS (0 JS) | **`nety`** — network **resource** sharing | **Global** — the contribution scope |
| **basic** | CSS + small inline script | **`profily` + apps** — **minimal flove access: play & store apps in your profile** | **Personal** (auth/trusts) + **Local** (invites network) + **simple Social** |
| **normal** | CSS + small inline script | **`sety`** — *pseudo-scaled nety, but for **data management*** | **further trusts** (deeper Social) |
| **advanced** | full JS app | **`MyWizy`** finetuner | **complex trusts** |
| **super** | full stack | **everything, integrated** | all scopes, full complexity |

- **nety / mini = the Global (contribution) base** — network resources. Every higher tier
  layers richer apps + more trust on top.
- **sety = "pseudo-scaled nety" but for *data management*** (nety governs network resources;
  sety governs data) — the `normal` tier.
- This **unifies three axes at once**: the flove frontend tier (JS budget) ↔ the app
  integrated ↔ the four facets/trust scopes unlocked. Read the four facets (§4) as coming
  online tier by tier: **Global @mini → Personal+Local+simple-Social @basic → deeper Social
  @normal → complex trust @advanced**.
- **Two distinct things: your earned LEVEL vs the MODE you browse in.**
  - **Level / stage** (`newbie · known · homie · expert · legend`, §5.1) = what you've
    *earned*. Reaching the next stage **grants access to a new layer of complexity-features**.
  - **Tier / mode** (`mini · basic · normal · advanced · super`) = the interface you *choose*
    to use. Your stage sets the **ceiling**; you freely pick any tier *at or below it*, and the
    new features are **optionally activatable** — you don't have to use them. **A `legend` can
    choose to browse in `mini` or `basic`.** Earned level ≠ chosen mode. Ceiling mapping:
    **newbie→mini · known→basic · homie→normal · expert→advanced · legend→super**.
- **More than one path up — facets are substitutable.** Advancement is resource-contribution-
  driven by default (share nety resources → Global). **But you can *skip nety contributions*
  and compensate by *giving more authentication / trust*** (Personal identities, Social
  vouches, Local invites). Little Global? Make it up with more Personal/Social. The stage you
  reach reflects the *blend* of facets, not contribution alone (subject to the §5.1 trust
  floors on sensitive unlocks).
- **`basic` is the entry threshold that matters.** `mini` (`nety`) alone is just the resource
  base; **`basic` is the minimal access to *actually use* flove — play apps and store them in
  your profile (`profily`)**. You reach it either by sharing nety resources **or** by giving
  more authentication/trust (the substitution above) — so even a non-contributor can get in by
  verifying themselves.
- **Access gating sits at the `mini → basic` boundary:**
  - **`mini` (`nety`) is open / permissionless** — anyone can **freely download the client,
    contribute resources to nety, and get a web miniprofile (`profily-mini`)**. No invite
    needed; contribution is open to all.
  - **`basic` (`appy`) requires entry** — crossing into appy (play & store apps) needs **one
    of: an invite, self-authentication, earned points, or curator admission** (§3.1 paths
    A–D). So: *contribute openly at mini; enter appy by one of those four routes.*
  - **`normal` requires curator approval** — beyond basic, stepping up to the **normal** tier
    **definitely needs a volunteer curator's approval** (§3.8); you cannot contribute or
    self-verify your way to normal alone. Curators are the human gate above basic.
- **`super` is left open for now** (deferred, §13) — mini→advanced are concrete above; super
  = "the full stack, integrated." Candidate directions to choose later: **network powers**
  (pool stewardship, donation directing at scale, promotion/governance, hosting/vouching
  others) **or self-sovereignty** (run your own full node, host others). Not pinned this
  round. <!-- ↗ pendings:#NEC01 -->
- **nety hardware quota levels are also open** (deferred, §13) — the ladder stays a *quota
  ladder* conceptually (same resource types, more capacity per tier, mini = light client →
  super = large contributor); concrete per-tier quotas are not pinned this round.
  <!-- ↗ pendings:#NEC02 -->

**Flow:** contribute in the lower layer → cross contributing **stages** → granted
**passwords** that open protected sections of the upper layer. `nety` is where you log in
and accrue contribution (stars = progress); reaching stages grants access (nothing is
spent). nety's Access section is the visible bridge between the two and links up to
`apps/index.html`.

## 3. Access & onboarding

A glowing **passport** card: sign in once with your nety keypair. This is **`profily-mini`**
— the open **web miniprofile** you get just from running nety. It shows: **@handle / peerId**,
your **hardware contribution** (resources shared → Global), **live presence**
(LIVE/RECENT/REACHABLE/DARK, §4.1), and your **stage badge** (`newbie`…). It's a public card
proving you're a real contributing node — the **seed of the full `profily`**, which lives in
**appy** (upper layer, §10.1).

**Onboarding — first-use walkthrough (CSS-pure, always-visible).** Because nety is the
`mini`/pure-CSS tier (the localStorage "loud-first-time" onboarding is N/A here), onboarding
is an **always-visible numbered "first steps" strip** near the top — no JS, dismissible via a
CSS checkbox. It walks the **full on-ramp (mini → appy)**:
1. **What nety is** — the open hardware/resource layer.
2. **Run the client / contribute hardware** (open, no invite).
3. **Your `profily-mini` appears** — you're a real node now.
4. **Get an invite** (~3/month vertical web-of-trust), **verify yourself** (auth
   substitution, §2.1), **or earn points** (share hardware / publish approved content, §3.8).
5. **Register into `appy`** (§3.1) → **play & store apps**.
Each step highlights the section it points to; completed steps dim (CSS `:has()`/checkbox).

### 3.1 Register (basic-tier — covered by the one inline script)
- **What registration is:** crossing from open `mini` (`nety`) into **`basic` `appy`** (§2.1)
  — running the nety client + having a `profily-mini` needs **no registration**; *registering
  into appy* (play & store apps) is the gated step here.
- **Paths into `basic` (any works):**
  - **A · invite code** — enter via someone's signed invite (web-of-trust, the default;
    instant + a warmer starting standing).
  - **B · authenticate yourself** — link enough identity instead of an invite: **Telegram**
    (the verified minimum), **email**, **phone**, **biometrics** (+ self-asserted social
    links, weighted by §4.2). The **auth substitution** (§2.1) — you vouch for yourself via
    verification rigor. Starts lower / may face more scrutiny than an invite.
  - **C · earn your way in** — accrue enough **points** by **sharing nety hardware** and/or
    **publishing approved content** (§3.8); a gradual, contribution-based entry for those with
    no invite who'd rather build standing than just self-verify.
  - **D · curator admission** — a **volunteer curator** (§3.8) admits you into basic *without*
    an invite, on the condition that you **authenticate yourself further**. A discretionary,
    human on-ramp for the invite-less.
- Real form: **invite code** *(or)* the **authenticate panel** (Telegram/email/phone/…),
  **@handle**, **display name**, **generate keypair**.
- **Appy registration is gated** — by an invite code **or** sufficient authentication. You
  enter via someone's signed invite
  (Web-of-Trust entry, the ~3/month vertical invites §3.3). Invalid/empty code → blocked state.
  (Mini/nety contribution stays open and un-gated.)
- Inline script echoes **live outputs**: validated `@handle`, derived `peerId`, and a
  signed **invite link** to pass on.

### 3.2 Share resources → earn stars
- Offer compute / storage / AI (reuses existing demo-3 role + meter pattern). Each share
  **credits stars** to your balance (§5). Mock, but the balance is real client-side state.
- Beyond sharing, advancing through contributing **stages** (§5) unlocks **further
  lower-layer resources** and **donation directing** — routing donated/shared resources to
  projects or peers you choose.

### 3.3 Invites
Invites are how new peers register (§3.1) and a way trust propagates. **Two issuance
modes, both drawing from the same budget:**
- **Single-use code** — a unique signed code pre-committed to one specific person; consumes
  it on registration. Clean 1:1 lineage, no extra step.
- **Multi-use link (capped)** — a shareable link for a group/broadcast, but **each
  registrant must be validated by you before they're let in**. The link only lets people
  *request* to join; you approve each one, so you never auto-vouch for strangers. Every
  approved joiner still records its own single-parent lineage edge to you. A pending request
  you don't act on **auto-lapses after 72 hours** (the slot was never committed, so nothing
  is spent); your passport shows pending requests and their countdown.

**Revocation — revoke + disown:**
- **Revoke unused** codes/links anytime → refunds your budget.
- **Disown a joined invitee** (e.g. they went bad) → severs your accountability for them,
  but **costs Local score** (invite net) and leaves a visible **"disowned" mark** on the public tree
  (you can't quietly erase that you let them in).

**Invite budget — a monthly rate, scaling with accountability.** Default standard:
**~3 invites per month per user** (a replenishing monthly rate, not a one-time allowance),
**scaling up with your Local facet** (invite net, §4.2) — newcomers near the 3/month baseline,
trusted peers more. Invitees' outcomes **reflect back** — if someone you invited (and didn't
disown in time) is slashed for abuse, **your budget and Local score take a hit**. Inviting well
compounds standing; inviting bad actors costs you. The passport shows this month's allowance
(used / remaining) and pending validations.

**Bootstrap — vertical growth through the human web of trust.** During the **first stage**,
access to **basic appy** (play & store apps, §2.1) spreads **vertically** down the invite tree:
each person invites others as a human web of trust, growing the network organically generation
by generation (the 3/month rate paces it). This human-driven vertical propagation *is* the
early-network bootstrap — no open signup, only earned/invited entry.

### 3.4 Public invite web — two layers

The web is **two distinct structures**, deliberately separated:

1. **Invite tree (lineage) — single parent.** You enter via exactly **one** invite, so the
   "who let you in" graph is a clean **tree**: one parent per peer, unambiguous lineage.
   This is what's **public** and what drives **invitee accountability** (§3.3 — your one
   parent is answerable for you) and invite-graph position.
2. **Vouch web (standing) — many-to-many.** After entry you accumulate additional vouches
   from other peers; these add **web edges** that feed your **Social facet** (§4.2:
   `+5 × voucher's score` each) **without changing your tree parent**. Gathering more
   high-standing vouches over time strengthens you; it never rewrites your lineage.

**Rendering (CSS-pure):** an SVG node-graph reusing the orbiting-node / link-line
vocabulary — the **invite tree drawn as solid lineage links**, **vouch edges as fainter
overlaid threads**. **You** are highlighted; your parent → your invitees are traced; hover/
`:has()` spotlights a branch. Public by design — transparency shows how trust entered and
spread (reinforces Web-of-Trust legibility, F7).

**Invites are non-private — public or traceable, for flagging.** Unlike facet scores (which
are owner-gated, §3.6/§4), the **invite lineage is never hidden**: it stays **public, or at
minimum traceable**, so that when a peer is **flagged/reported**, the chain can be followed
for the **accountability cascade** (§4.1) and **disown marks** (§3.3). You can keep your
*numbers* private; you cannot hide *who let you in* or *whom you let in*. (The richer
**vouch** edges may follow score-style visibility, but the **lineage tree** is always
traceable.)

### 3.5 MyNet — your personal network (spans both layers)

Distinct from the invite lineage and from global trust: **MyNet is the circle of peers
*you* explicitly add/connect to.** Inviting someone and adding them to MyNet are **separate
acts** — "**add in MyNet**" is an additional action offered in the invite flow (and
available anytime on any peer), so you can add people you didn't invite and invite people
you don't add. MyNet is **your** curated graph; it is not the public invite tree.

**Two tiers, mirroring the architecture (§2) — with circles in BOTH:**
- **In nety — the f2f layer.** MyNet is your **friend-to-friend** substrate: the direct,
  trusted peer connections you actually link to. This is the lower-layer reality — who you
  peer with, the transport/trust base. **nety has its own circles here.**
- **In appy — the custom upper layer.** Built on the f2f base, appy presents a **richer,
  customizable MyNet**: **named circles**, app-specific contexts, and the social
  relationships surfaced in the full profily (§10.1).
- **Circles run parallel across both layers** — *nety circles* and *appy circles* are **the
  same circles, easily connectable** (linked across the GraphQL bridge). So a circle isn't
  upper-only; each layer holds its view and they stay in sync. Circles come in **two
  coexisting kinds** (use either):
  - **Tiered rings** — concentric, ordered by intimacy: `close ⊆ friends ⊆ MyNet`. Granting
    an outer ring automatically includes the inner ones. For graded trust.
  - **Tag circles** — flat, independent labels (`collaborators`, `bookclub`) with no implied
    nesting; **may even include peers outside MyNet**. For project/context groups.
  Both serve as the unit for permissions (§3.6).

**MyWizy — your athen-ia finetuner, inside MyNet (spans both layers).** **Wizy** is the app
in nety-apps (`apps/wizy.html`, §10.3) — the general athen-ia finetuner-agents tool;
**MyWizy** is **your personalized instance, living in MyNet**, which finetunes **two
things** mirroring the architecture (§2):
- **nety connectivity (lower layer)** — how your **f2f mesh** behaves: peering, relaying,
  replication/pinning, discovery reach, privacy posture. **Policy-bounded autonomy:** *you*
  set the goals + **hard budgets** (max bandwidth/storage, privacy posture, "favor MyNet");
  **MyWizy auto-optimizes** peering/relay/replication **within those bounds** and **explains
  its choices** — control where it matters, automation for the rest. The agent never exceeds
  a budget or relaxes your privacy posture on its own.
- **the apps upper layer** — your **apps experience**: recommendations and the athen-ia
  agents surfaced in sety/apps (Summaries, Suggestions, Matches…). Same **policy-bounded**
  model — you set preferences/limits, MyWizy tunes within them and explains its picks.

Wizy is where agents are defined/tuned in general; MyWizy is your activated set, tuning both
your connectivity and your apps. (Referenced here; its management surfaces in the extended
profily / Wizy app — not built into nety.html this round.)

CSS-pure: in nety, a compact f2f MyNet panel on the passport (add / in-circle toggles via
checkbox/`:has()`); the full custom MyNet + MyWizy management lives in the extended profily
and the Wizy app.

### 3.6 Permissions layer — discretionary access control

**A separate layer from invites and from trust scoring.** Invites = entry; trust score =
network-computed standing; **permissions = what you explicitly let specific peers do or
see.** You grant them; they're yours to set, independent of anyone's global score.

**Governs (all four):**
- **Content/pages** — who can read your published static pages, posts, files.
- **Shared resources** — who can draw on the compute/storage/AI you offer.
- **Profile data** — field-level visibility of your extended profily (contacts, stats,
  offers).
- **Facet scores & standing** — **per-facet** visibility of your Personal/Local/Social/Global
  scores and your stage, as **exact numbers or a coarse tier**, to public/MyNet/circles.
  **Default private** (private-first). Note: this controls *human display only* — the
  protocol still computes with your true scores (so vouch-weighting works), and the invite
  *tree* stays structurally public (§3.4); only the *numbers* are owner-gated.
- **Interaction/social** — who can message you, request to join via you, vouch-interact, or
  add you to *their* MyNet.

**Granted to MyNet + named circles.** The unit of access is your **whole MyNet** and/or
specific **circles** — tiered rings or tag circles (§3.5) — e.g. "pages → `collaborators`
tag", "resources → all MyNet", "contact field → `close` ring". Granting an **outer ring**
includes its inner rings; granting a **tag** includes exactly its members (possibly
non-MyNet peers).

**Defaults — private-first, opt-in to share.** Every area starts **private** (or, where a
sensible minimum exists, MyNet-only); you deliberately widen each to a ring/tag/public.
Nothing leaks by accident — visibility is always a choice you made. (FOSS-aligned, safest.)

**Relationship to trust:** permissions are *discretionary* (you choose), whereas trust
gates (§4) are *network-computed* (Sybil/standing). A capability may require **both** — e.g.
publishing needs trust ≥ Telegram (§4) **and** your per-page audience permission (§3.6).
They compose; neither replaces the other.

**Where each is set (matches the two-layer split):** nety's passport handles the **coarse**
audiences that exist at the f2f layer — **public / all-MyNet / private** — as quick per-area
pickers. **Named-circle** grants (since circles are the apps-tier custom layer, §3.5) are
authored and applied in the **extended profily**. So nety shows and sets the broad strokes;
profily does the fine-grained circle rules.

CSS-pure: per-area audience pickers as radio/checkbox groups on the passport (coarse) and in
extended profily (full circle-level).

### 3.7 Key loss & recovery

Identity is a keypair, so losing it must not mean losing your standing. **Recovery rebinds
your identity to a new key — it's a rotation, not a restart.**

- **Self-backup (primary).** You hold a backup (seed phrase / offline key) and can **rotate
  yourself** anytime: the old/backup key signs a rotation attestation, and the network maps
  old → new. No central reset, no probation.
- **Social fallback.** If the backup is also lost, a **quorum of your MyNet / vouchers
  co-signs** to bind a new key to your identity — pure Web-of-Trust recovery, leaning on the
  trust web you already have.
- **Standing carries forward.** The new key inherits **all four facets, your stage, your
  invite-lineage position, and your MyNet**. The public invite tree shows a **key-change on
  your existing node** (continuity preserved — not a new node, lineage intact).
- **Probation after *social* recovery.** A socially-recovered identity enters a short
  **verification/probation window** before full capabilities resume — a guard against a
  **hijacked recovery** (someone coercing a quorum). Self-rotation with your own backup needs
  no probation.
- **Compromise ≠ loss.** A *stolen* key is different: your vouchers/MyNet can **flag a
  compromised key** and authorize rotation/revocation, severing the attacker's key.

This round: CSS-pure illustrative mock (backup prompt, social-quorum visual, "rotated ✓ ·
in probation" badge on the node); real crypto/recovery is deferred (§13).

### 3.8 Publishing & moderation queue

Once you're **≥ Telegram-verified** (the publish gate, §4), you can publish to your space on
the mesh. **What you can publish:**
- **Static HTML pages** — your own page/site (the §4 "publish a static page" capability).
- **Posts / notes** — short content to the network / your circles.
- **Files / media** — images, documents, media (pinned/shared).

**Everything published enters a moderation queue.** Items go **pending → reviewed → live** —
nothing is public until it clears the queue. Your passport / `profily` shows your queue
(pending vs live counts), and audience still follows your permissions (§3.6) + the publish
gate.

**Approved content earns you points.** When a queued item **clears moderation (→ live)**, it
**credits you points** — so publishing useful, approved content is a **third path into
`basic`** (alongside sharing nety hardware and invites/auth, §3.1/§2.1) and a way to advance.
Only *approved* items pay out (pending/rejected give nothing), which is what makes the
moderation queue worth passing.

**Content engagement (on live content).** Once an item is live, peers engage with it:
- **Likes** — any peer (your "homies" and beyond) can **like** live content. Likes are a
  lightweight peer endorsement: they surface good content, lightly credit the author
  (engagement → a small Social/standing nudge), and help curators see what the network
  values. ("A brave homie gives it a like.")
- **Further references** — content can carry **references**: citations/links to sources or to
  **other peers' content** (cross-linking the mesh), adding credibility and depth.
- **Comments / replies** — threaded discussion on live content (subject to your permissions
  §3.6 + the publish gate).
- **Reposts** — propagate a piece through your part of the web (it travels the vouch/invite
  mesh), with attribution to the original author.
- **Report / flag** — peers can flag live content, sending it back to the curator queue for
  review (ties to the abuse/slash flow, §4.1).
All engagement is mock/illustrative this round; the real ranking/anti-gaming of likes/reposts
is deferred (§13), like the curator mechanics.

**Who moderates — volunteer curators.** The queue is reviewed by **volunteer curators**:
peers who opt in to curate (drawn from sufficiently-trusted/higher-tier members). They
approve/reject queued items, and their role extends into onboarding and progression:
- **They can admit someone into `basic` without a trust-invite** — a curator's approval
  (combined with the user **authenticating themselves further**) substitutes for an invite
  (§3.1, path D). A discretionary, human on-ramp for the invite-less.
- **Curator approval is *required* to reach `normal`** (§2.1) — you cannot contribute or
  self-verify your way to the normal tier alone; a curator must approve the step up.

**This round mocks it** — a CSS-pure "pending → curator review → live / admitted" state; the
finer curator mechanics (how curators are selected, quorum size, accountability) are **light
this round / deferred** (§13).

## 4. Trust & identity model

A horizontal **trust ladder** raising your tier from two sources:
1. **Linked identities** — each a checkbox toggle lighting its rung and nudging a
   reputation meter (pure CSS). Two distinct things determine weight:

   **(a) Are *we* verifying it?** — for now, **only Telegram** carries a real
   proof-of-control challenge. **Everything else is a self-asserted link with no proof yet**
   (social profiles, and the Phone/Email/Biometrics rungs too — real verification for those
   is later, biometrics on the F4 roadmap). Telegram being the one *verified* rung is
   exactly why it's the **publish minimum**; unverified links alone can't publish.

   **(b) For unverified self-asserted links, how strict is the *platform's own* signup
   bar?** A profile link inherits a fraction of the site's KYC strength based on what that
   site actually demands at registration — **regardless of the site's category**:
   - **idealista.com requires a phone number to register** → an idealista profile link
     weighs **more**.
   - **Instagram lets you register without a phone** (email is enough) → an Instagram
     profile link weighs **less**.

   So among unverified links, "does this platform force a phone?" grades them; all of them
   still sit **below** verified Telegram.
2. **Trusts / vouches received** — more vouches raise you further **and credit stars**
   (§5). Connects to profily's **Trusts** panel and nety's reputation/WoT layers (F6/F7).

A **"what each tier unlocks"** element makes trust-gating legible: higher tier = more
capabilities, more invites, promotion within the network. (Distinct from contributing
*stages*, §5, which grant passwords to protected sections — trust tier gates *capabilities*,
stages grant *access*; they compose.)

**Concrete gate — publishing:** **publishing a static HTML page** (your own page/content
to your space on the mesh) requires a **minimum of Telegram verification**. The ladder
shows this explicitly — the "Publish a static page" capability is locked until the Telegram
rung is linked, then unlocks. This anchors the abstract tiers in one tangible action and
demonstrates step-up gating (anonymous → Telegram-verified → can publish).

### 4.1 Trust scoring (the engine — model decided, weights/thresholds provisional)

Everything gated above is governed by **trust scoring**, not hard-coded per-feature rules.
Capabilities, gates, app tiers and promotion are thresholds on it. The **model** below is
decided; the **numeric weights and thresholds** are provisional illustrative values for the
mock, expected to be refined later. The UI must make scoring legible: show the facet
scores, what feeds each, and what the next threshold unlocks.

**Four scoped facets.** Trust is not one number but four sub-scores organized by
**concentric scope — personal → local → social → global** (you → your invitees → your
vouchers → the network), each fed by distinct signals so capabilities gate on the relevant
facet:

| Facet (scope) | Fed by | Gates (examples) |
|---|---|---|
| **Personal — authentication** | linked identities. **Telegram** = the one *verified* rung (proof-of-control) → publish gate. **All others** self-asserted, no proof yet (incl. Phone/Email/Biometrics, verified later); unverified links sub-graded by the **platform's signup bar** (idealista forces a phone → weighs more than Instagram) | **publishing** (≥ verified Telegram), account-sensitive actions |
| **Local — invite net** | your **invite-tree position**: matured invitees (subtree credit), who invited you | **invite allowance**, local promotion |
| **Social — trusts** | **vouches received**, weighted by the voucher's own score AND diversity (transitive WoT, collusion-resistant) | standing/reputation, higher app tiers |
| **Global — contribs** | **resources shared** to the whole mesh over time | drawing large resources, **star mint-rate**, contributing stages (§5.1) |

Maps onto nety's reputation / Web-of-Trust layers (F6/F7). The **Global** facet has two
dimensions: a **scored** part (contribs track-record) and a **presence** part (**Activity**,
below) — Activity lives *inside Global*, is purely visible, and does **not** feed the scored
value.

**Score visibility is owner-controlled (private-first).** Your facet numbers/tier are
**private by default**; you reveal each facet (exact or coarse tier) to public/MyNet/circles
via the permissions layer (§3.6). This is *display only* — the protocol always computes with
true scores, so vouch-weighting and gating still work even when a peer keeps their numbers
hidden; only the human-visible figure is gated. Activity presence and the public invite tree
remain visible regardless.

**Activity — the presence dimension *inside the Global facet* (NOT decay of earned
standing).** Inactivity does **not** erode your earned standing. Personal/Local/Social/Global
are a durable **track record** — what you verified, who you brought in, who vouched for you,
and what you contributed all stays. Recency is the **Global facet's presence dimension**,
**Activity** — a **purely visible presence signal** (public on your node in the invite web
and on your profile) sitting alongside Global's scored contribs part. It **gates nothing,
changes no scores, and modulates no perks** — its only effect is social: whether peers choose
to vouch for or rely on you. The scored standing is wholly independent of it.

Because nety is **offline-first P2P** (your content can be served by peers' replicas even
when your device is dark), presence is **graded, not binary**:
- **LIVE** — node online now (recent mesh heartbeat).
- **RECENT** — acted within the last N days (posted/vouched/validated/shared).
- **REACHABLE** — node offline, but your content/identity is replicated/pinned by peers, so
  you're still usable. ("Offline" ≠ "unreachable".)
- **DARK** — neither online nor replicated; effectively unreachable.

Rendered CSS-pure as a four-state glow/badge on your node and profile.

**Dynamic (earned facets can still decrease — but only by these, never idleness):**
- **Abuse / reports slash** the relevant facet — **graduated + bounded cascade**:
  - **Graduated severity:** the cut scales with the offense — minor = a partial facet
    reduction, severe = the facet near-zeroed.
  - **Bounded cascade:** blame flows up to the offender's **inviter and vouchers**, but
    **decayed by the same γ** per hop and applied **only to those who didn't disown/revoke
    in time** (§3.3). Collateral is proportional, never total — one bad actor can't nuke
    everyone above them.
  *(The mock just demonstrates a "reported → slashed → cascade" state; the real adjudication
  flow — weighted peer reports, trusted jurors, staked reporting — is deferred, see §13.)*
- **Transitive drop:** if a voucher loses standing or revokes a vouch, your vouched Social
  trust drops with it.
- **Invitee accountability (downward):** if someone you invited is slashed for abuse, your
  Local score and invite budget take a hit (§3.3) — you're partly answerable for who you
  brought in.

**Stars flow from score (tap → bucket).** Your trust score sets the **rate** at which you
mint stars from activity (sharing resources, receiving vouches) — higher standing mints
faster, **Global facet** (contribs) weighing most. Stars **accumulate as a progress
measure** — they are **never spent or deducted**; crossing a contributing **stage** (§5.1)
is an achievement that grants access, not a purchase. Score = who you are (gates
capabilities); stars = your accumulated contribution progress (drive stages). They share
inputs but are distinct axes.

**For this build:** illustrative, clearly-labelled provisional numbers — four 0–1 **earned
facet** meters (Personal/Local/Social/Global), with the **Global** meter pairing its scored
contribs part with its **Activity** presence indicator, in Verify; example rung weights,
example gate thresholds, a visible mint-rate
driven by score — so the *model* is demonstrated without claiming the values are final.

### 4.2 Provisional weight table (decided ordering, numbers illustrative)

Points per action on an illustrative scale, with **per-group caps / diminishing returns**
so no single channel can be farmed. Ordering is decided; magnitudes are tunable later.

**Personal facet (authentication) — personhood proof (low → high).** Verified-by-us always
beats self-asserted links; biometrics on top; Telegram is the publish gate mid-ladder.

| Signal | Weight | Rationale |
|---|---|---|
| Social link, **email-only** platform (Instagram, Reddit) | **+1** (cap ~3) | self-asserted, weak platform bar |
| Social link, **phone-required** platform (idealista) | **+3** (cap ~9) | self-asserted, but platform forced a phone |
| **Verified email** | **+6** | we confirm control, but email is cheap/infinite |
| **Verified Telegram** ✦ *publish gate* | **+12** | the one rung we verify now (proof-of-control) |
| **Verified phone** (SMS/SIM) | **+16** | real SIM, harder to mass-create |
| **Biometrics** — privacy-preserving **proof-of-uniqueness** (liveness → non-reversible one-per-person token; **raw biometrics never stored**) | **+30** | scarcest personhood signal, no biometric honeypot (FOSS-aligned) |

**Local facet (invite net) — your invite-tree standing.** Driven by *who you brought in* and
*who brought you*. Giving invites is +0 direct; you gain only when invitees mature.

| Signal | Weight | Rationale |
|---|---|---|
| Invite **given** | **+0 direct** | can't mint standing by handing out invites |
| Being **invited** by a peer | **+1 × inviter's score** | inherits a little of who vouched you in |
| Invite you gave that **matures** | **+4** | rewards good curation |
| Invitee **slashed** | **− penalty** | downward accountability (§3.3) |
| Matured **subtree** (descendants) | decayed sum (below) | depth+breadth of the network you seeded |

**Social facet (trusts) — vouches received.** Receiving beats giving; **giving a vouch is +0
direct** (no trust-farming).

| Signal | Weight | Rationale |
|---|---|---|
| Vouch **given** | **+0 direct** | can't mint standing by handing out vouches |
| **Vouch received** | **+5 × voucher's score × diversity** | main driver; high-standing + independent vouches worth most (collusion-resistant, below) |

**Matured (defined).** An invitee has **matured** once they have, *independently of their
inviter*: **(a)** cleared a personhood bar on their own — **≥ verified Telegram** (Personal
facet) — **and (b)** received **≥1 vouch from someone other than their inviter**. Both
conditions come from outside the inviter, so a sponsor cannot self-manufacture matured
nodes — this is what makes subtree credit and the `+4`/budget rewards hard to fake. Until
both hold, an invitee is *pending* and contributes nothing to anyone's subtree credit.

**Invite-graph position (Local) — quality-gated, distance-decayed subtree credit.**
On top of the per-event rows above, your standing in the **invite tree** (§3.4) contributes
to the **Local facet** from the subtree you seeded:
- **Only matured descendants count** — a descendant adds credit only once they pass a trust
  threshold; raw never-established invitees add nothing (shallow spam is worthless).
- **Distance decay γ ≈ 0.4** per generation: direct matured invitee = full (`+4`), their
  matured invitee = `×γ`, the next `×γ²`… a decaying tail.
- **Balance depth vs breadth:** decay is steep enough that deep chains don't run away, and
  the **breadth cap is set high** so a wide set of good direct invitees scores comparably to
  a deep narrow lineage — neither pure fan-out nor pure depth wins.
- **Per-generation and total caps** so no subtree can dominate the facet.
Formally (provisional): `subtreeCredit = Σ_descendants matured(d) · base · γ^(depth(d)−1)`,
capped per depth and overall.

**Collusion resistance — diversity-weighted vouches.** The `+5 × voucher's score` for a
received vouch is further multiplied by a **diversity factor** measuring how *independent*
the voucher is from you: vouches from peers densely interlinked with you (shared inviter,
mutual vouches, same tight cluster) are **discounted**; vouches from distant, independent
parts of the web count **full**. A mutual-vouch ring therefore inflates almost nothing —
its members are maximally non-diverse to each other — so cartels **self-cancel** without
needing to be detected or named. (Provisional: factor ≈ a normalized graph-distance /
low-common-neighbor measure between voucher and recipient.)

**Global facet (contribs + presence)** — its **scored** part is resources shared over time
(compute/storage/AI), a durable **track record** that does **not** decay from idleness
(§4.1) and sets the **star mint-rate** (§5). Its **presence** part is **Activity** (§4.1) —
visible only, neither feeding the scored value nor affecting mint-rate.

### 4.3 Trust portability to apps (portable base + per-app overlay)

The same **base + custom** spine as MyNet (§3.5) and MyWizy: your nety standing ports
upward, and apps extend it locally.
- **Portable base.** Your four nety facets (Personal/Local/Social/Global), contributing
  stage (§5.1) and presence (§4.1) port to the **whole apps layer** as the baseline — every
  app reads them; one earned standing, visible everywhere.
- **Per-app overlay.** Each app may layer its **own context-specific reputation** on top
  (e.g. a marketplace app adds a *trade rating*, a forum a *helpfulness* score) **without
  altering the nety base**. So a strong resource-contributor and a strong marketplace-trader
  aren't flattened into the same number.
- **Apps gate on base, overlay, or both** — their choice. The base keeps trust portable;
  the overlay keeps it context-aware.

### 4.4 Verify section rendering — concentric scope rings (CSS-pure)

The four facets render as **nested concentric rings** that literally draw the scope nesting,
reusing the Kinetic Mesh orbit motif:
- **Rings, inner → outer: Personal · Local · Social · Global** — with **you at the core**.
  Each ring's **arc fills + glows by its facet score** (SVG circle `stroke-dasharray`, or a
  conic-gradient mask — both CSS-pure).
- **Activity pulses on the outer Global ring** — its glow encodes the presence state
  (LIVE = bright pulse · RECENT = steady · REACHABLE = dim · DARK = hollow), matching §4.1.
- **Identity ladder feeds the Personal core.** The rungs (social → Telegram → phone →
  biometrics) are checkbox toggles (`:has()`); linking a rung fills the inner Personal ring,
  with the **Telegram publish-gate** marked on the ring. Vouches feed Social; invitees feed
  Local; resources feed Global — so each ring visibly grows from its own signals.
- **Stage board beside the rings** — current stage (newbie→legend), next threshold, and the
  protected-section/password reveals (§5); crossing a stage lights its sections.
- **Score-visibility aware** (§3.6): your *own* rings show exact arcs; *others'* rings render
  only what their permission allows (a coarse tier arc, or hidden) — never their exact value.
- **Reduced-motion:** pulses become static glows; rings still convey level by fill.

## 5. Economy — stars, stages, donations

The mechanic that ties lower → upper. **Not a pay-to-open store — access is *earned by
contributing*** (FOSS-aligned). Tracked by the single inline script as simple client-side
state (no backend; resets on reload).

- **Earn stars** from activity — sharing resources (§3.2) and receiving trusts (§4.2) —
  at a **mint rate set by your trust score** (§4.1: higher standing mints faster,
  Global facet weighing most). Stars are the **progress measure** of your
  contribution; a live balance/progress chip sits in the passport (one source of truth in
  the script).
- **Contributing stages.** Accumulated contribution crosses named **stages** (milestones).
  Reaching a stage is an **achievement, not a purchase** — nothing is "spent/deducted";
  you simply pass a threshold.
- **Reward = passwords for protected sections.** Each stage reached **grants you a
  password** that **unlocks protected page-sections** across the apps/pages. Unlocks are
  **one-time and owned forever**. (FOSS posture: every app is usable for free; stages just
  open *protected/advanced sections* you've earned by contributing.)
- **Rewards span both layers** (mirrors §2):
  - **Apps layer (upper)** — access to **further apps** (beyond the free baseline) and their
    protected sections.
  - **nety layer (lower)** — access to **further resources**, including **donation
    directing**: the ability to **route donated/shared resources** (compute/storage/AI, or
    pooled contributions) toward the **projects or peers you choose**. Higher stages widen
    your directing capacity.
- **"Unlock the apps" → a stage/progress board** (upper-layer mock): shows your current
  stage, the **next stage's threshold**, and which protected sections each stage's password
  opens. In the mock, crossing a stage reveals the granted password and flips its protected
  sections to "open"; sections you haven't reached show the stage still required.
- This board is a **preview/bridge** inside nety that mirrors and links to the real
  upper-layer launcher `apps/index.html`. Wiring real stage/password gating into
  `apps/index.html` is a **future sub-project** (see §13), not this round.

### 5.1 Contributing-stage ladder (provisional; contribution-driven, trust-floored)

**Advancement is contribution-driven** (Global facet / stars from sharing resources),
**but sensitive stages carry a trust floor** (a minimum Identity/standing) as a safety gate —
you can't reach donation-directing or the top stage by raw resource-dumping alone. Stage
names/thresholds are provisional; the model is decided.

Contribution is measured in normalized **contribution units (CU)** — resources shared over
time (compute/storage/AI, normalized). CU figures are provisional, order-of-magnitude steps.

| Stage | Reached by (contribution) | Trust floor | Unlocks |
|---|---|---|---|
| **0 · newbie** | registered via invite (0 CU) | — | free apps baseline |
| **1 · known** | first sustained sharing (**≥ 10 CU**) | ≥ Telegram (to publish) | first protected sections; publishing |
| **2 · homie** | **≥ 100 CU** + 1–2 matured invitees | — | further apps; larger resource draw; **earmark your own donations** (§5.2) |
| **3 · expert** | **≥ 1,000 CU** | **≥ Telegram-verified** | **donation directing / pool stewardship** (§5.2) |
| **4 · legend** | **≥ 10,000 CU** + standing | **high Identity + Social** | wide directing capacity; all protected sections; promotion |

Trust floors compose with the per-capability gates in §4 (e.g. publishing always also needs
the §4 Telegram gate) — stages grant *access*, trust floors keep sensitive access honest.

### 5.2 Donation directing — two degrees, donor-controlled transparency

Directing comes in **two escalating degrees**:
- **Earmark your own** (earlier stages, ~homie) — choose which **projects/peers/circles
  your own** contributed resources flow to, rather than letting the network allocate them by
  default. You can direct to a **named circle** — e.g. *"to my `close` ring, **mostly or
  only**"* (a bias weight or a hard restriction). Personal, lower-stakes. (Circles are
  authored upstairs as tribes but referenced here as directing targets — the lower layer asks
  the GraphQL bridge who's in the circle, then routes to them.) Directing is a **standing
  default + per-donation override**; in **`only`** mode, anything the target can't absorb
  **falls back to the shared pool** (exclusive target, never idle), while **`mostly`** is a
  weighted split.
- **Steward the pool** (**expert+**, trust-floored §5.1) — help allocate the network's
  **pooled/donated commons** (surplus others contributed) toward projects/peers. A
  high-trust, high-responsibility stewardship power earned by contributing.

**The pool fills purely from voluntary donations.** Nothing automatic — no tithe, no
surplus capture. The shared pool holds **only what peers explicitly choose to donate**
(resources/stars), the most free-as-in-freedom posture. (Trade-off accepted: the pool is
only as deep as people's generosity; stewardship scales to whatever has been given.)

**Transparency — the donor decides (per donation).** Each donor sets whether *their*
donation's directing is **public** (shown on an allocation ledger, invite-graph style),
**contributor-visible**, or **private**. Stewardship of the pool is bounded by each
donation's own transparency choice — a steward can't make a private donation public.
(CSS-pure mock: directing pickers + an optional public allocation strand on the mesh graph.)

## 6. Honesty

Per decision "vision now, one honesty line": show the full vision boldly, with a single
small candid line near Access/Verify (styled like the existing `.candid` note) clarifying
preview vs live — e.g. *"Sign-in, invites, trust scoring, MyNet/permissions, stars and
app-unlocking are interactive previews; keypair identity and the resource mesh are live,
biometrics is on the F4 roadmap."*

## 7. Frontend — aesthetic / Kinetic Mesh

The page is the network. A living constellation of orbiting nodes + drifting link-lines
forms a full-bleed atmospheric background; content sits on top as glowing glass cards.

- **Typography:** keep **Fredoka** (display) + **Space Mono** (body/labels) — already
  loaded, on-brand. No new fonts. Display scale pushed hard: wordmark
  `clamp(4.5rem, 20vw, 11rem)`; `NETY` becomes the hero object.
- **Palette:** keep existing tokens — `--accent:#8d89ff` (purple), `--signal:#00f7a7`
  (green) — add glow/bloom via layered `box-shadow` + `filter`. Dominant dark field,
  sharp green accents. No new hues. Stars use the green `--signal` as the "value" color.
- **Background:** fixed full-bleed layer — intensified radial gradient-mesh + pure
  CSS/SVG orbiting node groups at varied radii/speeds (extends existing `.orbit` spin),
  faint drifting link-lines, a CSS data-URI grain overlay. `pointer-events:none`.
- **Layout:** break the centered 920px column → ~1100px; diagonal flow, overlap, giant
  offset wordmark, glass node-cards connected by faint link-lines so groups read as
  sub-meshes. The two layers are visually separated (e.g. a "you are leaving the mesh ↑"
  divider before the upper-layer unlock gallery).
- **Motion:** one orchestrated page-load (staggered `animation-delay`: wordmark → lead →
  cards → mesh fade-in), then calm. Full `prefers-reduced-motion` static fallback.

## 8. Page structure

`nav → hero → onboarding "first steps" strip (§3) → What nety is (3 existing demos) → Access
(sign in + earn) → Public invite web → MyNet & permissions → Verify yourself (trust ladder) →
Your stars → Unlock the apps (bridge to upper layer) → Stack → Where it's at (phases + candid)
→ footer`

The **onboarding first-steps strip** sits right under the hero (CSS-pure, always-visible,
checkbox-dismissible) — the mini-tier on-ramp described in §3.

All existing content preserved (hero, 3 CSS-only demos, stack chips, phase board F0–F9,
candid "Today vs. the design" note), re-skinned to the Kinetic Mesh language.

## 9. Constraints

- **On `nety.html`: CSS-pure** everywhere EXCEPT **one small inline script** (flove
  basic/normal tier) covering the registration form AND the stars/stage state (accrue
  progress → cross stages → reveal passwords / open sections; nothing deducted). All other
  interactivity stays CSS `:has()`/checkbox driven.
- Linked pages follow their own existing tier — `apps/index.html` stays CSS-pure;
  `sety`/`wizy` keep their light slider JS.
- Single self-contained `nety.html` (no new external deps).
- Each linked app keeps its **own** visual identity (flove design standard): profily warm/
  light, sety dark-purple, wizy athenea navy+gold, apps/index its own. Cohesion via shared
  structure + cross-links, not forced uniform theming.
- Accessibility: reduced-motion path, visible focus states, `.vh` visually-hidden inputs
  keep working.

## 10. Linked pages — targeted improvements (scoped to integration, not refactors)

### 10.1 `apps/profily.html` — the **extended** profile (stays warm/light)
1. Frame it as the **full `profily`** that grows from the open **`profily-mini`** (§3) —
   carrying its handle/contribution/presence/stage forward and adding the extended sections;
   add an **ecosystem nav link back to nety** ("← mesh").
2. Group the scattered **SuperUser badge + sub-avatar / identity controls** into one
   "Manage identity" card.
3. Make the **Trusts panel actionable**: "add a trust" affordance + note that more trusts
   raise your tier / earn stars / promote you (ties to §4–§5).
4. Show a small **stars balance / tier** reflection so the two layers feel continuous.
5. Tighten the **"Apps played" grid** hierarchy to rhyme with nety's node-cards.
6. Surface the **custom MyNet layer** here (§3.5): manage connections, define **named
   circles** (`close`, `collaborators`…), and set **circle-level permissions** (§3.6) — the
   fine-grained controls nety's passport delegates upward.
7. Add a **MyWizy** entry point (§3.5) — your personalized agents — linking to the Wizy app
   (§10.3). (These are framed as the extended-layer home for MyNet/MyWizy; depth of build is
   scoped in §11.)

### 10.2 `apps/puzzy/sety.html` — settings (already on nety palette)
1. Add **ecosystem back-link to nety** + a small "account" breadcrumb.
2. Brand the existing **"Wizard"** section as **athen-ia finetuner agents**, make it far
   more prominent (named agents, on/off + tuning, athenea accent), **link out to
   `wizy.html`**.
3. Bump **range-slider thumbs** to ~24–28px touch targets.
4. Add tiny **glyphs** to the shape selector (List/Rainbow/Circle/Sphere3D/Torus4D).

### 10.3 `apps/wizy.html` — NEW app (athenea: navy `#0d1430` + gold `#d4af37`, owl marks)
- The **athen-ia (athenea) finetuner-agents** app: configure/tune the agents hinted in
  sety (Summaries, Suggestions, Offers, Matches, Polarities, Reminders) + per-agent
  strength/temperature.
- Mirrors sety's structure (cards, segmented controls, `<output>` sliders + same light
  slider JS); otherwise CSS-driven. Linked from sety's Wizard and nety's unlock gallery;
  back-link to nety.
- **Wizy (the app) vs MyWizy (your instance, §3.5):** Wizy is the general tool where agents
  are defined/tuned; a peer's **MyWizy** is their personalized, activated set bound to their
  MyNet. This round: build the Wizy app + reference MyWizy from profily; a full per-user
  MyWizy is a later layer.

### 10.4 `apps/index.html` — upper-layer launcher (this round: cross-link only)
- nety's "Unlock the apps" gallery **links up** to it as the real apps layer; no structural
  changes to this 5845-line CSS-pure file this round (see §13).

## 11. Implementation sequence (bottom-up, verify each)

1. **nety Kinetic Mesh shell** — background mesh, hero, re-skin existing 3 demos, stack,
   phases, footer. Rasterize key states to verify (no blind iteration).
2. **nety Access** — passport + basic profile, register form + invite-code gate, share-
   resources earn, invite issuance (single/multi-use + 72h validation), revoke/disown,
   key-recovery mock (self-backup / social-fallback, "rotated · in probation" badge).
3. **nety inline script** — single script: registration live outputs + stars/stage state
   (accrue progress, cross stages, reveal passwords / open sections — never deducted) +
   progress source of truth.
4. **nety Public invite web** — CSS-pure SVG: solid lineage tree + fainter vouch threads,
   you highlighted, branch spotlight; presence glows (LIVE/RECENT/REACHABLE/DARK).
5. **nety MyNet & permissions** — f2f MyNet panel (add/in-circle), coarse permission pickers
   (public/all-MyNet/private); MyWizy reference. (Named-circle depth lives in profily, §10.1.)
6. **nety Verify** — **concentric scope rings** (§4.4: Personal core → Local → Social →
   Global outer, Activity pulse on Global), identity ladder feeding the Personal core
   (social→Telegram→…→biometrics), tier-unlocks (incl. publish ≥ Telegram), trusts-earn-stars.
7. **nety Stars + stage/progress board** — progress chip, current stage + next threshold,
   protected-section cards (locked → password revealed → open on reaching a stage),
   "leaving the mesh ↑" divider, link to `apps/index.html`.
8. **wizy.html** — new athenea agents app (Wizy; MyWizy referenced from profily).
9. **sety.html** improvements — back-link, athen-ia Wizard prominence + wizy link, sliders,
   glyphs.
10. **profily.html** improvements — extended-profile framing, back-link, Manage-identity
    card, actionable Trusts, stars/tier reflection, Apps grid, custom MyNet + circles +
    circle-level permissions, MyWizy entry point.
11. **Cross-link pass + Gitea commit/push** per the flove workflow (message = prompt +
    explanation) to `localhost:3000/marc/flove` (main).

## 12. Verification

- Rasterize nety.html key states (load, each demo expanded, registration filled, trust
  ladder climbed, stars accrued, a stage reached → password revealed / section opened) via
  `convert` → PNG + Read before committing — per flove's "render to verify" standard.
- Confirm zero-JS on nety except the single inline script (registration + stars).
- Confirm reduced-motion fallback renders static.
- Confirm all cross-links resolve (nety ↔ profily ↔ sety ↔ wizy ↔ apps/index).
- Confirm stage logic is consistent (stars/progress accrue; crossing a stage reveals its
  password and opens exactly that stage's protected sections; lower stages stay locked with
  the required stage shown — nothing is deducted).
- Confirm the **three access axes** read as distinct on the page (invite web ≠ MyNet ≠
  permissions) and the four **presence states** (LIVE/RECENT/REACHABLE/DARK) are each
  visually legible.
- Rasterize the invite-web and MyNet/permissions sections too (add to the state list above).

## 13. Out of scope / future

- No real authentication, keypair crypto, backend, or persisted stars (all mocks; stars
  reset on reload). Includes **real key recovery/rotation crypto** (§3.7) — illustrative
  mock only this round.
- **Persisting unlock state into `apps/index.html`** (real gating of the 5845-line
  launcher) — separate future sub-project with its own spec.
- **Finalizing the trust-scoring model** (weights, thresholds, score↔stars coupling) —
  this build uses provisional illustrative values (§4.1); refining them is its own pass.
- **Abuse adjudication flow** (weighted peer reports / trusted jurors / staked reporting) —
  deferred; this build only shows the resulting slashed state (§4.1).
- **The `super` tier definition** (§2.1) — deferred. Candidate directions noted (network
  powers vs self-sovereignty); choose and spec later.
- **Concrete nety hardware quota levels** (§2.1) — deferred. The quota-ladder shape is
  decided; the per-tier numbers are not pinned this round.
- **Curator/moderation mechanics** (§3.8) — the *role* is decided (volunteer curators review
  the publishing queue, admit to basic, gate normal); how curators are selected, quorum size,
  and curator accountability are light this round / deferred. Real publishing pipeline +
  points-payout for approved content are mocked.
- No new fonts; no new color hues on nety.
- No refactor of profily/sety internals beyond the listed items.
