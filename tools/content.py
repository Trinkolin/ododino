"""Fiches phares : du dossier content/ aux pages publiées /<langue>/<fiche>/ (voir GLOSSARY.md).

Une fiche = un dossier content/<slug>/ avec :
  - meta.json  : statut (« brouillon » ou « relu »), lieu OSM, sentiers, photo et sa licence, sources ;
  - <langue>.md (it, sl, en, de, fr) : en-tête (title, description, alt) puis le texte.
Seules les fiches « relu » sont publiées. `py tools/build.py --drafts` publie aussi les brouillons,
marqués comme tels et exclus des moteurs de recherche, pour les relire en local.

Le texte suit un Markdown réduit : titres « ## », paragraphes, listes « - », **gras**, *italique*, [liens](https://…).
Tout le reste est affiché tel quel (échappé) : aucune balise HTML n'est acceptée dans le texte.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
LANGS = ["it", "sl", "en", "de", "fr"]
SITE_URL = "https://ododino.it"      # domaine prévu (PLAN.md) : sert aux liens absolus (hreflang, sitemap)
STATUSES = ("brouillon", "relu")


class ContentError(Exception):
    pass


# ---------- Lecture ----------
def _jpeg_size(path):
    """(largeur, hauteur) d'un JPEG, lue dans son en-tête, pour réserver la place de l'image dans la page."""
    b = path.read_bytes()
    if b[:2] != b"\xff\xd8":
        raise ContentError(f"{path} : la photo doit être un JPEG")
    i = 2
    while i + 9 < len(b):
        marker, length = b[i + 1], int.from_bytes(b[i + 2:i + 4], "big")
        if marker in (0xC0, 0xC1, 0xC2):
            return int.from_bytes(b[i + 7:i + 9], "big"), int.from_bytes(b[i + 5:i + 7], "big")
        i += 2 + length
    raise ContentError(f"{path} : dimensions introuvables")


def _front_matter(text, where):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text.replace("\r\n", "\n"), re.S)
    if not m:
        raise ContentError(f"{where} : en-tête « --- … --- » manquant")
    head = {}
    for line in m.group(1).splitlines():
        if line.strip():
            k, _, v = line.partition(":")
            head[k.strip()] = v.strip()
    for k in ("title", "description"):
        if not head.get(k):
            raise ContentError(f"{where} : « {k} » manquant dans l'en-tête")
    return head, m.group(2).strip()


def load(include_drafts=False):
    """Fiches à publier, triées par slug : [{slug, meta, texts: {langue: (en-tête, corps)}}]."""
    fiches = []
    for d in sorted(p for p in CONTENT.iterdir() if (p / "meta.json").exists()) if CONTENT.exists() else []:
        meta = json.loads((d / "meta.json").read_text(encoding="utf-8"))
        if meta.get("status") not in STATUSES:
            raise ContentError(f"{d.name}/meta.json : statut « {meta.get('status')} » inconnu ({' ou '.join(STATUSES)})")
        if meta["status"] != "relu" and not include_drafts:
            continue
        texts = {}
        for lang in LANGS:
            f = d / f"{lang}.md"
            if not f.exists():
                raise ContentError(f"{d.name} : traduction « {lang}.md » manquante")
            texts[lang] = _front_matter(f.read_text(encoding="utf-8"), f"{d.name}/{lang}.md")
        photo = meta.get("photo")  # facultative : une fiche sans photo libre de droits reste publiable
        if photo:
            if not (d / photo["file"]).exists():
                raise ContentError(f"{d.name} : photo « {photo['file']} » introuvable")
            photo["size"] = _jpeg_size(d / photo["file"])
            for lang, (head, _) in texts.items():
                if not head.get("alt"):
                    raise ContentError(f"{d.name}/{lang}.md : « alt » (description de la photo) manquant")
        fiches.append({"slug": d.name, "dir": d, "meta": meta, "texts": texts})
    return fiches


# ---------- Markdown réduit ----------
def _inline(s):
    s = html.escape(s, quote=True)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])", r"<em>\1</em>", s)
    return re.sub(r"\[([^\]]+)\]\((https://[^)\s]+)\)", r'<a href="\2" rel="noopener">\1</a>', s)


def markdown(text):
    out, para, items = [], [], []

    def flush():
        if para:
            out.append(f"<p>{_inline(' '.join(para))}</p>")
            para.clear()
        if items:
            out.append("<ul>" + "".join(f"<li>{_inline(i)}</li>" for i in items) + "</ul>")
            items.clear()
    for line in text.splitlines():
        s = line.strip()
        if not s:
            flush()
        elif s.startswith("## "):
            flush()
            out.append(f"<h2>{_inline(s[3:])}</h2>")
        elif s.startswith("- "):
            if para:
                flush()
            items.append(s[2:])
        else:
            if items:
                flush()
            para.append(s)
    flush()
    return "\n".join(out)


# ---------- Pages ----------
def _fmt_minutes(m):
    return f"{m // 60} h {m % 60:02d}"


def _fmt_km(v, lang):
    s = f"{v:.1f}"
    return s if lang == "en" else s.replace(".", ",")


DATE_FORMATS = {"it": "{d}/{m}/{y}", "fr": "{d}/{m}/{y}", "en": "{d}/{m}/{y}", "de": "{d}.{m}.{y}", "sl": "{d}. {m}. {y}"}


def _fmt_date(iso, lang):
    y, m, d = iso.split("-")
    return DATE_FORMATS[lang].format(d=d, m=m, y=y)


def render(fiche, lang, labels, places, trails, draft):
    L, meta, slug = labels[lang], fiche["meta"], fiche["slug"]
    head, body = fiche["texts"][lang]
    e = lambda s: html.escape(str(s), quote=True)  # noqa: E731
    # Une fiche décrit un lieu (data/pois.geojson) ou un sentier (data/trails.geojson). Pour un sentier, la
    # carte s'ouvre sur le sentier, qui vient en tête de la liste « Sentiers », et on n'affiche pas de
    # coordonnées : le premier point du tracé OSM n'est pas toujours le départ (relation saisie à l'envers).
    if meta["osm"] in places:
        lon, lat = places[meta["osm"]]
        map_url = f"../../index.html?lang={lang}#poi={meta['osm']}"
        coords = [f"<dt>{e(L['coords'])}</dt><dd>{lat:.5f}, {lon:.5f}</dd>"]
        trail_ids = meta.get("trails", [])
    elif meta["osm"] in trails:
        map_url = f"../../index.html?lang={lang}#trail={meta['osm']}"
        coords = []
        trail_ids = [meta["osm"]] + [r for r in meta.get("trails", []) if r != meta["osm"]]
    else:
        raise ContentError(f"{slug} : « {meta['osm']} » absent de data/pois.geojson et de data/trails.geojson")
    alternates = "\n".join(
        f'  <link rel="alternate" hreflang="{l}" href="{SITE_URL}/{l}/{slug}/">' for l in LANGS)
    langs_nav = "".join(
        f'<a href="../../{l}/{slug}/" lang="{l}" class="{"on" if l == lang else ""}"'
        f'{" aria-current=\"page\"" if l == lang else ""}>{l.upper()}</a>' for l in LANGS)

    altitude = meta.get("facts", {}).get("altitude")  # facultative : sans intérêt pour une église de village
    rows = ([f"<dt>{e(L['altitude'])}</dt><dd>{e(altitude)} m</dd>"] if altitude is not None else []) + coords
    trail_items = []
    for rid in trail_ids:
        t = trails.get(rid)
        if not t:
            raise ContentError(f"{slug} : sentier « {rid} » absent de data/trails.geojson")
        if t.get("name"):
            name = (f"{t['ref']} · " if t.get("ref") else "") + t["name"]
        else:
            name = f"CAI {t['ref']}" if t.get("ref") else rid
            if t.get("from") and t.get("to"):  # deux tronçons « CAI SI » ne se distinguent que par leurs extrémités
                end = lambda s: re.sub(r"\s*\(quota [^)]*\)", "", s)  # noqa: E731 — « Topolò (quota 531 m) »
                name += f" ({end(t['from'])} → {end(t['to'])})"
        st = t.get("stats")
        # montée et descente : un sentier linéaire n'a pas le même dénivelé dans les deux sens
        facts = (f" — {_fmt_km(st['km'], lang)} km, +{st['gain']} m / −{st['loss']} m, "
                 f"{e(L['timeEst'])} {_fmt_minutes(st['minutes'])}") if st else ""
        hard = " ⚠ " + e(L["experts"]) if t.get("cai_scale") in ("EE", "EEA") else ""
        trail_items.append(f'<li><a href="../../index.html?lang={lang}#trail={rid}">{e(name)}</a>{facts}{hard}</li>')
    photo = meta.get("photo")
    hero = og_image = ""
    if photo:
        w, h = photo["size"]
        og_image = f'\n  <meta property="og:image" content="{SITE_URL}/{lang}/{slug}/{e(photo["file"])}">'
        hero = f"""<figure class="hero">
      <img src="{e(photo['file'])}" alt="{e(head['alt'])}" width="{w}" height="{h}">
      <figcaption>{e(L['photo'])} : <a href="{e(photo['source_url'])}" rel="noopener">{e(photo['author'])}</a>,
        <a href="{e(photo['license_url'])}" rel="noopener">{e(photo['license'])}</a></figcaption>
    </figure>"""
    sources = "".join(
        f'<li><a href="{e(s["url"])}" rel="noopener">{e(s["title"])}</a>'
        + (f" ({e(L['consulted'])} {_fmt_date(s['consulted'], lang)})" if s.get("consulted") else "") + "</li>"
        for s in meta["sources"])

    return f"""<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src https://ododino.goatcounter.com; object-src 'none'; base-uri 'self'; form-action 'none'">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>{e(head['title'])} · Ododino</title>
  <meta name="description" content="{e(head['description'])}">
  {'<meta name="robots" content="noindex">' if draft else ''}
  <link rel="canonical" href="{SITE_URL}/{lang}/{slug}/">
{alternates}
  <link rel="alternate" hreflang="x-default" href="{SITE_URL}/it/{slug}/">
  <meta property="og:title" content="{e(head['title'])} · Ododino">
  <meta property="og:description" content="{e(head['description'])}">{og_image}
  <link rel="icon" href="../../icons/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../fonts/fonts.css">
  <link rel="stylesheet" href="../../style.css">
