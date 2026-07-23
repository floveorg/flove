# appy — five apps × five navs: tier-ladder design

> **Status:** design (brainstorm output, 2026-06-19). Feeds **Phase C** of
> `docs/superpowers/plans/2026-06-18-nety-frontend-build.md`. Interactive review board:
> `docs/nety-specs/2026-06-19-three-apps-tier-ladders-review.html` (25 numbered feature
> fields, #6–#30; the five nav values live unnumbered in the click-to-expand column headers).
> **Evolves spec §2.1** of `2026-06-18-nety-access-ecosystem-design.md` — see §6 below.

## 1. Goal

Define how flove's profile/social/data/agent/visualization **apps** grow their features
across the five **navs** (`mini → basic → normal → advanced → super`), so each app has a
legible ladder and each nav has a clear "what switches on here" identity. This is the product
shape that Phase C (build/refresh the linked apps) will implement.

## 2. The nav value model

Each nav carries a 3-word **value** + a one-line keyword:

| Nav | Value (3 words) | Keyword |
|---|---|---|
| **mini** | Contribute · appear · free | open resources → Global presence, no invite |
| **basic** | Play · store · belong | minimal real access: apps + profily + circle |
| **normal** | Tune · own · curate | data management (sety = "nety for data") |
| **advanced** | Delegate · automate · finetune | MyWizy agents + complex trust |
| **super** | Steward · host · govern | everything integrated, all scopes |

## 3. The five apps and the home diagonal

The organizing idea: **one app fully "switches on" per nav** — its *home* tier. Below home an
app is a light teaser/locked; at home it's the headline; above home it deepens.

| app | identity | home nav |
|---|---|---|
| 🟠 **profily** | identity / profile | **mini** |
| 🟢 **social** | connections / MyNet | **basic** |
| 🟣 **sety** | data / relations | **normal** |
| 🔵 **wizy** | agents (athenea) | **advanced** |
| 🔮 **vizy** | visualization | **super** |

This forms a clean diagonal: `profily@mini · social@basic · sety@normal · wizy@advanced ·
vizy@super`. nety is **not** in this list — it remains the underlying **resource/hardware
layer** (the mini quota base, §6).

## 4. Per-app feature ladders (the 30 fields)

Each rung is a review-board field `#n`. **bold = home (main).** ░ = teaser/locked.

### 🟠 profily — identity (home @ mini)
- **#6 mini — Your public passport** *(home)*: profily-mini — @handle · peerId · presence · Global contribution · stage badge; pure-CSS, read-only; mini's headline — you appear.
- #9 basic — Profile gets editable: avatar/bio/name; Manage-identity card (SuperUser + personas); Wanty goals & wants; Apps-i-played grid (play & store); view-only Trusts; Offers; Personal + Local + simple-Social online.
- #12 normal — Actionable Trusts + circles: "add a trust" → tier/stars; MyNet named circles (rings + tags); circle-level permissions; deeper Souls reach.
- #15 advanced — MyWizy-assisted: compose & profile agent-assisted (Lovely/Joy/Wisdom → real agents); conditional trust rules per circle.
- #18 super — Stewardship surface: vouch/host others; governance badges; donation directing on profile; identity integrated across the stack.

### 🟢 social — connections / MyNet (home @ basic)
- #21 mini ░ — Browse only: public mesh activity; following, circles & chat locked.
- **#22 basic — MyNet core, the heart of basic** *(home)*: follow/support people & groups; Favourites (★); the social feed; join basic circles; text Chat (DMs); invite friends; simple-Social online — this is "belong".
- #23 normal — Deeper social: named circles with tags; group roles & light moderation; feed filters; cross-group supports (deeper Social via vouches); ephemeral chat.
- #24 advanced — Agent-augmented social: MyWizy suggests people/matches; auto-curated feed; audio/video chat unlocked; complex circle-trust rules.
- #25 super — Community stewardship: run/host groups; moderation & curator powers; network-wide social governance; federation with other meshes.

### 🟣 sety — data / relations (home @ normal)
- #7 mini ░ — Sort/style peek: a single "how you'd sort/style content" glimpse; locked.
- #10 basic — Minimum data control: Display prefs (avatar/email/links visibility); visibility Private/Close/Public.
- **#13 normal — Full sety** *(home)*: Visualization (List/Rainbow/Circle/Sphere/Torus + sliders); Relations (Preferred Raters, Perspectives); Explains (medias/labels); Contents (platforms/fields); Wizard = the athen-ia agents seed; deeper Social via raters.
- #16 advanced — Tuning graduates out: agent tuning links out to wizy; complex perspective/rater rules; data export.
- #19 super — Data sovereignty: run your own data node; shared-mesh inference toggles; govern data-sharing policy.

### 🔵 wizy — agents / athenea (home @ advanced)
- #8 mini ░ — Agents preview: "agents could do this" card; locked.
- #11 basic — One passive agent: Summaries on/off; feeds the profily compose box; a taste of agents.
- #14 normal — The 6 named agents appear: Summaries · Suggestions · Offers · Matches · Polarities · Reminders; on/off only; seeded from sety's Wizard.
- **#17 advanced — Full wizy** *(home)*: per-agent strength/temperature sliders; MyWizy bound to MyNet (tunes connectivity + apps); complex-trust-aware behavior; navy + gold owl identity.
- #20 super — Agent orchestration: run agents for your circles; pluggable inference backend; steward others' MyWizy; full integrated automation.

### 🔮 vizy — visualization (home @ super)
- #26 mini ░ — Plain view: list/text only; rich visualization locked.
- #27 basic — A first look: pick a basic style (List or Rainbow) for profile & feed; a taste of viz.
- #28 normal — Shaped views unlock: render data & relations as Circle / Sphere3D / Torus4D (the sety Visualization shapes).
- #29 advanced — Agent-driven viz: MyWizy lays out & animates your graph; interactive 3D/4D; XR-ready scenes.
- **#30 super — Full vizy studio** *(home)*: visualize the whole mesh & all your data, any form (List → Rainbow → Circle → Sphere3D → Torus4D); VR/XR worlds; custom visual pipelines; the capstone of super.

## 5. Cross-cutting patterns

- **Home cell = the row's main feature** — strongly highlighted, opens expanded by default.
- **Teaser rungs** sit only at each app's lowest (pre-home) nav — they advertise, don't grant.
- **The apps interlock across the diagonal:** sety's Wizard (#13) seeds wizy's agents (#14→#17);
  sety's Visualization shapes (#13) seed vizy (#28→#30); MyWizy (#17) feeds back into
  profily (#15), social (#24) and vizy (#29). Build order should respect these seams.

## 6. Relationship to spec §2.1 (intentional evolution)

Spec §2.1 mapped tiers to: `mini=nety · basic=profily+apps · normal=sety · advanced=MyWizy ·
super=open`. This design **refines** that:

- **Adds two apps** the spec didn't name as tier-homes: **social** (the MyNet/Chat layer, home
  @basic) and **vizy** (visualization, home @super, fills the spec's "super = open").
- **Moves profily's home to mini** — profily-mini *is* what mini grants (you appear), with the
  full profile deepening at basic. basic's headline becomes **social** ("belong").
- **nety stays the resource/hardware layer** beneath the diagonal — the mini quota base every
  app sits on; it is not one of the five ladder apps.
- Unchanged: sety @normal, the MyWizy/agents idea @advanced, the `mini→basic` open/invite gate,
  stages (`newbie…legend`) as earned ceilings vs freely-chosen mode.

> This section is the record of divergence; on approval, fold a pointer back into
> `2026-06-18-nety-access-ecosystem-design.md` §2.1 so the two stay reconciled.

## 7. How this feeds implementation (Phase C)

Phase C of the build plan grows from 3 apps to **5** (adds social + vizy). Suggested order
follows the diagonal and the seams in §5:

1. **profily** (mini→super) — extends the existing warm/light app; nearest to done.
2. **social** — may be its own app or the productized MyNet from the miniappy prototype.
3. **sety** — reframe existing app as the normal-tier unlock; surface Wizard as agents seed.
4. **wizy** — new athenea app; consumes sety's agents seed.
5. **vizy** — new visualization app; consumes sety's shapes + wizy's layout agents.

Each app ships its own per-nav progressive disclosure (mini→super), gated by the user's
stage ceiling (CSS/`:has()` + the small inline script pattern, per the flove tier model).

## 8. Out of scope / open

- Exact per-nav **quota numbers** for nety hardware (deferred, spec §13).
- Whether **social** is a standalone app or profily-integrated MyNet (decide at Phase C start).
  <!-- ↗ pendings:#AF01 -->
- **vizy** XR/VR depth (the old `apps/flovy/vr` was removed; recover from git if revived).
  <!-- ↗ pendings:#AF02 -->
- Backend wiring for any of this (Phase D; flovenet/oasis).
