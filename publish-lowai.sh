#!/usr/bin/env bash
# publish-lowai.sh — publish flove/others/lowai → GitHub LowAiorg/web → lowai.org.
#
# Source of truth = flove/others/lowai (you edit it here, in the flove repo).
# This syncs that folder's content into LowAiorg/web, PRESERVING the repo's meta
# (CNAME, .github, README.md, .gitignore), then commits + pushes. GitHub Pages
# serves LowAiorg/web at lowai.org.
#
# lowai also ships to flove.org (via the normal Gitea → update-web flow) and is
# excluded from the offline download (build-flove-zip.sh strips others/lowai).
set -euo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
SRC="$ROOT/others/lowai"
TOKEN=$(grep -oP 'github_pat_\S+' "$HOME/token-github-lowai.md" 2>/dev/null | head -1)
[ -n "${TOKEN:-}" ] || { echo "no GitHub token in ~/token-github-lowai.md"; exit 1; }
command -v rsync >/dev/null || { echo "need 'rsync'"; exit 1; }
[ -d "$SRC" ] || { echo "no existe $SRC"; exit 1; }

STAGE="$(mktemp -d)"
git clone -q "https://x-access-token:${TOKEN}@github.com/LowAiorg/web.git" "$STAGE"

# Mirror the lowai content, but never touch the repo's meta files.
rsync -a --delete \
  --exclude='.git/' --exclude='.github/' --exclude='CNAME' --exclude='README.md' --exclude='.gitignore' \
  "$SRC/" "$STAGE/"

cd "$STAGE"
git add -A
if git diff --cached --quiet; then
  echo "lowai: sin cambios que publicar"
else
  git -c user.name='Marc' -c user.email='marc@futbolia.org' commit -q -m "publish lowai from flove/others/lowai"
  git push -q origin main
  echo "published → lowai.org (LowAiorg/web)"
fi
rm -rf "$STAGE"