</head>
<body class="page">
  <article class="about fiche">
    <header class="brand">
      <div>
        <p class="h1like"><a href="../../index.html?lang={lang}"><img src="../../icons/logo.svg" alt="" class="logo" width="28" height="28"> Ododino</a></p>
        <p class="sub">{e(L['subtitle'])}</p>
      </div>
      <nav class="langs" aria-label="{e(L['language'])}">{langs_nav}</nav>
    </header>
    {f'<p class="draft">{e(L["draft"])}</p>' if draft else ''}
    <p><a href="{map_url}">{e(L['viewOnMap'])}</a></p>
    <h1 class="title">{e(head['title'])}</h1>
    {hero}
    <aside class="facts">
      <h2>{e(L['practical'])}</h2>
      {f"<dl>{''.join(rows)}</dl>" if rows else ''}
      {f"<h3>{e(L['trails'])}</h3><ul>{''.join(trail_items)}</ul>" if trail_items else ''}
      <p><a href="{map_url}">{e(L['viewOnMap'])}</a></p>
    </aside>
    {markdown(body)}
    <p class="safety-note">{e(L['safety'])} <strong>112</strong></p>
    <h2>{e(L['sources'])}</h2>
    <ul class="sources">{sources}</ul>
    <p class="muted">{e(L['updated'])} {_fmt_date(meta['updated'], lang)}</p>
  </article>
  <script data-goatcounter="https://ododino.goatcounter.com/count" async src="../../vendor/goatcounter/count.js"></script>
