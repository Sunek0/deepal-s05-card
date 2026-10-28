#!/usr/bin/env bash
# Concatenates src/*.js into dist/deepal-s05-card.js (single file, no dependencies).
set -euo pipefail
cd "$(dirname "$0")/.."
cat src/00_head.js src/05_i18n.js src/10_data.js src/30_card.js src/40_settings.js src/50_end.js > dist/deepal-s05-card.js
node --check dist/deepal-s05-card.js
for f in dist/lang/*.js; do node --check "$f"; done
echo "built dist/deepal-s05-card.js ($(wc -c < dist/deepal-s05-card.js) bytes)"
