#!/usr/bin/env python3
"""
Φτιάχνει τα layers (κάτοψη + εσωτερικό) για την κάρτα deepal-s05-card
από το repo manuelem1984/dec_deepal (MIT).

  python3 build_layers.py <φάκελος dec_deepal-main> <φάκελος εξόδου> [--tone black|original]

Τι κάνει:
  • Κόβει τα PNG στην περιοχή που χρησιμοποιεί η κάρτα (μικρότερα αρχεία).
  • --tone black (προεπιλογή): μετατρέπει το ασημί αμάξωμα της κάτοψης σε μαύρο
    (curve στη φωτεινότητα, κρατάει τις ανταύγειες). Οι «ανοιχτές» πόρτες/καπό/
    πορτμπαγκάζ γίνονται κόκκινες σκιές, ώστε να ξεχωρίζουν αμέσως.
  • --tone original: κρατάει τα χρώματα του repo.
  • Αποθηκεύει σε WebP με διαφάνεια.

Η έξοδος (π.χ. deepal/top, deepal/interior) πηγαίνει στο /config/www/deepal/.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# Ίδιες περικοπές με την κάρτα του dec_deepal (src/10_constantes.js)
TOP_CROP = (120, 22, 120 + 510, 22 + 720)
INTERIOR_CROP = (190, 300, 190 + 745, 300 + 560)

TOP_FILES = (
    ["base", "low_beam_on", "hood_open", "hood_closed", "trunk_open", "trunk_closed"]
    + [f"door_{p}_{s}" for p in ("front_left", "front_right", "rear_left", "rear_right") for s in ("open", "closed")]
    + [f"window_{p}_open" for p in ("front_left", "front_right", "rear_left", "rear_right")]
)
INTERIOR_FILES = [
    "base",
    "steering_wheel_heat_on",
    "seat_heat_driver_on",
    "seat_heat_passenger_on",
    "seat_vent_driver_on",
    "seat_vent_passenger_on",
]

# Layers που είναι ο ίδιος ο χρωματισμένος αμάξωμα (σκουραίνουν)
PAINT = {"base", "hood_closed", "trunk_closed"} | {f"door_{p}_closed" for p in ("front_left", "front_right", "rear_left", "rear_right")}
# Layers «ανοιχτού» (ξαναχρωματίζονται κόκκινα)
OPEN = {"hood_open", "trunk_open"} | {f"door_{p}_open" for p in ("front_left", "front_right", "rear_left", "rear_right")}


def to_black(img: Image.Image) -> Image.Image:
    a = np.asarray(img.convert("RGBA")).astype(np.float32) / 255.0
    rgb, alpha = a[..., :3], a[..., 3:]
    lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    # curve: σκούρα μένουν σκούρα, οι ανταύγειες μένουν ορατές
    out = 0.26 * np.power(lum, 3.0)
    tint = np.array([0.94, 0.98, 1.08], dtype=np.float32)  # ελαφρύ ψυχρό μαύρο
    res = np.clip(out[..., None] * tint, 0, 1)
    return Image.fromarray((np.concatenate([res, alpha], axis=-1) * 255 + 0.5).astype(np.uint8), "RGBA")


def to_red(img: Image.Image) -> Image.Image:
    a = np.asarray(img.convert("RGBA")).astype(np.float32) / 255.0
    rgb, alpha = a[..., :3], a[..., 3:]
    lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    lum = np.clip(0.15 + 0.95 * lum, 0, 1)
    col = np.array([1.0, 0.24, 0.26], dtype=np.float32)
    res = np.clip(lum[..., None] * col * 0.95, 0, 1)
    return Image.fromarray((np.concatenate([res, alpha], axis=-1) * 255 + 0.5).astype(np.uint8), "RGBA")


def split_red_black(img: Image.Image) -> Image.Image:
    """Layers με μείγμα (κόκκινο + ασημί): τα κόκκινα μένουν κόκκινα, τα υπόλοιπα μαυρίζουν."""
    a = np.asarray(img.convert("RGBA")).astype(np.float32) / 255.0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    redness = np.clip((r - np.maximum(g, b)) / 0.22, 0, 1)[..., None]
    red = np.asarray(to_red(img)).astype(np.float32) / 255.0
    blk = np.asarray(to_black(img)).astype(np.float32) / 255.0
    out = red * redness + blk * (1 - redness)
    out[..., 3] = a[..., 3]
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8), "RGBA")


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=92, alpha_quality=100, method=6)


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    tone = "black"
    if "--tone" in sys.argv:
        tone = sys.argv[sys.argv.index("--tone") + 1]
        args = [a for a in args if a != tone]
    if len(args) != 2 or tone not in ("black", "original"):
        sys.exit(__doc__)
    src = Path(args[0])
    out = Path(args[1])
    veh = src / "custom_components" / "dec_deepal" / "vehicles"
    if not veh.is_dir():
        sys.exit(f"Δεν βρέθηκε {veh}")

    n = 0
    for name in TOP_FILES:
        im = Image.open(veh / "vista_planta" / "s05_2024" / f"{name}.png").convert("RGBA").crop(TOP_CROP)
        if tone == "black":
            if name in PAINT:
                im = to_black(im)
            elif name in OPEN:
                im = to_red(im)
            elif name.startswith("window_"):
                im = split_red_black(im)
        save(im, out / "top" / f"{name}.webp")
        n += 1
    for name in INTERIOR_FILES:
        im = Image.open(veh / "vista_interior" / "s05_2024" / f"{name}.png").convert("RGBA").crop(INTERIOR_CROP)
        save(im, out / "interior" / f"{name}.webp")
        n += 1
    print(f"OK: {n} αρχεία → {out}  (tone={tone})")


if __name__ == "__main__":
    main()
