// ✺ flove-shell.js · feature center for flove apps
// ----------------------------------------------------------------
// Single import every page needs:
//   <script type="module">
//     import { floveShell } from './flove-shell.js';
//     floveShell();
//   </script>
//
// What the shell does, automatically, for every <form data-flove-app>:
//
//   1. Per-textarea controls
//        🎙  voice (Web Speech API → append transcript)
//        ➕  add-another (numbered or array, per data-flove-multi)
//
//   2. Live legible phrase block, below the form, updated on input.
//
//   3. Six-button action bar attached to the phrase:
//        📋 copy · 📤 share · 🪄 magic · 💡 insight · ✺ publish · 📁 format
//
//   4. Dialogs:
//        insight (config-or-default), publish (multi-select), format (menu)
// ----------------------------------------------------------------

import { floveIO }            from './flove-io.js';
import { phraseOf, magicPhrase } from './flove-phrase.js';
import { loadRouting,
         previewSync,
         formatDestinations } from './flove-routing.js';
import { openInsight,
         clearStoredConfig as clearInsightConfig } from './flove-insight.js';

export const SHELL_VERSION = 3;

// Field types that get cloning (➕). Voice (🎙) is added only to TEXT_TYPES.
const CLONEABLE_TYPES = new Set([
  'text', 'search', 'email', 'url', 'tel', 'number',
  'date', 'time', 'datetime-local', 'month', 'week',
  'file',
]);
const TEXT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel']);

// Singletons by nature — never offer ➕ regardless of data-flove-multi.
const CORE_FIELD_NAMES = new Set([
  'username', 'user', 'login', 'handle',
  'password', 'pass', 'pwd', 'passphrase',
  'token', 'apikey', 'api_key', 'secret',
]);

const FIELD_SELECTOR = [
  'textarea',
  'input:not([type])',
  ...[...CLONEABLE_TYPES].map(t => `input[type="${t}"]`),
  'select',
].join(',');

const PUBLISH_STORE  = 'flove.publish.platforms';
const FILTER_STORE   = (app) => `flove.filter.${app}`;

export function floveShell(opts = {}) {
  const config = {
    publisher: null,
    draft:     'indexeddb',
    routingUrl: './routing.json',
    insight:   null,    // { url, headers, prompt } — if null, dialog opens
    magic:     {},      // { prepositions: { es: [...], en: [...] } }
    ...opts,
  };

  const io = floveIO({
    publisher: config.publisher,
    draft:     config.draft,
    onEmit:    () => {},
  });

  ready(() => {
    document.documentElement.setAttribute('data-flove-distro', `shell:${SHELL_VERSION}`);
    loadRouting(config.routingUrl);

    enhanceHeader(config);

    const forms = document.querySelectorAll('form[data-flove-app]');
    for (const form of forms) wireForm(form, io, config);
  });
}

function ready(cb) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cb, { once: true });
  } else cb();
}

// ============================================================
// per-form wiring
// ============================================================

function wireForm(form, io, config) {
  io.attach(form, { bar: false });

  // 1. enhance text fields (apps that own their field UX can opt out
  //    via data-flove-enhance="off" — the phrase card + 6-button bar
  //    still render, only per-field voice/add buttons are skipped).
  if (form.dataset.floveEnhance !== 'off') enhanceFields(form);

  // 2. insert phrase + action bar — into [data-flove-card-target] if
  //    the app declared one, otherwise as a sibling right after the form.
  const card   = renderPhraseCard(form);
  const target = form.querySelector('[data-flove-card-target]');
  if (target) target.appendChild(card);
  else        form.insertAdjacentElement('afterend', card);

  // 3. bind buttons
  const state = { magicOn: false, lastFormat: null };
  for (const btn of card.querySelectorAll('[data-action]')) {
    btn.addEventListener('click', ev => onAction(ev, btn.dataset.action, form, io, card, state, config));
  }

  // 4. live update
  const refresh = () => updatePhrase(card, io.snapshot(form), state);
  form.addEventListener('input',  refresh);
  form.addEventListener('change', refresh);
  refresh();
}

// ============================================================
// 0 · header — back · logo-reload · categories · menu
// ============================================================

function enhanceHeader(config) {
  const bar = document.querySelector('.flove-bar');
  if (!bar) return;
  bar.classList.add('flove-bar--enhanced');

  // 1. Logo click → reload (preserves draft because drafts are in IDB).
  for (const logo of bar.querySelectorAll('.flove-mark, .flove-asterism')) {
    if (logo.dataset.floveBound) continue;
    logo.dataset.floveBound = '1';
    logo.style.cursor = 'pointer';
    logo.setAttribute('role', 'button');
    logo.setAttribute('aria-label', 'reload');
    logo.addEventListener('click', () => location.reload());
  }

  // 2. Categories at center.
  const cats = readCategories();
  const appName = currentAppName();
  if (cats.length) injectCategoryChips(bar, cats, appName);

  // 3. Menu on the right.
  injectMenu(bar, appName, config);
}

