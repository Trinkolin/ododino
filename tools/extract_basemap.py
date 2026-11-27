"""Extrait le fond de carte vectoriel hors ligne de la zone : tiles/basemap.pmtiles.

Source : les constructions quotidiennes de Protomaps (OpenStreetMap, ODbL), lues à distance par
requêtes partielles (HTTP Range) : seules les tuiles de la zone sont téléchargées.
Comme le relief ombré, ce fond change peu : à relancer de temps en temps, pas chaque semaine.

Dépendance (environnement séparé, voir prepare_dem.py) :
  .venv-dem/Scripts/python -m pip install pmtiles
  .venv-dem/Scripts/python tools/extract_basemap.py [AAAAMMJJ]

Données © contributeurs OpenStreetMap (ODbL) ; schéma de tuiles Protomaps Basemaps.
"""
import json
import math
import sys
import urllib.request
from functools import lru_cache
from pathlib import Path

from pmtiles.reader import Reader
from pmtiles.tile import Compression, TileType, zxy_to_tileid
from pmtiles.writer import Writer

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "tiles" / "basemap.pmtiles"
SOUTH, NORTH, WEST, EAST = 46.03, 46.30, 13.35, 13.73   # même zone que le relief et le traceur
MIN_Z, MAX_Z = 8, 15
UA = "ododino/0.3 (offline extract of a small area)"


def latest_build():
    with urllib.request.urlopen(urllib.request.Request(
            "https://build-metadata.protomaps.dev/builds.json", headers={"User-Agent": UA}), timeout=60) as r:
        builds = json.load(r)
    # avant-dernière construction : la dernière peut être encore en cours de publication
    return builds[-2]["key"].removesuffix(".pmtiles")


def deg2tile(lat, lon, z):
    n = 2 ** z
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
    return x, y


def main():
    build = sys.argv[1] if len(sys.argv) > 1 else latest_build()
    url = f"https://build.protomaps.com/{build}.pmtiles"
    n_req = 0

    @lru_cache(maxsize=4096)   # en-tête et répertoires relus pour chaque tuile : on les garde
    def get_bytes(offset, length):
        nonlocal n_req
        n_req += 1
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Range": f"bytes={offset}-{offset + length - 1}"})
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read()

    src = Reader(get_bytes)
    head, meta = src.header(), src.metadata()
    tiles = []
    for z in range(MIN_Z, MAX_Z + 1):
        x0, y0 = deg2tile(NORTH, WEST, z)
        x1, y1 = deg2tile(SOUTH, EAST, z)
        tiles += [(z, x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]
    print(f"Construction {build} : {len(tiles)} tuiles à extraire (zooms {MIN_Z}–{MAX_Z})…")

    data = []
    for i, (z, x, y) in enumerate(tiles, 1):
        t = src.get(z, x, y)
        if t:
            data.append((zxy_to_tileid(z, x, y), t))
        if i % 200 == 0:
            print(f"  {i}/{len(tiles)}")
    data.sort()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "wb") as f:
        w = Writer(f)
        for tid, t in data:
            w.write_tile(tid, t)
        w.finalize({
            "tile_type": TileType.MVT, "tile_compression": head["tile_compression"],
            "min_zoom": MIN_Z, "max_zoom": MAX_Z,
            "min_lon_e7": int(WEST * 1e7), "min_lat_e7": int(SOUTH * 1e7),
            "max_lon_e7": int(EAST * 1e7), "max_lat_e7": int(NORTH * 1e7),
            "center_zoom": 12, "center_lon_e7": int((WEST + EAST) / 2 * 1e7),
            "center_lat_e7": int((SOUTH + NORTH) / 2 * 1e7),
        }, {**meta, "ododino": {"build": build, "bbox": [WEST, SOUTH, EAST, NORTH]}})
    assert head["tile_compression"] in (Compression.GZIP, Compression.NONE), head["tile_compression"]
    print(f"Fond hors ligne : {len(data)} tuiles, {OUT.stat().st_size / 1e6:.1f} Mo, {n_req} requêtes "
          f"(schéma {meta.get('version', '?')})")


if __name__ == "__main__":
    main()
