#!/usr/bin/env bash
# publish-lowai.sh — publish flove/apps/lowai → GitHub LowAiorg/web → lowai.org.
#
# Source of truth = flove/apps/lowai (you edit it here, in the flove repo — this
# script lives in that folder). It syncs the folder's content into LowAiorg/web,
# PRESERVING the repo's meta (CNAME, .github, README.md, .gitignore) and skipping
# this script itself, then commits + pushes. GitHub Pages serves it at lowai.org.
#
# lowai also ships to flove.org (via the normal Gitea → update-web flow) and is
# excluded from the offline download (build-flove-zip.sh strips apps/lowai).
set -euo pipefail

SRC="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"   # this folder = flove/apps/lowai
TOKEN=$(grep -oP 'github_pat_\S+' "$HOME/Claude/token-github-lowai.md" 2>/dev/null | head -1)
[ -n "${TOKEN:-}" ] || { echo "no GitHub token in ~/Claude/token-github-lowai.md"; exit 1; }
command -v rsync >/dev/null || { echo "need 'rsync'"; exit 1; }
[ -d "$SRC" ] || { echo "no existe $SRC"; exit 1; }

STAGE="$(mktemp -d)"
git clone -q "https://x-access-token:${TOKEN}@github.com/LowAiorg/web.git" "$STAGE"

# Mirror the lowai content, but never touch the repo's meta files, and never
# publish this script itself (it lives inside the source folder now).
rsync -a --delete \
  --exclude='.git/' --exclude='.github/' --exclude='CNAME' --exclude='README.md' --exclude='.gitignore' \
  --exclude='publish-lowai.sh' \
  "$SRC/" "$STAGE/"

cd "$STAGE"
git add -A
if git diff --cached --quiet; then
  echo "lowai: sin cambios que publicar"
else
  git -c user.name='Marc' -c user.email='marc@futbolia.org' commit -q -m "publish lowai from flove/apps/lowai"
  git push -q origin main
  echo "published → lowai.org (LowAiorg/web)"
fi
rm -rf "$STAGE"
