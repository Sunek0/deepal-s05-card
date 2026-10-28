/*!
 * deepal-s05-card  v0.4.0
 * Custom Lovelace card για Deepal S05 (και PHEV): hero με layers, κουμπιά ελέγχου,
 * κάτοψη με ελαστικά, εσωτερικό (θέρμανση/αερισμός), διαγνωστικά, δικό της UI ρυθμίσεων.
 *
 * Χωρίς εξαρτήσεις και χωρίς CDN. Τα εικονίδια είναι δικά της (ενσωματωμένα).
 * Οι εικόνες των layers (κάτοψη/εσωτερικό) προέρχονται από το έργο dec_deepal
 * (MIT) — δες LICENSE-NOTICE.txt στον φάκελο της κάρτας.
 */
(() => {
const CARD_VERSION = "1.0.0";
const TAG = "deepal-s05-card";
const SETTINGS_TAG = "deepal-s05-settings";
const EDITOR_TAG = "deepal-s05-card-editor";
if (customElements.get(TAG)) return;

const BAD = ["unknown", "unavailable", "none", "None", "null", ""];
const TRANSITIONAL = ["locking", "unlocking", "opening", "closing"];
const CLIMATE_TURN_OFF = 128; // ClimateEntityFeature.TURN_OFF
const CLIMATE_TURN_ON = 256; // ClimateEntityFeature.TURN_ON

/* Ο φάκελος της κάρτας (εκεί που βρίσκεται αυτό το .js) — από εκεί φορτώνουν οι εικόνες. */
const SCRIPT_BASE = (() => {
  if (window.__DEEPAL_CARD_BASE) return window.__DEEPAL_CARD_BASE;
  try {
    const s = [...document.querySelectorAll("script[src]")].find((x) => /deepal-s05-card[^/]*\.js/.test(x.src));
    if (s) return new URL(".", s.src).href;
    const r = performance.getEntriesByType("resource").find((x) => /deepal-s05-card[^/]*\.js/.test(x.name));
    if (r) return new URL(".", r.name).href;
  } catch (_) {}
  return "/hacsfiles/deepal-s05-card/";
})();

/* ───────────────────────── Προεπιλογές ───────────────────────── */
const SECTIONS = ["hero", "actions", "status", "stats", "info", "diagnostics", "charge"];
const SECTION_LABELS = {
  hero: "Εικόνα οχήματος",
  actions: "Κουμπιά ελέγχου",
  status: "Κατάσταση (πάνω στην εικόνα)",
  stats: "Θερμοκρασία & μπαταρία",
  info: "Πληροφορίες",
  diagnostics: "Διαγνωστικά",
  charge: "Φόρτιση (όταν συνδέεται)",
};
const HERO_SHOW_OPTS = [["name", "Όνομα"], ["plate", "Πινακίδα"], ["range", "Συνολική αυτονομία"], ["cloud", "Σύνδεση με cloud"], ["updated", "Τελευταία ενημέρωση"]];
const BUTTON_IDS = ["lock", "windows", "trunk", "climate", "tires", "cabin", "flash", "honk", "find"];
const BUTTON_LABELS = {
  lock: "Κλείδωμα",
  windows: "Παράθυρα",
  trunk: "Πορτμπαγκάζ",
  climate: "Κλιματισμός",
  tires: "Ελαστικά",
  cabin: "Εσωτερικό",
  flash: "Φώτα",
  honk: "Κόρνα",
  find: "Φώτα + κόρνα",
  refresh: "Ανανέωση",
};

const DEFAULTS = {
  prefix: "s05",
  name: "Deepal S05",
  image_path: null, // φάκελος με τις φωτογραφίες hero (null = αυτόματα)
  layers_path: null, // φάκελος με τα layers (null = <φάκελος κάρτας>/images/)
  image_scale: 1.2,
  image_aspect: null,
  powertrain: "auto", // auto (από τους αισθητήρες καυσίμου) | phev | ev (μόνο ηλεκτρικό)
  fuel_max: 941,
  confirm: ["unlock", "trunk", "windows"],
  order: SECTIONS.slice(),
  hidden: [],
  buttons: BUTTON_IDS.slice(),
  buttons_hidden: [],
  button_layout: "grid", // grid (σειρές) | scroll (μία γραμμή με scroll) | fit (μία γραμμή, χωράνε όλα)
  button_labels: "both", // none | status | title | both
  button_size: "m", // s | m | l
  diag: null, // null = όλα
  diag_mode: "alerts", // alerts | all
  diag_custom: [],
  hero_show: ["name", "plate", "range"], // τι φαίνεται πάνω στην εικόνα: name, plate, range, cloud, updated
  info: ["odometer", "fuel_level"],
  info_custom: [], // [{entity, label, icon, unit}]
  entities: {},
  images: {},
  climate_on_mode: null,
  top_orientation: "horizontal", // horizontal | vertical
  tire_min: 2.0, // bar — κάτω από αυτό «χαμηλή»
  tire_max: 3.5, // bar — πάνω από αυτό «υψηλή»
  tire_unit: "bar", // bar | kPa | psi
  show_customize: true,
  language: "auto", // auto (γλώσσα του HA) | el | en | …
  charge_fx: "flow_port", // εφέ φόρτισης πάνω στο αμάξι: flow_port | flow | port | sweep | none
  toasts: true, // μηνύματα πάνω στην οθόνη
};
// Κλειδιά που αλλάζουν από το UI ρυθμίσεων
/* Αυτόματη αναγνώριση προθέματος: αν το ορισμένο δεν βρίσκεται (π.χ. άλλο όνομα συσκευής: mycar_…), ψάχνουμε στο HA ποιο πρόθεμα έχει τους αισθητήρες του οχήματος */
const PFX_SIG = [["lock", "doors"], ["sensor", "battery_level"], ["sensor", "remaining_range"], ["cover", "trunk"], ["cover", "windows"], ["climate", "cabin_climate"], ["binary_sensor", "charging"], ["sensor", "total_odometer"], ["button", "honk_horn"]];
let _pfxCache = { key: "", t: 0, val: null, list: [] };
const pfxCandidates = (hass) => {
  const st = hass?.states || {}, score = {};
  for (const id of Object.keys(st)) {
    const i = id.indexOf("."), d = id.slice(0, i), n = id.slice(i + 1);
    for (const [sd, ss] of PFX_SIG) if (d === sd && n.endsWith("_" + ss) && n.length > ss.length + 1) { const p = n.slice(0, -(ss.length + 1)); (score[p] = score[p] || new Set()).add(sd + "." + ss); }
  }
  return Object.entries(score).map(([p, s]) => [p, s.size]).filter((x) => x[1] >= 3).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map((x) => x[0]);
};
const effPrefix = (hass, c) => {
  const st = hass?.states, p = c.prefix;
  if (!st || st[`sensor.${p}_battery_level`] || st[`lock.${p}_doors`] || st[`cover.${p}_windows`]) return p;
  const now = Date.now(), key = p;
  if (_pfxCache.key !== key || now - _pfxCache.t > 5000) { const l = pfxCandidates(hass); _pfxCache = { key, t: now, val: l[0] || null, list: l }; }
  return _pfxCache.val || p;
};
/* Ανεξάρτητα από τη γλώσσα του HA: το integration δίνει σε κάθε οντότητα σταθερό translation_key (π.χ. "remaining_range") στο registry,
   ενώ το entity_id παράγεται από το μεταφρασμένο όνομα. Αν δεν βρεθεί το αναμενόμενο entity_id, ψάχνουμε με translation_key. */
const TK_SPECIAL = {
  "binary_sensor.cloud_connection": "connected", "binary_sensor.key_fob_battery_low": "key_battery_low",
  "sensor.remaining_charge_time_h_mm": "remaining_charge_time_formatted", "sensor.charging_type": "charge_mode",
  "button.flash_lights_and_honk": "flash_and_honk", "sensor.climate_fan_level": "fan_level",
  "binary_sensor.tire_pressure_warning": "warning_tpms", "binary_sensor.abs_warning": "warning_abs", "binary_sensor.brake_warning": "warning_brake",
  "binary_sensor.brake_fluid_warning": "warning_brake_fluid", "binary_sensor.power_steering_warning": "warning_eps", "binary_sensor.power_limit_warning": "warning_power_limit",
  "binary_sensor.power_system_warning": "warning_power_system", "binary_sensor.traction_battery_low_warning": "warning_traction_battery_low",
  "binary_sensor.12_v_battery_warning": "warning_12v_battery", "binary_sensor.airbag_warning": "warning_airbag",
};
const tkOf = (key) => {
  if (TK_SPECIAL[key]) return TK_SPECIAL[key];
  const s = key.slice(key.indexOf(".") + 1);
  let m = s.match(/^(front_left|front_right|rear_left|rear_right)_(tire_pressure|tire_alarm|window_open|window_opening|seat_heating_level|seat_ventilation_level)$/);
  if (m) return `${m[2]}_${m[1]}`;
  m = s.match(/^(front_left|front_right|rear_left|rear_right)_door$/);
  return m ? `door_${m[1]}` : s;
};
let _tkCache = { reg: null, p: null, idx: null };
const tkIndex = (hass, p) => {
  const reg = hass?.entities;
  if (!reg) return null;
  if (_tkCache.reg === reg && _tkCache.p === p) return _tkCache.idx;
  const byDev = {};
  for (const e of Object.values(reg)) {
    if (e.platform !== "deepal" || !e.translation_key) continue;
    const eid = e.entity_id, d = e.device_id || "_";
    (byDev[d] = byDev[d] || {})[`${eid.slice(0, eid.indexOf("."))}.${e.translation_key}`] = eid;
  }
  const devs = Object.values(byDev);
  const idx = devs.find((m) => Object.values(m).some((eid) => eid.slice(eid.indexOf(".") + 1).startsWith(p + "_"))) || devs[0] || null;
  _tkCache = { reg, p, idx };
  return idx;
};
const resolveId = (hass, c, key) => {
  const ov = c.entities?.[key]; if (ov) return ov;
  const i = key.indexOf("."), p = effPrefix(hass, c), cand = `${key.slice(0, i)}.${p}_${key.slice(i + 1)}`;
  if (!hass?.states || hass.states[cand]) return cand;
  const idx = tkIndex(hass, p);
  return (idx && idx[`${key.slice(0, i)}.${tkOf(key)}`]) || cand;
};
const hasFuel = (hass, c) => c.powertrain === "ev" ? false : c.powertrain === "phev" ? true
  : !!hass?.states && ["fuel_range", "fuel_level"].some((k) => hass.states[resolveId(hass, c, `sensor.${k}`)]);
const SETTING_KEYS = Object.keys(DEFAULTS);

const HERO_FILES = {
  off: "hero_off.jpg",
  lights: "hero_lights.jpg",
  unlocked: "hero_unlocked.jpg",
  unlocked_lights: "hero_unlocked_lights.jpg",
  charging: "hero_charging.jpg",
  charging_unlocked: "hero_charging_unlocked.jpg",
  complete: "hero_charge_complete.jpg",
};
// Εικόνες ταμπλό (εσωτερικό): χωρίς / με θέρμανση τιμονιού. Ο αέρας των αεραγωγών είναι SVG animation.
const DASH_FILES = { dash_off: "dash_off.jpg", dash_off_steer: "dash_off_steer.jpg" };
const HERO_LABELS = {
  dash_off: "Ταμπλό (ο αέρας ζωγραφίζεται με SVG)",
  dash_off_steer: "Ταμπλό · θέρμανση τιμονιού",
  off: "Σβηστό · κλειδωμένο",
  lights: "Φώτα αναμμένα",
  unlocked: "Ξεκλείδωτο",
  unlocked_lights: "Ξεκλείδωτο + φώτα",
  charging: "Φόρτιση",
  charging_unlocked: "Φόρτιση + ξεκλείδωτο",
  complete: "Φόρτιση ολοκληρώθηκε",
};

/* ───────────────────────── Εικονίδια ─────────────────────────
 * Γλώσσα σχεδίασης: λεπτές γραμμές 1.6, στρογγυλές άκρες, πλέγμα 24×24, με μία
 * «τονισμένη» επιφάνεια (class a) όπως στις εφαρμογές κατασκευαστών. Τα σχήματα
 * παίρνουν από το S05: κεκλιμένη οροφή (fastback), λεπτή μπάρα φώτων στο μέτωπο,
 * στρογγυλεμένο άνοιγμα πόρτας. k = γεμάτο σχήμα, a = τονισμένη επιφάνεια. */
const WHEEL = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="1.9"/>`;
const BLADE = '<path d="M12 10.4C11.5 6.4 13.3 3.9 15.8 4.4 17.3 4.8 16.9 7.7 13.8 10.7"/>';
const FAN = `${BLADE}<g transform="rotate(120 12 12)">${BLADE}</g><g transform="rotate(240 12 12)">${BLADE}</g><circle cx="12" cy="12" r="1.4" class="k"/>`;
const SEAT = '<path d="M8.2 3.8c-1 0-1.6.9-1.3 1.8l2.2 7.6c.2.7.8 1.1 1.5 1.1h5.2c1 0 1.8.8 1.8 1.8V19"/><path class="a" d="M9.4 14.3h5.6c1.2 0 2 .9 2 2v.4H10.8c-.8 0-1.4-.5-1.6-1.2z"/><path d="M9.2 19.5h8.6"/>';
const TIRE = '<path d="M7.2 5.9A7.6 7.6 0 0 0 4.6 11.4c0 2.1.9 4 2.3 5.4.5.5 1.2.8 1.9.8h6.4c.7 0 1.4-.3 1.9-.8a7.6 7.6 0 0 0 2.3-5.4c0-2.2-1-4.2-2.6-5.5"/><path d="M12 8.4v4.2"/><path d="M12 15.1h.01" stroke-width="2.1"/>';
const CARBODY = '<path d="M3 17.2v-3c0-.9.6-1.6 1.4-1.8l1.9-.6 1.6-3.2c.3-.6.9-.9 1.5-.9h4.9c.6 0 1.1.3 1.5.7l2.4 3.2 1.4.4c.9.3 1.4 1 1.4 1.9v3.3h-1.4M14.8 17.2H9.2M5.2 17.2H3"/><circle cx="7.2" cy="17.2" r="2"/><circle cx="16.8" cy="17.2" r="2"/>';
const ICONS = {
  /* ── Κουμπιά ελέγχου ── */
  lock: '<rect class="a" x="5" y="10.4" width="14" height="9.8" rx="3.4"/><path d="M8.2 10.4V8.2a3.8 3.8 0 0 1 7.6 0v2.2"/><circle cx="12" cy="14.4" r="1.15" class="k"/><path d="M12 15v2"/>',
  unlock: '<rect class="a" x="5" y="10.4" width="14" height="9.8" rx="3.4"/><path d="M8.2 10.4V8.2a3.8 3.8 0 0 1 7.3-1.5"/><circle cx="12" cy="14.4" r="1.15" class="k"/><path d="M12 15v2"/>',
  windowclosed: '<path d="M4.5 19V10.3l3.7-5c.3-.4.8-.6 1.3-.6H18c.8 0 1.5.7 1.5 1.5V19z"/><path class="a" d="M8.2 10.2l2.2-3h6.4v3.6H8.2z"/><path d="M14.4 17V12.6M12.2 14.6l2.2-2.2 2.2 2.2"/>',
  windowopen: '<path d="M4.5 19V10.3l3.7-5c.3-.4.8-.6 1.3-.6H18c.8 0 1.5.7 1.5 1.5V19z"/><path class="a" d="M8.2 7.2l.7-.9h7.9v.9z"/><path d="M14.4 10.8v4.6M12.2 13.2l2.2 2.2 2.2-2.2"/>',
  trunk: CARBODY + '<path class="a" d="M4.6 12.5 6.3 9.2h1.9l-.9 3.3z"/>',
  trunkopen: '<path d="M9.4 11.4l.8-1.6c.3-.6.9-.9 1.5-.9h4.4c.6 0 1.1.3 1.5.7l2.2 2.9 1.4.4c.9.3 1.4 1 1.4 1.9v3.3h-1.4M14.8 17.2H9.2M5.2 17.2H3v-3c0-.9.6-1.6 1.4-1.8l1-.3"/><circle cx="7.2" cy="17.2" r="2"/><circle cx="16.8" cy="17.2" r="2"/><path class="a" d="M5.4 12.3 2.9 6 5.2 5.2l2.9 6.3z"/>',
  tirealert: '<path d="M7.2 5.9A7.6 7.6 0 0 0 4.6 11.4c0 2.1.9 4 2.3 5.4.5.5 1.2.8 1.9.8h6.4c.7 0 1.4-.3 1.9-.8a7.6 7.6 0 0 0 2.3-5.4c0-2.2-1-4.2-2.6-5.5"/><path d="M12 8.2v4.4"/><path d="M12 15.2h.01" stroke-width="2.2"/>',
  interioron: '<path d="M7.6 6.2c-1 0-1.7.9-1.4 1.9l1.4 5.4c.2.8.9 1.3 1.7 1.3h6.3"/><path class="a" d="M9.2 15.4h6.5c1.2 0 2.2 1 2.2 2.2v.3H9.9c-.9 0-1.6-.6-1.8-1.4z"/><path d="M8.8 20.6h9.2"/><path d="M13.6 3.4c-1.2 1 1.2 2 0 3M17.2 3.4c-1.2 1 1.2 2 0 3"/>',
  snow: '<path d="M12 3.2v17.6M4.4 7.6l15.2 8.8M4.4 16.4l15.2-8.8"/><path d="M9.7 4.9 12 6.8l2.3-1.9M9.7 19.1 12 17.2l2.3 1.9M5.5 10.2l2.9-.5-.8-2.8M18.5 13.8l-2.9.5.8 2.8M5.5 13.8l2.9.5-.8 2.8M18.5 10.2l-2.9-.5.8-2.8"/>',
  snowoff: '<path d="M12 3.2v17.6M4.4 7.6l15.2 8.8M4.4 16.4l15.2-8.8"/><path d="M9.7 4.9 12 6.8l2.3-1.9M9.7 19.1 12 17.2l2.3 1.9M5.5 10.2l2.9-.5-.8-2.8M18.5 13.8l-2.9.5.8 2.8M5.5 13.8l2.9.5-.8 2.8M18.5 10.2l-2.9-.5.8-2.8"/><path d="M4 4l16 16"/>',
  tireok: '<path d="M7.2 5.9A7.6 7.6 0 0 0 4.6 11.4c0 2.1.9 4 2.3 5.4.5.5 1.2.8 1.9.8h6.4c.7 0 1.4-.3 1.9-.8a7.6 7.6 0 0 0 2.3-5.4c0-2.2-1-4.2-2.6-5.5"/><path d="M12 8.2v4.4"/><path d="M12 15.2h.01" stroke-width="2.2"/>',
  fan: FAN,
  fanoff: FAN + '<path d="M4.5 4.5l15 15"/>',
  headlight: '<path class="a" d="M13.4 5.6a6.4 6.4 0 0 1 0 12.8h-1.6V5.6z"/><path d="M3.6 8.6h5.4M3.6 12h5.4M3.6 15.4h5.4"/>',
  horn: '<path class="a" d="M3.6 10.2h3.2l7.4-3.8v11.2l-7.4-3.8H3.6z"/><path d="M6.8 15.2l.9 3.4h2.2l-.9-3"/><path d="M17 9.4a3.6 3.6 0 0 1 0 5.2M19.6 7a7 7 0 0 1 0 10"/>',
  find: '<g transform="translate(0 2.6)">' + CARBODY + '</g><path d="M8.7 7.3a4.8 4.8 0 0 1 6.6 0M6 4.8a8.4 8.4 0 0 1 12 0"/>',
  refresh: '<path d="M19.6 12a7.6 7.6 0 1 1-2.3-5.5"/><path d="M19.7 4.4v4.3h-4.3"/>',
  /* ── Γενικά UI ── */
  check: '<path d="M5.2 12.6l4.3 4.3 9.3-9.6"/>',
  power: '<path d="M12 3.2v8.1"/><path d="M7.2 6.6a7.6 7.6 0 1 0 9.6 0"/>',
  alert: '<path d="M12 4.2 21 19.6H3z"/><path d="M12 10v4.1"/><path d="M12 16.9h.01" stroke-width="2.2"/>',
  info: '<circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.2"/><path d="M12 7.9h.01" stroke-width="2.2"/>',
  close: '<path d="M6.2 6.2l11.6 11.6M17.8 6.2 6.2 17.8"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  minus: '<path d="M5.5 12h13"/>',
  up: '<path d="M6.5 14.5l5.5-5.5 5.5 5.5"/>',
  down: '<path d="M6.5 9.5l5.5 5.5 5.5-5.5"/>',
  chevr: '<path d="M9.5 6.5l5.5 5.5-5.5 5.5"/>',
  sliders: '<path d="M4 7h8.2M17 7h3M4 17h3M12.2 17H20"/><circle cx="14.6" cy="7" r="2.3"/><circle cx="9.6" cy="17" r="2.3"/>',
  eye: '<path d="M2.8 12S6 6.2 12 6.2 21.2 12 21.2 12 18 17.8 12 17.8 2.8 12 2.8 12z"/><circle class="a" cx="12" cy="12" r="2.7"/>',
  eyeoff: '<path d="M4.5 8.2C3.4 9.5 2.8 12 2.8 12S6 17.8 12 17.8c1.4 0 2.6-.3 3.7-.8M9.7 6.5c.7-.2 1.5-.3 2.3-.3 6 0 9.2 5.8 9.2 5.8s-.7 1.3-2 2.7"/><path d="M4 4l16 16"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l.8 12h8.4L17 7"/><path d="M10.2 10.5v5.5M13.8 10.5v5.5"/>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><circle cx="9" cy="10" r="1.6" class="k"/><path d="M4 17l4.6-4.4 3.2 3 3-3L20 17"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5c0-1.1-.9-2-2-2h-7c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h2"/>',
  /* ── Κατάσταση / σύνδεση / φόρτιση ── */
  bolt: '<path class="a" d="M13.2 3 6.4 13.4h4.9L10.6 21l7-10.6h-5z"/>',
  plug: '<path d="M9 3v4.5M15 3v4.5"/><path class="a" d="M6.2 7.5h11.6v3.3a5.8 5.8 0 0 1-11.6 0z"/><path d="M12 16.6V21"/>',
  cloudcheck: '<path d="M7.6 18.4h9.1a3.9 3.9 0 0 0 .6-7.7A5.6 5.6 0 0 0 6.4 9.3a4.6 4.6 0 0 0 1.2 9.1z"/><path d="M9.6 13.7l1.8 1.8 3.1-3.2"/>',
  cloudoff: '<path d="M7.6 18.4h9.1a3.9 3.9 0 0 0 .6-7.7A5.6 5.6 0 0 0 6.4 9.3a4.6 4.6 0 0 0 1.2 9.1z"/><path d="M4 4l16 16"/>',
  /* ── Όχημα ── */
  cartop: '<path d="M8.2 3.8h7.6c1.1 0 2 .9 2 2v12.4c0 1.1-.9 2-2 2H8.2c-1.1 0-2-.9-2-2V5.8c0-1.1.9-2 2-2z"/><path class="a" d="M8.4 8.4h7.2l.6 4.1H7.8z"/><path d="M8.6 17.2h6.8"/><path d="M4.6 8.4v2M19.4 8.4v2"/>',
  interior: '<path d="M7.6 4.2c-1 0-1.7.9-1.4 1.9l1.6 6.4c.2.8.9 1.3 1.7 1.3h6.3"/><path class="a" d="M9.2 14.6h6.5c1.2 0 2.2 1 2.2 2.2v.3H9.9c-.9 0-1.6-.6-1.8-1.4z"/><path d="M8.8 20h9.2"/>',
  steering: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="1.9"/><path d="M3.9 12h6.2M13.9 12h6.2M12 14v6.2"/>',
  heatwave: '<path d="M8.5 4.5c-1.6 1.6 1.6 3.4 0 5s1.6 3.4 0 5M12.5 4.5c-1.6 1.6 1.6 3.4 0 5s1.6 3.4 0 5M16.5 4.5c-1.6 1.6 1.6 3.4 0 5s1.6 3.4 0 5"/><path d="M6 19h12"/>',
  seat: SEAT,
  door: '<path d="M8.4 4.8h7.4c1.1 0 2 .9 2 2v10.4c0 1.1-.9 2-2 2H8.4c-1.1 0-2-.9-2-2V6.8c0-1.1.9-2 2-2z"/><path class="a" d="M6.4 10.2 2.8 7.8v6.6l3.6 1.8z"/><path d="M9 9h6.2l.6 2.4H8.6z"/>',
  hood: '<path d="M3.2 17.6v-4.1l2.2-4.3h13.2l2.2 4.3v4.1z"/><path class="a" d="M7.4 9.2l.9-3.3h7.4l.9 3.3z"/><path d="M6 17.6v2M18 17.6v2"/>',
  /* ── Μετρήσεις ── */
  gauge: '<path d="M4.6 17.6a8.2 8.2 0 1 1 14.8 0"/><path class="a" d="M12 14.2l3.6-4.6 1 .8z"/><circle cx="12" cy="14.8" r="1.2" class="k"/>',
  thermo: '<path d="M10 14.2V5.9a2 2 0 1 1 4 0v8.3a3.9 3.9 0 1 1-4 0z"/><path d="M12 9.5v6.3" stroke-width="2"/>',
  drop: '<path class="a" d="M12 3.6s5.4 5.6 5.4 9.6a5.4 5.4 0 0 1-10.8 0c0-4 5.4-9.6 5.4-9.6z"/>',
  fuel: '<path d="M5 20V6.2C5 5.5 5.5 5 6.2 5h5.6c.7 0 1.2.5 1.2 1.2V20M4 20h10"/><path class="a" d="M7 7.6h4.2v3.4H7z"/><path d="M13 9.4h2.2c.8 0 1.5.7 1.5 1.5v4.7a1.5 1.5 0 0 0 3 0V8.3l-2.4-2.4"/>',
  battery: '<rect x="3" y="7.4" width="16.2" height="9.2" rx="2.4"/><path d="M21.4 10.6v2.8"/><path class="a" d="M5.6 10h5.2v4H5.6z"/>',
  battery12: '<rect x="3" y="8.2" width="18" height="11" rx="2.2"/><path d="M7 8.2V5.9h3v2.3M14 8.2V5.9h3v2.3"/><path d="M6.8 13.7h3.2M14.2 13.7h3.2M15.8 12.1v3.2"/>',
  leaf: '<path class="a" d="M5 19c0-8 4.6-13.4 14-14 .4 8.6-4.6 13.6-12.6 13.2"/><path d="M5 19c2.6-4.6 5.4-7 9-8.6"/>',
  road: '<path d="M8.4 3.6 5 20.4M15.6 3.6 19 20.4"/><path d="M12 5v2.6M12 10.7v2.6M12 16.4V19" stroke-width="1.8"/>',
  /* ── Διαγνωστικά (telltales) ── */
  airbag: '<circle cx="12" cy="12" r="9.6" stroke-width="1.7"/><circle cx="11.2" cy="9.1" r="2.4" class="k"/><circle cx="15.6" cy="7.6" r="1.25" class="k"/><path d="M7.9 16.5l3-4" stroke-width="1.8"/><path d="M12.7 13.5l3.1-3" stroke-width="2.3"/><path d="M13.7 14.8l.2 2.2" stroke-width="1.3"/><path d="M17.7 9.2l1-.5" stroke-width="1"/>',
  abs: '<circle cx="12" cy="12" r="7.8"/><path d="M4.6 8.4c-1.4 2.1-1.4 5.1 0 7.2M19.4 8.4c1.4 2.1 1.4 5.1 0 7.2"/><text x="12" y="14.5" text-anchor="middle" font-size="6.2" font-weight="700" font-family="sans-serif" fill="currentColor" stroke="none">ABS</text>',
  brake: '<circle cx="12" cy="12" r="5.2"/><path d="M12 9.6v3.1"/><path d="M12 14.8h.01" stroke-width="2"/><path d="M5.7 7.4c-1.5 2.6-1.5 6.6 0 9.2M18.3 7.4c1.5 2.6 1.5 6.6 0 9.2"/>',
  fluid: '<path class="a" d="M12 3.8s5.2 5.4 5.2 9.2a5.2 5.2 0 0 1-10.4 0c0-3.8 5.2-9.2 5.2-9.2z"/><path d="M12 11v3"/><path d="M12 16.4h.01" stroke-width="2"/>',
  engine: '<path d="M4 10v5M20 10v5M6.4 7h2.5l1.2-1.6h4.4L15.7 7h2.4c.5 0 .9.4.9.9v8.4c0 .5-.4.9-.9.9H6.4c-.5 0-.9-.4-.9-.9V7.9c0-.5.4-.9.9-.9z"/><path class="a" d="M9.2 11h5.6v3H9.2z"/>',
  tire: '<circle cx="12" cy="12" r="8.4"/><circle class="a" cx="12" cy="12" r="3.3"/><path d="M12 8.7V3.6M12 20.4v-5.1M8.7 12H3.6M20.4 12h-5.1" stroke-width="1.4"/>',
  key: '<circle cx="7.9" cy="12" r="3.5"/><path d="M11.4 12H21M17.4 12v3.2M20.1 12v2.2"/>',
  speedlimit: '<path d="M4.6 17.6a8.2 8.2 0 1 1 14.8 0"/><path d="M12 14.4l-3.6-3.2"/><path d="M5 20h14" stroke-width="1.8"/>',
};
const ico = (n, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.info}</svg>`;
const ICON_NAMES = Object.keys(ICONS);
// Εικονίδια που προσφέρονται στον χρήστη για δικούς του αισθητήρες
const PICKABLE_ICONS = [
  "info", "alert", "gauge", "thermo", "drop", "fuel", "battery", "battery12", "bolt", "plug", "leaf", "road",
  "tire", "tirealert", "brake", "fluid", "engine", "key", "airbag", "abs", "door", "hood", "trunk", "seat", "steering",
  "heatwave", "fan", "headlight", "lock", "cartop", "cloudcheck", "speedlimit",
];


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
  available() { const o = { el: "Ελληνικά", en: "English" }; for (const [k, v] of Object.entries(LANGS)) o[k] = v.name || k; return Object.entries(o); },
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

/* ───────────────────────── Δεδομένα ───────────────────────── */
/* Εφέ φόρτισης: συντεταγμένες πάνω στις φωτογραφίες 500×278 (καλώδιο από την πρίζα προς τη θύρα φόρτισης) */
const CHG_PTS = [[500, 248], [480, 246], [440, 243], [400, 241], [376, 237], [367, 231], [370, 226], [390, 222], [430, 220], [470, 217], [486, 213], [486, 209], [470, 205], [454, 201], [442, 190], [434, 168], [430, 146], [424, 126], [417, 115]];
const CHG_PORT = [399, 117];
const smoothPath = (p) => {
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
    d += `C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0]} ${c[1]}`;
  }
  return d;
};
const CHG_D = smoothPath(CHG_PTS);
const OPEN_ITEMS = [
  ["binary_sensor.front_left_door", "Εμπρός αριστερή πόρτα"],
  ["binary_sensor.front_right_door", "Εμπρός δεξιά πόρτα"],
  ["binary_sensor.rear_left_door", "Πίσω αριστερή πόρτα"],
  ["binary_sensor.rear_right_door", "Πίσω δεξιά πόρτα"],
  ["binary_sensor.front_left_window_open", "Εμπρός αριστερό παράθυρο"],
  ["binary_sensor.front_right_window_open", "Εμπρός δεξί παράθυρο"],
  ["binary_sensor.rear_left_window_open", "Πίσω αριστερό παράθυρο"],
  ["binary_sensor.rear_right_window_open", "Πίσω δεξί παράθυρο"],
  ["binary_sensor.hood", "Καπό"],
  ["binary_sensor.trunk", "Πορτμπαγκάζ"],
];
// [κλειδί, ετικέτα, εικονίδιο]
const DIAG = [
  ["binary_sensor.airbag_warning", "Airbag", "airbag"],
  ["binary_sensor.abs_warning", "ABS", "abs"],
  ["binary_sensor.brake_warning", "Φρένα", "brake"],
  ["binary_sensor.brake_fluid_warning", "Υγρά φρένων", "fluid"],
  ["binary_sensor.12_v_battery_warning", "Μπαταρία 12V", "battery12"],
  ["binary_sensor.traction_battery_low_warning", "Χαμηλή μπαταρία έλξης", "battery"],
  ["binary_sensor.power_system_warning", "Σύστημα ισχύος", "bolt"],
  ["binary_sensor.power_limit_warning", "Περιορισμός ισχύος", "bolt"],
  ["binary_sensor.power_steering_warning", "Υποβοήθηση τιμονιού", "steering"],
  ["binary_sensor.tire_pressure_warning", "Πίεση ελαστικών", "tirealert"],
  ["binary_sensor.front_left_tire_alarm", "Ελαστικό εμπρός αριστερά", "tirealert"],
  ["binary_sensor.front_right_tire_alarm", "Ελαστικό εμπρός δεξιά", "tirealert"],
  ["binary_sensor.rear_left_tire_alarm", "Ελαστικό πίσω αριστερά", "tirealert"],
  ["binary_sensor.rear_right_tire_alarm", "Ελαστικό πίσω δεξιά", "tirealert"],
  ["binary_sensor.key_fob_battery_low", "Μπαταρία κλειδιού", "key"],
];
// Έτοιμες «πληροφορίες»: id → [κλειδί, ετικέτα, εικονίδιο, δεκαδικά]
const INFO_ITEMS = {
  odometer: ["sensor.total_odometer", "Χιλιόμετρα", "road", 0],
  outside_temp: ["sensor.outside_temperature", "Έξω", "thermo", 1],
  inside_temp: ["sensor.inside_temperature", "Μέσα", "thermo", 1],
  humidity: ["sensor.cabin_humidity", "Υγρασία", "drop", 0],
  fuel_level: ["sensor.fuel_level", "Καύσιμο", "fuel", 0],
  fuel_volume: ["sensor.fuel_volume", "Βενζίνη", "fuel", 0],
  power_status: ["sensor.power_status", "Ισχύς", "engine", null],
  charge_status: ["sensor.charge_status", "Φόρτιση", "plug", null],
};
const INFO_IDS = Object.keys(INFO_ITEMS);

const OTHER_KEYS = [
  "lock.doors", "sensor.battery_level", "sensor.remaining_range", "sensor.fuel_range", "sensor.inside_temperature",
  "sensor.last_updated", "sensor.remaining_charge_time_h_mm", "sensor.ac_charge_current", "sensor.charge_current",
  "sensor.dc_charge_current", "sensor.charging_type", "sensor.license_plate", "binary_sensor.charging",
  "binary_sensor.charger_plugged", "binary_sensor.cloud_connection", "binary_sensor.position_lamp",
  "binary_sensor.low_beam", "binary_sensor.high_beam", "binary_sensor.climate_on", "cover.windows", "cover.trunk",
  "climate.cabin_climate", "button.honk_horn", "button.flash_lights", "button.flash_lights_and_honk",
  "button.refresh_vehicle_data", "switch.steering_wheel_heating",
  "binary_sensor.steering_wheel_heater",
  ...["front_left", "front_right", "rear_left", "rear_right"].flatMap((p) => [`sensor.${p}_tire_pressure`]),
  ...["front_left", "front_right"].flatMap((p) => [`number.${p}_seat_heating_level`, `number.${p}_seat_ventilation_level`]),
];
const TIRES = [
  { id: "front_left", x: 246, y: 195, side: -1, name: "Εμπρός αριστερά" },
  { id: "front_right", x: 500, y: 195, side: 1, name: "Εμπρός δεξιά" },
  { id: "rear_left", x: 236, y: 588, side: -1, name: "Πίσω αριστερά" },
  { id: "rear_right", x: 501, y: 588, side: 1, name: "Πίσω δεξιά" },
];
const TOP_BOX = { x: 120, y: 22, w: 510, h: 720 }; // θέση των layers μέσα στο πλέγμα 750×750
const TOP_LAYERS = [
  ["low_beam", "low_beam_on"],
  ["hood", "hood_open", "hood_closed", "binary_sensor.hood"],
  ["trunk", "trunk_open", "trunk_closed", "binary_sensor.trunk"],
  ["fl", "door_front_left_open", "door_front_left_closed", "binary_sensor.front_left_door"],
  ["fr", "door_front_right_open", "door_front_right_closed", "binary_sensor.front_right_door"],
  ["rl", "door_rear_left_open", "door_rear_left_closed", "binary_sensor.rear_left_door"],
  ["rr", "door_rear_right_open", "door_rear_right_closed", "binary_sensor.rear_right_door"],
  ["wfl", "window_front_left_open", null, "binary_sensor.front_left_window_open"],
  ["wfr", "window_front_right_open", null, "binary_sensor.front_right_window_open"],
  ["wrl", "window_rear_left_open", null, "binary_sensor.rear_left_window_open"],
  ["wrr", "window_rear_right_open", null, "binary_sensor.rear_right_window_open"],
];
const INT_SIZE = { w: 745, h: 560 };
// hotspots εσωτερικού: [id, κλειδί, εικονίδιο, ετικέτα, x%, y%, layer]
const INT_SPOTS = [
  ["sh_l", "number.front_left_seat_heating_level", "seat", "Θέρμανση οδηγού", 19, 64, "seat_heat_driver_on"],
  ["sv_l", "number.front_left_seat_ventilation_level", "fan", "Αερισμός οδηγού", 35, 64, "seat_vent_driver_on"],
  ["st", "switch.steering_wheel_heating", "steering", "Θέρμανση τιμονιού", 27, 33, "steering_wheel_heat_on"],
  ["sh_r", "number.front_right_seat_heating_level", "seat", "Θέρμανση συνοδηγού", 65, 64, "seat_heat_passenger_on"],
  ["sv_r", "number.front_right_seat_ventilation_level", "fan", "Αερισμός συνοδηγού", 81, 64, "seat_vent_passenger_on"],
];
const INT_LAYERS = ["seat_heat_driver_on", "seat_heat_passenger_on", "seat_vent_driver_on", "seat_vent_passenger_on", "steering_wheel_heat_on"];

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");
const CONFIRM_TEXT = {
  unlock: ["Ξεκλείδωμα οχήματος;", "Το όχημα θα ξεκλειδώσει."],
  trunk: ["Άνοιγμα πορτμπαγκάζ;", "Το πορτμπαγκάζ θα ανοίξει."],
  windows: ["Άνοιγμα παραθύρων;", "Όλα τα παράθυρα θα ανοίξουν."],
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);
const lsRead = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (_) { return null; } };
const lsWrite = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

