# appy intros + Account language home — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `appy-mini` and `appy-basic` their own first-run entrance with the language selector living in a new **Account** area (first item), migrate language storage to the shared `flove:lang` key, add the upgrade-arrival intro + **Go home** button to appy-basic, and render the unified rainbow roadmap cards (dimmed + "upgrade Navigation" affordance).

**Architecture:** Two near-identical single-file HTML/CSS/JS apps (`apps/appy/appy-mini.html`, `apps/appy/appy-basic.html`). Both already share: `.en`/`.es` bilingual spans, a `name="lang"` radio pair, a translate2 IIFE language engine, a `#top-dropdown` top-bar menu with an `about-reveal` panel, a `bx(en,es)` helper, and a `FEATURE_TIERS` ladder. We extend these in place — no new files, no build step.

**Tech Stack:** Vanilla HTML + CSS + small JS. `localStorage`. `<details>`/reveal-panel pattern. No framework, no bundler, no test runner.

**Spec:** `docs/superpowers/specs/2026-06-24-appy-intros-rainbow-roadmap-design.md`

## Global Constraints

- Single self-contained HTML file per app; **no build step, framework, or bundler** (CLAUDE.md §4).
- **CSS-first**; JS only where CSS can't express it (CLAUDE.md §3).
- Every visible string wrapped in `.en`/`.es` siblings — **keep each file's existing `.en`/`.es` convention** (do NOT migrate to `.t-en`/`.t-es`; out of scope). Use the file's `bx(en,es)` helper for JS-built strings.
- **Shared language key = `flove:lang`** (family-wide), precedence **`?lang=` URL > `flove:lang` > migrated `translate2-lang` > `en`** (backend_plan §13.2).
- **a11y floor (CLAUDE.md §6):** visible `:focus-visible` on every control; hit targets ≥ 40×40px; collapsed-but-rendered reveal panels leave the a11y tree — JS builds toggle `el.inert = !open` (these are JS builds).
- **Token discipline** — use `var(--accent)`, `--card`, `--line`, `--ink`, `--muted`, radius/motion tokens already in each file; invent no new accent/radius/easing.
- **Verification is manual + static** (CLAUDE.md §5): no browser automation. Marc opens the `file://` page; each task lists exact selectors/states to check at desktop and mobile (~390px).
- **Gitea workflow** (memory `project_flove_gitea_workflow`): every change → commit **and push** to `localhost:3000/marc/flove` (main); commit message carries the prompt + explanation. The `docs/` spec/plan files are gitignored — only the two app files get committed.

---

## File Structure

- **Modify** `apps/appy/appy-mini.html`
  - language engine IIFE (~L4737–4762) → `flove:lang` + `?lang=` + migration + `floveLangChosen()`
  - top-bar menu `#top-dropdown` (~L1970) → add **Account** item first
  - new `#account-reveal` panel (next to `#about-reveal` ~L1988) → language selector first, then rainbow roadmap mount
  - top-bar worldball `<details class="lang">` (~L1974) → relocate radios into Account; worldball becomes an Account-opening button
  - new first-run loud-entrance gate (small IIFE near the lang engine)
  - new `RAINBOW` data + `buildRainbow()` render (near `FEATURE_TIERS` ~L4354)
- **Modify** `apps/appy/appy-basic.html`
  - all of the above (mirrored), plus:
  - upgrade-arrival loud intro gate (hooks the existing `appyTransfer` read ~L2868)
  - **Go home →** button inside the Account panel + surfaced in the loud reveal
  - rainbow cards with the basic-tier **"reached"** emphasis

Each task is one reviewable deliverable, ends with a static check + manual visual steps + a commit/push.

---

### Task 1: appy-mini — language engine → `flove:lang` + `?lang=` + migration

**Files:**
- Modify: `apps/appy/appy-mini.html` (the trailing `<script>` IIFE, currently ~L4736–4762)

