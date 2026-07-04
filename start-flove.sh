#!/usr/bin/env bash
# start-flove.sh — sirve ESTA carpeta flove en localhost y abre su index.html.
# Portable: se autolocaliza, así que funciona esté donde esté la carpeta flove.
# Se lanza con doble clic vía "flove-localhost.desktop" (a su lado), o a mano.
set -uo pipefail

# Carpeta donde vive este script = raíz de flove (resuelve symlinks).
ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
PORT=8642
ENTRY="launch.html"                     # puerta de idioma EN/ES; reenvía a la app tras elegir (relativa a la raíz flove)
URL="http://localhost:${PORT}/${ENTRY}"

port_open() { (exec 3<>"/dev/tcp/127.0.0.1/${PORT}") 2>/dev/null; }

if ! port_open; then
  cd "$ROOT" || { command -v notify-send >/dev/null && notify-send "flove" "No encuentro la carpeta"; exit 1; }
  nohup python3 -m http.server "$PORT" >/tmp/flove-server.log 2>&1 &
  disown
  for _ in $(seq 1 20); do port_open && break; sleep 0.2; done
fi

if port_open; then
  # Ruta normal: localhost (persistencia fiable, módulos, secure context).
  xdg-open "$URL" >/dev/null 2>&1 &
else
  # Fallback: no se pudo levantar el servidor (¿sin python3? ¿puerto bloqueado?)
  # → abrir el fichero directo en file:// — abre igual, pero degradado
  # (localStorage puede no persistir; módulos/fetch/SVG <use> limitados).
  command -v notify-send >/dev/null && notify-send "flove" \
    "Sin servidor local — abriendo en modo fichero (file://). La persistencia puede no guardarse."
  xdg-open "$ROOT/${ENTRY}" >/dev/null 2>&1 &
fi
