import { Injectable, computed, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { I18nService } from '../i18n/i18n.service';
import { Coord, profile } from '../geo/geo';
import { MAX_POINTS, PlanResult, RouteOptions, Router, createRouter, decodeRoute, encodeRoute } from '../geo/router';

/** Tracé importé d'un GPX : [lon, lat, altitude|null, SAC] */
type ImportedRoute = { coords: Coord[]; name: string };

/**
 * Traceur d'itinéraire : étapes, options, résultat, GPX. Le calcul est dans geo/router.ts (pur, testé) ;
 * rien n'est envoyé, le tracé vit dans le lien de la page (#route=…).
 */
@Injectable({ providedIn: 'root' })
export class RouteService {
  private readonly i18n = inject(I18nService);
  private readonly snack = inject(MatSnackBar);

  readonly options = signal<Required<RouteOptions>>({ marked: false, alpine: false });
  /** carrefours du graphe choisis comme étapes */
  readonly points = signal<number[]>([]);
  readonly result = signal<PlanResult | null>(null);
  readonly imported = signal<ImportedRoute | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  private router: Router | null = null;
  private graph: Promise<Router> | null = null;

  /** Tracé affiché : l'import s'il y en a un, sinon le calcul */
  readonly coords = computed<Coord[]>(() => this.imported()?.coords ?? (this.result()?.coords as Coord[] | undefined) ?? []);
  readonly profile = computed(() => (this.coords().length > 1 ? profile(this.coords()) : null));
  readonly maxSac = computed(() => (this.imported() ? 0 : this.result()?.maxSac ?? 0));
  readonly failed = computed(() => !this.imported() && !!this.result()?.failed);
  /** Position [lon, lat] de chaque étape (pour les épingles) */
  readonly pins = computed(() => { this.result(); const r = this.router; return r ? this.points().map((i) => r.lonLat(i)) : []; });
  /** Étapes introuvables : [de, à] en [lon, lat] (trait pointillé) */
  readonly gaps = computed(() => {
    const res = this.result(), r = this.router, pts = this.points();
    if (!res || !r) return [];
    return res.legs.flatMap((leg, i) => (leg ? [] : [[r.lonLat(pts[i]), r.lonLat(pts[i + 1])]]));
  });
  /** Texte du lien partageable (vide sans étape) */
  readonly hash = computed(() => {
    const r = this.router, pts = this.points();
    return r && pts.length && !this.imported() ? encodeRoute(pts.map((i) => r.lonLat(i)), this.options()) : '';
  });

  /** Graphe des chemins (data/graph.json), chargé à la première utilisation du traceur. */
  load(): Promise<Router> {
    if (!this.graph) {
      this.loading.set(true); this.loadError.set(false);
      this.graph = fetch('data/graph.json').then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then((raw) => { this.router = createRouter(raw); this.loading.set(false); return this.router; })
        .catch((err) => { this.graph = null; this.loading.set(false); this.loadError.set(true); throw err; }); // nouvel essai au prochain clic
    }
    return this.graph;
  }

  private recompute(): void {
    this.result.set(this.router ? this.router.plan(this.points(), this.options()) : null);
  }
  private toast(key: string): void { this.snack.open(this.i18n.t(key), undefined, { duration: 4000 }); }

  /** Ajoute une étape au point le plus proche d'un chemin autorisé. Renvoie false si impossible. */
  async add(lat: number, lon: number): Promise<boolean> {
    if (this.imported()) this.clear();
    let r: Router;
    try { r = await this.load(); } catch { this.toast('routeLoadError'); return false; }
    const s = r.snap(lon, lat, this.options());
    if (s < 0) { this.toast('routeNoPath'); return false; }
    if (this.points().length >= MAX_POINTS) return false;
    this.points.update((p) => [...p, s]);
    this.recompute();
    return true;
  }
  move(i: number, lat: number, lon: number): void {
    const s = this.router?.snap(lon, lat, this.options()) ?? -1;
    if (s >= 0) this.points.update((p) => p.map((x, j) => (j === i ? s : x)));
    this.recompute();
  }
  remove(i: number): void { this.points.update((p) => p.filter((_, j) => j !== i)); this.recompute(); }
  undo(): void { this.points.update((p) => p.slice(0, -1)); this.recompute(); }
  clear(): void { this.points.set([]); this.result.set(null); this.imported.set(null); }

  /** Changement d'option : les étapes sont recalées sur les chemins encore autorisés. */
  setOption(k: keyof RouteOptions, v: boolean): void {
    this.options.update((o) => ({ ...o, [k]: v }));
    const r = this.router; if (!r || !this.points().length) return;
    this.points.update((p) => p.map((i) => r.snap(...r.lonLat(i), this.options())).filter((i) => i >= 0));
    this.recompute();
  }

  /** Lien partageable (#route=…) : étapes et options. Renvoie les [lon, lat] des étapes retrouvées. */
  async fromHash(text: string): Promise<number[][]> {
    const { lonLats, options } = decodeRoute(text);
    this.options.set(options);
    const r = await this.load();
    this.imported.set(null);
    this.points.set(lonLats.map(([x, y]) => r.snap(x, y, options)).filter((i) => i >= 0));
    this.recompute();
    return this.points().map((i) => r.lonLat(i));
  }

  // ---------- GPX ----------
  exportGpx(): void {
    const coords = this.coords();
    if (coords.length < 2) return;
    const x = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
    const name = this.imported()?.name ?? this.i18n.t('routeName');
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

  /** Import d'un GPX : lu uniquement dans le navigateur, jamais envoyé. Renvoie le tracé ou null. */
  async importGpx(file: File): Promise<Coord[] | null> {
    try {
      if (file.size > 10e6) throw new Error('size');
      const doc = new DOMParser().parseFromString(await file.text(), 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error('xml');
      const pts: Coord[] = [...doc.querySelectorAll('trkpt, rtept')].map((p) => {
        const ele = parseFloat(p.querySelector('ele')?.textContent ?? '');
        return [parseFloat(p.getAttribute('lon') ?? ''), parseFloat(p.getAttribute('lat') ?? ''), Number.isFinite(ele) ? ele : null, 0] as Coord;
      }).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[1]) <= 90 && Math.abs(p[0]) <= 180);
      if (pts.length < 2) throw new Error('empty');
      const name = (doc.querySelector('trk > name, metadata > name')?.textContent || file.name).slice(0, 100);
      this.points.set([]); this.result.set(null);
      this.imported.set({ coords: pts, name });
      return pts;
    } catch {
      this.toast('importError');
      return null;
    }
  }
}
