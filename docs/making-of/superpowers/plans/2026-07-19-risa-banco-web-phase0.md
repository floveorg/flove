# Banco de la risa — Phase 0 (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the fake `localStorage` feed on the Risa Liberada page into a real, playable **"Banco de la risa"** playlist fed by a `banco.json` file, and route "Comparte tu risa" to Telegram — all before the bot exists.

**Architecture:** Extract the pure data-shaping logic (`banco.json` → playlist tracks / feed items) into a tiny testable `banco.js` module, unit-tested with Node's built-in test runner. The single-file `index.html` gains a 6th playlist card that `fetch`es `banco.json` (same-origin seed in Phase 0), and its upload modal becomes a Telegram deep-link. No framework, no build step.

**Tech Stack:** Vanilla HTML/CSS/JS (single-file app, sibling `banco.js`), Node ≥18 `node --test` for the pure helpers only.

## Global Constraints

- **License copy is fixed:** `CC BY-SA 4.0`, deed URL `https://creativecommons.org/licenses/by-sa/4.0/deed.es`. Never invent other license text.
- **FOSS only.** No new runtime dependencies; tests use Node's built-in `node:test` (zero installs).
- **Self-contained doctrine, one deliberate exception:** the only new external-ish call is `fetch('banco.json')` from the page's **own origin**. No CDN, no third-party host.
- **Vanilla style:** match the existing IIFE `<script>` code style in `index.html` (ES5-ish `var`/`function` is fine in `banco.js`; the inline script uses `const`/arrow — match whichever file you're editing).
- **Mobile-first & accessible:** keep the page's existing responsive/a11y patterns (roles, `tabIndex`, `prefers-reduced-motion`).
- **Config in one place:** the bot URL and banco URL live only in `banco.js` (`Banco.TELEGRAM_BOT`, `Banco.BANCO_URL`).
- **Commit workflow (flove Gitea):** stage **only** the files each task touches (never `git add -A`; Marc edits in parallel). End every commit message body with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  Push is handled later (not per-task) unless Marc says otherwise.
- **Working directory for all paths below:** `~/Documents/flove`. The app lives at `apps/liberada/risa/`.

---

### Task 1: Pure `banco.js` module + unit tests

**Files:**
- Create: `apps/liberada/risa/banco.js`
- Test: `apps/liberada/risa/test/banco.test.mjs`

**Interfaces:**
- Produces (browser global `window.Banco` and CommonJS `module.exports`):
  - `buildBancoTracks(banco: Array) -> Array<{t, src, tags, by, orig, origLabel}>` — maps published clips to track objects the player already understands; drops entries without `src`.
  - `latestFeed(banco: Array, n=6) -> Array<{name, tags, when}>` — first `n` clips as feed items.
  - Constants: `BANCO_URL='banco.json'`, `TELEGRAM_BOT='https://t.me/RisaLiberadaBot'`, `LICENSE='CC BY-SA 4.0'`, `LICENSE_URL='https://creativecommons.org/licenses/by-sa/4.0/deed.es'`.
- A published clip in `banco.json` has shape `{ id, t?, name, tags?, src, when? }`. `by`/`orig` are **computed** from the constant license (the bot writes less; license is uniform).

- [ ] **Step 1: Write the failing tests**

Create `apps/liberada/risa/test/banco.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Banco from '../banco.js';

const SAMPLE = [
  { id: 'b_1', t: 'Risa de Marta', name: 'Marta', tags: 'contagiosa', src: 'audio/a.mp3', when: '2026-07-19' },
  { id: 'b_2', name: 'Yusuf', src: 'audio/b.mp3' },              // no t, no tags, no when
  { id: 'b_3', name: 'SinAudio', tags: 'x' },                   // no src -> dropped from tracks
];

test('buildBancoTracks maps fields and composes by/orig from the license', () => {
  const tracks = Banco.buildBancoTracks(SAMPLE);
  assert.equal(tracks.length, 2);                               // b_3 dropped (no src)
  assert.deepEqual(tracks[0], {
    t: 'Risa de Marta', src: 'audio/a.mp3', tags: 'contagiosa',
    by: 'Marta · CC BY-SA 4.0',
    orig: 'https://creativecommons.org/licenses/by-sa/4.0/deed.es',
    origLabel: 'licencia',
  });
});

test('buildBancoTracks derives a title and defaults tags when missing', () => {
  const tracks = Banco.buildBancoTracks(SAMPLE);
  assert.equal(tracks[1].t, 'Risa de Yusuf');
  assert.equal(tracks[1].tags, 'risa libre');
});

test('buildBancoTracks tolerates non-arrays', () => {
  assert.deepEqual(Banco.buildBancoTracks(null), []);
  assert.deepEqual(Banco.buildBancoTracks(undefined), []);
});

test('latestFeed returns first n as feed items with defaults', () => {
  const feed = Banco.latestFeed(SAMPLE, 2);
  assert.equal(feed.length, 2);
  assert.deepEqual(feed[0], { name: 'Marta', tags: 'contagiosa', when: '2026-07-19' });
  assert.deepEqual(feed[1], { name: 'Yusuf', tags: 'risa libre', when: 'ahora' });
});

test('latestFeed defaults n to 6 and tolerates non-arrays', () => {
  assert.equal(Banco.latestFeed(SAMPLE).length, 3);
  assert.deepEqual(Banco.latestFeed(null), []);
});

test('constants carry the fixed license and config', () => {
  assert.equal(Banco.LICENSE, 'CC BY-SA 4.0');
  assert.equal(Banco.BANCO_URL, 'banco.json');
  assert.equal(Banco.TELEGRAM_BOT, 'https://t.me/RisaLiberadaBot');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd ~/Documents/flove/apps/liberada/risa && node --test test/banco.test.mjs`
Expected: FAIL — `Cannot find module '../banco.js'` (file doesn't exist yet).

- [ ] **Step 3: Write the module**

Create `apps/liberada/risa/banco.js`:

```js
/* Banco de la risa — helpers puros (compartidos por la página y los tests).
   Se carga como <script src="banco.js"> (expone window.Banco) y como módulo Node. */
(function (global) {
  'use strict';

  var LICENSE = 'CC BY-SA 4.0';
  var LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/deed.es';

  // Clip publicado {id,t?,name,tags?,src,when?} -> pista del reproductor.
  function buildBancoTracks(banco) {
    if (!Array.isArray(banco)) return [];
    return banco
      .filter(function (c) { return c && c.src; })
      .map(function (c) {
        return {
          t: c.t || ('Risa de ' + (c.name || 'alguien')),
          src: c.src,
          tags: c.tags || 'risa libre',
          by: (c.name || 'Anónima') + ' · ' + LICENSE,
          orig: LICENSE_URL,
          origLabel: 'licencia'
        };
      });
  }

  // Clips publicados -> ítems del feed "Últimas risas".
  function latestFeed(banco, n) {
    if (!Array.isArray(banco)) return [];
    return banco.slice(0, n || 6).map(function (c) {
      return {
        name: (c && c.name) || 'Anónima',
        tags: (c && c.tags) || 'risa libre',
        when: (c && c.when) || 'ahora'
      };
    });
  }

  var api = {
    buildBancoTracks: buildBancoTracks,
    latestFeed: latestFeed,
    BANCO_URL: 'banco.json',
    TELEGRAM_BOT: 'https://t.me/RisaLiberadaBot',
    LICENSE: LICENSE,
    LICENSE_URL: LICENSE_URL
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.Banco = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd ~/Documents/flove/apps/liberada/risa && node --test test/banco.test.mjs`
Expected: PASS — 6 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/flove
git add apps/liberada/risa/banco.js apps/liberada/risa/test/banco.test.mjs
git commit -m "feat(risa): banco.js pure helpers + tests

buildBancoTracks / latestFeed map banco.json a pistas y feed;
licencia CC BY-SA 4.0 computada; config (bot/URL) en un solo sitio.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Seed `banco.json`

**Files:**
- Create: `apps/liberada/risa/banco.json`

**Interfaces:**
- Consumes: nothing.
- Produces: the seed data `fetch`ed by Task 3. Newest-first order. `src` is document-relative (`audio/…`) so it plays under Phase 0. These reuse existing playable audio as **placeholder** community clips — to be emptied/replaced when the bot goes live in Phase 1.

- [ ] **Step 1: Create the seed file**

Create `apps/liberada/risa/banco.json`:

```json
[
  { "id": "seed_3", "name": "Lucía", "t": "La risa de Lucía", "tags": "de bebé, tierna", "src": "audio/bebe-risa.mp3", "when": "hoy" },
  { "id": "seed_2", "name": "Yusuf", "t": "La risa de Yusuf", "tags": "carcajada, de vientre", "src": "audio/carcajada-solo.mp3", "when": "ayer" },
  { "id": "seed_1", "name": "Marta", "t": "La risa de Marta", "tags": "contagiosa, de grupo", "src": "audio/gente-riendo.mp3", "when": "hace 2 días" }
]
```

- [ ] **Step 2: Validate it is well-formed JSON**

Run: `cd ~/Documents/flove/apps/liberada/risa && node -e "console.log(require('./banco.json').length + ' clips OK')"`
Expected: `3 clips OK`

- [ ] **Step 3: Commit**

```bash
cd ~/Documents/flove
git add apps/liberada/risa/banco.json
git commit -m "feat(risa): banco.json semilla (placeholder, se vacía en fase 1)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Wire the "Banco de la risa" playlist + real feed into `index.html`

**Files:**
- Modify: `apps/liberada/risa/index.html`

**Interfaces:**
- Consumes: `window.Banco` (Task 1), `banco.json` (Task 2).
- Produces: a working 6th playlist card + a `banco`-backed feed. Introduces the in-scope names `bancoPl` and `renderFeedFrom(banco)` used nowhere else.

- [ ] **Step 1: Load `banco.js` before the inline script**

In `apps/liberada/risa/index.html`, find the inline script opener (around line 721):

```html
<script>
(function(){
  "use strict";
```

Replace with:

```html
<script src="banco.js"></script>
<script>
(function(){
  "use strict";
```

- [ ] **Step 2: Append the Banco playlist to the `playlists` array**

Find the closing bracket of the `playlists` array (immediately after the `mundo` playlist, around line 771):

```js
      ]},
  ];

  /* ============ RENDER DE PLAYLISTS ============ */
```

Replace with:

```js
      ]},
  ];

  // 6ª playlist: se llena con banco.json (fetch más abajo).
  const bancoPl = { id:'banco', emoji:'😹', name:'Banco de la risa', desc:'Las risas de la gente', tracks:[] };
  playlists.push(bancoPl);

  /* ============ RENDER DE PLAYLISTS ============ */
