import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const KEY = 'ododino.favs'; // même clé que la version actuelle : les favoris déjà enregistrés sont repris

/** Favoris (lieux et sentiers, par identifiant OSM), gardés seulement dans ce navigateur. */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly ids = signal<ReadonlySet<string>>(new Set());

  constructor() {
    if (!this.browser) return;
    try {
      const list = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(list)) this.ids.set(new Set(list.filter((x) => typeof x === 'string')));
    } catch { /* stockage indisponible ou illisible */ }
  }

  has(id: string): boolean { return this.ids().has(id); }

  toggle(id: string): void {
    const next = new Set(this.ids());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.ids.set(next);
    if (this.browser) { try { localStorage.setItem(KEY, JSON.stringify([...next])); } catch { /* stockage indisponible */ } }
  }
}
