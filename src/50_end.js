
customElements.define(SETTINGS_TAG, DeepalS05Settings);
customElements.define(EDITOR_TAG, DeepalS05CardEditor);
customElements.define(TAG, DeepalS05Card);

window.customCards = window.customCards || [];
if (!window.customCards.some((x) => x.type === TAG)) {
  window.customCards.push({ type: TAG, name: "Deepal S05", description: "Deepal vehicle card (S05 EV/PHEV): controls, status, charging, tyres, interior, diagnostics. Works with the Deepal Alternative integration.", preview: false });
}
console.info(`%c DEEPAL-S05-CARD %c v${CARD_VERSION} `, "background:#E20074;color:#fff;border-radius:4px 0 0 4px;padding:2px 4px", "background:#222;color:#fff;border-radius:0 4px 4px 0;padding:2px 4px");
})();
