"""Télécharge les données OpenStreetMap des Valli del Natisone via l'API Overpass
et les convertit en GeoJSON compacts dans ../data/.

Usage :  py tools/fetch_osm.py   (d'habitude via tools/update_data.py, qui enchaîne la suite)
Données © contributeurs OpenStreetMap, licence ODbL.
"""
import json
import sys
import time
from pathlib import Path

from osm import overpass, save_guarded

DATA = Path(__file__).resolve().parent.parent / "data"

# Les 7 communes des Valli del Natisone (Benečija)
COMUNI = "San Pietro al Natisone|San Leonardo|Savogna|Pulfero|Grimacco|Drenchia|Stregna"
BBOX = "46.05,13.38,46.28,13.70"

# Cividale : porte d'entrée des vallées, on n'y garde qu'accès, services et monuments majeurs
CIVIDALE = "Cividale del Friuli"

AREA = f"""
rel({BBOX})["boundary"="administrative"]["admin_level"="8"]["name"~"^({COMUNI})"]->.comuni;
.comuni map_to_area->.a;
rel({BBOX})["boundary"="administrative"]["admin_level"="8"]["name"="{CIVIDALE}"]->.civ;
.civ map_to_area->.c;
"""

Q_BOUNDARY = f"[out:json][timeout:120];{AREA}(.comuni; .civ;); out geom;"

Q_POIS = f"""[out:json][timeout:180];{AREA}
(
  nwr["natural"~"^(peak|saddle|cave_entrance|spring|waterfall)$"]["name"](area.a);
  nwr["waterway"="waterfall"](area.a);
  nwr["natural"="spring"]["drinking_water"](area.a);
  nwr["tourism"~"^(viewpoint|attraction|museum|artwork|picnic_site|camp_site|alpine_hut|wilderness_hut|hotel|guest_house|apartment|chalet|hostel|information)$"](area.a);
  nwr["amenity"~"^(place_of_worship|restaurant|bar|cafe|pub|shelter|drinking_water|fountain)$"](area.a);
  nwr["historic"](area.a);
  nwr["leisure"="picnic_table"]["name"](area.a);
  // accès
  nwr["amenity"~"^(parking|bus_station)$"](area.a);
  node["highway"="bus_stop"](area.a);
  nwr["railway"~"^(station|halt)$"](area.a);
  // Cividale : accès, services, monuments majeurs (ceux qui ont une fiche Wikidata)
  nwr["railway"~"^(station|halt)$"](area.c);
  nwr["amenity"~"^(parking|bus_station)$"](area.c);
  nwr["tourism"="information"]["information"="office"](area.c);
  nwr["tourism"~"^(hotel|guest_house|hostel|camp_site)$"](area.c);
  nwr["historic"]["wikidata"](area.c);
  nwr["tourism"~"^(museum|attraction)$"]["wikidata"](area.c);
  nwr["amenity"="place_of_worship"]["wikidata"](area.c);
  nwr["man_made"="bridge"]["wikidata"](area.c);
  way["bridge"]["wikidata"](area.c);
);
out center tags;
"""

Q_ROUTES = f"""[out:json][timeout:180];{AREA}
rel["route"~"^(hiking|foot)$"](area.a)->.r;
.r out geom;
// difficulté de chaque tronçon (échelle SAC), pour estimer celle des sentiers sans cotation CAI
way(r.r)["sac_scale"];
out tags;
"""

Q_PATHS = f"""[out:json][timeout:180];{AREA}
way["highway"~"^(path|footway|track|bridleway|steps)$"](area.a);
out geom;
"""


def r5(x):
    return round(x, 5)


def line(geom):
    return [[r5(p["lon"]), r5(p["lat"])] for p in geom if p]


# ---- Eau potable ---------------------------------------------------------------
def potability(t: dict):
    """'yes', 'no' ou None (inconnu), d'après les seules déclarations OSM.
    Une mention explicite drinking_water=no l'emporte toujours."""
    dw = t.get("drinking_water")
    if dw == "no":
        return "no"
    if dw in ("yes", "treated") or (t.get("amenity") == "drinking_water" and dw is None):
        return "yes"
    return None


# ---- Catégories de POI -------------------------------------------------------
def categorize(t: dict):
    n, tour, am, hist = t.get("natural"), t.get("tourism"), t.get("amenity"), t.get("historic")
    if t.get("railway") in ("station", "halt"):
        return "train"
    if t.get("highway") == "bus_stop" or am == "bus_station":
        return "bus"
    if am == "parking":
        return "parking"
    if n == "peak":
        return "peak"
    if n == "saddle":
        return "saddle"
    if n == "cave_entrance":
        return "cave"
    if n == "waterfall" or t.get("waterway") == "waterfall":
        return "water"
    if n == "spring" or am in ("drinking_water", "fountain"):
        return "drinking" if potability(t) == "yes" else "water"
    if tour == "viewpoint":
        return "viewpoint"
    if am == "place_of_worship":
        return "church"
    if t.get("man_made") == "bridge" or (t.get("bridge") and t.get("wikidata")):
        return "history"
    if hist:
        if hist in ("wayside_shrine", "wayside_cross"):
            return "shrine"
        return "history"
    if tour in ("museum", "attraction", "artwork"):
        return "culture"
    if tour in ("alpine_hut", "wilderness_hut") or am == "shelter":
        return "hut"
    if tour in ("picnic_site", "camp_site") or t.get("leisure") == "picnic_table":
        return "outdoor"
    if am in ("restaurant", "bar", "cafe", "pub"):
        return "food"
    if tour in ("hotel", "guest_house", "apartment", "chalet", "hostel"):
        return "sleep"
    if tour == "information":
        return "info"
    return None


