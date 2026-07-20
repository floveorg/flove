# profily Nav-Ladder (Phase C-1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape `apps/profily.html` so the profile's features are organized as the five-nav ladder (mini→super) from the design — profily's **home is mini** (the public passport) and it deepens through basic→super.

**Architecture:** Single self-contained HTML file, warm/light identity (orange `#ff9b5e`, Fraunces + Inter), no build step. The existing tabs (Home/Souls/Trusts/Contribs/Offers/Contact) are re-grouped under a visible **nav-tier scaffold**: a `mini → super` selector (CSS `:has()`/radio, the flove tier pattern) gates which feature blocks show, with lower tiers always visible and higher tiers revealed as the user's stage ceiling rises. All data mock. Verification is flove-standard: structural greps + the page opened by Marc in his browser + commit/push to Gitea `marc/flove`.

**Tech Stack:** Hand-written HTML/CSS/JS (vanilla, minimal inline script for the tier selector + mock stage state), Fraunces + Inter (existing), no dependencies, no build.

## Global Constraints

- **One file:** `apps/profily.html` (modify only). No new files, no build step, no deps.
- **Identity stays:** warm/light — orange `#ff9b5e`/`#ff7a3a`, peach paper `#fff7f0`, Fraunces (display) + Inter (UI). Do not introduce nety's dark theme or new hues.
- **Tier model verbatim (design §2–§3):** navs `mini · basic · normal · advanced · super`; profily **home = mini**; stages `newbie · known · homie · expert · legend` are earned ceilings, the browsed tier is a free choice at/below the ceiling. mini = pure-CSS feel (read-only passport); basic+ may use the small inline script.
- **All data mock/illustrative** (resets on reload). No real auth/keypair/backend.
- **Verification per task (flove standard, NO test framework):** (a) `<div>`/`</div>` balance grep; (b) if JS touched, `node -e "new Function(scriptBody)"` parse + all `onclick`/`onchange` handlers resolve; (c) Marc opens the file in his browser for visual sign-off (do NOT use chrome-devtools; do NOT claim visual pass yourself); (d) commit + push to Gitea `localhost:3000/marc/flove` (main), message = the driving prompt + a one-line explanation.
- **Feature source of truth:** design `docs/superpowers/specs/2026-06-19-appy-five-apps-tier-ladders-design.md`, profily column fields **#6 · #9 · #12 · #15 · #18**.

## Preconditions (resolve before/at Task 1)

- **P1 — survey the current file.** Read `apps/profily.html` in full and record: its tab mechanism (ids/classes), the existing Home/Souls/Trusts/Contribs/Offers/Contact sections, and any existing stage/tier UI. Tasks below reference these by the names found here.
- **P2 — social split (design §8 open question).** profily's basic rung (#9) references "simple-Social online" but the **social** app is a separate sibling plan. For this plan, profily shows only its *own* basic features (profile/personas/apps) and **links to** the social layer; it does not implement MyNet/feed/chat. Confirm this boundary with Marc if unsure (it's a product question, not backend).

## File Structure

- `apps/profily.html` — **modify**. New/changed regions:
  - a **tier-scaffold** control (the `mini…super` selector + mock stage chip) near the top of the profile column;
  - five **rung blocks** (`data-tier="mini|basic|normal|advanced|super"`) wrapping the relevant feature groups;
  - one small **inline `<script>`** for the tier selector + mock stage ceiling (basic+ only).

---

## Task 0: Survey + tier scaffold (no feature change yet)

Establish the nav-ladder skeleton the feature tasks slot into. Pure structure; existing content untouched in behavior.

**Files:**
- Modify: `apps/profily.html`

**Interfaces:**
- Produces: `.tier-scaffold` control; `setTier(name)` JS; `[data-tier]` block convention; a mock `stage`/`ceiling` state the rung tasks read. Rung tasks (1–5) wrap their content in `<section data-tier="…">` and rely on `setTier` to show/hide.

