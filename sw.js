/* Ododino – service worker : site installable et utilisable hors connexion.
   - Coquille du site (pages, scripts, styles, polices, icônes) : mise en cache à l'installation.
   - Données (POI, sentiers…) : réseau d'abord, cache en secours — les mises à jour hebdomadaires passent.
   - Pack « hors ligne » (fond vectoriel, relief, graphe, profils, GPX) : téléchargé seulement à la
     demande du visiteur (bouton dans le panneau), géré par app.js dans le cache OFFLINE.
   - Les tuiles des fonds en ligne (OpenTopoMap, OSM, Esri…) ne sont jamais mises en cache ici :
     leurs conditions d'utilisation interdisent le stockage en masse. */
'use strict';

const VERSION = 'dev'; // remplacé à chaque publication par tools/build.py (empreinte des fichiers)
const SHELL = `ododino-shell-${VERSION}`;
const DATA = 'ododino-data';
const OFFLINE = 'ododino-offline';   // rempli par app.js (bouton « Disponible hors ligne »)

const SHELL_FILES = [
  './', 'index.html', 'about.html', 'style.css', 'app.js', 'route.js', 'about.js', 'i18n.js',
  'manifest.webmanifest', 'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
  'vendor/leaflet/images/layers.png', 'vendor/leaflet/images/layers-2x.png',
  'vendor/protomaps-leaflet/protomaps-leaflet.js', 'vendor/goatcounter/count.js',
  'fonts/fonts.css', 'fonts/inter-latin.woff2', 'fonts/inter-latin-ext.woff2',
  'fonts/fraunces-latin.woff2', 'fonts/fraunces-latin-ext.woff2',
  'icons/favicon.svg', 'icons/logo.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'data/meta.json', 'data/pois.geojson', 'data/trails.geojson', 'data/boundary.geojson',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' : on ignore le cache HTTP pour ne jamais mélanger ancienne et nouvelle version
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES.map((f) => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ododino-shell-') && k !== SHELL).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Requête partielle (Range) servie depuis une réponse complète en cache : utilisée par le fond PMTiles
async function rangeFromCache(req, cached) {
  const m = /bytes=(\d+)-(\d*)/.exec(req.headers.get('range') || '');
  const buf = await cached.arrayBuffer();
  if (!m) return new Response(buf, { status: 200, headers: cached.headers });
  const start = Number(m[1]), end = m[2] ? Math.min(Number(m[2]), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: { 'Content-Type': cached.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`, 'Content-Length': String(end - start + 1) },
  });
}

const isData = (p) => p.includes('/data/');
const ignoreSearch = { ignoreSearch: true };

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // tuiles et stats : réseau direct

  // Fond vectoriel hors ligne : lu par morceaux (Range) dans le pack, sinon sur le réseau
  if (req.headers.has('range')) {
    e.respondWith(caches.match(url.pathname, { ...ignoreSearch, cacheName: OFFLINE })
      .then((hit) => (hit ? rangeFromCache(req, hit) : fetch(req))));
    return;
  }

  // Données : réseau d'abord (mises à jour hebdomadaires), puis cache
  if (isData(url.pathname)) {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok && !url.pathname.endsWith('/graph.json')) {
        const copy = res.clone();
        caches.open(DATA).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, ignoreSearch).then((hit) => hit || Response.error())));
    return;
  }

  // Reste du site : cache d'abord, rafraîchi en arrière-plan
  e.respondWith(caches.match(req, ignoreSearch).then((hit) => {
    const net = fetch(req).then((res) => {
      if (res.ok && SHELL_FILES.some((f) => url.pathname.endsWith('/' + f) || (f === './' && url.pathname.endsWith('/')))) {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => hit || caches.match('index.html'));
    return hit || net;
  }));
});
