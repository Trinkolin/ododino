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
                for osm in ([f["meta"]["osm"]] if f["meta"].get("osm") else []) + f["meta"].get("also", []):
                    self.assertEqual(index[osm]["slug"], f["slug"])

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
        self.assertNotIn("<a ", content.markdown("[x](../../etc/)"))

    def test_lien_vers_une_autre_fiche(self):
        self.assertIn('<a href="../matajur/">le Matajur</a>', content.markdown("[le Matajur](../matajur/)"))

    def test_les_liens_entre_fiches_menent_a_une_fiche(self):
        # une fiche publiée ne peut renvoyer qu'à une fiche publiée (un brouillon n'est pas en ligne)
        tous = {f["slug"] for f in content.load(include_drafts=True)}
        publies = {f["slug"] for f in content.load()}
        for f in content.load(include_drafts=True):
            cibles = publies if f["meta"]["status"] == "relu" else tous
            for lang, (_, body) in f["texts"].items():
                for target in __import__("re").findall(r"\]\(\.\./([a-z0-9-]+)/\)", body):
                    self.assertIn(target, cibles, f"{f['slug']}/{lang}.md → {target}")


if __name__ == "__main__":
    unittest.main()
