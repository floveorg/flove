# Appy Advanced — the "athenea desk" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `appy` at the **advanced nav** — the user's core profile & settings hub that integrates the three "athenea" surfaces (**profily** identity · **sety** data finetune · **wizy** agents) as tabbed rooms, gated by a `basic · normal · advanced` mode dial, reached from a ⚙ settings icon in `apps/index.html`.

**Architecture:** One self-contained HTML file (`apps/appy/advancedappy.html`) in the established appy honey/hive identity, with a navy-gold **athenea owl** motif. A persistent header (mode dial + public passport + interlock line) sits above three **room tabs** (profily/sety/wizy). Feature depth is revealed by progressive disclosure: every block carries `data-since="normal|advanced"` (or nothing = basic), and `body[data-mode]` CSS hides blocks above the current mode. The rooms interlock live (sety's Wizard seeds wizy's agents). Standalone `wizy.html` and a profile-framed `sety.html` are follow-ups.

**Tech Stack:** Hand-written HTML/CSS/vanilla JS, `localStorage` (`appy.adv.v1`), Bricolage Grotesque + Instrument Sans + Space Mono. No build, no deps. Source of truth: `docs/superpowers/specs/2026-06-19-appy-five-apps-tier-ladders-design.md` fields **#9–#17**.

## Global Constraints