function currentAppName() {
  return document.documentElement.dataset.floveApp
      || document.querySelector('form[data-flove-app]')?.dataset.floveApp
      || 'flove';
}

function readCategories() {
  const meta = document.querySelector('meta[name="flove-categories"]');
  if (meta?.content) return splitList(meta.content);
  const root = document.documentElement.dataset.floveCategories
            || document.querySelector('[data-flove-categories]')?.dataset.floveCategories;
  return root ? splitList(root) : [];
}

function splitList(s) {
  return s.split(/[,;\n]/).map(x => x.trim()).filter(Boolean);
}

function injectCategoryChips(bar, cats, appName) {
  // The bar layout is: [back] [logo] [name] [spacer?] ... we slot the
  // categories before the trailing spacer/menu. If no spacer, append.
  const group = document.createElement('div');
  group.className = 'flove-categories';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'category filters');

  const active = new Set(loadActiveCategories(appName));
  for (const c of cats) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'flove-cat-chip';
    btn.dataset.cat = c;
    btn.textContent = c;
    if (active.has(c)) btn.classList.add('is-active');
    btn.setAttribute('aria-pressed', String(active.has(c)));
    btn.addEventListener('click', () => {
      if (active.has(c)) active.delete(c); else active.add(c);
      btn.classList.toggle('is-active');
      btn.setAttribute('aria-pressed', String(active.has(c)));
      saveActiveCategories(appName, [...active]);
      document.dispatchEvent(new CustomEvent('flove:filter', {
        detail: { categories: [...active] },
      }));
    });
    group.appendChild(btn);
  }
  // Insert before the existing spacer if any, so left of the menu.
  const spacer = bar.querySelector('.flove-spacer');
  if (spacer) bar.insertBefore(group, spacer); else bar.appendChild(group);
}

function loadActiveCategories(appName) {
  try { return JSON.parse(localStorage.getItem(FILTER_STORE(appName)) || '[]'); }
  catch { return []; }
}
function saveActiveCategories(appName, list) {
  try { localStorage.setItem(FILTER_STORE(appName), JSON.stringify(list)); } catch {}
}

function injectMenu(bar, appName, config) {
  if (!bar.querySelector('.flove-spacer')) {
    const sp = document.createElement('span');
    sp.className = 'flove-spacer';
    bar.appendChild(sp);
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'flove-menu-btn';
  btn.setAttribute('aria-haspopup', 'true');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'menu');
  btn.textContent = '☰';
  bar.appendChild(btn);

  const dd = document.createElement('div');
  dd.className = 'flove-menu';
  dd.hidden = true;
  dd.innerHTML = `
    <section class="flove-menu__section">
      <h4 class="flove-menu__title">flove</h4>
      <button type="button" class="flove-menu__item" data-act="drafts">📂 my drafts</button>
      <button type="button" class="flove-menu__item" data-act="insight">💡 insight provider</button>
      <button type="button" class="flove-menu__item" data-act="platforms">✺ publish platforms</button>
      <button type="button" class="flove-menu__item" data-act="reload">↻ reload</button>
      <a class="flove-menu__item" href="index.html">🏠 all apps</a>
    </section>
    <section class="flove-menu__section flove-menu__section--custom" data-flove-menu-target>
      <h4 class="flove-menu__title">${escapeHtml(appName)}</h4>
    </section>
  `;
  document.body.appendChild(dd);

  // Move app-declared custom items into the custom section.
  const customSlots = document.querySelectorAll('[data-flove-menu="custom"]');
  const target = dd.querySelector('[data-flove-menu-target]');
  for (const slot of customSlots) {
    while (slot.firstChild) target.appendChild(slot.firstChild);
    slot.remove();
  }
  // If nothing custom got appended (only the title), drop the section.
  if (target.children.length <= 1) target.remove();

  function position() {
    const r = btn.getBoundingClientRect();
    dd.style.position = 'fixed';
    dd.style.right = `${Math.max(8, window.innerWidth - r.right)}px`;
    dd.style.top   = `${r.bottom + 6}px`;
  }
  function open() {
    position();
    dd.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    setTimeout(() => document.addEventListener('click', onOutside, { once: true }), 0);
  }
  function close() {
    dd.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }
  function onOutside(ev) {
    if (dd.contains(ev.target) || btn.contains(ev.target)) {
      // re-arm; menu items handle their own close
      setTimeout(() => document.addEventListener('click', onOutside, { once: true }), 0);
      return;
    }
    close();
  }
  btn.addEventListener('click', () => dd.hidden ? open() : close());
  window.addEventListener('resize', () => { if (!dd.hidden) position(); });

  dd.addEventListener('click', async ev => {
    const act = ev.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    close();
    try {
      switch (act) {
        case 'reload':    location.reload(); break;
        case 'drafts':    await openDraftsModal(appName); break;
        case 'insight':   await reconfigureInsight(); break;
        case 'platforms': await openPlatformsManager(); break;
      }
    } catch (err) {
      toast(`✗ ${act} failed: ${err.message}`);
    }
  });
}

