# Changelog

## 1.1.0

Summary of everything that changed since 1.0.7. · Συγκεντρωτικά όσα άλλαξαν από την 1.0.7. · Resumen de todo lo que cambió desde la 1.0.7.

**New**

- **Car View** replaces the top view: a real 3/4 render of the car (front-left) made of layers. Doors, bonnet, tailgate, windows and headlights show live. The four tyre pressures are small labels connected to their wheels with lines (dashed for the wheels on the far side) — green with a check when OK, red with a note when not.
- **Car colour**: black, blue, grey, silver or white, and three wheel styles (20″ with covers, 20″ without, 18″ Pro) — *Settings → Show → Car colour* (`car_color`, `iso_wheels`). Only the selected colour is loaded, and only when the Car View is opened.
- **Climate airflow**: thin, swaying streams from the two middle vents and the two dashboard slits (the left one emerges from behind the steering wheel). The air is coloured by the target temperature — cool / mild / warm, 22 °C and 24 °C by default. Limits and colours are configurable (*Settings → Show → Air flow colors*: `air_t1`, `air_t2`, `air_c1`, `air_c2`, `air_c3`).
- New presentation images (Car View, car colours, climate, settings). Documentation in English, Greek and Spanish.

**Fixed**

- The climate picker and the airflow colour did not update when only the target temperature changed.
- Popups and Settings are centred as a full-page overlay on large screens.
- Tyre labels: a general tyre warning no longer turns all four red; the label of a single wheel with an alarm is shown correctly.
- Texts in Settings that still mentioned the removed charging picture.

**Removed**

- The top-view images (`images/top`), the Charging view of the popup and the `top_orientation` option (old configs keep working; the key is ignored).

**Other**

- New vehicle renders from dec_deepal (MIT) — see THIRD_PARTY_NOTICES.md. Copyright (c) 2026 L.K.

<details><summary>Ελληνικά</summary>

**Νέα**

- Το **Car View** αντικαθιστά την κάτοψη: πραγματικό render 3/4 του αμαξιού (μπροστά αριστερά) από layers. Πόρτες, καπό, πορτμπαγκάζ, παράθυρα και φώτα εμφανίζονται ζωντανά. Οι πιέσεις των τεσσάρων ελαστικών είναι μικρές ετικέτες συνδεδεμένες με γραμμές στους τροχούς (διακεκομμένες για τους τροχούς της μακρινής πλευράς) — πράσινες με ✓ όταν είναι OK, κόκκινες με σημείωση όταν όχι.
- **Χρώμα αμαξιού**: μαύρο, μπλε, γκρι, ασημί ή λευκό, και τρία στυλ ζαντών (20″ με τάπες, 20″ χωρίς, 18″ Pro) — *Ρυθμίσεις → Εμφάνιση → Χρώμα αμαξιού* (`car_color`, `iso_wheels`). Φορτώνεται μόνο το επιλεγμένο χρώμα και μόνο όταν ανοίξει το Car View.
- **Ροή αέρα κλιματισμού**: λεπτά ρεύματα που κυματίζουν από τους δύο μεσαίους αεραγωγούς και τις δύο σχισμές του ταμπλό (η αριστερή βγαίνει πίσω από το τιμόνι). Ο αέρας παίρνει χρώμα από τη θερμοκρασία-στόχο — δροσερό / μέτριο / ζεστό, αρχικά 22 °C και 24 °C. Τα όρια και τα χρώματα ρυθμίζονται (*Ρυθμίσεις → Εμφάνιση → Χρώμα αέρα κλιματισμού*).
- Νέες εικόνες παρουσίασης (Car View, χρώματα, κλιματισμός, ρυθμίσεις). Τεκμηρίωση στα Αγγλικά, Ελληνικά και Ισπανικά.

**Διορθώσεις**

- Ο επιλογέας του κλιματισμού και το χρώμα του αέρα δεν ενημερώνονταν όταν άλλαζε μόνο η θερμοκρασία-στόχος.
- Τα popups και οι Ρυθμίσεις ανοίγουν κεντραρισμένα σε ολόκληρη τη σελίδα στις μεγάλες οθόνες.
- Ετικέτες ελαστικών: μια γενική προειδοποίηση δεν κοκκινίζει πια και τα τέσσερα· εμφανίζεται σωστά ο ένας τροχός με συναγερμό.
- Κείμενα στις Ρυθμίσεις που ανέφεραν ακόμα την εικόνα φόρτισης που αφαιρέθηκε.

**Αφαιρέθηκαν**

- Οι εικόνες κάτοψης (`images/top`), η προβολή φόρτισης του popup και η επιλογή `top_orientation` (οι παλιές ρυθμίσεις συνεχίζουν να δουλεύουν· το κλειδί αγνοείται).

**Άλλα**

- Νέα renders του οχήματος από το dec_deepal (MIT) — δες THIRD_PARTY_NOTICES.md. Copyright (c) 2026 L.K.

</details>

<details><summary>Español</summary>

**Novedades**

- **Car View** sustituye a la vista cenital: un render 3/4 real del coche (delantero izquierdo) hecho con capas. Puertas, capó, portón, ventanillas y faros se muestran en vivo. Las presiones de los cuatro neumáticos son etiquetas pequeñas unidas a las ruedas con líneas (discontinuas para las ruedas del lado lejano): verdes con ✓ si están bien, rojas con una nota si no.
- **Color del coche**: negro, azul, gris, plata o blanco, y tres estilos de llantas (20″ con tapas, 20″ sin tapas, 18″ Pro) — *Ajustes → Mostrar → Color del coche* (`car_color`, `iso_wheels`). Solo se carga el color elegido y solo al abrir el Car View.
- **Flujo de aire del clima**: corrientes finas que ondean desde las dos salidas centrales y las dos ranuras del salpicadero (la izquierda sale por detrás del volante). El aire toma el color de la temperatura objetivo — fresco / templado / cálido, por defecto 22 °C y 24 °C. Los límites y los colores se configuran (*Ajustes → Mostrar → Colores del flujo de aire*).
- Nuevas imágenes de presentación (Car View, colores, clima, ajustes). Documentación en inglés, griego y español.

**Corregido**

- El selector de clima y el color del aire no se actualizaban cuando solo cambiaba la temperatura objetivo.
- Las ventanas emergentes y los Ajustes se abren centrados a pantalla completa en pantallas grandes.
- Etiquetas de neumáticos: un aviso general ya no pone los cuatro en rojo; se muestra bien la rueda con alarma.
- Textos de Ajustes que aún mencionaban la imagen de carga eliminada.

**Eliminado**

- Las imágenes cenitales (`images/top`), la vista de carga de la ventana emergente y la opción `top_orientation` (las configuraciones antiguas siguen funcionando; la clave se ignora).

**Otros**

- Nuevos renders del vehículo de dec_deepal (MIT) — véase THIRD_PARTY_NOTICES.md. Copyright (c) 2026 L.K.

</details>

## 1.0.7

- Charging details are shown once: the status row and the Energy tile no longer repeat the current, type and remaining time (they are on the hero photo next to the charge port).
- New presentation images (A/C target picker, settings, EV vs PHEV).

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
