#!/usr/bin/env bash
# build-flove-zip.sh — builds flove.zip, the runnable local package that the
# "Download / Go local" button on the home page hands out.
#
# Source of truth = the COMMITTED site (git archive HEAD), so the package is
# exactly what flove.org serves: no .git, no CI config, no gitignored dev cruft.
# The package-only launcher (START-FLOVE.sh) is NOT tracked in the repo — it's
# GENERATED here and sits at the zip ROOT beside the flove/ folder, so the
# unzipped download has just two things: START-FLOVE.sh (run this) and flove/.
# Commit your site changes BEFORE running this, then commit flove.zip.
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
rm -f  "$TARGET/flove.zip" "$TARGET/build-flove-zip.sh" "$TARGET/build-sw.mjs" \
       "$TARGET/publish-lowai.sh" "$TARGET/build-aliases.mjs" "$TARGET/404.html" \
       "$TARGET/.gitignore" "$TARGET/.htmlvalidate.json" \
       "$TARGET/CNAME" "$TARGET/.nojekyll"

# Web-only — kept on the live site but NOT bundled into the offline download:
# the blog (separate repo, gitignored so not even in the archive), the dev
# design specs, and these standalone extras.
rm -rf "$TARGET/blog" "$TARGET/docs/superpowers" \
       "$TARGET/others/lowai" "$TARGET/others/ephemerall" "$TARGET/others/anim-form.html"

# Make the entry obvious in the download: rename launch.html -> START.html
# (download only — the live site keeps launch.html). Keep the local copy's
# manifest + service worker pointing at the new name so localhost stays consistent.
if [ -f "$TARGET/launch.html" ]; then
  mv "$TARGET/launch.html" "$TARGET/START.html"
  sed -i 's#/launch\.html#/START.html#g' "$TARGET/manifest.webmanifest" "$TARGET/sw.js" 2>/dev/null || true
fi

# ── Package-only launcher (generated, not tracked). Lives at the ZIP ROOT next to
# flove/, so the unzipped folder shows just two things: START-FLOVE.sh (run this)
# and flove/ (everything else). It serves the flove/ folder on localhost:8642 and
# opens START.html. Needs python3 (preinstalled on Linux & macOS).
cat > "$STAGE/START-FLOVE.sh" <<'SH'
#!/usr/bin/env bash
# START-FLOVE.sh — run this. Starts a local server for the flove/ folder beside
# this script and opens flove/START.html at http://localhost:8642. Self-locating,
# so it works wherever you unzip flove.zip.
set -uo pipefail

HERE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
ROOT="$HERE/flove"                      # web root = the flove/ folder next to this script
PORT=8642
ENTRY="START.html"
URL="http://localhost:${PORT}/${ENTRY}"

port_open() { (exec 3<>"/dev/tcp/127.0.0.1/${PORT}") 2>/dev/null; }
opener() { xdg-open "$1" >/dev/null 2>&1 || open "$1" >/dev/null 2>&1 & }

if ! port_open; then
  cd "$ROOT" || { command -v notify-send >/dev/null && notify-send "flove" "No encuentro la carpeta flove/"; exit 1; }
  nohup python3 -m http.server "$PORT" >/tmp/flove-server.log 2>&1 &
  disown
  for _ in $(seq 1 20); do port_open && break; sleep 0.2; done
fi

if port_open; then
  opener "$URL"                          # localhost: reliable storage + secure context
else
  # No server (no python3? port blocked?) → open the file directly (degraded file://).
  command -v notify-send >/dev/null && notify-send "flove" \
    "Sin servidor local — abriendo el fichero directo (file://), modo degradado."
  opener "$ROOT/${ENTRY}"
fi
SH
chmod +x "$STAGE/START-FLOVE.sh"

# macOS double-click launcher (.command opens in Terminal). readlink -f isn't
# portable on macOS, so locate the folder the simple way; use `open`.
cat > "$STAGE/START-FLOVE.command" <<'CMD'
#!/usr/bin/env bash
# START-FLOVE.command — macOS: serves the flove/ folder beside this file and opens
# flove/START.html at http://localhost:8642. Double-click it (needs python3).
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$HERE/flove"
PORT=8642
URL="http://localhost:${PORT}/START.html"
port_open() { (exec 3<>"/dev/tcp/127.0.0.1/${PORT}") 2>/dev/null; }
if ! port_open; then
  cd "$ROOT" || exit 1
  if command -v python3 >/dev/null; then
    nohup python3 -m http.server "$PORT" >/tmp/flove-server.log 2>&1 &
    for _ in $(seq 1 20); do port_open && break; sleep 0.2; done
  fi
fi
if port_open; then open "$URL"; else open "$ROOT/START.html"; fi
CMD
chmod +x "$STAGE/START-FLOVE.command"

# Windows launcher. Tries python / py; if neither, opens the file directly.
cat > "$STAGE/START-FLOVE.bat" <<'BAT'
@echo off
REM START-FLOVE.bat - serves the flove\ folder and opens START.html on localhost:8642
setlocal
cd /d "%~dp0flove"
where python >nul 2>nul
if %errorlevel%==0 (
  start "flove server" /min python -m http.server 8642
  timeout /t 1 >nul
  start "" http://localhost:8642/START.html
  goto :eof
)
where py >nul 2>nul
if %errorlevel%==0 (
  start "flove server" /min py -m http.server 8642
  timeout /t 1 >nul
  start "" http://localhost:8642/START.html
  goto :eof
)
echo Python not found - opening the file directly ^(some features may be limited^).
start "" START.html
BAT

# Linux double-click launcher (some file managers won't run a .sh on double-click).
cat > "$STAGE/Open-flove.desktop" <<'DESKTOP'
[Desktop Entry]
Version=1.0
Type=Application
Name=flove (localhost)
Name[es]=flove (localhost)
Comment=Serve the flove folder on localhost and open START.html
Comment[es]=Sirve la carpeta flove en localhost y abre START.html
Exec=bash -c 'p="$1"; p="${p#file://}"; p="$(python3 -c "import sys,urllib.parse as u; print(u.unquote(sys.argv[1]))" "$p")"; exec "$(dirname "$p")/START-FLOVE.sh"' flove %k
Icon=flove/images/flove-icon.svg
Terminal=false
StartupNotify=true
Categories=Network;
DESKTOP
chmod +x "$STAGE/Open-flove.desktop"

rm -f "$ROOT/flove.zip"
( cd "$STAGE" && zip -rqX "$ROOT/flove.zip" \
    START-FLOVE.sh START-FLOVE.command START-FLOVE.bat Open-flove.desktop flove )
rm -rf "$STAGE"

echo "built $ROOT/flove.zip ($(du -h "$ROOT/flove.zip" | cut -f1))"
