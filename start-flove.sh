#!/usr/bin/env bash
# start-flove.sh — sirve ESTA carpeta flove en localhost y abre su index.html.
# Portable: se autolocaliza, así que funciona esté donde esté la carpeta flove.
# Se lanza con doble clic vía "flove-localhost.desktop" (a su lado), o a mano.
set -uo pipefail

# Carpeta donde vive este script = raíz de flove (resuelve symlinks).
ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
PORT=8000
URL="http://localhost:${PORT}/index.html"

port_open() { (exec 3<>"/dev/tcp/127.0.0.1/${PORT}") 2>/dev/null; }

if ! port_open; then
  cd "$ROOT" || { command -v notify-send >/dev/null && notify-send "flove" "No encuentro la carpeta"; exit 1; }
  nohup python3 -m http.server "$PORT" >/tmp/flove-server.log 2>&1 &
  disown
  for _ in $(seq 1 20); do port_open && break; sleep 0.2; done
fi

xdg-open "$URL" >/dev/null 2>&1 &
