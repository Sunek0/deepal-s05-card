# Changelog

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
