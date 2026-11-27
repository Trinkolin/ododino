/* Ododino – mode hors connexion (étape 3).
   - enregistre le service worker (sw.js) : le site s'installe et s'ouvre sans réseau ;
   - bouton « Disponible hors ligne » : télécharge, à la demande seulement, le pack listé dans
     offline-files.json (fond vectoriel, relief, graphe du traceur, profils, GPX) ;
   - bascule sur le fond vectoriel quand le réseau tombe, et revient au fond choisi ensuite.
   Dépend de window.Ododino (app.js). */
(() => {
  'use strict';
  const O = window.Ododino;
  const { map, t, esc } = O;
  const $ = (s) => document.querySelector(s);
  const CACHE = 'ododino-offline';
  const KEY = 'ododino.offline';
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } },
    set(v) { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch { /* indisponible */ } },
  };
  const mb = (b) => `${(b / 1e6).toLocaleString(O.locale(), { maximumFractionDigits: 0 })} Mo`;

  const swOk = 'serviceWorker' in navigator && 'caches' in window && window.isSecureContext;
  // Le build (tools/build.py) ajoute <meta name="ododino-build"> à la page publiée : en développement il
  // n'y est pas, et le service worker reste désactivé (sinon il servirait d'anciennes versions des fichiers)
  if (swOk) {
    if (document.querySelector('meta[name="ododino-build"]')) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* site utilisable sans */ });
    } else {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((g) => g.unregister()));
    }
  }

  // ---------- Pack hors ligne ----------
  let manifest = null, busy = false;
  const loadManifest = () => (manifest ? Promise.resolve(manifest)
    : fetch('offline-files.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((m) => (manifest = m)).catch(() => null));

  async function render() {
    const box = $('#offlineBox'); if (!box) return;
    if (!swOk) { box.innerHTML = `<p class="muted">${esc(t('offlineUnsupported'))}</p>`; return; }
    if (busy) return;
    const done = store.get();
    const m = await loadManifest();
    const stale = done && m && done.version !== m.version;
    const dateTxt = done ? new Date(done.at).toLocaleDateString(O.locale()) : '';
    box.innerHTML = done
      ? `<p>✓ ${esc(t('offlineReady').replace('{date}', dateTxt))}</p>
         ${stale ? `<p class="muted">${esc(t('offlineStale'))}</p>` : ''}
         <div class="route-btns">
           ${m ? `<button type="button" data-act="get">${esc(stale ? t('offlineUpdate') : t('offlineRefresh'))}</button>` : ''}
           <button type="button" data-act="del">${esc(t('offlineRemove'))}</button></div>`
      : m ? `<p class="muted">${esc(t('offlineNote'))}</p>
         <div class="route-btns"><button type="button" class="primary" data-act="get">⬇ ${esc(t('offlineDownload').replace('{size}', mb(m.bytes)))}</button></div>`
        : `<p class="muted">${esc(t('offlineUnavailable'))}</p>`;
  }

  async function download() {
    const m = await loadManifest(); if (!m) return;
    busy = true;
    const box = $('#offlineBox');
    box.innerHTML = `<p>${esc(t('offlineProgress').replace('{p}', '0'))}</p><progress max="${m.bytes}" value="0"></progress>`;
    const bar = box.querySelector('progress'), label = box.querySelector('p');
    try {
      const cache = await caches.open(CACHE);
      let done = 0, i = 0;
      const queue = [...m.files];
      // 4 téléchargements en parallèle, chaque fichier vérifié avant d'être gardé
      const worker = async () => {
        while (queue.length) {
          const [path, size] = queue.shift();
          // jusqu'à 3 essais par fichier : une connexion qui coupe en cours de route est fréquente en montagne
          for (let attempt = 1; ; attempt++) {
            try {
              const res = await fetch(path, { cache: 'reload' });
              if (!res.ok) throw new Error(`${path} : ${res.status}`);
              await cache.put(path, res);
              break;
            } catch (err) {
              if (attempt >= 3) throw err;
              await new Promise((r) => setTimeout(r, 1000 * attempt));
            }
          }
          done += size; i++;
          bar.value = done;
          label.textContent = t('offlineProgress').replace('{p}', Math.round(done / m.bytes * 100));
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      store.set({ at: Date.now(), version: m.version, files: i });
      O.toast(t('offlineDone'));
    } catch {
      O.toast(t('offlineError'));
    } finally {
      busy = false; render();
    }
  }

  async function remove() {
    await caches.delete(CACHE);
    store.set(null);
    render();
  }

  $('#offlineToggle')?.addEventListener('click', () => {
    const box = $('#offlineBox');
    box.hidden = !box.hidden;
    if (!box.hidden) render();
  });
  $('#offlineBox')?.addEventListener('click', (e) => {
    const act = e.target.closest('button[data-act]')?.dataset.act;
    if (act === 'get') download();
    if (act === 'del') remove();
  });

  // ---------- Bascule automatique du fond de carte ----------
  const online = [O.bases.topo, O.bases.osm, O.bases.sat];
  let before = null;
  function toOffline() {
    if (!O.bases.offline || map.hasLayer(O.bases.offline)) return;
    before = online.find((l) => map.hasLayer(l)) || O.bases.topo;
    online.forEach((l) => map.removeLayer(l));
    O.bases.offline.addTo(map);
    O.toast(t('offlineNow'));
  }
  function toOnline() {
    if (!before || !map.hasLayer(O.bases.offline)) return;
    map.removeLayer(O.bases.offline);
    before.addTo(map); before = null;
  }
  window.addEventListener('offline', toOffline);
  window.addEventListener('online', toOnline);
  if (!navigator.onLine) toOffline();

  O.offline = { render };
})();
