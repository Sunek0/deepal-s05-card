
customElements.define(SETTINGS_TAG, DeepalS05Settings);
customElements.define(EDITOR_TAG, DeepalS05CardEditor);
customElements.define(TAG, DeepalS05Card);

window.customCards = window.customCards || [];
if (!window.customCards.some((x) => x.type === TAG)) {
  window.customCards.push({ type: TAG, name: "Deepal S05 Control Panel", description: "Control panel for the Deepal S05 (EV/PHEV): lock and climate controls, charging, tyres, doors and windows, interior, trip and fuel data, and a diagnostics page. Works with the Deepal Alternative integration.", preview: true, documentationURL: "https://github.com/rmxs/deepal-s05-card" });
}
console.info(`%c DEEPAL-S05-CARD %c v${CARD_VERSION} `, "background:#E20074;color:#fff;border-radius:4px 0 0 4px;padding:2px 4px", "background:#222;color:#fff;border-radius:0 4px 4px 0;padding:2px 4px");
})();
