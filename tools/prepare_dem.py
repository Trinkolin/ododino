"""Prépare, une fois pour toutes, les altitudes de la zone à partir de Copernicus GLO-30.

Produit :
  - tools/dem/natisone_dem.bin.gz + .json : altitudes de la zone (int16, en décimètres),
    lues ensuite par tools/enrich_trails.py (pur Python, utilisable dans la GitHub Action) ;
  - tiles/hillshade/{z}/{x}/{y}.png : relief ombré transparent, zooms 10 à 14
    (le modèle fait 30 m : au-delà, Leaflet agrandit simplement les tuiles du zoom 14).

Les altitudes ne changent pas : ce script n'est PAS lancé chaque semaine.
Dépendances (environnement séparé) :  py -m venv .venv-dem
  .venv-dem/Scripts/python -m pip install numpy pillow tifffile imagecodecs
  .venv-dem/Scripts/python tools/prepare_dem.py

Altitudes : Copernicus DEM GLO-30, © DLR e.V. 2010-2014 et © Airbus Defence and Space GmbH 2014-2018,
fourni dans le cadre de COPERNICUS par l'Union européenne et l'ESA.
"""
import gzip
import json
import math
import urllib.request
from pathlib import Path

import numpy as np
import tifffile
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEM_DIR = ROOT / "tools" / "dem"
CACHE = DEM_DIR / "cache"
TILES = ROOT / "tiles" / "hillshade"

# Zone : les communes + environ 2 km de marge (Slovénie comprise)
SOUTH, NORTH, WEST, EAST = 46.03, 46.30, 13.35, 13.73
SRC = ("https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N46_00_E013_00_DEM/"
       "Copernicus_DSM_COG_10_N46_00_E013_00_DEM.tif")
CREDIT = ("Copernicus DEM GLO-30 © DLR e.V. 2010-2014 et © Airbus Defence and Space GmbH 2014-2018, "
          "fourni dans le cadre de COPERNICUS par l'Union européenne et l'ESA")
ZOOMS = range(10, 15)


def load_tile():
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / Path(SRC).name
    if not f.exists():
        print("Téléchargement du modèle Copernicus (≈ 44 Mo)…")
        urllib.request.urlretrieve(SRC, f)
    a = tifffile.imread(f).astype(np.float32)
    rows, cols = a.shape
    # Tuile 1°×1° : bords de pixel de N47 à N46, E13 à E14
    return a, 47.0, 13.0, 1.0 / rows, 1.0 / cols


def crop(a, north0, west0, dlat, dlon):
    r0, r1 = int((north0 - NORTH) / dlat), int(math.ceil((north0 - SOUTH) / dlat))
    c0, c1 = int((WEST - west0) / dlon), int(math.ceil((EAST - west0) / dlon))
    sub = a[r0:r1, c0:c1]
    # centre du premier pixel
    return sub, north0 - (r0 + 0.5) * dlat, west0 + (c0 + 0.5) * dlon


def save_dem(sub, north, west, dlat, dlon):
    DEM_DIR.mkdir(parents=True, exist_ok=True)
    dm = np.clip(np.round(sub * 10), -32768, 32767).astype("<i2")
    with gzip.open(DEM_DIR / "natisone_dem.bin.gz", "wb", compresslevel=9) as g:
        g.write(dm.tobytes())
    meta = {"north": north, "west": west, "dlat": dlat, "dlon": dlon, "rows": int(sub.shape[0]),
            "cols": int(sub.shape[1]), "scale": 0.1, "nodata": None, "credit": CREDIT,
            "note": "int16 little-endian, ligne par ligne du nord au sud, en décimètres"}
    (DEM_DIR / "natisone_dem.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Altitudes : {sub.shape[1]}×{sub.shape[0]} px, {sub.min():.0f}–{sub.max():.0f} m")


def hillshade(sub, lat_mid, dlat, dlon, az=315.0, alt=45.0):
    dy = dlat * 111_320.0
    dx = dlon * 111_320.0 * math.cos(math.radians(lat_mid))
    gy, gx = np.gradient(sub, dy, dx)  # gy : vers le sud (lignes descendantes)
    slope = np.arctan(np.hypot(gx, gy) * 1.3)  # léger renforcement du relief
    aspect = np.arctan2(-gx, gy)
    azr, altr = math.radians(az), math.radians(alt)
    return np.clip(np.sin(altr) * np.cos(slope) + np.cos(altr) * np.sin(slope) * np.cos(azr - aspect), 0, 1)


def tile_bounds(z, x, y):
    n = 2 ** z
    lon = lambda xx: xx / n * 360 - 180
    lat = lambda yy: math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * yy / n))))
    return lon(x), lat(y), lon(x + 1), lat(y + 1)


def deg2tile(lat, lon, z):
    n = 2 ** z
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
    return x, y


def write_tiles(shade, north, west, dlat, dlon):
    rows, cols = shade.shape
    flat = math.sin(math.radians(45))
    count = 0
    for z in ZOOMS:
        x0, y0 = deg2tile(NORTH, WEST, z)
        x1, y1 = deg2tile(SOUTH, EAST, z)
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                w, nlat, e, slat = tile_bounds(z, x, y)
                # centres des 256×256 pixels (projection Web Mercator)
                px = (np.arange(256) + 0.5) / 256
                lons = w + (e - w) * px
                n = 2 ** z
                ys = y + px
                lats = np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * ys / n))))
                fr = (north - lats)[:, None] / dlat + np.zeros((1, 256))
                fc = (lons - west)[None, :] / dlon + np.zeros((256, 1))
                inside = (fr >= 0) & (fr <= rows - 1) & (fc >= 0) & (fc <= cols - 1)
                if not inside.any():
                    continue
                r0 = np.clip(np.floor(fr).astype(int), 0, rows - 2)
                c0 = np.clip(np.floor(fc).astype(int), 0, cols - 2)
                tr, tc = fr - r0, fc - c0
                s = (shade[r0, c0] * (1 - tr) * (1 - tc) + shade[r0 + 1, c0] * tr * (1 - tc)
                     + shade[r0, c0 + 1] * (1 - tr) * tc + shade[r0 + 1, c0 + 1] * tr * tc)
                # ombres en noir, versants éclairés en blanc, terrain plat transparent
                dark = np.clip((flat - s) / flat, 0, 1)
                light = np.clip((s - flat) / (1 - flat), 0, 1)
                rgba = np.zeros((256, 256, 4), np.uint8)
                is_light = light > dark
                rgba[..., :3] = np.where(is_light[..., None], 255, 0)
                rgba[..., 3] = np.where(is_light, light * 90, dark * 170).astype(np.uint8)
                rgba[~inside] = 0
                out = TILES / str(z) / str(x)
                out.mkdir(parents=True, exist_ok=True)
                Image.fromarray(rgba, "RGBA").quantize(32).save(out / f"{y}.png", optimize=True)
                count += 1
    size = sum(p.stat().st_size for p in TILES.rglob("*.png")) / 1e6
    print(f"Relief ombré : {count} tuiles, {size:.1f} Mo")


def main():
    a, n0, w0, dlat, dlon = load_tile()
    sub, north, west = crop(a, n0, w0, dlat, dlon)
    save_dem(sub, north, west, dlat, dlon)
    write_tiles(hillshade(sub, (NORTH + SOUTH) / 2, dlat, dlon), north, west, dlat, dlon)


if __name__ == "__main__":
    main()