```

- [ ] **Step 3: Let track rows show a custom link label (for "licencia ↗")**

Find, inside `renderTracks` (around line 809-811):

```js
        (isDL
          ? '<a class="orig" href="'+t.orig+'" target="_blank" rel="noopener">original ↗</a>'
          : '<a class="orig" href="'+t.link+'" target="_blank" rel="noopener">escuchar original ↗</a>');
```

Replace with:

```js
        (isDL
          ? '<a class="orig" href="'+t.orig+'" target="_blank" rel="noopener">'+(t.origLabel||'original')+' ↗</a>'
          : '<a class="orig" href="'+t.link+'" target="_blank" rel="noopener">escuchar original ↗</a>');
```

- [ ] **Step 4: Give the Banco playlist a gentle empty message**

Find the `else` branch of `selectPlaylist` (around line 836):

```js
    else { const n=playableTracks(playlists[i]).length; nowTrack.textContent = n+(n===1?' pista lista':' pistas listas')+' · pulsa play'; highlightTrack(); }
```

Replace with:

```js
    else {
      const n=playableTracks(playlists[i]).length;
      if(playlists[i].id==='banco' && !n){ nowTrack.textContent='Aún no hay risas en el banco · sé la primera 💛'; }
      else { nowTrack.textContent = n+(n===1?' pista lista':' pistas listas')+' · pulsa play'; }
      highlightTrack();
    }
