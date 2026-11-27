"""Assemble le site publiable dans _site/ et produit l'inventaire du site (voir GLOSSARY.md).

Ce module est le seul à connaître les fichiers du site. Il les range en trois catégories :
  - coquille           : mise en cache dès la première visite (le site s'ouvre sans réseau) ;
  - pack hors ligne    : téléchargé à la demande (bouton « Hors ligne ») ;
  - publié seulement   : mis en ligne, jamais mis en cache par le site.
Seuls les fichiers déclarés ici sont publiés. Le build échoue, en nommant le fichier, si une page ou une
feuille de style référence un fichier absent de la coquille, ou si un fichier déclaré n'existe pas.

Sorties : _site/ ; inventaire écrit dans _site/sw.js (liste de la coquille + version) et dans
_site/offline-files.json (pack hors ligne).

Fiches phares : voir tools/content.py. Seules les fiches « relu » sont publiées ;
`--drafts` publie aussi les brouillons (marqués, non indexés) pour les relire en local.

Usage :  py tools/build.py [--drafts]
"""
import hashlib
import json
import posixpath
import re
import shutil
import sys
from html.parser import HTMLParser
from pathlib import Path

import content

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_site"

SHELL = [
    "index.html", "about.html", "style.css", "geo.js", "app.js", "router.js", "route.js", "offline.js", "about.js", "i18n.js",
    "manifest.webmanifest",
    "vendor/leaflet/leaflet.js", "vendor/leaflet/leaflet.css", "vendor/leaflet/images/*.png",
    "vendor/protomaps-leaflet/protomaps-leaflet.js", "vendor/goatcounter/count.js",
    "fonts/fonts.css", "fonts/*.woff2", "icons/*",
    "data/meta.json", "data/pois.geojson", "data/trails.geojson", "data/boundary.geojson",
]
PACK = [
    "data/paths.geojson", "data/graph.json", "data/profiles/*.json", "data/gpx/*.gpx",
    "tiles/basemap.pmtiles", "tiles/hillshade/**/*.png",
]
PUBLISHED_ONLY = ["sw.js", "vendor/*/LICENSE"]
PAGES = ["index.html", "about.html"]          # leurs références doivent toutes être dans la coquille
SW_INVENTORY = re.compile(r"^const SITE = .*;$", re.M)


class BuildError(Exception):
    pass


def expand(patterns, category):
    files = []
    for pat in patterns:
        found = sorted(p for p in ROOT.glob(pat) if p.is_file())
        if not found:
            raise BuildError(f"{category} : « {pat} » ne correspond à aucun fichier")
        files += [p.relative_to(ROOT).as_posix() for p in found]
    return list(dict.fromkeys(files))


class _Refs(HTMLParser):
    """Collecte ce qu'une page charge : src (scripts, images) et href des <link> (styles, icônes, manifest)."""
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("src"):
            self.refs.append(a["src"])
        if tag == "link" and a.get("href") and a.get("rel") != "alternate":
            self.refs.append(a["href"])


def local_refs(path):
    """Fichiers locaux chargés par une page HTML ou une feuille de style."""
    text = (ROOT / path).read_text(encoding="utf-8")
    if path.endswith(".css"):
        refs = re.findall(r"url\(\s*['\"]?([^'\")]+)", text)
    else:
        p = _Refs()
        p.feed(text)
        refs = p.refs
    base = Path(path).parent
    out = []
    for r in refs:
        if re.match(r"^(?:[a-z]+:|//|#|\?|data:)", r):
            continue  # externe, ancre, paramètre ou donnée intégrée
        out.append(posixpath.normpath((base / r.split("?")[0].split("#")[0]).as_posix()))
    return out


def check(shell):
    missing = []
    for page in PAGES + [f for f in shell if f.endswith(".css")]:
        for ref in local_refs(page):
            if ref not in shell:
                missing.append(f"{page} charge « {ref} », absent de la coquille")
    if missing:
        raise BuildError("\n  ".join(["fichiers oubliés :"] + missing))


def digest(files, base=ROOT):
    h = hashlib.sha1()
    for f in sorted(files):
        h.update(f.encode() + b"\0" + (base / f).read_bytes())
    return h.hexdigest()[:10]