KEEP = ["name", "name:it", "name:sl", "name:en", "name:de", "name:fr", "ele", "description", "website", "url", "phone",
        "contact:phone", "contact:website", "opening_hours", "wikipedia", "wikidata",
        "religion", "historic", "tourism", "amenity", "natural", "cuisine", "drinking_water",
        "operator", "information", "image", "wheelchair", "start_date", "heritage", "denomination",
        "addr:street", "addr:place", "addr:city", "inscription", "memorial",
        "access", "fee", "capacity", "parking", "route_ref", "shelter", "bench",
        "check_date", "check_date:drinking_water", "seasonal", "waterway"]


def build_pois(data):
    feats, seen = [], set()
    for e in data["elements"]:
        t = e.get("tags", {})
        cat = categorize(t)
        if not cat:
            continue
        # Sans nom, on ne garde que ce qui reste utile au randonneur
        if cat == "parking" and t.get("access") in ("private", "no", "customers"):
            continue
        if not t.get("name"):
            # points d'eau sans nom : gardés dès qu'OSM se prononce sur la potabilité (oui ou non)
            if not (cat in ("shrine", "hut", "viewpoint", "parking", "bus", "train", "drinking")
                    or (cat == "water" and potability(t))):
                continue
        if "lat" in e:
            lon, lat = e["lon"], e["lat"]
        elif "center" in e:
            lon, lat = e["center"]["lon"], e["center"]["lat"]
        else:
            continue
        key = (e["type"], e["id"])
        if key in seen:
            continue
        seen.add(key)
        props = {k: t[k] for k in KEEP if k in t}
        props["cat"] = cat
        if cat in ("water", "drinking") and potability(t):
            props["potable"] = potability(t)
        props["osm"] = f"{e['type']}/{e['id']}"
        feats.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [r5(lon), r5(lat)]},
                      "properties": props})
    return feats


SAC_ORDER = ["hiking", "mountain_hiking", "demanding_mountain_hiking", "alpine_hiking",
             "demanding_alpine_hiking", "difficult_alpine_hiking"]


def build_routes(data):
    feats = []
    sac = {e["id"]: e["tags"]["sac_scale"] for e in data["elements"]
           if e["type"] == "way" and e.get("tags", {}).get("sac_scale") in SAC_ORDER}
    for e in data["elements"]:
        if e["type"] != "relation":
            continue
        t = e.get("tags", {})
        members = [m for m in e.get("members", []) if m["type"] == "way" and m.get("geometry")]
        parts = [line(m["geometry"]) for m in members]
        parts = [p for p in parts if len(p) > 1]
        if not parts:
            continue
        props = {k: t[k] for k in ("name", "ref", "network", "operator", "from", "to", "distance",
                                   "description", "osmc:symbol", "cai_scale", "website", "duration",
                                   "ascent", "descent", "roundtrip", "symbol") if k in t}
        props["osm"] = f"relation/{e['id']}"
        levels = [SAC_ORDER.index(sac[m["ref"]]) for m in members if m["ref"] in sac]
        if levels:
            props["sac_max"] = f"T{max(levels) + 1}"   # tronçon le plus difficile, échelle SAC T1–T6
        feats.append({"type": "Feature", "geometry": {"type": "MultiLineString", "coordinates": parts},
                      "properties": props})
    return feats


def build_paths(data):
    feats = []
    for e in data["elements"]:
        if e["type"] != "way" or not e.get("geometry"):
            continue
        t = e.get("tags", {})
        props = {"hw": t["highway"]}
        for k in ("name", "sac_scale", "trail_visibility", "surface", "tracktype"):
            if k in t:
                props[k] = t[k]
        feats.append({"type": "Feature", "geometry": {"type": "LineString", "coordinates": line(e["geometry"])},
                      "properties": props})
    return feats


def build_boundary(data):
    feats = []
    for e in data["elements"]:
        parts = [line(m["geometry"]) for m in e.get("members", [])
                 if m["type"] == "way" and m.get("role") in ("outer", "") and m.get("geometry")]
        t = e.get("tags", {})
        feats.append({"type": "Feature", "geometry": {"type": "MultiLineString", "coordinates": parts},
                      "properties": {"name": t.get("name"), "name:sl": t.get("name:sl"),
                                     "gateway": t.get("name") == CIVIDALE}})
    return feats


def save(name, feats):
    p = DATA / f"{name}.geojson"
    save_guarded(p, {"type": "FeatureCollection", "features": feats}, lambda d: len(d["features"]))
    print(f"  -> {p.name}: {len(feats)} éléments, {p.stat().st_size // 1024} Ko")


DATASETS = [("boundary", Q_BOUNDARY, build_boundary), ("pois", Q_POIS, build_pois),
            ("trails", Q_ROUTES, build_routes), ("paths", Q_PATHS, build_paths)]


def main():
    """Met à jour chaque jeu de données indépendamment ; renvoie la liste des jeux en échec
    (leur version précédente est conservée). La date de mise à jour n'avance que si tout a réussi."""
    failed = []
    for name, q, fn in DATASETS:
        print(f"Téléchargement : {name}…")
        try:
            save(name, fn(overpass(q)))
        except Exception as e:  # noqa: BLE001 — un jeu en échec ne bloque pas les autres
            print(f"  ! {name} inchangé : {e}")
            failed.append(name)
        time.sleep(2)
    if not failed:
        (DATA / "meta.json").write_text(json.dumps({"updated": time.strftime("%Y-%m-%d")}), encoding="utf-8")
    return failed


if __name__ == "__main__":
    sys.exit(1 if main() else 0)