**Interfaces:**
- Produces: global `window.applyLang()` (unchanged signature) and a new global `window.floveLangChosen(): boolean` (true once any language has ever been stored — used by Task 5's gate). Storage key becomes `flove:lang`.

- [ ] **Step 1: Replace the language engine IIFE**

Find the block that begins `(function(){` / `const LS = 'translate2-lang';` (just before the live-stars counter near end of file) and replace the whole IIFE with:

```js
(function(){
  const LS = 'flove:lang';
  const OLD = 'translate2-lang';                 // pre-flove:lang key — migrate once
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const radios = () => Array.from(document.querySelectorAll('input[name="lang"]'));
  const curLang = () => { const r = radios().find(x => x.checked); return r ? r.id.replace('lang-', '') : 'en'; };
  function store(li){ try { localStorage.setItem(LS, li); } catch (_) {} }
  function applyLang(){
    const li = curLang();
    document.documentElement.lang = li;
    document.querySelectorAll('option[data-en]').forEach(o => { if (o.dataset[li] != null) o.textContent = o.dataset[li]; });
    document.querySelectorAll('[data-ph-en]').forEach(el => { const v = el.dataset['ph' + cap(li)]; if (v != null) el.placeholder = v; });
    document.querySelectorAll('[data-aria-en]').forEach(el => { const v = el.dataset['aria' + cap(li)]; if (v != null) el.setAttribute('aria-label', v); });
    store(li);
  }
  window.applyLang = applyLang;
  // precedence: ?lang= URL  >  flove:lang  >  migrated translate2-lang  >  null (=> 'en' default)
  function resolveInitial(){
    let v = null;
    try { v = new URLSearchParams(location.search).get('lang'); } catch (_) {}
    if (!v) { try { v = localStorage.getItem(LS); } catch (_) {} }
    if (!v) { try { v = localStorage.getItem(OLD); } catch (_) {} if (v) store(v); }  // one-time migration
    return v;
  }
  // has the user ever chosen a language? gates the first-run loud entrance (Task 5)
  window.floveLangChosen = function(){
    try { return !!(localStorage.getItem(LS) || localStorage.getItem(OLD)); } catch (_) { return false; }
  };
  function init(){
    const saved = resolveInitial();
    if (saved){ const r = document.getElementById('lang-' + saved); if (r) r.checked = true; }
    radios().forEach(r => r.addEventListener('change', () => {
      applyLang();
      const d = document.querySelector('details.lang'); if (d) d.open = false;
      document.body.classList.remove('first-run');         // settle the loud entrance (Task 5) once picked
    }));
    applyLang();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
```

- [ ] **Step 2: Static check — new key wired, old key only as migration source**

Run:
```bash
cd /home/kdeneon/Documents/flove/apps/appy
grep -c "flove:lang" appy-mini.html          # expect >= 2
grep -n "translate2-lang" appy-mini.html      # expect exactly the one OLD-migration line
node -e "require('fs').readFileSync('appy-mini.html','utf8')" && echo "reads ok"
```
Expected: `flove:lang` count ≥ 2; `translate2-lang` appears once (the `OLD` const); no JS parse error.

- [ ] **Step 3: Verify visually (Marc)**

Open `apps/appy/appy-mini.html` in the browser. Check:
- Page loads; the 🌐 worldball still switches EN/ES (no regression).
- DevTools → Application → Local Storage: picking a language writes **`flove:lang`** (not `translate2-lang`).
- Append `?lang=es` to the URL → page loads in Spanish and stores `flove:lang=es`.
- If you previously had `translate2-lang` set, it is read once and copied to `flove:lang`.

- [ ] **Step 4: Commit + push**

```bash
cd /home/kdeneon/Documents/flove
git add apps/appy/appy-mini.html
git commit -m "appy-mini: language engine → flove:lang + ?lang= handoff + migration

Prompt (Marc): mini and basic with their own entrance and language selector;
flove:lang shared key (§13.2). Adds ?lang= URL precedence, one-time migration
from translate2-lang, and floveLangChosen() for the first-run gate.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push
```

---

### Task 2: appy-basic — language engine → `flove:lang` (mirror Task 1)

**Files:**
- Modify: `apps/appy/appy-basic.html` (trailing `<script>` IIFE, ~L4705–4730)

**Interfaces:**
- Produces: same `window.applyLang()` + `window.floveLangChosen()` in appy-basic.

- [ ] **Step 1: Replace the language engine IIFE**

Replace the identical `(function(){ const LS = 'translate2-lang'; … })();` block in `appy-basic.html` with the exact same IIFE as Task 1 Step 1 (paste it verbatim — the two files share this engine).

- [ ] **Step 2: Static check**

Run:
```bash
cd /home/kdeneon/Documents/flove/apps/appy
grep -c "flove:lang" appy-basic.html         # expect >= 2
grep -n "translate2-lang" appy-basic.html     # expect the one OLD-migration line
node -e "require('fs').readFileSync('appy-basic.html','utf8')" && echo "reads ok"
```
Expected: same as Task 1 Step 2.

- [ ] **Step 3: Verify visually (Marc)**

Open `apps/appy/appy-basic.html`: worldball switches EN/ES; picking writes `flove:lang`; `?lang=es` loads Spanish. No regression.

- [ ] **Step 4: Commit + push**

```bash
cd /home/kdeneon/Documents/flove
git add apps/appy/appy-basic.html
git commit -m "appy-basic: language engine → flove:lang + ?lang= handoff + migration

Mirror of appy-mini (Task 1): shared flove:lang key, ?lang= precedence,
translate2-lang migration, floveLangChosen() gate.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push
```

---

### Task 3: appy-mini — Account menu item + `#account-reveal` panel (language selector first)

**Files:**
- Modify: `apps/appy/appy-mini.html` — `#top-dropdown` (~L1970), worldball `<details class="lang">` (~L1974), insert `#account-reveal` after `#about-reveal` (~L1988+), add `toggleAccount()` near `toggleTopMenu()` (~L4189), add `.account-row` CSS near `.about-reveal` (~L214).

**Interfaces:**
- Consumes: `name="lang"` radios `#lang-en`/`#lang-es` (relocated here), `toggleTopMenu()`, the `about-reveal` CSS pattern.
- Produces: global `toggleAccount()`; the single `name="lang"` radio set now lives inside `#account-reveal`; the top-bar 🌐 opens Account.

- [ ] **Step 1: Add the Account menu item first in `#top-dropdown`**

In `#top-dropdown` (before the existing `#menu-about-btn`), add:
```html
<button type="button" class="top-menu-item" id="menu-account-btn" role="menuitem" onclick="toggleAccount()"><span class="en" lang="en">Account</span><span class="es" lang="es">Cuenta</span></button>
```

- [ ] **Step 2: Relocate the language radios into a new Account panel; make the worldball open Account**

Replace the top-bar worldball block:
```html
<details class="lang">
  <summary class="worldball" title="Language" aria-label="Language" data-aria-en="Language" data-aria-es="Idioma">🌐</summary>
  <div class="lang-opts">
    <input type="radio" name="lang" id="lang-en" checked><label for="lang-en">English</label>
    <input type="radio" name="lang" id="lang-es"><label for="lang-es">Español</label>
  </div>
</details>
```
with a plain button that opens Account:
```html
<button type="button" class="worldball" id="worldball-btn" title="Language" aria-label="Language" data-aria-en="Language" data-aria-es="Idioma" onclick="toggleAccount()">🌐</button>
```
Then insert the `#account-reveal` panel immediately AFTER the existing `#about-reveal …</div>` closes:
```html
<div class="about-reveal" id="account-reveal" role="region" aria-label="Account" data-aria-en="Account" data-aria-es="Cuenta">
  <button type="button" class="about-close" onclick="toggleAccount()" aria-label="Close account" data-aria-en="Close account" data-aria-es="Cerrar cuenta">×</button>
  <!-- FIRST ITEM: language selector -->
  <div class="account-row" id="account-lang">
    <div class="account-row-label"><span class="en" lang="en">Language</span><span class="es" lang="es">Idioma</span></div>
    <div class="lang-opts">
      <input type="radio" name="lang" id="lang-en" checked><label for="lang-en">English</label>
      <input type="radio" name="lang" id="lang-es"><label for="lang-es">Español</label>
    </div>
  </div>
  <!-- rainbow roadmap mounts here (Task 7) -->
  <div id="rainbow-mount"></div>
</div>
```
(The `name="lang"` radios now exist ONLY here — single valid set; the engine's `applyLang()` finds them as before.)

- [ ] **Step 3: Add `.account-row` styling (token-only) near `.about-reveal` CSS**

```css
.account-row{ display:flex; align-items:center; justify-content:space-between; gap:.75rem; flex-wrap:wrap;
  padding:.6rem 0; border-bottom:1px solid var(--line); }
.account-row-label{ font-weight:700; color:var(--ink); font-size:.9rem; }
```

- [ ] **Step 4: Add `toggleAccount()` near `toggleTopMenu()`**

```js
function toggleAccount(){
  const p = document.getElementById('account-reveal');
  if (!p) return;
  const open = !p.classList.contains('open');
  p.classList.toggle('open', open);
  p.inert = !open;                                  // a11y: leave the tree when closed (CLAUDE.md §6)
  const a = document.getElementById('about-reveal'); if (a && open){ a.classList.remove('open'); a.inert = true; }
  const dd = document.getElementById('top-dropdown'); if (dd) dd.classList.remove('open');   // close the menu
}
```

- [ ] **Step 5: Initialise the panel closed + inert (add to the file's init path)**

Near the existing startup calls (`switchTab('profile');` ~L2917), add:
```js
(function(){ const p = document.getElementById('account-reveal'); if (p){ p.inert = true; } })();
```

- [ ] **Step 6: Static check**

```bash
cd /home/kdeneon/Documents/flove/apps/appy
grep -c 'id="lang-en"' appy-mini.html         # expect exactly 1 (single radio set)
grep -q 'id="account-reveal"' appy-mini.html && grep -q 'toggleAccount' appy-mini.html && echo "account wired"
node -e "require('fs').readFileSync('appy-mini.html','utf8')" && echo "reads ok"
```
Expected: exactly one `id="lang-en"`; account markup + function present; parses.

- [ ] **Step 7: Verify visually (Marc)**

- Top-bar menu → **Account** is the first item; opening it reveals the panel with **Language as the first row**, EN/ES radios working and switching the page.
- The top-bar 🌐 button also opens Account.
- Closing Account (× or re-toggle) hides it; tab focus does not land inside it when closed (a11y).
- Mobile ~390px: rows wrap cleanly; hit targets ≥ 40px.

- [ ] **Step 8: Commit + push**

```bash
cd /home/kdeneon/Documents/flove
git add apps/appy/appy-mini.html
git commit -m "appy-mini: Account panel (first menu item) with language selector as first item

Prompt (Marc): language selector placed in Account as first item. Relocates the
single name=lang radio set into #account-reveal; worldball now opens Account;
inert-gated for a11y.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push
```

---

### Task 4: appy-basic — Account panel (language first) + Go home button

**Files:**
- Modify: `apps/appy/appy-basic.html` — `#top-dropdown` (~L1955), worldball (~L1959), `#account-reveal` after `#about-reveal` (~L1973+), `toggleAccount()` near `toggleTopMenu()` (~L4161), `.account-row` CSS (~L214), init (~L2894).

**Interfaces:**
- Consumes: same as Task 3.
- Produces: `toggleAccount()` in appy-basic; Account panel whose first item is language and which also hosts the permanent **Go home →** button.

- [ ] **Step 1: Add the Account menu item first in `#top-dropdown`**

Same `#menu-account-btn` button as Task 3 Step 1, inserted before `#menu-about-btn`.

- [ ] **Step 2: Relocate radios + insert Account panel WITH Go home**

Replace the worldball `<details class="lang">` with the same `#worldball-btn` button as Task 3 Step 2, then insert after `#about-reveal`:
```html
<div class="about-reveal" id="account-reveal" role="region" aria-label="Account" data-aria-en="Account" data-aria-es="Cuenta">
  <button type="button" class="about-close" onclick="toggleAccount()" aria-label="Close account" data-aria-en="Close account" data-aria-es="Cerrar cuenta">×</button>
  <div class="account-row" id="account-lang">
    <div class="account-row-label"><span class="en" lang="en">Language</span><span class="es" lang="es">Idioma</span></div>
    <div class="lang-opts">
      <input type="radio" name="lang" id="lang-en" checked><label for="lang-en">English</label>
      <input type="radio" name="lang" id="lang-es"><label for="lang-es">Español</label>
    </div>
  </div>
  <div id="rainbow-mount"></div>
  <!-- permanent Go home → flove landing (repo-root index.html) -->
  <div class="account-row" id="account-home">
    <button type="button" class="btn signal" onclick="location.href='../../index.html'"><span class="en" lang="en">Go home →</span><span class="es" lang="es">Ir al inicio →</span></button>
  </div>
</div>
```

- [ ] **Step 3: Add `.account-row` CSS** — same rule as Task 3 Step 3.

- [ ] **Step 4: Add `toggleAccount()`** — same function as Task 3 Step 4.

- [ ] **Step 5: Init panel closed + inert** — same IIFE as Task 3 Step 5, near `switchTab('profile');` (~L2894).

- [ ] **Step 6: Static check**

```bash
cd /home/kdeneon/Documents/flove/apps/appy
grep -c 'id="lang-en"' appy-basic.html        # expect 1
grep -q "location.href='../../index.html'" appy-basic.html && echo "go-home wired"
node -e "require('fs').readFileSync('appy-basic.html','utf8')" && echo "reads ok"
```
Expected: single radio set; Go-home link present; parses.

- [ ] **Step 7: Verify visually (Marc)**

- Account is first menu item; Language is its first row; **Go home →** appears at the bottom and navigates to the flove landing page (`../../index.html`).
- 🌐 opens Account; close/inert behaviour as in Task 3.

- [ ] **Step 8: Commit + push**

```bash
cd /home/kdeneon/Documents/flove
git add apps/appy/appy-basic.html
git commit -m "appy-basic: Account panel (language first) + permanent Go home button

Prompt (Marc): basic with its own entrance, language in Account first; Go home
→ flove landing. Mirrors appy-mini Account; adds the permanent Go-home row.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push
```

---

### Task 5: appy-mini — first-run loud entrance gate

**Files:**
- Modify: `apps/appy/appy-mini.html` — add a small gate IIFE (after the language engine), add `body.first-run` CSS near `.about-reveal`.

**Interfaces:**
- Consumes: `window.floveLangChosen()` (Task 1), `toggleAccount()` (Task 3), `#account-reveal`, `#account-lang`.
- Produces: `body.first-run` class while the loud entrance is active; removed on first language pick (already wired in Task 1's `change` handler).

- [ ] **Step 1: Add the first-run gate IIFE**

After the language engine IIFE, add:
```js
// First-run loud entrance: if no language has ever been chosen, open Account loud on the
// language row. Settles silent the moment a language is picked (engine removes .first-run).
(function(){
  function run(){
    if (window.floveLangChosen && window.floveLangChosen()) return;   // returning user → silent
    document.body.classList.add('first-run');
    if (window.toggleAccount){
      const p = document.getElementById('account-reveal');
      if (p && !p.classList.contains('open')) toggleAccount();
    }
    const row = document.getElementById('account-lang');
    if (row) row.scrollIntoView({ block: 'center' });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
```

- [ ] **Step 2: Add the loud highlight CSS (near `.about-reveal`)**

```css
/* first-run: make the Account language row unmissable; calm, token-based glow */
body.first-run #account-lang{ border:1px solid var(--accent); border-radius:var(--flove-radius-sm,12px);
  padding:.6rem .7rem; box-shadow:0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent); }
body.first-run #account-lang::before{ content:attr(data-nudge); display:block; width:100%;
  font-size:.7rem; letter-spacing:.06em; text-transform:uppercase; color:var(--accent); margin-bottom:.35rem; }
@media (prefers-reduced-motion: reduce){ body.first-run #account-lang{ box-shadow:0 0 0 2px var(--accent); } }
```
And add the bilingual nudge attribute to `#account-lang` (it reads `data-nudge`; localize via the existing aria/data mechanism — set it from JS in Step 3 so it follows language).

- [ ] **Step 3: Set the localized nudge text**

In the gate IIFE `run()`, before `scrollIntoView`, add:
```js
if (row){ const en='Choose your language', es='Elige tu idioma';
  const set=()=>row.setAttribute('data-nudge', document.documentElement.lang==='es'?es:en);
  set(); document.querySelectorAll('input[name="lang"]').forEach(r=>r.addEventListener('change',set)); }
```

- [ ] **Step 4: Static check**

```bash
cd /home/kdeneon/Documents/flove/apps/appy
grep -q "first-run" appy-mini.html && grep -q "floveLangChosen" appy-mini.html && echo "gate wired"
node -e "require('fs').readFileSync('appy-mini.html','utf8')" && echo "reads ok"
```

- [ ] **Step 5: Verify visually (Marc)**

- Clear Local Storage (remove `flove:lang` + `translate2-lang`), reload: Account opens automatically, the **Language row glows** with a "Choose your language" nudge.
- Pick a language → glow disappears, panel can be closed, and it **never auto-opens again** on reload.
- `prefers-reduced-motion`: glow is a static ring (no animation).

- [ ] **Step 6: Commit + push**

```bash
cd /home/kdeneon/Documents/flove
git add apps/appy/appy-mini.html
git commit -m "appy-mini: first-run loud language entrance (settles silent after pick)

Prompt (Marc): entrance visited only at first moment after download. Gate opens
Account loud on the language row when flove:lang unset; clears on first pick.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push
```

---

### Task 6: appy-basic — upgrade-arrival loud intro gate

**Files:**
- Modify: `apps/appy/appy-basic.html` — hook the existing `appyTransfer` read (~L2868–2871); add the arrival gate IIFE; reuse `body.first-run` / Account loud styling from Task 5 (port the CSS).

**Interfaces:**
- Consumes: `localStorage['appyTransfer']` (already read at L2868), `toggleAccount()`, `#account-reveal`, `#account-home` (the Go-home row).
- Produces: one-time flag `localStorage['appy-basic-welcomed']`; loud arrival reveal once per upgrade.

- [ ] **Step 1: Port the loud-highlight CSS from Task 5 Step 2** into appy-basic (same rules; the arrival reveal reuses the `#account-home` row as its loud focus instead of `#account-lang`).

Add, near `.about-reveal`:
```css
body.first-run #account-home{ border:1px solid var(--accent); border-radius:var(--flove-radius-sm,12px);
  padding:.6rem .7rem; box-shadow:0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent); }
@media (prefers-reduced-motion: reduce){ body.first-run #account-home{ box-shadow:0 0 0 2px var(--accent); } }
```

- [ ] **Step 2: Add the arrival gate IIFE** (after the language engine)

```js
// Upgrade-arrival loud intro: when the user just arrived from appy-mini (appyTransfer present)
// and hasn't been welcomed, open Account loud showing the reached features + Go home. Once only.
(function(){
  const FLAG = 'appy-basic-welcomed';
  function run(){
    let arrived=false, welcomed=false;
    try { arrived = !!localStorage.getItem('appyTransfer'); } catch (_) {}
    try { welcomed = !!localStorage.getItem(FLAG); } catch (_) {}
    if (!arrived || welcomed) return;
    document.body.classList.add('first-run');
    if (window.toggleAccount){ const p=document.getElementById('account-reveal');
      if (p && !p.classList.contains('open')) toggleAccount(); }
    const row = document.getElementById('account-home'); if (row) row.scrollIntoView({ block:'center' });
    try { localStorage.setItem(FLAG, '1'); } catch (_) {}   // never loud again
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
```

- [ ] **Step 3: Static check**

```bash
cd /home/kdeneon/Documents/flove/apps/appy
grep -q "appy-basic-welcomed" appy-basic.html && echo "arrival gate wired"
node -e "require('fs').readFileSync('appy-basic.html','utf8')" && echo "reads ok"
```

- [ ] **Step 4: Verify visually (Marc)**

- From appy-mini, reach 100⭐ and tap **Upgrade to basic** → appy-basic loads with Account **open and loud on the Go-home / reached-features area**.
- Reload appy-basic → it loads normally (no loud reveal); `appy-basic-welcomed` is set.
- Go home → button navigates to the flove landing.

- [ ] **Step 5: Commit + push**

```bash
cd /home/kdeneon/Documents/flove
git add apps/appy/appy-basic.html
git commit -m "appy-basic: upgrade-arrival loud intro (once) + Go home focus

Prompt (Marc): upgrade lands in appy-basic intro with Go home + features reached.
Gate fires once on arrival via appyTransfer; appy-basic-welcomed flag silences it.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push
```

---

### Task 7: appy-mini — rainbow roadmap cards (dimmed + upgrade affordance)

**Files:**
- Modify: `apps/appy/appy-mini.html` — add `RAINBOW` data + `buildRainbow()` near `FEATURE_TIERS` (~L4354); call it on init; mount into `#rainbow-mount`; add `.rb-*` CSS.

**Interfaces:**
- Consumes: `state.stars` (existing), `bx(en,es)` (~L2797), `#rainbow-mount` (Task 3).
- Produces: `RAINBOW` array, `buildRainbow()` renderer; cards dimmed + inert until their nav tier, with a persistent "upgrade Navigation" affordance.

- [ ] **Step 1: Add the `RAINBOW` data model** (the §5 tree, with nav-tier gating)

```js
// Unified rainbow roadmap (spec §5). tier = nav at which the card activates.
// Sety parents the presentation/data sub-tree; Vizy is the shared super capstone.
const RAINBOW = [
  { key:'offline', dot:'🔴', label:['Offline','Sin conexión'],   tier:'mini',
    road:[['Local store','Almacén local'],['Larger quotas','Mayores cuotas']] },
  { key:'nety',    dot:'🟠', label:['Nety','Nety'],               tier:'mini',
    road:[['Run a node, lend CPU/GPU/RAM','Ejecuta un nodo, presta CPU/GPU/RAM'],['Priority relays','Repetidores prioritarios']] },
  { key:'profile', dot:'🟡', label:['Profile','Perfil'],          tier:'mini',
    road:[['profily-mini passport','pasaporte profily-mini'],['Editable full profily','profily completo editable'],['MyWizy-assisted compose','redacción asistida por MyWizy'],['Stewardship','Administración']] },
  { key:'mynet',   dot:'🟢', label:['MyNet','MyNet'],             tier:'basic',
    road:[['Feed · circles · chat','Feed · círculos · chat'],['Agent-augmented + A/V chat','Aumentado por agentes + chat A/V']] },
  { key:'mywizy',  dot:'🔵', label:['MyWizy','MyWizy'],           tier:'advanced',
    road:[['Agents preview (seed)','Vista previa de agentes'],['One passive agent','Un agente pasivo'],['Full wizy sliders','Sliders de wizy completos'],['Orchestration','Orquestación']] },
  { key:'sety',    dot:'🟣', label:['Sety','Sety'],               tier:'advanced',
    road:[['Data mgmt · raters · viz-seed','Gestión de datos · raters · semilla viz']],
    children:[
      { key:'sound',    label:['Sound','Sonido'],   tier:'advanced', road:[['Sound engine','Motor de sonido']] },
      { key:'random',   label:['Random','Aleatorio'], tier:'advanced', road:[['Compass re-present views','Vistas de brújula']] },
      { key:'counters', label:['Counters','Contadores'], tier:'advanced', road:[['Arcade counters → unlocks','Contadores arcade → desbloqueos']] },
      { key:'vizy',     label:['Vizy','Vizy'],       tier:'super', road:[['List/Rainbow (basic)','Lista/Arcoíris (basic)'],['3D/4D · XR (advanced)','3D/4D · XR (advanced)'],['Full vizy studio (super)','Estudio vizy completo (super)']] },
    ] },
];
// nav thresholds (⭐) — mirrors FEATURE_TIERS
const RB_THRESH = { mini:0, basic:100, normal:500, advanced:2000, super:10000 };
```

- [ ] **Step 2: Add `buildRainbow()` renderer**

```js
function buildRainbow(){
  const mount = document.getElementById('rainbow-mount');
  if (!mount) return;
  const stars = (window.state && state.stars) || 0;
  const card = c => {
    const reached = stars >= (RB_THRESH[c.tier] ?? Infinity);
    const road = (c.road||[]).map(r => `<li>${bx(r[0], r[1])}</li>`).join('');
    const kids = (c.children||[]).map(k => {
      const kr = stars >= (RB_THRESH[k.tier] ?? Infinity);
      return `<div class="rb-kid${kr?'':' rb-locked'}"><span class="rb-kid-name">${bx(k.label[0],k.label[1])}</span></div>`;
    }).join('');
    const lock = reached ? '' :
      `<button type="button" class="rb-upgrade" onclick="event.stopPropagation()">${bx('Earn more points for upgrading Navigation','Gana más puntos para subir tu Navegación')}</button>`;
    return `<div class="rb-card${reached?'':' rb-locked'}" data-tier="${c.tier}">
      <div class="rb-head">${c.dot||''} <span class="rb-name">${bx(c.label[0],c.label[1])}</span></div>
      <ul class="rb-road">${road}</ul>${kids?`<div class="rb-kids">${kids}</div>`:''}${lock}</div>`;
  };
  mount.innerHTML = `<div class="rb-grid">${RAINBOW.map(card).join('')}</div>`;
  if (window.applyLang) applyLang();
}
```

- [ ] **Step 3: Call `buildRainbow()` on init** — near the other startup calls (`buildFeatureTiers();` ~L4473) add `buildRainbow();`.

- [ ] **Step 4: Add `.rb-*` CSS (token-only)**

```css
.rb-grid{ display:flex; flex-direction:column; gap:.55rem; margin-top:.6rem; }
.rb-card{ border:1px solid var(--line); border-radius:var(--flove-radius-sm,12px); padding:.6rem .7rem; background:var(--card); }
.rb-card.rb-locked{ opacity:.5; }                              /* dimmed, but still displayed (spec §5) */
.rb-head{ font-weight:700; color:var(--ink); }
.rb-road{ margin:.35rem 0 0; padding-left:1.1rem; color:var(--muted); font-size:.8rem; }
.rb-kids{ margin-top:.4rem; display:flex; flex-wrap:wrap; gap:.35rem; }
.rb-kid{ border:1px solid var(--line); border-radius:11px; padding:.1rem .5rem; font-size:.7rem; color:var(--ink); }
.rb-kid.rb-locked{ opacity:.5; }
.rb-upgrade{ margin-top:.5rem; font-size:.7rem; color:var(--accent); background:none; border:1px dotted var(--accent);
  border-radius:11px; padding:.25rem .6rem; cursor:pointer; }
.rb-upgrade:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
```

- [ ] **Step 5: Static check**

```bash
cd /home/kdeneon/Documents/flove/apps/appy
grep -q "const RAINBOW" appy-mini.html && grep -q "function buildRainbow" appy-mini.html && echo "rainbow wired"
node -e "new Function(require('fs').readFileSync('appy-mini.html','utf8').match(/const RAINBOW = \[[\s\S]*?\];/)[0]); console.log('RAINBOW parses')"
```

- [ ] **Step 6: Verify visually (Marc)**

- Open Account → below the language row, the **rainbow cards** render: Offline · Nety · Profile active (mini), **MyNet/Sety/MyWizy dimmed** with the "upgrade Navigation" affordance visible (not hidden).
- Sety shows its child chips (Sound · Random · Counters dimmed; Vizy dimmed as super).
- Switch language → card text + roadmap follow EN/ES.
- Mobile ~390px: single column, readable.

- [ ] **Step 7: Commit + push**

```bash
cd /home/kdeneon/Documents/flove
git add apps/appy/appy-mini.html
git commit -m "appy-mini: unified rainbow roadmap cards (dimmed + upgrade affordance)

Prompt (Marc): rainbow tabs keep opacity-dimmed and display upgrade-to-upper-
navigation; Sety parents Sound/Random/Counters/Vizy, activates at advanced.
Renders the §5 tree into the Account panel.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push
```

---

### Task 8: appy-basic — rainbow roadmap cards with basic-tier "reached" emphasis

**Files:**
- Modify: `apps/appy/appy-basic.html` — add the same `RAINBOW`/`RB_THRESH` data + `buildRainbow()` (with a "reached" highlight), call on init (~L4440), add `.rb-*` CSS (+ `.rb-reached`).

**Interfaces:**
- Consumes: `state.stars`, `bx()`, `#rainbow-mount` (Task 4).
- Produces: `buildRainbow()` in appy-basic that additionally flags **just-reached basic cards** with a `.rb-reached` highlight (the "additional settings you reached" cue).

- [ ] **Step 1: Add `RAINBOW` + `RB_THRESH`** — paste the exact data from Task 7 Step 1 into appy-basic (near its `FEATURE_TIERS` ~L4326).

- [ ] **Step 2: Add `buildRainbow()` with the reached highlight**

Same as Task 7 Step 2, but change the `card` function's first lines to mark basic cards as reached-highlight:
```js
  const card = c => {
    const reached = stars >= (RB_THRESH[c.tier] ?? Infinity);
    const justBasic = reached && c.tier === 'basic';          // basic-tier cards: "you reached these"
    const road = (c.road||[]).map(r => `<li>${bx(r[0], r[1])}</li>`).join('');
    const kids = (c.children||[]).map(k => {
      const kr = stars >= (RB_THRESH[k.tier] ?? Infinity);
      return `<div class="rb-kid${kr?'':' rb-locked'}"><span class="rb-kid-name">${bx(k.label[0],k.label[1])}</span></div>`;
    }).join('');
    const lock = reached ? '' :
      `<button type="button" class="rb-upgrade" onclick="event.stopPropagation()">${bx('Earn more points for upgrading Navigation','Gana más puntos para subir tu Navegación')}</button>`;
    return `<div class="rb-card${reached?'':' rb-locked'}${justBasic?' rb-reached':''}" data-tier="${c.tier}">
      <div class="rb-head">${c.dot||''} <span class="rb-name">${bx(c.label[0],c.label[1])}</span>${justBasic?` <span class="rb-badge">${bx('reached ✓','alcanzado ✓')}</span>`:''}</div>
      <ul class="rb-road">${road}</ul>${kids?`<div class="rb-kids">${kids}</div>`:''}${lock}</div>`;
  };
```
Keep the rest of `buildRainbow()` (the `mount.innerHTML = …; applyLang();`) identical to Task 7 Step 2.

- [ ] **Step 3: Call `buildRainbow()` on init** — near `buildFeatureTiers();` (~L4440) add `buildRainbow();`.

- [ ] **Step 4: Add `.rb-*` CSS** — paste Task 7 Step 4 CSS, plus:
```css
.rb-reached{ border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent); }
.rb-badge{ font-size:.62rem; color:var(--accent); border:1px solid var(--accent); border-radius:9px; padding:0 .35rem; margin-left:.35rem; }
```

- [ ] **Step 5: Static check**

```bash
cd /home/kdeneon/Documents/flove/apps/appy
grep -q "const RAINBOW" appy-basic.html && grep -q "rb-reached" appy-basic.html && echo "rainbow+reached wired"
node -e "new Function(require('fs').readFileSync('appy-basic.html','utf8').match(/const RAINBOW = \[[\s\S]*?\];/)[0]); console.log('RAINBOW parses')"
```

- [ ] **Step 6: Verify visually (Marc)**

- Open appy-basic Account → rainbow cards render; the **basic-tier MyNet card shows a "reached ✓" badge + accent ring** (the "additional settings you reached" cue).
- Higher cards (Sety/MyWizy/super Vizy) stay dimmed with the upgrade affordance.
- After upgrade arrival (Task 6), the loud Account reveal shows these reached cards + Go home.
- Language switch + mobile ~390px clean.

- [ ] **Step 7: Commit + push**

```bash
cd /home/kdeneon/Documents/flove
git add apps/appy/appy-basic.html
git commit -m "appy-basic: rainbow roadmap cards + basic-tier reached highlight

Prompt (Marc): extend appy-basic — features intro shows the reached basic
settings. Renders the §5 rainbow tree with a 'reached ✓' badge on basic cards.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push
```

---

## Self-Review notes
- **Spec coverage:** flove:lang+?lang= (T1/T2 ✓), Account w/ language first (T3/T4 ✓), Go home (T4 ✓), first-run loud entrance appy-mini (T5 ✓), upgrade-arrival loud intro appy-basic (T6 ✓), rainbow dimmed+upgrade affordance + Sety-parent tree (T7 ✓), basic "reached" emphasis / appy-basic extension (T8 ✓).
- **Deferred (per spec §6):** deep per-feature intro copy inside appy-basic — iterative, beyond this plan; the cards + framework land here.
- **Type/name consistency:** `RAINBOW`/`RB_THRESH`/`buildRainbow()`/`toggleAccount()`/`floveLangChosen()`/`#account-reveal`/`#rainbow-mount`/`#account-lang`/`#account-home`/`body.first-run`/`appy-basic-welcomed` used identically across tasks.
- **Single radio set:** Tasks 3/4 relocate the `name="lang"` radios (one `#lang-en`/`#lang-es` per file) — static checks assert exactly one.