function reconfigureInsight() {
  clearInsightConfig();
  toast('✺ insight config cleared · open dialog with the 💡 button');
}

function openPlatformsManager() {
  const customs = loadCustomPlatformsList().map(p => ({ ...p, kind: p.kind || 'webhook' }));
  return openPublishDialog(customs, null, { manageOnly: true });
}
function loadCustomPlatformsList() {
  try { return JSON.parse(localStorage.getItem(PUBLISH_STORE) || '[]'); }
  catch { return []; }
}

// ============================================================
// drafts modal — list IndexedDB drafts, load or delete
// ============================================================

function openDraftsModal(appName) {
  return new Promise(resolve => {
    const dlg = document.createElement('div');
    dlg.className = 'flove-modal';
    dlg.innerHTML = `
      <div class="flove-modal__backdrop"></div>
      <div class="flove-modal__panel" role="dialog" aria-label="drafts">
        <h3 class="flove-modal__title">📂 drafts</h3>
        <p class="flove-modal__lede">All flove drafts on this device. Loading drops the values back into the form.</p>
        <ul class="flove-publish-list" data-list></ul>
        <div class="flove-modal__row">
          <button type="button" data-act="close" class="flove-btn flove-btn--ghost">close</button>
        </div>
      </div>
    `;
    document.body.appendChild(dlg);
    const list = dlg.querySelector('[data-list]');
    const close = () => { dlg.remove(); resolve(); };

    listAllDrafts().then(drafts => {
      drafts.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
      if (drafts.length === 0) {
        list.innerHTML = `<li class="flove-publish-row">no drafts saved yet</li>`;
        return;
      }
      drafts.forEach(d => {
        const li = document.createElement('li');
        li.className = 'flove-publish-row';
        const isApp = d.app === appName ? '' : ' · other app';
        li.innerHTML = `
          <label>
            <strong>${escapeHtml(d.app)}/${escapeHtml(d.type)}</strong>
            <span class="flove-publish-kind">${escapeHtml((d.updated_at || '').slice(0,10))}${isApp}</span>
          </label>
          <span>
            <button type="button" class="flove-field-btn" data-load="${escapeHtml(d.id)}" title="load">↩</button>
            <button type="button" class="flove-field-btn" data-rm="${escapeHtml(d.id)}"   title="delete">✕</button>
          </span>
        `;
        list.appendChild(li);
      });
    });

    list.addEventListener('click', async ev => {
      const t = ev.target.closest('[data-load], [data-rm]');
      if (!t) return;
      const id = t.dataset.load || t.dataset.rm;
      const action = t.dataset.load ? 'load' : 'delete';
      if (action === 'delete') {
        await deleteDraft(id);
        t.closest('li')?.remove();
        toast('✺ draft deleted');
      } else {
        const draft = await getDraft(id);
        if (!draft) return;
        if (draft.app !== appName) {
          toast('✺ draft is for another app — open that app first');
          return;
        }
        applyDraftToForm(draft);
        toast('✺ draft loaded');
        close();
      }
    });

    dlg.querySelector('[data-act=close]').onclick = close;
    dlg.querySelector('.flove-modal__backdrop').onclick = close;
  });
}

function applyDraftToForm(draft) {
  const form = document.querySelector(`form[data-flove-app="${CSS.escape(draft.app)}"]`);
  if (!form) return;
  for (const [k, v] of Object.entries(draft.fields || {})) {
    const field = form.querySelector(`[name="${CSS.escape(k)}"], [name="${CSS.escape(k)}[]"]`);
    if (!field) continue;
    if (Array.isArray(v)) field.value = v[0] ?? '';
    else field.value = v ?? '';
  }
  form.dispatchEvent(new Event('input', { bubbles: true }));
}

// ============================================================
// 1 · per-textarea controls (voice + add-another)
// ============================================================

