/* Ododino – calculs géographiques partagés par la carte et le traceur.
   Même interface et mêmes résultats que tools/geo.py : les deux sont vérifiés par la même fixture
   (tests/geo-cases.json, lancée par node --test et par python -m unittest).
   Script classique (window.OdoGeo dans le navigateur) et module CommonJS (pour les tests). */
(function (root) {
  'use strict';

  const STEP_M = 20;           // rééchantillonnage le long du tracé
  const SMOOTH = 5;            // moyenne glissante (≈ 100 m) : le modèle d'altitude à 30 m est bruité
  const PROFILE_POINTS = 300;  // points gardés pour le graphique

  /** Distance en mètres entre deux points [lon, lat] (haversine). */
  function dist(a, b) {
    const p1 = a[1] * Math.PI / 180, p2 = b[1] * Math.PI / 180;
    const dp = p2 - p1, dl = (b[0] - a[0]) * Math.PI / 180;
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * 6371e3 * Math.asin(Math.sqrt(h));
  }

  /** Temps de marche brut en minutes, méthode des clubs alpins (DIN 33466) :
      4 km/h à plat, 300 m/h en montée, 500 m/h en descente. Sert aussi de coût au traceur. */
  function rawMinutes(km, gain, loss) {
    const h = km / 4, v = gain / 300 + loss / 500;
    return (Math.max(h, v) + Math.min(h, v) / 2) * 60;
  }

  /** Temps affiché : arrondi à 5 min, jamais moins de 5 min. */
  const walkingMinutes = (km, gain, loss) => Math.max(5, Math.round(rawMinutes(km, gain, loss) / 5) * 5);

  /** Points tous les STEP_M mètres le long de coords [[lon, lat, ele|null], …] ;
      l'altitude est interpolée entre les sommets. Renvoie { points: [[d, lon, lat, ele]], total }. */
  function resample(coords, step = STEP_M) {
    const pts = [[0, coords[0][0], coords[0][1], coords[0][2] ?? null]];
    let total = 0, next = step;
    for (let i = 1; i < coords.length; i++) {
      const a = coords[i - 1], b = coords[i], s = dist(a, b);
      while (s > 0 && total + s >= next) {
        const f = (next - total) / s;
        const ele = a[2] == null || b[2] == null ? null : a[2] + (b[2] - a[2]) * f;
        pts.push([next, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, ele]);
        next += step;
      }
      total += s;
    }
    const last = coords[coords.length - 1];
    if (pts[pts.length - 1][0] < total) pts.push([total, last[0], last[1], last[2] ?? null]);
    return { points: pts, total };
  }

  /** Moyenne glissante centrée sur `w` valeurs (fenêtre tronquée aux extrémités). */
  function smooth(v, w = SMOOTH) {
    const h = Math.floor(w / 2);
    return v.map((_, i) => {
      const win = v.slice(Math.max(0, i - h), i + h + 1);
      return win.reduce((x, y) => x + y, 0) / win.length;
    });
  }

  /** Statistiques d'une série d'altitudes rééchantillonnée : la partie commune à toutes les sources
      d'altitude (modèle de terrain côté Python, sommets du graphe côté navigateur). */
  function stats(distances, elevations) {
    const e = smooth(elevations);
    let gain = 0, loss = 0;
    for (let i = 1; i < e.length; i++) { const d = e[i] - e[i - 1]; if (d > 0) gain += d; else loss -= d; }
    const total = distances[distances.length - 1];
    return { km: total / 1000, gain, loss, min: Math.min(...e), max: Math.max(...e),
      minutes: walkingMinutes(total / 1000, gain, loss), smoothed: e };
  }

  /** Indices gardés pour le graphique (au plus PROFILE_POINTS, le dernier toujours inclus). */
  function downsample(n, max = PROFILE_POINTS) {
    const k = Math.max(1, Math.ceil(n / max)), idx = [];
    for (let i = 0; i < n; i += k) idx.push(i);
    if (idx[idx.length - 1] !== n - 1) idx.push(n - 1);
    return idx;
  }

  /** Profil complet d'un tracé [[lon, lat, ele|null], …] : longueur, et si toutes les altitudes sont
      connues, dénivelés, extrêmes, temps et points du graphique { d, e, lon, lat }. */
  function profile(coords) {
    const { points, total } = resample(coords);
    if (!points.every((p) => p[3] != null)) return { total, hasEle: false };
    const s = stats(points.map((p) => p[0]), points.map((p) => p[3]));
    const idx = downsample(points.length);
    return { total, hasEle: true, gain: s.gain, loss: s.loss, min: s.min, max: s.max, minutes: s.minutes,
      pr: { d: idx.map((i) => points[i][0]), e: idx.map((i) => s.smoothed[i]),
        lon: idx.map((i) => points[i][1]), lat: idx.map((i) => points[i][2]) } };
  }

  const api = { STEP_M, SMOOTH, PROFILE_POINTS, dist, rawMinutes, walkingMinutes, resample, smooth, stats, downsample, profile };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OdoGeo = api;
})(typeof window !== 'undefined' ? window : globalThis);
