/* ============================================================
   wizy.js · standalone suggestion engine for flove apps
   ============================================================
   PoC / phase 0 — pure client-side, no backend.

   WHAT IT DOES
   Takes a flove app's summary-model and generates contextual
   suggestions: what could this become, what's worth exploring
   next, what's notable or missing. Each suggestion is a gentle
   prompt — not an instruction.

   HOW TO USE
   1. Include: <script src="wizy.js"></script>
   2. Expose the app's summary:
        window.floveSummary = () => ({ app:'Dealy', mode:'lend', ... });
   3. Generate suggestions:
        const suggestions = wizy.suggest(window.floveSummary());
   4. Or get a full agent block (for flove-appy wizy mode):
        const agent = wizy.agent(window.floveSummary());
   5. Or render suggestions into a container:
        wizy.render(document.getElementById('wizy-box'), window.floveSummary());

   API
     wizy.suggest(summary)  → [{ text, weight, area }]
     wizy.agent(summary)   → { prompt, schema, context, suggestions }
     wizy.render(el, summary) → void (fills el with suggestion chips)
     wizy.packs             → { dealy, blogy, ... } per-app override packs
     wizy.register(app, fn) → register a custom pack function

   INDEPENDENT — no dependency on flove.js, flove-appy.js, or
   any other shared lib. Can be used by any single-file HTML app.
   ============================================================ */
