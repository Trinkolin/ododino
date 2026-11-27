"""Complète les sentiers balisés avec altitudes, profils, statistiques et fichiers GPX.

Lancé après tools/fetch_osm.py (aussi dans la GitHub Action) — pur Python, sans dépendance.
Lit   : data/trails.geojson, data/pois.geojson, tools/dem/natisone_dem.*
Écrit : propriétés « stats » et « ordered » dans data/trails.geojson,
        data/profiles/<id>.json (profil allégé pour le graphique),
        data/gpx/<id>.gpx (tracé avec altitudes + points utiles à moins de 250 m).

Usage :  py tools/enrich_trails.py
"""
import json
from pathlib import Path
from xml.sax.saxutils import escape

import content
import geo
from geo import Dem, dist, resample

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

NEAR_M = 250         # rayon des points utiles ajoutés au GPX
SITE = content.SITE_URL
WPT_CATS = {"drinking", "hut", "peak"}


# ---------- Géométrie --------------------------------------------------------
def key(pt):
    return (round(pt[0], 5), round(pt[1], 5))


def order_parts(parts):
    """Remet les tronçons bout à bout. Renvoie (ligne unique, True) si le sentier forme
    une seule ligne continue, sinon (liste de segments fusionnés au mieux, False)."""
    uniq, seen = [], set()
    for p in parts:
        k = (key(p[0]), key(p[-1]), len(p))
        if k not in seen and (key(p[-1]), key(p[0]), len(p)) not in seen:
            seen.add(k)
            uniq.append(p)
    adj = {}
    for i, p in enumerate(uniq):
        for end in (key(p[0]), key(p[-1])):
            adj.setdefault(end, []).append(i)
    degrees = {n: len(v) for n, v in adj.items()}
    if uniq and max(degrees.values()) <= 2:
        ends = [n for n, d in degrees.items() if d == 1]
        if len(ends) in (0, 2):
            # départ : l'extrémité la plus proche du début du premier tronçon (ordre OSM = départ → arrivée)
            first = uniq[0][0]
            start = min(ends, key=lambda n: dist(n, first)) if ends else key(first)
            line, used, node = [], set(), start
            while True:
                nxt = [i for i in adj[node] if i not in used]
                if not nxt:
                    break
                i = nxt[0]
                used.add(i)
                p = uniq[i] if key(uniq[i][0]) == node else uniq[i][::-1]
                line.extend(p if not line else p[1:])
                node = key(p[-1])
            if len(used) == len(uniq):
                return line, True
    # Pas de ligne unique : on fusionne au mieux les tronçons consécutifs (ordre OSM)
    segs = []
    for p in uniq:
        if segs:
            last = segs[-1]
            for cand in (p, p[::-1]):
                if key(last[-1]) == key(cand[0]):
                    last.extend(cand[1:])
                    break
            else:
                segs.append(list(p))
        else:
            segs.append(list(p))
    return segs, False


# ---------- GPX --------------------------------------------------------------
WPT_TEXT = {
    "drinking": ("Drinking Water", "Acqua potabile segnalata da OSM, non verificata / "
                                   "Drinking water reported by OSM, not verified"),
    "hut": ("Lodge", "Rifugio o ricovero / Hut or shelter"),
    "peak": ("Summit", None),
}


