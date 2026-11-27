# Glossaire Ododino

Vocabulaire du projet, à utiliser tel quel dans le code, les commits et les discussions.

**Coquille** : les fichiers mis en cache dès la première visite pour que le site s'ouvre sans réseau
(pages, scripts, styles, polices, icônes, manifest, données de base : POI, sentiers, limites, date).
Environ 2 Mo. Rechargée chez les visiteurs à chaque changement de son contenu.
_À éviter_ : « app shell », « cache du site ».

**Pack hors ligne** : les fichiers téléchargés seulement à la demande du visiteur (bouton « Hors ligne »)
pour randonner sans réseau : fond vectoriel, relief ombré, graphe du traceur, profils, GPX, chemins.
Environ 27 Mo. Peut être mis à jour ou supprimé par le visiteur.
_À éviter_ : « offline pack », « téléchargement ».

**Inventaire du site** : la liste, produite par `tools/build.py`, de tous les fichiers publiés rangés en
catégories (coquille, pack hors ligne, publié seulement), avec la version de la coquille. C'est la seule
source que lisent le service worker et le bouton « Hors ligne ».
_À éviter_ : « manifest » (réservé à `manifest.webmanifest`), « liste des fichiers ».

**Publié seulement** : fichiers mis en ligne mais jamais mis en cache par le site (`sw.js`,
`offline-files.json`, `.nojekyll`).

**Fiche phare** : page éditoriale sur un lieu ou un sentier (une des 20 de PLAN.md), rédigée à partir de
sources citées, en 5 langues : `content/<fiche>/` (meta.json + it.md, sl.md, en.md, de.md, fr.md, et si possible
photo.jpg avec sa vignette thumb.jpg faite par `tools/make_thumbs.ps1`), listée dans l'onglet « Découvrir » et publiée
à l'adresse `/<langue>/<fiche>/`. Statut **brouillon** (non publiée) ou **relu** (publiée, après relecture
de la version française par l'auteur).
_À éviter_ : « article », « page lieu ».