function enhanceFields(form) {
  const formMulti = form.dataset.floveMulti || 'numbered';
  const fields = form.querySelectorAll(FIELD_SELECTOR);
  for (const field of fields) enhanceOne(field, formMulti);
}

function enhanceOne(field, formMulti) {
  if (field.dataset.floveEnhanced === 'true') return;
  if (isCoreField(field)) { field.dataset.floveEnhanced = 'core'; return; }
  field.dataset.floveEnhanced = 'true';

  const baseName = field.dataset.floveBaseName || stripIndex(field.name);
  field.dataset.floveBaseName = baseName;

  const wrap = document.createElement('div');
  wrap.className = 'flove-field-wrap';
  if (field.tagName === 'TEXTAREA') wrap.classList.add('flove-field-wrap--textarea');
  field.parentNode.insertBefore(wrap, field);
  wrap.appendChild(field);

  const tools = document.createElement('div');
  tools.className = 'flove-field-tools';
  wrap.appendChild(tools);

  if (canRecord() && isTextLike(field)) tools.appendChild(buildVoiceBtn(field));

  const multi = field.dataset.floveMulti || formMulti;
  if (multi !== 'off' && isCloneable(field)) {
    tools.appendChild(buildAddBtn(field, multi));
  }

  // file inputs auto-spawn a fresh clone after a file is picked, so the
  // user can keep adding without having to press ➕ each time.
  if (field.type === 'file' && multi !== 'off') {
    field.addEventListener('change', () => {
      if (!field.files || field.files.length === 0) return;
      const baseName = field.dataset.floveBaseName;
      const form = field.closest('form');
      if (!baseName || !form) return;
      const peers = form.querySelectorAll(`[data-flove-base-name="${baseName}"]`);
      const isLast = peers[peers.length - 1] === field;
      if (!isLast) return;
      cloneField(field, multi);
    });
  }
}

function isCoreField(field) {
  if (field.type === 'password') return true;
  const base = (field.dataset.floveBaseName || stripIndex(field.name) || '').toLowerCase();
  if (CORE_FIELD_NAMES.has(base)) return true;
  if (field.dataset.floveCore === 'true') return true;
  return false;
}

function isCloneable(field) {
  const t = (field.tagName === 'TEXTAREA' || field.tagName === 'SELECT')
            ? field.tagName.toLowerCase()
            : (field.type || 'text');
  if (t === 'textarea' || t === 'select') return true;
  return CLONEABLE_TYPES.has(t);
}

function isTextLike(field) {
  if (field.tagName === 'TEXTAREA') return true;
  return TEXT_TYPES.has(field.type || 'text');
}

function canRecord() {
  return typeof window !== 'undefined'
      && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function buildVoiceBtn(field) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'flove-field-btn flove-field-btn--voice';
  btn.title = 'Record voice';
  btn.setAttribute('aria-label', 'record voice');
  btn.textContent = '🎙';

  let rec = null;
  let recording = false;

  btn.addEventListener('click', () => {
    if (recording) { rec?.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    rec = new SR();
    rec.lang = (document.documentElement.lang || 'en');
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = ev => {
      let chunk = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) chunk += ev.results[i][0].transcript;
      }
      if (chunk) appendInto(field, chunk);
    };
    rec.onend = () => { recording = false; btn.classList.remove('is-recording'); };
    rec.onerror = () => { recording = false; btn.classList.remove('is-recording'); };
    recording = true;
    btn.classList.add('is-recording');
    rec.start();
  });
  return btn;
}

function appendInto(field, text) {
  const sep = field.value && !field.value.endsWith(' ') ? ' ' : '';
  field.value += sep + text;
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

function buildAddBtn(field, mode) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'flove-field-btn flove-field-btn--add';
  btn.title = 'Add another value';
  btn.setAttribute('aria-label', 'add another value');
  btn.textContent = '＋';
  btn.addEventListener('click', () => cloneField(field, mode));
  return btn;
}

function cloneField(field, mode) {
  const baseName = field.dataset.floveBaseName;
  const form     = field.closest('form');
  if (!baseName || !form) return;

  const siblings = Array.from(form.querySelectorAll(`[data-flove-base-name="${baseName}"]`));

  const clone = field.cloneNode(false);
  clone.value = '';
  clone.removeAttribute('id');
  clone.dataset.floveEnhanced = '';
  clone.dataset.floveBaseName = baseName;

  if (mode === 'array') {
    for (const s of siblings) s.name = `${baseName}[]`;
    clone.name = `${baseName}[]`;
  } else {
    const nextIdx = siblings.length + 1;
    clone.name = `${baseName}_${nextIdx}`;
  }

  // place after the last sibling's wrap
  const lastSibling = siblings[siblings.length - 1] || field;
  const lastWrap = lastSibling.closest('.flove-field-wrap') || lastSibling;
  lastWrap.insertAdjacentElement('afterend', clone);

  enhanceOne(clone, mode);
  clone.focus();
  form.dispatchEvent(new Event('input', { bubbles: true }));
}

