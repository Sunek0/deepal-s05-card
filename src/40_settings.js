
/* ───────────────────────── Ρυθμίσεις (UI) ─────────────────────────
 * Ένα κοινό στοιχείο που χρησιμοποιείται και μέσα στην κάρτα (αποθήκευση στη συσκευή)
 * και στον επεξεργαστή του Home Assistant (αποθήκευση στο YAML της κάρτας). */
const TOP_FILES_ALL = ["base", "low_beam_on", "hood_open", "hood_closed", "trunk_open", "trunk_closed", "door_front_left_open", "door_front_left_closed",
  "door_front_right_open", "door_front_right_closed", "door_rear_left_open", "door_rear_left_closed", "door_rear_right_open", "door_rear_right_closed",
  "window_front_left_open", "window_front_right_open", "window_rear_left_open", "window_rear_right_open"];
const ALL_FILES = { ...HERO_FILES, ...DASH_FILES };
const INT_FILES_ALL = ["base", ...INT_LAYERS];
const heroBases = (c) => (c.image_path ? [normPath(c.image_path)] : [`${SCRIPT_BASE}images/car/`]);
const layerBase = (c) => (c.layers_path ? normPath(c.layers_path) : `${SCRIPT_BASE}images/`);

class DeepalS05Settings extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }); I18N.watch(this.shadowRoot);
    this.mode = "card"; this.tab = "sections"; this._form = { entity: "", label: "", icon: "info", mkey: "", ment: "" };
    this._sig = null; this._note = "";
  }
  set hass(h) { this._hass = h; }
  set cfg(c) {
    const s = JSON.stringify(c);
    if (s === this._sig) return;
    this._sig = s; this._cfg = c; this._render();
  }
  get cfg() { return this._cfg; }
  _emit(p) { this.onPatch && this.onPatch(p); }
  _setTab(t) { this.tab = t; this.onTab && this.onTab(t); this._render(); }

  _tabs() {
    const T = [["sections", "Ενότητες"], ["buttons", "Κουμπιά"], ["sensors", "Αισθητήρες"], ["images", "Εικόνες"], ["general", "Γενικά"]];
    return `<div class="tabs">${T.map(([k, l]) => `<button data-tab="${k}" class="${this.tab === k ? "on" : ""}">${l}</button>`).join("")}</div>`;
  }
  _orderList(all, order, hidden, labelOf, kind) {
    return `<div class="list">${order.map((id, i) => {
      const off = hidden.includes(id);
      return `<div class="row ${off ? "off" : ""}"><span>${esc(labelOf(id))}</span>
        <button class="mv" data-mv="${kind}|${id}|-1" ${i === 0 ? "disabled" : ""} aria-label="Πάνω">${ico("up")}</button>
        <button class="mv" data-mv="${kind}|${id}|1" ${i === order.length - 1 ? "disabled" : ""} aria-label="Κάτω">${ico("down")}</button>
        <button class="swb" data-vis="${kind}|${id}" aria-label="Εμφάνιση"><i class="sw ${off ? "" : "on"}"></i></button></div>`;
    }).join("")}</div>`;
  }
  _sel(name, val, opts) { return `<select data-set="${name}">${opts.map(([v, l]) => `<option value="${v}" ${String(v) === String(val) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`; }
  _num(name, val, step = "0.1") { return `<input type="number" step="${step}" data-set="${name}" data-num value="${esc(val)}">`; }
  _datalist() {
    const ids = Object.keys(this._hass?.states || {}).sort();
    return `<datalist id="ents">${ids.map((i) => `<option value="${esc(i)}"></option>`).join("")}</datalist>`;
  }
  _iconPick() {
    return `<div class="icons">${PICKABLE_ICONS.map((n) => `<button data-icon="${n}" class="${this._form.icon === n ? "on" : ""}" aria-label="${n}">${ico(n)}</button>`).join("")}</div>`;
  }
  _addForm(kind) {
    return `<div class="add"><label class="field">Οντότητα<input type="text" list="ents" data-f="entity" placeholder="π.χ. sensor.my_value" value="${esc(this._form.entity)}"></label>
      <label class="field">Ετικέτα (προαιρετικά)<input type="text" data-f="label" value="${esc(this._form.label)}"></label>
      <div class="field">Εικονίδιο${this._iconPick()}</div>
      <button class="btn sm" data-add="${kind}">${ico("plus")} Προσθήκη</button></div>`;
  }
  _customRows(arr, kind) {
    return arr.length ? `<div class="list">${arr.map((x, i) => `<div class="row">${ico(x.icon || "info")}<span>${esc(x.label || x.entity)}<small>${esc(x.entity)}</small></span>
      <button class="mv" data-del="${kind}|${i}" aria-label="Διαγραφή">${ico("trash")}</button></div>`).join("")}</div>` : "";
  }

  _tabSections(c) {
    return `<p class="hint">${T("Βάλε τις ενότητες με τη σειρά που θέλεις (π.χ. πρώτα κουμπιά, μετά η εικόνα, μετά η αυτονομία) και κρύψε όσες δεν χρειάζεσαι.")}</p>
      ${this._orderList(SECTIONS, c.order, c.hidden, (i) => SECTION_LABELS[i], "sec")}
      <h4>Πάνω στην εικόνα</h4>
      <div class="list">${HERO_SHOW_OPTS.map(([k, l]) => `<button class="row tg ${(c.hero_show || []).includes(k) ? "on" : ""}" data-hs="${k}"><span>${l}</span><i class="sw ${(c.hero_show || []).includes(k) ? "on" : ""}"></i></button>`).join("")}</div>
      <h4>Κάτοψη</h4>
      <label class="field inline">Κάτοψη ${this._sel("top_orientation", c.top_orientation, [["horizontal", "Οριζόντια"], ["vertical", "Κάθετη"]])}</label>`;
  }
  _tabButtons(c) {
    const conf = [["unlock", "Ξεκλείδωμα"], ["trunk", "Άνοιγμα πορτμπαγκάζ"], ["windows", "Άνοιγμα παραθύρων"]];
    return `<p class="hint">Σειρά και εμφάνιση των κουμπιών ελέγχου.</p>
      ${this._orderList(BUTTON_IDS, c.buttons, c.buttons_hidden, (i) => BUTTON_LABELS[i], "btn")}
      <h4>Εμφάνιση</h4>
      <label class="field inline">Διάταξη ${this._sel("button_layout", c.button_layout, [["grid", "Σειρές (5 ανά γραμμή)"], ["scroll", "Μία γραμμή με scroll"], ["fit", "Μία γραμμή (χωράνε όλα)"]])}</label>
      <label class="field inline">Κείμενα ${this._sel("button_labels", c.button_labels, [["none", "Χωρίς κείμενο"], ["status", "Μόνο κατάσταση"], ["title", "Μόνο τίτλος"], ["both", "Τίτλος + κατάσταση (2 γραμμές)"]])}</label>
      <label class="field inline">Μέγεθος ${this._sel("button_size", c.button_size, [["s", "Μικρά"], ["m", "Μεσαία"], ["l", "Μεγάλα"]])}</label>
      <h4>Ζητά επιβεβαίωση</h4>
      <div class="list">${conf.map(([k, l]) => `<button class="row tg ${c.confirm.includes(k) ? "on" : ""}" data-conf="${k}"><span>${l}</span><i class="sw ${c.confirm.includes(k) ? "on" : ""}"></i></button>`).join("")}</div>`;
  }
  _tabSensors(c) {
    const selIds = Array.isArray(c.diag) ? c.diag : DIAG.map((d) => d[0]);
    const has = (k) => this._hass?.states?.[resolveId(this._hass, c, k)];
    const dRows = DIAG.filter((d) => has(d[0])).map((d) => `<button class="row tg ${selIds.includes(d[0]) ? "on" : ""}" data-diag="${d[0]}">${icoBadge(d[2])}<span>${esc(d[1])}</span><i class="sw ${selIds.includes(d[0]) ? "on" : ""}"></i></button>`).join("");
    const iRows = INFO_IDS.filter((i) => has(INFO_ITEMS[i][0]) && (i !== "fuel_level" || hasFuel(this._hass, c))).map((i) => `<button class="row tg ${c.info.includes(i) ? "on" : ""}" data-info="${i}">${ico(INFO_ITEMS[i][2])}<span>${esc(INFO_ITEMS[i][1])}</span><i class="sw ${c.info.includes(i) ? "on" : ""}"></i></button>`).join("");
    const ents = Object.entries(c.entities);
    return `${this._datalist()}
      <h4>Διαγνωστικά</h4>
      <div class="seg"><button data-dmode="alerts" class="${c.diag_mode === "alerts" ? "on" : ""}">Μόνο ειδοποιήσεις</button><button data-dmode="all" class="${c.diag_mode === "all" ? "on" : ""}">Πάντα όλες</button></div>
      <div class="list">${dRows}</div>
      <div class="btnrow"><button class="btn sm" data-dall="0">Καμία</button><button class="btn sm" data-dall="1">Όλες</button></div>
      <h4>Δικά μου διαγνωστικά</h4>
      <p class="hint">${T("Οποιαδήποτε οντότητα. Θεωρείται ενεργή όταν είναι on / problem / alarm.")}</p>
      ${this._customRows(c.diag_custom, "diag_custom")}${this._addForm("diag_custom")}
      <h4>Πληροφορίες</h4>
      <div class="list">${iRows}</div>
      ${this._customRows(c.info_custom, "info_custom")}${this._addForm("info_custom")}
      <h4>Αντιστοίχιση οντοτήτων</h4>
      <p class="hint">${T("Αν κάποια οντότητα έχει διαφορετικό όνομα από το αναμενόμενο {0}, όρισε εδώ ποια να χρησιμοποιηθεί.", `<code>${esc(c.prefix)}_…</code>`)}</p>
      ${ents.length ? `<div class="list">${ents.map(([k, v]) => `<div class="row"><span>${esc(k)}<small>${esc(v)}</small></span><button class="mv" data-delent="${esc(k)}">${ico("trash")}</button></div>`).join("")}</div>` : ""}
      <div class="add"><label class="field">Κλειδί${this._sel("_mkey", this._form.mkey, [["", "— διάλεξε —"], ...uniq(OTHER_KEYS).map((k) => [k, k])])}</label>
        <label class="field">Οντότητα<input type="text" list="ents" data-f="ment" value="${esc(this._form.ment)}"></label>
        <button class="btn sm" data-addent>${ico("plus")} Αντιστοίχιση</button></div>`;
  }
  _tabImages(c) {
    const hb = heroBases(c), lb = layerBase(c);
    return `<p class="hint">${T("Οι φωτογραφίες και τα layers φορτώνονται από τον φάκελο {0} δίπλα στην κάρτα. Το ανέβασμα αρχείων γίνεται από τον φάκελο, όχι από την κάρτα — εδώ μπορείς να ορίσεις άλλες διαδρομές και να ελέγξεις ότι βρίσκονται.", "<code>images/</code>")}</p>
      <label class="field">Φάκελος φωτογραφιών hero (κενό = αυτόματα)<input type="text" data-set="image_path" data-text value="${esc(c.image_path || "")}" placeholder="${esc(SCRIPT_BASE)}images/car/"></label>
      <label class="field">Φάκελος layers (κενό = images/ δίπλα στην κάρτα)<input type="text" data-set="layers_path" data-text value="${esc(c.layers_path || "")}" placeholder="${esc(SCRIPT_BASE)}images/"></label>
      <div class="grid2"><label class="field">Μεγέθυνση εικόνας${this._num("image_scale", c.image_scale, "0.05")}</label>
        <label class="field">Λόγος διαστάσεων (π.χ. 16 / 9)<input type="text" data-set="image_aspect" data-text value="${esc(c.image_aspect || "")}" placeholder="auto"></label></div>
      <h4>Φωτογραφίες (hero & ταμπλό)</h4>
      <div class="list">${Object.keys(ALL_FILES).map((k) => `<div class="chk"><span class="th" data-probe-hero="${k}"></span><div style="min-width:0;flex:1"><div>${esc(HERO_LABELS[k])}</div><input type="text" data-img="${k}" value="${esc(c.images[k] || "")}" placeholder="${esc(ALL_FILES[k])}"></div><span class="st" data-st-hero="${k}">…</span></div>`).join("")}</div>
      <h4>Layers κάτοψης</h4><div class="list" id="ltop"></div>
      <h4>Layers εσωτερικού</h4><div class="list" id="lint"></div>
      <p class="hint">${T("Φάκελος layers: {0}", `<code>${esc(lb)}</code>`)}</p>`;
  }
  _tabGeneral(c) {
    const cfgOut = this._exportObj();
    return `<label class="field">Όνομα κάρτας<input type="text" data-set="name" data-text value="${esc(c.name)}"></label>
      <label class="field">Γλώσσα${this._sel("language", c.language || "auto", [["auto", "Αυτόματα (γλώσσα του HA)"], ...I18N.available()])}</label>
      <label class="field">Τύπος οχήματος${this._sel("powertrain", c.powertrain || "auto", [["auto", "Αυτόματα (από τους αισθητήρες καυσίμου)"], ["phev", "Plug-in υβριδικό (ρεύμα + βενζίνη)"], ["ev", "Μόνο ηλεκτρικό"]])}</label>
      <label class="field">Εφέ φόρτισης πάνω στο αμάξι${this._sel("charge_fx", c.charge_fx || "flow_port", [["flow_port", "Ροή στο καλώδιο + παλμός στη θύρα"], ["flow", "Ροή ενέργειας στο καλώδιο"], ["port", "Παλμός στη θύρα φόρτισης"], ["sweep", "Σάρωση φωτός πάνω στο αμάξι"], ["none", "Κανένα"]])}</label>
      <div class="list"><button class="row tg ${c.show_customize !== false ? "on" : ""}" data-tgl="show_customize"><span>Κουμπί «Ρυθμίσεις» στην κάρτα</span><i class="sw ${c.show_customize !== false ? "on" : ""}"></i></button></div>
      <p class="hint">${T("Αν το κρύψεις, οι ρυθμίσεις ανοίγουν μόνο από τον επεξεργαστή της κάρτας (Επεξεργασία dashboard).")}</p>
      <div class="list"><button class="row tg ${c.toasts !== false ? "on" : ""}" data-tgl="toasts"><span>Μηνύματα πάνω στην οθόνη</span><i class="sw ${c.toasts !== false ? "on" : ""}"></i></button></div>
      <label class="field">Πρόθεμα οντοτήτων (π.χ. s05)<input type="text" data-set="prefix" data-text value="${esc(c.prefix)}" list="dl-pfx"></label>
      <datalist id="dl-pfx">${pfxCandidates(this._hass).map((p) => `<option value="${esc(p)}"></option>`).join("")}</datalist>
      ${(() => { const e = effPrefix(this._hass, c); return e !== c.prefix ? `<p class="hint">${T("Το πρόθεμα {0} δεν βρέθηκε· χρησιμοποιείται αυτόματα το {1}. Πάτησε το πεδίο για να το αποθηκεύσεις.", `<code>${esc(c.prefix)}</code>`, `<code>${esc(e)}</code>`)}</p>` : ""; })()}
      <h4>Ελαστικά</h4>
      <div class="grid2"><label class="field">Μονάδα${this._sel("tire_unit", c.tire_unit, [["bar", "bar"], ["kPa", "kPa"], ["psi", "psi"]])}</label>
        <label class="field">Κλιματισμός on-mode<input type="text" data-set="climate_on_mode" data-text value="${esc(c.climate_on_mode || "")}" placeholder="auto"></label>
        <label class="field">Ελάχιστη (bar)${this._num("tire_min", c.tire_min)}</label><label class="field">Μέγιστη (bar)${this._num("tire_max", c.tire_max)}</label>
        ${hasFuel(this._hass, c) ? `<label class="field">Δεξαμενή (km)${this._num("fuel_max", c.fuel_max, "1")}</label>` : ""}</div>
      <h4>Εξαγωγή / επαναφορά</h4>
      <p class="hint">${this.mode === "card" ? T("Οι ρυθμίσεις γράφονται αυτόματα στο YAML της κάρτας στο dashboard, άρα είναι κοινές σε όλες τις συσκευές και τους χρήστες. Αν το dashboard δεν επιτρέπει αποθήκευση (όχι διαχειριστής ή YAML mode), αποθηκεύονται στον λογαριασμό σου και μπορείς να αντιγράψεις το YAML παρακάτω.") : T("Οι ρυθμίσεις αποθηκεύονται στο YAML της κάρτας.")}</p>
      <textarea readonly id="yaml">${esc(toYaml(cfgOut))}</textarea>
      <div class="btnrow"><button class="btn sm" data-copy>${ico("copy")} Αντιγραφή YAML</button><button class="btn sm" data-reset>${ico("refresh")} Επαναφορά</button></div>
      <div class="note" id="note">${esc(this._note)}</div>`;
  }
  _exportObj() {
    const c = this._cfg, o = { type: this.yamlBase?.type || `custom:${TAG}` };
    for (const k of SETTING_KEYS) {
      
      if (JSON.stringify(c[k]) !== JSON.stringify(DEFAULTS[k])) o[k] = c[k];
    }
    return o;
  }

  _render() {
    const c = this._cfg;
    if (!c) return;
    const body = { sections: () => this._tabSections(c), buttons: () => this._tabButtons(c), sensors: () => this._tabSensors(c), images: () => this._tabImages(c), general: () => this._tabGeneral(c) }[this.tab]();
    this.shadowRoot.innerHTML = `<style>${SETTINGS_CSS}</style><div class="wrap">${this._tabs()}${body}</div>`;
    this._bind();
    if (this.tab === "images") this._probe();
  }

  _probe() {
    const c = this._cfg, sr = this.shadowRoot, hb = heroBases(c), lb = layerBase(c);
    const test = (urls, cb) => { const im = new Image(); let i = 0; im.onload = () => cb(urls[i]); im.onerror = () => { i++; i < urls.length ? (im.src = urls[i]) : cb(null); }; im.src = urls[0]; };
    Object.keys(ALL_FILES).forEach((k) => {
      const f = c.images[k] || ALL_FILES[k];
      const urls = /^(https?:)?\/\/|^\//.test(f) ? [f] : hb.map((b) => b + f);
      test(urls, (u) => {
        const th = sr.querySelector(`[data-probe-hero="${k}"]`), st = sr.querySelector(`[data-st-hero="${k}"]`);
        if (th && u) th.style.backgroundImage = `url("${u}")`;
        if (st) { st.textContent = u ? "✓" : "✗"; st.className = `st ${u ? "ok" : "no"}`; }
      });
    });
    const fill = (id, dir, files) => {
      const box = sr.getElementById(id); if (!box) return;
      box.innerHTML = files.map((f) => `<div class="chk"><code style="flex:1">${esc(dir + f)}.webp</code><span class="st" data-l="${dir}${f}">…</span></div>`).join("");
      files.forEach((f) => test([`${lb}${dir}${f}.webp`], (u) => {
        const st = box.querySelector(`[data-l="${dir}${f}"]`); if (st) { st.textContent = u ? "✓" : "✗"; st.className = `st ${u ? "ok" : "no"}`; }
      }));
    };
    fill("ltop", "top/", TOP_FILES_ALL); fill("lint", "interior/", INT_FILES_ALL);
  }

  _bind() {
    const sr = this.shadowRoot, c = this._cfg;
    sr.addEventListener("click", (e) => {
      const t = e.target.closest("button,[data-tab]");
      if (!t) return;
      const d = t.dataset;
      if (d.tab) return this._setTab(d.tab);
      if (d.mv) {
        const [kind, id, dir] = d.mv.split("|");
        const key = kind === "sec" ? "order" : "buttons", arr = [...c[key]], i = arr.indexOf(id), j = i + Number(dir);
        if (i < 0 || j < 0 || j >= arr.length) return;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        return this._emit({ [key]: arr });
      }
      if (d.vis) {
        const [kind, id] = d.vis.split("|"), key = kind === "sec" ? "hidden" : "buttons_hidden", s = new Set(c[key]);
        s.has(id) ? s.delete(id) : s.add(id);
        return this._emit({ [key]: [...s] });
      }
      if (d.tgl) return this._emit({ [d.tgl]: c[d.tgl] === false });
      if (d.hs) { const x = new Set(c.hero_show || []); x.has(d.hs) ? x.delete(d.hs) : x.add(d.hs); return this._emit({ hero_show: HERO_SHOW_OPTS.map((o) => o[0]).filter((k) => x.has(k)) }); }
      if (d.conf) { const s = new Set(c.confirm); s.has(d.conf) ? s.delete(d.conf) : s.add(d.conf); return this._emit({ confirm: [...s] }); }
      if (d.diag) {
        const cur = new Set(Array.isArray(c.diag) ? c.diag : DIAG.map((x) => x[0]));
        cur.has(d.diag) ? cur.delete(d.diag) : cur.add(d.diag);
        return this._emit({ diag: [...cur] });
      }
      if (d.info) { const s = new Set(c.info); s.has(d.info) ? s.delete(d.info) : s.add(d.info); return this._emit({ info: INFO_IDS.filter((i) => s.has(i)) }); }
      if (d.dmode) return this._emit({ diag_mode: d.dmode });
      if (d.dall !== undefined) return this._emit({ diag: d.dall === "1" ? DIAG.map((x) => x[0]) : [] });
      if (d.icon) { this._form.icon = d.icon; return this._render(); }
      if (d.add !== undefined) {
        const f = this._form, ent = f.entity.trim();
        if (!/^[a-z_]+\.[\w]+$/.test(ent)) { this._note = T("Γράψε έγκυρο entity_id"); return this._render(); }
        const item = { entity: ent, label: f.label.trim(), icon: f.icon };
        this._form = { ...this._form, entity: "", label: "" };
        return this._emit({ [d.add]: [...c[d.add], item] });
      }
      if (d.del) { const [k, i] = d.del.split("|"); const a = [...c[k]]; a.splice(Number(i), 1); return this._emit({ [k]: a }); }
      if (d.addent !== undefined) {
        const f = this._form; if (!f.mkey || !f.ment.trim()) return;
        const m = { ...c.entities, [f.mkey]: f.ment.trim() };
        this._form = { ...f, ment: "" };
        return this._emit({ entities: m });
      }
      if (d.delent) { const m = { ...c.entities }; delete m[d.delent]; return this._emit({ entities: m }); }
      if (d.copy !== undefined) {
        const txt = sr.getElementById("yaml").value;
        (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => (this._note = T("Αντιγράφηκε ✓")), () => { sr.getElementById("yaml").select(); this._note = T("Πάτα Ctrl/⌘+C"); }).then(() => this._render());
        return;
      }
      if (d.reset !== undefined) { this._note = ""; return this.onReset && this.onReset(); }
    });
    sr.addEventListener("change", (e) => {
      const t = e.target, d = t.dataset;
      if (d.set === "_mkey") return;
      if (d.set) {
        let v = t.value;
        if (d.num !== undefined) { v = parseFloat(v); if (!Number.isFinite(v)) return; }
        if (d.text !== undefined) { v = v.trim(); if (["image_path", "layers_path", "climate_on_mode", "image_aspect"].includes(d.set) && !v) v = null; if (["name", "prefix"].includes(d.set) && !v) return; }
        return this._emit({ [d.set]: v });
      }
      if (d.img) { const m = { ...c.images }; t.value.trim() ? (m[d.img] = t.value.trim()) : delete m[d.img]; return this._emit({ images: m }); }
    });
    sr.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.f) this._form[t.dataset.f] = t.value;
    });
    sr.querySelectorAll('select[data-set="_mkey"]').forEach((s) => s.addEventListener("change", () => (this._form.mkey = s.value)));
  }
}

/* ───────────────────────── Επεξεργαστής του HA ───────────────────────── */
class DeepalS05CardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); I18N.watch(this.shadowRoot); this._tab = "sections"; }
  setConfig(config) { this._config = { ...config }; this._draw(); }
  set hass(h) { this._hass = h; if (this._s) this._s.hass = h; }
  _draw() {
    if (!this._s) {
      this._s = document.createElement(SETTINGS_TAG);
      this._s.mode = "editor";
      this._s.onTab = (t) => (this._tab = t);
      this._s.onPatch = (p) => {
        this._config = { ...this._config, ...p };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
        this._draw();
      };
      this._s.onReset = () => {
        const { type, prefix, name } = this._config;
        this._config = { type, ...(prefix ? { prefix } : {}), ...(name ? { name } : {}) };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
        this._draw();
      };
      this.shadowRoot.innerHTML = "";
      this.shadowRoot.appendChild(this._s);
    }
    this._s.tab = this._tab;
    this._s.hass = this._hass;
    this._s.yamlBase = this._config;
    this._s.cfg = mergeConfig(this._config, null);
  }
}
