#!/usr/bin/env bash
# Concatenates src/*.js into dist/deepal-s05-card.js (single file, no dependencies).
set -euo pipefail
cd "$(dirname "$0")/.."
# HACS installs the whole dist/ tree; fail early if a required part is missing.
test -f dist/lang/en.js
test -f dist/lang/es.js
test -d dist/images
cat src/00_head.js src/02_telltales.js src/05_i18n.js src/10_data.js src/20_discover.js src/30_card.js src/40_settings.js src/50_end.js > dist/deepal-s05-card.js
node --check dist/deepal-s05-card.js
for f in dist/lang/*.js; do node --check "$f"; done
echo "built dist/deepal-s05-card.js ($(wc -c < dist/deepal-s05-card.js) bytes)"