function stripIndex(name) {
  if (!name) return name;
  if (name.endsWith('[]')) return name.slice(0, -2);
  return name.replace(/_\d+$/, '');
}

// ============================================================
// 2 · phrase + action bar
// ============================================================

function renderPhraseCard(form) {
  const card = document.createElement('section');
  card.className = 'flove-phrase-card';
  card.setAttribute('data-flove-card', form.dataset.floveApp || '');
  card.innerHTML = `
    <p class="flove-phrase" data-flove-slot="phrase"></p>
    <div class="flove-action-bar flove-action-bar--six"
         role="toolbar"
         aria-label="flove actions"
         aria-keyshortcuts="Shift">
      <button type="button" class="flove-action-btn" data-action="copy"    title="Copy phrase · Shift: copy JSON">
        <span aria-hidden="true">📋</span><span>copy</span>
      </button>
      <button type="button" class="flove-action-btn" data-action="share"   title="Share with mobile apps · Shift: phrase only">
        <span aria-hidden="true">📤</span><span>share</span>
      </button>
      <button type="button" class="flove-action-btn" data-action="magic"   title="Re-roll phrase with random prepositions · Shift: cycle language">
        <span aria-hidden="true">🪄</span><span>magic</span>
      </button>
      <button type="button" class="flove-action-btn" data-action="insight" title="Ask the AI for an insight · Shift: skip dialog">
        <span aria-hidden="true">💡</span><span>insight</span>
      </button>
      <button type="button" class="flove-action-btn flove-action-btn--primary" data-action="publish" title="Publish · Shift: skip selector if single match">
        <span aria-hidden="true">✺</span><span>publish</span>
      </button>
      <button type="button" class="flove-action-btn" data-action="format"  title="Download in another format · Shift: repeat last">
        <span aria-hidden="true">📁</span><span>format</span>
      </button>
    </div>
    <div class="flove-result" data-flove-slot="result" hidden></div>
  `;
  return card;
}

function updatePhrase(card, element, state) {
  const slot = card.querySelector('[data-flove-slot="phrase"]');
  if (!slot) return;
  if (state.magicOn) {
    slot.textContent = magicPhrase(element, state.magicOpts || {});
    slot.classList.add('is-magic');
  } else {
    slot.textContent = phraseOf(element);
    slot.classList.remove('is-magic');
  }
}

// ============================================================
// 3 · button handlers
// ============================================================

async function onAction(ev, action, form, io, card, state, config) {
  const alt = ev.shiftKey;
  const element = io.snapshot(form);
  const phraseSlot = card.querySelector('[data-flove-slot="phrase"]');
  const resultSlot = card.querySelector('[data-flove-slot="result"]');

  try {
    switch (action) {
      case 'copy':    await doCopy(phraseSlot.textContent, element, alt); break;
      case 'share':   await doShare(phraseSlot.textContent, element, alt); break;
      case 'magic':   doMagic(card, state, element, alt); break;
      case 'insight': await doInsight(element, config, resultSlot); break;
      case 'publish': await doPublish(element, alt, resultSlot); break;
      case 'format':  doFormat(element, phraseSlot.textContent, alt, state, ev.currentTarget); break;
    }
  } catch (err) {
    toast(`✗ ${action} failed: ${err.message}`);
  }
}

async function doCopy(phrase, element, alt) {
  const text = alt ? JSON.stringify(element, null, 2) : phrase;
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
  else legacyCopy(text);
  toast(alt ? '✺ JSON copied' : '✺ phrase copied');
}

async function doShare(phrase, element, alt) {
  if (!navigator.share) { await doCopy(phrase, element, alt); toast('✺ share unsupported · copied'); return; }
  if (alt) {
    await navigator.share({ title: `flove · ${element.app}`, text: phrase });
  } else {
    const file = new File([JSON.stringify(element, null, 2)],
                          `${element.id}.flove.json`, { type: 'application/json' });
    const payload = { title: `flove · ${element.app}`, text: phrase };
    if (navigator.canShare?.({ files: [file] })) payload.files = [file];
    await navigator.share(payload);
  }
  toast('✺ shared');
}