</body>
</html>
"""


def _places_and_trails():
    pois = json.loads((ROOT / "data" / "pois.geojson").read_text(encoding="utf-8"))["features"]
    places = {f["properties"]["osm"]: tuple(f["geometry"]["coordinates"]) for f in pois}
    trails = {f["properties"]["osm"]: f["properties"]
              for f in json.loads((ROOT / "data" / "trails.geojson").read_text(encoding="utf-8"))["features"]}
    return places, trails


def build(out, include_drafts=False):
    """Écrit les pages dans `out`. Renvoie (fichiers écrits, index pour la carte, adresses du sitemap)."""
    labels = json.loads((CONTENT / "labels.json").read_text(encoding="utf-8"))
    places, trails = _places_and_trails()
    written, index, urls = [], {}, []
    for f in load(include_drafts):
        draft = f["meta"]["status"] != "relu"
        for lang in LANGS:
            d = out / lang / f["slug"]
            d.mkdir(parents=True, exist_ok=True)
            (d / "index.html").write_text(render(f, lang, labels, places, trails, draft), encoding="utf-8")
            written.append(f"{lang}/{f['slug']}/index.html")
            if f["meta"].get("photo"):
                name = f["meta"]["photo"]["file"]
                (d / name).write_bytes((f["dir"] / name).read_bytes())
                written.append(f"{lang}/{f['slug']}/{name}")
            if not draft:
                urls.append(f"{SITE_URL}/{lang}/{f['slug']}/")
        index[f["meta"]["osm"]] = {"slug": f["slug"], "titles": {l: f["texts"][l][0]["title"] for l in LANGS}}
    return written, index, urls
