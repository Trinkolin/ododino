# Ododino – Valli del Natisone

Carte des points d'intérêt et des sentiers de randonnée des Valli del Natisone (Benečija),
d'après OpenStreetMap, en 5 langues (IT, SL, EN, DE, FR). Le site est entièrement statique
(HTML/CSS/JS + Leaflet). Voir [PLAN.md](PLAN.md) pour les décisions et les étapes.

## Lancer en local
Double-cliquer sur `lancer.bat`, ou :
```
py -m http.server 8765
```
puis ouvrir http://localhost:8765. Un serveur est nécessaire, car `fetch` ne marche pas en `file://`.

## Structure
| Fichier | Rôle |
|---|---|
| `index.html`, `app.js`, `style.css` | la carte |
| `about.html` | page « À propos et confidentialité » |
| `i18n.js` | toutes les traductions, la détection de langue et l'adresse de contact |
| `data/*.geojson` | données OSM générées (ne pas modifier à la main) |
| `vendor/`, `fonts/` | Leaflet et polices auto-hébergés, sans appel à un CDN ni à Google |
| `data/profiles/`, `data/gpx/` | profils d'altitude et GPX des sentiers (générés) |
| `tiles/hillshade/` | relief ombré (généré une fois) |
| `tools/fetch_osm.py` | télécharge les données OSM via Overpass |
| `tools/enrich_trails.py` | ordre des tronçons, altitudes, dénivelés, temps, profils et GPX |
| `tools/prepare_dem.py` | prépare une fois les altitudes Copernicus et le relief ombré |
| `tools/dem/` | altitudes de la zone (2 Mo), lues par `enrich_trails.py` |
| `tools/build.py` | assemble le site publiable dans `_site/` |
| `.github/workflows/site.yml` | mise à jour hebdomadaire et publication |

## Mettre à jour les données à la main
```
py tools/fetch_osm.py
py tools/enrich_trails.py
```
Le premier script régénère `data/*.geojson` : limites des communes, POI, sentiers balisés et chemins.
Si Overpass renvoie nettement moins d'éléments qu'avant (moins de 70 %), la mise à jour de ce fichier
est refusée, pour ne pas publier des données tronquées. Le second **doit toujours suivre** : il ajoute
profils, dénivelés, temps et GPX aux sentiers (sans lui, les fiches affichent « profil indisponible »).

Les altitudes (Copernicus GLO-30) et le relief ombré ne changent pas : `tools/prepare_dem.py` n'est à
relancer que pour agrandir la zone. Il demande numpy, Pillow, tifffile et imagecodecs, dans un
environnement séparé (voir l'en-tête du script).

## Mise en ligne (à faire une fois)
1. **GitHub** : créer un compte, puis un dépôt **public** nommé `ododino`, et y pousser ce dossier.
2. Dans le dépôt : *Settings → Pages → Build and deployment → Source* : **GitHub Actions**.
3. Le site est publié à chaque `push` sur `main`, et les données OSM sont rafraîchies chaque lundi.
   Pour forcer une mise à jour : onglet *Actions → Site → Run workflow*.
4. **Domaine** : acheter `ododino.it` (sinon `ododino.eu`), puis :
   - chez le registrar, ajouter les enregistrements DNS de GitHub Pages : `A` vers 185.199.108.153,
     185.199.109.153, 185.199.110.153 et 185.199.111.153, plus `CNAME www` vers `<compte>.github.io` ;
   - dans *Settings → Pages → Custom domain*, saisir `ododino.it`, puis cocher *Enforce HTTPS*.
5. **E-mail** : rediriger `contact@ododino.it` vers votre boîte, via le registrar ou Cloudflare Email Routing.
   L'adresse affichée sur le site se modifie dans `i18n.js` (`CONTACT`).
6. **Statistiques** : créer un compte gratuit sur goatcounter.com avec le code `ododino`.
   Si ce code est pris, remplacer `ododino.goatcounter.com` dans `index.html` et `about.html`.
   Les visites depuis `localhost` ne sont pas comptées.

## Sécurité
**Déjà dans le code**
- Liens venant d'OSM filtrés : seuls les liens `http(s)` sont acceptés, donc pas de `javascript:` ;
  le code langue Wikipédia est vérifié. Tout le texte OSM est échappé avant affichage.
- Politique de sécurité du contenu (CSP) dans `index.html` et `about.html` : seuls les scripts du site
  s'exécutent ; les images sont limitées aux 4 fonds de carte. Si vous ajoutez un fond de carte,
  ajoutez son domaine à `img-src`.
- Aucun script ni police chargé depuis un autre site (Leaflet, polices et GoatCounter sont dans `vendor/` et `fonts/`).
- GitHub Action : actions figées sur un commit, droits minimaux par job, Dependabot pour les mises à jour.

**À faire sur vos comptes** (c'est là que se trouve le vrai risque)
- [ ] GitHub : double authentification (2FA).
- [ ] GitHub : *Settings → Branches* pour protéger `main` (pas de force-push ni de suppression).
- [ ] GitHub : *Settings → Pages* pour vérifier le domaine (protège contre sa réutilisation) et cocher *Enforce HTTPS*.
- [ ] Registrar : 2FA et verrouillage du domaine contre les transferts (« transfer lock »).
- [ ] DNS : enregistrement `CAA 0 issue "letsencrypt.org"` (seul le certificat de GitHub Pages pourra être délivré).
- [ ] E-mail : enregistrements SPF et DMARC (`v=DMARC1; p=reject`) pour empêcher les faux mails au nom de ododino.it.

Limite : GitHub Pages ne permet pas d'ajouter certains en-têtes de sécurité (par exemple celui qui interdit
d'afficher le site dans le cadre d'un autre site). Le risque reste faible tant qu'il n'y a ni connexion
ni formulaire ; sinon, placer Cloudflare devant le site.

Données © contributeurs OpenStreetMap, licence ODbL : l'attribution doit rester visible.