function doMagic(card, state, element, alt) {
  if (alt) {
    state.magicOpts = state.magicOpts || {};
    state.magicOpts.lang = (state.magicOpts.lang === 'es') ? 'en' : 'es';
  }
  state.magicOn = true;
  updatePhrase(card, element, state);
}

async function doInsight(element, config, resultSlot) {
  resultSlot.hidden = false;
  resultSlot.innerHTML = `<p class="flove-result__lede">💡 calling insight…</p>`;
  try {
    const text = await openInsight(element, config.insight);
    if (text == null) { resultSlot.hidden = true; resultSlot.innerHTML = ''; return; }
    resultSlot.innerHTML = `
      <h4 class="flove-result__title">💡 insight</h4>
      <p class="flove-result__body"></p>
      <div class="flove-result__row">
        <button type="button" class="flove-btn flove-btn--ghost" data-act="copy">copy</button>
        <button type="button" class="flove-btn flove-btn--ghost" data-act="dismiss">dismiss</button>
      </div>`;
    resultSlot.querySelector('.flove-result__body').textContent = text;
    resultSlot.querySelector('[data-act=copy]').onclick = () =>
      navigator.clipboard?.writeText(text).then(() => toast('✺ insight copied'));
    resultSlot.querySelector('[data-act=dismiss]').onclick = () => {
      resultSlot.hidden = true; resultSlot.innerHTML = '';
    };
  } catch (err) {
    resultSlot.innerHTML = `<p class="flove-result__error">✗ insight failed: ${escapeHtml(err.message)}</p>`;
  }
}

// ============================================================
// 4 · publish multi-select dialog
// ============================================================

async function doPublish(element, alt, resultSlot) {
  const route = previewSync(element);
  const routed = (route.destinations || []).map(d => ({
    name:   formatDestinations([d]) || d.module,
    kind:   'route',
    target: d,
  }));
  const custom = (loadCustomPlatforms()).map(p => ({ ...p, kind: p.kind || 'webhook' }));
  const all = [...routed, ...custom];

  if (alt && all.length === 1) {
    return runPublish([all[0]], element, resultSlot);
  }

  const picked = await openPublishDialog(all, element);
  if (!picked || !picked.length) return;
  await runPublish(picked, element, resultSlot);
}

