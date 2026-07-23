/* ============================================================
   flove.js · CSS-friendly behaviors for blogy.html (sound engine + summary actions)
   ============================================================
   Demo of a future flove distro where the js shared by the apps
   is abstracted into common files and called externally. In the
   current distro every app inlines its own copy and stays
   self-contained; only the blogy tiers load this file.
   ============================================================
   • One click listener on <body> (capture phase).
   • Reads `data-sound="key"` from the clicked element (or ancestor),
     or falls back to a class→key map.
   • Plays only when #opt-sound is checked (the Sound switch).
   • Sounds in `window.blogySounds[key]` can be:
       - string  → URL or data-URI (HTMLAudio)
       - object  → { freq, dur, type, gain } (Web Audio synth tone)
       - null/undefined → silent
   • Public API for the addnewsound form (via window.parent):
       window.blogySoundsRegistry.keys()         list of stable keys
       window.blogySoundsRegistry.classMap       class→key mapping
       window.blogySoundsRegistry.set(key, src)  assign
       window.blogySoundsRegistry.get(key)       read
       window.blogySoundsRegistry.preview(key)   play once (ignores Sound toggle)
       window.blogySoundsRegistry.applyPack(map) bulk assign
   ============================================================ */
(() => {
  'use strict';

  /* class/selector → stable sound key (declarative, no HTML changes needed) */
  const CLASS_MAP = {
    '[for="new-ray-modal"]':      'modal:ray',
    '[for="new-bot-modal"]':      'modal:bot',
    '[for="new-language-modal"]': 'modal:language',
    '[for="new-sound-modal"]':    'modal:sound',
    '.newray-close, .newbot-close, .newlanguage-close, .newsound-close': 'modal:close',
    '.bot-arm--more':             'bot:add',
    '.bot-arm':                   'bot:select',
    '.ray-sub':                   'ray:sub-select',
    '.ray':                       'ray:select',
    '.ray-reset':                 'ray:reset',
    '.step-node, .path-node':     'step:nav',
    '.entry-tool--mic':           'entry:mic',
    '.entry-tool--heart':         'entry:love',
    '.entry-tool--reveal':        'entry:show-rater',
    '.entry-magic':               'entry:magic',
    '.entry-more':                'entry:add',
    '.add-new-btn':               'entry:add-new',
    '.ta-expand-btn':             'entry:expand',
    '.entry-tool':                'entry:tool',
    '.rate-step':                 'rate:cell',
    '.rater-emoji-trigger':       'rate:open',
    '.save-btn':                  'save:click',
    '.share-btn':                 'share:click',
    '.publish-btn':               'publish:click',
    '.insight-step':              'insights:cycle',
    '.views-btn, .view-pick':     'views:select',
    '.magic-btn-summary, [for="magic-toggle"]': 'magic:toggle',
    '.lang-others-more > label':  'lang:add',
    '.lang-others li > label':    'lang:select',
    '.lang-others li > a':        'lang:select',
    '.title-btn':                 'topbar:about',
    '.mark-link':                 'topbar:reload',
    '.app-toggle-btn':            'topbar:all',
    '.magic-btn':                 'topbar:magic',
    '.menu-btn':                  'topbar:menu',
    '.menu-list li a':            'menu:item',
    '.menu-switch-label':         'menu:toggle',
  };

  /* default registry (silent) — user/form fills it */
  const sounds = window.blogySounds = window.blogySounds || {};

  /* Web Audio context (lazy-init on first play) */
  let ctx = null;
  function getCtx(){
    if (!ctx){
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(_){ /* not supported */ }
    }
    return ctx;
  }

  const audioCache = {};

  /* play a single key. If force=true, plays even when Sound is OFF (for preview). */
  function play(key, force){
    const opt = document.getElementById('opt-sound');
    if (!force && (!opt || !opt.checked)) return;
    const s = sounds[key];
    if (!s) return;

    if (typeof s === 'string'){
      let a = audioCache[key];
      if (!a || a._src !== s){
        a = new Audio(s);
        a._src = s;
        audioCache[key] = a;
      }
      try { a.currentTime = 0; a.play().catch(() => {}); } catch(_){}
    }
    else if (typeof s === 'object' && (s.freq || s.f)){
      const c = getCtx();
      if (!c) return;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = s.type || 'sine';
      o.frequency.value = s.freq || s.f;
      g.gain.value = s.gain != null ? s.gain : 0.06;
      o.connect(g); g.connect(c.destination);
      const dur = (s.dur || 120) / 1000;
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      o.stop(c.currentTime + dur);
    }
  }

  /* delegated click listener — matches data-sound first, then class-map */
  function lookupKey(target){
    const explicit = target.closest('[data-sound]');
    if (explicit) return explicit.getAttribute('data-sound');
    for (const sel in CLASS_MAP){
      if (target.closest(sel)) return CLASS_MAP[sel];
    }
    return null;
  }

  document.addEventListener('click', (ev) => {
    const key = lookupKey(ev.target);
    if (!key) return;
    const force = !!ev.target.closest('[data-sound-force]');
    play(key, force);
  }, true);

  /* ─── built-in pack: "Soft" (gentle sine tones) — used as opt-in default ─── */
  const PACK_SOFT = {
    'ui:click':         { freq: 880,  dur: 50,  type: 'sine',     gain: 0.04 },
    'topbar:about':     { freq: 740,  dur: 120, type: 'sine',     gain: 0.05 },
    'topbar:all':       { freq: 660,  dur: 90,  type: 'sine',     gain: 0.05 },
    'topbar:magic':     { freq: 988,  dur: 180, type: 'triangle', gain: 0.06 },
    'topbar:menu':      { freq: 523,  dur: 80,  type: 'sine',     gain: 0.05 },
    'topbar:reload':    { freq: 392,  dur: 60,  type: 'sine',     gain: 0.05 },
    'ray:select':       { freq: 1175, dur: 110, type: 'triangle', gain: 0.05 },
    'ray:sub-select':   { freq: 1047, dur: 100, type: 'triangle', gain: 0.05 },
    'ray:reset':        { freq: 440,  dur: 80,  type: 'sine',     gain: 0.05 },
    'bot:select':       { freq: 698,  dur: 90,  type: 'triangle', gain: 0.05 },
    'bot:add':          { freq: 830,  dur: 140, type: 'sine',     gain: 0.06 },
    'step:nav':         { freq: 587,  dur: 60,  type: 'sine',     gain: 0.05 },
    'entry:mic':        { freq: 622,  dur: 100, type: 'square',   gain: 0.04 },
    'entry:love':       { freq: 932,  dur: 180, type: 'triangle', gain: 0.06 },
    'entry:show-rater': { freq: 784,  dur: 80,  type: 'sine',     gain: 0.05 },
    'entry:magic':      { freq: 1108, dur: 130, type: 'triangle', gain: 0.06 },
    'entry:add':        { freq: 659,  dur: 70,  type: 'sine',     gain: 0.05 },
    'entry:add-new':    { freq: 698,  dur: 90,  type: 'sine',     gain: 0.05 },
    'entry:expand':     { freq: 1319, dur: 80,  type: 'sine',     gain: 0.04 },
    'entry:tool':       { freq: 554,  dur: 50,  type: 'sine',     gain: 0.04 },
    'rate:cell':        { freq: 1568, dur: 60,  type: 'sine',     gain: 0.04 },
    'rate:open':        { freq: 1109, dur: 100, type: 'triangle', gain: 0.05 },
    'save:click':       { freq: 523,  dur: 200, type: 'triangle', gain: 0.06 },
    'share:click':      { freq: 587,  dur: 200, type: 'triangle', gain: 0.06 },
    'publish:click':    { freq: 698,  dur: 240, type: 'triangle', gain: 0.07 },
    'insights:cycle':   { freq: 1245, dur: 90,  type: 'sine',     gain: 0.05 },
    'views:select':     { freq: 1109, dur: 80,  type: 'sine',     gain: 0.04 },
    'magic:toggle':     { freq: 1397, dur: 140, type: 'triangle', gain: 0.06 },
    'lang:select':      { freq: 880,  dur: 120, type: 'sine',     gain: 0.05 },
    'lang:add':         { freq: 988,  dur: 140, type: 'sine',     gain: 0.06 },
    'modal:ray':        { freq: 698,  dur: 160, type: 'triangle', gain: 0.06 },
    'modal:bot':        { freq: 784,  dur: 160, type: 'triangle', gain: 0.06 },
    'modal:language':   { freq: 880,  dur: 160, type: 'triangle', gain: 0.06 },
    'modal:sound':      { freq: 988,  dur: 160, type: 'triangle', gain: 0.06 },
    'modal:close':      { freq: 330,  dur: 100, type: 'sine',     gain: 0.05 },
    'menu:item':        { freq: 740,  dur: 50,  type: 'sine',     gain: 0.04 },
    'menu:toggle':      { freq: 587,  dur: 60,  type: 'sine',     gain: 0.04 },
  };

  Object.assign(sounds, PACK_SOFT);

  /* ─── Apply a preset pack to all keys in an area (= keys whose prefix matches) ─── */
  function applyPackToArea(area, packId){
    const pack = (window.blogySoundsRegistry && window.blogySoundsRegistry.packs && window.blogySoundsRegistry.packs[packId]) || {};
    Object.keys(sounds).forEach(key => {
      const prefix = key.split(':')[0];
      if (prefix !== area) return;
      if (packId === 'off' || packId === ''){
        delete sounds[key];
        audioCache[key] = null;
        return;
      }
      const v = pack[key] || synthForArea(prefix, packId, key);
      sounds[key] = v;
      audioCache[key] = null;
    });
  }
  function synthForArea(prefix, packId, key){
    let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) % 1000;
    const base = 440 + h * 1.3;
    const presets = {
      soft:   { type: 'sine',     gain: 0.05 },
      chimes: { type: 'triangle', gain: 0.05 },
      retro:  { type: 'square',   gain: 0.04 },
      synth:  { type: 'sawtooth', gain: 0.04 },
      mystic: { type: 'sine',     gain: 0.06 },
    };
    const p = presets[packId] || presets.soft;
    return { freq: Math.round(base), dur: 80 + (h % 200), type: p.type, gain: p.gain };
  }

  /* ─── Listen for area-level dropdown changes + file uploads in blogy.html ─── */
  document.addEventListener('change', (ev) => {
    const sel = ev.target.closest('select[data-sound-area]');
    if (sel){
      applyPackToArea(sel.dataset.soundArea, sel.value);
      return;
    }
    const up = ev.target.closest('input[type="file"][data-sound-upload]');
    if (up && up.files && up.files[0]){
      const area = up.dataset.soundUpload;
      const reader = new FileReader();
      reader.onload = () => {
        Object.keys(sounds).forEach(key => {
          if (key.split(':')[0] !== area) return;
          sounds[key] = reader.result;
          audioCache[key] = null;
        });
        // visual hint: mark the row as having a custom upload
        const row = up.closest('.sounds-area-row');
        if (row) row.classList.add('has-upload');
      };
      reader.readAsDataURL(up.files[0]);
    }
  });

  /* public API for the addnewsound form */
  window.blogySoundsRegistry = {
    keys: () => [...new Set(Object.values(CLASS_MAP))],
    classMap: CLASS_MAP,
    set:  (key, src) => { sounds[key] = src; audioCache[key] = null; },
    get:  (key) => sounds[key],
    preview: (key) => play(key, true),
    applyPack: (pack) => {
      for (const k in pack) window.blogySoundsRegistry.set(k, pack[k]);
    },
    applyPackToArea,
    setArea: (area, src) => {
      Object.keys(sounds).forEach(key => {
        if (key.split(':')[0] !== area) return;
        sounds[key] = src;
        audioCache[key] = null;
      });
    },
    /* Bundled packs — the form's "preset" buttons can call applyPack(packs.X) */
    packs: {
      off: {},
      soft: PACK_SOFT,
    },
  };
})();

/* ============================================================
   SUMMARY ACTIONS — generic, opt-in via data-attributes
   ============================================================
   Any host file can wire these by adding attributes to its buttons.
   No HTML edits to blogy.html / worthing.html are needed here — they
   opt in only when their authors add the attributes.

   ┌─ SAVE ─ data-flove-save="txt|csv|xml|json|html|jpg|zip"
   ├─ SHARE ─ data-flove-share        (uses Web Share API; falls back to in-page menu)
   └─ VIEW  ─ data-flove-view="<name>"
              optional: data-flove-view-target="<css selector>"
                       data-flove-view-group="<group>"  (default "default")

   Data source — the JS collects from the nearest [data-flove-root]
   ancestor of the clicked button (or document.body if none):
     • data-flove-title="<text>"   overrides title for outputs
     • data-flove-phrase           marks the headline phrase element
     • [contenteditable], inputs, textareas, selects, checked radios/
       checkboxes are all picked up as fields automatically.

   Public:
     window.flove.collect(rootEl?)     → snapshot object
     window.flove.save(format, rootEl?)→ trigger a download
     window.flove.share(rootEl?)       → trigger share
   ============================================================ */
