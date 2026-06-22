/* ============================================================
   flove-appy.js · "Publish to Appy" handoff  (phase 1 — no backend)
   ============================================================
   Same-origin localStorage bridge between any flove app and Appy/miniappy.

   An app opts in with ONE line (auto-injects a floating publish button):
     <script src="../flove-appy.js" data-app="Keys" data-colour="#9b51e0" defer></script>

   The receiver (miniappy) includes it WITHOUT data-app (no button) and reads:
     window.floveAppy.played()  ->  [{app, colour, summary, url, date}, ...]

   An app may expose its result for richer publishing:
     window.floveSummary = () => ({ ...summary-model... });   // or a plain object

   Limits (honest): localStorage is per-origin and per-device. Real cross-device
   / cross-user propagation is backend work (0asis / F-phases); this is the
   phase-1 local demo and later the offline cache/fallback.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'flove:appy:played';

  /* Brand-colour registry. Phase 1 = the 7 apps shown in miniappy.
     Phase 2 extends this map to the whole catalogue. */
  var COLOURS = {
    Goddy: '#e23b3b', Souls: '#ef7d1a', Pracsys: '#e3bb12', Myfamily: '#34b36b',
    Inventary: '#2f7fd6', Realy: '#5a4fd0', Keys: '#9b51e0'
  };

  function read() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (_) { return []; }
  }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (_) {}
  }

  /* Merge by app name (latest wins). Returns the updated list. */
  function publish(rec) {
    if (!rec || !rec.app) return read();
    var entry = {
      app: String(rec.app),
      colour: rec.colour || COLOURS[rec.app] || null,
      summary: (rec.summary !== undefined ? rec.summary : null),
      url: rec.url || (typeof location !== 'undefined' ? location.pathname : null),
      date: new Date().toISOString()
    };
    var list = read();
    var i = -1;
    for (var k = 0; k < list.length; k++) { if (list[k] && list[k].app === entry.app) { i = k; break; } }
    if (i >= 0) list[i] = entry; else list.push(entry);
    write(list);
    return list;
  }

  function clear(app) {
    if (!app) { write([]); return []; }
    var list = read().filter(function (x) { return x && x.app !== app; });
    write(list);
    return list;
  }

  window.floveAppy = { KEY: KEY, COLOURS: COLOURS, played: read, publish: publish, clear: clear };

  /* ---- auto-inject the floating "Publish to Appy" button (opt-in via data-app) ---- */
  function ownScript() {
    if (document.currentScript) return document.currentScript;          // null for deferred scripts
    var all = document.querySelectorAll('script[data-app]');
    for (var i = 0; i < all.length; i++) {
      if ((all[i].getAttribute('src') || '').indexOf('flove-appy') !== -1) return all[i];
    }
    return null;
  }

  function init() {
    var s = ownScript();
    var app = s && s.getAttribute('data-app');
    if (!app) return;                                                   // receiver-only include → no button
    var colour = (s && s.getAttribute('data-colour')) || COLOURS[app] || '#6c5ce7';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'flove-appy-pub';
    btn.textContent = '✦ Publish to Appy';
    btn.setAttribute('aria-label', 'Publish ' + app + ' to your Appy profile');
    btn.style.cssText =
      'position:fixed;right:14px;bottom:14px;z-index:99999;' +
      'font:600 12px/1 system-ui,-apple-system,sans-serif;color:#fff;background:' + colour + ';' +
      'border:none;border-radius:999px;padding:.62rem .95rem;cursor:pointer;' +
      'box-shadow:0 4px 16px -3px rgba(0,0,0,.45);transition:transform .12s,filter .15s;';
    btn.addEventListener('mouseenter', function () { btn.style.filter = 'brightness(1.08)'; });
    btn.addEventListener('mouseleave', function () { btn.style.filter = ''; });
    btn.addEventListener('click', function () {
      var summary = null;
      try { summary = (typeof window.floveSummary === 'function') ? window.floveSummary() : (window.floveSummary || null); }
      catch (_) { summary = null; }
      publish({ app: app, colour: colour, summary: summary });
      btn.textContent = '✓ Published to Appy';
      btn.style.transform = 'scale(1.04)';
      setTimeout(function () { btn.textContent = '✦ Publish to Appy'; btn.style.transform = ''; }, 1700);
    });
    (document.body || document.documentElement).appendChild(btn);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
