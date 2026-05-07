// ✺ flove-io.js · F0 local-first I/O layer for flove apps
// ----------------------------------------------------------------
// Vanilla ES module, zero external dependencies, zero build step.
// Distro-mates: flove-phrase.js (legible form), flove-routing.js (dry-run).
//
// Public API:
//   import { floveIO } from './flove-io.js';
//   const io = floveIO({ publisher, draft, onEmit });
//   io.attach(formEl)             - inject action bar into form
//   io.detach(formEl)             - remove action bar
//   io.snapshot(formEl)           - returns the current FloveElement
//   io.bind(opts)                 - wire to existing buttons in legacy apps
//
// Modifier alt mode (Shift-click or long-press ≥600ms):
//   Copy    → phrase only       Save    → <id>.flove.txt
//   Share   → phrase as text    Publish → dry-run (route preview, no send)
//
// HTML conventions on a form:
//   <form data-flove-app="loves"
//         data-flove-type="act"
//         data-flove-subtype="gift"
//         data-flove-asterism="Gift/Wish/Freed"
//         data-flove-fuzzy="optional">
// ----------------------------------------------------------------

import { phraseOf } from './flove-phrase.js';
import { previewSync, formatDestinations } from './flove-routing.js';

export const VERSION = 1;
const SCHEMA_URL = 'https://flove.org/schemas/element-v1.json';
const ACTIONS = ['copy', 'save', 'share', 'publish'];
const LONG_PRESS_MS = 600;

export function floveIO(opts = {}) {
  const config = {
    publisher: null,
    draft: 'off',
    onEmit: () => {},
    ...opts,
  };

  const memDrafts = new Map();
  const attached = new WeakMap();

  function attach(formEl, attachOpts = {}) {
    if (!formEl) throw new Error('floveIO.attach: form element is required');
    if (attached.has(formEl)) return attached.get(formEl);

    // Bar injection is opt-out. flove-shell.js passes { bar: false } and
    // renders its own six-button bar; legacy callers keep the old bar.
    if (attachOpts.bar === false) {
      attached.set(formEl, { bar: null, handlers: {} });
      return { bar: null };
    }

    const bar = document.createElement('div');
    bar.className = 'flove-action-bar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'flove element actions');
    bar.setAttribute('aria-keyshortcuts', 'Shift');
    bar.innerHTML = ACTIONS.map(a => actionButtonHTML(a)).join('');

    if (config.publisher) bar.querySelector('[data-action="publish"]').hidden = false;

    formEl.appendChild(bar);

    const handlers = {};
    for (const a of ACTIONS) {
      const btn = bar.querySelector(`[data-action="${a}"]`);
      wireButton(btn, a, formEl);
      handlers[a] = btn;
    }

    attached.set(formEl, { bar, handlers });
    return { bar };
  }

  function wireButton(btn, action, formEl, snapFn) {
    let pressTimer = null;
    let longFired  = false;

    const start = () => {
      longFired = false;
      pressTimer = setTimeout(() => {
        longFired = true;
        doAction(action, formEl, { alt: true }, snapFn);
      }, LONG_PRESS_MS);
    };
    const cancel = () => {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    };

    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup',   cancel);
    btn.addEventListener('pointerleave', cancel);
    btn.addEventListener('pointercancel', cancel);
    btn.addEventListener('click', ev => {
      if (longFired) { ev.preventDefault(); longFired = false; return; }
      doAction(action, formEl, { alt: ev.shiftKey }, snapFn);
    });
  }

  function detach(formEl) {
    const state = attached.get(formEl);
    if (!state) return;
    state.bar.remove();
    attached.delete(formEl);
  }

  function snapshot(formEl, override = {}) {
    const ds = formEl.dataset;
    const fields = override.fields ?? readFormFields(formEl);
    const id = override.id ?? genId(ds.floveApp || 'flove', ds.floveType || 'element');
    const now = new Date().toISOString();

    return {
      $schema:       SCHEMA_URL,
      id,
      type:          ds.floveType    || 'element',
      subtype:       ds.floveSubtype || null,
      app:           ds.floveApp     || 'flove',
      asterism_path: ds.floveAsterism|| null,
      fields,
      fuzzy:         override.fuzzy ?? null,
      cross_links:   override.cross_links ?? [],
      visibility:    'local',
      created_at:    now,
      updated_at:    now,
    };
  }

  function bind(opts) {
    const form = resolve(opts.form);
    if (!form) throw new Error('floveIO.bind: form selector did not resolve');
    const snap = opts.snapshot ?? (() => snapshot(form));
    const wire = (sel, action) => {
      const btn = resolve(sel);
      if (!btn) return;
      wireButton(btn, action, form, snap);
    };
    wire(opts.copyBtn,    'copy');
    wire(opts.saveBtn,    'save');
    wire(opts.shareBtn,   'share');
    wire(opts.publishBtn, 'publish');
  }

  async function doAction(action, formEl, modes, snapFn) {
    const alt = !!(modes && modes.alt);
    const element = (snapFn ?? (() => snapshot(formEl)))();
    config.onEmit(element, action, { alt });

    try {
      switch (action) {
        case 'copy':    await actionCopy(element, alt);    break;
        case 'save':       actionSave(element, alt);       break;
        case 'share':   await actionShare(element, alt);   break;
        case 'publish': await actionPublish(element, alt); break;
      }
      saveDraft(element);
    } catch (err) {
      toast(`✗ ${action} failed: ${err.message}`);
    }
  }

  // -- action implementations ----------------------------------

  async function actionCopy(el, alt) {
    const text = alt ? phraseOf(el) : JSON.stringify(el, null, 2);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      legacyCopy(text);
    }
    toast(alt ? '✺ phrase copied' : '✺ element copied');
  }

  function actionSave(el, alt) {
    const body = alt ? phraseOf(el) : JSON.stringify(el, null, 2);
    const ext  = alt ? 'txt' : 'json';
    const mime = alt ? 'text/plain' : 'application/json';
    const blob = new Blob([body], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${el.id}.flove.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(alt ? '✺ phrase saved' : '✺ element saved');
  }

  async function actionShare(el, alt) {
    const phrase = phraseOf(el);
    if (alt) {
      if (navigator.share) {
        await navigator.share({ title: `flove · ${el.app}`, text: phrase });
        toast('✺ phrase shared');
      } else {
        await actionCopy(el, true);
        toast('✺ share unsupported · phrase copied');
      }
      return;
    }
    const file = new File(
      [JSON.stringify(el, null, 2)],
      `${el.id}.flove.json`,
      { type: 'application/json' }
    );
    const payload = {
      title: `flove · ${el.app}`,
      text:  phrase,
      files: navigator.canShare?.({ files: [file] }) ? [file] : undefined,
    };
    if (navigator.share) {
      await navigator.share(payload);
      toast('✺ shared');
    } else {
      await actionCopy(el, false);
      toast('✺ share unsupported · copied instead');
    }
  }

  async function actionPublish(el, alt) {
    const route = previewSync(el);
    const where = formatDestinations(route.destinations) || 'no route';

    if (alt) {
      toast(`✺ dry-run → ${where}`);
      return;
    }
    if (!config.publisher) {
      toast(`✺ no publisher wired · would go to ${where}`);
      return;
    }
    const ref = await config.publisher.publish(el, { route });
    toast(`✺ published → ${ref?.module || where}`);
  }

  // -- draft persistence ---------------------------------------

  function saveDraft(el) {
    if (config.draft === 'memory') memDrafts.set(el.id, el);
    if (config.draft === 'indexeddb') idbPut(el).catch(() => {});
  }

  // -- helpers --------------------------------------------------

  return { attach, detach, snapshot, bind };
}

