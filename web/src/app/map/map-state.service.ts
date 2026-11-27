import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CATS, Cat, HIDDEN_BY_DEFAULT, NETS, Net, DIFF } from './config';
import { DataService, Poi, Props, Trail } from './data.service';
import { I18nService } from '../i18n/i18n.service';

export type Tab = 'discover' | 'pois' | 'trails' | 'route' | 'offline';
export type Sheet = 'peek' | 'half' | 'full';
export type Selection = { kind: 'poi'; item: Poi } | { kind: 'trail'; item: Trail } | null;

/** Ce que la carte sait faire pour le reste de l'app (fourni par MapView une fois Leaflet prêt). */
export interface MapApi {
  flyTo(lat: number, lon: number, zoom?: number): void;
  fitTrail(t: Trail): void;
  fitHome(): void;
}

/** État partagé de la page carte : onglet, tiroir mobile, filtres, sélection, couleur des sentiers. */
@Injectable({ providedIn: 'root' })
export class MapStateService {
  private readonly i18n = inject(I18nService);
  private readonly data = inject(DataService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly tab = signal<Tab>('discover');
  readonly sheet = signal<Sheet>('half');
  readonly selection = signal<Selection>(null);
  readonly cats = signal<ReadonlySet<Cat>>(new Set((Object.keys(CATS) as Cat[]).filter((k) => !HIDDEN_BY_DEFAULT.includes(k))));
  readonly nets = signal<ReadonlySet<Net>>(new Set(Object.keys(NETS) as Net[]));
  readonly colorBy = signal<'diff' | 'net'>('diff');
  readonly showPaths = signal(true);
  map: MapApi | null = null;

  readonly trailColor = (t: Trail): string => (this.colorBy() === 'diff' ? DIFF[t.level] : NETS[t.net].color);

  readonly isMobile = (): boolean => this.browser && matchMedia('(max-width: 760px)').matches;

  // ---------- Noms (selon la langue courante) ----------
  poiTitle(p: Props): string {
    const l = this.i18n.lang();
    return p[`name:${l}`] || p['name'] || p['name:it'] || p['name:sl'] || this.i18n.cat(p['cat'], true);
  }
  trailTitle(p: Props): string {
    const n = p[`name:${this.i18n.lang()}`] || p['name'];
    if (n) return n;
    if (p['ref'] && /^\d/.test(p['ref'])) return this.i18n.t('caiTrail').replace('{ref}', p['ref']);
    if (p['ref'] === 'SI') return 'Sentiero Italia CAI';
    if (p['from'] && p['to']) return `${p['from']} – ${p['to']}`;
    return p['ref'] || this.i18n.t('unnamed');
  }
  /** Difficulté en clair : cotation CAI, sinon estimation SAC clairement présentée comme telle. */
  diffText(p: Props): string {
    const cai = this.i18n.raw(`cai.${p['cai_scale']}`);
    return (typeof cai === 'string' && cai) || p['cai_scale']
      || (p['sac_max'] ? this.i18n.t('sacEst').replace('{x}', p['sac_max']) : this.i18n.t('notRated'));
  }

  // ---------- Sélection ----------
  readonly selectedId = computed(() => this.selection()?.item.id ?? null);

  selectPoi(item: Poi, move = true): void {
    this.selection.set({ kind: 'poi', item });
    if (move) this.map?.flyTo(item.lat, item.lon, 15);
    this.setSheet('peek');
  }
  selectTrail(item: Trail, fit = true): void {
    this.selection.set({ kind: 'trail', item });
    if (fit) this.map?.fitTrail(item);
    this.setSheet('peek');
  }
  clear(): void { this.selection.set(null); }

  /** Ouvre un lieu ou un sentier par son identifiant OSM (#poi=…, #trail=…, favoris, fiches). */
  open(id: string): void {
    const poi = this.data.pois().find((x) => x.id === id);
    if (poi) { this.selectPoi(poi); return; }
    const trail = this.data.trails().find((x) => x.id === id);
    if (trail) this.selectTrail(trail);
  }

  setSheet(s: Sheet): void { if (this.isMobile()) this.sheet.set(s); }
}
