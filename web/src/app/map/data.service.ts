import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { packFetch } from '../offline/pack';
import { CATS, Cat, Diff, NETS, Net, diffLevel, lengthOf } from './config';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Props = Record<string, any>;
export interface Poi { id: string; p: Props; cat: Cat; lat: number; lon: number; star: boolean; }
export interface Trail { id: string; p: Props; net: Net; level: Diff; km: number; coords: number[][][]; }
export interface Featured { slug: string; titles: Record<string, string>; }
export interface CardInfo {
  slug: string; osm: string | null; kind: 'intro' | 'place' | 'trail'; cat: Cat | null; thumb: string | null;
  titles: Record<string, string>; descriptions: Record<string, string>;
}
export interface Geo { type: string; features: { properties: Props; geometry: { type: string; coordinates: any } }[]; }

/**
 * Données de la carte, chargées une fois dans le navigateur (data/*.json, générés par les outils Python).
 * Rien au pré-rendu : la page pré-rendue n'a que le cadre, les listes se remplissent au chargement.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  readonly pois = signal<Poi[]>([]);
  readonly trails = signal<Trail[]>([]);
  readonly boundary = signal<Geo | null>(null);
  readonly paths = signal<Geo | null>(null);
  readonly featured = signal<Record<string, Featured>>({});
  readonly cards = signal<CardInfo[]>([]);
  readonly updated = signal<string | null>(null);
  readonly loaded = signal(false);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) this.load();
  }

  private async load(): Promise<void> {
    const get = <T>(f: string): Promise<T | null> =>
      packFetch(`data/${f}`).then((r) => (r.ok ? (r.json() as Promise<T>) : null)).catch(() => null);
    const [boundary, pois, trails, paths, meta, featured, cards] = await Promise.all([
      get<Geo>('boundary.geojson'), get<Geo>('pois.geojson'), get<Geo>('trails.geojson'), get<Geo>('paths.geojson'),
      get<{ updated?: string }>('meta.json'), get<Record<string, Featured>>('featured.json'), get<CardInfo[]>('cards.json'),
    ]);
    const fav = featured ?? {};
    this.featured.set(fav);
    this.cards.set(cards ?? []);
    this.updated.set(meta?.updated ?? null);
    this.boundary.set(boundary);
    this.paths.set(paths);
    this.trails.set((trails?.features ?? []).map((f) => {
      const p = f.properties;
      const net: Net = p['network'] in NETS ? p['network'] : 'lwn';
      const coords: number[][][] = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
      return { id: p['osm'], p, net, level: diffLevel(p), km: lengthOf(coords) / 1000, coords };
    }).sort((a, b) => NETS[a.net].order - NETS[b.net].order
      || (parseInt(a.p['ref']) || 9999) - (parseInt(b.p['ref']) || 9999)));
    this.pois.set((pois?.features ?? []).filter((f) => f.properties['cat'] in CATS).map((f) => {
      const p = f.properties;
      const [lon, lat] = f.geometry.coordinates;
      return { id: p['osm'], p, cat: p['cat'], lat, lon, star: !!fav[p['osm']] };
    }));
    this.loaded.set(true);
  }
}
