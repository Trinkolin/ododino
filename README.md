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
| `tools/fetch_osm.py` | télécharge les données OSM via Overpass |
| `tools/build.py` | assemble le site publiable dans `_site/` |
| `.github/workflows/site.yml` | mise à jour hebdomadaire et publication |

## Mettre à jour les données à la main
```
py tools/fetch_osm.py
```
Ce script régénère `data/*.geojson` : limites des communes, POI, sentiers balisés et chemins.
Si Overpass renvoie nettement moins d'éléments qu'avant (moins de 70 %), la mise à jour de ce fichier
est refusée, pour ne pas publier des données tronquées.

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

Données © contributeurs OpenStreetMap, licence ODbL : l'attribution doit rester visible.