- [ ] **Step 1 — Survey.** Read `apps/profily.html` end to end. Write a 6-line note (in the commit body later) of: tab control markup, the 6 section anchors, fonts/vars, any stage UI. (Satisfies P1.)
- [ ] **Step 2 — Add the tier scaffold.** Near the top of the profile column add a CSS-pure `mini…super` selector (radio group styled as a 5-rung control, warm palette) + a mock **stage chip** (`newbie→legend`, default `newbie` → ceiling `mini`). Markup pattern: a `.tier-scaffold` wrapper with 5 labels; lower navs always enabled, navs above the ceiling shown dimmed/locked.
- [ ] **Step 3 — Wrap existing content.** Without changing their behavior, wrap the current sections in `<section data-tier="…">` placeholders so they're addressable. Default everything to `data-tier="basic"` for now (Task 1–5 re-assign correctly). Add CSS: `[data-tier]` hidden unless its tier ≤ selected tier (and ≤ ceiling); use `:has()`/the inline `setTier`.
- [ ] **Step 4 — Verify.** Run `<div>` balance grep; `node -e "new Function(scriptBody)"` parse; confirm `setTier` + any handlers resolve. Ask Marc to open the file and confirm the selector renders and switches without breaking layout.
- [ ] **Step 5 — Commit.**
```bash
git add apps/profily.html
git commit -m "profily: tier scaffold (mini…super selector + mock stage ceiling) + data-tier wrappers"
git push -q origin main
```

---

## Task 1: mini rung — "Your public passport" (#6, HOME)

profily's home. The read-only public presence that mini grants.

**Files:**
- Modify: `apps/profily.html`

**Interfaces:**
- Consumes: Task 0 `data-tier`/`setTier`, mock `ceiling`.
- Produces: `#passport` block (the mini home), reused as the always-visible profile header.

- [ ] **Step 1 — Build the passport block.** Add `<section data-tier="mini" id="passport">` containing a read-only card: **@handle · mock peerId · presence badge (LIVE) · Global contribution (e.g. "5 CU") · stage badge**. Style as the warm hero of the page; mark it the **home/main** (stronger card, a small "home" tag). No editing controls here (pure-CSS feel).
- [ ] **Step 2 — Make it always-visible.** Since mini is the lowest rung, the passport shows at every tier (it's the profile's identity header). Ensure CSS keeps `data-tier="mini"` visible regardless of selection.
- [ ] **Step 3 — Verify.** `<div>` balance; render check by Marc (passport reads as the headline; no edit affordances).
- [ ] **Step 4 — Commit.**
```bash
git add apps/profily.html
git commit -m "profily: mini rung — Your public passport (read-only presence, the home card)"
git push -q origin main
```

---

## Task 2: basic rung — "Profile gets editable" (#9)

The full extended profile switches on. profily's own basic features only (NOT the social app — see P2).

**Files:**
- Modify: `apps/profily.html`

**Interfaces:**
- Consumes: `#passport` (Task 1), `setTier`.
- Produces: `#manage-identity` card; editable-profile fields; `#apps-played` grid.

- [ ] **Step 1 — Editable identity.** Under the passport, add `data-tier="basic"` blocks: editable **avatar / bio / display-name** (mock, updates the passport live via the inline script); a consolidated **Manage-identity** card grouping the existing SuperUser badge + sub-avatars/personas controls.
- [ ] **Step 2 — Wanty + apps + offers.** Re-tier the existing **Wanty** goals/wants chips, the **Apps-i-played** grid (play & store), view-only **Trusts**, and **Offers** to `data-tier="basic"`.
- [ ] **Step 3 — Social link, not social app.** Add a small "**Connections → in social**" link/card pointing to the social app (placeholder href), with a note "simple-Social comes online at basic". No feed/chat here (P2).
- [ ] **Step 4 — Verify.** `<div>` balance; JS parse + handler resolution (editable fields update the passport); Marc confirms basic tier reveals the editable profile and the apps grid.
- [ ] **Step 5 — Commit.**
```bash
git add apps/profily.html
git commit -m "profily: basic rung — editable profile, Manage-identity, Wanty, apps grid, Offers (+ link to social)"
git push -q origin main
```

---

## Task 3: normal rung — "Actionable Trusts + circles" (#12)

**Files:**
- Modify: `apps/profily.html`

**Interfaces:**
- Consumes: existing Trusts list; `setTier`.
- Produces: `#add-trust` affordance; `#circles` (named circles + permissions) block.

- [ ] **Step 1 — Actionable Trusts.** Upgrade the Trusts section (`data-tier="normal"`): add an **"Add a trust"** affordance (mock) with a note "more trusts → raise tier / earn stars".
- [ ] **Step 2 — MyNet circles + permissions.** Add a `#circles` block: **named circles** (rings + tags, mock list) with **circle-level permission** pickers (public / all-MyNet / private, default private). Note these are the fine controls nety delegates up.
- [ ] **Step 3 — Souls reach.** Re-tier the existing Souls reach stats to `data-tier="normal"` (deeper analytics live here).
- [ ] **Step 4 — Verify.** `<div>` balance; JS parse + handlers; Marc confirms normal tier reveals Add-a-trust + circles + deeper Souls.
- [ ] **Step 5 — Commit.**
```bash
git add apps/profily.html
git commit -m "profily: normal rung — actionable Trusts, MyNet circles + permissions, deeper Souls"
git push -q origin main
```

