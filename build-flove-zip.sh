#!/usr/bin/env bash
# build-flove-zip.sh — builds flove.zip, the runnable local package that the
# "Download / Go local" button on the home page hands out.
#
# Source of truth = the COMMITTED site (git archive HEAD), so the package is
# exactly what flove.org serves: no .git, no CI config, no gitignored dev cruft.
# The package-only launcher (start-flove.sh + flove-localhost.desktop) is NOT
# tracked in the repo — it's GENERATED here, so the served root stays clean and
# no machine-specific path ever lands in git. Commit your site changes BEFORE
# running this, then commit flove.zip.
set -euo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
cd "$ROOT"

command -v zip >/dev/null || { echo "need 'zip' installed"; exit 1; }

STAGE="$(mktemp -d)"
TARGET="$STAGE/flove"
mkdir -p "$TARGET"

# Exactly the tracked files at HEAD (mirrors the deployed site).
git archive --format=tar HEAD | tar -x -C "$TARGET"

# Things that make no sense inside a downloaded local copy.
rm -f  "$TARGET/flove.zip" "$TARGET/build-flove-zip.sh" \
       "$TARGET/.gitignore" "$TARGET/.htmlvalidate.json" \
       "$TARGET/CNAME" "$TARGET/.nojekyll"

# Web-only — kept on the live site but NOT bundled into the offline download:
# the blog (separate repo, gitignored so not even in the archive) and these
# standalone extras.
rm -rf "$TARGET/blog" "$TARGET/others/lowai" "$TARGET/others/ephemerall" "$TARGET/others/anim-form.html"

# ── Package-only launcher (generated, not tracked — keeps the served root clean).
# start-flove.sh: self-locating local server that opens the language gate.
cat > "$TARGET/start-flove.sh" <<'SH'
#!/usr/bin/env bash
# start-flove.sh — sirve ESTA carpeta flove en localhost y abre launch.html.
# Portable: se autolocaliza, así que funciona esté donde esté la carpeta flove.
# Se lanza con doble clic vía "flove-localhost.desktop" (a su lado), o a mano.
set -uo pipefail

# Carpeta donde vive este script = raíz de flove (resuelve symlinks).
ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
PORT=8642
ENTRY="launch.html"                     # selector de idioma EN/ES; reenvía a la app tras elegir (relativa a la raíz flove)
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
SH
chmod +x "$TARGET/start-flove.sh"

# flove-localhost.desktop: double-click launcher; portable RELATIVE Icon so the
# classical flove mark shows wherever the zip is unzipped (not Marc's abs path).
cat > "$TARGET/flove-localhost.desktop" <<'DESKTOP'
[Desktop Entry]
Version=1.0
Type=Application
Name=Abrir flove (localhost)
Name[es]=Abrir flove (localhost)
Comment=Sirve esta carpeta flove en localhost y abre el selector de idioma
Comment[es]=Sirve esta carpeta flove en localhost y abre el selector de idioma
Exec=bash -c 'p="$1"; p="${p#file://}"; p="$(python3 -c "import sys,urllib.parse as u; print(u.unquote(sys.argv[1]))" "$p")"; exec "$(dirname "$p")/start-flove.sh"' flove %k
Icon=flove-icon.svg
Terminal=false
StartupNotify=true
Categories=Network;
DESKTOP
chmod +x "$TARGET/flove-localhost.desktop"

rm -f "$ROOT/flove.zip"
( cd "$STAGE" && zip -rqX "$ROOT/flove.zip" flove )
rm -rf "$STAGE"

echo "built $ROOT/flove.zip ($(du -h "$ROOT/flove.zip" | cut -f1))"