def gpx(title, segments, dem, wpts, osm):
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<gpx version="1.1" creator="Ododino" xmlns="http://www.topografix.com/GPX/1/1">',
           "<metadata>",
           f"<name>{escape(title)}</name>",
           f'<link href="{SITE}"><text>Ododino</text></link>',
           "<desc>Tracciato indicativo / Indicative route. Dati © contributori OpenStreetMap (ODbL), "
           f"https://www.openstreetmap.org/{osm} ; altitudini Copernicus DEM GLO-30. "
           "Emergenza / Emergency: 112</desc>",
           "</metadata>"]
    for w in wpts:
        sym, desc = WPT_TEXT[w["cat"]]
        e = f"<ele>{w['ele']:.0f}</ele>" if w.get("ele") is not None else ""
        d = f"<desc>{escape(desc)}</desc>" if desc else ""
        out.append(f'<wpt lat="{w["lat"]:.5f}" lon="{w["lon"]:.5f}">{e}<name>{escape(w["name"])}</name>'
                   f"{d}<sym>{sym}</sym></wpt>")
    out.append(f"<trk><name>{escape(title)}</name>")
    for seg in segments:
        out.append("<trkseg>")
        for lon, lat in seg:
            e = dem.ele(lon, lat)
            out.append(f'<trkpt lat="{lat:.5f}" lon="{lon:.5f}">' + (f"<ele>{e:.0f}</ele>" if e is not None else "")
                       + "</trkpt>")
        out.append("</trkseg>")
    out += ["</trk>", "</gpx>", ""]
    return "\n".join(out)


def title_of(p):
    n = p.get("name") or (f"Sentiero CAI {p['ref']}" if p.get("ref", "")[:1].isdigit() else p.get("ref")) \
        or "Sentiero"
    return f"{p['ref']} · {n}" if p.get("ref") and p.get("name") else n


def main():
    dem = Dem()
    trails = json.loads((DATA / "trails.geojson").read_text(encoding="utf-8"))
    pois = [f for f in json.loads((DATA / "pois.geojson").read_text(encoding="utf-8"))["features"]
            if f["properties"]["cat"] in WPT_CATS]
    for d in ("profiles", "gpx"):
        (DATA / d).mkdir(exist_ok=True)
        for old in (DATA / d).iterdir():
            old.unlink()

    n_ok = 0
    for f in trails["features"]:
        p = f["properties"]
        rid = p["osm"].split("/")[1]
        line, ordered = order_parts(f["geometry"]["coordinates"])
        segments = [line] if ordered else line
        p["ordered"] = ordered
        p.pop("stats", None)

        # points utiles proches du tracé
        samples = [s for seg in segments for s in resample(seg)[0]]
        wpts = []
        for poi in pois:
            lon, lat = poi["geometry"]["coordinates"]
            near = any(abs(s[2] - lat) < 0.004 and dist((s[1], s[2]), (lon, lat)) <= NEAR_M for s in samples)
            if near:
                pp = poi["properties"]
                try:
                    ele = float(pp["ele"])          # altitude indiquée dans OSM (sommets)
                except (KeyError, ValueError):
                    ele = dem.ele(lon, lat)
                wpts.append({"cat": pp["cat"], "lon": lon, "lat": lat, "ele": ele,
                             "name": pp.get("name") or {"drinking": "Acqua / Water", "hut": "Ricovero / Shelter",
                                                        "peak": "Cima / Peak"}[pp["cat"]]})
        (DATA / "gpx" / f"{rid}.gpx").write_text(gpx(title_of(p), segments, dem, wpts, p["osm"]), encoding="utf-8")

        if not ordered:
            continue
        # profil, dénivelés, temps (uniquement pour une ligne continue) : tools/geo.py
        prof = geo.profile(line, dem.ele)
        if prof is None:  # sentier qui sort de la zone couverte par le modèle
            p["ordered"] = False
            continue
        p["stats"] = {"km": round(prof["km"], 2), "gain": round(prof["gain"]), "loss": round(prof["loss"]),
                      "min": round(prof["min"]), "max": round(prof["max"]), "minutes": prof["minutes"]}
        (DATA / "profiles" / f"{rid}.json").write_text(json.dumps(prof["pr"], separators=(",", ":")), encoding="utf-8")
        n_ok += 1

    (DATA / "trails.geojson").write_text(json.dumps(trails, ensure_ascii=False, separators=(",", ":")),
                                         encoding="utf-8")
    print(f"Sentiers : {len(trails['features'])} GPX, {n_ok} profils (lignes continues)")


if __name__ == "__main__":
    main()
