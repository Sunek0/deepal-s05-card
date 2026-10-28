#!/usr/bin/env python3
"""Εικονίδιο πορτμπαγκάζ (πλάγια όψη, ανοιχτό / κλειστό), ζωγραφισμένο πάνω στο σχέδιο που έδωσε ο χρήστης.
   python3 tools/trunk_icon.py <φάκελος εξόδου>  → trunk_open_icon.svg, trunk_closed_icon.svg και τα κομμάτια για src/00_head.js"""
import sys, json
from pathlib import Path
S = 0.02674      # κλίμακα: εικόνα 1496px → viewBox 40 μονάδες
SW = 34          # λεπτή γραμμή (σε px της εικόνας ≈ 0.9 μονάδες)
BODY_OPEN = ('M32 548V442Q34 408 92 388C170 362 262 338 336 314C420 252 480 214 560 190C650 164 800 162 1002 172'
             'L1012 180C1100 232 1200 268 1288 322Q1304 340 1312 372C1322 420 1322 480 1318 520L1300 546H1163'
             'A130 130 0 0 0 903 546H342A130 130 0 0 0 82 546Z')
GLASS = 'M482 316Q562 262 648 228H660V316ZM716 228H866Q934 244 976 292L716 312Z'
DOOR = 'M690 334Q696 430 692 505'
MIRROR = 'M404 296Q404 290 412 290H442Q458 290 458 304V324H404Z'
GATE = 'M1010 176L1180 22Q1330 -4 1476 62Q1468 100 1424 100L1290 100L1062 184ZM1120 160L1222 70Q1320 58 1400 84'
WHEELS = '<circle cx="212" cy="567" r="93"/><circle cx="1033" cy="565" r="94"/>'
HUBS = '<circle cx="212" cy="567" r="15" fill="currentColor" stroke="none"/><circle cx="1033" cy="565" r="15" fill="currentColor" stroke="none"/>'
def build(open_):
    p = f'<path d="{BODY_OPEN}"/><path d="{GLASS}"/><path d="{DOOR}"/>'
    if open_: p += f'<path d="{GATE}"/>'
    else: p += '<path d="M1012 184C1100 226 1196 262 1262 306"/>'
    return f'<g transform="scale({S})" stroke-width="{SW}">{p}{WHEELS}{HUBS}</g>'
if __name__ == "__main__":
    out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    vb = "-0.8 -0.8 41.6 19.8"  # περιθώριο ώστε να μη κόβονται οι ρόδες / η πόρτα
    for name, o in (("open", True), ("closed", False)):
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" color="#ffffff">{build(o)}</svg>'
        (out / f"trunk_{name}_icon.svg").write_text(svg)
    json.dump({"vb": vb, "open": build(True), "closed": build(False)}, open(out / "parts.json", "w"))
    print("OK", vb)
