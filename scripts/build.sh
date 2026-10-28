#!/usr/bin/env bash
# Concatenates src/*.js into dist/deepal-s05-card.js (single file, no dependencies).
set -euo pipefail
cd "$(dirname "$0")/.."
# Τα αγγλικά και τα ισπανικά μπαίνουν ΜΕΣΑ στο κύριο αρχείο, ώστε η γλώσσα να δουλεύει και όταν ο φάκελος lang/ δεν έχει εγκατασταθεί (π.χ. HACS που κατεβάζει μόνο το .js).
cat src/00_head.js src/02_telltales.js src/05_i18n.js dist/lang/en.js dist/lang/es.js src/10_data.js src/20_discover.js src/30_card.js src/40_settings.js src/50_end.js > dist/deepal-s05-card.js
node --check dist/deepal-s05-card.js
for f in dist/lang/*.js; do node --check "$f"; done
echo "built dist/deepal-s05-card.js ($(wc -c < dist/deepal-s05-card.js) bytes)"
