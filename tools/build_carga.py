"""Converts the charging-view layers of dec_deepal (MIT) to WebP.

Usage: python3 tools/build_carga.py <dec_deepal>/custom_components/dec_deepal/vehicles/vista_carga/s05_2024 dist/images/carga
Layers (750x500, same car position): base (translucent side view), cable_connected (grey), cable_charging (green).
"""
import os, sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for n in ("base", "cable_connected", "cable_charging"):
    Image.open(f"{src}/{n}.png").convert("RGBA").save(f"{out}/{n}.webp", "WEBP", quality=88, alpha_quality=100, method=6)
