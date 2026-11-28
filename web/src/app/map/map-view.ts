import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, effect, inject, signal, untracked, viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import type * as Leaflet from 'leaflet';
import { I18nService } from '../i18n/i18n.service';
import { MatIconModule } from '@angular/material/icon';
import { CATS, MINOR, SAC } from './config';
import { DataService } from './data.service';
import { MapStateService } from './map-state.service';
import { RouteService } from './route.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OfflineService } from '../offline/offline.service';
import { packBasemap, packTileLayer } from '../offline/pack';

type LeafletNS = typeof Leaflet;

/**
 * Carte Leaflet : fonds, relief, sentiers, chemins, lieux, position GPS. Créée seulement dans le navigateur
 * (Leaflet a besoin de window) ; le reste de l'app la pilote par MapStateService.map.
 */
@Component({
  selector: 'odo-map-view',
  imports: [MatButtonModule, MatTooltipModule, MatIconModule],
  template: `
    <div #host class="leaflet-host" [attr.aria-label]="i18n.t('map')"></div>
    <div class="tools">
      <button mat-mini-fab class="tool" [class.on]="gpsOn()" (click)="toggleGps()"
        [matTooltip]="i18n.t('locate')" matTooltipPosition="right" [attr.aria-label]="i18n.t('locate')" [attr.aria-pressed]="gpsOn()">
        <mat-icon svgIcon="my_location"></mat-icon></button>
      <button mat-mini-fab class="tool" (click)="state.map?.fitHome()"
        [matTooltip]="i18n.t('recenter')" matTooltipPosition="right" [attr.aria-label]="i18n.t('recenter')">
        <mat-icon svgIcon="fit_screen"></mat-icon></button>
    </div>
  `,
  styles: `
    :host { position: relative; display: block; height: 100%; }
    .leaflet-host { position: absolute; inset: 0; }
    .tools { position: absolute; z-index: 800; top: 84px; left: 10px; display: flex; flex-direction: column; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapView {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(MapStateService);
  private readonly data = inject(DataService);
  private readonly route = inject(RouteService);
  private readonly offline = inject(OfflineService);
  private readonly snack = inject(MatSnackBar);
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  protected readonly gpsOn = signal(false);

  private L!: LeafletNS;
  private map!: Leaflet.Map;
  private readonly ready = signal(false);
  private layerCtl: Leaflet.Control.Layers | null = null;
  private readonly groups: Record<'boundary' | 'paths' | 'trails' | 'pois', Leaflet.LayerGroup> = {} as never;
  private home: Leaflet.LatLngBounds | null = null;
  private profilePoint: Leaflet.CircleMarker | null = null;
  private routeLayer!: Leaflet.LayerGroup;
  private routePins: Leaflet.Marker[] = [];
  private readonly trailLines = new Map<string, { line: Leaflet.Polyline; casing: Leaflet.Polyline; group: Leaflet.LayerGroup }>();
  private readonly markers = new Map<string, Leaflet.Marker>();
  private gps: { watch: number | null; dot?: Leaflet.CircleMarker; ring?: Leaflet.Circle; first: boolean } = { watch: null, first: true };

  constructor() {
    afterNextRender(async () => {
      // Leaflet est un module à l'ancienne (CommonJS) : l'import dynamique le range dans « default »
      const mod = await import('leaflet');
      this.L = ((mod as unknown as { default?: LeafletNS }).default ?? mod) as LeafletNS;
      this.create();
      this.ready.set(true);
    });
    inject(DestroyRef).onDestroy(() => { this.stopGps(); this.map?.remove(); this.state.map = null; });

    // Données chargées → couches ; changements de filtres, couleurs, sélection, langue → mise à jour
    effect(() => { if (this.ready() && this.data.boundary()) untracked(() => this.drawBoundary()); });
    effect(() => { if (this.ready() && this.data.paths()) untracked(() => this.drawPaths()); });
    effect(() => { if (this.ready() && this.data.trails().length) untracked(() => this.drawTrails()); });
    effect(() => { if (this.ready() && this.data.pois().length) untracked(() => this.drawPois()); });
    effect(() => { this.state.nets(); if (this.ready()) untracked(() => this.syncTrailVisibility()); });
    effect(() => { this.state.cats(); if (this.ready()) untracked(() => this.syncPoiVisibility()); });
    effect(() => { this.state.colorBy(); this.state.selection(); if (this.ready()) untracked(() => this.styleTrails()); });
    effect(() => { this.state.selection(); if (this.ready()) untracked(() => { this.markSelected(); this.state.map?.showPoint(null); }); });
    effect(() => { this.state.showPaths(); if (this.ready()) untracked(() => this.syncPaths()); });
    effect(() => { this.i18n.lang(); if (this.ready()) untracked(() => this.buildLayerControl()); });
    // traceur : tracé, épingles ; curseur en croix quand l'onglet « Itinéraire » est ouvert
    effect(() => { this.route.coords(); this.route.pins(); this.route.gaps(); this.i18n.lang(); if (this.ready()) untracked(() => this.drawRoute()); });
    effect(() => { const on = this.state.tab() === 'route'; if (this.ready()) this.map.getContainer().classList.toggle('routing', on); });
    // pack hors ligne : fond vectoriel proposé dans le choix des fonds, et utilisé d'office quand le réseau tombe
    effect(() => { const s = this.offline.saved(); if (this.ready()) untracked(() => this.syncOfflineBase(!!s)); });
    effect(() => { const on = this.offline.online(); if (this.ready()) untracked(() => this.switchBase(on)); });
  }

  // ---------- Création ----------
  private create(): void {
    const L = this.L;
    const map = (this.map = L.map(this.host().nativeElement, { zoomControl: true }).setView([46.165, 13.52], 12));
    this.bases.topo.addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    map.createPane('boundary').style.zIndex = '400';
    map.createPane('paths').style.zIndex = '405';
    map.createPane('trails').style.zIndex = '420';
    map.getPane('boundary')!.style.pointerEvents = 'none';
    for (const k of ['boundary', 'trails', 'pois'] as const) this.groups[k] = L.layerGroup().addTo(map);
    this.groups.paths = L.layerGroup();
    const zoomClass = (): void => {
      map.getContainer().classList.toggle('z-low', map.getZoom() < 14);
      map.getContainer().classList.toggle('z-far', map.getZoom() < 13);
    };
    map.on('zoomend', zoomClass); zoomClass();
    map.on('zoomend', () => this.syncPaths());
    // clic sur la carte : une étape quand l'onglet « Itinéraire » est ouvert, sinon on désélectionne
    map.on('click', (e) => { if (this.state.tab() === 'route') this.route.add(e.latlng.lat, e.latlng.lng); else this.state.clear(); });
    this.routeLayer = L.layerGroup().addTo(map);
    this.buildLayerControl();
    this.state.map = {
      flyTo: (lat, lon, zoom = 15) => map.flyTo([lat, lon], Math.max(map.getZoom(), zoom), { duration: 0.6 }),
      fitTrail: (t) => { const l = this.trailLines.get(t.id); if (l) map.fitBounds(l.line.getBounds(), this.padding(40)); },
      fitHome: () => { if (this.home) map.fitBounds(this.home, this.padding(10)); },
      showPoint: (pt, color = '#0b7285') => {
        if (!pt) { this.profilePoint?.remove(); this.profilePoint = null; return; }
        if (!this.profilePoint) {
          this.profilePoint = L.circleMarker([pt.lat, pt.lon], { radius: 7, color: '#fff', weight: 3, fillColor: color,
            fillOpacity: 1, pane: 'markerPane', interactive: false }).addTo(map);
        } else this.profilePoint.setLatLng([pt.lat, pt.lon]);
      },
      fitCoords: (lonLats) => { if (lonLats.length) map.fitBounds(L.latLngBounds(lonLats.map(([x, y]) => [y, x] as [number, number])), this.padding(40)); },
    };
  }

  /** Marges du cadrage autour du sentier ou des étapes */
  private padding(p: number): Leaflet.FitBoundsOptions {
    return { paddingTopLeft: [p, p], paddingBottomRight: [p, p] };
  }

  private get bases(): Record<'topo' | 'osm' | 'sat', Leaflet.TileLayer> {
    if (!this._bases) {
      const L = this.L;
      this._bases = {
        topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '© OpenStreetMap, SRTM | © OpenTopoMap (CC-BY-SA)' }),
        osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }),
        sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: '© Esri' }),
      };
    }
    return this._bases;
  }
  private _bases?: Record<'topo' | 'osm' | 'sat', Leaflet.TileLayer>;
  private _overlays?: { relief: Leaflet.TileLayer; wmt: Leaflet.TileLayer };

  private buildLayerControl(): void {
    const L = this.L, t = (k: string) => this.i18n.t(k);
    this._overlays ??= {
      // Relief ombré maison (Copernicus GLO-30), tuiles natives jusqu'au zoom 14 puis agrandies
      relief: packTileLayer(L, 'tiles/hillshade/{z}/{x}/{y}.png', { minZoom: 10, maxNativeZoom: 14, maxZoom: 19,
        bounds: [[46.03, 13.35], [46.30, 13.73]], attribution: 'Relief © Copernicus DEM GLO-30 (ESA/EU)' }),
      wmt: L.tileLayer('https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png', { maxZoom: 18, opacity: 0.7, attribution: '© waymarkedtrails.org' }),
    };
    this.layerCtl?.remove();
    this.layerCtl = L.control.layers(
      { [t('baseTopo')]: this.bases.topo, [t('baseOsm')]: this.bases.osm, [t('baseSat')]: this.bases.sat,
        ...(this.offlineBase ? { [t('baseOffline')]: this.offlineBase } : {}) },
      { [t('layerTrails')]: this.groups.trails, [t('layerPois')]: this.groups.pois, [t('layerRelief')]: this._overlays.relief, [t('layerWmt')]: this._overlays.wmt },
      { collapsed: true }).addTo(this.map);
  }

  // ---------- Fond hors ligne ----------
  private offlineBase: Leaflet.Layer | null = null;
  /** fond choisi avant la coupure de réseau, rétabli au retour */
  private baseBefore: Leaflet.Layer | null = null;

  private async syncOfflineBase(present: boolean): Promise<void> {
    if (present && !this.offlineBase) {
      this.offlineBase = await packBasemap(this.L).catch(() => null);
    } else if (!present && this.offlineBase) {
      if (this.map.hasLayer(this.offlineBase)) { this.map.removeLayer(this.offlineBase); this.bases.topo.addTo(this.map); }
      this.offlineBase = null; this.baseBefore = null;
    }
    this.buildLayerControl();
    if (!this.offline.online()) this.switchBase(false);
  }

  private switchBase(online: boolean): void {
    const ob = this.offlineBase;
    if (!ob) return;
    const bases = Object.values(this.bases);
    if (!online && !this.map.hasLayer(ob)) {
      this.baseBefore = bases.find((l) => this.map.hasLayer(l)) ?? this.bases.topo;
      bases.forEach((l) => this.map.removeLayer(l));
      ob.addTo(this.map);
      this.snack.open(this.i18n.t('offlineNow'), undefined, { duration: 4000 });
    } else if (online && this.baseBefore && this.map.hasLayer(ob)) {
      this.map.removeLayer(ob);
      this.baseBefore.addTo(this.map); this.baseBefore = null;
    }
  }

  // ---------- Contour des vallées ----------
  private drawBoundary(): void {
    const L = this.L, all: Leaflet.Polyline[] = [];
    this.groups.boundary.clearLayers();
    for (const f of this.data.boundary()!.features) {
      const gw = !!f.properties['gateway']; // Cividale : contour discret
      const coords = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
      const l = L.polyline(coords.map((p: number[][]) => p.map(([x, y]) => [y, x] as [number, number])), {
        pane: 'boundary', color: gw ? '#868e96' : '#1f4434', weight: gw ? 1.5 : 2, dashArray: gw ? '2 6' : '6 6',
        opacity: gw ? 0.6 : 0.7, interactive: false });
      this.groups.boundary.addLayer(l);
      if (!gw) all.push(l);
    }
    if (all.length) {
      this.home = L.featureGroup(all).getBounds();
      if (!location.hash) this.map.fitBounds(this.home, this.padding(10));
    }
  }

  // ---------- Chemins et pistes (à partir du zoom 14) ----------
  private drawPaths(): void {
    const L = this.L;
    this.groups.paths.clearLayers();
    for (const f of this.data.paths()!.features) {
      const p = f.properties, track = p['hw'] === 'track';
      const l = L.polyline(f.geometry.coordinates.map(([x, y]: number[]) => [y, x] as [number, number]), {
        pane: 'paths', color: track ? '#8a7b66' : '#a0522d', weight: track ? 2 : 1.6, dashArray: track ? undefined : '4 4', opacity: 0.85 });
      l.bindTooltip(() => [p['name'], this.i18n.t(track ? 'track' : 'path'), SAC[p['sac_scale']] && `${this.i18n.t('sac')} ${SAC[p['sac_scale']]}`]
        .filter(Boolean).join(' · '), { sticky: true });
      this.groups.paths.addLayer(l);
    }
    this.syncPaths();
  }
  private syncPaths(): void {
    const on = this.state.showPaths() && this.map.getZoom() >= 14;
    if (on && !this.map.hasLayer(this.groups.paths)) this.groups.paths.addTo(this.map);
    if (!on && this.map.hasLayer(this.groups.paths)) this.map.removeLayer(this.groups.paths);
  }

  // ---------- Sentiers ----------
  private drawTrails(): void {
    const L = this.L;
    this.trailLines.clear();
    for (const tr of this.data.trails()) {
      const latlngs = tr.coords.map((p) => p.map(([x, y]) => [y, x] as [number, number]));
      const casing = L.polyline(latlngs, { pane: 'trails', color: '#fff', weight: 8, opacity: 0.9, interactive: false });
      const line = L.polyline(latlngs, { pane: 'trails', color: this.state.trailColor(tr), weight: 4, opacity: 0.95, lineCap: 'round' });
      line.bindTooltip(() => `${tr.p['ref'] ? tr.p['ref'] + ' · ' : ''}${this.state.trailTitle(tr.p)}`, { sticky: true, className: 'trail-tip' });
      line.on('mouseover', () => { if (this.state.selectedId() !== tr.id) line.setStyle({ weight: 7 }); });
      line.on('mouseout', () => { if (this.state.selectedId() !== tr.id) line.setStyle({ weight: 4 }); });
      line.on('click', (e) => { L.DomEvent.stop(e); this.state.selectTrail(tr, false); });
      this.trailLines.set(tr.id, { line, casing, group: L.layerGroup([casing, line]) });
    }
    this.syncTrailVisibility();
    this.styleTrails();
  }
  private syncTrailVisibility(): void {
    this.groups.trails.clearLayers();
    // les sentiers locaux d'abord, les grands itinéraires par-dessus
    for (const tr of [...this.data.trails()].reverse()) {
      if (this.state.nets().has(tr.net)) this.groups.trails.addLayer(this.trailLines.get(tr.id)!.group);
    }
  }
  private styleTrails(): void {
    const sel = this.state.selection();
    const selId = sel?.kind === 'trail' ? sel.item.id : null;
    for (const tr of this.data.trails()) {
      const l = this.trailLines.get(tr.id); if (!l) continue;
      const dim = !!selId && tr.id !== selId, on = tr.id === selId;
      l.line.setStyle({ color: this.state.trailColor(tr), weight: on ? 7 : 4, opacity: dim ? 0.3 : 0.95 });
      l.casing.setStyle({ weight: on ? 12 : 8, opacity: dim ? 0.2 : 0.9, color: on ? '#111' : '#fff' });
      if (on) { l.casing.bringToFront(); l.line.bringToFront(); }
    }
  }

  // ---------- Lieux ----------
  private drawPois(): void {
    const L = this.L;
    this.markers.clear();
    for (const x of this.data.pois()) {
      const c = CATS[x.cat];
      const icon = L.divIcon({
        className: x.star ? 'is-featured' : MINOR.includes(x.cat) ? 'is-minor' : '',
        iconSize: [26, 26], iconAnchor: [13, 13],
        html: `<div class="poi-marker" style="background:${c.color}">${c.icon}</div>`,
      });
      const m = L.marker([x.lat, x.lon], { icon, title: this.state.poiTitle(x.p), riseOnHover: true, zIndexOffset: x.star ? 500 : 0 });
      m.on('click', () => this.state.selectPoi(x, false));
      this.markers.set(x.id, m);
    }
    this.syncPoiVisibility();
  }
  private syncPoiVisibility(): void {
    this.groups.pois.clearLayers();
    const sel = this.state.selection();
    for (const x of this.data.pois()) {
      // le lieu sélectionné reste visible même si sa catégorie est masquée
      if (this.state.cats().has(x.cat) || (sel?.kind === 'poi' && sel.item.id === x.id)) this.groups.pois.addLayer(this.markers.get(x.id)!);
    }
    this.markSelected();
  }
  private markSelected(): void {
    this.host().nativeElement.querySelectorAll('.leaflet-marker-icon.is-selected').forEach((el) => el.classList.remove('is-selected'));
    const sel = this.state.selection();
    if (sel?.kind !== 'poi') return;
    const m = this.markers.get(sel.item.id);
    if (m && !this.groups.pois.hasLayer(m)) this.groups.pois.addLayer(m);
    // l'élément n'existe qu'une fois le marqueur affiché (après un éventuel déplacement)
    const mark = (): void => { m?.getElement()?.classList.add('is-selected'); };
    mark(); this.map.once('moveend', mark);
  }

  // ---------- Ma position (lue et affichée seulement dans le navigateur) ----------
  protected toggleGps(): void { if (this.gps.watch === null) this.startGps(); else this.stopGps(); }
  private startGps(): void {
    if (!('geolocation' in navigator)) return;
    const L = this.L;
    this.gpsOn.set(true); this.gps.first = true;
    this.gps.watch = navigator.geolocation.watchPosition((pos) => {
      const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude], acc = Math.round(pos.coords.accuracy);
      this.gps.ring ??= L.circle(ll, { radius: acc, color: '#1c7ed6', weight: 1, fillOpacity: 0.12, interactive: false }).addTo(this.map);
      this.gps.dot ??= L.circleMarker(ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#1c7ed6', fillOpacity: 1, pane: 'markerPane' }).addTo(this.map);
      this.gps.dot.setLatLng(ll).bindTooltip(this.i18n.t('youAreHere').replace('{m}', String(acc)));
      this.gps.ring.setLatLng(ll).setRadius(acc);
      if (this.gps.first) { this.map.flyTo(ll, Math.max(this.map.getZoom(), 15), { duration: 0.6 }); this.gps.first = false; }
    }, () => this.stopGps(), { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 });
  }
  private stopGps(): void {
    if (this.gps.watch !== null) navigator.geolocation.clearWatch(this.gps.watch);
    this.gps.dot?.remove(); this.gps.ring?.remove();
    this.gps = { watch: null, first: true };
    this.gpsOn.set(false);
  }

  // ---------- Traceur ----------
  private drawRoute(): void {
    const L = this.L, COLOR = '#0b7285', WARN = '#e03131';
    this.routeLayer.clearLayers();
    const coords = this.route.coords();
    const ll = (c: number[][]) => c.map((p) => [p[1], p[0]] as [number, number]);
    if (coords.length > 1) {
      L.polyline(ll(coords as number[][]), { pane: 'trails', color: '#fff', weight: 10, opacity: 0.9, interactive: false }).addTo(this.routeLayer);
      L.polyline(ll(coords as number[][]), { pane: 'trails', color: COLOR, weight: 5, opacity: 1, interactive: false }).addTo(this.routeLayer);
      // tronçons difficiles (SAC T3 et plus) en rouge
      let run: number[][] = [];
      const flush = () => { if (run.length > 1) L.polyline(ll(run), { pane: 'trails', color: WARN, weight: 5, interactive: false }).addTo(this.routeLayer); run = []; };
      coords.forEach((p, i) => { if (Number(p[3]) >= 3) { if (!run.length && i) run.push(coords[i - 1] as number[]); run.push(p as number[]); } else flush(); });
      flush();
    }
    // étapes introuvables : trait pointillé
    for (const [a, b] of this.route.gaps()) {
      L.polyline([[a[1], a[0]], [b[1], b[0]]], { pane: 'trails', color: WARN, weight: 3, dashArray: '6 8', interactive: false }).addTo(this.routeLayer);
    }
    this.routePins.forEach((m) => m.remove()); this.routePins = [];
    const pins = this.route.pins(), n = pins.length;
    pins.forEach(([x, y], i) => {
      const label = i === 0 ? 'A' : i === n - 1 && n > 1 ? 'B' : String(i);
      const icon = L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 14], html: `<div class="route-pin${i === 0 ? ' start' : ''}">${label}</div>` });
      const m = L.marker([y, x], { icon, draggable: true, autoPan: true, zIndexOffset: 1000 }).addTo(this.map);
      m.on('dragend', () => { const p = m.getLatLng(); this.route.move(i, p.lat, p.lng); });
      // toucher une étape : petite bulle « Retirer » (pas de suppression accidentelle au doigt)
      const btn = L.DomUtil.create('button', 'route-remove');
      btn.type = 'button'; btn.textContent = this.i18n.t('routeRemove');
      L.DomEvent.on(btn, 'click', () => { this.map.closePopup(); this.route.remove(i); });
      m.bindPopup(btn, { closeButton: false, offset: [0, -10] });
      this.routePins.push(m);
    });
  }

  /** Appelé par la page quand la taille de la carte change (tiroir mobile). */
  invalidate(): void { this.map?.invalidateSize(); }
}
