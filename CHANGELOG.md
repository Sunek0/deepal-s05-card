# Changelog

## 1.0.0

- First public release.
- Hero photo with state variants, round control buttons, battery/fuel/temperature tiles, diagnostics, info tiles.
- Top-view and interior popups with climate picker, seat and steering-wheel heating.
- Charging status ("Charging now", current, time left), animated battery ring and charging effects on the car.
- English and Greek, following the Home Assistant language; additional languages via `dist/lang/<code>.js`.
- EV / PHEV support (`powertrain: auto | phev | ev`).
- Automatic detection of the entity prefix and of entities through the registry `translation_key`.
- Settings UI shared by all devices (saved in the card YAML).
