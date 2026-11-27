"""Accès à OpenStreetMap (API Overpass) et écriture prudente des données, partagés par les scripts.

- overpass(query) : requête avec essais répétés sur deux serveurs (Overpass est souvent surchargé) ;
- save_guarded(path, payload, count) : écrit un fichier de données, sauf si la nouvelle version compte
  nettement moins d'éléments que l'actuelle (réponse vide ou tronquée) : on garde alors l'ancienne.
"""
import json
import time
import urllib.parse
import urllib.request

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
UA = "ododino/0.3 (static site generator)"
MIN_RATIO = 0.7   # en dessous de 70 % des éléments actuels, la mise à jour est refusée


class GuardError(RuntimeError):
    """La nouvelle version d'un fichier de données a été refusée par le garde-fou."""


def overpass(query: str, attempts: int = 3) -> dict:
    body = urllib.parse.urlencode({"data": query}).encode()
    last = None
    for attempt in range(attempts):
        for url in ENDPOINTS:
            try:
                req = urllib.request.Request(url, data=body, headers={"User-Agent": UA, "Accept": "application/json"})
                with urllib.request.urlopen(req, timeout=240) as r:
                    return json.load(r)
            except Exception as e:  # noqa: BLE001 — réseau, HTTP, JSON : on réessaie
                last = e
                print(f"  ! {url}: {e}")
        if attempt < attempts - 1:
            time.sleep(10 * (attempt + 1))
    raise RuntimeError(f"Overpass injoignable : {last}")


def save_guarded(path, payload, count):
    """Écrit `payload` (JSON compact) dans `path`, sauf si count(payload) < 70 % de count(ancien fichier)."""
    if path.exists():
        try:
            before = count(json.loads(path.read_text(encoding="utf-8")))
        except (ValueError, KeyError, TypeError):
            before = 0  # fichier actuel illisible : on le remplace
        after = count(payload)
        if before and after < before * MIN_RATIO:
            raise GuardError(f"{path.name} : {after} éléments contre {before} avant, mise à jour refusée")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
