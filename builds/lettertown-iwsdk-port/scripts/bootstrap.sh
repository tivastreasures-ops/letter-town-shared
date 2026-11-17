#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test -f ../lettertown-chapter-one-r8/rules/game.js || { echo "Full shared repo checkout required" >&2; exit 1; }
npx @iwsdk/create@latest . --yes --target vr --grabbing --locomotion --no-physics --language js --no-git
node scripts/stage-assets.mjs
npm run build