"""tools/geo.py contre la fixture partagée (tests/geo-cases.json), la même que tests/geo.test.js.

Lancer :  py -m unittest discover -s tests
"""
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import geo  # noqa: E402

CASES = json.loads((ROOT / "tests" / "geo-cases.json").read_text(encoding="utf-8"))


class GeoCases(unittest.TestCase):
    def test_dist(self):
        for c in CASES["dist"]:
            self.assertAlmostEqual(geo.dist(c["a"], c["b"]), c["m"], places=3, msg=c)

    def test_walking_minutes(self):
        for c in CASES["walking_minutes"]:
            self.assertEqual(geo.walking_minutes(c["km"], c["gain"], c["loss"]), c["minutes"], msg=c)

    def test_stats(self):
        for c in CASES["stats"]:
            s = geo.stats(c["d"], c["e"])
            for k in ("gain", "loss", "min", "max", "km"):
                self.assertAlmostEqual(s[k], c[k], places=5, msg=(k, c))
            self.assertEqual(s["minutes"], c["minutes"], msg=c)

    def test_resample(self):
        for c in CASES["resample"]:
            pts, total = geo.resample(c["line"])
            self.assertEqual(len(pts), c["count"])
            self.assertAlmostEqual(total, c["total"], places=3)
            self.assertEqual(pts[-1][0], total)

    def test_downsample(self):
        for c in CASES["downsample"]:
            idx = geo.downsample(c["n"])
            self.assertEqual((len(idx), idx[-1]), (c["count"], c["last"]))


class Profile(unittest.TestCase):
    def test_constant_slope_matches_stats(self):
        # pente régulière de 10 % sur ~1 km : le profil doit retrouver ≈ 100 m de montée, aucune descente
        line = [(13.5, 46.2), (13.5, 46.209)]
        start = line[0]
        prof = geo.profile(line, lambda lon, lat: 500 + geo.dist(start, (lon, lat)) * 0.1)
        self.assertAlmostEqual(prof["gain"], 100, delta=3)
        self.assertEqual(prof["loss"], 0)
        self.assertEqual(prof["pr"]["d"][0], 0)

    def test_outside_dem_gives_none(self):
        self.assertIsNone(geo.profile([(0, 0), (0, 0.001)], lambda lon, lat: None))


if __name__ == "__main__":
    unittest.main()