(() => {
  'use strict';

  const enc = new TextEncoder();
  const toBytes = s => s instanceof Uint8Array ? s : enc.encode(String(s));

  /* ── data collection ─────────────────────────────────────── */
  function rootOf(el){
    return (el && el.closest('[data-flove-root]'))
        || document.querySelector('[data-flove-root]')
        || document.body;
  }
  function labelFor(el, root){
    if (el.id){
      const lbl = root.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl) return lbl.textContent.trim();
    }
    const wrap = el.closest('label');
    if (wrap){
      const t = wrap.textContent.replace(el.value || '', '').trim();
      if (t) return t;
    }
    // For variant textareas with no id/name (blogy.html pattern) the
    // placeholder ("What's in your love") is the most meaningful label.
    return el.getAttribute('aria-label') || el.name || el.id
        || (el.getAttribute && el.getAttribute('placeholder')) || '';
  }
  function collect(rootEl){
    const root = rootEl || rootOf();
    const title = root.dataset.floveTitle || document.title || 'flove';
    const phraseEl = root.querySelector('[data-flove-phrase]')
                  || root.querySelector('.clause-default, output.clause, .phrase, output')
                  || null;
    const phrase = phraseEl ? phraseEl.textContent.trim().replace(/\s+/g, ' ') : '';

    const fields = [];
    const seen = new Set();
    const push = (label, value) => {
      if (!value && value !== 0) return;
      const k = label + ' ' + value;
      if (seen.has(k)) return;
      seen.add(k);
      fields.push({ label: label || '—', value: String(value) });
    };

    // Bot variant groups: a .entry-textareas div stacks N variants of the
    // same logical field (default / magic / lovely / joy / wisdom / ...).
    // Pick ONE per group — the visible one, or fall back to the variant
    // marked --default — so we don't list every prefilled bot phrase, and
    // so fields living in step-panels that aren't currently shown still
    // appear in the resume.
    const handled = new Set();
    root.querySelectorAll('.entry-textareas').forEach(group => {
      const variants = [...group.querySelectorAll('.entry-textarea')];
      variants.forEach(v => handled.add(v));
      let active = variants.find(v => v.offsetParent !== null);
      if (!active) active = variants.find(v => v.classList.contains('entry-textarea--default'));
      if (!active) active = variants[0];
      if (active && active.value && active.value.trim()){
        push(labelFor(active, root), active.value.trim());
      }
    });

    root.querySelectorAll('input, textarea, select').forEach(el => {
      if (handled.has(el)) return;
      if (el.type === 'hidden' || el.type === 'file' || el.type === 'submit' || el.type === 'button') return;
      if (el.type === 'radio' || el.type === 'checkbox'){
        // Radios/checkboxes drive UI state and are usually visually-hidden
        // .ctl inputs — always read the checked one.
        if (!el.checked) return;
        push(labelFor(el, root) || el.name, el.value || 'on');
      } else if (el.tagName === 'SELECT'){
        const opt = el.options[el.selectedIndex];
        push(labelFor(el, root), opt ? (opt.textContent.trim() || opt.value) : el.value);
      } else if (el.value && el.value.trim()){
        push(labelFor(el, root), el.value.trim());
      }
    });
    root.querySelectorAll('[contenteditable="true"]').forEach(el => {
      if (el === phraseEl) return;
      const txt = el.textContent.trim();
      if (txt) push(el.getAttribute('aria-label') || 'note', txt);
    });

    return {
      title,
      phrase,
      fields,
      when: new Date().toISOString(),
      source: location.href,
    };
  }

  /* ── escape helpers ──────────────────────────────────────── */
  const escHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const escXml  = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const escCsv  = s => /[",\n\r]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : String(s);

  /* ── serializers ─────────────────────────────────────────── */
  function toTxt(d){
    const bar = '─'.repeat(Math.max(4, Math.min(48, d.title.length)));
    const head = `${d.title}\n${bar}\n`;
    const body = d.phrase ? `\n${d.phrase}\n` : '';
    const list = d.fields.length ? '\n' + d.fields.map(f => `• ${f.label}: ${f.value}`).join('\n') + '\n' : '';
    return head + body + list + `\n— flove · ${d.when}\n`;
  }
  function toCsv(d){
    const rows = [['field','value'], ['title', d.title], ['phrase', d.phrase], ...d.fields.map(f => [f.label, f.value]), ['when', d.when]];
    return rows.map(r => r.map(escCsv).join(',')).join('\r\n');
  }
  function toXml(d){
    const fieldsXml = d.fields.map(f => `    <field label="${escXml(f.label)}">${escXml(f.value)}</field>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<summary>\n  <title>${escXml(d.title)}</title>\n  <phrase>${escXml(d.phrase)}</phrase>\n  <fields>\n${fieldsXml}\n  </fields>\n  <when>${escXml(d.when)}</when>\n</summary>\n`;
  }
  function toJson(d){
    return JSON.stringify(d, null, 2);
  }
  /* card CSS (scoped to .flove-page so it works both inline & inside <foreignObject>) */
  function cardCss(){
    return `
  .flove-page, .flove-page *{box-sizing:border-box}
  .flove-page{
    margin:0;
    font: 16px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    color:#1d1b22;
    background:
      radial-gradient(1200px 600px at 80% -10%, rgba(155,95,255,.12), transparent 60%),
      radial-gradient(900px 500px at -10% 110%, rgba(255,180,80,.14), transparent 60%),
      linear-gradient(180deg,#fbf6ff,#fff7ed);
    display:flex; align-items:flex-start; justify-content:center;
    padding: clamp(16px, 4vw, 48px);
  }
  .flove-page .card{
    width:100%; max-width:680px;
    background:#fefcf9;
    border-radius:24px;
    padding: clamp(28px, 5vw, 48px);
    position:relative;
    box-shadow:
      0 36px 80px -36px rgba(75,50,140,.28),
      0 12px 28px -14px rgba(0,0,0,.10);
  }
  .flove-page .card::before{
    content:""; position:absolute; inset:0; border-radius:inherit; padding:1px;
    background:linear-gradient(135deg, rgba(155,95,255,.45), rgba(255,180,80,.35));
    -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none;
  }
  .flove-page .stamp{
    font-size:11px; letter-spacing:.14em; text-transform:uppercase;
    color:#7a7585; margin:0 0 14px;
  }
  .flove-page h1{
    font-size: clamp(22px, 3.6vw, 30px);
    letter-spacing:-0.01em; line-height:1.2; margin:0 0 28px;
    background:linear-gradient(135deg,#9b5fff,#ffb44e);
    -webkit-background-clip:text; background-clip:text; color:transparent;
  }
  .flove-page .phrase{
    font-size: clamp(17px, 2.2vw, 20px); line-height:1.55;
    margin:0 0 32px; padding:22px 24px;
    background:linear-gradient(135deg, rgba(155,95,255,.07), rgba(255,180,80,.06));
    border-left:3px solid #9b5fff;
    border-radius:10px;
    white-space:pre-wrap;
  }
  .flove-page dl.fields{margin:0; display:grid; gap:6px}
  .flove-page .row{display:grid; grid-template-columns: minmax(120px, 26%) 1fr; gap:14px;
       padding:10px 0; border-top:1px solid rgba(0,0,0,.05)}
  .flove-page .row:first-child{border-top:0}
  .flove-page dt{margin:0; color:#7a7585; font-size:13px; letter-spacing:.02em}
  .flove-page dd{margin:0; color:#1d1b22; font-size:15px; word-break:break-word}
  .flove-page footer{
    margin-top:36px; padding-top:18px; border-top:1px solid rgba(0,0,0,.06);
    display:flex; justify-content:space-between; gap:16px;
    font-size:11px; color:#7a7585; letter-spacing:.06em; text-transform:uppercase;
  }
  @media print{
    .flove-page{background:#fff; padding:0}
    .flove-page .card{box-shadow:none}
    .flove-page .card::before{display:none}
  }`;
  }
  function cardBody(d){
    const dateNice = new Date(d.when).toLocaleString();
    const fieldsHtml = d.fields.map(f =>
      `      <div class="row"><dt>${escHtml(f.label)}</dt><dd>${escHtml(f.value)}</dd></div>`
    ).join('\n');
    return `<article class="card">
    <p class="stamp">flove · summary</p>
    <h1>${escHtml(d.title)}</h1>
    ${d.phrase ? `<p class="phrase">${escHtml(d.phrase)}</p>` : ''}
    <dl class="fields">
${fieldsHtml}
    </dl>
    <footer><span>flove</span><span>${escHtml(dateNice)}</span></footer>
  </article>`;
  }
  function toHtml(d){
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(d.title)}</title>
<style>html,body{margin:0}body{min-height:100vh}${cardCss()}</style>
</head>
<body class="flove-page">
${cardBody(d)}
</body>
</html>
`;
  }

  /* ── JPG via SVG <foreignObject> (no external library) ─────── */
  async function toJpgBlob(d){
    const W = 820;
    const inner = `<style>${cardCss()}</style><div class="flove-page">${cardBody(d)}</div>`;
    const probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = `position:fixed; left:-99999px; top:0; width:${W}px; pointer-events:none;`;
    probe.innerHTML = inner;
    document.body.appendChild(probe);
    await new Promise(r => requestAnimationFrame(r));
    const page = probe.querySelector('.flove-page');
    const H = Math.ceil((page ? page.getBoundingClientRect().height : probe.scrollHeight)) || 600;
    probe.remove();

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
        `<foreignObject x="0" y="0" width="${W}" height="${H}">` +
          `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px">${inner}</div>` +
        `</foreignObject>` +
      `</svg>`;
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload  = () => res(i);
      i.onerror = () => rej(new Error('SVG render failed'));
      i.src = url;
    });
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width  = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fbf6ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    return await new Promise((res, rej) => {
      canvas.toBlob(b => b ? res(b) : rej(new Error('Canvas export failed (possibly tainted)')), 'image/jpeg', 0.92);
    });
  }

  /* ── download helper ─────────────────────────────────────── */
  function triggerDownload(filename, mime, data){
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function safeName(s){
    return (String(s || 'flove').trim().replace(/\s+/g, '_').replace(/[^\w.\-]+/g, '')) || 'flove';
  }

  /* ── tiny store-only ZIP (no deps) ───────────────────────── */
  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++){
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();
  function crc32(buf){
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(entries){
    const locals = [];
    const central = [];
    let offset = 0;
    for (const e of entries){
      const name = toBytes(e.name);
      const data = toBytes(e.data);
      const crc = crc32(data);
      const lh = new Uint8Array(30 + name.length);
      const ldv = new DataView(lh.buffer);
      ldv.setUint32(0, 0x04034b50, true);
      ldv.setUint16(4, 20, true);     // version
      ldv.setUint16(6, 0x0800, true); // UTF-8 flag
      ldv.setUint16(8, 0, true);      // method = store
      ldv.setUint16(10, 0, true);     // mod time
      ldv.setUint16(12, 0x21, true);  // mod date
      ldv.setUint32(14, crc, true);
      ldv.setUint32(18, data.length, true);
      ldv.setUint32(22, data.length, true);
      ldv.setUint16(26, name.length, true);
      ldv.setUint16(28, 0, true);
      lh.set(name, 30);
      locals.push(lh, data);

      const ch = new Uint8Array(46 + name.length);
      const cdv = new DataView(ch.buffer);
      cdv.setUint32(0, 0x02014b50, true);
      cdv.setUint16(4, 20, true);    // version made by
      cdv.setUint16(6, 20, true);    // version needed
      cdv.setUint16(8, 0x0800, true);
      cdv.setUint16(10, 0, true);
      cdv.setUint16(12, 0, true);
      cdv.setUint16(14, 0x21, true);
      cdv.setUint32(16, crc, true);
      cdv.setUint32(20, data.length, true);
      cdv.setUint32(24, data.length, true);
      cdv.setUint16(28, name.length, true);
      cdv.setUint16(30, 0, true);
      cdv.setUint16(32, 0, true);
      cdv.setUint16(34, 0, true);
      cdv.setUint16(36, 0, true);
      cdv.setUint32(38, 0, true);
      cdv.setUint32(42, offset, true);
      ch.set(name, 46);
      central.push(ch);

      offset += lh.length + data.length;
    }
    const cdSize = central.reduce((s, c) => s + c.length, 0);
    const eocd = new Uint8Array(22);
    const edv = new DataView(eocd.buffer);
    edv.setUint32(0, 0x06054b50, true);
    edv.setUint16(4, 0, true);
    edv.setUint16(6, 0, true);
    edv.setUint16(8, entries.length, true);
    edv.setUint16(10, entries.length, true);
    edv.setUint32(12, cdSize, true);
    edv.setUint32(16, offset, true);
    edv.setUint16(20, 0, true);
    return new Blob([...locals, ...central, eocd], { type: 'application/zip' });
  }

  async function fetchBytes(url){
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) return null;
      return new Uint8Array(await r.arrayBuffer());
    } catch(_){ return null; }
  }

  /* ── save dispatch ───────────────────────────────────────── */
  async function save(format, rootEl){
    const d = collect(rootEl);
    const base = safeName(d.title);
    switch (format){
      case 'txt':  return triggerDownload(`${base}.txt`,  'text/plain;charset=utf-8',       toTxt(d));
      case 'csv':  return triggerDownload(`${base}.csv`,  'text/csv;charset=utf-8',         toCsv(d));
      case 'xml':  return triggerDownload(`${base}.xml`,  'application/xml;charset=utf-8',  toXml(d));
      case 'json': return triggerDownload(`${base}.json`, 'application/json;charset=utf-8', toJson(d));
      case 'html': return triggerDownload(`${base}.html`, 'text/html;charset=utf-8',        toHtml(d));
      case 'jpg':
      case 'jpeg': {
        const blob = await toJpgBlob(d);
        return triggerDownload(`${base}.jpg`, 'image/jpeg', blob);
      }
      case 'zip': {
        const files = [
          { name: `${base}.txt`,  data: toTxt(d)  },
          { name: `${base}.csv`,  data: toCsv(d)  },
          { name: `${base}.xml`,  data: toXml(d)  },
          { name: `${base}.json`, data: toJson(d) },
          { name: `${base}.html`, data: toHtml(d) },
        ];
        const jpgBlob = await toJpgBlob(d).catch(() => null);
        if (jpgBlob) files.push({ name: `${base}.jpg`, data: new Uint8Array(await jpgBlob.arrayBuffer()) });
        const pageName = (location.pathname.split('/').pop() || 'index.html') || 'index.html';
        const pageBytes = await fetchBytes(pageName);
        if (pageBytes) files.push({ name: pageName, data: pageBytes });
        const cssBytes = await fetchBytes('flove.css');
        if (cssBytes) files.push({ name: 'flove.css', data: cssBytes });
        const jsBytes = await fetchBytes('flove.js');
        if (jsBytes) files.push({ name: 'flove.js', data: jsBytes });
        const blob = makeZip(files);
        return triggerDownload(`${base}.zip`, 'application/zip', blob);
      }
      default:
        console.warn('[flove] unknown save format:', format);
    }
  }

  /* ── share ───────────────────────────────────────────────── */
  async function share(rootEl, opts){
    const d = collect(rootEl);
    const shareText = d.phrase || d.title;
    let jpgBlob = null;
    try { jpgBlob = await toJpgBlob(d); } catch(_){ /* tainted / unsupported — fall back below */ }

    if (!(opts && opts.forceMenu)){
      if (jpgBlob && navigator.canShare){
        const file = new File([jpgBlob], `${safeName(d.title)}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare({ files: [file] })){
          try { await navigator.share({ title: d.title, text: shareText, files: [file] }); return; }
          catch(_){ /* user canceled or unsupported — fall through to menu */ }
        }
      }
      if (navigator.share){
        try { await navigator.share({ title: d.title, text: shareText, url: location.href }); return; }
        catch(_){}
      }
    }
    openShareMenu(d, jpgBlob, opts || {});
  }

  /* Always opens the in-page share card overlay, skipping navigator.share.
     Useful for a dedicated "Mobile" button. */
  async function shareMenu(rootEl, opts){
    return share(rootEl, Object.assign({ forceMenu: true }, opts || {}));
  }

  function openShareMenu(d, jpgBlob, opts){
    opts = opts || {};
    document.getElementById('flove-share-menu')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'flove-share-menu';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Share to');
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:99999;
      background:rgba(20,15,30,.45); backdrop-filter: blur(4px);
      display:grid; place-items:end center;
      font: 15px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    `;
    const text = encodeURIComponent(d.phrase || d.title);
    const url  = encodeURIComponent(location.href);
    const subj = encodeURIComponent(d.title);
    // Hookable platform registry: host pages can replace or extend
    // window.flove.shareApps before clicking. Each entry can carry a
    //   `href`  string template, OR
    //   `build({text,url,subj,data})` returning a string href.
    const registry = (window.flove && window.flove.shareApps) || defaultShareApps();
    const apps = registry
      .filter(a => opts.mobile ? a.mobile !== false : true)
      .map(a => Object.assign({}, a, {
        href: typeof a.build === 'function'
          ? a.build({ text, url, subj, data: d })
          : a.href,
      }));
    overlay.innerHTML = `
      <div style="
        width:min(560px, 100%); margin:0 auto;
        background:#fff; color:#1d1b22;
        border-radius:20px 20px 0 0;
        padding:18px 18px 24px;
        box-shadow: 0 -20px 60px -20px rgba(0,0,0,.4);
        max-height:80vh; overflow:auto;">
        <div style="width:42px; height:4px; border-radius:99px; background:#ddd; margin:0 auto 14px"></div>
        <h3 style="margin:0 0 4px; font-size:17px">${opts.mobile ? '📱 Share on mobile' : 'Share'}</h3>
        <p style="margin:0 0 18px; font-size:13px; color:#7a7585">${opts.mobile ? 'Pick an app to forward the card.' : 'Pick an app to forward the jpg.'}</p>
        <div data-grid style="
          display:grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
          gap:10px; margin-bottom:18px"></div>
        <div style="display:flex; gap:10px">
          <button data-act="copy" style="${btnStyle()}">📋 Copy text</button>
          <button data-act="download" style="${btnStyle()}">⬇ jpg</button>
          <button data-act="close" style="${btnStyle('ghost')}">Close</button>
        </div>
      </div>`;
    const grid = overlay.querySelector('[data-grid]');
    apps.forEach(a => {
      const el = document.createElement('a');
      el.href = a.href;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      el.style.cssText = `
        display:flex; flex-direction:column; align-items:center; gap:6px;
        padding:12px 8px; border-radius:14px;
        background:#f6f3fc; color:#1d1b22; text-decoration:none;
        font-size:12px; text-align:center;
        transition: transform .15s ease, background .15s ease;`;
      el.onmouseenter = () => { el.style.background = '#ece5f8'; };
      el.onmouseleave = () => { el.style.background = '#f6f3fc'; };
      el.innerHTML = `<span style="font-size:22px">${a.emoji}</span><span>${a.name}</span>`;
      // On tap: download the full page being browsed, then let the
      // intent open (so the user can attach the file in the chosen app).
      el.addEventListener('click', () => { downloadCurrentPage(); });
      grid.appendChild(el);
    });
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay){ overlay.remove(); return; }
      const act = ev.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      if (act === 'close'){ overlay.remove(); }
      else if (act === 'copy'){
        const txt = `${d.title}\n\n${d.phrase}\n\n${location.href}`;
        navigator.clipboard?.writeText(txt);
        const b = ev.target.closest('[data-act]'); const old = b.textContent;
        b.textContent = '✓ Copied'; setTimeout(() => b.textContent = old, 1400);
      }
      else if (act === 'download'){
        (async () => {
          try {
            const blob = jpgBlob || await toJpgBlob(d);
            triggerDownload(`${safeName(d.title)}.jpg`, 'image/jpeg', blob);
          } catch(e){ console.warn('[flove] jpg failed:', e); }
        })();
      }
    });
    document.addEventListener('keydown', function esc(e){
      if (e.key === 'Escape'){ overlay.remove(); document.removeEventListener('keydown', esc); }
    });
    document.body.appendChild(overlay);
  }
  /* Fetch the page that's being browsed and trigger a download. Used by the
     mobile share sheet so the user has the full file ready to attach in
     whichever app they pick. Quietly no-ops on fetch failure. */
  let _pageDlT = 0;
  async function downloadCurrentPage(){
    // Debounce — multiple taps in a row only emit one download.
    const now = Date.now();
    if (now - _pageDlT < 1200) return;
    _pageDlT = now;
    try {
      const r = await fetch(location.href, { cache: 'no-store' });
      if (!r.ok) return;
      const blob = await r.blob();
      const path = (location.pathname.split('/').pop() || 'index.html') || 'index.html';
      const name = /\./.test(path) ? path : (path + '.html');
      triggerDownload(name, blob.type || 'text/html', blob);
    } catch(_){ /* offline / cross-origin / file:// — silent */ }
  }

  /* Default share-platforms registry. Hosts can mutate window.flove.shareApps
     to add/remove platforms — entries with `build(ctx)` get the encoded
     phrase/url/subject/data ready to slot into custom intents. */
  function defaultShareApps(){
    return [
      { name: 'WhatsApp',  emoji: '🟢', mobile: true,  build: ({text,url}) => `https://wa.me/?text=${text}%20${url}` },
      { name: 'Telegram',  emoji: '✈️', mobile: true,  build: ({text,url}) => `https://t.me/share/url?url=${url}&text=${text}` },
      { name: 'Signal',    emoji: '🔒', mobile: true,  build: ({text})     => `https://signal.me/#p/${text}` },
      { name: 'Messenger', emoji: '💬', mobile: true,  build: ({url})      => `https://www.facebook.com/dialog/send?link=${url}&app_id=0&redirect_uri=${url}` },
      { name: 'X / Twitter', emoji: '𝕏', mobile: true, build: ({text,url}) => `https://twitter.com/intent/tweet?text=${text}&url=${url}` },
      { name: 'Threads',   emoji: '@',  mobile: true,  build: ({text,url}) => `https://www.threads.net/intent/post?text=${text}%20${url}` },
      { name: 'Bluesky',   emoji: '🦋', mobile: true,  build: ({text,url}) => `https://bsky.app/intent/compose?text=${text}%20${url}` },
      { name: 'Mastodon',  emoji: '🐘', mobile: false, build: ({text,url}) => `https://mastodonshare.com/?text=${text}&url=${url}` },
      { name: 'Reddit',    emoji: '👽', mobile: false, build: ({subj,url}) => `https://www.reddit.com/submit?title=${subj}&url=${url}` },
      { name: 'LinkedIn',  emoji: '💼', mobile: false, build: ({url})      => `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
      { name: 'Email',     emoji: '📧', mobile: true,  build: ({subj,text,url}) => `mailto:?subject=${subj}&body=${text}%0A%0A${url}` },
      { name: 'SMS',       emoji: '💬', mobile: true,  build: ({text,url}) => `sms:?&body=${text}%20${url}` },
    ];
  }
  // Publish/seed the registry early so hosts can mutate it (push/replace) before any share click.
  window.flove = window.flove || {};
  if (!window.flove.shareApps) window.flove.shareApps = defaultShareApps();

  function btnStyle(kind){
    const ghost = kind === 'ghost';
    return `
      flex:1; padding:10px 12px; border-radius:12px; cursor:pointer;
      border:1px solid ${ghost ? 'rgba(0,0,0,.12)' : 'transparent'};
      background:${ghost ? 'transparent' : 'linear-gradient(135deg,#9b5fff,#ffb44e)'};
      color:${ghost ? '#1d1b22' : '#fff'};
      font: 13px/1 ui-sans-serif, system-ui, sans-serif;
      letter-spacing:.02em;`;
  }

  /* ── view toggle ─────────────────────────────────────────── */
  function setView(btn){
    const view  = btn.dataset.floveView;
    const group = btn.dataset.floveViewGroup || 'default';
    const sel   = btn.dataset.floveViewTarget;
    const target = (sel && document.querySelector(sel))
                || btn.closest('[data-flove-root]')
                || document.body;
    const prefix = `flove-view--${group}--`;
    [...target.classList].forEach(c => { if (c.startsWith(prefix)) target.classList.remove(c); });
    target.classList.add(prefix + view);
    target.dispatchEvent(new CustomEvent('flove:view', {
      detail: { view, group, target, button: btn },
      bubbles: true,
    }));
  }

  /* ── click delegation ────────────────────────────────────── */
  document.addEventListener('click', (ev) => {
    const saveEl = ev.target.closest('[data-flove-save]');
    if (saveEl){
      ev.preventDefault();
      save(saveEl.dataset.floveSave, saveEl.closest('[data-flove-root]'));
      return;
    }
    const shareEl = ev.target.closest('[data-flove-share]');
    if (shareEl){
      ev.preventDefault();
      share(shareEl.closest('[data-flove-root]'));
      return;
    }
    const shareMenuEl = ev.target.closest('[data-flove-share-menu]');
    if (shareMenuEl){
      ev.preventDefault();
      const mode = (shareMenuEl.dataset.floveShareMenu || '').toLowerCase();
      shareMenu(shareMenuEl.closest('[data-flove-root]'), { mobile: mode === 'mobile' });
      return;
    }
    const viewEl = ev.target.closest('[data-flove-view]');
    if (viewEl){
      setView(viewEl);
      return;
    }
  });

  /* ── public API ──────────────────────────────────────────── */
  window.flove = Object.assign(window.flove || {}, {
    collect, save, share, shareMenu,
    formats: { toTxt, toCsv, toXml, toJson, toHtml, toJpgBlob },
    makeZip, crc32,
    defaultShareApps,
  });
})();

/* ============================================================
   SOUND DEPTH — Mini · Basic · Normal · Advanced · Super
   ============================================================
   Driven by a single radio group `name="sound-level"` with the ids
   sound-mini / sound-basic / sound-normal / sound-advanced / sound-super.
   When #opt-sound is OFF nothing happens.

   The five levels are cumulative — every higher level keeps everything
   the lower ones add:

   • Mini      preloaded click sounds (handled by the sound engine above).
   • Basic     "lets you customize them" — the Sound switch already
               links to the Sounds section (step-5). No JS needed beyond
               making sure the engine is on; on Basic flove.speak()
               announces this once when the level is picked.
   • Normal    reads section titles aloud whenever the visible section
               changes. Generic opt-in: any element with
               data-flove-speak="title" will be spoken when it becomes
               visible. Blogy's <section class="step-panel"> h2s are
               picked up automatically by listening to its step radios.
   • Advanced  reads the contents of fields (input / textarea /
               contenteditable) when they lose focus. Opt-out a field
               with data-flove-speak="off".
   • Super     reads the texts a bot inserted (the magic / lovely /
               joy / wisdom textareas) whenever the active bot changes.
               Generic opt-in: data-flove-speak="bot" on any element.

   Public API:
     window.flove.speak(text)        speak (gated by Sound switch)
     window.flove.getSoundLevel()    'mini' | 'basic' | 'normal' | …
     window.flove.setSoundLevel(n)   programmatic level pick
     window.flove.soundLevelAtLeast('normal')

   This module makes no assumptions specific to blogy beyond looking
   for the standard ids — any other app can drop the same radio group
   in and opt in to titles/fields/bot texts via the data-attributes.
   ============================================================ */
(() => {
  'use strict';

  const LEVELS = ['mini', 'basic', 'normal', 'advanced', 'super'];

  function getSoundLevel(){
    const r = document.querySelector('input[name="sound-level"]:checked');
    return r ? r.id.replace(/^sound-/, '') : 'mini';
  }
  function setSoundLevel(name){
    const r = document.getElementById('sound-' + name);
    if (r){ r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  function soundLevelAtLeast(name){
    return LEVELS.indexOf(getSoundLevel()) >= LEVELS.indexOf(name);
  }
  function soundOn(){
    const el = document.getElementById('opt-sound');
    return !!(el && el.checked);
  }

  /* ── speech ───────────────────────────────────────────────── */
  function speak(text, opts = {}){
    if (!('speechSynthesis' in window)) return;
    const t = String(text == null ? '' : text).trim();
    if (!t) return;
    if (!opts.force && !soundOn()) return;
    const u = new SpeechSynthesisUtterance(t);
    u.rate  = opts.rate  != null ? opts.rate  : 1;
    u.pitch = opts.pitch != null ? opts.pitch : 1;
    u.volume = opts.volume != null ? opts.volume : 1;
    u.lang = opts.lang || document.documentElement.lang || 'en';
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch(_){}
  }

  /* ── NORMAL: speak section titles when their section becomes visible ── */
  // 1) Generic: IntersectionObserver on [data-flove-speak="title"].
  const seenTitles = new WeakSet();
  const titleObs = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        if (!soundOn() || !soundLevelAtLeast('normal')) return;
        for (const e of entries){
          if (!e.isIntersecting) continue;
          if (seenTitles.has(e.target)) continue;
          seenTitles.add(e.target);
          speak(e.target.textContent);
        }
      }, { threshold: 0.5 })
    : null;
  function bindTitles(){
    if (!titleObs) return;
    document.querySelectorAll('[data-flove-speak="title"]').forEach(el => {
      titleObs.observe(el);
    });
  }
  // 2) Blogy-specific: react to step radio changes — speak the h2 of the
  //    newly-visible .step-panel. The mapping is by nth-of-type: step-0 →
  //    1st panel, step-1 → 2nd, …
  const STEP_PANEL_SELECTOR = '.step-panel';
  function blogyStepHeading(stepId){
    // strip "step-" prefix; if not numeric, skip.
    const n = Number(stepId.replace(/^step-/, ''));
    if (!Number.isFinite(n)) return null;
    const panels = document.querySelectorAll(STEP_PANEL_SELECTOR);
    const panel = panels[n];
    if (!panel) return null;
    const h = panel.querySelector('h2, h1, header');
    return h ? h.textContent : null;
  }
  document.addEventListener('change', (ev) => {
    if (!soundOn() || !soundLevelAtLeast('normal')) return;
    const t = ev.target;
    if (!t || !t.id) return;
    if (t.matches('input[type="radio"][name="step"]')){
      const txt = blogyStepHeading(t.id);
      if (txt) speak(txt);
    }
  }, true);

  /* ── ADVANCED: speak field contents on blur ──────────────── */
  document.addEventListener('blur', (ev) => {
    if (!soundOn() || !soundLevelAtLeast('advanced')) return;
    const t = ev.target;
    if (!t || !t.matches) return;
    if (t.dataset && t.dataset.floveSpeak === 'off') return;
    let val = '';
    if (t.matches('textarea, input[type="text"], input[type="search"], input[type="url"], input[type="email"]')){
      val = t.value || '';
    } else if (t.matches('[contenteditable="true"], [contenteditable=""]')){
      val = t.textContent || '';
    } else {
      return;
    }
    if (val.trim()) speak(val);
  }, true);

  /* ── SUPER: speak bot-inserted texts when the bot changes ── */
  // Generic opt-in: [data-flove-speak="bot"]. After any bot-* radio
  // toggle, scan the page for visible bot-text elements (matching the
  // generic data attr OR blogy's bot textarea classes) and speak the
  // first one. A short timeout gives the :has()/display CSS rules a
  // chance to flip visibility before we read the DOM.
  function isVisible(el){
    if (!el) return false;
    if (el.offsetParent !== null) return true;
    const cs = el.ownerDocument.defaultView.getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }
  function pickVisibleBotText(){
    // 1) generic opt-in
    for (const el of document.querySelectorAll('[data-flove-speak="bot"]')){
      if (isVisible(el)) return el.value || el.textContent;
    }
    // 2) blogy auto-discovery
    const SELECTORS = [
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--magic',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--lovely',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--lovely-1',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--lovely-2',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--lovely-3',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--lovely-4',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--lovely-5',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--joy',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--joy-1',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--joy-2',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--joy-3',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--joy-4',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--joy-5',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--wisdom',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--wisdom-1',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--wisdom-2',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--wisdom-3',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--wisdom-4',
      '.entry-field--main:not(.entry-field--dup) .entry-textarea--wisdom-5',
    ];
    for (const sel of SELECTORS){
      const el = document.querySelector(sel);
      if (el && isVisible(el)){ return el.value; }
    }
    return '';
  }
  document.addEventListener('change', (ev) => {
    if (!soundOn() || !soundLevelAtLeast('super')) return;
    const t = ev.target;
    if (!t || !t.name) return;
    if (!/^bot-choice(-|$)|^bot-\d+-phrase$|^bot-/.test(t.name)) return;
    setTimeout(() => {
      const txt = pickVisibleBotText();
      if (txt) speak(txt);
    }, 40);
  }, true);

  /* ── speak a one-shot label when sound-level itself changes ── */
  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (!t || !t.matches || !t.matches('input[name="sound-level"]')) return;
    if (!soundOn()) return;
    const label = t.id.replace(/^sound-/, '');
    const map = {
      mini:     'Sound: Mini · clicks only',
      basic:    'Sound: Basic · customize in Sounds',
      normal:   'Sound: Normal · titles read aloud',
      advanced: 'Sound: Advanced · fields read aloud',
      super:    'Sound: Super · bot texts read aloud',
    };
    speak(map[label] || ('Sound level ' + label));
  });

  /* ── init ───────────────────────────────────────────────── */
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindTitles, { once: true });
  } else {
    bindTitles();
  }
  // Pick up dynamically added titles too.
  if ('MutationObserver' in window){
    new MutationObserver(() => bindTitles()).observe(document.documentElement, {
      childList: true, subtree: true,
    });
  }

  /* ── public API ─────────────────────────────────────────── */
  window.flove = Object.assign(window.flove || {}, {
    speak,
    getSoundLevel,
    setSoundLevel,
    soundLevelAtLeast,
  });
})();

/* ============================================================
   flove.wizard · bot-suggestion text injection helpers
   ============================================================
   Shared by every app that has a "magic / bot" suggestion button
   wired to a <textarea> or <input>. Lets a bot append or swap its
   suggestion in place while preserving any text the user typed
   before or after it. A ✕ close removes only the bot's contribution.

   Per-element state (the currently-inserted bot string) is held in
   a WeakMap, so it doesn't leak and doesn't pollute the DOM.

   API
     flove.wizard.inject(el, text)  add a bot suggestion, or, if the
                                  same element already has a bot
                                  suggestion, swap it in place for
                                  this new one.
     flove.wizard.clear(el)         remove the bot suggestion from the
                                  value (text the user typed on
                                  either side stays).
     flove.wizard.current(el)       the currently-inserted bot text
                                  for el, or undefined.

   Both inject() and clear() dispatch an "input" event on el, so
   any change/refresh listener on the form picks the new value up
   automatically.
   ============================================================ */
(() => {
  'use strict';
  const state = new WeakMap();

  function inject(el, text){
    if (!el || text == null) return;
    const oldText = state.get(el);
    let val = el.value || "";
    if (oldText && val.indexOf(oldText) !== -1){
      val = val.replace(oldText, text);
    } else {
      const trimmed = val.replace(/\s+$/, "");
      val = (trimmed ? trimmed + " " : "") + text;
    }
    el.value = val;
    state.set(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function clear(el){
    if (!el) return;
    const oldText = state.get(el);
    if (oldText && el.value && el.value.indexOf(oldText) !== -1){
      // Remove ONLY the bot block. Collapse the seam where it sat so we
      // don't leave a double-space, but never strip the user's leading
      // or trailing whitespace — preserves anything they typed before /
      // after the bot insertion (matches offer.html on collapse).
      const i = el.value.indexOf(oldText);
      const before = el.value.slice(0, i);
      const after  = el.value.slice(i + oldText.length);
      let seam = "";
      if (/\s$/.test(before) && /^\s/.test(after)) seam = " ";
      el.value = before.replace(/\s+$/, "") + seam + after.replace(/^\s+/, "");
    }
    state.delete(el);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function current(el){
    return el ? state.get(el) : undefined;
  }

  window.flove = Object.assign(window.flove || {}, {
    bot: { inject, clear, current },
  });
})();

/* ============================================================
   flove.wizard.strips · declarative bot strips (offer.html-style)
   ============================================================
   Auto-wires a row of bot pickers to a single textarea/input via
   data attributes — same UX as offer.html, no inline JS required.

   Markup
     <textarea id="mainTA"></textarea>
     <div class="bot-row" data-bot-target="#mainTA">
       <button type="button" data-bot-magic>✨</button>
       <button type="button" data-bot="lovely">😍</button>
       <button type="button" data-bot="joy">😂</button>
       <button type="button" data-bot="wisdom">🔥</button>
       <button type="button" data-bot-clear>✕</button>
     </div>

   Behavior
     • [data-bot-magic]     toggles a seed (default text) into the target.
                            Picking a bot below replaces the seed.
                            Toggling magic OFF removes only the seed —
                            anything the user typed before / after stays.
     • [data-bot="<name>"]  cycles through that bot's N texts
                            (default 5). Sixth click clears it.
                            Bot picks are mutually exclusive within
                            the same row — clicking another bot
                            replaces the inserted text in place.
     • [data-bot-clear]     collapses the bot row: removes ONLY the
                            bot-inserted text, resets cycle counters,
                            clears .is-on highlights, and turns the
                            magic toggle off. Same contract as
                            offer.html — the user's typed content is
                            never touched on collapse.

   Texts are looked up in this order:
     1. data-bot-texts on the row — JSON: { lovely:[..], joy:[..], wisdom:[..] }
        and optional { magic: "seed text" }.
     2. window.flove.wizard.packs[<pack-id>] — the row can carry
        data-bot-pack="<id>" to pick a named pack.
     3. window.flove.wizard.packs.default — built-in fallback.
   ============================================================ */
(() => {
  'use strict';
  const counters = new WeakMap();  // row → { bot: count }
  const magicState = new WeakMap(); // row → boolean

  const DEFAULT_PACK = {
    magic: "✨ Something shines here, something new being born.",
    lovely: [
      "Dear reader, with care and respect, I share this for your consideration.",
      "May these words land softly, and may they meet you where you are.",
      "I hold what you say with both hands; nothing here will be rushed.",
      "If a phrase feels heavy, set it down; we can return to it when you're ready.",
      "Thank you for trusting this space with what matters to you.",
    ],
    joy: [
      "Hey! What if we do it together and have a blast? 🎈",
      "Imagine the room lighting up — that's where this is heading. ✨",
      "Bring snacks, bring friends, bring whatever makes you grin. 🥳",
      "We'll figure out the small stuff while we dance the big stuff. 💃",
      "Mark the calendar in colours — this one's going to be remembered. 🎉",
    ],
    wisdom: [
      "Where the air leans and the silence writes, there beats what has no name yet.",
      "The river does not argue with the stone; it remembers the long way home.",
      "Listen for the word the room is trying to say through you.",
      "What is asked of you now is older than the asking — older, and quieter.",
      "When you cannot see the path, sit. The path is also resting.",
    ],
  };

  function rowOf(el){ return el && el.closest('[data-bot-target], .bot-row'); }
  function targetOf(row){
    if (!row) return null;
    const sel = row.dataset.botTarget;
    if (sel){
      try { return document.querySelector(sel); }
      catch(_){ return document.getElementById(sel.replace(/^#/, '')); }
    }
    return null;
  }
  function packFor(row){
    // 1) inline JSON
    if (row.dataset.botTexts){
      try { return JSON.parse(row.dataset.botTexts); }
      catch(_){}
    }
    // 2) named pack
    const packs = (window.flove && window.flove.wizard && window.flove.wizard.packs) || {};
    const id = row.dataset.botPack || 'default';
    return packs[id] || packs.default || DEFAULT_PACK;
  }
  function getCount(row, bot){
    const c = counters.get(row) || {};
    return c[bot] || 0;
  }
  function setCount(row, bot, n){
    const c = counters.get(row) || {};
    c[bot] = n;
    counters.set(row, c);
  }
  function resetCounts(row){
    counters.set(row, {});
  }
  function siblings(row){
    return [...row.querySelectorAll('[data-bot], [data-bot-magic]')];
  }
  function clearIsOn(row){
    siblings(row).forEach(b => b.classList.remove('is-on'));
  }

  function onMagicClick(btn){
    const row = rowOf(btn);
    if (!row) return;
    const ta = targetOf(row);
    if (!ta) return;
    const pack = packFor(row);
    const on = !magicState.get(row);
    magicState.set(row, on);
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on){
      window.flove.wizard.inject(ta, pack.magic || "✨");
      // bot picks reset to 0 since magic is the active text
      resetCounts(row);
      row.querySelectorAll('[data-bot]').forEach(b => b.classList.remove('is-on'));
    } else {
      window.flove.wizard.clear(ta);
      resetCounts(row);
      clearIsOn(row);
    }
  }

  function onBotClick(btn){
    const row = rowOf(btn);
    if (!row) return;
    const ta = targetOf(row);
    if (!ta) return;
    const bot = btn.dataset.bot;
    const pack = packFor(row);
    const list = (pack && pack[bot]) || [];
    if (!list.length){
      // no texts — just toggle highlight and skip
      const wasOn = btn.classList.contains('is-on');
      clearIsOn(row);
      btn.classList.toggle('is-on', !wasOn);
      return;
    }
    const next = (getCount(row, bot) + 1) % (list.length + 1);
    // clear cycle counters for the other bots — only one is "on" at a time
    const c = {}; c[bot] = next; counters.set(row, c);
    clearIsOn(row);
    if (next === 0){
      window.flove.wizard.clear(ta);
      magicState.set(row, false);
    } else {
      window.flove.wizard.inject(ta, list[next - 1]);
      btn.classList.add('is-on');
      magicState.set(row, false);
      const magic = row.querySelector('[data-bot-magic]');
      if (magic){ magic.classList.remove('is-on'); magic.setAttribute('aria-pressed', 'false'); }
    }
  }

  function onClearClick(btn){
    const row = rowOf(btn);
    if (!row) return;
    const ta = targetOf(row);
    if (ta) window.flove.wizard.clear(ta);
    resetCounts(row);
    magicState.set(row, false);
    clearIsOn(row);
    const magic = row.querySelector('[data-bot-magic]');
    if (magic) magic.setAttribute('aria-pressed', 'false');
  }

  document.addEventListener('click', (ev) => {
    const magic = ev.target.closest('[data-bot-magic]');
    if (magic){ onMagicClick(magic); return; }
    const clear = ev.target.closest('[data-bot-clear]');
    if (clear){ onClearClick(clear); return; }
    const pick = ev.target.closest('[data-bot]');
    if (pick && rowOf(pick)){ onBotClick(pick); return; }
  });

  // Expose the packs registry so apps can extend it.
  window.flove = window.flove || {};
  window.flove.wizard = window.flove.wizard || {};
  window.flove.wizard.packs = Object.assign(
    { default: DEFAULT_PACK },
    window.flove.wizard.packs || {}
  );
})();

/* ============================================================
   flove.resume · declarative resume / summary buttons
   ============================================================
   Wires the Save / Share / Publish / Copy / Print / Insight /
   View / Magic-toggle controls of a resume section via data
   attributes — no inline JS required.

   • data-flove-save="<fmt>"      Save dispatch (already wired in
                                  the Summary Actions module).
                                  Accepts a list (space- or
                                  comma-separated) — opens a small
                                  "pick a format" menu when more
                                  than one is given.
                                  Format "bundle" is an alias of "zip".
                                  Format "md" exports Markdown.

   • data-flove-share              Share dispatch (already wired).

   • data-flove-copy               Copies the phrase (or full
                                  snapshot text) to clipboard and
                                  emits a "flove:copied" CustomEvent.

   • data-flove-print              window.print().

   • data-flove-publish[="<plat>"] Dispatches a "flove:publish"
                                  CustomEvent. Detail carries the
                                  collected snapshot, the target
                                  platform (if any), and any
                                  schedule fields read from
                                  sibling .pub-cal-*, .pub-hh,
                                  .pub-mm, .pub-target selects.
                                  No network call is made — the
                                  host (or a future 0asis hook)
                                  listens and routes. Falls back to
                                  a toast + clipboard copy.

   • data-flove-insight-cycle      A button group whose children
                                  carry data-flove-insight="<txt>".
                                  Clicking the parent cycles to the
                                  next child's text — useful when
                                  CSS-only cycling isn't enough.
                                  (blogy.html's CSS-only cycle keeps
                                  working without this attribute.)

   • data-flove-magic              Toggles the .is-magic class on
                                  the resume root, so CSS can swap
                                  between the default and the
                                  magicked clauses.
   ============================================================ */
(() => {
  'use strict';

  function toast(msg){
    let el = document.getElementById('flove-toast');
    if (!el){
      el = document.createElement('div');
      el.id = 'flove-toast';
      el.style.cssText = `
        position:fixed; left:50%; bottom:24px;
        transform:translateX(-50%) translateY(12px);
        background:#1d1b22; color:#fff; padding:10px 16px;
        border-radius:99px; font: 13px/1.2 ui-sans-serif, system-ui, sans-serif;
        opacity:0; transition: opacity .2s, transform .2s;
        z-index: 99999; pointer-events:none;
      `;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(12px)';
    }, 1800);
  }

  function escMd(s){ return String(s).replace(/([*_`])/g, '\\$1'); }
  function toMd(d){
    const head = `# ${d.title}\n`;
    const ph = d.phrase ? `\n> ${d.phrase}\n` : '';
    const list = d.fields.length
      ? '\n' + d.fields.map(f => `- **${escMd(f.label)}**: ${escMd(f.value)}`).join('\n') + '\n'
      : '';
    return head + ph + list + `\n— flove · ${d.when}\n`;
  }

  // Register .md as a save format on top of the existing save dispatch.
  // We re-use the existing handler via a tiny shim: hook clicks on
  // [data-flove-save] that name "md" or "bundle" BEFORE the older
  // delegated listener (capture phase) and let everything else through.
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-flove-save]');
    if (!el) return;
    const raw = (el.dataset.floveSave || '').trim();
    if (!raw) return;
    const fmts = raw.split(/[\s,]+/).filter(Boolean);
    // Multi-format → small picker (we don't intercept single-format
    // calls; the existing dispatch handles them via the default code path).
    if (fmts.length > 1){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      openFormatPicker(el, fmts);
      return;
    }
    const fmt = fmts[0].toLowerCase();
    if (fmt === 'md'){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      const d = window.flove.collect(el.closest('[data-flove-root]') || undefined);
      const base = (d.title || 'flove').trim().replace(/\s+/g, '_').replace(/[^\w.\-]+/g, '') || 'flove';
      const blob = new Blob([toMd(d)], { type: 'text/markdown;charset=utf-8' });
      triggerDownload(`${base}.md`, blob);
      return;
    }
    if (fmt === 'bundle'){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      // forward to the existing "zip" handler
      window.flove.save('zip', el.closest('[data-flove-root]') || undefined);
      return;
    }
    // any other single fmt: leave it to the older listener.
  }, true);

  function triggerDownload(filename, blob){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function openFormatPicker(anchor, fmts){
    document.getElementById('flove-fmt-picker')?.remove();
    const menu = document.createElement('div');
    menu.id = 'flove-fmt-picker';
    menu.setAttribute('role', 'menu');
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `
      position:fixed;
      left:${Math.max(8, Math.min(window.innerWidth - 220, r.left))}px;
      top:${r.bottom + 6}px;
      background:#fff; color:#1d1b22;
      border:1px solid rgba(0,0,0,.08);
      border-radius:12px; padding:6px;
      box-shadow: 0 12px 32px -16px rgba(0,0,0,.3);
      font: 13px/1.2 ui-sans-serif, system-ui, sans-serif;
      z-index: 99999;
      display:flex; flex-wrap:wrap; gap:4px;
      max-width: 260px;
    `;
    fmts.forEach(f => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = f.toUpperCase();
      b.style.cssText = `
        appearance:none; border:0; background:#f6f3fc; color:#1d1b22;
        padding:6px 10px; border-radius:8px; cursor:pointer;
        font:inherit;`;
      b.addEventListener('click', () => {
        menu.remove();
        // re-fire as a single-format save click on the same root
        const root = anchor.closest('[data-flove-root]') || undefined;
        const lower = f.toLowerCase();
        if (lower === 'md'){
          const d = window.flove.collect(root);
          const base = (d.title || 'flove').trim().replace(/\s+/g, '_').replace(/[^\w.\-]+/g, '') || 'flove';
          triggerDownload(`${base}.md`, new Blob([toMd(d)], { type: 'text/markdown;charset=utf-8' }));
        } else if (lower === 'bundle'){
          window.flove.save('zip', root);
        } else {
          window.flove.save(lower, root);
        }
      });
      menu.appendChild(b);
    });
    const close = (e) => {
      if (!menu.contains(e.target)){ menu.remove(); document.removeEventListener('click', close, true); }
    };
    setTimeout(() => document.addEventListener('click', close, true), 0);
    document.body.appendChild(menu);
  }

  /* ── Copy ───────────────────────────────────────────────── */
  function asPlainText(d){
    const parts = [d.title, '', d.phrase, ''].filter(s => s != null);
    d.fields.forEach(f => parts.push(`${f.label}: ${f.value}`));
    parts.push('', `— flove · ${d.when}`);
    return parts.join('\n');
  }

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-flove-copy]');
    if (!el) return;
    ev.preventDefault();
    const d = window.flove.collect(el.closest('[data-flove-root]') || undefined);
    const mode = el.dataset.floveCopy || 'all';
    const txt = mode === 'phrase' ? (d.phrase || d.title || '') : asPlainText(d);
    const done = () => {
      toast('Copied');
      el.dispatchEvent(new CustomEvent('flove:copied', { detail: { text: txt, data: d }, bubbles: true }));
    };
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(done, () => toast("Couldn't copy"));
    } else {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); }
      catch(_){ toast("Couldn't copy"); }
      ta.remove();
    }
  });

  /* ── Print ──────────────────────────────────────────────── */
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-flove-print]');
    if (!el) return;
    ev.preventDefault();
    window.print();
  });

  /* ── Publish — fires CustomEvent, falls back to a toast ── */
  function pickedPlatforms(root){
    // look for radios/checkboxes whose id starts with "pub-plat-"
    return [...(root || document).querySelectorAll('input[id^="pub-plat-"]:checked')]
      .map(el => el.id.replace(/^pub-plat-/, ''));
  }
  function readSchedule(root){
    const r = root || document;
    const get = sel => { const el = r.querySelector(sel); return el ? el.value : ''; };
    const d = get('.pub-cal-d'), m = get('.pub-cal-m'), y = get('.pub-cal-y');
    const hh = get('.pub-hh'), mm = get('.pub-mm');
    const audience = get('.pub-target');
    return { date: (y && m && d) ? `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}` : '',
             time: (hh && mm) ? `${hh}:${mm}` : '',
             audience };
  }

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-flove-publish]');
    if (!el) return;
    // Inside a publish-cycle label-for-radio, only act when the cycle is open.
    // We let the original click happen too (so the radio toggles via CSS).
    const root = el.closest('[data-flove-root]') || undefined;
    const d = window.flove.collect(root);
    const platforms = pickedPlatforms(root);
    const schedule = readSchedule(root);
    const explicit = el.dataset.flovePublish && el.dataset.flovePublish !== 'go'
      ? el.dataset.flovePublish
      : null;
    if (explicit) platforms.unshift(explicit);
    const detail = { data: d, platforms, schedule, button: el };
    const fired = el.dispatchEvent(new CustomEvent('flove:publish', {
      detail, bubbles: true, cancelable: true,
    }));
    // If no listener cancels the default, fall back to a toast + clipboard.
    if (fired){
      const where = platforms.length ? platforms.join(', ') : 'somewhere later';
      const when = schedule.date && schedule.time ? `${schedule.date} ${schedule.time}` : 'now';
      const text = asPlainText(d) + `\n\n[Publish → ${where} · ${when}]`;
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).catch(() => {});
      }
      toast(platforms.length ? `Queued · ${where}` : 'Publish queued');
    }
  });

  /* ── Insight cycle (JS fallback for CSS-only stepper) ──── */
  document.addEventListener('click', (ev) => {
    const wrap = ev.target.closest('[data-flove-insight-cycle]');
    if (!wrap) return;
    const steps = [...wrap.querySelectorAll('[data-flove-insight]')];
    if (!steps.length) return;
    let i = Number(wrap.dataset.floveInsightIndex || -1);
    i = (i + 1) % steps.length;
    wrap.dataset.floveInsightIndex = String(i);
    steps.forEach((s, n) => s.classList.toggle('is-on', n === i));
    wrap.dispatchEvent(new CustomEvent('flove:insight', {
      detail: { index: i, text: steps[i].dataset.floveInsight, step: steps[i] },
      bubbles: true,
    }));
  });

  /* ── Magic toggle on the resume root ───────────────────── */
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-flove-magic]');
    if (!el) return;
    // Only act if it's a real button (avoid hijacking <label for="…">)
    if (el.matches('label[for]') || el.matches('input')) return;
    ev.preventDefault();
    const root = el.closest('[data-flove-root]') || document.body;
    const on = !root.classList.contains('is-magic');
    root.classList.toggle('is-magic', on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
    el.dispatchEvent(new CustomEvent('flove:magic', {
      detail: { on, root }, bubbles: true,
    }));
  });

  /* ── Sound extras: master volume + apply-all + test-all ── */
  // Master volume: a <input type="range" data-flove-volume min="0" max="1" step=".01">.
  // Scales every synth tone in window.blogySounds (and audio elements get .volume).
  let masterVolume = 1;
  Object.defineProperty(window, 'floveMasterVolume', { get: () => masterVolume });
  function applyMasterVolume(v){
    masterVolume = v;
    const sounds = window.blogySounds || {};
    Object.keys(sounds).forEach(k => {
      const s = sounds[k];
      if (s && typeof s === 'object' && (s.freq || s.f)){
        if (s._baseGain == null) s._baseGain = s.gain != null ? s.gain : 0.06;
        s.gain = s._baseGain * v;
      }
    });
  }
  document.addEventListener('input', (ev) => {
    const r = ev.target.closest('input[type="range"][data-flove-volume]');
    if (!r) return;
    applyMasterVolume(Number(r.value));
  });

  // Apply a single pack to ALL sound areas at once.
  // Markup: <select data-flove-sound-apply-all><option value="soft|chimes|retro|synth|mystic|off">…</option></select>
  // Or: <button data-flove-sound-apply-all="soft">…</button>
  function applyPackToAllAreas(packId){
    const reg = window.blogySoundsRegistry;
    if (!reg || !reg.applyPackToArea) return;
    // discover known areas by reading every sound key's prefix
    const sounds = window.blogySounds || {};
    const areas = new Set();
    Object.keys(sounds).forEach(k => { const p = k.split(':')[0]; if (p) areas.add(p); });
    areas.forEach(area => reg.applyPackToArea(area, packId));
    // also reflect in any <select data-sound-area> on the page
    document.querySelectorAll('select[data-sound-area]').forEach(sel => {
      const opt = [...sel.options].find(o => o.value === packId);
      if (opt) sel.value = packId;
    });
  }
  document.addEventListener('change', (ev) => {
    const sel = ev.target.closest('select[data-flove-sound-apply-all]');
    if (sel){ applyPackToAllAreas(sel.value); }
  });
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-flove-sound-apply-all]');
    if (!b || b.tagName === 'SELECT') return;
    const v = b.dataset.floveSoundApplyAll;
    if (v) applyPackToAllAreas(v);
  });

  // Preview ALL sound keys in order — one short tone per key.
  // Markup: <button data-flove-sound-test-all>Test all</button>
  let testAllT = null;
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-flove-sound-test-all]');
    if (!b) return;
    ev.preventDefault();
    const reg = window.blogySoundsRegistry;
    if (!reg || !reg.preview) return;
    const keys = reg.keys();
    if (testAllT){ clearTimeout(testAllT); testAllT = null; }
    let i = 0;
    const step = () => {
      if (i >= keys.length){ testAllT = null; return; }
      try { reg.preview(keys[i]); } catch(_){}
      i += 1;
      testAllT = setTimeout(step, 220);
    };
    step();
  });

  // Per-area preview button: <button data-flove-sound-preview="<area>">▶︎</button>
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-flove-sound-preview]');
    if (!b) return;
    ev.preventDefault();
    const reg = window.blogySoundsRegistry;
    if (!reg || !reg.preview) return;
    const area = b.dataset.floveSoundPreview;
    if (!area) return;
    // pick any sound whose key starts with that area
    const sounds = window.blogySounds || {};
    const k = Object.keys(sounds).find(k => k.split(':')[0] === area);
    if (k) reg.preview(k);
  });

  /* ── public API ─────────────────────────────────────────── */
  window.flove = Object.assign(window.flove || {}, {
    toast,
    resume: {
      copy: (root) => {
        const d = window.flove.collect(root);
        const txt = asPlainText(d);
        if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
        return txt;
      },
      publish: (opts) => {
        const d = window.flove.collect(opts && opts.root);
        const detail = {
          data: d,
          platforms: (opts && opts.platforms) || pickedPlatforms(opts && opts.root),
          schedule: (opts && opts.schedule) || readSchedule(opts && opts.root),
          button: null,
        };
        document.dispatchEvent(new CustomEvent('flove:publish', { detail, bubbles: true }));
        return detail;
      },
    },
    formats: Object.assign(window.flove?.formats || {}, { toMd }),
  });
})();

