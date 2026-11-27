"""Génère le logo et les icônes d'Ododino : silhouette du Matajur au-dessus du Natisone.

Sorties : icons/logo.svg, icons/favicon.svg, icons/icon-192.png, icons/icon-512.png,
icons/icon-maskable-512.png (marge de sécurité Android), icons/apple-touch-icon.png (180 px).
Usage :  .venv-dem/Scripts/python tools/make_icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "icons"
GREEN, WHITE, RIVER = "#2f6f4f", "#ffffff", "#9fd3e6"

# Dessin dans une boîte 100×100 : profil du Matajur (sommet arrondi, épaulement du Glava à droite)
MOUNTAIN = [(4, 74), (16, 62), (27, 52), (37, 41), (44, 32), (49, 26), (53, 25), (57, 28), (63, 36),
            (69, 42), (75, 38), (79, 37), (84, 43), (90, 54), (96, 74)]
SNOW = [(44, 32), (49, 26), (53, 25), (57, 28), (61, 33), (56, 31), (52, 35), (48, 31)]
RIVER_PTS = [(6, 84), (20, 80), (34, 85), (50, 81), (66, 86), (80, 81), (94, 84)]


def svg(rounded=True):
    poly = lambda pts: " ".join(f"{x},{y}" for x, y in pts)
    river = "M" + " L".join(f"{x},{y}" for x, y in RIVER_PTS)
    bg = '<rect width="100" height="100" rx="22" fill="%s"/>' % GREEN if rounded else f'<rect width="100" height="100" fill="{GREEN}"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Ododino">
  {bg}
  <polygon points="{poly(MOUNTAIN)} 96,74 4,74" fill="{WHITE}"/>
  <polygon points="{poly(SNOW)}" fill="{GREEN}" fill-opacity=".18"/>
  <path d="{river}" fill="none" stroke="{RIVER}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
'''


def png(size, pad=0.0, rounded=True):
    s = size * 4  # sur-échantillonnage pour lisser les bords
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * .22), fill=GREEN)
    else:
        d.rectangle([0, 0, s, s], fill=GREEN)
    k, off = s * (1 - 2 * pad) / 100, s * pad
    tr = lambda pts: [(off + x * k, off + y * k) for x, y in pts]
    d.polygon(tr(MOUNTAIN), fill=WHITE)
    d.line(tr(RIVER_PTS), fill=RIVER, width=int(5 * k), joint="curve")
    for x, y in tr([RIVER_PTS[0], RIVER_PTS[-1]]):
        r = 2.5 * k
        d.ellipse([x - r, y - r, x + r, y + r], fill=RIVER)
    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(exist_ok=True)
    (OUT / "logo.svg").write_text(svg(), encoding="utf-8")
    (OUT / "favicon.svg").write_text(svg(), encoding="utf-8")
    png(192).save(OUT / "icon-192.png", optimize=True)
    png(512).save(OUT / "icon-512.png", optimize=True)
    png(512, pad=0.1, rounded=False).save(OUT / "icon-maskable-512.png", optimize=True)  # zone sûre Android
    png(180, rounded=False).convert("RGB").save(OUT / "apple-touch-icon.png", optimize=True)
    print("Icônes :", ", ".join(sorted(p.name for p in OUT.iterdir())))


if __name__ == "__main__":
    main()