- **Self-contained files:** each app is one HTML file, no build step, no external JS/CSS deps (fonts via Google Fonts link only).
- **Identity:** appy shell = honey/hive (`--honey #f6a609`, `--void #160f07`, hex atmosphere). Door accents are fixed: profily `#ff9b5e`, sety `#8d89ff`/`#70f0d3`, wizy `#3a5a99`+`#e8c069` (navy + gold owl). Do not introduce unrelated hues.
- **Mode model (design §2):** `basic` = "Play · store · belong"; `normal` = "Tune · own · curate"; `advanced` = "Delegate · automate · finetune". Lower-mode content always visible; higher hidden until its mode.
- **Progressive disclosure pattern:** block visibility via `body[data-mode="…"] [data-since="…"]{display:none}` + a `setMode()` inline script. No framework.
- **All data mock/illustrative**, resets on reload except `localStorage` UI state. No real auth/keypair/backend (that's Phase D / oasis).
- **Verification per task (flove standard — NO test framework):**
  - (a) `<div>`/`</div>` (and `<section>`) balance grep;
  - (b) if JS touched: extract the `<script>` and run `node --check`; confirm every `onclick`/`onchange`/`oninput` handler name is defined;
  - (c) **Marc opens the file in his browser** for visual sign-off — do NOT use chrome-devtools; do NOT claim a visual pass yourself;
  - (d) commit + push to Gitea `localhost:3000/marc/flove` (main); message = driving prompt + one-line explanation; end with the `Co-Authored-By` trailer.
- **Standards honored:** §13.6 onboarding (loud-first / discreet-after); selection-dim unselected chips to 50%; `flove.bot`-style `inject/clear/current` naming for the compose wizard.

---

## Status snapshot

Tasks **0–5 are already implemented** in commit `8d0efc0` (`apps/appy/advancedappy.html` + the ⚙ link in `apps/index.html`). They are documented below as the canonical record; their checkboxes are pre-checked. Tasks **6–9 are pending**.
<!-- ↗ pendings:#DS03 -->

---

## File Structure

- `apps/appy/advancedappy.html` — **the hub** (Tasks 0–5). One file: header + mode dial + passport + interlock + 3 room tabs + inline `<script>`.
- `apps/index.html` — **modify** (Task 0, step 4): add the ⚙ settings link in the topbar.
- `apps/wizy.html` — **create** (Task 6): standalone athenea agents app, home @ advanced; the hub's wizy tab links to it.
- `apps/sety.html` — **create** (Task 7): profile-framed sety (reframed from `apps/puzzy/sety.html`); the hub's sety tab + diagonal link to it.
- `making-of.html` — **update** (Task 8) when restored: log the appy-nety design Q&A + this build.

---

## Task 0: Hub scaffold — shell, mode dial, room tabs, nav hook  ✅ done (`8d0efc0`)

**Files:**
- Create: `apps/appy/advancedappy.html`
- Modify: `apps/index.html` (topbar, ~line 3822)

**Interfaces:**
- Produces: `body[data-mode]` + `setMode(name)`; `[data-since]` block convention; `.tab-panel#tp-<room>` + `switchRoom(room)`; `flash(btn,msg)`, `toggleMore(btn)`, `esc(str)` helpers; `localStorage` key `appy.adv.v1`.

- [x] **Step 1 — Shell.** Honey/hive `:root` tokens + door accents; hex atmosphere; `.shell`; owl `brand`; `↩ apps` back-link; `?` help-pill.
- [x] **Step 2 — Mode dial.** `.mode-dial` with 3 `.mode-btn` (`m-basic/m-normal/m-advanced`); `setMode()` sets `body.dataset.mode`, toggles `.on`, writes the 3-word value into `#mode-note`, persists `store.mode`. CSS: `body[data-mode="basic"] [data-since="normal"], … {display:none !important}`.
- [x] **Step 3 — Room tabs.** `.tab-bar` with 3 colour-coded `.tab-btn[data-room]`; 3 `.tab-panel#tp-profily|tp-sety|tp-wizy`; `switchRoom()` toggles `.active`/`.on` + `aria-selected` + scrolls to top.
- [x] **Step 4 — Nav hook.** In `apps/index.html` topbar, after the `🧭 compass-btn`, add `<a href="appy/advancedappy.html" class="compass-btn settings-btn" …>⚙</a>` with bilingual `data-aria-en/es` + `data-title-en/es`.
- [x] **Step 5 — Verify + commit.** `<div>` balance; `node --check`; Marc sign-off; pushed in `8d0efc0`.

---

## Task 1: profily room — identity across modes  ✅ done (`8d0efc0`)

**Files:** Modify `apps/appy/advancedappy.html` (`#tp-profily`).

**Interfaces:**
- Consumes: `setMode`, `[data-since]`, chip-append, the compose wizard.
- Produces: `setAvatar(v)`, `addTrust()`, `#trust-list`.

- [x] **Step 1 — basic.** Edit display-name (live `setAvatar`), public bio, Wanty offer chips → `#wanty-out`, personas/SuperUser badges, apps-played (#9).
- [x] **Step 2 — normal.** `data-since="normal"`: actionable Trusts + `addTrust()`; MyNet named circles with per-circle permission selects; Souls stat tiles (#12).
- [x] **Step 3 — advanced.** `data-since="advanced"`: MyWizy-assisted compose (`textarea[data-wizard]`, Lovely/Joy/Wisdom); conditional trust rule builder (#15).
- [x] **Step 4 — Verify + commit** (in `8d0efc0`).

---

## Task 2: sety room — data finetune + the Wizard seed  ✅ done (`8d0efc0`)

**Files:** Modify `apps/appy/advancedappy.html` (`#tp-sety`).

**Interfaces:**
- Consumes: `setMode`, chip-append, `toggleMore`.
- Produces: `.seed[data-agent]` checkboxes + `syncSeed()` (read by Task 3); link to `../puzzy/sety.html`.

- [x] **Step 1 — basic.** Data control: dashboard visibility select + avatar/links/email toggle switches (#10).
- [x] **Step 2 — normal.** Full sety: Visualization style chips + 3 range sliders; Relations raters sliders; Perspectives behind see-more (#13).
- [x] **Step 3 — normal Wizard.** The 6 `.seed` checkboxes (Summaries/Suggestions/Offers/Matches/Polarities/Reminders) calling `syncSeed()` — the agents seed.
- [x] **Step 4 — advanced.** "Tuning graduates out" → `switchRoom('wizy')` button + data export (#16).
- [x] **Step 5 — Verify + commit** (in `8d0efc0`).

---

## Task 3: wizy room — athenea agents, seeded + tunable  ✅ done (`8d0efc0`)

**Files:** Modify `apps/appy/advancedappy.html` (`#tp-wizy`).

**Interfaces:**
- Consumes: `seeds()` (reads `.seed:checked`), `AGENT_DESC`.
- Produces: `#agent-list` (normal on/off), `#agent-tuners` (advanced sliders); `syncSeed()` renders both.

- [x] **Step 1 — basic.** One passive agent (Summaries) toggle (#11).
- [x] **Step 2 — normal.** `#agent-list` rendered from `seeds()` — the 6 agents on/off, live-synced from sety's Wizard (#14).
- [x] **Step 3 — advanced.** `#agent-tuners`: per-seeded-agent strength + temperature range sliders; bind-to-MyNet toggle; navy+gold owl framing (#17).
- [x] **Step 4 — Verify + commit** (in `8d0efc0`).

---

## Task 4: guidance + interlock  ✅ done (`8d0efc0`)

**Files:** Modify `apps/appy/advancedappy.html`.

- [x] **Step 1 — Coachmark.** `#coach` dialog (3 colour-keyed steps) + `openCoach()`/`coachDone()`; auto-open first run via `store.onboarded` (§13.6).
- [x] **Step 2 — Interlock lines.** Top `sety → wizy → profily` line; footer athenea line.
- [x] **Step 3 — Verify + commit** (in `8d0efc0`).

---

## Task 5: public passport  ✅ done (`8d0efc0`)

**Files:** Modify `apps/appy/advancedappy.html`.

- [x] **Step 1 — Passport header.** Read-only `@handle · presence · stage · stars · CU`; `public` tags on bio/offers/apps; "what the mesh sees" line; "Open full profily ↗".
- [x] **Step 2 — Verify + commit** (in `8d0efc0`).

---

## Task 6: split out standalone `apps/wizy.html` (pending)

The athenea agents app as its own file (home @ advanced), so the diagonal has a real `wizy.html`. The hub's wizy tab links to it; logic mirrors the hub's wizy room but as a full page with its own mini→super ladder stub.

**Files:**
- Create: `apps/wizy.html`
- Modify: `apps/appy/advancedappy.html` (wizy `area-head` "open wizy ↗" → real href)

**Interfaces:**
- Consumes: a seed list via `localStorage` (`appy.adv.v1.seeds`) OR its own default 6 agents if absent.
- Produces: nothing other tasks depend on.

- [ ] **Step 1 — Scaffold.** Create `apps/wizy.html` with navy-gold owl identity (reuse the owl SVG + `--wizy`/`--wizy-gold` tokens from the hub), a one-line "athenea · your agents" hero, and the `basic·normal·advanced` mode dial pattern copied from the hub (`setMode`, `data-since`).

```html
<!-- key block: the 6 agents + per-agent tuners, reading the seed -->
<div id="agent-list" class="grid2"></div>        <!-- normal: on/off -->
<div id="agent-tuners" data-since="advanced"></div> <!-- advanced: sliders -->
<script>
const SEED = JSON.parse(localStorage.getItem('appy.adv.v1')||'{}').seeds
          || ['Summaries','Suggestions','Reminders'];
const DESC = {Summaries:'condense long threads',Suggestions:'nudge what to write',
  Offers:'surface giving chances',Matches:'find people & ideas',
  Polarities:'flag disagreement',Reminders:'nudge follow-ups'};
function render(){
  const list=document.getElementById('agent-list'); list.innerHTML='';
  SEED.forEach(a=>{const w=document.createElement('label');w.className='tg';
    w.innerHTML='<span>🦉 '+a+' <span class="muted">· '+DESC[a]+'</span></span>'+
      '<span class="sw"><input type="checkbox" checked><span class="track"></span></span>';
    list.appendChild(w);});
  const t=document.getElementById('agent-tuners'); t.innerHTML='';
  SEED.forEach(a=>{const c=document.createElement('div');
    c.innerHTML='<div class="agent-pill">🦉 '+a+'</div>'+
     '<div class="slider-row"><label>strength</label><input class="wizy" type="range" min="0" max="10" value="6" oninput="this.nextElementSibling.value=this.value"><output>6</output></div>'+
     '<div class="slider-row"><label>temperature</label><input class="wizy" type="range" min="0" max="10" value="3" oninput="this.nextElementSibling.value=this.value"><output>3</output></div>';
    t.appendChild(c);});
}
render();
</script>
```

- [ ] **Step 2 — Persist the seed from the hub.** In `apps/appy/advancedappy.html` `syncSeed()`, after computing `on`, add `store.seeds = on; save();` so `wizy.html` reads the same seed list.
- [ ] **Step 3 — Link the hub to it.** Change the hub's wizy `area-head` from `<span class="open-app" style="cursor:default">new · home @ advanced</span>` to `<a class="open-app" href="../wizy.html">open wizy ↗</a>`.
- [ ] **Step 4 — Verify.** `<div>` balance on `apps/wizy.html`; extract script + `node --check`; confirm `render` + slider `oninput` resolve. Marc opens `apps/wizy.html` and confirms it shows the agents seeded by the hub (toggle a seed in the hub, reload wizy, see it change).
- [ ] **Step 5 — Commit.**

```bash
git add apps/wizy.html apps/appy/advancedappy.html
git commit -m "wizy: standalone athenea agents app (home @advanced); hub persists+links the seed"
git push -q origin main
```

---

## Task 7: profile-framed `apps/sety.html` (pending)

`apps/puzzy/sety.html` is puzzy-flavored (word/concept engine). The design wants sety as the generic "nety for data" profile finetuner. Create a profile-framed copy at `apps/sety.html` (the diagonal's sety app) and point the hub at it.

**Files:**
- Create: `apps/sety.html` (start from `apps/puzzy/sety.html`)
- Modify: `apps/appy/advancedappy.html` (sety `area-head` href `../puzzy/sety.html` → `../sety.html`)

**Interfaces:** none cross-task; standalone page.

- [ ] **Step 1 — Copy + reframe.** `cp apps/puzzy/sety.html apps/sety.html`. Replace puzzy-specific copy (word/concept/etymology platforms) with profile-data framing: Visualization (of *your data & relations*), Relations (Preferred Raters/Perspectives — keep), Explains, Contents (*your* platforms/fields), Display (*your* profile visibility). Keep its violet+teal identity and pure-CSS approach.
- [ ] **Step 2 — Wizard = agents seed.** Ensure the Wizard section names the same 6 agents as the hub (Summaries/Suggestions/Offers/Matches/Polarities/Reminders) so the diagonal reads consistently.
- [ ] **Step 3 — Repoint the hub.** In the hub, change the sety `area-head` `open-app` href and the basic-room "Open full sety" link to `../sety.html`.
- [ ] **Step 4 — Verify.** `<div>` balance; sety is pure-CSS (confirm no `<script>` regressions); Marc opens `apps/sety.html` and the hub's sety tab link.
- [ ] **Step 5 — Commit.**

```bash
git add apps/sety.html apps/appy/advancedappy.html
git commit -m "sety: profile-framed sety app (diagonal home @normal); hub links to it"
git push -q origin main
```

---

## Task 8: record the build in `making-of.html` (pending — blocked)

**Blocked:** `making-of.html` is currently deleted on disk in the in-progress repo reorg. Resume once it's restored (or its new path is known).

**Files:** Modify `making-of.html` + relevant `feeds/*.xml`.

- [ ] **Step 1 — Confirm path.** Locate the restored `making-of.html`. If still absent, stop and report to Marc.
- [ ] **Step 2 — Log the entry.** Add an appy-nety making-of entry: the driving prompts (basic→rich→advanced hub), the integration decisions (link-out vs embed; modes implemented all at once; ⚙ entry), and commit pointers `6ff9ff0 · d8194dc · 8d0efc0`. Per the talk2web convention, context = pointer-links to public Gitea commits, not embedded text.
- [ ] **Step 3 — Commit + push** (`making-of.html` always commits to Gitea flove).

---

## Task 9: OPEN DECISION — mode dial vs sibling tier files (needs Marc)

The hub's **mode dial** already expresses basic/normal/advanced in one file. The appy *access-app family* also has per-tier files (`miniappy.html`, `basicappy.html`, …). Decide before building more:

- **Option A — dial subsumes them:** `advancedappy.html` (with the dial) is the canonical advanced+normal surface; no separate `normalappy.html`. `basicappy.html` stays as the basic-only entry.
- **Option B — keep siblings:** also build `normalappy.html` / `superappy.html` as standalone tier files, dial removed or limited.

- [ ] **Step 1 — Ask Marc** (inline) which model he wants. Do not build `normalappy.html`/`superappy.html` until answered.

---

## Self-Review

**1. Spec coverage (design §4 fields #9–#17):** #9 profily-basic ✅T1 · #12 profily-normal ✅T1 · #15 profily-advanced ✅T1 · #10 sety-basic ✅T2 · #13 sety-normal+Wizard ✅T2 · #16 sety-advanced ✅T2 · #11 wizy-basic ✅T3 · #14 wizy-normal ✅T3 · #17 wizy-advanced ✅T3. Standalone wizy (§7 build-order #4) → T6. sety reframe (§7 #3) → T7. Social (#22) and vizy (#26–30) are **out of scope** here (separate diagonal apps).

**2. Placeholder scan:** no TBD/TODO; Task 6 ships real code; Task 7/8 steps are concrete actions. Task 9 is intentionally a decision gate, not a placeholder.

**3. Type/name consistency:** `setMode` · `switchRoom` · `syncSeed` · `seeds()` · `addTrust` · `setAvatar` · `flash` · `toggleMore` · `esc` — names match the shipped hub. Task 6 introduces `store.seeds` (written in T6 step 2, read in T6 step 1) consistently.

**Out of scope:** social app (#21–25), vizy app (#26–30), backend/oasis wiring (Phase D), nety quota numbers.
