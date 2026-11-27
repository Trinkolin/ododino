import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PACK_CACHE } from './pack';

/** Liste du pack, écrite au build par scripts/prepare.mjs : [chemin, octets] */
export interface PackManifest { version: string; bytes: number; files: [string, number][] }
/** Pack présent sur l'appareil (localStorage « ododino.offline », décrit dans la page de confidentialité) */
export interface PackSaved { at: number; version: string; files: number }

const KEY = 'ododino.offline';

/**
 * Pack hors ligne : fond vectoriel, relief, données, graphe du traceur, profils, GPX. Téléchargé seulement à la
 * demande, gardé dans Cache Storage (PACK_CACHE) et lu par packFetch / packBasemap quand le réseau manque.
 */
@Injectable({ providedIn: 'root' })
export class OfflineService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly supported = this.browser && 'caches' in window && window.isSecureContext;
  readonly online = signal(this.browser ? navigator.onLine : true);
  readonly saved = signal<PackSaved | null>(this.read());
  /** undefined : pas encore lu ; null : introuvable (pas de pack pour cette version du site) */
  readonly manifest = signal<PackManifest | null | undefined>(undefined);
  readonly busy = signal(false);
  /** octets téléchargés pendant le téléchargement */
  readonly done = signal(0);

  constructor() {
    if (!this.browser) return;
    const on = () => this.online.set(true), off = () => this.online.set(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    inject(DestroyRef).onDestroy(() => { window.removeEventListener('online', on); window.removeEventListener('offline', off); });
  }

  async loadManifest(): Promise<PackManifest | null> {
    if (this.manifest() === undefined) {
      const m = await fetch('data/offline-files.json', { cache: 'no-store' })
        .then((r) => (r.ok ? (r.json() as Promise<PackManifest>) : null)).catch(() => null);
      this.manifest.set(m);
    }
    return this.manifest() ?? null;
  }

  /** Télécharge tout le pack (4 fichiers à la fois, 3 essais chacun). Renvoie true si tout est arrivé. */
  async download(): Promise<boolean> {
    const m = await this.loadManifest();
    if (!m || this.busy()) return false;
    this.busy.set(true); this.done.set(0);
    try {
      const cache = await caches.open(PACK_CACHE);
      const queue = [...m.files];
      const worker = async (): Promise<void> => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          const [path, size] = next;
          // une connexion qui coupe en cours de route est fréquente en montagne
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
          this.done.update((d) => d + size);
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      this.write({ at: Date.now(), version: m.version, files: m.files.length });
      return true;
    } catch {
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  async remove(): Promise<void> {
    await caches.delete(PACK_CACHE);
    this.write(null);
  }

  private read(): PackSaved | null {
    if (!this.browser) return null;
    try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; }
  }
  private write(v: PackSaved | null): void {
    this.saved.set(v);
    try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch { /* indisponible */ }
  }
}
