#!/usr/bin/env bash
# build-flove-zip.sh — builds flove.zip, the runnable local package that the
# "Download / Go local" button on the home page hands out.
#
# Source of truth = the COMMITTED site (git archive HEAD), so the package is
# exactly what flove.org serves: no .git, no CI config, no gitignored dev cruft.
# The package-only launchers (START-FLOVE-LINUX.sh / -MAC.command / -WINDOWS.bat)
# are NOT tracked in the repo — they're GENERATED here and sit at the zip ROOT
# beside the flove/ folder. The Linux script creates its own menu/Desktop icon on
# first run (so no .desktop is shipped). Commit site changes BEFORE running this.
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
       "$TARGET/build-aliases.mjs" "$TARGET/404.html" \
       "$TARGET/.gitignore" "$TARGET/.htmlvalidate.json" \
       "$TARGET/CNAME" "$TARGET/.nojekyll"

# Web-only — kept on the live site but NOT bundled into the offline download:
# the blog (separate repo, gitignored so not even in the archive), the whole
# behind-the-scenes docs/making-of/ folder, and these standalone extras. apps/lowai
# carries its own publish-lowai.sh, stripped here with the rest of the lowai folder.
rm -rf "$TARGET/blog" "$TARGET/docs/making-of" \
       "$TARGET/apps/lowai" "$TARGET/apps/ephemerall" "$TARGET/apps/anim-form.html"

# Make the entry obvious in the download: rename launch.html -> START.html
# (download only — the live site keeps launch.html). Keep the local copy's
# manifest + service worker pointing at the new name so localhost stays consistent.
if [ -f "$TARGET/launch.html" ]; then
  mv "$TARGET/launch.html" "$TARGET/START.html"
  sed -i 's#/launch\.html#/START.html#g' "$TARGET/manifest.webmanifest" "$TARGET/sw.js" 2>/dev/null || true
  # Landing page in the download = the language selector on every launch: drop the
  # "auto-skip to index.html when a language is remembered" line (live site keeps it).
  sed -i "s|.*saved === 'en'.*return;.*|      // download: the language selector stays the landing (no auto-skip)|" "$TARGET/START.html"
fi

# ── Package-only launchers (generated, not tracked), one per desktop OS, at the
# ZIP ROOT next to flove/. Each serves the flove/ folder on localhost:8642 and
# opens START.html. Needs python3 (preinstalled on Linux & macOS).
cat > "$STAGE/START-FLOVE-LINUX.sh" <<'SH'
#!/usr/bin/env bash
# START-FLOVE-LINUX.sh — run this. Serves the flove/ folder beside this script and
# opens flove/START.html at http://localhost:8642. On first run it also drops a flove
# icon into your applications menu (and Desktop), so next time you launch from there.
set -uo pipefail

SELF="$(readlink -f "$0")"
HERE="$(cd "$(dirname "$SELF")" && pwd)"
ROOT="$HERE/flove"                      # web root = the flove/ folder next to this script
PORT=8642
ENTRY="START.html"
URL="http://localhost:${PORT}/${ENTRY}"

port_open() { (exec 3<>"/dev/tcp/127.0.0.1/${PORT}") 2>/dev/null; }
opener() { xdg-open "$1" >/dev/null 2>&1 || open "$1" >/dev/null 2>&1 & }

# Create a real menu/desktop icon that points back to this very script.
make_icon() {
  local apps="$HOME/.local/share/applications"
  mkdir -p "$apps" 2>/dev/null || return 0
  cat > "$apps/flove-localhost.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=flove (localhost)
Comment=Serve flove on localhost and open it
Exec="$SELF"
Icon=$ROOT/images/flove-icon.svg
Terminal=false
StartupNotify=true
Categories=Network;
EOF
  chmod +x "$apps/flove-localhost.desktop" 2>/dev/null || true
  update-desktop-database "$apps" >/dev/null 2>&1 || true
  if [ -d "$HOME/Desktop" ]; then
    cp "$apps/flove-localhost.desktop" "$HOME/Desktop/" 2>/dev/null || true
    chmod +x "$HOME/Desktop/flove-localhost.desktop" 2>/dev/null || true
    gio set "$HOME/Desktop/flove-localhost.desktop" metadata::trusted true 2>/dev/null || true
  fi
}
make_icon

if ! port_open; then
  cd "$ROOT" || { command -v notify-send >/dev/null && notify-send "flove" "No encuentro la carpeta flove/"; exit 1; }
  nohup python3 -m http.server "$PORT" >/tmp/flove-server.log 2>&1 &
  disown
  for _ in $(seq 1 20); do port_open && break; sleep 0.2; done
fi

if port_open; then
  opener "$URL"                          # localhost: reliable storage + secure context
else
  command -v notify-send >/dev/null && notify-send "flove" \
    "Sin servidor local — abriendo el fichero directo (file://), modo degradado."
  opener "$ROOT/${ENTRY}"
fi
SH
chmod +x "$STAGE/START-FLOVE-LINUX.sh"

# macOS double-click launcher (.command opens in Terminal). readlink -f isn't
# portable on macOS, so locate the folder the simple way; use `open`.
cat > "$STAGE/START-FLOVE-MAC.command" <<'CMD'
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
chmod +x "$STAGE/START-FLOVE-MAC.command"

# Windows launcher. Tries python / py; if neither, opens the file directly.
cat > "$STAGE/START-FLOVE-WINDOWS.bat" <<'BAT'
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

# Mobile: phones can't run a launcher, so this is an HTML page that opens the
# downloaded flove/START.html directly (file://, offline — degraded, no server).
cat > "$STAGE/START-FLOVE-MOBILE.html" <<'HTML'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>flove · mobile</title>
<meta http-equiv="refresh" content="1; url=flove/START.html">
<style>
  html,body{height:100%;margin:0}
  body{display:grid;place-items:center;text-align:center;padding:24px;
       font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
       color:#1a1820;background:#fffdfb}
  img{width:72px;height:72px}
  h1{font-size:1.3rem;margin:.6rem 0 .2rem}
  p{color:#6a6478;margin:.2rem 0 1.2rem;max-width:30ch}
  a.btn{display:inline-block;padding:.7rem 1.4rem;border-radius:999px;font-weight:650;
        text-decoration:none;color:#1a1820;background:linear-gradient(90deg,#ff3344,#ff8a3a,#ffd633)}
  small{display:block;margin-top:1rem;color:#9a94a8;max-width:32ch}
</style>
</head>
<body>
  <div>
    <img src="flove/images/flove-icon.svg" alt="flove">
    <h1>Opening flove…</h1>
    <p>Running the downloaded files on your phone — offline.</p>
    <a class="btn" href="flove/START.html">Open flove</a>
    <small>If it doesn't remember your progress, that's the offline-file limit on phones — for full flove, install it from flove.org.</small>
  </div>
</body>
</html>
HTML

rm -f "$ROOT/flove.zip"
( cd "$STAGE" && zip -rqX "$ROOT/flove.zip" \
    START-FLOVE-LINUX.sh START-FLOVE-MAC.command START-FLOVE-WINDOWS.bat \
    START-FLOVE-MOBILE.html flove )
rm -rf "$STAGE"

echo "built $ROOT/flove.zip ($(du -h "$ROOT/flove.zip" | cut -f1))"
