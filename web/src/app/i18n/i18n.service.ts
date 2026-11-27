import { DOCUMENT, Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { I18N } from './messages.generated';

export type Lang = (typeof I18N.langs)[number]['code'];
export const LANGS: readonly Lang[] = I18N.langs.map((l) => l.code);
export const isLang = (x: unknown): x is Lang => typeof x === 'string' && (LANGS as readonly string[]).includes(x);

const LOCALES: Record<Lang, string> = { it: 'it-IT', sl: 'sl-SI', en: 'en-GB', de: 'de-DE', fr: 'fr-FR' };
const STORE = 'ododino.lang'; // même clé que la version actuelle du site

/** Langue courante (tirée de l'adresse /<langue>/…) et traductions, depuis ../i18n.js. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly doc = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly lang = signal<Lang>('it');
  readonly locale = computed(() => LOCALES[this.lang()]);
  readonly langs = I18N.langs;
  readonly contact = I18N.contact;

  constructor() {
    effect(() => { this.doc.documentElement.lang = this.lang(); });
  }

  use(l: Lang): void {
    this.lang.set(l);
    if (this.browser) { try { localStorage.setItem(STORE, l); } catch { /* stockage indisponible */ } }
  }

  /** Texte traduit ; clé pointée possible (« cats.peak »). Repli sur l'italien, puis sur la clé. */
  t(key: string): string {
    const get = (l: Lang): unknown => key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], I18N.messages[l]);
    const v = get(this.lang()) ?? get('it');
    return typeof v === 'string' ? v : key;
  }

  /** Langue préférée du visiteur : celle déjà choisie, sinon celle du navigateur, sinon l'italien. */
  detect(): Lang {
    if (!this.browser) return 'it';
    try { const s = localStorage.getItem(STORE); if (isLang(s)) return s; } catch { /* stockage indisponible */ }
    for (const l of navigator.languages ?? [navigator.language]) {
      const code = l.slice(0, 2).toLowerCase();
      if (isLang(code)) return code;
    }
    return 'it';
  }
}