// ====================================================================
// internal utilities
// ====================================================================

function actionButtonHTML(action) {
  const labels = {
    copy:    { icon: '📋', text: 'copy',    title: 'Copy element as JSON · Shift: copy phrase' },
    save:    { icon: '💾', text: 'save',    title: 'Save as .flove.json · Shift: save .flove.txt phrase' },
    share:   { icon: '🔗', text: 'share',   title: 'Share element · Shift: share phrase only' },
    publish: { icon: '✺',  text: 'publish', title: 'Publish · Shift: dry-run (route preview only)' },
  };
  const l = labels[action];
  const primary = action === 'publish' ? ' flove-action-btn--primary' : '';
  const hidden  = action === 'publish' ? ' hidden' : '';
  return `<button type="button"
            class="flove-action-btn${primary}"
            data-action="${action}"
            title="${l.title}"${hidden}>
            <span aria-hidden="true">${l.icon}</span>
            <span>${l.text}</span>
          </button>`;
}

function readFormFields(formEl) {
  const out = {};
  const inputs = formEl.querySelectorAll('input[name], select[name], textarea[name]');
  inputs.forEach(input => {
    let name = input.name;
    if (!name) return;
    let value;
    if (input.type === 'checkbox') value = input.checked;
    else if (input.type === 'number') value = input.valueAsNumber;
    else if (input.type === 'file')   value = input.files?.[0]?.name || null;
    else                              value = input.value;

    // array mode: name="x[]" → push into out.x
    if (name.endsWith('[]')) {
      const base = name.slice(0, -2);
      if (!Array.isArray(out[base])) out[base] = [];
      out[base].push(value);
      return;
    }

    // numbered mode collisions: same name appears twice → coerce to array
    if (Object.prototype.hasOwnProperty.call(out, name) && !name.includes('.')) {
      if (!Array.isArray(out[name])) out[name] = [out[name]];
      out[name].push(value);
      return;
    }

    setByPath(out, name, value);
  });
  return out;
}

function setByPath(obj, path, value) {
  const keys = path.split('.');
  let node = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    node[keys[i]] = node[keys[i]] || {};
    node = node[keys[i]];
  }
  node[keys[keys.length - 1]] = value;
}

function genId(app, type) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const bytes = (crypto?.getRandomValues?.(new Uint8Array(3))) || randFallback(3);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${app}-${type}-${stamp}-${hex}`;
}

function randFallback(n) {
  const a = new Uint8Array(n);
  for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
  return a;
}

function resolve(target) {
  if (!target) return null;
  if (typeof target === 'string') return document.querySelector(target);
  return target;
}

// Kept for back-compat; phraseOf is the canonical legible form.
function humanize(el) { return phraseOf(el); }

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
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

// -- IndexedDB tiny helper (single store, key = element.id) ------

const DB_NAME = 'flove-io';
const STORE   = 'drafts';
let _dbPromise = null;

function idbOpen() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
  return _dbPromise;
}

async function idbPut(el) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(el);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}
