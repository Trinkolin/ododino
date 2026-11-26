"""Assemble le site publiable dans _site/ (utilisé par la GitHub Action).

Usage :  python tools/build.py
Les étapes suivantes (pages par langue, tuiles hors ligne…) viendront s'ajouter ici.
"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_site"
FILES = ["index.html", "about.html", "style.css", "app.js", "about.js", "i18n.js"]
DIRS = ["data", "vendor", "fonts", "tiles"]


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    for f in FILES:
        shutil.copy2(ROOT / f, OUT / f)
    for d in DIRS:
        shutil.copytree(ROOT / d, OUT / d)
    (OUT / ".nojekyll").write_text("")  # GitHub Pages : servir les fichiers tels quels
    n = sum(1 for p in OUT.rglob("*") if p.is_file())
    print(f"_site/ prêt : {n} fichiers")


if __name__ == "__main__":
    main()
