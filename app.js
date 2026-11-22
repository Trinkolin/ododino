/* Ododino – carte des points d'intérêt et sentiers des Valli del Natisone (données OpenStreetMap) */
(() => {
  'use strict';

  // ---------- Langue ----------
  const I = window.I18N;
  let lang = I.detect();
  const T = () => I[lang];
  const t = (k) => I[lang][k] ?? I.it[k] ?? k;
  const locale = () => I.locale(lang);

  // ---------- Configuration ----------
  const CATS = {
    peak: { color: '#7a5230', icon: '▲' }, viewpoint: { color: '#e8590c', icon: '👁' },
    church: { color: '#5f3dc4', icon: '✝' }, shrine: { color: '#9775fa', icon: '✟' },
    history: { color: '#a61e4d', icon: '🏛' }, culture: { color: '#c2255c', icon: '★' },
    cave: { color: '#495057', icon: '◐' }, water: { color: '#1c7ed6', icon: '💧' },
    drinking: { color: '#0c8599', icon: '🚰' },
    hut: { color: '#2b8a3e', icon: '⌂' }, outdoor: { color: '#5c940d', icon: '⛺' },
    food: { color: '#f08c00', icon: '🍴' }, sleep: { color: '#0b7285', icon: '🛏' },
    info: { color: '#868e96', icon: 'i' }, saddle: { color: '#8d6e52', icon: '⌒' },
    train: { color: '#1864ab', icon: '🚆' }, bus: { color: '#3b5bdb', icon: '🚌' },
    parking: { color: '#4263eb', icon: 'P' },
  };
  // Catégories masquées au départ (nombreuses, utiles seulement pour préparer l'accès)
  const HIDDEN_BY_DEFAULT = ['parking', 'bus'];
  const catLabel = (k, one) => T().cats[k][one ? 1 : 0];
  const NETS = {
    iwn: { color: '#e8590c', order: 0 }, nwn: { color: '#7048e8', order: 1 },
    rwn: { color: '#f59f00', order: 2 }, lwn: { color: '#d6336c', order: 3 },
  };
  const SAC = { hiking: 'T1', mountain_hiking: 'T2', demanding_mountain_hiking: 'T3',
    alpine_hiking: 'T4', demanding_alpine_hiking: 'T5', difficult_alpine_hiking: 'T6' };

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // ---------- Carte ----------
  const map = L.map('map').setView([46.165, 13.52], 12);
  const bases = {
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17, attribution: '© OpenStreetMap, SRTM | © OpenTopoMap (CC-BY-SA)' }),
    osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap' }),
    sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: '© Esri' }),
  };
  bases.topo.addTo(map);
  const wmt = L.tileLayer('https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png', {
    maxZoom: 18, opacity: .7, attribution: '© waymarkedtrails.org' });

  map.createPane('paths').style.zIndex = 405;
  map.createPane('trails').style.zIndex = 420;
  map.createPane('boundary').style.zIndex = 400;
  map.getPane('boundary').style.pointerEvents = 'none';

  const layers = {
    boundary: L.layerGroup().addTo(map),
    paths: L.layerGroup(),
    trails: L.layerGroup().addTo(map),
    pois: L.layerGroup().addTo(map),
  };
  let layerCtl = null;
  function buildLayerControl() {
    if (layerCtl) layerCtl.remove();
    layerCtl = L.control.layers(
      { [t('baseTopo')]: bases.topo, [t('baseOsm')]: bases.osm, [t('baseSat')]: bases.sat },
      { [t('layerTrails')]: layers.trails, [t('layerPois')]: layers.pois, [t('layerWmt')]: wmt },
      { collapsed: true }).addTo(map);
  }
  L.control.scale({ imperial: false }).addTo(map);
  // À petite échelle, les POI deviennent des pastilles pour laisser voir les sentiers
  const zoomClass = () => map.getContainer().classList.toggle('z-low', map.getZoom() < 14);
  map.on('zoomend', zoomClass); zoomClass();

  // ---------- Utilitaires géo ----------
  const R = 6371e3;
  function dist(a, b) { // [lon,lat]
    const p1 = a[1] * Math.PI / 180, p2 = b[1] * Math.PI / 180;
    const dp = p2 - p1, dl = (b[0] - a[0]) * Math.PI / 180;
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const lengthOf = (parts) => parts.reduce((s, p) => s + p.slice(1).reduce((u, c, i) => u + dist(p[i], c), 0), 0);
  const ll = (parts) => parts.map((p) => p.map(([x, y]) => [y, x]));
  const km = (v) => v.toLocaleString(locale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 });

  // ---------- État ----------
  const state = { pois: [], trails: [], cats: new Set(Object.keys(CATS).filter((k) => !HIDDEN_BY_DEFAULT.includes(k))), nets: new Set(Object.keys(NETS)),
    selTrail: null, updated: null };

  // ---------- Textes statiques ----------
  function applyStaticText() {
    document.documentElement.lang = lang;
    document.title = `Ododino · ${t('subtitle')}`;
    document.querySelector('meta[name=description]').content = t('metaDesc');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.querySelectorAll('a[data-keep-lang]').forEach((a) => { a.href = a.getAttribute('href').split('?')[0] + '?lang=' + lang; });
    $('#langs').setAttribute('aria-label', t('language'));
    $('#langs').innerHTML = I.LANGS.map(([c, short, name]) =>
      `<button data-lang="${c}" class="${c === lang ? 'on' : ''}" title="${esc(name)}" lang="${c}" aria-pressed="${c === lang}">${short}</button>`).join('');
    if (state.updated) $('#updated').textContent = new Date(state.updated).toLocaleDateString(locale());
  }
  $('#langs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-lang]'); if (!b || b.dataset.lang === lang) return;
    setLang(b.dataset.lang);
  });
  function setLang(l) {
    lang = l; I.remember(l);
    const u = new URL(location.href); u.searchParams.set('lang', l);
    history.replaceState(null, '', u);
    map.closePopup();
    applyStaticText(); buildLayerControl();
    state.pois.forEach((x) => { x.title = poiTitle(x.p); x.marker.options.title = x.title; });
    state.trails.forEach((x) => { x.title = trailTitle(x.p); x.line.setTooltipContent(trailTip(x)); });
    renderCatChips(); renderNetChips(); renderPois(); renderTrails();
    if (state.selTrail) selectTrail(state.selTrail, false);
  }
  applyStaticText(); buildLayerControl();

  // Bandeau de sécurité : affiché tant que le visiteur ne l'a pas fermé
  try { if (localStorage.getItem('ododino.safetyOk')) $('#safety').hidden = true; } catch { /* stockage indisponible */ }
  $('#safetyOk').addEventListener('click', () => {
    $('#safety').hidden = true;
    try { localStorage.setItem('ododino.safetyOk', '1'); } catch { /* stockage indisponible */ }
  });

  // ---------- Chargement ----------
  const get = (f) => fetch(`data/${f}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  Promise.all([get('boundary.geojson'), get('pois.geojson'), get('trails.geojson'), get('paths.geojson'), get('meta.json')])
    .then(([boundary, pois, trails, paths, meta]) => {
      if (meta?.updated) { state.updated = meta.updated; applyStaticText(); }
      if (boundary) drawBoundary(boundary);
      if (paths) drawPaths(paths);
      if (trails) initTrails(trails);
      if (pois) initPois(pois);
      applyHash();
    });

  function drawBoundary(fc) {
    const all = [];
    fc.features.forEach((f) => {
      const gw = f.properties.gateway; // Cividale : contour discret
      const l = L.polyline(ll(f.geometry.coordinates), { pane: 'boundary', color: gw ? '#868e96' : '#2f6f4f',
        weight: gw ? 1.5 : 2, dashArray: gw ? '2 6' : '6 6', opacity: gw ? .6 : .7, interactive: false });
      layers.boundary.addLayer(l); if (!gw) all.push(l);
    });
    if (all.length && !location.hash) fitWhenSized(L.featureGroup(all).getBounds());
  }

  // Cadrage initial : si la carte n'a pas encore de taille (onglet en arrière-plan, panneau
  // qui s'ouvre…), fitBounds zoomerait au maximum ; on attend donc qu'elle soit dimensionnée.
  function fitWhenSized(bounds) {
    map.invalidateSize();
    const s = map.getSize();
    if (s.x < 100 || s.y < 100) { setTimeout(() => fitWhenSized(bounds), 200); return; }
    map.fitBounds(bounds, { padding: [10, 10] });
  }

  // ---------- Chemins (fond) ----------
  function drawPaths(fc) {
    fc.features.forEach((f) => {
      const p = f.properties;
      const track = p.hw === 'track';
      const l = L.polyline(f.geometry.coordinates.map(([x, y]) => [y, x]), {
        pane: 'paths', color: track ? '#8a7b66' : '#a0522d', weight: track ? 2 : 1.6,
        dashArray: track ? null : '4 4', opacity: .85,
      });
      l.bindTooltip(() => esc([p.name, track ? t('track') : t('path'),
        SAC[p.sac_scale] && `${t('sac')} ${SAC[p.sac_scale]}`].filter(Boolean).join(' · ')), { sticky: true });
      layers.paths.addLayer(l);
    });
    const sync = () => {
      const on = $('#showPaths').checked && map.getZoom() >= 14;
      if (on && !map.hasLayer(layers.paths)) layers.paths.addTo(map);
      if (!on && map.hasLayer(layers.paths)) map.removeLayer(layers.paths);
    };
    map.on('zoomend', sync); $('#showPaths').addEventListener('change', sync); sync();
  }

  // « Signaler une erreur » : ouvre une note OpenStreetMap à cet endroit
  const noteUrl = (lat, lon) => `https://www.openstreetmap.org/note/new?lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}#map=17/${lat.toFixed(5)}/${lon.toFixed(5)}`;

  // ---------- Sentiers balisés ----------
  function trailTitle(p) {
    const n = p[`name:${lang}`] || p.name;
    if (n) return n;
    if (p.ref && /^\d/.test(p.ref)) return t('caiTrail').replace('{ref}', p.ref);
    if (p.ref === 'SI') return 'Sentiero Italia CAI';
    if (p.from && p.to) return `${p.from} – ${p.to}`;
    return p.ref || t('unnamed');
  }
  const trailTip = (x) => `<span class="trail-tip">${esc(x.p.ref ? x.p.ref + ' · ' : '')}${esc(x.title)}</span>`;

  function initTrails(fc) {
    state.trails = fc.features.map((f) => {
      const p = f.properties;
      const net = NETS[p.network] ? p.network : 'lwn';
      const color = NETS[net].color;
      const latlngs = ll(f.geometry.coordinates);
      const casing = L.polyline(latlngs, { pane: 'trails', color: '#fff', weight: 8, opacity: .9, interactive: false });
      const line = L.polyline(latlngs, { pane: 'trails', color, weight: 4, opacity: .95, lineCap: 'round' });
      const x = { id: p.osm, p, net, color, title: trailTitle(p), km: lengthOf(f.geometry.coordinates) / 1000,
        casing, line, group: L.layerGroup([casing, line]), coords: f.geometry.coordinates };
      line.bindTooltip(trailTip(x), { sticky: true });
      line.on('mouseover', () => { if (state.selTrail !== x) line.setStyle({ weight: 7 }); });
      line.on('mouseout', () => { if (state.selTrail !== x) line.setStyle({ weight: 4 }); });
      line.on('click', (e) => { L.DomEvent.stop(e); selectTrail(x, false); });
      return x;
    }).sort((a, b) => NETS[a.net].order - NETS[b.net].order
      || (parseInt(a.p.ref) || 9999) - (parseInt(b.p.ref) || 9999) || a.title.localeCompare(b.title));

    $('#nTrails').textContent = state.trails.length;
    $('#nets').addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      const k = b.dataset.net;
      state.nets.has(k) ? state.nets.delete(k) : state.nets.add(k);
      renderNetChips(); renderTrails();
    });
    $('#qt').addEventListener('input', renderTrails);
    map.on('click', () => selectTrail(null));
    renderNetChips(); renderTrails();
  }

  function renderNetChips() {
    const counts = {};
    state.trails.forEach((x) => { counts[x.net] = (counts[x.net] || 0) + 1; });
    $('#nets').innerHTML = Object.entries(NETS).filter(([k]) => counts[k]).map(([k, n]) =>
      `<button class="chip ${state.nets.has(k) ? '' : 'off'}" data-net="${k}"><span class="dot" style="background:${n.color}"></span>${esc(T().nets[k])} <small>${counts[k]}</small></button>`).join('');
  }

  function renderTrails() {
    const q = norm($('#qt').value);
    const vis = state.trails.filter((x) => state.nets.has(x.net)
      && (!q || norm([x.title, x.p.name, x.p.ref, x.p.from, x.p.to, x.p.description].join(' ')).includes(q)));
    layers.trails.clearLayers();
    // les sentiers locaux d'abord, les grands itinéraires par-dessus
    [...vis].reverse().forEach((x) => layers.trails.addLayer(x.group));
    if (state.selTrail) state.selTrail.group.eachLayer((l) => l.bringToFront());
    $('#trailList').innerHTML = vis.length ? vis.map((x) => `
      <li data-id="${x.id}" class="${state.selTrail === x ? 'sel' : ''}">
        <span class="ref" style="background:${x.color}">${esc(x.p.ref || '—')}</span>
        <div><div class="t">${esc(x.title)}</div>
        <div class="m">${km(x.km)} km${x.p.cai_scale ? ' · ' + esc(x.p.cai_scale) : ''} · ${esc(T().nets[x.net])}</div></div>
      </li>`).join('') : `<li class="empty">${esc(t('noTrail'))}</li>`;
  }
  $('#trailList').addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]'); if (!li) return;
    selectTrail(state.trails.find((x) => x.id === li.dataset.id), true);
  });

  function selectTrail(sel, fit) {
    const prev = state.selTrail;
    state.selTrail = sel || null;
    state.trails.forEach((x) => {
      const dim = sel && x !== sel;
      x.line.setStyle({ weight: x === sel ? 7 : 4, opacity: dim ? .3 : .95 });
      x.casing.setStyle({ weight: x === sel ? 12 : 8, opacity: dim ? .2 : .9, color: x === sel ? '#111' : '#fff' });
    });
    if (!sel) {
      $('#trailDetail').hidden = true;
      if (prev) { document.querySelectorAll('#trailList li.sel').forEach((li) => li.classList.remove('sel')); setHash(''); }
      return;
    }
    sel.casing.bringToFront(); sel.line.bringToFront();
    if (fit) map.fitBounds(sel.line.getBounds(), { padding: [40, 40] });
    showTab('trails');
    const p = sel.p;
    const row = (k, v) => (v ? `<span>${esc(t(k))} <b>${esc(v)}</b></span>` : '');
    $('#trailDetail').innerHTML = `
      <button class="close" aria-label="${esc(t('close'))}">✕</button>
      <h3>${esc(p.ref ? p.ref + ' · ' : '')}${esc(sel.title)}</h3>
      <div class="row">${row('length', km(sel.km) + ' km')}${row('difficulty', T().cai[p.cai_scale] || p.cai_scale)}
        ${row('duration', p.duration)}${row('ascent', p.ascent && p.ascent + ' m')}</div>
      <div class="row">${row('from', p.from)}${row('to', p.to)}${row('network', T().nets[sel.net])}</div>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      <div class="actions">
        <a href="https://hiking.waymarkedtrails.org/#route?id=${p.osm.split('/')[1]}" target="_blank" rel="noopener">${esc(t('profile'))} ↗</a>
        <a href="https://www.openstreetmap.org/${p.osm}" target="_blank" rel="noopener">${esc(t('viewOsm'))} ↗</a>
        ${p.website ? `<a href="${esc(p.website)}" target="_blank" rel="noopener">${esc(t('website'))} ↗</a>` : ''}
        <a class="report" href="${noteUrl(sel.line.getCenter().lat, sel.line.getCenter().lng)}" target="_blank" rel="noopener">⚑ ${esc(t('report'))}</a>
      </div>`;
    $('#trailDetail').hidden = false;
    $('#trailDetail .close').onclick = () => selectTrail(null);
    document.querySelectorAll('#trailList li').forEach((li) => li.classList.toggle('sel', li.dataset.id === sel.id));
    document.querySelector(`#trailList li[data-id="${sel.id}"]`)?.scrollIntoView({ block: 'nearest' });
    setHash('trail=' + sel.id);
  }

  function trailsNear(lon, lat, m = 250) {
    return state.trails.filter((x) => x.coords.some((part) => part.some((c) => Math.abs(c[1] - lat) < .005 && dist(c, [lon, lat]) < m)));
  }

  // ---------- Points d'intérêt ----------
  function poiTitle(p) {
    return p[`name:${lang}`] || p.name || p['name:it'] || p['name:sl'] || catLabel(p.cat, true);
  }

  function initPois(fc) {
    state.pois = fc.features.filter((f) => CATS[f.properties.cat]).map((f) => {
      const p = f.properties, c = CATS[p.cat];
      const [lon, lat] = f.geometry.coordinates;
      const icon = L.divIcon({ className: '', iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -12],
        html: `<div class="poi-marker" style="background:${c.color};color:#fff">${c.icon}</div>` });
      const x = { id: p.osm, p, lat, lon, title: poiTitle(p) };
      x.marker = L.marker([lat, lon], { icon, title: x.title, riseOnHover: true });
      x.marker.bindPopup(() => popupHtml(x), { maxWidth: 300 });
      x.marker.on('popupopen', () => setHash('poi=' + x.id));
      return x;
    });

    $('#nPois').textContent = state.pois.length;
    $('#cats').addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      const k = b.dataset.cat;
      if (e.detail === 2) state.cats = new Set([k]); // double-clic : seulement cette catégorie
      else state.cats.has(k) ? state.cats.delete(k) : state.cats.add(k);
      renderCatChips(); renderPois();
    });
    $('#q').addEventListener('input', renderPois);
    renderCatChips(); renderPois();
  }

  function renderCatChips() {
    const counts = {};
    state.pois.forEach((x) => { counts[x.p.cat] = (counts[x.p.cat] || 0) + 1; });
    $('#cats').innerHTML = Object.entries(CATS).filter(([k]) => counts[k]).map(([k, c]) =>
      `<button class="chip ${state.cats.has(k) ? '' : 'off'}" data-cat="${k}"><span class="dot" style="background:${c.color}"></span>${esc(catLabel(k))} <small>${counts[k]}</small></button>`).join('');
  }

  function renderPois() {
    const q = norm($('#q').value);
    const vis = state.pois.filter((x) => state.cats.has(x.p.cat)
      && (!q || norm([x.title, x.p.name, x.p['name:sl'], x.p['name:it'], x.p.description, catLabel(x.p.cat)].join(' ')).includes(q)))
      .sort((a, b) => (a.p.name ? 0 : 1) - (b.p.name ? 0 : 1) || a.title.localeCompare(b.title, lang));
    layers.pois.clearLayers();
    vis.forEach((x) => layers.pois.addLayer(x.marker));
    $('#poiList').innerHTML = vis.length ? vis.map((x) => {
      const c = CATS[x.p.cat];
      const other = [x.p.name, x.p['name:sl'], x.p['name:it']].find((n) => n && n !== x.title);
      const sub = [catLabel(x.p.cat, true), x.p.ele && `${Math.round(x.p.ele)} m`, other].filter(Boolean).join(' · ');
      return `<li data-id="${x.id}"><span class="ico" style="background:${c.color}">${c.icon}</span>
        <div><div class="t">${esc(x.title)}</div><div class="m">${esc(sub)}</div></div></li>`;
    }).join('') : `<li class="empty">${esc(t('noResult'))}</li>`;
  }
  $('#poiList').addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]'); if (!li) return;
    openPoi(state.pois.find((x) => x.id === li.dataset.id));
  });

  function openPoi(x) {
    if (!x) return;
    if (state.selTrail) selectTrail(null);
    if (!layers.pois.hasLayer(x.marker)) layers.pois.addLayer(x.marker);
    map.flyTo([x.lat, x.lon], Math.max(map.getZoom(), 15), { duration: .6 });
    map.once('moveend', () => x.marker.openPopup());
    if (window.innerWidth <= 760) $('#panel').classList.add('collapsed');
  }

  // Dates OSM « 2024-06-15 » ou « 2024-06 » → format local
  function fmtDate(v) {
    if (!v || !/^\d{4}-\d{2}(-\d{2})?$/.test(v)) return v ? esc(v) : '';
    const [y, m, d] = v.split('-').map(Number);
    const opts = d ? { day: 'numeric', month: 'long', year: 'numeric' } : { month: 'long', year: 'numeric' };
    return esc(new Date(y, m - 1, d || 1).toLocaleDateString(locale(), opts));
  }

  function popupHtml(x) {
    const p = x.p, c = CATS[p.cat];
    const alt = [...new Set([p.name, p['name:sl'], p['name:it']].filter((n) => n && n !== x.title))];
    const dd = (k, v) => (v ? `<dt>${esc(t(k))}</dt><dd>${v}</dd>` : '');
    const web = p.website || p['contact:website'] || p.url;
    const phone = p.phone || p['contact:phone'];
    const wiki = p.wikipedia && p.wikipedia.split(':');
    const near = trailsNear(x.lon, x.lat);
    return `<div class="pop">
      <h4>${esc(x.title)}</h4>
      ${alt.length ? `<div class="alt">${esc(alt.join(' / '))}</div>` : ''}
      ${x.title !== catLabel(p.cat, true) ? `<span class="tag" style="background:${c.color}">${esc(catLabel(p.cat, true))}</span>` : ""}
      <dl>
        ${dd('altitude', p.ele && esc(Math.round(p.ele)) + ' m')}
        ${dd('type', esc(p.historic?.replace(/_/g, ' ') || ''))}
        ${dd('hours', esc(p.opening_hours || ''))}
        ${dd('cuisine', esc(p.cuisine?.replace(/;/g, ', ') || ''))}
        ${dd('phone', phone && `<a href="tel:${esc(phone)}">${esc(phone)}</a>`)}
        ${dd('drinking', p.potable === 'yes' ? `<span class="dw-yes">${esc(t('drinkingYes'))}</span>`
    : p.potable === 'no' ? `<strong class="dw-no">${esc(t('drinkingNo'))}</strong>` : '')}
        ${dd('checked', fmtDate(p['check_date:drinking_water'] || p.check_date))}
        ${dd('inscription', esc(p.inscription || ''))}
        ${dd('fee', p.fee === 'yes' ? esc(t('yes')) : p.fee === 'no' ? esc(t('no')) : '')}
        ${dd('capacity', esc(p.capacity || ''))}
        ${dd('lines', esc(p.route_ref?.replace(/;/g, ', ') || ''))}
        ${dd('trails', near.length ? near.slice(0, 6).map((n) => `<a href="#trail=${n.id}" style="color:${n.color}">${esc(n.p.ref || n.title)}</a>`).join(', ') : '')}
      </dl>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      ${p.cat === 'water' || p.cat === 'drinking' ? `<p class="water-note">⚠ ${esc(t('waterNote'))}</p>` : ''}
      <div class="links">
        <a href="https://www.openstreetmap.org/directions?to=${x.lat},${x.lon}" target="_blank" rel="noopener">${esc(t('directions'))} ↗</a>
        ${web ? `<a href="${esc(web)}" target="_blank" rel="noopener">${esc(t('website'))} ↗</a>` : ''}
        ${wiki ? `<a href="https://${esc(wiki[0])}.wikipedia.org/wiki/${esc(encodeURIComponent(wiki.slice(1).join(':')))}" target="_blank" rel="noopener">Wikipedia ↗</a>` : ''}
        ${p.cat === 'bus' ? `<a href="${I.TIMETABLE_URL}" target="_blank" rel="noopener">${esc(t('timetable'))} ↗</a>` : ''}
        <a href="https://www.openstreetmap.org/${p.osm}" target="_blank" rel="noopener">OSM ↗</a>
        <a class="report" href="${noteUrl(x.lat, x.lon)}" target="_blank" rel="noopener">⚑ ${esc(t('report'))}</a>
      </div></div>`;
  }

  // ---------- Onglets, lien profond, mobile ----------
  function showTab(name) {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tabpane').forEach((s) => s.classList.toggle('active', s.id === 'tab-' + name));
  }
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $('#togglePanel').addEventListener('click', () => { $('#panel').classList.toggle('collapsed'); setTimeout(() => map.invalidateSize(), 250); });

  let hashLock = false;
  function setHash(h) {
    hashLock = true;
    history.replaceState(null, '', location.pathname + location.search + (h ? '#' + h : ''));
    setTimeout(() => { hashLock = false; });
  }
  function applyHash() {
    const m = location.hash.match(/^#(poi|trail)=(.+)$/); if (!m) return;
    if (m[1] === 'trail') selectTrail(state.trails.find((x) => x.id === m[2]), true);
    else openPoi(state.pois.find((x) => x.id === m[2]));
  }
  window.addEventListener('hashchange', () => { if (!hashLock) applyHash(); });
})();
