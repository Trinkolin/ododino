# Ododino – plan du projet

Décisions prises le 22/11/2026.

## Vision
- **Public** : randonneurs et touristes qui préparent une sortie. 5 langues : IT, SL, EN, DE, FR.
- **Zone** : les 7 communes des Valli del Natisone (San Pietro al Natisone, San Leonardo, Savogna,
  Pulfero, Grimacco, Drenchia, Stregna). À Cividale : seulement accès, services et monuments majeurs.
  Les sentiers qui débordent en Slovénie restent affichés en entier, sans les POI slovènes.

## Données
- OpenStreetMap comme base, mise à jour automatique chaque semaine (GitHub Action).
- Catégories d'accès : parkings, arrêts de bus (lien vers les horaires TPL FVG), gare.

## Contenu éditorial
- ~20 lieux et sentiers phares : Claude propose la liste, l'auteur tranche.
- Claude rédige tout : italien d'abord, puis traduction vers les 4 autres langues.
  Uniquement des informations sourcées, sources listées dans chaque fiche.
- L'auteur relit la version française. Seules les fiches au statut « relu » sont publiées.
- Photos : celles de l'auteur, sinon Wikimedia Commons avec crédit.
- Une page par fiche phare et par langue (`/de/matajur`…), pour le référencement.

## Randonnée
- Fichier GPX et profil d'altitude intégrés dans la fiche de chaque sentier, relief ombré.
- Site installable (PWA) et utilisable hors connexion : POI, sentiers, position GPS, fond vectoriel
  maison (PMTiles généré depuis OSM). En ligne, le fond reste OpenTopoMap (dont la licence interdit
  le téléchargement en masse des tuiles).
- Avertissement de sécurité avec le 112, et un lien « Signaler une erreur » (note OSM) sur chaque fiche.

### Détail de l'étape 2 (décidé le 26/11/2026)
- Altitudes : Copernicus GLO-30 (30 m), une seule source des deux côtés de la frontière, crédit affiché.
- Sentiers en morceaux : tronçons remis en ordre automatiquement (départ → arrivée). S'il n'y a pas
  de ligne unique, le GPX est proposé en plusieurs segments, sans profil (« profil indisponible » expliqué).
- Fiche : profil interactif (point qui suit le survol sur la carte), dénivelés + et −, altitudes min/max,
  temps « indicatif » (4 km/h, 300 m/h en montée, 500 m/h en descente), ou la durée CAI si OSM la donne.
- Difficulté : la cotation CAI d'OSM, sinon le tronçon le plus dur, affiché « d'après les tronçons (SAC Tx) ».
- GPX : le tracé, plus les points utiles à moins de 250 m (eau potable avec « non vérifiée », abris,
  refuges, sommets).
- Relief ombré : calculé une fois, en couche optionnelle, réutilisé hors ligne à l'étape 3.

### Étape 2 bis : traceur d'itinéraire
- Calcul dans le navigateur sur nos données (sentiers, pistes, petites routes) : sans serveur ni service
  tiers, utilisable hors ligne. Zone = les communes plus une marge de 2 km, Slovénie comprise.
- Option « sentiers balisés uniquement ». Passages T4+ évités par défaut (option pour les autoriser),
  avertissement et tronçons colorés dès qu'un passage T3+ est emprunté.
- Profil, dénivelés et temps en direct, avec la même méthode que pour les sentiers.
- Tracé gardé dans le lien de la page (points de passage, recalculé à l'ouverture), export et import GPX,
  rien côté serveur.
- Mobile soigné : Annuler / Effacer, points déplaçables au doigt, profil repliable.

## Infrastructure
- Dépôt GitHub public `ododino`, publié sur GitHub Pages. La génération du site est faite par des scripts Python.
- Domaine `ododino.it` (sinon `ododino.eu`), avec `contact@ododino.it` redirigé vers la boîte de l'auteur.
- Statistiques GoatCounter (sans cookies) et une page « À propos et confidentialité ».
- Logo SVG (silhouette du Matajur) décliné en icône d'application, à valider par l'auteur.

**À faire par l'auteur** : créer le compte GitHub, acheter le domaine, créer le compte GoatCounter,
relire les fiches en français, valider le logo et la liste des lieux phares.

## Étapes
1. [ ] **Base en ligne** : dépôt, Pages, domaine, mise à jour hebdomadaire, Cividale, catégories
   d'accès, avertissement et signalement, GoatCounter, page « À propos ».
2. [ ] **Randonnée** : GPX, profil d'altitude, relief ombré.
   - [ ] **2 bis – Traceur d'itinéraire** : calcul dans le navigateur, export/import GPX, lien partageable.
3. [ ] **Hors ligne** : PWA, fond vectoriel, position GPS, logo et icône.
4. [ ] **Contenu** : liste des 20 lieux phares, puis rédaction, traduction, relecture et pages par langue.
