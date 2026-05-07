// ✺ flove-routing.js · F1 declarative router (dry-run capable)
// ----------------------------------------------------------------
// Loads routing.json once, matches elements against routes, and
// returns where they would go — without contacting any publisher.
// Used by the shell to render the route-preview chip and (later)
// by the publisher (F2) to know where to deliver.
// ----------------------------------------------------------------

export const ROUTING_VERSION = 1;

let _cache = null;
let _loadPromise = null;

export function loadRouting(url = './routing.json') {
  if (_cache) return Promise.resolve(_cache);
  if (_loadPromise) return _loadPromise;

  _loadPromise = fetch(url, { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : { version: '0', routes: [] })
    .catch(() => ({ version: '0', routes: [] }))
    .then(data => {
      _cache = data;
      return data;
    });
  return _loadPromise;
}

export async function preview(element, opts = {}) {
  const routing = await loadRouting(opts.url);
  const all = matchAll(routing, element);
  const strategy = routing.strategy || 'first';
  const matches = strategy === 'all' ? all : all.slice(0, 1);

  return {
    matched: matches.length > 0,
    routes: matches,
    destinations: matches.flatMap(r => r.destinations || []),
    hooks: matches.flatMap(r => r.hooks || []),
  };
}

export function previewSync(element, routing = _cache) {
  if (!routing) return { matched: false, routes: [], destinations: [], hooks: [] };
  const all = matchAll(routing, element);
  const matches = (routing.strategy === 'all') ? all : all.slice(0, 1);
  return {
    matched: matches.length > 0,
    routes: matches,
    destinations: matches.flatMap(r => r.destinations || []),
    hooks: matches.flatMap(r => r.hooks || []),
  };
}

// ---- internals --------------------------------------------------

function matchAll(routing, element) {
  const routes = Array.isArray(routing.routes) ? routing.routes : [];
  return routes.filter(route => matches(route.match || {}, element));
}

function matches(pattern, element) {
  for (const [path, expected] of Object.entries(pattern)) {
    const actual = readPath(element, path);
    if (!matchValue(actual, expected)) return false;
  }
  return true;
}

function matchValue(actual, expected) {
  if (expected === null || typeof expected !== 'object') {
    return actual === expected;
  }
  if (Array.isArray(expected.in)) {
    return expected.in.includes(actual);
  }
  if (typeof expected.regex === 'string') {
    try { return new RegExp(expected.regex).test(String(actual ?? '')); }
    catch { return false; }
  }
  if (expected.exists === true)  return actual !== undefined && actual !== null;
  if (expected.exists === false) return actual === undefined || actual === null;
  return false;
}

function readPath(obj, path) {
  if (!obj) return undefined;
  if (!path.includes('.')) return obj[path];
  return path.split('.').reduce((node, key) => (node == null ? node : node[key]), obj);
}

// Convenience formatter for the shell chip.
export function formatDestinations(dests) {
  if (!dests || dests.length === 0) return '';
  return dests
    .map(d => [d.module, d.channel || d.tribe || d.audience].filter(Boolean).join('/'))
    .join(' + ');
}
