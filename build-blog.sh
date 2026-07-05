#!/usr/bin/env bash
# build-blog.sh — builds the Hugo blog (blog-src/) into /blog, the static output
# served at https://flove.org/blog/. Zero-JS 'flovelite' theme, no CI: after
# editing posts, run this, then commit the generated /blog.
#
# Usage:
#   ./build-blog.sh          # build ../blog (production, minified)
#   ./build-blog.sh serve    # live preview at http://localhost:1313/ (drafts on)
set -euo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
SRC="$ROOT/blog-src"

command -v hugo >/dev/null || {
  echo "need 'hugo' (extended) — https://gohugo.io/installation/  (or: snap install hugo --channel=extended)"; exit 1; }

if [ "${1:-}" = "serve" ]; then
  exec hugo server --source "$SRC" -D
fi

rm -rf "$ROOT/blog"
hugo --source "$SRC" --destination "../blog" --minify
echo "built $ROOT/blog ($(find "$ROOT/blog" -type f | wc -l) files)"