/* Μικρός serializer YAML για την εξαγωγή ρυθμίσεων */
const yamlScalar = (v) => (typeof v === "string" ? (/^[\w./-]+$/.test(v) && !/^(true|false|null|\d.*)$/.test(v) ? v : JSON.stringify(v)) : String(v));
function toYaml(v, ind = 0) {
  const pad = " ".repeat(ind);
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    return v.map((x) => (x && typeof x === "object" ? `${pad}-\n${toYaml(x, ind + 4).replace(/^\s+/, " ".repeat(ind + 2))}`.replace(/\n\s*$/, "") : `${pad}- ${yamlScalar(x)}`)).join("\n");
  }
  if (v && typeof v === "object") {
    const ks = Object.keys(v);
    if (!ks.length) return "{}";
    return ks
      .map((k) => {
        const x = v[k];
        if (x && typeof x === "object" && (Array.isArray(x) ? x.length : Object.keys(x).length)) return `${pad}${k}:\n${toYaml(x, ind + 2)}`;
        return `${pad}${k}: ${x && typeof x === "object" ? (Array.isArray(x) ? "[]" : "{}") : yamlScalar(x)}`;
      })
      .join("\n");
  }
  return `${pad}${yamlScalar(v)}`;
}

/* ───────────────────────── Στυλ ───────────────────────── */
const BASE_CSS = `
[hidden], [data-off] { display:none !important; }
button, input, select { font: inherit; color: inherit; }
.i { width: var(--is, 20px); height: var(--is, 20px); fill: none; stroke: currentColor; stroke-width: 1.6;
  stroke-linecap: round; stroke-linejoin: round; flex: none; }
.i .a { fill: currentColor; fill-opacity: .2; }
.i .k { fill: currentColor; stroke: none; }
.seg { display:flex; padding:3px; gap:3px; border-radius:14px; background: var(--ds-soft); border:1px solid var(--ds-line); }
.seg button { flex:1; display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:7px 6px; border-radius:11px;
  border:0; background:transparent; cursor:pointer; font-size:12.5px; font-weight:600; color: var(--ds-fg2); white-space:nowrap; }
.seg button .i { --is:16px; }
.seg button.on { background: rgba(var(--ds-info), .2); color: var(--ds-fg); }
.btn { padding:10px 12px; border-radius:14px; border:1px solid var(--ds-line); background: var(--ds-soft); cursor:pointer; font-size:13.5px; font-weight:600; }
.btn.go { background: rgba(var(--ds-warn), .18); border-color: rgba(var(--ds-warn), .5); }
.btn.sm { padding:6px 10px; font-size:12.5px; border-radius:11px; }
.btnrow { display:flex; gap:8px; } .btnrow > * { flex:1; }
.mv { width:30px; height:30px; display:grid; place-items:center; border-radius:10px; border:1px solid var(--ds-line);
  background:transparent; cursor:pointer; color: var(--ds-fg2); flex:none; padding:0; }
.mv .i { --is: 16px; } .mv[disabled] { opacity:.25; cursor:default; }
.sw { position:relative; width:34px; height:20px; border-radius:999px; background: var(--ds-line); transition: background .2s; flex:none; display:block; }
.sw::after { content:""; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition: transform .2s; }
.on > .sw, .sw.on { background: rgb(var(--ds-info)); } .on > .sw::after, .sw.on::after { transform: translateX(14px); }
`;
const VARS = `
  --ds-r: 22px; --ds-ok: 52,211,153; --ds-warn: 251,191,36; --ds-bad: 248,113,113; --ds-info: 56,189,248; --ds-ev: 52,211,153; --ds-fu: 52,211,153;
  --ds-fg: var(--primary-text-color, #fff); --ds-fg2: var(--secondary-text-color, rgba(255,255,255,.6));
  --ds-line: rgba(var(--rgb-primary-text-color, 255,255,255), .12); --ds-soft: rgba(var(--rgb-primary-text-color, 255,255,255), .06);
`;

