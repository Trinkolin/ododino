"""Export des fiches pour l'app Angular (tools/export_app.py) : une fiche par fichier, 5 langues, photos copiées,
liens entre fiches réécrits pour la base du site (<langue>/<fiche>/).
Lancer :  python -m unittest tests.test_export_app
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import content  # noqa: E402
import export_app  # noqa: E402


class ExportApp(unittest.TestCase):
    def test_export_complet(self):
        with tempfile.TemporaryDirectory() as tmp:
            site, fiches_dir = Path(tmp) / "site", Path(tmp) / "fiches"
            export_app.main(site, fiches_dir)
            index = json.loads((fiches_dir / "index.json").read_text(encoding="utf-8"))
            published = [f["slug"] for f in content.load()]
            self.assertEqual(index["slugs"], published)
            self.assertEqual(index["siteUrl"], content.SITE_URL)
            if index["intro"]:
                self.assertIn(index["intro"], published)
            labels = json.loads((fiches_dir / "labels.json").read_text(encoding="utf-8"))
            self.assertEqual(set(labels), set(content.LANGS))
            for slug in published:
                f = json.loads((fiches_dir / f"{slug}.json").read_text(encoding="utf-8"))
                self.assertEqual(set(f["texts"]), set(content.LANGS), slug)
                self.assertFalse(f["draft"], slug)
                for lang, t in f["texts"].items():
                    self.assertTrue(t["title"] and t["description"] and t["body"], f"{slug}/{lang}")
                    # plus aucun lien relatif « ../fiche/ » : il casserait sous <base href>
                    self.assertNotIn('href="../', t["body"], f"{slug}/{lang}")
                if f["photo"]:
                    self.assertTrue((site / f["photo"]["src"]).exists(), slug)
                    self.assertTrue(all(t["alt"] for t in f["texts"].values()), slug)

    def test_liens_entre_fiches(self):
        self.assertEqual(export_app._body("Voir [le Matajur](../matajur/).", "fr"),
                         '<p>Voir <a href="fr/matajur/">le Matajur</a>.</p>')


if __name__ == "__main__":
    unittest.main()
