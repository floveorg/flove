// ✺ flove-phrase.js · legible-phrase serializer (canonical + magic)
// ----------------------------------------------------------------
// phraseOf(el)              → canonical phrase (deterministic)
// magicPhrase(el, opts)     → preposition-remixed phrase (random)
// tryParsePhrase(text)      → best-effort parse back into a partial element
//
// Phrase shape:
//   ✺ <app>/<type>[(<subtype>)] · key: value · key: value · yyyy-mm-dd
// Magic shape:
//   ✺ <app>/<type>[(<subtype>)] <prep1> value1 <prep2> value2 …
//
// Multi-value fields:
//   numbered  →  one clause per key (what, what_2, what_3 …)
//   array     →  values joined with ", "
// ----------------------------------------------------------------

export const PHRASE_VERSION = 2;

const HEAD = '✺';
const SEP  = ' · ';

const PREPOSITIONS = {
  es: ['con', 'sobre', 'bajo', 'entre', 'hacia', 'desde', 'durante',
       'según', 'ante', 'tras', 'junto a', 'cerca de', 'frente a',
       'gracias a', 'a través de', 'en torno a'],
  en: ['with', 'about', 'beneath', 'between', 'toward', 'from',
       'during', 'according to', 'before', 'after', 'beside',
       'near', 'across', 'around', 'concerning', 'inside'],
};

export function phraseOf(element) {
  if (!element || typeof element !== 'object') return '';
  const head = headOf(element);
  const parts = [head, ...renderFields(element.fields), shortDate(element.created_at)];
  return parts.filter(Boolean).join(SEP);
}

export function magicPhrase(element, opts = {}) {
  if (!element || typeof element !== 'object') return '';
  const lang = opts.lang || detectLang() || 'en';
  const pool = (opts.prepositions && opts.prepositions[lang])
            || PREPOSITIONS[lang]
            || PREPOSITIONS.en;
  const head = headOf(element);

  const used = new Set();
  function pick() {
    if (used.size >= pool.length) used.clear();
    let p;
    let guard = 32;
    do { p = pool[Math.floor(Math.random() * pool.length)]; } while (used.has(p) && guard--);
    used.add(p);
    return p;
  }

  const clauses = [];
  for (const [k, v] of Object.entries(element.fields || {})) {
    if (v === '' || v == null) continue;
    if (Array.isArray(v)) {
      for (const item of v) clauses.push(`${pick()} ${renderValue(item)}`);
    } else {
      clauses.push(`${pick()} ${renderValue(v)}`);
    }
  }
  return [head, ...clauses].join(' ');
}

export function tryParsePhrase(text) {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed.startsWith(HEAD)) return null;

  const segments = trimmed.split(SEP).map(s => s.trim());
  const head = segments.shift();
  const m = head?.match(/^✺\s+([^/]+)\/([^(\s]+)(?:\(([^)]+)\))?$/);
  if (!m) return null;
  const [, app, type, subtype = null] = m;

  let createdAt = null;
  if (segments.length && /^\d{4}-\d{2}-\d{2}$/.test(segments[segments.length - 1])) {
    createdAt = segments.pop() + 'T00:00:00.000Z';
  }

  const fields = {};
  for (const seg of segments) {
    const idx = seg.indexOf(': ');
    if (idx < 0) continue;
    const key = seg.slice(0, idx).trim();
    const raw = seg.slice(idx + 2).trim();
    if (!key) continue;
    fields[key] = parseValue(raw);
  }

  return { app, type, subtype, fields, created_at: createdAt, _from_phrase: true };
}

// ---- internals --------------------------------------------------

function headOf(element) {
  const app     = element.app     || 'flove';
  const type    = element.type    || 'element';
  const subtype = element.subtype ? `(${element.subtype})` : '';
  return `${HEAD} ${app}/${type}${subtype}`;
}

function renderFields(fields) {
  if (!fields || typeof fields !== 'object') return [];
  const out = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v === '' || v == null) continue;
    if (Array.isArray(v)) {
      const items = v.filter(x => x !== '' && x != null).map(renderValue);
      if (items.length) out.push(`${k}: ${items.join(', ')}`);
    } else {
      out.push(`${k}: ${renderValue(v)}`);
    }
  }
  return out;
}

function renderValue(v) {
  if (typeof v === 'string')  return v;
  if (typeof v === 'number')  return Number.isFinite(v) ? String(v) : '';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  try { return JSON.stringify(v); } catch { return String(v); }
}

function parseValue(raw) {
  if (raw === 'true')  return true;
  if (raw === 'false') return false;
  if (raw === 'null')  return null;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  if ((raw.startsWith('{') && raw.endsWith('}')) ||
      (raw.startsWith('[') && raw.endsWith(']'))) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  return raw;
}

function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
}

function detectLang() {
  if (typeof document === 'undefined') return null;
  const raw = document.documentElement?.lang || '';
  return raw.slice(0, 2).toLowerCase() || null;
}
