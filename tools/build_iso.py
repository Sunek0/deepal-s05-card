"""Converts the Car View layers of dec_deepal (MIT) to WebP.

Usage: python3 tools/build_iso.py <dec_deepal>/custom_components/dec_deepal/vehicles/vista_isometrica/s05_2024 dist/images/iso
Colour-dependent layers come from <src>/<colour_id>/, the rest (glass, wheels, headlights) from <src>/.
"""
import os, sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
COLORS = {"deep_space_black": "black", "andromeda_blue": "blue", "ganymade_grey": "grey", "mercury_silver": "silver", "moonlight_white": "white"}
BODY = ["base", "hood_closed", "hood_open", "trunk_closed", "trunk_open"] + [f"door_{p}_{s}_{st}" for p in ("front", "rear") for s in ("left", "right") for st in ("closed", "open")]
COMMON = [f"window_{p}_{s}_closed{x}" for p in ("front", "rear") for s in ("left", "right") for x in ("", "_door_open")] + ["wheels_pro", "wheels_open", "low_beam_on"]

def save(a, b):
    os.makedirs(os.path.dirname(b), exist_ok=True)
    Image.open(a).convert("RGBA").save(b, "WEBP", quality=88, alpha_quality=100, method=6)

for cid, name in COLORS.items():
    for n in BODY:
        save(f"{src}/{cid}/{n}.png", f"{out}/{name}/{n}.webp")
for n in COMMON:
    save(f"{src}/{n}.png", f"{out}/common/{n}.webp")