;(function (root) {
  'use strict';

  var wizy = {};

  /* ── internal: summary → text tokens for suggestion matching ── */
  function tokens(s) {
    if (!s) return [];
    var parts = [];
    function walk(obj, depth) {
      if (depth > 4) return;
      if (obj == null) return;
      if (typeof obj === 'string') { parts.push(obj.toLowerCase()); return; }
      if (typeof obj === 'number') { parts.push(String(obj)); return; }
      if (Array.isArray(obj)) { obj.forEach(function (v) { walk(v, depth + 1); }); return; }
      if (typeof obj === 'object') {
        Object.keys(obj).forEach(function (k) {
          parts.push(k.toLowerCase());
          walk(obj[k], depth + 1);
        });
      }
    }
    walk(s, 0);
    return parts;
  }

  function hasAny(toks, keys) {
    for (var i = 0; i < keys.length; i++) {
      for (var j = 0; j < toks.length; j++) {
        if (toks[j].indexOf(keys[i]) !== -1) return true;
      }
    }
    return false;
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ── base suggestions (app-agnostic) ── */
  var BASE = [
    { text: 'What feeling does this summary convey?', area: 'reflect', weight: 1 },
    { text: 'Read it aloud — does it sound like you?', area: 'reflect', weight: 1 },
    { text: 'If you had to send this in one message, would it be enough?', area: 'reflect', weight: 2 },
  ];

  /* ── per-app suggestion packs ── */
  var PACKS = {};

  /* Dealy — gift / lend / exchange */
  PACKS.dealy = function (s, t) {
    var out = [];
    var mode = (s.mode || '').toLowerCase();
    if (mode === 'gift') {
      out.push({ text: 'What would make the recipient smile?', area: 'gift', weight: 3 });
      out.push({ text: 'Is there a story behind why you\'re giving this?', area: 'gift', weight: 2 });
    } else if (mode === 'lend') {
      out.push({ text: 'When do you want it back?', area: 'lend', weight: 3 });
      out.push({ text: 'What condition should it be in when returned?', area: 'lend', weight: 2 });
    } else if (mode === 'exchange') {
      out.push({ text: 'What would you like in return?', area: 'exchange', weight: 3 });
      out.push({ text: 'Is the value about money, time, or meaning?', area: 'exchange', weight: 2 });
    }
    if (hasAny(t, ['ecological', 'eco', 'regener', 'sustain'])) {
      out.push({ text: 'How does this choice help the planet?', area: 'values', weight: 2 });
    }
    if (hasAny(t, ['craft', 'handmade', 'artisan'])) {
      out.push({ text: 'What makes this handcrafted item special?', area: 'values', weight: 2 });
    }
    if (hasAny(t, ['worth', 'symbol', 'histor', 'ideal', 'potential', 'functional', 'afford', 'respect', 'regen'])) {
      out.push({ text: 'Your ratings tell a story — what stands out most?', area: 'worth', weight: 2 });
    }
    if (hasAny(t, ['disput', 'arbitrat', 'mediat', 'consensus', 'majority'])) {
      out.push({ text: 'Have you considered how disagreements might be resolved?', area: 'disputes', weight: 1 });
    }
    out.push({ text: 'Is there a neighbour who\'d love this?', area: 'action', weight: 2 });
    out.push({ text: 'What\'s one word that captures this offer?', area: 'action', weight: 1 });
    return out;
  };

  /* Blogy — blog posts */
  PACKS.blogy = function (s, t) {
    var out = [];
    if (hasAny(t, ['title', 'entry', 'post', 'blog'])) {
      out.push({ text: 'What question does this post answer?', area: 'reflect', weight: 3 });
    }
    if (hasAny(t, ['ray', 'cycle', 'insight'])) {
      out.push({ text: 'Which ray resonated most with you?', area: 'reflect', weight: 2 });
    }
    if (hasAny(t, ['who', 'person', 'character'])) {
      out.push({ text: 'Is there a person behind this story worth mentioning?', area: 'reflect', weight: 2 });
    }
    out.push({ text: 'What would a reader take away from this?', area: 'action', weight: 2 });
    out.push({ text: 'Could this be the start of a series?', area: 'action', weight: 1 });
    return out;
  };

  /* Trusty — trust / signal system */
  PACKS.trusty = function (s, t) {
    var out = [];
    if (hasAny(t, ['signal', 'reciprocity', 'transparency', 'honesty'])) {
      out.push({ text: 'Which signal do you identify with most?', area: 'reflect', weight: 3 });
    }
    if (hasAny(t, ['scope', 'people', 'scope'])) {
      out.push({ text: 'How wide is your circle of trust?', area: 'reflect', weight: 2 });
    }
    out.push({ text: 'What does trust mean to you in one sentence?', area: 'action', weight: 2 });
    return out;
  };

  /* Metas — meta-decisions */
  PACKS.metas = function (s, t) {
    var out = [];
    out.push({ text: 'What decision are you circling around?', area: 'reflect', weight: 3 });
    out.push({ text: 'Is there a fear underneath this choice?', area: 'reflect', weight: 2 });
    out.push({ text: 'What would you tell a friend in the same situation?', area: 'action', weight: 2 });
    return out;
  };

  /* Risa — laughter / joy */
  PACKS.risa = function (s, t) {
    var out = [];
    out.push({ text: 'When did you last laugh out loud?', area: 'reflect', weight: 2 });
    out.push({ text: 'What made you smile today?', area: 'action', weight: 2 });
    return out;
  };

  /* Puzzy — word puzzles */
  PACKS.puzzy = function (s, t) {
    var out = [];
    out.push({ text: 'What pattern did you notice first?', area: 'reflect', weight: 2 });
    out.push({ text: 'Did your mind go somewhere unexpected?', area: 'action', weight: 2 });
    return out;
  };

  /* Generic fallback — works for any app */
  PACKS._generic = function (s, t) {
    var out = [];
    out.push({ text: 'What does this mean to you right now?', area: 'reflect', weight: 2 });
    out.push({ text: 'Is there something you\'d add or change?', area: 'action', weight: 2 });
    if (hasAny(t, ['time', 'when', 'date', 'hour'])) {
      out.push({ text: 'When is the right moment for this?', area: 'time', weight: 2 });
    }
    if (hasAny(t, ['people', 'who', 'friend', 'neighbour', 'family'])) {
      out.push({ text: 'Who comes to mind when you think about this?', area: 'people', weight: 2 });
    }
    return out;
  };

  /* ── public: register a custom pack ── */
  var customPacks = {};
  wizy.register = function (app, fn) {
    if (typeof app === 'string' && typeof fn === 'function') customPacks[app.toLowerCase()] = fn;
  };

  /* ── public: generate suggestions ── */
  wizy.suggest = function (summary) {
    if (!summary || typeof summary !== 'object') return BASE.slice();
    var app = (summary.app || '').toLowerCase();
    var toks = tokens(summary);

    var packFn = customPacks[app] || PACKS[app] || PACKS._generic;
    var specific = packFn(summary, toks);

    /* merge: specific first, then base, deduplicate by text */
    var seen = {};
    var out = [];
    specific.concat(BASE).forEach(function (s) {
      if (!seen[s.text]) { seen[s.text] = 1; out.push(s); }
    });

    /* sort by weight descending */
    out.sort(function (a, b) { return (b.weight || 0) - (a.weight || 0); });
    return out;
  };

  /* ── public: full agent block (for flove-appy wizy mode) ── */
  wizy.agent = function (summary) {
    var app = (summary && summary.app) || 'this flove app';
    var sugs = wizy.suggest(summary);
    return {
      prompt: 'You are handed a ' + app + ' summary from FLOVE. Read the phrase and the '
        + 'structured fields, then help the user reflect on the result and suggest one gentle next step.',
      schema: { app: 'app slug', phrase: 'one-line human summary the app composed', '…': 'app-specific fields follow' },
      context: { source: app + ' · FLOVE', url: (typeof location !== 'undefined' ? location.href : null) },
      suggestions: sugs.map(function (s) { return s.text; })
    };
  };

  /* ── public: render suggestions into a DOM container ── */
  wizy.render = function (el, summary) {
    if (!el) return;
    var sugs = wizy.suggest(summary);
    el.innerHTML = '';

    var wrap = document.createElement('div');
    wrap.className = 'wizy-chips';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Suggestions');

    sugs.forEach(function (s) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'wizy-chip';
      chip.textContent = s.text;
      chip.setAttribute('data-area', s.area || '');
      chip.addEventListener('click', function () {
        chip.classList.toggle('wizy-chip--on');
        /* fire event for the app to react */
        try {
          el.dispatchEvent(new CustomEvent('wizy:select', { detail: s, bubbles: true }));
        } catch (_) {}
      });
      wrap.appendChild(chip);
    });

    el.appendChild(wrap);
  };

  /* ── expose ── */
  root.wizy = wizy;

})(typeof window !== 'undefined' ? window : this);
