/* Ododino : retrait du service worker de l'ancienne version du site (avant Angular).
   Les visiteurs déjà venus l'ont encore : le navigateur récupère ce fichier à sa prochaine vérification, qui vide
   les anciens caches (sauf le pack hors ligne « ododino-offline », que la nouvelle version relit), se désinscrit
   et recharge les pages ouvertes. La nouvelle version enregistre ensuite son propre service worker (ngsw-worker.js). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('ododino-shell-') || k === 'ododino-data') await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
})()));
