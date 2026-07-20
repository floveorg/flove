# Trusty — "For something / People" Dual-Axis App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Handoff note:** This plan is written to be executed in **frontend-designer mode**. The plan locks the *structure, data model, and required behaviors*; the designer refines spacing, motion curves, and exact color/shadow values to flove's house style. Anywhere this plan gives concrete CSS values, treat them as a working baseline, not a mandate.

**Goal:** Rebuild `apps/trusty/trusty.html` around two top-level axes — **"For something"** (a trust-declaration + conditions *form*) and **"People"** (a 7-band trust *tree*) — driven by a full advanced topbar (blogyadvanced pattern) whose controls switch axes and alter the displays.

**Architecture:** Single self-contained HTML file (advanced tier, vanilla JS — matches the existing trusty.html and flove's single-file distro). Two inline data constants (`PEOPLE`, `CONDITIONS`) are the source of truth; JS renderers build both views from them. Axis switching and display modifiers use the blogyadvanced idiom: hidden `<input type="radio/checkbox">` in the topbar + `body:has(#id:checked) …` CSS rules — no per-control JS. Handoff items (`→ app`) render as logo buttons with a flashy glow linking to sibling apps.

**Tech Stack:** HTML + CSS (`:has()`, custom props, container-relative sizing) + vanilla JS (data-driven `render*()` functions). No build step, no framework, no test runner. Sage accent already in `:root` (`--accent:#5a8f7b`). Inline SVG marks lifted from `apps/trusty/logos.html` and `apps/economy/dealy/logos.html`.

**Verification model:** No test harness exists for these apps. Each task ends with (a) a **render check** — Marc opens the file in his browser (do NOT use chrome-devtools; he opens it himself), and where a self-check is possible, rasterize an isolated SVG/section with `convert … out.png` + Read per the repo's "rasterize-to-verify" practice; and (b) a **commit + push** to Gitea (`localhost:3000/marc/flove`, main).

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `apps/trusty/trusty.html` | The whole app: shell, topbar, both views, CSS, data, renderers | **Modify** (large existing file — extend, don't rewrite from scratch) |
| `apps/trusty/trusty-people-conditions.md` | Design source of truth (already exists) | **Update** to the final 7-band model so code + doc agree |
| `apps/trusty/logos.html` | Source of the inline sibling SVG marks | **Read only** (copy marks out) |

Data stays **inline** in `trusty.html` (single-file convention), inside a clearly delimited `// ===== DATA =====` block in the page's existing `<script>`.

**Naming contract (use these exact identifiers across all tasks):**
- Data: `PEOPLE` (array of categories), `CONDITIONS` (array of condition-groups), `LOGOS` (map appKey → SVG string).
- Render fns: `renderPeople()`, `renderCategory(cat)`, `renderItem(item)`, `renderHandoff(appKey)`, `renderConditions()`.
- Axis radios: `#axis-something`, `#axis-people`. Display checkboxes: `#disp-originals` (show/hide Originals), `#disp-compact` (compact density), `#disp-handoffs` (show/hide handoff buttons), `#all-open` (expand all categories).
- View roots: `#view-something`, `#view-people`.
- CSS classes: `.tcat` (category block), `.tcat-main` (the big Main phrase), `.tsub` (subcategory, bold), `.titem` (a trust item), `.titem--formal`, `.titem--original`, `.thandoff` (the flashy app button).

---

## Data Model (authoritative)

This is the final, approved 7-band model (personal → social-global). `f` = formal, `o` = original (highlighted differently). `app` set ⇒ the item renders as a handoff button instead of a plain row.

### Task 0: Lock the data model + sync the design doc

**Files:**
- Modify: `apps/trusty/trusty-people-conditions.md` (replace PART A with the 7-band tree below; keep PART B Conditions and the trust-types table)

- [ ] **Step 1: Rewrite PART A of the md** to the 7 categories / subcategories / items exactly as encoded in `PEOPLE` below (Heart → Safety → Privacy&Words → Care → Time → Work&Money → Roles&Society), mark Originals with ✦, keep PART B and the G-type table, and update the intro to describe the three-layer People view (Main · Subcategory · Formal/Original) + the two axes.
- [ ] **Step 2: Commit + push**

```bash
git add apps/trusty/trusty-people-conditions.md
git commit -m "trusty: lock 7-band People model (personal→social) as code source of truth

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 3: Define the `PEOPLE` constant** inside the `// ===== DATA =====` block of `trusty.html`'s script. Use exactly this structure and content:

```js
// ===== DATA =====
const PEOPLE = [
  { key:'heart', emoji:'💗', name:'Heart',
    main:'They hold my heart, and have my back',
    subs:[
      { name:'Presence', items:[
        {t:'Be there when I’m low'}, {t:'Hold space for my feelings'},
        {t:'Keep loving me when I’m hard to love'},
        {t:'See I’m not okay before I say it', o:true},
        {t:'Let me be unfinished, still becoming', o:true} ]},
      { name:'Loyalty', items:[
        {t:'Have my back / take my side'}, {t:'Stay loyal — don’t betray me'},
        {t:'Speak well of me when I’m not in the room', o:true} ]},
    ]},
  { key:'safety', emoji:'🦺', name:'Safety',
    main:'They won’t put me at risk',
    subs:[
      { name:'Physical', items:[
        {t:'Keep me physically safe'}, {t:'Drive safely'},
        {t:'Lock up / not lose my keys'}, {t:'Call for help when needed'} ]},
      { name:'Limits & consent', items:[
        {t:'Respect a “no” / a limit (knock, ask, personal space)'},
        {t:'Follow the rules / agreements'} ]},
      { name:'Foresight', items:[
        {t:'Have a backup plan'}, {t:'Not put me at risk'},
        {t:'Warn me of a risk even when inconvenient', o:true} ]},
      { name:'Worst-case', items:[
        {t:'Honor a safe-word the first time', o:true, app:'evily'},
        {t:'Name the worst case with me in advance', o:true, app:'evily'} ]},
    ]},
  { key:'privacy', emoji:'🔒', name:'Privacy & Words',
    main:'Safe with my words — what’s private stays, what’s said is true',
    subs:[
      { name:'Secrets', items:[
        {t:'Keep a secret'}, {t:'Not share my photos / messages'},
        {t:'Handle my data / passwords safely'}, {t:'Not read my phone / mail'},
        {t:'Not screenshot or forward private chats'},
        {t:'Keep my whereabouts private'}, {t:'Delete things when I ask'},
        {t:'Not perform our privacy online (no soft-bragging)', o:true} ]},
      { name:'Honesty', items:[
        {t:'Tell me the truth'}, {t:'Give a straight answer'},
        {t:'Say “I don’t know” instead of bluffing', o:true},
        {t:'Tell me the hard thing kindly', o:true} ]},
      { name:'Voice', items:[
        {t:'Reply / keep in touch'}, {t:'Pass on messages faithfully'},
        {t:'Keep me in the loop'}, {t:'Answer when it matters / pick up'},
        {t:'Not interrupt or talk over me'},
        {t:'Repair after a misunderstanding', o:true, app:'maty'} ]},
    ]},
  { key:'care', emoji:'🤝', name:'Care',
    main:'They’ll look after what I love',
    subs:[
      { name:'Dependents', items:[
        {t:'Look after my kid', app:'parenty'},
        {t:'Care for my pet / plants'}, {t:'Keep an eye on an elder or dependent'} ]},
      { name:'In a crisis', items:[
        {t:'Be there in an emergency'}, {t:'Help when I’m sick'},
        {t:'Give me meals / medication on time'} ]},
      { name:'Practical', items:[
        {t:'Drive me / pick me up'}, {t:'House-sit / watch my home'} ]},
      { name:'Staying power', items:[
        {t:'Keep caring when it’s boring, not just dramatic', o:true},
        {t:'Tend a shared bond over years', o:true, app:'myfamily'},
        {t:'Let a bond end kindly when it’s run its course', o:true, app:'myfamily'} ]},
    ]},
  { key:'time', emoji:'⏱️', name:'Time',
    main:'They won’t waste my time',
    subs:[
      { name:'Showing up', items:[
        {t:'Show up on time'}, {t:'Cover / swap a shift'},
        {t:'Give notice before cancelling'}, {t:'Reply within a reasonable time'},
        {t:'Meet a deadline'} ]},
      { name:'Pace', items:[
        {t:'Keep a slow pace with me, no rushing', o:true},
        {t:'Remember the dates that matter to me', o:true} ]},
    ]},
  { key:'work', emoji:'💼', name:'Work & Money',
    main:'Fair with my work and my money',
    note:'transactional specifics → Dealy',
    subs:[
      { name:'Work / Quality', items:[
        {t:'Do the job to standard'}, {t:'Not cut corners'},
        {t:'Stand by their work / fix mistakes'}, {t:'Clean up after the work'} ]},
      { name:'Work / Honest ability', items:[
        {t:'Admit when out of their depth'}, {t:'Give honest advice'} ]},
      { name:'Work / Teaching', items:[
        {t:'Teach me instead of doing it for me', o:true},
        {t:'Let me fail safely while learning', o:true},
        {t:'Credit my part of the work', o:true} ]},
      { name:'Money / Fair dealing', items:[
        {t:'Pay me back', app:'dealy'}, {t:'Split fairly'},
        {t:'Not overspend shared funds'}, {t:'Return what they borrow'},
        {t:'Handle cash honestly'} ]},
      { name:'Money / Transparency', items:[
        {t:'Be transparent about costs'}, {t:'Keep receipts'},
        {t:'Tell me early if they can’t pay', o:true} ]},
      { name:'Money / Grace', items:[
        {t:'Not let money change how we treat each other', o:true},
        {t:'Receive help without shame / give without scorekeeping', o:true} ]},
    ]},
  { key:'roles', emoji:'🌐', name:'Roles & Society',
    main:'People do right by me, even when we’re not close',
    subs:[
      { name:'Service & expertise', items:[
        {t:'A professional to act in my interest, not just bill me'},
        {t:'A teacher / mentor to teach me honestly'},
        {t:'An expert to admit when something’s outside their remit', o:true} ]},
      { name:'Authority & fairness', items:[
        {t:'Someone with power over me to use it fairly'},
        {t:'An official to apply the same rule to everyone'},
        {t:'A leader to tell the truth even when it costs them', o:true} ]},
      { name:'Strangers & the commons', items:[
        {t:'A stranger to help in a pinch'},
        {t:'To be treated decently by people who don’t know me'},
        {t:'People not to take advantage when I’m vulnerable', o:true} ]},
      { name:'Community & belonging', items:[
        {t:'My neighbors to look out for the street'},
        {t:'A community to keep its word to its members'},
        {t:'A group to include me as I am', o:true} ]},
    ]},
];
```

- [ ] **Step 4: Define `CONDITIONS`** (PART B of the md — the "For something" form picklist) in the same block:

```js
const CONDITIONS = [
  { code:'C-A', name:'Duration & timing', items:[
    'Open-ended — no fixed window','Fixed period — start → end date','Per occasion / per session only',
    'A deadline to begin','A minimum span','A maximum span',
    'Until a certain external event happens','Until something internal changes',
    'Terms revisited each time','One commitment at a time (no parallel)','Agree the end together'] },
  { code:'C-B', name:'Place & context', items:[
    'Only in certain settings','Only when I’m present / together','Only around certain people','Not around certain people'] },
  { code:'C-C', name:'Purpose', items:[
    'Granted only for a stated purpose','Not for any other purpose without asking'] },
  { code:'C-D', name:'Care & handling', items:[
    'Revocable at any time','Granted freely / no strings','Report problems promptly',
    'Leave things as found — or better','No misuse; no passing it on','Repair / make good if something breaks'] },
  { code:'C-E', name:'Who qualifies', items:[
    'Vouched for by someone','Based on reputation / endorsed','A maturity or age threshold',
    'A sobriety condition','A skill / qualification needed','Certain people must be present',
    'Certain people must be absent','Transferable to another person?'] },
  { code:'C-F', name:'Reciprocity', items:[
    'Nothing expected — a gift','In kind — return the favor','Time instead',
    'Cover the cost / a deposit upfront','Documentation as the “payment”'] },
  { code:'C-G', name:'Transparency', items:[
    'A record / log is kept','Visible to our circle / others','A check-in cadence'] },
];
```

- [ ] **Step 5: Define `LOGOS`** — copy each inline SVG `<svg class="mark" …>…</svg>` from `apps/trusty/logos.html` (and Dealy's from `apps/economy/dealy/logos.html`). Keys must match the `app:` values used in `PEOPLE`: `evily`, `maty`, `parenty`, `myfamily`, `dealy`. Example (parenty + myfamily marks already verified in logos.html lines 92 / 110):

```js
const LOGOS = {
  parenty: `<svg class="mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="8.6" r="2"/><path d="M3.8 19.5 a3.2 3.8 0 0 1 6.4 0"/><circle cx="17" cy="8.6" r="2"/><path d="M13.8 19.5 a3.2 3.8 0 0 1 6.4 0"/><circle cx="12" cy="13" r="1.6"/><path d="M9.6 20 a2.4 2.8 0 0 1 4.8 0"/></svg>`,
  myfamily: `<svg class="mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 11.2 l7.5 -6 7.5 6"/><path d="M6.4 11 v8 h11.2 v-8"/><path fill="currentColor" stroke="none" transform="translate(12 15) scale(1.6)" d="M0 1.7C-1.8 0-1.8-1.6-0.8-1.6-0.25-1.6 0-1.05 0-0.75 0-1.05 0.25-1.6 0.8-1.6 1.8-1.6 1.8 0 0 1.7Z"/></svg>`,
  // maty, evily: lift from apps/trusty/logos.html (their gcell marks)
  // dealy: lift from apps/economy/dealy/logos.html
};
const HANDOFF = {
  parenty:{label:'Parenty', href:'parenty.html'},
  myfamily:{label:'MyFamily', href:'myfamily.html'},
  maty:{label:'Maty', href:'maty.html'},
  evily:{label:'Evily', href:'evily.html'},
  dealy:{label:'Dealy', href:'../economy/dealy/index.html'},
};
```

- [ ] **Step 6: Commit + push** the data block (`git add apps/trusty/trusty.html` … same message style as above).

**Render check:** Open `trusty.html`; `console.log(PEOPLE.length)` should be `7`, `console.log(CONDITIONS.length)` `7`. No visual change yet.

---

### Task 1: Advanced topbar — axis switch + display modifiers

**Files:**
- Modify: `apps/trusty/trusty.html` — replace the current `<header class="topbar">…</header>` inner controls (keep the `mark-link` + `brand-toggle`); add the axis segmented control and a compass-style modifier cluster, mirroring `apps/blogy/blogyadvanced.html` (hidden inputs + `body:has()` CSS).

- [ ] **Step 1: Add the hidden state inputs** at the very top of `<body>` (so `body:has()` can see them), exactly:

```html
<!-- axis + display state (CSS-driven, blogyadvanced idiom) -->
<input type="radio" name="axis" id="axis-people"   class="vh" checked>
<input type="radio" name="axis" id="axis-something" class="vh">
<input type="checkbox" id="disp-originals" class="vh" checked>
<input type="checkbox" id="disp-handoffs" class="vh" checked>
<input type="checkbox" id="disp-compact"  class="vh">
<input type="checkbox" id="all-open"      class="vh">
```

(`.vh` = visually-hidden; reuse the existing screen-reader-only class if present, else add `.vh{position:absolute;width:1px;height:1px;clip:rect(0 0 0 0);overflow:hidden;}`.)

- [ ] **Step 2: Add the topbar controls** inside `.topbar-inner` (after the brand, before the spacer): a segmented **axis switch** (two `<label>`s targeting the radios) and a **modifier row** of `<label>` toggles for the checkboxes. Concrete markup:

```html
<div class="axis-seg" role="tablist" aria-label="View">
  <label for="axis-people"   class="axis-tab">People</label>
  <label for="axis-something" class="axis-tab">For something</label>
</div>
<div class="disp-row" aria-label="Display options">
  <label for="disp-originals" class="disp-chip" title="Show flove-original items">✦ Originals</label>
  <label for="disp-handoffs"  class="disp-chip" title="Show app handoffs">↗ Handoffs</label>
  <label for="disp-compact"   class="disp-chip" title="Compact density">≣ Compact</label>
  <label for="all-open"       class="disp-chip" title="Expand all">⤢ Expand all</label>
</div>
```

- [ ] **Step 3: Style the controls** — sage-accented segmented control + pill chips that show pressed state from the underlying input. Baseline CSS:

```css
.axis-seg{ display:inline-flex; border:1.5px solid var(--accent-soft); border-radius:var(--radius-pill); overflow:hidden; }
.axis-tab{ padding:.35rem .9rem; font-weight:600; cursor:pointer; color:var(--accent-deep); transition:.18s; }
body:has(#axis-people:checked)   .axis-tab[for="axis-people"],
body:has(#axis-something:checked).axis-tab[for="axis-something"]{ background:var(--accent); color:#fff; }
.disp-row{ display:inline-flex; gap:.35rem; margin-left:.5rem; }
.disp-chip{ padding:.22rem .6rem; border:1px solid var(--accent-soft); border-radius:var(--radius-pill); font-size:.8rem; cursor:pointer; opacity:.55; transition:.18s; }
body:has(#disp-originals:checked) .disp-chip[for="disp-originals"],
body:has(#disp-handoffs:checked)  .disp-chip[for="disp-handoffs"],
body:has(#disp-compact:checked)   .disp-chip[for="disp-compact"],
body:has(#all-open:checked)       .disp-chip[for="all-open"]{ opacity:1; background:var(--accent-soft); color:var(--accent-deep); font-weight:600; }
```

- [ ] **Step 4: Render check** — open in browser: clicking the two tabs flips the active pill; the four chips toggle pressed/unpressed. No view wired yet (next task). 
- [ ] **Step 5: Commit + push.**

---

### Task 2: Two view roots + axis-driven show/hide

**Files:**
- Modify: `apps/trusty/trusty.html` — wrap the existing form cards (Who / Scope / Additional Protection / Signals / Declaration) in `#view-something`; add an empty `#view-people` sibling.

- [ ] **Step 1:** Wrap the current `<main class="container">…</main>` contents in `<div id="view-something">…</div>`. Immediately after it (inside `main`), add `<div id="view-people" aria-live="polite"></div>`.
- [ ] **Step 2: Axis CSS** — only the selected axis shows:

```css
#view-people, #view-something{ display:none; }
body:has(#axis-people:checked)   #view-people{ display:block; }
body:has(#axis-something:checked) #view-something{ display:block; }
```

- [ ] **Step 3: Render check** — "For something" tab shows the existing form; "People" tab shows an empty panel. 
- [ ] **Step 4: Commit + push.**

---

### Task 3: People tree renderer

**Files:**
- Modify: `apps/trusty/trusty.html` — add `renderPeople()` / `renderCategory()` / `renderItem()` / `renderHandoff()` to the script; call `renderPeople()` on load.

- [ ] **Step 1: Implement the renderers** (exact structure — CSS in Task 4 keys off these classes/attrs):

```js
function renderHandoff(appKey){
  const h = HANDOFF[appKey]; const svg = LOGOS[appKey] || '';
  return `<a class="thandoff" href="${h.href}" data-app="${appKey}">
            <span class="thandoff-logo">${svg}</span>
            <span class="thandoff-label">→ Open ${h.label}</span>
          </a>`;
}
function renderItem(item){
  if(item.app) return renderHandoff(item.app);
  const cls = 'titem ' + (item.o ? 'titem--original' : 'titem--formal');
  return `<label class="${cls}"><input type="checkbox"><span>${item.t}</span></label>`;
}
function renderCategory(cat){
  const subs = cat.subs.map(s => `
    <div class="tsub-block">
      <h4 class="tsub">${s.name}</h4>
      <div class="titem-list">${s.items.map(renderItem).join('')}</div>
    </div>`).join('');
  const note = cat.note ? `<span class="tcat-note">${cat.note}</span>` : '';
  return `<details class="tcat" data-cat="${cat.key}" open>
    <summary class="tcat-head"><span class="tcat-emoji">${cat.emoji}</span>
      <span class="tcat-name">${cat.name}</span>${note}</summary>
    <p class="tcat-main">${cat.main}</p>
    <div class="tsub-grid">${subs}</div>
  </details>`;
}
function renderPeople(){
  document.getElementById('view-people').innerHTML = PEOPLE.map(renderCategory).join('');
}
renderPeople();
```

- [ ] **Step 2: Render check** — "People" tab now lists all 7 categories with their subs and items (unstyled). Confirm Heart is first, Roles & Society last, and handoff rows show "→ Open Parenty/MyFamily/Maty/Evily/Dealy".
- [ ] **Step 3: Commit + push.**

---

### Task 4: People tree visual hierarchy

The four requested rules: **Main bigger, shown below the mother category** · **subcategories bold** · **formal items have distinct borders** · **originals highlighted differently** (per the locked UI decision: one list, originals stand out). Compact + all-open + originals visibility are driven by the topbar checkboxes.

**Files:** Modify `apps/trusty/trusty.html` CSS.

- [ ] **Step 1: Baseline tree CSS** (designer refines exact values):

```css
.tcat{ border:1px solid var(--accent-soft); border-radius:14px; padding:.6rem .9rem 1rem; margin:.8rem 0; }
.tcat-head{ display:flex; align-items:center; gap:.5rem; cursor:pointer; font-weight:700; font-size:1.05rem; }
.tcat-emoji{ font-size:1.3rem; }
.tcat-note{ font-size:.72rem; color:var(--accent-deep); opacity:.7; margin-left:auto; }
/* MAIN — bigger, sits right below the mother category header */
.tcat-main{ font-family:var(--font-display, Georgia, serif); font-size:1.5rem; line-height:1.25;
  color:var(--accent-deep); margin:.5rem 0 1rem; font-weight:600; }
/* SUBCATEGORY — bold */
.tsub{ font-weight:700; font-size:.95rem; margin:.6rem 0 .35rem; color:var(--accent-deep); }
.tsub-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:.4rem 1.2rem; }
.titem-list{ display:flex; flex-direction:column; gap:.3rem; }
.titem{ display:flex; align-items:flex-start; gap:.5rem; padding:.35rem .55rem; border-radius:10px; cursor:pointer; font-size:.9rem; }
/* FORMAL — distinct (solid) border */
.titem--formal{ border:1.5px solid var(--accent-soft); }
/* ORIGINAL — highlighted differently: dashed accent + soft tint, no separate tab */
.titem--original{ border:1.5px dashed var(--accent); background:var(--accent-glow); }
.titem--original span::after{ content:' ✦'; color:var(--accent); }
.titem:has(input:checked){ background:var(--accent); color:#fff; }
```

- [ ] **Step 2: Display-modifier CSS** (wire the topbar checkboxes):

```css
body:not(:has(#disp-originals:checked)) .titem--original{ display:none; }
body:not(:has(#disp-handoffs:checked))  .thandoff{ display:none; }
body:has(#disp-compact:checked) .tcat-main{ font-size:1.15rem; margin:.3rem 0 .6rem; }
body:has(#disp-compact:checked) .titem{ padding:.2rem .4rem; font-size:.82rem; }
/* Expand-all forces every <details.tcat> open via a sibling control hint */
body:has(#all-open:checked) .tcat:not([open]){ /* see Step 3 */ }
```

- [ ] **Step 3: Make "Expand all" actually open the `<details>`** (CSS can't force `open`; one tiny JS listener — acceptable in advanced tier):

```js
document.getElementById('all-open').addEventListener('change', e=>{
  document.querySelectorAll('.tcat').forEach(d=> d.open = e.target.checked);
});
```

- [ ] **Step 4: Render check** — Main phrase reads large under each category header; subcategory labels are bold; formal items have a solid border, originals a dashed accent border + ✦; toggling "Originals" hides/shows the dashed ones; "Compact" tightens everything; "Expand all" opens/closes all categories.
- [ ] **Step 5: Commit + push.**

---

### Task 5: Flashy handoff buttons with logo in front

Requested: handoff buttons have **a flashy effect around them and their logo in front**.

**Files:** Modify `apps/trusty/trusty.html` CSS (the `.thandoff` markup already exists from Task 3).

- [ ] **Step 1: Baseline flashy button CSS** (animated accent glow ring + leading logo; designer tunes the motion):

```css
.thandoff{ display:inline-flex; align-items:center; gap:.5rem; padding:.4rem .8rem .4rem .5rem;
  border-radius:var(--radius-pill); font-weight:600; font-size:.88rem; color:#fff;
  text-decoration:none; background:linear-gradient(120deg,var(--accent),var(--accent-deep));
  position:relative; isolation:isolate; box-shadow:0 4px 14px var(--accent-glow); }
.thandoff-logo{ display:inline-flex; width:26px; height:26px; padding:3px; border-radius:50%;
  background:rgba(255,255,255,.9); color:var(--accent-deep); }
.thandoff-logo .mark{ width:20px; height:20px; }
/* flashy ring around the whole button */
.thandoff::before{ content:''; position:absolute; inset:-3px; border-radius:inherit; z-index:-1;
  background:conic-gradient(from 0deg, var(--accent), #fff6, var(--accent-deep), var(--accent));
  filter:blur(5px); opacity:.8; animation:thaloSpin 4s linear infinite; }
.thandoff:hover{ transform:translateY(-1px) scale(1.03); }
.thandoff:hover::before{ opacity:1; animation-duration:1.6s; }
@keyframes thaloSpin{ to{ transform:rotate(1turn); } }
@media (prefers-reduced-motion:reduce){ .thandoff::before{ animation:none; } }
```

- [ ] **Step 2: Self-verify the logo renders** — isolate one `LOGOS.parenty` SVG into a tiny standalone `.svg` file, `convert /tmp/m.svg /tmp/m.png`, and Read it to confirm the mark draws (rasterize-to-verify practice). Delete the temp files.
- [ ] **Step 3: Render check** — each handoff (Parenty, MyFamily, Maty, Evily, Dealy) shows its sibling logo in a white disc on the left, label "→ Open X", with an animated glow ring; hover speeds the ring; reduced-motion disables it.
- [ ] **Step 4: Commit + push.**

---

### Task 6: "For something" — conditions form

Requested: the "For something" axis shows **a form like the Conditions** (the existing Who/Scope/Protection/Signals declaration **plus** the C-A…C-H conditions picklist).

**Files:** Modify `apps/trusty/trusty.html` — append a Conditions card into `#view-something`; add `renderConditions()`.

- [ ] **Step 1: Add a Conditions card** after the existing "Additional Protection" card, inside `#view-something`:

```html
<details class="card" data-step="4">
  <summary class="card-summary"><h2>Conditions</h2></summary>
  <div class="card-body"><div id="conditionsList"></div></div>
</details>
```

- [ ] **Step 2: Implement `renderConditions()`** — render each group as a labeled fieldset of checkbox pills, reusing the app's `.pill` look:

```js
function renderConditions(){
  document.getElementById('conditionsList').innerHTML = CONDITIONS.map(g => `
    <fieldset class="cond-group">
      <legend><b>${g.code}</b> · ${g.name}</legend>
      <div class="cond-items">${g.items.map(t =>
        `<label class="pill cond-pill"><input type="checkbox"><span>${t}</span></label>`).join('')}</div>
    </fieldset>`).join('');
}
renderConditions();
```

- [ ] **Step 3: Style** `.cond-group`/`.cond-items` to match the existing scope-pill layout (flex-wrap, gap; selected pill = sage fill, reuse `.pill:has(input:checked)` if present).
- [ ] **Step 4: Render check** — "For something" tab shows the existing declaration plus the new Conditions card with 7 groups (C-A…C-G) of selectable pills.
- [ ] **Step 5: Commit + push.**

---

### Task 7: Onboarding + related-apps sync + final pass

**Files:** Modify `apps/trusty/trusty.html`.

- [ ] **Step 1: Fix the stale related-apps row** — the current row links `sensy/crowdparenting/crumbler/MyFamily.html` which don't exist. Replace with the real siblings: `daty.html, maty.html, hoty.html, parenty.html, myfamily.html, crumbly.html, evily.html` (+ Dealy → `../economy/dealy/index.html`).
- [ ] **Step 2: Update onboarding/intro copy** to name the two axes ("**For something** — build a trust declaration with conditions" · "**People** — browse what trusting someone can mean") and that the topbar switches and reshapes the view. Follow the existing onboarding pattern (§13.6 IIFE localStorage: loud first time, discreet after) already used in the app family.
- [ ] **Step 3: Default axis** — confirm `#axis-people` is `checked` so the tree (the new headline feature) shows first; the brand-toggle/menu still work.
- [ ] **Step 4: Full render check** — both tabs, all four display chips, handoffs, conditions form, onboarding-first-run.
- [ ] **Step 5: Commit + push** the final state.

---

## Self-Review (completed against the spec)

- **Two axes (For something / People):** Tasks 1–2 (switch + view roots), Task 6 (form), Tasks 3–5 (tree). ✅
- **"For something" = conditions form:** Task 6 renders C-A…C-G + keeps the declaration. ✅
- **People = the tree:** Task 3 renders the 7-band model from `PEOPLE`. ✅
- **Bold subcategories:** `.tsub{font-weight:700}` (Task 4). ✅
- **Different borders for formal:** `.titem--formal{solid border}` vs `.titem--original{dashed}` (Task 4). ✅
- **Bigger Main, below the mother category:** `.tcat-main` 1.5rem placed after `.tcat-head` in `renderCategory` (Tasks 3–4). ✅
- **Originals highlighted differently (not a separate tab):** dashed accent + tint + ✦, single list (Task 4) — matches the locked UI decision. ✅
- **Handoff flashy effect + logo in front:** `.thandoff::before` glow ring + `.thandoff-logo` (Tasks 3, 5). ✅
- **Full advanced topbar altering displays (blogyadvanced):** hidden inputs + `body:has()` for axis + 4 modifiers (Task 1), display CSS (Tasks 2, 4). ✅
- **Open items deferred (not in scope here):** md open-Q3 (Conditions vs existing Protection fields — merge?) and open-Q4 (→ crumbly granular mode). Flagged, not built. ⚠️

## Decisions left for the designer / Marc
1. **Conditions overlap (md Q3):** Task 6 adds Conditions *alongside* the existing "Additional Protection" card. If they should merge, that's a follow-up.
2. **`→ crumbly` granular mode (md Q4):** not wired — add later if wanted.
3. **Exact motion/shadow/typography:** baselines given; frontend-designer mode owns the final aesthetics.
