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

  /** Valeur brute (texte, liste, objet) ; clé pointée possible. Repli sur l'italien. */
  raw(key: string): unknown {
    const get = (l: Lang): unknown => key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], I18N.messages[l]);
    return get(this.lang()) ?? get('it');
  }

  /** Texte traduit ; clé pointée possible (« nets.iwn »). Repli sur l'italien, puis sur la clé. */
  t(key: string): string {
    const v = this.raw(key);
    return typeof v === 'string' ? v : key;
  }

  /** Nom d'une catégorie de lieux : pluriel (filtres) ou singulier (un lieu). */
  cat(k: string, one = false): string {
    const v = this.raw(`cats.${k}`);
    return Array.isArray(v) ? String(v[one ? 1 : 0]) : k;
  }

  /** Nombre au format de la langue (1 645 m / 1.645 m). */
  num(v: number, digits = 0): string {
    return v.toLocaleString(this.locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
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