const CSS = `
:host { display:block; }
ha-card { ${VARS}
  position: relative; overflow: hidden; padding: 14px; border-radius: 28px; display: flex; flex-direction: column; gap: 16px;
  font-variant-numeric: tabular-nums;
  background: radial-gradient(90% 60% at 0% 0%, rgba(var(--ds-ev), .10), transparent 60%),
    radial-gradient(90% 60% at 100% 0%, rgba(var(--ds-fu), .08), transparent 60%),
    var(--ha-card-background, var(--card-background-color, #1c1c1c)); }
${BASE_CSS}

/* Hero */
.hero { position: relative; overflow: hidden; background: #000; border-radius: var(--ds-r); aspect-ratio: var(--ds-aspect, 16 / 9); isolation: isolate; }
.stage { position:absolute; inset:0; }
.stage img { position:absolute; inset:0; width:100%; height:100%; object-fit: cover; opacity:0; transition: opacity .55s ease;
  transform: scale(var(--ds-scale, 1.2)); transform-origin: center center; }
.stage img.on { opacity:1; }
.shade-top, .shade-bot { position:absolute; left:0; right:0; pointer-events:none; z-index:5; }
.shade-top { top:0; height:38%; background: linear-gradient(180deg, rgba(0,0,0,.72), transparent); }
.shade-left { position:absolute; left:0; top:0; bottom:0; width:62%; pointer-events:none; z-index:5; background: linear-gradient(90deg, rgba(0,0,0,.78), rgba(0,0,0,.45) 55%, transparent); }
.shade-bot { bottom:0; height:30%; background: linear-gradient(0deg, rgba(0,0,0,.55), transparent); }
.hero-top { position:absolute; top:0; left:0; right:0; z-index:8; display:flex; justify-content:space-between; align-items:flex-start; padding: 16px 18px; color:#fff; }
.title { font-size: 15px; font-weight: 600; letter-spacing: -.01em; line-height: 1.15; display:flex; align-items:baseline; gap:8px; }
.plate { font-size: 11px; font-weight:500; opacity:.6; letter-spacing:.05em; }
.total { margin-top: 8px; }
.total .big { font-size: 40px; font-weight: 300; letter-spacing: -.03em; line-height: .92; text-shadow: 0 2px 14px rgba(0,0,0,.5); }
.total .big small { font-size: 16px; font-weight: 400; margin-left:4px; opacity:.8; letter-spacing:0; }
.total .cap { margin-top: 3px; font-size: 11.5px; opacity:.65; }
.total .split { margin-top: 6px; display:flex; gap:10px; font-size: 12px; color: rgba(255,255,255,.85); }
.total .split span { display:inline-flex; align-items:center; gap:4px; } .total .split .i { --is: 14px; }
.total .split .e .i { color: rgb(var(--ds-ev)); } .total .split .f .i { color: rgb(var(--ds-fu)); }
.rfs { position:relative; flex:none; width:30px; height:30px; padding:0; border-radius:50%; display:grid; place-items:center; cursor:pointer; color: rgba(255,255,255,.8);
  background: rgba(10,11,15,.45); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border:1px solid rgba(255,255,255,.16); -webkit-tap-highlight-color: transparent; transition: transform .14s ease; }
.rfs[hidden] { display:none; } .rfs .i { --is:15px; } .rfs:active { transform: scale(.9); } .rfs.success { color: rgb(var(--ds-ok)); } .rfs.error { color: rgb(var(--ds-bad)); }
.rfs .ring { position:absolute; inset:-3px; width: calc(100% + 6px); height: calc(100% + 6px); pointer-events:none; overflow:visible; }
.rfs .ring rect { fill:none; stroke: rgba(255,255,255,.85); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 20 80; animation: ds-dash 1.2s linear infinite; }
.meta { display:flex; align-items:center; gap:6px; margin: -4px -6px 0 0; }
.cloud { display:inline-grid; place-items:center; height:30px; padding:0 2px; border:0; background:none; cursor:pointer; filter: drop-shadow(0 1px 5px rgba(0,0,0,.6)); }
.cloud .i { --is: 21px; } .cloud.ok .i { color: rgb(var(--ds-ok)); } .cloud.bad .i { color: rgb(var(--ds-bad)); }
.fx { position:absolute; inset:0; pointer-events:none; display:none; }
.hero.unlocked .fx-handles { display:block; }
.fx-handles { z-index:3; --fx:66.2%; --fy:41.2%; --rx:79.6%; --ry:38.5%; }
.fx-handles .halo, .fx-handles .core { position:absolute; inset:0; }
.fx-handles .halo { filter: blur(4px); animation: ds-glow 2.2s ease-in-out infinite;
  background: radial-gradient(ellipse 4.6% 1.8% at var(--fx) var(--fy), rgba(255,35,15,.95) 0%, rgba(255,25,10,.75) 25%, rgba(255,15,5,.38) 48%, rgba(255,0,0,.12) 70%, rgba(255,0,0,0) 100%),
    radial-gradient(ellipse 4.6% 1.8% at var(--rx) var(--ry), rgba(255,35,15,.95) 0%, rgba(255,25,10,.75) 25%, rgba(255,15,5,.38) 48%, rgba(255,0,0,.12) 70%, rgba(255,0,0,0) 100%); }
.fx-handles .core { filter: blur(1.5px); animation: ds-core 2.2s ease-in-out infinite;
  background: radial-gradient(ellipse 2.3% .7% at var(--fx) var(--fy), rgba(255,130,100,.95) 0%, rgba(255,50,25,.65) 35%, transparent 100%),
    radial-gradient(ellipse 2.3% .7% at var(--rx) var(--ry), rgba(255,130,100,.95) 0%, rgba(255,50,25,.65) 35%, transparent 100%); }
.fxs { position:absolute; inset:0; z-index:3; pointer-events:none; display:none; transform: scale(var(--ds-scale, 1.2)); transform-origin:center center; }
.hero[data-fx]:not([data-fx=""]) .fxs { display:block; }
.fxs svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; } .fxs path, .fxs circle { fill:none; visibility:hidden; }
.cb { stroke: rgb(52,211,153); stroke-width:3.4; opacity:.22; filter: blur(1.6px); }
.cf { stroke: rgb(120,245,190); stroke-width:2.2; stroke-linecap:round; stroke-dasharray: 5 20; filter: drop-shadow(0 0 2px rgb(52,211,153)); animation: ds-cab 1.2s linear infinite; }
@keyframes ds-cab { to { stroke-dashoffset: -25; } }
.pr { stroke: rgb(120,245,190); stroke-width:1.4; transform-box: fill-box; transform-origin:center; opacity:0; animation: ds-ring 2.2s ease-out infinite; } .pr.r2 { animation-delay:1.1s; }
@keyframes ds-ring { 0% { transform: scale(.5); opacity:.95; } 100% { transform: scale(3); opacity:0; } }
.pg { fill: rgb(52,211,153) !important; filter: blur(3px); animation: ds-pg 2.2s ease-in-out infinite; }
@keyframes ds-pg { 0%,100% { opacity:.25; } 50% { opacity:.8; } }
.hero[data-fx~="flow"] .cb, .hero[data-fx~="flow"] .cf, .hero[data-fx~="port"] .pr, .hero[data-fx~="port"] .pg { visibility:visible; }
.sweep { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:none; mix-blend-mode: screen; opacity:.85;
  filter: brightness(2.4) sepia(1) hue-rotate(78deg) saturate(6);
  -webkit-mask-image: linear-gradient(105deg, transparent 45%, #000 50%, transparent 55%); mask-image: linear-gradient(105deg, transparent 45%, #000 50%, transparent 55%);
  -webkit-mask-size: 300% 100%; mask-size: 300% 100%; -webkit-mask-repeat:no-repeat; mask-repeat:no-repeat; animation: ds-sweep 3.4s ease-in-out infinite; }
.hero[data-fx~="sweep"] .sweep { display:block; }
@keyframes ds-sweep { from { -webkit-mask-position: 100% 0; mask-position: 100% 0; } to { -webkit-mask-position: 0% 0; mask-position: 0% 0; } }
@keyframes ds-glow { 0%,100% { opacity:.30 } 50% { opacity:1 } }
@keyframes ds-core { 0%,100% { opacity:.25 } 55% { opacity:1 } }
.toast { position:absolute; left:50%; top:20px; z-index:40; transform: translate(-50%, -8px); max-width: calc(100% - 28px); padding: 8px 14px; border-radius: 999px;
  font-size: 12.5px; font-weight: 500; color:#fff; opacity:0; pointer-events:none; background: rgba(20,20,24,.82); border:1px solid rgba(255,255,255,.16);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); transition: opacity .2s ease, transform .2s ease; white-space: nowrap; overflow:hidden; text-overflow: ellipsis; }
.toast.show { opacity:1; transform: translate(-50%, 0); } .toast.warn { border-color: rgba(var(--ds-warn), .55); } .toast.error { border-color: rgba(var(--ds-bad), .55); } .toast.ok { border-color: rgba(var(--ds-ok), .55); }

/* Κουμπιά (κυκλικά, σαν της εφαρμογής) */
.actions { --bs: 52px; container-type: inline-size; padding: 2px 0; }
.actions.sz-s { --bs: 42px; } .actions.sz-l { --bs: 62px; }
.actions.grid { display:grid; grid-template-columns: repeat(5, 1fr); gap: 18px 4px; }
.actions.scroll { display:flex; gap: 12px; overflow-x:auto; scrollbar-width:none; padding: 2px 2px 4px; scroll-snap-type:x proximity; }
.actions.scroll::-webkit-scrollbar { display:none; }
.actions.scroll .cell { flex:none; width: calc(var(--bs) + 22px); scroll-snap-align:start; }
.actions.fit { display:flex; gap:4px; justify-content:space-between; }
.actions.fit .cell { flex:1 1 0; } .actions.fit .act { --bs: clamp(32px, 11cqw, 52px); }
.cell { --c: var(--ds-info); display:flex; flex-direction:column; align-items:center; gap:6px; min-width:0; }
.cell.warn { --c: var(--ds-warn); } .cell.bad { --c: var(--ds-bad); }
.cell .cap { max-width:100%; font-size:11px; line-height:1.15; text-align:center; color: var(--ds-fg2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cell .cap.t { color: var(--ds-fg); font-weight:600; font-size:11.5px; }
.cell.warn .cap.s, .cell.bad .cap.s { color: rgb(var(--c)); }
.act { --c: var(--ds-info); position:relative; flex:none; display:grid; place-items:center; width: var(--bs); height: var(--bs); padding:0; cursor:pointer; border-radius:50%;
  border:1px solid var(--ds-line); background: var(--ds-soft); color: var(--ds-fg);
  -webkit-tap-highlight-color: transparent; transition: transform .14s ease, background .25s ease, border-color .25s ease, box-shadow .25s ease; }
.act .i { width: 46%; height: 46%; color: var(--ds-fg); transition: color .25s ease; }
.act.ok { --c: var(--ds-ok); } .cell.ok { --c: var(--ds-ok); }
.act.warn { --c: var(--ds-warn); } .act.bad { --c: var(--ds-bad); }
.act.warn:not(.on), .act.bad:not(.on) { border-color: rgba(var(--c), .55); } .act.warn:not(.on) .i, .act.bad:not(.on) .i { color: rgb(var(--c)); }
.act.on { background: rgb(var(--c)); border-color: transparent; box-shadow: 0 6px 18px rgba(var(--c), .35); }
.act.on .i { color:#fff; } .act.on.warn .i { color:#1d1400; }
.act:active:not([disabled]) { transform: scale(.92); } .act:focus-visible { outline: 2px solid rgb(var(--c)); outline-offset: 2px; }
.act[disabled] { opacity:.4; cursor:not-allowed; }
.act .dot { position:absolute; top:5px; right:5px; width:7px; height:7px; border-radius:50%; background: rgb(var(--c)); }
.act.on .dot { background:#fff; }
.act .ring { position:absolute; inset:-3px; width: calc(100% + 6px); height: calc(100% + 6px); pointer-events:none; overflow:visible; }
.act .ring rect { fill:none; stroke: rgb(var(--c)); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 20 80; animation: ds-dash 1.2s linear infinite; }
@keyframes ds-dash { to { stroke-dashoffset: -100; } }
.act.success { --c: var(--ds-ok); } .act.error { --c: var(--ds-bad); animation: ds-shake .35s ease; }
@keyframes ds-shake { 25% { transform: translateX(-3px) } 75% { transform: translateX(3px) } }

/* Κατάσταση πάνω στην εικόνα */
.status { position:absolute; left:18px; bottom:16px; z-index:8; max-width: 62%; display:flex; align-items:center; gap:10px; color:#fff; text-shadow: 0 1px 10px rgba(0,0,0,.65); }
.status .i { --is: 24px; color: rgb(var(--st)); filter: drop-shadow(0 1px 6px rgba(0,0,0,.6)); }
.status .t { font-size: 14px; font-weight: 600; line-height:1.2; } .status .s { font-size: 11.5px; opacity:.78; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.status > div { min-width:0; }

/* Πλακίδια θερμοκρασίας / μπαταρίας */
.stats { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.t2 { position:relative; overflow:hidden; min-height:104px; padding: 10px 14px 12px; border-radius: 22px; background: var(--ds-soft); border:1px solid var(--ds-line); text-align:left; color: var(--ds-fg); }
.t2[data-open] { cursor:pointer; -webkit-tap-highlight-color: transparent; transition: transform .14s ease; } .t2[data-open]:active { transform: scale(.985); }
.t2 .tt { position:relative; z-index:1; font-size: 14.5px; font-weight: 600; letter-spacing:-.01em; }
.t2 .ts { margin-top: 4px; font-size: 12px; color: var(--ds-fg2); line-height:1.35; }
.t2 .ts b { font-weight:600; color: var(--ds-fg); font-size: 13px; }
.t2 .ts.chg, .t2 .ts.chg b { color: rgb(var(--ds-ok)); } .t2.batt .ts { max-width: 58%; } .t2 .ts .sub { font-size: 11.5px; color: var(--ds-fg2); }
.gauge .fg { stroke: rgb(var(--ds-ev)); opacity:.28; }
.gauge .fp { stroke: rgb(var(--ds-ev)); filter: brightness(1.3) drop-shadow(0 0 3px rgba(var(--ds-ev), .8)); animation: ds-chgflow 2.4s cubic-bezier(.45,.05,.55,.95) infinite, ds-chgfade 2.4s linear infinite; }
@keyframes ds-chgflow { from { stroke-dashoffset: var(--fs); } to { stroke-dashoffset: var(--fe); } }
@keyframes ds-chgfade { 0% { opacity: 0; } 15% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
.t2 .lg { margin-top: 10px; display:flex; flex-direction:column; gap:3px; font-size:12.5px; }
.t2 .lg span { display:flex; align-items:center; gap:5px; } .t2 .lg .i { --is: 15px; } .t2 .lg b { color: var(--ds-fg); font-weight:600; }
.t2 .lg small { color: var(--ds-fg2); font-size: 11px; }
.knob { --kc: var(--ds-info); position:absolute; right:-18px; bottom:-16px; width: 112px; height: 112px; border-radius:50%; border:0; cursor:pointer; padding:0;
  display:grid; place-items:center; box-sizing:border-box;
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.16), rgba(255,255,255,.05) 70%); box-shadow: inset 0 0 0 1px var(--ds-line), 0 10px 24px rgba(0,0,0,.25);
  -webkit-tap-highlight-color: transparent; transition: background .3s ease, transform .14s ease, box-shadow .3s ease; }
.knob .i { --is: 32px; color: var(--ds-fg2); transition: color .3s ease; }
.knob.on { background: radial-gradient(circle at 35% 30%, rgba(var(--kc), .95), rgba(var(--kc), .7)); box-shadow: 0 10px 28px rgba(var(--kc), .4); } .knob.on .i { color:#fff; }
.knob:active { transform: scale(.94); } .knob[disabled] { opacity:.4; }
.knob .ring { position:absolute; inset:-2px; width: calc(100% + 4px); height: calc(100% + 4px); pointer-events:none; overflow:visible; }
.knob .ring rect { fill:none; stroke: rgb(var(--kc)); stroke-width: 3.5; stroke-linecap: round; stroke-dasharray: 20 80; animation: ds-dash 1.2s linear infinite; }
.gauge { position:absolute; right:-18px; bottom:-16px; width: 112px; height: 112px; pointer-events:none; }
.gauge svg { width:100%; height:100%; transform: rotate(90deg); overflow:visible; }
.gauge circle { fill:none; stroke-linecap:round; } .gauge .tr { stroke: var(--ds-line); }
.gauge .ev { stroke: rgb(var(--ds-ev)); filter: drop-shadow(0 0 4px rgba(var(--ds-ev), .5)); transition: stroke-dasharray .8s ease; }
.gauge .fu { stroke: rgb(var(--ds-fu)); transition: stroke-dasharray .8s ease; }
.gauge .c { position:absolute; inset:0; display:grid; place-items:center; font-size:22px; font-weight:600; letter-spacing:-.02em; color: var(--ds-fg); }
.gauge .c small { font-size:10px; font-weight:500; color: var(--ds-fg2); }

/* Όχημα */
.veh { display:flex; flex-direction:column; gap:10px; flex:1 1 auto; min-height:0; overflow-y:auto; overflow-x:hidden; scrollbar-width:none; } .veh::-webkit-scrollbar { display:none; }
.box.wide { padding-bottom:14px; }
.dash { position:relative; width:100%; aspect-ratio: 510 / 285; background:#000; border-radius: var(--ds-r); overflow:hidden; }
.dash img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition: opacity .5s ease; }
.dash .air { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; opacity:0; transition: opacity .6s ease; }
.dash.air .air { opacity:1; }
.air { --sp: 1; }
.air .st { fill:none; stroke-linecap:round; stroke-dasharray: 62 38; animation: ds-flow calc(var(--t, 2.4s) / var(--sp)) linear infinite; animation-delay: var(--d, 0s); }
.air .gl { fill:none; stroke-linecap:round; }
.air .bg { opacity:.85; animation: ds-air 3.2s ease-in-out infinite; animation-delay: var(--d, 0s); mix-blend-mode: screen; }
@keyframes ds-flow { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
@keyframes ds-air { 0%,100% { opacity:.62 } 50% { opacity:1 } }
.dash .ttl, .seatsttl { font-size:12px; color: var(--ds-fg2); }
.seatsttl { margin:2px 2px 0; }
.dash .spot { z-index:2; }
.vstage { position:relative; width:100%; border-radius: var(--ds-r); overflow:hidden; flex:none; background: radial-gradient(70% 70% at 50% 45%, rgba(255,255,255,.07), rgba(0,0,0,.0) 70%); }
.vstage > svg { display:block; width:100%; height:auto; }
.vstage .l { opacity:0; transition: opacity .35s ease; } .vstage .l.on { opacity:1; }
.vmiss { padding:18px 12px; text-align:center; font-size:12.5px; color: var(--ds-fg2); }
.pill rect { stroke-width: 1.5; } .pill text { font-weight:600; font-family: inherit; }
.ipane .sbtn { position:absolute; transform: translate(-50%,-50%); width:54px; padding:9px 0 7px; gap:5px; border-radius:18px; background: rgba(14,15,20,.66); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color:#fff; border-color: rgba(255,255,255,.2); }
.ipane .sbtn:active { transform: translate(-50%,-50%) scale(.94); } .ipane .sbtn .nm { display:none; } .ipane .sbtn .i { --is:28px; }
.sbtn { --c: var(--ds-info); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:12px 2px 9px; min-width:0; border-radius:20px; cursor:pointer; color: var(--ds-fg2);
  border:1px solid var(--ds-line); background: var(--ds-soft); -webkit-tap-highlight-color: transparent; transition: transform .12s ease, background .2s ease, border-color .2s ease; }
.sbtn.hot { --c: 251,113,60; } .sbtn.cool { --c: 56,189,248; } .sbtn:active { transform: scale(.94); }
.sbtn .i { --is: 30px; } .sbtn .nm { font-size:10.5px; line-height:1.15; text-align:center; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sbtn.lv { border-color: rgba(var(--c), .7); background: rgba(var(--c), .16); color: var(--ds-fg); } .ipane .sbtn.lv { background: rgba(14,15,20,.74); } .sbtn.lv .i { color: rgb(var(--c)); }
.sbtn .lvl { display:flex; gap:3px; height:4px; } .sbtn .lvl i { width:10px; height:4px; border-radius:2px; background: var(--ds-line); } .sbtn .lvl i.f { background: rgb(var(--c)); }
.sbtn .lvl[hidden] { display:flex !important; visibility:hidden; }
.ipane { border-radius: var(--ds-r); overflow:hidden; position:relative; width:100%; aspect-ratio: ${INT_SIZE.w} / ${INT_SIZE.h}; background:#0b0c10; }
.ipane img { position:absolute; inset:0; width:100%; height:100%; transition: opacity .35s ease; }
.ipane img.l { opacity:0; } .ipane img.l.on { opacity:1; }
.spot { --c: var(--ds-info); position:absolute; transform: translate(-50%,-50%); display:flex; flex-direction:column; align-items:center; gap:3px; padding:6px 8px; min-width:44px;
  border-radius:16px; cursor:pointer; border:1px solid rgba(255,255,255,.16); background: rgba(14,15,20,.62); color:#fff;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); -webkit-tap-highlight-color: transparent; transition: transform .12s ease, border-color .2s ease; }
.spot.lv { border-color: rgba(var(--c), .65); } .spot.hot { --c: 251,113,60; } .spot.cool { --c: 56,189,248; }
.spot .i { --is: 20px; } .spot.lv .i { color: rgb(var(--c)); } .spot:active { transform: translate(-50%,-50%) scale(.93); }
.spot .lvl { display:flex; gap:2px; } .spot .lvl i { width:7px; height:3px; border-radius:2px; background: rgba(255,255,255,.25); } .spot .lvl i.f { background: rgb(var(--c)); }
.spot .nm { font-size:9.5px; opacity:.75; white-space:nowrap; }
.vcol { display:flex; flex-direction:column; gap:10px; }
.crow { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.crow .in { font-size:12px; color: var(--ds-fg2); line-height:1.4; } .crow .in b { color: var(--ds-fg); font-weight:600; font-size:13px; }
.crow .act { --bs: 46px; }
/* Number picker (προσαρμογή του deepal-number-picker) */
.pk { position:relative; padding: 12px 0 10px; border-radius:18px; background: var(--ds-soft); border:1px solid var(--ds-line); user-select:none; -webkit-user-select:none; --pkbg: var(--ha-card-background, var(--card-background-color, #1c1c1c)); }
.pk .pt { text-align:center; font-size:12px; color: var(--ds-fg2); }
.pk .pv { display:flex; justify-content:center; align-items:flex-start; height:46px; font-size:38px; font-weight:500; line-height:44px; color: var(--ds-fg); letter-spacing:-.02em; }
.pk .pv small { font-size:16px; margin:3px 0 0 3px; }
.pk .pw { position:relative; height:52px; overflow:hidden; }
.pk .pp { --iw: 64px; display:flex; align-items:center; height:52px; overflow-x:auto; overflow-y:hidden; box-sizing:border-box; padding: 0 calc(50% - var(--iw) / 2);
  scroll-snap-type:x mandatory; scrollbar-width:none; touch-action:pan-x; -webkit-overflow-scrolling:touch; }
.pk .pp::-webkit-scrollbar { display:none; }
.pk .pn { flex:0 0 var(--iw); text-align:center; scroll-snap-align:center; scroll-snap-stop:always; color: rgba(var(--rgb-primary-text-color, 255,255,255), .3); font-size:16px; font-weight:500; transform:scale(.88); cursor:pointer;
  transition: transform .16s ease, color .16s ease; }
.pk .pn.near { color: rgba(var(--rgb-primary-text-color, 255,255,255), .55); transform:scale(.95); }
.pk .pn.act2 { color: var(--ds-fg); font-size:21px; font-weight:700; transform:scale(1); }
.pk .pc { position:absolute; left:50%; bottom:0; width:28px; height:3px; transform:translateX(-50%); border-radius:3px; background: rgb(var(--ds-info)); pointer-events:none; }
.pk .pf { position:absolute; top:0; bottom:0; width:56px; z-index:2; pointer-events:none; }
.pk .pf.l { left:0; background: linear-gradient(to right, var(--pkbg), transparent); } .pk .pf.r { right:0; background: linear-gradient(to left, var(--pkbg), transparent); }
.pk.cold .pc { background: rgb(56,189,248); } .pk.hot .pc { background: rgb(251,146,60); }
.vline { display:flex; flex-wrap:wrap; gap:6px; font-size:12px; color: var(--ds-fg2); }
.vline b { color: rgb(var(--c)); font-weight:600; }

[data-ent], .t2[data-open] { cursor:pointer; -webkit-tap-highlight-color: transparent; -webkit-touch-callout:none; user-select:none; -webkit-user-select:none; }
.tile[data-ent]:active, .chip[data-ent]:active, .t2[data-ent]:active, .total[data-ent]:active { transform: scale(.97); }
.status[data-ent], .total[data-ent] { cursor:pointer; }

/* Πληροφορίες */
.info { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; } .info::-webkit-scrollbar { display:none; }
.tile { flex:1 0 auto; min-width: 88px; display:flex; align-items:center; gap:9px; padding:9px 12px; border-radius:16px; background: var(--ds-soft); border:1px solid var(--ds-line); }
.tile .i { --is: 20px; color: rgb(var(--ds-info)); } .tile .v { font-size:14px; font-weight:600; color: var(--ds-fg); white-space:nowrap; } .tile .l { font-size:11px; color: var(--ds-fg2); white-space:nowrap; }
.tells { position:absolute; right:16px; bottom:16px; z-index:8; display:flex; gap:6px; } .tells[hidden] { display:none; }
.tell { --c: var(--ds-bad); position:relative; width:34px; height:34px; padding:0; border:0; background:none; display:grid; place-items:center; cursor:pointer;
  color: rgb(var(--c)); filter: drop-shadow(0 0 7px rgba(var(--c), .55)) drop-shadow(0 1px 4px rgba(0,0,0,.7)); -webkit-tap-highlight-color: transparent; }
.tell .i { --is: 30px; } .tell.ok { --c: var(--ds-ok); } .tell.na { --c: 148,163,184; } .tell:active { transform: scale(.92); }
.tell.more { color:#fff; font-size:12px; font-weight:600; filter:none; width:auto; padding:0 4px; text-shadow:0 1px 6px rgba(0,0,0,.7); }
.tile.bad .i { color: rgb(var(--ds-bad)); }

/* Διαγνωστικά */
.diag { display:flex; align-items:flex-start; gap:8px; } .diag[data-empty-diag] { display:none; }
.chips { display:flex; flex-wrap:wrap; gap:6px; flex:1; min-width:0; }
.chip { display:inline-flex; align-items:center; gap:5px; padding: 5px 10px 5px 8px; border-radius:999px; font-size:12px; font-weight:500; color: var(--ds-fg);
  border:1px solid rgba(var(--c), .35); background: rgba(var(--c), .12); } .chip .i { --is: 15px; color: rgb(var(--c)); }
.gear { flex:none; width:30px; height:30px; display:grid; place-items:center; border-radius:50%; cursor:pointer; border:1px solid var(--ds-line); background: var(--ds-soft); color: var(--ds-fg2); padding:0; }
.gear .i { --is: 16px; }
.charge { display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; padding: 12px; border-radius:18px; border:1px solid rgba(var(--ds-ok), .28); background: linear-gradient(145deg, rgba(var(--ds-ok), .10), var(--ds-soft)); }
.charge > div { min-width:0; } .charge .l { font-size:11.5px; color: var(--ds-fg2); }
.charge .v { margin-top:3px; font-size:15px; font-weight:600; color: var(--ds-fg); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.foot { align-self:center; display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border:0; border-radius:999px; background:transparent; cursor:pointer; color: var(--ds-fg2); font-size:11.5px; opacity:.75; }
.foot .age { margin-right:4px; } .foot:not(.nosets) .age:not([hidden])::after { content:'·'; margin-left:10px; } .foot:hover, .foot:focus-visible { opacity:1; } .foot .i { --is: 14px; } .foot .sets { display:inline-flex; align-items:center; gap:6px; } .foot.nosets { cursor:default; pointer-events:none; } .foot.nosets .sets { display:none; }

/* Φύλλο */
.sheet { position:absolute; inset:0; z-index:20; display:none; align-items:flex-end; justify-content:center; padding:10px; background: rgba(0,0,0,.5); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); }
.sheet.show { display:flex; }
.box { width:100%; max-height:70%; min-height:min(300px, 100%); box-sizing:border-box; display:flex; flex-direction:column; padding:16px 14px 12px; border-radius:24px; background: var(--ha-card-background, var(--card-background-color, #222)); border:1px solid var(--ds-line); animation: ds-up .22s ease; overflow:hidden; }
.box.wide { overflow:hidden; max-height:94%; } .box.confirm { min-height:0; }
.box h3 { margin:0; font-size:16px; font-weight:600; color: var(--ds-fg); } .box p.c { margin:6px 0 12px; font-size:13px; color: var(--ds-fg2); text-align:center; }
.confirm { text-align:center; }
.hd { flex:none; display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.x { flex:none; width:30px; height:30px; display:grid; place-items:center; border-radius:50%; border:1px solid var(--ds-line); background: var(--ds-soft); cursor:pointer; padding:0; } .x .i { --is: 16px; }
.box deepal-s05-settings { flex:1 1 auto; min-height:0; display:block; overflow-y:auto; overflow-x:hidden; }
@keyframes ds-up { from { transform: translateY(16px); opacity:0 } to { transform:none; opacity:1 } }
@media (prefers-reduced-motion: reduce) { .fx *, .act, .act .ring rect, .gauge .fp, .fxs *, .stage img, .bar b, .box, .l { animation: none !important; transition: none !important; } }
`;