```

- [ ] **Step 5: Fetch `banco.json` after init and fill the playlist**

Find the init line (around line 868):

```js
  selectPlaylist(0); // init
```

Replace with:

```js
  selectPlaylist(0); // init

  // Carga el banco de la risa (mismo origen). Rellena la 6ª playlist y el feed.
  function refreshBancoCard(){
    const idx = playlists.indexOf(bancoPl);
    const card = plGrid.children[idx];
    if(card){ const c=card.querySelector('.count'); if(c) c.textContent=bancoPl.tracks.length+' pistas'; }
    if(playlists[cur]===bancoPl) selectPlaylist(idx);
  }
  fetch(window.Banco.BANCO_URL, {cache:'no-store'})
    .then(r=>r.ok?r.json():[])
    .then(data=>{
      const banco = Array.isArray(data)?data:[];
      bancoPl.tracks = window.Banco.buildBancoTracks(banco);
      refreshBancoCard();
      renderFeedFrom(banco);
    })
    .catch(()=>{ renderFeedFrom([]); });
```

Note: `renderFeedFrom` is defined in Step 6; it is only *called* here and both live in the same IIFE, so ordering is fine (function declaration is hoisted).

- [ ] **Step 6: Replace the fake `localStorage` feed with a `banco`-backed feed**

Find the whole feed block (from around line 988 to the `renderFeed();` at line 1031):

```js
  /* ============ FEED · ÚLTIMAS RISAS ============ */
  const feedEl = document.getElementById('latest-feed');
  const FEED_KEY = 'risa-liberada-feed';
  const seedFeed = [
    {name:'Marta',  tags:'contagiosa, de grupo', when:'hace 2 h'},
    {name:'Yusuf',  tags:'carcajada, de vientre', when:'hace 5 h'},
    {name:'Lucía',  tags:'de bebé, tierna', when:'ayer'},
    {name:'Nils',   tags:'yoga de la risa', when:'ayer'},
    {name:'Anónima',tags:'malvada, traviesa', when:'hace 2 días'},
  ];
  function savedFeed(){
    try{ return JSON.parse(localStorage.getItem(FEED_KEY)) || []; }catch(e){ return []; }
  }
  function renderFeed(){
    const items = savedFeed().concat(seedFeed);
    feedEl.innerHTML='';
    items.forEach((it,i)=>{
      const d=document.createElement('div');
      d.className='feed-item'+(it.mine?' mine':'');
      d.tabIndex=0; d.setAttribute('role','button');
      d.style.animationDelay=(i*0.04)+'s';
      d.innerHTML=
        '<span class="fi-play" aria-hidden="true">▶</span>'+
        '<span class="fi-main"><span class="fi-name">'+esc(it.name||'Anónima')+'</span>'+
        '<span class="fi-tags">'+esc(it.tags||'risa libre')+'</span></span>'+
        '<span class="fi-when">'+esc(it.when||'ahora')+'</span>';
      const goPlay=()=>document.getElementById('risas').scrollIntoView({behavior:reduce?'auto':'smooth'});
      d.addEventListener('click', goPlay);
      d.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); goPlay(); } });
      feedEl.appendChild(d);
    });
  }
  document.getElementById('upload-form').addEventListener('submit', e=>{
    e.preventDefault();
    const name=(document.getElementById('um-name').value||'').trim() || 'Anónima';
    const tags=(document.getElementById('um-tags').value||'').trim() || 'risa libre';
    const list=savedFeed();
    list.unshift({name:name, tags:tags, when:'ahora mismo', mine:true});
    try{ localStorage.setItem(FEED_KEY, JSON.stringify(list.slice(0,20))); }catch(err){}
    renderFeed();
    e.target.reset(); fileName.textContent='';
    closeModal(uploadModal);
  });
  renderFeed();
