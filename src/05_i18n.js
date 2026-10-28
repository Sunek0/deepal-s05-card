
/* ───────────────────────── Γλώσσες (i18n) ─────────────────────────
 * Τα κείμενα στον κώδικα είναι ελληνικά και λειτουργούν ως «κλειδιά». Κάθε άλλη γλώσσα
 * είναι ένα αρχείο lang/<κωδικός>.js δίπλα στην κάρτα, που αντιστοιχίζει ελληνικό κείμενο → μετάφραση:
 *   (window.__DEEPAL_S05_LANGS = window.__DEEPAL_S05_LANGS || {}).de = { name: "Deutsch", dict: { "Κλείδωμα": "Sperren", … } };
 * Η γλώσσα διαλέγεται αυτόματα από τη γλώσσα του HA (ή από τη ρύθμιση «Γλώσσα»). Αν λείπει το αρχείο
 * της γλώσσας, χρησιμοποιείται το αγγλικό. Οι μεταφράσεις εφαρμόζονται σε όλο το DOM της κάρτας
 * (κείμενα + title/aria-label/placeholder), και με T() στις προτάσεις όπου μετράει η σειρά των λέξεων. */
const LANGS = (window.__DEEPAL_S05_LANGS = window.__DEEPAL_S05_LANGS || {});
const GL = "Ͱ-Ͽἀ-῿";
const I18N = {
  lang: "el", wanted: null, ready: true, dict: null, re: null, subs: new Set(), roots: new Set(),
  rec: new WeakMap(), arec: new WeakMap(), attrs: ["title", "aria-label", "placeholder", "alt"],
  norm(c) { return String(c || "el").toLowerCase().replace("_", "-"); },
  available() { const o = { el: "Ελληνικά", en: "English", es: "Español" }; for (const [k, v] of Object.entries(LANGS)) o[k] = v.name || k; return Object.entries(o); },
  numLocale() { return this.lang === "el" ? "el-GR" : this.lang; },
  _load(code) {
    return new Promise((res) => {
      if (LANGS[code]) return res(true);
      const s = document.createElement("script");
      s.src = `${SCRIPT_BASE}lang/${code}.js`; s.async = true;
      s.onload = () => res(!!LANGS[code]); s.onerror = () => res(false);
      document.head.appendChild(s);
    });
  },
  _set(code, table) {
    this.lang = code;
    if (!table) { this.dict = null; this.tdict = null; this.re = null; return; }
    const d = {}, cp = (s, f) => (s ? f(s[0]) + s.slice(1) : s);
    for (const [k, v] of Object.entries(table.dict || {})) {
      if (/\{\d+\}/.test(k)) continue; // τα κλειδιά με {0} είναι μόνο για το T()
      d[k] = v;
      const ku = cp(k, (c) => c.toUpperCase()), kl = cp(k, (c) => c.toLowerCase());
      if (!(ku in d)) d[ku] = cp(v, (c) => c.toUpperCase());
      if (!(kl in d)) d[kl] = cp(v, (c) => c.toLowerCase());
    }
    this.dict = Object.assign(d, {}); this.tdict = table.dict;
    const keys = Object.keys(d).sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    this.re = keys.length ? new RegExp(`(?<![${GL}])(?:${keys.join("|")})(?![${GL}])`, "g") : null;
  },
  request(want) {
    const code = this.norm(want);
    if (code === this.wanted) return;
    this.wanted = code;
    const base = code.split("-")[0];
    if (base === "el") { this._set("el", null); this.ready = true; this.changed(); return; }
    this.ready = false;
    (async () => {
      let use = null;
      for (const c of [...new Set([code, base, "en"])]) { if (await this._load(c)) { use = c; break; } }
      if (this.wanted !== code) return;
      this._set(use || "el", use ? LANGS[use] : null); this.ready = true; this.changed();
    })();
  },
  changed() { this.roots.forEach((r) => this.node(r)); this.subs.forEach((c) => { try { c._built = false; c._sig = null; c._force && c._force(); } catch (_) {} }); },
  tr(s) { return this.re ? s.replace(this.re, (m) => this.dict[m]) : s; },
  t(s, a) { let o = (this.tdict && this.tdict[s]) ?? s; return a && a.length ? o.replace(/\{(\d+)\}/g, (m, i) => (a[i] ?? "")) : o; },
  text(n) {
    if (!this.re && !this.rec.has(n)) return;
    const cur = n.nodeValue, r = this.rec.get(n), src = r && r.out === cur ? r.src : cur;
    if (!r && !GREEK.test(cur)) return;
    const out = this.tr(src); this.rec.set(n, { src, out }); if (out !== cur) n.nodeValue = out;
  },
  attr(el, name) {
    if (!this.re && !this.arec.has(el)) return;
    const cur = el.getAttribute(name); if (cur == null) return;
    const m = this.arec.get(el) || {}, r = m[name], src = r && r.out === cur ? r.src : cur;
    if (!r && !GREEK.test(cur)) return;
    const out = this.tr(src); m[name] = { src, out }; this.arec.set(el, m); if (out !== cur) el.setAttribute(name, out);
  },
  node(n) {
    if (n.nodeType === 3) return this.text(n);
    if (n.nodeType !== 1 && n.nodeType !== 11) return;
    if (n.nodeType === 1) { if (/^(STYLE|SCRIPT|TEXTAREA)$/.test(n.tagName)) return; for (const a of this.attrs) if (n.hasAttribute(a)) this.attr(n, a); }
    for (let c = n.firstChild; c; c = c.nextSibling) this.node(c);
  },
  watch(root) {
    if (this.roots.has(root)) return;
    this.roots.add(root);
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "childList") m.addedNodes.forEach((n) => this.node(n));
        else if (m.type === "characterData") { if (!m.target.parentNode || m.target.parentNode.tagName !== "TEXTAREA") this.text(m.target); }
        else if (m.type === "attributes") this.attr(m.target, m.attributeName);
      }
    }).observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: this.attrs });
    this.node(root);
  },
};
const GREEK = new RegExp(`[${GL}]`);
const T = (s, ...a) => I18N.t(s, a);