const SETTINGS_CSS = `
:host { display:block; ${VARS} color: var(--ds-fg); }
${BASE_CSS}
.wrap { display:flex; flex-direction:column; gap:10px; }
.tabs { display:flex; gap:3px; overflow-x:auto; scrollbar-width:none; } .tabs::-webkit-scrollbar { display:none; }
.tabs button { flex:none; padding:7px 11px; border-radius:11px; border:1px solid var(--ds-line); background:transparent; cursor:pointer; font-size:12.5px; font-weight:600; color: var(--ds-fg2); }
.tabs button.on { background: rgba(var(--ds-info), .2); color: var(--ds-fg); border-color: rgba(var(--ds-info), .4); }
.hint { margin:0; font-size:12px; color: var(--ds-fg2); line-height:1.4; }
h4 { margin:6px 0 2px; font-size:12px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color: var(--ds-fg2); }
.list { display:flex; flex-direction:column; gap:4px; }
.row { display:flex; align-items:center; gap:8px; padding:7px 8px 7px 11px; border-radius:13px; background: var(--ds-soft); min-height:44px; }
.row > span { flex:1; min-width:0; font-size:13.5px; overflow:hidden; text-overflow:ellipsis; } .row > span small { display:block; font-size:11px; color: var(--ds-fg2); }
.row.off > span { opacity:.45; } .row > .i { color: var(--ds-fg2); }
.row.tg { cursor:pointer; text-align:left; border:0; width:100%; } .row.tg.on > .i { color: rgb(var(--ds-info)); }
.swb { border:0; background:transparent; padding:6px 2px 6px 6px; cursor:pointer; display:grid; place-items:center; }
.field { display:flex; flex-direction:column; gap:4px; font-size:12px; color: var(--ds-fg2); }
.field.inline { flex-direction:row; align-items:center; justify-content:space-between; gap:10px; }
input[type=text], input[type=number], select { width:100%; box-sizing:border-box; padding:9px 11px; border-radius:11px; border:1px solid var(--ds-line); background: var(--ds-soft); color: var(--ds-fg); font-size:13.5px; min-width:0; }
input[type=number] { width:90px; }
select option { color:#000; }
.grid2 { display:grid; grid-template-columns: 1fr 1fr; gap:8px; }
.add { padding:10px; border-radius:14px; border:1px dashed var(--ds-line); display:flex; flex-direction:column; gap:8px; }
.icons { display:flex; flex-wrap:wrap; gap:4px; } .icons button { width:34px; height:34px; display:grid; place-items:center; border-radius:10px; border:1px solid var(--ds-line); background:transparent; cursor:pointer; color: var(--ds-fg2); padding:0; }
.icons button.on { border-color: rgb(var(--ds-info)); color: rgb(var(--ds-info)); background: rgba(var(--ds-info), .12); } .icons .i { --is: 18px; }
.chk { display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:11px; background: var(--ds-soft); font-size:12.5px; }
.chk .th { width:54px; height:34px; border-radius:8px; background:#000 center/cover no-repeat; flex:none; border:1px solid var(--ds-line); }
.chk code { font-size:11px; color: var(--ds-fg2); } .chk .st { margin-left:auto; font-weight:600; } .chk .st.ok { color: rgb(var(--ds-ok)); } .chk .st.no { color: rgb(var(--ds-bad)); }
.chk input { flex:1; min-width:0; padding:6px 8px; font-size:12px; }
textarea { width:100%; box-sizing:border-box; min-height:150px; padding:10px; border-radius:12px; border:1px solid var(--ds-line); background: var(--ds-soft); color: var(--ds-fg); font:12px/1.45 ui-monospace, Menlo, monospace; }
.note { font-size:12px; color: rgb(var(--ds-ok)); min-height:16px; }
`;


