/* Ododino – traceur d'itinéraire : affichage (carte, panneau, GPX, lien).
   Le calcul est dans router.js (pur, testé) ; rien n'est envoyé, le tracé vit dans le lien de la page.
   Dépend de window.Ododino (app.js), window.OdoRouter (router.js) et window.OdoGeo (geo.js). */
(() => {
  'use strict';
  const O = window.Ododino;
  const { map, t, esc, km } = O;
  const $ = (s) => document.querySelector(s);

  // ---------- Réglages d'affichage (le calcul vit dans router.js) ----------
  const COLOR = '#0b7285', WARN = '#e03131';
  const opts = { marked: false, alpine: false };
  const { MAX_POINTS } = window.OdoRouter;

  // ---------- Graphe : chargé à la première ouverture de l'onglet ----------
  let R = null, loading = null;
  function loadGraph() {
    if (!loading) {
      loading = fetch('data/graph.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then((raw) => { R = window.OdoRouter.create(raw); $('#routeLoading').hidden = true; return R; })
        .catch((err) => { loading = null; throw err; }); // nouvel essai au prochain clic
    }
    return loading;
  }
  const snap = (ll) => R.snap(ll.lng, ll.lat, opts);
  const latLng = (i) => { const [x, y] = R.lonLat(i); return [y, x]; };

  // ---------- État et rendu ----------
  const st = { pts: [], result: null, imported: null };
  const layer = L.layerGroup().addTo(map);
  const markers = [];

  function pin(i, n) {
    const label = i === 0 ? 'A' : i === n - 1 && n > 1 ? 'B' : String(i);
    return L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 14],
      html: `<div class="route-pin${i === 0 ? ' start' : ''}">${label}</div>` });
  }

  function recompute() {
    st.result = R.plan(st.pts, opts);
    render();
  }
  const routeCoords = () => (st.result ? st.result.coords : []);
  const legs = () => (st.result ? st.result.legs : []);

  function render() {
    layer.clearLayers();
    const coords = st.imported ? st.imported.coords : routeCoords();
    const ll = (c) => c.map((p) => [p[1], p[0]]);
    if (coords.length > 1) {
      L.polyline(ll(coords), { pane: 'trails', color: '#fff', weight: 10, opacity: .9, interactive: false }).addTo(layer);
      L.polyline(ll(coords), { pane: 'trails', color: COLOR, weight: 5, opacity: 1, interactive: false }).addTo(layer);
      // tronçons difficiles (SAC T3 et plus) en rouge
      let run = [];
      const flush = () => { if (run.length > 1) L.polyline(ll(run), { pane: 'trails', color: WARN, weight: 5, interactive: false }).addTo(layer); run = []; };
      coords.forEach((p, i) => { if (p[3] >= 3) { if (!run.length && i) run.push(coords[i - 1]); run.push(p); } else flush(); });
      flush();
    }
    // étapes introuvables : trait pointillé
    legs().forEach((leg, i) => {
      if (leg) return;
      L.polyline([latLng(st.pts[i]), latLng(st.pts[i + 1])], { pane: 'trails', color: WARN, weight: 3, dashArray: '6 8', interactive: false }).addTo(layer);
    });
    markers.forEach((m) => m.remove()); markers.length = 0;
    st.pts.forEach((nIdx, i) => {
      const m = L.marker(latLng(nIdx), { icon: pin(i, st.pts.length), draggable: true, autoPan: true, zIndexOffset: 1000 }).addTo(map);
      m.on('dragend', () => {
        const s = snap(m.getLatLng());
        if (s >= 0) st.pts[i] = s;
        recompute();
      });
      // clic / toucher sur une étape : petite bulle « Retirer » (pas de suppression accidentelle au doigt)
      m.bindPopup(`<button type="button" class="route-remove">${esc(t('routeRemove'))}</button>`, { closeButton: false, offset: [0, -10] });
      m.on('popupopen', (ev) => {
        ev.popup.getElement().querySelector('.route-remove').addEventListener('click', () => { map.closePopup(); st.pts.splice(i, 1); recompute(); });
      });
      markers.push(m);
    });
    renderPanel(coords);
    if (!st.imported) O.setHash(st.pts.length ? 'route=' + window.OdoRouter.encode(st.pts.map(R.lonLat), opts) : '');
  }

  function renderPanel(coords) {
    const box = $('#routeStats'), warn = $('#routeWarn'), prof = $('#routeProfile');
    $('#routeExport').disabled = coords.length < 2;
    $('#routeUndo').disabled = !st.pts.length || !!st.imported;
    const msgs = [];
    if (!st.imported && st.result?.failed) msgs.push(t('routeFail'));
    const maxSac = st.imported ? 0 : st.result?.maxSac || 0;
    if (maxSac >= 4) msgs.push(t('routeWarnT4'));
    else if (maxSac >= 3) msgs.push(t('routeWarnT3'));
    warn.hidden = !msgs.length;
    warn.innerHTML = msgs.map((m) => `<p>⚠ ${esc(m)}</p>`).join('');
    if (coords.length < 2) { box.innerHTML = ''; prof.hidden = true; return; }
    const p = window.OdoGeo.profile(coords);
    const m = (v) => `${Math.round(v).toLocaleString(O.locale())} m`;
    const row = (k, v) => `<span>${esc(t(k))} <b>${esc(v)}</b></span>`;
    box.innerHTML = `<div class="row">${row('length', km(p.total / 1000) + ' km')}${p.hasEle ? row('timeEst', O.hm(p.minutes)) : ''}</div>`
      + (p.hasEle ? `<div class="row">${row('ascent', m(p.gain))}${row('descent', m(p.loss))}${row('altRange', `${m(p.min)} – ${m(p.max)}`)}</div>`
        : `<p class="muted">${esc(t('importNoEle'))}</p>`);
    prof.hidden = !p.hasEle;
    if (p.hasEle) O.drawProfile(p.pr, COLOR, $('#routeProfileBox'));
  }

  // ---------- Lien partageable ----------
  async function fromHash(h) {
    const { lonLats, options } = window.OdoRouter.decode(h);
    Object.assign(opts, options);
    $('#routeMarked').checked = opts.marked; $('#routeAlpine').checked = opts.alpine;
    await loadGraph();
    st.imported = null;
    st.pts = lonLats.map(([x, y]) => R.snap(x, y, opts)).filter((i) => i >= 0);
    recompute();
    if (st.pts.length) map.fitBounds(L.latLngBounds(st.pts.map(latLng)), { padding: [40, 40] });
  }

  // ---------- GPX ----------
  function exportGpx() {
    const coords = st.imported ? st.imported.coords : routeCoords();
    if (coords.length < 2) return;
    const x = (s) => esc(s);
    const name = st.imported ? st.imported.name : t('routeName');
    const gpx = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<gpx version="1.1" creator="Ododino" xmlns="http://www.topografix.com/GPX/1/1">',
      `<metadata><name>${x(name)}</name><desc>Tracciato indicativo / Indicative route. © OpenStreetMap (ODbL), Copernicus DEM GLO-30. Emergenza / Emergency: 112</desc></metadata>`,
      `<trk><name>${x(name)}</name><trkseg>`,
      ...coords.map((p) => `<trkpt lat="${p[1].toFixed(5)}" lon="${p[0].toFixed(5)}">${p[2] != null ? `<ele>${Math.round(p[2])}</ele>` : ''}</trkpt>`),
      '</trkseg></trk></gpx>', ''].join('\n');
    const url = URL.createObjectURL(new Blob([gpx], { type: 'application/gpx+xml' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'ododino-itinerario.gpx' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Import : lu uniquement dans le navigateur, jamais envoyé
  function importGpx(file) {
    if (!file || file.size > 10e6) { O.toast(t('importError')); return; }
    file.text().then((txt) => {
      const doc = new DOMParser().parseFromString(txt, 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error('xml');
      const pts = [...doc.querySelectorAll('trkpt, rtept')].map((p) => {
        const ele = parseFloat(p.querySelector('ele')?.textContent);
        return [parseFloat(p.getAttribute('lon')), parseFloat(p.getAttribute('lat')), Number.isFinite(ele) ? ele : null, 0];
      }).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[1]) <= 90 && Math.abs(p[0]) <= 180);
      if (pts.length < 2) throw new Error('empty');
      const name = (doc.querySelector('trk > name, metadata > name')?.textContent || file.name).slice(0, 100);
      st.pts = []; st.result = null; st.imported = { coords: pts, name };
      $('#routeImported').textContent = `${t('routeImported')} : ${name}`;
      $('#routeImported').hidden = false;
      render();
      map.fitBounds(L.latLngBounds(pts.map((p) => [p[1], p[0]])), { padding: [40, 40] });
      O.setHash('');
    }).catch(() => O.toast(t('importError')));
  }

  // ---------- Interface ----------
  function clearAll() { st.pts = []; st.result = null; st.imported = null; $('#routeImported').hidden = true; if (R) render(); else O.setHash(''); }

  async function addPoint(ll) {
    if (st.imported) clearAll();
    try { await loadGraph(); } catch { O.toast(t('routeLoadError')); return; }
    const s = snap(ll);
    if (s < 0) { O.toast(t('routeNoPath')); return; }
    if (st.pts.length >= MAX_POINTS) return;
    st.pts.push(s);
    recompute();
  }

  $('#routeUndo').addEventListener('click', () => { st.pts.pop(); recompute(); });
  $('#routeClear').addEventListener('click', clearAll);
  $('#routeExport').addEventListener('click', exportGpx);
  $('#routeImportBtn').addEventListener('click', () => $('#routeFile').click());
  $('#routeFile').addEventListener('change', (e) => { importGpx(e.target.files[0]); e.target.value = ''; });
  // changement d'option : les étapes sont recalées sur les chemins encore autorisés
  const resnap = () => { st.pts = st.pts.map((i) => R.snap(...R.lonLat(i), opts)).filter((i) => i >= 0); recompute(); };
  $('#routeMarked').addEventListener('change', (e) => { opts.marked = e.target.checked; if (R && st.pts.length) resnap(); });
  $('#routeAlpine').addEventListener('change', (e) => { opts.alpine = e.target.checked; if (R && st.pts.length) resnap(); });

  O.route = {
    onTab(active) {
      map.getContainer().classList.toggle('routing', active);
      if (active) loadGraph().catch(() => { $('#routeLoading').textContent = t('routeLoadError'); });
    },
    onMapClick: addPoint,
    fromHash,
    refresh() { if (R) renderPanel(st.imported ? st.imported.coords : routeCoords()); },
  };
})();
