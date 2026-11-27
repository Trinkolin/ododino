"""Calculs géographiques partagés par les scripts : altitudes, distances, profils, temps de marche.

Même interface et mêmes résultats que geo.js (navigateur) : les deux sont vérifiés par la même fixture,
tests/geo-cases.json (python -m unittest et node --test). Pur Python, sans dépendance.

Seule différence assumée entre les deux côtés : la source des altitudes. Ici, le modèle de terrain est lu
tous les STEP_M mètres (Dem.ele) ; dans le navigateur, le traceur interpole entre les sommets du graphe.
Tout le reste (distance, rééchantillonnage, lissage, dénivelés, temps) est identique.
"""
import array
import gzip
import json
import math
from pathlib import Path

DEM_DIR = Path(__file__).resolve().parent / "dem"
STEP_M = 20            # rééchantillonnage le long du tracé
SMOOTH = 5             # moyenne glissante (≈ 100 m) : le modèle à 30 m est bruité
PROFILE_POINTS = 300   # points gardés pour le graphique


class Dem:
    """Altitudes de la zone (Copernicus GLO-30), préparées par tools/prepare_dem.py."""

    def __init__(self, directory=DEM_DIR):
        meta_file = directory / "natisone_dem.json"
        if not meta_file.exists():
            raise FileNotFoundError(f"{meta_file} manquant : lancer d'abord tools/prepare_dem.py")
        self.__dict__.update(json.loads(meta_file.read_text(encoding="utf-8")))
        self.a = array.array("h")
        self.a.frombytes(gzip.decompress((directory / "natisone_dem.bin.gz").read_bytes()))
        if array.array("h", [1]).tobytes() != b"\x01\x00":  # machine gros-boutiste
            self.a.byteswap()

    def ele(self, lon, lat):
        """Altitude (m) par interpolation bilinéaire, None hors de la zone."""
        fr = (self.north - lat) / self.dlat
        fc = (lon - self.west) / self.dlon
        if not (0 <= fr <= self.rows - 1 and 0 <= fc <= self.cols - 1):
            return None
        r0, c0 = min(int(fr), self.rows - 2), min(int(fc), self.cols - 2)
        tr, tc = fr - r0, fc - c0
        a, w = self.a, self.cols
        v = (a[r0 * w + c0] * (1 - tr) * (1 - tc) + a[(r0 + 1) * w + c0] * tr * (1 - tc)
             + a[r0 * w + c0 + 1] * (1 - tr) * tc + a[(r0 + 1) * w + c0 + 1] * tr * tc)
        return v * self.scale


def dist(a, b):
    """Distance en mètres entre deux points (lon, lat) (haversine)."""
    p1, p2 = math.radians(a[1]), math.radians(b[1])
    dp, dl = p2 - p1, math.radians(b[0] - a[0])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371e3 * math.asin(math.sqrt(h))


def raw_minutes(km, gain, loss):
    """Temps de marche brut (min), méthode DIN 33466 : 4 km/h, 300 m/h en montée, 500 m/h en descente."""
    h = km / 4
    v = gain / 300 + loss / 500
    return (max(h, v) + min(h, v) / 2) * 60


def walking_minutes(km, gain, loss):
    """Temps affiché : arrondi à 5 min, jamais moins de 5 min (comme geo.js)."""
    return max(5, _round_half_up(raw_minutes(km, gain, loss) / 5) * 5)


def _round_half_up(x):
    # Math.round de JavaScript : 2.5 → 3 (le round() de Python arrondirait au pair, 2.5 → 2)
    return math.floor(x + 0.5)


def resample(line, step=STEP_M):
    """Points tous les `step` mètres le long de line [(lon, lat), …] : ([(d, lon, lat)], longueur)."""
    out, total = [(0.0, line[0][0], line[0][1])], 0.0
    nxt = step
    for a, b in zip(line, line[1:]):
        seg = dist(a, b)
        while seg > 0 and total + seg >= nxt:
            t = (nxt - total) / seg
            out.append((nxt, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
            nxt += step
        total += seg
    if out[-1][0] < total:
        out.append((total, line[-1][0], line[-1][1]))
    return out, total


def smooth(v, w=SMOOTH):
    """Moyenne glissante centrée sur `w` valeurs (fenêtre tronquée aux extrémités)."""
    h = w // 2
    return [sum(v[max(0, i - h):i + h + 1]) / len(v[max(0, i - h):i + h + 1]) for i in range(len(v))]


def stats(distances, elevations):
    """Statistiques d'une série d'altitudes rééchantillonnée (même résultat que OdoGeo.stats)."""
    e = smooth(elevations)
    gain = sum(max(0.0, b - a) for a, b in zip(e, e[1:]))
    loss = sum(max(0.0, a - b) for a, b in zip(e, e[1:]))
    km = distances[-1] / 1000
    return {"km": km, "gain": gain, "loss": loss, "min": min(e), "max": max(e),
            "minutes": walking_minutes(km, gain, loss), "smoothed": e}


def downsample(n, maximum=PROFILE_POINTS):
    """Indices gardés pour le graphique (au plus `maximum`, le dernier toujours inclus)."""
    k = max(1, math.ceil(n / maximum))
    idx = list(range(0, n, k))
    if idx[-1] != n - 1:
        idx.append(n - 1)
    return idx


def profile(line, ele_at):
    """Profil d'une ligne [(lon, lat), …] dont l'altitude est donnée par ele_at(lon, lat).
    Renvoie None si une altitude manque (tracé hors de la zone), sinon stats + points du graphique."""
    pts, total = resample(line)
    eles = [ele_at(lon, lat) for _, lon, lat in pts]
    if any(e is None for e in eles):
        return None
    s = stats([p[0] for p in pts], eles)
    idx = downsample(len(pts))
    return {**{k: v for k, v in s.items() if k != "smoothed"}, "total": total,
            "pr": {"d": [round(pts[i][0]) for i in idx], "e": [round(s["smoothed"][i]) for i in idx],
                   "lon": [round(pts[i][1], 5) for i in idx], "lat": [round(pts[i][2], 5) for i in idx]}}