```

Replace the entire block above with:

```js
  /* ============ FEED · ÚLTIMAS RISAS ============ */
  const feedEl = document.getElementById('latest-feed');
  function renderFeedFrom(banco){
    const items = window.Banco.latestFeed(banco, 6);
    feedEl.innerHTML='';
    if(!items.length){
      const empty=document.createElement('p');
      empty.className='feed-empty';
      empty.textContent='Aún no hay risas en el banco. ¿Y si eres la primera? 💛';
      feedEl.appendChild(empty);
      return;
    }
    items.forEach((it,i)=>{
      const d=document.createElement('div');
      d.className='feed-item';
      d.tabIndex=0; d.setAttribute('role','button');
      d.style.animationDelay=(i*0.04)+'s';
      d.innerHTML=
        '<span class="fi-play" aria-hidden="true">▶</span>'+
        '<span class="fi-main"><span class="fi-name">'+esc(it.name)+'</span>'+
        '<span class="fi-tags">'+esc(it.tags)+'</span></span>'+
        '<span class="fi-when">'+esc(it.when)+'</span>';
      const goPlay=()=>{
        const idx=playlists.indexOf(bancoPl);
        if(idx>=0) selectPlaylist(idx);
        document.getElementById('risas').scrollIntoView({behavior:reduce?'auto':'smooth'});
      };
      d.addEventListener('click', goPlay);
      d.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); goPlay(); } });
      feedEl.appendChild(d);
    });
  }
  renderFeedFrom([]); // estado inicial hasta que llegue banco.json
```

- [ ] **Step 7: Verify in a browser (served over HTTP)**

`fetch` needs HTTP (not `file://`). Serve and open:

