#!/usr/bin/env python3
"""Μετατρέπει το σχέδιο του οχήματος με ανοιχτό πορτμπαγκάζ (PNG με διαφάνεια) σε SVG εικονίδια.
   python3 tools/img2trunk.py <png> <φάκελος εξόδου>
   Βγάζει: trunk_open_full.svg (λευκό γέμισμα + μαύρο περίγραμμα). Το μονόχρωμο εικονίδιο του κουμπιού γίνεται με tools/trunk_icon.py."""
import sys, json
from pathlib import Path
import numpy as np, cv2
from PIL import Image

src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
a = np.array(Image.open(src).convert("RGBA")); al = a[..., 3] > 128; g = a[..., :3].mean(axis=2)
H, W = al.shape
white = (al & (g >= 110)).astype(np.uint8) * 255
black = (al & (g < 110)).astype(np.uint8) * 255

def smooth(pts, closed=True):
    """Πολύγωνο → ομαλή καμπύλη (τετραγωνικά Bézier μέσω μέσων σημείων)."""
    n = len(pts)
    mid = lambda p, q: ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
    f = lambda p: f"{p[0]:.2f} {p[1]:.2f}"
    s = "M" + f(mid(pts[0], pts[1]))
    for i in range(1, n + (0 if not closed else 1)):
        p, q = pts[i % n], pts[(i + 1) % n]
        s += "Q" + f(p) + " " + f(mid(p, q))
    return s + ("Z" if closed else "")

def contour_path(mask, idx, eps, sc, ox, oy):
    cs, h = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    c = cs[idx]; ap = cv2.approxPolyDP(c, eps, True)[:, 0, :].astype(float)
    return smooth([((x - ox) * sc, (y - oy) * sc) for x, y in ap])

def pick(mask, bbox, tol=6):
    cs, h = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    for i, c in enumerate(cs):
        if h[0][i][3] < 0 and all(abs(u - v) <= tol for u, v in zip(cv2.boundingRect(c), bbox)): return i
    raise SystemExit(f"δεν βρέθηκε περίγραμμα {bbox}")

# ── πλήρες SVG (όπως το σχέδιο) ──
def trace_layer(mask, eps=1.6):
    cs, h = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE); d = []
    for c in cs:
        if cv2.contourArea(c) < 14: continue
        ap = cv2.approxPolyDP(c, eps, True)[:, 0, :].astype(float); d.append(smooth([(x, y) for x, y in ap]))
    return "".join(d)
full = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><path fill="#fff" fill-rule="evenodd" d="{trace_layer(white)}"/><path fill="#000" fill-rule="evenodd" d="{trace_layer(black)}"/></svg>'
(out / "trunk_open_full.svg").write_text(full)

print("OK trunk_open_full.svg")