def main(include_drafts=False):
    shell, pack, published = expand(SHELL, "coquille"), expand(PACK, "pack"), expand(PUBLISHED_ONLY, "publié")
    check(shell)

    if OUT.exists():
        shutil.rmtree(OUT)
    for f in shell + pack + published:
        (OUT / f).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / f, OUT / f)
    (OUT / ".nojekyll").write_text("")  # GitHub Pages : servir les fichiers tels quels

    # Fiches phares (content/) : pages /<langue>/<fiche>/, index lu par la carte, plan du site
    try:
        pages, featured, urls, cards = content.build(OUT, include_drafts)
    except content.ContentError as e:
        raise BuildError(f"fiches : {e}") from e
    (OUT / "data" / "featured.json").write_text(json.dumps(featured, ensure_ascii=False), encoding="utf-8")
    (OUT / "data" / "cards.json").write_text(json.dumps(cards, ensure_ascii=False), encoding="utf-8")
    # générés : ajoutés à la coquille (la carte et l'onglet « Découvrir » en ont besoin hors ligne)
    shell += ["data/featured.json", "data/cards.json"] + [p for p in pages if p.startswith("cards/")]
    home = [f"{content.SITE_URL}/?lang={l}" for l in content.LANGS]
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc></url>\n" for u in home + urls) + "</urlset>\n", encoding="utf-8")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {content.SITE_URL}/sitemap.xml\n",
                                    encoding="utf-8")

    # Empreinte dans l'adresse des scripts et styles de TOUTES les pages publiées (app.js?v=…, ../../style.css?v=…) :
    # un navigateur ou un service worker ne peut jamais mélanger un nouveau fichier avec un ancien gardé en cache.
    for name in PAGES + [f for f in pages if f.endswith(".html")]:
        page = OUT / name
        html = page.read_text(encoding="utf-8")
        here = posixpath.dirname(name)

        def stamp(m, here=here):
            target = posixpath.normpath(posixpath.join(here, m.group(2)))
            if target in shell and target.endswith((".js", ".css")):
                return f'{m.group(1)}="{m.group(2)}?v={digest([target])[:8]}"'
            return m.group(0)
        page.write_text(re.sub(r'\b(src|href)="([^"?#:]+)"', stamp, html), encoding="utf-8")

    # Inventaire → service worker : la liste de la coquille et sa version sont écrites dans sw.js lui-même,
    # pour que tout changement du site change sw.js (c'est ce que le navigateur surveille). La version est
    # l'empreinte des fichiers PUBLIÉS (après empreintes d'adresses), pas des sources : un changement du
    # build seul doit lui aussi déclencher la mise à jour chez les visiteurs.
    version = digest(shell, OUT)
    sw = (OUT / "sw.js").read_text(encoding="utf-8")
    site = json.dumps({"version": version, "shell": ["./"] + shell}, ensure_ascii=False)
    sw, n = SW_INVENTORY.subn(lambda _: f"const SITE = {site};", sw)
    if n != 1:
        raise BuildError("sw.js : ligne « const SITE = …; » introuvable (inventaire non écrit)")
    (OUT / "sw.js").write_text(sw, encoding="utf-8")

    # Marque « site construit » : active le service worker (absent en développement, voir offline.js)
    page = OUT / "index.html"
    html = page.read_text(encoding="utf-8")
    if "</head>" not in html:
        raise BuildError("index.html : </head> introuvable")
    marker = f'  <meta name="ododino-build" content="{version}">\n</head>'
    page.write_text(html.replace("</head>", marker, 1), encoding="utf-8")

    # Inventaire → pack hors ligne (lu par offline.js)
    entries = [[f, (ROOT / f).stat().st_size] for f in pack]
    total = sum(s for _, s in entries)
    (OUT / "offline-files.json").write_text(
        json.dumps({"version": digest(pack), "bytes": total, "files": entries}), encoding="utf-8")

    shell_mb = sum((OUT / f).stat().st_size for f in shell) / 1e6
    print(f"Coquille : {len(shell)} fichiers, {shell_mb:.1f} Mo (version {version})")
    print(f"Pack hors ligne : {len(entries)} fichiers, {total / 1e6:.1f} Mo")
    print(f"Fiches : {sum(p.endswith('index.html') for p in pages) // 5} ({sum(p.endswith('index.html') for p in pages)} pages{', brouillons inclus' if include_drafts else ''})")
    print(f"_site/ prêt : {sum(1 for p in OUT.rglob('*') if p.is_file())} fichiers")


if __name__ == "__main__":
    try:
        main(include_drafts="--drafts" in sys.argv[1:])
    except BuildError as e:
        print(f"ÉCHEC DU BUILD — {e}", file=sys.stderr)
        sys.exit(1)
