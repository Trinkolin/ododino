# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Ododino : carte des points d'intérêt et sentiers des Valli del Natisone (OpenStreetMap), en 5 langues
(it, sl, en, de, fr). Site 100 % statique, sans bundler ni npm : HTML/CSS/JS + Leaflet, outils en Python
stdlib. La documentation, les commits et le vocabulaire du projet sont en français ; utiliser les termes
de `GLOSSARY.md` tels quels (coquille, pack hors ligne, inventaire du site, fiche phare…). Décisions et
étapes : `PLAN.md`. Mode d'emploi détaillé : `README.md`.

## Commandes (Windows : `py`, pas `python`)

```
py tools/serve.py                     # dev, racine du dépôt → http://localhost:8765 (pas de service worker)
py tools/build.py                     # assemble _site/ ; échoue si un fichier chargé par une page est oublié
py tools/build.py --drafts            # idem avec les fiches au statut « brouillon »
py tools/serve.py 8766 _site          # site construit → http://localhost:8766 (service worker actif)
py -m unittest discover -s tests      # tests Python
node --test                           # tests JavaScript
py -m unittest tests.test_content     # un seul module Python ; node --test tests/router.test.js pour un seul fichier JS
py tools/update_data.py [--skip-osm]  # données OSM → profils/GPX → graphe du traceur (réseau : Overpass)
powershell -ExecutionPolicy Bypass -File tools/make_thumbs.ps1   # vignettes des fiches (après une photo)
```

Le serveur de dev n'a ni `data/featured.json` ni `data/cards.json` (générés par le build) : l'onglet
« Découvrir » y reste vide. Pour tester fiches, hors ligne ou mise en cache, construire et servir `_site/`.
Après un nouveau build, le service worker du navigateur sert d'abord l'ancienne version : recharger deux
fois, ou vider les caches/désinscrire le SW dans l'onglet de test.

## Architecture

**Pages et scripts.** `index.html` charge, dans cet ordre, des scripts classiques (IIFE, pas de modules) :
`i18n.js` → `geo.js` → `app.js` → `router.js` → `route.js` → `offline.js`. Ils communiquent par l'objet
global `window.Ododino` (alias `O`) et `window.I18N`, `window.OdoGeo`. `app.js` gère carte, onglets,
listes, favoris et tiroir mobile ; `route.js` l'affichage du traceur ; `router.js` est du calcul pur (A*,
règles de sécurité SAC T3/T4) testé sans navigateur. CSP stricte en `<meta>` : aucun script inline,
styles inline seulement sur `index.html` ; toute nouvelle origine externe doit y être ajoutée.
Tout est auto-hébergé (`vendor/`, `fonts/`) : pas de CDN.

**Calculs jumeaux.** `geo.js` (navigateur) et `tools/geo.py` (scripts) doivent rester identiques
(distance, rééchantillonnage, lissage, dénivelés, temps de marche DIN 33466). `tests/geo-cases.json`
les verrouille ensemble : modifier l'un impose de modifier l'autre.

**Traductions.** Toutes les chaînes sont dans `i18n.js` (5 langues, mêmes clés), y compris les textes
de la page de confidentialité et l'adresse de contact (`CONTACT`). `tests/i18n.test.js` échoue si une
langue manque une clé ou si une clé utilisée via `t('…')` / `data-i18n` n'existe pas (les clés passées
en variable, ex. `t(on ? 'a' : 'b')`, ne sont pas détectées).

**Build et hors ligne.** `tools/build.py` est le seul endroit qui connaît les fichiers publiés : listes
`SHELL` (coquille, mise en cache à la première visite), `PACK` (pack hors ligne, téléchargé à la demande
par `offline.js`) et `PUBLISHED_ONLY`. Un nouveau fichier chargé par une page doit y figurer, sinon le
build échoue. Le build ajoute une empreinte `?v=` aux scripts/styles de toutes les pages, écrit
l'inventaire dans `sw.js` (ligne `const SITE = …;`, ne pas éditer à la main) et une balise
`ododino-build` dans `index.html` : sans elle (dev), le service worker n'est pas enregistré.

**Données.** `data/*.geojson`, `data/graph.json`, `data/profiles/`, `data/gpx/`, `tiles/` sont générés :
ne pas les modifier à la main. `tools/osm.py` refuse d'écraser un jeu qui revient à moins de 70 % de sa
taille précédente. La GitHub Action (`.github/workflows/site.yml`) rafraîchit les données chaque lundi,
lance les tests, construit et publie sur GitHub Pages à chaque push sur `main` (actions figées par SHA).

**Fiches phares.** `content/<fiche>/` : `meta.json` + `it.md`… `fr.md` (en-tête `title`, `description`,
`alt` si photo ; Markdown réduit : `##`, listes `-`, gras, italique, liens `https://` ou vers une autre
fiche `../slug/`), `photo.jpg` et `thumb.jpg` facultatifs. `tools/content.py` génère `/<langue>/<fiche>/`,
`data/featured.json` (lien « Lire la fiche » sur la carte, par identifiant OSM), `data/cards.json`
(onglet « Découvrir ») et le sitemap. `meta.osm` désigne un lieu (`data/pois.geojson`), un sentier
(`data/trails.geojson`) ou est absent (fiche d'introduction) ; `also` ajoute d'autres points de la carte.
Seules les fiches `"status": "relu"` sont publiées ; une fiche publiée ne peut renvoyer qu'à des fiches
publiées (testé). L'adresse publique (`SITE_URL`, liens canoniques, sitemap, GPX) est définie une seule
fois dans `tools/content.py`.

## Règles du projet

- **Fiches :** uniquement des faits sourcés (sources listées dans `meta.json`, écarts et choix notés dans
  `_notes`) ; rédaction en italien d'abord, puis sl/en/de/fr ; l'auteur relit la version française avant
  de passer au statut `relu`. Photos : celles de l'auteur ou Wikimedia Commons avec auteur et licence ;
  pas de photo plutôt qu'une photo floue ou avec des personnes reconnaissables. Le château d'Ahrensperg
  (propriété privée) est exclu à la demande de l'auteur.
- **Vie privée :** tout ce qui est gardé dans le navigateur (`localStorage` : langue, avertissement de
  sécurité, favoris, pack hors ligne) doit être décrit dans le texte de confidentialité des 5 langues
  (`i18n.js`). Rien n'est envoyé hors statistiques GoatCounter sans cookies. Ne jamais mettre l'e-mail
  personnel de l'auteur dans le dépôt ; les commits utilisent l'adresse noreply GitHub.
- **Commits** en français, terminés par la ligne `Co-Authored-By` habituelle.

## État en cours

Le site est publié sur https://trinkolin.github.io/ododino/ (dépôt `Trinkolin/ododino`). Le commit
« Domaine ododino.com » (SITE_URL et contact passent à ododino.com) attend sur la branche locale
`domaine-ododino-com`, sans être poussé, tant que les DNS Namecheap ne pointent pas vers GitHub Pages
(étape 4 du README) ; il suffira alors de le reprendre sur `main` (`git cherry-pick`).

Décidé par l'auteur : réécriture du front en **Angular + Angular Material**, application installable, directement
sur `main`, fiches comprises (pré-rendues), avec le service worker d'Angular. Chaque push sur `main` publie le
site : ne pousser la version Angular qu'une fois au niveau de la version actuelle.