function loadCustomPlatforms() {
  try {
    const raw = localStorage.getItem(PUBLISH_STORE);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomPlatforms(list) {
  try { localStorage.setItem(PUBLISH_STORE, JSON.stringify(list)); } catch {}
}

function openPublishDialog(platforms, element, opts = {}) {
  const manageOnly = !!opts.manageOnly;
  return new Promise(resolve => {
    const dlg = document.createElement('div');
    dlg.className = 'flove-modal';
    dlg.innerHTML = `
      <div class="flove-modal__backdrop"></div>
      <div class="flove-modal__panel" role="dialog" aria-label="${manageOnly ? 'manage publish platforms' : 'publish to platforms'}">
        <h3 class="flove-modal__title">${manageOnly ? '✺ publish platforms' : '✺ publish to…'}</h3>
        <p class="flove-modal__lede">${manageOnly ? 'Add or remove the platforms used by ✺ Publish.' : 'Select one or more platforms.'}</p>
        <ul class="flove-publish-list"></ul>
        <details class="flove-publish-add">
          <summary>+ add a custom platform</summary>
          <label>name <input name="name" placeholder="My blog"></label>
          <label>kind
            <select name="kind">
              <option value="webhook">webhook (POST JSON)</option>
              <option value="webshare">web share (mobile)</option>
              <option value="mailto">email (mailto:)</option>
              <option value="clipboard">clipboard</option>
              <option value="download">download .flove.json</option>
            </select>
          </label>
          <label>endpoint / address
            <input name="target" placeholder="https://… or you@example.com">
          </label>
          <button type="button" data-act="add" class="flove-btn flove-btn--ghost">add</button>
        </details>
        <div class="flove-modal__row">
          <button type="button" data-act="cancel"  class="flove-btn flove-btn--ghost">${manageOnly ? 'done' : 'cancel'}</button>
          ${manageOnly ? '' : '<button type="button" data-act="publish" class="flove-btn">publish selected</button>'}
        </div>
      </div>
    `;
    document.body.appendChild(dlg);

    const list  = dlg.querySelector('.flove-publish-list');
    const close = (val) => { dlg.remove(); resolve(val); };

    function render(list, platforms) {
      list.innerHTML = '';
      platforms.forEach((p, i) => {
        const li = document.createElement('li');
        li.className = 'flove-publish-row';
        li.innerHTML = `
          <label>
            ${manageOnly ? '' : `<input type="checkbox" data-i="${i}">`}
            <strong>${escapeHtml(p.name)}</strong>
            <span class="flove-publish-kind">${escapeHtml(p.kind)}</span>
          </label>
          ${p.kind !== 'route'
            ? `<button type="button" class="flove-field-btn" data-rm="${i}" title="remove">✕</button>`
            : ''}
        `;
        list.appendChild(li);
      });
    }
    render(list, platforms);

    list.addEventListener('click', ev => {
      const rm = ev.target.dataset?.rm;
      if (rm == null) return;
      const idx = +rm;
      const p = platforms[idx];
      if (p.kind === 'route') return;
      const custom = loadCustomPlatforms().filter(x => !(x.name === p.name && x.target === p.target));
      saveCustomPlatforms(custom);
      platforms.splice(idx, 1);
      render(list, platforms);
    });

    dlg.querySelector('[data-act=add]').onclick = () => {
      const fd = {};
      dlg.querySelectorAll('.flove-publish-add input, .flove-publish-add select').forEach(el => fd[el.name] = el.value.trim());
      if (!fd.name || !fd.target) return;
      const custom = loadCustomPlatforms();
      custom.push(fd);
      saveCustomPlatforms(custom);
      platforms.push(fd);
      render(list, platforms);
      dlg.querySelectorAll('.flove-publish-add input').forEach(el => el.value = '');
    };
    dlg.querySelector('[data-act=cancel]').onclick = () => close(null);
    const publishBtn = dlg.querySelector('[data-act=publish]');
    if (publishBtn) publishBtn.onclick = () => {
      const picked = [];
      list.querySelectorAll('input[type=checkbox]').forEach((cb, i) => {
        if (cb.checked) picked.push(platforms[i]);
      });
      close(picked);
    };
    dlg.querySelector('.flove-modal__backdrop').onclick = () => close(null);
  });
}

async function runPublish(platforms, element, resultSlot) {
  resultSlot.hidden = false;
  resultSlot.innerHTML = `<h4 class="flove-result__title">✺ publishing…</h4><ul class="flove-result__list"></ul>`;
  const ul = resultSlot.querySelector('ul');
  for (const p of platforms) {
    const li = document.createElement('li');
    li.textContent = `… ${p.name}`;
    ul.appendChild(li);
    try {
      const where = await dispatch(p, element);
      li.textContent = `✓ ${p.name}${where ? ' → ' + where : ''}`;
    } catch (err) {
      li.textContent = `✗ ${p.name}: ${err.message}`;
    }
  }
}

async function dispatch(platform, element) {
  const json = JSON.stringify(element, null, 2);
  const phrase = phraseOf(element);
  switch (platform.kind) {
    case 'route': {
      // F2 publisher not wired → dry-run
      return `${platform.target?.module || 'route'} (dry-run · F2 not wired)`;
    }
    case 'webhook': {
      const res = await fetch(platform.target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return platform.target;
    }
    case 'webshare': {
      if (!navigator.share) throw new Error('not supported');
      await navigator.share({ title: `flove · ${element.app}`, text: phrase });
      return 'system share';
    }
    case 'mailto': {
      const url = `mailto:${encodeURIComponent(platform.target)}` +
                  `?subject=${encodeURIComponent('flove · ' + element.app)}` +
                  `&body=${encodeURIComponent(phrase + '\n\n' + json)}`;
      window.location.href = url;
      return platform.target;
    }
    case 'clipboard': {
      await navigator.clipboard.writeText(json);
      return 'clipboard';
    }
    case 'download': {
      triggerDownload(`${element.id}.flove.json`, json, 'application/json');
      return `${element.id}.flove.json`;
    }
    default:
      throw new Error('unknown platform kind');
  }
}

// ============================================================
// 5 · format menu
// ============================================================

const FORMATS = [
  { id: 'json',     label: 'FloveElement (JSON)',  ext: 'flove.json', mime: 'application/json' },
  { id: 'phrase',   label: 'Phrase (TXT)',         ext: 'flove.txt',  mime: 'text/plain' },
  { id: 'markdown', label: 'Markdown',             ext: 'md',         mime: 'text/markdown' },
  { id: 'csv',      label: 'CSV',                  ext: 'csv',        mime: 'text/csv' },
  { id: 'kv',       label: 'Key : Value (TXT)',    ext: 'txt',        mime: 'text/plain' },
];

function doFormat(element, phrase, alt, state, anchor) {
  if (alt && state.lastFormat) {
    return downloadAs(state.lastFormat, element, phrase);
  }
  // popover near the format button
  closeOpenPopovers();
  const pop = document.createElement('div');
  pop.className = 'flove-popover';
  pop.innerHTML = FORMATS.map(f =>
    `<button type="button" class="flove-popover__item" data-fmt="${f.id}">${f.label}</button>`
  ).join('');
  document.body.appendChild(pop);
  positionPopover(pop, anchor);

  pop.addEventListener('click', ev => {
    const id = ev.target.dataset?.fmt;
    if (!id) return;
    const fmt = FORMATS.find(f => f.id === id);
    if (!fmt) return;
    state.lastFormat = fmt;
    downloadAs(fmt, element, phrase);
    pop.remove();
  });
  setTimeout(() => {
    document.addEventListener('click', function self(ev) {
      if (!pop.contains(ev.target)) { pop.remove(); document.removeEventListener('click', self); }
    });
  }, 0);
}

function closeOpenPopovers() {
  document.querySelectorAll('.flove-popover').forEach(el => el.remove());
}

function positionPopover(pop, anchor) {
  const r = anchor.getBoundingClientRect();
  pop.style.position = 'fixed';
  pop.style.left = `${Math.max(8, r.right - 220)}px`;
  pop.style.top  = `${r.bottom + 6}px`;
}

function downloadAs(fmt, element, phrase) {
  let body = '';
  switch (fmt.id) {
    case 'json':     body = JSON.stringify(element, null, 2); break;
    case 'phrase':   body = phrase; break;
    case 'markdown': body = toMarkdown(element); break;
    case 'csv':      body = toCSV(element); break;
    case 'kv':       body = toKV(element); break;
  }
  triggerDownload(`${element.id}.${fmt.ext}`, body, fmt.mime);
  toast(`✺ ${fmt.id} saved`);
}

function toMarkdown(el) {
  const lines = [];
  lines.push(`# ✺ ${el.app}/${el.type}${el.subtype ? ` (${el.subtype})` : ''}`);
  if (el.asterism_path) lines.push(`*${el.asterism_path}*`);
  lines.push('');
  lines.push('| field | value |');
  lines.push('|-------|-------|');
  for (const [k, v] of Object.entries(el.fields || {})) {
    if (v === '' || v == null) continue;
    const val = Array.isArray(v) ? v.join(', ') : (typeof v === 'object' ? JSON.stringify(v) : String(v));
    lines.push(`| ${k} | ${val.replace(/\|/g, '\\|')} |`);
  }
  lines.push('');
  lines.push(`*${el.created_at}*`);
  return lines.join('\n');
}

function toCSV(el) {
  const rows = [['key', 'value']];
  for (const [k, v] of Object.entries(el.fields || {})) {
    const val = Array.isArray(v) ? v.join('; ') : (typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''));
    rows.push([k, val]);
  }
  return rows.map(r => r.map(csvCell).join(',')).join('\n');
}

function csvCell(s) {
  s = String(s);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toKV(el) {
  const lines = [`# ${el.app}/${el.type}${el.subtype ? ' (' + el.subtype + ')' : ''}`];
  for (const [k, v] of Object.entries(el.fields || {})) {
    if (v === '' || v == null) continue;
    const val = Array.isArray(v) ? v.join(', ') : (typeof v === 'object' ? JSON.stringify(v) : String(v));
    lines.push(`${k}: ${val}`);
  }
  return lines.join('\n');
}

function triggerDownload(filename, body, mime) {
  const blob = new Blob([body], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ============================================================
// shared utilities
// ============================================================

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } finally { ta.remove(); }
}

function toast(msg) {
  let t = document.querySelector('.flove-toast--io');
  if (!t) {
    t = document.createElement('div');
    t.className = 'flove-toast flove-toast--io';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('is-visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('is-visible'), 1800);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// ============================================================
// IndexedDB drafts (read-side; write-side lives in flove-io.js)
// ============================================================

const _DB_NAME = 'flove-io';
const _STORE   = 'drafts';

function _openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(_DB_NAME, 1);
    req.onupgradeneeded = () => {
      try { req.result.createObjectStore(_STORE, { keyPath: 'id' }); } catch {}
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function listAllDrafts() {
  try {
    const db = await _openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(_STORE, 'readonly');
      const req = tx.objectStore(_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => reject(req.error);
    });
  } catch { return []; }
}

async function getDraft(id) {
  try {
    const db = await _openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(_STORE, 'readonly');
      const req = tx.objectStore(_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => reject(req.error);
    });
  } catch { return null; }
}

async function deleteDraft(id) {
  try {
    const db = await _openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(_STORE, 'readwrite');
      tx.objectStore(_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  } catch {}
}