/* ───────────────────────── Κάρτα ───────────────────────── */
const RING = '<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><rect x="2.5" y="2.5" width="95" height="95" rx="47.5" pathLength="100"/></svg>';
const REBUILD_KEYS = ["image_path", "layers_path", "images", "top_orientation", "name", "image_scale", "image_aspect", "prefix", "entities"];
const normPath = (p) => (p ? (p.endsWith("/") ? p : p + "/") : p);

/* Συγχώνευση: προεπιλογές < YAML κάρτας < τοπικές ρυθμίσεις συσκευής */
function mergeConfig(yaml, local) {
  const y = { ...(yaml || {}) };
  // συμβατότητα με παλιές εκδόσεις (v0.1–0.3)
  if (y.diagnostics !== undefined && y.diag === undefined) y.diag = y.diagnostics;
  if (y.diagnostics_mode !== undefined && y.diag_mode === undefined) y.diag_mode = y.diagnostics_mode;
  if (y.button_labels === true) y.button_labels = "status";
  if (y.button_labels === false) y.button_labels = "none";
  const c = { ...clone(DEFAULTS), ...y, ...(local || {}) };
  c.images = { ...((yaml || {}).images || {}), ...((local || {}).images || {}) };
  c.entities = { ...((yaml || {}).entities || {}), ...((local || {}).entities || {}) };
  c.confirm = Array.isArray(c.confirm) ? c.confirm : DEFAULTS.confirm;
  const fix = (arr, all) => {
    const a = uniq((Array.isArray(arr) ? arr : []).filter((x) => all.includes(x)));
    return [...a, ...all.filter((x) => !a.includes(x))];
  };
  c.order = fix(c.order, SECTIONS);
  c.buttons = fix(c.buttons, BUTTON_IDS);
  c.hidden = (c.hidden || []).filter((x) => SECTIONS.includes(x));
  c.buttons_hidden = (c.buttons_hidden || []).filter((x) => BUTTON_IDS.includes(x));
  return c;
}

