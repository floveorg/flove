#!/usr/bin/env node
// build-aliases.mjs — genera 404.html, el "cartel-recepcionista" de flove.org.
//
// GitHub Pages sirve 404.html ante CUALQUIER ruta inexistente. Ese fichero lleva
// un mapa mote->ruta real: al pedir flove.org/willy (que no existe como fichero),
// GitHub sirve 404.html y su JS reenvía a /apps/metas/willy.html. Así cada app y
// doc es alcanzable por su mote corto sin duplicar ficheros ni mover carpetas.
//
// Fuente de la verdad = apps/index.html (el índice de demos) + docs/*.html.
// Web-only: build-flove-zip.sh lo excluye del zip descargable.
//
// Regenerar tras añadir/renombrar apps:  node build-aliases.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, basename, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const read = p => readFileSync(join(ROOT, p), 'utf8');

// Motes que chocarían con carpetas/ficheros reales de la raíz: no se generan.
const RESERVED = new Set(['index','apps','blog','docs','images','others','launch',
  '404','readme','license','cname','flove','flove-icon','start-flove',
  'build-flove-zip','publish-lowai','favicon','launch']);

const map = {};      // mote -> ruta absoluta real
const skips = [];
function add(name, path){
  const key = name.toLowerCase();
  if (RESERVED.has(key))            { skips.push(`${name}  (nombre reservado)`); return; }
  if (map[name] && map[name]!==path){ skips.push(`${name}  (duplicado; ya apunta a ${map[name]})`); return; }
  map[name] = path;
}

// 1) apps listadas en apps/index.html
const idx = read('apps/index.html');
for (const m of idx.matchAll(/href="([^"]+\.html)(?:#[^"]*)?"/g)) {
  const href = m[1];
  if (href.startsWith('../') || href.startsWith('http')) continue; // cruzados/externos
  if (basename(href) === 'index.html') continue;                    // índices de clúster
  add(basename(href).replace(/\.html$/,''), '/apps/' + href);
}

// 2) extras: tiers canónicos que el índice no cubre + alias "desnudos" cómodos
const EXTRAS = {
  'appy-basic': '/apps/appy/appy-basic.html',   // el índice no lo enlaza; lo pidió Marc
  'appy':       '/apps/appy/appy-basic.html',   // /appy  -> tier canónico
  'blogy':      '/apps/blogy/blogy-advanced.html',
  'keys':       '/apps/puzzy/keys-advanced.html',
  'dealy':      '/apps/economy/dealy/dealy-advanced.html',
};
for (const [k,v] of Object.entries(EXTRAS)) add(k, v);

// 3) docs de primer nivel
for (const f of readdirSync(join(ROOT,'docs'))) {
  if (!f.endsWith('.html') || f === 'index.html') continue;
  add(f.replace(/\.html$/,''), '/docs/' + f);
}

// ---------- generar 404.html ----------
const MAP_JSON = JSON.stringify(map);
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>flove · buscando…</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%230d1430'/%3E%3Ccircle cx='37' cy='50' r='13' fill='%23d4af37'/%3E%3Ccircle cx='63' cy='50' r='13' fill='%23d4af37'/%3E%3Ccircle cx='37' cy='50' r='4.5' fill='%230d1430'/%3E%3Ccircle cx='63' cy='50' r='4.5' fill='%230d1430'/%3E%3C/svg%3E">
<script>
/* Cartel-recepcionista: resuelve el mote y reenvía. GENERADO por build-aliases.mjs — no editar a mano. */
(function () {
  var MAP = ${MAP_JSON};
  var p = decodeURIComponent(location.pathname)
            .replace(/^\\/+|\\/+$/g, '')   // quita barras de los extremos
            .replace(/\\.html$/, '');      // /willy.html -> willy
  var target = MAP[p] || MAP[p.toLowerCase()];
  if (target) { location.replace(target + location.search + location.hash); }
  else { document.documentElement.setAttribute('data-lost', ''); }
})();
</script>
<style>
  body{ display:none; margin:0; min-height:100vh; background:#0d1430; color:#efe9d8;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    display:flex; align-items:center; justify-content:center; text-align:center; }
  html[data-lost] body{ display:flex; }
  .box{ padding:2rem; max-width:32rem; }
  h1{ font-size:3rem; margin:0 0 .3rem; letter-spacing:-.02em; }
  p{ color:#b9bcd6; line-height:1.6; margin:.3rem 0 1.4rem; }
  a{ display:inline-block; padding:.6rem 1.2rem; border-radius:10px;
    background:#d4af37; color:#0d1430; text-decoration:none; font-weight:700; }
</style>
<noscript><style>body{display:flex!important}</style></noscript>
</head>
<body>
  <main class="box">
    <h1>404</h1>
    <p>Esta ruta no existe. Si buscabas una app o un doc por su nombre corto,
       revisa que esté bien escrito.</p>
    <a href="/">← Volver a flove.org</a>
  </main>
</body>
</html>
`;
writeFileSync(join(ROOT,'404.html'), html);

// ---------- informe ----------
const names = Object.keys(map).sort();
console.log(`\n404.html generado · ${names.length} motes\n`);
for (const n of names) console.log(`  /${n}`.padEnd(26) + '→  ' + map[n]);
if (skips.length){ console.log('\nOmitidos:'); for (const s of skips) console.log('  · ' + s); }
console.log('');
