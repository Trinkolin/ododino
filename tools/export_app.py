"""Données des fiches pour l'app Angular (web/).

Écrit dans le dossier du site (web/.site) : data/featured.json (lien « Lire la fiche » par lieu OSM),
data/cards.json (onglet « Découvrir »), les vignettes cards/<fiche>.jpg et les photos cards/photos/<fiche>.jpg.
Écrit dans le dossier des fiches (web/src/app/cards/generated) : une fiche par fichier <fiche>.json (5 langues,
texte déjà converti en HTML par le Markdown réduit de tools/content.py), index.json (fiches, fiche d'introduction,
adresse publique) et labels.json (libellés des pages de fiche, copie de content/labels.json).

Même calcul et mêmes contrôles que pour le site actuel (tools/content.py) ; seules les fiches « relu » sont
exportées, sauf avec --drafts.
Usage : python tools/export_app.py web/.site web/src/app/cards/generated [--drafts]
"""
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

import content


def _trail_name(rid, t):
    """Même nom que sur la page de fiche actuelle (content.render)."""
    if t.get("name"):
        return (f"{t['ref']} · " if t.get("ref") else "") + t["name"]
    name = f"CAI {t['ref']}" if t.get("ref") else rid
    if t.get("from") and t.get("to"):  # deux tronçons « CAI SI » ne se distinguent que par leurs extrémités
        end = lambda s: re.sub(r"\s*\(quota [^)]*\)", "", s)  # noqa: E731
        name += f" ({end(t['from'])} → {end(t['to'])})"
    return name


def _body(text, lang):
    """Texte de la fiche en HTML ; les liens vers une autre fiche (../slug/) deviennent <langue>/<slug>/,
    relatifs à la base du site (<base href>), ce qui marche aussi sans JavaScript."""
    return re.sub(r'href="\.\./([a-z0-9-]+)/"', rf'href="{lang}/\1/"', content.markdown(text))


def fiche_data(f, places, trails):
    meta, slug = f["meta"], f["slug"]
    osm = meta.get("osm")
    if osm and osm not in places and osm not in trails:
        raise content.ContentError(f"{slug} : « {osm} » absent de data/pois.geojson et de data/trails.geojson")
    kind = "intro" if not osm else "place" if osm in places else "trail"
    # pour un sentier décrit par la fiche, il vient en tête de la liste
    trail_ids = ([osm] if kind == "trail" else []) + [r for r in meta.get("trails", []) if r != osm]
    trail_list = []
    for rid in trail_ids:
        t = trails.get(rid)
        if not t:
            raise content.ContentError(f"{slug} : sentier « {rid} » absent de data/trails.geojson")
        st = t.get("stats") or {}
        trail_list.append({"id": rid, "name": _trail_name(rid, t), "km": st.get("km"), "gain": st.get("gain"),
                           "loss": st.get("loss"), "minutes": st.get("minutes"),
                           "experts": t.get("cai_scale") in ("EE", "EEA")})
    photo = meta.get("photo")
    return {
        "slug": slug, "draft": meta["status"] != "relu", "kind": kind, "osm": osm,
        "lonLat": list(places[osm]) if kind == "place" else None,
        "altitude": meta.get("facts", {}).get("altitude"),
        "photo": {"src": f"cards/photos/{slug}.jpg", "width": photo["size"][0], "height": photo["size"][1],
                  "author": photo["author"], "license": photo["license"], "licenseUrl": photo["license_url"],
                  "sourceUrl": photo["source_url"]} if photo else None,
        "trails": trail_list,
        "sources": [{"title": s["title"], "url": s["url"], "consulted": s.get("consulted")} for s in meta["sources"]],
        "updated": meta["updated"],
        "texts": {lang: {"title": head["title"], "description": head["description"], "alt": head.get("alt", ""),
                         "body": _body(body, lang)} for lang, (head, body) in f["texts"].items()},
    }


def main(site, fiches_dir, include_drafts=False):
    site, fiches_dir = Path(site), Path(fiches_dir)
    with tempfile.TemporaryDirectory() as tmp:
        _, index, _, cards = content.build(Path(tmp), include_drafts)  # mêmes contrôles que le site actuel
        (site / "data").mkdir(parents=True, exist_ok=True)
        (site / "data" / "featured.json").write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
        (site / "data" / "cards.json").write_text(json.dumps(cards, ensure_ascii=False), encoding="utf-8")
        if (Path(tmp) / "cards").exists():
            shutil.copytree(Path(tmp) / "cards", site / "cards", dirs_exist_ok=True)

    places, trails = content._places_and_trails()
    fiches = content.load(include_drafts)
    shutil.rmtree(fiches_dir, ignore_errors=True)
    fiches_dir.mkdir(parents=True)
    (site / "cards" / "photos").mkdir(parents=True, exist_ok=True)
    for f in fiches:
        data = fiche_data(f, places, trails)
        (fiches_dir / f"{f['slug']}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        if f["meta"].get("photo"):
            shutil.copyfile(f["dir"] / f["meta"]["photo"]["file"], site / "cards" / "photos" / f"{f['slug']}.jpg")
    intro = next((f["slug"] for f in fiches if not f["meta"].get("osm")), None)
    (fiches_dir / "index.json").write_text(json.dumps(
        {"slugs": [f["slug"] for f in fiches], "intro": intro, "siteUrl": content.SITE_URL}, ensure_ascii=False),
        encoding="utf-8")
    shutil.copyfile(content.CONTENT / "labels.json", fiches_dir / "labels.json")
    print(f"Fiches pour l'app : {len(fiches)}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    main(args[0] if args else "web/.site", args[1] if len(args) > 1 else "web/src/app/cards/generated",
         "--drafts" in sys.argv)
