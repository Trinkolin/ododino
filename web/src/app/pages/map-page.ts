import {
  ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject, untracked, viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { I18nService } from '../i18n/i18n.service';
import { Icon } from '../shell/icon';
import { DataService } from '../map/data.service';
import { Legend } from '../map/legend';
import { MapStateService, Sheet, Tab } from '../map/map-state.service';
import { MapView } from '../map/map-view';
import { SelectionCard } from '../map/selection-card';
import { DiscoverTab } from '../map/panel/discover-tab';
import { PoisTab } from '../map/panel/pois-tab';
import { TrailsTab } from '../map/panel/trails-tab';
import { RouteTab } from '../map/panel/route-tab';
import { RouteService } from '../map/route.service';

const TABS: Tab[] = ['discover', 'pois', 'trails', 'route', 'offline'];
const SHEETS: Sheet[] = ['peek', 'half', 'full'];

/**
 * Page principale : panneau à onglets + carte. Sur téléphone, la carte occupe tout l'écran et le panneau
 * devient un tiroir (aperçu, moitié, plein écran) qu'on tape ou fait glisser par sa poignée.
 */
@Component({
  selector: 'odo-map-page',
  imports: [MatTabsModule, Icon, MapView, Legend, SelectionCard, DiscoverTab, PoisTab, TrailsTab, RouteTab],
  templateUrl: './map-page.html',
  styleUrl: './map-page.scss',
  host: { '[class]': '"sheet-" + state.sheet()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPage {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(MapStateService);
  private readonly data = inject(DataService);
  private readonly route = inject(RouteService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly mapView = viewChild(MapView);
  protected readonly tabIndex = computed(() => TABS.indexOf(this.state.tab()));

  constructor() {
    // Liens profonds de la version actuelle : #poi=node/…, #trail=relation/…, #route=lon,lat;…&o=…
    effect(() => {
      if (!this.data.loaded()) return;
      untracked(() => {
        const m = location.hash.match(/^#(poi|trail|route)=(.+)$/);
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
    // la carte change de taille quand le tiroir bouge : Leaflet doit le savoir
    effect(() => { this.state.sheet(); setTimeout(() => this.mapView()?.invalidate(), 260); });
  }

  protected setTab(i: number): void {
    this.state.tab.set(TABS[i]);
    if (this.state.sheet() === 'peek') this.state.setSheet('half');
  }

  // ---------- Poignée du tiroir : tap = état suivant, glisser = hauteur libre puis état le plus proche ----------
  private drag: { y0: number; h0: number; moved: boolean; panel: HTMLElement } | null = null;
  protected handleDown(e: PointerEvent): void {
    if (!this.state.isMobile()) return;
    const panel = (e.currentTarget as HTMLElement).closest('.panel') as HTMLElement;
    this.drag = { y0: e.clientY, h0: panel.getBoundingClientRect().height, moved: false, panel };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    panel.classList.add('dragging');
  }
  protected handleMove(e: PointerEvent): void {
    const d = this.drag; if (!d) return;
    const dy = d.y0 - e.clientY;
    if (Math.abs(dy) > 6) d.moved = true;
    d.panel.style.height = `${Math.max(96, Math.min(innerHeight - 48, d.h0 + dy))}px`;
  }
  protected handleUp(): void {
    const d = this.drag; if (!d) return;
    this.drag = null;
    d.panel.classList.remove('dragging');
    const r = d.panel.getBoundingClientRect().height / innerHeight;
    d.panel.style.height = '';
    if (!d.moved) this.state.sheet.set(SHEETS[(SHEETS.indexOf(this.state.sheet()) + 1) % SHEETS.length]);
    else this.state.sheet.set(r < 0.3 ? 'peek' : r < 0.7 ? 'half' : 'full');
  }
}