class DeepalS05Card extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }); I18N.watch(this.shadowRoot);
    this._pending = {}; this._flashes = {}; this._opt = {}; this._last = {};
    this._toastState = null; this._confirm = null; this._customize = false;
    this._sig = null; this._built = false; this._stab = "sections";
  }

  static getStubConfig() { return { type: `custom:${TAG}`, prefix: "s05", name: "Deepal S05" }; }
  static getConfigElement() { return document.createElement(EDITOR_TAG); }

  setConfig(config) {
    if (!config) throw new Error("Λείπει το config");
    this._yaml = config;
    this._local = lsRead(this._lsKey()) || {};
    this._c = mergeConfig(config, this._local);
    this._last = lsRead(`deepal-s05-last:${this._c.prefix}`) || {};
    this._built = false; this._sig = null; this._remoteLoaded = false;
    if (!this._uiDone) { this._uiDone = true; this._uiRestore(); }
    if (this._hass) this._render();
  }
  set hass(hass) {
    this._hass = hass;
    this._syncLang();
    if (this._c && !this._remoteLoaded && hass && typeof hass.callWS === "function") { this._remoteLoaded = true; this._loadRemote(); }
    if (this._c) this._render();
  }
  _syncLang() {
    const l = this._c && this._c.language && this._c.language !== "auto" ? this._c.language : this._hass?.locale?.language || this._hass?.language || "el";
    I18N.request(l);
  }
  connectedCallback() { I18N.subs.add(this); }
  disconnectedCallback() { I18N.subs.delete(this); }
  getCardSize() { return 9; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  /* ───── ρυθμίσεις (αποθηκεύονται στη συσκευή) ───── */
  /* Μετά την αποθήκευση στο YAML το HA ξαναχτίζει την κάρτα· κρατάμε το ανοιχτό παράθυρο ρυθμίσεων για να ξανανοίξει */
  _uiKey() { return `deepal-s05-ui:${(this._yaml && this._yaml.prefix) || DEFAULTS.prefix}`; }
  _uiSave() {
    try {
      if (!this._customize) { sessionStorage.removeItem(this._uiKey()); return; }
      sessionStorage.setItem(this._uiKey(), JSON.stringify({ t: Date.now(), tab: this._stab, sc: this._el && this._el.box ? this._el.box.scrollTop : 0 }));
    } catch (_) {}
  }
  _uiRestore() {
    try {
      const v = JSON.parse(sessionStorage.getItem(this._uiKey()) || "null");
      if (v && Date.now() - v.t < 30000) { this._customize = true; this._stab = v.tab || "sections"; this._restoreSc = v.sc || 0; }
      sessionStorage.removeItem(this._uiKey());
    } catch (_) {}
  }
  _lsKey() { return `deepal-s05-card:${(this._yaml && this._yaml.prefix) || DEFAULTS.prefix}`; }
  _patch(p) {
    this._local = { ...(this._local || {}), ...p };
    lsWrite(this._lsKey(), this._local); this._saveYaml(); this._uiSave();
    const rebuild = Object.keys(p).some((k) => REBUILD_KEYS.includes(k));
    this._c = mergeConfig(this._yaml, this._local);
    if (rebuild) this._built = false;
    this._force();
  }
  _resetLocal() { this._local = {}; lsWrite(this._lsKey(), null); this._c = mergeConfig(this._yaml, {}); this._built = false; this._saveYaml(true); this._force(); }

  /* ───── αποθήκευση στο YAML του dashboard (κοινές ρυθμίσεις παντού) ───── */
  _saveYaml(reset) {
    clearTimeout(this._yT);
    if (reset) this._yReset = true;
    this._yT = setTimeout(() => this._doSaveYaml(), 1200);
  }
  async _doSaveYaml() {
    if (this._ySaving) { this._yAgain = true; return; }
    const hass = this._hass; if (!hass || typeof hass.callWS !== "function" || !this._yaml) return;
    this._ySaving = true;
    const snap = this._local || {}, reset = this._yReset; this._yReset = false;
    try {
      if (hass.user && hass.user.is_admin === false) throw new Error("not admin");
      const seg = location.pathname.split("/")[1] || "lovelace", urlPath = seg === "lovelace" ? null : seg;
      const cfg = await hass.callWS({ type: "lovelace/config", url_path: urlPath, force: true });
      const found = [], visit = (o) => { if (Array.isArray(o)) o.forEach(visit); else if (o && typeof o === "object") { if (o.type === `custom:${TAG}`) found.push(o); Object.values(o).forEach(visit); } };
      visit(cfg);
      const px = this._yaml.prefix || DEFAULTS.prefix, mine = found.filter((f) => (f.prefix || DEFAULTS.prefix) === px);
      const target = mine.find((f) => JSON.stringify(f) === JSON.stringify(this._yaml)) || (mine.length === 1 ? mine[0] : null);
      if (!target) throw new Error("card not found");
      if (reset) { const keep = { type: target.type, prefix: target.prefix, name: target.name }; Object.keys(target).forEach((k) => delete target[k]); Object.assign(target, keep); }
      Object.assign(target, snap);
      this._uiSave();
      await hass.callWS({ type: "lovelace/config/save", url_path: urlPath, config: cfg });
      this._yaml = { ...target };
      for (const k of Object.keys(snap)) if (JSON.stringify((this._local || {})[k]) === JSON.stringify(snap[k])) delete this._local[k];
      lsWrite(this._lsKey(), Object.keys(this._local || {}).length ? this._local : null);
      this._c = mergeConfig(this._yaml, this._local);
      this._yamlErr = false;
      this._saveRemote();
    } catch (err) {
      this._saveRemote();
      if (!this._yamlErr) { this._yamlErr = true; this._toast("Δεν γράφτηκε στο YAML του dashboard (θέλει διαχειριστή και dashboard που να επεξεργάζεται από το UI) — αποθηκεύτηκε στον λογαριασμό σου", "error"); }
    }
    this._ySaving = false;
    if (this._yAgain) { this._yAgain = false; this._saveYaml(); }
  }

  /* ───── αποθήκευση στον λογαριασμό HA (frontend user data) → ίδιες ρυθμίσεις σε όλες τις συσκευές ───── */
  _rkey() { return `deepal_s05_card_${(this._yaml && this._yaml.prefix) || DEFAULTS.prefix}`; }
  async _loadRemote() {
    try {
      const r = await this._hass.callWS({ type: "frontend/get_user_data", key: this._rkey() });
      const v = r && r.value;
      if (v && typeof v === "object" && Object.keys(v).length) {
        if (JSON.stringify(v) !== JSON.stringify(this._local || {})) {
          this._local = v; lsWrite(this._lsKey(), v);
          this._c = mergeConfig(this._yaml, this._local); this._built = false; this._force();
        }
        this._saveYaml(); // μεταφορά παλιών ρυθμίσεων στο YAML
      } else if (this._local && Object.keys(this._local).length) {
        // ο λογαριασμός/YAML είναι η αλήθεια: σβήνουμε παλιές τοπικές ρυθμίσεις της συσκευής
        this._local = {}; lsWrite(this._lsKey(), null); this._c = mergeConfig(this._yaml, {}); this._built = false; this._force();
      }
    } catch (_) { this._remoteErr = true; }
  }
  _saveRemote() {
    clearTimeout(this._rT);
    this._rT = setTimeout(async () => {
      if (!this._hass || typeof this._hass.callWS !== "function") return;
      try { await this._hass.callWS({ type: "frontend/set_user_data", key: this._rkey(), value: this._local || {} }); this._remoteErr = false; }
      catch (_) { if (!this._remoteErr) { this._remoteErr = true; this._toast("Οι ρυθμίσεις δεν αποθηκεύτηκαν στο HA — ισχύουν μόνο σε αυτή τη συσκευή", "error"); } }
    }, 500);
  }

  /* ───── helpers ───── */
  _id(key) {
    return resolveId(this._hass, this._c, key);
  }
  _obj(key) { return this._hass?.states?.[this._id(key)]; }
  _s(key) { const o = this._obj(key); return !o || BAD.includes(o.state) ? null : o.state; }
  _is(key, v) { return this._s(key) === v; }
  _n(key) { const s = this._s(key); if (s === null) return null; const n = parseFloat(s); return Number.isFinite(n) ? n : null; }
  _unit(key) { return this._obj(key)?.attributes?.unit_of_measurement || ""; }
  _eobj(id) { return this._hass?.states?.[id]; }
  /* τελευταία γνωστή τιμή (όταν ο αισθητήρας γίνει unavailable) */
  _nl(key) {
    const n = this._n(key);
    if (n !== null) {
      if (this._last[key] !== n) { this._last[key] = n; lsWrite(`deepal-s05-last:${this._c.prefix}`, this._last); }
      return { v: n, stale: false };
    }
    return this._last[key] !== undefined ? { v: this._last[key], stale: true } : { v: null, stale: false };
  }
  _allKeys() { return [...OTHER_KEYS, ...OPEN_ITEMS.map((x) => x[0]), ...DIAG.map((x) => x[0]), ...INFO_IDS.map((i) => INFO_ITEMS[i][0]), ...TIRES.map((t) => `binary_sensor.${t.id}_tire_alarm`)]; }
  _signature() {
    const st = this._allKeys().map((k) => this._obj(k)?.state ?? "∅").join("|");
    const cu = [...(this._c.diag_custom || []), ...(this._c.info_custom || [])].map((x) => this._eobj(x.entity)?.state ?? "∅").join("|");
    return [st, cu, Math.floor(Date.now() / 60000), Object.keys(this._pending).join(","),
      Object.entries(this._flashes).map(([k, v]) => k + v.type).join(","), this._confirm ? this._confirm.id : "", String(this._customize),
      JSON.stringify(this._c), JSON.stringify(this._opt), String(this._tpend), String(this._view), this._toastState ? this._toastState.msg : ""].join("#");
  }
  _force() { this._sig = null; if (this._hass && this._c) this._render(); }
  _diagAvail() { return DIAG.filter((d) => this._obj(d[0])); }
  _diagItems() {
    const c = this._c, avail = this._diagAvail(), selIds = Array.isArray(c.diag) ? c.diag : DIAG.map((d) => d[0]);
    const items = avail.filter((d) => selIds.includes(d[0])).map((d) => ({ label: d[1], icon: d[2], ent: this._id(d[0]), on: this._is(d[0], "on"), na: this._s(d[0]) === null }));
    for (const x of c.diag_custom || []) {
      const o = this._eobj(x.entity);
      items.push({ label: x.label || o?.attributes?.friendly_name || x.entity, icon: x.icon || "alert", ent: x.entity, on: !!o && ["on", "true", "problem", "alarm", "low"].includes(String(o.state).toLowerCase()), na: !o || BAD.includes(o.state) });
    }
    return items;
  }

  /* ───── κατάσταση οχήματος ───── */
  _vehicle() {
    const unlocked = this._is("lock.doors", "unlocked") || this._is("lock.doors", "unlocking");
    const lights = ["position_lamp", "low_beam", "high_beam"].some((k) => this._is(`binary_sensor.${k}`, "on"));
    const charging = this._is("binary_sensor.charging", "on");
    const plugged = this._is("binary_sensor.charger_plugged", "on");
    const battery = this._n("sensor.battery_level");
    const open = OPEN_ITEMS.filter(([k]) => this._is(k, "on"));
    let img;
    if (charging) img = unlocked ? "charging_unlocked" : "charging";
    else if (unlocked) img = lights ? "unlocked_lights" : "unlocked";
    else if (lights) img = "lights";
    else if (plugged && battery !== null && battery >= 100) img = "complete";
    else img = "off";
    return { unlocked, lights, charging, plugged, battery, open, img };
  }
  _age() {
    const raw = this._s("sensor.last_updated");
    if (!raw) return "--";
    const t = new Date(raw).getTime();
    if (!Number.isFinite(t)) return "--";
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (m < 1) return T("μόλις τώρα");
    if (m < 60) return T("πριν {0} λ.", m);
    if (m < 1440) return T("πριν {0} ώ.", Math.floor(m / 60));
    return T("πριν {0} ημ.", Math.floor(m / 1440));
  }
  _fmtLeft(raw) { const m = raw && /^(\d+):(\d{1,2})/.exec(raw); return m ? T("{0}ώ {1}λ", +m[1], +m[2]) : raw || ""; }
  _chargeCurrent() {
    const dc = this._n("sensor.dc_charge_current");
    if (dc && dc > 0) return `DC ${Math.round(dc)} ${this._unit("sensor.dc_charge_current") || "A"}`;
    const acKey = this._n("sensor.ac_charge_current") !== null ? "sensor.ac_charge_current" : "sensor.charge_current";
    const ac = this._n(acKey);
    return ac && ac > 0 ? `AC ${Math.round(ac)} ${this._unit(acKey) || "A"}` : "";
  }
  _status(v) {
    const cloudOk = this._is("binary_sensor.cloud_connection", "on");
    const left = this._s("sensor.remaining_charge_time_h_mm");
    if (v.open.length) {
      const names = v.open.slice(0, 2).map((x) => x[1]).join(" · ");
      return { icon: "alert", text: "Ανοιχτά", sub: names + (v.open.length > 2 ? ` +${v.open.length - 2}` : ""), rgb: "var(--ds-bad)" };
    }
    if (!cloudOk) return { icon: "cloudoff", text: "Χωρίς σύνδεση", sub: "Δεν υπάρχει επικοινωνία με το Deepal Cloud", rgb: "var(--ds-bad)" };
    if (v.charging) return { icon: "bolt", text: "Φορτίζει", sub: [this._chargeCurrent(), left ? T("απομένουν {0}", left) : ""].filter(Boolean).join(" · "), rgb: "var(--ds-ok)" };
    const alerts = this._diagItems().filter((d) => d.on).length, warn = alerts ? T(alerts === 1 ? "{0} προειδοποίηση" : "{0} προειδοποιήσεις", alerts) : "";
    if (v.plugged) return { icon: "plug", text: "Φορτιστής συνδεδεμένος", sub: warn, rgb: "var(--ds-warn)" };
    if (v.unlocked) return { icon: "unlock", text: "Ξεκλείδωτο", sub: warn, rgb: "var(--ds-warn)" };
    return { icon: "lock", text: "Κλειδωμένο", sub: warn, rgb: alerts ? "var(--ds-warn)" : "var(--ds-ok)" };
  }

  /* ───── κλιματισμός ───── */
  _climateIsOn() {
    if (this._s("binary_sensor.climate_on") !== null) return this._is("binary_sensor.climate_on", "on");
    const s = this._s("climate.cabin_climate");
    return s !== null && s !== "off";
  }
  _climateCall(turnOn) {
    const o = this._obj("climate.cabin_climate");
    if (!o) return null;
    const feat = o.attributes?.supported_features || 0;
    const modes = o.attributes?.hvac_modes || [];
    if (turnOn) {
      if (feat & CLIMATE_TURN_ON) return ["climate", "turn_on", "climate.cabin_climate"];
      const mode = this._c.climate_on_mode || ["auto", "heat_cool", "cool", "heat", "fan_only"].find((m) => modes.includes(m)) || modes.find((m) => m !== "off");
      return mode ? ["climate", "set_hvac_mode", "climate.cabin_climate", { hvac_mode: mode }] : null;
    }
    if (feat & CLIMATE_TURN_OFF) return ["climate", "turn_off", "climate.cabin_climate"];
    return modes.includes("off") ? ["climate", "set_hvac_mode", "climate.cabin_climate", { hvac_mode: "off" }] : null;
  }

  /* ───── κουμπιά ───── */
  _actions() {
    const lock = this._s("lock.doors"), win = this._s("cover.windows"), trunk = this._s("cover.trunk"), climate = this._s("climate.cabin_climate");
    const climateOn = this._climateIsOn();
    const cCall = climate === null ? null : this._climateCall(!climateOn);
    const openTone = (s) => (s === "closed" ? "" : s === null ? "bad" : "warn");
    const txt = (s, closed, open) => (s === "closed" ? closed : s === "open" ? open : s === null ? "μη διαθέσιμο" : s);
    const all = {
      lock: { on: lock === "locked", icon: lock === "locked" ? "lock" : "unlock", sub: lock === "locked" ? "κλειδωμένο" : lock === "unlocked" ? "ξεκλείδωτο" : lock || "μη διαθέσιμο",
        tone: lock === "locked" ? "ok" : lock === "unlocked" ? "warn" : "bad", disabled: lock === null, watch: "lock.doors", confirm: lock === "locked" ? "unlock" : null,
        call: ["lock", lock === "locked" ? "unlock" : "lock", "lock.doors"] },
      windows: { on: win === "open", icon: win === "closed" || win === null ? "windowclosed" : "windowopen", sub: txt(win, "κλειστά", "ανοιχτά"), tone: openTone(win), disabled: win === null,
        watch: "cover.windows", confirm: win === "closed" ? "windows" : null, call: ["cover", "toggle", "cover.windows"] },
      trunk: { on: trunk === "open", icon: trunk === "open" ? "trunkopen" : "trunk", sub: txt(trunk, "κλειστό", "ανοιχτό"), tone: openTone(trunk), disabled: trunk === null, watch: "cover.trunk", confirm: trunk === "closed" ? "trunk" : null,
        call: ["cover", "toggle", "cover.trunk"] },
      climate: { on: climateOn, icon: climateOn ? "snow" : "snowoff", sub: climate === null ? "μη διαθέσιμο" : climateOn ? "ενεργός" : "ανενεργός", tone: climate === null ? "bad" : "", disabled: climate === null,
        watch: this._obj("binary_sensor.climate_on") ? "binary_sensor.climate_on" : "climate.cabin_climate", timeout: 35000, call: cCall,
        unsupported: "Ο κλιματισμός δεν έχει εντολή " + (climateOn ? "απενεργοποίησης" : "ενεργοποίησης") + " σε αυτή την οντότητα" },
      tires: (() => { const s = this._tiresSummary(); return { icon: "tirealert", ...s, open: "top" }; })(),
      cabin: (() => { const s = this._cabinSummary(climateOn); return { icon: s.on ? "interioron" : "interior", ...s, open: "climate" }; })(),
      flash: { icon: "headlight", sub: "αναλαμπή", btn: "button.flash_lights", call: ["button", "press", "button.flash_lights"] },
      honk: { icon: "horn", sub: "ηχητικό σήμα", btn: "button.honk_horn", call: ["button", "press", "button.honk_horn"] },
      find: { icon: "find", sub: "εντοπισμός", btn: "button.flash_lights_and_honk", call: ["button", "press", "button.flash_lights_and_honk"] },
      refresh: { icon: "refresh", sub: this._age(), btn: "button.refresh_vehicle_data", watch: "sensor.last_updated", timeout: 25000, call: ["button", "press", "button.refresh_vehicle_data"] },
    };
    return [...BUTTON_IDS, "refresh"].map((id) => {
      const a = { id, label: BUTTON_LABELS[id], ...all[id] };
      if (a.btn) {
        const o = this._obj(a.btn);
        if (!o || o.state === "unavailable") { a.disabled = true; a.tone = "bad"; }
      }
      return a;
    });
  }
  _cabinSummary(climateOn) {
    const L = (k) => this._level(k), act = [];
    if (climateOn) act.push("A/C");
    if (L("number.front_left_seat_heating_level") > 0 || L("number.front_right_seat_heating_level") > 0) act.push("θέρμ.");
    if (L("number.front_left_seat_ventilation_level") > 0 || L("number.front_right_seat_ventilation_level") > 0) act.push("αερ.");
    if (L("switch.steering_wheel_heating") > 0) act.push("τιμόνι");
    return { on: act.length > 0, sub: act.length ? act.join(" · ") : "ταμπλό", tone: "" };
  }
  _tiresSummary() {
    const rs = TIRES.map((t) => this._tire(t)), vals = rs.map((r) => r.bar).filter((x) => x !== null);
    const unit = this._c.tire_unit, f = (b) => (unit === "kPa" ? Math.round(b * 100) : unit === "psi" ? (b / 0.0689476).toFixed(1) : b.toFixed(1));
    const bad = rs.some((r) => r.alarm), warn = rs.some((r) => r.note);
    const open = OPEN_ITEMS.filter(([k]) => this._is(k, "on"));
    if (!bad && !warn && open.length) return { sub: T("{0} ανοιχτά", open.length), tone: "warn" };
    return { sub: bad ? "συναγερμός" : warn ? "έλεγξε πίεση" : vals.length ? `${f(Math.min(...vals))} ${unit} min` : "--", tone: bad ? "bad" : warn ? "warn" : "" };
  }
  _onAction(id) {
    const a = this._actions().find((x) => x.id === id);
    if (!a || a.disabled || this._pending[id]) return;
    if (a.open) { this._view = a.open; return this._force(); }
    if (!a.call) { this._flash(id, "error"); this._toast(a.unsupported || "Η ενέργεια δεν υποστηρίζεται", "error"); return; }
    if (a.confirm && this._c.confirm.includes(a.confirm)) {
      this._confirm = { id, key: a.confirm };
      clearTimeout(this._confirmTimer);
      this._confirmTimer = setTimeout(() => { this._confirm = null; this._force(); }, 8000);
      return this._force();
    }
    this._run(a);
  }
  async _run(a) {
    const before = a.watch ? this._s(a.watch) ?? this._obj(a.watch)?.state : null;
    this._pending[a.id] = { before, watch: a.watch };
    this._pending[a.id].timer = setTimeout(() => {
      if (!this._pending[a.id]) return;
      delete this._pending[a.id]; this._flash(a.id, "error"); this._toast("Δεν επιβεβαιώθηκε από το όχημα", "error");
    }, a.timeout || 20000);
    this._force();
    const [domain, service, entity, data] = a.call;
    try {
      await this._hass.callService(domain, service, { entity_id: this._id(entity), ...(data || {}) });
    } catch (err) {
      clearTimeout(this._pending[a.id]?.timer); delete this._pending[a.id]; this._flash(a.id, "error");
      return this._toast(err?.message ? T("Απέτυχε: {0}", err.message) : T("Η εντολή απέτυχε"), "error");
    }
    if (!a.watch) { clearTimeout(this._pending[a.id]?.timer); delete this._pending[a.id]; this._flash(a.id, "success"); this._actToast = Date.now(); this._toast(this._sentMsg(a), "ok"); }
    else { this._actToast = Date.now(); this._toast(this._sentMsg(a), "ok"); }
  }
  _doneMsg(id) {
    const st = (k) => this._s(k);
    switch (id) {
      case "lock": return st("lock.doors") === "locked" ? "Το όχημα κλειδώθηκε" : "Το όχημα ξεκλειδώθηκε";
      case "windows": return st("cover.windows") === "open" ? "Τα παράθυρα άνοιξαν" : "Τα παράθυρα έκλεισαν";
      case "trunk": return st("cover.trunk") === "open" ? "Το πορτμπαγκάζ άνοιξε" : "Το πορτμπαγκάζ έκλεισε";
      case "climate": return this._climateIsOn() ? "Ο κλιματισμός άνοιξε" : "Ο κλιματισμός έσβησε";
      case "refresh": return "Τα δεδομένα του οχήματος ανανεώθηκαν";
      default: return null;
    }
  }
  _sentMsg(a) {
    const m = { lock: "Στάλθηκε εντολή κλειδώματος", windows: "Στάλθηκε εντολή για τα παράθυρα", trunk: "Στάλθηκε εντολή για το πορτμπαγκάζ", climate: "Στάλθηκε εντολή κλιματισμού",
      flash: "Στάλθηκε εντολή: φώτα", honk: "Στάλθηκε εντολή: κόρνα", find: "Στάλθηκε εντολή: φώτα + κόρνα", refresh: "Ζητήθηκε ανανέωση δεδομένων" };
    if (a.id === "lock") return this._s("lock.doors") === "locked" ? "Στάλθηκε εντολή ξεκλειδώματος" : "Στάλθηκε εντολή κλειδώματος";
    return m[a.id] || `${a.label}: εστάλη`;
  }
  _resolvePending() {
    for (const [id, p] of Object.entries(this._pending)) {
      if (!p.watch) continue;
      const cur = this._obj(p.watch)?.state;
      if (cur === undefined || cur === p.before || TRANSITIONAL.includes(cur) || BAD.includes(cur)) continue;
      clearTimeout(p.timer); delete this._pending[id]; this._flash(id, "success");
      const msg = this._doneMsg(id); if (msg) { this._actToast = Date.now(); this._toast(msg, "ok"); }
    }
  }
  /* αλλαγές κατάστασης (π.χ. από την εφαρμογή ή αυτόματα) → μήνυμα στην οθόνη */
  _watchChanges(v) {
    const lock = this._s("lock.doors");
    const cur = { lock, climate: this._s("climate.cabin_climate") === null ? null : this._climateIsOn(), charging: v.charging, plugged: v.plugged, open: v.open.length };
    const p = this._prevS; this._prevS = cur;
    if (!p || Date.now() - (this._actToast || 0) < 8000) return;
    let msg = null, type = "ok";
    if (p.lock && cur.lock && p.lock !== cur.lock) { if (cur.lock === "locked") msg = "Το όχημα κλειδώθηκε"; else if (cur.lock === "unlocked") { msg = "Το όχημα ξεκλειδώθηκε"; type = "warn"; } }
    else if (p.climate !== null && cur.climate !== null && p.climate !== cur.climate) msg = cur.climate ? "Ο κλιματισμός άνοιξε" : "Ο κλιματισμός έσβησε";
    else if (p.charging !== cur.charging) msg = cur.charging ? "Η φόρτιση ξεκίνησε" : "Η φόρτιση σταμάτησε";
    else if (p.plugged !== cur.plugged) msg = cur.plugged ? "Ο φορτιστής συνδέθηκε" : "Ο φορτιστής αποσυνδέθηκε";
    else if (cur.open > p.open) { msg = T("Κάτι έμεινε ανοιχτό: {0}", v.open.slice(0, 2).map((x) => x[1]).join(", ")); type = "error"; }
    if (msg) setTimeout(() => this._toast(msg, type), 0);
  }
  _flash(id, type) {
    clearTimeout(this._flashes[id]?.timer);
    this._flashes[id] = { type, timer: setTimeout(() => { delete this._flashes[id]; this._force(); }, type === "error" ? 1800 : 1300) };
    this._force();
  }
  _toast(msg, type) {
    clearTimeout(this._toastTimer);
    this._toastState = { msg, type };
    this._toastTimer = setTimeout(() => { this._toastState = null; this._force(); }, 4200);
    this._force();
  }
  _closeSheet() { clearTimeout(this._confirmTimer); this._confirm = null; this._customize = false; this._uiSave(); this._force(); }
  _vsheetOpen() { return !!this._view && !this._confirm && !this._customize; }

  /* ───── εσωτερικό: επίπεδα καθισμάτων / τιμόνι / θερμοκρασία ───── */
  _level(key) {
    const o = this._opt[key], now = Date.now();
    const real = key.startsWith("switch.") ? (this._is(key, "on") || this._is("binary_sensor.steering_wheel_heater", "on") ? 1 : 0) : this._n(key) ?? 0;
    if (o && now - o.t < 15000) { if (o.v === real) delete this._opt[key]; else return o.v; }
    return real;
  }
  _setOpt(key, v) {
    this._opt[key] = { v, t: Date.now() };
    clearTimeout(this._optTimer);
    this._optTimer = setTimeout(() => this._force(), 15200);
    this._force();
  }
  async _spot(id) {
    const sp = INT_SPOTS.find((s) => s[0] === id);
    if (!sp) return;
    const key = sp[1], cur = this._level(key);
    try {
      if (key.startsWith("switch.")) {
        this._setOpt(key, cur ? 0 : 1);
        await this._hass.callService("switch", cur ? "turn_off" : "turn_on", { entity_id: this._id(key) });
      } else {
        const max = this._obj(key)?.attributes?.max ?? 3;
        const next = cur >= max ? 0 : cur + 1;
        this._setOpt(key, next);
        await this._hass.callService("number", "set_value", { entity_id: this._id(key), value: next });
      }
    } catch (err) { delete this._opt[key]; this._toast(err?.message ? T("Απέτυχε: {0}", err.message) : T("Η εντολή απέτυχε"), "error"); }
  }
  /* Θερμοκρασία στόχος: απευθείας από την οντότητα climate (χωρίς helper) */
  _tgt() {
    const co = this._obj("climate.cabin_climate"), a = co?.attributes;
    if (!a || a.temperature == null) return null;
    return { state: String(a.temperature), attributes: { min: a.min_temp, max: a.max_temp, step: a.target_temp_step } };
  }
  _setTgt(v) { return this._hass.callService("climate", "set_temperature", { entity_id: this._id("climate.cabin_climate"), temperature: v }); }
  _tempStep(d) {
    const o = this._tgt();
    if (!o) return;
    const a = o.attributes || {}, step = a.step || 0.5, min = a.min ?? 16, max = a.max ?? 32;
    const cur = this._tpend ?? parseFloat(o.state);
    if (!Number.isFinite(cur)) return;
    this._tpend = Math.min(max, Math.max(min, Math.round((cur + d * step) / step) * step));
    clearTimeout(this._tTimer);
    this._tTimer = setTimeout(async () => {
      const v = this._tpend;
      try { await this._setTgt(v); }
      catch (err) { this._toast(err?.message ? T("Απέτυχε: {0}", err.message) : T("Η εντολή απέτυχε"), "error"); }
      this._tTimer2 = setTimeout(() => { this._tpend = undefined; this._force(); }, 6000);
    }, 800);
    clearTimeout(this._tTimer2);
    this._force();
  }

  /* ───── build ───── */
  _heroSrc(k, idx = 0) {
    const c = this._c, file = c.images[k] || HERO_FILES[k] || DASH_FILES[k];
    if (/^(https?:)?\/\//.test(file) || file.startsWith("/")) return idx === 0 ? file : null;
    const bases = c.image_path ? [normPath(c.image_path)] : [`${SCRIPT_BASE}images/car/`];
    return bases[idx] ? bases[idx] + file : null;
  }
  _layerBase() { return this._c.layers_path ? normPath(this._c.layers_path) : `${SCRIPT_BASE}images/`; }

  _topSvg() {
    const c = this._c, B = `${this._layerBase()}top/`, horiz = c.top_orientation !== "vertical";
    const img = (n, extra = "") => `<image class="l ${extra}" data-l="${n}" href="${esc(B + n + ".webp")}" x="${TOP_BOX.x}" y="${TOP_BOX.y}" width="${TOP_BOX.w}" height="${TOP_BOX.h}"/>`;
    let layers = `<image data-l="base" href="${esc(B + "base.webp")}" x="${TOP_BOX.x}" y="${TOP_BOX.y}" width="${TOP_BOX.w}" height="${TOP_BOX.h}"/>`;
    for (const [id, open, closed] of TOP_LAYERS) { if (closed) layers += img(closed, "on"); layers += img(open); }
    const pos = (t) => {
      const px = t.x + t.side * 62, py = t.y;
      return horiz ? [py, 750 - px] : [px, py];
    };
    const pills = TIRES.map((t) => {
      const [x, y] = pos(t);
      return `<g class="pill" data-t="${t.id}" transform="translate(${x} ${y})"><rect x="-40" y="-19" width="80" height="38" rx="14"/><text y="6" text-anchor="middle" font-size="19"></text></g>`;
    }).join("");
    const vb = horiz ? "40 148 690 455" : "60 22 630 720";
    return `<svg viewBox="${vb}" role="img" aria-label="Κάτοψη οχήματος"><g transform="${horiz ? "matrix(0 -1 1 0 0 750)" : ""}">${layers}</g>${pills}</svg>`;
  }
  /* Αέρας από τους αεραγωγούς: δέσμες από λεπτές καμπύλες που ανοίγουν σε βεντάλια, με διαφάνεια που σβήνει (συντεταγμένες εικόνας 510×285) */
  _airSvg() {
    const R = [
      [[115, 124, 85, 128, 35, 136, 0, 150], [105, 132, 75, 146, 30, 170, 0, 188]],
      [[170, 126, 158, 150, 128, 178, 116, 214], [163, 132, 172, 160, 178, 190, 184, 222]],
      [[244, 170, 236, 195, 190, 218, 160, 233], [236, 172, 232, 200, 222, 232, 205, 250]],
      [[270, 170, 284, 198, 320, 216, 350, 233], [262, 172, 268, 205, 285, 235, 300, 250]],
      [[410, 122, 440, 130, 480, 145, 510, 157], [420, 133, 450, 140, 485, 160, 510, 177]],
    ];
    const N = 9, f = (n) => n.toFixed(1), P = (p) => `M${f(p[0])} ${f(p[1])}C${f(p[2])} ${f(p[3])} ${f(p[4])} ${f(p[5])} ${f(p[6])} ${f(p[7])}`;
    let defs = '<filter id="airb" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter><filter id="airb2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".6"/></filter>', body = "";
    R.forEach(([A, B], r) => {
      const x0 = (A[0] + B[0]) / 2, y0 = (A[1] + B[1]) / 2, x1 = (A[6] + B[6]) / 2, y1 = (A[7] + B[7]) / 2;
      defs += `<linearGradient id="ag${r}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}"><stop offset="0" stop-color="#eaf6ff" stop-opacity=".95"/><stop offset=".55" stop-color="#b9dcff" stop-opacity=".6"/><stop offset="1" stop-color="#8ec5ff" stop-opacity="0"/></linearGradient>`;
      const rev = B.slice(); const Br = `L${f(B[6])} ${f(B[7])}C${f(B[4])} ${f(B[5])} ${f(B[2])} ${f(B[3])} ${f(B[0])} ${f(B[1])}Z`;
      body += `<path class="bg" d="${P(A)}${Br}" fill="url(#ag${r})" filter="url(#airb)" style="--d:${(-r * 0.7).toFixed(1)}s"/>`;
      let st = "";
      for (let k = 0; k < N; k++) {
        const t = k / (N - 1), s = A.map((v, i) => v * (1 - t) + rev[i] * t);
        const edge = k === 0 || k === N - 1, w = edge ? 1 : 1.4 + ((k * 7 + r) % 3) * 0.5;
        const dl = -(((k * 0.53 + r * 0.9) % 2.4)).toFixed(2), tt = (2.0 + ((k * 5 + r * 3) % 7) * 0.22).toFixed(2);
        st += `<path class="st" d="${P(s)}" pathLength="100" stroke="url(#ag${r})" stroke-width="${w}" style="--d:${dl}s;--t:${tt}s"/>`;
      }
      body += `<g filter="url(#airb2)">${st}</g>`;
    });
    return `<svg class="air" viewBox="0 0 510 285" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;
  }
  _climHtml() {
    return `<div class="dash" id="dash"><img class="b" alt="">${this._airSvg()}</div>
      <div id="vtctl"></div>
      <div class="pk" id="pk"><div class="pt">Στόχος</div><div class="pv"><span id="pkv">--</span><small>°C</small></div>
        <div class="pw"><div class="pp" id="pkp"></div><div class="pf l"></div><div class="pf r"></div><div class="pc"></div></div></div>`;
  }
  _seatsHtml() {
    const B = `${this._layerBase()}interior/`;
    const btns = INT_SPOTS.map(([id, , icon, name, x, y]) => `<button class="sbtn ${icon === "fan" ? "cool" : "hot"}" data-spot="${id}" style="left:${x}%;top:${y}%" aria-label="${esc(name)}" title="${esc(name)}">${ico(icon === "fan" ? "fan" : icon === "steering" ? "steering" : "seat")}<span class="lvl"><i></i><i></i><i></i></span></button>`).join("");
    return `<div class="ipane"><img data-l="base" src="${esc(B)}base.webp" alt="">${INT_LAYERS.map((n) => `<img class="l" data-l="${n}" src="${esc(B + n)}.webp" alt="">`).join("")}${btns}</div>`;
  }

  _build() {
    const c = this._c;
    const imgs = Object.keys(HERO_FILES).map((k) => `<img data-k="${k}" data-i="0" src="${esc(this._heroSrc(k, 0))}" alt="" decoding="async">`).join("");
    this.shadowRoot.innerHTML = `
      <style>${CSS}</style>
      <ha-card>
        <div class="hero" id="hero">
          <div class="stage">${imgs}</div>
          <div class="fx fx-handles"><div class="halo"></div><div class="core"></div></div>
          <div class="fxs"><svg viewBox="0 0 500 278" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path class="cb" d="${CHG_D}"/><path class="cf" d="${CHG_D}"/>
            <g class="pt" transform="translate(${CHG_PORT[0]} ${CHG_PORT[1]})"><circle class="pg" r="7"/><circle class="pr" r="5"/><circle class="pr r2" r="5"/></g></svg><img class="sweep" alt="" src=""></div>
          <div class="shade-left"></div><div class="shade-top"></div><div class="shade-bot"></div>
          <div class="hero-top"><div><div class="title" id="ttl"><span id="nm">${esc(c.name)}</span><span class="plate" id="plate"></span></div><div class="total" id="total"></div></div>
            <div class="meta" id="meta"><span class="cloud" id="cloud" role="button"></span><button class="rfs" id="rfs" data-id="refresh"></button></div></div>
          <div class="status" id="status"></div>
          <div class="tells" id="tells"></div>
        </div>
        <div class="toast" id="toast" role="status" aria-live="polite"></div>
        <div class="actions" id="actions"></div>
        <div class="stats" id="stats"></div>
        <div class="info" id="info"></div>
        <div class="diag" id="diag"></div>
        <div class="charge" id="charge" hidden></div>
        <button class="foot" id="foot" aria-label="Ρυθμίσεις κάρτας"><span class="age" id="age"></span><span class="sets">${ico("sliders")}Ρυθμίσεις</span></button>
        <div class="sheet" id="vsheet"><div class="box wide" id="vbox">
          <div class="hd"><h3 id="vtitle">Όχημα</h3><button class="x" data-vclose aria-label="Κλείσιμο">${ico("close")}</button></div>
          <div class="veh" id="veh">
            <div class="seg" id="vtabs"><button data-vv="top">${ico("cartop")}Κάτοψη</button><button data-vv="climate">${ico("fan")}Κλιματισμός</button><button data-vv="seats">${ico("seat")}Καθίσματα</button></div>
            <div class="vstage" id="vtop">${this._topSvg()}</div>
            <div class="vcol" id="vclim">${this._climHtml()}</div>
            <div class="vcol" id="vseats">${this._seatsHtml()}</div>
            <div class="vmiss" id="vmiss" hidden>${T("Δεν βρέθηκαν οι εικόνες οχήματος. Αντέγραψε τον φάκελο {0} δίπλα στο αρχείο της κάρτας (δες Ρυθμίσεις → Εικόνες).", "<b>images</b>")}</div>
            <div id="vextra"></div>
          </div>
        </div></div>
        <div class="sheet" id="sheet"><div class="box" id="box"></div></div>
      </ha-card>`;
    const sr = this.shadowRoot, g = (i) => sr.getElementById(i);
    this._dashKeys = {};
    this._el = { card: sr.querySelector("ha-card"), hero: g("hero"), sweep: sr.querySelector(".sweep"), imgs: [...sr.querySelectorAll(".stage img")], plate: g("plate"), cloud: g("cloud"), age: g("age"),
      toast: g("toast"), status: g("status"), tells: g("tells"), rfs: g("rfs"), total: g("total"), stats: g("stats"), veh: g("veh"), vtabs: g("vtabs"), vtop: g("vtop"), vclim: g("vclim"), vseats: g("vseats"), pk: g("pk"), pkp: g("pkp"), pkv: g("pkv"), vmiss: g("vmiss"), vextra: g("vextra"),
      vsheet: g("vsheet"), vtctl: g("vtctl"), dash: g("dash"), info: g("info"), diag: g("diag"), charge: g("charge"), actions: g("actions"), foot: g("foot"), sheet: g("sheet"), box: g("box") };
    this._el.hero.style.setProperty("--ds-scale", String(c.image_scale));
    if (c.image_aspect) this._el.hero.style.setProperty("--ds-aspect", c.image_aspect);
    this._el.imgs.forEach((img) => {
      img.addEventListener("error", () => {
        const next = this._heroSrc(img.dataset.k, Number(img.dataset.i) + 1);
        if (next) { img.dataset.i = String(Number(img.dataset.i) + 1); img.src = next; } else img.style.visibility = "hidden";
      });
      img.addEventListener("load", () => {
        if (img.dataset.k === "off" && img.naturalWidth) { this._el.hero.dataset.auto = `${img.naturalWidth} / ${img.naturalHeight}`; if (!this._c.image_aspect) this._el.hero.style.setProperty("--ds-aspect", this._el.hero.dataset.auto); }
      });
    });
    this._el.dash.querySelectorAll(":scope > img").forEach((img) => {
      img.dataset.i = "0";
      img.addEventListener("error", () => {
        const next = this._heroSrc(img.dataset.key, Number(img.dataset.i) + 1);
        if (next) { img.dataset.i = String(Number(img.dataset.i) + 1); img.src = next; } else img.style.visibility = "hidden";
      });
    });
    this._el.vsheet.addEventListener("click", (e) => { if (e.target === this._el.vsheet) { this._view = null; this._force(); } });
    this._el.veh.addEventListener("error", (e) => { if (e.target?.dataset?.l === "base") this._el.vmiss.hidden = false; }, true);
    this._el.veh.addEventListener("load", (e) => { if (e.target?.dataset?.l === "base") this._el.vmiss.hidden = true; }, true);
    this._el.vbox = g("vbox");
    this._el.vbox.addEventListener("click", (e) => { if (e.target.closest("[data-vclose]")) { this._view = null; this._force(); } });
    this._pkInit(); this._bindPress();
    this._el.rfs.addEventListener("click", () => this._onAction("refresh"));
    this._el.stats.addEventListener("click", (e) => {
      const b = e.target.closest("[data-id]"); if (b) return this._onAction(b.dataset.id);
    });
    this._el.actions.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) this._onAction(b.dataset.id); });
    this._el.veh.addEventListener("click", (e) => {
      const t = e.target.closest("[data-vv],[data-spot],[data-t],[data-id],[data-tp]");
      if (!t) return;
      if (t.dataset.vv) { this._view = t.dataset.vv; return this._force(); }
      if (t.dataset.spot) return this._spot(t.dataset.spot);
      if (t.dataset.id) return this._onAction(t.dataset.id);
      if (t.dataset.tp) return this._tempStep(Number(t.dataset.tp));
    });
    this._el.tells.addEventListener("click", (e) => { if (e.target.closest("[data-open-cust]")) { this._stab = "sensors"; this._customize = true; this._force(); } });
    this._el.foot.addEventListener("click", () => { if (this._c.show_customize === false) return; this._stab = "sections"; this._customize = true; this._force(); });
    this._el.sheet.addEventListener("click", (e) => {
      if (e.target === this._el.sheet) return this._closeSheet();
      const t = e.target.closest("[data-sheet],[data-close]");
      if (!t) return;
      if (t.dataset.sheet === "yes") {
        const a = this._actions().find((x) => x.id === this._confirm?.id);
        this._closeSheet(); if (a) this._run(a); return;
      }
      this._closeSheet();
    });
    this._setEl = null;
    this._built = true;
  }

  /* ───── render ───── */
  _fmtNum(n, d = 0) { return n.toLocaleString(I18N.numLocale(), { minimumFractionDigits: 0, maximumFractionDigits: d }); }
  _tire(t) {
    const key = `sensor.${t.id}_tire_pressure`, o = this._obj(key);
    const { v, stale } = this._nl(key);
    let bar = null;
    if (v !== null) {
      const u = (o?.attributes?.unit_of_measurement || "").toLowerCase();
      bar = u === "kpa" ? v / 100 : u === "psi" ? v * 0.0689476 : u === "bar" ? v : v > 50 ? v / 100 : v;
    }
    const alarm = this._is(`binary_sensor.${t.id}_tire_alarm`, "on");
    const c = this._c;
    let tone = "148,163,184", note = "";
    if (bar !== null) {
      tone = "var(--ds-ok)";
      if (bar < c.tire_min) { tone = "var(--ds-warn)"; note = "χαμηλή"; } else if (bar > c.tire_max) { tone = "var(--ds-warn)"; note = "υψηλή"; }
    }
    if (alarm) { tone = "var(--ds-bad)"; note = "συναγερμός"; }
    const unit = c.tire_unit;
    const txt = bar === null ? "--" : unit === "kPa" ? `${Math.round(bar * 100)}` : unit === "psi" ? `${(bar / 0.0689476).toFixed(1)}` : bar.toFixed(1);
    return { txt: `${txt}${bar === null ? "" : " " + unit}`, tone, note, stale, alarm, name: t.name, bar };
  }

  _render() {
    if (!this._hass || !this._c) return;
    this._syncLang();
    if (!I18N.ready) return;
    if (!this._built) this._build();
    this._resolvePending();
    const sig = this._signature();
    if (sig === this._sig) return;
    this._sig = sig;
    const el = this._el, c = this._c, v = this._vehicle();

    const secs = { hero: el.hero, actions: el.actions, status: el.status, stats: el.stats, info: el.info, diagnostics: el.diag, charge: el.charge };
    const hid = new Set(c.hidden);
    c.order.forEach((id, i) => { const s = secs[id]; if (!s) return; s.style.order = i; s.toggleAttribute("data-off", hid.has(id)); });
    el.foot.style.order = 99;
    el.foot.classList.toggle("nosets", c.show_customize === false);

    /* hero */
    el.hero.classList.toggle("unlocked", v.unlocked);
    const fx = ["flow_port", "flow", "port", "sweep", "none"].includes(c.charge_fx) ? c.charge_fx : "flow_port";
    el.hero.dataset.fx = v.charging && fx !== "none" ? fx.replace("_", " ") : "";
    el.hero.style.setProperty("--ds-scale", String(c.image_scale));
    if (c.image_aspect) el.hero.style.setProperty("--ds-aspect", String(c.image_aspect)); else if (el.hero.dataset.auto) el.hero.style.setProperty("--ds-aspect", el.hero.dataset.auto); else el.hero.style.removeProperty("--ds-aspect");
    el.imgs.forEach((i) => i.classList.toggle("on", i.dataset.k === v.img));
    if (/sweep/.test(el.hero.dataset.fx)) { const on = el.imgs.find((i) => i.classList.contains("on")); if (on && on.src && el.sweep.getAttribute("src") !== on.src) el.sweep.src = on.src; }
    el.plate.textContent = this._s("sensor.license_plate") || "";
    const hs = new Set(c.hero_show || []), sr = this.shadowRoot;
    sr.getElementById("nm").hidden = !hs.has("name"); el.plate.hidden = !hs.has("plate"); sr.getElementById("ttl").hidden = !hs.has("name") && !hs.has("plate");
    el.total.hidden = !hs.has("range"); el.cloud.hidden = !hs.has("cloud"); el.age.hidden = !hs.has("updated");
    const cloudOk = this._is("binary_sensor.cloud_connection", "on");
    el.cloud.className = `cloud ${cloudOk ? "ok" : "bad"}`;
    el.cloud.innerHTML = ico(cloudOk ? "cloudcheck" : "cloudoff");
    el.cloud.dataset.ent = this._id("binary_sensor.cloud_connection");
    el.cloud.title = cloudOk ? "Συνδεδεμένο" : "Εκτός σύνδεσης"; el.cloud.setAttribute("aria-label", el.cloud.title);
    el.age.textContent = T("Ενημερώθηκε {0}", this._age());
    const ts = this._toastState;
    if (ts) el.toast.textContent = ts.msg;
    el.toast.className = `toast ${ts && c.toasts !== false ? `show ${ts.type}` : ""}`;

    {
      const ra = this._actions().find((x) => x.id === "refresh"), f = this._flashes.refresh, pend = !!this._pending.refresh;
      const rs = pend ? "pending" : f ? f.type : "";
      el.rfs.className = `rfs ${rs}`; el.rfs.disabled = !!ra.disabled; el.rfs.hidden = !!ra.disabled;
      const rl = T("Ανανέωση δεδομένων · {0}", this._age()); el.rfs.title = rl; el.rfs.setAttribute("aria-label", rl);
      el.rfs.innerHTML = ico(f && !pend ? (f.type === "success" ? "check" : "alert") : "refresh") + (pend ? RING : "");
    }

    /* κουμπιά */
    const lay = ["grid", "scroll", "fit"].includes(c.button_layout) ? c.button_layout : "grid";
    const lab = c.button_labels, showT = lab === "title" || lab === "both", showS = lab === "status" || lab === "both";
    el.actions.className = `actions ${lay} sz-${c.button_size}`;
    const acts = this._actions();
    el.actions.innerHTML = c.buttons.filter((id) => !c.buttons_hidden.includes(id)).map((id) => {
      const a = acts.find((x) => x.id === id);
      const f = this._flashes[a.id], pend = !!this._pending[a.id], state = pend ? "pending" : f ? f.type : "";
      const icon = f && !pend ? (f.type === "success" ? "check" : "alert") : a.icon;
      const dot = !state && (a.tone === "warn" || a.tone === "bad") ? '<span class="dot"></span>' : "";
      const ring = pend ? '<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><rect x="2.5" y="2.5" width="95" height="95" rx="47.5" pathLength="100"/></svg>' : "";
      const label = `${a.label}: ${a.sub || ""}`;
      const sub = pend ? "Αναμονή…" : f ? (f.type === "success" ? "Έτοιμο" : "Απέτυχε") : cap(a.sub || "");
      return `<div class="cell ${a.tone || ""}"><button class="act ${a.tone || ""} ${a.on ? "on" : ""} ${state}" data-id="${a.id}" ${a.disabled ? "disabled" : ""} title="${esc(label)}" aria-label="${esc(label)}">${ico(icon)}${dot}${ring}</button>${showT ? `<span class="cap t">${esc(a.label)}</span>` : ""}${showS ? `<span class="cap s">${esc(sub)}</span>` : ""}</div>`;
    }).join("");

    /* κατάσταση (πάνω στην εικόνα) */
    const st = this._status(v);
    el.status.style.cssText = `--st: ${st.rgb}`; el.status.dataset.ent = this._id("lock.doors");
    el.status.innerHTML = `${ico(st.icon)}<div><div class="t">${esc(st.text)}</div>${st.sub ? `<div class="s">${esc(st.sub)}</div>` : ""}</div>`;

    /* αυτονομία / θερμοκρασία */
    const bat = v.battery, range = this._n("sensor.remaining_range"), fuel = this._n("sensor.fuel_range"), temp = this._n("sensor.inside_temperature");
    const evRgb = bat === null ? "148,163,184" : bat < 30 ? "248,113,113" : bat < 50 ? "251,146,60" : bat < 70 ? "250,204,21" : "52,211,153";
    const fuRgb = fuel === null ? "148,163,184" : fuel < 100 ? "248,113,113" : fuel < 250 ? "250,204,21" : fuel < 400 ? "251,146,60" : "52,211,153";
    el.card.style.setProperty("--ds-ev", evRgb); el.card.style.setProperty("--ds-fu", fuRgb);
    const num = (n) => (n === null ? "--" : Math.round(n));
    const fu = hasFuel(this._hass, c);
    const parts = [range, fu ? fuel : null].filter((x) => x !== null), total = parts.length ? parts.reduce((s, x) => s + x, 0) : null;
    el.total.dataset.ent = this._id("sensor.remaining_range");
    el.total.innerHTML = `<div class="big">${num(total)}<small>km</small></div><div class="cap">${fu ? "συνολική αυτονομία" : "αυτονομία"}</div>`;
    const fl = this._n("sensor.fuel_level");
    const fuelPct = fl !== null && this._unit("sensor.fuel_level") === "%" ? fl : fuel !== null ? (fuel / c.fuel_max) * 100 : null;
    const cl = (x) => (x === null ? 0 : Math.min(100, Math.max(0, x)));
    const climOn = this._climateIsOn(), tgt = (() => { const t = this._tgt(); const n = t ? parseFloat(t.state) : NaN; return Number.isFinite(n) ? n : null; })(), pendC = !!this._pending.climate, climOk = this._s("climate.cabin_climate") !== null;
    const leftTxt = this._fmtLeft(this._s("sensor.remaining_charge_time_h_mm"));
    const chgSub = v.charging ? [this._chargeCurrent(), leftTxt ? T("απομένουν {0}", leftTxt) : ""].filter(Boolean).map(esc).join("<br>") : "";
    const flow = v.charging && bat !== null && bat < 99.5 ? `<circle class="fg" cx="50" cy="50" r="44" stroke-width="7" pathLength="100" stroke-dasharray="${((100 - bat) * 0.75).toFixed(1)} 100" stroke-dashoffset="-${(bat * 0.75).toFixed(1)}"/><circle class="fp" cx="50" cy="50" r="44" stroke-width="7" pathLength="100" stroke-dasharray="7 100" style="--fs:-${(bat * 0.75).toFixed(1)};--fe:-${Math.max(bat * 0.75, 75 - 7).toFixed(1)}"/>` : "";
    el.stats.innerHTML = `
      <div class="t2 temp" data-open="climate" data-ent="${esc(this._id("climate.cabin_climate"))}" data-hold="${esc(JSON.stringify({ action: "more-info", entity: this._id("sensor.inside_temperature") }))}" role="button" tabindex="0" aria-label="Κλιματισμός">
        <div class="tt">Θερμοκρασία</div>
        <div class="ts">Μέσα<br><b>${temp === null ? "--" : this._fmtNum(temp, 0) + "°C"}</b>${tgt === null || !climOn ? "" : ` · στόχος ${this._fmtNum(tgt, 1)}°`}</div>
        <button class="knob ${climOn ? "on" : ""} ${pendC ? "pending" : ""}" data-id="climate" ${climOk ? "" : "disabled"} aria-label="Κλιματισμός on/off">${ico("power")}${pendC ? RING : ""}</button></div>
      <div class="t2 batt" data-ent="${esc(this._id("sensor.battery_level"))}" role="button" tabindex="0">
        <div class="tt">${fu ? "Μπαταρία &amp; καύσιμο" : "Μπαταρία"}</div>
        <div class="ts ${v.charging ? "chg" : ""}"><b>${v.charging ? T("Φορτίζει τώρα") : T("Δεν φορτίζει")}</b>${chgSub ? `<br><span class="sub">${chgSub}</span>` : ""}</div>
        <div class="lg"><span style="color:rgb(${evRgb})">${ico("bolt")}<b>${num(range)}</b><small>km</small></span>${fu ? `<span style="color:rgb(${fuRgb})">${ico("fuel")}<b>${num(fuel)}</b><small>km</small></span>` : ""}</div>
        <div class="gauge"><svg viewBox="0 0 100 100" aria-hidden="true">
          <circle class="tr" cx="50" cy="50" r="44" stroke-width="7" pathLength="100" stroke-dasharray="75 25"/><circle class="ev" cx="50" cy="50" r="44" stroke-width="7" pathLength="100" stroke-dasharray="${(cl(bat) * 0.75).toFixed(1)} 100"/>${flow}
          ${fu ? `<circle class="tr" cx="50" cy="50" r="33" stroke-width="7" pathLength="100" stroke-dasharray="75 25"/><circle class="fu" cx="50" cy="50" r="33" stroke-width="7" pathLength="100" stroke-dasharray="${(cl(fuelPct) * 0.75).toFixed(1)} 100"/>` : ""}</svg>
          <div class="c"><span>${bat === null ? "--" : Math.round(bat)}<small>%</small></span></div></div></div>`;

    this._renderVehicle(v);
    this._watchChanges(v);

    /* πληροφορίες */
    const tiles = [];
    for (const id of c.info || []) {
      const it = INFO_ITEMS[id]; if (!it) continue;
      if (id === "fuel_level" && !hasFuel(this._hass, c)) continue;
      const { v: n, stale } = it[3] === null ? { v: null } : this._nl(it[0]);
      const s = this._s(it[0]);
      if (s === null && n === null) continue;
      const val = it[3] === null ? (s === null ? "--" : cap(s)) : n === null ? "--" : `${this._fmtNum(n, it[3])} ${this._unit(it[0])}`.trim();
      tiles.push(`<div class="tile" data-ent="${esc(this._id(it[0]))}">${ico(it[2])}<div><div class="v">${esc(val)}</div><div class="l">${esc(it[1])}</div></div></div>`);
    }
    for (const x of c.info_custom || []) {
      const o = this._eobj(x.entity), n = o ? parseFloat(o.state) : NaN;
      const val = !o || BAD.includes(o.state) ? "--" : Number.isFinite(n) ? `${this._fmtNum(n, 1)} ${o.attributes?.unit_of_measurement || x.unit || ""}`.trim() : cap(String(o.state));
      tiles.push(`<div class="tile" data-ent="${esc(x.entity)}"${x.tap_action ? ` data-tap="${esc(JSON.stringify(x.tap_action))}"` : ""}${x.hold_action ? ` data-hold="${esc(JSON.stringify(x.hold_action))}"` : ""}>${ico(x.icon || "info")}<div><div class="v">${esc(val)}</div><div class="l">${esc(x.label || o?.attributes?.friendly_name || x.entity)}</div></div></div>`);
    }
    /* διαγνωστικά: εικονίδια-ενδείξεις πάνω στην εικόνα, μόνο όταν υπάρχει κάτι να δεις */
    const hidSec = new Set(c.hidden), items = hidSec.has("diagnostics") ? [] : this._diagItems(), all = c.diag_mode === "all";
    const grp = new Map();
    for (const d of items.filter((x) => all || x.on)) { const k = `${d.icon}|${d.on}|${d.na}`, g = grp.get(k); if (g) g.label += `, ${d.label}`; else grp.set(k, { ...d }); }
    const shown = [...grp.values()], MAXT = 4;
    el.tells.innerHTML = shown.slice(0, MAXT).map((d) => {
      const k = d.on ? "bad" : d.na ? "na" : "ok";
      return `<button class="tell ${k}" data-ent="${esc(d.ent)}" title="${esc(d.label)}" aria-label="${esc(d.label)}">${ico(d.icon)}</button>`;
    }).join("") + (shown.length > MAXT ? `<button class="tell more" data-open-cust title="Όλες οι ενδείξεις">+${shown.length - MAXT}</button>` : "");
    el.tells.toggleAttribute("hidden", !shown.length);
    el.info.innerHTML = tiles.join("");
    el.info.toggleAttribute("data-off", !tiles.length || hidSec.has("info"));
    el.diag.toggleAttribute("data-empty-diag", true);

    /* φόρτιση */
    const showCharge = v.charging || v.plugged;
    el.charge.hidden = !showCharge;
    if (showCharge) {
      const left = this._s("sensor.remaining_charge_time_h_mm"), type = this._s("sensor.charging_type");
      el.charge.innerHTML = `<div><div class="l">Ρεύμα</div><div class="v">${esc(this._chargeCurrent() || "--")}</div></div>
        <div><div class="l">Απομένουν</div><div class="v">${esc(left && v.charging ? this._fmtLeft(left) : "--")}</div></div>
        <div><div class="l">Τύπος</div><div class="v">${esc(type || "--")}</div></div>`;
    }

    /* φύλλα */
    if (this._confirm) {
      const [title, text] = CONFIRM_TEXT[this._confirm.key] || ["Να συνεχίσω;", ""];
      el.box.className = "box confirm";
      el.box.innerHTML = `<h3>${esc(title)}</h3><p class="c">${esc(text)}</p><div class="btnrow"><button class="btn" data-close>Ακύρωση</button><button class="btn go" data-sheet="yes">Επιβεβαίωση</button></div>`;
      this._setEl = null;
      el.sheet.classList.add("show");
    } else if (this._customize) {
      if (!this._setEl || !el.box.contains(this._setEl)) {
        el.box.className = "box";
        el.box.innerHTML = `<div class="hd"><h3>Ρυθμίσεις κάρτας</h3><button class="x" data-close aria-label="Κλείσιμο">${ico("close")}</button></div>`;
        const s = document.createElement(SETTINGS_TAG);
        s.mode = "card";
        s.tab = this._stab;
        s.onTab = (t) => { this._stab = t; this._uiSave(); };
        s.onPatch = (p) => this._patch(p);
        s.onReset = () => this._resetLocal();
        el.box.appendChild(s);
        this._setEl = s;
        if (this._restoreSc) { const y = this._restoreSc; this._restoreSc = 0; requestAnimationFrame(() => { el.box.scrollTop = y; }); }
      }
      this._setEl.hass = this._hass;
      this._setEl.cfg = this._c;
      this._setEl.yamlBase = this._yaml;
      el.sheet.classList.add("show");
    } else {
      this._setEl = null;
      el.sheet.classList.remove("show");
    }
  }

  /* ───── πάτημα / παρατεταμένο πάτημα σε αισθητήρες ───── */
  _bindPress() {
    const root = this._el.card; let st = null;
    root.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || e.target.closest("[data-id]")) return;
      const t = e.target.closest("[data-ent],[data-open]"); if (!t) return;
      st = { t, x: e.clientX, y: e.clientY, held: false };
      st.timer = setTimeout(() => { if (st) { st.held = true; try { navigator.vibrate && navigator.vibrate(15); } catch (_) {} this._hold(st.t); } }, 520);
    });
    root.addEventListener("pointermove", (e) => { if (st && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 10) { clearTimeout(st.timer); st.moved = true; } });
    const end = (cancel) => { if (!st) return; clearTimeout(st.timer); const s = st; st = null; if (!cancel && !s.held && !s.moved) this._tap(s.t); };
    root.addEventListener("pointerup", () => end(false));
    root.addEventListener("pointercancel", () => end(true));
    root.addEventListener("contextmenu", (e) => { if (e.target.closest("[data-ent]")) e.preventDefault(); });
  }
  _cfgOf(t, k) { try { return t.dataset[k] ? JSON.parse(t.dataset[k]) : null; } catch (_) { return null; } }
  _tap(t) {
    if (t.dataset.open && !t.dataset.tap) { this._view = t.dataset.open; return this._force(); }
    this._act(this._cfgOf(t, "tap") || { action: "more-info" }, t.dataset.ent);
  }
  _hold(t) {
    const a = this._cfgOf(t, "hold");
    if (a) return this._act(a, t.dataset.ent);
    this._tap(t);
  }
  _act(cfg, ent) {
    const a = cfg.action || "more-info", id = cfg.entity || ent;
    if (a === "more-info") { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: id } })); return; }
    if (a === "toggle") return this._hass.callService("homeassistant", "toggle", { entity_id: id });
    if (a === "call-service" || a === "perform-action") {
      const [dom, svc] = String(cfg.service || cfg.perform_action || "").split(".");
      if (!dom || !svc) return this._toast("Λάθος υπηρεσία στο action", "error");
      return this._hass.callService(dom, svc, { ...(cfg.data || cfg.service_data || {}), ...(cfg.target || {}) })
        .then(() => this._toast("Η ενέργεια εστάλη", "ok")).catch((err) => this._toast(err?.message || "Η ενέργεια απέτυχε", "error"));
    }
    if (a === "navigate" && cfg.navigation_path) { history.pushState(null, "", cfg.navigation_path); window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } })); return; }
    if (a === "url" && cfg.url_path) window.open(cfg.url_path, "_blank");
  }

  /* ───── number picker (προσαρμογή του deepal-number-picker) ───── */
  _pkInit() {
    const p = this._el.pkp, IW = 64;
    const idx = () => (this._pk ? Math.max(0, Math.min(this._pk.vals.length - 1, Math.round(p.scrollLeft / IW))) : 0);
    p.addEventListener("scroll", () => {
      if (!this._pk) return;
      const i = idx();
      if (i !== this._pkIdx) { this._pkIdx = i; this._pkPaint(i); }
      if (this._pkProg) return;
      clearTimeout(this._pkT);
      this._pkT = setTimeout(() => this._pkSettle(i), 220);
    }, { passive: true });
    const user = () => { this._pkUser = true; clearTimeout(this._pkUT); this._pkUT = setTimeout(() => { this._pkUser = false; }, 2500); };
    ["pointerdown", "touchstart", "wheel"].forEach((ev) => p.addEventListener(ev, user, { passive: true }));
    p.addEventListener("click", (e) => {
      const n = e.target.closest(".pn"); if (!n) return;
      user(); this._pkProg = false; p.scrollTo({ left: Number(n.dataset.i) * IW, behavior: "smooth" });
    });
  }
  _pkSetup(o) {
    const a = o.attributes || {}, min = Number(a.min ?? 16), max = Number(a.max ?? 32), step = Number(a.step || 0.5), key = `${min}|${max}|${step}`;
    if (this._pkKey === key) return;
    const dec = (String(step).split(".")[1] || "").length, vals = [];
    for (let x = min; x <= max + step / 100; x += step) vals.push(Number(x.toFixed(dec)));
    this._pk = { vals, dec }; this._pkKey = key; this._pkIdx = -1;
    this._el.pkp.innerHTML = vals.map((x, i) => `<div class="pn" data-i="${i}">${x.toFixed(dec)}</div>`).join("");
    this._pkItems = [...this._el.pkp.children];
  }
  _pkPaint(i) {
    const { vals, dec } = this._pk;
    this._pkItems.forEach((n, k) => { n.classList.toggle("act2", k === i); n.classList.toggle("near", Math.abs(k - i) === 1); });
    this._el.pkv.textContent = vals[i].toFixed(dec);
    this._el.pk.classList.toggle("cold", vals[i] <= 20); this._el.pk.classList.toggle("hot", vals[i] >= 26);
  }
  _pkScroll(i, smooth) {
    this._pkProg = true; this._el.pkp.scrollTo({ left: i * 64, behavior: smooth ? "smooth" : "auto" });
    clearTimeout(this._pkPT); this._pkPT = setTimeout(() => { this._pkProg = false; }, smooth ? 450 : 150);
  }
  async _pkSettle(i) {
    this._pkUser = false;
    const o = this._tgt(); if (!o || !this._pk) return;
    const v = this._pk.vals[i], cur = parseFloat(o.state);
    if (Number.isFinite(cur) && Math.abs(cur - v) < 0.001) return;
    this._tpend = v; clearTimeout(this._tTimer2);
    this._tTimer2 = setTimeout(() => { this._tpend = undefined; this._force(); }, 6000);
    this._force();
    try { await this._setTgt(v); }
    catch (err) { this._tpend = undefined; this._toast(err?.message ? T("Απέτυχε: {0}", err.message) : T("Η εντολή απέτυχε"), "error"); }
  }

  _renderVehicle(v) {
    const el = this._el, c = this._c, view = this._view === "seats" ? "seats" : this._view === "top" ? "top" : this._view ? "climate" : "top";
    el.vsheet.classList.toggle("show", this._vsheetOpen());
    this.shadowRoot.getElementById("vtitle").textContent = view === "top" ? "Ελαστικά & ανοίγματα" : view === "climate" ? "Κλιματισμός" : "Καθίσματα & τιμόνι";
    if (!this._vsheetOpen()) { this._pkIdx = -1; return; }
    el.vtabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.vv === view));
    el.vtop.hidden = view !== "top"; el.vclim.hidden = view !== "climate"; el.vseats.hidden = view !== "seats";
    el.vextra.hidden = view !== "top";
    if (view !== "climate") this._pkIdx = -1;
    if (view === "top") {
      for (const [id, open, closed, key] of TOP_LAYERS) {
        const on = id === "low_beam" ? this._is("binary_sensor.low_beam", "on") : this._is(key, "on");
        const o = el.vtop.querySelector(`[data-l="${open}"]`); if (o) o.classList.toggle("on", on);
        if (closed) { const cl = el.vtop.querySelector(`[data-l="${closed}"]`); if (cl) cl.classList.toggle("on", !on); }
      }
      const pills = [];
      TIRES.forEach((t) => {
        const r = this._tire(t), g = el.vtop.querySelector(`[data-t="${t.id}"]`); if (!g) return;
        const rect = g.querySelector("rect"), tx = g.querySelector("text");
        const rgb = r.tone;
        rect.setAttribute("style", `fill: rgba(${rgb === "var(--ds-ok)" ? "var(--ds-ok)" : rgb}, .16); stroke: rgb(${rgb});`);
        tx.setAttribute("style", `fill: rgb(${rgb});`);
        tx.textContent = r.txt + (r.stale ? "·" : "");
        g.setAttribute("opacity", r.stale ? ".7" : "1");
        if (r.note) pills.push(`<span><b style="--c:${rgb}">${esc(t.name)}</b>: ${esc(r.note)}</span>`);
      });
      const open = v.open.map((x) => x[1]);
      const bits = [...(open.length ? [`<span><b style="--c:var(--ds-bad)">Ανοιχτά:</b> ${esc(open.join(", "))}</span>`] : []), ...pills];
      el.vextra.innerHTML = bits.length ? `<div class="vline">${bits.join("")}</div>` : ""; el.vextra.hidden = !bits.length;
    } else if (view === "seats") {
      for (const [id, key, , , , , layer] of INT_SPOTS) {
        const lv = this._level(key), max = this._obj(key)?.attributes?.max ?? 3;
        const L = el.vseats.querySelector(`img[data-l="${layer}"]`);
        if (L) { L.classList.toggle("on", lv > 0); L.style.opacity = lv > 0 ? String(key.startsWith("switch.") ? 1 : 0.4 + 0.6 * (lv / max)) : ""; }
        for (const b of el.vseats.querySelectorAll(`[data-spot="${id}"]`)) {
          b.classList.toggle("lv", lv > 0);
          const bars = b.querySelectorAll(".lvl i"); bars.forEach((i, k) => i.classList.toggle("f", k < lv));
          const lvl = b.querySelector(".lvl"); if (lvl) lvl.hidden = key.startsWith("switch.");
          b.setAttribute("aria-pressed", String(lv > 0));
        }
      }
    } else {
      const on = this._climateIsOn(), steer = this._level("switch.steering_wheel_heating") > 0;
      const im = el.dash.querySelector("img"), k = steer ? "dash_off_steer" : "dash_off";
      if (im.dataset.key !== k) { im.dataset.key = k; im.dataset.i = "0"; im.style.visibility = ""; im.src = this._heroSrc(k, 0); }
      el.dash.classList.toggle("air", on);
      const fan = parseFloat(this._s("sensor.climate_fan_level"));
      el.dash.querySelector(".air").style.setProperty("--sp", String(Number.isFinite(fan) ? Math.min(1.9, Math.max(0.7, 0.65 + fan * 0.16)) : 1));
      const inside = this._n("sensor.inside_temperature"), fanTxt = this._s("sensor.climate_fan_level"), pend = !!this._pending.climate;
      el.vtctl.innerHTML = `<div class="crow"><div class="in"><b>${on ? "Ενεργός" : "Ανενεργός"}</b><br>${inside === null ? "" : `Μέσα ${this._fmtNum(inside, 1)}°C`}${fanTxt === null || !on ? "" : ` · ένταση ${esc(fanTxt)}`}</div>
        <button class="act ${on ? "on" : ""} ${pend ? "pending" : ""}" data-id="climate" aria-label="Κλιματισμός on/off">${ico("power")}${pend ? RING : ""}</button></div>`;
      const no = this._tgt();
      el.pk.hidden = !no;
      if (no) {
        this._pkSetup(no);
        const val = this._tpend ?? parseFloat(no.state);
        if (Number.isFinite(val) && !this._pkUser && this._pk) {
          let best = 0, bd = Infinity; this._pk.vals.forEach((x, i) => { const d = Math.abs(x - val); if (d < bd) { bd = d; best = i; } });
          if (best !== this._pkIdx) { this._pkIdx = best; this._pkPaint(best); this._pkScroll(best, false); }
        }
      }
    }
  }
}

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
    const dRows = DIAG.filter((d) => has(d[0])).map((d) => `<button class="row tg ${selIds.includes(d[0]) ? "on" : ""}" data-diag="${d[0]}">${ico(d[2])}<span>${esc(d[1])}</span><i class="sw ${selIds.includes(d[0]) ? "on" : ""}"></i></button>`).join("");
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

customElements.define(SETTINGS_TAG, DeepalS05Settings);
customElements.define(EDITOR_TAG, DeepalS05CardEditor);
customElements.define(TAG, DeepalS05Card);

window.customCards = window.customCards || [];
if (!window.customCards.some((x) => x.type === TAG)) {
  window.customCards.push({ type: TAG, name: "Deepal S05", description: "Deepal vehicle card (S05 EV/PHEV): controls, status, charging, tyres, interior, diagnostics. Works with the Deepal Alternative integration.", preview: false });
}
console.info(`%c DEEPAL-S05-CARD %c v${CARD_VERSION} `, "background:#E20074;color:#fff;border-radius:4px 0 0 4px;padding:2px 4px", "background:#222;color:#fff;border-radius:0 4px 4px 0;padding:2px 4px");
})();