Run: `cd ~/Documents/flove/apps/liberada/risa && python3 -m http.server 8765`
Open `http://localhost:8765/` and confirm:
- A **6th playlist card "Banco de la risa 😹"** shows **"3 pistas"**.
- Selecting it and pressing play **plays** the seed clips; each track row shows **"licencia ↗"** linking to the CC BY-SA 4.0 deed.
- **"Últimas risas"** lists **Lucía / Yusuf / Marta**; clicking one selects the Banco playlist and scrolls to the player.
- The other 5 playlists still play as before.
Stop the server with Ctrl-C.

- [ ] **Step 8: Verify the empty/error state**

Run: `cd ~/Documents/flove/apps/liberada/risa && mv banco.json banco.json.bak && python3 -m http.server 8765`
Open `http://localhost:8765/` and confirm the feed shows **"Aún no hay risas en el banco…"** and the Banco card shows **"0 pistas"** (page still works). Then restore:
Run: `cd ~/Documents/flove/apps/liberada/risa && mv banco.json.bak banco.json`

- [ ] **Step 9: Commit**

```bash
cd ~/Documents/flove
git add apps/liberada/risa/index.html
git commit -m "feat(risa): playlist «Banco de la risa» real + feed desde banco.json

6ª playlist reproducible alimentada por banco.json (mismo origen);
feed «Últimas risas» real; estados vacío/error; enlace «licencia ↗».
Retira el feed localStorage (subida pasa a Telegram, Task 4).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Turn the upload modal into a Telegram deep-link + remove dead upload code

**Files:**
- Modify: `apps/liberada/risa/index.html`

**Interfaces:**
- Consumes: `window.Banco.TELEGRAM_BOT`, `window.Banco.LICENSE` (Task 1).
- Produces: no new names other tasks depend on. This task removes the old file-input wiring left dead by Task 3.

- [ ] **Step 1: Replace the modal `<form>` with a Telegram call-to-action**

Find the upload modal form (lines ~659-673):

```html
    <form id="upload-form">
      <label class="uploader">
        <input type="file" accept="audio/*,video/*" id="um-file">
        <span class="up-icon" aria-hidden="true">🎙️</span>
        <span class="up-text">Graba tu risa y súbela aquí</span>
        <span class="up-name" id="um-filename"></span>
      </label>
      <label class="field"><span>Etiquetas</span>
        <input type="text" id="um-tags" placeholder="contagiosa, corta, de bebé…" autocomplete="off">
      </label>
      <label class="field"><span>Tu nombre</span>
        <input type="text" id="um-name" placeholder="¿Quién ríe?" autocomplete="off">
      </label>
      <button class="btn btn-primary" type="submit">Añadir al banco 💛</button>
    </form>
```

Replace with:

```html
    <p class="modal-note">Envía tu risa como <b>nota de voz</b> a nuestro bot de Telegram. Un par de moderadores la revisan y, si entra, suena en el banco. Al enviarla la publicas en libre, bajo <b>CC BY-SA 4.0</b>, con el nombre que elijas. 💛</p>
    <a class="btn btn-primary" id="um-telegram" href="https://t.me/RisaLiberadaBot" target="_blank" rel="noopener">Abrir Telegram 💬</a>
```

- [ ] **Step 2: Remove the dead file-input wiring and point the button at the config URL**

Find the upload-modal wiring block (note: `esc`/`openModal`/`closeModal` sit just above it now and MUST be left untouched — do not include them in the match):

```js
  const uploadModal = document.getElementById('upload-modal');
  const fileInput = document.getElementById('um-file');
  const fileName = document.getElementById('um-filename');
  document.getElementById('open-upload').addEventListener('click', ()=>openModal(uploadModal));
  document.getElementById('um-close').addEventListener('click', ()=>closeModal(uploadModal));
  fileInput.addEventListener('change', ()=>{
    fileName.textContent = fileInput.files.length ? '✓ '+fileInput.files[0].name : '';
  });
```

Replace with:

```js
  const uploadModal = document.getElementById('upload-modal');
  const tgLink = document.getElementById('um-telegram');
  if(tgLink) tgLink.href = window.Banco.TELEGRAM_BOT;   // config en un solo sitio
  document.getElementById('open-upload').addEventListener('click', ()=>openModal(uploadModal));
  document.getElementById('um-close').addEventListener('click', ()=>closeModal(uploadModal));
