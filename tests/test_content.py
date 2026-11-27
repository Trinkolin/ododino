"""Fiches phares (tools/content.py) : chaque fiche, brouillon compris, doit se charger et se rendre dans les
5 langues. Une erreur (traduction manquante, lieu ou sentier OSM disparu, photo absente) casse le test
au lieu de casser la mise en ligne.
Lancer :  python -m unittest discover -s tests
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import content  # noqa: E402


class Fiches(unittest.TestCase):
    def test_toutes_les_fiches_se_construisent(self):
        fiches = content.load(include_drafts=True)
        self.assertTrue(fiches)
        with tempfile.TemporaryDirectory() as tmp:
            written, index, _ = content.build(Path(tmp), include_drafts=True)
            for f in fiches:
                for lang in content.LANGS:
                    page = (Path(tmp) / lang / f["slug"] / "index.html").read_text(encoding="utf-8")
                    self.assertIn(f'<html lang="{lang}">', page)
                    self.assertEqual(bool(f["meta"].get("photo")), 'class="hero"' in page, f["slug"])
                self.assertIn(f["meta"]["osm"], index)

    def test_seules_les_fiches_relues_sont_publiees(self):
        publiees = {f["slug"] for f in content.load()}
        for d in content.CONTENT.iterdir():
            if (d / "meta.json").exists():
                statut = json.loads((d / "meta.json").read_text(encoding="utf-8"))["status"]
                self.assertEqual(d.name in publiees, statut == "relu", d.name)

    def test_taille_de_la_photo_lue_dans_le_jpeg(self):
        for f in content.load(include_drafts=True):
            if f["meta"].get("photo"):
                w, h = f["meta"]["photo"]["size"]
                self.assertTrue(200 < w <= 4000 and 200 < h <= 4000, (f["slug"], w, h))


class Markdown(unittest.TestCase):
    def test_titres_listes_liens_et_echappement(self):
        html = content.markdown("## Titre\n\nUn **gras**, un *italique* <b>\n\n- un\n- [lien](https://ex.org/a)")
        self.assertIn("<h2>Titre</h2>", html)
        self.assertIn("<strong>gras</strong>", html)
        self.assertIn("<em>italique</em>", html)
        self.assertIn("&lt;b&gt;", html)
        self.assertIn('<li><a href="https://ex.org/a" rel="noopener">lien</a></li>', html)

    def test_pas_de_lien_non_https(self):
        self.assertNotIn("<a ", content.markdown("[x](javascript:alert(1))"))


if __name__ == "__main__":
    unittest.main()
