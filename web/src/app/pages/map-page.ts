import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {
  ChangeDetectionStrategy, Component, PLATFORM_ID, afterNextRender, computed, effect, inject, signal, untracked, viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nService } from '../i18n/i18n.service';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../map/data.service';
import { Legend } from '../map/legend';
import { MapStateService, Tab } from '../map/map-state.service';
import { MapView } from '../map/map-view';
import { SelectionCard } from '../map/selection-card';
import { DiscoverTab } from '../map/panel/discover-tab';
import { PoisTab } from '../map/panel/pois-tab';
import { TrailsTab } from '../map/panel/trails-tab';
import { RouteTab } from '../map/panel/route-tab';
import { OfflineTab } from '../offline/offline-tab';
import { RouteService } from '../map/route.service';

const TABS: Tab[] = ['discover', 'pois', 'trails', 'route', 'offline'];

/**
 * Page principale : panneau à onglets + carte. Sur téléphone, la carte occupe tout l'écran et le panneau
 * devient un tiroir (aperçu, moitié, plein écran) qu'on tape ou fait glisser par sa poignée.
 */
@Component({
  selector: 'odo-map-page',
  imports: [MatSidenavModule, MatTabsModule, MatButtonModule, MatCardModule, MatDividerModule, MatTooltipModule, RouterLink, MatIconModule, MapView, Legend, SelectionCard, DiscoverTab, PoisTab, TrailsTab, RouteTab, OfflineTab],
  templateUrl: './map-page.html',
  styleUrl: './map-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPage {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(MapStateService);
  private readonly data = inject(DataService);
  private readonly route = inject(RouteService);
  private readonly activated = inject(ActivatedRoute);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly mapView = viewChild(MapView);
  protected readonly tabIndex = computed(() => TABS.indexOf(this.state.tab()));
  protected readonly tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'discover', icon: 'explore', label: 'tabDiscover' }, { key: 'pois', icon: 'location_on', label: 'tabPois' },
    { key: 'trails', icon: 'hiking', label: 'tabTrails' }, { key: 'route', icon: 'route', label: 'tabRoute' },
    { key: 'offline', icon: 'download', label: 'offline' },
  ];
  /** Avertissement de sécurité fermé (localStorage « ododino.safetyOk ») : lu après l'affichage, pour que la
   *  page pré-rendue et celle du navigateur partent du même état */
  protected readonly safetyOk = signal(true);
  /** date des données OSM (data/meta.json) */
  protected readonly updated = computed(() => {
    const u = this.data.updated(); return u ? new Date(u).toLocaleDateString(this.i18n.locale()) : '';
  });
  protected dismissSafety(): void {
    this.safetyOk.set(true);
    try { localStorage.setItem('ododino.safetyOk', '1'); } catch { /* stockage indisponible */ }
  }

  constructor() {
    afterNextRender(() => {
      try { this.safetyOk.set(!!localStorage.getItem('ododino.safetyOk')); } catch { this.safetyOk.set(false); }
    });
    // Liens profonds de la version actuelle : #poi=node/…, #trail=relation/…, #route=lon,lat;…&o=…
    effect(() => {
      if (!this.data.loaded()) return;
      untracked(() => {
        // fragment du routeur : à jour même quand on arrive d'une fiche (« Voir sur la carte »)
        const m = ('#' + (this.activated.snapshot.fragment ?? '')).match(/^#(poi|trail|route)=(.+)$/);
        if (!m) return;
        if (m[1] === 'route') {
          this.state.tab.set('route');
          this.route.fromHash(decodeURIComponent(m[2])).then((pts) => this.state.map?.fitCoords(pts)).catch(() => undefined);
        } else this.state.open(decodeURIComponent(m[2]));
      });
    });
    // L'adresse suit l'état : l'itinéraire s'il y en a un, sinon le lieu ou le sentier choisi
    effect(() => {
      const s = this.state.selection(), r = this.route.hash();
      if (!this.browser || !this.data.loaded()) return;
      const h = r ? `#route=${r}` : s ? `#${s.kind}=${s.item.id}` : '';
      if (location.hash !== h) history.replaceState(history.state, '', location.pathname + location.search + h);
    });
    // la carte change de taille quand le panneau passe à côté / par-dessus : Leaflet doit le savoir
    effect(() => { this.state.handset(); setTimeout(() => this.mapView()?.invalidate(), 300); });
  }

  protected setTab(i: number): void {
    this.state.tab.set(TABS[i]);
  }
}
