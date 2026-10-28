# Changelog

## 1.0.6

- Charging details (current, time remaining, type) are now plain green text on the hero photo, next to the charge port — no frame. Four styles (Settings → Charging → Style): `line` (default), `text`, `big`, `beside`.
- Top view uses the real top-down photo of the car. Tyre pressures are pills connected to the image: green with a check when OK, red with a "low"/"check" note otherwise.
- Tyre pressure check can follow the alerts the car sends itself (`tire_check: vehicle`, default), your own min/max limits (`limits`), or both. Min/max fields are entered in the selected unit (bar, kPa or psi).
- Settings are no longer written to the dashboard YAML on every click: while the settings are open nothing reloads, and the YAML is saved once when you close them (changes still apply instantly and are kept in your browser and HA account).
- Presentation images added to the README.

## 1.0.5

- The settings tab arrow buttons are now translated (English/Spanish). No other changes.

## 1.0.4

- Settings redesigned: eight tabs with icons (Sections, Buttons, Sensors, Charging, Tyres, Appearance, Images, General), grouped cards, segmented controls and colour swatches. Tabs have an opaque bar and arrow buttons (plus mouse drag), so they can be scrolled without a wheel.
- Battery/fuel level colours and thresholds are configurable (Settings → Charging); the charging effect now has exactly the colour of the bar.
- Battery/fuel gauge: the percentages map to the visible arc, the ring is cropped by the tile corner, and the numbers are larger. The tile title is "Energy" on PHEV.
- Images tab is back, limited to the hero/dashboard photos (the layer check lists were removed).
- Performance: effects behind a popup and off-screen are paused (60 fps instead of ~41 with Settings open while charging), translations are cached, and Settings no longer re-attaches its event listeners on every refresh (a bug that made controls act on stale values).
- Security: colour values are validated (`#rrggbb`), `url`/`navigate` tap actions accept only `http(s)` and local paths, saved settings keep only known keys, language codes are validated before loading `lang/<code>.js`.

## 1.0.3

- Spanish translation (`lang/es.js`).
- Popups slide up smoothly instead of jumping in.
- `card_padding: none`: tiles and buttons keep their border and rounded corners (3px from the edge).
- Missing English strings fixed (layer headings, climate messages, tooltips); raw sensor states such as `not_charging` are shown as readable text.
- Language list now includes Español.

## 1.0.2

- Battery/fuel gauge (PHEV): the centre now shows both the battery % and the fuel %.
- `card_padding: none` now makes the tiles and buttons edge to edge as well (popups keep their own margins).

## 1.0.1

- Messages are shown on the hero image (bottom or top, configurable) and stay longer (configurable).
- Pending status "Locking… / Unlocking…" instead of the stale state while waiting for the vehicle.
- Every action button can ask for confirmation (per-button switches in the settings).
- New margin options for the card (including edge-to-edge image) and for the popups.

## 1.0.0

- First public release.
- Hero photo with state variants, round control buttons, battery/fuel/temperature tiles, diagnostics, info tiles.
- Top-view and interior popups with climate picker, seat and steering-wheel heating.
- Charging status ("Charging now", current, time left), animated battery ring and charging effects on the car.
- English and Greek, following the Home Assistant language; additional languages via `dist/lang/<code>.js`.
- EV / PHEV support (`powertrain: auto | phev | ev`).
- Automatic detection of the entity prefix and of entities through the registry `translation_key`.
- Settings UI shared by all devices (saved in the card YAML).
