"""Données des fiches pour l'app Angular (web/) : data/featured.json (lien « Lire la fiche » par lieu OSM),
data/cards.json (onglet « Découvrir ») et les vignettes cards/<fiche>.jpg, écrits dans le dossier donné.

Même calcul que pour le site actuel (tools/content.py) ; seules les fiches « relu » sont exportées.
Usage : python tools/export_app.py web/.site [--drafts]
"""
import json
import shutil
import sys
import tempfile
from pathlib import Path

import content


def main(out, include_drafts=False):
    out = Path(out)
    with tempfile.TemporaryDirectory() as tmp:
        _, index, _, cards = content.build(Path(tmp), include_drafts)
        (out / "data").mkdir(parents=True, exist_ok=True)
        (out / "data" / "featured.json").write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
        (out / "data" / "cards.json").write_text(json.dumps(cards, ensure_ascii=False), encoding="utf-8")
        if (Path(tmp) / "cards").exists():
            shutil.copytree(Path(tmp) / "cards", out / "cards", dirs_exist_ok=True)
    print(f"Fiches pour l'app : {len(cards)}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    main(args[0] if args else "web/.site", "--drafts" in sys.argv)
