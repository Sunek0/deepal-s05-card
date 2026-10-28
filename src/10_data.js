
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
  lock: ["Κλείδωμα οχήματος;", "Το όχημα θα κλειδώσει."],
  climate: ["Αλλαγή κλιματισμού;", "Θα σταλεί εντολή στον κλιματισμό του οχήματος."],
  flash: ["Αναλαμπή φώτων;", "Τα φώτα του οχήματος θα αναβοσβήσουν."],
  honk: ["Ηχητικό σήμα;", "Η κόρνα του οχήματος θα ηχήσει."],
  find: ["Εντοπισμός οχήματος;", "Τα φώτα θα αναβοσβήσουν και η κόρνα θα ηχήσει."],
  refresh: ["Ανανέωση δεδομένων;", "Θα ζητηθούν νέα δεδομένα από το όχημα."],
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
ha-card[data-pad="half"] { padding:7px; gap:12px; }
ha-card[data-pad="none"] { padding:0 0 8px; gap:8px; }
ha-card[data-pad="none"] > :not(.hero):not(.sheet) { margin-inline:0; }
ha-card[data-pad="none"] .t2, ha-card[data-pad="none"] .tile { border-radius:0; border-inline:0; }
ha-card[data-pad="none"] .actions { padding-inline:6px; }
ha-card[data-pad="none"] > .hero { border-radius:0; }
ha-card[data-ppad="half"] .sheet { padding:5px; } ha-card[data-ppad="half"] .box { padding:8px 7px 6px; }
ha-card[data-ppad="none"] .sheet { padding:0; } ha-card[data-ppad="none"] .box { padding:8px 4px 4px; border-radius:24px 24px 0 0; border-inline:0; border-bottom:0; }
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
.toast { position:absolute; left:50%; top:14px; bottom:auto; z-index:40; transform: translate(-50%, -8px); max-width: calc(100% - 28px); padding: 8px 14px; border-radius: 999px;
  font-size: 12.5px; font-weight: 500; color:#fff; opacity:0; pointer-events:none; background: rgba(20,20,24,.82); border:1px solid rgba(255,255,255,.16);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); transition: opacity .2s ease, transform .2s ease; white-space: nowrap; overflow:hidden; text-overflow: ellipsis; }
.toast.pos-bottom { top:auto; bottom:14px; transform: translate(-50%, 8px); }
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
.gauge .c { display:flex; flex-direction:column; justify-content:center; align-items:center; line-height:1.05; }
.gauge .c .gf { display:inline-flex; align-items:center; gap:2px; font-size:11.5px; font-weight:600; letter-spacing:0; margin-top:1px; } .gauge .c .gf svg.i { width:11px; height:11px; transform:none; overflow:visible; }
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

