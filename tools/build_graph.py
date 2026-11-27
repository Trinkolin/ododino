"""Construit le graphe de routage du traceur d'itinéraire : data/graph.json.

Chemins, pistes et petites routes OSM de la zone (communes + ~2 km de marge, Slovénie comprise),
découpés aux carrefours, avec l'altitude de chaque point (Copernicus GLO-30).
Lancé chaque semaine (voir tools/update_data.py) — pur Python, sans dépendance.

Format compact (entiers), lu par route.js :
  {"v": 1, "nodes": [lon5, lat5, ...],                       # carrefours, ×1e5
   "edges": [[a, b, cls, sac, marked, len_m, gain_ab, loss_ab, dlon, dlat, ele, dlon, dlat, ele, ...], ...]}
  - le tracé d'une arête part du nœud a : écarts successifs (×1e5) et altitude (m) de chaque point ;
  - cls : 0 sentier, 1 piste, 2 petite route, 3 route tertiaire, 4 route secondaire ;
  - sac : 0 inconnu, 1 à 6 = T1 à T6 ; marked : 1 si le tronçon fait partie d'un sentier balisé ;
  - gain_ab / loss_ab : somme brute entre sommets, sans lissage : sert seulement au COÛT du calcul
    d'itinéraire ; les chiffres affichés viennent de geo.js (même méthode que les fiches).

Usage :  py tools/build_graph.py
"""
from pathlib import Path

from geo import Dem, dist
from osm import overpass, save_guarded

DATA = Path(__file__).resolve().parent.parent / "data"
BBOX = "46.03,13.35,46.30,13.73"  # = zone couverte par le modèle d'altitude

CLS = {"path": 0, "footway": 0, "bridleway": 0, "steps": 0, "pedestrian": 0, "cycleway": 0,
       "track": 1, "residential": 2, "service": 2, "living_street": 2, "unclassified": 2,
       "tertiary": 3, "secondary": 4}
SAC = {"hiking": 1, "mountain_hiking": 2, "demanding_mountain_hiking": 3, "alpine_hiking": 4,
       "demanding_alpine_hiking": 5, "difficult_alpine_hiking": 6}

Q_WAYS = f"""[out:json][timeout:300];
way({BBOX})["highway"~"^({'|'.join(CLS)})$"]->.w;
.w out body;
.w >;
out skel qt;
"""
Q_MARKED = f"""[out:json][timeout:180];
rel({BBOX})["route"~"^(hiking|foot)$"];
way(r);
out ids;
"""


def walkable(t):
    if t.get("foot") == "no":
        return False
    if t.get("access") in ("private", "no") and t.get("foot") not in ("yes", "designated", "permissive"):
        return False
    if t.get("highway") == "service" and t.get("service") in ("driveway", "parking_aisle", "drive-through"):
        return False
    return t.get("area") != "yes"


def main():
    dem = Dem()
    data = overpass(Q_WAYS)
    marked = {e["id"] for e in overpass(Q_MARKED)["elements"] if e["type"] == "way"}
    coords = {e["id"]: (e["lon"], e["lat"]) for e in data["elements"] if e["type"] == "node"}
    ways = [e for e in data["elements"] if e["type"] == "way" and walkable(e.get("tags", {}))]

    # carrefours = extrémités des voies + nœuds partagés par plusieurs voies
    use = {}
    for w in ways:
        for n in w["nodes"]:
            use[n] = use.get(n, 0) + 1
    junction = set()
    for w in ways:
        junction.update((w["nodes"][0], w["nodes"][-1]))
    junction.update(n for n, c in use.items() if c > 1)

    node_idx, nodes, edges = {}, [], []
    dropped = 0

    def idx(n):
        if n not in node_idx:
            node_idx[n] = len(nodes) // 2
            lon, lat = coords[n]
            nodes.extend((round(lon * 1e5), round(lat * 1e5)))
        return node_idx[n]

    for w in ways:
        t = w["tags"]
        cls, sac, mk = CLS[t["highway"]], SAC.get(t.get("sac_scale"), 0), int(w["id"] in marked)
        seg = [w["nodes"][0]]
        for n in w["nodes"][1:]:
            seg.append(n)
            if n not in junction:
                continue
            ids, seg = seg, [n]
            pts = [coords.get(k) for k in ids]
            if None in pts or len(pts) < 2 or ids[0] == ids[-1] and len(ids) < 3:
                continue
            eles = [dem.ele(lon, lat) for lon, lat in pts]
            if None in eles:  # hors de la zone couverte par le modèle d'altitude
                dropped += 1
                continue
            length = sum(dist(a, b) for a, b in zip(pts, pts[1:]))
            gain = sum(max(0, b - a) for a, b in zip(eles, eles[1:]))
            loss = sum(max(0, a - b) for a, b in zip(eles, eles[1:]))
            e = [idx(ids[0]), idx(ids[-1]), cls, sac, mk, round(length), round(gain), round(loss)]
            px, py = round(pts[0][0] * 1e5), round(pts[0][1] * 1e5)
            e += [0, 0, round(eles[0])]
            for (lon, lat), el in zip(pts[1:], eles[1:]):
                x, y = round(lon * 1e5), round(lat * 1e5)
                e += [x - px, y - py, round(el)]
                px, py = x, y
            edges.append(e)

    out = DATA / "graph.json"
    save_guarded(out, {"v": 1, "nodes": nodes, "edges": edges}, lambda d: len(d["edges"]))
    km = sum(e[5] for e in edges) / 1000
    print(f"Graphe : {len(nodes) // 2} carrefours, {len(edges)} tronçons, {km:.0f} km, "
          f"{out.stat().st_size / 1e6:.1f} Mo ({dropped} hors zone ignorés)")


if __name__ == "__main__":
    main()
