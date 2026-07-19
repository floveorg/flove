/* ============================================================
   flove-appy.js · app → Appy profile bridge  (phase 0/1 — no backend)
   ============================================================
   ONE shared mechanism for "publish this app's result to my Appy
   profile", used identically by every flove app. Same-origin
   localStorage bridge (works on flove.org and any single local
   server; NOT across separate file:// documents — serve over http).

   WRITER (an app) — markup only. Add the three Publish options as
   buttons carrying the standard hook, and expose the summary-model:
     <button data-flove-publish="appy">Appy</button>
     <button data-flove-publish="wizy">Wizy</button>
     <button data-flove-publish="more">More</button>
     <script>window.floveSummary = () => ({ app:'Goddy', ...model });</script>
   Include this script (no data-app) and it auto-wires the clicks,
   writes honestly, and shows a bilingual hint in [data-flove-hint]
   (falls back to #hintMessage). Optional per-app agent detail:
     window.floveAgentBlock = (summary) => ({ prompt, schema, context, suggestions });

   READER (an appy profile page) — include this script (no data-app)
   and render on load AND on change:
     function paint(recs){ ... }        // recs = [{app, colour, summary, url, via, date}]
     paint(window.floveAppy.played());  // initial
     window.floveAppy.onChange(paint);  // live: other tab published / tab refocused

   Modes: appy = save the summary-model. wizy = same, but the record's
   summary carries an extra `agent` block (built generically here,
   overridable per app) so an agent can act on it. more = placeholder
   for further networks (nety · 0asis).

   Limits (honest): localStorage is per-origin and per-device. Real
   cross-device / cross-user propagation is backend work (0asis /
   F-phases); this is the phase-0/1 local path + offline fallback.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'flove:appy:played';

  /* Brand-colour registry. Phase 1 = the 7 apps shown in miniappy.
     Extend this map as apps adopt Publish (scales to the whole catalogue). */
  var COLOURS = {
    Goddy: '#e23b3b', Souls: '#ef7d1a', Pracsys: '#e3bb12', Myfamily: '#34b36b',
    Inventary: '#2f7fd6', Realy: '#5a4fd0', Keys: '#9b51e0'
  };

  function read() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (_) { return []; }
  }
  /* returns true only if the write actually persisted */
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (_) { return false; }
  }

  /* Merge by app name (latest wins). Returns { ok, list }. */
  function publish(rec) {
    if (!rec || !rec.app) return { ok: false, list: read() };
    var entry = {
      app: String(rec.app),
      colour: rec.colour || COLOURS[rec.app] || null,
      summary: (rec.summary !== undefined ? rec.summary : null),
      url: rec.url || (typeof location !== 'undefined' ? location.pathname : null),
      via: rec.via || null,
      date: new Date().toISOString()
    };
    var list = read();
    var i = -1;
    for (var k = 0; k < list.length; k++) { if (list[k] && list[k].app === entry.app) { i = k; break; } }
    if (i >= 0) list[i] = entry; else list.push(entry);
    var ok = write(list);
    return { ok: ok, list: list };
  }

  function clear(app) {
    if (!app) { write([]); return []; }
    var list = read().filter(function (x) { return x && x.app !== app; });
    write(list);
    return list;
  }

  /* Read the app's summary-model (function or plain object). */
  function currentSummary() {
    try { return (typeof window.floveSummary === 'function') ? window.floveSummary() : (window.floveSummary || null); }
    catch (_) { return null; }
  }

  /* Wizy's agent-oriented block. Generic by default; an app may provide a
     richer, domain-specific one via window.floveAgentBlock(summary). */
  function agentBlock(summary) {
    if (typeof window.floveAgentBlock === 'function') {
      try { var b = window.floveAgentBlock(summary); if (b) return b; } catch (_) {}
    }
    var app = (summary && summary.app) || 'this flove app';
    return {
      prompt: 'You are handed a ' + app + ' summary from FLOVE. Read the phrase and the '
        + 'structured fields, then help the user reflect on the result and suggest one gentle next step.',
      schema: { app: 'app slug', phrase: 'one-line human summary the app composed', '…': 'app-specific fields follow' },
      context: { source: app + ' · FLOVE', url: (typeof location !== 'undefined' ? location.href : null) },
      suggestions: [
        'Summarise the pattern in one sentence.',
        'Point out anything notable or missing.',
        'Offer one question the user might explore next.'
      ]
    };
  }

  /* High-level: publish the current summary to the profile.
     mode 'appy' | 'wizy'. Returns { ok, reason, app, mode }. */
  function publishSummary(mode) {
    var summary = currentSummary();
    if (!summary || typeof summary !== 'object') return { ok: false, reason: 'no-summary', mode: mode };
    var app = summary.app || null;
    if (!app) return { ok: false, reason: 'no-app', mode: mode };
    if (mode === 'wizy') summary.agent = agentBlock(summary);
    var res = publish({ app: app, summary: summary, via: mode });
    return { ok: res.ok, reason: res.ok ? null : 'storage', app: app, mode: mode };
  }

  /* ---- bilingual hint into a standard target ([data-flove-hint] or #hintMessage) ---- */
  function hintTarget() { return document.querySelector('[data-flove-hint]') || document.getElementById('hintMessage'); }
  function setHint(en, es, icon) {
    var t = hintTarget(); if (!t) return;
    t.innerHTML = (icon ? ('<i class="' + icon + '"></i> ') : '')
      + '<span class="en" lang="en">' + en + '</span><span class="es" lang="es">' + es + '</span>';
    if (typeof window.applyLang === 'function') { try { window.applyLang(); } catch (_) {} }
  }

  /* ---- WRITER auto-wiring: any [data-flove-publish="appy|wizy|more"] button ---- */
  function wirePublishButtons() {
    var btns = document.querySelectorAll('[data-flove-publish]');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        if (btn.__floveWired) return; btn.__floveWired = true;
        btn.addEventListener('click', function () {
          var mode = btn.getAttribute('data-flove-publish');
          if (mode === 'more') {
            setHint('Further networks (nety · 0asis) — coming.', 'Más redes (nety · 0asis) — próximamente.', 'fas fa-ellipsis');
            return;
          }
          var r = publishSummary(mode);
          if (r.ok) {
            if (mode === 'wizy') setHint('Saved to your Appy profile, ready for your agent ✓', 'Guardado en tu perfil de Appy, listo para tu agente ✓', 'fas fa-wand-magic-sparkles');
            else setHint('Saved to your Appy profile ✓', 'Guardado en tu perfil de Appy ✓', 'fas fa-user-check');
            try { document.dispatchEvent(new CustomEvent('flove-appy:published', { detail: r })); } catch (_) {}
          } else if (r.reason === 'no-summary' || r.reason === 'no-app') {
            setHint('Nothing to save yet — use the app first.', 'Nada que guardar todavía — usa la app primero.', 'fas fa-circle-info');
          } else {
            setHint('Could not save — storage is blocked in this browser.', 'No se pudo guardar — el almacenamiento está bloqueado en este navegador.', 'fas fa-triangle-exclamation');
          }
        });
      })(btns[i]);
    }
  }

  /* ---- READER live-update: fire cb(records) when another tab publishes,
          or when this tab is refocused (covers "profile was already open"). ---- */
  function onChange(cb) {
    if (typeof cb !== 'function') return;
    window.addEventListener('storage', function (e) { if (e.key === KEY) cb(read()); });
    window.addEventListener('focus', function () { cb(read()); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) cb(read()); });
  }

  window.floveAppy = {
    KEY: KEY, COLOURS: COLOURS,
    read: read, played: read, publish: publish, clear: clear,
    currentSummary: currentSummary, agentBlock: agentBlock,
    publishSummary: publishSummary, onChange: onChange
  };

  /* ---- legacy floating "Publish to Appy" button (opt-in via data-app) ---- */
  function ownScript() {
    if (document.currentScript) return document.currentScript;          // null for deferred scripts
    var all = document.querySelectorAll('script[data-app]');
    for (var i = 0; i < all.length; i++) {
      if ((all[i].getAttribute('src') || '').indexOf('flove-appy') !== -1) return all[i];
    }
    return null;
  }

  function init() {
    wirePublishButtons();                                               // standard hook — every page

    var s = ownScript();
    var app = s && s.getAttribute('data-app');
    if (!app) return;                                                   // no data-app → no floating button
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
      publish({ app: app, colour: colour, summary: currentSummary() });
      btn.textContent = '✓ Published to Appy';
      btn.style.transform = 'scale(1.04)';
      setTimeout(function () { btn.textContent = '✦ Publish to Appy'; btn.style.transform = ''; }, 1700);
    });
    (document.body || document.documentElement).appendChild(btn);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
