"""Garde-fou d'écriture des données (tools/osm.py) : une réponse Overpass tronquée ne doit jamais
remplacer de bonnes données. Lancer :  py -m unittest discover -s tests
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "tools"))
from osm import GuardError, save_guarded  # noqa: E402

COUNT = lambda d: len(d["features"])  # noqa: E731


class SaveGuarded(unittest.TestCase):
    def setUp(self):
        self.path = Path(tempfile.mkdtemp()) / "pois.geojson"
        save_guarded(self.path, {"features": list(range(100))}, COUNT)

    def read(self):
        return len(json.loads(self.path.read_text(encoding="utf-8"))["features"])

    def test_truncated_update_is_refused_and_old_data_kept(self):
        with self.assertRaises(GuardError):
            save_guarded(self.path, {"features": list(range(50))}, COUNT)
        self.assertEqual(self.read(), 100)

    def test_moderate_shrink_is_accepted(self):
        save_guarded(self.path, {"features": list(range(80))}, COUNT)
        self.assertEqual(self.read(), 80)

    def test_unreadable_current_file_is_replaced(self):
        self.path.write_text("pas du json", encoding="utf-8")
        save_guarded(self.path, {"features": [1]}, COUNT)
        self.assertEqual(self.read(), 1)

    def test_first_write_creates_folders(self):
        p = Path(tempfile.mkdtemp()) / "a" / "b.json"
        save_guarded(p, {"features": []}, COUNT)
        self.assertTrue(p.exists())


if __name__ == "__main__":
    unittest.main()
