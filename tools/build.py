"""Assemble le site publiable dans _site/ (utilisé par la GitHub Action).

Usage :  python tools/build.py
Les étapes suivantes (pages par langue, tuiles hors ligne…) viendront s'ajouter ici.
"""
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_site"
FILES = ["index.html", "about.html", "style.css", "app.js", "route.js", "offline.js", "about.js", "i18n.js",
         "sw.js", "manifest.webmanifest"]
DIRS = ["data", "vendor", "fonts", "tiles", "icons"]


def write_offline_list():
    """Liste du pack « Disponible hors ligne » (téléchargé à la demande par offline.js)."""
    files = []
    for pattern in ("data/graph.json", "data/profiles/*.json", "data/gpx/*.gpx",
                    "tiles/basemap.pmtiles", "tiles/hillshade/**/*.png"):
        files += sorted(OUT.glob(pattern))
    entries = [[p.relative_to(OUT).as_posix(), p.stat().st_size] for p in files if p.is_file()]
    total = sum(s for _, s in entries)
    version = hashlib.sha1(json.dumps(entries).encode()).hexdigest()[:10]
    (OUT / "offline-files.json").write_text(json.dumps({"version": version, "bytes": total, "files": entries}),
                                           encoding="utf-8")
    print(f"Pack hors ligne : {len(entries)} fichiers, {total / 1e6:.1f} Mo")


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    for f in FILES:
        shutil.copy2(ROOT / f, OUT / f)
    for d in DIRS:
        shutil.copytree(ROOT / d, OUT / d)
    (OUT / ".nojekyll").write_text("")  # GitHub Pages : servir les fichiers tels quels
    write_offline_list()
    # Service worker : nouvelle version à chaque changement du site, pour vider l'ancien cache proprement
    digest = hashlib.sha1(b"".join((OUT / f).read_bytes() for f in FILES if f != "sw.js")).hexdigest()[:10]
    sw = OUT / "sw.js"
    sw.write_text(sw.read_text(encoding="utf-8").replace("const VERSION = 'dev';", f"const VERSION = '{digest}';"),
                  encoding="utf-8")
    n = sum(1 for p in OUT.rglob("*") if p.is_file())
    print(f"_site/ prêt : {n} fichiers")


if __name__ == "__main__":
    main()
