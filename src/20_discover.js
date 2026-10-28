
/* ───────────────────────── Ανακάλυψη νέων αισθητήρων ─────────────────────────
 * Αν το integration προσθέσει νέα προειδοποίηση (π.χ. binary_sensor.s05_engine_warning), η κάρτα δεν την ξέρει.
 * Εδώ ψάχνουμε στο HA για binary_sensor του ίδιου οχήματος που μοιάζουν με προειδοποίηση και δεν είναι ήδη στη λίστα. */
const DISC_CLASSES = new Set(["problem", "safety", "tamper", "battery", "smoke", "gas", "carbon_monoxide"]);
const DISC_SKIP = new Set(["lock", "door", "window", "plug", "light", "heat", "cold", "connectivity", "battery_charging", "power", "opening", "garage_door", "running", "moving", "presence", "occupancy", "motion", "vibration", "update"]);
const DISC_NAME = /(warning|alarm|fault|error|alert|failure|malfunction|_low)$/;
const guessDiagIcon = (s) => {
  const t = String(s).toLowerCase();
  const m = [[/airbag/, "airbag"], [/abs/, "abs"], [/fluid/, "fluid"], [/brake/, "brake"], [/tire|tyre|tpms/, "tirealert"], [/steer|eps/, "steering"], [/12_?v|aux/, "battery12"],
    [/traction|hv_|high_voltage/, "battery"], [/battery|soc/, "battery"], [/oil/, "oil"], [/engine|motor|emission/, "engine"], [/power_limit|derat|limit/, "turtle"], [/power|system|inverter|drive/, "evfault"], [/key|fob/, "key"], [/trunk|tailgate/, "trunk"]];
  for (const [re, ic] of m) if (re.test(t)) return ic;
  return "alert";
};
const discoverDiag = (hass, c) => {
  const st = hass?.states; if (!st) return [];
  const p = effPrefix(hass, c);
  const known = new Set([...DIAG.map((d) => resolveId(hass, c, d[0])), ...OPEN_ITEMS.map((o) => resolveId(hass, c, o[0])), ...OTHER_KEYS.map((k) => resolveId(hass, c, k)),
    ...(c.diag_custom || []).map((x) => x.entity), ...(c.info_custom || []).map((x) => x.entity), ...(c.diag_ignore || [])]);
  const mine = new Set(), pre = `binary_sensor.${p}_`;
  for (const id of Object.keys(st)) if (id.startsWith(pre)) mine.add(id);
  const reg = hass.entities, dev = reg && reg[resolveId(hass, c, "lock.doors")]?.device_id;
  if (reg && dev) for (const e of Object.values(reg)) if (e.device_id === dev && e.entity_id.startsWith("binary_sensor.") && !e.hidden_by && !e.disabled_by) mine.add(e.entity_id);
  const out = [];
  for (const id of mine) {
    const o = st[id]; if (!o || known.has(id)) continue;
    const dc = o.attributes?.device_class, name = id.slice(id.indexOf(".") + 1);
    if (!(DISC_CLASSES.has(dc) || (!DISC_SKIP.has(dc) && DISC_NAME.test(name)))) continue;
    const fn = String(o.attributes?.friendly_name || name), label = fn.replace(new RegExp(`^${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "");
    out.push({ entity: id, label: label.charAt(0).toUpperCase() + label.slice(1), icon: guessDiagIcon(name), on: String(o.state).toLowerCase() === "on" });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
};
