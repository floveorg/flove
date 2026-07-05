#!/usr/bin/env bash
# build-blog.sh — builds the Hugo blog into /blog, the static output served at
# https://flove.org/blog/. Everything lives under ONE folder:
#
#   blog/         ← built HTML (index.html, posts/, css/…)  — served, committed
#   blog/_src/    ← Hugo source (hugo.toml, content/, themes/flovelite)
#
# Zero-JS 'flovelite' theme, no CI: after editing posts, run this, then commit
# the regenerated /blog.
#
# Usage:
#   ./build-blog.sh          # build (production, minified)
#   ./build-blog.sh serve    # live preview at http://localhost:1313/ (drafts on)
set -euo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
SRC="$ROOT/blog/_src"
OUT="$ROOT/blog"

command -v hugo >/dev/null || {
  echo "need 'hugo' (extended) — https://gohugo.io/installation/  (or: snap install hugo --channel=extended)"; exit 1; }

if [ "${1:-}" = "serve" ]; then
  exec hugo server --source "$SRC" -D
fi

# Build into blog/_src/public (Hugo's default, gitignored), then swap it into
# blog/ — replacing the old built files but preserving the nested _src/.
hugo --source "$SRC" --minify
find "$OUT" -mindepth 1 -maxdepth 1 ! -name '_src' -exec rm -rf {} +
cp -a "$SRC/public/." "$OUT/"
rm -rf "$SRC/public"
echo "built $OUT ($(find "$OUT" -path "$SRC" -prune -o -type f -print | wc -l) files, _src preserved)"
