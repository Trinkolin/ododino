/* Ododino – traceur d'itinéraire (étape 2 bis).
   Calcul dans le navigateur, sur data/graph.json (chemins OSM + altitudes) :
   aucun serveur, aucun service tiers, rien n'est envoyé. Le tracé vit dans le lien de la page.
   Dépend de l'API exposée par app.js : window.Ododino. */
(() => {
  'use strict';
  const O = window.Ododino;
  const { map, t, esc, km } = O;
  const $ = (s) => document.querySelector(s);

  // ---------- Réglages ----------
  const CLASS_FACTOR = [1, 1.05, 1.2, 1.6, 3];   // sentier, piste, petite route, tertiaire, secondaire
  const MARKED_BONUS = 0.9;                       // léger avantage aux sentiers balisés
  const SNAP_M = 800;                             // distance max. entre un clic et un chemin
  const COLOR = '#0b7285', WARN = '#e03131';
  const opts = { marked: false, alpine: false };

  // ---------- Géo ----------
  const R = 6371e3;
  function dist(a, b) {
    const p1 = a[1] * Math.PI / 180, p2 = b[1] * Math.PI / 180;
    const dp = p2 - p1, dl = (b[0] - a[0]) * Math.PI / 180;
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  // Méthode des clubs alpins (DIN 33466), en minutes — la même que pour les fiches des sentiers
  const din = (kmv, gain, loss) => { const h = kmv / 4, v = gain / 300 + loss / 500; return (Math.max(h, v) + Math.min(h, v) / 2) * 60; };

  // ---------- Graphe ----------
  let G = null, loading = null;
  function loadGraph() {
    if (!loading) {
      loading = fetch('data/graph.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((raw) => {
        const n = raw.nodes.length / 2;
        const lon = new Float64Array(n), lat = new Float64Array(n);
        for (let i = 0; i < n; i++) { lon[i] = raw.nodes[2 * i] / 1e5; lat[i] = raw.nodes[2 * i + 1] / 1e5; }
        const adj = Array.from({ length: n }, () => []);
        const edges = raw.edges.map((e, k) => {
          const [a, b, cls, sac, mk, len, gain, loss] = e;
          const pts = []; let x = raw.nodes[2 * a], y = raw.nodes[2 * a + 1];
          for (let i = 8; i < e.length; i += 3) { x += e[i]; y += e[i + 1]; pts.push([x / 1e5, y / 1e5, e[i + 2]]); }
          adj[a].push(k); if (b !== a) adj[b].push(k);
          return { a, b, cls, sac, mk, len, gain, loss, pts };
        });
        // grille pour trouver vite le carrefour le plus proche d'un clic
        const grid = new Map(), cell = (x, y) => `${Math.floor(x / 0.005)},${Math.floor(y / 0.005)}`;
        for (let i = 0; i < n; i++) { const c = cell(lon[i], lat[i]); if (!grid.has(c)) grid.set(c, []); grid.get(c).push(i); }
        G = { lon, lat, adj, edges, grid, cell };
        return G;
      }).catch((err) => { loading = null; throw err; }); // nouvel essai au prochain clic
    }
    return loading;
  }

  const allowed = (e) => (!opts.marked || e.mk) && (opts.alpine || e.sac < 4);

  function snap(ll) {
    const cx = Math.floor(ll.lng / 0.005), cy = Math.floor(ll.lat / 0.005);
    let best = -1, bestD = SNAP_M;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      for (const i of G.grid.get(`${cx + dx},${cy + dy}`) || []) {
        if (!G.adj[i].some((k) => allowed(G.edges[k]))) continue;
        const d = dist([ll.lng, ll.lat], [G.lon[i], G.lat[i]]);
        if (d < bestD) { bestD = d; best = i; }
      }
    }
    return best;
  }

  // Coût d'une arête dans un sens : temps de marche (min) × type de voie
  function cost(e, fwd) {
    const c = din(e.len / 1000, fwd ? e.gain : e.loss, fwd ? e.loss : e.gain) * CLASS_FACTOR[e.cls];
    return e.mk ? c * MARKED_BONUS : c;
  }

  // A* avec un tas binaire ; heuristique admissible : distance à vol d'oiseau à 4 km/h, bonus déduit
  function shortest(s, goal) {
    if (s === goal) return [];
    const n = G.lon.length, g = new Float64Array(n).fill(Infinity), via = new Int32Array(n).fill(-1);
    const gx = [G.lon[goal], G.lat[goal]];
    const hfun = (i) => dist([G.lon[i], G.lat[i]], gx) / 1000 / 4 * 60 * MARKED_BONUS;
    const heap = [[hfun(s), s]];
    const push = (it) => { heap.push(it); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    g[s] = 0;
    while (heap.length) {
      const [, u] = pop();
      if (u === goal) break;
      for (const k of G.adj[u]) {
        const e = G.edges[k]; if (!allowed(e)) continue;
        const fwd = e.a === u, v = fwd ? e.b : e.a, nd = g[u] + cost(e, fwd);
        if (nd < g[v]) { g[v] = nd; via[v] = k; push([nd + hfun(v), v]); }
      }
    }
    if (g[goal] === Infinity) return null;
    const path = []; let v = goal;
    while (v !== s) { const k = via[v], e = G.edges[k], fwd = e.b === v; path.push([k, fwd]); v = fwd ? e.a : e.b; }
    return path.reverse();
  }

  // ---------- État et rendu ----------
  const st = { pts: [], legs: [], imported: null };
  const layer = L.layerGroup().addTo(map);
  const markers = [];

  function pin(i, n) {
    const label = i === 0 ? 'A' : i === n - 1 && n > 1 ? 'B' : String(i);
    return L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 14],
      html: `<div class="route-pin${i === 0 ? ' start' : ''}">${label}</div>` });
  }

  function recompute() {
    st.legs = [];
    for (let i = 1; i < st.pts.length; i++) st.legs.push(shortest(st.pts[i - 1], st.pts[i]));
    render();
  }

  function routeCoords() {
    // [[lon, lat, ele, sac]] le long des étapes trouvées
    const out = [];
    st.legs.forEach((leg) => {
      (leg || []).forEach(([k, fwd]) => {
        const e = G.edges[k], pts = fwd ? e.pts : [...e.pts].reverse();
        pts.forEach((p, j) => { if (out.length && j === 0) return; out.push([p[0], p[1], p[2], e.sac]); });
      });
    });
    return out;
  }

  // Même méthode que tools/enrich_trails.py : points tous les 20 m, moyenne glissante sur 5
  function profileOf(coords) {
    const res = [[0, coords[0][0], coords[0][1], coords[0][2]]];
    let tot = 0, next = 20;
    for (let i = 1; i < coords.length; i++) {
      const a = coords[i - 1], b = coords[i], s = dist(a, b);
      while (s > 0 && tot + s >= next) {
        const f = (next - tot) / s;
        res.push([next, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] == null ? null : a[2] + (b[2] - a[2]) * f]);
        next += 20;
      }
      tot += s;
    }
    const last = coords[coords.length - 1];
    if (res[res.length - 1][0] < tot) res.push([tot, last[0], last[1], last[2]]);
    const hasEle = res.every((r) => r[3] != null);
    if (!hasEle) return { total: tot, hasEle };
    const e0 = res.map((r) => r[3]);
    const e = e0.map((_, i) => { const w = e0.slice(Math.max(0, i - 2), i + 3); return w.reduce((x, y) => x + y, 0) / w.length; });
    let gain = 0, loss = 0;
    for (let i = 1; i < e.length; i++) { const d = e[i] - e[i - 1]; if (d > 0) gain += d; else loss -= d; }
    const k = Math.max(1, Math.ceil(res.length / 300)), idx = [];
    for (let i = 0; i < res.length; i += k) idx.push(i);
    if (idx[idx.length - 1] !== res.length - 1) idx.push(res.length - 1);
    return { total: tot, hasEle, gain, loss, min: Math.min(...e), max: Math.max(...e),
      pr: { d: idx.map((i) => res[i][0]), e: idx.map((i) => e[i]), lon: idx.map((i) => res[i][1]), lat: idx.map((i) => res[i][2]) } };
  }

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
    st.legs.forEach((leg, i) => {
      if (leg) return;
      const a = st.pts[i], b = st.pts[i + 1];
      L.polyline([[G.lat[a], G.lon[a]], [G.lat[b], G.lon[b]]], { pane: 'trails', color: WARN, weight: 3, dashArray: '6 8', interactive: false }).addTo(layer);
    });
    markers.forEach((m) => m.remove()); markers.length = 0;
    st.pts.forEach((nIdx, i) => {
      const m = L.marker([G.lat[nIdx], G.lon[nIdx]], { icon: pin(i, st.pts.length), draggable: true, autoPan: true, zIndexOffset: 1000 }).addTo(map);
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
    if (!st.imported) O.setHash(st.pts.length ? 'route=' + encodeRoute() : '');
  }

  function renderPanel(coords) {
    const box = $('#routeStats'), warn = $('#routeWarn'), prof = $('#routeProfile');
    $('#routeExport').disabled = coords.length < 2;
    $('#routeUndo').disabled = !st.pts.length || !!st.imported;
    const msgs = [];
    if (st.legs.some((l) => !l)) msgs.push(t('routeFail'));
    const maxSac = Math.max(0, ...coords.map((p) => p[3] || 0));
    if (maxSac >= 4) msgs.push(t('routeWarnT4'));
    else if (maxSac >= 3) msgs.push(t('routeWarnT3'));
    warn.hidden = !msgs.length;
    warn.innerHTML = msgs.map((m) => `<p>⚠ ${esc(m)}</p>`).join('');
    if (coords.length < 2) { box.innerHTML = ''; prof.hidden = true; return; }
    const p = profileOf(coords);
    const m = (v) => `${Math.round(v).toLocaleString(O.locale())} m`;
    const row = (k, v) => `<span>${esc(t(k))} <b>${esc(v)}</b></span>`;
    box.innerHTML = `<div class="row">${row('length', km(p.total / 1000) + ' km')}${p.hasEle ? row('timeEst', O.hm(Math.max(5, Math.round(din(p.total / 1000, p.gain, p.loss) / 5) * 5))) : ''}</div>`
      + (p.hasEle ? `<div class="row">${row('ascent', m(p.gain))}${row('descent', m(p.loss))}${row('altRange', `${m(p.min)} – ${m(p.max)}`)}</div>`
        : `<p class="muted">${esc(t('importNoEle'))}</p>`);
    prof.hidden = !p.hasEle;
    if (p.hasEle) O.drawProfile(p.pr, COLOR, $('#routeProfileBox'));
  }

  // ---------- Lien partageable ----------
  const encodeRoute = () => st.pts.map((i) => `${G.lon[i].toFixed(5)},${G.lat[i].toFixed(5)}`).join(';')
    + (opts.marked || opts.alpine ? `&o=${opts.marked ? 'm' : ''}${opts.alpine ? 'a' : ''}` : '');
  async function fromHash(h) {
    const [pts, o = ''] = h.split('&o=');
    opts.marked = o.includes('m'); opts.alpine = o.includes('a');
    $('#routeMarked').checked = opts.marked; $('#routeAlpine').checked = opts.alpine;
    await loadGraph();
    st.imported = null;
    st.pts = pts.split(';').map((s) => s.split(',').map(Number))
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
      .slice(0, 50).map(([x, y]) => snap(L.latLng(y, x))).filter((i) => i >= 0);
    recompute();
    if (st.pts.length) map.fitBounds(L.latLngBounds(st.pts.map((i) => [G.lat[i], G.lon[i]])), { padding: [40, 40] });
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
      st.pts = []; st.legs = []; st.imported = { coords: pts, name };
      $('#routeImported').textContent = `${t('routeImported')} : ${name}`;
      $('#routeImported').hidden = false;
      render();
      map.fitBounds(L.latLngBounds(pts.map((p) => [p[1], p[0]])), { padding: [40, 40] });
      O.setHash('');
    }).catch(() => O.toast(t('importError')));
  }

  // ---------- Interface ----------
  function clearAll() { st.pts = []; st.legs = []; st.imported = null; $('#routeImported').hidden = true; if (G) render(); else O.setHash(''); }

  async function addPoint(ll) {
    if (st.imported) clearAll();
    try { await loadGraph(); } catch { O.toast(t('routeLoadError')); return; }
    const s = snap(ll);
    if (s < 0) { O.toast(t('routeNoPath')); return; }
    if (st.pts.length >= 50) return;
    st.pts.push(s);
    recompute();
  }

  $('#routeUndo').addEventListener('click', () => { st.pts.pop(); recompute(); });
  $('#routeClear').addEventListener('click', clearAll);
  $('#routeExport').addEventListener('click', exportGpx);
  $('#routeImportBtn').addEventListener('click', () => $('#routeFile').click());
  $('#routeFile').addEventListener('change', (e) => { importGpx(e.target.files[0]); e.target.value = ''; });
  $('#routeMarked').addEventListener('change', (e) => { opts.marked = e.target.checked; if (G && st.pts.length) { st.pts = st.pts.map((i) => snap(L.latLng(G.lat[i], G.lon[i]))).filter((i) => i >= 0); recompute(); } });
  $('#routeAlpine').addEventListener('change', (e) => { opts.alpine = e.target.checked; if (G && st.pts.length) recompute(); });

  O.route = {
    onTab(active) {
      map.getContainer().classList.toggle('routing', active);
      if (active) loadGraph().then(() => { $('#routeLoading').hidden = true; }).catch(() => { $('#routeLoading').textContent = t('routeLoadError'); });
    },
    onMapClick: addPoint,
    fromHash,
    refresh() { if (G) renderPanel(st.imported ? st.imported.coords : routeCoords()); },
  };
})();