```

- [ ] **Step 3: Remove the now-unused uploader CSS**

Remove the uploader CSS block. Find exactly:

```css
#upload-form{display:grid; gap:16px}
.uploader{position:relative; display:grid; place-items:center; gap:8px; text-align:center; cursor:pointer;
  border:3px dashed var(--persimmon); border-radius:22px; padding:26px 18px; background:var(--base);
  transition:background .15s, border-color .15s}
.uploader:hover{background:var(--base-2)}
.uploader input[type=file]{position:absolute; width:1px; height:1px; opacity:0; overflow:hidden}
.uploader .up-icon{font-size:2.2rem; line-height:1}
.uploader .up-text{font-family:var(--disp); font-weight:700; font-size:1.05rem; color:var(--ink)}
.uploader .up-name{font-family:var(--mono); font-size:.72rem; color:var(--mint); font-weight:700; min-height:1em}
```

Replace with:

```css
.modal-note{color:var(--ink-soft); line-height:1.5; margin:0 0 4px}
#upload-modal .btn-primary{justify-content:center; width:100%; text-decoration:none}
.feed-empty{color:var(--ink-soft); line-height:1.5; padding:8px 2px}
```

(The `.feed-empty` rule styles the empty-banco message added in Task 3, which currently has no CSS.)

Then, separately, delete the now-orphaned button rule. Find exactly:

```css
#upload-form .btn{justify-content:center; margin-top:2px}
```

and delete that line entirely. (Leave the `.field` rules as-is — they're generic and harmless; a later /simplify pass can remove them. `--ink-soft` already exists in `:root`.)

- [ ] **Step 4: Verify no dangling references remain**

Run: `cd ~/Documents/flove/apps/liberada/risa && grep -nE "upload-form|um-file|um-tags|um-name|um-filename|savedFeed|FEED_KEY|fileInput|fileName|renderFeed\b" index.html || echo "CLEAN"`
Expected: `CLEAN` (no matches — all old upload/feed identifiers are gone).

- [ ] **Step 5: Verify in a browser**

Run: `cd ~/Documents/flove/apps/liberada/risa && python3 -m http.server 8765`
Open `http://localhost:8765/`, click **"💬 Comparte tu risa"**, and confirm the modal now shows the license note + an **"Abrir Telegram 💬"** button whose link is `https://t.me/RisaLiberadaBot`. Close with ×, click-outside, and Escape — all still work. Ctrl-C to stop.

- [ ] **Step 6: Commit**

```bash
cd ~/Documents/flove
git add apps/liberada/risa/index.html
git commit -m "feat(risa): subir por Telegram (deep link) + retira form localStorage

El modal «Comparte tu risa» explica la licencia y abre el bot de Telegram;
se elimina el input de fichero, el form y su CSS muerto. Config del bot
en banco.js (un solo sitio).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (spec §7 — cambios en la página web):**
- §7.1 feed falso → real → Task 3 (Steps 5-6). ✓
- §7.2 6ª playlist «Banco de la risa» + estados vacío/error → Task 3 (Steps 2, 4, 8). ✓
- §7.3 botón → deep link Telegram → Task 4 (Steps 1-2). ✓
- §7.4 retirar form localStorage → Task 4 (Steps 1-3), Task 3 (Step 6). ✓
- §7.5 mobile-first/accesible → preserved (roles/tabIndex/reduced-motion untouched). ✓
- License CC BY-SA 4.0 uniform → Task 1 constants, used in Tasks 3-4. ✓
- Config in one place → `Banco.BANCO_URL` / `Banco.TELEGRAM_BOT` (Task 1), consumed in Tasks 3-4. ✓

**Deferred to Phase 1 (bot plan), intentionally NOT here:** the real `banco.json` origin swap (Phase 0 uses same-origin seed; Phase 1 points `Banco.BANCO_URL` at the `banco-risa` Pages origin), emptying the placeholder seed, QR code in the modal.

**Placeholder scan:** none — every step has concrete code/commands.

**Type consistency:** `buildBancoTracks`/`latestFeed`/`bancoPl`/`renderFeedFrom` names and shapes match across Tasks 1, 3, 4. Track objects carry `origLabel`, consumed by the Task 3 Step 3 `renderTracks` tweak. ✓

**Note on testing:** pure logic is TDD'd (Task 1); DOM wiring is verified by serving over HTTP and visual check (Tasks 3-4) — matches how flove apps are verified (Marc opens them in his own browser).