---

## Task 4: advanced rung — "MyWizy-assisted" (#15)

**Files:**
- Modify: `apps/profily.html`

**Interfaces:**
- Consumes: existing Contact "Compose" + Wizard row; `setTier`.
- Produces: `#mywizy-compose` (agent-assisted compose); conditional-rule UI on `#circles`.

- [ ] **Step 1 — Agent-assisted compose.** Re-tier the Contact **Compose** card to `data-tier="advanced"` and frame its Lovely/Joy/Wisdom Wizard row as **MyWizy agents** (mock suggestions); add a "tunes from your MyWizy → wizy" link (placeholder href to wizy.html).
- [ ] **Step 2 — Conditional trust rules.** Add (mock) **conditional rule** controls to the `#circles` block (e.g. "auto-trust if vouched by 2 close + active 30d").
- [ ] **Step 3 — Verify.** `<div>` balance; JS parse + handlers; Marc confirms advanced tier shows MyWizy-framed compose + conditional rules.
- [ ] **Step 4 — Commit.**
```bash
git add apps/profily.html
git commit -m "profily: advanced rung — MyWizy-assisted compose + conditional circle trust rules"
git push -q origin main
```

---

## Task 5: super rung — "Stewardship surface" (#18)

**Files:**
- Modify: `apps/profily.html`

**Interfaces:**
- Consumes: `#passport`, `#circles`; `setTier`.
- Produces: `#stewardship` block.

- [ ] **Step 1 — Stewardship block.** Add `<section data-tier="super" id="stewardship">`: **vouch/host others** controls (mock), **governance badges**, **donation-directing** reflected on the profile, and a note "identity integrated across the stack".
- [ ] **Step 2 — Ceiling gating.** Ensure super content is dimmed/locked until the mock stage ceiling reaches `legend` (drive via the stage chip from Task 0; nothing is deducted, crossing reveals).
- [ ] **Step 3 — Verify.** `<div>` balance; JS parse + handlers; Marc confirms super tier (at legend ceiling) reveals the stewardship surface and stays locked below it.
- [ ] **Step 4 — Commit.**
```bash
git add apps/profily.html
git commit -m "profily: super rung — stewardship surface (vouch/host, governance, donation directing)"
git push -q origin main
```

---

## Task 6: cross-check + back-links + final pass

**Files:**
- Modify: `apps/profily.html`

- [ ] **Step 1 — Ladder integrity.** Confirm every feature sits under exactly one `data-tier`; the `mini…super` selector + stage ceiling reveal/hide correctly across all five rungs; mini passport always visible; super locked below `legend`.
- [ ] **Step 2 — Ecosystem links.** Add/verify the "← mesh" back-link to nety and the placeholder links out to **social**, **sety**, **wizy** (the sibling apps), so the diagonal reads.
- [ ] **Step 3 — Invariants.** `<div>` balance; single inline `<script>` parses; all handlers resolve; no leftover `data-tier="basic"` placeholders from Task 0 that should have been re-tiered.
- [ ] **Step 4 — Marc visual sign-off** on the whole laddered profile (each tier in turn).
- [ ] **Step 5 — Commit.**
```bash
git add apps/profily.html
git commit -m "profily: nav-ladder cross-check — gating integrity, ecosystem back-links, invariants"
git push -q origin main
```

---

## Self-review notes (coverage)

- Design profily fields **#6/#9/#12/#15/#18** → Tasks 1/2/3/4/5 respectively. ✓
- Home@mini emphasis (#6) → Task 1 marks it the home/main card, always visible. ✓
- "social is a sibling plan" boundary (design §8) → P2 + Task 2 Step 3 (link, not implement). ✓
- flove no-test-framework workflow → Global Constraints verification block replaces TDD steps. ✓
- Sibling plans to follow (design §7 order): **social → sety → wizy → vizy**, each its own `docs/superpowers/plans/2026-06-19-phase-c*-<app>-nav-ladder.md`.

## Out of scope (this plan)

- The social/MyNet/feed/chat implementation (sibling plan; here profily only links to it).
- Real auth/keypair/stars persistence/backend (Phase D).
- The nety access-point shape decision (B1, deferred to last) — profily is a standalone app and does not depend on it.