/* ============================================================
   flove.autowire · zero-config decoration for blogy.html
   ============================================================
   Lights up a blogy.html copy that does nothing more than add
   <script src="flove.js" defer><\/script>. No HTML edits required:

   • Tags the summary panel (.step-panel.is-summary) as
     [data-flove-root] so collect()/save()/share() find it.

   • Wires .share-btn → data-flove-share (native sheet, falls
     back to in-page menu).

   • Injects a 📱 Mobile share-sub next to Print/Email in the
     share-wrap drawer; clicking it opens the mobile-filtered
     share sheet (window.flove.shareApps drives the platforms).

   • Wires the Print share-sub (matched by title="Print" or
     emoji 🖨) to data-flove-print.

   • Idempotent: re-running (e.g. via MutationObserver) is safe.
   ============================================================ */
(() => {
  'use strict';

  function decorate(){
    // 1) Tag summary panel as flove root ONLY if the page doesn't already
    //    declare a root (e.g. blogylibs uses <main data-flove-root>). Two
    //    roots would split closest() / first-match() in subtle ways and
    //    break view-class wiring.
    if (!document.querySelector('[data-flove-root]')){
      const summary = document.querySelector('.step-panel.is-summary, .step-panel--summary');
      if (summary) summary.setAttribute('data-flove-root', '');
    }

    // 2) Wire every .share-btn to data-flove-share (native first, menu fallback).
    document.querySelectorAll('.share-btn').forEach(btn => {
      if (!btn.hasAttribute('data-flove-share')) btn.setAttribute('data-flove-share', '');
    });

    // 3) Inject the 📱 Mobile share-sub into every .share-wrap .cycle-row
    //    (next to Print/Email). Skip if already present.
    document.querySelectorAll('.share-wrap .cycle-row').forEach(row => {
      if (row.querySelector('[data-flove-share-menu="mobile"]')) return;
      const mob = document.createElement('button');
      mob.type = 'button';
      mob.className = 'btn ghost share-sub';
      mob.setAttribute('data-flove-share-menu', 'mobile');
      mob.title = 'Mobile share sheet';
      mob.setAttribute('aria-label', 'Share via mobile app');
      mob.innerHTML =
        '📱 <span class="t-en">Mobile</span><span class="t-es">Móvil</span>';
      row.appendChild(mob);
    });

    // 4) Wire the Print share-sub (CSS-only span in blogy.html) to actually print.
    document.querySelectorAll('.share-sub').forEach(el => {
      if (el.hasAttribute('data-flove-print')) return;
      if (el.hasAttribute('data-flove-share-menu')) return;
      const title = (el.getAttribute('title') || '').toLowerCase();
      const text  = (el.textContent || '').trim();
      if (title.startsWith('print') || /^🖨/.test(text)){
        el.setAttribute('data-flove-print', '');
      }
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', decorate, { once: true });
  } else {
    decorate();
  }

  // Re-run on dynamic DOM changes (e.g. SPA navigation, modal injection).
  if ('MutationObserver' in window){
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; decorate(); });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  window.flove = Object.assign(window.flove || {}, {
    autowire: decorate,
  });
})();

/* ============================================================
   flove.resume.phrase · live one-field-per-row rendering
   ============================================================
   Replaces the contents of [data-flove-phrase] with the list of
   fields collected by flove.collect(), one row per field
   ("label: value"). Re-renders on any input/change inside
   [data-flove-root] (debounced) — but never while the phrase
   itself is being edited (we skip while it has focus).

   Empty fields (no value) are omitted. If the phrase carries
   data-flove-phrase-keep="true" the renderer leaves it alone
   (host can opt out per page).
   ============================================================ */
(() => {
  'use strict';

  const DEBOUNCE_MS = 180;
  let t = 0;
  const escHtml = s => String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function rootOf(){
    return document.querySelector('[data-flove-root]') || document.body;
  }
  function phraseEl(){
    const root = rootOf();
    return root.querySelector('[data-flove-phrase]')
        || document.querySelector('[data-flove-phrase]');
  }

  // Read a rater scope. `suffix` is '' for the main field's rater group
  // and '-extra' for the entry-row--extra ("+ New") field's independent
  // rater. The emoji set is also scope-specific so the extra rater
  // displays its own identity (🪞 🌟 🤝 🕯) rather than mirroring main.
  function readRater(suffix){
    suffix = suffix || '';
    const get = name => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      if (!el || !el.id) return 0;
      const m = el.id.match(/-(\d+)$/);
      return m ? Number(m[1]) : 0;
    };
    // The rater's SCALE is read from the markup, never assumed: count the
    // numbered steps in the radio group. Other apps / other raters may run
    // 1-3, 1-7, … — the emoji is only the rater's TITLE, not the scale, and
    // a rater may carry no numbered steps at all (then it's title-only).
    const cap = name => {
      let m = 0;
      document.querySelectorAll(`input[name="${name}"]`).forEach(el => {
        const d = (el.id || '').match(/-(\d+)$/);
        if (d) m = Math.max(m, Number(d[1]));
      });
      return m;
    };
    const emo = suffix === '-extra'
      ? { h: '🪞', f: '🌟', l: '🤝', t: '🕯' }
      : { h: '😊', f: '😆', l: '👏', t: '🤔' };
    const lbl = suffix === '-extra' ? ' (side)' : '';
    const mk = (key, emoji, label, name) => ({
      key, emoji, label: label + lbl,
      n: get(name), max: cap(name), scope: suffix,
    });
    return [
      mk('h', emo.h, 'Hearts',   'rate-h' + suffix),
      mk('f', emo.f, 'Fun',      'rate-f' + suffix),
      mk('l', emo.l, 'Love',     'rate-l' + suffix),
      mk('t', emo.t, 'Thoughts', 'rate-t' + suffix),
    ];
  }
  // Both scopes combined — used wherever we want the full picture.
  function readAllRaters(){
    return [...readRater(''), ...readRater('-extra')];
  }
  // Collect the currently-active textarea of every field group on the page
  // (main, dup, extra, mini, plus any future ones following the same
  // .entry-textareas pattern). Drives the multi-field resume display.
  function pickActiveVariant(group){
    const variants = [...group.querySelectorAll('.entry-textarea')];
    if (!variants.length) return null;
    // Pick the variant CSS is currently SHOWING. We test the element's own
    // computed `display` (not offsetParent) so it still resolves when the
    // field's whole step panel is hidden — e.g. while the Summary step is
    // open. Exactly one variant is display:block at any time (the bot /
    // subbot the user last picked), so this always tracks the live choice.
    // The old code fell back to "first variant whose value differs from
    // its template", which froze the resume on the FIRST subbot picked and
    // ignored later edits — this is the fix for that.
    const shown = variants.find(v => {
      const cs = getComputedStyle(v);
      return cs && cs.display !== 'none';
    });
    if (shown) return shown;
    // Fallback — nothing resolved as shown: take whichever carries a value.
    return variants.find(v => (v.value || '').trim()) || variants[0];
  }
  function gatherFieldTexts(){
    const root = rootOf();
    const groups = root.querySelectorAll('.entry-textareas');
    const out = [];
    const seen = new Set();
    groups.forEach(group => {
      const active = pickActiveVariant(group);
      if (!active) return;
      const v = (active.value || '').trim();
      if (!v) return;
      if (seen.has(v)) return; // de-dupe identical phrases (e.g. main + dup)
      seen.add(v);
      // Figure out which rater scope (if any) is bound to this field's
      // row, so we can render the matching emojis inline next to its
      // text (main row → main rater, extra row → extra rater).
      const row    = group.closest('.entry-row');
      const isDup  = !!group.closest('.entry-field--dup');
      const isMini = !!group.closest('.entry-field--mini');
      let scope = null;
      if (row && row.classList.contains('entry-row--extra')) scope = '-extra';
      else if (row && row.classList.contains('entry-row--main') && !isDup) scope = '';
      let emos = '';
      let heart = false;
      if (scope !== null){
        const rater = readRater(scope);
        emos = rater
          .filter(r => r.n > 0)
          .map(r => r.emoji.repeat(Math.min(5, r.n)))
          .join('');
        // Heart appears in the resume whenever this field's rater has any
        // clicks — full opacity when filled, faded otherwise (handled in CSS).
        heart = rater.some(r => r.n > 0);
      }
      // The dup field (revealed by the "+" on the main field's lower edge)
      // has no rater of its own — just a ♥ fill toggle (#rater-show-1d).
      // Mirror that toggle so its text AND heart both reach the resume.
      if (isDup){
        const dh = document.getElementById('rater-show-1d');
        heart = !!(dh && dh.checked);
      }
      // The "Add note" mini field is flagged so the resume prefixes its
      // line with a "Note:" label.
      out.push({ text: v, emos, heart, note: isMini });
    });
    return out;
  }
  // ── Visualizations · the Views sub-buttons ───────────────────────────
  // Plain · Bars · Vertical · Axial · Spider. Plain shows only the phrase;
  // the other four chart the SAME rater data — an array of axes, each
  // { emoji, label, n, max }, where the emoji is just the rater's TITLE
  // and `max` is that rater's own scale (read from the markup, NOT assumed
  // to be 5). Every chart is a self-contained <svg> (inline styles, no
  // extra CSS, themeable via --accent) so it renders anywhere and saves as
  // one .svg file. The chart sits in its own block BELOW the phrase, never
  // restyling the resume text. Renderers are exposed on window.flove.viz.
  const VIZ_VIEWS = ['bars', 'vertical', 'axial', 'spider'];
  const SVG_R   = 80;                       // radius of the radial charts
  const ACCENT  = 'var(--accent,#d32f2f)';
  const ACCENTD = 'var(--accent-deep,#a02020)';

  // The view currently selected — read straight from the `view` radio.
  function currentView(){
    const r = document.querySelector('input[name="view"]:checked');
    return (r && /^view-/.test(r.id || '')) ? r.id.slice(5) : 'plain';
  }
  function isVizView(){ return VIZ_VIEWS.indexOf(currentView()) !== -1; }

  // A rater with no numbered steps (max 0) is title-only — nothing to plot.
  function frac(a){ return a.max > 0 ? Math.max(0, Math.min(1, a.n / a.max)) : 0; }

  function axisDir(i, count){
    const a = (-90 + i * (360 / count)) * Math.PI / 180;
    return { x: Math.cos(a), y: Math.sin(a) };
  }
  // blogy adapter: the 8 rater axes (4 main 😊😆👏🤔 + 4 side 🪞🌟🤝🕯),
  // each carrying its own scale. Other apps can build their own array and
  // pass it straight to the renderers below.
  function axisData(){
    const raters = readAllRaters();
    return raters.map((r, i) => ({
      emoji: r.emoji, label: r.label,
      max: r.max, n: Math.max(0, Math.min(r.max || 0, r.n | 0)),
      dir: axisDir(i, raters.length),
    }));
  }

  // Emojis ticked in the "⋯ more" picker — extra emojis the user added.
  function pickedEmojis(){
    const out = [];
    document.querySelectorAll('.picker-cell[for]').forEach(cell => {
      const cb = document.getElementById(cell.getAttribute('for'));
      if (cb && cb.checked){
        const e = (cell.textContent || '').trim();
        if (e && out.indexOf(e) === -1) out.push(e);
      }
    });
    return out;
  }

  // ---- chart building --------------------------------------------------
  function svgOpen(w, h, vb){
    return '<svg class="flove-viz-svg" xmlns="http://www.w3.org/2000/svg" '
      + 'viewBox="' + vb + '" width="' + w + '" height="' + h + '" '
      + 'style="display:block;width:100%;max-width:' + w + 'px;height:auto;'
      + 'margin:0 auto;font-family:sans-serif" role="img" aria-label="Rater chart">';
  }

  // Bars — a horizontal bar per axis.
  function vizBars(axes){
    const n = axes.length, rowH = 30, padT = 14, padB = 10;
    const W = 320, H = padT + n * rowH + padB, barX = 116, barW = 168;
    let body = '';
    axes.forEach((a, i) => {
      const y = padT + i * rowH + rowH / 2;
      body += '<text x="12" y="' + (y + 5) + '" font-size="15">' + a.emoji + '</text>'
        + '<text x="32" y="' + (y + 4) + '" font-size="11" fill="#666">' + escHtml(a.label) + '</text>'
        + '<rect x="' + barX + '" y="' + (y - 5) + '" width="' + barW + '" height="10" rx="5" fill="rgba(0,0,0,.08)"/>'
        + '<rect x="' + barX + '" y="' + (y - 5) + '" width="' + (barW * frac(a)).toFixed(1) + '" height="10" rx="5" fill="' + ACCENT + '"/>'
        + '<text x="' + (W - 12) + '" y="' + (y + 4) + '" font-size="11" fill="#333" text-anchor="end">'
        + a.n + '/' + (a.max || '–') + '</text>';
    });
    return svgOpen(W, H, '0 0 ' + W + ' ' + H) + body + '</svg>';
  }

  // Vertical — a column per axis.
  function vizVertical(axes){
    const n = axes.length, W = 320, H = 168;
    const colW = W / n, top = 26, trackH = 100, tw = 13;
    let body = '';
    axes.forEach((a, i) => {
      const cx = i * colW + colW / 2, fh = trackH * frac(a);
      body += '<text x="' + cx + '" y="' + (top - 9) + '" font-size="11" fill="#333" text-anchor="middle">' + a.n + '</text>'
        + '<rect x="' + (cx - tw / 2) + '" y="' + top + '" width="' + tw + '" height="' + trackH + '" rx="6" fill="rgba(0,0,0,.08)"/>'
        + '<rect x="' + (cx - tw / 2) + '" y="' + (top + trackH - fh).toFixed(1) + '" width="' + tw + '" height="' + fh.toFixed(1) + '" rx="6" fill="' + ACCENT + '"/>'
        + '<text x="' + cx + '" y="' + (top + trackH + 22) + '" font-size="15" text-anchor="middle">' + a.emoji + '</text>';
    });
    return svgOpen(W, H, '0 0 ' + W + ' ' + H) + body + '</svg>';
  }

  // Shared radial scaffold: guide rings at even FRACTIONS of the radius
  // (so mixed per-axis scales still chart correctly) + emoji axis labels.
  function radialParts(axes){
    let rings = '';
    for (let k = 1; k <= 5; k++){
      rings += '<circle cx="0" cy="0" r="' + (SVG_R * k / 5).toFixed(1) + '" fill="none" stroke="' + ACCENT + '" stroke-opacity=".13"/>';
    }
    const R = SVG_R + 21;
    const labels = axes.map(a =>
      '<text x="' + (a.dir.x * R).toFixed(1) + '" y="' + (a.dir.y * R + 5).toFixed(1) + '" text-anchor="middle" font-size="15">' + a.emoji + '</text>'
    ).join('');
    return { rings: rings, labels: labels };
  }
  function radialSvg(inner){
    const v = SVG_R + 34, S = v * 2;
    return svgOpen(S, S, (-v) + ' ' + (-v) + ' ' + S + ' ' + S) + inner + '</svg>';
  }

  // Axial — one spoke per axis, length = the axis fraction.
  function vizAxial(axes){
    const p = radialParts(axes);
    const spokes = axes.map(a => {
      const len = SVG_R * frac(a);
      return '<line x1="0" y1="0" x2="' + (a.dir.x * len).toFixed(1) + '" y2="' + (a.dir.y * len).toFixed(1)
        + '" stroke="' + ACCENT + '" stroke-width="8" stroke-linecap="round" stroke-opacity=".85"/>';
    }).join('');
    return radialSvg(p.rings + spokes + '<circle cx="0" cy="0" r="3.5" fill="' + ACCENTD + '"/>' + p.labels);
  }

  // Spider — a radar polygon over the axes.
  function vizSpider(axes){
    const p = radialParts(axes);
    const lines = axes.map(a =>
      '<line x1="0" y1="0" x2="' + (a.dir.x * SVG_R).toFixed(1) + '" y2="' + (a.dir.y * SVG_R).toFixed(1)
      + '" stroke="' + ACCENT + '" stroke-opacity=".17"/>'
    ).join('');
    const pts = axes.map(a => { const r = SVG_R * frac(a); return (a.dir.x * r).toFixed(1) + ',' + (a.dir.y * r).toFixed(1); }).join(' ');
    const dots = axes.map(a => { const r = SVG_R * frac(a);
      return '<circle cx="' + (a.dir.x * r).toFixed(1) + '" cy="' + (a.dir.y * r).toFixed(1) + '" r="3.2" fill="' + ACCENTD + '"/>';
    }).join('');
    return radialSvg(p.rings + lines
      + '<polygon points="' + pts + '" fill="' + ACCENT + '" fill-opacity=".22" stroke="' + ACCENT + '" stroke-width="1.5" stroke-linejoin="round"/>'
      + dots + p.labels);
  }

  // Render the chart for `view` from `axes` (defaults to blogy's rater).
  function vizFor(view, axes){
    axes = axes || axisData();
    if (view === 'vertical') return vizVertical(axes);
    if (view === 'axial')    return vizAxial(axes);
    if (view === 'spider')   return vizSpider(axes);
    return vizBars(axes);
  }

  // Full viz block: chart + picked-emoji strip + a Download button.
  function vizBlock(){
    const picked = pickedEmojis();
    const extras = picked.length
      ? '<div style="margin-top:.4em;text-align:center;font-size:1.15em;letter-spacing:.12em">'
        + picked.map(escHtml).join(' ') + '</div>'
      : '';
    return '<div class="flove-viz" style="margin-top:.75em;padding-top:.6em;'
      + 'border-top:1px dashed rgba(0,0,0,.1)">'
      + vizFor(currentView()) + extras
      + '<div style="text-align:center;margin-top:.5em">'
      + '<button type="button" class="flove-viz-dl" style="font:600 11px/1 sans-serif;'
      + 'cursor:pointer;padding:.42em .85em;border-radius:999px;border:1px solid ' + ACCENT + ';'
      + 'background:#fff;color:' + ACCENT + '">⬇ Download SVG</button></div></div>';
  }

  // The chart lives in its OWN block — a sibling placed right below the
  // phrase clauses, never inside the contenteditable resume, so editing
  // the resume text can never disturb the chart.
  function vizOut(){
    let el = document.querySelector('.flove-viz-out');
    if (!el){
      const ph = phraseEl();
      if (!ph) return null;
      el = document.createElement('div');
      el.className = 'flove-viz-out';
      const anchor = magicEl() || ph;
      if (anchor.parentNode) anchor.parentNode.insertBefore(el, anchor.nextSibling);
    }
    return el;
  }

  // Download the current chart as a standalone .svg file.
  function downloadViz(){
    const out = document.querySelector('.flove-viz-out');
    const svg = out && out.querySelector('svg');
    if (!svg) return;
    const xml  = new XMLSerializer().serializeToString(svg);
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + xml],
      { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blogy-' + currentView() + '.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (!document._floveVizDlBound){
    document._floveVizDlBound = true;
    document.addEventListener('click', ev => {
      if (ev.target.closest && ev.target.closest('.flove-viz-dl')){
        ev.preventDefault();
        downloadViz();
      }
    });
  }

  // The phrase the resume echoes by default: the currently-active textarea
  // of the main entry-field (the field sitting above the summary in the
  // page flow). Whatever the user typed — plus any bot suggestion they've
  // accepted — lives there, so that's the single phrase we mirror.
  function activeMainTextarea(){
    const root = rootOf();
    const group = root.querySelector('.entry-field--main:not(.entry-field--dup) .entry-textareas')
              || root.querySelector('.entry-textareas');
    if (!group) return null;
    const variants = [...group.querySelectorAll('.entry-textarea')];
    let active = variants.find(v => v.offsetParent !== null);
    if (!active) active = variants.find(v => v.classList.contains('entry-textarea--default'));
    if (!active) active = variants[0];
    return active || null;
  }
  const escMultiline = s => escHtml(s).replace(/\n/g, '<br>');

  // Per-scope default prepositions for the compact rater chips. Main and
  // extra each get their own set so a glance at the chip row tells you
  // which rater the click belongs to.
  const DEFAULT_RATER_PREPS = {
    '':       { h: 'with',   f: 'for',     l: 'by',      t: 'through' },
    '-extra': { h: 'beside', f: 'amidst',  l: 'amongst', t: 'within'  },
  };
  function compactRater(){
    const rated = readAllRaters().filter(r => r.n > 0);
    if (!rated.length) return '';
    const chips = rated.map(r => {
      const prep = (DEFAULT_RATER_PREPS[r.scope || ''] || {})[r.key] || 'and';
      const emos = r.emoji.repeat(Math.min(5, r.n));
      return `<span class="flove-rater-chip"><span class="flove-rater-prep">${prep}</span> <span class="flove-rater-emos">${emos}</span></span>`;
    }).join(' ');
    return `<div class="flove-rater-compact" aria-label="Rater clicks">${chips}</div>`;
  }

  function magicEl(){
    const root = rootOf();
    return root.querySelector('.clause-magic')
        || document.querySelector('.clause-magic');
  }

  function render(){
    const ph = phraseEl();
    if (!ph) return;

    // The chart lives in its OWN block below the phrase and is kept in
    // sync on every render — even when the phrase text itself is frozen
    // (user-edited) or empty. Plain → no chart.
    const out = vizOut();
    if (out) out.innerHTML = isVizView() ? vizBlock() : '';

    if (ph.dataset.flovePhraseKeep === 'true') return;
    if (document.activeElement === ph) return;
    // Don't overwrite a phrase the user has already edited by hand.
    if (ph.dataset.floveUserEdited === 'true') return;

    const fields = gatherFieldTexts();
    const anyRater = readAllRaters().some(r => r.n > 0);

    if (!fields.length && !anyRater){
      // Nothing typed yet, no rater clicks — keep the original placeholder
      // text on first render so the hint stays.
      if (ph.dataset.floveRendered === 'true') ph.innerHTML = '';
      return;
    }
    // Each field on its own line, with its associated rater emojis appended
    // INLINE. The chart (if a viz view is active) is rendered separately
    // into .flove-viz-out below — the Views buttons never restyle this text.
    const phraseHtml = fields
      .map(f => {
        const heart = f.heart ? '<span class="flove-phrase-heart is-on">♥</span>' : '';
        const emos  = f.emos  ? ' <span class="flove-phrase-emos">' + f.emos + '</span>' : '';
        const note  = f.note  ? '<span class="flove-phrase-note-lbl">Note:</span> ' : '';
        return `<div class="flove-phrase-text">${heart}${note}${escMultiline(f.text)}${emos}</div>`;
      })
      .join('');
    ph.innerHTML = phraseHtml;
    ph.dataset.floveRendered = 'true';
  }

  // Mark the phrase / magic clauses as user-edited as soon as someone
  // types in them, so subsequent auto-renders don't clobber their edits.
  function trackEdits(){
    [phraseEl(), magicEl()].forEach(el => {
      if (!el || el._floveEditTracked) return;
      el._floveEditTracked = true;
      el.addEventListener('input', () => { el.dataset.floveUserEdited = 'true'; });
    });
  }

  function scheduleRender(){
    clearTimeout(t);
    t = setTimeout(render, DEBOUNCE_MS);
  }

  function bind(){
    // Listen on document — blogy/blogylibs keep many .ctl radios
    // (rater, views, magic-toggle) OUTSIDE the [data-flove-root] <main>,
    // so a root-bound listener would miss their change events. Document
    // captures every bubble path on the page.
    if (!document._floveResumeBound){
      document._floveResumeBound = true;
      document.addEventListener('input',  scheduleRender);
      document.addEventListener('change', scheduleRender);
      document.addEventListener('flove:view', scheduleRender);
    }
    trackEdits();
    // First render — wait for the autowire decorator to tag root/phrase.
    scheduleRender();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }

  window.flove = Object.assign(window.flove || {}, {
    renderPhrase: render,
    // Visualizations — reusable by other apps. Pass your own axes array
    // (each item { emoji, label, n, max }) or omit it to read blogy's
    // own rater. `viz.block()` returns the chart for the active view.
    viz: {
      bars:     vizBars,
      vertical: vizVertical,
      axial:    vizAxial,
      spider:   vizSpider,
      render:   vizFor,     // (view, axes?) → <svg> string
      block:    vizBlock,   // active view: chart + extras + download btn
      axes:     axisData,   // blogy's 8 rater axes
      views:    VIZ_VIEWS,
      download: downloadViz,// save the current chart as .svg
    },
  });
})();

/* ============================================================
   flove.wizard.swap · preserve human additions across bot swaps
   ============================================================
   Bridges the CSS-only bot-variant pattern (a group of textareas
   inside .entry-textareas, with CSS showing one based on a radio).
   The original default text of each variant is snapshotted on
   load — that's the "template". Whatever the user types BEYOND
   the template is the "human addition". When the user switches
   the bot, we:
     1. read the now-hidden previous-visible textarea,
     2. extract `human = current.value with template subtracted`,
     3. write to the now-visible textarea: `its template + human`.

   The new visible textarea ends up = its own template phrase
   (in the new bot's voice) + everything the human had typed
   around it. Nothing the human added is ever discarded.
   ============================================================ */
(() => {
  'use strict';

  const tplOf = new WeakMap();      // textarea → original template
  const lastVis = new WeakMap();    // .entry-textareas → previously-visible textarea

  function isVisible(el){
    return !!(el && el.offsetParent !== null);
  }
  function snapshotTemplates(){
    document.querySelectorAll('.entry-textareas .entry-textarea').forEach(ta => {
      if (!tplOf.has(ta)) tplOf.set(ta, ta.value || '');
    });
  }
  function visibleIn(group){
    return [...group.querySelectorAll('.entry-textarea')].find(isVisible) || null;
  }
  // Human addition = current value with the template's first occurrence removed.
  // If the template was wiped entirely by the user, treat the whole value as
  // human content (they rewrote everything).
  function humanDiff(ta){
    const tpl = tplOf.get(ta) || '';
    const val = ta.value || '';
    if (!tpl) return val.trim();
    if (val === tpl) return '';
    const i = val.indexOf(tpl);
    if (i === -1) return val.trim();
    const left  = val.slice(0, i).replace(/\s+$/, '');
    const right = val.slice(i + tpl.length).replace(/^\s+/, '');
    return (left + (left && right ? ' ' : '') + right).trim();
  }
  // Merge a new template with the human addition. The user wants the bot
  // suggestion to start on the SECOND row, so the human's text stays on
  // top and the bot phrase appears below it. Only ONE bot phrase is ever
  // kept — we don't accumulate stacked templates.
  function mergeTpl(tpl, human){
    tpl = String(tpl || '').trim();
    human = String(human || '').trim();
    if (!human) return tpl;
    if (!tpl) return human;
    // Don't duplicate if the human content already contains the template.
    if (human.indexOf(tpl) !== -1) return human;
    return human + '\n' + tpl;
  }

  // Track the visible textarea per group so we can read it AFTER a CSS swap.
  function syncLastVis(){
    document.querySelectorAll('.entry-textareas').forEach(group => {
      const vis = visibleIn(group);
      if (vis) lastVis.set(group, vis);
    });
  }

  // On any bot-related radio change (bot-choice-N, bot-N-phrase, etc.),
  // run the swap pipeline so the human's typed text follows the switch.
  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (!t || !t.name || !/^bot-/.test(t.name)) return;
    const field = t.closest('.entry-field') || document;
    const groups = field.querySelectorAll('.entry-textareas');
    // Wait one frame so the CSS :has(...) rules flip visibility.
    requestAnimationFrame(() => {
      groups.forEach(group => {
        const prev = lastVis.get(group);
        const next = visibleIn(group);
        if (!next) return;
        if (!prev || prev === next){ lastVis.set(group, next); return; }
        const human = humanDiff(prev);
        const nextTpl = tplOf.get(next) || '';
        if (human){
          next.value = mergeTpl(nextTpl, human);
          next.dispatchEvent(new Event('input', { bubbles: true }));
          // Reset prev to its template so only the active variant carries
          // the human's content. Keeps "which variant is active?" answerable
          // for the resume / magic gatherers when the step is hidden.
          const prevTpl = tplOf.get(prev);
          if (prevTpl != null){
            prev.value = prevTpl;
            prev.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        lastVis.set(group, next);
      });
    });
  }, true);

  // Track lastVis continuously: any focus or input on a variant marks it
  // as the group's current "active" textarea. This catches fields like
  // .entry-field--dup that aren't visible at init time (the entry-more
  // "+" hadn't been clicked yet), so the very first bot pick still
  // finds the human's content and merges it.
  document.addEventListener('focusin', (ev) => {
    const ta = ev.target && ev.target.matches && ev.target.matches('.entry-textareas .entry-textarea') ? ev.target : null;
    if (!ta) return;
    const group = ta.closest('.entry-textareas');
    if (group) lastVis.set(group, ta);
  }, true);
  document.addEventListener('input', (ev) => {
    const ta = ev.target && ev.target.matches && ev.target.matches('.entry-textareas .entry-textarea') ? ev.target : null;
    if (!ta) return;
    const group = ta.closest('.entry-textareas');
    if (group) lastVis.set(group, ta);
  }, true);

  function init(){
    snapshotTemplates();
    syncLastVis();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.flove = Object.assign(window.flove || {}, {
    botSwap: { humanDiff, mergeTpl, snapshotTemplates },
  });
})();

/* ============================================================
   flove.magic · 5-cycle re-telling of the resume phrase
   ============================================================
   The Summary's ✨ Magic button (.magic-btn-summary, label-for
   #magic-toggle) now does two things:
     1. First click — checks the magic-toggle (CSS swaps the
        visible clause to .clause-magic) and renders cycle 0.
     2. Subsequent clicks — prevent the toggle from flipping
        back off, and cycle through 5 prepositional re-tellings
        (0 → 1 → 2 → 3 → 4 → 0…) of the same data: the active
        main-phrase text + the rater clicks.

   The cycle templates introduce the items with different
   prepositions each round (In / Through / Among / Within /
   Beyond …) so each click feels like a fresh angle.

   A second "Phrase" button is injected next to ✨ Magic only
   when the magic-toggle is on; clicking it unchecks the toggle
   (returning to the default view) and removes itself.
   ============================================================ */
(() => {
  'use strict';

  const escHtml = s => String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const escMultiline = s => escHtml(s).replace(/\n/g, '<br>');

  // 5 cycles — each is a 12-slot preposition pool. Clicking ✨ Magic
  // walks 0 → 1 → 2 → 3 → 4 → 0 …; on each press the items (every
  // non-empty field text + every clicked rater sub-emoji) are mapped
  // 1-to-1 onto the cycle's pool, so each item gets its own preposition
  // and the whole sentence reads differently every click. The pool wraps
  // if more than 12 items are present.
  const MAGIC_CYCLES = [
    ['In',      'beside',  'with',   'for',     'by',      'through','within', 'amidst',  'against','beneath','before', 'past'],
    ['Through', 'around',  'beneath','amidst',  'amongst', 'behind', 'before', 'above',   'between','over',   'across', 'within'],
    ['Among',   'over',    'across', 'beyond',  'around',  'before', 'between','through', 'beneath','beside', 'over',   'under'],
    ['Within',  'after',   'before', 'beneath', 'above',   'against','past',   'across',  'around', 'amidst', 'between','beside'],
    ['Beyond',  'still',   'upon',   'over',    'under',   'across', 'beside', 'amidst',  'behind', 'within', 'around', 'through'],
  ];
  // Read the active textarea of every field group on the page. Mirrors
  // the helper in the phrase renderer.
  function gatherFieldTexts(){
    const root = rootOf();
    const out = [];
    const seen = new Set();
    root.querySelectorAll('.entry-textareas').forEach(group => {
      const variants = [...group.querySelectorAll('.entry-textarea')];
      // Use the variant CSS is currently SHOWING — test its own computed
      // `display` so it resolves even when the step panel is hidden. This
      // tracks the live bot / subbot choice instead of freezing on the
      // first subbot the user ever picked.
      let active = variants.find(v => {
        const cs = getComputedStyle(v);
        return cs && cs.display !== 'none';
      });
      // Fallback — nothing resolved as shown: any variant with a value.
      if (!active) active = variants.find(v => (v.value || '').trim());
      if (!active) return;
      const v = (active.value || '').trim();
      if (!v || seen.has(v)) return;
      seen.add(v);
      out.push(v);
    });
    return out;
  }
  function gatherItems(){
    const items = gatherFieldTexts().map(text => ({ text }));
    [...readRater(''), ...readRater('-extra')]
      .filter(r => r.n > 0)
      .forEach(r => items.push({ text: r.emoji.repeat(Math.min(5, r.n)) }));
    return items;
  }
  // Deterministic shuffle keyed by the cycle index — so each magic cycle
  // gives a different (but stable) interleaving of texts and rater
  // emojis, instead of always listing all texts first and all emojis
  // last.
  function shuffleSeeded(arr, seed){
    const out = arr.slice();
    let s = (seed * 2654435761) >>> 0;
    for (let i = out.length - 1; i > 0; i--){
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function magickedFor(idx){
    const items = shuffleSeeded(gatherItems(), idx + 1);
    if (!items.length) return '';
    const pool = MAGIC_CYCLES[idx % MAGIC_CYCLES.length];
    const parts = items.map((it, i) => {
      const prep = pool[i % pool.length];
      const w = i === 0 ? prep.charAt(0).toUpperCase() + prep.slice(1) : prep;
      return `${w} ${it.text}`;
    });
    return parts.join(' ') + '.';
  }

  let magicIndex = -1;

  function rootOf(){
    return document.querySelector('[data-flove-root]') || document.body;
  }
  function magicToggle(){ return document.getElementById('magic-toggle'); }
  function magicEl(){ return rootOf().querySelector('.clause-magic'); }
  function magicBtn(){ return rootOf().querySelector('.magic-btn-summary'); }

  // Read a rater scope ('' for main, '-extra' for the entry-row--extra
  // independent rater). Mirrors the helper in the resume phrase IIFE.
  function readRater(suffix){
    suffix = suffix || '';
    const get = name => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      if (!el || !el.id) return 0;
      const m = el.id.match(/-(\d+)$/);
      return m ? Number(m[1]) : 0;
    };
    const emo = suffix === '-extra'
      ? { h: '🪞', f: '🌟', l: '🤝', t: '🕯' }
      : { h: '😊', f: '😆', l: '👏', t: '🤔' };
    return [
      { emoji: emo.h, n: get('rate-h' + suffix) },
      { emoji: emo.f, n: get('rate-f' + suffix) },
      { emoji: emo.l, n: get('rate-l' + suffix) },
      { emoji: emo.t, n: get('rate-t' + suffix) },
    ];
  }

  function renderMagic(){
    const el = magicEl();
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.dataset.floveUserEdited === 'true') return;
    const idx = Math.max(0, magicIndex) % MAGIC_CYCLES.length;
    const text = magickedFor(idx);
    if (!text){
      if (el.dataset.floveRendered === 'true') el.innerHTML = '';
      return;
    }
    el.innerHTML = `<div class="flove-phrase-text">${escMultiline(text)}</div>`;
    el.dataset.floveRendered = 'true';
    el.dataset.floveMagicIndex = String(idx);
  }

  function ensurePhraseButton(){
    if (document.getElementById('flove-phrase-btn')) return;
    const btn = magicBtn();
    if (!btn) return;
    const ph = document.createElement('button');
    ph.id = 'flove-phrase-btn';
    ph.type = 'button';
    ph.className = 'btn ghost flove-phrase-btn';
    ph.title = 'Back to the original phrase';
    ph.innerHTML = '<span class="t-en">Phrase</span><span class="t-es">Frase</span>';
    ph.addEventListener('click', (ev) => {
      ev.preventDefault();
      const t = magicToggle();
      if (!t) return;
      t.checked = false;
      t.dispatchEvent(new Event('change', { bubbles: true }));
    });
    btn.insertAdjacentElement('afterend', ph);
  }
  function removePhraseButton(){
    document.getElementById('flove-phrase-btn')?.remove();
  }

  function onMagicBtnClick(ev){
    const t = magicToggle();
    if (!t) return;
    if (t.checked){
      // Already on — cycle, don't flip the toggle off.
      ev.preventDefault();
      magicIndex = (magicIndex + 1) % MAGIC_CYCLES.length;
      renderMagic();
    } else {
      // First click — let the label toggle the checkbox; once it flips,
      // the change handler below will render version 0 and add the
      // Phrase button.
      magicIndex = 0;
    }
  }

  function onMagicToggleChange(){
    const t = magicToggle();
    if (!t) return;
    if (t.checked){
      if (magicIndex < 0) magicIndex = 0;
      renderMagic();
      ensurePhraseButton();
    } else {
      magicIndex = -1;
      removePhraseButton();
    }
  }

  // Keep the magic clause fresh when the source data (text or rater)
  // changes while magic is on.
  function onSourceChange(){
    const t = magicToggle();
    if (t && t.checked) renderMagic();
  }

  function init(){
    const btn = magicBtn();
    if (btn && !btn._floveMagicBound){
      btn._floveMagicBound = true;
      btn.addEventListener('click', onMagicBtnClick);
    }
    const t = magicToggle();
    if (t && !t._floveMagicBound){
      t._floveMagicBound = true;
      t.addEventListener('change', onMagicToggleChange);
    }
    // Source data (rater radios + view radios + bot toggles + main
    // textareas) lives partly OUTSIDE [data-flove-root], so we listen
    // on document to catch every bubble path.
    if (!document._floveMagicSourceBound){
      document._floveMagicSourceBound = true;
      document.addEventListener('input',  onSourceChange);
      document.addEventListener('change', onSourceChange);
    }
    // If the toggle was already checked (e.g. saved state), wire up.
    if (t && t.checked){ ensurePhraseButton(); renderMagic(); }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.flove = Object.assign(window.flove || {}, {
    magic: {
      cycle: () => { magicIndex = (magicIndex + 1) % MAGIC_CYCLES.length; renderMagic(); },
      reset: () => { magicIndex = -1; renderMagic(); },
      render: renderMagic,
      cycles: MAGIC_CYCLES,
    },
  });
})();

/* ============================================================
   flove.magicArms · ✦ button "has bot text" flag
   ============================================================
   The ✦ button is a pure expand/collapse toggle for a field's
   bot-arms panel — handled entirely in CSS via the #magic-open-*
   checkboxes. It never picks a bot and never edits the textarea.

   This module's only job: add/remove `.has-bot-text` on each
   .entry-field so CSS can keep the ✦ "lightly filled" once the
   panel is collapsed — but ONLY while the field's textarea truly
   still holds bot-sourced text. Clear that text by hand and the
   flag (and the fill) drop back to the plain default.
   ============================================================ */
(() => {
  'use strict';

  // Bot phrases of a field = the HTML-authored default text of every
  // variant that isn't the empty `--default` one. A field "has bot text"
  // when its currently-shown textarea still contains one of them.
  function botPhrases(field){
    const out = [];
    field.querySelectorAll('.entry-textarea').forEach(v => {
      if (v.classList.contains('entry-textarea--default')) return;
      const tpl = (v.defaultValue || '').trim();
      if (tpl) out.push(tpl);
    });
    return out;
  }
  // The variant CSS is currently showing — its own computed display is
  // not 'none' (resolves even while the field's step panel is hidden).
  function activeVariant(field){
    return [...field.querySelectorAll('.entry-textarea')]
      .find(v => getComputedStyle(v).display !== 'none') || null;
  }
  function fieldHasBotText(field){
    const active = activeVariant(field);
    if (!active) return false;
    const val = (active.value || '').trim();
    if (!val) return false;
    return botPhrases(field).some(tpl => val.indexOf(tpl) !== -1);
  }
  function refresh(){
    document.querySelectorAll('.entry-field').forEach(field => {
      field.classList.toggle('has-bot-text', fieldHasBotText(field));
    });
  }

  let t = 0;
  function schedule(){ clearTimeout(t); t = setTimeout(refresh, 80); }

  if (!document._floveMagicArmsBound){
    document._floveMagicArmsBound = true;
    // Catch both direct typing and the bot-swap module's synthetic
    // input events, plus radio changes (bot picked / cleared).
    document.addEventListener('input',  schedule);
    document.addEventListener('change', schedule);
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', refresh, { once: true });
  } else {
    refresh();
  }

  window.flove = Object.assign(window.flove || {}, {
    magicArms: { refresh },
  });
})();


/* ============================================================
   flove.counters · floating Clicks / Selections / Stars arcade chips
   ============================================================
   Markup contract — `.float-counters` block (bottom-left, fixed)
   contains 3 `.pc` chips: `#chipClicks`, `#chipSelections`, `#chipStars`,
   each with a `.pc-num` inside (`#pointsClicks`, etc.). Chips carry
   `.is-empty` until they hold at least one point.

   Counting rules (per Marc 2026-05-23):
   • Clicks      → +1 on every click anywhere in the page (cumulative).
   • Selections  → live count of currently selected:
       hearts (rater-show-*) + emojis (rate-*) + labelers (topbar-labeler)
       + wizards (wizard-choice-*) + non-empty textareas.
   • Stars       → live count of non-empty textareas (typed OR wizard-injected).

   API on window.flove.counters:
   • refresh()    — recompute and repaint
   • clicks / selections / stars — getters
   • addClick()   — manual hook to bump clicks
   ============================================================ */
(function() {
  function $$(sel) { return [...document.querySelectorAll(sel)]; }
  let clicks = 0;

  function visibleTextWritten(t) {
    return t.offsetParent !== null && t.value && t.value.trim();
  }
  function countSelections() {
    let n = 0;
    n += $$('input[id^="rater-show-"]:checked').length;
    n += $$('input[name^="rate-"]:checked:not([id$="-0"])').length;
    n += $$('input[name="topbar-labeler"]:checked:not(#topbar-labeler-none)').length;
    n += $$('input[name^="wizard-choice-"]:checked:not([id*="-none"])').length;
    n += $$('textarea').filter(visibleTextWritten).length;
    return n;
  }
  function countStars() {
    return $$('textarea').filter(visibleTextWritten).length;
  }
  function paint(chipId, numId, pts, growthMax) {
    var chip = document.getElementById(chipId);
    var num  = document.getElementById(numId);
    if (!chip || !num) return;
    num.textContent = pts;
    chip.classList.toggle('is-empty', pts === 0);
    chip.style.setProperty('--col', Math.min(pts / growthMax, 1).toFixed(3));
  }
  function pulse(chipId) {
    var chip = document.getElementById(chipId);
    if (!chip) return;
    chip.classList.remove('pulse');
    void chip.offsetWidth;
    chip.classList.add('pulse');
  }
  /* Gated tier-pop — unlock thresholds per Marc 2026-05-23:
     advanced needs clicks ≥ 20, selections ≥ 10, stars ≥ 2.
     super is locked indefinitely until thresholds are defined. */
  const UNLOCK = {
    advanced: { href: 'blogyadvanced.html', clicks: 20, selections: 10, stars: 2 },
  };
  const unlocked = {};
  function checkUnlocks() {
    Object.keys(UNLOCK).forEach(function(tier){
      if (unlocked[tier]) return;
      var t = UNLOCK[tier];
      if (clicks >= t.clicks && countSelections() >= t.selections && countStars() >= t.stars) {
        unlocked[tier] = true;
        var step = document.querySelector('.tier-pop-step[href$="' + t.href + '"]');
        if (step) step.classList.add('is-unlocked');
      }
    });
  }
  /* Show level-progress message anchored below the Download button on
     click — celebratory if thresholds met, encouraging otherwise. */
  function showDlMessage(text, anchor) {
    var toast = document.getElementById('unlockToast');
    if (!toast) return;
    toast.textContent = text;
    toast.style.position = 'fixed';
    toast.style.bottom = 'auto';
    var btn = anchor || document.querySelector('.dl-btn');
    var rect = btn && btn.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      var top = rect.bottom + 8;
      if (top + 50 > window.innerHeight) top = Math.max(8, rect.top - 50);
      var left = Math.max(8, Math.min(rect.left, window.innerWidth - 320));
      toast.style.left = left + 'px';
      toast.style.top  = Math.max(8, top) + 'px';
    } else {
      toast.style.left = '18px';
      toast.style.top  = 'auto';
      toast.style.bottom = '290px';
    }
    toast.classList.add('is-on');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function(){ toast.classList.remove('is-on'); }, 5000);
  }
  document.addEventListener('click', function(e){
    var btn = e.target.closest && e.target.closest('.dl-btn');
    if (!btn) return;
    var canGo = (clicks >= UNLOCK.advanced.clicks
              && countSelections() >= UNLOCK.advanced.selections
              && countStars() >= UNLOCK.advanced.stars);
    showDlMessage(canGo
      ? '🎉 You can now go to the next Level.'
      : 'Increase your counters to get to the next Level', btn);
  });

  /* Intercept click on an unlocked WIP tier-pop-step → open the tier
     destination in an iframe overlay (proof of concept until that tier
     ships real content). */
  function openTierIframe(href) {
    var overlay = document.getElementById('tierIframeOverlay');
    if (!overlay) return;
    var frame = overlay.querySelector('.tier-iframe-frame');
    if (frame) frame.src = href;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeTierIframe() {
    var overlay = document.getElementById('tierIframeOverlay');
    if (!overlay) return;
    overlay.hidden = true;
    var frame = overlay.querySelector('.tier-iframe-frame');
    if (frame) frame.src = '';
    document.body.style.overflow = '';
  }
  document.addEventListener('click', function(e){
    if (!e.target.closest) return;
    var step = e.target.closest('.tier-pop-step--wip.is-unlocked');
    if (step) {
      e.preventDefault();
      openTierIframe(step.getAttribute('href'));
      return;
    }
    if (e.target.closest('.tier-iframe-close') || e.target.matches && e.target.matches('.tier-iframe-backdrop')) {
      closeTierIframe();
    }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeTierIframe();
  });
  function refresh() {
    paint('chipClicks',     'pointsClicks',     clicks,            100);
    paint('chipSelections', 'pointsSelections', countSelections(), 100);
    paint('chipStars',      'pointsStars',      countStars(),      5);
    checkUnlocks();
  }

  document.addEventListener('click', function(){ clicks++; pulse('chipClicks'); refresh(); });
  document.addEventListener('change', refresh);
  document.addEventListener('input', function(e){
    if (e.target && e.target.tagName === 'TEXTAREA') refresh();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh, { once: true });
  } else {
    refresh();
  }

  window.flove = Object.assign(window.flove || {}, {
    counters: {
      refresh: refresh,
      get clicks()     { return clicks; },
      get selections() { return countSelections(); },
      get stars()      { return countStars(); },
      addClick: function(){ clicks++; pulse('chipClicks'); refresh(); },
    },
  });
})();

/* ============================================================
   flove.wizard · inject / clear bot text without losing user typing
   ============================================================
   Per-element state held in a WeakMap. inject() either swaps the
   previous bot insertion in place or appends after the user's text.
   clear() removes only the bot block — leading/trailing user text
   (and any text typed between insertions) is preserved.

   API
     flove.wizard.inject(el, text)
     flove.wizard.clear(el)
     flove.wizard.current(el)

   Both inject() and clear() dispatch an "input" event so any
   change/refresh listener on the form picks the new value up.
   ============================================================ */
(() => {
  'use strict';
  const state = new WeakMap();

  function inject(el, text){
    if (!el || text == null) return;
    const oldText = state.get(el);
    let val = el.value || "";
    if (oldText && val.indexOf(oldText) !== -1){
      val = val.replace(oldText, text);
    } else {
      const trimmed = val.replace(/\s+$/, "");
      val = (trimmed ? trimmed + " " : "") + text;
    }
    el.value = val;
    state.set(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function clear(el){
    if (!el) return;
    const oldText = state.get(el);
    if (oldText && el.value && el.value.indexOf(oldText) !== -1){
      const i = el.value.indexOf(oldText);
      const before = el.value.slice(0, i);
      const after  = el.value.slice(i + oldText.length);
      let seam = "";
      if (/\s$/.test(before) && /^\s/.test(after)) seam = " ";
      el.value = before.replace(/\s+$/, "") + seam + after.replace(/^\s+/, "");
    }
    state.delete(el);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function current(el){
    return el ? state.get(el) : undefined;
  }

  window.flove = Object.assign(window.flove || {}, {
    wizard: { inject, clear, current },
  });
})();

/* ============================================================
   flove.wizard auto-wirer for the blogy "wizard-arm" pattern
   ============================================================
   Activates on pages whose entry fields use the legacy markup:

     .entry-field
       .entry-textareas
         textarea.entry-textarea--default   ← user-writable
         textarea.entry-textarea--magic     ← bot text source
         textarea.entry-textarea--lovely(-N)
         textarea.entry-textarea--joy(-N)
         textarea.entry-textarea--wisdom(-N)
       .wizard-arms
         label.wizard-arm[for="wizard-choice-<scope>-<variant>"]
         label.wizard-arm[for="wizard-main-p-<LJW><N>"]
         label.wizard-arm--clear[for="wizard-choice-<scope>-none"]
         label.wizard-arm--clear[for="wizard-main-p-0"]
         label.wizard-arm--more[for="new-wizard-modal"]   ← skipped

   On a click, the arm's `for=` tells which variant textarea to read.
   The text is injected into the field's `--default` textarea via
   flove.wizard.inject (or cleared via .clear). The radios still
   toggle for any CSS state that depends on them, but the variant
   textareas are hidden via the host page's stylesheet.
   ============================================================ */
(() => {
  'use strict';

  function variantInfo(forId){
    if (!forId) return null;
    if (forId === 'wizard-main-p-0') return { clear: true };
    if (/^wizard-choice-(?:main|extra|alternative|note)-none$/.test(forId)) return { clear: true };

    let m = forId.match(/^wizard-choice-(?:main|extra|alternative|note)-(magic|lovely|joy|wisdom)$/);
    if (m) return { variant: m[1] };

    m = forId.match(/^wizard-main-p-([LJW])([1-5])$/);
    if (m){
      const bot = { L: 'lovely', J: 'joy', W: 'wisdom' }[m[1]];
      return { variant: bot, index: parseInt(m[2], 10) };
    }
    return null;
  }

  function findVariantText(field, info){
    if (!field || !info) return '';
    const cls = info.index
      ? `entry-textarea--${info.variant}-${info.index}`
      : `entry-textarea--${info.variant}`;
    const ta = field.querySelector('.' + cls);
    return ta ? (ta.value || '') : '';
  }

  function defaultTextareaFor(field){
    return field ? field.querySelector('.entry-textarea--default') : null;
  }

  document.addEventListener('click', (ev) => {
    const arm = ev.target.closest('.wizard-arm');
    if (!arm) return;
    if (arm.classList.contains('wizard-arm--more')) return;
    const forId = arm.getAttribute('for');
    const info  = variantInfo(forId);
    if (!info) return;
    const field = arm.closest('.entry-field');
    const ta    = defaultTextareaFor(field);
    if (!ta) return;
    if (info.clear){
      window.flove.wizard.clear(ta);
    } else {
      const text = findVariantText(field, info).trim();
      if (text) window.flove.wizard.inject(ta, text);
    }
  }, true);
})();
