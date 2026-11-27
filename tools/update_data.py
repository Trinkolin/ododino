"""Met à jour toutes les données d'Ododino, dans le bon ordre : c'est la seule commande à lancer
(à la main ou par la GitHub Action hebdomadaire).

  1. OpenStreetMap (fetch_osm)  : chaque jeu en échec garde sa version précédente ;
  2. sentiers (enrich_trails)   : TOUJOURS relancé après 1, car fetch_osm réécrit trails.geojson
                                  sans les profils ; un échec ici arrête tout (données incohérentes) ;
  3. graphe du traceur (build_graph) : en cas d'échec, l'ancien graphe est conservé.

Prérequis ponctuels (pas à chaque mise à jour) : tools/prepare_dem.py (altitudes), et de temps en
temps tools/extract_basemap.py (fond hors ligne).

Usage :  py tools/update_data.py [--skip-osm]
  --skip-osm : sans réseau : recalcule seulement profils, temps et GPX (graphe inchangé).
Code de sortie : 0 si les données publiées sont cohérentes (même si des jeux sont restés inchangés).
"""
import sys
import time

import build_graph
import enrich_trails
import fetch_osm
from osm import GuardError


def main(argv):
    t0 = time.time()
    report = []

    if "--skip-osm" in argv:
        report.append("OSM : non retéléchargé (--skip-osm)")
    else:
        print("== 1/3 OpenStreetMap ==")
        failed = fetch_osm.main()
        report.append(f"OSM : {'à jour' if not failed else 'inchangé pour ' + ', '.join(failed)}")

    print("== 2/3 Sentiers : profils, temps, GPX ==")
    enrich_trails.main()          # pas de rattrapage : sans lui, les fiches perdraient leurs profils
    report.append("sentiers : profils et GPX recalculés")

    print("== 3/3 Graphe du traceur ==")
    if "--skip-osm" in argv:   # le graphe se construit directement depuis OSM : rien à faire sans réseau
        report.append("graphe : inchangé (--skip-osm)")
    else:
        try:
            build_graph.main()
            report.append("graphe : à jour")
        except (GuardError, RuntimeError) as e:
            print(f"  ! graphe inchangé : {e}")
            report.append("graphe : inchangé (version précédente conservée)")

    print(f"\nTerminé en {time.time() - t0:.0f} s — " + " ; ".join(report))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
